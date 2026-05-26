---
name: experimental-type
description: "Build bold, modern, highly specific visual identities where typography is the main expressive material: industrial precision, editorial display, chromatic block systems, type-first brutalism, and specimen-led layouts. USE FOR: experimental typography, creative studios, cultural pages, posters, campaigns, unconventional portfolios. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Experimental Type Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Experimental Type archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, type specimen, variable axis control, glyph grid, or poster system, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Experimental Type components with states.
7. **Motion plan:** variable-axis, kinetic type, or mask transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Experimental Type is not "use a strange font." It is a visual operating system where letterforms become structure, navigation, texture, proof, motion, and product personality. The interface must feel authored and specific, not like a default product page with an eccentric headline face pasted over it.

Use this skill for type foundries, creative studios, cultural campaigns, editorial brands, music tools, hardware catalogs, unconventional portfolios, art-tech products, and any site or app where typography can carry identity more convincingly than illustration.

The output should feel expressive, controlled, typographic, art-directed, and modern. It may be loud, severe, chromatic, industrial, brutalist, or almost invisible, but it must never feel random.


For substantial UI work, produce a compact `<design_plan>` before coding:

1. **Use case:** product or client type, audience, primary action, emotional target.
2. **Archetype:** one primary archetype from this file, plus one supporting archetype only if the page needs a second mode.
3. **Type job:** what typography is doing: object, interface, specimen, industrial mark, poster, block, editorial voice, or constraint.
4. **First viewport:** nav treatment, H1 line strategy, proof object, CTA, and visible hint of the next section.
5. **System contracts:** display face, functional face, color roles, radius, spacing, surfaces, imagery, states.
6. **Components:** at least four named components from the component section, with required states.
7. **Motion:** which type or modules move, why, and the reduced-motion replacement.
8. **Risk sweep:** the three biggest failure modes for the chosen archetype and how they will be prevented.

For tiny edits, do this mentally. For a full page, app, or redesign, show it.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium-high. Posters, modules, and indexes can be dense if hierarchy is clear. |
| motion | Medium-high. Variable-font axes, mask reveals, kinetic type, and scroll transforms. |
| decoration | Medium. Type is the decoration. |
| contrast | Usually high contrast with one strange accent or block system. |
| radius | Often 0px or intentionally exaggerated; pick one geometry and commit. |
| type | Variable fonts, condensed grotesks, display serif, mono annotations. |
| assets | Type specimens, poster crops, generated textures, campaign imagery. |

## Signature System

- Single Experiment Rule: stretch, rotate, slice, compress, outline, or overlap type, but choose one dominant behavior.
- Functional Counterweight: nav, body, filters, and CTAs stay plain enough to make the experiment usable.
- Specimen Logic: sections can feel like font specimens with labels, glyphs, weights, and modules.
- Mobile Safety: use `overflow-wrap:anywhere`, responsive clamps, and alternate line breaks.

## Differentiation

Use Experimental Type when experimental typography, creative studios, cultural pages, posters, campaigns, unconventional portfolios. If removing the typographic experiment object, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `editorial-type` for readable magazine systems; use this only when a controlled typographic experiment is the identity.

### Execution Token Contract

Every Experimental Type build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #f4f1e8;
  --surface: #ffffff;
  --surface-muted: #101010;
  --text: #111111;
  --text-muted: #5d5d5d;
  --line: #111111;
  --action: #ff4d00;
  --action-strong: #000000;
  --radius-control: 0px;
  --radius-card: 0px;
  --radius-panel: 0px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Obviously", "Space Grotesk", Impact, sans-serif;
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
  --shadow-panel: 8px 8px 0 var(--text);
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
  --status-neutral-fg: #5d5d5d;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --et-action: var(--action);
  --et-bg: var(--canvas);
  --et-display: var(--text);
  --et-focus-surface: var(--state-focus-ring);
  --et-ink: var(--text);
  --et-line: var(--line);
  --et-muted: var(--text-muted);
  --et-ui: var(--surface-muted);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Experimental Type token |
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
| `tracking-widest`, `uppercase` | only for specimen labels, never body copy |
| `w-screen` huge type | clamp + `overflow-wrap:anywhere` safety |

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `et`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Non-Negotiable Principles

- Choose one typographic experiment and make it the structural idea.
- Pair expressive display with calm functional text.
- Navigation, body copy, forms, prices, labels, and CTAs must stay readable.
- Mobile wrapping is part of the design system, not a postscript.
- Every color and shape must map to a content role.
- Motion must reveal, test, sequence, or respond. Decorative looping type is usually noise.
- If typography is not doing the work, the style has failed.

## Source Archetypes

Pick one primary archetype. Do not average them into a bland middle.

### Additional Refero Source Packs

- Branding/SVZ dark red type system: black ramp `#000/#080808/#171617/#262525/#393939`, whites `#fcfcfc/#f3efef`, red `#ff0000`; 48px sections; radius 3/8/14.4px; inset shadow only.
- Wise Design chromatic mega-type: `#87ea5c/#083400/#ffea4b/#ffbd89/#ffd5f0/#2a0831/#370305/#fff`; Wise Sans 187-562px, line-height `.85`, weight 900; cards 86px, pills 9999px; zero shadow.
- Wonder dark product editorial: `#0f0217/#0b0211/#111/#fff/#44374a/#d262ff/#6a1791/#d97757`; Uncut Sans/Inter/Martian Mono; cards 14px, badges/inputs 9999px, buttons 8px.
- ORYZO AI organic type field: `#100904/#ffedd7/#dc5000/#445231/#382416/#887b6d`, rainbow spectrum gradient; halyard variable 10-410px, Literata, DM Mono; sections 45px, cards/gaps 18px, cards 12px, buttons/badges 36px.
- amp warm kinetic SaaS: `#ff6105/#ffdfcd/#ffa069/#e5e5e5/#0a0a0a/#fff`; cards 5px, images 8px, buttons 24px, inputs 50px; CTA glow only.

### 1. Industrial Thin-Type Precision

Source logic: teenage engineering. Use for hardware, instruments, audio tools, industrial design studios, technical objects, premium electronics, and software that wants engineered calm.

| System Part | Direction |
| --- | --- |
| Hex | `#f6f8f7` canvas, `#0f0e12` graphite, `#000000` ink, `#e5e5e5` steel, `#b2b2b2` smoke, `#0071bb` action blue |
| Typography | Ultra-light technical sans for display and UI; sizes around `13`, `19`, `24`, `26`, `40`; weights `100`, `300`, occasional `400`; compact line-heights `1.11`, `1.15`, `1.5` |
| Radius | `0px` everywhere |
| Spacing | `15px` internal gaps, `66px` section rhythm, square product grid cells |
| Carry forward | Thin product labels, flat catalog surfaces, blue as a technical indicator, graphite inverted sections, product imagery as the visual event |
| Avoid | Heavy display weights, blue decoration, rounded product tiles, soft shadows, playful color, crowded thin text |

Implementation posture:
- Build a top bar like a device control strip.
- Use square product modules and thin borders.
- Put purchase or detail links in the blue action color only.
- Let product photos, diagrams, or app screenshots create weight.
- Use empty space around thin type so it reads as precision, not weakness.

### 2. Red/Black Editorial Display

Source logic: Charlie. Use for art direction portfolios, campaigns, creative directors, music/fashion identities, theatrical launches, and strong personal brands.

| System Part | Direction |
| --- | --- |
| Hex | `#000000` canvas, `#ffffff` text and pills, `#838383` muted copy, `#ff0000` statement field |
| Typography | Stable sans for UI at `19`, `20`, `40`; experimental variable display at `145-360`; line-height near `0.70`; tracking as tight as `-0.079em` only at huge sizes |
| Radius | Pill controls around `100px`; large fields remain square |
| Spacing | Full-bleed scenes, `59px` section gaps, `30px` element gaps, content near `1306px` |
| Carry forward | One enormous word, binary black/white contrast, rare red scene change, ghost/fill pill buttons |
| Avoid | Extra accent colors, textures, gradients, polite display size, generic hero cards, softening the red |

Implementation posture:
- Make one display word dominate the first viewport.
- Use red as a major scene, not a small badge.
- Keep all functional UI in the stable sans.
- Crop display type only when the cropped meaning is still clear or repeated elsewhere.
- Give keyboard focus the same visual importance as hover.

### 3. Chromatic Block Typography

Source logic: TypeList. Use for directories, type collections, archives, playful editorial tools, education, and interactive indexes.

| System Part | Direction |
| --- | --- |
| Hex | `#ffffff`, `#15181e`, `#000000`, `#e3e3d5`, `#dcdcdc`, `#b9d4cd`, `#8d7fc8`, `#fff731`, `#9dc4f2`, `#2772ff`, `#dffe5a`, `#f9423b` |
| Typography | Calm sans at `16`, `22`, `24`; optional serif contrast; weights `400-500`; line-height `1`, `1.1`, `1.36` |
| Radius | `0px`; color blocks stay square |
| Spacing | Full-bleed block rows, at least `20px` vertical padding, `30px` element gap, `48px` section rhythm |
| Carry forward | Color as category, full-block links, white canvas, black text, low ornament |
| Avoid | Tiny rainbow accents, shadows, gradients, rounded blocks, dense content inside each color field |

Implementation posture:
- Treat color fields as navigation or content grouping.
- Make every block tappable or semantically meaningful.
- Use one text color per block after contrast testing.
- Do not add cards on top of color blocks.
- Let square geometry keep the palette mature.

### 4. Type-First Brutalist Parchment

Source logic: Egstad. Use for artists, independent studios, personal sites, experimental agencies, type-led identities, and culture/design projects.

| System Part | Direction |
| --- | --- |
| Hex | `#e2e0d9` parchment, `#252422` inkwell, `#000000` deepest mark |
| Typography | Massive custom display around `399px`, line-height `0.97`, tracking `-0.055em`; compact serif body at `16px` and `1.2`; technical labels at `12px` with `0.1em` tracking |
| Radius | Huge mechanical pills up to `1440px`; fields and imagery stay flat |
| Spacing | `16px` element gap, `22px` section rhythm, `14px` component padding, heavy underlines around `4px` |
| Carry forward | Type as physical mass, old-system body serif, tactile tabs, tiny palette, underlines as structure |
| Avoid | Extra color, polite display type, complex nested layouts, decorative shadows, serif display substitutions |

Implementation posture:
- Let the wordmark behave like architecture.
- Use physical tab/toggle controls with filled active states.
- Keep paragraphs compact and old-school.
- Use thick underline or border rules where a soft card would normally appear.
- Preserve the bluntness on mobile with fewer words and safer breaks.

### 5. Editorial Specimen White Canvas

Source logic: Sociotype. Use for type foundries, font marketplaces, publishing projects, cultural product pages, editorial brands, and archives.

| System Part | Direction |
| --- | --- |
| Hex | `#ffffff` canvas, `#000000` ink, `#818181` medium text, `#d6d6d6` divider, `#9d9d9d` tertiary text |
| Typography | Functional UI from `11-40px`; live specimen faces up to `251px`; display tracking near `0.001em`; small functional tracking `0.015-0.08em` |
| Radius | `0px`; transparent modules |
| Spacing | Full-bleed structure, two-column editorial sections, `120px` section gaps, `12px` element gaps |
| Carry forward | Specimen as proof, invisible UI, underlined actions, transparent cards, generous whitespace |
| Avoid | Saturated CTAs, elevation, rounded corners, clustering, generic display fallbacks for specimens |

Implementation posture:
- Put live type samples in the first or second section.
- Use underlines rather than button boxes.
- Keep cards transparent unless grouping truly requires a border.
- Build a tester, family list, glyph grid, or license table as proof.
- Make font loading and missing-font behavior explicit.

## Type System

Define type before color. Experimental Type depends on role separation.

| Role | Job | Rules |
| --- | --- | --- |
| Display | Identity, scale, emotion, visual mass | Use only for hero, section breaks, specimens, posters, or nameplates |
| Functional | Navigation, UI, forms, prices, readable text | Stable sans/serif/mono, predictable metrics, no extreme tracking |
| Metadata | Indexes, labels, captions, coordinates | Often small, uppercase, positive tracking, but never unreadably tiny |
| Specimen | Product proof or live test string | Must be live text when possible, with accessible duplicate labels if decorative |
| Control | Tabs, sliders, filters, purchase actions | Must survive keyboard, touch, loading, disabled, and error states |

Scale strategies:

| Strategy | Use | Scale |
| --- | --- | --- |
| Poster jump | Red editorial, brutalist identities | caption `12-14`, body `16-20`, heading `36-48`, display `140-360` |
| Industrial compact | Hardware and precision systems | caption `13`, body `19`, subheading `24`, heading `26`, display `40` |
| Specimen giant | Foundries and typography products | caption `11-13`, body `14-16`, heading `26-40`, specimen `180-280` |
| Block directory | Interactive archives | body `16`, block `22-24`, heading `24-36`, hero `44-72` |

Line-height rules:
- `0.70-0.82` only for huge poster display.
- `0.90-1.00` for massive brutalist display.
- `1.00-1.15` for compact headings and display rows.
- `1.20-1.36` for short UI text.
- `1.45-1.60` for paragraphs.

Tracking rules:
- Use negative tracking only at large sizes; relax it on mobile.
- Use positive tracking for technical labels and small uppercase metadata.
- Never apply display tracking to forms, product specs, or body copy.
- Test the longest real word at desktop, tablet, and mobile.

Mobile type safety:

```css
.et-display {
  max-width: 100%;
  font-size: clamp(64px, 14vw, 220px);
  line-height: .86;
  letter-spacing: -.05em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

@media (max-width: 640px) {
  .et-display {
    font-size: clamp(48px, 18vw, 72px);
    line-height: .92;
    letter-spacing: -.032em;
  }
}
```

Do not scale font size directly with viewport width without min/max limits. For long names, define editorial line breaks in content or use alternate short labels at mobile.

## Color And Surface Contracts

Experimental Type gets louder when the palette is stricter.

| Palette | Use | Contract |
| --- | --- | --- |
| Achromatic specimen | Foundry, archive, editorial | White/black/gray only; underlines and type scale provide action |
| Industrial plus signal | Hardware and technical products | Signal blue marks actions only; grays and images carry richness |
| Red statement | Campaign and art direction | Red is a full scene or major block; black/white handles UI |
| Chromatic block | Directory and playful index | Color is a structural surface mapped to categories |
| Parchment brutalist | Personal/studio identity | Tiny warm monochrome system; underlines and pills create contrast |

Surface rules:
- Prefer flat fields, borders, and underlines over shadows.
- Use cards only when the content needs grouping or repetition.
- Do not put default rounded SaaS cards under a radical typographic hero.
- Keep radius global: zero, pill, or one deliberate contrast rule.
- If a surface changes color on hover, it must remain readable and not resize.

## Layout Systems

### Poster Hero

Use when the headline is the image. Anatomy: compact nav, small metadata, massive display word, short support copy, one decisive action, and a next-section sliver. Cropping is allowed only when the word remains recognizable or the full text is provided nearby.

### Product Catalog Grid

Use when type supports physical products. Anatomy: technical nav, product image cells, precise labels, small action links, spec rows. Identity comes from type thinness, grid discipline, and square surfaces.

### Chromatic Block Index

Use when browsing is the main activity. Anatomy: sparse header, centered short intro, full-width color block links, filter/index section, plain about note. Blocks should behave like category buttons or routes.

### Brutalist Nameplate

Use when one person, studio, or project is the subject. Anatomy: mechanical tab bar, massive nameplate, compact serif intro, typographic project index, monochrome contact panel.

### Specimen Tester

Use when typography is the product. Anatomy: metadata row, large editable sample, axis controls, family/style list, licensing or conversion strip. Controls must be quiet enough that the sample remains primary.

## Component Arsenal

Use at least four components for a full page or app. Each component needs real content and states.

### Refero Expansion Component Deltas

- Type-first components can be extreme only when their numbers are explicit: Wise Sans 187-562px display with `.85` leading; ORYZO halyard 10-410px; Branding/SVZ dark red with 48px section rhythm; Wonder display around 50px with `-2.5px`; amp warm CTAs with 24px buttons.
- Experimental cards should keep their source geometry: Wise 86px rounded chromatic cards, Wonder 14px dark product cards, ORYZO 12px organic cards, amp 5/8px compact cards/images, Branding/SVZ 3/8/14.4px.
- Inputs and badges are not generic: Wonder inputs/badges 9999px, ORYZO buttons/badges 36px, amp inputs 50px. Keep labels readable even when display type is oversized.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type ExperimentalTypeState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type ExperimentalTypeStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function ExperimentalTypeStatusPill({ role, children }: { role: ExperimentalTypeStatus; children: React.ReactNode }) {
  return <span className="experimental-type-status-pill" data-role={role}>{children}</span>;
}

export function VariableTypeHeroContract({ state = "default" }: { state?: ExperimentalTypeState }) {
  return <section className="experimental-type-hero-object" data-state={state} aria-label="Experimental Type proof object" />;
}

export function GlyphGridContract({ title, meta, state = "default" }: { title: string; meta: string; state?: ExperimentalTypeState }) {
  return <article className="experimental-type-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function SpecimenSliderContract({ items }: { items: string[] }) {
  return <nav className="experimental-type-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function ExperimentalTypeSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="experimental-type-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.experimental-type-status-pill {
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
.experimental-type-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.experimental-type-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.experimental-type-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.experimental-type-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.experimental-type-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.experimental-type-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.experimental-type-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.experimental-type-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.experimental-type-card[data-state="error"] { border-color: var(--status-danger-fg); }
.experimental-type-card > span { font: var(--type-meta); color: var(--text-muted); }
.experimental-type-card > strong { font: var(--type-card); color: var(--text); }
.experimental-type-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.experimental-type-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.experimental-type-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.experimental-type-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.experimental-type-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.experimental-type-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.experimental-type-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .experimental-type-hero-object { min-height: 280px; }
  .experimental-type-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### `variable-type-hero`

Purpose: first viewport identity and proof. Use for variable fonts, campaigns, type tools, or brands with a display axis.

Required states:
- idle: chosen axis values readable and stable
- hover/focus: axis or underline change with keyboard parity
- active: pressed CTA or selected word state
- selected/current: active font family, mode, or slide is visibly marked
- loading: fallback font or skeleton preserves hero dimensions
- error: font unavailable message with fallback sample

TSX skeleton:

```tsx
type Axis = { weight: number; width: number; slant: number };

export function VariableTypeHero({ axis, sample }: { axis: Axis; sample: string }) {
  return (
    <section className="et-hero" data-archetype="specimen">
      <nav className="et-nav" aria-label="Primary">
        <a href="/">Foundry</a>
        <a aria-current="page" href="/families">Families</a>
        <a href="/license">License</a>
      </nav>
      <div className="et-hero__grid">
        <p className="et-meta">Variable family / 18 styles / Latin extended</p>
        <h1
          className="et-hero__sample"
          style={{ fontVariationSettings: `"wght" ${axis.weight}, "wdth" ${axis.width}, "slnt" ${axis.slant}` }}
        >
          {sample}
        </h1>
        <div className="et-hero__actions">
          <a className="et-link" href="/test">Test type</a>
          <a className="et-link et-link--primary" href="/license">Start license</a>
        </div>
      </div>
    </section>
  );
}
```

CSS:

```css
.et-hero {
  min-height: 92svh;
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--et-bg);
  color: var(--et-ink);
  overflow: hidden;
}

.et-nav {
  min-height: 56px;
  display: flex;
  gap: clamp(16px, 3vw, 40px);
  align-items: center;
  padding: 0 clamp(16px, 4vw, 56px);
  font: 400 13px/1.2 var(--et-ui);
  letter-spacing: .06em;
  text-transform: uppercase;
}

.et-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: end;
  gap: clamp(16px, 3vw, 36px);
  padding: clamp(32px, 7vw, 96px) clamp(16px, 4vw, 56px);
}

.et-hero__sample {
  margin: 0;
  font-family: var(--et-display);
  font-size: clamp(72px, 18vw, 251px);
  line-height: .86;
  letter-spacing: -.045em;
  max-width: 11ch;
  overflow-wrap: anywhere;
}

.et-link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: .18em;
}

.et-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
```

### `axis-control-panel`

Purpose: a functional playground for size, weight, width, slant, optical size, theme, or sample text.

Required controls:
- text input or contenteditable sample
- range sliders with visible values
- reset control
- style selector
- metadata readout
- disabled/loading state while font loads

CSS state pattern:

```css
.et-axis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  border-top: 1px solid var(--et-line);
  border-bottom: 1px solid var(--et-line);
}

.et-axis__control {
  min-height: 72px;
  padding: 12px;
  background: transparent;
  border-right: 1px solid var(--et-line);
}

.et-axis input[type="range"] {
  width: 100%;
  accent-color: var(--et-action);
}

.et-axis__control:focus-within {
  background: var(--et-focus-surface);
  box-shadow: inset 0 -3px 0 var(--et-ink);
}

.et-axis[data-state="loading"] {
  color: var(--et-muted);
  pointer-events: none;
}

@media (max-width: 760px) {
  .et-axis {
    grid-template-columns: 1fr;
  }
}
```

### `kinetic-marquee`

Purpose: motion-bearing type used for launch energy, category scanning, or live status. It must not carry essential copy alone.

Rules:
- Use duplicate content with `aria-hidden` for the moving lane.
- Provide a static label before or after the lane.
- Pause on hover/focus if the marquee is interactive.
- Disable movement for reduced motion.
- Keep transform-only animation.

```css
.et-marquee {
  overflow: clip;
  border-block: 1px solid currentColor;
  white-space: nowrap;
}

.et-marquee__track {
  display: flex;
  width: max-content;
  animation: et-marquee 18s linear infinite;
}

.et-marquee__item {
  padding: 14px 24px;
  font-family: var(--et-display);
  font-size: clamp(40px, 8vw, 112px);
  line-height: .9;
  letter-spacing: -.04em;
}

.et-marquee:is(:hover, :focus-within) .et-marquee__track {
  animation-play-state: paused;
}

@keyframes et-marquee {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .et-marquee__track {
    animation: none;
    transform: none;
    flex-wrap: wrap;
    width: auto;
  }
}
```

### `glyph-grid`

Purpose: proof module for type foundries, archives, and visual identities.

States:
- loading: fixed grid cells with fallback glyphs
- empty: "No glyphs in this subset" plus subset switch
- error: font failed with retry and fallback label
- selected: active glyph cell inverted or underlined

Construction:
- Use `grid-template-columns: repeat(auto-fit, minmax(72px, 1fr))`.
- Cells keep `aspect-ratio: 1`.
- Big glyph, small unicode/name label, optional category.
- Hover changes fill or underline, not cell size.

### `poster-card`

Purpose: repeated campaign tile or project tile. It can be loud, but it must carry content.

States:
- default: title, category, year/status, one image or typographic proof
- hover/focus: type shift, underline, or clipped accent layer
- unavailable: explicit label and muted action
- selected: persistent border/fill change
- reduced motion: no skew/axis animation, static state visible

### `type-index`

Purpose: project list, family list, issue list, release archive, or collection browser.

```css
.et-index-row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 160px 80px;
  gap: 16px;
  align-items: baseline;
  padding: 18px 0;
  border-top: 1px solid currentColor;
  color: inherit;
  text-decoration: none;
}

.et-index-row__title {
  font-family: var(--et-display);
  font-size: clamp(34px, 5vw, 72px);
  line-height: .92;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}

.et-index-row:is(:hover, :focus-visible) .et-index-row__title {
  font-variation-settings: "wdth" 118, "wght" 760;
}

@media (max-width: 640px) {
  .et-index-row {
    grid-template-columns: 44px minmax(0, 1fr);
  }
  .et-index-row__meta,
  .et-index-row__year {
    grid-column: 2;
  }
}
```

### `distorted-nav`

Purpose: navigation that belongs to the typographic system.

Rules:
- Distortion is limited to hover, active, selected, or large display nav.
- Functional nav labels remain readable.
- Current page uses `aria-current`.
- Mobile can switch to plain list, scroll tabs, or a compact index.
- Focus must be more visible than decorative hover.

## Motion System

- Experimental type motion may be stronger, but it still needs a role: 180-320ms for hover/focus, 300-700ms for type mask or chromatic sweep, and no looping display motion unless it routes attention to content. Reduced motion freezes type transforms and keeps final layout readable.

## Complete Page Protocols

```tsx
// Type Specimen
<main data-skill="experimental-type" data-archetype="type-specimen">
  <VariableTypeHeroContract axes={["wdth", "wght", "slnt"]} />
  <AxisControlPanelContract state="selected" />
  <GlyphGridContract sample="A-Z / 0-9 / symbols" />
  <SpecimenSliderContract labels={["Narrow", "Regular", "Ultra"]} />
</main>

// Poster Campaign
<main data-skill="experimental-type" data-archetype="poster-campaign">
  <PosterCardContract title="NO STATIC DEFAULTS" meta="Campaign 01" />
  <KineticMarqueeContract items={["WIDTH", "WEIGHT", "RHYTHM"]} />
  <TypeIndexContract items={["Posters", "Tickets", "Archive"]} />
</main>
```
```tsx
// Type Specimen
<main data-skill="experimental-type" data-archetype="type-specimen">
  <VariableTypeHeroContract axes={["wdth", "wght", "slnt"]} />
  <AxisControlPanelContract state="selected" />
  <GlyphGridContract sample="A-Z / 0-9 / symbols" />
  <SpecimenSliderContract labels={["Narrow", "Regular", "Ultra"]} />
</main>

// Poster Campaign
<main data-skill="experimental-type" data-archetype="poster-campaign">
  <PosterCardContract title="NO STATIC DEFAULTS" meta="Campaign 01" />
  <KineticMarqueeContract items={["WIDTH", "WEIGHT", "RHYTHM"]} />
  <TypeIndexContract items={["Posters", "Tickets", "Archive"]} />
</main>
```
Motion must be typographic: variable axis shifts, mask reveals, line wipes, marquee lanes, editable specimen updates, or index row transformations.

Allowed properties:
- `transform`
- `opacity`
- `clip-path`
- `filter` with restraint
- `font-variation-settings` for supported variable fonts

Avoid:
- animating layout width/height
- continuous motion on essential paragraphs
- scroll-fade spam
- motion that makes text less readable
- pinning huge type on mobile unless tested

Primitive:

```css
[data-et-motion="axis-shift"] {
  transition:
    font-variation-settings 360ms cubic-bezier(.16, 1, .3, 1),
    transform 360ms cubic-bezier(.16, 1, .3, 1),
    clip-path 520ms cubic-bezier(.16, 1, .3, 1);
  will-change: transform, clip-path;
}

[data-et-motion="axis-shift"]:is(:hover, :focus-visible, [data-active="true"]) {
  font-variation-settings: "wdth" 122, "wght" 850;
  transform: skewX(-2deg);
  clip-path: inset(0 0 0 0);
}

[data-et-motion="mask-rise"] {
  animation: et-mask-rise 620ms cubic-bezier(.16, 1, .3, 1) both;
}

@keyframes et-mask-rise {
  from { transform: translateY(105%) skewY(2deg); clip-path: inset(0 0 100% 0); }
  to { transform: translateY(0) skewY(0); clip-path: inset(0 0 0 0); }
}

@media (prefers-reduced-motion: reduce) {
  [data-et-motion] {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    clip-path: none !important;
    filter: none !important;
  }
}
```

Motion by archetype:
- Industrial: blue link shift, product image reveal, thin line sweep, no theatrical loops.
- Red editorial: mask-in display word, pill inversion, one red scene transition.
- Chromatic block: block slide or color swap on route/filter, no bouncing.
- Brutalist: tab fill snap, underline draw, slow nameplate reveal.
- Specimen: axis updates, tester edits, underline states, subtle glyph selection.


## Copy And Content

Experimental Type wants concrete nouns and compact labels.

Prefer:
- "Type systems for cultural software"
- "Identity / Interface / Printed matter"
- "Index 2019-2026"
- "Read the specimen"
- "Start a license"
- "View instruments"
- "Direction / Type / Systems"

Avoid vague claims like "unlock creativity", "future-forward experiences", "beautiful digital products", "supercharge your workflow", and "next-generation platform."

Microcopy by archetype:
- Industrial: model, specification, field system, archive, buy now.
- Red editorial: index, works, selected, statement, contact.
- Chromatic block: browse styles, variable, found, collection, category.
- Brutalist: work, about, notes, now, inquiry.
- Specimen: view family, test type, license, styles, glyphs.

## Accessibility And Production

- Live text is preferred over rasterized text.
- If text becomes decorative or canvas-rendered, provide accessible equivalent text.
- Preload critical display fonts when the hero depends on them.
- Define fallback metrics close enough to avoid severe layout shift.
- Do not hide the entire page while display fonts load.
- Test missing font state.
- Contrast-test chromatic blocks individually.
- Focus states must be visible in the same visual language as hover.
- Touch targets should be at least `40px`, preferably `44px`.

Font loading:

```css
@font-face {
  font-family: "Display Experimental";
  src: url("/fonts/display.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

## Failure Corrections

If it looks generic:
- Increase the typographic role.
- Remove generic card wrappers.
- Strengthen the archetype palette and radius.
- Add real specimen, product, or index proof.
- Make one section full-bleed.

If it looks unreadable:
- Move body/UI to the functional face.
- Increase paragraph line-height.
- Relax negative tracking on smaller text.
- Add accessible duplicate text for decorative display.
- Improve contrast.

If it looks random:
- Choose one archetype.
- Reduce colors, typefaces, motion styles, and radius systems.
- Assign every block and color to a content job.
- Remove decorative effects that do not guide action.

If it feels too quiet:
- Increase display scale.
- Add a live specimen, full-bleed statement, or stronger index.
- Use tracking/line-height contrast more decisively.

If it feels too loud:
- Limit expressive type to hero, specimen, and section breaks.
- Make navigation and body calmer.
- Lower motion intensity.
- Reduce accent surfaces.

## Absolute Bans

- No illegible essential copy.
- No multiple competing type experiments in one viewport.
- No accidental mobile overflow.
- No default rounded SaaS cards under radical display type.
- No gradients, blur, or shadows used to hide weak hierarchy.
- No color without category, state, proof, or action.
- No hover-only meaning.
- No body copy set in an unreadable display face.
- No generic centered hero plus three-card row unless the existing product system requires it.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.

## Pre-Output Checklist

- First viewport contains a real typographic experiment object.
- One Experimental Type archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to variable-axis or kinetic type behavior and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
