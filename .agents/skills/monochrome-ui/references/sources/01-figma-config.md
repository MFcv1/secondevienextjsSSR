# Figma Config - Monochrome UI Source Notes

Source: https://styles.refero.design/style/8caa5004-a8cc-4c7e-a2bb-00ff60618729
Site: https://config.figma.com/events/figma-config-2022
North star: monochrome command console
Theme: dark

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Void | #000000 | neutral | Page background, primary text on light surfaces, button backgrounds for primary actions |
| Ghost White | #e2e2e2 | neutral | Primary text on dark backgrounds, ghost button borders, navigation links |
| Shadow Charcoal | #3d3d3d | neutral | Subtle button borders, secondary dividers |
| Polar Mist | #ffffff | neutral | Background for lighter surfaces, such as cookie consent dialogs, secondary text color on dark backgrounds |

## Typography

#### Typeface 1: figmaSans

- Role: Primary brand typeface for all headlines, body text, and interactive elements. Its specific letter-spacing creates a compact, intentional appearance, especially noticeable on larger headings.
- Fallback: Inter
- Weights: 400
- Sizes: 16px, 18px, 20px, 32px, 80px
- Line height: 0.95, 1.00, 1.10, 1.25, 1.30
- Letter spacing: -0.0300em at large sizes, -0.0200em at medium sizes

#### Typeface 2: figmaMono

- Role: Monospaced typeface for code snippets or technical details, offering a distinct visual break from the primary typeface while maintaining legibility.
- Fallback: Menlo
- Weights: 400
- Sizes: 16px
- Line height: 1.30
- Letter spacing: normal

## Layout

The page maintains a full-bleed dark background, with content neatly centered or aligned to the left. The hero section features a prominent headline centered over the dark background. Sections generally use consistent vertical spacing, often indicated by the 40px section gap. Content arrangement appears to be stacked vertically, with some areas allowing for asymmetric or interleaved visual elements like the abstract shapes. The navigation is a minimal, right-aligned header bar that stays fixed at the top, offering essential links.

## Spacing

- Section gap: 40px
- Element gap: 12px
- Card padding: 12px
- Page max width: not specified
- Radius: {"buttons":"0px","navPills":"50%"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Filled Button | Main call-to-action on dark backgrounds. | Solid Midnight Void background, Ghost White text. Padding 12px horizontal and vertical. Square corners (0px radius). Example: 'ALLOW ALL COOKIES'. |
| Ghost Button | Secondary action or navigable link that appears as a button. | Transparent background, Ghost White text and 1px border. No padding specified, acts as a text link with button styling. Example: 'GO TO HOMEPAGE'. |
| Cookie Consent Button | Button within the cookie consent dialog. | Solid Midnight Void background with Ghost White text and a subtle 1px border of `rgba(255, 255, 255, 0.24)`. Rounded with 50% border radius. No explicit padding data, likely derived from text size. |
| Navigation Link | Top-level navigation items. | Ghost White text, with a 1px border of Midnight Void. Compact padding of 4-6px vertical and 6-12px horizontal. Renders as text only with a subtle underline effect on hover (not present in current data). |
| Cookie Consent Panel | Floating informational message. | Polar Mist background with Midnight Void text for primary content. Elements within use Shadow Charcoal borders. Padding is not explicit but appears generous. Square corners (0px radius). |

## Dos

- Use Midnight Void (#000000) as the dominant background color for all main canvas areas.
- Apply FigmaSans for all text elements, setting letter-spacing to -0.0300em for display text (80px, 32px) and -0.0200em for smaller headings and body text.
- Form primary interactive buttons with a Midnight Void (#000000) background and Ghost White (#e2e2e2) text, using 0px border-radius.
- For ghost buttons or secondary actions, use Ghost White (#e2e2e2) for both text and a 1px border, maintaining a transparent background.
- Utilize the 4-6px vertical padding and 6-12px horizontal padding for navigation and compact interactive elements.
- Maintain a primary text color of Ghost White (#e2e2e2) against dark backgrounds and Midnight Void (#000000) against light backgrounds.
- Apply 1px borders using Midnight Void or Shadow Charcoal (#3d3d3d) for subtle division and emphasis.

## Donts

- Avoid using gradients; the system relies on flat colors for a stark, impactful appearance.
- Do not introduce intermediate grey tones between Midnight Void (#000000) and Ghost White (#e2e2e2) without a clear functional purpose, as the system favors high contrast.
- Do not use highly saturated colors for large surface areas; color is reserved for functional accents or semantic states.
- Do not use generic system fonts; stick to figmaSans or figmaMono for all typographic elements.
- Avoid soft, rounded corners for main interactive elements (buttons, cards); prefer sharp, square edges unless specifically for small pill-shaped accents.
- Do not use drop shadows for elevation; rely on color contrast and borders to define hierarchy and interactive states.

## Transferable Lessons

- Read this source through the lens of Monochrome UI: Monochrome UI succeeds when every shade has a job. The absence of color should make hierarchy sharper, not make the interface vague.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
