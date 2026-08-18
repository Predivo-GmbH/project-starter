# Design System Pipeline — SINGLE SOURCE OF TRUTH
> Overall workflow canonical (all phases): `C:/Business/Templates/1-Person AI Business Playbook/docs/ONE_PERSON_AI_BUSINESS_WORKFLOW.md`. This file is the DESIGN sub-pipeline.

> **This is the ONE canonical design workflow for every Predivo GmbH product.** If any other doc
> (predivo `REDESIGN-HANDOFF.md`, any `ONE_PERSON_AI_BUSINESS_WORKFLOW.md` "Step 0", project
> `.claude/commands/design-*`, etc.) disagrees with this file, **this file wins** and the other is stale.
> **PROCESS > TOOLS (see §0). Route-first (§0.0). Tools = STITCH, CLAUDE DESIGN 2.0, or PENCIL.DEV — co-equal, pick per ROUTE (§0.0d + Step 0.3).** The OLD standalone Pencil `.pen` tool (used Feb-Apr 2026) is superseded; but **Pencil.dev RELAUNCHED Jan-2026** (IDE-native VS Code/Cursor, Claude-Code MCP, repo-JSON `.pen`) is RE-ADOPTED as a co-equal mockup option (Roger 2026-08-11). Figma / Bolt / Vercel-as-pipeline remain not-adopted.
> Last updated: 2026-08-18 (**§0.1 LOGO ROUTE decision tree added (wordmark vs mark → style group → subject line, mandatory brief fields) + §0.2 recipe validated end-to-end: refs + subject + explicit style qualities + subject-first wording → candidates → human pick + mandatory originality check vs refs**; Recraft RETIRED for logos → Higgsfield reference-style transfer (Flux Kontext + Nano Banana 2), framed as the general EXAMPLE-DRIVEN "style-from-refs + subject-brief" factory method; executor table + pipeline diagram updated; proven route = R-LOGO-01. Roger sign-off via task dispatch; evidence = tool test 2026-08-17/18 incl. corrected result downloads. Prior: 2026-08-15 Mobbin MCP promoted from "future / needs-auth" to **LIVE + VERIFIED** default reference-research executor — updated §0.0d table + §0.1; verified this session via `search_flows`/`search_screens` returning real salon-booking references; Roger directive: the real-reference pull must be a documented step when creating any UI). Prior: 2026-08-11 (§0 added: process-thesis + ROUTE SELECTION + automation-as-artifacts + enforcement LOOP + tool executor table, from `DESIGN_METHODOLOGY_KB_SYNTHESIS_2026-08-11.md`; Pencil.dev re-adopted; approved by Roger). Prior: 2026-07-14 (Mobbin added as a curated reference source in Step 0.1 + a sourcing note in Step 0.6b — inspiration input, NOT a new stage or a Stitch/Claude-Design replacement; approved by Roger). Prior: 2026-07-02 (Claude Design 2.0 promoted to a co-equal path with Stitch, approved by Roger — reverses the June "Stitch-only / do NOT adopt Claude Design" stance). Prior: 2026-06-18.

---

## 0. THE METHODOLOGY IS THE MOAT — process > tools (read before everything) [UPGRADE 2026-08-11]

> Full derivation: `DESIGN_METHODOLOGY_KB_SYNTHESIS_2026-08-11.md` (synthesized from 111 KB design videos + the cinematic-route pass; Roger directive 2026-08-11: focus on the WORKFLOW, tools are swappable executors). Central KB finding, verbatim: **"generic AI output is a PROCESS failure, not a tool failure."** A one-shot prompt = slop; a staged pipeline = world-class. Adding Pencil/Stitch/Claude Design changes nothing without the process below. "First output = iteration 1, never a finished site."

### 0.0 ROUTE SELECTION — the ONE up-front human decision (do this FIRST)
Route is a CONVERSION decision, not an aesthetic one. Pick (or have the system recommend from product+audience) before any pixel:
- **Route A — Clean / Minimal SaaS (DEFAULT for all fleet products).** Copy-forward, fast, for cold visitors who must be CONVINCED (Jobs-minimalism / Huang-contained-SaaS).
- **Route B — Editorial / Brand.** Distinctive type/layout; moderate conversion risk. Brand/marketing sites.
- **Route C — Cinematic / Animated (Awwwards-style, Step 0.6b mechanics).** ONLY pre-sold/aspirational/launch/flagship "wow" pages. REAL conversion risk: KB (Jesse Showalter) measured 31s heavy-animation load vs 2s copy-forward; Linear removed header animation for this reason. NEVER the default for a page that must convince a cold visitor. Warn when mis-chosen.

### 0.0b THE AUTOMATION MODEL — encode taste ONCE as durable artifacts
To be FULLY automated yet world-class, convert each taste decision into an artifact the agent obeys (decide once per brand, not per page): (1) committed guardrails spec = never/always anti-slop rules; (2) locked design system from a REAL reference (one hex / Firecrawl scrape); (3) grounding in real shipped refs (Mobbin/Firecrawl) = borrow proven taste; (4) critique-and-iterate eval loop vs explicit on-brand + performance criteria; (5) pre-decided distinctive-element rule (protect personality vs over-clean regression). Residual human input = small, front-loaded: pick reference/direction + signature hook once per brand; supply REAL proof/numbers (NEVER fabricate); final review of ONLY 4 things — narrative resonance, hero-image persona-truth, style-risk, scarcity honesty.

### 0.0c ENFORCEMENT LOOP — mechanical gates, run after EVERY build until pass
KB-derived lint: ≤~4.4 links/page; attention ratio ~1:1; one exclusive accent colour; ad↔H1 congruence; label on every input; 60/30/10 colour, ≤4 font sizes / 2 weights, 8pt grid; corner-radius/stroke consistency; hero ≤90vh; H1/H2/CTA above the fold on mobile. A11y CI: Lighthouse + axe + eslint-plugin-jsx-a11y (4.5:1 AA). PageSpeed = release-blocker. `prefers-reduced-motion`. Missing-state detection (onboarding/empty/error/delete-confirm/paywall). Runs installed `web-design-guidelines` + `design-taste-frontend` as a LOOP: "if it reports violations, fix each and re-run until pass." (This supersedes the one-shot Step 0.7 / VALIDATE pass.)

**RUNNABLE LINT — `scripts/design-lint.mjs`** (Playwright + `@axe-core/playwright`; canonical copy in `project-starter/scripts/`, copied into each project). It encodes the gates above as real code: link-count, hero-attention-ratio, hero-height (≤90vh, Route C ≤100vh), type-scale, input-labels, single-h1, cta-above-fold, mobile-h1/cta-fold, **axe WCAG2 A/AA** (4.5:1 contrast etc.), + **PERFORMANCE BUDGET (G8, coded 2026-08-16): Core Web Vitals LCP (≤3000ms) + CLS (≤0.1) measured in-page, plus wire-weight (total ≤2500KB, JS ≤1200KB) — all config-overridable; a poor score FAILS the gate** (verified live: caught CLS 0.122 on predivo.ch). It scrolls top→bottom first so framer-motion `whileInView` content is actually scanned (axe skips invisible nodes — without the scroll the a11y pass gives a false clean). Exit 0 = clean, exit 1 = ≥1 violation, so CI / an agent loop gates on it. Run: `node scripts/design-lint.mjs [url] [--route=A|B|C] [--json] [--config=path]`. **NOTE — perf weight is 0 on same-origin localhost (no transferSize headers); point the lint at a real staging/prod URL for a true weight budget.** **Missing-state detection (G11)** is NOT a single-page lint (empty/error/onboarding/paywall states live on other screens) — it is a `design-review` skill / Step 0.7 QA checklist item, not `design-lint.mjs`.

**PER-PROJECT CALIBRATION — optional `design-lint.config.json` in the project root.** The heuristic gates are generic and WILL false-positive on non-English sites (English-only CTA regex) or bespoke hero markup (the generic hero guess grabs the `<header>` nav). Override only what you need; everything else keeps the KB default; a CLI `url`/`--route` still wins over the config:
```jsonc
{
  "url": "http://localhost:3000",                 // default scan target (local preview or prod URL)
  "route": "A",                                    // A|B|C — C relaxes the hero-height ceiling
  "scroll": true,                                  // scroll before the a11y scan (default true)
  "hero": { "selector": "section[aria-label=\"Hero\"]" }, // exact hero region — beats the generic guess
  "cta": { "regex": "loslegen|starten|get|start|demo", "flags": "i" }, // action-word matcher — LOCALISE it
  "thresholds": { "maxLinks": 12, "maxHeroVh": 160, "maxFontSizes": 8, "maxHeroLinks": 5 },
  "skipGates": ["type-scale"]                      // gate names to disable for this project (use sparingly)
}
```
Calibrating rule of thumb: set `hero.selector` to the real hero landmark (not `<header>`); localise `cta.regex` (predivo/SignalScore use German: `loslegen|starten|jetzt|kostenlos|preise|ansehen|…`); raise `maxLinks` for content-rich marketing pages (a full nav+pricing+footer legitimately exceeds 12 — the KB "≤4.4 links" figure is the *hero* attention-ratio, checked separately, not the whole document); raise `maxHeroVh` for an intentionally tall/cinematic hero (predivo 151vh → 160; SignalScore 106vh → 110). A wrong hero selector prints a `⚠ hero selector matched nothing` warning. Calibrated + validated on predivo.ch and signalscore.ch with zero false-positives (2026-08-11).

**WIRED INTO THE BUILD (gating loop).** `package.json` → `"design-lint": "node scripts/design-lint.mjs"`. The deploy workflows (`deploy.yml` prod + `deploy-staging.yml`) run a **Design-lint gate** step after `npm run build`: boot `vite preview` on :3000, wait for it, run the lint — a non-zero exit BLOCKS the deploy (staging-first; design changes reviewed on staging before prod).

### 0.0d TOOL / MCP EXECUTOR TABLE (tools serve the methodology; pick per route)
| Stage | Executor(s) | Status |
|---|---|---|
| Reference research | Mobbin (premium, dedicated Chrome) + Firecrawl scrape | Mobbin browser works now; **MCP LIVE + VERIFIED 2026-08-15 (`api.mobbin.com/mcp`) — `search_flows`/`search_screens`/`search_sections` return real shipped refs. This is the DEFAULT reference-research executor: pull real refs FIRST, then DEFINE (§0.1a).** |
| Components | 21st.dev MCP + shadcn MCP | **21st.dev migrated to HTTP `21st.dev/api/mcp` 2026-08-11, needs `/mcp` auth next session**; shadcn TBD |
| Mockup | Stitch (explore) · Claude Design (polish, dedicated browser) · Pencil.dev (IDE-native, repo JSON) | pick per route |
| Editorial/animated builder | Framer + Unframer MCP (Framer→code) | NEW — fit-check before adoption |
| Assets (stills) | Higgsfield image menu — surface the FULL set (`skills/higgsfield/image-models.md`), do not default to one: **Soul 2.0** (FREE, 5,000 gens, 2K, Soul ID character consistency — the cost-first pick) · **Seedream 5.0 Lite / 4.5** (up to 4K, unlimited batch — high-res) · **Nano Banana 2/Pro** (character/reference + text rendering) · **GPT Image 2** (design/text edit + refinement) · **Recraft** — RETIRED for logos (missed the style, ~50x cost); vectorizer/bg-removal utilities OK. | in use |
| **Logos** | **Higgsfield reference-style transfer — Flux Kontext + Nano Banana 2** (style-from-refs + subject-brief, §0.2 + R-LOGO-01). **Recraft RETIRED** for logo generation. | in use (2026-08-18) |
| Assets (motion) | Higgsfield **Seedance 2.0** | in use |
| Motion | Framer Motion / GSAP (GPU transforms) | in stack |
| QA | web-design-guidelines · design-taste-frontend · Lighthouse · axe | installed |

---

## Core rules (read first)

- **FIRST pick the ROUTE (§0.0), THEN the mockup tool: STITCH, CLAUDE DESIGN 2.0, or PENCIL.DEV — co-equal, choose per route (§0.0d + Step 0.3).** Whichever produces the approved screens IS the final visual reference. There is NO rebuild step in a third tool. After the mockup is approved, all further refinement happens **in code**. Default heuristic: **Stitch** for a fully-MCP-automated run; **Claude Design 2.0** when Stitch's known flakiness stalls iteration, when you want Figma-like direct canvas editing, or when the same project also needs a pitch deck / animated prototype.
- **Brand book = standalone HTML** document, styled in the brand's own design language (not built in any design tool).
- **Iterate STRUCTURE first (sections, content, UX flow), then POLISH (colors, shadows, spacing, tokens).** Never polish while structure still needs work.
- **Mockups are free to iterate; code is expensive.** Get the design right in the mockup tool before writing code.
- **DEFINE-before-MOCKUP is now MECHANICALLY ENFORCED (2026-08-14, Roger).** `~/.claude/hooks/kb-first-guard.js` **Gate B** DENIES any mockup-generation tool call (Stitch `mcp__stitch__*` · Claude Design `DesignSync` · Pencil `mcp__pencil__*`, list in `~/.claude/hooks/mockup-tools.txt`) **until a `docs/DESIGN_BRIEF.md` has been written or read this session.** The block self-clears the moment a brief is touched. The mockup tool is NEVER the first step: **route (§0.0) → DEFINE (§0.1, incl. §0.1a references) → locked design system → THEN mockup.** This is why picking "Stitch vs Claude Design" before a brief exists is a process error, not a valid start.

---

## Two workflows
- **New project** — design first, then code (Steps 0.1-0.7 below, then IMPLEMENT + VALIDATE).
- **Existing project** — extract tokens from code, formalize retroactively (see "Existing Project Workflow" at the bottom).

---

## Pipeline (new project)

```
0.1 DEFINE      -> docs/DESIGN_BRIEF.md (references + brief + scope + anti-slop rules)
0.2 LOGO        -> logo + favicon (Higgsfield ref-style transfer; Recraft RETIRED for logos)
0.3 MOCKUP      -> STITCH or CLAUDE DESIGN 2.0 design-language discovery, iterate landing page to APPROVAL
0.4 EXTRACT     -> docs/design-tokens.json + DESIGN_SYSTEM.md + .claude/skills/brand-guidelines/SKILL.md
0.5 BRAND BOOK  -> standalone HTML brand book
0.6 SCREENS     -> remaining screens in the SAME tool (desktop + mobile)
0.7 DESIGN QA   -> lightweight review before code
IMPLEMENT       -> code matches the approved mockup HTML; brand-guidelines skill enforced
VALIDATE        -> Puppeteer/screenshot checks vs the approved mockup
```

---

## Step 0.1 — DEFINE

**Who:** human provides input, AI analyzes and proposes.

**Input options (one or more):**
1. **Reference screenshots / URLs** of sites with the desired look & feel. AI uses Firecrawl to capture, then extracts palette, typography, spacing rhythm, layout patterns, component styles, tone. Fastest path: 2-3 references and AI derives the rest.
   - **Curated source — Mobbin** (600k+ real, documented, shipped-app screens; Predivo has a **premium** account logged into the dedicated Chrome). Browse by **Screens / UI Elements / Flows**, iOS or Web; per-screen **Copy** (image → clipboard → paste to Claude as a reference) or **Save** (to a collection). Use it to pull the 2-3 references above from *real* products instead of guessing — and to surface the states builders miss (onboarding, upgrade/paywall, delete-confirm, empty state). **Automated path — the Mobbin MCP (LIVE, verified 2026-08-15):** `mcp__mobbin__search_flows | search_screens | search_sections` query the library live ("pull 3 references for a SaaS dashboard, or a booking flow, rebuild in each style") instead of manual copy-paste — verified this session (a salon-booking query returned real shipped flows/screens: Fresha, Square Go, Careem, Zocdoc). **This is the DEFAULT reference-research step for any UI-creation task: pull the real shipped references FIRST, extract the convergent patterns, THEN feed them into DEFINE (§0.1a).** MCP connectors do NOT hot-load mid-session, so confirm the tools are present at session start; the dedicated-Chrome premium account is the manual fallback. Detail: memory `reference_mobbin_design_inspiration_2026_07_14.md`.
2. **Written brief** — product, audience, goals, competitive context.
3. **Explicit brand decisions** — accent color, font, light/dark, tone, if already known.

AI asks clarifying questions only for what it cannot determine from the references, then proposes a direction for approval.

### LOGO ROUTE decision (mandatory at DEFINE — added 2026-08-18, Roger)

The brief is **incomplete until the three logo decisions are recorded** — they are the human-owned half of the logo method (AI proposes options, human picks):

1. **Wordmark or generated mark?** A wordmark is a TYPE task — typeset the name in the brand font (e.g. Fraunces). Zero credits, no AI generation, and the correct choice for many prototypes. A generated mark goes through §0.2.
2. **If mark: which rendering-style group** from the logo reference library (taste call, informed by the brand direction).
3. **If mark: the subject line** — one line, what the mark depicts (e.g. "scissors", "an upward S"). It never comes from the refs.

Record the answers in DESIGN_BRIEF.md (e.g. `Logo: wordmark` or `Logo: mark, style S1, subject "…"`). Step 0.2 refuses to run without them.

### Step 0.1a — AI-PROPOSES-REFERENCES mode (DEFAULT when the business/product type is known) [ADDED 2026-08-14, Roger]

The human is NOT required to supply reference examples. When the product and business type are known, the AI **proposes** the references so the human only has to pick/veto (they keep the option to hand over their own, but it is not a prerequisite). Sequence:

1. **Classify the UI archetype** from the product + audience + chosen route (e.g. "SMB vertical-SaaS analytics dashboard", "cinematic launch page", "booking/scheduling admin"). State it explicitly.
2. **Pull candidate references** — from **Mobbin** (curated real shipped screens; MCP `mcp__mobbin__search_screens|search_flows|search_sections`, or the premium account in the dedicated Chrome) **plus** known best-in-class products for that archetype. Prefer real, shipped UIs over guesses.
3. **Present 3–5 candidates with a one-line rationale each** (why it fits THIS product/route) and a clear **anti-pattern** call-out (what to deliberately avoid). Cite each Mobbin screen as a link to its `mobbin_url`.
4. **Human picks / vetoes / adds**, then AI Firecrawl-scrapes the winners to seed the design system (§0.4 / §0.0b).
5. **Only after the brief (incl. picked references) is written to `docs/DESIGN_BRIEF.md`** does the mockup step unlock (enforced by the Gate B hook — see Core rules).

Timing rule: **do the reference research at the DEFINE step, not before it is reached.** Do not front-run Mobbin/reference proposals while the workflow/route is still being decided.

**Project-specific scope questions to ask here:**
1. Light mode only, or light + dark?
2. Include brand-collateral section (business cards, email signatures, social templates)?
3. UI component-library scope: full set or product-relevant subset?
4. Which key screens to mock up?

**Output:** `docs/DESIGN_BRIEF.md` (brand direction + anti-slop rules + pages list). Template at the bottom.

---

## Step 0.2 — LOGO

**Tool: Higgsfield reference-style transfer (Flux Kontext + Nano Banana 2). Recraft is RETIRED for logos** (2026-08-17/18 tool test: Recraft MISSED Roger's soft-organic style AND cost ~50x — 325 cr vs ~6 cr; Higgsfield hit the style. Proven route = [[reference_proven_routes_registry_2026_08_11]] **R-LOGO-01**; evidence = [[session_logo_tool_capability_test_2026_08_17]]). Generate the product logo + favicon: primary lockup (mark + wordmark), mark-only, favicon (16/32/180), monochrome variants. Store as reusable assets referenced by later steps. (Stitch does not make logos; Claude Design does not make logos.)

### The method — EXAMPLE-DRIVEN generation ("style-from-refs + subject-brief")

This is the **general factory method** for any generative step: **pick a curated STYLE (learned from reference examples) + write a SUBJECT brief → reference-condition the model.** Logos are the FIRST instance; the same shape generalizes to UI, ad creative, images, and video (a design system from examples — the same thing we do for UI). **Load-bearing principle (proven from our own outputs): references transfer STYLE; the subject comes from the written brief — with explicit style qualities and subject-first wording it lands (validated 2026-08-18 on scissors, foxes, and 8 style groups).** Role split: **AI = style executor; human owns taste (which style) + intent (the subject).** A reference set alone is never a full brief.

**Steps (the VALIDATED recipe — 2026-08-18, receipts `logo-reference-library/_pool/val/real_*.png`):**
1. **Read the LOGO ROUTE from the 0.1 brief** (wordmark vs mark). If wordmark → typeset the name in the brand font, done — no generation, no credits.
2. **Pick the style group** (human taste) and take its refs (raster PNG, ≤4 for Kontext / more for NB2).
3. **Prompt = subject + EXPLICIT style qualities:** *"Logo mark of <subject> — <style qualities spelled out>"* (e.g. "soft, rounded, organic flowing curves, flat monochrome, no sharp edges"). NEVER "keep the exact same style" — the backend enhancer (always on) guesses from the anchor's geometry. Put the subject first so the enhancer doesn't inject ref subjects.
4. **Generate 3–4 candidates (1.5 cr each; `generate cost` free preflight first), human picks.** **ONE route at a time — single generation, inspect, decide. Never batched unreviewed credit volleys** (Roger protocol 2026-08-18). On API errors (e.g. 503), check `generate list` before retrying — the job may have completed server-side.
5. **Originality check (mandatory):** iconic refs CAN leak through (Craft petals clone; Google-Ads echo) — diff every candidate against the refs; reject lookalikes.

**Higgsfield mechanics (the exact route that worked — R-LOGO-01):**
- CLI (used 2026-08-18): `higgsfield generate create flux_kontext --prompt "..." --aspect_ratio 1:1 --image-references <anchor.png> --image-references <ref2.png> ... --wait`. MCP alternative: `media_upload` → presigned PUT via a **curl SCRIPT FILE**, never inline (signed URLs break inline single-quoting) → `media_confirm` `type: image` → `generate_image` with `medias[].role`.
- **Flux Kontext:** role = `image_references`, **CAP 4 refs** (422 over 4), **ref 1 = the anchor that drives output**. **Nano Banana 2:** role = `image` (resolves to nano_banana_flash).
- **`generate cost` / `get_cost: true` = FREE preflight** — submits no job, is NOT a spend; always price a run first.
- **Refs must be raster PNG** — SVG uploads are rejected. Rasterize library SVGs first (`@resvg/resvg-js`, script `logo-reference-library/_pool/rasterize.mjs`).

> Optional: vectorize the chosen raster mark (e.g. Recraft `vectorize_image`, or resvg-traced) and build the lockup/favicon variants from it. Recraft's *vectorizer/bg-removal* utilities remain fine; only Recraft-as-the-logo-GENERATOR is retired.

> **[UPGRADE 2026-07-29] Optional sub-step: BRAND CHARACTER (mascot / animated figure)** — approved by Roger 2026-07-29 after the trysoro.com teardown (their 3D-clay mascot INTERACTING with product-UI mockups is the adopt-worthy pattern; reinforces the anti-slop "keep a handmade signature" rule / Isenberg lesson). Ledger: GAP 25. **Per-product FIT check first** (validate-tactic-fit rule): personality-led consumer/SMB products = good fit; trust-led B2B (e.g. Swiss finance) = restraint.
> 1. **Character stills:** Higgsfield **Nano Banana 2/Pro** (skill-documented fit: character/reference-image work) for 3D-clay/plush style, OR **Recraft custom style** for flat/vector. Roger picks ONE winner → that image is the **locked canonical reference — NEVER regenerate** (same law as logos). Credit rules apply (ask-model + confirm exact run before ANY generation round).
> 2. **Pose library:** 6-10 poses via image-to-image against the canonical reference (pointing, waving, holding the product-UI card, thinking, celebrating); transparent backgrounds via the free Pillow pipeline (Step 0.2 Phase C).
> 3. **Animation tiers (ascending cost):** **T1** static poses + Framer Motion micro-motion in code (free, ship-first: idle float, wave on scroll-into-view, pose swap per section) · **T2** Seedance 2.0 idle-loop / scroll-scrub hero per the Step 0.6b recipes (looping prompt, `video.currentTime` scroll-tie, Magic-Mask + darken-blend transparency) · **T3** mascot REACTING beside a live product-demo widget (hero proves the product — beats decorative mascots).
> - NOT adopted: Rive/Lottie hand-animation (designer-in-the-loop tooling outside the automation-first pipeline; revisit per best-tool-wins only if a flagship page justifies it).

---

## Step 0.3 — MOCKUP (Design-Language Discovery)

**Tool: STITCH or CLAUDE DESIGN 2.0 — co-equal, pick per situation (approved 2026-07-02).** This is where the visual identity is discovered and locked. Whichever tool produces the approved screens becomes the final visual reference; iterate the **landing page only** to approval before scaling to other screens.

**Which tool?**
- **Stitch** (`mcp__stitch__*` MCP) — default for a **fully-MCP-automated** run where Claude drives everything headlessly.
- **Claude Design 2.0** ([claude.ai/design](https://claude.ai/design), manual login, or the desktop app) — when Stitch's known flakiness stalls iteration, when you want **Figma-like direct canvas editing** (click an element, change text/font/color/weight — no re-prompt, no token burn), when you're seeding from an **existing design system** (import from a GitHub repo / tokens / markdown), or when the project also needs a **pitch deck / animated prototype** (PPTX/PDF/animation export). Handoff: export **ZIP → drag into a Claude Code project → build in our repo → deploy to Metanet** (no Vercel required). Has **Firecrawl** (same brand-scrape as Step 0.1) + Higgsfield MCP connectors and a `/design-sync` skill to port a system between Code and Design. Tradeoff: **no `claude-design` MCP** yet, so it is less scriptable than Stitch — expect a manual login step.
- **Running both in parallel** (opt-in): generate in both, user picks the winner, remaining screens go only in the winner.

**Process (either tool):**
1. Create the project.
2. Generate ~5 landing-page variations, each with a **different style direction** (informed by the DESIGN_BRIEF references). Always pass the **full Design Context Prefix** (the 0.1 brief data + 0.2 logo description).
3. Run a **4-agent expert evaluation** (Web Designer, UX Designer, Copywriter, CRO Specialist) over the variations.
4. Auto-generate a **refined prompt** combining the winning elements.
5. **Iterate WITH the user until the design language is approved** — STRUCTURE first (sections, content, UX), then POLISH (color, spacing, shadows). In Claude Design, prefer **direct canvas edits** for small tweaks over re-prompting.
6. Export approved HTML + screenshots to `docs/`.

> **[UPGRADE 2026-07 — APPLIED] Claude Design 2.0 promoted to co-equal with Stitch** (Roger approved 2026-07-02; reverses the June `WORKFLOW_UPGRADES.md` GAP 3 "do NOT adopt Claude Design"). Rationale: 2.0's canvas editing / design-system import / ZIP→Claude Code→Metanet handoff fix the exact Stitch flakiness this doc records (`edit_screens` 0%, `generate_variants` unreliable, `generate_screen_from_text` ~60% + often no output, `list_screens` broken) and remove the old "forces Vercel" objection. Bolt / Vercel-as-pipeline / Figma remain **not adopted**. Ledger: GAP 10.

### Claude Design rules (when using Claude Design 2.0)  [UPGRADE 2026-07-07]
> From `dVu9A5n2Osw` (Tristen O'Brien) + `m-f56P_L660` (Zubair) + prior `wG4UN0gpB6E`/`Ot582`, watched 2026-07-07. Ledger: GAP 12.
- **Save a reusable "Design System" (colors, fonts, logo) FIRST — mandatory before generating ANY asset.** It is the single biggest lever that makes every screen come out on-brand instead of AI-looking. Claude can auto-generate one if none exists; import from a GitHub repo / Figma / uploaded assets / a Firecrawl brand-scrape.
- **Five templates — pick per job:** *Prototype* (clickable page/app), *Slides* (pitch deck → PPTX), *Document* (one-page infographic/flyer → PDF), *Wireframe* (no-color skeleton — **generate this FIRST to lock layout before any build**, avoids expensive rework), *Animation* (small on-brand motion like a logo fade / product slide-in — explicitly **NOT** cinematic; use the Step 0.6b video pipeline for that).
- **Iterate with canvas edits, not re-prompts** (re-prompting reruns the whole context window and bleeds credits): **Edit** (move elements), **Tweaks** (typed change request), **Annotate** (click-and-comment so Claude fixes that exact spot). Fix one element at a time.
- **Asset + handoff chain:** Higgsfield MCP (**must be authorized first**) for real images → Claude Design assembly → Share/Send to Canva for manual polish → export **ZIP → Claude Code → build in our repo → Metanet** (never Vercel; the demos stop at localhost — add the deploy step yourself).
- **Cost note:** updated Claude Design now draws from your **normal plan usage** (not a separate credit pool — the old separate limit is what burned people out). Still a cost lever: default a **cheaper model** for routine template generation and reserve the premium model for hard work. (Per standing rule, this is workflow guidance — do NOT auto-change Roger's configured model.)

### Stitch MCP rules (do not deviate — when using Stitch)
- Model: **`GEMINI_3_1_PRO`**.
- `generate_screen_from_text`: ~60% success and **often returns no output even on success** -> ALWAYS verify with `get_project` afterward.
- `list_screens`: **broken (returns `{}`)** -> use `get_project` (`screenInstances` array: IDs + y-positions; screens display ordered by y-position).
- `edit_screens`: **0% success — NEVER use.**
- `generate_variants`: unreliable — **never rely on.**
- `get_screen`: format `projects/{projectId}/screens/{screenId}` for title, screenshot URL, HTML download URL.
- Don't dictate exact HTML structure (let Stitch design); DO include all content sections with real copy.
- Be very explicit per screen type (Stitch can turn a "search page" into another landing page).
- **Fallback when the API misbehaves: produce paste-ready prompts for the Stitch UI.**

### Anti-slop pre-flight + free auto-enforcing skills  [UPGRADE 2026-07-29]
> From `1dtJn7OF0Sk` (Claude Design 2.0, DE) + `fUJoUKEWCzY` (Julian Ivanov website tutorial, DE) + `7FU98O0JLHs` (Chase AI). Ledger: GAP 20. Technique — sound (no revenue claims).
- **Pre-flight sequence (before generating ANY mockup, either tool):** moodboard (Pinterest/Dribbble — pick ONE theme, do not copy refs literally) -> a rough wireframe that defines each section's BEHAVIOUR (what pins on scroll, what swaps, what the CTA does) -> ONE detailed prompt with four parts: **(1) aesthetic/design family, (2) a reference image or URL, (3) intent (product, audience, the single action you want), (4) guardrails (never/always rules = the Anti-slop list below).**
- **Never one-shot:** generate multiple full-style variants (5 -> pick 1 -> 3 body-layout variants -> pick 1), then nail hero assets in Higgsfield. Treat the first output as ITERATION 1; always verify in a **live preview tab** (the in-editor canvas can render differently from the shipped page).
- **Two free auto-enforcing skills — INSTALLED in `project-starter/.claude/skills/` on 2026-07-29** (copied into every new project): `design-taste-frontend` (from `leonxlnx/taste-skill` — concrete hierarchy/spacing/typography/motion + final-visual-review rules) and `web-design-guidelines` (from `vercel-labs/agent-skills` — audits UI code against 100+ accessibility/perf/UX rules; run `/web-design-guidelines`, then "PR the site and fix all found issues"). Reinstall in a fresh clone via `npx skills add <github-url> --skill <name>`. Alternates evaluated but not installed: Impeccable (impeccable.style), 21st.dev component refs.

---

## Step 0.4 — EXTRACT (tokens + system docs)

From the **approved mockup HTML** (Stitch or Claude Design 2.0), generate:
- `docs/design-tokens.json` — canonical tokens (absolute truth): colors (ink/surface/edge/accent/status), typography scale, spacing, radii, shadows, motion. Light + dark if selected.
- `.claude/skills/brand-guidelines/SKILL.md` — auto-enforced during all frontend coding.
- `docs/DESIGN_SYSTEM.md` — human-readable spec.

---

## Step 0.5 — BRAND BOOK (standalone HTML)

Build a standalone **HTML** brand book, styled in the brand's own design language (cover, brand story/values, logo rules + misuse, color, typography, spacing/grid, elevation, iconography, imagery, motion, voice & tone, optional collateral). Not a design-tool artifact.

> **[UPGRADE 2026-08-15] Lightweight-first (audit Theme 7).** For a **pre-validation** build (a first MVP, or any fast path), do NOT hand-build the full multi-section brand manual — **auto-generate a lightweight brand book from `docs/design-tokens.json`** (colors, type scale, spacing, logo), which already holds the enforceable truth (Step 0.4). Invest in the full hand-built manual above **only once the product has traction**. The full brand book stays the standard for the standalone `design` branch and for a client-facing `prototype` (Roger's call); it's the pre-validation fast path where it's premature.

## Step 0.6 — ADDITIONAL SCREENS

Generate the remaining key screens in the **same tool/project** used in Step 0.3, **desktop + mobile**, composed in the approved language. (Stitch: verify each with `get_project`.)

## Step 0.6b — MOTION & ANIMATION (optional)  [UPGRADE 2026]
Layout is done in the mockup tool (Stitch **or** Claude Design 2.0); motion is added in CODE (Framer Motion, already in our stack). Keep the anti-slop rules; respect prefers-reduced-motion. Bolt / Vercel-as-pipeline / Figma remain **not adopted** (Claude Design 2.0 IS adopted as a co-equal mockup tool — see Step 0.3).
- **The ONE distinctive element:** a real, clickable/animated hero that proves the product — not a stock image.
- **Animated background (if wanted):** stills from Recraft/Higgsfield/Nano Banana → animate with the reusable looping prompt *"looping animation, no camera movement, no extra elements, no zoom in or zoom out, looping animations"*; OR a **scroll-scrub hero** from an image sequence (image → short video → JPG frames → scroll animation).
- **Reference-screenshot → rebuild:** screenshot the exact inspo/competitor section and rebuild it in OUR tokens (complements the Firecrawl brand-scrape in Step 0.1). **Go-to source = Mobbin** (Copy any real shipped screen → rebuild it in our tokens; see Step 0.1).
- **[UPGRADE 2026-07] Concrete scroll-scrub + character-hero recipe** (from 4 tutorials watched 2026-07-02 — K. Skelly x2, Viktor Oddy, incl. Seedance 2.0): (1) still (Higgsfield GPT Image 2 / Nano Banana Pro, from a Pinterest ref) → **Seedance 2.0 image-to-video** (static camera, no panning/crop; attach original ref clip + new still and **match the clip length**); (2) **export the clip at 1080p, not 4K** — web load speed beats resolution for a background; (3) **scroll-scrub** the hero via `video.currentTime` set per animation frame **tied to scroll position, not time** (so scrolling up reverses it) — smooth on all devices, no lag; (4) **character-split headline reveal** (title splits into individual characters that fall/fade/squish left-to-right on scroll) + staggered card fades (blur+scaled-down → sharp); (5) for a **transparent hero character** over a light page: DaVinci Resolve Magic Mask around the character → add a solid white plate → set the video blend-mode to **"darken"** to key out the white. Keep it Framer-Motion-in-code; respect `prefers-reduced-motion`.
- **[UPGRADE 2026-07-07] One-shot cinematic "fake-3D scroll" hero via Claude Code + Higgsfield MCP** (from `m-f56P_L660` / Zubair, watched 2026-07-07): add Higgsfield as a **custom remote MCP connector** in Claude Code (plus → connectors → add custom → paste MCP URL → OAuth → toggle on), pick an **Awwwards site-of-the-year** as a style anchor (drop its URL into the prompt), and one-shot the page with a template like: *"Build an award-winning cinematic 3D scroll website for [brand/persona], study the style of Awwwards site-of-the-year, huge bold typography, cinematic scroll visuals, generate all imagery/video with Seedance 2.0 on the Higgsfield MCP."* The "3D scroll" is just **one continuous Seedance-2.0 video sliced to frames and driven by scroll position** (same `currentTime`-per-frame trick as above — no real 3D). Portfolio shortcut: upload one reference photo and let the agent generate all derived imagery. **Caveats (do not skip):** (1) this **BYPASSES Stitch/Claude Design** — treat it as a separate optional "AI-video landing page" track, NOT a replacement for the canonical pipeline; (2) the **Higgsfield MCP calls are the paid line item** (not Fable) — cap the number of AI-video sections per page and prefer a controlled Higgsfield run handing static assets to the build over open-ended agent MCP spend; (3) demos stop at **localhost — add an explicit Metanet-FTP deploy step**; (4) set Fable-5 effort to **"extra"** (the sweet spot), not "max".
- Verified-technique source + fact-check: `C:/Business/Knowledge Base/BACKTEST.md`.

## Step 0.7 — DESIGN QA

Lightweight review of all screens before any code: consistency, content completeness, responsive behavior, brand compliance. Fix in the mockup tool (Stitch via paste-ready prompts; Claude Design via direct canvas edits), then proceed.

**Run the installed `design-review` skill (backlog #13).** `design-lint.mjs` (Step 0.0c) is the mechanical gate — layout heuristics + axe + mobile-fold + the perf budget — but it does NOT do a multi-viewport interactive visual pass. The `design-review` skill (`.claude/skills/design-review/`, Playwright-driven, Stripe/Airbnb/Linear standard) IS that pass: it walks the built screens at desktop + mobile, exercises interactive states, checks console, and reports craft issues the static linter can't see. Invoke it here (and it also runs PR-side via `design-review.yml`). The two are complementary: lint = pass/fail gate, design-review = the elite human-grade critique. Fix findings before code.

**Missing-state coverage (G11) — MANDATORY checklist.** A single-page lint cannot see these; confirm every one is designed (not just the happy path), because they are where real products feel broken: **empty state** (list/dashboard with no data yet) · **loading/skeleton** · **error state** (failed fetch, 4xx/5xx, offline) · **onboarding / first-run** (no account, first login) · **delete/destructive confirm** · **paywall / quota-reached / trial-expired** (for paid products) · **form validation errors**. Any state without a design is an open QA item — do not pass Step 0.7 until each applicable one exists.

---

## IMPLEMENT

**Who:** AI, from the approved mockup designs (Stitch or Claude Design 2.0).
- All frontend code MUST match the approved mockup HTML and use `docs/design-tokens.json`. Never hardcode colors/fonts/spacing.
- Active skills: `brand-guidelines` (per-project, token compliance), `frontend-design` (global craft safety net).
- The approved mockup HTML is the visual reference; refinement happens in code (no rebuild in a third tool).
- **[UPGRADE 2026-07] Adopt code-side design skills** (from AI LABS, watched 2026-07-02 — we already run `frontend-design`, this is the same pattern matured): (1) **Anthropic's official front-end design skill** — its `SKILL.md` enforces our exact anti-slop rules (bans Inter/Roboto/Arial, purple-on-white, converging on Space Grotesk; forces a committed direction) — best for landing/marketing pages; (2) **shadcn skill + shadcn MCP** for functional app dashboards (pull correct pre-built components instead of hand-generating); (3) a **GSAP skill** that steers motion to GPU-friendly transforms (not layout-thrashing size/position changes) — pairs with Step 0.6b; (4) optional **taste-preset** skill to lock a house style (pick ONE, do not stack). Skills load **on-demand** (token-cheap) vs an always-on MCP that sits in every context window. Ledger: `WORKFLOW_UPGRADES.md` GAP 11.

## VALIDATE

**Who:** AI, automated.
1. Kill + restart dev server.
2. Puppeteer at 1920x1080 (standard) and deviceScaleFactor=2 (retina); also check mobile width.
3. Compare rendered page vs the approved mockup (whichever tool produced it — Stitch / Claude Design 2.0 / Pencil.dev); measure alignment programmatically.
4. Console error check. All delivery gates pass -> ship.

## Design Review Gate

The human sign-off that ends the design pipeline — the anchor the Cockpit branch steps reference by
`doc_ref` (the `review` gate on the `design` / `mockup` branches, the `client-review` gate on the
client-facing `prototype` branch, and `design_approved` inside the `new` branch's design step). It is
posted via `post_gate('review'|'client-review', 'pass', <receipt>)`:
- **Enters on:** the §0.0c enforcement loop passing (design-lint exit 0 + the `design-review` skill's
  multi-viewport pass, Step 0.7) AND the VALIDATE checks above green.
- **Receipt required:** the approved mockup/screens (link or file) — for the client `prototype`, the
  polished clickable build the customer will see; a gate cannot PASS on a claim.
- **Human call:** Roger for internal `design`/`mockup`; the client for `prototype`. This is a real
  decision gate — automation runs the loop up to it, the human approves it (the design invariant).

---

## Anti-slop rules (enforced at design AND code time)
- No generic font usage (Inter/Roboto/Arial used lazily without intention).
- No purple gradients on white; no neon/glow.
- No predictable symmetric card grids; no cookie-cutter hero sections.
- No timid evenly-distributed palettes — commit to a dominant color with sharp accents.
- Every design has ONE memorable, distinctive element.
- Typography creates real hierarchy (not just size changes); spacing has rhythm.
- **[UPGRADE 2026-07] Do not sand off the personality.** AI defaults to a clean-but-sterile "Apple-ish" look that strips brand character — in the Isenberg directory build (watched 2026-07-02) the polished rebuild lost the hand-made mascot that made the old site memorable and convert. Anti-slop cuts BOTH ways: escape generic AND keep a human/handmade signature (mascot, illustration, voice) as the ONE distinctive element. "Clean" is not the goal; *distinctive and on-brand* is.
- **[UPGRADE 2026-07-29] These rules are now auto-enforced by two installed skills** (`design-taste-frontend` + `web-design-guidelines` in `project-starter/.claude/skills/`). Run `web-design-guidelines` over the built UI as a QA pass (Step 0.7) and fix everything it flags. See Step 0.3 "Anti-slop pre-flight" for the moodboard->wireframe->4-part-prompt->iterate sequence. Ledger: GAP 20.
- **[UPGRADE 2026-08-09] Treat the design tokens (Step 0.4) as a MACHINE-CHECKABLE contract, not a prose style guide — and run the check as a post-edit loop, not once** (from `_0E-dzhjCoY` Build Great Products 6h course — "Claude Video" playlist batch. Ledger: GAP 27. Engineering — sound). The token JSON (+ the brand book / `design.md`) is the single source of truth; wire the design-lint check (our `web-design-guidelines` / `design-taste-frontend` skills) so the agent runs it **after every file edit** and self-heals — "if it reports violations, fix each one and run it again; repeat until it passes" — instead of only at Step 0.7 QA. This is real anti-drift: it catches an off-token colour/spacing the moment it's introduced. ⚠ Course creator sells paid coaching → keep the loop pattern, ignore the $/MRR claims (BACKTEST survivorship tier). Keep the human/handmade signature rule above — a passing lint is necessary, not sufficient.

## DESIGN_BRIEF.md template
```markdown
# [PROJECT] Design Brief
## Product
- Name / Description (one sentence) / Audience / Goal
## Brand Direction
- Accent color (hex) / Font(s) / Theme (light|dark|both) / Tone / Reference (sites/screenshots)
## Design Principles
- Refactoring UI + Tailwind defaults for spacing/type/color/shadow.
- Anti-slop rules (above).
## Pages/Screens Needed
- [ ] ...
```

## File structure
```
project/
  docs/
    DESIGN_BRIEF.md       <- 0.1
    design-tokens.json    <- 0.4 (absolute truth)
    DESIGN_SYSTEM.md      <- 0.4
    brand-book.html       <- 0.5 (standalone)
    [stitch exports / screenshots]  <- 0.3, 0.6
  .claude/skills/brand-guidelines/SKILL.md  <- 0.4 (auto-enforced)
```
**Conflict hierarchy (higher wins):** 1) design-tokens.json  2) brand-guidelines SKILL.md  3) DESIGN_SYSTEM.md  4) approved mockups — Stitch or Claude Design 2.0 (visual reference).

---

## Existing Project Workflow
For projects with code but no formal design system:
1. Extract tokens — audit CSS vars / Tailwind config / fonts / hardcoded hex -> `design-tokens.json`.
2. Generate `brand-guidelines/SKILL.md` from tokens.
3. Reconcile code vs tokens; document decisions.
4. (Optional) tokenize hardcoded hex; (optional) brand book HTML.

## Maintenance
- Change a color/font/spacing -> update `design-tokens.json` FIRST, then regenerate SKILL.md + DESIGN_SYSTEM.md.
- Quarterly hex audit: `grep -rn '#[0-9a-fA-F]\{6\}' src/` and reconcile.
- On major redesign: re-extract tokens, rebuild files, regenerate Stitch screens.

---

## Supporting references (detail, not competing truth)
- Stitch MCP quirks: playbook memory `reference_stitch_api_quirks.md`.
- Stitch workflow origin/history: playbook memory `feedback_stitch_for_mockups.md` (2026-03-23).
- This doc supersedes those for the *process*; they remain as supporting detail only.
