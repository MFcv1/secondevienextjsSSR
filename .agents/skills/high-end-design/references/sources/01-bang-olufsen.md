# Bang & Olufsen - High-End Design Source Notes

Source: https://styles.refero.design/style/27a4a4fa-4b1a-4e7e-b2c3-3e5bf57f00e5
Site: https://bang-olufsen.com
North star: Gallery of precise objects. A dark, velvet-lined showcase where each product rests, spotlighted with refined exactitude.
Theme: mixed

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Indigo | #060daa | brand | Footer background, primary accent for deep sections – creating a luxurious, immersive foundation. |
| Carbon Black | #191817 | neutral | Dominant text color for headings and body content on light backgrounds, input borders – provides stark contrast and grounded presence. |
| Barely White | #fcfaee | neutral | Primary text color on dark backgrounds, selected button text – a creamy off-white that softens the high contrast. |
| Ash Gray | #555555 | neutral | Secondary text, subtle link color – offers a muted informational tone against white. |
| Pure White | #ffffff | neutral | Page backgrounds, card backgrounds, input backgrounds – provides clean, expansive canvas. |
| Pale Silver | #e5e5e5 | neutral | Subtle border colors for inputs – an almost imperceptible divider. |
| Pure Black | #000000 | neutral | Primary icon color, borders on ghost buttons – a hard, crisp edge or fill. |

## Typography

#### Typeface 1: BeoSupreme

- Role: Primary typeface for all headings, body text, and UI elements. Its broad range of weights and precise letter-spacing across sizes is a core visual identity feature, conveying understated luxury.
- Fallback: Open Sans
- Weights: 400, 500, 700
- Sizes: 12px, 14px, 16px, 24px, 36px
- Line height: 1.00, 1.15, 1.25, 1.33, 1.43, 1.50, 1.63, 1.67, 1.71, 2.19
- Letter spacing: -0.056em at 36px, -0.014em at 24px, 0.006em at 16px, 0.007em at 14px, 0.008em at 12px, then other specific values for a finely tuned optical balance

## Layout

The page uses a mixed layout approach, blending full-bleed sections with constrained content. The hero prominently features a full-bleed dark background ('Midnight Indigo') with a large, centered product image and left-aligned headline/CTA. Subsequent sections alternate between full-bleed white backgrounds for product listings (often displaying items in a clean, centered grid of 4) and some potentially full-bleed sections with strong, singular background colors like the red observed. Content is generally centered within a comfortable maximum width when not full-bleed. Vertical rhythm is maintained by consistent spacing between sections (around 48px), creating a spacious and unhurried browsing experience. The navigation is a minimalist sticky top bar, providing persistent access without visual clutter.

## Spacing

- Section gap: 48px
- Element gap: 4px
- Card padding: 0px
- Page max width: not specified
- Radius: {"badges":"2px","buttons":"40px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Product Cards — Explore Superventas |  | <div style="--color-midnight-indigo:#060daa;--color-carbon-black:#191817;--color-barely-white:#fcfaee;--color-ash-gray:#555555;--color-pure-white:#ffffff;--color-pale-silver:#e5e5e5;--color-pure-black:#000000;--font-beosupreme:'Open Sans',sans-serif;font-family:var(--font-beosupreme);background:var(--color-pure-white);padding:48px 24px;width:600px;box-sizing:border-box;"><h2 style="font-family:var(--font-beosupreme);font-size:24px;font-weight:400;letter-spacing:-0.014px;line-height:1.25;color:var(--color-carbon-black);text-align:center;margin:0 0 40px 0;">Explore nuestros superventas</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;"><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#f5f0eb;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:120px;height:110px;background:linear-gradient(135deg,#c9926b 30%,#191817 30%);border-radius:4px;opacity:0.85;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beo Grace</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">1200 €</p></div><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#f0efed;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:130px;height:60px;background:#3a3a3a;border-radius:3px;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beosound Premiere</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">3900 €</p></div><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#f5f0e8;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:100px;height:100px;background:linear-gradient(135deg,#c9926b,#b07d56);border-radius:50%;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beosound A1 de 3.ª generación</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">349 €</p></div><div style="font-family:var(--font-beosupreme);padding:0;"><div style="width:100%;height:180px;background:#eeeded;border-radius:0px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><div style="width:50px;height:130px;background:linear-gradient(180deg,#555 0%,#222 100%);border-radius:4px 4px 0 0;"></div></div><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:500;color:var(--color-carbon-black);margin:0 0 4px 0;letter-spacing:0.007px;line-height:1.43;">Beosound 2</p><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:700;color:var(--color-carbon-black);margin:0;letter-spacing:0.007px;line-height:1.43;">3300 €</p></div></div></div> |
| Hero CTA — Beo Grace |  | <div style="--color-midnight-indigo:#060daa;--color-carbon-black:#191817;--color-barely-white:#fcfaee;--color-ash-gray:#555555;--color-pure-white:#ffffff;--color-pale-silver:#e5e5e5;--color-pure-black:#000000;--font-beosupreme:'Open Sans',sans-serif;font-family:var(--font-beosupreme);background:#0a0d2e;width:600px;box-sizing:border-box;padding:0;position:relative;overflow:hidden;"><div style="width:100%;height:340px;background:linear-gradient(135deg,#0c1260 0%,#060daa 40%,#0a0a50 100%);display:flex;align-items:center;justify-content:center;position:relative;"><div style="position:absolute;right:60px;top:30px;width:220px;height:160px;background:linear-gradient(145deg,#c9926b 0%,#a8724a 60%,#8a5c38 100%);border-radius:12px;transform:rotate(-8deg);opacity:0.9;"></div><div style="position:absolute;right:110px;top:140px;width:30px;height:110px;background:linear-gradient(180deg,#c9926b,#a8724a);border-radius:4px;transform:rotate(5deg);"><div style="width:22px;height:22px;background:#191817;border-radius:50%;margin:4px auto;"></div></div><div style="position:absolute;right:170px;top:180px;width:30px;height:110px;background:linear-gradient(180deg,#c9926b,#a8724a);border-radius:4px;transform:rotate(-3deg);"><div style="width:22px;height:22px;background:#191817;border-radius:50%;margin:4px auto;"></div></div><div style="position:absolute;left:0;bottom:0;padding:32px 36px;"><h1 style="font-family:var(--font-beosupreme);font-size:28px;font-weight:400;letter-spacing:-0.04px;line-height:1.15;color:var(--color-barely-white);margin:0 0 10px 0;">Beo Grace</h1><p style="font-family:var(--font-beosupreme);font-size:14px;font-weight:400;color:var(--color-barely-white);margin:0 0 24px 0;letter-spacing:0.007px;line-height:1.43;opacity:0.9;">100 años de artesanía. Un futuro icono.</p><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-barely-white);background:transparent;border:1px solid var(--color-barely-white);border-radius:40px;padding:10px 28px;text-decoration:none;line-height:1.43;">Disponible en Honey Tone</a></div></div></div> |
| Button Group — B&O Style System |  | <div style="--color-midnight-indigo:#060daa;--color-carbon-black:#191817;--color-barely-white:#fcfaee;--color-ash-gray:#555555;--color-pure-white:#ffffff;--color-pale-silver:#e5e5e5;--color-pure-black:#000000;--font-beosupreme:'Open Sans',sans-serif;font-family:var(--font-beosupreme);background:var(--color-pure-white);padding:48px 40px;width:600px;box-sizing:border-box;"><p style="font-family:var(--font-beosupreme);font-size:12px;font-weight:400;letter-spacing:0.008px;color:var(--color-ash-gray);margin:0 0 28px 0;text-transform:uppercase;">Elementos de interfaz</p><div style="display:flex;flex-direction:column;gap:32px;"><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">Primary CTA</span><div><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-barely-white);background:var(--color-carbon-black);border-radius:40px;padding:10px 32px;text-decoration:none;line-height:1.43;border:1px solid var(--color-carbon-black);">Comprar ahora</a></div></div><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">Ghost Button</span><div><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-carbon-black);background:transparent;border-radius:40px;padding:10px 32px;text-decoration:none;line-height:1.43;border:1px solid var(--color-carbon-black);">Disponible en Honey Tone</a></div></div><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">Text Link (on dark)</span><div style="background:var(--color-carbon-black);padding:16px 20px;display:inline-block;"><a href="#" style="display:inline-block;font-family:var(--font-beosupreme);font-size:14px;font-weight:400;letter-spacing:0.007px;color:var(--color-barely-white);background:transparent;text-decoration:none;line-height:1.43;border-bottom:1px solid var(--color-barely-white);padding:4px 0;">Ver todos los productos</a></div></div><div style="display:flex;flex-direction:column;gap:10px;"><span style="font-family:var(--font-beosupreme);font-size:12px;color:var(--color-ash-gray);letter-spacing:0.008px;">New Product Badge</span><div style="display:flex;gap:12px;align-items:center;"><span style="display:inline-block;font-family:var(--font-beosupreme);font-size:12px;font-weight:400;color:var(--color-carbon-black);background:var(--color-pure-white);border:1px solid var(--color-pale-silver);border-radius:2px;padding:4px 8px;letter-spacing:0.008px;line-height:1.43;">Nuevo</span><span style="display:inline-block;font-family:var(--font-beosupreme);font-size:12px;font-weight:400;color:var(--color-barely-white);background:var(--color-carbon-black);border-radius:2px;padding:4px 8px;letter-spacing:0.008px;line-height:1.43;">Edición Limitada</span></div></div></div></div> |
| Primary Button (Honey Tone CTA) | Call to action | Rounded pill button with 'Carbon Black' (#191817) background and 'Barely White' (#fcfaee) text. Has a 40px border-radius, 8px vertical padding, and 32px horizontal padding. Uses BeoSupreme text. |
| Ghost Button (Menu/Search) | Navigation/Utility | Transparent background with 'Carbon Black' (#000000) text and border. No border-radius, 0px padding. Used for minimal UI controls. |
| Text Link Button | Tertiary action/Navigation | Transparent background with 'Barely White' (#fcfaee) text and a 'Barely White' (#fcfaee) bottom border of 1px. 4px vertical padding, 0px horizontal padding. Typically used in dark sections like the hero or footer. |
| Feature Card | Product display | A completely transparent card with no padding, border, or shadow. It acts as a container for product images and descriptive text. Text is 'Carbon Black' (#191817) and headings use BeoSupreme. |
| Input Field | User entry | White background (#ffffff) with 'Carbon Black' (#191817) text and a 1px 'Carbon Black' (#191817) bottom border. No border-radius. 1px vertical padding and 2px right padding. |
| New Product Badge | Highlight new items | Rectangular badge with 'Pure White' (#ffffff) background and 'Carbon Black' (#191817) text. Has a 2px border-radius, 4px vertical padding, and 8px horizontal padding. Uses BeoSupreme text. |

## Dos

- Prioritize the custom 'BeoSupreme' font for all textual content, leveraging its unique character and precise letter-spacing.
- Use 'Midnight Indigo' (#060daa) exclusively for foundational elements like the footer to establish a luxurious, deep anchor.
- Maintain a clear visual hierarchy by contrasting 'Carbon Black' (#191817) text on light backgrounds (#ffffff, #fcfaee) and 'Barely White' (#fcfaee) on dark backgrounds (#060daa).
- Employ the 40px border-radius strictly for primary CTA buttons, ensuring they stand out as the sole 'soft' element.
- Utilize generous negative space around product imagery and text blocks to convey a sense of premium quality and focus, with section gaps around 48px.
- Ensure all interactive elements, especially primary CTAs, meet a minimum contrast ratio of 4.5:1 against their background.
- Use a subtle 1px border for ghost button states and text links to provide definition without visual weight.

## Donts

- Do not introduce additional font families; 'BeoSupreme' defines the typographic identity.
- Avoid using multiple accent colors; 'Midnight Indigo' is reserved for specific, prominent sectional backgrounds.
- Do not deviate from the established border-radius values (0px, 2px, 40px); rounded corners are intentional and scarce.
- Do not use box-shadows; elevation is handled through background color changes and spatial separation.
- Avoid decorative elements or busy backgrounds; the aesthetic emphasizes product clarity and clean UI.
- Do not create dense content blocks; the comfortable density principle with a 4px base unit should be consistently applied.
- Never use the browser default blue for links; control all link colors with 'Carbon Black', 'Ash Gray', or 'Barely White'.

## Transferable Lessons

- Read this source through the lens of High-End Design: High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
