/**
 * Unit tests for src/lib/attribution.ts — first-touch capture, the OAuth
 * round-trip, the once-after-login sync decision, and the how-heard prompt
 * decision. All logic under test is pure or storage-injected (no `window`), so
 * this runs under Deno's own test runner with no DOM and no Node test
 * toolchain, matching tests/lifecycle/* in this repo.
 *
 * Run: deno test --allow-read tests/attribution/
 */
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  parseAttribution,
  hasAnySignal,
  extractReferrerHost,
  filterReferrer,
  captureAttribution,
  getStoredAttribution,
  isAttributionPersisted,
  markAttributionPersisted,
  isHowHeardDismissed,
  markHowHeardDismissed,
  buildAttributionSyncUpdate,
  shouldShowHowHeardPrompt,
  buildHowHeardUpdate,
  HOW_HEARD_OPTIONS,
  type MinimalStorage,
} from '../../src/lib/attribution.ts'

/** A tiny in-memory Storage — stands in for window.localStorage in every test
 *  below, so none of this needs jsdom. */
function memoryStorage(): MinimalStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => map.set(key, value),
  }
}

// ── parseAttribution / hasAnySignal ──────────────────────────────────────────

Deno.test('parseAttribution extracts all five UTM params plus referrer', () => {
  const a = parseAttribution(
    '?utm_source=newsletter&utm_medium=email&utm_campaign=launch&utm_content=hero&utm_term=migrate',
    'https://news.ycombinator.com/',
  )
  assertEquals(a, {
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'launch',
    utm_content: 'hero',
    utm_term: 'migrate',
    referrer: 'https://news.ycombinator.com/',
  })
})

Deno.test('parseAttribution falls back to ?from= for utm_source when no utm_source is present', () => {
  assertEquals(parseAttribution('?from=reddit', '').utm_source, 'reddit')
})

Deno.test('parseAttribution prefers an explicit utm_source over ?from=', () => {
  assertEquals(parseAttribution('?utm_source=twitter&from=reddit', '').utm_source, 'twitter')
})

Deno.test('parseAttribution returns all-null for an empty query string and no referrer', () => {
  const a = parseAttribution('', '')
  assertEquals(hasAnySignal(a), false)
  assertEquals(a.utm_source, null)
  assertEquals(a.referrer, null)
})

Deno.test('parseAttribution trims whitespace and treats blank values as null', () => {
  assertEquals(parseAttribution('?utm_source=%20%20', '  ').utm_source, null)
})

Deno.test('parseAttribution caps overly long values to protect the DB columns', () => {
  const long = 'x'.repeat(1000)
  const a = parseAttribution(`?utm_source=${long}`, long)
  assertEquals(a.utm_source?.length, 255)
  assertEquals(a.referrer?.length, 500)
})

Deno.test('hasAnySignal is true when any field is set', () => {
  assertEquals(hasAnySignal(parseAttribution('?utm_medium=cpc', '')), true)
  assertEquals(hasAnySignal(parseAttribution('', 'https://google.com/')), true)
})

Deno.test('hasAnySignal is false when everything is null', () => {
  assertEquals(hasAnySignal(parseAttribution('', '')), false)
})

// ── filterReferrer (same-origin stripping, incl. the OAuth round-trip) ───────

Deno.test('filterReferrer drops a same-origin referrer (internal nav / OAuth return)', () => {
  assertEquals(filterReferrer('https://app.example.com/auth/callback', 'https://app.example.com'), '')
})

Deno.test('filterReferrer keeps a cross-origin referrer', () => {
  assertEquals(
    filterReferrer('https://news.ycombinator.com/item?id=1', 'https://app.example.com'),
    'https://news.ycombinator.com/item?id=1',
  )
})

Deno.test('filterReferrer passes through an empty referrer unchanged', () => {
  assertEquals(filterReferrer('', 'https://app.example.com'), '')
})

// ── extractReferrerHost — mirrors public.referrer_host in the view migration ─

Deno.test('extractReferrerHost strips scheme and path/query/fragment', () => {
  assertEquals(extractReferrerHost('https://news.ycombinator.com/item?id=123'), 'news.ycombinator.com')
  assertEquals(extractReferrerHost('http://reddit.com/r/test#top'), 'reddit.com')
})

Deno.test('extractReferrerHost strips a leading www.', () => {
  assertEquals(extractReferrerHost('https://www.google.com/search?q=x'), 'google.com')
})

Deno.test('extractReferrerHost handles a bare host with no scheme or path', () => {
  assertEquals(extractReferrerHost('producthunt.com'), 'producthunt.com')
})

Deno.test('extractReferrerHost returns null for null, undefined and empty input', () => {
  assertEquals(extractReferrerHost(null), null)
  assertEquals(extractReferrerHost(undefined), null)
  assertEquals(extractReferrerHost(''), null)
})

Deno.test('extractReferrerHost lowercases the host', () => {
  assertEquals(extractReferrerHost('https://WWW.Google.COM/x'), 'google.com')
})

// ── capture / storage — first-touch wins, incl. the OAuth round-trip ─────────

Deno.test('captureAttribution stores first-touch attribution and getStoredAttribution reads it back', () => {
  const storage = memoryStorage()
  captureAttribution('?utm_source=hn&utm_campaign=launch', '', storage)
  const stored = getStoredAttribution(storage)
  assertEquals(stored?.utm_source, 'hn')
  assertEquals(stored?.utm_campaign, 'launch')
})

Deno.test('captureAttribution is first-touch: a later call does not overwrite the stored value', () => {
  const storage = memoryStorage()
  captureAttribution('?utm_source=hn', '', storage)
  captureAttribution('?utm_source=twitter', '', storage)
  assertEquals(getStoredAttribution(storage)?.utm_source, 'hn')
})

Deno.test('captureAttribution stores nothing for an organic direct visit', () => {
  const storage = memoryStorage()
  captureAttribution('', '', storage)
  assertEquals(getStoredAttribution(storage), null)
})

Deno.test('OAuth round-trip: attribution captured before the redirect survives the return with no query params', () => {
  const storage = memoryStorage()
  const origin = 'https://app.example.com'

  // Step 1: user lands on the marketing page with UTM params, before clicking
  // "Sign in with Google". Capture runs on this page load.
  captureAttribution('?utm_source=hn&utm_campaign=launch', filterReferrer('https://news.ycombinator.com/', origin), storage)

  // Step 2: the browser is sent to Google and back. The landing page is
  // /auth/callback with NO query params of its own, and document.referrer is
  // now Google's own domain (not ours) OR our own origin depending on the
  // provider — either way, storage (not the URL) is what carries the signal
  // across the round-trip, and a second capture call must not erase it.
  captureAttribution('', filterReferrer(origin + '/auth/callback', origin), storage)

  const stored = getStoredAttribution(storage)
  assertEquals(stored?.utm_source, 'hn')
  assertEquals(stored?.utm_campaign, 'launch')
})

Deno.test('getStoredAttribution returns null when storage is null (e.g. private mode)', () => {
  assertEquals(getStoredAttribution(null), null)
})

Deno.test('persisted / dismissed flags round-trip through storage', () => {
  const storage = memoryStorage()
  assertEquals(isAttributionPersisted(storage), false)
  markAttributionPersisted(storage)
  assertEquals(isAttributionPersisted(storage), true)

  assertEquals(isHowHeardDismissed(storage), false)
  markHowHeardDismissed(storage)
  assertEquals(isHowHeardDismissed(storage), true)
})

// ── buildAttributionSyncUpdate — the once-after-login sync decision ─────────

Deno.test('buildAttributionSyncUpdate returns the update when there is stored attribution and nothing persisted yet', () => {
  const profile = { id: 'u1', utm_source: null, how_heard: null }
  const stored = parseAttribution('?utm_source=hn', '')
  const update = buildAttributionSyncUpdate(profile, stored, false)
  assertEquals(update?.utm_source, 'hn')
})

Deno.test('buildAttributionSyncUpdate returns null with no profile', () => {
  assertEquals(buildAttributionSyncUpdate(null, parseAttribution('?utm_source=hn', ''), false), null)
})

Deno.test('buildAttributionSyncUpdate returns null when already persisted', () => {
  const profile = { id: 'u1', utm_source: null, how_heard: null }
  assertEquals(buildAttributionSyncUpdate(profile, parseAttribution('?utm_source=hn', ''), true), null)
})

Deno.test('buildAttributionSyncUpdate returns null when nothing was stored', () => {
  const profile = { id: 'u1', utm_source: null, how_heard: null }
  assertEquals(buildAttributionSyncUpdate(profile, null, false), null)
})

Deno.test('buildAttributionSyncUpdate never overwrites an existing answer on the profile', () => {
  const profile = { id: 'u1', utm_source: 'already-set', how_heard: null }
  const stored = parseAttribution('?utm_source=hn', '')
  assertEquals(buildAttributionSyncUpdate(profile, stored, false), null)
})

// ── shouldShowHowHeardPrompt / buildHowHeardUpdate ───────────────────────────

Deno.test('shouldShowHowHeardPrompt is true for a logged-in user who has not answered or dismissed', () => {
  assertEquals(shouldShowHowHeardPrompt({ id: 'u1', utm_source: null, how_heard: null }, false), true)
})

Deno.test('shouldShowHowHeardPrompt never re-asks or overwrites once answered', () => {
  assertEquals(shouldShowHowHeardPrompt({ id: 'u1', utm_source: null, how_heard: 'Google' }, false), false)
})

Deno.test('shouldShowHowHeardPrompt is false once dismissed', () => {
  assertEquals(shouldShowHowHeardPrompt({ id: 'u1', utm_source: null, how_heard: null }, true), false)
})

Deno.test('shouldShowHowHeardPrompt is false with no profile', () => {
  assertEquals(shouldShowHowHeardPrompt(null, false), false)
})

Deno.test('buildHowHeardUpdate returns null when nothing is chosen', () => {
  assertEquals(buildHowHeardUpdate(null, ''), null)
})

Deno.test('buildHowHeardUpdate returns null for "Other" with blank free text', () => {
  assertEquals(buildHowHeardUpdate('Other', '   '), null)
})

Deno.test('buildHowHeardUpdate trims and keeps "Other" free text', () => {
  assertEquals(buildHowHeardUpdate('Other', '  Found it on a blog  '), {
    how_heard: 'Other',
    how_heard_other: 'Found it on a blog',
  })
})

Deno.test('buildHowHeardUpdate caps "Other" free text at 255 chars', () => {
  const long = 'x'.repeat(400)
  const update = buildHowHeardUpdate('Other', long)
  assertEquals(update?.how_heard_other?.length, 255)
})

Deno.test('buildHowHeardUpdate returns how_heard_other: null for a fixed (non-Other) option', () => {
  assertEquals(buildHowHeardUpdate('Google', ''), { how_heard: 'Google', how_heard_other: null })
})

Deno.test('HOW_HEARD_OPTIONS offers the plain-English choices from the plan, ending in Other', () => {
  assertEquals(HOW_HEARD_OPTIONS, [
    'Google',
    'ChatGPT, Claude, or another AI assistant',
    'A directory or review site',
    'Product Hunt, Hacker News, or Reddit',
    'A friend or colleague',
    'Other',
  ])
})

Deno.test('every HOW_HEARD_OPTIONS value round-trips through buildHowHeardUpdate', () => {
  for (const option of HOW_HEARD_OPTIONS) {
    const update = buildHowHeardUpdate(option, option === 'Other' ? 'free text' : '')
    assert(update, `option "${option}" produced no update`)
    assertEquals(update.how_heard, option)
  }
})
