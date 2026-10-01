/**
 * Unit tests for the lifecycle send helper template — the single choke point every
 * lifecycle email must pass through. Exercises the kill switch, the internal-account
 * filter, the staging test-recipient guard, and the once-per-person claim-before-send
 * ledger write, against a minimal in-memory fake of the Supabase client (no network,
 * no real database).
 *
 * Run: deno test --allow-read tests/lifecycle/
 */
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { sendLifecycle, lifecycleEnabled } from '../../supabase/functions/_shared/lifecycle-send.template.ts'

// ── a minimal fake of the one Supabase surface lifecycle-send.template.ts touches ──

interface FakePrefRow { unsubscribe_token: string; suppressed_at: string | null }

class FakeAdmin {
  configEnabled: boolean | null
  prefs: Map<string, FakePrefRow>
  /** Simulates the two partial unique indexes: a (user, step) or (user, step, context) pair already claimed. */
  claimed: Set<string>
  inserted: { user_id: string; step: string; context_id: string | null; subject: string }[] = []
  deleted: string[] = []
  sendCalls = 0

  constructor(opts: { configEnabled?: boolean | null; prefs?: Record<string, FakePrefRow>; claimed?: string[] } = {}) {
    // Deliberately NOT `opts.configEnabled ?? true`: `??` treats an explicit `null`
    // the same as "not passed", which would make it impossible to construct a fake
    // that simulates a failed read (data: null, error: set). Check presence instead.
    this.configEnabled = 'configEnabled' in opts ? (opts.configEnabled as boolean | null) : true
    this.prefs = new Map(Object.entries(opts.prefs ?? {}))
    this.claimed = new Set(opts.claimed ?? [])
  }

  from(table: string) {
    if (table === 'lifecycle_config') {
      return { select: () => ({ maybeSingle: async () => ({ data: this.configEnabled === null ? null : { enabled: this.configEnabled }, error: this.configEnabled === null ? { message: 'boom' } : null }) }) }
    }
    if (table === 'email_preferences') {
      return {
        select: () => ({
          eq: (_col: string, userId: string) => ({
            maybeSingle: async () => {
              const row = this.prefs.get(userId)
              return { data: row ?? null, error: null }
            },
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: async (_col: string, userId: string) => {
            const row = this.prefs.get(userId)
            if (row) this.prefs.set(userId, { ...row, ...patch } as FakePrefRow)
            return { error: null }
          },
        }),
      }
    }
    if (table === 'lifecycle_emails') {
      return {
        insert: (row: { user_id: string; step: string; context_id: string | null; subject: string }) => ({
          select: () => ({
            single: async () => {
              const key = `${row.user_id}|${row.step}|${row.context_id ?? ''}`
              if (this.claimed.has(key)) {
                return { data: null, error: { code: '23505', message: 'duplicate key' } }
              }
              this.claimed.add(key)
              this.inserted.push(row)
              return { data: { id: key }, error: null }
            },
          }),
        }),
        delete: () => ({
          eq: async (_col: string, id: string) => {
            this.claimed.delete([...this.claimed].find((k) => k === id) ?? '')
            this.deleted.push(id)
            return { error: null }
          },
        }),
      }
    }
    throw new Error(`FakeAdmin: unexpected table ${table}`)
  }
}

const EXTERNAL_USER = { userId: 'u1', email: 'real.customer@gmail.com' }
const render = () => ({ subject: 'Subject', html: '<p>hi</p>', text: 'hi' })
// Never the real sendEmail() in a unit test: that would need SMTP env vars and would
// try to reach the network. sendLifecycle() accepts an injected sendEmail for exactly
// this reason — see the note on SendArgs.sendEmail in lifecycle-send.template.ts.
const fakeSendEmail = async () => {}

// ── kill switch ──────────────────────────────────────────────────────────────────

Deno.test('kill switch off: sendLifecycle refuses before touching the ledger', async () => {
  const admin = new FakeAdmin({ prefs: { u1: { unsubscribe_token: 't', suppressed_at: null } } })
  const out = await sendLifecycle({
    admin: admin as never, step: 'welcome', userId: EXTERNAL_USER.userId, email: EXTERNAL_USER.email,
    enabled: false, render,
  })
  assertEquals(out, { sent: false, reason: 'disabled' })
  assertEquals(admin.inserted.length, 0)
})

Deno.test('lifecycleEnabled(): a failed read is NOT a green light', async () => {
  const admin = new FakeAdmin({ configEnabled: null })
  assertEquals(await lifecycleEnabled(admin as never), false)
})

Deno.test('lifecycleEnabled(): true only when the row says true', async () => {
  const admin = new FakeAdmin({ configEnabled: true })
  assertEquals(await lifecycleEnabled(admin as never), true)
  const off = new FakeAdmin({ configEnabled: false })
  assertEquals(await lifecycleEnabled(off as never), false)
})

// ── internal-account filter ──────────────────────────────────────────────────────

Deno.test('internal address: refused even with the kill switch on and a valid preferences row', async () => {
  const admin = new FakeAdmin({ prefs: { u1: { unsubscribe_token: 't', suppressed_at: null } } })
  const out = await sendLifecycle({
    admin: admin as never, step: 'welcome', userId: 'u1', email: 'roger@mueller.ro',
    enabled: true, render,
  })
  assertEquals(out, { sent: false, reason: 'internal' })
  assertEquals(admin.inserted.length, 0)
})

// ── suppression ──────────────────────────────────────────────────────────────────

Deno.test('suppressed recipient: refused even though everything else is green', async () => {
  const admin = new FakeAdmin({ prefs: { u1: { unsubscribe_token: 't', suppressed_at: '2026-09-01T00:00:00Z' } } })
  const out = await sendLifecycle({
    admin: admin as never, step: 'welcome', userId: 'u1', email: EXTERNAL_USER.email,
    enabled: true, render,
  })
  assertEquals(out, { sent: false, reason: 'suppressed' })
})

// ── once-per-person: the claim-before-send ledger write ───────────────────────────

Deno.test('once-per-person: a second attempt at the same step for the same person is refused by the ledger, not by application logic', async () => {
  const admin = new FakeAdmin({ prefs: { u1: { unsubscribe_token: 't', suppressed_at: null } } })

  const first = await sendLifecycle({
    admin: admin as never, step: 'welcome', userId: 'u1', email: EXTERNAL_USER.email, enabled: true, render, sendEmail: fakeSendEmail,
  })
  assertEquals(first.sent, true)
  assertEquals(admin.inserted.length, 1)

  const second = await sendLifecycle({
    admin: admin as never, step: 'welcome', userId: 'u1', email: EXTERNAL_USER.email, enabled: true, render, sendEmail: fakeSendEmail,
  })
  assertEquals(second, { sent: false, reason: 'already_sent' })
  // Still exactly one claim — the second attempt never widened the ledger.
  assertEquals(admin.inserted.length, 1)
})

Deno.test('a different step, or a different context_id, for the same person is NOT blocked by the first claim', async () => {
  const admin = new FakeAdmin({ prefs: { u1: { unsubscribe_token: 't', suppressed_at: null } } })
  await sendLifecycle({ admin: admin as never, step: 'welcome', userId: 'u1', email: EXTERNAL_USER.email, enabled: true, render, sendEmail: fakeSendEmail })
  const differentStep = await sendLifecycle({ admin: admin as never, step: 'first_result', userId: 'u1', email: EXTERNAL_USER.email, enabled: true, render, sendEmail: fakeSendEmail })
  assertEquals(differentStep.sent, true)
  const differentContext = await sendLifecycle({ admin: admin as never, step: 'welcome', userId: 'u1', contextId: 'ctx-1', email: EXTERNAL_USER.email, enabled: true, render, sendEmail: fakeSendEmail })
  assertEquals(differentContext.sent, true)
})
