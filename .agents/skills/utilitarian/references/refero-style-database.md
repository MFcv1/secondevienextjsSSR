---
name: utilitarian
description: Use this skill to create utilitarian interfaces that prioritize function, speed, legibility, controls, repeated action, information density, and operational trust without decorative noise.
---

# Utilitarian Design Skill

## 1. Source Basis

This skill consolidates five Refero references for the "Utilitarian" suggested category.

| Reference | Refero Source | Site | North Star |
| --- | --- | --- | --- |
| Office Chair Finder | https://styles.refero.design/style/756dd3c1-6ccf-4824-bad3-96027cd0faf0 | https://findmy.vitra.com/en-en | Monochrome utility with active red accents. |
| MAKR | https://styles.refero.design/style/f2bf6db7-37b6-4394-be97-6bbb2c45c268 | https://makr.com | Workshop-crafted monochrome utility. |
| Norm | https://styles.refero.design/style/8d66df35-a06c-4ea9-ae8b-ab3e1c01f797 | https://norm.store | Architectural blueprint on white marble. Precision, clean lines, and stark mono-palette highlight a single, functional object. |
| Superpower | https://styles.refero.design/style/5d34568d-4bdc-445d-a527-c6f5249fa8fb | https://superpower.com | Clinical precision, vibrant pulse. A highly legible monochrome foundation with a single, sharp burst of color highlighting interaction. |
| Ordinal | https://styles.refero.design/style/4657db98-0c6c-4848-91e9-c339f3bb7815 | https://www.meetassembly.com | Midnight Command Center – A focused, dark interface illuminated by a singular, bright green operational light. |

## 2. North Star

Utilitarian design is not ugly; it is respectful. It removes visual performance so users can complete real work quickly and confidently.

The desired feeling is: plain, efficient, robust, direct, legible, work-focused.

The accent policy is: semantic action color only, with clear state meaning.

Primary warning: avoid hero theatrics, empty marketing sections, decorative illustrations, low-density cards, hidden controls, and copy that explains instead of enabling action.

Use this skill as a practical design system brief. It should help an agent create a visually specific site or app, not just describe the mood. Every recommendation should translate into concrete choices: tokens, layout, typography, components, interaction, imagery, and QA.

## 3. When To Use This Skill

Use Utilitarian when:

- the user asks for a visual direction matching plain, efficient, robust, direct, legible, work-focused
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

### 1. Office Chair Finder

Source: https://styles.refero.design/style/756dd3c1-6ccf-4824-bad3-96027cd0faf0  
Site: https://findmy.vitra.com/en-en  
North star: Monochrome utility with active red accents.  
Theme: light

#### What This Source Adds

This reference expands the Utilitarian skill by showing how Monochrome utility with active red accents. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Absolute Zero | #272727 | neutral | Most prominent text color, default borders, major headings, content text |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, button text for filled buttons, outlines for ghost buttons |
| Ink Wash | #333333 | neutral | Filled button backgrounds, subtle decorative fills in navigation |
| Ash Gray | #a9a9a9 | neutral | Muted link text, secondary border details |
| Action Red | #ef6b6b | accent | Outlined interactive elements (links, buttons) — provides the only chromatic highlight to draw attention to actionable items without overwhelming the monochrome interface |

#### Typography

#### Typeface 1: Times New Roman

- Role: Body text and miscellaneous content, providing a classic, readable foundation.
- Fallback: serif
- Weights: 400
- Sizes: 16px
- Line height: 1.00
- Letter spacing: not specified

#### Typeface 2: Futura

- Role: Headings, navigation elements, and interactive text. Its geometric sans-serif nature provides a modern counterpoint to the body text for clear hierarchy and calls to action.
- Fallback: sans-serif
- Weights: 400
- Sizes: 12px, 14px, 48px
- Line height: 1.15, 1.20, 1.30
- Letter spacing: not specified

#### Layout Reading

The page exhibits a max-width contained layout rather than full-bleed. The hero section, if present, is obscured by a modal, but background elements suggest a visually dynamic, full-viewport aesthetic. Content is arranged with consistent vertical spacing, and sections appear to predominantly stack. The primary content is presented within a central modal that overlays the background, indicating a highly focused, task-oriented user flow. Navigation is a minimal top bar, suggesting an overlay or simplified experience rather than complex hierarchies.

#### Spacing Reading

- Section gap: 173px
- Element gap: 13px
- Card padding: 12px
- Page max width: not specified
- Radius: {"button":"5px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Filled Action Button | Primary Call to Action | Solid Ink Wash background (#333333) with Canvas White text (#ffffff), a 5px border-radius, and a soft shadow. Padding is 12px vertical and 52px horizontal, creating substantial visual weight. |
| Outlined Action Link | Secondary Interaction | Canvas White background with an Action Red border (#ef6b6b) and Action Red text. Used for navigation where an interactive state is highlighted, typically with minimal padding (implicit from text size). |
| Muted Link Text | Tertiary Navigation/Information | Ash Gray text (#a9a9a9) with an Ash Gray border, used for less prominent links like country selectors. Provides visual differentiation from primary links. |
| Modal Card | Content Overlay | Canvas White background (#ffffff) with Absolute Zero text (#272727). Implicitly uses page padding for internal content, and a border radius of 5px if buttons inside match this radius. |
| Navigation Bar | Persistent Global Navigation | Canvas White background (#ffffff) with Ink Wash (#333333) decorative elements. Text is typically sized 14px Futura at weight 400 with a line height of 1.2. |

#### Carry Forward

- Use Absolute Zero (#272727) for all primary text content and main headings.
- Implement Canvas White (#ffffff) as the default background for all cards and page surfaces.
- Apply Ink Wash (#333333) exclusively for filled button backgrounds, paired with Canvas White text.
- Reserve Action Red (#ef6b6b) for borders and text of outlined interactive elements, indicating primary actions or important links.
- Ensure all buttons have a 5px border-radius and use 12px vertical padding.
- Maintain a spacious feel, using 173px for vertical section gaps and 13px for element spacing.
- Utilize Futura (sans-serif) for all headings, navigation, and interactive text, and Times New Roman (serif) for body copy.

#### Avoid

- Avoid using multiple chromatic colors; limit color accents strictly to Action Red (#ef6b6b).
- Do not use shadows on elements other than buttons or distinct interactive components.
- Refrain from deviating from the established monochromatic palette for backgrounds or primary textual elements.
- Do not apply decorative text styles or weights other than what is specified for Futura and Times New Roman.
- Avoid tight spacing; maintain the generous 173px section gaps and 13px element gaps.
- Do not use generic blue for links; all interactive link text should either be Absolute Zero or Action Red.
- Do not introduce complex gradients; the system relies heavily on solid colors and subtle elevation.


### 2. MAKR

Source: https://styles.refero.design/style/f2bf6db7-37b6-4394-be97-6bbb2c45c268  
Site: https://makr.com  
North star: Workshop-crafted monochrome utility.  
Theme: light

#### What This Source Adds

This reference expands the Utilitarian skill by showing how Workshop-crafted monochrome utility. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Ink | #1c1717 | neutral | Primary text, headings, links, borders for outlines, input text. This near-black provides strong contrast on light backgrounds |
| Canvas | #ffffff | neutral | Page backgrounds, elevated card surfaces, main content areas |
| Fog | #f0f0f0 | neutral | Subtle background for secondary sections, light dividers, input field backgrounds |
| Stone | #a9aea9 | neutral | Button backgrounds, promotional banners — a muted, desaturated gray to provide a soft interactive surface without strong chromatic emphasis |

#### Typography

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

#### Layout Reading

The page primarily uses a full-bleed layout, where content sections span the full width of the viewport, particularly for large image blocks and product showcases. Textual content and UI elements are typically contained within a centered max-width content area (implicitly around 1200px based on observable patterns). The hero section often features large, immersive product photography with superimposed text links or minimal headlines. Section rhythm is driven by consistent vertical spacing of 90px and alternating content blocks, sometimes featuring equal-width multi-column grids for presenting product variations or features. Navigation is a minimal top bar with left-aligned brand logo and right-aligned utility links (Account, Cart).

#### Spacing Reading

- Section gap: 90px
- Element gap: 5px
- Card padding: 12px
- Page max width: not specified
- Radius: {"all":"0px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Filled Button | Call to action. | Background: Stone (#a9aea9), Text: Ink (#1c1717), Border: 1px solid Ink (#1c1717), Radius: 0px. Padding 16px top, 10px right, 12px bottom, 20px left. Text uses Sohne Web Regular 13px. |
| Text Input | Form text entry. | Background: transparent, Text: Ink (#1c1717), Border: 1px solid Ink (#1c1717), Radius: 0px. Padding 1px top, 2px right, 1px bottom, 2px left. |
| Product Tag Badge | Informational labels for products or promotions. | Background: transparent, Text: Ink (#1c1717). No padding or border. Used as a text-only label. |

#### Carry Forward

- Use Ink (#1c1717) for all primary text and Canvas (#ffffff) for primary backgrounds.
- Maintain a rigid 0px border-radius for all UI elements, including buttons, inputs, and cards.
- Apply Sohne Web Regular (400) for all body text, headings, and interactive elements.
- Structure layouts with ample white space, using a section gap of 90px between major content blocks.
- Utilize Stone (#a9aea9) as the background for primary interactive buttons, paired with Ink (#1c1717) text and a 1px Ink border.
- Employ Fog (#f0f0f0) sparingly for subtle background differentiation in secondary content areas or inputs.
- Reserve CircularXXMonoWeb-Regular (400) for specific decorative text elements or unique callouts, not for general content.

#### Avoid

- Avoid using any saturated or vivid accent colors; the palette is strictly monochrome.
- Do not introduce rounded corners or soft edges on any components.
- Refrain from using drop shadows or elevation effects; elements should appear flat on the canvas.
- Do not use gradients; all colors should be solid fills.
- Avoid decorative typography; maintain the utilitarian style of Sohne Web as the dominant font.
- Do not deviate from the specified spacing units; consistency in 5px element gaps and 90px section gaps is key.
- Do not use default browser link colors; all links must be styled with Ink (#1c1717).


### 3. Norm

Source: https://styles.refero.design/style/8d66df35-a06c-4ea9-ae8b-ab3e1c01f797  
Site: https://norm.store  
North star: Architectural blueprint on white marble. Precision, clean lines, and stark mono-palette highlight a single, functional object.  
Theme: light

#### What This Source Adds

This reference expands the Utilitarian skill by showing how Architectural blueprint on white marble. Precision, clean lines, and stark mono-palette highlight a single, functional object. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, general container backgrounds |
| Pitch Black | #000000 | neutral | Primary text, prominent headings, default icon fills, active outline borders |
| Near Black | #282828 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |

#### Typography

#### Typeface 1: custom_50109

- Role: Primary headings, subheadings, and key marketing statements. The limited weights coupled with large, precise sizing creates a strong, no-nonsense voice.
- Fallback: not specified
- Weights: 400
- Sizes: 16px, 24px, 48px
- Line height: 1.00, 1.50, 1.56
- Letter spacing: -0.0170em at 48px, -0.0080em at 24px, normal at 16px

#### Typeface 2: -apple-system

- Role: Interface text, navigation links, and small functional labels. A system font ensures clarity and efficiency for utility content.
- Fallback: system-ui
- Weights: 400
- Sizes: 16px
- Line height: 1.00
- Letter spacing: normal

#### Typeface 3: Inter

- Role: Supportive body text. Its inclusion suggests a slight textural variation for longer passages without deviating from the overall sparse aesthetic.
- Fallback: Inter Sans
- Weights: 400
- Sizes: 18px
- Line height: 1.33
- Letter spacing: normal

#### Layout Reading

The page primarily uses a full-bleed, vertically segmented layout, alternating between large, centered text blocks and centered product imagery. Each section has a consistent vertical rhythm, with generous implied section gaps. The hero features a centered product shot above a large, centered multi-line headline. Subsequent sections also predominantly use centered stacks of text. There is no explicit grid for cards, and content is primarily a single column. Navigation is minimal, limited to a top-right utility bar with ghost buttons, suggesting a more focused, uncluttered experience.

#### Spacing Reading

- Section gap: 64px
- Element gap: 16px
- Card padding: 0px
- Page max width: not specified
- Radius: {"tags":"57px","buttons":"12px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Ghost Button Large | Secondary calls to action and navigational links within content blocks. Its transparent background and thick border suggest a less intrusive action. | Text: Pitch Black (#000000), custom_50109 400, 16px. Background: Canvas White (#ffffff). Border: 0.5px solid Pitch Black (#000000). Padding: 16px vertical, 24px horizontal. Corner radius: 12px. |
| Ghost Button Small | Utility links in header navigation. A compact, outlined button that provides clear interaction without visual dominance. | Text: Pitch Black (#000000), -apple-system 400, 16px. Background: Canvas White (#ffffff), Border: 0.5px solid Pitch Black (#000000). Padding: 8px vertical, 12px horizontal. Corner radius: 12px. |
| Ghost Button Tag | Informational tags or very subtle calls to action within header. The extreme radius makes it visually distinct. | Text: Pitch Black (#000000), -apple-system 400, 16px. Background: Canvas White (#ffffff). Border: 0.5px solid Pitch Black (#000000). Padding: 4px vertical, 12px horizontal. Corner radius: 57px. |
| Section Divider | Horizontal rule for content separation. Provides visual structure between sections. | Height: 0.5px. Color: Near Black (#282828). |

#### Carry Forward

- Prioritize Canvas White (#ffffff) as the primary background for all major content sections and surfaces.
- Use Pitch Black (#000000) for all primary body text, headlines, and calls to action text.
- Employ custom_50109 400 at 48px or 24px, with specific letter-spacing, for all prominent headings and content titles.
- Use Ghost Button styling, with a 0.5px Pitch Black (#000000) border and 12px radius, for all interactive elements.
- Apply 12px border-radius consistently to all button-like components, and 57px for small tags.
- Maintain generous negative space around content blocks, using implied section gaps of 64px.
- Apply 0.5px borders in Near Black (#282828) for subtle visual separation and detailed outlines.

#### Avoid

- Avoid using saturated colors; the palette is strictly achromatic.
- Do not use solid background buttons; all interactive elements should be ghosted or text-only.
- Do not introduce shadows; elevation is achieved solely through stark contrast and spacing.
- Avoid decorative imagery that competes with the product photography or text-heavy content.
- Do not deviate from the specified letter-spacing for custom_50109, especially for display sizes.
- Do not use heavy weights for typography; 400 is the only active weight in the system.
- Do not use small, tight radii; larger radii of 12px or 57px are signature elements.


### 4. Superpower

Source: https://styles.refero.design/style/5d34568d-4bdc-445d-a527-c6f5249fa8fb  
Site: https://superpower.com  
North star: Clinical precision, vibrant pulse. A highly legible monochrome foundation with a single, sharp burst of color highlighting interaction.  
Theme: light

#### What This Source Adds

This reference expands the Utilitarian skill by showing how Clinical precision, vibrant pulse. A highly legible monochrome foundation with a single, sharp burst of color highlighting interaction. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Charcoal Black | #18181b | neutral | Primary text, darkest backgrounds, borders, navigation text — defines the core, stark contrast against white surfaces. |
| Pure White | #ffffff | neutral | Page backgrounds, card surfaces, button text — the dominant canvas for content, providing maximum contrast for Charcoal Black text. |
| Warm Gray | #71717a | neutral | Secondary text, subtle borders, subheadings — softens the contrast for less critical information, maintaining legibility. |
| Light Gray | #e4e4e7 | neutral | Tertiary backgrounds, hairline borders, subtle dividers — provides visual separation without introducing strong color. |
| Whisper Gray | #f4f4f5 | neutral | Subtle background shading, hover states for light elements — provides a very slight visual lift from Pure White. |
| Vermillion Accent | #fc5f2b | brand | Primary calls to action, active navigation items, key highlight elements — directs user attention with high-energy contrast against neutral backgrounds. |
| Sunset Gradient | #fc5f2b | brand | Decorative element on membership card, provides a dynamic visual flourish — a warm, vibrant gradient that avoids direct action but conveys energy. |
| Soft Vermillion | #feaf95 | brand | Subtle shadow tint for cards, giving a warm glow to elevated elements. |
| Canary Yellow | #ffdd61 | accent | Background for specific informational elements, likely semantic success or highlight. |
| Sky Blue | #42a5f5 | accent | Iconography, non-interactive graphical elements — a secondary accent color that adds visual interest without competing with Vermillion Accent. |

#### Typography

#### Typeface 1: Nb international pro webfont

- Role: Primary typeface for all content. Weight 700 is reserved for headlines and emphasized elements, conveying directness. Weight 400 for body text and navigation. Distinctive tight letter-spacing for headlines contributes to a crisp, precise feel, loosening for body text to maintain comfort.
- Fallback: Inter
- Weights: 400, 700
- Sizes: 11px, 13px, 15px, 17px, 19px, 22px, 26px, 30px, 37px, 45px, 56px, 60px, 66px
- Line height: 1.00, 1.06, 1.10, 1.13, 1.20, 1.25, 1.40, 1.50
- Letter spacing: -0.132, -0.169, -0.225, -0.255, -0.266, -0.308, -0.338, -0.36, -0.37, -0.36, -0.336, -0.3, -0.33

#### Typeface 2: Nb International mono pro

- Role: Used for specific functional text, like footnotes or small labels, where a fixed-width character set is desired for technical precision.
- Fallback: Space Mono
- Weights: 400
- Sizes: 11px, 13px
- Line height: 1.40, 1.50
- Letter spacing: -0.066, -0.078

#### Layout Reading

The site employs a max-width contained layout rather than full-bleed for most content, centered on the screen. The initial hero section is a full-bleed dark photographic background with centered, large white typography, creating an immediate, impactful statement. Subsequent sections primarily feature a clean white background, with content often arranged in two-column layouts (text left, image right, or vice versa), maintaining consistent vertical spacing between sections. Content blocks are visually distinct, often using the defined card styles to group information. A sticky top navigation bar provides consistent access, and a fixed chat widget trigger anchors the bottom right.

#### Spacing Reading

- Section gap: 64-96px
- Element gap: 4px
- Card padding: 
- Page max width: not specified
- Radius: {"misc":"29.9832px","cards":"16px","inputs":"11.2437px","buttons":"9999px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Pricing Card — Superpower Membership |  | <style>   :root {     --color-charcoal-black: #18181b;     --color-pure-white: #ffffff;     --color-warm-gray: #71717a;     --color-light-gray: #e4e4e7;     --color-whisper-gray: #f4f4f5;     --color-vermillion-accent: #fc5f2b;     --color-soft-vermillion: #feaf95;     --font-nb: 'Inter', sans-serif;     --shadow-subtle: rgba(0,0,0,0.05) 0px 2px 2px 0px;   }   * { box-sizing: border-box; margin: 0; padding: 0; }   body { background: var(--color-pure-white); }   .pricing-card {     font-family: var(--font-nb);     background: var(--color-pure-white);     border-radius: 16px;     box-shadow: var(--shadow-subtle);     padding: 32px;     max-width: 560px;     margin: 32px auto;     border: 1px solid var(--color-light-gray);   }   .membership-visual {     width: 100%;     height: 180px;     border-radius: 16px;     background: linear-gradient(88deg, rgb(252,95,43), rgb(255,139,100) 90%, rgb(255,220,180));     display: flex;     flex-direction: column;     justify-content: flex-end;     padding: 20px 24px;     margin-bottom: 28px;     position: relative;     overflow: hidden;   }   .membership-visual::before {     content: '';     position: absolute;     top: -20px;     right: -20px;     width: 200px;     height: 200px;     border-radius: 50%;     background: rgba(255,255,255,0.08);   }   .membership-visual::after {     content: '';     position: absolute;     top: 20px;     right: 60px;     width: 120px;     height: 120px;     border-radius: 50%;     background: rgba(255,255,255,0.06);   }   .card-brand {     font-family: var(--font-nb);     font-size: 13px;     font-weight: 700;     color: rgba(255,255,255,0.9);     letter-spacing: -0.078px;     margin-bottom: 2px;   }   .card-type {     font-family: var(--font-nb);     font-size: 13px;     font-weight: 400;     color: rgba(255,255,255,0.75);     letter-spacing: -0.078px;     margin-bottom: 16px;   }   .card-price-line {     font-family: var(--font-nb);     font-size: 26px;     font-weight: 700;     color: var(--color-pure-white);     letter-spacing: -0.308px;     line-height: 1.1;   }   .card-price-line span {     font-size: 13px;     font-weight: 400;     letter-spacing: 0;   }   .card-billing {     font-family: var(--font-nb);     font-size: 11px;     color: rgba(255,255,255,0.8);     letter-spacing: -0.066px;     margin-top: 2px;   }   .pricing-title {     font-family: var(--font-nb);     font-size: 22px;     font-weight: 700;     color: var(--color-charcoal-black);     letter-spacing: -0.308px;     line-height: 1.25;     margin-bottom: 8px;   }   .pricing-desc {     font-family: var(--font-nb);     font-size: 15px;     color: var(--color-warm-gray);     letter-spacing: -0.225px;     line-height: 1.5;     margin-bottom: 20px;   }   .features-list {     list-style: none;     margin-bottom: 24px;   }   .features-list li {     display: flex;     align-items: flex-start;     gap: 10px;     font-family: var(--font-nb);     font-size: 15px;     color: var(--color-charcoal-black);     letter-spacing: -0.225px;     line-height: 1.5;     padding: 5px 0;   }   .check-icon {     flex-shrink: 0;     margin-top: 3px;   }   .pricing-amount {     display: flex;     align-items: baseline;     gap: 4px;     margin-bottom: 4px;   }   .price-dollar {     font-family: var(--font-nb);     font-size: 22px;     font-weight: 700;     color: var(--color-charcoal-black);     letter-spacing: -0.308px;     vertical-align: super;   }   .price-number {     font-family: var(--font-nb);     font-size: 56px;     font-weight: 700;     color: var(--color-charcoal-black);     letter-spacing: -0.3px;     line-height: 1;   }   .price-suffix {     font-family: var(--font-nb);     font-size: 15px;     color: var(--color-warm-gray);     letter-spacing: -0.225px;   }   .price-note {     font-family: var(--font-nb);     font-size: 11px;     color: var(--color-warm-gray);     letter-spacing: -0.132px;     margin-bottom: 20px;     line-height: 1.5;   }   .payment-row {     display: flex;     align-items: center;     gap: 10px;     margin-bottom: 20px;   }   .payment-label {     font-family: var(--font-nb);     font-size: 13px;     color: var(--color-warm-gray);     letter-spacing: -0.169px;   }   .payment-chip {     height: 24px;     border-radius: 4px;     background: var(--color-whisper-gray);     border: 1px solid var(--color-light-gray);     display: flex;     align-items: center;     padding: 0 8px;     font-size: 10px;     font-weight: 700;     font-family: var(--font-nb);     color: var(--color-charcoal-black);   }   .cta-btn {     display: flex;     align-items: center;     justify-content: center;     gap: 8px;     width: 100%;     padding: 16px 22px;     background: var(--color-vermillion-accent);     color: var(--color-pure-white);     border: none;     border-radius: 9999px;     font-family: var(--font-nb);     font-size: 17px;     font-weight: 700;     letter-spacing: -0.225px;     cursor: pointer;     margin-bottom: 16px;     text-decoration: none;   }   .trust-row {     display: flex;     align-items: center;     justify-content: center;     gap: 20px;   }   .trust-item {     display: flex;     align-items: center;     gap: 6px;     font-family: var(--font-nb);     font-size: 12px;     color: var(--color-warm-gray);     letter-spacing: -0.132px;   } </style> <div class="pricing-card">   <div class="membership-visual">     <div class="card-brand">superpower</div>     <div class="card-type">membership</div>     <div class="card-price-line">$17<span>/month</span></div>     <div class="card-billing">Billed annually at $199</div>   </div>   <div class="pricing-title">Superpower Membership</div>   <div class="pricing-desc">Your membership includes one comprehensive blood draw each year, covering 100+ biomarkers in a single collection</div>   <ul class="features-list">     <li>       <svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#fc5f2b" opacity="0.12"/><path d="M4.5 8.5L7 11L11.5 6" stroke="#fc5f2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>       One appointment, one draw for your annual panel.     </li>     <li>       <svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#fc5f2b" opacity="0.12"/><path d="M4.5 8.5L7 11L11.5 6" stroke="#fc5f2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>       100+ biomarkers per year     </li>     <li>       <svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#fc5f2b" opacity="0.12"/><path d="M4.5 8.5L7 11L11.5 6" stroke="#fc5f2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>       A personalized plan that evolves with you     </li>     <li>       <svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#fc5f2b" opacity="0.12"/><path d="M4.5 8.5L7 11L11.5 6" stroke="#fc5f2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>       Get your biological age and track your health over a lifetime     </li>   </ul>   <div class="pricing-amount">     <span class="price-dollar">$</span>     <span class="price-number">17</span>     <span class="price-suffix">/month &nbsp;·&nbsp; billed annually</span>   </div>   <div class="price-note">Pricing for members in NY &amp; NJ is $399 with 90+ biomarkers tested.</div>   <div class="payment-row">     <span class="payment-label">Flexible payment options</span>     <div class="payment-chip">HSA/FSA</div>     <div class="payment-chip" style="color:#2563eb;">AMEX</div>     <div class="payment-chip" style="color:#1a56db;">VISA</div>     <div class="payment-chip" style="color:#e25950;">MC</div>   </div>   <a class="cta-btn" href="#">     Start testing     <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>   </a>   <div class="trust-row">     <div class="trust-item">       <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4.5" stroke="#71717a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>       Cancel anytime     </div>     <div class="trust-item">       <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#71717a" stroke-width="1.2"/><path d="M7 4.5v3l2 1.5" stroke="#71717a" stroke-width="1.2" stroke-linecap="round"/></svg>       HSA/FSA eligible     </div>     <div class="trust-item">       <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.5" stroke="#71717a" stroke-width="1.2"/><path d="M5 3V2M9 3V2M2 6h10" stroke="#71717a" stroke-width="1.2" stroke-linecap="round"/></svg>       Results within a week     </div>   </div> </div> |
| Button Group — Primary, Secondary, Ghost |  | <style>   :root {     --color-charcoal-black: #18181b;     --color-pure-white: #ffffff;     --color-warm-gray: #71717a;     --color-light-gray: #e4e4e7;     --color-whisper-gray: #f4f4f5;     --color-vermillion-accent: #fc5f2b;     --font-nb: 'Inter', sans-serif;   }   * { box-sizing: border-box; margin: 0; padding: 0; }   .btn-showcase {     font-family: var(--font-nb);     background: var(--color-pure-white);     padding: 40px 32px;     max-width: 560px;     margin: 0 auto;   }   .btn-section-title {     font-size: 11px;     font-weight: 700;     letter-spacing: 0.08em;     text-transform: uppercase;     color: var(--color-warm-gray);     margin-bottom: 24px;     font-family: var(--font-nb);   }   .btn-row {     display: flex;     flex-wrap: wrap;     align-items: center;     gap: 12px;     margin-bottom: 32px;   }   .btn-label {     font-size: 11px;     color: var(--color-warm-gray);     font-family: var(--font-nb);     letter-spacing: -0.066px;     margin-top: 8px;     text-align: center;   }   .btn-col {     display: flex;     flex-direction: column;     align-items: center;   }   /* Primary */   .btn-primary {     display: inline-flex;     align-items: center;     gap: 8px;     padding: 15px 24px;     background: var(--color-vermillion-accent);     color: var(--color-pure-white);     border: none;     border-radius: 9999px;     font-family: var(--font-nb);     font-size: 15px;     font-weight: 700;     letter-spacing: -0.225px;     cursor: pointer;     text-decoration: none;     line-height: 1;   }   .btn-primary-lg {     padding: 16px 32px;     font-size: 17px;   }   /* Secondary */   .btn-secondary {     display: inline-flex;     align-items: center;     gap: 8px;     padding: 15px 22px;     background: var(--color-pure-white);     color: var(--color-charcoal-black);     border: 1.5px solid var(--color-light-gray);     border-radius: 9999px;     font-family: var(--font-nb);     font-size: 15px;     font-weight: 400;     letter-spacing: -0.225px;     cursor: pointer;     text-decoration: none;     line-height: 1;   }   /* Ghost dark bg */   .btn-ghost-dark {     display: inline-flex;     align-items: center;     gap: 8px;     padding: 15px 22px;     background: rgba(0,0,0,0.25);     color: var(--color-pure-white);     border: none;     border-radius: 9999px;     font-family: var(--font-nb);     font-size: 15px;     font-weight: 400;     letter-spacing: -0.225px;     cursor: pointer;     text-decoration: none;     line-height: 1;   }   /* Ghost light bg */   .btn-ghost-light {     display: inline-flex;     align-items: center;     gap: 8px;     padding: 15px 20px;     background: var(--color-whisper-gray);     color: var(--color-charcoal-black);     border: none;     border-radius: 11px;     font-family: var(--font-nb);     font-size: 15px;     font-weight: 400;     letter-spacing: -0.225px;     cursor: pointer;     text-decoration: none;     line-height: 1;   }   .dark-bg {     background: var(--color-charcoal-black);     border-radius: 16px;     padding: 20px;     display: inline-flex;     align-items: center;     gap: 12px;   }   .divider {     width: 100%;     height: 1px;     background: var(--color-light-gray);     margin: 8px 0 32px;   } </style> <div class="btn-showcase">   <div class="btn-section-title">Primary Actions</div>   <div class="btn-row">     <div class="btn-col">       <a class="btn-primary btn-primary-lg" href="#">         Join Today         <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>       </a>       <div class="btn-label">Primary Large</div>     </div>     <div class="btn-col">       <a class="btn-primary" href="#">         Try Superpower         <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M9 4.5l3.5 3.5L9 11.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>       </a>       <div class="btn-label">Primary Default</div>     </div>     <div class="btn-col">       <a class="btn-primary" href="#" style="padding:15px 20px; font-size:13px;">Start testing &nbsp;›</a>       <div class="btn-label">Primary Small</div>     </div>   </div>   <div class="divider"></div>   <div class="btn-section-title">Secondary &amp; Ghost</div>   <div class="btn-row">     <div class="btn-col">       <a class="btn-secondary" href="#">Learn More</a>       <div class="btn-label">Secondary Outline</div>     </div>     <div class="btn-col">       <a class="btn-ghost-light" href="#">How It Works</a>       <div class="btn-label">Ghost Light</div>     </div>     <div class="btn-col">       <div class="dark-bg">         <a class="btn-ghost-dark" href="#">For Teams</a>       </div>       <div class="btn-label">Ghost Dark BG</div>     </div>   </div>   <div class="divider"></div>   <div class="btn-section-title">With HSA/FSA badge</div>   <div class="btn-row">     <div class="btn-col" style="align-items:flex-start;">       <a class="btn-primary btn-primary-lg" href="#">         Start testing         <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>       </a>       <div style="display:flex;align-items:center;gap:6px;margin-top:10px;">         <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#71717a" stroke-width="1.2"/><path d="M4.5 7.5l2 2 3-4" stroke="#71717a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>         <span style="font-family:var(--font-nb);font-size:13px;color:var(--color-warm-gray);letter-spacing:-0.169px;">HSA/FSA eligible</span>       </div>     </div>   </div> </div> |
| Stat / Feature Blocks — Health Intelligence |  | <style>   :root {     --color-charcoal-black: #18181b;     --color-pure-white: #ffffff;     --color-warm-gray: #71717a;     --color-light-gray: #e4e4e7;     --color-whisper-gray: #f4f4f5;     --color-vermillion-accent: #fc5f2b;     --color-soft-vermillion: #feaf95;     --color-sky-blue: #42a5f5;     --color-canary-yellow: #ffdd61;     --font-nb: 'Inter', sans-serif;     --shadow-subtle: rgba(0,0,0,0.05) 0px 2px 2px 0px;   }   * { box-sizing: border-box; margin: 0; padding: 0; }   .stats-section {     font-family: var(--font-nb);     background: var(--color-pure-white);     padding: 40px 28px;     max-width: 560px;     margin: 0 auto;   }   .stats-eyebrow {     font-size: 11px;     font-weight: 700;     letter-spacing: 0.1em;     text-transform: uppercase;     color: var(--color-vermillion-accent);     margin-bottom: 10px;   }   .stats-heading {     font-size: 37px;     font-weight: 700;     color: var(--color-charcoal-black);     letter-spacing: -0.37px;     line-height: 1.1;     margin-bottom: 12px;   }   .stats-sub {     font-size: 15px;     color: var(--color-warm-gray);     letter-spacing: -0.225px;     line-height: 1.5;     margin-bottom: 36px;     max-width: 420px;   }   .stats-grid {     display: grid;     grid-template-columns: 1fr 1fr;     gap: 16px;     margin-bottom: 24px;   }   .stat-card {     background: var(--color-pure-white);     border: 1px solid var(--color-light-gray);     border-radius: 16px;     padding: 24px 20px;     box-shadow: var(--shadow-subtle);     display: flex;     flex-direction: column;     gap: 8px;   }   .stat-icon-wrap {     width: 36px;     height: 36px;     border-radius: 10px;     display: flex;     align-items: center;     justify-content: center;     margin-bottom: 4px;   }   .stat-number {     font-size: 37px;     font-weight: 700;     color: var(--color-charcoal-black);     letter-spacing: -0.37px;     line-height: 1;   }   .stat-number sup {     font-size: 18px;     vertical-align: super;     letter-spacing: -0.2px;   }   .stat-label {     font-size: 13px;     color: var(--color-warm-gray);     letter-spacing: -0.169px;     line-height: 1.4;   }   .stat-card-wide {     grid-column: 1 / -1;     background: var(--color-charcoal-black);     border-radius: 16px;     padding: 24px 24px;     display: flex;     align-items: center;     justify-content: space-between;     gap: 16px;     box-shadow: var(--shadow-subtle);     border: none;   }   .stat-card-wide-left {     display: flex;     flex-direction: column;     gap: 6px;   }   .stat-card-wide .stat-number {     color: var(--color-pure-white);   }   .stat-card-wide .stat-label {     color: rgba(255,255,255,0.55);   }   .pill-badge {     display: inline-flex;     align-items: center;     gap: 6px;     padding: 6px 14px;     border-radius: 9999px;     background: rgba(252,95,43,0.15);     color: var(--color-vermillion-accent);     font-size: 12px;     font-weight: 700;     letter-spacing: -0.1px;     align-self: flex-start;   }   .progress-bar-wrap {     flex: 1;     max-width: 160px;   }   .progress-label {     font-size: 11px;     color: rgba(255,255,255,0.5);     margin-bottom: 6px;     letter-spacing: -0.066px;   }   .progress-track {     width: 100%;     height: 6px;     background: rgba(255,255,255,0.12);     border-radius: 9999px;     overflow: hidden;   }   .progress-fill {     height: 100%;     border-radius: 9999px;     background: var(--color-vermillion-accent);   }   .feature-pills {     display: flex;     flex-wrap: wrap;     gap: 8px;   }   .feature-pill {     display: inline-flex;     align-items: center;     gap: 6px;     padding: 8px 14px;     border-radius: 9999px;     background: var(--color-whisper-gray);     border: 1px solid var(--color-light-gray);     font-size: 13px;     color: var(--color-charcoal-black);     font-family: var(--font-nb);     letter-spacing: -0.169px;   }   .feature-pill-dot {     width: 7px;     height: 7px;     border-radius: 50%;   } </style> <div class="stats-section">   <div class="stats-eyebrow">By the numbers</div>   <div class="stats-heading">Health intelligence<br>at scale</div>   <div class="stats-sub">Powered by the world's most comprehensive at-home blood panel, built to detect early signs of 1,000+ conditions.</div>   <div class="stats-grid">     <div class="stat-card">       <div class="stat-icon-wrap" style="background:rgba(252,95,43,0.1);">         <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C9 2 4 6.5 4 10.5a5 5 0 0010 0C14 6.5 9 2 9 2z" stroke="#fc5f2b" stroke-width="1.4" stroke-linejoin="round"/></svg>       </div>       <div class="stat-number">100<sup>+</sup></div>       <div class="stat-label">Biomarkers tested per year</div>     </div>     <div class="stat-card">       <div class="stat-icon-wrap" style="background:rgba(66,165,245,0.1);">         <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="#42a5f5" stroke-width="1.4"/><path d="M5 9h8M9 7v4" stroke="#42a5f5" stroke-width="1.4" stroke-linecap="round"/></svg>       </div>       <div class="stat-number">1k<sup>+</sup></div>       <div class="stat-label">Conditions detected early</div>     </div>     <div class="stat-card">       <div class="stat-icon-wrap" style="background:rgba(255,221,97,0.2);">         <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="#d4a800" stroke-width="1.4"/><path d="M9 6v3l2 2" stroke="#d4a800" stroke-width="1.4" stroke-linecap="round"/></svg>       </div>       <div class="stat-number">1wk</div>       <div class="stat-label">Results within a week</div>     </div>     <div class="stat-card">       <div class="stat-icon-wrap" style="background:rgba(252,95,43,0.1);">         <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.8 5.4H17l-4.9 3.6 1.9 5.4L9 13.4l-5 3 1.9-5.4L1 8.4h6.2z" stroke="#fc5f2b" stroke-width="1.3" stroke-linejoin="round"/></svg>       </div>       <div class="stat-number">$17</div>       <div class="stat-label">Per month, billed annually</div>     </div>     <div class="stat-card-wide">       <div class="stat-card-wide-left">         <div class="pill-badge">           <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5l2.5 2.5 4-5" stroke="#fc5f2b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>           HSA / FSA Eligible         </div>         <div class="stat-number" style="font-size:26px;margin-top:4px;">$199 <span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.5);">/ year</span></div>         <div class="stat-label">What could cost $15,000 is $199</div>       </div>       <div class="progress-bar-wrap">         <div class="progress-label">Savings vs. traditional lab</div>         <div class="progress-track"><div class="progress-fill" style="width:87%;"></div></div>         <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:4px;font-family:var(--font-nb);">87% less expensive</div>       </div>     </div>   </div>   <div class="feature-pills">     <div class="feature-pill"><div class="feature-pill-dot" style="background:#fc5f2b;"></div>Hormone Health</div>     <div class="feature-pill"><div class="feature-pill-dot" style="background:#42a5f5;"></div>Metabolic Panel</div>     <div class="feature-pill"><div class="feature-pill-dot" style="background:#ffdd61;"></div>Thyroid Function</div>     <div class="feature-pill"><div class="feature-pill-dot" style="background:#a78bfa;"></div>Heart Health</div>     <div class="feature-pill"><div class="feature-pill-dot" style="background:#34d399;"></div>Vitamin Levels</div>     <div class="feature-pill"><div class="feature-pill-dot" style="background:#fc5f2b;"></div>Inflammation</div>   </div> </div> |
| Primary Call to Action Button | Button | Rounded pill shape with Vermillion Accent background (#fc5f2b) and Pure White text (#ffffff). Prominent padding: 15px vertical, 22px horizontal. Ensures primary user actions are highly visible and inviting. |
| Secondary Outline Button | Button | Pill shape with Pure White background (#ffffff), Charcoal Black text (#18181b), and a Light Gray border (#e4e4e7). Padding is 15px vertical, 19px horizontal. Provides an alternative action without competing with the primary CTA. |
| Ghost Button (Dark Background) | Button | Pill shape, transparent background (rgba(0,0,0,0.25)), Charcoal Black text (#18181b), no border. Used for tertiary actions or within dark hero sections to provide interaction without strong visual emphasis. Minimal padding due to its transparency. |
| Ghost Button (Light Background) | Button | Rectangular with rounded corners (11px radius), Whisper Gray background (#fafafa), Charcoal Black text (#18181b). Used for lower-priority actions or filters, blending into the background. Padding is 15px square. |
| Default Card | Card | Pure White background (#ffffff), 16px border-radius, subtle shadow (rgba(0, 0, 0, 0.05) 0px 2px 2px 0px). Padding: 26px top, 19px horizontal, 19px bottom. Used for content grouping on light backgrounds, providing slight elevation. |
| Membership Detail Card | Card | Transparent background, 22px border-radius, no shadow, with 19px padding. Used for specific content sections that need a softer visual separation, often containing images or distinct content blocks. |
| Image Wrapper Card | Card | Transparent background, 5px border-radius, no shadow. Minimum 11px horizontal padding. Used to contain images or media with a slight border-radius, allowing content to dictate visual boundaries. |
| Section Navigation Link | Navigation | Charcoal Black text (#18181b), 9999px border-radius, transparent background. Used in the main navigation, interactive on hover or click to subtly indicate its function. |
| Floating Chat Widget Trigger | Button | Square button with 16px radius, Charcoal Black background (#18181B) and Pure White 'S' icon. Positioned fixed at the bottom right, it provides persistent access to support. |

#### Carry Forward

- Use Charcoal Black (#18181b) for all primary typographic elements and major UI components to maintain high contrast and sophistication.
- Apply Vermillion Accent (#fc5f2b) exclusively to primary calls-to-action and active navigation states to ensure focus and energy.
- Employ the Nb international pro webfont with significant negative letter-spacing for all headlines (e.g., -0.37px at 37px) to achieve a precise, condensed appearance.
- Maintain a clear visual hierarchy by differentiating primary (pill-shaped Vermillion Accent), secondary (white outlined), and tertiary (ghost, transparent) button styles.
- Ensure all interactive elements, particularly buttons, feature a 9999px border-radius for the distinctive pill shape, softening the otherwise crisp UI.
- Use Pure White (#ffffff) as the dominant page background to create an expansive, clean canvas for content presentation.
- Utilize a subtle shadow (rgba(0, 0, 0, 0.05) 0px 2px 2px 0px) for elevated cards on main content areas to provide soft depth.

#### Avoid

- Do not use multiple accent colors simultaneously; the visual system relies on Vermillion Accent (#fc5f2b) for primary emphasis.
- Avoid using flat, square buttons; all primary and secondary buttons must adhere to the 9999px pill-shaped radius.
- Do not introduce strong, chromatic backgrounds other than the defined brand colors; the system heavily relies on a neutral gray progression.
- Refrain from using thin, decorative borders that are not part of the established Light Gray (#e4e4e7) or Charcoal Black (#18181b) border palette.
- Do not vary line-height significantly from the established scale; maintaining the precise vertical rhythm is key for legibility and visual consistency.
- Avoid generic drop shadows; use the specific, subtle card shadow (rgba(0, 0, 0, 0.05) 0px 2px 2px 0px) to maintain a light, clean aesthetic.


### 5. Ordinal

Source: https://styles.refero.design/style/4657db98-0c6c-4848-91e9-c339f3bb7815  
Site: https://www.meetassembly.com  
North star: Midnight Command Center – A focused, dark interface illuminated by a singular, bright green operational light.  
Theme: dark

#### What This Source Adds

This reference expands the Utilitarian skill by showing how Midnight Command Center – A focused, dark interface illuminated by a singular, bright green operational light. can be translated into concrete interface decisions. Do not clone it literally. Extract the underlying decisions: palette constraints, hierarchy, spacing, type personality, component geometry, and interaction restraint.

#### Colors

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Deep Night | #151316 | neutral | Primary background for pages, footers, and filled buttons against light text. Creates a deep, expansive canvas |
| Cloudburst Gray | #444245 | neutral | Subtle background for card surfaces, providing a faint lighter layer over Deep Night |
| Fog | #8e8e8e | neutral | Muted text for secondary information, subheadings, and soft borders. A gentle contrast against dark backgrounds |
| Moonbeam White | #ffffff | neutral | Primary text color, link text, and strong borders on dark backgrounds. Ensures legibility and highlights key information; Transparent to green gradient, used for subtle background highlights or decorative elements |
| Lunar Dust | #f4f2ee | neutral | Subtle borders and text in specific contexts, providing a slightly warmer off-white tone than Moonbeam White |
| Ghostly Gray | #b9b9b9 | neutral | Tertiary text and borders, for less critical information or ghost states |
| Jade Glow | #8ef5b5 | brand | Primary action background, prominent accents, interactive elements, and focused states. This vivid green is the brand's primary color, indicating activity and interactive points |
| Forest Whisper | #24574d | accent | Muted accents and hover states, often appearing as text color against a light background or subtle borders. Provides a complementary, darker hue to Jade Glow; Subtle background gradients for atmospheric touches, transitioning from a muted green to a dark gray |

#### Typography

#### Typeface 1: Inter

- Role: Primary typeface for all UI elements, headlines, body text, and links. Its clean, modern lines support the system's focus on clarity and efficiency, with moderate tracking at larger sizes (-0.0300em for 60px and -0.0100em for 40px and 53px) to prevent headlines from feeling too loose.
- Fallback: system-ui
- Weights: 400, 500
- Sizes: 13px, 17px, 27px, 40px, 53px, 60px
- Line height: 1.00, 1.20, 1.50
- Letter spacing: -0.0300em, -0.0100em

#### Typeface 2: Inconsolata-Eyebrow

- Role: Used for smaller, functional UI text like badges, navigation, and supplementary information. Its slightly wider, geometric nature provides a subtle contrast to Inter, adding a 'coding-like' or 'system' feel without being overly technical.
- Fallback: monospace
- Weights: 400, 500
- Sizes: 13px, 17px
- Line height: 1.00, 1.50
- Letter spacing: -0.0100em, 0.0100em

#### Layout Reading

The page typically follows a max-width contained layout at 1440px, centered on the screen. The hero section is full-bleed with a dark background, featuring a centered headline and central call-to-action buttons. Subsequent sections alternate between dark and slightly lighter dark bands, creating a subtle visual rhythm. Content is generally arranged in two-column layouts, often with text on one side and a product screenshot or relevant visual on the other, or in three-column grids for feature lists. Navigation is a sticky top bar, minimal and un-obtrusive. The overall density is comfortable, with ample breathing room between sections.

#### Spacing Reading

- Section gap: 27px
- Element gap: 8px
- Card padding: 27px
- Page max width: 1440px
- Radius: {"cards":"18.08px 0px 0px","buttons":"1440px","default":"4.96px"}

#### Component Reading

| Component | Role | Treatment |
| --- | --- | --- |
| Primary Action Button | Filled Call to Action Button | Solid Jade Glow (#8ef5b5) background with Deep Night (#151316) text. Features fully rounded, pill-shaped corners (1440px radius) and generous padding (11.73-16.67px horizontal, 8.4-13.33px vertical) for a prominent, inviting target. Text is often Inconsolata-Eyebrow for a distinct functional feel. |
| Secondary Ghost Button | Outlined or Ghost Button | Transparent background with a Moonbeam White (#ffffff) border or text and Jade Glow (#8ef5b5) border. Uses pill-shaped corners (1440px) and similar padding to the primary button, offering a clear but less emphatic interactive element. |
| Text Link Button | Minimal Interactive Link | Transparent background with Moonbeam White (#ffffff) or Forest Whisper (#24574d) text. No visible border or radius, relies on text color for distinction. Used for minimal, understated calls to action or navigation items. |
| Dark Surface Card | Product content container | Transparent background with soft, asymmetric rounded corners (18.08px on top-left). No shadow. Often used for showcasing product features or screenshots with Moonbeam White text and generous internal padding (53.33px top, 34.66px left). |
| Informational Badge | Small, functional label | Transparent background with Moonbeam White (#ffffff) text. No border or radius. Used for short, contextual labels such as 'Scheduling' or feature tags. Text usually Inconsolata-Eyebrow for a technical feel. |
| Navigation Link | Header Navigation Item | Moonbeam White (#ffffff) text on a transparent background, transitioning to Forest Whisper (#24574d) on hover/active. Minimal padding and no explicit border or radius, relying on proximity and typography for interactive signaling. |

#### Carry Forward

- Use Deep Night (#151316) for all primary page and large section backgrounds to maintain the dark theme.
- Highlight interactive elements and calls to action exclusively with Jade Glow (#8ef5b5) for maximum visual impact and brand recognition.
- Employ Moonbeam White (#ffffff) for all primary body text and main headings to ensure readability against dark backgrounds.
- Apply Inter font in weights 400 or 500 for general text and headlines, varying size and letter-spacing according to the type scale.
- Utilize the `buttons` radius of 1440px for all action buttons to create a consistent, soft, pill-like appearance.
- Maintain comfortable density with an `elementGap` of 8px and `sectionGap` of 27px for most content blocks.
- Use Inconsolata-Eyebrow for all badge text and subtle functional labels to distinguish them from primary content.

#### Avoid

- Avoid using multiple chromatic colors; Jade Glow (#8ef5b5) is the singular accent color.
- Do not introduce complex shadow systems; the design relies on subtle background shifts and borders for layering.
- Never use generic square buttons; all interactive buttons should leverage the pill-shaped 1440px border radius.
- Do not deviate from the Inter and Inconsolata-Eyebrow font families; maintain typographic consistency.
- Avoid extreme tight or loose letter-spacing; adhere to the defined letter-spacing values in the type scale for proportional text.
- Do not use dark gray or black text on Deep Night backgrounds as this does not meet AAA contrast requirements.
- Avoid using card backgrounds for transparent-by-default cards such as feature cards.


## 5. Archetype Library

### 1. Operational Dashboard

Use this archetype when the project needs a plain, efficient, robust, direct, legible, work-focused feeling and the content naturally supports the operational dashboard pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use semantic action color only, with clear state meaning.
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

The operational dashboard version of Utilitarian often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 2. Admin Console

Use this archetype when the project needs a plain, efficient, robust, direct, legible, work-focused feeling and the content naturally supports the admin console pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use semantic action color only, with clear state meaning.
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

The admin console version of Utilitarian often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 3. Data Entry Workflow

Use this archetype when the project needs a plain, efficient, robust, direct, legible, work-focused feeling and the content naturally supports the data entry workflow pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use semantic action color only, with clear state meaning.
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

The data entry workflow version of Utilitarian often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 4. Documentation Utility

Use this archetype when the project needs a plain, efficient, robust, direct, legible, work-focused feeling and the content naturally supports the documentation utility pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use semantic action color only, with clear state meaning.
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

The documentation utility version of Utilitarian often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

### 5. Internal Tool Surface

Use this archetype when the project needs a plain, efficient, robust, direct, legible, work-focused feeling and the content naturally supports the internal tool surface pattern.

Core moves:

- Start with a clear content job before choosing decoration.
- Establish one dominant hierarchy pattern and repeat it.
- Use semantic action color only, with clear state meaning.
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

The internal tool surface version of Utilitarian often fails when visual attitude is added after the layout is already generic. Fix this by rebuilding the section rhythm, component geometry, and type scale as a system instead of sprinkling style on top.

## 6. Consolidated Color System

The palette below merges tokens observed across the five sources. Do not use every color. Treat it as a vocabulary for building a smaller project-specific system.

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Absolute Zero | #272727 | neutral | Most prominent text color, default borders, major headings, content text |
| Canvas White | #ffffff | neutral | Page backgrounds, card surfaces, button text for filled buttons, outlines for ghost buttons |
| Ink Wash | #333333 | neutral | Filled button backgrounds, subtle decorative fills in navigation |
| Ash Gray | #a9a9a9 | neutral | Muted link text, secondary border details |
| Action Red | #ef6b6b | accent | Outlined interactive elements (links, buttons) — provides the only chromatic highlight to draw attention to actionable items without overwhelming the monochrome interface |
| Ink | #1c1717 | neutral | Primary text, headings, links, borders for outlines, input text. This near-black provides strong contrast on light backgrounds |
| Canvas | #ffffff | neutral | Page backgrounds, elevated card surfaces, main content areas |
| Fog | #f0f0f0 | neutral | Subtle background for secondary sections, light dividers, input field backgrounds |
| Stone | #a9aea9 | neutral | Button backgrounds, promotional banners — a muted, desaturated gray to provide a soft interactive surface without strong chromatic emphasis |
| Pitch Black | #000000 | neutral | Primary text, prominent headings, default icon fills, active outline borders |
| Near Black | #282828 | neutral | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Charcoal Black | #18181b | neutral | Primary text, darkest backgrounds, borders, navigation text — defines the core, stark contrast against white surfaces. |
| Pure White | #ffffff | neutral | Page backgrounds, card surfaces, button text — the dominant canvas for content, providing maximum contrast for Charcoal Black text. |
| Warm Gray | #71717a | neutral | Secondary text, subtle borders, subheadings — softens the contrast for less critical information, maintaining legibility. |

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
- Does the style match plain, efficient, robust, direct, legible, work-focused?
- Are tokens consistent?
- Does the design avoid the warning: avoid hero theatrics, empty marketing sections, decorative illustrations, low-density cards, hidden controls, and copy that explains instead of enabling action?

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

Create a Utilitarian interface that feels plain, efficient, robust, direct, legible, work-focused. Utilitarian design is not ugly; it is respectful. It removes visual performance so users can complete real work quickly and confidently. Use semantic action color only, with clear state meaning. Build a complete, usable experience with clear hierarchy, real content structure, responsive behavior, accessible states, and a repeatable component system. avoid hero theatrics, empty marketing sections, decorative illustrations, low-density cards, hidden controls, and copy that explains instead of enabling action.

### 15.2 Landing Page Prompt

Design a Utilitarian landing page with a strong first viewport, specific product or brand promise, credible proof, clear section rhythm, and a focused conversion path. The visual identity should come from typography, spacing, color roles, imagery, and component geometry rather than generic decoration.

### 15.3 App Interface Prompt

Design a Utilitarian application screen for repeated use. Prioritize the main workflow, controls, state clarity, information density, and accessible interaction. Make the interface visually distinctive but keep operational surfaces calm enough for daily work.

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

A finished Utilitarian design should:

- feel visually specific within the first viewport
- support real content and real workflows
- have consistent tokens
- have clear interaction states
- be responsive without losing character
- be accessible enough for production use
- translate the five source references into a broader reusable skill
