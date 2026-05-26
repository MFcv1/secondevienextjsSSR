---
name: pastel
description: |
  Pastel aesthetic for the web â€” soft creamy off-white backgrounds, restrained-but-warm
  palettes, single-typeface or curated-pairing typography, organic shapes balanced with
  intentional restraint. Use when user requests "soft", "warm", "calm", "approachable",
  "creator-friendly", "wellness", "DTC food/beverage", or "playful pastel SaaS" sites.
  Anti-slop: rejects pure-white SaaS templates, generic Tailwind gray scales, and
  generic Material rounded cards.
version: 1.0.0
category: design-taste
tags: [pastel, soft, warm, creamy-canvas, wellness, dtc-food, creator-saas, light-ui, multi-pastel-accents]
sources:
  - usepastel.com
  - palette.supply
  - takearecess.com
  - graza.co
  - podcorn.com
  - podia.com
---

# Pastel â€” Design Skill

> **A skill for building soft, warm, light-canvas websites that feel curated and human. Distilled from 6 award-winning Pastel-tagged sites curated by Refero. Pastel here is NOT pastel rainbows â€” it's a discipline of warm off-whites + ONE saturated accent + curated typography.**

---

## TABLE OF CONTENTS

1. [Philosophy: What Makes a Site "Pastel"?](#philosophy)
2. [The 6 Pastel Archetypes](#archetypes)
3. [Color Systems](#color)
4. [Typography Systems](#typography)
5. [Spacing & Geometry](#spacing)
6. [Border Radius Patterns](#radius)
7. [Surface & Layering](#surface)
8. [Component Patterns](#components)
9. [Layout Patterns](#layout)
10. [Imagery & Decoration](#imagery)
11. [Motion (Restrained)](#motion)
12. [Anti-Slop Rules](#anti-slop)
13. [Decision Tree: Pick Your Archetype](#decision)
14. [CSS Starter Templates](#templates)
15. [Tailwind v4 Configurations](#tailwind)
16. [Component Recipes](#recipes)
17. [Validation Checklist](#checklist)
18. [Quick Reference](#cheatsheet)

---

<a id="philosophy"></a>
## 1. PHILOSOPHY: What Makes a Site "Pastel"?

"Pastel" in the Refero corpus is **not** pastel-rainbow Easter colors. It is the discipline of:

### 1.1 Warm Off-White Canvas (Never Pure White)
Every Pastel site replaces `#ffffff` as page background with a **warm tinted off-white**:
- Pastel: `#f5f5f4` (cool ghost)
- Palette Supply: `#f2f0e9` (cream canvas)
- Recess: `#fff` (pure, but with gradient overlays)
- GRAZA: `#fff4ec` (buttermilk)
- Podcorn: `#fff4f2` (coral pink)
- Podia: `#f5f5f5` (warm sand)

**Rule:** Page background must be tinted (warm or cool), never raw `#ffffff`. The tint is the foundation of the "pastel" feeling.

### 1.2 ONE Saturated Brand Accent
Despite being called "pastel", every site uses **one fully saturated color** as the action accent:
- Pastel: `#165dfb` (vivid blue)
- Palette Supply: `#3051a8` (Indigo Punch)
- Recess: `#a2b0ff` (Lavender Mist) + `#3252f4` (Vivid Cobalt)
- GRAZA: `#d1e030` (Zest Yellow)
- Podcorn: `#fc736c` (Firebrick Red)
- Podia: `#06040e` (Ink Black, near-black)

The pastel-ness comes from the canvas. The accent is **intentionally bold** to provide contrast.

### 1.3 Decorative Multi-Pastel (Optional)
Some Pastel sites layer additional muted decorative colors (Palette Supply's earth tones, Recess's lavender/coral gradients, Podia's feature card colors). These are **decorative bg only** â€” never CTAs, never body text.

### 1.4 Generous Spacing as the "Soft" Signal
Every Pastel site is "spacious" or has 40-100px section gaps. Pastel feels soft because there's so much breathing room.

### 1.5 Bipolar Radius Choices (More Than Motion)
Pastel sites take stronger radius positions than Motion sites:
- Pastel pill (8.8px / 10px / 11px) â€” Pastel, GRAZA, Heavyweight-style
- Extreme pill (100px / 56px / 90px) â€” Palette Supply, Podia, Moving Parts
- Sharp 0px (intentional contrast) â€” Recess, Podcorn

### 1.6 Imagery is Lifestyle or Illustration
- Lifestyle photography (light, warm, curated): GRAZA, Recess, Podia
- Abstract decorative shapes: Palette Supply
- Line illustrations: Podcorn
- Product UI screenshots: Pastel

Never the cold "stock SaaS hero" of generic templates.

### 1.7 Typography: One Font OR Curated Pair
- Single typeface, multiple weights: Pastel (Figtree), Recess (Sharp Grotesk), Podia (StabilGrotesk)
- Curated pairing of contrasts: GRAZA (Garamond + Typewriter), Podcorn (Gilroy + Georgia), Palette Supply (PPSupply + esbuild)

The pastel feel comes from **typographic warmth** â€” humanist sans-serifs, light weights (100, 300), or classic serifs.

---

<a id="archetypes"></a>
## 2. THE 6 PASTEL ARCHETYPES

### 2.1 ARCHITECTURAL BLUEPRINT (Pastel)
**Vibe:** Calm Pastel SaaS, single typeface, single vibrant accent
**Theme:** light
**Palette:** 5 grays + 1 vivid blue (#165dfb)
**Typography:** Figtree (single font, 400/500/600)
**Radius:** 8.8px default (decimal precision!), 10px buttons, 120px round
**Section gap:** 68-70px (very generous)
**When to use:** Calm tools, design SaaS, productivity, wellness apps

### 2.2 WARM CREATIVE TOOLKIT (Palette Supply)
**Vibe:** Earth-toned palette, custom fonts, 100px pill buttons
**Theme:** light
**Palette:** Warm cream (#f2f0e9) + 6 earth-tone decorative + 1 Indigo Punch CTA
**Typography:** PPSupply (custom mono-feeling, weights 100/300/400) + esbuild display + PPSupplyMonoLight
**Radius:** 100px pills on inputs/buttons, 12px cards, 1000px tags
**Section gap:** 72px
**When to use:** Creative tools, design resources, agencies, portfolios

### 2.3 PASTEL CLOUD DREAMSCAPE (Recess)
**Vibe:** Sky-glow gradients, sharp corners, violet+lavender palette
**Theme:** light
**Palette:** 3 sky gradients (cyanâ†’violetâ†’rose) + violets + 1 candy-red alert
**Typography:** Sharp Grotesk Web (single font, 400/500/700)
**Radius:** **0px** (sharp contrast to organic forms!), 50% icon circles
**Section gap:** 48-80px
**When to use:** Wellness DTC, beverages, lifestyle brands, calm aspirational

### 2.4 ARTISANAL PROVISIONS (GRAZA)
**Vibe:** Buttermilk warmth + classic serif + typewriter mono
**Theme:** light
**Palette:** Buttermilk creams + food greens/yellows (Grove Green text + Zest Yellow CTA)
**Typography:** ITC Garamond Condensed (display) + GT Alpina Typewriter (body) + Apercu (badges)
**Radius:** 8/10px buttons, **20px images** (signature soft photo cards), 9999px badges
**Layout:** **Max-width 1440px** (constrained)
**When to use:** Food/DTC, artisanal brands, gourmet products, kitchen/lifestyle

### 2.5 SOFT-EDGED DIGITAL CANVAS (Podcorn)
**Vibe:** Coral-pink + indigo + sharp corners + serif accent
**Theme:** light
**Palette:** Canvas Pink #fff4f2 + Inkwell Indigo + Firebrick Red + decorative coral
**Typography:** Gilroy (-0.1870em tracking!) + Georgia for headings
**Radius:** **0px** everywhere except modals (8px)
**Layout:** **Max-width 1105px** (constrained)
**Section gap:** 75px
**When to use:** SaaS tools, marketplaces, podcasting/content platforms

### 2.6 PLAYFUL MARKET STALL (Podia)
**Vibe:** Multi-pastel feature cards, single font, extreme card pills
**Theme:** light
**Palette:** Warm Sand bg + 4 pastel feature card bg (Sky/Sunset/Lavender/Plum)
**Typography:** StabilGrotesk single font, 10 sizes with progressive negative tracking
**Radius:** **56px cards** (signature large pill), 16px buttons, 8px links
**Section gap:** 40px
**When to use:** Creator economy SaaS, courses, communities, multi-feature products

---

<a id="color"></a>
## 3. COLOR SYSTEMS

### 3.1 The Warm Off-White Canvas Hierarchy

| Site | Page bg | Cool/Warm | Hex |
|------|---------|-----------|-----|
| Pastel | Ghost White | Cool (slight warm) | `#f5f5f4` |
| Palette Supply | Canvas | **Warm cream** | `#f2f0e9` |
| Recess | Pure White (with gradients) | Neutral | `#ffffff` |
| GRAZA | Buttermilk | **Warm cream** | `#fff4ec` |
| Podcorn | Canvas Pink | **Warm pink** | `#fff4f2` |
| Podia | Warm Sand | Cool-warm neutral | `#f5f5f5` |

**Rule:** Pick a warm tint over pure white. The tint defines the brand's "temperature".

### 3.2 The Single-CTA-Color Rule (Pastel-Specific)

Pastel sites are **stricter** about single-accent than Motion sites â€” the soft canvas demands the CTA stand out:

| Site | CTA | When |
|------|-----|------|
| Pastel | `#165dfb` Deep Sea Blue | Filled button bg |
| Palette Supply | `#3051a8` Indigo Punch | Filled pill button bg |
| Recess | `#a2b0ff` Lavender Mist (with `#25385b` text) | Filled button bg |
| GRAZA | `#d1e030` Zest Yellow (with `#3c4422` text) | Filled button bg |
| Podcorn | `#090335` Inkwell Indigo (with `#e1edf2` text) | Filled button bg |
| Podia | `#06040e` Ink Black (with `#e1edf2` text) | Filled button bg |

**Pattern:** The CTA can be vivid (blue, indigo, yellow) OR ultra-dark (near-black). The choice depends on whether the canvas needs vibrancy injection or contrast anchoring.

### 3.3 Decorative Multi-Pastel Layer (Optional)

When sites use multiple pastel colors, they're for **decorative card backgrounds**, never actions:

```css
/* Palette Supply earth tones */
--color-sage-mist: #d7d7c8;
--color-deep-forest: #3f593d;
--color-desert-rose: #e0b9b1;
--color-terracotta: #863a29;
--color-harvest-gold: #e4b357;

/* Podia feature cards */
--color-sky-blue: #a5c8d8;
--color-sunset-orange: #e39a4d;
--color-lavender-mist: #cbb0eb;
--color-rich-plum: #1f1738;

/* Recess sky glow */
--gradient-sky-glow-a: linear-gradient(rgb(236,245,246), rgb(235,235,253), rgb(251,206,205));
```

These are **decorative bg layers** â€” they do not appear as button colors, body text, or borders.

### 3.4 Text Color: NEVER Pure Black

Every Pastel site avoids `#000000` for primary text. They use **near-blacks with hue tint**:

| Site | Text color | Hex |
|------|-----------|-----|
| Pastel | Midnight Ink | `#111111` |
| Palette Supply | Graphite | `#141212` |
| Recess | Sky Violet | `#25385b` (violet!) |
| GRAZA | Grove Green | `#3c4422` (green!) |
| Podcorn | Inkwell Indigo | `#090335` (indigo!) |
| Podia | Ink Black | `#06040e` (near-black with violet) |

**Rule:** Primary text uses a tinted near-black (slight violet/green/blue/indigo undertone). This is a critical Pastel signal â€” pure `#000` reads as too cold.

### 3.5 Color Anti-Slop

âŒ **REJECT** for Pastel:
```css
/* The "default Tailwind" pastel that's not actually warm */
background: #f9fafb;
color: #111827;
--accent: #3b82f6;
```

These are *cool* gray-tinted. Pastel needs warm or distinct hue tint.

âœ… **USE** documented Pastel canvases:
```css
background: #fff4ec;  /* GRAZA buttermilk warm */
background: #fff4f2;  /* Podcorn coral pink */
background: #f2f0e9;  /* Palette Supply cream */
color: #25385b;       /* Recess violet near-black */
--accent: #d1e030;    /* GRAZA zest yellow */
```

---

<a id="typography"></a>
## 4. TYPOGRAPHY SYSTEMS

### 4.1 Single Font OR Curated Pair

| Site | Strategy | Fonts |
|------|----------|-------|
| Pastel | Single | Figtree (400/500/600) |
| Palette Supply | Curated pair (display+body+mono) | esbuild + PPSupply + PPSupplyMonoLight |
| Recess | Single | Sharp Grotesk Web (400/500/700) |
| GRAZA | Curated pair (serif + mono) | ITC Garamond Condensed + GT Alpina Typewriter + Apercu badges |
| Podcorn | Curated pair (sans + serif) | Gilroy + Georgia |
| Podia | Single | StabilGrotesk (400/500/700) |

**Rule:** Use ONE typeface with multiple weights, OR pair a display serif/typewriter with a body sans. Never use 4+ unrelated fonts.

### 4.2 Display Sizes

Pastel display sizes are **smaller than Motion**:
- Pastel: 58px display
- Palette Supply: 64px heading
- Recess: 60px display
- GRAZA: **120px** (largest, classic Garamond)
- Podcorn: 40px heading-lg (smallest!)
- Podia: 60px display

**Pattern:** 40-120px range, often centered on 60px. Don't go smaller than 40px for "display".

### 4.3 Letter-Spacing Patterns

Pastel sites use **subtle negative tracking** (less extreme than Motion):

| Site | Display tracking | Body tracking |
|------|------------------|---------------|
| Pastel | -0.93px @ 58px (-0.0160em) | -0.22px (-0.014em) |
| Palette Supply | -0.03em @ 64px | -0.04em @ 13px, 0.02em @ 15px |
| Recess | normal | normal |
| GRAZA | -0.031em, -0.03em, -0.021em (per size!) | normal |
| Podcorn | normal | -0.1870em (extreme!) |
| Podia | -1.8px @ 60px (-0.03em) | -0.48px @ 16px (-0.03em) |

**Pattern:** Display gets -0.02em to -0.03em. Body gets -0.01em to -0.02em (or none if serif).

### 4.4 Light Weights for Airiness

Multiple Pastel sites use weight 100, 200, 300:
- Palette Supply: PPSupply weights **100, 300, 400** (no bold!)
- Recess: 400 body, 500 subhead, 700 hero (standard)
- Podcorn: Gilroy 400-700 (full range)

**Use Case:** Light weights (100-300) reinforce the "airy" feeling. Reserve 700 for hero only.

### 4.5 Serif for Editorial Pastel

Two sites use serif headlines:
- GRAZA: ITC Garamond Condensed (classic warm serif)
- Podcorn: Georgia (familiar humanist)

A serif heading on a creamy bg = artisanal, editorial, warm. Pair with sans-serif body.

### 4.6 OpenType Features

- Palette Supply: **`"ss02"` enabled** on PPSupply (subtle character variant)
- Other Pastel sites: minimal OpenType use

### 4.7 Type Scale Patterns

| Site | Base | Ratio |
|------|------|-------|
| Pastel | 14px | 1.2 (Minor Third) |
| Palette Supply | 16px | varies |
| Recess | 16px | 1.2 |
| GRAZA | 20px | 1.2 |
| Podcorn | 16px | 1.125 |
| Podia | 15px | 1.2 |

**Pattern:** Bases are larger (15-20px) than Motion (12-16px). Pastel privileges readability.

---

<a id="spacing"></a>
## 5. SPACING & GEOMETRY

### 5.1 Spacious is the Default

Every Pastel site marks density as "spacious" or "comfortable" with generous gaps:

| Site | Density | Section gap |
|------|---------|-------------|
| Pastel | spacious | 68-70px |
| Palette Supply | comfortable | 72px |
| Recess | spacious | 48-80px |
| GRAZA | spacious | 24-35px multiples |
| Podcorn | comfortable | 75px |
| Podia | comfortable | 40px |

**Rule:** Section gap â‰¥ 40px minimum. 60-80px is the sweet spot.

### 5.2 Card Padding Variance

| Site | Card padding |
|------|--------------|
| Pastel | 0px (transparent cards!) |
| Palette Supply | 20px (or 64px for big sage cards) |
| Recess | 28px (typical) |
| GRAZA | varies (35px common) |
| Podcorn | **75/55px** (very generous) |
| Podia | 16px |

### 5.3 Element Gap

| Site | Element gap |
|------|-------------|
| Pastel | varies (12-30px) |
| Palette Supply | 8px |
| Recess | 8px |
| GRAZA | varies |
| Podcorn | 20px |
| Podia | 16px |

**Rule:** Element gap 8-20px. Smaller than Motion (which can go to 0).

### 5.4 Page Max-Width (Some Sites Constrain!)

Unlike Motion sites (which are full-bleed), some Pastel sites **use max-width**:
- Pastel: implicit
- Palette Supply: full-bleed (no max)
- Recess: full-bleed
- GRAZA: **1440px max**
- Podcorn: **1105px max**
- Podia: implicit max-width contained at top

**Rule:** Pastel can be full-bleed OR contained. If contained, 1100-1440px range.

---

<a id="radius"></a>
## 6. BORDER RADIUS PATTERNS

### 6.1 Three Radius Stances in Pastel

#### Stance 1 â€” Soft Uniform (Pastel-style)
- Pastel: 8.8px default, 10px buttons
- Heavyweight (motion): 11px everywhere
- Friendly soft uniform value

#### Stance 2 â€” Extreme Pill (Palette Supply, Podia)
- Palette Supply: 100px buttons/inputs, 12px cards, 1000px tags
- Podia: **56px cards**, 16px buttons
- The "candy" pill effect

#### Stance 3 â€” Sharp Contrast (Recess, Podcorn)
- Recess: 0px everywhere except 50% icon circles
- Podcorn: 0px everywhere except 8px modals
- "Sharp pastel" â€” intentional contrast to soft canvas

### 6.2 The Decimal-Radius Pattern

Pastel introduces strange decimal radii:
- Pastel: `8.8px` (signature)
- Moving Parts (motion): `90.3833px`, `106.333px`

These look like measurement errors but are deliberate. They visually distinguish from generic 4/8/12 cascade.

### 6.3 Multi-Tier Pastel Radius

Multi-tier patterns (different radius per element type):

```css
/* Pastel: */
--radius-tags: 4px;
--radius-default: 8.8px;
--radius-buttons: 10px;
--radius-prominent: 15px;
--radius-round: 120px;

/* GRAZA: */
--radius-inputs: 8px;
--radius-buttons: 10px;
--radius-default: 10px;
--radius-images: 20px;
--radius-badges: 9999px;

/* Podia: */
--radius-links: 8px;
--radius-buttons: 16px;
--radius-misc: 24px;
--radius-cards: 56px;
```

---

<a id="surface"></a>
## 7. SURFACE & LAYERING

### 7.1 The 2-Tier Surface (Most Common)

```css
/* Pattern: Pastel surface stack */
:root {
  --surface-0: #fff4ec;  /* warm canvas (page bg) */
  --surface-1: #ffffff;  /* cards, elevated */
}
```

Used by Pastel, GRAZA, Podcorn.

### 7.2 The 3-Tier Surface

```css
/* Pattern: with decorative tier */
:root {
  --surface-0: #f2f0e9;  /* canvas */
  --surface-1: #ffffff;  /* cards */
  --surface-2: #d7d7c8;  /* sage mist (decorative section) */
}
```

Used by Palette Supply, Podia, Recess (with gradients as a 4th tier).

### 7.3 No Heavy Shadows

Pastel sites avoid drop shadows almost entirely:
- Recess explicitly: "do not introduce strong, dark shadows"
- Pastel: "refrain from heavy shadows or complex gradients"
- Palette Supply: "minimal shadows"
- Podcorn: "rely on flat surfaces and clear color contrasts"
- Podia: "rely on distinct background colors and rounded corners for visual separation"

**Rule:** Use color-stacking (layered tinted surfaces) for depth. Reserve shadows for hover/active states only.

### 7.4 Gradient Backgrounds

Recess uses gradient bg for hero impact:
```css
background: linear-gradient(rgb(236, 245, 246), rgb(235, 235, 253), rgb(251, 206, 205));
/* cyan â†’ soft violet â†’ warm rose */
```

Subtle, ambient, never loud.

---

<a id="components"></a>
## 8. COMPONENT PATTERNS

### 8.1 The Pastel Filled Button

```css
/* Pattern A â€” Vivid CTA on tinted canvas (Pastel, GRAZA) */
.btn-cta {
  background: var(--color-cta);          /* the ONE saturated color */
  color: var(--color-cta-text);          /* often dark, not white */
  border: 1px solid var(--color-cta-text);
  border-radius: 10px;                   /* or 100px for pill, 0px for sharp */
  padding: 12-25px 16-72px;              /* generous */
  font-family: var(--font-primary);
  font-weight: 500;
}

/* Specific recipes */
/* Pastel */
.cta-pastel {
  background: #165dfb; color: #ffffff;
  border-radius: 10px; padding: 11px 22px;
}
/* GRAZA */
.cta-graza {
  background: #d1e030; color: #3c4422;
  border-radius: 10px; padding: 24px 35px;
}
/* Recess */
.cta-recess {
  background: #a2b0ff; color: #25385b; border: 1px solid #25385b;
  border-radius: 0; padding: 24px 36px;
}
/* Palette Supply */
.cta-palette {
  background: #3051a8; color: #ffffff; border: 1px solid #ffffff;
  border-radius: 100px; padding: 14px 72px;
}
```

### 8.2 The Ghost Button

```css
/* Pattern: Outline button matching site's radius rule */
.ghost-btn {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
  border-radius: var(--radius-buttons);
  padding: 8-16px 16-32px;
  font-family: var(--font-primary);
  cursor: pointer;
}

/* Variant: subtle dark border (Pastel-friendly) */
.ghost-btn-dark {
  background: var(--surface-1);
  color: var(--color-text);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-buttons);
}
```

### 8.3 The Pastel Card

```css
/* Pattern A â€” Transparent card (Pastel, Podcorn) */
.card-transparent {
  background: rgba(0, 0, 0, 0);
  border: none;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}

/* Pattern B â€” Soft warm card (GRAZA, Pastel) */
.card-soft {
  background: var(--surface-1);          /* white */
  border-radius: 8.8px;                   /* or 10/12px */
  padding: 30-55px;                       /* generous */
}

/* Pattern C â€” Multi-color feature card (Podia, Palette Supply) */
.feature-card-sky {
  background: #a5c8d8;                    /* one of the pastel decorative */
  color: #06040e;
  border-radius: 56px;                    /* extreme pill */
  padding: 30-50px;
}
.feature-card-sage {
  background: #d7d7c8;
  border-radius: 12px;
  padding: 64px;                          /* huge padding */
}

/* Pattern D â€” Soft photo card (GRAZA) */
.photo-card {
  border-radius: 20px;                    /* 20px is signature */
  overflow: hidden;
}
```

### 8.4 The Input Field

```css
/* Pattern A â€” Underline input (Recess) */
.input-underline {
  background: transparent;
  color: var(--color-text);
  border: none;
  border-bottom: 1px solid var(--color-text);
  border-radius: 0;
  padding: 12px 0;
}

/* Pattern B â€” Pill input (Palette Supply) */
.input-pill {
  background: var(--surface-1);
  color: var(--color-text);
  border: 1px solid var(--color-text);
  border-radius: 100px;
  padding: 16px 20px;
}

/* Pattern C â€” Standard rounded (Pastel, GRAZA, Podia) */
.input-soft {
  background: var(--surface-1);
  border: 1px solid var(--color-outline);
  border-radius: 8.8px;
  padding: 12-16px 12-20px;
}
```

### 8.5 The Tag/Badge

```css
/* Pattern A â€” Pill badge (GRAZA, Palette Supply) */
.badge-pill {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
  border-radius: 9999px;
  padding: 4-8px 12-32px;
  font-family: var(--font-mono-or-small);
  font-size: 13px;
  text-transform: uppercase;
}

/* Pattern B â€” Solid soft badge (Pastel) */
.badge-soft {
  background: var(--color-cta);
  color: var(--color-text-on-cta);
  border-radius: 4px;
  padding: 2-4px 8-12px;
  font-size: 12px;
}
```

### 8.6 Navigation

```css
/* Pattern: Sticky minimal top bar */
.nav {
  position: sticky;
  top: 0;
  background: var(--surface-0);          /* canvas, often transparent */
  padding: 16-24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
}
.nav-link {
  color: var(--color-text);
  font-family: var(--font-primary);
  font-size: 14-16px;
  text-decoration: none;
  padding: 8-16px;
  transition: opacity 200ms ease;
}
.nav-link:hover { opacity: 0.7; }
```

### 8.7 Segmented Buttons (GRAZA-style)

```css
/* Half-rounded segmented control */
.seg-left {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
  border-radius: 10px 0 0 10px;
  padding: 12px 20px;
}
.seg-right {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
  border-left: none;
  border-radius: 0 10px 10px 0;
  padding: 12px 20px;
}
```

---

<a id="layout"></a>
## 9. LAYOUT PATTERNS

### 9.1 The Pastel Hero Pattern

```html
<section class="pastel-hero">
  <h1 class="hero-title">Get feedback directly on your website</h1>
  <p class="hero-sub">"Our clients love how they can drop comments"</p>
  <button class="hero-cta">Start a free trial</button>
</section>
```

```css
.pastel-hero {
  background: var(--surface-0);          /* warm canvas */
  padding: 80px 24px;                     /* generous */
  text-align: center;
  display: grid;
  place-items: center;
  gap: 24px;
  min-height: 80vh;
}
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 8vw, 60-120px);
  font-weight: 600-700;
  line-height: 1.0-1.1;
  letter-spacing: -0.02em to -0.03em;
  color: var(--color-text);
  margin: 0;
}
.hero-sub {
  font-size: 18-21px;
  font-weight: 400;
  max-width: 600px;
  color: var(--color-text);
  margin: 0;
}
```

### 9.2 The Alternating Bg Sections

```css
/* Pastel sites alternate canvas + secondary bg */
section.surface-0 { background: var(--surface-0); }
section.surface-1 { background: var(--surface-1); }
section.surface-2 { background: var(--surface-2); }

section {
  padding: 80px 24px;                     /* generous vertical */
}
```

### 9.3 The 3-4 Column Card Grid

```css
/* Common feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16-30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (max-width: 768px) {
  .feature-grid { grid-template-columns: 1fr; }
}
```

### 9.4 The Two-Column Asymmetric

```css
/* Image-left/text-right or text-left/image-right */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40-80px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
}
```

### 9.5 The Constrained Container Pattern (GRAZA, Podcorn)

```css
/* Use max-width 1100-1440px instead of full-bleed */
.container {
  max-width: 1105px;                      /* or 1440px */
  margin: 0 auto;
  padding: 0 24px;
}
```

---

<a id="imagery"></a>
## 10. IMAGERY & DECORATION

### 10.1 Imagery Strategies

| Site | Strategy |
|------|----------|
| Pastel | Product UI screenshots, transparent containers |
| Palette Supply | Abstract geometric color blocks (no photos) |
| Recess | Vibrant product photography + 3D cloud illustrations |
| GRAZA | Brightly lit food photography, full-bleed or 20px-radius cards |
| Podcorn | Lively line illustrations with brand colors |
| Podia | Light candid lifestyle photography in circular crops |

### 10.2 Photo Treatment

When Pastel sites use photography:
- **Bright, high-key, light**
- Slightly desaturated for warmth (Podia)
- Tightly cropped (GRAZA, Podia)
- **Often in circular or organic crops** (Podia)
- Or contained in **20px-radius soft-edged rectangles** (GRAZA)

```css
.pastel-photo {
  border-radius: 20px;                    /* GRAZA-style soft photo card */
  overflow: hidden;
}
.pastel-photo-circle {
  border-radius: 50%;                     /* Podia-style portrait */
  overflow: hidden;
  aspect-ratio: 1;
}
.pastel-photo-organic {
  border-radius: 80% 20% 70% 30% / 50% 30% 70% 50%;  /* organic */
}
```

### 10.3 Illustrations

Pastel illustration style:
- **Outlined, line-based** (Podcorn)
- Flat 2D in brand colors
- Whimsical 3D clouds (Recess)
- Abstract geometric shapes with rounded corners (Palette Supply)

Never realistic/3D-rendered. Never photography-mimicking.

### 10.4 Iconography

All Pastel sites use **outlined monochromatic icons** in primary text color:
```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="..." />
</svg>
```

---

<a id="motion"></a>
## 11. MOTION (RESTRAINED)

Pastel sites are **anti-motion** compared to Motion archetypes. Their motion is:

### 11.1 Hover Transitions Only

```css
.btn:hover {
  background-color: var(--color-cta-darker);
  transition: background 200ms ease;
}
.link:hover {
  opacity: 0.7;
  transition: opacity 150ms ease;
}
```

### 11.2 Subtle Decorative Animations (Recess clouds)

```css
.cloud {
  animation: float 8s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
```

### 11.3 Scroll-Triggered Fade-Ins

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

### 11.4 Background Color Section Transitions

The motion comes from **scrolling through alternating warm bgs** â€” the rhythm itself is calming.

### 11.5 Things to AVOID

- Aggressive parallax
- Auto-playing video heroes
- Type reveals on every section
- 3D hero scenes
- Cursor effects
- Marquees

Pastel = restraint. Motion = expression. Pick one.

---

<a id="anti-slop"></a>
## 12. ANTI-SLOP RULES (CRITICAL)

### 12.1 Color Anti-Slop

âŒ **REJECT** â€” these scream "default Tailwind SaaS template":
```css
background: #f9fafb;        /* gray-50, too cool */
background: #ffffff;        /* pure white, too cold */
color: #1f2937;             /* gray-800, generic */
color: #000000;             /* pure black, harsh */
--accent: #3b82f6;          /* blue-500, overused */
--accent: #8b5cf6;          /* violet-500, overused */
border: #e5e7eb;            /* gray-200, generic */
```

âœ… **USE** â€” documented Pastel canvases:
```css
background: #fff4ec;        /* GRAZA buttermilk */
background: #fff4f2;        /* Podcorn coral pink */
background: #f2f0e9;        /* Palette Supply cream */
background: #f5f5f4;        /* Pastel ghost (slightly warm) */
color: #25385b;             /* Recess violet text */
color: #3c4422;              /* GRAZA grove green text */
color: #090335;             /* Podcorn inkwell indigo */
--accent: #d1e030;          /* GRAZA zest yellow */
--accent: #a2b0ff;          /* Recess lavender mist */
--accent: #165dfb;          /* Pastel deep sea blue */
```

### 12.2 Typography Anti-Slop

âŒ **REJECT**:
- Inter as everything (overused everywhere)
- 4+ unrelated fonts
- Default tracking on all sizes
- Headings smaller than 40px

âœ… **USE**:
- Single typeface with multiple weights, OR curated pair
- Custom fonts loaded via @font-face
- Tracking adjusted per size (-0.02 to -0.03em on display, -0.01 to -0.02em on body)
- Display sizes 40-120px range
- Light weights (100-300) where airy feel desired

### 12.3 Radius Anti-Slop

âŒ **REJECT**:
```css
--radius-md: 6px;
--radius-lg: 8px;
/* The bland Material cascade */
```

âœ… **USE** â€” pick a Pastel stance:
- Decimal precision (8.8px Pastel)
- Extreme pill (100px Palette Supply, 56px Podia)
- Sharp 0px contrast (Recess, Podcorn)
- Multi-tier (8/10/20px GRAZA, with 9999px badges)

### 12.4 Layout Anti-Slop

âŒ **REJECT**:
- Hero with stock photo + overlay text + 2 buttons
- "Trusted by Microsoft Apple Google" logo bar
- 3-column "Features" with icon-circle + title + 2 lines
- Glass morphism with `backdrop-filter: blur()`

âœ… **USE**:
- Centered headline with single CTA
- Alternating warm-bg sections with content blocks
- 3-4 column feature grids with text-rich cards
- Solid color backgrounds (not glass)

### 12.5 Component Anti-Slop

âŒ **REJECT**:
- "shadcn-style" cards with `border + shadow + 12px radius`
- Generic Material outlined buttons with focus ring
- Generic Bootstrap-style alerts in red/yellow/green

âœ… **USE**:
- Transparent cards on alternating bg sections
- Pastel-canvas-aware inputs (underline OR pill OR soft rounded)
- Custom alert styling using site's accent color

### 12.6 Decoration Anti-Slop

âŒ **REJECT**:
- Gradient orbs in viewport corners
- Glassmorphism panels
- Generic 3D "Apple-style" shapes
- Stock photo with overlay

âœ… **USE**:
- Whimsical illustrations (Podcorn, Recess clouds)
- Abstract color blocks (Palette Supply)
- Lifestyle photography in soft-radius cards
- Brand-colored organic shapes

---

<a id="decision"></a>
## 13. DECISION TREE: PICK YOUR ARCHETYPE

```
What is the brand's product?

â”œâ”€ "Calm SaaS / Productivity / Tools"
â”‚   â†’ ARCHITECTURAL BLUEPRINT (Pastel)
â”‚   â†’ Single Figtree, vivid blue CTA, 8.8px radius
â”‚
â”œâ”€ "Creative tools / Design resources / Agency"
â”‚   â†’ WARM CREATIVE TOOLKIT (Palette Supply)
â”‚   â†’ Custom fonts (PPSupply), 100px pill buttons, multi-earth-tone decorative
â”‚
â”œâ”€ "DTC Wellness / Beverage / Lifestyle"
â”‚   â†’ PASTEL CLOUD DREAMSCAPE (Recess)
â”‚   â†’ Sky gradients, sharp 0px corners, lavender + violet
â”‚
â”œâ”€ "Food / Artisanal / Gourmet DTC"
â”‚   â†’ ARTISANAL PROVISIONS (GRAZA)
â”‚   â†’ Garamond + Typewriter, buttermilk bg, zest yellow CTA, 1440px max-width
â”‚
â”œâ”€ "Marketplace / Content platform / SaaS for creators"
â”‚   â†’ SOFT-EDGED DIGITAL CANVAS (Podcorn)
â”‚   â†’ Coral pink bg, sharp 0px corners, Georgia serif accent, 1105px max-width
â”‚
â””â”€ "Multi-feature SaaS / Course platform / Community tools"
    â†’ PLAYFUL MARKET STALL (Podia)
    â†’ StabilGrotesk single font, 56px pill cards, multi-pastel feature cards
```

---

<a id="templates"></a>
## 14. CSS STARTER TEMPLATES

### 14.1 Architectural Blueprint (Pastel)

```css
:root {
  /* Colors */
  --color-canvas: #f5f5f4;
  --color-paper: #ffffff;
  --color-text-primary: #111111;
  --color-text-secondary: #222222;
  --color-text-muted: #78716b;
  --color-border: #e6e3e2;
  --color-cta: #165dfb;
  --color-cta-text: #ffffff;

  /* Typography */
  --font-primary: 'Figtree', 'Inter', sans-serif;

  --text-caption: 14px;     --leading-caption: 1.5;     --tracking-caption: -0.22px;
  --text-body: 16px;        --leading-body: 1.43;       --tracking-body: -0.22px;
  --text-subheading: 18px;  --leading-subheading: 1.33; --tracking-subheading: -0.25px;
  --text-heading: 21px;     --leading-heading: 1.29;    --tracking-heading: -0.29px;
  --text-heading-lg: 35px;  --leading-heading-lg: 1.1;  --tracking-heading-lg: -0.56px;
  --text-display: 58px;     --leading-display: 1;       --tracking-display: -0.93px;

  /* Spacing */
  --space-2: 8px; --space-3: 12px; --space-5: 20px; --space-8: 32px;
  --space-10: 40px; --space-12: 48px; --space-16: 64px; --space-17: 68px;

  /* Layout */
  --section-padding-y: 68px;
  --section-padding-x: 24px;
  --card-padding: 0;

  /* Radius */
  --radius-tags: 4px;
  --radius-default: 8.8px;
  --radius-buttons: 10px;
  --radius-prominent: 15px;
  --radius-round: 120px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--color-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-primary);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

section {
  padding: var(--section-padding-y) var(--section-padding-x);
}

.display {
  font-size: var(--text-display);
  font-weight: 600;
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
}

.btn-cta {
  background: var(--color-cta);
  color: var(--color-cta-text);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 11px 22px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 200ms ease;
}
.btn-cta:hover { opacity: 0.9; }

.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-text-primary);
  border-radius: var(--radius-buttons);
  padding: 11px 22px;
  font-family: inherit;
}
```

### 14.2 Warm Creative Toolkit (Palette Supply)

```css
:root {
  --color-canvas: #f2f0e9;
  --color-paper: #ffffff;
  --color-text: #141212;
  --color-cta: #3051a8;
  --color-cta-text: #ffffff;

  /* Decorative palette */
  --color-sage-mist: #d7d7c8;
  --color-deep-forest: #3f593d;
  --color-desert-rose: #e0b9b1;
  --color-terracotta: #863a29;
  --color-harvest-gold: #e4b357;

  --font-primary: 'PPSupply', 'Inter', sans-serif;
  --font-display: 'esbuild', sans-serif;
  --font-mono: 'PPSupplyMonoLight', monospace;

  --text-caption: 12px;     --leading-caption: 1.2;
  --text-body-lg: 16px;     --leading-body-lg: 1.54;
  --text-heading: 64px;     --leading-heading: 0.94;    --tracking-heading: -1.92px;

  --section-gap: 72px;
  --card-padding: 20px;
  --element-gap: 8px;

  --radius-tags: 1000px;
  --radius-cards: 12px;
  --radius-images: 12px;
  --radius-inputs: 100px;
  --radius-buttons: 100px;
}

body {
  background: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-primary);
  font-feature-settings: "ss02";
}

.btn-cta {
  background: var(--color-cta);
  color: var(--color-cta-text);
  border: 1px solid var(--color-cta-text);
  border-radius: var(--radius-buttons);  /* 100px pill */
  padding: 14px 72px;
  font-family: inherit;
}

.card-deep-forest {
  background: var(--color-deep-forest);
  color: var(--color-paper);
  border-radius: var(--radius-cards);    /* 12px */
  padding: 0 0 261px;                    /* heavy bottom for visual fill */
}
.card-sage {
  background: var(--color-sage-mist);
  border-radius: var(--radius-cards);
  padding: 64px;                         /* generous all sides */
}
```

### 14.3 Pastel Cloud Dreamscape (Recess)

```css
:root {
  --color-text: #25385b;                 /* sky violet */
  --color-deep: #0a0a3a;
  --color-cta-bg: #a2b0ff;               /* lavender mist */
  --color-cta-text: #25385b;
  --color-canvas: #ffffff;
  --color-cream: #fffcef;

  --gradient-sky-glow: linear-gradient(rgb(236,245,246), rgb(235,235,253), rgb(251,206,205));

  --font-primary: 'Sharp Grotesk Web', 'Montserrat', sans-serif;

  --text-body: 16px;        --leading-body: 1.38;
  --text-heading: 24px;     --leading-heading: 1.2;
  --text-display: 60px;     --leading-display: 1;

  --section-gap: 64px;
  --element-gap: 8px;
  --radius: 0;                           /* sharp! */
}

body {
  background: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-primary);
  font-weight: 400;
}

.hero {
  background: var(--gradient-sky-glow);
  padding: 80px 24px;
  text-align: center;
}
.hero h1 {
  font-size: var(--text-display);
  font-weight: 700;
  line-height: var(--leading-display);
  color: var(--color-text);
  margin: 0;
}

.btn-cta {
  background: var(--color-cta-bg);
  color: var(--color-cta-text);
  border: 1px solid var(--color-cta-text);
  border-radius: 0;                      /* sharp */
  padding: 24px 36px;
  font-family: inherit;
  font-weight: 700;
}

.input-underline {
  background: transparent;
  color: var(--color-text);
  border: none;
  border-bottom: 1px solid var(--color-text);
  border-radius: 0;
  padding: 12px 0;
}

.icon-btn-circle {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: transparent;
  color: var(--color-text);
}

.cloud-decoration {
  animation: float 8s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
```

### 14.4 Artisanal Provisions (GRAZA)

```css
:root {
  --color-canvas: #fff4ec;               /* buttermilk */
  --color-canvas-2: #f6e6d9;             /* farmhouse gray */
  --color-text: #3c4422;                  /* grove green */
  --color-cta: #d1e030;                  /* zest yellow */
  --color-cta-text: #3c4422;
  --color-accent-1: #9eef80;             /* avocado cream */
  --color-accent-2: #fbd535;             /* sunbeam */
  --color-accent-3: #e8d6c8;             /* harvest ochre */

  --font-display: 'ITC Garamond Condensed', Garamond, serif;
  --font-body: 'GT Alpina Typewriter', 'Roboto Mono', monospace;
  --font-badge: 'Apercu', 'Inter', sans-serif;

  --text-base: 16px;        --leading-base: 1.5;
  --text-large: 20px;       --leading-large: 1.5;
  --text-h4: 46px;          --leading-h4: 1.6;
  --text-h2: 102px;         --leading-h2: 0.9;
  --text-h1: 120px;         --leading-h1: 1;          --tracking-h1: -0.031em;

  --max-width: 1440px;
  --section-pad: 35px;
  --element-gap: 8px;

  --radius-buttons: 10px;
  --radius-inputs: 8px;
  --radius-images: 20px;                  /* signature */
  --radius-badges: 9999px;
}

body {
  background: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-base);
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
}

.headline-display {
  font-family: var(--font-display);
  font-size: var(--text-h1);
  line-height: var(--leading-h1);
  letter-spacing: var(--tracking-h1);
  font-weight: 400;
}

.btn-cta {
  background: var(--color-cta);
  color: var(--color-cta-text);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 24px 35px;
  font-family: var(--font-body);
  font-weight: 400;
  cursor: pointer;
}

.photo-card {
  border-radius: var(--radius-images);   /* 20px */
  overflow: hidden;
}

.section-buttermilk { background: var(--color-canvas); }
.section-farmhouse  { background: var(--color-canvas-2); }
.section-avocado    { background: var(--color-accent-1); }
.section-sunbeam    { background: var(--color-accent-2); }
```

### 14.5 Playful Market Stall (Podia)

```css
:root {
  --color-canvas: #f5f5f5;               /* warm sand */
  --color-paper: #ffffff;
  --color-text: #06040e;                 /* ink black */
  --color-text-2: #10242f;
  --color-cta-bg: #06040e;
  --color-cta-text: #e1edf2;

  /* Pastel feature card colors */
  --color-sky: #a5c8d8;
  --color-sunset: #e39a4d;
  --color-lavender: #cbb0eb;
  --color-plum: #1f1738;
  --color-umber: #452623;
  --color-peach: #f6ddc4;

  --font-primary: 'StabilGrotesk', 'Inter', sans-serif;

  --text-caption: 11px;     --leading-caption: 1.5;     --tracking-caption: -0.33px;
  --text-body: 16px;        --leading-body: 1.5;        --tracking-body: -0.48px;
  --text-subheading: 18px;  --leading-subheading: 1.4;  --tracking-subheading: -0.54px;
  --text-heading-sm: 22px;  --leading-heading-sm: 1.4;  --tracking-heading-sm: -0.66px;
  --text-heading: 36px;     --leading-heading: 1.09;    --tracking-heading: -1.08px;
  --text-display: 60px;     --leading-display: 1;       --tracking-display: -1.8px;

  --section-gap: 40px;
  --card-padding: 16px;
  --element-gap: 16px;

  --radius-links: 8px;
  --radius-buttons: 16px;
  --radius-misc: 24px;
  --radius-cards: 56px;                   /* signature pill cards! */
}

body {
  background: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-primary);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

.btn-cta-primary {
  background: var(--color-cta-bg);
  color: var(--color-cta-text);
  border: none;
  border-radius: 14px;
  padding: 16px 24px;
  font-family: inherit;
  font-weight: 500;
}

.feature-card {
  border-radius: var(--radius-cards);    /* 56px pill */
  padding: 30px 50px;
  font-family: inherit;
}
.feature-card.sky    { background: var(--color-sky); color: var(--color-text); }
.feature-card.sunset { background: var(--color-sunset); color: var(--color-text); }
.feature-card.lavender-dark {
  background: var(--color-plum);
  color: var(--color-peach);
  border: 1px solid var(--color-lavender);
}
```

### 14.6 Soft-Edged Digital Canvas (Podcorn)

```css
:root {
  --color-canvas: #fff4f2;               /* canvas pink */
  --color-paper: #ffffff;
  --color-text: #090335;                 /* inkwell indigo */
  --color-text-muted: #434352;
  --color-cta-bg: #090335;
  --color-cta-text: #ffffff;
  --color-accent-red: #fc736c;           /* firebrick */
  --color-accent-coral: #ffb0a1;
  --color-border: #d8d8d8;

  --font-body: 'Gilroy', 'Inter', sans-serif;
  --font-display: 'Georgia', 'Lora', serif;

  --text-caption: 14px;     --leading-caption: 1.58;    --tracking-caption: -0.19px;
  --text-body: 16px;        --leading-body: 1.67;       --tracking-body: -0.19px;
  --text-subheading: 18px;  --leading-subheading: 1.57;
  --text-heading: 25px;     --leading-heading: 1.2;
  --text-heading-lg: 40px;  --leading-heading-lg: 1.44;

  --max-width: 1105px;
  --section-gap: 75px;
  --card-padding: 55px;
  --element-gap: 20px;

  --radius: 0;                           /* sharp! */
  --radius-modal: 8px;
}

body {
  background: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
}

.headline-serif {
  font-family: var(--font-display);
  font-size: var(--text-heading-lg);
  font-weight: 700;
  line-height: var(--leading-heading-lg);
}

.btn-cta {
  background: var(--color-cta-bg);
  color: var(--color-cta-text);
  border: none;
  border-radius: 0;
  padding: 18px 20px;
  font-family: inherit;
}
.btn-nav {
  background: var(--color-accent-red);
  color: var(--color-paper);
  border: none;
  border-radius: 0;
  padding: 11px 20px;
  font-family: var(--font-display);
  font-weight: 700;
}
```

---

<a id="tailwind"></a>
## 15. TAILWIND V4 CONFIGURATIONS

### 15.1 Pastel (Architectural Blueprint)

```css
@theme {
  --color-midnight-ink: #111111;
  --color-storm-gray: #222222;
  --color-ghost-white: #f5f5f4;
  --color-cloud-cover: #e6e3e2;
  --color-deep-sea-blue: #165dfb;
  --color-whisper-gray: #78716b;
  --color-snow-drift: #ffffff;

  --font-primary: 'Figtree', 'Inter', sans-serif;

  --text-caption: 14px; --leading-caption: 1.5; --tracking-caption: -0.22px;
  --text-body: 16px; --leading-body: 1.43; --tracking-body: -0.22px;
  --text-subheading: 18px; --leading-subheading: 1.33; --tracking-subheading: -0.25px;
  --text-heading: 21px; --leading-heading: 1.29; --tracking-heading: -0.29px;
  --text-heading-lg: 35px; --leading-heading-lg: 1.1; --tracking-heading-lg: -0.56px;
  --text-display: 58px; --leading-display: 1; --tracking-display: -0.93px;

  --radius-tags: 4px;
  --radius-default: 8.8px;
  --radius-buttons: 10px;
  --radius-prominent: 15px;
  --radius-round: 120px;
}
```

### 15.2 GRAZA (Artisanal)

```css
@theme {
  --color-buttermilk: #fff4ec;
  --color-farmhouse-gray: #f6e6d9;
  --color-grove-green: #3c4422;
  --color-zest-yellow: #d1e030;
  --color-avocado-cream: #9eef80;
  --color-sunbeam-yellow: #fbd535;
  --color-harvest-ochre: #e8d6c8;

  --font-display: 'ITC Garamond Condensed', Garamond, serif;
  --font-body: 'GT Alpina Typewriter', 'Roboto Mono', monospace;
  --font-badge: 'Apercu', Inter, sans-serif;

  --radius-buttons: 10px;
  --radius-inputs: 8px;
  --radius-images: 20px;
  --radius-badges: 9999px;
}
```

### 15.3 Podia (Market Stall)

```css
@theme {
  --color-ink-black: #06040e;
  --color-deep-ocean: #10242f;
  --color-crystal-canvas: #ffffff;
  --color-cloud-gray: #e1edf2;
  --color-warm-sand: #f5f5f5;
  --color-sky-blue: #a5c8d8;
  --color-lavender-mist: #cbb0eb;
  --color-sunset-orange: #e39a4d;
  --color-rich-plum: #1f1738;
  --color-light-peach: #f6ddc4;

  --font-primary: 'StabilGrotesk', Inter, sans-serif;

  --radius-links: 8px;
  --radius-buttons: 16px;
  --radius-misc: 24px;
  --radius-cards: 56px;
}
```

---

<a id="recipes"></a>
## 16. COMPONENT RECIPES

### 16.1 Pastel Hero (Architectural)

```html
<section class="pastel-hero">
  <h1>Get feedback directly on your website</h1>
  <p>Pastel lets your team and clients drop comments anywhere on a Webflow page.</p>
  <button class="btn-cta">Start a free trial</button>
</section>
```

```css
.pastel-hero {
  background: #f5f5f4;
  padding: 80px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 32px;
  min-height: 80vh;
}
.pastel-hero h1 {
  font-family: 'Figtree', 'Inter', sans-serif;
  font-size: clamp(40px, 8vw, 58px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.93px;
  color: #111111;
  max-width: 800px;
  margin: 0;
}
.pastel-hero p {
  font-size: 21px;
  line-height: 1.29;
  letter-spacing: -0.29px;
  color: #111111;
  max-width: 600px;
  margin: 0;
}
.btn-cta {
  background: #165dfb;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 11px 22px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
}
```

### 16.2 GRAZA Photo Card

```html
<article class="graza-card">
  <div class="graza-photo">
    <img src="/oil.webp" alt="Drizzle olive oil bottle" />
  </div>
  <h3 class="graza-title">Drizzle</h3>
  <p class="graza-body">Cold-pressed extra virgin olive oil for finishing dishes.</p>
  <button class="btn-graza">Add to cart â€” $15</button>
</article>
```

```css
.graza-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff4ec;
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
}
.graza-photo {
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 4 / 5;
}
.graza-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.graza-title {
  font-family: 'ITC Garamond Condensed', Garamond, serif;
  font-size: 46px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.021em;
  color: #3c4422;
  margin: 0;
}
.graza-body {
  font-family: 'GT Alpina Typewriter', monospace;
  font-size: 16px;
  line-height: 1.5;
  color: #3c4422;
  margin: 0;
}
.btn-graza {
  background: #d1e030;
  color: #3c4422;
  border: none;
  border-radius: 10px;
  padding: 24px 35px;
  font-family: 'GT Alpina Typewriter', monospace;
  cursor: pointer;
  align-self: flex-start;
}
```

### 16.3 Recess Cloud Hero

```html
<section class="recess-hero">
  <div class="cloud cloud-1" aria-hidden></div>
  <div class="cloud cloud-2" aria-hidden></div>
  <h1>relax & unwind with Recess</h1>
  <p>you won't miss the booze when you have Recess on hand</p>
  <button class="btn-recess">shop now</button>
</section>
```

```css
.recess-hero {
  position: relative;
  background: linear-gradient(rgb(236, 245, 246), rgb(235, 235, 253), rgb(251, 206, 205));
  padding: 80px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 32px;
  min-height: 80vh;
  overflow: hidden;
}
.recess-hero h1 {
  font-family: 'Sharp Grotesk Web', 'Montserrat', sans-serif;
  font-size: clamp(40px, 8vw, 60px);
  font-weight: 700;
  line-height: 1;
  color: #25385b;
  margin: 0;
}
.recess-hero p {
  font-family: 'Sharp Grotesk Web', sans-serif;
  font-size: 18px;
  font-weight: 400;
  color: #25385b;
  max-width: 500px;
  margin: 0;
}
.btn-recess {
  background: #fffcef;
  color: #25385b;
  border: 1px solid #25385b;
  border-radius: 0;
  padding: 24px 36px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}
.cloud {
  position: absolute;
  width: 80px;
  height: 60px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: rgba(255, 255, 255, 0.6);
  filter: blur(2px);
  animation: float 8s ease-in-out infinite;
}
.cloud-1 { top: 15%; left: 10%; animation-delay: 0s; }
.cloud-2 { top: 30%; right: 12%; animation-delay: 4s; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
```

### 16.4 Podia Pastel Feature Card

```html
<article class="podia-feature podia-feature--sky">
  <h3>Email marketing built for creators</h3>
  <p>Send beautiful newsletters that actually convert.</p>
  <a class="podia-feature-link" href="#">Learn more â†’</a>
</article>
```

```css
.podia-feature {
  border-radius: 56px;
  padding: 40px 50px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'StabilGrotesk', Inter, sans-serif;
}
.podia-feature--sky    { background: #a5c8d8; color: #06040e; }
.podia-feature--sunset { background: #e39a4d; color: #06040e; }
.podia-feature--plum   { background: #1f1738; color: #f6ddc4; border: 1px solid #cbb0eb; }
.podia-feature h3 {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.66px;
  margin: 0;
}
.podia-feature p {
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.48px;
  margin: 0;
}
.podia-feature-link {
  margin-top: auto;
  color: inherit;
  text-decoration: underline;
  font-weight: 500;
}
```

### 16.5 Palette Supply 100px Pill Button

```html
<button class="palette-cta">Shop Now</button>
<button class="palette-ghost">Learn more</button>
```

```css
.palette-cta {
  background: #3051a8;
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 100px;
  padding: 14px 72px;
  font-family: 'PPSupply', Inter, sans-serif;
  font-feature-settings: "ss02";
  font-weight: 400;
  cursor: pointer;
}
.palette-ghost {
  background: transparent;
  color: #000000;
  border: 1px solid #000000;
  border-radius: 100px;
  padding: 8px 16px;
  font-family: 'PPSupply', Inter, sans-serif;
  font-feature-settings: "ss02";
}
```

### 16.6 Podcorn Sharp Pink Hero

```html
<section class="podcorn-hero">
  <h1>Monetization your way.</h1>
  <p>Connect podcasts and brands. Run sponsorships in minutes.</p>
  <div class="podcorn-actions">
    <button class="btn-podcorn-primary">For Podcasters</button>
    <button class="btn-podcorn-secondary">For Brands</button>
  </div>
</section>
```

```css
.podcorn-hero {
  background: #fff4f2;
  padding: 75px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 32px;
  max-width: 1105px;
  margin: 0 auto;
}
.podcorn-hero h1 {
  font-family: 'Georgia', Lora, serif;
  font-weight: 700;
  font-size: 40px;
  line-height: 1.44;
  color: #090335;
  margin: 0;
}
.podcorn-hero p {
  font-family: 'Gilroy', Inter, sans-serif;
  font-size: 18px;
  line-height: 1.57;
  letter-spacing: -0.19px;
  color: #434352;
  max-width: 600px;
  margin: 0;
}
.podcorn-actions {
  display: flex;
  gap: 20px;
}
.btn-podcorn-primary {
  background: #090335;
  color: #ffffff;
  border: none;
  border-radius: 0;
  padding: 18px 20px;
  font-family: 'Gilroy', sans-serif;
  letter-spacing: -0.19px;
  cursor: pointer;
}
.btn-podcorn-secondary {
  background: #ffffff;
  color: #090335;
  border: 1px solid #090335;
  border-radius: 0;
  padding: 18px 20px;
  font-family: 'Gilroy', sans-serif;
  letter-spacing: -0.19px;
  cursor: pointer;
}
```

### 16.7 GRAZA Segmented Control

```html
<div class="seg-control">
  <button class="seg seg-left active">Drizzle</button>
  <button class="seg seg-right">Sizzle</button>
</div>
```

```css
.seg-control { display: inline-flex; }
.seg {
  background: transparent;
  color: #3c4422;
  border: 1px solid #3c4422;
  font-family: 'GT Alpina Typewriter', monospace;
  font-size: 16px;
  padding: 12px 20px;
  cursor: pointer;
}
.seg-left  { border-radius: 10px 0 0 10px; }
.seg-right { border-radius: 0 10px 10px 0; border-left: none; }
.seg.active { background: #d1e030; }
```

---

<a id="checklist"></a>
## 17. VALIDATION CHECKLIST

### 17.1 Color Audit
- [ ] Page background is **warm-tinted off-white** (not pure white)
- [ ] Primary text is **tinted near-black** (not `#000000`)
- [ ] At most 1 saturated CTA color
- [ ] At most 4-5 decorative pastel colors (no CTAs)
- [ ] No Tailwind 500-tier defaults
- [ ] No `gray-50` / `gray-100` / `gray-800` unless intentionally justified

### 17.2 Typography Audit
- [ ] One typeface OR curated pair (display + body)
- [ ] Custom font specified (not Inter as primary)
- [ ] Display size â‰¥ 40px (mobile) / 60-120px (desktop)
- [ ] Negative letter-spacing on display (-0.02 to -0.03em)
- [ ] OpenType features set if applicable (`"ss02"` etc.)
- [ ] Light weights (100-300) used if airy feel desired

### 17.3 Geometry Audit
- [ ] Border-radius commits to a Pastel stance:
   - [ ] Decimal (8.8px / 11px) uniform, OR
   - [ ] Extreme pill (56-100px) on cards, OR
   - [ ] Sharp 0px contrast (Recess/Podcorn-style)
- [ ] No drop shadows (or only one defined globally)
- [ ] Section gap â‰¥ 40px (60-80px sweet spot)
- [ ] Card padding generous (16-75px range)

### 17.4 Layout Audit
- [ ] Hero is centered with prominent display text
- [ ] Sections alternate warm tinted backgrounds
- [ ] Either full-bleed OR contained (1100-1440px max)
- [ ] No 12-column generic grids (3-4 column feature grids)

### 17.5 Imagery Audit
- [ ] Photos in soft-radius cards (8-20px) or organic crops
- [ ] Illustrations are flat / outlined / brand-colored
- [ ] No stock photos with generic overlays
- [ ] Icons outlined monochrome in primary text color

### 17.6 Motion Audit
- [ ] No aggressive parallax or 3D scenes
- [ ] Hover transitions only (color/opacity)
- [ ] Optional: subtle decorative float/drift animations
- [ ] Honors `prefers-reduced-motion`

### 17.7 Accessibility Audit
- [ ] Tinted near-black text passes AAA on warm canvas
- [ ] CTA contrast passes AA (saturated accent on canvas)
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
PROMPT:                              PICK:
"calm SaaS / productivity"        â†’  Pastel (Architectural Blueprint)
"creative tools / agency"         â†’  Palette Supply (Warm Toolkit)
"DTC wellness / beverage"         â†’  Recess (Cloud Dreamscape)
"food / artisanal DTC"            â†’  GRAZA (Artisanal Provisions)
"marketplace / SaaS"              â†’  Podcorn (Soft-Edged Canvas)
"creator / community / courses"   â†’  Podia (Market Stall)
```

### 18.2 30-Second Token Set (Universal Pastel)

```css
:root {
  /* Pick a canvas */
  --bg: #fff4ec;          /* warm buttermilk */
  /* OR */
  --bg: #f2f0e9;          /* warm cream */
  /* OR */
  --bg: #fff4f2;          /* coral pink */

  /* Tinted text */
  --text: #25385b;         /* violet OR */
  --text: #3c4422;          /* green OR */
  --text: #090335;         /* indigo OR */
  --text: #111111;         /* near-black */

  /* ONE saturated accent */
  --cta: #165dfb;          /* vivid blue OR */
  --cta: #d1e030;          /* zest yellow OR */
  --cta: #a2b0ff;          /* lavender mist */

  /* Type */
  --font-primary: 'Figtree', sans-serif;  /* OR custom */

  /* Soft radius */
  --radius: 10px;          /* OR 0 sharp / 56px pill / 100px full */

  /* Generous spacing */
  --section-gap: 64px;
  --element-gap: 16px;
}
```

### 18.3 Common Tasks

```
TASK:                       RECIPE:
"Pastel CTA"             â†’  Filled button in saturated accent + tinted text + 8.8/10/100px radius
"Pastel hero"            â†’  Centered display 40-120px + sub + 1 CTA on warm bg
"Pastel card"            â†’  Transparent OR soft-pill OR multi-pastel feature
"Pastel input"           â†’  Underline OR pill OR soft-rounded
"Pastel photo"           â†’  20px radius soft card OR 50% circular crop
"Pastel section"         â†’  Alternating warm bg + 60-80px vertical pad
"Pastel illustration"    â†’  Outlined line art OR abstract color blocks
```

---

## 19. APPENDIX: SOURCE SITES

| # | Site | URL | Theme | Archetype |
|---|------|-----|-------|-----------|
| 1 | Pastel | usepastel.com | light | Architectural Blueprint |
| 2 | Palette Supply | palette.supply | light | Warm Creative Toolkit |
| 3 | Recess | takearecess.com | light | Pastel Cloud Dreamscape |
| 4 | GRAZA | graza.co | light | Artisanal Provisions |
| 5 | Podcorn | podcorn.com | light | Soft-Edged Canvas |
| 6 | Podia | podia.com | light | Playful Market Stall |

Each archetype's full DESIGN.md is preserved in `../../raw/pastel/0X-<site>.md`.

---

## 20. VERSIONING

- **v1.0.0** (May 2026): Initial 6-site corpus from Refero "pastel" tag.

---

**END OF SKILL FILE**

> When using this skill, **commit to a single archetype**. The Pastel category covers a wide range from "calm SaaS" to "artisanal food brand" â€” mixing them produces incoherent design.


## Supplemental Depth Pass 1: Pastel Production Expansion

### 1.1 Strategic Role

Pastel design succeeds when softness is organized by structure. Gentle color needs strong hierarchy, readable text, and clear action states.

The intended feeling is soft, approachable, friendly, warm, optimistic. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 1.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: pastel accents should group content, reduce anxiety, and support friendly interaction without becoming low-contrast decoration.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 1.3 Layout Discipline

Strong Pastel layouts should:

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

Every component should express Pastel in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 1.5 Content Discipline

Good copy for Pastel is specific, short, and matched to the visual energy.

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

- Does the page still feel like Pastel with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid washed-out text, too many candy colors, childish tone, weak CTAs, and decorative blobs that do not explain content.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 1.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Pastel system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 2: Pastel Production Expansion

### 2.1 Strategic Role

Pastel design succeeds when softness is organized by structure. Gentle color needs strong hierarchy, readable text, and clear action states.

The intended feeling is soft, approachable, friendly, warm, optimistic. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 2.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: pastel accents should group content, reduce anxiety, and support friendly interaction without becoming low-contrast decoration.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 2.3 Layout Discipline

Strong Pastel layouts should:

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

Every component should express Pastel in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 2.5 Content Discipline

Good copy for Pastel is specific, short, and matched to the visual energy.

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

- Does the page still feel like Pastel with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid washed-out text, too many candy colors, childish tone, weak CTAs, and decorative blobs that do not explain content.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 2.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Pastel system should feel rich because it is disciplined, not because it has more effects.
