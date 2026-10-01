/**
 * Template: Postmark bounce and spam-complaint webhook for {{APP_NAME}}.
 * Copy to supabase/functions/postmark-webhook/index.ts.
 *
 * SOURCE: carried over from ChannelMover's `supabase/functions/postmark-webhook/index.ts`
 * (live since 2026-08-25). ONE CHANGE FROM THE SOURCE: ChannelMover looks up the
 * bounced address in its own `profiles` table, which this starter cannot assume
 * every product has. Instead `email_preferences` carries its own denormalized,
 * lowercased `email` column (see migration 0001), kept in sync by the same
 * auth.users trigger that creates the row — so this function has no dependency on
 * your product's schema at all.
 *
 * Until something like this exists, a bounce is invisible: an address that no
 * longer accepts mail keeps receiving lifecycle email forever, quietly burning the
 * sending domain's reputation. "Absence is not fine" applies to mail.
 *
 * A hard bounce or a spam complaint suppresses that person permanently. A soft
 * bounce does not: a full mailbox or a one-off transient failure is not a reason to
 * stop writing to somebody.
 *
 * Auth: a shared secret in the query string, compared in constant time. Postmark
 * cannot sign its webhooks, so the URL itself is the credential, which is why it is
 * checked before the body is even read and why the secret lives in an edge secret
 * (`POSTMARK_WEBHOOK_SECRET`) rather than in this file. Wire the URL
 * `https://<project-ref>.supabase.co/functions/v1/postmark-webhook?s=<secret>` into
 * the product's Postmark server as its BounceHookUrl (and SpamComplaint hook) per
 * `standards/FLEET_TRANSACTIONAL_EMAIL_POSTMARK.md`.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FN = 'postmark-webhook'

/** Constant-time compare, so a wrong secret cannot be found one character at a time. */
function secretMatches(given: string, expected: string): boolean {
  if (given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/**
 * Which Postmark events mean "never write to this address again".
 * Postmark's own type list is longer, but everything outside this set is either
 * temporary (SoftBounce, Transient, DnsError) or informational (Subscribe).
 */
const PERMANENT_BOUNCE_TYPES = new Set([
  'HardBounce',
  'SpamNotification',
  'SpamComplaint',
  'BadEmailAddress',
  'ManuallyDeactivated',
  'Unsubscribe',
])

interface PostmarkHook {
  RecordType?: string
  Type?: string
  Email?: string
  Recipient?: string
  Inactive?: boolean
  Description?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const expected = Deno.env.get('POSTMARK_WEBHOOK_SECRET') ?? ''
  const given = new URL(req.url).searchParams.get('s') ?? ''
  if (!expected || !secretMatches(given, expected)) {
    // No detail in the response: an unauthenticated caller learns nothing.
    return new Response('Unauthorized', { status: 401 })
  }

  let hook: PostmarkHook
  try {
    hook = await req.json()
  } catch (err) {
    console.error(`[${FN}] parse_body failed: ${err instanceof Error ? err.message : String(err)}`)
    return new Response('Bad request', { status: 400 })
  }

  const email = (hook.Email ?? hook.Recipient ?? '').trim().toLowerCase()
  const recordType = hook.RecordType ?? ''
  const bounceType = hook.Type ?? ''

  // SpamComplaint arrives as its own RecordType with no Type field.
  const permanent =
    recordType === 'SpamComplaint' ||
    (recordType === 'SubscriptionChange' && hook.Inactive === true) ||
    PERMANENT_BOUNCE_TYPES.has(bounceType)

  if (!email || !permanent) {
    // Acknowledged and ignored on purpose: a 200 stops Postmark retrying an event
    // we have decided not to act on.
    return new Response(JSON.stringify({ ok: true, acted: false, recordType, bounceType }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SB_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  try {
    const { data: pref, error: lookupErr } = await admin
      .from('email_preferences')
      .select('user_id')
      .eq('email', email) // exact match on the denormalized, already-lowercased column
      .maybeSingle()

    if (lookupErr) throw lookupErr

    // A bounce for an address we do not know is still worth recording, but there is
    // no row to suppress. Never treat "no match" as a silent success.
    if (!pref) {
      console.error(`[${FN}] bounce_for_unknown_address: ${email} (${recordType}/${bounceType})`)
      return new Response(JSON.stringify({ ok: true, acted: false, reason: 'unknown address' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const reason = recordType === 'SpamComplaint' || bounceType === 'SpamNotification'
      ? 'spam_complaint'
      : 'hard_bounce'

    const { error: upErr } = await admin
      .from('email_preferences')
      .update({ suppressed_at: new Date().toISOString(), suppressed_reason: reason })
      .eq('user_id', pref.user_id)
    if (upErr) throw upErr

    console.log(`[${FN}] suppressed ${email} (${reason}, ${recordType}/${bounceType})`)
    return new Response(JSON.stringify({ ok: true, acted: true, reason }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(`[${FN}] suppress_bounced_address failed for ${email}: ${err instanceof Error ? err.message : String(err)}`)
    // 500 so Postmark retries: losing a bounce is how a dead address stays on the list.
    return new Response('Internal error', { status: 500 })
  }
})
