---
name: technical-ui
description: Build precise technical interfaces: SaaS workstations, dashboards, consoles, code/data panels, engineering labs, research tools, AI inputs, modular control systems, and high-trust product UIs with rigorous component behavior.
version: 1.0.0
tags:
  - design
  - visual-identity
  - technical-ui
  - dashboard
  - saas
  - console
  - code-ui
  - data-ui
  - product-design
sources:
  - https://styles.refero.design/style/376baf20-9ace-405d-bf4a-086016f2b1e3
  - https://styles.refero.design/style/52a007ed-ad1b-46a6-bd44-b76f91df6d0c
  - https://styles.refero.design/style/08c8700c-f278-42bc-812e-f60dc6ce996e
  - https://styles.refero.design/style/5183054c-4c6e-4ecf-bd90-f7d794d5eb17
  - https://styles.refero.design/style/dd89ce6c-f0aa-4ca8-bd63-19dcd81920a7
---

# Technical UI Design Skill

Technical UI is a complete interface language for tools, systems, consoles,
dashboards, labs, AI workspaces, data products, and engineering platforms. It is
not just monospace text, dark panels, or a grid background. It is the discipline
of making complex operations feel clear, inspectable, trustworthy, and alive.

The five source systems for this skill:

1. User Interviews: teal-accented architectural workflow UI.
2. ChatGPT: frosted glass workstation for focused text interaction.
3. Attio: precision digital toolkit with editorial warmth.
4. Telepathic Instruments: techno-futurist lab interface.
5. ToDesktop: mixed-mode digital engineering lab.

Together they show that Technical UI can be:

- friendly and rounded
- austere and neutral
- high-end and monochrome
- artistic and lab-like
- mixed light/dark with code proof
- data-rich without clutter
- precise without feeling hostile

---

## 1. Core Philosophy

Technical UI must answer three questions quickly:

1. What is happening?
2. What can the user do next?
3. What evidence supports the system state?

Everything in the visual system should support those questions. Decoration is
allowed only when it clarifies domain, trust, state, or product identity.

### 1.1 The Technical UI Contract

A good technical interface must be:

- inspectable
- responsive
- readable
- stateful
- predictable
- precise
- recoverable
- visually calm under load

It should not be:

- merely futuristic
- code-themed without function
- full of fake telemetry
- low contrast
- overloaded with accent colors
- dependent on decorative panels

### 1.2 Technical Does Not Mean Cold

The source systems show several ways to soften technical UI:

- User Interviews uses rounded forms and serif headings.
- ChatGPT uses silence and centered interaction.
- Attio uses editorial serif headlines over exact UI frames.
- Telepathic Instruments uses artful ambiguity around strict controls.
- ToDesktop uses dark engineering depth with crisp white cards.

Warmth can come from:

- rounded controls
- serif display
- friendly copy
- white space
- human-centered flow
- soft canvas color
- careful empty states

But warmth should never obscure interaction.

### 1.3 Technical UI Roles

| Role | Visual Behavior |
| --- | --- |
| workstation | sidebar, centered input, calm neutral surfaces |
| dashboard | metrics, tables, filters, charts, state indicators |
| console | dark modules, mono labels, logs, command snippets |
| lab | abstract backgrounds, sparse controls, precise CTA |
| toolkit | product frames, tabs, forms, direct actions |
| workflow platform | rounded steps, progress, cards, task flow |
| engineering landing | code proof, mixed light/dark sections, terminal panels |

Choose one dominant role. Do not mix all technical metaphors in one page.

---

## 2. Source Archetypes

### 2.1 Teal Architectural Workflow

Inspired by User Interviews.

Use for:

- research platforms
- recruiting tools
- workflow SaaS
- user operations products
- professional services tools
- friendly B2B marketplaces

Visual signature:

- light ice canvas
- teal primary action
- serif headings
- geometric sans UI
- rounded buttons and tags
- generous spacing
- friendly technical trust

Core tokens:

```css
:root {
  --tech-teal-canvas: #f2f8f7;
  --tech-teal-white: #ffffff;
  --tech-teal-ink: #000000;
  --tech-teal-slate: #283338;
  --tech-teal-cloud: #e4f0f1;
  --tech-teal-mist: #cae1e2;
  --tech-teal-action: #1c5d5f;
  --tech-teal-deep: #0e4749;
  --tech-teal-green: #156152;
  --tech-teal-blush: #d6aec1;
}
```

Typography:

- Sans UI: Sofia-style geometric sans.
- Serif headings: Mackinac-like soft authority.
- Mono: IBM Plex Mono for code/data.
- Display: around `64px`, line-height `1.16`.
- Body: `14px`, line-height `1.57`.

Components:

- teal filled button, `48px` radius
- emerald secondary button, `48px` radius
- black ghost button, `88px` radius
- outlined tags, `100px` radius
- info banners with Cloud Frost fill

Do:

- use teal for primary action
- keep section gaps generous
- use serif headings for trust and warmth
- round most controls
- reserve mono for structured content

Don't:

- use sharp corners
- add random saturated colors
- make everything outlined
- use mono for body copy

### 2.2 Austere AI Workstation

Inspired by ChatGPT.

Use for:

- AI chat products
- text workspaces
- writing/coding assistants
- query interfaces
- support consoles
- search/research tools

Visual signature:

- mostly achromatic palette
- fixed sidebar
- centered primary input
- calm prompt heading
- rounded input/button forms
- no heavy shadows
- subtle panel background shifts

Core tokens:

```css
:root {
  --tech-work-carbon: #0d0d0d;
  --tech-work-snow: #ffffff;
  --tech-work-fog: #f9f9f9;
  --tech-work-pewter: #5d5d5d;
  --tech-work-stone: #8f8f8f;
  --tech-work-mist: #ececec;
  --tech-work-link: #007aff;
}
```

Typography:

- UI sans for most text.
- Distinct sans for prompt/headline.
- Sizes: `14px`, `16px`, `18px`, `24px`.
- Weights: `400`, `500`, `600`.
- Do not exceed `600`.

Components:

- primary input with `28px` radius
- sidebar nav item with `10px` radius
- black filled pill auth button
- pill outline button
- internal voice/tool button

Do:

- make the input the primary object
- use background shifts instead of shadows
- keep color nearly absent
- preserve clear keyboard/focus behavior

Don't:

- add decorative code graphics
- add heavy panels
- use many colors
- clutter the main interaction area

### 2.3 Precision Toolkit Monochrome

Inspired by Attio.

Use for:

- CRMs
- data workspaces
- productivity tools
- admin products
- B2B SaaS
- high-end technical product marketing

Visual signature:

- white/black axis
- editorial serif display
- Inter UI
- 1px borders
- product UI frame as main proof
- compact buttons
- exact tabs
- restrained action blue

Core tokens:

```css
:root {
  --tech-tool-white: #ffffff;
  --tech-tool-ash: #f3f4f6;
  --tech-tool-stone: #e4e7ec;
  --tech-tool-slate: #d3d8df;
  --tech-tool-lead: #b5bdc9;
  --tech-tool-overcast: #8f99a8;
  --tech-tool-metal: #6f7988;
  --tech-tool-carbon: #505967;
  --tech-tool-ink: #1c1d1f;
  --tech-tool-blue: #407ff2;
}
```

Typography:

- Serif display for `28px+` headlines.
- Inter Display for technical display.
- Inter for all UI.
- Use stylistic sets where available.
- Display around `64px`, line-height `1.07`.

Components:

- primary black CTA, `10px` radius
- secondary white CTA, slate border, `10px` radius
- header nav hover with ash fill
- feature tabs with active bottom border
- UI frame card with `8px` radius and stone border

Do:

- use product UI frames as proof
- use borders for structure
- keep color almost absent
- use serif headings only for large storytelling moments

Don't:

- color headlines
- use serif for body text
- shadow every component
- vary button/card radii casually

### 2.4 Techno-Futurist Lab

Inspired by Telepathic Instruments.

Use for:

- experimental hardware/software
- creative technical tools
- music/audio products
- scientific products
- research labs
- AI/art hybrid tools

Visual signature:

- monochrome base
- abstract blurred backgrounds
- compact geometric sans
- mono inputs/labels
- single orange action color
- flat product cards
- full-bleed hero
- sparse controls

Core tokens:

```css
:root {
  --tech-lab-canvas: #e5e7eb;
  --tech-lab-charcoal: #000000;
  --tech-lab-snow: #ffffff;
  --tech-lab-steel: #a3a3a3;
  --tech-lab-ash: #191919;
  --tech-lab-mercury: #c2c2c2;
  --tech-lab-powder: #dddee2;
  --tech-lab-sage: #d7cdb8;
  --tech-lab-amber: #ff6c2f;
}
```

Typography:

- Suisse-style geometric sans for all UI.
- Suisse Mono-style face for technical details.
- Display around `100px`, line-height `0.85`.
- Tight tracking around `-0.03em`.

Components:

- black pill action, `24px` radius
- amber CTA, `24px` radius
- square ghost button with steel outline
- transparent product cards
- bottom-border mono inputs

Do:

- reserve orange for primary conversion
- keep cards flat
- use mono for fields and data
- let abstract backgrounds create atmosphere

Don't:

- use orange as decoration
- add heavy shadows
- clutter the lab feel
- use generic system typography

### 2.5 Mixed-Mode Engineering Lab

Inspired by ToDesktop.

Use for:

- developer tools
- desktop/app builder platforms
- infrastructure products
- technical product landing pages
- code-heavy SaaS
- automation tools

Visual signature:

- deep blue-black hero
- white frosted cards
- electric blue primary CTA
- Aeonik-like headings
- Inter UI
- Geist Mono code
- pill buttons and badges
- dark terminal/code proof

Core tokens:

```css
:root {
  --tech-lab-midnight: #05061b;
  --tech-lab-white: #ffffff;
  --tech-lab-silver: #e5e7eb;
  --tech-lab-ink: #000000;
  --tech-lab-graphite: #141414;
  --tech-lab-cloud: #656565;
  --tech-lab-faded: #e6fff7;
  --tech-lab-steel-light: #c2c2c9;
  --tech-lab-polar: #d6d6db;
  --tech-lab-blue: #0036ff;
  --tech-lab-sky: #0093ff;
}
```

Typography:

- Aeonik-style display for headings.
- Inter for UI/body.
- Geist Mono for code/terminal.
- Display around `74px`, line-height `1.08`.

Components:

- electric blue pill CTA
- transparent square ghost button
- subtle nav link buttons with `6px` radius
- dark hero card with `24px` radius
- white frosted card with `20px` radius
- sky blue info badge

Do:

- make code/terminal proof real
- reserve electric blue for primary action
- separate light and dark sections deliberately
- use mono only for technical content

Don't:

- add new saturated colors
- use harsh shadows
- mix radius rules randomly
- use generic fonts for code/heading roles

---

## 3. Choosing The Technical UI Type

| Product Need | Use |
| --- | --- |
| research/workflow platform | Teal Architectural Workflow |
| AI chat/search/writing product | Austere AI Workstation |
| CRM/productivity/admin SaaS | Precision Toolkit Monochrome |
| experimental lab/hardware/software | Techno-Futurist Lab |
| developer tool/engineering platform | Mixed-Mode Engineering Lab |
| warm B2B trust | Teal Workflow |
| focused text interaction | AI Workstation |
| high-end product proof | Precision Toolkit |
| artistic technical brand | Techno Lab |
| code-driven landing | Engineering Lab |

If unsure, choose Precision Toolkit for general B2B SaaS and Mixed-Mode
Engineering Lab for developer tools.

---

## 4. Color Strategy

### 4.1 Technical Neutrals

Technical UI relies on a complete neutral system.

```css
:root {
  --tech-bg: #ffffff;
  --tech-surface: #f9f9f9;
  --tech-surface-strong: #f3f4f6;
  --tech-border: #e4e7ec;
  --tech-border-strong: #d3d8df;
  --tech-text: #0d0d0d;
  --tech-muted: #5d5d5d;
  --tech-disabled: #8f8f8f;
}
```

Roles:

- background
- sidebar/panel
- hover
- card
- input
- border
- active border
- primary text
- secondary text
- disabled text

### 4.2 Accent Role Discipline

Each technical UI should have one primary accent role:

| Accent | Role |
| --- | --- |
| teal | workflow action, trust, research |
| blue | links, developer primary CTA, focus |
| violet | SaaS action, AI/analytics |
| orange | lab conversion, creative technical product |
| red | critical/destructive only |
| black | primary action in monochrome toolkits |

Do not use every accent at once. Technical UI should feel controlled.

### 4.3 Semantic Colors

Define semantic colors separately from brand accent.

```css
:root {
  --state-info: #007aff;
  --state-success: #156152;
  --state-warning: #f59e0b;
  --state-danger: #dc2626;
  --state-critical: #f43325;
}
```

Rules:

- semantic colors must map to state
- brand accent must not replace error/warning
- destructive red should not be decorative
- success green should not compete with primary CTA

### 4.4 Mixed Light/Dark

Mixed-mode technical pages need clear section logic:

- dark hero for engineering depth
- white feature cards for readability
- dark code/terminal modules for proof
- light documentation/feature sections for scanning
- dark footer or final conversion optional

Do not alternate dark/light randomly. Each mode must have a job.

---

## 5. Typography

### 5.1 Three-Face Technical Model

Most strong technical UIs use three roles:

```text
Display Face = brand/hero/major headings
UI Face = body, controls, navigation
Mono Face = code, data, logs, technical values
```

Rules:

- mono is for data and code, not all UI
- display face should not damage readability
- UI face must work at `12-16px`
- headings need clear line-height and tracking

### 5.2 Type Pairing Patterns

| Use Case | Display | UI | Mono |
| --- | --- | --- | --- |
| research workflow | soft serif | geometric sans | IBM Plex Mono |
| AI workstation | refined sans prompt | system sans | optional |
| toolkit SaaS | serif or optically sized sans | Inter | optional |
| creative lab | geometric sans | same sans | geometric mono |
| developer platform | technical sans | Inter | Geist Mono |

### 5.3 Size Scale

Recommended baseline:

```css
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 40px;
  --text-5xl: 56px;
  --text-display: 64px;
}
```

Technical display exceptions:

- lab display can reach `100px`
- digital readouts can be `106px+`
- developer landing display can be `74px`
- workstation prompts may be only `18px`

### 5.4 Line Height

Use:

- `1.5-1.57` for body and long descriptions
- `1.3-1.44` for subheadings
- `1.07-1.2` for display
- `0.85` only for large lab display
- `1.4-1.6` for code blocks

### 5.5 Letter Spacing

Technical UI benefits from small adjustments:

- large sans headings: `-0.01em` to `-0.03em`
- mono labels: `0.02em` to `0.04em`
- body copy: `0`
- compact UI labels: `0` or slight positive

Avoid:

- negative tracking on small UI text
- wide tracking on long labels
- inconsistent tracking between same-level headings

---

## 6. Layout Systems

### 6.1 Workstation Layout

Use for AI/search/chat.

```text
sidebar 260-320px
main centered area
top-right utility controls
primary input object
conversation/output region
```

Rules:

- sidebar uses subtle background shift
- main interaction stays centered
- input is visually primary
- utility buttons stay quiet
- no decorative panels before the interaction

### 6.2 Dashboard Layout

Use for SaaS/admin/data tools.

```text
left nav or top nav
topbar with title/search/actions
metric row
primary data panel
secondary insight stack
table/list
```

Rules:

- prioritize information by job
- metrics need consistent card treatment
- tables need readable density
- actions must be near relevant data
- filters should not overwhelm content

### 6.3 Toolkit Product Landing

Use for Attio/ToDesktop-like sites.

```text
sticky nav
hero claim
CTA pair
embedded product UI frame
feature sections
workflow proof
code/data proof
conversion
```

Rules:

- product UI demo should be large and inspectable
- headings can be editorial or technical
- avoid abstract hero-only pages
- use borders and product frames as proof

### 6.4 Lab Interface Layout

Use for experimental/hardware/software labs.

```text
full-bleed abstract hero
sparse top nav
large technical headline
single CTA
product/lab modules
forms with mono labels
```

Rules:

- atmosphere lives in backgrounds
- controls remain precise
- CTA color stays rare
- cards can be flat
- negative space is part of the lab feel

### 6.5 Engineering Landing Layout

Use for developer tools.

```text
dark hero
white/frosted product cards
code snippet or terminal proof
integration logos
feature grid
documentation CTA
```

Rules:

- code proof must be real or plausible
- mono text must be readable
- primary blue CTA must stand out
- light and dark sections need clear purpose

---

## 7. Component Library

### 7.1 Primary Technical Button

```css
.tech-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #1c1d1f;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}
```

Use for monochrome toolkits.

### 7.2 Rounded Teal CTA

```css
.teal-cta {
  min-height: 48px;
  padding: 14px 22px;
  border: 0;
  border-radius: 48px;
  background: #1c5d5f;
  color: #ffffff;
  font-weight: 500;
}
```

Use for workflow platforms with warmer tone.

### 7.3 Electric Developer CTA

```css
.dev-cta {
  min-height: 38px;
  padding: 7px 16px;
  border: 0;
  border-radius: 999px;
  background: #0036ff;
  color: #ffffff;
  font-weight: 600;
}
```

Use for developer/engineering platforms.

### 7.4 Lab Amber CTA

```css
.lab-cta {
  min-height: 48px;
  padding: 14px 16px;
  border: 0;
  border-radius: 24px;
  background: #ff6c2f;
  color: #ffffff;
}
```

Use sparingly. One primary action per view.

### 7.5 Ghost Button

```css
.tech-ghost {
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid #d3d8df;
  border-radius: 10px;
  background: #ffffff;
  color: #1c1d1f;
  font-weight: 500;
}
```

Use for secondary actions.

### 7.6 Sidebar Nav Item

```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 6px 8px;
  border-radius: 10px;
  color: #0d0d0d;
}

.sidebar-item:hover,
.sidebar-item[data-active="true"] {
  background: #ececec;
}
```

Use for workstations and technical apps.

### 7.7 Feature Tab

```css
.feature-tab {
  padding: 8px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: #6f7988;
  font-size: 15px;
  font-weight: 500;
}

.feature-tab[data-active="true"] {
  color: #1c1d1f;
  border-bottom-color: #1c1d1f;
}
```

Use for product frames and feature switchers.

### 7.8 Ask Input

```css
.ask-input {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 28px;
  background: #ffffff;
  padding: 8px 12px 8px 20px;
}
```

Use when a query/chat/search input is the main object.

### 7.9 UI Frame Card

```css
.ui-frame {
  background: #ffffff;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  box-shadow:
    rgba(28, 40, 64, 0.1) 0 2px 3px -2px,
    rgba(28, 40, 64, 0.04) 0 4px 6px -2px;
  padding: 16px;
}
```

Use for embedded product demos.

### 7.10 Dark Code Module

```css
.code-module {
  background: #05061b;
  color: #ffffff;
  border-radius: 24px;
  padding: 20px;
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.6;
}
```

Use for real code, terminal, logs, or technical proof.

### 7.11 Bottom-Border Technical Input

```css
.mono-line-input {
  border: 0;
  border-bottom: 1px solid #a3a3a3;
  border-radius: 0;
  background: transparent;
  padding: 8px 12px;
  color: #000000;
  font-family: ui-monospace, monospace;
}
```

Use for lab/product forms.

### 7.12 Technical Badge

```css
.tech-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #0093ff;
  font-size: 12px;
  font-weight: 500;
}
```

Use for docs, platform tags, version labels, and status summaries.

---

## 8. Data, Code, And Tables

### 8.1 Code Blocks

Use code blocks only for real technical proof.

Rules:

- use mono font
- preserve line breaks
- keep contrast high
- include copy button if useful
- avoid fake code for non-technical products
- code should not be tiny

Code module structure:

```text
header row: language / file / copy
code body
optional output/status row
```

### 8.2 Logs

Log panels should be compact and readable.

Rules:

- use timestamp or status prefix
- color semantic states lightly
- keep row height consistent
- allow scrolling
- avoid wrapping long lines unless necessary

### 8.3 Tables

Technical tables need density without confusion.

Rules:

- left-align text columns
- right-align numeric columns
- use subtle row dividers
- use hover fill for scan
- freeze important headers where useful
- include empty/error/loading states

### 8.4 Metrics

Metric cards should communicate state.

Pattern:

```text
label
value
delta/status
small chart or sparkline optional
```

Rules:

- value is primary
- status color is semantic
- label must be specific
- avoid decorative numbers

### 8.5 Charts

Use charts for comparison and trends, not decoration.

Rules:

- neutral grid
- one highlight color
- readable labels
- compact tooltip
- direct annotations when useful
- no 3D charts

---

## 9. State Systems

Technical UI must clearly show state.

### 9.1 Core States

```css
:root {
  --state-idle: #8f8f8f;
  --state-active: #407ff2;
  --state-processing: #0036ff;
  --state-success: #156152;
  --state-warning: #f59e0b;
  --state-error: #dc2626;
  --state-critical: #f43325;
}
```

### 9.2 State Labels

Always pair color with text:

- Active
- Processing
- Queued
- Synced
- Failed
- Requires review
- Connected
- Disconnected

### 9.3 Loading

Loading patterns:

- workstation: subtle spinner inside input/action
- dashboard: skeleton rows/cards
- code: terminal progress line
- lab: `SYNCING` or mono status
- developer landing: animated code/output optional

### 9.4 Error

Error states should include:

- failed action
- reason if known
- recovery action
- persistence if the issue blocks progress

Example:

```text
Connection failed. Check API key and retry.
```

Not:

```text
Oops.
```

### 9.5 Empty

Empty states should guide action.

Examples:

- "No interviews scheduled. Create your first study."
- "No chats yet. Ask a question to begin."
- "No records match this filter."
- "No builds found. Connect a repository."

---

## 10. Navigation Patterns

### 10.1 Sidebar Workstation

Use for:

- chat
- search
- documents
- operations tools
- persistent workspaces

Rules:

- width around `260-320px`
- subtle background
- compact nav rows
- active state visible but calm
- new/create action easy to find

### 10.2 Sticky SaaS Top Bar

Use for landing and product apps.

Rules:

- logo left
- product/docs/pricing links
- primary CTA right
- subtle border/backdrop
- height `56-72px`

### 10.3 Product Tabs

Use for switching feature proofs.

Rules:

- active state must be obvious
- use bottom border or filled segment
- keep tab count under 7
- tabs should not wrap awkwardly

### 10.4 Embedded Lab Navigation

Use when the page is a technical scene.

Rules:

- navigation can be small and sparse
- avoid giant marketing nav
- keep CTA visible
- use mono labels if appropriate

---

## 11. Responsive Behavior

### 11.1 Workstation Mobile

- sidebar collapses to drawer or top nav
- input remains primary
- utility buttons move into menu
- conversation/output gets full width
- avoid hiding the new/start action

### 11.2 Dashboard Mobile

- metrics stack by priority
- tables scroll or become row cards
- filters move into sheet
- charts simplify labels
- topbar remains compact

### 11.3 Landing Mobile

- hero proof remains inspectable
- code blocks scroll horizontally
- CTA pair stacks or wraps cleanly
- display headings reduce line-height risk
- product frame does not become unreadable

### 11.4 Control/Lab Mobile

- dense modules stack
- critical CTA remains prominent
- labels stay readable
- avoid tiny mono text
- keep dark modules from dominating entire mobile page

---

## 12. Motion

Technical UI motion should communicate state.

Allowed:

- tab indicator movement
- input focus expansion
- card hover lift
- code output reveal
- skeleton loading
- status pulsing
- panel slide for drawers

Avoid:

- decorative floating code
- constant background animation
- aggressive parallax
- hover effects that move layout
- typewriter effects for long copy

Timing:

```css
:root {
  --tech-fast: 120ms;
  --tech-base: 200ms;
  --tech-slow: 360ms;
  --tech-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 13. Prompt Library

### 13.1 General Technical UI Prompt

```text
Design a precise technical UI with clear state, readable data, disciplined
neutral surfaces, one primary accent role, real product proof, accessible
controls, and component behavior suited to a workstation, dashboard, console, or
engineering platform. Avoid decorative fake code, random futuristic gradients,
low contrast labels, and generic SaaS cards.
```

### 13.2 Teal Workflow Prompt

```text
Design a friendly technical workflow platform on a #f2f8f7 canvas with teal
primary actions, soft serif headings, geometric sans UI, rounded buttons and
tags, generous 88px section rhythm, and mono only for structured data.
```

### 13.3 AI Workstation Prompt

```text
Design an austere AI workstation with a fixed sidebar, centered rounded prompt
input, achromatic white/fog panels, near-black text, restrained buttons, no
heavy shadows, and one calm primary interaction above all else.
```

### 13.4 Precision Toolkit Prompt

```text
Design a high-end monochrome SaaS toolkit with white surfaces, black primary
actions, 1px gray borders, serif display headlines, Inter UI text, active
feature tabs, and a large embedded product UI frame as the main proof.
```

### 13.5 Techno Lab Prompt

```text
Design a techno-futurist lab interface with monochrome surfaces, abstract dark
blurred hero background, Suisse-style geometric type, mono inputs and labels,
one #ff6c2f CTA, flat product cards, and sparse precise controls.
```

### 13.6 Engineering Lab Prompt

```text
Design a mixed light/dark developer platform with a deep #05061b hero, white
frosted product cards, electric blue pill CTA, Aeonik-like headings, Inter UI,
Geist Mono code blocks, real terminal proof, and strict accent discipline.
```

### 13.7 Negative Prompt

```text
Do not use fake telemetry, decorative code fragments, random neon gradients,
weak gray body text, generic rounded SaaS cards, unreadable tables, hidden focus
states, or multiple primary accent colors.
```

---

## 14. Implementation Starter

```css
:root {
  --tech-bg: #ffffff;
  --tech-panel: #f9f9f9;
  --tech-surface: #ffffff;
  --tech-border: #e4e7ec;
  --tech-border-strong: #d3d8df;
  --tech-text: #0d0d0d;
  --tech-muted: #5d5d5d;
  --tech-primary: #1c1d1f;
  --tech-accent: #407ff2;
  --tech-code-bg: #05061b;
  --tech-code-text: #ffffff;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 24px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
}

body {
  margin: 0;
  background: var(--tech-bg);
  color: var(--tech-text);
  font-family: Inter, system-ui, sans-serif;
}

.technical-card {
  background: var(--tech-surface);
  border: 1px solid var(--tech-border);
  border-radius: var(--radius-md);
}

.technical-code {
  background: var(--tech-code-bg);
  color: var(--tech-code-text);
  font-family: "Geist Mono", ui-monospace, monospace;
}
```

---

## 15. Tailwind Mapping

```js
export const technicalUiTheme = {
  colors: {
    bg: "#ffffff",
    panel: "#f9f9f9",
    border: "#e4e7ec",
    borderStrong: "#d3d8df",
    text: "#0d0d0d",
    muted: "#5d5d5d",
    ink: "#1c1d1f",
    blue: "#407ff2",
    teal: "#1c5d5f",
    amber: "#ff6c2f",
    code: "#05061b"
  },
  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "24px",
    pill: "999px"
  },
  fontFamily: {
    ui: ["Inter", "system-ui", "sans-serif"],
    display: ["Aeonik Pro", "Inter Display", "sans-serif"],
    mono: ["Geist Mono", "IBM Plex Mono", "monospace"],
    serif: ["Tiempos Text", "Georgia", "serif"]
  }
}
```

---

## 16. Page Recipes

### 16.1 AI Workspace

Sections/modules:

1. sidebar with new/search/history
2. centered prompt area
3. large input
4. output stream
5. tool/action row
6. account/utility controls

Key rules:

- primary input is the hero
- avoid marketing sections inside the workspace
- keep state visible
- preserve keyboard-first ergonomics

### 16.2 B2B Toolkit Landing

Sections:

1. sticky nav
2. hero with precise claim
3. CTA pair
4. product UI frame
5. feature tabs
6. workflow sections
7. proof/security/integrations
8. final CTA

Key rules:

- product proof above fold or immediately after
- serif or display heading can add distinctness
- borders and UI frames carry credibility

### 16.3 Developer Tool Landing

Sections:

1. dark engineering hero
2. code/terminal proof
3. docs link
4. integration grid
5. API/workflow examples
6. pricing or deploy CTA

Key rules:

- code must be readable
- docs must be accessible
- mono has clear role
- primary CTA accent is singular

### 16.4 Research Workflow Platform

Sections:

1. warm technical hero
2. rounded CTA pair
3. workflow step cards
4. participant/data proof
5. customer proof
6. operational dashboard preview

Key rules:

- teal action conveys trust
- rounded controls reduce intimidation
- serif headings humanize research

### 16.5 Lab Product Page

Sections:

1. abstract full-bleed hero
2. large technical headline
3. one amber CTA
4. product modules
5. mono input/signup
6. sparse product details

Key rules:

- atmosphere is allowed
- controls remain precise
- cards stay flat
- orange stays rare

---

## 17. Advanced Pattern Library

### 17.1 Product UI Frame

Use as proof for technical products.

Structure:

```text
outer frame
top toolbar
sidebar or tabs
main data/content region
status/action area
```

Rules:

- frame must show meaningful product state
- avoid lorem ipsum UI
- use real labels
- keep screenshot/components readable
- avoid excessive blur

### 17.2 Query Input Module

Use for AI/search/data products.

Structure:

```text
prompt/headline
input field
tool buttons
submit action
suggestion chips
```

Rules:

- input height communicates importance
- tool buttons stay secondary
- submit action is obvious
- suggestion chips should not clutter

### 17.3 Technical Form

Structure:

```text
label
helper text
input/select
validation state
action row
```

Rules:

- labels visible
- helper text useful
- focus ring visible
- errors explain recovery
- disabled states legible

### 17.4 Console Module

Structure:

```text
header: environment/status/copy
body: command/log/code
footer: output/status
```

Rules:

- code is not decorative
- copy button visible
- long lines scroll
- status text clear

### 17.5 Workflow Step Card

Structure:

```text
step number
title
description
proof/detail
action or status
```

Rules:

- steps must form a real sequence
- numbers/labels align
- active state visible
- avoid all steps equal if one is current

### 17.6 Status Strip

Use at top of dashboards or control panels.

Items:

- environment
- sync state
- last updated
- errors
- current user/project
- primary action

Rules:

- compact
- semantic color
- text labels
- no fake blinking decoration

### 17.7 Integration Grid

Use for developer/platform tools.

Rules:

- logos can be monochrome
- rows/cards should align
- status/availability can use small badges
- avoid huge logo walls

### 17.8 Technical Pricing

Technical pricing should be exact.

Rules:

- explain units
- show limits
- include docs/contact path
- keep plan comparison readable
- avoid playful plan names unless brand supports it

### 17.9 Documentation CTA

Developer tools need documentation as a first-class path.

CTA patterns:

- "Read docs"
- "View API reference"
- "Install CLI"
- "Copy command"
- "Open example"

Avoid:

- "Learn more" as primary developer CTA
- hiding docs below the fold

### 17.10 Security/Trust Module

Use for B2B technical products.

Content:

- SOC2/ISO/GDPR if applicable
- data handling
- permissions
- audit logs
- deployment model
- uptime/status

Visual:

- restrained card
- strong labels
- no fear-based red
- concise proof

---

## 18. Anti-Slop Rules

### 18.1 Fake Technicality

Do not:

- add random code snippets that do not relate to the product
- use terminal panels as decoration
- create fake metrics
- use labels like `SYSTEM ONLINE` everywhere
- add grid backgrounds without purpose
- use neon because "technical"

### 18.2 Data Slop

Do not:

- make tables unreadable
- use low contrast chart labels
- use random colors for series
- hide units
- show numbers without context
- make all cards equal priority

### 18.3 Component Slop

Do not:

- mix radius styles without rules
- use too many button treatments
- make focus invisible
- bury primary action
- use tiny click targets
- nest cards inside cards for whole sections

### 18.4 Typography Slop

Do not:

- use mono for all text
- use serif body copy in tool UIs
- set body text too small
- use pale gray placeholder-like body copy
- over-bold headings
- ignore code line-height

---

## 19. QA Checklist

### 19.1 Interaction

- Is the primary action obvious?
- Are secondary actions clearly secondary?
- Are focus states visible?
- Are disabled states legible?
- Are loading states stable?
- Are errors recoverable?

### 19.2 Data

- Are labels specific?
- Are units shown?
- Are tables readable?
- Are chart colors meaningful?
- Is important state visible?
- Is code/log content real and readable?

### 19.3 Layout

- Is one technical metaphor dominant?
- Does the first viewport include product proof?
- Does spacing support density?
- Does mobile preserve hierarchy?
- Are sidebars/tabs usable at small widths?

### 19.4 Visual Identity

- Is accent color disciplined?
- Are radii consistent by component type?
- Is typography role-based?
- Are surfaces separated enough?
- Is technicality functional rather than decorative?

---

## 20. Common Fixes

### 20.1 Feels Generic SaaS

Fix by:

- adding a real product UI frame
- defining a sharper accent role
- using tabs/code/data proof
- improving typography pairing
- replacing generic cards with workflow modules

### 20.2 Feels Too Cold

Fix by:

- adding serif display heading
- increasing radius on workflow controls
- warming canvas slightly
- improving copy tone
- adding human workflow proof

### 20.3 Feels Fake Technical

Fix by:

- replacing decorative code with real snippets
- removing fake telemetry
- adding meaningful states
- showing actual product data
- using domain-specific labels

### 20.4 Feels Cluttered

Fix by:

- reducing accent colors
- tightening card hierarchy
- grouping controls
- reducing visible columns
- converting secondary info into tabs/details

### 20.5 Feels Weak

Fix by:

- darkening primary text
- strengthening borders
- clarifying CTA
- adding product proof
- improving spacing between sections

---

## 21. Production Pattern Library

Use this section when implementing a real technical product screen. It converts
the archetypes into repeatable interface patterns.

### 21.1 Application Shell Matrix

| Shell Type | Best For | Navigation | Content Behavior |
| --- | --- | --- | --- |
| left-sidebar workstation | AI, docs, chat, search | persistent sidebar | centered primary task |
| top-nav SaaS app | admin/product tools | top bar + optional side nav | dashboard/content grid |
| split-pane tool | editors, inspectors, CRM | left list + right detail | master/detail workflow |
| console shell | logs, deploy, infra | tabs/status strip | dark or mixed data panels |
| lab shell | experimental product | sparse nav | immersive hero + precise controls |
| marketing shell | technical landing | sticky top nav | proof-led sections |

Rules:

- choose the shell before choosing card styles
- navigation must match task frequency
- a workstation should not feel like a marketing landing page
- a landing page should still show product proof early
- dense tools need persistent orientation

### 21.2 Sidebar Specification

Use for workstations and technical apps.

Recommended dimensions:

- desktop width: `260-320px`
- collapsed width: `56-72px`
- row height: `32-40px`
- row radius: `8-10px`
- icon size: `16-20px`
- group gap: `12-20px`

Sidebar anatomy:

```text
brand / workspace switcher
primary create action
navigation group
secondary group
history/recent list
account/settings/footer
```

Rules:

- active item must be visible
- group labels should be muted but readable
- history lists should truncate cleanly
- collapsed sidebars need tooltips
- keyboard focus must be obvious

Anti-patterns:

- sidebar wider than content needs
- low contrast nav text
- icon-only nav without labels/tooltips
- active state that relies only on subtle gray
- too many groups open at once

### 21.3 Top Bar Specification

Use for SaaS apps and technical landing pages.

Recommended:

- height: `56-72px`
- border: `1px` subtle bottom border
- background: white, fog, or backdrop
- left: logo/title
- center: nav/search if needed
- right: docs/account/primary action

Top bar states:

- default
- scrolled/sticky
- active nav item
- open dropdown
- mobile menu

Rules:

- do not overfill top bar
- primary action belongs on the right
- docs should be visible for developer tools
- search should be wide enough to be useful
- status can appear as compact badge

### 21.4 Master/Detail Pattern

Use for CRMs, inboxes, records, databases, admin tools.

Structure:

```text
left: list/filter/search
right: selected record/detail/workspace
top: context actions
bottom: optional activity log
```

Rules:

- list row active state must be clear
- detail panel needs stable header
- filters should not consume too much space
- empty detail state should guide selection
- row density should match use frequency

Row recipe:

```css
.record-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 8px;
}

.record-row[data-active="true"] {
  background: #f3f4f6;
}
```

### 21.5 Inspector Panel Pattern

Use for builders, design tools, automation tools, AI configuration, and data
editors.

Structure:

```text
panel title
section groups
field rows
toggles/selects
advanced collapsible area
save/apply action
```

Rules:

- group related controls
- label every control
- use fixed row rhythm
- avoid giant custom controls for simple settings
- advanced controls should not hide critical settings

Recommended dimensions:

- panel width: `300-380px`
- label: `12-13px`
- input height: `32-40px`
- section gap: `20-28px`
- field gap: `10-14px`

### 21.6 Command Palette Pattern

Use for technical tools where keyboard speed matters.

Structure:

```text
overlay
search input
grouped results
keyboard shortcuts
empty state
```

Rules:

- input focused on open
- results keyboard navigable
- selected item visible
- shortcut hints aligned right
- empty state includes useful next action
- recent commands can appear first

Visual:

- modal width: `560-720px`
- radius: `12-16px`
- border/shadow subtle
- result row: `40-48px`
- shortcut text: mono or muted sans

### 21.7 Filter Bar Pattern

Use for tables, logs, records, dashboards.

Structure:

```text
search
filter chips
date range
view switcher
export/action
```

Rules:

- active filters visible
- clear all action available
- chips should wrap gracefully
- date ranges need exact labels
- filters should not hide results count

Compact filter chip:

```css
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #d3d8df;
  border-radius: 999px;
  background: #ffffff;
  font-size: 13px;
}
```

### 21.8 Log Viewer Pattern

Use for build systems, deploy tools, AI agent traces, server consoles.

Structure:

```text
toolbar: environment, status, copy/download
log body
line numbers optional
semantic status rows
footer: current process / elapsed time
```

Rules:

- use monospace
- line-height at least `1.45`
- support horizontal scroll
- color only status tokens
- keep timestamps aligned
- provide copy/download where useful

Log row:

```text
12:04:23.118  INFO   Index built in 421ms
12:04:23.620  WARN   Retrying connection
12:04:24.004  ERROR  Request failed: 401
```

### 21.9 API Documentation Block

Use for developer-facing pages.

Structure:

```text
language tabs
endpoint/method
code sample
response sample
copy button
docs link
```

Rules:

- code must be accurate enough to be useful
- use real endpoint names if known
- tabs should not reset scroll unexpectedly
- response sample should be compact
- avoid giant code blocks above core value proposition unless docs page

### 21.10 Workflow Stepper

Use for setup, onboarding, deployment, data import, research flow.

Structure:

```text
step title
state
short instruction
action
validation/error
```

States:

- not started
- active
- complete
- blocked
- skipped

Rules:

- active step must stand out
- completed steps should remain inspectable
- blocked steps need recovery
- step numbers alone are not enough

### 21.11 Technical Onboarding

Technical onboarding should get users to first value.

Good sequence:

1. choose workspace/project
2. connect data/source/repository
3. configure minimal settings
4. run first action
5. see output
6. invite/collaborate if relevant

Avoid:

- long preference surveys before value
- decorative welcome screens
- hiding docs
- making API key setup ambiguous

### 21.12 Settings Screen Pattern

Use for account, workspace, integrations, billing, security.

Layout:

```text
settings sidebar
section title
description
form groups
danger zone separated
save action
```

Rules:

- changes should show saved/unsaved state
- destructive actions isolated
- API keys/secrets need reveal/copy controls
- security settings need explanatory copy
- billing units must be clear

### 21.13 Data Import Pattern

Use for CSV uploads, integrations, datasets, CRM imports.

Steps:

1. choose source
2. upload/connect
3. map fields
4. validate
5. preview
6. import
7. show results

Technical UI requirements:

- validation row states
- clear error counts
- sample rows
- undo or rollback if possible
- progress indicator

### 21.14 AI Agent Trace Pattern

Use for agentic products, AI builders, automation monitors.

Structure:

```text
goal
plan/steps
current action
tool calls
observations
result
retry/error controls
```

Rules:

- separate model reasoning summaries from tool outputs
- timestamps optional but useful
- tool calls need status
- errors need recovery actions
- avoid fake "thinking" animation as the main proof

Visual:

- collapsible steps
- mono blocks for command/output
- status badges
- compact timeline
- final result panel

### 21.15 Permissions And Trust Pattern

Use for integrations, OAuth, API keys, enterprise SaaS.

Components:

- permission list
- scope descriptions
- data access explanation
- revoke/control path
- audit log link
- security badge/proof

Rules:

- use clear language
- no fear-based red except warnings
- make irreversible actions explicit
- show who/what has access

### 21.16 Notification System

Technical products need non-noisy notifications.

Types:

- success toast
- error toast
- warning banner
- info banner
- persistent system alert
- inline validation message

Rules:

- toast for temporary feedback
- banner for page-level issue
- inline for field/module issue
- persistent alert for system state
- include action if recovery exists

Toast recipe:

```css
.toast {
  border: 1px solid #e4e7ec;
  border-radius: 10px;
  background: #ffffff;
  color: #0d0d0d;
  box-shadow: rgba(28, 40, 64, 0.12) 0 8px 24px -12px;
  padding: 12px 14px;
}
```

### 21.17 Keyboard Interaction Rules

Technical users often expect keyboard support.

Implement:

- visible focus
- Escape closes overlays
- Enter submits/searches when appropriate
- arrow keys navigate command palette/list
- slash or cmd+k for search if supported
- tab order follows visual order

Avoid:

- focus traps without escape
- icon buttons without labels/tooltips
- hover-only actions
- custom controls without keyboard behavior

### 21.18 Tooltip Rules

Use tooltips for:

- icon-only actions
- truncated labels
- technical status details
- keyboard shortcut hints

Do not use tooltips for:

- critical instructions
- error recovery
- required field explanations
- long documentation

Tooltip should be:

- short
- delayed slightly
- keyboard accessible
- high contrast

### 21.19 Technical Copy Rules

Good technical copy is specific.

Use:

- "Connect repository"
- "Run import"
- "Copy API key"
- "Retry sync"
- "View logs"
- "Create study"
- "Ask a question"

Avoid:

- "Unlock"
- "Supercharge"
- "Explore possibilities"
- "Seamless"
- "Next-gen"
- "Click here"

Error copy examples:

| Weak | Better |
| --- | --- |
| Something went wrong | Sync failed. Retry or check credentials. |
| Invalid input | API key must start with `sk_`. |
| Failed | Build failed at deploy step. View logs. |
| Not found | No records match current filters. |

### 21.20 Domain Module Matrix

| Domain | Required Proof | Best Component |
| --- | --- | --- |
| AI chat | prompt input + output state | workstation shell |
| CRM | record list + detail panel | master/detail |
| analytics | metric cards + chart/table | dashboard grid |
| developer tool | code snippet + docs CTA | code module |
| automation | timeline + tool calls | agent trace |
| research | study workflow + participants | rounded step cards |
| hardware/lab | product module + signup/input | lab hero |
| infrastructure | logs + deploy status | console module |

### 21.21 Responsive Pattern Matrix

| Pattern | Desktop | Mobile |
| --- | --- | --- |
| sidebar workstation | fixed sidebar | drawer/top nav |
| dashboard | grid + table | stacked cards + scroll table |
| master/detail | split pane | list then detail route/sheet |
| command palette | centered modal | full-screen sheet |
| code module | wide scroll area | horizontal scroll |
| feature tabs | horizontal tabs | scrollable tabs or select |
| filter bar | inline controls | filter sheet/chips |

Mobile rules:

- never shrink code below readable size
- avoid tiny table columns
- keep action buttons visible
- preserve active state
- show result counts
- don't hide error recovery

### 21.22 Wide Desktop Rules

Technical UI on wide screens should avoid empty drift.

Use:

- max-width constraints
- split panes
- secondary inspector panels
- centered content with useful side context
- larger product proof
- denser dashboard grids

Avoid:

- stretching text lines past readable width
- huge empty gutters with tiny content
- giant cards containing little information
- screenshots too large to inspect

### 21.23 Accessibility Guardrails

Technical UI often has dense controls; accessibility is non-negotiable.

Checklist:

- every icon button has accessible label
- color states have text or icon support
- focus visible on all controls
- modal focus trapped correctly
- tables have headers
- form errors are associated with fields
- code blocks have readable contrast
- disabled states remain legible
- reduced motion respected

### 21.24 Security And Sensitive Data

If UI displays keys, tokens, logs, or personal data:

- mask secrets by default
- add reveal/copy controls
- indicate copied state
- avoid exposing full tokens in screenshots
- separate destructive actions
- show audit/revoke paths

Visual pattern:

```text
API key: sk-••••••••••••d9f2   [Reveal] [Copy] [Rotate]
```

### 21.25 Component State Inventory

For every key component, define:

- default
- hover
- focus
- active
- selected
- disabled
- loading
- error
- success

Example button states:

```css
.button:hover { filter: brightness(0.96); }
.button:active { transform: translateY(1px); }
.button:focus-visible { outline: 2px solid #407ff2; outline-offset: 2px; }
.button[disabled] { opacity: 0.55; cursor: not-allowed; }
```

### 21.26 Design Review Smell Tests

Ask:

- Can the user identify current state in five seconds?
- Is the primary workflow visible without reading marketing copy?
- Are data labels meaningful?
- Does the code/log panel contain useful content?
- Is the accent color overused?
- Can the user recover from failure?
- Is mobile still usable?
- Are controls keyboard accessible?
- Does the interface look technical because it works, not because it glows?

### 21.27 Finish Criteria

Count a Technical UI as finished only when:

- one shell/layout pattern is dominant
- product proof is real and inspectable
- state system is defined
- primary/secondary/critical actions differ
- code/data/table modules are readable
- empty/loading/error states exist
- navigation supports the workflow
- mobile behavior is planned
- accent colors map to roles
- no decorative fake telemetry remains

### 21.28 Dashboard Blueprint

Use this for a technical SaaS dashboard.

Structure:

```text
topbar: product/workspace, search, docs, account
summary strip: status, sync, environment, last updated
metric grid: 3-4 primary metrics
main panel: chart/table/workflow
side panel: alerts/tasks/recommendations
table/log region: detailed records
```

Recommended desktop grid:

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 20px;
}

.metric-card { grid-column: span 3; }
.main-panel { grid-column: span 8; }
.side-panel { grid-column: span 4; }
.full-panel { grid-column: 1 / -1; }
```

Rules:

- metrics should answer "what changed?"
- main panel should answer "why?"
- side panel should answer "what should I do?"
- table/log should answer "show me the evidence"

### 21.29 Metric Card Variants

Compact metric:

```text
Label
Value   Delta
```

Operational metric:

```text
Label        Status badge
Value
Sparkline / mini bar
Last updated
```

Technical metric:

```text
Metric name
monospace value
unit
threshold / limit
```

Rules:

- do not show numbers without units
- use semantic colors for deltas
- avoid decorative huge numbers
- align metric cards consistently
- keep labels short but specific

### 21.30 Table Density Presets

Comfortable:

- row height: `52-60px`
- font: `14px`
- padding: `14-16px`
- best for business users

Compact:

- row height: `40-48px`
- font: `13-14px`
- padding: `10-12px`
- best for technical operators

Dense:

- row height: `32-38px`
- font: `12-13px`
- padding: `6-10px`
- best for logs, admin, expert tools

Rules:

- provide density only when users need it
- do not make default UI dense for casual users
- maintain tap targets on touch devices
- keep selected/hover states visible

### 21.31 Chart And Table Pairing

A technical UI often needs both summary and evidence.

Pattern:

```text
chart shows trend
table shows exact records
filter controls affect both
selected chart point filters table
```

Rules:

- chart and table use the same labels/units
- selected state is visible in both
- filters show active values
- table is not hidden if it is core evidence

### 21.32 AI Workflow Prompt UI

Use for prompt builders, agent tools, AI assistants.

Components:

- prompt input
- model selector
- tool/mode selector
- context attachments
- run button
- output panel
- trace/log panel
- retry/refine controls

Layout:

```text
left: prompt/config
right: output
bottom/right: trace details
```

Rules:

- separate prompt from output
- make model/tool state visible
- show running/error/completed states
- keep trace collapsible
- do not expose overwhelming internals by default

### 21.33 Agent Trace Visual Language

Trace row anatomy:

```text
[status icon] Step title
              short summary
              metadata: time / tool / tokens / cost optional
```

Status:

- queued
- running
- waiting
- complete
- failed
- skipped

Visual:

- use icons or dots plus text
- mono for command/tool output
- muted timestamp
- expandable details
- clear retry action for failed steps

### 21.34 Terminal Panel Variants

Dark terminal:

- best for developer landing pages
- high contrast
- strong proof

Light terminal:

- best inside light dashboards
- softer, less theatrical
- useful for logs

Inline command:

- best for docs/install CTAs
- single-line command with copy button

Command card pattern:

```text
npm create app@latest
[copy]
```

Rules:

- command text must not wrap badly
- copy button should preserve width after copy
- copied state should be clear
- never use terminal as pure decoration

### 21.35 Technical Pricing Pattern

Technical buyers need units and constraints.

Plan card must show:

- price
- unit
- included limits
- overage rules
- support/SLA if relevant
- API/integration availability
- security/compliance differences

Comparison table:

- group features by category
- use text for limits
- avoid checkmark-only ambiguity
- keep enterprise contact clear

Bad:

```text
Pro: $99/mo, More features
```

Better:

```text
Pro: $99/mo
10 seats included
1M events/month
7-day log retention
API access
```

### 21.36 Integration Card Pattern

Use for connected apps, APIs, repositories, data sources.

Card anatomy:

```text
logo/name
status
description
connected account/workspace
last sync
actions: configure / disconnect / view logs
```

Rules:

- connection status visible
- destructive disconnect separated
- last sync timestamp readable
- errors link to logs or settings
- badges should be semantic

### 21.37 Version / Changelog Pattern

Developer tools often need change communication.

Pattern:

```text
version
date
type badge
summary
details
links
```

Visual:

- mono version label
- subtle dividers
- type badges: added/fixed/security/breaking
- breaking changes visibly marked

Rules:

- do not hide breaking changes
- keep dates exact
- link docs/migration
- avoid marketing fluff

### 21.38 Technical Search Pattern

Search in technical UIs should support precision.

Features:

- keyword search
- scoped search
- filters
- recent searches
- keyboard shortcut
- empty state
- result count

Search result row:

```text
title
path/context
highlighted match
metadata/status
```

Rules:

- show query feedback
- highlight exact matches
- keep filters visible
- allow clear/reset
- support keyboard navigation if search is central

### 21.39 Audit Log Pattern

Audit logs need trust.

Columns:

- timestamp
- actor
- action
- resource
- result
- IP/location optional
- details

Rules:

- timestamps exact
- actions human-readable
- filters by actor/action/resource
- export available if enterprise
- no decorative colors except semantic result

### 21.40 Permission Matrix Pattern

Use for roles, teams, admin settings.

Structure:

```text
role rows
permission columns
checkbox/toggle cells
description tooltips
save/revert
```

Rules:

- default states clear
- inherited permissions indicated
- dangerous permissions warned
- bulk changes confirmed
- keyboard accessible

### 21.41 Technical Marketing Proof Ladder

A technical landing page should progress from claim to proof:

1. exact claim
2. product UI frame
3. workflow demonstration
4. code/data proof
5. integrations/security
6. customer/usage proof
7. docs/trial CTA

Avoid:

- hero claim with no product proof
- feature icons before showing workflow
- testimonials before showing what product does
- decorative dashboards

### 21.42 Domain-Specific Labels

Use domain language to avoid generic UI.

Developer:

- deploy
- build
- branch
- environment
- token
- webhook
- endpoint

Research:

- study
- participant
- screener
- interview
- incentive
- segment

CRM:

- record
- account
- owner
- pipeline
- activity
- enrichment

AI:

- prompt
- context
- tool call
- trace
- model
- output

Infrastructure:

- region
- replica
- latency
- uptime
- incident
- log

### 21.43 Visual Token Presets

Workstation preset:

```css
:root {
  --bg: #ffffff;
  --sidebar: #f9f9f9;
  --text: #0d0d0d;
  --muted: #5d5d5d;
  --hover: #ececec;
  --radius-nav: 10px;
  --radius-input: 28px;
}
```

Toolkit preset:

```css
:root {
  --bg: #ffffff;
  --panel: #f3f4f6;
  --border: #d3d8df;
  --text: #1c1d1f;
  --muted: #6f7988;
  --primary: #1c1d1f;
  --focus: #407ff2;
  --radius-button: 10px;
  --radius-card: 8px;
}
```

Developer lab preset:

```css
:root {
  --dark: #05061b;
  --light: #ffffff;
  --border: #e5e7eb;
  --text: #000000;
  --muted: #656565;
  --blue: #0036ff;
  --mono-bg: #05061b;
  --radius-pill: 999px;
  --radius-card: 24px;
}
```

Warm workflow preset:

```css
:root {
  --canvas: #f2f8f7;
  --surface: #ffffff;
  --text: #000000;
  --heading: #283338;
  --teal: #1c5d5f;
  --green: #156152;
  --cloud: #e4f0f1;
  --radius-button: 48px;
  --radius-large: 88px;
}
```

### 21.44 Quick Generation Recipes

AI assistant:

```text
Austere workstation shell, fixed fog sidebar, centered 28px-radius prompt
input, near-black text, no heavy shadows, clear tool buttons, visible running
state, collapsible trace panel.
```

Developer landing:

```text
Deep midnight hero, electric blue pill CTA, real code block with copy action,
white frosted feature cards, docs link in nav, integration proof, Geist Mono
technical labels.
```

CRM toolkit:

```text
Monochrome white UI, serif display headline, Inter app shell, product UI frame,
master/detail record preview, active feature tabs with bottom border, black
primary CTA.
```

Research workflow:

```text
Canvas Ice background, teal rounded CTA, serif headings, Sofia-like UI text,
rounded step cards, participant/data proof, Cloud Frost info banner.
```

Lab product:

```text
Full-bleed abstract dark hero, geometric sans display, mono signup/input,
single amber CTA, flat product modules, sparse controls, monochrome base.
```

### 21.45 First-Viewport Audit

For technical UI landing pages:

- exact product category visible
- primary technical proof visible
- docs/product CTA visible
- nav includes docs/pricing/sign in if relevant
- no fake abstract dashboard as only proof
- headline line length controlled
- contrast strong

For technical app screens:

- current workspace/project visible
- current state visible
- primary action visible
- navigation orientation clear
- errors/warnings visible
- keyboard focus path logical

### 21.46 Copy And Label Checklist

Use labels that users can act on:

- "Sync failed" not "Error"
- "Connect GitHub" not "Integrate"
- "View build logs" not "Details"
- "Rotate API key" not "Manage"
- "No records match filters" not "Nothing here"
- "Retry import" not "Try again" when the operation is known

Technical copy should reduce uncertainty.

### 21.47 Final Red Flags

Revise if:

- the interface relies on decorative code
- the main state is unclear
- every card is equally important
- table labels are vague
- buttons use three different accent colors
- mobile hides recovery actions
- focus states are invisible
- logs/code are too small
- the first viewport lacks product proof
- the design feels technical only because it is dark

---

## 22. Agent Workflow

1. Identify the technical product role.
2. Choose one archetype.
3. Define neutral/surface tokens.
4. Define accent role.
5. Define typography roles: display, UI, mono.
6. Define radius by component type.
7. Define state colors and labels.
8. Build the primary workflow or product proof.
9. Add navigation and controls.
10. Add data/code/table components as needed.
11. Add empty/loading/error states.
12. Audit contrast, focus, and mobile behavior.

Do not start with a decorative aesthetic. Start with the operational model.

---

## 23. Quick Reference

### Do

- show real product state
- use mono for code/data only
- define semantic states
- keep accents disciplined
- make tables and code readable
- provide focus states
- make product proof inspectable
- use borders/surfaces purposefully

### Don't

- fake code/telemetry
- add random neon
- use low contrast labels
- hide primary action
- use mono everywhere
- use many saturated accents
- make all cards equal
- use decorative dashboards

### Final Taste Test

A strong Technical UI should still make sense if all decorative effects are
removed. The workflows, data, states, inputs, and product proof must carry the
design. If the page only feels technical because of fake code and blue glow, it
is not technical enough.
