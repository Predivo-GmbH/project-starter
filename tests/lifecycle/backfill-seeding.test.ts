/**
 * Unit test for the backfill-safe first run — the property that an existing user
 * does not retroactively receive a time-based email the moment lifecycle email is
 * switched on (ChannelMover, 2026-08-24: "the first tick would have told somebody
 * their move was done four days after they watched it finish").
 *
 * There is no database in this template repo to run the migration against, so this
 * is a SHAPE test over the migration's own SQL text: it asserts the backfill INSERT
 * block exists, is keyed off auth.users (every existing account, not just some), and
 * seeds every step the default event map can produce — cross-checked against
 * `LIFECYCLE_STEP_KEYS` so the SQL and the TypeScript event map cannot silently
 * drift apart (one step added in events.template.ts and forgotten in the SQL would
 * retroactively fire for every existing user; this test fails if that happens).
 *
 * Run: deno test --allow-read tests/lifecycle/
 */
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { LIFECYCLE_STEP_KEYS } from '../../supabase/functions/lifecycle-tick/events.template.ts'

const MIGRATION_PATH = new URL('../../supabase/migrations/0001_lifecycle_email.sql.template', import.meta.url)

Deno.test('the lifecycle_email migration seeds a backfill row for every default event-map step', async () => {
  const sql = await Deno.readTextFile(MIGRATION_PATH)

  assert(sql.includes('BACKFILL-SAFE FIRST RUN'), 'migration is missing the backfill-seed section entirely')
  assert(sql.includes('FROM auth.users'), 'the backfill must be keyed off every existing account, not a subset')
  assert(
    /not sent: predates lifecycle email/i.test(sql),
    'backfilled rows must say WHY nothing was sent, like ChannelMover\'s own backfill message',
  )

  for (const step of LIFECYCLE_STEP_KEYS) {
    assert(
      sql.includes(`'${step}'`),
      `migration backfill does not seed step "${step}" — a new user vs. existing user asymmetry for this step`,
    )
  }
})

Deno.test('the migration seeds exactly the step set the event map can produce, no more, no fewer', async () => {
  const sql = await Deno.readTextFile(MIGRATION_PATH)
  const valuesBlock = sql.match(/VALUES\s*\(([\s\S]*?)\)\s*\)\s*AS s\(step\)/)
  assert(valuesBlock, 'could not find the VALUES(...) AS s(step) backfill list in the migration')
  const seeded = [...valuesBlock[1].matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1])
  assertEquals(seeded.sort(), [...LIFECYCLE_STEP_KEYS].sort())
})

Deno.test('the kill switch defaults to OFF, so a fresh migration can never send on its own', async () => {
  const sql = await Deno.readTextFile(MIGRATION_PATH)
  assert(/VALUES\s*\(true,\s*false,/.test(sql), 'lifecycle_config must seed enabled=false by default')
})
