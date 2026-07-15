# Precision Premium Dashboard — Data Visualization

The best chart is the smallest truthful visual that answers a real decision. Polish never compensates for an undefined metric or misleading aggregation.

## 1. Write the metric contract first

For every metric, record:

    Name:
    Business question:
    Source of authority:
    Numerator / denominator:
    Aggregation and deduplication key:
    Unit and currency:
    Timezone and period boundary:
    Freshness / latency:
    Exactness: exact | estimated | provisional | sampled | unavailable
    Privacy or minimum-sample constraint:

Do not publish a ratio, funnel, attribution, or comparison if this contract is unresolved.

Carry exactness into the returned model and UI. Do not bury it in a distant tooltip.

## 2. Separate units and authority classes

- Never share a quantitative axis between different units.
- Even with the same unit, do not overlay estimated audience, observational client events, and server-authoritative business facts when that visual implies direct comparability or attribution.
- Prefer a metric selector for one focused series, aligned small multiples for comparable shapes, or separate panels for different authority classes.
- If mixed series are essential, label authority and exactness in the legend and tooltip, and explain the intended comparison.

## 3. Choose the chart by question

| Question | Preferred visual | Avoid |
| --- | --- | --- |
| How did it change over time? | line, area, or aligned bars | donut, unordered cards |
| Which items lead? | horizontal bars plus exact values/table | pie with many slices |
| How do two periods compare? | aligned lines, grouped bars, slope for few items | isolated percentage badges |
| Where is density concentrated? | heatmap or matrix | decorative bubble field |
| What proportion belongs to a few categories? | 100% stacked bar; donut for ≤5 stable parts | rainbow pie |
| Where do users drop through a strict sequence? | step bars or valid funnel | event counts masquerading as people |
| How do cyclic journeys move? | transition matrix and ranked transitions | raw one-way Sankey |
| What is current operational state? | map, status grid, queue, or ranked list | irrelevant time-series |
| Is a bounded target being met? | bullet/progress chart with target marker | ornamental speedometer |
| Which records need action? | sortable table with compact visual cues | chart with no route to records |

### Line and area

- Use a continuous time domain with every expected bucket present.
- Distinguish measured zero from missing bucket.
- Do not smooth sparse series or imply values between distant observations.
- Use 1.5–2 px strokes; reserve thicker emphasis for the active series.
- Use subtle area fill only when it improves tracking, not to manufacture volume.
- Show markers on focus/hover or for sparse points, not every dense point.

### Bars

- Start quantitative bars at zero unless a clearly labeled analytical exception requires otherwise.
- A zero has zero length. Never apply a minimum visible width to numeric data.
- Prefer horizontal bars for long labels and rankings.
- Keep corner radii restrained; over-rounded bars distort short values.
- Sort for ranking; preserve natural order for sequence.

### Funnel

Use a funnel only when:

- stages are a real ordered journey;
- the same deduplicated population is followed through stages;
- each later stage is a subset of the previous stage;
- attribution and period boundaries are defensible.

Show count, step conversion, and overall conversion. If these conditions fail, use separate outcome panels and state that they are not causally attributed.

### Part-to-whole

Prefer a stacked bar because it compares lengths on a shared baseline. A donut is acceptable for a small, stable category set when the total and exact values are adjacent. Do not use a donut solely because the page looks empty.

### Heatmap

- Use equal-size cells and a perceptually ordered scale.
- Label time/category axes and explain the bucket.
- Provide exact values on focus/hover plus a text/table equivalent.
- Do not use a heatmap for a handful of unrelated values.

### Sankey and journey flow

Sankey is attractive but often misleading for navigation with loops, backtracking, and repeated events. Prefer:

1. transition matrix;
2. ranked origin → destination pairs;
3. entrances, exits, and outcomes;
4. simplified Sankey only for a bounded, defensible subset.

Always provide an exact transition table.

## 4. Compose around one anchor

A useful default desktop composition:

    12 columns
    ┌────────────────────────────────────────────────────────┐
    │ Compact header: title · period · compare · freshness   │
    ├──────────┬──────────┬──────────┬──────────┤
    │ KPI      │ KPI      │ KPI      │ KPI      │
    ├────────────────────────────────────┬───────────────────┤
    │ Primary trend / operational visual │ Interpretation    │
    │ 8 columns                           │ 4 columns         │
    ├───────────────────────────┬────────────────────────────┤
    │ Decision module 6 cols    │ Decision module 6 cols     │
    ├────────────────────────────────────┬───────────────────┤
    │ Ranked records / table 8 cols      │ Mix / quality 4   │
    └────────────────────────────────────┴───────────────────┘

This is a grammar, not a template. A map, matrix, inventory table, or queue may deserve the anchor instead of a line chart.

Keep measurement quality compact but visible. Explain coverage, freshness, reasons, and sample size; never turn technical quality into a pseudo-score attributed to a visitor or customer.

## 5. Low-volume and incomplete data

Sparse data is a product state, not a visual defect.

- Define a product-level minimum sample size before publishing relative rates. If no threshold exists, use a conservative presentation default of denominator n < 20: lead with counts and absolute change, suppress the percentage as a hero claim, and label the sample as limited. This is a presentation guardrail, not a claim of statistical significance.
- Keep expected dates visible, including true-zero days.
- Render missing buckets differently from zero buckets.
- For one point, show the point and context; do not draw an invented trend.
- For tiny denominators, prioritize counts and absolute change over dramatic percentages.
- If the previous value is zero, do not show infinity or meaningless +100%; show absolute change and explain the baseline.
- Do not calculate averages from an empty denominator.
- Do not interpolate provisional or late-arriving data unless the contract requires it.
- Mark estimates with ≈ or an adjacent status label.
- Mark the latest incomplete bucket as provisional with pattern, annotation, or text—not color alone.
- If a metric cannot be estimated, show — and explain why concisely.
- Empty panels should name the event or condition that will populate them, when known.

Never add fake rows, fake points, minimum bar widths, or decorative noise to make an empty dashboard feel busy.

## 6. Comparisons and deltas

- Compare equal-length periods with the same timezone and completeness rules.
- Put absolute and relative deltas in context.
- Display the prior value or make it reachable.
- Avoid green/red semantics when an increase is not inherently good or bad.
- Do not compare partial current data with a complete previous period without a matched cutoff or warning.
- Separate cumulative totals from within-period values.

## 7. Tooltip, legend, and annotation

Tooltips reinforce meaning; they do not contain the only meaning.

A useful tooltip includes:

- localized date or category;
- exact formatted value and unit;
- comparison value when active;
- exact/estimated/provisional status;
- source or definition only when ambiguity exists.

Tooltips must be keyboard reachable or have an equivalent accessible summary. Keep them inside the viewport and stable enough to read.

Legends:

- use human labels;
- match series order and appearance;
- remain visible near the plot;
- toggle series only when useful and accessible.

Annotations explain exceptional events, incomplete periods, targets, or contract changes. Do not annotate routine noise.

## 8. Accessibility contract

For each chart:

- use figure and a meaningful caption or accessible name;
- provide a concise summary of the main result;
- expose exact values through a table, list, or accessible chart layer;
- never encode a distinction by color alone;
- preserve contrast for lines, text, grid, focus, and selected state;
- make filters, legends, points, rows, and drill-downs keyboard-operable when interactive;
- keep focus visible and logical;
- announce asynchronous refresh or failure appropriately;
- respect reduced motion;
- test browser zoom and localized long labels.

## 9. Interaction patterns

Useful interactions:

- selecting a KPI focuses its series in the anchor chart;
- changing period without moving the entire layout;
- comparing a matched previous period;
- clicking a date or category filters secondary modules;
- opening an inspector while preserving context;
- moving from aggregate ranking to the underlying record;
- toggling between visual and exact table views.

Every interaction needs a visible selected state, keyboard behavior, loading behavior, and reset path.

Avoid gratuitous 3D tilt, hover lift on static cards, or charts that reveal all information only while chasing the pointer.

## 10. Premium commerce with unique inventory

For a small catalogue of unique, restored, handcrafted, luxury, or low-stock items, a generic revenue dashboard misses the operator’s questions.

Prioritize:

1. **Activity over time** — audience/sessions, item views, quote intent, cart/checkout intent, and server-confirmed outcomes, with honest exactness.
2. **Quote funnel** — item view → quote page → form start → durable intent, only if deduplicated stages are valid.
3. **Commerce facts** — created orders, confirmed payments, refunds, and server-authoritative revenue, separate from observational attribution when linkage is unavailable.
4. **Items that attract** — thumbnail, item, category, availability, views, favorites, quote/cart intent, sale state, and compact trend.
5. **Potential matrix** — attention versus intent, enriched by stock/status, to reveal high-interest unsold items.
6. **Content mix** — product/category/editorial route distribution using bars or a compact ranked list.
7. **Measurement status** — freshness, coverage, sample size, reasons, and exactness.

Do not merge quote, purchase, and refund into one theatrical funnel. A refund is an after-sale outcome, not a conversion stage. Do not attribute payment to a session unless the server-side contract supports that claim.

## 11. Component and model quality

- Normalize and derive chart data in a model layer, not render loops.
- Unit-test zero denominators, missing buckets, one-point series, long periods, and localization.
- Use named imports from the existing chart package and retain the dashboard lazy boundary.
- Avoid loading raw sessions or thousands of records to draw an aggregate chart.
- Keep transforms deterministic and idempotent.
- Expose source/freshness metadata alongside the view model.
- Measure chart bundle impact and public-bundle isolation when relevant.
- Maintain deterministic populated, empty, zero, one-point, sparse, provisional, and error fixtures.
- Add screenshot or visual-regression coverage for those fixtures when the repository supports it.

## 12. Chart acceptance checklist

- The question and metric contract are explicit.
- The chart type matches the analytical task.
- Axes, units, period, source, and exactness are understandable.
- Zero, missing, and provisional are distinct.
- Sparse data is not smoothed or dramatized.
- Comparison periods are matched.
- Exact values are accessible.
- The visual works without hover and without color alone.
- Interaction has keyboard, loading, selected, and reset states.
- No raw high-volume reads are required for an aggregate chart.
- The chart leads to interpretation or action.
