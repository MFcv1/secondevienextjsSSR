---
name: technical-sans
description: "Use this skill to create Technical Sans visual design systems that feel technical, crisp, rational, precise, engineered, legible. USE FOR: developer tools, AI products, technical SaaS, documentation, infrastructure, precise product interfaces. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Technical Sans Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Technical Sans archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, code/API/docs/architecture proof, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Technical Sans components with states.
7. **Motion plan:** command, deploy, docs, or code transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

You are a senior frontend design engineer specializing in Technical Sans. The output must feel technical, crisp, rational, precise, engineered, legible. Do not merely skin default components with a color palette. Build a visual operating system where typography, alignment, code/data proof, diagrams, and restrained interaction make the product feel engineered.

Use this skill for developer tools, AI products, technical SaaS, documentation, infrastructure, precise product interfaces.


Before writing code for a substantial UI, output a compact `<design_plan>` block. Include:

1. **Use case:** product category, technical audience, primary action, credibility target.
2. **Style direction:** one Technical Sans source pack below.
3. **Typography contract:** display sans, UI sans, mono, weights, tracking, code/data roles.
4. **First viewport:** nav, H1 line strategy, code/data/architecture proof, CTA treatment, next-section hint.
5. **System contracts:** color, surface, radius, spacing, state, diagram, and motion rules.
6. **Component plan:** at least four concrete components with states.
7. **Motion plan:** tab, command, code reveal, deploy timeline, table update, reduced motion.
8. **Anti-slop sweep:** name the likely fake-technical failure modes and avoid them.

If the request is tiny, do this mentally and keep the final answer concise.

## Non-Negotiable Principles

- Typography, alignment, density, and real technical evidence communicate trust.
- Show code, diagrams, CLI, docs, workflow, or data instead of generic tech gradients.
- Mono is a tool for code/data, not the whole brand unless the product demands it.
- A technical landing page must include inspectable proof before abstract claims.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium-high; enough inspectable detail to feel real, less dense than a full workstation. |
| motion | Low-medium; command, deploy, tab, code reveal, doc preview, graph/table transitions. |
| decoration | Low; lines, syntax, diagrams, shadows, and precision grids replace decorative imagery. |
| contrast | Crisp light or dark, with code/data zones clearly separated. |
| radius | 4-6px for compact technical systems, 9-20px for warmer cards, 32-9999px only for source-specific pills. |
| type | Technical sans plus mono code; display/serif contrast only in Antimetal or Mercury-like moments. |
| assets | Code blocks, API responses, terminal windows, architecture diagrams, screenshots, changelog/version cards. |

## Signature System

- Evidence Before Abstraction: code sample, API response, dashboard, terminal, or architecture diagram appears early.
- Technical Type Ladder: display sans, UI sans, mono labels, and code blocks have distinct jobs.
- Precision Grid: alignment and spacing should feel engineered, not decorative.
- Syntax As Color: syntax highlighting can become the accent system when used sparingly.

## Differentiation

Use Technical Sans when developer tools, AI products, technical SaaS, documentation, infrastructure, precise product interfaces. If removing the code/API/diagram proof, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `technical-ui` for operational work surfaces; use this for technical marketing, docs, code proof, and developer product identity.
## Raw Archetype Packs

Choose one pack. Technical Sans loses definition when Antimetal's mixed dark hero, Plain's green workbench, Cursor's warm ivory, Linear's dark command center, and Mercury's spacious finance dark all collide.

| Source | Use When | Palette | Type | Radius / Spacing | Components | Carry Forward | Avoid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Antimetal, "Mixed Infrastructure Editorial" | Cloud, infra, security, AI ops needing dramatic technical credibility but a usable light product body. | `#001033` dark hero, `#1b2540` navy text, `#d0f100` chartreuse CTA, `#e0f6ff` cold border, `#f8f9fc` product canvas, `#ffffff` cards, `#6b7184` muted. | abcdFont/Inter for UI, 400-480; ivarText/Fraunces display only for large editorial moments. | 4px base, 80px section gap, 20px card padding, 16px badge, 20px feature cards, 9999px CTA pill. | Chartreuse CTA pill, dark ghost pill, white product cards, floating badges, sharp text input. | Dark hero can hand off to pale operational dashboard. | Do not use chartreuse for every metric or body highlight. |
| Plain, "Crisp Support Workbench" | Support, communication, API tooling, workflow products, admin surfaces. | `#ffffff`, `#f3fbe9`, `#f9f6f1`, `#0a2414`, `#283a2e`, `#607166`, `#1ad379`, `#17b267`, `#ffbac3`. | ABC Favorit/Inter, weights 400/500, display 80px 400 `-0.02em`, mono with `0.015em`. | 4px base, 40px sections, 24px card padding/gaps, 9px cards, 6px controls. | Green action button, muted ghost, workbench card, dark forest module, mono metadata row. | Make the UI operational from the first screen. | Do not make green a decorative wash or use heavy weights. |
| Cursor, "Warm Ivory Software Studio" | Developer tools that need tactile warmth, type craft, and panel stacking. | `#f7f7f4` parchment, `#262510` ink, `#7a7974` muted, `#141414` deep, `#e6e5e0`, `#cdcdc9`, `#f54e00` outline action, `#c08532`, `#34785c`. | CursorGothic/system, 400, OpenType `ss09 ss08 tnum`; Berkeley Mono for code; Lato for utility. | 8px gaps, 4px compact radius, 8px distinct radius, layered shadows. | Outlined primary button, floating software card, code panel, transparent input, compact nav. | Let outline actions feel native to developer software. | Do not replace stacked shadows with generic black elevation. |
| Linear, "Dark Command-Center Sans" | Focused dark developer/productivity landing, issue tracking, observability, team workflow. | `#08090a`, `#0f1011`, `#161718`, `#23252a`, `#323334`, `#f7f8f8`, `#d0d6e0`, `#8a8f98`, `#e4f222`, `#5e6ad2`, `#27a644`, `#eb5757`. | Inter Variable 300/400/510/590, tight negative tracking; Berkeley/IBM Plex Mono for code/data. | 4px base, 24px section gap, 12px card padding, 8px gaps, 2px tags, 4px badges, 6px controls/cards. | Lime primary, graphite card, sidebar nav item, subtle link, code/data block. | Small neutral steps and one bright action color make the system technical. | Do not add rainbow syntax or broad gradients. |
| Mercury, "Spacious Dark Financial Technical" | Finance, banking, infrastructure, mature technical products needing space and authority. | `#171721`, `#1e1e2a`, `#272735`, `#70707d`, `#c3c3cc`, `#ededf3`, `#5266eb`, `#cdddff`, `#ffffff`. | Arcadia/Inter/Manrope, display weights 360-530, positive tracking around 0.01-0.02em. | 80-120px sections, 12-32px gaps, 32/40px buttons, 32px inputs, 4px containers, few cards. | Blue primary pill, ghost header pill, text-only nav, joined email input, border-list feature link. | Use air and type weight, not density, for authority. | Do not over-card or over-shadow spacious dark layouts. |

## Semantic Token Packs

### Additional Refero Source Packs

- Warp terminal product sans: `#121212/#090909/#1e1e1d/#353534/#40403f`, text `#faf9f6/#e3e2e0/#afaeac/#868684`, accent `#799c92`; Matter display 400 with 48px+ text at `-0.03em` to `-0.04em` and `cv03/cv04/cv09/cv11`; Geist Mono 400 16px terminal text; 1200px max, 80px sections, 16px cards, 10px gaps; controls 4px, images 10px, cards 16px, large 20px, pills 50px, badges 200px; no shadows.
- N8n workflow sans: `#0e0918/#1a1624/#1b1728/#2c2834/#3e3a46`, text `#d1cece/#9d9797/#ffffff`, CTA `linear-gradient(30deg, rgb(253,137,37), rgb(255,12,0))`, focus/data `linear-gradient(141deg, #077ac7, #6b21ef)`, signal `#ff492c`; geomanist 300/400 display `54px/.88/-1.08px`, geomanist-book 16-24px `-0.29px`; 1200px max, 80-120px sections, nodes 12px, cards 16/24px, controls 8px, pills 9999px.
- (dot)connect technical brand sans: `#fcfbf8/#ededea/#001011/#0f1e1f/#c1c4c2`, accent `#fd5321`, secondary `#007aff`; AeonikPro 400/500 16-101px with `.8-1.5` leading and `-0.0250em` to `0.0250em`, DotConnect 500 at 19/24/36/73px; 8px base, 48px sections, 24px cards/gaps; badges 8px, cards 20px, buttons 24px, decorative blocks 48px; filled brand button `#001011` on `#fcfbf8`, outlined blue secondary.

- Factory technical sans launch: black `#020202`, light `#eeeeee/#fafafa`, warm grays `#b8b3b0/#3d3a39/#a49d9a`, alert `#ef6f2`; Geist/Geist Mono; display `60px/1` with `-2.88px`; 4px base, 72px sections, 16px cards, 4px gaps; cards 6px, buttons 4px, header 0px.
- Humble precise product light: `#fafafa/#f1f1f1/#ecebe8`, ink `#1c1c1c`, muted `#6e6e6e`, action `#ff4000`; Bricolage Grotesque 500/600 plus Geist 500/600; display `58px/0.7` with `-0.052px`; sections 64px, cards 32px, gaps 10px; controls 6px, cards 30px, images 40px, buttons 100px.
- AIUC institutional technical: `#ffffff/#000000/#1a1a1a/#323232/#707070`, border `#d3dfeb`, note `#eddfab`; Almarai 300 heading, ABC Diatype body, ABC Diatype Semi-Mono nav/meta; display `40px/1.3` with `-0.8px`; 40px sections, 16px cards, 10px gaps; buttons 3px, cards 4px.
- Programa architectural sans: ink `#1a1a1a`, canvas `#ffffff`, muted `#a3a3a3`, note `#fbff2b`; Neue Haas Grotesk Text 400/500; display `42px/1.1` with `-1.26px`; 6px base, 96px sections, 12px cards/gaps; cards 16px, controls/nav 10px; no heavy shadow.
- Wonder dark technical brand: `#0f0217/#0b0211/#111111/#ffffff/#44374a/#6f6774/#d262ff`; Uncut Sans Variable, Inter, Martian Mono; display `50px/1.1` with `-2.5px`; sections 40px, cards/gaps 12px; cards 14px, buttons/nav 8px, badges/inputs 9999px.

### Mixed Infra Pack

```css
:root {
  --canvas: #f8f9fc;
  --surface: #ffffff;
  --hero: #001033;
  --text: #1b2540;
  --text-muted: #6b7184;
  --line: #b1b5c0;
  --cold-line: #e0f6ff;
  --action: #d0f100;
  --action-text: #1b2540;
  --radius-control: 9999px;
  --radius-card: 20px;
  --radius-badge: 16px;
}
```

### Warm Workbench Pack

```css
:root {
  --canvas: #ffffff;
  --surface: #f9f6f1;
  --surface-soft: #f3fbe9;
  --surface-dark: #283a2e;
  --text: #0a2414;
  --text-muted: #607166;
  --line: #dbe7d0;
  --action: #1ad379;
  --action-alt: #17b267;
  --highlight: #ffbac3;
  --radius-control: 6px;
  --radius-card: 9px;
}
```

### Ivory Studio Pack

```css
:root {
  --canvas: #f7f7f4;
  --surface: #fffefa;
  --surface-muted: #e6e5e0;
  --text: #262510;
  --text-muted: #7a7974;
  --line: #cdcdc9;
  --action: #f54e00;
  --positive: #4ade80;
  --secondary-action: #34785c;
  --radius-control: 4px;
  --radius-card: 8px;
  --shadow-panel: 0 1px 0 rgba(20,20,20,.14), 0 18px 48px rgba(20,20,20,.14);
}
```

### Dark Command Pack

```css
:root {
  --canvas: #08090a;
  --surface: #0f1011;
  --surface-raised: #161718;
  --text: #f7f8f8;
  --text-muted: #8a8f98;
  --line: #323334;
  --line-strong: #383b3f;
  --action: #e4f222;
  --action-text: #08090a;
  --accent-blue: #5e6ad2;
  --radius-control: 6px;
  --radius-tag: 2px;
}
```

### Spacious Dark Pack

```css
:root {
  --canvas: #171721;
  --surface: #1e1e2a;
  --surface-soft: #272735;
  --text: #ededf3;
  --text-muted: #c3c3cc;
  --line: #70707d;
  --action: #5266eb;
  --action-soft: #cdddff;
  --action-text: #ffffff;
  --radius-control: 32px;
  --radius-container: 4px;
}
```

Token rules:

- `--action` should be the only strong action color in a viewport.
- Syntax colors must be local to code blocks unless the source explicitly uses a single action color as brand identity.
- Use `--line` heavily. Technical Sans relies on hairlines, grids, and card seams more than decoration.
- Do not make low-contrast mono text a style affectation. Mono content must remain readable.

### Execution Token Contract

Refero ready-to-use deltas from Warp/N8n/(dot)connect:
- Token roles: Warp `#121212/#090909/#1e1e1d/#353534/#40403f` with text `#faf9f6/#e3e2e0/#afaeac/#868684` and accent `#799c92`; N8n CTA `linear-gradient(30deg, rgb(253,137,37), rgb(255,12,0))`; (dot)connect parchment `#fcfbf8/#ededea`, ink `#001011`, action `#fd5321`, secondary `#007aff`.
- Type roles: Matter display 48px+ at `-0.03em` to `-0.04em`, geomanist display `54px/.88/-1.08px`, AeonikPro 16-101px plus DotConnect 19/24/36/73px.

Every Technical Sans build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #ffffff;
  --surface: #f7f9fc;
  --surface-muted: #eef3f8;
  --text: #111827;
  --text-muted: #617083;
  --line: #d8e0ea;
  --action: #155dfc;
  --action-strong: #0036ff;
  --radius-control: 8px;
  --radius-card: 10px;
  --radius-panel: 14px;
  --font-sans: Geist, Inter, system-ui, sans-serif;
  --font-display: "Aeonik", "Suisse Intl", var(--font-sans);
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
  --status-neutral-fg: #617083;
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

| Tailwind default | Technical Sans token |
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

Token rule: if a value can be expressed by `ts`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## First Viewport Protocol

Refero layout deltas:
- Warp: 1200px max, 80px sections, 16px card padding, 10px gaps; terminal proof visible above the fold.
- N8n: 1200px max, 80-120px sections, 16-24px gaps; nodes 12px, cards 16/24px, controls 8px.
- (dot)connect: 8px base, 48px sections, 24px card padding/gap; 20px cards, 24px buttons, 48px decorative blocks.

- **Nav:** product/documentation/integration links plus a clear CTA. For dark sources, nav can be transparent over hero; for Plain/Cursor, nav should feel like part of the workbench.
- **H1:** precise product noun. Use 2-3 desktop lines. Avoid vague AI/infra claims without a technical object.
- **Hero proof:** choose code hero, CLI command, API response, deploy timeline, architecture diagram, docs preview, or product screenshot.
- **CTA:** action color from the selected source. Pair with a ghost or docs link. Buttons must include focus-visible, disabled, loading.
- **Next-section hint:** show docs tabs, integration table, changelog, deploy status, metric/code strip, or architecture modules.

## Archetype Picker

| Archetype | Layout Behavior | Best Use | Required Proof |
| --- | --- | --- | --- |
| Developer Landing | Code/CLI hero, docs preview, integration proof. | SDK, API, infra, AI dev tools. | Real command, response, and copy button. |
| Mixed Infra Launch | Dark atmospheric hero to light dashboard body. | Cloud/security/AI ops. | Product UI bridge from hero to dashboard. |
| Warm Dev Studio | Ivory canvas, stacked software panels, outline actions. | IDE, agent, productivity dev tools. | Floating panel with real files/code. |
| Dark Command Brand | Compact dark page with issue/log/data proof. | Team tools, observability, productivity. | Sidebar/list/code proof with active states. |
| Spacious Technical Finance | Airy dark type-led page with joined inputs and border lists. | Finance, banking, mature B2B tech. | Product proof plus restrained conversion input. |
| Docs-App Hybrid | Docs nav, code sample, live preview, version/change note. | Documentation and developer onboarding. | Tabs, copy state, error/empty states. |

## Signature Components

Refero component deltas:
- Warp: 4px controls, 10px images, 16/20px cards, 50px pills, 200px badges.
- N8n: 8px inputs/buttons, 12px nodes, 16px cards, 24px badges/large cards, 9999px pills; ember CTA for execution only.
- (dot)connect: filled `#001011` button on `#fcfbf8`, outlined `#007aff` secondary, 8px badges, 20px cards, 24px buttons.

### Core Component Kit

### Refero Expansion Component Deltas

- For technical sans pages, type is the product voice: Factory/Geist and Programa/Neue Haas are crisp operational, Humble/Bricolage is friendly but still precise, AIUC/Almarai is institutional, Wonder/Uncut is dark AI-lab. Never substitute a generic Inter-only stack unless the existing project requires it.
- Component curvature is a source decision: Factory 4-6px, AIUC 3-4px, Programa 10-16px, Humble 30-100px, Wonder 8/14/9999px. Use one family across nav, buttons, cards, and inputs.
- Technical accents must remain sparse: Factory `#ef6f2` for warning/attention, Humble `#ff4000` for primary action, Programa `#fbff2b` for notes, Wonder `#d262ff` for active AI state.

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type TechnicalSansState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type TechnicalSansStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function TechnicalSansStatusPill({ role, children }: { role: TechnicalSansStatus; children: React.ReactNode }) {
  return <span className="technical-sans-status-pill" data-role={role}>{children}</span>;
}

export function CodeHeroContract({ state = "default" }: { state?: TechnicalSansState }) {
  return <section className="technical-sans-hero-object" data-state={state} aria-label="Technical Sans proof object" />;
}

export function CliCommandBarContract({ title, meta, state = "default" }: { title: string; meta: string; state?: TechnicalSansState }) {
  return <article className="technical-sans-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function DocsSidebarContract({ items }: { items: string[] }) {
  return <nav className="technical-sans-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function TechnicalSansSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="technical-sans-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.technical-sans-status-pill {
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
.technical-sans-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.technical-sans-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.technical-sans-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.technical-sans-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.technical-sans-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.technical-sans-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.technical-sans-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.technical-sans-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.technical-sans-card[data-state="error"] { border-color: var(--status-danger-fg); }
.technical-sans-card > span { font: var(--type-meta); color: var(--text-muted); }
.technical-sans-card > strong { font: var(--type-card); color: var(--text); }
.technical-sans-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.technical-sans-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.technical-sans-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.technical-sans-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.technical-sans-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.technical-sans-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.technical-sans-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .technical-sans-hero-object { min-height: 280px; }
  .technical-sans-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
### Code Hero

Use when the product promises developer speed, API clarity, or AI/infrastructure setup.

```tsx
type CodeHeroStatus = "ready" | "copied" | "error";

export function CodeHero({ status = "ready" }: { status?: CodeHeroStatus }) {
  return (
    <section className="code-hero" data-status={status}>
      <div className="code-tabs" role="tablist" aria-label="Install method">
        {["npm", "curl", "python"].map((tab, i) => <button role="tab" aria-selected={i === 0} key={tab}>{tab}</button>)}
      </div>
      <pre className="code-block"><code>{`npm install @acme/sdk\nacme deploy --env production`}</code></pre>
      <footer className="code-footer">
        <span>v2.4.0</span>
        <button>{status === "copied" ? "Copied" : "Copy command"}</button>
      </footer>
    </section>
  );
}
```

```css
.code-hero {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-card, 8px);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-panel, none);
}
.code-tabs { display: flex; gap: 4px; padding: 8px; border-bottom: 1px solid var(--line); }
.code-tabs button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-muted);
  font: 500 13px/1 var(--font-sans, Inter, sans-serif);
}
.code-tabs button[aria-selected="true"] { color: var(--text); background: color-mix(in srgb, var(--surface), var(--line) 24%); border-color: var(--line); }
.code-block { margin: 0; padding: 18px; overflow: auto; font: 13px/1.6 var(--font-mono, "Geist Mono", monospace); }
.code-footer { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 12px; border-top: 1px solid var(--line); color: var(--text-muted); }
.code-footer button { min-height: 32px; border-radius: var(--radius-control); border: 1px solid var(--line); background: transparent; color: var(--text); padding: 0 10px; }
.code-hero[data-status="copied"] .code-footer button { border-color: var(--action); color: var(--action); }
.code-hero[data-status="error"] { border-color: #eb5757; }
```

States: loading command, copied, failed command, selected language tab, keyboard focus, horizontal overflow on small screens.

### CLI Command Bar

- Use a single-line command with prompt marker, environment selector, copy/run button, and output status.
- Keep height stable at 44-52px.
- Add `aria-live="polite"` for output status.
- Mobile: allow horizontal scroll in code area, keep action button reachable.

### API Response Card

- Include endpoint, method, latency, status, and JSON body.
- Syntax colors are local to tokens: keys, strings, numbers, comments, error.
- Add tabs for Request / Response / Errors.
- Error state should show realistic status (`401`, `429`, `500`) and recovery.

### Architecture Diagram

- Use CSS grid/SVG/canvas only if labels stay selectable or accessible elsewhere.
- Nodes: client, edge, worker, database, queue, analytics.
- Lines should have direction and optional labels (`webhook`, `stream`, `batch`).
- Hover/focus reveals latency, owner, or protocol. Reduced motion keeps arrows static.

### Deploy Timeline

- Steps: Commit, Build, Test, Migrate, Deploy, Verify.
- Each step has status, timestamp, duration, and log link.
- States: queued, running, passed, failed, skipped, rolled back.
- Row flash only on state change; never animate layout height.

### Docs Sidebar

- Sections grouped by task: Start, Authenticate, Send data, Webhooks, Errors, SDKs.
- Active item uses text weight, border/fill, and `aria-current`.
- Mobile becomes a top dropdown or command palette.

### Technical Pricing

- Include usage units (`events/month`, `seats`, `compute min`, `retention`), not just marketing plan names.
- Recommended plan uses border/fill and utility copy, not scale.
- Billing states: calculating usage, over limit, trial ending, payment failed.

## State Language

Refero state deltas:
- Warp hover steps surfaces from `#353534` to `#40403f`; no glow.
- N8n execution/focus uses ember CTA and electric-current gradient; do not use it as wallpaper.
- (dot)connect primary/secondary focus maps to `#fd5321/#007aff`; disabled/border states use `#c1c4c2`.

```tsx
const technicalSansState = {
  idle: "bg-[var(--surface)] text-[var(--text)] border-[var(--line)]",
  hover: "hover:border-[color-mix(in_srgb,var(--line),var(--text)_20%)] hover:bg-[color-mix(in_srgb,var(--surface),var(--line)_16%)]",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action)] focus-visible:ring-offset-2",
  selected: "data-[selected=true]:border-[var(--action)] data-[selected=true]:text-[var(--text)]",
  running: "data-[state=running]:before:bg-[var(--action)]",
  loading: "aria-busy:pointer-events-none aria-busy:cursor-progress",
  disabled: "disabled:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70",
  error: "border-[#eb5757] bg-[color-mix(in_srgb,#eb5757,transparent_90%)] text-[var(--text)]",
  success: "border-[#27a644] bg-[color-mix(in_srgb,#27a644,transparent_90%)] text-[var(--text)]"
};
```

Rules:

- Do not style success as a generic green border without text. Show "Build passed", "Webhook delivered", "Deploy verified".
- Error states should include the failed technical object and recovery: "Token expired. Re-authenticate." or "Migration failed at step 04."
- Loading states can use skeleton lines or terminal cursor, but content dimensions must stay stable.
- Disabled states should stay readable; disabled is lower priority, not invisible.

## Motion System

Refero motion delta:
- N8n workflow edge sweeps may use the existing 300-700ms path/current timing already in this skill; Warp and (dot)connect have no source-specific duration, so use existing technical-sans timings for opacity/translate only.

- Use restrained technical motion: 120-240ms for controls and link hovers, 180-300ms for hero proof panel reveal, no bouncy easing. Dark technical pages may use a static glow, but active state must still be readable without motion.

## Complete Page Protocols

```tsx
// Developer Landing
<main data-skill="technical-sans" data-archetype="developer-landing">
  <CodeHeroContract command="npx product init" />
  <APIResponseCardContract status={200} />
  <ArchitectureDiagramContract nodes={["client", "edge", "db"]} />
  <DeployTimelineContract state="success" />
</main>

// Documentation Surface
<main data-skill="technical-sans" data-archetype="documentation-surface">
  <DocsSidebarContract sections={["Start", "API", "Examples"]} />
  <CLICommandBarContract command="deploy --prod" />
  <TechnicalPricingContract plans={["Build", "Scale", "Enterprise"]} />
</main>
```
```tsx
// Developer Landing
<main data-skill="technical-sans" data-archetype="developer-landing">
  <CodeHeroContract command="npx product init" />
  <APIResponseCardContract status={200} />
  <ArchitectureDiagramContract nodes={["client", "edge", "db"]} />
  <DeployTimelineContract state="success" />
</main>

// Documentation Surface
<main data-skill="technical-sans" data-archetype="documentation-surface">
  <DocsSidebarContract sections={["Start", "API", "Examples"]} />
  <CLICommandBarContract command="deploy --prod" />
  <TechnicalPricingContract plans={["Build", "Scale", "Enterprise"]} />
</main>
```
| Pattern | Use | Timing | Behavior |
| --- | --- | --- | --- |
| Code tab transition | Switching SDK languages or request/response views. | 140-220ms | Crossfade code lines and move x 4-8px; preserve block height. |
| Command execution | CLI bar run/copy. | 300-900ms | Cursor blink, then status text; no layout jumps. |
| Deploy row flash | Step completes/fails. | 450-700ms | Action/error tint fades to surface; chip text changes immediately. |
| Focus pulse | Copy button, command input, API key field. | 500ms | Ring alpha pulse only. |
| Diagram path | Architecture edge highlight. | 600-1200ms | Stroke dash or opacity, reduced motion shows static highlighted path. |
| Panel open | Docs sidebar, details drawer, changelog. | 180-240ms | Transform/opacity on overlay or preallocated panel. |

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion],
  .code-hero *,
  .deploy-step,
  .diagram-edge {
    animation: none !important;
    transition-duration: .01ms !important;
    transform: none !important;
    scroll-behavior: auto !important;
  }
}
```


## Absolute Bans

- Refero anti-dilution: do not combine Warp sage, N8n ember, and (dot)connect orange/blue as peer CTAs; one action grammar per page.
- Do not add shadows to Warp or (dot)connect flat surfaces, and do not substitute generic Inter-only display for source-specific type.

- No fake terminal text that does not parse as a plausible command.
- No random glowing gradients as proof of technicality.
- No mono for body paragraphs unless the brand demands it.
- No syntax rainbow sprayed across non-code UI.
- No vague "AI-powered infrastructure" claim without code/data/diagram proof.
- No hidden focus states on copy buttons, tabs, API key fields, or docs links.
- No hover lift as the main interaction. Use border, fill, syntax, row highlight, or command state.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## Production Patterns

### Type Ladder

- Display: 48-80px, tight or source-specific tracking, used for H1/H2 only.
- UI: 13-18px, clear line height, used for nav/buttons/body.
- Metadata: 12-13px, often medium weight or mono, used for versions/status/timestamps.
- Code: 12-14px mono, line-height 1.45-1.65, horizontal scroll allowed.

### Button Families

- Antimetal: chartreuse filled pill for conversion, dark ghost pill on the hero, light ghost pill on product surfaces. Never make all buttons chartreuse.
- Plain: compact green filled action with dark text, pale ghost action with green border/text, small 6px radius. Good for tool commands.
- Cursor: orange outlined action and transparent inputs. Primary can be outline-first if the rest of the page has strong software-panel proof.
- Linear: lime filled action for the main command, transparent links for secondary navigation, no large glossy buttons.
- Mercury: blue primary pill, ghost header pill, and text-only nav. Avoid card-like button groups in spacious dark layouts.

### Form And Input Patterns

- API key fields: use mono value, reveal/copy buttons, "last used" metadata, and clear revoked/expired states.
- Joined email input: use only in Mercury-like spacious dark pages; field and CTA must align exactly and share height.
- Search/docs input: include keyboard hint, focused ring, no-results state, and recent searches.
- Terminal prompt input: keep prompt marker fixed width, use monospace for the command, and make the run/copy action accessible.

### Diagram Rules

- Use labels on every node; icons alone are not technical proof.
- Use directional edges with protocol labels: `REST`, `webhook`, `stream`, `batch`, `SQL`, `vector`.
- Keep node shapes consistent with the chosen source radius. Cursor can be 4/8px, Linear 6px, Mercury 4px containers with pill controls.
- If diagram motion is present, it must highlight a specific path and end in a readable static state.

### Code Content Rules

- Commands should be plausible for the domain: install, authenticate, deploy, ingest, subscribe, query, migrate.
- API responses should include status, latency, request ID, and at least one realistic field.
- Code samples should never be lorem ipsum. Use typed names, environment variables, endpoint paths, or SDK methods.
- Copy buttons need copied, error, and disabled states. Copy success should update text, not rely on color alone.

### Surface Ladder

- Dark hero or page canvas if source demands.
- Product surface for code/API/diagram.
- Nested code/readout panel.
- Active line or selected row.
- Status chip with label and state.

### Mobile Rules

- Code blocks may scroll horizontally; do not wrap commands into unreadable fragments.
- Architecture diagrams collapse into stacked nodes plus an ordered flow list.
- Docs sidebars become a select, drawer, or command palette.
- Hero CTAs stack with full-width targets only when labels remain readable.
- Dark pages need extra spacing on mobile so dense technical labels do not merge into one black block.
- Preserve visible line-height in code; clipped descenders make the whole system feel careless.

### Copy Rules

Use nouns from the system: build, deploy, webhook, token, event, workflow, queue, schema, trace, endpoint, migration, region, branch. Avoid generic copy like "seamless experiences" unless paired with concrete proof.

## Pre-Output Checklist

- First viewport contains a real code/API/diagram proof.
- One Technical Sans archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to command/deploy transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
