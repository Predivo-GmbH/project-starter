# Design Principles

<!-- CUSTOMIZE: Replace this template with your project's specific design principles.
     Use Gemini Deep Research or Claude to generate a comprehensive version
     based on 2-3 reference screenshots of your target aesthetic. -->

Inspired by the standards of Stripe, Airbnb, and Linear.

---

## I. Core Philosophy

1. **Users First** — Every design decision serves the user, not the technology
2. **Meticulous Craft** — Pixel-perfect alignment, consistent spacing, intentional whitespace
3. **Speed** — UI should feel instant; loading states for anything >200ms
4. **Simplicity** — Remove until it breaks, then add back one thing
5. **Consistency** — Same patterns for same problems across the entire app
6. **Accessibility** — WCAG 2.1 AA minimum; keyboard-navigable, screen-reader friendly
7. **Opinionated Design** — Strong defaults, minimal configuration needed

---

## II. Design System Foundation

### Color Palette

<!-- CUSTOMIZE: Replace with your brand colors -->

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--color-primary` | `#2563EB` | `#3B82F6` | Primary actions, links |
| `--color-primary-hover` | `#1D4ED8` | `#60A5FA` | Primary hover state |
| `--color-secondary` | `#7C3AED` | `#8B5CF6` | Secondary actions |
| `--color-background` | `#FFFFFF` | `#0F172A` | Page background |
| `--color-surface` | `#F8FAFC` | `#1E293B` | Card/panel background |
| `--color-surface-elevated` | `#FFFFFF` | `#334155` | Elevated surface (modals, dropdowns) |
| `--color-text-primary` | `#0F172A` | `#F1F5F9` | Primary text |
| `--color-text-secondary` | `#64748B` | `#94A3B8` | Secondary/muted text |
| `--color-text-tertiary` | `#94A3B8` | `#64748B` | Tertiary/placeholder text |
| `--color-border` | `#E2E8F0` | `#334155` | Borders, dividers |
| `--color-success` | `#16A34A` | `#22C55E` | Success states |
| `--color-warning` | `#D97706` | `#F59E0B` | Warning states |
| `--color-error` | `#DC2626` | `#EF4444` | Error states |
| `--color-info` | `#2563EB` | `#3B82F6` | Informational states |

### Typography

<!-- CUSTOMIZE: Replace with your font choices -->

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `'Inter', system-ui, sans-serif` | Body text, UI elements |
| `--font-mono` | `'JetBrains Mono', monospace` | Code, technical data |
| `--text-xs` | `0.75rem / 1rem` | Badges, captions |
| `--text-sm` | `0.875rem / 1.25rem` | Secondary text, labels |
| `--text-base` | `1rem / 1.5rem` | Body text |
| `--text-lg` | `1.125rem / 1.75rem` | Subheadings |
| `--text-xl` | `1.25rem / 1.75rem` | Section titles |
| `--text-2xl` | `1.5rem / 2rem` | Page titles |
| `--text-3xl` | `1.875rem / 2.25rem` | Hero text |
| `--text-4xl` | `2.25rem / 2.5rem` | Display text |

**Weight scale**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing

Base unit: **4px** (0.25rem)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight inline spacing |
| `--space-2` | `8px` | Compact element gaps |
| `--space-3` | `12px` | Default inline padding |
| `--space-4` | `16px` | Standard element gap |
| `--space-5` | `20px` | Card padding |
| `--space-6` | `24px` | Section padding |
| `--space-8` | `32px` | Section gaps |
| `--space-10` | `40px` | Large section gaps |
| `--space-12` | `48px` | Page section spacing |
| `--space-16` | `64px` | Major layout gaps |

### Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Badges, tags |
| `--radius-md` | `6px` | Buttons, inputs |
| `--radius-lg` | `8px` | Cards, panels |
| `--radius-xl` | `12px` | Modals, popovers |
| `--radius-2xl` | `16px` | Large containers |
| `--radius-full` | `9999px` | Pills, avatars |

### Shadows

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | `0 4px 6px rgba(0,0,0,0.4)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 10px 15px rgba(0,0,0,0.5)` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | `0 20px 25px rgba(0,0,0,0.5)` |

---

## III. Layout & Visual Hierarchy

### Responsive Grid

| Breakpoint | Width | Columns | Gutter | Margin |
|-----------|-------|---------|--------|--------|
| Mobile | < 640px | 4 | 16px | 16px |
| Tablet | 640–1023px | 8 | 24px | 24px |
| Desktop | 1024–1279px | 12 | 24px | 32px |
| Wide | >= 1280px | 12 | 32px | auto (max-width) |

### White Space Strategy

- **Macro** (page sections): 48–64px between major sections
- **Meso** (within sections): 24–32px between related groups
- **Micro** (within components): 8–16px between elements

### Visual Hierarchy Rules

1. One primary action per view (single prominent CTA)
2. Maximum 3 levels of heading hierarchy per page
3. Important content above the fold
4. Progressive disclosure for complex information

---

## IV. Interaction Design

### Micro-Interactions

| Interaction | Duration | Easing | Purpose |
|------------|----------|--------|---------|
| Hover state | 150ms | ease-out | Immediate feedback |
| Button press | 100ms | ease-in | Tactile response |
| Page transition | 200-300ms | ease-in-out | Smooth navigation |
| Modal open | 200ms | ease-out | Entrance |
| Modal close | 150ms | ease-in | Faster exit |
| Toast appear | 300ms | spring | Attention-catching |
| Skeleton shimmer | 1.5s | linear | Loading indication |

### Loading States

1. **< 200ms**: No indicator (feels instant)
2. **200ms – 1s**: Skeleton screens or spinner
3. **> 1s**: Progress bar with context message
4. **> 5s**: Cancel option + estimated time

### State Coverage Checklist

Every interactive component must define:
- [ ] Default state
- [ ] Hover state
- [ ] Focus state (visible ring)
- [ ] Active/pressed state
- [ ] Disabled state
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Success state (where applicable)

---

## V. Accessibility (WCAG 2.1 AA)

### Minimum Requirements

- **Color contrast**: >= 4.5:1 for normal text, >= 3:1 for large text (18px+ or 14px+ bold)
- **Focus indicators**: Visible 2px ring on all interactive elements
- **Touch targets**: Minimum 44x44px for mobile
- **Keyboard navigation**: All functionality accessible via keyboard
- **ARIA labels**: All interactive elements have accessible names
- **Alt text**: All informative images have descriptive alt text
- **Motion**: Respect `prefers-reduced-motion`
- **Color independence**: Never convey information through color alone

---

## VI. CSS & Styling Architecture

### Preferred: Utility-First (Tailwind CSS)

```
# Class Organization Order
1. Layout/positioning   (flex, grid, absolute, z-10)
2. Sizing              (w-full, h-14, max-w-sm)
3. Spacing             (p-4, mx-2, gap-3, mb-6)
4. Visual styles       (bg-surface, border, rounded-lg, shadow-md)
5. Typography          (text-base, font-semibold, text-secondary)
6. Interactive states  (hover:bg-elevated, focus:ring-2)
7. Responsive variants (md:flex-row, lg:px-8)
```

### Rules

- **NO hardcoded hex values** in components — use design tokens
- **NO magic pixel values** — use spacing scale or Tailwind classes
- **NO inline styles** when utility classes exist
- **NO new CSS frameworks** without team discussion
- All components must support both light and dark mode
