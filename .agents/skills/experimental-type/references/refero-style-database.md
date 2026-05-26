---
name: experimental-type
description: Build bold, modern, highly specific visual identities where typography is the main expressive material: industrial precision, editorial display, chromatic block systems, type-first brutalism, and specimen-led layouts.
version: 1.0.0
tags:
  - design
  - visual-identity
  - typography
  - experimental-type
  - editorial
  - brutalist
  - product-design
  - web-design
sources:
  - https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf
  - https://styles.refero.design/style/34aa811f-6084-484c-b4c0-f587b514e970
  - https://styles.refero.design/style/76ace78c-94b7-421d-a8fd-47289328458f
  - https://styles.refero.design/style/ec17bdec-c8fa-4221-abd6-da717bf38d96
  - https://styles.refero.design/style/973332dc-4e10-4e90-85d8-3bce9c3cd3ed
---

# Experimental Type Design Skill

Experimental Type is not "use a weird font". It is a complete visual system
where letterforms become structure, navigation, texture, proof, or product
personality. The page should feel unmistakably authored. It should not look like
a default SaaS page with a novelty headline font pasted on top.

Use this skill when a project needs a memorable typographic identity: creative
portfolio, type foundry, design studio, fashion/editorial brand, music tool,
hardware/product catalog, cultural venue, art-tech product, AI brand with a
strong point of view, experimental developer tool, or any website where
typography can carry the brand more powerfully than illustration.

The five source systems studied for this skill:

1. teenage engineering: engineered precision against industrial gray.
2. Charlie: high-contrast editorial experimentalism.
3. TypeList: chromatic interactive blocks.
4. Egstad: type-first brutalism.
5. Sociotype: editorial white canvas.

Together they show five different ways to make typography experimental without
becoming sloppy:

- ultra-light industrial type with square product grids
- extreme display type on black/red editorial fields
- calm type inside full-bleed chromatic block navigation
- massive brutalist type on warm parchment canvas
- invisible UI around large type specimens

---

## 1. Core Philosophy

Experimental Type works when typography is assigned a real job. It can be:

- the hero image
- the navigation system
- the product evidence
- the brand voice
- the content architecture
- the page rhythm
- the motion object
- the contrast device
- the grid generator

It fails when typography is treated as decoration. A strange font alone creates
surface-level novelty. A typographic system creates identity.

### 1.1 The Main Rule

Before designing anything, decide what typography is doing:

| Typographic Role | Page Behavior |
| --- | --- |
| Type as object | gigantic display letters become visual mass |
| Type as interface | links, tabs, filters, and labels carry the visual system |
| Type as specimen | font samples are the product or proof |
| Type as industrial marking | thin technical text behaves like labeling on hardware |
| Type as poster | the page uses full-bleed headline composition |
| Type as block | large text sits inside interactive color fields |
| Type as editorial voice | typography creates cultural credibility |
| Type as constraint | limited palette and strict radius make the type louder |

Never mix all roles at once. Pick one primary role and one supporting role.

### 1.2 What Makes It Modern

Modern experimental typography is controlled. The sources share several modern
qualities:

- tight palette discipline
- explicit type hierarchy
- purposeful line-height
- deliberate tracking
- simple surfaces
- strong geometry
- functional UI around expressive type
- no random ornament
- restrained motion
- clear interaction states

The page can be loud, but the system cannot be random.

### 1.3 Experimental Does Not Mean Unreadable

Unreadable type is only acceptable for decorative specimens, logos, or short
moments where meaning is supported elsewhere. Navigation, body copy, product
details, and calls to action must stay readable.

Use a two-layer typography model:

- expressive display face for identity moments
- stable sans/serif/mono face for functional text

The more experimental the display type becomes, the calmer the functional type
must be.

---

## 2. Source Archetypes

### 2.1 Industrial Thin-Type Precision

Inspired by teenage engineering.

Use this archetype for:

- hardware brands
- product catalogs
- audio/music tools
- industrial design studios
- technical objects
- software that wants engineered calm
- premium electronics

Visual signature:

- light gray canvas
- black ink
- very thin custom type
- square corners
- product grids
- subtle borders
- one blue action color
- flat surfaces
- product imagery as the visual event

Core tokens:

```css
:root {
  --et-industrial-canvas: #f6f8f7;
  --et-industrial-graphite: #0f0e12;
  --et-industrial-ink: #000000;
  --et-industrial-steel: #e5e5e5;
  --et-industrial-smoke: #b2b2b2;
  --et-industrial-blue: #0071bb;
}
```

Typography:

- Display: ultra-light technical sans, around `40px`, line-height `1.11`.
- Body: thin technical sans at `13px`, `19px`, `24px`.
- Weights: keep `100`, `300`, and light regular.
- Avoid bold.

Layout behavior:

- use centered contained sections
- product grids can be square and border-led
- sections may alternate light canvas and graphite
- top bar should feel like a control strip
- leave enough space around thin type

Component behavior:

- CTA text can be blue without a filled button
- product cards stay flat
- buy links remain small and precise
- hover can be a blue color shift
- borders use smoke or steel

Do:

- make the interface feel engineered
- use one chromatic action color
- let product photos create visual weight
- keep edges sharp
- use thin text with enough spacing

Don't:

- add soft SaaS shadows
- make typography heavy
- round product tiles
- use blue for non-interactive decoration
- add playful color

### 2.2 Red/Black Editorial Display

Inspired by Charlie.

Use this archetype for:

- art direction portfolios
- editorial campaigns
- creative directors
- cultural studios
- music/fashion identities
- theatrical product launches
- personal brands with strong attitude

Visual signature:

- black canvas
- white UI
- intense red statement blocks
- enormous condensed/experimental display type
- functional sans for readable UI
- pill navigation
- high-contrast edges
- no shadows

Core tokens:

```css
:root {
  --et-editorial-black: #000000;
  --et-editorial-white: #ffffff;
  --et-editorial-gray: #838383;
  --et-editorial-red: #ff0000;
}
```

Typography:

- Display: huge experimental variable face, `145px` to `360px`.
- Display line-height: around `0.70`.
- Display tracking: very negative, as far as `-0.079em`.
- Functional: readable sans, `19px`, `20px`, `40px`.

Layout behavior:

- full-bleed sections
- content max width around `1300px`
- red blocks should be rare and dramatic
- black sections need white/gray hierarchy
- display type can crop, compress, or dominate

Component behavior:

- ghost pill buttons with white borders
- filled white pill buttons with black text
- footer links in gray
- CTA contrast should be binary and obvious

Do:

- let one display word dominate the page
- use red as a scene change
- keep functional UI readable
- make pill buttons crisp
- use high contrast without gradients

Don't:

- use many accent colors
- add textures
- use generic hero cards
- soften the red
- reduce display type until it feels ordinary

### 2.3 Chromatic Block Typography

Inspired by TypeList.

Use this archetype for:

- directories
- type collections
- playful editorial tools
- cultural indexes
- product finders
- educational references
- interactive archives

Visual signature:

- white canvas
- black text
- large flat color blocks
- simple classic typography
- color as navigation
- square corners
- full-bleed rhythm

Core tokens:

```css
:root {
  --et-block-white: #ffffff;
  --et-block-ink: #15181e;
  --et-block-black: #000000;
  --et-block-gray-a: #e3e3d5;
  --et-block-gray-b: #dcdcdc;
  --et-block-green-gray: #b9d4cd;
  --et-block-violet: #8d7fc8;
  --et-block-yellow: #fff731;
  --et-block-sky: #9dc4f2;
  --et-block-blue: #2772ff;
  --et-block-lime: #dffe5a;
  --et-block-red: #f9423b;
}
```

Typography:

- Functional sans: `16px`, `22px`, `24px`.
- Optional serif contrast: small moments only.
- Weights: `400`, `500`.
- Keep type calm because color is loud.

Layout behavior:

- full-bleed interactive blocks
- sparse header
- low text density
- color sections should feel clickable or categorical
- no gradients
- no radius

Component behavior:

- full-width block links
- black text on colored backgrounds
- minimal nav as text
- blocks use at least `20px` vertical padding
- color should represent content, not decoration

Do:

- use color at large scale
- make blocks interactive
- keep the type neutral
- let square geometry control the palette
- keep the white canvas pure

Don't:

- make tiny rainbow accents
- add shadows
- round the blocks
- use gradients
- pack too much content into each block

### 2.4 Type-First Brutalist Parchment

Inspired by Egstad.

Use this archetype for:

- artists
- independent studios
- editorial portfolios
- type-led brands
- high-attitude personal sites
- experimental agencies
- culture/design objects

Visual signature:

- warm parchment canvas
- black typographic mass
- massive custom display type
- serif body copy
- mechanical pill tabs
- underlines as heavy structure
- extremely small palette

Core tokens:

```css
:root {
  --et-brutalist-parchment: #e2e0d9;
  --et-brutalist-ink: #252422;
  --et-brutalist-black: #000000;
}
```

Typography:

- Display: huge custom face around `399px`.
- Display line-height: around `0.97`.
- Display tracking: about `-0.055em`.
- Body: classic serif at `16px`, line-height `1.2`.
- Labels: technical wide-tracked small text, `12px`, `0.1em`.

Layout behavior:

- hero type can behave as architecture
- huge words can overlap images
- sections can be sparse but visually heavy
- navigation feels like physical tabs
- underlines can be thick, around `4px`

Component behavior:

- active tabs: black fill, parchment text
- inactive tabs: transparent, black text, parchment border
- radius: extreme pill, up to `1440px`
- labels have wide tracking
- no shadows

Do:

- make type massive
- use a tiny palette
- treat tabs as physical controls
- use type scale as layout
- keep body copy old-school and compact

Don't:

- add color
- make the display type polite
- add cards everywhere
- use default link styling
- use the body serif for display

### 2.5 Editorial Specimen White Canvas

Inspired by Sociotype.

Use this archetype for:

- type foundries
- editorial brands
- catalogs
- publishing projects
- design archives
- font marketplaces
- cultural product pages

Visual signature:

- white canvas
- black type
- gray secondary text
- zero radius
- ghost/underlined controls
- huge font specimens
- generous section gaps
- invisible cards

Core tokens:

```css
:root {
  --et-specimen-white: #ffffff;
  --et-specimen-ink: #000000;
  --et-specimen-medium: #818181;
  --et-specimen-light: #d6d6d6;
  --et-specimen-faded: #9d9d9d;
}
```

Typography:

- Functional face for body, nav, controls: `11px` to `40px`.
- Display specimen faces can reach `251px`.
- Small text may use positive tracking.
- Display faces should not be replaced by system defaults.

Layout behavior:

- full-bleed, no fixed max width by default
- huge type specimen is the content
- two-column editorial sections
- section gaps around `120px`
- cards are transparent or absent
- components use text and underlines

Component behavior:

- ghost button: underlined text, no fill
- muted ghost button: gray text and gray underline
- featured card: no background, no border, no shadow
- input: transparent with bottom border

Do:

- let specimens breathe
- keep UI invisible
- use underlines as interaction
- make the type system the product proof
- maintain sharp edges

Don't:

- use saturated CTA colors
- add elevation
- round components
- cluster content
- use generic fonts for display specimens

---

## 3. Choosing The Right Archetype

Use the archetype decision table before starting.

| Project Need | Best Archetype |
| --- | --- |
| physical product, hardware, instruments | Industrial Thin-Type Precision |
| creative portfolio with strong attitude | Red/Black Editorial Display |
| interactive directory or archive | Chromatic Block Typography |
| personal/studio brutalist identity | Type-First Brutalist Parchment |
| type foundry or specimen-led product | Editorial Specimen White Canvas |
| premium minimal product with typographic signature | Industrial or Specimen |
| loud campaign page | Red/Black Editorial |
| playful but refined index | Chromatic Block |
| earthy high-contrast personal site | Brutalist Parchment |

If the project is a normal SaaS dashboard, do not use the loudest version of
this skill. Use only the functional pieces:

- distinctive display heading
- precise label typography
- restrained palette
- clear navigation treatment
- one typographic specimen or diagram

---

## 4. Typography System

Typography is the core material. Define it before color, spacing, or components.

### 4.1 Two-Face Model

Most successful experimental type systems use at least two type roles:

```text
Display Face = identity, emotion, visual mass
Functional Face = reading, navigation, UI, forms
```

Do not ask one wild display face to do everything. If it becomes navigation,
body copy, form labels, and headings, the site becomes exhausting.

Recommended pairing patterns:

| Display Personality | Functional Pair |
| --- | --- |
| condensed variable display | neutral grotesk sans |
| ultra-light technical display | thin technical sans |
| brutal custom serif/sans | classic serif body |
| type specimen rotation | stable sans for UI |
| color-block directory | plain sans plus optional serif |

### 4.2 Scale Strategy

Experimental type needs intentional scale jumps. Avoid smooth generic type
scales where every step feels equally polite.

Use one of these scale strategies:

#### Poster Jump

```text
caption 12-14px
body 16-20px
heading 36-48px
display 140-360px
```

Use for red/black editorial pages and brutalist personal sites.

#### Industrial Compact

```text
caption 13px
body 19px
subheading 24px
heading 26px
display 40px
```

Use for product catalogs, hardware sites, and precision systems.

#### Specimen Giant

```text
caption 11-13px
body 14-16px
heading 26-40px
specimen 180-280px
```

Use for type foundries, typography archives, and specimen-led layouts.

#### Block Directory

```text
body 16px
block text 22-24px
heading 24-36px
hero 44-72px
```

Use for colorful interactive block systems.

### 4.3 Line Height

Experimental display type often needs line-height below normal.

Use:

- `0.70` for compressed poster display
- `0.90-1.00` for huge brutalist display
- `1.00-1.15` for compact headings
- `1.20-1.36` for short UI text
- `1.45-1.60` for longer paragraphs

Never set body copy below `1.2` unless it is extremely short and deliberately
compact. Never apply a display line-height to interface text.

### 4.4 Tracking

Tracking is one of the main expressive controls.

Negative tracking:

- use on huge display type
- keep it visually tested at every viewport
- do not let letters collide unless the font is designed for it
- reduce the negative value on mobile

Positive tracking:

- use on labels, nav, and technical text
- keep it subtle for readability
- avoid huge uppercase tracking unless the brand is deliberately mechanical

Reference behaviors:

| Source | Tracking Behavior |
| --- | --- |
| Charlie | extreme negative tracking on 360px display |
| Egstad | negative display tracking plus positive technical labels |
| Sociotype | positive tracking on small functional text |
| teenage engineering | light, precise technical spacing |
| TypeList | mostly normal tracking to balance color |

### 4.5 Font Feature Settings

Experimental type often relies on OpenType features. Use them intentionally.

Examples:

```css
.display-charlie {
  font-feature-settings: "ss01" 0, "ss02" 0;
}

.body-editorial {
  font-feature-settings: "kern", "liga", "pnum";
}

.technical-label {
  font-feature-settings: "case", "liga", "ss01", "ss02";
}
```

Rules:

- enable kerning and ligatures for editorial body text
- control stylistic sets on display faces
- avoid random feature toggles without visible reason
- document which features belong to which role

### 4.6 Responsive Type

Do not scale font size directly with viewport width. Use fixed breakpoints or
controlled clamps with min/max values and visual QA.

Safe responsive display pattern:

```css
.type-display {
  font-size: clamp(72px, 14vw, 220px);
  line-height: 0.82;
  letter-spacing: -0.05em;
}

@media (max-width: 640px) {
  .type-display {
    font-size: 64px;
    line-height: 0.9;
    letter-spacing: -0.035em;
  }
}
```

For extreme `300px+` display, always define:

- overflow behavior
- max width
- text wrapping strategy
- mobile substitution
- whether cropping is allowed

---

## 5. Color Systems

Experimental Type does not require many colors. In several sources, the fewer
the colors, the more radical the typography feels.

### 5.1 Achromatic Type System

Use for specimen-led pages, editorial systems, and high-trust type brands.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #000000;
  --color-muted: #818181;
  --color-border: #d6d6d6;
  --color-faded: #9d9d9d;
}
```

Best for:

- type foundries
- editorial products
- galleries
- portfolios where the font is the subject

Use color through:

- black/white inversion
- border weight
- muted gray hierarchy
- underline state
- typography scale

Avoid:

- bright CTAs
- gradients
- colored badges
- multi-color icon sets

### 5.2 Industrial Monochrome Plus One Signal

Use for product systems where type should feel engineered.

```css
:root {
  --color-canvas: #f6f8f7;
  --color-ink: #000000;
  --color-dark: #0f0e12;
  --color-line: #b2b2b2;
  --color-soft-line: #e5e5e5;
  --color-signal: #0071bb;
}
```

Rules:

- signal color marks action only
- muted grays create structure
- product images provide richness
- no decorative color spreading

### 5.3 Red Statement System

Use for editorial drama.

```css
:root {
  --color-black: #000000;
  --color-white: #ffffff;
  --color-muted: #838383;
  --color-statement: #ff0000;
}
```

Rules:

- red should create a scene, not decorate every element
- black/white remains the functional palette
- red surfaces should be full-bleed or major blocks
- avoid additional saturated colors

### 5.4 Chromatic Block System

Use for directories, playful archives, and interactive category systems.

```css
:root {
  --block-1: #e3e3d5;
  --block-2: #dcdcdc;
  --block-3: #b9d4cd;
  --block-4: #8d7fc8;
  --block-5: #fff731;
  --block-6: #9dc4f2;
  --block-7: #2772ff;
  --block-8: #dffe5a;
  --block-9: #f9423b;
}
```

Rules:

- colors are surfaces, not accents
- black text must remain readable
- each block should map to a category or action
- no gradients
- no shadows
- no radius unless the specific brand wants softness

### 5.5 Parchment Brutalist System

Use for grounded personal/studio identities.

```css
:root {
  --color-parchment: #e2e0d9;
  --color-ink: #252422;
  --color-black: #000000;
}
```

Rules:

- keep palette tiny
- use type weight and underlines for contrast
- no extra color unless a project-specific reason exists
- parchment should not become beige lifestyle softness

---

## 6. Layout Systems

### 6.1 Poster Hero

Use when the headline is the visual event.

Anatomy:

```text
top nav
small metadata line
massive display word or phrase
short supporting line
primary action or scroll cue
```

Rules:

- the headline can crop, but must feel intentional
- support copy should be plain and readable
- navigation should not compete with the display type
- background should be flat or a single strong surface
- if display type is decorative, repeat the message in readable text

Desktop dimensions:

- top padding: `80-120px`
- display size: `120-360px`
- line-height: `0.70-0.95`
- max support copy width: `520-680px`

Mobile rules:

- reduce negative tracking
- avoid horizontal overflow unless designed
- allow line breaks at meaningful words
- keep CTA visible without scrolling too far

### 6.2 Industrial Product Grid

Use for hardware, tools, instruments, objects, and product catalogs.

Anatomy:

```text
product image
product name
short technical description
small action link
border or divider
```

Rules:

- grid items should be square or predictably rectangular
- product image should sit on a neutral technical field
- action links can be small but must be visible
- use borders instead of shadows
- keep type thin but readable

Good measurements:

- card padding: `18-28px`
- element gap: `12-18px`
- product title: `18-24px`
- action label: `12-14px`
- border: `1px`
- radius: `0px`

### 6.3 Full-Bleed Color Block Flow

Use for interactive directories and playful typographic category systems.

Anatomy:

```text
white intro
color block link
color block link
color block link
white or neutral explanatory section
```

Rules:

- each block should be meaningful
- block order should create rhythm
- type should be centered or aligned consistently
- no card wrappers around blocks
- color changes act as section dividers

Measurements:

- block padding: `20-64px`
- block text: `22-32px`
- mobile block padding: `18-32px`
- gap between blocks: usually `0` or a single border

### 6.4 Type Specimen Gallery

Use for type foundries, font libraries, and typographic showcases.

Anatomy:

```text
family/specimen name
large specimen line
metadata row
small underlined action
```

Rules:

- specimen is the card
- avoid enclosing every specimen in a heavy card
- metadata should be small and precise
- use underlined links instead of button boxes
- let whitespace create separation

Measurements:

- specimen size: `96-280px`
- metadata: `11-14px`
- section gap: `80-140px`
- divider: `1px`
- radius: `0px`

### 6.5 Brutalist Personal Identity

Use for creative personal sites with a strong authorial voice.

Anatomy:

```text
pill tab navigation
huge name or wordmark
portrait/object overlap
short body text
project index
footer with compact links
```

Rules:

- one giant typographic gesture above the fold
- body text can be classic and compact
- tabs should feel tactile
- palette should stay austere
- underlines and borders can be thick

---

## 7. Component Library

### 7.1 Ghost Underline Link

Use for specimen/editorial systems.

```css
.ghost-link {
  color: var(--color-text);
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.16em;
  background: transparent;
  border: 0;
  padding: 0;
}

.ghost-link:hover {
  color: var(--color-muted);
}
```

Use when:

- the UI should remain invisible
- typography is the content
- buttons would feel too heavy

Avoid when:

- the action is the primary conversion on a commercial page
- the link sits inside dense UI and needs stronger affordance

### 7.2 Editorial Pill Button

Use for Charlie/Egstad-like systems where hard typography needs a soft control.

```css
.pill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 7px 20px;
  border: 2px solid currentColor;
  border-radius: 999px;
  font-size: 19px;
  line-height: 1;
  background: transparent;
}

.pill-button[data-filled="true"] {
  background: currentColor;
}
```

Rules:

- radius should be obviously pill-shaped
- border must be crisp
- keep text readable
- do not add shadow
- hover can invert fill or shift opacity

### 7.3 Industrial Text Link

Use for teenage engineering-like systems.

```css
.industrial-link {
  color: var(--color-signal);
  font-size: 13px;
  font-weight: 300;
  line-height: 1.2;
  text-decoration: none;
}

.industrial-link:hover {
  text-decoration: underline;
}
```

Rules:

- signal color means action
- keep it small and precise
- do not turn every text highlight blue

### 7.4 Color Block Link

Use for TypeList-like systems.

```css
.block-link {
  display: block;
  padding: 28px 24px;
  background: var(--block-color);
  color: #15181e;
  border-radius: 0;
  text-decoration: none;
}

.block-link:hover {
  filter: brightness(0.96);
}
```

Rules:

- the entire surface is the action
- black text must be readable
- avoid inner cards
- no shadow
- do not place too many small controls inside the block

### 7.5 Brutalist Tab

Use for warm brutalist personal/studio identities.

```css
.brutalist-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 30px;
  border: 1px solid var(--color-border);
  border-radius: 1440px;
  background: transparent;
  color: var(--color-ink);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.brutalist-tab[data-active="true"] {
  background: var(--color-ink);
  color: var(--color-bg);
  border-color: var(--color-ink);
}
```

Rules:

- active state must be obvious
- radius is extreme
- labels can be wide-tracked
- keep tab group simple

### 7.6 Transparent Specimen Card

Use for foundry/specimen pages.

```css
.specimen-card {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.specimen-card__sample {
  font-size: clamp(80px, 18vw, 251px);
  line-height: 1.05;
}
```

Rules:

- do not frame every specimen
- metadata can use top/bottom border
- let typography define the card boundary

### 7.7 Bottom-Border Input

Use for editorial/specimen systems.

```css
.line-input {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--color-muted);
  border-radius: 0;
  background: transparent;
  padding: 10px 0;
  color: var(--color-text);
}

.line-input:focus {
  outline: none;
  border-bottom-color: var(--color-text);
}
```

Rules:

- label must remain visible
- placeholder cannot replace label
- focus state should be visible
- avoid low contrast gray

---

## 8. Navigation Patterns

### 8.1 Sparse Editorial Top Bar

Use when the page is identity-led.

Structure:

```text
logo/name left
2-4 text links right
optional pill CTA
```

Rules:

- nav must not compete with the hero typography
- text can be small if contrast is high
- active state can be underline, color, or filled pill
- avoid huge mega menus

### 8.2 Industrial Utility Bar

Use for product catalog systems.

Structure:

```text
brand mark
product category links
support/archive/shop links
small action indicator
```

Rules:

- navigation feels like a technical control surface
- hover shifts to signal blue
- border or background shift can separate it from canvas
- labels remain short

### 8.3 Pill Tab Navigation

Use for brutalist personal/studio pages.

Structure:

```text
[All] [Work] [About] [Notes] [Contact]
```

Rules:

- only one active filled state
- inactive tabs can be transparent
- use consistent radius and padding
- maintain adequate tap target

### 8.4 Block Navigation

Use for interactive directories.

Structure:

```text
Full-width color block = link/category
```

Rules:

- block labels must be explicit
- color sequence must have contrast
- hover should not move layout
- if blocks are numerous, add filter or index navigation

---

## 9. Hero Recipes

### 9.1 Engineered Product Hero

Use for industrial precision.

```text
thin nav
small product/category label
centered product image or device
quiet headline
technical description
small signal-blue action
```

Example prompt:

```text
Create a light industrial product hero on #f6f8f7 with ultra-thin technical
typography, square product image stage, black text, steel borders, and one
#0071bb action link. No shadows, no radius, no decorative color.
```

### 9.2 Red Poster Hero

Use for expressive editorial identity.

```text
black or red full-bleed field
huge compressed display word
small readable subtitle
white/black pill navigation
```

Example prompt:

```text
Create a high-contrast editorial hero with a black canvas, white pill controls,
one full-bleed #ff0000 statement band, and a gigantic condensed experimental
display headline with tight negative tracking and 0.7 line-height.
```

### 9.3 Color Block Directory Hero

Use for interactive archives.

```text
white intro
simple headline
short explanation
stack of colored block links
```

Example prompt:

```text
Create an experimental typography directory on a white canvas with calm black
Untitled-style sans text and large full-width square color block links. Use flat
solid colors only, no shadows, no gradients, no rounded corners.
```

### 9.4 Brutalist Nameplate Hero

Use for personal/studio identities.

```text
pill tabs
massive name
portrait or object overlap
short serif statement
project index cue
```

Example prompt:

```text
Create a parchment brutalist identity hero with #e2e0d9 canvas, huge black
custom display typography, tight tracking, mechanical pill tabs, compact serif
body text, and no extra color.
```

### 9.5 Specimen Hero

Use for type foundries and type-led products.

```text
minimal top nav
large type specimen line
metadata
underlined actions
two-column editorial proof
```

Example prompt:

```text
Create a white-canvas type specimen hero with a 220px display sample, black
typography, gray metadata, underlined text actions, zero radius, no cards, and
generous editorial spacing.
```

---

## 10. Surface And Shape Rules

Experimental Type usually prefers flatness.

### 10.1 Radius

Use radius as a meaningful identity signal:

| Archetype | Radius |
| --- | --- |
| Industrial | `0px` |
| Red Editorial | `100px` for buttons only |
| Chromatic Blocks | `0px` |
| Brutalist Parchment | `999px+` for tabs, otherwise minimal |
| Specimen White Canvas | `0px` |

Do not use default `12px` SaaS card radius unless the project explicitly needs
it. Default radius weakens experimental type by making the page look generic.

### 10.2 Borders

Borders are more important than shadows.

Use borders to:

- define product tiles
- underline ghost links
- mark active tabs
- separate metadata rows
- structure color blocks
- create industrial control surfaces

Border weights:

- `1px`: subtle dividers, inputs, specimen metadata
- `2px`: editorial pill buttons
- `4px`: brutalist underlines or major typographic rules

### 10.3 Shadows

Avoid shadows by default.

Allowed only when:

- the project is not pure source-faithful
- a product screenshot needs separation
- the design would otherwise be ambiguous

If used, shadows must be subtle and not become the identity.

### 10.4 Backgrounds

Prefer:

- flat white
- flat black
- flat red
- flat parchment
- flat industrial gray
- flat chromatic blocks

Avoid:

- gradient blobs
- atmospheric bokeh
- soft SaaS gradients
- random noise overlays
- decorative abstract SVGs

---

## 11. Motion Grammar

Experimental type can use motion, but motion must respect legibility.

### 11.1 Allowed Motion

- text reveal by line or word
- color block hover brightness shift
- underline drawing
- tab active indicator movement
- specimen swap/fade
- product image hover zoom under 1.03 scale
- page transitions that preserve reading

### 11.2 Avoid

- bouncing type
- constantly warping letterforms
- hover effects that make text unreadable
- layout shift on hover
- random floating letters
- long intro animations before content appears

### 11.3 Timing

```css
:root {
  --et-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --et-fast: 140ms;
  --et-base: 220ms;
  --et-slow: 460ms;
}
```

Recommended:

- hover: `140-220ms`
- section reveal: `320-520ms`
- specimen transition: `220-360ms`
- color block transition: `140-180ms`

### 11.4 Text Reveal Rules

Use text reveal only for short display copy. Do not reveal body paragraphs line
by line unless the site is an art piece.

Safe reveal pattern:

```css
.reveal-line {
  overflow: hidden;
}

.reveal-line > span {
  display: inline-block;
  transform: translateY(110%);
  transition: transform 460ms var(--et-ease);
}

.is-visible .reveal-line > span {
  transform: translateY(0);
}
```

---

## 12. Accessibility And Readability

Experimental typography still has to work.

### 12.1 Readability Rules

- body text must be at least `14px`, preferably `16px+`
- line-height must support reading
- small uppercase labels need spacing and contrast
- huge display text should not be the only source of meaning
- color blocks must pass contrast checks
- interactive text must have visible hover and focus states

### 12.2 Display Fallbacks

For extreme display type:

- provide readable alt/aria label if text is rendered as image/canvas
- keep actual text in the DOM where possible
- avoid splitting words into inaccessible spans without labels
- define fallback fonts
- test missing-font behavior

### 12.3 Focus States

Experimental pages often forget keyboard focus. Do not.

Recommended:

```css
:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
```

For black/red systems, focus can be white on black or black on red. For
industrial systems, focus can use the blue signal color.

---

## 13. Implementation Starter

Use this as a base for experimental type pages. Replace the font families with
project-specific names.

```css
:root {
  --et-bg: #ffffff;
  --et-text: #000000;
  --et-muted: #818181;
  --et-border: #d6d6d6;
  --et-accent: #ff0000;

  --et-display: "Display Experimental", "Arial Narrow", sans-serif;
  --et-body: "Functional Sans", system-ui, sans-serif;
  --et-serif: "Editorial Serif", Georgia, serif;

  --et-radius-none: 0px;
  --et-radius-pill: 999px;

  --et-gap-xs: 8px;
  --et-gap-sm: 12px;
  --et-gap-md: 20px;
  --et-gap-lg: 40px;
  --et-gap-xl: 80px;
  --et-gap-xxl: 120px;
}

body {
  margin: 0;
  background: var(--et-bg);
  color: var(--et-text);
  font-family: var(--et-body);
  text-rendering: geometricPrecision;
}

.et-display {
  font-family: var(--et-display);
  font-size: clamp(80px, 16vw, 240px);
  line-height: 0.85;
  letter-spacing: -0.055em;
  font-weight: 400;
}

.et-body {
  font-family: var(--et-body);
  font-size: 16px;
  line-height: 1.45;
  letter-spacing: 0;
}

.et-label {
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.et-section {
  padding-block: var(--et-gap-xxl);
}

.et-link {
  color: currentColor;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
```

---

## 14. Tailwind Starter

Use this conceptual mapping when building with utility classes.

```js
export const experimentalTypeTheme = {
  colors: {
    ink: "#000000",
    paper: "#ffffff",
    muted: "#818181",
    line: "#d6d6d6",
    red: "#ff0000",
    blue: "#0071bb",
    parchment: "#e2e0d9",
    graphite: "#0f0e12"
  },
  borderRadius: {
    none: "0px",
    pill: "999px",
    brutal: "1440px"
  },
  fontFamily: {
    display: ["Display Experimental", "Arial Narrow", "sans-serif"],
    body: ["Functional Sans", "system-ui", "sans-serif"],
    serif: ["Editorial Serif", "Georgia", "serif"],
    mono: ["JetBrains Mono", "monospace"]
  }
}
```

Suggested utility patterns:

```html
<!-- Poster display -->
<h1 class="font-display text-[140px] leading-[.76] tracking-[-.06em]">
  Signal
</h1>

<!-- Ghost underline action -->
<a class="text-current underline underline-offset-[3px] decoration-[1px]">
  View specimen
</a>

<!-- Editorial pill -->
<button class="rounded-full border-2 border-current px-5 py-2 text-[19px]">
  Index
</button>

<!-- Industrial link -->
<a class="text-[13px] font-light text-[#0071bb]">
  buy now
</a>

<!-- Color block -->
<a class="block rounded-none bg-[#fff731] px-6 py-8 text-[#15181e]">
  Variable serif experiments
</a>
```

---

## 15. Composition Recipes

### 15.1 Type Over Image

Use carefully. Type can overlap image when the brand is editorial or brutalist.

Rules:

- image should be simple enough to preserve letterform clarity
- use strong contrast or masking
- if overlap reduces readability, provide duplicate readable text nearby
- avoid soft drop shadows
- align overlap to a grid or deliberate crop

### 15.2 Type As Divider

Large typography can divide sections.

Pattern:

```text
Section A content
Huge word spanning viewport
Section B content
```

Use for:

- portfolios
- type foundries
- cultural campaigns
- brand narratives

Avoid for:

- dense SaaS dashboards
- support pages
- checkout flows

### 15.3 Metadata As Texture

Small labels can create typographic texture.

Use:

- font family name
- weight range
- year
- category
- product model
- version
- index number

Rules:

- metadata must be real
- don't invent fake details
- keep spacing consistent
- use muted color or small positive tracking

### 15.4 Full-Bleed Wordmark

Use when the name is the identity.

Rules:

- wordmark can exceed viewport width
- crop intentionally
- control line-height tightly
- provide responsive alternate
- do not place busy UI on top

### 15.5 Typographic Index

Use for lists of projects, fonts, products, or references.

Pattern:

```text
01  Project Name          Category        Year
02  Project Name          Category        Year
03  Project Name          Category        Year
```

Visual treatment:

- thin dividers
- hover underline or color shift
- large row height if type is expressive
- compact row height if type is industrial
- no heavy cards

---

## 16. Page-Type Recipes

### 16.1 Portfolio

Best archetypes:

- Red/Black Editorial Display
- Type-First Brutalist Parchment
- Editorial Specimen White Canvas

Sections:

1. typographic nameplate
2. short positioning statement
3. project index
4. featured case with huge type
5. about/manifesto
6. contact as underlined text or pill

Avoid:

- generic project cards with rounded thumbnails
- long marketing hero copy
- decorative icon grids

### 16.2 Type Foundry

Best archetype:

- Editorial Specimen White Canvas

Sections:

1. specimen hero
2. family list
3. featured typeface
4. glyph/sample interaction
5. licensing/pricing
6. documentation/download

Rules:

- specimen text must be editable or varied if possible
- metadata must be legible
- UI should not overpower type

### 16.3 Product Catalog

Best archetype:

- Industrial Thin-Type Precision

Sections:

1. product/product family hero
2. precise category navigation
3. grid of products
4. technical detail block
5. purchase/support links
6. footer utility links

Rules:

- use product image as focal point
- keep link labels short
- use one action color
- avoid lifestyle clutter

### 16.4 Interactive Directory

Best archetype:

- Chromatic Block Typography

Sections:

1. simple explanatory hero
2. colored category blocks
3. filter/search
4. item list
5. about/method note

Rules:

- color should map to category or mood
- blocks should be tappable
- type should stay readable over color

### 16.5 Campaign Page

Best archetype:

- Red/Black Editorial Display

Sections:

1. poster hero
2. dramatic statement block
3. proof or gallery
4. short details
5. conversion/action

Rules:

- one major color shock
- huge type is allowed
- keep copy concise
- do not over-explain

---

## 17. Anti-Slop Rules

These are hard rules. Violating them makes the page look like generic AI design.

### 17.1 Typography Slop

Do not:

- use a default Google font and call it experimental
- use more than three typefaces without a system
- apply display font to body copy
- use giant type without controlling line-height
- use negative tracking on small text
- ignore mobile line breaks
- make navigation unreadable
- fake type specimens with meaningless words everywhere

### 17.2 Color Slop

Do not:

- add random gradients
- add rainbow accents outside block systems
- add neon unless the selected archetype supports it
- use red as a button color in every section
- use low contrast gray body text
- mix parchment, red, blue, and block colors without a clear reason

### 17.3 Layout Slop

Do not:

- wrap every section in a rounded card
- use generic bento grids
- place hero text in a card
- use floating orb decorations
- use stock illustrations as filler
- create nested card surfaces
- let text overflow buttons or blocks

### 17.4 Interaction Slop

Do not:

- move layout on hover
- hide focus states
- animate every letter constantly
- use button labels like "Learn more" everywhere
- make color blocks non-clickable if they look clickable
- use ambiguous ghost links without underline or hover state

---

## 18. Detailed Pattern Library

### 18.1 Display Word Stack

Use for a bold hero with multiple short words.

```text
WORD
WORD
WORD
```

Rules:

- use one display face
- align to left or center, not random
- line-height below `0.9`
- negative tracking only if the font supports it
- keep supporting copy outside the stack

### 18.2 Cropped Type Banner

Use for editorial pages where type becomes texture.

Rules:

- crop at top/bottom intentionally
- keep enough letters visible for recognition
- use `overflow: hidden`
- avoid hiding the only meaningful text

### 18.3 Type-First Split

Use when a page needs content and specimen simultaneously.

```text
left: explanation and metadata
right: huge specimen or product image
```

Rules:

- one side should dominate
- keep gutters large
- align metadata to specimen baseline if possible
- collapse to stacked mobile layout

### 18.4 Mechanical Tab Strip

Use for tactile brutalist navigation.

Rules:

- tab radius very high
- active tab has filled state
- inactive tab uses border
- equal padding
- small tracked labels

### 18.5 Chromatic Row Index

Use when each list item has a color identity.

Rules:

- each row is a flat color band
- text stays black or white based on contrast
- hover can slightly dim
- row height must allow tap target
- avoid gradients

### 18.6 Industrial Product Label

Use for technical product cards.

```text
MODEL
short descriptor
buy now
```

Rules:

- title `18-24px`
- descriptor `13-15px`
- action in signal color
- border in muted gray
- square corners

### 18.7 Specimen Metadata Row

Use for foundry pages.

```text
Family        Weight        Styles        Year
```

Rules:

- small functional type
- thin top/bottom border
- align columns
- allow horizontal scroll on mobile if needed

### 18.8 Editorial Red Break

Use to punctuate black/white systems.

Rules:

- use once or twice maximum
- full-bleed red surface
- black or white display type
- no additional decorative layer

### 18.9 Invisible Feature Card

Use when the content is typography itself.

Rules:

- transparent background
- no border unless it is a divider
- no shadow
- title/specimen carries hierarchy
- link uses underline

### 18.10 Typographic Footer

Experimental type footers should not become generic.

Options:

- huge wordmark footer
- compact utility grid with small technical type
- underlined editorial links
- black inverted footer with gray links
- parchment footer with pill contact button

Avoid:

- four-column SaaS footer with generic headings
- social icons without typographic integration
- huge newsletter card with rounded corners

---

## 19. Prompt Library

### 19.1 General Experimental Type Prompt

```text
Design a modern experimental typography website where type is the primary visual
system. Use one expressive display face for identity moments and one stable
functional face for UI. Build with flat surfaces, strict palette discipline,
clear interaction states, strong line-height/tracking control, and no generic
rounded SaaS cards.
```

### 19.2 Industrial Prompt

```text
Design an industrial typographic product catalog inspired by engineered
hardware. Use #f6f8f7 canvas, black text, steel gray borders, ultra-light
technical typography, square product grids, no shadows, no radius, and one
#0071bb action color only for interactive links.
```

### 19.3 Red Editorial Prompt

```text
Design a black and white editorial identity site with one intense #ff0000
full-bleed statement section, huge condensed experimental display typography,
very tight tracking, pill navigation buttons, readable neutral sans body text,
and no gradients or decorative shadows.
```

### 19.4 Chromatic Block Prompt

```text
Design a type directory built from full-width chromatic interactive blocks on a
white canvas. Use calm black sans typography, square corners, flat solid colors,
large tappable block rows, and no shadows, gradients, or card wrappers.
```

### 19.5 Brutalist Parchment Prompt

```text
Design a type-first brutalist personal site on a warm #e2e0d9 parchment canvas
with massive black custom display typography, compact serif body copy,
mechanical pill tabs, thick underlines, a tiny monochrome palette, and no
decorative color.
```

### 19.6 Specimen Prompt

```text
Design a white-canvas type foundry page where large font specimens are the main
content. Use black text, gray metadata, zero radius, transparent cards,
underlined ghost links, generous 120px section rhythm, and invisible UI around
the typography.
```

### 19.7 Negative Prompt

```text
Do not use generic SaaS bento cards, random gradients, gradient blobs, stock
illustrations, multiple decorative accent colors, weak low-contrast body text,
default Google-font styling, unreadable navigation, nested cards, or display
type without responsive line-break control.
```

---

## 20. QA Checklist

### 20.1 Identity

- Does the page have a distinct typographic point of view?
- Is the display face doing a real job?
- Is the functional face readable?
- Is the palette disciplined?
- Does the layout feel authored rather than template-based?

### 20.2 Type

- Are display line-height and tracking intentionally set?
- Are mobile line breaks checked?
- Are large words allowed to crop only when intended?
- Is body copy readable?
- Are labels legible?
- Are font fallbacks defined?

### 20.3 Components

- Do buttons match the archetype?
- Are links visibly interactive?
- Are focus states visible?
- Are cards avoided unless necessary?
- Are borders/shapes consistent?
- Does radius match the system?

### 20.4 Layout

- Is spacing creating rhythm?
- Is there one primary visual gesture?
- Are sections separated without decorative filler?
- Does the page work at mobile widths?
- Are color blocks or type specimens meaningful?

### 20.5 Accessibility

- Does text meet contrast requirements?
- Are interactive areas large enough?
- Is keyboard navigation visible?
- Does any image/canvas type have accessible text?
- Are hover-only meanings also available through text/state?

---

## 21. Common Fixes

### 21.1 Page Feels Like A Generic Template

Fix by:

- increasing the role of display type
- removing generic cards
- creating a stricter palette
- changing button shape to match archetype
- adding real typographic metadata
- making one section full-bleed

### 21.2 Page Feels Unreadable

Fix by:

- reducing display type usage
- adding a functional typeface
- increasing body line-height
- reducing negative tracking on smaller text
- adding readable duplicate copy
- improving contrast

### 21.3 Page Feels Random

Fix by:

- choosing one archetype
- reducing typefaces
- reducing colors
- unifying radius
- using one interaction style
- removing decorative objects

### 21.4 Page Feels Too Quiet

Fix by:

- increasing display scale
- adding a type specimen
- using one full-bleed statement block
- strengthening tracking/line-height contrast
- using larger metadata rows
- adding stronger black/white contrast

### 21.5 Page Feels Too Loud

Fix by:

- limiting expressive type to hero and section breaks
- moving body copy to a stable face
- reducing accent surfaces
- adding more white/black/neutral space
- lowering motion intensity
- simplifying navigation

---

## 22. Advanced System Matrices

Use these matrices when the first pass feels close but not specific enough. The
goal is to turn typographic taste into repeatable choices.

### 22.1 Type Role Matrix

| Role | Best For | Scale | Color | Interaction |
| --- | --- | --- | --- | --- |
| identity wordmark | studios, portfolios, campaigns | huge | black, white, red, parchment | static or subtle reveal |
| product label | hardware, catalogs | small-medium | black plus signal blue | hover color shift |
| category block | directories, archives | medium | flat chromatic surfaces | full-block hover |
| specimen proof | foundries, typography products | huge | black/white/gray | editable sample, underline action |
| navigation texture | portfolios, editorial systems | small | white/black/gray | pill or underline |
| metadata layer | indexes, catalogs, technical pages | tiny | muted gray or black | row hover |
| poster statement | campaigns, launches | huge | red/black/white | scroll reveal |
| mechanical control | brutalist pages | small tracked | black/parchment | filled active tab |

### 22.2 Archetype Mixing Rules

Mixing is allowed only when roles are separated. Do not blend visual languages
randomly.

Safe combinations:

- Industrial Thin-Type Precision + Specimen White Canvas: technical foundry or
  productized type tool.
- Red/Black Editorial + Specimen White Canvas: campaign page for a type release.
- Brutalist Parchment + Specimen White Canvas: personal designer/type studio.
- Chromatic Block + Specimen White Canvas: archive or directory with type proof.
- Industrial Thin-Type + Chromatic Block: playful hardware archive, only if the
  blocks are clearly categorical.

Risky combinations:

- Red/Black Editorial + Chromatic Block: can become too loud unless red is used
  as one block among many or the palette is heavily reduced.
- Brutalist Parchment + Industrial Thin-Type: can clash because one wants huge
  dense type and the other wants thin precision.
- Red/Black Editorial + Industrial Blue: can feel arbitrary unless blue is a
  product/status signal and red is a campaign scene.

Never combine:

- all five palettes
- all five radius systems
- multiple display faces at huge scale without a specimen reason
- color-block playfulness with enterprise SaaS cards

### 22.3 Breakpoint Behavior

Experimental type needs explicit responsive rules.

Desktop:

- allow huge display type
- use full-bleed sections
- keep metadata in rows
- use multi-column specimen layouts
- allow controlled cropping

Tablet:

- reduce display size by at least one step
- keep two columns only if both remain readable
- turn complex metadata grids into two-line rows
- keep interactive blocks full width

Mobile:

- reduce negative tracking
- increase line-height slightly
- avoid tiny labels below `11px`
- stack tabs with horizontal scroll if needed
- convert huge wordmarks into 2-4 line compositions
- preserve CTA visibility

Mobile anti-patterns:

- a 300px display word overflowing unintentionally
- pill tabs wrapping into uneven blobs
- color block labels breaking into one-letter columns
- underlined links too close together
- specimens cropped so only abstract marks remain

### 22.4 Responsive Display Recipes

Poster display:

```css
.poster-display {
  font-size: 180px;
  line-height: 0.72;
  letter-spacing: -0.075em;
}

@media (max-width: 900px) {
  .poster-display {
    font-size: 112px;
    letter-spacing: -0.055em;
  }
}

@media (max-width: 520px) {
  .poster-display {
    font-size: 68px;
    line-height: 0.86;
    letter-spacing: -0.035em;
  }
}
```

Specimen display:

```css
.specimen-display {
  font-size: clamp(84px, 20vw, 251px);
  line-height: 1.05;
  letter-spacing: 0.001em;
}
```

Industrial heading:

```css
.industrial-heading {
  font-size: 40px;
  line-height: 1.11;
  font-weight: 300;
}

@media (max-width: 520px) {
  .industrial-heading {
    font-size: 30px;
    line-height: 1.16;
  }
}
```

Brutalist wordmark:

```css
.brutalist-wordmark {
  font-size: clamp(96px, 28vw, 399px);
  line-height: 0.97;
  letter-spacing: -0.055em;
}
```

### 22.5 Content Density Matrix

| Density | Use For | Type Size | Spacing | Components |
| --- | --- | --- | --- | --- |
| sparse poster | campaign, portfolio hero | huge | very large | minimal nav, one CTA |
| editorial specimen | foundry, publication | huge + small metadata | large | underlined links |
| product catalog | hardware, tools | compact | medium | grids, small action links |
| interactive archive | directory | medium blocks | low gap | full-width blocks |
| brutalist identity | personal/studio | huge + compact serif | tight/medium | pill tabs |

Do not use sparse poster density for data-heavy tools. Do not use product
catalog density for a pure art direction portfolio.

### 22.6 Copywriting For Experimental Type

Type-led pages need compact, concrete copy.

Good copy traits:

- short nouns
- concrete categories
- product/model language
- confidence without hype
- poetic only where the brand supports it
- labels that sound like part of the system

Weak phrases:

- "unlock creativity"
- "future-forward experiences"
- "beautiful digital products"
- "seamless design"
- "supercharge your workflow"
- "next-generation platform"

Better alternatives:

| Weak | Stronger |
| --- | --- |
| Creative digital experiences | Type systems for cultural software |
| We build brands | Identity, interface, and printed matter |
| Explore our work | Index 2019-2026 |
| Learn more | Read the specimen |
| Get started | Start a license |
| View products | View instruments |
| Our services | Direction / Type / Systems |

### 22.7 Project Index Recipe

Experimental type often shines in indexes.

Markup pattern:

```html
<a class="project-row" href="#">
  <span class="project-row__number">01</span>
  <span class="project-row__title">Signal Archive</span>
  <span class="project-row__meta">Identity</span>
  <span class="project-row__year">2026</span>
</a>
```

CSS pattern:

```css
.project-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 160px 72px;
  gap: 16px;
  align-items: baseline;
  padding: 18px 0;
  border-top: 1px solid currentColor;
  color: inherit;
  text-decoration: none;
}

.project-row__title {
  font-family: var(--et-display);
  font-size: 42px;
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.project-row__meta,
.project-row__year,
.project-row__number {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Mobile:

- title spans full width
- metadata moves below
- row height increases
- avoid four tiny columns

### 22.8 Specimen Tester Recipe

For type foundry/tool pages, an editable specimen tester creates function and
identity at the same time.

Required controls:

- text input or contenteditable sample
- size slider
- weight selector if variable
- style selector
- reset button
- metadata display

Visual rules:

- controls must be quieter than specimen
- sliders can be simple black lines
- avoid colorful UI chrome
- specimen should update without layout collapse
- provide sensible default text

Component structure:

```text
metadata row
large editable specimen
control row
underlined action links
```

### 22.9 Color Block Accessibility Matrix

For every chromatic block, choose text color deliberately.

| Background | Default Text |
| --- | --- |
| yellow `#fff731` | black |
| lime `#dffe5a` | black |
| sky `#9dc4f2` | black |
| violet `#8d7fc8` | black, test contrast |
| electric blue `#2772ff` | white or black after contrast test |
| flame red `#f9423b` | black or white after contrast test |
| gray-green `#b9d4cd` | black |
| textured gray `#e3e3d5` | black |

Rules:

- do not assume all bright colors need white text
- test actual contrast
- use one text color per block
- avoid overlay gradients to fix contrast unless the block system supports it

### 22.10 Type As Image Without Images

Use CSS and text before rasterizing type.

Techniques:

- giant wordmark
- variable font axis changes
- outline text
- text clipping inside container
- repeated specimen rows
- glyph grid
- metadata texture
- character-scale pattern

Avoid:

- raster text that cannot scale
- screenshots of typography when live text would work
- canvas text without accessibility

### 22.11 Font Loading Rules

Experimental typography is fragile if fonts load late.

Rules:

- preload critical display fonts
- define fallback metrics as close as possible
- avoid layout jump in hero
- use `font-display: swap` for body, but consider `optional` only for non-core
  decorative faces
- do not hide the whole page while fonts load
- test missing font state

CSS:

```css
@font-face {
  font-family: "Display Experimental";
  src: url("/fonts/display.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### 22.12 Font Fallback Matrix

| Source Mood | Fallback |
| --- | --- |
| ultra-light industrial sans | Inter, Helvetica Neue, Arial, sans-serif |
| condensed editorial display | Bebas Neue, Impact, Arial Narrow, sans-serif |
| classic editorial body | Georgia, Times New Roman, serif |
| neutral block UI | system-ui, Inter, sans-serif |
| technical label | JetBrains Mono, SF Mono, monospace |
| type specimen | do not fake; use closest bundled display face |

Fallbacks should preserve layout more than personality. If personality is lost,
the page should remain functional.

### 22.13 Print-Inspired Grid

Experimental Type often benefits from print-like grids.

Grid patterns:

- 12-column editorial grid
- 4-column metadata grid
- full-bleed poster field
- two-column specimen/detail split
- baseline-aligned project index

Rules:

- use consistent outer margins
- allow type to break the grid only intentionally
- align metadata to typographic baselines
- keep gutters generous around huge display

Desktop margins:

- dense catalog: `24-48px`
- editorial: `48-96px`
- poster: `24-64px`
- specimen: `32-80px`

Mobile margins:

- `16-24px`
- avoid zero side padding for readable text
- full-bleed color blocks may go edge-to-edge

### 22.14 CTA Strategy

Experimental type CTAs are usually not generic blue buttons.

CTA patterns:

- underlined text action
- pill outline/fill
- small signal-blue product link
- entire color block
- black/white inversion
- mechanical tab/action

Choose CTA by archetype:

| Archetype | Primary CTA |
| --- | --- |
| Industrial | small blue text link or precise outlined action |
| Red Editorial | white filled pill or outlined pill |
| Chromatic Block | full-block link |
| Brutalist Parchment | black filled pill |
| Specimen Canvas | underlined text link |

Avoid:

- default blue rounded rectangle
- multiple conflicting CTAs
- CTA hidden inside huge display text

### 22.15 Icon Strategy

Use icons sparingly.

Allowed:

- small arrows
- plus/minus controls
- filter/search icons
- audio/product control symbols
- simple glyph-like marks

Avoid:

- large decorative icon grids
- generic feature icons
- colorful icon sets
- icons that compete with type specimens

If using icons, match stroke/weight to typography:

- industrial: thin strokes
- editorial red/black: bold simple strokes
- specimen: underlined text may replace icons
- brutalist: heavy black simple marks
- chromatic block: icons usually unnecessary

### 22.16 Image Strategy

Images should support the typographic system.

Use:

- product photos on neutral backgrounds
- portraits that interact with wordmarks
- type specimen previews
- glyph sheets
- scanned/printed matter only if relevant

Avoid:

- generic abstract 3D objects
- stock office photos
- decorative gradients
- unrelated lifestyle imagery

Image treatments:

- square industrial frame
- full-bleed editorial crop
- transparent specimen card
- portrait overlap with huge wordmark
- color block without image

### 22.17 Error And Empty States

Even experimental pages need system states.

Error state:

- keep typography readable
- use palette-consistent color
- red only if red is meaningful and contrast is clear
- name the failed action

Empty state:

- use type as structure
- include one next action
- avoid cute illustration unless brand supports it

Loading:

- skeletons can be thin borders or text placeholders
- specimen pages can show fallback text
- block systems can show flat neutral blocks

### 22.18 Microcopy By Archetype

Industrial:

- "buy now"
- "archive"
- "field system"
- "model"
- "specification"

Red Editorial:

- "Index"
- "Works"
- "Contact"
- "Selected"
- "Statement"

Chromatic Block:

- "Browse styles"
- "Variable"
- "Found"
- "Collection"
- "Category"

Brutalist:

- "Work"
- "About"
- "Notes"
- "Now"
- "Inquiry"

Specimen:

- "View family"
- "Test type"
- "License"
- "Styles"
- "Glyphs"

### 22.19 Production Red Flags

Stop and revise if:

- body text is hard to read
- display font loads late and shifts layout badly
- every section uses a different visual trick
- colors do not map to meaning
- type overlaps important controls
- mobile hero requires horizontal scroll unintentionally
- buttons look imported from another design system
- the page could be mistaken for a generic template after changing the font

### 22.20 Final Assembly Templates

Industrial page:

```text
Header: thin utility nav
Hero: product image + quiet heading + signal action
Grid: square product/catalog cards
Detail: technical specifications
Footer: graphite utility links
```

Editorial display page:

```text
Header: pill nav
Hero: huge black/white display type
Statement: red full-bleed section
Index: project list
Contact: white/black pill CTA
```

Chromatic block page:

```text
Header: sparse text nav
Hero: short explanation
Blocks: full-width colored category links
Index: filtered list
About: plain text note
```

Brutalist page:

```text
Header: mechanical pill tabs
Hero: massive nameplate
Intro: compact serif body
Work: typographic index
Footer: monochrome contact
```

Specimen page:

```text
Header: underline nav
Hero: huge specimen
Metadata: family details
Tester: editable sample
List: type family cards without cards
Footer: licensing/contact links
```

---

## 23. Agent Workflow

When using this skill, follow this order:

1. Identify the project type.
2. Choose one archetype.
3. Define the role of type.
4. Choose display and functional faces.
5. Define type scale, line-height, and tracking.
6. Choose palette system.
7. Choose shape/radius system.
8. Build hero around one typographic gesture.
9. Build components that match the archetype.
10. Add proof/content through type, product, or specimens.
11. Test mobile wrapping and contrast.
12. Remove generic decoration.

Do not start by choosing colors. Start with type role and archetype.

---

## 24. Quick Reference

| Need | Use |
| --- | --- |
| engineered product feel | Industrial Thin-Type Precision |
| art-gallery attitude | Red/Black Editorial Display |
| playful archive | Chromatic Block Typography |
| personal brutalist site | Type-First Brutalist Parchment |
| type foundry | Editorial Specimen White Canvas |

### Do

- make typography structural
- pair expressive display with readable UI text
- control tracking and line-height
- use flat surfaces
- keep palette strict
- define interaction states
- respect mobile line breaks
- use borders and underlines intentionally

### Don't

- paste in a weird font and stop
- use generic rounded cards
- add random gradients
- use many accents
- make body copy experimental
- hide focus states
- let display type overflow accidentally
- use color without structural purpose

### Final Taste Test

If the design still works when all decorative shapes are removed, and the
typography alone carries identity, hierarchy, and interaction, it is moving
toward Experimental Type.
