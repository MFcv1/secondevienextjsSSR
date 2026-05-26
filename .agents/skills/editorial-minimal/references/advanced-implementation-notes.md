# editorial-minimal - Advanced Implementation Notes

These sections were moved out of SKILL.md to keep the runtime skill closer to the Clean SaaS structure while preserving detailed implementation examples for deeper work.

Load this file only after choosing the archetype and only when the compact component kit in SKILL.md is not enough.

## Implementation Recipes

### Authored Editorial Grid

```css
.em-page {
  background: var(--canvas);
  color: var(--text-primary);
  font-family: var(--font-sans);
}
.em-grid {
  display: grid;
  grid-template-columns:
    minmax(20px, 1fr)
    minmax(0, 720px)
    minmax(120px, 280px)
    minmax(20px, 1fr);
  column-gap: clamp(20px, 3vw, 44px);
}
.em-main { grid-column: 2; }
.em-note { grid-column: 3; max-width: 28ch; }
@media (max-width: 800px) {
  .em-grid { grid-template-columns: minmax(20px, 1fr) minmax(0, 1fr) minmax(20px, 1fr); }
  .em-main,
  .em-note { grid-column: 2; }
}
```

### Captioned Media

```css
.captioned-media {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px);
  gap: clamp(14px, 2vw, 24px);
  border-top: 1px solid var(--rule-subtle);
  padding-top: 16px;
}
.captioned-media__frame {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--radius-media);
  background: var(--surface-subtle);
}
.captioned-media__caption {
  font-size: var(--text-caption);
  line-height: 1.45;
  color: var(--text-secondary);
}
```

### Editorial Index

```css
.editorial-index {
  border-top: 1px solid var(--rule-subtle);
}
.editorial-index__row {
  min-block-size: 72px;
  display: grid;
  grid-template-columns: 88px 140px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: baseline;
  border-bottom: 1px solid var(--rule-subtle);
  color: var(--text-primary);
  text-decoration: none;
}
.editorial-index__row:hover .editorial-index__title,
.editorial-index__row:focus-visible .editorial-index__title {
  text-decoration: underline;
  text-underline-offset: .24em;
}
@media (max-width: 720px) {
  .editorial-index__row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding-block: 16px;
  }
}
```

### Research Plate

```css
.research-plate {
  background: var(--em-dark, var(--surface-inverse));
  color: var(--em-on-dark, var(--text-inverse));
  border-radius: var(--em-radius-feature, 24px);
  padding: clamp(24px, 4vw, 48px);
}
.research-plate__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  border-top: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  padding-top: 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: .06em;
  text-transform: uppercase;
}
```
