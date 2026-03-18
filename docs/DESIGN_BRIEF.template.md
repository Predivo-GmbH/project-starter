# [PROJECT_NAME] Design Brief

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
