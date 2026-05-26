# Pangram Pangram Foundry — Style Reference
> Type foundry's bold canvas: white pages, dark headers, expressive typography, soft rounded containers

**URL:** https://pangrampangram.com
**Refero ID:** 6d64a4da-ef40-453e-86f7-4bfabc0c9051
**Theme:** light
**Category Tags:** Serif Display, Type Foundry, Bold Color, Soft Cards

## Tokens — Colors (mono + 3 status colors)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink | `#000000` | `--color-ink` | Primary text, headers, button fill |
| Canvas | `#fafafa` | `--color-canvas` | **Page bg** — slight off-white |
| Paper | `#ededed` | `--color-paper` | Cards, button bg secondary |
| Slate | `#666666` | `--color-slate` | Muted text, secondary links |
| **Alert Red** | `#ff2f00` | `--color-alert-red` | **Primary CTA** + selected nav, status |
| Update Yellow | `#ffb700` | `--color-update-yellow` | Update badges |
| Early Access Blue | `#bfe0ff` | `--color-early-access-blue` | Early access badges |

## Typography (15 fonts!)
### Neue Montreal (Primary)
- Sub: Inter. Weights: 400, 530, 600
- Sizes: 12-145px (11 values). Letter-spacing: **always normal**

### Plus 14 specimen display fonts at 103px each:
- neue-montreal-semibold, neue-york-normal-bold, frama-semibold, kyoto-semibold, neue-gstaad-normal-bold, palma-fizzy-heavy (weight 800!), mori-bold, museum-light (weight 300), neue-corp-normal-semibold, watch-medium (weight 485), monument-narrow-medium (weight 525), model-plastic-regular

### Type Scale
| Role | Size |
|------|------|
| caption | 12 |
| body | 16 |
| heading-sm | 24 |
| heading | 36 |
| heading-lg | 48 |
| display-sm | **121** |
| display | **145** |

## Spacing & Shapes
- Base 4px, comfortable
- Section gap: 92px
- Card padding: 26px
- Element gap: 8px

### Border Radius (uniform 20px + 999px badges)
| Element | Value |
|---------|-------|
| **cards** | **20px** |
| **inputs** | **20px** |
| **buttons** | **20px** |
| badges | **999px** |

## Components

### Filled Button - Dark
**Ink bg, Canvas text, 20px radius, 7.65/22.95px padding**.

### Filled Button - Light
Paper or Canvas bg, Ink text, 20px radius.

### Outlined Button - Light
Transparent, Canvas text + 1px Canvas border, 20px radius.

### Outlined Button - Accent
Transparent, **Alert Red text + Alert Red border**, 20px radius.

### Font Showcase Card - Filled
Paper bg, 20px radius, 25.72px padding, no shadow.

### Font Showcase Card - Transparent
Transparent, 20px radius, 25.72px padding.

### Text Input
Canvas bg, Ink text + 1px Ink border, 20px radius, 24px/45.9px padding.

### Status Badge - Alert Red ("New")
Alert Red bg, Ink text, **999px pill**, 4px/11.65px padding.

### Status Badge - Update Yellow
Update Yellow bg, Ink text, 999px pill.

### Status Badge - Early Access Blue
Early Access Blue bg, Ink text, 999px pill.

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #fafafa (Canvas) | Page bg |
| 1 | #ededed (Paper) | Cards, secondary buttons |

## Imagery
Hero: large atmospheric photography or blurred abstract product shots with dark overlay. Other sections: product-focused (often food items relevant to font names!) full-bleed. Outlined minimal monochrome icons.

## Layout
Full-bleed hero + content max-width below. Hero: large centered headline + CTA over image bg. **92px section gaps**. **4-column card grid** for font showcases. Sticky minimal top nav.

## Motion Notes
- Card hover: subtle bg color shift
- Font showcase cards may animate weight on hover
- Smooth scroll between sections
- Status badges may pulse subtly

## Do's
- Neue Montreal for ALL text, varying weights/sizes for hierarchy
- **20px radius on ALL interactive (buttons/inputs/cards)**
- Alert Red SOLELY for new features/CTAs/status
- Canvas (#fafafa) general bg + Paper (#ededed) cards
- Ink (#000) headings on light bg
- 7.65px/22.95px button padding
- **999px badge radius** (pill)

## Don'ts
- **NO shadows** (bg color + borders + radius for depth)
- No Alert Red for body text or non-actionable
- No deviation from 20px or 999px radii
- No additional chromatic colors beyond defined
- No dense info-heavy text without spacing
- No thin strokes for borders (1px solid Ink/Canvas)
- **No letter-spacing other than 'normal'** for Neue Montreal

## Similar Brands
Fonts.com, Google Fonts, Future Fonts, Displaay Type Foundry

## Key Insight
**The "soft canvas type foundry" archetype.** ONE workhorse font (Neue Montreal) for ALL UI + 14 specimen display fonts (each unique role!) at exactly 103px for showcasing. Strict 20px / 999px radius dichotomy. Alert Red as singular CTA energy. Canvas (#fafafa) avoids cold pure white. **Letter-spacing 'normal' rule** is unusual — most foundries push tight tracking.
