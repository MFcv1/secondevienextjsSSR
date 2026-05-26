---
source: Refero Styles
refero_url: https://styles.refero.design/style/4e3b4717-84c8-4599-baaf-a343c3d619b6
brand_url: https://cursor.com
style_family: technical-sans
theme: light
captured_for: design-skills-db
---

# Cursor - Technical Sans Source Notes

## Core read

Cursor reads as a warm ivory software studio: technical, tactile, and carefully
typeset. It is one of the strongest references for Technical Sans because the
identity lives inside the font choices, OpenType features, compact spacing, and
layered shadows. The UI feels like stacked software panels on a precise workbench.

The unusual move is a primary action that is often outlined instead of filled.
That keeps the product feeling like a serious developer tool rather than a
generic conversion landing page. Warm parchment surfaces and orange outlines
give the brand personality while preserving a disciplined technical skeleton.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas Parchment | #f7f7f4 | Page, card, and neutral button backgrounds |
| Inkwell | #262510 | Primary text, strong borders, nav text |
| Muted Stone | #7a7974 | Secondary text, subtle borders, icons |
| Deep Shadow | #141414 | Max contrast text and critical details |
| Pebble Gray | #e6e5e0 | Hover states and subtle nested card fills |
| Highlight Beige | #cdcdc9 | Low-weight separators and nested surfaces |
| Onyx Outline | #f54e00 | Outlined action borders and key links |
| Chartreuse Alert | #4ade80 | Positive snippets and code-like accents |
| Goldenrod Accent | #c08532 | Secondary interactive/icon accents |
| Forest Green Action | #34785c | Distinct secondary action state |

## Typography

- Primary: CursorGothic or system-ui fallback.
- Primary sizes: 13, 14, 16, 22, 26, 36, 72.
- Primary weight: 400.
- Line heights: from 1.00 display to 1.50 body.
- Tracking: precise values across sizes, including negative display tracking
  and small positive values for utility text.
- OpenType: ss09, ss08, tnum.
- Mono: Berkeley Mono or monospace.
- Mono sizes: 12 and 13.
- Utility face: Lato for small secondary text and support UI.

## Structure

- Warm page canvas.
- Layered floating cards.
- Compact density.
- 8px gaps for tight UI relationships.
- 4px radius for most controls and panels.
- 8px radius for visually distinct components.
- Multi-layer shadows are important and should be copied conceptually, not
  replaced by generic drop shadows.

## Components to reuse

1. Outlined primary button
   - Transparent fill.
   - Orange outline or text.
   - Small radius.
   - Works when the interface should feel tool-native.

2. Floating software card
   - Parchment or white-ish fill.
   - Strong multi-layer shadow.
   - Thin structural ring.
   - Looks stacked, not material-design elevated.

3. Compact nav item
   - CursorGothic.
   - Tight tracking.
   - Minimal border.

4. Code panel
   - Berkeley Mono.
   - Warm neutral background.
   - Small type, strong alignment.

5. Transparent input
   - Muted Stone border.
   - Minimal fill.
   - Text should remain the hero of the field.

## Design lessons

- A developer-tool brand can be warm and tactile without losing precision.
- Orange can serve as outline energy instead of filled-button dominance.
- OpenType settings are part of the visual identity, not optional polish.
- Tight spacing only works if typography is extremely controlled.
- Card depth can be expressive if shadows are layered and intentional.

## Anti-patterns

- Do not turn the primary button into a generic solid fill.
- Do not use arbitrary shadows.
- Do not remove custom tracking from headings.
- Do not use cool white backgrounds; the warmth is part of the identity.
- Do not over-round panels.

