# Lifecycle email — fill-in-the-blanks guide

Every new product ships follow-up email after sign-up from day one (Roger, 2026-10-01:
"what has been totally underestimated is the email follow-up when they register... if
they start a demo, when it ends... this also could generate real buys"). This is the
reusable machinery, extracted from ChannelMover's working setup (live in production
since 2026-08-25 — `C:\Business\Internal Projects\ChannelMover\docs\CLOSEOUT-lifecycle-email-LIVE-2026-08-25.md`)
and generalised so any product can drop it in.

**The default event map** — what triggers which email, and the safety rules — is
`docs/PLAN-distribution-built-into-every-new-product-2026-10-01.md` section E. Read that
first; this file is the how, not the why.

**Canonical standards this machinery implements — read there, don't copy here:**
- `C:\Business\Internal Projects\standards\FLEET_TRANSACTIONAL_EMAIL_POSTMARK.md` — the
  shared Postmark account, per-product server, DNS, test-traffic routing.
- `C:\Business\Internal Projects\standards\email-template-standard.md` — the HTML shell
  every lifecycle email renders through (`_shared/lifecycle-email-layout.ts`).

## 1. What's in this starter

```
supabase/functions/_shared/lifecycle-guard.template.ts         who may be emailed (internal-account filter, staging test-recipient allowance, unsubscribe link)
supabase/functions/_shared/lifecycle-email-layout.template.ts  the branded HTML/text shell, per email-template-standard.md
supabase/functions/_shared/lifecycle-send.template.ts          the ONE path a lifecycle email can go out through
supabase/functions/lifecycle-tick/index.template.ts            the engine — generic, do not edit per product
supabase/functions/lifecycle-tick/events.template.ts           the DATA — your event map, your facts, your copy
supabase/functions/unsubscribe/index.template.ts                one-click unsubscribe
supabase/functions/postmark-webhook/index.template.ts           bounce/complaint suppression
supabase/migrations/0001_lifecycle_email.sql.template           tables + grants + RLS + backfill seed
supabase/migrations/0002_lifecycle_tick_cron.sql.template       pg_cron, every 5 minutes
tests/lifecycle/*.test.ts                                       unit tests (deno test), run them before you ship
```

**What ChannelMover has that this does NOT carry over, deliberately:**
- `withTransientRetry` around the kill-switch/preferences reads. That hardening came
  from two specific Supabase incidents on one project (Sentry CHANNELMOVER-5 and -8,
  2026-09-01/08) — real, but not one of the day-one safety properties the plan asks
  for. Add it later if you hit the same class of transient read failure; never wrap
  the claim INSERT itself (see the comment in `lifecycle-send.template.ts`).
- Capturing the Postmark message id onto the ledger row. The starter's
  `email.template.ts.sendEmail()` returns `void`; ChannelMover's returns the id. If you
  want `lifecycle_emails.postmark_id` populated, change your `sendEmail()` to return
  the id and add one `.update()` call back in `lifecycle-send.ts` — see the comment
  there for exactly where.
- Reply-To / `List-Unsubscribe` headers actually reaching Postmark. The starter's
  `sendEmail()` doesn't thread through custom headers today; ChannelMover's Postmark
  HTTP-API branch does. Fix this before you rely on the unsubscribe header buttons in
  Gmail/Outlook — see "what a new product still has to do" below.

## 2. Copying it into your product

All of these files cross-reference each other by their **final** (post-copy) names.
Today, in this starter, they still carry the `.template.ts` extension on both the
filename and on every sibling import inside them, so `deno test` can run them in
place with no workarounds. Copy and fix both in one sweep:

```bash
# from your product repo root, after copying the directories over:
for f in $(grep -rl '\.template\.ts' supabase/functions/_shared/lifecycle-*.template.ts \
                                       supabase/functions/lifecycle-tick/*.template.ts); do
  sed -i "s/\.template\.ts'/\.ts'/g" "$f"   # fix sibling import specifiers
done
for f in supabase/functions/_shared/lifecycle-*.template.ts \
         supabase/functions/lifecycle-tick/*.template.ts \
         supabase/functions/unsubscribe/*.template.ts \
         supabase/functions/postmark-webhook/*.template.ts; do
  mv "$f" "${f%.template.ts}.ts"           # drop .template from the filename
done
```

Then fill in every `{{PLACEHOLDER}}` (`{{APP_NAME}}`, `{{APP_DOMAIN}}`, `{{BRAND_COLOR}}`,
`{{ICON_URL}}`, `{{SUPPORT_EMAIL}}`, `{{STAGING_PROJECT_REF}}`) the same way you already
do for `email.template.ts` / `cors.template.ts`.

Rename the two migrations to your project's own timestamp convention and run them in
order (`0001` before `0002` — the cron migration assumes the tables already exist).

## 3. What you must write by hand — `events.ts`

The engine (`lifecycle-tick/index.ts`) never changes per product. Everything
product-specific lives in `events.ts`:

1. **`collectUserSnapshots(admin)`** — the one function with no default. Read your own
   schema (subscriptions, demo sessions, checkout sessions, whatever you have) and
   return one `LifecycleFacts` object per user: a flat set of dates (`signedUpAt`,
   `setupCompletedAt`, `paidAt`, ...). Keep it a pure read — no sends, no writes — so
   it stays safe to call every 5 minutes.
2. **Every `render()`** — replace the `TODO [default]` subject lines and body copy with
   real words. **Nothing goes out until Roger has seen the real text in his own
   inbox** (ChannelMover's rule, 2026-08-24, unchanged). Keep each one "plain text" per
   the plan: one heading, one short paragraph, one button, no images beyond the app
   icon, no discount without his sign-off.
3. **Timings you actually need.** The default map is the plan's section E, literally.
   If your product has no trial, delete `trial_ending`/`trial_ended`. If a step needs
   a different day count, change the number — the pattern (`isDue`, `wasSent`) is
   covered by `tests/lifecycle/events.test.ts`; copy its shape for anything you add.
4. **Keep `LIFECYCLE_STEP_KEYS` and the migration's backfill list in sync.** A step
   added to the event map but missing from the migration's `VALUES (...)` backfill
   list will retroactively fire for every user who existed before you shipped it.
   `tests/lifecycle/backfill-seeding.test.ts` checks this for the default map; if you
   add a migration AFTER go-live to add a new step, write the equivalent backfill
   INSERT yourself and extend that test.

### Why one step key per timing, not a mutable counter

ReplyFlow's variant (`supabase/migrations/037_lifecycle_email_infra.sql`,
`send-lifecycle-nudges/index.ts`) uses `unique(user_id, email_type)` plus a
`sent_count` the cron increments, so a whole cadence (day 1/3/7) lives in one row and
the cron recomputes "how many of the 3 are due" every run. This starter follows
ChannelMover instead: each timing gets its own step key (`stuck_day1`, `stuck_day3`,
`stuck_day7`), each a plain once-ever row. More rows, but the once-per-person
guarantee is a database constraint (two partial unique indexes, migration 0001)
instead of re-derived application logic — which is exactly the gap that let a stale
deploy double-email a ChannelMover customer on 2026-08-25
(`ChannelMover/docs/INCIDENTS.md`).

## 4. Proving it on staging before a customer ever sees it

1. Deploy with `lifecycle_config.enabled = false` (the migration's default). Nothing
   can send yet, however the tick evaluates.
2. **Dry run first.** With the switch off, invoking `lifecycle-tick` by hand still
   returns `skipped` with a `:disabled` reason for every candidate — that is how you
   see who WOULD be emailed before anyone is.
3. Set the edge secret `LIFECYCLE_TEST_RECIPIENTS` on the **staging** project only, to
   a comma-separated list containing a real mailbox you read (e.g. `roger@mueller.ro`).
   This is keyed to `{{STAGING_PROJECT_REF}}` inside `lifecycle-guard.ts` — setting the
   same variable on production does nothing, by construction (see
   `tests/lifecycle/lifecycle-guard.test.ts`, "stays fail-closed").
4. Flip `lifecycle_config.enabled = true` **on staging**, seed or fast-forward a test
   account into each state you want to prove, invoke the tick, and read the real send
   in that mailbox. Do this for every event in your map before launch — the plan's
   rule is "follow-up emails tested with real sends to the staging test inbox," not
   "the code looks right."
5. Only then flip `enabled = true` on production, and point the Postmark server's
   bounce + spam-complaint webhooks at `.../functions/v1/postmark-webhook?s=<secret>`
   (`POSTMARK_WEBHOOK_SECRET` edge secret) per the Postmark standard.

## 5. The one-line kill switch

```sql
UPDATE public.lifecycle_config SET enabled = false;
```

Checked first, inside `sendLifecycle()`, before anything else — including before the
internal-account filter and before the ledger claim. No deploy, no commit, nobody who
knows the codebase required.

## 6. How the numbers are measured

Per the plan (section E): **sent, did the next step within 7 days, paid within 30
days** — per email, not per product. `lifecycle_emails` gives you `sent` directly
(group by `step`, count). "Next step" and "paid within 30 days" are a join against
your own product's own activity/billing tables, keyed by `lifecycle_emails.user_id`
and `sent_at`; this starter does not build that join because it depends entirely on
what "the next step" means for your product. The Cockpit's per-product Distribution
view (plan section G) is where this is meant to surface across the fleet — that view
is tracked separately and is not part of this starter.

## 7. What a new product still has to do by hand

- Write `collectUserSnapshots()` against its real schema (no default exists).
- Write the real subject lines and body copy for every event it keeps, and get
  Roger's sign-off on the text before any real send.
- Decide which default events it needs at all (delete the rest from `events.ts` and
  from the migration's backfill list together).
- Add Reply-To + `List-Unsubscribe` header support to its own `sendEmail()` if it
  wants the one-click unsubscribe button to work in Gmail/Outlook (see §1).
- Add its own Postmark server + domain (if not already onboarded) and wire the bounce
  webhook, per `FLEET_TRANSACTIONAL_EMAIL_POSTMARK.md`.
- Seed the Vault secrets `supabase_url` / `service_role_key` before applying migration
  0002, if this is the project's first pg_cron job.
- Decide, if it adds a product-specific secondary key (a demo id, an invoice id)
  instead of using purely account-level steps, whether `lifecycle_emails.context_id`
  should cascade or null out when that row is deleted — ChannelMover shipped the
  wrong default first and had to fix it in production (§1 of this file's sibling
  comment in migration 0001).
