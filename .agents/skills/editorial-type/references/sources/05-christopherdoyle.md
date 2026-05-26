# Christopherdoyle - Editorial Type Source Notes

Source: https://styles.refero.design/style/e1223d32-c423-4c95-ae0a-8a6f8585e6a2
Site: https://christopherdoyle.co
North star: Editorial Grid, Ink on Paper
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page background, primary surface for content areas, creating a clean white canvas |
| Jet Black | #000000 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Ash Gray | #ababab | neutral | Muted secondary text, subtle borders, and supporting information where a softer contrast is desired |
| Machine Orange | #ff5c26 | brand | Illustrative accent within content, serving as a vibrant brand identifier in select visuals and prominent typographic elements |

## Typography

#### Typeface 1: Founders Grotesk X Condensed

- Role: Prominent navigation and headings requiring a strong, condensed visual presence. Its tightly tracked, bold nature establishes a distinct brand voice.
- Fallback: Bebas Neue
- Weights: 400
- Sizes: 81px
- Line height: 1.00
- Letter spacing: -0.0100em at 81px

#### Typeface 2: Die Grotesk A

- Role: Primary body text, descriptive content, and subheadings. This font provides readability and a clean, direct tone for all textual information.
- Fallback: Inter
- Weights: 400
- Sizes: 12px, 14px
- Line height: 1.21, 1.28
- Letter spacing: normal

## Layout

The page structure is a full-bleed design, allowing content to extend to the viewport edges without a maximum width constraint. The hero section is characterized by a large-scale photograph directly behind overlapping typographic elements, creating a layered effect. The overall section rhythm appears to be based on large, distinct content blocks. Navigation is a simple, high-contrast textual top bar. Content is arranged in a dynamic, offset grid, with text blocks often juxtaposed against imagery, creating an asymmetrical composition that emphasizes individual elements. The density is comfortable but with bold, prominent features.

## Spacing

- Section gap: 75px
- Element gap: 15px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button | Interactive element | Minimal interactive elements rendered as plain text or linked content, using the default text color with no background or border. This focuses interaction directly on the text while maintaining a clean aesthetic. Text is Jet Black, background is transparent, and border is 0px. |

## Dos

- Prioritize Jet Black (#000000) for all primary text and headings against Canvas White (#ffffff) backgrounds to maintain high contrast and legibility.
- Utilize Founders Grotesk X Condensed Semibold at 81px with -0.0100em letter spacing for page titles and navigation to project a bold, editorial feel.
- Employ Die Grotesk A Regular at 14px for main body text and 12px for smaller content, ensuring ample line height for comfortable reading.
- Use a default padding of 15px around content sections and between grouped elements for comfortable density.
- Reserve Machine Orange (#ff5c26) exclusively for key brand accents in illustrations or powerful typographic statements, not for functional UI elements.
- Maintain sharp, 0px border radii for all elements to reinforce the architectural and precise visual style.
- Implement motion transitions with `ease` timing function and a duration of 0.3s for interactive elements like color changes to provide smooth feedback.

## Donts

- Avoid using drop shadows or complex gradients on UI elements; the design emphasizes flat surfaces.
- Do not introduce additional bold, saturated colors beyond Machine Orange (#ff5c26) as primary accents; maintain the strict monochrome base.
- Refrain from using varied border radii; all corners should be sharp 0px.
- Do not deviate from the established typographic scale and font families; inconsistent typography dilutes the brand's directness.
- Avoid excessive spacing or overly sparse layouts that might break the content's structured read on the page.
- Do not use #ababab (Ash Gray) for primary calls to action or essential information; it is reserved for secondary, muted content.

## Transferable Lessons

- Read this source through the lens of Editorial Type: Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
