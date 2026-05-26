# kaisermann - Monochrome UI Source Notes

Source: https://styles.refero.design/style/872ce8b7-993d-4dea-a361-9ccb59d136c0
Site: https://kaisermann.me
North star: monochrome command-line interface
Theme: dark

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Terminal Black | #000000 | neutral | Page backgrounds, surface background for all elements, creating a deep digital void |
| Text Gray | #a0a0a0 | neutral | Medium-contrast borders, control outlines, and structural separators. Do not promote it to the primary CTA color |
| Active White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |
| Glitch Cyan | #02b7b6 | accent | Decorative glitch effect on text and UI elements, adding a digital artifact quality |
| Glitch Red | #b70202 | accent | Decorative glitch effect on text and UI elements, adding a digital artifact quality |

## Typography

#### Typeface 1: VCR OSD Mono

- Role: All text elements, including headings, body, navigation, and buttons. Its fixed-width, pixelated style is central to the retro terminal aesthetic, creating an intentional low-fidelity digital feel.
- Fallback: monospace
- Weights: 400
- Sizes: 23px, 26px, 63px
- Line height: 0.90, 1.20, 1.40
- Letter spacing: normal

## Layout

The page adheres to a full-bleed layout, taking up the entire viewport without a maximum width or centered constraint. The hero section displays a minimal, centered text arrangement with header and metadata. Content sections flow vertically with consistent, generous 160px gaps between them, giving a spacious and uncluttered feel. The primary content arrangement is a single column of text, often with text-based 'links' acting as interactive elements. Navigation elements are subtly integrated into the header, typically text-only. The overall density is spacious, with ample negative space around text blocks.

## Spacing

- Section gap: 160px
- Element gap: 0px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Navigation Link | Primary navigation and interactive text elements within articles. | Text in Text Gray (#a0a0a0) with a 0px border-radius. On hover or active state, the text and a 1px bottom border switch to Active White (#ffffff). No background or padding. |
| Primary Heading | Main page titles and prominent textual information. | VCR OSD Mono, size 63px, line height 0.9. Color Active White (#ffffff). No background, border, or padding. Integrates directly into the page content. |
| Body Text Block | Standard page content and paragraphs. | VCR OSD Mono, size 23px or 26px, line height 1.2 or 1.4. Color Text Gray (#a0a0a0). Rendered as plain text or within card contexts without visual distinction. |
| System Status Line | Metadata display like dates and channel numbers. | Small text elements typically in the page header with Text Gray (#a0a0a0) and 0px radius. Used for functional, non-interactive visual data. |

## Dos

- Always use 'VCR OSD Mono' for all text content, respecting its fixed letter-spacing and line heights to maintain the pixelated aesthetic.
- Utilize Terminal Black (#000000) as the universal background for all sections and components without exception.
- Apply Active White (#ffffff) exclusively for high-emphasis text, active states, and interactive element borders.
- Employ Text Gray (#a0a0a0) for all primary body text, secondary information, and inactive interactive borders.
- Maintain a uniform 0px border-radius for all interactive and visual elements, reinforcing the sharp, digital interface feel.
- Keep padding and margins on interactive elements, like buttons and links, at 0px to ensure the compact, text-only interaction.
- Introduce Glitch Cyan or Glitch Red as decorative rgba(..., .4) overlays for hover states or loading indicators to amplify the retro digital effect.

## Donts

- Do not introduce any chromatic colors beyond the defined Glitch Cyan or Glitch Red accent, and only as subtle overlays or visual effects.
- Avoid using any form of background color or padding on interactive elements; they should appear as text-only entities with border changes for state.
- Never apply border-radius values greater than 0px to any component or element.
- Do not use box-shadows or any form of elevation; the design system emphasizes a flat, screen-rendered aesthetic.
- Avoid custom gradients; stick to the solid color palette and occasional glitch overlays.
- Do not use imagery in the main content area; the experience is text-centric and code-like.
- Refrain from using common UI iconography or graphical elements that deviate from the text-based or ASCII art style.

## Transferable Lessons

- Read this source through the lens of Monochrome UI: Monochrome UI succeeds when every shade has a job. The absence of color should make hierarchy sharper, not make the interface vague.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
