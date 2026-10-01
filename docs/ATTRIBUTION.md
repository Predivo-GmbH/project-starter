# Sign-up source tracking — fill-in-the-blanks guide

Every new product records where each sign-up came from, from day one, in a
standard shape the Cockpit can read (Roger, 2026-10-01, approved distribution
plan, sections C4/E/G: `C:\Business\Templates\1-Person AI Business Playbook\docs\
PLAN-distribution-built-into-every-new-product-2026-10-01.md`). This is the
reusable machinery, generalised from ChannelMover's working setup (live since
2026-08-05/10) and from ReplyFlow's signup-form variant, so any product can drop
it in.

**Canonical standards this machinery touches — read there, don't copy here:**
- `C:\Business\Templates\1-Person AI Business Playbook\docs\PLAN-distribution-built-into-every-new-product-2026-10-01.md`
  — sections C4 (why), E (the event map this sits next to), G (the Cockpit's
  Distribution view, the reader of `distribution_facts`).

## 1. What's in this starter

```
supabase/migrations/0003_signup_source_tracking.sql.template   ALTER profiles + column-level grant (the 8 standard columns)
supabase/migrations/0004_distribution_facts_view.sql.template  THE CONTRACT the Cockpit reads: public.distribution_facts
src/lib/attribution.ts                                         capture, parse, storage, and the sync/prompt decision logic (pure, tested)
src/hooks/useAttributionSync.ts                                once-after-login sync onto profiles
src/components/attribution/HowHeardPrompt.tsx                  the one-tap "How did you hear about us?" modal
tests/attribution/attribution.test.ts                          unit tests (deno test) for the logic above
tests/attribution/distribution-facts-shape.test.ts             SQL shape test for the migrations' column contract
```

These files are plain `.ts`/`.tsx` (no `.template` suffix) — unlike the lifecycle
email machinery, there is nothing in them that must be renamed before `deno test`
can run; copy them in as-is. The two migrations ARE `.template.sql` — rename them
to your project's own migration-timestamp convention before applying, same as the
lifecycle email migrations.

## 2. Copying it into your product

1. Copy `src/lib/attribution.ts`, `src/hooks/useAttributionSync.ts` and
   `src/components/attribution/HowHeardPrompt.tsx` into your project at the same
   paths.
2. Copy the two migrations, renaming each to your own timestamp convention
   (`0003` before `0004` — the view's migration assumes `profiles` already has
   the columns from the first one).
3. **Precondition:** your product must already have a `public.profiles` table
   (`id uuid primary key references auth.users(id)`, the usual pattern). This
   starter ships no base `profiles` migration — only the auth template assumes
   one, same as this does.
4. Wire it into your app root:
   - Call `captureAttribution(window.location.search, filterReferrer(document.referrer, window.location.origin))`
     as early as possible on **every page load**, not just a signup page — it
     must run before a user clicks "Sign in with Google" or submits the email
     signup form. A good place is your top-level `App.tsx`, once, on mount.
   - Mount `useAttributionSync(profile)` once near `<AuthProvider>`, passing
     whatever profile object your app already loads after login (it only needs
     `id`, `utm_source`, `how_heard`).
   - Render `<HowHeardPrompt profile={profile} onAnswered={refreshProfile} />`
     once, on the first authenticated page (e.g. the dashboard layout).

## 3. How it survives an OAuth redirect, and works for email sign-up too

`captureAttribution` writes first-touch UTM params + referrer into
`localStorage` — not a URL param, not a request — specifically because
`localStorage` is scoped to your origin and survives a full-page redirect to an
OAuth provider and back. First-touch wins: once something is stored, a later
call never overwrites it, in this browser or (via `useAttributionSync`'s check
against `profile.utm_source`) on the account.

This also covers plain email sign-up with no extra work: the capture point is
simply "the first page load," which happens before either flow, not specifically
before an OAuth click. If your product is email/password or OTP only (this
starter's own default auth, `src/pages/auth/SignUpPage.tsx`), nothing about step
4 above changes.

## 4. Defining `first_result_at` and `paid_at` for your product

`distribution_facts` (0004) ships both as `NULL::timestamptz`, inside a clearly
marked `{{FIRST_RESULT_AT_EXPRESSION}}` / `{{PAID_AT_EXPRESSION}}` placeholder
block. Replace each `NULL` with a real subquery once the event has a home in
your schema:

- **`first_result_at`** — your product defines "first real result" (plan
  section E/G): the first demo that actually finished, the first report
  generated, the first reply sent. Whatever "it worked for them once" means
  here.
- **`paid_at`** — the first payment. Usually a `MIN(...)` over your
  invoices/subscriptions table, scoped to `user_id = p.id`.

Keep both as `MIN(...)` (first occurrence), not `MAX(...)` — the Cockpit reads
these as "when did this first happen," and a later occurrence should not move
the date backwards in anyone's reporting.

## 5. Proving it on staging before trusting the numbers

1. Apply `0003` then `0004` on staging.
2. Build a signup link with UTM params, e.g.
   `https://staging.yourapp.com/signup?utm_source=test&utm_campaign=proof`.
3. Open it in a private window (clears any stale `localStorage`), complete
   sign-up (email or OAuth — try whichever your product offers).
4. Answer the "How did you hear about us?" prompt on first dashboard visit.
5. Query, with the service-role key:
   ```sql
   select * from public.distribution_facts where email = '<the address you used>';
   ```
   You should see `utm_source = 'test'`, `utm_campaign = 'proof'`, your chosen
   `how_heard`, and `first_result_at` / `paid_at` still `NULL` until you've
   defined them (§4) and triggered the real event.
6. Confirm the lockdown: as the `anon` or `authenticated` role, `select * from
   public.distribution_facts` must fail with a permission error.

## 6. The Cockpit's Distribution view

The Cockpit's per-product Distribution view (plan section G) reads
`public.distribution_facts` with the service-role key — the same shape, the same
column names, across the whole fleet. It never queries a product's `profiles`
table directly, which is the entire point of shipping a view instead of a raw
table: a product's own schema can change freely as long as `distribution_facts`'
11-column contract does not.

## 7. What a new product still has to do by hand

- Create its own `public.profiles` table first, if it doesn't have one yet
  (precondition for `0003`).
- Wire `captureAttribution` into its app root, `useAttributionSync` near its
  auth provider, and `<HowHeardPrompt>` onto its first authenticated page (§2) —
  none of this fires on its own until a product mounts it.
- Decide, and write, the real `first_result_at` / `paid_at` expressions in
  `0004` (§4) — these ship as `NULL` on purpose and stay `NULL` until the
  product defines them.
- Prove the capture → sync → prompt → `distribution_facts` chain on staging with
  a real UTM link (§5) before trusting any number the Cockpit shows for this
  product.
- If the product's brand/design tokens differ from this starter's
  `var(--color-*)` convention, restyle `HowHeardPrompt.tsx` to match — the
  copy and the decision logic (`src/lib/attribution.ts`) should not need to
  change.
