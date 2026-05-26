# Yung Studio - Monochrome UI Source Notes

Source: https://styles.refero.design/style/2d43b251-ad01-4e59-9068-502457aa0592
Site: https://yung.studio
North star: Monochromatic Command Center. Pure black canvas where sharp white elements punctuate with precision and ample negative space.
Theme: dark

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Midnight Void | #000000 | neutral | Page backgrounds, card backgrounds, text on white buttons – the foundational darkness. |
| Ghost White | #ffffff | neutral | Primary text, button backgrounds, interactive elements – the dominant light element creating high contrast. |
| Accent Violet | #c692ff | brand | Subtle background accents, specific contextual highlights; provides the only chromatic color for visual differentiation. |

## Typography

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

## Layout

No explicit layout field extracted.

## Spacing

- Section gap: 60-124px
- Element gap: 20-24px
- Card padding: 0px
- Page max width: not specified
- Radius: {"cards":"0px","buttons":"9999px","default":"10px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Action Button Group |  | <div style="--color-midnight-void: #000000; --color-ghost-white: #ffffff; --color-accent-violet: #c692ff; --font-polysans-slim: 'Inter', sans-serif; --font-polysans-neutral: 'Inter', sans-serif; --font-polysans-bulky: 'Inter', sans-serif; background: var(--color-midnight-void); padding: 60px 50px; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; width: 600px; box-sizing: border-box; font-family: var(--font-polysans-slim);"><p style="color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; line-height: 1.35; letter-spacing: -0.01em; margin: 0 0 12px 0; opacity: 0.6; text-transform: uppercase; font-weight: 400;">Interactions</p><div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;"><a href="#" style="display: inline-block; background: var(--color-ghost-white); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 20px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 32px 50px 22px 50px; border-radius: 9999px; text-decoration: none; white-space: nowrap;">Get in touch</a><a href="#" style="display: inline-block; background: transparent; color: var(--color-ghost-white); font-family: var(--font-polysans-neutral); font-size: 20px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 32px 50px 22px 50px; border-radius: 9999px; text-decoration: none; border: 2px solid var(--color-ghost-white); white-space: nowrap;">Our work</a></div><div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-top: 16px;"><a href="#" style="display: inline-block; background: var(--color-accent-violet); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 16px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 22px 36px 16px 36px; border-radius: 9999px; text-decoration: none; white-space: nowrap;">Start a project</a><a href="#" style="display: inline-block; background: transparent; color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; letter-spacing: -0.01em; line-height: 1.35; padding: 22px 36px 16px 36px; border-radius: 9999px; text-decoration: none; border: 1px solid rgba(255,255,255,0.3); white-space: nowrap;">Learn more</a></div></div> |
| Stat / Metric Block |  | <div style="--color-midnight-void: #000000; --color-ghost-white: #ffffff; --color-accent-violet: #c692ff; --font-polysans-slim: 'Inter', sans-serif; --font-polysans-neutral: 'Inter', sans-serif; --font-polysans-bulky: 'Inter', sans-serif; background: var(--color-midnight-void); padding: 60px 50px; width: 600px; box-sizing: border-box;"><p style="color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; line-height: 1.35; letter-spacing: -0.01em; margin: 0 0 48px 0; opacity: 0.6; text-transform: uppercase; font-weight: 400;">By the numbers</p><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0px;"><div style="padding: 32px 0 32px 0; border-top: 1px solid rgba(255,255,255,0.15); border-right: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">120+</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Projects delivered</div></div><div style="padding: 32px 0 32px 32px; border-top: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">8+</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Years of craft</div></div><div style="padding: 32px 0 0 0; border-top: 1px solid rgba(255,255,255,0.15); border-right: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-accent-violet); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">40+</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Global brands</div></div><div style="padding: 32px 0 0 32px; border-top: 1px solid rgba(255,255,255,0.15);"><div style="font-family: var(--font-polysans-neutral); font-size: 60px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 14px;">3×</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Average growth rate</div></div></div></div> |
| Service / Feature Cards |  | <div style="--color-midnight-void: #000000; --color-ghost-white: #ffffff; --color-accent-violet: #c692ff; --font-polysans-slim: 'Inter', sans-serif; --font-polysans-neutral: 'Inter', sans-serif; --font-polysans-bulky: 'Inter', sans-serif; background: var(--color-midnight-void); padding: 60px 50px; width: 600px; box-sizing: border-box;"><p style="color: var(--color-ghost-white); font-family: var(--font-polysans-slim); font-size: 16px; line-height: 1.35; letter-spacing: -0.01em; margin: 0 0 48px 0; opacity: 0.6; text-transform: uppercase; font-weight: 400;">What we do</p><div style="display: flex; flex-direction: column; gap: 0;"><div style="padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;"><div style="flex: 1;"><div style="font-family: var(--font-polysans-neutral); font-size: 30px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 14px;">Strategy</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Brand positioning, audience insight, and growth frameworks that turn vision into a clear direction.</div></div><a href="#" style="flex-shrink: 0; background: var(--color-ghost-white); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 14px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 14px 24px 10px 24px; border-radius: 9999px; text-decoration: none; align-self: center;">Explore →</a></div><div style="padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;"><div style="flex: 1;"><div style="font-family: var(--font-polysans-neutral); font-size: 30px; font-weight: 400; color: var(--color-ghost-white); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 14px;">Design</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Visual identity, UI systems, and brand expression that make you unforgettable across every touchpoint.</div></div><a href="#" style="flex-shrink: 0; background: var(--color-ghost-white); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 14px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 14px 24px 10px 24px; border-radius: 9999px; text-decoration: none; align-self: center;">Explore →</a></div><div style="padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.15); border-bottom: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;"><div style="flex: 1;"><div style="font-family: var(--font-polysans-neutral); font-size: 30px; font-weight: 400; color: var(--color-accent-violet); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 14px;">Digital</div><div style="font-family: var(--font-polysans-slim); font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: -0.01em; line-height: 1.35;">Web, content, and campaign execution that drives real, measurable action and lasting audience connection.</div></div><a href="#" style="flex-shrink: 0; background: var(--color-accent-violet); color: var(--color-midnight-void); font-family: var(--font-polysans-neutral); font-size: 14px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; padding: 14px 24px 10px 24px; border-radius: 9999px; text-decoration: none; align-self: center;">Explore →</a></div></div></div> |
| Primary Action Button | Interactive element | White background (`#ffffff`), black text (`#000000`). Fully rounded with `9999px` border-radius. Generous padding: `31.968px` top, `22.032px` bottom, `49.968px` sides. Uses PolySans-Neutral font, weight 400, for clear call to action. |
| Naked Content Card | Content container | Transparent background (`rgba(0, 0, 0, 0)`) with `0px` border-radius. No box-shadow or padding, integrating seamlessly into the negative space. Used for showcasing work items or article previews. |
| Text Link | Navigation/Internal link | Uses PolySans-Slim for general links, or PolySans-Bulky at 28px for prominent links. Text color is `Ghost White` (`#ffffff`) against `Midnight Void` (`#000000`), no underline by default. |
| Header Logo | Brand identity | Uses PolySans-Slim at a 20px size, weight 400, `Ghost White` (`#ffffff`), positioned top-left on the `Midnight Void` (`#000000`) background. |

## Dos

- Maintain a strict achromatic palette, using only `Midnight Void` (#000000) for backgrounds and `Ghost White` (#ffffff) for primary foreground elements.
- Apply `9999px` border-radius to all interactive element buttons for a consistent pill shape.
- Utilize PolySans-Neutral with -0.0200em letter-spacing for all significant headings to create a dense, impactful typographic appearance.
- Implement `--obe` (#c692ff) sparingly as the sole chromatic accent, allowing it to highlight specific backgrounds or subtle contextual elements.
- Ensure generous `50px` horizontal padding for content sections and `20-24px` vertical spacing between elements to preserve ample negative space.
- Employ PolySans-Slim as the default font for all body copy and most secondary text at weight 400, ensuring clear readability across sizes.

## Donts

- Avoid introducing any additional saturated colors beyond the designated `--ube` (#c692ff) to prevent diluting the distinct monochrome aesthetic.
- Do not use box-shadows or drop shadows; depth is implied solely through stark contrast and generous negative space.
- Refrain from deviating from the specified PolySans typefaces; custom fonts are a core identifier, and system defaults would undermine the brand.
- Do not add borders or background colors to content cards; they should appear as seamless blocks of text on the `Midnight Void` background.
- Avoid using radii other than `0px` for content containers and `9999px` for buttons, to maintain precision and the signature rounded forms.
- Do not clutter content sections; maintain the spacious `50px` horizontal padding and ample vertical element gaps to preserve legibility and impact.

## Transferable Lessons

- Read this source through the lens of Monochrome UI: Monochrome UI succeeds when every shade has a job. The absence of color should make hierarchy sharper, not make the interface vague.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
