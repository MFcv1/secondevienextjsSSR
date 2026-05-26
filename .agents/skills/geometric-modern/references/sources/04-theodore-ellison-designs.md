# Theodore Ellison Designs - Geometric Modern Source Notes

Source: https://styles.refero.design/style/f6bcbb63-2925-4bee-a330-e5e770b94750
Site: https://theodoreellison.com
North star: Warm earth-tones, artisan typography
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Mahogany Wood | #413128 | brand | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Desert Clay | #d6926b | brand | Primary section background, conveying warmth and natural material |
| Forest Moss | #3c4531 | brand | Tertiary section background, a deep, muted green for variety |
| Ocean Slate | #38506c | brand | Accent background, a cool, muted blue-gray |
| Lavender Mist | #afa5b4 | brand | Accent background, a soft, desaturated purple for visual segmentation |
| Charcoal Black | #272729 | neutral | Primary text, general borders, link text |
| Almond Canvas | #fdfcf2 | neutral | Secondary background, ghost button background, footer background, provides a soft, warm white base |
| Stonewash Gray | #cfcfcf | neutral | Filled button background, providing a subtle, muted interactive state |
| Pure White | #ffffff | neutral | Component backgrounds, button text, subtle borders, maintaining a clean contrast |
| Pale Sand | #f2ede1 | neutral | Card backgrounds, section separators, a very light, warm neutral surface |
| Muted Text | #777777 | neutral | Muted helper text, secondary information |

## Typography

#### Typeface 1: ModernEra-Regular

- Role: ModernEra-Regular — detected in extracted data but not described by AI
- Fallback: not specified
- Weights: 400, 500
- Sizes: 16px, 20px, 24px, 26px, 30px, 36px, 40px
- Line height: 1, 1.2, 1.5
- Letter spacing: not specified

#### Typeface 2: ModernEra

- Role: Headlines, main body text components. The varied weights handle hierarchy with a consistent, classic serif feel, preventing overly bold elements.
- Fallback: Playfair Display
- Weights: 400, 500
- Sizes: 16px
- Line height: 1.50
- Letter spacing: normal

#### Typeface 3: ModernEra Mono

- Role: Subheadings, captions, secondary labels, and functional text like navigation. The monospace quality adds a technical, precise counterpoint to the main serif font, with tight tracking enhancing its crispness.
- Fallback: IBM Plex Mono
- Weights: 400
- Sizes: 14px, 16px
- Line height: 1.43, 1.50
- Letter spacing: -0.0070em

## Layout

The page primarily uses a contained layout with some full-bleed sections. The hero section can be full-bleed with a prominent visual that takes up the entire viewport, featuring centered branding. Subsequent sections alternate between full-width color blocks and content blocks limited by an implicit max-width, maintaining comfortable internal padding. Content often arranges in dual-column structures (text-left/image-right or vice versa) or centered stacks. Vertical rhythm is established through generous and consistent section gaps of 180px between major blocks, creating a spacious and unhurried browsing experience. The navigation is a minimal top bar, with prominent branding and subtle ghost buttons on the right.

## Spacing

- Section gap: 180px
- Element gap: 20px
- Card padding: 20px
- Page max width: not specified
- Radius: {"cards":"0px","buttons":"0px","textInputs":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Navigation Button | Primary navigation links and interactive elements within headers/footers. | Text in Charcoal Black (#272729), no background, no border, with 14px padding. Utilizes ModernEra Mono weight 400 for a crisp, functional feel. |
| Outlined Call-to-Action Button | Prominent calls to action, drawing attention through contrast. | Background Almond Canvas (#fdfcf2), text Mahogany Wood (#413128), and a 1px solid Mahogany Wood (#413128) border. Zero border-radius and 14px vertical, 22px horizontal padding. Uses ModernEra weight 400. |
| Filled Neutral Button | Secondary actions or less prominent interactive elements. | Background Stonewash Gray (#cfcfcf), text Pure White (#ffffff). Zero border-radius and 14px vertical, 22px horizontal padding. Uses ModernEra weight 400. |
| Section Divider Card | Modular content blocks that visually separate information. | Background Pale Sand (#f2ede1), with 20px padding. Zero border-radius, no visible border or shadow by default. Content typically centered and structured within this container. |
| Text Input (Outlined) | Form fields for user data entry. | Background Pure White (#ffffff), with a 1px solid Charcoal Black (#272729) border. Zero border-radius, 15px vertical padding and 20px horizontal padding. Uses ModernEra Mono for input text. |

## Dos

- Prioritize a maximalist approach to imagery, letting the visual assets command attention.
- Maintain zero border-radius on all interactive elements and content containers for a sharp, architectural feel.
- Use Almond Canvas (#fdfcf2) as the default background for interactive components to provide a soft contrast.
- Employ the ModernEra Mono font for all secondary and functional text elements, utilizing its tight -0.0070em letter-spacing.
- Structure page sections with distinct background colors like Desert Clay (#d6926b) and Pale Sand (#f2ede1) to create visual rhythm.
- Use Charcoal Black (#272729) for primary text and border outlines to maintain strong contrast and definition.
- Ensure generous top and bottom padding of 180px for major sections to create breathing room and gravitas.

## Donts

- Avoid using drop shadows for elevation; instead, use subtle background color changes or inset shadows for depth.
- Do not introduce rounded corners on any UI elements; the system explicitly uses sharp 0px radii.
- Refrain from using strong, vivid primary colors for backgrounds; the palette relies on muted, earthy tones.
- Do not deviate from the ModernEra and ModernEra Mono font families; there are no other approved typefaces.
- Avoid dense, clustered layouts; content should feel spacious with ample negative space around elements.
- Do not use generic system UI elements; components must reflect the custom, minimalist styling with specific colors and radii.
- Do not apply `normal` letter-spacing to ModernEra Mono font; it should always carry the defined negative tracking.

## Transferable Lessons

- Read this source through the lens of Geometric Modern: Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
