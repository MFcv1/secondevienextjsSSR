# MAKR - Utilitarian Source Notes

Source: https://styles.refero.design/style/f2bf6db7-37b6-4394-be97-6bbb2c45c268
Site: https://makr.com
North star: Workshop-crafted monochrome utility.
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Ink | #1c1717 | neutral | Primary text, headings, links, borders for outlines, input text. This near-black provides strong contrast on light backgrounds |
| Canvas | #ffffff | neutral | Page backgrounds, elevated card surfaces, main content areas |
| Fog | #f0f0f0 | neutral | Subtle background for secondary sections, light dividers, input field backgrounds |
| Stone | #a9aea9 | neutral | Button backgrounds, promotional banners — a muted, desaturated gray to provide a soft interactive surface without strong chromatic emphasis |

## Typography

#### Typeface 1: Sohne Web

- Role: Primary typeface for all text content: body, headings, links, and buttons. Its clean, utilitarian nature underpins the brand's direct aesthetic.
- Fallback: Inter
- Weights: 400
- Sizes: 11px, 12px, 13px, 14px, 16px, 18px, 20px, 32px
- Line height: 1.15, 1.35, 1.40, 1.45, 1.80
- Letter spacing: 0.015em at smaller sizes, 0.03em at larger sizes

#### Typeface 2: CircularXXMonoWeb

- Role: Used sparingly for decorative links or specific callouts, lending a technical, almost machine-generated feel.
- Fallback: Space Mono
- Weights: 400
- Sizes: 13px, 20px
- Line height: 1.15
- Letter spacing: normal

## Layout

The page primarily uses a full-bleed layout, where content sections span the full width of the viewport, particularly for large image blocks and product showcases. Textual content and UI elements are typically contained within a centered max-width content area (implicitly around 1200px based on observable patterns). The hero section often features large, immersive product photography with superimposed text links or minimal headlines. Section rhythm is driven by consistent vertical spacing of 90px and alternating content blocks, sometimes featuring equal-width multi-column grids for presenting product variations or features. Navigation is a minimal top bar with left-aligned brand logo and right-aligned utility links (Account, Cart).

## Spacing

- Section gap: 90px
- Element gap: 5px
- Card padding: 12px
- Page max width: not specified
- Radius: {"all":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Filled Button | Call to action. | Background: Stone (#a9aea9), Text: Ink (#1c1717), Border: 1px solid Ink (#1c1717), Radius: 0px. Padding 16px top, 10px right, 12px bottom, 20px left. Text uses Sohne Web Regular 13px. |
| Text Input | Form text entry. | Background: transparent, Text: Ink (#1c1717), Border: 1px solid Ink (#1c1717), Radius: 0px. Padding 1px top, 2px right, 1px bottom, 2px left. |
| Product Tag Badge | Informational labels for products or promotions. | Background: transparent, Text: Ink (#1c1717). No padding or border. Used as a text-only label. |

## Dos

- Use Ink (#1c1717) for all primary text and Canvas (#ffffff) for primary backgrounds.
- Maintain a rigid 0px border-radius for all UI elements, including buttons, inputs, and cards.
- Apply Sohne Web Regular (400) for all body text, headings, and interactive elements.
- Structure layouts with ample white space, using a section gap of 90px between major content blocks.
- Utilize Stone (#a9aea9) as the background for primary interactive buttons, paired with Ink (#1c1717) text and a 1px Ink border.
- Employ Fog (#f0f0f0) sparingly for subtle background differentiation in secondary content areas or inputs.
- Reserve CircularXXMonoWeb-Regular (400) for specific decorative text elements or unique callouts, not for general content.

## Donts

- Avoid using any saturated or vivid accent colors; the palette is strictly monochrome.
- Do not introduce rounded corners or soft edges on any components.
- Refrain from using drop shadows or elevation effects; elements should appear flat on the canvas.
- Do not use gradients; all colors should be solid fills.
- Avoid decorative typography; maintain the utilitarian style of Sohne Web as the dominant font.
- Do not deviate from the specified spacing units; consistency in 5px element gaps and 90px section gaps is key.
- Do not use default browser link colors; all links must be styled with Ink (#1c1717).

## Transferable Lessons

- Read this source through the lens of Utilitarian: Utilitarian design is not ugly; it is respectful. It removes visual performance so users can complete real work quickly and confidently.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
