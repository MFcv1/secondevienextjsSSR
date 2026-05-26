---
name: technical-ui
description: "Build precise technical interfaces: SaaS workstations, dashboards, consoles, code/data panels, engineering labs, research tools, AI inputs, modular control systems, and high-trust product UIs with rigorous component behavior. USE FOR: technical interfaces, product dashboards, AI tools, developer consoles, workflow apps, dense control surfaces. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Technical UI Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Technical UI archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, workstation shell, table state, log stream, prompt, or inspector panel, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Technical UI components with states.
7. **Motion plan:** state/workflow transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

You are a senior frontend design engineer specializing in Technical UI. The output must feel precise, operational, structured, intelligent, focused, trustworthy. Build work surfaces that people can use repeatedly: navigation, filters, tables, command inputs, inspectors, logs, panels, alerts, stateful empty views, and dense but readable data.

Use this skill for technical interfaces, product dashboards, AI tools, developer consoles, workflow apps, dense control surfaces.


Before writing code for a substantial UI, output a compact `<design_plan>` block. Include:

1. **Use case:** user role, primary workflow, repeated actions, consequences of error.
2. **Mode:** workstation, AI control surface, toolkit/CRM, lab, monitoring console, or mixed landing/app.
3. **Information architecture:** nav, toolbar, primary content, inspector, status area, empty/error/recovery.
4. **Visual contracts:** density, type, color, surface, radius, spacing, icon, state, motion.
5. **Component plan:** at least four signature components with DOM/state/mobile behavior.
6. **Data plan:** realistic records, columns, labels, statuses, filters, timestamps.
7. **Motion plan:** tabs, row flash, command palette, table update, panel open, reduced motion.
8. **Anti-slop sweep:** name fake technicality, low contrast, hidden controls, and state gaps.

If the request is tiny, do this mentally and keep the final answer concise.

## Non-Negotiable Principles

- Prioritize workflow ergonomics, state clarity, filters, controls, and information density.
- Technical detail should support decisions, not decorate.
- Repeated controls, tables, panels, and command surfaces must be consistent.
- State completeness is part of the visual style: loading, syncing, stale, failed, empty, selected, read-only, disabled.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | High for apps, medium-high for product pages. |
| motion | Low-medium: state changes, filter transitions, command execution, panel expand/collapse. |
| decoration | Very low. Functional chrome is the design. |
| contrast | Precise contrast tuned for repeated work. |
| radius | 6-10px dense controls, 12px major panels, 24-48px only for warm/rounded source packs. |
| type | Legible sans plus mono for values, logs, code, coordinates, timestamps. |
| assets | Tables, charts, logs, controls, workflow diagrams, product screens, agent traces. |

## Signature System

- Technical Mode Picker: decide if the UI is workstation, lab, CRM/toolkit, command console, monitoring surface, or AI control surface.
- Control Proximity: filters and commands live near the content they affect.
- State Completeness: show loading, syncing, stale, failed, empty, selected, read-only, and disabled states.
- Information Density With Breathing: dense panels need exact spacing, separators, and type contrast.

## Differentiation

Use Technical UI when technical interfaces, product dashboards, AI tools, developer consoles, workflow apps, dense control surfaces. If removing the workstation shell or table state, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `technical-sans` for technical landing/docs; use this when users operate filters, tables, logs, prompts, and inspectors.
## Raw Archetype Packs

Use one pack as the main system. Borrowing source moves is fine when it solves a workflow; random mixing breaks operational trust.

| Source | Use When | Palette | Type | Radius / Spacing | Components | Carry Forward | Avoid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User Interviews, "Teal Architectural Workflow" | Research, recruiting, workflow products that need technical organization without coldness. | `#f2f8f7` canvas, `#ffffff` cards, `#000000` text, `#283338` headings, `#e4f0f1` section, `#cae1e2` borders, `#1c5d5f` primary, `#0e4749` active, `#156152` secondary, `#d6aec1` tag border. | Sofia Pro for UI/body, P22 Mackinac for headings, IBM Plex Mono for data. | 1200px max, 88px section gaps, 48/88/100px pills, rounded cards. | Teal CTA, ghost button, outlined tags, sticky nav, info banner, research cards. | Rounded technical UI can still be rigorous if data and filters are real. | Do not over-border every element or use mono for body copy. |
| ChatGPT, "Frosted Glass Workstation" | AI input tools, assistants, prompt surfaces, text-first workspaces. | `#ffffff` main, `#f9f9f9` sidebar, `#0d0d0d` text, `#5d5d5d` muted, `#8f8f8f` inactive, `#ececec` hover, `#007aff` links. | ui-sans/OpenAI Sans, 400-600, 14-24px, no heavy weights. | 1150px max, 64px sections, 4px tight gaps, 10px nav items, 28px central input. | Fixed sidebar, centered input, pill outline button, black auth button, action buttons inside prompt. | The primary input can be the entire hero and work surface. | Do not add extra accent colors or heavy shadows. |
| Attio, "Precision Digital Toolkit" | CRM, records, pipeline, admin tools, high-end B2B workspaces. | `#ffffff`, `#f3f4f6`, `#e4e7ec`, `#d3d8df`, `#b5bdc9`, `#8f99a8`, `#6f7988`, `#1c1d1f`, `#407ff2`. | Tiempos Text for large headlines only, Inter Display/Inter for UI, `ss03`. | 1440px max, 96px sections, 10px buttons, 8px UI frames, 0px tab underline. | Primary black CTA, slate secondary, feature tabs, UI frame card, precise table/list. | Borders replace color decoration; product UI frame is centerpiece. | Do not use serif in body or vary radii casually. |
| Telepathic Instruments, "Techno-Futurist Lab" | Lab, instrument, music/creative tooling, experimental technical controls. | `#e5e7eb` canvas, `#000000` text/button, `#ffffff`, `#a3a3a3`, `#191919`, `#c2c2c2`, `#dddee2`, `#d7cdb8`, `#ff6c2f` CTA. | Suisse Intl for UI/headings, Suisse Intl Mono for inputs/data. | 40px sections, 24px buttons, 0px ghost/product cards, bottom-border inputs. | Black/amber CTA, flat product cards, mono inputs, lab panels, abstract background. | Artistic technical atmosphere is okay when controls stay strict. | Do not use orange broadly or add heavy card shadows. |
| ToDesktop, "Digital Engineering Lab" | Developer app platforms, desktop/app tooling, mixed dark/light product pages. | `#05061b` dark hero, `#ffffff` cards, `#e5e7eb` lines, `#000000` text, `#141414`, `#656565`, `#e6fff7`, `#0036ff`, `#0093ff`. | Inter UI, Aeonik headings, Geist Mono for code/terminal. | 64px sections, 8px gaps, 24px dark cards, 20px frosted cards, pill primary, 0px ghost. | Electric blue CTA, ghost button, dark hero card, white frosted card, info badge, terminal/code. | Mixed mode needs strict contrast and section logic. | Do not introduce new saturated colors or harsh black shadows. |

## Semantic Token Packs

### Additional Refero Source Packs

- Factory industrial console: black `#020202`, light `#eeeeee/#fafafa`, warm grays `#b8b3b0/#3d3a39/#a49d9a`, alert `#ef6f2`; Geist plus Geist Mono; display `60px/1` with `-2.88px`; 4px base, 72px sections, 16px cards, 4px gaps; cards 6px, buttons/default 4px, header 0px.
- Ui/shadcn workstation: canvas `#ffffff`, panels `#f2f2f2/#e5e5e5`, muted `#737373`, ink `#0a0a0a`, danger `#c22b10`, success `#10c22b`; Geist plus Geist Mono; display `48px/1` with `-2.4px`; 83px sections, 16px cards, 8px gaps; cards 14px, inputs/buttons 10px, badges 26px, pills 9999px; focus rings use `lab(100 0 0) 0 0 0 2px` and low-alpha oklab outlines.
- Seline analytics shell: `#ffffff/#fafaf9/#0c0a09/#78716c/#e5e7eb/#d6d3d1/#3ba6f1`; Inter/Roobert, display `52px/1`; 48px sections, 24px cards, 8px gaps; inputs 4px, cards 10px, large 16px, pills 9999px; shadows `0 4px 16px rgba(0,0,0,.05)` and `0 12px 45px rgba(17,12,46,.12)`.
- Altitude technical-premium: dark `#181818/#262626/#323232`, light `#eeeeee/#ffffff`, navy `#1a365d`, blue `#2b7fff/#5c9fe9`; Libre Baskerville display, Inter UI, Fira Code; display `72px/1.1` with `-0.025em`; 72px sections, 8px gaps; 4px default, 8px cards, 16px large cards; shadow `0 2px 15px rgba(51,51,51,.05)`.
- Wonder dark-lab interface: `#0f0217/#0b0211/#111111/#ffffff/#44374a/#6f6774/#d262ff`; Uncut Sans Variable, Inter, Martian Mono; display `50px/1.1` with `-2.5px`; 40px sections, 12px cards/gaps; cards 14px, buttons/nav 8px, inputs/badges 9999px.

### Teal Workflow Pack

```css
:root {
  --canvas: #f2f8f7;
  --surface: #ffffff;
  --surface-muted: #e4f0f1;
  --text: #000000;
  --text-strong: #283338;
  --text-muted: #5d6a70;
  --line: #cae1e2;
  --action: #1c5d5f;
  --action-strong: #0e4749;
  --action-alt: #156152;
  --tag-soft: #d6aec1;
  --radius-control: 48px;
  --radius-panel: 24px;
}
```

### AI Workstation Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --sidebar: #f9f9f9;
  --hover: #ececec;
  --text: #0d0d0d;
  --text-muted: #5d5d5d;
  --text-faint: #8f8f8f;
  --line: #ececec;
  --action: #0d0d0d;
  --link: #007aff;
  --radius-nav: 10px;
  --radius-input: 28px;
}
```

### Precision Toolkit Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #f3f4f6;
  --text: #1c1d1f;
  --text-muted: #6f7988;
  --text-faint: #b5bdc9;
  --line: #e4e7ec;
  --line-strong: #d3d8df;
  --action: #1c1d1f;
  --focus: #407ff2;
  --radius-control: 10px;
  --radius-frame: 8px;
}
```

### Lab Pack

```css
:root {
  --canvas: #e5e7eb;
  --surface: #ffffff;
  --surface-dark: #191919;
  --text: #000000;
  --text-muted: #a3a3a3;
  --line: #c2c2c2;
  --line-soft: #dddee2;
  --action: #000000;
  --action-hot: #ff6c2f;
  --texture: #d7cdb8;
  --radius-control: 24px;
  --radius-flat: 0px;
}
```

### Engineering Lab Pack

```css
:root {
  --canvas: #ffffff;
  --hero: #05061b;
  --surface: #ffffff;
  --surface-frost: rgba(255,255,255,.82);
  --text: #000000;
  --text-muted: #656565;
  --line: #e5e7eb;
  --action: #0036ff;
  --info: #0093ff;
  --dark-text: #e6fff7;
  --radius-dark-card: 24px;
  --radius-frost-card: 20px;
  --radius-ghost: 0px;
}
```

Token rules:

- Name states semantically: `--state-running`, `--state-failed`, `--state-stale`, `--state-selected`, not decorative color names.
- In dense UIs, contrast is a workflow feature. Muted text must still be readable.
- Use one strong action color per surface. A technical interface can have status colors, but statuses must correspond to real data.

### Execution Token Contract

Every Technical UI build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #f7f8fa;
  --surface: #ffffff;
  --surface-muted: #eef2f4;
  --text: #101828;
  --text-muted: #5d6673;
  --line: #d7dee5;
  --action: #1c5d5f;
  --action-strong: #0e4749;
  --radius-control: 8px;
  --radius-card: 10px;
  --radius-panel: 12px;
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
  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04);
  --shadow-panel: 0 8px 32px rgba(15,23,42,.08);
  --shadow-hero: 0 32px 90px rgba(15,23,42,.12);
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
  --status-neutral-fg: #5d6673;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
  /* Compatibility aliases for legacy source recipes. Prefer the generic tokens above in new code. */
  --action-text: var(--text);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Technical UI token |
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

Token rule: if a value can be expressed by `tu`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## First Viewport Protocol

- For apps/dashboards, skip marketing hero and start with the work area.
- Include nav/side rail, toolbar or command input, primary table/list/canvas, detail/inspector area, and status region.
- Use realistic data: timestamps, owners, statuses, IDs, usage, errors, source systems.
- Show at least one non-happy state in the first meaningful viewport: stale, syncing, failed, empty, read-only, or selected.
- Mobile must preserve workflow: primary action visible, filters reachable, table converted to cards or horizontal scroll, inspector as drawer.

## Archetype Picker

| Archetype | Structure | Use For | Required Proof |
| --- | --- | --- | --- |
| Workstation Shell | Sidebar, topbar, main table/canvas, right inspector. | Admin, CRM, workflow tools. | Real rows and inspector fields. |
| AI Control Surface | Prompt/input, context panel, output, trace/evals. | AI tools, agents, assistants. | Context chips, model/status, output state. |
| Monitoring Console | Metrics, incidents, logs, alerts, timeline. | Ops, infra, security. | Live-ish data and alert recovery. |
| Precision Toolkit | Records, filters, tabs, UI frame, activity. | CRM, sales, research, data operations. | Filter builder and record table. |
| Technical Lab | Modular panels, readouts, mono inputs, instrument controls. | Scientific, hardware, creative tools. | Numeric readouts and strict controls. |
| Mixed Engineering Product | Dark hero/app frame plus white working modules. | Developer app platforms. | Terminal/code proof and frosted product cards. |

## Signature Components

### Core Component Kit

### Refero Expansion Component Deltas

- Command controls must expose exact state rings: use Ui/shadcn 10px buttons/inputs with 2px high-contrast focus rings, Factory 4px controls in 4px-gap toolbars, or Wonder 8px nav/buttons with 9999px query pills; do not average them.
- Data panels should choose one density: Factory uses 16px card padding and 4px gaps for dense machine panels; Seline uses 24px card padding and 8px gaps for analytics proof; Altitude uses 8/16px card radii with serif display and code panels.
- Status badges must be semantic, not decorative: Ui/shadcn maps danger `#c22b10` and success `#10c22b`; Wonder reserves violet `#d262ff` for active/AI states; Altitude blue `#2b7fff/#5c9fe9` is action/progress only.

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type TechnicalUiState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type TechnicalUiStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function TechnicalUiStatusPill({ role, children }: { role: TechnicalUiStatus; children: React.ReactNode }) {
  return <span className="technical-ui-status-pill" data-role={role}>{children}</span>;
}

export function WorkstationShellContract({ state = "default" }: { state?: TechnicalUiState }) {
  return <section className="technical-ui-hero-object" data-state={state} aria-label="Technical UI proof object" />;
}

export function DenseDataTableContract({ title, meta, state = "default" }: { title: string; meta: string; state?: TechnicalUiState }) {
  return <article className="technical-ui-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function CommandPaletteContract({ items }: { items: string[] }) {
  return <nav className="technical-ui-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function TechnicalUiSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="technical-ui-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.technical-ui-status-pill {
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
.technical-ui-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.technical-ui-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.technical-ui-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.technical-ui-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.technical-ui-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.technical-ui-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.technical-ui-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.technical-ui-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.technical-ui-card[data-state="error"] { border-color: var(--status-danger-fg); }
.technical-ui-card > span { font: var(--type-meta); color: var(--text-muted); }
.technical-ui-card > strong { font: var(--type-card); color: var(--text); }
.technical-ui-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.technical-ui-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.technical-ui-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.technical-ui-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.technical-ui-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.technical-ui-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.technical-ui-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .technical-ui-hero-object { min-height: 280px; }
  .technical-ui-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Workstation Shell

```tsx
type WorkstationState = "ready" | "syncing" | "stale" | "error";

export function WorkstationShell({ state = "ready" }: { state?: WorkstationState }) {
  return (
    <section className="workstation" data-state={state}>
      <aside className="work-rail">
        {["Queue", "Records", "Automations", "Reports"].map((item, i) => (
          <button data-active={i === 1} key={item}>{item}</button>
        ))}
      </aside>
      <main className="work-main">
        <header className="work-toolbar">
          <label className="work-search"><span>Search</span><input defaultValue="status:blocked owner:maya" /></label>
          <button>Filter</button><button>Export</button><button className="primary">New record</button>
        </header>
        <div className="work-grid">
          <table className="record-table">
            <thead><tr><th>Company</th><th>Status</th><th>Owner</th><th>Updated</th></tr></thead>
            <tbody>
              <tr data-selected="true"><td>Northstar</td><td>Blocked</td><td>Maya</td><td>4m ago</td></tr>
              <tr><td>Acme</td><td>Syncing</td><td>Jules</td><td>12m ago</td></tr>
              <tr data-state="error"><td>Helio</td><td>Failed</td><td>Sam</td><td>1h ago</td></tr>
            </tbody>
          </table>
          <aside className="inspector" aria-label="Selected record details">
            <h3>Northstar</h3>
            <dl><dt>Reason</dt><dd>Missing DPA approval</dd><dt>Next action</dt><dd>Request legal review</dd></dl>
          </aside>
        </div>
      </main>
    </section>
  );
}
```

```css
.workstation {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 680px;
  border: 1px solid var(--line);
  border-radius: var(--radius-frame, 10px);
  overflow: hidden;
  background: var(--surface);
  color: var(--text);
}
.work-rail { padding: 10px; border-right: 1px solid var(--line); background: var(--surface-muted, #f9f9f9); }
.work-rail button { width: 100%; min-height: 36px; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-muted); text-align: left; padding: 0 10px; }
.work-rail button[data-active="true"] { background: var(--surface); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); }
.work-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; gap: 8px; align-items: center; min-height: 56px; padding: 8px; border-bottom: 1px solid var(--line); }
.work-search { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 8px; align-items: center; min-height: 38px; padding: 0 12px; border: 1px solid var(--line); border-radius: var(--radius-control); }
.work-search span { color: var(--text-muted); font-size: 12px; }
.work-search input { min-width: 0; border: 0; outline: 0; background: transparent; font: inherit; }
.work-toolbar button { min-height: 38px; border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); color: var(--text); padding: 0 12px; }
.work-toolbar .primary { background: var(--action); color: var(--action-text, #fff); border-color: var(--action); }
.work-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; min-height: 620px; }
.record-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.record-table th, .record-table td { height: 44px; padding: 0 12px; border-bottom: 1px solid var(--line); text-align: left; }
.record-table tr[data-selected="true"] { background: color-mix(in srgb, var(--focus, var(--action)), transparent 90%); box-shadow: inset 3px 0 0 var(--focus, var(--action)); }
.record-table tr[data-state="error"] td:nth-child(2) { color: #b42318; }
.inspector { border-left: 1px solid var(--line); padding: 16px; background: var(--surface); }
@media (max-width: 900px) {
  .workstation { grid-template-columns: 1fr; }
  .work-rail { display: flex; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--line); }
  .work-rail button { min-width: max-content; }
  .work-toolbar { grid-template-columns: 1fr 1fr; }
  .work-search { grid-column: 1 / -1; }
  .work-grid { grid-template-columns: 1fr; }
  .inspector { border-left: 0; border-top: 1px solid var(--line); }
}
```

### Command Palette

- Opens from keyboard shortcut and toolbar button.
- Contains search input, grouped commands, recent records, and destructive actions separated.
- States: open, searching, no results, loading, command failed, command completed.
- Motion: 180ms opacity/translateY; focus trapped; Escape closes; reduced motion disables transform.

### Filter Builder

- Use chips for field/operator/value: `status is blocked`, `owner is Maya`, `updated before 7d`.
- Include add condition, clear all, save view, and invalid condition states.
- Keyboard: arrow through chips, Backspace removes focused chip.
- Mobile: filter drawer with apply/reset footer.

### Log Stream

- Rows include timestamp, level, service, message, trace ID.
- Levels: info, warn, error, debug. Color is secondary to label text.
- Auto-scroll can be paused; show "Live paused" state.
- Error rows expand inline with stack/recovery link.

### Inspector Panel

- Sections: Summary, Properties, Activity, Permissions, History.
- Sticky action footer for save/cancel/approve.
- Dirty state: show changed fields and a reset action.
- Read-only state: explain permission reason.

### AI Trace Panel

- Show prompt, context files, tool calls, model, latency, output, eval status.
- States: queued, running, tool_waiting, blocked, completed, failed.
- A running step may pulse a small indicator; all content must remain readable.

## State Language

```tsx
const technicalUIState = {
  idle: "bg-[var(--surface)] text-[var(--text)] border-[var(--line)]",
  hover: "hover:bg-[var(--surface-muted)] hover:border-[color-mix(in_srgb,var(--line),var(--text)_16%)]",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--action))] focus-visible:ring-offset-2",
  selected: "data-[selected=true]:bg-[color-mix(in_srgb,var(--focus,var(--action)),transparent_90%)] data-[selected=true]:shadow-[inset_3px_0_0_var(--focus,var(--action))]",
  syncing: "data-[state=syncing]:text-[var(--text)]",
  stale: "data-[state=stale]:bg-[#fff7ed] data-[state=stale]:text-[#9a3412]",
  error: "data-[state=error]:bg-[#fff4f2] data-[state=error]:text-[#912018]",
  success: "data-[state=success]:bg-[#ecfdf3] data-[state=success]:text-[#05603a]",
  disabled: "disabled:cursor-not-allowed disabled:text-[var(--text-faint)] disabled:bg-[var(--surface-muted)]"
};
```

State rules:

- Use text labels for all states. Color alone is not enough.
- Include stale/syncing in data-heavy surfaces; these are common technical states.
- Error states need recovery: retry, open log, re-authenticate, rollback, contact admin.
- Success should name the completed action: "Deploy verified", "Import complete", "Eval passed."

## Motion System

- Technical UI motion stays functional: 120-220ms for hover/focus/background/ring, 180-280ms for drawer or panel translate, with no elastic motion. Use instant table row selection where latency would harm repeated operation; disable all nonessential transforms under `prefers-reduced-motion`.

## Complete Page Protocols

```tsx
// Workstation Console
<main data-skill="technical-ui" data-archetype="workstation-console">
  <WorkstationShellContract state="selected" />
  <FilterBuilderContract clauses={["status:running", "owner:me"]} />
  <LogStreamContract events={runtimeEvents} />
  <InspectorPanelContract record={selectedRecord} />
</main>

// AI Control Surface
<main data-skill="technical-ui" data-archetype="ai-control-surface">
  <CommandPaletteContract query="summarize incident" />
  <AITracePanelContract steps={traceSteps} />
  <TechnicalUIStatusPill role="warning">Needs review</TechnicalUIStatusPill>
</main>
```
```tsx
// Workstation Console
<main data-skill="technical-ui" data-archetype="workstation-console">
  <WorkstationShellContract state="selected" />
  <FilterBuilderContract clauses={["status:running", "owner:me"]} />
  <LogStreamContract events={runtimeEvents} />
  <InspectorPanelContract record={selectedRecord} />
</main>

// AI Control Surface
<main data-skill="technical-ui" data-archetype="ai-control-surface">
  <CommandPaletteContract query="summarize incident" />
  <AITracePanelContract steps={traceSteps} />
  <TechnicalUIStatusPill role="warning">Needs review</TechnicalUIStatusPill>
</main>
```
| Pattern | Use | Timing | Behavior |
| --- | --- | --- | --- |
| Tab transition | Inspector tabs, prompt/context/output tabs. | 140-220ms | Crossfade + x 6px, stable height. |
| Row flash | Record update, import, deploy, eval result. | 450-700ms | Pale state fill fades to surface; chip text changes immediately. |
| Focus pulse | Command input, active search, selected critical field. | 500ms | Ring alpha pulse only. |
| Command palette | Keyboard command UI. | 180ms open, 120ms close | Opacity + translateY; focus trap. |
| Table update | Live data or filtered result change. | 200-320ms | Cell crossfade, row left-edge accent, no row height shift. |
| Panel open | Inspector/detail/filter drawer. | 200-260ms | Transform overlay or preallocated panel; no main layout jump. |

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion],
  .workstation *,
  .record-table tr,
  .inspector {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    scroll-behavior: auto !important;
  }
}
```


## Absolute Bans

- No fake complexity with meaningless metrics.
- No hiding primary workflow behind decorative panels.
- No low-contrast microcopy in dense areas.
- No generic success/error styling without workflow-specific labels.
- No hover lift as the main state. Dense UIs need stable layout.
- No tables without headers, row states, empty/loading/error states, and mobile plan.
- No AI interface without context, running, blocked, failed, and output states.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Production Patterns

### Table Density Presets

- Compact: 36-40px rows, 12-13px type, dense admin or logs.
- Standard: 44-52px rows, 13-14px type, most workstations.
- Comfortable: 56-64px rows, 14-15px type, client-facing or mixed landing/app.

### Inspector Anatomy

- Header: object name, status, owner, action menu.
- Summary: 3-5 facts.
- Properties: editable fields with dirty/read-only state.
- Activity: timestamped events.
- Footer: Save/Cancel or primary workflow action.

### Copy Rules

Use operational nouns: record, run, eval, trace, owner, queue, retry, sync, stale, paused, blocked, incident, import, export, permission, policy. Avoid vague labels like "Insights" when "Failed imports" or "Eval traces" is more useful.

### Toolbar Rules

- Toolbars should start with search or command when retrieval is primary, then filters, then bulk actions, then creation/export.
- Keep destructive actions behind a menu or confirmation unless they are the screen's main workflow.
- Show selected count when rows/cards can be selected: "3 selected" plus clear selection.
- Save named views when filters are complex; include unsaved-view state.
- Toolbar wrapping on mobile must not hide the primary action; use a drawer for secondary filters.

### Alert Timeline Rules

- Alert rows include severity, source, timestamp, owner, state, and next action.
- Acknowledged, muted, assigned, resolved, and reopened are distinct states.
- Severity color must pair with text and icon. Do not rely on red/yellow/green alone.
- Inline recovery should be close to the alert: open runbook, retry job, assign owner, mute rule.

### AI Control Rules

- Prompt input includes context attachments, model/mode selector, run button, and token/cost/latency if relevant.
- Tool calls show waiting/running/succeeded/failed with readable arguments or summaries.
- Output can stream, but final content must be accessible as static text.
- Blocked states explain the missing permission, file, credential, or approval.

### Keyboard Rules

- `/` or Ctrl/Cmd+K opens command palette when the app has many actions.
- Arrow keys move through table rows only when focus is inside the table region.
- Escape closes drawers/palettes before clearing selection.
- Enter activates the focused row or primary command; destructive Enter requires confirmation context first.

## Pre-Output Checklist

- First viewport contains a real workstation shell or table state.
- One Technical UI archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to state/workflow transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
