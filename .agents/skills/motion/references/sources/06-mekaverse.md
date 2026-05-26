# MekaVerse — Style Reference
> Deep-space holographic command center

**URL:** https://themekaverse.com
**Refero ID:** 09e43758-12c5-4a2b-8ae8-ded156ef66bf
**Theme:** dark
**Category Tags:** Motion, Dark UI, Sci-Fi, 3D Backgrounds

## Tokens — Colors (rich dark + multi-accent palette)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Void Black | `#000000` | `--color-void-black` | Page bg, primary text on light |
| Cloud White | `#ffffff` | `--color-cloud-white` | Primary text on dark, ghost borders |
| Light Mist | `#b8bab9` | `--color-light-mist` | Subtle muted panels |
| Ghost Gray | `#e2e2e2` | `--color-ghost-gray` | Decorative borders, dividers |
| Control Gray | `#444345` | `--color-control-gray` | Solid button bg, weighted interactive |
| Page Blue | `#2e9ec3` | `--color-page-blue` | Decorative accent (NOT CTA) |
| Page Red | `#bc1010` | `--color-page-red` | Decorative accent (NOT CTA) |
| Page Pink | `#d69dbb` | `--color-page-pink` | Tertiary accent |
| Page Light Blue | `#20b0d7` | `--color-page-light-blue` | Lightest blue accent |
| Page Blue Grey | `#9faac0` | `--color-page-blue-grey` | Cool-toned neutral textural |

## Typography
### Roobert (Display)
- Sub: Montserrat, Weights: 400, Sizes: 26, 30, 80px
- Line height: 0.78, 1.00, 1.15
- **OpenType:** `"liga" 0` (ligatures off — important for technical mono-like look)

### GT America Mono Regular (Body)
- Sub: Roboto Mono. Sizes: 10, 12px. **Letter-spacing -0.02em**

## Spacing & Shapes
- Base: 4px, comfortable
- Scale: 4, 16, 20, 40, **116** (sparse but extreme)
- Section gap: 40px
- Card padding: 20px
- Element gap: 20px

### Border Radius (multi-tier)
| Element | Value |
|---------|-------|
| buttons | 2px |
| navItems | 2px |
| cards | 10px |
| containers | 20px |

## Components

### Primary Ghost Button
`rgba(255,255,255,0.2)` bg (translucent white), Cloud White text, 1px solid Cloud White border, 2px radius, 0px/20px padding.

### Text Link Button
Transparent, Cloud White text, no border, no padding.

### Dark Filled Button
Void Black bg, Cloud White text, 1px Void Black border, 2px radius, 0/20 padding.

### Muted Action Button
Control Gray bg, Cloud White text, 1px Control Gray border, 2px radius — for secondary functions.

### Navigation Item
Transparent bg, Cloud White text. **1px Cloud White underline border on hover/active.** Roobert font.

### Content Card
Often transparent or very dark, hairline 1px Ghost Gray or Cloud White border, 10px radius, 20px internal padding.

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 1 | #000000 | Page bg |
| 2 | #444345 | Buttons |
| 3 | #b8bab9 | Muted info panels |
| 4 | #ffffff | Highlights/borders |

## Imagery
**Highly detailed 3D rendered world maps** as full-bleed atmospheric backgrounds. Sci-fi/fantasy illustrations dimensional, detailed. Icons minimalist outlined white.

## Layout
Full-bleed page model. Hero: full-viewport image with centered headlines overlay. Seamless rhythm with image transitions. 40px section gaps. Centered stacks of headline + subtext + ghost button. Transparent sticky top bar.

## Motion Notes
- 3D map slowly pans/rotates in background
- Text overlay fade/slide reveals
- Hover: nav item shows white underline border
- Translucent ghost buttons let world map show through
- Layered, parallax-feeling background depth without literal parallax

## Do's
- Use Void Black bg dominantly
- Cloud White text throughout
- Roobert (large) + GT America Mono (small) pairing
- 4px base unit, 20px gaps, 40px sections
- 2px radius buttons, 10/20px containers
- Ghost buttons with translucent white bg
- ONE accent per section (resist using all colors at once)

## Don'ts
- No bright/saturated bg
- Don't deviate from Roobert + Mono pairing
- No heavy drop shadows
- No generic button styles
- No large white space gaps on dark — content must integrate
- Don't exceed 2px radius on buttons/nav
- Single accent per section only

## Similar Brands
Star Atlas, Cyberpunk 2077, Immutable X, Decentraland

## CSS Variables
```css
:root {
  --color-void-black: #000000;
  --color-cloud-white: #ffffff;
  --color-control-gray: #444345;
  --color-page-blue: #2e9ec3;
  --color-page-red: #bc1010;
  --color-page-pink: #d69dbb;

  --font-roobert: 'Roobert', Montserrat, sans-serif;
  --font-gt-america-mono-regular: 'GT America Mono', 'Roboto Mono', monospace;

  --section-gap: 40px;
  --card-padding: 20px;
  --element-gap: 20px;

  --radius-buttons: 2px;
  --radius-navitems: 2px;
  --radius-cards: 10px;
  --radius-containers: 20px;
}
```

## Key Insight
Multi-tier radius system (2/10/20) lets buttons feel sharp/technical while content cards soften. Multi-accent palette (blue/red/pink) used decoratively, never CTA. Translucent ghost buttons let 3D backgrounds breathe through.
