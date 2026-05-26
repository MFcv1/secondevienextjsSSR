# Superlative — Style Reference
> Precision instrument interface — white text glowing on a matte gray panel

**URL:** https://playsuperlative.com
**Refero ID:** 10ab6120-3d03-48ff-aebe-0b4910edc046
**Theme:** dark
**Category Tags:** Motion, Dark UI, Industrial, Technical

## Tokens — Colors
| Name | Value | Token | Role |
|------|-------|-------|------|
| Superlative Black | `#141414` | `--color-superlative-black` | Primary surface bg |
| Instrument Gray | `#232323` | `--color-instrument-gray` | Secondary surfaces |
| Panel Gray | `#8c8c8c` | `--color-panel-gray` | Placeholder, subtle borders, inactive |
| Signal Orange | `#e66f27` | `--color-signal-orange` | Highlight bands, soft emphasis. **Never CTA.** |
| Ghost White | `#ffffff` | `--color-ghost-white` | Primary text on dark |
| Surface White | `#f6f4f2` | `--color-surface-white` | Badges, contrasting blocks |
| Divider Gray | `#e4e3e2` | `--color-divider-gray` | Borders on light surfaces |
| Absolute Black | `#000000` | `--color-absolute-black` | Outline button borders |

## Typography
### SL-Regular-Condensed (Display)
- Sub: Bebas Neue. Weights: 400. Sizes: 15, 23, 90px. **Letter-spacing 0.0800em** (wide for mechanical feel)

### SL-Light (Display Large)
- Sub: Open Sans Light. Sizes: 25, 90px. Normal tracking.

### SL-Regular (Body)
- Sub: Open Sans. Sizes: 15px. Single weight.

## Spacing & Shapes
- Base: 8px, comfortable density
- Scale: 5, 8, 11, 15, 19, 20, 30, 45, 60, 90, 120, 240
- Section gap: **60px**
- Card padding: 30px
- Element gap: 15px
- Border radius: badges 15px, buttons 3px, ghost buttons 0px

## Components

### Ghost Primary Button
Ghost White text, 25px SL-Light, 1px solid Absolute Black border, transparent bg, **18.5px / 45px padding**, 0px radius.

### Ghost Secondary Button
Panel Gray text, 15px SL-Regular-Condensed, 0.08em tracking, 1px Panel Gray border, 18.5px/45px padding, 0px radius.

### New Badge
Surface White bg, Superlative Black text, 15px SL-Regular-Condensed, 0.08em tracking, 0px/15px padding, **15px radius** (pill-like).

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #141414 | Page bg |
| 1 | #232323 | Content blocks |
| 2 | #f6f4f2 | Badge / contrasting blocks |

## Imagery
Prominent angled product photography. Full-bleed without explicit framing. Product-focused, no lifestyle. Icons minimal, outlined, monochromatic.

## Layout
Full-bleed hero, content layered over product image. Dark full-width canvas. No strict max-width; immersive. 60px section gaps. Minimal nav (top-left + top-right corners, no heavy header).

## Motion Notes
- Hover: nav links shift Panel Gray → Ghost White
- Subtle product image parallax / glow
- Full-bleed product photography acts as a living instrument panel
- LED/indicator-style orange highlight animations behind text

## Do's
- #141414 default bg
- White text on dark
- Borders: 1px solid #000 or #8c8c8c
- Orange ONLY for indicators (never buttons)
- Tight 15px element gap
- 0.08em letter-spacing on condensed font
- 15px radius badges, 3px outlined buttons, 0px ghost

## Don'ts
- No orange CTAs
- No heavy shadows or elevation
- No gradients
- No serif fonts
- Don't deviate from condensed letter-spacing
- No ornamental visuals
- No large soft paddings

## Similar Brands
Teenage Engineering, Arturia, Native Instruments

## CSS Variables
```css
:root {
  --color-superlative-black: #141414;
  --color-instrument-gray: #232323;
  --color-panel-gray: #8c8c8c;
  --color-signal-orange: #e66f27;
  --color-ghost-white: #ffffff;
  --color-surface-white: #f6f4f2;

  --font-sl-regular-condensed: 'SL-Regular-Condensed', 'Bebas Neue', sans-serif;
  --font-sl-light: 'SL-Light', 'Open Sans Light', sans-serif;
  --font-sl-regular: 'SL-Regular', 'Open Sans', sans-serif;

  --section-gap: 60px;
  --card-padding: 30px;
  --element-gap: 15px;

  --radius-badges: 15px;
  --radius-buttons: 3px;
}
```

## Key Insight
The "instrument panel" archetype: tightly engineered, technical, mechanical typography with restraint orange used as a status indicator (never CTA).
