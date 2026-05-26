---
name: glossy-modern
description: "Use this skill to create Glossy Modern visual design systems that feel polished, luminous, smooth, premium, dimensional, modern. USE FOR: polished modern SaaS, glassy product pages, premium tech, visual tools, interactive brand systems. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Glossy Modern Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Glossy Modern archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, layered glass product frame, specular card, or glossy tool surface, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Glossy Modern components with states.
7. **Motion plan:** specular sweep or glass depth transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Build Glossy Modern as a premium material system: glass, gloss, reflection, specular edge, soft dimensionality, and smooth motion around real product proof. The style is not "blur everything." It is a layered stack where the background carries ambient light, glass panels reveal controlled depth, solid content surfaces protect readability, and highlight sweeps point to important actions.

Use this skill for polished modern SaaS, glassy product pages, premium tech, creative tools, AI assistants, launcher utilities, interactive brand systems, and pages that need to feel smooth, expensive, luminous, and current without becoming noisy.


For substantial UI, output a compact `<design_plan>` block:

1. Use case, audience, product proof, and primary action.
2. Archetype selected from this skill.
3. Material stack: ambient layer, glass layer, gloss layer, solid text layer, action layer.
4. First viewport: nav, H1 strategy, hero object, CTA, next-section hint.
5. Component plan: at least four signature components with states and mobile behavior.
6. Performance plan: where blur is allowed, maximum blur area, fallback for low-power devices.
7. Motion plan: highlight sweep, depth shift, lens reveal, reduced-motion fallback.
8. Anti-slop sweep: top three risks and how to avoid them.

For tiny edits, keep this internal.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium. Polished interfaces need space for light and reflections. |
| motion | Medium-high. Highlight sweeps, depth shifts, lens transitions, and product reveals. |
| decoration | Medium. Gloss, reflection, and glow must be localized. |
| contrast | Luminous mid/high contrast with protected text surfaces. |
| radius | 16-32px for glossy panels, 999px for controls, 8px for dense UI. |
| type | Clean modern sans with refined weights. |
| assets | 3D product renders, glass panels, UI mockups, luminous gradients, high-quality screenshots. |

## Signature System

- Glass Hierarchy: background glow, translucent hero object, solid text slab, crisp CTA.
- Specular Edge: key cards get a one-pixel highlight and inner shadow, not heavy drop shadow.
- Depth Stack: foreground panels have more opacity and sharper borders than background panels.
- Performance Glass: isolate blur to small layers and keep scrolling smooth.

## Differentiation

Use Glossy Modern when polished modern SaaS, glassy product pages, premium tech, visual tools, interactive brand systems. If removing the layered glass product frame, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `light-ui` for bright clarity without material depth; use this when gloss, glass, highlights, or layered product frames define the surface.
## Non-Negotiable Principles

- Glass is a layer, not the entire interface.
- Gloss needs a light source. Every reflection or sweep should imply direction.
- Specular edge beats heavy shadow. Use 1px highlights, inner rims, and controlled depth.
- Blur is expensive and can harm readability. Use it only on small, isolated surfaces.
- Text lives on protected high-contrast slabs or solid panels, never on busy light fields.
- Motion should feel smooth and physical, not like generic fade-in spam.
- Product proof comes first: screenshots, tool UI, objects, workflows, galleries, or real feature states.


## Glass/Gloss Stack

Use this physical stack when designing sections and components:

| Layer | Role | Treatment |
| --- | --- | --- |
| Ambient field | Environmental color and light direction | Large radial/linear gradients, no small text. |
| Back plate | Stable readable base | Solid or nearly solid surface, dark or light. |
| Glass shell | Translucent container | Moderate alpha, 1px border, optional small blur. |
| Gloss skin | Specular highlight | Thin sweep, top edge, rim, or reflected line. |
| Content slab | Text and controls | Solid or high-opacity fill with contrast. |
| Action light | CTA/selected state | Local gradient, highlight sweep, or pressed shine. |
| Shadow/depth | Spatial separation | Very soft and subtle; never muddy. |

If the design looks like many frosted cards floating on a gradient, simplify. Choose one hero glass object, one family of cards, and one action treatment.

## Raw-Derived Archetypes

### Additional Refero Source Packs

- Warp obsidian gloss terminal: `#121212/#090909/#1e1e1d/#353534/#40403f`, text `#faf9f6/#e3e2e0/#afaeac/#868684`, accent `#799c92`; Matter display 48px+ with `-0.03em` to `-0.04em`, Geist Mono 16px terminal; 1200px max, 80px sections, 16px cards, 10px gaps; cards 16px, large 20px, pills 50px; treat gloss as crisp edge contrast, not blur haze.
- Calendly blue chrome conversion: `#0b3558/#006bff/#476788/#d4e0ed/#f8f9fb/#ffffff/#e55cff/#8247f5`; Gilroy 400-700, display 50/68/80px; 8px base, 40px sections, 8px element gaps; radii 4/8/12/16/24px and 50px badges; blue CTA, 16px elevated cards, blue focus fields, triple-layer shadow only on conversion proof cards.
- Air bright surface gloss: `#f5f5f5/#ffffff`, ink surfaces with `#426188` sky accent and `#2b7fff` interactive azure; use 4px inputs, 8px buttons, 14px significant cards; outlined/ghost icons carry the blue accent while white product cards stay almost shadowless.

- Relate, "Blue Gloss Product OS": canvas `#fcfcfc`, wash `#f0f4fe`, ink `#020520`, text `#14141e/#374151/#696a72/#95959b`, signal `#145aff`, status `#16ca2e/#f26052/#0099ff/#ffa64d`, blue/radial gradients; Inter/Pretendard/Roboto; display `56px/1.05/-1.51px`; cards 8px, large cards 40px, inputs/buttons 12px, pills 100px, modals 32px.
- Apple, "Product Gloss Precision": canvas `#f5f5f7/#ffffff`, ink `#1d1d1f`, CTA `#0071e3`, link `#0066cc`, product finish gradients; SF Pro; display `96px/-2.11px`, heading-lg `56px/-0.9px`, body `17px/-0.1px`; cards 28px, buttons 999px, nav 980px, small 10px, rounded 36px.
- Clyde, "Iridescent Editorial Gloss": black `#000`, cream `#f6f6f4`, muted `#7d7d7d`, white `#fff`, ink `#1a1a1a`, iridescent gradient `#feed7a -> #ff8400 -> #df91f7`; Recoleta, Oldschool, Times; display `61px/-1.22px`; buttons 100px, cards 16px, links 12px, inputs 4px, large 38px.
- Deel, "Glossy HR Platform": purple `#201547/#5938b7/#a98df6/#c4b1f9`, yellow `#ffcf25/#faaf00/#ffe27c`, cream `#fffbf4`, dark `#141414/#101828`; Bagoss Condensed/Extended/Standard plus Inter; display `64px/1/0.32px`, heading-lg 60px; pills/buttons/inputs 200px, cards 24px, panels 12px, icons 5px.

### Changelog Midnight Glass Changelog

Use for dark premium SaaS, release notes, docs, developer products, and editorial product pages. The raw signal is dark charcoal, restrained blue, crisp borders, a central content rhythm, and glass used sparingly.

Carry forward:
- Dark glossy panels with sharp typography and calm spacing.
- Subtle borders and small shadows that support hierarchy.
- One luminous accent used for product path or link emphasis.
- Editorial structure where content feels curated, not overloaded.

Avoid:
- Decorative blur over every changelog item.
- Treating release content as generic feature cards.

### Raycast Obsidian Launcher

Use for productivity tools, command palettes, AI launchers, utilities, and keyboard-first products. The raw signal is dark obsidian, red/orange energy, floating command surfaces, and precise polished controls.

Carry forward:
- Command surface as the hero proof.
- Rounded, tactile, keyboard-aware controls.
- Bright accent attached to action, not body copy.
- Fast, crisp transitions and pressed states.

Avoid:
- Making the interface too soft for a power tool.
- Overusing red glow until it feels like an error.

### Dia Prism Operating System

Use for browser, AI assistant, creative workspace, and consumer productivity pages. It is the lighter glossy archetype: prism gradients, glass panels, friendly UI, and soft product evidence.

Carry forward:
- Light ambient field with protected white/off-white content surfaces.
- Rounded product frames and floating mini-panels.
- Subtle rainbow/prism highlight as a brand signal.
- Hero proof that shows actual browser/app behavior.

Avoid:
- Dark glass components on bright gradients without contrast.
- Rainbow accent everywhere.

### Ayo/Lava Midnight Gel

Use for immersive tech, AI music/visual products, generative tools, and sensory brand systems. The raw signal is black glossy gel, luminous blobs attached to components, tactile rounded objects, and premium dark smoothness.

Carry forward:
- Black or deep charcoal base with liquid highlights.
- Rounded tactile controls and media tiles.
- Glow attached to component edges, not the whole section.
- Smooth scroll and hover depth.

Avoid:
- Blobby decorations detached from content.
- Low-contrast text over lava gradients.

### monopo Saigon Fluid Chrome

Use for agencies, portfolios, cultural launches, visual studios, and interactive editorial pages. It brings fluid typography, reflective objects, high craft, and controlled weirdness.

Carry forward:
- Typography carries identity as much as material.
- Reflections can be editorial, not only SaaS.
- Use large confident whitespace and polished media.
- Sections can feel like gallery rooms.

Avoid:
- Decorative chrome objects with no relation to content.
- Motion that hides navigation or conversion.

## Semantic Token Packs

### Obsidian Gloss

```css
:root {
  --gm-bg: #040506;
  --gm-surface-1: #111214;
  --gm-surface-2: #1b1c1e;
  --gm-surface-3: #23252a;
  --gm-text: #f7f8f8;
  --gm-muted: #a8adb6;
  --gm-subtle: #6f7480;
  --gm-line: rgba(255,255,255,.13);
  --gm-line-bright: rgba(255,255,255,.32);
  --gm-accent: #ff4d4d;
  --gm-accent-2: #0358f7;
  --gm-focus: #7fb2ff;
  --gm-glass: rgba(255,255,255,.08);
  --gm-glass-strong: rgba(255,255,255,.14);
  --gm-blur-sm: 10px;
  --gm-blur-md: 18px;
  --gm-radius-card: 24px;
  --gm-radius-control: 999px;
}
```

### Pearl Prism

```css
:root {
  --gm-bg: #f7f8f8;
  --gm-surface-1: #ffffff;
  --gm-surface-2: #f1f3f6;
  --gm-surface-3: #e7ebf1;
  --gm-text: #111214;
  --gm-muted: #5f6672;
  --gm-subtle: #8a8f98;
  --gm-line: rgba(17,18,20,.10);
  --gm-line-bright: rgba(255,255,255,.85);
  --gm-accent: #0358f7;
  --gm-accent-2: #a855f7;
  --gm-focus: #0358f7;
  --gm-glass: rgba(255,255,255,.72);
  --gm-glass-strong: rgba(255,255,255,.9);
  --gm-blur-sm: 8px;
  --gm-blur-md: 16px;
  --gm-radius-card: 28px;
}
```

### Liquid Chrome

```css
:root {
  --gm-bg: #0a0a0c;
  --gm-surface-1: #141516;
  --gm-surface-2: #202124;
  --gm-surface-3: #2b2d31;
  --gm-text: #ffffff;
  --gm-muted: #b6bbc5;
  --gm-line: rgba(255,255,255,.16);
  --gm-line-bright: rgba(255,255,255,.48);
  --gm-accent: #8cffd2;
  --gm-accent-2: #b48cff;
  --gm-glass: rgba(255,255,255,.10);
  --gm-glass-strong: rgba(255,255,255,.18);
  --gm-blur-sm: 12px;
  --gm-blur-md: 20px;
  --gm-radius-card: 30px;
}
```

### Execution Token Contract

Refero ready-to-use deltas from Warp/Calendly/Air:
- Token roles: Warp obsidian `#121212/#090909/#1e1e1d/#353534/#40403f` with sage `#799c92`; Calendly blue chrome `#0b3558/#006bff/#476788/#d4e0ed/#f8f9fb/#ffffff`; Air bright surfaces `#f5f5f5/#ffffff` with `#426188/#2b7fff`.
- Type roles: Warp Matter 48px+ at `-0.03em` to `-0.04em` plus Geist Mono; Calendly Gilroy 50/68/80px; Air uses light product UI type with azure action emphasis.

Every Glossy Modern build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #f7f8fb;
  --surface: rgba(255,255,255,.82);
  --surface-muted: rgba(244,247,252,.72);
  --text: #111827;
  --text-muted: #667085;
  --line: rgba(15,23,42,.12);
  --action: #6d5dfc;
  --action-strong: #4f39f6;
  --radius-control: 999px;
  --radius-card: 18px;
  --radius-panel: 28px;
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
  --shadow-card: 0 1px 0 rgba(255,255,255,.9) inset, 0 12px 30px rgba(15,23,42,.08);
  --shadow-panel: 0 24px 80px rgba(15,23,42,.14);
  --shadow-hero: 0 42px 120px rgba(109,93,252,.22);
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

| Tailwind default | Glossy Modern token |
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
| `backdrop-blur-*` | only fixed/sticky/isolated panels; never scrolling body slabs |
| `shadow-xl` | `--shadow-panel` plus specular inset highlight |

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `gm`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Blur Performance Limits

Blur is a budgeted effect:

- Prefer no more than 2-3 blurred elements in the first viewport.
- Keep blurred surfaces small or medium. Avoid full-page `backdrop-filter` over scrolling content.
- Do not animate blur radius. Animate opacity or transform of a pre-blurred layer.
- Use `contain: paint`, `isolation: isolate`, and clipped pseudo-elements for expensive material areas.
- Provide a fallback for browsers or devices where `backdrop-filter` is unsupported.
- Avoid stacking blur over video, canvas, or large fixed backgrounds unless tested.
- If text is inside a blurred panel, increase opacity and add a solid content slab.

Fallback:

```css
.gm-glass {
  background: var(--gm-glass-strong);
  border: 1px solid var(--gm-line);
}
@supports ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))) {
  .gm-glass {
    background: var(--gm-glass);
    backdrop-filter: blur(var(--gm-blur-md)) saturate(1.25);
    -webkit-backdrop-filter: blur(var(--gm-blur-md)) saturate(1.25);
  }
}
```

## Specular Edge Rules

A specular edge is the smallest detail that makes the surface feel polished. Treat it like a light model:

- Top edges catch the brightest line; bottom edges usually receive a darker inner rim.
- Vertical edges can catch a weaker highlight only when the implied light source is lateral.
- Use a 1px inset line before adding outer glow.
- Keep the highlight clipped to the card radius so it reads as material, not decoration.
- Do not give every repeated list item a bright edge. Reserve it for hero objects, selected cards, modal shells, toolbars, and primary product frames.
- In light themes, the edge can be white-on-pearl plus a faint gray line; in dark themes, use white alpha plus a deeper black inner rim.

```css
.gm-specular-edge {
  position: relative;
  border: 1px solid var(--gm-line);
}
.gm-specular-edge::before {
  content: "";
  position: absolute;
  inset: 1px;
  pointer-events: none;
  border-radius: inherit;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.36),
    inset 0 -1px 0 rgba(0,0,0,.22);
}
```

## Highlight Sweep Rules

Highlight sweeps are not generic animation. Use them as a moment of material confirmation:

- CTA hover: sweep travels once, left to right or source-to-destination.
- Selected toolbar tool: a shorter edge sweep can confirm the mode switch.
- Product reveal: a slow diagonal sweep can reveal a screenshot or object.
- Loading: do not use endless glossy sweep; use a progress label or skeleton.
- Reduced motion: replace sweep with static edge highlight and state label.

Keep sweep width between 28% and 60% of the element. Wider sweeps wash out text; narrower sweeps look like a bug.

## First Viewport Protocol

Refero layout deltas:
- Warp: 1200px max, 80px sections, 16px cards, 10px gaps; gloss is crisp edge contrast, not blur haze.
- Calendly: 8px base, 40px sections, 8px gaps, radii 4/8/12/16/24px and 50px badges; conversion proof first.
- Air: use 4px inputs, 8px buttons, 14px significant cards, white product cards with near-zero shadow.

Glossy Modern first viewports need a premium object:

- Nav: simple but material-aware; glass nav, solid nav, or floating toolbar.
- H1: clear product/category noun; 2-3 lines desktop, balanced mobile.
- Proof object: product render, app screenshot, command palette, browser frame, creative canvas, or reflective media.
- CTA: one primary glossy action with readable label and one quieter secondary.
- Next-section hint: show module row, screenshot strip, gallery, pricing, or workflow continuation at the fold.

Do not make a split hero with a generic card on one side and generic copy on the other. The product/object should be the visual anchor.

## Signature Components

Refero component deltas:
- Warp: dark terminal cards, 16/20px panels, 50px pills; no shadows.
- Calendly: blue CTA, 16px elevated cards, blue focus fields, triple-layer shadow only on conversion proof.
- Air: outlined/ghost icon controls carry `#2b7fff`; white cards stay flat.
- State transfer: Warp hover steps `#353534 -> #40403f`; Calendly focus/active uses `#006bff`; Air focus/action uses `#2b7fff` with flat white cards.

Use at least four for full-page work.

### Refero Expansion Component Deltas

- Gloss must be specific, not generic blur: Relate supports blue radial glass overlays and 40px large cards; Apple supports frosted selectors with `rgba(210,210,215,.64)` blur 20 and 28px product cards; Clyde supports iridescent editorial surfaces; Deel supports pill-heavy purple/yellow HR surfaces.
- Buttons inherit source shape: Apple 999px buy pills, Relate 12px filled/outlined buttons, Clyde 100px editorial buttons, Deel 200px pills. Do not combine pill CTAs with random 8px cards unless the source pack says so.
- Status and swatches are component specs: Relate status chips use `#16ca2e/#f26052/#0099ff/#ffa64d`; Apple swatches are 28px with a 3px ring; Deel yellow is action/payroll emphasis, not background decoration.

| Component | Use | Required states |
| --- | --- | --- |
| `GlassHeroPanel` | First-viewport product proof with glass shell and solid text layer. | compact, expanded, loaded, fallback, reduced-motion. |
| `SpecularCard` | Feature, plan, testimonial, or product card with edge highlight. | idle, hover, selected, loading, error. |
| `FloatingToolbar` | App tools, filters, mode switches, editor controls. | hover, focus, selected, disabled, overflow. |
| `LayeredProductFrame` | Screenshot/device/browser/canvas frame. | loading, ready, zoomed, error, mobile. |
| `HighlightSweepButton` | Primary CTA or selected action. | idle, hover, pressed, loading, success, disabled. |
| `DepthPricingCard` | Plan comparison with dimensional hierarchy. | default, highlighted, selected, loading, error. |
| `ReflectionGallery` | Proof strip, portfolio, media carousel, product states. | idle, selected, lazy-loading, empty. |
| `LuminousFooter` | Designed closure with repeated material motif. | focus, hover, compact, expanded. |

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type GlossyModernState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type GlossyModernStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function GlossyModernStatusPill({ role, children }: { role: GlossyModernStatus; children: React.ReactNode }) {
  return <span className="glossy-modern-status-pill" data-role={role}>{children}</span>;
}

export function GlassHeroPanelContract({ state = "default" }: { state?: GlossyModernState }) {
  return <section className="glossy-modern-hero-object" data-state={state} aria-label="Glossy Modern proof object" />;
}

export function SpecularCardContract({ title, meta, state = "default" }: { title: string; meta: string; state?: GlossyModernState }) {
  return <article className="glossy-modern-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function FloatingToolbarContract({ items }: { items: string[] }) {
  return <nav className="glossy-modern-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function GlossyModernSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="glossy-modern-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.glossy-modern-status-pill {
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
.glossy-modern-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.glossy-modern-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.glossy-modern-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.glossy-modern-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.glossy-modern-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.glossy-modern-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.glossy-modern-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.glossy-modern-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.glossy-modern-card[data-state="error"] { border-color: var(--status-danger-fg); }
.glossy-modern-card > span { font: var(--type-meta); color: var(--text-muted); }
.glossy-modern-card > strong { font: var(--type-card); color: var(--text); }
.glossy-modern-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.glossy-modern-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.glossy-modern-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.glossy-modern-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.glossy-modern-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.glossy-modern-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.glossy-modern-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .glossy-modern-hero-object { min-height: 280px; }
  .glossy-modern-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
## Component Blueprints

### SpecularCard

Use for cards that need premium material without becoming frosted-glass mush.

```tsx
type SpecularCardState = "idle" | "selected" | "loading" | "error";

export function SpecularCard({ state = "idle" }: { state?: SpecularCardState }) {
  return (
    <article className="gm-specular-card" data-state={state}>
      <div className="gm-specular-card__shine" aria-hidden="true" />
      <p className="gm-kicker">Workflow layer</p>
      <h3>One command turns notes into a polished brief.</h3>
      <p>Source-aware drafting, review states, and a handoff timeline in one glossy workspace.</p>
      <button>{state === "loading" ? "Preparing" : "Open layer"}</button>
      {state === "error" && <p className="gm-error">Preview failed. Reload this layer.</p>}
    </article>
  );
}
```

```css
.gm-specular-card {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 14px;
  padding: 22px;
  color: var(--gm-text);
  background:
    linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02)),
    var(--gm-surface-1);
  border: 1px solid var(--gm-line);
  border-radius: var(--gm-radius-card);
  box-shadow: 0 18px 60px rgba(0,0,0,.24);
}
.gm-specular-card::before {
  content: "";
  position: absolute;
  inset: 1px;
  pointer-events: none;
  border-radius: calc(var(--gm-radius-card) - 1px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(0,0,0,.22);
}
.gm-specular-card__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(110deg, transparent 0 36%, rgba(255,255,255,.18) 45%, transparent 56%);
  transform: translateX(-65%);
  opacity: 0;
}
.gm-specular-card:hover .gm-specular-card__shine {
  opacity: 1;
  transform: translateX(65%);
  transition: opacity 180ms ease, transform 820ms cubic-bezier(.16,1,.3,1);
}
.gm-specular-card[data-state="selected"] {
  border-color: color-mix(in srgb, var(--gm-accent), white 20%);
}
.gm-specular-card[data-state="error"] {
  border-color: #ff667a;
}
@media (max-width: 640px) {
  .gm-specular-card { padding: 18px; border-radius: 20px; }
}
```

### HighlightSweepButton

Use only for the primary path or a selected high-value action. It should feel like light moving across a polished surface.

```tsx
export function HighlightSweepButton({ loading = false, success = false }) {
  return (
    <button className="gm-sweep-button" data-success={success} disabled={loading}>
      <span>{loading ? "Building" : success ? "Ready" : "Start free"}</span>
    </button>
  );
}
```

```css
.gm-sweep-button {
  position: relative;
  overflow: hidden;
  min-height: 48px;
  padding: 0 22px;
  color: white;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--gm-accent), white 12%), var(--gm-accent)),
    var(--gm-accent);
  border: 1px solid rgba(255,255,255,.34);
  border-radius: var(--gm-radius-control);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.38), 0 14px 32px color-mix(in srgb, var(--gm-accent), transparent 78%);
}
.gm-sweep-button::after {
  content: "";
  position: absolute;
  inset: -40% auto -40% -70%;
  width: 60%;
  transform: skewX(-18deg);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.58), transparent);
}
.gm-sweep-button:hover::after {
  left: 112%;
  transition: left 780ms cubic-bezier(.16,1,.3,1);
}
.gm-sweep-button:active { transform: translateY(1px); }
.gm-sweep-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--gm-focus), transparent 68%), inset 0 1px 0 rgba(255,255,255,.38);
}
.gm-sweep-button:disabled {
  cursor: wait;
  opacity: .72;
}
```

### FloatingToolbar

Use for editors, design tools, browser controls, dashboards, and product screenshots.

Rules:
- Use icon buttons for tools and segmented controls for modes.
- Keep toolbar height fixed.
- Overflow becomes a menu on mobile.
- Active tool has surface change plus indicator, not color alone.
- Disabled controls remain visible with tooltip or label.

### LayeredProductFrame

Use for screenshots, browser frames, app mockups, and proof objects.

Rules:
- Use an actual image, canvas, UI mockup, or meaningful layout inside the frame.
- Add top chrome only if it clarifies product type.
- Use glass around the frame, not on top of key text.
- Loading skeleton preserves aspect ratio.
- Mobile crops intentionally or stacks detail panels below.

```css
.gm-product-frame {
  position: relative;
  isolation: isolate;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--gm-surface-1);
  border: 1px solid var(--gm-line);
  border-radius: 28px;
}
.gm-product-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255,255,255,.2), transparent 16%),
    radial-gradient(circle at 80% 0%, rgba(255,255,255,.22), transparent 26%);
  mix-blend-mode: screen;
}
.gm-product-frame img,
.gm-product-frame video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### GlassHeroPanel

Use when the hero proof should feel like a luminous object.

Rules:
- Ambient gradient behind the hero object.
- Glass shell around the object.
- Solid slab for text and CTAs.
- Reduce blur on mobile.
- Provide fallback static image if the object uses WebGL/canvas.

## Motion System

Refero motion delta:
- No source-specific durations were observed for Warp/Calendly/Air. Use existing glossy timing for specular sweep or hover only; do not animate blur radius or layout size.

- Glossy motion should feel polished and short: 100-180ms for selector/button state, 250-360ms for product card reveal, 300-500ms for carousel or glossy media transition. Apple-style product pages may use 0.344s primary transitions and 0.1s quick state changes; reduced motion swaps moving gloss for static highlights.

## Complete Page Protocols

```tsx
// Glass Product Stage
<main data-skill="glossy-modern" data-archetype="glass-product-stage">
  <GlassHeroPanelContract state="selected" />
  <LayeredProductFrameContract title="Canvas" meta="toolbar, inspector, preview" />
  <FloatingToolbarContract items={["Move", "Mask", "Export"]} />
  <HighlightSweepButtonContract state="default">Create scene</HighlightSweepButtonContract>
</main>

// Premium Tool Surface
<main data-skill="glossy-modern" data-archetype="premium-tool-surface">
  <SpecularCardContract title="Depth layer" meta="blur budget respected" />
  <DepthPricingCardContract plan="Studio" state="selected" />
  <ReflectionGalleryContract items={productRenders} />
</main>
```
```tsx
// Glass Product Stage
<main data-skill="glossy-modern" data-archetype="glass-product-stage">
  <GlassHeroPanelContract state="selected" />
  <LayeredProductFrameContract title="Canvas" meta="toolbar, inspector, preview" />
  <FloatingToolbarContract items={["Move", "Mask", "Export"]} />
  <HighlightSweepButtonContract state="default">Create scene</HighlightSweepButtonContract>
</main>

// Premium Tool Surface
<main data-skill="glossy-modern" data-archetype="premium-tool-surface">
  <SpecularCardContract title="Depth layer" meta="blur budget respected" />
  <DepthPricingCardContract plan="Studio" state="selected" />
  <ReflectionGalleryContract items={productRenders} />
</main>
```
Glossy motion should feel like material responding to light:

- Highlight sweep: on CTA hover, selected toolbar tool, or specular card hover.
- Depth shift: 1-3px translate and subtle scale on cards; never layout reflow.
- Lens reveal: reveal product frame by moving mask or opacity, not changing height.
- Ambient drift: slow background motion, 18-32s, behind the object only.
- Pressed state: button translateY(1px), inner highlight lowers.
- Carousel/gallery: ease-out snap, no endless auto-rotation unless user requested.

```css
@keyframes gm-ambient-drift {
  from { transform: translate3d(-2%, -1%, 0) scale(1); }
  to { transform: translate3d(2%, 1%, 0) scale(1.04); }
}
@keyframes gm-lens-in {
  from { opacity: 0; transform: translateY(22px) scale(.985); filter: saturate(.9); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: saturate(1); }
}
.gm-ambient { animation: gm-ambient-drift 26s ease-in-out infinite alternate; }
.gm-lens-reveal { animation: gm-lens-in 700ms cubic-bezier(.16,1,.3,1) both; }
@media (prefers-reduced-motion: reduce) {
  .gm-ambient, .gm-lens-reveal,
  .gm-specular-card:hover .gm-specular-card__shine,
  .gm-sweep-button:hover::after {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
```

Reduced motion:
- No moving sweeps, ambient drift, or parallax.
- Keep static specular edges and selected borders.
- Use immediate opacity changes for reveal.
- Preserve loading text and progress labels.


## Absolute Bans

- Refero anti-dilution: do not combine Warp sage, Calendly blue, and Air azure as three action colors.
- Do not add glass blur to Warp or Air just because the skill is glossy; use source-specific edge/surface treatment.

- No glassmorphism on every card.
- No large blurred scrolling regions.
- No low-contrast text inside translucent panels.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## State Pattern

```tsx
const glossyState = {
  idle: "bg-[color:var(--gm-surface-1)] border-[color:var(--gm-line)]",
  hover: "hover:-translate-y-0.5 hover:border-[color:var(--gm-line-bright)]",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gm-focus)]",
  selected: "data-[selected=true]:border-[color:var(--gm-accent)] data-[selected=true]:bg-[color:var(--gm-surface-2)]",
  loading: "aria-busy:pointer-events-none aria-busy:cursor-wait",
  disabled: "disabled:pointer-events-none disabled:saturate-50 disabled:opacity-60",
  error: "data-[state=error]:border-[#ff667a] data-[state=error]:text-[#ff8fa0]",
  success: "data-[state=success]:border-[#43d18b] data-[state=success]:text-[#43d18b]"
};
```

## Layout Patterns

### Product On Glass Stage

- Ambient field fills the viewport.
- Product proof floats in a glass shell.
- H1 and CTA sit on protected solid or high-opacity surface.
- Next section peeks as a row of glossy modules.

### Visual Tool Workbench

- Main canvas uses solid/readable background.
- Toolbar is floating glass or solid gloss.
- Inspector panels are raised but not over-blurred.
- Active selection uses specular edge and label.

### Glossy SaaS Flow

- App frame, metrics, and feature modules share one material language.
- Pricing cards use depth and highlight, not confetti.
- Testimonials or logos sit on calm solid surfaces.

### Fluid Editorial Gallery

- Large media and typography carry identity.
- Reflective objects are related to the content.
- Navigation remains usable while motion adds atmosphere.

## Section Recipes

### Pricing

Use solid cards with glossy edges. The recommended plan can get a brighter top rim and a single accent badge. Keep plan limits, billing cadence, included seats, usage caps, and support terms visible. Loading price data should preserve card height. Error states should explain whether checkout, tax, or plan lookup failed.

### Testimonials

Use glossy quote cards only if the quote is real and short. Add role, company, product context, or measurable outcome. Avoid huge translucent quotation marks. A small reflective avatar frame or logo strip is enough.

### Integrations

Use a grid of solid or lightly glassy tiles with actual integration names and categories. Selected integration tiles can lift 1-2px and show a specular edge. Do not put colorful logos on low-opacity glass over gradients if legibility suffers.

### Forms

Inputs should be more solid than decorative panels. Use clear labels, focus rings, validation copy, disabled explanations, and success confirmation. A glossy form can still look precise; never rely on placeholder text as the only label.

## Content Evidence Rules

Glossy Modern can become empty polish if the content is vague. Add concrete proof:

- Product pages: screenshot states, real feature names, integration names, visible UI.
- AI tools: prompt, source, result, confidence, edit/retry states.
- Creative tools: canvas, toolbar, layer list, export states.
- SaaS dashboards: metrics, trend, filters, owner, date range.
- Brand/editorial pages: real media, object captions, project details, navigation.

## Accessibility And Readability

- Text contrast must pass on the final material layer.
- Do not put paragraphs directly over moving gradient fields.
- Focus rings must be visible over glass and solid surfaces.
- Loading and disabled states must include label changes where needed.
- Avoid color-only selection.
- Do not use blur to hide low-quality assets.
- Respect touch targets; glossy controls can be beautiful and still practical.

## Mobile Rules

- Reduce blur radius and number of glass layers.
- Stack product object above text or text above object based on content priority.
- Replace hover sweeps with tap/selected states.
- Crop frames intentionally; preserve aspect ratio.
- Avoid tiny reflective details that alias on mobile.
- Keep CTA labels from clipping inside pill buttons.

## Anti-Patterns

- `backdrop-filter: blur(40px)` on large scrolling sections.
- Glass cards nested inside glass cards.
- Text floating on busy gradients.
- Highlight sweep on every button.
- Specular edges with no consistent light direction.
- Gloss used to disguise missing product proof.
- Purple-blue gradient mush that looks like generic AI SaaS.
- Animated blur radius.
- Heavy drop shadows that fight the polished material.

## Pre-Output Checklist

- First viewport contains a real layered glass product frame.
- One Glossy Modern archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to specular sweep or glass depth transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
