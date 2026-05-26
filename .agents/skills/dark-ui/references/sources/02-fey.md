# Fey — Style Reference
> Deep-space observatory control panel

**URL:** https://feyapp.com
**Refero ID:** 733e6475-892a-4138-8835-bf40344df317
**Theme:** dark
**Category Tags:** Dark UI, Finance, Data Viz, Premium

## Tokens — Colors (multi-tier blacks + 2 accents + 3 gradients)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Ink | `#0b0b0b` | `--color-midnight-ink` | **Page bg** |
| Obsidian Deep | `#131313` | `--color-obsidian-deep` | Card bg, modals |
| Coal Dust | `#191919` | `--color-coal-dust` | Accent bg, dividers |
| Slate Text | `#868f97` | `--color-slate-text` | Secondary body, disabled |
| Ash Gray | `#999999` | `--color-ash-gray` | Tertiary text |
| Silver Accents | `#cccccc` | `--color-silver-accents` | Subtle outlines |
| Light Smoke | `#e6e6e6` | `--color-light-smoke` | **CTA bg, button text on dark** |
| Pure White | `#ffffff` | `--color-pure-white` | Primary text |
| **Cosmic Blue** | `#479ffa` | `--color-cosmic-blue` | **Interactive states, links, active** |
| **Solar Flare** | `#ffa16c` | `--color-solar-flare` | Decorative headings, key highlights |
| Emerald Profit | `#4ebe96` | `--color-emerald-profit` | Positive data, success |
| Warn Gradient 1 | `linear-gradient(97.13deg, rgb(255,161,108), rgb(85,27,16))` | gradient | Feature highlights |
| Cool Gradient 1 | `linear-gradient(96.44deg, rgb(182,214,255), rgb(57,63,86))` | gradient | Data viz |
| Vibrant Gradient 1 | `linear-gradient(96.44deg, rgb(214,254,81), rgb(88,81,11))` | gradient | Energy/growth |

## Typography (single font, 4 weights)
### Calibre (Sole)
- Sub: Inter. Weights: 400, 500, 600, 700
- Sizes: 10-54px (11 values)
- Letter-spacing: -0.08em (display), -0.053em (heading), normal (body)

## Spacing & Shapes
- Base 4px and 8px multiples
- Page max-width: **1220px**
- Section gaps: 900-1100px (extreme!)
- Card padding: 18px vertical, 20px horizontal

### Border Radius (multi-tier)
| Element | Value |
|---------|-------|
| input-sm | 6px |
| buttons-square | 6px |
| general | 10px |
| **cards** | **16px** |
| **buttons-pill** | **99px** |

## Components

### Navigation Button - Filled (CTA)
**Light Smoke (#e6e6e6) bg, BLACK text, 99px radius, 7/16 padding**.

### Notification Bubble Button
`rgba(255,255,255,0.05)` bg, **bottom-only border `rgba(255,255,255,0.1)`**, Light Smoke text, 6px radius, 3.75/8-10 padding. Shadow `rgba(0,0,0,0.85) 0 1px 0 0`.

### App Preview Card
**Obsidian Deep bg, 16px radius, shadow `rgba(0,0,0,0.8) 0 0 44px 0` (large glow)**.

### Pill Accent Tag
Transparent bg, **text Light Smoke OR Emerald Profit**, 99px radius, 12px Calibre.

### Profile Avatar
**Circular 50px radius**.

## Imagery
**Product screenshots in device mockups** (laptops/tablets) with slight perspective. Dark atmospheric photography of solitary figures, obscured faces, introspective. Establishes mood + showcases UI. Mono-color outlined OR filled simple icons.

## Layout
Max-width **1220px** centered. Hero full-bleed dark with centered headline. Sections alternate Midnight Ink ↔ Obsidian Deep. Generous **900-1100px section gaps**. Card grids for features.

## Motion Notes
- Subtle data viz animations (number ticks)
- Card hover: subtle bg shift
- Pill hover: opacity/intensity change
- Notification bubbles slide in
- Glow shadow on App Preview Card amplifies on hover

## Do's
- Midnight Ink (#0b0b0b) primary bg
- Calibre 400 body, 600 subheadings
- **Cosmic Blue ONLY for interactive/active**
- Solar Flare for decorative headings
- Obsidian Deep for elevated surfaces
- **99px radius for primary CTAs (pill)**
- 4/8px spacing multiples

## Don'ts
- No chromatic colors beyond Cosmic Blue/Solar Flare
- No drop shadows on non-elevated elements
- No radii < 6px on interactive
- No lightening text for emphasis (use Pure White, Light Smoke, Slate)
- No dense info without min 4px element gap

## Similar Brands
Linear, Raycast, Superhuman, Revolut

## Key Insight
**The "financial dark UI" archetype.** Multi-tier black surface stack (#0b → #13 → #19) for depth without shadows. Cosmic Blue + Solar Flare = interactive vs. highlight binary. Light Smoke (#e6e6e6) CTA bg with BLACK text is unusual — most dark UI use bright accents. **99px pill** for CTAs + **16px** cards = clear hierarchy.
