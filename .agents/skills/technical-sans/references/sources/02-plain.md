---
source: Refero Styles
refero_url: https://styles.refero.design/style/9501cfdc-3eb3-4b64-90f6-9afdded48945
brand_url: https://plain.com
style_family: technical-sans
theme: light
captured_for: design-skills-db
---

# Plain - Technical Sans Source Notes

## Core read

Plain is a crisp digital workbench. It shows how Technical Sans can be light,
warm, practical, and precise without feeling cold. The canvas is mostly white,
but the supporting neutrals lean green and cream, so the interface keeps a
human support-tool character.

The primary visual engine is geometric sans typography, small-radius controls,
clean surfaces, and a vivid green accent. Unlike Antimetal's theatrical mixed
mode, Plain is operational from the first screen: the style is made for support,
communication, API tooling, workflow products, and admin surfaces.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas White | #ffffff | Main page, modals, pristine UI surfaces |
| Ghost Fog | #f3fbe9 | Quiet sections, soft blocks, ghost button backing |
| Vanilla Cream | #f9f6f1 | Warmer elevated cards |
| Ash Graphite | #0a2414 | Primary text, headings, hard borders |
| Deep Forest | #283a2e | Dark card variant or grounded surface |
| Sage Green | #607166 | Secondary copy, soft outlines |
| System Black | #000000 | Hard lines and deliberate structural dividers |
| Plain Green | #1ad379 | Primary action, active state, key links |
| Plain Green Muted | #17b267 | Secondary green, links, ghost borders |
| Alert Red | #360003 | Deep red wash or emphasis background, not generic error |
| Warm Pink | #ffbac3 | Specific highlights and occasional warm detail |

## Typography

- Primary face: ABC Favorit or substitute Inter.
- Weights: 400 and 500.
- Type sizes: 13, 15, 18, 24, 48, 80.
- Display: 80px, weight 400, line-height about 0.95, tracking around -0.02em.
- Large heading: 48px, weight 500, line-height about 1.04.
- Body: 15px, weight 400, line-height about 1.33.
- Mono: Geist Mono or JetBrains Mono.
- Mono usage: code snippets, timestamps, secondary nav, functional labels.
- Mono tracking: positive, around 0.015em.

## Structure

- Base unit: 4px.
- Density: comfortable.
- Section gap: 40px.
- Card padding: 24px.
- Element gap: 24px.
- Card radius: 9px.
- Button/general radius: 6px.

## Components to reuse

1. Green filled action button
   - #1ad379 fill.
   - Dark graphite text.
   - 6px radius.
   - Compact padding.
   - Feels like a tool command, not a glossy marketing CTA.

2. Muted ghost button
   - Pale Ghost Fog or transparent background.
   - Green border or text.
   - Use for secondary actions.

3. Workbench card
   - Vanilla Cream or white fill.
   - Small radius.
   - Minimal shadow.
   - Enough padding for scanning.

4. Dark forest contrast module
   - Deep Forest fill.
   - Useful for code, terminal, or highlighted support workflow areas.

5. Mono metadata row
   - Geist Mono at 13px.
   - Positive tracking.
   - Works for timestamps, IDs, logs, or system labels.

## Design lessons

- Technical does not need blue. Plain proves that green can carry a whole
  support/workflow product if the rest of the palette stays restrained.
- Small radii make the interface feel tool-like; large radii would soften it
  into consumer SaaS.
- A warm off-white secondary surface can remove the sterile feeling of pure
  white without becoming beige-heavy.
- Mono should appear as functional texture, not as the whole typographic system.
- System black is useful for crisp separators, but it should not dominate copy.

## Anti-patterns

- Do not add multiple saturated accents.
- Do not use glossy shadows or card-heavy marketing decoration.
- Do not make buttons pill-shaped.
- Do not use generic gray for everything; keep the green/cream undertone.
- Do not overuse mono for paragraphs.

