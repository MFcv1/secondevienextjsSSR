# Moving Parts — Style Reference
> High-contrast geometric clarity

**URL:** https://movingparts.io
**Refero ID:** fb459c9d-c089-4d0b-b5b0-d147b1c4ebd7
**Theme:** light
**Category Tags:** Motion, Bold Color, Geometric, Editorial Display

## Tokens — Colors (rich palette with conic gradient)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Ink | `#000000` | `--color-midnight-ink` | Primary text, headers, icon strokes |
| Canvas White | `#ffffff` | `--color-canvas-white` | Page bg, card surfaces |
| Ghostly Gray | `#121212` | `--color-ghostly-gray` | Dark sections, soft black |
| Fog Grid | `#bcc1c7` | `--color-fog-grid` | Decorative bg grids, subtle outlines |
| Warm Mist | `#efefef` | `--color-warm-mist` | Subtle bg panels, soft dividers |
| Cloud Gray | `#b3b3b3` | `--color-cloud-gray` | Inactive states |
| Pale Ash | `#999999` | `--color-pale-ash` | Helper text, tertiary info |
| Deep Royal Blue | `#0000ff` | `--color-deep-royal-blue` | **THE CTA color** — exclusive brand accent |
| Emerald Green | `#00d37c` | `--color-emerald-green` | Highlight bg, soft emphasis |
| Conic Spectrum | `conic-gradient(rgb(87,192,241) 0%, rgb(74,166,232) 13%, rgb(134,57,162) 26%, rgb(239,137,159) 42%, rgb(234,57,42) 55%, rgb(239,115,53) 62%, rgb(245,192,68) 73%, rgb(245,255,84) 84%, rgb(160,218,83) 95%, rgb(87,192,241) 100%)` | `--gradient-conic-spectrum` | Decorative gradients, abstract visuals — full rainbow |

## Typography (10+ fonts!)
### Unica77 (Primary)
- Sub: Roboto. Weights: 400, 500, 600, 700
- Sizes: 18-110px (22 distinct values!)
- **OpenType:** `"salt", "ss01"–"ss09"` (massive stylistic set use)

### PP Neue Montreal (Display)
- Sub: Inter. Weights: 400, 500
- Sizes: 27, 32, 60, 81, 98px
- Letter spacing: -0.0300em at 98px, -0.0100em at 60px

### Druk XXCondensed Super (Massive Display)
- Sub: Oswald Condensed. Weight 400. Sizes: **195, 248px**

### Whyte Semi-Mono (Body)
- Sub: Space Mono. Weights: 400, 500, 600. Sizes: 12-35px

### Plus: Fraunces 72pt Soft, TAN-BUSTER, Inter, Arial, ui-monospace

### Type Scale
| Role | Size | Line Height | Tracking |
|------|------|-------------|----------|
| body | 17 | 1.18 | -0.1px |
| subheading | 21 | 1.2 | 0.21px |
| heading-sm | 27 | 1.2 | 0.27px |
| heading | 60 | 0.85 | -0.6px |
| heading-lg | 98 | 0.82 | -2.94px |
| display | 248 | 1.2 | — |

## Spacing & Shapes
- Base 4px, comfortable
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 68, 80, 84, 120, 148, 172
- Section gap: 40px
- Card padding: 30px
- Element gap: 13px

### Border Radius (extreme contrast)
| Element | Value |
|---------|-------|
| smallElements | 2.5px |
| images | 14px |
| icons | 18px |
| **cards** | **90.3833px** |
| **largeCards** | **106.333px** |
| buttons | **0px** (sharp!) |

### Shadow (single defined)
`rgba(0,0,0,0.3) 15px 20px 30px 0px` — only on cards

## Components

### Primary Action Button
**Deep Royal Blue (#0000ff) bg**, Canvas White text, **0px radius (sharp)**, 25px/30px padding, Unica77 font.

### Ghost Button (Primary)
Transparent, Midnight Ink text, 0px radius, 25/30 padding, Unica77.

### Pill Button (Neutral)
Cloud Gray bg, Midnight Ink text, **18px radius**, minimal padding.

### Rounded Corner Card
Canvas White bg, **90.3833px radius (extreme!)**, no shadow.

### Large Rounded Card (Bottom-Flat)
**Deep Royal Blue bg, 106.333px 106.333px 0px 0px radius** (rounded top, flat bottom). Hero/feature container.

### Text Input (Base)
Canvas White bg, Midnight Ink text, 0px radius, 25/30 padding.

## Imagery
Bright product screenshots of mobile UI on Deep Royal Blue backgrounds. Abstract geometric shapes with **conic gradients** as decorative elements. Outlined icons. Minimal photography (high-contrast).

## Layout
Max-width contained, centered. Hero: full-width visual with large centered headline + CTA. Alternating bg colors (white/dark/blue) creating distinct blocks. Single-column or two-column text/image patterns. Typography dominates hierarchy. Persistent minimal top nav.

## Motion Notes
- Conic gradient rotates/animates in decorative elements
- Bottom-flat rounded cards (106.333px top radius) create dynamic shapes
- Multi-font typography choreography across page
- Stylistic set (`ss01`-`ss09`) variants animate on hover for Unica77

## Do's
- #000 text/headlines for contrast
- **#0000ff EXCLUSIVELY for CTAs** (sole dominant accent)
- Unica77 with stylistic sets for character
- Large confident typography, tighter letter-spacing on big sizes
- **90.3833px cards / 106.333px large containers** (signature)
- 0px radius on buttons (sharp contrast to soft cards)
- 25px vertical / 30px horizontal padding on interactive

## Don'ts
- No new saturated primary colors — Deep Royal Blue is THE accent
- Avoid generic small radii — use 0px OR extreme (90/106px)
- No subtle gray for primary content/CTAs
- No additional shadows beyond the defined one
- Don't break grid with overlapping free-form
- No thin lightweight type for headlines
- Don't use Arial/ui-monospace except for code

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #ffffff | Base page |
| 1 | #efefef | Soft section distinction |
| 2 | #121212 | Strong dark accent |

## Similar Brands
Framer, Linear, Spline, Vercel

## CSS Variables
```css
:root {
  --color-midnight-ink: #000000;
  --color-canvas-white: #ffffff;
  --color-deep-royal-blue: #0000ff;
  --color-emerald-green: #00d37c;
  --color-warm-mist: #efefef;
  --gradient-conic-spectrum: conic-gradient(/* full rainbow */);

  --font-unica77: 'Unica77', Roboto, sans-serif;
  --font-pp-neue-montreal: 'PP Neue Montreal', Inter, sans-serif;
  --font-druk-xxcondensed-super: 'Druk XXCondensed Super', 'Oswald Condensed', sans-serif;
  --font-whyte-semi-mono: 'Whyte Semi-Mono', 'Space Mono', monospace;

  --text-display: 248px; --leading-display: 1.2;
  --text-heading-lg: 98px; --leading-heading-lg: 0.82; --tracking-heading-lg: -2.94px;

  --section-gap: 40px;
  --card-padding: 30px;
  --element-gap: 13px;

  --radius-cards: 90.3833px;
  --radius-largecards: 106.333px;
  --radius-buttons: 0px;
  --radius-icons: 18px;
  --radius-images: 14px;

  --shadow-xl: rgba(0,0,0,0.3) 15px 20px 30px 0px;
}
```

## Key Insight
**Bipolar radius system**: 0px sharp buttons + 90/106px ultra-soft pill cards. The contrast creates dynamic visual rhythm. Pure `#0000ff` blue is unusual & memorable. 10+ fonts with massive stylistic set use (`ss01`-`ss09`) creates hyper-personalized typography that resists "AI slop". Conic gradient as decorative element.
