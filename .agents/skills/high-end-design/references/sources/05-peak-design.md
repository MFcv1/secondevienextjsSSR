# Peak Design - High-End Design Source Notes

Source: https://styles.refero.design/style/6f3fb64d-d4c9-4ec1-86a1-7983e5180985
Site: https://peakdesign.com
North star: Photographic gallery on architectural black and white. Product precision through high-contrast typography.
Theme: light

## Extracted Color Tokens

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

## Typography

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

## Layout

The page uses a maximum-width contained layout, though specific hero sections extend full-bleed. The hero pattern frequently employs a split-screen approach with a stark black background on one side (containing large, high-contrast serif headlines) and either white space or aspirational lifestyle photography on the other. Sections follow a consistent vertical spacing, often alternating between dark content blocks and light product grids. Content arrangement leans towards clear, centered headline stacks or alternating text-left/image-right compositions. Product display utilizes responsive card grids (e.g., 4-column) with ample padding between items. Navigation is a persistent top bar featuring a minimal logo, functional links, and a search input.

## Spacing

- Section gap: 72px
- Element gap: 4px
- Card padding: 0px
- Page max width: not specified
- Radius: {"cards":"8px","badges":"9999px","inputs":"4px","buttons":"4px, 32px"}

## Components

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

## Dos

- Prioritize Absolute Zero (#000000) or Cloud White (#ffffff) for hero section backgrounds to create high-contrast statements.
- Use Exposure-10 (substitute Playfair Display) for all display and large heading text to convey craftsmanship and gravitas.
- Apply a 4px border-radius for all interactive elements like buttons and input fields for a subtle softening.
- Reserve bryant font with its characteristic letter-spacing (e.g., 0.61px at 16px) for uppercase action-oriented text and badges.
- Maintain a clear product-focused visual hierarchy by placing product images within cards that have 0px internal padding.
- Utilize Ash Gray (#eef1f0) as a divider or background for secondary UI elements to differentiate without interrupting the high-contrast main scheme.
- Ensure all body and informational text uses Geist (substitute Inter) at 14px or 16px for optimal legibility.

## Donts

- Do not use saturated colors for large background areas; maintain the primary black, white, and neutral palette.
- Avoid generic button styling; ensure clear differentiation between ghost, solid, and accent button variants.
- Do not introduce additional serif fonts; Exposure-10 is the singular serif. Do not use generic sans-serifs â€” stick to Geist and bryant.
- Avoid complex shadows; prefer flat UI elements or subtle border definitions for depth.
- Do not break the rigid grid layout with overlapping content or free-form elements; content should be contained and aligned.
- Do not use decorative elements that distract from the product imagery or strong typography.
- Do not use bold weights of Geist for normal paragraph text; reserve it for specific UI elements or semantic emphasis.

## Transferable Lessons

- Read this source through the lens of High-End Design: High-end design is defined by what it refuses: clutter, fake luxury, over-explaining, busy components, and cheap ornamental effects.
- Preserve the reference's strongest structural move rather than copying surface style.
- Use the source to expand the pattern library only when it adds a capability not already covered.
- Translate colors into semantic jobs before using them in a new project.
- Treat typography, spacing, component geometry, and interaction states as equal parts of the identity.
