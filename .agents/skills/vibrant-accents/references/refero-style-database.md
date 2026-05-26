---
name: vibrant-accents
description: |
  Vibrant Accents aesthetic for modern product websites, SaaS brands, fintech, AI tools,
  playful campaigns, and enterprise pages that need strong color without becoming chaotic.
  Use when the user asks for energetic color, punchy CTAs, expressive accents, vibrant
  gradients, bright interaction signals, colorful but modern SaaS, or a brand identity with
  memorable accent colors. This skill teaches controlled vibrance: one or two primary signals,
  strict accent roles, strong neutral anchors, readable typography, and clear component hierarchy.
  Anti-slop: rejects random rainbow palettes, neon everywhere, inaccessible contrast, generic
  blue CTAs, decorative gradients on every section, childish color blocks, and accents with no role.
version: 1.0.0
category: design-taste
tags: [vibrant-accents, color-systems, energetic-saas, gradients, bold-cta, playful-blocks, fintech-yellow, enterprise-violet, controlled-vibrance]
sources:
  - stripe.com
  - squadeasy.com
  - base44.com
  - empower.me
  - copy
---

# Vibrant Accents - Design Skill

> A skill for creating colorful, memorable, modern interfaces where bright accents have strict jobs: action, focus, brand memory, segmentation, or editorial energy. Distilled from 5 Refero-curated references: Stripe, SquadEasy, Base44, Empower, and Copy.

---

## TABLE OF CONTENTS

1. [Core Philosophy](#philosophy)
2. [When To Use This Skill](#when-to-use)
3. [The 5 Source Archetypes](#archetypes)
4. [Shared Design DNA](#shared-dna)
5. [Color Systems](#color)
6. [Typography Systems](#typography)
7. [Spacing, Shape, and Density](#spacing)
8. [Surface and Gradient Systems](#surfaces)
9. [Component Patterns](#components)
10. [Layout Patterns](#layouts)
11. [Imagery and Illustration](#imagery)
12. [Motion and Interaction](#motion)
13. [Anti-Slop Rules](#anti-slop)
14. [Decision Tree](#decision-tree)
15. [CSS Custom Property Starter](#css-starter)
16. [Tailwind v4 Starter](#tailwind)
17. [Component Recipes](#recipes)
18. [Implementation Recipes by Product Type](#product-recipes)
19. [Quality Checklist](#checklist)
20. [Prompting Guide](#prompting)
21. [Quick Reference](#quick-reference)

---

<a id="philosophy"></a>
## 1. CORE PHILOSOPHY

Vibrant Accents is not "make the page colorful." It is a color-governance system for interfaces that need energy, memorability, and brand distinctiveness while still feeling designed, readable, and useful.

The style works when the brand needs:

- a memorable action color
- stronger emotional temperature
- modern product energy
- lively marketing surfaces
- clear conversion focus
- category differentiation
- an optimistic AI/product feel
- a playful but structured identity
- a single bright spark on a dark canvas
- enterprise polish with one vivid signal

The hard part: vibrance is powerful but unstable. Without rules, it becomes visual noise. This skill gives each bright color a job.

The source set gives five poles:

| Source | Archetype | What it teaches |
| --- | --- | --- |
| Stripe | Controlled fintech gradients | Violet action plus abstract gradients on white product structure |
| SquadEasy | Playful block playground | Large flat color blocks, photo cutouts, huge type, lime CTA |
| Base44 | Soft AI gradient canvas | Pastel gradients, off-white canvas, lime/orange signals |
| Empower | Dark finance bright button | Black/dark canvas with one optimistic yellow action color |
| Copy | Enterprise violet system | Muted light surfaces with one precise violet action/process signal |

The shared principle:

```txt
Bright color must be either:
1. action
2. active/focus
3. semantic state
4. brand marker
5. section surface
6. product/category classification
7. image/illustration atmosphere

If it is none of these, remove it.
```

### 1.1 Controlled Vibrance

Controlled vibrance means the page can look colorful at first glance but still has a strict hierarchy underneath.

Good controlled vibrance:

- one main CTA color
- one neutral anchor
- one surface temperature
- optional supporting accents with limited roles
- bright colors kept away from body copy
- gradients used as hero/product atmosphere only
- components with consistent radius and spacing
- typography strong enough to hold color

Bad vibrance:

- every section has a different palette
- every button is a different color
- gradients behind important body text
- semantic colors used decoratively
- accents used for body copy
- saturation without contrast checks
- no neutral rest space
- hover states that introduce random colors

### 1.2 The Neutral Anchor Is Mandatory

Vibrant systems need a strong anchor:

- Stripe: Midnight Ink and white/blue-gray surfaces.
- SquadEasy: absolute black and warm amber canvas.
- Base44: ink black and pearl canvas.
- Empower: Night Sky and Canvas White.
- Copy: Midnight Ink and pale blue-gray surfaces.

Without an anchor, bright colors float with no authority.

Neutral anchor jobs:

- text legibility
- layout calm
- product seriousness
- contrast
- reusable component system
- visual reset after colorful moments

### 1.3 Accent Roles Must Be Named

Never define a color only as "accent." Define the role:

- primary action
- active navigation
- selected state
- focus ring
- outline accent
- decorative illustration
- hero gradient stop
- card background
- semantic success
- soft callout
- warning
- disabled hover

Examples:

- Stripe Deep Violet: primary CTA and active state.
- SquadEasy Electric Lime: primary action and energetic fills.
- Base44 Lime Spritz: CTA border and key indicator.
- Empower Button Yellow: primary action background only.
- Copy Violet Impulse: CTA, active nav, and process highlight.

### 1.4 Big Color vs Small Color

Vibrant systems use two different kinds of color:

#### Big Color

Large backgrounds, blocks, hero gradients, major cards.

Use for:

- campaign energy
- playful identity
- hero atmosphere
- section differentiation
- product category zones

Requires:

- strong text contrast
- limited number of major surfaces
- clear section boundaries
- no clutter on top

Examples:

- SquadEasy Amber Canvas and Deep Violet.
- Stripe gradients in hero/showcase.
- Base44 pastel hero gradients.

#### Small Color

Buttons, outlines, tags, active states, focus rings.

Use for:

- conversion
- navigation state
- selected item
- process step
- link emphasis
- interactive affordance

Examples:

- Empower Button Yellow.
- Copy Violet Impulse.
- Base44 Lime Spritz.
- Stripe Deep Violet.

Do not mix these roles casually. A small action color can become overwhelming if used as a full background. A big section color can become weak if reused on every tiny button.

### 1.5 Vibrance Needs Typographic Confidence

Bright color exposes weak type. All five references use deliberate typography:

- Stripe uses light sohne-style display type to keep gradients premium.
- SquadEasy uses huge bold type to dominate flat color blocks.
- Base44 uses open, soft display type for an airy AI workspace.
- Empower uses condensed, heavy display type to match financial directness.
- Copy uses custom display type for enterprise authority.

If the type system is generic, the color will feel cheap.

---

<a id="when-to-use"></a>
## 2. WHEN TO USE THIS SKILL

Use Vibrant Accents for:

- colorful SaaS/product landing pages
- AI tools with optimistic visual identity
- fintech needing a memorable action color
- B2B pages with vivid brand CTAs
- playful campaign pages
- consumer productivity tools
- creator tools
- product launches
- marketplaces
- collaboration tools
- health/wellness campaigns that need energy
- enterprise software needing one strong brand color
- sites where color should be a memorable differentiator

Do not use it as the main skill for:

- strict editorial minimal pages
- luxury black/white portfolios
- monochrome developer tools
- cyber neon interfaces where glow is the core identity
- soft pastel-only brands
- dense dashboards where color must be semantic only

Use another skill if:

- The user wants "tasteful white, typography, no color": Editorial Minimal.
- The user wants dark SaaS with subtle accent: Dark UI.
- The user wants cyber glow: Cyber Neon.
- The user wants gentle, soft, low contrast: Pastel.
- The user wants developer/technical precision: Technical Sans.

Vibrant Accents can combine with those styles, but it must remain the color-governance layer, not a license to add every color.

---

<a id="archetypes"></a>
## 3. THE 5 SOURCE ARCHETYPES

### 3.1 Stripe - Controlled Fintech Gradients

Stripe is the polished, controlled end of Vibrant Accents. It uses a clean white product canvas, light display typography, violet primary actions, pale blue-gray surfaces, and gradients for hero/product atmosphere.

Signature ingredients:

- white page base
- navy ink text
- violet primary action
- washed violet outlines
- green/orange as outline micro-accents
- abstract gradients for hero and showcase
- light display typography
- 4px controls, 6px cards
- soft diffused elevation
- product screenshots and diagrams

Pattern:

```txt
Neutral base: white + navy ink
Primary action: deep violet
Support accents: violet family + green/orange edge accents
Visual energy: gradient panels
Geometry: compact 4-6px radii
Typography: light, refined, tight
```

Use for:

- fintech
- dev platforms
- payments
- infrastructure
- enterprise products needing energy and trust
- modern SaaS with gradient identity

Avoid:

- saturated colors as body text
- many button colors
- hard shadows
- big playful blocks
- heavy headline weights

### 3.2 SquadEasy - Playful Block Playground

SquadEasy is the loudest, most playful archetype. It uses large flat color sections, huge bold type, photo cutouts, and a finite palette of expressive colors.

Signature ingredients:

- amber canvas
- deep violet content cards
- electric lime CTAs
- hot pink highlights
- sky blue support
- forest green outlines
- black text and borders
- huge block typography
- angled lifestyle photo cutouts
- pill buttons
- no subtle shadows

Pattern:

```txt
Big color surfaces: amber and violet
Primary action: electric lime
Anchor: black/white contrast
Imagery: cutouts breaking the box
Typography: huge, bold, direct
Geometry: pill buttons + square cards
```

Use for:

- playful brands
- community products
- social impact
- wellness challenges
- events/campaigns
- consumer products that need energy

Avoid:

- delicate typography
- generic gray interactions
- subtle gradients
- boxed stock photos
- too many extra major colors

### 3.3 Base44 - Soft AI Gradient Canvas

Base44 is the softest version. It uses pearl/off-white surfaces, pastel gradients, and small vibrant lime/orange signals. The overall feel is airy, creative, and optimistic.

Signature ingredients:

- pearl canvas
- white cards
- ink black text
- lime CTA border/signal
- light lime selected state
- orange illustration/brand accent
- pastel hero gradients
- rounded interactive controls
- generous card padding
- soft workspace feeling

Pattern:

```txt
Base: pearl/off-white
Energy: pastel gradient atmosphere
Action: lime signal
Decoration: orange brand details
Shape: soft pills and rounded cards
Mood: optimistic AI workspace
```

Use for:

- AI builders
- no-code tools
- creative workspaces
- idea generation products
- optimistic SaaS

Avoid:

- saturated backgrounds
- sharp controls
- dark text on colorful backgrounds
- lime and orange competing as equal CTAs
- neon gradients

### 3.4 Empower - Dark Finance Bright Button

Empower is the high-contrast mixed-mode archetype. It uses a near-black/dark canvas, one bright yellow action color, bold custom typography, and alternating dark/light sections.

Signature ingredients:

- Night Sky and Deep Space dark surfaces
- Button Yellow primary action
- Muted Yellow soft callouts
- Cloud Whisper light surfaces
- large pill buttons
- bold condensed display
- lifestyle imagery in rounded containers
- no heavy shadows
- dark-to-light section rhythm

Pattern:

```txt
Base: dark financial command canvas
Action: yellow spark
Secondary surface: white/cream
Typography: bold, condensed, direct
Shape: pill actions + rounded cards
```

Use for:

- fintech
- personal finance
- savings/investment products
- direct consumer financial brands
- dark hero with bright conversion

Avoid:

- extra saturated accents
- yellow body text
- generic fonts
- square primary buttons
- heavy shadows

### 3.5 Copy - Enterprise Violet System

Copy is the controlled enterprise archetype. It uses pale blue-gray surfaces, deep text, custom display type, and a vivid violet accent for CTAs, active states, and process steps.

Signature ingredients:

- Cloud Burst background
- Midnight Ink text
- Slate Echo borders
- Violet Impulse action
- Deep Space Violet depth
- Dawn Violet subtle indicators
- 4px radius system
- no shadows for elevation
- process-step visual language
- custom display headings

Pattern:

```txt
Base: pale blue-gray surfaces
Action: violet impulse
Support: darker/lighter violet family
Geometry: 4px precision
Depth: surfaces and spacing, not shadows
Mood: enterprise, strategic, polished
```

Use for:

- B2B SaaS
- enterprise AI
- strategic workflow platforms
- process-heavy landing pages
- products that need strong color but serious tone

Avoid:

- extra saturated colors
- violet body copy
- shadows
- too many radius values
- generic Inter display

---

<a id="shared-dna"></a>
## 4. SHARED DESIGN DNA

### 4.1 The Vibrance Spectrum

| Axis | Refined | Playful | Soft | Dark | Enterprise |
| --- | --- | --- | --- | --- | --- |
| Source | Stripe | SquadEasy | Base44 | Empower | Copy |
| Base | white/navy | amber/black | pearl/ink | dark/yellow | pale gray/violet |
| Accent | violet | lime/pink/blue | lime/orange | yellow | violet |
| Gradient | hero/product | no, flat blocks | pastel hero | minimal | minimal |
| Type | light premium | huge bold | open soft | condensed bold | custom corporate |
| Shape | 4-6px | pill + square | soft rounded | pill + 24px card | 4px |

Choose one dominant column.

### 4.2 Shared Rules

- A vibrant accent must be named by role.
- Neutral text must remain highly readable.
- Bright colors should be separated by surface hierarchy.
- Body copy should almost never be saturated.
- Gradients need a containment strategy.
- CTA color should not compete with decorative color.
- Supporting accents should not become primary actions.
- Radii must match the color personality.
- Typography must be strong enough to stand beside color.
- Images and illustrations must support the palette, not fight it.

### 4.3 Accent Roles

Common accent roles:

| Role | Use | Example |
| --- | --- | --- |
| Primary Action | Main CTA, active conversion | Stripe violet, Empower yellow |
| Secondary Action | Outline/ghost support | Stripe washed violet, Base44 lime border |
| Active State | Nav selected, tab active, step current | Copy violet |
| Section Surface | Large background blocks | SquadEasy amber/violet |
| Soft Highlight | Selected card or callout | Base44 light lime, Empower muted yellow |
| Decorative Atmosphere | Hero gradient or illustration | Stripe gradients, Base44 gradients |
| Micro Accent | Tags, edges, dividers | Stripe green/orange |
| Human Energy | Photo cutouts with color blocks | SquadEasy |

### 4.4 What Makes Vibrant Accents Feel Premium

Vibrance feels premium when:

- the base palette is restrained
- saturated color has a narrow job
- the type is tuned
- spacing is generous enough for color to breathe
- surfaces are not all equally loud
- motion is controlled
- contrast is clear
- gradients are crisp or soft by intent

Vibrance feels cheap when:

- every hue is fully saturated
- no color hierarchy exists
- UI states add random colors
- bright colors sit behind paragraphs
- fonts are generic
- cards use default shadows
- white space is missing

### 4.5 The "Accent Audit"

Before finalizing, audit every bright color:

1. What is its name?
2. What is its role?
3. Where is it allowed?
4. Where is it forbidden?
5. Does it compete with the primary CTA?
6. Does it pass contrast where text appears?
7. Does it appear often enough to be memorable but rarely enough to matter?

If you cannot answer these questions, remove or demote the color.

---

<a id="color"></a>
## 5. COLOR SYSTEMS

### 5.1 Palette Archetypes

#### A. Refined Violet Product Palette

Best for Stripe-like product and fintech pages.

```css
:root {
  --va-bg: #ffffff;
  --va-surface: #f8fafd;
  --va-surface-2: #e5edf5;
  --va-ink: #061b31;
  --va-muted: #50617a;
  --va-muted-2: #64748d;
  --va-border: #d8d6df;
  --va-action: #533afd;
  --va-action-soft: #b9b9f9;
  --va-highlight: #8087ff;
  --va-edge-green: #81b81a;
  --va-edge-orange: #ff6118;
}
```

Use:

- violet for primary action
- washed violet for outline
- green/orange only as small edge signals
- gradients for hero/product showcase

Do not:

- use all accents as CTAs
- use saturated colors for body copy
- make backgrounds mostly violet

#### B. Playful Block Palette

Best for SquadEasy-like expressive pages.

```css
:root {
  --va-bg: #e1c19e;
  --va-surface: #ffffff;
  --va-surface-soft: #f6f6f6;
  --va-block: #adabff;
  --va-ink: #000000;
  --va-on-dark: #ffffff;
  --va-action: #e4ff60;
  --va-blue: #7fb6e6;
  --va-pink: #ea5da3;
  --va-green: #6fb853;
}
```

Use:

- amber as major canvas
- violet as major card/section
- lime as CTA
- pink as highlight
- black as the anchor

Do not:

- add more major backgrounds
- use subtle gray for interactions
- put paragraphs on low-contrast color

#### C. Soft AI Accent Palette

Best for Base44-like AI/workspace pages.

```css
:root {
  --va-bg: #faf9f7;
  --va-surface: #ffffff;
  --va-ink: #000000;
  --va-text: #232529;
  --va-muted: #696f7b;
  --va-border: #cfcfcf;
  --va-line: #324158;
  --va-action: #ade900;
  --va-action-soft: #ebffb1;
  --va-orange: #ff631f;
  --va-orange-muted: #d8723c;
}
```

Use:

- pearl canvas
- lime for action/border/selected state
- orange for brand/illustration
- pastel gradient as atmosphere

Do not:

- make orange a second CTA
- turn lime into full-page background
- introduce sharp controls

#### D. Dark Yellow Finance Palette

Best for Empower-like mixed dark/light pages.

```css
:root {
  --va-bg-dark: #100f0f;
  --va-bg-deep: #171616;
  --va-card-dark: #262525;
  --va-muted-dark: #64635c;
  --va-bg-light: #ffffff;
  --va-surface-light: #fffdf6;
  --va-action: #e4e24e;
  --va-action-soft: #faf9b6;
  --va-ink-on-action: #100f0f;
}
```

Use:

- yellow as primary action fill
- muted yellow as callout surface
- dark/light section contrast
- strong custom typography

Do not:

- use yellow as text
- add other saturated accents
- add heavy shadows

#### E. Enterprise Violet Palette

Best for Copy-like B2B pages.

```css
:root {
  --va-bg: #f6fafb;
  --va-ink: #171717;
  --va-muted: #5d5d5d;
  --va-border: #e4edf1;
  --va-border-2: #e2e8eb;
  --va-action: #693edf;
  --va-action-deep: #3b0d96;
  --va-action-soft: #c1b9f4;
}
```

Use:

- violet for CTA, active nav, process states
- pale blue-gray surfaces for structure
- 4px radii
- no shadow depth

Do not:

- use violet as body text
- add other saturated colors
- use arbitrary card radii

### 5.2 Accent Budget

Suggested visible color budgets:

#### Refined Product

- 70 percent white/neutral
- 15 percent pale surfaces
- 8 percent primary accent
- 5 percent gradients
- 2 percent micro accents

#### Playful Block

- 40 percent major warm surface
- 20 percent white/black contrast
- 20 percent secondary color block
- 10 percent action color
- 10 percent photography/other accents

#### Soft AI

- 75 percent pearl/white
- 10 percent pastel gradient
- 6 percent lime
- 4 percent orange
- 5 percent neutral lines/text

#### Dark Finance

- 55 percent dark surface
- 25 percent light surface
- 8 percent yellow action
- 7 percent muted yellow callouts
- 5 percent imagery

#### Enterprise Violet

- 70 percent pale surfaces
- 15 percent text/neutral
- 8 percent violet action
- 5 percent violet soft/deep
- 2 percent process detail

### 5.3 Contrast Rules

Never rely on vibrance alone. Check text contrast.

Safe pairings:

- black text on lime/yellow
- navy text on pale blue/powder surfaces
- white text on violet/dark
- dark text on amber
- black text on pastel violet when contrast is adequate

Risky pairings:

- white text on yellow/lime
- violet text on blue-gray without contrast check
- orange text on amber
- pink text on violet
- pale gray body text on pastel gradients

### 5.4 Gradient Rules

Gradients are allowed, but role-limited.

Use gradients for:

- hero background
- product showcase backdrop
- decorative band behind product visual
- single atmospheric section
- illustration accent

Do not use gradients for:

- every card
- body text backgrounds
- nav bars by default
- small buttons unless the brand is explicitly gradient-button based
- form fields

Gradient types:

#### Stripe-like active gradient

```css
--gradient-violet-product:
  radial-gradient(circle, #7f7dfc 0%, #f44bcc 33%, #e5edf5 66%);
```

#### Base44-like soft gradient

```css
--gradient-soft-ai:
  linear-gradient(180deg, #f2f1ed 42%, #d5dfe0 94%, #e5ff94 104%);
```

#### Warm horizon gradient

```css
--gradient-warm-horizon:
  linear-gradient(180deg, rgba(251,250,248,0) 0%, rgba(255,240,222,0.3) 18%, #ffae53 44%, #ff7f47 56%, rgba(255,174,83,0) 81%);
```

### 5.5 Color Pairing Recipes

#### Violet plus pale blue-gray

Use for polished SaaS:

- action: #533afd or #693edf
- surface: #f6fafb / #e5edf5
- text: #061b31 / #171717
- border: #e4edf1

#### Lime plus black/pearl

Use for optimistic AI:

- action: #ade900 or #e4ff60
- text: black
- surface: #faf9f7 / white
- support: light lime or amber

#### Yellow plus dark

Use for financial confidence:

- action: #e4e24e
- text/action ink: #100f0f
- dark: #100f0f / #171616
- light: #fffdf6

#### Hot playful set

Use carefully:

- base: amber
- action: lime
- block: pastel violet
- attention: hot pink
- support: sky blue
- anchor: black

Limit this to brands where playfulness is the core personality.

---

<a id="typography"></a>
## 6. TYPOGRAPHY SYSTEMS

### 6.1 Typography Must Counterbalance Color

Bright color needs type discipline.

Choose one typography mode:

1. Light premium display
   - for Stripe-like systems
   - weight 300/400
   - tight tracking
   - clean product feel

2. Huge bold block type
   - for SquadEasy-like systems
   - weight 700+
   - very large sizes
   - tight line-height

3. Open soft display
   - for Base44-like systems
   - weight 400
   - airy line-height
   - gentle workspace feel

4. Condensed finance display
   - for Empower-like systems
   - heavy condensed headings
   - distinctive body/nav width
   - strong brand rhythm

5. Custom enterprise display
   - for Copy-like systems
   - custom display for major headings
   - Inter for functional text
   - tight but serious

### 6.2 Type Scale Recipes

#### Refined Violet Product Scale

```css
:root {
  --text-caption: 11px;
  --text-body: 14px;
  --text-subheading: 18px;
  --text-heading-sm: 22px;
  --text-heading: 32px;
  --text-heading-lg: 44px;
  --text-display: 56px;

  --leading-caption: 1.45;
  --leading-body: 1.4;
  --leading-subheading: 1.25;
  --leading-heading: 1.15;
  --leading-heading-lg: 1.1;
  --leading-display: 1.07;

  --tracking-display: -0.03em;
  --tracking-heading-lg: -0.025em;
  --tracking-subheading: -0.009em;
}
```

#### Playful Block Scale

```css
:root {
  --text-body: 16px;
  --text-body-lg: 18px;
  --text-heading: 50px;
  --text-display: 80px;
  --text-display-lg: 110px;
  --text-mega: 220px;

  --leading-body: 1.2;
  --leading-display: 1;
  --leading-display-lg: 0.87;

  --tracking-body: -0.015em;
  --tracking-display: -0.02em;
}
```

#### Soft AI Scale

```css
:root {
  --text-caption: 10px;
  --text-body: 14px;
  --text-body-lg: 18px;
  --text-heading-sm: 20px;
  --text-heading: 28px;
  --text-heading-lg: 42px;
  --text-display: 56px;
  --text-display-lg: 63px;

  --leading-caption: 1.2;
  --leading-body: 1.2;
  --leading-heading: 1.3;
  --leading-display: 1.07;
}
```

#### Dark Finance Scale

```css
:root {
  --text-caption: 11px;
  --text-body: 16px;
  --text-body-lg: 21px;
  --text-subheading: 26px;
  --text-heading-sm: 36px;
  --text-heading: 40px;
  --text-heading-lg: 48px;
  --text-display: 96px;

  --leading-body: 1.33;
  --leading-subheading: 1.2;
  --leading-heading: 1;
  --leading-display: 1;

  --tracking-body: -0.015em;
  --tracking-display: -0.01em;
}
```

#### Enterprise Violet Scale

```css
:root {
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subheading: 22px;
  --text-heading: 24px;
  --text-heading-lg: 26px;
  --text-display-sm: 48px;
  --text-display: 88px;

  --leading-caption: 2;
  --leading-body: 1.43;
  --leading-subheading: 1.57;
  --leading-display: 1;

  --tracking-display: -0.02em;
}
```

### 6.3 Font Substitutions

| Archetype | Primary substitute | Secondary |
| --- | --- | --- |
| Stripe | Inter, Satoshi, Manrope | none |
| SquadEasy | Inter Tight, Archivo Black, Druk-like display | Inter |
| Base44 | Satoshi, Wix Madefor Text, DM Sans | Arial for utility |
| Empower | Archivo Expanded, IBM Plex Sans Condensed, Inter Tight | Georgia for serif moments |
| Copy | Montserrat for display, Inter for UI | none |

### 6.4 Headline Rules

For refined vibrant:

- light weight
- tight tracking
- restrained line-height
- let color/gradient provide energy

For playful vibrant:

- very large
- bold
- low line-height
- strong black contrast

For enterprise vibrant:

- custom display face
- strong but not playful
- violet accent supports, does not dominate

For dark finance:

- bold/condensed
- bright button does the conversion
- headline remains strong and neutral

### 6.5 Copy Tone

Vibrant Accents copy can be more direct and energetic than Editorial Minimal, but it should not become generic.

Good:

- "Launch the workflow before the queue fills."
- "Build the app while the idea is still warm."
- "Move money with one bright signal."
- "Every process step, clearly marked."
- "Payments, payouts, and revenue in one precise flow."

Weak:

- "Supercharge your business."
- "Unlock powerful solutions."
- "Bright ideas for modern teams."
- "The future is vibrant."
- "Transform your workflow with innovation."

---

<a id="spacing"></a>
## 7. SPACING, SHAPE, AND DENSITY

### 7.1 Base Units

Use:

- 4px for Stripe, SquadEasy, Base44, Copy.
- 8px for Empower-like dark finance.

### 7.2 Section Rhythm

| Archetype | Section gap |
| --- | --- |
| Stripe | 64px |
| SquadEasy | 100px |
| Base44 | 45px |
| Empower | 32px |
| Copy | 72px |

Interpretation:

- Playful block pages need bigger section gaps.
- Enterprise systems need generous but structured gaps.
- Dark finance can use tighter section blocks because color contrast creates separation.
- Soft AI can use closer sections because gradients and cards are gentle.

### 7.3 Radius Systems

#### Refined Product Radius

```css
--radius-control: 4px;
--radius-card: 6px;
```

Use for Stripe and Copy-like systems.

#### Playful Block Radius

```css
--radius-button: 100px;
--radius-card: 0px;
--radius-nav: 14px;
```

Use for SquadEasy-like systems.

#### Soft AI Radius

```css
--radius-card: 7.42px;
--radius-default: 9.9px;
--radius-prominent: 13.85px;
--radius-pill: 999px;
```

Use when the identity benefits from unusual softness.

#### Dark Finance Radius

```css
--radius-module: 16px;
--radius-card: 24px;
--radius-pill: 9999px;
```

Use for Empower-like systems.

### 7.4 Shape Meaning

| Shape | Meaning |
| --- | --- |
| 4px radius | precise enterprise/product control |
| 6px radius | compact product card |
| 0px card | bold flat color block |
| 16px module | friendly structured content |
| 24px card | accessible consumer/finance warmth |
| 100px/999px pill | strong interactive affordance |
| huge decorative radius | soft AI/workspace atmosphere |

Do not mix all shape systems. Pick the one that matches the archetype.

---

<a id="surfaces"></a>
## 8. SURFACE AND GRADIENT SYSTEMS

### 8.1 Surface Ladders

#### Stripe-like ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #ffffff | Page |
| 1 | #f8fafd | Soft cards |
| 2 | #e5edf5 | Section/card surface |
| 3 | #d8d6df | Border |
| 4 | #061b31 | Text |
| 5 | #533afd | Action |

#### SquadEasy-like ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #e1c19e | Main section canvas |
| 1 | #ffffff | Clean counter-surface |
| 2 | #f6f6f6 | Utility surface |
| 3 | #adabff | Major card/section |
| 4 | #000000 | Text/border |
| 5 | #e4ff60 | CTA |

#### Base44-like ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #faf9f7 | Page |
| 1 | #ffffff | Cards |
| 2 | #e6e6e6 | Light dividers |
| 3 | #cfcfcf | Borders |
| 4 | #000000 | Text |
| 5 | #ade900 | Action signal |

#### Empower-like ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #100f0f | Main dark |
| 1 | #171616 | Hero dark |
| 2 | #262525 | Dark cards |
| 3 | #ffffff | Light sections |
| 4 | #fffdf6 | Light cards/text |
| 5 | #e4e24e | Action |

#### Copy-like ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #f6fafb | Page/cards/input |
| 1 | #e4edf1 | Borders |
| 2 | #e2e8eb | Button border |
| 3 | #171717 | Text |
| 4 | #693edf | Action |
| 5 | #c1b9f4 | Soft signal |

### 8.2 Shadow Rules

Use shadows only if the archetype supports them.

- Stripe: soft diffused shadows are allowed.
- SquadEasy: avoid shadows; use flat color and crisp borders.
- Base44: subtle soft shadows may appear, but not as a main feature.
- Empower: no heavy shadows; radius and contrast define cards.
- Copy: no shadows; use surfaces and spacing.

#### Stripe-like diffused shadow

```css
--shadow-vibrant-card:
  rgba(0, 0, 0, 0.2) 0 0 32px 8px;
```

#### Enterprise no-shadow substitute

```css
--shadow-none-depth:
  inset 0 -3px 0 rgba(204, 217, 224, 0.2);
```

### 8.3 Gradient Containment

Gradients need containers:

- hero background
- product panel background
- abstract orbital shape
- brand illustration
- section header band

Avoid:

- gradients in every card
- gradient text everywhere
- gradients behind body copy
- gradient buttons unless core brand

Gradient readability rule:

```txt
If text sits on the gradient, place it on a calm stop or put a neutral surface behind it.
```

---

<a id="components"></a>
## 9. COMPONENT PATTERNS

### 9.1 Primary Buttons

#### Refined Violet Button

```css
.va-btn-violet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 24px;
  border: 0;
  border-radius: 4px;
  background: #533afd;
  color: #ffffff;
  font: 400 15px/1 var(--va-font-sans);
}
```

Use for Stripe-like systems.

#### Electric Lime Pill

```css
.va-btn-lime {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  border-radius: 100px;
  background: #e4ff60;
  color: #000000;
  font: 700 16px/1 var(--va-font-sans);
}
```

Use for playful high-energy CTAs.

#### Lime Border AI Button

```css
.va-btn-lime-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #ade900;
  border-radius: 999px;
  background: #ffffff;
  color: #000000;
}
```

Use for soft AI/workspace pages.

#### Yellow Finance Button

```css
.va-btn-yellow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 9999px;
  background: #e4e24e;
  color: #100f0f;
  font: 400 16px/1 var(--va-font-sans);
}
```

Use for dark finance.

#### Enterprise Violet Button

```css
.va-btn-enterprise {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 4px;
  background: #693edf;
  color: #ffffff;
  font: 600 14px/1 var(--va-font-ui);
}
```

Use for Copy-like B2B pages.

### 9.2 Secondary Buttons

Secondary actions should not introduce new colors.

```css
.va-btn-outline {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid var(--va-border);
  border-radius: var(--va-radius-control);
  background: transparent;
  color: var(--va-ink);
}

.va-btn-outline[data-accent="true"] {
  color: var(--va-action);
  border-color: var(--va-action-soft);
}
```

Rules:

- Use same accent family.
- Do not invent a new secondary hue.
- In playful systems, ghost buttons can use forest green or white only if tokenized.

### 9.3 Cards

#### Powder Product Card

```css
.va-card-product {
  border-radius: 6px;
  background: #e5edf5;
  padding: 12px;
  color: #061b31;
}
```

#### Playful Color Block

```css
.va-card-block {
  border-radius: 0;
  background: #adabff;
  padding: 40px 24px 140px;
  color: #000000;
}
```

#### Soft Workspace Card

```css
.va-card-soft {
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #cfcfcf;
  padding: 40px;
  color: #000000;
}
```

#### Dark Finance Card

```css
.va-card-dark {
  border-radius: 24px;
  background: #262525;
  color: #fffdf6;
  padding: 24px;
}
```

#### Enterprise Process Card

```css
.va-card-enterprise {
  border-radius: 4px;
  background: #f6fafb;
  border: 1px solid #e4edf1;
  padding: 30px;
  color: #171717;
}
```

### 9.4 Tags And Accents

Tags are where vibrant systems often become chaotic. Keep them role-based.

```css
.va-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid var(--va-border);
  color: var(--va-muted);
  font-size: 12px;
}

.va-tag[data-tone="green"] {
  border-color: #81b81a;
  color: #061b31;
}

.va-tag[data-tone="orange"] {
  border-color: #ff6118;
  color: #061b31;
}

.va-tag[data-tone="violet"] {
  border-color: #c1b9f4;
  color: #693edf;
}
```

Rules:

- tag color is outline/focus, not filled by default
- do not use all tag tones in one tiny area
- tag color should classify or indicate state

### 9.5 Inputs

#### Enterprise Input

```css
.va-input-enterprise {
  min-height: 44px;
  border: 1px solid #e4edf1;
  border-radius: 0;
  background: #f6fafb;
  color: #171717;
  padding: 0 18px;
}
```

#### Soft AI Input

```css
.va-input-soft {
  min-height: 48px;
  border: 1px solid #cfcfcf;
  border-radius: 999px;
  background: #ffffff;
  color: #000000;
  padding: 0 18px;
}
```

Rules:

- input color should be neutral
- focus ring can use accent
- do not use saturated input backgrounds

### 9.6 Process Steps

Vibrant accents are excellent for process visualization.

```css
.va-process {
  display: grid;
  gap: 16px;
}

.va-process-step {
  border-left: 2px solid var(--va-border);
  padding-left: 24px;
  color: var(--va-muted);
}

.va-process-step[data-active="true"] {
  border-left-color: var(--va-action);
  color: var(--va-ink);
}
```

Use for:

- onboarding
- automation flows
- payment steps
- AI build process
- enterprise workflow

### 9.7 Gradient Panels

```css
.va-gradient-panel {
  border-radius: 6px;
  background:
    radial-gradient(circle at 24% 20%, rgba(244, 75, 204, 0.55), transparent 34%),
    radial-gradient(circle at 70% 30%, rgba(83, 58, 253, 0.55), transparent 38%),
    #e5edf5;
  padding: 32px;
}
```

Rules:

- keep text off the hottest stops
- pair with neutral cards inside if needed
- avoid gradient as default page background

---

<a id="layouts"></a>
## 10. LAYOUT PATTERNS

### 10.1 Refined Product Gradient Hero

Best for Stripe-like systems.

Structure:

```txt
Nav on white
Left/center headline
Violet CTA
Product/gradient showcase
Pale product cards
```

```css
.va-refined-hero {
  background: #ffffff;
  color: #061b31;
  padding: 96px 24px 64px;
}

.va-showcase-gradient {
  margin-top: 48px;
  border-radius: 6px;
  background:
    radial-gradient(circle, #7f7dfc, #f44bcc 33%, #e5edf5 66%);
  padding: 32px;
}
```

Rules:

- the gradient is a showcase object
- content stays structured
- CTA remains solid violet

### 10.2 Playful Color-Block Hero

Best for SquadEasy-like systems.

```css
.va-playful-hero {
  position: relative;
  overflow: hidden;
  background: #e1c19e;
  color: #000000;
  padding: 100px 24px;
}

.va-playful-hero h1 {
  max-width: 10ch;
  font-size: clamp(72px, 14vw, 220px);
  line-height: 0.9;
  letter-spacing: -0.02em;
  font-weight: 900;
}
```

Rules:

- use huge type
- images can break bounds
- color surfaces are flat
- CTA is lime or black

### 10.3 Soft AI Workspace Hero

Best for Base44-like systems.

```css
.va-soft-hero {
  background:
    linear-gradient(180deg, #f2f1ed 42%, #d5dfe0 94%, #e5ff94 104%),
    #faf9f7;
  color: #000000;
  padding: 88px 24px 64px;
}

.va-soft-hero h1 {
  max-width: 780px;
  font-size: clamp(42px, 7vw, 63px);
  line-height: 1.05;
  font-weight: 400;
}
```

Rules:

- keep the gradient low-contrast
- use lime as signal
- round controls heavily
- avoid loud colors behind text

### 10.4 Dark Finance Hero

Best for Empower-like systems.

```css
.va-finance-hero {
  background: #100f0f;
  color: #fffdf6;
  padding: 96px 24px 64px;
}

.va-finance-hero h1 {
  max-width: 10ch;
  font-size: clamp(56px, 10vw, 96px);
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.01em;
}
```

Rules:

- yellow action stands alone
- alternate with light sections
- use rounded lifestyle imagery
- no extra saturated accents

### 10.5 Enterprise Process Layout

Best for Copy-like systems.

```css
.va-enterprise-section {
  background: #f6fafb;
  color: #171717;
  padding: 72px 24px;
}

.va-enterprise-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  gap: 48px;
  align-items: start;
}
```

Rules:

- use violet for process/active state
- cards remain pale and precise
- no shadows
- custom display typography for headings

---

<a id="imagery"></a>
## 11. IMAGERY AND ILLUSTRATION

### 11.1 Image Roles

Vibrant Accents supports multiple image modes:

- product screenshot on gradient showcase
- angled lifestyle cutouts
- rounded finance lifestyle cards
- abstract gradient panels
- brand illustrations with orange/lime details
- enterprise process diagrams

### 11.2 Product Showcase Rules

For Stripe/Base44/Copy:

- product UI should be legible
- screenshots sit on neutral or gradient panels
- keep UI surfaces calmer than the surrounding accent
- use accent to guide attention, not overwhelm the screenshot

### 11.3 Photo Cutout Rules

For SquadEasy:

- use people/human imagery
- crop tightly
- angle or layer cutouts
- allow images to break normal card boundaries
- keep background flat and bold

Avoid:

- stock photos in polite rectangles
- generic office photos
- photos with colors that fight the palette

### 11.4 Finance Imagery Rules

For Empower:

- lifestyle imagery can humanize dark finance
- rounded or circular framing works
- do not make photos more colorful than the yellow accent
- keep financial UI clean and focused

### 11.5 Illustration Rules

For Base44/Stripe:

- illustration accents can use orange/lime/violet
- do not create a separate illustration palette
- use illustration as brand detail, not section filler
- avoid large cartoon scenes unless the product is playful

---

<a id="motion"></a>
## 12. MOTION AND INTERACTION

### 12.1 Motion Principles

Vibrant accents can animate, but movement should reinforce signal.

Use motion for:

- CTA hover state
- gradient position shift in hero
- process step activation
- card hover lift in refined product systems
- photo cutout entrance in playful systems
- selected state transitions

Avoid:

- constant color cycling
- rainbow hover states
- animated gradients behind text
- bouncing enterprise components

### 12.2 Timing

```css
:root {
  --va-motion-fast: 120ms;
  --va-motion-base: 180ms;
  --va-motion-slow: 320ms;
  --va-ease: cubic-bezier(0.2, 0, 0, 1);
  --va-ease-playful: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Use:

- 120ms for color/border hover
- 180ms for buttons/cards
- 320ms for gradient/photo entrances

### 12.3 Hover Recipes

Refined violet:

- button darkens slightly
- outline border intensifies
- card shadow softens/lifts

Playful:

- lime button translates -1px
- hot pink link hover
- photo cutout rotates slightly

Soft AI:

- border changes to lime
- selected state uses light lime
- gradient remains slow/static

Dark finance:

- yellow button brightens slightly
- ghost border becomes more opaque
- dark card surface moves one level

Enterprise:

- violet active state appears
- no playful movement
- process line color changes

---

<a id="anti-slop"></a>
## 13. ANTI-SLOP RULES

### 13.1 Universal Rejections

Reject:

- random rainbow palettes
- all buttons different colors
- gradients on every section
- bright body copy
- inaccessible text on color
- default blue links in a non-blue system
- ungoverned semantic colors
- glow effects on all components
- stock photos that do not match palette
- childish color blocks for serious products
- enterprise pages with playful confetti accents

### 13.2 Color Slop

Do not:

- use accent color for body paragraphs
- make secondary accents equal to primary action
- put yellow or lime behind white text
- use hot pink as generic hover everywhere
- create a new color for each feature
- use gradients when a flat accent would be clearer
- combine neon and pastel systems casually

### 13.3 Typography Slop

Do not:

- use weak generic headings with loud colors
- use heavy type in Stripe-like refined systems
- use delicate type in SquadEasy-like block systems
- use Inter for custom display moments in Copy-like systems
- ignore letter spacing
- let text wrap awkwardly on colored blocks

### 13.4 Component Slop

Do not:

- mix 4px enterprise buttons with 100px playful pills without a reason
- add shadows to flat block systems
- use saturated input backgrounds
- make status badges decorative rather than meaningful
- use all accent tones in one component cluster
- make CTA and decorative accent the same visual weight

### 13.5 Layout Slop

Do not:

- make every section a different color block
- lose product clarity inside gradients
- place huge color areas behind long body copy
- use equal card grids when a hero/showcase needs hierarchy
- let photo cutouts overlap text
- forget rest space between colorful moments

---

<a id="decision-tree"></a>
## 14. DECISION TREE

### 14.1 Choose The Accent Personality

```txt
Need refined product trust?
  Use Stripe-like violet + gradients.

Need playful campaign energy?
  Use SquadEasy-like flat blocks + lime CTA.

Need optimistic AI/workspace softness?
  Use Base44-like pearl canvas + pastel gradients + lime/orange.

Need high-contrast finance confidence?
  Use Empower-like dark canvas + yellow action.

Need enterprise authority with one vivid signal?
  Use Copy-like pale surfaces + violet process/action.
```

### 14.2 Choose Big Color Or Small Color

```txt
Is the brand playful/campaign-like?
  Big color surfaces are allowed.

Is the brand fintech/enterprise/product-serious?
  Keep color small: CTA, active state, gradient panel.

Is the brand AI/creative workspace?
  Use soft gradients as atmosphere and bright accents as small signals.
```

### 14.3 Choose Radius

```txt
Precise product/enterprise -> 4-6px.
Playful consumer -> 100px buttons, square cards.
Soft AI -> rounded cards and pill interactions.
Dark finance -> pill actions + 16/24px cards.
```

### 14.4 Choose Typography

```txt
Refined gradients -> light display.
Flat playful blocks -> huge bold display.
Soft AI -> open regular display.
Dark finance -> condensed/heavy display.
Enterprise violet -> custom display + functional UI font.
```

---

<a id="css-starter"></a>
## 15. CSS CUSTOM PROPERTY STARTER

```css
:root {
  color-scheme: light;

  /* Palette */
  --va-bg: #ffffff;
  --va-surface: #f8fafd;
  --va-surface-2: #e5edf5;
  --va-ink: #061b31;
  --va-muted: #50617a;
  --va-muted-2: #64748d;
  --va-border: #d8d6df;
  --va-action: #533afd;
  --va-action-soft: #b9b9f9;
  --va-highlight: #8087ff;
  --va-edge-green: #81b81a;
  --va-edge-orange: #ff6118;

  /* Type */
  --va-font-sans: Inter, Satoshi, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --va-font-display: Inter, Satoshi, ui-sans-serif, system-ui, sans-serif;
  --va-font-ui: Inter, ui-sans-serif, system-ui, sans-serif;

  --va-text-caption: 11px;
  --va-text-body: 14px;
  --va-text-subheading: 18px;
  --va-text-heading-sm: 22px;
  --va-text-heading: 32px;
  --va-text-heading-lg: 44px;
  --va-text-display: 56px;

  --va-leading-caption: 1.45;
  --va-leading-body: 1.4;
  --va-leading-subheading: 1.25;
  --va-leading-heading: 1.15;
  --va-leading-display: 1.07;

  --va-tracking-display: -0.03em;
  --va-tracking-heading: -0.02em;

  /* Spacing */
  --va-space-1: 4px;
  --va-space-2: 8px;
  --va-space-3: 12px;
  --va-space-4: 16px;
  --va-space-5: 20px;
  --va-space-6: 24px;
  --va-space-8: 32px;
  --va-space-10: 40px;
  --va-space-12: 48px;
  --va-space-16: 64px;
  --va-space-20: 80px;
  --va-space-24: 96px;
  --va-space-25: 100px;

  /* Shape */
  --va-radius-control: 4px;
  --va-radius-card: 6px;
  --va-radius-soft: 16px;
  --va-radius-pill: 9999px;

  /* Gradient */
  --va-gradient-showcase:
    radial-gradient(circle at 30% 20%, rgba(244, 75, 204, 0.55), transparent 34%),
    radial-gradient(circle at 70% 30%, rgba(83, 58, 253, 0.55), transparent 38%),
    #e5edf5;

  /* Motion */
  --va-motion-fast: 120ms;
  --va-motion-base: 180ms;
  --va-motion-slow: 320ms;
  --va-ease: cubic-bezier(0.2, 0, 0, 1);
}

.vibrant-accents {
  min-height: 100%;
  background: var(--va-bg);
  color: var(--va-ink);
  font-family: var(--va-font-sans);
  font-size: var(--va-text-body);
  line-height: var(--va-leading-body);
}

.vibrant-accents h1 {
  max-width: 12ch;
  font-family: var(--va-font-display);
  font-size: clamp(44px, 7vw, var(--va-text-display));
  line-height: var(--va-leading-display);
  letter-spacing: var(--va-tracking-display);
  font-weight: 300;
}

.vibrant-accents p {
  color: var(--va-muted);
}
```

### 15.1 Playful Override

```css
[data-va-theme="playful-block"] {
  --va-bg: #e1c19e;
  --va-surface: #ffffff;
  --va-surface-2: #adabff;
  --va-ink: #000000;
  --va-muted: #000000;
  --va-border: #000000;
  --va-action: #e4ff60;
  --va-highlight: #ea5da3;
  --va-radius-control: 100px;
  --va-radius-card: 0px;
  --va-text-display: 110px;
  --va-leading-display: 0.9;
  --va-tracking-display: -0.02em;
}
```

### 15.2 Soft AI Override

```css
[data-va-theme="soft-ai"] {
  --va-bg: #faf9f7;
  --va-surface: #ffffff;
  --va-surface-2: #e6e6e6;
  --va-ink: #000000;
  --va-muted: #696f7b;
  --va-border: #cfcfcf;
  --va-action: #ade900;
  --va-action-soft: #ebffb1;
  --va-highlight: #ff631f;
  --va-radius-control: 999px;
  --va-radius-card: 10px;
}
```

### 15.3 Dark Finance Override

```css
[data-va-theme="dark-finance"] {
  color-scheme: dark;
  --va-bg: #100f0f;
  --va-surface: #171616;
  --va-surface-2: #262525;
  --va-ink: #fffdf6;
  --va-muted: #64635c;
  --va-border: #fffdf6;
  --va-action: #e4e24e;
  --va-action-soft: #faf9b6;
  --va-radius-control: 9999px;
  --va-radius-card: 24px;
  --va-text-display: 96px;
  --va-leading-display: 1;
  --va-tracking-display: -0.01em;
}
```

### 15.4 Enterprise Override

```css
[data-va-theme="enterprise-violet"] {
  --va-bg: #f6fafb;
  --va-surface: #f6fafb;
  --va-surface-2: #e4edf1;
  --va-ink: #171717;
  --va-muted: #5d5d5d;
  --va-border: #e4edf1;
  --va-action: #693edf;
  --va-action-soft: #c1b9f4;
  --va-highlight: #3b0d96;
  --va-radius-control: 4px;
  --va-radius-card: 4px;
  --va-text-display: 88px;
  --va-leading-display: 1;
  --va-tracking-display: -0.02em;
}
```

---

<a id="tailwind"></a>
## 16. TAILWIND V4 STARTER

```css
@import "tailwindcss";

@theme {
  --color-va-bg: #ffffff;
  --color-va-surface: #f8fafd;
  --color-va-surface-2: #e5edf5;
  --color-va-ink: #061b31;
  --color-va-muted: #50617a;
  --color-va-muted-2: #64748d;
  --color-va-border: #d8d6df;
  --color-va-action: #533afd;
  --color-va-action-soft: #b9b9f9;
  --color-va-highlight: #8087ff;
  --color-va-edge-green: #81b81a;
  --color-va-edge-orange: #ff6118;

  --font-va-sans: Inter, Satoshi, ui-sans-serif, system-ui, sans-serif;
  --font-va-display: Inter, Satoshi, ui-sans-serif, system-ui, sans-serif;

  --text-va-caption: 11px;
  --text-va-body: 14px;
  --text-va-subheading: 18px;
  --text-va-heading-sm: 22px;
  --text-va-heading: 32px;
  --text-va-heading-lg: 44px;
  --text-va-display: 56px;

  --radius-va-control: 4px;
  --radius-va-card: 6px;
  --radius-va-soft: 16px;
}
```

### 16.1 Tailwind: Refined Violet Hero

```html
<section class="bg-va-bg px-6 py-24 text-va-ink">
  <div class="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
    <div>
      <h1 class="max-w-[12ch] font-va-display text-[clamp(44px,7vw,56px)] font-light leading-[1.07] tracking-[-0.03em]">
        Revenue infrastructure with one clear signal.
      </h1>
      <p class="mt-6 max-w-[56ch] text-va-body leading-[1.4] text-va-muted">
        Accept, route, and reconcile payments through a product surface that stays calm until action matters.
      </p>
      <button class="mt-8 rounded-va-control bg-va-action px-6 py-4 text-white">
        Start now
      </button>
    </div>
    <div class="rounded-va-card bg-[radial-gradient(circle_at_30%_20%,rgba(244,75,204,.55),transparent_34%),radial-gradient(circle_at_70%_30%,rgba(83,58,253,.55),transparent_38%),#e5edf5] p-8">
      <div class="rounded-va-card bg-white/85 p-4 text-va-ink">Product panel</div>
    </div>
  </div>
</section>
```

### 16.2 Tailwind: Playful Block CTA

```html
<section class="overflow-hidden bg-[#e1c19e] px-6 py-[100px] text-black">
  <h1 class="max-w-[10ch] text-[clamp(72px,14vw,180px)] font-black leading-[.9] tracking-[-.02em]">
    Move together.
  </h1>
  <button class="mt-8 rounded-full bg-[#e4ff60] px-6 py-4 text-base font-bold text-black">
    Join the challenge
  </button>
</section>
```

---

<a id="recipes"></a>
## 17. COMPONENT RECIPES

### 17.1 Accent Governance Block

Use this in design docs or implementation notes to prevent color drift.

```md
Color roles:
- Primary action: #533afd
- Secondary outline: #b9b9f9
- Decorative gradient: violet/pink/light blue only
- Edge accents: green/orange, tags and dividers only
- Body text: #061b31 / #50617a
- Forbidden: saturated body text, extra CTA colors, generic blue links
```

### 17.2 Refined Product Card Grid

```html
<section class="va-product-grid">
  <article class="va-card-product">
    <span class="va-tag" data-tone="green">Payments</span>
    <h3>Route every transaction.</h3>
    <p>Use accent edges to classify, not to decorate.</p>
  </article>
  <article class="va-card-product">
    <span class="va-tag" data-tone="orange">Risk</span>
    <h3>Flag changes instantly.</h3>
    <p>Keep the primary CTA violet so attention stays focused.</p>
  </article>
</section>
```

```css
.va-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.va-card-product h3 {
  margin: 24px 0 8px;
  font-size: 22px;
  line-height: 1.2;
  color: #061b31;
}
```

### 17.3 Playful Photo Cutout Section

```html
<section class="va-playful-cutout">
  <div class="va-copy">
    <h2>Teams do more when the page has a pulse.</h2>
    <button class="va-btn-lime">Start moving</button>
  </div>
  <img class="va-cutout va-cutout-a" src="/person-a.png" alt="" />
  <img class="va-cutout va-cutout-b" src="/person-b.png" alt="" />
</section>
```

```css
.va-playful-cutout {
  position: relative;
  min-height: 640px;
  overflow: hidden;
  background: #e1c19e;
  color: #000000;
  padding: 80px 24px;
}

.va-cutout {
  position: absolute;
  max-width: 280px;
  object-fit: contain;
}

.va-cutout-a {
  right: 12%;
  top: 14%;
  transform: rotate(-8deg);
}

.va-cutout-b {
  right: 28%;
  bottom: 8%;
  transform: rotate(7deg);
}
```

### 17.4 Soft AI Builder Card

```html
<article class="va-builder-card">
  <p class="va-caption">New workspace</p>
  <h3>Build from a prompt, then tune every surface.</h3>
  <button class="va-btn-lime-outline">Start building</button>
</article>
```

```css
.va-builder-card {
  border: 1px solid #cfcfcf;
  border-radius: 10px;
  background: #ffffff;
  padding: 40px;
  color: #000000;
}

.va-caption {
  color: #696f7b;
  font-size: 10px;
  line-height: 1.2;
}
```

### 17.5 Dark Finance Split

```html
<section class="va-finance-split">
  <div>
    <h2>One bright action in a dark financial system.</h2>
    <button class="va-btn-yellow">Get started</button>
  </div>
  <article class="va-card-dark">
    <p>Balance</p>
    <strong>$24,860</strong>
  </article>
</section>
```

```css
.va-finance-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
  gap: 32px;
  align-items: center;
  background: #100f0f;
  color: #fffdf6;
  padding: 64px 24px;
}

.va-finance-split h2 {
  max-width: 12ch;
  font-size: clamp(48px, 8vw, 96px);
  line-height: 1;
}
```

### 17.6 Enterprise Violet Process

```html
<section class="va-enterprise-grid">
  <div>
    <h2>Every workflow step gets one precise signal.</h2>
    <button class="va-btn-enterprise">Create workflow</button>
  </div>
  <div class="va-process">
    <div class="va-process-step" data-active="true">Collect intake</div>
    <div class="va-process-step">Classify request</div>
    <div class="va-process-step">Route for approval</div>
  </div>
</section>
```

---

<a id="product-recipes"></a>
## 18. IMPLEMENTATION RECIPES BY PRODUCT TYPE

### 18.1 Fintech / Payments

Best archetype: Stripe or Empower.

Use:

- white/navy with violet action for B2B fintech
- dark/yellow for consumer financial confidence
- product panels
- clear CTAs
- compact card radii
- gradients only if product remains readable

Avoid:

- playful color blocks
- unstructured gradients
- yellow text

### 18.2 Playful Consumer Campaign

Best archetype: SquadEasy.

Use:

- big color sections
- huge display type
- lime CTA
- photo cutouts
- black text anchor
- simple components

Avoid:

- subtle shadows
- delicate serif typography
- generic gray UI

### 18.3 AI Builder / Creative Workspace

Best archetype: Base44.

Use:

- pearl canvas
- pastel gradient hero
- lime border/action
- orange illustration accent
- rounded inputs/buttons
- white workspace cards

Avoid:

- neon gradients
- dark heavy sections
- sharp enterprise controls

### 18.4 Enterprise SaaS

Best archetype: Copy.

Use:

- pale blue-gray surfaces
- violet CTA/process
- custom display headings
- 4px controls
- no shadow depth
- structured process cards

Avoid:

- multiple vibrant accents
- playful photos
- random gradients

### 18.5 Brand Launch Page

Choose based on emotional target:

- refined and trusted: Stripe
- playful and human: SquadEasy
- optimistic and creative: Base44
- direct and confident: Empower
- strategic and serious: Copy

---

<a id="checklist"></a>
## 19. QUALITY CHECKLIST

### Color

- [ ] Every bright color has a named role.
- [ ] There is one primary action color.
- [ ] Supporting accents do not compete with CTA.
- [ ] Text contrast is accessible on color surfaces.
- [ ] Gradients are contained.
- [ ] Semantic colors are not used decoratively.

### Typography

- [ ] Type mode matches archetype.
- [ ] Headlines are strong enough for color intensity.
- [ ] Display tracking is tuned.
- [ ] Body copy is not saturated.
- [ ] Custom/display font roles are clear.

### Components

- [ ] Buttons use one shape logic.
- [ ] Inputs remain neutral.
- [ ] Cards match archetype: flat, soft, dark, or precise.
- [ ] Tags use color for classification/state.
- [ ] Hover states stay within palette.

### Layout

- [ ] Colorful moments have rest space.
- [ ] Big color surfaces are limited.
- [ ] Product clarity is not lost inside gradients.
- [ ] Images match the palette.
- [ ] Mobile layout prevents text/color collisions.

### Anti-Generic

- [ ] No generic blue CTA unless blue is explicitly the brand action.
- [ ] No rainbow palette.
- [ ] No decorative gradients everywhere.
- [ ] No all-purpose accent class used on everything.
- [ ] No default Tailwind color soup.

---

<a id="prompting"></a>
## 20. PROMPTING GUIDE

### 20.1 General Prompt

```txt
Design this with a Vibrant Accents system: memorable color, strict accent roles, strong neutral anchor, readable typography, and controlled use of gradients or color blocks. Define one primary action color and keep supporting colors limited to edges, decoration, selected states, or section surfaces. Avoid random rainbow palettes, colored body text, generic blue CTAs, and gradients on every section.
```

### 20.2 Stripe-like Prompt

```txt
Create a refined vibrant product page on a white canvas: navy ink typography, light premium display headings, a Deep Violet primary CTA, washed violet outline buttons, pale blue product cards, and one contained hero/product gradient. Green and orange may appear only as micro edge accents for tags or dividers.
```

### 20.3 SquadEasy-like Prompt

```txt
Create a playful block-color landing page: amber canvas, deep violet cards, electric lime pill CTA, black text, huge bold display typography, and angled photo cutouts that break the grid. Keep surfaces flat and avoid subtle shadows or extra major colors.
```

### 20.4 Base44-like Prompt

```txt
Create a soft AI workspace page: pearl off-white canvas, pastel hero gradients, white cards, black text, lime action/border signal, orange illustration accents, and heavily rounded controls. Keep the color optimistic but airy, not neon.
```

### 20.5 Empower-like Prompt

```txt
Create a dark finance page: Night Sky background, bold condensed typography, one bright yellow pill CTA, dark rounded cards, alternating light sections, and muted yellow callout surfaces. Do not add any other saturated accent.
```

### 20.6 Copy-like Prompt

```txt
Create an enterprise violet SaaS page: pale blue-gray surfaces, Midnight Ink typography, custom display headlines, Violet Impulse primary CTA and process active states, 4px controls, no shadows, and precise spacing.
```

---

<a id="quick-reference"></a>
## 21. QUICK REFERENCE

### 21.1 Archetype Cheat Sheet

| Need | Use | Action | Surface | Shape |
| --- | --- | --- | --- | --- |
| refined product trust | Stripe | violet | white/powder | 4-6px |
| playful human energy | SquadEasy | lime | amber/violet | pill buttons, square cards |
| optimistic AI | Base44 | lime border | pearl/white | soft rounded/pill |
| dark fintech confidence | Empower | yellow | dark/light | pill + 24px |
| enterprise authority | Copy | violet | pale blue-gray | 4px |

### 21.2 Default Values

```txt
Primary accent count: 1
Supporting accent count: 1-3 maximum
Body text color: neutral only
Gradient count per page: 1-2 major uses
Card radius: archetype-specific
CTA hue: never shared with decorative accents unless explicitly designed
Neutral anchor: mandatory
```

### 21.3 Do

- Name every accent role.
- Keep CTA color dominant.
- Use neutral text.
- Build rest space around colorful moments.
- Match typography to color energy.
- Use gradients as contained atmosphere.
- Check contrast.
- Keep hover states inside palette.

### 21.4 Do Not

- Do not make every section colorful.
- Do not use colored body copy.
- Do not add random accent colors.
- Do not make decoration and CTA compete.
- Do not put long paragraphs on gradients.
- Do not use default blue unless it is the brand.
- Do not mix playful and enterprise color logic casually.

### 21.5 Minimum Viable Vibrant Accent System

```css
:root {
  --bg: #ffffff;
  --surface: #f8fafd;
  --surface-2: #e5edf5;
  --ink: #061b31;
  --muted: #50617a;
  --border: #d8d6df;
  --action: #533afd;
  --action-soft: #b9b9f9;
  --edge-green: #81b81a;
  --edge-orange: #ff6118;
  --font: Inter, ui-sans-serif, system-ui, sans-serif;
  --radius-control: 4px;
  --radius-card: 6px;
}

body {
  background: var(--bg);
  color: var(--ink);
  font: 400 14px/1.4 var(--font);
}

h1 {
  font-size: clamp(44px, 7vw, 56px);
  line-height: 1.07;
  letter-spacing: -0.03em;
  font-weight: 300;
}

.button {
  background: var(--action);
  color: white;
  border-radius: var(--radius-control);
  padding: 15px 24px;
}

.card {
  background: var(--surface-2);
  border-radius: var(--radius-card);
  padding: 12px;
}
```

This minimum version gives a clear primary accent, calm neutral base, and enough structure to avoid a random colorful SaaS look.

