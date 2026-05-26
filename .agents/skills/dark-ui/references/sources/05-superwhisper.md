# Superwhisper — Style Reference
> Celestial Command Center: dark gradient-infused UI

**URL:** https://superwhisper.com
**Refero ID:** b8a8976c-52d9-4ebb-95ea-4c40f4a9acab
**Theme:** dark
**Category Tags:** Dark UI, AI Tool, Gradient, Cosmic

## Tokens — Colors (massive palette: mono + 7 vivid + 2 gradients)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Eclipse | `#000000` | `--color-midnight-eclipse` | **Page bg** |
| Starless Night | `#030719` | `--color-starless-night` | Secondary bg, slight depth |
| Twilight Ink | `#1C1D1F` | `--color-twilight-ink` | Muted text, low-contrast borders |
| Ghostly Gray | `#E5E7EB` | `--color-ghostly-gray` | Hi-contrast text on dark, borders |
| Deep Ocean | `#001B33` | `--color-deep-ocean` | Cool blue-tinted dark cards |
| Frost | `#FFFFFF` | `--color-frost` | Primary text, badges, light cards |
| Iron Gray | `#666666` | `--color-iron-gray` | Placeholder, inactive icons |
| Slate Gray | `#70757C` | `--color-slate-gray` | Muted text, secondary links |
| Pewter | `#999999` | `--color-pewter` | Dividers |
| **Electric Blue** | `#0088FF` | `--color-electric-blue` | **Primary accent + CTA hover** |
| Vivid Green | `#16C253` | `--color-vivid-green` | Success states |
| Sunset Orange | `#E6714F` | `--color-sunset-orange` | Key word highlights |
| Goldenrod | `#FFB764` | `--color-goldenrod` | Warning bg |
| Magenta Burst | `#B855E7` | `--color-magenta-burst` | Feature card bg |
| Sunshine Yellow | `#FFDD00` | `--color-sunshine-yellow` | Warning highlights |
| Crimson Red | `#FF5252` | `--color-crimson-red` | Errors |
| Teal Glow | `#1CECBb` | `--color-teal-glow` | Special highlights |
| Fuchsia Flare | `#DD55e7` | `--color-fuchsia-flare` | Text accents |
| Sky Blue | `#60A5FA` | `--color-sky-blue` | Embedded link color |
| **Twilight Gradient** | `linear-gradient(rgba(0,0,0,0.5) 0.85%, rgba(0,5,46,0.5) 25.81%, rgba(41,40,94,0.5) 58.36%, rgba(84,60,123,0.5) 79.52%, rgba(133,90,146,0.5) 95.8%, rgba(195,134,171,0.5) 107.19%)` | gradient | Hero bg |
| **Nebula Horizon** | `linear-gradient(rgb(0,0,0) 0.85%, rgb(17,45,114) 33.4%, rgb(75,82,170) 49.68%, rgb(168,135,220) 70.84%, rgb(230,196,231) 95.8%, rgb(252,219,239) 107.19%)` | gradient | Alt hero, deeper space |

## Typography (4 fonts)
### Inter (Primary)
- Sub: system-ui. Weights: 300, 400, 500, 600, 700
- Sizes: 8-60px (16 values). Letter-spacing -0.057 to 0.01

### ui-monospace (Sparingly)
- Weights: 300, 400. Size 11px. For technical details

### -apple-system (Fallback)
- Native OS-like rendering

### Flow Circular (Decorative)
- Weight 400. Sizes 14, 16px. **Custom organic typeface for brand callouts**

## Spacing & Shapes
- Base 4px, comfortable
- Section gap: 32px (compact!)
- Card padding: 24px, Element gap: 16px

### Border Radius (multi-tier)
| Element | Value |
|---------|-------|
| **button** | **4px** (sharp!) |
| **default** | **9px** |
| card | 24px |
| image | 24px |
| **pill** | **9999px** |

## Components

### Primary Ghost Button
**Frost text + transparent bg + Ghostly Gray border, 9999px pill, 10/16 padding**.

### Pill Download Button (Light)
Frost text + `rgba(228,232,239,0.1)` bg, 9999px pill.

### Pill Download Button (Dark)
Frost text + Midnight Eclipse bg, 9999px pill.

### Feature Card (Gradient BG)
**Nebula Horizon gradient bg, 24px radius, 24px padding**.

### Standard Card (White BG — light card on dark!)
**Frost (#fff) bg, 24px radius, 24px padding, shadow `rgba(0,0,0,0.25) 0 1px 4px 0, rgba(0,0,0,0.1) 0 4px 59px 0`**.

### Success Badge
Vivid Green bg, **`24px top/bottom + 10px side` radius (asymmetric!)**, 16/24 padding.

### Warning Badge
Goldenrod bg, same asymmetric 24/10 radius.

### Form Input
`rgba(255,255,255,0.1)` bg, Frost text, 9px radius, 8/12/100px padding (asymmetric right).

### Header Download Button (CTA)
**Frost (#fff) bg, Midnight Eclipse text, 9999px pill**. Inverse for header attention.

## Surfaces (4 tiers including white card!)
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #000000 | Page bg base |
| 1 | #030719 | Subtle elevated |
| 2 | #001b33 | Cool dark tint cards |
| 3 | #FFFFFF | **High-contrast white cards (breaks dark theme)** |

## Imagery
**Abstract ethereal gradient backgrounds** suggesting cosmic expanses. Realistic product screenshots in laptop/phone mockups, contained. Minimal high-contrast silhouette photography. Mono Frost or Ghostly Gray icons, occasionally accented Electric Blue.

## Layout
Max-width contained centered. Hero: Nebula/Twilight gradient + centered headline + CTAs. **Sections alternate dark gradient ↔ Frost (white) cards** for rhythmic dark/light contrast. Centered stacks or alternating 2-col text/image. 3-4 col feature grids. Sticky top bar with prominent Download button.

## Motion Notes
- Twilight/Nebula gradient slow drift
- Card hover: subtle shadow lift
- Button hover: Electric Blue intensity
- Input focus: white ring
- Inset white shadows (0 0 0 2px inset white) for icon hover states
- "Celestial command center" feel

## Do's
- Midnight Eclipse (#000) for non-gradient bg
- Frost (#fff) primary text + Ghostly Gray secondary/borders
- **9px radius default + 9999px pill** for buttons/tags
- Electric Blue as PRIMARY accent
- 16px element gap, 32px section gap
- Inter weights 300-700
- White text overlay on gradients

## Don'ts
- Electric Blue NEVER as bg (accent only)
- No sharp corners on interactive (9px or 9999px)
- Don't use Frost as default page canvas (only elevated cards)
- No deviation from Inter (except Flow Circular decorative)
- No generic full-bleed images without context
- **No subtle shadows on dark bg** — use `rgba(0,0,0,0.25)` prominent OR inset white

## Similar Brands
Linear, Stripe, Notion, Raycast

## Key Insight
**The "celestial gradient command" archetype.** Twilight + Nebula gradients = "cosmic void" hero. Multi-tier radius (4px buttons + 9px default + 24px cards + 9999px pills) creates clear hierarchy. **White Frost cards on dark theme** for elevated content emphasis. Asymmetric badge radius (24/10/24/10) = unique visual signature. **Inset white shadows** for icon hover states unique to this archetype.
