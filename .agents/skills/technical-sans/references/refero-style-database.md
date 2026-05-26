---
name: technical-sans
description: |
  Technical Sans aesthetic for modern software, AI, infrastructure, finance, support, and developer-product
  websites. Use when the user asks for a precise, engineered, product-native identity built from custom
  sans typography, disciplined spacing, restrained color, compact or spacious operational layouts, mono
  utility details, and components that feel like real software rather than generic marketing UI. Useful for
  "developer tool", "AI infrastructure", "fintech command center", "technical SaaS", "support platform",
  "software studio", "operational dashboard", "clean product site", "modern precise interface", and
  "serious but creative brand". Anti-slop: rejects generic Inter-only SaaS, random blue CTAs, over-rounded
  pills everywhere, dribbble glass cards, noisy gradients, and unstructured dark mode.
version: 1.0.0
category: design-taste
tags: [technical-sans, developer-tool, ai-saas, infrastructure, fintech, command-center, workbench, mono-details, precision-ui]
sources:
  - antimetal.com
  - plain.com
  - cursor.com
  - linear.app
  - mercury.com
---

# Technical Sans - Design Skill

> A skill for building technical, precise, product-native websites and interfaces with strong sans typography, restrained accents, and real software structure. Distilled from 5 Refero-curated references: Antimetal, Plain, Cursor, Linear, and Mercury.

---

## TABLE OF CONTENTS

1. [Core Philosophy](#philosophy)
2. [When To Use This Skill](#when-to-use)
3. [The 5 Source Archetypes](#archetypes)
4. [Shared Design DNA](#shared-dna)
5. [Color Systems](#color)
6. [Typography Systems](#typography)
7. [Spacing, Density, and Geometry](#spacing)
8. [Surface Systems](#surfaces)
9. [Component Patterns](#components)
10. [Layout Patterns](#layouts)
11. [Imagery and Visual Assets](#imagery)
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

Technical Sans is not "minimal SaaS with Inter." It is a disciplined visual identity for products where engineering credibility matters. It uses sans typography as the main expressive material, then supports that with controlled accents, exact surface levels, compact or spacious grids, and components that look like they belong inside real software.

The style is strongest when the product must feel:

- precise but not sterile
- modern but not trendy
- technical but not hostile
- refined but not decorative
- creative but not whimsical
- trustworthy without becoming corporate

The source set gives five useful poles:

| Source | Mode | What it teaches |
| --- | --- | --- |
| Antimetal | Mixed dark-to-light | Dramatic technical hero, then pale product dashboard |
| Plain | Light workbench | Warm white support/tool UI with green action logic |
| Cursor | Warm software studio | Tactile developer identity through type, shadows, and outline actions |
| Linear | Dark command center | Compact dark system with near-black layers and one lime signal |
| Mercury | Spacious dark fintech | Airy dark command center with light custom sans and one blue CTA |

Technical Sans usually begins by answering four questions:

1. Is the product more like a workbench, a command center, a studio, or an infrastructure console?
2. Should the first viewport create atmosphere, or should it immediately show operational clarity?
3. Which single accent color has the right meaning: green for work/action, lime for signal, orange for outline energy, blue for financial/technical trust, or chartreuse for disruptive infrastructure?
4. Is the typography compact and mechanical, light and expansive, or warm and custom?

If those four answers are clear, the rest of the interface becomes much easier.

### 1.1 Technical Sans Is Built From Constraints

The identity comes from rules, not decoration.

Good Technical Sans:

- limits chromatic accents to one primary signal and a few semantic states
- makes typography do more work than illustrations
- uses mono only where it adds functional texture
- keeps radius values consistent and meaningful
- treats shadows, if present, as a system
- gives every surface level a job
- makes product UI credible by honoring density, alignment, and state design

Bad Technical Sans:

- throws Inter on a generic landing page
- uses a blue button because blue seems safe
- adds code blocks as wallpaper
- uses neon glow on every control
- makes all buttons huge pills regardless of product tone
- puts marketing cards inside more cards
- treats dashboard screenshots as decorative images rather than information

### 1.2 Typography Is The Identity

In this family, type is not an afterthought. The type system creates the taste.

Antimetal uses a narrow custom sans for UI and a display face for large moments. Plain uses geometric sans plus mono details. Cursor uses custom gothic forms with OpenType features. Linear uses tight Inter Variable with distinct weight stops. Mercury uses light custom sans with positive tracking.

The shared rule: never let the font stack feel default.

Even when substituting with system fonts, impose a deliberate voice:

- Use variable weights like 450, 480, 510, 590 rather than jumping only between 400 and 700.
- Tune tracking by size.
- Use tabular numbers for metrics and product counters.
- Use mono for code, IDs, timestamps, command labels, and compact data, not for emotional body copy.
- Give display type a role: either compressed technical confidence, warm studio precision, or spacious command-center calm.

### 1.3 Technical Does Not Mean Cold

Plain and Cursor are especially important because they show warmth inside technical identities. Warm ivory, parchment, cream, green undertones, and tactile shadows can still feel precise if geometry is disciplined.

Use warmth when the product is about:

- support
- writing
- collaboration
- developer productivity
- customer workflows
- AI assistants for work
- internal tools that need friendliness

Use cold/dark precision when the product is about:

- infrastructure
- finance
- security
- observability
- automation
- operations
- command surfaces

Use mixed mode when the product needs both:

- emotional first impression
- product credibility after the fold
- dramatic transformation from "system power" to "usable software"

### 1.4 Accent Colors Are Signals, Not Paint

Each source has a strict accent strategy:

- Antimetal: chartreuse is primary action only.
- Plain: green is action and active state.
- Cursor: orange is often outline/link energy, not a filled CTA.
- Linear: lime is the one bright focal point.
- Mercury: blue is action-only inside a dark financial system.

The moment you use the accent as decoration everywhere, the style collapses.

In Technical Sans, color should answer:

- Where should the user act?
- What is currently active?
- What changed?
- What is system state?
- What needs attention?

It should not answer:

- How do we make this empty area more exciting?
- How do we fill the brand palette?
- How do we make every section different?

### 1.5 Real Software Structure Beats Marketing Layout

This skill prefers actual product grammar:

- nav systems
- command bars
- sidebar menus
- data cards
- event feeds
- logs
- inputs
- tags
- filters
- segmented controls
- status pills
- empty states
- code snippets
- dense feature lists

When making a website, the first screen can still be a hero, but the hero should feel like a product entry point, not a vague slogan. Show real UI, real commands, real object names, real numbers, or a credible product surface.

---

<a id="when-to-use"></a>
## 2. WHEN TO USE THIS SKILL

Use Technical Sans for:

- developer tools
- AI products
- cloud/infrastructure platforms
- API products
- fintech dashboards
- B2B SaaS product sites
- support software
- productivity tools
- internal tools
- analytics products
- cybersecurity
- observability
- automation
- database tooling
- command centers
- workflow orchestration
- product-led landing pages that must show real UI

Do not use Technical Sans as the main skill for:

- luxury editorial brands
- playful consumer products
- expressive illustration-first campaigns
- fashion/ecommerce with image-led art direction
- children's products
- soft wellness brands
- highly decorative portfolios

If the user asks for "futuristic", Technical Sans can be useful only if the result should remain operational. If they want cyberpunk, use Cyber Neon. If they want calm dark SaaS, use Dark UI. If they want gentle softness, use Pastel or Soft Gradients. If they want serif-led identity, use Serif Display or Editorial Minimal.

---

<a id="archetypes"></a>
## 3. THE 5 SOURCE ARCHETYPES

### 3.1 Antimetal - Electric Infrastructure Split

Antimetal is the mixed-mode archetype.

Use this when the product needs to feel powerful on entry, then sharply usable once the user scrolls. It is strong for cloud, infrastructure, AI operations, GPU compute, security, monitoring, and products where "technical power" is a buying reason.

Signature ingredients:

- dark navy/electric hero
- light product UI below
- chartreuse primary action
- navy ink instead of black
- white cards over pale blue canvas
- blue-tinted shadow system
- pill CTAs but sharp inputs
- custom sans for UI, display face for large headlines

Antimetal pattern:

```txt
Hero: dark atmospheric system power
Fold transition: crisp product proof
Main canvas: light technical dashboard
Action color: chartreuse only
Surface logic: #f8f9fc canvas + white cards
```

When adapting:

- Use the dramatic dark hero once.
- Keep the rest light and product-focused.
- Use chartreuse only for the main action.
- Preserve navy text on light surfaces.
- Make cards feel lifted with tinted shadows, not black shadows.
- Let display type add craft only at large sizes.

Avoid:

- repeated dark bands
- chartreuse decorations
- black body text
- default gray shadows
- rounded inputs
- too many mid-tone surfaces

### 3.2 Plain - Crisp Digital Workbench

Plain is the light workbench archetype.

Use this when the product should feel practical, transparent, support-oriented, and easy to operate. It is strong for customer support software, API messaging, workflow tools, admin products, knowledge bases, or service platforms.

Signature ingredients:

- pure white canvas
- green/cream undertones
- geometric sans
- small radius buttons
- subtle card warmth
- mono timestamps and labels
- vivid green action
- hard black lines used sparingly

Plain pattern:

```txt
Canvas: white
Warmth: cream and pale green surfaces
Action: clean green
Geometry: small radius, crisp edges
Density: comfortable workbench
Type: geometric sans + mono details
```

When adapting:

- Keep the interface useful before it is beautiful.
- Use green as a working action color, not a decorative theme.
- Use 6px buttons and 9px cards.
- Place mono in narrow utility roles.
- Let warm secondary surfaces humanize the page.

Avoid:

- over-rounded consumer SaaS shapes
- glossy shadows
- all-gray neutral systems
- blue CTAs
- full-page beige palettes
- mono paragraph copy

### 3.3 Cursor - Warm Ivory Software Studio

Cursor is the tactile developer-studio archetype.

Use this when the product is deeply technical but should feel creative, craft-oriented, and tool-native. It is strong for developer environments, AI coding tools, local-first tools, technical editors, build systems, and high-craft software studios.

Signature ingredients:

- warm parchment canvas
- custom gothic sans
- OpenType features
- precise letter spacing
- mono code surfaces
- orange outline action
- multi-layer shadow stack
- compact spacing
- 4px and 8px radii

Cursor pattern:

```txt
Canvas: warm ivory
Depth: stacked software panels
Primary action: outline energy
Type: custom gothic + mono
Spacing: compact
Mood: tactile engineering studio
```

When adapting:

- Use outline buttons when you want tool-native restraint.
- Make shadows a signature system.
- Apply precise tracking to headings and labels.
- Keep gaps small.
- Use warm neutrals rather than cold white.
- Add code examples only where they support product comprehension.

Avoid:

- filled generic CTAs
- arbitrary shadows
- cold slate backgrounds
- wide marketing spacing everywhere
- large rounded cards
- unstyled default type

### 3.4 Linear - Compact Dark Command Center

Linear is the compact dark operations archetype.

Use this when the product needs density, focus, and serious team workflow energy. It is strong for issue tracking, project management, operations, observability, dashboards, developer productivity, and internal command surfaces.

Signature ingredients:

- near-black canvas
- multiple black surface levels
- one lime accent
- Inter Variable with tight tracking
- compact spacing
- 6px radius controls
- subtle borders
- semantic colors kept in their lane

Linear pattern:

```txt
Canvas: #08090a
Cards: one or two steps lighter
Primary signal: lime
Density: compact
Type: tight variable sans
Geometry: 6px system radius
```

When adapting:

- Build a near-black stack before adding color.
- Use lime only for primary or active state.
- Keep section rhythm tight.
- Use sidebars, lists, command rows, and compact cards.
- Use muted text steps to create hierarchy.

Avoid:

- light surfaces inside the dark system
- rainbow accents
- large soft radii
- glow on every component
- loose letter spacing
- decorative gradients as a crutch

### 3.5 Mercury - Spacious Dark Financial Command Center

Mercury is the spacious dark command-center archetype.

Use this when the product is technical, financial, trusted, and aspirational. It is strong for banking, business finance, executive tooling, premium infrastructure, and products that need calm authority.

Signature ingredients:

- dark violet-neutral canvas
- blue primary action
- light custom sans
- positive tracking
- generous vertical spacing
- pill buttons
- shadowless surface hierarchy
- atmospheric first viewport
- text-dominant product sections

Mercury pattern:

```txt
Canvas: dark, quiet, expansive
Action: one blue
Typography: light and airy
Spacing: 80px+ section rhythm
Depth: color shifts, not shadows
Mood: calm authority
```

When adapting:

- Let the page breathe.
- Use light weights and subtle positive tracking.
- Keep blue for action, not decoration.
- Use pills for buttons and inputs.
- Avoid card clutter.
- Use atmospheric imagery only if it supports ambition and focus.

Avoid:

- heavy font weights
- pure white body copy
- generic shadows
- dense dashboards in the hero
- multiple saturated accents
- small-radius button systems

---

<a id="shared-dna"></a>
## 4. SHARED DESIGN DNA

### 4.1 The Technical Sans Spectrum

Technical Sans is not one look. It is a spectrum:

| Axis | Light end | Dark end | Mixed end |
| --- | --- | --- | --- |
| Canvas | Plain, Cursor | Linear, Mercury | Antimetal |
| Density | Plain comfortable | Linear compact | Antimetal compact product body |
| Warmth | Cursor parchment | Mercury violet-black | Antimetal cold blue hero |
| Action | Plain green | Linear lime / Mercury blue | Antimetal chartreuse |
| Typography | geometric/gothic | variable sans | sans + display contrast |
| Elevation | Cursor shadows | Mercury color shifts | Antimetal tinted shadows |

Choose one dominant pole. Do not blend all five equally.

### 4.2 Shared Rules

Use these as default assumptions:

- One primary accent color.
- Neutral surfaces are more important than accent surfaces.
- Type scale should include unusual, deliberate weight stops.
- Mono is functional, never decorative wallpaper.
- Buttons must have a radius logic tied to the brand.
- Inputs can differ from buttons if the system needs functional contrast.
- Product screenshots should be readable enough to prove reality.
- Text should be concise, confident, and object-oriented.
- Avoid vague value props when product UI can communicate specificity.

### 4.3 Signature Visual Moves

These moves are highly reusable:

1. Single-signal accent
   - One bright color reserved for action, focus, or active state.
   - Works in both light and dark systems.

2. Technical neutral tint
   - Do not use generic gray.
   - Pick a chromatic neutral: navy, green-gray, parchment, violet-black.

3. Variable-weight sans
   - Use 450, 480, 510, 590, or 360 where supported.
   - This creates technical refinement without bold noise.

4. Compact mono details
   - IDs, timestamps, logs, command snippets, keyboard labels.
   - Use positive tracking or tabular figures.

5. Product-native layout
   - Sidebars, rows, panels, filters, console snippets, event streams.
   - Make the interface look usable.

6. Controlled radius map
   - Pick one radius system and enforce it.
   - Technical Sans breaks when every component has arbitrary rounding.

7. Surface ladder
   - Define 3 to 6 surface levels.
   - Use them consistently before introducing shadow.

### 4.4 What Makes It Feel Personal And Creative

The user specifically wants skills that help create personal, creative visual identities. For Technical Sans, creativity should not come from random decorative flourishes. It comes from a precise choice on each axis:

- A green-tinted workbench instead of generic white SaaS.
- Orange outline action instead of the expected filled blue button.
- A chartreuse infrastructure CTA against navy.
- Light positive-tracked dark fintech type.
- Sharp inputs paired with pill actions.
- Blue-tinted shadows instead of black shadows.
- Mono metadata used as a secondary rhythm.
- A display face used only above 32px for technical editorial craft.

The identity becomes personal when these choices are consistent.

---

<a id="color"></a>
## 5. COLOR SYSTEMS

### 5.1 Technical Sans Palette Archetypes

#### A. Electric Infrastructure Mixed Palette

Best for: cloud, infra, AI compute, observability, security.

```css
:root {
  --tech-bg-hero: #001033;
  --tech-hero-ink: #fafeff;
  --tech-canvas: #f8f9fc;
  --tech-surface: #ffffff;
  --tech-ink: #1b2540;
  --tech-muted: #6b7184;
  --tech-border: #b1b5c0;
  --tech-action: #d0f100;
  --tech-action-ink: #1b2540;
}
```

Use when you need a dark-to-light page narrative:

- top section feels like system power
- product UI below feels exact and usable
- accent is high-energy and rare

Do:

- use navy as text ink
- use white cards on pale blue canvas
- reserve chartreuse for CTAs
- use blue-tinted shadow

Do not:

- place chartreuse on decorative blobs
- make every section dark
- use pure black text on light areas

#### B. Crisp Workbench Light Palette

Best for: support, workflow, admin, API, documentation.

```css
:root {
  --tech-bg: #ffffff;
  --tech-bg-soft: #f3fbe9;
  --tech-surface-warm: #f9f6f1;
  --tech-ink: #0a2414;
  --tech-muted: #607166;
  --tech-line: #000000;
  --tech-action: #1ad379;
  --tech-action-muted: #17b267;
  --tech-dark-panel: #283a2e;
}
```

Use when the product should feel helpful, direct, and operational.

Do:

- use white as the main canvas
- add pale green or cream only as support surfaces
- use green for action and active state
- keep radii small

Do not:

- introduce blue as a second CTA color
- make the palette beige-heavy
- use green as large decorative wash everywhere

#### C. Warm Developer Studio Palette

Best for: coding tools, AI editors, build products, local-first tools.

```css
:root {
  --tech-bg: #f7f7f4;
  --tech-ink: #262510;
  --tech-ink-strong: #141414;
  --tech-muted: #7a7974;
  --tech-hover: #e6e5e0;
  --tech-border-soft: #cdcdc9;
  --tech-outline: #f54e00;
  --tech-positive: #4ade80;
  --tech-gold: #c08532;
  --tech-secondary-action: #34785c;
}
```

Use when craft and tool-native tactility matter.

Do:

- use warm ivory canvas
- make orange an outline/link signal
- include mono code details
- use precise shadows

Do not:

- turn orange into a giant filled button by default
- cool the whole palette into slate
- add random saturated decorations

#### D. Compact Dark Command Palette

Best for: productivity, operations, issue tracking, dashboards.

```css
:root {
  --tech-bg: #08090a;
  --tech-surface-1: #0f1011;
  --tech-surface-2: #161718;
  --tech-line: #323334;
  --tech-border: #383b3f;
  --tech-ink: #f7f8f8;
  --tech-ink-2: #d0d6e0;
  --tech-ink-3: #8a8f98;
  --tech-ink-4: #62666d;
  --tech-action: #e4f222;
  --tech-positive: #27a644;
  --tech-danger: #eb5757;
}
```

Use when density, keyboard-like focus, and team workflow are important.

Do:

- build a black surface ladder
- use lime as action/active/focus
- keep radius at 6px
- make muted text steps meaningful

Do not:

- add many colored highlights
- use glow as hierarchy
- use large marketing cards

#### E. Spacious Dark Command Palette

Best for: fintech, executive tools, premium technical products.

```css
:root {
  --tech-bg-deep: #171721;
  --tech-bg: #1e1e2a;
  --tech-surface: #272735;
  --tech-line: #70707d;
  --tech-ink: #ededf3;
  --tech-muted: #c3c3cc;
  --tech-action: #5266eb;
  --tech-action-soft: #cdddff;
  --tech-on-action: #ffffff;
}
```

Use when the page needs authority and air.

Do:

- use blue as action-only
- make typography light and spacious
- create depth through color and layout
- reserve shadows or omit them

Do not:

- use heavy font weights
- flood the UI with blue
- make sections too dense

### 5.2 Accent Selection Guide

| Product need | Accent | Best source model | Why |
| --- | --- | --- | --- |
| Infrastructure power | Chartreuse | Antimetal | High contrast, disruptive, system signal |
| Support/workflow clarity | Green | Plain | Action feels productive and friendly |
| Developer craft | Orange outline | Cursor | Signals tool action without marketing gloss |
| Dark productivity focus | Lime | Linear | High-signal active/action color |
| Financial authority | Violet-blue | Mercury | Calm, trustworthy, conversion-oriented |

### 5.3 Color Budget

For most Technical Sans builds:

- 70 percent neutrals and surfaces
- 15 percent text hierarchy
- 8 percent borders and dividers
- 5 percent primary accent
- 2 percent semantic states

If accent is above 10 percent visible area, the interface will probably stop feeling technical and start feeling themed.

### 5.4 Neutrals Must Have A Temperature

Avoid neutral palettes like:

```css
--bg: #ffffff;
--card: #f8fafc;
--text: #111827;
--muted: #6b7280;
--border: #e5e7eb;
--primary: #2563eb;
```

That is a generic SaaS starter palette. Instead, tint the neutral system:

- navy: Antimetal
- green-black: Plain
- parchment: Cursor
- black graphite: Linear
- violet-black: Mercury

The tint should be subtle but consistent. It becomes the brand atmosphere.

### 5.5 Border Color Rules

Technical Sans often uses borders as structural UI, so choose them carefully:

- Light workbench: borders can be hard black in small doses.
- Warm studio: borders should be muted stone or shadow rings.
- Dark command: borders should be one or two steps above surface.
- Mixed infra: borders and shadows can inherit navy/blue tint.
- Spacious dark: borders can be mid-muted and sparse.

Avoid default `#e5e7eb` unless the entire neutral system is intentionally default, which usually means the skill is failing.

---

<a id="typography"></a>
## 6. TYPOGRAPHY SYSTEMS

### 6.1 The Technical Sans Type Stack

Technical Sans typically needs three roles:

1. Primary sans
   - all core UI, body, headings, nav
   - must feel deliberate

2. Mono
   - code, data, IDs, timestamps, keyboard hints, labels
   - should appear in small areas

3. Optional display face
   - only for large hero/section headings
   - only when adding craft or editorial contrast

Do not introduce too many fonts. The system should be one primary sans plus one mono, with optional display only when it has a clear job.

### 6.2 Recommended Font Substitutions

If custom source fonts are unavailable:

| Source feel | Primary substitute | Mono substitute | Display substitute |
| --- | --- | --- | --- |
| Antimetal | Inter Variable, DM Sans | IBM Plex Mono | Fraunces, Newsreader |
| Plain | Inter, ABC Favorit-like geometric sans | JetBrains Mono, Geist Mono | none |
| Cursor | Geist Sans, Inter Tight, system-ui | Berkeley Mono, JetBrains Mono | none |
| Linear | Inter Variable | IBM Plex Mono, Berkeley Mono | none |
| Mercury | Manrope, Satoshi, Inter | IBM Plex Mono | none |

For a premium implementation, use:

- Inter Variable for technical neutrality
- Geist Sans for developer products
- IBM Plex Sans for serious technical/institutional tone
- Satoshi for polished modern SaaS
- Manrope for spacious command-center tone
- JetBrains Mono or IBM Plex Mono for functional detail

### 6.3 Weight Systems

Do not rely only on 400 and 700.

Better Technical Sans weight ladder:

```css
--font-light: 360;
--font-regular: 400;
--font-book: 450;
--font-medium-soft: 480;
--font-medium: 510;
--font-strong: 590;
```

Use:

- 360 for airy large dark headlines
- 400 for body and standard UI
- 450/480 for buttons, labels, compact headings
- 510 for display in dark command systems
- 590 for selected labels and small emphasis

Avoid:

- 700 for every heading
- 800/900 unless the product is intentionally brutal or high contrast
- tiny body text at heavy weights

### 6.4 Tracking Rules

Tracking is a signature part of this style.

Default guidance:

| Size | Tracking |
| --- | --- |
| 10-12px labels | 0 to 0.06em if uppercase/mono |
| 13-16px body/UI | -0.005em to 0 |
| 18-24px subheads | -0.010em to -0.005em |
| 28-48px headings | -0.020em to -0.010em |
| 56-80px display | -0.030em to -0.010em, or positive for Mercury-like air |

Important exception:

- Mercury-like spacious dark systems can use subtle positive tracking at display sizes.
- Mono utility text can use positive tracking for data clarity.

### 6.5 Type Scale Recipes

#### Compact Product Scale

Use for Linear/Cursor-like products.

```css
:root {
  --text-micro: 11px;
  --text-caption: 12px;
  --text-label: 13px;
  --text-body-sm: 14px;
  --text-body: 15px;
  --text-body-lg: 16px;
  --text-subhead: 20px;
  --text-heading: 32px;
  --text-heading-lg: 48px;
  --text-display: 72px;

  --leading-micro: 1.25;
  --leading-caption: 1.35;
  --leading-body: 1.5;
  --leading-subhead: 1.33;
  --leading-heading: 1.12;
  --leading-display: 1;

  --tracking-body: -0.006em;
  --tracking-heading: -0.018em;
  --tracking-display: -0.025em;
}
```

#### Comfortable Workbench Scale

Use for Plain-like products.

```css
:root {
  --text-caption: 12px;
  --text-label: 13px;
  --text-body: 15px;
  --text-subheading: 18px;
  --text-heading: 24px;
  --text-heading-lg: 48px;
  --text-display: 80px;

  --leading-caption: 1.2;
  --leading-body: 1.33;
  --leading-subheading: 1.17;
  --leading-heading: 1.17;
  --leading-heading-lg: 1.04;
  --leading-display: 0.95;

  --tracking-subheading: -0.01em;
  --tracking-heading: -0.01em;
  --tracking-display: -0.02em;
}
```

#### Spacious Command Scale

Use for Mercury-like products.

```css
:root {
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subheading: 18px;
  --text-heading-sm: 21px;
  --text-heading: 32px;
  --text-heading-lg: 49px;
  --text-display: 65px;

  --leading-caption: 1.5;
  --leading-body: 1.5;
  --leading-subheading: 1.4;
  --leading-heading: 1.2;
  --leading-heading-lg: 1.15;
  --leading-display: 1.1;

  --tracking-caption: 0.02em;
  --tracking-body: 0.005em;
  --tracking-display: 0.01em;
}
```

### 6.6 Mono Usage Rules

Use mono for:

- command snippets
- API keys or masked tokens
- request IDs
- timestamps
- version labels
- keyboard shortcuts
- file names
- build logs
- row metadata
- small table headers
- terminal panels

Do not use mono for:

- long paragraphs
- generic nav everywhere
- emotional headlines
- testimonial quotes
- huge body sections

Mono should feel like evidence.

### 6.7 Headline Writing Style

Technical Sans headlines should be concrete and object-oriented.

Good:

- "Deploy infrastructure when demand spikes."
- "One command center for every support thread."
- "Move from alert to action in seconds."
- "Write, test, and ship from one workspace."
- "Banking operations without the back office."

Weak:

- "The future of productivity is here."
- "Supercharge your workflow."
- "Built for modern teams."
- "Unlock your potential."
- "AI-powered innovation for everyone."

The visual style is precise; the copy must match.

---

<a id="spacing"></a>
## 7. SPACING, DENSITY, AND GEOMETRY

### 7.1 Base Unit

Use a 4px base unit by default.

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
  --space-32: 128px;
}
```

Technical Sans lives on small increments. Avoid arbitrary values like 17px, 23px, 37px unless matching a very specific optical need.

### 7.2 Density Modes

#### Compact

Use for:

- command centers
- dashboards
- developer tools
- issue trackers
- monitoring
- code-heavy surfaces

Values:

- section gap: 24-48px
- card padding: 12-20px
- element gap: 8px
- row height: 32-44px
- button height: 32-40px
- radius: 4-6px

#### Comfortable

Use for:

- support tools
- workflow SaaS
- product pages with UI evidence
- admin surfaces

Values:

- section gap: 40-80px
- card padding: 20-24px
- element gap: 16-24px
- row height: 40-52px
- button height: 36-44px
- radius: 6-10px

#### Spacious

Use for:

- fintech
- premium technical brands
- executive tools
- atmospheric product sites

Values:

- section gap: 80-128px
- card padding: 24-40px
- element gap: 12-32px
- button height: 44-56px
- radius: 32px+ for buttons
- fewer panels per viewport

### 7.3 Radius Systems

Pick one radius system.

#### Sharp Workbench Radius

```css
--radius-xs: 2px;
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 9px;
```

Use for Plain, Cursor, Linear adaptations.

#### Pill Action Radius

```css
--radius-card: 16px;
--radius-card-lg: 20px;
--radius-button: 9999px;
--radius-input: 0px;
```

Use for Antimetal-style contrast between pill actions and sharp data entry.

#### Spacious Dark Radius

```css
--radius-container: 4px;
--radius-input: 32px;
--radius-button: 32px;
--radius-button-lg: 40px;
```

Use for Mercury-like dark systems.

### 7.4 Radius Meaning

Radius should communicate component role:

| Radius | Meaning |
| --- | --- |
| 0px | austere input, table, code, ledger |
| 2px | tag, micro badge, selected row |
| 4px | technical card, compact button |
| 6px | default product control |
| 8-10px | comfortable card or panel |
| 16-20px | elevated showcase card |
| 32-40px | spacious dark button/input |
| 9999px | pill CTA, badge, segmented command |

Do not apply 24px radius to every card just because it looks modern. That moves the UI toward generic consumer SaaS.

### 7.5 Alignment Rules

Technical Sans should feel aligned even when expressive.

- Align text and controls to a clear grid.
- Keep left edges consistent through a section.
- Use table-like spacing for feature comparisons.
- Use equal gaps inside row groups.
- Do not center large amounts of body copy unless the page is very spacious.
- In dense UIs, align icons to text baselines optically.
- In dark UIs, use borders sparingly but consistently to show grouping.

---

<a id="surfaces"></a>
## 8. SURFACE SYSTEMS

### 8.1 Surface Ladders

A Technical Sans surface ladder is the backbone of the page.

#### Light Workbench Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #ffffff | Page and main content |
| 1 | #f9f6f1 | Warm card or panel |
| 2 | #f3fbe9 | Info block or soft command area |
| 3 | #e6e5e0 | Hover state / nested fill |
| 4 | #283a2e | Dark contrast module |

#### Warm Studio Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #f7f7f4 | Page canvas |
| 1 | #ffffff or warm card | Floating panel |
| 2 | #e6e5e0 | Hover / secondary fill |
| 3 | #cdcdc9 | subtle separators |
| 4 | #141414 | code/contrast text |

#### Dark Command Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #08090a | App background |
| 1 | #0f1011 | cards |
| 2 | #161718 | nested cards |
| 3 | #23252a | border-heavy panels |
| 4 | #323334 | divider and muted fills |
| 5 | #383b3f | input border / focus base |

#### Spacious Dark Ladder

| Level | Token | Use |
| --- | --- | --- |
| 0 | #171721 | outer background |
| 1 | #1e1e2a | main section |
| 2 | #272735 | interactive surface |
| 3 | #70707d | divider / border |

### 8.2 Shadow Rules

Technical Sans can use shadow, but never default decorative shadow.

Use shadows when:

- the source archetype is tactile (Cursor)
- the light UI needs product-card elevation (Antimetal)
- cards should feel like floating software panels

Avoid shadows when:

- the style is dark and compact (Linear)
- the style is spacious and authoritative (Mercury)
- borders and value shifts already create hierarchy

#### Blue-Tinted Light Card Shadow

```css
box-shadow:
  rgba(0, 39, 80, 0.03) 0 56px 72px -16px,
  rgba(0, 39, 80, 0.03) 0 32px 32px -16px,
  rgba(0, 39, 80, 0.04) 0 6px 12px -3px,
  rgba(0, 39, 80, 0.04) 0 0 0 1px;
```

Use for Antimetal-like light product cards.

#### Tactile Studio Shadow

```css
box-shadow:
  rgba(0, 0, 0, 0.14) 0 28px 70px,
  rgba(0, 0, 0, 0.10) 0 14px 32px,
  rgba(38, 37, 16, 0.10) 0 0 0 1px;
```

Use for Cursor-like floating panels.

#### Dark Inset Ring

```css
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.05),
  0 0 0 1px rgba(255, 255, 255, 0.06);
```

Use for dark controls where borders need to stay soft.

### 8.3 Borders As Structure

Use borders for:

- card outlines
- table rows
- list dividers
- input fields
- terminal panels
- command bars
- nav active states

Avoid borders:

- around every marketing card
- where surface value already separates
- as random decorative lines

Technical Sans borders should be either:

- crisp and intentional (Plain)
- shadow-ring based (Cursor/Antimetal)
- low-contrast within black ladder (Linear)
- sparse and mid-muted (Mercury)

---

<a id="components"></a>
## 9. COMPONENT PATTERNS

### 9.1 Buttons

#### Primary Filled Signal Button

Use for Antimetal, Plain, Linear, Mercury.

```css
.btn-primary {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: var(--radius-button);
  background: var(--accent);
  color: var(--on-accent);
  font: 480 15px/1 var(--font-sans);
  letter-spacing: -0.005em;
}
```

Rules:

- one fill color
- no gradient
- no icon unless icon clarifies action
- strong contrast
- limited count per viewport

#### Outlined Tool Action

Use for Cursor-like developer tools.

```css
.btn-outline-action {
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--outline-action);
  border-radius: 4px;
  background: transparent;
  color: var(--outline-action);
  font: 400 13px/1 var(--font-sans);
}
```

Rules:

- communicates action without marketing weight
- works well in nav, code demos, and compact command bars
- can become filled only on hover if the system supports it

#### Ghost Text Button

Use for secondary actions.

```css
.btn-ghost {
  height: 36px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-muted);
}

.btn-ghost:hover {
  color: var(--text);
  background: var(--surface-hover);
}
```

### 9.2 Inputs

Inputs should look like data entry, not like decorative pills unless the source archetype demands it.

#### Sharp Technical Input

```css
.input-sharp {
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: transparent;
  color: var(--text);
  font: 400 14px/1 var(--font-sans);
}
```

Use for Antimetal-style contrast.

#### Compact Product Input

```css
.input-compact {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface-1);
  color: var(--text);
}
```

Use for Linear, Plain, Cursor.

#### Joined Hero Input

```css
.hero-input-group {
  display: flex;
  align-items: stretch;
  max-width: 520px;
}

.hero-input-group input {
  min-width: 0;
  flex: 1;
  border-radius: 32px 0 0 32px;
}

.hero-input-group button {
  border-radius: 0 32px 32px 0;
}
```

Use for Mercury-like hero conversion.

### 9.3 Cards

#### Technical Feature Card

```css
.feature-card {
  border-radius: 10px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  padding: 24px;
}
```

Rules:

- card title should be specific
- include at least one concrete product detail
- avoid giant icon + vague paragraph formula

#### Floating Software Panel

```css
.software-panel {
  border-radius: 8px;
  background: var(--surface-panel);
  box-shadow: var(--shadow-panel);
  overflow: hidden;
}

.software-panel__bar {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 12px;
}
```

Use for developer tools and product screenshots.

#### Dark Command Card

```css
.command-card {
  border-radius: 6px;
  background: var(--surface-1);
  border: 1px solid var(--line);
  padding: 12px;
}
```

Use when density matters.

### 9.4 Badges And Tags

Badges should be informative, not decorative confetti.

```css
.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font: 500 12px/1 var(--font-sans);
}

.tag[data-state="active"] {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent), transparent 55%);
  background: color-mix(in srgb, var(--accent), transparent 92%);
}
```

Use for:

- status
- environment
- version
- plan
- data source
- model type
- region
- role

Avoid using tags as random visual chips with no content.

### 9.5 Navigation

Technical Sans nav should be functional.

Patterns:

- top nav with compact links
- command bar nav
- sidebar nav for app-like sections
- segmented nav for product modes
- icon + label only when icons are familiar

Top nav rule:

```css
.top-nav {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}
```

Dark nav rule:

- transparent or one-step surface fill
- no heavy blur unless it matches the source style
- active state should be quiet
- primary action is the only saturated item

### 9.6 Code And Command Blocks

Code blocks should look like product evidence.

```css
.code-block {
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--code-bg);
  padding: 16px;
  font: 400 13px/1.55 var(--font-mono);
  letter-spacing: 0.01em;
  overflow: auto;
}

.code-line[data-highlight="true"] {
  color: var(--accent);
}
```

Rules:

- keep snippets short
- highlight one line max
- use realistic commands
- avoid fake code wallpaper
- do not use syntax colors as rainbow decoration

### 9.7 Tables And Data Rows

Technical Sans loves rows.

```css
.data-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) auto auto;
  align-items: center;
  min-height: 44px;
  border-bottom: 1px solid var(--border-subtle);
  gap: 16px;
}

.data-row__meta {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}
```

Use rows for:

- deployments
- alerts
- transactions
- files
- messages
- builds
- invoices
- projects
- models
- API requests

Rows instantly make the product feel operational.

---

<a id="layouts"></a>
## 10. LAYOUT PATTERNS

### 10.1 Dark Hero To Light Product

Inspired by Antimetal.

Use when a product needs a dramatic technical opening.

Structure:

```txt
Header on dark gradient
Hero headline + primary CTA
Atmospheric technical visual
Hard transition to pale product canvas
Floating product cards
Feature rows
Proof section
```

Implementation:

```css
.hero-split {
  min-height: 760px;
  color: var(--hero-ink);
  background:
    radial-gradient(circle at 70% 30%, rgba(95, 189, 247, 0.34), transparent 38%),
    linear-gradient(180deg, #001033 0%, #0050f8 58%, #5fbdf7 100%);
}

.product-canvas {
  background: #f8f9fc;
  color: #1b2540;
}
```

Rules:

- use the dark hero once
- make the transition intentional
- keep product sections light and useful
- do not scatter more atmospheric gradients later

### 10.2 Light Workbench Page

Inspired by Plain.

Use for support/workflow products.

Structure:

```txt
Simple top nav
Left-aligned hero
Inline product object preview
Workflow cards
Support/log rows
Documentation/API band
```

Implementation:

```css
.workbench-page {
  background: #ffffff;
  color: #0a2414;
}

.workbench-band {
  background: #f3fbe9;
  border: 1px solid rgba(10, 36, 20, 0.10);
}
```

Rules:

- no oversized decorative hero
- show workflow objects early
- use green for actual actions
- keep cards practical

### 10.3 Warm Studio Product Site

Inspired by Cursor.

Use for developer products with craft.

Structure:

```txt
Warm nav
Compact centered or left hero
Floating editor/terminal panel
Command examples
Feature cards with tactile shadows
Integrations row
```

Implementation:

```css
.studio-page {
  background: #f7f7f4;
  color: #262510;
}

.studio-panel {
  background: #fffefa;
  border-radius: 8px;
  box-shadow: var(--shadow-studio);
}
```

Rules:

- make panel shadows part of the identity
- keep UI elements compact
- use outline action as primary when appropriate
- avoid cold developer stereotypes

### 10.4 Compact Dark App Landing

Inspired by Linear.

Use for dark productivity/operations products.

Structure:

```txt
Dark top nav
Compact hero with product UI immediately visible
Command center screenshot
Feature grid with small cards
Rows/lists instead of fluffy cards
Keyboard or command details
```

Implementation:

```css
.dark-command {
  background: #08090a;
  color: #f7f8f8;
}

.dark-command .panel {
  background: #0f1011;
  border: 1px solid #323334;
  border-radius: 6px;
}
```

Rules:

- tight type
- no large empty marketing spaces
- no glow overload
- use lime very rarely

### 10.5 Spacious Dark Trust Page

Inspired by Mercury.

Use for fintech or premium technical products.

Structure:

```txt
Atmospheric first viewport
Large light-weight headline
Email/action form
Sparse nav
Text-dominant sections
Feature lists with dividers
Trust/proof details
```

Implementation:

```css
.spacious-command {
  background: #1e1e2a;
  color: #ededf3;
}

.spacious-command .section {
  padding: 96px 0;
}
```

Rules:

- use generous section rhythm
- keep surfaces simple
- no dense card grid
- no heavy weights

---

<a id="imagery"></a>
## 11. IMAGERY AND VISUAL ASSETS

Technical Sans imagery should be evidence or atmosphere.

### 11.1 Product Evidence

Best for:

- developer tools
- dashboards
- support products
- infrastructure
- AI workflows

Use:

- real UI screenshots
- stylized but readable product panels
- command examples
- data rows
- terminal snippets
- diagrams with labels

Avoid:

- abstract 3D blobs
- unreadable blurred screenshots
- generic laptop mockups
- fake UI that has no meaningful content

### 11.2 Atmospheric Imagery

Best for:

- Mercury-like premium pages
- Antimetal-like dramatic hero
- enterprise/finance/infra products with ambition

Use:

- one strong image or atmospheric technical visual
- subdued color grading that matches tokens
- text overlay with strong contrast
- product UI after the atmosphere

Avoid:

- using atmosphere as a substitute for product clarity
- dark blurred stock images
- decorative gradients when a real product visual is needed

### 11.3 Diagrams

Technical Sans diagrams should be crisp.

Use:

- thin strokes
- orthogonal lines
- compact labels
- mono metadata
- one accent for active path
- neutral nodes

Avoid:

- colorful node soup
- playful mascot-style illustrations
- thick rounded arrows everywhere
- labels too small to read

### 11.4 Icons

Icons should be:

- line-based
- simple
- 16-20px in dense UI
- 20-24px in marketing UI
- consistent stroke width
- muted by default
- accented only on active or semantic state

Use lucide-style icons when building with common web stacks.

Do not use icons as a substitute for specific copy. Technical Sans works best when icons support scanning but text carries meaning.

---

<a id="motion"></a>
## 12. MOTION AND INTERACTION

Technical Sans motion should feel immediate and controlled.

### 12.1 Duration Rules

```css
:root {
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-precise: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Use:

- 120ms for hover color changes
- 180ms for button and row states
- 260ms for panel entry
- no slow decorative transitions unless the product is explicitly atmospheric

### 12.2 Hover Patterns

Light workbench:

- background shifts one neutral step
- border becomes slightly stronger
- accent appears in text or small icon

Warm studio:

- shadow deepens slightly
- outline color sharpens
- panel moves 1px or not at all

Dark command:

- text brightens
- surface moves one level up
- lime appears only on active/action

Spacious dark:

- blue fill appears on CTA
- ghost blue backing changes opacity
- list border/text brightens

### 12.3 Focus States

Focus states must be visible.

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

For dark UIs, avoid fuzzy glow-only focus. Use a crisp ring.

### 12.4 Loading States

Technical Sans loading should feel system-native:

- skeleton rows
- progress bars
- command-line status
- small spinner only when needed
- mono status text

Examples:

```txt
Syncing 142 events...
Building preview...
Checking policy graph...
Provisioning region eu-west-3...
```

Avoid:

- playful loading messages
- large ornamental spinners
- animated gradients over every card

---

<a id="anti-slop"></a>
## 13. ANTI-SLOP RULES

### 13.1 Universal Rejections

Reject these immediately:

- default Tailwind gray/blue SaaS palette
- Inter 400/700 with no tracking decisions
- all cards with `rounded-2xl shadow-lg`
- huge gradient hero with no product evidence
- code blocks as decorative wallpaper
- random mono everywhere
- every component glowing
- generic "AI-powered" copy
- meaningless feature cards with icons
- five accent colors fighting each other
- screenshots too small or blurred to read

### 13.2 Color Slop

Do not:

- use blue as the default primary unless the chosen archetype supports it
- make semantic colors part of the brand palette
- use accent colors in illustrations, icons, links, and CTAs all at once
- create multiple gradient blobs in the background
- use pure black text in navy-tinted systems
- use generic gray borders in warm systems

### 13.3 Typography Slop

Do not:

- use browser default letter spacing
- use font-weight 700 for all headings
- center-align everything
- use mono for long marketing copy
- ignore line-height at display sizes
- mix too many font families
- use tiny low-contrast body copy

### 13.4 Component Slop

Do not:

- use rounded pills for every component
- put cards inside cards
- make buttons inconsistent by section
- give every feature a giant icon
- use drop shadows without a shadow system
- make inputs look like promotional CTAs
- make table rows too tall in compact contexts

### 13.5 Layout Slop

Do not:

- make a generic landing page when a product UI should be the main evidence
- use an oversized hero for operational tools
- hide the product until far below the fold
- create alternating decorative sections with no functional reason
- use identical card grids for every content type
- leave mobile text overflowing in buttons or panels

---

<a id="decision-tree"></a>
## 14. DECISION TREE

### 14.1 Choose The Archetype

```txt
Is the product infrastructure, cloud, security, or AI operations?
  Yes -> Does it need drama on first impression?
    Yes -> Antimetal mixed mode.
    No -> Linear compact dark or Plain light workbench.

Is the product support, workflow, communication, or admin?
  Yes -> Plain light workbench.

Is the product a coding/developer creation tool?
  Yes -> Cursor warm studio.

Is the product productivity or team operations with dark preference?
  Yes -> Linear compact dark.

Is the product fintech, executive, banking, or premium technical?
  Yes -> Mercury spacious dark.
```

### 14.2 Choose Density

```txt
Users need to scan many objects quickly -> compact.
Users need to understand workflows -> comfortable.
Users need trust, calm, and premium authority -> spacious.
```

### 14.3 Choose Accent

```txt
Need disruptive system power -> chartreuse.
Need productive friendliness -> green.
Need developer craft -> orange outline.
Need active command focus -> lime.
Need financial trust -> blue.
```

### 14.4 Choose Radius

```txt
Operational app -> 4-6px.
Friendly workbench -> 6-10px.
Infra mixed hero -> pill buttons + sharp inputs.
Premium dark fintech -> 32-40px buttons.
```

### 14.5 Choose Elevation

```txt
Warm studio -> tactile multi-layer shadows.
Light infra product -> tinted shadows.
Dark command -> surface value + borders.
Premium dark -> color shifts, no shadow.
```

---

<a id="css-starter"></a>
## 15. CSS CUSTOM PROPERTY STARTER

Use this as a neutral Technical Sans starter, then adapt to one archetype.

```css
:root {
  color-scheme: light;

  /* Palette */
  --ts-bg: #f7f7f4;
  --ts-bg-soft: #ffffff;
  --ts-surface-1: #ffffff;
  --ts-surface-2: #e6e5e0;
  --ts-ink: #262510;
  --ts-ink-strong: #141414;
  --ts-muted: #7a7974;
  --ts-border: #cdcdc9;
  --ts-accent: #f54e00;
  --ts-accent-ink: #ffffff;
  --ts-positive: #27a644;
  --ts-danger: #eb5757;

  /* Type */
  --ts-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ts-font-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --ts-text-micro: 11px;
  --ts-text-caption: 12px;
  --ts-text-label: 13px;
  --ts-text-body-sm: 14px;
  --ts-text-body: 15px;
  --ts-text-body-lg: 16px;
  --ts-text-subhead: 20px;
  --ts-text-heading: 32px;
  --ts-text-heading-lg: 48px;
  --ts-text-display: 72px;

  --ts-leading-tight: 1;
  --ts-leading-heading: 1.1;
  --ts-leading-body: 1.5;
  --ts-leading-loose: 1.65;

  --ts-tracking-body: -0.006em;
  --ts-tracking-heading: -0.018em;
  --ts-tracking-display: -0.025em;
  --ts-tracking-mono: 0.015em;

  /* Spacing */
  --ts-space-1: 4px;
  --ts-space-2: 8px;
  --ts-space-3: 12px;
  --ts-space-4: 16px;
  --ts-space-5: 20px;
  --ts-space-6: 24px;
  --ts-space-8: 32px;
  --ts-space-10: 40px;
  --ts-space-12: 48px;
  --ts-space-16: 64px;
  --ts-space-20: 80px;
  --ts-space-24: 96px;
  --ts-space-32: 128px;

  /* Shape */
  --ts-radius-xs: 2px;
  --ts-radius-sm: 4px;
  --ts-radius-md: 6px;
  --ts-radius-lg: 9px;
  --ts-radius-xl: 16px;
  --ts-radius-pill: 9999px;

  /* Shadow */
  --ts-shadow-panel:
    rgba(0, 0, 0, 0.14) 0 28px 70px,
    rgba(0, 0, 0, 0.10) 0 14px 32px,
    rgba(38, 37, 16, 0.10) 0 0 0 1px;

  /* Motion */
  --ts-motion-fast: 120ms;
  --ts-motion-base: 180ms;
  --ts-motion-slow: 260ms;
  --ts-ease: cubic-bezier(0.2, 0, 0, 1);
}

.technical-sans {
  min-height: 100%;
  background: var(--ts-bg);
  color: var(--ts-ink);
  font-family: var(--ts-font-sans);
  font-size: var(--ts-text-body);
  line-height: var(--ts-leading-body);
  letter-spacing: var(--ts-tracking-body);
  text-rendering: geometricPrecision;
}

.technical-sans h1,
.technical-sans h2,
.technical-sans h3 {
  color: var(--ts-ink-strong);
  letter-spacing: var(--ts-tracking-heading);
}

.technical-sans h1 {
  max-width: 11ch;
  font-size: clamp(48px, 8vw, var(--ts-text-display));
  line-height: var(--ts-leading-tight);
  font-weight: 510;
}

.technical-sans code,
.technical-sans kbd,
.technical-sans .mono {
  font-family: var(--ts-font-mono);
  letter-spacing: var(--ts-tracking-mono);
}
```

### 15.1 Dark Command Override

```css
[data-ts-theme="dark-command"] {
  color-scheme: dark;
  --ts-bg: #08090a;
  --ts-bg-soft: #0f1011;
  --ts-surface-1: #0f1011;
  --ts-surface-2: #161718;
  --ts-ink: #f7f8f8;
  --ts-ink-strong: #ffffff;
  --ts-muted: #8a8f98;
  --ts-border: #323334;
  --ts-accent: #e4f222;
  --ts-accent-ink: #08090a;
}
```

### 15.2 Light Workbench Override

```css
[data-ts-theme="workbench"] {
  --ts-bg: #ffffff;
  --ts-bg-soft: #f3fbe9;
  --ts-surface-1: #f9f6f1;
  --ts-surface-2: #e6e5e0;
  --ts-ink: #0a2414;
  --ts-ink-strong: #000000;
  --ts-muted: #607166;
  --ts-border: rgba(10, 36, 20, 0.16);
  --ts-accent: #1ad379;
  --ts-accent-ink: #0a2414;
}
```

### 15.3 Spacious Dark Override

```css
[data-ts-theme="spacious-dark"] {
  color-scheme: dark;
  --ts-bg: #1e1e2a;
  --ts-bg-soft: #171721;
  --ts-surface-1: #272735;
  --ts-surface-2: #323244;
  --ts-ink: #ededf3;
  --ts-ink-strong: #ffffff;
  --ts-muted: #c3c3cc;
  --ts-border: #70707d;
  --ts-accent: #5266eb;
  --ts-accent-ink: #ffffff;
  --ts-tracking-display: 0.01em;
}
```

---

<a id="tailwind"></a>
## 16. TAILWIND V4 STARTER

```css
@import "tailwindcss";

@theme {
  --color-ts-bg: #f7f7f4;
  --color-ts-bg-soft: #ffffff;
  --color-ts-surface-1: #ffffff;
  --color-ts-surface-2: #e6e5e0;
  --color-ts-ink: #262510;
  --color-ts-ink-strong: #141414;
  --color-ts-muted: #7a7974;
  --color-ts-border: #cdcdc9;
  --color-ts-accent: #f54e00;
  --color-ts-positive: #27a644;
  --color-ts-danger: #eb5757;

  --font-ts-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-ts-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;

  --text-ts-micro: 11px;
  --text-ts-caption: 12px;
  --text-ts-label: 13px;
  --text-ts-body-sm: 14px;
  --text-ts-body: 15px;
  --text-ts-body-lg: 16px;
  --text-ts-subhead: 20px;
  --text-ts-heading: 32px;
  --text-ts-heading-lg: 48px;
  --text-ts-display: 72px;

  --radius-ts-xs: 2px;
  --radius-ts-sm: 4px;
  --radius-ts-md: 6px;
  --radius-ts-lg: 9px;
  --radius-ts-xl: 16px;
}
```

### 16.1 Class Recipe: Technical Button

```html
<button class="inline-flex h-10 items-center gap-2 rounded-ts-md bg-ts-accent px-4 font-ts-sans text-ts-label font-medium tracking-[-0.005em] text-white transition-colors duration-150">
  Deploy
</button>
```

### 16.2 Class Recipe: Dark Command Panel

```html
<section class="bg-[#08090a] text-[#f7f8f8]">
  <div class="mx-auto grid max-w-[1200px] gap-3 px-6 py-16">
    <div class="rounded-[6px] border border-[#323334] bg-[#0f1011] p-3">
      <div class="font-mono text-xs tracking-[0.015em] text-[#8a8f98]">build.prod</div>
      <h3 class="mt-3 text-xl font-[590] tracking-[-0.01em]">Deployment queue</h3>
    </div>
  </div>
</section>
```

### 16.3 Class Recipe: Workbench Card

```html
<article class="rounded-[9px] border border-[rgba(10,36,20,.12)] bg-[#f9f6f1] p-6 text-[#0a2414]">
  <p class="font-mono text-xs tracking-[0.015em] text-[#607166]">ticket.updated</p>
  <h3 class="mt-4 text-2xl font-medium tracking-[-0.01em]">Route every message to the right queue.</h3>
  <p class="mt-3 text-[15px] leading-[1.33] text-[#607166]">Rules, assignments, and customer context stay visible in one operational view.</p>
</article>
```

---

<a id="recipes"></a>
## 17. COMPONENT RECIPES

### 17.1 Hero: Technical Product With Evidence

Use for most Technical Sans sites.

```html
<section class="technical-hero">
  <div class="technical-hero__copy">
    <p class="eyebrow">Infrastructure automation</p>
    <h1>Scale the system before demand hits.</h1>
    <p class="lede">Provision, monitor, and tune production resources from one operational command surface.</p>
    <div class="actions">
      <button class="btn-primary">Start a workspace</button>
      <button class="btn-ghost">View docs</button>
    </div>
  </div>
  <div class="software-panel">
    <div class="software-panel__bar">
      <span>prod-us-east</span>
      <span class="status">live</span>
    </div>
    <div class="data-row">
      <span>api.latency.p95</span>
      <span class="mono">142ms</span>
      <span class="tag">stable</span>
    </div>
  </div>
</section>
```

```css
.technical-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
  min-height: 720px;
  padding: 80px 24px;
}

.eyebrow {
  margin: 0 0 16px;
  font-family: var(--ts-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--ts-muted);
  text-transform: uppercase;
}

.lede {
  max-width: 56ch;
  margin: 20px 0 0;
  color: var(--ts-muted);
  font-size: 16px;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 28px;
}
```

### 17.2 Feature Section: Rows Instead Of Generic Cards

```html
<section class="feature-ledger">
  <div class="section-heading">
    <p class="eyebrow">Workflow graph</p>
    <h2>Every event stays traceable.</h2>
  </div>

  <div class="ledger">
    <a class="ledger-row" href="#">
      <span class="row-main">Route policy changes through review.</span>
      <span class="row-meta">policy.diff</span>
      <span class="row-state">active</span>
    </a>
    <a class="ledger-row" href="#">
      <span class="row-main">Replay failed jobs from the exact checkpoint.</span>
      <span class="row-meta">queue.retry</span>
      <span class="row-state">beta</span>
    </a>
  </div>
</section>
```

```css
.feature-ledger {
  padding: 80px 24px;
}

.ledger {
  margin-top: 32px;
  border-top: 1px solid var(--ts-border);
}

.ledger-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 20px;
  align-items: center;
  min-height: 56px;
  border-bottom: 1px solid var(--ts-border);
  color: inherit;
  text-decoration: none;
}

.row-meta {
  font-family: var(--ts-font-mono);
  font-size: 12px;
  color: var(--ts-muted);
}

.row-state {
  border: 1px solid var(--ts-border);
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 12px;
  color: var(--ts-muted);
}
```

### 17.3 Command Bar

```html
<div class="command-bar">
  <div class="command-left">
    <span class="mono">cmd+k</span>
    <span>Search projects, requests, and policies</span>
  </div>
  <button class="btn-outline-action">Open</button>
</div>
```

```css
.command-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radius-md);
  background: var(--ts-surface-1);
  padding: 0 8px 0 12px;
}

.command-left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--ts-muted);
}
```

### 17.4 Status Matrix

```html
<div class="status-matrix">
  <div class="metric">
    <span class="metric-label">Latency</span>
    <strong>142ms</strong>
    <span class="metric-foot">p95 global</span>
  </div>
  <div class="metric">
    <span class="metric-label">Deploys</span>
    <strong>38</strong>
    <span class="metric-foot">last 24h</span>
  </div>
  <div class="metric">
    <span class="metric-label">Errors</span>
    <strong>0.03%</strong>
    <span class="metric-foot">below policy</span>
  </div>
</div>
```

```css
.status-matrix {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--ts-border);
  border-radius: var(--ts-radius-lg);
  overflow: hidden;
}

.metric {
  padding: 20px;
  border-right: 1px solid var(--ts-border);
}

.metric:last-child {
  border-right: 0;
}

.metric-label,
.metric-foot {
  display: block;
  font-family: var(--ts-font-mono);
  font-size: 12px;
  color: var(--ts-muted);
  letter-spacing: 0.015em;
}

.metric strong {
  display: block;
  margin: 10px 0;
  font-size: 32px;
  line-height: 1;
  letter-spacing: -0.02em;
}
```

### 17.5 Dark Sidebar Shell

```html
<main class="app-shell">
  <aside class="sidebar">
    <div class="logo">N</div>
    <nav>
      <a class="nav-item active">Queue</a>
      <a class="nav-item">Runs</a>
      <a class="nav-item">Policies</a>
      <a class="nav-item">Settings</a>
    </nav>
  </aside>
  <section class="workspace">
    <header class="workspace-header">
      <h1>Deployment queue</h1>
      <button class="btn-primary">New rule</button>
    </header>
  </section>
</main>
```

```css
.app-shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 720px;
  background: #08090a;
  color: #f7f8f8;
}

.sidebar {
  border-right: 1px solid #323334;
  background: #0f1011;
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 34px;
  border-radius: 6px;
  padding: 0 10px;
  color: #8a8f98;
}

.nav-item.active {
  background: #161718;
  color: #f7f8f8;
}

.workspace {
  padding: 24px;
}
```

---

<a id="product-recipes"></a>
## 18. IMPLEMENTATION RECIPES BY PRODUCT TYPE

### 18.1 AI Developer Tool

Best archetype: Cursor warm studio.

Use:

- parchment canvas
- custom/tight sans
- mono command snippets
- editor panel hero
- orange outline action or green secondary build action
- compact rows showing model/run state

Hero composition:

- left: specific developer outcome
- right: editor/terminal panel
- bottom: integrations or command row

Copy tone:

- direct
- technical
- avoids "magic"
- shows commands, files, diffs, runs

### 18.2 Infrastructure Platform

Best archetype: Antimetal mixed mode or Linear dark command.

Use:

- dark technical hero if dramatic
- pale dashboard product sections
- chartreuse or lime action
- event rows
- metrics
- logs
- region/status tags

Hero composition:

- system-level headline
- one strong CTA
- infrastructure topology or command panel
- product proof immediately after fold

### 18.3 Fintech Command Center

Best archetype: Mercury spacious dark.

Use:

- dark violet-neutral canvas
- blue action
- light sans
- generous spacing
- subtle lists
- no excessive cards
- trust details

Hero composition:

- atmospheric but clear
- big light headline
- joined email/action form
- minimal nav

### 18.4 Support / Operations Workbench

Best archetype: Plain.

Use:

- white canvas
- green action
- cream or pale green supporting surfaces
- ticket/message rows
- assignment labels
- compact filters
- practical cards

Hero composition:

- product workflow preview
- queue/inbox/list UI
- action button
- API/docs secondary link

### 18.5 Team Productivity Dark UI

Best archetype: Linear.

Use:

- near-black ladder
- compact sidebars
- row-heavy content
- one lime action/focus color
- 6px radius
- tight type

Hero composition:

- visible app shell
- command palette snippet
- dense cards
- keyboard detail

---

<a id="checklist"></a>
## 19. QUALITY CHECKLIST

Before considering a Technical Sans design complete:

### Identity

- [ ] The chosen archetype is obvious.
- [ ] The palette has a specific neutral temperature.
- [ ] There is one primary accent signal.
- [ ] The accent is not used as random decoration.
- [ ] The design feels product-native, not template-native.

### Typography

- [ ] Primary sans has deliberate weight choices.
- [ ] Tracking changes by size.
- [ ] Display line-height is tight enough.
- [ ] Body copy is readable.
- [ ] Mono appears only in functional details.
- [ ] Numeric/data text aligns well.

### Components

- [ ] Button radius follows a system.
- [ ] Input styling has a reason.
- [ ] Cards do not nest inside cards.
- [ ] Shadows, if present, are consistent.
- [ ] Tags and badges carry real information.
- [ ] Focus states are visible.

### Layout

- [ ] Product evidence appears early.
- [ ] Section spacing matches density mode.
- [ ] Rows, tables, or panels support technical credibility.
- [ ] Mobile layout preserves readable type and controls.
- [ ] The hero does not hide all functional detail.
- [ ] Alignment feels exact.

### Anti-Generic

- [ ] No default blue SaaS palette.
- [ ] No generic "AI-powered" filler.
- [ ] No decorative code wallpaper.
- [ ] No random gradient blobs.
- [ ] No oversized icons in every card.
- [ ] No arbitrary rounded values.

---

<a id="prompting"></a>
## 20. PROMPTING GUIDE

Use these prompts to activate the skill in an agent or design workflow.

### 20.1 General Technical Sans Prompt

```txt
Design this as a Technical Sans product interface: precise custom-sans typography, a restrained neutral palette with one accent signal, product-native components, compact mono details, and real software structure. Avoid generic SaaS cards, random blue CTAs, decorative code wallpaper, and over-rounded components. Choose one archetype: workbench, warm studio, compact dark command center, spacious dark command center, or dark-to-light infrastructure split.
```

### 20.2 Antimetal-Like Prompt

```txt
Create a mixed-mode infrastructure landing page: dark electric navy hero with a single chartreuse CTA, then transition into a pale product dashboard canvas with white elevated cards, navy text, blue-tinted shadows, pill actions, and sharp data-entry inputs. Keep chartreuse for primary actions only.
```

### 20.3 Plain-Like Prompt

```txt
Create a crisp light workbench UI for a support/workflow product: white canvas, pale green and cream support surfaces, geometric sans typography, small 6px buttons, 9px cards, mono timestamps, and green action states. Make it practical and operational, not decorative.
```

### 20.4 Cursor-Like Prompt

```txt
Create a warm developer software studio: parchment canvas, compact custom gothic sans, mono code snippets, orange outline primary actions, small radii, tactile multi-layer shadows, and readable editor-like product panels. The UI should feel handcrafted and precise.
```

### 20.5 Linear-Like Prompt

```txt
Create a compact dark command-center UI: near-black surface ladder, tight variable sans typography, 6px controls, muted text levels, row-heavy layout, and one lime accent for active states and primary actions. Avoid glow-heavy cyber styling.
```

### 20.6 Mercury-Like Prompt

```txt
Create a spacious dark fintech command-center page: deep violet-neutral canvas, light custom sans, positive tracking, generous 80px+ section rhythm, pill CTAs, one blue primary action, minimal shadows, and calm authoritative copy.
```

---

<a id="quick-reference"></a>
## 21. QUICK REFERENCE

### 21.1 Archetype Cheat Sheet

| Need | Use | Accent | Radius | Surface |
| --- | --- | --- | --- | --- |
| dramatic infrastructure | Antimetal | chartreuse | pill buttons + sharp inputs | dark hero to light cards |
| support/workflow | Plain | green | 6-9px | white + pale green/cream |
| developer craft | Cursor | orange outline | 4-8px | parchment + floating panels |
| dark productivity | Linear | lime | 6px | near-black ladder |
| premium fintech | Mercury | blue | 32-40px buttons | spacious dark |

### 21.2 Default Technical Sans Values

```txt
Base unit: 4px
Body: 15-16px
Body line-height: 1.45-1.6
Display: 56-80px
Display line-height: 0.95-1.1
Button height: 36-44px compact, 44-56px spacious
Card padding: 12-24px compact/comfortable, 24-40px spacious
Default radius: 4-6px operational, 32px+ spacious CTA
Accent count: one primary signal
Mono usage: data, code, IDs, timestamps
```

### 21.3 High-Signal Do List

- Use a specific neutral temperature.
- Make type feel custom through weight, tracking, and line-height.
- Show real product structure early.
- Use one accent color as a signal.
- Keep mono functional.
- Define a surface ladder.
- Make radius values meaningful.
- Write concrete product copy.

### 21.4 High-Signal Do Not List

- Do not ship generic Inter + blue.
- Do not overuse cards.
- Do not put code everywhere.
- Do not glow every component.
- Do not use accent as decoration.
- Do not mix archetypes without a rule.
- Do not ignore mobile text fit.
- Do not let screenshots become unreadable decoration.

### 21.5 Minimum Viable Technical Sans System

If time is short, implement only this:

```css
:root {
  --bg: #f7f7f4;
  --surface: #ffffff;
  --surface-2: #e6e5e0;
  --ink: #262510;
  --muted: #7a7974;
  --border: #cdcdc9;
  --accent: #f54e00;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius: 6px;
}

body {
  background: var(--bg);
  color: var(--ink);
  font: 400 15px/1.5 var(--font-sans);
  letter-spacing: -0.006em;
}

h1 {
  font-size: clamp(48px, 8vw, 72px);
  line-height: 1;
  letter-spacing: -0.025em;
  font-weight: 510;
}

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.button {
  height: 40px;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
  color: var(--accent);
  background: transparent;
}

.mono {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.015em;
  color: var(--muted);
}
```

This minimum version gives the agent enough taste to avoid the generic SaaS baseline.

