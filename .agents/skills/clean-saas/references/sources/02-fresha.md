# Fresha - Clean SaaS Source Notes

Source: https://styles.refero.design/style/066625ba-0d8d-472e-8240-4026ed7bb94e
Site: https://www.fresha.com
North star: Luminous radial gradient
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Ink | #0d0d0d | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Canvas White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |
| Cloud Gray | #f2f2f2 | neutral | Secondary card backgrounds, subtle section dividers — provides a gentle visual separation from the main canvas |
| Muted Stone | #767676 | neutral | Muted body text, secondary descriptions, helper text — balances readability with less emphasis than primary text |
| Silver Mist | #d3d3d3 | neutral | Divider lines, subtle input borders, inactive elements — provides a delicate structural definition |
| Mercury Stroke | #e5e5e5 | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |
| Sunset Gold | #ffc00a | accent | Yellow decorative accent for icons, marks, and small graphic details. Do not promote it to the primary CTA color |
| Violet Impulse | #6950f3 | brand | Outlined action buttons, active link states, small functional icons — signals interactivity and importance with a distinct, vivid hue |
| Self-Care Glow | #ef6997 | accent | Hero background gradient start — an inviting, soft, and vibrant backdrop to the primary service offering |

## Typography

#### Typeface 1: RoobertPRO

- Role: All textual content — its geometric clarity provides a modern, functional voice across headings, body text, and interactive elements. The variety of weights supports a clear typographic hierarchy.
- Fallback: Inter
- Weights: 400, 500, 600, 700
- Sizes: 15px, 16px, 17px, 20px, 24px, 28px, 40px, 64px, 96px
- Line height: 1.00, 1.06, 1.10, 1.15, 1.17, 1.20, 1.29, 1.33, 1.40, 1.41
- Letter spacing: normal

## Layout

The page uses a maximum-width contained layout, with a prominent full-width hero section that features a radial gradient background and a centered headline. Content sections below the hero alternate between full-width blocks (like the 'Download the app' section) and multi-column grids for recommended services. Vertical spacing between logical sections is consistently 24px. The main navigation is a sticky top bar, providing persistent access. Content is generally grouped into compact, repeating cards, creating an information-dense yet scannable layout.

## Spacing

- Section gap: 24px
- Element gap: 8px
- Card padding: 32px
- Page max width: not specified
- Radius: {"tags":"999px","cards":"8px","inputs":"999px","buttons":"999px","default":"8px","largeCards":"12px","smallElements":"4px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link | Main navigation and utility links in header/footer. | Text in Midnight Ink (#0d0d0d) at 16px RoobertPRO weight 400. Hover/active states use Violet Impulse (#6950f3) text color or a bottom border of E5E5E5. |
| Primary Search Input | Main search bar for services and locations. | Full-width field with text set at 16px RoobertPRO weight 400 in Midnight Ink (#0d0d0d). Uses a 999px border-radius, a thin 1px border of Silver Mist (#d3d3d3) and 2px of horizontal padding. |
| Search Button | Dedicated action button for initiating a search. | Filled background in Midnight Ink (#0d0d0d) with Canvas White (#ffffff) text at 16px RoobertPRO weight 400. Has a 999px border-radius and 12px vertical padding. |
| Ghost Header Button | Secondary action button in the header, e.g., 'Log in' or 'Menu'. | Transparent background with Midnight Ink (#0d0d0d) text at 16px RoobertPRO weight 400. Uses a 999px border-radius and minimal padding (0px). |
| Outlined Call to Action Button | Prominent, interactive buttons that suggest a primary action, like 'Get the app'. | Transparent background, Violet Impulse (#6950f3) text and 1px border. Uses 999px border-radius and 12px vertical padding where visible. |
| Product Thumbnail Card | Display individual service providers with imagery and condensed info. | Transparent background with 12px border-radius. Contains an image with an 8px border-radius. Titles are in Midnight Ink (#0d0d0d) and descriptions in Muted Stone (#767676). |
| Information Card | Standalone informational blocks or larger content groupings. | Cloud Gray (#f2f2f2) background with 8px border-radius. Features generous 32px padding on all sides. Text is in Midnight Ink (#0d0d0d) for headings and Muted Stone (#767676) for body content. |

## Dos

- Use Midnight Ink (#0d0d0d) for all primary text and main headings to ensure strong contrast and readability.
- Apply Canvas White (#ffffff) as the default page background and for filled interactive elements.
- Reserve Violet Impulse (#6950f3) for outlined call-to-action buttons and active link states.
- Utilize Cloud Gray (#f2f2f2) for secondary content cards and subtle background variations in sections.
- Implement a 999px border-radius for all primary buttons, search inputs, and navigational elements to maintain a uniformly rounded aesthetic.
- Ensure all textual content uses the RoobertPRO font family in appropriate weights for hierarchy.
- Maintain a clear elementGap of 8px between discrete UI elements for consistent visual rhythm.

## Donts

- Avoid using Sunset Gold (#ffc00a) as an interaction color; it is reserved for decorative accents and ratings.
- Do not introduce sharp corners; all significant UI containers and interactive elements should use 8px, 12px, or 999px border-radii.
- Do not use dark backgrounds for main content sections; the system is designed around a light theme with bright surfaces.
- Avoid excessive shadow usage; rely on distinct background colors and minimal borders for element separation.
- Do not use decorative gradients on functional UI components; stick to solid colors for clarity.
- Refrain from altering the letter-spacing of RoobertPRO text; maintain 'normal' tracking for all content.
- Do not use more than two levels of text color in a single component to avoid visual clutter; primarily use Midnight Ink (#0d0d0d) and Muted Stone (#767676).

## Transferable Lessons

- Read this source through the lens of Clean SaaS: Clean SaaS design is not blank minimalism. It is a discipline of making product value obvious, repeated workflows effortless, and trust signals quiet but visible.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
