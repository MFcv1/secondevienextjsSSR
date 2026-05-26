---
name: light-ui
description: "Build modern light interfaces with strong visual identity: quiet white chrome, precise SaaS surfaces, soft glow, control-panel light chassis, and airy component galleries. USE FOR: bright applications, clean dashboards, SaaS pages, productivity tools, documentation, approachable product surfaces. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Light UI Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Light UI archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, bright app shell, docs preview, data table, or approachable product surface, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Light UI components with states.
7. **Motion plan:** light state transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

You are a senior frontend design engineer specializing in Light UI. The output must feel open, clear, bright, lightweight, trustworthy, usable. Do not merely skin default components with a color palette. Build a visual operating system: layout, typography, color roles, component geometry, imagery, motion, interaction states, responsive behavior, and proof content must all point in the same direction.

Use this skill for bright applications, clean dashboards, SaaS pages, productivity tools, documentation, approachable product surfaces.


Before writing code for a substantial UI, output a compact `<design_plan>` block. Include:

1. **Use case:** product type, audience, primary action, and emotional target.
2. **Style direction:** one Light UI sub-direction chosen from the archetypes below.
3. **Visual operating mode:** density, motion intensity, decoration budget, contrast mode, radius rule, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, hero proof object, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, geometry, evidence, and interaction state rules.
6. **Component plan:** at least four concrete components from the arsenal, with states.
7. **Motion plan:** which elements move, why they move, and reduced-motion fallback.
8. **Anti-slop sweep:** name the top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise. If the request asks for a full page/app, include the block.

## Non-Negotiable Principles

- White and near-white surfaces need enough borders, type contrast, and state definition.
- Use structure, not shadow spam, to separate areas.
- Keep interactive states visible despite the light palette.
- Brightness is not blankness. A Light UI can be image-led, technical, soft, dense, or gallery-like.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium by default; can become high in control-panel or dashboard mode. |
| motion | Low-medium: focus, tab, table update, panel open, soft card state. |
| decoration | Low; allow imagery, glow, dark display modules, or artifact cards only when the chosen source demands them. |
| contrast | Bright surfaces with crisp dark text, visible borders, and readable muted labels. |
| radius | Source-led: 6-8px for technical/gallery, 15-24px for consumer/community, 9999px for pill systems, 0px for control-panel ghosts. |
| type | Modern sans first; mono for code/readouts; never make mono the whole interface unless the task is explicitly technical. |
| assets | Screens, docs, event/product imagery, data previews, diagrams, component cards, control readouts. |

## Signature System

- White Chrome: white surfaces are differentiated by borders, elevation, grouping, spacing, and real content.
- Visible State Lightness: selected tabs, focus rings, errors, disabled controls, and empty states remain obvious.
- Approachable Product Proof: diagrams, UI previews, galleries, and cards should feel inviting and uncluttered.
- Soft Color Roles: low-saturation colors group paths; vivid colors identify action, state, or a single motif.

## Differentiation

Use Light UI when bright applications, clean dashboards, SaaS pages, productivity tools, documentation, approachable product surfaces. If removing the white app shell or data surface, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `clean-saas` when SaaS proof economics dominate; use this when bright tactility, docs, or approachable app surfaces are the main challenge.
## Raw Archetype Packs

Pick one source pack as the spine. Borrowing one supporting move is fine; averaging all five creates generic bright mush.

| Source | Use When | Palette | Type | Radius / Spacing | Components | Carry Forward | Avoid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Luma, "Festival Poster Behind Frosted Glass" | Consumer tools, events, communities, creator products where imagery is the emotional proof. | `#ffffff` canvas, `#131517` text, `#656768` secondary, `#a5a6a8` tertiary, `#333537` CTA, `#099ef1` logo spectrum only, `#f31a7c` one headline accent. | System font stack, weights 400/500, headline around 64px, line-height 66px, `-0.016em`. | 1200px max, 52px nav, 15px CTA/card radius, two-column hero. | Quiet nav, live-time badge, charcoal pill CTA, event cards, vivid hero image. | Let imagery and one accent phrase create emotion while the chrome stays nearly silent. | Do not spread spectrum gradients across buttons, borders, cards, or backgrounds. |
| Lightdash, "Codebase Blueprint On Frosted Glass" | Analytics, docs, developer-light SaaS, data tools that need friendly precision. | `#ffffff`, `#f8fafb`, `#eceff3`, `#1a1b25`, `#666d80`, `#5e4cff`, `#36394a`. | Britti Sans for display/labels, Inter for UI, IBM Plex Mono for code. | 40-64px sections, 8px buttons, 12/20px cards, 26px chips. | Violet button, ghost outline, elevated feature card, dark input/code module, interactive chips. | Use violet only for action; make code/data modules crisp but friendly. | Do not make dark modules dominate a light-mode system. |
| Circle, "Galactic UI With Soft Glow" | Community, membership, education, collaboration, friendly consumer SaaS. | `#ffffff`, `#0a0a0a`, `#e4e7eb`, `#737373`, `#408fed`, `#3e1bc9`, `#e0eafc`, `#f2dbf5`, `#fff0d8`. | Inter only, 400-700, display around 48-64px. | 1376px max, 93px sections, 20px cards, 24px translucent cards, pill controls. | Full-bleed gradient stage, white product cards, pill inputs, pastel buttons, translucent panels. | Keep white content surfaces clear over atmospheric backgrounds. | Do not use square corners, harsh fills, or heavy opaque shadows. |
| Lift-off Challenge, "Aircraft Control Panel" | Dense light control surfaces, simulations, hardware dashboards, challenge/game admin. | `#e5e7eb` chassis, `#11161c` display, `#ffffff` display text, `#bbbbbb` borders, `#f43325` urgent action, `#0078a8` secondary link, `#575c75` slate. | Proxima Nova UI, SF Mono readouts, Doto only for rare giant digital numerals. | 8px element gaps, 48px sections, pill red button, zero-radius ghost/input, dark display panels. | Modular grid, black display cards, red action button, mono labels, status indicators. | Lightness can be a chassis around dense dark modules. | Do not use red decoratively or add airy whitespace to a control surface. |
| Tailark Pro, "Gallery Of Digital Artifacts" | Component galleries, docs, illustration libraries, template browsers, design tooling. | `#ffffff`, `#09090b`, `#e4e4e7`, `#52525c`, `#404040`, `#615fff`, `#2b7fff`, `#00d492`. | ui-sans for UI, Geist Mono for labels/code, Mulish sparingly for softer copy. | 1200px max, 48px sections, 8px gaps, 6px buttons, 16px cards, 32-40px top-rounded artifact cards. | Gallery grid, file badges, illustration cards, top-rounded cards, translucent input. | Use varied but controlled radius to make artifact groups memorable. | Do not add heavy shadows or many vivid colors outside artifacts. |

## Semantic Token Packs

Use role-based tokens. Choose one pack and adapt names to the project.

### Additional Refero Source Packs

- Intercom editorial light shell: `#ffffff/#faf9f6/#f1eee9/#e7e3db/#dedbd6`, ink `#111111/#000000`, action accents `#0007cb/#ff5600`; Saans 300/400 at 14-80px, display `80px/1/-2.4px`; SaansMono 12/14px with `1.2px/0.7px` tracking; Serrif 16px/1.40; 4px base, 48px section rhythm, 16px cards/gaps, 4px buttons/nav. Use violet/orange only for CTA, active state, or product proof.
- Mintlify docs-light shell: `#ffffff/#000000/#08090a/#f2f2f2/#dddddd`, action `#0c8c5e`, green `#00dc8d`, blue `#0052ff`; Inter 400/500/600, display `57px/1.15/-0.0200em`, heading `40px/1.1/-0.0100em`, body `16px/1.5`, labels 13px `0.0500em`; transparent zero-radius inputs, pill buttons `1.67772e+07px`, subtle shadows `lab(.../.03) 0 2px 4px`.
- Kindsight warm light brand: `#faf5f1/#fefffa/#e5e1d6/#0e0f0a/#24280f/#3d4128`, CTA `#de7653`, secondary `#e7573d`, keyline accent `#e1f079`; Founders Grotesk 200-500 10-40px, Times Now 200/300 display 30-120px with `0.78-1` leading and `-0.0640em` tracking at 120px; 1440px max, 40px sections/cards, 12px gaps, buttons 10px, tags 18px, cards 24px, inputs 51px.

- Monad warm-light lab: canvas `#f6f3f1`, ink `#000000/#242424`, cool panel `#cfdaf5`, gradient wash `rgba(255,148,115,.8) -> rgba(160,181,235,.8)` and `rgb(160,181,235) -> rgb(167,252,205)`; ABC Diatype Mono plus Untitled Serif/Sans; display `80px/1.2`, mono captions `12px/1.35`; 8px base, 40px sections/cards, 16px gaps; cards 40px, buttons 100px, tags 2000px.
- AIUC precise white editorial UI: `#ffffff/#000000/#1a1a1a/#323232/#707070`, borders `#d3dfeb`, warm note `#eddfab`; Almarai 300 headings, ABC Diatype body, ABC Diatype Semi-Mono nav/meta; display `40px/1.3` with `-0.8px`; 40px sections, 16px cards, 10px gaps; buttons 3px, cards/default 4px, pill 1000px.
- Humble tactile light product: `#fafafa/#f1f1f1/#ecebe8`, ink `#1c1c1c`, muted `#6e6e6e`, action `#ff4000`; Bricolage Grotesque 500/600 plus Geist 500/600; display `58px/0.7` with `-0.052px`; 64px sections, 32px cards, 10px gaps; controls 6px, cards 30px, images 40px, buttons 100px; shadow `0 30px 30px -2.5px rgba(0,0,0,.03)`.
- Parallel/Home rigid light shell: canvas `#e4dfd9/#ffffff`, ink `#000000/#050505`, muted `#737373`, accent `#ffc42c`; Rules Font display plus ui-sans; display `69px/1.1` with `-1.38px`; 24px sections, 32px cards, 8px gaps; cards 20px, buttons 12px, inputs 0px, tags 9999px; shadow `0 6px 27px rgba(0,0,0,.07)`.

### Quiet Consumer Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #f8fafb;
  --text: #131517;
  --text-muted: #656768;
  --text-faint: #a5a6a8;
  --line: #e4e7eb;
  --action: #333537;
  --action-text: #ffffff;
  --accent-inline: #f31a7c;
  --radius-control: 15px;
  --radius-card: 15px;
  --shadow-light: 0 12px 40px rgba(15, 23, 42, .06);
}
```

### Blueprint Light Pack

```css
:root {
  --canvas: #ffffff;
  --canvas-alt: #f8fafb;
  --surface: #ffffff;
  --surface-code: #36394a;
  --text: #1a1b25;
  --text-muted: #666d80;
  --text-faint: #a4abb8;
  --line: #eceff3;
  --action: #5e4cff;
  --action-text: #ffffff;
  --radius-control: 8px;
  --radius-card: 20px;
  --radius-chip: 26px;
}
```

### Soft Galactic Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-glass: rgba(255,255,255,.58);
  --text: #0a0a0a;
  --text-muted: #737373;
  --line: #e4e7eb;
  --action: #e0eafc;
  --action-text: #0a0a0a;
  --glow-a: #408fed;
  --glow-b: #3e1bc9;
  --soft-a: #f2dbf5;
  --soft-b: #fff0d8;
  --radius-control: 9999px;
  --radius-card: 20px;
  --radius-panel: 24px;
}
```

### Control Chassis Pack

```css
:root {
  --canvas: #e5e7eb;
  --surface: #ffffff;
  --display: #11161c;
  --display-text: #ffffff;
  --text: #000000;
  --text-muted: #575c75;
  --line: #bbbbbb;
  --action: #f43325;
  --action-text: #ffffff;
  --link: #0078a8;
  --radius-control: 0px;
  --radius-panel: 24px;
  --radius-pill: 9999px;
}
```

### Artifact Gallery Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #f7f7f8;
  --text: #09090b;
  --text-muted: #52525c;
  --line: #e4e4e7;
  --action: #615fff;
  --action-text: #ffffff;
  --info: #2b7fff;
  --positive: #00d492;
  --radius-control: 6px;
  --radius-card: 16px;
  --radius-artifact-top: 40px;
}
```

Token rules:

- White surfaces need boundaries: border, shadow, spacing, or background shift. Never depend on white-on-white guessing.
- Pick one separation method per section: soft shadow, technical border, translucent surface, or chassis display. Do not stack all methods.
- Accent color marks action, active state, status, or a single expressive motif. It is not a heading color budget.
- Dark modules are allowed only as code preview, control display, hero object, or contrast card.

### Execution Token Contract

Refero ready-to-use deltas from Intercom/Mintlify/Kindsight:
- Token roles: Intercom `--canvas:#ffffff`, `--warm-band:#faf9f6`, `--line:#dedbd6`, `--ink:#111111`, action `#0007cb`, accent `#ff5600`; Mintlify docs actions `#0c8c5e/#00dc8d/#0052ff`; Kindsight warm brand `#faf5f1/#fefffa/#e5e1d6` with CTA `#de7653` and keyline `#e1f079`.
- Type roles: Saans 300/400 display `80px/1/-2.4px`; Inter 400/500/600 display `57px/1.15/-0.0200em`; Times Now 200/300 display 30-120px with `0.78-1` leading and `-0.0640em` at 120px.

Every Light UI build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #fbfcfd;
  --surface: #ffffff;
  --surface-muted: #f2f5f8;
  --text: #111827;
  --text-muted: #667085;
  --line: #dfe4ea;
  --action: #2563eb;
  --action-strong: #1d4ed8;
  --radius-control: 10px;
  --radius-card: 14px;
  --radius-panel: 18px;
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
  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04);
  --shadow-panel: 0 8px 32px rgba(15,23,42,.08);
  --shadow-hero: 0 32px 90px rgba(15,23,42,.12);
  --shadow-modal: 0 24px 80px rgba(15,23,42,.16);
  --shadow-action: 0 6px 18px color-mix(in srgb, var(--action), transparent 72%);
  --status-success-bg: #ecfdf5;
  --status-success-fg: #047857;
  --status-info-bg: #eef4ff;
  --status-info-fg: #3152d4;
  --status-warning-bg: #fffbeb;
  --status-warning-fg: #b45309;
  --status-danger-bg: #fff1f2;
  --status-danger-fg: #b91c1c;
  --status-neutral-bg: #f3f4f6;
  --status-neutral-fg: #667085;
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

| Tailwind default | Light UI token |
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

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `lu`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## First Viewport Protocol

Refero layout deltas:
- Intercom: 4px base, 48px sections, 16px card padding/gap, 4px buttons/nav; pair editorial copy with product module.
- Mintlify: transparent 0px inputs, huge pill buttons, tight docs cards; avoid decorative hero art.
- Kindsight: 1440px max, 40px sections/cards, 12px gaps, 24px cards and 51px inputs.

- **Nav:** quiet but designed. Luma-style nav may be nearly invisible; Lightdash needs sticky product links; Lift-off can embed navigation in panels. No default unstyled nav.
- **H1:** match the source. Luma regular-weight and image-led; Lightdash precise; Circle centered and soft; Control chassis compact and technical; Gallery smaller and object-focused.
- **Hero object:** actual image, app surface, component gallery, docs preview, control module, event cards, or product object.
- **CTA:** visible on white. If pale, use dark text and border; if dark, avoid heavy shadow.
- **Next-section hint:** show an artifact grid, docs panel, table, event cards, control module, or clean card band at the fold.

## Archetype Picker

| Archetype | Layout Behavior | Use For | Required Proof |
| --- | --- | --- | --- |
| Quiet Image-Led Light | Two-column hero, white chrome, vivid image, one dark CTA. | Events, creators, consumer tools. | Real image/object, event cards, time/status badge. |
| Blueprint SaaS Light | Sticky nav, white/lava surfaces, code or data module, violet action. | Analytics, docs, developer-light products. | Code/data preview and interaction chips. |
| Soft Community Glow | Gradient stage with white cards, pill controls, friendly grids. | Communities, learning, collaboration. | White cards remain readable on atmospheric background. |
| Control-Panel Light | Light chassis around dark display modules and red action. | Hardware, games, simulations, dashboards. | Dense modular panels with mono readouts. |
| Artifact Gallery | Grid of cards, file badges, varied radius, subtle shadows. | Component libraries, docs, template galleries. | Inspectable cards with labels, formats, state badges. |
| Productivity Surface | Bright app shell, task list/table, filters, light states. | Tools, dashboards, planners. | Real list/table and focused control toolbar. |

## Signature Components

Refero component deltas:
- Buttons: Intercom 4px button/nav geometry; Mintlify huge pill buttons; Kindsight 10px CTAs and 18px tags.
- Inputs/cards: Mintlify allows transparent/0px fields; Kindsight inputs are 51px rounded and cards 24px; Intercom forms stay minimal with warm line colors.

### Core Component Kit

### Refero Expansion Component Deltas

- Match control curvature to the chosen light shell: AIUC buttons are nearly square at 3px beside 4px cards; Humble buttons are 100px pills beside 30-40px image/card radii; Monad cards are 40px and buttons 100px; Parallel combines 20px cards, 12px buttons, 0px inputs, and 9999px tags.
- Light surfaces need visible but quiet separation: Humble allows `0 30px 30px -2.5px rgba(0,0,0,.03)`, Parallel allows `0 6px 27px rgba(0,0,0,.07)`, and Monad should rely on soft gradient panels and radius before shadow.
- Use mono nav/meta only where the source supports it: ABC Diatype Mono for Monad captions, ABC Diatype Semi-Mono for AIUC nav/meta; do not turn all body copy into mono.

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type LightUiState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type LightUiStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function LightUiStatusPill({ role, children }: { role: LightUiStatus; children: React.ReactNode }) {
  return <span className="light-ui-status-pill" data-role={role}>{children}</span>;
}

export function WhiteAppShellContract({ state = "default" }: { state?: LightUiState }) {
  return <section className="light-ui-hero-object" data-state={state} aria-label="Light UI proof object" />;
}

export function LightDataTableContract({ title, meta, state = "default" }: { title: string; meta: string; state?: LightUiState }) {
  return <article className="light-ui-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function DocsPreviewPanelContract({ items }: { items: string[] }) {
  return <nav className="light-ui-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function LightUiSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="light-ui-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.light-ui-status-pill {
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
.light-ui-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.light-ui-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.light-ui-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.light-ui-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.light-ui-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.light-ui-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.light-ui-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.light-ui-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.light-ui-card[data-state="error"] { border-color: var(--status-danger-fg); }
.light-ui-card > span { font: var(--type-meta); color: var(--text-muted); }
.light-ui-card > strong { font: var(--type-card); color: var(--text); }
.light-ui-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.light-ui-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.light-ui-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.light-ui-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.light-ui-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.light-ui-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.light-ui-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .light-ui-hero-object { min-height: 280px; }
  .light-ui-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### White Chrome App Shell

Use for bright apps and dashboards. It should feel like a light chassis, not a card dropped on a page.

```tsx
type ShellMode = "overview" | "docs" | "gallery" | "control";

export function WhiteChromeShell({ mode = "overview" }: { mode?: ShellMode }) {
  return (
    <section className="light-shell" data-mode={mode}>
      <aside className="light-rail" aria-label="Workspace navigation">
        {["Home", "Files", "Boards", "Settings"].map((item, i) => (
          <button key={item} className="rail-item" data-active={i === 1}>{item}</button>
        ))}
      </aside>
      <main className="light-workspace">
        <header className="workspace-bar">
          <label className="light-search"><span>Search</span><input defaultValue="quarterly launch" /></label>
          <button className="light-primary">Create</button>
        </header>
        <div className="workspace-grid">
          <article className="artifact-card"><b>Landing kit</b><span>24 components</span></article>
          <article className="artifact-card" data-selected="true"><b>Event page</b><span>8 sections</span></article>
          <article className="artifact-card"><b>Docs block</b><span>API sample</span></article>
        </div>
      </main>
    </section>
  );
}
```

```css
.light-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-card, 16px);
  background: var(--surface);
  box-shadow: var(--shadow-light, 0 18px 60px rgba(15,23,42,.08));
}
.light-rail { padding: 12px; border-right: 1px solid var(--line); background: var(--surface-muted); }
.rail-item {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-muted);
  text-align: left;
}
.rail-item[data-active="true"] { background: var(--surface); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); }
.workspace-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; padding: 14px; border-bottom: 1px solid var(--line); }
.light-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface);
}
.light-search span { color: var(--text-muted); font-size: 13px; }
.light-search input { min-width: 0; border: 0; outline: 0; font: inherit; color: var(--text); background: transparent; }
.light-primary { min-height: 42px; border: 0; border-radius: var(--radius-control); background: var(--action); color: var(--action-text); padding: 0 16px; }
.workspace-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 14px; }
.artifact-card { min-height: 132px; border: 1px solid var(--line); border-radius: var(--radius-card); padding: 16px; background: var(--surface); }
.artifact-card[data-selected="true"] { border-color: var(--action); box-shadow: 0 0 0 3px color-mix(in srgb, var(--action), transparent 82%); }
@media (max-width: 780px) {
  .light-shell { grid-template-columns: 1fr; }
  .light-rail { display: flex; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--line); }
  .rail-item { min-width: max-content; }
  .workspace-bar, .workspace-grid { grid-template-columns: 1fr; }
}
```

States: selected uses border/ring, hover uses subtle fill, focus uses visible ring, loading uses skeleton blocks within the same dimensions, empty shell offers an import/create action.

### Docs Preview Panel

Use for Lightdash/Tailark-style pages.

- Left: docs nav with active section and small mono label.
- Center: code/data block with copy button.
- Right or bottom: rendered preview card.
- States: copied, focused line, invalid snippet, loading docs, no search results.
- Mobile: tabs for Docs / Code / Preview rather than three squeezed columns.

### Soft Status Chip

Use chips to show category, state, file type, event date, or control status.

```tsx
export function SoftStatusChip({ tone = "neutral", children }: { tone?: "neutral" | "violet" | "red" | "blue" | "success"; children: React.ReactNode }) {
  return <span className="soft-chip" data-tone={tone}>{children}</span>;
}
```

Rules:

- Neutral: white/gray with border.
- Violet: active or primary interactive state only.
- Red: urgent control-panel state only.
- Blue: informational link/readout.
- Success: use only for real completion, never as decorative green.

### Filter Toolbar

Use for galleries, marketplaces, docs browsers, and productivity views.

- DOM: `form` or `div role="toolbar"` with search, segmented controls, sort menu, reset.
- Include selected count if selecting cards/rows.
- Hover/focus must not resize pills.
- Mobile: horizontal scroll for filter chips plus full-width search.

### Empty State Panel

Light UI empty states should be gentle but useful.

- Include an icon or small visual only when it clarifies the missing object.
- Use direct headline: "No illustrations match 'billing'" or "No events this week."
- Provide one primary action and one secondary recovery.
- Preserve the same white chrome as populated panels; do not make empty states look like marketing cards.

### Light Data Table

Use when a bright app needs density without feeling technical-heavy.

- Header: sticky if scrollable, `#e4e7eb` line, 12-14px labels.
- Rows: 44-52px height, hover fill `#f8fafb` or source soft fill.
- Selected: border/ring or left inset accent. Avoid relying only on row opacity.
- Loading: skeleton cells, same row height.
- Mobile: cards or horizontal scroll with pinned first column.

## State Language

Refero state deltas:
- Intercom active/CTA states use `#0007cb` or `#ff5600`; no third bright color.
- Mintlify success/info/action states map to `#00dc8d/#0052ff/#0c8c5e`; Kindsight selected/highlight states use `#e1f079` or `#de7653`.

```tsx
const lightUIState = {
  idle: "bg-[var(--surface)] text-[var(--text)] border-[var(--line)]",
  hover: "hover:bg-[var(--surface-muted)] hover:border-[color-mix(in_srgb,var(--line),var(--text)_10%)]",
  active: "data-[active=true]:bg-[var(--surface)] data-[active=true]:shadow-[inset_0_0_0_1px_var(--line)]",
  selected: "data-[selected=true]:border-[var(--action)] data-[selected=true]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--action),transparent_82%)]",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action)] focus-visible:ring-offset-2",
  loading: "aria-busy:pointer-events-none aria-busy:cursor-wait",
  disabled: "disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-faint)] disabled:cursor-not-allowed",
  error: "border-[#f43325] bg-[#fff4f2] text-[#7a271a]",
  success: "border-[#00d492] bg-[#ecfdf3] text-[#064e3b]"
};
```

State rules:

- Error should be crisp and readable; red outlines on white need fill or helper copy.
- Disabled states need text contrast; do not drop opacity below legibility.
- For control-panel Light UI, urgent red is semantic and should not be reused for regular hover.
- For gallery Light UI, selected cards need a stable ring, not a scale effect.

## Motion System

Refero motion delta:
- No source-specific durations were observed for Intercom, Mintlify, or Kindsight. Use existing light-ui timing and restrict transitions to color, border, opacity, and small translate; do not animate layout density.

- Keep light UI motion quiet: 150-250ms opacity/transform/color/background, no large parallax by default. Gradients from Monad may drift only as a static hero wash or very slow ambient background, disabled under `prefers-reduced-motion`.

## Complete Page Protocols

```tsx
// Bright App Shell
<main data-skill="light-ui" data-archetype="bright-app-shell">
  <WhiteAppShellContract state="selected" />
  <FilterToolbarContract items={["Active", "Pending", "Archived"]} />
  <LightDataTableContract rows={recordsWithStatusAndOwners} />
  <EmptyStatePanelContract action="Create first record" />
</main>

// Documentation Product
<main data-skill="light-ui" data-archetype="documentation-product">
  <DocsPreviewPanelContract title="API request" meta="copyable example" />
  <WorkflowCardContract title="Install, connect, verify" />
  <SoftStatusChipContract role="success">Synced</SoftStatusChipContract>
</main>
```
```tsx
// Bright App Shell
<main data-skill="light-ui" data-archetype="bright-app-shell">
  <WhiteAppShellContract state="selected" />
  <FilterToolbarContract items={["Active", "Pending", "Archived"]} />
  <LightDataTableContract rows={recordsWithStatusAndOwners} />
  <EmptyStatePanelContract action="Create first record" />
</main>

// Documentation Product
<main data-skill="light-ui" data-archetype="documentation-product">
  <DocsPreviewPanelContract title="API request" meta="copyable example" />
  <WorkflowCardContract title="Install, connect, verify" />
  <SoftStatusChipContract role="success">Synced</SoftStatusChipContract>
</main>
```
Light UI motion should feel like surface mechanics.

| Pattern | Use | Timing | Behavior |
| --- | --- | --- | --- |
| Tab transition | Docs/code/preview, gallery categories, community tabs. | 160-220ms | Crossfade and translate x 6-8px; stable panel height. |
| Row flash | Table update, imported file, event RSVP. | 450-650ms | Pale fill flashes and fades; text changes immediately. |
| Focus pulse | Search, command input, CTA after validation. | 500-700ms | Ring alpha pulse; no scale. |
| Command palette | Productivity or docs search. | 160ms open | Opacity + translateY; trap focus; Escape closes. |
| Table update | Light data table and file list. | 220-320ms | Crossfade cell value, optional subtle left border. |
| Panel open | Inspector, docs preview, filter drawer. | 220ms | Transform overlay or preallocated panel; avoid layout jump. |

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion],
  .light-shell *,
  .artifact-card {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    scroll-behavior: auto !important;
  }
}
```

Avoid generic scroll-fade for every section. Use reveal only when it helps parse surfaces entering a bright page.


## Absolute Bans

- Refero anti-dilution: do not mix Intercom violet/orange, Mintlify green/blue, and Kindsight terra/keylime in one palette; choose one source pack as the action system.
- Do not use 24px Kindsight cards with Mintlify 0px inputs unless the page explicitly separates brand editorial from docs UI.

- No weak white-on-white hierarchy.
- No pale gray text that fails contrast.
- No generic three-card row as the whole identity.
- No gradient spread across every surface when a source uses it for one motif.
- No invisible focus state on white controls.
- No hover lift as the default interaction. If used, keep it tiny and internal.
- No success or error states styled only by color without label text.
- No dark module that swallows the Light UI identity unless control-panel mode is chosen.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Production Patterns

### Navigation

- Luma nav: white background, 52px height, graphite links, one charcoal CTA, optional tiny live-status/time badge. Good for event and creator products.
- Lightdash nav: sticky, white or off-white, visible product links, violet action, subtle border. Good for docs and technical product pages.
- Circle nav: pill controls and soft borders over a glow stage. Good for community and membership.
- Control-panel nav: embedded into the chassis as tabs, toggles, or segmented controls; avoid a separate marketing nav if the interface itself is the hero.
- Gallery nav: compact sticky header with search, category chips, and a version/update note.

### Surface Ladders

- Level 0: page canvas, usually `#ffffff` or `#f8fafb`.
- Level 1: grouped section background, either off-white, glow stage, or light gray chassis.
- Level 2: card/app surface, white with border or subtle shadow.
- Level 3: active or selected surface, using action-tinted ring/fill and stronger text.
- Level 4: dark module, used only for code, display, control, or contrast proof.

### Copy And Labels

Use concrete nouns in labels: "Events", "Files", "Launch kit", "API preview", "Flight telemetry", "Template library". Avoid vague section labels like "Experience" or "Solutions" when a product object can be named. In Light UI, text has to earn contrast because the palette is quiet; every muted label should help users scan, not hide uncertainty.

## Pre-Output Checklist

- First viewport contains a real white app shell or data surface.
- One Light UI archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to light state transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
