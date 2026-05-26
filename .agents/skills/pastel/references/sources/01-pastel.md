# Pastel — Style Reference
> Architectural Blueprint on White Marble

**URL:** https://usepastel.com
**Refero ID:** 409d92b9-00a8-4e21-a430-ab95ea48204f
**Theme:** light
**Category Tags:** Pastel, Clean SaaS, Light UI, Spacious

## Tokens — Colors (achromatic + 1 vivid blue)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Ink | `#111111` | `--color-midnight-ink` | Primary text, headings |
| Storm Gray | `#222222` | `--color-storm-gray` | Secondary text, subheadings |
| Whisper Gray | `#78716b` | `--color-whisper-gray` | Muted text, iconography |
| Cloud Cover | `#e6e3e2` | `--color-cloud-cover` | Subtle distinctions, light bg |
| Ghost White | `#f5f5f4` | `--color-ghost-white` | Page bg, primary surface |
| Snow Drift | `#ffffff` | `--color-snow-drift` | Text on dark bg, button fg |
| Deep Sea Blue | `#165dfb` | `--color-deep-sea-blue` | **THE CTA. Vibrant blue accent.** |

## Typography
### Figtree (Single Font)
- Sub: Inter. Weights: 400, 500, 600
- Sizes: 14, 16, 18, 21, 35, 45, 58 px
- Letter spacing: -0.0160em, -0.0140em
- **One typeface for everything**

### Type Scale (Minor Third 1.2 from 14px)
| Role | Size | Line Height | Tracking |
|------|------|-------------|----------|
| caption | 14 | 1.5 | -0.22px |
| body | 16 | 1.43 | -0.22px |
| subheading | 18 | 1.33 | -0.25px |
| heading | 21 | 1.29 | -0.29px |
| heading-lg | 35 | 1.1 | -0.56px |
| display | 58 | 1.0 | -0.93px |

## Spacing & Shapes
- **Density: spacious**
- Scale: 6, 10, 11, 12, 20, 22, 30, 40, 43, 50, 56, 57, 58, 80, 100, 140
- Section spacing: ~68-70px (very generous)
- Card padding: **0px** (transparent cards)

### Border Radius (multi-tier)
| Element | Value |
|---------|-------|
| tags | 4px |
| default | **8.8px** (decimal precision) |
| buttons | 10px |
| prominent | 15px |
| round | **120px** (extreme pill) |

## Components

### Primary CTA Button
Deep Sea Blue bg, Snow Drift text, **10px radius**, 11px/22px padding.

### Secondary/Sign Up Button
Storm Gray bg `#45403c`, Snow Drift text, 10px radius.

### Ghost Button
Outline button, Midnight Ink text, transparent bg.

### Base Card (Implicit/Transparent)
**Background `rgba(0,0,0,0)`, no border, no shadow, 0px padding.** Content drives the card.

### Navigation Link
Midnight Ink text, often bolded on current page.

## Imagery
Functional & demonstrative — product screenshots, UI mockups in card-like containers (no borders). High-key bright photography with muted palettes. Solid monochromatic icons. Moderate density, text remains dominant.

## Layout
Max-width contained, centered. Light bg hero with centered prominent headline + left-aligned text/quote/CTAs. Consistent vertical spacing without dividers. Multi-column grids (4-col for features). **Very spacious** breathing room. Sticky top bar nav.

## Motion Notes
- Subtle hover transitions on interactive elements
- Generous spacing creates "calm scroll" feel
- No aggressive motion — restraint dominates
- Soft fade-ins, no parallax

## Do's
- Figtree everywhere (one typeface)
- Deep Sea Blue (#165dfb) ONLY for CTAs
- 68-70px vertical section spacing
- 8.8px default radius (signature decimal!)
- Midnight Ink on Ghost White for max legibility

## Don'ts
- No saturated colors beyond Deep Sea Blue
- No sharp corners (8.8px radius is the rule)
- No heavy shadows or complex gradients
- No font sizes below 14px
- No dense info-packed sections (favor spaciousness)

## Similar Brands
Linear, Framer, Vercel, Webflow

## Key Insight
**The "Calm Pastel SaaS"** — single typeface (Figtree), single saturated color (#165dfb), generous breathing (68-70px gaps), and decimal-precision radius (8.8px) signature. Off-white bg `#f5f5f4` instead of pure white for warmth. Pastel here = soft achromatic + ONE vibrant accent, not pastel rainbows.
