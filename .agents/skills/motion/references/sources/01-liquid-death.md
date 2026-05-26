# Liquid Death — Style Reference
> Heavy Metal Vending Machine

**URL:** https://liquiddeath.com
**Refero ID:** b6f2b036-e48e-452f-b003-941c491015c0
**Theme:** mixed (light + dark full-bleed bands)
**Category Tags:** Motion, High Contrast, Brutalist, DTC

This design system feels like a heavy metal concert flyer brought to life as a direct-to-consumer brand. The aesthetic is built on brutalist principles: a stark palette of pure black and white, zero rounded corners, and aggressive, uppercase typography. This creates a hard, confrontational edge, deliberately rejecting the soft, approachable look of typical beverage companies. Splashes of antique gold in logos and links are the only moments of warmth, acting like a glint of metal on a matte black surface. The layout uses full-bleed, high-contrast sections, creating a jarring, powerful rhythm that mirrors the brand's 'Murder Your Thirst' tagline.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Death Black | `#000000` | `--color-death-black` | Primary text, core UI backgrounds, filled buttons. Establishes the dominant, aggressive tone. |
| Bone White | `#ffffff` | `--color-bone-white` | Text on dark backgrounds, primary page backgrounds. |
| Off-Black | `#151515` | `--color-off-black` | Body copy on light backgrounds, secondary UI elements. |
| Ash Gray | `#e3e3e3` | `--color-ash-gray` | Product grid background, subtle dividers. |
| Gravel Gray | `#727272` | `--color-gravel-gray` | Secondary text, disabled states, placeholder text. |
| Light Ash | `#f5f5f5` | `--color-light-ash` | Alternative light background color for section differentiation. |
| Charcoal | `#232323` | `--color-charcoal` | Hover states on dark elements. |
| Input Border | `#999999` | `--color-input-border` | Default border color for text input fields. |
| Polished Gold | `#d2ac5a` | `--color-polished-gold` | Accents, special links, logotype details — a premium, metallic highlight against the stark monochrome. |
| Antique Gold | `#8a6d35` | `--color-antique-gold` | Hover state for gold accents, secondary logotype details. |

## Tokens — Typography

### Acumin Pro
- **Substitute:** 'Inter', 'Roboto', sans-serif
- **Weights:** 400, 500, 700
- **Sizes:** 12px, 14px, 16px, 18px, 20px, 24px, 32px, 36px, 40px, 56px, 60px
- **Line height:** 1.00, 1.05, 1.13, 1.20, 1.29, 1.50, 1.67, 2.00
- **Letter spacing:** 0.0200em, 0.0310em, 0.0560em, 0.0630em
- **Role:** The single, dominant typeface used for everything from massive uppercase headlines to body copy. Its clean, geometric form provides a brutalist, no-nonsense foundation. Extensive use of uppercase at 700 weight for headings is the brand's signature voice.

### Acumin Pro Condensed
- **Substitute:** 'Roboto Condensed', sans-serif
- **Weights:** 400, 700
- **Sizes:** 10px, 16px, 18px, 20px, 45px
- **Line height:** 1.00, 1.05, 1.20, 1.30
- **Letter spacing:** 0.0560em
- **Role:** Used sparingly for subtitles and calorie counts where horizontal space is limited.

### Type Scale (Minor Third 1.2 from 15px base)
| Role | Size | Line Height | Token |
|------|------|-------------|-------|
| caption | 10px | 1 | `--text-caption` |
| body-sm | 14px | 1.5 | `--text-body-sm` |
| body | 16px | 1.67 | `--text-body` |
| subheading | 24px | 1.2 | `--text-subheading` |
| heading-sm | 36px | 1.13 | `--text-heading-sm` |
| heading | 45px | 1.05 | `--text-heading` |
| display | 60px | 1 | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px
**Density:** comfortable
**Card padding:** 24px

### Spacing Scale
4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64 (all multiples of 4)

### Border Radius
| Element | Value |
|---------|-------|
| tags | 0px |
| cards | 0px |
| inputs | 0px |
| buttons | 0px |

## Components

### Primary Action Button
Solid rectangle. Background `Death Black` (#000000), text `Bone White` (#ffffff), padding 8px 16px, border-radius 0px. Uppercase Acumin Pro 700.

### Secondary Action Button
Outlined rectangle. Background transparent, 1px border `Death Black`, text `Death Black`, padding 13px, border-radius 0px. Uppercase Acumin Pro.

### Full-Width Banner CTA
Full-width block link. Background `Death Black`, text `Bone White`, right-aligned chevron. Always rectangular, 0px radius.

### Text Input Field
Sharp-cornered field. Background `Bone White`, text `Death Black`, 1px border `Input Border` (#999999). Padding 8px 12px, 0px radius.

### Navigation Link
Uppercase Acumin Pro 500, color `Off-Black` (#151515). No underline or background on hover.

### Modal Overlay
Semi-transparent `Gravel Gray` layer. Centered rectangular container in `Ash Gray`. All corners 0px radius.

## Do's

- Use 0px border-radius for all buttons, inputs, cards, and containers.
- Set all major headlines in uppercase Acumin Pro 700.
- Rely on stark `Death Black` and `Bone White` for primary backgrounds and text.
- Use full-bleed, high-contrast black and white sections to structure the page.
- Reserve `Polished Gold` and `Antique Gold` for logotypes and hyper-specific accents.
- Maintain high-contrast text accessibility (AAA) for all body copy.
- Use sharp, rectangular product imagery on solid `Ash Gray` backgrounds.

## Don'ts

- Never use rounded corners on any element.
- Do not use drop shadows or gradients for elevation.
- Avoid using sentence case for primary headlines.
- Don't use the gold colors for standard UI components like buttons or inputs.
- Do not introduce any soft or playful colors into the palette.
- Avoid subtle gray-on-gray text combinations.
- Don't use lifestyle photography; focus on the product or provocative concepts.

## Elevation
This design actively avoids drop shadows. Depth and hierarchy are achieved exclusively through high-contrast color blocking — placing `Bone White` elements on `Death Black` backgrounds or vice versa. Flat, graphic, intentionally harsh layering style.

## Imagery
Provocative and product-focused. High-contrast, stark product shots on plain backgrounds, or humorous absurd concepts. Used in full-bleed sections or contained sharp-edged blocks. No lifestyle photos. Skull-based logotypes reminiscent of band art, in black, white, and gold.

## Layout
Foundation of alternating, full-bleed content bands. Complex hero transitions into stark black/white/gray sections with strong vertical rhythm. Content centered, max-width pillar. Grids: rigid 3 or 4-column, no frills. Powerful, rhythmic, confrontational organization.

## Agent Prompt Guide

### Quick Color Reference
- Page Background: `#ffffff` (Bone White) / `#e3e3e3` (Ash Gray)
- Dark Section Background: `#000000` (Death Black)
- Text: `#151515` (Off-Black) on light, `#ffffff` (Bone White) on dark
- CTA Button: `#000000` background, `#ffffff` text
- Accent: `#d2ac5a` (Polished Gold)

## Similar Brands
- MSCHF (counter-culture, brutalist)
- Thrasher Magazine (gritty, gothic)
- Balenciaga under Demna (brutalist web, harsh)
- Kith (product-first grid, monochrome)

## Quick Start CSS Variables
```css
:root {
  /* Colors */
  --color-death-black: #000000;
  --color-bone-white: #ffffff;
  --color-off-black: #151515;
  --color-ash-gray: #e3e3e3;
  --color-gravel-gray: #727272;
  --color-light-ash: #f5f5f5;
  --color-charcoal: #232323;
  --color-input-border: #999999;
  --color-polished-gold: #d2ac5a;
  --color-antique-gold: #8a6d35;

  /* Typography */
  --font-acumin-pro: 'Acumin Pro', ui-sans-serif, system-ui, sans-serif;
  --font-acumin-pro-condensed: 'acumin-pro-condensed', sans-serif;

  --text-caption: 10px;     --leading-caption: 1;
  --text-body-sm: 14px;     --leading-body-sm: 1.5;
  --text-body: 16px;        --leading-body: 1.67;
  --text-subheading: 24px;  --leading-subheading: 1.2;
  --text-heading-sm: 36px;  --leading-heading-sm: 1.13;
  --text-heading: 45px;     --leading-heading: 1.05;
  --text-display: 60px;     --leading-display: 1;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;   --spacing-8: 8px;   --spacing-12: 12px;
  --spacing-16: 16px; --spacing-20: 20px; --spacing-24: 24px;
  --spacing-28: 28px; --spacing-32: 32px; --spacing-36: 36px;
  --spacing-40: 40px; --spacing-48: 48px; --spacing-56: 56px;
  --spacing-64: 64px;

  /* Radius */
  --radius-tags: 0px;
  --radius-cards: 0px;
  --radius-inputs: 0px;
  --radius-buttons: 0px;
}
```
