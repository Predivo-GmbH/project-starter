/**
 * Template: who may receive a {{APP_NAME}} lifecycle email, and how the unsubscribe
 * link for them is built.
 *
 * Copy to supabase/functions/_shared/lifecycle-guard.ts and fill {{STAGING_PROJECT_REF}}.
 *
 * SOURCE: this is a direct carry-over of ChannelMover's
 * `supabase/functions/_shared/lifecycle-guard.ts` (live in production since 2026-08-25),
 * which itself is a DELIBERATE LOCAL COPY of
 * `BackOffice/supabase/functions/_shared/project-users.ts:24-85` (`classifyEmail`),
 * not an import — edge functions cannot import across repos, and sharing code across
 * products means one deploy could change another product's behaviour. When the fleet's
 * domain list changes, every product carrying this file is updated by hand; that is the
 * intended cost.
 *
 * Three separate gates, in this order, because each one catches something the others
 * cannot:
 *
 *   1. isExternalAddress()  — is this a real customer at all, or one of our own
 *                             accounts (our logins, a health-check mailbox, an E2E
 *                             fixture)? None of those may ever receive lifecycle mail.
 *   2. email_preferences.suppressed_at — did they leave, or did we bounce?
 *   3. lifecycle_config.enabled        — is the whole system switched on?
 *
 * Over-excluding hides a real customer, so every pattern is anchored rather than
 * clever: "test" matches testing@ and qa-test@ but not "protestant@". Plus-tagging is
 * NOT by itself evidence of a test account (ReplyFlow shipped that bug and un-shipped
 * it 2026-09-01: a customer who signs up as `anna+ourproduct@gmail.com` is still a
 * customer). Only a plus-tag on an address ALREADY on the internal list, or a tag that
 * is itself a rig marker (+e2e, +test, ...), is excluded.
 */

/** Domains we own or use for testing. Anything here is ours, never a customer.
 *  Add a new fleet product's domain here when it starts sending lifecycle mail. */
const INTERNAL_DOMAINS = [
  'mueller.ro',
  'predivo.ch',
  'signalscore.ch',
  'channelmover.com',
  'replyflow.help',
  'scoutcopilot.com',
  'valrano.com',
  'arivioo.com',
  'boatbuddy.predivo.ch',
  'launchready.predivo.ch',
  'distributionos.predivo.ch',
  'ytmigration.com',
  'example.com',
  'example.org',
  'mailinator.com',
  // TODO: add '{{APP_DOMAIN}}' here too — your own staff accounts on your own domain
  // are still "ours", not customers.
]

/**
 * Roger's own accounts on consumer providers. These cannot be caught by a domain or
 * a pattern rule, so they are listed. Add here when a new one appears.
 */
const INTERNAL_ADDRESSES = [
  'rogmueller1976@gmail.com',
  'lakeviewer1976@gmail.com',
  'rogmueindia@gmail.com',
  'ytapitest2023@gmail.com',
  'testcws122@gmail.com',
  'signalscore.test@gmail.com',
]

/** Local-part markers for rigs and role accounts, anchored so real names survive. */
const INTERNAL_LOCAL_PART =
  /(^|[.\-_+])(e2e|healthcheck|health-check|test|tests|qa|demo|dummy|noreply|no-reply|eval|staging|fixture|seed)([.\-_+0-9]|$)/i

export interface AddressCheck {
  external: boolean
  reason: string
}

/**
 * The STAGING project ref. The rehearsal allowance below is keyed to it, so that on
 * production the allowance is not "switched off", it is unreachable: the env var can
 * be set there by accident and still do nothing.
 */
const STAGING_PROJECT_REF = '{{STAGING_PROJECT_REF}}'

/**
 * Addresses that may receive lifecycle mail on STAGING even though the rules above
 * call them ours. Without this there is no way to watch a real email travel the whole
 * path (tick, guard, ledger, Postmark, inbox) before it can do that to a customer,
 * because every mailbox we own is deliberately excluded.
 *
 * Set LIFECYCLE_TEST_RECIPIENTS as a comma-separated list on the staging project only.
 */
export function stagingTestRecipients(supabaseUrl: string | undefined, raw: string | undefined): string[] {
  if (!supabaseUrl || !supabaseUrl.includes(STAGING_PROJECT_REF)) return []
  return (raw ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

/** Is this address a real external customer? */
export function isExternalAddress(
  rawEmail: string | null | undefined,
  allowlist: string[] = [],
): AddressCheck {
  const email = (rawEmail ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { external: false, reason: 'no email address' }

  if (allowlist.includes(email)) return { external: true, reason: 'staging rehearsal allowlist' }

  const at = email.lastIndexOf('@')
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)

  if (INTERNAL_ADDRESSES.includes(email)) return { external: false, reason: 'known internal address' }
  if (INTERNAL_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) {
    return { external: false, reason: `internal domain ${domain}` }
  }
  // Test subdomains such as {{APP_SLUG}}-test.local.
  if (domain.endsWith('.local') || /-test\./.test(domain) || /^test\./.test(domain)) {
    return { external: false, reason: `test domain ${domain}` }
  }
  // A plus-tag is ours only if the address it hangs off is already on our list, or the
  // tag itself is a rig marker — see the header note. A real customer's plus-tag survives.
  if (local.includes('+')) {
    const base = `${local.slice(0, local.indexOf('+'))}@${domain}`
    if (INTERNAL_ADDRESSES.includes(base)) return { external: false, reason: `plus-tag on known internal address ${base}` }
  }
  if (INTERNAL_LOCAL_PART.test(local)) return { external: false, reason: 'test/role local part' }

  return { external: true, reason: 'external' }
}

/**
 * The unsubscribe link for a person.
 *
 * It points at the edge function directly rather than at an app route on purpose:
 * an unsubscribe that only works once a single-page app has booted is an unsubscribe
 * that can fail, and a footer link that does nothing is worse than no link at all.
 */
export function unsubscribeUrl(supabaseUrl: string, token: string): string {
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/unsubscribe?t=${token}`
}

/** RFC 8058 one-click headers, so Gmail and Outlook show a real unsubscribe button. */
export function listUnsubscribeHeaders(unsubUrl: string, supportEmail: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubUrl}>, <mailto:${supportEmail}?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}
