---
name: editorial-minimal
description: |
  Editorial Minimal aesthetic for precise, typographic, content-first websites and product pages.
  Use when the user asks for a refined white-space driven interface, research-lab identity,
  AI/company homepage, institutional product page, architectural SaaS, quiet premium brand,
  monochrome editorial layout, or minimal page that must feel intelligent rather than empty.
  This style relies on disciplined typography, achromatic or near-achromatic palettes, exact
  spacing, restrained accents, editorial imagery, and layout rhythm. Anti-slop: rejects generic
  blank minimalism, default SaaS blue CTAs, overused cards, decorative gradients, arbitrary
  shadows, stock imagery, and "minimal" pages with no typographic point of view.
version: 1.0.0
category: design-taste
tags: [editorial-minimal, typography-first, achromatic, white-space, research, institutional, architectural, content-first, quiet-saas]
sources:
  - openai.com
  - anthropic.com
  - legend.xyz
  - intercom.com
  - limitless.ai
---

# Editorial Minimal - Design Skill

> A skill for creating refined, typographic, content-first digital identities where white space, rhythm, exact typography, and restrained accent logic carry the whole experience. Distilled from 5 Refero-curated references: OpenAI, Anthropic, Legend, Intercom, and Limitless.

---

## TABLE OF CONTENTS

1. [Core Philosophy](#philosophy)
2. [When To Use This Skill](#when-to-use)
3. [The 5 Source Archetypes](#archetypes)
4. [Shared Design DNA](#shared-dna)
5. [Color Systems](#color)
6. [Typography Systems](#typography)
7. [Whitespace, Density, and Rhythm](#spacing)
8. [Shape, Radius, and Borders](#shape)
9. [Surface and Elevation Systems](#surfaces)
10. [Component Patterns](#components)
11. [Layout Patterns](#layouts)
12. [Imagery and Editorial Media](#imagery)
13. [Motion and Interaction](#motion)
14. [Anti-Slop Rules](#anti-slop)
15. [Decision Tree](#decision-tree)
16. [CSS Custom Property Starter](#css-starter)
17. [Tailwind v4 Starter](#tailwind)
18. [Component Recipes](#recipes)
19. [Implementation Recipes by Product Type](#product-recipes)
20. [Quality Checklist](#checklist)
21. [Prompting Guide](#prompting)
22. [Quick Reference](#quick-reference)

---

<a id="philosophy"></a>
## 1. CORE PHILOSOPHY

Editorial Minimal is not "a lot of white space plus a black button." It is a disciplined visual language where the page behaves like an edited publication: typography has authority, spacing creates pace, color is rationed, and the user senses that every element survived a strong editorial process.

This style works when the brand wants to feel:

- intelligent
- calm
- precise
- institutional
- research-oriented
- premium but not luxury
- modern but not trend-chasing
- content-first
- confident enough to avoid decoration

The sources show five variants:

| Source | Variant | What it teaches |
| --- | --- | --- |
| OpenAI | Blank-page achromatic | Pure white, black UI, color only through editorial content |
| Anthropic | Research journal | Warm ivory, serif/sans pairing, underlines as emphasis |
| Legend | Architectural blueprint | Warm gray canvas, mono coordinates, violet edge signal |
| Intercom | Editorial SaaS | White and warm off-white sections with restrained CTA color |
| Limitless | Controlled innovation | Near-gray product minimalism with one violet brand signal |

The central tension: the page must feel rich while using very little. Richness comes from:

- exact font weights and tracking
- meaningful radii
- section rhythm
- clear typographic hierarchy
- careful image selection
- single-purpose accent rules
- editorial composition
- semantic components that look useful

If the design feels plain because nothing is happening, it is not Editorial Minimal. If the design feels quiet because everything is controlled, it is working.

### 1.1 White Space Is Active Material

In Editorial Minimal, empty space is not absence. It is a design element. It tells the reader where to pause, what matters, and how serious the system is.

Use white space to:

- slow the reading pace
- isolate a headline
- make an image feel intentional
- let a single CTA carry weight
- separate editorial entries without card chrome
- create institutional calm
- avoid over-explaining

Do not use white space to:

- hide a lack of layout thinking
- avoid building real components
- stretch weak copy
- make a generic hero feel premium

### 1.2 Typography Carries The Brand

The type system is the identity.

OpenAI uses one sans across every context with tight display tracking. Anthropic uses a sans/serif split where serif carries research/editorial authority. Legend uses condensed sans and mono for architectural precision. Intercom uses light display weights to stay refined. Limitless uses a single tight sans across all content.

The common rule: every size, weight, and tracking choice must be intentional.

Editorial Minimal type should not look like browser defaults. Even if the actual font is Inter, it must be tuned:

- display tracking adjusted
- line-height set by role
- small labels given positive tracking only when appropriate
- body copy given enough leading
- weights kept within a narrow, deliberate range
- mono used only for metadata or technical labels

### 1.3 Color Is Rationed

In this style, color is a budget, not a palette dump.

Common strategies:

- no UI color at all, color only through content
- one black filled CTA
- one violet signal for active/focus/brand
- one earthy accent held in reserve
- warm off-white surfaces instead of colored sections
- dark feature card as a tonal event

Color should be rare enough that the user notices when it appears.

If a design needs many colors to feel alive, it probably belongs to another style.

### 1.4 Editorial Minimal Is Not Always Pure White

There are several valid canvas types:

- pure white, like OpenAI
- warm ivory, like Anthropic
- warm gray, like Legend
- off-white and cream, like Intercom
- porcelain gray, like Limitless

Do not assume white is always the answer. The canvas temperature sets the brand:

- pure white: blank page, high clarity, modern AI/interface
- ivory: research, paper, warmth, institution
- warm gray: architectural, measured, designed
- cream/off-white: friendly product editorial
- porcelain gray: controlled innovation, product seriousness

### 1.5 Minimal Does Not Mean No Components

Editorial Minimal can include:

- nav bars
- conversational inputs
- editorial card grids
- footer link systems
- tabs
- ghost buttons
- metadata rows
- dark feature cards
- product cards
- simple data panels
- research archive entries
- image tiles

The key is restraint:

- fewer effects
- fewer colors
- fewer nested surfaces
- more exact spacing
- better copy

---

<a id="when-to-use"></a>
## 2. WHEN TO USE THIS SKILL

Use Editorial Minimal for:

- AI company homepages
- research lab websites
- institutional tech brands
- content-first product pages
- product launches that should feel intelligent
- editorial homepages
- documentation-adjacent sites
- premium but quiet SaaS
- architecture-like product identities
- finance/AI/hardware brands with restraint
- founder/company pages that need credibility
- brand systems where type and content should dominate

Do not use this skill as the primary style for:

- playful consumer brands
- motion-heavy campaigns
- neon/futuristic cyber interfaces
- highly illustrative landing pages
- ecommerce pages that need product imagery density
- dashboards where data density is the main experience
- expressive portfolio sites with maximal personality

Use another skill if:

- the user asks for pastel softness: use Pastel.
- the user asks for dark SaaS: use Dark UI.
- the user asks for cyber/futuristic glow: use Cyber Neon.
- the user asks for technical developer interface: use Technical Sans.
- the user asks for strong serif display identity: use Serif Display.

Editorial Minimal can still support product UI, but the interface should remain content-led and controlled.

---

<a id="archetypes"></a>
## 3. THE 5 SOURCE ARCHETYPES

### 3.1 OpenAI - Blank Page Achromatic

OpenAI is the strictest archetype. The UI is almost entirely black, white, and pale gray. Color appears only through editorial media, never as a UI accent. The page feels like a blank page where the content is allowed to become the event.

Signature ingredients:

- pure white canvas
- black primary text and filled CTA
- graphite secondary text
- #e5e7eb border system
- no colored UI accents
- no section background color
- pills for buttons and inputs
- exact 6.08px image/card clipping
- single sans typeface
- color through curated images

Use this when the brand should feel:

- extremely confident
- modern AI-native
- editorial but product-capable
- quiet and high-trust
- content-led

Pattern:

```txt
Canvas: #ffffff everywhere
UI color: black, gray, pale border
CTA: black pill
Cards: no chrome, just image + type
Color: media only
Spacing: 64-80px section rhythm
```

Adaptation rules:

- If adding color, add it inside images or content cards.
- If making a CTA, make it black or ghost.
- If separating content, use whitespace first and border second.
- If using cards, avoid shadows and strong backgrounds.
- Keep radii to two or three exact roles.

Avoid:

- colored buttons
- decorative gradients
- shadow cards
- alternating section colors
- generic medium radii
- too many typefaces

### 3.2 Anthropic - Research Journal On Warm Stone

Anthropic is the institutional editorial archetype. It uses warm ivory instead of white, slate instead of black, and type pairing as the main expression. It feels like a research journal translated into a website.

Signature ingredients:

- warm ivory canvas
- near-black slate, not pure black
- sans for UI, serif for editorial cards
- thick underlines for keyword emphasis
- mono metadata labels
- dark feature cards
- earthy accent held in reserve
- compact editorial rhythm

Use this when the brand should feel:

- research-driven
- institutional
- serious
- literary
- careful
- authoritative without sales polish

Pattern:

```txt
Canvas: warm ivory
Typography: sans UI + serif editorial
Decoration: underline, not color
Feature rhythm: dark cards on light paper
Accent: earthy, rare
```

Adaptation rules:

- Never use pure white as the base.
- Use underline as the primary emphasis device.
- Use serif for major editorial feature moments, not every heading.
- Use mono for metadata and classification.
- Let dark cards create section rhythm.

Avoid:

- generic black and white
- colorful highlights
- soft shadows
- all-serif pages
- turning every section into a dark band
- casual accent use

### 3.3 Legend - Architectural Blueprint

Legend is the architectural variant. It sits between editorial and technical. The page has warm gray surfaces, exact measurements, mono coordinate details, and a violet signal used like a precision marker.

Signature ingredients:

- warm gray canvas
- black and gray text stack
- accent violet as edge/focus/data signal
- mono coordinates and technical details
- large but controlled card radius
- lightweight components
- sparse atmospheric gradients
- precise max width and spacing

Use this when the brand should feel:

- architectural
- measured
- quietly technical
- design-led
- modern without being soft

Pattern:

```txt
Canvas: warm gray
Type: slightly condensed sans
Mono: coordinates and structure
Accent: violet edge signal
Cards: large radius but minimal chrome
```

Adaptation rules:

- Use the violet on outlines, tags, and focus states.
- Do not make violet a large background theme.
- Use mono sparingly to create coordinate-like precision.
- Let the warm gray canvas do more than white would.
- Use large cards only when the rest stays stark.

Avoid:

- saturated secondary colors
- heavy shadows
- random radii
- colorful gradients
- generic font sizes
- bright SaaS CTAs

### 3.4 Intercom - Editorial SaaS Clarity

Intercom is the most product-marketing friendly archetype. It uses white and warm off-white surfaces, fine black typography, a clear black primary action, and vivid violet/orange only in controlled interactive or emphasis roles.

Signature ingredients:

- expansive white canvas
- warm off-white and cream section rhythm
- light display typography
- black primary actions
- violet interaction state
- orange word-level emphasis
- 4px controls
- tabs and underlines
- mono for technical details

Use this when the brand should feel:

- polished
- product-led
- friendly but restrained
- editorial but conversion-capable
- modern SaaS without generic SaaS decoration

Pattern:

```txt
Canvas: white
Section rhythm: off-white/cream
CTA: black, violet interaction
Accent: orange for tiny emphasis
Controls: 4px radius
Type: light, generous display
```

Adaptation rules:

- Use warm sections to create rhythm instead of colored bands.
- Keep black as the main CTA fill.
- Use violet for active/hover/focus moments.
- Use orange only for tiny word emphasis.
- Use tabs and border lines instead of heavy cards.

Avoid:

- many saturated accents
- sharp zero-radius controls if the system expects 4px
- glossy shadows
- large orange buttons
- generic feature-card grids

### 3.5 Limitless - Controlled Innovation

Limitless is a practical achromatic product-minimal archetype. It uses near-gray surfaces, a single tight sans, pill controls, and one violet brand signal. It is good for AI/productivity brands that need to feel advanced without flash.

Signature ingredients:

- porcelain gray background
- graphite/slate text hierarchy
- tight tracking across the system
- one violet brand signal
- pill buttons
- subtle cards
- one shadow token at most
- centered direct layouts

Use this when the brand should feel:

- controlled
- modern
- focused
- product-serious
- understated
- AI-adjacent but not sci-fi

Pattern:

```txt
Canvas: porcelain gray
Type: one tight sans
Accent: violet signal
Buttons: pills
Cards: subtle, 16px radius
Spacing: 48-64px
```

Adaptation rules:

- Use graphite instead of pure black.
- Use violet for logo/iconography/precise action only.
- Keep typeface discipline.
- Use one subtle shadow if needed.
- Avoid decorative backgrounds.

Avoid:

- additional bright colors
- multiple typefaces
- heavy shadows
- glows
- loose tracking
- generic blue CTA

---

<a id="shared-dna"></a>
## 4. SHARED DESIGN DNA

### 4.1 The Editorial Minimal Spectrum

| Axis | Strict end | Warm end | Product end | Technical end |
| --- | --- | --- | --- | --- |
| Canvas | OpenAI pure white | Anthropic ivory | Intercom warm white | Legend warm gray |
| Accent | none | earthy reserve | violet/orange rationed | violet edge signal |
| Type | one sans | sans + serif | light sans + mono | sans + mono |
| Cards | no chrome | dark editorial plates | warm product blocks | architectural slabs |
| Shape | pills + exact clip | flat + feature radii | 4px controls | 4px controls + 32px cards |

Pick one dominant pole. Do not make a page that is simultaneously OpenAI-white, Anthropic-serif, Intercom-colorful, and Legend-architectural unless the composition has a clear hierarchy.

### 4.2 Shared Rules

Use these as defaults:

- Typography does the first 60 percent of the design work.
- Color is either absent, content-only, or one accent signal.
- Section rhythm comes from spacing and surface temperature.
- Cards should not look like generic SaaS cards.
- Borders should be pale, warm, or structural.
- Images should be curated like editorial assets.
- Copy should be specific and calm.
- Components should feel useful, not decorative.
- Body text must be comfortable to read.
- Every radius value should have a role.

### 4.3 What Creates Identity

Editorial Minimal becomes distinctive through exactness:

- exact card radius like 6.08px
- no colored CTAs
- warm ivory instead of white
- underline as the only decoration
- one serif role, not an all-serif page
- mono metadata in research cards
- violet as edge signal, not fill
- black CTA with violet hover
- porcelain background instead of white
- dark feature cards used as editorial plates

Small rules create the brand.

### 4.4 The "Rich But Quiet" Test

A good Editorial Minimal design passes this test:

1. Remove all images. Does the page still have typographic character?
2. Remove the accent color. Does the page still feel designed?
3. Collapse section backgrounds to the base canvas. Does the spacing still create rhythm?
4. View only the buttons and inputs. Do their shapes feel intentional?
5. View only the metadata and captions. Do they feel like part of the identity?

If the answer is no, the design is relying on decoration, not editorial minimalism.

---

<a id="color"></a>
## 5. COLOR SYSTEMS

### 5.1 Palette Archetypes

#### A. Pure Achromatic White

Best for AI, content hubs, product/editorial pages that should feel like a blank page.

```css
:root {
  --em-canvas: #ffffff;
  --em-ink: #000000;
  --em-ink-2: #666666;
  --em-ink-3: #8f8f8f;
  --em-border: #e5e7eb;
  --em-hover: #f1f1f1;
  --em-button: #000000;
  --em-on-button: #ffffff;
}
```

Rules:

- no colored buttons
- no colored backgrounds
- no tinted borders
- color only through images/media
- cards separated by image clip and whitespace

Use when the brand can afford extreme restraint.

#### B. Warm Research Ivory

Best for research labs, institutional AI, serious editorial products.

```css
:root {
  --em-canvas: #faf9f5;
  --em-surface-1: #f0eee6;
  --em-surface-2: #e3dacc;
  --em-ink: #141413;
  --em-ink-2: #3d3d3a;
  --em-muted: #87867f;
  --em-border: #d1cfc5;
  --em-on-dark: #e8e6dc;
  --em-accent: #d97757;
}
```

Rules:

- never pure white
- never pure black
- serif reserved for editorial moments
- underline for emphasis
- accent is rare and earthy

#### C. Architectural Warm Gray

Best for design-led, technical, architectural, or premium utility brands.

```css
:root {
  --em-canvas: #ededed;
  --em-panel: #dedddc;
  --em-ink: #000000;
  --em-surface-dark: #131313;
  --em-button: #2d2d2d;
  --em-muted: #6c6c6c;
  --em-muted-2: #949494;
  --em-border: #b2b2b2;
  --em-accent: #8931c4;
}
```

Rules:

- violet as precise signal
- mono for coordinates
- no decorative colorful gradients
- large cards only if surfaces stay austere

#### D. Warm Editorial SaaS

Best for polished product pages that need conversion and warmth.

```css
:root {
  --em-canvas: #ffffff;
  --em-offwhite: #faf9f6;
  --em-cream: #f1eee9;
  --em-sand: #dedbd6;
  --em-warm-gray: #e7e3db;
  --em-ink: #111111;
  --em-body: #000000;
  --em-muted: #585858;
  --em-muted-2: #666666;
  --em-accent: #0007cb;
  --em-emphasis: #ff5600;
}
```

Rules:

- black CTA first
- violet for active/focus/hover or primary interaction
- orange as tiny word-level emphasis only
- warm surface bands can create rhythm

#### E. Porcelain Product Minimal

Best for AI/productivity products that need quiet modernity.

```css
:root {
  --em-canvas: #e5e7eb;
  --em-surface: #f2f3f5;
  --em-ink: #0f172a;
  --em-ink-2: #334155;
  --em-body: #475569;
  --em-muted: #64748b;
  --em-border: #d1d5db;
  --em-accent: #8a53e1;
}
```

Rules:

- one typeface
- tight tracking
- violet is brand signal
- pill buttons
- subtle elevation only

### 5.2 Accent Strategy

| Strategy | Accent use | Best for |
| --- | --- | --- |
| No UI accent | Black button only, color through media | OpenAI-like strict editorial |
| Reserved earthy accent | Rare section-level emphasis | Anthropic-like research |
| Edge signal | Focus rings, tags, outlines | Legend-like architecture |
| Conversion accent | Hover/focus/active CTA state | Intercom-like SaaS |
| Brand signal | Logo, icon, precise action | Limitless-like product |

### 5.3 Color Budget

Use one of these budgets:

#### Strict Achromatic

- 92 percent white
- 5 percent black
- 2 percent gray
- 1 percent editorial imagery

#### Warm Research

- 75 percent ivory
- 15 percent slate/black
- 7 percent warm surface variations
- 2 percent dark editorial cards
- 1 percent earthy accent

#### Product Editorial

- 65 percent white/off-white
- 20 percent black/text
- 10 percent warm surfaces
- 3 percent borders
- 2 percent accent

If accent exceeds 5 percent of the visible page, the design is probably no longer editorial minimal.

### 5.4 Border Rules

Borders are important because shadows are often absent.

Use:

- #e5e7eb on pure white
- warm sand borders on cream/off-white systems
- cloud/light slate borders on ivory systems
- light gray borders on architectural gray systems
- divider silver on porcelain systems

Avoid:

- strong black borders everywhere
- generic Tailwind gray without palette context
- colored borders unless they are focus/active states
- mixing warm and cool border systems

### 5.5 Dark Surfaces

Editorial Minimal can use dark surfaces, but only as controlled editorial beats.

Use dark surfaces for:

- featured research cards
- manifesto sections
- one major contrast block
- media plate
- serious institutional emphasis

Do not:

- alternate dark/light every section
- turn the whole page into dark UI
- add glow effects
- use dark cards as generic feature cards

---

<a id="typography"></a>
## 6. TYPOGRAPHY SYSTEMS

### 6.1 Typography Models

#### One-Sans Editorial

Use for OpenAI and Limitless-like pages.

Characteristics:

- one font everywhere
- hierarchy through weight, size, tracking, and spacing
- no decorative contrast
- strong consistency

Recommended substitutes:

- Inter
- DM Sans
- Satoshi
- Geist Sans
- Manrope
- IBM Plex Sans

#### Sans + Serif Research

Use for Anthropic-like pages.

Characteristics:

- sans for UI chrome, navigation, body
- serif for editorial feature cards and publication-like moments
- mono for metadata
- strong role separation

Recommended substitutes:

- Sans: Inter, DM Sans, IBM Plex Sans
- Serif: Lora, Newsreader, Playfair Display, Libre Baskerville
- Mono: IBM Plex Mono, JetBrains Mono

#### Sans + Mono Architectural

Use for Legend-like pages.

Characteristics:

- clean sans for most text
- small mono for coordinates, labels, dimensions
- slightly condensed feeling
- exact spacing

Recommended substitutes:

- Sans: Inter Tight, Geist Sans, IBM Plex Sans Condensed
- Mono: Space Mono, IBM Plex Mono

#### Light SaaS Editorial

Use for Intercom-like pages.

Characteristics:

- display weights are light or regular
- line-height is tight in display
- body remains readable
- mono appears only for technical/code-like fragments

### 6.2 Weight Rules

Editorial Minimal usually avoids heavy weight extremes.

Good weight sets:

```css
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
```

Use 700 only when:

- the source archetype calls for institutional sans emphasis
- the display size remains controlled
- the rest of the system is quiet

Avoid:

- 800/900
- bold body copy
- using weight as the only hierarchy
- mixing many weights in one section

### 6.3 Tracking Rules

Tracking is critical.

| Context | Tracking |
| --- | --- |
| Large sans display | -0.03em to -0.02em |
| Mid headings | -0.02em to -0.01em |
| Body | -0.005em to 0 |
| Small labels | 0 to +0.011em |
| Mono labels | +0.04em to +0.08em |
| Serif display | usually normal or slightly tight |

Do not apply the same tracking everywhere unless copying a specific Limitless-like system.

### 6.4 Type Scales

#### OpenAI-like Pure Editorial Sans

```css
:root {
  --text-caption: 13px;
  --text-label: 14px;
  --text-body: 16px;
  --text-body-lg: 17px;
  --text-subhead: 18px;
  --text-heading: 22px;
  --text-heading-lg: 28px;
  --text-display: 48px;

  --leading-caption: 1.64;
  --leading-body: 1.5;
  --leading-body-lg: 1.65;
  --leading-heading: 1.26;
  --leading-heading-lg: 1.21;
  --leading-display: 1.16;

  --tracking-display: -0.03em;
  --tracking-heading: -0.01em;
  --tracking-label: 0.011em;
}
```

#### Anthropic-like Research Scale

```css
:root {
  --text-caption: 12px;
  --text-body-sm: 15px;
  --text-body: 16px;
  --text-subheading: 18px;
  --text-heading-sm: 20px;
  --text-heading: 24px;
  --text-heading-lg: 61px;
  --text-serif-display: 91px;

  --leading-caption: 1.4;
  --leading-body: 1.4;
  --leading-heading: 1.3;
  --leading-display: 1.1;

  --tracking-sans-display: -0.02em;
  --tracking-sans-body: -0.002em;
}
```

#### Intercom-like Editorial SaaS Scale

```css
:root {
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subheading: 20px;
  --text-heading-sm: 24px;
  --text-heading: 32px;
  --text-heading-lg: 40px;
  --text-display: 54px;
  --text-display-lg: 80px;

  --leading-caption: 1.4;
  --leading-body: 1.5;
  --leading-subheading: 0.95;
  --leading-heading: 1;
  --leading-display: 1;
}
```

#### Limitless-like Product Minimal Scale

```css
:root {
  --text-caption: 14px;
  --text-body: 16px;
  --text-body-lg: 18px;
  --text-subheading: 30px;
  --text-heading: 36px;
  --text-display: 60px;

  --leading-caption: 1.56;
  --leading-body: 1.5;
  --leading-body-lg: 1.5;
  --leading-subheading: 1.43;
  --leading-heading: 1.2;
  --leading-display: 1.11;

  --tracking-all: -0.025em;
}
```

### 6.5 Body Copy Rules

Editorial Minimal body copy should feel edited.

Use:

- 16-18px for main paragraphs
- line-height 1.45-1.65
- max width 56-68 characters
- muted but readable color
- short paragraphs
- concrete language

Avoid:

- wide paragraphs spanning the page
- low contrast gray that looks disabled
- all centered paragraph blocks
- generic marketing phrasing
- decorative italic overuse

### 6.6 Metadata Rules

Metadata is a major part of this style.

Use metadata for:

- category
- read time
- date
- research area
- product area
- status
- version
- location/coordinates
- author
- collection

Metadata can use:

- small sans with positive tracking
- mono with positive tracking
- muted gray
- inline middot separators
- uppercase labels in small doses

Example:

```txt
Research / Safety - 8 min read
DATE 2026.05.02
CATEGORY Product
MODEL / release candidate
```

Do not turn metadata into colorful chips unless the source archetype supports it.

### 6.7 Copy Voice

Editorial Minimal copy should be calm and precise.

Good:

- "A research archive for model behavior."
- "One page for every customer conversation."
- "Notes, decisions, and source material stay connected."
- "Search across meetings without rebuilding context."
- "A quieter way to understand the system."

Weak:

- "Supercharge your productivity."
- "The ultimate platform for teams."
- "Unlock the future of AI."
- "Powerful, seamless, and intuitive."
- "Everything you need in one place."

The style makes weak copy look weaker because there is no decoration to distract from it.

---

<a id="spacing"></a>
## 7. WHITESPACE, DENSITY, AND RHYTHM

### 7.1 Base Units

Editorial Minimal uses either a 4px or 8px base.

Use 4px for:

- OpenAI-like exactness
- Anthropic-like compact editorial systems
- Legend-like architectural measurement
- Intercom-like product UI

Use 8px for:

- Limitless-like product minimalism
- simpler implementation systems
- products that need standard spacing scales

### 7.2 Section Rhythm

Common section gaps:

| Archetype | Section gap |
| --- | --- |
| OpenAI | 64-80px |
| Anthropic | around 61px |
| Legend | around 68px |
| Intercom | around 48px |
| Limitless | 48-64px |

Guidance:

- Use 48px for product/editorial SaaS.
- Use 64-80px for pure editorial white space.
- Use 96px+ only for major hero or manifesto moments.
- Avoid tiny 24px gaps between full page sections unless building dense product docs.

### 7.3 Content Width

Use:

- 640px for centered hero/input content
- 720px for long-form reading text
- 960px for editorial list grids
- 1200px for most site sections
- 1416px for architectural wide layouts

Do not let text paragraphs span full 1200px width.

### 7.4 Grid Rhythm

Editorial grids should feel composed, not like equal card decks.

Use:

- asymmetric feature grid: 60/40
- large story plus two small stories
- single-column research list
- two-column text/image alternation
- centered headline then editorial grid
- dark feature plate followed by light entries

Avoid:

- uniform 3x3 card grid for every section
- equal feature cards with giant icons
- masonry chaos
- dense dashboard grids

### 7.5 Breathing Room Rules

For strict editorial:

- hero top/bottom padding: 96-140px
- between headline and body: 16-24px
- between body and CTA: 24-32px
- between section heading and content: 32-48px
- between editorial cards: 24-40px

For product editorial:

- hero padding: 72-112px
- section padding: 48-80px
- component gaps: 12-24px
- card padding: 16-32px

---

<a id="shape"></a>
## 8. SHAPE, RADIUS, AND BORDERS

### 8.1 Radius Systems

#### OpenAI Two-Radius System

```css
--radius-card: 6.08px;
--radius-link: 4px;
--radius-soft-button: 40px;
--radius-pill: 9999px;
```

Rules:

- pills for buttons, chips, input
- exact near-square radius for image cards
- no 12/16/24px middle ground

#### Anthropic Editorial Card System

```css
--radius-card: 8px;
--radius-panel: 16px;
--radius-feature: 24px;
--radius-button: 0px;
```

Rules:

- controls are mostly flat/sharp
- feature cards can be rounded
- radius creates editorial hierarchy

#### Legend Architectural System

```css
--radius-control: 4px;
--radius-nav: 12px;
--radius-card: 32px;
```

Rules:

- controls stay precise
- cards can be large architectural slabs
- do not add arbitrary intermediate values

#### Intercom Product Editorial System

```css
--radius-button: 4px;
--radius-nav: 4px;
--radius-tab: 0px;
```

Rules:

- product controls are lightly rounded
- tabs use borders, not pills
- no over-rounded SaaS look

#### Limitless Product Minimal System

```css
--radius-default: 8px;
--radius-card: 16px;
--radius-button: 9999px;
```

Rules:

- buttons are pills
- cards are soft but restrained
- default elements use 8px

### 8.2 Border Philosophy

Borders replace decoration.

Use borders for:

- nav separators
- footer top rules
- input outlines
- tab active states
- card image boundaries
- editorial table rows
- research metadata sections

Do not use borders:

- around every paragraph
- to compensate for weak spacing
- in multiple inconsistent colors
- as decorative frames around the whole viewport

### 8.3 Focus Rings

Focus rings should be visible but quiet.

```css
:focus-visible {
  outline: 2px solid var(--em-focus);
  outline-offset: 2px;
}
```

For strict achromatic:

```css
--em-focus: #000000;
```

For architectural/product:

```css
--em-focus: #8931c4;
```

For warm research:

```css
--em-focus: #3d3d3a;
```

Do not use glowing focus effects.

---

<a id="surfaces"></a>
## 9. SURFACE AND ELEVATION SYSTEMS

### 9.1 Flat Surface Philosophy

Most Editorial Minimal systems are nearly flat.

Hierarchy is created by:

- whitespace
- type scale
- borders
- surface temperature
- image size
- dark contrast plates
- subtle hover fills

Not by:

- heavy shadows
- glossy cards
- gradients
- glassmorphism
- z-axis theatrics

### 9.2 Surface Ladders

#### Pure White Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #ffffff | Page and cards |
| 1 | #f1f1f1 | Hover and subtle fill |
| 2 | #e5e7eb | Border/divider only |
| 3 | #666666 | Secondary text |
| 4 | #000000 | Primary text and CTA |

#### Warm Ivory Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #faf9f5 | Page |
| 1 | #f0eee6 | Nav/secondary surface |
| 2 | #e3dacc | Warm tertiary surface |
| 3 | #d1cfc5 | Divider |
| 4 | #141413 | Text/dark feature card |

#### Warm SaaS Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #ffffff | Page |
| 1 | #faf9f6 | Soft section |
| 2 | #f1eee9 | Cream surface |
| 3 | #dedbd6 | Border sand |
| 4 | #111111 | Text/button |

#### Porcelain Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #e5e7eb | Page |
| 1 | #f2f3f5 | UI surface |
| 2 | #d1d5db | Divider |
| 3 | #475569 | Body |
| 4 | #0f172a | Headline |

### 9.3 Shadow Rules

Default: no shadow.

Use shadow only when:

- the source archetype includes a subtle card lift
- a product card needs to separate from a gray canvas
- a button needs barely visible print-like elevation

#### Minimal CTA Shadow

```css
--shadow-button-minimal:
  rgba(0, 0, 0, 0.02) 0 4px 6px,
  rgba(0, 0, 0, 0.05) 0 0 2px;
```

#### Product Card Shadow

```css
--shadow-product:
  rgba(30, 41, 59, 0.15) 0 25px 50px -12px;
```

Rules:

- one shadow token per system
- no colored glow
- no hover jump
- no layered Material Design elevation scale

---

<a id="components"></a>
## 10. COMPONENT PATTERNS

### 10.1 Buttons

#### Black Editorial Pill

```css
.em-button-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid #000000;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  font: 500 14px/1 var(--em-font-sans);
  letter-spacing: 0;
}
```

Use for:

- strict achromatic CTA
- OpenAI-like products
- centered hero actions

Do not add color.

#### Ghost Editorial Pill

```css
.em-button-ghost-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 9999px;
  background: transparent;
  color: #000000;
  font: 500 14px/1 var(--em-font-sans);
}

.em-button-ghost-pill:hover {
  background: #f1f1f1;
}
```

Use for:

- secondary actions
- mode chips
- nav authentication actions

#### Square Editorial CTA

```css
.em-button-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #111111;
  border-radius: 4px;
  background: #111111;
  color: #ffffff;
  font: 400 16px/1 var(--em-font-sans);
}

.em-button-square:hover {
  background: var(--em-accent);
  border-color: var(--em-accent);
}
```

Use for:

- Intercom-like product editorial
- practical SaaS pages
- pages where pill would feel too soft

#### Violet Signal Ghost

```css
.em-button-signal {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--em-accent), transparent 50%);
  border-radius: 4px;
  background: transparent;
  color: var(--em-accent);
}
```

Use for:

- tags
- active states
- narrow product actions
- architectural/Legend-like UIs

### 10.2 Conversational Input

```css
.em-conversation-input {
  position: relative;
  display: flex;
  align-items: center;
  width: min(100%, 640px);
  min-height: 54px;
  border: 1px solid var(--em-border);
  border-radius: 9999px;
  background: transparent;
  color: var(--em-ink);
}

.em-conversation-input input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 10px 54px 10px 52px;
  font: 400 16px/1.4 var(--em-font-sans);
  color: inherit;
}

.em-conversation-input input::placeholder {
  color: var(--em-muted);
}
```

Use for:

- AI homepages
- search/product entry
- prompt-based product experiences

Rules:

- keep it centered or tightly aligned
- do not add glow
- do not use colored border by default
- use one icon or submit affordance

### 10.3 Editorial Cards

#### Image Editorial Card

```css
.em-editorial-card {
  display: grid;
  gap: 14px;
  color: inherit;
  text-decoration: none;
}

.em-editorial-card img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 6.08px;
}

.em-card-meta {
  font: 500 13px/1.4 var(--em-font-sans);
  color: var(--em-muted);
  letter-spacing: 0.011em;
}

.em-card-title {
  margin: 0;
  font: 600 22px/1.22 var(--em-font-sans);
  letter-spacing: -0.01em;
}
```

Rules:

- no shadow
- no visible card fill unless source calls for it
- image and text should breathe
- metadata is quiet but precise

#### Dark Research Feature Card

```css
.em-research-card {
  border-radius: 24px;
  background: #141413;
  color: #e8e6dc;
  padding: 32px;
  overflow: hidden;
}

.em-research-card h3 {
  font-family: var(--em-font-serif);
  font-size: clamp(42px, 7vw, 91px);
  line-height: 1.1;
  font-weight: 400;
  letter-spacing: 0;
}

.em-research-meta {
  display: grid;
  gap: 4px;
  font-family: var(--em-font-mono);
  font-size: 13px;
  letter-spacing: 0.04em;
  color: #d1cfc5;
}
```

Rules:

- use sparingly
- make it full-width or important
- use serif for headline
- clip imagery intentionally

### 10.4 Tabs

```css
.em-tabs {
  display: flex;
  border-bottom: 1px solid var(--em-border);
}

.em-tab {
  appearance: none;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  padding: 16px;
  color: var(--em-muted);
  font: 400 14px/1 var(--em-font-sans);
}

.em-tab[aria-selected="true"] {
  color: var(--em-ink);
  border-bottom-color: var(--em-ink);
}
```

Rules:

- active state by underline/border
- no pill tabs unless using a strict OpenAI-like chip group
- no colorful tab fills

### 10.5 Metadata Block

```css
.em-metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  border-top: 1px solid var(--em-border);
  padding-top: 16px;
}

.em-metadata dt {
  font-family: var(--em-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--em-muted);
  text-transform: uppercase;
}

.em-metadata dd {
  margin: 4px 0 0;
  color: var(--em-ink);
}
```

Use for:

- research archives
- product changelog entries
- case studies
- model cards
- policy pages

### 10.6 Navigation

Editorial Minimal nav should be restrained.

Patterns:

- 64px top nav with bottom border
- minimal wordmark left
- links center or right
- one CTA on right
- no mega-menu unless content demands it
- no shadow, or border only

```css
.em-nav {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--em-border);
  background: var(--em-canvas);
}

.em-nav a {
  color: var(--em-ink);
  text-decoration: none;
  font: 500 14px/1 var(--em-font-sans);
}

.em-nav a:hover {
  text-decoration: underline;
}
```

For warm research:

- nav can sit on Ivory Medium
- avoid pure white
- CTA may be flat/asymmetric

For product editorial:

- nav items can have 4px hover backgrounds
- active state can use underline or bottom border

### 10.7 Footer

The footer is often a typographic system test.

```css
.em-footer {
  border-top: 1px solid var(--em-border);
  padding: 48px 0;
  background: var(--em-canvas);
}

.em-footer-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 64px;
}

.em-footer h3 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.011em;
}

.em-footer a {
  display: block;
  margin-top: 8px;
  color: var(--em-muted);
  font-size: 13px;
  text-decoration: none;
}
```

Rules:

- no heavy footer background by default
- keep column rhythm exact
- small text must remain readable

---

<a id="layouts"></a>
## 11. LAYOUT PATTERNS

### 11.1 Centered Blank-Page Hero

Best for OpenAI-like pages.

Structure:

```txt
Nav
Centered headline
Conversational input
Chip row
Editorial grid
```

CSS:

```css
.em-blank-hero {
  display: grid;
  justify-items: center;
  gap: 24px;
  padding: 112px 24px 80px;
  text-align: center;
}

.em-blank-hero h1 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(36px, 5vw, 48px);
  line-height: 1.16;
  letter-spacing: -0.03em;
}
```

Rules:

- no hero image
- no background gradient
- input can be the main object
- chips stay quiet

### 11.2 Research Journal Hero

Best for Anthropic-like pages.

Structure:

```txt
Warm nav
Large sans headline with underlined keywords
Short body
Flat CTA
Dark editorial cards below
```

CSS:

```css
.em-research-hero {
  background: #faf9f5;
  color: #141413;
  padding: 96px 24px 72px;
}

.em-research-hero h1 {
  max-width: 920px;
  font-size: clamp(48px, 7vw, 61px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.em-research-hero mark {
  background: transparent;
  color: inherit;
  text-decoration: underline;
  text-decoration-thickness: 0.12em;
  text-underline-offset: 0.12em;
}
```

Rules:

- underline replaces color
- base is ivory
- serif appears later or in feature cards

### 11.3 Architectural Wide Layout

Best for Legend-like pages.

Structure:

```txt
Wide max-width
Left-aligned headline
Mono coordinate label
Large gray/black panel
Violet outline details
```

CSS:

```css
.em-architectural {
  max-width: 1416px;
  margin: 0 auto;
  padding: 68px 24px;
  background: #ededed;
}

.em-coordinate {
  font-family: var(--em-font-mono);
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.06em;
  color: #6c6c6c;
}
```

Rules:

- use 20px element gap
- keep violet on edges
- use mono to imply measured space

### 11.4 Product Editorial Split

Best for Intercom-like pages.

Structure:

```txt
Header
Two-column hero
Black CTA + outline secondary
Warm section band
Tabs or product explanation
```

CSS:

```css
.em-product-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
  gap: 48px;
  align-items: center;
  padding: 80px 24px;
}

.em-product-split h1 {
  font-size: clamp(48px, 7vw, 80px);
  line-height: 1;
  font-weight: 300;
  letter-spacing: -0.03em;
}
```

Rules:

- display weight should feel light
- warm surfaces can appear below
- avoid overbuilt hero visuals

### 11.5 Centered Product Minimal

Best for Limitless-like pages.

Structure:

```txt
Simple nav
Centered headline
Short paragraph
Pill action
Subtle product card
```

CSS:

```css
.em-centered-product {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 80px 24px 64px;
  text-align: center;
  background: #e5e7eb;
  color: #0f172a;
}

.em-centered-product h1 {
  max-width: 760px;
  font-size: clamp(44px, 6vw, 60px);
  line-height: 1.11;
  letter-spacing: -0.025em;
  font-weight: 600;
}
```

Rules:

- keep one typeface
- use graphite/slate colors
- no decorative imagery unless it is product-specific

### 11.6 Asymmetric Editorial Grid

```css
.em-editorial-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 40px;
  align-items: start;
}

.em-editorial-stack {
  display: grid;
  gap: 32px;
}
```

Use for:

- articles
- research updates
- product stories
- changelogs
- case studies

Rules:

- one lead story gets scale
- smaller stories are stacked
- no card boxes needed

---

<a id="imagery"></a>
## 12. IMAGERY AND EDITORIAL MEDIA

### 12.1 Image Roles

Images in Editorial Minimal are not filler. They have roles:

- editorial thumbnail
- research plate
- abstract content tile
- product proof
- publication cover
- atmospheric but content-relevant macro
- restrained model/product visual

### 12.2 OpenAI-like Image Rules

Use:

- soft-focus macro images
- pastel abstract thumbnails
- gradient-adjacent media
- low image density
- exact radius clipping
- no image card chrome

Avoid:

- lifestyle people
- stock office scenes
- UI screenshots inside news cards
- harsh saturated photos
- full-bleed decorative images

### 12.3 Research Image Rules

Use:

- publication-like cards
- diagrams
- research imagery
- hard-clipped media inside dark cards
- metadata and captions

Avoid:

- cheerful SaaS illustrations
- decorative blobs
- over-polished stock photography
- random abstract art with no connection to content

### 12.4 Product Minimal Image Rules

Use:

- simple product screenshots
- abstract placeholder blocks if content-first
- icon/logo as precise brand signal
- restrained device/product visuals

Avoid:

- large glossy mockups
- 3D hero objects unless necessary
- bright hero gradients
- blurred screenshots

### 12.5 Image Density

Suggested density:

- strict editorial: low, 10-20 percent of page area
- research journal: medium in feature cards
- product editorial: medium, mostly explanatory
- architectural: low, panels/geometry over photos

If images dominate the first viewport, the style may shift away from Editorial Minimal unless the image is the content itself.

---

<a id="motion"></a>
## 13. MOTION AND INTERACTION

Motion should be almost invisible.

### 13.1 Timing

```css
:root {
  --em-motion-fast: 120ms;
  --em-motion-base: 180ms;
  --em-motion-slow: 260ms;
  --em-ease: cubic-bezier(0.2, 0, 0, 1);
}
```

Use:

- 120ms for hover fills
- 180ms for text/border changes
- 260ms for panel reveal

Avoid:

- large scroll animations
- parallax
- bouncy easing
- animated gradients
- constant motion

### 13.2 Hover States

Strict achromatic:

- underline links
- ghost buttons fill with Chalk
- border stays same

Warm research:

- underline thickens
- surface shifts one warm step
- text remains slate

Architectural:

- violet border appears
- mono label brightens
- panel surface changes subtly

Product editorial:

- black button may switch to violet
- tabs use bottom border
- warm background shift

Product minimal:

- pill background shifts
- shadow appears very slightly
- violet icon brightens

### 13.3 Scroll Reveals

If used:

- fade/translate only
- small distance, 8-16px
- short duration
- no staggered carnival effects

Better: let content simply be present.

---

<a id="anti-slop"></a>
## 14. ANTI-SLOP RULES

### 14.1 Universal Rejections

Reject:

- generic blank white page with no type system
- default Tailwind gray and blue
- rounded-2xl cards everywhere
- large gradient hero backgrounds
- stock people photos
- random colored CTAs
- all sections in equal card grids
- body text too light to read
- shadows on every card
- icons as the main feature content
- "minimal" pages with weak copy
- center-aligned paragraphs spanning too wide

### 14.2 Color Slop

Do not:

- add blue CTA because "tech"
- use accent color for every link, icon, and button
- color backgrounds by section without reason
- use warm and cool grays together randomly
- use pure white in an ivory system
- use pure black in a slate/ivory system
- add pastel blobs or bokeh orbs

### 14.3 Typography Slop

Do not:

- use untuned Inter
- use 700/800 for every heading
- use too many fonts
- use serif for all text just to feel editorial
- ignore tracking
- set display line-height too loose
- make labels too small to read
- use mono as a decorative theme

### 14.4 Layout Slop

Do not:

- use equal card grids for everything
- make a hero with vague slogan and no object
- hide the actual content below decorative whitespace
- make all sections the same height
- put cards inside cards
- use image placeholders as final art
- use landing-page conventions when the brand wants editorial intelligence

### 14.5 Component Slop

Do not:

- mix pill, 8px, 16px, 24px, and 32px radii randomly
- use heavy card shadows
- make every button black and huge
- add colored chips to metadata
- use disabled gray as normal body text
- make tabs into bulky pills unless using an explicit chip system

---

<a id="decision-tree"></a>
## 15. DECISION TREE

### 15.1 Choose The Canvas

```txt
Should the brand feel like a blank page / AI interface?
  Use pure white.

Should it feel like research or institution?
  Use warm ivory.

Should it feel architectural or measured?
  Use warm gray.

Should it feel product-friendly and SaaS-like?
  Use white plus warm off-white sections.

Should it feel AI/product serious but not stark?
  Use porcelain gray.
```

### 15.2 Choose Typography

```txt
Need maximum restraint?
  Use one sans.

Need research/editorial authority?
  Use sans + serif with strict role separation.

Need architectural precision?
  Use sans + mono.

Need SaaS polish?
  Use light sans display + optional mono.
```

### 15.3 Choose Accent Use

```txt
Can UI be fully achromatic?
  Use black CTA only.

Need brand color?
  Use one violet or earthy accent.

Need emphasis inside text?
  Use underline before color.

Need conversion/product clarity?
  Use black primary CTA with accent hover/focus.
```

### 15.4 Choose Components

```txt
AI/search entry?
  Conversational pill input.

Content hub?
  Asymmetric editorial grid.

Research/lab?
  Dark feature cards + metadata.

Product SaaS?
  Split hero + tabs + warm sections.

Architectural brand?
  Wide grid + mono coordinate labels.
```

---

<a id="css-starter"></a>
## 16. CSS CUSTOM PROPERTY STARTER

```css
:root {
  color-scheme: light;

  /* Palette */
  --em-canvas: #ffffff;
  --em-surface: #ffffff;
  --em-surface-soft: #f1f1f1;
  --em-ink: #000000;
  --em-muted: #666666;
  --em-muted-2: #8f8f8f;
  --em-border: #e5e7eb;
  --em-accent: #000000;
  --em-on-accent: #ffffff;

  /* Type */
  --em-font-sans: Inter, "DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --em-font-serif: Lora, "Playfair Display", Georgia, serif;
  --em-font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --em-text-caption: 13px;
  --em-text-label: 14px;
  --em-text-body: 16px;
  --em-text-body-lg: 17px;
  --em-text-subhead: 18px;
  --em-text-heading: 22px;
  --em-text-heading-lg: 28px;
  --em-text-display: 48px;

  --em-leading-caption: 1.64;
  --em-leading-body: 1.5;
  --em-leading-body-lg: 1.65;
  --em-leading-heading: 1.22;
  --em-leading-display: 1.16;

  --em-tracking-label: 0.011em;
  --em-tracking-heading: -0.01em;
  --em-tracking-display: -0.03em;
  --em-tracking-mono: 0.06em;

  /* Spacing */
  --em-space-1: 4px;
  --em-space-2: 8px;
  --em-space-3: 12px;
  --em-space-4: 16px;
  --em-space-5: 20px;
  --em-space-6: 24px;
  --em-space-8: 32px;
  --em-space-10: 40px;
  --em-space-12: 48px;
  --em-space-16: 64px;
  --em-space-20: 80px;
  --em-space-24: 96px;
  --em-space-28: 112px;
  --em-space-30: 120px;

  /* Shape */
  --em-radius-link: 4px;
  --em-radius-card: 6.08px;
  --em-radius-button: 9999px;
  --em-radius-soft-button: 40px;

  /* Layout */
  --em-max-page: 1200px;
  --em-max-reading: 720px;
  --em-section-gap: 80px;

  /* Motion */
  --em-motion-fast: 120ms;
  --em-motion-base: 180ms;
  --em-ease: cubic-bezier(0.2, 0, 0, 1);
}

.editorial-minimal {
  min-height: 100%;
  background: var(--em-canvas);
  color: var(--em-ink);
  font-family: var(--em-font-sans);
  font-size: var(--em-text-body);
  line-height: var(--em-leading-body);
  text-rendering: geometricPrecision;
}

.editorial-minimal h1 {
  margin: 0;
  font-size: clamp(38px, 6vw, var(--em-text-display));
  line-height: var(--em-leading-display);
  letter-spacing: var(--em-tracking-display);
  font-weight: 600;
}

.editorial-minimal p {
  max-width: var(--em-max-reading);
  color: var(--em-muted);
}

.editorial-minimal a {
  color: inherit;
}
```

### 16.1 Warm Research Override

```css
[data-em-theme="research"] {
  --em-canvas: #faf9f5;
  --em-surface: #f0eee6;
  --em-surface-soft: #e3dacc;
  --em-ink: #141413;
  --em-muted: #87867f;
  --em-muted-2: #b0aea5;
  --em-border: #d1cfc5;
  --em-accent: #d97757;
  --em-on-accent: #141413;
  --em-radius-card: 8px;
  --em-radius-feature: 24px;
  --em-radius-button: 0px;
}
```

### 16.2 Architectural Override

```css
[data-em-theme="architectural"] {
  --em-canvas: #ededed;
  --em-surface: #dedddc;
  --em-surface-dark: #131313;
  --em-ink: #000000;
  --em-muted: #6c6c6c;
  --em-border: #b2b2b2;
  --em-accent: #8931c4;
  --em-radius-card: 32px;
  --em-radius-button: 4px;
}
```

### 16.3 Product Editorial Override

```css
[data-em-theme="product-editorial"] {
  --em-canvas: #ffffff;
  --em-surface: #faf9f6;
  --em-surface-soft: #f1eee9;
  --em-ink: #111111;
  --em-muted: #585858;
  --em-muted-2: #666666;
  --em-border: #dedbd6;
  --em-accent: #0007cb;
  --em-emphasis: #ff5600;
  --em-radius-card: 4px;
  --em-radius-button: 4px;
}
```

### 16.4 Porcelain Override

```css
[data-em-theme="porcelain"] {
  --em-canvas: #e5e7eb;
  --em-surface: #f2f3f5;
  --em-ink: #0f172a;
  --em-muted: #475569;
  --em-muted-2: #64748b;
  --em-border: #d1d5db;
  --em-accent: #8a53e1;
  --em-radius-card: 16px;
  --em-radius-button: 9999px;
  --em-tracking-display: -0.025em;
}
```

---

<a id="tailwind"></a>
## 17. TAILWIND V4 STARTER

```css
@import "tailwindcss";

@theme {
  --color-em-canvas: #ffffff;
  --color-em-surface: #ffffff;
  --color-em-soft: #f1f1f1;
  --color-em-ink: #000000;
  --color-em-muted: #666666;
  --color-em-muted-2: #8f8f8f;
  --color-em-border: #e5e7eb;
  --color-em-accent: #000000;

  --font-em-sans: Inter, "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-em-serif: Lora, "Playfair Display", Georgia, serif;
  --font-em-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;

  --text-em-caption: 13px;
  --text-em-label: 14px;
  --text-em-body: 16px;
  --text-em-body-lg: 17px;
  --text-em-subhead: 18px;
  --text-em-heading: 22px;
  --text-em-heading-lg: 28px;
  --text-em-display: 48px;

  --radius-em-link: 4px;
  --radius-em-card: 6.08px;
  --radius-em-soft-button: 40px;
}
```

### 17.1 Tailwind Example: Blank Hero

```html
<section class="grid justify-items-center gap-6 bg-em-canvas px-6 py-28 text-center text-em-ink">
  <h1 class="max-w-[760px] font-em-sans text-[clamp(38px,6vw,48px)] font-semibold leading-[1.16] tracking-[-0.03em]">
    Research, products, and ideas in one quiet system.
  </h1>
  <div class="flex min-h-[54px] w-full max-w-[640px] items-center rounded-full border border-em-border">
    <input class="w-full bg-transparent px-12 text-em-body outline-none placeholder:text-em-muted" placeholder="Ask about the archive" />
  </div>
  <div class="flex flex-wrap justify-center gap-2">
    <button class="rounded-full bg-em-soft px-4 py-2 text-sm font-medium text-em-ink">Research</button>
    <button class="rounded-full bg-em-soft px-4 py-2 text-sm font-medium text-em-ink">Product</button>
  </div>
</section>
```

### 17.2 Tailwind Example: Research Card

```html
<article class="rounded-[24px] bg-[#141413] p-8 text-[#e8e6dc]">
  <p class="font-em-mono text-xs uppercase tracking-[0.06em] text-[#d1cfc5]">Research / Safety</p>
  <h3 class="mt-8 max-w-[12ch] font-em-serif text-[clamp(42px,7vw,91px)] font-normal leading-[1.1]">
    Measuring model behavior.
  </h3>
  <dl class="mt-10 grid grid-cols-2 gap-4 border-t border-[#3d3d3a] pt-4 font-em-mono text-xs tracking-[0.04em]">
    <div><dt class="text-[#87867f]">DATE</dt><dd class="mt-1">2026.05</dd></div>
    <div><dt class="text-[#87867f]">CATEGORY</dt><dd class="mt-1">Evaluation</dd></div>
  </dl>
</article>
```

---

<a id="recipes"></a>
## 18. COMPONENT RECIPES

### 18.1 OpenAI-like Editorial News Grid

```html
<section class="em-section">
  <header class="em-section-header">
    <h2>Latest</h2>
    <a href="#">View all</a>
  </header>
  <div class="em-editorial-grid">
    <article class="em-editorial-card em-editorial-card--lead">
      <img src="/image-a.jpg" alt="" />
      <p class="em-card-meta">Product - 7 min read</p>
      <h3 class="em-card-title">A quieter way to work with complex systems.</h3>
    </article>
    <div class="em-editorial-stack">
      <article class="em-editorial-card">
        <img src="/image-b.jpg" alt="" />
        <p class="em-card-meta">Research - 4 min read</p>
        <h3 class="em-card-title">How teams evaluate new behavior.</h3>
      </article>
      <article class="em-editorial-card">
        <img src="/image-c.jpg" alt="" />
        <p class="em-card-meta">Company - 3 min read</p>
        <h3 class="em-card-title">Designing tools that leave room to think.</h3>
      </article>
    </div>
  </div>
</section>
```

```css
.em-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
}

.em-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.em-section-header h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.21;
  letter-spacing: -0.01em;
}
```

### 18.2 Anthropic-like Research Feature List

```html
<section class="em-research-list">
  <h2>Latest research</h2>
  <div class="em-research-row">
    <p class="em-research-meta">Safety / 2026.05</p>
    <h3>Building better evaluations for long-running agents.</h3>
    <a href="#">Read</a>
  </div>
  <div class="em-research-row">
    <p class="em-research-meta">Policy / 2026.04</p>
    <h3>How we document model limitations.</h3>
    <a href="#">Read</a>
  </div>
</section>
```

```css
.em-research-list {
  background: #faf9f5;
  color: #141413;
  padding: 64px 24px;
}

.em-research-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 24px;
  align-items: baseline;
  border-top: 1px solid #d1cfc5;
  padding: 20px 0;
}

.em-research-meta {
  margin: 0;
  font-family: var(--em-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: #87867f;
}
```

### 18.3 Legend-like Coordinate Panel

```html
<section class="em-arch-panel">
  <p class="em-coordinate">N48.8566 / E2.3522</p>
  <h2>Interfaces with visible structure.</h2>
  <div class="em-arch-card">
    <span class="em-signal"></span>
    <p>Every surface is measured. Every accent has a job.</p>
  </div>
</section>
```

```css
.em-arch-panel {
  max-width: 1416px;
  margin: 0 auto;
  padding: 68px 24px;
  background: #ededed;
  color: #000000;
}

.em-arch-card {
  margin-top: 40px;
  border-radius: 32px;
  background: #dedddc;
  padding: 32px;
}

.em-signal {
  display: block;
  width: 48px;
  height: 2px;
  background: #8931c4;
}
```

### 18.4 Intercom-like Tabs

```html
<section class="em-product-tabs">
  <div class="em-tabs" role="tablist">
    <button class="em-tab" aria-selected="true">Inbox</button>
    <button class="em-tab">Automation</button>
    <button class="em-tab">Reports</button>
  </div>
  <div class="em-tab-panel">
    <h3>Every conversation stays close to context.</h3>
    <p>Use tabs when the page needs product clarity without heavy card framing.</p>
  </div>
</section>
```

```css
.em-product-tabs {
  background: #faf9f6;
  padding: 64px 24px;
}

.em-tab-panel {
  max-width: 720px;
  padding-top: 32px;
}
```

### 18.5 Limitless-like Product Card

```html
<article class="em-product-card">
  <h3>Memory without the mess.</h3>
  <p>Capture decisions, meetings, and follow-up context in one restrained workspace.</p>
  <button>Learn more</button>
</article>
```

```css
.em-product-card {
  border-radius: 16px;
  background: #f2f3f5;
  box-shadow: rgba(30, 41, 59, 0.15) 0 25px 50px -12px;
  color: #0f172a;
  padding: 24px;
}

.em-product-card h3 {
  font-size: 36px;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.em-product-card p {
  color: #475569;
  font-size: 18px;
  line-height: 1.5;
}
```

---

<a id="product-recipes"></a>
## 19. IMPLEMENTATION RECIPES BY PRODUCT TYPE

### 19.1 AI Company Homepage

Best archetype: OpenAI or Anthropic.

Use:

- centered headline
- conversational input or single CTA
- editorial cards for product/research/company
- very low chroma
- color only in content images
- type-driven footer

Avoid:

- sci-fi gradients
- glowing model diagrams
- generic "AI-powered" language

### 19.2 Research Lab

Best archetype: Anthropic.

Use:

- warm ivory canvas
- sans/serif pairing
- underline emphasis
- dark feature cards
- metadata
- archive rows

Avoid:

- pure white/black
- decorative color
- marketing card grids

### 19.3 Architectural Product Brand

Best archetype: Legend.

Use:

- wide max width
- warm gray canvas
- mono coordinate labels
- large slab cards
- violet edge/focus signal
- measured spacing

Avoid:

- bright CTAs
- soft shadows
- playful illustration

### 19.4 Product SaaS Page

Best archetype: Intercom.

Use:

- white and warm off-white sections
- black CTA
- violet interaction state
- orange tiny emphasis
- tabs
- product copy with light display type

Avoid:

- generic blue SaaS styling
- icon-card grids
- heavy dashboards

### 19.5 AI Productivity Product

Best archetype: Limitless.

Use:

- porcelain gray canvas
- graphite/slate type
- tight single sans
- pill buttons
- subtle product cards
- one violet signal

Avoid:

- gradients
- many fonts
- heavy shadows

---

<a id="checklist"></a>
## 20. QUALITY CHECKLIST

### Identity

- [ ] The chosen archetype is clear.
- [ ] The canvas temperature is intentional.
- [ ] Color strategy is strict.
- [ ] The page still has personality without images.
- [ ] The design feels edited, not empty.

### Typography

- [ ] Font roles are defined.
- [ ] Display tracking is tuned.
- [ ] Body text is readable.
- [ ] Metadata has a specific style.
- [ ] Serif, if used, has a narrow role.
- [ ] Mono, if used, signals structure.

### Color

- [ ] No generic blue CTA.
- [ ] Accent color is rare.
- [ ] Border colors match canvas temperature.
- [ ] Color is not used to patch weak hierarchy.
- [ ] Images carry chroma only if the archetype supports it.

### Layout

- [ ] Section gaps create rhythm.
- [ ] Paragraph widths are controlled.
- [ ] Editorial grids are composed, not generic.
- [ ] Cards are not nested.
- [ ] Footer typography is clean.
- [ ] Mobile layout preserves spacing and readable type.

### Components

- [ ] Buttons follow one radius logic.
- [ ] Inputs are not overdecorated.
- [ ] Tabs use restrained active states.
- [ ] Cards have minimal or no shadow.
- [ ] Focus states are visible.
- [ ] Hover states are quiet.

---

<a id="prompting"></a>
## 21. PROMPTING GUIDE

### 21.1 General Prompt

```txt
Design this in an Editorial Minimal style: typography-first, content-led, precise, and quiet. Use an achromatic or near-achromatic palette, one strict accent rule at most, tuned display tracking, generous whitespace, and editorial composition. Avoid generic blank minimalism, blue SaaS CTAs, decorative gradients, heavy shadows, stock imagery, and card grids with no hierarchy.
```

### 21.2 OpenAI-like Prompt

```txt
Create a pure white achromatic interface where black text, pale borders, and typography do all UI work. Use black filled pill CTAs, ghost pills, a centered conversational input, exact small-radius editorial image cards, and color only through curated editorial media. No colored UI accents or background bands.
```

### 21.3 Anthropic-like Prompt

```txt
Create a warm research-journal identity on ivory paper: slate text, sans UI, serif editorial feature cards, thick underlined keywords as the only decoration, mono metadata labels, and dark feature plates. Avoid pure white, pure black, colored highlights, gradients, and soft shadows.
```

### 21.4 Legend-like Prompt

```txt
Create an architectural minimal interface on warm gray: precise sans typography, small mono coordinate labels, large measured cards, lightweight components, and a single violet edge signal for focus/tags/data. Use spacing and structure instead of decoration.
```

### 21.5 Intercom-like Prompt

```txt
Create a polished editorial SaaS page: white canvas, warm off-white section surfaces, light display typography, black primary CTA, restrained violet interaction states, tiny orange emphasis only when needed, tabs with underline active states, and no glossy card treatment.
```

### 21.6 Limitless-like Prompt

```txt
Create a controlled AI/productivity page on porcelain gray: graphite/slate typography, one tight sans typeface, centered headline, pill buttons, subtle product cards, and one violet brand signal. Keep the whole system restrained, modern, and low-chroma.
```

---

<a id="quick-reference"></a>
## 22. QUICK REFERENCE

### 22.1 Archetype Cheat Sheet

| Need | Use | Canvas | Accent | Type |
| --- | --- | --- | --- | --- |
| strict AI/editorial | OpenAI | pure white | none/black CTA | one sans |
| research lab | Anthropic | warm ivory | rare earthy | sans + serif + mono |
| architectural brand | Legend | warm gray | violet edge | sans + mono |
| polished SaaS | Intercom | white/off-white | violet/orange rationed | light sans + mono |
| controlled product | Limitless | porcelain gray | violet signal | one tight sans |

### 22.2 Default Values

```txt
Max width: 1200px
Reading width: 640-720px
Section gap: 48-80px
Base unit: 4px or 8px
Display size: 48-80px
Body size: 16-18px
Display tracking: -0.03em to -0.02em
Body line-height: 1.45-1.65
Default shadow: none
Accent count: zero or one
```

### 22.3 Do

- Make typography the main identity.
- Pick a canvas temperature.
- Use one accent rule.
- Make whitespace active.
- Use metadata intentionally.
- Compose editorial grids asymmetrically.
- Keep images curated and sparse.
- Tune radius values.
- Prefer borders and spacing over shadows.

### 22.4 Do Not

- Do not use generic blue SaaS CTAs.
- Do not use decorative gradients.
- Do not use card grids as default structure.
- Do not add color just to break up white space.
- Do not leave Inter untuned.
- Do not use stock people imagery.
- Do not make "minimal" mean empty.
- Do not mix multiple radius systems without a rule.

### 22.5 Minimum Viable Editorial Minimal System

```css
:root {
  --canvas: #ffffff;
  --ink: #000000;
  --muted: #666666;
  --border: #e5e7eb;
  --hover: #f1f1f1;
  --font-sans: Inter, "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --radius-card: 6.08px;
  --radius-pill: 9999px;
}

body {
  margin: 0;
  background: var(--canvas);
  color: var(--ink);
  font: 400 16px/1.5 var(--font-sans);
}

h1 {
  font-size: clamp(38px, 6vw, 48px);
  line-height: 1.16;
  letter-spacing: -0.03em;
  font-weight: 600;
}

p {
  color: var(--muted);
  max-width: 68ch;
}

.button {
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: white;
  padding: 10px 16px;
  border: 1px solid var(--ink);
}

.card img {
  border-radius: var(--radius-card);
}
```

This minimum system is enough to avoid default minimal SaaS and start building a real editorial identity.

