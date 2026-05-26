---
name: serif-display
description: |
  Serif Display aesthetic for the web — large editorial display headlines (often serif),
  minimal achromatic palettes, restrained typography hierarchy. Use when user requests
  "editorial", "type-foundry", "publication", "luxury minimal", "magazine", "art-directed
  studio", "architectural", "bookish/sophisticated". Anti-slop: rejects generic Tailwind
  cards, Inter-as-everything, multicolor SaaS templates. The "type IS the design" approach.
version: 1.0.0
category: design-taste
tags: [serif-display, editorial, type-foundry, minimal, achromatic, large-display, magazine, sophisticated]
sources:
  - socio-type.com
  - fidele-editions.com
  - pangrampangram.com
  - standards.site
  - unveil.fr
---

# Serif Display — Design Skill

> **A skill for building editorial, type-foundry-quality websites where typography IS the design. Distilled from 5 award-winning Serif Display-tagged sites curated by Refero. Note: Despite the name, only some use literal serifs — the unifying trait is large impactful display typography on minimal canvases.**

---

## TABLE OF CONTENTS

1. [Philosophy](#philosophy)
2. [The 5 Serif Display Archetypes](#archetypes)
3. [Color Systems](#color)
4. [Typography Systems](#typography)
5. [Spacing & Geometry](#spacing)
6. [Border Radius Patterns](#radius)
7. [Surfaces & Layering](#surface)
8. [Component Patterns](#components)
9. [Layout Patterns](#layout)
10. [Imagery & Decoration](#imagery)
11. [Motion (Restrained)](#motion)
12. [Anti-Slop Rules](#anti-slop)
13. [Decision Tree](#decision)
14. [CSS Starter Templates](#templates)
15. [Tailwind v4 Configurations](#tailwind)
16. [Component Recipes](#recipes)
17. [Validation Checklist](#checklist)
18. [Quick Reference](#cheatsheet)

---

<a id="philosophy"></a>
## 1. PHILOSOPHY

### 1.1 Display Typography IS the Design
Every Serif Display site uses a **massive display headline** as the primary visual element:
- Sociotype: 251px Avec Sharp serif
- Fidèle Editions: 62px OTMagisterUnlicensedTrial
- Pangram Pangram: 145px Neue Montreal (with 14 specimen showcases at 103px!)
- Standards: 52px Soehne
- UNVEIL®: 16px (extreme outlier — display IS the diagonal photo collage)

**Pattern:** Display sizes 50-250+px. The headline carries the brand identity, replacing logo dominance.

### 1.2 Achromatic or Single-Accent
Color discipline:
- **Sociotype:** 5 grays only, NO accent
- **Fidèle Editions:** Faded Paper + Ink + 1 vivid Printmaker Blue
- **Pangram Pangram:** Mono + 1 Alert Red + 2 status colors (Yellow, Blue)
- **Standards:** Mono + 1 Action Orange
- **UNVEIL®:** Pure black + pure white (literally just 2 colors)

**Rule:** Either pure achromatic (2-5 grays) OR achromatic + ONE chromatic accent. Multiple accents are reserved for status badges only.

### 1.3 Either Pure White OR Warm Off-White
| Site | Page bg | Hex |
|------|---------|-----|
| Sociotype | Canvas White | `#ffffff` (pure) |
| Fidèle Editions | Faded Paper | `#f8f7ef` (warm cream) |
| Pangram Pangram | Canvas | `#fafafa` (slight off-white) |
| Standards | Canvas Ice | `#eaeaea` (cool gray) |
| UNVEIL® | Canvas White | `#ffffff` (pure) |

**Rule:** Pure white OR warm cream OR cool gray — pick ONE based on archetype warmth.

### 1.4 Multiple Specimen Display Fonts (Type Foundries)
Type-foundry sites (Sociotype, Pangram Pangram) showcase **many display fonts at extreme sizes**:
- Sociotype: 6 different serif display fonts at 251px each
- Pangram Pangram: 14 specimen fonts at 103px each

This is the "specimen showcase" pattern — multiple fonts each in their own card/section.

### 1.5 Sharp 0px Edges OR Soft 20px Pills (Binary)
| Site | Radius |
|------|--------|
| Sociotype | 0px (sharp) |
| Fidèle Editions | 0px (sharp print aesthetic) |
| Pangram Pangram | 20px uniform (soft) |
| Standards | 4px buttons + 0px cards |
| UNVEIL® | 6px uniform |

**Rule:** Either commit to sharp (0px) for editorial precision, OR commit to soft uniform (20px / 6px) for approachable foundries. Avoid the bland 8/12px Material default.

### 1.6 Letter-Spacing Discipline
Serif Display sites tune letter-spacing per size:
- Negative tracking on display (-0.02em to -0.04em)
- Subtle tracking on body (-0.01em to +0.01em)
- Often POSITIVE tracking on small caps/labels (0.08em to 0.20em)

Standards locks `-0.0100em` across ALL text — extreme single-value rule.

### 1.7 Imagery Strategies
- Sociotype: Large abstract colorful graphic backgrounds
- Fidèle Editions: Unmasked product photography (printed materials)
- Pangram Pangram: Atmospheric photo + product-focused (food relating to font names!)
- Standards: Cropped product UI screenshots, no illustrations
- UNVEIL®: **Diagonal overlapping translucent photo layers**

**No stock photography.** No people-doing-tasks SaaS templates.

### 1.8 Spacious Editorial OR Compact Density
| Site | Density | Section gap |
|------|---------|-------------|
| Sociotype | comfortable | **120px** |
| Fidèle Editions | **compact** | 42px |
| Pangram Pangram | comfortable | 92px |
| Standards | spacious | 46px |
| UNVEIL® | **compact** | (not specified, dense) |

**Two stances:** Editorial spacious (92-120px section gaps) OR architectural compact (42-46px).

---

<a id="archetypes"></a>
## 2. THE 5 SERIF DISPLAY ARCHETYPES

### 2.1 EDITORIAL WHITE CANVAS (Sociotype)
**Vibe:** Type foundry showcase, multi-display-fonts, max restraint
**Theme:** light (`#ffffff`)
**Palette:** 5 grays only (NO chromatic accent)
**Typography:** Onsite (body) + 5 different serif display fonts at 251px each
**Radius:** 0px everywhere
**Section gap:** 120px (very generous)
**When to use:** Type foundries, editorial portfolios, gallery showcase sites

### 2.2 RISOGRAPHIC WORKSHOP (Fidèle Editions)
**Vibe:** Warm paper canvas + electric blue + tactile print feel
**Theme:** light (`#f8f7ef` warm)
**Palette:** Faded Paper + Ink Black + 1 Printmaker Blue (#1664eb) + 2 secondary blues
**Typography:** OTMagisterUnlicensedTrial 62px display + BaselGrotesk Book/Regular/Bold + GTStandard-M (mono) + Arial + Assistant
**Radius:** 0px (sharp print)
**Section gap:** 42px (compact)
**When to use:** Independent publishing, print products, editorial e-commerce

### 2.3 BOLD CANVAS TYPE FOUNDRY (Pangram Pangram)
**Vibe:** White pages + dark headers + 14 display fonts + soft 20px pills
**Theme:** light (`#fafafa`)
**Palette:** Ink + Canvas + Paper + Slate + Alert Red + Update Yellow + Early Access Blue
**Typography:** Neue Montreal (workhorse) + 14 specimen display fonts at 103px each
**Radius:** 20px buttons/cards + 999px badges
**Section gap:** 92px
**When to use:** Type foundries with multi-font catalogs, premium SaaS with playful edge

### 2.4 PRECISION BLUEPRINT (Standards)
**Vibe:** Single typeface + single accent + architectural minimalism
**Theme:** light (`#eaeaea` cool gray)
**Palette:** Canvas Ice + Midnight Ink + Steel Gray + Whisper Gray + ONE Action Orange
**Typography:** Soehne ONLY (weights 400/600, 5 sizes, -0.0100em locked)
**Radius:** 4px buttons (only roundness)
**Section gap:** 46px
**When to use:** Premium SaaS, professional portfolios, B2B authority brands

### 2.5 ARCHITECTURAL BLUEPRINT (UNVEIL®)
**Vibe:** ULTIMATE minimal — 2 colors, 1 font, 1 weight, 2 sizes
**Theme:** light (`#ffffff`)
**Palette:** Just `#000` + `#FFF`
**Typography:** nb_international_proregular weight 400 (sizes 11, 16px only)
**Radius:** 6px uniform
**Layout:** Diagonal overlapping translucent photo layers
**When to use:** Architecture firms, art galleries, conceptual studios

---

<a id="color"></a>
## 3. COLOR SYSTEMS

### 3.1 The Achromatic Foundation

```css
/* Pattern A — Pure white */
:root {
  --bg: #ffffff;
  --text: #000000;
  --muted: #818181;
  --divider: #d6d6d6;
}

/* Pattern B — Warm cream */
:root {
  --bg: #f8f7ef;
  --text: #121212;
  --paper-secondary: #e2e2df;
  --ink: #000000;
}

/* Pattern C — Cool gray */
:root {
  --bg: #eaeaea;
  --text: #000000;
  --muted: #a1a1a1;
  --hairline: #d7d7d7;
}
```

### 3.2 The Single-Accent Rule

If using one chromatic accent, choose from documented Serif Display hues:

| Site | Accent | Hex | Use |
|------|--------|-----|-----|
| Fidèle Editions | Printmaker Blue | `#1664eb` | Vivid electric blue (links + borders) |
| Pangram Pangram | Alert Red | `#ff2f00` | Energetic orange-red CTA |
| Standards | Action Orange | `#ff2e00` | Same vivid orange CTA |

**Pattern:** Vivid orange-red OR vivid blue. Never pastel/muted accents.

### 3.3 Status Color Triplet (Pangram Pangram pattern)

If status indicators needed:
```css
--status-new: #ff2f00;          /* Alert Red — primary highlight */
--status-update: #ffb700;       /* Update Yellow */
--status-early-access: #bfe0ff; /* Light Blue */
```

These appear ONLY as 999px pill badges with black text. Never as button bg.

### 3.4 Color Anti-Slop

❌ **REJECT** SaaS-default greys:
```css
--bg: #f9fafb;          /* gray-50, generic */
--text: #1f2937;        /* gray-800, generic */
--accent: #3b82f6;      /* blue-500, overused */
border: #e5e7eb;        /* gray-200, generic */
```

✅ **USE** Serif Display achromatics + accent:
```css
--bg: #f8f7ef;          /* warm cream */
--text: #000000;        /* pure black */
--accent: #ff2e00;      /* Action Orange */
--hairline: #d6d6d6;    /* Light Gray (not Tailwind gray-200) */
```

### 3.5 Surface Hierarchy

```css
/* 2-tier (most common) */
--surface-0: #fafafa;   /* page bg */
--surface-1: #ededed;   /* cards / secondary */

/* 3-tier (Pangram Pangram + dark sections) */
--surface-0: #fafafa;
--surface-1: #ededed;
--surface-2: #000000;   /* dark hero sections / contrast */
```

---

<a id="typography"></a>
## 4. TYPOGRAPHY SYSTEMS

### 4.1 The Display-First Mandate

Display sizes by site:
| Site | Display |
|------|---------|
| Sociotype | **251px** |
| Pangram Pangram | **145px** + specimens at 103px |
| Fidèle Editions | 62px |
| Standards | 52px |
| UNVEIL® | 16px (outlier — diagonal images replace display type) |

**Rule:** Display ≥ 50px. 100-250px common for type foundries. Heavy negative tracking at large sizes.

### 4.2 Font Pairing Patterns

#### Pattern A — Single Custom Font (Restraint)
```css
/* Standards — Soehne only */
--font-primary: 'Soehne', system-ui, sans-serif;
/* Used in 5 sizes (10/14/20/31/52), 2 weights (400/600), letter-spacing -0.0100em LOCKED */
```

#### Pattern B — Single Sans + Multiple Specimen Display Fonts
```css
/* Sociotype — 6 display serifs */
--font-body: 'Onsite', system-ui, sans-serif;
--font-display-1: 'Avec Sharp', serif;
--font-display-2: 'Ceno', serif;
--font-display-3: 'Meso', serif;
--font-display-4: 'Gestura', serif;
--font-display-5: 'Rework', serif;
```

```css
/* Pangram Pangram — workhorse + 14 showcase */
--font-primary: 'Neue Montreal', Inter, sans-serif;
--font-display-1: 'neue-montreal-semibold', Inter, sans-serif;
--font-display-2: 'neue-york-normal-bold', Inter, sans-serif;
/* ...14 more for showcasing */
```

#### Pattern C — Display Serif + Workhorse Sans + Mono + System Fallback
```css
/* Fidèle Editions */
--font-display: 'OTMagisterUnlicensedTrial', 'Playfair Display', serif;
--font-body: 'BaselGrotesk Book', Inter, sans-serif;
--font-mono: 'GTStandard-M', 'Space Mono', monospace;
--font-utility: Arial, Helvetica, sans-serif;
```

### 4.3 Letter-Spacing Discipline

```css
/* Pattern: progressive negative on display */
.display-251  { letter-spacing: 2.51px; }    /* large positive (Sociotype) */
.display-145  { letter-spacing: normal; }    /* Pangram Pangram normal */
.display-62   { letter-spacing: -0.99px; }   /* Fidèle */
.heading-31   { letter-spacing: -0.31px; }   /* Standards */
.body-16      { letter-spacing: -0.14px; }   /* Standards */
.caption-10   { letter-spacing: -0.1px; }    /* Standards */

/* Or LOCK across all sizes (Standards) */
* { letter-spacing: -0.0100em; }

/* Or POSITIVE tracking on small caps (Sociotype) */
.caption-11 { letter-spacing: 0.88px; }
.label-uppercase { letter-spacing: 0.20em; }
```

### 4.4 OpenType Features

```css
/* Soehne with discretionary ligatures */
.body { font-feature-settings: "dlig" on, "liga" on; }

/* Sociotype Gestura with ligatures */
.display-gestura { font-feature-settings: 'liga' on; }
```

### 4.5 Type Scale Patterns

| Site | Base | Ratio |
|------|------|-------|
| Sociotype | 12px | 1.125 (Major Second) |
| Fidèle Editions | 18px | 1.125 |
| Pangram Pangram | 15px | 1.25 (Major Third) |
| Standards | 10px | 1.2 (Minor Third) |
| UNVEIL® | 11px | 1.067 (Minor Second) |

### 4.6 Weight Restraint

Most Serif Display sites use **2-3 weights only**:
- Standards: 400, 600 (just 2)
- UNVEIL®: 400 (just 1!)
- Sociotype: 400 (everywhere)
- Pangram Pangram: 400, 530, 600 (3)
- Fidèle Editions: 400, 700 (2)

---

<a id="spacing"></a>
## 5. SPACING & GEOMETRY

### 5.1 Section Gap (Editorial Spacious vs Compact)

```css
/* Spacious editorial */
--section-gap: 120px;   /* Sociotype */
--section-gap: 92px;    /* Pangram Pangram */

/* Compact architectural */
--section-gap: 46px;    /* Standards */
--section-gap: 42px;    /* Fidèle Editions */
```

### 5.2 Element Gap (Tight)

```css
--element-gap: 5px;     /* Fidèle Editions (extreme tight) */
--element-gap: 8px;     /* Pangram Pangram */
--element-gap: 10px;    /* Standards */
--element-gap: 12px;    /* Sociotype */
```

### 5.3 Card Padding Variance

| Site | Card padding |
|------|--------------|
| Sociotype | 0px (transparent) |
| UNVEIL® | 10-16px |
| Fidèle Editions | 19px |
| Pangram Pangram | 26px |
| Standards | 13px |

### 5.4 Spacing Scale

Each site defines a sparse, purposeful scale:
```css
/* Standards */
--spacing-5: 5px; --spacing-10: 10px; --spacing-13: 13px; --spacing-15: 15px;
--spacing-46: 46px; --spacing-50: 50px; --spacing-59: 59px;

/* UNVEIL® compact */
--spacing-4: 4px; --spacing-7: 7px; --spacing-10: 10px;
--spacing-14: 14px; --spacing-16: 16px; --spacing-40: 40px;
```

**Rule:** 6-12 specific values, no generic 4/8/16/32 cascade.

---

<a id="radius"></a>
## 6. BORDER RADIUS PATTERNS

### 6.1 Three Stances

#### Stance 1 — Sharp 0px (Editorial Print)
```css
:root {
  --radius-buttons: 0;
  --radius-cards: 0;
  --radius-inputs: 0;
}
```
Used by: Sociotype, Fidèle Editions

#### Stance 2 — Uniform Soft (Approachable)
```css
:root {
  --radius-all: 6px;     /* UNVEIL® */
  /* OR */
  --radius-buttons: 20px;
  --radius-cards: 20px;
  --radius-inputs: 20px;
  --radius-badges: 999px;  /* pill exception */
}
```
Used by: UNVEIL® (6px), Pangram Pangram (20px+999px badges)

#### Stance 3 — Mixed Strict (Engineered)
```css
:root {
  --radius-buttons: 4px;
  --radius-cards: 0px;
}
```
Used by: Standards

### 6.2 Anti-Slop Radius

❌ REJECT:
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
/* Material cascade */
```

✅ USE one strict stance and commit.

---

<a id="surface"></a>
## 7. SURFACES & LAYERING

### 7.1 No Drop Shadows

Every Serif Display site avoids shadows:
- Sociotype: "Do not introduce shadows or significant elevation"
- Fidèle Editions: "Avoid using gradients or drop shadows"
- Pangram Pangram: "Do not use shadows; rely on bg color changes, borders, and rounded corners"
- Standards: "Refrain from applying shadows to elements"
- UNVEIL®: "Avoid any drop shadows or complex elevation schemes"

**Rule:** Depth via background color tier + 1px hairline border. Never shadow.

### 7.2 Hairline Border Pattern

```css
/* Subtle separation via hairlines */
.card {
  background: var(--surface-1);
  border: 1px solid var(--hairline);  /* 1px */
  /* never thinner — explicit Pangram Pangram rule */
}

/* Half-border (Standards) */
.ghost-card {
  border: none;
  border-top: 0.5px solid var(--hairline);
  border-left: 0.5px solid var(--hairline);
  /* "Architectural blueprint corner" effect */
}
```

### 7.3 Image Layering (UNVEIL® pattern)

```css
.diagonal-image-stack {
  position: relative;
}
.diagonal-image-stack img {
  position: absolute;
  opacity: 0.7;             /* slight transparency */
  filter: saturate(0.6);    /* desaturated */
  border-radius: 0;         /* sharp rectangles */
}
.diagonal-image-stack img:nth-child(1) { top: 5%;  left: 10%; rotate: 0deg; }
.diagonal-image-stack img:nth-child(2) { top: 20%; left: 25%; rotate: -3deg; }
.diagonal-image-stack img:nth-child(3) { top: 35%; left: 40%; rotate: 2deg; }
```

---

<a id="components"></a>
## 8. COMPONENT PATTERNS

### 8.1 The Filled Button

```css
/* Pattern A — Sharp dark filled (Pangram, Fidèle) */
.btn-filled-dark {
  background: var(--ink);             /* #000000 or near */
  color: var(--canvas);
  border: none;
  border-radius: var(--radius-buttons); /* 0 or 20 */
  padding: 7-13px 22-32px;
  font-family: var(--font-primary);
  font-weight: 400-500;
}

/* Pattern B — Vivid accent filled (Pangram, Standards) */
.btn-filled-accent {
  background: var(--accent);          /* #ff2e00 or #ff2f00 */
  color: var(--text-on-accent);       /* white or black */
  border: none;
  border-radius: var(--radius-buttons);
  padding: 13.3px 13.3px;             /* Standards exact */
}
```

### 8.2 The Ghost / Outlined Button

```css
/* Pattern A — Underline ghost (Sociotype) */
.btn-ghost-underline {
  background: transparent;
  color: var(--ink);
  border: none;
  border-bottom: 1px solid currentColor;
  border-radius: 0;
  padding: 0;
  /* "lightweight integrated feel" */
}

/* Pattern B — Outlined transparent (UNVEIL®) */
.btn-outlined {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 6px;
  padding: 40px 10px 7px 10px;        /* asymmetric padding! */
}

/* Pattern C — Outlined accent (Pangram Pangram) */
.btn-outlined-accent {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 20px;
  padding: 7.65px 22.95px;
}
```

### 8.3 The Featured / Showcase Card

```css
/* Pattern A — Transparent (Sociotype) */
.card-transparent {
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
}

/* Pattern B — Soft pill (Pangram Pangram) */
.card-soft {
  background: var(--paper);    /* #ededed */
  border-radius: 20px;
  padding: 25.72px;
  /* No shadow */
}

/* Pattern C — Sharp print (Fidèle Editions) */
.card-print {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  /* Image central, title + price below */
}

/* Pattern D — Ghost card with corner border (Standards) */
.card-ghost-corner {
  background: transparent;
  border: none;
  border-top: 0.5px solid var(--hairline);
  border-left: 0.5px solid var(--hairline);
  border-radius: 0;
  padding: 0;
}
```

### 8.4 Status Badges (Pangram pattern)

```css
.badge {
  border-radius: 999px;          /* pill */
  padding: 4px 11.65px;
  font-family: var(--font-primary);
  font-size: 12px;
  font-weight: 400;
  color: var(--ink);              /* always black text */
}
.badge-new            { background: #ff2f00; }
.badge-update         { background: #ffb700; }
.badge-early-access   { background: #bfe0ff; }
```

### 8.5 Text Input

```css
/* Pattern A — Underline only (Sociotype, Fidèle) */
.input-underline {
  background: transparent;
  color: var(--ink);
  border: none;
  border-bottom: 1px solid var(--hairline);
  border-radius: 0;
  padding: 12-24px 0 12-24px 0;
}

/* Pattern B — Soft pill (Pangram Pangram) */
.input-soft {
  background: var(--canvas);
  color: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 20px;
  padding: 24px 45.9px 24px 24px;
}
```

### 8.6 Navigation Link

```css
.nav-link {
  background: transparent;
  color: var(--ink);
  font-family: var(--font-primary);
  font-size: 14-16px;
  letter-spacing: -0.0100em;
  text-decoration: none;
  /* Hover: border-bottom appears */
  position: relative;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 200ms ease;
}
.nav-link:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

---

<a id="layout"></a>
## 9. LAYOUT PATTERNS

### 9.1 Editorial Hero (Sociotype, Pangram Pangram)

```html
<section class="editorial-hero">
  <h1 class="display">Sociotype</h1>
  <p class="hero-sub">A type foundry for the editorial age.</p>
  <div class="hero-actions">
    <button class="btn-filled-dark">Browse fonts</button>
    <button class="btn-ghost-underline">Read manifesto</button>
  </div>
</section>
```

```css
.editorial-hero {
  background: var(--bg);
  padding: 120px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 48px;
  min-height: 80vh;
}
.display {
  font-family: var(--font-display);
  font-size: clamp(60px, 18vw, 251px);
  font-weight: 400;
  line-height: 1.0-1.25;
  letter-spacing: 0.0010em;
  color: var(--ink);
  margin: 0;
}
```

### 9.2 Specimen Showcase Grid (Type Foundry)

```css
.specimen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  padding: 60px 24px;
}
.specimen-card {
  background: var(--paper);
  border-radius: 20px;
  padding: 25.72px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.specimen-card-display {
  font-family: var(--font-specimen);  /* unique per card */
  font-size: 103px;
  line-height: 1.0;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}
.specimen-card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--slate);
}
```

### 9.3 Compact Editorial (Fidèle Editions, UNVEIL®)

```css
.compact-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;                            /* tight! */
  padding: 0 24px;
}
.compact-grid-item {
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
```

### 9.4 Diagonal Image Stack (UNVEIL® signature)

```css
.diagonal-stack {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
.diagonal-stack img {
  position: absolute;
  width: 40vw;
  height: 60vh;
  object-fit: cover;
  border-radius: 0;
  opacity: 0.7;
  filter: saturate(0.6);
}
.diagonal-stack img:nth-child(1) {
  top: 10%; left: 5%;
  transform: rotate(-3deg);
}
.diagonal-stack img:nth-child(2) {
  top: 25%; left: 30%;
  transform: rotate(2deg);
  opacity: 0.6;
}
.diagonal-stack img:nth-child(3) {
  top: 40%; left: 50%;
  transform: rotate(-1deg);
  opacity: 0.55;
}
```

### 9.5 Two-Column Editorial (Pangram, Fidèle)

```css
.two-col-editorial {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40-80px;
  align-items: start;
  padding: 60-92px 24px;
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .two-col-editorial { grid-template-columns: 1fr; }
}
```

### 9.6 Sticky Minimal Top Nav

```css
.editorial-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16-24px 32px;
  /* No border-bottom — clean */
}
.editorial-nav .brand {
  font-family: var(--font-display);
  font-size: 18-26px;
  font-weight: 600;
  color: var(--ink);
}
.editorial-nav .links {
  display: flex;
  gap: 30-50px;
}
```

---

<a id="imagery"></a>
## 10. IMAGERY & DECORATION

### 10.1 Imagery Strategies

| Site | Strategy |
|------|----------|
| Sociotype | Large abstract colorful graphic backgrounds (no photos) |
| Fidèle Editions | Unmasked product photography (printed materials, full-bleed) |
| Pangram Pangram | Atmospheric photo + product-focused (food = font names) |
| Standards | Cropped product UI screenshots on white, no illustrations |
| UNVEIL® | Diagonal overlapping translucent photo layers (signature) |

### 10.2 Photo Treatment

```css
/* Pattern A — Fidèle: unmasked, full color */
.product-photo {
  width: 100%;
  height: auto;
  border-radius: 0;
  /* No filter, no overlay — let print speak */
}

/* Pattern B — UNVEIL: layered translucent */
.layered-photo {
  opacity: 0.7;
  filter: saturate(0.6);
  border-radius: 0;
}

/* Pattern C — Pangram: atmospheric with overlay */
.atmospheric-bg {
  position: absolute;
  inset: 0;
  filter: brightness(0.7);
}
```

### 10.3 Iconography

All Serif Display sites use **outlined monochrome icons** in primary text color:
```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="..." />
</svg>
```

Style: simple, outlined, monochromatic, sharp stroke.

### 10.4 Decorative Elements

- **Hairline dividers** between sections (1px in subtle gray)
- **Half-corner borders** (top + left only — Standards)
- **No gradients** (commitment to flat surfaces)
- **No textures** (clean minimalism)

---

<a id="motion"></a>
## 11. MOTION (RESTRAINED)

### 11.1 Hover Transitions Only

```css
.btn-ghost-underline {
  position: relative;
  transition: color 200ms ease;
}
.btn-ghost-underline::after {
  /* underline animation */
  transform: scaleX(0);
  transition: transform 200ms ease;
  transform-origin: right;
}
.btn-ghost-underline:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

### 11.2 Type Specimen Hover (Foundries)

```css
.specimen-display {
  transition: font-variation-settings 400ms ease;
}
.specimen-display:hover {
  /* Variable font weight shift */
  font-variation-settings: 'wght' 700;
}
```

### 11.3 Layered Image Drift (UNVEIL®)

```css
.layered-photo {
  transition: transform 600ms cubic-bezier(0.16, 1, 0.30, 1);
}
.layered-photo:hover {
  transform: rotate(0deg) scale(1.05);
  opacity: 1;
  filter: saturate(1);
}
```

### 11.4 Scroll Fade-In

```css
.editorial-section {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.editorial-section.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

### 11.5 Things to AVOID

- 3D scenes
- Cursor effects
- Marquees
- Auto-play video heroes
- Parallax that breaks editorial calm
- Aggressive type reveals on every section

Serif Display = restraint. Motion = a different category.

---

<a id="anti-slop"></a>
## 12. ANTI-SLOP RULES

### 12.1 Color Anti-Slop

❌ REJECT:
```css
--bg: #f9fafb;          /* gray-50 generic */
--text: #1f2937;        /* gray-800 generic */
--accent: #3b82f6;      /* blue-500 overused */
--accent: #6366f1;      /* indigo-500 overused */
border: #e5e7eb;        /* gray-200 generic */
```

✅ USE:
```css
--bg: #f8f7ef;          /* warm cream */
--bg: #eaeaea;          /* cool ice gray */
--text: #000000;        /* pure black */
--text: #121212;        /* near-black */
--accent: #ff2e00;      /* Action Orange */
--accent: #1664eb;      /* Printmaker Blue */
```

### 12.2 Typography Anti-Slop

❌ REJECT:
- Inter as default everywhere
- 3+ unrelated decorative fonts
- Default tracking on all sizes
- Headings smaller than 40px

✅ USE:
- Single custom font OR display-serif + body-sans pairing
- Display 50-250+px
- Negative tracking on display
- Specimen display fonts at extreme sizes for foundries

### 12.3 Radius Anti-Slop

❌ REJECT Material cascade (4/6/8/12px).

✅ USE one Serif Display stance:
- 0px sharp (editorial print)
- Uniform soft (6px / 20px)
- Mixed strict (4px buttons, 0px cards)

### 12.4 Layout Anti-Slop

❌ REJECT:
- Hero with stock photo + 2-button CTA
- "Trusted by" logo bar
- 3-column "Features" grid with icon-circle template

✅ USE:
- Centered display headline + minimal sub + 1-2 ghost CTAs
- Specimen showcase grids (foundries)
- Full-bleed product photography (e-commerce)
- Diagonal photo stacks (architecture/galleries)

### 12.5 Component Anti-Slop

❌ REJECT:
- shadcn-style cards with `border + shadow + 12px radius`
- Material outlined buttons with focus ring
- Card-grid templates with icon-circles + titles

✅ USE:
- Transparent cards on white/cream
- Underline ghost buttons
- Hairline-corner cards
- Status pill badges (1 vivid + neutral text)

---

<a id="decision"></a>
## 13. DECISION TREE

```
What is the brand's product?

├─ "Type foundry / font catalog / specimen showcase"
│   ├─ Sharp editorial → SOCIOTYPE (251px, 0px, 5 grays)
│   └─ Soft modern → PANGRAM PANGRAM (145px + 14 specimens, 20px, multi-status)
│
├─ "Independent publishing / print products"
│   → FIDÈLE EDITIONS (warm paper + electric blue + 0px sharp)
│
├─ "Premium SaaS / B2B authority / professional"
│   → STANDARDS (single Soehne + 1 Action Orange + 4px)
│
└─ "Architecture / art gallery / conceptual studio"
    → UNVEIL® (just B&W + diagonal photo stack + 6px uniform)
```

---

<a id="templates"></a>
## 14. CSS STARTER TEMPLATES

### 14.1 Editorial White Canvas (Sociotype)

```css
:root {
  --bg: #ffffff;
  --text: #000000;
  --muted: #818181;
  --hairline: #d6d6d6;
  --tertiary: #9d9d9d;

  --font-body: 'Onsite', system-ui, sans-serif;
  --font-display: 'Avec Sharp', serif;

  --text-caption: 11px;     --leading-caption: 1.38;     --tracking-caption: 0.88px;
  --text-body: 14px;        --leading-body: 1.29;        --tracking-body: 0.35px;
  --text-heading: 26px;     --leading-heading: 1.13;     --tracking-heading: 0.26px;
  --text-display-sm: 40px;  --leading-display-sm: 1;     --tracking-display-sm: 0.6px;
  --text-display: 251px;    --leading-display: 1.25;     --tracking-display: 2.51px;

  --section-gap: 120px;
  --card-padding: 0;
  --element-gap: 12px;

  --radius: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
}

.display {
  font-family: var(--font-display);
  font-size: clamp(80px, 22vw, 251px);
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: 2.51px;
}

.btn-ghost {
  background: transparent;
  color: var(--text);
  border: none;
  border-bottom: 1px solid currentColor;
  border-radius: 0;
  padding: 0;
  font-family: var(--font-body);
}
```

### 14.2 Risographic Workshop (Fidèle Editions)

```css
:root {
  --bg: #f8f7ef;
  --bg-secondary: #e2e2df;
  --ink: #121212;
  --black: #000000;
  --accent: #1664eb;
  --accent-soft: #4f89ec;
  --link: #006ce5;
  --white: #ffffff;

  --font-display: 'OTMagisterUnlicensedTrial', 'Playfair Display', serif;
  --font-body: 'BaselGrotesk Book', Inter, sans-serif;
  --font-body-regular: 'BaselGrotesk Regular', Inter, sans-serif;
  --font-mono: 'GTStandard-M', 'Space Mono', monospace;
  --font-utility: Arial, Helvetica, sans-serif;

  --text-caption: 13px;     --leading-caption: 1.2;
  --text-body: 16px;        --leading-body: 1.5;        --tracking-body: -0.16px;
  --text-subheading: 22px;  --leading-subheading: 0.92;
  --text-heading: 32px;     --leading-heading: 1;       --tracking-heading: -0.64px;
  --text-display: 62px;     --leading-display: 0.92;    --tracking-display: -0.99px;

  --section-gap: 42px;
  --card-padding: 19px;
  --element-gap: 5px;

  --radius: 0;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
}

.display {
  font-family: var(--font-display);
  font-size: var(--text-display);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
  color: var(--ink);
}

.link-brand {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 200ms ease;
}
.link-brand:hover { border-bottom-color: var(--accent); }

.btn-footer {
  background: var(--ink);
  color: var(--white);
  border: none;
  border-radius: 0;
  padding: 0 48px;
  font-family: var(--font-utility);
  font-size: 13px;
}
```

### 14.3 Bold Type Foundry (Pangram Pangram)

```css
:root {
  --canvas: #fafafa;
  --paper: #ededed;
  --ink: #000000;
  --slate: #666666;
  --alert-red: #ff2f00;
  --update-yellow: #ffb700;
  --early-access-blue: #bfe0ff;

  --font-primary: 'Neue Montreal', Inter, sans-serif;

  --text-caption: 12px;       --leading-caption: 1.2;
  --text-body: 16px;          --leading-body: 1.2;
  --text-subheading: 20px;    --leading-subheading: 1.2;
  --text-heading-sm: 24px;    --leading-heading-sm: 1.17;
  --text-heading: 36px;       --leading-heading: 1.1;
  --text-heading-lg: 48px;    --leading-heading-lg: 1.1;
  --text-display-sm: 121px;   --leading-display-sm: 1;
  --text-display: 145px;      --leading-display: 1;

  --section-gap: 92px;
  --card-padding: 26px;
  --element-gap: 8px;

  --radius-cards: 20px;
  --radius-buttons: 20px;
  --radius-inputs: 20px;
  --radius-badges: 999px;
}

body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-primary);
  letter-spacing: normal;   /* CRITICAL — Neue Montreal natural spacing */
}

.btn-filled-dark {
  background: var(--ink);
  color: var(--canvas);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 7.65px 22.95px;
  font-family: inherit;
}

.btn-outlined-accent {
  background: transparent;
  color: var(--alert-red);
  border: 1px solid var(--alert-red);
  border-radius: var(--radius-buttons);
  padding: 7.65px 22.95px;
}

.specimen-card {
  background: var(--paper);
  border-radius: var(--radius-cards);
  padding: 25.72px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.badge-new          { background: var(--alert-red); color: var(--ink); border-radius: var(--radius-badges); padding: 4px 11.65px; }
.badge-update       { background: var(--update-yellow); color: var(--ink); border-radius: var(--radius-badges); padding: 4px 11.65px; }
.badge-early-access { background: var(--early-access-blue); color: var(--ink); border-radius: var(--radius-badges); padding: 4px 11.65px; }
```

### 14.4 Precision Blueprint (Standards)

```css
:root {
  --bg: #eaeaea;
  --ink: #000000;
  --steel: #a1a1a1;
  --hairline: #d7d7d7;
  --accent: #ff2e00;

  --font-primary: 'Soehne', system-ui, sans-serif;

  --text-caption: 10px;     --leading-caption: 1.55;     --tracking-caption: -0.1px;
  --text-body-sm: 14px;     --leading-body-sm: 1.45;     --tracking-body-sm: -0.14px;
  --text-body: 20px;        --leading-body: 1.27;        --tracking-body: -0.2px;
  --text-heading: 31px;     --leading-heading: 1.15;     --tracking-heading: -0.31px;
  --text-display: 52px;     --leading-display: 1;        --tracking-display: -0.52px;

  --section-gap: 46px;
  --card-padding: 13px;
  --element-gap: 10px;

  --radius-buttons: 4px;
  --radius-cards: 0;
}

* {
  letter-spacing: -0.0100em;   /* LOCKED across all text */
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-primary);
  font-feature-settings: "dlig" on, "liga" on;
}

.btn-cta {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-buttons);
  padding: 13.3px 13.3px;
  font-family: inherit;
  font-weight: 400;
}

.btn-secondary {
  background: var(--ink);
  color: white;
  border: none;
  border-radius: var(--radius-buttons);
  padding: 13.3px 13.3px;
}

.ghost-card {
  background: transparent;
  border: none;
  border-top: 0.5px solid var(--hairline);
  border-left: 0.5px solid var(--hairline);
  border-radius: 0;
}
```

### 14.5 Architectural Blueprint (UNVEIL®)

```css
:root {
  --bg: #ffffff;
  --ink: #000000;

  --font-primary: 'nb_international_proregular', Inter, sans-serif;

  --text-body: 16px;     --leading-body: 1.05;     --tracking-body: 0.304px;
  --text-small: 11px;    --leading-small: 1.05;    --tracking-small: 0.165px;

  --space-2: 2px;  --space-4: 4px;  --space-7: 7px;
  --space-10: 10px; --space-14: 14px; --space-16: 16px;
  --space-40: 40px;

  --radius: 6px;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-primary);
  font-weight: 400;
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

.btn-outlined {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--ink);
  border-radius: var(--radius);
  padding: 40px 10px 7px 10px;   /* asymmetric */
  font-family: inherit;
  font-weight: 400;
  letter-spacing: var(--tracking-body);
}

.diagonal-layer {
  position: absolute;
  opacity: 0.7;
  filter: saturate(0.6);
  border-radius: 0;
  border: 1px solid rgba(0,0,0,0.05);
}
```

---

<a id="tailwind"></a>
## 15. TAILWIND V4 CONFIGURATIONS

### 15.1 Editorial White (Sociotype)

```css
@theme {
  --color-canvas-white: #ffffff;
  --color-ink-black: #000000;
  --color-medium-gray: #818181;
  --color-light-gray: #d6d6d6;
  --color-faded-gray: #9d9d9d;

  --font-onsite: 'Onsite', system-ui, sans-serif;
  --font-avec-sharp: 'Avec Sharp', serif;

  --text-caption: 11px; --leading-caption: 1.38; --tracking-caption: 0.88px;
  --text-body: 14px; --leading-body: 1.29; --tracking-body: 0.35px;
  --text-display: 251px; --leading-display: 1.25; --tracking-display: 2.51px;

  --radius-default: 0;
}
```

### 15.2 Pangram Pangram

```css
@theme {
  --color-ink: #000000;
  --color-canvas: #fafafa;
  --color-paper: #ededed;
  --color-slate: #666666;
  --color-alert-red: #ff2f00;
  --color-update-yellow: #ffb700;
  --color-early-access-blue: #bfe0ff;

  --font-neue-montreal: 'Neue Montreal', Inter, sans-serif;

  --text-display: 145px; --leading-display: 1;
  --text-display-sm: 121px; --leading-display-sm: 1;
  --text-heading-lg: 48px; --leading-heading-lg: 1.1;
  --text-body: 16px; --leading-body: 1.2;

  --radius-cards: 20px;
  --radius-buttons: 20px;
  --radius-inputs: 20px;
  --radius-badges: 999px;
}
```

### 15.3 Standards

```css
@theme {
  --color-canvas-ice: #eaeaea;
  --color-midnight-ink: #000000;
  --color-steel-gray: #a1a1a1;
  --color-whisper-gray: #d7d7d7;
  --color-action-orange: #ff2e00;

  --font-soehne: 'Soehne', system-ui, sans-serif;

  --text-display: 52px; --leading-display: 1; --tracking-display: -0.52px;
  --text-heading: 31px; --leading-heading: 1.15; --tracking-heading: -0.31px;
  --text-body: 20px; --leading-body: 1.27; --tracking-body: -0.2px;

  --radius-buttons: 4px;
}
```

---

<a id="recipes"></a>
## 16. COMPONENT RECIPES

### 16.1 Editorial Hero with Massive Display

```html
<section class="editorial-hero">
  <h1 class="editorial-display">Sociotype</h1>
  <p class="editorial-sub">A type foundry for the editorial age.</p>
  <div class="editorial-actions">
    <button class="btn-filled">Browse fonts</button>
    <button class="btn-underline">Read manifesto →</button>
  </div>
</section>
```

```css
.editorial-hero {
  background: #fff;
  padding: 120px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 40px;
  min-height: 80vh;
}
.editorial-display {
  font-family: 'Avec Sharp', 'Playfair Display', serif;
  font-size: clamp(80px, 22vw, 251px);
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: 2.51px;
  color: #000;
  margin: 0;
}
.editorial-sub {
  font-family: 'Onsite', system-ui, sans-serif;
  font-size: 26px;
  line-height: 1.13;
  letter-spacing: 0.26px;
  max-width: 600px;
  color: #000;
  margin: 0;
}
.btn-underline {
  background: transparent;
  color: #000;
  border: none;
  border-bottom: 1px solid #000;
  padding: 0;
  font-family: 'Onsite', sans-serif;
  font-size: 16px;
  cursor: pointer;
}
```

### 16.2 Specimen Showcase Card (Pangram Pangram)

```html
<article class="specimen-card">
  <h3 class="specimen-display" style="font-family: 'Neue Montreal'; font-weight: 600;">Aa</h3>
  <div class="specimen-meta">
    <span>Neue Montreal</span>
    <span class="badge-update">Update</span>
  </div>
  <p class="specimen-info">12 weights · Variable · 14 styles</p>
  <button class="btn-outlined">Try this font</button>
</article>
```

```css
.specimen-card {
  background: #ededed;
  border-radius: 20px;
  padding: 25.72px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Neue Montreal', Inter, sans-serif;
  color: #000;
}
.specimen-display {
  font-size: 103px;
  line-height: 1;
  font-weight: 600;
  margin: 0;
  letter-spacing: normal;
}
.specimen-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666666;
}
.badge-update {
  background: #ffb700;
  color: #000;
  border-radius: 999px;
  padding: 4px 11.65px;
  font-size: 12px;
}
.btn-outlined {
  background: transparent;
  color: #000;
  border: 1px solid #000;
  border-radius: 20px;
  padding: 7.65px 22.95px;
  font-family: inherit;
  cursor: pointer;
  align-self: flex-start;
}
```

### 16.3 Risograph Product Card (Fidèle Editions)

```html
<article class="riso-card">
  <div class="riso-photo">
    <img src="/print.webp" alt="Risograph print" />
  </div>
  <h3 class="riso-title">Rainbow</h3>
  <p class="riso-meta">Risograph print · A3 · €27,00</p>
</article>
```

```css
.riso-card {
  background: transparent;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: 'BaselGrotesk Book', Inter, sans-serif;
  color: #121212;
}
.riso-photo {
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 0;
}
.riso-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.riso-title {
  font-size: 14px;
  letter-spacing: -0.0490em;
  margin: 0;
}
.riso-meta {
  font-size: 13px;
  color: #1664eb;   /* Printmaker Blue accents */
  margin: 0;
}
```

### 16.4 Standards Hero with Locked Tracking

```html
<section class="std-hero">
  <h1 class="std-display">Engineered for impact.</h1>
  <p class="std-sub">A precision blueprint for clarity.</p>
  <button class="std-cta">Get started</button>
</section>
```

```css
.std-hero {
  background: #eaeaea;
  padding: 80px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 24px;
}
.std-display {
  font-family: 'Soehne', system-ui, sans-serif;
  font-size: 52px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.0100em;
  color: #000;
  margin: 0;
  font-feature-settings: "dlig" on, "liga" on;
}
.std-sub {
  font-family: 'Soehne', sans-serif;
  font-size: 20px;
  line-height: 1.27;
  letter-spacing: -0.0100em;
  color: #000;
  max-width: 500px;
  margin: 0;
}
.std-cta {
  background: #ff2e00;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 13.3px 13.3px;
  font-family: 'Soehne', sans-serif;
  font-weight: 400;
  letter-spacing: -0.0100em;
  cursor: pointer;
}
```

### 16.5 UNVEIL® Diagonal Image Stack

```html
<section class="unveil-stack">
  <img src="/img1.jpg" class="diag-img diag-1" alt="" />
  <img src="/img2.jpg" class="diag-img diag-2" alt="" />
  <img src="/img3.jpg" class="diag-img diag-3" alt="" />
  <nav class="unveil-nav">
    <a class="unveil-link">UNVEIL® Projects</a>
    <a class="unveil-link">Research</a>
    <a class="unveil-link">Studio</a>
  </nav>
</section>
```

```css
.unveil-stack {
  position: relative;
  height: 100vh;
  background: #fff;
  overflow: hidden;
}
.diag-img {
  position: absolute;
  width: 50vw;
  height: 70vh;
  object-fit: cover;
  border-radius: 0;
  opacity: 0.65;
  filter: saturate(0.6);
  transition: opacity 600ms ease, transform 600ms ease, filter 600ms ease;
}
.diag-img:hover {
  opacity: 1;
  filter: saturate(1);
}
.diag-1 { top: 8%;  left: 5%;  transform: rotate(-3deg); }
.diag-2 { top: 22%; left: 32%; transform: rotate(2deg); }
.diag-3 { top: 38%; left: 55%; transform: rotate(-1deg); }
.unveil-nav {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.unveil-link {
  font-family: 'nb_international_proregular', Inter, sans-serif;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: 0.304px;
  color: #000;
  text-decoration: none;
}
```

---

<a id="checklist"></a>
## 17. VALIDATION CHECKLIST

### 17.1 Color Audit
- [ ] Page bg is **pure white**, **warm cream**, or **cool ice gray**
- [ ] Primary text is **pure black or near-black** (#000-#121212)
- [ ] At most ONE chromatic accent (or pure achromatic)
- [ ] Status colors only as 999px pill badges
- [ ] No Tailwind 500-tier defaults

### 17.2 Typography Audit
- [ ] Display size ≥ 50px (mobile) / 62-251px (desktop)
- [ ] Custom font specified (not Inter as everything)
- [ ] Negative tracking on display (-0.02 to -0.04em)
- [ ] At most 3 weights total (often just 1-2)
- [ ] Letter-spacing tuned per size (or LOCKED to single value)

### 17.3 Geometry Audit
- [ ] Border-radius commits to a single Serif Display stance
- [ ] **No drop shadows anywhere**
- [ ] Section gap 42-120px (architectural compact OR editorial spacious)
- [ ] Element gap ≤ 12px

### 17.4 Layout Audit
- [ ] Hero is centered with massive display headline
- [ ] No "Trusted by" logo bar
- [ ] No 3-column "Features" template grid
- [ ] Specimen showcase grid (foundries) OR diagonal photo stack (galleries)

### 17.5 Imagery Audit
- [ ] No stock photos
- [ ] Either: no imagery (pure type), OR full-bleed product, OR diagonal layered
- [ ] Outlined monochrome icons in primary text color

### 17.6 Component Audit
- [ ] Buttons: filled-dark OR underline-ghost OR outlined
- [ ] Cards: transparent OR soft-pill (20px) OR sharp print (0px)
- [ ] No "shadcn-default" cards with shadow + 12px radius
- [ ] Hairline 1px borders for separation

### 17.7 Accessibility Audit
- [ ] Black-on-warm-cream passes AAA
- [ ] Vivid accent button passes AA contrast
- [ ] Focus states visible
- [ ] Reduced motion fallback

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

<a id="cheatsheet"></a>
## 18. QUICK REFERENCE

### 18.1 30-Second Decision

```
PROMPT:                                  PICK:
"type foundry / specimen showcase"   →  Sociotype OR Pangram Pangram
"independent publishing / print"     →  Fidèle Editions
"premium SaaS / authority brand"     →  Standards
"architecture / art / gallery"       →  UNVEIL®
"editorial portfolio / studio"       →  Sociotype
```

### 18.2 30-Second Token Set (Universal Serif Display)

```css
:root {
  /* Pick a canvas */
  --bg: #ffffff;          /* pure white OR */
  --bg: #f8f7ef;          /* warm cream OR */
  --bg: #eaeaea;          /* cool ice */

  /* Tinted near-black */
  --text: #000000;        /* OR #121212 */

  /* ONE accent (or none) */
  --accent: #ff2e00;      /* Action Orange OR */
  --accent: #1664eb;      /* Printmaker Blue OR */
  --accent: none;          /* pure achromatic */

  /* Custom font */
  --font-primary: 'Soehne', sans-serif;     /* OR Neue Montreal, Onsite, BaselGrotesk */
  --font-display: 'Avec Sharp', serif;       /* OR Neue Montreal, OTMagister */

  /* Pick a radius stance */
  --radius: 0;             /* sharp editorial OR */
  --radius: 6px;           /* uniform soft OR */
  --radius: 20px;          /* uniform pill */

  /* Generous OR compact */
  --section-gap: 92px;     /* editorial OR */
  --section-gap: 42px;     /* compact */
  --element-gap: 8px;
}
```

### 18.3 Common Tasks

```
TASK:                       RECIPE:
"Editorial display"      →  Custom font 60-251px + tight tracking + 0px or 20px radius
"Specimen card"          →  Soft 20px card OR transparent, 103px display font + meta
"Print product card"     →  Transparent + unmasked photo + simple title
"Underline ghost"        →  Transparent + currentColor 1px bottom border
"Status badge"           →  999px pill + 1 vivid accent + black text
"Hairline divider"       →  1px solid #d6d6d6 (or similar)
"Diagonal photo stack"   →  Layered absolute imgs, opacity 0.65, rotate ±3deg
```

---

## 19. APPENDIX: SOURCE SITES

| # | Site | URL | Theme | Archetype |
|---|------|-----|-------|-----------|
| 1 | Sociotype | socio-type.com | light | Editorial White Canvas |
| 2 | Fidèle Editions | fidele-editions.com | light | Risographic Workshop |
| 3 | Pangram Pangram | pangrampangram.com | light | Bold Type Foundry |
| 4 | Standards | standards.site | light | Precision Blueprint |
| 5 | UNVEIL® | unveil.fr | light | Architectural Blueprint |

Each archetype's full DESIGN.md is preserved in `../../raw/serif-display/0X-<site>.md`.

---

## 20. VERSIONING

- **v1.0.0** (May 2026): Initial 5-site corpus from Refero "serif+display" tag.

---

**END OF SKILL FILE**

> Serif Display is **typography-first design**. The display headline IS the visual identity. Pick an archetype and commit fully to its restraint discipline.


## Supplemental Depth Pass 1: Serif Display Production Expansion

### 1.1 Strategic Role

Serif display design works when typography becomes architecture: scale, rhythm, columns, contrast, and whitespace create the identity.

The intended feeling is editorial, elegant, literary, premium, expressive. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 1.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: accent color is optional; typographic contrast, image choice, and editorial spacing should do most of the work.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 1.3 Layout Discipline

Strong Serif Display layouts should:

- establish one dominant section rhythm
- make the primary action obvious
- keep repeated modules aligned
- prevent decorative elements from touching important text
- reserve dense areas for content that truly needs density
- preserve readable text lengths
- adapt mobile layout intentionally rather than merely stacking everything

When a section feels weak, first adjust type scale, spacing, and content order. Add visual effects only after the structure is clear.

### 1.4 Component Discipline

Required component states:

- default
- hover
- focus-visible
- active or selected
- loading
- disabled
- empty
- error
- success

Every component should express Serif Display in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 1.5 Content Discipline

Good copy for Serif Display is specific, short, and matched to the visual energy.

Use:

- concrete nouns
- clear verbs
- direct CTA labels
- honest helper text
- short section headings
- source-specific product details

Avoid:

- vague inspiration
- decorative feature names
- excessive adjectives
- UX instructions that compensate for unclear UI
- humor or drama that makes serious actions less clear

### 1.6 Accessibility Discipline

Accessibility checks:

- body text has enough contrast on the actual background
- links are visually distinguishable
- focus state is visible without hover
- state is not communicated by color alone
- motion respects reduced-motion preferences
- text does not overlap imagery
- mobile controls have usable hit areas
- error states include readable messages

If accessibility conflicts with the aesthetic, refine the aesthetic. Do not lower the interface quality by hiding important information.

### 1.7 Review Questions

- Does the page still feel like Serif Display with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid unreadable ornate headings, too many typefaces, weak body copy, fake magazine layouts, and decorative serif usage without hierarchy.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 1.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Serif Display system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 2: Serif Display Production Expansion

### 2.1 Strategic Role

Serif display design works when typography becomes architecture: scale, rhythm, columns, contrast, and whitespace create the identity.

The intended feeling is editorial, elegant, literary, premium, expressive. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 2.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: accent color is optional; typographic contrast, image choice, and editorial spacing should do most of the work.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 2.3 Layout Discipline

Strong Serif Display layouts should:

- establish one dominant section rhythm
- make the primary action obvious
- keep repeated modules aligned
- prevent decorative elements from touching important text
- reserve dense areas for content that truly needs density
- preserve readable text lengths
- adapt mobile layout intentionally rather than merely stacking everything

When a section feels weak, first adjust type scale, spacing, and content order. Add visual effects only after the structure is clear.

### 2.4 Component Discipline

Required component states:

- default
- hover
- focus-visible
- active or selected
- loading
- disabled
- empty
- error
- success

Every component should express Serif Display in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 2.5 Content Discipline

Good copy for Serif Display is specific, short, and matched to the visual energy.

Use:

- concrete nouns
- clear verbs
- direct CTA labels
- honest helper text
- short section headings
- source-specific product details

Avoid:

- vague inspiration
- decorative feature names
- excessive adjectives
- UX instructions that compensate for unclear UI
- humor or drama that makes serious actions less clear

### 2.6 Accessibility Discipline

Accessibility checks:

- body text has enough contrast on the actual background
- links are visually distinguishable
- focus state is visible without hover
- state is not communicated by color alone
- motion respects reduced-motion preferences
- text does not overlap imagery
- mobile controls have usable hit areas
- error states include readable messages

If accessibility conflicts with the aesthetic, refine the aesthetic. Do not lower the interface quality by hiding important information.

### 2.7 Review Questions

- Does the page still feel like Serif Display with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid unreadable ornate headings, too many typefaces, weak body copy, fake magazine layouts, and decorative serif usage without hierarchy.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 2.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Serif Display system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 3: Serif Display Production Expansion

### 3.1 Strategic Role

Serif display design works when typography becomes architecture: scale, rhythm, columns, contrast, and whitespace create the identity.

The intended feeling is editorial, elegant, literary, premium, expressive. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 3.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: accent color is optional; typographic contrast, image choice, and editorial spacing should do most of the work.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 3.3 Layout Discipline

Strong Serif Display layouts should:

- establish one dominant section rhythm
- make the primary action obvious
- keep repeated modules aligned
- prevent decorative elements from touching important text
- reserve dense areas for content that truly needs density
- preserve readable text lengths
- adapt mobile layout intentionally rather than merely stacking everything

When a section feels weak, first adjust type scale, spacing, and content order. Add visual effects only after the structure is clear.

### 3.4 Component Discipline

Required component states:

- default
- hover
- focus-visible
- active or selected
- loading
- disabled
- empty
- error
- success

Every component should express Serif Display in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 3.5 Content Discipline

Good copy for Serif Display is specific, short, and matched to the visual energy.

Use:

- concrete nouns
- clear verbs
- direct CTA labels
- honest helper text
- short section headings
- source-specific product details

Avoid:

- vague inspiration
- decorative feature names
- excessive adjectives
- UX instructions that compensate for unclear UI
- humor or drama that makes serious actions less clear

### 3.6 Accessibility Discipline

Accessibility checks:

- body text has enough contrast on the actual background
- links are visually distinguishable
- focus state is visible without hover
- state is not communicated by color alone
- motion respects reduced-motion preferences
- text does not overlap imagery
- mobile controls have usable hit areas
- error states include readable messages

If accessibility conflicts with the aesthetic, refine the aesthetic. Do not lower the interface quality by hiding important information.

### 3.7 Review Questions

- Does the page still feel like Serif Display with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid unreadable ornate headings, too many typefaces, weak body copy, fake magazine layouts, and decorative serif usage without hierarchy.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 3.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Serif Display system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 4: Serif Display Production Expansion

### 4.1 Strategic Role

Serif display design works when typography becomes architecture: scale, rhythm, columns, contrast, and whitespace create the identity.

The intended feeling is editorial, elegant, literary, premium, expressive. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 4.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: accent color is optional; typographic contrast, image choice, and editorial spacing should do most of the work.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 4.3 Layout Discipline

Strong Serif Display layouts should:

- establish one dominant section rhythm
- make the primary action obvious
- keep repeated modules aligned
- prevent decorative elements from touching important text
- reserve dense areas for content that truly needs density
- preserve readable text lengths
- adapt mobile layout intentionally rather than merely stacking everything

When a section feels weak, first adjust type scale, spacing, and content order. Add visual effects only after the structure is clear.

### 4.4 Component Discipline

Required component states:

- default
- hover
- focus-visible
- active or selected
- loading
- disabled
- empty
- error
- success

Every component should express Serif Display in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 4.5 Content Discipline

Good copy for Serif Display is specific, short, and matched to the visual energy.

Use:

- concrete nouns
- clear verbs
- direct CTA labels
- honest helper text
- short section headings
- source-specific product details

Avoid:

- vague inspiration
- decorative feature names
- excessive adjectives
- UX instructions that compensate for unclear UI
- humor or drama that makes serious actions less clear

### 4.6 Accessibility Discipline

Accessibility checks:

- body text has enough contrast on the actual background
- links are visually distinguishable
- focus state is visible without hover
- state is not communicated by color alone
- motion respects reduced-motion preferences
- text does not overlap imagery
- mobile controls have usable hit areas
- error states include readable messages

If accessibility conflicts with the aesthetic, refine the aesthetic. Do not lower the interface quality by hiding important information.

### 4.7 Review Questions

- Does the page still feel like Serif Display with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid unreadable ornate headings, too many typefaces, weak body copy, fake magazine layouts, and decorative serif usage without hierarchy.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 4.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Serif Display system should feel rich because it is disciplined, not because it has more effects.
