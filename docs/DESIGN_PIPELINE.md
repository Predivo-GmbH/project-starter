# Design System Pipeline — SINGLE SOURCE OF TRUTH
> Overall workflow canonical (all phases): `C:/Business/Templates/1-Person AI Business Playbook/docs/ONE_PERSON_AI_BUSINESS_WORKFLOW.md`. This file is the DESIGN sub-pipeline.

> **This is the ONE canonical design workflow for every Predivo GmbH product.** If any other doc
> (predivo `REDESIGN-HANDOFF.md`, any `ONE_PERSON_AI_BUSINESS_WORKFLOW.md` "Step 0", project
> `.claude/commands/design-*`, etc.) disagrees with this file, **this file wins** and the other is stale.
> **PROCESS > TOOLS (see §0). Route-first (§0.0). The UI design route = RECONSTRUCTION (Step 0.3): Mobbin composition + Firecrawl real tokens + agent code build + ONE signature element (proven route R-DESIGN-03).** Stitch and Pencil.dev are RETIRED as design tools (2026-08-18); Claude Design serves only as an optional AUDIT/review surface via its MCP, never as the generator. Figma / Bolt / Vercel-as-pipeline remain not-adopted.
> Last updated: 2026-08-18 (Step 0.3 REWORKED: generative mockup tools retired → RECONSTRUCTION route R-DESIGN-03 — Wave-1 audit proof on Hair Dresser: v1 Fresha=sloppy, v2 Mercury=high-end, v3+signature=Roger-approved; Stitch has no image input, Claude Design chat is plan-limit-coupled; Claude Design MCP unlocked as audit/review surface). Prior: 2026-08-18 (**§0.1 LOGO ROUTE decision tree added (wordmark vs mark → style group → subject line, mandatory brief fields) + §0.2 recipe validated end-to-end: refs + subject + explicit style qualities + subject-first wording → candidates → human pick + mandatory originality check vs refs**; Recraft RETIRED for logos → Higgsfield reference-style transfer (Flux Kontext + Nano Banana 2), framed as the general EXAMPLE-DRIVEN "style-from-refs + subject-brief" factory method; executor table + pipeline diagram updated; proven route = R-LOGO-01. Roger sign-off via task dispatch; evidence = tool test 2026-08-17/18 incl. corrected result downloads. Prior: 2026-08-15 Mobbin MCP promoted from "future / needs-auth" to **LIVE + VERIFIED** default reference-research executor — updated §0.0d table + §0.1; verified this session via `search_flows`/`search_screens` returning real salon-booking references; Roger directive: the real-reference pull must be a documented step when creating any UI). Prior: 2026-08-11 (§0 added: process-thesis + ROUTE SELECTION + automation-as-artifacts + enforcement LOOP + tool executor table, from `DESIGN_METHODOLOGY_KB_SYNTHESIS_2026-08-11.md`; Pencil.dev re-adopted; approved by Roger). Prior: 2026-07-14 (Mobbin added as a curated reference source in Step 0.1 + a sourcing note in Step 0.6b — inspiration input, NOT a new stage or a Stitch/Claude-Design replacement; approved by Roger). Prior: 2026-07-02 (Claude Design 2.0 promoted to a co-equal path with Stitch, approved by Roger — reverses the June "Stitch-only / do NOT adopt Claude Design" stance). Prior: 2026-06-18.

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

**WIRED INTO THE BUILD (gating loop).** `package.json` → `"design-lint": "node scripts/design-lint.mjs"`. The deploy workflows (`deploy.yml` prod + `deploy-staging.yml`) run a **Design-lint gate** step after `npm run build`: boot `vite preview` on :3000, wait for it, run the lint — a non-zero exit BLOCKS the deploy (staging-first; design changes reviewed on staging before prod). **Prototype branch adds (2026-08-20, Roger: document-only, same convention as design-lint — project-starter has NO package.json by design):** `"prototype-qc": "node scripts/prototype-qc.mjs"` in the per-project `package.json` scripts at scaffold, with devDeps `playwright` + `@axe-core/playwright` (same stack as design-lint, nothing new). The runner + `prototype-qc-merge.mjs` + the agent-pass runbook live in `project-starter/scripts/` and are copied per-project like `design-lint.mjs`.

### 0.0d TOOL / MCP EXECUTOR TABLE (tools serve the methodology; pick per route)
| Stage | Executor(s) | Status |
|---|---|---|
| Reference research | Mobbin (premium, dedicated Chrome) + Firecrawl scrape | Mobbin browser works now; **MCP LIVE + VERIFIED 2026-08-15 (`api.mobbin.com/mcp`) — `search_flows`/`search_screens`/`search_sections` return real shipped refs. This is the DEFAULT reference-research executor: pull real refs FIRST, then DEFINE (§0.1a).** |
| Components | 21st.dev MCP + shadcn MCP | **21st.dev migrated to HTTP `21st.dev/api/mcp` 2026-08-11, needs `/mcp` auth next session**; shadcn TBD |
| UI build (was "Mockup") | RECONSTRUCTION: Mobbin MCP (composition/coverage) + Firecrawl branding scrape (real tokens) + agent code build — NO generative mockup tool (R-DESIGN-03). Mobile = dual-form-factor pull (web + ios) and dual-width build/review — mandatory, never a follow-up pass. | ✅ PROVEN 2026-08-18 (Hair Dresser v3) |
| Review surface (optional) | Claude Design via MCP (write_files, pin-comment loop) — AUDIT function only, never generator | consent granted 2026-08-18 |
| Editorial/animated builder | Framer + Unframer MCP (Framer→code) | NEW — fit-check before adoption |
| Assets (stills) | Higgsfield image menu — surface the FULL set (`skills/higgsfield/image-models.md`), do not default to one: **Soul 2.0** (FREE, 5,000 gens, 2K, Soul ID character consistency — the cost-first pick) · **Seedream 5.0 Lite / 4.5** (up to 4K, unlimited batch — high-res) · **Nano Banana 2/Pro** (character/reference + text rendering) · **GPT Image 2** (design/text edit + refinement) · **Recraft** — RETIRED for logos (missed the style, ~50x cost); vectorizer/bg-removal utilities OK. | in use |
| **Logos** | **Higgsfield reference-style transfer — Flux Kontext + Nano Banana 2** (style-from-refs + subject-brief, §0.2 + R-LOGO-01). **Recraft RETIRED** for logo generation. | in use (2026-08-18) |
| Assets (motion) | Higgsfield **Seedance 2.0** | in use |
| Motion | Framer Motion / GSAP (GPU transforms) | in stack |
| QA | web-design-guidelines · design-taste-frontend · Lighthouse · axe | installed |

---

## Core rules (read first)

- **FIRST pick the ROUTE (§0.0), THEN run the RECONSTRUCTION build (Step 0.3): human picks the reference product, Mobbin + Firecrawl + agent code build produce the screens. The approved HTML IS the final visual reference; all further refinement happens in code.**
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
> ⚠ **HOW this step is run is written down: see `0.1-RUN` at the BOTTOM of this file. Read it FIRST.** It is kept there, not here, because every step on every branch points into this document BY LINE NUMBER, so inserting text anywhere breaks all the pointers below it. That happened on 2026-08-27 and broke eight of the nine.
### 0.1-PRE — INHERIT THE PARENT'S SCOPE BEFORE WRITING A WORD OF THE BRIEF [ADDED 2026-08-24, Roger approved]

**This brief is almost always DERIVED. Three things happen before any design thinking:**

1. **Name the parent requirements document** in `docs/DESIGN_BRIEF.md` (full path + date read). A brief with no named parent cannot be diffed against anything, so it cannot be verified.
2. **Copy the parent's exclusions VERBATIM into the brief's `⛔ DO NOT BUILD` table**, with the section/line where the parent says so. Do not summarise, do not re-derive, do not judge which ones "obviously" still apply. If the parent lists none, write *"parent lists no exclusions"*; never leave it blank.
3. **Fill the `Third-party services` table** for every outside service the design assumes (payments, auth, email, storage, maps, AI): what we rely on it for, **the vendor doc URL read THIS session, and the date**. Build from the vendor's CURRENT documentation, never from what the model already believes. The date is the point: it tells the next reader how stale the assumption is. Tick the "no third-party service" box instead if none apply.

**Then, before the brief leaves DEFINE:** every requirement ID it cites (`FR-`, `UXR-`, `NFR-`, `RULE-`, `SCR-`, `BR-`) must have been **opened in the parent and confirmed to exist**. Tick the box in the brief.

> **Both halves of a real failure, 2026-08-20 (hairdresser prototype).** The parent classed checkout as `OOP` ("nicht bauen") and listed POS, Warenwirtschaft and Buchhaltung under "Bewusst NICHT getestet". **That exclusion list existed and was simply not carried into `docs/DESIGN_BRIEF.md:53`**, which instead invented Produkte / Kasse / Reporting. The build then implemented the drifted brief faithfully, in its very first commit. **The drift entered at DEFINE, not at build** — the builder was being obedient.
> The second half: the invented screens were justified with `FR-014`, `NFR-007`, `RULE-007`, `UXR-013`, **none of which exist** (the parent's lists end at FR-013, NFR-006, RULE-006, UXR-012). **A fabricated traceability ID is worse than no citation**, because a reviewer checking "is this documented?" sees an ID and stops. It survived a content-compliance audit AND the QC pass for exactly that reason.
>
> **Generalisable:** when a downstream artifact looks wrong, diff the INTERMEDIATE doc against the ORIGINAL requirements before blaming the build. Brief-level invention is invisible at build time.

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

**Steps (the route as run + validated on Studio Haarwerk, 2026-08-18):**
1. **Read the LOGO ROUTE from the 0.1 brief** (wordmark vs mark). If wordmark → typeset the name in the brand font, done — no generation, no credits.
2. **STYLE SHORTLIST (human taste, shown not told).** Show the style groups WITH their real generated example tiles (the library's validation outputs, `logo-reference-library/_pool/val/real_*.png` / REAL-RESULTS.html) — the human picks 2–4 preferred styles from what they SEE, never from descriptions alone. Style register must match the brand tier (lesson: soft-organic mono reads clip-art on literal everyday objects).
3. **SUBJECT (human intent).** One line, concrete (e.g. "a pair of scissors"). AI proposes options from the brief; human picks.
4. **CANDIDATE RUN (one per picked style).** Nano Banana 2 (`--image-references` = the group's raster-PNG refs) or Flux Kontext (≤4 refs), prompt = **subject first + explicit style qualities** ("soft, rounded, organic flowing curves, flat monochrome, no sharp edges") — never "keep the exact same style". 1.5 cr each, `generate cost` preflight first, one route at a time. Present ALL candidates side by side on a page **verified to load in Roger's browser before he is asked to look** (Rule 53 applies to the presentation itself).
5. **HUMAN PICK → PRODUCTION PACK (no further generation needed):** master PNG (1024) **with TRANSPARENT background — never white/solid (Roger, standing 2026-08-19)** + **mono fallback** (programmatic extraction from the master — luminance threshold with enclosed-hole preservation; NEVER a crude threshold blob — v1 was rejected as useless, v4 with loop holes + smooth edges accepted; also transparent) + favicon 16/32/180 + **lockup sheet** (mark + name typeset in the brand font, e.g. Fraunces) + colour variants per the brief palette. **All portal/prototype text in ENGLISH only (Roger, standing 2026-08-19).**
6. **ORIGINALITY CHECK (mandatory):** iconic refs CAN leak through (Craft petals clone; Google-Ads echo) — diff the pick against the refs; reject lookalikes.
7. **RECORD THE DECISION (mandatory):** write the final choice into the project's DESIGN_BRIEF (date, style, subject, asset paths) + assets into the project's `assets/logo/` + advance the cockpit LOGO step with the evidence link. A logo decision that lives only in chat is lost.

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

## Step 0.3 — UI BUILD (Reconstruction route — R-DESIGN-03)

**No generative mockup tool.** Stitch and Pencil.dev are retired as design tools (2026-08-18); Claude Design is an optional review surface only. The design never crosses a text boundary: every stage hands the next a concrete artifact.

1. **REFERENCE PICK (human).** AI proposes 3 candidate reference products at the right craft level (Mobbin pulls + one-line rationale + anti-pattern call-out). The human picks — this is the decisive taste call; the reference's craft is the ceiling.
2. **COVERAGE + COMPOSITION (Mobbin MCP, 0 cr).** Pull per-screen reference images for EVERY screen incl. states (login, dashboard, empty/error/onboarding/paywall). Output: screen map — each screen bound to 1–2 reference images.
3. **TOKENS (Firecrawl, ~1–2 cr).** `/v2/scrape` `formats:["branding"]` on the reference's live site → `design-tokens.json` (real hex/type/radius/spacing) + deliberate identity deltas. Never eyeball values from rasters.
4. **BUILD (agent, code-native).** Per screen: reference image (composition) + tokens (values) + brief (content/IA) → plain HTML/CSS. Code IS the mockup; the deliverable is openable HTML. **Build the prototype SINGLE-PAGE (hash-routed screens, one index.html)** — the portal prototype gate (R-PROTO-01) serves it via iframe srcDoc; multi-page navigation breaks against the edge gateway's text/html rewrite.
5. **SIGNATURE (mandatory).** Add ONE owned distinctive element per product — otherwise the result is an anonymous clone.
6. **QA + AUDIT.** Visual diff per screen vs its reference + design-lint loop until pass. Optional: publish into Claude Design via its MCP (`write_files`, not generation) for Roger's pin-comment review loop (list_comments → revise → ack_comments).
7. **MOBILE IS HALF THE DESIGN (mandatory).** The reference pull is dual-form-factor from the start: Mobbin `platform:"web"` (desktop composition) AND `platform:"ios"` (the reference's OWN mobile language — nav pattern, type/spacing scale, sheet patterns). Never improvise responsive behavior.
8. **Dual build, dual review.** Every screen ships desktop + mobile in the same pass (mobile nav per the iOS reference, tap interactions, sheet modals, ≥40px touch targets). Review captures at BOTH widths (1920 + 390) via CDP device emulation — window-size captures are invalid (desktop Chrome clamps small windows). The token set is INCOMPLETE until it holds desktop + mobile + the responsive contract linking them (see `design-tokens.json` → `responsive`).

**What FAILED (do not repeat):** Stitch (no image input in its MCP; text-prompt drift), Pencil.dev (adopted on research, never exercised), Claude Design chat as generator (weekly plan-limit coupled), pattern-extraction → text brief (the drift boundary), utilitarian references for high-end targets, skipping the craft pass.

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

**PROTOTYPE ROUTE — Step 0.7 runs as the G-PROTO profile (2026-08-20).** For the client-facing `prototype` branch, Design QA is codified as **G-PROTO** (`C:/Business/Audits/PROTOTYPE_QC_PROFILE.md`): Tier A hard blocks (gate compatibility, flow completeness, demo-data safety, console clean) + Tier B scored 100 (bar 85) + Tier C human (real-device pass). The runner `scripts/prototype-qc.mjs` fills the mechanical checks and emits `prototype-qc.json`; the **agent pass** (`scripts/prototype-qc-agent-pass.md` + `scripts/prototype-qc-merge.mjs`) fills the judgement slots (B2 state coverage per screen — the G11 list above —, B5 content in the client's market language, B6 palette-vs-brief, confirming the A2/A3 candidates) and merges into the same report. Tier C `acknowledged` flips ONLY after the C1 real-device pass (iOS Safari + Android Chrome). Until then the report verdict is `incomplete` **by design**. Cockpit wiring: the prototype branch's `qa` step is gated `prototype_qc` (migration 025; a `publish-prototype` step precedes it so QC tests the artifact the client opens), and `client-review` re-runs Tier A as gate `client_review_qc` (migration 026, decision D3). The gate rejects prose, `incomplete`/`fail` verdicts, and below-bar scores — the report URL is the only receipt.

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
posted via `post_gate('review'|'client_review_qc', 'pass', <receipt>)` — since migration 026 the
prototype's client-review gate key is `client_review_qc` and its receipt is a FRESH prototype-qc.json
passing the Tier-A re-run (decision D3: catches edits made after QC passed):
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


---

### 0.1-RUN - THE ORDER THIS STEP IS ACTUALLY RUN IN [ADDED 2026-08-27, earned on predivo-website-prototype]

**Read this before 0.1-PRE.** Everything below 0.1-RUN describes WHAT the brief must contain. This
describes HOW it is obtained, and it did not exist until 2026-08-27. Its absence cost three deleted
projects and an entire session: without a written order, the agent reconstructed one badly, in front
of Roger, and filled two fields in by itself along the way.

**Q0. BEFORE ANY QUESTION: read what this project already decided and already rejected.**
[ADDED 2026-08-31, and it cost 180 credits to learn.]

**GREENFIELD DOES NOT MEAN AMNESIA.** It means: do not carry old ANSWERS over as if they were still
true, and never fill a field in from an old document. It does NOT mean: pretend the project has no
history. Those are different things and the method did not tell them apart.

**What happened.** A visual direction was LOCKED on 2026-08-19 after three concept images and a
human taste call. A clip was generated against it and REJECTED, with the reason written down. A
corrected concept was written the next day that diagnosed the failure exactly and specified the fix.
Eleven days later the same step was re-run "on a green field", consulted none of it, produced a
weaker answer, and spent 180 credits reproducing a failure that was already documented on disk in
the same repository. The rejection reason the second time was almost word for word the first one.

**So, before Q1, do this and put the result in the chat:**

1. **List the project's own design documents** (`docs/*.md`, concept files, session state, resume
   docs) and the dates on them. `git log` the design directory. Two minutes.
2. **Name, out loud, every DECISION that was locked and every thing that was REJECTED, with the
   reason.** A rejection with a written reason is the most valuable artifact a project has: it is
   the only thing that stops the same mistake being paid for twice.
3. **Ask the human which of those still stand.** One question, listing them. He may keep all of
   them, throw all of them out, or split. That is his call and it takes one exchange.
4. **Only then start Q1.** Anything he keeps is now a supplied value, so it enters the brief
   legitimately without breaking the no-assumptions rule.

**The distinction, stated once so it cannot be lost again:** an old ANSWER is an assumption and may
not be reused. An old REJECTION is evidence and must not be discarded. A locked DECISION is neither
until the human says which it is, so ask.

**Q1. ASK FIRST: is there a requirements document this brief has to derive from?**
- **YES ->** get its location, read it, name it in the brief with the date read, and run 0.1-PRE:
  copy its exclusions in VERBATIM with the line they came from, and confirm every requirement ID.
- **NO ->** the brief is the first document. Say so in the brief, in the human's words, and go to Q2.
- **NEVER answer this question yourself.** "Greenfield" means do not carry old work over. It does
  NOT mean "declare that no requirements document exists". Those are different claims and only the
  human can make the second one.

**Q2. If there is no parent, ask these ONE AT A TIME, in this order.** Every one via
AskUserQuestion with clickable options and a recommendation (Rule 18). Never batched. Never as plain
text A/B/C. The order matters: each answer narrows the next.

0. **WHICH ROUTE?** A clean and minimal, B editorial and brand, or C cinematic and animated. See
   section 0.0. The method calls this "the ONE up-front human decision, do this FIRST", and it is
   listed here as question zero because it changes the answer to almost everything below it,
   including which references get pulled and whether there is any motion or footage at all.
   ⚠ ADDED 2026-08-27 because the first written version of this questionnaire OMITTED it. The step
   is literally named "brief + route + references" and the route was still skipped. If a required
   question can go missing from the list that exists to stop questions going missing, the list is
   not enough on its own.
1. **Whose is it, and what is it called?**
2. **What are we building?** (marketing site / product interface / single page / brand piece)
3. **When it works, what has the visitor done?** (made contact / signed up / bought / just understood)
4. **Who is it for?**
5. **What is the claim it rests on, in one line?**
6. **How should it feel?** (this is what later decides which references get pulled)
6b. **IF THE ROUTE IS C: what does the motion actually SHOW?** Not "there is a video", but what the
   visitor watches happen. Added 2026-08-27 after three reference shortlists were produced without
   it, all useless. The answer changes what a good reference even is: a film that runs THROUGH the
   scroll needs a reference that holds content over footage across a long scroll, which is a
   completely different site from one with a hero clip and ordinary sections below it.
7. **Light, dark, or both?**
8. **What kind of logo?** (wordmark / drawn mark / defer) - Step 0.2 refuses to run without this.
9. **How many screens?**

**Q2b. PAGE STRUCTURE. Ask this on BOTH routes. [ADDED 2026-08-28]**

The single most important input and it was missing entirely. Roger found it; the reference builds
both open with it; one of them states it outright: *"how you structure the page, how you want the
user journey and the flow to be, that is actually the most important part rather than a website that
just looks good."*

Ask, one at a time:
1. **What already exists?** Real photographs, real screens, a logo, real numbers. Everything
   generated later must REFERENCE these so it does not drift into a different object. The reference
   build started from exactly two real assets and generated the rest from them.
2. **What sections does the page have, in order?**
3. **What is each section FOR?** What the visitor should understand or feel by the end of it.
4. **Where does the primary action sit, and where does it repeat?**
5. **What is visible before any scrolling at all?**

WHY IT WAS MISSING, and this is the general lesson: the route was proven on a static PRODUCT
INTERFACE, where the screen list (login, dashboard, empty, error) hands you the structure for free and
`coverage` simply pulls a picture per screen. A MARKETING PAGE has no such list. Sections are
invented, not enumerated. So the structure never arrived and nothing noticed, because on the branch it
was proven on it had never needed asking.

**Q2c. THE WORDS. Ask this on BOTH routes. [ADDED 2026-08-28]**

Per section: the headline, the supporting line, any list items, the label on the button. In every
language the page ships in.

Missing for the same reason as Q2b. On a product interface the copy is predictable labels that come
with the domain. **On a marketing page the copy IS the product**, and a prototype filled with
placeholder text is judged as slop, which defeats the entire purpose of building one.

**Q2d. WITHDRAWN 2026-08-30. It was wrong, and it is left visible rather than deleted.**

Added 2026-08-28 asking which real live site sets the craft bar. That is `reference-pick`'s
question, and rule 3 below already said so, from a ruling made the day before it was written. The
numbering is not renumbered: Q2e keeps its name so that everything referring to it stays true.
The two facts it carried were real and have moved into rule 3, which is where they belong.

**Q2e. THE FILM. Animated route ONLY, and only answerable once Q2b exists. [ADDED 2026-08-28]**

⚠ **There is usually MORE THAN ONE video.** The reference build had two, in different sections, doing
different jobs. Ask all of the below PER animated section.

⚠ **THE STILL COMES FIRST.** The video is NOT generated from a concept and dropped into a layout. The
section is designed with a still already in it, and THAT EXACT STILL becomes the reference image used
to animate it. Getting this backwards costs hours: you end up trying to design a page around a film
that does not exist.

1. **Which sections are animated?**
2. **What is the subject, and WHAT COMES OFF THE LINE?** Two answers, not one.
   ⚠ **"In one noun" was the original wording and it produced a rejected film on 2026-08-31.**
   The answer given was "a factory". A factory is the SETTING. The prompt that came out of it said
   `raw material` and `the object`, never what was being made, and the model filled the vacuum with
   the most statistically ordinary thing a factory makes: a lump of metal. 180 credits.
   So ask BOTH, and write both into the brief:
   - **What is the setting?** Where does this happen and what does it look like.
   - **What is the OBJECT that persists for the whole clip, and what has it become by the end?**
     There must be ONE thing on screen the whole time that visibly changes. Legibility comes from
     PERSISTENCE, not from explanation. A clip where nothing carries across the stages is a mood
     sequence, and it gets rejected with "I don't understand what's being shown" (Roger, twice, on
     two different clips, 2026-08-18 and 2026-08-31).
   **THE TEST:** a stranger who cannot read a single word on the page must be able to say what this
   company makes, from the clip alone. If the answer to "what comes off the line" is not something
   they would recognise, the clip cannot pass that test no matter how well it is generated.
3. **What happens, stage by stage, with SECONDS attached?** The reference prompts are shot lists with
   a clock: front-on for the first three seconds, then rotate and zoom over three, then a top-down pan
   for three, then it exits frame. Not a mood.
4. **What is the camera doing?** ONE unbroken move. A cut kills a scroll-driven interaction.
5. **What does the final frame look like?** It becomes the end-state pin. Skipping it is what made
   separate clips drift until a finished house lost its windows.
6. **What must never appear?** ASK IT. Do not read the list below as the answer.
   ⚠ **This line used to read "People, text, logos, interface" as a flat statement, and that is
   how it was banked into a brief nobody questioned.** `no interface elements` then went verbatim
   into the generation prompt — on a film whose entire job was to show that this company makes
   SOFTWARE. The one device that could have carried the meaning was forbidden by a default.
   People / text / logos / interface are the USUAL answers and they are usually right. **Interface
   is the one that is often wrong**, because a glowing screen is how a physical metaphor says
   "software". So for each item on the list, ask: does banning this also ban the thing the clip has
   to communicate? A prohibition list is a craft rule. **A craft rule that removes the meaning is
   not a craft rule, it is a mistake.**
7. **Light, materials, palette, lens.** Concrete. **Never the word "cinematic"**, which returns the
   model's average of everything.
8. **Scroll behaviour for this section.** Does it pin. What progresses. What appears, and at which
   second. When does it release and let the page carry on. This gets dictated in plain English to the
   builder and works.
9. **Settings:** duration, aspect ratio, resolution, bitrate, **sound OFF**.
10. **What else on the page moves?** The craft rule allows one or two motion moments and the film is
    one of them.

**THE TEST FOR ALL OF THE ABOVE:** take the answers and build the page without asking a single
follow-up question. If you need to ask one, a question is still missing from this list.

**Q3. SHOW THE SUMMARY** as a table, one line per answer, in the chat. Not a file path.

**Q4. ASK: "do you want to change anything in the summary?"** If yes, ask WHICH lines (grouped if
there are more than four), correct them, and **return to Q3**. Loop until the answer is no.

**Q5. ONLY THEN write `docs/DESIGN_BRIEF.md`**, and deliver its full text in the chat.

#### The four rules that make the above work, all of them earned the hard way

1. **No value enters the brief unless the human supplied it.** A value nobody supplied is an
   assumption however obvious it looks. The company name was once filled in from the project title
   on the work board; nobody had been asked, and the whole project had to be deleted.
2. **Never recommend an answer to a question of fact only the human holds.** A recommendation with
   nothing behind it is an assumption wearing a label. Say plainly that no recommendation is
   possible and why. A recommendation IS required everywhere it can be grounded, and the grounds go
   in the option's description so the human can weigh them.
3. **Reference research does NOT happen here**, whatever section 0.1a below says. On any branch that
   has its own `reference-pick` step, pulling reference examples belongs to that step. Doing it at
   DEFINE means either duplicated work or two different answers. (Roger, 2026-08-27. This
   contradicts 0.1a and the R-DESIGN-02 registry entry, both of which place it at DEFINE. Left
   visible rather than silently patched, because the contradiction is itself a finding: the board
   labels DEFINE with R-DESIGN-02, which describes reference pulling, while the section the step
   points at describes writing a brief.)

   **Two things `reference-pick` has to carry, learned on the animated route and previously written
   into the wrong step.** First, a real measured page is still required when the page is animated,
   and this surprises people: the knowledge base gives a METHOD and a handful of pinned values,
   never a complete type scale. Only a measured live page yields every size, line height, tracking,
   spacing unit and radius at both widths. Second, the source depends on what kind of page it is.
   **Mobbin is shipped PRODUCT UI.** For a MARKETING page the source is Awwwards and documented
   builds, which our own knowledge base states and which cost a session three useless shortlists
   when it was ignored.
4. **Nothing about a project may be inferred from a project title, a folder name, a repository, or
   a live site.** Those are where the assumptions come from.

> **The audit verdict this earned, 2026-08-27:** `define` was marked green and proven on the Factory
> Audit board. Running it honestly, once, produced disagreement about where the name comes from,
> whether a requirements document is needed, which document describes the step, and what the step
> even contains. **A step nobody can execute twice the same way was never audited.** The green mark
> on `define` is not trustworthy and the step needs re-auditing after this section has been used on
> a second project.

---
