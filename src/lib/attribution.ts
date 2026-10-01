/**
 * Sign-up source tracking (web) — first-touch capture, once-after-login sync, and
 * the "How did you hear about us?" prompt. Part of Roger's approved distribution
 * plan (2026-10-01): every new product records where each sign-up came from, from
 * day one, in the standard shape `distribution_facts` (0004_distribution_facts_view
 * .sql.template) reads.
 *
 * SOURCE: generalised from ChannelMover's `lib/attribution.ts` +
 * `hooks/useAttributionSync.ts` (live in production since 2026-08-05/10,
 * `supabase/migrations/20260801004_attribution.sql`). ChannelMover is
 * Google-OAuth-only, so it captures attribution into localStorage BEFORE the OAuth
 * redirect and writes it to the profile once after login. This starter generalises
 * that to also cover plain email sign-up (this starter's own auth flow,
 * src/pages/auth/SignUpPage.tsx) — the capture point is simply "the first page
 * load", which happens before either flow, not specifically before an OAuth click.
 *
 * ALL functions in this file are pure or take their storage as a parameter — no
 * module-level `window`/`localStorage` access — so they run unmodified under
 * `deno test` (tests/attribution/attribution.test.ts) with no jsdom and no Node
 * test toolchain, matching this repo's existing lifecycle-email tests. The
 * default storage (`defaultStorage()`) is resolved lazily, only when a caller
 * does not supply one, which is how the real app uses these functions.
 */

export interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
}

/** The subset of `Attribution` that is written to `profiles` on sync (referrer
 *  included; how_heard/how_heard_other are written separately by the prompt). */
export type AttributionUpdate = Attribution;

/** Minimal shape of the Storage this module needs — satisfied by
 *  `window.localStorage` and by the in-memory mock the tests use. */
export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Profile fields this module reads to decide whether to sync / prompt. Only the
 *  columns from 0003_signup_source_tracking.sql.template that matter for the
 *  decision — callers pass their real Profile type, which is a superset. */
export interface AttributionProfileFields {
  id: string;
  utm_source: string | null;
  how_heard: string | null;
}

const STORAGE_KEY = 'attribution';
const PERSISTED_KEY = 'attribution_persisted';
const HOW_HEARD_DISMISSED_KEY = 'how_heard_dismissed';

const MAX_UTM_LEN = 255;
const MAX_REFERRER_LEN = 500;
const MAX_HOW_HEARD_OTHER_LEN = 255;

const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  referrer: null,
};

/**
 * Options for the one-tap "How did you hear about us?" prompt (plain English,
 * per the plan). Stored verbatim in `profiles.how_heard`; "Other" reveals a
 * free-text field stored in `profiles.how_heard_other`.
 */
export const HOW_HEARD_OPTIONS = [
  'Google',
  'ChatGPT, Claude, or another AI assistant',
  'A directory or review site',
  'Product Hunt, Hacker News, or Reddit',
  'A friend or colleague',
  'Other',
] as const;
export type HowHeardOption = (typeof HOW_HEARD_OPTIONS)[number];

function trimTo(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Resolve the real browser localStorage, or null if unavailable (SSR, private
 *  mode, sandboxed contexts). Never throws. */
export function defaultStorage(): MinimalStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Pure parser (no DOM/globals) — trivially unit-testable.
 * @param search   a `location.search` string, e.g. "?utm_source=newsletter&from=hn"
 * @param referrer an already-filtered referrer (caller strips same-origin values)
 */
export function parseAttribution(search: string, referrer: string): Attribution {
  const params = new URLSearchParams(search || '');
  const get = (key: string) => trimTo(params.get(key), MAX_UTM_LEN);
  return {
    // `?from=` is a lightweight campaign shorthand — only used when no explicit utm_source.
    utm_source: get('utm_source') ?? get('from'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
    referrer: trimTo(referrer, MAX_REFERRER_LEN),
  };
}

/** True when the attribution object carries at least one non-null signal. */
export function hasAnySignal(attribution: Attribution): boolean {
  return Object.values(attribution).some((value) => value != null);
}

/**
 * Extract a bare host from a referrer URL, for grouping ("news.ycombinator.com"
 * rather than every full article URL). Mirrors the SQL function
 * `public.referrer_host` in 0004_distribution_facts_view.sql.template — the two
 * are hand-kept in sync, not generated from one source (see that file's comment).
 * Returns null for anything that doesn't look like a host after stripping the
 * scheme and a leading "www.".
 */
export function extractReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  const withoutScheme = referrer.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const withoutWww = withoutScheme.replace(/^www\./i, '');
  const host = withoutWww.split(/[/?#]/)[0].toLowerCase().trim();
  return host || null;
}

/**
 * Capture first-touch attribution from the current URL + referrer into storage.
 * Safe to call on every page load — first-touch wins, so once stored it is never
 * overwritten. No-op when storage is unavailable or nothing worth storing is
 * present (an organic direct hit).
 *
 * Call this as early as possible on every page — not just a signup page — so it
 * runs before either an OAuth redirect click or an email signup submit. Storage
 * (not a request param) is what survives the OAuth round-trip: the browser is
 * sent away to the provider and back, but localStorage is scoped to this origin
 * and is still there when the user lands back on /auth/callback.
 */
export function captureAttribution(
  search: string,
  referrer: string,
  storage: MinimalStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    if (storage.getItem(STORAGE_KEY)) return; // first-touch already recorded

    const attribution = parseAttribution(search, referrer);
    if (!hasAnySignal(attribution)) return; // organic direct hit — nothing to record yet

    storage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // best-effort: never let attribution capture break page load
  }
}

/**
 * Filter a raw `document.referrer` down to one worth storing: drop it if it is
 * same-origin (internal navigation, or the OAuth round-trip returning to our own
 * /auth/callback). Pure — pass `document.referrer` and `window.location.origin`.
 */
export function filterReferrer(referrer: string, origin: string): string {
  if (!referrer) return '';
  if (origin && referrer.startsWith(origin)) return '';
  return referrer;
}

/** Read the stored first-touch attribution, or null if none was captured. */
export function getStoredAttribution(
  storage: MinimalStorage | null = defaultStorage(),
): Attribution | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...EMPTY_ATTRIBUTION, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return null;
  }
}

/** Whether the captured attribution has already been written to the profile row. */
export function isAttributionPersisted(storage: MinimalStorage | null = defaultStorage()): boolean {
  return !!storage && storage.getItem(PERSISTED_KEY) === '1';
}

/** Mark the captured attribution as persisted so we never write it twice. */
export function markAttributionPersisted(storage: MinimalStorage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(PERSISTED_KEY, '1');
  } catch {
    /* best-effort */
  }
}

/** Whether the user has answered or dismissed the "How did you hear about us?" prompt. */
export function isHowHeardDismissed(storage: MinimalStorage | null = defaultStorage()): boolean {
  return !!storage && storage.getItem(HOW_HEARD_DISMISSED_KEY) === '1';
}

/** Record that the prompt was answered or dismissed so it is never shown again. */
export function markHowHeardDismissed(storage: MinimalStorage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(HOW_HEARD_DISMISSED_KEY, '1');
  } catch {
    /* best-effort */
  }
}

/**
 * Decide whether the once-after-login sync should write anything, and what.
 * Pure — no supabase, no React — so the hook (useAttributionSync.ts) is a thin
 * wrapper around this and the actual network call.
 *
 * Returns null when there is nothing to do: no stored attribution, the sync
 * already ran this browser (`persisted`), or — critically — the profile ALREADY
 * carries a utm_source. That last check is "no overwrite of an existing answer":
 * first-touch wins not just within one browser's storage but across the
 * person's whole account, so a second device/session can never clobber the
 * value a previous one already wrote.
 */
export function buildAttributionSyncUpdate(
  profile: AttributionProfileFields | null,
  stored: Attribution | null,
  persisted: boolean,
): AttributionUpdate | null {
  if (!profile) return null;
  if (persisted) return null;
  if (profile.utm_source) return null; // already answered — never overwrite
  if (!stored) return null;
  return { ...stored };
}

/** Decide whether to show the "How did you hear about us?" prompt. */
export function shouldShowHowHeardPrompt(
  profile: AttributionProfileFields | null,
  dismissed: boolean,
): boolean {
  if (!profile) return false;
  if (profile.how_heard) return false; // already answered — never overwrite / never re-ask
  if (dismissed) return false;
  return true;
}

/**
 * Build the update payload for a how-heard answer, or null if the choice is
 * invalid (nothing selected, or "Other" with no free text). Trims and caps the
 * free-text field client-side, matching the DB column's practical limit.
 */
export function buildHowHeardUpdate(
  choice: string | null,
  otherText: string,
): { how_heard: string; how_heard_other: string | null } | null {
  if (!choice) return null;
  if (choice === 'Other') {
    const trimmed = trimTo(otherText, MAX_HOW_HEARD_OTHER_LEN);
    if (!trimmed) return null; // "Other" requires free text to be a usable answer
    return { how_heard: choice, how_heard_other: trimmed };
  }
  return { how_heard: choice, how_heard_other: null };
}
