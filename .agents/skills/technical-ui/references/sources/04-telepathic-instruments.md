# Telepathic Instruments — Technical UI Source Notes

Source: https://styles.refero.design/style/5183054c-4c6e-4ecf-bd90-f7d794d5eb17
Original URL: https://telepathicinstruments.com
Category scan: Technical UI
Theme: light
North star: Techno-futurist laboratory.

## Essence

Telepathic Instruments is a techno-futurist lab UI. It blends a monochrome
scientific interface, abstract blurred backgrounds, compact geometric type, a
single orange CTA, and sparse flat product cards. It is technical but artistic,
using ambiguity in visuals while keeping UI actions precise.

## Color Tokens

| Name | Value | Role |
| --- | --- | --- |
| Canvas | `#e5e7eb` | Page surface and subtle borders |
| Charcoal | `#000000` | Text, button fills, header |
| Snow | `#ffffff` | Light surfaces and text on dark |
| Steel | `#a3a3a3` | Muted text, borders, icons |
| Ash | `#191919` | Dark accents |
| Mercury | `#c2c2c2` | Dividers and subtle fills |
| Powder | `#dddee2` | Light surface differentiation |
| Muted Sage | `#d7cdb8` | Decorative product/texture accent |
| Amber Glow | `#ff6c2f` | Primary CTA |

## Typography

- Suisse Intl: all primary text/headings/UI labels.
- Suisse Intl Mono: code, data, navigation details, inputs.
- Display: `100px`, line-height `0.85`, tight `-0.03em` tracking.
- Body: `16px`, line-height `1.5`.

## Layout

- Full-bleed page model.
- Full-bleed hero with abstract dark background.
- Centered large headline.
- Alternating Canvas/Snow content sections.
- Two-column product feature layouts.
- Section gap around `40px`.

## Components

- Primary black button: Charcoal fill, Snow text, `24px` radius.
- Amber action button: Amber Glow fill, Snow text, `24px` radius.
- Ghost button: transparent, Snow text, Steel border, `0px` radius.
- Text link button: black text, horizontal padding, `24px` radius.
- Product card: transparent, `0px` radius, no shadow.
- Form input: transparent, Steel bottom border, mono font.

## Reusable Lessons

- A technical UI can be artistic if its controls remain strict.
- Orange should be a rare CTA signal.
- Mono inputs and labels reinforce laboratory precision.
- Flat product cards can work when backgrounds/imagery provide depth.

## Anti-Patterns

- Do not use orange broadly.
- Do not add heavy card shadows.
- Do not replace Suisse with generic system fonts.
- Do not clutter the lab atmosphere.

