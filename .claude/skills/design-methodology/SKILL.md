---
name: design-methodology
description: Route-first, process-over-tools design methodology for producing world-class UI. Load BEFORE any website/UI/landing-page design work (alongside design-taste-frontend + web-design-guidelines). Encodes the KB-synthesized workflow; tools are swappable executors.
---

# Design Methodology (process > tools)

> Full derivation: `docs/DESIGN_METHODOLOGY_KB_SYNTHESIS_2026-08-11.md` + canonical `DESIGN_PIPELINE.md` §0. Core law: **generic AI output is a PROCESS failure, not a tool failure.** Never one-shot. First output = iteration 1.

## STEP 0 — pick the ROUTE first (conversion decision, not aesthetic)
- **A. Clean/Minimal SaaS** = DEFAULT for fleet products (cold visitors must be convinced; copy-forward, fast).
- **B. Editorial/Brand** = distinctive, moderate risk.
- **C. Cinematic/Animated** = ONLY pre-sold/aspirational/launch/flagship. Real conversion risk (heavy animation ~31s vs ~2s load, KB Showalter). Recommend the route from product+audience; WARN if C is chosen for a page that must convince.

## THE PIPELINE (every route shares the spine)
1. Strategy first: 1 audience, felt pain, dream outcome, awareness stage (Erhart 40/40/20).
2. Design backwards from the target feeling (first-second emotion).
3. Reference research → moodboard → commit to ONE theme. Ground in REAL screens (Mobbin/Firecrawl), not adjectives.
4. IA + wireframe with BEHAVIOUR; lock layout BEFORE styling.
5. **Lock the DESIGN SYSTEM (tokens from one hex / scraped identity) — single biggest quality lever.** Semantic role tokens.
6. Copy first, design second (above-the-fold = 80-90%).
7. Custom hero + real assets (hero = 90%; route-specific).
8. Craft via canvas edits not re-prompts; motion as a governed token.
9. QA = the enforcement loop below.

## CONVERSION STRUCTURE (routes A/B)
Above-fold answers who/what/how in 3-5s. Message-match the ad in H1. Section order by awareness (cold=pain-first, hot=proof-first). Body = one argument: hero→pain→solution→differentiator→PROOF→benefits→how-it-works(≤3-4)→FAQ→CTA. Hero: title(value not category)+subtitle(mechanism)+visual(customer/outcome not dashboard)+proof+CTA(action+outcome); ≤90vh. Proof = believability ladder, volume beats carousel. Attention ratio ~1:1, one exclusive accent. Features welded to quantified benefits. NEVER invent numbers — use real third-party data.

## AUTOMATION = encode taste ONCE as artifacts (decide per brand, not per page)
(1) guardrails spec (never/always anti-slop) (2) locked design system from a real ref (3) grounding in real shipped refs (4) self-critique→regenerate eval loop vs on-brand+performance criteria (5) pre-decided distinctive-element rule. Residual human = pick ref/direction + signature hook once; supply REAL proof; final review of ONLY 4: narrative resonance, hero persona-truth, style-risk, scarcity honesty.

## ENFORCEMENT LOOP (run after EVERY build until pass; supersedes one-shot QA)
Lint: ≤~4.4 links/page, attention ratio ~1:1, one exclusive accent, ad↔H1 congruence, label on every input, 60/30/10 colour + ≤4 sizes/2 weights + 8pt grid, radius/stroke consistency, hero ≤90vh, H1/H2/CTA above fold on mobile. A11y: Lighthouse + axe + eslint-plugin-jsx-a11y (4.5:1). PageSpeed = release-blocker. prefers-reduced-motion. Missing-state check (onboarding/empty/error/delete-confirm/paywall). Run `web-design-guidelines` + `design-taste-frontend`. "Fix each violation, re-run until pass."

## ANTI-SLOP (kill defaults)
No lazy Inter/Roboto/Arial, no purple-on-white, no Space-Grotesk convergence, no uniform centered icon-card grids, no 3D SaaS blobs. Commit to ONE direction. Keep ONE distinctive/human element (sterile-clean is a failure mode). Typography ~50% of the design.

## TOOLS = swappable executors (pick per route; see DESIGN_PIPELINE.md §0.0d)
Refs: Mobbin + Firecrawl. Components: 21st.dev Magic MCP + shadcn. Mockup: Stitch/Claude Design/Pencil.dev. Editorial-animated: Framer + Unframer (fit-check). Assets: Higgsfield + Recraft. Motion: Framer Motion/GSAP. The tool is never the point — the methodology is.
