# Fidèle Editions — Style Reference
> Risographic print workshop — layers of paper and ink

**URL:** https://fidele-editions.com
**Refero ID:** 957da5c3-7063-4992-9d25-e255752dc9b3
**Theme:** light
**Category Tags:** Serif Display, Editorial, Risograph, Print

## Tokens — Colors (warm paper + electric blue)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Faded Paper | `#f8f7ef` | `--color-faded-paper` | **Page bg** — warm creamy paper-like |
| Printmaker Blue | `#1664eb` | `--color-printmaker-blue` | **Brand accent** — vivid electric blue |
| Shop Grid Blue | `#4f89ec` | `--color-shop-grid-blue` | Softer link variant |
| Link Blue | `#006ce5` | `--color-link-blue` | Internal nav links |
| Ink Black | `#121212` | `--color-ink-black` | Primary button fill on light |
| Dusty Gray | `#e2e2df` | `--color-dusty-gray` | Dividers, content grouping |
| Pure White | `#ffffff` | `--color-pure-white` | Text on dark, sparingly |

## Typography (multiple display fonts!)
### OTMagisterUnlicensedTrial Regular (Hero Display Serif)
- Sub: **Playfair Display**. Weight 400. Size **62px**. Line height 0.92, letter-spacing -0.0160em
- "Sophisticated artistic touch"

### BaselGrotesk Book (Workhorse)
- Sub: Inter. Weights 400. Sizes: **14-62px (12 values!)**. Letter spacing -0.049em to 0.067em (huge range!)

### BaselGrotesk Regular (Secondary)
- Slightly more open form for readability

### BaselGrotesk Bold
- Weights 400, 700. Sizes 22, 32px

### GTStandard-M (Mono-esque)
- Sub: Space Mono. Size 14px. For metadata/fine print

### Arial (Utility)
- Size 13px. Functional small text

### Assistant (Input)
- Sub: Inter. Size 26px. Letter-spacing 0.0250em for inputs

## Spacing & Shapes
- Base 4px, **density: compact**
- Scale: 4, 8, 12, 16, 24, 28, 48, 96, **156**
- Section gap: 42px
- Card padding: 19px
- Element gap: **5px** (very tight)

### Border Radius
**0px everywhere** (sharp print aesthetic)

## Components

### Outlined Brand Link
Printmaker Blue text + Printmaker Blue underline on hover. BaselGrotesk Book.

### Ghost Command Button
Transparent bg, Ink Black text, Arial 13px. **Padding 0/48px** (extreme horizontal).

### Filled Footer Button
**Ink Black bg, Pure White text, 0px radius, 0/48px padding**.

### Product Input Field
Faded Paper bg, Printmaker Blue text, **bottom-only border in Printmaker Blue**, 24px all-side padding.

### Header Nav Link
Printmaker Blue + BaselGrotesk Book 14px. **Border appears on hover** in Printmaker Blue.

### Product Listing Card
**Transparent bg, no border, no shadow.** Image central. Title + price in Ink Black BaselGrotesk Book.

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #f8f7ef (Faded Paper) | Base page bg |
| 1 | #e2e2df (Dusty Gray) | Section dividers |
| 2 | #121212 (Ink Black) | Dark mode bg, contrast buttons |

## Imagery
**Unmasked, contained product photography.** Risograph-printed materials — print products are the central visual focus. Tactile, hand-printed feel.

## Layout
**Compact density** — 5px element gap, 19px card padding, 42px section gap. Hero: Faded Paper bg with OTMagisterUnlicensedTrial 62px headline. Product grids without explicit borders/shadows.

## Motion Notes
- Hover: link underline appears (border bottom)
- Subtle hover state shifts on interactive
- Print-aesthetic: no fancy motion, paper-like calm
- Product images may swap on hover

## Do's
- Faded Paper (#f8f7ef) consistent paper-like canvas
- **Printmaker Blue (#1664eb) selectively** for interactive text/links/borders
- OTMagisterUnlicensedTrial 62px for hero headlines
- BaselGrotesk for everything else, negative letter-spacing for impact
- 5/19/42 spacing rhythm (tight → medium → distinct)
- **0px radius EVERYWHERE** (print-inspired sharp edges)
- Unmasked contained product imagery

## Don'ts
- No gradients or drop shadows
- No additional saturated colors (blue + neutrals only)
- No Arial for prominent headings (utility/small only)
- No border-radius
- No heavy borders or solid bg on cards
- Maintain open airy feel, minimal visual clutter

## Similar Brands
It's Nice That, Printed Matter, Doane Paper

## Key Insight
**The "Risograph workshop" archetype.** Warm paper-like canvas (#f8f7ef NOT pure white) + ONE electric blue accent (#1664eb) + sharp 0px radius EVERYWHERE + 7 different fonts each with specific roles. The paper-like bg + electric blue = "ink on paper". Product imagery sits unmasked, no card framing — letting prints speak. **OTMagisterUnlicensedTrial display serif** (62px) is the artistic flex.
