---
name: geometric-modern
description: "Use this skill to create modern geometric identities with strong grids, repeated shapes, modular composition, crisp rhythm, precise spacing, and layout systems where geometry explains the brand. USE FOR: geometric brand systems, modern portfolios, architecture, design districts, shape-led SaaS, structured editorial pages. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Geometric Modern Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Geometric Modern archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, modular grid, radial system, plan-view section, or shape-led product proof, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Geometric Modern components with states.
7. **Motion plan:** grid, shape, radial, or mask transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Geometric Modern design works when geometry is structure. Circles, rectangles, diagonals, modules, masks, grids, and coordinates should organize content, sequence attention, frame proof, and define interaction. They should not float over a generic layout as decoration.

Use this skill for architecture studios, design districts, modern portfolios, structured editorial pages, shape-led SaaS, cultural institutions, product systems, and brands that need a rational but memorable visual identity.

The desired feeling is structured, contemporary, rational, bold, rhythmic, and architectural. The page should look designed from a repeatable system of measurements and shapes, not assembled from isolated cards.


For substantial UI work, output a compact `<design_plan>` before code:

1. **Use case:** brand/product type, audience, main action, emotional target.
2. **Geometry grammar:** one primary shape system: grid, rectangle, circle, diagonal, capsule, coordinate, or plan view.
3. **Archetype:** one source archetype from this file and one supporting mode only if useful.
4. **First viewport:** nav geometry, H1 width/line strategy, proof object, CTA shape, next-section hint.
5. **System contracts:** type, colors, radius, grid tracks, module sizes, shape use, state behavior.
6. **Components:** at least four signature components with real content and states.
7. **Motion:** shape reveal, grid transition, mask behavior, and reduced-motion fallback.
8. **Risk sweep:** how you will avoid random shapes, broken mobile grids, and generic cards.

For small work, do it mentally. For a full site/app/redesign, show the plan.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium. Rhythm matters more than quantity. |
| motion | Medium. Shape morphs, grid reveal, clip-path wipes, and modular transitions. |
| decoration | Medium. Shapes are structural decoration. |
| contrast | Crisp neutrals plus one or two geometric accent fills. |
| radius | Either strict 0-4px or consistently circular/pill; do not mix randomly. |
| type | Geometric sans, condensed sans, or precise grotesk. |
| assets | Architecture, product modules, diagrams, shape masks, map-like grids. |

## Signature System

- Shape Grammar: choose circle, rectangle, diagonal, capsule, or grid module as the primary motif.
- Grid As Brand: visible alignment, repeated track sizes, and shape ratios create identity.
- Clip And Mask: imagery can be cropped by geometric rules rather than placed in generic rectangles.
- Rhythmic Repetition: repeat dimensions and alignments across hero, cards, sections, and footer.

## Differentiation

Use Geometric Modern when geometric brand systems, modern portfolios, architecture, design districts, shape-led SaaS, structured editorial pages. If removing the geometric grid or modular proof, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `minimal-design` for quieter restraint; use this when geometry actively structures navigation, grouping, sequencing, or brand memory.

### Execution Token Contract

Every Geometric Modern build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #f6f4ed;
  --surface: #ffffff;
  --surface-muted: #e8e2d6;
  --text: #111111;
  --text-muted: #625e55;
  --line: #111111;
  --action: #111111;
  --action-strong: #000000;
  --radius-control: 0px;
  --radius-card: 0px;
  --radius-panel: 0px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Space Grotesk", "Suisse Intl", var(--font-sans);
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
  --shadow-panel: inset 0 0 0 2px var(--line);
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
  --status-neutral-fg: #625e55;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --gm-alert: var(--status-warning-fg);
  --gm-bg: var(--canvas);
  --gm-cut: var(--surface-muted);
  --gm-display: var(--text);
  --gm-error-surface: var(--status-danger-bg);
  --gm-grid: var(--surface-muted);
  --gm-ink: var(--text);
  --gm-line: var(--line);
  --gm-mono: var(--surface-muted);
  --gm-muted: var(--text-muted);
  --gm-ratio: var(--surface-muted);
  --gm-shape: var(--action);
  --gm-success: var(--status-success-fg);
  --gm-success-surface: var(--status-success-bg);
  --gm-surface: var(--surface);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Geometric Modern token |
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

Token rule: if a value can be expressed by `gm`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Non-Negotiable Principles

- Geometry must carry structure: grouping, sequencing, hierarchy, mask, interaction, or proof.
- Choose one shape grammar and repeat it across hero, components, sections, and footer.
- Do not mix radius systems casually. Use `0-4px`, full pill/circle, or one deliberate contrast rule.
- Grid rhythm must survive mobile. If the desktop composition collapses, translate its logic rather than abandoning it.
- Shapes need content jobs. Empty decorative blocks are not enough.
- Use color as a structural fill or state, not a random accent.
- Motion must follow the geometry: wipe, rotate, slide, crop, align, or assemble.

## Source Archetypes

### Additional Refero Source Packs

- Factory industrial grid: `#020202/#eeeeee/#fafafa/#b8b3b0/#3d3a39/#a49d9a`, alert `#ef6f2`; Geist plus Geist Mono; display `60px/1/-2.88px`; 4px base, 72px sections, 16px cards, 4px gaps; cards 6px, buttons 4px, header 0px.
- Speakeasy precise accent geometry: use neutral blocks with one vivid structural accent; spectrum/rainbow treatment belongs to divider/top-border/route marker only.
- Revenue-Grade Automation modular violet: `#5757f8/#202020/#f5f5f5/#ffffff/#f7f5fd`; NB International Pro 26-72px with `-0.96px`, Saans Trial UI; 4px base, 1400px max, 40px sections, 20px cards, 24px gaps; pill buttons 1425.6px, inputs 10px.
- Programa architectural modules: `#1a1a1a/#ffffff/#a3a3a3/#fbff2b`; Neue Haas Grotesk Text; display `42px/1.1/-1.26px`; 6px base, 96px sections, 12px cards/gaps; cards 16px, nav/controls 10px.
- FORA block editorial geometry: `#ffffff/#000000/#a9553c/#a04d35/#ddbdea/#ffffff59`; Theinhardt 15/18/23/35px; 6px base, 25px card padding; 0px content blocks, 5px secondary radius, 9999px tags.

### 1. Monumental Monochrome Canvas

Source logic: Greenspace. Use for architecture, galleries, portfolios, cultural brands, and any project that benefits from stark black/white spatial authority.

| System Part | Direction |
| --- | --- |
| Hex | `#000000` carbon, `#bebebe` ash, `#ffffff` canvas |
| Typography | Grotesk at `72px` with line-height `1.03` for hero/nav statements; `24px` with `1.15` for lists and body blocks |
| Radius | `0px` |
| Spacing | `200px` section gaps, `37px` element/card rhythm, large vertical separation instead of visible dividers |
| Carry forward | Full-bleed black fields, inactive nav as ash text, huge navigation or project labels, boundaries through background shifts |
| Avoid | Extra chromatic colors, gradients, shadows, tiny captions, explicit card borders, layered ornaments |

Implementation posture:
- Make background shifts and spacing do the separating.
- Use very large text as navigation, project list, or section title.
- Keep imagery high-contrast and integrated, not decorative.
- Use ash for lower priority rather than adding new colors.

### 2. Monochrome Grid Blueprint

Source logic: Artem Militonian. Use for portfolios, design systems, diagrams, interactive indexes, and technical-cultural sites.

| System Part | Direction |
| --- | --- |
| Hex | `#ffffff`, `#000000`, `#282828`, `#a1a1a1` |
| Typography | Custom or condensed grotesk; sizes `8`, `34`, `60`, `157`; line-height `1.02-1.13`; negative tracking from `-0.025em` to `-0.088em` where scale supports it |
| Radius | `0px` |
| Spacing | `64px` section gaps, `1px` hairline logic, no padded cards |
| Carry forward | Underlined index links, full-bleed canvas, abstract line graphics, compact metadata, flat surfaces |
| Avoid | Color, shadows, rounded corners, large card padding, generic system-font headings, gradients |

Implementation posture:
- Use hairlines, underlines, and coordinate labels as the interface.
- Let background linework align to the content grid.
- Keep metadata precise and close to the object it describes.
- Use negative tracking only where the chosen font remains legible.

### 3. Architectural White Grid

Source logic: V-A-C. Use for institutions, exhibitions, archives, event calendars, architectural studios, and editorial systems with calm authority.

| System Part | Direction |
| --- | --- |
| Hex | `#ffffff`, `#000000`, `#999999` |
| Typography | Diagrammatic sans; body `16-20`; display `24-35`; line-heights `0.88`, `0.90`, `1.15`; normal letter-spacing |
| Radius | `0px` |
| Spacing | `150px` section gaps, `5px` element gaps, transparent cards, flexible vertical grid |
| Carry forward | Timeline-like two-column flow, rotated or side navigation, text-only buttons, line inputs |
| Avoid | Colored UI, shadows, explicit card backgrounds, rounded controls, gradients, decorative imagery |

Implementation posture:
- Use a plan/timeline grid with strong alignment.
- Treat event cards as content directly on the canvas.
- Make forms and buttons transparent with lines.
- Let wide section gaps produce institutional calm.

### 4. Warm Modular Earth Geometry

Source logic: Theodore Ellison Designs. Use for interiors, furniture, craft, hospitality, architecture, and brands that need geometry with warmth.

| System Part | Direction |
| --- | --- |
| Hex | `#413128` mahogany, `#d6926b` clay, `#3c4531` moss, `#38506c` slate, `#afa5b4` lavender, `#272729` charcoal, `#fdfcf2` almond, `#f2ede1` sand |
| Typography | ModernEra-like sans for headings/body `16-40`; mono labels at `14-16` with `-0.007em` tracking |
| Radius | `0px` for cards, buttons, inputs |
| Spacing | `180px` major sections, `20px` element/card padding, full color bands |
| Carry forward | Earth-tone section modules, square outlined CTAs, mono nav labels, generous image-led pacing |
| Avoid | Drop shadows, rounded UI, vivid primary colors, dense clusters, generic system inputs |

Implementation posture:
- Use color bands as rooms or modules, not decoration.
- Pair warm fills with strict rectangles.
- Let imagery command attention inside sharp frames.
- Use mono labels for coordinates, materials, or navigation.

### 5. Graphic Modernist Poster

Source logic: Eindhoven Design District. Use for design events, editorial campaigns, city districts, community programs, and graphic brand systems.

| System Part | Direction |
| --- | --- |
| Hex | `#ffffff`, `#000000`, `#e8e8e8`, `#bfbfbf`, `#ff0000`, `#ffc2eb`, `#0f26ed` |
| Typography | Helvetica-like sans; sizes `14-50`; line-height `0.93-1.47`; tight display tracking from `-0.05em` to `-0.02em`; small labels may use positive tracking |
| Radius | Cards/images `0px`; buttons/tags pill around `500px`; circular icon buttons |
| Spacing | `35px` section gaps, `20px` element/card padding, centered max-width plus full-bleed hero breaks |
| Carry forward | Poster-scale typography, black-outline pills, simple icon buttons, contained rectangular imagery, selective red/pink/blue blocks |
| Avoid | Mid-tone mush, shadows, extra fonts, gradients, rounded images/cards, overusing vivid colors |

Implementation posture:
- Use one geometric poster move in the first viewport.
- Keep photographic rectangles sharp.
- Use pills for navigation and CTAs only if repeated consistently.
- Reserve vivid colors for content emphasis, not general chrome.

## Geometry Grammar

Choose one primary grammar. If a page needs a secondary grammar, give it a different job.

| Grammar | Use For | Rules |
| --- | --- | --- |
| Strict grid | SaaS, portfolios, archives | Repeated tracks, visible alignment, module spans, consistent gutters |
| Rectangular blocks | editorial, commerce, institutions | Full-width bands, framed images, content cells, sharp edges |
| Circle/radial | brands, maps, playful tools | Circular crops, orbit controls, radial nav; keep text outside distorted arcs |
| Diagonal/chamfer | tech, modernist posters, product detail | Clip masks and directional sequencing; do not overuse |
| Capsule/pill | events, nav, filters | One rounded control language against square content fields |
| Coordinate/plan | architecture, data, places | Labels, axis marks, floorplan grids, line inputs, measured spacing |

Geometry as structure:
- A circle can group people, modes, or a selected item.
- A diagonal can reveal an image or route the eye across a hero.
- A grid module can contain a product, event, metric, or preview.
- A coordinate label can identify location, sequence, or content status.
- A color block can define a chapter.

Geometry as decoration:
- Random abstract shapes behind a normal card row.
- Unlabeled circles with no relation to interaction.
- Diagonals that make text harder to read.
- Shape variety changing every section.

## Type System

Geometric Modern type is crisp and spatial. Prefer geometric sans, grotesk, mono labels, or one precise display face.

Scale guidance:

| Role | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| Hero display | `64-157px` | `40-68px` | Tight line-height, controlled tracking |
| Section title | `34-72px` | `28-42px` | Align to grid columns |
| Body/list | `16-24px` | `16-20px` | Readable line-height |
| Coordinate label | `8-14px` | `11-14px` | Increase mobile size if too small |
| Button/tag | `14-18px` | `14-16px` | Stable height, no wrapping surprises |

Letter-spacing rules from the sources:
- Monochrome grid can use intense negative tracking at huge sizes, like `-0.088em` at `157px`; never blindly copy that to small text.
- Graphic modernist posters can use `-0.05em` at `50px`, `-0.03em` at `46px`, and positive tracking on `14px` labels.
- Architectural white grid usually keeps normal letter-spacing; respect that if the design is institutional.
- Warm modular systems can use slight negative mono tracking for functional labels.
- If display tracking causes collisions on mobile, reduce the negative value and increase line-height.

## Grid, Modules, And Section Rhythm

Grid must be explicit. Use stable tracks and predictable module spans.

Recommended grid contracts:
- 12-column desktop grid for brand/product pages.
- 6-column tablet grid for editorial sections.
- 1-2 column mobile grid with shape logic preserved through order, labels, and masks.
- `minmax(0, 1fr)` for all flexible tracks.
- Use `aspect-ratio` for shape modules, galleries, and proof blocks.
- Use named grid areas for heroes that include nav, copy, proof, and CTA.

Section gap raw signals:
- `200px` for monumental black/white spacing.
- `180px` for warm architectural sections.
- `150px` for institutional white-grid narratives.
- `64px` for compact blueprint portfolios.
- `35px` for graphic poster density.

Translate gaps by page type:
- Brand/campaign: large gaps are allowed, but reveal next content in first viewport.
- App/dashboard: keep sections tighter, `12-32px`, and express geometry through modules and controls.
- Commerce: use `16-32px` grid gaps and larger editorial breaks around featured products.
- Mobile: reduce gaps by half or more, but keep a clear rhythm.

## Color And Surface Contracts

Do not use every source color. Choose a semantic palette.

| Palette Mode | Best For | Contract |
| --- | --- | --- |
| Carbon monochrome | galleries, portfolios | Black and white fields; ash for inactive states |
| Blueprint monochrome | technical portfolios | White canvas, black lines, graphite metadata |
| Institutional white | events, archives | White, black, one gray; no decorative fill |
| Warm modular | interiors, craft | Earth-tone bands with sharp geometry |
| Poster accent | design events | Black/white foundation plus one vivid block color at a time |

Surface rules:
- Cards can exist only when they are repeated items, controls, or product/event modules.
- Do not style whole page sections as floating cards.
- Prefer bands, rows, grids, and masks.
- Use 1px borders where geometry needs precision.
- Use background changes where geometry needs weight.
- Avoid shadows; if depth is necessary, use contrast, outline, or image layering.

## Signature Components

Use at least four for a full page. Components need real content and interaction states.

### Refero Expansion Component Deltas

- Geometry is the style contract: Factory 4px base/4px gaps/6px cards, Revenue-Grade 20px cards plus huge pills, Programa 10/16px modules, FORA 0px blocks with 5px secondary and 9999px tags, Speakeasy accent as structural border/divider.
- Layout modules must align to a declared grid: Factory dense machine grid, Revenue-Grade 1400px modular SaaS, Programa 96px architectural sections, FORA editorial blocks, Speakeasy high-contrast accent rails.
- Do not use arbitrary rounded cards: every radius must explain hierarchy, action, tag, image, or block structure.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type GeometricModernState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type GeometricModernStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function GeometricModernStatusPill({ role, children }: { role: GeometricModernStatus; children: React.ReactNode }) {
  return <span className="geometric-modern-status-pill" data-role={role}>{children}</span>;
}

export function ModularHeroGridContract({ state = "default" }: { state?: GeometricModernState }) {
  return <section className="geometric-modern-hero-object" data-state={state} aria-label="Geometric Modern proof object" />;
}

export function ShapeMaskCardContract({ title, meta, state = "default" }: { title: string; meta: string; state?: GeometricModernState }) {
  return <article className="geometric-modern-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function RadialNavClusterContract({ items }: { items: string[] }) {
  return <nav className="geometric-modern-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function GeometricModernSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="geometric-modern-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.geometric-modern-status-pill {
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
.geometric-modern-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.geometric-modern-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.geometric-modern-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.geometric-modern-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.geometric-modern-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.geometric-modern-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.geometric-modern-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.geometric-modern-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.geometric-modern-card[data-state="error"] { border-color: var(--status-danger-fg); }
.geometric-modern-card > span { font: var(--type-meta); color: var(--text-muted); }
.geometric-modern-card > strong { font: var(--type-card); color: var(--text); }
.geometric-modern-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.geometric-modern-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.geometric-modern-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.geometric-modern-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.geometric-modern-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.geometric-modern-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.geometric-modern-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .geometric-modern-hero-object { min-height: 280px; }
  .geometric-modern-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### `modular-hero-grid`

Purpose: first viewport built from explicit modules: brand, headline, proof image/object, CTA, index/metadata, next-section reveal.

Required states:
- hover/focus on nav, CTA, and proof link
- selected/current nav state
- loading proof block with fixed aspect ratio
- empty proof block with a useful next action
- error proof block with retry/recovery

TSX:

```tsx
type Module = {
  id: string;
  title: string;
  meta: string;
  state?: "default" | "selected" | "loading" | "error";
};

export function ModularHeroGrid({ modules }: { modules: Module[] }) {
  return (
    <section className="gm-hero">
      <nav className="gm-nav" aria-label="Primary">
        <a className="gm-mark" href="/">GM</a>
        <a aria-current="page" href="/work">Work</a>
        <a href="/process">Process</a>
        <a href="/contact">Contact</a>
      </nav>
      <div className="gm-hero__grid">
        <div className="gm-hero__copy">
          <p className="gm-coordinate">A01 / SYSTEM</p>
          <h1>Spatial identity systems for real products.</h1>
          <a className="gm-button" href="/start">Plan the system</a>
        </div>
        <div className="gm-proof" data-state={modules[0]?.state ?? "default"}>
          <span className="gm-proof__shape" aria-hidden="true" />
          <p>{modules[0]?.title ?? "No module selected"}</p>
          <small>{modules[0]?.meta ?? "Choose a project type to populate the grid."}</small>
        </div>
      </div>
    </section>
  );
}
```

CSS:

```css
.gm-hero {
  min-height: 92svh;
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--gm-bg);
  color: var(--gm-ink);
}

.gm-nav {
  min-height: 64px;
  display: grid;
  grid-template-columns: 80px repeat(3, max-content) 1fr;
  gap: 20px;
  align-items: center;
  padding: 0 clamp(16px, 4vw, 56px);
  border-bottom: 1px solid var(--gm-line);
}

.gm-hero__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: minmax(72px, auto);
  gap: clamp(12px, 2vw, 24px);
  padding: clamp(24px, 5vw, 72px);
}

.gm-hero__copy {
  grid-column: 1 / span 6;
  align-self: end;
}

.gm-hero__copy h1 {
  max-width: 10ch;
  margin: 0 0 24px;
  font: 500 clamp(52px, 8vw, 132px)/.94 var(--gm-display);
  letter-spacing: -.045em;
}

.gm-proof {
  grid-column: 8 / span 5;
  align-self: stretch;
  min-height: min(56vh, 640px);
  display: grid;
  grid-template-rows: 1fr auto auto;
  padding: 20px;
  border: 1px solid var(--gm-line);
  overflow: hidden;
}

.gm-proof__shape {
  align-self: center;
  justify-self: center;
  width: min(70%, 360px);
  aspect-ratio: 1;
  background: var(--gm-shape);
  clip-path: polygon(0 0, 100% 0, 100% 78%, 78% 100%, 0 100%);
}

@media (max-width: 760px) {
  .gm-nav {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-block: 12px;
  }
  .gm-hero__grid {
    grid-template-columns: 1fr;
  }
  .gm-hero__copy,
  .gm-proof {
    grid-column: 1;
  }
  .gm-hero__copy h1 {
    font-size: clamp(42px, 14vw, 68px);
    letter-spacing: -.025em;
  }
}
```

### `shape-mask-card`

Purpose: product, project, article, event, or service module where the mask is part of the content structure.

Required states:
- loading: same aspect-ratio shell with line or block skeleton
- empty: clear message and action
- error: border/fill change plus recovery
- selected: persistent geometry change or filled coordinate label
- unavailable: muted image and explicit status

Rules:
- Use one mask family per project: chamfer, circle, hard rectangle, or pill.
- Keep text outside complex masks unless contrast and wrapping are guaranteed.
- Hover may animate inner image scale or mask edge, never outer dimensions.
- The card's shape must repeat elsewhere in the system.

### `radial-nav-cluster`

Purpose: mode switch, place selector, product family switch, or chapter nav. Best when the brand has circular logic.

States:
- compact mobile list
- expanded desktop radial placement
- selected/current item
- keyboard focus ring that does not rely on rotation
- disabled/unavailable item

Rules:
- Do not put long text on an arc.
- Keep touch targets at least `44px`.
- Use `aria-current` or selected state.
- Provide a linear DOM order matching visual order.

### `coordinate-label`

Purpose: small but useful location, index, status, or measurement marker.

CSS:

```css
.gm-coordinate {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 8px;
  align-items: center;
  font: 500 12px/1 var(--gm-mono);
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--gm-muted);
}

.gm-coordinate::before {
  content: "";
  width: 24px;
  height: 1px;
  background: currentColor;
}

.gm-coordinate[data-state="active"] {
  color: var(--gm-ink);
}
```

Use coordinates for sequence, location, dataset, gallery count, event status, or module identity. Do not scatter them as fake technical flavor.

### `geometric-stat-block`

Purpose: metric, proof, performance, availability, attendance, or product comparison.

Rules:
- Stable aspect ratio or fixed min-height.
- Large number aligns to the same grid as heading.
- Unit and explanation are readable.
- Hover/focus can fill the block, invert color, or move a line indicator.
- Loading uses fixed digit skeletons to prevent jump.

### `clip-path-gallery`

Purpose: image proof with geometric cropping.

States:
- loading image with fixed aspect ratio
- empty gallery with upload/select action
- error image fallback
- selected image state
- reduced-motion state if crop reveals animate

Rules:
- Images must reveal the product, place, object, or artwork clearly.
- Clip-path should support content, not obscure it.
- On mobile, reduce aggressive crops.
- Provide alt text and avoid text embedded in images when live text can work.

### `plan-view-section`

Purpose: architecture/process/workflow section using a floorplan, map, or grid.

Structure:
- left or top coordinate legend
- modules laid out in a measured grid
- one selected/detail panel
- clear path or sequence
- mobile translation into ordered rows with retained labels

### `module-footer`

Purpose: closure that repeats the shape grammar.

Rules:
- Footer is not a link dump.
- Repeat the grid, coordinate system, color band, or pill language.
- Include contact/action, key navigation, and one proof/detail.
- Keep labels readable and aligned.

## Shape Components

Reusable CSS primitives:

```css
.gm-rect {
  aspect-ratio: var(--gm-ratio, 4 / 3);
  border: 1px solid var(--gm-line);
  background: var(--gm-surface);
}

.gm-circle {
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--gm-shape);
}

.gm-chamfer {
  aspect-ratio: var(--gm-ratio, 1);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--gm-cut, 32px)), calc(100% - var(--gm-cut, 32px)) 100%, 0 100%);
  background: var(--gm-shape);
}

.gm-pill {
  border-radius: 999px;
  border: 1px solid currentColor;
}

.gm-grid-field {
  background-image:
    linear-gradient(to right, color-mix(in srgb, currentColor 16%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, currentColor 16%, transparent) 1px, transparent 1px);
  background-size: var(--gm-grid, 40px) var(--gm-grid, 40px);
}
```

Usage rules:
- `gm-rect` for content modules, images, cards, panels.
- `gm-circle` for avatars, selected modes, icon buttons, radial systems.
- `gm-chamfer` for directional product or feature reveals.
- `gm-pill` for filters, tags, event CTAs.
- `gm-grid-field` for plan/blueprint contexts only.

## Interaction States

Every interactive component should define:

- Refero state geometry: Factory uses fill/border changes in 4px toolbars; Revenue-Grade uses violet pill focus and 10px inputs; Programa uses thin border and acid note chip; FORA uses tag pills and sharp blocks; Speakeasy uses accent rail/divider states.

| State | Geometric Treatment |
| --- | --- |
| Hover | Fill a module, shift a line, reveal a mask edge, or invert a pill |
| Focus | High-contrast outline or inset line; never invisible |
| Active | Slight translate or filled selected shape, not layout resize |
| Selected/current | Persistent fill, coordinate marker, or border weight |
| Disabled | Desaturate or hatch, plus readable reason if needed |
| Loading | Fixed dimensions, skeleton lines matching grid |
| Empty | Blank module with coordinate label and next action |
| Error | Strong border/fill plus recovery text; not only red |
| Success | Confirmation state in system accent or filled module |

State class example:

```tsx
const moduleState = {
  idle: "data-[state=idle]:border-current",
  selected: "data-[state=selected]:bg-current data-[state=selected]:text-[var(--gm-bg)]",
  loading: "data-[state=loading]:animate-pulse data-[state=loading]:text-[var(--gm-muted)]",
  error: "data-[state=error]:border-[var(--gm-alert)] data-[state=error]:bg-[var(--gm-error-surface)]",
  success: "data-[state=success]:border-[var(--gm-success)] data-[state=success]:bg-[var(--gm-success-surface)]"
};
```

## Motion System

- Geometric motion follows structure: 120-220ms align/slide/underline, 180-320ms module assemble, no organic blobs or free-floating parallax. Reduced motion preserves grid position, active border, and selected fill.

## Complete Page Protocols

```tsx
// Modular Grid Brand
<main data-skill="geometric-modern" data-archetype="modular-grid-brand">
  <ModularHeroGridContract state="selected" />
  <CoordinateLabelContract value="A/04" />
  <GeometricStatBlockContract title="48 modules" meta="grid proof" />
  <ModuleFooterContract tracks={["Work", "System", "Contact"]} />
</main>

// Shape-Led Product
<main data-skill="geometric-modern" data-archetype="shape-led-product">
  <ShapeMaskCardContract title="Catalog" meta="consistent crop geometry" />
  <RadialNavClusterContract items={["Plan", "Build", "Ship"]} />
  <ClipPathGalleryContract images={productOrArchitectureCrops} />
</main>
```
```tsx
// Modular Grid Brand
<main data-skill="geometric-modern" data-archetype="modular-grid-brand">
  <ModularHeroGridContract state="selected" />
  <CoordinateLabelContract value="A/04" />
  <GeometricStatBlockContract title="48 modules" meta="grid proof" />
  <ModuleFooterContract tracks={["Work", "System", "Contact"]} />
</main>

// Shape-Led Product
<main data-skill="geometric-modern" data-archetype="shape-led-product">
  <ShapeMaskCardContract title="Catalog" meta="consistent crop geometry" />
  <RadialNavClusterContract items={["Plan", "Build", "Ship"]} />
  <ClipPathGalleryContract images={productOrArchitectureCrops} />
</main>
```
Motion should feel measured and structural.

Use:
- grid assembly
- clip-path wipes
- shape mask reveals
- line drawing
- coordinate indicator movement
- radial menu expansion
- product/image crop shifts

Avoid:
- generic scroll fade on every section
- floating abstract shapes
- text moving while users need to read it
- changing layout dimensions on hover
- complex pinning on mobile without testing

CSS primitive:

```css
[data-gm-motion="grid-reveal"] {
  transition:
    transform 420ms cubic-bezier(.16, 1, .3, 1),
    opacity 420ms cubic-bezier(.16, 1, .3, 1),
    clip-path 520ms cubic-bezier(.16, 1, .3, 1),
    background-color 180ms ease;
  will-change: transform, clip-path;
}

[data-gm-motion="grid-reveal"]:is(:hover, :focus-visible, [data-active="true"]) {
  transform: translateY(-2px);
  clip-path: polygon(0 0, 100% 0, 100% 82%, 82% 100%, 0 100%);
}

[data-gm-motion="line-draw"] {
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0 1px;
  background-position: 0 100%;
  background-repeat: no-repeat;
  transition: background-size 240ms ease;
}

[data-gm-motion="line-draw"]:is(:hover, :focus-visible) {
  background-size: 100% 1px;
}

@keyframes gm-grid-wipe {
  from { clip-path: inset(0 100% 0 0); transform: translateX(-12px); }
  to { clip-path: inset(0 0 0 0); transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  [data-gm-motion] {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    clip-path: none !important;
  }
}
```

Motion by archetype:
- Monumental monochrome: slow section field switch, no constant motion.
- Blueprint: line draw, coordinate shift, underlined links.
- Architectural white: calm image or event row reveal, final state readable.
- Warm modular: band transition, image crop, module fill.
- Poster: pill inversion, graphic block wipe, contained image reveal.


## Copy Guidance

Geometric Modern copy should be concrete, spatial, and direct.

Good labels:
- Plan / Build / Measure
- Index 01-24
- North Hall / Studio B
- Module system
- Material library
- View the plan
- Reserve a visit
- Compare modules

Avoid:
- "Beautiful digital experiences"
- "Future-ready creativity"
- "Modern solutions"
- "Seamless innovation"
- Fake coordinate labels that do not identify anything

## Accessibility And Production

- Ensure text in shape masks has sufficient contrast or move text outside the mask.
- Do not rely on color alone; pair state color with border, label, icon, or fill pattern.
- Keep focus outlines visible and not clipped by `overflow: hidden`.
- Preserve DOM order for radial or visually complex layouts.
- Give masked images meaningful alt text.
- Use `aspect-ratio` to prevent layout shift.
- On mobile, convert complex grids into ordered modules while retaining coordinate labels and shape treatments.
- Test long labels in pills; allow wrapping or use compact labels.

## Failure Corrections

If it looks generic:
- Make the grid explicit.
- Choose one shape grammar and repeat it.
- Replace generic cards with modules, rows, bands, or masks.
- Add coordinates, plan labels, or structural fills only where they explain content.

If it looks decorative:
- Remove shapes that do not group, sequence, frame, reveal, or respond.
- Reduce shape variety.
- Tie color blocks to categories or sections.
- Move imagery into geometric frames with real content purpose.

If mobile breaks:
- Collapse columns earlier.
- Reduce display tracking and type size.
- Replace radial layouts with ordered lists.
- Keep masks simple.
- Use stable dimensions for all modules.

If it feels too stark:
- Add one warm or vivid structural fill.
- Introduce content imagery.
- Increase body rhythm and captions.
- Use ash/silver fields for secondary modules.

If it feels too busy:
- Reduce accent colors.
- Remove extra shape grammars.
- Increase spacing around primary modules.
- Use one state treatment consistently.

## Absolute Bans

- No random abstract shape clutter.
- No shape system that changes every section.
- No broken mobile grid that collapses into unrelated cards.
- No decorative blobs, gradient orbs, or meaningless bokeh.
- No shadows as the main geometry.
- No tiny unreadable coordinate labels.
- No shape masks that hide the product or essential text.
- No generic centered hero and three-card row unless the existing product requires it.
- No hidden focus states.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.

## Pre-Output Checklist

- First viewport contains a real geometric grid or modular proof.
- One Geometric Modern archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to grid/shape transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
