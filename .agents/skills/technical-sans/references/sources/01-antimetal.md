---
source: Refero Styles
refero_url: https://styles.refero.design/style/9f9a4a4f-1a27-47ca-a65b-68b9850a84e4
brand_url: https://antimetal.com
style_family: technical-sans
theme: mixed
captured_for: design-skills-db
---

# Antimetal - Technical Sans Source Notes

## Core read

Antimetal is a mixed-mode technical system: a dark, electric infrastructure hero that
switches into a pale product-dashboard canvas. The distinctive lesson for
Technical Sans is that a highly technical product does not need to stay uniformly
dark. It can open with atmosphere, then become precise, quiet, and operational.

The system feels like infrastructure tooling with an editorial twist. The UI text
stays technical and compressed through a custom sans, while larger display moments
borrow a more refined serif/display voice. That contrast is useful when building
advanced SaaS, cloud, security, data, or AI products that must feel competent
without becoming sterile.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Midnight Navy | #1b2540 | Structural ink for text, nav, icons, borders on light UI |
| Deep Cosmos | #001033 | Dark hero foundation and dark filled action surfaces |
| Chartreuse Pulse | #d0f100 | Primary CTA fill only |
| Ice Veil | #e0f6ff | Ghost border, subtle hero tint, cold atmosphere |
| Ghost Canvas | #f8f9fc | Main light product background |
| Pure Surface | #ffffff | Elevated cards and product panels |
| Slate Ink | #6b7184 | Secondary text and muted labels |
| Ash Medium | #7c8293 | Tertiary text, divider and icon strokes |
| Storm Gray | #596075 | Muted copy on darker contexts |
| Fog Border | #b1b5c0 | Hairline borders and minimum-contrast edges |

## Typography

- UI family: abcdFont or substitute Inter Variable / DM Sans.
- UI weights: 400, 450, 480. Avoid the jump to heavy 600/700.
- UI sizes: 13, 14, 15, 16, 17, 18, 20, 22, 24, 28.
- UI tracking: tight but not aggressive, roughly -0.016em to -0.005em.
- Display family: ivarTextFont or substitute Freight Display Pro / Fraunces.
- Display sizes: 32, 40, 46, 48.
- Display tracking: about -0.010em.
- Important pattern: sans owns interface grammar; display face is reserved for
  large moments and should never leak into body, forms, tables, or nav.

## Structure

- Hero: dark navy to electric blue gradient, full-width, atmospheric, conversion focused.
- Main product body: Ghost Canvas with Pure Surface cards.
- Page max width: around 1200px.
- Base unit: 4px.
- Density: compact.
- Section gap: around 80px.
- Card padding: around 20px.
- Element gap: around 8px.

## Components to reuse

1. Chartreuse CTA pill
   - Fill #d0f100, text #1b2540.
   - Radius 9999px.
   - Used only for conversion.
   - Can sit on both dark hero and light surfaces.

2. Dark ghost pill
   - Transparent fill, bright text, pale border or inset glow.
   - Used on dark hero.
   - Should not become a generic outline button everywhere.

3. Light ghost pill
   - Transparent fill, navy text, border/ring via blue-tinted shadow.
   - Used on product surfaces.

4. Elevated feature card
   - White fill over #f8f9fc.
   - Radius 20px.
   - Blue-tinted shadow stack, not black shadow.

5. Floating badge pill
   - Radius 16px.
   - Fine ring shadow and light elevation.
   - Useful for alerts, status, categories, and product UI callouts.

6. Sharp text input
   - Radius 0px.
   - Transparent or pale fill.
   - Creates contrast against the pill-heavy button language.

## Design lessons

- Technical Sans can use a single high-energy action color if it is rationed.
- Mixed-mode pages work when there is a strong rule: one dramatic dark section,
  then sustained light product canvas.
- On light technical UIs, blue-tinted shadows feel more coherent than neutral
  black shadows.
- Inputs can be sharper than buttons to separate data-entry surfaces from
  conversion surfaces.
- Do not create a rainbow of status colors just because the product is technical.

## Anti-patterns

- Do not use chartreuse as decoration.
- Do not scatter additional dark sections after the hero.
- Do not use black text if the system ink is navy.
- Do not over-round inputs.
- Do not use heavy sans weights when the system relies on narrow weight steps.

