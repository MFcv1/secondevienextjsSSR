# minimal-design - Advanced Implementation Notes

These sections were moved out of SKILL.md to keep the runtime skill closer to the Clean SaaS structure while preserving detailed implementation examples for deeper work.

Load this file only after choosing the archetype and only when the compact component kit in SKILL.md is not enough.

## Implementation Recipes

### Product Home Page

```css
.minimal-home {
  background: var(--canvas);
  color: var(--text-primary);
  font-family: var(--font-sans, Inter, system-ui, sans-serif);
}
.minimal-hero {
  min-block-size: 88svh;
  display: grid;
  grid-template-columns: minmax(0, .82fr) minmax(320px, 1fr);
  gap: clamp(36px, 7vw, 108px);
  align-items: center;
  padding: clamp(64px, 9vw, 132px) clamp(20px, 6vw, 96px);
}
.minimal-hero h1 {
  margin: 0;
  max-inline-size: 12ch;
  font-size: clamp(48px, 7vw, 88px);
  line-height: .96;
  letter-spacing: -.02em;
}
.minimal-proof {
  aspect-ratio: 16 / 10;
  border: 1px solid var(--rule-subtle);
  border-radius: var(--radius-card);
  background: var(--surface);
  overflow: hidden;
}
@media (max-width: 820px) {
  .minimal-hero { grid-template-columns: 1fr; }
  .minimal-hero h1 { max-inline-size: 11ch; }
}
```

### Dashboard Shell

```css
.minimal-shell {
  min-block-size: 100svh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background: var(--canvas-alt);
  color: var(--text-primary);
}
.minimal-sidebar {
  border-right: 1px solid var(--rule-subtle);
  padding: 16px;
}
.minimal-main {
  display: grid;
  grid-template-rows: 64px minmax(0, 1fr);
}
.minimal-topbar {
  border-bottom: 1px solid var(--rule-subtle);
  display: flex;
  align-items: center;
  gap: 12px;
  padding-inline: 20px;
}
.minimal-content {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  padding: 20px;
}
.minimal-panel {
  border: 1px solid var(--rule-subtle);
  border-radius: var(--radius-card);
  background: var(--surface);
  padding: 16px;
}
```

### Minimal Form

```css
.minimal-form {
  display: grid;
  gap: 16px;
  max-inline-size: 480px;
}
.minimal-field {
  display: grid;
  gap: 6px;
}
.minimal-field label {
  font-size: 14px;
  color: var(--text-primary);
}
.minimal-field input,
.minimal-field textarea {
  min-block-size: 44px;
  border: 1px solid var(--rule-subtle);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--text-primary);
  padding-inline: 12px;
}
.minimal-field input:focus-visible,
.minimal-field textarea:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```
