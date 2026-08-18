# World-Class Design Methodology — KB Synthesis (2026-08-11)

> Synthesized from 3 KB-mining agents over `BackOffice/src/data/knowledge/videos.ts`: Design & Web (34), Marketing: Design & Landing (77), and a cross-KB pass on the cinematic/3D-motion route. All stats below are KB-sourced (creator claims mined this turn), NOT benchmarks; conversion-lift %s are A/B hypotheses, not proven. Purpose: make the DESIGN part of the fully-automated system output world-class UI. Tools are swappable EXECUTORS; this methodology is the moat.

## CORE THESIS (agent A, verbatim)
**"Generic AI output is a process failure, not a tool failure."** One-shot prompt = slop; staged pipeline = world-class. "First output = iteration 1, not a finished site" (Alex Sprogis). Adding Pencil/Stitch/Claude Design changes nothing without the process.

## STEP 0 — ROUTE SELECTION (the one up-front human decision; Roger's frame)
Route is a CONVERSION decision, not an aesthetic one. Ask/decide FIRST, then the system automates the matching approach:
- **Route A — Clean / Minimal SaaS (DEFAULT for the fleet).** Jobs-minimalism or Huang-contained-SaaS. Copy-forward, fast. For cold visitors who must be CONVINCED. All fleet product landing pages default here.
- **Route B — Editorial / Brand.** Distinctive typography/layout; mid conversion-risk. Brand/marketing sites.
- **Route C — Cinematic / Animated (Awwwards-style).** ONLY for pre-sold/aspirational/launch/flagship "wow" pages. Carries REAL conversion risk: heavy-animation page measured 31s load vs 2s copy-forward (KB: Jesse Showalter "Why Beautiful Websites Don't Convert"); Linear removed header animation for this reason. NEVER the default for a SaaS page that must convince a cold visitor.
System should RECOMMEND the route from product/audience and warn when Route C is being mis-chosen.

## THE UNIVERSAL PIPELINE (shared spine; route changes execution)
0. **Strategy/positioning first (before any pixel):** ONE audience, felt pain, dream outcome, traffic-awareness stage. Erhart 40/40/20 (40% audience, 40% offer, 20% page). Page purpose + the ONE action.
1. **Design backwards from the target feeling** (decide the emotion of the first second → work back to layout; Taelo Kim).
2. **Reference research → moodboard → commit to ONE theme.** Ground in REAL shipped UI, not adjectives (Mobbin 600k screens: "research the pattern first, then build"). Translate reference art-style into keyword tags; do NOT copy literally (Alex Sprogis).
3. **IA + narrative structure — wireframe with BEHAVIOR** (what pins/swaps/does on scroll), lock layout BEFORE styling (no-color Wireframe template first).
4. **Lock the DESIGN SYSTEM — the single biggest quality lever.** Tokens (color/type/spacing/radius/motion) built ONCE from one brand hex or one Firecrawl-scraped identity → every screen on-brand by default. Semantic role-based tokens (text-primary/surface/accent) so dark-mode = token swap.
5. **Copy first, design second.** Write the argument; never lorem ipsum. Above-the-fold = 80-90% of the work.
6. **Generate custom hero + real assets** (route-specific; never stock/placeholder-final). Hero = 90% of the site.
7. **Craft/polish + motion.** Canvas edits / side-by-side-with-live-preview, NOT re-prompts (quality AND cost). Motion as a governed token.
8. **QA — automated + live.** Lint + a11y + Lighthouse-to-100 + live-preview tab + missing-state detection (onboarding/empty/error/delete-confirm/paywall).

## CONVERSION STRUCTURE (Route A/B landing; agent B)
- **Above-the-fold answers in 3-5s:** Who are you? / What do you do? / How can you help me? (The Website Architect). 50ms first impression; halo effect (a cluttered hero sabotages the whole page).
- **Message-match / ad-scent:** post-click H1 literally restates the ad's promise (claimed ~31% lift, KB: Oli Gardner, unverified).
- **Awareness-based section order:** cold traffic → Problem-Agitate-Solve pain BEFORE proof; high-intent → proof-first, capture fast (ThrillX).
- **Body = one continuous argument:** Hero → pain (mirror their words) → solution → differentiator → PROOF right after differentiator → benefits → How-It-Works (≤3-4 steps, Hormozi) → objection FAQ → final CTA restating headline+proof.
- **Hero anatomy (Stripe-confirmed):** Title (value/uniqueness, not category) + Subtitle (mechanism) + Visual (the customer/outcome, persona-matched, NOT the dashboard) + Social proof + CTA (action+outcome). H1=hook / H2=mechanism. Dual-CTA (solid primary + low-commitment secondary). Cap hero ≤80-90vh (100vh = false bottom, kills scroll).
- **Proof = believability ladder** (result image/video > name+photo > verifiable source); volume beats carousel; vague testimonial worse than none.
- **Focus / attention ratio ~1:1** (clickable elements vs the one you want clicked); one exclusive accent color used nowhere else; features welded to quantified benefits.
- **Trust is the default deficit:** anchor with real assets (press logos, real faces, real third-party data). NEVER invent numbers (matches fleet rule).

## CINEMATIC ROUTE C MECHANICS (agent C; when chosen)
Anchor on an Awwwards ref in the prompt → generate hero still (Higgsfield GPT Image 2 / Nano Banana Pro, 1080p not 4K) → Seedance 2.0 image-to-video (static camera, match length) → FFmpeg slice to frames → bind `video.currentTime` to SCROLL position (not time) = the "fake 3D". Character-split headline reveal; staggered blur→sharp fades; GSAP GPU-transforms only; `prefers-reduced-motion` mandatory. Cost: Higgsfield credits are the real line item (~800 cr / 32 min for a 6-scene page, KB) → one-off flagship, not A/B-iterable. Compress aggressively; PageSpeed = release-blocker.

## THE AUTOMATION MODEL — encode taste ONCE as durable artifacts
Make the pipeline effectively fully-automated by converting each taste decision into an artifact the agent obeys, so the human decides ONCE per brand, not per page:
- **Committed guardrails spec** (never/always anti-slop rules) → kills defaults (bans Inter/Roboto/Arial-lazy, purple-on-white, Space Grotesk convergence, uniform centered icon-cards, 3D SaaS blobs).
- **Locked design system** from a real reference → enforces color/type/spacing/motion without per-screen judgment.
- **Grounding in real shipped refs** (Mobbin/Firecrawl) → borrows proven taste instead of inventing.
- **Critique-and-iterate eval loop** → Claude critiques its own output vs explicit on-brand + performance criteria, regenerates, repeats (feed real CTR data as a "business brain").
- **Pre-decided distinctive-element rule** (mascot/hand-drawn/signature hero) in the brand brief → prevents the over-clean regression that strips personality (Isenberg $273/day directory lesson).

**Residual human input (small, front-loaded):** pick reference/direction + signature hook once per brand; supply REAL proof/numbers (agent must never fabricate); final review of only 4 things — narrative resonance, hero-image persona-truth, style-risk, scarcity honesty. Everything else automates.

## ENFORCEMENT LOOP (mechanical, no human; run after every build until pass)
Lint gates (KB-derived): ≤~4.4 links/page; attention ratio ~1:1; one exclusive accent color; ad-H1 congruence string-match; every input has a linked label; 60/30/10 color, ≤4 font sizes / 2 weights, 8pt grid; corner-radius/stroke consistency; hero ≤90vh; H1/H2/CTA all above the fold on mobile; submit = last focusable element. A11y CI: Lighthouse + axe + eslint-plugin-jsx-a11y (4.5:1 AA contrast, touch targets, heading order). PageSpeed as release-blocker. `prefers-reduced-motion`. Missing-state detection. Plus our installed `web-design-guidelines` + `design-taste-frontend` skills. "If it reports violations, fix each and re-run until pass."

## TOOL / MCP MAPPING (executors per stage; our documented status)
- **Reference research:** Mobbin (premium, dedicated Chrome; MCP configured but loads only at session start → confirm in a fresh session, [[reference_mobbin_design_inspiration_2026_07_14]]) + Firecrawl brand-scrape.
- **Components:** 21st.dev Magic MCP (installed, Free 100 cr/mo, [[tool_magic_mcp_21st_dev]]) + shadcn MCP.
- **Mockup:** Stitch (explore) / Claude Design (polish, dedicated browser) / Pencil.dev (IDE-native, repo JSON, Claude-Code MCP) — pick per route.
- **Framer + Unframer (NEW, need fit-check):** Framer = candidate for Route B/C (no-code animated/editorial builder); Unframer MCP = Framer→code bridge. Evaluate where they beat Stitch/Claude-Design for animated routes; do NOT assume adoption.
- **Assets:** Higgsfield (stills Nano Banana/GPT Image 2; motion Seedance 2.0; **logos = reference-style transfer via Flux Kontext + Nano Banana 2, R-LOGO-01**). Recraft **RETIRED for logos** 2026-08-18 (vectorizer/bg-removal utilities OK).
- **Motion:** Framer Motion / GSAP (GPU transforms).
- **QA:** web-design-guidelines, design-taste-frontend, Lighthouse, axe.

## NEXT ACTIONS (for Roger review)
1. Rewrite `DESIGN_PIPELINE.md` as ROUTE-FIRST + methodology-led (this doc), tools demoted to an executor table. Roger reviews the diff.
2. Build the fully-automated enforcement loop + the "taste-as-artifacts" spec (guardrails, locked system, eval loop) as real project-starter skills/scripts.
3. Fit-check + wire the 4 named resources: confirm Mobbin MCP in a fresh session; activate 21st.dev in the flow; evaluate Unframer + Framer for Route B/C.
4. Fold "design" in as the KB self-learning loop's first vertical so this stays current.
