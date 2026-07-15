---
name: precision-premium-dashboard
description: Design, audit, or implement modern premium analytics dashboards and admin data workspaces with calm Apple-grade precision, dense-but-clear grids, truthful charts, accessible interactions, and polished responsive states. Use for analytics redesigns, KPI and chart workspaces, admin data screens, screenshot-inspired dashboard builds, and requests for minimalist, modern, premium, executive, or Apple-like dashboard UI. Do not use for landing pages or unrelated backend work.
---

# Precision Premium Dashboard

Create original, product-specific dashboards that feel calm, exact, and expensive because every decision is resolved. Treat “Apple-grade” as a standard of hierarchy, typography, material restraint, interaction quality, and edge-case completeness—not as permission to imitate Apple products or another reference screen.

## Required references

Before designing or editing a dashboard, read:

- [visual-system.md](references/visual-system.md) for grid, surfaces, typography, controls, responsive behavior, and motion;
- [data-visualization.md](references/data-visualization.md) for chart selection, metric truth, sparse-data behavior, panel anatomy, and dashboard recipes.

If the repository has project instructions, a map, domain documentation, design tokens, or a data contract, read those first. Repository and user requirements override this skill.

## Core contract

1. Build a decision surface, not a gallery of cards. Every panel must answer a named question and support an action or interpretation.
2. Preserve data truth. Never make a zero visible with a minimum bar width, invent a trend, smooth sparse data, imply attribution, or hide estimated/provisional status.
3. Preserve product behavior and architecture. Do not silently break routes, loading boundaries, permissions, queries, accessibility, or responsive flows.
4. Produce an original composition. Extract principles from references; do not trace their layout, wording, branding, icons, or exact visual signature.
5. Prefer restraint over decoration: strong grid, fine borders, excellent type, one governed accent, and purposeful charts.
6. Finish all states. Premium quality includes loading, empty, zero, one-point, low-volume, missing, provisional, error, long-label, mobile, keyboard, and reduced-motion behavior.

## Workflow

### 1. Establish product and data truth

Before drawing or coding, identify:

- the primary operator and the three decisions they need to make;
- the active environment and release state: local, preview, sandbox, rollout in progress, or production;
- the canonical period, comparison period, timezone, freshness, and data source;
- which metrics are exact, estimated, provisional, sampled, delayed, or unavailable;
- which facts are server-authoritative and which are observational;
- the existing shell, component library, chart library, tokens, breakpoints, and lazy-loading boundaries;
- privacy, consent, retention, authorization, and read-budget constraints.

For code work, inspect the real data model and rendering code. Do not infer a metric from a label or an old screenshot.

If the operator or priorities are missing, state a reversible working assumption. If that assumption changes the data contract, permissions, or primary workflow, ask before implementation.

For an audit, stay read-only unless the user explicitly asks for implementation.

### 2. Deconstruct visual references

When screenshots are supplied, inspect each at full available resolution before acting. Extract three buckets:

- **Invariant qualities:** hierarchy, density, alignment, contrast, chart role, navigation behavior;
- **Adaptable traits:** light/dark mode, accent hue, panel proportions, chart family;
- **Do not copy:** brand marks, exact geometry, distinctive illustrations, text, proprietary icons, or a recognizable one-to-one layout.

Synthesize the references into one original visual thesis, for example:

> A calm editorial control room for a small premium commerce business: near-monochrome, compact, and evidence-led, with one luminous data accent.

Do not start implementation until the thesis and the primary dashboard question are explicit.

### 3. Define the information hierarchy

Default order, adapting when the product demands otherwise:

1. compact page header with title, period, comparison, freshness, and primary action;
2. three to five KPIs summarizing the current state;
3. one dominant visualization answering the main time-based or operational question;
4. one adjacent interpretation or target panel;
5. two or three secondary decision modules;
6. a ranked table or drill-down surface;
7. compact measurement quality and provenance.

Select KPIs by decision value, not availability or visual symmetry. Map each KPI to one of the operator’s three decisions. Prefer a balanced set of outcomes and leading behaviors; do not make an infrastructure metric dominant unless the operator acts on it. If the user requires an exact KPI count, justify each slot.

For every proposed panel, write:

    Question → Metric/source → Visual → Interaction → Empty/weak-signal state

Remove panels that cannot complete that sentence. Do not add equal-weight cards merely to fill a grid.

### 4. Define the visual system first

Use [visual-system.md](references/visual-system.md) to establish a small set of existing or new tokens for:

- canvas, base surface, elevated surface, text, muted text, border, accent, and semantic states;
- spacing, panel radius, control radius, border width, and chart gridlines;
- page title, section title, KPI number, body, label, and metadata;
- interaction durations, focus rings, and reduced-motion behavior.

Use the existing brand accent when suitable. Otherwise select one and govern it. Accent color explains selection, series identity, or action; it does not decorate empty space.

### 5. Specify charts before rendering

Read [data-visualization.md](references/data-visualization.md). Define for each chart:

- the question it answers;
- numerator, denominator, unit, aggregation, deduplication key, timezone, and exactness;
- the chart type and why it is appropriate;
- axes, domain, comparison, legend, tooltip, annotations, and table/text equivalent;
- whether the series share the same unit, authority class, and exactness;
- behavior for zero, missing, one point, sparse data, and provisional periods;
- click, hover, focus, filtering, and drill-down behavior.

Use the repository’s capable chart library rather than rebuilding axes, tooltips, resizing, and accessibility in ad-hoc SVG. Keep specialized custom SVG for genuinely novel visuals only.

Do not overlay estimated audience, observational events, and server-authoritative outcomes on one axis merely because their values are numeric. Use a metric selector, aligned small multiples, or clearly separated panels unless shared unit and comparison semantics are proven.

### 6. Implement a coherent product surface

Prefer an architecture like:

    DashboardRoute
    ├── dashboardModel          normalization and derived metrics
    ├── DashboardHeader         period, comparison, freshness, actions
    ├── KpiStrip                three to five consistent KPIs
    ├── PrimaryInsight          main chart plus interpretation
    ├── SecondaryModules        funnels, rankings, mix, operational state
    ├── DetailWorkspace         table, matrix, inspector, drill-down
    └── MeasurementStatus       quality, coverage, provenance

Implementation rules:

- Separate data transformation from visual rendering and test it independently.
- Reuse the current shell and primitives unless the task explicitly includes redesigning them.
- Keep heavy charts inside the dashboard/admin lazy boundary; do not leak them into public bundles.
- Use semantic HTML. A chart is a figure with a useful caption or accessible summary.
- Make controls real buttons, links, tabs, or form elements with visible focus.
- Keep a table or concise textual equivalent when exact values matter.
- Localize human-facing labels; never expose raw route keys or internal enum names.
- Avoid adding a dependency when the existing stack can deliver the result well.

### 7. Resolve edge cases deliberately

Verify:

- loading without layout shift;
- fully empty and legitimate all-zero periods;
- one observation only;
- sparse series with gaps;
- missing versus measured-zero values;
- estimated and provisional metrics;
- period comparison when the previous value is zero;
- long names, large numbers, currencies, and localization;
- permission, network, and partial-data errors;
- narrow mobile, tablet, and wide desktop;
- keyboard-only, zoomed, high-contrast, and reduced-motion use.

Never use fake production data to make a chart attractive. Prototype fixtures must be clearly labeled and isolated from real metrics.

### 8. Validate the experience

Follow repository validation policy. For an authorized dashboard implementation, validate proportionately at the project’s target viewports, including a wide desktop, tablet, and narrow mobile.

Before acceptance, freeze the project’s actual breakpoints, minimum plot widths, and stacking order; ranges in this skill are exploration guidance, not final acceptance values. When the repository supports visual testing, maintain deterministic fixtures and screenshot/regression coverage for populated, empty, sparse, provisional, and error states.

Check:

- the first screen has one obvious reading order and one visual anchor;
- every number matches the source and formatting contract;
- zeros remain zero and missing data remains distinguishable;
- charts remain understandable without relying on hover or color alone;
- all controls work by keyboard and have visible focus;
- contrast, zoom, reduced motion, loading, empty, and error states work;
- no clipped labels, overlapping legends, accidental scroll traps, or console errors;
- environment and rollout status are visible whenever the displayed data may be sandbox, preview, stale, or not yet deployed;
- dashboard dependencies remain outside public bundles when required;
- the result is recognizably specific to the product, not a generic SaaS template.

## Apple-grade, correctly interpreted

Pursue:

- obsessive baseline alignment and consistent spacing;
- quiet neutral materials with precise contrast;
- typography that establishes hierarchy without spectacle;
- controls with immediate, predictable feedback;
- useful density and progressive disclosure;
- subtle motion that preserves continuity;
- complete edge states and accessibility;
- excellent performance and stable layout.

Do not pursue:

- Apple logos, copied macOS chrome, or unlicensed proprietary fonts;
- translucent glass everywhere;
- giant rounded cards, glossy gradients, or decorative glow;
- empty luxury spacing that hides a lack of information architecture.

## Non-negotiable rejection list

Reject and redesign any solution with several of these symptoms:

- generic card soup with equal visual weight;
- giant title and decorative whitespace that reduce useful density;
- gradients, glassmorphism, glow, faux 3D, or floating blobs used as quality substitutes;
- excessive pills, icon tiles, or rounded containers inside rounded containers;
- multiple saturated accents or rainbow chart series without semantic need;
- a dark card inserted only to create contrast;
- decorative sparklines with no scale, period, state, or meaning;
- donut and gauge overload;
- unreadably small metadata or uppercase text used for whole sections;
- animation that lifts, bounces, or delays routine work;
- percentage drama on tiny samples;
- charts with no accessible exact-value equivalent;
- direct imitation of a supplied reference.

## Deliverables by request type

### Audit

Lead with the verdict. For each issue provide evidence, user/business impact, and a concrete correction. Separate what current data supports from what requires a backend or contract change.

### Design direction or generation prompt

Provide the product thesis, screen map, visual tokens, exact chart roles, interaction rules, edge states, responsive plan, and anti-patterns. Describe an original interface, not a reference clone.

### Implementation

Deliver working components and styles, preserve functional contracts, validate rendered states, and report files changed, checks run, checks not run, and deployment status. Do not claim visual completion without inspecting the rendered result when the task authorizes visual testing.
