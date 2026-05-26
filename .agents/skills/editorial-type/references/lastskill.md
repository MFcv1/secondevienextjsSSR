---
name: editorial-type
description: "Use this skill to create editorial typographic websites and interfaces where type carries identity through scale, rhythm, contrast, columns, pull quotes, indexes, and magazine-like hierarchy. USE FOR: typographic websites, magazine-like pages, cultural brands, essays, archives, portfolios, editorial commerce. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Editorial Type Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Editorial Type archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, poster title, issue index, typographic spread, or editorial commerce proof, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Editorial Type components with states.
7. **Motion plan:** line-mask, issue transition, or type reveal, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


Editorial Type treats typography as structure, image, navigation, and voice. The page should feel authored before it feels decorated. Type scale, columns, captions, rules, issue rows, pullquotes, and contrast shifts create the system.

Use this for magazine-like pages, cultural brands, archives, portfolios, editorial commerce, essays, publishing systems, type-led campaigns, and product pages where the typographic point of view is the brand.

Editorial Type is not "put a serif on the hero." It is a layout discipline. The design should be legible, navigable, and shippable with real content, while still letting type dominate the first impression.


For substantial UI work, decide:

- Which typographic archetype owns the first viewport.
- Which typefaces carry display, body, metadata, controls, and optional mono roles.
- Whether the page is sharp/zero-radius, softly pill-based, or image-softened.
- Which index system organizes content: issue table, archive row, funding/status pill, caption grid, section clock, page number, or editorial footer.
- Which colors are semantic accents and which are simply text/surface roles.
- Which motion primitive supports the type: line-mask reveal, word reveal, column reveal, issue marker slide, border draw, image crop, or inversion.

If building a full page, include a compact design plan with archetype, first viewport, type system, token pack, component set, and motion grammar. If the task is tiny, keep the plan internal.

## Source Archetypes

Pick one dominant archetype. Do not average them into a generic editorial page.

### Additional Refero Source Packs

- Chronicle magazine feature: achromatic `#050505/#000/#151515/#292929/#6b6b6b/#929292/#e2e2e2/#f3f3f3/#fff`; Diatype only; display `54px/1/-1.62px`, heading `48px/-1.44px`; sections 80-128px, buttons/images/inputs 4px, cards 8px, shadow `rgba(5,5,5,.08) 0 2px 24px`.
- Wise Design chromatic type portfolio: `#87ea5c/#083400/#ffea4b/#ffbd89/#ffd5f0/#2a0831/#370305/#fff`; Wise Sans display 187-562px, line-height `.85`, weight 900; cards 86px, pills 9999px; zero shadow.
- Monotype foundry resource: `#1e242c/#1a73e8/#576579/#fff/#e7eaee/#cfd5dd`; 8px base, 104px sections, radius 8px, images 16px; soft resource shadow only.
- Substack archive: orange `#FF6719`, ink `#363737`, canvas `#FFFFFF`, lines `#EEEEEE/#C8C8C8`; 4px base, cards 8px, inputs 12px, buttons 9999px.
- Medium essay archive: `#f7f4ed/#ffffff/#191919/#242424/#333333/#6b6b6b/#50B33A`; 8px base, 64px sections, pill buttons, no shadow.

### 1. High-Contrast Editorial Archive

Source basis: Volume.

Use for archives, cultural marketplaces, publication indexes, campaign collections, and editorial commerce where status/category pills matter.

Raw signals:

- Canvas: `#ffffff`.
- Ink: `#272727`.
- Muted: `#717171`.
- Button gray: `#949494`.
- Deep surface: `#000000`.
- Dark placeholder: `#cdcccc`.
- Status accents: `#962921`, `#c52910`, `#e75a00`.
- Max width: `1400px`.
- Section gap: `45px`.
- Element gap: `10px`.
- Card padding: `30px`.
- Radius: `0px` for cards, inputs, buttons; `50px` for status pills.
- Type: Messina Sans only, fallback system sans.
- Weights: `300`, `350`.
- Sizes: `14, 18, 20, 32, 50, 80px`.
- Display tracking: `-0.0200em` at `50px`.
- Small label tracking: `0.0700em` at `14px`.

Carry forward:

- Use one refined sans voice across the page.
- Use status pills as functional markers, not decoration.
- Let full-bleed images and sequential editorial blocks replace equal card grids.
- Keep inputs sharp with bottom-border treatments.
- Preserve the `0px` major-component radius and reserve `50px` only for small pills.

Avoid:

- Decorative shadows and gradients.
- Additional typefaces.
- Saturated accent for large UI surfaces.
- Applying small-label tracking to big headlines.
- Arbitrary spacing outside the `10/30/45` rhythm.

Mini token pack:

```css
:root {
  --et-canvas: #ffffff;
  --et-ink: #272727;
  --et-muted: #717171;
  --et-button-neutral: #949494;
  --et-inverse: #000000;
  --et-on-inverse-muted: #cdcccc;
  --et-status-deep: #962921;
  --et-status-hot: #c52910;
  --et-status-warm: #e75a00;
  --et-radius-major: 0px;
  --et-radius-pill: 50px;
}
```

### 2. Stark Serif Canvas

Source basis: Victor Cango.

Use for studios, personal portfolios, essays, cultural pages, and editorial sites where an old-style serif should meet a tight modern sans.

Raw signals:

- Canvas: `#f7f7f7`.
- Ink: `#0f0f0f`.
- Radius: `0px`.
- Section gap: `48px`.
- Element gap: `16px`.
- Card/content padding: `16px`.
- Typeface: `century-old-style-std`, fallback Palatino Linotype or Georgia.
- Serif weights: `400`.
- Serif sizes: `16, 21, 50px`.
- Serif line heights: `1.00`, `1.30`.
- Serif tracking: `-0.0940em` at `50px`, `-0.0500em` at `21px`, normal at `16px`.
- Functional type: `MetroSans`, fallback system sans.
- MetroSans sizes: `21, 24, 50px`.
- MetroSans tracking: `-0.0500em`.
- Underline offset: about `6px` padding-bottom for nav hover/active.

Carry forward:

- Use the serif for expressive headlines and selected body moments.
- Use MetroSans for navigation, UI, and functional text.
- Interactive links use a `1px` ink underline, not color.
- Keep a simple header with text links and optional clock/metadata.
- Let centered large type and abstract content shape the hero.

Avoid:

- Extra background colors.
- Drop shadows and decorative card borders.
- Color-based interaction states.
- Generic fonts in place of the serif/sans split.
- Corner radius.

Mini token pack:

```css
:root {
  --et-canvas: #f7f7f7;
  --et-ink: #0f0f0f;
  --et-rule: #0f0f0f;
  --et-radius: 0px;
  --et-font-display: "century-old-style-std", "Palatino Linotype", Georgia, serif;
  --et-font-ui: "MetroSans", system-ui, sans-serif;
}
```

### 3. Black/White Poster Publication

Source basis: No Ideas.

Use for dramatic campaigns, editorial publications, art projects, music/culture pages, and typographic heroes where full-bleed black/white contrast is the event.

Raw signals:

- Canvas white: `#ffffff`.
- Ink black: `#000000`.
- Text gray: `#212529`.
- Display type: ABC Diatype.
- Display weights: `400`, `500`.
- Display sizes: `36, 48, 331px`.
- Display line heights: `1.05`, `1.10`, `1.52`.
- Display tracking: `-0.052em` at `36/48px`, `-0.010em` at `331px`.
- Body: system-ui, `16px`, line-height `1.5`.
- Element gap: `29px`.
- Editorial header vertical rhythm: about `202px` after major blocks.
- Image radius: `15px`.
- Footer padding: `19px` vertical, `29px` horizontal.

Carry forward:

- Use full-bleed black/white sections as typographic chapters.
- Let the poster title occupy the viewport.
- Navigation can be ghost text, not button chrome.
- Use `15px` image radius to soften photos inside an otherwise stark system.
- Let large vertical gaps create ceremony.

Avoid:

- Additional chromatic colors.
- Heavy borders around text links.
- Dense information blocks under poster-scale type.
- Decorative imagery unrelated to the claim.
- Gradient or shadow depth.

Mini token pack:

```css
:root {
  --et-canvas: #ffffff;
  --et-ink: #000000;
  --et-text-soft: #212529;
  --et-inverse: #000000;
  --et-on-inverse: #ffffff;
  --et-radius-image: 15px;
  --et-space-poster-gap: 202px;
}
```

### 4. Type Foundry White Canvas

Source basis: Sociotype.

Use for type foundries, specimen systems, typographic portfolios, editorial catalogs, and pages where display fonts are themselves the imagery.

Raw signals:

- Canvas: `#ffffff`.
- Ink: `#000000`.
- Medium gray: `#818181`.
- Faded gray: `#9d9d9d`.
- Light gray: `#d6d6d6`.
- Section gap: `120px`.
- Element gap: `12px`.
- Card padding: `0px`.
- Radius: `0px` everywhere.
- Functional type: Onsite, sizes `11-40px`, tracking `0.015-0.08em`.
- Display type: Avec Sharp plus Ceno, Meso, Gestura, Rework.
- Display size: `251px`, weight `400`, line-height `1.25`, tracking `0.0010em`.
- Caption: `11px`, tracking `0.88px`.
- Body: `14px`, tracking `0.35px`.
- Heading: `26px`, tracking `0.26px`.

Carry forward:

- Multiple display faces can be the visual asset.
- Functional text remains disciplined and smaller.
- Ghost buttons are underlined text, no background.
- Inputs use bottom border only.
- Full-bleed layout and huge gaps create publication flow.

Avoid:

- Saturated CTA colors.
- Rounded corners.
- Shadows and elevation.
- Dense grids.
- Generic system font links.

Mini token pack:

```css
:root {
  --et-canvas: #ffffff;
  --et-ink: #000000;
  --et-muted: #818181;
  --et-tertiary: #9d9d9d;
  --et-rule: #d6d6d6;
  --et-radius: 0px;
  --et-space-section: 120px;
}
```

### 5. Condensed Ink-On-Paper Grid

Source basis: Christopher Doyle.

Use for identity studios, cultural portfolios, art direction, case-study sites, and pages that need bold condensed type plus image layering.

Raw signals:

- Canvas: `#ffffff`.
- Jet: `#000000`.
- Ash: `#ababab`.
- Accent: `#ff5c26`.
- Section gap: `75px`.
- Element gap/content padding: `15px`.
- Radius: `0px`.
- Display: Founders Grotesk X Condensed, fallback Bebas Neue.
- Display size: `81px`, weight `400`, line-height `1.00`, tracking `-0.0100em`.
- Body: Die Grotesk A, fallback Inter.
- Body sizes: `12, 14px`.
- Body line heights: `1.21`, `1.28`.
- Motion: `0.3s ease` for color changes.

Carry forward:

- Condensed type can dominate navigation and headings.
- Dynamic offset grids and image overlap create identity.
- Machine Orange is a brand mark or illustrative accent, not general UI.
- Plain text links can be enough.
- Keep all corners sharp.

Avoid:

- Extra saturated colors.
- Ash gray for essential actions.
- Overly sparse layout that loses the structured read.
- Drop shadows and complex gradients.
- Inconsistent typography.

Mini token pack:

```css
:root {
  --et-canvas: #ffffff;
  --et-ink: #000000;
  --et-muted: #ababab;
  --et-accent-brand: #ff5c26;
  --et-radius: 0px;
  --et-space-section: 75px;
  --et-space-element: 15px;
}
```

## Differentiation

Use Editorial Type when typographic websites, magazine-like pages, cultural brands, essays, archives, portfolios, editorial commerce. If removing the poster title, issue index, or type-led spread, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `editorial-minimal` for quieter authored pages; use `serif-display` when one refined serif voice is the luxury object.
## Semantic Tokens

Use semantic roles instead of raw count summaries or source dumps.

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-inverse: #000000;
  --text-primary: #000000;
  --text-secondary: #717171;
  --text-muted: #ababab;
  --text-inverse: #ffffff;
  --rule-subtle: #d6d6d6;
  --rule-strong: #000000;
  --accent-annotation: #ff5c26;
  --accent-status-1: #962921;
  --accent-status-2: #c52910;
  --accent-status-3: #e75a00;
  --focus-ring: #000000;
  --state-error: #9b1c1c;
  --state-warning: #9a5b00;
  --state-success: #245c3d;
  --radius-frame: 0px;
  --radius-media: 0px;
  --radius-pill: 50px;
  --space-section: 75px;
  --space-row: 16px;
  --motion-fast: 140ms;
  --motion-base: 240ms;
  --motion-slow: 520ms;
  --ease-type: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Rules:

- Status colors live in small pills, table marks, or issue labels.
- Accent annotation can mark a word, a rule, a selected issue, or a brand artifact. Do not spread it across every icon.
- In black/white archetypes, keep semantic colors out unless the product requires them.
- Use `surface-inverse` for typographic contrast chapters, not as alternating filler.

### Execution Token Contract

Every Editorial Type build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #f4f2ef;
  --text: #272727;
  --text-muted: #717171;
  --line: #d9d5cf;
  --action: #c52910;
  --action-strong: #962921;
  --radius-control: 0px;
  --radius-card: 0px;
  --radius-panel: 0px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Messina Sans", "ABC Diatype", Georgia, serif;
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
  --shadow-card: inset 0 -1px 0 var(--line);
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
  --status-neutral-fg: #717171;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --font-ui: var(--surface-muted);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Editorial Type token |
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

Token rule: if a value can be expressed by `et`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Typography System

Editorial Type needs more explicit type contracts than most styles.

Additional type contracts: use display serif `gt-super 120px/0.83/-6.6px`, `Times Now 30-120px/.78-1`, `Denton 48/52/80`, or type-led sans `Wise Sans 187-562px/.85/900`, `Diatype 12-54px`, `SuisseIntl 10-188px`. Pair giant display with readable body columns at 700-900px; do not scale body copy with viewport width.

Roles:

- Poster display: `80-331px`, often one or two words, line-height `0.85-1.05`.
- Editorial display: `48-96px`, controls section identity and first viewport.
- Section heading: `31-52px`, often same family as display or a condensed counterpart.
- Body: `16-20px` for reading, line-height `1.4-1.65`.
- Caption: `11-14px`, deliberately tracked or muted.
- Metadata: date, issue, category, page number, funding status, author, location.
- Control: nav, filters, tabs, buttons; should inherit the editorial type system, not default UI font weight.

Type strategies:

- Single-sans archive: Messina Sans-like, light display, tracked labels, status pills.
- Serif/sans editorial: old-style serif display plus tight sans navigation.
- Poster sans: ABC Diatype-like large display with system body.
- Specimen system: one workhorse functional font plus multiple display specimens.
- Condensed studio: condensed display for nav/headings, narrow body text, image overlap.

Type QA:

- Never apply positive small-label tracking to big display text unless source-specific.
- Do not make long body copy use display tracking.
- Avoid more than two active reading families unless the page is a type/specimen showcase.
- On mobile, poster display must have a smaller clamp and a wrapping strategy.

## Layout Patterns

### Poster Hero

Best for campaigns and cultural launches.

- Full-bleed or near-full-bleed.
- One enormous title, tiny metadata, minimal nav.
- Proof object can be a photograph, issue cover, product still, or event info block.
- Bottom of viewport reveals the next issue row or image edge.

### Magazine Grid

Best for publishing, portfolios, and cultural brands.

- Multi-column layout with asymmetric spans.
- Cards are often transparent; typography and image crop separate items.
- Use captions, dates, categories, and issue numbers as the grid skeleton.

### Issue Index

Best for archives, libraries, updates, essays, and marketplaces.

- Rows are the design.
- Columns include issue/date, category, title, author, status, and action.
- Active states use underline, rule, weight, or inversion.

### Typographic Commerce

Best for editorial stores, print products, type catalogs, and cultural products.

- Product listings feel like a spread: image, title, price/status, edition, availability.
- Cards can be transparent or soft-pilled depending on archetype.
- Status pills must carry real commerce state: funded, sold out, new, update, early access.

### Image-Over-Type Studio Grid

Best for studios and portfolios.

- Large condensed headings and image crops overlap or offset.
- Keep links and actions plain.
- Accent color appears as a brand mark or tiny typographic signal.

## Component Signatures

Use at least four on full-page work.

### Refero Expansion Component Deltas

- Type specimen cards need exact radius and shadow policy: Wise cards 86px with zero shadow, Chronicle cards 8px with a soft 24px shadow, Monotype resource cards 8px/images 16px, Substack cards 8px.
- Archive filters and CTAs are pills only when the source says so: Wise/Substack/Medium use 9999px; Chronicle uses 4px controls. Keep active filters visible through fill, underline, or border, not color alone.
- Foundry/resource pages need a real type sample, glyph grid, index, or article list; do not replace them with decorative quote cards.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type EditorialTypeState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type EditorialTypeStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function EditorialTypeStatusPill({ role, children }: { role: EditorialTypeStatus; children: React.ReactNode }) {
  return <span className="editorial-type-status-pill" data-role={role}>{children}</span>;
}

export function PosterTitleHeroContract({ state = "default" }: { state?: EditorialTypeState }) {
  return <section className="editorial-type-hero-object" data-state={state} aria-label="Editorial Type proof object" />;
}

export function IssueIndexTableContract({ title, meta, state = "default" }: { title: string; meta: string; state?: EditorialTypeState }) {
  return <article className="editorial-type-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function PullquotePanelContract({ items }: { items: string[] }) {
  return <nav className="editorial-type-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function EditorialTypeSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="editorial-type-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.editorial-type-status-pill {
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
.editorial-type-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.editorial-type-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.editorial-type-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.editorial-type-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.editorial-type-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.editorial-type-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.editorial-type-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.editorial-type-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.editorial-type-card[data-state="error"] { border-color: var(--status-danger-fg); }
.editorial-type-card > span { font: var(--type-meta); color: var(--text-muted); }
.editorial-type-card > strong { font: var(--type-card); color: var(--text); }
.editorial-type-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.editorial-type-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.editorial-type-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.editorial-type-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.editorial-type-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.editorial-type-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.editorial-type-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .editorial-type-hero-object { min-height: 280px; }
  .editorial-type-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Poster Title Hero

Structure:

- Nav, title, metadata, action, proof object.
- Title should be real content, not a vague slogan.
- Use a stable line-height and max width.
- Provide mobile fallback: shorter lines, reduced scale, no overlap with nav.

States:

- CTA hover: underline, inversion, or rule draw.
- Reduced motion: title appears already legible.
- Loading proof object: preserve the frame and metadata.

### Issue Index Table

Structure:

- Header row with metadata labels.
- Body rows with title, date/issue, category, author/status, action.
- Top and bottom rules.
- Fixed column strategy on desktop, stacked metadata on mobile.

States:

- Hover row: title underline or row inversion.
- Focus row: outline or left rule.
- Selected/current: stronger weight and inverse status.
- Loading: fixed row skeleton.
- Empty: one row explaining no issues and a link to archive/contact.
- Error: text row with retry action; no red-only state.

### Pullquote Panel

Structure:

- Large quote or statement in display family.
- Attribution in metadata style.
- Optional side note or image crop.
- Border top/bottom or inverse surface.

States:

- Hover/focus if clickable: underline attribution or border draw.
- On mobile, line breaks should remain intentional.

### Caption Grid

Structure:

- Images or proof blocks with numbered captions.
- Captions align to a common baseline.
- Image radius follows archetype: `0px`, `15px`, or soft foundry radius if applicable.

States:

- Hover: crop shift or caption rule.
- Selected: number/pill inverts.
- Loading/error: retain image frame and caption slot.

### Article Card Row

Structure:

- Transparent row or card, title-led.
- Metadata above or beside title.
- Optional thumbnail with exact crop.
- No generic icon decoration.

States:

- Hover: title underline and metadata contrast.
- Disabled/unavailable: readable muted row plus reason.

### Typographic Filter

Structure:

- Filters as underlined text, pills, or segmented rows depending on archetype.
- Include count/status and selected state.
- Works for archive, store, issue, category, or author.

States:

- Selected: underline thickens, pill fills, or row inverts.
- Focus: visible rule/outline.
- Empty results: table/list frame remains with recovery text.

### Bibliographic Footer

Structure:

- Footer behaves like a colophon.
- Include sections, contact, legal, archive links, issue/date/version.
- Repeat the page's typographic motif.

States:

- Links use the same underline/rule/inversion grammar as nav.
- Focus state is not hidden in small type.

## State Patterns

Editorial Type states should feel typographic and achromatic before they feel chromatic.

State vocabulary:

- Underline: nav, links, row titles, active filters.
- Inversion: selected issue row, primary CTA, current category.
- Weight: active item moves from `300/400` to `500/600` depending on font.
- Rule: bottom border, left rail, table row, section divider.
- Italic or serif swap: selected quote or editorial emphasis, used sparingly.
- Pill: status only when the status is real.
- Accent: annotation/status/category, not generic hover color.

Example:

```css
.et-row {
  border-bottom: 1px solid var(--rule-subtle);
  color: var(--text-primary);
  transition: background 160ms ease, color 160ms ease;
}
.et-row:hover .et-title,
.et-row:focus-visible .et-title {
  text-decoration: underline;
  text-underline-offset: .2em;
}
.et-row[aria-current="true"] {
  background: var(--surface-inverse);
  color: var(--text-inverse);
}
.et-pill[data-status="urgent"] {
  background: var(--accent-status-2);
  color: var(--text-inverse);
}
.et-control[aria-invalid="true"] {
  border-color: var(--state-error);
}
.et-control[data-success="true"] {
  border-color: var(--rule-strong);
  font-weight: 500;
}
```

Do not use default SaaS green success fills or generic blue focus unless the project design system already requires it.

## Motion Grammar

- Editorial Type motion should reveal hierarchy without becoming the identity: 150-300ms opacity/translate, tab/index transitions with stable height, no infinite kinetic type unless the source archetype is explicitly experimental.

## Complete Page Protocols

```tsx
// Magazine Issue
<main data-skill="editorial-type" data-archetype="magazine-issue">
  <PosterTitleHeroContract title="The Shape of Work" deck="Issue 04 / Systems" />
  <IssueIndexTableContract rows={articlesWithAuthorsAndDates} />
  <PullquotePanelContract quote="Type carries the hierarchy." />
  <CaptionGridContract images={editorialCrops} />
</main>

// Editorial Commerce
<main data-skill="editorial-type" data-archetype="editorial-commerce">
  <SpreadGalleryContract products={limitedEditions} />
  <TypographicFilterContract items={["Objects", "Prints", "Books"]} />
  <ArticleCardRowContract title="Provenance and process" meta="Materials / care / shipping" />
</main>
```
```tsx
// Magazine Issue
<main data-skill="editorial-type" data-archetype="magazine-issue">
  <PosterTitleHeroContract title="The Shape of Work" deck="Issue 04 / Systems" />
  <IssueIndexTableContract rows={articlesWithAuthorsAndDates} />
  <PullquotePanelContract quote="Type carries the hierarchy." />
  <CaptionGridContract images={editorialCrops} />
</main>

// Editorial Commerce
<main data-skill="editorial-type" data-archetype="editorial-commerce">
  <SpreadGalleryContract products={limitedEditions} />
  <TypographicFilterContract items={["Objects", "Prints", "Books"]} />
  <ArticleCardRowContract title="Provenance and process" meta="Materials / care / shipping" />
</main>
```
Motion should make typography feel printed, arranged, and navigable.

Allowed primitives:

- Line-mask reveal for display headings.
- Word reveal for short poster titles.
- Column reveal for magazine grids.
- Issue marker slide for active filters or archive rows.
- Border draw for links, dividers, and table headers.
- Image crop for captioned media.
- Inversion swap for selected rows and CTAs.

Timing:

- Hover/link: `120-180ms`.
- Border draw: `180-260ms`.
- Row inversion: `160-240ms`.
- Column reveal: `320-520ms`.
- Poster title reveal: `520-900ms`.

CSS primitive:

```css
.et-reveal-line {
  display: block;
  overflow: hidden;
}
.et-reveal-line > span {
  display: inline-block;
  transform: translateY(108%);
  transition: transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
}
.is-visible .et-reveal-line > span {
  transform: translateY(0);
}
.et-rule-draw::after {
  content: "";
  display: block;
  block-size: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 220ms ease;
}
.et-rule-draw:hover::after,
.et-rule-draw:focus-visible::after,
.et-rule-draw[aria-current="true"]::after {
  transform: scaleX(1);
}
@media (prefers-reduced-motion: reduce) {
  .et-reveal-line > span,
  .et-rule-draw::after {
    transform: none !important;
    transition-duration: .01ms !important;
  }
}
```

Avoid:

- Generic fade-up as the signature motion.
- Decorative looping text.
- Parallax that damages reading.
- Motion that changes row height, table column width, or button size.


## Absolute Bans

- No decorative serif heading without a full type system.
- No display type that makes navigation or conversion unclear.
- No more than two type families unless there is a strong editorial reason.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Implementation Recipes

### Issue Index

```css
.issue-index {
  border-top: 1px solid var(--rule-strong);
  font-family: var(--font-ui, system-ui);
}
.issue-index__head,
.issue-index__row {
  display: grid;
  grid-template-columns: 92px 140px minmax(0, 1fr) 120px;
  gap: 16px;
  align-items: baseline;
}
.issue-index__head {
  min-block-size: 40px;
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.issue-index__row {
  min-block-size: 78px;
  border-top: 1px solid var(--rule-subtle);
  color: var(--text-primary);
}
.issue-index__title {
  font-size: clamp(24px, 3vw, 50px);
  line-height: 1;
}
@media (max-width: 760px) {
  .issue-index__head { display: none; }
  .issue-index__row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding-block: 18px;
  }
}
```

### Poster Hero

```css
.poster-hero {
  min-block-size: 92svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--surface-inverse);
  color: var(--text-inverse);
}
.poster-hero__title {
  align-self: center;
  font-family: var(--font-display);
  font-size: clamp(64px, 19vw, 260px);
  line-height: .88;
  letter-spacing: -.035em;
  max-inline-size: 8ch;
}
.poster-hero__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  border-top: 1px solid currentColor;
  padding-block: 16px;
  font-size: 13px;
}
```

### Typographic Commerce Row

```css
.commerce-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 120px auto;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--rule-subtle);
  min-block-size: 88px;
}
.commerce-row__image {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--radius-media, 0px);
}
.commerce-row__status {
  border-radius: var(--radius-pill);
  padding: 7.5px 12px;
  background: var(--surface-inverse);
  color: var(--text-inverse);
  justify-self: start;
  white-space: nowrap;
}
```

## Anti-Slop Rules

Reject:

- Decorative serif or condensed headline without a full type system.
- Fake magazine layouts with illegible body copy.
- Poster type that hides navigation or primary action.
- Equal three-card grids as the page's main structure.
- Too many fonts unless the page is explicitly a specimen/foundry system.
- Color used for every link, icon, and heading.
- Display tracking applied randomly.
- Mobile text overflow.
- Cards with shadows, gradients, or default rounded corners when the archetype is sharp.
- Issue/status pills that do not represent actual state.

Repair:

- If the page feels generic, increase typographic contrast and commit to an archetype's radius and spacing.
- If it feels unreadable, reduce display scale, increase body contrast, and shorten line lengths.
- If it feels like a poster only, add index, caption, footer, and conversion structure.
- If it feels noisy, remove accents before removing content.
- If it feels too minimal, add row systems, page numbers, metadata, pullquotes, and captioned media.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium. Text-rich with deliberate pacing. |
| motion | Low-medium. Word reveals, column reveals, scroll indexes, image-mask transitions. |
| decoration | Low. Type contrast and rules are the decoration. |
| contrast | High type contrast with restrained accents. |
| radius | 0-8px; type-led pages usually favor square frames. |
| type | Display serif or condensed grotesk plus readable body sans/serif. |
| assets | Editorial photography, type specimens, covers, article cards, product stills. |

## Signature System

- Type-Led Layout Recipe: H1 defines the grid, body text obeys column width, captions anchor media.
- Scale Shock With Discipline: huge type is acceptable only with compressed line-height and mobile clamps.
- Typographic Index: rows, dates, authors, categories, and page numbers become interface structure.
- Accent Economy: underline, rule, bullet, or one highlight color replaces decorative graphics.

## Pre-Output Checklist

- First viewport contains a real poster title, issue index, or type-led spread.
- One Editorial Type archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to line-mask/word reveal and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
