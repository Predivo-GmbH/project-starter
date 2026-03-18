---
name: design-pipeline
description: >
  Start the design-first pipeline for a new project. Walks through: define brand from
  reference screenshots → generate design tokens → create mockups → implement → validate.
  Use when starting a new project or when the user says "design pipeline", "new project design",
  or "start design system".
argument-hint: "[product name or description]"
---

# Design Pipeline — New Project

Run the full design-first pipeline: DEFINE → GENERATE → MOCKUP → IMPLEMENT → VALIDATE.

Read `docs/DESIGN_PIPELINE.md` for the full process reference. Use `docs/DESIGN_BRIEF.template.md`, `docs/design-tokens.template.json`, `docs/DESIGN_SYSTEM.template.md`, and `.claude/skills/brand-guidelines/SKILL.md` as templates.

## Step 1: DEFINE — Gather the Design Brief

Ask the user for input. Accept **any combination** of:

1. **Reference screenshots or URLs** (fastest path) — analyze to extract color palette, typography, spacing rhythm, layout patterns, component styles, visual tone.
2. **Product description** — name, audience, goal.
3. **Explicit brand decisions** — accent color, font, theme, tone (if they already know).

### If screenshots/URLs are provided:
- Read/fetch the references
- Extract: dominant color, accent colors, font families, spacing patterns, layout style, light/dark approach, overall tone
- Present your analysis: "Based on these references, I see: [findings]. Here's my proposed brand direction:"
- Fill in the Brand Direction section from your analysis
- Ask only for what you **cannot** determine from the screenshots (product name, audience, goal, pages needed)

### If no screenshots — written brief only:
Ask targeted questions:
- What's the accent color? (or "propose one based on the industry/audience")
- What font? (or "propose based on tone")
- Light, dark, or both?
- What's the tone? (minimal, data-dense, warm, playful, editorial, etc.)
- Any reference sites you like?

### Output:
Save completed brief to `docs/DESIGN_BRIEF.md` using the template from `docs/DESIGN_BRIEF.template.md`.

**Wait for user approval of the design brief before proceeding.**

---

## Step 2: GENERATE DESIGN SYSTEM

Automated from the approved design brief.

1. Copy `docs/design-tokens.template.json` → `docs/design-tokens.json`
2. Override with brand decisions from the brief:
   - Accent color → derive full ink/surface/edge/accent palette
   - Font → set fontFamily tokens
   - Tone → inform surface colors, shadow intensity, border radii
   - Reference principles → inform spacing, layout, animation choices
3. Apply best practices from Refactoring UI, Material Design, and Tailwind defaults
4. Generate `.claude/skills/brand-guidelines/SKILL.md` from the template, filled with actual tokens
5. Generate `docs/DESIGN_SYSTEM.md` from the template (human-readable spec)

### Output:
- `docs/design-tokens.json` — canonical tokens (absolute truth)
- `.claude/skills/brand-guidelines/SKILL.md` — Claude enforcement skill
- `docs/DESIGN_SYSTEM.md` — human-readable spec

Present a summary of the generated design system. **Wait for user approval before proceeding.**

---

## Step 3: DESIGN MOCKUPS

Generate visual mockups for human review.

1. Use **both** tools in parallel (compare results):
   - **Figma MCP** (`generate_figma_design`) — generates screens in Figma
   - **Pencil MCP** — generates mockup images
2. Include the design brief's anti-slop rules and brand direction in prompts to both tools
3. Generate key screens listed in the design brief (landing, dashboard, auth, etc.)
4. Present mockups to human for review

### Anti-slop enforcement at design time:
The design brief's anti-slop rules MUST be included in every mockup generation prompt:
- No generic font usage without intention
- No purple gradients on white backgrounds
- No predictable symmetric card grids with uniform spacing
- No cookie-cutter hero sections
- No timid color palettes — commit to dominant color with sharp accents
- Every design needs ONE memorable, distinctive element
- Typography must create clear hierarchy
- Spacing must have rhythm

### Iteration:
- Human provides feedback → AI regenerates → repeat until approved
- This is where to iterate — mockups are free, code is expensive

**Wait for human to approve final designs before proceeding.**

---

## Step 4: IMPLEMENT

Build production code from approved designs.

Active skills during implementation:
- `implement-design` — reads Figma design, extracts layout/spacing/components
- `brand-guidelines` (this project's) — enforces token compliance
- `frontend-design` (global plugin) — final safety net against generic output

Follow the MANDATORY DELIVERY GATE from MEMORY.md:
- Design before coding (already done in Steps 1-3)
- Build completely in one pass
- Test thoroughly (Step 5)
- Deliver with evidence

---

## Step 5: VALIDATE

Automated verification before delivery.

1. Kill and restart dev server
2. Puppeteer test at 1920x1080 (standard)
3. Puppeteer test at 1920x1080 deviceScaleFactor=2 (retina)
4. Compare rendered page against approved design mockup
5. Measure alignment programmatically (pixel offsets)
6. All delivery gates pass → ship
7. Tell user to hard-refresh (Ctrl+Shift+R)

**ALL gates must pass. No "close enough." No "probably fine."**
