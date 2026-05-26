---
name: expressive-brand
description: "Use this skill to create expressive brand systems for distinctive websites, product pages, SaaS launches, consumer products, fintech, AI tools, developer platforms, campaigns, portfolios, and identity-led interfaces where typography, color, motif, copy voice, components, motion, and product proof form a repeatable brand language. USE FOR: brand-heavy launches, consumer products, expressive SaaS, campaign pages, identity-led interfaces, product proof with voice/motif. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Expressive Brand

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Expressive Brand archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, brand motif plus product, campaign, character, or object proof, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Expressive Brand components with states.
7. **Motion plan:** brand behavior loop, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Create a design system that feels specific to the product, not merely colorful. An expressive brand succeeds when the same idea appears in the hero, navigation, copy, card geometry, proof objects, interaction states, and motion. If the logo disappeared, the interface should still feel identifiable.

Use expressive brand work for brand-heavy pages, consumer products, launches, creative studios, fintech, AI tools, developer platforms, and SaaS that needs a point of view. Do not use it to hide vague content. Personality must make the product easier to understand and remember.


For substantial UI work, begin with a compact `<design_plan>`:

1. Use case, audience, primary action, and trust level.
2. Brand equation: category + audience emotion + visual lever + repetition rule.
3. Expressiveness level: accent, system, or world.
4. Source archetype and any supporting archetype.
5. First viewport: navigation, H1 line strategy, proof object, CTA treatment, next-section hint.
6. Token contract: type, canvas, accent role, surface, radius, spacing, motif, state colors.
7. Component plan: at least four signature components with states.
8. Motion plan with reduced-motion behavior.
9. Anti-slop sweep: three likely failure modes and how the implementation will avoid them.

For small tasks, keep this plan internal and act from it.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium. Let brand moments breathe, then support with clear product sections. |
| motion | Medium-high. Brand behaviors can animate if they support memory and navigation. |
| decoration | Medium-high but systematic. |
| contrast | Confident color contrast with semantic accents. |
| radius | Defined by brand: can be sharp, pill, blob, or modular, but consistent. |
| type | Distinct display face plus readable sans. |
| assets | Brand motifs, product imagery, campaign art, icon systems, character or object libraries. |

## Signature System

- Brand Behavior Loop: one motif repeats in hero, cards, transitions, cursor/hover, and footer.
- Personality With Product Proof: brand energy surrounds concrete product views or scenarios.
- Copy As Interface: button labels, filters, and section titles should carry voice without becoming unclear.
- Controlled Variety: colorful sections can differ, but layout logic and geometry stay connected.

## Differentiation

Use Expressive Brand when brand-heavy sites, consumer products, creative launches, expressive agencies, campaigns, identity systems. If removing the brand motif plus product proof, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `vibrant-accents` when color is the main system; use `playful-design` when tactility, reward, or game logic drives behavior.

### Execution Token Contract

Refero ready-to-use deltas from SVZ/Datalands/Discord:
- Token roles: SVZ black/red `#000000/#080808/#171617/#262525/#393939/#fcfcfc/#f3efef/#ff0000`; Datalands `#000000/#ffffff/#111212/#f3f3ef/#fc74dd/#122d8b/#94bcee/#ff4c33`; Discord `#5865f2/#3442d9/#23272a/#2c2f33/#57f287/#de2761`.
- Type roles: SVZ Kmr Waldenburg/Dirtyline large red type, Datalands OZIK Black up to 358px, Discord ABC Ginto Nord 36-61px all-caps.

Every Expressive Brand build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #fff7ed;
  --surface: #ffffff;
  --surface-muted: #ffe8d6;
  --text: #171312;
  --text-muted: #705f58;
  --line: #f4c7aa;
  --action: #ff4b7d;
  --action-strong: #111111;
  --radius-control: 999px;
  --radius-card: 18px;
  --radius-panel: 28px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Recoleta", "Fraunces", var(--font-sans);
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
  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04);
  --shadow-panel: 0 18px 60px rgba(255,75,125,.18);
  --shadow-hero: 0 40px 110px rgba(255,75,125,.24);
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
  --status-neutral-fg: #705f58;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --tilt: var(--surface-muted);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Expressive Brand token |
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

Token rule: if a value can be expressed by `eb`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Brand Equation

Use this as the decision frame:

```txt
Brand voice = product category + audience emotion + visual lever + repetition rule
```

Examples:

```txt
Family = finance + approachability + illustrated characters + cream storybook repetition
mymind = private memory + reflection + serif/orange editorial voice + dots/labels/card tints
Antimetal = infrastructure + urgency + electric signal + dark-to-light product transition
Empower = finance + confidence + condensed type/yellow action + dark utility contrast
Retool = developer tools + craft + warm obsidian material + slab/pill shape grammar
```

If the equation is incomplete, fix it before designing. Without category the page is pretty but irrelevant. Without emotion it is cold. Without a visual lever it is generic. Without repetition it is random.

## Levels Of Expressiveness

### Level 1: Accent Expression

Use one memorable element while the product remains conservative.

- Good for dense SaaS, compliance-heavy products, enterprise audiences.
- Moves: a chartreuse CTA, orange nav dot, warm off-white canvas, special label style, distinctive focus ring.
- Requirement: the accent has one job and appears in at least three places.

### Level 2: System Expression

Coordinate several levers into a recognizable identity.

- Good for launch pages, B2B product marketing, AI tools, fintech, creative SaaS.
- Moves: serif display + uppercase labels + pastel cards; dark hero + light dashboard; warm black + compressed type + slabs.
- Requirement: the same type, color, radius, and surface rules govern real product components.

### Level 3: World Expression

Build a full visual world.

- Good for consumer products, communities, creative brands, campaign pages, family products.
- Moves: character systems, product objects, recurring props, branded transitions, custom hero composition.
- Requirement: illustration or objects have anatomy, placement rules, color limits, and states. They cannot be random stickers.

## Source Archetypes

Choose one primary archetype. Do not average all of them into a bland center.

### Additional Refero Source Packs

- SVZ dark red brand type: black ramp `#000000/#080808/#171617/#262525/#393939`, whites `#fcfcfc/#f3efef`, signal red `#ff0000`; 48px sections; radii 3/8/14.4px; use inset shadow only. Brand expression comes from red-as-state plus type mass, not illustration.
- Datalands vivid dark punctuation: `#000000/#ffffff/#111212/#f3f3ef/#3d3d3d/#d9d9d9/#1d1a1a`, primary `#fc74dd`, accents `#122d8b/#94bcee/#ff4c33`; OZIK Black hero up to 358px `-0.01em`, Martian Mono 18px; controls 96px radius with 48px vertical and 36px horizontal padding.
- Discord brand stage: `#5865f2/#3442d9/#23272a/#2c2f33/#99aab5/#babcd9/#57f287/#de2761`; ABC Ginto Nord Discord 700/800 all-caps 36-61px `-0.01em`; 80-120px section rhythm, 32-48px panels, 12/16px buttons, 104px pills. Use color as brand cast members with assigned roles.

- Moderne/Home expressive tech: `#0e1889/#ff7e85/#ff7399/#206871/#f3eae5/#ffffff`; Mabry Pro 16-83px with `0.2000em` tracking, Helvetica Neue UI; 4px base, 1200px max, 120px sections, 20px cards; radius 4px, large cards 15px; peach CTA, muted rose ghost, orange/teal brand cards.
- FORA warm brand editorial: `#ffffff/#000000/#a9553c/#a04d35/#ddbdea/#ffffff59`; Theinhardt 15/18/23/35px with tracking 0.36-0.46px; 6px base, 25px card padding; 0px blocks, 5px secondary, 9999px tags.
- Tella video-brand system: violet `#5e51f8`, dark gradient `#27154c -> #181127`, lavender `#cfcbfd/#d7d3fd`, ink `#111111`, light `#f8fafc`; NaN Jaune Midi Bold 56/64/84px with `-0.054em/-0.047em/-0.036em`, Inter UI; 8px base, 96px sections, 24px cards, 40px buttons, 24/32px cards.
- ORYZO AI organic identity: `#100904/#ffedd7/#dc5000/#445231/#382416`, rainbow spectrum gradient; halyard variable 10-410px, Literata, DM Mono; 45px sections, 18px cards/gaps; cards 12px, buttons/badges 36px.
- Geniestudio polished brand SaaS: `#181d27/#fafdff/#ebf5ff/#0a0d12/#0069e0` plus pastel gradients; Geist UI `-0.01em`, Aeonik display `-0.02em`; 8px base, 24px sections, 40px cards; radius cards/buttons 32px, badges 90px.

### Family: Illustrated Fintech Storybook

Use for approachable finance, wallets, family products, community money tools, warm consumer technical products.

| Trait | Rule |
| --- | --- |
| Hex | `#fbfaf9` canvas, `#f2f0ed` ring, `#f8f7f4` card, `#474645` body, `#343433` headings, `#121212` CTA, `#ff3e00` accent, `#00ca48`, `#0090ff`, `#ffbb26`, `#ff58ae`, `#9f4fff` illustration fills |
| Type | friendly display at 44/68px, tight tracking around `-0.031em`, Inter/system for UI |
| Radius | 10px cards, 24px product mockups, 32px pills, 72px character containers |
| Spacing | 4px base, 32px card padding, 120-180px major section gaps, 1200px max width |
| Carry forward | blob characters with stick limbs, dot eyes, simple mouths, one dominant color per character; dark pill CTA anchors the playfulness |
| Avoid | mascot stickers, pure white canvas, orange filled CTA, drop shadows everywhere, playful type in dense UI |

Implementation notes:

- Let characters flank or orbit the H1 while preserving click and text safe zones.
- Use flat inset rings instead of generic shadows.
- Product proof must be serious enough to counterbalance the friendliness.

### mymind: Private Memory Editorial

Use for knowledge tools, bookmarking, private AI, writing systems, personal productivity, reflective products.

| Trait | Rule |
| --- | --- |
| Hex | `#ff5924` orange, orange-to-peach gradient, `#1573dd` rare link, `#000000`, `#24272d`, `#3a475a`, `#4a5465`, `#717286`, `#748297`, `#f9fafc`, `#ffffff`, `#e5eaf2`, `#f3f0e7`, `#dde9d3` |
| Type | Louize-like editorial serif for display; Open Sans-like UI; Nunito-like uppercase labels with positive tracking |
| Radius | 12-16px screenshot frames, modest cards, thin borders |
| Spacing | quiet editorial spacing, enough room for product frames and manifesto bands |
| Carry forward | orange dots, orange eyebrows, outline buttons, warm atmospheric blooms, pastel card surfaces |
| Avoid | filled orange CTA, many saturated colors, generic sans-only page, heavy shadows, fast mechanical motion |

Implementation notes:

- Orange is an identity thread, not a paint bucket.
- Pair emotional claims with clean product screenshot frames.
- A dark manifesto band can work once if the transition feels intentional.

### Antimetal: Electric Infrastructure Signal

Use for infrastructure, devops, observability, cloud cost, security, technical AI.

| Trait | Rule |
| --- | --- |
| Hex | `#001033` hero, `#1b2540` structural ink, navy/electric/cyan gradient, `#d0f100` CTA, `#e0f6ff` hero strokes, `#f8f9fc` product background, `#ffffff` cards, `#596075`, `#6b7184`, `#7c8293`, `#b1b5c0` |
| Type | technical sans for UI, crafted serif for 32px+ display, tight tracking |
| Radius | 9999px buttons, 6/16/20px cards, compact technical radii |
| Spacing | 4px base, 20px card padding, 80px section gaps, compact density |
| Carry forward | one dark electric hero, one chartreuse action, dot-matrix globe/network visual, immediate light product proof |
| Avoid | chartreuse decoration, multiple dark bands, black shadows, non-pill buttons, cyber-neon overload |

Implementation notes:

- Concentrate drama in the first view and transition quickly into readable product evidence.
- Chartreuse is primary action only.
- Use blue-tinted rings/shadows, not generic black elevation.

### Empower: Bold Finance Utility

Use for finance, banking, payroll, benefits, insurance, consumer financial confidence.

| Trait | Rule |
| --- | --- |
| Hex | `#100f0f`, `#171616`, `#262525`, `#64635c`, `#fffdf6`, `#ffffff`, `#e4e24e`, `#faf9b6` |
| Type | condensed/expanded finance display, huge 72-96px+ moments, direct UI sans |
| Radius | 16px modules, 24px cards, pill-like primary buttons |
| Spacing | 8px base, 24px card padding, comfortable dark/light sections |
| Carry forward | yellow primary action, giant type voice, dark-to-light trust rhythm, rounded dark cards |
| Avoid | extra saturated accents, low-contrast yellow text, generic headlines, decorative clutter, heavy shadows |

Implementation notes:

- Yellow is action fill, not body copy.
- The directness is the personality. Do not add mascots to soften it unless the brand explicitly needs that.
- Large type must be backed by concrete financial utility claims.

### Retool: Warm Obsidian Workshop

Use for developer platforms, workflow builders, internal tools, technical brands that need craft.

| Trait | Rule |
| --- | --- |
| Hex | `#151515` canvas, `#0e0e0e` receding layer, `#242424` slab, `#3f403d` border, `#8b867f`, `#94958e`, `#b6b8af`, `#cbccc4`, `#e9ebdf`, `#185849`, `#0e352c` |
| Type | light compressed sans at 60-72px, weights 300-400, labels 12-14px with positive tracking |
| Radius | 4px badges, 8-12px cards, 9999px pill CTAs, 0px square secondary buttons |
| Spacing | 4px base, 24px card padding, 80-120px gaps, 1200px max width |
| Carry forward | warm black material, parchment text, no-shadow slabs, binary radius grammar, rare shimmer highlight |
| Avoid | pure black, cyber neon, saturated UI chrome, heavy shadows, generic bold Inter, mixed radii |

Implementation notes:

- Expression comes from material and type, not many colors.
- Use teal/amber as atmospheric washes only.
- Keep product builder panels visible and credible.

## Brand Motifs And Repetition

Pick one motif, then repeat it across scales.

| Motif | Hero | Components | Micro UI | Motion |
| --- | --- | --- | --- | --- |
| Character system | figures flank claim | character badges/cards | avatar states, help hints | idle float, celebration, wink |
| Dot/signal | network/globe/dots | status cards, progress nodes | nav dots, bullets, focus ring | pulse, scan, reveal |
| Editorial mark | serif headline and orange mark | quote cards, labels | eyebrows, inline markers | slow underline, fade-up |
| Bold utility | huge condensed claim | yellow CTA/cards | price badges, state chips | confident snap, press |
| Workshop material | warm dark slabs | panels, integration blocks | labels, corners, dividers | shimmer, slab reveal |

Motif rules:

- Define anatomy: stroke, fill, radius, shadow, placement, and allowed colors.
- Repeat the motif in navigation or footer, not just the hero.
- Keep motif away from form errors, pricing, legal text, and destructive actions unless it clarifies state.
- If motif and proof fight, simplify motif before weakening product proof.

## Voice Tokens

Copy is part of the interface. Define voice tokens before writing labels.

| Voice Token | Use | Example Tone | Avoid |
| --- | --- | --- | --- |
| Plain action | CTAs, checkout, forms | "Start saving", "Create workflow", "Book a demo" | cute ambiguity |
| Brand marker | section labels, empty states | "Signal", "Memory", "Workshop", "Pocket" | vague "Experience" labels |
| Proof noun | product screenshots, cards | "Wallet", "Inbox", "Dashboard", "Builder", "Policy" | abstract benefits only |
| Micro warmth | helper text, success | "Saved to your library." | jokes in serious flows |
| Trust language | finance/security/devtools | "SOC 2", "read-only", "encrypted", "audit log" | burying trust behind visuals |

Voice constraints:

- Use short domain nouns in H1s and CTAs.
- Let labels carry personality only when the action remains obvious.
- Avoid generic startup phrases, vague magic language, and invented nouns that users must decode.
- Serious actions stay plain even inside expressive systems.

## First Viewport Protocol

Refero layout deltas:
- SVZ: 48px sections, 3/8/14.4px radii, red-as-state plus type mass.
- Datalands: 80px sections, 48px cards, 96px control radius, large type as primary brand object.
- Discord: 80-120px section rhythm, 32-48px panels, 12/16px buttons, 104px pills; color roles act like brand characters.

The first viewport must communicate identity and value together.

- Navigation uses the same geometry as the system: dot nav, pill nav, slab nav, editorial nav, or direct utility nav.
- H1 names the product category or literal offer. Keep desktop H1 to 2-3 lines unless intentionally poster-like.
- Proof object is visible: product screen, card stack, workflow, device, character scene tied to the domain, data panel, marketplace grid, or customer artifact.
- CTA has one primary treatment and one quieter secondary treatment if needed.
- Bottom of viewport reveals the next proof band so the page does not feel like a poster only.
- Mobile preserves the brand motif without overlapping text, CTAs, or proof.

## Component Arsenal

Refero component deltas:
- SVZ: red signal CTA/states, inset shadow only, dark card geometry 3/8/14.4px.
- Datalands: pink CTA `#fc74dd`, 96px buttons/inputs, Martian Mono data input.
- Discord: blurple CTA, stage panels, green/red status accents, 104px social pills.
- State transfer: SVZ action/error emphasis is `#ff0000`; Datalands primary/active is `#fc74dd` with support `#122d8b/#94bcee/#ff4c33`; Discord hover/active shifts `#5865f2 -> #3442d9` and keeps success/error `#57f287/#de2761`.

Use at least four components for full-page work. Give each real content and states.

### Refero Expansion Component Deltas

- Brand components must preserve source geometry: Moderne 4/15px, FORA 0/5/9999px, Tella 24/32/40px, ORYZO 12/36px, Geniestudio 32/90px. Geometry is part of the brand motif.
- CTA color is the identity anchor: Moderne peach, FORA terracotta, Tella violet/dark pill, ORYZO rust/bark, Geniestudio blue/dark rounded CTA. Use secondary colors as cards, tags, or illustration fills only.
- Custom type is mandatory for distinctiveness when specified: Mabry Pro, Theinhardt, NaN Jaune Midi, halyard/Literata, Geist/Aeonik. Do not collapse these into generic Inter unless matching an existing product DS.

| Component | Purpose | Brand Behavior |
| --- | --- | --- |
| `BrandMotifHero` | first impression and proof object | repeats primary motif around H1/product |
| `VoiceCTA` | primary action cluster | action color, voice token, loading/success states |
| `ProofFrame` | screenshot, device, workflow, dashboard | brand-specific frame, radius, border/elevation |
| `MotifCardGrid` | features/use cases | card color/radius/motif pattern repeats |
| `SignalNav` | navigation and active states | dot/pill/slab/label brand micro detail |
| `CharacterOrObjectSystem` | emotional proof | consistent anatomy, placement, state |
| `ModeTransitionBand` | dark-to-light or editorial-to-product shift | one token bridges modes |
| `ExpressiveFooter` | closure | repeats motif, real nav, CTA, contact/trust |

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type ExpressiveBrandState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type ExpressiveBrandStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function ExpressiveBrandStatusPill({ role, children }: { role: ExpressiveBrandStatus; children: React.ReactNode }) {
  return <span className="expressive-brand-status-pill" data-role={role}>{children}</span>;
}

export function BrandMotifHeroContract({ state = "default" }: { state?: ExpressiveBrandState }) {
  return <section className="expressive-brand-hero-object" data-state={state} aria-label="Expressive Brand proof object" />;
}

export function VoiceDrivenCtaContract({ title, meta, state = "default" }: { title: string; meta: string; state?: ExpressiveBrandState }) {
  return <article className="expressive-brand-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function ColorCodedCardSystemContract({ items }: { items: string[] }) {
  return <nav className="expressive-brand-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function ExpressiveBrandSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="expressive-brand-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.expressive-brand-status-pill {
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
.expressive-brand-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.expressive-brand-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.expressive-brand-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.expressive-brand-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.expressive-brand-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.expressive-brand-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.expressive-brand-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.expressive-brand-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.expressive-brand-card[data-state="error"] { border-color: var(--status-danger-fg); }
.expressive-brand-card > span { font: var(--type-meta); color: var(--text-muted); }
.expressive-brand-card > strong { font: var(--type-card); color: var(--text); }
.expressive-brand-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.expressive-brand-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.expressive-brand-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.expressive-brand-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.expressive-brand-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.expressive-brand-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.expressive-brand-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .expressive-brand-hero-object { min-height: 280px; }
  .expressive-brand-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
## Signature Components

### BrandMotifHero

Use for a page or campaign hero.

TSX:

```tsx
type BrandMotifHeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  primaryAction: string;
  secondaryAction?: string;
  proof: React.ReactNode;
  motif: React.ReactNode;
};

export function BrandMotifHero({
  eyebrow,
  title,
  body,
  primaryAction,
  secondaryAction,
  proof,
  motif
}: BrandMotifHeroProps) {
  return (
    <section className="brand-hero" data-expression="system">
      <nav className="brand-nav" aria-label="Primary">
        <a className="brand-mark" href="/">Signal</a>
        <div className="brand-nav__links">
          <a href="/work">Work</a>
          <a href="/security">Security</a>
          <a href="/pricing">Pricing</a>
        </div>
      </nav>
      <div className="brand-hero__grid">
        <div className="brand-hero__copy">
          <p className="brand-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{body}</p>
          <div className="brand-hero__actions">
            <button className="brand-btn brand-btn--primary" type="button">
              <span>{primaryAction}</span>
            </button>
            {secondaryAction ? (
              <button className="brand-btn brand-btn--secondary" type="button">
                {secondaryAction}
              </button>
            ) : null}
          </div>
        </div>
        <div className="brand-hero__stage">
          <div className="brand-hero__motif" aria-hidden="true">{motif}</div>
          <div className="brand-proof-frame">{proof}</div>
        </div>
      </div>
    </section>
  );
}
```

CSS:

```css
:root {
  --brand-canvas: #fbfaf9;
  --brand-ink: #121212;
  --brand-body: #474645;
  --brand-surface: #f8f7f4;
  --brand-ring: #f2f0ed;
  --brand-accent: #ff5924;
  --brand-radius-card: 10px;
  --brand-radius-large: 24px;
  --brand-radius-pill: 999px;
  --brand-shadow-ring: inset 0 0 0 1px var(--brand-ring);
  --brand-ease: cubic-bezier(.16, 1, .3, 1);
}

.brand-hero {
  min-height: 100svh;
  overflow: hidden;
  padding: clamp(18px, 3vw, 32px);
  background: var(--brand-canvas);
  color: var(--brand-ink);
}

.brand-nav,
.brand-hero__grid,
.brand-hero__actions {
  display: flex;
  align-items: center;
}

.brand-nav {
  justify-content: space-between;
  gap: 24px;
  min-height: 56px;
}

.brand-nav a {
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.brand-mark::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--brand-accent);
}

.brand-nav__links {
  display: flex;
  gap: clamp(12px, 2vw, 28px);
}

.brand-hero__grid {
  width: min(100%, 1200px);
  margin: clamp(64px, 10vw, 130px) auto 0;
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(320px, 1.08fr);
  gap: clamp(32px, 6vw, 80px);
}

.brand-eyebrow {
  color: var(--brand-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.brand-hero h1 {
  max-width: 11ch;
  margin: 0;
  font-family: var(--font-display, Fraunces, Georgia, serif);
  font-size: clamp(48px, 8vw, 88px);
  line-height: 1.02;
  letter-spacing: 0;
  text-wrap: balance;
}

.brand-hero__copy > p:not(.brand-eyebrow) {
  max-width: 58ch;
  color: var(--brand-body);
  font-size: 17px;
  line-height: 1.6;
}

.brand-hero__actions {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.brand-btn {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: var(--brand-radius-pill);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms var(--brand-ease), background 180ms ease, border-color 180ms ease;
}

.brand-btn--primary {
  background: var(--brand-ink);
  color: #ffffff;
}

.brand-btn--secondary {
  background: var(--brand-surface);
  color: var(--brand-ink);
  box-shadow: var(--brand-shadow-ring);
}

.brand-btn:hover { transform: translateY(-2px); }
.brand-btn:active { transform: translateY(0); }
.brand-btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--brand-accent), white 40%); outline-offset: 3px; }
.brand-btn:disabled { cursor: not-allowed; filter: grayscale(.45); opacity: .55; transform: none; }
.brand-btn[data-loading="true"] { cursor: progress; }
.brand-btn[data-success="true"] { background: #00ca48; color: #121212; }
.brand-btn[data-error="true"] { background: #fff1f1; color: #8a1f11; border-color: #8a1f11; }

.brand-hero__stage {
  position: relative;
  min-height: 420px;
}

.brand-proof-frame {
  position: relative;
  overflow: hidden;
  border-radius: var(--brand-radius-large);
  background: #ffffff;
  box-shadow: var(--brand-shadow-ring);
}

.brand-hero__motif {
  position: absolute;
  inset: -32px -24px auto auto;
  max-width: 180px;
  pointer-events: none;
}

@media (max-width: 780px) {
  .brand-nav__links { display: none; }
  .brand-hero__grid { grid-template-columns: 1fr; margin-top: 48px; }
  .brand-hero h1 { max-width: 100%; font-size: clamp(40px, 15vw, 60px); overflow-wrap: anywhere; }
  .brand-hero__stage { min-height: 300px; }
  .brand-hero__motif { opacity: .55; transform: scale(.75); }
}
```

States:

- Idle: clear hierarchy and motif visible.
- Hover: small lift or accent edge only.
- Focus-visible: thick, high-contrast ring tied to brand accent.
- Active: press returns toward rest.
- Loading: progress cursor, label swap or spinner, no layout shift.
- Empty: show next useful action and proof placeholder.
- Error: clear recovery text; do not rely only on red.
- Success: brand-compatible confirmation, not generic confetti unless world expression warrants it.

### VoiceCTA

Use for primary conversion clusters, forms, signup, request demo, checkout.

TSX:

```tsx
type CTAState = "idle" | "loading" | "success" | "error" | "disabled";

export function VoiceCTA({ state = "idle" as CTAState }) {
  const label = {
    idle: "Start building",
    loading: "Creating workspace",
    success: "Workspace ready",
    error: "Try again",
    disabled: "Unavailable"
  }[state];

  return (
    <div className="voice-cta" data-state={state}>
      <div>
        <p className="voice-cta__label">Private by design</p>
        <h3>Turn saved work into a living product library.</h3>
      </div>
      <button disabled={state === "disabled"} aria-busy={state === "loading"}>
        {label}
      </button>
      {state === "error" ? <p role="alert">Check the workspace name and retry.</p> : null}
    </div>
  );
}
```

CSS:

```css
.voice-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--brand-ink), transparent 82%);
  border-radius: var(--brand-radius-card);
  background: var(--brand-surface);
}

.voice-cta__label {
  margin: 0 0 6px;
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.voice-cta h3 {
  margin: 0;
  font-size: clamp(22px, 3vw, 34px);
  line-height: 1.1;
}

.voice-cta button {
  min-height: 44px;
  border: 0;
  border-radius: var(--brand-radius-pill);
  padding: 0 18px;
  background: var(--brand-ink);
  color: white;
  font-weight: 700;
}

.voice-cta[data-state="success"] { border-color: #00ca48; background: #eafbe9; }
.voice-cta[data-state="error"] { border-color: #a63a2a; background: #fff4f1; }
.voice-cta[data-state="loading"] { opacity: .78; }

@media (max-width: 620px) {
  .voice-cta { grid-template-columns: 1fr; }
  .voice-cta button { width: 100%; }
}
```

### ProofFrame

Use for screenshots, cards, dashboards, device renders, or workflow panels.

Rules:

- Expressive frame must match archetype: cream ring, editorial border, blue-tinted shadow, dark slab, or finance card.
- Screenshot content remains readable; never shrink product proof into decorative texture.
- Use `aspect-ratio` to stabilize layout.
- Include empty, loading, and error shells for apps.

CSS:

```css
.proof-frame {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--frame-radius, 16px);
  background: var(--frame-bg, #ffffff);
  border: 1px solid var(--frame-border, rgba(0, 0, 0, .12));
}

.proof-frame[data-variant="storybook"] {
  --frame-radius: 24px;
  --frame-bg: #ffffff;
  --frame-border: #f2f0ed;
}

.proof-frame[data-variant="infra"] {
  --frame-radius: 20px;
  --frame-bg: #ffffff;
  --frame-border: rgba(0, 39, 80, .08);
  box-shadow: 0 40px 80px -24px rgba(0, 39, 80, .22);
}

.proof-frame[data-variant="workshop"] {
  --frame-radius: 8px;
  --frame-bg: #242424;
  --frame-border: #3f403d;
}
```

### MotifCardGrid

Use for feature grids and use cases.

TSX:

```tsx
const cards = [
  { tone: "orange", title: "Shared wallets", body: "Invite family members with spending limits and clear approvals." },
  { tone: "blue", title: "Live rules", body: "See which automation changed a cost, route, or permission." },
  { tone: "yellow", title: "Action history", body: "Review every decision with timestamped context." }
];

export function MotifCardGrid() {
  return (
    <div className="motif-grid">
      {cards.map((card) => (
        <article className="motif-card" data-tone={card.tone} tabIndex={0} key={card.title}>
          <span className="motif-card__mark" aria-hidden="true" />
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </article>
      ))}
    </div>
  );
}
```

CSS:

```css
.motif-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.motif-card {
  min-height: 220px;
  padding: 28px;
  border-radius: var(--brand-radius-card);
  background: var(--brand-surface);
  box-shadow: var(--brand-shadow-ring);
  transition: transform 220ms var(--brand-ease), background 220ms ease;
}

.motif-card__mark {
  display: block;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: var(--tone, #ff5924);
}

.motif-card[data-tone="orange"] { --tone: #ff5924; }
.motif-card[data-tone="blue"] { --tone: #0090ff; }
.motif-card[data-tone="yellow"] { --tone: #ffbb26; }

.motif-card:hover,
.motif-card:focus-visible {
  transform: translateY(-4px) rotate(var(--tilt, -.4deg));
  outline: 0;
  background: #ffffff;
}

@media (max-width: 780px) {
  .motif-grid { grid-template-columns: 1fr; }
  .motif-card { min-height: 0; }
}
```

## Motion System

Refero motion delta:
- No source-specific durations were observed for SVZ/Datalands/Discord here. Use existing expressive-brand timing; animate motif repetition, color state, and staged overlap only.

- Expressive brand motion should reinforce the motif: 180-320ms for controls, 300-600ms for motif reveal, 600-1000ms for ambient spectrum only when ORYZO/Tella-like. Reduced motion keeps the final motif composition, CTA contrast, and selected states static.

## Complete Page Protocols

```tsx
// Consumer Brand World
<main data-skill="expressive-brand" data-archetype="consumer-brand-world">
  <BrandMotifHeroContract state="selected" />
  <VoiceDrivenCtaContract title="Start the ritual" meta="plain action, brand voice" />
  <ObjectGalleryContract items={productCharactersOrProps} />
  <PersonaTestimonialContract persona="Owner" quote="Concrete product proof in brand language." />
</main>

// Campaign System
<main data-skill="expressive-brand" data-archetype="campaign-system">
  <CampaignStripContract items={["Signal", "Proof", "Offer"]} />
  <ColorCodedCardSystemContract items={["Audience", "Benefit", "Moment"]} />
  <ExpressiveFooterContract motif="repeat, do not decorate randomly" />
</main>
```
```tsx
// Consumer Brand World
<main data-skill="expressive-brand" data-archetype="consumer-brand-world">
  <BrandMotifHeroContract state="selected" />
  <VoiceDrivenCtaContract title="Start the ritual" meta="plain action, brand voice" />
  <ObjectGalleryContract items={productCharactersOrProps} />
  <PersonaTestimonialContract persona="Owner" quote="Concrete product proof in brand language." />
</main>

// Campaign System
<main data-skill="expressive-brand" data-archetype="campaign-system">
  <CampaignStripContract items={["Signal", "Proof", "Offer"]} />
  <ColorCodedCardSystemContract items={["Audience", "Benefit", "Moment"]} />
  <ExpressiveFooterContract motif="repeat, do not decorate randomly" />
</main>
```
Motion must express the chosen brand lever.

| Archetype | Motion | Use | Reduced Motion |
| --- | --- | --- | --- |
| Family | character float, small stamp, prop orbit | hero motif, success state, card hover | static character positions, color state only |
| mymind | slow label reveal, warm underline, image fade | reflective sections, saved states | immediate reveal, underline visible |
| Antimetal | signal scan, dot reveal, dashboard lift | hero network and product proof | static network, no scan |
| Empower | confident snap, button press, section switch | CTA and dark/light transitions | instant switch, outline state |
| Retool | slab reveal, rare shimmer, material lift | product builder, phrase highlight | no shimmer, visible static highlight |

CSS primitive:

```css
[data-brand-motion] {
  transition:
    transform 240ms cubic-bezier(.16, 1, .3, 1),
    opacity 240ms cubic-bezier(.16, 1, .3, 1),
    background-color 180ms ease,
    border-color 180ms ease,
    filter 180ms ease;
}

[data-brand-motion="stamp"]:is(:hover, :focus-visible) {
  transform: translateY(-3px) rotate(-1deg);
}

[data-brand-motion="signal"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(208, 241, 0, .32), transparent);
  transform: translateX(-120%);
  animation: brand-signal-scan 2200ms cubic-bezier(.16, 1, .3, 1) infinite;
}

@keyframes brand-signal-scan {
  0% { transform: translateX(-120%); }
  45%, 100% { transform: translateX(120%); }
}

@keyframes character-idle {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
}

@media (prefers-reduced-motion: reduce) {
  [data-brand-motion],
  [data-brand-motion]::before,
  [data-brand-motion]::after {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
  }
}
```

GSAP guidance:

- Use GSAP only if already present or if the task asks for cinematic motion.
- Use one scroll reveal family, not many.
- Do not pin huge sections on mobile unless tested.
- Kill ScrollTriggers on cleanup in React.
- Final state must be readable without animation.


## Absolute Bans

- Refero anti-dilution: do not combine SVZ red, Datalands pink/blue/red, and Discord blurple as one palette; choose one brand equation.
- Do not soften SVZ into pastel cards or reduce Datalands/Discord type to generic sans headings.

- No decoration without brand logic.
- No personality that obscures the primary CTA.
- No generic playful copy for serious product flows.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Accessibility And Contrast

- Body text stays neutral and high contrast.
- Accent colors can be expressive, but long reading text cannot depend on them.
- Characters and props must never cover text or controls.
- Focus states must be visible on both light and dark modes.
- State cannot be communicated by color alone.
- Check yellow/chartreuse actions with dark text, not white text.
- Large display type can be expressive; small labels must be readable.

## Implementation Workflow

1. Choose archetype and expressiveness level.
2. Write brand equation.
3. Define token roles, including forbidden roles for accents.
4. Build first viewport with real proof.
5. Create at least four components with states.
6. Apply motif to navigation, cards, CTA, proof frame, and footer.
7. Add motion only where it reinforces state, sequence, or brand memory.
8. Test mobile wrapping, touch targets, and reduced motion.
9. Remove one-off colors, random radii, decorative badges, and unsupported metaphors.

## Anti-Slop

Reject:

- Random mascots, stickers, props, or blobs.
- A hero that has personality while the rest of the page becomes generic.
- Too many saturated accent colors.
- Product screenshots from another visual system.
- Generic SaaS centered hero plus three cards.
- Decorative typography in forms or dense UI.
- Weak content hidden behind motion, gradients, or illustration.
- Mixed radius logic without a brand rule.
- CTAs with unclear copy.
- Motion that moves layout or delays important actions.

Correct:

- If it is generic, strengthen the chosen archetype and the repetition rule.
- If it is noisy, reduce accent count and component variety.
- If it is decorative, add product proof and concrete nouns.
- If it is childish, make type and surfaces more mature while preserving one expressive lever.
- If it is cold, add voice tokens, warmer canvas, or a human/object motif.
- If it breaks mobile, simplify the motif and reduce display scale.

## Pre-Output Checklist

- First viewport contains a real brand motif plus product proof.
- One Expressive Brand archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to brand behavior loop and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
