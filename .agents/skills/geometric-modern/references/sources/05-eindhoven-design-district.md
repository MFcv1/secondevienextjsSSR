# Eindhoven Design District - Geometric Modern Source Notes

Source: https://styles.refero.design/style/c90b584e-de5b-4971-9e13-8ab991bd96c0
Site: https://www.eindhovendesigndistrict.com
North star: Graphic Modernist Poster
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, ghost button backgrounds, and general UI where lightness is needed |
| Ink Black | #000000 | neutral | Primary text, borders, icons, and as a stark background for hero sections or prominent display areas, creating high contrast against Canvas White |
| Ash Gray | #e8e8e8 | neutral | Secondary card surfaces, offering a subtle visual break from pure white |
| Silver Thread | #bfbfbf | neutral | Fine lines, subtle borders, and less prominent text elements |
| Focus Red | #ff0000 | accent | Content emphasis, such as article headings and decorative accents |
| Blush Pink | #ffc2eb | accent | Decorative background blocks for featured sections, adding a soft, yet vivid, accent |
| Electric Blue | #0f26ed | accent | Decorative background blocks, providing a vibrant, high-energy counterpoint |

## Typography

#### Typeface 1: Helvetica Now

- Role: The sole typeface, Helvetica Now, dictates the entire typographic voice. Its use at extreme sizes and with tight letter-spacing for headings creates a bold, almost architectural feel, making type itself a key visual component of the layout. For body text, its legibility supports a functional, direct communication style.
- Fallback: Inter
- Weights: 400, 600
- Sizes: 14px, 16px, 18px, 19px, 23px, 35px, 46px, 50px
- Line height: 0.93, 1.00, 1.15, 1.20, 1.31, 1.40, 1.47
- Letter spacing: -0.05em at 50px, -0.03em at 46px, -0.024em at 35px, -0.02em at 23px, -0.017em at 19px, -0.004em at 18px, 0.005em at 16px, 0.015em at 14px

## Layout

The page maintains a crisp, high-contrast layout, primarily favoring a max-width, center-aligned container for content, though the hero section breaks this to full-bleed. The hero often employs large, graphic typography interacting with contained rectangular images. Content sections have a consistent vertical rhythm (35px sectionGap) and use alternating single-column centered text blocks, 2-column text+image arrangements, and 3-column card grids for features and articles. The navigation is a minimalist top bar with utility icons and a hamburger menu.

## Spacing

- Section gap: 35px
- Element gap: 20px
- Card padding: 20px
- Page max width: not specified
- Radius: {"cards":"0px","buttons":"500px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button | Navigation, secondary actions, and inline links. | Minimalist buttons with no background, Ink Black text, and a 1px Ink Black border, using 500px radius for a pill shape. Padding is compact: 1px vertical, 15px horizontal. The focus is on the border and text, emphasizing clickable areas without visual weight. |
| Primary Action Button | Key interactions and calls to action. | Filled buttons with Canvas White background, Ink Black text, and a 1px Ink Black border. Features generous padding (18px top, 21px bottom, 35px horizontal) and a 500px radius for a bold, approachable pill shape, conveying an important, but not aggressive, action. |
| Icon Button | Standalone interactive icons, such as menu toggles or search. | Circular buttons with a Canvas White background and a 1px Ink Black border, using a 100% border-radius. No internal padding, designed to enclose a single icon, maintaining a clean, compact footprint typical of utility actions. |
| Plain Link Button | Text-based actions that blend seamlessly with content. | Simple text links with no background, border, or radius. The Ink Black text identifies it as an actionable element within sentences or lists, providing a low-hierarchy interactive element. |
| Article Card | Displaying content previews in grid layouts. | Cards with a transparent background and no borders or shadow, defining content regions purely by image and typography. Text is Ink Black. |
| Gray Background Card | Highlighting distinct content blocks within a section. | Cards with an Ash Gray background, no borders or shadows. These cards provide a subtle elevation for content, making them stand out against the main Canvas White background without introducing strong visual separation. |

## Dos

- Use Ink Black (#000000) for all primary text and Canvas White (#ffffff) for all main backgrounds to achieve maximum contrast.
- Apply a 500px border-radius to all interactive buttons and tags for a consistent pill-shaped aesthetic.
- Reinforce design elements with 1px Ink Black (#000000) borders for definition, maintaining a very clean and sharp edge.
- Employ Helvetica Now as the sole typeface, varying weight and size to establish typographic hierarchy rather than introducing additional fonts.
- Utilize large display typography with tight letter-spacing (-0.05em at 50px, -0.03em at 46px) as a prominent graphic component in hero sections and headlines.
- Implement a spacious `elementGap` of 20px and a `sectionGap` of 35px to create ample negative space and visual breathing room between UI elements and content blocks.
- Integrate photographic imagery as contained rectangles with 0px border-radius, maintaining the overall rectilinear and stark aesthetic.

## Donts

- Do not introduce mid-tone gray backgrounds or text colors beyond Ash Gray (#e8e8e8) or Silver Thread (#bfbfbf), as the system relies on stark black and white contrast.
- Avoid using drop shadows or complex elevation styles; the design emphasizes flat surfaces and clear planar separation.
- Do not deviate from the Helvetica Now typeface; its specific character and variable weights are central to the brand's typographic identity.
- Refrain from using gradients for backgrounds, text, or UI elements; the system prioritizes solid color blocks.
- Do not apply rounded corners to images or cards; maintain the strict rectilinear forms defined by '0px' border-radius.
- Avoid excessive use of vivid chromatic colors; they are reserved for controlled, decorative blocks and specific content emphasis, not general UI components.
- Do not use generic font icons or heavily stylized icons; prefer simple, monochrome, possibly outlined icons that maintain the graphical integrity.

## Transferable Lessons

- Read this source through the lens of Geometric Modern: Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
