# vibrant-accents - Advanced Implementation Notes

These sections were moved out of SKILL.md to keep the runtime skill closer to the Clean SaaS structure while preserving detailed implementation examples for deeper work.

Load this file only after choosing the archetype and only when the compact component kit in SKILL.md is not enough.

## Signature Components

### AccentHeroCTA

```tsx
export function AccentHeroCTA() {
  return (
    <section className="va-hero">
      <nav className="va-nav" aria-label="Primary">
        <a className="va-logo" href="/">Orbit</a>
        <div className="va-nav__links">
          <a href="/platform">Platform</a>
          <a href="/customers">Customers</a>
          <a href="/pricing">Pricing</a>
        </div>
        <a className="va-button va-button--primary" href="/start">Start now</a>
      </nav>
      <div className="va-hero__grid">
        <div>
          <p className="va-eyebrow">Revenue operations</p>
          <h1>One clear signal across every customer workflow.</h1>
          <p>Route work, spot risk, and move teams through each step with a color system that stays quiet until action matters.</p>
          <div className="va-hero__actions">
            <a className="va-button va-button--primary" href="/start">Create workflow</a>
            <a className="va-button va-button--secondary" href="/demo">Watch demo</a>
          </div>
        </div>
        <div className="va-showcase" aria-label="Product preview">
          <div className="va-product-panel">
            <span data-tone="green">Paid</span>
            <span data-tone="orange">Review</span>
            <strong>$84,200</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
```

```css
:root {
  --va-bg: #ffffff;
  --va-surface: #f8fafd;
  --va-surface-2: #e5edf5;
  --va-ink: #061b31;
  --va-muted: #50617a;
  --va-border: #d8d6df;
  --va-action: #533afd;
  --va-action-text: #ffffff;
  --va-action-soft: #b9b9f9;
  --va-edge-green: #81b81a;
  --va-edge-orange: #ff6118;
  --va-radius-control: 4px;
  --va-radius-card: 6px;
  --va-ease: cubic-bezier(.2, 0, 0, 1);
}

.va-hero {
  min-height: 100svh;
  overflow: hidden;
  padding: clamp(16px, 3vw, 32px);
  background: var(--va-bg);
  color: var(--va-ink);
}

.va-nav {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.va-nav a {
  color: inherit;
  text-decoration: none;
}

.va-nav__links {
  display: flex;
  gap: clamp(14px, 2vw, 28px);
}

.va-hero__grid {
  width: min(100%, 1200px);
  margin: clamp(56px, 9vw, 118px) auto 0;
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(320px, 1.1fr);
  gap: clamp(32px, 6vw, 76px);
  align-items: center;
}

.va-eyebrow {
  color: var(--va-action);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.va-hero h1 {
  max-width: 12ch;
  margin: 0;
  font-family: var(--va-font-display, Inter, system-ui, sans-serif);
  font-size: clamp(44px, 7vw, 64px);
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: 0;
  text-wrap: balance;
}

.va-hero p:not(.va-eyebrow) {
  max-width: 58ch;
  color: var(--va-muted);
  font-size: 17px;
  line-height: 1.55;
}

.va-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.va-button {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--va-radius-control);
  padding: 0 18px;
  font-weight: 800;
  text-decoration: none;
  transition: color 180ms ease, border-color 180ms ease, transform 180ms var(--va-ease);
}

.va-button--primary {
  border: 1px solid var(--va-action);
  background: var(--va-action);
  color: var(--va-action-text);
}

.va-button--secondary {
  border: 1px solid var(--va-action-soft);
  background: transparent;
  color: var(--va-action);
}

.va-button::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: color-mix(in srgb, var(--va-action), #000 12%);
  transform: translateX(-105%);
  transition: transform 220ms var(--va-ease);
}

.va-button:hover::before,
.va-button:focus-visible::before {
  transform: translateX(0);
}

.va-button:hover { transform: translateY(-1px); }
.va-button:active { transform: translateY(0); }
.va-button:focus-visible { outline: 3px solid color-mix(in srgb, var(--va-action), white 45%); outline-offset: 3px; }
.va-button[aria-disabled="true"] { opacity: .48; pointer-events: none; }

.va-showcase {
  border-radius: var(--va-radius-card);
  background:
    radial-gradient(circle at 28% 20%, rgba(244, 75, 204, .42), transparent 32%),
    radial-gradient(circle at 76% 24%, rgba(83, 58, 253, .42), transparent 36%),
    var(--va-surface-2);
  padding: clamp(18px, 4vw, 42px);
}

.va-product-panel {
  display: grid;
  gap: 14px;
  min-height: 360px;
  align-content: start;
  border-radius: var(--va-radius-card);
  background: rgba(255, 255, 255, .86);
  padding: 20px;
  color: var(--va-ink);
}

.va-product-panel span {
  width: fit-content;
  border-left: 4px solid var(--tone);
  padding-left: 10px;
  color: var(--va-muted);
  font-weight: 700;
}

.va-product-panel span[data-tone="green"] { --tone: var(--va-edge-green); }
.va-product-panel span[data-tone="orange"] { --tone: var(--va-edge-orange); }
.va-product-panel strong {
  margin-top: 28px;
  font-size: clamp(40px, 7vw, 72px);
  line-height: 1;
}

@media (max-width: 820px) {
  .va-nav__links { display: none; }
  .va-hero__grid { grid-template-columns: 1fr; }
  .va-hero h1 { max-width: 100%; font-size: clamp(40px, 13vw, 58px); overflow-wrap: anywhere; }
  .va-product-panel { min-height: 280px; }
}
```

### Accent Fill Sweep

Use for CTA, tabs, chips, and hover cards. The sweep is a color reveal that stays within component bounds.

Rules:

- Sweep uses the component's existing accent, not a new color.
- Sweep changes fill, border, or edge; it does not resize layout.
- Keyboard focus triggers the same visual effect as hover.
- Reduced motion uses an immediate fill or border change.

```css
.accent-sweep {
  --sweep-color: var(--va-action);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--sweep-color), transparent 50%);
  background: transparent;
  color: var(--sweep-color);
}

.accent-sweep::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--sweep-color);
  transform: translateX(-102%);
  transition: transform 260ms cubic-bezier(.2, 0, 0, 1);
}

.accent-sweep:is(:hover, :focus-visible, [data-active="true"]) {
  color: var(--sweep-text, #ffffff);
}

.accent-sweep:is(:hover, :focus-visible, [data-active="true"])::before {
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .accent-sweep::before { transition-duration: .01ms !important; }
}
```

### ColorCodedFilter

Use for marketplaces, category tabs, dashboards, and product grouping.

```tsx
const filters = [
  { label: "Payments", tone: "violet" },
  { label: "Risk", tone: "orange" },
  { label: "Growth", tone: "green" }
];

export function ColorCodedFilter() {
  return (
    <div className="va-filter" role="group" aria-label="Category filters">
      {filters.map((filter, index) => (
        <button
          className="va-filter-chip"
          data-tone={filter.tone}
          aria-pressed={index === 0}
          key={filter.label}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
```

```css
.va-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.va-filter-chip {
  --chip-color: var(--va-action);
  min-height: 38px;
  border: 1px solid color-mix(in srgb, var(--chip-color), transparent 45%);
  border-radius: 999px;
  background: #ffffff;
  color: var(--va-ink);
  padding: 0 14px;
  font: inherit;
  font-weight: 700;
}

.va-filter-chip[data-tone="violet"] { --chip-color: var(--va-action); }
.va-filter-chip[data-tone="orange"] { --chip-color: var(--va-edge-orange); }
.va-filter-chip[data-tone="green"] { --chip-color: var(--va-edge-green); }

.va-filter-chip[aria-pressed="true"] {
  background: var(--chip-color);
  color: #ffffff;
}

.va-filter-chip[data-tone="green"][aria-pressed="true"] {
  color: #061b31;
}

.va-filter-chip:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--chip-color), white 40%);
  outline-offset: 3px;
}
```

### VividStatCard

Use for proof, metrics, dashboard widgets, and campaign outcomes.

```tsx
export function VividStatCard() {
  return (
    <article className="va-stat-card" data-state="positive">
      <p>Recovered revenue</p>
      <strong>$142K</strong>
      <span>+18% this quarter</span>
    </article>
  );
}
```

```css
.va-stat-card {
  display: grid;
  gap: 12px;
  min-height: 190px;
  align-content: end;
  border: 1px solid var(--va-border);
  border-radius: var(--va-radius-card);
  background: var(--va-surface);
  padding: 22px;
  box-shadow: inset 0 -4px 0 var(--state-color, var(--va-action));
}

.va-stat-card p,
.va-stat-card span {
  margin: 0;
  color: var(--va-muted);
}

.va-stat-card strong {
  font-size: clamp(40px, 7vw, 72px);
  line-height: 1;
  letter-spacing: 0;
}

.va-stat-card[data-state="positive"] { --state-color: var(--va-edge-green); }
.va-stat-card[data-state="warning"] { --state-color: var(--va-edge-orange); }
.va-stat-card[data-state="active"] { --state-color: var(--va-action); }
```

### NeutralProductGrid

Use for cards that need colorful accents without becoming a rainbow grid.

```css
.neutral-product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.neutral-product-card {
  min-height: 240px;
  border: 1px solid var(--va-border);
  border-radius: var(--va-radius-card);
  background: #ffffff;
  padding: 20px;
  color: var(--va-ink);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms var(--va-ease);
}

.neutral-product-card::before {
  content: "";
  display: block;
  width: 48px;
  height: 4px;
  margin-bottom: 24px;
  background: var(--card-accent, var(--va-action));
}

.neutral-product-card:is(:hover, :focus-visible) {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--card-accent, var(--va-action)), #ffffff 30%);
  box-shadow: inset 0 -4px 0 var(--card-accent, var(--va-action));
}

@media (max-width: 820px) {
  .neutral-product-grid { grid-template-columns: 1fr; }
  .neutral-product-card { min-height: 0; }
}
```

### CategoryTabs

Use for product modes, workflow steps, and feature switching.

```tsx
export function CategoryTabs() {
  return (
    <div className="va-tabs" role="tablist" aria-label="Workflow">
      <button role="tab" aria-selected="true" className="accent-sweep">Collect</button>
      <button role="tab" aria-selected="false" className="accent-sweep">Classify</button>
      <button role="tab" aria-selected="false" className="accent-sweep">Route</button>
    </div>
  );
}
```

```css
.va-tabs {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 4px;
  border: 1px solid var(--va-border);
  border-radius: calc(var(--va-radius-control) + 2px);
  background: var(--va-surface);
  padding: 4px;
}

.va-tabs [role="tab"] {
  min-height: 38px;
  border-radius: var(--va-radius-control);
  padding: 0 14px;
  font: inherit;
  font-weight: 700;
}

.va-tabs [aria-selected="true"] {
  background: var(--va-action);
  color: var(--va-action-text);
}

@media (max-width: 600px) {
  .va-tabs { grid-auto-flow: row; width: 100%; }
  .va-tabs [role="tab"] { width: 100%; }
}
```
