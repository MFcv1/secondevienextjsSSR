---
name: high-end-design
description: Use this skill to create premium high-end websites and product experiences using restraint, refined type, strong imagery, material cues, luxury pacing, and quiet conversion paths.
---

# High-End Design Design Skill

## 1. Source Basis

This skill consolidates five Refero references for the "High-End Design" suggested category.

| Reference | Refero Source | Site | North Star |
| --- | --- | --- | --- |
| Bang & Olufsen | https://styles.refero.design/style/27a4a4fa-4b1a-4e7e-b2c3-3e5bf57f00e5 | https://bang-olufsen.com | Gallery of precise objects. A dark, velvet-lined showcase where each product rests, spotlighted with refined exactitude. |
| BMW.com | https://styles.refero.design/style/b8899cbd-e2ca-4069-83cf-d8f8b0d71100 | https://bmw.com | Precision-engineered monochrome luxury; every detail is intentional, nothing is superfluous. |
| Ferrari | https://styles.refero.design/style/80164adf-a898-4f7c-bce7-12f3f62e1649 | https://ferrari.com | Precision engineered machinery. Like the interior of a sleek, high-performance engine, where every component is black or silver, and only critical indicators glow red. |
| True Staging | https://styles.refero.design/style/c26c462d-f219-4814-96da-c05e86f759b7 | https://www.truestaging.co.uk | Architectural blueprint on aged parchment |
| Peak Design | https://styles.refero.design/style/6f3fb64d-d4c9-4ec1-86a1-7983e5180985 | https://peakdesign.com | Photographic gallery on architectural black and white. Product precision through high-contrast typography. |

## 2. North Star

High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects.

The desired feeling is: premium, restrained, confident, tactile, editorial, composed.

The accent policy is: material or photographic accent first; chromatic UI accent only if the brand owns it.

Primary warning: avoid gold cliches, generic black luxury pages, excessive blur, fake scarcity, illegible tiny type, and product pages where the object cannot be inspected.

Use this skill as a practical design system brief. It should help an agent create a visually specific site or app, not just describe the mood. Every recommendation should translate into concrete choices: tokens, layout, typography, components, interaction, imagery, and QA.

## 3. When To Use This Skill

Use High-End Design when:

- the user asks for a visual direction matching premium, restrained, confident, tactile, editorial, composed
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

### 1. Bang & Olufsen

Source: https://styles.refero.design/style/27a4a4fa-4b1a-4e7e-b2c3-3e5bf57f00e5  
Site: https://bang-olufsen.com  
North star: Gallery of precise objects. A dark, velvet-lined showcase where each product rests, spotlighted with refined exactitude.  
Theme: mixed

#### What This Source Adds

This reference expands the High-End Design skill by showing how Gallery of precise objects. A dark, velvet-lined showcase where each product rests, spotlighted with refined exactitude. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Indigo | #060daa | brand | Footer background, primary accent for deep sections â€“ creating a luxurious, immersive foundation. |
| Carbon Black | #191817 | neutral | Dominant text color for headings and body content on light backgrounds, input borders â€“ provides stark contrast and grounded presence. |
| Barely White | #fcfaee | neutral | Primary text color on dark backgrounds, selected button text â€“ a creamy off-white that softens the high contrast. |
| Ash Gray | #555555 | neutral | Secondary text, subtle link color â€“ offers a muted informational tone against white. |
| Pure White | #ffffff | neutral | Page backgrounds, card backgrounds, input backgrounds â€“ provides clean, expansive canvas. |
| Pale Silver | #e5e5e5 | neutral | Subtle border colors for inputs â€“ an almost imperceptible divider. |
| Pure Black | #000000 | neutral | Primary icon color, borders on ghost buttons â€“ a hard, crisp edge or fill. |

#### Typography

#### Typeface 1: BeoSupreme

- Role: Primary typeface for all headings, body text, and UI elements. Its broad range of weights and precise letter-spacing across sizes is a core visual identity feature, conveying understated luxury.
- Fallback: Open Sans
- Weights: 400, 500, 700
- Sizes: 12px, 14px, 16px, 24px, 36px
- Line height: 1.00, 1.15, 1.25, 1.33, 1.43, 1.50, 1.63, 1.67, 1.71, 2.19
- Letter spacing: -0.056em at 36px, -0.014em at 24px, 0.006em at 16px, 0.007em at 14px, 0.008em at 12px, then other specific values for a finely tuned optical balance

#### Layout Reading

The page uses a mixed layout approach, blending full-bleed sections with constrained content. The hero prominently features a full-bleed dark background ('Midnight Indigo') with a large, centered product image and left-aligned headline/CTA. Subsequent sections alternate between full-bleed white backgrounds for product listings (often displaying items in a clean, centered grid of 4) and some potentially full-bleed sections with strong, singular background colors like the red observed. Content is generally centered within a comfortable maximum width when not full-bleed. Vertical rhythm is maintained by consistent spacing between sections (around 48px), creating a spacious and unhurried browsing experience. The navigation is a minimalist sticky top bar, providing persistent access without visual clutter.

#### Spacing Reading

- Section gap: 48px
- Element gap: 4px
- Card padding: 0px
- Page max width: not specified
- Radius: {"badges":"2px","buttons":"40px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Product Cards â€” Explore Superventas |  | <div style="--color-midnight-indigo:#060daa;--color-carbon-black:#191817;--color-barely-white:#fcfaee;--color-ash-gray:#555555;--color-pure-white:#ffffff;--color-pale-silver:#e5e5e5;--color-pure-black:#000000;--font-beosupreme:'Open Sans',sans-serif;font-family:var(--font-beosupreme);background:var(--color-pure-white);padding:48px 24px;width:600px;box-sizing:border-box;"><h2 style="font-family:var(--font-beosupreme);font-size:24px;font-weight:400;letter-spacing:-0.014px;line-height:1.25;color:var(--color-carbon-black);text-align:center;margin:0 0 40px 0;">Explore nuestros superventas</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;"><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#f5f0eb;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:120px;height:110px;background:linear-gradient(135deg,#c9926b 30%,#191817 30%);border-radius:4px;opacity:0.85;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beo Grace</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">1200 â‚¬</p></div><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#f0efed;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:130px;height:60px;background:#3a3a3a;border-radius:3px;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beosound Premiere</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">3900 â‚¬</p></div><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#f5f0e8;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:100px;height:100px;background:linear-gradient(135deg,#c9926b,#b07d56);border-radius:50%;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beosound A1 de 3.Âª generaciÃ³n</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">349 â‚¬</p></div><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#eeeded;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:50px;height:130px;background:linear-gradient(180deg,#555 0%,#222 100%);border-radius:4px 4px 0 0;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beosound 2</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">3300 â‚¬</p></div></div></div> |
| Hero CTA â€” Beo Grace |  | <div style="--color-midnight-indigo:#060daa;--color-carbon-black:#191817;--color-barely-white:#fcfaee;--color-ash-gray:#555555;--color-pure-white:#ffffff;--color-pale-silver:#e5e5e5;--color-pure-black:#000000;--font-beosupreme:'Open Sans',sans-serif;font-family:var(--font-beosupreme);background:#0a0d2e;width:600px;box-sizing:border-box;padding:0;position:relative;overflow:hidden;"><div style="width:100%;height:340px;background:linear-gradient(135deg,#0c1260 0%,#060daa 40%,#0a0a50 100%);display:flex;align-items:center;justify-content:center;position:relative;"><div style="position:absolute;right:60px;top:30px;width:220px;height:160px;background:linear-gradient(145deg,#c9926b 0%,#a8724a 60%,#8a5c38 100%);border-radius:12px;transform:rotate(-8deg);opacity:0.9;"></div><div style="position:absolute;right:110px;top:140px;width:30px;height:110px;background:linear-gradient(180deg,#c9926b,#a8724a);border-radius:4px;transform:rotate(5deg);"><div style="width:22px;height:22px;background:#191817;border-radius:50%;margin:4px auto;"></div></div><div style="position:absolute;right:170px;top:180px;width:30px;height:110px;background:linear-gradient(180deg,#c9926b,#a8724a);border-radius:4px;transform:rotate(-3deg);"><div style="width:22px;height:22px;background:#191817;border-radius:50%;margin:4px auto;"></div></div><div style="position:absolute;left:0;bottom:0;padding:32px 36px;"><h1 style="font-family:var(--font-beosupreme);font-size:28px;font-weight:400;letter-spacing:-0.04px;line-height:1.15;color:var(--color-barely-white);margin:0 0 10px 0;">Beo Grace</h1><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:400;color:var(--color-barely-white);margin:0 0 24px 0;letter-spacing:0.007px;line-height:1.43;opacity:0.9;">100 aÃ±os de artesanÃ­a. Un futuro icono.</p><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-barely-white);background:transparent;border:1px solid var(--color-barely-white);border-radius:40px;padding:10px 28px;text-decoration:none;line-height:1.43;">Disponible en Honey Tone</a></div></div></div> |
| Button Group â€” B&O Style System |  | <div style="--color-midnight-indigo:#060daa;--color-carbon-black:#191817;--color-barely-white:#fcfaee;--color-ash-gray:#555555;--color-pure-white:#ffffff;--color-pale-silver:#e5e5e5;--color-pure-black:#000000;--font-beosupreme:'Open Sans',sans-serif;font-family:var(--font-beosupreme);background:var(--color-pure-white);padding:48px 40px;width:600px;box-sizing:border-box;"><p style="font-family:var(--font-beosupreme);font-size:12px;font-weight:400;letter-spacing:0.008px;color:var(--color-ash-gray);margin:0 0 28px 0;text-transform:uppercase;">Elementos de interfaz</p><div style="display:flex;flex-direction:column;gap:32px;"><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">Primary CTA</span><div><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-barely-white);background:var(--color-carbon-black);border-radius:40px;padding:10px 32px;text-decoration:none;line-height:1.43;border:1px solid var(--color-carbon-black);">Comprar ahora</a></div></div><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">Ghost Button</span><div><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-carbon-black);background:transparent;border-radius:40px;padding:10px 32px;text-decoration:none;line-height:1.43;border:1px solid var(--color-carbon-black);">Disponible en Honey Tone</a></div></div><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">Text Link (on dark)</span><div style="background:var(--color-carbon-black);padding:16px 20px;display:inline-block;"><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-barely-white);background:transparent;text-decoration:none;line-height:1.43;border-bottom:1px solid var(--color-barely-white);padding:4px 0;">Ver todos los productos</a></div></div><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">New Product Badge</span><div style="display:flex;gap:12px;align-items:center;"><span style="display:inline-block;font-family:var(--font-beosupreme);font-size:12px;font-weight:400;color:var(--color-carbon-black);background:var(--color-pure-white);border:1px solid var(--color-pale-silver);border-radius:2px;padding:4px 8px;letter-spacing:0.008px;line-height:1.43;">Nuevo</span><span style="display:inline-block;font-family:var(--font-beosupreme);font-size:12px;font-weight:400;color:var(--color-barely-white);background:var(--color-carbon-black);border-radius:2px;padding:4px 8px;letter-spacing:0.008px;line-height:1.43;">EdiciÃ³n Limitada</span></div></div></div></div> |
| Primary Button (Honey Tone CTA) | Call to action | Rounded pill button with 'Carbon Black' (#191817) background and 'Barely White' (#fcfaee) text. Has a 40px border-radius, 8px vertical padding, and 32px horizontal padding. Uses BeoSupreme text. |
| Ghost Button (Menu/Search) | Navigation/Utility | Transparent background with 'Carbon Black' (#000000) text and border. No border-radius, 0px padding. Used for minimal UI controls. |
| Text Link Button | Tertiary action/Navigation | Transparent background with 'Barely White' (#fcfaee) text and a 'Barely White' (#fcfaee) bottom border of 1px. 4px vertical padding, 0px horizontal padding. Typically used in dark sections like the hero or footer. |
| Feature Card | Product display | A completely transparent card with no padding, border, or shadow. It acts as a container for product images and descriptive text. Text is 'Carbon Black' (#191817) and headings use BeoSupreme. |
| Input Field | User entry | White background (#ffffff) with 'Carbon Black' (#191817) text and a 1px 'Carbon Black' (#191817) bottom border. No border-radius. 1px vertical padding and 2px right padding. |
| New Product Badge | Highlight new items | Rectangular badge with 'Pure White' (#ffffff) background and 'Carbon Black' (#191817) text. Has a 2px border-radius, 4px vertical padding, and 8px horizontal padding. Uses BeoSupreme text. |

#### Carry Forward

- Prioritize the custom 'BeoSupreme' font for all textual content, leveraging its unique character and precise letter-spacing.
- Use 'Midnight Indigo' (#060daa) exclusively for foundational elements like the footer to establish a luxurious, deep anchor.
- Maintain a clear visual hierarchy by contrasting 'Carbon Black' (#191817) text on light backgrounds (#ffffff, #fcfaee) and 'Barely White' (#fcfaee) on dark backgrounds (#060daa).
- Employ the 40px border-radius strictly for primary CTA buttons, ensuring they stand out as the sole 'soft' element.
- Utilize generous negative space around product imagery and text blocks to convey a sense of premium quality and focus, with section gaps around 48px.
- Ensure all interactive elements, especially primary CTAs, meet a minimum contrast ratio of 4.5:1 against their background.
- Use a subtle 1px border for ghost button states and text links to provide definition without visual weight.

#### Avoid

- Do not introduce additional font families; 'BeoSupreme' defines the typographic identity.
- Avoid using multiple accent colors; 'Midnight Indigo' is reserved for specific, prominent sectional backgrounds.
- Do not deviate from the established border-radius values (0px, 2px, 40px); rounded corners are intentional and scarce.
- Do not use box-shadows; elevation is handled through background color changes and spatial separation.
- Avoid decorative elements or busy backgrounds; the aesthetic emphasizes product clarity and clean UI.
- Do not create dense content blocks; the comfortable density principle with a 4px base unit should be consistently applied.
- Never use the browser default blue for links; control all link colors with 'Carbon Black', 'Ash Gray', or 'Barely White'.


### 2. BMW.com

Source: https://styles.refero.design/style/b8899cbd-e2ca-4069-83cf-d8f8b0d71100  
Site: https://bmw.com  
North star: Precision-engineered monochrome luxury; every detail is intentional, nothing is superfluous.  
Theme: light

#### What This Source Adds

This reference expands the High-End Design skill by showing how Precision-engineered monochrome luxury; every detail is intentional, nothing is superfluous. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Obsidian | #262626 | neutral | Primary text, interactive elements, navigation links, button text â€” forms the core dark against light contrast. |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, prominent navigational elements â€” establishes the primary visual canvas. |
| Graphite Grey | #bbbbbb | neutral | Secondary navigation text, subtle borders, contextual information â€” provides sufficient contrast on dark surfaces while appearing subdued on light ones. |
| Frost | #f1f1f1 | neutral | Subtle background accents, dividers â€” provides a very light contrast against Canvas White. |
| Deep Space | #262626 | neutral | Footer background â€” anchors the page with a solid, dark foundation. |
| Electric Blue | #1c69d4 | accent | Interactive highlights, focus states â€” a vibrant, technical accent for user interaction. |

#### Typography

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

#### Layout Reading

The page structure is primarily max-width contained, but hero sections often utilize full-bleed photography. The main content areas tend to be centered. The hero uses a background image with text overlay, establishing an immediate brand impression. Section rhythm is clear, using a dominant white background for content with a distinct, dark footer (#262626) that grounds the page. Content is arranged in a fluid, stacked manner, often with large images followed by textual information, leading to multi-column layouts within the footer. The density is spacious, with significant white space around content, allowing elements to breathe. Navigation consists of a sticky top bar with branding and primary links, along with a comprehensive multi-column footer.

#### Spacing Reading

- Section gap: 40px
- Element gap: 8px
- Card padding: 16px
- Page max width: not specified
- Radius: {"buttons":"0px","default":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| CTA Link Button â€” 'Find your BMW' |  | <div style="--color-obsidian:#262626;--color-canvas-white:#ffffff;--color-graphite-grey:#bbbbbb;--color-frost:#f1f1f1;--color-deep-space:#262626;--color-electric-blue:#1c69d4;--font-bmwtypenextlatin:'Open Sans',sans-serif;--font-bmwtypenextlatin-light:'Open Sans',sans-serif;--spacing-4:4px;--spacing-8:8px;--spacing-12:12px;--spacing-16:16px;--spacing-20:20px;--spacing-24:24px;--spacing-40:40px;--spacing-56:56px;--spacing-100:100px; background:var(--color-canvas-white);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--spacing-56) var(--spacing-40);font-family:var(--font-bmwtypenextlatin);width:600px;box-sizing:border-box;"><h1 style="font-family:var(--font-bmwtypenextlatin-light);font-weight:300;font-size:60px;line-height:1.3;color:var(--color-obsidian);margin:0 0 var(--spacing-24) 0;text-align:center;letter-spacing:normal;text-transform:uppercase;">ALL BMW MODELS</h1><a href="#" style="display:inline-flex;align-items:center;gap:var(--spacing-8);font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-obsidian);text-decoration:none;border:none;background:none;padding:0 var(--spacing-12);border-radius:0;line-height:1.63;cursor:pointer;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;"><path d="M4.5 1.5L10.5 7L4.5 12.5" stroke="#262626" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>Find your BMW</a></div> |
| Language Selector Bar |  | <div style="--color-obsidian:#262626;--color-canvas-white:#ffffff;--color-graphite-grey:#bbbbbb;--color-frost:#f1f1f1;--color-deep-space:#262626;--color-electric-blue:#1c69d4;--font-bmwtypenextlatin:'Open Sans',sans-serif;--spacing-16:16px;--spacing-20:20px;--spacing-24:24px;--spacing-40:40px; background:var(--color-deep-space);padding:var(--spacing-24) var(--spacing-40);font-family:var(--font-bmwtypenextlatin);width:600px;box-sizing:border-box;"><div style="display:flex;flex-wrap:wrap;gap:var(--spacing-16);align-items:center;"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">English</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">Deutsch</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">Italiano</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">FranÃ§ais</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">EspaÃ±ol</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;border-radius:0;padding:0;">æ—¥æœ¬èªž</a></div></div> |
| Footer Link Columns |  | <div style="--color-obsidian:#262626;--color-canvas-white:#ffffff;--color-graphite-grey:#bbbbbb;--color-frost:#f1f1f1;--color-deep-space:#262626;--color-electric-blue:#1c69d4;--font-bmwtypenextlatin:'Open Sans',sans-serif;--spacing-4:4px;--spacing-8:8px;--spacing-12:12px;--spacing-16:16px;--spacing-20:20px;--spacing-24:24px;--spacing-40:40px;--spacing-56:56px; background:var(--color-deep-space);padding:var(--spacing-40);font-family:var(--font-bmwtypenextlatin);width:600px;box-sizing:border-box;"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--spacing-40);"><div><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);margin:0 0 var(--spacing-16) 0;line-height:1.63;padding-bottom:var(--spacing-8);border-bottom:1px solid #444;">Quick Links</p><div style="display:flex;flex-direction:column;gap:var(--spacing-8);"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Home</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW in your country</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Group Careers</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">REACH Regulation</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Compatibility Check</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Parking Test Car</a></div></div><div><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);margin:0 0 var(--spacing-16) 0;line-height:1.63;padding-bottom:var(--spacing-8);border-bottom:1px solid #444;">More BMW Websites</p><div style="display:flex;flex-direction:column;gap:var(--spacing-8);"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW M</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW M Motorsport</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Golfsport</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Welt</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Group Classic</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">BMW Group</a></div></div><div><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:700;color:var(--color-canvas-white);margin:0 0 var(--spacing-16) 0;line-height:1.63;padding-bottom:var(--spacing-8);border-bottom:1px solid #444;">BMW.com</p><div style="display:flex;flex-direction:column;gap:var(--spacing-8);"><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Contact</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Cookies</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Imprint</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Legal Notice / Data protection</a><a href="#" style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);text-decoration:none;line-height:1.63;">Accessibility</a></div></div></div><div style="margin-top:var(--spacing-40);border-top:1px solid #444;padding-top:var(--spacing-20);"><p style="font-family:var(--font-bmwtypenextlatin);font-size:16px;font-weight:400;color:var(--color-graphite-grey);margin:0;line-height:1.63;">Â© BMW AG 2026</p></div></div> |
| Text Link Button | Primary Call to Action | Ghost-style button with no background, Obsidian text (#262626), zero border radius, and minimal horizontal padding (12px). Emphasizes action through text rather than a contained shape. |
| Navigation Link | Primary Navigation | Text in Obsidian (#262626) by default, switching to Graphite Grey (#bbbbbb) in the footer. Line height of 1.63 and zero padding, relying on surrounding layout for spacing, with zero border radius. |
| Heading Text Badge | Section Labels | Descriptive text in Obsidian (#262626) with no background or borders, often used to introduce sections or categories with zero padding and border radius. |

#### Carry Forward

- Prioritize BMWTypeNextLatin for all text elements to maintain brand consistency.
- Use Canvas White (#ffffff) as the dominant background color for main content areas.
- Apply Obsidian (#262626) for primary text and interactive elements to ensure high contrast.
- Utilize BMWTypeNextLatin Light weight 300 at 60px for prominent headings to create an impactful yet refined statement.
- Maintain zero border-radius on all components to preserve the precise, angular aesthetic.
- Employ Electric Blue (#1c69d4) sparingly for interactive highlights and focus states, ensuring it stands out against the monochrome palette.

#### Avoid

- Avoid using saturated or chromatic colors outside of the designated Electric Blue accent.
- Do not introduce rounded corners or soft shapes, as the aesthetic is defined by sharp precision.
- Refrain from heavy shadows or overt elevation a primary means of drawing attention; rely on typography and strong contrast.
- Do not deviate from the BMWTypeNextLatin font family; consistency is key to the brand's visual identity.
- Avoid excessive padding around interactive textual elements like links; use 0-12px as seen in button examples.


### 3. Ferrari

Source: https://styles.refero.design/style/80164adf-a898-4f7c-bce7-12f3f62e1649  
Site: https://ferrari.com  
North star: Precision engineered machinery. Like the interior of a sleek, high-performance engine, where every component is black or silver, and only critical indicators glow red.  
Theme: mixed

#### What This Source Adds

This reference expands the High-End Design skill by showing how Precision engineered machinery. Like the interior of a sleek, high-performance engine, where every component is black or silver, and only critical indicators glow red. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Obsidian Black | #000000 | neutral | Page backgrounds, navigation bars, dramatic photographic backdrops for product showcases. |
| Polar White | #ffffff | neutral | Primary text, prominent page sections, content cards, and interactive elements â€“ providing crisp contrast against dark backgrounds. |
| Shadow Graphite | #181818 | neutral | Secondary text in navigation, footer elements, and subtle background shading to create depth without overt shadows. |
| Steel Gray | #303030 | neutral | Minor dividers, borders, and backgrounds for less prominent UI elements, establishing a subtle hierarchy within dark themes. |
| Ash Mist | #8f8f8f | neutral | Supportive text, icon fills, and subtle hints where softer contrast is desired, such as secondary information or disabled states. |
| Rosso Corsa | #FF0000 | brand | Accent color for interactive elements, progress indicators, underlines on active navigation items - the iconic visual signature of the brand, used sparingly for impact. |

#### Typography

#### Typeface 1: custom

- Role: Primary typeface for all body text, navigational links, buttons, and footers. The intentional wide letter-spacing across all sizes is a distinctive characteristic, giving each word room to breathe and contributing to the premium, measured feel.
- Fallback: Arial, Helvetica, sans-serif
- Weights: 
- Sizes: 11px, 12px, 13px
- Line height: 1.27, 1.50, 1.78, 2.00
- Letter spacing: 0.0150em, 0.0220em, 0.0280em, 0.0830em, 0.0910em

#### Layout Reading

The page exhibits a mixed layout: the hero is a full-bleed dark video/image with centered text and call to action. Subsequent sections alternate between dark and light backgrounds, using a flexible, full-width model. Content is primarily arranged in two-column layouts, often with text on one side and a large, impactful image on the other. Vertical spacing between logical sections is consistent, around `48px`. The overall impression is information-rich but carefully composed, guiding the eye through high-impact visuals and concise text blocks.

#### Spacing Reading

- Section gap: 48px
- Element gap: 10px
- Card padding: 20px
- Page max width: not specified
- Radius: {"all":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Hero Slide Indicator & CTA |  | <div style="--color-obsidian-black:#000000;--color-polar-white:#ffffff;--color-shadow-graphite:#181818;--color-steel-gray:#303030;--color-ash-mist:#8f8f8f;--color-rosso-corsa:#FF0000;--font-custom:Arial,Helvetica,sans-serif;background:var(--color-obsidian-black);width:600px;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px 50px;box-sizing:border-box;font-family:var(--font-custom);"><p style="color:var(--color-polar-white);font-family:var(--font-custom);font-size:13px;font-weight:400;letter-spacing:0.0830em;margin:0 0 14px 0;line-height:1.78;">Racing</p><h1 style="color:var(--color-polar-white);font-family:var(--font-custom);font-size:36px;font-weight:700;letter-spacing:0.0830em;margin:0 0 32px 0;text-align:center;line-height:1.2;text-transform:uppercase;">Scuderia Ferrari</h1><div style="display:flex;align-items:center;gap:14px;margin-bottom:48px;"><span style="color:var(--color-polar-white);font-family:var(--font-custom);font-size:11px;font-weight:400;letter-spacing:0.0830em;text-transform:uppercase;">Descubrir</span><button style="width:36px;height:36px;border-radius:50%;border:1px solid var(--color-polar-white);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2L10 7L5 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><div style="display:flex;align-items:center;gap:10px;"><div style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--color-rosso-corsa);background:transparent;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);"></div></div></div> |
| News Feature Card |  | <div style="--color-obsidian-black:#000000;--color-polar-white:#ffffff;--color-shadow-graphite:#181818;--color-steel-gray:#303030;--color-ash-mist:#8f8f8f;--color-rosso-corsa:#FF0000;--font-custom:Arial,Helvetica,sans-serif;background:var(--color-polar-white);width:600px;box-sizing:border-box;font-family:var(--font-custom);display:flex;flex-direction:row;align-items:stretch;"><div style="flex:1;padding:44px 32px 44px 40px;display:flex;flex-direction:column;justify-content:center;"><h2 style="font-family:var(--font-custom);font-size:22px;font-weight:800;letter-spacing:0.0280em;color:var(--color-obsidian-black);margin:0 0 20px 0;line-height:1.27;text-transform:uppercase;">Ferrari at Imola for Opening Round of the 2026 FIA WEC</h2><p style="font-family:var(--font-custom);font-size:13px;font-weight:400;color:var(--color-shadow-graphite);letter-spacing:0.0150em;line-height:1.78;margin:0 0 28px 0;">Ferrari returns to the top class of endurance racing with the 6 Hours of Imola, opening the 2026 season in front of a home crowd more than five months after last season's finale, which saw the Maranello Manufacturer crowned FIA WEC World Champions.</p><div style="display:flex;align-items:center;gap:12px;"><span style="font-family:var(--font-custom);font-size:11px;font-weight:400;letter-spacing:0.0830em;color:var(--color-obsidian-black);text-transform:uppercase;">Leer mÃ¡s</span><button style="width:32px;height:32px;border-radius:50%;border:1px solid var(--color-obsidian-black);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2L9 6L4 10" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div><div style="width:220px;flex-shrink:0;background:var(--color-steel-gray);position:relative;overflow:hidden;"><div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 40%,#111 100%);display:flex;align-items:center;justify-content:center;"><div style="width:160px;height:80px;background:var(--color-rosso-corsa);opacity:0.18;border-radius:0;"></div></div></div></div> |
| Navigation Link Group & Carousel Pagination |  | <div style="--color-obsidian-black:#000000;--color-polar-white:#ffffff;--color-shadow-graphite:#181818;--color-steel-gray:#303030;--color-ash-mist:#8f8f8f;--color-rosso-corsa:#FF0000;--font-custom:Arial,Helvetica,sans-serif;font-family:var(--font-custom);width:600px;box-sizing:border-box;"><div style="background:var(--color-obsidian-black);padding:0 24px;display:flex;align-items:center;gap:32px;height:64px;"><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid var(--color-rosso-corsa);line-height:1.5;">Racing</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">Sports Cars</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">Colecciones</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">Experiencias</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">About Us</a></div><div style="background:var(--color-polar-white);padding:24px 24px;display:flex;align-items:center;gap:12px;"><div style="width:26px;height:26px;border-radius:50%;border:1.5px solid var(--color-rosso-corsa);background:transparent;flex-shrink:0;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);flex-shrink:0;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);flex-shrink:0;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);flex-shrink:0;"></div><div style="flex:1;height:1px;background:var(--color-ash-mist);margin:0 8px;"></div><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:11px;font-weight:400;color:var(--color-obsidian-black);letter-spacing:0.0830em;text-transform:uppercase;">Ver todas las noticias</a></div></div> |
| Ghost Navigation Link | Primary navigation item | Text link with no background. Text color `Polar White` (#ffffff), `Body-Font` weight 400, size 13px. On hover/active, a 1px `Rosso Corsa` (#FF0000) bottom border appears. Padding is 5px top/bottom, 0px left/right. Letter spacing 0.0830em. |
| Hero Action Arrow Button | Call to action in hero section | Transparent background button with `Polar White` (#ffffff) text and an integrated arrow icon. No border-radius, `Body-Font` weight 400. Text is uppercase. Associated with a line-based active state indicator (e.g., a short red underline appearing on interaction). |
| Minimal Pill Indicator | Carousel/slider pagination | Small, horizontally oriented pills. Inactive indicators are thin gray outlines or filled with `Ash Mist` (#8f8f8f). Active indicator is a `Rosso Corsa` (#FF0000) filled pill, signaling current slide without heavy branding. |
| Feature Card Headline | Editorial content headline | Large, bold `Polar White` (#ffffff) text using the `Body-Font` with wide letter-spacing, set against a dark background or on a `Polar White` content card. Accompanied by a smaller `Body-Font` body text. |
| Body Text Paragraph | Standard informational text | Light gray `Ash Mist` (#8f8f8f) or `Polar White` (#ffffff) body text at 12px with a line-height of 1.78 to 2.00, and letter-spacing of 0.0150em or 0.0220em, providing comfortable readability on both dark and light sections. |
| Footer Link | Secondary navigation and informational links | `Shadow Graphite` (#181818) text on a dark background, or `Polar White` (#ffffff) text where more emphasis is needed. Uses `Body-Font` at 11px or 12px, with a generous line-height and medium letter-spacing. |

#### Carry Forward

- Do utilize a high-contrast palette of `Obsidian Black` (#000000) and `Polar White` (#ffffff) as the primary background and text colors to maintain a dramatic and luxurious feel.
- Do apply `Rosso Corsa` (#FF0000) as the sole accent color, reserving it exclusively for interactive elements and key indicators to command attention.
- Do apply custom `Body-Font` with generous letter-spacing (e.g., 0.0830em for navigation) for headlines and navigation to emphasize precision and exclusivity.
- Do use a 'comfortably spaced' rhythm with `elementGap` of `10px` and `cardPadding` of `20px` to maintain order and focus.
- Do maintain sharp, `0px` radius on all interactive elements and containers to reinforce the engineered aesthetic.
- Do use the `Shadow Graphite` (#181818) and `Steel Gray` (#303030) as subtle surface variations rather than relying on drop shadows for depth.

#### Avoid

- Don't introduce additional chromatic colors; the system is built on a black-and-white foundation with a single `Rosso Corsa` accent.
- Don't use rounded corners or soft edges on any components; the design demands sharp, precise lines (`0px` radius).
- Don't use drop shadows for elevation; rely on shifts in neutral background colors (`#000000`, `#181818`, `#ffffff`) to create hierarchy and depth.
- Don't use tight letter-spacing; the custom `Body-Font`'s inherent wide spacing is a core part of the brand's typographic identity.
- Don't embed images with external context; use tightly cropped, abstract, or studio-shot product imagery that isolates the subject.
- Don't deviate from the `Body-Font` for text elements; the system relies on this single typeface for typographic consistency and brand identity.


### 4. True Staging

Source: https://styles.refero.design/style/c26c462d-f219-4814-96da-c05e86f759b7  
Site: https://www.truestaging.co.uk  
North star: Architectural blueprint on aged parchment  
Theme: dark

#### What This Source Adds

This reference expands the High-End Design skill by showing how Architectural blueprint on aged parchment can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Blueprint Canvas | #111111 | neutral | Page background, primary dark text, subtle borders â€” grounds the design in a deep, almost charcoal base |
| Parchment White | #f5efeb | neutral | Primary light text, ghost button borders, accents within a darker canvas â€” suggests a tactile, natural paper texture |
| Amber Peach | #f1b497 | brand | Orange outline accent for tags, dividers, and focused UI edges. Do not promote it to the primary CTA color |

#### Typography

#### Typeface 1: Roslindale

- Role: Expressive display headings â€” its delicate weight and generous size at 158px create an authoritative, almost monumental statement of luxury.
- Fallback: Playfair Display
- Weights: 300
- Sizes: 158px
- Line height: 1.00
- Letter spacing: -0.0200em

#### Typeface 2: Alliance

- Role: Functional text including body, navigation, and button labels â€” its versatility across weights and compact letter spacing ensures clear information delivery.
- Fallback: Inter
- Weights: 400, 500, 600
- Sizes: 9px, 12px, 14px, 28px
- Line height: 1.00, 1.15, 1.20, 1.30, 1.50, 1.71
- Letter spacing: -0.0200em, 0.0200em, 0.0230em, 0.0600em, 0.1000em

#### Layout Reading

The page employs a full-bleed layout, particularly for the hero section, which features a large, centered headline over an architectural graphic background. Content is centrally aligned within this wide canvas, using large, negative space. The header features right-aligned navigation items, subtly outlined. Subsequent content sections appear to follow a consistent vertical rhythm, though specific sectioning is less explicit than a banded approach; instead, it relies on visual weight and typography.

#### Spacing Reading

- Section gap: 53px
- Element gap: 8px
- Card padding: 21px
- Page max width: not specified
- Radius: {"buttons":"80px","otherElements":"80px","navigationItems":"80px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Hero Headline | Primary page title | Uses Roslindale at 158px, weight 300, with a letter-spacing of -0.0200em, in Parchment White (#f5efeb). Placed centrally, defining the page's grand statement. |
| Ghost Navigation Item | Secondary navigation and non-primary actions | Text in Alliance, Parchment White (#f5efeb), 9px, weight 400. Has a 1px border in Parchment White (#f5efeb) with an 80px border-radius, creating a pill shape. Padding is 7.7px vertical and 21px horizontal. Transparent background. |
| Primary Action Button | Call to action button for 'Our Work' | Filled with Amber Peach (#f1b497) background. Text is Alliance, Parchment White (#f5efeb), 9px, weight 400. Features an 80px border-radius. Padding is 7.7px vertical and 21px horizontal. Appears as a pill-shaped element. |
| Body Text | Standard informative text | Uses Alliance, Blueprint Canvas (#111111) or Parchment White (#f5efeb) depending on section background, at 14px, weight 400. Tight letter spacing for efficient reading. |
| Footer Detail Text | Copyright and minor informational text | Alliance, 9px, weight 400, in Parchment White (#f5efeb). |

#### Carry Forward

- Always use Blueprint Canvas (#111111) for page backgrounds and primary dark text.
- Apply Parchment White (#f5efeb) for primary light text on dark backgrounds and for ghost button borders.
- Reserve Amber Peach (#f1b497) for key accents, selected navigation highlights, and the primary 'Our Work' button fill.
- Employ Roslindale (sub: Playfair Display) for large, expressive headlines (158px, weight 300, ls -0.0200em) to convey gravitas.
- Utilize Alliance (sub: Inter) for all functional text, varying weights (400, 500, 600) and sizes (9px, 12px, 14px) as needed for hierarchy.
- Implement an 80px border-radius for all interactive elements like buttons and navigation items to maintain a consistent soft, pill-like shape.
- Maintain a compact spacing density, with an element gap of 8px and section vertical spacing of 53px.

#### Avoid

- Do not introduce bright, vibrant colors; maintain the muted, earthy palette of Blueprint Canvas, Parchment White, and Amber Peach.
- Avoid sharp, angular corners; consistently apply the 80px border-radius for all applicable UI elements.
- Do not use generic system fonts for display headings; Roslindale's unique character is central to the brand's sophisticated feel.
- Avoid excessive use of elevation or heavy shadows; the system relies on subtle borders and color shifts for separation.
- Do not deviate from the defined letter-spacing values for Alliance; precise tracking is essential for its compact appearance.
- Do not use Parchment White (#f5efeb) on amber backgrounds due to insufficient contrast (1.6:1 ratio).
- Avoid making any element overtly 'loud'; the design emphasizes understated luxury through subtle contrasts and refined details.


### 5. Peak Design

Source: https://styles.refero.design/style/6f3fb64d-d4c9-4ec1-86a1-7983e5180985  
Site: https://peakdesign.com  
North star: Photographic gallery on architectural black and white. Product precision through high-contrast typography.  
Theme: light

#### What This Source Adds

This reference expands the High-End Design skill by showing how Photographic gallery on architectural black and white. Product precision through high-contrast typography. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Absolute Zero | #000000 | neutral | Hero backgrounds, card backgrounds, primary text on light backgrounds, strong navigational elements; provides maximum contrast and product focus. |
| Cloud White | #ffffff | neutral | Page backgrounds, button backgrounds, text on dark backgrounds; establishes a clean, open canvas. |
| Forest Black | #1a211e | neutral | Primary body text, link text, borders, input text; a very dark, slightly desaturated black that offers strong readability without harshness. |
| Ash Gray | #eef1f0 | neutral | Section separators, subtle button backgrounds, input backgrounds; provides soft visual breaks. |
| Charcoal Black | #0c0c0c | neutral | Input text, secondary text on light backgrounds. |
| Graphite | #606562 | neutral | Secondary text, subtle icon fills, supporting UI elements. |
| Slate Border | #cccfcd | neutral | Input borders, subtle dividers; defines boundaries without visual weight. |
| Badge Gray | #4e4e4e | neutral | Content badge backgrounds; sets them apart without being an overt accent. |
| Alert Red | #cc2e39 | accent | Informational badges, perhaps used sparingly for error states or urgent CTAs, offering a sharp contrast to the neutral palette. |

#### Typography

#### Typeface 1: Exposure-10

- Role: Display headlines and main hero statements; its high-contrast serif form provides an immediate sense of gravitas and craftsmanship.
- Fallback: Playfair Display
- Weights: 400
- Sizes: 40px, 48px, 80px
- Line height: 1.10
- Letter spacing: -0.8, -1, -2

#### Typeface 2: Geist

- Role: Primary body text, navigation labels, and UI elements; its clean, sans-serif structure ensures maximum legibility across all informational content.
- Fallback: Inter
- Weights: 400, 600, 700
- Sizes: 14px, 16px
- Line height: 1.0, 1.2, 1.4, 1.5
- Letter spacing: 0

#### Typeface 3: bryant

- Role: Uppercase CTAs, navigation links, and badges; its bold, slightly condensed form with generous letter spacing provides a strong, action-oriented voice.
- Fallback: Montserrat
- Weights: 700
- Sizes: 14px, 16px, 24px, 32px
- Line height: 1.0, 1.1, 1.2, 1.4
- Letter spacing: 0.53, 0.61, 0.91, 1.22

#### Typeface 4: Geist Mono

- Role: Used sparingly for specific product codes or technical details, providing a distinct, precise feel.
- Fallback: Roboto Mono
- Weights: 400
- Sizes: 14px
- Line height: 1.00
- Letter spacing: 0

#### Layout Reading

The page uses a maximum-width contained layout, though specific hero sections extend full-bleed. The hero pattern frequently employs a split-screen approach with a stark black background on one side (containing large, high-contrast serif headlines) and either white space or aspirational lifestyle photography on the other. Sections follow a consistent vertical spacing, often alternating between dark content blocks and light product grids. Content arrangement leans towards clear, centered headline stacks or alternating text-left/image-right compositions. Product display utilizes responsive card grids (e.g., 4-column) with ample padding between items. Navigation is a persistent top bar featuring a minimal logo, functional links, and a search input.

#### Spacing Reading

- Section gap: 72px
- Element gap: 4px
- Card padding: 0px
- Page max width: not specified
- Radius: {"cards":"8px","badges":"9999px","inputs":"4px","buttons":"4px, 32px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Category Tab Bar with Product Cards |  | <style>   @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Inter:wght@400;600;700&family=Montserrat:wght@700&display=swap');    :root {     --color-absolute-zero: #000000;     --color-cloud-white: #ffffff;     --color-forest-black: #1a211e;     --color-ash-gray: #eef1f0;     --color-charcoal-black: #0c0c0c;     --color-graphite: #606562;     --color-slate-border: #cccfcd;     --color-badge-gray: #4e4e4e;     --color-alert-red: #cc2e39;     --font-exposure-10: 'Playfair Display', serif;     --font-geist: 'Inter', sans-serif;     --font-bryant: 'Montserrat', sans-serif;   }    .pd-wrapper {     background: var(--color-cloud-white);     font-family: var(--font-geist);     padding: 24px 0 32px;     width: 600px;     box-sizing: border-box;   }    .pd-tabs {     display: flex;     gap: 8px;     padding: 0 24px;     margin-bottom: 24px;     overflow-x: auto;     scrollbar-width: none;   }    .pd-tabs::-webkit-scrollbar { display: none; }    .pd-tab {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 14px;     line-height: 1.0;     letter-spacing: 0.53px;     text-transform: uppercase;     padding: 10px 16px;     border-radius: 9999px;     border: none;     cursor: pointer;     white-space: nowrap;     text-decoration: none;     display: inline-block;   }    .pd-tab--active {     background: var(--color-absolute-zero);     color: var(--color-cloud-white);   }    .pd-tab--inactive {     background: transparent;     color: var(--color-forest-black);     border: 1px solid var(--color-slate-border);   }    .pd-cards {     display: grid;     grid-template-columns: 1fr 1fr;     gap: 16px;     padding: 0 24px;   }    .pd-card {     background: var(--color-cloud-white);     border-radius: 8px;     overflow: hidden;     cursor: pointer;     position: relative;   }    .pd-card__img {     width: 100%;     height: 200px;     background: var(--color-ash-gray);     border-radius: 8px;     position: relative;     display: flex;     align-items: center;     justify-content: center;   }    .pd-card__bag-silhouette {     width: 80px;     height: 110px;     background: #8a8a6e;     border-radius: 12px 12px 8px 8px;     position: relative;   }    .pd-card__bag-silhouette::before {     content: '';     position: absolute;     top: -18px;     left: 50%;     transform: translateX(-50%);     width: 20px;     height: 20px;     border-top: 3px solid #6b6b52;     border-radius: 50% 50% 0 0;   }    .pd-badge {     position: absolute;     top: 12px;     left: 12px;     background: var(--color-badge-gray);     color: var(--color-cloud-white);     font-family: var(--font-bryant);     font-weight: 700;     font-size: 12px;     line-height: 1.0;     letter-spacing: 0.53px;     text-transform: uppercase;     padding: 6px 12px;     border-radius: 9999px;   }    .pd-card__info {     padding: 12px 4px 4px;   }    .pd-card__name {     font-family: var(--font-geist);     font-size: 14px;     font-weight: 600;     color: var(--color-forest-black);     line-height: 1.2;     margin: 0 0 4px;   }    .pd-card__color {     font-family: var(--font-geist);     font-size: 13px;     font-weight: 400;     color: var(--color-graphite);     line-height: 1.4;     margin: 0 0 6px;   }    .pd-card__price {     font-family: var(--font-geist);     font-size: 14px;     font-weight: 400;     color: var(--color-forest-black);     line-height: 1.2;     margin: 0;   } </style>  <div class="pd-wrapper">   <div class="pd-tabs">     <a class="pd-tab pd-tab--active">Outdoor</a>     <a class="pd-tab pd-tab--inactive">Travel</a>     <a class="pd-tab pd-tab--inactive">Everyday</a>     <a class="pd-tab pd-tab--inactive">Camera Gear</a>     <a class="pd-tab pd-tab--inactive">Wallets</a>     <a class="pd-tab pd-tab--inactive">Mobile</a>   </div>    <div class="pd-cards">     <div class="pd-card">       <div class="pd-card__img">         <span class="pd-badge">New</span>         <div class="pd-card__bag-silhouette"></div>       </div>       <div class="pd-card__info">         <p class="pd-card__name">Outdoor Backpack 18L</p>         <p class="pd-card__color">Kelp</p>         <p class="pd-card__price">â‚¬199.99</p>       </div>     </div>      <div class="pd-card">       <div class="pd-card__img">         <span class="pd-badge">New</span>         <div class="pd-card__bag-silhouette" style="width:70px;height:130px;"></div>       </div>       <div class="pd-card__info">         <p class="pd-card__name">Outdoor Backpack 25L</p>         <p class="pd-card__color">Kelp</p>         <p class="pd-card__price">â‚¬279.99</p>       </div>     </div>      <div class="pd-card">       <div class="pd-card__img">         <span class="pd-badge">New</span>         <div class="pd-card__bag-silhouette" style="width:75px;height:145px;"></div>       </div>       <div class="pd-card__info">         <p class="pd-card__name">Outdoor Backpack 45L</p>         <p class="pd-card__color">Kelp</p>         <p class="pd-card__price">â‚¬379.99</p>       </div>     </div>      <div class="pd-card">       <div class="pd-card__img">         <span class="pd-badge">New</span>         <div style="width:100px;height:55px;background:#8a8a6e;border-radius:8px;"></div>       </div>       <div class="pd-card__info">         <p class="pd-card__name">Outdoor Sling 2L</p>         <p class="pd-card__color">Kelp</p>         <p class="pd-card__price">â‚¬69.99</p>       </div>     </div>   </div> </div> |
| Announcement Banner + Button Group |  | <style>   @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Inter:wght@400;600;700&family=Montserrat:wght@700&display=swap');    :root {     --color-absolute-zero: #000000;     --color-cloud-white: #ffffff;     --color-forest-black: #1a211e;     --color-ash-gray: #eef1f0;     --color-charcoal-black: #0c0c0c;     --color-graphite: #606562;     --color-slate-border: #cccfcd;     --color-badge-gray: #4e4e4e;     --font-exposure-10: 'Playfair Display', serif;     --font-geist: 'Inter', sans-serif;     --font-bryant: 'Montserrat', sans-serif;   }    .pd-banner-section {     width: 600px;     box-sizing: border-box;     font-family: var(--font-geist);   }    .pd-announcement {     background: var(--color-absolute-zero);     color: var(--color-cloud-white);     text-align: center;     padding: 12px 24px;     font-family: var(--font-bryant);     font-weight: 700;     font-size: 13px;     line-height: 1.4;     letter-spacing: 0.53px;     text-transform: uppercase;   }    .pd-announcement span {     margin: 0 8px;     color: var(--color-graphite);   }    .pd-hero-content {     background: var(--color-absolute-zero);     padding: 48px 40px;     position: relative;   }    .pd-hero-eyebrow {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 13px;     line-height: 1.0;     letter-spacing: 0.91px;     text-transform: uppercase;     color: var(--color-graphite);     margin: 0 0 16px;   }    .pd-hero-headline {     font-family: var(--font-exposure-10);     font-weight: 400;     font-size: 52px;     line-height: 1.10;     letter-spacing: -1px;     color: var(--color-cloud-white);     margin: 0 0 16px;   }    .pd-hero-headline em {     font-style: italic;   }    .pd-hero-sub {     font-family: var(--font-geist);     font-weight: 400;     font-size: 15px;     line-height: 1.5;     color: rgba(255,255,255,0.75);     margin: 0 0 32px;   }    .pd-btn-group {     display: flex;     gap: 12px;     align-items: center;     flex-wrap: wrap;   }    .pd-btn-solid {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 13px;     letter-spacing: 0.61px;     text-transform: uppercase;     line-height: 1.2;     background: var(--color-cloud-white);     color: var(--color-forest-black);     border: none;     border-radius: 4px;     padding: 14px 24px;     cursor: pointer;     text-decoration: none;     display: inline-block;   }    .pd-btn-ghost {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 13px;     letter-spacing: 0.61px;     text-transform: uppercase;     line-height: 1.2;     background: transparent;     color: var(--color-cloud-white);     border: 1px solid var(--color-cloud-white);     border-radius: 4px;     padding: 14px 24px;     cursor: pointer;     text-decoration: none;     display: inline-block;   } </style>  <div class="pd-banner-section">   <div class="pd-announcement">     Free Shipping Over â‚¬149 <span>â€¢</span> Lifetime Warranty <span>â€¢</span> 30-Day Returns   </div>   <div class="pd-hero-content">     <p class="pd-hero-eyebrow">New Color + Savings</p>     <h1 class="pd-hero-headline"><em>Kelp</em> is here to make waves.</h1>     <p class="pd-hero-sub">Outdoor Backpacks and Slings: 10% off Eclipse and Black, 20% off Cloud.</p>     <div class="pd-btn-group">       <a class="pd-btn-solid">Shop Outdoor</a>       <a class="pd-btn-ghost">Explore the Line</a>     </div>   </div> </div> |
| Search Input + New Arrivals Promo Card |  | <style>   @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Inter:wght@400;600;700&family=Montserrat:wght@700&display=swap');    :root {     --color-absolute-zero: #000000;     --color-cloud-white: #ffffff;     --color-forest-black: #1a211e;     --color-ash-gray: #eef1f0;     --color-charcoal-black: #0c0c0c;     --color-graphite: #606562;     --color-slate-border: #cccfcd;     --color-badge-gray: #4e4e4e;     --font-exposure-10: 'Playfair Display', serif;     --font-geist: 'Inter', sans-serif;     --font-bryant: 'Montserrat', sans-serif;   }    .pd-ui-section {     width: 600px;     box-sizing: border-box;     font-family: var(--font-geist);     background: var(--color-cloud-white);     padding: 28px 24px;     display: flex;     flex-direction: column;     gap: 24px;   }    .pd-search-label {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 11px;     letter-spacing: 0.91px;     text-transform: uppercase;     color: var(--color-graphite);     margin-bottom: 8px;     display: block;   }    .pd-search-wrapper {     position: relative;     display: flex;     align-items: center;   }    .pd-search-icon {     position: absolute;     left: 12px;     top: 50%;     transform: translateY(-50%);     color: var(--color-graphite);     pointer-events: none;   }    .pd-search-input {     width: 100%;     box-sizing: border-box;     background: var(--color-ash-gray);     color: var(--color-charcoal-black);     border: 1px solid var(--color-slate-border);     border-radius: 4px;     padding: 14px 16px 14px 40px;     font-family: var(--font-geist);     font-size: 15px;     font-weight: 400;     line-height: 1.5;     outline: none;   }    .pd-search-input::placeholder {     color: var(--color-graphite);   }    .pd-promo-card {     background: var(--color-absolute-zero);     border-radius: 8px;     padding: 36px 36px;     display: flex;     flex-direction: column;     gap: 12px;     position: relative;     overflow: hidden;   }    .pd-promo-card::after {     content: '';     position: absolute;     right: -20px;     top: 0;     bottom: 0;     width: 200px;     background: linear-gradient(135deg, #2a2a1e 0%, #3a3a2a 40%, #1a1a12 100%);     border-radius: 50% 0 0 50%;     opacity: 0.4;   }    .pd-promo-eyebrow {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 11px;     letter-spacing: 0.91px;     text-transform: uppercase;     color: var(--color-graphite);     margin: 0;     position: relative;     z-index: 1;   }    .pd-promo-headline {     font-family: var(--font-exposure-10);     font-weight: 400;     font-size: 36px;     line-height: 1.10;     letter-spacing: -0.8px;     color: var(--color-cloud-white);     margin: 0;     position: relative;     z-index: 1;     max-width: 320px;   }    .pd-promo-body {     font-family: var(--font-geist);     font-size: 14px;     line-height: 1.5;     color: rgba(255,255,255,0.7);     margin: 0;     position: relative;     z-index: 1;   }    .pd-promo-btn {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 12px;     letter-spacing: 0.61px;     text-transform: uppercase;     line-height: 1.2;     background: var(--color-cloud-white);     color: var(--color-forest-black);     border: none;     border-radius: 4px;     padding: 13px 22px;     cursor: pointer;     text-decoration: none;     display: inline-block;     margin-top: 4px;     position: relative;     z-index: 1;     align-self: flex-start;   }    .pd-badges-row {     display: flex;     gap: 8px;     flex-wrap: wrap;   }    .pd-badge-pill {     font-family: var(--font-bryant);     font-weight: 700;     font-size: 12px;     letter-spacing: 0.53px;     text-transform: uppercase;     line-height: 1.0;     background: var(--color-badge-gray);     color: var(--color-cloud-white);     border-radius: 9999px;     padding: 7px 14px;     display: inline-block;   }    .pd-badge-pill--outline {     background: transparent;     color: var(--color-forest-black);     border: 1px solid var(--color-slate-border);   } </style>  <div class="pd-ui-section">   <div>     <label class="pd-search-label">Search Products</label>     <div class="pd-search-wrapper">       <svg class="pd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">         <circle cx="11" cy="11" r="8"/>         <line x1="21" y1="21" x2="16.65" y2="16.65"/>       </svg>       <input class="pd-search-input" type="text" placeholder="Search for packing cubes" />     </div>   </div>    <div class="pd-badges-row">     <span class="pd-badge-pill">New</span>     <span class="pd-badge-pill--outline">Luggage</span>     <span class="pd-badge-pill--outline">Bags</span>     <span class="pd-badge-pill--outline">Camera Gear</span>     <span class="pd-badge-pill--outline">Wallets</span>     <span class="pd-badge-pill--outline">Sale</span>   </div>    <div class="pd-promo-card">     <p class="pd-promo-eyebrow">What's New</p>     <h2 class="pd-promo-headline">Your next essential just dropped.</h2>     <p class="pd-promo-body">Discover new arrivals to inspire your next adventure.</p>     <a class="pd-promo-btn">Shop New Arrivals</a>   </div> </div> |
| Primary Ghost Button | Primary action button on dark backgrounds | Background transparent, text Forest Black (#1a211e), border Forest Black (#1a211e) 1px, 0px border-radius, 0px vertical padding, 16px horizontal padding. Uses bryant 700, 16px, line-height 1.2. |
| Solid Standard Button | Standard action button on light backgrounds | Background Cloud White (#ffffff), text Forest Black (#1a211e), 4px border-radius, 12px vertical padding, 24px horizontal padding. Uses Geist 400, 16px, line-height 1.5. |
| Pill Accent Button | Special accent or navigation button | Background Cloud White (#ffffff), text Forest Black (#1a211e), 32px border-radius, no padding defined from button component itself but contexturally implies 0px-0px. Uses Geist 400, 16px, line-height 1.5. |
| Neutral Filled Button | Secondary action button for subtle interactions | Background Ash Gray (#eef1f0), text Forest Black (#1a211e), 4px border-radius, 8px vertical padding, 16px horizontal padding. Uses Geist 400, 16px, line-height 1.5. |
| Search Input (Header) | Top navigation search bar | Background Cloud White (#ffffff), text Forest Black (#1a211e), Slate Border (#cccfcd) 1px border, 4px border-radius, 2px vertical padding, 12px horizontal padding. Placeholder text is implied 'Search for packing cubes'. |
| Search Input (Block) | Larger search input field | Background Ash Gray (#eef1f0), text Charcoal Black (#0c0c0c), Slate Border (#cccfcd) 1px border, 4px border-radius, 16px vertical padding, 12px horizontal padding. Placeholder text is implied to be Graphite (#606562). |
| New Badge | Highlighting new arrivals | Background Badge Gray (#4e4e4e), text Cloud White (#ffffff), 9999px border-radius (pill shape), 8px vertical padding, 16px horizontal padding. Uses bryant 700, 14px, line-height 1.0. |

#### Carry Forward

- Prioritize Absolute Zero (#000000) or Cloud White (#ffffff) for hero section backgrounds to create high-contrast statements.
- Use Exposure-10 (substitute Playfair Display) for all display and large heading text to convey craftsmanship and gravitas.
- Apply a 4px border-radius for all interactive elements like buttons and input fields for a subtle softening.
- Reserve bryant font with its characteristic letter-spacing (e.g., 0.61px at 16px) for uppercase action-oriented text and badges.
- Maintain a clear product-focused visual hierarchy by placing product images within cards that have 0px internal padding.
- Utilize Ash Gray (#eef1f0) as a divider or background for secondary UI elements to differentiate without interrupting the high-contrast main scheme.
- Ensure all body and informational text uses Geist (substitute Inter) at 14px or 16px for optimal legibility.

#### Avoid

- Do not use saturated colors for large background areas; maintain the primary black, white, and neutral palette.
- Avoid generic button styling; ensure clear differentiation between ghost, solid, and accent button variants.
- Do not introduce additional serif fonts; Exposure-10 is the singular serif. Do not use generic sans-serifs â€” stick to Geist and bryant.
- Avoid complex shadows; prefer flat UI elements or subtle border definitions for depth.
- Do not break the rigid grid layout with overlapping content or free-form elements; content should be contained and aligned.
- Do not use decorative elements that distract from the product imagery or strong typography.
- Do not use bold weights of Geist for normal paragraph text; reserve it for specific UI elements or semantic emphasis.


## 5. Archetype Library

### 1. Luxury Object Showcase

Use this archetype when the project needs a premium, restrained, confident, tactile, editorial, composed feeling and the content naturally supports the luxury object showcase pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use material or photographic accent first; chromatic UI accent only if the brand owns it.
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

The luxury object showcase version of High-End Design often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 2. Editorial Brand World

Use this archetype when the project needs a premium, restrained, confident, tactile, editorial, composed feeling and the content naturally supports the editorial brand world pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use material or photographic accent first; chromatic UI accent only if the brand owns it.
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

The editorial brand world version of High-End Design often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 3. Boutique Commerce

Use this archetype when the project needs a premium, restrained, confident, tactile, editorial, composed feeling and the content naturally supports the boutique commerce pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use material or photographic accent first; chromatic UI accent only if the brand owns it.
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

The boutique commerce version of High-End Design often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 4. Gallery-Like Portfolio

Use this archetype when the project needs a premium, restrained, confident, tactile, editorial, composed feeling and the content naturally supports the gallery-like portfolio pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use material or photographic accent first; chromatic UI accent only if the brand owns it.
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

The gallery-like portfolio version of High-End Design often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 5. Premium Service Narrative

Use this archetype when the project needs a premium, restrained, confident, tactile, editorial, composed feeling and the content naturally supports the premium service narrative pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use material or photographic accent first; chromatic UI accent only if the brand owns it.
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

The premium service narrative version of High-End Design often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

## 6. Consolidated Color System

The palette below merges tokens observed across the five sources. Do not use every color. Treat it as a vocabulary for building a smaller project-specific system.

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Indigo | #060daa | brand | Footer background, primary accent for deep sections â€“ creating a luxurious, immersive foundation. |
| Carbon Black | #191817 | neutral | Dominant text color for headings and body content on light backgrounds, input borders â€“ provides stark contrast and grounded presence. |
| Barely White | #fcfaee | neutral | Primary text color on dark backgrounds, selected button text â€“ a creamy off-white that softens the high contrast. |
| Ash Gray | #555555 | neutral | Secondary text, subtle link color â€“ offers a muted informational tone against white. |
| Pure White | #ffffff | neutral | Page backgrounds, card backgrounds, input backgrounds â€“ provides clean, expansive canvas. |
| Pale Silver | #e5e5e5 | neutral | Subtle border colors for inputs â€“ an almost imperceptible divider. |
| Pure Black | #000000 | neutral | Primary icon color, borders on ghost buttons â€“ a hard, crisp edge or fill. |
| Obsidian | #262626 | neutral | Primary text, interactive elements, navigation links, button text â€” forms the core dark against light contrast. |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, prominent navigational elements â€” establishes the primary visual canvas. |
| Graphite Grey | #bbbbbb | neutral | Secondary navigation text, subtle borders, contextual information â€” provides sufficient contrast on dark surfaces while appearing subdued on light ones. |
| Frost | #f1f1f1 | neutral | Subtle background accents, dividers â€” provides a very light contrast against Canvas White. |
| Deep Space | #262626 | neutral | Footer background â€” anchors the page with a solid, dark foundation. |
| Electric Blue | #1c69d4 | accent | Interactive highlights, focus states â€” a vibrant, technical accent for user interaction. |
| Obsidian Black | #000000 | neutral | Page backgrounds, navigation bars, dramatic photographic backdrops for product showcases. |

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
- Does the style match premium, restrained, confident, tactile, editorial, composed?
- Are tokens consistent?
- Does the design avoid the warning: avoid gold cliches, generic black luxury pages, excessive blur, fake scarcity, illegible tiny type, and product pages where the object cannot be inspected?

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

Create a High-End Design interface that feels premium, restrained, confident, tactile, editorial, composed. High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects. Use material or photographic accent first; chromatic UI accent only if the brand owns it. Build a complete, usable experience with clear hierarchy, real content structure, responsive behavior, accessible states, and a repeatable component system. avoid gold cliches, generic black luxury pages, excessive blur, fake scarcity, illegible tiny type, and product pages where the object cannot be inspected.

### 15.2 Landing Page Prompt

Design a High-End Design landing page with a strong first viewport, specific product or brand promise, credible proof, clear section rhythm, and a focused conversion path. The visual identity should come from typography, spacing, color roles, imagery, and component geometry rather than generic decoration.

### 15.3 App Interface Prompt

Design a High-End Design application screen for repeated use. Prioritize the main workflow, controls, state clarity, information density, and accessible interaction. Make the interface visually distinctive but keep operational surfaces calm enough for daily work.

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

A finished High-End Design design should:

- feel visually specific within the first viewport
- support real content and real workflows
- have consistent tokens
- have clear interaction states
- be responsive without losing character
- be accessible enough for production use
- translate the five source references into a broader reusable skill
