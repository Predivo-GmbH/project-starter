# v11 Staging Gates — how to enable them for this project

Every app in the fleet must carry a **green** v11 staging-gate harness — the production-monitor
"v11 Gate Coverage Guard" goes red for any required app that lacks it. New projects inherit these
files from `project-starter`; fill them in as part of go-live.

## Files (already scaffolded here)
- `e2e/staging/v11-gates.spec.ts` — the gates (rename from `.template`, then fill the TODOs)
- `playwright.v11-gates.config.ts` — dedicated runner (set the `STAGING_URL` default)
- `.github/workflows/staging-gates.yml` — CI (rename from `.template`; set the Deploy workflow name)
- `src/lib/fetchAllRows.ts` — the 1000-row-cap pagination helper (use it to fix any Gate I finding)

## Fill-in checklist
1. **Refs**: set `STAGING_REF` / `PROD_REF` in the spec (from `docs/Credentials.txt` / `.env`).
2. **Auth**: implement `unlock(page)` — copy this app's `e2e/staging` auth-setup (Supabase
   password-grant session in localStorage, and/or a PasswordGate `sessionStorage` bypass).
3. **Gate A**: list every modal/dialog/sheet + multi-field form; assert its primary action is
   reachable at min height {390×844, 375×360 kb-open, 812×375 & 667×375 landscape}.
4. **Gate B/J**: pick a mutation/upload flow; assert no DB row before Save, 0 residue on abandon,
   exactly 1 on Save. **N/A if the app has no such flow — say so, don't fake it.**
5. **Gate I**: seed >1000 rows in the main list table, assert the app's *displayed* count/total
   reflects all of them. Fix any truncation by routing the offending hook through `fetchAllRows`.
6. **Gate K / Gate M**: set the route list + refs — they're otherwise generic.
7. **Secrets**: add `STAGING_HTPASSWD_USER/PASS` (if basic-auth'd), `<PROJECT>_MGMT_TOKEN`
   (Supabase Management `sbp_` token), `<PROJECT>_SVC_KEY` (staging `sb_secret`, for storage
   teardown — retrievable via `GET /v1/projects/{ref}/api-keys?reveal=true`). Rename the env keys
   in the config + workflow to match.

## ⚠️ Gotcha #1 — keep these gates OUT of the deploy gauntlet
If `deploy.yml`'s e2e gauntlet runs the whole `e2e/staging` dir, it will drag in this heavy spec,
which needs the Management token the gauntlet doesn't have → it fails and **blocks prod promotion**.
Add `testIgnore: '**/v11-gates.spec.ts'` to the gauntlet's playwright staging config, and let
`staging-gates.yml` run this spec via its own `playwright.v11-gates.config.ts`.
**Verify with `--list`:** the gauntlet config must show 0 v11 tests; the v11 config only v11.

## Other lessons baked into the reference specs
- Pre-clean `ZZ_V11GATE%` marker rows at the start of each data-writing gate (a cancelled/concurrent
  run must not poison an absolute-count baseline).
- Timing gates: wait for a mount element, then poll for the network call — never a fixed short wait.
- Gate I asserts on the app's rendered output, not on summed network responses (summing masks a cap).
