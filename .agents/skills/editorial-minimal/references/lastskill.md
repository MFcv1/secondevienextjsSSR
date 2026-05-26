---
name: editorial-minimal
description: "Use this skill to create Editorial Minimal visual design systems that feel quiet, typographic, spacious, authored, restrained, intentional. USE FOR: minimal editorial pages, portfolios, cultural sites, calm brand systems, writing-heavy layouts, refined landing pages. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Editorial Minimal Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Editorial Minimal archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, captioned media block, index row, archive, or quiet proof object, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Editorial Minimal components with states.
7. **Motion plan:** quiet text/image reveal, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.

## Core Directive

Editorial Minimal is quiet only after the system has done real work. It is a content-first visual language where type, canvas temperature, margins, rules, captions, image crops, and a tiny state vocabulary replace decoration. The page should feel edited, not empty.

Use it for AI and research homepages, institutional product pages, calm portfolios, cultural archives, writing-heavy landing pages, premium but non-luxury brands, and product stories that should feel intelligent before they feel commercial.

Do not treat this as generic minimalism. The differentiator is editorial authorship: a page rhythm that resembles a well-edited publication, with proof objects and caption systems instead of decorative cards.

## Non-Negotiable Principles

- Type, whitespace, rhythm, image crop, and caption placement carry the identity.
- The page must feel edited, not empty: every quiet section needs proof, structure, or authorship.
- Use one strong editorial move, then repeat it with restraint instead of adding decoration.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Low-medium. Spacious but not vacant. |
| motion | Low. Fades, text reveal, image crop shifts, and page transitions only. |
| decoration | Very low. Rules, captions, margins, and crop choices do the work. |
| contrast | Warm monochrome or quiet color with strong text contrast. |
| radius | 0-8px. Usually square imagery and small-radius controls. |
| type | Editorial serif or high-quality grotesk; strong body typography. |
| assets | Large editorial images, portraits, art objects, case-study stills, captioned media. |


## Signature System

- Authored Margin: asymmetrical margins and captions create identity without decoration.
- One Strong Typographic Move: oversized title, column grid, drop cap, or index system, then restraint.
- Quiet Proof: case studies, essays, products, or archive entries are presented as editorial material.
- Breathing Navigation: nav can be sparse, but must remain visible and usable.

## Source Archetypes

Pick one primary archetype. Do not average all five into a neutral template.

### Additional Refero Source Packs

- Substack publication gateway: `#FF6719`, ink `#363737/#232525`, muted `#777777/#B6B6B6`, canvas `#FFFFFF`, line `#EEEEEE/#C8C8C8/#E6E6E6`; 4px base; cards 8px, inputs 12px, buttons 9999px; shadow `0 4px 6px -1px rgba(0,0,0,.1)`.
- Medium essay canvas: `#f7f4ed/#ffffff/#191919/#242424/#333333/#6b6b6b`, success/action `#50B33A`; 8px base, 64px sections, pill buttons 9999px; no shadow.
- Silencio achromatic minimal: `#FFFFFF/#000000/#DBDAD9/#808080`; 29px card padding, 6-14px element rhythm; cards 7.2px, buttons 129.6px; no heavy shadow.
- Asana flat product editorial: `#0d0d0d/#ffffff/#f3f3f3/#e7e7e7`, accents `#222875/#ffeaec/#690031/#ff584a/#cbefff`; max-width 1200px, sections 80-120px; no shadows.
- Public finance editorial: `#000/#fff/#e9edf3/#262626/#dce2ea/#0027b3/#95d0ff`; radii 4/8/12/16/100/999px; 8px element rhythm; tinted CTA shadow only.

### 1. Blank Page Achromatic

Source basis: OpenAI.

Use when the brand should feel modern, confident, AI-native, and high-trust. The page behaves like a pure white sheet where words and curated media carry all chroma.

Raw signals:

- Canvas: `#ffffff`.
- Ink: `#000000`.
- Secondary: `#666666`.
- Tertiary: `#8f8f8f`.
- Border: `#e5e7eb`.
- Hover fill: `#f1f1f1`.
- Max width: about `1200px`.
- Nav height: about `64px`.
- Section gap: `64-80px`.
- Card padding when present: `32px`.
- Media radius: exact `6.08px`.
- Button and input radius: `9999px`.
- Type: OpenAI Sans, Inter, or DM Sans fallback.
- Type sizes: `13, 14, 16, 17, 18, 22, 28, 48px`.
- Display: `48px`, weight `500/600`, line-height `1.16`, tracking near `-0.03em`.

Carry forward:

- Color appears through images and content, not through UI chrome.
- Buttons are black filled pills or ghost pills with pale borders.
- Editorial cards have no background, no shadow, no border; image crop and metadata do the work.
- A centered conversational input can become a first-viewport proof object.
- Footer columns use a top rule and small typographic hierarchy.

Avoid:

- Blue, green, or orange UI accents.
- Background bands used to break up boredom.
- Medium default radii such as `12px`, `16px`, `24px`.
- Image placeholders, stock people, hard literal photos.
- Shadows on article cards.

Mini token pack:

```css
:root {
  --em-canvas: #ffffff;
  --em-surface: #ffffff;
  --em-ink: #000000;
  --em-text-secondary: #666666;
  --em-text-tertiary: #8f8f8f;
  --em-rule: #e5e7eb;
  --em-hover: #f1f1f1;
  --em-radius-media: 6.08px;
  --em-radius-control: 9999px;
  --em-max-page: 1200px;
}
```

### 2. Research Journal On Warm Stone

Source basis: Anthropic.

Use for research labs, institutional AI, policy, academic products, civic technology, and serious editorial brands. This archetype should feel like a research journal translated into an interface.

Raw signals:

- Canvas: `#faf9f5`, never pure white.
- Ink: `#141413`, not pure black.
- Mid slate: `#3d3d3a`.
- Muted text: `#87867f`.
- Muted border: `#b0aea5`.
- Divider: `#d1cfc5`.
- Warm surfaces: `#f0eee6`, `#e3dacc`.
- Text on dark: `#e8e6dc`.
- Reserved accent: `#d97757`.
- Section gap: about `61px`.
- Card padding: about `31px`.
- Element gaps: `8-16px`.
- Radius: `8px` small cards, `16px` panels, `24px` feature cards.
- Type: Anthropic Sans or Inter for UI; Anthropic Serif, Playfair Display, or Lora for editorial moments; JetBrains Mono or IBM Plex Mono for metadata.
- Sans display: about `61px`, `700`, tracking `-0.02em`.
- Serif editorial sizes: `18, 20, 24, 91px`.
- Mono labels: small, structured, category/date fields.

Carry forward:

- Use underline as the signature emphasis system.
- Reserve serif for feature cards, pullquotes, and editorial content moments.
- Use mono metadata for `DATE`, `CATEGORY`, `STATUS`, `METHOD`, or research labels.
- Dark editorial cards should interrupt the warm canvas like printed plates.
- Accent is earthy and rare; it should never become a full UI theme.

Avoid:

- Pure white background.
- Pure black body text.
- Colored highlight blocks behind words.
- All-serif layouts.
- Turning every card dark.
- Soft shadows and glass effects.

Mini token pack:

```css
:root {
  --em-canvas: #faf9f5;
  --em-surface: #f0eee6;
  --em-surface-deep: #e3dacc;
  --em-ink: #141413;
  --em-text-secondary: #3d3d3a;
  --em-text-muted: #87867f;
  --em-rule: #d1cfc5;
  --em-dark: #141413;
  --em-on-dark: #e8e6dc;
  --em-accent-reserved: #d97757;
  --em-radius-card: 16px;
  --em-radius-feature: 24px;
}
```

### 3. Architectural Blueprint Minimal

Source basis: Legend.

Use for architectural tools, design-led technical products, precise studios, and brands that should feel measured. This is the technical edge of Editorial Minimal.

Raw signals:

- Canvas: `#ededed`.
- Panel: `#dedddc`.
- Ink: `#000000`.
- Deep panel: `#131313`.
- Button gray: `#2d2d2d`.
- Outline: `#474747`.
- Muted: `#6c6c6c`, `#949494`, `#b2b2b2`.
- Accent violet: `#8931c4`.
- Max width: about `1416px`.
- Section gap: `68px`.
- Card padding: `20px`.
- Element gap: `20px`.
- Base unit: `4px`.
- Radius: `4px` controls, `12px` nav items, `32px` slab cards.
- Type: knapp or Inter fallback.
- Mono: diatypeMono or Space Mono at `11/13px`, tracking `0.06em`.

Carry forward:

- Violet is an edge signal: focus rings, tags, active coordinates, data marks.
- Use mono labels as coordinates, not decoration.
- Large `32px` cards can work when the surface remains stark and shadowless.
- Desaturated gradients may appear rarely as tonal background, never as colorful SaaS mood.
- Dark contrast blocks create editorial rhythm against warm gray.

Avoid:

- Saturated secondary colors.
- Broad violet fills.
- Soft gradients and glow.
- Heavy drop shadows.
- Random type scales.
- Many radii beyond the defined roles.

Mini token pack:

```css
:root {
  --em-canvas: #ededed;
  --em-panel: #dedddc;
  --em-ink: #000000;
  --em-dark: #131313;
  --em-button: #2d2d2d;
  --em-rule: #b2b2b2;
  --em-text-muted: #6c6c6c;
  --em-accent-signal: #8931c4;
  --em-radius-control: 4px;
  --em-radius-nav: 12px;
  --em-radius-slab: 32px;
}
```

### 4. Editorial SaaS Clarity

Source basis: Intercom.

Use when a product page needs conversion and warmth without falling into generic SaaS. This archetype keeps the editorial surface but gives product actions enough clarity.

Raw signals:

- Canvas: `#ffffff`.
- Off-white: `#faf9f6`.
- Cream: `#f1eee9`.
- Border sand: `#dedbd6`.
- Subtle gray: `#e7e3db`.
- Beige: `#d3cec6`.
- Headline black: `#111111`.
- Body black: `#000000`.
- Secondary: `#414141`, `#585858`, `#666666`.
- Placeholder: `#a0a0a0`.
- Interaction violet: `#0007cb`.
- Tiny emphasis orange: `#ff5600`.
- Section gap: `48px`.
- Card padding: `16px`.
- Element gap: `16px`.
- Radius: `4px` controls; tabs use underline/bottom border.
- Type: Saans or system-ui fallback, weights `300/400`.
- Display: `54/80px`, line-height near `1`.
- Mono: SaansMono or SFMono with strong positive tracking.

Carry forward:

- Black primary CTA first; violet can appear on hover, focus, active, or selected states.
- Orange is word-level emphasis, not a button fill.
- Warm off-white surfaces create rhythm without decorative bands.
- Tabs and underlines are better than heavy card chrome.
- Light display weights keep product copy refined.

Avoid:

- Multiple saturated accents.
- Large orange blocks.
- Heavy card shadows.
- Sharp zero-radius controls when the archetype expects `4px`.
- Generic three-card feature rows with icon badges.

Mini token pack:

```css
:root {
  --em-canvas: #ffffff;
  --em-surface-warm: #faf9f6;
  --em-surface-cream: #f1eee9;
  --em-rule: #dedbd6;
  --em-ink: #111111;
  --em-body: #000000;
  --em-text-secondary: #585858;
  --em-text-muted: #666666;
  --em-action: #111111;
  --em-action-interaction: #0007cb;
  --em-inline-emphasis: #ff5600;
  --em-radius-control: 4px;
}
```

### 5. Porcelain Product Minimal

Source basis: Limitless.

Use for AI/productivity, personal hardware/software, memory tools, and controlled innovation pages where the product should feel advanced without spectacle.

Raw signals:

- Page graphite: `#0f172a`.
- Secondary: `#334155`.
- Body: `#475569`.
- Receding links: `#64748b`.
- Divider: `#d1d5db`.
- Porcelain: `#e5e7eb`.
- Snowdrift: `#f2f3f5`.
- Violet signal: `#8a53e1`.
- Base unit: `8px`.
- Section gap: `48-64px`.
- Card padding: `16px`.
- Element gap: `8px`.
- Radius: `8px` default, `16px` cards, `9999px` buttons.
- Type: Greycliff or Inter fallback.
- Display: `60px`, `600`, line-height `1`.
- Body: `16px`, line-height `1.5`.
- Tracking: `-0.025em` across the system.

Carry forward:

- Use graphite and slate instead of pure black.
- Violet is a logo/icon/action signal, not a broad theme.
- Single typeface discipline creates the seriousness.
- One subtle large shadow is acceptable when it clarifies a product card.
- Pill buttons belong here, but only inside a restrained palette.

Avoid:

- Extra bright colors.
- Decorative backgrounds.
- Multiple typefaces.
- Heavy elevation or glow.
- Loose tracking.
- Generic rectangular CTAs.

Mini token pack:

```css
:root {
  --em-canvas: #e5e7eb;
  --em-surface: #f2f3f5;
  --em-ink: #0f172a;
  --em-text-secondary: #334155;
  --em-body: #475569;
  --em-link-muted: #64748b;
  --em-rule: #d1d5db;
  --em-accent-signal: #8a53e1;
  --em-radius-default: 8px;
  --em-radius-card: 16px;
  --em-radius-pill: 9999px;
}
```

## Differentiation

Use Editorial Minimal when minimal editorial pages, portfolios, cultural sites, calm brand systems, writing-heavy layouts, refined landing pages. If removing the captioned media or editorial index, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `minimal-design` when restraint is not editorial; use `editorial-type` when type should be louder and structural.
## Semantic Token Model

Replace raw source dumps with semantic roles. Define only the roles the project actually needs.

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-subtle: #f1f1f1;
  --surface-inverse: #000000;
  --text-primary: #000000;
  --text-secondary: #666666;
  --text-muted: #8f8f8f;
  --text-inverse: #ffffff;
  --rule-subtle: #e5e7eb;
  --rule-strong: #000000;
  --action-primary: #000000;
  --action-on-primary: #ffffff;
  --accent-signal: #000000;
  --focus-ring: #000000;
  --state-warning: #8f5a2a;
  --state-error: #9b1c1c;
  --state-success: #2f5d46;
  --radius-media: 6.08px;
  --radius-control: 9999px;
  --radius-panel: 0px;
  --space-section: 80px;
  --space-module: 32px;
  --space-control: 12px;
  --motion-fast: 140ms;
  --motion-base: 240ms;
  --motion-slow: 520ms;
  --ease-editorial: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Rules:

- Use `accent-signal` only when the chosen archetype permits one.
- Never let semantic colors become decorative accents. Error, warning, and success should appear in form messages, alert rules, tiny status dots, or textual labels.
- Give every gray a job. Do not use one pale gray for borders, disabled text, captions, and surfaces.
- Use `surface-inverse` as an editorial beat, not a default section alternation.

### Execution Token Contract

Every Editorial Minimal build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #f8f6f1;
  --surface: #ffffff;
  --surface-muted: #eee9df;
  --text: #151515;
  --text-muted: #6f6a62;
  --line: #d8d2c7;
  --action: #151515;
  --action-strong: #000000;
  --radius-control: 4px;
  --radius-card: 6px;
  --radius-panel: 0px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Tiempos Text", Georgia, serif;
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
  --status-neutral-fg: #6f6a62;
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

| Tailwind default | Editorial Minimal token |
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

Token rule: if a value can be expressed by `em`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.

## Typography System

Editorial Minimal typography should look authored even when using common fallback fonts.

Additional type references: use `gt-super 120px/0.83/-6.6px`, `Times Now 30-120px` with line-height `.78-1`, `PP Editorial New 48/62`, `Spectral 19px`, `Diatype 12-54px`, or `Geist 10-60px` only when the chosen source calls for that voice. Body measures stay 700-900px for essays and 1200px max for product-editorial proof.

Core roles:

- Display: first viewport or section-opening headline. Usually sans, occasionally serif in research/journal mode.
- Editorial serif: feature cards, pullquotes, research teasers, long-form chapter titles. Avoid all-serif systems unless requested.
- Body: readable, quiet, `16-18px`, line-height `1.45-1.65`.
- Metadata: `11-13px`, mono or tightly controlled sans, used for dates, categories, coordinates, issue numbers, product status.
- Caption: `12-14px`, modest contrast, often aligned to media edge or grid margin.
- Control: `13-16px`, medium enough to read, never tiny for sophistication.

Recommended defaults:

```css
:root {
  --font-sans: Inter, "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif: Lora, "Playfair Display", Georgia, serif;
  --font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;
  --text-caption: 13px;
  --text-label: 14px;
  --text-body: 16px;
  --text-lead: 18px;
  --text-section: 28px;
  --text-display: 48px;
  --leading-display: 1.08;
  --leading-body: 1.55;
  --tracking-display: -0.03em;
  --tracking-tight: -0.01em;
  --tracking-mono: 0.06em;
}
```

Type decisions by archetype:

- Blank Page Achromatic: one sans, three weights, `48px` display, small positive labels, media brings color.
- Research Journal: sans UI, serif editorial features, mono metadata, thick underline for emphasis.
- Architectural Blueprint: slightly condensed sans plus mono coordinates; avoid soft display serif.
- Editorial SaaS: light sans display, mono technical labels, active underline tabs.
- Porcelain Product: one tight sans, graphite/slate hierarchy, pill controls.

## Layout Canvas

Editorial Minimal pages need visible editing. Use fewer sections, but give each section a composed role.

First viewport requirements:

- Navigation is part of the visual system: sparse, docked, ruled, or pill-based, but not browser-default.
- H1 names the product, institution, project, category, or offer clearly.
- The proof object is inspectable: product UI, editorial image grid, research card, archive index, conversational input, table, or material photo.
- Primary action is visible and states are defined.
- The bottom of the viewport reveals the next rhythm: a row, grid, caption, border, image edge, index, or card.

Layout patterns:

- Authored margin: main content sits in a controlled center column while captions occupy a side rail.
- Editorial index: rows use date, category, title, and status as interface structure.
- Quiet split: one strong text column, one proof/media column, with measured gap.
- Image chapter: large media block with caption, source, and a following text column.
- Research plate: dark card or inverse section embedded in a warm paper flow.
- Conversational sheet: centered input and suggested prompts on a pure canvas.

Stable responsive rules:

- On mobile, reduce columns before reducing readable type.
- Do not keep desktop H1 wrapping if it creates orphan words or overflow.
- Captions can move below images, but they must remain connected.
- Side rails become ordered metadata rows.
- Avoid text over images unless contrast is guaranteed without blur.

## Component Signatures

Use at least four for a complete page. Components must contain real content and complete states.

### Refero Expansion Component Deltas

- Publication CTAs use pills: Substack and Medium buttons are 9999px, Silencio uses 129.6px, Public permits 100/999px. Keep editorial cards flat unless the source explicitly allows the Substack soft shadow.
- Product-editorial sections use one proof object: Asana/ Public can use a 1200px product frame or finance module, but keep background fills neutral and spacing 80-120px.
- Inputs/search inherit source radius: Substack 12px inputs, Silencio 7.2px cards with pill buttons, Public 4/8/12/16px hierarchy.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type EditorialMinimalState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type EditorialMinimalStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function EditorialMinimalStatusPill({ role, children }: { role: EditorialMinimalStatus; children: React.ReactNode }) {
  return <span className="editorial-minimal-status-pill" data-role={role}>{children}</span>;
}

export function CaptionedMediaBlockContract({ state = "default" }: { state?: EditorialMinimalState }) {
  return <section className="editorial-minimal-hero-object" data-state={state} aria-label="Editorial Minimal proof object" />;
}

export function EditorialIndexRowContract({ title, meta, state = "default" }: { title: string; meta: string; state?: EditorialMinimalState }) {
  return <article className="editorial-minimal-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function QuietCtaBarContract({ items }: { items: string[] }) {
  return <nav className="editorial-minimal-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function EditorialMinimalSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="editorial-minimal-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.editorial-minimal-status-pill {
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
.editorial-minimal-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.editorial-minimal-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.editorial-minimal-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.editorial-minimal-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.editorial-minimal-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.editorial-minimal-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.editorial-minimal-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.editorial-minimal-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.editorial-minimal-card[data-state="error"] { border-color: var(--status-danger-fg); }
.editorial-minimal-card > span { font: var(--type-meta); color: var(--text-muted); }
.editorial-minimal-card > strong { font: var(--type-card); color: var(--text); }
.editorial-minimal-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.editorial-minimal-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.editorial-minimal-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.editorial-minimal-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.editorial-minimal-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.editorial-minimal-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.editorial-minimal-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .editorial-minimal-hero-object { min-height: 280px; }
  .editorial-minimal-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Captioned Media Block

Purpose: proof, editorial pacing, and visual authority.

Structure:

- Media has a fixed aspect ratio such as `4 / 3`, `16 / 10`, or `1 / 1`.
- Caption includes title, source/category, short annotation, and optional index number.
- The caption aligns to the media edge or a side rail; it is never a loose paragraph below a stock image.
- Media radius follows the archetype: `6.08px`, `0px`, `16px`, or `32px`.

States:

- Loading: neutral placeholder with a caption skeleton and no color shimmer.
- Hover/focus: crop shifts `2-4%` or caption rule draws in.
- Selected/current: stronger rule, weight change, or inverse caption chip.
- Error: keep the frame, show a text recovery action.

### Editorial Index Row

Purpose: archive navigation, case studies, research, product updates, or cultural listings.

Structure:

- Columns: number/date, category, title, short detail, action/status.
- Row height is stable, usually `56-88px` desktop.
- Use top/bottom rules instead of cards.
- Long titles wrap on mobile, not clipped.

States:

- Hover: title weight increases or underline appears.
- Focus: visible rule or outline.
- Active/current: row inverts or receives a stronger left rule.
- Empty: show one explanatory row and a next action.
- Loading: row skeleton with fixed column widths.

### Quiet CTA Bar

Purpose: conversion without sales noise.

Structure:

- One exact action label, one reassurance line, optional secondary text link.
- Can be ruled top/bottom, inverse, or warm-surface based.
- Avoid badge clutter.

States:

- Hover: underline, inversion, or border draw.
- Focus: clear outline or inner rule.
- Disabled/loading: preserve button width; use text state.
- Success: replace reassurance line with a confirmation phrase, using typographic state rather than green fill.

### Research Feature Card

Purpose: institutional proof, long-form article, lab note, or report.

Structure:

- Warm or dark surface.
- Serif title if using Research Journal.
- Mono metadata footer with date/category/method.
- No generic icon stack.

States:

- Hover: title underline or metadata rule brightens.
- Focus: card outline, not shadow.
- Error/loading if data-driven: skeleton metadata rows and a plain-language recovery.

### Margin Note

Purpose: contextual annotation, source note, or product caveat.

Structure:

- Small text, stable width, aligned to a grid rail.
- Can include mono index, short caption, source, or timestamp.
- Should not exceed `22-32ch`.

States:

- Hover/focus can reveal a longer note in a popover if needed.
- On mobile, it becomes an inline note with a top rule.

### Typographic Table

Purpose: comparisons, specs, research metrics, product details, changelog data.

Structure:

- Header uses metadata style, not bold default table chrome.
- Rows are divided by rules.
- Numeric columns align.
- Empty and error states occupy the same table frame.

States:

- Sort active: underline header or invert a tiny marker.
- Hover row: surface lift by gray only, no chromatic fill.
- Selected row: left rule or full inversion.

### Text-Led Footer

Purpose: designed closure, not a junk drawer.

Structure:

- Repeat the main type logic.
- Include contact/action, concise nav groups, legal text, and one editorial note or index.
- Use top rule or inverse block based on archetype.

States:

- Links use underline, weight, or inversion.
- Focus states must be visible in the same grammar as navigation.

## State Patterns

Editorial Minimal states should remain achromatic or typographic unless the state is genuinely semantic.

Preferred state vocabulary:

- Hover link: underline appears, thickens, or shifts offset.
- Hover row: title weight `400 -> 500`, metadata darkens, rule strengthens.
- Hover media: image crop shifts while the frame size stays stable.
- Focus: `1px` or `2px` outline in ink, slate, violet signal, or archetype accent.
- Active: inversion, bottom rule, or selected row weight.
- Disabled: reduced contrast plus cursor/ARIA state; label remains readable.
- Loading: fixed-size skeleton using surface and rule tokens.
- Empty: written recovery row, not blank silence.
- Error: border/rule and message; use muted red only where needed.
- Success: confirmation text, check icon, or stronger rule; no generic colored SaaS styling.

Example:

```css
.em-link {
  color: var(--text-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: .22em;
  transition: text-underline-offset 160ms ease, color 160ms ease;
}
.em-link:hover,
.em-link:focus-visible {
  text-underline-offset: .36em;
}
.em-row[aria-current="page"] {
  background: var(--text-primary);
  color: var(--text-inverse);
}
.em-control[aria-invalid="true"] {
  border-color: var(--state-error);
}
.em-control[data-complete="true"] {
  border-color: var(--rule-strong);
  font-weight: 500;
}
```

## Motion Grammar

- Editorial Minimal motion is restrained: 150-300ms opacity, color, border, and small translate only. No parallax by default; no spring motion; large gradient or animated media is source-specific and should be disabled under `prefers-reduced-motion`.

## Complete Page Protocols

```tsx
// Research Landing
<main data-skill="editorial-minimal" data-archetype="research-landing">
  <EditorialMinimalNav mode="quiet" />
  <CaptionedMediaBlockContract title="Model behavior notes" meta="Research / 2026" />
  <EditorialIndexRowContract title="Methods, traces, artifacts" meta="12 entries" />
  <MarginNoteContract>Primary evidence stays captioned and inspectable.</MarginNoteContract>
</main>

// Calm Portfolio Archive
<main data-skill="editorial-minimal" data-archetype="calm-portfolio-archive">
  <ImageChapterContract title="Selected work" meta="2019-2026" />
  <CaseStudyListContract items={["Identity", "Interface", "Publication"]} />
  <QuietCTABarContract action="Discuss a project" />
</main>
```
```tsx
// Research Landing
<main data-skill="editorial-minimal" data-archetype="research-landing">
  <EditorialMinimalNav mode="quiet" />
  <CaptionedMediaBlockContract title="Model behavior notes" meta="Research / 2026" />
  <EditorialIndexRowContract title="Methods, traces, artifacts" meta="12 entries" />
  <MarginNoteContract>Primary evidence stays captioned and inspectable.</MarginNoteContract>
</main>

// Calm Portfolio Archive
<main data-skill="editorial-minimal" data-archetype="calm-portfolio-archive">
  <ImageChapterContract title="Selected work" meta="2019-2026" />
  <CaseStudyListContract items={["Identity", "Interface", "Publication"]} />
  <QuietCTABarContract action="Discuss a project" />
</main>
```
Motion should feel like editorial handling: line, crop, mask, turn, reveal. Use it to orient the reader or confirm state.

Allowed primitives:

- Line-mask reveal: display lines reveal through `clip-path` or overflow masks.
- Caption reveal: caption slides within its reserved space.
- Image crop shift: media scales `1.02` or object-position moves while frame stays fixed.
- Border draw: rules scale from left or center.
- Inversion swap: button or row flips foreground/background.
- Page-turn transition: section enters by rule + text mask, not generic fade.

Timing:

- Hover feedback: `120-180ms`.
- Border draw: `180-260ms`.
- Caption reveal: `220-320ms`.
- Image crop: `420-700ms`.
- Line-mask page reveal: `480-760ms`.

CSS primitive:

```css
.em-line-mask {
  display: block;
  overflow: hidden;
}
.em-line-mask > span {
  display: inline-block;
  transform: translateY(110%);
  transition: transform 620ms cubic-bezier(0.16, 1, 0.3, 1);
}
.is-visible .em-line-mask > span {
  transform: translateY(0);
}
.em-media img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  transition: transform 620ms cubic-bezier(0.16, 1, 0.3, 1), object-position 620ms cubic-bezier(0.16, 1, 0.3, 1);
}
.em-media:hover img,
.em-media:focus-within img {
  transform: scale(1.025);
}
@media (prefers-reduced-motion: reduce) {
  .em-line-mask > span,
  .em-media img {
    transform: none !important;
    transition-duration: .01ms !important;
  }
}
```

Avoid:

- Generic fade-up on every section.
- Parallax over long reading.
- Decorative looping lines.
- Motion that delays reading or hides controls.


## Absolute Bans

- No default centered stack repeated down the page.
- No empty page sold as restraint.
- No hiding primary action or navigation for aesthetic quietness.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`. For expanded implementation examples, load `references/advanced-implementation-notes.md` only after the archetype and token pack are chosen.

## Anti-Slop Rules

Reject:

- Empty pages sold as restraint.
- Generic centered hero plus three feature cards.
- Default SaaS blue CTAs unless a source archetype explicitly supports blue for action.
- Untuned Inter with no display/body/metadata role.
- Stock imagery used as sophistication.
- Cards inside cards.
- Shadows as the main hierarchy.
- Accent colors spread across icons, links, buttons, and headings.
- Text too pale to read.
- Motion without role.
- Hidden navigation or weak conversion for the sake of quietness.

Repair:

- If it feels empty, add proof and a stronger index, not decoration.
- If it feels generic, pick a stricter archetype and commit to its radius, canvas, and type roles.
- If it feels too SaaS, replace icon cards with rows, captions, media, and tables.
- If it feels too editorial for a product, add workflow proof and action states.
- If it feels cold, warm the canvas or improve copy before adding colors.

## Pre-Output Checklist

- First viewport contains a real captioned media or editorial index.
- One Editorial Minimal archetype is clearly dominant.
- Execution tokens are declared and component CSS
