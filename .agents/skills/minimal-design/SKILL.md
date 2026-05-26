---
name: minimal-design
description: "Use this skill to create Minimal Design visual design systems that feel essential, restrained, quiet, precise, spacious, intentional. USE FOR: minimal websites, refined portfolios, product pages, calm brand systems, simple tools. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Minimal Design Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Minimal Design archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, single object, quiet index, restrained table, or plain useful form, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Minimal Design components with states.
7. **Motion plan:** minimal state change, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.

## Core Directive

Minimal Design removes decoration, not hierarchy. It should make a product, service, or workflow easier to understand because every remaining visual element has a job: type, spacing, alignment, neutral surfaces, one accent role, proof, and state clarity.

Use it for product-led landing pages, simple tools, refined portfolios, AI/SaaS surfaces, finance or analytics pages, infrastructure products, serious B2B, calm onboarding, pricing, forms, and dashboards that need restraint without becoming empty.

Do not confuse minimal with blank. A minimal page still needs a visible product category, a primary action, proof, states, and enough structure to scan.

## Non-Negotiable Principles

- Remove decoration only after the product, portfolio, or workflow remains clear.
- Alignment, measure, rhythm, and evidence replace cards, gradients, and ornamental UI.
- A minimal page still needs visible navigation, states, actions, and mobile hierarchy.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Low-medium. Sparse but complete. |
| motion | Low. Quick fades, subtle reveals, precise hover state. |
| decoration | Very low. Only type, alignment, image, line, and spacing. |
| contrast | Quiet but accessible. |
| radius | 0-8px, chosen once and repeated. |
| type | One excellent sans or serif plus disciplined scale. |
| assets | One or two strong images, product object, simple diagrams, precise icons. |


## Signature System

- Essential Composition: each section has one dominant idea and one precise supporting rhythm.
- Alignment As Ornament: grids, margins, and baselines create the visual interest.
- Silence With Proof: product or portfolio evidence appears clearly, not as decorative filler.
- Tiny Palette, Big Discipline: neutral base with one accent or no accent.

## Source Archetypes

Pick one primary archetype. Do not mix all five.

### Additional Refero Source Packs

- Factory industrial minimum: `#020202/#eeeeee/#fafafa/#b8b3b0/#3d3a39/#a49d9a`, alert `#ef6f2`; Geist and Geist Mono, display `60px/1/-2.88px`; 4px base, 72px sections, 16px cards, 4px gaps; cards 6px, buttons 4px, header 0px. Use as minimalism by exposed structure, not by empty whitespace.
- Mintlify docs minimum: `#ffffff/#000000/#08090a/#f2f2f2/#dddddd`, action `#0c8c5e`, green `#00dc8d`, blue `#0052ff`; Inter 400/500/600, display `57px/1.15/-0.0200em`, heading `40px/1.1`, body `16px/1.5`; transparent 0px inputs, very large pill buttons, 13px labels with `0.0500em`.
- Revenuecat precise white architecture: `#ffffff/#f9f9fb/#1f1f47/#576cdb/#171a1c/#3d3d5c/#6c7693/#abb6ed/#eaedf6`; Object Sans 100-700 with 80px display at `-0.0700em`, Helvetica Neue 300-500 body; 1216px max, 120px sections, 24px cards, 20px gaps; cards 0px, images/general 16px, buttons 9999px, elevated shadow `rgba(71,92,133,.25) 0 4px 20px, rgba(144,138,208,.1) 0 30px 60px`.
- State transfer: Factory alert state is only `#ef6f2`; Mintlify focus/action uses `#0c8c5e` with success `#00dc8d`; Revenuecat hover/focus can tint borders `#abb6ed/#eaedf6` while disabled copy stays `#6c7693`.

- Programa architectural minimal: `#1a1a1a/#ffffff/#a3a3a3`, note `#fbff2b`; Neue Haas Grotesk Text 400/500; display `42px/1.1/-1.26px`; 6px base, 96px sections, 12px cards/gaps; cards 16px, controls/nav 10px; no heavy shadows.
- AIUC institutional minimal: `#ffffff/#000000/#1a1a1a/#323232/#707070/#d3dfeb/#eddfab`; Almarai 300, ABC Diatype body, ABC Diatype Semi-Mono nav/meta; display `40px/1.3/-0.8px`; 40px sections, 16px cards, 10px gaps; buttons 3px, cards 4px, pills 1000px.
- Monotype resource minimal: `#1e242c/#1a73e8/#576579/#fff/#e7eaee/#cfd5dd`; 8px base, 104px sections, radius 8px, images 16px; soft resource shadow only.
- Silencio achromatic minimal: `#FFFFFF/#000000/#DBDAD9/#808080`; card padding 29px, element 6-14px; cards 7.2px, buttons 129.6px; no heavy shadow.
- Plain precise software minimal: keep neutral fields, sans authority, compact product proof, thin borders, and exact spacing; no saturated decoration outside the selected action token.

### 1. Architectural Minimal Authority

Source basis: General Intelligence Company.

Use for AI companies, research labs, advanced technology, executive B2B, and sophisticated product launches where a single atmospheric opening can carry ambition.

Raw signals:

- Dark hero: `#1f1f29`.
- Accent blue: `#0081c0`.
- Main content: near-white and warm off-white.
- Ink: near-black.
- Soft shadow: `rgba(0,0,0,.08)` stacks.
- Hero overlay: `rgba(222,226,222,.16)`.
- Body max width: about `1200px`.
- Structure: full-bleed dark hero, then contained light sections.
- Layout: two-column text/image sections, centered emphasis stacks, compact sticky top bar.
- Type: restrained serif for major headings, clean sans for body/UI.

Carry forward:

- One atmospheric dark hero is enough.
- Body sections must become calm, architectural, and product-led.
- Blue is role-based: active, featured, key link, not decoration.
- Soft translucent layers can add depth, but only in the hero or controlled proof.
- Imagery should explain ambition or product logic, not decorate.

Avoid:

- Multiple atmospheric dark sections.
- Blue scattered across icons, badges, headings, and links.
- Heavy cards.
- Large decorative gradients in body sections.
- Dense UI with no whitespace.
- Imagery that replaces product explanation.

Mini token pack:

```css
:root {
  --min-hero: #1f1f29;
  --min-canvas: #ffffff;
  --min-canvas-soft: #f9faf7;
  --min-ink: #171717;
  --min-text-secondary: #444141;
  --min-rule: rgba(0,0,0,.08);
  --min-accent-action: #0081c0;
  --min-hero-overlay: rgba(222,226,222,.16);
  --min-radius-card: 12px;
}
```

### 2. White Canvas Thoughtful Function

Source basis: Sprig.

Use for B2B SaaS, customer research, analytics, feedback, AI insight, and soft product pages that should feel clear and warm without being decorative.

Raw signals:

- Base/surface: `#ffffff`.
- Warm canvas: `#fff7ed`.
- Headings: `#0f172a`.
- Body: `#64748b`.
- Tertiary: `#94a3b8`.
- Border: `#e2e8f0`.
- CTA charcoal: `#272420`.
- Ghost border: `#e8e7e6`.
- Atmospheric gradients: peach/pink/yellow, pale mauve, sea mist. Use in showcase or background warmth only.
- Large radii on imagery/cards.
- Pattern: air outside modules, density inside modules.

Carry forward:

- Soft minimal is still structured: product modules, clear hierarchy, and readable surfaces.
- Gradients are atmosphere, never functional state.
- Deep navy grounds the warm canvas.
- CTAs stay charcoal or neutral.
- Product cards and screenshots carry proof.

Avoid:

- Saturated functional colors.
- Pastel text.
- Weak CTA contrast.
- Gradients used as the main identity.
- Dark full sections beyond small contrast moments.
- Empty page spacing with no proof.

Mini token pack:

```css
:root {
  --min-canvas: #fff7ed;
  --min-surface: #ffffff;
  --min-ink: #0f172a;
  --min-body: #64748b;
  --min-muted: #94a3b8;
  --min-rule: #e2e8f0;
  --min-action: #272420;
  --min-action-on: #ffffff;
  --min-ghost-rule: #e8e7e6;
  --min-radius-media: 20px;
}
```

### 3. High-Contrast Precision Blueprint

Source basis: Standards.

Use for design systems, standards/docs, precision brands, product pages needing authority, technical reference, and hard minimal interfaces.

Raw signals:

- Canvas ice: `#eaeaea`.
- Ink: `#000000`.
- Muted: `#a1a1a1`.
- Divider: `#d7d7d7`.
- Action orange: `#ff2e00`.
- Type: Soehne-like sans only.
- Weights: `400`, `600`.
- Display: about `52px`.
- Body: about `20px`.
- Captions: `10-14px`.
- Letter spacing: about `-0.01em` everywhere.
- Section rhythm: about `46px`.
- Cards: `0px` radius, no shadow.
- Buttons: `4px` radius.
- Ghost cards: top/left hairlines.
- Layout: full-width black block for product/video/showcase, six-column or multi-column grids.

Carry forward:

- Flatness is the point: no shadows, no gradients, no softness.
- One orange accent for primary action and critical signal.
- Borders are structure: top/left hairlines, section dividers, grid lines.
- Typography must be exact and limited.
- Imagery is direct product evidence, usually screenshots on simple backgrounds.

Avoid:

- Extra colors.
- Rounded card softness.
- Shadows.
- Decorative gradients.
- Font mixing.
- Inconsistent tracking.
- Wide illustrative scenes.

Mini token pack:

```css
:root {
  --min-canvas: #eaeaea;
  --min-ink: #000000;
  --min-muted: #a1a1a1;
  --min-rule: #d7d7d7;
  --min-action: #ff2e00;
  --min-action-on: #ffffff;
  --min-radius-button: 4px;
  --min-radius-card: 0px;
  --min-space-section: 46px;
}
```

### 4. Analytical Blueprint On Pure White

Source basis: Rox.

Use for finance, analytics, AI ops, B2B data products, and pages where huge type can coexist with compact, serious UI.

Raw signals:

- Page canvas: `#f5f5f4`.
- Surface: `#ffffff`.
- Blueprint blue: `#0b64e9`.
- Primary text: `#0c0a09`.
- Secondary: `#1c1917`.
- Subtle copy: `#57534d`.
- Muted: `#a6a09b`.
- Soft containers: `#ececea`.
- Borders/forms: `#f0efef`.
- Status red: `#f24149`.
- Status orange: `#f97006`.
- Status yellow: `#f9b703`.
- Status violet: `#6b4aff`.
- Hero display: FH Total Display or Playfair Display fallback.
- Hero sizes: `106px`, `183px`, line-height `0.8`.
- Body/UI: Geist or Inter fallback, `14-28px`, tracking near `-0.02em`.
- Base unit: `4px`.
- Card padding: `16px`.
- Element gap: `4-16px`.
- Radius: `6px` default, `8px` buttons, `12px` large, `100px` pills.
- Shadows: minimal `0px/1px/2px` only.

Carry forward:

- Huge type can be minimal if everything else is restrained.
- Blue is CTA and active state only.
- Data status colors stay tiny and semantic.
- Neutral hierarchy ranks information before color does.
- Product screenshots, tables, and metrics should be readable.

Avoid:

- Multiple saturated primary accents.
- Generic system font hero.
- Heavy shadows.
- Color-coded hierarchy everywhere.
- Too many radii.
- Decorative imagery.

Mini token pack:

```css
:root {
  --min-canvas: #f5f5f4;
  --min-surface: #ffffff;
  --min-ink: #0c0a09;
  --min-text-secondary: #1c1917;
  --min-text-subtle: #57534d;
  --min-muted: #a6a09b;
  --min-fill-subtle: #ececea;
  --min-rule: #f0efef;
  --min-action: #0b64e9;
  --min-radius-default: 6px;
  --min-radius-button: 8px;
  --min-radius-pill: 100px;
}
```

### 5. Strategic Polished Steel

Source basis: Copy.

Use for AI workflow products, enterprise SaaS, conversion pages, sales/marketing platforms, and structured B2B pages where a vivid action accent is acceptable.

Raw signals:

- Canvas/card/input: `#f6fafb`.
- Ink: `#171717`.
- Body: `#5d5d5d`.
- Border: `#e4edf1`.
- Button border/highlight: `#e2e8eb`.
- Violet action: `#693edf`.
- Deep violet: `#3b0d96`.
- Soft violet: `#c1b9f4`.
- Display: ABC Normal or Montserrat fallback.
- Display weights: `500/600`.
- Display sizes: `24-88px`.
- Display tracking: `-0.02em` at `48px+`.
- Functional text: Inter, weights `400-700`.
- Base unit: `4px`.
- Section gap: `72px`.
- Card padding: `30px`.
- Element gap: `16px`.
- Radius: strict `4px`.
- No shadows; depth from background and spacing.

Carry forward:

- Strict `4px` radius creates identity.
- Violet is action, active nav, process emphasis.
- Inputs can blend into canvas if border and label are clear.
- Strong headings plus muted body create hierarchy.
- Minimal can still convert without card shadows.

Avoid:

- Violet body text.
- Extra accents.
- Shadows for elevation.
- More radii.
- Inter for all major headlines.
- Off-grid spacing.
- Decorative illustrations competing with process clarity.

Mini token pack:

```css
:root {
  --min-canvas: #f6fafb;
  --min-surface: #f6fafb;
  --min-ink: #171717;
  --min-body: #5d5d5d;
  --min-rule: #e4edf1;
  --min-rule-strong: #e2e8eb;
  --min-action: #693edf;
  --min-action-deep: #3b0d96;
  --min-action-soft: #c1b9f4;
  --min-radius: 4px;
  --min-space-section: 72px;
}
```

## Differentiation

Use Minimal Design when minimal websites, refined portfolios, product pages, calm brand systems, simple tools. If removing the object, index, or restrained proof table, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `editorial-minimal` for authored publication rhythm; use this when essential structure, object proof, and quiet utility are the identity.
## Semantic Token Model

Use semantic tokens, not source-color copies.

```css
:root {
  --canvas: #ffffff;
  --canvas-alt: #f6fafb;
  --surface: #ffffff;
  --surface-subtle: #f0efef;
  --surface-inverse: #171717;
  --text-primary: #171717;
  --text-secondary: #5d5d5d;
  --text-muted: #a1a1a1;
  --text-inverse: #ffffff;
  --rule-subtle: #e4edf1;
  --rule-strong: #d7d7d7;
  --action-primary: #171717;
  --action-accent: #693edf;
  --focus-ring: #171717;
  --state-error: #a83232;
  --state-warning: #9a5b00;
  --state-success: #2f5d46;
  --radius-control: 4px;
  --radius-card: 8px;
  --radius-media: 12px;
  --radius-pill: 9999px;
  --space-section: 72px;
  --space-module: 24px;
  --space-control: 12px;
  --motion-fast: 140ms;
  --motion-base: 220ms;
  --motion-slow: 420ms;
  --ease-minimal: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Rules:

- Start with neutrals, then choose one accent role.
- Do not reuse the accent for headings, icons, links, charts, and buttons at once.
- Semantic colors are not brand colors. Keep them small and local.
- Every neutral must have a job: muted text, border, subtle fill, disabled, hover, selected.

### Execution Token Contract

Refero ready-to-use deltas from Factory/Mintlify/Revenuecat:
- Token roles: Factory `#020202/#eeeeee/#fafafa/#b8b3b0/#3d3a39/#a49d9a` with alert `#ef6f2`; Mintlify `#ffffff/#000000/#08090a/#f2f2f2/#dddddd` with action/success/info `#0c8c5e/#00dc8d/#0052ff`; Revenuecat `#ffffff/#f9f9fb/#1f1f47/#576cdb/#6c7693/#abb6ed/#eaedf6`.
- Type roles: Geist/Geist Mono `60px/1/-2.88px`, Inter `57px/1.15/-0.0200em`, Object Sans 80px at `-0.0700em` plus Helvetica Neue body.

Every Minimal Design build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #faf9f6;
  --surface: #ffffff;
  --surface-muted: #f1efea;
  --text: #151515;
  --text-muted: #6b6760;
  --line: #ded9cf;
  --action: #151515;
  --action-strong: #000000;
  --radius-control: 6px;
  --radius-card: 8px;
  --radius-panel: 10px;
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
  --shadow-card: inset 0 0 0 1px var(--line);
  --shadow-panel: inset 0 0 0 1px var(--line);
  --shadow-hero: none;
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
  --status-neutral-fg: #6b6760;
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

| Tailwind default | Minimal Design token |
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

Token rule: if a value can be expressed by `md`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.

## Typography

Refero typography deltas:
- Factory: Geist display `60px/1/-2.88px`, Geist Mono labels 12-18px.
- Mintlify: Inter display `57px/1.15/-0.0200em`, heading `40px/1.1`, body `16px/1.5`.
- Revenuecat: Object Sans 100-700 for 80px display, Helvetica Neue 300-500 for body.

Minimal Design lives or dies by type discipline.

Additional type references: Neue Haas Grotesk Text 400/500 for Programa, Almarai 300 plus ABC Diatype for AIUC, Diatype/Geist for neutral systems, and `SuisseIntl 10-188px` only for source-specific large display. Use one display family and one UI family max.

Roles:

- Display: hero or major statement. Usually `52-88px`, sometimes `106-183px` for analytical hero.
- Section heading: `28-56px`.
- Card heading: `20-32px`.
- Body: `16-20px`, line-height `1.45-1.65`.
- Compact UI: `13-15px`, line-height `1.2-1.45`.
- Caption/metadata: `10-14px`, readable, not decorative.
- Optional display face: use sparingly; body/UI should remain practical.

Type modes:

- Single sans precision: Soehne-like or Geist-like, two to three weights, strict tracking.
- Serif display plus sans body: use for authority, finance, AI leadership, or architectural pages.
- Custom display plus Inter UI: use for enterprise conversion, but do not default every heading to Inter.
- Navy/charcoal soft SaaS: use deep text, not low-contrast gray.

Guidelines:

- Tune tracking; avoid browser-default large headings.
- Do not use too many font weights.
- Keep body copy darker than many minimal templates do.
- Use `text-wrap: balance` carefully on headings, not on long paragraphs.
- Control measure: body `58-72ch`, lead `44-60ch`, compact UI shorter.

## Layout And Density

Refero layout deltas:
- Factory: 4px base, 72px sections, 16px cards, 4px gaps, 6px cards, 4px buttons.
- Mintlify: transparent 0px inputs, pill buttons, compact docs rows.
- Revenuecat: 1216px max, 120px sections, 24px cards, 20px gaps, 0px cards, 16px images, 9999px buttons.

Minimal design needs a clear spatial idea.

Density modes:

- Compact precision: section `24-48px`, card padding `12-16px`, element gap `4-12px`, radius `0-6px`.
- Comfortable SaaS: section `64-80px`, card padding `24-32px`, element gap `12-20px`, radius `8-16px`.
- Architectural spacious: section `96-140px`, module padding `32-80px`, few cards, large proof object.

First viewport:

- Must state product/category clearly.
- Must show proof: product UI, screenshot, metric, form, workflow, diagram, object, or table.
- Must have one obvious primary action.
- Must reveal the next section's structure at the bottom.
- Avoid announcement badges unless they contain concrete proof.

Grid principles:

- Use alignment as ornament.
- Use borders and spacing before shadows.
- Keep controls near the content they affect.
- Repeated modules need stable dimensions.
- Cards are for real grouping, not default section styling.

## Component Signatures

Refero component deltas:
- Factory: dense grid cards, 4px tool controls, alert `#ef6f2` only for state/action.
- Mintlify: 0px inputs, large pill buttons, 13px labels with `0.0500em`.
- Revenuecat: 0px cards, 16px images, elevated proof shadow `rgba(71,92,133,.25) 0 4px 20px, rgba(144,138,208,.1) 0 30px 60px`.

Use at least four for full page/app work.

### Refero Expansion Component Deltas

- Minimal radius is not arbitrary: Programa 10/16px, AIUC 3/4/1000px, Monotype 8/16px, Silencio 7.2/129.6px. Pick one source geometry and apply it to nav, inputs, buttons, and cards.
- Shadows are usually banned: Programa and Silencio stay flat; Monotype permits only a soft resource shadow; AIUC relies on border and fill. If a shadow is not source-specific, remove it.
- Product proof needs real content: resource list, article index, product screenshot, architecture grid, or form module. Do not fill whitespace with decorative cards.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type MinimalDesignState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type MinimalDesignStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function MinimalDesignStatusPill({ role, children }: { role: MinimalDesignStatus; children: React.ReactNode }) {
  return <span className="minimal-design-status-pill" data-role={role}>{children}</span>;
}

export function SingleObjectHeroContract({ state = "default" }: { state?: MinimalDesignState }) {
  return <section className="minimal-design-hero-object" data-state={state} aria-label="Minimal Design proof object" />;
}

export function MinimalIndexRowContract({ title, meta, state = "default" }: { title: string; meta: string; state?: MinimalDesignState }) {
  return <article className="minimal-design-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function QuietFeatureLineContract({ items }: { items: string[] }) {
  return <nav className="minimal-design-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function MinimalDesignSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="minimal-design-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.minimal-design-status-pill {
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
.minimal-design-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.minimal-design-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.minimal-design-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.minimal-design-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.minimal-design-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.minimal-design-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.minimal-design-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.minimal-design-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.minimal-design-card[data-state="error"] { border-color: var(--status-danger-fg); }
.minimal-design-card > span { font: var(--type-meta); color: var(--text-muted); }
.minimal-design-card > strong { font: var(--type-card); color: var(--text); }
.minimal-design-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.minimal-design-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.minimal-design-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.minimal-design-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.minimal-design-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.minimal-design-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.minimal-design-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .minimal-design-hero-object { min-height: 280px; }
  .minimal-design-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Single Object Hero

Purpose: first identity signal plus product proof.

Structure:

- Exact headline, short proof line, primary action, secondary link if needed.
- One product object: screenshot, app shell, object photo, diagram, table, or form.
- Open canvas, no hero card around everything.
- Product frame has stable aspect ratio.

States:

- CTA hover/focus/active.
- Loading proof frame.
- Mobile no-overlap layout.

### Minimal Index Row

Purpose: list projects, features, changelog, integrations, workflows, or cases without card noise.

Structure:

- Columns for label, title, supporting detail, status/action.
- Top/bottom rules.
- Stable row height.
- Mobile stacks metadata above title.

States:

- Hover: rule darkens or title underlines.
- Selected: left rule or subtle fill.
- Empty/error/loading rows preserve layout.

### Quiet Feature Line

Purpose: explain capability with less chrome than feature cards.

Structure:

- One line title, one supporting sentence, optional proof metric or icon.
- Use a rule, not a shadow.
- Align to product proof or section label.

States:

- Hover/focus for navigable lines.
- Disabled/unavailable line stays readable with reason.

### Simple Control Bar

Purpose: filters, tabs, sorting, mode switching, dashboard controls.

Structure:

- Segmented, underlined, or bordered controls depending on radius stance.
- Selected state is obvious without color alone.
- Controls have fixed height, usually `36-48px`.

States:

- Hover, focus, selected, disabled, loading.
- Error if data-dependent filters fail.

### Restrained Card

Purpose: repeated modules where grouping is real: pricing, metrics, product feature, plan, integration.

Structure:

- Defined title, body, data/proof, action or status.
- Border or subtle fill; shadow only in archetypes that permit it.
- Padding follows density mode.

States:

- Hover: border/fill change, not layout movement.
- Selected: stronger border or accent edge.
- Loading/empty/error/success inside same frame.

### Minimal Form

Purpose: input, validation, purchase, signup, configuration, onboarding.

Structure:

- Visible labels.
- Helper text explains consequence.
- Inputs have contrast and focus.
- Submit width remains stable when loading.

States:

- Focus: accent or ink ring.
- Error: border plus message.
- Success: text confirmation or rule, not confetti.
- Disabled: readable label and clear unavailable reason.

### Product Proof Table

Purpose: specs, pricing comparison, analytics, integrations, status, changelog.

Structure:

- Compact header labels.
- Numeric/data alignment.
- Row dividers.
- Mobile horizontal strategy or stacked rows.

States:

- Sort, selected row, loading skeleton, empty, error.
- Use semantic status colors only in small marks.

### Spare Footer

Purpose: closure with useful navigation.

Structure:

- Repeat radius, type, and rule logic.
- Include primary contact/action, useful links, legal, and one short proof/reassurance line.
- Avoid dumping every site link.

## State Patterns

Refero state deltas:
- Factory alert state is only `#ef6f2`; Mintlify focus/action/success `#0c8c5e/#00dc8d`; Revenuecat hover/focus borders `#abb6ed/#eaedf6`, disabled copy `#6c7693`.

Minimal states should clarify action with the smallest effective change.

Preferred vocabulary:

- Hover: border darkens, underline appears, fill changes one neutral step.
- Focus: visible ring or outline using action/ink token.
- Active/pressed: slight inversion or darker fill.
- Selected: accent edge, stronger border, or neutral fill.
- Disabled: lower contrast plus unchanged layout; never unreadable.
- Loading: fixed skeleton, spinner only if useful.
- Empty: direct copy plus next action.
- Error: red or warm rule plus message.
- Success: confirmation text, check icon, or darker rule; no generic colored palette.

Example:

```css
.min-button {
  min-block-size: 44px;
  border: 1px solid var(--action-primary);
  background: var(--action-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-control);
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
}
.min-button:hover,
.min-button:focus-visible {
  background: var(--action-accent);
  border-color: var(--action-accent);
}
.min-row[aria-selected="true"] {
  border-left: 2px solid var(--action-accent);
  background: var(--surface-subtle);
}
.min-field[aria-invalid="true"] {
  border-color: var(--state-error);
}
.min-message[data-kind="success"] {
  color: var(--text-primary);
  font-weight: 500;
}
```

## Motion Grammar

Refero motion delta:
- No source-specific duration was observed for Factory/Mintlify/Revenuecat. Use existing minimal timing; motion must be border/fill/opacity, not decorative reveal.

- Minimal motion is a state aid: 120-220ms color/border/opacity, 180-260ms small panel reveal, no bounce and no parallax. Reduced motion removes translate while preserving selected borders and focus rings.

## Complete Page Protocols

```tsx
// Single Object Landing
<main data-skill="minimal-design" data-archetype="single-object-landing">
  <SingleObjectHeroContract title="One clear product" />
  <QuietFeatureLineContract title="What changes" meta="one sentence" />
  <CaptionedImageContract src={productImage} />
  <PlainFormContract fields={["email", "message"]} />
</main>

// Quiet Index Tool
<main data-skill="minimal-design" data-archetype="quiet-index-tool">
  <MinimalIndexRowContract title="Entry 001" meta="date / owner / state" />
  <SimpleControlBarContract items={["Sort", "Filter", "Export"]} />
  <RestrainedCardContract title="Decision" meta="useful proof, not filler" />
</main>
```
```tsx
// Single Object Landing
<main data-skill="minimal-design" data-archetype="single-object-landing">
  <SingleObjectHeroContract title="One clear product" />
  <QuietFeatureLineContract title="What changes" meta="one sentence" />
  <CaptionedImageContract src={productImage} />
  <PlainFormContract fields={["email", "message"]} />
</main>

// Quiet Index Tool
<main data-skill="minimal-design" data-archetype="quiet-index-tool">
  <MinimalIndexRowContract title="Entry 001" meta="date / owner / state" />
  <SimpleControlBarContract items={["Sort", "Filter", "Export"]} />
  <RestrainedCardContract title="Decision" meta="useful proof, not filler" />
</main>
```
Motion is useful only when it clarifies sequence, feedback, or focus.

Allowed primitives:

- Border draw on links, cards, tabs.
- Control indicator slide.
- Product object crop/reveal.
- Minimal text reveal for one hero or section title.
- Accordion height with measured duration.
- Table row highlight.
- Inversion swap for primary action.

Timing:

- Hover: `100-180ms`.
- Controls: `160-240ms`.
- Panel reveal: `180-280ms`.
- Product proof reveal: `320-520ms`.

CSS primitive:

```css
.min-border-link {
  position: relative;
  text-decoration: none;
}
.min-border-link::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  inset-block-end: -3px;
  block-size: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}
.min-border-link:hover::after,
.min-border-link:focus-visible::after {
  transform: scaleX(1);
}
.min-proof {
  overflow: hidden;
}
.min-proof > img,
.min-proof > video {
  transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
}
.min-proof:hover > img,
.min-proof:focus-within > img {
  transform: scale(1.018);
}
@media (prefers-reduced-motion: reduce) {
  .min-border-link::after,
  .min-proof > img,
  .min-proof > video {
    transition-duration: .01ms !important;
    transform: none !important;
  }
}
```

Avoid:

- Constant background motion.
- Decorative floating shapes.
- Bouncy CTAs.
- Motion that makes minimalism feel playful by accident.
- Generic fade-up repeated down the page.


## Absolute Bans

- Refero anti-dilution: do not mix Factory alert pink, Mintlify green/blue, and Revenuecat violet-blue as peer accents.
- Do not add shadows except the explicit Revenuecat proof shadow; Factory and Mintlify remain mostly flat.

- No default typography and whitespace labeled as design.
- No empty pages because decisions were avoided.
- No hidden controls required for actual use.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`. For expanded implementation examples, load `references/advanced-implementation-notes.md` only after the archetype and token pack are chosen.

## Anti-Slop Rules

Reject:

- Empty white page with no product proof.
- Low-contrast gray body text.
- Generic SaaS blue unless the archetype supports blue action.
- Accent color on every icon and link.
- Floating cards everywhere.
- Nested cards.
- Heavy shadows.
- Default Inter without tuning.
- Placeholder-only hero visuals.
- Decorative gradients pretending to be minimalism.
- Hidden CTAs.
- Forms with placeholders instead of labels.

Repair:

- If it feels empty, add proof, product details, or a useful table.
- If it feels generic, choose a stricter accent role, radius stance, and type model.
- If it feels cold, warm the canvas or improve copy before adding color.
- If it feels cluttered, convert decorative cards into rows and reduce duplicate CTAs.
- If it feels inaccessible, darken body text, increase tap targets, strengthen focus states.

## Pre-Output Checklist

- First viewport contains a real object, index, or restrained proof table.
- One Minimal D
