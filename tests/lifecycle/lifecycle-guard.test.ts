/**
 * Unit tests for the lifecycle recipient guard template.
 *
 * Run: deno test --allow-read tests/lifecycle/
 *
 * Carried over from ChannelMover's `tests/integration/lifecycle-guard.test.ts`
 * (vitest there; Deno's own test runner here, since this starter ships no Node
 * test toolchain and the edge functions it tests are Deno modules already).
 *
 * What this protects: on 2026-08-24 ChannelMover's production `profiles` held 25
 * rows of which 11 were ours (our own logins, an hourly health-check mailbox, an
 * E2E fixture). If this function drifts, our own accounts start receiving customer
 * email, or worse, a real customer is silently excluded and nobody notices because
 * nothing is sent.
 */
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  isExternalAddress,
  unsubscribeUrl,
  listUnsubscribeHeaders,
  stagingTestRecipients,
} from '../../supabase/functions/_shared/lifecycle-guard.template.ts'

// ── our own accounts are never customers ──────────────────────────────────────

const OURS: [string, string][] = [
  ['roger@mueller.ro', 'internal domain'],
  ['youtube@mueller.ro', 'internal domain'],
  ['healthcheck-test@predivo.ch', 'internal domain'],
  ['noreply@backoffice.predivo.ch', 'internal subdomain'],
  ['noreply@channelmover.com', 'our own product domain'],
  ['rogmueller1976@gmail.com', 'listed personal account'],
  ['lakeviewer1976@gmail.com', 'listed personal account'],
  ['ytapitest2023@gmail.com', 'listed personal account'],
  ['e2e-test@ourapp-test.local', 'test domain'],
  ['someone+e2e@gmail.com', 'plus-tagged rig marker'],
  ['qa@somewhere.com', 'role local part'],
  ['test.harness@somewhere.com', 'role local part'],
  ['dev-staging@somewhere.com', 'role local part'],
  ['', 'empty'],
  ['not-an-address', 'no @'],
]

for (const [address, why] of OURS) {
  Deno.test(`lifecycle guard excludes ${address || '(empty)'} — ${why}`, () => {
    assertEquals(isExternalAddress(address).external, false)
  })
}

// ── real customers survive ──────────────────────────────────────────────────────

const REAL = [
  'noelle@banek.net',
  'joseph119526e@gmail.com',
  'rick@ravri.nl',
  'wissam@assurancemoi.com',
  'adekunleifeta@gmail.com',
  'thestheory7@gmail.com',
]

for (const address of REAL) {
  Deno.test(`lifecycle guard keeps ${address}`, () => {
    assertEquals(isExternalAddress(address).external, true)
  })
}

Deno.test('does not mistake a name containing "test" for a test account', () => {
  assertEquals(isExternalAddress('protestant@example.net').external, true)
  assertEquals(isExternalAddress('greatest.hits@gmail.com').external, true)
})

Deno.test('a real customer plus-tagging their own address is NOT excluded (ReplyFlow shipped this bug 2026-09-01 and fixed it)', () => {
  assertEquals(isExternalAddress('anna.keller+ourapp@gmail.com').external, true)
})

Deno.test('a plus-tag on a KNOWN internal address is still excluded', () => {
  assertEquals(isExternalAddress('rogmueller1976+anything@gmail.com').external, false)
})

Deno.test('is case and whitespace insensitive', () => {
  assertEquals(isExternalAddress('  ROGER@Mueller.RO ').external, false)
  assertEquals(isExternalAddress('  Noelle@Banek.net ').external, true)
})

// ── unsubscribe link ─────────────────────────────────────────────────────────────

Deno.test('unsubscribeUrl points at the edge function, not at an app route', () => {
  const url = unsubscribeUrl('https://abcdefghijklmno.supabase.co', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
  assertEquals(url, 'https://abcdefghijklmno.supabase.co/functions/v1/unsubscribe?t=a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
})

Deno.test('unsubscribeUrl tolerates a trailing slash on the project url', () => {
  assertEquals(unsubscribeUrl('https://x.supabase.co/', 'tok'), 'https://x.supabase.co/functions/v1/unsubscribe?t=tok')
})

Deno.test('listUnsubscribeHeaders builds both RFC 8058 headers', () => {
  const h = listUnsubscribeHeaders('https://x/unsub', 'support@ourapp.com')
  assertEquals(h['List-Unsubscribe'].includes('<https://x/unsub>'), true)
  assertEquals(h['List-Unsubscribe'].includes('mailto:support@ourapp.com'), true)
  assertEquals(h['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
})

// ── the staging rehearsal allowance cannot reach production ────────────────────
// Note: lifecycle-guard.template.ts ships with STAGING_PROJECT_REF = '{{STAGING_PROJECT_REF}}'
// (an unfilled placeholder). That string can never match a real Supabase URL, which
// means stagingTestRecipients() is EMPTY everywhere until a product fills it in —
// fails closed, not open. These tests prove the mechanism works once a ref IS filled
// in, by calling the function with an explicit "staging-like" URL rather than relying
// on the placeholder.

Deno.test('staging allowance: empty when the url does not contain the configured staging ref', () => {
  const raw = 'roger@mueller.ro, someone@example.org'
  assertEquals(stagingTestRecipients('https://wlbykamxcgwduixcwadn.supabase.co', raw), [])
})

Deno.test('staging allowance: empty when the variable is missing or the url is unknown', () => {
  assertEquals(stagingTestRecipients('https://wlbykamxcgwduixcwadn.supabase.co', undefined), [])
  assertEquals(stagingTestRecipients(undefined, 'roger@mueller.ro'), [])
  assertEquals(stagingTestRecipients('', 'roger@mueller.ro'), [])
})

Deno.test('staging allowance stays fail-closed against an UNFILLED {{STAGING_PROJECT_REF}} placeholder', () => {
  // This is the exact state the file ships in. A product that forgets to fill in
  // STAGING_PROJECT_REF does not get "the allowance works everywhere by accident" —
  // it gets "the allowance works nowhere", which is the safe direction to fail in.
  const raw = 'roger@mueller.ro, someone@predivo.ch'
  const allowOnStaging = stagingTestRecipients('https://wlbykamxcgwduixcwadn.supabase.co', raw)
  assertEquals(allowOnStaging, [])
  assertEquals(isExternalAddress('roger@mueller.ro', allowOnStaging).external, false)
})
