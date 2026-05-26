---
name: dark-ui
description: |
  Dark UI aesthetic for the web — pure-black or near-black canvas with multi-tier surfaces,
  vivid accent colors, and gradient-infused atmospheres. Use when user requests "dark mode",
  "developer SaaS", "premium dark theme", "fintech dark", "cosmic command center", "newsletter
  platform dark", "synthwave dev tool", or "AI/SaaS dark UI". Anti-slop: rejects generic
  Tailwind dark themes (slate-800 bg, blue-500 accent), Material drop-shadow elevation, and
  the "every component glows" overuse of neon. Different from Cyber Neon: Dark UI is more
  varied with multiple accent colors and broader use cases.
version: 1.0.0
category: design-taste
tags: [dark-ui, dark-mode, saas, gradient-glow, multi-tier-blacks, premium-dark, cosmic, developer]
sources:
  - beehiiv.com
  - feyapp.com
  - bun.sh
  - circle.so
  - superwhisper.com
---

# Dark UI — Design Skill

> **A skill for building dark-canvas SaaS, developer tools, and AI products. Distilled from 5 award-winning Dark UI-tagged sites curated by Refero. Different from "Cyber Neon" (single-accent restraint) — Dark UI accepts multi-accent palettes, gradient heroes, and broader product types.**

---

## TABLE OF CONTENTS

1. [Philosophy](#philosophy)
2. [The 5 Dark UI Archetypes](#archetypes)
3. [Color Systems](#color)
4. [Typography Systems](#typography)
5. [Spacing & Geometry](#spacing)
6. [Border Radius Patterns](#radius)
7. [Surfaces & Multi-Tier Black Stack](#surface)
8. [Component Patterns](#components)
9. [Gradient Systems](#gradients)
10. [Layout Patterns](#layout)
11. [Imagery & Decoration](#imagery)
12. [Motion & Glow](#motion)
13. [Anti-Slop Rules](#anti-slop)
14. [Decision Tree](#decision)
15. [CSS Starter Templates](#templates)
16. [Tailwind v4 Configurations](#tailwind)
17. [Component Recipes](#recipes)
18. [Validation Checklist](#checklist)
19. [Quick Reference](#cheatsheet)

---

<a id="philosophy"></a>
## 1. PHILOSOPHY

### 1.1 Dark Canvas is Mandatory (But Not Pure Black)
Dark UI uses dark backgrounds — but unlike Cyber Neon's strict `#000000` rule, Dark UI accepts variation:

| Site | Page bg | Hex | Reasoning |
|------|---------|-----|-----------|
| beehiiv | Midnight Ink | `#060419` | Deep navy with slight blue undertone |
| Fey | Midnight Ink | `#0b0b0b` | Near-pure black, financial precision |
| Bun | Midnight Core | `#0d0e11` | Slight desaturation, synthwave feel |
| Circle | (light theme with dark gradient hero) | `#ffffff` | Hybrid — dark used contextually |
| Superwhisper | Midnight Eclipse | `#000000` | Pure black for cosmic gradients |

**Pattern:** Pick a "dark-aware" page bg from `#000000` to `#0d0e11` range. Slight color tint (blue/violet) optional.

### 1.2 Multi-Tier Surface Stack (3-7 Levels)
Every Dark UI site uses layered near-black surfaces for depth:

```css
/* Fey 8-tier example */
--surface-0: #0b0b0b;   /* page bg */
--surface-1: #131313;   /* cards */
--surface-2: #191919;   /* dividers/accents */
--text-1: #868f97;      /* slate */
--text-2: #999999;      /* ash */
--text-3: #cccccc;      /* silver */
--text-4: #e6e6e6;      /* light smoke */
--text-5: #ffffff;      /* pure white */
```

This is the Dark UI signature: **gradual desaturation through 5+ near-blacks** to create depth without shadows.

### 1.3 1-2 Brand Accents (Not 1, Not Many)
Unlike Cyber Neon (1 accent) or Pastel (1 accent), Dark UI typically uses **2 complementary accents**:

| Site | Primary Accent | Secondary Accent |
|------|---------------|------------------|
| beehiiv | Electric Blue `#2f39ba` | Cosmic Magenta `#ff5ec4` |
| Fey | Cosmic Blue `#479ffa` | Solar Flare `#ffa16c` |
| Bun | Magenta Glow `#ec4899` | Cyber Pink `#f472b6` |
| Circle | Pastel-tinted (multiple) | Focus Blue `#539cf2` |
| Superwhisper | Electric Blue `#0088FF` | Multi-decorative (7+) |

**Pattern:** ONE primary CTA color + ONE highlight/secondary. Or multi-accent decorative palette with single CTA.

### 1.4 Gradient Hero is Common (Not Required)
3 of 5 Dark UI sites have gradient heroes:
- beehiiv: Indigo Fusion (blue → magenta)
- Circle: Deep Indigo (sky burst → violet)
- Superwhisper: Twilight Gradient + Nebula Horizon (multi-stop cosmic)

**Pattern:** Optional but distinctive. If used, multi-stop linear or radial gradients in cool colors.

### 1.5 Bipolar Radius (Pill + Sharp)
Almost every Dark UI uses **pill (9999px) for buttons + sharp containers**:

| Site | Buttons | Cards |
|------|---------|-------|
| beehiiv | 9999px pill | 6px sharp |
| Fey | 99px pill | 16px |
| Bun | 8px (default) + 9999px badges | 8px |
| Circle | 9999px pill | 24px |
| Superwhisper | 4px buttons + 9999px pills | 24px |

**Pattern:** Pill 9999px buttons OR multi-tier (4-16-24).

### 1.6 Inter is Common (But Custom Fonts Distinct)
| Site | Primary Font |
|------|--------------|
| beehiiv | Satoshi + Clash Grotesk |
| Fey | Calibre |
| Bun | system-ui + JetBrains Mono |
| Circle | Inter (only) |
| Superwhisper | Inter + custom decorative |

**Pattern:** Custom font like Satoshi/Calibre/Clash, OR Inter + Mono pairing for code-heavy sites.

### 1.7 No Drop Shadows for Surfaces (Use Color Stack)
Dark UI universally avoids shadows for elevation:
- Fey: "Avoid using drop shadows on elements that are not meant to signify elevation"
- Bun: "Do not introduce strong shadows on most elements"
- beehiiv: "Maintain a largely flat aesthetic"

**Exception:** Singular signature shadows for testimonial cards or app preview cards (huge soft glow shadows).

---

<a id="archetypes"></a>
## 2. THE 5 DARK UI ARCHETYPES

### 2.1 GALACTIC COMMAND CENTER (beehiiv)
**Vibe:** Deep space blues + magenta + electric blue accents
**Theme:** dark (#060419 deep navy)
**Palette:** Mono surfaces + Electric Blue + Cosmic Magenta + Indigo Fusion gradient
**Typography:** Satoshi (body, 0.045em tracking) + Clash Grotesk (display)
**Radius:** 9999px buttons/tags + 6px cards/inputs
**When to use:** Newsletter platforms, content SaaS, creator tools

### 2.2 OBSERVATORY CONTROL PANEL (Fey)
**Vibe:** Near-black + financial data viz precision
**Theme:** dark (#0b0b0b)
**Palette:** 8-tier near-blacks + Cosmic Blue + Solar Flare + Emerald Profit + 3 gradients
**Typography:** Calibre (sole, weights 400-700, -0.08em on display)
**Radius:** 99px pill buttons + 16px cards + 6px inputs
**Layout:** 1220px max-width, 900-1100px section gaps (extreme!)
**When to use:** Fintech, investment apps, data-dense premium SaaS

### 2.3 SYNTHWAVE DEV LAB (Bun)
**Vibe:** Multi-tier blacks + neon pinks/violets + code-centric
**Theme:** dark (#0d0e11)
**Palette:** Midnight Core + Charcoal Canvas + Cyber Pink + Neon Violet + 4 gradients
**Typography:** system-ui + JetBrains Mono (code)
**Radius:** Strict set: 4/8/12/30/9999px only
**When to use:** Developer tools, runtimes, frameworks, technical CLIs

### 2.4 GALACTIC SOFT GLOW (Circle)
**Vibe:** Light canvas + dark indigo gradient hero + soft pastel buttons
**Theme:** light (with dark gradient sections — hybrid)
**Palette:** Mono + 5 pastel button bgs + Deep Indigo gradient
**Typography:** Inter (sole)
**Radius:** 9999px pill on ALL interactive (buttons + inputs!)
**When to use:** Community platforms, social SaaS, modern marketplaces

### 2.5 CELESTIAL COMMAND CENTER (Superwhisper)
**Vibe:** Pure black + 7 vivid accents + cosmic gradients
**Theme:** dark (#000000)
**Palette:** Multi-tier blacks + Electric Blue + 6 decorative neons + Twilight/Nebula gradients
**Typography:** Inter + ui-monospace + Flow Circular (decorative custom)
**Radius:** Multi-tier 4/9/24/9999px
**When to use:** AI tools, voice interfaces, creative software, premium downloads

---

<a id="color"></a>
## 3. COLOR SYSTEMS

### 3.1 The Dark Canvas Spectrum

Pick from documented Dark UI canvases:

```css
/* Pure black (Superwhisper) */
--bg: #000000;

/* Near-black (Fey) */
--bg: #0b0b0b;

/* Slight desaturation (Bun) */
--bg: #0d0e11;

/* Deep navy (beehiiv) */
--bg: #060419;
```

**Rule:** Dark UI bg should be `#000000` to `#0d0e11`. Slightly tinted (blue/violet) optional.

### 3.2 Multi-Tier Surface Stack (Critical)

The Dark UI signature is gradual surface levels:

```css
/* Pattern: 5-7 tier stack */
:root {
  --surface-0: #060419;   /* page bg (varies) */
  --surface-1: #0d0b28;   /* slightly lighter */
  --surface-2: #131313;   /* cards */
  --surface-3: #191919;   /* hover/elevated */
  --surface-4: #282a36;   /* code blocks / accent containers */
  --surface-5: #303236;   /* borders / dividers */
}
```

```css
/* Pattern: 8-tier text scale */
:root {
  --text-9: #ffffff;       /* primary headings */
  --text-8: #e5e7eb;       /* primary body */
  --text-7: #cccccc;       /* silver */
  --text-6: #a3a3a4;       /* muted */
  --text-5: #999999;       /* ash */
  --text-4: #868f97;       /* slate */
  --text-3: #6b7280;       /* secondary */
  --text-2: #474749;       /* iron */
  --text-1: #343434;       /* graphite */
  --text-0: #19191c;       /* deep charcoal */
}
```

### 3.3 Two-Accent Pattern

```css
/* beehiiv */
--accent-primary: #2f39ba;     /* Electric Blue */
--accent-secondary: #ff5ec4;   /* Cosmic Magenta */
/* Plus: linear-gradient(90deg, primary 0%, secondary 100%) for hero */

/* Fey */
--accent-primary: #479ffa;     /* Cosmic Blue */
--accent-secondary: #ffa16c;   /* Solar Flare */
--success: #4ebe96;             /* Emerald Profit */

/* Bun */
--accent-primary: #ec4899;     /* Magenta Glow (CTA) */
--accent-secondary: #f472b6;   /* Cyber Pink (highlights) */
--accent-tertiary: #a855f7;    /* Neon Violet */
```

### 3.4 Body Text Pattern

**Critical Dark UI rule:** Don't use pure white on pure black for body — too harsh.

```css
/* ❌ Reject — harsh */
body { background: #000; color: #ffffff; }

/* ✅ Use Fog-tier gray for body */
body { background: #060419; color: #c4c2d6; }   /* beehiiv: Cloud Whisper */
body { background: #0b0b0b; color: #868f97; }   /* Fey: Slate Text */
body { background: #0d0e11; color: #e5e7eb; }   /* Bun: Silver Text */
```

White (`#ffffff`) is reserved for headings, CTAs, and key data readouts.

### 3.5 Gradients Pattern

```css
/* Indigo Fusion (beehiiv) — linear horizontal */
--gradient-indigo-fusion: linear-gradient(90deg, rgb(47, 57, 186) 0%, rgb(255, 94, 196) 100%);

/* Deep Indigo (Circle) — diagonal blue→violet */
--gradient-deep-indigo: linear-gradient(142deg, rgb(64, 143, 237) 18.68%, rgb(62, 27, 201) 78.25%);

/* Twilight Gradient (Superwhisper) — multi-stop cosmic */
--gradient-twilight: linear-gradient(
  rgba(0, 0, 0, 0.5) 0.85%,
  rgba(0, 5, 46, 0.5) 25.81%,
  rgba(41, 40, 94, 0.5) 58.36%,
  rgba(84, 60, 123, 0.5) 79.52%,
  rgba(133, 90, 146, 0.5) 95.8%,
  rgba(195, 134, 171, 0.5) 107.19%
);

/* Nebula Horizon (Superwhisper) — opaque cosmic */
--gradient-nebula: linear-gradient(
  rgb(0, 0, 0) 0.85%,
  rgb(17, 45, 114) 33.4%,
  rgb(75, 82, 170) 49.68%,
  rgb(168, 135, 220) 70.84%,
  rgb(230, 196, 231) 95.8%,
  rgb(252, 219, 239) 107.19%
);

/* Pink Pulse (Bun) — decorative ripple */
--gradient-pink-pulse: linear-gradient(to right,
  rgba(0, 0, 0, 0),
  rgba(236, 72, 153, 0.5),
  rgba(0, 0, 0, 0)
);
```

### 3.6 Color Anti-Slop

❌ **REJECT** generic dark themes:
```css
--bg: #1f2937;          /* slate-800 generic */
--bg: #0f172a;          /* slate-900 */
--accent: #3b82f6;      /* blue-500 overused */
--accent: #8b5cf6;      /* violet-500 overused */
color: #cbd5e1;         /* slate-300 */
```

✅ **USE** documented Dark UI palettes:
```css
--bg: #060419;          /* beehiiv deep navy */
--bg: #0b0b0b;          /* Fey near-black */
--accent: #2f39ba;      /* Electric Blue */
--accent: #ec4899;      /* Magenta Glow */
--accent: #479ffa;      /* Cosmic Blue */
color: #c4c2d6;         /* Cloud Whisper */
```

---

<a id="typography"></a>
## 4. TYPOGRAPHY SYSTEMS

### 4.1 Display Sizes

| Site | Display | Tracking |
|------|---------|----------|
| beehiiv | 72px Clash Grotesk | normal |
| Fey | 54px Calibre | -0.08em (extreme!) |
| Bun | 60px system-ui weight 800 | normal |
| Circle | 64px Inter | -0.05em |
| Superwhisper | 60px Inter | -0.057em |

**Pattern:** 50-72px range. Negative tracking on display common.

### 4.2 Font Pairing Patterns

```
beehiiv      :  Satoshi (body) + Clash Grotesk (display)
Fey          :  Calibre (sole)
Bun          :  system-ui (body) + JetBrains Mono (code)
Circle       :  Inter (sole)
Superwhisper :  Inter (primary) + ui-monospace + Flow Circular (decorative)
```

**Pattern A — Single custom font** (Calibre, Inter): Maximum restraint
**Pattern B — Sans + display** (Satoshi + Clash): Editorial impact
**Pattern C — Sans + Mono** (system + JetBrains Mono): Code-centric

### 4.3 Letter-Spacing Discipline

```css
/* beehiiv: positive 0.045em (open feel against UI precision) */
.body { letter-spacing: 0.045em; }

/* Fey: extreme negative on display */
.display { letter-spacing: -0.08em; }
.heading { letter-spacing: -0.053em; }
.body    { letter-spacing: normal; }

/* Circle: progressive negative */
.headline    { letter-spacing: -1.6px; }    /* 64px */
.display-lg  { letter-spacing: -1.45px; }   /* 56px */
.heading     { letter-spacing: -0.74px; }   /* 32px */
.body        { letter-spacing: -0.16px; }   /* 16px */
.caption     { letter-spacing: 0.5px; }     /* 10px positive */
```

### 4.4 Mono Font for Code/Labels

```css
--font-mono: 'JetBrains Mono', 'GeistMono', 'Fira Code', 'Source Code Pro', monospace;
```

Used for:
- Code blocks (Bun)
- Technical labels (Superwhisper, ui-monospace)
- Data tags (Fey)
- Terminal simulations

### 4.5 OpenType Features

```css
/* Bun + Fey + Superwhisper */
.body { font-feature-settings: "kern"; }

/* Editorial — discretionary ligatures */
.display { font-feature-settings: "dlig" on, "liga" on; }
```

### 4.6 Weight Range Patterns

| Site | Weights |
|------|---------|
| beehiiv (Satoshi) | 400, 500, 600, 700 |
| Fey (Calibre) | 400, 500, 600, 700 |
| Bun (system-ui) | 300, 400, 500, 600, 700, **800** |
| Circle (Inter) | 400, 500, 600, 700 |
| Superwhisper (Inter) | 300, 400, 500, 600, 700 |

**Pattern:** 4-6 weights. Light weights (300) for airy feeling. Weight 800 for impact (Bun only).

---

<a id="spacing"></a>
## 5. SPACING & GEOMETRY

### 5.1 Section Gap

| Site | Section gap |
|------|-------------|
| beehiiv | 48px |
| Fey | 900-1100px (massive!) |
| Bun | 128px |
| Circle | 93px |
| Superwhisper | 32px |

**Pattern:** 32-128px standard. Fey's extreme is outlier.

### 5.2 Element Gap

| Site | Element gap |
|------|-------------|
| beehiiv | 16px |
| Fey | 4-8px (varies) |
| Bun | 8px |
| Circle | 8px |
| Superwhisper | 16px |

### 5.3 Card Padding

| Site | Card padding |
|------|--------------|
| beehiiv | 24px |
| Fey | 18/20px |
| Bun | 16-32px (varies) |
| Circle | 20px |
| Superwhisper | 24px |

### 5.4 Page Max-Width

| Site | Max-width |
|------|-----------|
| beehiiv | (implicit) |
| Fey | 1220px |
| Bun | 1280px |
| Circle | **1376px** |
| Superwhisper | (implicit) |

**Pattern:** 1200-1380px max-width or full-bleed.

---

<a id="radius"></a>
## 6. BORDER RADIUS PATTERNS

### 6.1 Three Stances

#### Stance 1 — Pill Buttons + Sharp Containers (beehiiv, Fey)
```css
--radius-buttons: 9999px;   /* OR 99px pill */
--radius-cards: 6px;         /* OR 16px */
```

#### Stance 2 — Multi-Tier (Bun, Superwhisper)
```css
--radius-button: 4px;
--radius-default: 8-9px;
--radius-cards: 16-24px;
--radius-pill: 9999px;
```

#### Stance 3 — All Pill Interactive (Circle)
```css
--radius-buttons: 9999px;
--radius-inputs: 9999px;
--radius-cards: 24px;
```

### 6.2 The Strict Radius Rule (Bun)

Bun explicitly forbids any radius outside its set:
```css
/* ✅ Allowed */
--radius-set: 4px, 8px, 12px, 30px, 9999px;
/* ❌ Forbidden: 6px, 10px, 14px, 16px, 20px, 24px, etc */
```

### 6.3 Radius Anti-Slop

❌ REJECT Material cascade (4/6/8/12).

✅ USE one Dark UI stance and commit.

---

<a id="surface"></a>
## 7. SURFACES & MULTI-TIER BLACK STACK

### 7.1 5-7 Tier Surface Stack (Dark UI Signature)

```css
:root {
  --surface-0: #060419;    /* page bg */
  --surface-1: #0d0b28;    /* slight elevation */
  --surface-2: #131313;    /* cards */
  --surface-3: #191919;    /* dividers */
  --surface-4: #282a36;    /* code blocks */
  --surface-5: #303236;    /* borders */
  --surface-light: #ffffff; /* highlight cards (rare exception) */
}
```

**Rule:** Each surface 1-2 lightness levels above previous. Layered = depth.

### 7.2 Translucent rgba Surfaces

```css
/* Bun pulse gradient */
.pulse-bg {
  background: linear-gradient(to right,
    rgba(0, 0, 0, 0),
    rgba(236, 72, 153, 0.5),
    rgba(0, 0, 0, 0)
  );
}

/* Circle dark themed feature card */
.dark-feature {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 20px;
}

/* Superwhisper translucent input */
.input {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9px;
}
```

### 7.3 Inset White Shadow (Superwhisper signature)

```css
/* Inset white shadows for icon hover */
.icon-active {
  box-shadow: rgba(255, 255, 255, 0.2) 0px 0px 0px 2px inset;
}
.icon-hover {
  box-shadow: rgba(255, 255, 255, 0.25) 0px 0px 0px 1px inset;
}
```

### 7.4 The ONE Allowed Shadow (Per-Site Exceptions)

```css
/* beehiiv testimonial card */
.testimonial {
  box-shadow:
    rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
    rgba(0, 0, 0, 0.1) 0px 4px 6px -4px;
}

/* Fey App Preview Card glow */
.app-preview {
  box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 44px 0px;
}

/* Bun card depth */
.card-elevated {
  box-shadow: rgba(0, 0, 0, 0.25) 0px 25px 50px -12px;
}

/* Superwhisper soft */
.standard-card {
  box-shadow:
    rgba(0, 0, 0, 0.25) 0px 1px 4px 0px,
    rgba(0, 0, 0, 0.1) 0px 4px 59px 0px;
}
```

**Rule:** Define ONE signature shadow per project, used for special cases only.

---

<a id="components"></a>
## 8. COMPONENT PATTERNS

### 8.1 Pill Ghost Button (Most Common)

```css
.dark-pill-ghost {
  background: transparent;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-weight: 500;
  cursor: pointer;
  transition: background 200ms ease, border 200ms ease;
}
.dark-pill-ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}
```

### 8.2 Pill Filled CTA

```css
.dark-pill-cta {
  background: var(--accent);     /* Electric Blue / Magenta Glow / etc */
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-weight: 500;
  cursor: pointer;
  transition: filter 200ms ease;
}
.dark-pill-cta:hover {
  filter: brightness(1.1);
}
```

### 8.3 White Pill CTA (Inverse — Fey, Superwhisper)

```css
.white-pill-cta {
  background: #ffffff;
  color: #19191c;
  border: none;
  border-radius: 9999px;
  padding: 12px 32px;
  font-family: var(--font-primary);
  font-weight: 500;
}
```

### 8.4 Gradient CTA (beehiiv signature)

```css
.gradient-cta {
  background: linear-gradient(90deg, #2f39ba 0%, #ff5ec4 100%);
  color: #ffffff;
  border: none;
  border-radius: 7px;     /* sharp! */
  padding: 24px;          /* large */
  font-weight: 500;
}
```

### 8.5 Standard Card

```css
.dark-card {
  background: var(--surface-2);
  border-radius: 16px;            /* OR 6px / 24px depending on archetype */
  padding: 24px;
  /* No shadow */
}
```

### 8.6 Glass Card (Translucent)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 24px;
  backdrop-filter: blur(12px);
}
```

### 8.7 Notification Bubble (Fey)

```css
.notification-bubble {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 3.75px 8-10px;
  color: #e6e6e6;
  font-size: 12px;
  box-shadow: rgba(0, 0, 0, 0.85) 0px 1px 0px 0px;
}
```

### 8.8 Code Block (Bun)

```css
.code-block {
  background: #282a36;
  color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}
.code-block .keyword { color: #fbcfe8; }     /* Faded Rose */
.code-block .type    { color: #22d3ee; }     /* Electric Cyan */
.code-block .string  { color: #fcd34d; }     /* Warning Yellow */
```

### 8.9 Status Pill Badge

```css
.status-pill {
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-pill-success { background: #34d399; color: #000; }
.status-pill-warning { background: #fcd34d; color: #000; }
.status-pill-danger  { background: #f87171; color: #fff; }
.status-pill-info    { background: #479ffa; color: #fff; }
```

### 8.10 Asymmetric Badge (Superwhisper)

```css
.asym-badge {
  background: var(--success);     /* Vivid Green */
  color: #000;
  border-radius: 24px 10px 24px 10px;     /* asymmetric! */
  padding: 16px 24px;
  font-weight: 600;
}
```

### 8.11 Tab-Style Top-Rounded Button (Bun)

```css
.tab-button {
  background: transparent;
  color: #d1d5db;
  border: 1px solid #282a36;
  border-radius: 7px 7px 0 0;     /* top-only rounded */
  padding: 16px;
}
```

### 8.12 Sticky Nav Bar

```css
.dark-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg);
  /* No border-bottom for cleanest look */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16-24px 32px;
  height: 64-72px;
}
.dark-nav-link {
  color: var(--text-muted);
  font-family: var(--font-primary);
  font-size: 14-16px;
  text-decoration: none;
  padding: 10px;
  transition: color 200ms ease;
}
.dark-nav-link:hover,
.dark-nav-link.active {
  color: #ffffff;
}
```

---

<a id="gradients"></a>
## 9. GRADIENT SYSTEMS

### 9.1 Linear Horizontal (beehiiv)

```css
.indigo-fusion-bg {
  background: linear-gradient(90deg, #2f39ba 0%, #ff5ec4 100%);
}
```

### 9.2 Linear Diagonal (Circle)

```css
.deep-indigo-bg {
  background: linear-gradient(142deg,
    rgb(64, 143, 237) 18.68%,
    rgb(62, 27, 201) 78.25%
  );
}
```

### 9.3 Multi-Stop Cosmic (Superwhisper)

```css
.twilight-gradient {
  background: linear-gradient(
    rgba(0, 0, 0, 0.5) 0.85%,
    rgba(0, 5, 46, 0.5) 25.81%,
    rgba(41, 40, 94, 0.5) 58.36%,
    rgba(84, 60, 123, 0.5) 79.52%,
    rgba(133, 90, 146, 0.5) 95.8%,
    rgba(195, 134, 171, 0.5) 107.19%
  );
}

.nebula-horizon {
  background: linear-gradient(
    rgb(0, 0, 0) 0.85%,
    rgb(17, 45, 114) 33.4%,
    rgb(75, 82, 170) 49.68%,
    rgb(168, 135, 220) 70.84%,
    rgb(230, 196, 231) 95.8%,
    rgb(252, 219, 239) 107.19%
  );
}
```

### 9.4 Pulse Gradient (Bun)

```css
.pink-pulse {
  position: relative;
}
.pink-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right,
    rgba(0, 0, 0, 0),
    rgba(236, 72, 153, 0.5),
    rgba(0, 0, 0, 0)
  );
  pointer-events: none;
  animation: pulse-shift 4s ease-in-out infinite;
}
@keyframes pulse-shift {
  0%, 100% { transform: translateX(-30%); opacity: 0.5; }
  50%      { transform: translateX(30%);  opacity: 1.0; }
}
```

### 9.5 Radial Cosmos (Bun)

```css
.cosmos-bg {
  background: radial-gradient(
    134.26% 244.64% at 42.92% -80.36%,
    rgb(179, 1, 179) 25.45%,
    rgb(56, 29, 189) 100%
  );
}
```

### 9.6 Animated Gradient

```css
.animated-gradient {
  background: linear-gradient(45deg, #2f39ba, #ff5ec4, #2f39ba);
  background-size: 200% 200%;
  animation: gradient-drift 15s ease-in-out infinite;
}
@keyframes gradient-drift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
```

---

<a id="layout"></a>
## 10. LAYOUT PATTERNS

### 10.1 Hero with Gradient Background

```html
<section class="dark-hero">
  <div class="hero-gradient" aria-hidden></div>
  <div class="hero-content">
    <h1 class="hero-display">The all-in-one platform</h1>
    <p class="hero-sub">For creators, communities, and tools.</p>
    <div class="hero-actions">
      <button class="cta-pill">Start free</button>
      <button class="ghost-pill">Read docs</button>
    </div>
  </div>
</section>
```

```css
.dark-hero {
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  display: grid;
  place-items: center;
  text-align: center;
  overflow: hidden;
  padding: 120px 24px;
}
.hero-gradient {
  position: absolute;
  inset: -10%;
  background: linear-gradient(142deg,
    rgb(64, 143, 237) 18.68%,
    rgb(62, 27, 201) 78.25%
  );
  filter: blur(120px);
  opacity: 0.5;
}
.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 24px;
}
.hero-display {
  font-family: var(--font-display);
  font-size: clamp(48px, 10vw, 72px);
  font-weight: 700;
  line-height: 1.0;
  color: #ffffff;
  margin: 0;
}
```

### 10.2 Multi-Surface Layered Section

```css
/* Alternate dark surfaces */
section { padding: 96px 24px; }
section.surface-0 { background: var(--surface-0); }   /* page bg */
section.surface-1 { background: var(--surface-1); }   /* slight elevation */
section.surface-light { background: #ffffff; color: #000; }  /* light card section */
```

### 10.3 Sticky Top Nav with Brand-Left + CTA-Right

```css
.dark-nav-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(6, 4, 25, 0.85);     /* slightly translucent */
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  height: 72px;
  /* No border-bottom — clean transition into hero */
}
```

### 10.4 3-Column Feature Grid

```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (max-width: 768px) {
  .feature-grid { grid-template-columns: 1fr; }
}
.feature-card {
  background: var(--surface-2);
  border-radius: 16px;
  padding: 24px;
}
```

### 10.5 Two-Column Asymmetric (Text + Product Mockup)

```css
.text-product {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 48-80px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 96px 24px;
}
@media (max-width: 1024px) {
  .text-product { grid-template-columns: 1fr; }
}
.text-product-headline {
  font-size: clamp(32px, 5vw, 48px);
  color: #fff;
}
.text-product-mockup {
  background: var(--surface-2);
  border-radius: 16px;
  padding: 32px;
  /* Optional: signature shadow */
  box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 44px 0px;
}
```

### 10.6 White-Card-On-Dark Section (Superwhisper signature)

```css
.dark-section { background: #000; padding: 96px 24px; }
.dark-section .white-card {
  background: #ffffff;
  color: #000;
  border-radius: 24px;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  /* Subtle dark shadow for contrast */
  box-shadow: rgba(0, 0, 0, 0.25) 0px 1px 4px 0px,
              rgba(0, 0, 0, 0.1) 0px 4px 59px 0px;
}
```

---

<a id="imagery"></a>
## 11. IMAGERY & DECORATION

### 11.1 Imagery Strategies

| Site | Strategy |
|------|----------|
| beehiiv | Realistic 3D product mockups + abstract glow shapes |
| Fey | Product screenshots in device mockups + atmospheric portrait photography |
| Bun | Generative graphics + code snippets (no photos) |
| Circle | Illustrative abstract gradients + UI mockups in rounded frames |
| Superwhisper | Ethereal gradient bgs + product screenshots in laptops/phones |

### 11.2 Photo Treatment

When photography is used:
- **Dark, atmospheric, moody**
- Solitary figures, often with obscured faces
- Establishes mood, doesn't decorate
- Cropped tightly OR contained in dark cards

### 11.3 Product Mockup Treatment

```css
.product-mockup {
  background: var(--surface-2);
  border-radius: 16px;
  padding: 24-32px;
  /* Slight glow for emphasis */
  box-shadow: 0 0 60px rgba(255, 94, 196, 0.1);
}
.product-mockup img {
  width: 100%;
  border-radius: 8px;
}
```

### 11.4 Iconography

**Two patterns:**

#### Pattern A — Outlined monochrome
```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="..." />
</svg>
```

#### Pattern B — Filled with brand color
```html
<svg fill="#2f39ba" viewBox="0 0 24 24">
  <path d="..." />
</svg>
```

### 11.5 Decorative Glow Shapes

```css
.glow-shape {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(rgba(255, 94, 196, 0.4), transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
```

---

<a id="motion"></a>
## 12. MOTION & GLOW

### 12.1 Hover Glow Intensification

```css
.dark-pill-cta {
  transition: filter 300ms ease, box-shadow 300ms ease;
}
.dark-pill-cta:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 24px var(--accent);
}
```

### 12.2 Animated Background Gradient

```css
.hero-gradient {
  background-size: 200% 200%;
  animation: gradient-drift 20s ease-in-out infinite;
}
@keyframes gradient-drift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
```

### 12.3 Pink Pulse Effect (Bun signature)

```css
.pulse-element {
  position: relative;
}
.pulse-element::before {
  content: '';
  position: absolute;
  inset: -10%;
  background: linear-gradient(to right,
    rgba(0, 0, 0, 0),
    rgba(236, 72, 153, 0.5),
    rgba(0, 0, 0, 0)
  );
  filter: blur(40px);
  opacity: 0.6;
  pointer-events: none;
  animation: pulse-sweep 3s ease-in-out infinite;
}
@keyframes pulse-sweep {
  0%, 100% { transform: translateX(-30%); }
  50%      { transform: translateX(30%); }
}
```

### 12.4 Card Hover Subtle Lift

```css
.dark-card {
  transition: background-color 200ms ease, transform 200ms ease;
}
.dark-card:hover {
  background-color: var(--surface-3);   /* level up */
  transform: translateY(-2px);
}
```

### 12.5 Performance Bar Animation (Fey)

```css
.bar {
  background: var(--accent);
  height: 32px;
  border-radius: 4px;
  transform-origin: left center;
  animation: bar-grow 1.2s cubic-bezier(0.16, 1, 0.30, 1) forwards;
}
@keyframes bar-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

### 12.6 Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .hero-gradient,
  .pulse-element::before,
  .bar {
    animation: none;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

<a id="anti-slop"></a>
## 13. ANTI-SLOP RULES

### 13.1 Color Anti-Slop

❌ REJECT:
```css
--bg: #1f2937;        /* slate-800 generic */
--bg: #0f172a;        /* slate-900 */
--accent: #3b82f6;    /* blue-500 overused */
--accent: #6366f1;    /* indigo-500 */
color: #94a3b8;       /* slate-400 generic body */
border: #334155;      /* slate-700 generic */
```

✅ USE documented Dark UI:
```css
--bg: #060419;        /* beehiiv navy */
--bg: #0b0b0b;        /* Fey near-black */
--accent: #2f39ba;    /* Electric Blue */
--accent: #ec4899;    /* Magenta Glow */
color: #c4c2d6;       /* Cloud Whisper */
border: rgba(255, 255, 255, 0.06);   /* hairline */
```

### 13.2 Typography Anti-Slop

❌ REJECT:
- Inter as everything for SaaS (overused)
- 4+ unrelated fonts
- Pure white body text on pure black

✅ USE:
- Custom font OR sans+mono pairing
- 4-6 weights total
- Body text in Fog tier (#c4c2d6, #868f97, #e5e7eb)
- Display 50-72px with negative tracking

### 13.3 Radius Anti-Slop

❌ REJECT Material cascade (4/6/8/12).

✅ USE Dark UI stance:
- Pill 9999px buttons + sharp 6/8/16px containers
- OR multi-tier 4/9/24/9999px
- OR all-pill interactive (9999px buttons + inputs)

### 13.4 Elevation Anti-Slop

❌ REJECT generic shadows:
```css
box-shadow: 0 4px 6px rgba(0,0,0,0.1);    /* Material */
box-shadow: 0 1px 3px rgba(0,0,0,0.12);
```

✅ USE Dark UI:
- Multi-tier surface stack (5-7 levels)
- Translucent rgba layers
- Single signature shadow (e.g. `rgba(0,0,0,0.8) 0 0 44px 0` for app preview cards)

### 13.5 Hero Anti-Slop

❌ REJECT:
- Hero with stock photo + 2-button CTA
- Glassmorphism panels everywhere

✅ USE:
- Gradient hero (linear OR radial cosmic)
- 3D product mockups floating
- Centered headline + 1 pill CTA + 1 ghost pill

### 13.6 Component Anti-Slop

❌ REJECT shadcn-style: card with `border + shadow + 12px radius + light bg`

✅ USE:
- Multi-tier surface cards (no shadow)
- Pill ghost buttons (transparent + 1px border)
- Translucent glass cards on gradient
- Tab-style top-rounded buttons (Bun)

---

<a id="decision"></a>
## 14. DECISION TREE

```
What is the brand's product?

├─ "Newsletter / content / creator SaaS"
│   → GALACTIC COMMAND CENTER (beehiiv)
│   → Deep navy + Indigo Fusion gradient + 9999px pills
│
├─ "Fintech / investment / data-dense premium"
│   → OBSERVATORY CONTROL PANEL (Fey)
│   → Near-black + 8-tier surfaces + 99px pill + Calibre
│
├─ "Developer tool / runtime / framework"
│   → SYNTHWAVE DEV LAB (Bun)
│   → Multi-tier blacks + Magenta Glow + JetBrains Mono + strict 4/8/12/30/9999px radius
│
├─ "Community / social / marketplace platform"
│   → GALACTIC SOFT GLOW (Circle)
│   → Light theme + Deep Indigo gradient hero + 9999px pill on ALL interactive
│
└─ "AI tool / voice / creative software / premium downloads"
    → CELESTIAL COMMAND CENTER (Superwhisper)
    → Pure black + Twilight/Nebula gradients + 7 vivid accents + Inter + Flow Circular
```

---

<a id="templates"></a>
## 15. CSS STARTER TEMPLATES

### 15.1 Galactic Command (beehiiv)

```css
:root {
  --bg: #060419;
  --surface-1: #0d0b28;
  --surface-2: #141230;
  --text-primary: #ffffff;
  --text-secondary: #f7f5ff;
  --text-muted: #c4c2d6;
  --text-disabled: #4e4e6c;
  --accent-primary: #2f39ba;
  --accent-secondary: #ff5ec4;
  --gradient-fusion: linear-gradient(90deg, #2f39ba 0%, #ff5ec4 100%);

  --font-body: 'Satoshi', Inter, sans-serif;
  --font-display: 'Clash Grotesk', Archivo, sans-serif;

  --text-caption: 12px;     --leading-caption: 1.56;     --tracking-caption: 0.54px;
  --text-body: 16px;        --leading-body: 1.5;         --tracking-body: 0.72px;
  --text-heading: 24px;     --leading-heading: 1.33;     --tracking-heading: 1.08px;
  --text-heading-lg: 48px;  --leading-heading-lg: 1.2;   --tracking-heading-lg: 2.16px;
  --text-display: 72px;     --leading-display: 1;

  --section-gap: 48px;
  --card-padding: 24px;
  --element-gap: 16px;

  --radius-buttons: 9999px;
  --radius-cards: 6px;
  --radius-tags: 9999px;
}

body {
  background: var(--bg);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

.btn-pill-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-buttons);
  padding: 12px 24px;
  font-family: inherit;
  font-weight: 500;
}

.btn-pill-secondary {
  background: var(--surface-2);
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 12px 24px;
}

.btn-gradient {
  background: var(--gradient-fusion);
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 24px;
  font-weight: 500;
}

.feature-card {
  background: var(--surface-1);
  border-radius: var(--radius-cards);
  padding: var(--card-padding);
}
```

### 15.2 Observatory Control (Fey)

```css
:root {
  --bg: #0b0b0b;
  --surface-1: #131313;
  --surface-2: #191919;
  --text-primary: #ffffff;
  --text-secondary: #e6e6e6;
  --text-muted: #868f97;
  --text-disabled: #3a3a3f;
  --accent-blue: #479ffa;
  --accent-orange: #ffa16c;
  --success: #4ebe96;

  --font-primary: 'calibre', Inter, sans-serif;

  --text-caption: 10px;     --leading-caption: 1.5;
  --text-body: 14px;        --leading-body: 1.36;
  --text-heading-sm: 18px;  --leading-heading-sm: 1.25;
  --text-heading: 24px;     --leading-heading: 1.2;       --tracking-heading: -0.053em;
  --text-display: 48px;     --leading-display: 1;         --tracking-display: -0.08em;

  --max-width: 1220px;

  --radius-input-sm: 6px;
  --radius-buttons-sq: 6px;
  --radius-general: 10px;
  --radius-cards: 16px;
  --radius-buttons-pill: 99px;
}

body {
  background: var(--bg);
  color: var(--text-secondary);
  font-family: var(--font-primary);
}

.btn-pill-cta {
  background: var(--text-secondary);    /* Light Smoke */
  color: #000000;
  border: none;
  border-radius: var(--radius-buttons-pill);
  padding: 7px 16px;
  font-weight: 500;
}

.app-preview-card {
  background: var(--surface-1);
  border-radius: var(--radius-cards);
  padding: 18-20px;
  box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 44px 0px;
}

.notification-bubble {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-input-sm);
  padding: 3.75px 8px;
  color: var(--text-secondary);
  font-size: 12px;
  box-shadow: rgba(0, 0, 0, 0.85) 0px 1px 0px 0px;
}
```

### 15.3 Synthwave Dev Lab (Bun)

```css
:root {
  --bg: #0d0e11;
  --surface-1: #14151a;
  --surface-2: #282a36;
  --border: #3a3a3f;
  --text-primary: #ffffff;
  --text-secondary: #e5e7eb;
  --text-muted: #6b7280;
  --accent-cta: #ec4899;
  --accent-pink: #f472b6;
  --accent-violet: #a855f7;
  --accent-cyan: #22d3ee;
  --gradient-pulse: linear-gradient(to right,
    rgba(0,0,0,0), rgba(236,72,153,0.5), rgba(0,0,0,0)
  );

  --font-primary: system-ui, Inter, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-body: 14px;       --leading-body: 1.43;
  --text-heading: 20px;    --leading-heading: 1.4;
  --text-display: 60px;    --leading-display: 1;

  --max-width: 1280px;
  --section-gap: 128px;
  --element-gap: 8px;

  /* Strict allowed set */
  --radius-input: 7px;
  --radius-buttons: 8px;
  --radius-default: 8px;
  --radius-tab-top: 7px 7px 0 0;
  --radius-pill: 9999px;
}

body {
  background: var(--bg);
  color: var(--text-secondary);
  font-family: var(--font-primary);
  font-feature-settings: "kern";
}

.btn-cta-magenta {
  background: var(--accent-cta);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-buttons);
  padding: 16px 36px;
  font-weight: 600;
}

.code-block {
  background: var(--surface-2);
  border-radius: var(--radius-buttons);
  padding: 16px;
  font-family: var(--font-mono);
  color: #ffffff;
}
```

### 15.4 Soft Galactic (Circle)

```css
:root {
  --bg: #ffffff;
  --bg-deep: #0a0a0a;
  --text-primary: #0a0a0a;
  --text-secondary: #191b1f;
  --text-muted: #737373;
  --hairline: #e4e7eb;
  --accent-pastel-blue: #e0eafc;
  --accent-pastel-pink: #f2dbf5;
  --accent-pastel-peach: #fff0d8;
  --accent-pastel-rose: #ffe0e2;
  --accent-pastel-mint: #e4f6f4;
  --focus-blue: #539cf2;

  --gradient-deep-indigo: linear-gradient(142deg,
    rgb(64, 143, 237) 18.68%,
    rgb(62, 27, 201) 78.25%
  );

  --font-primary: Inter, system-ui, sans-serif;

  --text-display: 56px;
  --text-headline: 64px;

  --max-width: 1376px;
  --section-gap: 93px;
  --card-padding: 20px;
  --element-gap: 8px;

  --radius-buttons: 9999px;
  --radius-inputs: 9999px;
  --radius-cards: 24px;

  --shadow-card: rgba(169, 169, 169, 0.08) 0px 4px 8px 0px;
  --focus-ring: rgb(83, 156, 242) 0px 0px 0px 2px;
}

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-primary);
}

.btn-pastel-cta {
  background: var(--accent-pastel-blue);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-buttons);
  padding: 8px 16px;
}

.input-pill {
  background: var(--bg);
  color: var(--text-primary);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-inputs);
  padding: 4px 24px;
}
.input-pill:focus {
  outline: none;
  box-shadow: var(--focus-ring);
}

.feature-card {
  background: var(--bg);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--shadow-card);
}

.hero-section {
  background: var(--gradient-deep-indigo);
  color: #ffffff;
  padding: 120px 24px;
  text-align: center;
}
```

### 15.5 Celestial Command (Superwhisper)

```css
:root {
  --bg: #000000;
  --surface-1: #030719;
  --surface-2: #001b33;
  --text-primary: #ffffff;
  --text-secondary: #e5e7eb;
  --text-muted: #70757c;
  --accent-blue: #0088ff;

  --gradient-twilight: linear-gradient(
    rgba(0,0,0,0.5) 0.85%,
    rgba(0,5,46,0.5) 25.81%,
    rgba(41,40,94,0.5) 58.36%,
    rgba(84,60,123,0.5) 79.52%,
    rgba(133,90,146,0.5) 95.8%,
    rgba(195,134,171,0.5) 107.19%
  );

  --gradient-nebula: linear-gradient(
    rgb(0,0,0) 0.85%,
    rgb(17,45,114) 33.4%,
    rgb(75,82,170) 49.68%,
    rgb(168,135,220) 70.84%,
    rgb(230,196,231) 95.8%,
    rgb(252,219,239) 107.19%
  );

  --font-primary: Inter, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --font-decorative: 'Flow Circular', system-ui, sans-serif;

  --section-gap: 32px;
  --card-padding: 24px;
  --element-gap: 16px;

  --radius-button: 4px;
  --radius-default: 9px;
  --radius-card: 24px;
  --radius-pill: 9999px;

  --shadow-card-soft: rgba(0,0,0,0.25) 0px 1px 4px 0px,
                      rgba(0,0,0,0.1) 0px 4px 59px 0px;
  --shadow-glow-card: rgba(0,0,0,0.4) 0px 8px 32px 0px;
  --shadow-icon-active: rgba(255,255,255,0.2) 0px 0px 0px 2px inset;
}

body {
  background: var(--bg);
  color: var(--text-secondary);
  font-family: var(--font-primary);
}

.btn-pill-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--text-secondary);
  border-radius: var(--radius-pill);
  padding: 10px 16px;
}

.btn-pill-light {
  background: rgba(228, 232, 239, 0.1);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-pill);
  padding: 8px 16px;
}

.btn-cta-frost {
  background: #ffffff;
  color: var(--bg);
  border: none;
  border-radius: var(--radius-pill);
  padding: 10px 16px;
  font-weight: 500;
}

.feature-card-gradient {
  background: var(--gradient-nebula);
  color: var(--text-primary);
  border-radius: var(--radius-card);
  padding: var(--card-padding);
}

.standard-card-white {
  background: #ffffff;
  color: #000000;
  border-radius: var(--radius-card);
  padding: var(--card-padding);
  box-shadow: var(--shadow-card-soft);
}

.success-badge {
  background: #16c253;
  color: #ffffff;
  border-radius: 24px 10px 24px 10px;
  padding: 16px 24px;
}
```

---

<a id="tailwind"></a>
## 16. TAILWIND V4 CONFIGURATIONS

### 16.1 Galactic (beehiiv)

```css
@theme {
  --color-midnight-ink: #060419;
  --color-shadow-violet: #0d0b28;
  --color-electric-blue: #2f39ba;
  --color-cosmic-magenta: #ff5ec4;
  --color-storm-gray: #4e4e6c;
  --color-cloud-whisper: #c4c2d6;
  --color-ghost-white: #f7f5ff;
  --color-starfield-white: #ffffff;

  --font-satoshi: 'Satoshi', Inter, sans-serif;
  --font-clash-grotesk: 'Clash Grotesk', Archivo, sans-serif;

  --text-display: 72px; --leading-display: 1;
  --text-heading-lg: 48px; --leading-heading-lg: 1.2;
  --text-body: 16px; --leading-body: 1.5; --tracking-body: 0.72px;

  --radius-buttons: 9999px;
  --radius-cards: 6px;
  --radius-tags: 9999px;
}
```

### 16.2 Observatory (Fey)

```css
@theme {
  --color-midnight-ink: #0b0b0b;
  --color-obsidian-deep: #131313;
  --color-coal-dust: #191919;
  --color-slate-text: #868f97;
  --color-light-smoke: #e6e6e6;
  --color-pure-white: #ffffff;
  --color-cosmic-blue: #479ffa;
  --color-solar-flare: #ffa16c;
  --color-emerald-profit: #4ebe96;

  --font-calibre: 'calibre', Inter, sans-serif;

  --text-display: 48px; --leading-display: 1; --tracking-display: -0.08em;
  --text-heading: 24px; --leading-heading: 1.2;
  --text-body: 14px; --leading-body: 1.36;

  --radius-cards: 16px;
  --radius-general: 10px;
  --radius-buttons-pill: 99px;
  --radius-buttons-square: 6px;
}
```

### 16.3 Synthwave (Bun)

```css
@theme {
  --color-midnight-core: #0d0e11;
  --color-obsidian-base: #14151a;
  --color-charcoal-canvas: #282a36;
  --color-slate-border: #3a3a3f;
  --color-silver-text: #e5e7eb;
  --color-polar-white: #ffffff;
  --color-cyber-pink: #f472b6;
  --color-magenta-glow: #ec4899;
  --color-neon-violet: #a855f7;

  --font-system-ui: system-ui, Inter, sans-serif;
  --font-jetbrains-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-display: 60px; --leading-display: 1;
  --text-heading: 20px; --leading-heading: 1.4;
  --text-body: 14px; --leading-body: 1.43;

  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-3xl: 30px;
  --radius-full: 9999px;
}
```

---

<a id="recipes"></a>
## 17. COMPONENT RECIPES

### 17.1 Galactic Hero (beehiiv)

```html
<section class="galactic-hero">
  <h1 class="galactic-display">POWERING THE INTERNET'S BEST NEWSLETTERS</h1>
  <p class="galactic-sub">The all-in-one platform for newsletter creators.</p>
  <div class="galactic-actions">
    <button class="btn-galactic-primary">Sign up free</button>
    <button class="btn-galactic-ghost">Read docs</button>
  </div>
</section>
```

```css
.galactic-hero {
  background: #060419;
  padding: 120px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.galactic-hero::before {
  content: '';
  position: absolute;
  inset: -10%;
  background: linear-gradient(90deg, #2f39ba 0%, #ff5ec4 100%);
  filter: blur(120px);
  opacity: 0.3;
  pointer-events: none;
}
.galactic-hero > * { position: relative; z-index: 1; }
.galactic-display {
  font-family: 'Clash Grotesk', Archivo, sans-serif;
  font-size: clamp(48px, 9vw, 72px);
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  margin: 0 auto 24px;
  max-width: 900px;
}
.galactic-sub {
  font-family: 'Satoshi', Inter, sans-serif;
  font-size: 24px;
  color: #f7f5ff;
  letter-spacing: 1.08px;
  margin: 0 auto 40px;
  max-width: 600px;
}
.galactic-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.btn-galactic-primary {
  background: transparent;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  padding: 12px 24px;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
  cursor: pointer;
}
.btn-galactic-ghost {
  background: #141230;
  color: #edeff2;
  border: none;
  border-radius: 9999px;
  padding: 12px 24px;
  font-family: 'Satoshi', sans-serif;
}
```

### 17.2 Observatory Pill CTA (Fey)

```html
<button class="fey-cta-pill">Get started</button>
```

```css
.fey-cta-pill {
  background: #e6e6e6;
  color: #000000;
  border: none;
  border-radius: 99px;
  padding: 7px 16px;
  font-family: 'calibre', Inter, sans-serif;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: filter 200ms ease;
}
.fey-cta-pill:hover {
  filter: brightness(0.95);
}
```

### 17.3 Synthwave Code Block (Bun)

```html
<div class="bun-code-block">
  <div class="bun-code-header">
    <span class="bun-badge">REPLACES NPM</span>
  </div>
  <pre class="bun-code-content">
<span class="kw">bun</span> ./<span class="str">index.ts</span>
  </pre>
</div>
```

```css
.bun-code-block {
  background: #282a36;
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  position: relative;
}
.bun-code-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right,
    rgba(0,0,0,0), rgba(236,72,153,0.3), rgba(0,0,0,0)
  );
  filter: blur(40px);
  opacity: 0.5;
  pointer-events: none;
  border-radius: 8px;
}
.bun-badge {
  background: #f472b6;
  color: #ffffff;
  border-radius: 9999px;
  padding: 4px 8px;
  font-size: 11px;
  margin-bottom: 16px;
  display: inline-block;
}
.bun-code-content {
  color: #ffffff;
  margin: 0;
}
.bun-code-content .kw  { color: #fbcfe8; }
.bun-code-content .str { color: #22d3ee; }
```

### 17.4 Soft Galactic Pastel CTA (Circle)

```html
<button class="circle-pastel-cta">Start for free</button>
<input class="circle-pill-input" placeholder="Email address" />
```

```css
.circle-pastel-cta {
  background: #f2dbf5;
  color: #0a0a0a;
  border: none;
  border-radius: 9999px;
  padding: 8px 16px;
  font-family: Inter, sans-serif;
  font-weight: 500;
}
.circle-pill-input {
  background: #ffffff;
  color: #0a0a0a;
  border: 1px solid #e4e7eb;
  border-radius: 9999px;
  padding: 4px 24px;
  font-family: Inter, sans-serif;
  font-size: 16px;
}
.circle-pill-input:focus {
  outline: none;
  box-shadow: rgb(83, 156, 242) 0px 0px 0px 2px;
}
```

### 17.5 Celestial Hero with Cosmic Gradient (Superwhisper)

```html
<section class="celestial-hero">
  <h1 class="celestial-display">Whisper to your screen.</h1>
  <p class="celestial-sub">AI-powered voice transcription, on every device.</p>
  <div class="celestial-actions">
    <button class="btn-frost-pill">Download for Mac</button>
    <button class="btn-frost-ghost">All platforms</button>
  </div>
</section>
```

```css
.celestial-hero {
  background: linear-gradient(
    rgb(0,0,0) 0.85%,
    rgb(17,45,114) 33.4%,
    rgb(75,82,170) 49.68%,
    rgb(168,135,220) 70.84%,
    rgb(230,196,231) 95.8%,
    rgb(252,219,239) 107.19%
  );
  padding: 120px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 24px;
  min-height: 100vh;
}
.celestial-display {
  font-family: Inter, system-ui, sans-serif;
  font-size: clamp(40px, 8vw, 60px);
  font-weight: 600;
  line-height: 1.06;
  letter-spacing: -0.057em;
  color: #ffffff;
  margin: 0;
}
.btn-frost-pill {
  background: #ffffff;
  color: #000;
  border: none;
  border-radius: 9999px;
  padding: 10px 16px;
  font-family: inherit;
  font-weight: 500;
}
.btn-frost-ghost {
  background: transparent;
  color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 10px 16px;
  font-family: inherit;
}
```

### 17.6 Standard Card on Dark (multi-archetype)

```html
<article class="dark-card-standard">
  <span class="status-pill status-pill-info">Active</span>
  <h3 class="card-title">Real-time analytics</h3>
  <p class="card-body">Track every signup, click, and engagement across your newsletter.</p>
  <a class="card-link" href="#">Learn more →</a>
</article>
```

```css
.dark-card-standard {
  background: #0d0b28;
  border-radius: 6px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Satoshi', Inter, sans-serif;
  color: #c4c2d6;
}
.card-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.9px;
  margin: 0;
}
.card-body {
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.72px;
  margin: 0;
}
.card-link {
  color: #2f39ba;
  text-decoration: none;
  font-weight: 500;
  font-size: 16px;
  align-self: flex-start;
}
.status-pill {
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  align-self: flex-start;
}
.status-pill-info { background: #2f39ba; color: #fff; }
```

### 17.7 Performance Bar Graph (Fey-style)

```html
<div class="bar-graph">
  <div class="bar-row">
    <span class="bar-label">Bun</span>
    <div class="bar bar-active" style="--w: 100%;"></div>
    <span class="bar-value">12ms</span>
  </div>
  <div class="bar-row">
    <span class="bar-label">npm</span>
    <div class="bar" style="--w: 30%;"></div>
    <span class="bar-value">142ms</span>
  </div>
</div>
```

```css
.bar-graph {
  background: #14151a;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  align-items: center;
  gap: 16px;
}
.bar-label, .bar-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #e5e7eb;
}
.bar-value { text-align: right; color: #ffffff; }
.bar {
  height: 32px;
  background: #f472b6;
  width: var(--w);
  border-radius: 4px;
  transform-origin: left center;
  animation: bar-grow 1.2s cubic-bezier(0.16, 1, 0.30, 1) forwards;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 25px 50px -12px;
}
.bar-active {
  background: linear-gradient(to right, #ec4899, #a855f7);
}
@keyframes bar-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

---

<a id="checklist"></a>
## 18. VALIDATION CHECKLIST

### 18.1 Color Audit
- [ ] Page background is dark (`#000000` to `#0d0e11` range)
- [ ] Body text is **NOT pure white** (use Fog tier `#c4c2d6`, `#868f97`, `#e5e7eb`)
- [ ] 1-2 brand accent colors documented
- [ ] Multi-tier surface stack (5-7 levels)
- [ ] No Tailwind 500-tier defaults

### 18.2 Typography Audit
- [ ] Display size ≥ 48px (mobile) / 60-72px+ (desktop)
- [ ] Custom font specified (Calibre, Satoshi, Clash, etc.) OR Inter+Mono pairing
- [ ] Body text in Fog/Slate tier (NOT pure white)
- [ ] Negative tracking on display where appropriate

### 18.3 Geometry Audit
- [ ] Border-radius commits to a Dark UI stance:
  - [ ] Pill 9999px buttons + sharp containers
  - [ ] Multi-tier (4/9/16/24/9999)
  - [ ] All-pill interactive (9999px buttons + inputs)
- [ ] No drop shadows on regular elements
- [ ] One signature shadow defined for special cases

### 18.4 Surface Audit
- [ ] 5-7 tier near-black surface stack
- [ ] Translucent rgba layers used for ghost elements
- [ ] Cards differentiated via bg color, not shadow
- [ ] Single allowed shadow (if any) defined globally

### 18.5 Component Audit
- [ ] Pill ghost buttons (transparent + 1px border)
- [ ] Pill filled CTAs (accent bg + white text)
- [ ] Multi-tier surface cards
- [ ] No "shadcn-default" cards with shadow + 12px radius

### 18.6 Motion Audit
- [ ] Hero has gradient animation OR glow pulse
- [ ] Hover: glow intensification on CTAs
- [ ] Card hover: slight surface tier shift OR translateY
- [ ] Reduced motion fallback

### 18.7 Accessibility Audit
- [ ] Body text contrast on bg passes AA (Fog `#c4c2d6` on `#060419` = 8.2:1)
- [ ] CTA contrast passes AA
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
## 19. QUICK REFERENCE

### 19.1 30-Second Decision

```
PROMPT:                                    PICK:
"newsletter / content SaaS"             →  beehiiv (Galactic Command)
"fintech / data-dense premium"          →  Fey (Observatory)
"dev tool / runtime / framework"        →  Bun (Synthwave Lab)
"community / social / marketplace"      →  Circle (Soft Galactic)
"AI tool / voice / creative"            →  Superwhisper (Celestial)
```

### 19.2 30-Second Token Set (Universal Dark UI)

```css
:root {
  /* Pick a dark canvas */
  --bg: #060419;          /* navy OR */
  --bg: #0b0b0b;          /* near-black OR */
  --bg: #0d0e11;          /* slight desat OR */
  --bg: #000000;          /* pure black */

  /* Multi-tier surface stack */
  --surface-1: #0d0b28;
  --surface-2: #131313;
  --surface-3: #191919;

  /* Text — NOT pure white! */
  --text-primary: #ffffff;     /* headings/CTAs only */
  --text-body: #c4c2d6;        /* body — Fog tier */
  --text-muted: #868f97;       /* secondary */

  /* 1-2 accents */
  --accent-1: #2f39ba;         /* Electric Blue OR */
  --accent-1: #ec4899;         /* Magenta Glow OR */
  --accent-1: #479ffa;         /* Cosmic Blue */
  --accent-2: #ff5ec4;         /* Cosmic Magenta (optional) */

  /* Custom font OR Inter+Mono */
  --font-primary: 'Satoshi', Inter, sans-serif;     /* OR Calibre, system-ui */
  --font-mono: 'JetBrains Mono', monospace;          /* if code-centric */

  /* Pill + sharp radius */
  --radius-buttons: 9999px;
  --radius-cards: 6-16px;

  /* Generous space */
  --section-gap: 48-128px;
  --element-gap: 8-16px;
}
```

### 19.3 Common Tasks

```
TASK:                       RECIPE:
"Dark CTA"               →  Pill button, accent bg + white text
"Dark hero"              →  Deep bg + gradient overlay + 60-72px display + 2 pill CTAs
"Dark card"              →  Surface-2 bg + 6-24px radius (no shadow)
"Dark input"             →  Translucent rgba bg OR pill 9999px + 1px hairline border
"Dark section"           →  Multi-tier surface alternation, 48-128px vertical pad
"Dark illustration"      →  Generative graphic OR product mockup (no stock photos)
```

### 19.4 The 5 Dark UI Gradients

```css
/* Indigo Fusion (beehiiv) */
linear-gradient(90deg, #2f39ba 0%, #ff5ec4 100%);

/* Deep Indigo (Circle) */
linear-gradient(142deg, rgb(64,143,237) 18.68%, rgb(62,27,201) 78.25%);

/* Twilight (Superwhisper) */
linear-gradient(rgba(0,0,0,0.5) 0.85%, rgba(0,5,46,0.5) 25.81%, rgba(41,40,94,0.5) 58.36%, rgba(84,60,123,0.5) 79.52%, rgba(133,90,146,0.5) 95.8%, rgba(195,134,171,0.5) 107.19%);

/* Nebula Horizon (Superwhisper) */
linear-gradient(rgb(0,0,0) 0.85%, rgb(17,45,114) 33.4%, rgb(75,82,170) 49.68%, rgb(168,135,220) 70.84%, rgb(230,196,231) 95.8%, rgb(252,219,239) 107.19%);

/* Pink Pulse (Bun) */
linear-gradient(to right, rgba(0,0,0,0), rgba(236,72,153,0.5), rgba(0,0,0,0));
```

---

## 20. APPENDIX: SOURCE SITES

| # | Site | URL | Theme | Archetype |
|---|------|-----|-------|-----------|
| 1 | beehiiv | beehiiv.com | dark | Galactic Command Center |
| 2 | Fey | feyapp.com | dark | Observatory Control Panel |
| 3 | Bun | bun.sh | dark | Synthwave Dev Lab |
| 4 | Circle | circle.so | light (hybrid) | Soft Galactic Glow |
| 5 | Superwhisper | superwhisper.com | dark | Celestial Command |

Each archetype's full DESIGN.md is preserved in `../../raw/dark-ui/0X-<site>.md`.

---

## 21. VERSIONING

- **v1.0.0** (May 2026): Initial 5-site corpus from Refero "dark+ui" tag.

---

**END OF SKILL FILE**

> Dark UI is **multi-tier black + 1-2 accents + pill-and-sharp dichotomy**. Pick an archetype based on product type and commit to its surface/radius discipline.


## Supplemental Depth Pass 1: Dark UI Production Expansion

### 1.1 Strategic Role

Dark UI succeeds when surfaces, elevation, contrast, and states are carefully separated rather than simply painted black.

The intended feeling is focused, immersive, premium, technical, calm. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 1.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: accent colors should clarify state, selection, progress, or primary action.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 1.3 Layout Discipline

Strong Dark UI layouts should:

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

Every component should express Dark UI in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 1.5 Content Discipline

Good copy for Dark UI is specific, short, and matched to the visual energy.

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

- Does the page still feel like Dark UI with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid muddy gray-on-black text, indistinct panels, heavy shadows that vanish, overuse of gradients, and inaccessible disabled states.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 1.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Dark UI system should feel rich because it is disciplined, not because it has more effects.


## Supplemental Depth Pass 2: Dark UI Production Expansion

### 2.1 Strategic Role

Dark UI succeeds when surfaces, elevation, contrast, and states are carefully separated rather than simply painted black.

The intended feeling is focused, immersive, premium, technical, calm. This feeling must be visible in the first viewport, but it must also survive real product sections, mobile layouts, forms, empty states, and repeated components. A design direction is not complete until it can handle boring content gracefully.

### 2.2 Token Discipline

Use tokens as behavioral contracts, not just color names.

Recommended token jobs:

- background: the dominant page or app surface
- surface: cards, panels, modules, and repeated containers
- elevated surface: modal, popover, or selected panel
- text primary: main reading and headings
- text secondary: metadata and supporting descriptions
- border: visible structure and grouping
- accent: accent colors should clarify state, selection, progress, or primary action.
- danger: destructive or failed state
- success: confirmed completion
- focus: keyboard and active accessibility ring

Do not introduce a token unless it solves a repeated design problem. Do not use the same token for unrelated meanings.

### 2.3 Layout Discipline

Strong Dark UI layouts should:

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

Every component should express Dark UI in a way that helps recognition. For example, buttons can carry the radius and accent logic, cards can carry the surface and border logic, and labels can carry the typographic voice. Do not make every component visually loud.

### 2.5 Content Discipline

Good copy for Dark UI is specific, short, and matched to the visual energy.

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

- Does the page still feel like Dark UI with real production content?
- Are the strongest visual moves repeated enough to become an identity?
- Is the primary action visible without explanation?
- Are secondary states quieter but still readable?
- Is avoid muddy gray-on-black text, indistinct panels, heavy shadows that vanish, overuse of gradients, and inaccessible disabled states.
- Would another designer understand the token roles from the implementation?
- Does the mobile version preserve the same character?
- Are decorative elements doing useful work?

### 2.8 Implementation Notes

Before final delivery, inspect the CSS for accidental theme drift. Remove one-off colors, random radius values, unnecessary shadows, duplicate card styles, and hover effects that do not improve comprehension. A mature Dark UI system should feel rich because it is disciplined, not because it has more effects.
