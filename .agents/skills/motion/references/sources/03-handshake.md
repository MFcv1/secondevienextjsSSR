# Handshake — Style Reference
> Shifting gradient nebula

**URL:** https://joinhandshake.com
**Refero ID:** dba3eb4f-c1c2-437f-beb2-708e9d074729
**Theme:** light (mostly dark canvas)
**Category Tags:** Motion, Bold Color, Dark UI, Gradient Hero

Dark, dynamic canvas lit by a vibrant, shifting gradient backdrop. Bold blocky typography against fluid background. UI elements as ghost outlines or subtle containers. Single vivid green accent for CTAs.

## Tokens — Colors
| Name | Value | Token | Role |
|------|-------|-------|------|
| Deep Space | `#000000` | `--color-deep-space` | Primary text, footer bg |
| Midnight Core | `#14151c` | `--color-midnight-core` | Placeholder text, ghost button bg, input borders |
| Cosmic Gray | `#052326` | `--color-cosmic-gray` | Footer background |
| Stardust | `#ffffff` | `--color-stardust` | Heading text, body, ghost button bg, input bg |
| Guidepost Green | `#d3fb52` | `--color-guidepost-green` | Primary action, active nav, sign-up |
| Nebula Gradation | `radial-gradient(rgb(211,251,82) 0%, rgb(122,243,255) 52%, rgba(0,0,0,0) 78%)` | `--gradient-guidepost-green` | Hero radial gradient (green→cyan→transparent) |
| Muted Text | `#666666` | `--color-muted-text` | Secondary body text |

## Tokens — Typography
### NoiGrotesk (Body)
- Substitute: Inter
- Weights: 400, 500
- Sizes: 12, 14, 16, 20, 22, 28, 40 px
- Line height: 0.85, 1.10, 1.40, 1.50
- Letter spacing: -0.0250em (large), -0.0200em, -0.0150em (small)
- **OpenType:** `"ss03" on, "ss06" on, "ss12" on` ← critical, do not omit

### SansPlomb (Display)
- Substitute: Anton
- Weights: 600
- Sizes: **201px** (extreme display)
- Line height: 0.80
- Letter spacing: -0.0200em
- Use case: Page/section titles only

### Type Scale
| Role | Size | Line Height |
|------|------|-------------|
| caption | 12 | 1.4 |
| body-sm | 14 | 1.4 |
| body | 16 | 1.4 |
| subheading | 20 | 1.1 |
| heading-sm | 22 | 1.1 |
| heading | 28 | 1.1 |
| heading-lg | 40 | 0.85 |
| display | **201** | 0.8 (-4.02px tracking) |

## Spacing & Shapes
- Base unit: 8px
- Scale: 8, 16, 24, 32, 40, 64, 80, 120
- Section gap: 24px
- Card padding: 16px
- Element gap: 16px

### Border Radius
| Element | Value |
|---------|-------|
| tags | 9999px (pill) |
| cards | 24px |
| inputs | 24px |
| buttons | 8px |
| buttons-large | 12px |
| navigationItems | 8px |

## Components

### Primary Filled Button
Guidepost Green bg, Stardust text, 8px radius, 12px/16px padding.

### Primary Ghost Button (CTA variant)
No bg, Stardust text, 1px Guidepost Green border, 8px radius, 12px/16px padding.

### Navigation Ghost Button
No bg, Stardust text, 1px Midnight Core (oklab opacity 0.2) border, 8px radius, 16px all sides.

### Filter Tag
Bg `oklab(0.19794 0.0021212 -0.0139539 / 0.1)`, Stardust text, 12px radius, no padding.

### Search Input
Stardust bg, Deep Space text, 1px Midnight Core border, 24px radius, 64px left padding (icon).

### Feature Card
Bg `oklab(1 0 5.96046e-8 / 0.06)` (translucent white), no shadow, 24px radius.

## Imagery
Minimal — abstract atmospheric radial gradients as backgrounds. No photos or illustrations. Icons simple, outlined, monochromatic (Stardust/Deep Space).

## Layout
Full-bleed with content centered (no rigid max-width, gradients stretch viewport-wide). Hero: central headline over gradient + input. Sections flow seamlessly with ample vertical spacing. Sticky top nav with ghost controls + green CTA.

## Motion Notes (motion-heavy)
- Animated radial gradient backgrounds — slow rotation/displacement on hero
- Backdrop-blur or subtle parallax on gradient
- Translucent UI components let the gradient show through (`oklab(...)` opacity colors)
- Hover state: subtle border color shift on ghost buttons
- The green→cyan radial gradient is the signature animated element

## Do's
- White text + black secondary text against dynamic backgrounds
- Single vivid green accent for ALL primary CTAs
- 201px SansPlomb for major page/section titles with -0.0200em tracking
- 8px buttons, 24px cards/inputs, 9999px tags
- Implement radial gradient backdrops for hero
- 8px base unit for spacing
- Ghost buttons for secondary actions

## Don'ts
- No new vibrant colors beyond green + blue (gradient component)
- No generic box shadows or heavy borders — components must feel light
- Don't deviate from NoiGrotesk + SansPlomb pairing
- No subtle neutrals for CTAs — green only
- No completely flat design — keep subtle borders/transparency
- No generic system fonts for body — NoiGrotesk's stylistic sets are critical

## Similar Brands
- Rive (gradient + bold type + ghost UI)
- Pitch (vivid accent + dark UI + display type)
- Linear (lightweight functional UI)

## CSS Variables
```css
:root {
  --color-deep-space: #000000;
  --color-midnight-core: #14151c;
  --color-cosmic-gray: #052326;
  --color-stardust: #ffffff;
  --color-guidepost-green: #d3fb52;
  --gradient-guidepost-green: radial-gradient(rgb(211,251,82) 0%, rgb(122,243,255) 52%, rgba(0,0,0,0) 78%);

  --font-noigrotesk: 'NoiGrotesk', Inter, sans-serif;
  --font-sansplomb: 'SansPlomb', Anton, sans-serif;

  --text-display: 201px; --leading-display: 0.8; --tracking-display: -4.02px;
  --text-heading-lg: 40px; --leading-heading-lg: 0.85;

  --spacing-unit: 8px;
  --section-gap: 24px;
  --card-padding: 16px;
  --element-gap: 16px;

  --radius-tags: 9999px;
  --radius-cards: 24px;
  --radius-inputs: 24px;
  --radius-buttons: 8px;
}
```
