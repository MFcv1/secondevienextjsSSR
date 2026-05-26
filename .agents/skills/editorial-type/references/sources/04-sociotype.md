# Sociotype - Editorial Type Source Notes

Source: https://styles.refero.design/style/973332dc-4e10-4e90-85d8-3bce9c3cd3ed
Site: https://socio-type.com
North star: Editorial White Canvas
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, primary text on dark hero sections |
| Ink Black | #000000 | neutral | Primary text, borders, active states for ghost buttons and navigation, accent markings |
| Medium Gray | #818181 | neutral | Muted text, secondary information, placeholder text, inactive link borders |
| Light Gray | #d6d6d6 | neutral | Subtle dividers, borders between content sections |
| Faded Gray | #9d9d9d | neutral | Tertiary text, list item borders |

## Typography

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

## Layout

The page maintains a full-bleed structure without a fixed maximum width for its main content, allowing elements to span the entire viewport. The hero section often features a large-scale, sometimes abstract image or graphic background with centered, prominent type specimen alongside informative text. Content sections below the hero typically follow a two-column layout with text on one side and associated visuals or another type specimen on the other. Navigation is a minimalist top bar with ghosted links, and a very large, eye-catching text (Sociotype) floats over the hero graphic. Vertical rhythm is established through generous, consistent section gaps, creating a spacious, editorial flow rather than a dense grid.

## Spacing

- Section gap: 120px
- Element gap: 12px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button - Inactive | Navigational and call-to-action link styling | Text in Ink Black or Canvas White, with a 1px bottom border of the same color. No background fill or padding. This gives buttons a lightweight, integrated feel with the surrounding text. |
| Ghost Button - Muted | Secondary actions or menu items | Text in Medium Gray, with a 1px bottom border of the same color. No background fill or padding. Used for less prominent interactive elements. |
| Featured Card | Displaying prominent typefaces without visual distraction | Completely transparent background, no borders, no box shadow, with 0px border-radius. Content manages its own spacing and visual hierarchy. Features a text block with 'Onsite' typography, 14px size, Ink Black color, 0.025em letter spacing, and a 1px Ink Black bottom border for 'More Info' link. |
| Text Input | User input for forms (e.g., newsletter signup) | Transparent background, placeholder/text in Medium Gray (#818181), with a thin 1px bottom border in Medium Gray. |

## Dos

- Prioritize Ink Black (#000000) for all primary text and interactive element outlines on default light backgrounds.
- Use Canvas White (#ffffff) as the dominant page, card, and footer background, establishing a clean, expansive aesthetic.
- Maintain a strict 0px border-radius for all components, including buttons, cards, and input fields, for a sharp, precise feel.
- Implement interactive elements primarily as ghost buttons or underlined text, with minimal visual styling beyond color and text decoration transitions.
- Structure content with ample vertical spacing, leveraging the implied section gap of 120px to create distinct content blocks.
- Employ the Onsite font for all functional text under 'display' sizes, ensuring consistency in body, navigation, and button labels.
- Utilize Avec Sharp, Ceno, Meso, Gestura, or Rework fonts exclusively for large, impactful display typography to showcase different font characteristics.

## Donts

- Avoid using saturated background colors or heavy fills for interactive elements; stick to the achromatic palette.
- Do not introduce shadows or significant elevation on cards or buttons; elements should appear flat against the canvas.
- Refrain from applying rounded corners to any UI elements; all corners should be sharp 0px radius.
- Do not use highly contrasting accent colors for calls to action; rely on text weight, size, and subtle border changes for emphasis.
- Avoid dense, clustered layouts; allow generous empty space around content sections and individual elements.
- Do not deviate from the specified typefaces Onsite, Avec Sharp, Ceno, Meso, Gestura, or Rework; no other typefaces are part of this system.
- Do not use generic system fonts or default browser styles for links; ensure all interactive text uses the defined ghost button or underlined styles.

## Transferable Lessons

- Read this source through the lens of Editorial Type: Editorial type design treats typography as structure, image, and voice. The page should feel authored, not merely styled.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
