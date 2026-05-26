---
name: motion
description: |
  Motion-heavy aesthetic for the web. Use when user requests "cinematic", "high-energy",
  "animated", "dynamic", "motion-first", "kinetic", "scroll-driven", or "premium dynamic"
  websites. Bold typography, restrained palettes (1-3 colors), full-bleed atmospheres,
  ghost UI, and choreographed scroll motion. Anti-slop: rejects rounded-default,
  shadow-heavy, multicolor SaaS templates.
version: 1.0.0
category: design-taste
tags: [motion, dark-ui, high-contrast, editorial, brutalist, gradient, cinematic, kinetic, ghost-buttons, hero-animation]
sources:
  - liquiddeath.com
  - heavyweight-type.com
  - joinhandshake.com
  - cthdrl.co
  - playsuperlative.com
  - themekaverse.com
  - hape.io
  - movingparts.io
  - homunculus.jp
---

# Motion — Design Skill

> **A skill for building motion-first, anti-slop websites. Distilled from 9 award-winning motion-heavy sites curated by Refero. Every rule below has been verified against multiple production sites.**

---

## TABLE OF CONTENTS

1. [Philosophy: What Makes a Site "Motion"?](#philosophy)
2. [The 9 Motion Archetypes](#archetypes)
3. [Color Systems](#color)
4. [Typography Systems](#typography)
5. [Spacing & Geometry](#spacing)
6. [Border Radius Patterns](#radius)
7. [Surface & Elevation](#surface)
8. [Component Patterns](#components)
9. [Motion & Animation Patterns](#motion)
10. [Layout Patterns](#layout)
11. [Imagery & Decoration](#imagery)
12. [Anti-Slop Rules (Critical)](#anti-slop)
13. [Decision Tree: Pick Your Archetype](#decision)
14. [CSS Starter Templates](#templates)
15. [Tailwind v4 Configurations](#tailwind)
16. [Component Recipes](#recipes)
17. [Validation Checklist](#checklist)
18. [Quick Reference Cheatsheet](#cheatsheet)

---

<a id="philosophy"></a>
## 1. PHILOSOPHY: What Makes a Site "Motion"?

A "motion-heavy" site, in this skill's vocabulary, is **not just a site that animates a lot**. It is a site whose entire visual system is engineered around the assumption that motion is the primary medium, with static styling as a fallback.

The 9 reference sites share these traits:

### 1.1 Visual Hierarchy is Inverted
Most SaaS templates: **logo + CTA dominate**, content secondary, motion as polish.
Motion sites: **typography or imagery dominates the viewport**, UI shrinks to ghost minimum, motion becomes the structural element.

### 1.2 Restraint is the Loudest Signal
The most motion-heavy site in the corpus (cthdrl) uses **only 2 colors and 1 font weight**. Restraint amplifies movement — every additional color or weight competes with the motion for attention.

### 1.3 Full-Bleed is the Default Layout
None of the 9 sites use a centered max-width 1200px container as their primary section pattern. They all use full-bleed bands, full-viewport heroes, or content stretched edge-to-edge.

### 1.4 Ghost Buttons Over Filled CTAs
Filled buttons in primary brand colors are the SaaS default. Motion sites prefer:
- Transparent buttons with 1px border (Liquid Death, MekaVerse, Handshake)
- Buttons that match the section background (HAPE PRIME)
- Buttons with no padding/no radius (cthdrl)
- Pill-shaped buttons in unusual colors (Moving Parts: pure `#0000ff`)

### 1.5 The Single Accent Rule
Across 9 sites, the median number of "primary action" colors is **1**. Sites that have multiple chromatic colors (MekaVerse, HAPE PRIME, Moving Parts) use them **decoratively** — not for actions.

### 1.6 Imagery is Either Absent or Total
Either the site has zero imagery (cthdrl, homunculus uses only abstract shaders), or imagery is full-bleed and dominant (Liquid Death, MekaVerse, HAPE PRIME). There is no middle ground of "small product screenshots in cards".

### 1.7 The Layout Cadence Punctuates
Sites alternate full-bleed bands of dramatically different colors (white → black → crimson → black) to create rhythm. The transitions themselves *are* the motion design.

---

<a id="archetypes"></a>
## 2. THE 9 MOTION ARCHETYPES

Each archetype below corresponds to one of the 9 reference sites. When asked for a "motion-heavy" build, first pick an archetype, then apply its tokens.

### 2.1 BRUTALIST DTC (Liquid Death)
**Vibe:** Heavy metal vending machine
**Theme:** mixed (alternating black/white full-bleed bands)
**Palette size:** 8 grays + 2 gold accents (functional only)
**Typography:** ONE typeface, uppercase, weight 700 dominant
**Radius:** 0px everywhere
**Motion:** Full-bleed band transitions, sharp product photography reveals
**When to use:** Counter-culture brands, edgy DTC, anti-corporate energy

### 2.2 TYPE FOUNDRY MINIMALISM (Heavyweight)
**Vibe:** Type catalog on stark white
**Theme:** light
**Palette size:** 5 grays + 1 functional green
**Typography:** Custom heavy/condensed, large showcase
**Radius:** 11px (consistent everywhere)
**Motion:** Subtle (opacity, bg-color), large 166px section gaps create rhythm
**When to use:** Type foundries, editorial portfolios, single-product catalogs

### 2.3 NEBULA GRADIENT HERO (Handshake)
**Vibe:** Shifting gradient nebula
**Theme:** dark canvas with vivid hero gradient
**Palette size:** 4 dark + 1 vivid green (gradient: green → cyan)
**Typography:** Display 201px (extreme!) + condensed grotesk
**Radius:** Bipolar — 8px buttons, 24px cards, 9999px tags
**Motion:** Animated radial gradient bg, translucent oklab-color UI
**When to use:** Marketplaces, recruiting platforms, "energy" brands

### 2.4 STARK EDITORIAL DARK (cthdrl)
**Vibe:** Black canvas, stark typography
**Theme:** dark
**Palette size:** **2 colors total**
**Typography:** Display 121px + body Mono with -0.045em tracking
**Radius:** 0px
**Motion:** Letter-by-letter reveals, abstract line/arc animations
**When to use:** Studios, agencies, "high-touch" creative shops

### 2.5 INSTRUMENT PANEL (Superlative)
**Vibe:** Precision instrument interface
**Theme:** dark
**Palette size:** 8 grays + 1 functional orange (NEVER button)
**Typography:** Condensed display (90px), 0.08em tracking
**Radius:** Multi-tier — 3px buttons, 15px badges, 0px ghost
**Motion:** Full-bleed product photography parallax, LED-style indicators
**When to use:** Hardware/instruments, technical products, audio gear

### 2.6 HOLOGRAPHIC SCI-FI (MekaVerse)
**Vibe:** Deep-space holographic command center
**Theme:** dark
**Palette size:** 5 neutrals + 5 decorative accents (blue/red/pink — never CTA)
**Typography:** Roobert (display, ligatures off) + GT America Mono
**Radius:** Bipolar — 2px buttons/nav, 10px cards, 20px containers
**Motion:** 3D world-map slow pan, translucent ghost UI letting bg show through
**When to use:** Web3, NFT/crypto products, sci-fi/gaming

### 2.7 NEON NOIR EDITORIAL (HAPE PRIME)
**Vibe:** Neon Red Noir digital fashion runway
**Theme:** dark
**Palette size:** 3 colors + 1 hero radial gradient
**Typography:** Integral CF + Neue Plak Extended + Druk Text Wide (4 fonts)
**Radius:** **26px on ALL buttons/links (signature pill)**, 0px on cards
**Motion:** 3D character rotation in hero, alternating crimson/black bands
**When to use:** Digital fashion, NFT character brands, dramatic editorial

### 2.8 GEOMETRIC SOFT-CARDS (Moving Parts)
**Vibe:** High-contrast geometric clarity
**Theme:** light (with dark sections)
**Palette size:** 7 neutrals + pure `#0000ff` + emerald + conic gradient
**Typography:** **10+ fonts** (Unica77 with ss01-ss09 stylistic sets is signature)
**Radius:** **Extreme bipolar — 0px buttons, 90.3833px / 106.333px cards**
**Motion:** Conic gradient rotation, bottom-flat rounded cards
**When to use:** Premium SaaS, design-tooling, modern portfolios

### 2.9 IRIDESCENT SHADER NIGHT (homunculus)
**Vibe:** Shimmering digital night
**Theme:** dark
**Palette size:** 5 grays only
**Typography:** **Times serif body + urw-din UI** (the inversion!)
**Radius:** 0px
**Motion:** Iridescent shader-style fluid form full-bleed bg
**When to use:** Studios, creative tech labs, experimental Japanese-style portfolios

---

<a id="color"></a>
## 3. COLOR SYSTEMS

### 3.1 The Palette-Size Heuristic

| Palette size | Use case | Example |
|--------------|----------|---------|
| 2 colors | Maximum motion impact, maximum restraint | cthdrl |
| 3-5 grays only | Atmospheric/abstract motion | homunculus |
| 5-8 grays + 1 vivid accent | Functional dark UI | Handshake, Superlative |
| 5-10 grays + 2-3 decorative accents (no CTA) | Sci-fi/gaming | MekaVerse |
| 5-7 grays + 1 saturated CTA color | Premium SaaS | Moving Parts |
| 8 grays + 2-3 brand metallics | Brutalist DTC | Liquid Death |

**Rule:** If palette > 6 hues (not counting neutrals), promote at most ONE to CTA. The rest must remain decorative.

### 3.2 The "True Black" vs "Off-Black" Pattern

Every dark-theme site in the corpus uses `#000000` for **page background** but introduces a slightly softer black (`#121212`, `#141414`, `#151515`, `#383838`, `#444345`) for:
- Body copy on light surfaces
- Secondary surface elevation
- Hover states on dark elements
- Card surfaces inside dark sections

```css
/* Dark theme color stack pattern */
--bg-page: #000000;          /* True black for backdrops */
--bg-elevated: #141414;      /* Off-black for cards/surfaces */
--bg-hover: #232323;         /* Lift on interaction */
--text-primary: #ffffff;     /* Pure white text on black */
--text-secondary: #6f6f6f;   /* Mid-gray for helper */
--text-tertiary: #383838;    /* Near-bg for placeholder */
```

### 3.3 The "True White" vs "Off-White" Pattern

Light-theme sites use `#ffffff` for **page background** but introduce warm/cool off-whites (`#f3f5fa`, `#f5f5f5`, `#f6f4f2`, `#efefef`, `#e7ded1`) for:
- Card surfaces
- Default button backgrounds
- Subtle section differentiation

### 3.4 The Single-Accent Rule (Operational)

**Reject (anti-slop):**
```css
/* ❌ The "every component has its own color" SaaS template */
--color-primary: #2563eb;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-danger: #ef4444;
--color-info: #06b6d4;
```

**Use (motion-correct):**
```css
/* ✅ Motion archetype: ONE chromatic accent */
--color-canvas: #000000;
--color-text: #ffffff;
--color-accent: #d3fb52;    /* The ONE accent. Never compete with itself. */
--color-muted: #6f6f6f;
--color-border: #1a1a1a;
```

### 3.5 Specific Accent Colors Documented

These are the actual accent colors used by the corpus. Any of them is "motion-canonical":

| Site | Accent | Hex | Notes |
|------|--------|-----|-------|
| Liquid Death | Polished Gold | `#d2ac5a` | Used only for logotype, links |
| Heavyweight | Accent Green | `#39d17f` | Reserved for "new" tags |
| Handshake | Guidepost Green | `#d3fb52` | Lime, also as gradient component |
| Superlative | Signal Orange | `#e66f27` | NEVER for CTAs; only indicators |
| MekaVerse | Page Blue | `#2e9ec3` | Decorative only, with red `#bc1010`, pink `#d69dbb` |
| HAPE PRIME | Crimson Flux | `#730200` | Saturates entire content cards |
| Moving Parts | Deep Royal Blue | `#0000ff` | The ONE CTA accent — pure RGB blue |
| homunculus | (none) | — | Shader-only chromatic |

### 3.6 Gradients in the Corpus

When motion sites use gradients, they use them in 3 modes:

**Mode A — Hero Radial:**
```css
/* Handshake's nebula */
background: radial-gradient(rgb(211,251,82) 0%, rgb(122,243,255) 52%, rgba(0,0,0,0) 78%);
/* HAPE PRIME's heat stroke */
background: radial-gradient(circle at 50% 0%, rgb(183,5,5) 40%, rgb(119,0,0) 140%);
```
Always anchored top-of-viewport, fading to transparent.

**Mode B — Conic Spectrum:**
```css
/* Moving Parts' decorative full-spectrum */
background: conic-gradient(
  rgb(87,192,241) 0%, rgb(74,166,232) 13%, rgb(134,57,162) 26%,
  rgb(239,137,159) 42%, rgb(234,57,42) 55%, rgb(239,115,53) 62%,
  rgb(245,192,68) 73%, rgb(245,255,84) 84%, rgb(160,218,83) 95%,
  rgb(87,192,241) 100%
);
```
Used as decorative element animation, never as button bg.

**Mode C — Translucent oklab() opacity:**
```css
/* Handshake's ghost surfaces */
background: oklab(1 0 5.96046e-8 / 0.06);  /* translucent white */
border: 1px solid oklab(0.19794 0.0021212 -0.0139539 / 0.2);
```
Lets underlying bg/imagery show through. **The motion-essential pattern.**

### 3.7 Color Combinations to Avoid

Anti-slop combinations that scream "AI-generated SaaS":

```css
/* ❌ Reject */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);  /* Purple→pink default */
background: #6366f1;                                              /* Indigo Tailwind 500 */
background: #3b82f6;                                              /* Blue Tailwind 500 */
color: #1f2937;                                                   /* Gray-800 */
border-color: #e5e7eb;                                            /* Gray-200 */
```

These are statistically over-represented in generated UIs. Replace with one of the documented motion accents.

---

<a id="typography"></a>
## 4. TYPOGRAPHY SYSTEMS

### 4.1 The Display-Size Signature

**Motion sites have one massive display size that dominates the hero.** This is the most identifiable signal in the corpus.

| Site | Display size | Use |
|------|--------------|-----|
| Liquid Death | 60px | "MURDER YOUR THIRST" |
| Heavyweight | (no display, body 14-16) | Type itself is the display |
| Handshake | **201px** | "LET'S FIND YOUR NEXT JOB" |
| cthdrl | 121px | Hero centered |
| Superlative | 90px | Product title |
| MekaVerse | 80px | Section titles |
| HAPE PRIME | 40px (with extreme weights) | Editorial headlines |
| Moving Parts | **248px** | Massive Druk display |
| homunculus | (no display) | Compact 16px serif |

**Rule:** If you're building motion-heavy, the hero headline must be **at least 60px on mobile, 90-200+px on desktop**. Anything smaller belongs to a different category.

### 4.2 The Two-Font Pairing Pattern

7 of 9 sites use **exactly two typefaces** — a display + a body/UI:

| Site | Display | Body/UI |
|------|---------|---------|
| Liquid Death | Acumin Pro | Acumin Pro Condensed |
| Heavyweight | (Nuckle only) | Nuckle |
| Handshake | SansPlomb (sub: Anton) | NoiGrotesk (sub: Inter) |
| cthdrl | NB Akademie (sub: Montserrat) | NB Akademie Mono (sub: Space Mono) |
| Superlative | SL-Light | SL-Regular-Condensed |
| MekaVerse | Roobert (sub: Montserrat) | GT America Mono (sub: Roboto Mono) |
| HAPE PRIME | Integral CF (sub: Bebas Neue) | Neue Plak Extended (sub: Oswald) |
| Moving Parts | 10+ fonts (Druk, Unica77, PP Neue Montreal, Whyte, Fraunces, TAN-BUSTER...) | — |
| homunculus | Times (serif!) | urw-din |

**The exception that proves the rule:** Moving Parts uses 10+ fonts, but each has a *very* specific role and stylistic-set use. This is hyper-personalization, not soup.

### 4.3 The Display Pattern

Display fonts in the corpus share these traits:
- Heavy or extreme weights (700-900) OR custom display weights (400 on a hyper-extended/condensed face)
- **Negative letter-spacing** at large sizes: `-0.02em` to `-0.04em` (-1.936px at 121px → -2.94px at 98px → -4.02px at 201px)
- **Tight line-height**: 0.78 to 1.05
- Often uppercase at headline level
- Custom typeface, never system fonts

```css
/* Display font pattern */
.display {
  font-family: var(--font-display);
  font-weight: 700;          /* or 400 if it's a heavy/extended custom face */
  font-size: clamp(60px, 12vw, 200px);
  line-height: 0.85;          /* tight */
  letter-spacing: -0.02em;    /* negative */
  text-transform: uppercase;  /* often */
}
```

### 4.4 The Body/UI Pattern

Body fonts in motion sites tend toward:
- **Single weight (400)** — restraint over weight variation
- **Mono or Mono-feeling fonts** for "technical" sites (cthdrl, MekaVerse, Moving Parts)
- **Negative letter-spacing on body** at small sizes: `-0.02em` is canonical
- **Positive letter-spacing on uppercase nano-text**: `0.08em` for technical labels, `0.20em` for nav/social

```css
/* UI nano-text pattern */
.ui-label {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 11-13px;
  letter-spacing: 0.08em;     /* positive */
  text-transform: uppercase;
}

/* Body pattern */
.body {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 15-17px;
  line-height: 1.4-1.67;
  letter-spacing: -0.02em;    /* negative */
}
```

### 4.5 OpenType Features (Anti-Slop Critical)

3 of 9 sites explicitly use OpenType features:
- Handshake: `"ss03" on, "ss06" on, "ss12" on` (NoiGrotesk stylistic sets)
- MekaVerse: `"liga" 0` (ligatures OFF for technical look)
- Moving Parts: `"salt", "ss01", "ss02"..."ss09"` (massive stylistic set use)
- HAPE PRIME, homunculus, Liquid Death: implicit (custom fonts have built-in features)

Without these features, fonts default to "vanilla" letterforms that read as generic. **Motion-correct typography always opts into stylistic alternates.**

```css
.display {
  font-feature-settings: "ss01" on, "ss02" on, "salt" on;
  /* Or, to disable: */
  font-feature-settings: "liga" 0;
}
```

### 4.6 Type Scale Patterns

Most sites use a **modular scale** with a small ratio:

| Site | Base | Ratio | Type |
|------|------|-------|------|
| Liquid Death | 15px | 1.2 | Minor Third |
| Handshake | 16px | 1.125 | Major Second |
| cthdrl | 14px | 1.25 | Major Third |
| Superlative | 16px | 1.25 | Major Third |
| HAPE PRIME | 13px | 1.125 | Major Second |
| Moving Parts | 25px | 1.2 | Minor Third |
| homunculus | 16px | 1.067 | Minor Second |

**Rule:** Pick a ratio between 1.067 and 1.25. Tight ratios force restraint and prevent type-soup.

### 4.7 Letter-Spacing Rhythm

The most-overlooked motion-typography signal: **deliberate letter-spacing variance** between sizes.

```css
/* homunculus pattern: radical contrast across sizes */
.caption-12 { letter-spacing: -0.08em; }  /* compressed */
.label-14   { letter-spacing: 0.20em; }   /* expanded */

/* Liquid Death: progressive negative tracking */
.body-12  { letter-spacing: 0.0200em; }
.body-14  { letter-spacing: 0.0310em; }
.body-16  { letter-spacing: 0.0560em; }
.body-20  { letter-spacing: 0.0630em; }

/* cthdrl: extreme negative */
.body-mono { letter-spacing: -0.045em; }
.display   { letter-spacing: -0.016em; }
```

The goal: each size has a *purposeful* letter-spacing, not a default one.

---

<a id="spacing"></a>
## 5. SPACING & GEOMETRY

### 5.1 Base Unit

| Site | Base unit | Density |
|------|-----------|---------|
| Liquid Death | 4px | comfortable |
| Heavyweight | (irregular) | comfortable |
| Handshake | 8px | comfortable |
| cthdrl | (irregular) | spacious |
| Superlative | 8px | comfortable |
| MekaVerse | 4px | comfortable |
| HAPE PRIME | (irregular, dense) | comfortable |
| Moving Parts | 4px | comfortable |
| homunculus | (none, only 8/10) | compact |

**Rules:**
- 4px base = fine-grained motion-design
- 8px base = standard SaaS-derived
- Irregular = brand-specific (Heavyweight uses 4, 5, 7, 8, 10, 12, 18, 30 — only what's needed)
- Compact = 5-10px gaps (homunculus)
- Spacious = 25+px gaps (cthdrl)

### 5.2 Section Gap (The Vertical Rhythm Setter)

| Site | Section gap |
|------|-------------|
| Heavyweight | **166px** (extreme) |
| Liquid Death | (full-bleed bands instead) |
| Handshake | 24px |
| cthdrl | 26px |
| Superlative | 60px |
| MekaVerse | 40px |
| HAPE PRIME | 50px |
| Moving Parts | 40px |
| homunculus | (fluid scroll, no gaps) |

**Rules:**
- 24-40px = "tight rhythm, sections flow"
- 50-60px = "distinct sections with breathing room"
- 100+px = "deliberate, editorial, type-focused"
- Full-bleed bands (no measurable gap) = brutalist alternation

### 5.3 Card Padding

| Site | Card padding |
|------|--------------|
| Liquid Death | 24px |
| Heavyweight | 12px |
| Handshake | 16px |
| cthdrl | **0px** |
| Superlative | 30px |
| MekaVerse | 20px |
| HAPE PRIME | 0px vertical, 50px horizontal |
| Moving Parts | 30px |
| homunculus | 8px |

### 5.4 Element Gap (Inline Spacing)

| Site | Element gap |
|------|-------------|
| Liquid Death | (4-24px range) |
| Heavyweight | 12px |
| Handshake | 16px |
| cthdrl | 10px |
| Superlative | 15px |
| MekaVerse | 20px |
| HAPE PRIME | 6px |
| Moving Parts | 13px |
| homunculus | 10px |

**Rule:** Element gap ≤ 20px. Anything larger is a section gap, not an element gap.

### 5.5 The Spacing-Scale Pattern

Motion sites either use **standard 4px-multiples** or **irregular but-purposeful values**:

```css
/* Standard 4px-multiple */
--spacing-4: 4px;
--spacing-8: 8px;
--spacing-12: 12px;
--spacing-16: 16px;
--spacing-20: 20px;
--spacing-24: 24px;
/* etc. */

/* Or irregular, brand-specific (Heavyweight) */
--spacing-5: 5px;
--spacing-7: 7px;
--spacing-18: 18px;
--spacing-30: 30px;
```

**Rejection:** Don't use a 50-step scale. Pick 6-12 useful sizes. The corpus shows sites can ship with 6 spacing values total.

---

<a id="radius"></a>
## 6. BORDER RADIUS PATTERNS

### 6.1 The Bipolar Radius (Most Distinctive)

Motion sites either go **all sharp** or **bipolar** (sharp buttons + soft cards).

| Site | Buttons | Cards | Tags |
|------|---------|-------|------|
| Liquid Death | **0px** | 0px | 0px |
| Heavyweight | 11px | 11px | 11px |
| Handshake | 8px | 24px | **9999px** |
| cthdrl | **0px** | 0px | 0px |
| Superlative | 3px | 0px | 15px |
| MekaVerse | **2px** | **10px** | (containers 20px) |
| HAPE PRIME | **26px** | **0px** | (cards 0px) |
| Moving Parts | **0px** | **90.3833px** | 18px |
| homunculus | **0px** | 0px | 0px |

**Patterns:**
1. **All sharp (0px):** Liquid Death, cthdrl, homunculus — brutalist or minimalist
2. **All consistent (one value everywhere):** Heavyweight (11px) — uniform
3. **Bipolar (sharp buttons, soft cards):** HAPE PRIME (26px buttons, 0px cards), MekaVerse (2px buttons, 10-20px cards), Moving Parts (0px buttons, 90px cards)
4. **Multi-tier (small to medium):** Handshake (8/24/9999), Superlative (3/15/0)

### 6.2 The Extreme-Pill Pattern (Moving Parts)

Moving Parts uses border-radii that look like measurement errors but are deliberate:
- `--radius-cards: 90.3833px;`
- `--radius-largecards: 106.333px;`

These create cards that look like "clipped circles". Combined with 0px buttons, the contrast is the visual signature.

```css
/* Moving Parts signature card */
.feature-card {
  border-radius: 90.3833px;  /* yes, the decimals */
  background: #ffffff;
  padding: 30px;
}

/* Hero card with bottom-flat top-rounded */
.hero-card {
  border-radius: 106.333px 106.333px 0px 0px;  /* rounded top, sharp bottom */
}
```

### 6.3 The 26px-Pill (HAPE PRIME)

HAPE uses 26px on every button and link, creating a distinct stadium shape:

```css
.button-pill {
  border-radius: 26px;
  padding: 14px 32px;  /* derived from the visual examples */
}
```

### 6.4 Anti-Slop Rules for Radius

```css
/* ❌ Reject — the "Material Design 4" trap */
.button { border-radius: 8px; }    /* default Tailwind/shadcn */
.card   { border-radius: 12px; }   /* default everywhere */
.input  { border-radius: 6px; }    /* boring */

/* ✅ Pick a stance */
/* Stance 1: All sharp (brutalist) */
.button, .card, .input { border-radius: 0; }

/* Stance 2: All medium-rounded (Heavyweight uniform) */
.button, .card, .input { border-radius: 11px; }

/* Stance 3: Bipolar (HAPE PRIME) */
.button { border-radius: 26px; }
.card   { border-radius: 0; }

/* Stance 4: Extreme bipolar (Moving Parts) */
.button { border-radius: 0; }
.card   { border-radius: 90.3833px; }
```

The motion-correct move is to **commit** to a stance, not blend into the bland middle.

---

<a id="surface"></a>
## 7. SURFACE & ELEVATION

### 7.1 Elevation Through Color, Not Shadow

**Across all 9 sites, drop shadows are nearly absent.** The exceptions:
- Moving Parts: ONE shadow (`rgba(0,0,0,0.3) 15px 20px 30px 0px`) on cards
- Heavyweight: zero shadows
- All others: zero or oklab-translucent layering

```css
/* ❌ Reject — generic Material elevation */
.card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}

/* ✅ Use color stacking instead */
.card {
  background: var(--color-surface-frost);  /* slightly different from page bg */
  border: 1px solid var(--color-border);
  /* no shadow */
}
```

### 7.2 The Surface Hierarchy Pattern

Most sites define 2-4 surface levels:

```css
/* Pattern: Dark theme surfaces */
:root {
  --surface-0: #000000;  /* page bg */
  --surface-1: #141414;  /* elevated containers */
  --surface-2: #232323;  /* hover/interactive */
  --surface-3: #ffffff;  /* highlights/borders only */
}

/* Pattern: Light theme surfaces */
:root {
  --surface-0: #ffffff;
  --surface-1: #f3f5fa;  /* or #efefef, #f6f4f2 */
  --surface-2: #222222;  /* high-contrast accent */
}
```

### 7.3 Translucent Layering (oklab Pattern)

Handshake and MekaVerse use `oklab()` translucent colors for ghost surfaces:

```css
/* Translucent white card on gradient bg */
.feature-card {
  background: oklab(1 0 5.96046e-8 / 0.06);  /* 6% opacity white */
  border: 1px solid oklab(1 0 5.96046e-8 / 0.12);
  backdrop-filter: blur(12px);
}

/* Translucent dark border */
.ghost-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid #ffffff;
}
```

This is the motion-essential elevation: cards that **let the background show through** so animated bg gradients/imagery remain visible.

---

<a id="components"></a>
## 8. COMPONENT PATTERNS

### 8.1 The Ghost Button Family

8 of 9 sites use ghost buttons as their primary CTA pattern. Variations:

#### Variation A — Border-only Ghost
```css
.ghost-button {
  background: transparent;
  color: var(--color-text);
  border: 1px solid currentColor;
  border-radius: 0;
  padding: 12px 24px;
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```
Used by: Liquid Death (secondary), MekaVerse, Superlative, HAPE PRIME, cthdrl, homunculus

#### Variation B — Translucent Bg Ghost
```css
.ghost-button {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 2px;
  padding: 0 20px;
}
```
Used by: MekaVerse, Handshake (translucent surfaces)

#### Variation C — No-Padding Text Border
```css
.text-ghost {
  background: transparent;
  color: var(--color-text);
  border: 1px solid currentColor;
  padding: 0;
  border-radius: 0;
}
```
Used by: cthdrl

#### Variation D — Pill Ghost
```css
.pill-ghost {
  background: transparent;
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 26px;
  padding: 0 32px;
}
```
Used by: HAPE PRIME

### 8.2 Filled Buttons (When to Use)

Filled buttons in the motion corpus:
- Liquid Death: `Death Black` bg / `Bone White` text — CTA
- Handshake: `Guidepost Green` bg / `Stardust` text — primary CTA
- Moving Parts: `#0000ff` bg / `Canvas White` text — primary CTA
- MekaVerse: `Control Gray` bg / `Cloud White` text — secondary

```css
/* Filled CTA pattern */
.cta-filled {
  background: var(--color-accent);
  color: var(--color-text-on-accent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-buttons);
  padding: 12px 16px;
  font-family: var(--font-display);
  text-transform: uppercase;
}
```

### 8.3 Navigation Patterns

#### Pattern A — Minimal Top Bar (most common)
```html
<nav class="nav-bar">
  <a class="brand">Logo</a>
  <ul class="nav-links">
    <li><a class="nav-link">Work</a></li>
    <li><a class="nav-link">About</a></li>
  </ul>
  <a class="nav-cta">Contact</a>
</nav>
```

```css
.nav-bar {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: transparent;  /* often transparent! */
  z-index: 50;
}

.nav-link {
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

#### Pattern B — Vertical Nav (homunculus)
```css
.nav-vertical {
  position: fixed;
  right: 24px;
  bottom: 32px;
  writing-mode: vertical-rl;
  /* Letter rhythm via tracking */
  letter-spacing: 0.20em;
}
```

#### Pattern C — Two-Cluster Layout (Liquid Death, homunculus, Superlative)
- Top-left: brand mark
- Top-right: cluster of 3-5 ghost links + 1 CTA
- No center logo

### 8.4 Card Patterns

#### Pattern A — Solid Surface Card (Liquid Death, HAPE PRIME)
```css
.card-solid {
  background: var(--color-accent);  /* full saturation */
  color: var(--color-text);
  border-radius: 0;
  padding: 0 50px;  /* horizontal-only padding (HAPE pattern) */
}
```

#### Pattern B — Hairline Outline Card (MekaVerse, homunculus)
```css
.card-hairline {
  background: transparent;
  border: 1px solid var(--color-border-hairline);
  border-radius: 10px;
  padding: 20px;
}
```

#### Pattern C — Soft-Pill Card (Moving Parts)
```css
.card-pill {
  background: #ffffff;
  border-radius: 90.3833px;
  padding: 30px;
  /* The optional shadow */
  box-shadow: rgba(0, 0, 0, 0.3) 15px 20px 30px 0px;
}
```

#### Pattern D — Translucent Glass Card (Handshake)
```css
.card-glass {
  background: oklab(1 0 5.96046e-8 / 0.06);
  border-radius: 24px;
  padding: 16px;
  backdrop-filter: blur(12px);
}
```

### 8.5 Input Patterns

```css
/* Pattern A — Sharp brutalist (Liquid Death, cthdrl) */
.input-brutal {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 0;
  padding: 8px 12px;
  font-family: var(--font-mono);
}

/* Pattern B — Pill input (Handshake) */
.input-pill {
  background: #ffffff;
  color: #000000;
  border: 1px solid #14151c;
  border-radius: 24px;
  padding: 12px 24px 12px 64px;  /* 64px left for icon */
}

/* Pattern C — Hyper-padded (Moving Parts) */
.input-padded {
  background: #ffffff;
  color: #000000;
  border-radius: 0;
  padding: 25px 30px;  /* 25 vertical, 30 horizontal — large */
}
```

### 8.6 Tag / Badge Patterns

```css
/* Pattern A — Pill tag (Handshake) */
.tag-pill {
  background: oklab(0.19794 0.0021212 -0.0139539 / 0.1);
  color: #ffffff;
  border-radius: 9999px;
  padding: 4px 12px;
  font-family: var(--font-body);
  font-size: 14px;
}

/* Pattern B — Heavy-rounded badge (Superlative) */
.badge-heavy {
  background: var(--color-surface-white);
  color: var(--color-bg);
  border-radius: 15px;
  padding: 0 15px;       /* horizontal-only */
  font-family: var(--font-display-condensed);
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Pattern C — Outlined tag (Heavyweight) */
.tag-outlined {
  background: transparent;
  color: var(--color-accent-green);
  border: 1px solid var(--color-accent-green);
  border-radius: 11px;
  padding: 2px 8px;
  font-size: 11px;
}
```

### 8.7 Divider Pattern

```css
/* Hairline divider (homunculus, cthdrl) */
.divider {
  border: none;
  height: 1px;
  background: var(--color-text);  /* or muted gray */
  margin: 40px 0;
}

/* No divider — use band alternation instead (Liquid Death) */
section.dark { background: #000; color: #fff; }
section.light { background: #fff; color: #000; }
/* Place these adjacent for instant visual division */
```

---

<a id="motion"></a>
## 9. MOTION & ANIMATION PATTERNS

This is the namesake — the motion that makes a "motion-heavy" site.

### 9.1 The Hero Animation

Every site in the corpus animates its hero. Patterns observed:

#### 9.1.1 Animated Radial Gradient (Handshake, HAPE PRIME)
```css
@keyframes nebula-shift {
  0%   { background-position: 50% 0%; }
  50%  { background-position: 30% 20%; }
  100% { background-position: 50% 0%; }
}

.hero-nebula {
  background: radial-gradient(
    rgb(211, 251, 82) 0%,
    rgb(122, 243, 255) 52%,
    rgba(0, 0, 0, 0) 78%
  );
  background-size: 150% 150%;
  animation: nebula-shift 12s ease-in-out infinite;
}
```

#### 9.1.2 3D Object Rotation (MekaVerse, HAPE PRIME)
```jsx
// Three.js or React-Three-Fiber pattern
<mesh rotation={[0, frame * 0.001, 0]}>
  <hapeCharacter />
</mesh>
```
The 3D object rotates slowly in the hero. Full-bleed canvas behind text overlay.

#### 9.1.3 Iridescent Shader (homunculus)
```glsl
// Fragment shader for shimmering iridescent surface
vec3 iridescent = vec3(
  0.5 + 0.5 * cos(uv.x * 3.14 + time),
  0.5 + 0.5 * cos(uv.y * 3.14 + time + 2.0),
  0.5 + 0.5 * cos((uv.x + uv.y) * 3.14 + time + 4.0)
);
```
Or more practically with CSS:
```css
.iridescent-bg {
  background: conic-gradient(
    from 0deg at 50% 50%,
    rgba(255, 100, 150, 0.4),
    rgba(100, 200, 255, 0.4),
    rgba(150, 255, 200, 0.4),
    rgba(255, 150, 100, 0.4),
    rgba(255, 100, 150, 0.4)
  );
  filter: blur(80px);
  animation: spin 30s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### 9.1.4 Type Reveal (cthdrl, Heavyweight)
```css
.headline-reveal {
  display: inline-block;
  overflow: hidden;
}
.headline-reveal span {
  display: inline-block;
  transform: translateY(100%);
  animation: rise 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}
@keyframes rise {
  to { transform: translateY(0); }
}
/* Stagger via animation-delay per character */
```

#### 9.1.5 Full-Bleed Image Parallax (Liquid Death, Superlative)
```css
.hero-image {
  position: fixed;  /* or sticky */
  width: 100vw;
  height: 100vh;
  background-image: url('/hero.jpg');
  background-size: cover;
  background-position: center;
  /* On scroll: */
  transform: translateY(calc(var(--scroll) * 0.5px));  /* parallax */
}
```

### 9.2 Scroll-Triggered Reveals

```css
/* Pattern: fade-in + slight rise on intersection */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

```js
// Intersection observer toggles class
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### 9.3 Hover Transitions

The corpus heavily restricts what hover does:

```css
/* ✅ Motion-correct hover patterns */
.button:hover {
  background-color: var(--color-charcoal);  /* color shift only */
  transition: background-color 200ms ease;
}

.link:hover {
  /* Underline animation */
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 100% 1px;
  background-position: 0 100%;
  background-repeat: no-repeat;
  /* Or: subtle border appearance */
}

.ghost-button:hover {
  background: rgba(255, 255, 255, 0.05);  /* very subtle */
  transition: background 150ms ease;
}

/* ❌ Reject — generic SaaS hover patterns */
/* .button:hover { transform: translateY(-2px); box-shadow: ... } */  // material lift
/* .button:hover { transform: scale(1.05); }                         */  // pop scale
```

### 9.4 Marquee / Infinite Scroll

Common in motion sites for ticker-style text:
```css
.marquee {
  display: flex;
  overflow: hidden;
  width: 100%;
}
.marquee-track {
  display: flex;
  gap: 2rem;
  animation: scroll-x 30s linear infinite;
  flex-shrink: 0;
}
@keyframes scroll-x {
  to { transform: translateX(-50%); }
}
/* Duplicate content inside .marquee-track for seamless loop */
```

### 9.5 Cursor Effects

Motion sites often use custom cursors:
```css
body {
  cursor: none;
}
.custom-cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: transform 100ms ease;
  z-index: 9999;
}
```
```js
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
```

### 9.6 Section Transition Patterns

Motion sites alternate full-bleed bands. The transition itself is the motion:

```css
.section {
  width: 100vw;
  min-height: 100vh;
  display: grid;
  place-items: center;
}
.section.dark { background: #000; color: #fff; }
.section.light { background: #fff; color: #000; }
.section.brand { background: var(--color-accent); color: #fff; }

/* Optional: scroll-triggered scale-on-enter */
.section.scale-in {
  transform: scale(0.95);
  transition: transform 800ms cubic-bezier(0.65, 0, 0.35, 1);
}
.section.scale-in.in-view {
  transform: scale(1);
}
```

### 9.7 Scroll-Driven CSS Animations (Modern)

```css
/* Scroll-driven keyframes (Chromium 115+) */
@keyframes parallax {
  to { transform: translateY(-200px); }
}
.parallax-element {
  animation: parallax linear;
  animation-timeline: scroll(root);
}

/* View timeline (element-relative) */
.fade-in {
  animation: fadeIn linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 9.8 Transitions Library Config (Framer Motion / GSAP)

```jsx
// Framer Motion — motion-correct defaults
const sectionVariant = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] }
  }
};

const headlineVariant = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  }
};

// Stagger child reveals
const containerStagger = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.2 }
  }
};
```

```js
// GSAP — full-bleed band reveals
gsap.from('.section', {
  opacity: 0,
  y: 100,
  duration: 1.0,
  ease: 'expo.out',
  stagger: 0.15,
  scrollTrigger: {
    trigger: '.section',
    start: 'top 70%',
    toggleActions: 'play none none reverse'
  }
});
```

### 9.9 Easing Curves (Critical)

```css
/* The 4 motion-correct easings */
--ease-snap:    cubic-bezier(0.16, 1, 0.30, 1);    /* expo-out, type reveals */
--ease-glide:   cubic-bezier(0.65, 0, 0.35, 1);    /* in-out, section reveals */
--ease-pop:     cubic-bezier(0.34, 1.56, 0.64, 1); /* with bounce, sparingly */
--ease-linear:  linear;                             /* parallax/marquee only */
```

**Reject:** `ease`, `ease-in`, `ease-out`, `ease-in-out` (CSS defaults). Always specify a cubic-bezier.

### 9.10 Frame Rate & Performance

- Animate **only** `opacity`, `transform`, `filter`, and `background-position`
- Never animate `width`, `height`, `top/left/right/bottom`, `margin`, `padding`
- Use `will-change: transform` on heavily-animated elements
- Avoid > 3 simultaneous animations per viewport
- Throttle scroll listeners to `requestAnimationFrame`

---

<a id="layout"></a>
## 10. LAYOUT PATTERNS

### 10.1 The Full-Bleed Default

```css
/* Motion-correct base layout */
html, body { margin: 0; padding: 0; overflow-x: hidden; }
.section {
  width: 100vw;
  min-height: 100vh;          /* or 80vh for shorter bands */
  padding: 80px 24px;
  box-sizing: border-box;
}
```

### 10.2 The 3-Column Grid

```css
/* Used by Heavyweight, MekaVerse for content cards */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;  /* tight, motion-correct */
}
@media (max-width: 768px) {
  .grid-3 { grid-template-columns: 1fr; }
}
```

### 10.3 The Two-Column Asymmetric

```css
/* Used by HAPE PRIME, Moving Parts for feature blocks */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
}

/* Or asymmetric with content + image */
.text-image {
  display: grid;
  grid-template-columns: 4fr 6fr;  /* image dominant */
  gap: 30px;
}
```

### 10.4 The Single-Column Stack (Cthdrl, homunculus)

```css
.stack {
  max-width: none;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 26px;  /* the section gap */
}
```

### 10.5 The Hero Patterns

#### Hero A — Centered Headline + Sub + CTA (Handshake, Liquid Death)
```html
<section class="hero">
  <div class="hero-bg"></div>  <!-- gradient/image -->
  <h1 class="hero-headline">LET'S FIND YOUR NEXT JOB</h1>
  <p class="hero-sub">1M+ companies ready to hire</p>
  <button class="hero-cta">Get started</button>
</section>
```
```css
.hero {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 80px 24px;
}
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--gradient-hero);
}
.hero-headline {
  font-size: clamp(60px, 14vw, 201px);
  font-family: var(--font-display);
  letter-spacing: -0.04em;
  line-height: 0.85;
  text-transform: uppercase;
}
```

#### Hero B — Full-Bleed Image + Overlay (Superlative, MekaVerse)
```html
<section class="hero-image">
  <img class="hero-img" src="/product.webp" alt="" />
  <div class="hero-overlay">
    <h1>Product Name</h1>
    <p>Tagline</p>
  </div>
</section>
```

#### Hero C — Type-Only Hero (cthdrl, Heavyweight)
```css
.hero-type {
  background: #000;
  color: var(--color-ghost-sand);
  display: grid;
  place-items: center;
  min-height: 100vh;
}
.hero-type h1 {
  font-size: 121px;
  letter-spacing: -1.936px;
  line-height: 0.85;
}
```

### 10.6 Footer Patterns

Motion sites tend to keep footers minimal:
```css
.footer {
  background: var(--surface-bg);
  color: var(--surface-text);
  padding: 60px 24px;
  display: grid;
  gap: 24px;
  border-top: 1px solid var(--color-border);
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 40px;
}
```

### 10.7 Sticky Nav Pattern

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: transparent;        /* over hero */
  transition: background 300ms ease;
}
.nav.scrolled {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
}
```

```js
window.addEventListener('scroll', () => {
  document.querySelector('.nav').classList.toggle('scrolled', window.scrollY > 100);
});
```

---

<a id="imagery"></a>
## 11. IMAGERY & DECORATION

### 11.1 Imagery Strategies

| Strategy | Sites | When to use |
|----------|-------|-------------|
| Zero imagery (pure type/abstract) | cthdrl, Heavyweight | Type foundries, studios, agencies |
| Abstract shader/gradient only | homunculus | Creative tech, experimental |
| Full-bleed product photography | Liquid Death, Superlative | DTC, hardware |
| 3D rendered character/scene | MekaVerse, HAPE PRIME | Web3, fashion, gaming |
| Mix: product screens + decorative shapes | Moving Parts, Handshake | Premium SaaS |

### 11.2 Photography Style (When Used)

- **High contrast** (always)
- **Stark backgrounds** (solid color or gradient — never lifestyle)
- **Product-centric** (the product is the hero)
- **Sharp edges** (no soft lifestyle DOF)
- **Often monochrome or limited palette**

### 11.3 3D Rendering

If using 3D:
- Sci-fi / fantasy / character aesthetic preferred
- Dark moody lighting
- Single key light + rim light pattern
- Reflective/iridescent materials
- 60fps, ideally GLTF + KTX2 textures

### 11.4 Iconography

All 9 sites use the same icon style:
- **Outline only** (no filled icons)
- **1.5-2px stroke weight**
- **Monochromatic** (text color)
- **Geometric** (Lucide, Phosphor, Iconoir style)
- **Small** (16-20px)

```html
<!-- Lucide-style outline icon -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14M12 5l7 7-7 7" />
</svg>
```

### 11.5 Decorative Shapes

When used (Moving Parts, Handshake, MekaVerse):
- Geometric (circles, arcs, conic gradients)
- High saturation (the chromatic exception)
- Animated (rotation, float, morph)
- Behind/around content, never in front

---

<a id="anti-slop"></a>
## 12. ANTI-SLOP RULES (CRITICAL)

These are the rules that distinguish motion-canonical from "AI generated SaaS template".

### 12.1 Color Anti-Slop

❌ **REJECT** these defaults:
```css
/* The "Tailwind 500" trap */
--color-primary: #3b82f6;   /* blue-500 */
--color-primary: #6366f1;   /* indigo-500 */
--color-primary: #8b5cf6;   /* violet-500 */

/* The "purple gradient" trap */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);

/* The "every category has a color" trap */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-danger: #ef4444;
--color-info: #06b6d4;
```

✅ **USE** documented motion accents (one per project):
- Pure blue: `#0000ff` (Moving Parts)
- Lime green: `#d3fb52` (Handshake)
- Crimson: `#730200` (HAPE PRIME)
- Signal orange: `#e66f27` (Superlative — indicators only)
- Polished gold: `#d2ac5a` (Liquid Death)

### 12.2 Typography Anti-Slop

❌ **REJECT**:
- `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;` as primary face
- Inter as primary display (overused)
- 4-6 font weights in use simultaneously
- Default tracking (`letter-spacing: normal` everywhere)
- Multiple fonts without role differentiation

✅ **USE**:
- One display font + one body font (or one font in two widths)
- Custom fonts loaded via `@font-face` (or Adobe Typekit / Hoefler / Pangram Pangram / etc.)
- 1-2 weights total per face
- Deliberate letter-spacing per size
- OpenType features explicitly enabled

### 12.3 Radius Anti-Slop

❌ **REJECT**:
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
/* The "bland Material" cascade */
```

✅ **USE** one of:
- All 0px (brutalist)
- All same value (e.g., 11px uniform)
- Bipolar (sharp buttons + soft cards or vice versa)
- Extreme pill (90+px radius cards)

### 12.4 Shadow Anti-Slop

❌ **REJECT**:
```css
box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```

✅ **USE** color-stacking instead. If you must use a shadow, use ONE distinctive shadow:
```css
box-shadow: rgba(0,0,0,0.3) 15px 20px 30px 0px;  /* Moving Parts pattern */
```

### 12.5 Layout Anti-Slop

❌ **REJECT**:
- Centered max-width 1200px container as primary section
- 12-column grid templates everywhere
- Hero with logo + CTA + stock photo + "trusted by" row

✅ **USE**:
- Full-bleed sections by default
- Specific (not 12-column) grids: 2/3/4 columns
- Heroes that commit to ONE element (massive type OR full-bleed image OR centered gradient)

### 12.6 Animation Anti-Slop

❌ **REJECT**:
```css
.button:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.card:hover { transform: scale(1.02); }
@keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
/* with default 'ease-out' timing */
```

✅ **USE**:
- Cubic-bezier curves (never CSS keywords)
- Scroll-driven view-timeline animations where possible
- Type reveals, parallax, gradient shifts (not lift/scale)
- Single-axis transformations (translate-Y for reveals, rotate for shapes)

### 12.7 Component Anti-Slop

❌ **REJECT**:
- "Card with image-top + title + description + tag + arrow" — the LinkedIn pattern
- Filled CTA buttons in indigo/blue with white text + 8px radius
- Hero with H1 + subtitle + 2 buttons (primary + secondary outline)
- "Features" 3-column grid with icon-circle + title + 2 lines

✅ **USE**:
- Ghost buttons with brand-consistent styling
- Cards as solid color blocks OR hairline outlines (binary choice)
- Heroes committed to motion pattern (gradient, image, or type)
- Feature sections with editorial layout (not card-grid template)

---

<a id="decision"></a>
## 13. DECISION TREE: PICK YOUR ARCHETYPE

Use this tree to map a user's request to one of the 9 archetypes.

```
What is the brand's core energy?

├─ "Counter-culture / DTC / edgy"
│   → BRUTALIST DTC (Liquid Death)
│   → All sharp, uppercase, alternating black/white bands
│
├─ "Type-first / editorial / catalog"
│   → TYPE FOUNDRY MINIMALISM (Heavyweight)
│   → Light theme, 11px radius, 166px section gaps, large type display
│
├─ "Tech / energy / opportunity"
│   ├─ Has product to demo? → NEBULA GRADIENT HERO (Handshake)
│   │   → Animated radial gradient, ghost UI, 201px display
│   │
│   └─ Pure brand site? → STARK EDITORIAL DARK (cthdrl)
│       → 2 colors, type reveals, abstract line work
│
├─ "Hardware / instruments / technical"
│   → INSTRUMENT PANEL (Superlative)
│   → Multi-tier radius, full-bleed product photography, signal orange
│
├─ "Sci-fi / web3 / metaverse"
│   ├─ World-building? → HOLOGRAPHIC SCI-FI (MekaVerse)
│   │   → 3D bg, multiple decorative accents, Roobert + Mono
│   │
│   └─ Character/fashion? → NEON NOIR EDITORIAL (HAPE PRIME)
│       → 26px pill buttons, alternating crimson/black bands
│
├─ "Premium SaaS / design tooling"
│   → GEOMETRIC SOFT-CARDS (Moving Parts)
│   → Pure #0000ff CTA, 90px pill cards, multi-font typography
│
└─ "Studio / creative / experimental"
    → IRIDESCENT SHADER NIGHT (homunculus)
    → Times serif body, urw-din UI, full-bleed shader bg
```

### 13.1 Archetype Quick-Pick Cheatsheet

```
PALETTE_SIZE := count of distinct chromatic colors (excluding grays)
RADIUS_STANCE := "all-sharp" | "uniform" | "bipolar" | "extreme-pill"
DOMINANT_ANIMATION := "gradient" | "type-reveal" | "image-parallax" | "3d-rotation" | "shader" | "band-alternation"

ARCHETYPE_MATRIX:
  Liquid Death      → palette=2, radius=all-sharp,    animation=band-alternation + image
  Heavyweight       → palette=1, radius=uniform-11,    animation=type-reveal + scroll-fade
  Handshake         → palette=2, radius=bipolar-mid,  animation=gradient
  cthdrl            → palette=2, radius=all-sharp,    animation=type-reveal + line-art
  Superlative       → palette=2, radius=multi-tier,   animation=image-parallax
  MekaVerse         → palette=5, radius=bipolar-mid,  animation=3d-rotation
  HAPE PRIME        → palette=2, radius=extreme-pill, animation=3d-rotation + band
  Moving Parts      → palette=3, radius=extreme-pill, animation=gradient + shape
  homunculus        → palette=0, radius=all-sharp,    animation=shader
```

---

<a id="templates"></a>
## 14. CSS STARTER TEMPLATES

### 14.1 Brutalist DTC Template (Liquid Death-style)

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-bg-dark: #000000;
  --color-bg-elevated: #f5f5f5;
  --color-text: #151515;
  --color-text-on-dark: #ffffff;
  --color-text-muted: #727272;
  --color-border: #999999;
  --color-accent: #d2ac5a;
  --color-accent-hover: #8a6d35;

  /* Typography */
  --font-display: 'Acumin Pro', 'Inter', sans-serif;
  --font-display-condensed: 'Acumin Pro Condensed', 'Roboto Condensed', sans-serif;
  --font-body: 'Acumin Pro', 'Inter', sans-serif;

  --text-caption: 10px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subheading: 24px;
  --text-heading-sm: 36px;
  --text-heading: 45px;
  --text-display: 60px;

  --leading-display: 1;
  --leading-heading: 1.05;
  --leading-body: 1.67;

  --tracking-normal: 0.0200em;
  --tracking-loose: 0.0560em;

  /* Spacing */
  --space-unit: 4px;
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px;  --space-10: 40px;
  --space-12: 48px; --space-14: 56px; --space-16: 64px;

  /* Layout */
  --section-padding-y: 80px;
  --section-padding-x: 24px;
  --card-padding: 24px;

  /* Radius */
  --radius: 0;
  --radius-button: 0;
  --radius-card: 0;
  --radius-input: 0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--leading-body);
}

/* Section pattern: alternating full-bleed bands */
section {
  width: 100vw;
  padding: var(--section-padding-y) var(--section-padding-x);
}
section.dark {
  background: var(--color-bg-dark);
  color: var(--color-text-on-dark);
}
section.elevated {
  background: var(--color-bg-elevated);
}

/* Typography */
.display {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 700;
  line-height: var(--leading-display);
  text-transform: uppercase;
  letter-spacing: var(--tracking-loose);
}
.heading {
  font-family: var(--font-display);
  font-size: var(--text-heading);
  font-weight: 700;
  line-height: var(--leading-heading);
  text-transform: uppercase;
}

/* Buttons */
.btn {
  font-family: var(--font-display);
  font-size: var(--text-body);
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 0;
  padding: 8px 16px;
  cursor: pointer;
  border: 1px solid currentColor;
  transition: background-color 200ms ease;
}
.btn-primary {
  background: var(--color-bg-dark);
  color: var(--color-text-on-dark);
  border-color: var(--color-bg-dark);
}
.btn-secondary {
  background: transparent;
  color: var(--color-text);
}
.btn-primary:hover { background: var(--color-text-muted); }
```

### 14.2 Nebula Gradient Hero Template (Handshake-style)

```css
:root {
  --color-bg: #000000;
  --color-bg-elevated: #14151c;
  --color-text: #ffffff;
  --color-text-secondary: #666666;
  --color-accent: #d3fb52;
  --gradient-hero: radial-gradient(
    rgb(211, 251, 82) 0%,
    rgb(122, 243, 255) 52%,
    rgba(0, 0, 0, 0) 78%
  );

  --font-display: 'SansPlomb', 'Anton', sans-serif;
  --font-body: 'NoiGrotesk', 'Inter', sans-serif;

  --text-display: clamp(60px, 14vw, 201px);
  --text-heading-lg: 40px;
  --text-heading: 28px;
  --text-body: 16px;
  --text-caption: 12px;

  --leading-display: 0.8;
  --leading-heading: 1.1;
  --leading-body: 1.4;

  --tracking-display: -0.0200em;
  --tracking-body: -0.0150em;

  --space-unit: 8px;
  --space-1: 8px; --space-2: 16px; --space-3: 24px;
  --space-4: 32px; --space-5: 40px; --space-8: 64px;
  --space-10: 80px; --space-15: 120px;

  --section-padding-y: 80px;
  --card-padding: 16px;
  --element-gap: 16px;

  --radius-button: 8px;
  --radius-card: 24px;
  --radius-input: 24px;
  --radius-tag: 9999px;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-feature-settings: "ss03" on, "ss06" on, "ss12" on;  /* CRITICAL */
  letter-spacing: var(--tracking-body);
}

.hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--gradient-hero);
  background-size: 150% 150%;
  animation: nebula-drift 20s ease-in-out infinite;
}
@keyframes nebula-drift {
  0%, 100% { background-position: 50% 0%; }
  50%      { background-position: 30% 30%; }
}
.hero-headline {
  font-family: var(--font-display);
  font-size: var(--text-display);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
}

/* Translucent glass surfaces */
.glass-card {
  background: oklab(1 0 5.96046e-8 / 0.06);
  backdrop-filter: blur(16px);
  border: 1px solid oklab(1 0 5.96046e-8 / 0.12);
  border-radius: var(--radius-card);
  padding: var(--card-padding);
}

/* Buttons */
.btn-primary-filled {
  background: var(--color-accent);
  color: var(--color-bg);
  border-radius: var(--radius-button);
  padding: 12px 16px;
  font-family: var(--font-body);
  font-weight: 500;
  border: none;
  cursor: pointer;
}
.btn-ghost {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-bg-elevated);
  border-radius: var(--radius-button);
  padding: 16px;
  font-family: var(--font-body);
}
```

### 14.3 Stark Editorial Dark Template (cthdrl-style)

```css
:root {
  --color-bg: #000000;
  --color-text: #e7ded1;
  --color-divider: #e7ded1;

  --font-display: 'NB Akademie', 'Montserrat', sans-serif;
  --font-mono: 'NB Akademie Mono', 'Space Mono', monospace;

  --text-mono: 11px;
  --text-heading-sm: 32px;
  --text-heading: 35px;
  --text-display: 121px;

  --leading-display: 0.85;
  --leading-heading: 1;
  --leading-mono: 1.2;

  --tracking-display: -0.016em;
  --tracking-mono: -0.045em;

  --space-1: 10px; --space-2: 11px; --space-3: 26px;
  --space-4: 30px; --space-5: 50px; --space-6: 75px;

  --section-gap: 26px;
  --element-gap: 10px;
  --radius: 0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--text-mono);
  font-weight: 400;
  line-height: var(--leading-mono);
  letter-spacing: var(--tracking-mono);
  margin: 0;
}

.headline-display {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 400;
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
  /* Reveal on load */
  animation: type-rise 1.2s cubic-bezier(0.16, 1, 0.30, 1) both;
}
@keyframes type-rise {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.divider {
  border: none;
  height: 1px;
  background: var(--color-divider);
  margin: var(--section-gap) 0;
}

.btn-ghost-text {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
  font-family: var(--font-display);
  font-size: var(--text-heading-sm);
  letter-spacing: var(--tracking-display);
  padding: 0;
  cursor: pointer;
}
```

### 14.4 Geometric Soft-Cards Template (Moving Parts-style)

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-bg-soft: #efefef;
  --color-bg-dark: #000000;
  --color-bg-darker: #121212;
  --color-text: #000000;
  --color-text-on-dark: #ffffff;
  --color-text-muted: #999999;
  --color-text-subtle: #b3b3b3;
  --color-border-grid: #bcc1c7;
  --color-cta: #0000ff;        /* Pure RGB blue, the signature */
  --color-accent-emerald: #00d37c;

  /* Typography */
  --font-display: 'Druk XXCondensed Super', 'Oswald Condensed', sans-serif;
  --font-heading: 'PP Neue Montreal', 'Inter', sans-serif;
  --font-primary: 'Unica77', 'Roboto', sans-serif;
  --font-body: 'Whyte Semi-Mono', 'Space Mono', monospace;
  --font-special: 'TAN-BUSTER', 'Fraunces 72pt Soft', serif;

  --text-display-massive: clamp(80px, 18vw, 248px);
  --text-display-large: clamp(60px, 10vw, 110px);
  --text-heading-lg: clamp(40px, 6vw, 98px);
  --text-heading: 60px;
  --text-heading-sm: 27px;
  --text-subheading: 21px;
  --text-body: 17px;

  --leading-display: 0.82;
  --leading-heading: 0.85;
  --leading-body: 1.18;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px;  --space-10: 40px;
  --space-12: 48px; --space-14: 56px; --space-17: 68px; --space-20: 80px;

  --section-gap: 40px;
  --card-padding: 30px;
  --element-gap: 13px;

  /* Radius */
  --radius-small: 2.5px;
  --radius-image: 14px;
  --radius-icon: 18px;
  --radius-card: 90.3833px;       /* signature */
  --radius-large-card: 106.333px; /* signature */
  --radius-button: 0;             /* sharp */

  --shadow-card: rgba(0, 0, 0, 0.3) 15px 20px 30px 0px;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
}

/* The signature soft-pill card */
.soft-card {
  background: var(--color-bg);
  border-radius: var(--radius-card);
  padding: var(--card-padding);
  /* Optional shadow */
  box-shadow: var(--shadow-card);
}

/* Hero card with bottom-flat */
.hero-card {
  background: var(--color-cta);
  color: var(--color-text-on-dark);
  border-radius: var(--radius-large-card) var(--radius-large-card) 0 0;
  padding: 60px 30px;
}

/* The pure blue CTA */
.cta-blue {
  background: var(--color-cta);
  color: var(--color-bg);
  border: none;
  border-radius: var(--radius-button);
  padding: 25px 30px;
  font-family: var(--font-primary);
  font-weight: 500;
  cursor: pointer;
}

.headline-massive {
  font-family: var(--font-display);
  font-size: var(--text-display-massive);
  line-height: var(--leading-display);
  font-weight: 400;
}

.headline {
  font-family: var(--font-primary);
  font-size: var(--text-heading);
  line-height: var(--leading-heading);
  letter-spacing: -0.6px;
  /* Stylistic-set use */
  font-feature-settings: "ss01" on, "ss02" on, "ss03" on;
}
```

### 14.5 Iridescent Shader Night Template (homunculus-style)

```css
:root {
  --color-bg: #000000;
  --color-text: #ffffff;
  --color-elevated: #383838;
  --color-muted: #6f6f6f;
  --color-soft: #dddddd;

  --font-body: 'Times', serif;          /* SERIF body */
  --font-ui: 'urw-din', 'Segoe UI', Arial, sans-serif;

  --text-caption: 12px;
  --text-body-ui: 14px;
  --text-body: 16px;

  --leading: 1.2;
  --tracking-tight: -0.08em;
  --tracking-loose: 0.20em;

  --space-1: 8px;
  --space-2: 10px;
  --card-padding: 8px;
  --element-gap: 10px;

  --radius: 0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--leading);
  margin: 0;
  cursor: none;  /* custom cursor */
}

/* The iridescent shader bg */
.iridescent-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(at 25% 30%, rgba(255, 100, 200, 0.4), transparent 50%),
    radial-gradient(at 75% 70%, rgba(100, 200, 255, 0.4), transparent 50%),
    radial-gradient(at 50% 50%, rgba(200, 255, 150, 0.3), transparent 60%),
    #000;
  filter: blur(80px) saturate(1.2);
  animation: iridescent-shift 30s ease-in-out infinite;
}
@keyframes iridescent-shift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(20px, -30px) scale(1.05); }
  66%      { transform: translate(-30px, 20px) scale(0.95); }
}

.nav-link {
  font-family: var(--font-ui);
  font-size: 13px;
  letter-spacing: var(--tracking-loose);
  text-transform: uppercase;
  color: var(--color-text);
  text-decoration: none;
  transition: opacity 200ms ease;
}
.nav-link:hover { opacity: 0.6; }

.nav-link.social {
  font-size: 12px;
  letter-spacing: var(--tracking-tight);
}

.divider {
  border: none;
  height: 1px;
  background: var(--color-text);
  margin: 40px 0;
}

.scroll-indicator {
  font-family: var(--font-ui);
  font-size: 13px;
  letter-spacing: var(--tracking-loose);
  text-transform: uppercase;
  writing-mode: vertical-rl;
  position: fixed;
  right: 24px;
  bottom: 8px;
}
```

---

<a id="tailwind"></a>
## 15. TAILWIND V4 CONFIGURATIONS

### 15.1 Brutalist DTC (Liquid Death)

```css
@theme {
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

  --font-display: 'Acumin Pro', ui-sans-serif, system-ui, sans-serif;

  --text-caption: 10px;     --leading-caption: 1;
  --text-body-sm: 14px;     --leading-body-sm: 1.5;
  --text-body: 16px;        --leading-body: 1.67;
  --text-subheading: 24px;  --leading-subheading: 1.2;
  --text-heading-sm: 36px;  --leading-heading-sm: 1.13;
  --text-heading: 45px;     --leading-heading: 1.05;
  --text-display: 60px;     --leading-display: 1;

  --spacing: 4px;
  --radius-tags: 0;
  --radius-cards: 0;
  --radius-inputs: 0;
  --radius-buttons: 0;
}
```

### 15.2 Nebula Gradient Hero (Handshake)

```css
@theme {
  --color-deep-space: #000000;
  --color-midnight-core: #14151c;
  --color-cosmic-gray: #052326;
  --color-stardust: #ffffff;
  --color-guidepost-green: #d3fb52;
  --color-muted-text: #666666;

  --font-display: 'SansPlomb', 'Anton', sans-serif;
  --font-body: 'NoiGrotesk', 'Inter', sans-serif;

  --text-display: 201px;     --leading-display: 0.8;     --tracking-display: -4.02px;
  --text-heading-lg: 40px;   --leading-heading-lg: 0.85;
  --text-heading: 28px;      --leading-heading: 1.1;
  --text-heading-sm: 22px;   --leading-heading-sm: 1.1;
  --text-subheading: 20px;   --leading-subheading: 1.1;
  --text-body: 16px;         --leading-body: 1.4;

  --spacing: 8px;
  --radius-tags: 9999px;
  --radius-cards: 24px;
  --radius-inputs: 24px;
  --radius-buttons: 8px;
  --radius-buttons-large: 12px;
}
```

### 15.3 Geometric Soft-Cards (Moving Parts)

```css
@theme {
  --color-midnight-ink: #000000;
  --color-canvas-white: #ffffff;
  --color-ghostly-gray: #121212;
  --color-fog-grid: #bcc1c7;
  --color-warm-mist: #efefef;
  --color-cloud-gray: #b3b3b3;
  --color-pale-ash: #999999;
  --color-deep-royal-blue: #0000ff;
  --color-emerald-green: #00d37c;

  --font-display: 'Druk XXCondensed Super', 'Oswald Condensed', sans-serif;
  --font-heading: 'PP Neue Montreal', 'Inter', sans-serif;
  --font-primary: 'Unica77', 'Roboto', sans-serif;
  --font-body: 'Whyte Semi-Mono', 'Space Mono', monospace;

  --text-body: 17px;          --leading-body: 1.18;        --tracking-body: -0.1px;
  --text-subheading: 21px;    --leading-subheading: 1.2;
  --text-heading-sm: 27px;    --leading-heading-sm: 1.2;
  --text-heading: 60px;       --leading-heading: 0.85;     --tracking-heading: -0.6px;
  --text-heading-lg: 98px;    --leading-heading-lg: 0.82;  --tracking-heading-lg: -2.94px;
  --text-display: 248px;      --leading-display: 1.2;

  --spacing: 4px;

  --radius-buttons: 0;
  --radius-cards: 90.3833px;
  --radius-large-cards: 106.333px;
  --radius-icons: 18px;
  --radius-images: 14px;

  --shadow-xl: rgba(0,0,0,0.3) 15px 20px 30px 0px;
}
```

---

<a id="recipes"></a>
## 16. COMPONENT RECIPES

### 16.1 Brutalist DTC Hero

```html
<section class="hero-brutal">
  <div class="hero-bg-image">
    <img src="/product.webp" alt="" />
  </div>
  <div class="hero-content">
    <h1 class="hero-display">MURDER YOUR THIRST</h1>
    <button class="hero-cta">SHOP NOW</button>
  </div>
</section>
```

```css
.hero-brutal {
  position: relative;
  min-height: 100vh;
  width: 100vw;
  display: grid;
  place-items: center;
  background: #000;
  overflow: hidden;
}
.hero-bg-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  filter: contrast(1.2) saturate(0.8);
}
.hero-bg-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
}
.hero-display {
  font-family: 'Acumin Pro', sans-serif;
  font-size: clamp(60px, 10vw, 120px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 32px;
}
.hero-cta {
  background: #fff;
  color: #000;
  border: none;
  border-radius: 0;
  padding: 16px 32px;
  font-family: 'Acumin Pro', sans-serif;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 200ms ease;
}
.hero-cta:hover { background: #d2ac5a; }
```

### 16.2 Animated Nebula Hero

```jsx
// React component
export function NebulaHero({ headline, sub, ctaLabel }) {
  return (
    <section className="nebula-hero">
      <div className="nebula-bg" aria-hidden />
      <div className="nebula-content">
        <h1 className="nebula-headline">{headline}</h1>
        <p className="nebula-sub">{sub}</p>
        <button className="nebula-cta">{ctaLabel}</button>
      </div>
    </section>
  );
}
```

```css
.nebula-hero {
  position: relative;
  min-height: 100vh;
  background: #000;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.nebula-bg {
  position: absolute;
  inset: -10%;
  background: radial-gradient(
    rgb(211, 251, 82) 0%,
    rgb(122, 243, 255) 52%,
    rgba(0, 0, 0, 0) 78%
  );
  background-size: 120% 120%;
  filter: blur(40px);
  animation: nebula-drift 20s ease-in-out infinite, nebula-pulse 6s ease-in-out infinite;
}
@keyframes nebula-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(8%, -5%) scale(1.05); }
}
@keyframes nebula-pulse {
  0%, 100% { opacity: 0.85; }
  50%      { opacity: 1; }
}
.nebula-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
  padding: 0 24px;
}
.nebula-headline {
  font-family: 'SansPlomb', 'Anton', sans-serif;
  font-size: clamp(80px, 16vw, 220px);
  font-weight: 600;
  line-height: 0.8;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  margin: 0;
  /* Reveal */
  opacity: 0;
  transform: translateY(60px);
  animation: rise 1s cubic-bezier(0.16, 1, 0.30, 1) 0.2s both;
}
@keyframes rise {
  to { opacity: 1; transform: translateY(0); }
}
.nebula-sub {
  font-family: 'NoiGrotesk', 'Inter', sans-serif;
  font-size: 28px;
  margin: 24px auto;
  max-width: 600px;
  font-feature-settings: "ss03" on;
}
.nebula-cta {
  background: #d3fb52;
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: inherit;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  margin-top: 32px;
}
```

### 16.3 Stark Type Reveal

```jsx
// React component using Framer Motion
import { motion } from 'framer-motion';

export function TypeReveal({ children }) {
  const words = children.split(' ');
  return (
    <motion.h1
      className="type-reveal"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } }
      }}
    >
      {words.map((word, i) => (
        <span key={i} className="type-reveal-word">
          <motion.span
            className="type-reveal-inner"
            variants={{
              hidden: { y: '100%', opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.30, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}
```

```css
.type-reveal {
  font-family: 'NB Akademie', 'Montserrat', sans-serif;
  font-size: 121px;
  font-weight: 400;
  line-height: 0.85;
  letter-spacing: -0.016em;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25em;
}
.type-reveal-word {
  display: inline-block;
  overflow: hidden;
}
.type-reveal-inner {
  display: inline-block;
}
```

### 16.4 Iridescent Shader Background

```jsx
// React component with WebGL shader
import { useEffect, useRef } from 'react';

export function IridescentShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    // Setup shader, vertex/fragment...
    // Render loop with iridescent fluid simulation
  }, []);

  return <canvas ref={canvasRef} className="iridescent-canvas" />;
}
```

```css
.iridescent-canvas {
  position: fixed;
  inset: 0;
  z-index: -1;
  width: 100vw;
  height: 100vh;
}

/* CSS-only fallback */
.iridescent-css {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    conic-gradient(
      from 0deg at 30% 40%,
      rgba(255, 100, 200, 0.5),
      rgba(100, 200, 255, 0.5),
      rgba(150, 255, 200, 0.5),
      rgba(255, 200, 100, 0.5),
      rgba(255, 100, 200, 0.5)
    ),
    #000;
  filter: blur(120px) saturate(1.3);
  animation: iridescent-spin 40s linear infinite;
}
@keyframes iridescent-spin {
  to { transform: rotate(360deg) scale(1.2); }
}
```

### 16.5 Geometric Soft-Card

```html
<article class="soft-card">
  <h3 class="soft-card-title">Animation</h3>
  <p class="soft-card-body">Build interfaces that move with intention.</p>
  <a class="soft-card-link" href="#">
    Read more
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </a>
</article>
```

```css
.soft-card {
  background: #ffffff;
  color: #000;
  border-radius: 90.3833px;
  padding: 60px 50px;
  box-shadow: rgba(0,0,0,0.3) 15px 20px 30px 0px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
  font-family: 'Whyte Semi-Mono', 'Space Mono', monospace;
}
.soft-card-title {
  font-family: 'Unica77', 'Roboto', sans-serif;
  font-size: 32px;
  font-weight: 700;
  font-feature-settings: "ss01" on;
  margin: 0;
}
.soft-card-body {
  font-size: 17px;
  line-height: 1.18;
  margin: 0;
}
.soft-card-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0000ff;
  text-decoration: none;
  font-family: 'Unica77', sans-serif;
  font-size: 17px;
}
.soft-card-link svg {
  width: 18px;
  height: 18px;
  transition: transform 200ms ease;
}
.soft-card-link:hover svg {
  transform: translateX(4px);
}
```

### 16.6 Ghost Button Component

```jsx
export function GhostButton({ children, variant = 'border', ...props }) {
  return (
    <button className={`ghost-btn ghost-btn--${variant}`} {...props}>
      {children}
    </button>
  );
}
```

```css
.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  color: currentColor;
  border: 1px solid currentColor;
  border-radius: 0;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.65, 0, 0.35, 1);
}
.ghost-btn:hover {
  background: currentColor;
  color: var(--color-bg);
}

/* Variant: translucent */
.ghost-btn--translucent {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
}

/* Variant: pill */
.ghost-btn--pill {
  border-radius: 26px;
  padding: 14px 32px;
}

/* Variant: no-padding */
.ghost-btn--minimal {
  padding: 0;
  border-width: 1px;
  font-size: 32px;
}
```

### 16.7 Marquee Ticker

```html
<div class="marquee">
  <div class="marquee-track">
    <span class="marquee-item">★ NEW DROP</span>
    <span class="marquee-item">★ FREE SHIPPING</span>
    <span class="marquee-item">★ LIMITED EDITION</span>
    <span class="marquee-item">★ NEW DROP</span>
    <span class="marquee-item">★ FREE SHIPPING</span>
    <span class="marquee-item">★ LIMITED EDITION</span>
    <!-- duplicate for seamless loop -->
  </div>
</div>
```

```css
.marquee {
  width: 100%;
  overflow: hidden;
  background: #000;
  color: #fff;
  padding: 16px 0;
}
.marquee-track {
  display: flex;
  gap: 4rem;
  animation: scroll-x 30s linear infinite;
  white-space: nowrap;
}
.marquee-item {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
@keyframes scroll-x {
  to { transform: translateX(-50%); }
}
.marquee:hover .marquee-track {
  animation-play-state: paused;
}
```

### 16.8 Custom Cursor

```jsx
import { useEffect } from 'react';

export function CustomCursor() {
  useEffect(() => {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    document.body.style.cursor = 'none';

    let raf;
    let x = 0, y = 0;
    let cx = 0, cy = 0;
    const onMove = (e) => { x = e.clientX; y = e.clientY; };
    const tick = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      cursor.style.transform = `translate(${cx - 10}px, ${cy - 10}px)`;
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener('mousemove', onMove);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      cursor.remove();
      document.body.style.cursor = '';
    };
  }, []);

  return null;
}
```

```css
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border: 1px solid currentColor;
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  mix-blend-mode: difference;
  will-change: transform;
}
```

### 16.9 Scroll-Triggered Section Reveal

```jsx
import { useEffect, useRef } from 'react';

export function RevealSection({ children, delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add('in-view');
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="reveal-section" style={{ '--delay': `${delay}ms` }}>
      {children}
    </section>
  );
}
```

```css
.reveal-section {
  opacity: 0;
  transform: translateY(60px);
  transition:
    opacity 1s cubic-bezier(0.16, 1, 0.30, 1),
    transform 1s cubic-bezier(0.16, 1, 0.30, 1);
  transition-delay: var(--delay, 0ms);
}
.reveal-section.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

### 16.10 3D Object Hero (React Three Fiber)

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function Model() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2;
  });
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.3, 128, 16]} />
      <meshStandardMaterial color="#730200" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Model />
      <Environment preset="night" />
    </Canvas>
  );
}
```

```css
.hero-3d {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
}
.hero-3d-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero-3d-content {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  height: 100%;
  pointer-events: none;
  text-align: center;
  color: #fff;
}
```

---

<a id="checklist"></a>
## 17. VALIDATION CHECKLIST

Before shipping a motion-heavy page, verify:

### 17.1 Color Audit
- [ ] At most 1 chromatic CTA color (or none)
- [ ] At most 3 decorative chromatic colors (no CTAs)
- [ ] Dark theme uses 2-tier black (`#000` page + `#141414`-ish elevated)
- [ ] Light theme uses true white + 1-2 off-whites
- [ ] No Tailwind 500-tier defaults (`#3b82f6`, `#6366f1`, etc.)
- [ ] No purple→pink linear gradients

### 17.2 Typography Audit
- [ ] Display font is **custom** (not Inter, system-ui, etc.)
- [ ] Display has at least one size ≥ 60px (mobile) / 90px+ (desktop)
- [ ] Display has negative letter-spacing (e.g. -0.02em)
- [ ] Body has deliberate letter-spacing (negative or specific)
- [ ] At most 2 typefaces in active use (or 1 with widths)
- [ ] At most 2-3 weights total
- [ ] OpenType `font-feature-settings` is set (e.g. `"ss01" on` or `"liga" 0`)
- [ ] Type scale uses tight ratio (1.067-1.25)

### 17.3 Geometry Audit
- [ ] Border-radius commits to a stance (all-sharp / uniform / bipolar / extreme)
- [ ] No "Material 4" radius cascade (4/6/8/12)
- [ ] At most 1 box-shadow defined globally
- [ ] No drop-shadows on elevation (color-stacking instead)
- [ ] Spacing scale has 6-12 useful values (not 50)
- [ ] Section gap is purposeful (24px tight, 60px standard, 100+px editorial)

### 17.4 Layout Audit
- [ ] Hero is full-bleed (or full-viewport)
- [ ] Sections alternate or commit to single canvas
- [ ] No 12-column generic grids
- [ ] Centered max-width 1200px container is NOT the primary section pattern
- [ ] Nav is minimal (3-7 items max + 1 CTA)

### 17.5 Motion Audit
- [ ] Hero has at least one animated element (gradient, image parallax, type reveal, 3D, shader)
- [ ] All transitions use cubic-bezier easings (not CSS keywords)
- [ ] Hover states use color/border transitions, not `translateY(-2px)` lift
- [ ] Scroll reveals use Intersection Observer or view-timeline
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No animations on `width`/`height`/`top`/`left`/`margin`

### 17.6 Component Audit
- [ ] Buttons commit to ghost OR filled (no in-between)
- [ ] Cards commit to solid OR hairline OR glass (binary choice)
- [ ] Icons are outlined, monochromatic, geometric (Lucide/Phosphor style)
- [ ] No "card with image-top + title + description + tag + arrow" template
- [ ] No "Hero with H1 + sub + 2 buttons" SaaS template

### 17.7 Performance Audit
- [ ] Animations target 60fps (DevTools Performance > FPS meter)
- [ ] `will-change: transform` on heavily animated elements
- [ ] LCP < 2.5s (hero asset optimized)
- [ ] CLS < 0.1 (no layout shift from animations)
- [ ] Custom fonts use `font-display: swap`

### 17.8 Accessibility Audit
- [ ] All animations honor `@media (prefers-reduced-motion: reduce)`
- [ ] Color contrast AAA for body text, AA for large headlines
- [ ] Focus states are visible (custom or default)
- [ ] No motion-only content (provide static fallback)
- [ ] Custom cursor falls back to system cursor on touch

```css
/* Reduced motion fallback */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

<a id="cheatsheet"></a>
## 18. QUICK REFERENCE CHEATSHEET

### 18.1 The 30-Second Decision

```
PROMPT:                       PICK:
"motion-heavy"             →  Match user energy → archetype 1-9
"cinematic / dynamic"      →  MekaVerse, HAPE PRIME, Liquid Death
"editorial / bold type"    →  Heavyweight, cthdrl, Moving Parts
"SaaS / product"           →  Moving Parts, Handshake
"DTC / consumer"           →  Liquid Death, HAPE PRIME
"agency / studio"          →  cthdrl, homunculus
"sci-fi / web3"            →  MekaVerse, HAPE PRIME
"premium / refined"        →  Moving Parts, Heavyweight
"experimental / glitch"    →  homunculus, cthdrl
```

### 18.2 The 1-Minute Token Set

```css
/* Drop-in starter — pick a theme variant */
:root {
  /* Theme: Brutalist Light/Dark */
  --bg: #ffffff;
  --bg-dark: #000000;
  --text: #000000;
  --text-on-dark: #ffffff;
  --accent: #d2ac5a;
  --border: #999;

  --font-display: 'Acumin Pro', 'Inter', sans-serif;
  --font-body: var(--font-display);

  --radius: 0;
  --shadow: none;

  --space-section: 80px;
  --space-card: 24px;
  --space-element: 16px;
}

/* OR Theme: Nebula Dark */
:root {
  --bg: #000;
  --text: #fff;
  --accent: #d3fb52;
  --gradient: radial-gradient(rgb(211,251,82) 0%, rgb(122,243,255) 52%, rgba(0,0,0,0) 78%);
  --font-display: 'SansPlomb', 'Anton', sans-serif;
  --font-body: 'NoiGrotesk', 'Inter', sans-serif;
  --radius: 8px;
  --space-section: 24px;
}
```

### 18.3 Common Tasks

```
TASK:                      RECIPE:
"Add a CTA"             →  Ghost button (border-only) or solid accent button
"Make hero pop"         →  Display 90-200px + bg gradient/image/3D
"Section transition"    →  Alternate full-bleed bands (color flip)
"Add animation"         →  Pick from §9 (gradient drift, type reveal, parallax)
"Card design"           →  Solid color block OR hairline outline OR glass
"Nav design"            →  Minimal sticky with brand-left + ghost-links-right
"Footer"                →  Subdued, 2-4 columns, hairline divider top
"Form input"            →  Match button stance (sharp = sharp input, pill = pill input)
```

### 18.4 Code Snippets Index

| Snippet | Section |
|---------|---------|
| Ghost button (4 variants) | §8.1 |
| Filled CTA | §8.2 |
| Sticky nav | §10.7 |
| Solid card | §8.4 Pattern A |
| Hairline card | §8.4 Pattern B |
| Soft-pill card | §8.4 Pattern C |
| Glass card | §8.4 Pattern D |
| Marquee ticker | §16.7 |
| Custom cursor | §16.8 |
| Type reveal | §16.3 |
| Nebula hero | §16.2 |
| 3D hero | §16.10 |
| Iridescent shader | §16.4 |
| Scroll reveal | §16.9 |
| Reduced-motion fallback | §17.8 |

---

## 19. APPENDIX: SOURCE SITES

| # | Site | URL | Theme | Archetype |
|---|------|-----|-------|-----------|
| 1 | Liquid Death | liquiddeath.com | mixed | Brutalist DTC |
| 2 | Heavyweight | heavyweight-type.com | light | Type Foundry Minimalism |
| 3 | Handshake | joinhandshake.com | dark | Nebula Gradient Hero |
| 4 | cthdrl | cthdrl.co | dark | Stark Editorial Dark |
| 5 | Superlative | playsuperlative.com | dark | Instrument Panel |
| 6 | MekaVerse | themekaverse.com | dark | Holographic Sci-Fi |
| 7 | HAPE PRIME | hape.io | dark | Neon Noir Editorial |
| 8 | Moving Parts | movingparts.io | light | Geometric Soft-Cards |
| 9 | homunculus Inc. | homunculus.jp | dark | Iridescent Shader Night |

Each archetype's full DESIGN.md is preserved in `../../raw/motion/0X-<site>.md`.

---

## 20. VERSIONING

- **v1.0.0** (May 2026): Initial 9-site corpus. Built from Refero Styles category "Motion".
- Future: expand to 15+ sites; add Cyber Neon, Pastel, Bold Color, Editorial, Compact Type categories as separate skill files.

---

**END OF SKILL FILE**

> When using this skill, **commit to a single archetype** rather than blending. Each archetype is internally coherent — mixing them produces the slop this skill is designed to prevent.
