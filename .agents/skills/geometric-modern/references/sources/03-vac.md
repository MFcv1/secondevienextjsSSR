# V–A–C - Geometric Modern Source Notes

Source: https://styles.refero.design/style/40154dc4-e681-4df9-be01-a6681d5887a6
Site: https://v-a-c.org/en
North star: Architectural grid on white
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, ghost button text (dark theme) |
| Ink Black | #000000 | neutral | Neutral form states, badge text, and quiet UI feedback where color should stay understated. Do not promote it to the primary CTA color |
| Accent Gray | #999999 | neutral | Decorative strokes, subtle secondary graphical elements |

## Typography

#### Typeface 1: Diagramatika Text

- Role: Body copy, link text, card subtitles, input text — conveys clear information without demanding attention.
- Fallback: IBM Plex Sans
- Weights: 400
- Sizes: 16px, 20px
- Line height: 1.00, 1.10, 1.15
- Letter spacing: normal

#### Typeface 2: Diagramatika Display

- Role: Headlines, section titles, card titles — large and impactful, yet light in weight, establishing hierarchy subtly.
- Fallback: IBM Plex Sans
- Weights: 400
- Sizes: 24px, 34px, 35px
- Line height: 0.88, 0.90, 1.15
- Letter spacing: normal

## Layout

The page operates on a full-bleed model horizontally, with content contained within a flexible-width, vertically oriented grid. The hero section often features a clean line and heading (like 'GES-2', 'V', 'A', 'C') at the top, acting as a navigational anchor. Section rhythm is dictated by a consistent '150px' vertical gap between content blocks. Content is arranged primarily in a two-column grid where text and imagery flow in a linear, timeline-like sequence down the page without alternating patterns. Navigation is minimal, consisting of text links in the header and alongside sections, with a fixed position vertical navigation bar with rotated text. The design is compact in its element spacing but generous in its section spacing.

## Spacing

- Section gap: 150px
- Element gap: 5px
- Card padding: 0px
- Page max width: not specified
- Radius: {"all":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Text Button (Dark Text) | Primary interactions and navigation links | Transparent background with Ink Black text. No padding, border, or radius. Text uses Diagramatika Text or Display, weight 400. Example: 'Search' or 'Load more'. |
| Ghost Text Button (Light Text) | Interactive elements on dark sections, such as language toggles | Transparent background with Canvas White text. No padding, border, or radius. Text uses Diagramatika Text, weight 400. Example: 'ru' / 'en'. |
| Minimal Card | Displaying informational blocks like event listings | Transparent background with no border-radius or box-shadow. Content is tightly aligned, often directly on the canvas. Padding is 0px. Top padding can vary (258px, 271px, 274px, 275px) depending on image height. Example: Event listings like 'Alexandra Sukhareva. Beginnings'. |
| Line Input | Form inputs for search or data entry | Transparent background with Ink Black text and a 1px Ink Black underline. Left padding is 2px. No border radius. Text uses Diagramatika Text, weight 400. |

## Dos

- Use 'Ink Black' (#000000) for all text color, borders, and interactive elements where contrast is paramount.
- Maintain a strict '0px' border-radius for all interactive and display elements, adhering to the sharp, angular aesthetic.
- Employ 'Diagramatika Text' (400) for all body copy and most UI labels, prioritizing clarity over decoration.
- Employ 'Diagramatika Display' (400) for headlines and major navigational elements, with sizes 24px, 34px, or 35px.
- Ensure ample whitespace between sections using '150px' vertical spacing (`sectionGap`).
- Design all interactive elements, such as buttons and links, as transparent backgrounds with only text and a border where necessary.
- Utilize 'Accent Gray' (#999999) sparingly for subtle decorative strokes, not for primary UI elements.

## Donts

- Avoid using any colors other than Canvas White, Ink Black, and Accent Gray for primary UI elements and text.
- Do not introduce any border-radius greater than '0px' on any component or surface.
- Never apply box-shadows or elevation effects; the design system relies on flat surfaces and lines.
- Do not introduce any explicit background colors for cards; they should appear as content directly on the canvas.
- Avoid decorative imagery that breaks the monochrome, grid-based aesthetic, unless it is content within a card.
- Do not use letter-spacing adjustments; all typography should maintain 'normal' letter-spacing.
- Refrain from using any gradient fills; surfaces should be solid colors.

## Transferable Lessons

- Read this source through the lens of Geometric Modern: Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
