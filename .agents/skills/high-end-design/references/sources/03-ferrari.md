# Ferrari - High-End Design Source Notes

Source: https://styles.refero.design/style/80164adf-a898-4f7c-bce7-12f3f62e1649
Site: https://ferrari.com
North star: Precision engineered machinery. Like the interior of a sleek, high-performance engine, where every component is black or silver, and only critical indicators glow red.
Theme: mixed

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Obsidian Black | #000000 | neutral | Page backgrounds, navigation bars, dramatic photographic backdrops for product showcases. |
| Polar White | #ffffff | neutral | Primary text, prominent page sections, content cards, and interactive elements – providing crisp contrast against dark backgrounds. |
| Shadow Graphite | #181818 | neutral | Secondary text in navigation, footer elements, and subtle background shading to create depth without overt shadows. |
| Steel Gray | #303030 | neutral | Minor dividers, borders, and backgrounds for less prominent UI elements, establishing a subtle hierarchy within dark themes. |
| Ash Mist | #8f8f8f | neutral | Supportive text, icon fills, and subtle hints where softer contrast is desired, such as secondary information or disabled states. |
| Rosso Corsa | #FF0000 | brand | Accent color for interactive elements, progress indicators, underlines on active navigation items - the iconic visual signature of the brand, used sparingly for impact. |

## Typography

#### Typeface 1: custom

- Role: Primary typeface for all body text, navigational links, buttons, and footers. The intentional wide letter-spacing across all sizes is a distinctive characteristic, giving each word room to breathe and contributing to the premium, measured feel.
- Fallback: Arial, Helvetica, sans-serif
- Weights: 
- Sizes: 11px, 12px, 13px
- Line height: 1.27, 1.50, 1.78, 2.00
- Letter spacing: 0.0150em, 0.0220em, 0.0280em, 0.0830em, 0.0910em

## Layout

The page exhibits a mixed layout: the hero is a full-bleed dark video/image with centered text and call to action. Subsequent sections alternate between dark and light backgrounds, using a flexible, full-width model. Content is primarily arranged in two-column layouts, often with text on one side and a large, impactful image on the other. Vertical spacing between logical sections is consistent, around `48px`. The overall impression is information-rich but carefully composed, guiding the eye through high-impact visuals and concise text blocks.

## Spacing

- Section gap: 48px
- Element gap: 10px
- Card padding: 20px
- Page max width: not specified
- Radius: {"all":"0px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Hero Slide Indicator & CTA |  | <div style="--color-obsidian-black:#000000;--color-polar-white:#ffffff;--color-shadow-graphite:#181818;--color-steel-gray:#303030;--color-ash-mist:#8f8f8f;--color-rosso-corsa:#FF0000;--font-custom:Arial,Helvetica,sans-serif;background:var(--color-obsidian-black);width:600px;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px 50px;box-sizing:border-box;font-family:var(--font-custom);"><p style="color:var(--color-polar-white);font-family:var(--font-custom);font-size:13px;font-weight:400;letter-spacing:0.0830em;margin:0 0 14px 0;line-height:1.78;">Racing</p><h1 style="color:var(--color-polar-white);font-family:var(--font-custom);font-size:36px;font-weight:700;letter-spacing:0.0830em;margin:0 0 32px 0;text-align:center;line-height:1.2;text-transform:uppercase;">Scuderia Ferrari</h1><div style="display:flex;align-items:center;gap:14px;margin-bottom:48px;"><span style="color:var(--color-polar-white);font-family:var(--font-custom);font-size:11px;font-weight:400;letter-spacing:0.0830em;text-transform:uppercase;">Descubrir</span><button style="width:36px;height:36px;border-radius:50%;border:1px solid var(--color-polar-white);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2L10 7L5 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><div style="display:flex;align-items:center;gap:10px;"><div style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--color-rosso-corsa);background:transparent;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);"></div></div></div> |
| News Feature Card |  | <div style="--color-obsidian-black:#000000;--color-polar-white:#ffffff;--color-shadow-graphite:#181818;--color-steel-gray:#303030;--color-ash-mist:#8f8f8f;--color-rosso-corsa:#FF0000;--font-custom:Arial,Helvetica,sans-serif;background:var(--color-polar-white);width:600px;box-sizing:border-box;font-family:var(--font-custom);display:flex;flex-direction:row;align-items:stretch;"><div style="flex:1;padding:44px 32px 44px 40px;display:flex;flex-direction:column;justify-content:center;"><h2 style="font-family:var(--font-custom);font-size:22px;font-weight:800;letter-spacing:0.0280em;color:var(--color-obsidian-black);margin:0 0 20px 0;line-height:1.27;text-transform:uppercase;">Ferrari at Imola for Opening Round of the 2026 FIA WEC</h2><p style="font-family:var(--font-custom);font-size:13px;font-weight:400;color:var(--color-shadow-graphite);letter-spacing:0.0150em;line-height:1.78;margin:0 0 28px 0;">Ferrari returns to the top class of endurance racing with the 6 Hours of Imola, opening the 2026 season in front of a home crowd more than five months after last season's finale, which saw the Maranello Manufacturer crowned FIA WEC World Champions.</p><div style="display:flex;align-items:center;gap:12px;"><span style="font-family:var(--font-custom);font-size:11px;font-weight:400;letter-spacing:0.0830em;color:var(--color-obsidian-black);text-transform:uppercase;">Leer más</span><button style="width:32px;height:32px;border-radius:50%;border:1px solid var(--color-obsidian-black);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2L9 6L4 10" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div><div style="width:220px;flex-shrink:0;background:var(--color-steel-gray);position:relative;overflow:hidden;"><div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 40%,#111 100%);display:flex;align-items:center;justify-content:center;"><div style="width:160px;height:80px;background:var(--color-rosso-corsa);opacity:0.18;border-radius:0;"></div></div></div></div> |
| Navigation Link Group & Carousel Pagination |  | <div style="--color-obsidian-black:#000000;--color-polar-white:#ffffff;--color-shadow-graphite:#181818;--color-steel-gray:#303030;--color-ash-mist:#8f8f8f;--color-rosso-corsa:#FF0000;--font-custom:Arial,Helvetica,sans-serif;font-family:var(--font-custom);width:600px;box-sizing:border-box;"><div style="background:var(--color-obsidian-black);padding:0 24px;display:flex;align-items:center;gap:32px;height:64px;"><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid var(--color-rosso-corsa);line-height:1.5;">Racing</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">Sports Cars</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">Colecciones</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">Experiencias</a><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:12px;font-weight:400;color:var(--color-polar-white);letter-spacing:0.0830em;text-transform:uppercase;padding:5px 0;border-bottom:1px solid transparent;line-height:1.5;">About Us</a></div><div style="background:var(--color-polar-white);padding:24px 24px;display:flex;align-items:center;gap:12px;"><div style="width:26px;height:26px;border-radius:50%;border:1.5px solid var(--color-rosso-corsa);background:transparent;flex-shrink:0;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);flex-shrink:0;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);flex-shrink:0;"></div><div style="width:7px;height:7px;border-radius:50%;background:var(--color-ash-mist);flex-shrink:0;"></div><div style="flex:1;height:1px;background:var(--color-ash-mist);margin:0 8px;"></div><a href="#" style="text-decoration:none;font-family:var(--font-custom);font-size:11px;font-weight:400;color:var(--color-obsidian-black);letter-spacing:0.0830em;text-transform:uppercase;">Ver todas las noticias</a></div></div> |
| Ghost Navigation Link | Primary navigation item | Text link with no background. Text color `Polar White` (#ffffff), `Body-Font` weight 400, size 13px. On hover/active, a 1px `Rosso Corsa` (#FF0000) bottom border appears. Padding is 5px top/bottom, 0px left/right. Letter spacing 0.0830em. |
| Hero Action Arrow Button | Call to action in hero section | Transparent background button with `Polar White` (#ffffff) text and an integrated arrow icon. No border-radius, `Body-Font` weight 400. Text is uppercase. Associated with a line-based active state indicator (e.g., a short red underline appearing on interaction). |
| Minimal Pill Indicator | Carousel/slider pagination | Small, horizontally oriented pills. Inactive indicators are thin gray outlines or filled with `Ash Mist` (#8f8f8f). Active indicator is a `Rosso Corsa` (#FF0000) filled pill, signaling current slide without heavy branding. |
| Feature Card Headline | Editorial content headline | Large, bold `Polar White` (#ffffff) text using the `Body-Font` with wide letter-spacing, set against a dark background or on a `Polar White` content card. Accompanied by a smaller `Body-Font` body text. |
| Body Text Paragraph | Standard informational text | Light gray `Ash Mist` (#8f8f8f) or `Polar White` (#ffffff) body text at 12px with a line-height of 1.78 to 2.00, and letter-spacing of 0.0150em or 0.0220em, providing comfortable readability on both dark and light sections. |
| Footer Link | Secondary navigation and informational links | `Shadow Graphite` (#181818) text on a dark background, or `Polar White` (#ffffff) text where more emphasis is needed. Uses `Body-Font` at 11px or 12px, with a generous line-height and medium letter-spacing. |

## Dos

- Do utilize a high-contrast palette of `Obsidian Black` (#000000) and `Polar White` (#ffffff) as the primary background and text colors to maintain a dramatic and luxurious feel.
- Do apply `Rosso Corsa` (#FF0000) as the sole accent color, reserving it exclusively for interactive elements and key indicators to command attention.
- Do apply custom `Body-Font` with generous letter-spacing (e.g., 0.0830em for navigation) for headlines and navigation to emphasize precision and exclusivity.
- Do use a 'comfortably spaced' rhythm with `elementGap` of `10px` and `cardPadding` of `20px` to maintain order and focus.
- Do maintain sharp, `0px` radius on all interactive elements and containers to reinforce the engineered aesthetic.
- Do use the `Shadow Graphite` (#181818) and `Steel Gray` (#303030) as subtle surface variations rather than relying on drop shadows for depth.

## Donts

- Don't introduce additional chromatic colors; the system is built on a black-and-white foundation with a single `Rosso Corsa` accent.
- Don't use rounded corners or soft edges on any components; the design demands sharp, precise lines (`0px` radius).
- Don't use drop shadows for elevation; rely on shifts in neutral background colors (`#000000`, `#181818`, `#ffffff`) to create hierarchy and depth.
- Don't use tight letter-spacing; the custom `Body-Font`'s inherent wide spacing is a core part of the brand's typographic identity.
- Don't embed images with external context; use tightly cropped, abstract, or studio-shot product imagery that isolates the subject.
- Don't deviate from the `Body-Font` for text elements; the system relies on this single typeface for typographic consistency and brand identity.

## Transferable Lessons

- Read this source through the lens of High-End Design: High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
