---
name: motion
description: "Use this skill to create Motion visual design systems that feel kinetic, cinematic, responsive, tactile, sequenced, alive. USE FOR: motion-heavy websites, animated product pages, scroll narratives, cinematic launches, interactive brand experiences, kinetic typography, 3D or shader-led hero systems, and UI where movement is part of the information architecture. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Motion

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Motion archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, animated product/narrative object with a static fallback, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Motion components with states.
7. **Motion plan:** declared motion primitive, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Build motion-first interfaces where movement is not decoration but the structure of attention: reveal, continuity, state, chaptering, proof, and feedback. A Motion design must still read as a strong static composition when animation is disabled; motion then adds sequence, timing, depth, and tactility.

Do not make a normal SaaS layout with scroll fades. Pick one source-derived archetype, commit to its color budget, type pressure, radius stance, spacing rhythm, surface language, and animation grammar, then make every component obey that system.


For substantial UI work, create a compact `<design_plan>` before code:

1. **Use case:** audience, object being sold or explained, conversion action, emotional temperature.
2. **Archetype:** choose one primary archetype from the 9 below, plus one supporting motion role if needed.
3. **Motion engine:** choose CSS, Framer Motion, GSAP+ScrollTrigger, Lenis+GSAP, R3F/Three, or View Transitions from the picker.
4. **First viewport:** nav geometry, H1 line strategy, proof object, CTA stance, next-section hint.
5. **Contracts:** palette size, type pair, radius rule, spacing rhythm, surface depth, image burden.
6. **Choreography:** what enters, pins, scrubs, loops, reacts to pointer, and what stops under reduced motion.
7. **Failure sweep:** name the top three ways this could become generic and prevent them in the code.

For small edits, do this mentally and keep the answer short.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Variable. Motion-heavy pages alternate cinematic emptiness with focused interaction. |
| motion | Very high but choreographed. Scroll, pointer, 3D, reveal, and state transitions. |
| decoration | Medium. Motion can create graphic identity if the static frame still works. |
| contrast | Depends on concept, but moving text must remain readable. |
| radius | Driven by concept; motion components need stable bounds. |
| type | Large display type with readable body; kinetic type must have fallback. |
| assets | Video, canvas, 3D objects, animated masks, product frames, shader backgrounds. |

## Signature System

- Motion Archetypes By Engine: choose GSAP scroll, 3D camera/orbit, shader field, scanline terminal, kinetic type, or physical card stack.
- Static Frame Test: every section must still read if animation is disabled.
- Reduced Motion Contract: provide a visible but nonmoving equivalent.
- Choreography Map: hero, transition, proof, interaction, and footer each get distinct motion roles.

## Differentiation

Use Motion when motion-heavy websites, animated product pages, scroll narratives, cinematic launches, interactive brand experiences. If removing the animated product/narrative object, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use a static visual skill when motion is decorative only; use this when movement is part of the information architecture.

### Execution Token Contract

Every Motion build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #0b0b10;
  --surface: #151622;
  --surface-muted: #202236;
  --text: #f7f7ff;
  --text-muted: #b8bad0;
  --line: rgba(255,255,255,.12);
  --action: #8b5cf6;
  --action-strong: #22d3ee;
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
  --shadow-card: 0 18px 50px rgba(0,0,0,.28);
  --shadow-panel: 0 32px 90px rgba(0,0,0,.38);
  --shadow-hero: 0 60px 150px rgba(139,92,246,.30);
  --shadow-modal: 0 24px 80px rgba(15,23,42,.16);
  --shadow-action: 0 6px 18px color-mix(in srgb, var(--action), transparent 72%);
  --status-success-bg: rgba(52,211,153,.14);
  --status-success-fg: #34d399;
  --status-info-bg: rgba(96,165,250,.14);
  --status-info-fg: #60a5fa;
  --status-warning-bg: rgba(251,191,36,.16);
  --status-warning-fg: #fbbf24;
  --status-danger-bg: rgba(248,113,113,.16);
  --status-danger-fg: #f87171;
  --status-neutral-bg: rgba(255,255,255,.08);
  --status-neutral-fg: #b8bad0;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --dur-reveal: 760ms;
  --dur-ui: 260ms;
  --ease-emphasized: var(--ease-product);
  --ease-out-expo: cubic-bezier(.16,1,.3,1);
  --font-body: var(--font-sans);
  --i: var(--surface-muted);
  --motion-canvas: var(--canvas);
  --motion-ink: var(--text);
  --motion-line: var(--line);
  --motion-surface: var(--surface);
  --radius-stage: var(--radius-panel);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Motion token |
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
| `animate-*` | named motion primitive with purpose, duration, cleanup |
| `transition-all` | explicit transform/opacity/color only |

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `m`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Motion Principles

- Motion is grammar: entrance establishes hierarchy, scrub establishes sequence, hover establishes affordance, transitions preserve continuity, loops create atmosphere.
- Every animation needs a role. If it cannot be named as reveal, feedback, continuity, attention routing, atmosphere, comparison, or story progression, remove it.
- Animate `transform` and `opacity` first. Use `clip-path` sparingly for masked reveals. Avoid animating `top`, `left`, `width`, `height`, `margin`, and expensive blur on scrolling content.
- Build the static endpoint first. Scroll-triggered content must be readable if JavaScript fails or animation is skipped.
- One viewport cannot carry every trick. Choose a dominant motion type: kinetic type, pinned narrative, 3D stage, shader atmosphere, product state demo, or looped marquee.
- Reduced motion is a designed state, not a disabled website. Preserve information, contrast, rhythm, and current section state without movement.

## The 9 Motion Archetypes

Pick one primary archetype. Do not average them together.

### Additional Refero Motion Source Packs

- Apple product motion: SF Pro precision over `#f5f5f7/#ffffff/#1d1d1f`, blue CTA `#0071e3`; display up to `96px/1.04/-2.11px`; cards 28px, pills 999px, frosted selector `rgba(210,210,215,.64)` blur 20; primary transitions 0.344s, quick states 0.1s, scroll/product transitions 0.32s ease. Animate background, color, opacity, and transform only.
- N8n workflow current: violet dark `#0e0918/#1a1624/#1b1728/#2c2834`, ember CTA gradient, electric current gradient; geomanist; display `54px/.88/-1.08px`; nodes 12px, cards 16/24px, inputs/buttons 8px, pills 9999px. Use 300-700ms path/current sweeps on workflow edges with static node labels.
- Resend code-product motion: `#000`, rail `#292d30`, text `#f0f0f0/#fff`, blue `#3b9eff`, violet gradient, statuses `#3ad389/#ff9592/#ffca16/#70b8ff/#baa7ff`; Inter, Domaine, ABCFavorit, CommitMono; max-width 1200px; tags 10px, cards 16/24px, buttons/badges 6px. Code blocks can stream/fade; do not animate layout dimensions.
- Chronicle editorial motion: achromatic `#050505/#000/#151515/#292929/#6b6b6b/#929292/#e2e2e2/#f3f3f3/#fff`; Diatype only; display `54px/1/-1.62px`, heading `48px/-1.44px`; buttons/images/inputs 4px, cards 8px, sections 80-128px. Use restrained 150-300ms opacity/translate and tab continuity.
- Retool workstation motion: radial obsidian `#0e0e0e/#151515/#242424/#3f403d`, text `#94958e/#cbccc4/#e9ebdf`, teal `#185849/#0e352c`, spectrum shimmer; saansFont and pxGroteskFont; display `72px/1/-0.022em`; cards 8/12px, square buttons 0px, pills 9999px. Use shimmer only as attention routing; square controls need instant feedback.

### 1. Brutalist DTC

Source signal: Liquid Death. Heavy metal vending machine, anti-corporate product commerce.

- **Use for:** counter-culture DTC, beverage, merch, streetwear, loud launches, anti-polished campaigns.
- **Palette:** pure black `#000000`, bone white `#ffffff`, off-black `#151515`, ash `#e3e3e3`, gravel `#727272`, light ash `#f5f5f5`, charcoal hover `#232323`, metallic gold `#d2ac5a` and antique gold `#8a6d35` only for logo or rare links.
- **Typography:** Acumin Pro or equivalent geometric grotesk; uppercase 700 for headlines; condensed cut for calorie/spec/narrow labels. Display around 60px with 1.0 line-height; body 14-16px with deliberate positive tracking.
- **Radius:** 0px everywhere: buttons, inputs, cards, modals, product tiles.
- **Spacing:** 4px base; 24px card padding; rigid 3-4 column grids; full-bleed black/white/gray bands do most of the layout work.
- **Motion rules:** hard section cuts, product image reveals, marquee or banner sweeps, hover color snaps under 200ms. Avoid soft springs, gooey easing, gradients, and lifestyle-photo parallax.
- **Components:** rectangular primary buttons, outlined secondary buttons, full-width banner CTAs, sharp text inputs, grid product cards on ash fields.

### 2. Type Foundry Minimalism

Source signal: Heavyweight. Stark white catalog where type previews are the moving product.

- **Use for:** type foundries, editorial portfolios, design studios, archives, software with a type or asset catalog.
- **Palette:** heavy ink `#222222`, canvas white `#ffffff`, frost `#f3f5fa`, graphite `#2d2d2d`, muted ash `#888888`, one green `#39d17f` reserved for "new" or active flags.
- **Typography:** Nuckle-like custom sans; 14-16px body does most work; type specimen content becomes the display. Use 400/500 only.
- **Radius:** 11px cards/default controls, 10px small buttons; keep font showcase cards visually quiet.
- **Spacing:** irregular but precise: 4, 5, 7, 8, 10, 12, 18, 30; huge 166px section gaps; 12px internal spacing.
- **Motion rules:** subtle opacity and background-color transitions, animated specimen/video cards, smooth reveal sequencing. No theatrical parallax.
- **Components:** font preview cards with aspect-ratio shells, bordered buttons, persistent top nav, sparse metadata rows.

### 3. Nebula Gradient Hero

Source signal: Handshake. Dark canvas lit by a green-to-cyan radial field.

- **Use for:** recruiting, marketplaces, creator platforms, AI tools that need optimism and kinetic discovery.
- **Palette:** deep space `#000000`, midnight `#14151c`, cosmic gray `#052326`, stardust `#ffffff`, guidepost green `#d3fb52`, muted text `#666666`, hero radial green-cyan-to-transparent.
- **Typography:** SansPlomb-like display at extreme scale, 0.8 line-height, -0.02em tracking; NoiGrotesk-like body with stylistic sets `"ss03"`, `"ss06"`, `"ss12"` enabled.
- **Radius:** 8px nav/buttons, 12px large buttons, 24px cards/inputs, 9999px tags.
- **Spacing:** 8px base; 16px component gaps; 24px section rhythm; 64-120px for hero breathing room.
- **Motion rules:** slow radial drift, gradient pulse, translucent cards over atmosphere, ghost border hover, search/input focus glow from accent. Keep the gradient behind the interface, not inside every surface.
- **Components:** central hero search, ghost nav controls, translucent feature cards using `rgb(255 255 255 / 0.06)`, accent CTA.

### 4. Stark Editorial Dark

Source signal: cthdrl. Typographic film opening on a black canvas.

- **Use for:** creative studios, art direction, editorial campaigns, premium portfolios, minimal agencies.
- **Palette:** exactly two colors: midnight void `#000000` and ghost sand `#e7ded1`.
- **Typography:** NB Akademie-like display, 400 only, 121px desktop, 0.85 line-height, slight negative tracking; mono body/UI at 11-32px with extreme -0.045em tracking.
- **Radius:** 0px everywhere.
- **Spacing:** irregular 10, 11, 26, 30, 50, 75; 26px section gaps; zero card padding unless content explicitly needs it.
- **Motion rules:** word/letter reveals, thin line/arc drawing, cursor-following type distortions, smooth scroll continuity. No filled CTAs, no saturated accents, no multiple weights.
- **Components:** ghost text links, hairline dividers, border-as-underline CTAs, centered single-column chapters.

### 5. Instrument Panel

Source signal: Superlative. Matte technical panel with product photography and status indicators.

- **Use for:** hardware, audio tools, instruments, industrial products, technical demos, precision devices.
- **Palette:** superlative black `#141414`, instrument gray `#232323`, panel gray `#8c8c8c`, signal orange `#e66f27` for indicators only, ghost white `#ffffff`, surface white `#f6f4f2`, divider `#e4e3e2`, black borders.
- **Typography:** condensed mechanical display with 0.08em tracking; SL-Light-like large titles; single-weight body. Keep labels uppercase and engineered.
- **Radius:** 0px ghost buttons, 3px outlined buttons, 15px badges.
- **Spacing:** 8px base, but use 15px element gap, 30px card padding, 60px section gap; include occasional large 90/120/240 intervals.
- **Motion rules:** subtle product parallax, LED/status sweep, orange band animation behind labels, nav gray-to-white hover. No gradients, no orange CTAs.
- **Components:** panel blocks, pill badges, wide ghost buttons with 18.5/45px padding, full-bleed angled product media.

### 6. Holographic Sci-Fi

Source signal: MekaVerse. Deep-space command center with translucent UI over 3D world imagery.

- **Use for:** games, web3, sci-fi launches, spatial tools, collectibles, cinematic community pages.
- **Palette:** void black `#000000`, cloud white `#ffffff`, light mist `#b8bab9`, ghost gray `#e2e2e2`, control gray `#444345`; decorative blue `#2e9ec3`, red `#bc1010`, pink `#d69dbb`, light blue `#20b0d7`, blue-gray `#9faac0`. Use one decorative accent per section.
- **Typography:** Roobert-like display with ligatures off (`"liga" 0`); GT America Mono-like 10-12px body with -0.02em tracking.
- **Radius:** 2px buttons/nav, 10px cards, 20px containers.
- **Spacing:** 4px base, 20px element/card padding, 40px section gap, occasional 116px dramatic separation.
- **Motion rules:** slow 3D map pan/rotation, layered depth, fade/slide overlays, underline nav hover, translucent ghost buttons that allow background through.
- **Components:** full-viewport image/3D hero, hairline cards, translucent ghost CTAs, compact mono metadata.

### 7. Neon Noir Editorial

Source signal: HAPE PRIME. Digital fashion runway in black and crimson.

- **Use for:** digital fashion, NFT character brands, luxury streetwear, dramatic editorial commerce, avatar products.
- **Palette:** crimson `#730200`, deep black `#000000`, ghost white `#ffffff`, top-anchored crimson heat radial. No other chromatic colors.
- **Typography:** Integral CF-like headlines with 400/600/800 and extreme tracking variation; Neue Plak Extended body at 12-15px with -0.02em; Druk Text Wide 10px uppercase micro labels.
- **Radius:** 26px pills for all buttons and links; 0px cards and image blocks. This contrast is the signature.
- **Spacing:** 4/6/8/10/12/15/20/30/40/50; tight 6px element gaps; 50px section spacing; crimson cards with 50px horizontal-only padding.
- **Motion rules:** 3D character rotate in hero, crimson radial pulse, full-bleed band transitions, ghost button inversion. Do not add complex grids or extra gradients.
- **Components:** sharp crimson content cards, pill ghost nav, bottom nav, centered character stage, two-column editorial sections.

### 8. Geometric Soft-Cards

Source signal: Moving Parts. High-contrast geometric SaaS/editorial hybrid.

- **Use for:** premium SaaS, design tooling, portfolios, creative software, product explainers.
- **Palette:** black `#000000`, white `#ffffff`, dark `#121212`, fog `#bcc1c7`, warm mist `#efefef`, cloud `#b3b3b3`, pale ash `#999999`, pure royal blue `#0000ff` as the exclusive CTA, emerald `#00d37c` for soft emphasis, conic spectrum for decorative motion only.
- **Typography:** Unica77 with `"salt"` and `"ss01"` through `"ss09"`; PP Neue Montreal for display; Druk XXCondensed at 195-248px; Whyte Semi-Mono for body. This is controlled type plurality, not random font soup.
- **Radius:** bipolar: 0px buttons and inputs, 2.5px small elements, 14px images, 18px icons, 90.3833px cards, 106.333px large cards, sometimes top-rounded/flat-bottom.
- **Spacing:** 4px base; 13px element gap; 30px card padding; 40px section gap; large 120/148/172 intervals for poster rhythm.
- **Motion rules:** rotating conic shapes, huge type choreography, card stack motion, stylistic-set hover shifts, sharp blue CTA states. Only one large shadow may exist.
- **Components:** sharp blue CTAs, ultra-rounded cards, bottom-flat hero containers, geometric decorative discs, large product screenshots.

### 9. Iridescent Shader Night

Source signal: homunculus. Minimal dark site where an organic shader is the identity.

- **Use for:** creative tech labs, experimental portfolios, Japanese-style studios, abstract art/technology pages.
- **Palette:** black `#000000`, ghost `#ffffff`, dark slate `#383838`, asphalt `#6f6f6f`, silver `#dddddd`. Chromatic color appears only inside the organic shader asset.
- **Typography:** rare inversion: Times-like serif for body/content authority; urw-din-like sans for UI. UI tracking can swing from -0.08em at 12px to 0.20em at 14px.
- **Radius:** 0px everywhere.
- **Spacing:** radically minimal 8 and 10px for compact controls; single-axis full-bleed layout; 1px hairlines.
- **Motion rules:** full-bleed iridescent fluid shader, underline/border nav hover, scroll indicator pulse, single-axis narrative scroll. No multi-column grids, no card stacks, no multi-level elevation.
- **Components:** top-left logo mark, top-right contact/social cluster, hairline dividers, compact scroll indicator, fixed shader canvas.

## Archetype Picker

- **DTC, merch, street energy:** Brutalist DTC or Neon Noir.
- **Type, archive, portfolio:** Type Foundry Minimalism or Stark Editorial Dark.
- **Marketplace, SaaS, product discovery:** Nebula Gradient Hero or Geometric Soft-Cards.
- **Hardware, music, technical gear:** Instrument Panel.
- **Game, web3, cinematic community:** Holographic Sci-Fi or Neon Noir.
- **Experimental studio, shader art, quiet premium:** Iridescent Shader Night or Stark Editorial Dark.

If the prompt says "motion-heavy" without more context, choose the archetype from the object: product commerce -> Brutalist DTC; abstract agency -> Stark Editorial Dark; platform -> Nebula; technical product -> Instrument Panel.

## Motion Engine Picker

Use the smallest engine that can deliver the motion role.

### CSS Only

Use for hover states, looping marquees, ambient gradients, simple reveals, button physics, and reduced-motion-safe UI. Prefer CSS when animation is continuous but non-interactive.

- **Best at:** marquee, shimmer, gradient drift, hover inversion, focus outlines, view-timeline when supported.
- **Avoid when:** you need scroll pinning, timeline scrubbing, sequencing across many elements, or 3D camera logic.

### Framer Motion

Use in React apps for component-level enter/exit, layout continuity, modals, shared `layoutId`, drag, and small state machines.

- **Best at:** UI state transitions, route panels, card stacks, word reveals, viewport once-reveals.
- **Avoid when:** a page depends on exact scroll timelines or long pinned narratives; use GSAP instead.

### GSAP + ScrollTrigger

Use for choreographed pages: pinning, scrubbed galleries, chapter timelines, word opacity scrubs, stack cards, and media scale/fade.

- **Best at:** pinned narrative, smooth sequential timelines, complicated start/end triggers, responsive rebuild through `matchMedia`.
- **Guardrail:** register plugins once, scope animations to a component, kill triggers on unmount, disable pinning on cramped mobile unless tested.

### Lenis + GSAP

Use only when the design needs eased scroll feel across cinematic sections and the project can own scroll behavior.

- **Best at:** long narrative landing pages, luxury/editorial motion, continuous scroll-linked fields.
- **Avoid when:** dashboards, forms, chat, data-heavy apps, native scroll restoration, or accessibility concerns matter more than cinematic feel.

### R3F / Three

Use when the hero proof is a 3D object, shader, particle field, world map, or product model that cannot be faked with CSS.

- **Best at:** rotating character/product, shader night, holographic scenes, interactive pointer parallax in 3D.
- **Guardrail:** lazy load the canvas, cap DPR, pause offscreen, provide static poster fallback, keep UI outside the canvas for accessibility.

### View Transitions API

Use for route/page continuity and small same-document morphs when supported. Progressive enhancement only.

- **Best at:** gallery-to-detail, card-to-modal, filtered list continuity, route title morphs.
- **Guardrail:** feature-detect `document.startViewTransition`; provide normal state update fallback.

## Reusable Motion CSS

### Refero Expansion Timing Contracts

- Product selector/state motion: 100-180ms hover/focus, 0.1s quick state if Apple-like, with selected state visible without motion.
- Product/card reveal: 180-360ms opacity + translate; Chronicle and Resend stay at 150-300ms, Apple can use 0.344s, N8n path sweeps may run 300-700ms.
- Pinned/workflow motion: preserve static endpoints first; N8n/Retool path or shimmer animations must attach to a real node, editor, timeline, or product module.
- Reduced motion: replace scrubbed or looping effects with a visible static sequence, active chapter label, and non-animated focus/selected rings.

```css
.motion-root {
  min-height: 100svh;
  overflow-x: clip;
  background: var(--motion-canvas);
  color: var(--motion-ink);
  font-family: var(--font-body);
}

.motion-display {
  font-family: var(--font-display);
  font-size: clamp(4rem, 13vw, 13rem);
  line-height: 0.84;
  letter-spacing: -0.025em;
  text-transform: uppercase;
  text-wrap: balance;
}

.motion-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.motion-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--motion-line);
  border-radius: var(--radius-control);
  background: transparent;
  color: currentColor;
  transition:
    background-color var(--dur-ui) var(--ease-out-expo),
    color var(--dur-ui) var(--ease-out-expo),
    border-color var(--dur-ui) var(--ease-out-expo),
    transform var(--dur-ui) var(--ease-emphasized);
}

.motion-ghost:is(:hover, :focus-visible) {
  border-color: currentColor;
}

.motion-ghost:active {
  transform: scale(0.985);
}

@keyframes motion-rise-mask {
  from { opacity: 0; transform: translate3d(0, 110%, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes motion-nebula-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  50% { transform: translate3d(6%, -4%, 0) scale(1.08) rotate(8deg); }
}

@keyframes motion-conic-spin {
  to { transform: rotate(360deg); }
}

@keyframes motion-marquee-x {
  to { transform: translate3d(-50%, 0, 0); }
}
```

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type MotionState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type MotionStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function MotionStatusPill({ role, children }: { role: MotionStatus; children: React.ReactNode }) {
  return <span className="motion-status-pill" data-role={role}>{children}</span>;
}

export function PinnedScrollChapterContract({ state = "default" }: { state?: MotionState }) {
  return <section className="motion-hero-object" data-state={state} aria-label="Motion proof object" />;
}

export function ScrubbedGalleryContract({ title, meta, state = "default" }: { title: string; meta: string; state?: MotionState }) {
  return <article className="motion-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function KineticWordRevealContract({ items }: { items: string[] }) {
  return <nav className="motion-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function MotionSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="motion-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.motion-status-pill {
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
.motion-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.motion-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.motion-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.motion-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.motion-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.motion-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.motion-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.motion-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.motion-card[data-state="error"] { border-color: var(--status-danger-fg); }
.motion-card > span { font: var(--type-meta); color: var(--text-muted); }
.motion-card > strong { font: var(--type-card); color: var(--text); }
.motion-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.motion-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.motion-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.motion-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.motion-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.motion-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.motion-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .motion-hero-object { min-height: 280px; }
  .motion-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```

## Complete Page Protocols

```tsx
// Pinned Product Narrative
<main data-skill="motion" data-archetype="pinned-product-narrative">
  <PinnedScrollChapterContract chapter="01" media={<AnimatedProductDemoContract />} />
  <ScrubbedGalleryContract frames={productStates} fallback="static storyboard" />
  <TimelineControlContract items={["Intro", "Proof", "Action"]} />
  <ReducedMotionFallbackContract mode="visible-static-sequence" />
</main>

// Kinetic Launch
<main data-skill="motion" data-archetype="kinetic-launch">
  <KineticWordRevealContract text="Motion explains state" />
  <CursorParallaxStageContract state="selected" />
  <MotionCardStackContract cards={featureCards} />
</main>
```

## Copyable Recipes

### Pinned Scroll Narrative: GSAP + ScrollTrigger

Use for product chapters where text should pin while media scrubs through states. Keep pinning desktop-first.

```tsx
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Chapter = { kicker: string; title: string; body: string; image: string };

export function PinnedNarrative({ chapters }: { chapters: Chapter[] }) {
  const root = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !root.current) return;

    const ctx = gsap.context(() => {
      const media = gsap.matchMedia();

      media.add("(min-width: 900px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
        const images = gsap.utils.toArray<HTMLElement>("[data-panel-image]");

        gsap.set(panels.slice(1), { autoAlpha: 0, y: 48 });
        gsap.set(images.slice(1), { autoAlpha: 0, scale: 1.08 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${chapters.length * window.innerHeight}`,
            scrub: 0.8,
            pin: true,
            anticipatePin: 1
          }
        });

        panels.forEach((panel, index) => {
          if (index === 0) return;
          tl.to(panels[index - 1], { autoAlpha: 0, y: -36, duration: 0.45 }, index)
            .to(images[index - 1], { autoAlpha: 0, scale: 0.96, duration: 0.45 }, index)
            .to(panel, { autoAlpha: 1, y: 0, duration: 0.55 }, index + 0.05)
            .to(images[index], { autoAlpha: 1, scale: 1, duration: 0.65 }, index + 0.05);
        });
      });
    }, root);

    return () => ctx.revert();
  }, [chapters.length]);

  return (
    <section ref={root} className="motion-pin">
      <div className="motion-pin__copy">
        {chapters.map((chapter) => (
          <article data-panel className="motion-pin__panel" key={chapter.title}>
            <p className="motion-label">{chapter.kicker}</p>
            <h2>{chapter.title}</h2>
            <p>{chapter.body}</p>
          </article>
        ))}
      </div>
      <div className="motion-pin__media" aria-hidden="true">
        {chapters.map((chapter) => (
          <img data-panel-image src={chapter.image} alt="" key={chapter.image} />
        ))}
      </div>
    </section>
  );
}
```

```css
.motion-pin {
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(2rem, 5vw, 6rem);
  align-items: center;
  padding: clamp(4rem, 8vw, 8rem);
}

.motion-pin__copy {
  position: relative;
  min-height: 44vh;
}

.motion-pin__panel {
  position: absolute;
  inset: 0 auto auto 0;
  max-width: 34rem;
}

.motion-pin__panel h2 {
  margin: 0.35em 0;
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 8rem);
  line-height: 0.86;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.motion-pin__media {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--motion-surface);
  border-radius: var(--radius-stage);
}

.motion-pin__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform, opacity;
}

@media (max-width: 899px) {
  .motion-pin {
    display: block;
    padding: 4rem 1rem;
  }

  .motion-pin__panel,
  .motion-pin__media img {
    position: static;
    opacity: 1 !important;
    transform: none !important;
  }

  .motion-pin__media {
    margin-top: 2rem;
  }
}
```

### Split Word Reveal Without Paid SplitText

Use accessible text, then split words into masked spans. For letters, split graphemes with `Intl.Segmenter`; for most UI, word reveal is more stable.

```tsx
import { useMemo } from "react";

export function SplitWordReveal({ text }: { text: string }) {
  const words = useMemo(() => text.trim().split(/\s+/), [text]);

  return (
    <h1 className="split-title" aria-label={text}>
      {words.map((word, index) => (
        <span className="split-word" aria-hidden="true" key={`${word}-${index}`}>
          <span style={{ "--i": index } as React.CSSProperties}>{word}</span>
        </span>
      ))}
    </h1>
  );
}
```

```css
.split-title {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.22em;
  max-width: min(100%, 12ch);
  font-family: var(--font-display);
  font-size: clamp(4.5rem, 15vw, 13rem);
  line-height: 0.82;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.split-word {
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.04em;
}

.split-word > span {
  display: inline-block;
  animation: motion-rise-mask var(--dur-reveal) var(--ease-out-expo) both;
  animation-delay: calc(var(--i) * 70ms);
  will-change: transform, opacity;
}
```

### CSS Marquee With Hover Pause

Duplicate the items once in the DOM for a clean `-50%` loop. Use for partners, drops, navigation rails, or status strips.

```tsx
export function MotionMarquee({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="marquee" aria-label={items.join(", ")}>
      <div className="marquee__track" aria-hidden="true">
        {loop.map((item, index) => (
          <span className="marquee__item" key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
```

```css
.marquee {
  width: 100%;
  overflow: hidden;
  border-block: 1px solid var(--motion-line);
  background: var(--motion-canvas);
  color: var(--motion-ink);
}

.marquee__track {
  display: flex;
  width: max-content;
  gap: clamp(2rem, 6vw, 6rem);
  padding: 1rem 0;
  white-space: nowrap;
  animation: motion-marquee-x 28s linear infinite;
}

.marquee:hover .marquee__track,
.marquee:focus-within .marquee__track {
  animation-play-state: paused;
}

.marquee__item {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 4vw, 4rem);
  line-height: 1;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}
```

### Cursor Parallax With Lerp + RAF

Use inside a bounded stage. Disable on touch and reduced motion. Keep the cursor decorative; never hide required information behind it.

```tsx
import { useEffect, useRef } from "react";

export function CursorParallaxStage({ children }: { children: React.ReactNode }) {
  const stage = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const node = stage.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!node || reduce || coarse) return;

    let raf = 0;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      target.current.x = (event.clientX - rect.left) / rect.width - 0.5;
      target.current.y = (event.clientY - rect.top) / rect.height - 0.5;
    };

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;
      node.style.setProperty("--parallax-x", current.current.x.toFixed(4));
      node.style.setProperty("--parallax-y", current.current.y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    node.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <div ref={stage} className="cursor-stage">{children}</div>;
}
```

```css
.cursor-stage {
  --parallax-x: 0;
  --parallax-y: 0;
  position: relative;
  overflow: clip;
}

.cursor-stage [data-depth="1"] {
  transform: translate3d(
    calc(var(--parallax-x) * 16px),
    calc(var(--parallax-y) * 16px),
    0
  );
}

.cursor-stage [data-depth="2"] {
  transform: translate3d(
    calc(var(--parallax-x) * -32px),
    calc(var(--parallax-y) * -24px),
    0
  );
}
```

### View Transition Progressive Enhancement

Use for list-to-detail continuity. The fallback is the state update itself.

```tsx
function runTransition(update: () => void) {
  if (!("startViewTransition" in document)) {
    update();
    return;
  }

  document.startViewTransition(update);
}

export function ProjectCard({ project, open }: { project: { id: string; title: string }; open: () => void }) {
  return (
    <button
      className="project-card"
      style={{ viewTransitionName: `project-${project.id}` }}
      onClick={() => runTransition(open)}
    >
      {project.title}
    </button>
  );
}
```

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 520ms;
  animation-timing-function: var(--ease-out-expo);
}

.project-card {
  contain: layout;
}
```

### Reduced-Motion Fallback

This fallback freezes motion while preserving final visibility, focus, and section structure.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  [data-reveal],
  [data-panel],
  [data-panel-image],
  .split-word > span {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
    filter: none !important;
  }

  [data-parallax],
  [data-depth],
  .marquee__track {
    transform: none !important;
    animation: none !important;
  }
}
```

## Layout And Type Rules

- Hero H1 should be intentionally wide and typically 2-3 lines on desktop. Use `max-width: 12ch` for huge poster words or `max-width: 16-20ch` for readable campaign lines.
- Use `clamp()` for display size, but do not scale body text with viewport width.
- Use OpenType features when the archetype depends on them: Handshake stylistic sets, MekaVerse ligatures off, Moving Parts many stylistic sets.
- Metadata text is usually uppercase, small, and either mono or extended. It should not become generic gray eyebrow filler.
- Motion layouts prefer full-bleed bands, pinned stages, single-axis flows, or poster grids over default centered 1200px sections.

## Performance Guardrails

- Cap expensive animation count. One hero atmosphere, one scroll narrative, and one micro-interaction system is often enough.
- Use `will-change` only shortly before or during animation. Do not put it globally on dozens of cards.
- Avoid `filter: blur()` on large scrolling layers. If using atmospheric blur, keep it fixed, absolute, or canvas-rendered behind content.
- Lazy load 3D/canvas/video; render a poster or CSS fallback first.
- For R3F, set `dpr={[1, 1.5]}` or equivalent, pause render loops when offscreen, and avoid huge shadow maps.
- For GSAP, call `ctx.revert()` or kill triggers on unmount. Use `ScrollTrigger.matchMedia()` or `gsap.matchMedia()` for responsive timelines.
- Do not pin every section. Pinning is a narrative accent, not the whole page.
- Keep focus states visible and avoid motion that moves focused controls away from the pointer or keyboard user.
- Test at mobile width: no overlapping hero text, no hidden CTAs, no pinned sections trapping scroll, no horizontal scrollbar from offscreen animated elements.

## Anti-Slop Rules

- No generic centered hero plus three feature cards unless the archetype explicitly transforms it with type, proof, and motion.
- No multicolor SaaS semantic palette where success/warning/info/destructive all compete. Motion systems budget chroma tightly.
- No purple-blue default gradients, generic Tailwind blue CTAs, or token soup.
- No rounded-default UI when the archetype calls for sharp, pill-only, or extreme bipolar geometry.
- No animation spam. Repeating fade-up on every element is weaker than one purposeful sequence.
- No empty decorative badges. Labels must carry category, status, metadata, or navigation.
- No cards inside cards unless building a deliberate nested hardware/bezel pattern.
- No "motion-only" content. The final state must communicate without replay.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`. For expanded implementation examples, load `references/advanced-implementation-notes.md` only after the archetype and token pack are chosen.

## Absolute Bans

- No animating everything.
- No motion used to compensate for weak content.
- No width/height/top/left animation when transform can do it.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.


## Pre-Output Checklist

- First viewport contains a real animated product/narrative object.
- One Motion archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to declared motion primitive and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
