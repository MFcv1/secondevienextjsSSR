---
name: dark-ui
description: "Use this skill to create Dark UI visual design systems that feel focused, immersive, premium, technical, calm, deep. USE FOR: dark dashboards, AI tools, premium apps, developer consoles, command centers, immersive product interfaces. DO NOT USE FOR: unrelated backend work, non-visual tasks, or when an existing product design system must be followed exactly."
---

# Dark UI Skill

## Mandatory `<design_plan>`

Before substantial UI code, output a compact `<design_plan>` block. Include:

1. **Use case:** page/app type, audience, primary action, emotional target.
2. **Style direction:** one Dark UI archetype below.
3. **Operating mode:** density, motion, decoration, contrast, radius, and asset burden.
4. **First viewport:** nav type, H1 width/line strategy, dark product surface with logs, panels, command input, or metrics, CTA treatment, next-section hint.
5. **System contracts:** type, color, surface, radius, spacing, depth, state, and motion tokens.
6. **Component plan:** at least four concrete Dark UI components with states.
7. **Motion plan:** panel depth, reveal, or focus transition, timing, performance guardrail, and reduced-motion fallback.
8. **Anti-slop sweep:** top three failure modes for this style and how you will avoid them.

If the request is tiny, do this mentally and keep the final answer concise.


## Core Directive

Build Dark UI as a calm, legible product environment with depth, focus, and operational confidence. Unlike Cyber Neon, Dark UI does not need pure black, theatrical glow, scanline atmosphere, or constant emitted light. It uses a charcoal/navy surface ladder, restrained accents, clear state design, and product proof. The result should feel premium and usable for hours, not like a nightclub interface.

Use this skill for dark dashboards, AI tools, premium apps, developer consoles, command centers, analytics products, writing tools, financial surfaces, and immersive product interfaces where users need to read, decide, compare, configure, and act.


For substantial UI work, output a compact `<design_plan>` block before code:

1. Use case, audience, primary workflow, and emotional target.
2. Archetype chosen from this skill.
3. Surface ladder: page, base panel, raised panel, selected panel, overlay, focus.
4. First viewport: nav, product proof, action hierarchy, and next-section hint.
5. Component plan: at least four dark product components with states.
6. Motion plan: reveal, panel depth, data motion, and reduced-motion behavior.
7. Anti-slop sweep: top three failure modes and how the build avoids them.

For tiny tasks, keep the plan internal. For app shells, dashboards, redesigns, and full pages, include it.

## Style Operating Mode

| Control | Setting |
| --- | --- |
| density | Medium-high for apps, medium for websites. |
| motion | Medium. Use depth, panel reveal, smooth state transition, and subtle background drift. |
| decoration | Low-medium. Use depth, lines, and atmospheric light sparingly. |
| contrast | Dark substrate with readable text and clearly stepped surfaces. |
| radius | 8-14px for product panels, 999px for segmented controls. |
| type | Modern sans with mono for code/data only. |
| assets | Product screenshots, command panels, agent messages, graphs, dark photography. |

## Signature System

- Surface Ladder: every panel uses a distinct tone or border; active panels receive accent edge or raised contrast.
- Command Center Rhythm: large central task panel + side utility rail + bottom status/metadata band.
- Premium Darkness: deep navy/charcoal with one cool accent feels more refined than pure black.
- Readable Microcopy: metadata can be muted, but core labels and values must pass contrast.

## Differentiation

Use Dark UI when dark dashboards, AI tools, premium apps, developer consoles, command centers, immersive product interfaces. If removing the dark product surface, token rules, or signature components leaves a generic page, this skill is the right lens and the signature object must stay. Use `cyber-neon` when emitted light and kinetic signal are the identity; use `technical-ui` when workflow density matters more than atmosphere.
## Non-Negotiable Principles

- Make darkness from a ladder, not a bucket of black. Every surface must have a role.
- Prefer charcoal, navy, ink, and slate over pure black except in media wells or terminal blocks.
- Accent color has a job: action, selection, progress, risk, or status. It is not body text decoration.
- Depth comes from tone, border, translucency, and crisp focus, not heavy blurred shadows.
- Text must be comfortable at small sizes. Muted copy is still readable.
- A dark app needs quiet empty, loading, error, success, and disabled states.
- Dark UI is calmer than Cyber Neon: fewer glowing edges, less scanline texture, less theatrical motion, more product density.


## Charcoal/Navy Surface Ladder

Use this ladder before choosing colors. Values may adapt to a brand, but the step relationships should remain.

| Layer | Role | Typical token | Usage |
| --- | --- | --- | --- |
| Page | Ambient backdrop | `--du-bg` | Full app/page background; deep charcoal or navy. |
| Base | Main work surface | `--du-surface-1` | Primary app shell, large sections, dashboard canvas. |
| Raised | Grouped modules | `--du-surface-2` | Cards, panels, nav, drawers. |
| Interactive | Clickable module | `--du-surface-3` | Buttons, rows, selectable cards, inputs. |
| Selected | Active module | `--du-surface-selected` | Current tab, active row, chosen plan, focused conversation. |
| Overlay | Modal/popover | `--du-overlay` | Dialogs, menus, command palettes; slightly clearer and higher contrast. |
| Focus | Accessibility | `--du-focus` | Visible rings and active outlines. |

Surface rules:
- The page and base surface should differ by at least a visible tone step.
- Borders are usually `rgba(255,255,255,.06-.12)` or accent-tinted for active states.
- Selected surfaces need more than color: add label, icon, border, or positional indicator.
- Avoid giant transparent cards over busy gradients; use protected readable panels.

## Raw-Derived Archetypes

### Additional Refero Source Packs

- Analogue monochrome dark: `#000000/#1c1c1c/#ededed/#ffffff/#7a7a7a/#a6a6a6`; Graphik Medium/system 400/500 with 11/13/17/18/40/60px, display tracking to `-0.05em`; 10px base rhythm, 40px sections, 10px cards/images, 13px buttons/links; frosted nav and overlay cards use tonal separation before shadows.
- Inngest dark workflow: `#0c0a09/#1c1917/#44403c/#ffffff/#f6f6f6/#a89984`, accent `#cab16a`, success `#59a569`, warning `#cc5b33`, error `#ea6962`; CircularXX 300-600 12-72px, CircularXXMono 12/14/18px, Whyte Inktrap 72px `-0.056em`; 8px base, 24-40px sections, 4-24px gaps, 4px controls, 9999px pills.
- Giga dark data shell: `#000000/#161717/#cccccc/#4d4d4d/#8a8f98/#ffffff`, signal `#fe2c02`, success `#49de80`; Inter 300/400/500 with Geist Mono, display 48px `-0.03em`; 48px sections, 24px card padding, 10px gaps; controls 10px, cards 16px, ghost pills 1000px.

- Linear, "Midnight Command Center": canvas `#08090a/#0f1011/#161718`, panels `#23252a/#323334/#383b3f`, text `#f7f8f8/#d0d6e0/#8a8f98/#62666d`, lime CTA `#e4f222`, accents `#5e6ad2/#02b8cc/#6366f1/#8b5cf6`; Inter Variable plus Berkeley Mono; scale `10/14/24/48/72`, tracking `-0.1px` to `-0.22px`; 4px grid, cards/buttons/inputs 6px, tags 2px, badges 4px, pills 9999px.
- Authkit, "Authentication Glass Dark": `#05060f`, `#ffffff`, `#d8ecf8`, `#d1e4fa`, `#b6d9fc`, `#c7d3ea`, `#3f4959`, `#9da7ba`, action `#663af3`, highlight `linear-gradient(90deg, transparent, rgba(186,215,247,.12), transparent)`; Untitled Sans, aeonikPro, dotDigital; display 44px, headings 28/24px, body 14px; pills/buttons 999px, cards 12-16px, badges 6px, inputs 2-4px.
- Slash, "Black Editorial Product": black stack `#000/#030304/#08080a/#121317/#1c1d22`, text `#5e616e/#777a88/#acafb9/#cdcdcd/#e2e3e9/#fff`, one golden gradient; Inter plus Ivy Presto; display 88px, heading-lg 48px; 6px element gaps, 160px sections, 10px cards, 0/2px sharp edges and 9999px pills.
- Dimension, "Spotlight Dark Product": `#0a0a0a/#161616/#282828`, text `#686868/#b2b2b2/#c2c2c2/#e5e5e5/#fff`, radial aura and interactive glow; DM Sans, Geist, system-ui; display `48px/1/-0.672px`, body `16px/1.5/0.4px`; cards 24px, callouts/icons 10px, hero sections 40px, buttons 9999px; `backdrop-filter: blur(4px)` only on protected translucent pieces.
- Altitude, "Technical Premium Dark": `#181818/#262626/#323232/#eeeeee/#ffffff/#1a365d/#2b7fff/#5c9fe9`; Libre Baskerville display, Inter UI, Fira Code; display `72px/1.1/-0.025em`; 72px sections, 8px gaps, default 4px, cards 8px, large cards 16px; shadow `0 2px 15px rgba(51,51,51,.05)`.

### beehiiv Galactic SaaS

Use when a SaaS marketing/product interface needs deep navy, confident display type, pill CTAs, and a magenta/blue accent moment. It works for creator tools, growth tools, newsletters, and product launches.

Carry forward:
- Deep navy background with white headline and restrained magenta/blue accent.
- Bipolar geometry: pill CTAs with cleaner rectangular feature cards.
- Feature/testimonial cards with dark fill and strong typographic hierarchy.
- Accent gradient reserved for a hero CTA or one high-value path.

Avoid:
- Turning every button into a gradient.
- Generic "space" decoration without product evidence.

### Fey Financial Dark

Use for finance, portfolio, analytics, watchlists, and calm decision tools. The raw signal is multi-tier black/gray panels, one precise accent, app preview cards, notification bubbles, and polished chart space.

Carry forward:
- Single-font discipline and clear numeric hierarchy.
- App preview cards with balanced margins and high contrast.
- Compact pills for alerts, holdings, and selected filters.
- Smooth reveal and scroll behavior that feels expensive.

Avoid:
- Neon styling that makes financial data feel untrustworthy.
- Muted numbers that users cannot compare quickly.

### Bun Synthwave Dev Tool

Use for developer tooling, runtime benchmarks, CLIs, docs, code panels, and performance narratives. It brings charcoal canvas, mono code, command input, performance bars, and restrained highlight colors.

Carry forward:
- Charcoal/smoke surfaces with strong code readability.
- Command line input as a signature component.
- Bar graphs and benchmark proof.
- Body/system font with mono only where useful.

Avoid:
- Making all text mono.
- Using cute novelty colors in dense code/data sections.

### Circle Soft Galactic Community

Use for community, membership, social product, education, and collaborative apps where dark should feel soft and human. It uses rounded controls, translucent highlight cards, and soft pastel accents.

Carry forward:
- Extreme pill controls for onboarding and primary paths.
- Gentle card contrast and friendly empty states.
- Dark-themed feature cards with warm text and calm icons.
- Input fields that feel safe and approachable.

Avoid:
- Over-rounding dense admin tables.
- Low-contrast pastel text on dark surfaces.

### Superwhisper Celestial Command

Use for AI tools, voice products, productivity apps, and premium utilities. It combines dark command surfaces with occasional light download/action slabs, success/warning badges, and gradient feature modules.

Carry forward:
- Command input, transcription or agent thread as hero proof.
- Light-on-dark and dark-on-light controls where action clarity demands it.
- Badges for success/warning with restrained color.
- A mostly calm interface with one celestial accent field.

Avoid:
- White cards sprinkled randomly through a dark page.
- Background gradients behind small body text.

## Semantic Token Packs

### Ink Product

```css
:root {
  --du-bg: #080a0f;
  --du-surface-1: #0d1018;
  --du-surface-2: #141824;
  --du-surface-3: #1b2130;
  --du-surface-selected: #20283a;
  --du-overlay: #111827;
  --du-text: #f7f8fb;
  --du-muted: #a2a9b8;
  --du-subtle: #737b8d;
  --du-line: rgba(255,255,255,.09);
  --du-line-strong: rgba(255,255,255,.16);
  --du-accent: #7c8cff;
  --du-accent-text: #eef0ff;
  --du-success: #43d18b;
  --du-warning: #f4b84a;
  --du-danger: #ff667a;
  --du-focus: #9aa7ff;
  --du-radius-panel: 12px;
  --du-radius-control: 999px;
}
```

### Navy Premium

```css
:root {
  --du-bg: #060419;
  --du-surface-1: #0d0b24;
  --du-surface-2: #171433;
  --du-surface-3: #211d44;
  --du-surface-selected: #2b2656;
  --du-overlay: #12102b;
  --du-text: #ffffff;
  --du-muted: #c4c2d6;
  --du-subtle: #8b88a9;
  --du-line: rgba(196,194,214,.14);
  --du-accent: #8b7cff;
  --du-accent-2: #ff5ec4;
  --du-success: #4ade80;
  --du-warning: #f5c451;
  --du-danger: #ff6384;
  --du-focus: #c7c2ff;
  --du-radius-panel: 16px;
}
```

### Charcoal Developer

```css
:root {
  --du-bg: #1f2027;
  --du-surface-1: #282a36;
  --du-surface-2: #303341;
  --du-surface-3: #3a3e4f;
  --du-surface-selected: #41465c;
  --du-overlay: #232631;
  --du-text: #f4f4f6;
  --du-muted: #b7bac7;
  --du-subtle: #858a99;
  --du-line: rgba(255,255,255,.10);
  --du-accent: #f6c177;
  --du-success: #a6e3a1;
  --du-warning: #f6c177;
  --du-danger: #ff7b93;
  --du-focus: #f6c177;
  --du-radius-panel: 8px;
}
```

### Execution Token Contract

Refero ready-to-use deltas from Analogue/Inngest/Giga:
- Token roles: Analogue monochrome `#000000/#1c1c1c/#ededed/#ffffff/#7a7a7a/#a6a6a6`; Inngest `#0c0a09/#1c1917/#44403c` with amber `#cab16a` and status `#59a569/#cc5b33/#ea6962`; Giga `#000000/#161717/#cccccc/#4d4d4d/#8a8f98/#ffffff` with signal `#fe2c02` and success `#49de80`.
- Type roles: Analogue Graphik 11-60px with display tracking to `-0.05em`; Inngest CircularXX/Whyte Inktrap 12-72px; Giga Inter 300/400/500 plus Geist Mono for data.

Every Dark UI build must declare these tokens before component styling. Source packs can tune values, but components must use this vocabulary.

```css
:root {
  --canvas: #08090c;
  --surface: #11131a;
  --surface-muted: #171a23;
  --text: #f7f8fb;
  --text-muted: #a7adbb;
  --line: #2a2f3a;
  --action: #7c8cff;
  --action-strong: #a5b4ff;
  --radius-control: 10px;
  --radius-card: 12px;
  --radius-panel: 16px;
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
  --shadow-card: 0 0 0 1px rgba(255,255,255,.06), 0 12px 32px rgba(0,0,0,.22);
  --shadow-panel: 0 20px 70px rgba(0,0,0,.34);
  --shadow-hero: 0 40px 110px rgba(0,0,0,.48);
  --shadow-modal: 0 24px 80px rgba(15,23,42,.16);
  --shadow-action: 0 6px 18px color-mix(in srgb, var(--action), transparent 72%);
  --status-success-bg: rgba(52,211,153,.14);
  --status-success-fg: #34d399;
  --status-info-bg: rgba(96,165,250,.14);
  --status-info-fg: #60a5fa;
  --status-warning-bg: rgba(251,191,36,.16);
  --status-warning-fg: #fbbf24;
  --status-danger-bg: rgba(248,113,113,.16);
  --status-danger-fg: #f87171;
  --status-neutral-bg: rgba(255,255,255,.08);
  --status-neutral-fg: #a7adbb;
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

| Tailwind default | Dark UI token |
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
| `bg-black` everywhere | stepped surface ladder: `--canvas`, `--surface`, `--surface-muted` |
| `text-gray-500` on core labels | `--text-muted` only for secondary metadata |

Status words:

| Role | Words |
| --- | --- |
| `success` | Approved, Synced, Live, Paid, Complete, Stable |
| `info` | Active, In review, Processing, Current, Draft |
| `warning` | Pending, Stale, Slow, Watch, Needs review |
| `danger` | Failed, Blocked, Critical, Error, Escalate |
| `neutral` | Empty, Disabled, Skipped, Archived, Ready passive |

Token rule: if a value can be expressed by `du`/style tokens, do not invent raw Tailwind scale, arbitrary rgba shadows, or new status hex.
## Accent Job Lock

| Accent role | Allowed usage | Forbidden usage |
| --- | --- | --- |
| Primary action | Main CTA, selected nav, important submit button. | Every card title or paragraph keyword. |
| Selection | Active tab, chosen row, selected plan, selected message. | Decoration with no state meaning. |
| Progress | Loading step, chart highlight, deployment stage. | Continuous animated strip behind content. |
| Status | Success, warning, danger, online/offline. | Reusing one status color for marketing emphasis. |
| Focus | Keyboard and accessibility ring. | Invisible outline or focus only by opacity. |

## First Viewport Protocol

Refero layout deltas:
- Analogue: 10px rhythm, 40px sections, 10px cards/images, 13px buttons/links; use frosted nav and overlay cards.
- Inngest: 8px base, 24-40px sections, 4-24px gaps, 4px controls, 9999px pills; workflow evidence first.
- Giga: 48px sections, 24px card padding, 10px gaps, 10px controls, 16px cards, 1000px ghost pills; expose AI/data panels.

Dark UI first viewports should prove product quality immediately:

- Nav: app-like rail, compact topbar, command nav, or calm marketing nav with active state.
- Headline: concrete product/category; avoid vague atmospheric slogans.
- Proof: show an app shell, dashboard, command palette, agent thread, code/log panel, chart, or workflow.
- CTA: one primary action, one secondary action. Secondary may be ghost or text but must be visible.
- Fold hint: show a row of modules, metrics, pricing, docs, or workflow continuation.

For apps, the first screen may be the actual workspace rather than a hero. In that case, prioritize navigability, filters, loading/error states, and data density over a marketing H1.

## Signature Components

Refero component deltas:
- Analogue: frosted nav, monochrome overlay cards, 10px image/card radius, 13px links.
- Inngest: amber CTA pill, workflow panels, 4px controls, mono IDs, success/warn/error chips.
- Giga: transparent overlays, ghost pill buttons, code/data snippets, `#fe2c02` signal only for action/alert.
- State transfer: Analogue hover/focus uses tone steps between `#1c1c1c/#7a7a7a/#ededed`; Inngest maps success/warn/error to `#59a569/#cc5b33/#ea6962`; Giga maps action/success to `#fe2c02/#49de80`.

Use at least four for full-page or app work.

### Refero Expansion Component Deltas

- Dark UI buttons must pick one accent grammar: Linear lime primary with graphite ghost controls, Authkit violet pill CTA with outline/glass secondary, Slash golden editorial pill, Dimension ghost/pill spotlight controls, or Altitude blue technical progress. Do not add a second bright CTA color.
- Panels should separate with tone steps and precise radius: Linear 6px graphite cards, Authkit 12-16px inner-glow cards, Slash 10px black cards, Dimension 24px translucent spotlight cards, Altitude 8/16px technical cards.
- Inputs must remain legible on black: Authkit inputs use 2-4px radius, Linear command inputs 6px with mono support, Slash pill inputs 9999px, Dimension floating pill bars, Altitude code/search modules with Fira Code.

| Component | Use | Required states |
| --- | --- | --- |
| `DarkCommandInput` | AI prompt, CLI, search, action launcher, command palette. | idle, focus, typing, loading, error, submitted, disabled. |
| `StackedInsightPanel` | Summary, analytics, recommendations, account health. | loading, empty, stale, success, error. |
| `StatusSidebar` | Navigation, filters, incidents, spaces, projects. | collapsed, expanded, active, alert, keyboard focus. |
| `LogConsole` | Deploys, runtime logs, code output, audit events. | streaming, paused, copied, error, empty. |
| `MetricGlassCard` | KPI and trend cards in premium dashboards. | idle, hover, selected, loading, degraded. |
| `AgentThread` | AI conversations, notes, transcription, review queues. | user, assistant, pending, failed, regenerated. |
| `DeployTimeline` | Progress, workflows, imports, syncing. | queued, active, complete, failed, cancelled. |
| `FocusRingControl` | Buttons, segmented controls, toggles, tabs. | hover, focus-visible, pressed, selected, disabled. |

### Core Component Kit

Use these components before inventing new surfaces. Rename in implementation if needed, but preserve the props, states, and token usage.

```tsx
type DarkUiState = "default" | "hover" | "selected" | "loading" | "empty" | "error" | "success";
type DarkUiStatus = "success" | "info" | "warning" | "danger" | "neutral";

export function DarkUiStatusPill({ role, children }: { role: DarkUiStatus; children: React.ReactNode }) {
  return <span className="dark-ui-status-pill" data-role={role}>{children}</span>;
}

export function DarkCommandInputContract({ state = "default" }: { state?: DarkUiState }) {
  return <section className="dark-ui-hero-object" data-state={state} aria-label="Dark UI proof object" />;
}

export function StackedInsightPanelContract({ title, meta, state = "default" }: { title: string; meta: string; state?: DarkUiState }) {
  return <article className="dark-ui-card" data-state={state}><span>{meta}</span><strong>{title}</strong></article>;
}

export function StatusSidebarContract({ items }: { items: string[] }) {
  return <nav className="dark-ui-rail">{items.map((item, index) => <button data-active={index === 0} key={item}>{item}</button>)}</nav>;
}

export function DarkUiSectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="dark-ui-section-head"><span>{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
```

```css
.dark-ui-status-pill {
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
.dark-ui-status-pill[data-role="success"] { background: var(--status-success-bg); color: var(--status-success-fg); }
.dark-ui-status-pill[data-role="info"] { background: var(--status-info-bg); color: var(--status-info-fg); }
.dark-ui-status-pill[data-role="warning"] { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.dark-ui-status-pill[data-role="danger"] { background: var(--status-danger-bg); color: var(--status-danger-fg); }
.dark-ui-hero-object {
  min-height: clamp(320px, 48vw, 620px);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-hero);
  overflow: hidden;
}
.dark-ui-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: background 180ms var(--ease-product), box-shadow 180ms var(--ease-product), transform 180ms var(--ease-product);
}
.dark-ui-card[data-state="selected"] { background: var(--state-selected-bg); box-shadow: var(--shadow-panel); }
.dark-ui-card[data-state="loading"] { opacity: .62; pointer-events: none; }
.dark-ui-card[data-state="error"] { border-color: var(--status-danger-fg); }
.dark-ui-card > span { font: var(--type-meta); color: var(--text-muted); }
.dark-ui-card > strong { font: var(--type-card); color: var(--text); }
.dark-ui-rail { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.dark-ui-rail button { padding: var(--s-2) var(--s-4); border: 1px solid var(--line); border-radius: var(--radius-control); background: var(--surface); font: var(--type-ui); color: var(--text-muted); }
.dark-ui-rail button[data-active="true"] { background: var(--state-selected-bg); color: var(--text); box-shadow: var(--state-focus-ring); }
.dark-ui-section-head { display: grid; gap: var(--s-3); max-width: 760px; }
.dark-ui-section-head > span { font: var(--type-mono-xs); letter-spacing: var(--track-mono-xs); text-transform: uppercase; color: var(--text-muted); }
.dark-ui-section-head h2 { margin: 0; font: var(--type-section); letter-spacing: var(--track-section); text-wrap: balance; color: var(--text); }
.dark-ui-section-head p { margin: 0; font: var(--type-body); color: var(--text-muted); }
@media (max-width: 760px) {
  .dark-ui-hero-object { min-height: 280px; }
  .dark-ui-rail { overflow-x: auto; flex-wrap: nowrap; }
}
```
## Component Blueprints

### DarkCommandInput

Structure:
- Outer shell uses raised surface and clear border.
- Input text sits on a base field, not directly on page background.
- Action button has the only strong accent fill.
- Shortcuts and mode pills are muted but readable.
- Error copy appears below without changing shell height.

```tsx
type DarkCommandState = "idle" | "typing" | "loading" | "error" | "submitted" | "disabled";

export function DarkCommandInput({ state = "idle" }: { state?: DarkCommandState }) {
  return (
    <form className="du-command" data-state={state}>
      <div className="du-command__field">
        <span className="du-command__mode">AI</span>
        <label className="sr-only" htmlFor="dark-command">Command</label>
        <input id="dark-command" placeholder="Ask, search, or run a workflow" disabled={state === "disabled"} />
        <kbd>Cmd K</kbd>
      </div>
      <button disabled={state === "loading" || state === "disabled"}>
        {state === "loading" ? "Running" : "Run"}
      </button>
      {state === "error" && <p className="du-command__message">The workflow stopped. Review inputs and retry.</p>}
    </form>
  );
}
```

```css
.du-command {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 10px;
  color: var(--du-text);
  background: var(--du-surface-2);
  border: 1px solid var(--du-line);
  border-radius: var(--du-radius-panel);
}
.du-command__field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 12px;
  background: var(--du-surface-1);
  border: 1px solid var(--du-line);
  border-radius: calc(var(--du-radius-panel) - 4px);
}
.du-command input {
  min-width: 0;
  color: var(--du-text);
  background: transparent;
  border: 0;
  outline: 0;
}
.du-command:focus-within {
  border-color: var(--du-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--du-focus), transparent 74%);
}
.du-command button {
  min-height: 44px;
  padding: 0 18px;
  color: var(--du-accent-text, #fff);
  background: var(--du-accent);
  border: 0;
  border-radius: calc(var(--du-radius-panel) - 4px);
}
.du-command__message {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--du-danger);
}
@media (max-width: 560px) {
  .du-command { grid-template-columns: 1fr; }
  .du-command button { width: 100%; }
}
```

### StackedInsightPanel

Use for dashboards and AI summaries. The stack should show hierarchy: headline insight, supporting metrics, evidence, and action.

State behavior:
- Loading: skeleton rows in the same structure.
- Empty: explain what event or data source is needed.
- Stale: show timestamp and refresh action.
- Error: include recovery path.
- Success: confirm update with subtle status color, not confetti.

```tsx
export function StackedInsightPanel({ status = "ready" }: { status?: "ready" | "loading" | "empty" | "error" }) {
  return (
    <section className="du-insight" data-status={status}>
      <header>
        <p>Portfolio health</p>
        <strong>{status === "loading" ? "Calculating..." : "3 risks need review"}</strong>
      </header>
      <div className="du-insight__grid">
        <span><b>12</b> accounts</span>
        <span><b>4.8%</b> drift</span>
        <span><b>18m</b> updated</span>
      </div>
      <button>Open review</button>
    </section>
  );
}
```

```css
.du-insight {
  display: grid;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(180deg, var(--du-surface-2), var(--du-surface-1));
  border: 1px solid var(--du-line);
  border-radius: var(--du-radius-panel);
}
.du-insight header {
  display: grid;
  gap: 6px;
}
.du-insight header p {
  margin: 0;
  color: var(--du-muted);
  font-size: 13px;
}
.du-insight header strong {
  color: var(--du-text);
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  line-height: 1;
}
.du-insight__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.du-insight__grid span {
  min-width: 0;
  padding: 12px;
  background: var(--du-surface-3);
  border: 1px solid var(--du-line);
  border-radius: 10px;
}
@media (max-width: 640px) {
  .du-insight__grid { grid-template-columns: 1fr; }
}
```

### StatusSidebar

Use for app navigation, filters, incident lists, project spaces, or settings.

Rules:
- Active item gets a selected surface and left/right indicator.
- Alert item gets badge plus label, not color alone.
- Collapsed state keeps tooltips or accessible labels.
- Mobile becomes bottom tabs, drawer, or compact top filter row.

### LogConsole

Use for developer consoles, observability, audit trails, and background jobs.

Rules:
- Mono only inside log rows and timestamps.
- Streaming state should append rows without shifting the header.
- Paused state freezes scroll and shows resume action.
- Error rows use danger token plus readable copy.
- Copy action provides success feedback.

```css
.du-log {
  overflow: hidden;
  background: #0a0c12;
  border: 1px solid var(--du-line);
  border-radius: var(--du-radius-panel);
}
.du-log__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--du-surface-2);
  border-bottom: 1px solid var(--du-line);
}
.du-log__body {
  max-height: 360px;
  overflow: auto;
  padding: 12px 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #d7dce8;
}
.du-log__row[data-kind="error"] { color: var(--du-danger); }
.du-log__row[data-kind="success"] { color: var(--du-success); }
```

### AgentThread

Use for AI chat, review queues, voice transcripts, and assistive workflows.

Rules:
- User and assistant messages differ by surface and alignment, not novelty bubbles everywhere.
- Pending messages include progress language and cancel option.
- Failed generation includes retry and report actions.
- Regenerated content should indicate version or timestamp.
- Mobile keeps input sticky only if it does not cover the latest message.

## App Shell Patterns

### Command Center

Use for monitoring, operations, analytics, and admin tools.

- Left sidebar: spaces, systems, filters, or projects.
- Topbar: search/command, date range, user actions.
- Main grid: primary chart/table plus secondary insight panels.
- Right rail: alerts, notes, details, or activity.
- Bottom band: sync status, environment, version, or bulk actions.

### AI Workspace

Use for copilots, writing tools, agent products, voice tools, and review assistants.

- Center: thread, canvas, transcript, or selected artifact.
- Input: command bar or composer with mode controls.
- Side panels: context, sources, history, settings.
- Status: model, latency, confidence, file/data state.
- Empty state: example prompts tied to actual product tasks.

### Developer Console

Use for docs, CLI tools, runtimes, infrastructure, and deployments.

- Command or install snippet near top.
- Code/log card with copy states.
- Benchmark or metric proof.
- Integration table or environment selector.
- Clear error states with recovery commands.

### Premium Product Dark

Use for polished marketing pages with real product surfaces.

- Hero object is a screenshot, device, canvas, or rendered product.
- Headline stays readable; ambient light sits behind object.
- CTA and secondary action are high contrast.
- Proof sections use app modules, not generic feature cards.

## Motion System

Refero motion delta:
- No source-specific durations were observed for Analogue/Inngest/Giga. Use existing dark-ui timing; restrict motion to opacity, border, background, and small transform while preserving text contrast.

- Dark UI motion is low-amplitude: 120-220ms hover/focus, 180-280ms panel reveal, 300-500ms spotlight fade. Animate opacity, transform, border, and glow alpha; do not animate large blur or make gradients compete with text. Reduced motion keeps active borders, labels, and icon state.

## Complete Page Protocols

```tsx
// AI Workspace
<main data-skill="dark-ui" data-archetype="ai-workspace">
  <DarkUINav mode="compact" primaryAction="Run task" />
  <DarkCommandInputContract state="selected" />
  <AgentThreadContract messages={conversationWithSources} />
  <StackedInsightPanelContract title="Context" meta="12 files indexed" />
  <StatusSidebarContract items={["Ready", "Queued", "Blocked"]} />
</main>

// Ops Command
<main data-skill="dark-ui" data-archetype="ops-command">
  <MetricGlassCardContract title="Incidents" meta="2 open" state="warning" />
  <LogConsoleContract stream={deployEvents} />
  <DeployTimelineContract state="loading" />
  <DarkUIStatusPill role="danger">Escalated</DarkUIStatusPill>
</main>
```
```tsx
// AI Workspace
<main data-skill="dark-ui" data-archetype="ai-workspace">
  <DarkUINav mode="compact" primaryAction="Run task" />
  <DarkCommandInputContract state="selected" />
  <AgentThreadContract messages={conversationWithSources} />
  <StackedInsightPanelContract title="Context" meta="12 files indexed" />
  <StatusSidebarContract items={["Ready", "Queued", "Blocked"]} />
</main>

// Ops Command
<main data-skill="dark-ui" data-archetype="ops-command">
  <MetricGlassCardContract title="Incidents" meta="2 open" state="warning" />
  <LogConsoleContract stream={deployEvents} />
  <DeployTimelineContract state="loading" />
  <DarkUIStatusPill role="danger">Escalated</DarkUIStatusPill>
</main>
```
Dark UI motion should feel smooth and expensive:

- Panel entrance: opacity + 12-24px translate, once per section.
- Active nav: indicator slides between items, not full component resize.
- Chart growth: bars scale from origin, values appear after motion.
- Loading: skeleton and progress, not flashy shimmer across the whole page.
- Background drift: optional, very slow, low contrast, never behind dense text.
- Command completion: brief state change, icon swap, or progress line.

```css
@keyframes du-panel-in {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes du-bar-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.du-reveal { animation: du-panel-in 520ms cubic-bezier(.16,1,.3,1) both; }
.du-bar { transform-origin: left center; animation: du-bar-grow 900ms cubic-bezier(.16,1,.3,1) both; }
@media (prefers-reduced-motion: reduce) {
  .du-reveal, .du-bar { animation: none !important; transform: none !important; }
}
```

Reduced motion:
- Keep selected states, focus rings, and loading labels visible.
- Replace animated chart growth with final values.
- Disable background drift and looping shimmer.
- Preserve UI state through text, icons, borders, and surface tone.


## Absolute Bans

- Refero anti-dilution: do not combine Analogue achrome, Inngest amber, and Giga ember as parallel CTAs.
- Do not add saturated gradient backgrounds to Analogue or Giga; color must attach to action/status only.

- No muddy gray-on-black for important text.
- No indistinguishable panel stack.
- No gradient fog to cover weak hierarchy.
- No raw Tailwind typography, spacing, radius, color, or shadow defaults when a style token exists.
- No generic centered hero without the style's required proof/media/type object.
- No status colors without semantic role mapping and visible text.
- No component states left implicit: include hover, focus-visible, selected, loading, empty, error, success where relevant.

## Reference Use

For deeper source extraction, load `references/refero-style-database.md`. For source-specific inspiration, load only the selected file under `references/sources/`.
## State Pattern

```tsx
const darkUiState = {
  idle: "bg-[color:var(--du-surface-2)] border-[color:var(--du-line)]",
  hover: "hover:bg-[color:var(--du-surface-3)] hover:border-[color:var(--du-line-strong)]",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--du-focus)]",
  selected: "data-[selected=true]:bg-[color:var(--du-surface-selected)] data-[selected=true]:border-[color:var(--du-accent)]",
  loading: "aria-busy:pointer-events-none aria-busy:cursor-wait",
  disabled: "disabled:pointer-events-none disabled:text-[color:var(--du-subtle)] disabled:bg-[color:var(--du-surface-1)]",
  error: "data-[state=error]:border-[color:var(--du-danger)] data-[state=error]:text-[color:var(--du-danger)]",
  success: "data-[state=success]:border-[color:var(--du-success)] data-[state=success]:text-[color:var(--du-success)]"
};
```

## Typography Rules

- Use one modern sans family for most UI.
- Use mono for code, logs, command shortcuts, technical IDs, and metric labels only.
- Keep body copy between 14px and 18px with comfortable line-height.
- For dashboard numbers, use tabular figures if available.
- Avoid negative letter spacing. Use 0 letter spacing unless the existing system requires otherwise.
- Do not make muted text smaller and lower contrast at the same time in critical rows.

## Content Evidence Rules

Dark UI becomes convincing when the screen contains operational evidence. Replace vague cards with concrete product matter:

- For AI products, show source chips, confidence, model state, pending work, and editable output.
- For finance, show value, delta, timeframe, risk label, and data freshness on the same surface.
- For developer tools, show command, result, runtime, environment, and recovery path.
- For command centers, show severity, owner, timestamp, status, and next action.
- For premium product pages, use real screenshot crops, feature states, integration names, and plan limits.

Do not fill dark panels with empty marketing adjectives. A calm dark interface needs specifics because the palette is quiet; content carries much of the perceived quality.

## Accessibility And Contrast

- Body text and core labels must pass contrast on their exact surface.
- Focus states must be visible on every surface level.
- Selection cannot be color-only: use indicator, icon, check, label, or surface change.
- Error states need recovery copy and action.
- Disabled states must remain legible enough to explain why unavailable.
- Avoid large blur behind dense text.
- Keep tables scannable with row hover, column alignment, and sticky context where useful.

## Mobile Rules

- Collapse sidebars into drawers, bottom tabs, or top segmented controls.
- Stack dashboards by priority: action/status first, primary data second, secondary panels after.
- Keep command input accessible but avoid covering content with a sticky composer.
- Reduce panel padding only after reducing columns.
- Ensure long workspace names, metric labels, and CTAs wrap intentionally.
- Preserve dark surface steps; do not flatten everything into one mobile card stack.

## Anti-Patterns

- Pure black everywhere with no surface ladder.
- Cyber Neon scanlines, holograms, and glow spam in a calm product UI.
- Low-contrast gray copy used for important values.
- Cards inside cards with no hierarchy.
- Huge decorative gradients behind dashboards.
- Accent color used as paragraph emphasis.
- Mono font applied to the whole interface.
- Tables without hover/focus/empty/error states.
- Loading states that collapse layout.
- Disabled buttons that disappear.

## Pre-Output Checklist

- First viewport contains a real dark product surface.
- One Dark UI archetype is clearly dominant.
- Execution tokens are declared and component CSS uses them.
- Typography uses named pairings, not raw Tailwind defaults.
- Spacing uses `--s-*` or style tokens, not mixed arbitrary padding.
- Radius, depth, and state colors use the token contract.
- Status labels use role mapping plus `--status-{role}-bg/fg`.
- Components include hover, focus-visible, selected, loading, empty, error, and success where relevant.
- Motion maps to panel depth transition and has a reduced-motion fallback.
- Mobile layout preserves the style without overflow, unreadable text, or hidden controls.
