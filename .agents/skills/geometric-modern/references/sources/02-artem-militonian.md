# Artem Militonian - Geometric Modern Source Notes

Source: https://styles.refero.design/style/c1749391-de9f-4500-a838-01d08a72fc00
Site: https://artmilitonian.com
North star: Monochrome Grid Blueprint
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, default stroke color for outlined elements |
| Ink Black | #000000 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Deep Graphite | #282828 | neutral | Secondary text, subtle borders, background detail elements, and specific text elements where a slightly softer black is desired than pure Ink Black |
| Muted Gray | #a1a1a1 | neutral | Subtler text, decorative border lines, and secondary informational elements. Provides a low-contrast readability against Canvas White |

## Typography

#### Typeface 1: custom_87914

- Role: Primary headings, navigation links, and compact informational text. Its variable letter-spacing and tight leading contribute significantly to the system's compressed, impactful feel.
- Fallback: Arial
- Weights: 400, 500
- Sizes: 8px, 34px, 60px, 157px
- Line height: 1.02, 1.03, 1.13
- Letter spacing: -0.0880em at 157px, -0.0500em at 60px, -0.0440em at 34px, -0.0250em at 8px, -0.0190em, 0.0630em

#### Typeface 2: -apple-system

- Role: System-level text, body copy in certain contexts, and internal component labels. This provides a readable baseline where a less stylized font is required.
- Fallback: system-ui
- Weights: 400
- Sizes: 16px
- Line height: 1.00
- Letter spacing: normal

## Layout

The page adheres to a full-bleed layout without a fixed max-width, allowing content to stretch across the browser window. The hero section features a prominent headline centered over a monochrome, abstract background graphic. Sections are primarily composed of stacked, centered content blocks, with liberal vertical spacing between major elements. Navigation is explicitly listed as an 'index' with underlined text links, reinforcing a command-line interface feel. The rhythm is not defined by alternating bands but by direct content progression, with a strong emphasis on typographic hierarchy and sparse graphical elements.

## Spacing

- Section gap: 64px
- Element gap: 1px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link | Primary interactive navigation and inline text links. | Text in Ink Black (#000000), custom_87914 font, with an underline of 1px in Ink Black (#000000) that typically extends to match text width, appearing on hover or active state. Uses 1px padding-bottom for the underline offset. No distinct background or radius. |
| Information Card (Transparent) | Container for content where a visual boundary is not desired but logical grouping is implied. | Background is Canvas White (#ffffff). No padding, radius, or shadow, blending seamlessly with the page background. Text and other elements within define its boundaries. |
| Utility Text Label | Small, secondary metadata labels or copyright information. | Text is Deep Graphite (#282828) or Muted Gray (#a1a1a1), usually custom_87914 at 8px, with specific letter-spacing. Minimal visual weight to not distract from primary content. |

## Dos

- Use no radius (0px) for all elements, maintaining a sharp, angular aesthetic.
- Employ the high-contrast pairing of Ink Black (#000000) text on Canvas White (#ffffff) backgrounds for primary content.
- Utilize custom_87914 font with specific negative letter-spacing for all headlines and navigation to create a dense, impactful textual presence.
- Apply 1px Ink Black (#000000) underlines for interactive elements to signal interactivity without color.
- Maintain minimal vertical spacing between related text elements, contributing to the compact feel.
- Incorporate subtle background graphics using Deep Graphite (#282828) lines on Canvas White (#ffffff) to add texture without color.

## Donts

- Do not introduce any chromatic colors; the palette is strictly achromatic.
- Avoid soft shadows or any form of elevation — the design is intentionally flat.
- Do not use rounded corners; all shapes and containers should be rectilinear.
- Refrain from large padding on structural elements like cards or sections; aim for a compact layout.
- Do not use generic system fonts for headlines or navigation; always prefer custom_87914 with its distinct tracking.
- Do not use gradients or color overlays; maintain the pure monochrome aesthetic.

## Transferable Lessons

- Read this source through the lens of Geometric Modern: Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
