# Heavyweight — Style Reference
> Type foundry catalog on stark white

**URL:** https://heavyweight-type.com
**Refero ID:** d991c31d-2ffa-4a94-ab37-7f7d8f7d6a0c
**Theme:** light
**Category Tags:** Motion, High Contrast, Typography-First, Editorial

Heavyweight Type embraces a stark, high-contrast aesthetic, juxtaposing crisp black text and borders against expansive white and light gray surfaces. Typography is the undisputed hero, presented in large, impactful custom fonts that demand attention without heavy graphic treatments. Minimal use of color, reserving a single vivid green as a subtle 'new' flag.

## Tokens — Colors
| Name | Value | Token | Role |
|------|-------|-------|------|
| Heavy Ink | `#222222` | `--color-heavy-ink` | Primary text, surface borders, dark button bg |
| Canvas White | `#ffffff` | `--color-canvas-white` | Page bg, card bg, text on dark |
| Surface Frost | `#f3f5fa` | `--color-surface-frost` | Secondary surfaces, default button bg |
| Border Graphite | `#2d2d2d` | `--color-border-graphite` | Subtle borders, dividers |
| Muted Ash | `#888888` | `--color-muted-ash` | Secondary text, disabled states |
| Accent Green | `#39d17f` | `--color-accent-green` | "New" tags, focused UI edges |

## Tokens — Typography
### Nuckle (Custom)
- Substitute: Inter
- Weights: 400, 500
- Sizes: 14px, 16px
- Line height: 1.00, 1.14, 1.25
- Letter spacing: 0.013em (14px), 0.014em (16px)

## Spacing & Shapes
- Density: comfortable
- Section gap: **166px** (huge, generous breathing room)
- Card padding: 12px
- Element gap: 12px
- Border radius: 11px (cards/default), 10px (small buttons)
- Spacing scale: 4, 5, 7, 8, 10, 12, 18, 30 (irregular — only what's needed)

## Components

### Default Button
Surface Frost bg, Heavy Ink text, 1px Heavy Ink border, 11px radius, 12px/18px padding.

### Primary Dark Button
Heavy Ink bg, Canvas White text, 1px Canvas White border (inverse), 10px radius, 7px/10px padding.

### Outlined Light Button
Canvas White bg, Heavy Ink text, 1px Heavy Ink border, 10px radius, 7px/10px padding.

### Font Showcase Card (Minimal)
Transparent bg, no shadow, 0px radius, 4px internal vertical spacing.

### Font Showcase Card (Aspect-ratio container)
Transparent bg, no shadow, 11px radius. Padding-bottom enforces aspect ratio for video/animated previews.

### Navigation Link
Nuckle 16px, Heavy Ink color. 5px/8px padding, 23-166px right margin.

## Surfaces
| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Canvas White | #ffffff | Base page |
| 2 | Surface Frost | #f3f5fa | Cards, secondary |
| 3 | Heavy Ink | #222222 | High-contrast accents |

## Imagery
Black-on-black or inverse graphic representations of typography. High-contrast, artistic, technical. Contained in cards (sometimes with 11px radius). Product-focused, no lifestyle. Icons simple, outlined, monochromatic.

## Layout
Max-width ~1200px container with large horizontal margins. Hero: centered headline over dark background. Below: responsive 3-4 column card grid. **Section gap: 166px** (extreme vertical breathing room). Persistent top nav bar.

## Do's
- High contrast achromatic base + single accent (green only for functional highlights)
- 11px radius cards/default, 10px smaller buttons
- Nuckle 16px line-height 1.25 for body
- Generous 12px element spacing, 12px card padding
- Strong dark borders around interactive elements

## Don'ts
- No additional saturated colors — green is the ONLY chromatic accent
- No heavy drop shadows or intrusive gradients
- Don't use overly dense layouts
- Don't deviate from custom font families
- No small/indistinct borders
- **Keep motion subtle** — opacity, background-color transitions only. No distracting animations.

## Motion Notes (extracted from "motion heavy" tag)
Despite being motion-heavy, the don'ts say "keep motion subtle (e.g., opacity, background-color transitions)". The heaviness here is in:
- Custom font load with weight transitions
- Animated font preview cards (aspect-ratio container with video/canvas inside)
- Smooth scroll-triggered reveals
- Hover state color transitions on buttons (Surface Frost → Heavy Ink)

## Similar Brands
- Pangram Pangram Foundry
- Future Fonts
- Grilli Type
- Swiss Typefaces

## CSS Variables
```css
:root {
  --color-heavy-ink: #222222;
  --color-canvas-white: #ffffff;
  --color-surface-frost: #f3f5fa;
  --color-border-graphite: #2d2d2d;
  --color-muted-ash: #888888;
  --color-accent-green: #39d17f;

  --font-nuckle-website: 'Nuckle', ui-sans-serif, system-ui, sans-serif;

  --text-body: 14px;     --leading-body: 1.14;     --tracking-body: 0.18px;
  --text-body-lg: 16px;  --leading-body-lg: 1.25;  --tracking-body-lg: 0.22px;

  --section-gap: 166px;
  --card-padding: 12px;
  --element-gap: 12px;
  --radius-all: 11px;
}
```
