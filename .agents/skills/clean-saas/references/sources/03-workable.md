# Workable - Clean SaaS Source Notes

Source: https://styles.refero.design/style/0ab4c544-6147-4998-8365-3a0f6191e54f
Site: https://www.workable.com
North star: Clean canvas, purposeful accents
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas Porcelain | #fff5ee | neutral | Page background, primary light surface |
| White | #ffffff | neutral | Card backgrounds, elevated UI elements |
| Midnight Ink | #0f161e | neutral | Primary text, strong headings, dark UI elements |
| Harbor Mist | #333942 | neutral | Subtle text, muted links, secondary information |
| Forest Canopy | #012620 | brand | Dark section backgrounds, hero background, decorative fills |
| Deep Teal | #004038 | brand | Primary text color for navigation and headings, outlined button borders, active states |
| Fresh Teal | #00f5dc | accent | Card backgrounds, tag backgrounds, vibrant accents; Key product graphic fills, vibrant UI elements |
| Muted Sage | #00544c | brand | Secondary text, sub-brand accents, borders |
| Soft Peach | #fde8ce | accent | Informational card backgrounds, subtle highlight surfaces |
| Muted Mandarin | #ffdcbf | accent | Accent card backgrounds |
| Sky Haze | #bee9f4 | accent | Accent card backgrounds |
| Lime Glow | #d5ff4d | accent | Decorative stroke, vibrant highlighting in illustrations |
| Spring Bud | #7edcaf | accent | Highlight text, decorative fills and borders |

## Typography

#### Typeface 1: Proxima Nova

- Role: Primary UI typeface for all content including navigation, body text, headings, and buttons. Its clean, sans-serif structure provides clarity and a modern feel.
- Fallback: Open Sans
- Weights: 400, 700
- Sizes: 16px, 18px, 20px, 24px, 32px, 56px, 72px
- Line height: 1.00, 1.13, 1.14, 1.17, 1.20, 1.22, 1.25, 1.38, 1.50, 1.56, 1.75
- Letter spacing: normal

#### Typeface 2: Source Serif Pro

- Role: Used sparingly for specific body copy elements, offering a contrasting serif touch.
- Fallback: Merriweather
- Weights: 400
- Sizes: 24px
- Line height: 1.50
- Letter spacing: normal

## Layout

The page primarily uses a full-bleed structure, with content sections extending across the viewport width, though a clear implicit max-width ensures readability. Hero sections often feature a full-bleed background (e.g., Forest Canopy) with centered headings. Content typically alternates between two-column layouts (text left, image right) and centered stacks. Feature sections use a 3-column card grid. Vertical spacing between sections is consistent at 32px, creating a comfortable yet information-dense rhythm. The navigation is a persistent top bar featuring a logo, product/pricing links, and two call-to-action buttons, maintaining a fixed presence.

## Spacing

- Section gap: 32px
- Element gap: 8px
- Card padding: 32px
- Page max width: not specified
- Radius: {"cards":"16px","badges":"25px","buttons":"16px","navigation":"8px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Ghost Button | Call to action with minimal visual weight | Background transparent, text color #0f161e, 0px border-radius, no padding defined. Best for inline actions or secondary CTA when a filled button is elsewhere. |
| Secondary Ghost Button | Outlined action with rounded corners | Background transparent, text color #0f161e, 16px border-radius. Often used for navigation CTAs. |
| Default Card | Content container for features or information blocks | Background #ffffff, 16px border-radius, 32px padding on all sides. No shadow. |
| Highlight Card - Soft Peach | Emphasized content container with a warm background tint | Background #fde8ce, 16px border-radius, 32px padding on all sides. No shadow. |
| Highlight Card - Fresh Teal | Emphasized content container with a vivid background tint | Background #00f5dc, 16px border-radius, 32px padding on all sides. No shadow. |
| Highlight Card - Muted Mandarin | Emphasized content container with a warm orange background tint | Background #ffdcbf, 16px border-radius, 32px padding on all sides. No shadow. |
| Ghost Badge | Informational tag or label | Background transparent, text color #0f161e, 0px border-radius, no padding defined. Used for meta-information. |
| Navigation Link Button | Actionable link within navigation | Text color #0f161e, 16px border-radius, 0px padding. Used for 'Log in' and 'Request a demo'. |
| Contained Navigation Button | The primary call to action in the navigation bar | Background #004038, text color white, 16px border-radius. This is a filled button, contrasting with the ghost type. |

## Dos

- Use Proxima Nova for all text elements to maintain typographic consistency.
- Apply 16px border-radius to all cards and buttons for a unified, soft edge.
- Utilize Forest Canopy (#012620) for dark section backgrounds and Deep Teal (#004038) for primary action outlines or filled navigation buttons.
- Employ 32px padding for internal card content and around main section elements.
- Maintain an 8px elementGap between smaller UI components for comfortable dense layouts.
- Prioritize Canvas Porcelain (#fff5ee) as the primary page background to create a clean, light base.
- Use Fresh Teal (#00f5dc) and Soft Peach (#fde8ce) as background tints for cards to visually group or highlight content.

## Donts

- Avoid arbitrary color usage; reserve brand and accent colors for functional roles or distinct highlights, not general decoration.
- Do not introduce complex shadows or extreme elevation; the design favors flat surfaces and subtle distinctions.
- Refrain from using overly decorative fonts; stick to Proxima Nova and Source Serif Pro for a clear, modern appearance.
- Do not deviate from the established 16px and 8px border-radii; random smaller or larger radii will break visual cohesion.
- Avoid dense, unbroken blocks of text; break content with headings, lists, and visual components.
- Do not use dark backgrounds for general page content; restrict them to hero sections or distinct visual breaks.
- Refrain from using system default link colors; ensure all links use either Midnight Ink (#0f161e) or Harbor Mist (#333942) unless an explicit accent link style is defined.

## Transferable Lessons

- Read this source through the lens of Clean SaaS: Clean SaaS design is not blank minimalism. It is a discipline of making product value obvious, repeated workflows effortless, and trust signals quiet but visible.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
