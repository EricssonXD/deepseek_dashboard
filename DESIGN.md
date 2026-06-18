---
name: DeepSeek Usage Dashboard
description: Self-serve cost analytics for DeepSeek API usage — dark, sharp, data-first.
colors:
  abyss-blue: "oklch(0.65 0.2 250)"
  void-black: "oklch(0.145 0 0)"
  void-deep: "oklch(0.155 0 0)"
  slate-surface: "oklch(0.22 0 0)"
  ghost-white: "oklch(0.985 0 0)"
  ash-gray: "oklch(0.55 0 0)"
  ring-gray: "oklch(0.45 0 0)"
  burn-red: "oklch(0.55 0.15 25)"
  signal-green: "oklch(0.7 0.18 145)"
  chart-violet: "oklch(0.488 0.243 264.376)"
  chart-teal: "oklch(0.696 0.17 162.48)"
  chart-amber: "oklch(0.769 0.188 70.08)"
  chart-magenta: "oklch(0.627 0.265 303.9)"
  chart-crimson: "oklch(0.645 0.246 16.439)"
  chart-plum: "oklch(0.55 0.2 300)"
  chart-gold: "oklch(0.6 0.15 50)"
  chart-cyan: "oklch(0.5 0.2 200)"
  chart-rust: "oklch(0.45 0.25 10)"
typography:
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "calc(var(--radius) - 0.25rem)"
  md: "0.5rem"
  lg: "calc(var(--radius) + 0.25rem)"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.abyss-blue}"
    textColor: "{colors.ghost-white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-outline:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.ghost-white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ghost-white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.void-deep}"
    textColor: "{colors.ghost-white}"
    rounded: "{rounded.md}"
    padding: "1.5rem"
  input:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.ghost-white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
---

# Design System: DeepSeek Usage Dashboard

## 1. Overview

**Creative North Star: "Dark Observatory"**

This is an interface for staring at data in the dark. Like an astronomer at a console, the user sits in a dim room, focused on signals against a void. Every element on screen earns its place by conveying information; decoration is noise that obscures the data.

The system is dark by necessity — long-screen sessions tracking costs — but it's not a black void. Three tonal layers (void-black background, void-deep cards, slate-surface accents) create depth through luminance steps alone. The single accent, Abyss Blue, appears only where action or focus is required: primary buttons, selected states, data highlights, links. Its rarity is the point.

This system rejects the SaaS-dashboard defaults: no gradient hero metrics, no identical icon-card grids, no glass panels, no warm-tinted backgrounds. It is sharp, restrained, legible — a tool that disappears into the task of understanding cost.

**Key Characteristics:**
- Dark-first, layered through luminance, not shadow
- Single accent color at ≤10% surface coverage
- Typography-driven hierarchy — weight and size carry meaning, not color
- Flat at rest; shadows appear only on interaction (hover, focus, drag)
- Data-dense but never cluttered; every pixel answers a cost question

## 2. Colors

A restrained dark palette with one committed accent. Nine chart colors provide sufficient distinctiveness for multi-series data without relying on the accent for differentiation.

### Primary
- **Abyss Blue** (oklch(0.65 0.2 250)): The sole accent. Used for primary buttons, focused input borders, active tab indicators, links, selected states, and key data highlights. Appears on ≤10% of any screen. Its power comes from scarcity.

### Neutral
- **Void Black** (oklch(0.145 0 0)): Page background. The deepest layer. All content sits on this.
- **Void Deep** (oklch(0.155 0 0)): Card, popover, and header backgrounds. One step above the void — enough to distinguish surfaces without breaking the dark immersion.
- **Slate Surface** (oklch(0.22 0 0)): Muted backgrounds, secondary surfaces, table header rows, hover states, and border color. The workhorse neutral that bridges void and content.
- **Ghost White** (oklch(0.985 0 0)): All body text, headings, and iconography. High contrast against void layers (≥12:1).
- **Ash Gray** (oklch(0.55 0 0)): Secondary text, descriptions, placeholder copy, muted labels. ≥4.5:1 against void-deep for accessibility.
- **Ring Gray** (oklch(0.45 0 0)): Focus rings, selection outlines.

### Semantic
- **Burn Red** (oklch(0.55 0.15 25)): Destructive actions, error states, disconnected status dot.
- **Signal Green** (oklch(0.7 0.18 145)): Success states, connected status dot, positive indicators.

### Chart Palette
Nine distinct hues for multi-series charts: Violet, Teal, Amber, Magenta, Crimson, Plum, Gold, Cyan, Rust. All tuned to similar perceptual lightness against the dark background.

### Named Rules
**The One Voice Rule.** Abyss Blue is the only accent color on the page. No secondary accent, no tertiary. Semantic colors (Burn Red, Signal Green) are state indicators, not decoration.

**The Luminance Ladder Rule.** Depth is conveyed through background lightness steps (0.145 → 0.155 → 0.22), never through shadow or border at rest. If a surface needs to stand out, make it lighter, not outlined.

## 3. Typography

**Body Font:** Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif
**Mono Font:** JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, monospace

**Character:** A single sans family carries the entire interface — headings, buttons, labels, body, data. No display/body pairing needed; this is a tool, not a magazine. The mono stack handles API key masks and tabular data with the precision those elements demand.

### Hierarchy
- **Title** (600 weight, 1.25rem / 20px, 1.4 line-height): Page title in the header. Used once per view.
- **Section Heading** (500 weight, 0.875rem / 14px, 1.5 line-height): Card titles, section labels. The primary organizational element.
- **Metric Value** (700 weight, 1.875rem / 30px, 1.2 line-height): Large numbers in summary cards. Designed for scanning, not reading.
- **Body** (400 weight, 0.875rem / 14px, 1.5 line-height): Table cells, descriptions, status messages. Line length capped at 75ch where prose appears.
- **Label** (400 weight, 0.75rem / 12px, 1.5 line-height, 0.05em letter-spacing, uppercase): Card eyebrow labels, table headers. The smallest voice.
- **Mono** (400 weight, 0.75rem / 12px, 1.5 line-height): API key masks, code snippets, tabular numbers.

### Named Rules
**The One Family Rule.** A single sans family for all UI text. Mono is reserved for data identity (keys, masks) and tabular alignment, not for headings or labels.

**The Weight-Only Emphasis Rule.** Emphasis is conveyed through font-weight (400 → 500 → 600 → 700), never through color, italic, or underline in body text. Color carries state; weight carries hierarchy.

## 4. Elevation

This system is flat at rest. No shadows appear on static surfaces — depth is conveyed through the Luminance Ladder (background → card → muted surface, each one step lighter). Borders separate adjacent surfaces at the same level.

**The Hover-Only Lift Rule.** Shadows appear exclusively as interaction feedback: a button on hover, a card on drag, a dropdown on open. Even then, they are subtle (0–4px blur, low opacity). If nothing is being interacted with, nothing casts a shadow.

### Shadow Vocabulary
- **Hover Lift** (`box-shadow: 0 2px 8px rgba(0,0,0,0.3)`): Buttons, interactive cards on hover.
- **Elevated Surface** (`box-shadow: 0 4px 16px rgba(0,0,0,0.4)`): Dropdowns, popovers, dialogs. Only when open.

## 5. Components

### Buttons
- **Shape:** Rounded-lg (8px radius). Clean, modern, no pill shapes.
- **Primary:** Abyss Blue background, ghost-white text. `bg-primary text-primary-foreground`. Used for the single most important action in any view.
- **Outline:** Transparent background, slate-surface border, ghost-white text. Default secondary action. Hover fills with muted background.
- **Ghost:** No border, no background. Hover reveals muted background. For tertiary actions, icon buttons, and inline controls.
- **Destructive:** 10% Burn Red background, Burn Red text. For irreversible actions only.
- **Hover / Focus:** Primary buttons deepen to 80% opacity on hover. All buttons get a 3px Abyss Blue ring on focus-visible. Active state adds a 1px translateY press effect.
- **Sizes:** xs (24px), sm (28px), default (32px), lg (36px). Icon-only variants at each size.
- **Disabled:** 50% opacity, no pointer events, no hover effects.

### Cards
- **Corner Style:** Rounded-lg (8px radius). Never pill, never sharp.
- **Background:** Void Deep (oklch(0.155 0 0)). One step above the page.
- **Border:** 1px slate-surface border. Subtle but present — cards are containers, not floating panels.
- **Internal Padding:** 1.5rem (px-6 py-6). Consistent across all card instances.
- **Structure:** Header (title + optional description), Content (the payload), Footer (summary stats or actions). All three slots optional; content-only cards are valid.

### Tables
- **Shape:** Rounded-lg container with overflow-x auto for responsive scroll.
- **Header Row:** Slate-surface background, uppercase 12px labels in Ash Gray.
- **Body Rows:** Border-separated, hover reveals muted/50 background.
- **Cell Padding:** Comfortable but dense — sufficient for scanning many rows without scrolling fatigue.
- **Numbers:** Tabular-nums aligned right. Monetary values to 4 decimal places.

### Inputs
- **Style:** Rounded-md border, full-width, void-black background, 1px slate-surface border.
- **Focus:** Border shifts to Abyss Blue. No ring on the input itself (focus ring lives on the interactive element).
- **Placeholder:** Ash Gray text at sufficient contrast (≥4.5:1 against void-black).
- **Height:** 36px default, matching button default size for aligned form rows.

### Badges / Chips
- **Style:** Outline variant with Abyss Blue at 25% border opacity and 10% background tint. Ghost-white text.
- **Usage:** Model name tags in table cells. Small, scannable, non-interactive.

### Status Indicators
- **Connected:** 12px Signal Green circle, no animation.
- **Disconnected:** 12px Burn Red circle, no animation.
- **Position:** Inline with label text, left-aligned.

### Chart Primitives
- **Color Assignment:** 9-chart-color palette, cycled per series. Abyss Blue reserved for single-series charts (bar chart total).
- **Motion:** 500ms tween on bar/line entry, cubic-in-out easing. Pie arcs use default tween.
- **Tooltips:** Clean, hide-label mode — the chart itself is the label.

## 6. Do's and Don'ts

### Do:
- **Do** use the Luminance Ladder (void-black → void-deep → slate-surface) to establish surface hierarchy.
- **Do** limit Abyss Blue to ≤10% of any screen. Primary buttons, focus rings, selected states, links: nothing else.
- **Do** use tabular-nums for all numeric data in tables and metric cards.
- **Do** prefer border separation over shadow for adjacent surfaces at the same level.
- **Do** keep card internal padding consistent at 1.5rem.
- **Do** use the mono stack for API key masks and code-level data identity.
- **Do** convey emphasis through font-weight alone (400 → 500 → 600 → 700).

### Don't:
- **Don't** add a second accent color. Abyss Blue is the only one. Burn Red and Signal Green are state, not decoration.
- **Don't** use gradient text, glassmorphism, or side-stripe borders. Banned absolutely.
- **Don't** use `border-radius` above 12px on cards or inputs. No pill-shaped containers.
- **Don't** pair `border: 1px solid` with `box-shadow` blur ≥16px on the same element. Pick one.
- **Don't** add shadows to static surfaces. Shadows are interaction feedback only.
- **Don't** use warm-tinted backgrounds (cream, sand, beige, paper). The background is void-black, period.
- **Don't** add decorative motion — no page-load choreography, no bounce, no elastic. Motion conveys state or it doesn't happen.
- **Don't** use display fonts, serifs, or decorative type. One sans family for all UI text.
- **Don't** use icons as decoration. Icons label actions or they're removed.
- **Don't** ship a modal without exhausting inline/progressive alternatives first.
