# Standards — Style Reference
> High-contrast precision blueprint

**URL:** https://standards.site
**Refero ID:** 62b22816-2d98-4e98-9c17-bf600ddb2fc8
**Theme:** light
**Category Tags:** Serif Display, Bold Color, Editorial, Minimal SaaS

## Tokens — Colors (mono + ONE orange)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Canvas Ice | `#eaeaea` | `--color-canvas-ice` | **Page bg** — slightly cool gray |
| Midnight Ink | `#000000` | `--color-midnight-ink` | Primary text, secondary buttons, dividers |
| Steel Gray | `#a1a1a1` | `--color-steel-gray` | Muted text, subtle borders |
| Whisper Gray | `#d7d7d7` | `--color-whisper-gray` | Hairline borders for cards |
| **Action Orange** | `#ff2e00` | `--color-action-orange` | **Primary CTA + accents only** |

## Typography (single font!)
### Soehne (Sole typeface)
- Sub: system-ui, sans-serif. Weights: **400, 600 only**
- Sizes: **10, 14, 20, 31, 52px** (5 values only)
- **Letter-spacing: -0.0100em ALWAYS** (never varies)
- **OpenType:** `"dlig" on, "liga" on`

### Type Scale
| Role | Size | Tracking |
|------|------|----------|
| caption | 10 | -0.1px |
| body-sm | 14 | -0.14px |
| body | 20 | -0.2px |
| heading-sm | 31 | -0.31px |
| display | 52 | -0.52px |

## Spacing & Shapes
- **Density: spacious**
- Scale: 5, 10, 13, 15, 16, 24, 30, 46, 50, 59, 60
- Section gap: 46px
- Card padding: 13px
- Element gap: 10px

### Border Radius
| Element | Value |
|---------|-------|
| **buttons** | **4px** (only) |
| Cards | 0px |

## Components

### Primary Action Button
**Action Orange bg, white text, 4px radius, 13.3px padding all sides**.

### Secondary Action Button
Midnight Ink bg, white text, 4px radius, 13.3px padding.

### Ghost Card
**Transparent bg, no shadow, 0px radius, top + left border in Whisper Gray.** Content defines spacing.

### Navigation Link
Soehne 400 14px, Midnight Ink or Steel Gray. **No underlines** (color distinction only).

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #eaeaea | Page bg |
| 1 | #000000 | Contrast-heavy displays |

## Imagery
**Highly minimal.** Cropped product screenshots on pure white. **No illustrations.** Simple monochromatic outlined icons. Text-dominant.

## Layout
Full-bleed (no max-width). Hero: stark Canvas Ice + large centered headline + full-width black block (video/showcase). **Alternating Canvas Ice ↔ full-width content blocks.** **6-column grids** with 0px radius cards. 46px section rhythm. Sticky minimal top bar.

## Motion Notes
- Hover: subtle color shifts on links
- No aggressive motion (precision blueprint feel)
- Smooth scroll between sections
- Black blocks may reveal on scroll

## Do's
- Midnight Ink for primary text/UI
- 10px element gap consistently
- Action Orange ONLY for primary CTAs
- 4px button radius (subtle consistent)
- **-0.0100em letter-spacing across ALL text**
- Canvas Ice (#eaeaea) dominant bg
- Soehne 600 for headings + 46px section gaps

## Don'ts
- No multiple chromatic colors (Action Orange only)
- No additional fonts/weights beyond Soehne 400/600
- No shadows (flat design)
- **No varying letter-spacing**
- No gradients or complex backgrounds
- No radius beyond 4px on buttons / 0px on cards
- No deviation from spacing tokens

## Similar Brands
Figma, Linear, Stripe, Supabase

## Key Insight
**The "single font precision" archetype.** Soehne ALONE in 2 weights and 5 sizes — maximum restraint. Letter-spacing -0.0100em LOCKED across all text. Canvas Ice (#eaeaea) avoids stark white. Single Action Orange CTA. Ghost cards with **top + left border only** (creates "blueprint corner" feel). 4px button radius is the only roundness anywhere.
