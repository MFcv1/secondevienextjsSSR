---
name: clean-saas
description: "Use this skill to create clean SaaS interfaces and websites with calm hierarchy, trustworthy product evidence, precise workflows, legible data, polished enterprise surfaces, and restrained modern visual identity. USE FOR: clean SaaS landing pages, B2B product pages, dashboards, onboarding, pricing, integrations, enterprise trust surfaces. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Clean SaaS Skill

## Core Directive

You are a senior frontend design engineer specializing in Clean SaaS. The output must feel calm, precise, trustworthy, product-led, modern, operational. Do not merely skin default components with a color palette. Build a visual operating system: layout, typography, color roles, component geometry, imagery, motion, interaction states, responsive behavior, and proof content must all point in the same direction.

Use this skill for clean SaaS landing pages, B2B product pages, dashboards, onboarding, pricing, integrations, enterprise trust surfaces.


## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** product type, audience, primary action, and emotional target.
2. **Style direction:** one Clean SaaS archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, proof object, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, shadow, status, and interaction tokens.
6. **Component plan:** at least four concrete components with states.
7. **Motion plan:** what moves, why it moves, timing, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.

## Non-Negotiable Principles

- Product evidence appears in the first viewport: dashboard frame, workflow preview, data table, integration map, or command surface.
- The interface is calm but never empty; every section proves a workflow, decision, metric, automation, or trust claim.
- Use one action accent, one neutral surface system, and one data/proof rhythm across the whole page.


## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium-high. SaaS must show real product complexity without becoming noisy. |
| motion | Low-medium. Use reveal, focus, tab changes, command activation, and product walkthrough motion. |
| decoration | Low. Decorative marks must double as product evidence or navigation aids. |
| contrast | Soft neutral contrast with one crisp action accent. |
| radius | 8px for controls, 12-16px for panels, 999px for pills only. |
| type | Geist, Satoshi, Avenir-style sans; mono only for data labels and command fragments. |
| assets | Screenshots, workflow diagrams, app frames, integration icons, metric strips. |

These controls are binding. If the user's brand or existing codebase conflicts with a setting, preserve the user's constraints but keep the underlying Clean SaaS behavior.


## Signature System

Use these as executable rules, not inspiration labels:

- SaaS Evidence Stack: hero claim + inspectable UI frame + metric strip + workflow proof before any abstract feature copy.
- Trust Rail: compliance, customer logos, uptime, security, and team controls shown as compact utilities, not marketing badges.
- Command Surface: a search/input/control bar can become the hero object when the product is workflow-heavy.
- Integration Constellation: logos connect to a central product frame through thin rules, not floating sticker clutter.

### Raw Archetype Packs

Use the raw sources as named production archetypes. Pick one pack as the spine, then borrow at most one secondary move from another pack. Clean SaaS becomes muddy when AutoSend's crisp white canvas, Fresha's marketplace search, Workable's colored HR cards, GlossGenius's ledger, and Slack's workbench purple all appear at once.

| Source | Use When | Palette | Type | Radius / Spacing | Components | Carry Forward | Avoid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AutoSend, "Crisp White Canvas" | B2B tools needing quiet polish and immediate dashboard proof. | `#fafaf9` paper, `#ffffff` cards, `#292524` ink, `#79716b` muted, `#615fff` primary action, `#e7e5e4` borders. | Geist for UI, Geist Mono for data labels, optional restrained display serif only for major hero words. | 1200px max width, 80px section gaps, 24px element gaps, 8px controls, 16px cards. | Sticky nav, dark hero or white proof shell, violet CTA, ghost button, minimal cards, Geist Mono badges. | Use one violet action color; make the dashboard frame inspectable; use mono for tags, timestamps, API fragments, and metrics. | Do not add many accent colors, new shadow recipes, or arbitrary radii. |
| Fresha, "Luminous Marketplace Search" | Booking, catalog, local marketplace, CRM discovery, services SaaS. | `#ffffff`, `#0d0d0d`, `#f2f2f2`, `#767676`, `#d3d3d3`, `#6950f3`, `#ef6997`, `#ffc00a`. | RoobertPRO or Inter with weights 400-700; no decorative tracking. | 24px section rhythm, 8px element gap, 32px card padding, 999px search/buttons, 8-12px cards. | Full-width search bar, service cards, rounded header buttons, outlined app CTA, soft gray info blocks. | Let search be the proof object; keep the marketplace flow visible above the fold. | Do not use yellow as interaction; do not make main content dark. |
| Workable, "Purposeful HR Canvas" | Hiring, workflow, pipeline, compliance, team operations. | `#fff5ee` canvas, `#ffffff` card, `#0f161e` text, `#012620` dark section, `#004038` action, `#00f5dc`, `#fde8ce`, `#ffdcbf`, `#bee9f4`. | Proxima Nova or Open Sans; optional Source Serif Pro only for a single statement. | 32px section gaps, 8px element gaps, 32px card padding, 16px cards/buttons, 25px badges. | Candidate pipeline, colored evidence cards, contained nav CTA, flat feature grid, status badges. | Use colored cards to encode workflow categories, not decoration. | Do not add shadows to every card or make teal/peach/lime all primary CTAs. |
| GlossGenius / All-In-One Salon, "Crisp Digital Ledger" | Payments, appointments, booking admin, local business operating systems. | `#ffffff`, `#f7f7f7`, `#000000`, `#e2e2e2`, `#cccc25` yellow, `#9fa4ff` violet, strong neutral ledger lines. | Basel Grotesk Book/Medium or similar geometric sans; tight metadata; measured display. | 1440px canvas references, 16px/32px spacing, 1.5px silver lines, 6-16px radius depending on density. | Ledger rows, appointment calendar, revenue cards, neon guided highlights, compact side nav. | Build a real operational ledger: time, staff, customer, amount, status, action. | Do not turn neon highlights into a broad gradient background. |
| Slack, "Vibrant Workbench" | Collaboration, AI agents, integrations, enterprise trust with personality. | `#fefbff` canvas, `#ffffff` surfaces, `#f9f0ff` hover, `#f2defe` active, `#611f69` CTA, `#481a54` dark plum, `#1264a3` link, `#edeaed` border. | Salesforce Sans for UI, Salesforce Avant Garde for display; uppercase labels may use 0.057em. | 98px sections, 16px card padding, 4px buttons, 16px cards, 90px pills. | Purple CTA group, AI feature tab list, pill tabs, stat cards, integration grids, announcement banner. | Purple should bind navigation, CTA, and active tab state into one product language. | Do not let purple become every surface; do not use generic Inter-only heading voice. |

### Additional Refero Source Packs

| Source | Use When | Exact Tokens | Type | Spacing / Shape | Components | Integration Rule | Avoid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seline, "Calm Analytics Shell" | Analytics, event tracking, operational SaaS proof. | `#ffffff`, `#fafaf9`, `#0c0a09`, `#78716c`, `#e5e7eb`, `#d6d3d1`, action `#3ba6f1`. | Inter 400/500/600 plus Roobert 400/500; display `52px/1`, heading `32px/1.12`, captions `12px/1.5`. | 4px base, 48px sections, 24px cards, 8px gaps; inputs 4px, cards 10px, large 16px, pill buttons/tags 9999px. | Analytics cards, event rows, pill filters, compact nav, proof metrics. | Use `0 4px 16px rgba(0,0,0,.05)` for cards and `0 12px 45px rgba(17,12,46,.12)` for promoted panels. | Do not add decorative color beyond blue action. |
| Shares, "Collaboration SaaS Glow" | Team collaboration, workspace sharing, modern B2B landing. | `#ffffff`, `#1f1f1f`, `#333333`, `#f6f6f6`, `#888888`, `#e7e7e7`, `#5d5d5d`, action `#594ff4`. | Aeonik 500/700, Rubik secondary; all type tracking `0.075px`; display `72px/1.05`, heading-lg `56px/1.1`. | 48px sections, 24px card padding/gaps; CTA/card pill 99px, cards 24/30/36/60px. | Pill CTA, collaboration card, soft proof tile, rounded feature stack. | Use `0 0 60px -13px rgba(0,0,0,.12)` only for major proof containers. | Do not flatten every element into the same radius. |
| Calendly, "Scheduling Conversion" | Scheduling, booking, onboarding, conversion-first SaaS. | Navy `#0B3558`, action `#006BFF`, hover `#004EBA`, `#ffffff`, `#F8F9FB`, `#E7EDF6`, muted `#476788`, ink `#0A0A0A`. | Gilroy only; display-xl `80px/1`, display `50px/1.1`, body `14px/1.71`. | 8px base, 40px sections, 8px gaps; CTA 8px, cards 16px, badges 50px. | Blue CTA, booking card, trust card, badge, form row. | Use stacked shadow `0 4px 5px rgba(71,103,136,.04), 0 8px 15px rgba(71,103,136,.03), 0 30px 50px rgba(71,103,136,.08)`. | Do not use generic purple SaaS accents. |
| Awesomic, "Creative Ops Dark-Light" | Creative service ops, design marketplace, high-energy SaaS. | Zinc ramp `#09090b/#18181b/#3f3f46/#71717a/#d4d4d8/#ececee/#f4f4f5/#ffffff`, orange `#ff5a00`, magenta `#fe45e2`. | Cosmica 300-700; display `64px/1`, display-sm `56px/1.12`, heading-lg `40px/1.25`. | 80px sections, 24-28px card padding, 8px gaps; cards 36px, muted cards 28px, buttons 14-36px, badges 12px. | Rounded service card, inset action button, badge, portfolio proof grid. | Prefer inset/button rings over card elevation. | Do not use heavy card shadows or generic Inter. |
| Programa, "Architectural SaaS" | Design, architecture, portfolio/product SaaS with quiet authority. | `#1a1a1a`, `#ffffff`, `#a3a3a3`, note `#fbff2b`. | Neue Haas Grotesk Text 400/500; display `42px/1.1` with `-1.26px`. | 6px base, 96px sections, 12px cards/gaps; cards 16px, inputs/buttons/nav 10px. | Square-rounded nav, clean input, compact proof card, acid note chip. | Let spacing and thin contrast carry the page. | No heavy shadows, no saturated palette expansion. |

## Differentiation

Clean SaaS is the right choice when product workflow, enterprise trust, onboarding, pricing, integrations, data, admin, or operational value must be proven. If removing the product frame, metrics, table, workflow, search, or integration map leaves a generic brand page, the proof object must stay. Use `light-ui` for bright tactile surfaces without SaaS proof economics; use `minimal-design` when negative space is the identity.

## Semantic Palette And Tokens

Build semantic tokens by role, not by source name. These starter packs are intentionally complete enough to code from and narrow enough to avoid rainbow SaaS.

### AutoSend Pack

```css
:root {
  --canvas: #fafaf9;
  --surface: #ffffff;
  --surface-muted: #f3f2f0;
  --text: #292524;
  --text-muted: #79716b;
  --line: #e7e5e4;
  --action: #615fff;
  --action-strong: #4f39f6;
  --info: #22b8cd;
  --warning-note: #d97757;
  --radius-control: 8px;
  --radius-card: 12px;
  --radius-panel: 16px;
  --space-page: clamp(20px, 4vw, 40px);
  --space-section: clamp(64px, 9vw, 96px);
  --ease-product: cubic-bezier(.2, .8, .2, 1);
}
```

### Fresha Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #f2f2f2;
  --surface-card: #ffffff;
  --text: #0d0d0d;
  --text-muted: #767676;
  --line: #d3d3d3;
  --action: #0d0d0d;
  --action-outline: #6950f3;
  --hero-glow: #ef6997;
  --rating: #ffc00a;
  --radius-control: 999px;
  --radius-card: 12px;
  --radius-panel: 12px;
  --space-card: 32px;
}
```

### Workable Pack

```css
:root {
  --canvas: #fff5ee;
  --surface: #ffffff;
  --text: #0f161e;
  --text-muted: #333942;
  --brand-dark: #012620;
  --action: #004038;
  --category-a: #00f5dc;
  --category-b: #fde8ce;
  --category-c: #ffdcbf;
  --category-d: #bee9f4;
  --radius-control: 16px;
  --radius-card: 16px;
  --radius-panel: 16px;
  --space-card: 32px;
}
```

### Slack Workbench Pack

```css
:root {
  --canvas: #fefbff;
  --surface: #ffffff;
  --surface-soft: #f9f0ff;
  --surface-active: #f2defe;
  --text: #000000;
  --text-secondary: #1d1c1d;
  --text-muted: #696969;
  --line: #edeaed;
  --action: #611f69;
  --action-dark: #481a54;
  --link: #1264a3;
  --radius-control: 4px;
  --radius-card: 16px;
  --radius-panel: 16px;
  --radius-pill: 90px;
}
```

### Execution Token Contract

Every Clean SaaS build must declare the missing execution tokens before component styling. Source packs choose the color mood; this contract chooses type, spacing, shadow, status, and interaction behavior.

```css
:root {
  --font-sans: Geist, Satoshi, Avenir, Inter, system-ui, sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
  --type-mono-xs: 500 10px/1.4 var(--font-mono);
  --type-mono-sm: 500 11px/1.4 var(--font-mono);
  --type-meta: 500 12px/1.45 var(--font-sans);
  --type-body-sm: 400 13px/1.55 var(--font-sans);
  --type-body: 400 14px/1.6 var(--font-sans);
  --type-ui: 500 14px/1.4 var(--font-sans);
  --type-card-meta: 500 13px/1.4 var(--font-sans);
  --type-card: 600 20px/1.2 var(--font-sans);
  --type-section-sm: 600 28px/1.1 var(--font-sans);
  --type-section: 600 40px/1.05 var(--font-sans);
  --type-display: 600 clamp(44px, 7vw, 64px)/.92 var(--font-sans);
  --track-mono-xs: .18em;
  --track-mono-sm: .12em;
  --track-ui: -.005em;
  --track-card: -.012em;
  --track-section: -.025em;
  --track-display: -.035em;
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
  --shadow-panel: 0 4px 20px rgba(0,0,0,.06);
  --shadow-hero: 0 32px 80px rgba(0,0,0,.10);
  --shadow-modal: 0 24px 80px rgba(15,23,42,.12);
  --shadow-action: 0 4px 16px rgba(97,95,255,.28);
  --shadow-action-strong: 0 8px 28px rgba(97,95,255,.40);
  --status-success-bg: #ecfdf5;
  --status-success-fg: #047857;
  --status-info-bg: #edeaff;
  --status-info-fg: #4f46e5;
  --status-warning-bg: #fffbeb;
  --status-warning-fg: #b45309;
  --status-danger-bg: #fff1f2;
  --status-danger-fg: #b91c1c;
  --status-neutral-bg: #f3f2f0;
  --status-neutral-fg: #79716b;
  --state-hover-bg: color-mix(in srgb, var(--action), white 94%);
  --state-selected-bg: color-mix(in srgb, var(--action), white 90%);
  --state-focus-ring: 0 0 0 3px color-mix(in srgb, var(--action), transparent 74%);
}
```

Pairing rules:

- `hero-block`: `font: var(--type-display)`, `letter-spacing: var(--track-display)`, `text-wrap: balance`, `max-width: 22ch`.
- `section-head`: `font: var(--type-section)`, `letter-spacing: var(--track-section)`, `text-wrap: balance`, `max-width: 18ch`.
- `card-block`: title uses `--type-card`, description uses `--type-body`, timestamp/source uses `--type-meta`.
- `data-row`: ref uses `--type-mono-sm`, primary/trailing use `--type-body-sm` with `font-weight: 600`, secondary uses `--type-body-sm`.
- `status-pill`: always uses `--type-mono-sm`, uppercase, and one `--status-{role}-bg/fg` pair.

Spacing and shadow rules:

| Target | Token |
| --- | --- |
| section vertical | `padding-block: var(--s-9)` mobile, `var(--s-10)` desktop |
| hero vertical | `padding-block: var(--s-11)` desktop |
| card default | `padding: var(--s-6)` |
| card compact | `padding: var(--s-4)` |
| card hero | `padding: var(--s-7)` |
| data row | `padding: var(--s-3) var(--s-4)` |
| button | `padding: var(--s-2) var(--s-4)` |
| inline icon-text | `gap: var(--s-1)` |
| inline controls | `gap: var(--s-2)` |
| elevated cards | `--shadow-card` |
| hero/product frame | `--shadow-hero` |
| primary CTA | `--shadow-action`; hero CTA may use `--shadow-action-strong` |

Status mapping:

| Role | Words |
| --- | --- |
| `success` | Payee, Synced, Live, Resolved, Approved, Stable |
| `info` | En cours, Active, In review, Processing, Live ops |
| `warning` | En attente, Pending, Watch, Stale, Slow |
| `danger` | En retard, Failed, Blocked, Error, Critical, Escalate |
| `neutral` | Empty, No data, Disabled, Skipped, Ready passive |

Tailwind to token mapping:

| Tailwind default | Clean SaaS token |
| --- | --- |
| `text-xs`, `text-sm` | `--type-body-sm` or `--type-meta` |
| `text-base`, `text-lg` | `--type-body` or `--type-card` |
| `text-2xl`, `text-3xl` | `--type-card` or `--type-section-sm` |
| `text-4xl`, `text-5xl` | `--type-section` |
| `text-6xl`, `text-7xl` | `--type-display` |
| `p-3`, `p-4`, `p-5` | `var(--s-3)`, `var(--s-4)`, `var(--s-5)` |
| `gap-3`, `gap-4`, `gap-6` | `var(--s-3)`, `var(--s-4)`, `var(--s-6)` |
| `shadow-sm`, `shadow-md` | `var(--shadow-card)` |
| `shadow-lg`, `shadow-xl` | `var(--shadow-panel)` or `var(--shadow-hero)` |
| `shadow-2xl` | `var(--shadow-modal)` |

Token rules:

- Use `--action` for the primary CTA, selected nav, focus ring, and only one or two hero proof accents.
- Use semantic status colors only when the UI has real states. Do not reuse decorative source accents as success/error by default.
- Keep shadow recipes scarce and named; do not invent `shadow-lg`, `shadow-xl`, or new rgba stacks outside the tier map.
- If using Tailwind, arbitrary values should reference tokens: `text-[length:var(--...)]` is worse than a CSS class, but better than raw `text-7xl`, `p-6`, or `shadow-xl` guesses.
- Keep all body copy at readable contrast. Muted text should stay above WCAG contrast; never solve hierarchy with pale gray alone.

## First Viewport Protocol

The first viewport must say "this is a real SaaS product" before the copy is read.

- **Nav:** sticky or docked, with product nouns in links. Include at least one account/admin/demo action. Match the active radius system: 8px/16px for AutoSend, full-pill for Fresha, 4px + 90px pills for Slack.
- **H1:** use a literal product/category noun. Keep desktop lines to 2-3. Use `text-wrap: balance`, `max-width`, and a mobile clamp; no viewport-width font scaling.
- **Hero proof:** choose one: inspectable dashboard shell, marketplace search, appointment ledger, hiring pipeline, integration map, AI feature tabs, role/permission table, pricing-with-usage block.
- **CTA:** one decisive action, one secondary action only if it has a different intent. States must include hover, focus-visible, active, disabled, loading.
- **Next-section hint:** reveal a metric strip, workflow row, logo/trust rail, or card grid at the bottom edge so the page feels complete.

## Archetype Picker

Pick one primary archetype and keep it legible throughout the page.

| Archetype | Structure | Best For | Required Proof |
| --- | --- | --- | --- |
| Product Evidence Landing | Copy column plus live product frame, metric rail, integration or trust strip. | B2B launches, AI SaaS, analytics, workflow tools. | One detailed UI shell with real labels and data. |
| Marketplace Search Surface | Hero search, category filters, result cards, booking/checkout path. | Services, appointments, local marketplaces, creator platforms. | Search terms, location/status, result card states. |
| Operational Workflow Board | Kanban, table, role permissions, activity feed, state chips. | HR, CRM, admin, compliance, support. | At least 6 realistic records and useful row actions. |
| Digital Ledger Dashboard | Calendar/list hybrid, revenue cards, staff/customer data, payment status. | Salon, bookings, appointments, payments, SMB operations. | Time, amount, customer, status, owner, next action. |
| Enterprise Trust Conversion | Pricing linked to security, roles, audit trail, customer proof. | Enterprise SaaS pricing, admin products, integration platforms. | Permissions table, SLA/security cards, plan comparison. |
| Collaboration Workbench | Feature tabs, AI workflow list, channel/integration map, compact stats. | Collaboration, productivity, AI agents, internal knowledge. | Active tab state and real integration/workflow examples. |

## Signature Components

Use these concrete components instead of generic card rows. Full-page work should include at least four.

### Refero Expansion Component Deltas

- Primary controls must choose one source geometry: Calendly 8px blue buttons for scheduling, Seline 9999px calm analytics pills, Programa 10px square-rounded architecture controls, Shares 99px collaboration CTAs, or Awesomic 14-36px rounded service buttons. Do not mix all five radius systems.
- Cards need a declared elevation grammar: Seline uses 10px cards plus `0 4px 16px rgba(0,0,0,.05)`, Calendly uses 16px cards plus the three-layer blue-gray shadow, Shares uses 24-60px rounded proof containers plus `0 0 60px -13px rgba(0,0,0,.12)`, and Programa stays flat.
- Inputs and filters inherit the source shell: Seline inputs 4px, Calendly CTA/forms 8px, Programa nav/input modules 10px, Awesomic rounded controls with inset/ring treatment.

### Core Component Kit

Use these five components for most Clean SaaS work before inventing new surface types.

```tsx
type StatusRole = "success" | "info" | "warning" | "danger" | "neutral";
type RowState = "default" | "selected" | "loading" | "error" | "success";

export function StatusPill({ role, children }: { role: StatusRole; children: React.ReactNode }) {
  return <span className="status-pill" data-role={role}>{children}</span>;
}

export function DataRow({
  reference,
  primary,
  secondary,
  trailing,
  status,
  statusLabel,
  state = "default"
}: {
  reference: string;
  primary: string;
  secondary: string;
  trailing: string;
  status: StatusRole;
  statusLabel: string;
  state?: RowState;
}) {
  return (
    <article className="data-row" data-state={state} aria-busy={state === "loading"}>
      <span className="data-ref">{reference}</span>
      <div className="data-copy"><strong>{primary}</strong><small>{secondary}</small></div>
      <strong className="data-trailing">{trailing}</strong>
      <StatusPill role={status}>{statusLabel}</StatusPill>
    </article>
  );
}

export function KpiCard({ value, label, delta, role = "neutral" }: { value: string; label: string; delta: string; role?: StatusRole }) {
  return (
    <article className="kpi-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <StatusPill role={role}>{delta}</StatusPill>
    </article>
  );
}

export function SectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <header className="section-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </header>
  );
}

export function ProductFrameShell({ children }: { children: React.ReactNode }) {
  return <section className="product-frame-shell">{children}</section>;
}
```

```css
.status-pill {
  display: inline-flex;
  align-items: center;
  width: max-content;
  padding: var(--s-1) 10px;
  border-radius: 999px;
  font: var(--type-mono-sm);
  letter-spacing: var(--track-mono-sm);
  text-transform: uppercase;
  background: var(--status-neutral-bg);
  color: var(--status-neutral-fg);
}
.status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.data-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  transition: background 200ms var(--ease-product), border-color 200ms var(--ease-product), box-shadow 200ms var(--ease-product);
}
.data-row:hover { background: var(--state-hover-bg); }
.data-row[data-state="selected"] { background: var(--state-selected-bg); box-shadow: inset 3px 0 0 var(--action); }
.data-row[data-state="loading"] { opacity: .62; pointer-events: none; }
.data-row[data-state="error"] { border-color: var(--status-danger-fg); }
.data-row[data-state="success"] { animation: row-flash 480ms var(--ease-product); }
.data-ref { font: var(--type-mono-sm); letter-spacing: var(--track-mono-sm); color: var(--text-muted); }
.data-copy { display: grid; gap: 2px; min-width: 0; }
.data-copy strong, .data-trailing { font: var(--type-body-sm); font-weight: 600; color: var(--text); }
.data-copy small { font: var(--type-body-sm); color: var(--text-muted); }
.kpi-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-card);
}
.kpi-card strong { font: 600 28px/1 var(--font-sans); letter-spacing: -.02em; color: var(--text); }
.kpi-card span { font: var(--type-card-meta); color: var(--text-muted); }
.section-header { display: grid; gap: var(--s-3); max-width: 720px; }
.section-header > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.section-header h2 { margin: 0; max-width: 18ch; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.section-header p { margin: 0; max-width: 62ch; font: var(--type-body); color: var(--text-muted); }
.product-frame-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 620px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-panel);
}
@keyframes row-flash { 0% { background: var(--status-success-bg); } 100% { background: var(--surface); } }
@media (max-width: 760px) {
  .data-row { grid-template-columns: 1fr auto; }
  .data-ref, .data-trailing { grid-column: span 1; }
  .data-copy { grid-column: 1 / -1; }
  .product-frame-shell { grid-template-columns: 1fr; min-height: auto; }
}
```

### SaaS Product Frame Demo

Use `ProductFrameShell` for real app/dashboard layouts. Use `SaaSProductFrameDemo` as the first-viewport proof object for landing pages; it is a demo pattern with realistic data, not a decorative mockup.

```tsx
type FrameState = "syncing" | "ready" | "stale" | "error";

export function SaaSProductFrameDemo({ state = "ready" }: { state?: FrameState }) {
  return (
    <section className="product-frame-demo" data-state={state} aria-label="Revenue workflow preview">
      <header className="frame-topbar">
        <strong>Revenue workflow</strong>
        <span className="sync-label">{state === "ready" ? "Live" : state}</span>
      </header>
      <div className="frame-grid">
        <aside className="frame-sidebar">
          {["Pipeline", "Approvals", "Automations", "Reports"].map((item, index) => (
            <button className="side-item" data-active={index === 1} key={item}>{item}</button>
          ))}
        </aside>
        <div className="frame-main">
          <div className="metric-row">{["$248k qualified pipeline", "18 pending approvals", "97% SLA met"].map((m) => <KpiCard key={m} value={m.split(" ")[0]} label={m.split(" ").slice(1).join(" ")} delta="Live" role="info" />)}</div>
          <DataRow reference="REV-042" primary="ACME renewal" secondary="Legal review" trailing="$42,000" status="info" statusLabel="Review" state="selected" />
          <DataRow reference="PAY-107" primary="Horizon Health" secondary="Payment failed" trailing="Retry" status="danger" statusLabel="Failed" />
        </div>
      </div>
    </section>
  );
}
```

```css
.product-frame-demo { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-panel); background: linear-gradient(180deg, var(--surface), color-mix(in srgb, var(--canvas), white 35%)); box-shadow: var(--shadow-hero); }
.frame-topbar { display: grid; grid-template-columns: 1fr auto; gap: var(--s-3); align-items: center; min-height: 48px; padding: 0 var(--s-4); border-bottom: 1px solid var(--line); }
.frame-grid { display: grid; grid-template-columns: 184px minmax(0, 1fr); min-height: 420px; }
.frame-sidebar { border-right: 1px solid var(--line); padding: var(--s-3); background: color-mix(in srgb, var(--canvas), white 45%); }
.side-item { width: 100%; min-height: 36px; padding: 0 10px; border: 0; border-radius: var(--radius-control, 8px); background: transparent; text-align: left; font: var(--type-ui); color: var(--text-muted); }
.side-item[data-active="true"] { background: var(--surface); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); }
.metric-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-3); padding: var(--s-4); }
@media (max-width: 760px) {
  .frame-grid { grid-template-columns: 1fr; min-height: auto; }
  .frame-sidebar { display: flex; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--line); }
  .side-item { min-width: max-content; } .metric-row { grid-template-columns: 1fr; }
}
```

States:

- `syncing`: topbar label pulses with a soft action-tinted background; rows remain readable.
- `ready`: live label is action-colored text on soft fill.
- `stale`: show "Updated 12m ago" and a refresh button, not a vague warning icon.
- `error`: preserve the shell, add an inline recovery row: "Stripe sync failed. Retry import."

### Marketplace Search Hero

Use for Fresha-like booking and discovery products. The search bar is not decoration; it must accept service, location, date, or segment fields.

```tsx
export function MarketplaceSearchHero() {
  return (
    <form className="market-search" aria-label="Find appointments">
      <label>
        <span>Service</span>
        <input defaultValue="Consultation" />
      </label>
      <label>
        <span>Location</span>
        <input defaultValue="Paris" />
      </label>
      <label>
        <span>When</span>
        <input defaultValue="This week" />
      </label>
      <button type="submit">Search</button>
    </form>
  );
}
```

Implementation rules:

- Use full-pill controls with `border: 1px solid var(--line)` and `padding: var(--s-3) var(--s-5)`.
- Keep labels inside or above fields; do not rely on placeholder-only content.
- Add focused, filled, invalid, loading, empty-results, and no-availability states.
- Mobile: stack into a 1-column form with the submit button full-width and sticky only if it does not hide results.

### Workflow Sequence

Use when the value proposition is "we coordinate complex work."

- DOM: ordered list with `li`, state chip, owner avatar/initial, title, due date, action button.
- CSS: 1px dividers, `var(--s-3) var(--s-4)` row padding, selected row with action-colored left edge, no layout shift on hover.
- States: queued, running, blocked, approved, skipped. Use words and icons, not color alone.
- Motion: when a row completes, flash the row background for 480ms with a pale action tint, then settle to a static success chip.

### Metric Proof Strip

Use below hero or between product sections.

- Structure: 3-4 metrics, each with a number, noun, method, and timestamp/source.
- Typography: number large enough to scan, label 13-15px, source in mono if technical.
- Avoid naked vanity numbers. Prefer "42k records synced / last 24h" over "10x growth."
- Mobile: convert to a horizontal scroll strip with snap points or a 2x2 grid; do not squeeze numbers into illegible columns.

### Integration Matrix

Use for platforms and enterprise trust.

- Center: product command/search frame.
- Around it: integration chips grouped by job: data, support, billing, identity, analytics.
- Lines may be thin `#edeaed` or action-tinted; they must connect real labels.
- Hover/focus: reveal the integration job and last sync time. Keyboard users must get the same information.
- Empty state: "No integrations connected yet" with a setup CTA and sample slots.

### Role Permission Table

Use for enterprise admin, pricing, and trust.

- Columns: Role, Members, Data access, Approval limit, Audit log, Status.
- Row height: 44-56px. Header sticky if the table scrolls.
- States: selected row, read-only row, disabled role, pending invite, failed sync.
- Use check icons plus accessible text; do not use green borders as the only positive signal.
- Mobile: convert rows to compact definition cards with the role name as the heading.

### Pricing With Usage

Use when conversion needs enterprise clarity.

- Include plan name, usage meter, included limits, overage behavior, security/support proof, and CTA.
- Highlight one recommended plan with surface and border changes, not scale/lift.
- Loading: skeleton prices and disabled CTA with "Calculating usage."
- Error: inline billing recovery, preserving all plan content.

## State Language

Clean SaaS states are calm, explicit, and product-specific.

```tsx
const cleanSaaSState = {
  idle: "bg-[var(--surface)] text-[var(--text)] border-[var(--line)]",
  hover: "hover:bg-[var(--state-hover-bg)] hover:border-[color-mix(in_srgb,var(--action),var(--line)_65%)]",
  focus: "focus-visible:outline-none focus-visible:shadow-[var(--state-focus-ring)]",
  selected: "bg-[var(--state-selected-bg)] border-[var(--action)] text-[var(--text)] shadow-[inset_3px_0_0_var(--action)]",
  loading: "aria-busy:pointer-events-none aria-busy:cursor-wait",
  disabled: "disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed",
  error: "border-[var(--status-danger-fg)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
  success: "border-[var(--status-success-fg)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
};
```

State rules:

- Success can use green, but the exact green must be a semantic state token, not a decorative source accent.
- Error copy must name the failed system or action: "HubSpot sync failed", "Payment retry needed", "CSV import has 12 invalid rows."
- Empty states must include the next best action and, when relevant, an example record.
- Hover cannot translate whole cards upward by default. Use background, border, inset edge, icon color, or a tiny internal media shift.

## Motion System

Motion is quiet and procedural. It should explain workflow continuity.

- Refero expansion motion stays procedural: 150-300ms for opacity, transform, border, background, and subtle shadow only. Use `cubic-bezier(.2,.8,.2,1)` for panel reveals and `ease-out` for button hover; no bouncing, decorative parallax, or unrelated gradient animation.
- `prefers-reduced-motion` removes card lift, gradient movement, and count-up choreography while preserving focus rings and static selected/error states.

| Pattern | Use | Timing | Implementation |
| --- | --- | --- | --- |
| Tab transition | Product demo tabs, AI feature list, pricing toggles. | 160-220ms | Fade outgoing panel to 0, translate x 8px, fade incoming from x -8px. Keep container height stable. |
| Row flash | Sync, approval, import completion. | 480-700ms | Animate background from action tint to surface; update chip text at the start. |
| Focus pulse | Command/search bar or primary CTA after validation. | 600ms max | Ring color alpha pulse; never scale text. |
| Command palette | Workflow-heavy SaaS hero or app. | 180ms open, 120ms close | Opacity + translateY only; trap focus; Escape closes. |
| Table update | Live metric, role change, payment retry. | 300ms | Crossfade cell value and use a short border-left accent on the row. |
| Panel open | Detail drawer, trust panel, settings panel. | 220-280ms | Width/height should be preallocated or use transform on an overlay; no content jumping. |

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion],
  .product-frame-demo *,
  .product-frame-shell *,
  .workflow-list li {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transform: none !important;
    scroll-behavior: auto !important;
  }
}
```

Use GSAP only if the project already has it or the user requests rich motion. For standard SaaS UI, CSS transitions and React state are enough.

## Complete Page Protocols

```tsx
// Product/B2B landing
<main>
  <Nav mode="sticky" primaryAction="Book demo" secondaryAction="Sign in" />
  <HeroProduct h1="Revenue operations for construction teams" proof={<SaaSProductFrameDemo state="ready" />} cta="Book demo" />
  <MetricProofStrip metrics={["42k records synced", "97% SLA met", "18 approvals pending"]} />
  <WorkflowSequence records={atLeastSixRealRecords} />
  <IntegrationMatrix groups={["billing", "identity", "analytics", "support"]} />
  <TrustRail claims={["SOC 2", "SSO", "99.95% uptime", "guided migration"]} /><PricingWithUsage />
</main>

// Marketplace/booking
<main>
  <Nav mode="sticky" primaryAction="List service" secondaryAction="Log in" />
  <HeroSearch h1="Appointments and services, ready to book" proof={<MarketplaceSearchHero />} />
  <FilterRail filters={["category", "location", "price", "rating", "availability"]} />
  <ResultGrid states={["default", "hover", "selected", "unavailable", "loading", "empty"]} />
  <DetailPanel sections={["service", "policy", "trust", "next slot"]} />
</main>

// App/dashboard
<ProductFrameShell>
  <Sidebar items={["Dashboard", "Approvals", "Invoices", "Reports"]} /><Topbar search filters actions status="syncing" />
  <DataTable>
    <DataRow reference="FA-2024-187" primary="Promo Loire" secondary="Due Nov 30" trailing="48 200 EUR" status="warning" statusLabel="Pending" />
    <DataRow reference="FA-2024-188" primary="Northstar" secondary="Paid today" trailing="12 900 EUR" status="success" statusLabel="Paid" state="success" />
  </DataTable>
  <DetailDrawer states={["selected", "read-only", "failed sync", "empty"]} />
</ProductFrameShell>
```

Hero-only request: include nav, product proof, CTA state, and a next-section sliver.

## Absolute Bans

- No oversized centered slogan without UI proof.
- No decorative card farm when a table, workflow, search, ledger, or integration matrix would communicate better.
- No vague copy such as "unlock your potential" without a product noun and action.
- No generic `border-green` success styling; use semantic state tokens and text.
- No random pastel SaaS palette assembled from multiple sources.
- No raw Tailwind typography, spacing, or shadow defaults when a Clean SaaS token exists.
- No hover lift as the main interactive idea. If hover moves, keep it inside the component and below 2px.
- No gradients on functional controls except a named source-specific hero/background treatment.
- No hidden controls to make complex SaaS look minimal.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.

## Pre-Output Checklist

- First viewport contains a real product/workflow object.
- One source archetype is clearly dominant.
- Clean SaaS is not drifting into generic Light UI or Minimal Design.
- Execution tokens are declared: type scale, spacing scale, shadow tiers, semantic status pairs, interaction states.
- Typography uses the named pairings for hero, section, card, metadata, and data rows.
- Spacing uses `--s-*` tokens instead of mixed `p-5/p-6/py-28` guesses.
- Status chips use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, active, disabled, loading, empty, error, success, and stale/syncing where relevant.
- Motion maps to tab change, row update, focus, command palette, table update, or panel open.
- Mobile layout has stable dimensions and no overlapping text or controls.
