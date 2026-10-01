/**
 * Unit tests for the default lifecycle event map (events.template.ts).
 *
 * Run: deno test --allow-read tests/lifecycle/
 *
 * These test the PURE eligibility logic (`isDue`) against synthetic `LifecycleFacts`
 * snapshots — no database, no network, matching the contract the engine
 * (lifecycle-tick/index.template.ts) relies on: `isDue(ctx)` is a function of
 * `facts`, `now`, and `wasSent`, nothing else.
 */
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { LIFECYCLE_EVENTS, LIFECYCLE_STEP_KEYS, type LifecycleFacts, type LifecycleEventContext } from '../../supabase/functions/lifecycle-tick/events.template.ts'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 1) // 2026-10-01, arbitrary fixed "now"

function baseFacts(overrides: Partial<LifecycleFacts> = {}): LifecycleFacts {
  return {
    signedUpAt: NOW,
    setupCompletedAt: null,
    firstResultAt: null,
    demoUsedUpAt: null,
    checkoutOpenedAt: null,
    paidAt: null,
    trialEndsAt: null,
    lastActivityAt: null,
    paymentFailedAt: null,
    realWinAt: null,
    ...overrides,
  }
}

function eventFor(step: string) {
  const ev = LIFECYCLE_EVENTS.find((e) => e.step === step)
  assert(ev, `no event definition for step "${step}"`)
  return ev
}

function ctx(facts: LifecycleFacts, sentSteps: string[] = [], now = NOW): LifecycleEventContext {
  const sent = new Set(sentSteps)
  return { facts, now, wasSent: (step) => sent.has(step) }
}

// ── welcome ──────────────────────────────────────────────────────────────────────

Deno.test('welcome: due for a brand-new signup, never sent before', () => {
  assert(eventFor('welcome').isDue(ctx(baseFacts())))
})

Deno.test('welcome: not due once already sent (once-per-person)', () => {
  assertEquals(eventFor('welcome').isDue(ctx(baseFacts(), ['welcome'])), false)
})

// ── stuck_dayN ───────────────────────────────────────────────────────────────────

for (const days of [1, 3, 7]) {
  const step = `stuck_day${days}`

  Deno.test(`${step}: not due before ${days} day(s) have passed`, () => {
    const facts = baseFacts({ signedUpAt: NOW - (days * DAY - 1000) })
    assertEquals(eventFor(step).isDue(ctx(facts)), false)
  })

  Deno.test(`${step}: due at exactly ${days} day(s), setup still incomplete`, () => {
    const facts = baseFacts({ signedUpAt: NOW - days * DAY })
    assert(eventFor(step).isDue(ctx(facts)))
  })

  Deno.test(`${step}: NOT due once setup is complete`, () => {
    const facts = baseFacts({ signedUpAt: NOW - days * DAY, setupCompletedAt: NOW - DAY })
    assertEquals(eventFor(step).isDue(ctx(facts)), false)
  })

  Deno.test(`${step}: not due twice (once-per-person)`, () => {
    const facts = baseFacts({ signedUpAt: NOW - days * DAY })
    assertEquals(eventFor(step).isDue(ctx(facts, [step])), false)
  })
}

// ── first_result ─────────────────────────────────────────────────────────────────

Deno.test('first_result: not due until a real result has happened', () => {
  assertEquals(eventFor('first_result').isDue(ctx(baseFacts())), false)
})

Deno.test('first_result: due at once when it happens', () => {
  assert(eventFor('first_result').isDue(ctx(baseFacts({ firstResultAt: NOW }))))
})

// ── demo_used_up + reminder ───────────────────────────────────────────────────────

Deno.test('demo_used_up: due the moment the allowance runs out', () => {
  assert(eventFor('demo_used_up').isDue(ctx(baseFacts({ demoUsedUpAt: NOW }))))
})

Deno.test('demo_used_up_reminder: NOT due before 2 days, even if the first email was sent', () => {
  const facts = baseFacts({ demoUsedUpAt: NOW - DAY })
  assertEquals(eventFor('demo_used_up_reminder').isDue(ctx(facts, ['demo_used_up'])), false)
})

Deno.test('demo_used_up_reminder: NOT due at 2+ days if the first email was never sent', () => {
  const facts = baseFacts({ demoUsedUpAt: NOW - 3 * DAY })
  assertEquals(eventFor('demo_used_up_reminder').isDue(ctx(facts, [])), false)
})

Deno.test('demo_used_up_reminder: due at 2+ days once the first email went out', () => {
  const facts = baseFacts({ demoUsedUpAt: NOW - 2 * DAY })
  assert(eventFor('demo_used_up_reminder').isDue(ctx(facts, ['demo_used_up'])))
})

// ── checkout abandoned same day / next day ────────────────────────────────────────

Deno.test('checkout_abandoned_same_day: due immediately, not due once paid', () => {
  assert(eventFor('checkout_abandoned_same_day').isDue(ctx(baseFacts({ checkoutOpenedAt: NOW }))))
  assertEquals(
    eventFor('checkout_abandoned_same_day').isDue(ctx(baseFacts({ checkoutOpenedAt: NOW, paidAt: NOW }))),
    false,
  )
})

Deno.test('checkout_abandoned_next_day: requires the same-day email to have gone out first', () => {
  const facts = baseFacts({ checkoutOpenedAt: NOW - DAY })
  assertEquals(eventFor('checkout_abandoned_next_day').isDue(ctx(facts, [])), false)
  assert(eventFor('checkout_abandoned_next_day').isDue(ctx(facts, ['checkout_abandoned_same_day'])))
})

// ── trial ending / ended ───────────────────────────────────────────────────────────

Deno.test('trial_ending: due inside the 3-day window, not outside it, not once paid', () => {
  assert(eventFor('trial_ending').isDue(ctx(baseFacts({ trialEndsAt: NOW + 2 * DAY }))))
  assertEquals(eventFor('trial_ending').isDue(ctx(baseFacts({ trialEndsAt: NOW + 4 * DAY }))), false)
  assertEquals(eventFor('trial_ending').isDue(ctx(baseFacts({ trialEndsAt: NOW + 2 * DAY, paidAt: NOW }))), false)
})

Deno.test('trial_ended: due once the end time has passed and nobody paid', () => {
  assert(eventFor('trial_ended').isDue(ctx(baseFacts({ trialEndsAt: NOW - 1000 }))))
  assertEquals(eventFor('trial_ended').isDue(ctx(baseFacts({ trialEndsAt: NOW - 1000, paidAt: NOW }))), false)
})

// ── win-back 7 / 30 ────────────────────────────────────────────────────────────────

Deno.test('win_back_7 / win_back_30: gated by signup age and never-paid', () => {
  assertEquals(eventFor('win_back_7').isDue(ctx(baseFacts({ signedUpAt: NOW - 6 * DAY }))), false)
  assert(eventFor('win_back_7').isDue(ctx(baseFacts({ signedUpAt: NOW - 7 * DAY }))))
  assertEquals(eventFor('win_back_30').isDue(ctx(baseFacts({ signedUpAt: NOW - 29 * DAY }))), false)
  assert(eventFor('win_back_30').isDue(ctx(baseFacts({ signedUpAt: NOW - 30 * DAY }))))
  assertEquals(eventFor('win_back_7').isDue(ctx(baseFacts({ signedUpAt: NOW - 7 * DAY, paidAt: NOW }))), false)
})

// ── payment_failed ──────────────────────────────────────────────────────────────────

Deno.test('payment_failed: due on failure, once-per-person', () => {
  assert(eventFor('payment_failed').isDue(ctx(baseFacts({ paymentFailedAt: NOW }))))
  assertEquals(eventFor('payment_failed').isDue(ctx(baseFacts({ paymentFailedAt: NOW }), ['payment_failed'])), false)
})

// ── customer_quiet_14 ────────────────────────────────────────────────────────────────

Deno.test('customer_quiet_14: only for a PAYING customer, only after 14 quiet days', () => {
  assertEquals(
    eventFor('customer_quiet_14').isDue(ctx(baseFacts({ lastActivityAt: NOW - 20 * DAY }))), // never paid
    false,
  )
  assertEquals(
    eventFor('customer_quiet_14').isDue(ctx(baseFacts({ paidAt: NOW - 40 * DAY, lastActivityAt: NOW - 10 * DAY }))),
    false,
  )
  assert(
    eventFor('customer_quiet_14').isDue(ctx(baseFacts({ paidAt: NOW - 40 * DAY, lastActivityAt: NOW - 14 * DAY }))),
  )
})

// ── real_win ───────────────────────────────────────────────────────────────────────────

Deno.test('real_win: due at the win, once-per-person', () => {
  assert(eventFor('real_win').isDue(ctx(baseFacts({ realWinAt: NOW }))))
  assertEquals(eventFor('real_win').isDue(ctx(baseFacts({ realWinAt: NOW }), ['real_win'])), false)
})

// ── the event map stays internally consistent ───────────────────────────────────────────

Deno.test('every event has a unique step key (a duplicate would silently make one unreachable)', () => {
  const seen = new Set<string>()
  for (const e of LIFECYCLE_EVENTS) {
    assertEquals(seen.has(e.step), false, `duplicate step key: ${e.step}`)
    seen.add(e.step)
  }
})

Deno.test('LIFECYCLE_STEP_KEYS matches the event map exactly (this is what the migration backfill seeds against)', () => {
  assertEquals(LIFECYCLE_STEP_KEYS.sort(), LIFECYCLE_EVENTS.map((e) => e.step).sort())
})
