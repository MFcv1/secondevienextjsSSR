# Victor Cango - Editorial Type Source Notes

Source: https://styles.refero.design/style/66fdf7a4-7d28-452e-88ec-c84e49b3ae6f
Site: https://victorcango.fr
North star: Editorial type on stark canvas
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Ink Obsidian | #0f0f0f | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Canvas Parchment | #f7f7f7 | neutral | Page backgrounds, footer backgrounds — the primary light surface for all content |

## Typography

#### Typeface 1: century-old-style-std

- Role: Hero headlines, main content headings, and larger textual elements where a distinguished, classic serif feel is desired to convey editorial weight. The subtle negative letter-spacing prevents open kerning at larger sizes.
- Fallback: Palatino Linotype, Georgia, serif
- Weights: 400
- Sizes: 16px, 21px, 50px
- Line height: 1.00, 1.30
- Letter spacing: -0.0940em at 50px, -0.0500em at 21px, normal at 16px

#### Typeface 2: MetroSans

- Role: Body text, navigation items, and link text where a clean, modern sans-serif provides readability and a contemporary counterpoint to the serif headings. The consistent tight letter-spacing supports density and precision.
- Fallback: system-ui, 'Helvetica Neue', Arial, sans-serif
- Weights: 400
- Sizes: 21px, 24px, 50px
- Line height: 1.00, 1.30
- Letter spacing: -0.0500em

## Layout

The page primarily uses a contained, centered layout for content sections, set against a full-bleed Canvas Parchment background. The header is minimal, containing navigation links and a clock, with a clear separation of elements. The hero section features large, expressive typography centrally placed, often juxtaposed with abstracted graphical elements. Content sections typically flow with consistent vertical spacing (48px section gap), and text blocks maintain generous padding (16px) to enhance readability and visual impact, suggesting a content-dominant composition with artful visual accents.

## Spacing

- Section gap: 48px
- Element gap: 16px
- Card padding: 16px
- Page max width: not specified
- Radius: {"default":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link - Underlined | Interactive text link, primarily for navigation. | Text in Ink Obsidian (#0f0f0f), MetroSans 400. Renders with a 1px solid Ink Obsidian underline upon hover or active state. Padding-bottom of 6px is used to separate the text from its underline. |
| Hero Headline | Primary page title or major section heading. | century-old-style-std 400, 50px font size, 1.0 line height, letter-spacing -0.094em, Ink Obsidian (#0f0f0f). |
| Header Clock | Decorative time display in the header. | MetroSans 400, 21px font size, 1.0 line height, letter-spacing -0.05em, Ink Obsidian (#0f0f0f). Typically positioned within the header bar with 4px left/right margin. |
| Body Text Paragraph | General informational text. | century-old-style-std 400, 16px font size, 1.3 line height, Ink Obsidian (#0f0f0f). Used for longer content blocks. |
| Footer Section | Container for copyright, contact info, and secondary navigation. | Background is Canvas Parchment (#f7f7f7), with 16px padding on all sides. Text elements use Ink Obsidian (#0f0f0f) with various typographic styles. |

## Dos

- Prioritize Ink Obsidian (#0f0f0f) for all primary text and critical UI elements against Canvas Parchment (#f7f7f7) backgrounds to ensure high contrast.
- Use century-old-style-std for expressive and editorial headlines, specifically at 50px with a letter-spacing of -0.0940em.
- Apply MetroSans for functional text elements, navigation, and body copy headings, ensuring 21px/24px sizes use -0.0500em letter-spacing.
- When creating interactive links, use Ink Obsidian (#0f0f0f) text and an Ink Obsidian (#0f0f0f) 1px underline, offset by 6px padding-bottom.
- Maintain a clear visual hierarchy by utilizing the distinct styles of century-old-style-std (serif) and MetroSans (sans-serif) purposefully.
- Structure sections with a minimum vertical separation of 48px to create comfortable density in the layout.
- Incorporate 16px padding on interior content blocks and cards to provide ample breathing room for text.

## Donts

- Do not introduce new primary background or text colors; adhere strictly to Ink Obsidian (#0f0f0f) and Canvas Parchment (#f7f7f7).
- Avoid using decorative borders or drop shadows on cards or elements; rely on typography and spacing for separation.
- Do not deviate from the specified letter-spacing values for type roles, especially for larger headings and navigation where it defines the character.
- Refrain from using color to indicate interactive states; underlines and bolding in Ink Obsidian (#0f0f0f) are preferred.
- Do not use generic system fonts as substitutes for century-old-style-std or MetroSans without explicit approval, as their unique character is central.
- Avoid overly dense content blocks without sufficient element gaps; ensure 16px spacing between most adjacent UI elements.
- Do not use corner radius on any UI elements; maintain sharp, crisp edges throughout the design.

## Transferable Lessons

- Read this source through the lens of Editorial Type: Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
