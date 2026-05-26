---
name: glossy-modern
description: |
  Glossy Modern aesthetic for premium digital products, browser tools,
  launchers, command centers, creative studios, dark editorial sites, and
  futuristic interfaces that need polished material depth without becoming
  cheap plastic, cyber neon, or generic glassmorphism. Use when the user asks
  for glossy, frosted glass, prism light, obsidian UI, tactile buttons,
  backlit panels, liquid gradients, premium digital surfaces, or a modern
  reflective identity. This skill teaches controlled gloss: layered surfaces,
  light catching edges, restrained blur, readable foregrounds, tactile control
  shadows, neutral canvases, and gradient atmosphere with strict roles.
  Anti-slop: rejects shiny toy gradients, plastic 3D buttons, unreadable glass,
  neon overload, random blobs, reflection effects on every component, and
  frosted cards that replace real hierarchy.
version: 1.0.0
category: design-taste
tags: [glossy-modern, frosted-glass, obsidian-ui, prism-light, backlit-panels, tactile-controls, liquid-gradients, dark-premium, reflective-surfaces]
sources:
  - linear.app/changelog
  - raycast.com
  - diabrowser.com
  - joinlava.com
  - monopo.vn
---

# Glossy Modern - Design Skill

> A skill for creating polished digital interfaces that feel made of glass,
> obsidian, light, and pressure. Distilled from 5 Refero-curated references:
> Changelog, Raycast, Dia Browser, Ayo/Lava, and monopo saigon.

---

## TABLE OF CONTENTS

1. [Core Philosophy](#philosophy)
2. [When To Use This Skill](#when-to-use)
3. [The 5 Source Archetypes](#archetypes)
4. [Shared Design DNA](#shared-dna)
5. [Material Model](#material-model)
6. [Color Systems](#color)
7. [Typography Systems](#typography)
8. [Spacing, Shape, and Density](#spacing)
9. [Surface, Glass, and Reflection](#surfaces)
10. [Gradient and Light Grammar](#light)
11. [Component Patterns](#components)
12. [Layout Patterns](#layouts)
13. [Imagery and Atmosphere](#imagery)
14. [Motion and Interaction](#motion)
15. [Anti-Slop Rules](#anti-slop)
16. [Decision Tree](#decision-tree)
17. [CSS Custom Property Starter](#css-starter)
18. [Tailwind v4 Starter](#tailwind)
19. [Component Recipes](#recipes)
20. [Implementation Recipes by Product Type](#product-recipes)
21. [Quality Checklist](#checklist)
22. [Prompting Guide](#prompting)
23. [Quick Reference](#quick-reference)

---

<a id="philosophy"></a>
## 1. CORE PHILOSOPHY

Glossy Modern is not "put glassmorphism on every card." It is a material
system for digital products. It makes interfaces feel polished, physical,
backlit, and precise while preserving usability.

The style works when the user should feel:

- the interface has depth
- buttons are pressable
- panels catch light at their edges
- gradients are reflections, not decoration
- dark surfaces feel expensive, not empty
- light surfaces feel prismatic, not sterile
- every glow has a purpose
- every surface has a hierarchy

The central rule:

**Gloss is a material cue. Hierarchy still does the work.**

If everything is glossy, nothing is glossy. If every card is translucent, the
page becomes fog. If every button glows, no action is primary. If every surface
has a highlight, the product starts to look like cheap plastic.

Good glossy modern feels:

- sealed
- polished
- responsive
- dimensional
- reflective
- calm
- high-contrast
- engineered
- premium

Bad glossy modern feels:

- slippery
- plastic
- neon
- muddy
- childish
- over-blurred
- low contrast
- decorative
- AI-template generic

The source set defines five poles:

| Source | Archetype | What it teaches |
| --- | --- | --- |
| Changelog | Midnight frosted command | Dark grayscale surfaces, precise borders, pill controls, compact glass |
| Raycast | Obsidian backlit instrument | Tactile controls, inner highlights, radial glows, neutral CTA on black |
| Dia Browser | Prism on white stationery | Light frosted surfaces, spectrum refraction, thin display type, neutral buttons |
| Ayo/Lava | Midnight gradient glow | Controlled multi-hue dark glow, neon edges, energetic futuristic gloss |
| monopo saigon | Fluid frosted depth | Organic gradient atmosphere, minimal translucent UI, massive white type |

The range matters. Glossy Modern can be strict and grayscale, tactile and
obsidian, delicate and light, neon-edged, or fluid/editorial. What unites it is
surface behavior.

### The Glossy Stack

A glossy interface needs a stack:

1. **Canvas** - the deepest material: void black, canvas gray, or soft white.
2. **Atmosphere** - radial glow, prism strip, organic gradient, or subtle fog.
3. **Surface** - card, panel, glass sheet, launcher tile, command row.
4. **Edge** - border, inset highlight, gradient border, thin ring.
5. **Control** - button, pill, key, tab, search input, CTA.
6. **Text** - crisp high-contrast foreground.

Never start with blur. Start with canvas, surface, and text.

### The Material Question

Before designing, choose what the interface is "made of":

- frosted midnight glass
- backlit obsidian
- white prism glass
- liquid dark gradient
- sealed graphite instrument
- dark chrome command shell
- glossy capsule controls
- translucent editorial overlay

This metaphor keeps the design specific.

### Practical Gloss Laws

1. Use fewer colors than you think.
2. Build neutral surface layers first.
3. Add one atmosphere system.
4. Add one tactile control system.
5. Use blur only where a panel is truly translucent.
6. Use inner highlights for pressable elements.
7. Use borders to catch light.
8. Keep text outside the noisiest glow.
9. Make every button state physically legible.
10. Audit the page in grayscale; it should still work.

---

<a id="when-to-use"></a>
## 2. WHEN TO USE THIS SKILL

Use Glossy Modern when a user asks for:

- glossy style
- glass UI
- frosted panels
- prism design
- shiny modern interface
- premium dark UI
- obsidian aesthetic
- Raycast-like polish
- Linear changelog-like dark precision
- tactile keyboard-like buttons
- liquid gradient backgrounds
- futuristic but elegant design
- high-end browser/productivity UI
- dark reflective website
- premium command center
- backlit cards

It works especially well for:

- browser products
- command palettes
- launchers
- productivity apps
- developer tools
- AI assistants
- changelog/release pages
- creative studio portfolios
- premium agency sites
- dark editorial pages
- desktop app marketing
- operating-system-like interfaces
- app directories
- keyboard-driven tools
- internal command centers

Use with caution for:

- healthcare and compliance
- banking dashboards
- long-form documentation
- heavy data tables
- accessibility-first public services
- children or education brands
- low-end ecommerce

Avoid this skill when:

- the brand must feel handmade
- the product needs flat utilitarian clarity
- the user wants no gradients/no effects
- performance constraints forbid blur/filter/shadow use
- the content is mostly long reading
- the product audience expects conservative enterprise design

Glossy Modern pairs well with:

| Pairing | Result |
| --- | --- |
| Dark UI | More premium, material, and tactile |
| Technical Sans | Sharper product/workflow credibility |
| Soft Gradients | More luminous and ambient |
| Cyber Neon | More futuristic, but riskier |
| High-End Design | More editorial and luxury |
| Minimal Design | More restrained and elegant |

Use at most one strong companion style. Gloss already carries a lot of visual
identity.

---

<a id="archetypes"></a>
## 3. THE 5 SOURCE ARCHETYPES

### 3.1 Changelog - Midnight Frosted Command

**Mood:** black glass command log.

Changelog uses a dark achromatic palette, compact spacing, precise borders,
pill controls, and variable-weight typography. The gloss is extremely quiet:
thin rings, subtle surface steps, and hoverable pills. It is a serious,
information-first system.

Key tokens:

| Role | Token |
| --- | --- |
| Canvas | `#08090a` |
| Surface | `#141516` |
| Deeper layer | `#1c1c1f` |
| Border | `#23252a`, `#2d2e31`, `#34343a` |
| Shadow/ring tint | `#3e3e44` |
| Primary text | `#f7f8f8` |
| Secondary text | `#d0d6e0` |
| Muted text | `#8a8f98` |
| Highlight | `#e4e5e9` |

What to copy:

- dark grayscale layers
- border-led depth
- compact rhythm
- pill controls
- Inter Variable weights around 500/590
- mono for technical details
- no loud accent requirement

What to avoid:

- heavy shadows
- bright chromatic UI fills
- too much blur
- big decorative hero imagery
- low-contrast gray text

Best for:

- changelogs
- release notes
- developer communication
- dark documentation
- compact product logs
- command-center pages

### 3.2 Raycast - Obsidian Backlit Instrument

**Mood:** a launcher made of black glass and keyboard pressure.

Raycast uses near-total darkness, charcoal strata, radial blue/purple glows,
near-white CTAs, and tactile key shadows. It is one of the strongest references
for pressable UI: elements feel physically depressed into the surface.

Key tokens:

| Role | Token |
| --- | --- |
| Canvas | `#040506` |
| First surface | `#07080a` |
| Card surface | `#111214` |
| Badge surface | `#1b1c1e` |
| Divider/border | `#363739`, `#454647` |
| Secondary text | `#6a6b6c` |
| Tertiary text | `#9c9c9d` |
| Neutral CTA | `#e6e6e6` |
| Primary text | `#ffffff` |
| Brand/status | `#ff6363` |
| Rare signal | `#59d499` |
| Atmosphere | blue/violet radial glows |

What to copy:

- void black canvas
- backlit neutral panels
- inner highlight shadows
- near-white button on black
- restrained status colors
- atmospheric radial glows
- two-register typography

What to avoid:

- colored section backgrounds
- chromatic primary CTA
- overly round cards
- flat black with no material cues
- many competing glows

Best for:

- launchers
- command palettes
- desktop tools
- productivity apps
- keyboard-first experiences
- developer utilities

### 3.3 Dia Browser - Prism on White Stationery

**Mood:** color refracting through frosted paper.

Dia Browser is the light/glass side of Glossy Modern. The canvas is almost
achromatic, but a spectrum gradient appears as ambient refraction. Surfaces are
white at high opacity with backdrop blur, buttons are deliberately neutral, and
thin display type feels etched into glass.

Key tokens:

| Role | Token |
| --- | --- |
| Canvas | `#f8f8f8` |
| Surface | `rgba(255,255,255,.90)` |
| Header/section fog | `#efefef` |
| Button neutral | `#d9d9d9` |
| Body text | `#636363` |
| Metadata | `#959595` |
| Primary text | `#000000` |
| Spectrum stops | pink, red, amber, lavender, blue |
| Accent blue | `#0358f7` |
| Amber stop | `#ffb005` |
| Hot pink token | `#fd02f5` |

What to copy:

- neutral light canvas
- frosted white surfaces
- spectrum as light/refraction
- thin display type
- large radii
- neutral buttons
- minimal shadow

What to avoid:

- saturated gradient button fills
- gradient text
- sharp corners
- heavy shadows
- too many chromatic UI elements

Best for:

- browsers
- AI search
- elegant landing pages
- creative tools
- light premium SaaS
- knowledge assistants

### 3.4 Ayo/Lava - Midnight Gradient Glow

**Mood:** futuristic dark glow with neon edges.

Ayo/Lava brings energy into glossy modern. It uses black and charcoal surfaces,
multi-hued gradients, vivid pink/purple depth, and neon green edge accents. It
is more expressive than Changelog or Raycast, but it still needs strict role
control to avoid cyber-neon chaos.

Key tokens:

| Role | Token |
| --- | --- |
| Canvas | `#000000` |
| Elevated surface | `#1f2023` |
| Carbon/muted | `#333333` |
| Spectrum atmosphere | multi-hued gradient |
| Vivid depth | `#491363` |
| Neon edge | `#04fd8f` |

What to copy:

- dark surface interiors
- multi-hue atmosphere
- neon edge accents
- rounded tactile controls
- bright outlines used sparingly
- high-contrast text

What to avoid:

- spectrum behind paragraphs
- neon green body text
- every card glowing
- cyberpunk overload
- too many bright action colors

Best for:

- AI/video/creative tools
- futuristic product launches
- expressive dark brands
- youth-facing productivity
- high-energy conversion pages

### 3.5 monopo saigon - Fluid Frosted Depth

**Mood:** sculpted organic gradient space.

monopo saigon uses dark full-bleed gradients, minimal translucent UI, huge white
type, pill buttons, and atmospheric depth. It is less product-dashboard and
more brand/editorial. The background is the material.

Key tokens:

| Role | Token |
| --- | --- |
| Canvas | `#000000` |
| Primary text | `#ffffff` |
| Deep shadow | `#181818` |
| Muted button/quiet UI | `#636363` |
| Muted body | `#6d6d6d` |
| Main atmosphere | `linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37))` |

What to copy:

- full-bleed atmospheric gradients
- stark white typography
- minimal UI overlays
- giant display type
- huge pill buttons
- depth through gradient volume rather than shadows

What to avoid:

- bento dashboard clutter
- standard SaaS shadows
- sharp buttons
- low-contrast small text over busy gradients
- extra accent colors outside the atmosphere

Best for:

- creative studios
- agency sites
- portfolio systems
- artful brand launches
- cinematic dark websites

---

<a id="shared-dna"></a>
## 4. SHARED DESIGN DNA

Despite different moods, all five references share a deep visual grammar.

### 4.1 Gloss is edge behavior

The surface becomes glossy when light catches the edge:

- 1px border
- inset highlight
- top inner shadow
- gradient border
- pale ring on dark
- translucent white edge on light
- subtle hover outline

Do not rely only on blur. A blurred card without a controlled edge looks like
fog, not glass.

### 4.2 The canvas is disciplined

Gloss needs a calm base:

- void black
- canvas black
- matte charcoal
- soft white
- pale gray
- controlled organic gradient

The canvas should not already contain every color in the palette. Leave room
for surfaces and controls.

### 4.3 Foreground contrast is non-negotiable

Glossy surfaces can lower contrast quickly. Preserve:

- near-white text on dark
- black/graphite text on light
- readable muted text
- icons with enough stroke contrast
- buttons with obvious states
- form inputs with visible outlines

Never use translucent white text over a busy gradient.

### 4.4 Tactile controls are more important than decorative shine

Glossy Modern is strongest when buttons, pills, keys, and inputs feel physical.
Use:

- inset highlights
- stacked shadows
- ring borders
- pressed states
- small translations
- clear hover/focus state

Avoid:

- huge reflective overlays
- specular streaks on every card
- animated shine across text
- plastic skeuomorphic buttons

### 4.5 Color has strict jobs

Color roles:

- atmosphere
- brand signal
- status
- focus
- primary action
- rare highlight

Do not let one color perform all roles. For example, Raycast red is brand/status,
not the CTA. Dia spectrum is ambient identity, not button fill. Lava neon green
is edge/focus, not paragraph text.

### 4.6 Type stabilizes the material

Glossy interfaces can feel slippery. Typography pins them down:

- tight Inter for command systems
- mono for technical details
- thin display for prism glass
- giant simple sans for fluid editorial
- compact labels for dense controls

Type should feel intentional, not just default.

### 4.7 Depth is layered, not loud

Depth can come from:

- surface color steps
- border/ring contrast
- inset highlights
- low-opacity radial glow
- translucent surface over atmosphere
- shadow stack for tactile objects

Depth should not come from:

- huge black drop shadows everywhere
- random blur
- reflection PNG overlays
- extreme 3D transforms
- uncontrolled gradients

---

<a id="material-model"></a>
## 5. MATERIAL MODEL

Before building, pick a material model. This prevents generic "glass card"
design.

### 5.1 Frosted Midnight Glass

Reference: Changelog.

Properties:

- black/charcoal base
- subtle grayscale steps
- crisp white text
- line borders
- pills and tabs
- compact spacing
- very little color

Use for:

- changelogs
- docs
- release pages
- product logs
- dark UI pages

Material recipe:

```css
.midnight-glass {
  background: #141516;
  border: 1px solid #34343a;
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.03),
    0 0 0 1px rgba(0,0,0,.42);
}
```

### 5.2 Backlit Obsidian

Reference: Raycast.

Properties:

- near-pure black canvas
- small charcoal jumps
- inner top highlight
- heavy dark under-shadow
- radial glows behind sections
- neutral near-white CTA

Use for:

- launchers
- command palettes
- productivity tools
- desktop app pages

Material recipe:

```css
.obsidian-key {
  background: #111214;
  border: 1px solid #363739;
  border-radius: 8px;
  box-shadow:
    0 1.5px .5px 2px rgba(0,0,0,.40),
    0 0 .5px 1px rgba(0,0,0,1),
    inset 0 2px 1px 1px rgba(0,0,0,.25),
    inset 0 1px 1px rgba(255,255,255,.20);
}
```

### 5.3 Prism Frost

Reference: Dia Browser.

Properties:

- pale gray canvas
- white translucent cards
- blur
- spectrum accent as refraction
- thin display type
- large soft radii
- neutral buttons

Use for:

- browser/search tools
- AI assistants
- light premium pages
- creative workspaces

Material recipe:

```css
.prism-frost {
  background: rgba(255,255,255,.90);
  border: 1px solid rgba(255,255,255,.74);
  border-radius: 30px;
  backdrop-filter: blur(24px);
  box-shadow: 0 0 8px rgba(0,0,0,.08);
}
```

### 5.4 Neon Edge Glass

Reference: Ayo/Lava.

Properties:

- black canvas
- charcoal cards
- multi-hue atmosphere
- bright focus outlines
- neon edge accents
- rounded tactile controls

Use for:

- expressive AI products
- creative tools
- futuristic launches
- dark consumer/prosumer pages

Material recipe:

```css
.neon-edge-card {
  background: #1f2023;
  border: 1px solid rgba(4,253,143,.22);
  border-radius: 18px;
  box-shadow:
    0 24px 80px rgba(0,0,0,.45),
    0 0 48px rgba(73,19,99,.18);
}
```

### 5.5 Fluid Gradient Glass

Reference: monopo saigon.

Properties:

- black full-bleed base
- organic gradient depth
- minimal translucent UI
- huge white typography
- pill buttons
- no conventional elevation

Use for:

- agency/creative sites
- editorial launches
- cinematic brand pages
- artful portfolios

Material recipe:

```css
.fluid-field {
  background:
    linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37)),
    #000;
}

.fluid-overlay {
  background: rgba(0,0,0,.20);
  border: 1px solid rgba(255,255,255,.30);
  border-radius: 75px;
  color: #fff;
}
```

---

<a id="color"></a>
## 6. COLOR SYSTEMS

Glossy Modern color is less about hue and more about material. Define surface
steps before choosing accent colors.

### 6.1 Core Palette Architecture

Every glossy palette should define:

1. Deep canvas
2. Base surface
3. Raised surface
4. Border/ring
5. Inner highlight
6. Primary text
7. Muted text
8. Atmosphere gradient
9. Action color or action neutral
10. Status colors

### 6.2 Dark Gloss Palette

Use for command centers and tools.

```css
:root {
  --canvas: #040506;
  --surface-1: #07080a;
  --surface-2: #111214;
  --surface-3: #1b1c1e;
  --border: #363739;
  --border-soft: #23252a;
  --highlight: rgba(255,255,255,.20);
  --text: #ffffff;
  --text-soft: #d0d6e0;
  --muted: #8a8f98;
  --cta: #e6e6e6;
  --cta-text: #2f3031;
  --status-red: #ff6363;
  --status-mint: #59d499;
}
```

### 6.3 Midnight Frost Palette

Use for changelog/docs.

```css
:root {
  --canvas: #08090a;
  --surface: #141516;
  --surface-deep: #1c1c1f;
  --line: #34343a;
  --border: #23252a;
  --shadow-tint: #3e3e44;
  --text: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-muted: #8a8f98;
  --highlight: #e4e5e9;
}
```

### 6.4 Light Prism Palette

Use for light glossy pages.

```css
:root {
  --canvas: #f8f8f8;
  --surface: rgba(255,255,255,.90);
  --fog: #efefef;
  --button: #d9d9d9;
  --text: #000000;
  --body: #636363;
  --muted: #959595;
  --border: rgba(0,0,0,.08);
  --rose: #c679c4;
  --amber: #ffb005;
  --blue: #0358f7;
  --pink: #fd02f5;
  --spectrum: linear-gradient(90deg, #fd02f5, #ff4b4b, #ffb005, #c679c4, #0358f7);
}
```

### 6.5 Neon Edge Palette

Use for expressive dark futuristic work.

```css
:root {
  --canvas: #000000;
  --surface: #1f2023;
  --surface-2: #333333;
  --text: #ffffff;
  --muted: #b7b7b7;
  --edge: #04fd8f;
  --violet-depth: #491363;
  --spectrum: linear-gradient(135deg, #491363, #0358f7, #04fd8f);
}
```

### 6.6 Fluid Editorial Palette

Use for creative studios and artful pages.

```css
:root {
  --canvas: #000000;
  --text: #ffffff;
  --deep-shadow: #181818;
  --mist: #636363;
  --whisper: #6d6d6d;
  --fluid: linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37));
}
```

### 6.7 Color Role Discipline

| Color type | Good role | Bad role |
| --- | --- | --- |
| Near white | CTA on black, primary text | giant glowing card fill |
| Red | brand/status signal | primary CTA everywhere |
| Blue/purple gradient | background light | all surfaces/buttons |
| Spectrum | refraction/ambient strip | body text or CTA fill |
| Neon green | focus edge, selected outline | paragraph copy |
| Organic gradient | full-bleed identity | dense content background |
| Graphite | surface hierarchy | body copy if too low contrast |

### 6.8 Contrast Rules

- On black, primary text should be `#f7f8f8`, `#ffffff`, or close.
- Muted dark UI text should not be too close to background.
- On light prism, use black for headings and graphite for body.
- Avoid colored text on gradients unless large and decorative.
- Buttons must pass contrast in all states.
- Inputs must have visible border and placeholder.

### 6.9 Grayscale Audit

Glossy Modern should work in grayscale because material hierarchy is built
through value and edge. If the interface collapses in grayscale, it was relying
too heavily on hue.

Checklist:

- Can you distinguish surface levels?
- Is the primary CTA still obvious?
- Are borders visible?
- Are hover/focus states visible?
- Is the hero object clear?
- Can you read secondary text?

---

<a id="typography"></a>
## 7. TYPOGRAPHY SYSTEMS

Typography in Glossy Modern does one of two things:

1. It makes the interface feel engineered.
2. It makes the surface feel delicate and premium.

Choose one dominant voice.

### 7.1 Typeface Pairings

| Archetype | Primary | Secondary | Mood |
| --- | --- | --- | --- |
| Midnight frosted command | Inter Variable | Berkeley Mono | compact, precise, serious |
| Obsidian instrument | Inter | Geist Mono | tactile, launcher-like |
| Prism frost | ABC Oracle-like light display | same family or DM Sans | airy, etched, delicate |
| Neon edge glass | compact modern sans | mono optional | futuristic, energetic |
| Fluid depth | Roobert/system sans | optional alternate display | cinematic, brand-led |

### 7.2 Type Scale

Use a broad scale because glossy sites often combine tiny controls with large
display.

| Token | Size | Use |
| --- | --- | --- |
| micro | 10-11px | version strings, tiny metadata |
| caption | 12px | badges, timestamps |
| label | 13-14px | tabs, pills, nav |
| body-sm | 14-15px | compact descriptions |
| body | 16-17px | readable body |
| body-lg | 18-20px | lead copy |
| heading-sm | 22-24px | card headings |
| heading | 32px | section headings |
| heading-lg | 48-56px | major headlines |
| display | 64-94px | hero display |
| giant | 120-225px | editorial fluid pages only |

### 7.3 Tracking Rules

Use tracking to create material feeling:

- Dark command display: slightly negative, around `-0.01em`.
- Raycast-like headline: tighter display tracking, but do not overdo unless font supports it.
- Micro labels: positive tracking `0.03em` to `0.07em`.
- Prism display: strong negative tracking around `-0.04em`.
- Fluid editorial: normal tracking can work at huge sizes.
- Body: `0` or slightly negative only if the typeface is designed for it.

### 7.4 Weight Rules

- Command systems: 400/500/590, avoid heavy 800.
- Obsidian tools: 400/500/600, strong but not chunky.
- Prism light: 300 for display, 400 body, 500 labels.
- Neon edge: 500/600 for headings, 400 body.
- Fluid editorial: 300/400/600 depending on scale.

### 7.5 Line-Height Rules

| Text | Line height |
| --- | --- |
| Giant display | 0.70-1.0 |
| Hero display | 1.0-1.15 |
| Heading | 1.1-1.25 |
| Compact UI | 1.2-1.4 |
| Body | 1.45-1.65 |
| Long copy | 1.6-1.75 |

### 7.6 Mono Usage

Mono is important for glossy command systems:

- code snippets
- terminal commands
- keyboard shortcuts
- timestamps
- version labels
- changelog tags
- command IDs
- model names

Do not set marketing paragraphs in mono unless the whole brand is a technical
artifact.

### 7.7 Copy Tone

Glossy Modern copy should be concise and concrete.

Good:

- "Launch every workflow from one command surface."
- "A browser built around intent."
- "Release notes with the signal left intact."
- "Design systems for teams that move in public."
- "Compose, search, and automate without leaving the keyboard."

Bad:

- "A beautiful glossy futuristic experience like never before."
- "Shimmering digital magic for your productivity."
- "The most immersive gradients in the universe."

---

<a id="spacing"></a>
## 8. SPACING, SHAPE, AND DENSITY

Glossy Modern supports both compact command UIs and spacious brand pages.
Choose density based on archetype.

### 8.1 Density Modes

#### Compact Command

Reference: Changelog.

- base unit: 4px
- section gap: 24-48px
- card padding: 12-16px
- element gap: 8px
- row height: 36-48px
- card radius: 8px
- pill radius: 9999px

Use for:

- changelog
- docs
- technical lists
- compact filters
- command logs

#### Tactile Instrument

Reference: Raycast.

- base unit: 8px
- section gap: 80px
- card padding: 24px
- element gap: 15-16px
- card radius: 11-20px
- button radius: 8px or pill
- modal radius: 16px

Use for:

- desktop tools
- launcher websites
- keyboard-first apps
- product showcases

#### Spacious Prism

Reference: Dia Browser.

- base unit: 8px
- section gap: 80-120px
- card padding: 32px
- element gap: 15-20px
- card/button radius: 30px
- container radius: 40px

Use for:

- browsers
- search
- AI assistants
- light premium landing pages

#### Fluid Editorial

Reference: monopo saigon.

- base unit: 4px
- section gap: 46-96px
- card padding: 34px
- element gap: 14px
- card radius: 10px
- button radius: 75px
- max width: around 1078px

Use for:

- studios
- portfolios
- cinematic brand pages

### 8.2 Radius Grammar

Glossy Modern uses radius as material language:

| Shape | Radius | Meaning |
| --- | --- | --- |
| Micro interactive | 4-6px | precise, engineered |
| Tactile key | 8px | pressable, hardware-like |
| Card | 8-12px | compact glass pane |
| Modal | 16px | raised sealed panel |
| Large product card | 20px | premium showcase |
| Frosted card | 30-40px | soft prism glass |
| Pill | 9999px | capsule control |
| Editorial pill | 60-80px | cinematic capsule |

Rules:

- Do not mix sharp and huge radii randomly.
- Keep cards less round than pills.
- Prism pages can use larger radii throughout.
- Command pages should keep card radii modest.
- Fluid pages can use huge pill buttons.

### 8.3 Spacing Contrast

Good glossy layouts often contrast:

- spacious hero
- compact control clusters
- airy atmosphere
- dense product surfaces
- big display text
- tiny metadata

This contrast makes the interface feel professional.

### 8.4 Alignment

Gloss amplifies misalignment. Use strict geometry:

- align panel edges
- align pill baselines
- align icon centers
- keep border radii consistent
- define fixed button heights
- keep cards on grid
- avoid random floating cards unless the composition is editorial

---

<a id="surfaces"></a>
## 9. SURFACE, GLASS, AND REFLECTION

Gloss lives in the surface system. This section is the core production guide.

### 9.1 Surface Levels

#### Dark Command Surface

```css
.surface-command {
  background: #141516;
  border: 1px solid #34343a;
  border-radius: 8px;
  color: #f7f8f8;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.03),
    0 0 0 1px rgba(0,0,0,.45);
}
```

Use for:

- changelog cards
- filters
- small panels
- dark docs modules

#### Obsidian Key Surface

```css
.surface-key {
  background: linear-gradient(180deg, #1b1c1e, #111214);
  border: 1px solid #363739;
  border-radius: 8px;
  color: #fff;
  box-shadow:
    0 1.5px .5px 2.5px rgba(0,0,0,.40),
    0 0 .5px 1px #000,
    inset 0 2px 1px 1px rgba(0,0,0,.25),
    inset 0 1px 1px 1px rgba(255,255,255,.20);
}
```

Use for:

- shortcut keys
- launcher buttons
- command palette rows
- compact CTAs

#### Frosted Prism Surface

```css
.surface-prism {
  background: rgba(255,255,255,.90);
  border: 1px solid rgba(255,255,255,.70);
  border-radius: 30px;
  color: #000;
  backdrop-filter: blur(24px);
  box-shadow: 0 0 8px rgba(0,0,0,.08);
}
```

Use for:

- browser panels
- search cards
- light hero surfaces
- onboarding panes

#### Neon Edge Surface

```css
.surface-neon-edge {
  background: #1f2023;
  border: 1px solid rgba(4,253,143,.22);
  border-radius: 18px;
  color: #fff;
  box-shadow:
    0 24px 80px rgba(0,0,0,.48),
    0 0 54px rgba(73,19,99,.18);
}
```

Use for:

- futuristic feature cards
- AI preview panels
- selected surfaces
- hero product frames

#### Fluid Overlay Surface

```css
.surface-fluid {
  background: rgba(0,0,0,.18);
  border: 1px solid rgba(255,255,255,.30);
  border-radius: 24px;
  color: #fff;
  backdrop-filter: blur(10px);
}
```

Use for:

- minimal editorial overlays
- nav capsules
- small content blocks over gradient

### 9.2 Reflection Cues

Use these cues sparingly:

- top inset white line
- bottom dark inset shadow
- gradient border
- radial highlight clipped inside card
- subtle linear sheen on hover
- edge glow only on active state

Avoid:

- diagonal shine stripes on every card
- white streaks across text
- animated reflection loops
- 3D chrome effects
- high-opacity specular overlays

### 9.3 Blur Rules

Blur should express translucency, not hide poor hierarchy.

Use blur:

- on a frosted panel over ambient background
- on sticky nav over gradient
- on a modal backdrop
- on a light prism card
- in a subtle fluid overlay

Avoid blur:

- on dense tables
- on code blocks
- on all cards
- behind paragraphs
- over high-frequency imagery
- when performance matters

Blur scale:

| Blur | Use |
| --- | --- |
| 6-10px | light overlay, nav |
| 12-18px | dark translucent overlay |
| 24px | prism frosted card |
| 32px+ | background-only effect |

### 9.4 Border and Ring Rules

Dark glossy interfaces depend on borders:

```css
--ring-subtle: 0 0 0 1px rgba(255,255,255,.08);
--ring-graphite: 0 0 0 1px #34343a;
--ring-highlight: 0 0 0 1px rgba(255,255,255,.20);
```

Use:

- 1px ring for cards
- brighter ring on hover
- inset ring for pressed buttons
- colored ring for focus/selected state

Do not:

- use 2-4px borders casually
- put neon border on every card
- remove borders from dark controls
- use only shadow for separation

### 9.5 Tactile Shadow Stack

For pressable controls:

```css
.pressable {
  box-shadow:
    0 1.5px .5px 2px rgba(0,0,0,.40),
    0 0 .5px 1px rgba(0,0,0,1),
    inset 0 2px 1px 1px rgba(0,0,0,.25),
    inset 0 1px 1px rgba(255,255,255,.20);
}

.pressable:active {
  transform: translateY(1px);
  box-shadow:
    0 .5px .5px 1px rgba(0,0,0,.55),
    inset 0 2px 2px rgba(0,0,0,.34),
    inset 0 1px 0 rgba(255,255,255,.10);
}
```

Use for:

- command keys
- download buttons
- shortcut chips
- launcher tiles

Avoid for:

- large cards
- long rows
- text links
- static content panels

---

<a id="light"></a>
## 10. GRADIENT AND LIGHT GRAMMAR

Glossy Modern uses gradients as light sources, refraction, or fluid material.

### 10.1 Light Types

| Type | Use | Reference |
| --- | --- | --- |
| Border light | Edge definition | Changelog |
| Radial backlight | Atmosphere behind panels | Raycast |
| Spectrum refraction | Brand/prism identity | Dia |
| Neon edge glow | Futuristic focus | Ayo/Lava |
| Organic fluid gradient | Full-bleed material field | monopo saigon |

### 10.2 Radial Backlight

```css
.nebula-field {
  background:
    radial-gradient(84% 73% at 50% 26%, rgba(4,63,150,.52), rgba(6,18,37,.18) 60%, transparent 100%),
    #040506;
}

.violet-field {
  background:
    radial-gradient(86% 75% at 50% 24%, rgba(82,48,145,.52), rgba(26,11,51,.14) 60%, transparent 100%),
    #040506;
}
```

Rules:

- place behind sections, not inside every card
- keep surface backgrounds neutral
- avoid bright color at the text center
- use only one strong glow per viewport

### 10.3 Prism Strip

```css
.prism-strip {
  height: 2px;
  background: linear-gradient(90deg, #fd02f5, #ff4b4b, #ffb005, #c679c4, #0358f7);
}
```

Use for:

- top edge of hero panel
- subtle divider
- logo-adjacent accent
- active tab underline
- ambient glow source

Do not use for:

- buttons
- text fill
- every section divider
- dense UI borders

### 10.4 Fluid Gradient Field

```css
.fluid-depth {
  background:
    radial-gradient(900px circle at 12% 18%, rgba(160,224,171,.26), transparent 42%),
    radial-gradient(820px circle at 58% 34%, rgba(255,172,46,.30), transparent 38%),
    radial-gradient(780px circle at 86% 78%, rgba(165,45,37,.26), transparent 42%),
    #000;
}
```

Use for:

- hero backgrounds
- portfolio landing pages
- visual brand sections
- atmospheric transition bands

Do not:

- place tables over it
- place small gray text over it
- add many cards on top
- combine with many accent colors

### 10.5 Neon Edge Glow

```css
.selected-edge {
  border-color: rgba(4,253,143,.48);
  box-shadow:
    0 0 0 1px rgba(4,253,143,.12),
    0 0 36px rgba(4,253,143,.12);
}
```

Use for:

- active tab
- selected card
- focus ring
- scanning state
- progress edge

Do not:

- use for all cards
- use for body copy
- mix with red/blue/pink active states in the same component set

### 10.6 Glossy Gradient Border

```css
.glass-border {
  border: 1px solid transparent;
  background:
    linear-gradient(#111214, #111214) padding-box,
    linear-gradient(135deg, rgba(255,255,255,.28), rgba(255,255,255,.04), rgba(4,253,143,.22)) border-box;
}
```

Use for:

- one hero product panel
- active feature card
- premium modal
- selected integration card

Avoid:

- every card in a grid
- small buttons
- text-only content

### 10.7 Shine Overlay

Use a shine overlay only for hover, and keep it subtle:

```css
.shine-hover {
  position: relative;
  overflow: hidden;
}

.shine-hover::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,.12) 48%, transparent 72%);
  transform: translateX(-40%);
  transition: opacity 180ms ease, transform 360ms ease;
}

.shine-hover:hover::after {
  opacity: 1;
  transform: translateX(40%);
}
```

Rules:

- only on primary tactile cards or buttons
- never over text-heavy cards
- no infinite shine loop
- respect reduced motion

---

<a id="components"></a>
## 11. COMPONENT PATTERNS

### 11.1 Glossy Primary CTA

#### Neutral Obsidian CTA

```css
.cta-obsidian {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.18);
  background: #e6e6e6;
  color: #2f3031;
  font-weight: 650;
  box-shadow:
    0 18px 48px rgba(0,0,0,.45),
    inset 0 1px 0 rgba(255,255,255,.65);
}
```

Use when the design should feel mature and instrument-like.

#### Ghost Command CTA

```css
.cta-ghost-command {
  height: 40px;
  padding: 0 16px;
  border-radius: 9999px;
  border: 1px solid #f7f8f8;
  background: transparent;
  color: #f7f8f8;
  font-weight: 500;
}
```

Use for Changelog-like dark utility pages.

#### Prism Neutral CTA

```css
.cta-prism {
  height: 48px;
  padding: 0 22px;
  border-radius: 30px;
  border: 1px solid rgba(0,0,0,.08);
  background: #d9d9d9;
  color: #000;
  font-weight: 500;
  box-shadow: 0 0 8px rgba(0,0,0,.08);
}
```

Use for light frosted pages where chromatic CTAs would feel too loud.

#### Neon Edge CTA

```css
.cta-neon-edge {
  height: 46px;
  padding: 0 20px;
  border-radius: 9999px;
  border: 1px solid rgba(4,253,143,.46);
  background: rgba(4,253,143,.10);
  color: #fff;
  font-weight: 650;
  box-shadow: 0 0 34px rgba(4,253,143,.12);
}
```

Use for futuristic products, but only when neon edge is the action signal.

### 11.2 Command Search Input

```css
.command-search {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #34343a;
  border-radius: 9999px;
  background: #141516;
  color: #f7f8f8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
}

.command-search input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.command-search input::placeholder {
  color: #8a8f98;
}
```

### 11.3 Prism Search Input

```css
.prism-search {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 10px 12px 10px 20px;
  border-radius: 32px;
  border: 1px solid rgba(255,255,255,.72);
  background: rgba(255,255,255,.90);
  backdrop-filter: blur(24px);
  box-shadow: 0 0 8px rgba(0,0,0,.08);
}
```

### 11.4 Changelog Card

```css
.changelog-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #34343a;
  border-radius: 8px;
  background: transparent;
  color: #f7f8f8;
}

.changelog-card .date {
  font-family: "Berkeley Mono", ui-monospace, monospace;
  color: #8a8f98;
  font-size: 12px;
}
```

### 11.5 Pressable Key

```css
.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 30px;
  padding: 0 9px;
  border-radius: 8px;
  border: 1px solid #363739;
  background: linear-gradient(180deg, #1b1c1e, #111214);
  color: #e6e6e6;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  letter-spacing: .04em;
  box-shadow:
    0 1.5px .5px 2px rgba(0,0,0,.40),
    0 0 .5px 1px #000,
    inset 0 2px 1px 1px rgba(0,0,0,.25),
    inset 0 1px 1px rgba(255,255,255,.20);
}
```

### 11.6 Glossy Pill

```css
.gloss-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.04);
  color: #f7f8f8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}
```

### 11.7 Frosted Navigation

```css
.frosted-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 24px;
  border-bottom: 1px solid rgba(255,255,255,.10);
  background: rgba(8,9,10,.72);
  backdrop-filter: blur(18px);
}
```

Light variant:

```css
.prism-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 24px;
  border-bottom: 1px solid rgba(0,0,0,.06);
  background: rgba(248,248,248,.78);
  backdrop-filter: blur(18px);
}
```

### 11.8 Product Panel

```css
.product-panel {
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.12);
  background: #111214;
  box-shadow:
    0 34px 120px rgba(0,0,0,.52),
    inset 0 1px 0 rgba(255,255,255,.04);
}

.product-panel-header {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: #1b1c1e;
}
```

### 11.9 Gradient Atmosphere Card

```css
.atmosphere-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,.14);
  background: #111214;
}

.atmosphere-card::before {
  content: "";
  position: absolute;
  inset: -40%;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 20%, rgba(3,88,247,.20), transparent 32%),
    radial-gradient(circle at 80% 0%, rgba(253,2,245,.14), transparent 28%);
}

.atmosphere-card > * {
  position: relative;
}
```

---

<a id="layouts"></a>
## 12. LAYOUT PATTERNS

### 12.1 Dark Command Changelog

Use for release notes, updates, docs, and technical narrative.

Structure:

```txt
sticky frosted nav
compact hero title
filter pills / search
single-column changelog cards
technical tags
footer links
```

Design notes:

- Make the content the hero.
- Use compact rhythm.
- Use pill filters.
- Use mono dates.
- Avoid decorative hero imagery.

### 12.2 Obsidian Product Launcher

Use for Raycast-like desktop tools and command palettes.

Structure:

```txt
dark nav
hero claim
large launcher/search product panel
shortcut key row
feature sections with radial backlight
download CTA
```

Design notes:

- The product panel should feel like a physical app window.
- Use keycaps and command rows.
- Keep CTA neutral or near-white.
- Add radial glow behind section, not on controls.

### 12.3 Light Prism Browser Hero

Use for browser/search/assistant products.

Structure:

```txt
light translucent nav
thin display headline
frosted search/input panel
spectrum strip or glow
large rounded product preview
quiet feature cards
```

Design notes:

- Use neutral gray buttons.
- Keep spectrum as refraction.
- Use high-opacity white cards.
- Keep the type airy and thin.

### 12.4 Neon Edge Launch

Use for futuristic tools needing more energy.

Structure:

```txt
black nav
dark gradient hero
neon edge product frame
rounded CTA
feature cards with selected glow
dark proof sections
```

Design notes:

- Use one neon edge color.
- Keep card interiors dark.
- Do not make every section glow.
- Let the product frame be the brightest object.

### 12.5 Fluid Editorial Site

Use for studios, portfolios, creative sites.

Structure:

```txt
minimal overlay nav
full-bleed fluid gradient
massive white headline
pill action controls
case/project sections
minimal overlays
footer over black
```

Design notes:

- Background carries identity.
- UI should be minimal.
- Typography provides structure.
- Avoid SaaS bento overload.

### 12.6 Mixed Gloss Product Page

When a product needs both polish and usability:

```txt
glossy hero
solid proof section
product module
feature grid with restrained surfaces
security/credibility section
CTA band with controlled atmosphere
```

Rules:

- Use glossy material most strongly in hero and key product frames.
- Use simpler solid sections for explanations.
- Do not keep max visual intensity for the entire page.

---

<a id="imagery"></a>
## 13. IMAGERY AND ATMOSPHERE

Glossy Modern needs visual material, not stock imagery.

### 13.1 Preferred Visuals

- app windows
- command palettes
- keyboard shortcut surfaces
- frosted cards
- dark product panels
- gradient atmosphere fields
- icon grids with subtle glow
- abstract glass or prism light
- UI screenshots inside sealed panels
- fluid gradient backgrounds for editorial

### 13.2 Avoid

- stock people photos
- random 3D blobs
- plastic chrome spheres unless brand-specific
- heavy device mockup frames
- over-glossy AI-generated objects
- low-resolution gradient images
- busy photography behind glass panels

### 13.3 Screenshot Treatment

Product screenshots should be:

- contained
- cropped intentionally
- edge-highlighted
- readable
- placed on a stable surface
- not blurred into the background

Dark screenshots:

- use charcoal frame
- add inner top highlight
- use subtle border
- avoid white hot edges

Light screenshots:

- use frosted white frame
- keep shadow minimal
- add prism strip only once
- avoid giant drop shadow

### 13.4 Atmospheric Backgrounds

Atmospheres can be CSS-generated or bitmap. Requirements:

- low enough contrast behind text
- clear focal area
- no banding
- no harsh stops
- consistent hue role
- no more than one dominant glow per viewport

Add noise only if banding is visible, and keep it subtle.

---

<a id="motion"></a>
## 14. MOTION AND INTERACTION

Glossy Modern interaction should feel physical: press, lift, focus, glow,
settle.

### 14.1 Motion Principles

- controls depress on click
- cards lift slightly on hover
- glow increases on focus
- gradients drift slowly if at all
- shine appears only on deliberate hover
- no infinite shimmer on content

### 14.2 Timing

| Interaction | Duration |
| --- | --- |
| Button hover | 120-180ms |
| Button press | 80-120ms |
| Card hover | 160-220ms |
| Focus glow | 140-200ms |
| Panel reveal | 220-320ms |
| Atmosphere drift | 16-32s |

### 14.3 Press Interaction

```css
.pressable-control {
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
}

.pressable-control:hover {
  border-color: rgba(255,255,255,.24);
}

.pressable-control:active {
  transform: translateY(1px);
}
```

### 14.4 Focus Interaction

```css
.gloss-input:focus-visible {
  outline: 0;
  border-color: rgba(255,255,255,.34);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.18),
    0 0 42px rgba(3,88,247,.14);
}

.neon-focus:focus-visible {
  outline: 0;
  border-color: rgba(4,253,143,.62);
  box-shadow:
    0 0 0 3px rgba(4,253,143,.12),
    0 0 34px rgba(4,253,143,.14);
}
```

### 14.5 Ambient Drift

```css
.ambient-drift {
  background-size: 120% 120%;
  animation: ambient-drift 24s ease-in-out infinite alternate;
}

@keyframes ambient-drift {
  from { background-position: 0% 40%; }
  to { background-position: 100% 60%; }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-drift {
    animation: none;
  }
}
```

Rules:

- drift background only, not foreground panels
- keep it slow
- disable for reduced motion
- never animate behind body copy in a distracting way

### 14.6 Shine Hover

Use rare hover shine:

```css
.rare-shine::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  background: linear-gradient(110deg, transparent, rgba(255,255,255,.10), transparent);
  transform: translateX(-70%);
  transition: opacity 160ms ease, transform 360ms ease;
}

.rare-shine:hover::after {
  opacity: 1;
  transform: translateX(70%);
}
```

Avoid shine on:

- body cards
- table rows
- long text panels
- every nav item

---

<a id="anti-slop"></a>
## 15. ANTI-SLOP RULES

### 15.1 Glassmorphism Slop

Reject:

- frosted card on every section
- unreadable text over busy background
- blur without borders
- nested translucent cards
- giant blur behind table data
- transparent nav with no contrast

Replace with:

- one hero-level glass surface
- solid support sections
- visible borders
- high-opacity backgrounds
- clear text contrast

### 15.2 Plastic Shine Slop

Reject:

- diagonal white streaks across every button
- chrome reflections
- huge specular highlights
- overly saturated 3D shine
- glossy buttons that look like old web 2.0

Replace with:

- subtle inner top highlight
- border/ring light
- tactile shadow stack
- hover-only shine

### 15.3 Neon Slop

Reject:

- cyan/magenta/green everywhere
- glowing paragraph text
- all cards with neon borders
- cyberpunk colors when brief asks premium
- colorful CTA, colorful border, colorful background all at once

Replace with:

- one neon edge role
- dark neutral surfaces
- glows behind content
- color as focus/status only

### 15.4 Dark UI Slop

Reject:

- flat black with no surface steps
- gray text too dim
- invisible borders
- generic purple glow
- giant empty dark hero

Replace with:

- charcoal strata
- clear text hierarchy
- rings and inset highlights
- product UI object
- controlled radial light

### 15.5 Light Prism Slop

Reject:

- rainbow buttons
- gradient text everywhere
- sharp corners
- pure white sterile page
- too many saturated stops
- heavy shadows on frosted cards

Replace with:

- spectrum as refraction
- neutral buttons
- high-opacity frosted surfaces
- thin type
- large radii

### 15.6 Editorial Fluid Slop

Reject:

- gradients so busy text disappears
- standard SaaS bento grid on cinematic background
- too many overlay cards
- small gray text over warm gradients
- random 3D objects

Replace with:

- minimal UI overlays
- giant white type
- full-bleed atmosphere
- simple pill controls
- fewer sections with stronger composition

### 15.7 Quick Red Flags

Stop and revise if:

- every card is translucent
- the page has more than three glow colors
- the CTA is not obvious in grayscale
- body text sits directly over gradient
- blur is used to hide bad contrast
- buttons do not have clear hover/active states
- the surface looks like cheap plastic
- dark UI is just black plus purple blob
- the light UI is just white plus rainbow strip

---

<a id="decision-tree"></a>
## 16. DECISION TREE

### 16.1 Choose Archetype By Product

If the product is a changelog/docs/release page:

- choose Midnight Frosted Command
- use compact spacing
- use grayscale dark layers
- use pill filters and mono dates
- avoid decorative gradients

If the product is a launcher/desktop productivity tool:

- choose Obsidian Backlit Instrument
- use key-like controls
- use near-white CTA
- use radial backlights
- show command palette UI

If the product is a browser/search/assistant:

- choose Prism Frost
- use light canvas
- use frosted search panel
- use spectrum as refraction
- use neutral buttons

If the product is futuristic/AI/video/creative:

- choose Neon Edge Glass
- use black/charcoal
- use controlled multi-hue glow
- use one neon edge accent
- avoid full cyberpunk overload

If the product is a studio/portfolio/brand:

- choose Fluid Gradient Glass
- use full-bleed atmosphere
- use giant type
- use minimal overlays
- avoid dashboard clutter

### 16.2 Choose Light vs Dark

Pick dark when:

- the product is technical or command-driven
- tactile buttons matter
- atmosphere and focus matter
- the brand wants premium digital depth
- the UI is a tool or launcher

Pick light when:

- the product is browser/search/assistant-like
- elegance and calm matter
- prism/refraction is the identity
- content needs clarity
- the audience expects approachable polish

Pick fluid/brand when:

- the website is less product dense
- art direction matters
- large typography is central
- the gradient background is the brand signal

### 16.3 Choose CTA Strategy

| Context | CTA strategy |
| --- | --- |
| Obsidian tool | near-white on black |
| Changelog/docs | ghost pill or subtle filled dark pill |
| Light prism | neutral gray button |
| Neon edge | outlined glow button |
| Fluid editorial | white/transparent pill |
| Enterprise product | restrained accent or neutral button |

### 16.4 Choose Blur Amount

| Use case | Blur |
| --- | --- |
| Sticky nav | 12-18px |
| Light frosted hero panel | 24px |
| Dark overlay on gradient | 8-14px |
| Dense dashboard | 0px, use solid surface |
| Modal backdrop | 16-24px |

---

<a id="css-starter"></a>
## 17. CSS CUSTOM PROPERTY STARTER

```css
:root {
  color-scheme: dark;

  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", "Berkeley Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-display: Inter, ui-sans-serif, system-ui, sans-serif;

  --canvas: #040506;
  --surface-0: #07080a;
  --surface-1: #111214;
  --surface-2: #1b1c1e;
  --surface-3: #23252a;

  --border: #363739;
  --border-soft: #23252a;
  --border-bright: rgba(255,255,255,.20);
  --highlight: rgba(255,255,255,.20);

  --text: #ffffff;
  --text-secondary: #d0d6e0;
  --text-muted: #8a8f98;
  --text-dim: #6a6b6c;

  --cta: #e6e6e6;
  --cta-text: #2f3031;
  --brand-red: #ff6363;
  --signal-mint: #59d499;
  --edge-neon: #04fd8f;
  --prism-blue: #0358f7;
  --prism-pink: #fd02f5;
  --prism-amber: #ffb005;

  --radius-key: 8px;
  --radius-card: 12px;
  --radius-panel: 20px;
  --radius-frost: 30px;
  --radius-pill: 9999px;

  --shadow-key:
    0 1.5px .5px 2.5px rgba(0,0,0,.40),
    0 0 .5px 1px rgba(0,0,0,1),
    inset 0 2px 1px 1px rgba(0,0,0,.25),
    inset 0 1px 1px 1px rgba(255,255,255,.20);

  --shadow-panel:
    0 34px 120px rgba(0,0,0,.52),
    inset 0 1px 0 rgba(255,255,255,.04);

  --shadow-ring: 0 0 0 1px var(--border);
}

:root.theme-midnight-command {
  --canvas: #08090a;
  --surface-0: #141516;
  --surface-1: #1c1c1f;
  --surface-2: #23252a;
  --border: #34343a;
  --text: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-muted: #8a8f98;
}

:root.theme-prism-light {
  color-scheme: light;
  --canvas: #f8f8f8;
  --surface-0: rgba(255,255,255,.90);
  --surface-1: #ffffff;
  --surface-2: #efefef;
  --border: rgba(0,0,0,.08);
  --text: #000000;
  --text-secondary: #636363;
  --text-muted: #959595;
  --cta: #d9d9d9;
  --cta-text: #000000;
}

:root.theme-neon-edge {
  --canvas: #000000;
  --surface-0: #1f2023;
  --surface-1: #333333;
  --border: rgba(4,253,143,.22);
  --text: #ffffff;
  --text-secondary: #d7d7d7;
  --text-muted: #9a9a9a;
  --cta: rgba(4,253,143,.12);
  --cta-text: #ffffff;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-sans);
  color: var(--text);
  background:
    radial-gradient(84% 73% at 50% 26%, rgba(4,63,150,.28), rgba(6,18,37,.10) 60%, transparent 100%),
    var(--canvas);
}

.container {
  width: min(100% - 32px, 1200px);
  margin-inline: auto;
}

.gloss-panel {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
}

.gloss-card {
  background: var(--surface-0);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
}

.gloss-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--radius-key);
  border: 1px solid var(--border-bright);
  background: var(--cta);
  color: var(--cta-text);
  font-weight: 650;
  text-decoration: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 18px 48px rgba(0,0,0,.38);
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
}

.gloss-button:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,.34);
}

.gloss-button:active {
  transform: translateY(1px);
}

.gloss-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface-0) 88%, transparent);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
}

.gloss-title {
  margin: 0;
  font-size: clamp(48px, 7vw, 88px);
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.gloss-copy {
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1.6;
}
```

---

<a id="tailwind"></a>
## 18. TAILWIND V4 STARTER

```css
@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", "Berkeley Mono", ui-monospace, monospace;
  --font-display: Inter, ui-sans-serif, system-ui, sans-serif;

  --color-canvas: #040506;
  --color-surface-0: #07080a;
  --color-surface-1: #111214;
  --color-surface-2: #1b1c1e;
  --color-border-gloss: #363739;
  --color-text-gloss: #ffffff;
  --color-muted-gloss: #8a8f98;
  --color-cta-neutral: #e6e6e6;
  --color-cta-text: #2f3031;
  --color-signal-red: #ff6363;
  --color-signal-mint: #59d499;
  --color-edge-neon: #04fd8f;

  --radius-key: 8px;
  --radius-gloss-card: 12px;
  --radius-gloss-panel: 20px;
  --radius-prism: 30px;

  --shadow-key: 0 1.5px .5px 2.5px rgba(0,0,0,.40), 0 0 .5px 1px rgb(0,0,0), inset 0 2px 1px 1px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.20);
  --shadow-gloss-panel: 0 34px 120px rgba(0,0,0,.52), inset 0 1px 0 rgba(255,255,255,.04);
}
```

Example:

```tsx
export function GlossyHero() {
  return (
    <section className="relative overflow-hidden bg-canvas py-28 text-text-gloss">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(84%_73%_at_50%_26%,rgba(4,63,150,.32),rgba(6,18,37,.12)_60%,transparent_100%)]" />
      <div className="mx-auto grid w-[min(100%-2rem,1200px)] gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex h-8 items-center rounded-full border border-border-gloss bg-surface-1/80 px-3 text-sm text-muted-gloss">
            Command surface
          </div>
          <h1 className="max-w-3xl text-7xl font-semibold leading-none tracking-[-.04em]">
            Launch the work before context disappears.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
            A backlit command layer for searching, automating, and moving through every workflow from the keyboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="inline-flex h-11 items-center rounded-key border border-white/20 bg-cta-neutral px-5 font-semibold text-cta-text shadow-key" href="#">
              Download
            </a>
            <a className="inline-flex h-11 items-center rounded-full border border-border-gloss bg-surface-1/80 px-5 font-medium text-text-gloss" href="#">
              View changelog
            </a>
          </div>
        </div>
        <div className="rounded-gloss-panel border border-border-gloss bg-surface-1 shadow-gloss-panel">
          {/* Product command panel */}
        </div>
      </div>
    </section>
  );
}
```

Tailwind guardrails:

- Create reusable component classes for key shadows.
- Do not paste arbitrary gradients on every div.
- Use dark neutral layers as tokens.
- Use `backdrop-blur` only in nav/frosted panels.
- Keep radius tokens consistent.
- Keep text contrast high.

---

<a id="recipes"></a>
## 19. COMPONENT RECIPES

### 19.1 Raycast-Style Command Palette

Ingredients:

- void black page
- large centered panel
- search input row
- grouped command rows
- shortcut keycaps
- subtle radial glow

Implementation skeleton:

```html
<section class="command-hero">
  <div class="container">
    <h1>Everything starts with a command.</h1>
    <div class="product-panel">
      <div class="product-panel-header">
        <div class="command-search">...</div>
      </div>
      <div class="command-list">
        <button class="command-row">
          <span>Open project</span>
          <kbd class="key">⌘K</kbd>
        </button>
      </div>
    </div>
  </div>
</section>
```

Quality checks:

- Does the panel feel like an app?
- Are keycaps tactile?
- Is the CTA neutral and strong?
- Is color rare?

### 19.2 Linear-Style Changelog Page

Ingredients:

- compact dark layout
- sticky nav
- filter pills
- mono dates
- border-led cards
- minimal accent

Quality checks:

- Is the content readable?
- Are cards separated without heavy shadows?
- Are pills the main interaction language?
- Is the page serious rather than decorative?

### 19.3 Dia-Style Light Prism Hero

Ingredients:

- `#f8f8f8` canvas
- frosted white panel
- spectrum accent strip
- thin display type
- neutral gray buttons
- large radius

Quality checks:

- Is spectrum used as refraction only?
- Are buttons neutral?
- Is the display type airy but readable?
- Does the frosted card have enough opacity?

### 19.4 Lava-Style Neon Edge Feature

Ingredients:

- black background
- dark cards
- multi-hue atmospheric gradient
- neon green active edge
- vivid purple/pink depth
- high-contrast text

Quality checks:

- Is neon green limited to edge/focus?
- Are cards readable?
- Is the gradient behind content, not inside text?
- Does the page avoid cyberpunk overload?

### 19.5 monopo-Style Fluid Studio Hero

Ingredients:

- full-bleed organic gradient
- black base
- huge white headline
- minimal overlay nav
- giant pill actions
- sparse content blocks

Quality checks:

- Does typography structure the atmosphere?
- Are overlays minimal?
- Is small text placed on calm zones?
- Is there enough visual restraint?

### 19.6 Glossy Pricing

Pricing needs clarity more than shine.

Rules:

- solid cards, not fully transparent
- one featured plan with edge glow
- high-contrast prices
- no gradient behind plan text
- tactile CTA

```css
.pricing-card.featured {
  border-color: rgba(255,255,255,.24);
  box-shadow:
    0 34px 120px rgba(0,0,0,.52),
    0 0 48px rgba(3,88,247,.14),
    inset 0 1px 0 rgba(255,255,255,.08);
}
```

### 19.7 Glossy Modal

```css
.gloss-modal {
  width: min(100% - 32px, 560px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(17,18,20,.92);
  backdrop-filter: blur(20px);
  box-shadow: 0 44px 140px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,255,255,.05);
}
```

Rules:

- modal can be frosted
- content inside should be solid enough
- focus trap states must be visible
- close button should be tactile

### 19.8 Glossy Tabs

```css
.gloss-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid #34343a;
  border-radius: 9999px;
  background: #141516;
}

.gloss-tab {
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: #8a8f98;
}

.gloss-tab[aria-selected="true"] {
  background: #1c1c1f;
  color: #f7f8f8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
}
```

---

<a id="product-recipes"></a>
## 20. IMPLEMENTATION RECIPES BY PRODUCT TYPE

### 20.1 Desktop Launcher

Use:

- Raycast as primary
- Changelog as secondary
- void black canvas
- tactile keycaps
- neutral CTA

Sections:

1. Hero with command palette
2. Shortcut feature rows
3. App integrations
4. Workflow examples
5. Download CTA

Do:

- show commands
- show shortcut keys
- use radial glows behind sections
- keep colors rare

Do not:

- use colorful cards for every feature
- make button glow neon
- put all copy in huge hero type

### 20.2 Browser / AI Search

Use:

- Dia Browser as primary
- Raycast for command interaction if dark mode is needed

Sections:

1. Prism hero
2. Search input
3. Result previews
4. Workflow examples
5. Privacy/trust
6. CTA

Do:

- make the search box central
- use frosted white surfaces
- keep spectrum as accent/atmosphere
- use neutral buttons

Do not:

- use rainbow CTA
- put AI sparkles everywhere
- over-blur result cards

### 20.3 Changelog / Docs

Use:

- Changelog as primary

Sections:

1. Compact hero
2. Search/filter pills
3. Release list
4. Tags and dates
5. Footer/document links

Do:

- use mono dates
- keep cards border-led
- use compact spacing
- prioritize readability

Do not:

- add giant background gradients
- use heavy image hero
- over-style code blocks

### 20.4 Futuristic AI Tool

Use:

- Ayo/Lava for energy
- Raycast for material discipline

Sections:

1. Dark hero with product frame
2. Neon edge active panel
3. Workflow preview
4. Feature cards
5. Trust/security
6. CTA

Do:

- choose one neon edge color
- keep cards dark
- use gradients behind product
- keep body copy white/gray

Do not:

- use neon as paragraph text
- put multiple neon borders in a grid
- create full cyberpunk chaos

### 20.5 Creative Studio / Portfolio

Use:

- monopo saigon as primary
- Dia for prism if light mode

Sections:

1. Full-bleed fluid hero
2. Giant type
3. Minimal nav overlay
4. Case study list
5. Selected project panels
6. Contact CTA

Do:

- let the background become identity
- keep UI overlays minimal
- use giant type for structure
- place small text on calm zones

Do not:

- add bento feature grids
- use product dashboard components
- scatter random bright colors

### 20.6 Premium SaaS

Blend:

- Changelog material discipline
- Dia frosted lightness
- Raycast tactile controls

Approach:

- use glossy hero only
- shift to solid sections for clarity
- one product panel
- restrained CTA
- proof section with minimal effects

This is the safest commercial version of Glossy Modern.

---

<a id="checklist"></a>
## 21. QUALITY CHECKLIST

### 21.1 Material Identity

- [ ] The material metaphor is clear.
- [ ] Surface levels are defined.
- [ ] Borders/rings catch light.
- [ ] Gloss is not applied everywhere.
- [ ] The product still reads without effects.

### 21.2 Contrast

- [ ] Primary text is high contrast.
- [ ] Muted text is readable.
- [ ] Buttons have obvious labels.
- [ ] Inputs have visible outlines.
- [ ] Text is not placed over busy gradients.

### 21.3 Color

- [ ] Accent roles are strict.
- [ ] Atmosphere colors do not become UI fills accidentally.
- [ ] Status colors are distinct from brand/glow.
- [ ] The design works in grayscale.
- [ ] There are not too many glow colors.

### 21.4 Surfaces

- [ ] Blur is used only where meaningful.
- [ ] Frosted panels have enough opacity.
- [ ] Dense panels are solid.
- [ ] Shadows are calibrated.
- [ ] Inset highlights are subtle.

### 21.5 Typography

- [ ] Typeface choice matches archetype.
- [ ] Display tracking is controlled.
- [ ] Micro labels are scannable.
- [ ] Mono is used for technical content only.
- [ ] Copy is concrete and not "magic" filler.

### 21.6 Interaction

- [ ] Hover states are visible.
- [ ] Press states feel tactile.
- [ ] Focus states are accessible.
- [ ] Motion respects reduced motion.
- [ ] Shine effects are rare.

### 21.7 Layout

- [ ] Hero includes a real object or strong typographic composition.
- [ ] Product panels are aligned.
- [ ] Cards are not nested excessively.
- [ ] Spacing matches chosen density.
- [ ] Mobile keeps text readable and controls tappable.

### 21.8 Anti-Slop

- [ ] No plastic web 2.0 shine.
- [ ] No neon body text.
- [ ] No rainbow buttons.
- [ ] No transparent cards everywhere.
- [ ] No generic purple blob dark UI.
- [ ] No unreadable glass overlays.

---

<a id="prompting"></a>
## 22. PROMPTING GUIDE

### 22.1 General Glossy Modern Prompt

Create a glossy modern interface with controlled digital material depth. Use
layered surfaces, crisp borders, subtle inset highlights, high-contrast text,
and one coherent atmosphere system. Gloss should appear through edge light,
tactile controls, frosted panels, or backlit surfaces, not through random shine
effects. Avoid plastic buttons, neon overload, unreadable glass, rainbow CTAs,
and blur on every card.

### 22.2 Midnight Frosted Command Prompt

Design a compact dark command interface with black and charcoal surface layers,
Inter-like typography, pill controls, mono technical labels, precise 1px
graphite borders, and no loud accent color. Depth should come from surface
steps and border rings rather than heavy shadows or gradients.

### 22.3 Obsidian Backlit Instrument Prompt

Design a near-black launcher/productivity page where UI panels feel like
backlit obsidian. Use tactile key shadows, inner top highlights, neutral
near-white primary CTA, radial blue/violet atmosphere behind sections, sparse
status colors, and a real command palette/product panel in the hero.

### 22.4 Prism Frost Prompt

Design a light glossy browser/search interface on a pale gray canvas with
frosted white surfaces at high opacity, large rounded cards, thin display type,
neutral gray buttons, and a single spectrum gradient used only as refraction or
ambient glow. Keep text black/graphite and avoid chromatic button fills.

### 22.5 Neon Edge Glass Prompt

Design a dark futuristic product page with black/charcoal surfaces, controlled
multi-hue gradient atmosphere, one neon green edge/focus accent, rounded
tactile controls, and high-contrast text. Keep gradients behind content and
avoid cyberpunk overload.

### 22.6 Fluid Frosted Depth Prompt

Design a cinematic creative website with full-bleed organic gradient depth on
black, giant white typography, minimal translucent overlays, pill controls, and
spacious editorial composition. The background should feel sculpted and fluid,
while the interface remains sparse and readable.

### 22.7 Negative Prompt

Do not use glassmorphism on every card, rainbow button fills, neon paragraph
text, cheap plastic shine, diagonal reflection streaks across all surfaces,
low-contrast gray copy, generic purple blobs, or blur that makes the product
hard to read.

---

<a id="quick-reference"></a>
## 23. QUICK REFERENCE

### Pick The Archetype

| Need | Archetype |
| --- | --- |
| Release notes/docs | Midnight Frosted Command |
| Launcher/productivity | Obsidian Backlit Instrument |
| Browser/search | Prism Frost |
| Futuristic AI/creative | Neon Edge Glass |
| Studio/portfolio | Fluid Gradient Glass |

### Best Materials

| Material | Use |
| --- | --- |
| `#040506` void black | premium tool canvas |
| charcoal strata | dark surface hierarchy |
| high-opacity white glass | light frosted panels |
| inset top highlight | tactile pressability |
| 1px graphite border | dark glass edge |
| spectrum strip | prism identity |
| radial glow | background atmosphere |
| neon edge | focus/active state |

### Avoid

- transparent everything
- blur everywhere
- plastic shine
- rainbow controls
- neon body copy
- low-contrast dark gray
- heavy drop shadows
- generic purple glow
- random floating cards

### Build Order

1. Choose archetype.
2. Define material metaphor.
3. Build canvas and surface steps.
4. Define text and border contrast.
5. Add tactile control shadows.
6. Add one atmosphere system.
7. Add product object or typographic hero.
8. Add interaction states.
9. Audit contrast.
10. Remove half the extra shine.

### Final Taste Test

A Glossy Modern interface should feel like a polished object you can use, not a
decorative poster you can only admire. If the user can imagine pressing the
button, reading the panel, and trusting the surface, the gloss is working.

