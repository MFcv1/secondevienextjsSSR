# BMW.com - High-End Design Source Notes

Source: https://styles.refero.design/style/b8899cbd-e2ca-4069-83cf-d8f8b0d71100
Site: https://bmw.com
North star: Precision-engineered monochrome luxury; every detail is intentional, nothing is superfluous.
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Obsidian | #262626 | neutral | Primary text, interactive elements, navigation links, button text — forms the core dark against light contrast. |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, prominent navigational elements — establishes the primary visual canvas. |
| Graphite Grey | #bbbbbb | neutral | Secondary navigation text, subtle borders, contextual information — provides sufficient contrast on dark surfaces while appearing subdued on light ones. |
| Frost | #f1f1f1 | neutral | Subtle background accents, dividers — provides a very light contrast against Canvas White. |
| Deep Space | #262626 | neutral | Footer background — anchors the page with a solid, dark foundation. |
| Electric Blue | #1c69d4 | accent | Interactive highlights, focus states — a vibrant, technical accent for user interaction. |

## Typography

#### Typeface 1: BMWTypeNextLatin

- Role: Body text, navigation, interactive elements, button labels, and general UI text. Its precise forms reflect the brand's engineering heritage, ensuring clarity across all contexts.
- Fallback: Open Sans
- Weights: 400, 700, 900
- Sizes: 16px, 18px
- Line height: 1.15, 1.20, 1.30, 1.60, 1.63
- Letter spacing: normal

#### Typeface 2: BMWTypeNextLatin Light

- Role: Primary display headlines; the light weight at large sizes conveys authority through refinement rather than aggression, creating a sophisticated brand voice. It's unexpected at this scale, establishing an elegant, high-impact presence.
- Fallback: Open Sans Light
- Weights: 300
- Sizes: 60px
- Line height: 1.30
- Letter spacing: normal

## Layout

The page structure is primarily max-width contained, but hero sections often utilize full-bleed photography. The main content areas tend to be centered. The hero uses a background image with text overlay, establishing an immediate brand impression. Section rhythm is clear, using a dominant white background for content with a distinct, dark footer (#262626) that grounds the page. Content is arranged in a fluid, stacked manner, often with large images followed by textual information, leading to multi-column layouts within the footer. The density is spacious, with significant white space around content, allowing elements to breathe. Navigation consists of a sticky top bar with branding and primary links, along with a comprehensive multi-column footer.

## Spacing

- Section gap: 40px
- Element gap: 8px
- Card padding: 16px
- Page max width: not specified
- Radius: {"buttons":"0px","default":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| CTA Link Button — 'Find your BMW' |  | <div style="--color-obsidian:#262626;--color-canvas-white:#ffffff;--color-graphite-grey:#bbbbbb;--color-frost:#f1f1f1;--color-deep-space:#262626;--color-electric-blue:#1c69d4;--font-bmwtypenextlatin:'Open Sans',sans-serif;--font-bmwtypenextlatin-light:'Open Sans',sans-serif;--spacing-4:4px;--spacing-8:8px;--spacing-12:12px;--spacing-16:16px;--spacing-20:20px;--spacing-24:24px;--spacing-40:40px;--spacing-56:56px;--spacing-100:100px; background:var(--color-canvas-white);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--spacing-56) var(--spacing-40);font-family:var(--font-bmwtypenextlatin);width:600px;box-sizing:border-box;"><h1 style="font-family:var(--font-bmwtypenextlatin-light);font-weight:300;font-size:60px;line-height:1.3;color:var(--color-obsidian);margin:0 0 var(--spacing-24) 0;text-align:center;letter-spacing:normal;text-transform:uppercase;">ALL BMW MODELS</h1><a href="#" style="display:inline-flex;align-items:center;gap:var(--spacing-8);font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-obsidian);text-decoration:none;border:none;background:none;padding:0 var(--spacing-12);border-radius:0;line-height:1.63;cursor:pointer;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;"><path d="M4.5 1.5L10.5 7L4.5 12.5" stroke="#262626" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>Find your BMW</a></div> |
| Language Selector Bar |  | <div style="--color-obsidian:#262626;--color-canvas-white:#ffffff;--color-graphite-grey:#bbbbbb;--color-frost:#f1f1f1;--color-deep-space:#262626;--color-electric-blue:#1c69d4;--font-bmwtypenextlatin:'Open Sans',sans-serif;--spacing-16:16px;--spacing-20:20px;--spacing-24:24px;--spacing-40:40px; background:var(--color-deep-space);padding:var(--spacing-24) var(--spacing-40);font-family:var(--font-bmwtypenextlatin);width:600px;box-sizing:border-box;"><div style="display:flex;flex-wrap:wrap;gap:var(--spacing-16);align-items:center;"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">English</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">Deutsch</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">Italiano</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">Français</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">Español</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">日本語</a></div></div> |
| Footer Link Columns |  | <div style="--color-obsidian:#262626;--color-canvas-white:#ffffff;--color-graphite-grey:#bbbbbb;--color-frost:#f1f1f1;--color-deep-space:#262626;--color-electric-blue:#1c69d4;--font-bmwtypenextlatin:'Open Sans',sans-serif;--spacing-4:4px;--spacing-8:8px;--spacing-12:12px;--spacing-16:16px;--spacing-20:20px;--spacing-24:24px;--spacing-40:40px;--spacing-56:56px; background:var(--color-deep-space);padding:var(--spacing-40);font-family:var(--font-bmwtypenextlatin);width:600px;box-sizing:border-box;"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--spacing-40);"><div><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);margin:0 0 var(--spacing-16) 0;line-height:1.63;padding-bottom:var(--spacing-8);border-bottom:1px solid #444;">Quick Links</p><div style="display:flex;flex-direction:column;gap:var(--spacing-8);"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Home</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW in your country</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Group Careers</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">REACH Regulation</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Compatibility Check</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Parking Test Car</a></div></div><div><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);margin:0 0 var(--spacing-16) 0;line-height:1.63;padding-bottom:var(--spacing-8);border-bottom:1px solid #444;">More BMW Websites</p><div style="display:flex;flex-direction:column;gap:var(--spacing-8);"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW M</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW M Motorsport</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Golfsport</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Welt</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Group Classic</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Group</a></div></div><div><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);margin:0 0 var(--spacing-16) 0;line-height:1.63;padding-bottom:var(--spacing-8);border-bottom:1px solid #444;">BMW.com</p><div style="display:flex;flex-direction:column;gap:var(--spacing-8);"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Contact</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Cookies</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Imprint</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Legal Notice / Data protection</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Accessibility</a></div></div></div><div style="margin-top:var(--spacing-40);border-top:1px solid #444;padding-top:var(--spacing-20);"><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);margin:0;line-height:1.63;">© BMW AG 2026</p></div></div> |
| Text Link Button | Primary Call to Action | Ghost-style button with no background, Obsidian text (#262626), zero border radius, and minimal horizontal padding (12px). Emphasizes action through text rather than a contained shape. |
| Navigation Link | Primary Navigation | Text in Obsidian (#262626) by default, switching to Graphite Grey (#bbbbbb) in the footer. Line height of 1.63 and zero padding, relying on surrounding layout for spacing, with zero border radius. |
| Heading Text Badge | Section Labels | Descriptive text in Obsidian (#262626) with no background or borders, often used to introduce sections or categories with zero padding and border radius. |

## Dos

- Prioritize BMWTypeNextLatin for all text elements to maintain brand consistency.
- Use Canvas White (#ffffff) as the dominant background color for main content areas.
- Apply Obsidian (#262626) for primary text and interactive elements to ensure high contrast.
- Utilize BMWTypeNextLatin Light weight 300 at 60px for prominent headings to create an impactful yet refined statement.
- Maintain zero border-radius on all components to preserve the precise, angular aesthetic.
- Employ Electric Blue (#1c69d4) sparingly for interactive highlights and focus states, ensuring it stands out against the monochrome palette.

## Donts

- Avoid using saturated or chromatic colors outside of the designated Electric Blue accent.
- Do not introduce rounded corners or soft shapes, as the aesthetic is defined by sharp precision.
- Refrain from heavy shadows or overt elevation a primary means of drawing attention; rely on typography and strong contrast.
- Do not deviate from the BMWTypeNextLatin font family; consistency is key to the brand's visual identity.
- Avoid excessive padding around interactive textual elements like links; use 0-12px as seen in button examples.

## Transferable Lessons

- Read this source through the lens of High-End Design: High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
