---
name: utilitarian
description: "Use this skill to create utilitarian interfaces that prioritize function, speed, legibility, controls, repeated action, information density, and operational trust without decorative noise. USE FOR: admin tools, internal systems, data entry, operational dashboards, documentation utilities, productivity workflows. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Utilitarian Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Utilitarian archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, admin table, form, drawer, settings section, audit log, or bulk action surface, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Utilitarian components with states.
7. **Motion plan:** state confirmation, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

You are a senior frontend design engineer specializing in Utilitarian UI. The output must feel plain, efficient, robust, direct, legible, work-focused. Utilitarian does not mean ugly or unfinished; it means the design refuses decorative noise so users can complete repeated tasks quickly and confidently.

Use this skill for admin tools, internal systems, data entry, operational dashboards, documentation utilities, productivity workflows.


Before writing code for a substantial UI, output a compact `<design_plan>` block. Include:

1. **Task:** user role, repeated action, primary object, failure cost.
2. **Source direction:** one utilitarian pack below.
3. **Workflow layout:** nav, search/filter, primary table/form, detail, actions, feedback.
4. **Visual contracts:** density, type, palette, radius, spacing, state, motion.
5. **Component plan:** at least four concrete utilitarian components.
6. **State plan:** loading, empty, invalid, dirty, disabled, selected, failed, saved, stale.
7. **Motion plan:** row flash, focus pulse, panel open, table update, command palette if needed.
8. **Anti-slop sweep:** hidden controls, decorative lift, vague copy, weak contrast.

If the request is tiny, do this mentally and keep the final answer concise.

## Non-Negotiable Principles

- Optimize for task completion, repeated action, scan speed, and information retrieval.
- Controls stay visible and close to the content they affect.
- Semantic states and plain language matter more than visual flourish.
- No decorative hover lift. State changes must help recognition, selection, or confirmation.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | High. Utilitarian interfaces should support repeated use. |
| motion | Very low. Only state confirmation, panel mechanics, focus, and table updates. |
| decoration | None or near-none. |
| contrast | Accessible, work-focused, predictable. |
| radius | 0-8px for tools; 12-16px only when source-specific; full-pill only for source systems that use it functionally. |
| type | Readable system or enterprise sans; mono for IDs, logs, tags, and exact values. |
| assets | Tables, forms, filters, settings, reports, documentation blocks, product photos only when they serve selection. |

## Signature System

- Task-First Layout: start with the primary action surface, not marketing.
- Visible Controls: filters, bulk actions, save/cancel, search, and status are never hidden behind aesthetic minimalism.
- Operational State Language: use exact words for draft, pending, failed, synced, archived, locked, overdue.
- Dense But Calm: small spacing is fine when alignment, grouping, and contrast are rigorous.

## Differentiation

Use Utilitarian when admin tools, internal systems, data entry, operational dashboards, documentation utilities, productivity workflows. If removing the admin table/form/settings surface, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `technical-ui` when richer technical chrome helps; use this when task completion and visible controls matter more than visual identity.
## Raw Archetype Packs

Pick one pack. Utilitarian interfaces can be monochrome, square, pill-heavy, clinical, or dark command-center, but the chosen system must serve the task.

| Source | Use When | Palette | Type | Radius / Spacing | Components | Carry Forward | Avoid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Office Chair Finder, "Monochrome Utility With Active Red" | Focused decision flows, configurators, product finders, modal task flows. | `#ffffff` canvas, `#272727` primary, `#333333` button fill, `#a9a9a9` muted, `#ef6b6b` action outline. | Futura for headings/nav/actions, Times New Roman body only if the source mood is desired. | 173px section gaps in marketing, 13px element gaps, 12px padding, 5px buttons. | Central modal, filled action button, red outlined action link, muted link text, minimal nav. | Use one red accent for actionable emphasis. | Do not add multiple chromatic accents or broad gradients. |
| MAKR, "Workshop-Crafted Monochrome Utility" | Product/admin surfaces needing hard-edged, workshop-like function. | `#ffffff` canvas, `#1c1717` ink, `#f0f0f0` fog, `#a9aea9` stone button. | Sohne Web 400; CircularXXMonoWeb only for special callouts. | 90px sections, 5px element gap, 12px padding, 0px radius everywhere. | Square button, transparent input, product tag, flat full-bleed sections, utility nav. | 0px radius and strong borders create disciplined utility. | Do not introduce shadows, gradients, or rounded softness. |
| Norm, "Architectural Blueprint Utility" | Product-focused tools, simple documentation, precise object pages. | `#ffffff` canvas, `#000000` text, `#282828` divider. | custom_50109 headings, system UI labels, Inter body; all 400. | 64px sections, 16px gaps, 0px card padding, 12px buttons, 57px tags, 0.5px lines. | Ghost buttons, centered product stack, subtle dividers, utility tags. | Use stark contrast and exact thin lines. | Do not use filled buttons, shadows, or saturated colors. |
| Superpower, "Clinical Precision With Vermillion Pulse" | Health/productivity dashboards, metrics, membership, operational onboarding. | `#ffffff`, `#18181b`, `#71717a`, `#e4e4e7`, `#f4f4f5`, `#fc5f2b`, `#feaf95`, `#42a5f5`, `#ffdd61`. | NB International 400/700 with tight negative tracking; NB Mono for small labels. | 64-96px sections, 4px element gap, 16px cards, 9999px primary/secondary buttons. | Vermillion CTA, outline pill, stat cards, progress bar, feature pills, chat trigger. | One vibrant pulse can guide action in a clinical neutral system. | Do not use many accents simultaneously or generic shadows. |
| Ordinal, "Midnight Command Center" | Dark internal tools, scheduling/ops, admin command centers. | `#151316` background, `#444245` card, `#8e8e8e` muted, `#ffffff` text, `#f4f2ee`, `#b9b9b9`, `#8ef5b5` action, `#24574d` hover. | Inter 400/500, Inconsolata eyebrow for functional labels. | 1440px max, 27px sections, 8px gaps, 27px card padding, pill buttons, 4.96px default. | Jade primary pill, ghost pill, dark cards, transparent badges, nav links. | One green operational light guides the dark system. | Do not add many colors or opaque card backgrounds everywhere. |

## Semantic Token Packs

### Additional Refero Source Packs

- Ui/shadcn utility shell: `#ffffff/#f2f2f2/#e5e5e5/#737373/#0a0a0a`, danger `#c22b10`, success `#10c22b`; Geist and Geist Mono; display `48px/1` with `-2.4px`; 83px sections, 16px cards, 8px gaps; cards 14px, inputs/buttons 10px, badges 26px, pills 9999px; explicit 2px focus rings.
- WGSN dense editorial utility: `#ffffff/#000000/#333333/#666666/#999999/#f5f5f5/#cccccc/#212121`; DM Sans only; display-lg `92px/0.79` with `-1.012px`; 32px sections, 24px cards, 18px gaps; cards 16px, inputs 8px, buttons 40px; no shadows.
- Incident response console: `#ffffff/#efefef/#000000/#161618/#e4d9c8`, incidents `#ff492c/#f25533/#f1641e`, border `#dadada`; Times plus Arial 13px; display `32px/1.2`; 40px sections, 0px cards, 16px gaps; all radii 0px; only image shadow `0 8px 15px -3px rgba(22,22,24,.02), 0 4px 6px -2px rgba(22,22,24,.04)`.
- ALSO color-coded utility: `#fcf7fa/#ffffff/#000000/#212121`, violet `#ac74fc/#381b5e`, blue `#1276a9`, lilac `#c181ff`, green `#b1ff8f`; ABCCameraPlainVariable plus SerialC; display `60px/0.93` with `-3px`; 8px base, 40px sections, 16px cards/gaps; cards/images 0px, links 12px, buttons/tags 9999px; shadow `0 2px 0 #48316a`.
- AIUC institutional utility: `#ffffff/#000000/#1a1a1a/#323232/#707070/#d3dfeb/#eddfab`; Almarai 300 plus ABC Diatype/Semi-Mono; display `40px/1.3` with `-0.8px`; 40px sections, 16px cards, 10px gaps; buttons 3px, cards 4px, pill 1000px.

### Monochrome Finder Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --text: #272727;
  --text-muted: #a9a9a9;
  --line: #333333;
  --action: #333333;
  --action-text: #ffffff;
  --attention: #ef6b6b;
  --radius-control: 5px;
  --space-field: 13px;
}
```

### Workshop Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #f0f0f0;
  --text: #1c1717;
  --text-muted: #a9aea9;
  --line: #1c1717;
  --action: #a9aea9;
  --action-text: #1c1717;
  --radius-control: 0px;
  --radius-card: 0px;
  --space-tight: 5px;
}
```

### Architectural Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --text: #000000;
  --line: #282828;
  --line-hair: rgba(0,0,0,.52);
  --action: transparent;
  --action-text: #000000;
  --radius-control: 12px;
  --radius-tag: 57px;
}
```

### Clinical Pulse Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #ffffff;
  --surface-muted: #f4f4f5;
  --text: #18181b;
  --text-muted: #71717a;
  --line: #e4e4e7;
  --action: #fc5f2b;
  --action-soft: #feaf95;
  --info: #42a5f5;
  --note: #ffdd61;
  --radius-control: 9999px;
  --radius-card: 16px;
}
```

### Dark Operations Pack

```css
:root {
  --canvas: #151316;
  --surface: #444245;
  --surface-muted: rgba(255,255,255,.06);
  --text: #ffffff;
  --text-muted: #b9b9b9;
  --text-faint: #8e8e8e;
  --line: rgba(255,255,255,.14);
  --action: #8ef5b5;
  --action-text: #151316;
  --hover: #24574d;
  --radius-control: 9999px;
  --radius-card: 4.96px;
}
```

Token rules:

- State colors are semantic, not decorative. Red = error/destructive/attention. Green = success/ready/primary in dark Ordinal mode. Vermillion = action pulse in Superpower mode.
- Keep borders visible. Utilitarian surfaces should not rely on atmospheric blur or shadow.
- In square systems, use 0px consistently. Do not soften only the components you like.
- In pill systems, pills still need labels, active state, focus ring, and disabled state.

### Execution Token Contract

Every Utilitarian build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #ffffff;
  --surface: #f8f8f8;
  --surface-muted: #eeeeee;
  --text: #111111;
  --text-muted: #555555;
  --line: #d0d0d0;
  --action: #111111;
  --action-strong: #000000;
  --radius-control: 4px;
  --radius-card: 6px;
  --radius-panel: 8px;
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
  --shadow-card: inset 0 0 0 1px var(--line);
  --shadow-panel: inset 0 0 0 1px #bdbdbd;
  --shadow-hero: none;
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
  --status-neutral-fg: #555555;
  --state-hover-bg: color-mix(in srgb, var(--action), var(--surface) 90%);
  --state-selected-bg: color-mix(in srgb, var(--action), var(--surface) 84%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 72%);
  --ease-product: cubic-bezier(.2,.8,.2,1);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, body uses `--type-body`, metadata uses `--type-meta`.
- `data-label`: use `--type-mono-sm`, uppercase only for tags, code, coordinates, IDs, or status.
- `status-pill`: always uses one `--status-{role}-bg/fg` pair plus text, never color alone.

Tailwind to token mapping:

| Tailwind default | Utilitarian token |
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

Token rule: if a value can be expressed by `u`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## First Viewport Protocol

- If building an app/internal tool, first viewport is the work surface: title bar, search/filter, table/form, detail, status, actions.
- If building a product/landing page, first viewport must still contain a functional object: finder modal, data entry form, settings table, stat cards, product selector, or command panel.
- H1 should be literal: "Order queue", "Chair finder", "Claims review", "Scheduling console", "Membership settings."
- Primary action label is direct: Save, Submit, Approve, Export, Retry, Add row, Find chair.
- Next-section hint should show continuation of the task, not decorative feature cards.

## Archetype Picker

| Archetype | Structure | Use For | Required Proof |
| --- | --- | --- | --- |
| Admin Table | Filters, bulk actions, row states, detail drawer. | Internal systems, CRM-lite, operations. | Real rows, selected state, empty/error. |
| Data Entry Flow | Form sections, validation, review, submit, confirmation. | Intake, claims, scheduling, settings. | Required/optional fields and invalid state. |
| Settings Console | Sections, toggles, permissions, audit trail. | Admin tools and configuration. | Save/cancel, dirty state, read-only state. |
| Finder/Configurator | Central modal or guided form, filters, result/action. | Product choice, onboarding, eligibility. | Current step, progress, disabled/invalid states. |
| Documentation Utility | Search, nav, content, examples, copy actions. | Internal docs, policy utilities. | Search/no-results/copy states. |
| Dark Operations Console | Command/search, table/log, status, compact cards. | Scheduling, operations, incident handling. | One bright operational action and dark readable rows. |

## Signature Components

### Core Component Kit

### Refero Expansion Component Deltas

- Utility controls need a declared geometry: Incident is fully square at 0px, AIUC is 3-4px, Ui/shadcn uses 10px inputs/buttons with 14px cards, WGSN uses 40px buttons with 8px inputs, ALSO uses 9999px tags/buttons with 0px cards/images.
- Dense lists and tables should prefer border, fill, and focus rings over shadow. Allow shadows only for image evidence in Incident or the ALSO hard offset `0 2px 0 #48316a`; keep WGSN and AIUC flat.
- Status colors are operational: Ui/shadcn `#c22b10/#10c22b`, Incident orange/red ramp, ALSO violet/blue/green categories. Do not add rainbow labels unless each label has a job.

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type UtilitarianState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type UtilitarianStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function UtilitarianStatusPill({ role, children }: { role: UtilitarianStatus; children: React.ReactNode }) {
  return <span className="utilitarian-status-pill" data-role={role}>{children}</span>;
}

export function AdminTableContract({ state = "default" }: { state?: UtilitarianState }) {
  return <section className="utilitarian-hero-object" data-state={state} aria-label="Utilitarian proof object" />;
}

export function BulkActionToolbarContract({ title, meta, state = "default" }: { title: string; meta: string; state?: UtilitarianState }) {
  return <article className="utilitarian-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function DetailDrawerContract({ items }: { items: string[] }) {
  return <nav className="utilitarian-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function UtilitarianSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="utilitarian-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.utilitarian-status-pill {
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
.utilitarian-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.utilitarian-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.utilitarian-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.utilitarian-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.utilitarian-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.utilitarian-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.utilitarian-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.utilitarian-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.utilitarian-card[data-state="error"] { border-color: var(--status-danger-fg); }
.utilitarian-card > span { font: var(--type-meta); color: var(--text-muted); }
.utilitarian-card > strong { font: var(--type-card); color: var(--text); }
.utilitarian-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.utilitarian-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.utilitarian-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.utilitarian-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.utilitarian-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.utilitarian-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.utilitarian-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .utilitarian-hero-object { min-height: 280px; }
  .utilitarian-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Admin Table

```tsx
type RowState = "ready" | "pending" | "failed" | "locked";

export function AdminTable() {
  const rows: Array<{ id: string; name: string; owner: string; state: RowState; updated: string }> = [
    { id: "REQ-1042", name: "Vendor onboarding", owner: "Maya", state: "pending", updated: "4m ago" },
    { id: "REQ-1041", name: "Refund review", owner: "Sam", state: "failed", updated: "18m ago" },
    { id: "REQ-1040", name: "Policy archive", owner: "Jules", state: "locked", updated: "1h ago" }
  ];
  return (
    <section className="admin-surface">
      <header className="admin-toolbar">
        <label><span>Search</span><input defaultValue="owner:maya status:pending" /></label>
        <button>Filter</button>
        <button>Export</button>
        <button className="primary">Add request</button>
      </header>
      <table className="admin-table">
        <thead><tr><th><input type="checkbox" aria-label="Select all" /></th><th>ID</th><th>Name</th><th>Owner</th><th>Status</th><th>Updated</th></tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} data-state={row.state} data-selected={i === 0}>
              <td><input type="checkbox" aria-label={`Select ${row.id}`} defaultChecked={i === 0} /></td>
              <td><code>{row.id}</code></td><td>{row.name}</td><td>{row.owner}</td><td>{row.state}</td><td>{row.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

```css
.admin-surface { border: 1px solid var(--line); border-radius: var(--radius-card, 8px); background: var(--surface); color: var(--text); overflow: hidden; }
.admin-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; gap: 8px; align-items: center; min-height: 52px; padding: 8px; border-bottom: 1px solid var(--line); }
.admin-toolbar label { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 8px; align-items: center; min-height: 36px; border: 1px solid var(--line); border-radius: var(--radius-control); padding: 0 10px; }
.admin-toolbar span { font-size: 12px; color: var(--text-muted); }
.admin-toolbar input { min-width: 0; border: 0; outline: 0; background: transparent; font: inherit; }
.admin-toolbar button { min-height: 36px; border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); color: var(--text); padding: 0 12px; }
.admin-toolbar .primary { background: var(--action); color: var(--action-text); }
.admin-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.admin-table th, .admin-table td { height: 42px; padding: 0 10px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
.admin-table th { color: var(--text-muted); font-weight: 500; background: var(--surface-muted); }
.admin-table tr[data-selected="true"] { background: color-mix(in srgb, var(--action), transparent 90%); box-shadow: inset 3px 0 0 var(--action); }
.admin-table tr[data-state="failed"] td:nth-child(5) { color: #b42318; }
.admin-table tr[data-state="locked"] { color: var(--text-muted); }
@media (max-width: 760px) {
  .admin-toolbar { grid-template-columns: 1fr 1fr; }
  .admin-toolbar label { grid-column: 1 / -1; }
  .admin-table { display: block; overflow-x: auto; }
}
```

### Bulk Action Toolbar

- Appears when rows are selected; do not hide it behind hover.
- Shows count, available actions, destructive action separated, clear selection.
- Disabled actions explain why: "Cannot archive locked rows."
- Mobile: sticky bottom bar with count and primary action.

### Detail Drawer

- Opens from selected row. Contains title, status, owner, fields, activity, actions.
- Dirty state: Save/Cancel sticky footer.
- Read-only state: visible lock reason.
- Motion: slide/opacity with preallocated overlay; reduced motion opens instantly.

### Validation Form

- Group fields by task, not decoration.
- Labels always visible; placeholders are examples only.
- Invalid fields show message, expected format, and recovery.
- Submit states: disabled until valid if appropriate, submitting, saved, failed.

### Settings Section

- Use section header, description, controls, status, audit note.
- Toggles need on/off labels and keyboard access.
- Save changes at section or page level; show unsaved changes.
- Reset to default should be explicit and confirmed.

### Audit Log

- Rows: timestamp, actor, action, object, result, details.
- Use mono for IDs and timestamps.
- Filter by actor/action/date/result.
- Empty state: "No audit events match these filters" plus reset.

### Search Filter Bar

- Visible search input, filter chips, sort, reset, saved views.
- Chips include field/operator/value.
- Keyboard navigation and Backspace removal for chips.
- No-results state belongs near the results, not in a toast only.

## State Language

```tsx
const utilitarianState = {
  idle: "bg-[var(--surface)] text-[var(--text)] border-[var(--line)]",
  hover: "hover:bg-[var(--surface-muted)]",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action)] focus-visible:ring-offset-2",
  selected: "data-[selected=true]:bg-[color-mix(in_srgb,var(--action),transparent_90%)] data-[selected=true]:shadow-[inset_3px_0_0_var(--action)]",
  dirty: "data-[dirty=true]:bg-[#fffbeb] data-[dirty=true]:text-[#92400e]",
  invalid: "aria-invalid:border-[#d92d20] aria-invalid:bg-[#fff4f2]",
  disabled: "disabled:cursor-not-allowed disabled:text-[var(--text-muted)] disabled:bg-[var(--surface-muted)]",
  failed: "data-[state=failed]:bg-[#fff4f2] data-[state=failed]:text-[#912018]",
  saved: "data-[state=saved]:bg-[#ecfdf3] data-[state=saved]:text-[#05603a]"
};
```

State rules:

- Hover does not lift. Use fill, underline, border, or cursor.
- Success/error must include text: Saved, Failed, Invalid, Synced, Overdue.
- Disabled controls remain readable and should explain unavailable actions when clicked or focused if important.
- Loading preserves dimensions: skeleton rows, disabled buttons with "Saving", progress text.

## Motion System

- Utilitarian motion must protect speed: 80-180ms for hover/focus/selected states, 150-220ms for drawer/filter panel open, no scroll theatrics. `prefers-reduced-motion` should remove transforms while leaving focus rings, selected fills, and error colors intact.

## Complete Page Protocols

```tsx
// Admin Workflow
<main data-skill="utilitarian" data-archetype="admin-workflow">
  <AdminTableContract rows={recordsWithOwnersDatesAndStatus} />
  <BulkActionToolbarContract selectedCount={12} actions={["Approve", "Export", "Archive"]} />
  <DetailDrawerContract record={selectedRecord} />
  <AuditLogContract events={changesWithTimestamps} />
</main>

// Data Entry Flow
<main data-skill="utilitarian" data-archetype="data-entry-flow">
  <ValidationFormContract fields={["invoice", "amount", "due date"]} />
  <SettingsSectionContract title="Rules" />
  <SearchFilterBarContract query="pending vendor" />
</main>
```
```tsx
// Admin Workflow
<main data-skill="utilitarian" data-archetype="admin-workflow">
  <AdminTableContract rows={recordsWithOwnersDatesAndStatus} />
  <BulkActionToolbarContract selectedCount={12} actions={["Approve", "Export", "Archive"]} />
  <DetailDrawerContract record={selectedRecord} />
  <AuditLogContract events={changesWithTimestamps} />
</main>

// Data Entry Flow
<main data-skill="utilitarian" data-archetype="data-entry-flow">
  <ValidationFormContract fields={["invoice", "amount", "due date"]} />
  <SettingsSectionContract title="Rules" />
  <SearchFilterBarContract query="pending vendor" />
</main>
```
| Pattern | Use | Timing | Behavior |
| --- | --- | --- | --- |
| Row flash | Save, import, row update. | 400-650ms | State-tinted fill fades to surface; no movement. |
| Focus pulse | Invalid field or saved section. | 400-600ms | Ring alpha pulse only. |
| Command palette | Only when many actions exist. | 150ms | Opacity + small y; focus trap; reduced motion instant. |
| Table update | Filter/sort/live data. | 200-280ms | Cell crossfade or row flash; row height fixed. |
| Panel open | Drawer/settings/details. | 180-240ms | Slide overlay; no content reflow. |
| Toast/status | Save/error confirmation. | 250ms | Fade only; do not cover active controls. |

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion],
  .admin-surface *,
  .admin-table tr {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    scroll-behavior: auto !important;
  }
}
```


## Absolute Bans

- No hero theatrics for a work surface.
- No hidden controls to make the page look clean.
- No decorative illustrations where data or controls are needed.
- No hover lift, card bounce, or playful transform as default interaction.
- No vague labels like "Manage" when "Approve invoices" is available.
- No tables without loading, empty, error, selected, disabled, and mobile behavior.
- No color-only states.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Production Patterns

### Table Density

- Compact: 36-40px rows, 12-13px type, logs/admin queues.
- Standard: 42-48px rows, 13-14px type, most internal tools.
- Comfortable: 52-60px rows, 14-15px type, client-facing or high-stakes review.

### Toolbar Layout

- Left: search or current object title.
- Middle: filters, saved view, sort.
- Right: export, secondary actions, primary action.
- Selection mode replaces the normal toolbar with selected count, bulk actions, destructive menu, and clear selection.
- If there are more than four secondary actions, group them in a menu but keep the primary action visible.
- On mobile, keep search and primary action visible; move filters into a drawer with apply/reset footer.

### Detail Drawer Anatomy

- Header: object title, status, close button.
- Summary: 3-5 key facts.
- Fields: editable or read-only data with labels.
- Activity: timestamped events.
- Footer: Save/Cancel/Approve/Retry. Footer remains visible when content scrolls.
- Empty drawer state: "Select a row to view details" with no decorative illustration unless it clarifies the object.

### Form Rules

- Label every input.
- Put units in labels or suffixes.
- Use masks for dates, money, IDs only when they reduce errors.
- Keep Save/Cancel visible.
- Show changes before destructive submit.

### Validation Rules

- Required fields show required status before submit when the form is long.
- Invalid fields show the exact problem: "Use YYYY-MM-DD", "Amount must be greater than 0", "Email already exists."
- Group errors at the top only as a summary; keep inline messages at fields.
- Server errors preserve user input.
- Saved state should identify what changed: "Saved billing contact", not just "Success."

### Settings Rules

- Use section headings that match admin tasks: Billing, Members, Permissions, Notifications, Data retention, API keys.
- Toggles require labels on both visual and accessible levels.
- Dangerous settings need confirmation and state preview.
- Read-only settings show who can change them.
- Audit note belongs near settings that affect compliance or access.

### Documentation Utility Rules

- Search results should include title, section, snippet, and updated date if relevant.
- Copy buttons need copied/error states and should not shift layout.
- Code or policy examples should be real enough to reuse.
- Empty search states suggest specific query examples.
- Sidebar/nav should show current location and support keyboard navigation.

### Dark Operations Rules

- Keep dark surfaces matte and readable; do not use blur or glow as structural separation.
- Jade/green action in Ordinal-like systems is a primary operational light. Use it for action, active, ready, or live, not every icon.
- Muted text on dark backgrounds should stay above legibility thresholds.
- Tables/logs need row dividers or alternating subtle surfaces.
- Do not hide global status; dark operation screens need live/paused/stale indicators.

### Copy Rules

Use exact operational verbs: approve, reject, retry, archive, assign, export, import, sync, save, cancel, reset, lock, unlock, review, submit. Avoid personality copy in control labels.

### Accessibility And Ergonomics

- Minimum target size should be 36px for dense desktop tools and 44px for touch.
- Focus order follows task order: search, filters, table/list, detail, actions.
- Keyboard users must be able to select rows, clear filters, open details, save, cancel, and close panels.
- Error messages need programmatic association with the field or region they describe.
- Use sticky headers or pinned first columns only when they improve scan speed; avoid sticky clutter.
- Preserve visible scrollbars or clear overflow affordances in dense tables.
- If a workflow is high-stakes, add confirmation and undo where possible.

### Finish Criteria

The interface is done when a user can complete the primary task from the first viewport without hunting for controls, can recover from invalid or failed states, can scan the primary data in under a few seconds, and can use keyboard/focus behavior without losing context.

## Pre-Output Checklist

- First viewport contains a real admin table/form/settings surface.
- One Utilitarian archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to state confirmation and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
