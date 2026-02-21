# Style Guide

<!-- CUSTOMIZE: This is a template. Replace with your project's specific brand guidelines.
     Include screenshots, color swatches, and typography examples specific to your brand. -->

---

## Brand Identity

<!-- CUSTOMIZE: Add your brand details -->

- **Brand Name**: [Your Project Name]
- **Tagline**: [Your tagline]
- **Brand Voice**: Professional, approachable, confident
- **Visual Style**: Clean, modern, minimal

---

## Color Usage

### Primary Palette

<!-- CUSTOMIZE: Replace with your brand colors -->

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#2563EB` | CTAs, active states, links |
| Primary Light | `#DBEAFE` | Backgrounds, badges |
| Primary Dark | `#1E40AF` | Hover states, emphasis |

### Secondary Palette

| Name | Hex | Usage |
|------|-----|-------|
| Secondary | `#7C3AED` | Accent elements, secondary actions |
| Secondary Light | `#EDE9FE` | Highlight backgrounds |
| Secondary Dark | `#5B21B6` | Hover states |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#16A34A` | Confirmations, positive metrics |
| Warning | `#D97706` | Cautions, pending states |
| Error | `#DC2626` | Errors, destructive actions |
| Info | `#2563EB` | Tips, informational messages |

### Neutrals

| Name | Hex | Usage |
|------|-----|-------|
| Gray 50 | `#F8FAFC` | Subtle backgrounds |
| Gray 100 | `#F1F5F9` | Alternate row backgrounds |
| Gray 200 | `#E2E8F0` | Borders, dividers |
| Gray 300 | `#CBD5E1` | Disabled text |
| Gray 400 | `#94A3B8` | Placeholder text |
| Gray 500 | `#64748B` | Secondary text |
| Gray 600 | `#475569` | Body text (dark bg) |
| Gray 700 | `#334155` | Dark surface |
| Gray 800 | `#1E293B` | Dark background |
| Gray 900 | `#0F172A` | Darkest background |

---

## Typography

### Font Stack

<!-- CUSTOMIZE: Replace with your font choices -->

- **Headings**: Inter (semibold/bold)
- **Body**: Inter (regular/medium)
- **Code**: JetBrains Mono (regular)

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display | 36px | Bold | 1.1 | -0.02em |
| H1 | 30px | Bold | 1.2 | -0.01em |
| H2 | 24px | Semibold | 1.3 | -0.01em |
| H3 | 20px | Semibold | 1.4 | 0 |
| H4 | 18px | Medium | 1.4 | 0 |
| Body Large | 18px | Regular | 1.6 | 0 |
| Body | 16px | Regular | 1.5 | 0 |
| Body Small | 14px | Regular | 1.5 | 0 |
| Caption | 12px | Medium | 1.4 | 0.01em |

---

## Component Guidelines

### Buttons

| Variant | Usage | Background | Text |
|---------|-------|-----------|------|
| Primary | Main CTA (1 per view) | Primary | White |
| Secondary | Supporting actions | Transparent | Primary |
| Outline | Tertiary actions | Transparent + border | Gray 700 |
| Ghost | Minimal emphasis | Transparent | Gray 600 |
| Destructive | Delete/remove actions | Error | White |

**Sizes**: sm (32px height), md (40px height), lg (48px height)

### Cards

- Background: `--color-surface`
- Border: `--color-border` (1px solid)
- Border radius: `--radius-lg` (8px)
- Padding: `--space-5` (20px) to `--space-6` (24px)
- Shadow: `--shadow-sm` (default), `--shadow-md` (hover)

### Forms

- Input height: 40px (md), 32px (sm), 48px (lg)
- Border: 1px solid `--color-border`
- Focus: 2px ring in `--color-primary` with 2px offset
- Error: Border changes to `--color-error`, error message below in `--color-error`
- Labels: `--text-sm`, `font-medium`, `--color-text-primary`
- Help text: `--text-xs`, `--color-text-tertiary`

---

## Iconography

<!-- CUSTOMIZE: Replace with your icon library -->

- **Library**: Lucide React (recommended) or Heroicons
- **Default size**: 20px (inline with text), 24px (standalone)
- **Stroke width**: 1.5px (default), 2px (emphasis)
- **Color**: Inherit from parent text color

---

## Do's and Don'ts

### Do

- Use design tokens for all colors, spacing, and typography
- Maintain consistent spacing using the 4px grid
- Test both light and dark modes for every component
- Provide visible focus indicators for keyboard navigation
- Use skeleton loading states instead of spinners where possible
- Keep forms short and progressive (multi-step for complex flows)

### Don't

- Don't use more than 3 font weights on a single page
- Don't mix icon libraries
- Don't hardcode pixel values — use the spacing scale
- Don't rely on color alone to convey meaning (add icons/text)
- Don't auto-play animations without `prefers-reduced-motion` check
- Don't stack more than 3 levels of modals/popovers
- Don't use placeholder text as labels (always have visible labels)
