/**
 * Template: one-click unsubscribe from {{APP_NAME}} lifecycle email.
 * Copy to supabase/functions/unsubscribe/index.ts. Fill {{APP_NAME}}, {{BRAND_COLOR}}.
 *
 * SOURCE: carried over verbatim in behaviour from ChannelMover's
 * `supabase/functions/unsubscribe/index.ts` (live since 2026-08-25), itself ported
 * from SignalScore's already-deployed unsubscribe function.
 *
 * No login, no confirmation step, no "are you sure". Roger, 2026-08-24: "we do not
 * bother anyone that doesn't want to be bothered." A person who clicks unsubscribe
 * has already decided, and making them work for it is hostile.
 *
 * Accepts GET (the footer link) and POST (RFC 8058 List-Unsubscribe-Post, which is
 * what the one-click button in Gmail and Outlook fires). Both suppress.
 *
 * Public on purpose: it is a link in an email, so there is no session to check. The
 * only credential is the token, and a token only ever suppresses. It cannot read
 * anything back out, and it cannot un-suppress.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SB_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
)

const BRAND = '{{BRAND_COLOR}}'
const FONT = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif"

function page(title: string, body: string, status = 200): Response {
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    '<title>{{APP_NAME}}</title></head>' +
    '<body style="margin:0;padding:0;background:#f4f4f5;font-family:' + FONT + ';">' +
    '<table role="presentation" width="100%" style="background:#f4f4f5;"><tr><td align="center" style="padding:64px 16px;">' +
    '<table role="presentation" width="480" style="max-width:480px;width:100%;">' +
    '<tr><td align="center" style="padding-bottom:28px;font-size:20px;font-weight:700;color:' + BRAND + ';letter-spacing:-0.02em;">' +
    '{{APP_NAME}}' +
    '</td></tr>' +
    '<tr><td style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:36px 32px;">' +
    '<h1 style="margin:0 0 12px;font-size:20px;color:#18181b;">' + title + '</h1>' +
    '<p style="margin:0;font-size:15px;color:#3f3f46;line-height:1.6;">' + body + '</p>' +
    '</td></tr></table></td></tr></table></body></html>'
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const token = new URL(req.url).searchParams.get('t') ?? ''
  // A malformed token must never be treated as "no match, nothing to do" — that
  // would report success while the person stays subscribed.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return page(
      'That link is incomplete',
      'This unsubscribe link is missing part of its address. Reply to the email instead and we will take you off the list by hand.',
      400,
    )
  }

  const { data: pref, error } = await admin
    .from('email_preferences')
    .select('user_id, suppressed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (error) {
    console.error('unsubscribe lookup failed:', error.message)
    return page('Something went wrong', 'Please try again in a moment.', 500)
  }
  if (!pref) {
    return page('That link is no longer valid', 'This unsubscribe link does not belong to an account any more.', 404)
  }

  // Already suppressed: same answer as the first time, so a second click is never
  // an error and the browser back button cannot produce one.
  if (!pref.suppressed_at) {
    const { error: upErr } = await admin
      .from('email_preferences')
      .update({ suppressed_at: new Date().toISOString(), suppressed_reason: 'unsubscribe' })
      .eq('user_id', pref.user_id)
    if (upErr) {
      console.error('unsubscribe write failed:', upErr.message)
      return page('Something went wrong', 'Please try again in a moment.', 500)
    }
  }

  return page(
    'You are unsubscribed',
    'We will not email you again. Your {{APP_NAME}} account stays exactly as it is, and the emails you need to sign in still work.',
  )
})
