# HAPE PRIME — Style Reference
> Neon Red Noir — a digital fashion runway bathed in dramatic light

**URL:** https://www.hape.io
**Refero ID:** fc739087-2f0a-4deb-b105-2af10205f185
**Theme:** dark
**Category Tags:** Motion, Bold Color, Editorial, Fashion, 3D Imagery

## Tokens — Colors (3 + 1 gradient)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Crimson Flux | `#730200` | `--color-crimson-flux` | Brand accent, content card backgrounds — saturates dark canvas |
| Deep Space Black | `#000000` | `--color-deep-space-black` | Default surfaces, structural borders |
| Ghost White | `#ffffff` | `--color-ghost-white` | Primary text, ghost button borders |
| Heat Stroke | `radial-gradient(circle at 50% 0%, rgb(183,5,5) 40%, rgb(119,0,0) 140%)` | `--gradient-heat-stroke-radial` | Hero radial — top-anchored crimson |

## Typography (4 fonts)
### Integral CF (Display)
- Sub: Bebas Neue. Weights: 400, 600, **800**. Sizes: 8–40px.
- Letter-spacing: -0.02em, **0.12em, 0.58em** (extreme variations)
- Use for editorial-impact headlines

### Neue Plak Extended (Body)
- Sub: Oswald. Sizes: 12, 13, 15px. -0.02em tracking.

### Druk Text Wide (Micro labels)
- Sub: DIN Condensed. Weight 700. Size 10px. **Uppercase only.**

### Arial (Functional UI labels)
- Sub: Arial. 13px. Used sparingly.

## Spacing & Shapes
- Density: comfortable
- Scale: 4, 6, 8, 10, 12, 15, 20, 30, 40, 50
- Section gap: 50px
- Element gap: 6px (very tight!)
- **Border radius: 26px** for ALL buttons and links (signature pill)

## Components

### Ghost Button (White Border)
Transparent bg, Ghost White text, 1px white border, **26px radius (pill)**, 0px padding.

### Ghost Button (Black Border)
Transparent, Deep Space Black text, 1px black border, 26px radius.

### Ghost Button (No Radius)
Black text + black border, 0px radius. Used for emphasis.

### Crimson Content Card
Crimson Flux bg, 0px radius (sharp), 0px shadow, **50px left/right padding only** (0px top/bottom).

## Imagery
Full-bleed high-fidelity **3D character renders** in editorial poses. Dark moody, red lighting accents. Outlined monochrome icons. High-density, dominates screen.

## Layout
Full-bleed hero with 3D graphic + centered headline. Sections alternate Crimson Flux ↔ Deep Space Black full-bleed bands. Two-column text-left/image-right or centered stack. 50px section spacing. Sticky top bar with ghost links + persistent bottom nav.

## Motion Notes
- 3D character animates/rotates in hero
- Red radial gradient pulse / shift in hero
- Smooth full-bleed band transitions on scroll
- Ghost button hover: subtle inversion (text/bg swap)
- Heat Stroke radial creates "lighting" effect

## Do's
- #000 default bg
- Crimson Flux for accent washes/cards
- Integral CF for headlines, tight tracking
- Neue Plak Extended body, -0.02em
- **26px radius pills for ALL buttons/links**
- White text on dark, black on light
- 50px left/right padding on content cards

## Don'ts
- No multiple chromatic colors — Crimson Flux only
- No box shadows
- No system default fonts
- No decorative gradients except hero
- No soft/rounded shapes except 26px on buttons/links
- No generic button styles — ghost variants only
- No complex grids — prefer two-column or full-bleed

## Similar Brands
RTFKT Studios, Dior digital campaigns, Kith, The Fabricant

## CSS Variables
```css
:root {
  --color-crimson-flux: #730200;
  --color-deep-space-black: #000000;
  --color-ghost-white: #ffffff;
  --gradient-heat-stroke-radial: radial-gradient(circle at 50% 0%, rgb(183,5,5) 40%, rgb(119,0,0) 140%);

  --font-integral-cf: 'Integral CF', 'Bebas Neue', sans-serif;
  --font-neue-plak-extended: 'Neue Plak Extended', Oswald, sans-serif;
  --font-druk-text-wide: 'Druk Text Wide', 'DIN Condensed', sans-serif;

  --section-gap: 50px;
  --element-gap: 6px;
  --radius-buttons: 26px;
  --radius-links: 26px;
}
```

## Key Insight
**The crimson card is the signature.** Sharp 0px radius cards in saturated red, with 50px horizontal-only padding (no vertical), against pure black. Buttons get 26px pill radius — every other element stays sharp. Type contrast: Integral CF condensed for impact + Neue Plak Extended for refinement = editorial fashion magazine on the web.
