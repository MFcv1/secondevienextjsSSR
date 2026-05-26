---
name: editorial-type
description: Use this skill to create editorial typographic websites and interfaces where type carries identity through scale, rhythm, contrast, columns, pull quotes, indexes, and magazine-like hierarchy.
---

# Editorial Type Design Skill

## 1. Source Basis

This skill consolidates five Refero references for the "Editorial Type" suggested category.

| Reference | Refero Source | Site | North Star |
| --- | --- | --- | --- |
| Volume | https://styles.refero.design/style/edc0c03e-8c20-4e22-badd-2735fcb9f4a8 | https://vol.co | Editorial archive, high contrast. |
| Victor Cango | https://styles.refero.design/style/66fdf7a4-7d28-452e-88ec-c84e49b3ae6f | https://victorcango.fr | Editorial type on stark canvas |
| No Ideas | https://styles.refero.design/style/908017b4-311c-4b89-afa5-c29c8cb08e8b | https://noideas.website | High-contrast editorial publication |
| Sociotype | https://styles.refero.design/style/973332dc-4e10-4e90-85d8-3bce9c3cd3ed | https://socio-type.com | Editorial White Canvas |
| Christopherdoyle | https://styles.refero.design/style/e1223d32-c423-4c95-ae0a-8a6f8585e6a2 | https://christopherdoyle.co | Editorial Grid, Ink on Paper |

## 2. North Star

Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled.

The desired feeling is: literary, expressive, composed, sharp, cultural, typographic.

The accent policy is: typographic contrast first; color accent only for annotation, issue markers, links, or section identity.

Primary warning: avoid illegible display text, fake magazine layouts, too many fonts, low-contrast long reading, and typographic drama that hides navigation or action.

Use this skill as a practical design system brief. It should help an agent create a visually specific site or app, not just describe the mood. Every recommendation should translate into concrete choices: tokens, layout, typography, components, interaction, imagery, and QA.

## 3. When To Use This Skill

Use Editorial Type when:

- the user asks for a visual direction matching literary, expressive, composed, sharp, cultural, typographic
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

### 1. Volume

Source: https://styles.refero.design/style/edc0c03e-8c20-4e22-badd-2735fcb9f4a8  
Site: https://vol.co  
North star: Editorial archive, high contrast.  
Theme: light

#### What This Source Adds

This reference expands the Editorial Type skill by showing how Editorial archive, high contrast. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

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

#### Typography

#### Typeface 1: Messina Sans

- Role: The primary typeface for all text. Its lightness (300) for large headlines creates a refined, understated impact, while the moderate spacing (0.0700em) in smaller sizes ensures legibility and a classic, almost monospaced editorial feel.
- Fallback: system-ui, sans-serif
- Weights: 300, 350
- Sizes: 14px, 18px, 20px, 32px, 50px, 80px
- Line height: 1.00, 1.18, 1.40, 2.00
- Letter spacing: -0.0200em at 50px, 0.0700em at 14px

#### Layout Reading

The page layout utilizes a max-width contained model (1400px) with content sections centered. The hero sections are full-bleed with large background images and overlaid text, establishing a strong visual anchor. The section rhythm appears to be based on distinct content blocks, some with dark backgrounds and light text, others following the primary light theme. Content often alternates between large imagery and text blocks, suggesting a journalistic or editorial spread. There's no evident grid for cards, which seem to be presented in sequential blocks rather than uniform columns. Navigation is a minimalist top bar, sticky or otherwise. The density is comfortable, providing sufficient breathing room around key content.

#### Spacing Reading

- Section gap: 45px
- Element gap: 10px
- Card padding: 30px
- Page max width: 1400px
- Radius: {"cards":"0px","pills":"50px","inputs":"0px","buttons":"0px"}

#### Component Reading

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

#### Carry Forward

- Use 'Ink Black' (#272727) for all primary body and heading text for high contrast on light backgrounds.
- Apply Messina Sans weight 300 for display and large headings, and weight 350 for body text and navigation to maintain an editorial tone.
- Structure layouts with a maximum width of 1400px and ensure content is centered within this constraint.
- Employ 0px border-radius for main containers, buttons, and input fields to sustain a sharp, modern aesthetic, reserving 50px for small status pills.
- Utilize 'Canvas White' (#ffffff) as the dominant page and card background color to provide a clean reading experience.
- Maintain a comfortable element spacing of 10px between interactive items and form elements.
- Use distinct accent colors for 'Funding Status Pills' to immediately convey status or category, differentiating them from the main content.

#### Avoid

- Avoid using decorative shadows or excessive gradients; keep surfaces flat and defined by solid colors or subtle borders.
- Do not introduce additional typefaces; Messina Sans is the sole typographic voice of the brand.
- Do not use highly saturated colors for large UI elements; confine chromatic accents to small, functional components like status pills.
- Refrain from altering the established 0px border-radius on major components, as this is a core aspect of the brand's sharp visual identity.
- Do not deviate from the high-contrast color pairings for text and backgrounds to preserve readability.
- Avoid arbitrary uses of spacing; adhere to the 10px element gap and 30px card padding for consistent rhythm.
- Do not apply `0.0700em` letter-spacing to large headlines; it is specifically for smaller text to enhance legibility.


### 2. Victor Cango

Source: https://styles.refero.design/style/66fdf7a4-7d28-452e-88ec-c84e49b3ae6f  
Site: https://victorcango.fr  
North star: Editorial type on stark canvas  
Theme: light

#### What This Source Adds

This reference expands the Editorial Type skill by showing how Editorial type on stark canvas can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Ink Obsidian | #0f0f0f | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Canvas Parchment | #f7f7f7 | neutral | Page backgrounds, footer backgrounds — the primary light surface for all content |

#### Typography

#### Typeface 1: century-old-style-std

- Role: Hero headlines, main content headings, and larger textual elements where a distinguished, classic serif feel is desired to convey editorial weight. The subtle negative letter-spacing prevents open kerning at larger sizes.
- Fallback: Palatino Linotype, Georgia, serif
- Weights: 400
- Sizes: 16px, 21px, 50px
- Line height: 1.00, 1.30
- Letter spacing: -0.0940em at 50px, -0.0500em at 21px, normal at 16px

#### Typeface 2: MetroSans

- Role: Body text, navigation items, and link text where a clean, modern sans-serif provides readability and a contemporary counterpoint to the serif headings. The consistent tight letter-spacing supports density and precision.
- Fallback: system-ui, 'Helvetica Neue', Arial, sans-serif
- Weights: 400
- Sizes: 21px, 24px, 50px
- Line height: 1.00, 1.30
- Letter spacing: -0.0500em

#### Layout Reading

The page primarily uses a contained, centered layout for content sections, set against a full-bleed Canvas Parchment background. The header is minimal, containing navigation links and a clock, with a clear separation of elements. The hero section features large, expressive typography centrally placed, often juxtaposed with abstracted graphical elements. Content sections typically flow with consistent vertical spacing (48px section gap), and text blocks maintain generous padding (16px) to enhance readability and visual impact, suggesting a content-dominant composition with artful visual accents.

#### Spacing Reading

- Section gap: 48px
- Element gap: 16px
- Card padding: 16px
- Page max width: not specified
- Radius: {"default":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Navigation Link - Underlined | Interactive text link, primarily for navigation. | Text in Ink Obsidian (#0f0f0f), MetroSans 400. Renders with a 1px solid Ink Obsidian underline upon hover or active state. Padding-bottom of 6px is used to separate the text from its underline. |
| Hero Headline | Primary page title or major section heading. | century-old-style-std 400, 50px font size, 1.0 line height, letter-spacing -0.094em, Ink Obsidian (#0f0f0f). |
| Header Clock | Decorative time display in the header. | MetroSans 400, 21px font size, 1.0 line height, letter-spacing -0.05em, Ink Obsidian (#0f0f0f). Typically positioned within the header bar with 4px left/right margin. |
| Body Text Paragraph | General informational text. | century-old-style-std 400, 16px font size, 1.3 line height, Ink Obsidian (#0f0f0f). Used for longer content blocks. |
| Footer Section | Container for copyright, contact info, and secondary navigation. | Background is Canvas Parchment (#f7f7f7), with 16px padding on all sides. Text elements use Ink Obsidian (#0f0f0f) with various typographic styles. |

#### Carry Forward

- Prioritize Ink Obsidian (#0f0f0f) for all primary text and critical UI elements against Canvas Parchment (#f7f7f7) backgrounds to ensure high contrast.
- Use century-old-style-std for expressive and editorial headlines, specifically at 50px with a letter-spacing of -0.0940em.
- Apply MetroSans for functional text elements, navigation, and body copy headings, ensuring 21px/24px sizes use -0.0500em letter-spacing.
- When creating interactive links, use Ink Obsidian (#0f0f0f) text and an Ink Obsidian (#0f0f0f) 1px underline, offset by 6px padding-bottom.
- Maintain a clear visual hierarchy by utilizing the distinct styles of century-old-style-std (serif) and MetroSans (sans-serif) purposefully.
- Structure sections with a minimum vertical separation of 48px to create comfortable density in the layout.
- Incorporate 16px padding on interior content blocks and cards to provide ample breathing room for text.

#### Avoid

- Do not introduce new primary background or text colors; adhere strictly to Ink Obsidian (#0f0f0f) and Canvas Parchment (#f7f7f7).
- Avoid using decorative borders or drop shadows on cards or elements; rely on typography and spacing for separation.
- Do not deviate from the specified letter-spacing values for type roles, especially for larger headings and navigation where it defines the character.
- Refrain from using color to indicate interactive states; underlines and bolding in Ink Obsidian (#0f0f0f) are preferred.
- Do not use generic system fonts as substitutes for century-old-style-std or MetroSans without explicit approval, as their unique character is central.
- Avoid overly dense content blocks without sufficient element gaps; ensure 16px spacing between most adjacent UI elements.
- Do not use corner radius on any UI elements; maintain sharp, crisp edges throughout the design.


### 3. No Ideas

Source: https://styles.refero.design/style/908017b4-311c-4b89-afa5-c29c8cb08e8b  
Site: https://noideas.website  
North star: High-contrast editorial publication  
Theme: dark

#### What This Source Adds

This reference expands the Editorial Type skill by showing how High-contrast editorial publication can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, prominent text (on dark), borders, ghost button outlines |
| Ink Black | #000000 | neutral | Primary surface background, main body text, navigation elements, footer text |
| Text Gray | #212529 | neutral | General body text for readability, subtle borders |

#### Typography

#### Typeface 1: ABC Diatype

- Role: Primary display font for headings and prominent editorial text. Its distinct letterforms and tight tracking at larger sizes create a bold, modern, almost logotype-like feel.
- Fallback: Inter
- Weights: 400, 500
- Sizes: 36px, 48px, 331px
- Line height: 1.05, 1.10, 1.52
- Letter spacing: -0.052em at 36px/48px, -0.010em at 331px

#### Typeface 2: system-ui

- Role: Body text and functional UI elements where high readability and system-level consistency are preferred.
- Fallback: Segoe UI, Apple System
- Weights: 400
- Sizes: 16px
- Line height: 1.50
- Letter spacing: normal

#### Layout Reading

The page embraces a full-bleed content model where sections can stretch across the viewport width. The hero section, as seen with the 'WINGS' title, features a full-bleed Ink Black background with large, centered Canvas White text. The section rhythm is defined by large vertical gaps (202px) between content blocks and a clear contrast shift between dark and light backgrounds. Content is often presented in a simple, stacked or implied two-column arrangement, focusing on strong typographic statements. Navigation is minimal, consisting of a top bar for core links and a detailed footer. The overall density is spacious, allowing elements significant room to breathe.

#### Spacing Reading

- Section gap: 
- Element gap: 29px
- Card padding: 
- Page max width: not specified
- Radius: {"image":"15px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Navigation Link | Interactive text link within headers and footers. | Text in Ink Black (#000000) or Canvas White (#ffffff) using ABC Diatype 400 at appropriate sizes for navigation, with no background or specific padding, relying on surrounding whitespace for interaction cues. |
| Editorial Header | Primary heading for sections or pages. | Utilizes ABC Diatype at large sizes (48px or 331px), typically in Canvas White (#ffffff) against Ink Black (#000000) or vice-versa, with tight letter spacing for visual impact. Has a distinct vertical rhythm of 202px below it. |
| Image Card | Container for visual content. | Images are presented with a 15px border-radius, giving a subtle softness to photographic elements within the otherwise sharp design. Text associated with images (e.g., captions) would typically use Canvas White #ffffff or Text Gray #212529. |
| Editorial Footer Section | Bottom navigation and additional information block. | Ink Black (#000000) background with Canvas White (#ffffff) text, structured with internal padding of 19px top/bottom and 29px left/right. Contains multiple interactive text links. |

#### Carry Forward

- Prioritize Canvas White (#ffffff) and Ink Black (#000000) for all primary backgrounds and text, maintaining high contrast.
- Use ABC Diatype for all headings and prominent textual elements, applying the specified letter-spacing for each size.
- Maintain generous spacing around sections, specifically a 202px bottom margin after primary content blocks.
- Apply a 15px border-radius consistently to all images for a subtle softening effect.
- Ensure UI elements for navigation and information are simple text links, without pronounced button styling, using either Canvas White (#ffffff) or Ink Black (#000000).
- Employ `system-ui` for all body text and secondary informational content at 16px weight 400 with normal letter-spacing and 1.5 line height.

#### Avoid

- Avoid introducing additional chromatic colors; the system relies on a strictly monochromatic palette.
- Do not use box-shadows or complex gradients; the design aesthetic is intentionally flat.
- Do not vary from the specified line heights and letter spacing for ABC Diatype; these are critical to the typographic identity.
- Do not add heavy borders or background fills to interactive elements; they should remain text-based or 'ghost' styled.
- Avoid dense informational blocks; embrace spacious layouts to create visual breathing room.
- Do not use decorative imagery that detracts from the stark, editorial focus; images should be integral to the content.


### 4. Sociotype

Source: https://styles.refero.design/style/973332dc-4e10-4e90-85d8-3bce9c3cd3ed  
Site: https://socio-type.com  
North star: Editorial White Canvas  
Theme: light

#### What This Source Adds

This reference expands the Editorial Type skill by showing how Editorial White Canvas can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, primary text on dark hero sections |
| Ink Black | #000000 | neutral | Primary text, borders, active states for ghost buttons and navigation, accent markings |
| Medium Gray | #818181 | neutral | Muted text, secondary information, placeholder text, inactive link borders |
| Light Gray | #d6d6d6 | neutral | Subtle dividers, borders between content sections |
| Faded Gray | #9d9d9d | neutral | Tertiary text, list item borders |

#### Typography

#### Typeface 1: Main Onsite

- Role: Main Onsite — detected in extracted data but not described by AI
- Fallback: not specified
- Weights: 400
- Sizes: 11px, 12px, 13px, 14px, 16px, 18px, 26px, 40px
- Line height: 1, 1.13, 1.19, 1.22, 1.29, 1.31, 1.33, 1.38
- Letter spacing: 0.015, 0.025, 0.04, 0.05, 0.08

#### Typeface 2: Onsite

- Role: Primary typeface for all body text, navigation, buttons, and smaller headings. Its regular weight ensures readability while maintaining a modern, understated presence.
- Fallback: system-ui, sans-serif
- Weights: 400
- Sizes: 251px
- Line height: 1.25
- Letter spacing: 0.0800em at 11px, 0.0500em at 12px, 0.0400em at 13px, 0.0250em at 14px, 0.0150em at 16px, 0.0150em at 18px

#### Typeface 3: Avec Sharp

- Role: Display typeface for featured headlines and typographic showcases. Its unique character defines the brand's aesthetic in a large, impactful way.
- Fallback: serif
- Weights: 400
- Sizes: 251px
- Line height: 1.25
- Letter spacing: 0.0010em

#### Typeface 4: Ceno

- Role: Alternative display typeface, used for specific typographic showcases. Shares the overall expressive, impactful role of Avec Sharp.
- Fallback: serif
- Weights: 400
- Sizes: 251px
- Line height: 1.25
- Letter spacing: 0.0010em

#### Typeface 5: Meso

- Role: Alternative display typeface, used for specific typographic showcases. Expands the brand's visual range for showcasing different font styles.
- Fallback: serif
- Weights: 400
- Sizes: 251px
- Line height: 1.25
- Letter spacing: 0.0010em

#### Typeface 6: Gestura

- Role: Alternative display typeface with ligatures, used for specific typographic showcases. Highlights the intricate details of font design.
- Fallback: serif
- Weights: 400
- Sizes: 251px
- Line height: 1.25
- Letter spacing: 0.0010em

#### Typeface 7: Rework

- Role: Alternative display typeface, used for specific typographic showcases. Contributes to the diverse presentation of font families.
- Fallback: serif
- Weights: 400
- Sizes: 251px
- Line height: 1.25
- Letter spacing: 0.0010em

#### Layout Reading

The page maintains a full-bleed structure without a fixed maximum width for its main content, allowing elements to span the entire viewport. The hero section often features a large-scale, sometimes abstract image or graphic background with centered, prominent type specimen alongside informative text. Content sections below the hero typically follow a two-column layout with text on one side and associated visuals or another type specimen on the other. Navigation is a minimalist top bar with ghosted links, and a very large, eye-catching text (Sociotype) floats over the hero graphic. Vertical rhythm is established through generous, consistent section gaps, creating a spacious, editorial flow rather than a dense grid.

#### Spacing Reading

- Section gap: 120px
- Element gap: 12px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button - Inactive | Navigational and call-to-action link styling | Text in Ink Black or Canvas White, with a 1px bottom border of the same color. No background fill or padding. This gives buttons a lightweight, integrated feel with the surrounding text. |
| Ghost Button - Muted | Secondary actions or menu items | Text in Medium Gray, with a 1px bottom border of the same color. No background fill or padding. Used for less prominent interactive elements. |
| Featured Card | Displaying prominent typefaces without visual distraction | Completely transparent background, no borders, no box shadow, with 0px border-radius. Content manages its own spacing and visual hierarchy. Features a text block with 'Onsite' typography, 14px size, Ink Black color, 0.025em letter spacing, and a 1px Ink Black bottom border for 'More Info' link. |
| Text Input | User input for forms (e.g., newsletter signup) | Transparent background, placeholder/text in Medium Gray (#818181), with a thin 1px bottom border in Medium Gray. |

#### Carry Forward

- Prioritize Ink Black (#000000) for all primary text and interactive element outlines on default light backgrounds.
- Use Canvas White (#ffffff) as the dominant page, card, and footer background, establishing a clean, expansive aesthetic.
- Maintain a strict 0px border-radius for all components, including buttons, cards, and input fields, for a sharp, precise feel.
- Implement interactive elements primarily as ghost buttons or underlined text, with minimal visual styling beyond color and text decoration transitions.
- Structure content with ample vertical spacing, leveraging the implied section gap of 120px to create distinct content blocks.
- Employ the Onsite font for all functional text under 'display' sizes, ensuring consistency in body, navigation, and button labels.
- Utilize Avec Sharp, Ceno, Meso, Gestura, or Rework fonts exclusively for large, impactful display typography to showcase different font characteristics.

#### Avoid

- Avoid using saturated background colors or heavy fills for interactive elements; stick to the achromatic palette.
- Do not introduce shadows or significant elevation on cards or buttons; elements should appear flat against the canvas.
- Refrain from applying rounded corners to any UI elements; all corners should be sharp 0px radius.
- Do not use highly contrasting accent colors for calls to action; rely on text weight, size, and subtle border changes for emphasis.
- Avoid dense, clustered layouts; allow generous empty space around content sections and individual elements.
- Do not deviate from the specified typefaces Onsite, Avec Sharp, Ceno, Meso, Gestura, or Rework; no other typefaces are part of this system.
- Do not use generic system fonts or default browser styles for links; ensure all interactive text uses the defined ghost button or underlined styles.


### 5. Christopherdoyle

Source: https://styles.refero.design/style/e1223d32-c423-4c95-ae0a-8a6f8585e6a2  
Site: https://christopherdoyle.co  
North star: Editorial Grid, Ink on Paper  
Theme: light

#### What This Source Adds

This reference expands the Editorial Type skill by showing how Editorial Grid, Ink on Paper can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page background, primary surface for content areas, creating a clean white canvas |
| Jet Black | #000000 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Ash Gray | #ababab | neutral | Muted secondary text, subtle borders, and supporting information where a softer contrast is desired |
| Machine Orange | #ff5c26 | brand | Illustrative accent within content, serving as a vibrant brand identifier in select visuals and prominent typographic elements |

#### Typography

#### Typeface 1: Founders Grotesk X Condensed

- Role: Prominent navigation and headings requiring a strong, condensed visual presence. Its tightly tracked, bold nature establishes a distinct brand voice.
- Fallback: Bebas Neue
- Weights: 400
- Sizes: 81px
- Line height: 1.00
- Letter spacing: -0.0100em at 81px

#### Typeface 2: Die Grotesk A

- Role: Primary body text, descriptive content, and subheadings. This font provides readability and a clean, direct tone for all textual information.
- Fallback: Inter
- Weights: 400
- Sizes: 12px, 14px
- Line height: 1.21, 1.28
- Letter spacing: normal

#### Layout Reading

The page structure is a full-bleed design, allowing content to extend to the viewport edges without a maximum width constraint. The hero section is characterized by a large-scale photograph directly behind overlapping typographic elements, creating a layered effect. The overall section rhythm appears to be based on large, distinct content blocks. Navigation is a simple, high-contrast textual top bar. Content is arranged in a dynamic, offset grid, with text blocks often juxtaposed against imagery, creating an asymmetrical composition that emphasizes individual elements. The density is comfortable but with bold, prominent features.

#### Spacing Reading

- Section gap: 75px
- Element gap: 15px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button | Interactive element | Minimal interactive elements rendered as plain text or linked content, using the default text color with no background or border. This focuses interaction directly on the text while maintaining a clean aesthetic. Text is Jet Black, background is transparent, and border is 0px. |

#### Carry Forward

- Prioritize Jet Black (#000000) for all primary text and headings against Canvas White (#ffffff) backgrounds to maintain high contrast and legibility.
- Utilize Founders Grotesk X Condensed Semibold at 81px with -0.0100em letter spacing for page titles and navigation to project a bold, editorial feel.
- Employ Die Grotesk A Regular at 14px for main body text and 12px for smaller content, ensuring ample line height for comfortable reading.
- Use a default padding of 15px around content sections and between grouped elements for comfortable density.
- Reserve Machine Orange (#ff5c26) exclusively for key brand accents in illustrations or powerful typographic statements, not for functional UI elements.
- Maintain sharp, 0px border radii for all elements to reinforce the architectural and precise visual style.
- Implement motion transitions with `ease` timing function and a duration of 0.3s for interactive elements like color changes to provide smooth feedback.

#### Avoid

- Avoid using drop shadows or complex gradients on UI elements; the design emphasizes flat surfaces.
- Do not introduce additional bold, saturated colors beyond Machine Orange (#ff5c26) as primary accents; maintain the strict monochrome base.
- Refrain from using varied border radii; all corners should be sharp 0px.
- Do not deviate from the established typographic scale and font families; inconsistent typography dilutes the brand's directness.
- Avoid excessive spacing or overly sparse layouts that might break the content's structured read on the page.
- Do not use #ababab (Ash Gray) for primary calls to action or essential information; it is reserved for secondary, muted content.


## 5. Archetype Library

### 1. Magazine Feature

Use this archetype when the project needs a literary, expressive, composed, sharp, cultural, typographic feeling and the content naturally supports the magazine feature pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use typographic contrast first; color accent only for annotation, issue markers, links, or section identity.
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

The magazine feature version of Editorial Type often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 2. Typographic Portfolio

Use this archetype when the project needs a literary, expressive, composed, sharp, cultural, typographic feeling and the content naturally supports the typographic portfolio pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use typographic contrast first; color accent only for annotation, issue markers, links, or section identity.
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

The typographic portfolio version of Editorial Type often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 3. Cultural Landing Page

Use this archetype when the project needs a literary, expressive, composed, sharp, cultural, typographic feeling and the content naturally supports the cultural landing page pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use typographic contrast first; color accent only for annotation, issue markers, links, or section identity.
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

The cultural landing page version of Editorial Type often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 4. Essay Archive

Use this archetype when the project needs a literary, expressive, composed, sharp, cultural, typographic feeling and the content naturally supports the essay archive pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use typographic contrast first; color accent only for annotation, issue markers, links, or section identity.
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

The essay archive version of Editorial Type often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 5. Editorial Commerce

Use this archetype when the project needs a literary, expressive, composed, sharp, cultural, typographic feeling and the content naturally supports the editorial commerce pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use typographic contrast first; color accent only for annotation, issue markers, links, or section identity.
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

The editorial commerce version of Editorial Type often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

## 6. Consolidated Color System

The palette below merges tokens observed across the five sources. Do not use every color. Treat it as a vocabulary for building a smaller project-specific system.

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
| Ink Obsidian | #0f0f0f | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Canvas Parchment | #f7f7f7 | neutral | Page backgrounds, footer backgrounds — the primary light surface for all content |
| Ink Black | #000000 | neutral | Primary surface background, main body text, navigation elements, footer text |
| Text Gray | #212529 | neutral | General body text for readability, subtle borders |
| Medium Gray | #818181 | neutral | Muted text, secondary information, placeholder text, inactive link borders |

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
- Does the style match literary, expressive, composed, sharp, cultural, typographic?
- Are tokens consistent?
- Does the design avoid the warning: avoid illegible display text, fake magazine layouts, too many fonts, low-contrast long reading, and typographic drama that hides navigation or action?

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

Create a Editorial Type interface that feels literary, expressive, composed, sharp, cultural, typographic. Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled. Use typographic contrast first; color accent only for annotation, issue markers, links, or section identity. Build a complete, usable experience with clear hierarchy, real content structure, responsive behavior, accessible states, and a repeatable component system. avoid illegible display text, fake magazine layouts, too many fonts, low-contrast long reading, and typographic drama that hides navigation or action.

### 15.2 Landing Page Prompt

Design a Editorial Type landing page with a strong first viewport, specific product or brand promise, credible proof, clear section rhythm, and a focused conversion path. The visual identity should come from typography, spacing, color roles, imagery, and component geometry rather than generic decoration.

### 15.3 App Interface Prompt

Design a Editorial Type application screen for repeated use. Prioritize the main workflow, controls, state clarity, information density, and accessible interaction. Make the interface visually distinctive but keep operational surfaces calm enough for daily work.

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

A finished Editorial Type design should:

- feel visually specific within the first viewport
- support real content and real workflows
- have consistent tokens
- have clear interaction states
- be responsive without losing character
- be accessible enough for production use
- translate the five source references into a broader reusable skill


## Appendix 1: Editorial Type Production Pattern Expansion

### A1.1 Layout Decisions

For Editorial Type, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Editorial Type layout does not merely look literary, expressive, composed, sharp, cultural, typographic; it makes that feeling useful.

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
3. How does it express Editorial Type without harming usability?

Good Editorial Type components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A1.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A1.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Editorial Type design only works when the style survives real constraints.



## Appendix 2: Editorial Type Production Pattern Expansion

### A2.1 Layout Decisions

For Editorial Type, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Editorial Type layout does not merely look literary, expressive, composed, sharp, cultural, typographic; it makes that feeling useful.

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
3. How does it express Editorial Type without harming usability?

Good Editorial Type components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A2.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A2.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Editorial Type design only works when the style survives real constraints.



## Appendix 3: Editorial Type Production Pattern Expansion

### A3.1 Layout Decisions

For Editorial Type, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Editorial Type layout does not merely look literary, expressive, composed, sharp, cultural, typographic; it makes that feeling useful.

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
3. How does it express Editorial Type without harming usability?

Good Editorial Type components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A3.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A3.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Editorial Type design only works when the style survives real constraints.



## Appendix 4: Editorial Type Production Pattern Expansion

### A4.1 Layout Decisions

For Editorial Type, layout should begin with content priority. Decide what the user must understand first, what they must do next, and what can wait. Then make the visual style serve that sequence. A strong Editorial Type layout does not merely look literary, expressive, composed, sharp, cultural, typographic; it makes that feeling useful.

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
3. How does it express Editorial Type without harming usability?

Good Editorial Type components are consistent but not lifeless. They use token discipline, clear spacing, and state design. They do not depend on novelty for every module.

### A4.3 Content Decisions

Copy should be concrete and matched to the visual intensity. If the design is restrained, the writing can carry more attitude. If the design is expressive, the writing should become simpler and more direct.

Useful copy checks:

- Remove vague adjectives.
- Name the product, object, audience, or workflow.
- Prefer one clear verb per CTA.
- Keep helper text close to the thing it explains.
- Make error and empty states human but precise.

### A4.4 QA Decisions

Before shipping, review the page at desktop, tablet, and mobile widths. Verify text wrapping, image crops, focus states, scroll rhythm, empty states, and real content density. A Editorial Type design only works when the style survives real constraints.

