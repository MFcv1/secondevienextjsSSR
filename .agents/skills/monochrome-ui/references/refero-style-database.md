---
name: monochrome-ui
description: Use this skill to create monochrome interfaces built from black, white, gray, inversion, borders, typography, density, and disciplined state design without relying on chromatic decoration.
---

# Monochrome UI Design Skill

## 1. Source Basis

This skill consolidates five Refero references for the "Monochrome UI" suggested category.

| Reference | Refero Source | Site | North Star |
| --- | --- | --- | --- |
| Figma Config | https://styles.refero.design/style/8caa5004-a8cc-4c7e-a2bb-00ff60618729 | https://config.figma.com/events/figma-config-2022 | monochrome command console |
| mono | https://styles.refero.design/style/859f6be7-9d2d-4da6-a9b7-baa658172696 | https://mono.frm.fm/en | Architectural grid on white |
| Yung Studio | https://styles.refero.design/style/2d43b251-ad01-4e59-9068-502457aa0592 | https://yung.studio | Monochromatic Command Center. Pure black canvas where sharp white elements punctuate with precision and ample negative space. |
| kaisermann | https://styles.refero.design/style/872ce8b7-993d-4dea-a361-9ccb59d136c0 | https://kaisermann.me | monochrome command-line interface |
| Ui | https://styles.refero.design/style/0fd67ec5-7e9c-4ca9-b368-5d9c7388477a | https://ui.shadcn.com | Monochromatic architectural blueprint – precise, functional forms on a stark, bright canvas. |

## 2. North Star

Monochrome UI succeeds when every shade has a job. The absence of color should make hierarchy sharper, not make the interface vague.

The desired feeling is: disciplined, stark, systematic, editorial, exact, reduced.

The accent policy is: no accent by default; if needed, one emergency or link color with a defined semantic job.

Primary warning: avoid random gray ramps, low-contrast metadata, decorative black cards, overuse of outlines, and monochrome pages that feel like unstyled wireframes.

Use this skill as a practical design system brief. It should help an agent create a visually specific site or app, not just describe the mood. Every recommendation should translate into concrete choices: tokens, layout, typography, components, interaction, imagery, and QA.

## 3. When To Use This Skill

Use Monochrome UI when:

- the user asks for a visual direction matching disciplined, stark, systematic, editorial, exact, reduced
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

### 1. Figma Config

Source: https://styles.refero.design/style/8caa5004-a8cc-4c7e-a2bb-00ff60618729  
Site: https://config.figma.com/events/figma-config-2022  
North star: monochrome command console  
Theme: dark

#### What This Source Adds

This reference expands the Monochrome UI skill by showing how monochrome command console can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Void | #000000 | neutral | Page background, primary text on light surfaces, button backgrounds for primary actions |
| Ghost White | #e2e2e2 | neutral | Primary text on dark backgrounds, ghost button borders, navigation links |
| Shadow Charcoal | #3d3d3d | neutral | Subtle button borders, secondary dividers |
| Polar Mist | #ffffff | neutral | Background for lighter surfaces, such as cookie consent dialogs, secondary text color on dark backgrounds |

#### Typography

#### Typeface 1: figmaSans

- Role: Primary brand typeface for all headlines, body text, and interactive elements. Its specific letter-spacing creates a compact, intentional appearance, especially noticeable on larger headings.
- Fallback: Inter
- Weights: 400
- Sizes: 16px, 18px, 20px, 32px, 80px
- Line height: 0.95, 1.00, 1.10, 1.25, 1.30
- Letter spacing: -0.0300em at large sizes, -0.0200em at medium sizes

#### Typeface 2: figmaMono

- Role: Monospaced typeface for code snippets or technical details, offering a distinct visual break from the primary typeface while maintaining legibility.
- Fallback: Menlo
- Weights: 400
- Sizes: 16px
- Line height: 1.30
- Letter spacing: normal

#### Layout Reading

The page maintains a full-bleed dark background, with content neatly centered or aligned to the left. The hero section features a prominent headline centered over the dark background. Sections generally use consistent vertical spacing, often indicated by the 40px section gap. Content arrangement appears to be stacked vertically, with some areas allowing for asymmetric or interleaved visual elements like the abstract shapes. The navigation is a minimal, right-aligned header bar that stays fixed at the top, offering essential links.

#### Spacing Reading

- Section gap: 40px
- Element gap: 12px
- Card padding: 12px
- Page max width: not specified
- Radius: {"buttons":"0px","navPills":"50%"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Filled Button | Main call-to-action on dark backgrounds. | Solid Midnight Void background, Ghost White text. Padding 12px horizontal and vertical. Square corners (0px radius). Example: 'ALLOW ALL COOKIES'. |
| Ghost Button | Secondary action or navigable link that appears as a button. | Transparent background, Ghost White text and 1px border. No padding specified, acts as a text link with button styling. Example: 'GO TO HOMEPAGE'. |
| Cookie Consent Button | Button within the cookie consent dialog. | Solid Midnight Void background with Ghost White text and a subtle 1px border of `rgba(255, 255, 255, 0.24)`. Rounded with 50% border radius. No explicit padding data, likely derived from text size. |
| Navigation Link | Top-level navigation items. | Ghost White text, with a 1px border of Midnight Void. Compact padding of 4-6px vertical and 6-12px horizontal. Renders as text only with a subtle underline effect on hover (not present in current data). |
| Cookie Consent Panel | Floating informational message. | Polar Mist background with Midnight Void text for primary content. Elements within use Shadow Charcoal borders. Padding is not explicit but appears generous. Square corners (0px radius). |

#### Carry Forward

- Use Midnight Void (#000000) as the dominant background color for all main canvas areas.
- Apply FigmaSans for all text elements, setting letter-spacing to -0.0300em for display text (80px, 32px) and -0.0200em for smaller headings and body text.
- Form primary interactive buttons with a Midnight Void (#000000) background and Ghost White (#e2e2e2) text, using 0px border-radius.
- For ghost buttons or secondary actions, use Ghost White (#e2e2e2) for both text and a 1px border, maintaining a transparent background.
- Utilize the 4-6px vertical padding and 6-12px horizontal padding for navigation and compact interactive elements.
- Maintain a primary text color of Ghost White (#e2e2e2) against dark backgrounds and Midnight Void (#000000) against light backgrounds.
- Apply 1px borders using Midnight Void or Shadow Charcoal (#3d3d3d) for subtle division and emphasis.

#### Avoid

- Avoid using gradients; the system relies on flat colors for a stark, impactful appearance.
- Do not introduce intermediate grey tones between Midnight Void (#000000) and Ghost White (#e2e2e2) without a clear functional purpose, as the system favors high contrast.
- Do not use highly saturated colors for large surface areas; color is reserved for functional accents or semantic states.
- Do not use generic system fonts; stick to figmaSans or figmaMono for all typographic elements.
- Avoid soft, rounded corners for main interactive elements (buttons, cards); prefer sharp, square edges unless specifically for small pill-shaped accents.
- Do not use drop shadows for elevation; rely on color contrast and borders to define hierarchy and interactive states.


### 2. mono

Source: https://styles.refero.design/style/859f6be7-9d2d-4da6-a9b7-baa658172696  
Site: https://mono.frm.fm/en  
North star: Architectural grid on white  
Theme: light

#### What This Source Adds

This reference expands the Monochrome UI skill by showing how Architectural grid on white can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, form input fields — a stark, pure white for a clean, expansive feel |
| Ink Black | #292929 | neutral | Primary text, headings, button borders, icons, dividing lines — provides sharp definition against Canvas White. Acts as the primary border and text color for interactive elements |
| Deep Black | #000000 | neutral | Decorative fills (SVGs), input text, and borders — used sparingly for maximum contrast in specific UI elements |

#### Typography

#### Typeface 1: NH

- Role: Primary headings and body text. Its subtle negative letter-spacing contributes to the precise, condensed feel.
- Fallback: Helvetica Neue
- Weights: 100, 300, 400
- Sizes: 16px, 18px, 25px, 32px, 40px, 43px
- Line height: 1.20, 1.25, 1.27, 1.34, 1.50
- Letter spacing: -0.0200em

#### Typeface 2: S-Condensed

- Role: Navigation links, metadata, and labels. The pronounced positive letter-spacing creates a distinctive, airy appearance for functional text.
- Fallback: Impact
- Weights: 300, 400, 500
- Sizes: 12px, 14px, 40px
- Line height: 0.90, 1.18, 1.20, 1.34
- Letter spacing: 0.1000em, 0.2000em

#### Typeface 3: EV

- Role: Specialized, extremely light headlines. Its very tight tracking and light weight make it feel almost etched.
- Fallback: Roboto Thin
- Weights: 100
- Sizes: 28px
- Line height: 0.90
- Letter spacing: -0.0500em

#### Typeface 4: S-Works

- Role: Unique, expressive headlines. The moderate weight and normal letter-spacing allow it to stand out against more tracked and condensed fonts.
- Fallback: Bebas Neue Pro
- Weights: 350
- Sizes: 40px
- Line height: 1.34
- Letter spacing: normal

#### Layout Reading

The page uses a full-bleed layout, particularly for the main canvas, but frequently employs strong vertical and horizontal dividers to create distinct, modular content blocks. The hero section often features a large, singular product image or graphic, sometimes with overlay text, defining a clear focal point. Content progresses with a mix of stacked, centered headlines and text blocks, alongside two-column layouts where text and visuals alternate. A strong underlying grid is evident, with elements often snapping to these implicit lines. Vertical rhythm is established through consistent spacing, and sections can alternate between pure white and light gray backgrounds for differentiation. Navigation is minimalist, adhering to a fixed top bar on larger screens with simple text links.

#### Spacing Reading

- Section gap: 40px
- Element gap: 8px
- Card padding: 20px
- Page max width: not specified
- Radius: {"none":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Outline Button | Primary and secondary actions with minimal visual weight. | Text in Ink Black (#292929) on a transparent background, with a 1px solid Ink Black border and 0px radius. Padding is 0px top/bottom, 20px left/right, giving a wide, flat appearance. |
| Minimal Input Field | Standard text input fields. | Background is Canvas White (#ffffff), text is Deep Black (#000000), with a 1px solid Deep Black border. No border-radius. Padding is 8px top/bottom, 0px left/right, emphasizing vertical alignment. |
| Navigation Link | Top-level navigation items and language selectors. | Utilizes S-Condensed, with specific letter-spacing. Colors are Ink Black (#292929) for text. Often appears with a thin Ink Black border on hover or active state to denote selection. |
| Section Heading | Major content section titles. | Typography from NH family, often at 43px or 40px, with specific letter-spacing -0.0200em. Uses Ink Black (#292929) color. Frequently bordered by Ink Black lines to separate content areas. |

#### Carry Forward

- Maintain a clear, high-contrast between Ink Black (#292929) text/lines and Canvas White (#ffffff) backgrounds.
- Utilize 0px border-radius for all interactive elements and containers to maintain the precise, angular aesthetic.
- Apply positive letter-spacing (0.1em or 0.2em) from S-Condensed for navigation, tags, and small labels to distinguish them from body text.
- Use thin (1px) Ink Black (#292929) borders as the primary visual cue for interactive elements and content divisions.
- Structure layouts using visible grid lines or strong horizontal/vertical divisions rather than relying on card elevation or soft shadows.
- Emphasize content hierarchy through variations in font-family, weight, and letter-spacing rather than relying on color or large size differences.
- For buttons, use transparent backgrounds with Ink Black (#292929) text and borders, with 0px vertical padding and 20px horizontal padding.

#### Avoid

- Avoid using any color other than Ink Black (#292929), Deep Black (#000000), or Canvas White (#ffffff) for primary UI elements.
- Do not introduce rounded corners or soft shadows; all elements should adhere to a sharp, planar aesthetic.
- Do not use generic system fonts for headings or key interface elements; always select from the specified custom typography. 
- Avoid large and complex hero components; opt for minimal, high-contrast textual statements or product visuals on a Canvas White (#ffffff) background.
- Do not use subtle gray text for functional elements; all text, save for contextual accents, should be Ink Black for maximum impact.
- Do not use excessive padding or element gaps; maintain an efficient information density with 8px as a common element gap and 20px for card padding.
- Do not design buttons with solid background fills; all buttons should be ghosted or outlined.


### 3. Yung Studio

Source: https://styles.refero.design/style/2d43b251-ad01-4e59-9068-502457aa0592  
Site: https://yung.studio  
North star: Monochromatic Command Center. Pure black canvas where sharp white elements punctuate with precision and ample negative space.  
Theme: dark

#### What This Source Adds

This reference expands the Monochrome UI skill by showing how Monochromatic Command Center. Pure black canvas where sharp white elements punctuate with precision and ample negative space. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Void | #000000 | neutral | Page backgrounds, card backgrounds, text on white buttons – the foundational darkness. |
| Ghost White | #ffffff | neutral | Primary text, button backgrounds, interactive elements – the dominant light element creating high contrast. |
| Accent Violet | #c692ff | brand | Subtle background accents, specific contextual highlights; provides the only chromatic color for visual differentiation. |

#### Typography

#### Typeface 1: PolySans-Slim

- Role: Body text, smaller headings, supporting information, links, and various content elements. Its uniform weight contributes to a calm, readable tone across varied text sizes.
- Fallback: Inter
- Weights: 400
- Sizes: 16px, 20px, 30px, 40px
- Line height: 1.00, 1.10, 1.35
- Letter spacing: -0.0100em

#### Typeface 2: PolySans-Neutral

- Role: Display headings and prominent interactive elements like buttons. The extremely tight letter-spacing at large sizes creates a dense, impactful visual block rather than sprawling text, like a bold declaration.
- Fallback: Inter
- Weights: 400
- Sizes: 60px, 160px
- Line height: 0.90, 1.10
- Letter spacing: -0.0200em

#### Typeface 3: PolySans-Bulky

- Role: Specialized links and secondary headings. This family variation offers a bulkier form factor for specific emphasis at a mid-range size.
- Fallback: Inter
- Weights: 400
- Sizes: 28px
- Line height: 1.01
- Letter spacing: -0.0100em

#### Layout Reading

No explicit layout field extracted.

#### Spacing Reading

- Section gap: 60-124px
- Element gap: 20-24px
- Card padding: 0px
- Page max width: not specified
- Radius: {"cards":"0px","buttons":"9999px","default":"10px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Action Button Group |  | <div style="--color-midnight-void: #000000; --color-ghost-white: #ffffff; --color-accent-violet: #c692ff; --font-polysans-slim: 'Inter', sans-serif; --font-polysans-neutral: 'Inter', sans-serif; --font-polysans-bulky: 'Inter', sans-serif; background: var(--color-midnight-void); padding: 60px 50px; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; width: 600px; box-sizing: border-box; font-family: var(--font-polysans-slim);"><p style="color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; line-height: 1.35; letter-spacing: -0.01em; margin: 0 0 12px 0; opacity: 0.6; text-transform: uppercase; font-weight: 400;">Interactions</p><div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;"><a href="#" style="display: inline-block; background: var(--color-ghost-white); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 20px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 32px 50px 22px 50px; border-radius: 9999px; text-decoration: none; white-space: nowrap;">Get in touch</a><a href="#" style="display: inline-block; background: transparent; color: var(--color-ghost-white); font-family: var(--font-polysans-neutral); font-size: 20px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 32px 50px 22px 50px; border-radius: 9999px; text-decoration: none; border: 2px solid var(--color-ghost-white); white-space: nowrap;">Our work</a></div><div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-top: 16px;"><a href="#" style="display: inline-block; background: var(--color-accent-violet); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 16px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 22px 36px 16px 36px; border-radius: 9999px; text-decoration: none; white-space: nowrap;">Start a project</a><a href="#" style="display: inline-block; background: transparent; color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; letter-spacing: -0.01em; line-height: 1.35; padding: 22px 36px 16px 36px; border-radius: 9999px; text-decoration: none; border: 1px solid rgba(255,255,255,0.3); white-space: nowrap;">Learn more</a></div></div> |
| Stat / Metric Block |  | <div style="--color-midnight-void: #000000; --color-ghost-white: #ffffff; --color-accent-violet: #c692ff; --font-polysans-slim: 'Inter', sans-serif; --font-polysans-neutral: 'Inter', sans-serif; --font-polysans-bulky: 'Inter', sans-serif; background: var(--color-midnight-void); padding: 60px 50px; width: 600px; box-sizing: border-box;"><p style="color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; line-height: 1.35; letter-spacing: -0.01em; margin: 0 0 48px 0; opacity: 0.6; text-transform: uppercase; font-weight: 400;">By the numbers</p><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0px;"><div style="padding: 32px 0 32px 0; border-top: 1px solid rgba(255,255,255,0.15); border-right: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">120+</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Projects delivered</div></div><div style="padding: 32px 0 32px 32px; border-top: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">8+</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Years of craft</div></div><div style="padding: 32px 0 0 0; border-top: 1px solid rgba(255,255,255,0.15); border-right: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-accent-violet); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">40+</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Global brands</div></div><div style="padding: 32px 0 0 32px; border-top: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">3×</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Average growth rate</div></div></div></div> |
| Service / Feature Cards |  | <div style="--color-midnight-void: #000000; --color-ghost-white: #ffffff; --color-accent-violet: #c692ff; --font-polysans-slim: 'Inter', sans-serif; --font-polysans-neutral: 'Inter', sans-serif; --font-polysans-bulky: 'Inter', sans-serif; background: var(--color-midnight-void); padding: 60px 50px; width: 600px; box-sizing: border-box;"><p style="color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; line-height: 1.35; letter-spacing: -0.01em; margin: 0 0 48px 0; opacity: 0.6; text-transform: uppercase; font-weight: 400;">What we do</p><div style="display: flex; flex-direction: column; gap: 0;"><div style="padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;"><div style="flex: 1;"><div style="font-family: var(--font-polysans-neutral); font-size: 30px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 14px;">Strategy</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Brand positioning, audience insight, and growth frameworks that turn vision into a clear direction.</div></div><a href="#" style="flex-shrink: 0; background: var(--color-ghost-white); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 14px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 14px 24px 10px 24px; border-radius: 9999px; text-decoration: none; align-self: center;">Explore →</a></div><div style="padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;"><div style="flex: 1;"><div style="font-family: var(--font-polysans-neutral); font-size: 30px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 14px;">Design</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Visual identity, UI systems, and brand expression that make you unforgettable across every touchpoint.</div></div><a href="#" style="flex-shrink: 0; background: var(--color-ghost-white); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 14px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 14px 24px 10px 24px; border-radius: 9999px; text-decoration: none; align-self: center;">Explore →</a></div><div style="padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.15); border-bottom: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;"><div style="flex: 1;"><div style="font-family: var(--font-polysans-neutral); font-size: 30px; font-weight: 400; color: var(--color-accent-violet); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 14px;">Digital</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Web, content, and campaign execution that drives real, measurable action and lasting audience connection.</div></div><a href="#" style="flex-shrink: 0; background: var(--color-accent-violet); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 14px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 14px 24px 10px 24px; border-radius: 9999px; text-decoration: none; align-self: center;">Explore →</a></div></div></div> |
| Primary Action Button | Interactive element | White background (`#ffffff`), black text (`#000000`). Fully rounded with `9999px` border-radius. Generous padding: `31.968px` top, `22.032px` bottom, `49.968px` sides. Uses PolySans-Neutral font, weight 400, for clear call to action. |
| Naked Content Card | Content container | Transparent background (`rgba(0, 0, 0, 0)`) with `0px` border-radius. No box-shadow or padding, integrating seamlessly into the negative space. Used for showcasing work items or article previews. |
| Text Link | Navigation/Internal link | Uses PolySans-Slim for general links, or PolySans-Bulky at 28px for prominent links. Text color is `Ghost White` (`#ffffff`) against `Midnight Void` (`#000000`), no underline by default. |
| Header Logo | Brand identity | Uses PolySans-Slim at a 20px size, weight 400, `Ghost White` (`#ffffff`), positioned top-left on the `Midnight Void` (`#000000`) background. |

#### Carry Forward

- Maintain a strict achromatic palette, using only `Midnight Void` (#000000) for backgrounds and `Ghost White` (#ffffff) for primary foreground elements.
- Apply `9999px` border-radius to all interactive element buttons for a consistent pill shape.
- Utilize PolySans-Neutral with -0.0200em letter-spacing for all significant headings to create a dense, impactful typographic appearance.
- Implement `--obe` (#c692ff) sparingly as the sole chromatic accent, allowing it to highlight specific backgrounds or subtle contextual elements.
- Ensure generous `50px` horizontal padding for content sections and `20-24px` vertical spacing between elements to preserve ample negative space.
- Employ PolySans-Slim as the default font for all body copy and most secondary text at weight 400, ensuring clear readability across sizes.

#### Avoid

- Avoid introducing any additional saturated colors beyond the designated `--ube` (#c692ff) to prevent diluting the distinct monochrome aesthetic.
- Do not use box-shadows or drop shadows; depth is implied solely through stark contrast and generous negative space.
- Refrain from deviating from the specified PolySans typefaces; custom fonts are a core identifier, and system defaults would undermine the brand.
- Do not add borders or background colors to content cards; they should appear as seamless blocks of text on the `Midnight Void` background.
- Avoid using radii other than `0px` for content containers and `9999px` for buttons, to maintain precision and the signature rounded forms.
- Do not clutter content sections; maintain the spacious `50px` horizontal padding and ample vertical element gaps to preserve legibility and impact.


### 4. kaisermann

Source: https://styles.refero.design/style/872ce8b7-993d-4dea-a361-9ccb59d136c0  
Site: https://kaisermann.me  
North star: monochrome command-line interface  
Theme: dark

#### What This Source Adds

This reference expands the Monochrome UI skill by showing how monochrome command-line interface can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Terminal Black | #000000 | neutral | Page backgrounds, surface background for all elements, creating a deep digital void |
| Text Gray | #a0a0a0 | neutral | Medium-contrast borders, control outlines, and structural separators. Do not promote it to the primary CTA color |
| Active White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |
| Glitch Cyan | #02b7b6 | accent | Decorative glitch effect on text and UI elements, adding a digital artifact quality |
| Glitch Red | #b70202 | accent | Decorative glitch effect on text and UI elements, adding a digital artifact quality |

#### Typography

#### Typeface 1: VCR OSD Mono

- Role: All text elements, including headings, body, navigation, and buttons. Its fixed-width, pixelated style is central to the retro terminal aesthetic, creating an intentional low-fidelity digital feel.
- Fallback: monospace
- Weights: 400
- Sizes: 23px, 26px, 63px
- Line height: 0.90, 1.20, 1.40
- Letter spacing: normal

#### Layout Reading

The page adheres to a full-bleed layout, taking up the entire viewport without a maximum width or centered constraint. The hero section displays a minimal, centered text arrangement with header and metadata. Content sections flow vertically with consistent, generous 160px gaps between them, giving a spacious and uncluttered feel. The primary content arrangement is a single column of text, often with text-based 'links' acting as interactive elements. Navigation elements are subtly integrated into the header, typically text-only. The overall density is spacious, with ample negative space around text blocks.

#### Spacing Reading

- Section gap: 160px
- Element gap: 0px
- Card padding: 0px
- Page max width: not specified
- Radius: {"none":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Navigation Link | Primary navigation and interactive text elements within articles. | Text in Text Gray (#a0a0a0) with a 0px border-radius. On hover or active state, the text and a 1px bottom border switch to Active White (#ffffff). No background or padding. |
| Primary Heading | Main page titles and prominent textual information. | VCR OSD Mono, size 63px, line height 0.9. Color Active White (#ffffff). No background, border, or padding. Integrates directly into the page content. |
| Body Text Block | Standard page content and paragraphs. | VCR OSD Mono, size 23px or 26px, line height 1.2 or 1.4. Color Text Gray (#a0a0a0). Rendered as plain text or within card contexts without visual distinction. |
| System Status Line | Metadata display like dates and channel numbers. | Small text elements typically in the page header with Text Gray (#a0a0a0) and 0px radius. Used for functional, non-interactive visual data. |

#### Carry Forward

- Always use 'VCR OSD Mono' for all text content, respecting its fixed letter-spacing and line heights to maintain the pixelated aesthetic.
- Utilize Terminal Black (#000000) as the universal background for all sections and components without exception.
- Apply Active White (#ffffff) exclusively for high-emphasis text, active states, and interactive element borders.
- Employ Text Gray (#a0a0a0) for all primary body text, secondary information, and inactive interactive borders.
- Maintain a uniform 0px border-radius for all interactive and visual elements, reinforcing the sharp, digital interface feel.
- Keep padding and margins on interactive elements, like buttons and links, at 0px to ensure the compact, text-only interaction.
- Introduce Glitch Cyan or Glitch Red as decorative rgba(..., .4) overlays for hover states or loading indicators to amplify the retro digital effect.

#### Avoid

- Do not introduce any chromatic colors beyond the defined Glitch Cyan or Glitch Red accent, and only as subtle overlays or visual effects.
- Avoid using any form of background color or padding on interactive elements; they should appear as text-only entities with border changes for state.
- Never apply border-radius values greater than 0px to any component or element.
- Do not use box-shadows or any form of elevation; the design system emphasizes a flat, screen-rendered aesthetic.
- Avoid custom gradients; stick to the solid color palette and occasional glitch overlays.
- Do not use imagery in the main content area; the experience is text-centric and code-like.
- Refrain from using common UI iconography or graphical elements that deviate from the text-based or ASCII art style.


### 5. Ui

Source: https://styles.refero.design/style/0fd67ec5-7e9c-4ca9-b368-5d9c7388477a  
Site: https://ui.shadcn.com  
North star: Monochromatic architectural blueprint – precise, functional forms on a stark, bright canvas.  
Theme: light

#### What This Source Adds

This reference expands the Monochrome UI skill by showing how Monochromatic architectural blueprint – precise, functional forms on a stark, bright canvas. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page background, primary card surfaces, popovers. The foundational bright base. |
| Ghost Gray | #f2f2f2 | neutral | Secondary background for segmented sections or subtle card differentiation. Lighter than default background. |
| Subtle Ash | #e5e5e5 | neutral | Border colors for inputs, cards, and dividers. Provides definition without harshness. |
| Midtone Gray | #737373 | neutral | Muted text, placeholder text in inputs, secondary icons. Recedes into the background. |
| Rich Black | #0a0a0a | neutral | Primary text color for body copy, standard icons, badges with white text. High contrast for readability. |
| Deep Black | #000000 | neutral | Headings, active state button backgrounds, highlighted text. The darkest tone for strong emphasis. |
| Callout Red | #c22b10 | semantic | Destructive actions, error states. A muted, serious red. |
| Success Green | #10c22b | semantic | Success states, positive confirmations. A muted, serious green. |

#### Typography

#### Typeface 1: Geist

- Role: Primary brand font for all UI text, headings, and body. Its varied weights and precise tracking create a modern, technical feel.
- Fallback: Inter
- Weights: 400, 500, 600
- Sizes: 12px, 13px, 14px, 16px, 18px, 48px
- Line height: 1.00, 1.10, 1.20, 1.33, 1.38, 1.43, 1.50, 1.56, 1.63, 2.00
- Letter spacing: -0.0500em at 48px, -0.0250em at 18px

#### Typeface 2: Geist Mono

- Role: Used for code snippets or specific input fields requiring monospaced characters. Reinforces a technical aesthetic.
- Fallback: IBM Plex Mono
- Weights: 400
- Sizes: 14px
- Line height: 1.43
- Letter spacing: normal

#### Layout Reading

The page maintains a centered, contained layout with a maximum visible width, creating a focused content area. The hero section features a prominent, centered headline and subtext over the Canvas White background, followed by centrally aligned CTA buttons. Sections below are arranged in a multi-column grid, showcasing various UI components (forms, cards, controls). The rhythm is consistent vertical spacing, creating an organized, information-dense display. Navigation is a sticky top-bar with compact links and utility actions.

#### Spacing Reading

- Section gap: 83px
- Element gap: 8px
- Card padding: 16px
- Page max width: not specified
- Radius: {"pill":"9999px","badge":"26px","cards":"14px","input":"10px","buttons":"10px","default":"10px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Action Button | Call to action. | Solid Deep Black (#000000) background with Canvas White (#ffffff) text. Features a 10px border-radius, 8px vertical padding, and 48px horizontal padding, making it a prominent rectangular element. |
| Ghost Button | Secondary or tertiary actions, often within groups. | Transparent background with Rich Black (#0a0a0a) text. Uses a 9999px border-radius for a pill shape, with no explicit padding defined by variants, implying content-based sizing. |
| Split Button Left | Left segment of a grouped button control. | Canvas White (#ffffff) background with Deep Black (#000000) text. Features a 10px border-radius on the left, 0px on the right, and 10px horizontal padding. Borders in Subtle Ash (#e5e5e5). |
| Split Button Right | Right segment of a grouped button control. | Canvas White (#ffffff) background with Deep Black (#000000) text. Features a 10px border-radius on the right, 0px on the left. Borders in Subtle Ash (#e5e5e5). |
| Elevated Card | Containers for distinct content blocks, forms, or data. | Canvas White (#ffffff) background with a 14px border-radius. Features a subtle shadow: oklab(0.145 -0.00000143796 0.00000340492 / 0.1) 0px 0px 0px 1px, providing minimal elevation. Inner content padding is 16px. |
| Plain Input Field | Standard text input. | Transparent background with Rich Black (#0a0a0a) text. Defined by a 1px Subtle Ash (#e5e5e5) border and a 10px border-radius. Inner padding is 4px vertical, 10px horizontal. |
| Segmented Input Left | Left segment of a grouped input control. | Transparent background with Rich Black (#0a0a0a) text. Features a 10px border-radius on the left and 0px on the right. Defined by a 1px Subtle Ash (#e5e5e5) border. Inner padding is 4px vertical, 10px horizontal. |
| Inverse Tag Badge | Highlighting status or category, with high contrast. | Deep Black (#171717) background with Canvas White (#ffffff) text. Features a 26px border-radius, creating a pill shape. Padding is 2px vertical, 8px horizontal. |
| Neutral Tag Badge | Subtle categorization or status. | Ghost Gray (#f2f2f2) background with Rich Black (#0a0a0a) text. Features a 26px border-radius, creating a pill shape. Padding is 2px vertical, 8px horizontal. |
| Outline Tag Badge | Very subtle categorization or option. | Transparent background with Rich Black (#0a0a0a) text. Features a 26px border-radius and a Light Ash (#a1a1a1) border. Padding is 2px vertical, 8px horizontal. |

#### Carry Forward

- Use Deep Black (#000000) for primary headings and active states to command attention.
- Apply Subtle Ash (#e5e5e5) for all primary borders and dividers to maintain a subtle visual separation.
- Ensure input fields and cards consistently use a 10px or 14px border-radius, respectively, for geometric stability.
- Employ Geist font universally, leveraging its 400, 500, and 600 weights to establish clear hierarchy without introducing new typefaces.
- Maintain a default element gap of 8px, but use 16px for card inner padding to create adequate breathing room for content.
- Utilize 9999px or 26px border-radius for all interactive buttons and badges to create a soft, approachable pill shape.

#### Avoid

- Avoid using highly saturated colors; stick to the achromatic scale and the two semantic reds and greens.
- Do not introduce additional font families; the current choices are sufficient for all typographic needs.
- Refrain from using strong, multi-directional shadows; rely on minimal 1px shadows or simple borders for elevation.
- Do not deviate from the established border-radius values; the mix of sharp 0px (in split elements), 10px, 14px, and 9999px is intentional.
- Don't add excessive padding or margin; the design favors a compact density with specific, calculated spacing.
- Avoid decorative gradients; the brand's aesthetic is built on flat colors and subtle depth.


## 5. Archetype Library

### 1. Inverted Command Surface

Use this archetype when the project needs a disciplined, stark, systematic, editorial, exact, reduced feeling and the content naturally supports the inverted command surface pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use no accent by default; if needed, one emergency or link color with a defined semantic job.
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

The inverted command surface version of Monochrome UI often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 2. Gray-Layered Dashboard

Use this archetype when the project needs a disciplined, stark, systematic, editorial, exact, reduced feeling and the content naturally supports the gray-layered dashboard pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use no accent by default; if needed, one emergency or link color with a defined semantic job.
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

The gray-layered dashboard version of Monochrome UI often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 3. Editorial Index

Use this archetype when the project needs a disciplined, stark, systematic, editorial, exact, reduced feeling and the content naturally supports the editorial index pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use no accent by default; if needed, one emergency or link color with a defined semantic job.
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

The editorial index version of Monochrome UI often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 4. Monochrome Commerce

Use this archetype when the project needs a disciplined, stark, systematic, editorial, exact, reduced feeling and the content naturally supports the monochrome commerce pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use no accent by default; if needed, one emergency or link color with a defined semantic job.
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

The monochrome commerce version of Monochrome UI often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 5. Technical Control Panel

Use this archetype when the project needs a disciplined, stark, systematic, editorial, exact, reduced feeling and the content naturally supports the technical control panel pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use no accent by default; if needed, one emergency or link color with a defined semantic job.
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

The technical control panel version of Monochrome UI often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

## 6. Consolidated Color System

The palette below merges tokens observed across the five sources. Do not use every color. Treat it as a vocabulary for building a smaller project-specific system.

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Void | #000000 | neutral | Page background, primary text on light surfaces, button backgrounds for primary actions |
| Ghost White | #e2e2e2 | neutral | Primary text on dark backgrounds, ghost button borders, navigation links |
| Shadow Charcoal | #3d3d3d | neutral | Subtle button borders, secondary dividers |
| Polar Mist | #ffffff | neutral | Background for lighter surfaces, such as cookie consent dialogs, secondary text color on dark backgrounds |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, form input fields — a stark, pure white for a clean, expansive feel |
| Ink Black | #292929 | neutral | Primary text, headings, button borders, icons, dividing lines — provides sharp definition against Canvas White. Acts as the primary border and text color for interactive elements |
| Deep Black | #000000 | neutral | Decorative fills (SVGs), input text, and borders — used sparingly for maximum contrast in specific UI elements |
| Ghost White | #ffffff | neutral | Primary text, button backgrounds, interactive elements – the dominant light element creating high contrast. |
| Accent Violet | #c692ff | brand | Subtle background accents, specific contextual highlights; provides the only chromatic color for visual differentiation. |
| Terminal Black | #000000 | neutral | Page backgrounds, surface background for all elements, creating a deep digital void |
| Text Gray | #a0a0a0 | neutral | Medium-contrast borders, control outlines, and structural separators. Do not promote it to the primary CTA color |
| Active White | #ffffff | neutral | Hairline borders, dividers, input outlines, and card edges on light surfaces. Do not promote it to the primary CTA color |
| Glitch Cyan | #02b7b6 | accent | Decorative glitch effect on text and UI elements, adding a digital artifact quality |
| Glitch Red | #b70202 | accent | Decorative glitch effect on text and UI elements, adding a digital artifact quality |

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
- Does the style match disciplined, stark, systematic, editorial, exact, reduced?
- Are tokens consistent?
- Does the design avoid the warning: avoid random gray ramps, low-contrast metadata, decorative black cards, overuse of outlines, and monochrome pages that feel like unstyled wireframes?

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

Create a Monochrome UI interface that feels disciplined, stark, systematic, editorial, exact, reduced. Monochrome UI succeeds when every shade has a job. The absence of color should make hierarchy sharper, not make the interface vague. Use no accent by default; if needed, one emergency or link color with a defined semantic job. Build a complete, usable experience with clear hierarchy, real content structure, responsive behavior, accessible states, and a repeatable component system. avoid random gray ramps, low-contrast metadata, decorative black cards, overuse of outlines, and monochrome pages that feel like unstyled wireframes.

### 15.2 Landing Page Prompt

Design a Monochrome UI landing page with a strong first viewport, specific product or brand promise, credible proof, clear section rhythm, and a focused conversion path. The visual identity should come from typography, spacing, color roles, imagery, and component geometry rather than generic decoration.

### 15.3 App Interface Prompt

Design a Monochrome UI application screen for repeated use. Prioritize the main workflow, controls, state clarity, information density, and accessible interaction. Make the interface visually distinctive but keep operational surfaces calm enough for daily work.

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

A finished Monochrome UI design should:

- feel visually specific within the first viewport
- support real content and real workflows
- have consistent tokens
- have clear interaction states
- be responsive without losing character
- be accessible enough for production use
- translate the five source references into a broader reusable skill
