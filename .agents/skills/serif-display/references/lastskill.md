---
name: serif-display
description: "Use this skill to create Serif Display visual design systems that feel editorial, elegant, literary, premium, expressive, composed. USE FOR: serif-led brand sites, luxury, editorial pages, cultural projects, typographic portfolios, premium commerce. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Serif Display Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Serif Display archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, serif hero, chapter image, pullquote, or elegant commerce proof, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Serif Display components with states.
7. **Motion plan:** line-mask, serif reveal, or image fade, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.

## Core Directive

Serif Display uses large, expressive typography as architecture. The display face is not garnish; it controls pace, hierarchy, voice, and composition. The page should feel editorial, elegant, literary, premium, expressive, and composed while remaining usable with real content, actions, states, and mobile constraints.

Use this for serif-led brand sites, type foundries, independent publishing, galleries, cultural institutions, premium commerce, luxury service pages, sophisticated portfolios, and product pages where display typography is the primary identity signal.

Despite the name, not every source uses a literal serif everywhere. The shared trait is display typography as the main design material: scale, letter-spacing, type specimen logic, print-like surfaces, strict color, and restrained components.


For substantial UI work, decide:

- Which serif/display archetype owns the page: editorial white canvas, risographic workshop, bold type foundry, precision blueprint, or architectural image stack.
- Whether the design is pure achromatic, warm paper, cool gray, or achromatic plus one vivid accent.
- Which display face carries the first viewport and whether body/UI use a separate workhorse.
- Which radius stance applies: `0px` print, `20px` soft foundry, `4px` engineered buttons, or `6px` uniform architectural.
- Which component language repeats: serif hero, specimen card, print product card, pullquote, chapter image, concierge CTA, editorial nav, line-mask reveal.
- Which motion primitive is allowed: line mask, text reveal, border draw, font variation/weight shift, image crop, diagonal image layer crossfade.

If building a full page, include a compact design plan with archetype, type roles, token pack, first viewport, components, state grammar, and motion. If the request is small, keep the plan internal.

## Non-Negotiable Principles

- The serif display face is the identity object, not a decorative heading pasted on default layout.
- Display type uses tight leading; body copy keeps a readable measure and comfortable rhythm.
- Premium editorial pace comes from type, image sequence, material cues, and quiet conversion.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Low-medium to medium. Elegant rhythm with strong text hierarchy. |
| motion | Low-medium. Slow reveals, line masks, image fades, refined hover. |
| decoration | Low. Serif forms, rules, and imagery carry identity. |
| contrast | Warm or high contrast editorial palette. |
| radius | 0-8px usually, 24px+ only for soft lifestyle luxury. |
| type | High-contrast serif display plus modern sans or readable serif body. |
| assets | Editorial photography, product stills, covers, cultural images, luxury materials. |


## Signature System

- Serif As Architecture: H1, pullquotes, section titles, and captions define the grid.
- Line Discipline: display type uses tight leading, body copy uses comfortable measure.
- Luxury Editorial Pace: large image chapters alternate with quiet copy and proof.
- Readable Elegance: never use fragile hairline text on low-contrast backgrounds.

## Source Archetypes

Pick one primary archetype. Do not blend them into a bland serif template.

### Additional Refero Source Packs

- Kindsight warm serif brand: `#3d4128/#e1f079/#de7653/#e7573d/#0e0f0a/#faf5f1/#fefffa`; serif display with soft brand colors; cards 24px, buttons 10px, inputs 51px.
- Medium serif essay canvas: `#f7f4ed/#ffffff/#191919/#242424/#333333/#6b6b6b/#50B33A`; 8px base, 64px sections, pill buttons 9999px; no shadow.
- Gleap soft serif support: `#f5f2f0/#fff/#333/#000/#d6d6d6/#f1ccff/#91e0ff`; cards 24px, buttons 10px, large radius 42px; subtle shadows only.
- Substack publication serif-adjacent: `#FF6719/#363737/#777777/#FFFFFF/#EEEEEE/#232525/#C8C8C8`; 4px base, cards 8px, inputs 12px, buttons 9999px; soft publication shadow.
- Home/Parallel serif contrast shell: `#e4dfd9/#ffffff/#000000/#737373/#050505/#ffc42c`; Rules Font display plus ui-sans; display `69px/1.1/-1.38px`; sections 24px, cards 32px, gaps 8px; cards 20px, buttons 12px, inputs 0px, tags 9999px.

### 1. Editorial White Canvas Type Foundry

Source basis: Sociotype.

Use for type foundries, editorial portfolios, typographic galleries, specimen-led pages, and cultural sites where fonts themselves are imagery.

Raw signals:

- Canvas: `#ffffff`.
- Ink: `#000000`.
- Muted: `#818181`.
- Tertiary: `#9d9d9d`.
- Divider: `#d6d6d6`.
- Palette: five grays only, no chromatic accent.
- Body/functional type: Onsite, weight `400`, sizes `11-40px`, tracking `0.015-0.08em`.
- Display: Avec Sharp plus Ceno, Meso, Gestura, Rework.
- Display size: `251px`.
- Display weight: `400`.
- Display line-height: `1.25`.
- Display tracking: `0.0010em`, or `2.51px` in the specimen scale.
- Caption: `11px`, tracking `0.88px`.
- Body: `14px`, tracking `0.35px`.
- Heading: `26px`, tracking `0.26px`.
- Section gap: `120px`.
- Element gap: `12px`.
- Card padding: `0px`.
- Radius: `0px` everywhere.

Carry forward:

- Multiple display serifs can be the image system.
- Functional text stays quiet and consistent.
- Ghost buttons are text with a `1px` underline; no background, no padding.
- Featured cards are transparent and flat.
- Huge spacing creates editorial ceremony.

Avoid:

- Saturated CTA colors.
- Rounded corners.
- Shadows and elevation.
- Dense clustered layouts.
- Generic system fonts for links or specimen labels.
- Background fills on interactive elements.

Mini token pack:

```css
:root {
  --sd-canvas: #ffffff;
  --sd-ink: #000000;
  --sd-muted: #818181;
  --sd-tertiary: #9d9d9d;
  --sd-rule: #d6d6d6;
  --sd-radius: 0px;
  --sd-space-section: 120px;
  --sd-space-element: 12px;
}
```

### 2. Risographic Print Workshop

Source basis: Fidele Editions.

Use for independent publishing, editorial commerce, print shops, art books, risograph projects, cultural stores, and tactile product pages.

Raw signals:

- Faded paper: `#f8f7ef`.
- Printmaker blue: `#1664eb`.
- Shop grid blue: `#4f89ec`.
- Link blue: `#006ce5`.
- Ink: `#121212`.
- Dusty gray: `#e2e2df`.
- White: `#ffffff`.
- Display serif: OTMagisterUnlicensedTrial, fallback Playfair Display.
- Display size: `62px`, weight `400`, line-height `0.92`, tracking `-0.0160em`.
- Workhorse: BaselGrotesk Book/Regular/Bold, fallback Inter.
- Workhorse sizes: `14-62px`, wide tracking range `-0.049em` to `0.067em`.
- Mono/fine print: GTStandard-M, fallback Space Mono, `14px`.
- Utility: Arial `13px`.
- Input face: Assistant `26px`, tracking `0.0250em`.
- Spacing scale: `4, 8, 12, 16, 24, 28, 48, 96, 156`.
- Section gap: `42px`.
- Element gap: `5px`.
- Card padding: `19px`.
- Radius: `0px` everywhere.
- Ghost command button: transparent, ink text, Arial `13px`, horizontal padding `48px`.
- Product input: faded paper, blue text, bottom-only blue border, `24px` padding.

Carry forward:

- Warm paper canvas plus electric blue creates the print/ink identity.
- Product photography should be unmasked and central.
- Product listing cards are transparent with title/price beneath.
- Blue is interactive ink: links, borders, product input, selected nav.
- Keep compact print density.

Avoid:

- Gradients.
- Drop shadows.
- Additional saturated colors.
- Rounded corners.
- Heavy borders or solid card backgrounds.
- Using Arial for prominent headings.

Mini token pack:

```css
:root {
  --sd-canvas: #f8f7ef;
  --sd-ink: #121212;
  --sd-rule: #e2e2df;
  --sd-accent: #1664eb;
  --sd-accent-soft: #4f89ec;
  --sd-link: #006ce5;
  --sd-on-dark: #ffffff;
  --sd-radius: 0px;
  --sd-space-tight: 5px;
  --sd-space-card: 19px;
  --sd-space-section: 42px;
}
```

### 3. Bold Soft Type Foundry

Source basis: Pangram Pangram.

Use for type foundries with catalogs, premium playful-but-controlled product pages, font marketplaces, specimen grids, and expressive editorial commerce.

Raw signals:

- Ink: `#000000`.
- Canvas: `#fafafa`.
- Paper: `#ededed`.
- Slate: `#666666`.
- Alert red: `#ff2f00`.
- Update yellow: `#ffb700`.
- Early access blue: `#bfe0ff`.
- Primary type: Neue Montreal, fallback Inter.
- Weights: `400`, `530`, `600`.
- Sizes: `12-145px`.
- Letter-spacing: normal everywhere for Neue Montreal.
- Specimen fonts: fourteen display faces at `103px`.
- Type scale: caption `12`, body `16`, heading-sm `24`, heading `36`, heading-lg `48`, display-sm `121`, display `145`.
- Section gap: `92px`.
- Element gap: `8px`.
- Card padding: about `26px`, exact `25.72px`.
- Radius: `20px` for cards, inputs, buttons; `999px` badges.
- Filled button padding: `7.65px 22.95px`.
- Input padding: `24px 45.9px 24px 24px`.
- Badge padding: `4px 11.65px`.

Carry forward:

- One workhorse font can support all UI while specimen fonts become content.
- Commit to the `20px / 999px` radius dichotomy.
- Alert red is primary CTA, selected nav, or "new" status only.
- Cards use paper surface and radius, no shadows.
- Status badges are functional and have black text.

Avoid:

- Shadows.
- Alert red as body text.
- Extra chromatic colors.
- Deviating from `20px` and `999px` radii.
- Thin decorative border strokes.
- Letter-spacing changes on Neue Montreal.

Mini token pack:

```css
:root {
  --sd-canvas: #fafafa;
  --sd-paper: #ededed;
  --sd-ink: #000000;
  --sd-muted: #666666;
  --sd-action: #ff2f00;
  --sd-status-update: #ffb700;
  --sd-status-early: #bfe0ff;
  --sd-radius-soft: 20px;
  --sd-radius-badge: 999px;
  --sd-space-section: 92px;
}
```

### 4. Precision Blueprint Display

Source basis: Standards.

Use for premium SaaS, professional authority brands, design systems, technical products, and pages where a single sans display voice should feel exact and editorial.

Raw signals:

- Canvas ice: `#eaeaea`.
- Ink: `#000000`.
- Steel: `#a1a1a1`.
- Hairline: `#d7d7d7`.
- Action orange: `#ff2e00`.
- Sole typeface: Soehne, fallback system sans.
- Weights: `400`, `600` only.
- Sizes: `10, 14, 20, 31, 52px`.
- Letter-spacing: `-0.0100em` across all text.
- OpenType: `"dlig" on`, `"liga" on`.
- Spacing scale: `5, 10, 13, 15, 16, 24, 30, 46, 50, 59, 60`.
- Section gap: `46px`.
- Element gap: `10px`.
- Card padding: `13px`.
- Radius: `4px` buttons only; cards `0px`.
- Primary action: orange fill, white text, `4px` radius, `13.3px` padding.
- Ghost card: transparent, no shadow, `0px`, top + left hairline border.

Carry forward:

- One font, two weights, five sizes.
- Canvas ice avoids generic white.
- Orange is primary CTA and critical accent only.
- Ghost cards with top/left border create blueprint structure.
- Type and rules replace decoration.

Avoid:

- Additional fonts/weights.
- Varying letter-spacing.
- Multiple chromatic colors.
- Shadows.
- Gradients.
- Radius beyond `4px` buttons and `0px` cards.

Mini token pack:

```css
:root {
  --sd-canvas: #eaeaea;
  --sd-ink: #000000;
  --sd-muted: #a1a1a1;
  --sd-rule: #d7d7d7;
  --sd-action: #ff2e00;
  --sd-on-action: #ffffff;
  --sd-radius-button: 4px;
  --sd-radius-card: 0px;
  --sd-space-section: 46px;
}
```

### 5. Architectural Image Stack

Source basis: UNVEIL.

Use for architecture firms, galleries, conceptual studios, art direction, spatial design, and extremely reduced pages where images create the visual event while typography stays restrained.

Raw signals:

- Pitch black: `#000000`.
- Canvas white: `#ffffff`.
- Palette: exactly two colors.
- Type: nb_international_proregular, fallback Inter.
- Weight: `400` only.
- Sizes: `11px`, `16px` only.
- Tracking: `0.165px` at `11px`, `0.304px` at `16px`.
- Line heights: `1.05`, `1.24`, `1.50`.
- Spacing scale: `4, 7, 10, 14, 16, 40`.
- Card padding: `10-16px`.
- Element gap: `2-14px`.
- Radius: `6px` on interactive containers.
- Default button: transparent, `1px` black border, `6px` radius, asymmetric padding `40px 10px 7px 10px`.
- Imagery: layered slightly transparent, desaturated, diagonal overlapping photo-realistic panels.

Carry forward:

- Two colors only.
- One font, one weight, two sizes.
- Compact density is the identity.
- Diagonal overlapping images create depth; type stays controlled.
- Buttons can use unusual asymmetric padding when it supports architectural tone.

Avoid:

- Any chromatic color.
- Shadows/elevation.
- Extra font weights.
- Border radius other than `6px`.
- Decorative gradients or textures.
- Large generic content gaps.

Mini token pack:

```css
:root {
  --sd-canvas: #ffffff;
  --sd-ink: #000000;
  --sd-radius: 6px;
  --sd-space-1: 4px;
  --sd-space-2: 7px;
  --sd-space-3: 10px;
  --sd-space-4: 14px;
  --sd-space-5: 16px;
  --sd-space-6: 40px;
}
```

## Differentiation

Use Serif Display when serif-led brand sites, luxury, editorial pages, cultural projects, typographic portfolios, premium commerce. If removing the serif hero, chapter image, or product spread, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `editorial-type` for magazine systems; use this when serif display type is the premium brand voice.
## Semantic Token Model

Use semantic roles, not raw count summaries.

```css
:root {
  --canvas: #ffffff;
  --paper: #f8f7ef;
  --surface: #fafafa;
  --surface-subtle: #ededed;
  --surface-inverse: #000000;
  --text-primary: #000000;
  --text-secondary: #666666;
  --text-muted: #818181;
  --text-inverse: #ffffff;
  --rule-subtle: #d6d6d6;
  --rule-strong: #000000;
  --accent-primary: #ff2f00;
  --accent-blueprint: #1664eb;
  --accent-action: #ff2e00;
  --status-update: #ffb700;
  --status-early: #bfe0ff;
  --focus-ring: #000000;
  --state-error: #9b1c1c;
  --state-success: #2f5d46;
  --radius-control: 0px;
  --radius-card: 0px;
  --radius-soft: 20px;
  --radius-badge: 999px;
  --space-section: 92px;
  --space-module: 26px;
  --motion-fast: 140ms;
  --motion-base: 240ms;
  --motion-slow: 620ms;
  --ease-display: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Rules:

- Pure achromatic archetypes use no accent.
- Warm print archetypes can use electric blue as ink, not as general decoration.
- Bold foundry archetypes can use alert red for CTA/status only.
- Precision blueprint can use orange for primary action only.
- Semantic state colors remain small and paired with text or rule changes.

### Execution Token Contract

Every Serif Display build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #fbf7ef;
  --surface: #ffffff;
  --surface-muted: #eee5d7;
  --text: #251b16;
  --text-muted: #76685e;
  --line: #d6c7b8;
  --action: #251b16;
  --action-strong: #000000;
  --radius-control: 999px;
  --radius-card: 8px;
  --radius-panel: 12px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Canela", "Cormorant Garamond", Georgia, serif;
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
  --shadow-card: 0 12px 38px rgba(37,27,22,.06);
  --shadow-panel: 0 28px 80px rgba(37,27,22,.10);
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
  --status-neutral-fg: #76685e;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --font-body: var(--font-sans);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Serif Display token |
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

Token rule: if a value can be expressed by `sd`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.

## Typography

Serif Display requires exact type role separation.

Additional serif references: `gt-super 120px/0.83/-6.6px`, `Times Now 30-120px/.78-1`, `PP Editorial New 48/62`, `Spectral 19px`, `Denton 48/52/80`, and `Literata 37/44` are source voices, not interchangeable decoration. Use sans or mono only for nav/meta/captions.

Roles:

- Display hero: `52-251px`, chosen for voice. Usually one strong line or specimen.
- Specimen: `103-251px`, often one word or product/font name.
- Section heading: `31-62px`.
- Body: `14-20px`, readable and calmer than display.
- Caption: `10-13px`, often tracked and grid-aligned.
- Metadata: edition, issue, price, foundry, material, year, category.
- Control: buttons, nav, filters; must preserve the typographic world.

Type pairings:

- Foundry showcase: workhorse sans plus multiple display faces.
- Print workshop: display serif plus grotesk body plus mono/fine print.
- Soft foundry: one workhorse sans plus specimen fonts.
- Precision blueprint: one sans only.
- Architectural stack: one font, one weight, two sizes.

Type rules:

- Do not use a serif heading as decoration without body/control support.
- Display line-height is tight; body line-height is comfortable.
- Small labels can use positive tracking, but not too much to read.
- Do not use more typefaces than the archetype supports.
- If using common fallbacks, tune tracking, leading, and scale so the identity remains.

## Component Signatures

Use at least four for full-page work.

### Refero Expansion Component Deltas

- Serif CTAs need controlled shape: Medium/Substack use 9999px pills, Kindsight/Gleap use 10px buttons, Home/Parallel uses 12px buttons with 0px inputs. Do not make every serif interface a rounded luxury card.
- Cards should stay editorial: Kindsight and Gleap allow 24px cards, Substack 8px publication cards, Home/Parallel 20px cards with 32px padding. Use image chapters, article lists, quotes, or product proof, not generic feature grids.
- Accent colors must be rare and named: Kindsight keylime/terra, Gleap lilac/sky, Substack orange, Medium green, Home yellow.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type SerifDisplayState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type SerifDisplayStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function SerifDisplayStatusPill({ role, children }: { role: SerifDisplayStatus; children: React.ReactNode }) {
  return <span className="serif-display-status-pill" data-role={role}>{children}</span>;
}

export function SerifHeroContract({ state = "default" }: { state?: SerifDisplayState }) {
  return <section className="serif-display-hero-object" data-state={state} aria-label="Serif Display proof object" />;
}

export function PullquoteCardContract({ title, meta, state = "default" }: { title: string; meta: string; state?: SerifDisplayState }) {
  return <article className="serif-display-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function ElegantProductGridContract({ items }: { items: string[] }) {
  return <nav className="serif-display-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function SerifDisplaySectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="serif-display-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.serif-display-status-pill {
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
.serif-display-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.serif-display-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.serif-display-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.serif-display-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.serif-display-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.serif-display-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.serif-display-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.serif-display-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.serif-display-card[data-state="error"] { border-color: var(--status-danger-fg); }
.serif-display-card > span { font: var(--type-meta); color: var(--text-muted); }
.serif-display-card > strong { font: var(--type-card); color: var(--text); }
.serif-display-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.serif-display-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.serif-display-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.serif-display-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.serif-display-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.serif-display-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.serif-display-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .serif-display-hero-object { min-height: 280px; }
  .serif-display-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Serif Hero

Structure:

- Brand/product/place/person name or literal category in display type.
- Support copy in calm body type.
- Primary action and secondary text link if needed.
- Proof object visible in first viewport.
- Mobile title wraps intentionally.

States:

- CTA hover: underline, inversion, or accent fill based on archetype.
- Focus: visible rule/ring.
- Reduced motion: title is readable without reveal.

### Specimen Card

Structure:

- Large type sample or display word.
- Font/product name, classification, price/status, action.
- Transparent or paper surface; no shadow.
- Stable height and wrapping.

States:

- Hover: font variation/weight shift, underline, or surface change.
- Selected: badge/inversion/rule.
- Loading: specimen placeholder with metadata skeleton.
- Error: preserve card and show replacement action.

### Print Product Card

Structure:

- Product image, title, price, edition, availability.
- Text and image align to a simple grid.
- No decorative icon badges.

States:

- Hover: image swap or crop, title underline.
- Sold out/unavailable: text status and muted action.
- Success after add: typographic confirmation.

### Pullquote Card

Structure:

- Large serif quote, attribution, optional source/date.
- Border block or inverse surface.
- Keep measure controlled.

States:

- Hover/focus if linkable: rule draw or attribution underline.
- Mobile: reduce type without losing rhythm.

### Chapter Image

Structure:

- One strong image or image stack with caption.
- Aspect ratio fixed.
- Desaturation or material treatment aligned to archetype.

States:

- Hover: crop shift, layer crossfade, or caption reveal.
- Focus: outline/rule.
- Loading/error: stable frame.

### Concierge CTA

Structure:

- Premium action block with one decisive action.
- Short reassurance line.
- Uses display/body contrast, not sales badges.

States:

- Hover: underline, inversion, accent fill.
- Loading: action label changes without width jump.
- Success: composed confirmation, not bright green celebration.

### Editorial Nav

Structure:

- Text-first nav, often underlined or ruled.
- Active section indicated by underline, inversion, or accent.
- Optional issue/date/version metadata.

States:

- Hover/focus visible through underline/rule.
- Mobile drawer preserves typographic hierarchy.

### Serif Footer

Structure:

- Colophon-like closure.
- Links, legal, contact, archive or edition note.
- Repeat type/rule/radius grammar.

States:

- Links use same state pattern as nav.
- Focus state must be visible in small type.

## State Patterns

Serif Display states should remain typographic and material.

Preferred vocabulary:

- Underline: ghost buttons, links, nav.
- Inversion: primary CTA, selected nav, current specimen.
- Accent fill: only if source permits red/orange/blue.
- Weight or font variation: specimen hover.
- Rule: table/header/footer borders.
- Italic/serif emphasis: pullquote or editorial note.
- Badge: status only, especially foundry/commerce.
- Image crop/swap: product and chapter images.

Example:

```css
.sd-link {
  color: var(--text-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: .24em;
  transition: text-underline-offset 160ms ease, color 160ms ease;
}
.sd-link:hover,
.sd-link:focus-visible {
  text-underline-offset: .38em;
}
.sd-button {
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-primary);
}
.sd-button:hover,
.sd-button:focus-visible,
.sd-button[aria-pressed="true"] {
  background: var(--text-primary);
  color: var(--text-inverse);
}
.sd-card[data-selected="true"] {
  outline: 1px solid var(--rule-strong);
  outline-offset: -1px;
}
.sd-field[aria-invalid="true"] {
  border-color: var(--state-error);
}
.sd-message[data-kind="success"] {
  color: var(--text-primary);
  font-weight: 600;
}
```

Avoid generic colored success fills or blue SaaS focus rings unless the existing product system requires them.

## Motion Grammar

- Serif Display motion is quiet: 150-300ms fades, small translate, underline/ink transitions. No large parallax or type spinning; reduced motion keeps active underline, selected card border, and visible focus.

## Complete Page Protocols

```tsx
// Literary Brand
<main data-skill="serif-display" data-archetype="literary-brand">
  <SerifHeroContract title="A composed first sentence" />
  <PullquoteCardContract quote="Serif type is the voice and the structure." />
  <ChapterImageContract caption="image proof with editorial pacing" />
  <EditorialNavContract items={["Essay", "Objects", "Visit"]} />
</main>

// Elegant Commerce
<main data-skill="serif-display" data-archetype="elegant-commerce">
  <ElegantProductGridContract products={curatedProducts} />
  <TypeLedTestimonialContract quote="quiet proof, not hype" />
  <ConciergeCTAContract action="Request appointment" />
</main>
```
```tsx
// Literary Brand
<main data-skill="serif-display" data-archetype="literary-brand">
  <SerifHeroContract title="A composed first sentence" />
  <PullquoteCardContract quote="Serif type is the voice and the structure." />
  <ChapterImageContract caption="image proof with editorial pacing" />
  <EditorialNavContract items={["Essay", "Objects", "Visit"]} />
</main>

// Elegant Commerce
<main data-skill="serif-display" data-archetype="elegant-commerce">
  <ElegantProductGridContract products={curatedProducts} />
  <TypeLedTestimonialContract quote="quiet proof, not hype" />
  <ConciergeCTAContract action="Request appointment" />
</main>
```
Motion should feel refined, printed, typographic, or image-led.

Allowed primitives:

- Line-mask reveal for serif headlines.
- Text reveal by line or word for short display statements.
- Border draw for nav, buttons, cards.
- Font variation/weight shift for specimen cards.
- Image crop or product image swap.
- Diagonal layer crossfade/shift for architectural image stacks.
- Inversion swap for CTAs.

Timing:

- Link/hover: `120-180ms`.
- Border draw: `180-260ms`.
- Inversion: `160-240ms`.
- Line mask: `520-820ms`.
- Image crop: `420-760ms`.
- Font variation: `300-500ms`.

CSS primitive:

```css
.sd-line-mask {
  display: block;
  overflow: hidden;
}
.sd-line-mask > span {
  display: inline-block;
  transform: translateY(110%);
  transition: transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
}
.is-visible .sd-line-mask > span {
  transform: translateY(0);
}
.sd-rule-draw::after {
  content: "";
  display: block;
  block-size: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 220ms ease;
}
.sd-rule-draw:hover::after,
.sd-rule-draw:focus-visible::after {
  transform: scaleX(1);
}
.sd-image img {
  transition: transform 620ms cubic-bezier(0.16, 1, 0.3, 1), filter 320ms ease;
}
.sd-image:hover img,
.sd-image:focus-within img {
  transform: scale(1.025);
}
@media (prefers-reduced-motion: reduce) {
  .sd-line-mask > span,
  .sd-rule-draw::after,
  .sd-image img {
    transform: none !important;
    transition-duration: .01ms !important;
  }
}
```

Avoid:

- Flashy kinetic effects.
- Generic fade-up repeated everywhere.
- Parallax over reading text.
- Decorative loops.
- Motion that hides navigation or action.


## Absolute Bans

- No ornate heading that collapses on mobile.
- No too many typefaces.
- No typographic drama that hides actions.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`. For expanded implementation examples, load `references/advanced-implementation-notes.md` only after the archetype and token pack are chosen.

## Anti-Slop Rules

Reject:

- Ornate serif heading without a system.
- Too many typefaces outside source-supported specimen use.
- Weak body copy under dramatic headlines.
- Serif display that collapses or overlaps on mobile.
- Generic Tailwind cards.
- Multicolor SaaS palettes.
- Shadows and gradients unless explicitly part of imagery.
- Accent colors spread everywhere.
- Display type used for long paragraphs.
- Product/luxury pages with no real proof object.
- Hidden actions for the sake of elegance.

Repair:

- If it looks generic, make the display face, spacing, and radius stance stricter.
- If it looks too editorial and not usable, add clear nav, CTA, table, form, and states.
- If it looks fake-luxury, remove decorative adjectives and add material/product proof.
- If it feels noisy, reduce accents and fonts before reducing content.
- If it feels bland, commit to one archetype's exact color, type, and geometry.

## Pre-Output Checklist

- First viewport contains a real serif hero, chapter image, or product spread.
- One Serif Display archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typogra
