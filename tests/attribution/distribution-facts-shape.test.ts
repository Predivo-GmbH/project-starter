/**
 * SQL shape tests over the sign-up source tracking migrations. There is no
 * database in this template repo to run them against, so these assert the
 * migrations' own SQL text, same approach as
 * tests/lifecycle/backfill-seeding.test.ts.
 *
 * What this protects: `distribution_facts` is THE CONTRACT the Cockpit reads
 * from every product (plan 2026-10-01, section G) — a column renamed, reordered
 * dropped, or a grant loosened in one product's copy silently breaks the
 * Cockpit's cross-fleet Distribution view, or worse, exposes attribution data to
 * anon/authenticated. These tests fail loudly on any of that.
 *
 * Run: deno test --allow-read tests/attribution/
 */
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const COLUMNS_PATH = new URL('../../supabase/migrations/0003_signup_source_tracking.sql.template', import.meta.url)
const VIEW_PATH = new URL('../../supabase/migrations/0004_distribution_facts_view.sql.template', import.meta.url)

const STANDARD_COLUMNS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'referrer',
  'how_heard',
  'how_heard_other',
]

// The exact, ordered contract the task hands the Cockpit — see 0004's own
// "THE CONTRACT" comment block.
const DISTRIBUTION_FACTS_COLUMNS = [
  'user_id',
  'email',
  'signed_up_at',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'referrer_host',
  'how_heard',
  'how_heard_other',
  'first_result_at',
  'paid_at',
]

const BILLING_WORDS = ['credit', 'tier', 'quota', 'used', 'price', 'billing', 'subscription', 'entitlement']

Deno.test('0003 adds every standard attribution column to profiles, by its exact name', async () => {
  const sql = await Deno.readTextFile(COLUMNS_PATH)
  for (const col of STANDARD_COLUMNS) {
    assert(
      new RegExp(`ADD COLUMN IF NOT EXISTS ${col}\\b`).test(sql),
      `migration is missing "ADD COLUMN IF NOT EXISTS ${col}" — the column names are the contract`,
    )
  }
})

Deno.test('0003 grants UPDATE on exactly the 8 attribution columns, nothing billing-related', async () => {
  const sql = await Deno.readTextFile(COLUMNS_PATH)
  const grantMatch = sql.match(/GRANT UPDATE\s*\(([\s\S]*?)\)\s*ON public\.profiles TO authenticated/)
  assert(grantMatch, 'could not find the column-level GRANT UPDATE (...) ON public.profiles TO authenticated')

  const granted = grantMatch[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  assertEquals(granted.sort(), [...STANDARD_COLUMNS].sort())

  for (const word of BILLING_WORDS) {
    assert(
      !granted.some((col) => col.toLowerCase().includes(word)),
      `the attribution grant must never include a billing-sounding column ("${word}" matched "${granted.find((c) => c.toLowerCase().includes(word))}")`,
    )
  }
})

Deno.test('0004 defines distribution_facts with exactly the contract columns, in order', async () => {
  const sql = await Deno.readTextFile(VIEW_PATH)
  const viewMatch = sql.match(/CREATE OR REPLACE VIEW public\.distribution_facts[\s\S]*?AS\s*\nSELECT([\s\S]*?)FROM public\.profiles/)
  assert(viewMatch, 'could not find the CREATE OR REPLACE VIEW public.distribution_facts ... SELECT ... FROM public.profiles block')

  // Pull the trailing "AS <alias>" (or bare column) off each top-level SELECT line.
  const selectBody = viewMatch[1]
  const aliases = [...selectBody.matchAll(/AS\s+([a-z_]+)\s*(?:,|$)/gim)].map((m) => m[1])

  assertEquals(aliases, DISTRIBUTION_FACTS_COLUMNS)
})

Deno.test('0004 marks first_result_at and paid_at as placeholders the product must fill in', async () => {
  const sql = await Deno.readTextFile(VIEW_PATH)
  assert(sql.includes('{{FIRST_RESULT_AT_EXPRESSION}}'), 'first_result_at must carry a clearly marked placeholder')
  assert(sql.includes('{{PAID_AT_EXPRESSION}}'), 'paid_at must carry a clearly marked placeholder')
  assert(/NULL::timestamptz\s+AS first_result_at/.test(sql), 'first_result_at must default to NULL until the product defines it')
  assert(/NULL::timestamptz\s+AS paid_at/.test(sql), 'paid_at must default to NULL until the product defines it')
})

Deno.test('0004 locks distribution_facts to service_role only', async () => {
  const sql = await Deno.readTextFile(VIEW_PATH)
  assert(
    /REVOKE ALL ON public\.distribution_facts FROM PUBLIC, anon, authenticated/.test(sql),
    'distribution_facts must revoke all access from PUBLIC, anon and authenticated',
  )
  assert(
    /GRANT SELECT ON public\.distribution_facts TO service_role/.test(sql),
    'distribution_facts must grant SELECT to service_role',
  )
})

Deno.test('0004 grants its own referrer_host() helper only to service_role', async () => {
  const sql = await Deno.readTextFile(VIEW_PATH)
  assert(
    /REVOKE ALL ON FUNCTION public\.referrer_host\(text\) FROM PUBLIC, anon, authenticated/.test(sql),
    'referrer_host() must revoke execute from PUBLIC, anon and authenticated',
  )
  assert(
    /GRANT EXECUTE ON FUNCTION public\.referrer_host\(text\) TO service_role/.test(sql),
    'referrer_host() must grant execute to service_role',
  )
})
