# AutoSend - Clean SaaS Source Notes

Source: https://styles.refero.design/style/3d6eda0c-16ab-4e7e-aca6-5f9a5432bfd1
Site: https://autosend.com
North star: Crisp White Canvas
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Ink | #292524 | neutral | Primary text, strong headings, prominent icons, dark borders |
| Paper | #fafaf9 | neutral | Page background, button backgrounds |
| Whisper | #e7e5e4 | neutral | Subtle borders, dividers, secondary backgrounds |
| Snow | #ffffff | neutral | Card backgrounds, elevated surfaces, button text on colored backgrounds |
| Graphite | #79716b | neutral | Secondary text, muted links, subtle icons, placeholder text |
| Stone | #a6a09b | neutral | Tertiary text, decorative strokes, very light borders |
| Ebony | #0c0a09 | neutral | Deepest text, high-contrast borders |
| Violet Action | #615fff | brand | Primary call-to-action background, active states, key interactive indicators |
| Violet Accent | #4f39f6 | brand | Outlined button borders, decorative strokes and accents, links requiring emphasis |
| Sunset Orange | #d97757 | accent | Decorative card borders, subtle highlights, specific data points |
| Emerald Green | #5ea500 | accent | Green outline accent for tags, dividers, and focused UI edges. Use as a supporting accent, not as a status color |
| Alert Red | #ff0000 | accent | Red accent for outlined action borders, linked labels, and lightweight interactive emphasis. Use as a supporting accent, not as a status color |
| Ocean Teal | #22b8cd | accent | Informational highlights, secondary data points, decorative icons |
| Sky Blue | #007ebb | accent | Informational links, decorative borders, specific icon states |

## Typography

#### Typeface 1: Geist

- Role: Primary UI text for body copy, navigation, buttons, and most headings — the core workhorse sans-serif for readability and clean modern feel.
- Fallback: Inter
- Weights: 400, 600
- Sizes: 12px, 14px, 16px, 18px, 20px, 40px
- Line height: 1.20, 1.33, 1.38, 1.43, 1.50, 1.56
- Letter spacing: normal

#### Typeface 2: Geist Mono

- Role: Monospaced text for code blocks, tags, and data points where precise alignment and character distinction are important.
- Fallback: JetBrains Mono
- Weights: 400, 500, 600
- Sizes: 12px, 13px, 14px, 16px
- Line height: 1.00, 1.14, 1.33, 1.43, 1.50, 1.54
- Letter spacing: 0.0400em for smaller sizes, 0.1000em for emphasized labels.

#### Typeface 3: cooperLtBT

- Role: Display font used for prominent page titles and hero headlines, adding a touch of classic sophistication and distinctiveness.
- Fallback: serif font like Playfair Display
- Weights: 400
- Sizes: 18px, 80px
- Line height: 1.10, 1.33
- Letter spacing: normal

#### Typeface 4: dataType

- Role: Specialized font for specific body text sections, offering unique character for product descriptions or callouts.
- Fallback: Montserrat
- Weights: 400
- Sizes: 24px
- Line height: 1.33
- Letter spacing: normal

#### Typeface 5: ui-sans-serif

- Role: Fallback sans-serif for general text, ensuring readability across all platforms if custom fonts fail to load.
- Fallback: system-ui
- Weights: 400
- Sizes: 16px
- Line height: 1.50
- Letter spacing: normal

## Layout

The layout is primarily a max-width contained design at 1200px, centered on the page. The hero section is a full-width dark background visually extending beyond the content area, featuring a large, centered headline and subtext with stacked call-to-action buttons. Sections below maintain a consistent vertical rhythm with 80px gaps, often featuring two-column layouts that alternate between text-left/image-right compositions. Content is presented in clean, well-defined blocks and card grids for features and data points. Navigation is a sticky top bar with a logo, text links, and two prominent buttons. The overall density suggests a comfortable reading experience with ample breathing room.

## Spacing

- Section gap: 80px
- Element gap: 24px
- Card padding: 16px
- Page max width: 1200px
- Radius: {"tags":"12px","cards":"16px","buttons":"8px","interactiveElements":"8px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Filled Button | Primary call-to-action button. | Filled with Violet Action (#615fff), text in Snow (#ffffff). 8px border radius, 8px vertical padding, 24px horizontal padding. Uses Geist font at 16px, weight 600. |
| Ghost Button | Secondary action button. | Transparent background with Ink (#292524) text and a 1px Ink (#292524) border. 8px border radius, 8px vertical padding, 24px horizontal padding. Uses Geist font at 16px, weight 400. |
| Text Button | Minimal interactive element, inline actions. | No background or border. Text in Ink (#292524) or Graphite (#79716b). 4px vertical padding, 16px horizontal padding. Uses Geist font at 14px, weight 400. |
| Feature Card | Content container for features or articles with subtle elevation. | Snow (#ffffff) background, 16px border radius. Uses a subtle shadow: rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px. Padding varies depending on content, but typically 16px. |
| Minimal Card | Flat content container without elevation. | Paper (#fafaf9) background, 16px border radius, no shadow. 16px top and bottom padding, 12px horizontal padding. Often used for grouped information or statistical displays. |
| Input Field | Standard text input field. | White background, with a 1px Whisper (#e7e5e4) border. Input text in Ink (#292524), placeholder text in Graphite (#79716b). 8px border radius. 8px vertical padding, 12px horizontal padding for contained input fields. |
| Navigation Link | Primary site navigation items. | Ink (#292524) text, Geist font, 16px, weight 400. Hover state with a subtle underline or color change to Graphite (#79716b). Minimum 8px padding around text. |
| Badge | Small, informative labels or tags. | Paper (#fafaf9) background, Ink (#292524) text, 12px border radius. 6px vertical padding, 16px horizontal padding. Uses Geist Mono font, 12px, weight 400. |

## Dos

- Prioritize Geist for all marketing and UI text, reserving cooperLtBT exclusively for hero headlines and prominent display text.
- Use Paper (#fafaf9) for main page backgrounds and Snow (#ffffff) for card and elevated surfaces to establish surface hierarchy.
- Apply Violet Action (#615fff) strictly to primary call-to-actions, ensuring it consistently signals interactivity and importance.
- Maintain a clear visual rhythm with section gaps of 80px and elemental gaps of 24px.
- Use 8px border-radius for all interactive elements like buttons and input fields, and 16px for larger content cards.
- For subtle depth, apply the card shadow (rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px) sparingly, primarily on content cards.
- Utilize Geist Mono for all code snippets, data labels, and elements requiring monospace alignment, applying 0.04em or 0.10em letter-spacing as appropriate for emphasis.

## Donts

- Avoid using saturated accent colors other than Violet Action (#615fff) for primary button backgrounds; these are reserved for borders, icons, or specific highlights.
- Do not deviate from the defined border radii; mixing different radius values will disrupt the systematic feel.
- Refrain from introducing new shadow styles; rely solely on the specified card shadow for elevation.
- Do not use generic system fonts for headings or body text, as Geist and cooperLtBT define the brand's typographic identity.
- Avoid excessive use of borders; many components rely on background color differences or subtle shadows for separation.
- Do not use the neutral colors with chromatic names like 'Twilight Indigo' when creating new color tokens; stick to neutral descriptions.
- Do not apply letter-spacing to regular body text set in Geist; it should remain 'normal' for optimal readability.

## Transferable Lessons

- Read this source through the lens of Clean SaaS: Clean SaaS design is not blank minimalism. It is a discipline of making product value obvious, repeated workflows effortless, and trust signals quiet but visible.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
