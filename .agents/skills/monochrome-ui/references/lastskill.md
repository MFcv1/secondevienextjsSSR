---
name: monochrome-ui
description: "Use this skill to create monochrome interfaces built from black, white, gray, inversion, borders, typography, density, and disciplined state design without relying on chromatic decoration. USE FOR: black-white-gray interfaces, monochrome dashboards, editorial systems, technical products, reduced visual identities. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Monochrome UI Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Monochrome UI archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, gray-scale table, control shell, editorial object, or bordered dashboard, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Monochrome UI components with states.
7. **Motion plan:** inversion, underline, border, or density transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.

## Core Directive

Monochrome UI succeeds when every shade has a job. The absence of color should sharpen hierarchy, not flatten it. Build with black, white, gray, borders, inversion, typography, density, and precise states.

Use this for monochrome dashboards, technical products, editorial systems, reduced brand identities, black/white landing pages, grayscale commerce, design system surfaces, and interfaces that need confidence without chromatic decoration.

Do not build a wireframe and call it monochrome. Monochrome requires more state design than colorful UI because every hover, focus, selected, disabled, loading, empty, error, and success condition must remain legible without relying on hue.

## Non-Negotiable Principles

- Black, white, gray, inversion, border weight, and density must carry all hierarchy.
- State cannot rely on random chromatic color; use labels, contrast, icons, outlines, and pattern.
- Every panel needs a clear gray job: canvas, surface, raised, selected, disabled, or overlay.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium-high. Monochrome supports dense interfaces if hierarchy is exact. |
| motion | Low-medium. Inversion, underline, slide, and opacity state changes. |
| decoration | Low. Borders, rows, and type contrast. |
| contrast | Achromatic only unless semantic color is required for critical alerts. |
| radius | 0px for editorial/system, 10-14px for shadcn-like apps, 999px for pills. |
| type | Neutral sans, mono for data, optional editorial serif for brand. |
| assets | Black-white photography, wire diagrams, UI screenshots, table data. |


## Signature System

- Achromatic State System: hover uses gray lift, active uses inversion, focus uses outline, disabled uses opacity plus cursor.
- Gray Job Table: write semantic gray tokens before designing components.
- Border Rhythm: hairlines and dividers create organization without color.
- Image Treatment: use grayscale, duotone, high contrast crop, or mask; do not introduce random color.

## Source Archetypes

Pick one primary archetype. Do not mix all five.

### Additional Refero Source Packs

- Ciridae dark monochrome: `#000000/#0B0B0B/#272A2A/#858585/#CECECE/#FFFFFF`, rare accent `#CC6437`, gradient `linear-gradient(rgb(255,255,255), rgba(206,206,206,.5))`; Pragmatica Cond/Pragmatica/Roboto Mono; scale 11/14/20/24/32/62; 4px base, 48px sections, 4px elements; radii 4/10/1440px; no shadows.
- Titan monochrome technical: use black/white/gray authority, large type, product proof, and sharp state contrast; reserve any accent for status or action only.
- Hyperstudio black studio: black canvas with chromatic edges only when media/product proof needs it; never use color as background filler.
- Partners for minimal monochrome: `#fff/#000`; 6px base, 59px sections, 18px cards; buttons 34.6354px, circular 49.4792px; no shadows; live refresh recommended before copying exact live UI.
- WGSN editorial utility: `#ffffff/#000000/#333333/#666666/#999999/#f5f5f5/#cccccc/#212121`; DM Sans only; display-lg `92px/0.79/-1.012px`; 32px sections, 24px cards, 18px gaps; cards 16px, inputs 8px, buttons 40px; no shadows.

### 1. Dark Command Console

Source basis: Figma Config.

Use for dark event pages, developer command surfaces, launch experiences, reduced control centers, and black-background product stories.

Raw signals:

- Canvas/background: `#000000`.
- Foreground on dark: `#e2e2e2`.
- Subtle dividers: `#3d3d3d`.
- Light popover surface: `#ffffff`.
- Type: figmaSans, fallback Inter.
- Type weights: `400`.
- Sizes: `16, 18, 20, 32, 80px`.
- Line heights: `0.95`, `1.00`, `1.10`, `1.25`, `1.30`.
- Tracking: `-0.0300em` at large sizes, `-0.0200em` medium.
- Mono: figmaMono, fallback Menlo, `16px`, line-height `1.30`.
- Section gap: `40px`.
- Element gap: `12px`.
- Card padding: `12px`.
- Radius: `0px` buttons, `50%` nav pills or dialog pills.
- Nav compact padding: `4-6px` vertical, `6-12px` horizontal.

Carry forward:

- Dark canvas is dominant and flat.
- Primary text is near-white, not low-contrast gray.
- Ghost buttons use transparent fill and near-white border.
- Popovers/dialogs can invert to white with black text.
- Borders create subtle organization; no shadows.

Avoid:

- Gradients.
- Many intermediate grays with no job.
- Saturated color on large surfaces.
- Generic fonts.
- Soft rounded main controls.
- Drop shadows.

Mini token pack:

```css
:root {
  --mono-canvas: #000000;
  --mono-surface: #000000;
  --mono-text: #e2e2e2;
  --mono-text-strong: #ffffff;
  --mono-rule: #3d3d3d;
  --mono-inverse-surface: #ffffff;
  --mono-inverse-text: #000000;
  --mono-radius-control: 0px;
  --mono-radius-pill: 9999px;
}
```

### 2. White Architectural Grid

Source basis: mono.

Use for architecture, product systems, precise portfolios, catalog pages, and bright monochrome layouts where visible grid lines do the work.

Raw signals:

- Canvas: `#ffffff`.
- Primary text/line: `#292929`.
- Deep black: `#000000`.
- Type: NH, fallback Helvetica Neue.
- NH weights: `100`, `300`, `400`.
- NH sizes: `16, 18, 25, 32, 40, 43px`.
- NH line heights: `1.20`, `1.25`, `1.27`, `1.34`, `1.50`.
- NH tracking: `-0.0200em`.
- Label/nav type: S-Condensed, fallback Impact.
- S-Condensed sizes: `12, 14, 40px`.
- S-Condensed tracking: `0.1000em`, `0.2000em`.
- Specialized headline: EV at `28px`, weight `100`, line-height `0.90`, tracking `-0.0500em`.
- Section gap: `40px`.
- Element gap: `8px`.
- Card padding: `20px`.
- Radius: `0px`.
- Buttons: transparent, `1px` ink border, `0px` vertical padding, `20px` horizontal.
- Inputs: `1px` black border, `8px` vertical, `0px` horizontal.

Carry forward:

- Use visible vertical/horizontal divisions instead of card elevation.
- Use positive-tracked condensed labels for navigation and metadata.
- Keep all controls sharp and planar.
- Buttons are outlined or ghosted, not filled.
- Functional elements should be high contrast, not pale.

Avoid:

- Colors outside black/white/near-black.
- Rounded corners.
- Soft shadows.
- Subtle gray text for key controls.
- Excessive padding.
- Large complex hero components.

Mini token pack:

```css
:root {
  --mono-canvas: #ffffff;
  --mono-surface: #ffffff;
  --mono-ink: #292929;
  --mono-ink-strong: #000000;
  --mono-rule: #292929;
  --mono-radius: 0px;
  --mono-space-element: 8px;
  --mono-space-card: 20px;
}
```

### 3. Black Command Center With Pill Actions

Source basis: Yung Studio.

Use for premium dark studios, command centers, high-impact landing pages, black-canvas portfolios, and monochrome brand systems that need one optional violet signal.

Raw signals:

- Canvas: `#000000`.
- Foreground: `#ffffff`.
- Optional signal: `#c692ff`.
- Type: PolySans-Slim for body/links, PolySans-Neutral for display/buttons, PolySans-Bulky for special links.
- Body sizes: `16, 20, 30, 40px`, line heights `1.00`, `1.10`, `1.35`, tracking `-0.0100em`.
- Display sizes: `60, 160px`, line heights `0.90`, `1.10`, tracking `-0.0200em`.
- Bulky link size: `28px`, line-height `1.01`.
- Section gap: `60-124px`.
- Element gap: `20-24px`.
- Content section padding: about `60px 50px`.
- Radius: `0px` cards, `9999px` buttons, occasional `10px` default.
- Primary pill padding: about `32px 50px 22px`.
- Small pill padding: about `14px 24px 10px`.
- Internal rules: `rgba(255,255,255,.15)`, ghost border `rgba(255,255,255,.3)`.

Carry forward:

- White-on-black contrast is the identity.
- Pill buttons can be huge and tactile if the rest remains stark.
- Metrics use large `60px` numbers and thin grid rules.
- Optional violet marks specific contextual highlights, not every component.
- Content cards stay naked and integrated into negative space.

Avoid:

- Additional saturated colors.
- Shadows.
- Background fills on content cards.
- Radii other than `0px` containers and `9999px` buttons unless the local system demands it.
- Cluttered sections.

Mini token pack:

```css
:root {
  --mono-canvas: #000000;
  --mono-ink: #ffffff;
  --mono-muted: rgba(255,255,255,.6);
  --mono-rule: rgba(255,255,255,.15);
  --mono-rule-strong: rgba(255,255,255,.3);
  --mono-signal: #c692ff;
  --mono-radius-card: 0px;
  --mono-radius-button: 9999px;
}
```

### 4. Retro Terminal Text Interface

Source basis: kaisermann.

Use for terminal-inspired personal sites, experimental developer portfolios, command-line interfaces, text-first microsites, and low-fidelity digital identities.

Raw signals:

- Canvas: `#000000`.
- Body/control gray: `#a0a0a0`.
- Active white: `#ffffff`.
- Optional glitch cyan: `#02b7b6`.
- Optional glitch red: `#b70202`.
- Type: VCR OSD Mono only, fallback monospace.
- Weight: `400`.
- Sizes: `23, 26, 63px`.
- Line heights: `0.90`, `1.20`, `1.40`.
- Section gap: `160px`.
- Element gap: `0px`.
- Padding: `0px`.
- Radius: `0px`.
- Interaction: text-only link; hover/active changes to active white and `1px` bottom border.

Carry forward:

- Everything is text-centric.
- Active white is reserved for high emphasis and interactive borders.
- Gray text does most of the reading.
- Glitch cyan/red may appear only as subtle overlays/loading artifacts.
- No imagery, no icons, no padded buttons.

Avoid:

- Background fills on links.
- Any radius.
- Elevation.
- Common UI iconography.
- Custom gradients.
- Chromatic accents outside subtle glitch effects.
- Dense decorative ASCII that blocks readability.

Mini token pack:

```css
:root {
  --mono-canvas: #000000;
  --mono-text: #a0a0a0;
  --mono-active: #ffffff;
  --mono-glitch-cyan: #02b7b6;
  --mono-glitch-red: #b70202;
  --mono-radius: 0px;
  --mono-space-section: 160px;
}
```

### 5. Component Blueprint System

Source basis: shadcn/ui.

Use for practical monochrome applications, dashboards, admin tools, docs systems, design system pages, and component-heavy products where accessible states matter.

Raw signals:

- Canvas: `#ffffff`.
- Secondary background: `#f2f2f2`.
- Border/divider: `#e5e5e5`.
- Muted text/icon: `#737373`.
- Primary text: `#0a0a0a`.
- Strong black: `#000000`.
- Error: `#c22b10`.
- Success: `#10c22b` if needed and semantic only.
- Type: Geist, fallback Inter.
- Weights: `400`, `500`, `600`.
- Sizes: `12, 13, 14, 16, 18, 48px`.
- Display tracking: `-0.0500em` at `48px`, `-0.0250em` at `18px`.
- Mono: Geist Mono, fallback IBM Plex Mono, `14px`, line-height `1.43`.
- Section gap: `83px`.
- Element gap: `8px`.
- Card padding: `16px`.
- Radius: `10px` controls/default, `14px` cards, `26px` badges, `9999px` pills, `0px` split edges.
- Primary button: black fill, white text, `10px` radius, `8px` vertical, `48px` horizontal.
- Inputs: transparent, `1px #e5e5e5`, `10px` radius, `4px` vertical, `10px` horizontal.
- Cards: subtle `1px` shadow/ring, not heavy elevation.

Carry forward:

- Use a full gray job table for app states.
- Geist/Inter-like type can carry an entire system when weights and tracking are controlled.
- Rounded system geometry is allowed if repeated exactly.
- Split controls use mixed radius intentionally.
- Semantic red/green are allowed only for actual error/success states.

Avoid:

- Saturated colors.
- Extra font families.
- Strong multi-directional shadows.
- Arbitrary radius changes.
- Excessive padding.
- Decorative gradients.

Mini token pack:

```css
:root {
  --mono-canvas: #ffffff;
  --mono-surface-subtle: #f2f2f2;
  --mono-rule: #e5e5e5;
  --mono-muted: #737373;
  --mono-ink: #0a0a0a;
  --mono-ink-strong: #000000;
  --mono-error: #c22b10;
  --mono-success: #10c22b;
  --mono-radius-control: 10px;
  --mono-radius-card: 14px;
  --mono-radius-badge: 26px;
  --mono-radius-pill: 9999px;
}
```

## Differentiation

Use Monochrome UI when black-white-gray interfaces, monochrome dashboards, editorial systems, technical products, reduced visual identities. If removing the gray-scale table, shell, or editorial object, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `high-contrast` for poster impact; use this when grayscale systems, tables, controls, and achromatic states must stay operational.
## Gray Job Table

Before designing components, write the gray roles. Example:

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-raised: #ffffff;
  --surface-subtle: #f2f2f2;
  --surface-inverse: #000000;
  --text-primary: #0a0a0a;
  --text-secondary: #292929;
  --text-muted: #737373;
  --text-disabled: #a0a0a0;
  --text-inverse: #ffffff;
  --rule-hairline: #e5e5e5;
  --rule-medium: #a0a0a0;
  --rule-strong: #000000;
  --hover-fill: #f2f2f2;
  --selected-fill: #000000;
  --selected-text: #ffffff;
  --focus-ring: #000000;
  --overlay: rgba(0,0,0,.56);
  --semantic-error: #c22b10;
  --semantic-success: #10c22b;
}
```

Rules:

- Do not use `text-muted` for essential navigation.
- Disabled is not the same as muted metadata.
- Hover fill is not the same as selected fill.
- Borders need at least two strengths when the interface is dense.
- Error/success colors are semantic exceptions and must be paired with text/icon/rule cues.

### Execution Token Contract

Every Monochrome UI build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #ffffff;
  --surface: #f7f7f7;
  --surface-muted: #e9e9e9;
  --text: #000000;
  --text-muted: #5f5f5f;
  --line: #111111;
  --action: #000000;
  --action-strong: #000000;
  --radius-control: 8px;
  --radius-card: 10px;
  --radius-panel: 12px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: var(--font-sans);
  --font-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
  --type-mono-xs: 500 10px/1.4 var(--font-mono);
  --type-mono-sm: 500 11px/1.4 var(--font-mono);
  --type-meta: 500 12px/1.45 var(--font-sans);
  --type-body-sm: 400 13px/1.55 var(--font-sans);
  --type-body: 400 15px/1.62 var(--font-sans);
  --type-ui: 600 14px/1.4 var(--font-sans);
  --type-card: 600 20px/1.18 var(--font-sans);
  --type-section-sm: 600 28px/1.08 var(--font-display);
  --type-section: 600 42px/1.02 var(--font-display);
  --type-display: 600 clamp(46px, 8vw, 82px)/.92 var(--font-display);
  --track-mono-xs: .16em;
  --track-mono-sm: .10em;
  --track-section: -.025em;
  --track-display: -.04em;
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 20px;
  --s-6: 24px;
  --s-7: 32px;
  --s-8: 48px;
  --s-9: 64px;
  --s-10: 80px;
  --s-11: 96px;
  --shadow-flat: none;
  --shadow-card: inset 0 0 0 1px #cfcfcf;
  --shadow-panel: inset 0 0 0 1px #111111;
  --shadow-hero: none;
  --shadow-modal: 0 24px 80px rgba(15,23,42,.16);
  --shadow-action: 0 6px 18px color-mix(in srgb, var(--action), transparent 72%);
  --status-success-bg: #f1f1f1;
  --status-success-fg: #111111;
  --status-info-bg: #e9e9e9;
  --status-info-fg: #242424;
  --status-warning-bg: #dedede;
  --status-warning-fg: #000000;
  --status-danger-bg: #000000;
  --status-danger-fg: #ffffff;
  --status-neutral-bg: #f3f3f3;
  --status-neutral-fg: #5f5f5f;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Monochrome UI token |
| --- | --- |
| `text-xs`, `text-sm` | `--type-body-sm` or `--type-meta` |
| `text-base`, `text-lg` | `--type-body` or `--type-card` |
| `text-2xl`, `text-3xl` | `--type-card` or `--type-section-sm` |
| `text-4xl`, `text-5xl` | `--type-section` |
| `text-6xl`, `text-7xl` | `--type-display` |
| `p-3`, `p-4`, `p-5` | `var(--s-3)`, `var(--s-4)`, `var(--s-5)` |
| `gap-3`, `gap-4`, `gap-6` | `var(--s-3)`, `var(--s-4)`, `var(--s-6)` |
| `rounded-md`, `rounded-xl`, `rounded-2xl` | `--radius-control`, `--radius-card`, `--radius-panel` |
| `shadow-sm`, `shadow-md` | `var(--shadow-card)` |
| `shadow-lg`, `shadow-xl` | `var(--shadow-panel)` or `var(--shadow-hero)` |
| `shadow-2xl` | `var(--shadow-modal)` |
| `bg-blue-*`, `text-purple-*` | forbidden except critical semantic alerts |
| `shadow-*` | gray border, inversion, or hatch tier |

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `mu`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.

## Typography

Monochrome UI needs type contrast because it has no chromatic variety.

Additional monochrome type references: Pragmatica Cond for condensed display, DM Sans for dense editorial utility, Diatype for achromatic editorial, SuisseIntl for large neutral display, Martian/Roboto/Geist Mono only for code/meta. Use contrast through size, weight, and measure rather than color.

Roles:

- Display: `48-160px`, tight tracking, line-height `0.9-1.1`.
- Section heading: `30-60px` depending on archetype.
- Body: `16-20px`, readable contrast.
- Metadata/labels: `12-14px`, often positive-tracked in architectural systems or mono in technical systems.
- Mono/code: code, command lines, technical details, timestamps.
- Control: same font family as UI, clear enough for repeated use.

Type strategies:

- Dark command: one sans plus mono.
- Architectural grid: light/condensed labels plus precise body/headings.
- Command center: display and body from one family with tight tracking.
- Terminal: one mono for everything.
- Component system: Geist-like type with weight and size hierarchy.

Avoid:

- Pale metadata that fails contrast.
- Decorative monospace everywhere unless terminal archetype.
- Overusing uppercase labels.
- Treating font choice as optional; monochrome identity often lives in type.

## Layout And Density

Monochrome can support higher density than soft minimalism because rows, rules, and inversion create clarity.

Layout patterns:

- Command console: dark canvas, central display, text navigation, command rows.
- Architectural grid: visible grid lines, full-bleed or contained modules, outlined controls.
- Command center: black canvas, naked content blocks, metric grid, large pill actions.
- Terminal text: single-column, huge section gaps, text-only interaction.
- Component blueprint: app shell, cards, forms, tables, badges, and segmented controls.

First viewport:

- Must show whether the system is dark, light, or inverse.
- Must include real proof: product UI, command panel, table, metric grid, image treatment, or component gallery.
- Must have clear actions with visible focus states.
- Must reveal next structure: rows, grid, table, inverse section, or control rail.

Responsive:

- Reduce columns before shrinking type below usability.
- Preserve row labels and table relationships on mobile.
- In dark systems, do not let text become too dim.
- Sticky controls should not cover content.

## Component Signatures

Use at least four for full page/app work.

### Refero Expansion Component Deltas

- Monochrome surfaces must name their gray jobs: Ciridae uses `#0B0B0B/#272A2A/#858585/#CECECE`, WGSN uses `#333/#666/#999/#f5f5f5/#ccc`, Partners for stays pure black/white. Do not insert random mid-gray values.
- Radius systems stay exact: Ciridae 4/10/1440px, WGSN 8/16/40px, Partners for 18px cards and 34.6354px buttons. Match hover/focus to border, underline, inversion, or ring, not color alone.
- Shadows are generally forbidden. If depth is needed, use border contrast, inversion, overlap, scale, or source-specific media treatment.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type MonochromeUiState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type MonochromeUiStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function MonochromeUiStatusPill({ role, children }: { role: MonochromeUiStatus; children: React.ReactNode }) {
  return <span className="monochrome-ui-status-pill" data-role={role}>{children}</span>;
}

export function GrayTokenShellContract({ state = "default" }: { state?: MonochromeUiState }) {
  return <section className="monochrome-ui-hero-object" data-state={state} aria-label="Monochrome UI proof object" />;
}

export function InversionButtonContract({ title, meta, state = "default" }: { title: string; meta: string; state?: MonochromeUiState }) {
  return <article className="monochrome-ui-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function MonochromeTableContract({ items }: { items: string[] }) {
  return <nav className="monochrome-ui-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function MonochromeUiSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="monochrome-ui-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.monochrome-ui-status-pill {
  display: inline-flex;
  width: max-content;
  align-items: center;
  padding: var(--s-1) 10px;
  border-radius: 999px;
  font: var(--type-mono-sm);
  letter-spacing: var(--track-mono-sm);
  background: var(--status-neutral-bg);
  color: var(--status-neutral-fg);
}
.monochrome-ui-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.monochrome-ui-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.monochrome-ui-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.monochrome-ui-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.monochrome-ui-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.monochrome-ui-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.monochrome-ui-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.monochrome-ui-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.monochrome-ui-card[data-state="error"] { border-color: var(--status-danger-fg); }
.monochrome-ui-card > span { font: var(--type-meta); color: var(--text-muted); }
.monochrome-ui-card > strong { font: var(--type-card); color: var(--text); }
.monochrome-ui-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.monochrome-ui-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.monochrome-ui-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.monochrome-ui-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.monochrome-ui-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.monochrome-ui-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.monochrome-ui-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .monochrome-ui-hero-object { min-height: 280px; }
  .monochrome-ui-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Monochrome Inversion Button

Purpose: primary action, selected state, command trigger.

Structure:

- Light mode: black fill with white text or outlined black button.
- Dark mode: white fill with black text or white outline ghost.
- Stable size; hover never changes dimensions.

States:

- Hover: inversion or border-strength swap.
- Focus: visible outline offset.
- Active: pressed inversion or inner rule.
- Disabled: readable reduced contrast plus unavailable reason if needed.
- Loading: preserve width; text changes to operation state.

### Monochrome Table

Purpose: dense comparison, operations data, settings, catalog, archive, status.

Structure:

- Header labels in metadata style.
- Rows divided by hairlines.
- Numeric columns align.
- Important cells use weight or inversion, not color.

States:

- Hover row: gray fill.
- Selected row: full inversion or left black rule.
- Sort active: underline header or black marker.
- Error: row-level message plus retry.
- Empty: one explanatory row.
- Loading: fixed skeleton rows.

### Bordered Filter Rail

Purpose: categories, facets, modes, sorting, navigation.

Structure:

- Vertical or horizontal rail with outlined/underlined items.
- Counts use muted text but remain readable.
- Selected item uses inversion, strong rule, or weight.

States:

- Hover: underline/rule.
- Focus: outline.
- Selected: inversion.
- Disabled: lower contrast and no hover illusion.

### Gray Token Shell

Purpose: component gallery, dashboard shell, system surface.

Structure:

- Demonstrates gray scale through real modules: nav, controls, cards, table, form, modal.
- Each gray has a semantic role.

States:

- Include hover/focus/selected/loading/empty/error/success examples when building design systems.

### Black-White Card

Purpose: repeated content grouping when a row is insufficient.

Structure:

- Border or subtle fill; no decorative shadow.
- Stable radius based on archetype.
- Title, metadata, proof, action/status.

States:

- Hover: border/fill change.
- Selected: inversion or strong rule.
- Loading/empty/error stay inside the frame.

### Grayscale Gallery

Purpose: photographic proof without introducing color.

Structure:

- Images use grayscale, desaturation, duotone black/white, or high-contrast crops.
- Captioned and indexed.
- Crop must reveal the actual object/product/person if that matters.

States:

- Hover: crop shift, contrast shift, caption rule.
- Focus: visible outline or caption inversion.

### Mono Status Row

Purpose: system status, logs, monitors, settings, command output.

Structure:

- Timestamp, label, message, status/action.
- Mono or metadata style.
- Status is text/rule/icon plus optional semantic color only if necessary.

States:

- Active: white/black inversion.
- Warning/error: add text label and rule, not hue alone.

### Reduced Footer

Purpose: closure and navigation.

Structure:

- Repeats grid or command motif.
- Includes version/date/system note if useful.
- Links use underline, rule, or inversion.

## State Patterns

Preferred achromatic states:

- Hover: gray fill, underline, border darken, crop shift.
- Focus: `2px` ring or `1px` strong outline; never invisible.
- Active: inversion.
- Selected: inversion, weight, left rail, or rule strength.
- Disabled: lower contrast plus label; do not rely on opacity only if text becomes unreadable.
- Loading: skeleton in gray scale; avoid flashy shimmer.
- Empty: monochrome frame with useful next action.
- Error: text + border/rule + semantic red if allowed.
- Success: text + icon/rule + semantic green only if needed.

Example:

```css
.mono-button {
  border: 1px solid var(--rule-strong);
  background: var(--surface);
  color: var(--text-primary);
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.mono-button:hover,
.mono-button:focus-visible,
.mono-button[aria-pressed="true"] {
  background: var(--selected-fill);
  color: var(--selected-text);
}
.mono-row {
  border-bottom: 1px solid var(--rule-hairline);
}
.mono-row:hover {
  background: var(--hover-fill);
}
.mono-row[aria-selected="true"] {
  background: var(--selected-fill);
  color: var(--selected-text);
}
.mono-field[aria-invalid="true"] {
  border-color: var(--semantic-error);
}
.mono-field[data-complete="true"] {
  border-color: var(--rule-strong);
}
```

## Motion Grammar

- Monochrome motion must be readable without chroma: 100-220ms inversion, border, underline, opacity, or small translate. No decorative gradient movement; reduced motion keeps inversion and focus rings.

## Complete Page Protocols

```tsx
// Monochrome Dashboard
<main data-skill="monochrome-ui" data-archetype="monochrome-dashboard">
  <GrayTokenShellContract state="selected" />
  <BorderedFilterRailContract items={["All", "Open", "Flagged"]} />
  <MonochromeTableContract rows={recordsWithGrayStates} />
  <MonoStatusRowContract role="warning">Delayed, needs review</MonoStatusRowContract>
</main>

// Black White Editorial
<main data-skill="monochrome-ui" data-archetype="black-white-editorial">
  <BlackWhiteCardContract title="Field notes" meta="Index / 04" />
  <GrayscaleGalleryContract images={highContrastCrops} />
  <InversionButtonContract state="default">Read archive</InversionButtonContract>
</main>
```
```tsx
// Monochrome Dashboard
<main data-skill="monochrome-ui" data-archetype="monochrome-dashboard">
  <GrayTokenShellContract state="selected" />
  <BorderedFilterRailContract items={["All", "Open", "Flagged"]} />
  <MonochromeTableContract rows={recordsWithGrayStates} />
  <MonoStatusRowContract role="warning">Delayed, needs review</MonoStatusRowContract>
</main>

// Black White Editorial
<main data-skill="monochrome-ui" data-archetype="black-white-editorial">
  <BlackWhiteCardContract title="Field notes" meta="Index / 04" />
  <GrayscaleGalleryContract images={highContrastCrops} />
  <InversionButtonContract state="default">Read archive</InversionButtonContract>
</main>
```
Motion should clarify state in a reduced palette.

Allowed primitives:

- Inversion swap for buttons/rows.
- Underline expansion for links.
- Border draw for panels/cards/tables.
- Drawer slide for rails and inspectors.
- Row highlight for dense tables.
- Image crop/contrast shift for grayscale media.
- Terminal cursor blink only in terminal archetype and only if subtle.

Timing:

- Hover: `100-160ms`.
- Inversion: `120-180ms`.
- Drawer/panel: `180-280ms`.
- Image crop: `360-620ms`.
- Terminal cursor: `900-1200ms`, optional.

CSS primitive:

```css
.mono-rule-link {
  position: relative;
  text-decoration: none;
}
.mono-rule-link::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  inset-block-end: -2px;
  block-size: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 160ms ease;
}
.mono-rule-link:hover::after,
.mono-rule-link:focus-visible::after,
.mono-rule-link[aria-current="page"]::after {
  transform: scaleX(1);
}
.mono-invert {
  transition: background 140ms ease, color 140ms ease;
}
.mono-invert:hover,
.mono-invert:focus-visible,
.mono-invert[aria-selected="true"] {
  background: var(--selected-fill);
  color: var(--selected-text);
}
@media (prefers-reduced-motion: reduce) {
  .mono-rule-link::after,
  .mono-invert {
    transition-duration: .01ms !important;
  }
}
```

Avoid:

- Color flashes.
- Decorative blur/glow.
- Motion that shifts table columns or row heights.
- Generic fade-up as the main identity.
- Continuous loops outside terminal cursor/loading context.


## Absolute Bans

- No random gray ramp.
- No metadata too faint to read.
- No missing state design because color is absent.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`. For expanded implementation examples, load `references/advanced-implementation-notes.md` only after the archetype and token pack are chosen.

## Anti-Slop Rules

Reject:

- Random gray ramps with no assigned roles.
- Low-contrast metadata required for use.
- Decorative black panels.
- Overuse of outlines until everything has equal weight.
- Monochrome pages that look like unstyled wireframes.
- Missing selected/focus states.
- Color used to rescue weak hierarchy.
- Heavy shadows.
- Gradients and glows.
- Placeholder-only command panels.
- Text-only UI that does not support keyboard focus.

Repair:

- If it feels flat, strengthen type hierarchy and define gray jobs.
- If it feels like a wireframe, add inversion states, rules, density, and proof.
- If it feels too outlined, remove borders from low-priority elements and reserve strong borders for controls.
- If it is hard to use, increase contrast and state clarity before adding color.
- If it feels cold but must stay monochrome, improve copy, spacing, and image treatment.

## Pre-Output Checklist

- First viewport contains a real gray-scale table, shell, or editorial object.
- One Monochrome UI archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them
