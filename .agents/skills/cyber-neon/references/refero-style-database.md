---
name: cyber-neon
description: |
  Cyber Neon aesthetic for the web — pure black canvas + vivid glowing accents.
  Use when user requests "cyberpunk", "developer terminal", "synthwave", "futuristic",
  "neon nebula", "deep space console", "glitch arcade", "data viz dark UI", or
  "cinematic dark with neon pops". Anti-slop: rejects generic Tailwind dark themes
  (#1f2937 + blue-500), Material dark cards with shadows, and the "every component
  glows" overuse of neon.
version: 1.0.0
category: design-taste
tags: [cyber-neon, dark-ui, neon-accents, terminal, cyberpunk, glitch, deep-space, gradient-glow]
sources:
  - chainzoku.io
  - open-sbs.brig.ht/city
  - neon.tech
  - jetbrains.com
  - off-white.valeriafrancis.com
---

# Cyber Neon — Design Skill

> **A skill for building dark-canvas, neon-accented websites that feel like server rooms, cyberpunk arcades, or deep-space command centers. Distilled from 5 award-winning Cyber Neon-tagged sites curated by Refero.**

---

## TABLE OF CONTENTS

1. [Philosophy](#philosophy)
2. [The 5 Cyber Neon Archetypes](#archetypes)
3. [Color Systems](#color)
4. [Typography Systems](#typography)
5. [Spacing & Geometry](#spacing)
6. [Border Radius Patterns](#radius)
7. [Surfaces & Glow Elevation](#surface)
8. [Component Patterns](#components)
9. [Motion & Glow Effects](#motion)
10. [Layout Patterns](#layout)
11. [Imagery & Decoration](#imagery)
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

### 1.1 Pure Black, Not Near-Black
Every Cyber Neon site uses **`#000000` absolute** as page background. This is non-negotiable. The corpus is unanimous:

> "Use #000000 as the absolute page background — never a near-black like #0a0a0a or #111; the true black is what makes the gradient glows feel luminous." — JetBrains DESIGN.md

> "Always use Midnight Void (#000000) as the default page background to maintain the stark, dark canvas." — OFF WHITE DESIGN.md

> "Use pure Blackout (#000000) for all main section backgrounds." — Neon.tech DESIGN.md

The single exception (Chainzoku) uses `#fffff7` (warm off-white) as page bg — but it's the outlier, with dark sections inside.

### 1.2 ONE Brand Accent + Restrained Decorative Glow
Despite "cyber neon" implying many colors, the discipline is restraint:

| Site | Primary accent | Decorative glow palette |
|------|---------------|-------------------------|
| Chainzoku | Electric Lime `#cdfb52` | Cyber Pink, Sky Blue, Crimson Glare, Olive Drab |
| SBS Town | Warning Amber `#ff7c24` | Cyber Glow Pink, Aqua Beam, Voltage Yellow, Infrared Red |
| Neon | Neon Glow `#34d59a` | (none — pure mono + green) |
| JetBrains | Deep Violet/Electric Blue | Multi-product chromatic icons + Neon Pink (sparingly) |
| OFF WHITE | Glitch Green `#00fb34` | Warning Red, Digital Yellow (outlines only) |

**Rule:** Pick ONE neon hue as your primary CTA color. Other neons can exist only as: (a) decorative outlines, (b) gradient stops, (c) per-product chromatic identity icons.

### 1.3 Glow Replaces Shadow
**Zero box-shadows.** Depth comes from:
- Layered near-black surfaces (#000 → #0a0a0b → #151617 → #242628)
- Translucent rgba/oklab fills (Cyber Pink at 20% opacity)
- Radial gradient glows behind content
- Backdrop blur on glass cards

> "Achieve depth by layering near-black surfaces (e.g., #151617 on #000000), not with box-shadows." — Neon.tech

### 1.4 Massive Display + Tiny UI Text
Cyber Neon hero displays go BIG (Chainzoku 301px, OFF WHITE 500px, JetBrains 79px), then UI text shrinks to mono labels (12-16px). Maximum tension between brand size and functional size.

### 1.5 Pill OR Sharp — Strict Dichotomy
Almost every Cyber Neon site uses a **shape dichotomy**:
- 9999px pill buttons + 4px sharp containers (Neon.tech)
- 100px pill EVERYTHING (SBS Town)
- 30px round links + 0px sharp UI (OFF WHITE)
- 26px pill buttons + 24px cards + 4px badges (JetBrains)
- 9999px pill button + 10px cards + 15px nav (Chainzoku)

**Rule:** Commit to a stance. Mix sharp + pill in a binary, not a cascade.

### 1.6 Custom Fonts (Code-Adjacent)
- Custom variable fonts: NeueHaasGrotDisp (Chainzoku), Druk Heavy, Circular, JetBrains Sans, GeistMono, Offwhite, Inter
- **Mono pairing common** (GeistMono with Inter, GT America Mono)
- Tight negative letter-spacing on display sizes

### 1.7 Imagery is Generative or 3D
- Abstract data-mesh visuals (Neon.tech, JetBrains)
- 3D rendered cityscapes (SBS Town)
- Stylized character/concept art (Chainzoku)
- Heavily-treated photo collages with neon borders (OFF WHITE)

**No stock photography. No lifestyle shots. No human warmth.**

---

<a id="archetypes"></a>
## 2. THE 5 CYBER NEON ARCHETYPES

### 2.1 NEON CYBERPUNK NIGHTSCAPE (Chainzoku)
**Vibe:** Dark gritty cyberpunk + warm off-white + character art
**Theme:** mixed (warm white #fffff7 base, dark accent sections)
**Palette:** Stark mono + Electric Lime CTA + Cyber Pink + Sky Blue + 8 supporting hues
**Typography:** Druk Heavy 100-301px display + NeueHaasGrotDisp body + Helvetica Neue callouts
**Radius:** 9999px pill buttons + 10px cards + 15px nav
**When to use:** Web3/NFT, character/IP brands, gaming, anime-adjacent

### 2.2 NEON CYBERPUNK METROPOLIS (SBS Town)
**Vibe:** Immersive 3D city map + multi-glow tags + ultra-minimal UI
**Theme:** dark (#111111)
**Palette:** Midnight Void + Cyber Glow Pink + Aqua Beam + Voltage Yellow + Infrared Red + Warning Amber
**Typography:** Circular 16px 400 only (single font, single size, single weight!)
**Radius:** 100px pill on EVERYTHING (uniform extreme)
**When to use:** Map/spatial UIs, game world tours, immersive experiences

### 2.3 SERVER ROOM AFTER DARK (Neon.tech)
**Vibe:** Pure black void + terminal green + monospace UI labels
**Theme:** dark (#000000)
**Palette:** 7-tier near-black scale + Whiteout + Neon Glow #34d59a (THE green)
**Typography:** Inter 80px display + GeistMono UI labels (-3.2px tracking on display!)
**Radius:** 9999px pill buttons + 4px sharp containers (signature dichotomy)
**When to use:** Developer tools, databases, infra/devops products

### 2.4 NEON NEBULA ON OBSIDIAN (JetBrains)
**Vibe:** Deep-space control room + violet-blue gradients + chromatic per-product icons
**Theme:** dark (#000000)
**Palette:** Multi-tier blacks + Violet Pulse + Iris + Deep Violet + Neon Pink + 5 gradient systems
**Typography:** JetBrains Sans single font (300-600), 13-79px range, custom letter-spacing per size
**Radius:** 24px cards + 26px pill buttons + 4-6px badges (multi-tier)
**When to use:** Multi-product platforms, IDE/dev tools, professional dev brand

### 2.5 NEON GLITCH ARCADE (OFF WHITE)
**Vibe:** Stark void + 3 unmissable neons + glitch image collage
**Theme:** dark (#000000)
**Palette:** Mono + Glitch Green + Warning Red + Digital Yellow (outline accents)
**Typography:** Offwhite custom font scaling to **500px** + Times serif body + Arial small
**Radius:** Strict binary — 0px OR 30px (no other values)
**When to use:** Editorial portfolios, fashion/streetwear, art-direction sites

---

<a id="color"></a>
## 3. COLOR SYSTEMS

### 3.1 The Pure Black Mandate

```css
:root {
  --bg-page: #000000;  /* MANDATORY for Cyber Neon */
}
```

Use any other "near-black" only for elevated surfaces, never as page bg.

### 3.2 The Multi-Tier Black Stack

Cyber Neon uses 5-7 tiers of near-black for layered depth:

```css
/* Neon.tech 7-tier black scale */
--blackout: #000000;         /* page bg */
--depth: #0a0a0b;            /* darkest pre-black */
--graphite-deep: #151617;    /* card bg */
--graphite: #242628;          /* secondary surface */
--graphite-light: #303236;   /* borders, dividers */
--ash: #797d86;              /* secondary text */
--pewter: #94979e;           /* tertiary text */
--cloud: #c9cbcf;            /* hover highlight */
--whiteout: #ffffff;         /* primary text */
```

```css
/* JetBrains compact 5-tier */
--obsidian: #000000;
--deep-charcoal: #19191c;
--graphite: #343434;
--iron: #474749;
--ash: #757577;
```

**Pattern:** Always layer surfaces by tinting darker → less dark → mid-gray → near-white. Never jump.

### 3.3 The Single Brand Neon

Choose ONE from the documented neons:

| Neon Hue | Hex | Best For |
|----------|-----|----------|
| Glitch Green | `#00fb34` | Arcade/editorial |
| Electric Lime | `#cdfb52` | Cyberpunk character/Web3 |
| Neon Glow | `#34d59a` | Developer/terminal |
| Cyber Glow Pink | `#ff00d9` | Map/spatial/holographic |
| Aqua Beam | `#00f0ff` | Data viz/info |
| Voltage Yellow | `#fff500` | Highlights/POI |
| Warning Amber | `#ff7c24` | CTA/alerts |
| Infrared Red | `#f0445d` | Urgency labels |
| Neon Pink | `#f31199` | Brand category labels |
| Deep Violet | `#2e106a` | Filled CTA bg |
| Violet Pulse | `#7b61ff` | Borders, badges |

### 3.4 The Decorative Multi-Glow (Optional)

If layering multiple neons:

```css
/* SBS Town: each neon has a specific role */
--cyber-glow-pink: #ff00d9;   /* decorative, NEVER CTA */
--aqua-beam: #00f0ff;          /* decorative, NEVER CTA */
--voltage-yellow: #fff500;     /* POI markers */
--infrared-red: #f0445d;       /* urgency tags */
/* Primary CTA stays separate */
```

**Rule:** Decorative neons are NEVER button backgrounds. They glow as outlines, gradient stops, or POI markers.

### 3.5 Gradients are Atmospheric

Three gradient roles in Cyber Neon:

```css
/* Hero Glow (radial spotlight) */
--hero-blue-glow: radial-gradient(
  87.36% 97.44% at 54.14% 23.32%,
  rgba(0, 71, 253, 0.8) 0px,
  rgba(0, 71, 253, 0.8) 15%,
  rgba(0, 0, 0, 0) 75%
);

/* Nebula Bloom (linear directional) */
--nebula-violet: linear-gradient(
  130deg,
  rgb(90, 31, 208) 10%,
  rgba(46, 16, 106, 0) 70%
);

/* Aurora Sweep (linear horizontal) */
--aurora-teal: linear-gradient(
  90deg,
  rgb(8, 222, 170) -12.99%,
  rgb(0, 170, 250) 176.77%
);

/* Scanline Fade (terminal effect) */
--scanline: linear-gradient(
  90deg,
  rgba(57, 165, 125, 0.6) 50%,
  rgba(0, 0, 0, 0) 50%
);
```

**Rule:** All gradients fade to transparent or near-black on at least one side.

### 3.6 Translucent Tinted Cards

```css
/* JetBrains pattern: glow-not-separate cards */
.violet-tinted-card {
  background: rgba(90, 31, 208, 0.3);   /* Violet at 30% */
  border-radius: 24px;
}
.pink-tinted-card {
  background: rgba(243, 17, 180, 0.2);  /* Pink at 20% */
  border-radius: 24px;
}
```

Cards "rise because their colored translucent fill catches the light of background gradients behind them" — depth through illumination, not stacking.

### 3.7 Color Anti-Slop

❌ **REJECT** generic dark templates:
```css
background: #1f2937;        /* slate-800 — too cool, too generic */
background: #0f172a;        /* slate-900 */
--accent: #3b82f6;          /* blue-500 — overused */
--accent: #10b981;          /* emerald-500 */
color: #cbd5e1;             /* slate-300 — generic body */
```

✅ **USE** documented Cyber Neon palettes:
```css
background: #000000;          /* pure black absolute */
--accent: #00fb34;            /* Glitch Green */
--accent: #34d59a;            /* Neon Glow */
--accent: #cdfb52;            /* Electric Lime */
color: #bababb;               /* Fog (JetBrains body) */
```

---

<a id="typography"></a>
## 4. TYPOGRAPHY SYSTEMS

### 4.1 Display Sizes — Bigger Than Anywhere Else

| Site | Display |
|------|---------|
| Chainzoku | **301px** Druk Heavy |
| SBS Town | (16px only — display IS the 3D scene) |
| Neon.tech | 80px Inter |
| JetBrains | 79px JetBrains Sans |
| OFF WHITE | **500px** Offwhite |

**Pattern:** Cyber Neon goes to extremes. 80-500px display sizes are common. Tight letter-spacing -0.02em to -3.2px at large sizes.

### 4.2 Font Pairings

```
NeueHaasGrotDisp (Chainzoku)  + Druk Heavy + Helvetica Neue
Circular (SBS Town)           — single font / single size
Inter + GeistMono (Neon.tech) — sans + mono
JetBrains Sans (JetBrains)    — single custom font, 4 weights
Offwhite + Times + Arial      — custom + serif + system
```

**Pattern:** Either ONE custom font (with multiple weights) OR sans+mono pairing. Never 4+ unrelated fonts.

### 4.3 Mono Fonts for Code/Labels

```css
--font-mono: 'GeistMono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
```

Used for:
- Code blocks
- UI nano-labels (10-13px)
- Data displays
- Tag badges (small caps with mono is canonical)
- Terminal simulations

### 4.4 OpenType Features (Required for Cyber Neon)

```css
.body {
  font-family: var(--font-jetbrains-sans);
  font-feature-settings: "calt", "kern", "liga";
}

/* Or for code-adjacent feel without ligatures */
.ui-mono {
  font-family: var(--font-mono);
  font-feature-settings: "liga" 0;
}
```

### 4.5 Type Scale — Negative Tracking Progressive

```css
/* Pattern: tighter at larger sizes */
--text-display-79: 79px;    /* tracking -0.395px */
--text-heading-43: 43px;    /* tracking -0.043px */
--text-body-20: 20px;       /* tracking 0 */
--text-body-sm-16: 16px;    /* tracking +0.032px */
--text-caption-13: 13px;    /* tracking +0.065px (positive!) */
```

Display gets negative tracking to feel "tight + technical". Caption gets positive tracking to feel "spaced + technical".

### 4.6 Body Text NOT White on Black

Critical Cyber Neon rule:

```css
/* ❌ Reject — pure white text on pure black for body */
body {
  background: #000;
  color: #ffffff;  /* too harsh */
}

/* ✅ Use a Fog-tier gray for body */
body {
  background: #000;
  color: #bababb;  /* Fog (JetBrains) — eye-friendly */
}
```

White (`#ffffff`) is reserved for headlines/buttons. Body uses #bababb / #c9cbcf / #fog tier.

---

<a id="spacing"></a>
## 5. SPACING & GEOMETRY

### 5.1 Section Gap (Bigger Than Most)

| Site | Section gap |
|------|-------------|
| Chainzoku | 50px |
| SBS Town | 43px |
| Neon.tech | 96-128px |
| JetBrains | 80-120px |
| OFF WHITE | 60-120px |

**Rule:** Cyber Neon section gaps are generous (50-128px). The dark canvas needs breathing room for glow accents to register.

### 5.2 Element Gap (Tight)

| Site | Element gap |
|------|-------------|
| Chainzoku | 8px |
| SBS Town | **5px** (extreme tight) |
| Neon.tech | 8-16px |
| JetBrains | 8-16px |
| OFF WHITE | 40px (outlier) |

**Rule:** Element gap 8-16px keeps UI dense and technical.

### 5.3 Page Max-Width

| Site | Max-width |
|------|-----------|
| Chainzoku | (full-bleed) |
| SBS Town | full-bleed (3D scene) |
| Neon.tech | 1200px |
| JetBrains | 1280px |
| OFF WHITE | full-bleed (no max) |

**Pattern:** Either full-bleed OR 1200-1280px max. Don't go smaller.

### 5.4 Card Padding

| Site | Card padding |
|------|--------------|
| Chainzoku | 40px |
| SBS Town | 20px |
| Neon.tech | 24px |
| JetBrains | 24px |
| OFF WHITE | 0px (no cards) |

---

<a id="radius"></a>
## 6. BORDER RADIUS PATTERNS

### 6.1 The Cyber Neon Shape Dichotomy

The most consistent pattern in the corpus:

| Site | Buttons | Cards | Badges | Stance |
|------|---------|-------|--------|--------|
| Chainzoku | 9999px | 10px | n/a | Pill + small |
| SBS Town | 100px | 100px | 100px | Uniform extreme pill |
| Neon.tech | **9999px** | **4px** | 4px | Pill button + sharp container |
| JetBrains | 20-26px | 24px | **4-6px** | Pill button + soft card + sharp badge |
| OFF WHITE | **30px** | n/a | n/a | Binary 0/30 only |

### 6.2 Recommendation: Pill Buttons + Sharp Containers

The most distinctive Cyber Neon stance:

```css
:root {
  --radius-buttons: 9999px;     /* full pill */
  --radius-cards: 4px;          /* sharp */
  --radius-inputs: 4px;
  --radius-badges: 4px;
}
```

This creates the signature "rounded action + rectangular structure" tension.

### 6.3 Alternative: Uniform Extreme Pill

```css
:root {
  --radius-buttons: 100px;
  --radius-cards: 100px;
  --radius-tags: 100px;
}
```

Used by SBS Town. Maximizes the "soft glow against hard void" feeling.

### 6.4 Anti-Slop Radius

❌ **REJECT** the Material cascade:
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
```

✅ **USE** the Cyber Neon dichotomy (just 2 values).

---

<a id="surface"></a>
## 7. SURFACES & GLOW ELEVATION

### 7.1 Layered Near-Black Surfaces

```css
:root {
  --surface-0: #000000;   /* page bg */
  --surface-1: #0a0a0b;   /* darkest elevated */
  --surface-2: #151617;   /* card bg */
  --surface-3: #242628;   /* hover/active */
  --surface-4: #303236;   /* borders, dividers */
}

.card {
  background: var(--surface-2);  /* sits 2 levels above page */
  border: 1px solid var(--surface-4);
}
```

### 7.2 Translucent Tinted Surfaces

```css
/* JetBrains glow-not-separate */
.violet-glass {
  background: rgba(90, 31, 208, 0.3);
  border-radius: 24px;
  backdrop-filter: blur(12px);  /* optional */
}
.pink-glass {
  background: rgba(243, 17, 180, 0.2);
}
```

### 7.3 Radial Glow Behind Content (Hero Pattern)

```css
.hero {
  position: relative;
  background: #000;
  min-height: 100vh;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    87.36% 97.44% at 54.14% 23.32%,
    rgba(0, 71, 253, 0.8) 0px,
    rgba(0, 71, 253, 0.8) 15%,
    rgba(0, 0, 0, 0) 75%
  );
  pointer-events: none;
  z-index: 0;
}
.hero-content {
  position: relative;
  z-index: 1;
}
```

### 7.4 NO Drop Shadows — Period

```css
/* ❌ Reject */
.card {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);  /* Material */
}

/* ✅ Use color-stacking + glow */
.card {
  background: var(--surface-2);  /* darker than page */
  border: 1px solid var(--surface-4);  /* subtle hairline */
}
```

The ONE exception: Neon.tech defines a single shadow `rgba(0, 0, 0, 0.4) 0px 8px 20px 0px` for very specific cases, but it's barely used.

---

<a id="components"></a>
## 8. COMPONENT PATTERNS

### 8.1 The Pill Accent Button (signature)

```css
.cn-pill-cta {
  background: var(--cn-accent);          /* the ONE neon */
  color: var(--cn-bg);                    /* contrasting dark */
  border: none;
  border-radius: 9999px;
  padding: 12px 28px;
  font-family: var(--cn-font-display);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 200ms ease;
}
.cn-pill-cta:hover {
  filter: brightness(1.1);  /* glow intensification */
}
```

### 8.2 The White Pill (JetBrains-style)

```css
.cn-pill-white {
  background: #ffffff;
  color: #19191c;
  border: none;
  border-radius: 9999px;
  padding: 12px 32px;
}
```

### 8.3 The Ghost Pill

```css
.cn-pill-ghost {
  background: transparent;
  color: #ffffff;
  border: 1px solid var(--surface-4);
  border-radius: 9999px;
  padding: 12px 18px;
}
```

### 8.4 The Filled Neon Filled Button (OFF WHITE-style)

```css
.cn-filled-flat {
  background: var(--cn-accent);
  color: var(--cn-bg);
  border: none;
  border-radius: 0;        /* sharp! */
  padding: 16px 32px;
}
```

### 8.5 The Translucent Glass Card

```css
.cn-glass-card {
  background: rgba(90, 31, 208, 0.3);
  border: 1px solid var(--cn-accent-glow);
  border-radius: 24px;
  padding: 24px;
  backdrop-filter: blur(12px);
}
```

### 8.6 The Sharp Container Card

```css
.cn-sharp-card {
  background: var(--surface-2);
  border-radius: 4px;
  padding: 24px;
}
```

### 8.7 The Tag Badge (small, sharp, mono)

```css
.cn-badge {
  background: var(--cn-accent);
  color: var(--cn-bg);
  border-radius: 4px;
  padding: 1px 7px;
  font-family: var(--cn-font-mono);
  font-size: 13px;
  font-weight: 500;
  font-feature-settings: "calt", "kern", "liga";
  text-transform: uppercase;
}
```

### 8.8 The Tab-Style Top-Rounded Badge (JetBrains)

```css
.cn-tab-badge {
  background: rgba(107, 87, 255, 0.5);
  color: #ffffff;
  border-radius: 6px 6px 0 0;     /* top-only rounded */
  padding: 5px 11px;
}
```

### 8.9 Navigation Bar (transparent, no border)

```css
.cn-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: rgba(25, 25, 28, 0.85);  /* deep charcoal w/ slight transparency */
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  z-index: 50;
  /* NO border-bottom */
}
.cn-nav-link {
  color: #ffffff;
  font-family: var(--cn-font-display);
  font-size: 16px;
  text-decoration: none;
  padding: 10px;
  transition: opacity 200ms ease;
}
.cn-nav-link:hover { opacity: 0.7; }
```

### 8.10 Audience Tab Selector (JetBrains)

```css
.cn-tab-row {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: transparent;
}
.cn-tab {
  background: transparent;
  color: var(--cn-text-muted);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
}
.cn-tab.active {
  border: 1px solid var(--cn-accent);
  color: #ffffff;
}
```

---

<a id="motion"></a>
## 9. MOTION & GLOW EFFECTS

### 9.1 The Hero Radial Glow (Animated)

```css
.hero-glow-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    rgba(0, 71, 253, 0.8) 0%,
    rgba(0, 71, 253, 0.5) 15%,
    transparent 75%
  );
  animation: glow-pulse 8s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%      { opacity: 1.0;  transform: scale(1.05); }
}
```

### 9.2 Scanline Effect (Terminal)

```css
.scanline-overlay {
  position: relative;
  overflow: hidden;
}
.scanline-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    transparent 50%,
    rgba(255, 255, 255, 0.03) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  animation: scanline-roll 8s linear infinite;
}
@keyframes scanline-roll {
  to { transform: translateY(8px); }
}
```

### 9.3 Glow Hover Intensification

```css
.cn-pill-cta {
  background: var(--cn-accent);
  box-shadow: 0 0 0 0 var(--cn-accent);
  transition: box-shadow 300ms cubic-bezier(0.16, 1, 0.30, 1);
}
.cn-pill-cta:hover {
  box-shadow: 0 0 24px 0 var(--cn-accent-glow);
}
```

(The single allowed "shadow" — actually a glow.)

### 9.4 Glitch Text Effect (OFF WHITE)

```css
.glitch-text {
  position: relative;
  color: #fff;
  text-shadow: 2px 0 #ff0000, -2px 0 #00fb34;
  animation: glitch-shift 3s steps(3) infinite;
}
@keyframes glitch-shift {
  0%, 90%, 100% { text-shadow: 2px 0 #ff0000, -2px 0 #00fb34; }
  92% { text-shadow: -2px 0 #ff0000, 2px 0 #00fb34; }
  94% { text-shadow: 2px 2px #ff0000, -2px -2px #00fb34; }
}
```

### 9.5 Per-Product Chromatic Icon Shimmer

```css
.product-icon {
  background: linear-gradient(135deg, #ff8100, #ff3621, #5a1fd0);
  border-radius: 16px;
  width: 32px;
  height: 32px;
  transition: filter 200ms ease;
}
.product-icon:hover {
  filter: brightness(1.2) drop-shadow(0 0 8px currentColor);
}
```

### 9.6 Easings (Cyber Neon Specific)

```css
:root {
  --ease-snap:    cubic-bezier(0.16, 1, 0.30, 1);   /* type reveals */
  --ease-glide:   cubic-bezier(0.65, 0, 0.35, 1);   /* gradient shifts */
  --ease-pulse:   ease-in-out;                       /* glow breathing */
}
```

### 9.7 Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .hero-glow-bg, .scanline-overlay::after {
    animation: none;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

<a id="layout"></a>
## 10. LAYOUT PATTERNS

### 10.1 The Hero with Radial Glow

```html
<section class="cn-hero">
  <div class="cn-hero-glow" aria-hidden></div>
  <h1 class="cn-display">Purpose-Built IDEs for Every Stack</h1>
  <p class="cn-sub">Tools made for the way you write code.</p>
  <div class="cn-actions">
    <button class="cn-pill-white">Choose Your IDE</button>
    <button class="cn-pill-ghost">Read the docs</button>
  </div>
</section>
```

```css
.cn-hero {
  position: relative;
  min-height: 100vh;
  background: #000;
  display: grid;
  place-items: center;
  text-align: center;
  overflow: hidden;
  padding: 80px 24px;
}
.cn-hero-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    87.36% 97.44% at 54.14% 23.32%,
    rgba(0, 71, 253, 0.8) 0px,
    rgba(0, 71, 253, 0.8) 15%,
    transparent 75%
  );
  animation: glow-pulse 8s ease-in-out infinite;
}
.cn-hero > * { position: relative; z-index: 1; }
.cn-display {
  font-family: var(--cn-font-display);
  font-size: clamp(60px, 12vw, 120px);
  font-weight: 600;
  line-height: 1.0;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
}
```

### 10.2 The Sticky Sidebar Layout (Chainzoku)

```css
.cn-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.cn-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  background: #000;
  border-right: 1px solid #303236;
  padding: 24px;
}
```

### 10.3 The Card Carousel

```css
.cn-carousel {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 16px;
}
.cn-carousel-card {
  scroll-snap-align: start;
  flex: 0 0 80vw;
  background: rgba(90, 31, 208, 0.3);
  border: 1px solid #5a1fd0;
  border-radius: 24px;
  padding: 64px;
}
```

### 10.4 Image Collage (OFF WHITE)

```css
.cn-collage {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 0;
}
.cn-collage-item {
  border: 1px solid #000;
  position: relative;
  overflow: hidden;
}
.cn-collage-item:nth-child(1) { grid-column: 1 / 6; grid-row: 1 / 5; }
.cn-collage-item:nth-child(2) { grid-column: 6 / 12; grid-row: 2 / 6; transform: translate(-10%, 10%); }
/* etc — overlapping intentional */
```

### 10.5 The Multi-Product Icon Grid (JetBrains)

```css
.cn-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 16px;
  padding: 32px 0;
}
.cn-product-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.cn-product-item img {
  width: 32px;
  height: 32px;
  border-radius: 16px;
}
.cn-product-item span {
  font-family: var(--cn-font-display);
  font-size: 13px;
  color: #bababb;
}
```

---

<a id="imagery"></a>
## 11. IMAGERY & DECORATION

### 11.1 Imagery Strategies

| Site | Strategy |
|------|----------|
| Chainzoku | Stylized character/concept art (full-bleed) |
| SBS Town | 3D rendered futuristic cityscape (full viewport) |
| Neon.tech | Abstract data-mesh / generative graphics |
| JetBrains | Abstract 3D wireframe meshes + IDE screenshots |
| OFF WHITE | Treated photo collages with neon borders |

### 11.2 Common Imagery Rules

- **No photography of real-world people doing tasks** (the SaaS lifestyle stock photo)
- **No nature/outdoor photography**
- Either: 3D rendered, generative abstract, or heavily stylized character art
- If photos: tight crops, high contrast, neon-bordered

### 11.3 Iconography

**Two patterns:**

#### Pattern A — Outlined monochromatic
```html
<!-- Like Neon.tech, JetBrains nav -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="..." />
</svg>
```

#### Pattern B — Per-product chromatic
```html
<!-- JetBrains product icons, each unique gradient -->
<div class="product-icon" style="background: linear-gradient(135deg, #ff8100, #ff3621, #5a1fd0);"></div>
```

### 11.4 Decorative Elements

- **Scanlines** (terminal effect)
- **Wireframe geometry** (JetBrains)
- **Glitch artifacts** (OFF WHITE)
- **Glowing dots/POI markers** (SBS Town)
- **Abstract data streams** (Neon.tech)

### 11.5 Cursor Treatment (Optional)

```css
body.cyber-cursor {
  cursor: none;
}
.custom-cursor {
  position: fixed;
  width: 16px;
  height: 16px;
  border: 1px solid var(--cn-accent);
  border-radius: 0;        /* often square in cyber */
  pointer-events: none;
  mix-blend-mode: difference;
  transition: transform 80ms linear;
}
```

---

<a id="anti-slop"></a>
## 12. ANTI-SLOP RULES

### 12.1 Color Anti-Slop

❌ REJECT:
```css
background: #1f2937;    /* slate-800 — generic dark theme */
background: #0f172a;    /* slate-900 */
--accent: #3b82f6;      /* blue-500 — overused as primary */
--accent: #8b5cf6;      /* violet-500 — Tailwind cliché */
color: #94a3b8;         /* slate-400 — generic body */
```

✅ USE:
```css
background: #000000;     /* pure black mandatory */
--accent: #00fb34;       /* Glitch Green */
--accent: #34d59a;       /* Neon Glow */
--accent: #cdfb52;       /* Electric Lime */
color: #bababb;          /* Fog body text */
```

### 12.2 Typography Anti-Slop

❌ REJECT:
- Inter as default-everywhere
- 4+ unrelated fonts
- Headings smaller than 60px (motion-correct displays go BIG)

✅ USE:
- Single custom font OR sans+mono pairing
- Display sizes 60-300+px
- Negative letter-spacing on display (-0.02 to -3.2px)
- OpenType features explicitly enabled

### 12.3 Radius Anti-Slop

❌ REJECT:
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
/* Material cascade */
```

✅ USE:
- Pill (9999px / 100px / 30px) on buttons
- Sharp (0-4px) on containers
- OR uniform extreme pill everywhere

### 12.4 Elevation Anti-Slop

❌ REJECT:
```css
box-shadow: 0 4px 6px rgba(0,0,0,0.1);    /* Material */
box-shadow: 0 1px 3px rgba(0,0,0,0.12);   /* generic depth */
```

✅ USE:
- Layered near-black surfaces
- Translucent rgba tinted cards
- Radial glow gradients
- Single allowed "shadow" = a glow `box-shadow: 0 0 24px var(--accent)`

### 12.5 Hero Anti-Slop

❌ REJECT:
- Hero with logo + sub + 2 buttons + stock photo
- Glassmorphism with `backdrop-filter: blur()` everywhere
- Generic "trusted by" logo bar

✅ USE:
- Full-viewport hero with radial glow centered
- Massive display headline (60-300px)
- ONE filled pill CTA + ONE ghost pill CTA
- 3D mesh / abstract data-viz / generative graphic in lower fold

### 12.6 Component Anti-Slop

❌ REJECT:
- `border + soft-shadow + 12px-radius` shadcn cards
- Generic outlined Material buttons with focus ring
- Filled blue/indigo CTAs everywhere

✅ USE:
- Translucent rgba glass cards with neon border
- Pill ghost buttons with subtle glow on hover
- Single neon CTA paired with white pill or ghost outline

---

<a id="decision"></a>
## 13. DECISION TREE

```
What is the brand's product?

├─ "Web3 / NFT / character / gaming"
│   → NEON CYBERPUNK NIGHTSCAPE (Chainzoku)
│   → Druk Heavy 100-301px + 9999px pill + character art
│
├─ "Spatial / map / world tour / immersive"
│   → NEON CYBERPUNK METROPOLIS (SBS Town)
│   → 3D city + 100px pill on EVERYTHING + Circular 16/400 only
│
├─ "Developer tools / database / infra / devops"
│   → SERVER ROOM AFTER DARK (Neon.tech)
│   → Pure black + Neon Glow #34d59a + Inter + GeistMono + 9999px/4px dichotomy
│
├─ "Multi-product platform / IDE / professional dev"
│   → NEON NEBULA ON OBSIDIAN (JetBrains)
│   → JetBrains Sans + 5-gradient system + chromatic per-product icons + 24/26/4-6px multi-tier
│
└─ "Editorial / fashion / streetwear / art-direction"
    → NEON GLITCH ARCADE (OFF WHITE)
    → Custom font 500px display + binary 0/30px radius + image collage with neon borders
```

---

<a id="templates"></a>
## 14. CSS STARTER TEMPLATES

### 14.1 Server Room (Neon.tech)

```css
:root {
  /* Colors */
  --bg: #000000;
  --surface-1: #0a0a0b;
  --surface-2: #151617;
  --surface-3: #242628;
  --border: #303236;
  --text-primary: #ffffff;
  --text-secondary: #bababb;
  --text-muted: #797d86;
  --accent: #34d59a;
  --accent-dim: #285d49;
  --warning: #ff3621;

  /* Typography */
  --font-display: 'Inter', sans-serif;
  --font-mono: 'GeistMono', 'JetBrains Mono', monospace;

  /* Type scale */
  --text-display: 80px;     --leading-display: 1;       --tracking-display: -3.2px;
  --text-heading-lg: 48px;  --leading-heading-lg: 1.13; --tracking-heading-lg: -1.2px;
  --text-heading: 32px;     --leading-heading: 1.25;    --tracking-heading: -0.64px;
  --text-body: 16px;        --leading-body: 1.5;        --tracking-body: -0.43px;
  --text-caption: 12px;     --leading-caption: 1.5;     --tracking-caption: -0.7px;

  /* Spacing */
  --space-section: 96px;
  --space-card: 24px;
  --space-element: 8px;
  --max-width: 1200px;

  /* Radius — bipolar */
  --radius-buttons: 9999px;
  --radius-cards: 4px;
  --radius-inputs: 4px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text-secondary);   /* NOT pure white! */
  font-family: var(--font-display);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
}

.display {
  font-size: var(--text-display);
  font-weight: 500;
  color: var(--text-primary);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
}

.cta-pill {
  background: var(--text-primary);   /* white */
  color: var(--surface-2);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 12px 28px;
  font-family: inherit;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
}

.ghost-pill {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-buttons);
  padding: 12px 18px;
  font-family: inherit;
  cursor: pointer;
}

.mono-label {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-feature-settings: "liga" 0;
}

.code-block {
  background: var(--surface-2);
  border-radius: var(--radius-cards);
  padding: var(--space-card);
  font-family: var(--font-mono);
  color: var(--text-primary);
}
```

### 14.2 Deep Space Console (JetBrains)

```css
:root {
  --bg-void: #000000;
  --bg-charcoal: #19191c;
  --text-primary: #ffffff;
  --text-fog: #bababb;
  --text-ash: #757577;

  --accent-violet: #7b61ff;
  --accent-iris: #6b57ff;
  --accent-deep-violet: #2e106a;
  --accent-electric-blue: #18a3fa;
  --accent-neon-pink: #f31199;

  --font-display: 'JetBrains Sans', 'Inter', sans-serif;

  --hero-glow: radial-gradient(
    87.36% 97.44% at 54.14% 23.32%,
    rgba(0, 71, 253, 0.8) 0px,
    rgba(0, 71, 253, 0.8) 15%,
    rgba(0, 0, 0, 0) 75%
  );
  --nebula-violet: linear-gradient(130deg, rgb(90, 31, 208) 10%, rgba(46, 16, 106, 0) 70%);

  --radius-buttons: 26px;
  --radius-cards: 24px;
  --radius-badges: 4px;
  --max-width: 1280px;
}

body {
  background: var(--bg-void);
  color: var(--text-fog);
  font-family: var(--font-display);
  font-feature-settings: "calt", "kern", "liga";
}

.cn-hero {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
  overflow: hidden;
  padding: 120px 24px;
}
.cn-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--hero-glow);
  pointer-events: none;
}
.cn-hero > * { position: relative; z-index: 1; }

.display {
  font-size: clamp(48px, 10vw, 79px);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 0.9;
  letter-spacing: -0.005em;
}

.cta-white {
  background: #ffffff;
  color: var(--bg-charcoal);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 12px 32px;
  font-weight: 500;
  cursor: pointer;
}

.cta-violet {
  background: var(--accent-deep-violet);
  color: var(--accent-electric-blue);
  border: 1px solid var(--accent-violet);
  border-radius: 16px;
  padding: 24px;
}

.glass-card {
  background: rgba(90, 31, 208, 0.3);
  border: 1px solid #5a1fd0;
  border-radius: var(--radius-cards);
  padding: 24px;
}

.badge {
  background: var(--accent-iris);
  color: #ffffff;
  border-radius: var(--radius-badges);
  padding: 1px 7px;
  font-size: 13px;
  font-weight: 500;
}

.category-label {
  color: var(--accent-neon-pink);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

### 14.3 Glitch Arcade (OFF WHITE)

```css
:root {
  --bg: #000000;
  --text: #ffffff;
  --text-muted: #aba4a4;
  --glitch-green: #00fb34;
  --warning-red: #ff0000;
  --digital-yellow: #fff500;

  --font-display: 'Offwhite', 'Arial Bold', sans-serif;
  --font-body: 'Times', 'Times New Roman', serif;
  --font-mono: 'Arial', sans-serif;

  --space-element: 40px;
  --space-section-min: 60px;
  --space-section-max: 120px;

  --radius-link: 30px;
  --radius-default: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
}

.display {
  font-family: var(--font-display);
  font-size: clamp(120px, 30vw, 500px);
  font-weight: 700;
  line-height: 1.0;
  color: var(--text);
  -webkit-text-stroke: 2px var(--warning-red);
  text-stroke: 2px var(--warning-red);
}

.cta-filled {
  background: var(--glitch-green);
  color: var(--bg);
  border: none;
  border-radius: 0;
  padding: 16px 32px;
  font-family: var(--font-display);
  font-weight: 700;
}

.cta-ghost {
  background: transparent;
  color: var(--glitch-green);
  border: none;
  border-radius: var(--radius-link);
  padding: 16px 32px;
  font-family: var(--font-display);
  font-weight: 600;
}

.image-collage {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
}
.image-collage img {
  border: 1px solid var(--bg);
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-collage img:nth-child(2n) {
  transform: translate(-15%, 8%);
}
```

### 14.4 Map Metropolis (SBS Town)

```css
:root {
  --bg: #111111;
  --text: #ffffff;
  --neon-pink: #ff00d9;
  --aqua: #00f0ff;
  --voltage: #fafa00;
  --infrared: #f0445d;
  --warning-amber: #ff7c24;

  --font: 'Circular', system-ui, sans-serif;
  --text-base: 16px;
  --leading-base: 1.15;

  --radius: 100px;     /* uniform extreme pill */

  --pad-y: 5px;
  --pad-x: 20px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-base);
  margin: 0;
}

.tag-button {
  display: inline-flex;
  align-items: center;
  background: var(--warning-amber);
  color: var(--text);
  border: none;
  border-radius: var(--radius);
  padding: var(--pad-y) var(--pad-x);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}

.tag-info-red    { background: var(--infrared); }
.tag-info-yellow { background: var(--voltage); color: var(--bg); }
.tag-info-pink   { background: var(--neon-pink); }

.map-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  background: transparent;
}
```

### 14.5 Cyberpunk Nightscape (Chainzoku)

```css
:root {
  --bg-warm-white: #fffff7;
  --bg-dark: #1c1616;
  --bg-footer: #c4c1c6;
  --text: #000000;
  --text-on-dark: #fffff7;

  --electric-lime: #cdfb52;
  --cyber-pink: #f24ac7;

  --font-display: 'Druk Heavy', 'Bebas Neue', sans-serif;
  --font-body: 'NeueHaasGrotDisp', 'Helvetica Neue', sans-serif;

  --text-display: clamp(100px, 20vw, 301px);
  --text-display-lg: 177px;
  --text-display-md: 100px;

  --radius-cards: 10px;
  --radius-nav: 15px;
  --radius-pill: 9999px;
}

body {
  background: var(--bg-warm-white);
  color: var(--text);
  font-family: var(--font-body);
  letter-spacing: -0.0200em;
}

section.dark {
  background: var(--bg-dark);
  color: var(--text-on-dark);
}

.display {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 400;
  line-height: 0.8;
  letter-spacing: -0.0200em;
}

.cta-pill {
  background: var(--electric-lime);
  color: var(--text);
  border: none;
  border-radius: var(--radius-pill);
  padding: 12px 24px;
  font-family: var(--font-body);
  font-size: 16px;
  cursor: pointer;
}

.card-dark {
  background: var(--bg-dark);
  color: var(--text-on-dark);
  border-radius: var(--radius-cards);
  padding: 0;        /* tight grouping */
}
```

---

<a id="tailwind"></a>
## 15. TAILWIND V4 CONFIGURATIONS

### 15.1 Server Room (Neon)

```css
@theme {
  --color-blackout: #000000;
  --color-depth: #0a0a0b;
  --color-graphite-deep: #151617;
  --color-graphite: #242628;
  --color-graphite-light: #303236;
  --color-ash: #797d86;
  --color-fog: #bababb;
  --color-whiteout: #ffffff;
  --color-neon-glow: #34d59a;
  --color-neon-muted: #285d49;
  --color-system-warning: #ff3621;

  --font-display: 'Inter', sans-serif;
  --font-mono: 'GeistMono', monospace;

  --text-display: 80px; --leading-display: 1; --tracking-display: -3.2px;
  --text-heading-lg: 48px; --leading-heading-lg: 1.13; --tracking-heading-lg: -1.2px;
  --text-body: 16px; --leading-body: 1.5; --tracking-body: -0.43px;

  --radius-buttons: 9999px;
  --radius-cards: 4px;
}
```

### 15.2 Deep Space Console (JetBrains)

```css
@theme {
  --color-obsidian: #000000;
  --color-deep-charcoal: #19191c;
  --color-graphite: #343434;
  --color-fog: #bababb;
  --color-pure-white: #ffffff;
  --color-electric-blue: #18a3fa;
  --color-violet-pulse: #7b61ff;
  --color-iris: #6b57ff;
  --color-deep-violet: #2e106a;
  --color-neon-pink: #f31199;

  --font-jetbrains-sans: 'JetBrains Sans', 'Inter', sans-serif;

  --text-display: 79px; --leading-display: 0.9; --tracking-display: -0.395px;
  --text-heading-lg: 72px; --leading-heading-lg: 1; --tracking-heading-lg: -0.36px;
  --text-body: 20px; --leading-body: 1.4;

  --radius-buttons: 26px;
  --radius-cards: 24px;
  --radius-badges: 4px;
}
```

---

<a id="recipes"></a>
## 16. COMPONENT RECIPES

### 16.1 Hero with Radial Blue Glow

```html
<section class="cn-hero">
  <h1 class="cn-display">Fast Postgres Databases</h1>
  <p class="cn-sub">Branchable, autoscaling, and serverless.</p>
  <div class="cn-actions">
    <button class="cn-pill-cta">Get started</button>
    <button class="cn-pill-ghost">Read the docs</button>
  </div>
</section>
```

```css
.cn-hero {
  position: relative;
  min-height: 100vh;
  background: #000;
  display: grid;
  place-items: center;
  text-align: center;
  overflow: hidden;
  padding: 120px 24px;
}
.cn-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    87% 97% at 54% 23%,
    rgba(0, 71, 253, 0.8) 0%,
    rgba(0, 71, 253, 0.8) 15%,
    transparent 75%
  );
}
.cn-hero > * { position: relative; }

.cn-display {
  font-family: 'Inter', sans-serif;
  font-size: clamp(60px, 10vw, 80px);
  font-weight: 500;
  line-height: 1.0;
  letter-spacing: -0.04em;
  color: #fff;
}
.cn-sub {
  font-size: 20px;
  color: #bababb;
  max-width: 600px;
  margin: 24px auto;
}
.cn-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.cn-pill-cta {
  background: #fff;
  color: #151617;
  border: none;
  border-radius: 9999px;
  padding: 12px 28px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
}
.cn-pill-ghost {
  background: transparent;
  color: #fff;
  border: 1px solid #303236;
  border-radius: 9999px;
  padding: 12px 18px;
  font-family: inherit;
  cursor: pointer;
}
```

### 16.2 Feature Code Block (Terminal-style)

```html
<div class="cn-code-block">
  <div class="cn-code-header">
    <span class="cn-code-tag">postgres</span>
  </div>
  <pre class="cn-code-content">
<span class="cn-code-keyword">SELECT</span> name, email
<span class="cn-code-keyword">FROM</span> users
<span class="cn-code-keyword">WHERE</span> active = <span class="cn-code-string">true</span>;
  </pre>
</div>
```

```css
.cn-code-block {
  background: #151617;
  border-radius: 4px;
  padding: 24px;
  font-family: 'GeistMono', 'Fira Code', monospace;
  font-size: 14px;
  color: #fff;
}
.cn-code-tag {
  display: inline-block;
  background: rgba(52, 213, 154, 0.2);
  color: #34d59a;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 16px;
}
.cn-code-keyword { color: #34d59a; }
.cn-code-string  { color: #f3c033; }
```

### 16.3 Glass Tinted Card (JetBrains-style)

```html
<article class="cn-glass-card">
  <span class="cn-badge">Now Live</span>
  <h3>JetBrains IDEs 2026.1</h3>
  <p>Smarter completion. Faster indexing. New language support.</p>
  <button class="cn-pill-cta">Download now</button>
</article>
```

```css
.cn-glass-card {
  background: rgba(90, 31, 208, 0.3);
  border: 1px solid #5a1fd0;
  border-radius: 24px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
  font-family: 'JetBrains Sans', 'Inter', sans-serif;
  color: #bababb;
}
.cn-glass-card h3 {
  color: #fff;
  font-size: 35px;
  font-weight: 600;
  letter-spacing: -0.035px;
  margin: 0;
}
.cn-badge {
  display: inline-block;
  background: #6b57ff;
  color: #fff;
  border-radius: 4px;
  padding: 1px 7px;
  font-size: 13px;
  font-weight: 500;
  align-self: flex-start;
}
```

### 16.4 SBS Map Tag

```html
<button class="map-tag map-tag-amber">★ Kickoff</button>
<button class="map-tag map-tag-red">URGENT</button>
<button class="map-tag map-tag-yellow">DATA POINT</button>
```

```css
.map-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 100px;
  padding: 5px 20px;
  font-family: 'Circular', system-ui, sans-serif;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  transition: filter 200ms ease;
}
.map-tag:hover { filter: brightness(1.15); }

.map-tag-amber  { background: #ff7c24; }
.map-tag-red    { background: #f0445d; }
.map-tag-yellow { background: #fafa00; color: #111; }
.map-tag-pink   { background: #ff00d9; }
.map-tag-aqua   { background: #00f0ff; color: #111; }
```

### 16.5 Glitch Display Headline (OFF WHITE)

```html
<h1 class="cn-glitch-display">PROVOQUER</h1>
```

```css
.cn-glitch-display {
  font-family: 'Offwhite', 'Arial Bold', sans-serif;
  font-size: clamp(120px, 30vw, 500px);
  font-weight: 700;
  line-height: 1.0;
  color: #fff;
  -webkit-text-stroke: 3px #ff0000;
  text-shadow: 4px 0 #00fb34, -4px 0 #f24ac7;
  animation: glitch-shift 4s steps(2) infinite;
}
@keyframes glitch-shift {
  0%, 95%, 100% {
    text-shadow: 4px 0 #00fb34, -4px 0 #f24ac7;
  }
  96% {
    text-shadow: -4px 0 #00fb34, 4px 0 #f24ac7;
  }
  98% {
    text-shadow: 4px 4px #00fb34, -4px -4px #f24ac7;
  }
}
```

### 16.6 Per-Product Chromatic Icon Grid

```html
<div class="product-grid">
  <div class="product-icon" style="--g1:#ff8100; --g2:#ff3621; --g3:#5a1fd0;">IJ</div>
  <div class="product-icon" style="--g1:#34d59a; --g2:#fafa00; --g3:#08deaa;">PY</div>
  <div class="product-icon" style="--g1:#00f0ff; --g2:#0047fd; --g3:#19191c;">DB</div>
  <div class="product-icon" style="--g1:#ff00d9; --g2:#7b61ff; --g3:#ff3621;">RS</div>
</div>
```

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
  gap: 16px;
  padding: 32px 0;
}
.product-icon {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--g1), var(--g2), var(--g3));
  display: grid;
  place-items: center;
  font-family: 'JetBrains Sans', 'Inter', sans-serif;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  transition: filter 200ms ease;
}
.product-icon:hover {
  filter: brightness(1.2) drop-shadow(0 0 12px var(--g2));
}
```

---

<a id="checklist"></a>
## 17. VALIDATION CHECKLIST

### 17.1 Color Audit
- [ ] Page background is **pure `#000000`** (not `#0a0a0a`, `#111`, etc.)
- [ ] Body text is **`#bababb` Fog tier** (NOT pure white)
- [ ] Primary CTA color is ONE neon hue
- [ ] Decorative neons appear only as outlines/gradient stops/POI (never as button bg)
- [ ] No Tailwind 500-tier defaults (`#3b82f6`, `#10b981`, etc.)

### 17.2 Typography Audit
- [ ] Display size ≥ 60px (mobile) / 80-300+px (desktop)
- [ ] Custom font specified (not Inter as everything)
- [ ] Negative letter-spacing on display (-0.02 to -3.2px)
- [ ] Mono font used for code/labels/tags
- [ ] OpenType features set (`"calt", "kern", "liga"` or `"liga" 0`)

### 17.3 Geometry Audit
- [ ] Border-radius commits to a Cyber Neon stance:
  - [ ] Pill buttons + sharp containers (9999/4), OR
  - [ ] Uniform extreme pill (100px everywhere), OR
  - [ ] Binary 0/30, OR
  - [ ] Multi-tier 4-6/16-24/26 (JetBrains)
- [ ] **No drop shadows** (or only 1 defined globally)
- [ ] Section gap 50-128px

### 17.4 Surface Audit
- [ ] Multi-tier near-black surfaces (5-7 levels)
- [ ] Translucent rgba cards on tinted bg
- [ ] No `box-shadow` for elevation — color stacking only
- [ ] Hero uses radial glow gradient

### 17.5 Component Audit
- [ ] Pill buttons OR sharp filled buttons (commit)
- [ ] Ghost buttons with 1px subtle border
- [ ] Tag badges in mono font, all-caps, small
- [ ] No "shadcn-default" cards with shadow + 12px radius

### 17.6 Motion Audit
- [ ] Hero glow has subtle pulse animation
- [ ] Scanline or terminal-glow effects optional
- [ ] Hover: glow intensification (`box-shadow: 0 0 24px var(--accent)`)
- [ ] Honors `prefers-reduced-motion`

### 17.7 Imagery Audit
- [ ] No stock lifestyle photography
- [ ] 3D rendered / generative abstract / character art
- [ ] Outlined monochromatic icons OR per-product chromatic gradients
- [ ] Optional: image collage with neon borders

### 17.8 Accessibility Audit
- [ ] Body text contrast: #bababb on #000 = 9.5:1 (passes AAA)
- [ ] CTA contrast: neon on dark passes AA at minimum
- [ ] Focus states visible (custom or default)
- [ ] Reduced motion fallback for glow pulses

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
PROMPT:                                    PICK:
"cyberpunk / web3 / character"          →  Chainzoku (Nightscape)
"3D world / map / immersive"            →  SBS Town (Metropolis)
"developer / database / infra"          →  Neon.tech (Server Room)
"multi-product / IDE / dev brand"       →  JetBrains (Nebula on Obsidian)
"editorial / fashion / arcade"          →  OFF WHITE (Glitch Arcade)
```

### 18.2 30-Second Token Set (Universal Cyber Neon)

```css
:root {
  /* MANDATORY */
  --bg: #000000;

  /* Multi-tier blacks (pick 3-5) */
  --surface-1: #0a0a0b;
  --surface-2: #151617;
  --surface-3: #242628;
  --border: #303236;

  /* Text — NOT pure white! */
  --text-primary: #ffffff;     /* headings, buttons */
  --text-body: #bababb;         /* body — Fog tier */
  --text-muted: #797d86;        /* secondary */

  /* Pick ONE neon */
  --accent: #34d59a;            /* OR #00fb34 / #cdfb52 / #ff00d9 */

  /* Custom font */
  --font-display: 'Inter', sans-serif;     /* OR JetBrains Sans, Druk Heavy */
  --font-mono: 'GeistMono', monospace;

  /* Bipolar radius */
  --radius-buttons: 9999px;
  --radius-cards: 4px;

  /* Generous space */
  --section-gap: 96px;
  --element-gap: 8px;
}
```

### 18.3 Common Tasks

```
TASK:                       RECIPE:
"Cyber CTA"              →  Pill button neon-bg + dark text
"Cyber hero"             →  Black bg + radial glow + 80px display + 2 pill CTAs
"Cyber card"             →  Translucent rgba bg + neon border + 24px radius
"Cyber input"            →  4px sharp + dark bg + 1px Graphite border
"Cyber section"          →  Black bg + 96px vertical pad + no dividers
"Cyber illustration"     →  Generative 3D mesh OR character art
```

### 18.4 The 5 Cyber Neon Gradients

```css
/* Hero spotlight */
--hero-glow: radial-gradient(87% 97% at 54% 23%, rgba(0,71,253,0.8) 0%, rgba(0,71,253,0.8) 15%, transparent 75%);

/* Nebula bloom */
--nebula-violet: linear-gradient(130deg, rgb(90,31,208) 10%, rgba(46,16,106,0) 70%);

/* Aurora sweep */
--aurora-teal: linear-gradient(90deg, rgb(8,222,170) -12.99%, rgb(0,170,250) 176.77%);

/* Scanline */
--scanline: linear-gradient(90deg, rgba(57,165,125,0.6) 50%, transparent 50%);

/* Emerald fade */
--emerald-fade: linear-gradient(130deg, rgba(33,215,137,0.6) -10%, rgba(106,16,70,0) 80%);
```

---

## 19. APPENDIX: SOURCE SITES

| # | Site | URL | Theme | Archetype |
|---|------|-----|-------|-----------|
| 1 | Chainzoku | chainzoku.io | mixed | Cyberpunk Nightscape |
| 2 | SBS Town | open-sbs.brig.ht/city | dark | Cyberpunk Metropolis |
| 3 | Neon | neon.tech | dark | Server Room After Dark |
| 4 | JetBrains | jetbrains.com | dark | Nebula on Obsidian |
| 5 | OFF WHITE | off-white.valeriafrancis.com | dark | Glitch Arcade |

Each archetype's full DESIGN.md is preserved in `../../raw/cyber-neon/0X-<site>.md`.

---

## 20. VERSIONING

- **v1.0.0** (May 2026): Initial 5-site corpus from Refero "cyber+neon" tag.

---

**END OF SKILL FILE**

> Cyber Neon's signature is **restraint amplifying glow**. Pure black + ONE neon + multi-tier surfaces + zero shadows. Pick an archetype and commit fully.


## Supplemental Depth Pass 1: Cyber Neon Production Expansion

### 1.1 Strategic Role

Cyber neon works when glow is structural: it must guide attention, mark interactive states, and create atmosphere without destroying readability.

The intended feeling is electric, nocturnal, luminous, futuristic, high-energy. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 1.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: neon accents should be reserved for CTAs, active states, data highlights, edge lighting, and hero moments.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 1.3 Layout Discipline

Strong Cyber Neon layouts should:

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

Every component should express Cyber Neon in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 1.5 Content Discipline

Good copy for Cyber Neon is specific, short, and matched to the visual energy.

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

- Does the page still feel like Cyber Neon with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid glow on every border, illegible saturated text, random sci-fi decoration, low-contrast purple haze, and fake terminal clutter.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 1.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Cyber Neon system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 2: Cyber Neon Production Expansion

### 2.1 Strategic Role

Cyber neon works when glow is structural: it must guide attention, mark interactive states, and create atmosphere without destroying readability.

The intended feeling is electric, nocturnal, luminous, futuristic, high-energy. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 2.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: neon accents should be reserved for CTAs, active states, data highlights, edge lighting, and hero moments.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 2.3 Layout Discipline

Strong Cyber Neon layouts should:

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

Every component should express Cyber Neon in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 2.5 Content Discipline

Good copy for Cyber Neon is specific, short, and matched to the visual energy.

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

- Does the page still feel like Cyber Neon with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid glow on every border, illegible saturated text, random sci-fi decoration, low-contrast purple haze, and fake terminal clutter.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 2.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Cyber Neon system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 3: Cyber Neon Production Expansion

### 3.1 Strategic Role

Cyber neon works when glow is structural: it must guide attention, mark interactive states, and create atmosphere without destroying readability.

The intended feeling is electric, nocturnal, luminous, futuristic, high-energy. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 3.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: neon accents should be reserved for CTAs, active states, data highlights, edge lighting, and hero moments.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 3.3 Layout Discipline

Strong Cyber Neon layouts should:

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

Every component should express Cyber Neon in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 3.5 Content Discipline

Good copy for Cyber Neon is specific, short, and matched to the visual energy.

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

- Does the page still feel like Cyber Neon with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid glow on every border, illegible saturated text, random sci-fi decoration, low-contrast purple haze, and fake terminal clutter.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 3.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Cyber Neon system should feel rich because it is disciplined, not because it has more effects.
