# Slack - Clean SaaS Source Notes

Source: https://styles.refero.design/style/e26cb9b0-f876-41ff-9f24-fd67a6b9776c
Site: https://slack.com
North star: Vibrant digital workbench.
Theme: light

## Extracted Color Tokens

| Name | Hex | Group | Role |
| --- | --- | --- | --- |
| Canvas Ice | #fefbff | neutral | Primary page background, expansive neutral space for content. |
| Surface Frost | #ffffff | neutral | Elevated card backgrounds, component containers. |
| Whisper Cloud | #f9f0ff | neutral | Subtle background for UI elements, light hovered states. |
| Active Lavender | #f2defe | neutral | Background for active navigation items, subtle highlights. |
| Charcoal Black | #000000 | neutral | Primary text color for headings, body, and high-emphasis elements. |
| Carbon Gray | #1d1c1d | neutral | Secondary text and icon color, slightly softer than Charcoal Black. |
| Pewter | #696969 | neutral | Tertiary text, muted labels, helper text. |
| Cement Gray | #757575 | neutral | Informational text, list item details. |
| Slate Border | #edeaed | neutral | Subtle borders and dividers for UI separation. |
| Medium Gray | #808080 | neutral | Placeholder text, disabled states, default icon color. |
| Icon Gray | #5e5d60 | neutral | Specific icon color within navigation and utility areas. |
| Dark Plum | #481a54 | brand | Primary brand color, used for key UI components like navigation backgrounds and interactive elements. |
| Purple Heart | #611f69 | brand | Primary button background, active states, and emphasized UI elements. |
| Dark Violet | #730394 | brand | Accent text, links within dark backgrounds, and subtle branding elements. |

## Typography

#### Typeface 1: Salesforce-Sans

- Role: Used for all body text, navigation items, buttons, and detailed descriptive content, providing clarity and an approachable tone across all UI elements.
- Fallback: Open Sans, Arial, sans-serif
- Weights: 300, 400, 600, 700
- Sizes: 12px, 14px, 15px, 16px, 18px
- Line height: 1.20, 1.29, 1.30, 1.38, 1.40, 1.43, 1.56
- Letter spacing: -0.004em, -0.002em, -0.001em, 0.007em, 0.012em, 0.013em, 0.057em

#### Typeface 2: Salesforce-Avant-Garde

- Role: Reserved for headlines and high-impact textual elements, where its distinctive character creates a strong brand presence and visual hierarchy.
- Fallback: Montserrat, Georgia, serif
- Weights: 400, 600, 700
- Sizes: 18px, 21px, 22px, 24px, 32px, 50px, 58px, 64px, 76px, 96px
- Line height: 0.97, 1.00, 1.08, 1.11, 1.12, 1.20, 1.25, 1.33, 1.50
- Letter spacing: -0.012em, -0.008em, -0.004em, -0.001em

## Layout

The page primarily uses a max-width contained layout, though specific hero sections and decorative gradients (like the radial washes) span full viewport width. The hero section often features a centered headline over a dark, gradient background. Subsequent content sections typically alternate between clean white and light off-white bands, creating a visible rhythm. Content is arranged in alternating text-left/image-right or text-right/image-left patterns, or organized into multi-column card grids for features. Vertical spacing between sections is generous and consistent. The top navigation bar is sticky and features a fixed width, centered content, with a clear brand logo on the left and primary actions (sign-in, get started) on the right.

## Spacing

- Section gap: 98px
- Element gap: 16px
- Card padding: 16px
- Page max width: not specified
- Radius: {"cards":"16px","pills":"90px","inputs":"4px","buttons":"4px","default":"8px"}

## Components

| Component | Role | Treatment |
| --- | --- | --- |
| CTA Button Group |  | <style>   :root {     --color-canvas-ice: #fefbff;     --color-surface-frost: #ffffff;     --color-purple-heart: #611f69;     --color-deep-aubergine: #3d0157;     --color-charcoal-black: #000000;     --color-pewter: #696969;     --color-slate-border: #edeaed;     --font-salesforce-sans: 'Open Sans', Arial, sans-serif;     --font-salesforce-avant-garde: 'Montserrat', Georgia, serif;     --shadow-subtle: rgb(97, 31, 105) 0px 0px 0px 1px inset;     --shadow-lg: rgba(0, 0, 0, 0.1) 0px 5px 20px 0px;   }    .cta-wrapper {     background: var(--color-canvas-ice);     display: flex;     flex-direction: column;     align-items: center;     justify-content: center;     padding: 56px 40px;     gap: 32px;     font-family: var(--font-salesforce-sans);     width: 100%;     box-sizing: border-box;   }    .cta-headline {     font-family: var(--font-salesforce-avant-garde);     font-size: 50px;     font-weight: 700;     color: var(--color-charcoal-black);     text-align: center;     line-height: 1.0;     letter-spacing: -0.008em;     margin: 0;   }    .cta-subtext {     font-family: var(--font-salesforce-sans);     font-size: 18px;     font-weight: 400;     color: var(--color-pewter);     text-align: center;     line-height: 1.4;     margin: 0;     max-width: 440px;   }    .cta-buttons {     display: flex;     flex-direction: row;     gap: 16px;     align-items: center;     justify-content: center;     flex-wrap: wrap;   }    .btn-primary {     background: var(--color-purple-heart);     color: #ffffff;     font-family: var(--font-salesforce-sans);     font-size: 15px;     font-weight: 700;     letter-spacing: 0.057em;     text-transform: uppercase;     padding: 19px 40px;     border-radius: 4px;     border: none;     cursor: pointer;     text-decoration: none;     display: inline-block;     box-shadow: var(--shadow-subtle);     line-height: 1.2;     white-space: nowrap;   }    .btn-ghost {     background: transparent;     color: var(--color-deep-aubergine);     font-family: var(--font-salesforce-sans);     font-size: 15px;     font-weight: 700;     letter-spacing: 0.057em;     text-transform: uppercase;     padding: 19px 32px;     border-radius: 90px;     border: 2px solid var(--color-deep-aubergine);     cursor: pointer;     text-decoration: none;     display: inline-flex;     align-items: center;     gap: 8px;     line-height: 1.2;     white-space: nowrap;   }    .btn-ghost .arrow {     display: inline-flex;     align-items: center;   } </style>  <div class="cta-wrapper">   <p class="cta-headline">All your people<br>and AI agents.</p>   <p class="cta-subtext">Slack connects your team. Slackbot multiplies what they can do.</p>   <div class="cta-buttons">     <a href="#" class="btn-primary">GET STARTED</a>     <a href="#" class="btn-ghost">       FIND YOUR PLAN       <span class="arrow">         <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">           <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="#3d0157" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>         </svg>       </span>     </a>   </div> </div> |
| AI Features Tab Selector |  | <style>   :root {     --color-canvas-ice: #fefbff;     --color-surface-frost: #ffffff;     --color-whisper-cloud: #f9f0ff;     --color-active-lavender: #f2defe;     --color-purple-heart: #611f69;     --color-dark-violet: #730394;     --color-charcoal-black: #000000;     --color-pewter: #696969;     --color-cement-gray: #757575;     --color-slate-border: #edeaed;     --color-electric-blue: #1264a3;     --color-orchid-glow: #d17dfe;     --font-salesforce-sans: 'Open Sans', Arial, sans-serif;     --font-salesforce-avant-garde: 'Montserrat', Georgia, serif;     --shadow-xl: rgba(0, 0, 0, 0.1) 0px 0px 32px 0px;   }    .feature-tabs-wrapper {     background: #4a1255;     padding: 48px 32px;     width: 100%;     box-sizing: border-box;     font-family: var(--font-salesforce-sans);   }    .feature-tabs-headline {     font-family: var(--font-salesforce-avant-garde);     font-size: 42px;     font-weight: 700;     color: #ffffff;     text-align: center;     line-height: 1.08;     letter-spacing: -0.008em;     margin: 0 0 16px 0;   }    .feature-tabs-sub {     font-family: var(--font-salesforce-sans);     font-size: 16px;     color: rgba(255,255,255,0.75);     text-align: center;     line-height: 1.5;     margin: 0 0 36px 0;     max-width: 480px;     margin-left: auto;     margin-right: auto;   }    .feature-list {     background: var(--color-surface-frost);     border-radius: 16px;     overflow: hidden;     box-shadow: var(--shadow-xl);   }    .feature-item {     display: flex;     align-items: center;     padding: 18px 24px;     border-bottom: 1px solid var(--color-slate-border);     cursor: pointer;     background: transparent;     transition: background 0.15s;   }    .feature-item:last-child {     border-bottom: none;   }    .feature-item.active {     background: var(--color-whisper-cloud);     border-left: 3px solid var(--color-purple-heart);   }    .feature-item-text {     font-family: var(--font-salesforce-sans);     font-size: 15px;     font-weight: 400;     color: var(--color-charcoal-black);     line-height: 1.4;     margin: 0;   }    .feature-item.active .feature-item-text {     color: var(--color-purple-heart);     font-weight: 600;   }    .feature-item-dot {     width: 8px;     height: 8px;     border-radius: 50%;     background: var(--color-slate-border);     margin-right: 16px;     flex-shrink: 0;   }    .feature-item.active .feature-item-dot {     background: var(--color-purple-heart);   } </style>  <div class="feature-tabs-wrapper">   <h2 class="feature-tabs-headline">Reimagine what's possible<br>with AI and agents.</h2>   <p class="feature-tabs-sub">AI in Slack doesn't make you think, it helps you do. It summarizes and searches based on actual conversations.</p>   <div class="feature-list">     <div class="feature-item active">       <span class="feature-item-dot"></span>       <p class="feature-item-text">Update deals just by asking Slackbot</p>     </div>     <div class="feature-item">       <span class="feature-item-dot"></span>       <p class="feature-item-text">Summarize a conversation you missed</p>     </div>     <div class="feature-item">       <span class="feature-item-dot"></span>       <p class="feature-item-text">Get fast answers with Claude</p>     </div>     <div class="feature-item">       <span class="feature-item-dot"></span>       <p class="feature-item-text">Turn on AI note-taking in huddles</p>     </div>     <div class="feature-item">       <span class="feature-item-dot"></span>       <p class="feature-item-text">Review code with Github Copilot</p>     </div>     <div class="feature-item">       <span class="feature-item-dot"></span>       <p class="feature-item-text">Automate repetitive tasks with workflows</p>     </div>   </div> </div> |
| Pill Tab Navigation Selector |  | <style>   :root {     --color-canvas-ice: #fefbff;     --color-surface-frost: #ffffff;     --color-whisper-cloud: #f9f0ff;     --color-active-lavender: #f2defe;     --color-purple-heart: #611f69;     --color-dark-violet: #730394;     --color-charcoal-black: #000000;     --color-pewter: #696969;     --color-cement-gray: #757575;     --color-slate-border: #edeaed;     --color-electric-blue: #1264a3;     --color-orchid-glow: #d17dfe;     --color-pale-orchid: #eac8fe;     --font-salesforce-sans: 'Open Sans', Arial, sans-serif;     --font-salesforce-avant-garde: 'Montserrat', Georgia, serif;     --shadow-xl: rgba(0, 0, 0, 0.1) 0px 0px 32px 0px;     --shadow-lg: rgba(0, 0, 0, 0.1) 0px 5px 20px 0px;   }    .pill-section {     background: var(--color-canvas-ice);     padding: 56px 32px;     width: 100%;     box-sizing: border-box;     font-family: var(--font-salesforce-sans);     display: flex;     flex-direction: column;     align-items: center;     gap: 40px;   }    .pill-headline-row {     display: flex;     align-items: center;     justify-content: center;     flex-wrap: wrap;     gap: 0;   }    .pill-headline-text {     font-family: var(--font-salesforce-avant-garde);     font-size: 42px;     font-weight: 700;     color: var(--color-charcoal-black);     line-height: 1.08;     letter-spacing: -0.008em;     margin: 0;     text-align: center;   }    .pill-headline-text .accent {     color: var(--color-purple-heart);   }    .pill-tabs-container {     display: flex;     flex-direction: row;     align-items: center;     justify-content: center;     background: var(--color-pale-orchid);     border-radius: 90px;     padding: 6px;     gap: 4px;     box-shadow: var(--shadow-lg);   }    .pill-tab {     font-family: var(--font-salesforce-sans);     font-size: 15px;     font-weight: 600;     color: var(--color-pewter);     background: transparent;     border: none;     border-radius: 90px;     padding: 10px 24px;     cursor: pointer;     transition: all 0.18s;     white-space: nowrap;     text-decoration: none;     display: inline-block;     line-height: 1.3;   }    .pill-tab.active {     background: var(--color-surface-frost);     color: var(--color-charcoal-black);     font-weight: 700;     box-shadow: var(--shadow-lg);   }    .pill-sub {     font-family: var(--font-salesforce-sans);     font-size: 16px;     color: var(--color-pewter);     text-align: center;     line-height: 1.5;     margin: 0;     max-width: 460px;   }    .stat-cards {     display: flex;     flex-direction: row;     gap: 16px;     width: 100%;     flex-wrap: wrap;     justify-content: center;   }    .stat-card {     background: var(--color-surface-frost);     border-radius: 16px;     padding: 28px 24px;     flex: 1;     min-width: 140px;     max-width: 160px;     display: flex;     flex-direction: column;     gap: 8px;     box-shadow: var(--shadow-xl);     border: 1px solid var(--color-slate-border);   }    .stat-number {     font-family: var(--font-salesforce-avant-garde);     font-size: 36px;     font-weight: 700;     color: var(--color-purple-heart);     line-height: 1.0;     margin: 0;     letter-spacing: -0.008em;   }    .stat-label {     font-family: var(--font-salesforce-sans);     font-size: 13px;     color: var(--color-cement-gray);     line-height: 1.4;     margin: 0;   } </style>  <div class="pill-section">   <p class="pill-headline-text">Give every agent <span class="accent">context.</span></p>    <div class="pill-tabs-container">     <a href="#" class="pill-tab active">Knowledge</a>     <a href="#" class="pill-tab">People</a>     <a href="#" class="pill-tab">Process</a>     <a href="#" class="pill-tab">Platform</a>   </div>    <p class="pill-sub">Get access to every file, decision, and conversation, so you can build on past work instead of recreating it.</p>    <div class="stat-cards">     <div class="stat-card">       <p class="stat-number">97<span style="font-size:22px">min</span></p>       <p class="stat-label">average time users can save weekly with AI in Slack</p>     </div>     <div class="stat-card">       <p class="stat-number">4.4<span style="font-size:22px">hrs</span></p>       <p class="stat-label">saved per week on average by Slack users</p>     </div>     <div class="stat-card">       <p class="stat-number">86<span style="font-size:22px">%</span></p>       <p class="stat-label">of users feel more connected to their team</p>     </div>   </div> </div> |
| Primary Filled Button | Call to action | Solid Purple Heart (#611f69) background with white (#ffffff) text. Padding: 19px vertical, 40px horizontal. Border radius: 4px. Features a subtle inset shadow by rgb(97, 31, 105) for depth. |
| Ghost Button | Secondary action | Transparent background with Deep Aubergine (#3d0157) text. Padding: 12px circular. Border radius: 90px (pill shape). No border. Used for 'Find your plan' and other secondary CTAs. |
| Navigation Link | Navigation, in-text link | Default text is Pewter (#696969) or Charcoal Black (#000000). Hover state uses Electric Blue (#1264a3) for text. No specific padding or border, inherits from layout. |
| Text Only Button | Utility action | Transparent background, Charcoal Black (#000000) text (color: rgb(0, 0, 0)). Padding: 0px. Border radius: 4px. Used for subtle actions like 'Skip to main content'. |
| Content Card | Information display | Surface Frost (#ffffff) background. Border radius: 16px. Padding: 16px. No box shadow in most contexts. |
| Hero Section Gradient Background | Thematic background | Uses Magic Dust Gradient (linear-gradient(104deg, rgb(0, 0, 0) 9.56%, rgb(186, 1, 255) 102.66%)) for a dynamic backdrop. Contains various radial gradients for additional visual flair. |
| Trusted By Logo Grid | Social proof | Logos displayed against the Canvas Ice (#fefbff) background. Uses a subtle box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 32px 0px for some elements. |
| Annoucement Banner | Global alert | Top-most banner with Deep Aubergine (#3d0157) or similar dark purple background and white text. Height 40-80px. Used for site-wide messages like 'Meet the new Slack, where AI works.' |
| Tab Navigation Item | Content filtering | Transparent button with Pewter (#696969) text. Active state might have an Orchid Glow (#d17dfe) or Purple Heart (#611f69) accent, defined by context (e.g., underlines or background fills). Padding approximately 10px vertical, 30px horizontal, with 0px radius. |

## Dos

- Prioritize Salesforce-Avant-Garde for all headings and large display text to maintain brand voice.
- Use Purple Heart (#611f69) for primary call-to-action buttons, ensuring a visible contrast against white or near-white backgrounds.
- Apply a 4px `border-radius` to all functional buttons and input fields for a consistent interactive element shape.
- Use Charcoal Black (#000000) for primary body text and headings on light backgrounds to ensure AAA contrast.
- Utilize Electric Blue (#1264a3) exclusively for interactive links and secondary accents, reserving it for clear action points.
- Maintain a comfortable `elementGap` of 16px for spacing between most UI elements, and `cardPadding` of 16px for internal card content.
- Implement the Magic Dust Gradient (linear-gradient(104deg, rgb(0, 0, 0) 9.56%, rgb(186, 1, 255) 102.66%)) sparingly, typically for hero sections or significant brand statements.

## Donts

- Do not use generic system fonts; always map to Salesforce-Sans or Salesforce-Avant-Garde with appropriate substitutes.
- Avoid using multiple shades of purple for primary actions; stick to Purple Heart (#611f69) for consistency.
- Do not introduce sharp corners; maintain 4px or 16px `border-radius` based on component type, or 90px for pill shapes.
- Refrain from using Electric Blue (#1264a3) for large blocks of text; it is an accent and link color, not a primary text color.
- Do not neglect the subtle radial gradients in hero backgrounds; they contribute significantly to the playful brand feel.
- Avoid arbitrary elevation shadows; use the defined `rgba(0, 0, 0, 0.1) 0px 0px 32px 0px` for elevated elements.

## Transferable Lessons

- Read this source through the lens of Clean SaaS: Clean SaaS design is not blank minimalism. It is a discipline of making product value obvious, repeated workflows effortless, and trust signals quiet but visible.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
