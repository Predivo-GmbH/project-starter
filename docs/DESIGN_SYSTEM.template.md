# [PROJECT_NAME] Design System

> **Canonical source:** `docs/design-tokens.json` — when this document and the token file conflict, the token file wins.
>
> **Last audit:** YYYY-MM-DD

## Design Philosophy

<!-- 1-2 sentences describing the visual direction. Examples: -->
<!-- "Radical minimalism. Typography-driven. Content is the design." -->
<!-- "Dark-first, data-dense. Bloomberg Terminal meets modern SaaS." -->
<!-- "Warm & approachable. Soft tones, generous radii, friendly motion." -->

[DESCRIBE YOUR DESIGN PHILOSOPHY HERE]

---

## Color System

### Ink (Text)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| ink.default | `#______` | `text-ink` | Primary text, headings |
| ink.sub | `#______` | `text-ink-sub` | Subheadings |
| ink.body | `#______` | `text-ink-body` | Body text |
| ink.muted | `#______` | `text-ink-muted` | Captions, placeholders |

### Surface (Backgrounds)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| surface.default | `#______` | `bg-surface` | Primary background |
| surface.alt | `#______` | `bg-surface-alt` | Alternate sections |
| surface.hover | `#______` | `bg-surface-hover` | Hover states |

### Edge (Borders)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| edge.default | `#______` | `border-edge` | Default border |
| edge.subtle | `#______` | `border-edge-subtle` | Dividers |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| accent | `#______` | Links, focus rings |
| accent.hover | `#______` | Hover state |

### Status Colors
| Token | Value |
|-------|-------|
| error | `#EF4444` |
| success | `#22C55E` |
| warning | `#F59E0B` |

<!-- If dark mode supported, add a ### Dark Mode section with overrides -->

---

## Typography

**Fonts:** [PRIMARY_FONT] (body) + [SECONDARY_FONT] (headings/code, optional)

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 3.5rem | 700 | 1.08 | -0.02em | Hero text |
| Heading 1 | 2.5rem | 700 | 1.15 | -0.01em | Page titles |
| Heading 2 | 1.875rem | 600 | 1.2 | -0.01em | Section titles |
| Heading 3 | 1.5rem | 600 | 1.3 | — | Card titles |
| Body lg | 1.125rem | 400 | 1.6 | — | Large body |
| Body | 1rem | 400 | 1.6 | — | Default body |
| Body sm | 0.875rem | 400 | 1.5 | — | Secondary text |
| Caption | 0.75rem | 500 | 1.4 | — | Small labels |

### Typography Patterns
<!-- Project-specific patterns. Examples: -->
<!-- - Headlines end with a period: "We build software that thinks ahead." -->
<!-- - Bold the key word: "Loved by **Builders.**" -->
<!-- - Table headers: UPPERCASE, tracking-wider -->

---

## Layout

| Element | Value |
|---------|-------|
| Container max-width | ____px |
| Container padding | ____px / ____px / ____px (mobile/tablet/desktop) |
| Navbar height | ____px |
| Section vertical padding | 80-120px |

### Breakpoints
| Name | Width |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

---

## Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| lg | ____px | Cards |
| md | ____px | Buttons, inputs |
| sm | ____px | Small elements |
| pill | 9999px | Badges |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| xs | `0 1px 2px rgba(0,0,0,0.04)` | — |
| sm | `0 1px 3px rgba(0,0,0,0.06), ...` | Cards at rest |
| md | `0 4px 8px -2px rgba(0,0,0,0.06), ...` | Hover, elevated |
| lg | `0 12px 24px -4px rgba(0,0,0,0.06), ...` | Modals |

---

## Components

### Buttons
| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| Primary | `bg-primary` | White | Main CTA |
| Secondary | `bg-secondary` | Dark | Supporting actions |
| Outline | Transparent + border | Dark | Tertiary |
| Ghost | Transparent | Inherits | Minimal emphasis |
| Destructive | Red | White | Dangerous actions |

**Shape:** `rounded-md` (____px). **Sizes:** sm/md/lg.

### Cards
- Background: `bg-card`
- Border: 1px `border-edge`
- Radius: `rounded-lg` (____px)
- Shadow: [AT REST] / [ON HOVER]
- Padding: p-6 (24px)

### Inputs
- Border: 1px `border-edge`, focus: `border-accent` + ring
- Radius: `rounded-md`
- Height: h-10 (40px)

### Navbar
- Height: ____px
- Default: [transparent / solid]
- On scroll: [blur / border / shadow]

---

## Animations

| Effect | Implementation |
|--------|---------------|
| Section entrance | [Framer Motion / CSS / Tailwind] — opacity 0→1, y offset |
| Card stagger | staggerChildren ____s |
| Color transitions | ____ms ease-out |
| Button press | ____ms |
| Loading | [animate-spin / animate-pulse / skeleton] |

---

## Icons

- **Library:** lucide-react
- **Default size:** ____px
- **Stroke width:** 1.5
- **Color:** muted default, accent for emphasis

---

## Rules

### ALWAYS
- Use design tokens for all colors — never hardcode hex
- [Theme rule: Light only / Dark only / Both]
- Use [COMPONENT_LIBRARY] as foundation
- Use [ANIMATION_LIBRARY] for entrance animations
- [Project-specific rules...]

### NEVER
- Hardcode hex values in components
- [Project-specific anti-patterns...]
- [Banned visual patterns...]
