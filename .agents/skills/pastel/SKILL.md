---
name: pastel
description: "Use this skill to create soft, warm, approachable, high-contrast pastel websites and interfaces with tinted canvases, readable near-black text, disciplined accent roles, generous spacing, soft components, and calm motion. USE FOR: calm SaaS, wellness, DTC food or beverage, creator platforms, marketplaces, community pages, friendly onboarding, gentle product experiences. DO NOT USE FOR: unrelated backend work, non-visual tasks, harsh cyber/dark aesthetics, or when an existing product design system must be followed exactly."
---

# Pastel

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Pastel archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, soft guided product card, friendly form, category path, or community proof, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Pastel components with states.
7. **Motion plan:** gentle buoyant transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Create soft interfaces that remain readable, structured, and useful. Pastel does not mean low contrast, candy rainbows, or weak CTAs. The strongest pastel systems use warm or cool-tinted canvases, a small number of surface colors, one decisive action color, mature typography, generous spacing, and motion that feels gentle rather than sleepy.

Use pastel design when the user asks for soft, warm, calm, approachable, friendly, optimistic, wellness, creator-friendly, DTC, community, light SaaS, gentle onboarding, or friendly commerce.


## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium. Friendly pages need enough content and guidance. |
| motion | Low-medium. Gentle hover, soft reveal, buoyant product interactions. |
| decoration | Medium. Soft shapes and color blocks can guide, but keep hierarchy clear. |
| contrast | Pastel surfaces with dark readable type and strong CTA color. |
| radius | 18-32px for friendly panels, 999px for pills. |
| type | Rounded sans or warm grotesk, sometimes friendly serif. |
| assets | Soft product imagery, illustrated objects, lifestyle photos, friendly icons. |

## Signature System

- Pastel Contrast Discipline: pastel belongs in backgrounds and fills, not long text.
- Soft Pathways: each color can represent a step, audience, category, or product family.
- Friendly Tactility: rounded modules, soft shadows, and gentle press states create warmth.
- Adult Softness: use refined typography and spacing to avoid toy-like outcomes.

## Differentiation

Use Pastel when soft consumer brands, wellness, friendly SaaS, playful products, approachable commerce, community pages. If removing the soft guided product card, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `playful-design` for tactile game-like surfaces; use this when softness, reassurance, and friendly color paths are the emotional target.

### Execution Token Contract

Refero ready-to-use deltas from Contractbook/Equals/Wealthsimple:
- Token roles: Contractbook `#ffffff/#f7f7f3/#f0f0ec/#d4d4d0/#6d6868/#1a1a1a/#ffba09`; Equals `#faf9f5/#000000/#ffcc00/#b074ce/#20a277/#2dcbdc/#ff3716/#0000bb`; Wealthsimple `#fcfcfc/#32302f/#686664/#e4e2e1/#eeece7/#f1f0f0/#d3e5f3/#afaaa7`.
- Type roles: Contractbook Abcwhyte 11-48px, Equals Serrif Condensed 40/48/110px plus Unica77 14-24px, Wealthsimple `the-future` UI with `tiempos` 14-84px.

Every Pastel build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #fff8f2;
  --surface: #ffffff;
  --surface-muted: #ffe8f0;
  --text: #252018;
  --text-muted: #746a62;
  --line: #f2d8c8;
  --action: #ff7aa2;
  --action-strong: #7c5cff;
  --radius-control: 999px;
  --radius-card: 24px;
  --radius-panel: 32px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Nunito Sans", "Recoleta", var(--font-sans);
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
  --shadow-card: 0 10px 28px rgba(64,48,36,.08);
  --shadow-panel: 0 22px 70px rgba(255,122,162,.16);
  --shadow-hero: 0 42px 120px rgba(124,92,255,.18);
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
  --status-neutral-fg: #746a62;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --pastel-font-display: var(--font-display);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Pastel token |
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

Token rule: if a value can be expressed by `p`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Non-Negotiables

- Body text uses a tinted near-black or deep color, never a pale pastel.
- Pastel colors are mostly backgrounds, cards, highlights, and mood surfaces.
- One primary CTA color owns action.
- Decorative pastel colors do not become button colors unless explicitly promoted to the CTA role.
- Pure white may be a card surface, but the page should usually sit on a tinted canvas.
- Shadows stay minimal. Depth comes from color layers, spacing, borders, and radius.
- Softness must survive forms, pricing, error states, mobile, and dense content.

## Source Correction

Some source notes captured the GRAZA Grove Green token as a five-character hex value. Interpret that token as a deep desaturated green and use `#3f4a24` unless the project provides an official brand value. Do not output malformed hex colors.

## Source Archetypes

Choose one primary archetype. Do not combine all pastel dialects in one page.

### Additional Refero Source Packs

- Contractbook soft-yellow professional: `#ffffff/#f7f7f3/#f0f0ec/#d4d4d0/#6d6868/#1a1a1a`, CTA `#ffba09`; spacing 5-60px, section 60px, card padding 14px, element gap 14px; tags 9999px, cards 24px, images 40px, inputs 4.375px, buttons 999px. Keep yellow as primary action, not background wash.
- Equals pastel spreadsheet cells: page `#faf9f5`, ink `#000000`, analyst yellow `#ffcc00`, orchid CTA `#b074ce`, green `#20a277`, glacier `#2dcbdc`, revops red `#ff3716`, navy `#0000bb`; 1200px max, 80-120px sections, 24px cards, 12-20px gaps; CTA 60px, tags 50px, inputs 0px.
- Wealthsimple muted pastel finance: `#fcfcfc/#32302f/#686664/#e4e2e1/#eeece7/#f1f0f0/#d3e5f3/#afaaa7`; `the-future` UI with `tiempos` serif 14-84px at `-0.01em`; 40-48px sections, 8px gaps, cards/inputs 100px, buttons 1600px; pastel blue is an information surface.
- State transfer: Contractbook selected/primary is `#ffba09`; Equals success/error/info states are `#20a277/#ff3716/#2dcbdc`; Wealthsimple hover moves between `#eeece7` and `#f1f0f0` without lowering text contrast.

- Ease Health calm green care: `#0f3e17/#fffefc/#b1dbb8/#b6ced5/#e1f4df/#e5e7eb`; Suisseintl 12-56px with `-0.03em`, Faire Octave 40/74px; 42px sections/cards, 21px gaps; cards 14px, badges 999px; flat mint/slate/keylime cards.
- Cycle segmented pastel product: ink `#171618`, role colors `#38296c/#004d60/#6c4800`, surfaces `#f5f0ff/#defafe/#fff6e1`; Inter plus Eudoxus Sans; 1447px max, 64px sections, 22px cards, 16px gaps; cards 20px, buttons 10px, badges 100px.
- Geniestudio Arctic pastel SaaS: `#181d27/#fafdff/#ebf5ff/#0a0d12/#0069e0` plus pastel gradients; Geist UI, Aeonik display; 8px base, 24px sections, 40px cards; radius cards/buttons 32px, badges 90px.
- Together AI dark-pastel blocks: `#010120/#ffffff`, blocks `#C1DFF9/#FDE3F6/#FFDCCD/#C8F6F9`, accent `#BDBBFF`; The Future plus PP Neue Montreal Mono; 4px base, radii 4/8/16px, cards 20px, dark cards `rgba(255,255,255,.08)`.
- FORA warm lilac editorial: `#ffffff/#000000/#a9553c/#a04d35/#ddbdea/#ffffff59`; Theinhardt 15/18/23/35px; 6px base, 25px card padding; 0px blocks, 5px secondary, 9999px tags.

### Architectural Blueprint

Inspired by Pastel. Use for calm SaaS, productivity, design tools, documentation-like product pages, and soft technical products.

| Trait | Rule |
| --- | --- |
| Hex | `#f5f5f4` canvas, `#ffffff` card, `#111111` text, `#222222` secondary, `#78716b` muted, `#e6e3e2` border, `#165dfb` CTA |
| Type | Figtree-like single family, weights 400/500/600; display 58px/1; body 16px/1.43 |
| Radius | 4px tags, 8.8px default, 10px buttons, 15px prominent, 120px round |
| Spacing | section gaps 68-70px, spacious density, no tiny type below 14px |
| Carry forward | one vivid blue CTA, decimal radius, transparent/quiet cards, product screenshots |
| Avoid | extra saturated colors, heavy shadows, dense sections, generic gray Tailwind look |

This is the most disciplined pastel SaaS model: soft achromatic base plus one vivid action.

### Warm Creative Toolkit

Inspired by Palette Supply. Use for creative tools, design resources, portfolios, agencies, and palette/product libraries.

| Trait | Rule |
| --- | --- |
| Hex | `#f2f0e9` canvas, `#ffffff` paper, `#141212` text, `#a1a0a0` muted, `#d7d7c8` sage, `#3f593d`, `#3051a8` CTA, `#e0b9b1`, `#863a29`, `#e4b357` decorative |
| Type | PPSupply-like light UI, esbuild-like display 64px, mono captions |
| Radius | 100px buttons/inputs, 12px cards/images, 1000px tags |
| Spacing | 72px section gaps, 8px element gaps, 20px card padding with large exceptions |
| Carry forward | warm cream canvas, 100px pills, light custom type, earth-tone decorative blocks |
| Avoid | multiple vivid CTAs, sharp corners, strong shadows, default link blue |

The signature is extreme pill controls on a warm creative canvas.

### Pastel Cloud Dreamscape

Inspired by Recess. Use for DTC beverage, lifestyle, wellness, calm aspirational brands, and cloud-like atmospheric pages.

| Trait | Rule |
| --- | --- |
| Hex | `#25385b` text, `#0a0a3a` deep footer, `#a2b0ff` button, `#3252f4` secondary brand, `#ff5a5a` alert/promo only, `#fffcef`, `#ffffff`, `#84849c` |
| Type | Sharp Grotesk-like single family, weights 400/500/700; 60px display |
| Radius | 0px buttons/cards; 50% circular icons |
| Spacing | 48-80px section gaps, 8px interaction gap, full-bleed gradients |
| Carry forward | cyan-violet-rose sky gradients, sharp UI against organic/cloud imagery, lavender CTA with violet text |
| Avoid | strong shadows, extra typefaces, rounded cards, saturated body text |

This proves pastel can be crisp: soft atmosphere with sharp controls.

### Artisanal Provisions

Inspired by GRAZA. Use for food, DTC, pantry, lifestyle commerce, editorial product pages, and craft brands.

| Trait | Rule |
| --- | --- |
| Hex | `#fff4ec` buttermilk, `#f6e6d9` farmhouse, `#3f4a24` deep grove green, `#d1e030` CTA, `#9eef80`, `#fbd535`, `#e8d6c8` |
| Type | condensed serif display 72/102/120px, typewriter body 16-20px, geometric badge font |
| Radius | 8px inputs, 10px buttons/default, 20px images, 9999px badges |
| Spacing | 1440px max width, spacious sections, 24/35px padding multiples |
| Carry forward | buttermilk canvas, green text, zest yellow CTA, 20px photo cards, serif + typewriter tension |
| Avoid | pure black, generic sans headlines, yellow text, sharp interactive controls, heavy shadows |

The CTA uses dark green text on yellow; do not use white on yellow.

### Soft-Edged Digital Canvas

Inspired by Podcorn. Use for marketplaces, content platforms, creator/podcast tools, SaaS with editorial softness.

| Trait | Rule |
| --- | --- |
| Hex | `#fff4f2` canvas, `#ffffff` cards, `#090335` CTA/text, `#132645`, `#ffb0a1`, `#fc736c` special nav/promo, `#434352`, `#8993a2`, `#d8d8d8` |
| Type | Gilroy-like UI with tight tracking, Georgia-like display for sparing headings |
| Radius | 0px buttons/cards, 8px modal exception |
| Spacing | 1105px max width, 75px section gaps, 55-75px card padding, 20px gaps |
| Carry forward | coral canvas, indigo CTA, sharp UI, line illustrations, generous padding |
| Avoid | rounded UI, non-brand saturated colors, heavy shadows, content wider than 1105px |

This is soft color with confident square structure.

### Playful Market Stall

Inspired by Podia. Use for creator platforms, courses, communities, marketplaces, card-heavy feature pages.

| Trait | Rule |
| --- | --- |
| Hex | `#06040e` ink/CTA, `#10242f`, `#ffffff`, `#e1edf2`, `#f5f5f5`, `#a5c8d8`, `#cbb0eb`, `#e39a4d`, `#1f1738`, `#452623`, `#f6ddc4` |
| Type | StabilGrotesk-like single family, 11-60px, progressive negative tracking |
| Radius | 8px links, 16px buttons, 24px misc, 56px cards |
| Spacing | 8px base, 16px gaps, 40px section gap, 56px/80px/120px macro scale |
| Carry forward | multi-pastel feature cards with 56px radius, dark CTA, card color rotation |
| Avoid | arbitrary radii, generic system fonts, gradients, chromatic body text, heavy shadows |

The playfulness comes from big card surfaces, not weak text or many button colors.

## Palette Pairings And Contrast

Use these as starting pairings. Check final contrast if font size, weight, opacity, or background changes.

| Name | Background | Text | CTA | CTA Text | Notes |
| --- | --- | --- | --- | --- | --- |
| Calm Blue SaaS | `#f5f5f4` | `#111111` | `#165dfb` | `#ffffff` | AA-friendly for body and buttons; keep blue for CTA only |
| Warm Toolkit | `#f2f0e9` | `#141212` | `#3051a8` | `#ffffff` | Earth tones decorative; indigo owns action |
| Cloud Lavender | `#ffffff` or soft sky gradient | `#25385b` | `#a2b0ff` | `#25385b` | Dark violet text on lavender passes better than white |
| Artisanal Buttermilk | `#fff4ec` | `#3f4a24` | `#d1e030` | `#3f4a24` | Yellow with green text; avoid yellow text |
| Coral Editorial | `#fff4f2` | `#090335` | `#090335` | `#ffffff` | Firebrick is promo/nav, not main CTA |
| Creator Market | `#f5f5f5` | `#06040e` | `#06040e` | `#e1edf2` | Dark CTA anchors pastel cards |
| Sky Card | `#a5c8d8` | `#06040e` | `#06040e` | `#e1edf2` | Good for feature cards, not long dense paragraphs |
| Plum Card | `#1f1738` | `#f6ddc4` | `#e1edf2` | `#06040e` | Use for one dark accent card, not all content |

Contrast rules:

- Use dark text on pastel fills by default.
- Use white text only on deep indigo, black, plum, cobalt, or similarly dark backgrounds.
- If a pastel button needs white text, darken the button until contrast passes. Otherwise use dark text.
- Do not lower body text opacity below accessible contrast.
- Borders can be subtle; text cannot.
- Focus rings should be darker than the surface or use a double ring.

## Softness Without Low Contrast

Softness comes from:

- tinted canvas instead of pure white
- warm or hue-tinted near-black text
- generous spacing
- low-shadow surfaces
- soft image crops
- gentle type weights
- restrained hover color transitions
- rounded forms where the archetype allows it

Softness does not come from:

- pale gray body text
- low opacity labels
- washed-out CTAs
- transparent buttons with unclear borders
- pastel text on pastel backgrounds
- blurry overlays behind important copy

## Geometry Stances

Choose one stance and keep it.

| Stance | Values | Use |
| --- | --- | --- |
| Decimal Soft | 8.8px default, 10px buttons, 15px prominent | calm SaaS, product pages |
| Extreme Pill | 100px buttons/inputs, 1000px tags | creative tools, soft forms |
| Sharp Pastel | 0px buttons/cards, circle icons | cloud dreamscape, coral editorial |
| Photo Soft | 20px images, 10px controls, 9999px badges | DTC food/lifestyle |
| Market Pill | 16px buttons, 56px cards | creator/card-heavy pages |

Do not mix sharp cards with huge pill cards unless you are intentionally composing two modules with clear roles.

## Type Systems

Refero typography deltas:
- Contractbook: Abcwhyte 400/700, 11-48px, leading 1-1.87.
- Equals: Serrif Condensed large solution heads, Unica77 tight UI.
- Wealthsimple: `the-future` for UI, `tiempos` serif display at `-0.01em`.

Choose one of these:

- Single warm sans: calm SaaS, creator platforms, product pages.
- Custom light UI + display: creative tools, palettes, portfolios.
- Serif display + typewriter/body: artisanal food, craft commerce.
- Sans UI + serif heading: editorial SaaS and creator marketplaces.
- Sharp grotesk single family: cloud/dreamscape lifestyle.

Guidelines:

- Display type usually lives between 40px and 120px.
- Mobile display should stay readable and avoid extreme letter compression.
- Body should start around 15-20px depending on archetype.
- Use display type sparingly if it is highly expressive.
- Do not use more than two primary type families unless the source archetype explicitly supports it.

## First Viewport Protocol

Refero layout deltas:
- Contractbook: section 60px, card/gap 14px, cards 24px, images 40px, inputs 4.375px, buttons 999px.
- Equals: 1200px max, 80-120px sections, 24px cards, 12-20px gaps, buttons 60px, inputs 0px.
- Wealthsimple: 40-48px sections, 8px gaps, cards/inputs 100px, buttons 1600px.

The first viewport must show softness and product value together.

- Navigation uses the same radius/typography rule as buttons.
- H1 names the product, brand, category, or literal offer.
- Body copy is short and high contrast.
- CTA uses the one action color.
- Proof object is real: product screenshot, product photography, program cards, creator dashboard, marketplace grid, booking form, or lifestyle/product image.
- Background can be tinted or gradient, but no text sits on noisy areas.
- Bottom of viewport shows a sliver of next section.
- Mobile reduces decorative assets before shrinking text below readability.

## Component Arsenal

Refero component deltas:
- Contractbook: yellow CTA `#ffba09`, soft professional cards, tags 9999px.
- Equals: spreadsheet cells, orchid CTA `#b074ce`, success/info/error `#20a277/#2dcbdc/#ff3716`.
- Wealthsimple: rounded finance cards, linen inputs, pale blue info panel `#d3e5f3`.

Use at least four for full-page work:

### Refero Expansion Component Deltas

- Pastel colors need text-safe roles: Ease Health dark green text on mint/slate, Cycle purple/teal/brown labels on tinted surfaces, Together AI pastel blocks beside dark ink, Geniestudio blue action over arctic surfaces, FORA terracotta/lilac as brand accents.
- Geometry must stay soft but exact: Ease Health 14/999px, Cycle 10/20/100px, Geniestudio 32/90px, Together AI 4/8/16/20px, FORA 0/5/9999px.
- Avoid childish dilution: use real health/product/community modules, not random rounded stickers. Pastel cards still need states for hover, focus, selected, loading, error, and disabled.

| Component | Purpose |
| --- | --- |
| `PastelHero` | first view with soft canvas, clear CTA, proof object |
| `PastelCTA` | primary action with contrast-safe text |
| `SoftFeatureCard` | product or benefit card with pastel surface |
| `PastelForm` | inputs, validation, submission, trust text |
| `GentleStepper` | onboarding, booking, purchase path, process |
| `PastelProductCard` | DTC/marketplace item with photography or proof |
| `SoftPricingCard` | conversion with readable plan contrast |
| `CommunityStrip` | people/events/social proof in soft rhythm |

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type PastelState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type PastelStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function PastelStatusPill({ role, children }: { role: PastelStatus; children: React.ReactNode }) {
  return <span className="pastel-status-pill" data-role={role}>{children}</span>;
}

export function PastelHeroCardContract({ state = "default" }: { state?: PastelState }) {
  return <section className="pastel-hero-object" data-state={state} aria-label="Pastel proof object" />;
}

export function SoftCategoryPillContract({ title, meta, state = "default" }: { title: string; meta: string; state?: PastelState }) {
  return <article className="pastel-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function FriendlyProductCardContract({ items }: { items: string[] }) {
  return <nav className="pastel-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function PastelSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="pastel-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.pastel-status-pill {
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
.pastel-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.pastel-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.pastel-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.pastel-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.pastel-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.pastel-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.pastel-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.pastel-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.pastel-card[data-state="error"] { border-color: var(--status-danger-fg); }
.pastel-card > span { font: var(--type-meta); color: var(--text-muted); }
.pastel-card > strong { font: var(--type-card); color: var(--text); }
.pastel-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.pastel-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.pastel-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.pastel-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.pastel-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.pastel-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.pastel-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .pastel-hero-object { min-height: 280px; }
  .pastel-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
## Complete Page Protocols

```tsx
// Friendly Commerce
<main data-skill="pastel" data-archetype="friendly-commerce">
  <PastelHeroCardContract product="starter kit" />
  <SoftCategoryPillContract items={["Skin", "Home", "Gifts"]} />
  <FriendlyProductCardContract state="selected" />
  <SoftPricingCardContract plan="Family" />
</main>

// Wellness Flow
<main data-skill="pastel" data-archetype="wellness-flow">
  <GentleStepperContract steps={["Choose", "Book", "Prepare"]} />
  <RoundedFormContract fields={["name", "time", "need"]} />
  <WarmTestimonialContract quote="soft tone with concrete outcome" />
</main>
```

## Signature Components

### PastelHero

```tsx
export function PastelHero() {
  return (
    <section className="pastel-hero">
      <nav className="pastel-nav" aria-label="Primary">
        <a href="/" className="pastel-logo">Kind Studio</a>
        <div className="pastel-nav__links">
          <a href="/programs">Programs</a>
          <a href="/stories">Stories</a>
          <a href="/pricing">Pricing</a>
        </div>
        <a className="pastel-button pastel-button--primary" href="/start">Start today</a>
      </nav>
      <div className="pastel-hero__grid">
        <div className="pastel-hero__copy">
          <p className="pastel-eyebrow">Guided onboarding</p>
          <h1>A softer path into your first customer workflow.</h1>
          <p>Plan, invite, and review progress with friendly surfaces that keep every action clear.</p>
          <div className="pastel-hero__actions">
            <a className="pastel-button pastel-button--primary" href="/start">Create workspace</a>
            <a className="pastel-button pastel-button--ghost" href="/demo">See demo</a>
          </div>
        </div>
        <div className="pastel-proof-card" aria-label="Workflow preview">
          <div className="pastel-proof-card__row" data-state="complete">Invite sent</div>
          <div className="pastel-proof-card__row" data-state="current">Review intake</div>
          <div className="pastel-proof-card__row" data-state="idle">Schedule follow-up</div>
        </div>
      </div>
    </section>
  );
}
```

```css
:root {
  --pastel-bg: #fff4ec;
  --pastel-surface: #ffffff;
  --pastel-surface-soft: #f6e6d9;
  --pastel-text: #3f4a24;
  --pastel-muted: #5d6650;
  --pastel-border: rgba(60, 66, 34, .22);
  --pastel-cta: #d1e030;
  --pastel-cta-text: #3f4a24;
  --pastel-focus: #165dfb;
  --pastel-radius-button: 10px;
  --pastel-radius-card: 20px;
  --pastel-ease: cubic-bezier(.16, 1, .3, 1);
}

.pastel-hero {
  min-height: 100svh;
  padding: clamp(16px, 3vw, 34px);
  background: var(--pastel-bg);
  color: var(--pastel-text);
}

.pastel-nav {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.pastel-nav a {
  color: inherit;
  text-decoration: none;
}

.pastel-logo {
  font-weight: 700;
}

.pastel-nav__links {
  display: flex;
  gap: clamp(14px, 2vw, 28px);
}

.pastel-hero__grid {
  width: min(100%, 1180px);
  margin: clamp(56px, 9vw, 120px) auto 0;
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(320px, 1.08fr);
  gap: clamp(32px, 6vw, 76px);
  align-items: center;
}

.pastel-eyebrow {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.pastel-hero h1 {
  max-width: 12ch;
  margin: 0;
  font-family: var(--pastel-font-display, Georgia, "Times New Roman", serif);
  font-size: clamp(44px, 8vw, 86px);
  line-height: .98;
  letter-spacing: 0;
  text-wrap: balance;
}

.pastel-hero__copy > p:not(.pastel-eyebrow) {
  max-width: 58ch;
  color: var(--pastel-muted);
  font-size: 18px;
  line-height: 1.6;
}

.pastel-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.pastel-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  border-radius: var(--pastel-radius-button);
  padding: 0 20px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 180ms var(--pastel-ease), background 180ms ease, border-color 180ms ease;
}

.pastel-button--primary {
  border: 1px solid color-mix(in srgb, var(--pastel-cta-text), transparent 55%);
  background: var(--pastel-cta);
  color: var(--pastel-cta-text);
}

.pastel-button--ghost {
  border: 1px solid var(--pastel-border);
  background: var(--pastel-surface);
  color: var(--pastel-text);
}

.pastel-button:hover { transform: translateY(-2px); }
.pastel-button:active { transform: translateY(0); }
.pastel-button:focus-visible { outline: 3px solid var(--pastel-focus); outline-offset: 3px; }
.pastel-button[aria-disabled="true"] { opacity: .55; pointer-events: none; }

.pastel-proof-card {
  display: grid;
  gap: 14px;
  padding: clamp(20px, 4vw, 36px);
  border: 1px solid var(--pastel-border);
  border-radius: var(--pastel-radius-card);
  background: var(--pastel-surface);
}

.pastel-proof-card__row {
  min-height: 56px;
  display: flex;
  align-items: center;
  border: 1px solid var(--pastel-border);
  border-radius: 14px;
  padding: 0 16px;
  color: var(--pastel-text);
  background: #fff;
}

.pastel-proof-card__row[data-state="complete"] { background: #d7d7c8; }
.pastel-proof-card__row[data-state="current"] { background: #d1e030; font-weight: 700; }
.pastel-proof-card__row[data-state="error"] { background: #fff4f2; border-color: #a63a2a; color: #7d2116; }

@media (max-width: 800px) {
  .pastel-nav__links { display: none; }
  .pastel-hero__grid { grid-template-columns: 1fr; margin-top: 48px; }
  .pastel-hero h1 { max-width: 100%; font-size: clamp(40px, 13vw, 62px); overflow-wrap: anywhere; }
}
```

### PastelCTA

```tsx
type PastelState = "idle" | "loading" | "success" | "error" | "disabled";

export function PastelCTA({ state = "idle" }: { state?: PastelState }) {
  const label = {
    idle: "Book a session",
    loading: "Checking times",
    success: "Time reserved",
    error: "Choose another time",
    disabled: "Not available"
  }[state];

  return (
    <div className="pastel-cta" data-state={state}>
      <div>
        <p>Next opening</p>
        <strong>Tuesday at 10:30</strong>
      </div>
      <button disabled={state === "disabled"} aria-busy={state === "loading"}>
        {label}
      </button>
      {state === "error" ? <span role="alert">That time was just taken.</span> : null}
    </div>
  );
}
```

```css
.pastel-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--pastel-border);
  border-radius: 18px;
  background: var(--pastel-surface-soft);
  padding: 20px;
}

.pastel-cta p,
.pastel-cta strong {
  margin: 0;
}

.pastel-cta p {
  color: var(--pastel-muted);
  font-size: 14px;
}

.pastel-cta strong {
  color: var(--pastel-text);
  font-size: 22px;
}

.pastel-cta button {
  min-height: 44px;
  border: 1px solid color-mix(in srgb, var(--pastel-cta-text), transparent 55%);
  border-radius: var(--pastel-radius-button);
  background: var(--pastel-cta);
  color: var(--pastel-cta-text);
  padding: 0 18px;
  font-weight: 700;
}

.pastel-cta[data-state="success"] { background: #ebffb1; }
.pastel-cta[data-state="error"] { background: #fff4f2; border-color: #a63a2a; }
.pastel-cta[data-state="loading"] { opacity: .82; }

@media (max-width: 620px) {
  .pastel-cta { grid-template-columns: 1fr; }
  .pastel-cta button { width: 100%; }
}
```

### SoftFeatureCard

Use for product benefits, creator tools, wellness pathways, community modules.

```tsx
const features = [
  { tone: "sky", title: "Plan", body: "Collect goals and constraints before the first call." },
  { tone: "sand", title: "Invite", body: "Bring collaborators into a calm, guided space." },
  { tone: "plum", title: "Review", body: "Close the loop with notes, owners, and next steps." }
];

export function SoftFeatureGrid() {
  return (
    <div className="soft-feature-grid">
      {features.map((feature) => (
        <article className="soft-feature-card" data-tone={feature.tone} key={feature.title}>
          <h3>{feature.title}</h3>
          <p>{feature.body}</p>
          <a href="/features">Learn more</a>
        </article>
      ))}
    </div>
  );
}
```

```css
.soft-feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.soft-feature-card {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid transparent;
  border-radius: 32px;
  padding: 28px;
  background: var(--card-bg, #ffffff);
  color: var(--card-text, var(--pastel-text));
}

.soft-feature-card[data-tone="sky"] { --card-bg: #a5c8d8; --card-text: #06040e; }
.soft-feature-card[data-tone="sand"] { --card-bg: #f2f0e9; --card-text: #141212; }
.soft-feature-card[data-tone="plum"] { --card-bg: #1f1738; --card-text: #f6ddc4; border-color: #cbb0eb; }

.soft-feature-card h3 {
  margin: 0;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.08;
}

.soft-feature-card p {
  margin: 0;
  line-height: 1.55;
  color: inherit;
}

.soft-feature-card a {
  margin-top: auto;
  color: inherit;
  font-weight: 700;
}

@media (max-width: 780px) {
  .soft-feature-grid { grid-template-columns: 1fr; }
  .soft-feature-card { min-height: 0; border-radius: 24px; }
}
```

### PastelForm

Use for signup, booking, checkout, intake, newsletter, request demo.

```tsx
export function PastelForm() {
  return (
    <form className="pastel-form">
      <label>
        <span>Email</span>
        <input type="email" placeholder="you@example.com" />
      </label>
      <label data-error="Use at least 2 words">
        <span>Project name</span>
        <input aria-invalid="true" placeholder="Community launch" />
      </label>
      <button type="submit">Send request</button>
      <p className="pastel-form__trust">We reply within one business day.</p>
    </form>
  );
}
```

```css
.pastel-form {
  display: grid;
  gap: 16px;
  border: 1px solid var(--pastel-border);
  border-radius: 24px;
  background: var(--pastel-surface);
  padding: clamp(20px, 4vw, 34px);
}

.pastel-form label {
  display: grid;
  gap: 8px;
  color: var(--pastel-text);
  font-weight: 700;
}

.pastel-form input {
  min-height: 48px;
  border: 1px solid var(--pastel-border);
  border-radius: var(--pastel-radius-button);
  background: #ffffff;
  color: var(--pastel-text);
  padding: 0 14px;
  font: inherit;
}

.pastel-form input:focus-visible {
  outline: 3px solid var(--pastel-focus);
  outline-offset: 2px;
}

.pastel-form label[data-error] input {
  border-color: #a63a2a;
  background: #fff4f2;
}

.pastel-form label[data-error]::after {
  content: attr(data-error);
  color: #7d2116;
  font-size: 14px;
  font-weight: 600;
}

.pastel-form button {
  min-height: 48px;
  border: 0;
  border-radius: var(--pastel-radius-button);
  background: var(--pastel-cta);
  color: var(--pastel-cta-text);
  font-weight: 800;
}

.pastel-form__trust {
  margin: 0;
  color: var(--pastel-muted);
  font-size: 14px;
}
```

## Gentle Motion

Pastel motion should be slow enough to feel calm and short enough to keep the UI responsive.

- Refero pastel packs use 160-280ms for controls, 240-420ms for soft panel reveal, and no bounce unless the selected source is explicitly playful. Under `prefers-reduced-motion`, remove gradient drift and card lift; keep focus rings and selected fills.

Allowed:

- Soft fade/translate reveal.
- Gentle card lift by 1-3px.
- Background tint transition.
- Product/photo float by 6-12px.
- Stepper progress fill.
- Form success check or soft highlight.

Avoid:

- Aggressive parallax.
- Constant bouncing.
- Large 3D flips.
- Motion behind long body copy.
- Scroll hijacking.
- Slippery controls.

CSS:

```css
:root {
  --pastel-motion-fast: 160ms;
  --pastel-motion-base: 260ms;
  --pastel-motion-slow: 760ms;
  --pastel-ease-soft: cubic-bezier(.16, 1, .3, 1);
}

[data-pastel-motion="reveal"] {
  animation: pastel-reveal var(--pastel-motion-slow) var(--pastel-ease-soft) both;
}

@keyframes pastel-reveal {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

[data-pastel-motion="float"] {
  animation: pastel-float 8s ease-in-out infinite;
}

@keyframes pastel-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

[data-pastel-motion="soft-hover"] {
  transition:
    transform var(--pastel-motion-base) var(--pastel-ease-soft),
    background-color var(--pastel-motion-base) ease,
    border-color var(--pastel-motion-base) ease;
}

[data-pastel-motion="soft-hover"]:is(:hover, :focus-visible) {
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  [data-pastel-motion] {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
  }
}
```

Reduced motion alternatives:

- Reveal content immediately.
- Replace float with static offset composition.
- Use color and border state instead of lift.
- Progress fills render at final state.

## State Design

Refero state deltas:
- Contractbook selected/primary is `#ffba09`; Equals success/error/info are `#20a277/#ff3716/#2dcbdc`; Wealthsimple hover moves `#eeece7 -> #f1f0f0`.

| State | Pastel Treatment |
| --- | --- |
| Hover | subtle lift, slightly stronger border, tint shift |
| Focus | high-contrast blue/indigo ring, not a pale glow |
| Active | press or darker border |
| Loading | skeleton in surface color with clear label |
| Empty | soft illustration plus concrete next action |
| Error | warm error surface with dark red/brown text and recovery |
| Success | soft green/lime surface with dark text |
| Disabled | low saturation but still legible; explain why if needed |
| Selected | filled surface + border + label/icon, not color alone |

## Accessibility

- Body copy should pass WCAG AA on the actual background.
- Text under 18px should use the darker end of the palette.
- Do not use opacity to make text "soft" unless contrast is still sufficient.
- Use dark text on yellow, lavender, sky, peach, mint, and cream.
- Use light text only on plum, indigo, black, deep green, or deep blue.
- Focus rings must be visible on both white and tinted surfaces.
- Error messages must include words, not just colored borders.
- Mobile line length and button wrapping must be intentional.

## Implementation Workflow

1. Choose archetype and geometry stance.
2. Pick one canvas, one text color, one primary CTA.
3. Add optional decorative pastel colors with roles.
4. Write contrast-safe pairings before designing.
5. Build hero with proof object and next-section hint.
6. Build four components with states.
7. Add gentle motion and reduced-motion fallback.
8. Audit CSS for one-off colors, low opacity text, random shadows, and radius drift.
9. Test mobile at narrow widths.

## Anti-Slop

- Refero anti-dilution: do not combine Contractbook yellow, Equals orchid/yellow/cyan/red, and Wealthsimple pale blue as a rainbow pastel palette.
- Do not lower contrast by putting pastel text on pastel fields; dark ink remains required.

Reject:

- Washed-out body text.
- Pastel text on pastel backgrounds.
- Too many candy colors at once.
- White text on yellow, lavender, mint, peach, or sky.
- Generic gray SaaS palette disguised as pastel.
- Heavy blurred shadows.
- Random gradients behind paragraphs.
- Childish styling for adult or trust-sensitive flows.
- Weak CTAs with pale fills.
- Arbitrary radii across buttons, cards, and images.

Correct:

- If too washed out, darken text and CTA text first.
- If too childish, reduce color count, use mature typography, and ground the system with a dark CTA.
- If too generic, choose a source archetype and carry forward its radius/type/surface signature.
- If too noisy, move decorative pastels into card backgrounds only.
- If too flat, improve spacing and surface layering before adding shadows.
- If motion feels sugary, slow it down and reduce travel distance.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Absolute Bans

- No washed-out low-contrast copy.
- No too many candy colors at once.
- No childish treatment for serious flows.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.


## Pre-Output Checklist

- First viewport contains a real soft guided product card.
- One Pastel archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to gentle buoyant transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
