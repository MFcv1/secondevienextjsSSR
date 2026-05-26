# No Ideas - Editorial Type Source Notes

Source: https://styles.refero.design/style/908017b4-311c-4b89-afa5-c29c8cb08e8b
Site: https://noideas.website
North star: High-contrast editorial publication
Theme: dark

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, prominent text (on dark), borders, ghost button outlines |
| Ink Black | #000000 | neutral | Primary surface background, main body text, navigation elements, footer text |
| Text Gray | #212529 | neutral | General body text for readability, subtle borders |

## Typography

#### Typeface 1: ABC Diatype

- Role: Primary display font for headings and prominent editorial text. Its distinct letterforms and tight tracking at larger sizes create a bold, modern, almost logotype-like feel.
- Fallback: Inter
- Weights: 400, 500
- Sizes: 36px, 48px, 331px
- Line height: 1.05, 1.10, 1.52
- Letter spacing: -0.052em at 36px/48px, -0.010em at 331px

#### Typeface 2: system-ui

- Role: Body text and functional UI elements where high readability and system-level consistency are preferred.
- Fallback: Segoe UI, Apple System
- Weights: 400
- Sizes: 16px
- Line height: 1.50
- Letter spacing: normal

## Layout

The page embraces a full-bleed content model where sections can stretch across the viewport width. The hero section, as seen with the 'WINGS' title, features a full-bleed Ink Black background with large, centered Canvas White text. The section rhythm is defined by large vertical gaps (202px) between content blocks and a clear contrast shift between dark and light backgrounds. Content is often presented in a simple, stacked or implied two-column arrangement, focusing on strong typographic statements. Navigation is minimal, consisting of a top bar for core links and a detailed footer. The overall density is spacious, allowing elements significant room to breathe.

## Spacing

- Section gap: 
- Element gap: 29px
- Card padding: 
- Page max width: not specified
- Radius: {"image":"15px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Navigation Link | Interactive text link within headers and footers. | Text in Ink Black (#000000) or Canvas White (#ffffff) using ABC Diatype 400 at appropriate sizes for navigation, with no background or specific padding, relying on surrounding whitespace for interaction cues. |
| Editorial Header | Primary heading for sections or pages. | Utilizes ABC Diatype at large sizes (48px or 331px), typically in Canvas White (#ffffff) against Ink Black (#000000) or vice-versa, with tight letter spacing for visual impact. Has a distinct vertical rhythm of 202px below it. |
| Image Card | Container for visual content. | Images are presented with a 15px border-radius, giving a subtle softness to photographic elements within the otherwise sharp design. Text associated with images (e.g., captions) would typically use Canvas White #ffffff or Text Gray #212529. |
| Editorial Footer Section | Bottom navigation and additional information block. | Ink Black (#000000) background with Canvas White (#ffffff) text, structured with internal padding of 19px top/bottom and 29px left/right. Contains multiple interactive text links. |

## Dos

- Prioritize Canvas White (#ffffff) and Ink Black (#000000) for all primary backgrounds and text, maintaining high contrast.
- Use ABC Diatype for all headings and prominent textual elements, applying the specified letter-spacing for each size.
- Maintain generous spacing around sections, specifically a 202px bottom margin after primary content blocks.
- Apply a 15px border-radius consistently to all images for a subtle softening effect.
- Ensure UI elements for navigation and information are simple text links, without pronounced button styling, using either Canvas White (#ffffff) or Ink Black (#000000).
- Employ `system-ui` for all body text and secondary informational content at 16px weight 400 with normal letter-spacing and 1.5 line height.

## Donts

- Avoid introducing additional chromatic colors; the system relies on a strictly monochromatic palette.
- Do not use box-shadows or complex gradients; the design aesthetic is intentionally flat.
- Do not vary from the specified line heights and letter spacing for ABC Diatype; these are critical to the typographic identity.
- Do not add heavy borders or background fills to interactive elements; they should remain text-based or 'ghost' styled.
- Avoid dense informational blocks; embrace spacious layouts to create visual breathing room.
- Do not use decorative imagery that detracts from the stark, editorial focus; images should be integral to the content.

## Transferable Lessons

- Read this source through the lens of Editorial Type: Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
