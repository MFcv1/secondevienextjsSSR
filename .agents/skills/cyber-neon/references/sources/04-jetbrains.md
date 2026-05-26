# JetBrains — Style Reference
> Neon nebula on obsidian — violet-blue gradients bloom upward like deep-space imagery

**URL:** https://jetbrains.com
**Refero ID:** bc4fb98b-37ec-480a-b7a9-acd197cbebb9
**Theme:** dark
**Category Tags:** Cyber Neon, Developer Tools, Gradient Glow, Multi-Chromatic

## Tokens — Colors (rich gradient system)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Obsidian Ground | `#000000` | `--color-obsidian-ground` | **Absolute black** page bg |
| Deep Charcoal | `#19191c` | `--color-deep-charcoal` | Nav bar, footer, elevated 1 step |
| Graphite | `#343434` | `--color-graphite` | Most-used: borders, dividers, muted strokes |
| Iron | `#474749` | `--color-iron` | Subtle borders |
| Fog | `#bababb` | `--color-fog` | **Body text on dark** (NOT white!) |
| Pure White | `#ffffff` | `--color-pure-white` | Headings, button labels |
| Electric Blue | `#18a3fa` | `--color-electric-blue` | Link, info badges (TEXT/BORDER ONLY, never fill) |
| Violet Pulse | `#7b61ff` | `--color-violet-pulse` | Button borders, badges, CTA outlines |
| Iris | `#6b57ff` | `--color-iris` | Badge fills |
| Amethyst | `#8473ff` | `--color-amethyst` | Heading accents |
| Deep Violet | `#2e106a` | `--color-deep-violet` | **CTA bg** (paired with #18a3fa text) |
| **Neon Pink** | `#f31199` | `--color-neon-pink` | **Category labels ONLY** — neon-sign sparingly |
| Magenta Glow | `#5a1fd0` | `--color-magenta-glow` | Gradient start, card borders |
| Nebula Violet | `linear-gradient(130deg, rgb(90,31,208) 10%, rgba(46,16,106,0) 70%)` | gradient | Hero bloom |
| Aurora Teal | `linear-gradient(90deg, rgb(8,222,170) -12.99%, rgb(0,170,250) 176.77%)` | gradient | Feature callouts |
| **Hero Blue Glow** | `radial-gradient(87.36% 97.44% at 54.14% 23.32%, rgba(0,71,253,0.8) 0px, rgba(0,71,253,0.8) 15%, rgba(0,0,0,0) 75%)` | gradient | **Hero spotlight** — defining visual |

## Typography
### JetBrains Sans (single font)
- Sub: Inter, Plus Jakarta Sans. Weights: **300, 400, 500, 600**
- Sizes: 13, 16, 20, 29, 35, 43, 72, **79px**
- Letter spacing: -0.40px @ 79px, -0.36px @ 72px, +0.065px @ 13px (precision tuning per size)
- **OpenType: `"calt", "kern", "liga"` ALWAYS active**
- Custom-designed with optical metrics for code-adjacent contexts

## Spacing & Shapes
- Base 8px, comfortable
- Scale: 8, 16, 24, 32, 48, 64, 96, 144, 200
- Page max-width: **1280px**
- Section gap: 80-120px
- Card padding: 24px
- Element gap: 8-16px

### Border Radius (multi-tier with strict rules)
| Element | Value |
|---------|-------|
| **badges** | **4-6px** (sharp — only place this small) |
| images | 16px |
| **buttons** | **20-26px** (pill-ish) |
| cards | **24px** |
| modals | 24px |

## Components

### Hero CTA Button — Primary Dark
**White (#fff) bg, Deep Charcoal text, 26px radius, 12px/32px padding.** Solid white pop against dark.

### CTA Button — Violet Deep (signature illuminated)
**Deep Violet (#2e106a) bg, Electric Blue (#18a3fa) text, 1px Violet Pulse border, 16px radius.** "Active screen element" feel.

### Ghost Button — White Outlined
Transparent, white text + 1px white border, 20px radius, 8px padding.

### Ghost Link Button — Borderless
Transparent, white text, 0px radius, 10px horizontal padding only. Tab-style.

### Feature Announcement Card
**Transparent + 1px Magenta Glow border, 24px radius, Nebula Violet gradient bg, 24-64px padding.** 35px headline weight 600, 16px body in Fog (#bababb), 32px IDE icons, 3D mesh visual right half.

### Business Feature Card
130deg violet gradient + organic blobs in deep red/purple, 24px radius, 64px padding.

### Pink Tinted Feature Card
**`rgba(243,17,180,0.2)` bg (20% Neon Pink translucent), 24px radius, 23px padding.**

### Violet Badge — Filled
Iris (#6b57ff) bg, white text, **4px radius (sharp!)**, 1px/7px padding, 13px JetBrains Sans 500.

### Violet Badge — Tab Style
`rgba(107,87,255,0.5)` bg, white text, **`6px 6px 0 0` radius (top-rounded only)**, attaches to card top.

### IDE Product Icon Badge (chromatic identity)
**32px square icons with per-product multicolor gradient.** IntelliJ orange/red/purple, PyCharm green/yellow, DataGrip teal/dark — each unique.

### Navigation Bar
72px height, Deep Charcoal #19191c bg. JetBrains logo + wordmark left, nav center, utilities right. **No border-bottom** — floats above hero gradient.

### Carousel Pagination
Transparent + 1px Iron border + 20px radius + 8px padding arrows. Counter "1 / 2" in Fog.

### Audience Tab Row
Floating pill selector, ghost buttons (20px radius). Active: 1px Violet Pulse border + white text. Inactive: no border + Fog text.

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #000000 | Absolute void |
| 1 | #19191c | Nav/footer |
| 2 | #2e106a (rgba 0.3) | Violet glass cards |
| 3 | #45173a (rgba 0.2) | Pink glass cards |

## Elevation (NO shadows!)
**Zero box-shadows.** Depth via gradient fills + translucent bg + radial glows. Cards "rise" because their colored translucent fill catches the light of background gradients behind them. Illumination from within, not objects floating.

## Imagery
**Abstract 3D rendered data-mesh visuals** — luminous wireframes pink/purple/blue forming curved grid planes. Pure light-on-dark mathematical geometry. **No photographic elements, no people, no lifestyle.** Product screenshots in dark editor theme, embedded in dark cards (8-16px radius). 32px multicolor product icons.

## Layout
Full-bleed dark canvas, max-width 1280px container. Hero full-viewport with centered headline over **radial blue glow** + IDE mockup below fold. Section rhythm: blue-glow hero → carousel section → audience tabs → product grid. **No alternating bg bands** — entire page stays on dark with separation via gradient cards + 80-120px spacing. 'For businesses' section shifts to #19191c. 4-5 col IDE icon grids.

## Gradient System (5 distinct roles)
1. **HERO GLOW**: blue radial spotlight (rgba(0,71,253,0.8) → transparent)
2. **VIOLET NEBULA**: 130deg violet to transparent linear (announcement cards)
3. **AURORA SWEEP**: 90deg teal-to-blue (feature callouts, icon fills)
4. **EMERALD FADE**: 130deg green-to-void (secondary section accent)
5. **PRODUCT ILLUSTRATION**: complex teal-to-navy multi-stop gradients

**All gradients fade to transparent or near-black — no hard stops both ends.**

## Motion Notes
- Hero blue radial glow may pulse subtly
- Gradient cards may shift on scroll
- Carousel auto-rotation between announcement cards
- Per-product chromatic icons can have hover glow
- Holographic 3D mesh visuals slowly rotate

## Do's
- **#000 absolute bg (NOT #0a0a0a or #111)** — true black makes glows luminous
- Apply hero blue radial glow at ~87% width spread, centered, "spotlit"
- **Neon Pink ONLY for category labels & brand punctuation** (1-3 per page MAX)
- 24px radius cards/panels, 4px ONLY on badges (never mix)
- Translucent fills (rgba) for tinted cards — NEVER opaque
- JetBrains Sans with `"calt", "kern", "liga"` always active
- **Per-product chromatic icon identity** (chromatic diversity!)

## Don'ts
- Electric Blue NEVER as fill (text/border/link only)
- NO box-shadows (gradient fills + translucents only)
- NO border-radius < 16px on interactive (badges 4-6 only)
- NO white text directly on raw black for body (use Fog #bababb)
- Neon Pink NEVER as bg fill for large areas (translucent 0.2 max)
- NO border-bottom on nav bar
- NO uniform icon color (chromatic identity per product critical)

## Similar Brands
GitHub, Vercel, Linear, Raycast, Framer

## Key Insight
**The "deep-space control room" cyber neon archetype.** Pure #000 void + radial blue spotlight + chromatic per-product icon ecosystem + translucent gradient cards (NEVER opaque) = the JetBrains signature. Multi-tier radius rules (4px badges only, 16-26px everything else, NEVER mixed). Gradient-as-elevation replaces shadows entirely. The 5-gradient system is a complete light language.
