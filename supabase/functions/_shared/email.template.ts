/**
 * Shared transactional email module for {{APP_NAME}}.
 *
 * Sends over the SHARED FLEET POSTMARK ACCOUNT. Canonical setup docs (account, per-product
 * server, DNS, onboarding runbook): `standards/FLEET_TRANSACTIONAL_EMAIL_POSTMARK.md`.
 * Auth-side requirements (hook vs GoTrue SMTP, DMARC, verification): `standards/auth-flow-standard.md`.
 *
 * Do NOT wire a new product to raw Metanet SMTP "for now". One paid plan covers the whole
 * fleet (billing is per ACCOUNT by volume), so there is no cost argument for staying off it.
 *
 * Required edge secrets:
 *   SMTP_HOST=smtp.postmarkapp.com   SMTP_PORT=587
 *   SMTP_USER=<Postmark server token>  SMTP_PASS=<same server token>
 *   SMTP_FROM="{{APP_NAME}} <noreply@{{APP_DOMAIN}}>"
 *   METANET_SMTP_HOST / _PORT / _USER / _PASS   (test-traffic routing, see below)
 */

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

// ─── Config ──────────────────────────────────────────────────────────────────

interface SmtpConfig {
  hostname: string
  port: number
  username: string
  password: string
  from: string
}

function getSmtpConfig(): SmtpConfig {
  const hostname = Deno.env.get('SMTP_HOST')
  const port = Deno.env.get('SMTP_PORT')
  const username = Deno.env.get('SMTP_USER')
  const password = Deno.env.get('SMTP_PASS')
  const from = Deno.env.get('SMTP_FROM') ?? '{{APP_NAME}} <noreply@{{APP_DOMAIN}}>'

  if (!hostname || !port || !username || !password) {
    throw new Error('Missing SMTP configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)')
  }

  return { hostname, port: parseInt(port, 10), username, password, from }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * denomailer 1.6.0's quoted-printable encoder is buggy: it discards the
 * `data.replaceAll('=','=3D')` result, so '=' is never escaped and the output is invalid QP.
 * Gmail and Apple Mail tolerate it; classic Outlook mis-decodes it and strips inline styles,
 * so the email renders as unstyled grey boxes. Encode each MIME part as base64 instead and
 * pass them via `mimeContent`, which denomailer emits verbatim.
 */
function base64Part(mimeType: string, body: string): { mimeType: string; content: string; transferEncoding: string } {
  const bytes = new TextEncoder().encode(body)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return { mimeType, content: btoa(bin).replace(/.{1,76}/g, '$&\r\n'), transferEncoding: 'base64' }
}

// ─── Non-deliverable recipients (hard block) ─────────────────────────────────
//
// RFC 6761 reserved TLDs and RFC 2606 example.* domains are non-routable: mail to them
// ALWAYS hard-bounces with "Host or domain name not found". Our E2E and monitor probes only
// assert that the send path is deployed and does not 5xx — they never need a real message
// delivered. Sending anyway bounces, and because the Postmark account is SHARED across the
// fleet, one product's probe traffic drags EVERY product's sending reputation.
// Real incidents: ChannelMover bounce flood (676a113, 2026-08-13); ReplyFlow at a 44.4%
// account bounce rate from `*.replyflow-test.local` probes (2026-08-19).
const NON_DELIVERABLE_TLDS = ['.local', '.test', '.invalid', '.example']
const NON_DELIVERABLE_DOMAINS = ['example.com', 'example.net', 'example.org']
function isNonDeliverableRecipient(to: string): boolean {
  const domain = (to.trim().toLowerCase().split('@')[1] ?? '')
  if (!domain) return false
  return NON_DELIVERABLE_TLDS.some((tld) => domain.endsWith(tld)) ||
    NON_DELIVERABLE_DOMAINS.includes(domain)
}

// ─── Test-traffic routing (keep the paid quota for REAL mail) ────────────────
//
// Our own monitoring/E2E mail must not burn the shared fleet plan. When a Metanet mailbox is
// configured (METANET_SMTP_*), sends to known test recipients go through Metanet instead, so
// only real mail counts against Postmark. Everything defaults to Postmark.
// Deliberately keep ONE low-volume real send on Postmark as a live send-path canary, so a
// future Postmark break is caught by monitoring rather than by a customer.
// 'pmverify-' is listed because probing nonexistent pmverify-* mailboxes on 2026-07-19 put
// the shared account at a 100% bounce rate. NEVER verify by mailing an address that does not exist.
const TEST_RECIPIENT_PATTERNS = [
  '@{{APP_SLUG}}-test.local', // integration test-user domain (also blackholed above)
  '+e2e@',                    // any +e2e tagged test address
  'pmverify-',                // Postmark cutover/verification probes
]

function isTestRecipient(to: string): boolean {
  const addr = to.trim().toLowerCase()
  // Ops can extend the list without a redeploy via a comma-separated env var.
  const extra = (Deno.env.get('TEST_EMAIL_RECIPIENTS') ?? '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return [...TEST_RECIPIENT_PATTERNS, ...extra].some((p) => addr.includes(p))
}

function getMetanetConfig(from: string): SmtpConfig | null {
  const hostname = Deno.env.get('METANET_SMTP_HOST')
  const port = Deno.env.get('METANET_SMTP_PORT')
  const username = Deno.env.get('METANET_SMTP_USER')
  const password = Deno.env.get('METANET_SMTP_PASS')
  if (!hostname || !port || !username || !password) return null
  return { hostname, port: parseInt(port, 10), username, password, from }
}

// ─── Send ────────────────────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (isNonDeliverableRecipient(options.to)) {
    console.log(`[email] skipped non-deliverable recipient (nothing sent): ${options.to}`)
    return
  }

  const config = getSmtpConfig()
  const plain = options.text ?? options.subject
  const metanet = isTestRecipient(options.to) ? getMetanetConfig(config.from) : null

  // ── Postmark HTTP API path (real mail, default) ─────────────────────────────
  // Not SMTP: the Supabase edge runtime fatally 503s on the dynamic imports an SMTP STARTTLS
  // client needs, and Postmark has NO implicit-TLS (465) port — so a denomailer `tls: true`
  // client can never reach Postmark at all. The HTTP API needs no socket.
  if (!metanet && config.hostname === 'smtp.postmarkapp.com') {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': config.password,
      },
      body: JSON.stringify({
        From: config.from,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: plain,
        MessageStream: 'outbound',
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error('Postmark API ' + res.status + ': ' + detail.slice(0, 300))
    }
    return
  }

  // ── Metanet SMTP path (denomailer, implicit TLS 465) ────────────────────────
  // Used for our own test recipients, or before the product has been cut over.
  const smtp = metanet ?? config
  const client = new SMTPClient({
    connection: {
      hostname: smtp.hostname,
      port: smtp.port,
      tls: smtp.port === 465,
      auth: { username: smtp.username, password: smtp.password },
    },
  })

  try {
    await client.send({
      from: config.from,
      to: options.to,
      subject: options.subject,
      mimeContent: [
        base64Part('text/plain; charset="utf-8"', plain),
        base64Part('text/html; charset="utf-8"', options.html),
      ],
    })
  } finally {
    await client.close()
  }
}
