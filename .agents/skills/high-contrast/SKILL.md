---
name: high-contrast
description: "Use this skill to create stark, readable, high-impact visual identities based on black-white tension, disciplined accent color, sharp layout, poster-like hierarchy, editorial drama, or precise data-console contrast. Use it for brand sites, launch pages, fashion/editorial experiences, technical products, AI tools, portfolios, and interfaces that need immediate visual authority without visual mush. USE FOR: stark brand sites, editorial product pages, technical consoles, monochrome pages, bold launch pages. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# High Contrast Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one High Contrast archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, inverted poster, hard-edge product proof, data table, or polarity surface, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete High Contrast components with states.
7. **Motion plan:** inversion, border, or polarity transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Build High Contrast as a disciplined black/white system with immediate readability, sharp hierarchy, and a locked accent job. This is not merely "make it black and white." It is a structural language: hard section changes, stark foreground/background tension, poster-scale typography, strong borders, decisive inversion, and accessible states that remain clear without decorative effects.

Use this skill for stark brand sites, launch pages, fashion/editorial experiences, technical products, AI tools, portfolios, monochrome dashboards, and interfaces that need visual authority without mush.


For substantial work, output a compact `<design_plan>` block:

1. Use case, audience, primary action, and desired intensity.
2. Archetype selected from this skill.
3. Polarity system: black-on-white, white-on-black, alternating bands, or console contrast.
4. Accent job lock: the one role the accent is allowed to perform.
5. First viewport: nav, H1 line strategy, proof object, CTA, next-section hint.
6. Component plan: at least four signature components with states and mobile behavior.
7. Accessibility plan: focus, hover, selected, disabled, error, and contrast states.
8. Anti-slop sweep: top three failure modes and how to avoid them.

For small fixes, keep this plan internal.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium-high. Poster blocks and dense data sections can coexist. |
| motion | Medium. Hard cuts, inversion, wipes, and snap reveals. |
| decoration | Low-medium. Lines, blocks, type scale, and accent marks do the work. |
| contrast | Maximum. Black/white or near black/near white with one accent. |
| radius | 0-4px generally; pills only if intentionally contrasted. |
| type | Bold grotesk, condensed sans, mono data, or dramatic editorial serif. |
| assets | High contrast photography, product silhouettes, technical diagrams, poster crops. |

## Signature System

- Poster Authority: huge type and hard section boundaries replace decorative art.
- Accent Job Lock: accent can mean action, warning, price, or selection, but only one role.
- Inversion State System: hover/focus/active often invert foreground and background.
- Blueprint Or Fashion Fork: choose data-console precision or editorial drama; do not average them.

## Differentiation

Use High Contrast when stark brand sites, editorial product pages, technical consoles, monochrome pages, bold launch pages. If removing the inverted poster, table, or hard-edge proof, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `monochrome-ui` for reduced operational systems; use this when stark poster tension and inversion are the identity.
## Non-Negotiable Principles

- Black and white are the system. Gray is supporting structure, not the main identity.
- Accent color must have one locked job: action, warning, data highlight, brand mark, or selection.
- Do not use unsafe `filter: invert(1)` on whole sections, images, logos, icons, or user content. Inversion must be deliberate via tokens or asset variants.
- Contrast must improve usability, not create eye strain. Use spacing, hierarchy, and rhythm.
- Borders, rules, and section cuts are design material.
- States must remain accessible in forced-colors/high-contrast scenarios.
- High Contrast is not the same as Cyber Neon: no glow dependency, no scanline atmosphere, no luminous accent sprawl.


## Black/White Systems

Choose one polarity model:

### Black Stage, White Content

Use for launches, editorial drama, fashion, AI labs, and stark brand pages.

- Page background black.
- White text and white rules.
- Cards can be black with white border, or white slabs as moments of interruption.
- Accent reserved for CTA or one data/path signal.
- Images should be high-quality and not disappear into the background.

### White Stage, Black Structure

Use for technical products, portfolios, documents, catalogs, and crisp SaaS pages.

- Page background white.
- Black typography, rules, nav, and CTA.
- Gray only for secondary labels, disabled states, and subtle dividers.
- Accent appears sparingly as status/action.
- Layout must have enough rhythm to avoid feeling like raw wireframe.

### Alternating Polarity Bands

Use for long landing pages and editorial flows.

- Sections alternate black/white or white/black.
- Components adapt by token, not by `filter: invert`.
- Each band has a clear content role: hero, proof, details, pricing, FAQ, close.
- CTAs preserve hierarchy across polarity changes.

### Data Console Contrast

Use for dashboards, developer tools, AI tools, and infrastructure.

- Dark or light base, but data tables and panels are sharply separated.
- Status colors are semantic and minimal.
- Focus, selected, row hover, and errors are unmistakable.
- Density is higher, but not at the cost of legibility.

## Raw-Derived Archetypes

### Additional Refero Source Packs

- 099 absolute contrast index: `#000000/#1d1d1d/#383838/#888888/#ffffff`; Soehne Mono 400 16px, leading `1/1.2/1.4`, `0.24px` tracking; 1600px max, 48px sections, 16px gaps, 26.5px info padding; 0px default, 10px controls/cards, `1px #383838` ghosts.
- Factory industrial contrast grid: `#020202/#eeeeee/#fafafa/#b8b3b0/#3d3a39/#a49d9a`, alert `#ef6f2`; Geist/Geist Mono, display `60px/1/-2.88px`; 4px base, 72px sections, 16px cards, 4px gaps, 6px cards, 4px buttons. Use alert only for state/action.
- (dot)connect high-contrast parchment: `#001011/#fd5321/#0f1e1f/#007aff/#fcfbf8/#c1c4c2/#ededea`; AeonikPro 16/18/21/24/32/36/72/101px, DotConnect 19/24/36/73px; 48px sections, 24px gaps, cards 20px, buttons 24px, badges 8px.

- Ciridae black-white system: `#000000/#0B0B0B/#272A2A/#858585/#CECECE/#FFFFFF`, rare accent `#CC6437`, gradient `linear-gradient(rgb(255,255,255), rgba(206,206,206,.5))`; Pragmatica Cond 400, Pragmatica 400, Roboto Mono 400; scale 11/14/20/24/32/62, line-height 1.1/1/1.05/1.2/1.1/1.43, tracking `-0.02em`; 4px base, 48px sections, 4px elements; radii 4/10/1440px; no shadows.
- Moving Parts maximal contrast: `#000000/#ffffff/#121212/#bcc1c7/#efefef/#b3b3b3/#999999`, CTA `#0000ff`, accent `#00d37c`, conic spectrum; Whyte Semi-Mono, Unica77, PP Neue Montreal, Druk XXCondensed; scale 17/21/27/60/98/248 with tight 98px tracking `-2.94px`; 4px base, 40px sections, 30px cards, 13px gaps; radii 0/2.5/14/18/90.3833/106.333px.
- Speakeasy hard accent: neutral foundation with rainbow only as a structural top border/divider; buttons can use extreme pill values from source (`1.67772e+07px`) when matching the source, never as casual decoration.
- Hyperstudio black studio: black canvas with luminous chromatic media edges; attach color to proof media, not text blocks.
- Titan technical poster: monochrome authority, strong type scale, sharp proof panels, and semantic action contrast; accent is action/status only.

### Colab Black Launch Slab

Use for bold launch pages and technical brand statements. The raw signal is full-bleed black canvas, white type, sharp corners, and a red accent used as a purposeful puncture.

Carry forward:
- Black hero with high-authority headline.
- Red accent for a single purposeful action or mark.
- Minimal component radius.
- Proof object or media visible in the first viewport.

Avoid:
- Red used as generic decoration.
- Overly soft cards that dilute the stance.

### Holographik Monochrome Studio

Use for portfolios, agencies, architecture/design, and cultural pages. It is refined and typographic: black/white fields, one font weight, oversized type, and strong image placement.

Carry forward:
- Strict typographic discipline.
- Minimal palette, strong spacing, high craft.
- Components that contrast with the main canvas.
- Case-study or gallery proof rather than generic cards.

Avoid:
- Random accent colors.
- Heavy animation that fights the editorial pace.

### HARDCLO Brutal Commerce

Use for fashion, drops, streetwear, commerce, and campaign systems. It is blunt, blocky, product-forward, and hard-edged.

Carry forward:
- Product imagery as direct proof.
- Strong black/white labels and price/action blocks.
- Sharp module boundaries.
- Mobile commerce states that remain obvious.

Avoid:
- Over-polishing until it becomes luxury minimal.
- Hiding product details behind dramatic type.

### HyperAktiv Light Poster

Use for light high-contrast systems, studios, launch pages, and modern technical brands. It uses white field, black type, blue accent, and crisp cards.

Carry forward:
- White page with black rules and confident H1.
- Blue accent for links, selected states, or CTA.
- Full-width image/media bands.
- Clean feature modules with sharp contrast.

Avoid:
- Too many pale grays that flatten the system.
- Accent blue used everywhere.

### Hugging Face Utility Contrast

Use for technical products, AI tools, documentation, marketplaces, and community/product surfaces. It combines light contrast, yellow/orange brand warmth, dense navigation, and practical components.

Carry forward:
- Compact cards and tables with readable metadata.
- Accent warmth for brand/action, not every icon.
- Practical UI density.
- Clear category, owner, metric, and status labels.

Avoid:
- Cartoonish color sprawl.
- Low-contrast utility rows.

## Semantic Token Packs

### Black Authority

```css
:root {
  --hc-bg: #000000;
  --hc-fg: #ffffff;
  --hc-surface: #0f0f0f;
  --hc-surface-inverse: #ffffff;
  --hc-fg-inverse: #000000;
  --hc-muted: #b8b8b8;
  --hc-subtle: #757575;
  --hc-line: rgba(255,255,255,.24);
  --hc-line-strong: #ffffff;
  --hc-accent: #ff2d2d;
  --hc-success: #0f8f4f;
  --hc-warning: #b86b00;
  --hc-danger: #d9002f;
  --hc-focus: #ffffff;
  --hc-radius: 4px;
}
```

### White Poster

```css
:root {
  --hc-bg: #ffffff;
  --hc-fg: #000000;
  --hc-surface: #f3f4f6;
  --hc-surface-inverse: #000000;
  --hc-fg-inverse: #ffffff;
  --hc-muted: #4b5563;
  --hc-subtle: #6b7280;
  --hc-line: #d1d5db;
  --hc-line-strong: #000000;
  --hc-accent: #155dfc;
  --hc-success: #067647;
  --hc-warning: #9a5b00;
  --hc-danger: #c01030;
  --hc-focus: #000000;
  --hc-radius: 0px;
}
```

### Warm Utility

```css
:root {
  --hc-bg: #ffffff;
  --hc-fg: #101010;
  --hc-surface: #f8f8f0;
  --hc-surface-inverse: #111111;
  --hc-fg-inverse: #ffffff;
  --hc-muted: #55524a;
  --hc-line: #d8d2c2;
  --hc-line-strong: #111111;
  --hc-accent: #ffb000;
  --hc-success: #087443;
  --hc-warning: #a15c00;
  --hc-danger: #b00020;
  --hc-focus: #111111;
  --hc-radius: 8px;
}
```

### Execution Token Contract

Refero ready-to-use deltas from 099/Factory/(dot)connect:
- Token roles: 099 `#000000/#1d1d1d/#383838/#888888/#ffffff`; Factory `#020202/#eeeeee/#fafafa/#b8b3b0/#3d3a39/#a49d9a/#ef6f2`; (dot)connect `#001011/#fd5321/#0f1e1f/#007aff/#fcfbf8/#c1c4c2/#ededea`.
- Type roles: Soehne Mono 16px `0.24px`, Geist display `60px/1/-2.88px`, AeonikPro 16-101px plus DotConnect 19/24/36/73px.

Every High Contrast build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #000000;
  --text: #000000;
  --text-muted: #444444;
  --line: #000000;
  --action: #ff4d00;
  --action-strong: #000000;
  --radius-control: 0px;
  --radius-card: 0px;
  --radius-panel: 0px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Arial Narrow", "Space Grotesk", var(--font-sans);
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
  --shadow-card: inset 0 0 0 2px var(--line);
  --shadow-panel: inset 0 0 0 3px var(--line);
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
  --status-neutral-fg: #444444;
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

| Tailwind default | High Contrast token |
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
| `shadow-*` | border/inversion tiers; shadows are not the main depth tool |
| `text-gray-*` | only metadata; core text is `--text` or inversion |

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `hc`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Accent Job Lock

Choose one primary accent job and write it in the design plan.

| Accent job | Allowed usage | Example |
| --- | --- | --- |
| Action | Primary CTA, active submit, conversion path. | Red buy button, blue start button. |
| Selection | Active tab, selected row, chosen plan. | Blue current filter and outline. |
| Data highlight | One series, threshold, or important metric. | Yellow benchmark line. |
| Warning | Risk, destructive, outage, deadline. | Red incident severity only. |
| Brand mark | Logo, small mark, nav underline. | Orange brand chip, no CTA fill. |

If the accent is action, do not also use it for warnings. If the accent is warning, do not use it for links. Use black/white inversion for secondary hierarchy.

## No Unsafe Inversion

Do not solve polarity with global CSS filters:

```css
/* Avoid */
.dark-section { filter: invert(1); }
.logo-on-dark { filter: invert(1); }
img { filter: invert(1); }
```

Why:
- It can destroy brand colors, images, charts, user content, videos, and status colors.
- It can invert already-accessible assets into inaccessible ones.
- It creates unpredictable results under forced colors and browser extensions.

Use tokens and asset variants:

```tsx
export function LogoMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return tone === "dark"
    ? <img src="/brand/logo-white.svg" alt="Brand" />
    : <img src="/brand/logo-black.svg" alt="Brand" />;
}
```

```css
.hc-band {
  color: var(--hc-fg);
  background: var(--hc-bg);
}
.hc-band[data-tone="inverse"] {
  color: var(--hc-fg-inverse);
  background: var(--hc-surface-inverse);
}
```

## First Viewport Protocol

Refero layout deltas:
- 099: 1600px max, 48px sections, 16px gaps, 26.5px info padding, 0px defaults and 10px controls/cards.
- Factory: 4px base, 72px sections, 16px cards, 4px gaps, 6px cards, 4px buttons.
- (dot)connect: 48px sections, 24px gaps, 20px cards, 24px buttons, 8px badges.

High Contrast first viewports should be readable from across the room:

- Nav: black/white with active state, no default gray bar.
- H1: concrete product/person/place/category; poster-scale if appropriate.
- Proof: product screenshot, image, table, diagram, object, or editorial media.
- CTA: primary action has strongest contrast or locked accent.
- Next-section hint: a visible band, grid, image strip, table, or module row at the fold.

H1 rules:

```css
.hc-h1 {
  max-width: min(1180px, 100%);
  font-size: clamp(3rem, 10vw, 9rem);
  line-height: .9;
  letter-spacing: 0;
  text-wrap: balance;
  overflow-wrap: anywhere;
}
@media (max-width: 640px) {
  .hc-h1 { font-size: clamp(2.5rem, 17vw, 5rem); line-height: .92; }
}
```

## Signature Components

Refero component deltas:
- 099: `1px #383838` ghost controls, selected `#1d1d1d`, search input `6.4px 19.2px`.
- Factory: dense black/light grid, alert `#ef6f2` only for state/action.
- (dot)connect: high-contrast orange CTA `#fd5321`, blue secondary `#007aff`, parchment panels.

Use at least four for full-page or app work.

### Refero Expansion Component Deltas

- High-contrast shape must be source-specific: Ciridae 4/10/1440px, Moving Parts 0/2.5/14/18/90.3833/106.333px, Speakeasy extreme pill for source-matched buttons, Hyperstudio/Titan hard media panels.
- CTA color is tightly budgeted: Moving Parts blue `#0000ff` and green `#00d37c`, Ciridae rare `#CC6437`, Speakeasy spectrum divider only. Do not add secondary saturated accents.
- Shadows are usually banned; Moving Parts permits `rgba(0,0,0,.3) 15px 20px 30px 0` only for the source's huge cards. Prefer inversion, border, scale, crop, and type contrast.

| Component | Use | Required states |
| --- | --- | --- |
| `InvertedNav` | Nav that switches polarity by section or active context. | default, active, hover, focus, mobile open. |
| `PosterHeroBlock` | First viewport with bold type and proof media. | compact, expanded, image-loaded, fallback. |
| `HardEdgeCard` | Feature, product, case, pricing, or content card. | idle, hover, selected, loading, error. |
| `ContrastDataTable` | Dense product data, AI models, pricing, benchmarks. | sort, hover, selected, empty, error. |
| `SplitProofPanel` | Image/text or UI/proof section with hard boundary. | loaded, loading, reversed, mobile stacked. |
| `AccentCtaBlock` | Conversion block with accent locked to action. | idle, hover, focus, loading, success, disabled. |
| `MonochromeFilterBar` | Filters, tabs, categories, commerce options. | selected, overflow, disabled, keyboard focus. |
| `AccessibleStatusRow` | Status list or console row. | success, warning, danger, neutral, selected. |

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type HighContrastState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type HighContrastStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function HighContrastStatusPill({ role, children }: { role: HighContrastStatus; children: React.ReactNode }) {
  return <span className="high-contrast-status-pill" data-role={role}>{children}</span>;
}

export function InvertedNavContract({ state = "default" }: { state?: HighContrastState }) {
  return <section className="high-contrast-hero-object" data-state={state} aria-label="High Contrast proof object" />;
}

export function PosterHeroContract({ title, meta, state = "default" }: { title: string; meta: string; state?: HighContrastState }) {
  return <article className="high-contrast-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function HardEdgeCardContract({ items }: { items: string[] }) {
  return <nav className="high-contrast-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function HighContrastSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="high-contrast-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.high-contrast-status-pill {
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
.high-contrast-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.high-contrast-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.high-contrast-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.high-contrast-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.high-contrast-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.high-contrast-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.high-contrast-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.high-contrast-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.high-contrast-card[data-state="error"] { border-color: var(--status-danger-fg); }
.high-contrast-card > span { font: var(--type-meta); color: var(--text-muted); }
.high-contrast-card > strong { font: var(--type-card); color: var(--text); }
.high-contrast-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.high-contrast-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.high-contrast-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.high-contrast-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.high-contrast-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.high-contrast-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.high-contrast-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .high-contrast-hero-object { min-height: 280px; }
  .high-contrast-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
## Component Blueprints

### AccentCtaBlock

Use for conversion moments where the accent job is action.

```tsx
type CtaState = "idle" | "loading" | "success" | "disabled";

export function AccentCtaBlock({ state = "idle" }: { state?: CtaState }) {
  return (
    <section className="hc-cta" data-state={state}>
      <p className="hc-kicker">Launch window</p>
      <h2>Ship the new console before the traffic spike.</h2>
      <p>Audit settings, assign owners, and publish the rollout plan from one stark workspace.</p>
      <div className="hc-cta__actions">
        <button disabled={state === "loading" || state === "disabled"}>
          {state === "loading" ? "Checking" : state === "success" ? "Ready" : "Start audit"}
        </button>
        <a href="#details">View requirements</a>
      </div>
    </section>
  );
}
```

```css
.hc-cta {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 5vw, 56px);
  color: var(--hc-fg);
  background: var(--hc-bg);
  border: 2px solid var(--hc-line-strong);
  border-radius: var(--hc-radius);
}
.hc-cta h2 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(2.4rem, 8vw, 6rem);
  line-height: .9;
  letter-spacing: 0;
}
.hc-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hc-cta button {
  min-height: 48px;
  padding: 0 22px;
  color: var(--hc-fg-inverse);
  background: var(--hc-accent);
  border: 2px solid var(--hc-accent);
  border-radius: var(--hc-radius);
}
.hc-cta button:focus-visible,
.hc-cta a:focus-visible {
  outline: 3px solid var(--hc-focus);
  outline-offset: 3px;
}
.hc-cta[data-state="disabled"] button {
  color: var(--hc-fg);
  background: transparent;
  border-color: var(--hc-line);
}
@media (max-width: 560px) {
  .hc-cta__actions > * { width: 100%; text-align: center; }
}
```

### HardEdgeCard

Use for repeated modules that need sharp identity.

Rules:
- Use borders and surface inversion before shadows.
- Hover can invert, underline, or move 1px; it cannot resize.
- Loading state keeps border and fixed height.
- Selected state includes label/check/icon, not just accent color.
- Error state uses semantic danger token plus recovery action.

```css
.hc-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 18px;
  color: var(--hc-fg);
  background: var(--hc-bg);
  border: 2px solid var(--hc-line-strong);
  border-radius: var(--hc-radius);
}
.hc-card:hover {
  color: var(--hc-fg-inverse);
  background: var(--hc-surface-inverse);
}
.hc-card[data-selected="true"] {
  outline: 3px solid var(--hc-accent);
  outline-offset: -6px;
}
.hc-card[data-state="error"] {
  border-color: var(--hc-danger);
}
```

### ContrastDataTable

Use for technical products, AI models, benchmarks, pricing, admin lists, and catalogs.

Rules:
- Align numeric columns.
- Row hover must be visible but not overpower selected state.
- Sort icons need labels or `aria-sort`.
- Empty state explains how to add/filter data.
- Error state preserves table shell and provides retry.
- Mobile can convert rows into cards, but keep labels and values paired.

```css
.hc-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--hc-fg);
  background: var(--hc-bg);
}
.hc-table th,
.hc-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--hc-line);
  text-align: left;
}
.hc-table th {
  color: var(--hc-muted);
  font-size: 12px;
  text-transform: uppercase;
}
.hc-table tr:hover td {
  background: color-mix(in srgb, var(--hc-fg), transparent 94%);
}
.hc-table tr[data-selected="true"] td {
  color: var(--hc-fg-inverse);
  background: var(--hc-surface-inverse);
}
```

### InvertedNav

Use when sections alternate polarity.

Rules:
- Do not use global filter inversion.
- Nav reads current section tone from data attribute or theme token.
- Active item must survive both black and white bands.
- Mobile menu should use one polarity, not half-inverted assets.

```tsx
export function InvertedNav({ tone = "light" }: { tone?: "light" | "dark" }) {
  const links = ["Work", "Systems", "Pricing", "Contact"];
  return (
    <nav className="hc-nav" data-tone={tone} aria-label="Primary">
      <a className="hc-nav__brand" href="/">MONO</a>
      <div className="hc-nav__links">
        {links.map((link, index) => (
          <a key={link} href={`#${link.toLowerCase()}`} aria-current={index === 0 ? "page" : undefined}>
            {link}
          </a>
        ))}
      </div>
      <button>Start</button>
    </nav>
  );
}
```

```css
.hc-nav {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-height: 64px;
  padding: 0 clamp(16px, 4vw, 40px);
  color: var(--hc-fg);
  background: var(--hc-bg);
  border-bottom: 2px solid var(--hc-line-strong);
}
.hc-nav[data-tone="dark"] {
  --hc-bg: #000000;
  --hc-fg: #ffffff;
  --hc-surface-inverse: #ffffff;
  --hc-fg-inverse: #000000;
  --hc-line-strong: #ffffff;
}
.hc-nav__links {
  display: flex;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}
.hc-nav a,
.hc-nav button {
  min-height: 40px;
  padding: 0 12px;
  color: inherit;
  background: transparent;
  border: 2px solid transparent;
}
.hc-nav a[aria-current="page"],
.hc-nav button {
  color: var(--hc-fg-inverse);
  background: var(--hc-surface-inverse);
  border-color: var(--hc-surface-inverse);
}
@media (max-width: 680px) {
  .hc-nav { grid-template-columns: 1fr auto; }
  .hc-nav__links { grid-column: 1 / -1; justify-content: flex-start; overflow-x: auto; }
}
```

## Accessible Contrast States

Every state must remain clear in normal contrast, high contrast, and forced-colors modes.

```css
.hc-control {
  min-height: 44px;
  color: var(--hc-fg);
  background: var(--hc-bg);
  border: 2px solid var(--hc-line-strong);
}
.hc-control:hover {
  color: var(--hc-fg-inverse);
  background: var(--hc-surface-inverse);
}
.hc-control:focus-visible {
  outline: 3px solid var(--hc-focus);
  outline-offset: 3px;
}
.hc-control[aria-pressed="true"],
.hc-control[data-selected="true"] {
  color: var(--hc-fg-inverse);
  background: var(--hc-surface-inverse);
  box-shadow: inset 0 0 0 3px var(--hc-accent);
}
.hc-control:disabled {
  color: var(--hc-subtle);
  background: transparent;
  border-style: dashed;
}
@media (forced-colors: active) {
  .hc-control {
    border-color: CanvasText;
  }
  .hc-control:focus-visible {
    outline: 3px solid Highlight;
  }
}
```

State rules:
- Hover: invert or strengthen border.
- Focus: visible outline with offset.
- Selected: invert plus indicator/check/label.
- Disabled: not only opacity; use dashed border or explanatory label.
- Error: semantic text plus recovery action.
- Success: semantic text plus confirmation label.

## Motion System

Refero motion delta:
- No source-specific durations were observed for 099/Factory/(dot)connect. Use existing high-contrast timing; animate polarity/fill/border only.

- High-contrast motion should be abrupt but legible: 80-180ms inversion/underline/border, 150-260ms poster reveal, no soft float. If using conic/spectrum treatment, keep it static or structural; reduced motion preserves inversion and active outlines.

## Complete Page Protocols

```tsx
// Poster Authority
<main data-skill="high-contrast" data-archetype="poster-authority">
  <PosterHeroBlockContract title="NO SOFT DEFAULTS" />
  <InvertedNavContract items={["Index", "Proof", "Buy"]} />
  <SplitProofPanelContract left="claim" right="artifact" />
  <AccentCtaBlockContract action="Start now" />
</main>

// Utility Console
<main data-skill="high-contrast" data-archetype="utility-console">
  <ContrastDataTableContract rows={criticalRecords} />
  <MonochromeFilterBarContract items={["All", "Open", "Closed"]} />
  <AccessibleStatusRowContract role="danger">Blocked by missing approval</AccessibleStatusRowContract>
</main>
```
```tsx
// Poster Authority
<main data-skill="high-contrast" data-archetype="poster-authority">
  <PosterHeroBlockContract title="NO SOFT DEFAULTS" />
  <InvertedNavContract items={["Index", "Proof", "Buy"]} />
  <SplitProofPanelContract left="claim" right="artifact" />
  <AccentCtaBlockContract action="Start now" />
</main>

// Utility Console
<main data-skill="high-contrast" data-archetype="utility-console">
  <ContrastDataTableContract rows={criticalRecords} />
  <MonochromeFilterBarContract items={["All", "Open", "Closed"]} />
  <AccessibleStatusRowContract role="danger">Blocked by missing approval</AccessibleStatusRowContract>
</main>
```
High Contrast motion is graphic:

- Wipe reveal: section or image reveals by hard mask.
- Inversion snap: selected controls invert quickly.
- Rule draw: border/rule draws once to frame content.
- Type reveal: line or word reveal, but content must be readable without animation.
- Data motion: bars/lines grow from baseline.

```css
@keyframes hc-wipe {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0); }
}
@keyframes hc-rule-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.hc-wipe-in { animation: hc-wipe 620ms cubic-bezier(.16,1,.3,1) both; }
.hc-rule { transform-origin: left center; animation: hc-rule-draw 500ms cubic-bezier(.16,1,.3,1) both; }
@media (prefers-reduced-motion: reduce) {
  .hc-wipe-in, .hc-rule { animation: none !important; clip-path: none !important; transform: none !important; }
}
```

Reduced motion:
- Replace wipes with static final layout.
- Do not depend on animation to reveal content.
- Preserve state changes through inversion, border, icon, and text.


## Absolute Bans

- Refero anti-dilution: do not add a third chromatic accent beside Factory `#ef6f2` or (dot)connect `#fd5321/#007aff`.
- Do not use low-contrast gray text on black; 099 gray steps must remain legible.

- No black-white styling without composition.
- No low-opacity gray for important text.
- No gradients when flat contrast would be stronger.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Layout Patterns

### Poster Hero

- Huge type, strong nav, proof media, and hard CTA.
- One accent if the job is action or brand.
- Section below peeks with opposite polarity or strong border.

### Editorial Index

- Use columns, numbered lists, case-study grids, and large media.
- Let typographic hierarchy carry the design.
- Keep controls practical and visible.

### Utility Console

- Use strong tables, filters, status rows, and command panels.
- Status colors are semantic and minimal.
- Keep row density high but readable.

### Brutal Commerce

- Product images are direct and inspectable.
- Size/color/quantity states are obvious.
- Pricing, availability, and checkout path use high contrast.

## Polarity Conversion Recipes

When moving a component between black and white bands, convert by role:

| Role | Light band | Dark band |
| --- | --- | --- |
| Body text | Black | White |
| Muted text | Dark gray with contrast | Light gray with contrast |
| Primary button | Black fill or locked accent | White fill, locked accent, or clear inversion |
| Secondary button | White fill with black border | Black fill with white border |
| Card | White or pale gray with black border | Black or near-black with white border |
| Divider | Black at low alpha or solid gray | White at low alpha or solid gray |
| Image frame | Black rule | White rule or solid white mat |

Do not preserve exact color values when the surface flips. Preserve semantic roles.

## Image And Media Treatment

High Contrast pages often fail when media is left in a different visual world. Apply one clear treatment:

- Full color media with black/white framing when the product needs inspection.
- Black/white photography for editorial drama.
- Duotone only if it does not hide important product detail.
- Solid caption slabs for text over image.
- Hard crop grids with consistent aspect ratios.

Do not invert user images or logos with CSS. Prepare correct assets, add masks, or frame them.

## Content Evidence Rules

- Brand pages need real names, dates, imagery, claims, or proof objects.
- Product pages need screenshots, workflows, pricing, specs, or demos.
- Dashboards need labels, values, time ranges, owners, and states.
- Commerce needs product details, variants, availability, return/shipping cues.
- Editorial pages need author, issue, project, media, or index information.

## Typography Rules

- Use display scale intentionally; avoid six-line desktop headlines.
- Strong line-height is acceptable for display, but body text needs comfort.
- Keep letter spacing at 0 unless using uppercase micro labels with slight positive tracking.
- Pair huge type with small structured labels, not long vague copy.
- Use type weight and scale before adding decorative marks.

## Accessibility And Readability

- Check contrast for every foreground/background pair.
- Do not place white text on busy images without a solid overlay or protected slab.
- Do not rely on thin hairlines for critical focus or selection.
- Inverse states must work for keyboard and touch.
- Provide image alt text and avoid hiding product proof in decorative backgrounds.
- Use semantic status text with color.
- Respect forced-colors mode and user contrast settings.

## Mobile Rules

- Scale poster type down with `clamp` and `overflow-wrap:anywhere`.
- Stack polarity bands cleanly; avoid half-black/half-white component collisions.
- Convert tables to labeled rows when columns no longer fit.
- Keep CTAs at least 44px high.
- Avoid horizontal overflow from oversized type or rigid grids.
- Preserve accent job; mobile should not introduce extra accent uses.

## Anti-Patterns

- Global `filter: invert(1)` as a theming shortcut.
- Gray-on-gray "high contrast" with no true black/white tension.
- Accent color used for links, CTA, warning, and decoration at once.
- Tiny low-contrast focus rings.
- Product imagery hidden under heavy overlays.
- Poster type that clips on mobile.
- Decorative borders that do not align to grid or content.
- Shadows and gradients doing the work that contrast should do.
- Disabled states represented only by opacity.

## Pre-Output Checklist

- First viewport contains a real inverted poster, table, or hard-edge proof.
- One High Contrast archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to inversion/border transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
