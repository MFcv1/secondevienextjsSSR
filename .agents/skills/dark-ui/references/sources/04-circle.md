# Circle — Style Reference
> Galactic UI with soft glow

**URL:** https://www.circle.so
**Refero ID:** ab8450d9-1b42-4395-aa24-9e277f021aa1
**Theme:** light (with dark gradient hero — hybrid)
**Category Tags:** Dark UI, Community, Soft, Pastel Accents

## Tokens — Colors (mono + soft pastel accents + indigo gradient)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Eclipse | `#0a0a0a` | `--color-midnight-eclipse` | Primary text, deep surface |
| Canvas White | `#ffffff` | `--color-canvas-white` | Page bg, cards, active inputs |
| Slate Border | `#e4e7eb` | `--color-slate-border` | Subtle borders, dividers |
| Dark Knight | `#191b1f` | `--color-dark-knight` | Secondary text, muted headings |
| Silver Whisper | `#737373` | `--color-silver-whisper` | Helper text, placeholders |
| **Deep Indigo** | `linear-gradient(142deg, rgb(64,143,237) 18.68%, rgb(62,27,201) 78.25%)` | gradient | **Hero bg gradient** |
| Sky Burst | `#408fed` | `--color-sky-burst` | Gradient start point |
| Periwinkle Mist | `#e0eafc` | `--color-periwinkle-mist` | Soft button bg |
| Lavender Haze | `#f2dbf5` | `--color-lavender-haze` | Soft button bg, input hover |
| Peach Cream | `#fff0d8` | `--color-peach-cream` | Soft button bg |
| Rose Blush | `#ffe0e2` | `--color-rose-blush` | Soft button bg |
| Ocean Mint | `#e4f6f4` | `--color-ocean-mint` | Soft button bg |
| Focus Blue | `#539cf2` | `--color-focus-blue` | Decorative, focus rings |
| Crimson Alert | `#ef4444` | `--color-crimson-alert` | Link/tag emphasis |

## Typography (single font)
### Inter (Sole)
- Sub: system-ui. Weights: 400, 500, 600, 700
- Sizes: 10-64px (12 values)
- Letter-spacing: progressive (-0.05em @ 64px, -0.016em @ 18-24px, +0.05em @ 10px)

### Type Scale
| Role | Size | Tracking |
|------|------|----------|
| caption | 10 | 0.5px |
| body | 16 | -0.16px |
| heading | 32 | -0.74px |
| heading-lg | 40 | -0.92px |
| display | 48 | -1.24px |
| display-lg | 56 | -1.45px |
| **headline** | **64** | -1.6px |

## Spacing & Shapes
- Base 4px, comfortable
- Page max-width: **1376px**
- Section gap: 93px, Card padding: 20px, Element gap: 8px

### Border Radius (extreme pill)
| Element | Value |
|---------|-------|
| **buttons** | **9999px** (pill) |
| **inputs** | **9999px** |
| cards | 24px |
| decorative | 32px |

## Components

### Ghost Navigation Button
**Transparent bg, Midnight Eclipse text, 1px Slate Border, 14/28 padding, 9999px pill**.

### Accent Filled Button (CTA)
**Pastel bg (Periwinkle/Lavender/Peach/Rose/Mint) + Midnight Eclipse text, 9999px pill, 8/16 padding**. **NO dedicated CTA color** — accent-tinted lights ARE the CTA.

### Product Feature Card
Canvas White bg, **shadow `rgba(169,169,169,0.08) 0 4px 8px 0`**, 20px radius, 32px padding.

### Translucent Highlight Card
**`rgba(255,255,255,0.5)` bg (semi-transparent on dark gradient)**, 24px radius, 20px padding.

### Input Field
Canvas White bg, 1px Slate Border, **9999px pill radius**, 4/24 padding. **2px Focus Blue ring on focus**.

### Dark Themed Feature Card
**`rgba(255,255,255,0.18)` bg (translucent on dark)**, 20px radius, 8px padding.

## Surfaces (5 tiers!)
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #ffffff | Page bg |
| 1 | #fef2f2 | Pale rose accent |
| 2 | #fff0d8 | Peach tint |
| 3 | #e4f6f4 | Aqua mist |
| 4 | #e0eafc | Periwinkle |

## Imagery
**Illustrative abstract graphics with soft glows + gradients.** Product screenshots in slightly rounded frames with subtle shadows. Professional portrait photography for testimonials. Consistent stroke weight outlined/filled monochrome icons.

## Layout
Max-width **1376px** centered. Hero: full-bleed dark indigo gradient + centered headline + CTA. Sections alternate light ↔ dark gradient/tinted. **93px section gaps**. Sticky semi-transparent nav, becomes solid on scroll.

## Motion Notes
- Indigo gradient bg has soft drift animation
- Card subtle shadow on hover
- Input focus ring appears smoothly
- Translucent cards with blurred backdrops
- "Soft glow" hover transitions

## Do's
- Inter for ALL typography
- **9999px pill radius for ALL interactive (buttons + inputs)**
- Canvas White for primary surfaces
- Deep Indigo gradient for hero
- Slate Border for subtle dividers
- Midnight Eclipse primary text + Silver Whisper secondary
- 8px element gap

## Don'ts
- No harsh saturated bg colors
- No deviation from Inter
- **No square/sharp corners** (always pill on interactive)
- No heavy opaque shadows (use diffused 8% rgba)
- **No new primary action colors** (accent-tinted light buttons ARE CTAs)
- No excessive spacing/wide line lengths

## Similar Brands
Discord, Notion, Gumroad, Linear

## Key Insight
**The "soft galactic community" archetype.** Multi-pastel accent backgrounds (5!) used as button bg INSTEAD of one bold CTA color — unusual approach. Dark indigo gradient hero on light theme = "galactic" feel. Pill 9999px on EVERY interactive (buttons + inputs both). 5-tier surface system with pastel accent backgrounds for content blocks.
