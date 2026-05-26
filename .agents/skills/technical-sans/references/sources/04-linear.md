---
source: Refero Styles
refero_url: https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1
brand_url: https://linear.app
style_family: technical-sans
theme: dark
captured_for: design-skills-db
---

# Linear - Technical Sans Source Notes

## Core read

Linear is a dark command-center technical system. It is compact, layered, and
nearly monochrome, with one bright lime accent used as a high-signal action and
focus color. The strength is restraint: surfaces differ by tiny neutral steps,
type remains tight and readable, and controls share a consistent 6px radius.

This is the dark-side counterpart to Plain and Cursor. Where Plain is a bright
workbench and Cursor is a warm studio, Linear is an operations console for teams
that need focus, density, and hierarchy.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Pitch Black | #08090a | Page background and base surface |
| Graphite | #0f1011 | Elevated card background |
| Deep Slate | #161718 | Secondary elevated surface |
| Charcoal Grey | #23252a | Borders and framed elements |
| Muted Ash | #323334 | Subtle dividers |
| Gunmetal | #383b3f | Functional borders and tertiary fills |
| Porcelain | #f7f8f8 | Primary text/icons |
| Light Steel | #d0d6e0 | Secondary text and structural lines |
| Storm Cloud | #8a8f98 | Tertiary text and inactive states |
| Fog Grey | #62666d | Muted metadata |
| Neon Lime | #e4f222 | Primary action, active state, focus |
| Aether Blue | #5e6ad2 | Occasional decorative/brand tech context |
| Forest Green | #008d2c | Positive status |
| Emerald | #27a644 | Completion/success |
| Warning Red | #eb5757 | Critical state, not primary control |

## Typography

- Primary: Inter Variable.
- Weights: 300, 400, 510, 590.
- Sizes: 10 through 72, around 14 observed steps.
- Display: 72px, weight 510, line-height 1.
- Main headings: 48 to 64px at weight 510.
- UI emphasis: 17 to 20px at weight 590.
- Body: 15 to 16px at weight 400.
- Tracking: tight negative values around -0.22px to -0.1px.
- Mono: Berkeley Mono or IBM Plex Mono.
- Mono sizes: 12, 13, 14.
- Mono role: code, IDs, technical details, data displays.

## Structure

- Base unit: 4px.
- Density: compact.
- Section gap: 24px.
- Card padding: 12px.
- Element gap: 8px.
- Radii: 2px tags, 4px badges, 6px cards/buttons/inputs/default.

## Components to reuse

1. Lime primary button
   - #e4f222 fill.
   - Near-black text.
   - 6px radius.
   - Reserved for primary action.

2. Graphite card
   - #0f1011 fill over #08090a.
   - 6px radius.
   - Minimal shadow/ring.

3. Sidebar nav item
   - Transparent background.
   - Storm Cloud text by default.
   - Porcelain or lime state when active.

4. Subtle link button
   - Transparent fill.
   - Light Steel text.
   - Small horizontal padding.

5. Code/data block
   - Alabaster or muted border detail.
   - Mono type.
   - Dark surface stack.

## Design lessons

- Dark technical products need multiple near-black levels; one black plus gray
  cards is not enough.
- A single bright accent becomes powerful when the whole UI is disciplined.
- Compact density must be supported by tight type and small radius consistency.
- Success/error colors should remain semantic, not decorative.
- A dark technical UI should feel navigable through value shifts, not glow.

## Anti-patterns

- Do not add many bright accents.
- Do not use harsh white surfaces.
- Do not make every card glow.
- Do not use large, soft SaaS radii.
- Do not loosen letter spacing; the precision is in the tightness.

