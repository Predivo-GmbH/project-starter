---
name: brand-guidelines
description: >
  [PROJECT_NAME] brand guidelines and design system. Enforces brand tokens, typography,
  color palette, component patterns, and visual standards across all generated UI.
  Use when building or modifying any [PROJECT_NAME] frontend component, page, or visual element.
user-invocable: false
---

# [PROJECT_NAME] Brand Guidelines

Every UI element generated for [PROJECT_NAME] MUST follow these brand rules. No exceptions.

Canonical source: `docs/design-tokens.json` — when this skill and the token file conflict, the token file wins.

## Brand Identity

- **Company:** [COMPANY_NAME]
- **Tagline:** "[TAGLINE]"
- **Description:** [ONE_SENTENCE_DESCRIPTION]
- **Design Direction:** [DESIGN_PHILOSOPHY — e.g., "Radical minimalism", "Warm & approachable", "Dark-first data-dense"]
- **Theme:** [Light only / Dark only / Light default + dark / Dark default + light]
- **i18n:** [Languages, or "EN only"]

## Color System

<!-- Copy from design-tokens.json. Use tables with Token | Value | Tailwind | Usage columns. -->
<!-- Include all categories: Ink, Surface, Edge, Accent, Status, Button -->
<!-- If dark mode: include a separate Dark Mode section with overrides -->

### Ink (Text)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| ink.default | `#______` | `text-ink` | Primary text |

### Surface (Backgrounds)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| surface.default | `#______` | `bg-surface` | Primary background |

### Edge (Borders)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| edge.default | `#______` | `border-edge` | Default border |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| accent | `#______` | Links, focus rings |

### Status Colors
| Token | Value |
|-------|-------|
| error | `#EF4444` |
| success | `#22C55E` |
| warning | `#F59E0B` |

## Typography

**Font:** [FONT_NAME] for [usage]. [SECONDARY_FONT] for [usage].

| Level | Size | Weight | Line Height | Tracking |
|-------|------|--------|-------------|----------|
| Display | 3.5rem | 700 | 1.08 | -0.02em |
| Heading 1 | 2.5rem | 700 | 1.15 | -0.01em |
| Heading 2 | 1.875rem | 600 | 1.2 | -0.01em |
| Body | 1rem | 400 | 1.6 | — |
| Caption | 0.75rem | 500 | 1.4 | — |

## Layout

| Element | Value |
|---------|-------|
| Container max-width | ____px |
| Container padding | ____px / ____px / ____px (mobile/tablet/desktop) |
| Navbar height | ____px |
| Section vertical padding | 80-120px |

### Breakpoints
sm: 640px | md: 768px | lg: 1024px | xl: 1280px | 2xl: 1536px

## Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| lg | ____px | Cards |
| md | ____px | Buttons, inputs |
| sm | ____px | Small elements |

## Shadows

<!-- Include the shadow scale from design-tokens.json -->

## Components

### Buttons
<!-- List all button variants with bg, text, hover, usage -->

### Cards
<!-- Border, shadow, radius, padding rules -->

### Inputs
<!-- Border, focus, radius, height -->

### Navbar
<!-- Height, states (default, scrolled) -->

## Animations

<!-- List entrance animations, transitions, loading states -->

## Icons

- **Library:** lucide-react
- **Default size:** ____px
- **Stroke width:** 1.5

## Mandatory Rules

### ALWAYS
- Use design tokens for all colors — never hardcode hex
- [Theme support rule]
- Use [COMPONENT_LIBRARY] as component foundation
- Use [ANIMATION_LIBRARY] for entrance animations
- [Project-specific ALWAYS rules]

### NEVER
- Hardcode hex values in components
- [Project-specific NEVER rules — banned patterns, anti-patterns]
