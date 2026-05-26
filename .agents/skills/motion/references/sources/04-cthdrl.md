# cthdrl — Style Reference
> Black canvas, stark typography

**URL:** https://cthdrl.co
**Refero ID:** 565bfc50-3a19-4224-9a4c-125edaeb7bef
**Theme:** dark
**Category Tags:** Motion, High Contrast, Editorial Type, Minimal

## Tokens — Colors (only 2!)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Void | `#000000` | `--color-midnight-void` | All backgrounds |
| Ghost Sand | `#e7ded1` | `--color-ghost-sand` | All text, links, ghost button borders, dividers |

## Tokens — Typography
### NB Akademie (Display)
- Substitute: Montserrat
- Weights: 400 only
- Sizes: 32, 35, **121** px
- Line height: 0.85, 1.00, 1.20
- Letter spacing: -0.016, -0.01

### NB Akademie Mono (Body / All UI text)
- Substitute: Space Mono
- Weights: 400 only
- Sizes: 11, 32 px
- Line height: 1.00, 1.20
- Letter spacing: **-0.045** (extreme negative for compactness)

### Type Scale
| Role | Size | Line Height | Tracking |
|------|------|-------------|----------|
| heading-sm | 32px | 1.2 | -0.512px |
| heading | 35px | 1 | -0.56px |
| display | 121px | 0.85 | -1.936px |

## Spacing & Shapes
- Density: **spacious**
- Spacing scale: 10, 11, 26, 30, 50, 75 (irregular, only what's needed)
- Section gap: 26px
- Element gap: 10px
- Card padding: **0px**
- Border radius: **0px** everywhere (buttons too)

## Components

### Ghost Navigation Link
Ghost Sand text on Midnight Void. 10px right padding only. No border, no radius. Color shift on hover only.

### Ghost Primary Button
Ghost Sand text. 1px solid Ghost Sand border. Midnight Void bg. **No padding, no radius.** Border behaves like a subtle underline.

## Imagery
Minimal. Abstract subtle line work and geometric arcs weaving across dark background. Iconography monochromatic Ghost Sand outline on Midnight Void, delicate stroke. Text-dominant; graphics as atmospheric accents.

## Layout
Full-bleed, centered content (no rigid max-width). Hero: large centered headline dominates viewport. Seamless rhythm — no alternating section colors. Single-column stack. Minimal top bar nav, precise spacing.

## Motion Notes (motion-heavy)
- Subtle line work and geometric arcs animated across dark background
- Letter-by-letter or word reveal on display headlines
- Cursor-following effects on text
- Smooth scroll between sections
- The whole UI feels like a typographic film opening sequence

## Do's
- Use ONLY 2 colors. Period.
- NB Akademie 121px display with -1.936px tracking
- Mono fonts for body with -0.045 negative tracking
- Spacious 26px section gaps, 10px element gaps
- Ghost buttons (text + border, no fill)
- 1px Ghost Sand divider lines as structure
- Single weight (400) across both fonts

## Don'ts
- No saturated/vivid colors
- No shadows or elevation
- No rounded corners — 0px everywhere
- No generic fonts (NB Akademie + Mono are critical)
- No filled buttons for CTAs — ghost only
- Don't use multiple weights — 400 only
- No dense text — keep spacious

## Similar Brands
- Aether
- Basic.Space
- Huge Inc.

## CSS Variables
```css
:root {
  --color-midnight-void: #000000;
  --color-ghost-sand: #e7ded1;

  --font-nb-akademie: 'NB Akademie', Montserrat, sans-serif;
  --font-nb-akademie-mono: 'NB Akademie Mono', 'Space Mono', monospace;

  --text-heading-sm: 32px; --leading-heading-sm: 1.2;  --tracking-heading-sm: -0.512px;
  --text-heading: 35px;    --leading-heading: 1;       --tracking-heading: -0.56px;
  --text-display: 121px;   --leading-display: 0.85;    --tracking-display: -1.936px;

  --section-gap: 26px;
  --element-gap: 10px;
  --card-padding: 0px;
  --radius-buttons: 0px;
}
```

## Key Insight
**The most reductive Motion-category style.** Two colors, one weight, no radius, no shadows. Motion comes entirely from typography animation and abstract line work. Proves that "motion-heavy" doesn't require visual chrome — restraint amplifies movement.
