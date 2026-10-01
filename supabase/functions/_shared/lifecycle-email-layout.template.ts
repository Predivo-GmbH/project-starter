/**
 * Template: the shared HTML shell for {{APP_NAME}} lifecycle emails.
 * Copy to supabase/functions/_shared/lifecycle-email-layout.ts.
 *
 * Implements `standards/email-template-standard.md` (canonical — read it there, not
 * here: Outlook conditional comments, array .join() construction, no template
 * literals, no <style> blocks, inline styles only). Fill {{APP_NAME}}, {{BRAND_COLOR}},
 * {{ICON_URL}}, {{APP_DOMAIN}}.
 *
 * "Plain text" (the lifecycle-email rule in
 * docs/PLAN-distribution-built-into-every-new-product-2026-10-01.md section E) means
 * ONE heading, ONE short paragraph, ONE button, no images beyond the small app icon,
 * no marketing flourish — not literally text/plain MIME. Every render() in
 * lifecycle-tick/events.template.ts should stay inside that shape.
 */

const BRAND = '{{BRAND_COLOR}}'
const FONT = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif"

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/** Outlook-compatible centered CTA button. Array .join('') — no template literals. */
export function button(text: string, href: string): string {
  return [
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:24px auto 0;">',
    '<tr><td align="center" style="border-radius:8px;background:' + BRAND + ';mso-padding-alt:14px 40px;">',
    '<a href="' + href + '" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;mso-line-height-rule:exactly;">',
    '<!--[if mso]>&nbsp;&nbsp;&nbsp;<![endif]-->',
    escapeHtml(text),
    '<!--[if mso]>&nbsp;&nbsp;&nbsp;<![endif]-->',
    '</a></td></tr></table>',
  ].join('')
}

/** Escapes a user- or product-provided string before it goes into HTML. */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Wraps one heading + body HTML (already escaped by the caller) + an optional button
 * block in the full XHTML card, plus the footer and unsubscribe line every lifecycle
 * email must carry (fleet rule: an unsubscribe on every single email).
 */
export function layout(heading: string, bodyHtml: string, buttonHtml: string, unsubscribeUrl: string): string {
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<title>' + escapeHtml('{{APP_NAME}}') + '</title></head>',
    '<body style="margin:0;padding:0;background:#f4f4f5;font-family:' + FONT + ';">',
    '<table role="presentation" width="100%" style="background:#f4f4f5;"><tr><td align="center" style="padding:40px 16px;">',
    '<table role="presentation" width="480" style="max-width:480px;width:100%;"><tr><td align="center" style="padding-bottom:28px;">',
    '<img src="{{ICON_URL}}" width="28" height="28" style="border-radius:6px;vertical-align:middle;" alt=""/>',
    '<span style="font-size:20px;font-weight:700;color:' + BRAND + ';letter-spacing:-0.02em;vertical-align:middle;padding-left:10px;">' + escapeHtml('{{APP_NAME}}') + '</span>',
    '</td></tr>',
    '<tr><td style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:36px 32px;">',
    '<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#18181b;">' + escapeHtml(heading) + '</h1>',
    '<div style="margin:0;font-size:15px;color:#3f3f46;line-height:1.6;">' + bodyHtml + '</div>',
    buttonHtml,
    '</td></tr>',
    '<tr><td align="center" style="padding-top:24px;">',
    '<p style="margin:0;font-size:12px;color:#a1a1aa;">&copy; ' + new Date().getFullYear() + ' ' + escapeHtml('{{APP_NAME}}') + '</p>',
    '<p style="margin:4px 0 0;font-size:12px;">',
    '<a href="' + unsubscribeUrl + '" style="color:#a1a1aa;text-decoration:underline;">Unsubscribe</a>',
    '</p>',
    '</td></tr></table></td></tr></table></body></html>',
  ].join('\n')
}

/**
 * One call builds subject + html + text for a lifecycle email of the standard one
 * heading / one paragraph / one button shape. `ctaText`/`ctaUrl` are optional — a few
 * default events (e.g. "payment failed") may not need a button at all.
 */
export function lifecycleEmail(args: {
  subject: string
  heading: string
  body: string
  ctaText?: string
  ctaUrl?: string
  unsubscribeUrl: string
}): EmailTemplate {
  const bodyHtml = '<p style="margin:0;">' + escapeHtml(args.body) + '</p>'
  const buttonHtml = args.ctaText && args.ctaUrl ? button(args.ctaText, args.ctaUrl) : ''
  return {
    subject: args.subject,
    html: layout(args.heading, bodyHtml, buttonHtml, args.unsubscribeUrl),
    text: args.heading + '\n\n' + args.body +
      (args.ctaText && args.ctaUrl ? '\n\n' + args.ctaText + ': ' + args.ctaUrl : '') +
      '\n\nUnsubscribe: ' + args.unsubscribeUrl,
  }
}
