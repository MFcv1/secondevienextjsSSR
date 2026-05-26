# True Staging - High-End Design Source Notes

Source: https://styles.refero.design/style/c26c462d-f219-4814-96da-c05e86f759b7
Site: https://www.truestaging.co.uk
North star: Architectural blueprint on aged parchment
Theme: dark

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Blueprint Canvas | #111111 | neutral | Page background, primary dark text, subtle borders — grounds the design in a deep, almost charcoal base |
| Parchment White | #f5efeb | neutral | Primary light text, ghost button borders, accents within a darker canvas — suggests a tactile, natural paper texture |
| Amber Peach | #f1b497 | brand | Orange outline accent for tags, dividers, and focused UI edges. Do not promote it to the primary CTA color |

## Typography

#### Typeface 1: Roslindale

- Role: Expressive display headings — its delicate weight and generous size at 158px create an authoritative, almost monumental statement of luxury.
- Fallback: Playfair Display
- Weights: 300
- Sizes: 158px
- Line height: 1.00
- Letter spacing: -0.0200em

#### Typeface 2: Alliance

- Role: Functional text including body, navigation, and button labels — its versatility across weights and compact letter spacing ensures clear information delivery.
- Fallback: Inter
- Weights: 400, 500, 600
- Sizes: 9px, 12px, 14px, 28px
- Line height: 1.00, 1.15, 1.20, 1.30, 1.50, 1.71
- Letter spacing: -0.0200em, 0.0200em, 0.0230em, 0.0600em, 0.1000em

## Layout

The page employs a full-bleed layout, particularly for the hero section, which features a large, centered headline over an architectural graphic background. Content is centrally aligned within this wide canvas, using large, negative space. The header features right-aligned navigation items, subtly outlined. Subsequent content sections appear to follow a consistent vertical rhythm, though specific sectioning is less explicit than a banded approach; instead, it relies on visual weight and typography.

## Spacing

- Section gap: 53px
- Element gap: 8px
- Card padding: 21px
- Page max width: not specified
- Radius: {"buttons":"80px","otherElements":"80px","navigationItems":"80px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Hero Headline | Primary page title | Uses Roslindale at 158px, weight 300, with a letter-spacing of -0.0200em, in Parchment White (#f5efeb). Placed centrally, defining the page's grand statement. |
| Ghost Navigation Item | Secondary navigation and non-primary actions | Text in Alliance, Parchment White (#f5efeb), 9px, weight 400. Has a 1px border in Parchment White (#f5efeb) with an 80px border-radius, creating a pill shape. Padding is 7.7px vertical and 21px horizontal. Transparent background. |
| Primary Action Button | Call to action button for 'Our Work' | Filled with Amber Peach (#f1b497) background. Text is Alliance, Parchment White (#f5efeb), 9px, weight 400. Features an 80px border-radius. Padding is 7.7px vertical and 21px horizontal. Appears as a pill-shaped element. |
| Body Text | Standard informative text | Uses Alliance, Blueprint Canvas (#111111) or Parchment White (#f5efeb) depending on section background, at 14px, weight 400. Tight letter spacing for efficient reading. |
| Footer Detail Text | Copyright and minor informational text | Alliance, 9px, weight 400, in Parchment White (#f5efeb). |

## Dos

- Always use Blueprint Canvas (#111111) for page backgrounds and primary dark text.
- Apply Parchment White (#f5efeb) for primary light text on dark backgrounds and for ghost button borders.
- Reserve Amber Peach (#f1b497) for key accents, selected navigation highlights, and the primary 'Our Work' button fill.
- Employ Roslindale (sub: Playfair Display) for large, expressive headlines (158px, weight 300, ls -0.0200em) to convey gravitas.
- Utilize Alliance (sub: Inter) for all functional text, varying weights (400, 500, 600) and sizes (9px, 12px, 14px) as needed for hierarchy.
- Implement an 80px border-radius for all interactive elements like buttons and navigation items to maintain a consistent soft, pill-like shape.
- Maintain a compact spacing density, with an element gap of 8px and section vertical spacing of 53px.

## Donts

- Do not introduce bright, vibrant colors; maintain the muted, earthy palette of Blueprint Canvas, Parchment White, and Amber Peach.
- Avoid sharp, angular corners; consistently apply the 80px border-radius for all applicable UI elements.
- Do not use generic system fonts for display headings; Roslindale's unique character is central to the brand's sophisticated feel.
- Avoid excessive use of elevation or heavy shadows; the system relies on subtle borders and color shifts for separation.
- Do not deviate from the defined letter-spacing values for Alliance; precise tracking is essential for its compact appearance.
- Do not use Parchment White (#f5efeb) on amber backgrounds due to insufficient contrast (1.6:1 ratio).
- Avoid making any element overtly 'loud'; the design emphasizes understated luxury through subtle contrasts and refined details.

## Transferable Lessons

- Read this source through the lens of High-End Design: High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
