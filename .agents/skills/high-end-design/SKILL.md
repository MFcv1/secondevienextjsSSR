---
name: high-end-design
description: "Use this skill to create premium high-end websites and product experiences using restraint, refined type, strong imagery, material cues, luxury pacing, and quiet conversion paths. USE FOR: luxury sites, premium product pages, high-end portfolios, refined commerce, gallery-like brand systems. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# High-End Design Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one High-End Design archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, material/product/gallery proof with inspectable detail, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete High-End Design components with states.
7. **Motion plan:** refined image, material, or product reveal, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

High-end design is defined by restraint, evidence, material intelligence, and pacing. It is not a black background, a gold gradient, tiny illegible labels, or a vague lifestyle image. The product, object, service, craft, or environment must be inspectable. The interface should feel premium because every typographic, spatial, material, and interactive decision has been edited down to what matters.

Use this skill for luxury products, refined commerce, premium portfolios, hospitality, interiors, automotive, equipment, gallery-like brand systems, craft services, and product experiences where trust comes from precision and proof.

The output should feel premium, restrained, confident, tactile, editorial, and composed. Conversion can be clear without shouting. Detail can be rich without clutter.


For substantial UI work, output a compact `<design_plan>` before code:

1. **Use case:** product/service, audience, price/consideration level, primary action, emotional target.
2. **Luxury geometry signature:** square machined, soft object gallery, editorial split, material room, utility precision, or refined commerce.
3. **Source archetype:** choose one primary source mode from this file and one supporting mode only if it solves a real section.
4. **Object proof:** what users can inspect in the first or second section: product, material, craft process, environment, specs, gallery, or interface.
5. **System contracts:** type families, color roles, radius, spacing, surfaces, image treatment, CTA behavior, states.
6. **Components:** at least four signature components with real content and states.
7. **Motion:** image crop, material reveal, purchase bar, gallery pacing, and reduced-motion replacement.
8. **Anti-cliche sweep:** how you will avoid fake luxury, vague imagery, over-blur, and hidden product detail.

For tiny edits, do it mentally. For full sites, product pages, commerce, or redesigns, show it.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Low-medium. Let objects and typography breathe, then add detail with captions and material specs. |
| motion | Low-medium. Slow image reveals, gallery pacing, tactile hover, product rotation, smooth chapter transitions. |
| decoration | Very low. Material, crop, and spacing are the decoration. |
| contrast | Refined high contrast or warm architectural neutrals. |
| radius | 0-4px for automotive/editorial, 8px for product cards, 32-80px only for soft luxury furniture/wellness. |
| type | Elegant serif or premium grotesk. Body text must stay readable and calm. |
| assets | Large product photography, material closeups, gallery frames, architectural images, craft process. |

## Signature System

- Luxury Geometry Signatures: Ferrari/BMW can be 0px and machined; B&O can use 40px pill CTAs; interiors may use 80px soft corners; Peak uses 4-8px utility precision.
- Object As Proof: the product or craft must be inspectable in the first or second section.
- Quiet Conversion: CTAs are visible but composed, often text links, small pills, or refined bars.
- Material Cue System: leather, metal, glass, fabric, wood, stone, carbon, or paper must influence surfaces and motion.

## Differentiation

Use High-End Design when luxury sites, premium product pages, high-end portfolios, refined commerce, gallery-like brand systems. If removing the material/product/gallery proof, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `serif-display` for type-led elegance; use this when material proof, product object, imagery, and luxury pacing must work together.

### Execution Token Contract

Refero ready-to-use deltas from Spacelab/Sequel/Revenuecat:
- Token roles: Spacelab `#ffffff/#000000/#2c2222/#b2b4b1/#495472`; Sequel `#000000/#ffffff/#f5f5f0/#202020/#333333/#999999/#b3b3b3/#c0c0c0/#cccccc`; Revenuecat `#ffffff/#f9f9fb/#1f1f47/#576cdb/#6c7693/#abb6ed/#eaedf6`.
- Type roles: Helvetica Neue 15-62px with `0.011em`, VisueltPro 10-128px plus Bradford 32/58/128px, Object Sans 80px at `-0.0700em`.

Every High-End Design build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #f8f3ea;
  --surface: #ffffff;
  --surface-muted: #ece4d8;
  --text: #17150e;
  --text-muted: #756d62;
  --line: #d9cfc0;
  --action: #17150e;
  --action-strong: #000000;
  --radius-control: 999px;
  --radius-card: 8px;
  --radius-panel: 16px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Canela", "Tiempos Text", Georgia, serif;
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
  --shadow-card: 0 1px 0 rgba(255,255,255,.75) inset, 0 12px 38px rgba(23,21,14,.06);
  --shadow-panel: 0 28px 90px rgba(23,21,14,.10);
  --shadow-hero: 0 44px 130px rgba(23,21,14,.14);
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
  --status-neutral-fg: #756d62;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --hed-bg: var(--canvas);
  --hed-confirm: var(--status-success-fg);
  --hed-confirm-surface: var(--status-success-bg);
  --hed-cta-radius: var(--action);
  --hed-danger: var(--status-danger-fg);
  --hed-display: var(--text);
  --hed-ink: var(--text);
  --hed-line: var(--line);
  --hed-material: var(--action);
  --hed-muted: var(--text-muted);
  --hed-object-radius: var(--surface-muted);
  --hed-stage: var(--surface);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | High-End Design token |
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

Token rule: if a value can be expressed by `hed`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Non-Negotiable Principles

- Show the object or craft clearly. High-end does not mean hiding product proof.
- Material cues must influence surfaces, motion, or copy, not just palette names.
- Conversion is quiet but visible: refined CTAs, persistent purchase bars, appointment routes, concierge forms.
- Typography must be refined and readable. Tiny text is not sophistication.
- Use fewer effects, better crops, stronger spacing, and concrete details.
- Build states with the same restraint as the default state.
- Avoid fake scarcity, gold cliches, generic black pages, and ornamental gradients.

## Luxury Geometry Signatures

Choose one signature and repeat it.

| Signature | Best For | Radius | Geometry | CTA |
| --- | --- | --- | --- | --- |
| Machined square | Automotive, cameras, tools, equipment | `0-4px` | black/white panels, exact grids, hard image crops | square button, text link, technical blue/red only if brand owns it |
| Object gallery | audio, furniture, jewelry, objects | `0-4px` frames plus `40px` pill CTA if appropriate | centered product, wide negative space, gallery rows | quiet pill or underlined link |
| Architectural warm | interiors, staging, hospitality, craft | `0px` or soft `24-80px` if object language supports it | room-like bands, large photos, material closeups | outlined rectangular or soft pill |
| Editorial split | portfolios, campaigns, premium services | `0-8px` | strong type/image split, chapter rhythm, captions | text link or small refined button |
| Utility precision | premium commerce and gear | `4-8px` | product cards, tabs, search, comparison | clear product CTA, sticky purchase bar |
| Velvet depth | immersive showcase | `0-12px` | dark fields, spotlighted objects, low chrome | pale outline or filled neutral CTA |

Do not mix all of them. A B&O-like product gallery can have pill CTAs and object-centered imagery; a Ferrari/BMW-like system wants harder geometry and sharper action; a Peak-like commerce system can be refined while still having practical tabs and search.

## Source Archetypes

### Additional Refero Source Packs

- Spacelab zero-radius gallery: `#ffffff/#000000/#2c2222/#b2b4b1/#495472`; Helvetica Neue 400 at 15/17/19/21/30/62px, leading `1/1.07/1.1/1.15/1.2`, tracking `0.011em`; 42px section rhythm, 21px card padding/gap; cards/buttons 0px, small details 4px.
- Sequel refined serif commerce: `#000000/#ffffff/#f5f5f0/#202020/#333333/#999999/#b3b3b3/#c0c0c0/#cccccc`; VisueltPro 300/400/500 10-128px with `-0.05em` to `0.08em`, Bradford 500 at 32/58/128px; 47-76px sections, 3-28px gaps, 10px cards, 9999px buttons/badges.
- Revenuecat precise premium SaaS: `#ffffff/#f9f9fb/#1f1f47/#576cdb/#171a1c/#3d3d5c/#6c7693/#abb6ed/#eaedf6`; Object Sans 100-700 with 80px display at `-0.0700em`, Helvetica Neue body; 1216px max, 120px sections, 24px cards, 20px gaps; cards 0px, buttons 9999px, elevated shadow `rgba(71,92,133,.25) 0 4px 20px, rgba(144,138,208,.1) 0 30px 60px`.
- State transfer: Spacelab hover stays border/underline only with `#495472`; Sequel disabled/meta uses `#999999/#b3b3b3`; Revenuecat focus rings use `#abb6ed` on `#f9f9fb` with action `#576cdb`.

- Adam Lippes high-key fashion: `#000000/#121212/#403f3e/#4c4c4a/#b2b0ae/#fefcf8/#ffffff`; Optima 400, Arial 400, GTStandard-M 400; scale 10/11/12/13/14/16/24 with Optima line-height 1-1.8; spacing 5-40px, sections 48px, card 0px, gaps 10px; radii cards/buttons 0px, badges 40px, accent ghost 1000px; nav shadow `rgba(0,0,0,.05) 0 4px 5px`, drawer `rgba(0,0,0,.15) 0 -8px 24px`.
- Moffitt.Moffitt. gallery restraint: `#ffffff/#000000/#f5f5f5/#595b60/#888888/#d8d8da`; Suisse 400/500/600, Lyon 100; scale 12/16/22/24/40; sections 40px plus 80/120/140px rhythms, cards 20px, gaps 10px; buttons/tags 50px, cards/inputs 0px, images 5px; no shadows.
- ARTU furniture precision: `#ffffff/#000000/#d7ff66/#ff1313`; Helvetica Neue Pro 400; scale 18/20/24/32, line-height 1.15, letter spacing `0.0240/0.0220/0.0180/0.0140em`; sections 32px, cards 18px, gaps 11px; radius 0; no shadows/gradients.
- Dyson technical premium: `#333333/#999999/#ffffff/#000000/#919191/#555555/#ebebeb/#fff8e6/#dadada`, CTA `#79b928`, link `#0066cc`, info `#149ecc`, promo `#ac5d00`; DysonFutura 300/400/500; scale 12/14/16/18/24/28/32/36; 4px base, 48px sections, 16px cards, 8px gaps; cards/buttons 0px, badges 2px, images 8px.
- Apple product luxury: `#1d1d1f/#707070/#474747/#333333/#f5f5f7/#ffffff/#000000/#e8e8ed`, CTA `#0071e3`, link `#0066cc`, caution `#b64400`, finish swatches `#e3e4e5/#e8d0d0/#dddc8c/#596680`; SF Pro Display/Text; scale 12/14/17/20/24/40/56/96, tracking `-0.26px` to `-2.11px`; max 1200px, sections 80-120px, cards 28px, gap 10px; buttons 999px, nav 980px, swatches 28px with 3px ring.

### 1. Precision Object Gallery

Source logic: Bang & Olufsen. Use for audio, electronics, furniture, product galleries, and object-led premium commerce.

| System Part | Direction |
| --- | --- |
| Hex | `#060daa` midnight indigo, `#191817` carbon, `#fcfaee` barely white, `#555555` ash, `#ffffff`, `#e5e5e5`, `#000000` |
| Typography | Single refined sans; `12`, `14`, `16`, `24`, `36`; weights `400`, `500`, `700`; line-height `1.15-1.71`; subtle optical letter-spacing |
| Radius | Badges `2px`, product objects/frames `0-4px`, CTA pills around `40px` |
| Spacing | `48px` section rhythm, `4px` micro-unit, `32-48px` product grid gaps |
| Carry forward | Object centered in a clean stage, dark immersive anchor section, white product grids, scarce soft CTA, 1px ghost borders |
| Avoid | Extra fonts, many accents, shadows, busy backgrounds, dense modules, default blue links |

Implementation posture:
- Let the object sit in a generous visual stage.
- Use product name, finish, price, availability, and material as visible proof.
- Keep badges small and rectangular.
- Use midnight indigo as a deep anchor, not a general gradient playground.

### 2. Engineered Monochrome Luxury

Source logic: BMW. Use for automotive, mobility, equipment, technical services, and precision product systems.

| System Part | Direction |
| --- | --- |
| Hex | `#262626` obsidian, `#ffffff`, `#bbbbbb` graphite gray, `#f1f1f1` frost, `#1c69d4` technical action |
| Typography | Precise sans; body `16-18`; light display around `60`; weights `300`, `400`, `700`, `900`; line-height up to `1.63` |
| Radius | `0px` buttons and panels |
| Spacing | `40px` sections, `8px` element gaps, `16px` card padding, strong footer anchor |
| Carry forward | Full-bleed image hero, square CTAs, monochrome UI, technical blue for interaction/focus only, comprehensive footer |
| Avoid | Rounded lifestyle cards, decorative blue, weak photo crops, excessive copy, generic premium black without product context |

Implementation posture:
- Use photography or configuration proof early.
- Keep UI square and direct.
- Use technical blue sparingly for focus/action.
- Make spec and model discovery easy.

### 3. Performance Machinery

Source logic: Ferrari. Use for performance products, automotive, aerospace, tools, high-speed campaigns, and high-stakes launches.

| System Part | Direction |
| --- | --- |
| Hex | black, silver/gray, white, critical red |
| Typography | Strong sans for navigation/specs, high-contrast display for model names; uppercase only where it carries technical authority |
| Radius | Mostly `0px`; occasional `4px` for controls |
| Spacing | Tight technical modules plus large image chapters |
| Carry forward | Red as critical signal, dark/silver surfaces, machined panels, exact spec rows, dramatic but inspectable product imagery |
| Avoid | Red everywhere, fake speed streaks, smoky blur, illegible controls, hiding specs behind mood copy |

Implementation posture:
- Treat red like an instrument warning light or race marker.
- Pair emotional hero with hard specifications.
- Use clean mechanical dividers and model selectors.
- Keep object render/photo crisp.

### 4. Architectural Parchment Service

Source logic: True Staging. Use for interiors, staging, hospitality, architectural services, galleries, and craft consultancies.

| System Part | Direction |
| --- | --- |
| Hex | aged parchment, ink, warm neutrals, muted architectural lines |
| Typography | Editorial serif or refined sans; calm body, measured captions, plan-like labels |
| Radius | Usually `0px`; soft room/object corners only if photography supports it |
| Spacing | Large narrative sections, room-like bands, blueprint details |
| Carry forward | Before/after proof, floorplan logic, material captions, restrained warm palette, service process with clear inquiry route |
| Avoid | Beige lifestyle vagueness, fake handwritten luxury, generic mood boards, text over busy room photos |

Implementation posture:
- Show actual rooms, plans, materials, and transformation proof.
- Use captions as credibility, not decoration.
- Keep inquiry path refined but obvious.
- Use warm paper as a surface, not as a washed-out theme.

### 5. Practical Premium Gear Commerce

Source logic: Peak Design. Use for premium gear, bags, camera equipment, refined outdoor products, and commerce systems that must remain useful.

| System Part | Direction |
| --- | --- |
| Hex | `#000000`, `#ffffff`, `#1a211e`, `#eef1f0`, `#0c0c0c`, `#606562`, `#cccfcd`, `#4e4e4e`, `#cc2e39` |
| Typography | Serif display for craft, Inter-like sans for body, uppercase action face for CTAs/badges, mono for technical codes |
| Radius | Cards `8px`, inputs/buttons `4px`, badges `9999px`, special buttons `32px` |
| Spacing | `72px` sections, `4px` micro gaps, product grid modules |
| Carry forward | Real product cards, category tabs, search, announcement bar, warranty/return proof, practical purchase flow |
| Avoid | Decorative product silhouettes replacing real images, saturated backgrounds, broken grid, over-styled controls, hiding price/specs |

Implementation posture:
- Commerce utility is part of the premium experience.
- Include category tabs, product grid states, search, filters, badges, warranty/returns.
- Use the display serif for editorial moments, not every product label.
- Keep product images clear and comparable.

## Material Cue Table

Material cues should affect visual and interaction decisions.

| Material | Surface | Type/Color | Motion | Good Proof |
| --- | --- | --- | --- | --- |
| Brushed metal | Cool gray, hard edges, subtle hairlines | Black/white/graphite, technical labels | Linear wipe, precise panel slide | macro detail, spec row, machining tolerance |
| Leather | Warm black/brown, low sheen, soft highlight | Serif or warm grotesk, deep neutrals | Slow crop reveal, tactile hover | stitching, grain, edge finishing |
| Glass | Clear surface, reflections, thin borders | High contrast, avoid low-opacity text | Parallax only if readable; focus outline strong | transparency, interface overlay, thickness detail |
| Wood | Warm bands, visible grain, square frames | Earth neutrals, calm body copy | Gentle image scale, no bouncy motion | joinery, finish, workshop/process |
| Fabric | Soft fields, woven texture, rounded only if product language supports | Muted labels, material swatches | Soft crossfade or crop | weave closeup, colorways, durability data |
| Stone | Weighty blocks, matte surfaces, generous spacing | Serif or architectural sans, low color count | Slow reveal, section weight | slab edge, installation, provenance |
| Carbon fiber | Dark patterned surface, technical highlights | Condensed or technical sans, red/blue signal | Sharp mask, spec comparison | weave detail, performance metric |
| Paper | Warm canvas, deckled/printed detail | Editorial type, black ink, restrained links | Page/chapter reveal | print sample, certificate, edition info |

Do not name materials in variables if the UI does not show or imply them. "Leather black" without leather proof is fake luxury.

## Typography System

Refero typography deltas:
- Spacelab: Helvetica Neue 400, 15/17/19/21/30/62px, leading `1/1.07/1.1/1.15/1.2`.
- Sequel: VisueltPro 300/400/500 10-128px, Bradford 500 32/58/128px.
- Revenuecat: Object Sans 100-700 for 80px display, Helvetica Neue for body.

High-end typography is calm, optically tuned, and useful.

| Role | Guidance |
| --- | --- |
| Hero display | `48-96px` for most pages; `112px` only when line length and mobile breaks are controlled |
| Product title | `24-40px`, often regular weight; avoid loud weights unless performance/gear brand |
| Body | `15-18px`, line-height `1.45-1.70`; readable over long sections |
| Caption/spec | `12-14px`, not below `12px` when actionable |
| CTA | short, direct, `14-16px`; case and tracking tied to brand |
| Technical detail | mono or uppercase only when it clarifies measurement, model, code, or state |

Type rules:
- Use no more than two or three families: display/editorial, functional sans, optional action/mono.
- Body copy should be quieter than display type.
- Do not use low contrast as a luxury signal.
- Use small uppercase labels sparingly and with enough spacing.
- Product names, prices, finishes, availability, and specs must be legible.
- Mobile hero should usually be `40-64px`, not desktop scale squeezed into a narrow viewport.

## Color And Surface Contracts

High-end palettes are small and assigned.

| Palette Mode | Use | Contract |
| --- | --- | --- |
| Carbon and white | automotive, gear, portfolios | `#000000/#ffffff` foundation, gray for metadata, one action signal |
| Warm architectural | interiors, craft, staging | paper/stone/wood neutrals, black ink, material imagery provides richness |
| Deep gallery | objects, audio, jewelry | dark anchor field, off-white text, product spotlight, limited CTA fill |
| Practical commerce | premium gear | high-contrast UI, ash surfaces, clear tabs/search, product photos dominate |
| Performance signal | machinery | red only for critical action, status, or brand-owned emphasis |

Surface rules:
- Use no shadow unless it mimics a real product/photo environment and remains subtle.
- Use background fields, borders, and image crops for structure.
- Avoid glassmorphism unless the product is literally glass/interface related.
- Keep page sections as bands or unframed layouts; use cards for repeated products, modals, and tools.
- Do not nest cards.
- Use material swatches only if they represent actual materials or options.

## Object/Product Proof

The first or second section must prove the product or service.

Proof types:
- clear product photography or render
- material closeup with label
- spec table or model comparison
- before/after slider for services
- craft/process sequence
- room/environment gallery
- product configuration or colorway selector
- warranty/repair/delivery information
- real case study with result

Weak proof:
- dark cropped image where object cannot be recognized
- generic lifestyle photo
- vague "crafted for excellence" copy
- decorative mockup with no functional detail
- stock-feeling texture with no material context

## Signature Components

Refero component deltas:
- Spacelab: zero-radius gallery cards/buttons, 4px small details, 21px padding/gap.
- Sequel: 10px cards, 9999px buttons/badges, grayscale meta.
- Revenuecat: 0px cards, 9999px buttons, 24px cards, elevated proof shadow.

Use at least four for full pages. Components need real content and states.

### Refero Expansion Component Deltas

- High-end geometry follows product category: fashion/editorial can be 0px (Adam Lippes, ARTU), gallery systems use 0px cards and 50px tags (Moffitt), technical premium uses 0px cards/buttons and 2px badges (Dyson), Apple uses 28px cards and 999px buy pills.
- Type must match material: Optima/GTStandard for fashion, Suisse/Lyon for gallery, Helvetica Neue Pro for furniture, DysonFutura for engineering, SF Pro for consumer electronics. Do not substitute generic sans when the source type carries category trust.
- Shadows are rare: Adam Lippes nav/drawer shadows only; Apple and Dyson use zero shadows; Moffitt/ARTU no shadows. Use photography, material finish, spacing, and sticky product bars instead.

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type HighEndDesignState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type HighEndDesignStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function HighEndDesignStatusPill({ role, children }: { role: HighEndDesignStatus; children: React.ReactNode }) {
  return <span className="high-end-design-status-pill" data-role={role}>{children}</span>;
}

export function GalleryHeroContract({ state = "default" }: { state?: HighEndDesignState }) {
  return <section className="high-end-design-hero-object" data-state={state} aria-label="High-End Design proof object" />;
}

export function MaterialSpecRowContract({ title, meta, state = "default" }: { title: string; meta: string; state?: HighEndDesignState }) {
  return <article className="high-end-design-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function QuietPurchaseBarContract({ items }: { items: string[] }) {
  return <nav className="high-end-design-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function HighEndDesignSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="high-end-design-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.high-end-design-status-pill {
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
.high-end-design-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.high-end-design-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.high-end-design-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.high-end-design-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.high-end-design-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.high-end-design-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.high-end-design-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.high-end-design-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.high-end-design-card[data-state="error"] { border-color: var(--status-danger-fg); }
.high-end-design-card > span { font: var(--type-meta); color: var(--text-muted); }
.high-end-design-card > strong { font: var(--type-card); color: var(--text); }
.high-end-design-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.high-end-design-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.high-end-design-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.high-end-design-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.high-end-design-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.high-end-design-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.high-end-design-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .high-end-design-hero-object { min-height: 280px; }
  .high-end-design-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### `gallery-hero`

Purpose: first viewport stage for a product, place, or portfolio object.

Required states:
- image loading with stable aspect ratio
- image error fallback with useful alt/description
- selected colorway/model
- CTA hover/focus/active/disabled
- reduced-motion static reveal

TSX:

```tsx
type HeroProduct = {
  name: string;
  subtitle: string;
  price?: string;
  material: string;
  imageAlt: string;
  state?: "ready" | "loading" | "error";
};

export function GalleryHero({ product }: { product: HeroProduct }) {
  return (
    <section className="hed-hero" data-state={product.state ?? "ready"}>
      <nav className="hed-nav" aria-label="Primary">
        <a href="/">Atelier</a>
        <a href="/objects">Objects</a>
        <a href="/materials">Materials</a>
        <a href="/concierge">Concierge</a>
      </nav>
      <div className="hed-hero__copy">
        <p className="hed-kicker">{product.material}</p>
        <h1>{product.name}</h1>
        <p>{product.subtitle}</p>
        <div className="hed-actions">
          <a className="hed-cta" href="/reserve">Reserve a viewing</a>
          <a className="hed-link" href="/details">Inspect details</a>
        </div>
      </div>
      <figure className="hed-object">
        <div className="hed-object__frame" role="img" aria-label={product.imageAlt} />
        {product.price ? <figcaption>{product.price} / made to order</figcaption> : null}
      </figure>
    </section>
  );
}
```

CSS:

```css
.hed-hero {
  min-height: 92svh;
  display: grid;
  grid-template-columns: minmax(0, .76fr) minmax(420px, 1.24fr);
  grid-template-rows: auto 1fr;
  gap: clamp(28px, 5vw, 88px);
  padding: 0 clamp(18px, 4vw, 64px) clamp(32px, 5vw, 72px);
  background: var(--hed-bg);
  color: var(--hed-ink);
}

.hed-nav {
  grid-column: 1 / -1;
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: clamp(18px, 3vw, 40px);
  border-bottom: 1px solid var(--hed-line);
}

.hed-hero__copy {
  align-self: end;
  max-width: 560px;
  padding-bottom: clamp(16px, 4vw, 56px);
}

.hed-hero__copy h1 {
  margin: 0 0 18px;
  font: 400 clamp(48px, 7vw, 94px)/.98 var(--hed-display);
  letter-spacing: -.025em;
  text-wrap: balance;
}

.hed-object {
  align-self: stretch;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 14px;
  margin: 0;
  min-height: min(72vh, 760px);
}

.hed-object__frame {
  min-height: 420px;
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--hed-material) 36%, transparent), transparent 38%),
    var(--hed-stage);
  border-radius: var(--hed-object-radius, 4px);
  overflow: hidden;
}

.hed-cta {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 24px;
  border: 1px solid currentColor;
  border-radius: var(--hed-cta-radius, 40px);
  color: inherit;
  text-decoration: none;
}

.hed-cta:focus-visible,
.hed-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

@media (max-width: 820px) {
  .hed-hero {
    grid-template-columns: 1fr;
  }
  .hed-object {
    min-height: 0;
  }
  .hed-object__frame {
    min-height: auto;
    aspect-ratio: 4 / 5;
  }
}
```

### `material-spec-row`

Purpose: show material, finish, dimensions, provenance, performance, or warranty without clutter.

States:
- loading skeleton with fixed row height
- empty spec with "not available for this model"
- error with retry or fallback source
- selected material row
- unavailable material with reason

Structure:
- left label
- primary value
- secondary detail
- optional swatch/image/detail link
- no heavy card wrapper unless rows repeat in a contained table

```css
.hed-spec-row {
  display: grid;
  grid-template-columns: minmax(120px, .4fr) minmax(0, 1fr) minmax(120px, .5fr);
  gap: 16px;
  align-items: baseline;
  padding: 16px 0;
  border-top: 1px solid var(--hed-line);
}

.hed-spec-row[data-state="selected"] {
  color: var(--hed-ink);
  box-shadow: inset 0 -2px 0 currentColor;
}

.hed-spec-row[data-state="unavailable"] {
  color: var(--hed-muted);
}

@media (max-width: 640px) {
  .hed-spec-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
```

### `quiet-purchase-bar`

Purpose: refined conversion that remains visible while users inspect detail.

Required content:
- product/service name
- selected option
- price or inquiry route
- availability/lead time
- primary action
- secondary detail link

States:
- default
- option changed
- loading price
- unavailable/sold out
- submitting
- success/confirmed
- validation error

Rules:
- Keep height stable.
- On mobile, stack into a bottom sheet or compact bar with clear CTA.
- Do not hide price/lead-time behind hover.
- Focus states must be visible.

### `editorial-product-card`

Purpose: repeated premium product card, case study card, or object tile.

Rules:
- Use real image, name, material/finish, price/status, and CTA or detail link.
- The image ratio must be stable, usually `4/5`, `1/1`, or `3/4`.
- Hover can zoom inner image by `1.015-1.03`, refine border, or reveal secondary detail.
- Card should not become a heavy floating container unless commerce utility requires it.
- Unavailable state must say why and what to do next.

### `craft-process-sequence`

Purpose: explain service or object quality through process.

Structure:
- numbered steps or chapters
- real material/craft proof per step
- caption-level specificity
- optional time, location, tool, or inspection point

States:
- selected step
- media loading/error
- compact mobile accordion
- reduced-motion static sequence

### `large-image-chapter`

Purpose: cinematic but inspectable image section.

Rules:
- Image must reveal object, room, material, or result.
- Captions must identify what users are seeing.
- Avoid dark overlays unless text needs them and contrast is verified.
- On mobile, place text below image if overlay becomes cramped.

### `concierge-form`

Purpose: inquiry, appointment, configuration, quote, or private viewing.

Fields:
- name/contact
- intent or product
- preferred date/time or budget/range when relevant
- message
- consent/trust note

States:
- validation per field
- disabled submit
- submitting
- success confirmation with next step
- error with recovery

High-end form behavior:
- labels are visible
- helper text is restrained
- error messages are clear and close to fields
- no placeholder-only fields
- button remains aligned and readable

### `refined-footer`

Purpose: designed closure with nav, contact, proof, and brand logic.

Rules:
- Repeat geometry, color, and type from the page.
- Include practical links: service, care, shipping, appointments, contact.
- Include one concrete proof item: showroom address, warranty, edition number, material standard, or press reference.
- Do not become a generic link dump.

## Refined Conversion

High-end conversion is not low-conversion. It is edited and confident.

Patterns:
- "Reserve a viewing"
- "Configure the model"
- "Request private appointment"
- "Start a made-to-order inquiry"
- "Add to bag"
- "Find a retailer"
- "Inspect materials"
- "Compare specifications"

CTA rules:
- One primary action per viewport.
- Secondary actions can be underlined text.
- Sticky purchase bars are allowed for commerce, but they must not cover content.
- Concierge forms should explain next response time.
- Buttons need hover, focus, active, disabled, loading, and success states.

Avoid:
- fake urgency
- hidden pricing when price should be known
- too many equivalent CTAs
- CTA copy that sounds generic or hype-driven

## Interaction States

Refero state deltas:
- Spacelab hover stays border/underline only with `#495472`; Sequel disabled/meta uses `#999999/#b3b3b3`; Revenuecat focus rings use `#abb6ed` on `#f9f9fb` with action `#576cdb`.

| State | High-End Treatment |
| --- | --- |
| Hover | subtle underline, border refinement, inner image scale, material swatch label |
| Focus | visible outline or inset border, not a faint glow |
| Active | small translate or fill change; no wobble |
| Selected | persistent mark, selected swatch ring, filled tab, spec row emphasis |
| Disabled | readable muted state plus reason if purchase-related |
| Loading | fixed dimensions, soft skeleton, no layout jump |
| Empty | calm message with one next action |
| Error | precise recovery, no aggressive red unless brand/system supports it |
| Success | confirmation with next step, receipt, appointment, or saved selection |

State token example:

```tsx
const premiumStates = {
  default: "border-current",
  selected: "bg-[var(--hed-ink)] text-[var(--hed-bg)]",
  loading: "pointer-events-none text-[var(--hed-muted)]",
  unavailable: "text-[var(--hed-muted)] line-through decoration-[var(--hed-line)]",
  error: "border-[var(--hed-danger)] text-[var(--hed-danger)]",
  success: "border-[var(--hed-confirm)] bg-[var(--hed-confirm-surface)]"
};
```

## Motion System

Refero motion delta:
- No source-specific durations were observed for Spacelab/Sequel/Revenuecat. Use existing high-end timing; animate opacity, underline, image reveal, and focus rings only.

- High-end motion is quiet and precise: 100-180ms for selectors/buttons, 250-360ms for product/gallery transitions, Apple-style 0.344s primary and 0.1s quick states where appropriate. Reduced motion keeps product comparison, selected swatches, sticky bars, and focus rings static.

## Complete Page Protocols

```tsx
// Luxury Product Page
<main data-skill="high-end-design" data-archetype="luxury-product-page">
  <GalleryHeroContract product="inspectable object" />
  <MaterialSpecRowContract specs={["origin", "finish", "care"]} />
  <QuietPurchaseBarContract price="$1,280" action="Reserve" />
  <CraftProcessSequenceContract steps={["Source", "Shape", "Finish"]} />
</main>

// Premium Service Narrative
<main data-skill="high-end-design" data-archetype="premium-service-narrative">
  <EditorialProductCardContract title="Private consultation" meta="duration, location, outcome" />
  <ConciergeFormContract fields={["date", "budget", "project"]} />
  <ChapterImageContract caption="material proof, not mood filler" />
</main>
```
```tsx
// Luxury Product Page
<main data-skill="high-end-design" data-archetype="luxury-product-page">
  <GalleryHeroContract product="inspectable object" />
  <MaterialSpecRowContract specs={["origin", "finish", "care"]} />
  <QuietPurchaseBarContract price="$1,280" action="Reserve" />
  <CraftProcessSequenceContract steps={["Source", "Shape", "Finish"]} />
</main>

// Premium Service Narrative
<main data-skill="high-end-design" data-archetype="premium-service-narrative">
  <EditorialProductCardContract title="Private consultation" meta="duration, location, outcome" />
  <ConciergeFormContract fields={["date", "budget", "project"]} />
  <ChapterImageContract caption="material proof, not mood filler" />
</main>
```
High-end motion is paced and tactile. It should feel like a lens opening, a material being revealed, a drawer sliding, or a gallery chapter changing.

Use:
- slow image crop reveal
- inner product scale from `.98` to `1`
- material swatch selection
- quiet underline draw
- gallery crossfade
- purchase bar entrance
- panel slide for specs or concierge

Avoid:
- constant loops
- bounce/spring playfulness unless the product brand demands it
- large parallax over readable copy
- motion that delays purchase or form completion
- filter-heavy blur as a luxury substitute

CSS primitive:

```css
[data-hed-motion="material-reveal"] {
  transition:
    transform 520ms cubic-bezier(.16, 1, .3, 1),
    opacity 520ms cubic-bezier(.16, 1, .3, 1),
    clip-path 620ms cubic-bezier(.16, 1, .3, 1),
    filter 240ms ease;
  will-change: transform, clip-path;
}

[data-hed-motion="material-reveal"]:is(:hover, :focus-visible, [data-active="true"]) {
  transform: scale(1.018);
  filter: brightness(1.03) contrast(1.02);
}

[data-hed-motion="underline"] {
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0 1px;
  background-position: 0 100%;
  background-repeat: no-repeat;
  transition: background-size 180ms ease;
}

[data-hed-motion="underline"]:is(:hover, :focus-visible) {
  background-size: 100% 1px;
}

@keyframes hed-crop-in {
  from { opacity: 0; transform: scale(.97); clip-path: inset(8% 6% 8% 6%); }
  to { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); }
}

@media (prefers-reduced-motion: reduce) {
  [data-hed-motion] {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    clip-path: none !important;
    filter: none !important;
  }
}
```

Motion by archetype:
- Precision object gallery: product crop reveal, swatch selection, no loops.
- Engineered monochrome: square panel slide, image-to-spec transition, crisp focus.
- Performance machinery: fast but controlled mask reveal, red indicator state, no fake speed trails.
- Architectural parchment: chapter reveal, before/after slider, plan line draw.
- Premium gear commerce: tab indicator, search focus, product image hover, purchase bar.


## Copy Guidance

High-end copy should be concrete, exact, and calm.

Prefer:
- "Hand-finished aluminum body"
- "Available in natural oak, black ash, and walnut"
- "Reserve a private studio appointment"
- "Ships in 3-5 business days"
- "Lifetime repair program"
- "Compare dimensions"
- "View material samples"
- "Commission a staging plan"

Avoid:
- "Unparalleled luxury"
- "Elevate your lifestyle"
- "Exclusive excellence"
- "Indulge in sophistication"
- "Timeless elegance" without proof
- "Limited" when there is no real limit

## Accessibility And Production

- Contrast must be real, especially on dark photography.
- Do not put essential text over busy images on mobile.
- Product images need alt text that identifies the object and relevant material/state.
- Controls need visible labels, not placeholder-only fields.
- Focus states must not disappear into dark or photographic backgrounds.
- Sticky bars must respect safe areas and not cover form fields.
- Large images need stable dimensions to avoid layout shift.
- Lazy-loaded galleries still need skeleton/fallback states.
- Currency, size, availability, and lead time must be readable and localizable.
- Reduced motion must preserve all content and states.

## Failure Corrections

If it looks like fake luxury:
- Remove gold, heavy blur, ornamental gradients, and generic black sections.
- Add product/material proof.
- Improve type hierarchy and spacing.
- Use a stricter radius and surface system.

If it hides the product:
- Replace atmospheric crops with inspectable images.
- Add detail views, material rows, and captions.
- Move text off the object if it obscures inspection.

If conversion is too timid:
- Add a visible purchase/reserve/inquiry route.
- Use a quiet sticky bar.
- Clarify price, lead time, or next step.
- Give CTAs stronger contrast while keeping refined geometry.

If it feels too plain:
- Strengthen material cues.
- Add a gallery chapter or closeup.
- Use a more decisive geometry signature.
- Improve captions and spec density.

If it feels cluttered:
- Remove duplicate CTAs.
- Increase section rhythm.
- Simplify color and material tokens.
- Convert decorative cards into rows, bands, or galleries.

## Absolute Bans

- Refero anti-dilution: do not soften Spacelab zero-radius into generic luxury cards; do not mix Sequel grayscale with Revenuecat violet-blue as equal CTAs.
- Do not add shadows except explicit Revenuecat proof elevation.

- No gold cliches, fake scarcity, generic black luxury pages, or excessive blur.
- No product page where the object cannot be inspected.
- No illegible tiny type used as sophistication.
- No mood-only hero when the user needs product or service clarity.
- No nested cards or page sections styled as floating cards.
- No decorative material names without material proof.
- No hidden focus states.
- No CTA copy that hides what happens next.
- No default browser blue links unless the brand explicitly uses that color.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.

## Pre-Output Checklist

- First viewport contains a real material/product/gallery proof.
- One High-End Design archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to refined image/material reveal and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
