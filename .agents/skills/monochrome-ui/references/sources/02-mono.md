# mono - Monochrome UI Source Notes

Source: https://styles.refero.design/style/859f6be7-9d2d-4da6-a9b7-baa658172696
Site: https://mono.frm.fm/en
North star: Architectural grid on white
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, form input fields — a stark, pure white for a clean, expansive feel |
| Ink Black | #292929 | neutral | Primary text, headings, button borders, icons, dividing lines — provides sharp definition against Canvas White. Acts as the primary border and text color for interactive elements |
| Deep Black | #000000 | neutral | Decorative fills (SVGs), input text, and borders — used sparingly for maximum contrast in specific UI elements |

## Typography

#### Typeface 1: NH

- Role: Primary headings and body text. Its subtle negative letter-spacing contributes to the precise, condensed feel.
- Fallback: Helvetica Neue
- Weights: 100, 300, 400
- Sizes: 16px, 18px, 25px, 32px, 40px, 43px
- Line height: 1.20, 1.25, 1.27, 1.34, 1.50
- Letter spacing: -0.0200em

#### Typeface 2: S-Condensed

- Role: Navigation links, metadata, and labels. The pronounced positive letter-spacing creates a distinctive, airy appearance for functional text.
- Fallback: Impact
- Weights: 300, 400, 500
- Sizes: 12px, 14px, 40px
- Line height: 0.90, 1.18, 1.20, 1.34
- Letter spacing: 0.1000em, 0.2000em

#### Typeface 3: EV

- Role: Specialized, extremely light headlines. Its very tight tracking and light weight make it feel almost etched.
- Fallback: Roboto Thin
- Weights: 100
- Sizes: 28px
- Line height: 0.90
- Letter spacing: -0.0500em

#### Typeface 4: S-Works

- Role: Unique, expressive headlines. The moderate weight and normal letter-spacing allow it to stand out against more tracked and condensed fonts.
- Fallback: Bebas Neue Pro
- Weights: 350
- Sizes: 40px
- Line height: 1.34
- Letter spacing: normal

## Layout

The page uses a full-bleed layout, particularly for the main canvas, but frequently employs strong vertical and horizontal dividers to create distinct, modular content blocks. The hero section often features a large, singular product image or graphic, sometimes with overlay text, defining a clear focal point. Content progresses with a mix of stacked, centered headlines and text blocks, alongside two-column layouts where text and visuals alternate. A strong underlying grid is evident, with elements often snapping to these implicit lines. Vertical rhythm is established through consistent spacing, and sections can alternate between pure white and light gray backgrounds for differentiation. Navigation is minimalist, adhering to a fixed top bar on larger screens with simple text links.

## Spacing

- Section gap: 40px
- Element gap: 8px
- Card padding: 20px
- Page max width: not specified
- Radius: {"none":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Outline Button | Primary and secondary actions with minimal visual weight. | Text in Ink Black (#292929) on a transparent background, with a 1px solid Ink Black border and 0px radius. Padding is 0px top/bottom, 20px left/right, giving a wide, flat appearance. |
| Minimal Input Field | Standard text input fields. | Background is Canvas White (#ffffff), text is Deep Black (#000000), with a 1px solid Deep Black border. No border-radius. Padding is 8px top/bottom, 0px left/right, emphasizing vertical alignment. |
| Navigation Link | Top-level navigation items and language selectors. | Utilizes S-Condensed, with specific letter-spacing. Colors are Ink Black (#292929) for text. Often appears with a thin Ink Black border on hover or active state to denote selection. |
| Section Heading | Major content section titles. | Typography from NH family, often at 43px or 40px, with specific letter-spacing -0.0200em. Uses Ink Black (#292929) color. Frequently bordered by Ink Black lines to separate content areas. |

## Dos

- Maintain a clear, high-contrast between Ink Black (#292929) text/lines and Canvas White (#ffffff) backgrounds.
- Utilize 0px border-radius for all interactive elements and containers to maintain the precise, angular aesthetic.
- Apply positive letter-spacing (0.1em or 0.2em) from S-Condensed for navigation, tags, and small labels to distinguish them from body text.
- Use thin (1px) Ink Black (#292929) borders as the primary visual cue for interactive elements and content divisions.
- Structure layouts using visible grid lines or strong horizontal/vertical divisions rather than relying on card elevation or soft shadows.
- Emphasize content hierarchy through variations in font-family, weight, and letter-spacing rather than relying on color or large size differences.
- For buttons, use transparent backgrounds with Ink Black (#292929) text and borders, with 0px vertical padding and 20px horizontal padding.

## Donts

- Avoid using any color other than Ink Black (#292929), Deep Black (#000000), or Canvas White (#ffffff) for primary UI elements.
- Do not introduce rounded corners or soft shadows; all elements should adhere to a sharp, planar aesthetic.
- Do not use generic system fonts for headings or key interface elements; always select from the specified custom typography. 
- Avoid large and complex hero components; opt for minimal, high-contrast textual statements or product visuals on a Canvas White (#ffffff) background.
- Do not use subtle gray text for functional elements; all text, save for contextual accents, should be Ink Black for maximum impact.
- Do not use excessive padding or element gaps; maintain an efficient information density with 8px as a common element gap and 20px for card padding.
- Do not design buttons with solid background fills; all buttons should be ghosted or outlined.

## Transferable Lessons

- Read this source through the lens of Monochrome UI: Monochrome UI succeeds when every shade has a job. The absence of color should make hierarchy sharper, not make the interface vague.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
