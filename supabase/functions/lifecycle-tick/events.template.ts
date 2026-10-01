/**
 * Template: {{APP_NAME}}'s lifecycle event map — THIS FILE IS DATA, NOT ENGINE.
 * Copy to supabase/functions/lifecycle-tick/events.ts and edit freely; the engine in
 * `lifecycle-tick/index.ts` never changes per product.
 *
 * Default map: `docs/PLAN-distribution-built-into-every-new-product-2026-10-01.md`
 * section E, "copied from ChannelMover's working setup". Every row below is a
 * PLACEHOLDER marked "// TODO [default]" — the timing and the once-per-step guard
 * are real and tested; the SUBJECT LINES, BODY COPY and (most importantly) how
 * `collectUserSnapshots()` reads YOUR schema to fill in `facts` are not. Nothing
 * here should ship to a real customer until a human has read every subject and body.
 *
 * ── The "facts" model ───────────────────────────────────────────────────────────
 * The engine knows nothing about your tables. For each user it asks YOUR
 * `collectUserSnapshots()` for one flat `LifecycleFacts` object — the set of dates
 * your product already knows about that answer "is this event due". Every `isDue`
 * below is a pure function of `facts` + `now` + "has this exact step already gone
 * out to this person" (`wasSent`), which is why it is unit-testable with no database:
 * see `events.test.ts`.
 *
 * ── Why one step key per timing, not a mutable counter ─────────────────────────
 * ReplyFlow's variant (`supabase/migrations/037_lifecycle_email_infra.sql`) uses
 * `unique(user_id, email_type)` with a `sent_count` the cron increments, so a single
 * row carries a whole cadence (e.g. "connect_nudge" at day 1/3/7) and the cron has to
 * recompute "how many of the 3 are due" every run. ChannelMover instead gives EACH
 * timing its own step key (`stuck_day1`, `stuck_day3`, `stuck_day7`, ...), each one
 * a plain once-ever row. That is why ChannelMover's once-per-person guard is a
 * database constraint and ReplyFlow's is application logic re-derived every tick.
 * This template follows ChannelMover: safer, more rows, worth it.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// See the note in lifecycle-send.template.ts about the `.template.ts` extension here:
// rename together with the sibling file at copy time.
import { lifecycleEmail, type EmailTemplate } from '../_shared/lifecycle-email-layout.template.ts'

const DAY = 24 * 60 * 60 * 1000

/**
 * What YOUR product knows about one person, as of "now". All dates are epoch ms or
 * null. `collectUserSnapshots()` below is where these get filled in from your schema
 * (subscriptions, demo usage, checkout sessions, whatever you have).
 */
export interface LifecycleFacts {
  signedUpAt: number
  /** When onboarding/setup finished. Null = never finished. */
  setupCompletedAt: number | null
  /** When the product first did the thing it exists to do, for this person. */
  firstResultAt: number | null
  /** When a demo or free allowance ran out. */
  demoUsedUpAt: number | null
  /** When they opened checkout. Cleared (left null) once paidAt is set. */
  checkoutOpenedAt: number | null
  /** First successful payment, ever. Null = never paid. */
  paidAt: number | null
  /** Trial end time, if this product has a trial. Null = no trial / not on one. */
  trialEndsAt: number | null
  /** Most recent activity from a PAYING customer. Null = not a paying customer, or no activity yet. */
  lastActivityAt: number | null
  /** Most recent failed payment. Null = none. */
  paymentFailedAt: number | null
  /** A moment the product decided was a "real win" worth asking for a review. */
  realWinAt: number | null
}

export interface UserSnapshot {
  userId: string
  email: string
  facts: LifecycleFacts
}

export interface LifecycleEventContext {
  facts: LifecycleFacts
  now: number
  /** True if this exact step has ever been sent to this person (ledger lookup, done once per tick by the engine). */
  wasSent: (step: string) => boolean
}

export interface LifecycleEventDef {
  /** The ledger key. Renaming this is the same as resetting everyone's history for it — don't, once live. */
  step: string
  /** For humans reading this file / the Cockpit's distribution view. */
  description: string
  /** For humans. The engine does not parse this; `isDue` is what actually fires it. */
  timing: string
  isDue: (ctx: LifecycleEventContext) => boolean
  render: (unsubscribeUrl: string, facts: LifecycleFacts) => EmailTemplate
}

// ── The default event map (section E), as placeholders ──────────────────────────
// Keep every `step` key here in sync with the backfill-seed list in the lifecycle_email
// migration template — a step added here with no matching seed row retroactively fires
// for every EXISTING user the moment this ships, which is exactly the bug the backfill
// guard exists to prevent.

export const LIFECYCLE_EVENTS: LifecycleEventDef[] = [
  // TODO [default] — Signed up. Welcome, plain text, one action, within a minute.
  // "Within a minute" is bounded by how often lifecycle-tick runs (every 5 minutes in
  // the migration template); for truer immediacy call sendLifecycle() directly from
  // your signup handler instead, the way ChannelMover's build plan considered and
  // rejected for its four immediate emails (docs/PLAN-BUILD-lifecycle-email-2026-08-24.md
  // §3, "the one deliberate change from this plan").
  {
    step: 'welcome',
    description: 'Signed up',
    timing: 'within a minute (next tick)',
    isDue: (ctx) => !ctx.wasSent('welcome'),
    render: (unsub) => lifecycleEmail({
      subject: 'Welcome to {{APP_NAME}}', // TODO [default]: real subject
      heading: 'Welcome',                 // TODO [default]: real heading
      body: 'TODO [default]: one sentence, one action — the single next step.',
      ctaText: 'Get started',              // TODO [default]
      ctaUrl: 'https://{{APP_DOMAIN}}',    // TODO [default]: deep link to that step
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Signed up but not set up: "you're stuck at step X", day 1/3/7.
  // `setupCompletedAt` must become non-null the moment onboarding finishes, or these
  // three never stop firing for someone who finished days after signing up.
  ...[1, 3, 7].map((days) => ({
    step: `stuck_day${days}`,
    description: `Signed up but not set up (day ${days})`,
    timing: `${days} day(s) after signup, if setup is still incomplete`,
    isDue: (ctx: LifecycleEventContext) =>
      ctx.facts.setupCompletedAt === null &&
      ctx.now - ctx.facts.signedUpAt >= days * DAY &&
      !ctx.wasSent(`stuck_day${days}`),
    render: (unsub: string) => lifecycleEmail({
      subject: `You're stuck at step __`, // TODO [default]: name the EXACT step, per the plan's rule
      heading: "You're not quite set up yet",
      body: 'TODO [default]: name the exact step they stopped at and the one action that finishes it.',
      ctaText: 'Finish setup',
      ctaUrl: 'https://{{APP_DOMAIN}}',
      unsubscribeUrl: unsub,
    }),
  } satisfies LifecycleEventDef)),

  // TODO [default] — First real result: "It works. Here's the next step." At once.
  {
    step: 'first_result',
    description: 'First real result (the moment it works)',
    timing: 'at once',
    isDue: (ctx) => ctx.facts.firstResultAt !== null && !ctx.wasSent('first_result'),
    render: (unsub) => lifecycleEmail({
      subject: 'It works!',
      heading: 'It worked',
      body: "TODO [default]: confirm what just happened and give them the ONE next step that compounds it.",
      ctaText: 'Keep going',
      ctaUrl: 'https://{{APP_DOMAIN}}',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Demo / free allowance used up: within the hour, reminder after 2 days.
  {
    step: 'demo_used_up',
    description: 'Demo or free allowance used up',
    timing: 'within the hour',
    isDue: (ctx) => ctx.facts.demoUsedUpAt !== null && !ctx.wasSent('demo_used_up'),
    render: (unsub) => lifecycleEmail({
      subject: "Here's what you got, and how to keep going",
      heading: 'You used up your free allowance',
      body: 'TODO [default]: say what they got so far (be specific) and the one action to keep going.',
      ctaText: 'Keep going',
      ctaUrl: 'https://{{APP_DOMAIN}}/upgrade',
      unsubscribeUrl: unsub,
    }),
  },
  {
    step: 'demo_used_up_reminder',
    description: 'Demo used up — reminder',
    timing: '2 days after the first demo-used-up email',
    isDue: (ctx) => ctx.facts.demoUsedUpAt !== null &&
      ctx.now - ctx.facts.demoUsedUpAt >= 2 * DAY &&
      ctx.wasSent('demo_used_up') &&
      !ctx.wasSent('demo_used_up_reminder'),
    render: (unsub) => lifecycleEmail({
      subject: 'Still thinking it over?',
      heading: 'Your allowance is still waiting to be topped up',
      body: 'TODO [default]: the same one action as the first email, shorter.',
      ctaText: 'Keep going',
      ctaUrl: 'https://{{APP_DOMAIN}}/upgrade',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Opened checkout, didn't pay: same day + next day.
  {
    step: 'checkout_abandoned_same_day',
    description: "Opened checkout, didn't pay",
    timing: 'same day',
    isDue: (ctx) => ctx.facts.checkoutOpenedAt !== null && ctx.facts.paidAt === null &&
      !ctx.wasSent('checkout_abandoned_same_day'),
    render: (unsub) => lifecycleEmail({
      subject: 'Finish checking out?',
      heading: 'You were almost there',
      body: 'TODO [default]: one line reminding them what they were buying; no invented urgency, no discount without sign-off.',
      ctaText: 'Finish checkout',
      ctaUrl: 'https://{{APP_DOMAIN}}/checkout',
      unsubscribeUrl: unsub,
    }),
  },
  {
    step: 'checkout_abandoned_next_day',
    description: "Opened checkout, still didn't pay — next day",
    timing: 'next day',
    isDue: (ctx) => ctx.facts.checkoutOpenedAt !== null && ctx.facts.paidAt === null &&
      ctx.now - ctx.facts.checkoutOpenedAt >= 1 * DAY &&
      ctx.wasSent('checkout_abandoned_same_day') &&
      !ctx.wasSent('checkout_abandoned_next_day'),
    render: (unsub) => lifecycleEmail({
      subject: 'Still interested?',
      heading: 'Your checkout is still open',
      body: 'TODO [default]: shorter than the first reminder; still no invented urgency.',
      ctaText: 'Finish checkout',
      ctaUrl: 'https://{{APP_DOMAIN}}/checkout',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Trial ending (3 days before) / trial ended (on the day).
  {
    step: 'trial_ending',
    description: 'Trial ending soon',
    timing: '3 days before trial end',
    isDue: (ctx) => ctx.facts.trialEndsAt !== null && ctx.facts.paidAt === null &&
      ctx.facts.trialEndsAt - ctx.now <= 3 * DAY && ctx.facts.trialEndsAt - ctx.now > 0 &&
      !ctx.wasSent('trial_ending'),
    render: (unsub) => lifecycleEmail({
      subject: 'Your trial ends in 3 days',
      heading: 'Your trial is ending soon',
      body: 'TODO [default]: what they lose and the one action to keep it.',
      ctaText: 'Upgrade now',
      ctaUrl: 'https://{{APP_DOMAIN}}/upgrade',
      unsubscribeUrl: unsub,
    }),
  },
  {
    step: 'trial_ended',
    description: 'Trial ended',
    timing: 'on the day',
    isDue: (ctx) => ctx.facts.trialEndsAt !== null && ctx.facts.paidAt === null &&
      ctx.now >= ctx.facts.trialEndsAt &&
      !ctx.wasSent('trial_ended'),
    render: (unsub) => lifecycleEmail({
      subject: 'Your trial ended',
      heading: 'Your trial has ended',
      body: 'TODO [default]: what still works, what does not, and the one action to upgrade.',
      ctaText: 'Upgrade now',
      ctaUrl: 'https://{{APP_DOMAIN}}/upgrade',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Didn't buy: win-back after 7 and 30 days.
  {
    step: 'win_back_7',
    description: "Didn't buy — win-back",
    timing: '7 days after signup',
    isDue: (ctx) => ctx.facts.paidAt === null &&
      ctx.now - ctx.facts.signedUpAt >= 7 * DAY &&
      !ctx.wasSent('win_back_7'),
    render: (unsub) => lifecycleEmail({
      subject: 'Still on your mind?',
      heading: 'Come back any time',
      body: 'TODO [default]: one reason to come back, one action. No discount without Roger\'s sign-off.',
      ctaText: 'Take another look',
      ctaUrl: 'https://{{APP_DOMAIN}}',
      unsubscribeUrl: unsub,
    }),
  },
  {
    step: 'win_back_30',
    description: "Didn't buy — win-back",
    timing: '30 days after signup',
    isDue: (ctx) => ctx.facts.paidAt === null &&
      ctx.now - ctx.facts.signedUpAt >= 30 * DAY &&
      !ctx.wasSent('win_back_30'),
    render: (unsub) => lifecycleEmail({
      subject: "What's changed since you looked",
      heading: 'A quick update',
      body: 'TODO [default]: what changed in the product since they left. No discount without sign-off.',
      ctaText: 'Take another look',
      ctaUrl: 'https://{{APP_DOMAIN}}',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Payment failed, on failure.
  {
    step: 'payment_failed',
    description: 'Payment failed',
    timing: 'on failure',
    isDue: (ctx) => ctx.facts.paymentFailedAt !== null && !ctx.wasSent('payment_failed'),
    render: (unsub) => lifecycleEmail({
      subject: 'Your payment did not go through',
      heading: 'Payment problem',
      body: 'TODO [default]: what to do, in one step. Never shame, never urgency beyond the fact.',
      ctaText: 'Update payment method',
      ctaUrl: 'https://{{APP_DOMAIN}}/billing',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Paying customer goes quiet: check-in after 14 days.
  {
    step: 'customer_quiet_14',
    description: 'Paying customer quiet 14 days — check-in',
    timing: '14 days of no activity from a paying customer',
    isDue: (ctx) => ctx.facts.paidAt !== null && ctx.facts.lastActivityAt !== null &&
      ctx.now - ctx.facts.lastActivityAt >= 14 * DAY &&
      !ctx.wasSent('customer_quiet_14'),
    render: (unsub) => lifecycleEmail({
      subject: 'Everything okay?',
      heading: "We haven't seen you in a while",
      body: 'TODO [default]: one genuinely useful nudge, not a guilt trip. Reply goes to a monitored inbox.',
      ctaText: 'Jump back in',
      ctaUrl: 'https://{{APP_DOMAIN}}',
      unsubscribeUrl: unsub,
    }),
  },

  // TODO [default] — Paying customer has a real win: review + referral ask, at the win.
  {
    step: 'real_win',
    description: 'Paying customer has a real win — review + referral ask',
    timing: 'at the win',
    isDue: (ctx) => ctx.facts.realWinAt !== null && !ctx.wasSent('real_win'),
    render: (unsub) => lifecycleEmail({
      subject: 'Glad that worked — got 30 seconds?',
      heading: 'That looked like a real win',
      body: 'TODO [default]: name the specific win, then ask for ONE thing: a review (feeds directories and AI answers) or a referral, not both at once.',
      ctaText: 'Leave a review',
      ctaUrl: 'https://{{APP_DOMAIN}}/review', // TODO [default]: your real review/referral link
      unsubscribeUrl: unsub,
    }),
  },
]

/** Every step key this product's default map can produce — used by the migration's
 *  backfill seed and asserted against by events.test.ts, so the two can never drift
 *  apart silently. Keep in sync by hand if you add or rename a step. */
export const LIFECYCLE_STEP_KEYS: string[] = LIFECYCLE_EVENTS.map((e) => e.step)

/**
 * TODO [per product, REQUIRED]: read your own schema and build one LifecycleFacts
 * snapshot per user. This is the one function in this file that has no sensible
 * default — ChannelMover's version joins `profiles`, `youtube_accounts`,
 * `migrations` and `credit_transactions`; yours will join whatever you have
 * (subscriptions, demo sessions, checkout_sessions, ...).
 *
 * Keep it a pure read: no sends, no writes, so it stays trivially safe to call every
 * 5 minutes and safe to unit-test by constructing `LifecycleFacts` directly instead
 * of calling this (see events.test.ts, which never calls this function).
 */
export async function collectUserSnapshots(_admin: SupabaseClient): Promise<UserSnapshot[]> {
  throw new Error(
    'collectUserSnapshots() is a placeholder. Read your own tables (subscriptions, ' +
    'demo usage, checkout sessions, ...) and return one LifecycleFacts per user. ' +
    'See docs/LIFECYCLE_EMAIL.md.',
  )
}
