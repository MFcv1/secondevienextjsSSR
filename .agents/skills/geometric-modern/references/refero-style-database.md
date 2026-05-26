---
name: geometric-modern
description: Use this skill to create modern geometric identities with strong grids, repeated shapes, modular composition, crisp rhythm, precise spacing, and layout systems where geometry explains the brand.
---

# Geometric Modern Design Skill

## 1. Source Basis

This skill consolidates five Refero references for the "Geometric Modern" suggested category.

| Reference | Refero Source | Site | North Star |
| --- | --- | --- | --- |
| Greenspace | https://styles.refero.design/style/d961e174-875b-46ef-ad27-fe7f8e3bcd8c | https://thegreenspace.com | Monumental monochrome canvas |
| Artem Militonian | https://styles.refero.design/style/c1749391-de9f-4500-a838-01d08a72fc00 | https://artmilitonian.com | Monochrome Grid Blueprint |
| V–A–C | https://styles.refero.design/style/40154dc4-e681-4df9-be01-a6681d5887a6 | https://v-a-c.org/en | Architectural grid on white |
| Theodore Ellison Designs | https://styles.refero.design/style/f6bcbb63-2925-4bee-a330-e5e770b94750 | https://theodoreellison.com | Warm earth-tones, artisan typography |
| Eindhoven Design District | https://styles.refero.design/style/c90b584e-de5b-4971-9e13-8ab991bd96c0 | https://www.eindhovendesigndistrict.com | Graphic Modernist Poster |

## 2. North Star

Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration.

The desired feeling is: structured, contemporary, rational, bold, rhythmic, architectural.

The accent policy is: shape-linked accent color used to group, sequence, or mark interaction.

Primary warning: avoid random abstract shapes, decorative blobs, inconsistent radii, shape clutter, and grids that collapse into generic cards on mobile.

Use this skill as a practical design system brief. It should help an agent create a visually specific site or app, not just describe the mood. Every recommendation should translate into concrete choices: tokens, layout, typography, components, interaction, imagery, and QA.

## 3. When To Use This Skill

Use Geometric Modern when:

- the user asks for a visual direction matching structured, contemporary, rational, bold, rhythmic, architectural
- the product needs a strong identity without sacrificing usability
- the interface needs repeatable components rather than a one-off artboard
- the page should feel intentionally designed, not theme-swapped
- the brand benefits from a recognizable point of view

Avoid this skill when:

- the user needs a totally different emotional register
- accessibility would be compromised by the requested visual treatment
- the project is mostly backend, infrastructure, or non-visual
- the existing design system clearly points to a different category

## 4. Source Deep Dives

### 1. Greenspace

Source: https://styles.refero.design/style/d961e174-875b-46ef-ad27-fe7f8e3bcd8c  
Site: https://thegreenspace.com  
North star: Monumental monochrome canvas  
Theme: dark

#### What This Source Adds

This reference expands the Geometric Modern skill by showing how Monumental monochrome canvas can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Greenspace Carbon | #000000 | neutral | Page backgrounds, significant surface areas, default text |
| Subtle Ash | #bebebe | neutral | Muted text, inactive links, secondary navigation elements – creates a whispered presence against primary backgrounds |
| Canvas White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |

#### Typography

#### Typeface 1: haas_grotesk

- Role: Primary display and content typography. Its direct and unadorned presence underpins the brand's architectural aesthetic.
- Fallback: Inter
- Weights: 400
- Sizes: 24px, 72px
- Line height: 1.03, 1.15, 1.17
- Letter spacing: not specified

#### Layout Reading

The page primarily utilizes a full-bleed layout, where content sections often extend across the entire viewport width. The hero section features a prominent visual with large, centered navigation elements. Content is typically arranged in distinct, vertically stacked blocks that leverage large section gaps (200px) to create a spacious rhythm. There's a strong emphasis on full-width content blocks and large-scale typography, suggesting a contained but expansive page model. Navigation is likely a sticky top bar or off-canvas element from the 'GS' emblem, given the minimal on-page navigation elements.

#### Spacing Reading

- Section gap: 200px
- Element gap: 37px
- Card padding: 37px
- Page max width: not specified
- Radius: {"none":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link (Active) | Main navigation and hero links when active or hovered. | Text in Canvas White (#ffffff) on Greenspace Carbon (#000000) background. Font is haas_grotesk, 72px, weight 400, line height 1.03. |
| Navigation Link (Inactive) | Main navigation and hero links when inactive. | Text in Subtle Ash (#bebebe) on Greenspace Carbon (#000000) background. Font is haas_grotesk, 72px, weight 400, line height 1.03. |
| Project List Item | Listings for selected projects. | Text in Subtle Ash (#bebebe) on a white background. Font is haas_grotesk, 24px, weight 400, line height 1.15. No explicit padding or border. |
| Section Separator | Visual divider for content sections. | Implied by 200px vertical spacing, with a strict binary shift between carbon and white background compositions. No explicit line or element. |

#### Carry Forward

- Prioritize Greenspace Carbon (#000000) as the dominant background color for most page areas and major content blocks.
- Use Canvas White (#ffffff) sparingly for text on dark backgrounds and for high-contrast link states.
- Employ Subtle Ash (#bebebe) for all secondary and tertiary text, including inactive navigation and project listings, to create a sense of understated authority.
- Maintain a generous 200px vertical section gap to enforce strict separation and emphasize content monumentality.
- Use haas_grotesk (or substitute Inter) at 72px with a line height of 1.03 for all primary calls to action and prominent headings.
- Leverage haas_grotesk (or substitute Inter) at 24px with a line height of 1.15 for all body text, project lists, and secondary content blocks.
- Adhere to a strict 0px border-radius system across all components and elements for a brutalist, architectural feel.

#### Avoid

- Avoid introducing any additional chromatic colors; maintain a strictly achromatic palette.
- Do not use subtle gradients or soft shadows; elevation is achieved through color contrast and spatial separation.
- Do not create explicit card borders or outlines; content boundaries are defined by background changes and spacing.
- Do not use smaller font sizes for captions or body text; the minimal display emphasizes impact over detail density.
- Avoid complex or decorative imagery; visuals should be integrated as impactful, high-contrast product shots or abstract elements.
- Do not layer elements or use overlays unless functionally critical; prioritize flat, distinct content blocks.
- Do not vary line heights or letter spacing from the tokenized values; consistency is key to the system's precision.


### 2. Artem Militonian

Source: https://styles.refero.design/style/c1749391-de9f-4500-a838-01d08a72fc00  
Site: https://artmilitonian.com  
North star: Monochrome Grid Blueprint  
Theme: light

#### What This Source Adds

This reference expands the Geometric Modern skill by showing how Monochrome Grid Blueprint can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, default stroke color for outlined elements |
| Ink Black | #000000 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Deep Graphite | #282828 | neutral | Secondary text, subtle borders, background detail elements, and specific text elements where a slightly softer black is desired than pure Ink Black |
| Muted Gray | #a1a1a1 | neutral | Subtler text, decorative border lines, and secondary informational elements. Provides a low-contrast readability against Canvas White |

#### Typography

#### Typeface 1: custom_87914

- Role: Primary headings, navigation links, and compact informational text. Its variable letter-spacing and tight leading contribute significantly to the system's compressed, impactful feel.
- Fallback: Arial
- Weights: 400, 500
- Sizes: 8px, 34px, 60px, 157px
- Line height: 1.02, 1.03, 1.13
- Letter spacing: -0.0880em at 157px, -0.0500em at 60px, -0.0440em at 34px, -0.0250em at 8px, -0.0190em, 0.0630em

#### Typeface 2: -apple-system

- Role: System-level text, body copy in certain contexts, and internal component labels. This provides a readable baseline where a less stylized font is required.
- Fallback: system-ui
- Weights: 400
- Sizes: 16px
- Line height: 1.00
- Letter spacing: normal

#### Layout Reading

The page adheres to a full-bleed layout without a fixed max-width, allowing content to stretch across the browser window. The hero section features a prominent headline centered over a monochrome, abstract background graphic. Sections are primarily composed of stacked, centered content blocks, with liberal vertical spacing between major elements. Navigation is explicitly listed as an 'index' with underlined text links, reinforcing a command-line interface feel. The rhythm is not defined by alternating bands but by direct content progression, with a strong emphasis on typographic hierarchy and sparse graphical elements.

#### Spacing Reading

- Section gap: 64px
- Element gap: 1px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link | Primary interactive navigation and inline text links. | Text in Ink Black (#000000), custom_87914 font, with an underline of 1px in Ink Black (#000000) that typically extends to match text width, appearing on hover or active state. Uses 1px padding-bottom for the underline offset. No distinct background or radius. |
| Information Card (Transparent) | Container for content where a visual boundary is not desired but logical grouping is implied. | Background is Canvas White (#ffffff). No padding, radius, or shadow, blending seamlessly with the page background. Text and other elements within define its boundaries. |
| Utility Text Label | Small, secondary metadata labels or copyright information. | Text is Deep Graphite (#282828) or Muted Gray (#a1a1a1), usually custom_87914 at 8px, with specific letter-spacing. Minimal visual weight to not distract from primary content. |

#### Carry Forward

- Use no radius (0px) for all elements, maintaining a sharp, angular aesthetic.
- Employ the high-contrast pairing of Ink Black (#000000) text on Canvas White (#ffffff) backgrounds for primary content.
- Utilize custom_87914 font with specific negative letter-spacing for all headlines and navigation to create a dense, impactful textual presence.
- Apply 1px Ink Black (#000000) underlines for interactive elements to signal interactivity without color.
- Maintain minimal vertical spacing between related text elements, contributing to the compact feel.
- Incorporate subtle background graphics using Deep Graphite (#282828) lines on Canvas White (#ffffff) to add texture without color.

#### Avoid

- Do not introduce any chromatic colors; the palette is strictly achromatic.
- Avoid soft shadows or any form of elevation — the design is intentionally flat.
- Do not use rounded corners; all shapes and containers should be rectilinear.
- Refrain from large padding on structural elements like cards or sections; aim for a compact layout.
- Do not use generic system fonts for headlines or navigation; always prefer custom_87914 with its distinct tracking.
- Do not use gradients or color overlays; maintain the pure monochrome aesthetic.


### 3. V–A–C

Source: https://styles.refero.design/style/40154dc4-e681-4df9-be01-a6681d5887a6  
Site: https://v-a-c.org/en  
North star: Architectural grid on white  
Theme: light

#### What This Source Adds

This reference expands the Geometric Modern skill by showing how Architectural grid on white can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, ghost button text (dark theme) |
| Ink Black | #000000 | neutral | Neutral form states, badge text, and quiet UI feedback where color should stay understated. Do not promote it to the primary CTA color |
| Accent Gray | #999999 | neutral | Decorative strokes, subtle secondary graphical elements |

#### Typography

#### Typeface 1: Diagramatika Text

- Role: Body copy, link text, card subtitles, input text — conveys clear information without demanding attention.
- Fallback: IBM Plex Sans
- Weights: 400
- Sizes: 16px, 20px
- Line height: 1.00, 1.10, 1.15
- Letter spacing: normal

#### Typeface 2: Diagramatika Display

- Role: Headlines, section titles, card titles — large and impactful, yet light in weight, establishing hierarchy subtly.
- Fallback: IBM Plex Sans
- Weights: 400
- Sizes: 24px, 34px, 35px
- Line height: 0.88, 0.90, 1.15
- Letter spacing: normal

#### Layout Reading

The page operates on a full-bleed model horizontally, with content contained within a flexible-width, vertically oriented grid. The hero section often features a clean line and heading (like 'GES-2', 'V', 'A', 'C') at the top, acting as a navigational anchor. Section rhythm is dictated by a consistent '150px' vertical gap between content blocks. Content is arranged primarily in a two-column grid where text and imagery flow in a linear, timeline-like sequence down the page without alternating patterns. Navigation is minimal, consisting of text links in the header and alongside sections, with a fixed position vertical navigation bar with rotated text. The design is compact in its element spacing but generous in its section spacing.

#### Spacing Reading

- Section gap: 150px
- Element gap: 5px
- Card padding: 0px
- Page max width: not specified
- Radius: {"all":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Text Button (Dark Text) | Primary interactions and navigation links | Transparent background with Ink Black text. No padding, border, or radius. Text uses Diagramatika Text or Display, weight 400. Example: 'Search' or 'Load more'. |
| Ghost Text Button (Light Text) | Interactive elements on dark sections, such as language toggles | Transparent background with Canvas White text. No padding, border, or radius. Text uses Diagramatika Text, weight 400. Example: 'ru' / 'en'. |
| Minimal Card | Displaying informational blocks like event listings | Transparent background with no border-radius or box-shadow. Content is tightly aligned, often directly on the canvas. Padding is 0px. Top padding can vary (258px, 271px, 274px, 275px) depending on image height. Example: Event listings like 'Alexandra Sukhareva. Beginnings'. |
| Line Input | Form inputs for search or data entry | Transparent background with Ink Black text and a 1px Ink Black underline. Left padding is 2px. No border radius. Text uses Diagramatika Text, weight 400. |

#### Carry Forward

- Use 'Ink Black' (#000000) for all text color, borders, and interactive elements where contrast is paramount.
- Maintain a strict '0px' border-radius for all interactive and display elements, adhering to the sharp, angular aesthetic.
- Employ 'Diagramatika Text' (400) for all body copy and most UI labels, prioritizing clarity over decoration.
- Employ 'Diagramatika Display' (400) for headlines and major navigational elements, with sizes 24px, 34px, or 35px.
- Ensure ample whitespace between sections using '150px' vertical spacing (`sectionGap`).
- Design all interactive elements, such as buttons and links, as transparent backgrounds with only text and a border where necessary.
- Utilize 'Accent Gray' (#999999) sparingly for subtle decorative strokes, not for primary UI elements.

#### Avoid

- Avoid using any colors other than Canvas White, Ink Black, and Accent Gray for primary UI elements and text.
- Do not introduce any border-radius greater than '0px' on any component or surface.
- Never apply box-shadows or elevation effects; the design system relies on flat surfaces and lines.
- Do not introduce any explicit background colors for cards; they should appear as content directly on the canvas.
- Avoid decorative imagery that breaks the monochrome, grid-based aesthetic, unless it is content within a card.
- Do not use letter-spacing adjustments; all typography should maintain 'normal' letter-spacing.
- Refrain from using any gradient fills; surfaces should be solid colors.


### 4. Theodore Ellison Designs

Source: https://styles.refero.design/style/f6bcbb63-2925-4bee-a330-e5e770b94750  
Site: https://theodoreellison.com  
North star: Warm earth-tones, artisan typography  
Theme: light

#### What This Source Adds

This reference expands the Geometric Modern skill by showing how Warm earth-tones, artisan typography can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

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

#### Typography

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

#### Layout Reading

The page primarily uses a contained layout with some full-bleed sections. The hero section can be full-bleed with a prominent visual that takes up the entire viewport, featuring centered branding. Subsequent sections alternate between full-width color blocks and content blocks limited by an implicit max-width, maintaining comfortable internal padding. Content often arranges in dual-column structures (text-left/image-right or vice versa) or centered stacks. Vertical rhythm is established through generous and consistent section gaps of 180px between major blocks, creating a spacious and unhurried browsing experience. The navigation is a minimal top bar, with prominent branding and subtle ghost buttons on the right.

#### Spacing Reading

- Section gap: 180px
- Element gap: 20px
- Card padding: 20px
- Page max width: not specified
- Radius: {"cards":"0px","buttons":"0px","textInputs":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Navigation Button | Primary navigation links and interactive elements within headers/footers. | Text in Charcoal Black (#272729), no background, no border, with 14px padding. Utilizes ModernEra Mono weight 400 for a crisp, functional feel. |
| Outlined Call-to-Action Button | Prominent calls to action, drawing attention through contrast. | Background Almond Canvas (#fdfcf2), text Mahogany Wood (#413128), and a 1px solid Mahogany Wood (#413128) border. Zero border-radius and 14px vertical, 22px horizontal padding. Uses ModernEra weight 400. |
| Filled Neutral Button | Secondary actions or less prominent interactive elements. | Background Stonewash Gray (#cfcfcf), text Pure White (#ffffff). Zero border-radius and 14px vertical, 22px horizontal padding. Uses ModernEra weight 400. |
| Section Divider Card | Modular content blocks that visually separate information. | Background Pale Sand (#f2ede1), with 20px padding. Zero border-radius, no visible border or shadow by default. Content typically centered and structured within this container. |
| Text Input (Outlined) | Form fields for user data entry. | Background Pure White (#ffffff), with a 1px solid Charcoal Black (#272729) border. Zero border-radius, 15px vertical padding and 20px horizontal padding. Uses ModernEra Mono for input text. |

#### Carry Forward

- Prioritize a maximalist approach to imagery, letting the visual assets command attention.
- Maintain zero border-radius on all interactive elements and content containers for a sharp, architectural feel.
- Use Almond Canvas (#fdfcf2) as the default background for interactive components to provide a soft contrast.
- Employ the ModernEra Mono font for all secondary and functional text elements, utilizing its tight -0.0070em letter-spacing.
- Structure page sections with distinct background colors like Desert Clay (#d6926b) and Pale Sand (#f2ede1) to create visual rhythm.
- Use Charcoal Black (#272729) for primary text and border outlines to maintain strong contrast and definition.
- Ensure generous top and bottom padding of 180px for major sections to create breathing room and gravitas.

#### Avoid

- Avoid using drop shadows for elevation; instead, use subtle background color changes or inset shadows for depth.
- Do not introduce rounded corners on any UI elements; the system explicitly uses sharp 0px radii.
- Refrain from using strong, vivid primary colors for backgrounds; the palette relies on muted, earthy tones.
- Do not deviate from the ModernEra and ModernEra Mono font families; there are no other approved typefaces.
- Avoid dense, clustered layouts; content should feel spacious with ample negative space around elements.
- Do not use generic system UI elements; components must reflect the custom, minimalist styling with specific colors and radii.
- Do not apply `normal` letter-spacing to ModernEra Mono font; it should always carry the defined negative tracking.


### 5. Eindhoven Design District

Source: https://styles.refero.design/style/c90b584e-de5b-4971-9e13-8ab991bd96c0  
Site: https://www.eindhovendesigndistrict.com  
North star: Graphic Modernist Poster  
Theme: light

#### What This Source Adds

This reference expands the Geometric Modern skill by showing how Graphic Modernist Poster can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, ghost button backgrounds, and general UI where lightness is needed |
| Ink Black | #000000 | neutral | Primary text, borders, icons, and as a stark background for hero sections or prominent display areas, creating high contrast against Canvas White |
| Ash Gray | #e8e8e8 | neutral | Secondary card surfaces, offering a subtle visual break from pure white |
| Silver Thread | #bfbfbf | neutral | Fine lines, subtle borders, and less prominent text elements |
| Focus Red | #ff0000 | accent | Content emphasis, such as article headings and decorative accents |
| Blush Pink | #ffc2eb | accent | Decorative background blocks for featured sections, adding a soft, yet vivid, accent |
| Electric Blue | #0f26ed | accent | Decorative background blocks, providing a vibrant, high-energy counterpoint |

#### Typography

#### Typeface 1: Helvetica Now

- Role: The sole typeface, Helvetica Now, dictates the entire typographic voice. Its use at extreme sizes and with tight letter-spacing for headings creates a bold, almost architectural feel, making type itself a key visual component of the layout. For body text, its legibility supports a functional, direct communication style.
- Fallback: Inter
- Weights: 400, 600
- Sizes: 14px, 16px, 18px, 19px, 23px, 35px, 46px, 50px
- Line height: 0.93, 1.00, 1.15, 1.20, 1.31, 1.40, 1.47
- Letter spacing: -0.05em at 50px, -0.03em at 46px, -0.024em at 35px, -0.02em at 23px, -0.017em at 19px, -0.004em at 18px, 0.005em at 16px, 0.015em at 14px

#### Layout Reading

The page maintains a crisp, high-contrast layout, primarily favoring a max-width, center-aligned container for content, though the hero section breaks this to full-bleed. The hero often employs large, graphic typography interacting with contained rectangular images. Content sections have a consistent vertical rhythm (35px sectionGap) and use alternating single-column centered text blocks, 2-column text+image arrangements, and 3-column card grids for features and articles. The navigation is a minimalist top bar with utility icons and a hamburger menu.

#### Spacing Reading

- Section gap: 35px
- Element gap: 20px
- Card padding: 20px
- Page max width: not specified
- Radius: {"cards":"0px","buttons":"500px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button | Navigation, secondary actions, and inline links. | Minimalist buttons with no background, Ink Black text, and a 1px Ink Black border, using 500px radius for a pill shape. Padding is compact: 1px vertical, 15px horizontal. The focus is on the border and text, emphasizing clickable areas without visual weight. |
| Primary Action Button | Key interactions and calls to action. | Filled buttons with Canvas White background, Ink Black text, and a 1px Ink Black border. Features generous padding (18px top, 21px bottom, 35px horizontal) and a 500px radius for a bold, approachable pill shape, conveying an important, but not aggressive, action. |
| Icon Button | Standalone interactive icons, such as menu toggles or search. | Circular buttons with a Canvas White background and a 1px Ink Black border, using a 100% border-radius. No internal padding, designed to enclose a single icon, maintaining a clean, compact footprint typical of utility actions. |
| Plain Link Button | Text-based actions that blend seamlessly with content. | Simple text links with no background, border, or radius. The Ink Black text identifies it as an actionable element within sentences or lists, providing a low-hierarchy interactive element. |
| Article Card | Displaying content previews in grid layouts. | Cards with a transparent background and no borders or shadow, defining content regions purely by image and typography. Text is Ink Black. |
| Gray Background Card | Highlighting distinct content blocks within a section. | Cards with an Ash Gray background, no borders or shadows. These cards provide a subtle elevation for content, making them stand out against the main Canvas White background without introducing strong visual separation. |

#### Carry Forward

- Use Ink Black (#000000) for all primary text and Canvas White (#ffffff) for all main backgrounds to achieve maximum contrast.
- Apply a 500px border-radius to all interactive buttons and tags for a consistent pill-shaped aesthetic.
- Reinforce design elements with 1px Ink Black (#000000) borders for definition, maintaining a very clean and sharp edge.
- Employ Helvetica Now as the sole typeface, varying weight and size to establish typographic hierarchy rather than introducing additional fonts.
- Utilize large display typography with tight letter-spacing (-0.05em at 50px, -0.03em at 46px) as a prominent graphic component in hero sections and headlines.
- Implement a spacious `elementGap` of 20px and a `sectionGap` of 35px to create ample negative space and visual breathing room between UI elements and content blocks.
- Integrate photographic imagery as contained rectangles with 0px border-radius, maintaining the overall rectilinear and stark aesthetic.

#### Avoid

- Do not introduce mid-tone gray backgrounds or text colors beyond Ash Gray (#e8e8e8) or Silver Thread (#bfbfbf), as the system relies on stark black and white contrast.
- Avoid using drop shadows or complex elevation styles; the design emphasizes flat surfaces and clear planar separation.
- Do not deviate from the Helvetica Now typeface; its specific character and variable weights are central to the brand's typographic identity.
- Refrain from using gradients for backgrounds, text, or UI elements; the system prioritizes solid color blocks.
- Do not apply rounded corners to images or cards; maintain the strict rectilinear forms defined by '0px' border-radius.
- Avoid excessive use of vivid chromatic colors; they are reserved for controlled, decorative blocks and specific content emphasis, not general UI components.
- Do not use generic font icons or heavily stylized icons; prefer simple, monochrome, possibly outlined icons that maintain the graphical integrity.


## 5. Archetype Library

### 1. Modular Grid Brand

Use this archetype when the project needs a structured, contemporary, rational, bold, rhythmic, architectural feeling and the content naturally supports the modular grid brand pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use shape-linked accent color used to group, sequence, or mark interaction.
- Keep supporting components quieter than the primary workflow.
- Make responsive behavior part of the identity, not an afterthought.
- Preserve the style's point of view while still making the interface easy to use.

Recommended structure:

1. A first viewport that makes the product, story, or action obvious.
2. A supporting proof or context section.
3. A modular body section where the style becomes repeatable.
4. A concrete interaction or conversion path.
5. A final section that closes with the same visual logic as the opening.

Design checks:

- Does the layout explain the content faster than a paragraph would?
- Are color, type, and spacing assigned to real jobs?
- Would the page still feel specific if the images were temporarily removed?
- Are interactive elements easy to identify without instructions?
- Does mobile preserve the same character without overcrowding?

Common failure:

The modular grid brand version of Geometric Modern often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 2. Shape-Led Product Page

Use this archetype when the project needs a structured, contemporary, rational, bold, rhythmic, architectural feeling and the content naturally supports the shape-led product page pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use shape-linked accent color used to group, sequence, or mark interaction.
- Keep supporting components quieter than the primary workflow.
- Make responsive behavior part of the identity, not an afterthought.
- Preserve the style's point of view while still making the interface easy to use.

Recommended structure:

1. A first viewport that makes the product, story, or action obvious.
2. A supporting proof or context section.
3. A modular body section where the style becomes repeatable.
4. A concrete interaction or conversion path.
5. A final section that closes with the same visual logic as the opening.

Design checks:

- Does the layout explain the content faster than a paragraph would?
- Are color, type, and spacing assigned to real jobs?
- Would the page still feel specific if the images were temporarily removed?
- Are interactive elements easy to identify without instructions?
- Does mobile preserve the same character without overcrowding?

Common failure:

The shape-led product page version of Geometric Modern often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 3. Architectural Portfolio

Use this archetype when the project needs a structured, contemporary, rational, bold, rhythmic, architectural feeling and the content naturally supports the architectural portfolio pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use shape-linked accent color used to group, sequence, or mark interaction.
- Keep supporting components quieter than the primary workflow.
- Make responsive behavior part of the identity, not an afterthought.
- Preserve the style's point of view while still making the interface easy to use.

Recommended structure:

1. A first viewport that makes the product, story, or action obvious.
2. A supporting proof or context section.
3. A modular body section where the style becomes repeatable.
4. A concrete interaction or conversion path.
5. A final section that closes with the same visual logic as the opening.

Design checks:

- Does the layout explain the content faster than a paragraph would?
- Are color, type, and spacing assigned to real jobs?
- Would the page still feel specific if the images were temporarily removed?
- Are interactive elements easy to identify without instructions?
- Does mobile preserve the same character without overcrowding?

Common failure:

The architectural portfolio version of Geometric Modern often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 4. Diagrammatic SaaS

Use this archetype when the project needs a structured, contemporary, rational, bold, rhythmic, architectural feeling and the content naturally supports the diagrammatic saas pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use shape-linked accent color used to group, sequence, or mark interaction.
- Keep supporting components quieter than the primary workflow.
- Make responsive behavior part of the identity, not an afterthought.
- Preserve the style's point of view while still making the interface easy to use.

Recommended structure:

1. A first viewport that makes the product, story, or action obvious.
2. A supporting proof or context section.
3. A modular body section where the style becomes repeatable.
4. A concrete interaction or conversion path.
5. A final section that closes with the same visual logic as the opening.

Design checks:

- Does the layout explain the content faster than a paragraph would?
- Are color, type, and spacing assigned to real jobs?
- Would the page still feel specific if the images were temporarily removed?
- Are interactive elements easy to identify without instructions?
- Does mobile preserve the same character without overcrowding?

Common failure:

The diagrammatic saas version of Geometric Modern often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 5. Geometric Editorial System

Use this archetype when the project needs a structured, contemporary, rational, bold, rhythmic, architectural feeling and the content naturally supports the geometric editorial system pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use shape-linked accent color used to group, sequence, or mark interaction.
- Keep supporting components quieter than the primary workflow.
- Make responsive behavior part of the identity, not an afterthought.
- Preserve the style's point of view while still making the interface easy to use.

Recommended structure:

1. A first viewport that makes the product, story, or action obvious.
2. A supporting proof or context section.
3. A modular body section where the style becomes repeatable.
4. A concrete interaction or conversion path.
5. A final section that closes with the same visual logic as the opening.

Design checks:

- Does the layout explain the content faster than a paragraph would?
- Are color, type, and spacing assigned to real jobs?
- Would the page still feel specific if the images were temporarily removed?
- Are interactive elements easy to identify without instructions?
- Does mobile preserve the same character without overcrowding?

Common failure:

The geometric editorial system version of Geometric Modern often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

## 6. Consolidated Color System

The palette below merges tokens observed across the five sources. Do not use every color. Treat it as a vocabulary for building a smaller project-specific system.

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Greenspace Carbon | #000000 | neutral | Page backgrounds, significant surface areas, default text |
| Subtle Ash | #bebebe | neutral | Muted text, inactive links, secondary navigation elements – creates a whispered presence against primary backgrounds |
| Canvas White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |
| Ink Black | #000000 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Deep Graphite | #282828 | neutral | Secondary text, subtle borders, background detail elements, and specific text elements where a slightly softer black is desired than pure Ink Black |
| Muted Gray | #a1a1a1 | neutral | Subtler text, decorative border lines, and secondary informational elements. Provides a low-contrast readability against Canvas White |
| Accent Gray | #999999 | neutral | Decorative strokes, subtle secondary graphical elements |
| Mahogany Wood | #413128 | brand | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Desert Clay | #d6926b | brand | Primary section background, conveying warmth and natural material |
| Forest Moss | #3c4531 | brand | Tertiary section background, a deep, muted green for variety |
| Ocean Slate | #38506c | brand | Accent background, a cool, muted blue-gray |
| Lavender Mist | #afa5b4 | brand | Accent background, a soft, desaturated purple for visual segmentation |
| Charcoal Black | #272729 | neutral | Primary text, general borders, link text |
| Almond Canvas | #fdfcf2 | neutral | Secondary background, ghost button background, footer background, provides a soft, warm white base |

### 6.1 Color Rules

- Start with the smallest palette that can express the product.
- Assign every color a semantic job before implementing it.
- Keep primary actions visually consistent across the whole experience.
- Use neutral surfaces to give the brand accents room to work.
- Never use color as decoration when spacing, type, or hierarchy would be stronger.
- Test actual text/background pairs, not just theoretical palette values.

### 6.2 Token Model

```css
:root {
  --style-bg: #ffffff;
  --style-fg: #111111;
  --style-muted: #6b7280;
  --style-border: #e5e7eb;
  --style-surface: #f8f8f8;
  --style-accent: #155dfc;
  --style-danger: #ff3939;
  --style-radius: 8px;
  --style-gap: 16px;
}
```

Adapt these defaults to the source palette. The important part is not the exact values; it is that every token has a job and repeated use.

## 7. Typography System

### 7.1 Typography Jobs

| Job | Purpose | Guidance |
| --- | --- | --- |
| Hero | creates first identity signal | expressive but readable |
| Section Heading | organizes the page | strong hierarchy, consistent rhythm |
| Body | explains value | comfortable line length and line height |
| Label | supports scanning | compact, clear, often medium weight |
| Metadata | lowers priority | muted but accessible |
| CTA | drives action | short, direct, high contrast |
| Technical | code/data distinction | mono only when it clarifies |

### 7.2 Type Rules

- Choose type before decoration.
- Use no more than two families unless the source references clearly support more.
- Keep body copy calmer than display type.
- Use weight, size, spacing, and case deliberately.
- Do not use tiny text to create sophistication if the user needs to act.
- Preserve readable line-height on all long text.
- Test mobile wrapping for the longest real words.

### 7.3 Scale Template

| Level | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| hero | 64-112px | 42-64px | adjust for longest word |
| h1 | 48-80px | 36-48px | one primary page title |
| h2 | 32-56px | 28-36px | section entry |
| h3 | 22-32px | 20-26px | card or module title |
| body | 16-20px | 16-18px | never sacrifice readability |
| label | 12-14px | 12-14px | maintain tap targets |
| metadata | 12-14px | 12-14px | muted but accessible |

## 8. Layout System

### 8.1 Composition Principles

- Let the first viewport establish the style immediately.
- Do not wrap the entire page in decorative cards.
- Use full-width bands or clean layout shifts for major section changes.
- Preserve strong alignment edges.
- Give repeated modules stable dimensions.
- Make spacing rhythm visible and intentional.
- Keep controls near the content they affect.

### 8.2 Section Rhythm

| Section Type | Recommended Gap | Notes |
| --- | --- | --- |
| hero to proof | 32-80px | depends on density |
| major narrative section | 72-140px | use for brand and landing pages |
| dashboard modules | 12-32px | keep operational density |
| card grid | 16-32px | match content complexity |
| footer | 64-120px | should feel like a deliberate ending |

### 8.3 Responsive Rules

- Reduce columns before reducing readability.
- Do not keep desktop hero scale on mobile.
- Preserve component jobs across breakpoints.
- Keep tap targets at usable sizes.
- Avoid text over images on mobile unless contrast is guaranteed.
- Keep sticky or fixed controls from covering content.

## 9. Component System

### 9.1 Core Components

| Component | Purpose | Style Guidance |
| --- | --- | --- |
| Hero | first identity and value signal | strong type, clear action, specific visual |
| Navigation | orientation | quieter than hero, always readable |
| CTA Button | conversion | stable treatment, visible states |
| Card | repeated information | only use when grouping is real |
| Form Field | input | clear label, border, focus, error |
| Badge | state/category | small and semantic |
| Tab | mode switch | obvious active state |
| Table/List | comparison | alignment and density matter |
| Empty State | recovery | useful next action |
| Footer | closure | repeat brand logic, do not become junk drawer |

### 9.2 Button Rules

- Primary button must be visually unique.
- Secondary buttons should be quieter, not confusing.
- Hover states should increase clarity.
- Focus states must be visible.
- Disabled states need readable labels.
- Icon-only buttons need accessible labels and recognizable icons.

### 9.3 Card Rules

- Cards should not nest inside cards.
- Cards need consistent padding, border, and radius.
- Do not use cards for every section.
- Use cards for repeated items, product modules, content summaries, or controls.
- Avoid decorative shadows unless the style supports depth.

### 9.4 Form Rules

- Use labels.
- Keep error messages near fields.
- Preserve contrast in placeholder and disabled states.
- Do not rely on color alone.
- Keep submission result clear.

## 10. Interaction And Motion

Motion should make the style easier to use.

Good uses:

- hover confirmation
- tab indicator movement
- panel reveal
- card focus
- progress state
- loading feedback
- image transition

Bad uses:

- decorative loops that compete with content
- motion that delays form completion
- hover states that reduce contrast
- large parallax on text-heavy pages
- animations without reduced-motion handling

Recommended timings:

- hover: 100-180ms
- panel reveal: 180-280ms
- page transition: 240-420ms
- loading skeleton: subtle, not theatrical

## 11. Imagery And Media

Imagery must carry information or brand character.

Use imagery for:

- product evidence
- material detail
- interface proof
- human context
- editorial atmosphere
- diagrammatic explanation

Avoid imagery that is:

- generic stock
- too dark to inspect
- purely atmospheric when users need product clarity
- unrelated to the claim beside it
- cropped so tightly that the object cannot be understood

## 12. Implementation Recipes

### 12.1 Hero Recipe

```html
<section class="style-hero">
  <nav class="style-nav">
    <a href="/" class="style-logo">Brand</a>
    <div class="style-links">
      <a href="/work">Work</a>
      <a href="/pricing">Pricing</a>
      <a href="/contact">Contact</a>
    </div>
  </nav>
  <div class="style-hero-grid">
    <div class="style-copy">
      <p class="style-kicker">Focused system</p>
      <h1>Build a visual identity with a point of view.</h1>
      <p>The interface should be specific, usable, and repeatable across real screens.</p>
      <a class="style-primary" href="/start">Start</a>
    </div>
    <div class="style-visual" aria-label="Product preview"></div>
  </div>
</section>
```

### 12.2 Component CSS

```css
.style-hero {
  background: var(--style-bg);
  color: var(--style-fg);
}

.style-nav {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 64px);
  border-bottom: 1px solid var(--style-border);
}

.style-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
  gap: clamp(32px, 6vw, 96px);
  align-items: center;
  padding: clamp(56px, 8vw, 128px) clamp(20px, 6vw, 96px);
}

.style-copy h1 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(44px, 7vw, 96px);
  line-height: 0.98;
}

.style-copy p {
  max-width: 58ch;
  font-size: 18px;
  line-height: 1.5;
}

.style-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  background: var(--style-accent);
  color: #fff;
  border-radius: var(--style-radius);
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 760px) {
  .style-hero-grid {
    grid-template-columns: 1fr;
  }
}
```

## 13. Page Blueprints

### 13.1 Brand Homepage

1. Hero with specific promise.
2. Proof row.
3. Three capability sections.
4. Product or work evidence.
5. Process section.
6. CTA.

Checks:

- Does the hero state what the brand does?
- Does the visual direction appear in the first viewport?
- Is there one obvious next action?
- Are proof points concrete?

### 13.2 Product Page

1. Product hero.
2. Feature evidence.
3. Workflow or use-case sequence.
4. Details/specs.
5. Social proof.
6. CTA or purchase path.

Checks:

- Is the product visible?
- Can the user understand the core workflow?
- Are details easy to find?
- Is conversion visually obvious?

### 13.3 App Dashboard

1. Navigation shell.
2. Primary task area.
3. Secondary panels.
4. Filters/actions.
5. Data display.
6. Empty/error/loading states.

Checks:

- Can users repeat the main task quickly?
- Are controls close to affected content?
- Are states visually distinct?
- Is density appropriate?

## 14. QA Checklist

### Identity

- Is there one recognizable visual idea?
- Does the style match structured, contemporary, rational, bold, rhythmic, architectural?
- Are tokens consistent?
- Does the design avoid the warning: avoid random abstract shapes, decorative blobs, inconsistent radii, shape clutter, and grids that collapse into generic cards on mobile?

### Usability

- Is the primary action obvious?
- Is body text readable?
- Are controls discoverable?
- Are mobile states complete?
- Are focus states visible?

### Craft

- Are spacing values consistent?
- Are repeated modules stable?
- Are images meaningful?
- Are cards used only when useful?
- Is motion restrained?

### Accessibility

- Are contrast ratios acceptable?
- Is information not conveyed by color alone?
- Are labels present?
- Is keyboard navigation supported?
- Does reduced motion work?

## 15. Prompt Templates

### 15.1 General Build Prompt

Create a Geometric Modern interface that feels structured, contemporary, rational, bold, rhythmic, architectural. Geometric modern design works when shape is structural. Circles, blocks, diagonal cuts, grids, and modules should organize content, not sit on top as decoration. Use shape-linked accent color used to group, sequence, or mark interaction. Build a complete, usable experience with clear hierarchy, real content structure, responsive behavior, accessible states, and a repeatable component system. avoid random abstract shapes, decorative blobs, inconsistent radii, shape clutter, and grids that collapse into generic cards on mobile.

### 15.2 Landing Page Prompt

Design a Geometric Modern landing page with a strong first viewport, specific product or brand promise, credible proof, clear section rhythm, and a focused conversion path. The visual identity should come from typography, spacing, color roles, imagery, and component geometry rather than generic decoration.

### 15.3 App Interface Prompt

Design a Geometric Modern application screen for repeated use. Prioritize the main workflow, controls, state clarity, information density, and accessible interaction. Make the interface visually distinctive but keep operational surfaces calm enough for daily work.

## 16. Last-Mile Corrections

If the result feels generic:

- strengthen the type hierarchy
- reduce unrelated decoration
- define a stricter token system
- add one layout move tied to the content
- replace vague copy with concrete nouns and verbs

If the result feels too noisy:

- reduce accent color use
- simplify shadows and borders
- remove unnecessary cards
- increase alignment consistency
- limit motion to useful state changes

If the result feels too empty:

- add proof, product evidence, or richer content modules
- improve section rhythm
- add meaningful imagery
- use typography scale more decisively
- introduce one structural pattern from the sources

If the result feels hard to use:

- increase body size and contrast
- make controls more conventional
- add labels and helper text
- bring actions closer to content
- clarify active, hover, focus, empty, and error states

## 17. Acceptance Standard

A finished Geometric Modern design should:

- feel visually specific within the first viewport
- support real content and real workflows
- have consistent tokens
- have clear interaction states
- be responsive without losing character
- be accessible enough for production use
- translate the five source references into a broader reusable skill


## Appendix 1: Geometric Modern Production Pattern Expansion

### A1.1 Layout Decisions

For Geometric Modern, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Geometric Modern layout does not merely look structured, contemporary, rational, bold, rhythmic, architectural; it makes that feeling useful.

Practical rules:

- Choose one dominant layout mode for each page.
- Use repeated alignment to make the system feel intentional.
- Give the main action a stable location.
- Keep secondary information visually lower but still readable.
- Use section breaks to reset attention.
- Avoid decorative containers when a simple band, row, or grid would be clearer.

### A1.2 Component Decisions

Every component should answer three questions:

1. What content does it contain?
2. What action or decision does it support?
3. How does it express Geometric Modern without harming usability?

Good Geometric Modern components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A1.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A1.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Geometric Modern design only works when the style survives real constraints.



## Appendix 2: Geometric Modern Production Pattern Expansion

### A2.1 Layout Decisions

For Geometric Modern, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Geometric Modern layout does not merely look structured, contemporary, rational, bold, rhythmic, architectural; it makes that feeling useful.

Practical rules:

- Choose one dominant layout mode for each page.
- Use repeated alignment to make the system feel intentional.
- Give the main action a stable location.
- Keep secondary information visually lower but still readable.
- Use section breaks to reset attention.
- Avoid decorative containers when a simple band, row, or grid would be clearer.

### A2.2 Component Decisions

Every component should answer three questions:

1. What content does it contain?
2. What action or decision does it support?
3. How does it express Geometric Modern without harming usability?

Good Geometric Modern components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A2.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A2.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Geometric Modern design only works when the style survives real constraints.



## Appendix 3: Geometric Modern Production Pattern Expansion

### A3.1 Layout Decisions

For Geometric Modern, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Geometric Modern layout does not merely look structured, contemporary, rational, bold, rhythmic, architectural; it makes that feeling useful.

Practical rules:

- Choose one dominant layout mode for each page.
- Use repeated alignment to make the system feel intentional.
- Give the main action a stable location.
- Keep secondary information visually lower but still readable.
- Use section breaks to reset attention.
- Avoid decorative containers when a simple band, row, or grid would be clearer.

### A3.2 Component Decisions

Every component should answer three questions:

1. What content does it contain?
2. What action or decision does it support?
3. How does it express Geometric Modern without harming usability?

Good Geometric Modern components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A3.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A3.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Geometric Modern design only works when the style survives real constraints.



## Appendix 4: Geometric Modern Production Pattern Expansion

### A4.1 Layout Decisions

For Geometric Modern, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Geometric Modern layout does not merely look structured, contemporary, rational, bold, rhythmic, architectural; it makes that feeling useful.

Practical rules:

- Choose one dominant layout mode for each page.
- Use repeated alignment to make the system feel intentional.
- Give the main action a stable location.
- Keep secondary information visually lower but still readable.
- Use section breaks to reset attention.
- Avoid decorative containers when a simple band, row, or grid would be clearer.

### A4.2 Component Decisions

Every component should answer three questions:

1. What content does it contain?
2. What action or decision does it support?
3. How does it express Geometric Modern without harming usability?

Good Geometric Modern components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A4.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A4.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Geometric Modern design only works when the style survives real constraints.



## Appendix 5: Geometric Modern Production Pattern Expansion

### A5.1 Layout Decisions

For Geometric Modern, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Geometric Modern layout does not merely look structured, contemporary, rational, bold, rhythmic, architectural; it makes that feeling useful.

Practical rules:

- Choose one dominant layout mode for each page.
- Use repeated alignment to make the system feel intentional.
- Give the main action a stable location.
- Keep secondary information visually lower but still readable.
- Use section breaks to reset attention.
- Avoid decorative containers when a simple band, row, or grid would be clearer.

### A5.2 Component Decisions

Every component should answer three questions:

1. What content does it contain?
2. What action or decision does it support?
3. How does it express Geometric Modern without harming usability?

Good Geometric Modern components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A5.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A5.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Geometric Modern design only works when the style survives real constraints.

