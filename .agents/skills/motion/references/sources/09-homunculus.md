# homunculus Inc. — Style Reference
> Shimmering digital night

**URL:** https://homunculus.jp
**Refero ID:** 68076c4e-f1a6-4d31-9629-cc1af14d9dc5
**Theme:** dark
**Category Tags:** Motion, Minimal, Abstract Imagery, Compact

## Tokens — Colors (5 grays)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Base | `#000000` | `--color-midnight-base` | Page bg, primary surface |
| Ghost | `#ffffff` | `--color-ghost` | Hairline borders, text. **NOT a CTA.** |
| Dark Slate | `#383838` | `--color-dark-slate` | Secondary bg, muted text |
| Light Asphalt | `#6f6f6f` | `--color-light-asphalt` | Tertiary text, dividers, inactive |
| Silver Dust | `#dddddd` | `--color-silver-dust` | Subtle accents, faint borders |

## Typography (rare serif body!)
### Times (Body — SERIF!)
- Sub: serif. Weight 400. Size 16px. Normal tracking.
- **The serif body is unusual** — provides classic counterpoint to modern UI

### urw-din (Functional UI)
- Sub: Segoe UI, Arial, sans-serif. Weight 400. Sizes: 12, 13, 14px
- Letter spacing: **-0.08em at 12px, 0.20em at 14px** (radical contrast)
- Used for nav, labels, small UI

## Spacing & Shapes
- Density: **compact**
- Scale: ONLY 8, 10 (radically minimal)
- Card padding: 8px
- Element gap: 10px
- **Border radius: 0px everywhere**

## Components

### Navigation Link
Ghost text, urw-din 13px (0.20em tracking) for primary nav, 12px (0.08em) for social. **Border/underline animation on hover.**

### Logo / Site Identity
Ghost circular shape with stylized 'h' in urw-din. Top-left of viewport.

### Section Divider / Rule
**1px hairline stroke**, Ghost or Light Asphalt color. Minimal horizontal/vertical separator.

### Scroll Indicator
'scroll' text in urw-din 13px, 0.20em tracking. **Subtle animated visual cue** (downward arrow or line animation). Vertical placement.

## Imagery
**Abstract organic fluid forms with iridescent swirling colors.** Atmospheric/decorative, not explanatory. Full-bleed against dark bg with soft undefined edges. **Subtle movement and depth.** No traditional photography or product imagery.

## Layout
Full-bleed. No max-width container. Hero: full-viewport with subtle dark-on-dark branding + abstract graphics. Fluid seamless rhythm. Subtle horizontal lines as dividers. Single column stacking. Minimalist top-right cluster (CONTACT + social) + top-left brand mark. Density spacious — abstract bg over information.

## Motion Notes
- **Iridescent shader-style fluid form** animates in full-bleed bg (the signature)
- Subtle border/underline animation on nav hover
- Scroll indicator with line/arrow animation
- Single-axis fluid scroll (narrative flow over multi-column grids)
- Letter-spacing creates rhythm (compressed -0.08 vs expanded 0.20)

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #000000 | Base |
| 1 | #383838 | Subtle elevation |
| 2 | #dddddd | Light accents |

## Do's
- #000 large bg
- #ffffff for ALL text/interactive
- urw-din 13px @ 0.20em for nav, 12px @ 0.08em for social
- 1px white/Silver Dust hairline borders
- Compact 10px horizontal between inline
- 8px vertical padding inside small elements

## Don'ts
- No bright/saturated colors except organic graphics
- No heavy shadows or gradients
- No serif fonts for UI (Times reserved for body)
- No multi-column grids (prefer single-axis stack)
- No multi-level cards
- **No radii — sharp corners only**

## Similar Brands
Stripe early dark mode, Active Theory, Awwwards portfolio nominees

## CSS Variables
```css
:root {
  --color-midnight-base: #000000;
  --color-ghost: #ffffff;
  --color-dark-slate: #383838;
  --color-light-asphalt: #6f6f6f;
  --color-silver-dust: #dddddd;

  --font-times: 'Times', serif;
  --font-urw-din: 'urw-din', 'Segoe UI', Arial, sans-serif;

  --text-caption: 12px;  --tracking-caption: -0.96px;
  --text-body: 14px;     --tracking-body: 2.8px;
  --text-body-lg: 16px;

  --card-padding: 8px;
  --element-gap: 10px;
  --radius-default: 0px;
}
```

## Key Insight
**Serif body + sans-serif UI** is the inversion. Times provides "content authority" while urw-din handles "interface mechanics". Iridescent shader forms in full-bleed bg = the entire visual identity, no other imagery needed. Radical letter-spacing variance (-0.08em to 0.20em) creates internal rhythm without requiring weight changes (always 400).
