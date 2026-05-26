# Greenspace - Geometric Modern Source Notes

Source: https://styles.refero.design/style/d961e174-875b-46ef-ad27-fe7f8e3bcd8c
Site: https://thegreenspace.com
North star: Monumental monochrome canvas
Theme: dark

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Greenspace Carbon | #000000 | neutral | Page backgrounds, significant surface areas, default text |
| Subtle Ash | #bebebe | neutral | Muted text, inactive links, secondary navigation elements – creates a whispered presence against primary backgrounds |
| Canvas White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |

## Typography

#### Typeface 1: haas_grotesk

- Role: Primary display and content typography. Its direct and unadorned presence underpins the brand's architectural aesthetic.
- Fallback: Inter
- Weights: 400
- Sizes: 24px, 72px
- Line height: 1.03, 1.15, 1.17
- Letter spacing: not specified

## Layout

The page primarily utilizes a full-bleed layout, where content sections often extend across the entire viewport width. The hero section features a prominent visual with large, centered navigation elements. Content is typically arranged in distinct, vertically stacked blocks that leverage large section gaps (200px) to create a spacious rhythm. There's a strong emphasis on full-width content blocks and large-scale typography, suggesting a contained but expansive page model. Navigation is likely a sticky top bar or off-canvas element from the 'GS' emblem, given the minimal on-page navigation elements.

## Spacing

- Section gap: 200px
- Element gap: 37px
- Card padding: 37px
- Page max width: not specified
- Radius: {"none":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link (Active) | Main navigation and hero links when active or hovered. | Text in Canvas White (#ffffff) on Greenspace Carbon (#000000) background. Font is haas_grotesk, 72px, weight 400, line height 1.03. |
| Navigation Link (Inactive) | Main navigation and hero links when inactive. | Text in Subtle Ash (#bebebe) on Greenspace Carbon (#000000) background. Font is haas_grotesk, 72px, weight 400, line height 1.03. |
| Project List Item | Listings for selected projects. | Text in Subtle Ash (#bebebe) on a white background. Font is haas_grotesk, 24px, weight 400, line height 1.15. No explicit padding or border. |
| Section Separator | Visual divider for content sections. | Implied by 200px vertical spacing, with a strict binary shift between carbon and white background compositions. No explicit line or element. |

## Dos

- Prioritize Greenspace Carbon (#000000) as the dominant background color for most page areas and major content blocks.
- Use Canvas White (#ffffff) sparingly for text on dark backgrounds and for high-contrast link states.
- Employ Subtle Ash (#bebebe) for all secondary and tertiary text, including inactive navigation and project listings, to create a sense of understated authority.
- Maintain a generous 200px vertical section gap to enforce strict separation and emphasize content monumentality.
- Use haas_grotesk (or substitute Inter) at 72px with a line height of 1.03 for all primary calls to action and prominent headings.
- Leverage haas_grotesk (or substitute Inter) at 24px with a line height of 1.15 for all body text, project lists, and secondary content blocks.
- Adhere to a strict 0px border-radius system across all components and elements for a brutalist, architectural feel.

## Donts

- Avoid introducing any additional chromatic colors; maintain a strictly achromatic palette.
- Do not use subtle gradients or soft shadows; elevation is achieved through color contrast and spatial separation.
- Do not create explicit card borders or outlines; content boundaries are defined by background changes and spacing.
- Do not use smaller font sizes for captions or body text; the minimal display emphasizes impact over detail density.
- Avoid complex or decorative imagery; visuals should be integrated as impactful, high-contrast product shots or abstract elements.
- Do not layer elements or use overlays unless functionally critical; prioritize flat, distinct content blocks.
- Do not vary line heights or letter spacing from the tokenized values; consistency is key to the system's precision.

## Transferable Lessons

- Read this source through the lens of Geometric Modern: Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
