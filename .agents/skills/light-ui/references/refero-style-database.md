---
name: light-ui
description: Build modern light interfaces with strong visual identity: quiet white chrome, precise SaaS surfaces, soft glow, control-panel light chassis, and airy component galleries.
version: 1.0.0
tags:
  - design
  - visual-identity
  - light-ui
  - saas
  - dashboard
  - product-design
  - interface-design
  - modern-web
sources:
  - https://styles.refero.design/style/680b0fff-26d0-45c3-808b-d571ff45eb99
  - https://styles.refero.design/style/d0f65d12-a8e6-4631-99f7-bb7cdcd5b6c5
  - https://styles.refero.design/style/ab8450d9-1b42-4395-aa24-9e277f021aa1
  - https://styles.refero.design/style/cf1f4666-bb5b-4fc4-a3e6-660218996cbb
  - https://styles.refero.design/style/ee8698fd-bb1e-4813-9571-5db39e508542
---

# Light UI Design Skill

Light UI is not simply a white background. A good light interface uses brightness
as a system: air, contrast, surfaces, shadows, radius, typography, and accent
discipline. It should feel open and usable without becoming washed out,
generic, or weak.

This skill is based on five Refero source systems:

1. Luma: quiet white UI chrome with a single vivid brand spark.
2. Lightdash: technical SaaS light mode with blueprint precision.
3. Circle: soft galactic gradients around bright community surfaces.
4. Lift-off challenge: light-gray mission-control chassis with dark modules.
5. Tailark Pro: airy component gallery with subtle depth and varied radii.

Together they show that Light UI can be:

- expressive without colorful chrome
- technical without becoming dark mode
- soft without being low contrast
- dense without being claustrophobic
- airy without being empty
- component-rich without becoming noisy

---

## 1. Core Philosophy

Light UI works when the interface creates visual clarity through carefully
controlled brightness. The background is often white or near-white, but the
system still needs a point of view.

The five key questions:

1. What carries the emotion: imagery, accent color, typography, glow, or panels?
2. How do surfaces separate without heavy borders?
3. Which accent is allowed to demand attention?
4. How much radius defines the product personality?
5. What prevents the interface from looking like a default template?

### 1.1 Lightness Has Roles

| Lightness Role | Behavior |
| --- | --- |
| white stage | gives content and imagery space |
| frosted chrome | lets colorful media stand out |
| SaaS canvas | supports cards, dashboards, product proof |
| control chassis | surrounds dark data modules with light structure |
| gallery wall | displays components like artifacts |
| soft glow field | makes a bright product feel futuristic |

Do not choose light mode by default. Choose which light-mode role the product
needs.

### 1.2 The Main Rule

Every light UI needs at least one of these identity anchors:

- a distinctive accent role
- a specific radius system
- a precise type system
- a unique surface/elevation grammar
- a strong media/illustration object
- a modular control-panel structure
- a clear component gallery rhythm

If none of those are present, the UI will look generic.

### 1.3 Avoid Pale Weakness

Light UI often fails because everything becomes pale:

- body text too gray
- borders too faint
- shadows too blurry
- CTAs too soft
- cards indistinguishable from background
- headings too light
- inputs hard to see

The solution is not to make everything dark. The solution is to assign contrast
to the right elements:

- strong text
- clear CTA
- subtle but visible surfaces
- meaningful accent
- focused shadows
- deliberate radius

---

## 2. Source Archetypes

### 2.1 Quiet White Chrome + Vivid Center

Inspired by Luma.

Use for:

- event products
- consumer web apps
- community/productivity tools
- scheduling products
- products with strong 3D or photographic hero media
- apps that need joy without noisy UI

Visual signature:

- pure white background
- warm near-black primary text
- graphite secondary labels
- system font stack
- headline weight 400
- one colored phrase or mark
- dark charcoal CTA
- hero media provides most color
- compact nav

Core tokens:

```css
:root {
  --light-luma-obsidian: #131517;
  --light-luma-graphite: #656768;
  --light-luma-ash: #a5a6a8;
  --light-luma-charcoal: #333537;
  --light-luma-white: #ffffff;
  --light-luma-flamingo: #f31a7c;
}
```

Typography:

- System stack or native-feeling sans.
- Display: `64px`, weight `400`, line-height around `1.03`.
- Body: `16px`, line-height `1.5`.
- Letter-spacing: around `-0.016em`.
- Avoid bold display.

Layout:

- two-column hero
- left text at 40%, right visual at 60%
- `1200px` max width
- nav around `52px` high
- footer as a compact horizontal row

Components:

- charcoal pill CTA, `15px` radius
- event cards with white surface and soft date blocks
- logo with one small gradient mark
- live/ambient time badge in ash gray

Do:

- let one vivid media object carry emotion
- keep the UI chrome achromatic
- use one inline accent phrase at most
- make CTA dark instead of brightly colored
- keep type weight calm

Don't:

- spread the gradient into buttons
- use several accent phrases
- add shadows to the main chrome
- make the system font feel default through weak spacing

### 2.2 Technical SaaS Blueprint Light

Inspired by Lightdash.

Use for:

- analytics platforms
- AI/BI tools
- developer-facing SaaS
- data products
- productivity dashboards
- complex B2B tools that need trust and clarity

Visual signature:

- white and off-white surfaces
- dark neutral text
- electric violet accent
- specialized sans display
- Inter for UI
- mono for code/data
- cards with controlled elevation
- sticky nav
- alternating light section backgrounds

Core tokens:

```css
:root {
  --light-blueprint-ink: #1a1b25;
  --light-blueprint-slate: #272835;
  --light-blueprint-indigo: #36394a;
  --light-blueprint-steel: #666d80;
  --light-blueprint-cloud: #818898;
  --light-blueprint-stone: #a4abb8;
  --light-blueprint-offwhite: #f8fafb;
  --light-blueprint-white: #ffffff;
  --light-blueprint-lava: #eceff3;
  --light-blueprint-ghost: #f6f8fa;
  --light-blueprint-violet: #5e4cff;
}
```

Typography:

- Display headings use a distinct brand sans.
- Body and UI use Inter.
- Technical/code uses IBM Plex Mono.
- Display can reach `76px` with line-height `0.9`.
- Large display tracking can be tight.

Layout:

- contained centered sections
- sticky top bar
- alternating white/off-white bands
- two-column text/product layouts
- `40-64px` section rhythm

Components:

- primary violet button with `8px` radius
- secondary ghost button with dark border
- light chips with `26px` radius
- elevated white cards with subtle shadow stacks
- mono code/data blocks

Do:

- reserve violet for action and emphasis
- use mono type for code and data
- create surface depth through layered shadows
- keep white as the dominant mode
- use controlled card radius

Don't:

- use violet for body text
- add new saturated colors
- overuse dark panels
- use generic typography for brand headings

### 2.3 Soft Galactic Light

Inspired by Circle.

Use for:

- community platforms
- collaboration tools
- creator products
- social learning products
- membership products
- modern SaaS needing warmth

Visual signature:

- white content surfaces
- dark/gradient hero stage
- full pill buttons and inputs
- soft pastel accents
- translucent highlight cards
- Inter everywhere
- rounded cards
- diffused shadows

Core tokens:

```css
:root {
  --light-galactic-ink: #0a0a0a;
  --light-galactic-white: #ffffff;
  --light-galactic-border: #e4e7eb;
  --light-galactic-dark: #191b1f;
  --light-galactic-muted: #737373;
  --light-galactic-indigo: #3e1bc9;
  --light-galactic-sky: #408fed;
  --light-galactic-periwinkle: #e0eafc;
  --light-galactic-lavender: #f2dbf5;
  --light-galactic-peach: #fff0d8;
}
```

Typography:

- Use Inter across all UI.
- Scale from `10px` to `64px`.
- Display around `48px`, line-height `1.21`.
- Weights `400-700`.

Layout:

- `1376px` max width
- full-bleed gradient hero
- centered headline and CTA
- generous `93px` section gaps
- 3-column feature cards
- alternating white and tinted surfaces

Components:

- full pill ghost nav buttons
- pastel filled buttons
- white cards with `20px` radius
- translucent white cards with `24px` radius
- pill inputs with blue focus ring

Do:

- use white surfaces as clarity anchors
- keep all important controls rounded
- use gradients as atmosphere, not every section
- keep type compact and familiar

Don't:

- use sharp corners
- add heavy shadows
- introduce harsh saturated colors
- switch to decorative type

### 2.4 Light Control-Panel Chassis

Inspired by Lift-off challenge.

Use for:

- games
- interactive challenges
- monitoring dashboards
- simulation interfaces
- data/control products
- retro-futuristic tools
- high-stakes flows

Visual signature:

- light gray chassis
- dark embedded display modules
- red critical action
- mono readouts
- digital display numbers
- dense modular layout
- unusual pill/circular controls
- compact spacing

Core tokens:

```css
:root {
  --light-control-panel: #e5e7eb;
  --light-control-display: #11161c;
  --light-control-black: #000000;
  --light-control-white: #ffffff;
  --light-control-graphite: #bbbbbb;
  --light-control-steel: #a3a3a3;
  --light-control-slate: #575c75;
  --light-control-red: #f43325;
  --light-control-blue: #0078a8;
}
```

Typography:

- Proxima Nova-style sans for main UI.
- SF Mono for technical labels and data.
- Doto-style digital display for huge numbers.
- Display can reach `106px`, weight `900`.

Layout:

- full-bleed modular panel
- asymmetric composition
- light chassis around dark modules
- compact gaps around `8px`
- navigation embedded in the UI

Components:

- red lift-off button
- dark interface cards
- mono status indicators
- circular/pill modules
- transparent white-border inputs
- pixel/digital number displays

Do:

- reserve red for critical actions
- keep density high
- use dark displays within light framework
- make technical typography real

Don't:

- use red decoratively
- add generic SaaS spacing
- make every component a normal card
- dilute the mission-control feeling with random colors

### 2.5 Airy Component Gallery

Inspired by Tailark Pro.

Use for:

- UI libraries
- component marketplaces
- illustration galleries
- design systems
- SaaS templates
- asset browsers
- developer tools with visual catalogs

Visual signature:

- white and near-white surfaces
- subtle gray dividers
- small vivid accents inside artifacts
- utility sans typography
- mono labels
- varied radii
- layered soft shadows
- 2/3-column gallery grids
- sticky compact header

Core tokens:

```css
:root {
  --light-gallery-ink: #09090b;
  --light-gallery-white: #ffffff;
  --light-gallery-silver: #e4e4e7;
  --light-gallery-dim: #52525c;
  --light-gallery-charcoal: #404040;
  --light-gallery-steel: #5f5f61;
  --light-gallery-pearl: #848485;
  --light-gallery-cloud: #d4d4d8;
  --light-gallery-violet: #615fff;
  --light-gallery-blue: #2b7fff;
  --light-gallery-emerald: #00d492;
}
```

Typography:

- `ui-sans-serif` for all main UI.
- Geist Mono for labels, code, file types.
- Optional softer body font for descriptions.
- Display around `30px`; body `14px`; caption `10px`.

Layout:

- contained around `1200px`
- modular card gallery
- `8px` element gap
- `48px` section gap
- sticky compact header
- alternate white and pale gray/tinted backgrounds

Components:

- transparent ghost buttons
- pale illustration cards
- elevated white cards with `16px` radius
- top-rounded cards with `32-40px` radius
- translucent inputs
- file badges and technical labels

Do:

- use soft depth, not hard border grids
- vary radius with intent
- keep accents inside artifacts or active states
- use mono for precision

Don't:

- use heavy shadows
- make every radius the same
- add bright colors everywhere
- overuse opaque borders

---

## 3. Choosing The Right Light UI

| Need | Archetype |
| --- | --- |
| consumer app with emotional hero | Quiet White Chrome + Vivid Center |
| analytics / AI / B2B SaaS | Technical SaaS Blueprint Light |
| community / collaboration product | Soft Galactic Light |
| simulator / mission / monitoring UI | Light Control-Panel Chassis |
| UI kit / component gallery | Airy Component Gallery |
| product with strong imagery | Quiet White Chrome |
| data product with code | Technical SaaS Blueprint |
| friendly social dashboard | Soft Galactic Light |
| dense modular control surface | Control-Panel Chassis |
| design-system catalog | Component Gallery |

If the user only says "light modern UI", choose the most practical archetype:
Technical SaaS Blueprint for B2B, Quiet White Chrome for consumer, Airy
Component Gallery for design-system/content catalog.

---

## 4. Color Strategy

### 4.1 Neutral Foundation

Every light UI should define at least five neutral roles:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8fafb;
  --color-text: #111827;
  --color-muted: #667085;
  --color-border: #e4e7eb;
}
```

Then adapt by archetype:

- Luma: warmer text and flatter surfaces.
- Lightdash: more blue-gray neutrals and violet action.
- Circle: white surfaces over atmospheric gradients.
- Lift-off: light gray chassis and dark modules.
- Tailark: many near-white surface levels.

### 4.2 Accent Discipline

Light UI collapses when accents are everywhere.

Choose one primary accent role:

| Accent Role | Example |
| --- | --- |
| logo-only accent | Luma spectrum |
| action accent | Lightdash violet |
| atmospheric gradient | Circle blue-indigo |
| critical state | Lift-off red |
| artifact detail | Tailark violet/blue/emerald |

Rules:

- never use a logo-only accent as UI fill
- never use a critical red as decoration
- never use a primary action color as body text
- never add a second saturated CTA color unless it represents state

### 4.3 White Is Not Enough

Use multiple surface tones:

```css
:root {
  --surface-page: #ffffff;
  --surface-soft: #f8fafb;
  --surface-raised: #ffffff;
  --surface-muted: #eceff3;
  --surface-inset: #f6f8fa;
}
```

Surface roles:

- page canvas
- card fill
- hover fill
- alternating section band
- input fill
- disabled fill
- elevated panel

### 4.4 Dark Modules In Light UI

Dark modules can make light UI stronger when used as:

- code blocks
- data displays
- hero stage
- control panel modules
- contrast sections
- product screenshots

Rules:

- dark modules need clear boundaries
- text inside must be white or high contrast
- do not turn the entire page into dark mode
- use dark modules to emphasize function, not decoration

---

## 5. Typography

### 5.1 Practical Type Systems

Light UI usually needs readability over spectacle.

Common pairings:

| Archetype | Display | Body | Technical |
| --- | --- | --- | --- |
| Luma | system 400 | system | none |
| Lightdash | brand sans | Inter | IBM Plex Mono |
| Circle | Inter | Inter | optional |
| Lift-off | Proxima/Doto | Proxima | SF Mono |
| Tailark | ui-sans | ui-sans | Geist Mono |

### 5.2 Display Size

Light UI display sizes should feel confident but not bloated.

Recommended:

- consumer hero: `56-72px`
- SaaS hero: `64-80px`
- community hero: `48-64px`
- control panel display: `80-112px`
- component gallery display: `28-40px`

### 5.3 Weight

Not every light UI needs bold headings.

Use:

- `400` for calm consumer display
- `500-600` for SaaS headings
- `700` only for strong labels or compact cards
- `900` only for digital/control-panel display

### 5.4 Letter Spacing

Light interfaces can use small negative tracking to feel polished.

Safe values:

- `-0.016em`: native polished consumer UI
- `-0.02em` to `-0.025em`: strong SaaS display
- `0`: body text
- `0.04em` to `0.08em`: labels and mono-like metadata

Avoid:

- negative tracking on tiny labels
- large positive tracking on body text
- inconsistent heading tracking across sections

### 5.5 Mono Usage

Mono type is effective in light UI when it represents:

- code
- file types
- timestamps
- technical labels
- numeric readouts
- command-line snippets
- status rows

Do not use mono type randomly for all headings. It can make the UI feel brittle.

---

## 6. Surface And Elevation

### 6.1 Light Shadow Stack

Use subtle shadows only where elevation has a job.

```css
.card-elevated {
  background: #ffffff;
  box-shadow:
    rgba(39, 40, 53, 0.08) 0 0 0 1px,
    rgba(39, 40, 53, 0.04) 0 8px 24px -12px;
}
```

Rules:

- combine 1px outline shadow with soft depth shadow
- avoid dark blurry shadows
- do not apply strong shadow to every card
- use shadow to show hierarchy, not decoration

### 6.2 Border Vs Shadow

Use borders when:

- interface is technical
- panel density is high
- inputs need clarity
- modules are dark within light chassis

Use shadows when:

- card should float in gallery
- hero product visual needs separation
- soft SaaS surface needs depth

Use neither when:

- a section is pure white chrome
- typography/image already creates hierarchy
- block-level layout is enough

### 6.3 Radius Systems

| Archetype | Radius |
| --- | --- |
| Quiet White Chrome | `8px`, `15px` |
| Technical Blueprint | `8px` buttons, `12-20px` cards, `26px` chips |
| Soft Galactic | `9999px` controls, `20-24px` cards |
| Control Panel | weird large radii, pills, circles, `4px` technical elements |
| Component Gallery | `6px`, `16px`, `32px`, `40px` with variation |

Radius should be consistent by component type, not random.

### 6.4 Near-White Bands

Alternating light bands can help structure content.

Good:

- `#ffffff` page
- `#f8fafb` feature band
- `#eceff3` technical band
- `#f6f8fa` hover/inset

Bad:

- too many indistinguishable whites
- section bands with no content reason
- gray backgrounds that make the UI feel disabled

---

## 7. Layout Patterns

### 7.1 Two-Column Hero With Expressive Visual

Use for Luma-like products.

Structure:

```text
nav
left: headline / body / CTA
right: image, render, product visual
footer or next section hint
```

Rules:

- left column stays quiet
- right column carries color and motion
- CTA is dark or neutral
- body copy max width around `320-420px`
- do not place hero text in a card

### 7.2 SaaS Blueprint Hero

Use for B2B and analytics products.

Structure:

```text
sticky nav
centered or split hero
display heading
short value prop
violet CTA + ghost secondary
product screenshot / diagram / code proof
```

Rules:

- CTA accent must be clear
- product proof should appear above the fold or soon after
- use white/off-white section rhythm
- avoid marketing-only hero with no interface proof

### 7.3 Soft Glow Hero

Use for community and collaboration products.

Structure:

```text
transparent/sticky nav
dark or gradient stage
white text or white card CTA
rounded inputs/buttons
soft translucent cards
```

Rules:

- glow supports mood, not legibility problems
- foreground UI remains white and crisp
- gradients should be limited and purposeful
- use pill controls

### 7.4 Control-Panel Grid

Use for mission-control light UI.

Structure:

```text
light chassis
dark display modules
red critical action
mono labels
numeric readouts
compact controls
```

Rules:

- use 8px gaps
- make modules feel embedded
- red is critical only
- label every dense panel clearly
- use asymmetry carefully

### 7.5 Component Gallery Grid

Use for UI kits, templates, illustration libraries.

Structure:

```text
sticky compact header
hero/title
filter/search
2 or 3 column cards
artifact preview
metadata/action row
```

Rules:

- cards need enough preview area
- shadows should be quiet
- radii can vary by card type
- mono badges help scanning
- avoid huge marketing hero before the gallery

---

## 8. Component Recipes

### 8.1 Charcoal Consumer CTA

```css
.cta-charcoal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 14px 24px;
  border: 0;
  border-radius: 15px;
  background: #333537;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.016em;
}
```

Use when imagery provides color and the button should feel grounded.

### 8.2 Violet SaaS Button

```css
.button-violet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 20px;
  border-radius: 8px;
  background: #5e4cff;
  color: #ffffff;
  font-weight: 500;
}
```

Use for primary conversion in technical SaaS.

### 8.3 Ghost Button

```css
.button-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 20px;
  border: 1px solid #1a1b25;
  border-radius: 8px;
  background: transparent;
  color: #1a1b25;
  font-weight: 500;
}
```

Use as a secondary action near a stronger primary CTA.

### 8.4 Full Pill Community Button

```css
.button-pill-soft {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 14px 28px;
  border: 1px solid #e4e7eb;
  border-radius: 9999px;
  background: #ffffff;
  color: #0a0a0a;
}
```

Use for community/social products with soft tone.

### 8.5 Control Panel Red Action

```css
.button-critical {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  border: 0;
  border-radius: 9999px;
  background: #f43325;
  color: #ffffff;
  font-weight: 700;
}
```

Rules:

- use for one critical action
- do not repeat throughout the page
- pair with clear warning/status text

### 8.6 Gallery Card

```css
.gallery-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    rgba(0, 0, 0, 0.075) 0 0 0 1px,
    rgba(0, 0, 0, 0.065) 0 10px 15px -3px,
    rgba(0, 0, 0, 0.065) 0 4px 6px -4px;
  padding: 32px;
}
```

Use for component artifacts and UI previews.

### 8.7 Top-Rounded Feature Card

```css
.card-top-rounded {
  background: #ffffff;
  border-radius: 40px 40px 0 0;
  padding: 32px 24px 64px;
  box-shadow:
    rgba(0, 0, 0, 0.075) 0 0 0 1px,
    rgba(0, 0, 0, 0.065) 0 1px 3px;
}
```

Use sparingly to create gallery rhythm. Do not apply to every card.

### 8.8 Light Input

```css
.input-light {
  min-height: 44px;
  border: 1px solid #e4e7eb;
  border-radius: 9999px;
  background: #ffffff;
  padding: 0 24px;
  color: #0a0a0a;
}

.input-light:focus {
  outline: 2px solid #539cf2;
  outline-offset: 2px;
}
```

Use for soft SaaS/community products.

### 8.9 Technical Dark Module

```css
.dark-module {
  background: #11161c;
  color: #ffffff;
  border-radius: 24px;
  padding: 16px;
}

.dark-module__label {
  font-family: "SF Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #a3a3a3;
}
```

Use inside a light chassis for control-panel interfaces.

### 8.10 File Badge

```css
.file-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 2px 7px;
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: #404040;
}
```

Use for galleries, file previews, code/product cards.

---

## 9. Navigation

### 9.1 Quiet Consumer Nav

Use:

- logo left
- 2-4 utility links right
- subtle gray text
- optional time/status badge
- white background
- height around `52px`

Avoid:

- many nav items
- heavy borders
- colored nav background
- large CTA if hero already has CTA

### 9.2 Technical SaaS Sticky Nav

Use:

- logo
- product/solutions/docs/pricing links
- primary CTA
- sticky white/backdrop surface
- subtle bottom border or shadow

Rules:

- active states can use violet or dark text
- docs/developer links should be visible
- avoid over-tall nav bars

### 9.3 Soft Community Nav

Use:

- transparent nav over gradient hero
- pill buttons
- background becomes solid on scroll
- mobile nav with large tap targets

### 9.4 Embedded Control Nav

Use:

- in-panel links
- small buttons
- status tabs
- red only for critical action
- no traditional marketing nav if it breaks the cockpit illusion

### 9.5 Gallery Nav

Use:

- sticky compact header
- filters/search
- ghost buttons
- mono labels where useful
- primary nav should not bury the artifact grid

---

## 10. Data And Dashboard Patterns

Light UI is often used for product tools. It needs to handle data gracefully.

### 10.1 Metric Card

Rules:

- strong number
- muted label
- small delta
- white or off-white surface
- 1px subtle border or very soft shadow
- accent only for positive/negative state

### 10.2 Code Block

Use dark or off-white depending on archetype:

- Lightdash: code can sit in dark/indigo or pale card with mono.
- Tailark: code snippets can use mono badges and white cards.
- Control-panel: dark module is preferred.

### 10.3 Table

Light tables need hierarchy:

- header in muted gray
- rows with subtle dividers
- primary values in near-black
- active row with pale fill
- avoid heavy gridlines
- horizontal scroll on mobile

### 10.4 Status Indicators

Use:

- green for success
- red for critical/warning
- blue/violet for active/interactive
- gray for inactive

Rules:

- status color must map to meaning
- never use status colors as decoration
- pair color with text

---

## 11. Imagery And Media

### 11.1 Expressive Hero Media

Use when UI chrome is quiet.

Rules:

- media can be colorful if UI remains neutral
- CTA should not compete with media
- image area can be larger than text area
- avoid additional decorative gradients

### 11.2 Product Screenshots

Use for SaaS and component galleries.

Rules:

- show real interface proof
- keep screenshot readable
- use subtle container shadow or border
- avoid dark blurred decorative screenshot
- don't crop away the important UI

### 11.3 Control-Panel Objects

Use for mission/control interfaces.

Rules:

- modules should look embedded
- labels must be readable
- red controls must stand out
- don't use ornamental 3D assets that break function

### 11.4 Illustrations

Light UI can use illustrations, but:

- they should reveal product/domain
- they should not become random decoration
- they should use the same accent system
- they should not overpower interface hierarchy

---

## 12. Motion

Light UI motion should feel responsive and clean.

Allowed:

- card hover lift
- subtle button press
- hero media movement
- gradient stage movement if slow
- tab/filter transitions
- skeleton loading
- panel reveal

Avoid:

- constant background blobs
- huge bounce animations
- card hover that shifts layout
- excessive parallax
- loading animations that obscure content

Tokens:

```css
:root {
  --light-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --light-fast: 140ms;
  --light-base: 220ms;
  --light-slow: 420ms;
}
```

Hover lift:

```css
.card-hover {
  transition: transform var(--light-base) var(--light-ease),
              box-shadow var(--light-base) var(--light-ease);
}

.card-hover:hover {
  transform: translateY(-2px);
}
```

---

## 13. Accessibility

### 13.1 Contrast

Light UI must not use pale text for body copy.

Use:

- primary text near black
- secondary text not lighter than medium gray
- visible borders on inputs
- focus rings with strong contrast
- color plus label for state

Avoid:

- `#a5a6a8` for body text
- white text on pale pastel
- placeholder-only labels
- low-contrast ghost buttons

### 13.2 Focus States

Focus should be visible and archetype-aware:

```css
:focus-visible {
  outline: 2px solid #5e4cff;
  outline-offset: 2px;
}
```

For control-panel UI, focus can use red only if the focused element is critical.
Otherwise use blue or white outline on dark modules.

### 13.3 Touch Targets

Minimum:

- buttons: 40-44px tall
- pills: 44px preferred
- dense control panel: can be compact, but critical actions must be large
- gallery cards: entire card or clear action area

---

## 14. Anti-Slop Rules

### 14.1 Generic Light UI Slop

Do not:

- use white background plus blue buttons and call it done
- make all text pale gray
- use generic rounded cards everywhere
- add gradient blobs as decoration
- create nested cards
- use huge empty hero without product proof
- overuse emojis or playful icons in professional UIs
- use the same radius for every element when the archetype needs variation

### 14.2 Accent Slop

Do not:

- use Luma spectrum as a full background
- use Lightdash violet on body copy
- use Circle gradients behind every card
- use Lift-off red outside critical states
- use Tailark multiple accents at equal priority

### 14.3 Surface Slop

Do not:

- make shadows too dark
- make borders invisible
- use gray background that feels disabled
- float cards inside bigger cards
- overuse glassmorphism
- rely on blur to create hierarchy

### 14.4 Typography Slop

Do not:

- use weak body contrast
- mix too many fonts
- make mono the default for all content
- bold every heading
- ignore line-height in dense cards
- let button text overflow

---

## 15. Prompt Library

### 15.1 General Light UI Prompt

```text
Design a modern light UI with clear contrast, disciplined accents, white and
near-white surfaces, strong readable typography, subtle depth, and a specific
visual identity. Avoid generic rounded SaaS cards, pale body text, decorative
gradient blobs, nested cards, and random accent colors.
```

### 15.2 Luma-Style Prompt

```text
Design a quiet white consumer app hero where system typography, warm near-black
text, graphite secondary labels, a dark charcoal pill CTA, and one vivid inline
headline accent frame a colorful product render. Keep the UI chrome achromatic
and reserve the gradient for the logo mark only.
```

### 15.3 Lightdash-Style Prompt

```text
Design a technical SaaS light interface with white/off-white surfaces, dark
neutral text, a single electric violet primary action, brand sans headings,
Inter body text, mono code/data labels, 8px buttons, 12-20px cards, and subtle
layered shadows.
```

### 15.4 Circle-Style Prompt

```text
Design a soft community product light UI with white cards over a cool
blue-indigo gradient stage, Inter typography, full pill buttons and inputs,
pastel accent fills, translucent highlight cards, and diffused shadows.
```

### 15.5 Control-Panel Prompt

```text
Design a light gray mission-control interface with a #e5e7eb chassis, dark
#11161c embedded modules, compact 8px gaps, mono technical labels, large digital
readouts, and a single #f43325 critical action button reserved for warnings or
launch actions.
```

### 15.6 Tailark-Style Prompt

```text
Design an airy component gallery with white and near-white surfaces, subtle
layered shadows, utility sans typography, Geist Mono labels, varied card radii
from 6px to 40px, small vivid accents inside artifacts, and compact 8px grid
spacing.
```

### 15.7 Negative Prompt

```text
Do not create a washed-out white page with pale gray text, generic blue buttons,
gradient blobs, nested cards, heavy shadows, random accent colors, or low
contrast controls. Every accent, radius, shadow, and surface must have a role.
```

---

## 16. Page Recipes

### 16.1 Consumer App Landing

Use:

- Quiet White Chrome
- 2-column hero
- dark neutral CTA
- one emotional media object
- short nav
- simple footer

Sections:

1. nav
2. hero
3. event/product card examples
4. social proof
5. final CTA

### 16.2 Technical SaaS Landing

Use:

- Technical Blueprint Light
- clear hero
- product screenshot
- feature cards
- code/data section
- integration proof

Sections:

1. nav
2. hero with CTA pair
3. product proof
4. feature grid
5. data/code section
6. customer/metric strip
7. conversion band

### 16.3 Community Platform

Use:

- Soft Galactic Light
- gradient hero
- white cards
- pill inputs/buttons
- member/content previews

Sections:

1. nav
2. gradient hero
3. community cards
4. feature rows
5. testimonials or member proof
6. CTA

### 16.4 Control Dashboard

Use:

- Light Control-Panel Chassis
- dense modular grid
- dark modules
- status labels
- critical CTA

Sections:

1. status header
2. main module grid
3. critical action panel
4. data readouts
5. logs/history
6. settings

### 16.5 Component Gallery

Use:

- Airy Component Gallery
- filters
- artifact cards
- preview grid
- mono badges

Sections:

1. compact nav
2. gallery header
3. filter/search bar
4. card grid
5. selected detail panel
6. docs/download CTA

---

## 17. Implementation Starter

```css
:root {
  --light-bg: #ffffff;
  --light-surface: #f8fafb;
  --light-card: #ffffff;
  --light-text: #131517;
  --light-muted: #656768;
  --light-border: #e4e7eb;
  --light-accent: #5e4cff;
  --light-critical: #f43325;

  --light-radius-sm: 6px;
  --light-radius-md: 8px;
  --light-radius-lg: 16px;
  --light-radius-xl: 24px;
  --light-radius-pill: 9999px;

  --light-shadow-card:
    rgba(0, 0, 0, 0.075) 0 0 0 1px,
    rgba(0, 0, 0, 0.065) 0 10px 15px -3px,
    rgba(0, 0, 0, 0.065) 0 4px 6px -4px;
}

body {
  margin: 0;
  background: var(--light-bg);
  color: var(--light-text);
  font-family: Inter, system-ui, sans-serif;
}

.light-section {
  padding-block: 72px;
}

.light-card {
  background: var(--light-card);
  border-radius: var(--light-radius-lg);
  box-shadow: var(--light-shadow-card);
}

.light-muted {
  color: var(--light-muted);
}
```

---

## 18. Tailwind Mapping

```js
export const lightUiTheme = {
  colors: {
    bg: "#ffffff",
    surface: "#f8fafb",
    text: "#131517",
    muted: "#656768",
    border: "#e4e7eb",
    violet: "#5e4cff",
    critical: "#f43325",
    darkModule: "#11161c"
  },
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "16px",
    xl: "24px",
    pill: "9999px"
  },
  boxShadow: {
    soft: "rgba(0,0,0,.075) 0 0 0 1px, rgba(0,0,0,.065) 0 10px 15px -3px, rgba(0,0,0,.065) 0 4px 6px -4px"
  }
}
```

Utility patterns:

```html
<button class="rounded-[8px] bg-[#5e4cff] px-5 py-3 text-white">
  Start free
</button>

<div class="rounded-[16px] bg-white shadow-soft">
  ...
</div>

<input class="rounded-full border border-[#e4e7eb] bg-white px-6">

<div class="rounded-[24px] bg-[#11161c] text-white">
  ...
</div>
```

---

## 19. Advanced Pattern Matrix

### 19.1 Light UI Density

| Density | Use | Spacing | Surface |
| --- | --- | --- | --- |
| airy hero | consumer landing | 32-72px | white |
| SaaS feature | B2B product | 40-64px | white/off-white |
| community soft | collaboration | 64-96px | white + gradient |
| control dense | dashboard/simulator | 8-24px | gray chassis + dark modules |
| gallery compact | component library | 8-48px | white cards |

### 19.2 Radius Matrix

| Component | Quiet Chrome | Blueprint | Galactic | Control | Gallery |
| --- | --- | --- | --- | --- | --- |
| button | 15px | 8px | pill | pill/circle | 6px |
| card | 15px | 12-20px | 20-24px | huge/odd | 16-40px |
| input | 8-15px | 0-8px | pill | 0px | 4px |
| chip | 8px | 26px | pill | pill | 4-8px |

### 19.3 Accent Matrix

| Accent | Use | Never Use |
| --- | --- | --- |
| flamingo | one headline phrase | every link |
| violet | primary action | body text |
| gradient | hero atmosphere | all cards |
| red | critical action | decoration |
| emerald | success badge | primary brand fill unless intentional |

### 19.4 Shadow Matrix

| Shadow Type | Use For | Avoid |
| --- | --- | --- |
| none | quiet chrome, control panels | galleries needing depth |
| 1px outline shadow | SaaS cards | critical controls |
| soft stack | gallery cards | dense tables |
| translucent blur | soft glow cards | text-heavy content |
| white glow | control panel pills | standard SaaS cards |

### 19.5 Content Strategy

Light UI should surface proof quickly.

Good proof:

- product screenshot
- event card
- data dashboard
- component preview
- code snippet
- status panel
- gallery artifact

Weak proof:

- abstract blob
- generic laptop mockup
- vague icon grid
- testimonial before explaining the product
- decorative 3D object unrelated to the domain

---

## 20. QA Checklist

### 20.1 Contrast

- Is primary text dark enough?
- Is secondary text readable?
- Are borders visible?
- Are ghost buttons discoverable?
- Are inputs clearly separate from background?

### 20.2 Identity

- Does the UI have a clear archetype?
- Is accent usage disciplined?
- Is the radius system intentional?
- Is typography specific enough?
- Does surface depth match the product tone?

### 20.3 Layout

- Is the first viewport useful, not just empty?
- Does the product proof appear early?
- Do sections have clear rhythm?
- Do cards avoid nesting?
- Does mobile preserve hierarchy?

### 20.4 Interaction

- Are hover states subtle but visible?
- Are focus states strong enough?
- Are critical actions visually unique?
- Does motion avoid layout shift?
- Are disabled states legible?

### 20.5 Responsiveness

- Do card grids collapse cleanly?
- Do pill buttons wrap gracefully?
- Are hero images cropped intentionally?
- Do data modules remain readable?
- Is horizontal scrolling avoided except for tables/code?

---

## 21. Common Fixes

### 21.1 Too Generic

Fix by:

- choosing an archetype
- changing radius system
- defining one accent role
- improving typography hierarchy
- adding product proof
- replacing generic cards with domain-specific modules

### 21.2 Too Pale

Fix by:

- darkening body text
- increasing border contrast
- strengthening CTA fill
- reducing transparency
- increasing card separation

### 21.3 Too Busy

Fix by:

- reducing accent count
- removing nested cards
- limiting shadows
- simplifying background bands
- reducing competing radii

### 21.4 Too Flat

Fix by:

- adding near-white surface levels
- using subtle 1px outline shadows
- adding one elevated hero product card
- using imagery/artifact previews
- improving spacing hierarchy

### 21.5 Too Dark For Light UI

Fix by:

- moving dark elements into modules
- restoring white content surfaces
- reducing dark section count
- using dark only for hero/product proof/data panels

---

## 22. Production Pattern Library

This section turns Light UI into a usable production system. Use it when a page
looks clean but still lacks a strong identity or when the first build feels like
a default SaaS template.

### 22.1 Hero Pattern Matrix

| Hero Type | Use For | Primary Visual | CTA | Surface |
| --- | --- | --- | --- | --- |
| quiet consumer split | events, scheduling, social tools | colorful render/photo | charcoal pill | pure white |
| SaaS proof hero | AI, analytics, B2B | screenshot/diagram | violet button | white/off-white |
| glow community hero | creator/community platforms | gradient stage + white cards | pill CTA | gradient + white |
| control-panel hero | simulations, challenges | dark modules + critical button | red critical | gray chassis |
| gallery hero | UI kits, templates | artifact preview grid | ghost/primary small button | white gallery wall |

Rules:

- hero text should never sit in a decorative card
- product proof should appear in the first viewport or directly after it
- if color is in the media, keep CTA neutral
- if color is in CTA, keep media/surfaces restrained
- if the hero is gradient-heavy, foreground controls must be simple and crisp

### 22.2 Light UI Surface Ladder

A light interface needs visible surface levels. Use a ladder instead of random
near-whites.

```css
:root {
  --surface-canvas: #ffffff;
  --surface-page-soft: #f8fafb;
  --surface-band: #eceff3;
  --surface-card: #ffffff;
  --surface-inset: #f6f8fa;
  --surface-hover: rgba(5, 5, 19, 0.04);
  --surface-active: rgba(94, 76, 255, 0.10);
}
```

Recommended roles:

- `canvas`: default page background
- `page-soft`: broad section background
- `band`: stronger section break or technical band
- `card`: raised content surface
- `inset`: input, code preview, secondary module
- `hover`: temporary interaction feedback
- `active`: selected segment or filter

Avoid using five near-whites if the user cannot tell what each one means.

### 22.3 Card Taxonomy

Use different card types for different jobs.

| Card Type | Visual Treatment | Use |
| --- | --- | --- |
| flat card | white + border | dense information |
| raised card | white + soft shadow | feature/product proof |
| translucent card | white alpha + blur optional | glow/community areas |
| artifact card | white + radius/shadow + preview | component galleries |
| dark module | dark fill inside light page | code/data/control panels |
| top-rounded card | asymmetric radius | gallery rhythm or hero artifact |
| borderless panel | no border, no shadow | quiet chrome or text area |

Do not use raised cards for everything. If all cards float equally, none of
them are important.

### 22.4 Button Priority System

Light UI needs button discipline.

Primary:

- filled accent or charcoal
- highest contrast
- one per section
- clear verb

Secondary:

- ghost or outline
- same height as primary
- less visual weight

Tertiary:

- text link or subtle button
- used for utility actions

Critical:

- red only when destructive, urgent, or mission-critical
- never used for normal marketing CTA

Button copy:

| Weak | Better |
| --- | --- |
| Learn more | View dashboard |
| Get started | Create event |
| Submit | Launch report |
| Click here | Browse components |
| Continue | Continue to checkout |

### 22.5 Input And Form Patterns

Light forms must remain visible without heavy chrome.

Standard SaaS input:

```css
.field {
  min-height: 44px;
  border: 1px solid #e4e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 14px;
  color: #131517;
}

.field:focus {
  outline: 2px solid rgba(94, 76, 255, 0.45);
  border-color: #5e4cff;
}
```

Pill community input:

```css
.field-pill {
  min-height: 48px;
  border: 1px solid #e4e7eb;
  border-radius: 9999px;
  background: #ffffff;
  padding: 0 24px;
}
```

Control-panel input:

```css
.field-panel {
  min-height: 36px;
  border: 1px solid #ffffff;
  border-radius: 0;
  background: transparent;
  color: #ffffff;
  padding: 8px;
  font-family: ui-monospace, monospace;
}
```

Form rules:

- labels must be visible
- placeholder cannot replace label
- errors need text and color
- disabled text must stay readable
- focus states must be obvious
- buttons should not resize during loading

### 22.6 Dashboard Layout Recipe

Use for light SaaS products.

Desktop structure:

```text
sidebar 240-280px
topbar 56-64px
content max width or fluid grid
primary card area
secondary stack
table/list region
```

Surface roles:

- page: off-white
- sidebar: white or soft
- topbar: white with border
- cards: white
- selected nav: pale accent fill
- active action: filled accent

Metrics:

- metric title: `13-14px` muted
- metric value: `28-40px` near-black
- delta: `12-13px` with status color and text
- card padding: `20-28px`
- grid gap: `16-24px`

Dashboard anti-patterns:

- all metric cards equal weight
- pale gray body text
- low contrast charts
- over-rounded table rows
- random accent colors for chart series
- shadows too strong for dense screens

### 22.7 Chart Rules

Charts in light UI should be crisp.

Use:

- pale gridlines
- direct labels when possible
- one highlight color
- neutral context series
- readable axis text
- compact tooltips

Avoid:

- rainbow categorical charts unless categories require it
- gradient chart fills everywhere
- 3D charts
- tiny low-contrast labels
- chart cards with huge empty padding

Chart tokens:

```css
:root {
  --chart-text: #131517;
  --chart-muted: #656768;
  --chart-grid: #e4e7eb;
  --chart-primary: #5e4cff;
  --chart-secondary: #a4abb8;
  --chart-positive: #00d492;
  --chart-warning: #f59e0b;
  --chart-negative: #f43325;
}
```

### 22.8 Tables And Lists

Light UI tables should feel efficient, not sterile.

Table recipe:

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  color: #656768;
  font-weight: 500;
  text-align: left;
  border-bottom: 1px solid #e4e7eb;
  padding: 12px 14px;
}

.table td {
  color: #131517;
  border-bottom: 1px solid #eef0f3;
  padding: 14px;
}
```

Rules:

- use row hover fill, not heavy border
- keep numeric columns aligned
- use monospace only for IDs/code
- status pills should not dominate
- mobile tables need horizontal scroll or card conversion

### 22.9 Empty States

Light empty states often become too cute or too empty.

Good empty state:

```text
short title
one sentence explaining what belongs here
one primary action
optional subtle artifact preview
```

By archetype:

- Luma-like: small event card preview
- Lightdash-like: simple chart/code placeholder
- Circle-like: soft member/avatar card
- Control-panel: dark module saying waiting/no signal
- Tailark-like: artifact/file preview skeleton

Avoid:

- giant illustration with no action
- multiple CTAs
- vague copy
- low contrast placeholder text

### 22.10 Error States

Error states must be visible in light UI.

Rules:

- use text + color
- place error near the failed field/module
- use red only for actual error
- preserve layout width during error message
- avoid tiny error icons without words

Examples:

```css
.field[data-invalid="true"] {
  border-color: #f43325;
}

.field-error {
  color: #b42318;
  font-size: 13px;
  line-height: 1.4;
  margin-top: 6px;
}
```

### 22.11 Loading States

Use loading patterns that match archetype.

Quiet consumer:

- soft skeleton card
- neutral shimmer optional
- no colorful spinner

Technical SaaS:

- skeleton chart/table
- compact loading text
- mono progress for code tasks

Community:

- avatar/card skeletons
- soft pulse

Control panel:

- dark module status: `WAITING`, `SYNCING`, `READY`
- mono spinner or progress bar

Gallery:

- artifact skeleton grid
- fixed dimensions to prevent layout shift

### 22.12 Icon System

Light UI icons should support scanning.

Rules:

- use consistent stroke width
- use muted gray for secondary icons
- use accent only for active/important icons
- avoid decorative icon grids
- align icons to text baseline

By archetype:

- Luma: minimal icons, gray strokes, logo mark is the main icon
- Lightdash: technical icons, violet active states
- Circle: friendly rounded icons
- Lift-off: symbols, warning triangles, data indicators
- Tailark: file icons, artifact icons, mono badges

### 22.13 Badge And Chip System

Badges in light UI can get noisy. Define roles:

| Badge Type | Shape | Color | Use |
| --- | --- | --- | --- |
| status | pill | semantic | success/error/warning |
| category | pill or rounded | gray/soft accent | filters |
| file type | small rounded | dark/colored | artifact metadata |
| count | compact pill | gray | nav/list count |
| critical | pill | red | alert only |

Rules:

- use text labels
- avoid icon-only badges
- keep badge height stable
- do not use many saturated badge colors

### 22.14 Mobile Layout Rules

Mobile light UI should not become a stack of indistinguishable white boxes.

Rules:

- keep section spacing smaller but clear
- use surface bands sparingly
- preserve one strong CTA
- collapse 3-column grids into 1 column
- keep card dimensions stable
- prevent pill button text overflow
- avoid side-by-side controls under 360px

Hero mobile:

- text first unless media is the product
- CTA visible within first screen
- image can crop but must reveal subject
- no giant empty top padding

Dashboard mobile:

- topbar instead of full sidebar
- cards stack in priority order
- tables become scrollable or row cards
- filters move into sheet/drawer

### 22.15 Desktop Wide Rules

On wide desktops, light UI can feel empty. Prevent this with:

- max-width constraints
- multi-column proof sections
- richer product visuals
- side-by-side cards
- wider but not longer line lengths
- subtle background bands

Do not:

- stretch body copy to 1400px
- center tiny content in a huge blank hero
- make screenshots too large to inspect
- let nav links float too far from brand

### 22.16 Brand Adaptation

Light UI can adapt to many brands.

| Brand Tone | Adjust |
| --- | --- |
| playful | add one vivid phrase, soft cards, warmer copy |
| technical | add mono labels, violet/blue accent, precise cards |
| premium | reduce accent, increase whitespace, refine type |
| urgent | use control-panel red only for critical state |
| gallery-like | use white walls, artifact shadows, mono badges |
| community | use pill controls, avatars, translucent cards |
| enterprise | reduce gradients, strengthen proof, conservative accent |

### 22.17 Section Recipes

Feature section:

```text
section bg: white or off-white
intro width: 560-720px
grid: 3 columns desktop, 1 mobile
card padding: 24-32px
heading: 20-24px
body: 14-16px
```

Product proof section:

```text
text column 35-45%
visual column 55-65%
surface: white/off-white
visual frame: subtle border or shadow
CTA/link: accent or text
```

Gallery section:

```text
filter bar
grid gap 8-16px
card preview fixed aspect ratio
metadata row
small action
```

Control section:

```text
light chassis
dark cards
mono labels
critical red action
compact gap
```

### 22.18 Copy System

Light UI copy should be plain and specific.

Good:

- "Create your first event"
- "Explore dashboards"
- "Invite your community"
- "Launch sequence"
- "Browse illustrations"

Weak:

- "Unlock your potential"
- "Experience the future"
- "Beautifully simple"
- "Supercharge collaboration"
- "Seamless workflows"

Tone by archetype:

- Luma: warm, short, human
- Lightdash: precise, technical, product-led
- Circle: welcoming, community-oriented
- Lift-off: urgent, operational, concise
- Tailark: catalog-like, polished, artifact-focused

### 22.19 Landing Page Assembly

Consumer light app:

```text
white nav
split hero with visual
short benefit cards
social proof row
event/product examples
final dark CTA
```

Technical SaaS:

```text
sticky nav
hero with CTA pair
interface proof
feature grid
code/data module
workflow steps
security/integration proof
CTA band
```

Community:

```text
gradient hero
white member/content cards
feature rows
use cases
testimonials
pricing/CTA
```

Control interface:

```text
status strip
module grid
critical action
readouts
logs
settings
```

Gallery:

```text
compact nav
category chips
artifact grid
detail preview
docs/download
```

### 22.20 Final Production Checks

Before delivery, inspect:

- text contrast
- surface separation
- button hierarchy
- radius consistency
- accent discipline
- mobile wrapping
- card nesting
- screenshot readability
- focus states
- loading/error/empty states
- wide desktop density

### 22.21 Domain Token Presets

Use these presets to adapt Light UI quickly without inventing a new system.

Event product:

```css
:root {
  --bg: #ffffff;
  --text: #131517;
  --muted: #656768;
  --soft: #f5f5f7;
  --cta: #333537;
  --accent: #f31a7c;
  --radius-card: 15px;
  --radius-button: 15px;
}
```

Analytics SaaS:

```css
:root {
  --bg: #ffffff;
  --surface: #f8fafb;
  --band: #eceff3;
  --text: #1a1b25;
  --muted: #666d80;
  --accent: #5e4cff;
  --radius-button: 8px;
  --radius-card: 12px;
}
```

Community product:

```css
:root {
  --bg: #ffffff;
  --text: #0a0a0a;
  --muted: #737373;
  --border: #e4e7eb;
  --gradient-start: #408fed;
  --gradient-end: #3e1bc9;
  --soft-accent: #e0eafc;
  --radius-control: 9999px;
  --radius-card: 24px;
}
```

Control panel:

```css
:root {
  --chassis: #e5e7eb;
  --display: #11161c;
  --text: #000000;
  --display-text: #ffffff;
  --muted: #a3a3a3;
  --critical: #f43325;
  --active: #0078a8;
}
```

Component gallery:

```css
:root {
  --bg: #ffffff;
  --surface: #f4f4f5;
  --card: #ffffff;
  --text: #09090b;
  --muted: #52525c;
  --border: #e4e4e7;
  --accent: #615fff;
  --success: #00d492;
}
```

### 22.22 Component Variant Table

| Component | Consumer | SaaS | Community | Control | Gallery |
| --- | --- | --- | --- | --- | --- |
| primary CTA | charcoal 15px radius | violet 8px radius | pastel/pill | red critical pill | compact accent |
| secondary CTA | text/gray | dark outline | white pill outline | ghost text | ghost border |
| card | white 15px | white 12-20px shadow | white/translucent 24px | dark embedded module | white artifact card |
| input | rounded white | 8px or sharp | full pill | transparent on dark | 4px translucent |
| badge | date/status | chip/filter | member/status | mono warning | file type |
| nav | quiet 52px | sticky SaaS | translucent/pill | embedded | compact sticky |

This table prevents mismatched components. For example, a red control-panel CTA
does not belong in a Luma-like consumer hero unless the action is truly urgent.

### 22.23 Section Transition Patterns

Light pages often need rhythm between sections. Use one of these transitions:

White to off-white:

- best for SaaS
- subtle and professional
- use border or top padding to clarify section start

White to gradient:

- best for community/consumer
- use for hero or one feature area
- foreground content must be high contrast

White to dark module:

- best for code, dashboards, control panels
- dark area should have a functional reason
- keep width and padding deliberate

White to gallery grid:

- best for component/product catalogs
- use filters/search to introduce grid
- maintain preview aspect ratios

Avoid:

- every section having a new background
- random diagonal separators
- decorative blob transitions
- dark section with no product reason

### 22.24 Practical Spacing Scale

Use a compact but breathable scale.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

Recommended:

- inline control gap: `8px`
- card internal gap: `12-20px`
- card padding: `20-32px`
- grid gap: `16-24px`
- section gap: `48-96px`
- hero vertical padding: `80-128px`

Control-panel exception:

- element gap: `8px`
- panel padding: `8-16px`
- section gap: `24-48px`

### 22.25 Visual Hierarchy Ladder

When everything is light, hierarchy must come from multiple levers:

1. type size
2. text color
3. surface depth
4. accent
5. spacing
6. radius/shape
7. motion

Use no more than three hierarchy levers for the same element. A primary CTA does
not need large size, saturated color, huge shadow, icon, animation, and gradient
all at once.

### 22.26 Product Proof Patterns

Light UI needs concrete proof early.

Consumer/event proof:

- event card stack
- attendee avatars
- calendar/date module
- ticket/RSVP state

SaaS proof:

- dashboard screenshot
- query/code snippet
- chart with real labels
- integration row

Community proof:

- member cards
- post/comment preview
- course/channel preview
- avatar clusters

Control proof:

- readout module
- status log
- critical action panel
- metric tiles

Gallery proof:

- artifact preview cards
- file badges
- component states
- before/after previews

Avoid showing generic abstract panels when the product has concrete objects.

### 22.27 State System

Define states up front.

```css
:root {
  --state-info: #2b7fff;
  --state-active: #5e4cff;
  --state-success: #00d492;
  --state-warning: #f59e0b;
  --state-danger: #f43325;
  --state-disabled-text: #848485;
  --state-disabled-bg: #f4f4f5;
}
```

Rules:

- active and info can be distinct
- success should not replace primary accent
- danger is not decoration
- disabled must remain legible
- states require text labels in important contexts

### 22.28 Light UI Smell Tests

Ask these questions during review:

- If the accent color is removed, does the layout still have hierarchy?
- If the shadows are removed, do cards still have enough structure?
- If the hero image is missing, does the product still make sense?
- If the page is viewed at 360px, do the pills and headings still fit?
- If the user tabs through controls, is focus visible?
- If color-blind, are status meanings still readable?
- If all cards have the same radius, does the design lose identity?
- If body text is darkened, does the page suddenly become much better?

The last question is especially useful. Many weak light UIs are fixed by simply
using stronger text contrast and clearer borders.

### 22.29 Finish Criteria

Count the style as finished only when:

- one archetype is clearly dominant
- five or fewer neutral tokens carry most surfaces
- one accent role is documented
- primary/secondary/critical actions are distinct
- card hierarchy is not flat
- mobile has been considered
- empty/error/loading states have a matching style
- the page has real proof, not decorative filler
- no nested cards are used as page section wrappers

### 22.30 Anti-Generic Transformation Examples

Use these transformations when a light UI looks competent but forgettable.

Generic SaaS hero:

```text
white page
centered headline
blue button
three rounded cards
abstract gradient blob
```

Transform to Technical Blueprint Light:

```text
white/off-white page
brand sans display headline
violet action + dark ghost secondary
real product screenshot or query builder
mono code/data proof
subtle card shadow stack
```

Generic consumer hero:

```text
white page
headline
colorful button
stock illustration
```

Transform to Quiet White Chrome:

```text
white page
system 400-weight display headline
one inline accent phrase
charcoal CTA
domain-specific event/product card
colorful render or photo carrying emotion
```

Generic dashboard:

```text
gray page
many equal cards
random chart colors
weak labels
```

Transform to Light SaaS Dashboard:

```text
off-white page
white card hierarchy
one accent for active/primary state
neutral chart series with one highlight
dark readable text
compact table/list region
```

Generic component gallery:

```text
large hero
cards with same radius
generic icons
many bright tags
```

Transform to Airy Component Gallery:

```text
compact header
artifact-first grid
fixed preview aspect ratios
mono badges
subtle layered shadows
intentional radius variation
small accents inside previews only
```

### 22.31 One-Screen Audit

In the first viewport, verify:

- the product category is visible
- the primary action is obvious
- there is a real product/domain object
- text contrast is strong
- accent role is clear
- nav is not oversized
- hero spacing does not waste the viewport
- at least a hint of the next section is visible on common desktop heights

For mobile first viewport:

- headline fits without awkward one-word lines
- CTA appears before excessive media
- media subject is not cropped beyond recognition
- pill controls do not overflow
- no text overlaps cards or images

### 22.32 Light UI Final Prompt Combiner

When generating a new design, combine:

```text
[archetype] + [domain proof] + [neutral surface system] + [one accent role] +
[radius grammar] + [component hierarchy] + [anti-slop constraints]
```

Example:

```text
Create a Technical SaaS Blueprint Light landing page for an analytics product.
Use white/off-white surfaces, dark neutral text, a single violet primary action,
brand-sans display headings, Inter body text, mono code snippets, subtle card
shadow stacks, and a real dashboard screenshot above the fold. Avoid pale body
text, generic blue buttons, gradient blobs, nested cards, and decorative icons.
```

---

## 23. Agent Workflow

1. Identify product/domain.
2. Choose light UI archetype.
3. Define neutral roles.
4. Define one accent role.
5. Choose typography stack.
6. Define radius system.
7. Define surface/elevation grammar.
8. Build first viewport with proof.
9. Build components according to archetype.
10. Test contrast and focus states.
11. Remove generic decoration.
12. Verify mobile hierarchy.

Do not begin by making everything white. Begin by deciding what the white space
is doing.

---

## 24. Quick Reference

### Use

- dark text on white
- strong but disciplined accent
- subtle surface levels
- visible focus states
- product proof
- clear radius grammar
- restrained shadows
- readable secondary text

### Avoid

- pale gray body copy
- generic blue buttons
- gradient blobs
- nested cards
- heavy shadows
- random accents
- invisible borders
- huge empty hero

### Final Taste Test

A good Light UI should feel bright, calm, and specific. If it becomes merely
white, pale, and polite, it needs stronger typography, clearer surfaces, or a
more disciplined accent role. The page should feel intentionally illuminated,
not unfinished.
