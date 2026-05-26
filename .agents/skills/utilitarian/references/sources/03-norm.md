# Norm - Utilitarian Source Notes

Source: https://styles.refero.design/style/8d66df35-a06c-4ea9-ae8b-ab3e1c01f797
Site: https://norm.store
North star: Architectural blueprint on white marble. Precision, clean lines, and stark mono-palette highlight a single, functional object.
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, general container backgrounds |
| Pitch Black | #000000 | neutral | Primary text, prominent headings, default icon fills, active outline borders |
| Near Black | #282828 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |

## Typography

#### Typeface 1: custom_50109

- Role: Primary headings, subheadings, and key marketing statements. The limited weights coupled with large, precise sizing creates a strong, no-nonsense voice.
- Fallback: not specified
- Weights: 400
- Sizes: 16px, 24px, 48px
- Line height: 1.00, 1.50, 1.56
- Letter spacing: -0.0170em at 48px, -0.0080em at 24px, normal at 16px

#### Typeface 2: -apple-system

- Role: Interface text, navigation links, and small functional labels. A system font ensures clarity and efficiency for utility content.
- Fallback: system-ui
- Weights: 400
- Sizes: 16px
- Line height: 1.00
- Letter spacing: normal

#### Typeface 3: Inter

- Role: Supportive body text. Its inclusion suggests a slight textural variation for longer passages without deviating from the overall sparse aesthetic.
- Fallback: Inter Sans
- Weights: 400
- Sizes: 18px
- Line height: 1.33
- Letter spacing: normal

## Layout

The page primarily uses a full-bleed, vertically segmented layout, alternating between large, centered text blocks and centered product imagery. Each section has a consistent vertical rhythm, with generous implied section gaps. The hero features a centered product shot above a large, centered multi-line headline. Subsequent sections also predominantly use centered stacks of text. There is no explicit grid for cards, and content is primarily a single column. Navigation is minimal, limited to a top-right utility bar with ghost buttons, suggesting a more focused, uncluttered experience.

## Spacing

- Section gap: 64px
- Element gap: 16px
- Card padding: 0px
- Page max width: not specified
- Radius: {"tags":"57px","buttons":"12px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button Large | Secondary calls to action and navigational links within content blocks. Its transparent background and thick border suggest a less intrusive action. | Text: Pitch Black (#000000), custom_50109 400, 16px. Background: Canvas White (#ffffff). Border: 0.5px solid Pitch Black (#000000). Padding: 16px vertical, 24px horizontal. Corner radius: 12px. |
| Ghost Button Small | Utility links in header navigation. A compact, outlined button that provides clear interaction without visual dominance. | Text: Pitch Black (#000000), -apple-system 400, 16px. Background: Canvas White (#ffffff), Border: 0.5px solid Pitch Black (#000000). Padding: 8px vertical, 12px horizontal. Corner radius: 12px. |
| Ghost Button Tag | Informational tags or very subtle calls to action within header. The extreme radius makes it visually distinct. | Text: Pitch Black (#000000), -apple-system 400, 16px. Background: Canvas White (#ffffff). Border: 0.5px solid Pitch Black (#000000). Padding: 4px vertical, 12px horizontal. Corner radius: 57px. |
| Section Divider | Horizontal rule for content separation. Provides visual structure between sections. | Height: 0.5px. Color: Near Black (#282828). |

## Dos

- Prioritize Canvas White (#ffffff) as the primary background for all major content sections and surfaces.
- Use Pitch Black (#000000) for all primary body text, headlines, and calls to action text.
- Employ custom_50109 400 at 48px or 24px, with specific letter-spacing, for all prominent headings and content titles.
- Use Ghost Button styling, with a 0.5px Pitch Black (#000000) border and 12px radius, for all interactive elements.
- Apply 12px border-radius consistently to all button-like components, and 57px for small tags.
- Maintain generous negative space around content blocks, using implied section gaps of 64px.
- Apply 0.5px borders in Near Black (#282828) for subtle visual separation and detailed outlines.

## Donts

- Avoid using saturated colors; the palette is strictly achromatic.
- Do not use solid background buttons; all interactive elements should be ghosted or text-only.
- Do not introduce shadows; elevation is achieved solely through stark contrast and spacing.
- Avoid decorative imagery that competes with the product photography or text-heavy content.
- Do not deviate from the specified letter-spacing for custom_50109, especially for display sizes.
- Do not use heavy weights for typography; 400 is the only active weight in the system.
- Do not use small, tight radii; larger radii of 12px or 57px are signature elements.

## Transferable Lessons

- Read this source through the lens of Utilitarian: Utilitarian design is not ugly; it is respectful. It removes visual performance so users can complete real work quickly and confidently.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
