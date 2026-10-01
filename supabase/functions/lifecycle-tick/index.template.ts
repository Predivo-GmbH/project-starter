/**
 * Template: lifecycle-tick — the only thing that decides who gets a lifecycle email.
 * Copy to supabase/functions/lifecycle-tick/index.ts. This file is THE ENGINE: it
 * should not need product-specific edits. Everything a product customizes lives in
 * `events.ts` (the event map + `collectUserSnapshots`), which this file imports.
 *
 * SOURCE: generalised from ChannelMover's `supabase/functions/lifecycle-tick/index.ts`
 * (live since 2026-08-25). Runs every 5 minutes (migration 0002_lifecycle_tick_cron).
 * Service-role auth, same pattern as every other fleet cron function.
 *
 * WHY ONE TICK INSTEAD OF SENDING FROM INSIDE PRODUCT CODE.
 * ChannelMover's build plan originally called the send helper directly from inside
 * the workers that move customer data, for the "immediate" emails. That meant new
 * call sites inside the engine that does the product's actual job, to save a few
 * minutes of latency on an email. A five-minute tick reads the same states from the
 * outside and touches none of that code — "your trial started" arriving three
 * minutes later is worth nobody's core feature breaking because an email helper
 * threw. Keep that separation.
 *
 * Every decision here is safe to repeat: the ledger's unique index (migration 0001)
 * means a second evaluation of the same state sends nothing. A missed run, an
 * overlapping run, or a run that crashes half way through changes only WHEN an email
 * arrives, never whether it arrives twice.
 */
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// `.template.ts` extensions: see the note in lifecycle-send.template.ts. Rename this
// file and every import below together at copy time.
import { getCorsHeaders } from '../_shared/cors.template.ts'
import { sendLifecycle, lifecycleEnabled } from '../_shared/lifecycle-send.template.ts'
import { LIFECYCLE_EVENTS, collectUserSnapshots, type UserSnapshot } from './events.template.ts'

const FN = 'lifecycle-tick'

interface LedgerRow { user_id: string; step: string; context_id: string | null }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) })

  // Service-role only. SERVICE_ROLE_JWT first, because SUPABASE_SERVICE_ROLE_KEY may
  // be the newer sb_secret_ format, which some callers (pg_cron's http_post) need the
  // legacy JWT form for. Same chain as every other fleet cron function.
  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_JWT') ??
    (Deno.env.get('SB_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized — service role required' }), {
      status: 401,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const admin: SupabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    (Deno.env.get('SB_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) ?? '',
    { auth: { persistSession: false } },
  )

  const now = Date.now()
  const sent: Record<string, number> = {}
  const skipped: Record<string, number> = {}
  const record = (bucket: Record<string, number>, key: string) => {
    bucket[key] = (bucket[key] ?? 0) + 1
  }

  try {
    const enabled = await lifecycleEnabled(admin)

    // PostgREST applies a hard per-request row cap (supabase/config.toml max_rows,
    // default 1000) regardless of any .limit(), so a single read silently stops at
    // 1000 rows once the ledger grows past it. Page with .range() until a short page
    // comes back. (ChannelMover found this the hard way — see its lifecycle-tick
    // comment history — so it is built in here from day one instead of waiting to
    // rediscover it.)
    const PAGE = 1000
    const loadAllLedger = async (): Promise<LedgerRow[]> => {
      const out: LedgerRow[] = []
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await admin
          .from('lifecycle_emails')
          .select('user_id, step, context_id')
          .order('id', { ascending: true })
          .range(from, from + PAGE - 1)
        if (error) throw new Error(`load lifecycle_emails: ${error.message}`)
        const rows = (data ?? []) as LedgerRow[]
        out.push(...rows)
        if (rows.length < PAGE) break
      }
      return out
    }

    const [ledger, users] = await Promise.all([
      loadAllLedger(),
      collectUserSnapshots(admin),
    ])

    // Indexed once per tick: "has this exact step ever gone out to this person, for
    // ANY context_id". The default event map in events.template.ts is entirely
    // account-level (context_id null), but a product that scopes a step to e.g. one
    // demo session still gets "once ever" semantics here by design — narrower
    // per-context dedupe is what the ledger's own unique index (migration 0001) is for.
    const sentSteps = new Map<string, Set<string>>() // userId -> set of steps
    for (const row of ledger) {
      if (!sentSteps.has(row.user_id)) sentSteps.set(row.user_id, new Set())
      sentSteps.get(row.user_id)!.add(row.step)
    }
    // Steps sent earlier IN THIS RUN. Without this, a user whose facts satisfy two
    // events that both key off "no prior send of step X" could see both fire in one
    // pass even though the first should have been enough — mirrors ChannelMover's
    // `sentThisRun` guard for the same reason (the ledger snapshot above is read once
    // at the top, so a second evaluation inside the same run would not see it either).
    const sentThisRun = new Set<string>()

    for (const user of users) {
      const alreadySent = sentSteps.get(user.userId) ?? new Set<string>()
      const wasSent = (step: string) => alreadySent.has(step) || sentThisRun.has(`${user.userId}|${step}`)

      for (const event of LIFECYCLE_EVENTS) {
        if (wasSent(event.step)) continue
        const due = event.isDue({ facts: user.facts, now, wasSent })
        if (!due) continue

        const outcome = await sendLifecycle({
          admin,
          step: event.step,
          userId: user.userId,
          email: user.email,
          enabled,
          render: (unsub) => event.render(unsub, user.facts),
        })

        if (outcome.sent) {
          sentThisRun.add(`${user.userId}|${event.step}`)
          record(sent, event.step)
        } else {
          record(skipped, `${event.step}:${outcome.reason}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ ranAt: new Date(now).toISOString(), enabled, sent, skipped }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error(`[${FN}] tick_failed: ${err instanceof Error ? err.message : String(err)}`)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
