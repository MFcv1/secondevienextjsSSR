# Precision Premium Dashboard — Visual System

Use these values as disciplined starting ranges. Adapt them to the existing product tokens, brand, density, and accessibility requirements. Consistency matters more than blindly applying a number.

## 1. Visual character

The target is a precise product workstation:

- calm before expressive;
- dense before sparse, but never cramped;
- flat and layered by tone and border, not theatrical shadow;
- numeric and editorial rather than decorative;
- original to the product rather than recognizably copied from a reference.

“Apple-grade” means resolved alignment, typography, state behavior, material hierarchy, and motion. It does not require Apple branding, Apple icons, proprietary fonts, glass effects, or macOS imitation.

## 2. Grid and shell

### Desktop

- Use a 12-column content grid.
- Use 12–16 px gaps for dense panels; 20–24 px only for major zones.
- Keep page gutters around 32–56 px on ordinary desktop widths; adapt to the existing admin shell.
- Keep a fixed or collapsible sidebar around 216–252 px when appropriate.
- Keep the top toolbar around 52–64 px high.
- Give the primary chart 7–9 columns and its companion panel 3–5 columns.
- Constrain ultrawide content only when stretching harms chart reading; do not arbitrarily constrain operational tables.

### Tablet

- Move to an 8-column grid.
- Preserve KPI comparability in a 2 × 2 layout.
- Stack a primary chart and companion insight if either becomes narrower than its legible minimum.
- Collapse secondary navigation deliberately instead of letting labels wrap randomly.

### Mobile

- Use a 4-column grid and 16–20 px page gutters.
- Stack modules by decision priority, not desktop order alone.
- Use two compact KPI columns only when values remain readable; otherwise use one.
- Keep charts full-width with a meaningful minimum height.
- Allow horizontal scrolling for dense tables only, preserving the identifying column when feasible.
- Convert a persistent sidebar into a sheet or drawer with correct focus management.

## 3. Spacing

Use a compact 4 px rhythm:

| Token | Typical use |
| ---: | --- |
| 4 px | micro-alignment |
| 8 px | icon/label and tight metadata |
| 12 px | compact controls and card internals |
| 16 px | normal panel padding and grid gap |
| 20 px | comfortable panel padding |
| 24 px | major panel padding or module gap |
| 32 px | section separation |
| 40 px | large composition separation |
| 48 px | page-level separation |
| 64 px | rare breathing zone |

Default panel padding is 16–24 px. Repeated cards in one row share padding, baseline, and internal anatomy.

Avoid deeply nested padded containers. If a child is already grouped by a divider and heading, it may not need another card.

## 4. Surfaces and borders

Use at most three elevation levels:

1. canvas;
2. primary surface;
3. raised or selected surface.

Starting neutral ranges:

    /* Light */
    --dash-canvas: #f5f5f3;
    --dash-surface: #ffffff;
    --dash-surface-raised: #fafafa;
    --dash-text: #141416;
    --dash-text-muted: #6e6e73;
    --dash-border: rgba(20, 20, 22, 0.10);

    /* Dark */
    --dash-canvas: #0b0b0c;
    --dash-surface: #121214;
    --dash-surface-raised: #18181b;
    --dash-text: #f5f5f7;
    --dash-text-muted: #9b9ba1;
    --dash-border: rgba(255, 255, 255, 0.10);

Adapt these to the product; do not paste them blindly. Maintain WCAG contrast.

- Use 1 px borders for most grouping.
- Prefer no shadow on ordinary panels.
- Reserve a subtle shadow for overlays, menus, or a genuinely raised inspector.
- Use a 10–14 px panel radius; 16 px is a practical upper bound for large surfaces.
- Use 8–10 px controls; fully pill-shaped controls are for segmented selectors, tags, or compact status.
- Do not place every label or number inside its own rounded tile.

## 5. Color discipline

Use one governed product accent plus semantic colors.

The accent may indicate:

- primary action;
- selected period or series;
- focus and active navigation;
- one primary data family.

It must not color every icon, border, heading, and background. Highly saturated color should occupy a small minority of the screen.

Semantic colors have independent roles:

- positive/success;
- warning/provisional;
- critical/error;
- informational/estimated.

Never use red/green alone to convey meaning. Pair color with text, shape, icon, pattern, or position.

For multiple chart series, start with accent, text-neutral, and muted-neutral. Add distinct hues only when simultaneous comparison requires them.

## 6. Typography

Use the product’s existing typeface when legible. A tuned system sans stack is preferable to adding an unlicensed or slow display font.

| Role | Desktop size | Weight | Notes |
| --- | ---: | ---: | --- |
| Page title | 28–36 px | 600–700 | Compact line-height, no hero treatment |
| KPI number | 32–46 px | 550–700 | Tabular numerals |
| Major panel title | 16–20 px | 600–650 | One line where possible |
| Minor panel title | 14–16 px | 600 | Keep close to its visual |
| Body/control | 13–15 px | 400–550 | Controls remain legible |
| Label | 12–13 px | 500–600 | Sentence case preferred |
| Metadata | 11–12 px | 450–550 | Never use 9 px as normal UI text |

Use uppercase and letter spacing only for brief eyebrows or technical metadata. Do not write complete navigation or sections in tracked uppercase.

Formatting:

- use tabular numerals for KPIs, axes, money, durations, and tables;
- keep units visually subordinate but unambiguous;
- align decimals and currencies consistently;
- localize separators, dates, currency, and pluralization;
- use “—” for unavailable, “0” for measured zero, and “≈” or a label for estimates;
- never truncate the only identifying label without an accessible full value.

## 7. Panel anatomy

Every panel uses only the parts it needs:

    Header: question-oriented title + optional control/action
    Context: period, source, status, or one concise sentence
    Primary content: value, chart, table, map, or matrix
    Interpretation: one useful comparison or annotation
    Footer: drill-down or provenance only when needed

Avoid repeating page period, status, legend, and action in every card when a shared control governs the group.

### KPI

- Short human label.
- One dominant value.
- Comparison in absolute and/or relative form when meaningful.
- Optional microtrend only when period, metric, and state are clear.
- Exactness/freshness hint when the value is not exact and current.
- No decorative icon tile by default.

### Primary chart

- Give it the largest visual area.
- Keep metric and period controls in a stable header.
- Place legend near the plot and make series controls keyboard-operable.
- Include a visible summary that does not depend on tooltip hover.
- Leave plot margins for real localized labels.

### Ranked table

- Combine identity, metric, microvisual, and action in one readable row.
- Use bars or sparklines as support, not substitutes for numbers.
- Keep sorting state visible and keyboard-operable.
- Use a sticky header for long lists and paginate or virtualize according to scale.

## 8. Controls and interaction

- Primary controls are 36–42 px tall on desktop and at least 44 px hit area on touch.
- Keep filters in a compact toolbar; avoid a field-like box around every option.
- Use segmented controls for 2–4 mutually exclusive compact options.
- Make selected, hover, active, disabled, loading, and focus states distinct.
- Use a clear 2 px focus ring with sufficient contrast and an offset that is not clipped.
- A clickable panel must look and behave clickable; a static panel must not lift on hover.
- Use drawers or inspectors when they preserve context better than navigation.

## 9. Motion

Motion communicates continuity and state; it is not decoration.

- Hover/focus: 100–160 ms.
- Panel or inspector: 180–260 ms.
- Prefer opacity and transform.
- Use restrained easing such as cubic-bezier(0.22, 1, 0.36, 1).
- Do not animate every chart from zero on every filter change.
- Do not bounce, float, shimmer indefinitely, or delay routine interactions.
- Under reduced motion, remove nonessential movement and preserve immediate feedback.

## 10. Reference synthesis

Transferable qualities from the reference family:

- compact sidebar and toolbar create a real workstation;
- four aligned KPIs establish rhythm quickly;
- one dominant chart, map, matrix, or flow creates a visual anchor;
- micro-sparklines and heatmaps work when they encode real history or density;
- dark interfaces use tonal separation and fine borders, not black-on-black card stacking;
- light interfaces use disciplined density, not oversized white emptiness;
- one bright accent can identify a selected point or active series;
- tables, ranked lists, and operational items make dashboards actionable.

Recompose these principles around the actual product. Do not reproduce section order, proportions, labels, icons, or brand character one-to-one.

## 11. Visual acceptance checklist

- The page reads clearly in grayscale.
- One element is the obvious visual anchor.
- KPI numbers share a baseline and formatting.
- Borders, radii, and padding form a repeatable system.
- Accent color has a defined job.
- Charts and tables align to the same grid.
- Text remains legible at 100% and 200% zoom.
- Dense information does not become equal-weight card soup.
- Mobile preserves decisions rather than merely stacking everything.
- The result feels specific to the product and original.
