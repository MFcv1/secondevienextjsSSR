---
source: Refero Styles
refero_url: https://styles.refero.design/style/12255b63-e506-4bc1-a4cd-d05487de32f3
brand_url: https://intercom.com
style_family: editorial-minimal
theme: light
captured_for: design-skills-db
---

# Intercom - Editorial Minimal Source Notes

## Core read

Intercom is a light editorial SaaS minimalism: white canvas, fine black type,
warm off-white section surfaces, and a small amount of vivid accent color. The
system is not as chromatically absolute as OpenAI and not as institutional as
Anthropic. It is practical, polished, and product-facing.

The key lesson is that editorial minimalism can still support clear CTAs and
product marketing. The page uses a vivid violet for primary interactive moments
and orange for very small emphasis, while the rest stays neutral and warm.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas White | #ffffff | Main page and primary surfaces |
| Background Off-White | #faf9f6 | Softer section background |
| Surface Cream | #f1eee9 | Elevated warm surface |
| Border Sand | #dedbd6 | Delicate borders and active tab lines |
| Subtle Gray | #e7e3db | Light dividers and content blocks |
| Canvas Beige | #d3cec6 | Muted secondary areas |
| Headline Black | #111111 | Heading text and primary CTA |
| Body Text Black | #000000 | Body, links, icons |
| Subtle Graphite | #414141 | Secondary muted text |
| Mid Gray | #585858 | Descriptive text |
| Footer Gray | #666666 | Tertiary footer text |
| Placeholder Gray | #a0a0a0 | Inputs and muted UI |
| Accent Violet | #0007cb | CTA hover, active indicators, primary interactions |
| Accent Orange | #ff5600 | Tiny emphasis and word-level highlights |

## Typography

- Primary: Saans or system-ui fallback.
- Weights: 300, 400.
- Display sizes: 54 and 80.
- Headings: 24, 32, 40.
- Body: 16, body-sm 14.
- Display line-height: around 1.
- Body line-height: 1.4-1.5.
- Tracking: negative values across display and body.
- Mono: SaansMono or SFMono.
- Mono weights: 300, 400, 500.
- Mono letter spacing: strong positive values for technical details.
- Optional light serif for subtle editorial support.

## Structure

- Section gap: 48px.
- Card padding: 16px.
- Element gap: 16px.
- Buttons and nav items: 4px radius.
- Tabs: no radius, active state via underline/border.
- Uses white and warm off-white rather than pure flat white only.

## Component lessons

1. Black primary action button
   - Black fill, white text.
   - 4px radius.
   - Violet hover/focus can appear.

2. Secondary outline button
   - Transparent fill.
   - Border Sand.
   - 4px radius.

3. Tab button
   - No background.
   - Muted text by default.
   - Active indicated by bottom border.

4. Warm section surface
   - Off-white, cream, or beige.
   - Use for rhythm without bright color.

5. Mono technical label
   - Letter-spaced.
   - Useful for code-like details and product metadata.

## Design lessons

- Editorial minimal can still be conversion-oriented.
- Warm off-white creates rhythm without visible section decoration.
- Accent violet is allowed if it is rationed to interactions.
- Tabs and underlines are better than heavy cards for minimal SaaS pages.
- Light display weights create a more refined product voice than bold shouting.

## Anti-patterns

- Do not add saturated colors beyond violet/orange.
- Do not use sharp unrounded controls if the local system uses 4px.
- Do not use heavy card shadows.
- Do not make every section white if warm rhythm is needed.
- Do not turn orange into a big fill color.

