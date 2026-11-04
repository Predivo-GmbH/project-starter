# Arivioo Project Starter

Reusable Claude Code workflow templates for all Arivioo projects. Provides automated design review, code review, and security review via subagents, slash commands, and GitHub Actions.

Based on the [OneRedOak Claude Code Workflows](https://github.com/OneRedOak/claude-code-workflows) methodology.

---

## What's Included

| Component | Path | Purpose |
|-----------|------|---------|
| **Design Review Agent** | `.claude/agents/design-review.md` | 8-phase visual review using Playwright MCP |
| **Code Review Agent** | `.claude/agents/code-review.md` | "Pragmatic Quality" framework — architecture, security, performance |
| **Security Review Agent** | `.claude/agents/security-review.md` | High-confidence vulnerability detection (read-only) |
| **Design Review Command** | `.claude/commands/design-review.md` | `/design-review` slash command for current branch |
| **Code Review Command** | `.claude/commands/code-review.md` | `/code-review` slash command for current branch |
| **Security Review Command** | `.claude/commands/security-review.md` | `/security-review` slash command for current branch |
| **Code Review Action** | `.github/workflows/code-review.yml` | Automated PR code review — **off unless armed**, see below |
| **Design Review Action** | `.github/workflows/design-review.yml` | Automated PR design review, frontend files only — **off unless armed** |
| **Security Review Action** | `.github/workflows/security-review.yml` | Automated PR security review — **off unless armed** |
| **Design Principles** | `context/design-principles.md` | Customizable design checklist template |
| **Style Guide** | `context/style-guide.md` | Customizable brand style guide template |
| **CLAUDE.md Template** | `CLAUDE.md.template` | Base CLAUDE.md with visual development section |
| **Deploy Workflow (static)** | `.github/workflows/deploy.yml.template` | Metanet FTP zero-downtime deploy (lint→typecheck→test→build→FTP) |
| **Deploy Workflow (Supabase-staged)** | `.github/workflows/deploy-supabase-staged.yml.template` | Full push→validate→staging→E2E chain, **manual prod gate**, pinned Supabase CLI + `--use-api`, retrying staging-alive check. Use for any Supabase-backed project. See `standards/deploy-standard.md`. |
| **Live-asset guard** | `scripts/verify-live-assets.mjs`, `scripts/deploy-never-deletes-live-assets.test.mjs`, `.github/workflows/guards.yml` | Every deploy template's 14-day asset prune never deletes a file the build just uploaded, and each prune is followed by a check that the live pages load every file they reference (signalscore.ch ran unstyled for three days in Oct 2026 when a prune deleted its live stylesheet). The test pins both; `guards.yml` runs every offline `scripts/*.test.mjs` on each PR. |
| **Keep-Alive Workflow** | `.github/workflows/keep-alive.yml.template` | Ping Supabase free-tier every 2 days to prevent pause |
| **Auth Helper** | `supabase/functions/_shared/auth.template.ts` | JWT auth + admin/user client factory for edge functions |
| **CORS Helper** | `supabase/functions/_shared/cors.template.ts` | Dynamic CORS with origin allowlist |
| **Hardened SPA .htaccess** | `public/.htaccess.template` | Browser security headers, private-file denial, caching and SPA routing on Metanet |
| **MCP Config Template** | `.mcp.json.template` | Team-shared Playwright MCP config |
| **Lifecycle Email** | `supabase/functions/lifecycle-tick/`, `_shared/lifecycle-*.template.ts`, `supabase/migrations/000{1,2}_lifecycle_*.sql.template` | Sign-up-to-paid follow-up email: kill switch, once-per-person ledger, internal-account filter, staging test-recipient guard, backfill-safe first run, bounce/unsubscribe. Extracted from ChannelMover's production setup. See `docs/LIFECYCLE_EMAIL.md`. |
| **Sign-up Source Tracking** | `src/lib/attribution.ts`, `src/hooks/useAttributionSync.ts`, `src/components/attribution/HowHeardPrompt.tsx`, `supabase/migrations/000{3,4}_*.sql.template` | First-touch UTM/referrer capture (survives an OAuth redirect; works for email sign-up too), once-after-login sync onto `profiles`, the "How did you hear about us?" prompt, and `public.distribution_facts` — the standard shape the Cockpit's Distribution view reads from every product. See `docs/ATTRIBUTION.md`. |

---

## Security from day one

The rules live in [security-standard.md §5](<C:/Business/Internal Projects/standards/security-standard.md#5>); this starter implements them without duplicating the rulebook.

- Hardened Apache headers, CSP, COOP, HTTPS redirects and cache policies: SR-HDR-01..09, SR-TLS-03.
- Private-file and directory denial, with offline Vite-build and mutation tests: SR-HOST-02/03.
- Build-output guard blocks source maps, source-map comments and private artifacts before upload: SR-HOST-04/05.
- RFC 9116 `security.txt` contact template: SR-HOST-10.
- Scanner-probe guard protects the shared host and office/build-laptop address; denial is proven offline: SR-HOST-11.
- Visitor-only GET header checks for pages and linked CSS/JS, including staging E2E: SR-HDR-01/02.
- Pinned Actions, explicit permissions and event-input guards: SR-SUP-05/06/07.
- Blocking gitleaks CLI scans for event commits, working tree and built bundles: SR-SUP-09/10, SR-FE-01.

Fill `{{PROD_DOMAIN}}`, `{{STAGING_DOMAIN}}`, `{{SUPABASE_PROJECT_REF}}`, `{{SECURITY_CONTACT}}` and `{{SECURITY_TXT_EXPIRES}}` wherever they appear. Use a real security contact URI and an RFC 3339 expiry under one year ahead. Rename the public and E2E `.template` files as shown below; keep `typescript@5.9.3` (the scanner uses its compiler API) and `vite` in the project's dev dependencies. The offline guard workflow discovers tests recursively under `scripts/`.

On Plesk, turn **Smart static files processing** and **Serve static files directly by nginx** OFF (deploy-standard §5c), or the Apache headers will not reach browsers. nginx-made redirects/errors remain held under WEB-01; their staging assertions are retained as `fixme`. FTP transport hardening remains held under SR-HOST-06, with the documented settings preserved. Add optional PostHog EU, Sentry or Stripe CSP sources only when the project uses them; examples are in `.htaccess.template`.

## Prerequisites

### 1. Playwright MCP (User-Scoped)

Install once — available across all projects:

```bash
claude mcp add --transport stdio --scope user playwright -- cmd /c npx -y @playwright/mcp@latest
```

> **macOS/Linux**: Remove `cmd /c` from the command.

If browser binaries are missing:

```bash
npx playwright install --with-deps
```

Verify: Run `/mcp` inside Claude Code — `playwright` should appear.

### 2. GitHub Secret

For GitHub Actions, add `ANTHROPIC_API_KEY` as a repository secret:

```
Settings → Secrets and variables → Actions → New repository secret
```

---

## Setup for a New Project

### Step 1: Copy Files

```bash
# From your new project root:
cp -r /path/to/project-starter/.claude .claude
cp -r /path/to/project-starter/.github .github
cp -r /path/to/project-starter/context context

# Deploy and security guards must travel together, including scripts/lib/:
cp -r /path/to/project-starter/scripts .
cp /path/to/project-starter/.gitleaks.toml .
cp /path/to/project-starter/CLAUDE.md.template CLAUDE.md

# If using Supabase:
mkdir -p supabase/functions/_shared
cp /path/to/project-starter/supabase/functions/_shared/auth.template.ts supabase/functions/_shared/auth.ts
cp /path/to/project-starter/supabase/functions/_shared/cors.template.ts supabase/functions/_shared/cors.ts

# Hardened SPA routing and security contact for Metanet:
mkdir -p public/.well-known e2e/staging
cp /path/to/project-starter/public/.htaccess.template public/.htaccess
cp /path/to/project-starter/public/.well-known/security.txt.template public/.well-known/security.txt
cp /path/to/project-starter/e2e/staging/security-headers.spec.ts.template e2e/staging/security-headers.spec.ts
```

### Step 2: Customize

1. **`CLAUDE.md`** — Fill in project name, stack, dev server URL, Supabase/deployment config, project-specific rules
2. **`context/design-principles.md`** — Replace `<!-- CUSTOMIZE -->` sections with your design system
3. **`context/style-guide.md`** — Replace with your brand colors, typography, component specs
4. **Deploy workflow** — Rename ONE to `.github/workflows/deploy.yml`, fill placeholders:
   - Static site → `deploy.yml.template` (replace the `{{PLACEHOLDERS}}`: `{{SITE_ID}}`, `{{PROD_DOMAIN}}`)
   - Supabase-backed → `deploy-supabase-staged.yml.template` (replace the `{{PLACEHOLDERS}}`; this is the one with the manual prod gate + staging E2E). Then add the project to the Deploy-Status dashboard (`FLEET` array in BackOffice's `deploy-status` edge fn).
   - Either way: replace `{{PROD_DOMAIN}}` / `{{STAGING_DOMAIN}}` in `scripts/deploy-never-deletes-live-assets.test.mjs` (its `SITE` map) the same way, and list 3-5 real pages in each "Verify ... serves every file its pages need" step's `--pages`.
5. **`.github/workflows/keep-alive.yml.template`** — Rename to `keep-alive.yml` (if Supabase free tier)
6. **`supabase/functions/_shared/cors.ts`** — Replace `[SUBDOMAIN]` with your actual subdomain

### Step 2b: Lifecycle email (if the product has sign-ups)

Every new product ships follow-up email from day one — see `docs/LIFECYCLE_EMAIL.md`
for the full copy/fill-in/prove-on-staging walkthrough; it is not a short checklist
item like the others above, so it gets its own doc rather than a bullet here.

### Step 2c: Sign-up source tracking (every new product, from day one)

Every new product records where each sign-up came from, in the standard shape
the Cockpit reads — see `docs/ATTRIBUTION.md` for the full copy/wire/prove-on-staging
walkthrough.

### Step 3 (Optional): Team MCP Config

If team members need Playwright without user-scoped install:

```bash
cp /path/to/project-starter/.mcp.json.template .mcp.json
```

---

## Usage

### During Development

After making front-end changes, Claude Code will automatically:
1. Navigate to affected pages using Playwright
2. Take screenshots and compare against design principles
3. Check for console errors
4. Self-correct any issues

This happens because of the "Quick Visual Check" section in CLAUDE.md.

### On-Demand Reviews

```bash
# Design review (visual, accessibility, responsiveness)
/design-review

# Code review (architecture, security, performance)
/code-review

# Security review (vulnerability detection)
/security-review
```

### Via Subagents

```bash
# Invoke directly in conversation
@design-review Review the new dashboard page at localhost:8080/dashboard
@code-review Check the last 3 commits for quality issues
@security-review Audit the authentication changes
```

### Automated on PRs

The three review workflows are **switched off** and copying them into a project does not
switch them on. They bill the Anthropic API by the token, and a standing rule (2026-08-29)
reserves that key for work a customer triggers inside a product; reviews use the interactive
Claude Code session instead, which the subscription already covers. Each job is gated on the
repository variable `AI_REVIEW_ENABLED`, which is unset everywhere, so the job is **skipped** —
no review, no red check, no spend. Use the `/code-review`, `/design-review` and
`/security-review` commands above instead; they do the same job and cost nothing per token.

Arming them anywhere is a spending decision and Roger's alone. If it is ever taken, set
`AI_REVIEW_ENABLED=true` **and** add `ANTHROPIC_API_KEY` on that repo — with the variable set
and no key the job fails loudly rather than passing green having read nothing. Once armed:
- **Code review** runs on every PR
- **Design review** runs only when frontend files (`.tsx`, `.css`, `.html`, etc.) are modified
- **Security review** runs on every PR

---

## The Iterative Agentic Loop

The core workflow concept:

```
Design Brief / Style Guide (fixed spec)
        ↓
   Code Changes
        ↓
   Playwright Screenshot ←──┐
        ↓                    │
   Compare to Spec           │
        ↓                    │
   Differences Found? ───YES─┘
        ↓ NO
   Done ✓
```

Claude Code builds → takes a screenshot → compares to the design spec → fixes discrepancies → repeats. This loop runs automatically via the CLAUDE.md instructions.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Orchestration Layer            │
│                                         │
│  Context          Tools        Validation│
│  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │Design    │  │Playwright│  │Subagent  ││
│  │Principles│  │MCP       │  │Reviews   ││
│  │Style     │  │(browser) │  │(design,  ││
│  │Guide     │  │          │  │code,     ││
│  │CLAUDE.md │  │          │  │security) ││
│  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
    Inner Loop  Slash Cmds  GitHub Actions
    (auto visual  (/review)  (PR automation)
     feedback)
```

---

## Customization Tips

### Generating Design Principles

Use Gemini Deep Research or Claude to analyze 2-3 reference screenshots:

> "Analyze the UI in these screenshots and describe it in detail — color palette, typography, spacing, component patterns, interaction states. Output as a structured markdown design checklist."

### Adding Project-Specific Agents

Create new `.md` files in `.claude/agents/` following the same format. Common additions:
- **Performance auditor** — Lighthouse scores, bundle analysis
- **Migration assistant** — Framework or library upgrade guidance
- **Documentation writer** — API docs, README updates

### Git Worktrees for Parallel Development

Run multiple Claude Code instances on different worktrees for parallel iteration:

```bash
git worktree add ../project-v2 -b feature/v2
# Open Claude Code in ../project-v2 and iterate independently
```

---

## Credits

- Methodology: [Patrick Ellis / OneRedOak](https://github.com/OneRedOak/claude-code-workflows)
- Playwright MCP: [Microsoft](https://github.com/microsoft/playwright-mcp)
- Security review: [Anthropic](https://github.com/anthropics/claude-code-security-review)
