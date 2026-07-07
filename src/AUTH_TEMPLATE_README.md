# Authentication Template

Working, correct front-end auth subsystem for a Supabase-backed Vite + React SPA.
Copied from **Valrano** (the reference implementation) and de-branded — replace
`{{APP_NAME}}` with your product name. Covers all four flows: **registration,
login, forgot-password, reset-password**.

**Read the behavior spec first:** `C:\Business\Internal Projects\standards\auth-flow-standard.md`.
That doc defines the required behavior and the guard rules these files implement.
This README is only the copy/wiring guide.

---

## Why this template exists

The password-reset flow shipped broken in two projects (ReplyFlow, ScoutCopilot,
fixed 2026-07-07) because each project hand-rolled its auth pages and one guard was
wrong. These files are the known-good version. **Copy them; do not re-author auth
pages from scratch.**

---

## Files (copy into your project's `src/`)

```
src/pages/auth/
  LoginPage.tsx            password + email-OTP login (tabbed)
  SignUpPage.tsx           email-OTP signup -> profile (name + password)
  ForgotPasswordPage.tsx   request a reset link
  ResetPasswordPage.tsx    set a new password  ← the guard bug lived here; this copy is correct
  AuthCallbackPage.tsx     handles the magic-link / OAuth redirect
src/components/auth/
  AuthLayout.tsx           centered card shell
  PasswordStrength.tsx     strength meter
  password-utils.ts        getPasswordScore()
  OtpInput.tsx             6-digit code input
  ResendTimer.tsx          resend-code countdown
  ProtectedRoute.tsx       gate for authenticated routes
  RedirectIfAuthenticated.tsx  bounce logged-in users away from auth pages
src/contexts/AuthContext.tsx   all auth methods (single source of truth)
src/hooks/useAuth.ts           useAuth() consumer hook
src/lib/
  supabase.ts              Supabase browser client
  utils.ts                 cn() + friendlyAuthError()
  validation.ts            loginSchema + signupProfileSchema (zod)
```

## Prerequisites the consuming project must provide

**npm deps:** `@supabase/supabase-js`, `zod`, `clsx`, `tailwind-merge`,
`lucide-react`, `react-router-dom`, `react-helmet-async`, `react`.

**Vite env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (also set as CI
secrets — see the Vite-env-vars rule).

**Tailwind design tokens** (CSS vars these files reference — provide via your
`design-tokens.json` / theme): `--color-accent`, `--color-foreground`,
`--color-background`, `--color-border`, `--color-muted`, `--color-muted-foreground`,
`--color-destructive`, `--color-signal-green`.

**Edge functions referenced by AuthContext** (create or remove the call):
- `send-welcome` — sent after profile completion (best-effort, non-blocking).
- `delete-account` — admin delete via service role (used by `deleteAccount()`).

**Routes to wire** (React Router): `/login`, `/signup`, `/forgot-password`,
`/reset-password`, `/auth/callback`, and a post-login target (`/dashboard` by
default — change in `LoginPage.tsx` / `SignUpPage.tsx`).

**Supabase dashboard config:**
- **Site URL + Redirect URLs** must include `<origin>/reset-password` and
  `<origin>/auth/callback` for every environment (prod + staging).
- **Custom SMTP** configured and `rate_limit_email_sent` raised above 2, then
  re-GET to confirm (Supabase auth-email rate-limit rule — this has broken ≥6 projects).
- OTP: 6 digits, 600s expiry.

## After copying — mandatory

1. Replace `{{APP_NAME}}` everywhere (`grep -rn "{{APP_NAME}}" src`).
2. Wrap the app in `<AuthProvider>` (from `AuthContext.tsx`).
3. Add the E2E test that drives reset → **success screen** and asserts the URL is
   **not** `/forgot-password` (see the spec doc's E2E section). This is the test
   that would have caught the original bug.
4. `npx tsc --noEmit` must pass.

## The one rule you must not break

`ResetPasswordPage.tsx` intentionally calls `signOut()` after a successful reset.
Its direct-access guard is therefore gated on the success flag:

```tsx
useEffect(() => {
  if (!user && !success) navigate('/forgot-password')
}, [user, success, navigate])
if (!user && !success) return null
```

If you copy an older reset page whose guard is just `if (!user) navigate(...)`, the
post-reset `signOut()` will bounce the user back to `/forgot-password` and the
success screen never renders. That is the exact bug this template exists to prevent.
