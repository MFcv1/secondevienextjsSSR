# serif-display - Advanced Implementation Notes

These sections were moved out of SKILL.md to keep the runtime skill closer to the Clean SaaS structure while preserving detailed implementation examples for deeper work.

Load this file only after choosing the archetype and only when the compact component kit in SKILL.md is not enough.

## Implementation Recipes

### Serif Hero

```css
.serif-display-page {
  background: var(--canvas);
  color: var(--text-primary);
  font-family: var(--font-body, Inter, system-ui, sans-serif);
}
.serif-hero {
  min-block-size: 88svh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, .72fr);
  gap: clamp(32px, 6vw, 96px);
  align-items: end;
  padding: clamp(48px, 8vw, 128px) clamp(16px, 5vw, 72px) clamp(32px, 5vw, 72px);
}
.serif-hero__title {
  margin: 0;
  font-family: var(--font-display, Georgia, serif);
  font-size: clamp(56px, 13vw, 180px);
  line-height: .86;
  letter-spacing: -.035em;
  max-inline-size: 8.5ch;
}
.serif-hero__proof {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: var(--radius-card);
  background: var(--surface-subtle);
}
@media (max-width: 820px) {
  .serif-hero {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .serif-hero__title {
    font-size: clamp(48px, 18vw, 88px);
  }
}
```

### Specimen Grid

```css
.specimen-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.specimen-card {
  min-block-size: 280px;
  border-radius: var(--radius-soft, 0px);
  background: var(--surface-subtle, transparent);
  padding: var(--space-module, 26px);
  display: grid;
  align-content: space-between;
}
.specimen-card__sample {
  font-family: var(--font-display);
  font-size: clamp(54px, 8vw, 103px);
  line-height: .92;
}
.specimen-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--rule-subtle);
  padding-top: 12px;
  font-size: 12px;
}
@media (max-width: 900px) {
  .specimen-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .specimen-grid { grid-template-columns: 1fr; }
}
```

### Diagonal Image Stack

```css
.diagonal-stack {
  position: relative;
  min-block-size: min(70svh, 720px);
}
.diagonal-stack img {
  position: absolute;
  inline-size: min(46vw, 520px);
  aspect-ratio: 4 / 5;
  object-fit: cover;
  opacity: .7;
  filter: saturate(.6);
  border-radius: 0;
}
.diagonal-stack img:nth-child(1) { top: 4%; left: 8%; transform: rotate(0deg); }
.diagonal-stack img:nth-child(2) { top: 18%; left: 26%; transform: rotate(-3deg); }
.diagonal-stack img:nth-child(3) { top: 34%; left: 44%; transform: rotate(2deg); }
```

### Print Product Card

```css
.print-product {
  display: grid;
  gap: 10px;
  background: transparent;
  border-radius: 0;
}
.print-product__image {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--surface-subtle);
}
.print-product__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  color: var(--text-primary);
  font-size: 14px;
}
.print-product__status {
  color: var(--accent-blueprint);
  text-decoration: underline;
  text-underline-offset: .22em;
}
```

---

## Layout Patterns

### Serif Hero

Best for luxury, literary, cultural, and boutique brand first viewports.

- Large display title, narrow support copy, clear action.
- Proof object: product still, printed material, cover, gallery image, type specimen, or editorial chapter.
- Hero text should not sit inside a card.
- Bottom of viewport reveals product grid, image chapter, or index.

### Specimen Showcase

Best for type foundries and typographic portfolios.

- Display faces are the images.
- Each specimen has metadata and action.
- Cards can be transparent `0px` or soft `20px`, depending on archetype.
- Hover can shift weight, axis, or alternate glyphs.

### Print Product Grid

Best for publishing and commerce.

- Product photography is unmasked or simply framed.
- Title, price, edition, material, availability.
- Cards are transparent or paper-surface, no shadow.
- Product state uses text, rule, or badge.

### Pullquote Chapter

Best for editorial/luxury pacing.

- Large serif quote or statement.
- Attribution and context in caption/metadata style.
- Border top/bottom, paper surface, or inverse block.

### Diagonal Image Stack

Best for architecture/galleries/conceptual pages.

- Layered image panels, slight transparency, muted saturation.
- Text stays small and precise.
- Motion can crossfade or shift layers lightly.
