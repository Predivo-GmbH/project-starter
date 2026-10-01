/**
 * Template: the one and only way a {{APP_NAME}} lifecycle email is ever sent.
 * Copy to supabase/functions/_shared/lifecycle-send.ts. Fill {{SUPPORT_EMAIL}}.
 *
 * SOURCE: carried over from ChannelMover's `_shared/lifecycle-send.ts` (live in
 * production since 2026-08-25, see
 * `C:\Business\Internal Projects\ChannelMover\docs\CLOSEOUT-lifecycle-email-LIVE-2026-08-25.md`).
 * Generalised from ChannelMover's per-migration `LifecycleStep` union to a plain
 * `step: string`, because the event map is DATA each product fills in
 * `lifecycle-tick/events.template.ts`, not a fixed set known to this file.
 *
 * Nothing else may call sendEmail() for lifecycle mail. Everything that has to be
 * true before a customer hears from us lives here, in one place, in one order:
 *
 *   1. the kill switch is on
 *   2. the person is a real external customer, not one of our own accounts
 *   3. they have not unsubscribed and have not bounced
 *   4. they have not already had this exact email
 *
 * Step 4 is enforced by writing the ledger row BEFORE sending. A unique violation
 * (Postgres 23505, from the partial unique indexes in the lifecycle_email migration)
 * means it already went out, so the send is skipped. Doing it the other way round is
 * how a retry, or two overlapping ticks, becomes a second email in somebody's inbox —
 * exactly the defect recorded in ChannelMover's `docs/INCIDENTS.md` (2026-08-25:
 * a stale deployed build without this guard double-sent to one customer).
 *
 * DELIBERATELY NOT CARRIED OVER from ChannelMover: `withTransientRetry` around the
 * kill-switch and preferences reads. That hardening came from real incidents on a
 * specific Supabase project (two Sentry-tracked blips, 2026-09-01 and 2026-09-08) and
 * is a few lines to add later if this product hits the same class of transient read
 * failure — it is not one of the safety properties the plan requires on day one. Add
 * it the same way: wrap the two `.select()` reads below, never the claim INSERT.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// NOTE ON THESE THREE IMPORT PATHS: this file, like its siblings, is written and
// tested in place as `*.template.ts`, so every sibling import below uses the
// `.template.ts` extension that actually exists on disk TODAY. When you copy this
// whole set of files per docs/LIFECYCLE_EMAIL.md, rename every `*.template.ts` to
// `*.ts` AND drop the same `.template` suffix from these three import specifiers —
// the doc gives a one-line command that does both renames together.
import { sendEmail as sendEmailDefault } from './email.template.ts'
import { isExternalAddress, unsubscribeUrl, listUnsubscribeHeaders, stagingTestRecipients } from './lifecycle-guard.template.ts'
import type { EmailTemplate } from './lifecycle-email-layout.template.ts'

const FN = 'lifecycle-send'
const SUPPORT_EMAIL = '{{SUPPORT_EMAIL}}'

export type SendOutcome =
  | { sent: true }
  | { sent: false; reason: 'disabled' | 'already_sent' | 'suppressed' | 'internal' | 'no_email' | 'error' }

/** Is the whole system switched on? Read once per tick and passed in, not per send. */
export async function lifecycleEnabled(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin.from('lifecycle_config').select('enabled').maybeSingle()
  if (error) {
    // A failed read is NOT a green light. Absence of an answer is not permission.
    console.error(`[${FN}] read_kill_switch failed: ${error.message}`)
    return false
  }
  return data?.enabled === true
}

export interface SendArgs {
  admin: SupabaseClient
  step: string
  userId: string
  email: string
  /** Null for account-level steps; a product's own secondary key (e.g. a demo id,
   *  an invoice id) for steps scoped to something narrower than the whole person. */
  contextId?: string | null
  /** Built from the template with the person's own unsubscribe link. */
  render: (unsubUrl: string) => EmailTemplate
  /** Pass the value read once per run, so one flag read serves the whole tick. */
  enabled: boolean
  /** Injectable for tests. Defaults to the product's real sendEmail() — never
   *  pass this in production code; it exists so unit tests can exercise every
   *  guard above a real send without touching SMTP config, env vars or a network. */
  sendEmail?: typeof sendEmailDefault
}

export async function sendLifecycle(args: SendArgs): Promise<SendOutcome> {
  const { admin, step, userId, email, contextId = null, render, enabled, sendEmail = sendEmailDefault } = args

  if (!enabled) return { sent: false, reason: 'disabled' }
  if (!email) return { sent: false, reason: 'no_email' }

  // The allowlist resolves to an empty array anywhere but the staging project, so
  // this line cannot widen who gets email in production.
  const allowlist = stagingTestRecipients(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('LIFECYCLE_TEST_RECIPIENTS'),
  )
  const classification = isExternalAddress(email, allowlist)
  if (!classification.external) {
    console.log(`[${FN}] skipping ${step} for ${email}: ${classification.reason}`)
    return { sent: false, reason: 'internal' }
  }

  // Preferences: the token to build the unsubscribe link, and the suppression flag.
  const { data: pref, error: prefErr } = await admin
    .from('email_preferences')
    .select('unsubscribe_token, suppressed_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (prefErr) {
    console.error(`[${FN}] read_preferences failed for ${userId}/${step}: ${prefErr.message}`)
    return { sent: false, reason: 'error' }
  }
  // No row means no unsubscribe token, which means an email whose unsubscribe link
  // does not work. That is worse than not writing at all, so it is a hard stop.
  if (!pref) {
    console.error(`[${FN}] no email_preferences row for ${userId} (step ${step})`)
    return { sent: false, reason: 'error' }
  }
  if (pref.suppressed_at) return { sent: false, reason: 'suppressed' }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const unsubUrl = unsubscribeUrl(supabaseUrl, pref.unsubscribe_token as string)
  const template = render(unsubUrl)

  // Claim the send BEFORE sending it.
  const { data: claim, error: claimErr } = await admin
    .from('lifecycle_emails')
    .insert({ user_id: userId, step, context_id: contextId, subject: template.subject })
    .select('id')
    .single()

  if (claimErr) {
    // 23505 = unique_violation = this person has already had this email. Not an error.
    if ((claimErr as { code?: string }).code === '23505') return { sent: false, reason: 'already_sent' }
    console.error(`[${FN}] claim_send failed for ${userId}/${step}: ${claimErr.message}`)
    return { sent: false, reason: 'error' }
  }

  try {
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      // NOTE: the starter's email.template.ts sendEmail() does not thread through
      // replyTo/extra headers today. Add that if your product's sendEmail() supports
      // it (ChannelMover's does) — until then, Reply-To falls back to SMTP_FROM and
      // the List-Unsubscribe headers are not set. Treat this as a known gap, not a
      // silent one: see docs/LIFECYCLE_EMAIL.md "What a new product still has to do".
    })
    console.log(`[${FN}] sent ${step} to ${email}${contextId ? ` (context ${contextId})` : ''}`)
    return { sent: true }
  } catch (err) {
    // Release the claim so a later run can try again. Leaving it would silently
    // convert one failed send into "this person has been emailed", forever.
    await admin.from('lifecycle_emails').delete().eq('id', claim.id)
    console.error(`[${FN}] send_failed for ${userId}/${step}: ${err instanceof Error ? err.message : String(err)}`)
    return { sent: false, reason: 'error' }
  }
}

// Re-export so callers only need to import from one module for the common case.
export { SUPPORT_EMAIL, listUnsubscribeHeaders }
