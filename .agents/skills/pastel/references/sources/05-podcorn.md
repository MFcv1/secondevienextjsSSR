# Podcorn — Style Reference
> Soft-edged digital canvas

**URL:** https://podcorn.com
**Refero ID:** 8d4b0738-c302-45c6-98c9-b3cd36e04613
**Theme:** light
**Category Tags:** Pastel, SaaS, Editorial Serif, Coral

## Tokens — Colors (coral-pink + indigo)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Canvas Pink | `#fff4f2` | `--color-canvas-pink` | **Page bg** — coral-tinged white |
| True White | `#ffffff` | `--color-true-white` | Cards, button bg |
| Inkwell Indigo | `#090335` | `--color-inkwell-indigo` | **Primary text + CTAs + headings** |
| Deep Ocean | `#132645` | `--color-deep-ocean` | Decorative illustration elements |
| Coral Sunset | `#ffb0a1` | `--color-coral-sunset` | Accent in illustrations |
| Firebrick Red | `#fc736c` | `--color-firebrick-red` | Highlight bands, navigation buttons. **NOT primary CTA** |
| Ash Gray | `#434352` | `--color-ash-gray` | Muted text |
| Stone Grey | `#8993a2` | `--color-stone-grey` | Hairlines, dividers |
| Outline Gray | `#d8d8d8` | `--color-outline-gray` | Ghost button borders |

## Typography (sans + serif pairing)
### Gilroy (Body/UI)
- Sub: Inter. Weights: 400, 500, 600, 700
- Sizes: 14-25px. **Letter-spacing: -0.1870em** (extreme negative for compactness)

### Georgia (Display)
- Sub: Lora. Weights: 400, 700
- Sizes: 21, 27, 40px. **Serif elegance for sparing headings**

## Spacing & Shapes
- Base 4px, comfortable
- **Page max-width: 1105px** (constrained)
- Section gap: 75px
- Card padding: 55px
- Element gap: 20px

### Border Radius (sharp rule + modal exception)
| Element | Value |
|---------|-------|
| cards | **0px** |
| buttons | **0px** |
| modal | 8px (only exception) |

## Components

### Filled Primary Button
**Inkwell Indigo bg, True White text, 0px radius, 18px/20px padding.** Strong CTA.

### Outlined Secondary Button
True White bg, Inkwell Indigo text + 1px border, 0px radius, 18/20 padding.

### Navigation Button (special)
**Firebrick Red bg, white text, 0px radius, 11px/14-20px padding.** Georgia Bold typically.

### Navigation Link
Ash Gray text inactive, Inkwell Indigo active.

### Content Card
**Transparent bg, no shadow, no border, 0px radius**. Canvas Pink bg provides separation. **Padding 75/55px** (very generous).

### Cookie Modal
True White bg, **8px radius** (the only round element).

## Imagery
**Lively playful line illustrations** with custom palette (Coral Sunset, Deep Ocean, Firebrick Red) on white/Canvas Pink. Decorative, segments content. Outlined figures + abstract shapes in square frames. Minimalist outlined icons.

## Layout
**Max-width 1105px** centered. Hero: full-bleed bg illustration + centered headline + action buttons. 75px section gaps. Alternating True White ↔ Canvas Pink. Two-column text/illustration split common. Sticky top nav with bold action buttons.

## Motion Notes
- Sticky nav with subtle bg shift on scroll
- Decorative illustrations may have subtle hover/animation
- Section transitions via bg color alternation
- Hover: button color intensification

## Do's
- Inkwell Indigo (#090335) for primary action bg + headings
- 0px radius on ALL buttons/cards
- Canvas Pink (#fff4f2) foundational bg
- Firebrick Red ONLY for high-visibility nav/active
- Gilroy with -0.1870em letter-spacing
- 18px/20px minimum button padding
- Max content width 1105px

## Don'ts
- No rounded corners on UI (modals only — 8px)
- No saturated non-brand colors (palette restricted)
- No deviation from Gilroy + Georgia
- No generic gray for text (use Ash Gray + Inkwell Indigo)
- No heavy shadows or gradients
- No < 18px/20px button padding
- No content beyond 1105px width

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #fff4f2 (Canvas Pink) | Page bg |
| 1 | #ffffff (True White) | Cards, modals |

## Similar Brands
Airtable, Mailchimp, Webflow, Canva

## Key Insight
**The "Pastel + sharp + serif" combo:** Coral-pink bg + Georgia serif headings + 0px radius buttons creates a unique tension — soft warm color but sharp confident structure. -0.1870em extreme negative tracking on Gilroy creates compact "professional yet playful" body voice. Firebrick Red reserved for navigation buttons (not main CTAs!) which is unusual.
