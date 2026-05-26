# Volume - Editorial Type Source Notes

Source: https://styles.refero.design/style/edc0c03e-8c20-4e22-badd-2735fcb9f4a8
Site: https://vol.co
North star: Editorial archive, high contrast.
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, input fields, primary surface for content |
| Ink Black | #272727 | neutral | Primary text, headings, navigation links, dark surface backgrounds |
| Ash Gray | #717171 | neutral | Muted text, secondary information, borders for form elements |
| Stone Button | #949494 | neutral | Default button background, subtle accent |
| Obsidian Pill | #000000 | neutral | Deep canvas for dark sections, primary dark surfaces, and high-contrast framing |
| Whisper Text | #cdcccc | neutral | Placeholder text in dark input fields |
| Crimson Pill | #962921 | accent | Red wash for highlight backgrounds, decorative bands, and soft emphasis behind content |
| Scarlet Pill | #c52910 | accent | Orange wash for highlight backgrounds, decorative bands, and soft emphasis behind content |
| Blaze Pill | #e75a00 | accent | Orange wash for highlight backgrounds, decorative bands, and soft emphasis behind content |

## Typography

#### Typeface 1: Messina Sans

- Role: The primary typeface for all text. Its lightness (300) for large headlines creates a refined, understated impact, while the moderate spacing (0.0700em) in smaller sizes ensures legibility and a classic, almost monospaced editorial feel.
- Fallback: system-ui, sans-serif
- Weights: 300, 350
- Sizes: 14px, 18px, 20px, 32px, 50px, 80px
- Line height: 1.00, 1.18, 1.40, 2.00
- Letter spacing: -0.0200em at 50px, 0.0700em at 14px

## Layout

The page layout utilizes a max-width contained model (1400px) with content sections centered. The hero sections are full-bleed with large background images and overlaid text, establishing a strong visual anchor. The section rhythm appears to be based on distinct content blocks, some with dark backgrounds and light text, others following the primary light theme. Content often alternates between large imagery and text blocks, suggesting a journalistic or editorial spread. There's no evident grid for cards, which seem to be presented in sequential blocks rather than uniform columns. Navigation is a minimalist top bar, sticky or otherwise. The density is comfortable, providing sufficient breathing room around key content.

## Spacing

- Section gap: 45px
- Element gap: 10px
- Card padding: 30px
- Page max width: 1400px
- Radius: {"cards":"0px","pills":"50px","inputs":"0px","buttons":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Filled Button | Primary action button for sign-ups or confirmations. | Solid 'Stone Button' (#949494) background, 'Canvas White' (#ffffff) text, with sharp 0px corners and generous vertical padding (18.75px top/bottom). |
| Default Card | Container for products, articles, or featured content. | Transparent background with 0px border-radius, relying on imagery for visual separation. No explicit padding, content often full-bleed to card edges. |
| Funding Status Pill (Obsidian) | Small, rounded label indicating successful funding or status. | Dark 'Obsidian Pill' (#000000) background with 50px border-radius, 'Canvas White' (#ffffff) text. Padding is 7.5px vertical, 12px horizontal. |
| Funding Status Pill (Crimson) | Small, rounded label indicating specific campaign status. | Dark red 'Crimson Pill' (#962921) background with 50px border-radius, 'Canvas White' (#ffffff) text. Padding is 7.5px vertical, 12px horizontal. |
| Funding Status Pill (Scarlet) | Small, rounded label indicating urgent campaign status. | Bright red 'Scarlet Pill' (#c52910) background with 50px border-radius, 'Canvas White' (#ffffff) text. Padding is 7.5px vertical, 12px horizontal. |
| Funding Status Pill (Blaze) | Small, rounded label indicating high visibility campaign status (e.g. sold out). | Orange 'Blaze Pill' (#e75a00) background with 50px border-radius, 'Canvas White' (#ffffff) text. Padding is 7.5px vertical, 12px horizontal. |
| Light Input Field | Standard input field for light backgrounds. | Background is 'Canvas White' (#ffffff), text 'Ink Black' (#272727). Features a 1px solid 'Ash Gray' (#717171) bottom border and 0px border-radius. Padding is 12.5px vertical, 16.6667px horizontal. |
| Dark Input Field | Standard input field for dark backgrounds. | Background is 'Ink Black' (#272727), text 'Whisper Text' (#cdcccc). Features a 1px solid 'Ash Gray' (#717171) bottom border and 0px border-radius. Minimal vertical padding, 13.0435px horizontal. |

## Dos

- Use 'Ink Black' (#272727) for all primary body and heading text for high contrast on light backgrounds.
- Apply Messina Sans weight 300 for display and large headings, and weight 350 for body text and navigation to maintain an editorial tone.
- Structure layouts with a maximum width of 1400px and ensure content is centered within this constraint.
- Employ 0px border-radius for main containers, buttons, and input fields to sustain a sharp, modern aesthetic, reserving 50px for small status pills.
- Utilize 'Canvas White' (#ffffff) as the dominant page and card background color to provide a clean reading experience.
- Maintain a comfortable element spacing of 10px between interactive items and form elements.
- Use distinct accent colors for 'Funding Status Pills' to immediately convey status or category, differentiating them from the main content.

## Donts

- Avoid using decorative shadows or excessive gradients; keep surfaces flat and defined by solid colors or subtle borders.
- Do not introduce additional typefaces; Messina Sans is the sole typographic voice of the brand.
- Do not use highly saturated colors for large UI elements; confine chromatic accents to small, functional components like status pills.
- Refrain from altering the established 0px border-radius on major components, as this is a core aspect of the brand's sharp visual identity.
- Do not deviate from the high-contrast color pairings for text and backgrounds to preserve readability.
- Avoid arbitrary uses of spacing; adhere to the 10px element gap and 30px card padding for consistent rhythm.
- Do not apply `0.0700em` letter-spacing to large headlines; it is specifically for smaller text to enhance legibility.

## Transferable Lessons

- Read this source through the lens of Editorial Type: Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
