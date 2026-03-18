# Design System Pipeline

How to create and maintain a design system for any Predivo GmbH product.

## Two Workflows

This pipeline supports two scenarios:

- **New projects** — design first, then code (Steps 1-5)
- **Existing projects** — extract tokens from code, formalize retroactively (see "Existing Projects" at the bottom)

---

## New Project Workflow

```
Step 1: DEFINE (human + AI)
    → Design brief: product, audience, brand direction
    |
    v
Step 2: GENERATE DESIGN SYSTEM (AI, automated)
    → design-tokens.json + brand-guidelines SKILL.md
    |
    v
Step 3: DESIGN MOCKUPS (AI + human review)
    → Figma MCP and/or Pencil MCP → visual mockups
    → Human reviews, iterates, approves
    |
    v
Step 4: IMPLEMENT (AI, automated)
    → Code from approved design
    → brand-guidelines + frontend-design active
    |
    v
Step 5: VALIDATE (AI, automated)
    → Puppeteer tests, delivery gates
```

---

## Step 1: DEFINE

**Who:** Human provides input, AI analyzes and proposes.

**Input options** (one or more):
1. **Reference screenshots** — photos or URLs of existing sites that represent the desired look and feel. AI analyzes these to extract: color palette, typography choices, spacing rhythm, layout patterns, component styles, visual tone. This is the fastest path — provide 2-3 screenshots and AI derives everything else.
2. **Written brief** — product description, target audience, goals, competitive context.
3. **Explicit brand decisions** — if you already know: accent color, font, light/dark, tone.

**How it works:**

If the human provides reference screenshots, AI:
- Extracts the design principles from the screenshots (spacing, type hierarchy, color usage, layout patterns, component styles)
- Identifies the accent color, font choices, tone (warm/cool, minimal/dense, etc.)
- Identifies light/dark theme approach
- Asks clarifying questions only for what it can't determine from the screenshots
- Proposes a design direction for human approval

If the human provides a written brief instead, AI asks targeted questions:
- What's the accent color? (or "propose one based on the industry/audience")
- What font? (or "propose based on tone")
- Light, dark, or both?
- What's the tone? (minimal, data-dense, warm, playful, editorial, etc.)
- Any reference sites?

**Output:** A completed design brief (saved as `docs/DESIGN_BRIEF.md`).

**Design brief template:**

```markdown
# [PROJECT_NAME] Design Brief

## Product
- **Name:**
- **Description:** [one sentence]
- **Audience:** [who uses this]
- **Goal:** [what problem it solves]

## Brand Direction
- **Accent color:** [hex value]
- **Font:** [primary font, optional secondary]
- **Theme:** [light only / dark only / both, default: ___]
- **Tone:** [e.g., "warm & approachable", "dark & data-dense", "clean & editorial"]
- **Reference:** [sites/screenshots that define the direction]

## Design Principles
Apply best practices from Refactoring UI, Material Design, and Tailwind
defaults for spacing, typography hierarchy, color usage, and shadows.

Anti-slop rules (enforced at design AND code time):
- No generic font usage (Inter/Roboto/Arial used lazily without intention)
- No purple gradients on white backgrounds
- No predictable symmetric card grids
- No cookie-cutter hero sections
- No evenly-distributed timid color palettes — commit to a dominant color
  with sharp accents
- Every design must have ONE memorable, distinctive element
- Typography must create clear hierarchy (not just size changes)
- Spacing must have rhythm (not uniform gaps everywhere)

## Pages/Screens Needed
- [ ] [list key pages]
```

---

## Step 2: GENERATE DESIGN SYSTEM

**Who:** AI, automated from the design brief.

**Input:** Completed design brief from Step 1.

**What happens:**

Claude generates `docs/design-tokens.json` by:
1. Starting from `design-tokens.template.json` (best-practice defaults from Refactoring UI / Tailwind)
2. Overriding with brand decisions from the design brief (accent color, font, tone)
3. Deriving a complete token set: ink colors from the accent, surface colors from the tone, shadow scale, border radii, typography scale, animation timing
4. Applying principles extracted from reference screenshots (if provided)

Claude then generates `.claude/skills/brand-guidelines/SKILL.md` from the tokens.

**Output:**
- `docs/design-tokens.json` — canonical tokens
- `.claude/skills/brand-guidelines/SKILL.md` — Claude enforcement skill
- `docs/DESIGN_SYSTEM.md` — human-readable spec (optional, for team reference)

---

## Step 3: DESIGN MOCKUPS

**Who:** AI generates, human reviews and approves.

**Input:** Design tokens + design brief.

**Tools** (run in parallel, compare results):
- **Figma MCP** (`generate_figma_design`) — generates screens directly in Figma
- **Pencil MCP** — generates mockups as images

The design brief's anti-slop rules and aesthetic direction are included in the prompt to both tools, ensuring the mockups are distinctive from the start.

**Process:**
1. AI generates key screens (home/landing, dashboard, auth, etc.)
2. Human reviews in Figma or as images
3. Human provides feedback, AI iterates
4. Human approves final designs

**Why this step matters:** Iterating on a mockup is free. Iterating on code is expensive. Get the design right here.

**Output:** Approved visual designs (Figma file or Pencil images).

---

## Step 4: IMPLEMENT

**Who:** AI, automated from approved designs.

**Input:** Approved mockups + design tokens + brand-guidelines SKILL.md.

**Active skills:**
- `implement-design` — reads Figma design, extracts layout/spacing/components
- `brand-guidelines` (per-project) — enforces token compliance
- `frontend-design` (global) — ensures implementation craft quality (final safety net against generic output)

**Output:** Production-ready code matching the approved design.

---

## Step 5: VALIDATE

**Who:** AI, automated.

**Process:**
1. Kill and restart dev server
2. Puppeteer test at 1920x1080 (standard)
3. Puppeteer test at 1920x1080 deviceScaleFactor=2 (retina)
4. Compare rendered page against design mockup
5. Measure alignment programmatically (pixel offsets)
6. All delivery gates pass → ship

See `MEMORY.md` delivery gates for full checklist.

---

## File Structure

```
project/
├── docs/
│   ├── DESIGN_BRIEF.md              <-- Step 1 output (human + AI)
│   ├── design-tokens.json           <-- Step 2 output (canonical tokens)
│   └── DESIGN_SYSTEM.md             <-- Step 2 output (human-readable spec)
├── .claude/
│   └── skills/
│       └── brand-guidelines/
│           └── SKILL.md             <-- Step 2 output (Claude enforcement)
└── [Figma/Pencil mockups]           <-- Step 3 output (approved designs)
```

**Hierarchy:** When files conflict, higher wins:
1. `design-tokens.json` (absolute truth)
2. `SKILL.md` (derived from tokens)
3. `DESIGN_SYSTEM.md` (derived from tokens)
4. Figma/Pencil mockups (visual reference)

---

## Existing Project Workflow

For projects that already have code but no formal design system:

1. **Extract tokens** — AI audits codebase (CSS vars, Tailwind config, fonts, hardcoded hex) → generates `design-tokens.json`
2. **Generate SKILL.md** — from extracted tokens
3. **Reconcile** — compare code vs tokens, resolve conflicts, document decisions
4. **(Optional) Hex cleanup** — tokenize hardcoded values
5. **(Optional) Figma brand book** — create retroactively from tokens

This is what was done for all 8 existing Predivo GmbH products.

---

## Predivo GmbH Product Palette

| Product | Primary Color | Font | Theme | UI Library |
|---------|--------------|------|-------|------------|
| Predivo | `#222222` (near-black CTA), `#2A9D8F` (teal accent) | Inter | Light only | shadcn/ui |
| Arivioo | `#E23647` (rose-red) | Plus Jakarta Sans | Light + dark | shadcn/ui |
| ReplyFlow | `#0D9488` (teal-600) | Inter + Inter Display | Light + dark | shadcn/ui + CVA |
| SignalScore | `#2563EB` (blue) | Inter + JetBrains Mono | Light + dark | shadcn/ui |
| SignalForge | `#7B61FF` (purple) | Inter + JetBrains Mono | Dark default | Custom |
| LaunchReady | `#2563EB` (blue) | Inter | Dark only | Custom |
| YouTube Migration | `#0070F3` (Vercel Blue) | Inter + Fraunces | Dark default | Custom (RN) |
| Beize Jass Tour | `#E53935` (Swiss Red) | System sans-serif | Light + dark | shadcn/ui |

## Maintenance

- **When you change a color/font/spacing:** Update `design-tokens.json` first, then regenerate SKILL.md and DESIGN_SYSTEM.md
- **When you add a component pattern:** Add to all three files
- **Quarterly:** Run hex audit (`grep -rn '#[0-9a-fA-F]\{6\}' src/`) and reconcile
- **On major redesign:** Re-extract tokens, rebuild all files, update mockups
