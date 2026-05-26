---
source: Refero Styles
refero_url: https://styles.refero.design/style/dc541737-8bf2-4b31-b729-0352f696e82f
brand_url: https://openai.com
style_family: editorial-minimal
theme: light
captured_for: design-skills-db
---

# OpenAI - Editorial Minimal Source Notes

## Core read

OpenAI is the pure white editorial-minimal archetype. The page behaves like an
empty sheet: black text, pale borders, no UI accent colors, no section color
blocking, and almost no elevation. The visual system depends on typography,
white space, exact radius contrast, and carefully curated editorial imagery.

The most important lesson is chromatic discipline. Color is not a UI tool here.
It appears through content: image thumbnails, editorial cards, model visuals, and
soft gradient-like media. Buttons stay black or ghosted. Borders stay pale gray.
The product feels intelligent because the page refuses to decorate itself.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Void | #000000 | Primary text, nav labels, filled CTA, icons |
| Graphite | #666666 | Secondary body, icon strokes, support labels |
| Ash | #8f8f8f | Tertiary labels, disabled states |
| Fog Border | #e5e7eb | All dividers, card outlines, input borders |
| Chalk | #f1f1f1 | Hover fills and tiny surface shifts |
| Canvas | #ffffff | Page background and all primary surfaces |

## Typography

- Single typeface system: OpenAI Sans or Inter / DM Sans fallback.
- Weights: 400, 500, 600 only.
- Sizes: 13, 14, 16, 17, 18, 22, 28, 48.
- Display: 48px, 500/600, line-height about 1.16.
- Display tracking: around -0.03em.
- Mid-size tracking: around -0.01em.
- Small labels: slight positive tracking around +0.011em.
- Body: no decorative tracking; rely on clean line-height.

## Structure

- Page canvas: pure white everywhere.
- Max width: around 1200px.
- Nav height: around 64px.
- Section gaps: 64-80px.
- Card padding: around 32px when cards exist.
- Main components are separated by distance, not background bands.
- Editorial grids are asymmetric: one large story paired with smaller stacked cards.

## Component lessons

1. Filled pill CTA
   - Black fill, white text.
   - 9999px radius.
   - Almost invisible shadow at most.
   - No colored CTA.

2. Ghost pill button
   - Transparent fill.
   - Black text.
   - Very pale border.
   - Hover shifts to Chalk.

3. Conversational input
   - Centered.
   - 9999px radius.
   - Pale border.
   - Icon offset and submit affordance.

4. Editorial card
   - Image clipped at exact 6.08px radius.
   - No card background, no border, no shadow.
   - Metadata line in muted gray.

5. Footer columns
   - White background.
   - Top border only.
   - Small, quiet typographic hierarchy.

## Design lessons

- White space is the main surface.
- UI chroma must be almost zero.
- Color can appear only through content/media.
- A two-radius system can create identity: full pills plus near-square media.
- Editorial card grids can add richness without card chrome.
- The page should feel quiet enough that images and words become the event.

## Anti-patterns

- Do not add blue, green, or orange UI accents.
- Do not add shadows to editorial cards.
- Do not introduce background bands.
- Do not use medium radii like 12px/16px/24px casually.
- Do not make images harsh, literal, or stock-like.
- Do not use more than black, graphite, ash, and pale border in core UI.

