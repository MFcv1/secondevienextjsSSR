# Office Chair Finder - Utilitarian Source Notes

Source: https://styles.refero.design/style/756dd3c1-6ccf-4824-bad3-96027cd0faf0
Site: https://findmy.vitra.com/en-en
North star: Monochrome utility with active red accents.
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Absolute Zero | #272727 | neutral | Most prominent text color, default borders, major headings, content text |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, button text for filled buttons, outlines for ghost buttons |
| Ink Wash | #333333 | neutral | Filled button backgrounds, subtle decorative fills in navigation |
| Ash Gray | #a9a9a9 | neutral | Muted link text, secondary border details |
| Action Red | #ef6b6b | accent | Outlined interactive elements (links, buttons) — provides the only chromatic highlight to draw attention to actionable items without overwhelming the monochrome interface |

## Typography

#### Typeface 1: Times New Roman

- Role: Body text and miscellaneous content, providing a classic, readable foundation.
- Fallback: serif
- Weights: 400
- Sizes: 16px
- Line height: 1.00
- Letter spacing: not specified

#### Typeface 2: Futura

- Role: Headings, navigation elements, and interactive text. Its geometric sans-serif nature provides a modern counterpoint to the body text for clear hierarchy and calls to action.
- Fallback: sans-serif
- Weights: 400
- Sizes: 12px, 14px, 48px
- Line height: 1.15, 1.20, 1.30
- Letter spacing: not specified

## Layout

The page exhibits a max-width contained layout rather than full-bleed. The hero section, if present, is obscured by a modal, but background elements suggest a visually dynamic, full-viewport aesthetic. Content is arranged with consistent vertical spacing, and sections appear to predominantly stack. The primary content is presented within a central modal that overlays the background, indicating a highly focused, task-oriented user flow. Navigation is a minimal top bar, suggesting an overlay or simplified experience rather than complex hierarchies.

## Spacing

- Section gap: 173px
- Element gap: 13px
- Card padding: 12px
- Page max width: not specified
- Radius: {"button":"5px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Filled Action Button | Primary Call to Action | Solid Ink Wash background (#333333) with Canvas White text (#ffffff), a 5px border-radius, and a soft shadow. Padding is 12px vertical and 52px horizontal, creating substantial visual weight. |
| Outlined Action Link | Secondary Interaction | Canvas White background with an Action Red border (#ef6b6b) and Action Red text. Used for navigation where an interactive state is highlighted, typically with minimal padding (implicit from text size). |
| Muted Link Text | Tertiary Navigation/Information | Ash Gray text (#a9a9a9) with an Ash Gray border, used for less prominent links like country selectors. Provides visual differentiation from primary links. |
| Modal Card | Content Overlay | Canvas White background (#ffffff) with Absolute Zero text (#272727). Implicitly uses page padding for internal content, and a border radius of 5px if buttons inside match this radius. |
| Navigation Bar | Persistent Global Navigation | Canvas White background (#ffffff) with Ink Wash (#333333) decorative elements. Text is typically sized 14px Futura at weight 400 with a line height of 1.2. |

## Dos

- Use Absolute Zero (#272727) for all primary text content and main headings.
- Implement Canvas White (#ffffff) as the default background for all cards and page surfaces.
- Apply Ink Wash (#333333) exclusively for filled button backgrounds, paired with Canvas White text.
- Reserve Action Red (#ef6b6b) for borders and text of outlined interactive elements, indicating primary actions or important links.
- Ensure all buttons have a 5px border-radius and use 12px vertical padding.
- Maintain a spacious feel, using 173px for vertical section gaps and 13px for element spacing.
- Utilize Futura (sans-serif) for all headings, navigation, and interactive text, and Times New Roman (serif) for body copy.

## Donts

- Avoid using multiple chromatic colors; limit color accents strictly to Action Red (#ef6b6b).
- Do not use shadows on elements other than buttons or distinct interactive components.
- Refrain from deviating from the established monochromatic palette for backgrounds or primary textual elements.
- Do not apply decorative text styles or weights other than what is specified for Futura and Times New Roman.
- Avoid tight spacing; maintain the generous 173px section gaps and 13px element gaps.
- Do not use generic blue for links; all interactive link text should either be Absolute Zero or Action Red.
- Do not introduce complex gradients; the system relies heavily on solid colors and subtle elevation.

## Transferable Lessons

- Read this source through the lens of Utilitarian: Utilitarian design is not ugly; it is respectful. It removes visual performance so users can complete real work quickly and confidently.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
