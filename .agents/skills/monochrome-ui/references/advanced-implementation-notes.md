# monochrome-ui - Advanced Implementation Notes

These sections were moved out of SKILL.md to keep the runtime skill closer to the Clean SaaS structure while preserving detailed implementation examples for deeper work.

Load this file only after choosing the archetype and only when the compact component kit in SKILL.md is not enough.

## Implementation Recipes

### Monochrome App Shell

```css
.mono-shell {
  min-block-size: 100svh;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  background: var(--canvas);
  color: var(--text-primary);
  font-family: var(--font-sans, Geist, Inter, system-ui, sans-serif);
}
.mono-sidebar {
  border-right: 1px solid var(--rule-hairline);
  padding: 12px;
}
.mono-main {
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr);
}
.mono-topbar {
  border-bottom: 1px solid var(--rule-hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 16px;
}
.mono-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  padding: 16px;
}
.mono-panel {
  border: 1px solid var(--rule-hairline);
  border-radius: var(--radius-card, 0px);
  background: var(--surface);
  min-width: 0;
}
```

### Monochrome Table

```css
.mono-table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.mono-table th {
  color: var(--text-muted);
  font-weight: 500;
  text-align: left;
  border-bottom: 1px solid var(--rule-strong);
  padding: 10px 12px;
}
.mono-table td {
  border-bottom: 1px solid var(--rule-hairline);
  padding: 12px;
}
.mono-table tr:hover td {
  background: var(--hover-fill);
}
.mono-table tr[aria-selected="true"] td {
  background: var(--selected-fill);
  color: var(--selected-text);
}
```

### Inversion Controls

```css
.mono-segmented {
  display: inline-grid;
  grid-auto-flow: column;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-control, 0px);
  overflow: hidden;
}
.mono-segmented button {
  min-block-size: 38px;
  border: 0;
  border-right: 1px solid var(--rule-strong);
  background: var(--surface);
  color: var(--text-primary);
  padding-inline: 14px;
}
.mono-segmented button:last-child {
  border-right: 0;
}
.mono-segmented button[aria-pressed="true"] {
  background: var(--selected-fill);
  color: var(--selected-text);
}
```
