# [PROJECT_NAME] Design Brief

## Source requirements (fill FIRST, before anything below) [ADDED 2026-08-24, Roger approved]
<!-- This brief is almost always DERIVED from an upstream requirements document. Name it, so the
     next reader can diff this brief against it. A brief with no named parent cannot be verified. -->
- **Parent requirements document (full path):**
- **Read on (date):**
- **If there is NO parent document, write "none, this brief IS the source" here:**

### ⛔ DO NOT BUILD (copy the parent's exclusions VERBATIM, do not summarise)
<!-- MANDATORY. If the parent names anything as out-of-scope, not-to-build, deliberately-untested,
     or "later", it is copied here word for word, with its section/line reference.
     If the parent lists nothing, write "parent lists no exclusions" — never leave this blank. -->

| Must NOT be built | Where the parent says so |
|---|---|
|  |  |

> **Why this section exists (real incident, 2026-08-20).** The hairdresser prototype shipped a
> till/checkout screen, a products screen and a reporting screen that nobody asked for. The parent
> requirements document had classed checkout as `OOP` ("nicht bauen") and listed POS, Warenwirtschaft
> and Buchhaltung under "Bewusst NICHT getestet". **That exclusion list existed and was simply not
> carried into the brief the builder actually read**, so the build was faithfully wrong.
> **The failure was propagation, not authorship. Copy the list down; never re-derive it.**

### Requirement IDs: every one cited must RESOLVE
<!-- If this brief cites requirement IDs (FR-nnn, UXR-nnn, NFR-nnn, RULE-nnn, SCR-nnn, BR-nnn),
     each one MUST exist in the parent document. Check them, then tick this box. -->
- [ ] **Every requirement ID cited in this brief was opened in the parent document and exists.**

> **Why (same incident).** The prototype's own docs justified the invented screens with `FR-014`,
> `NFR-007`, `RULE-007` and `UXR-013` — **none of which exist**; the parent's lists end at FR-013,
> NFR-006, RULE-006 and UXR-012. **A fabricated traceability ID is worse than no citation**, because
> a reviewer checking "is this documented?" sees an ID and stops checking. Unverifiable ID = drop the
> claim, or drop the feature.

## Third-party services this design depends on [ADDED 2026-08-24, Roger approved]
<!-- One row per outside service the design assumes (payments, auth, email, storage, maps, AI).
     Read the vendor's CURRENT documentation now; do not build from what you already believe is true.
     Recording the date is the point: it tells the next reader how stale this is. -->

| Service | What we rely on it for | Doc URL read | Date read |
|---|---|---|---|
|  |  |  |  |

- [ ] **No third-party service is involved** (tick instead of filling the table)

## Product
- **Name:**
- **Description:** <!-- one sentence -->
- **Audience:** <!-- who uses this -->
- **Goal:** <!-- what problem it solves -->

## Reference
<!-- Provide 2-3 screenshots or URLs of sites that represent the desired look and feel.
     AI will analyze these to extract: color palette, typography, spacing rhythm,
     layout patterns, component styles, and visual tone.
     This is the fastest path — screenshots drive all brand decisions below. -->

- Screenshot/URL 1:
- Screenshot/URL 2:
- Screenshot/URL 3:

## Brand Direction
<!-- Filled by AI from reference analysis, or manually by human. -->

- **Accent color:** <!-- hex value, extracted from references or chosen -->
- **Font:** <!-- primary font, optional secondary (e.g., "Inter" or "Plus Jakarta Sans + JetBrains Mono") -->
- **Theme:** <!-- light only / dark only / both (default: ___) -->
- **Tone:** <!-- e.g., "warm & approachable", "dark & data-dense", "clean & editorial", "brutally minimal" -->
- **Reference summary:** <!-- AI's 2-3 sentence summary of what makes the references work -->

## Design Principles

Apply best practices from Refactoring UI, Material Design, and Tailwind defaults for spacing, typography hierarchy, color usage, and shadows.

### Anti-Slop Rules (enforced at design AND code time)
- No generic font usage (Inter/Roboto/Arial used lazily without intention)
- No purple gradients on white backgrounds
- No predictable symmetric card grids with uniform spacing
- No cookie-cutter hero sections (big text + subtitle + CTA button centered)
- No evenly-distributed timid color palettes — commit to a dominant color with sharp accents
- Every design must have ONE memorable, distinctive element
- Typography must create clear hierarchy (not just size changes — use weight, spacing, case)
- Spacing must have rhythm (not uniform gaps everywhere)
- Backgrounds must create atmosphere (not flat solid colors everywhere)

### Quality Markers (what good looks like)
- Dominant color with 1-2 sharp accents (not 5 colors at equal weight)
- Type scale with clear jumps between levels (not incremental 2px steps)
- Intentional whitespace — generous where needed, dense where data demands it
- Cards that earn their existence (not decorative containers around everything)
- Animations that serve a purpose (entrance hierarchy, state feedback) — not decoration
- One unexpected layout choice per page (asymmetry, overlap, grid-break, full-bleed)

## Pages/Screens Needed
- [ ] <!-- list key pages, e.g.: -->
- [ ] <!-- Landing / Home -->
- [ ] <!-- Dashboard -->
- [ ] <!-- Auth (login/signup) -->
- [ ] <!-- Settings -->
- [ ] <!-- [domain-specific pages] -->

## Technical Constraints
- **Framework:** <!-- React / Next.js / Expo / etc. -->
- **UI Library:** <!-- shadcn/ui / custom / etc. -->
- **CSS:** <!-- Tailwind version -->
- **Animation:** <!-- Framer Motion / Tailwind transitions / reanimated / etc. -->
- **Responsive:** <!-- mobile-first / desktop-first / specific breakpoints -->
- **Accessibility:** <!-- WCAG 2.1 AA minimum -->
