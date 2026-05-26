# Neon (neon.tech) — Style Reference
> Server Room After Dark

**URL:** https://neon.tech
**Refero ID:** cc38369a-41e3-4bcd-b619-230ccffe7e8e
**Theme:** dark
**Category Tags:** Cyber Neon, Developer Tools, Dark UI, Terminal

## Tokens — Colors (strict mono + neon green)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Blackout | `#000000` | `--color-blackout` | **Absolute page bg** |
| Depth | `#0a0a0b` | `--color-depth` | Darkest pre-black surface |
| Graphite Deep | `#151617` | `--color-graphite-deep` | **Card bg, code blocks** |
| Graphite | `#242628` | `--color-graphite` | Secondary surfaces |
| Graphite Light | `#303236` | `--color-graphite-light` | Borders, dividers |
| Pewter | `#94979e` | `--color-pewter` | Tertiary text, metadata |
| Ash | `#797d86` | `--color-ash` | Secondary text, inactive nav |
| Cloud | `#c9cbcf` | `--color-cloud` | Hover states |
| Whiteout | `#ffffff` | `--color-whiteout` | **Primary text + CTA bg** |
| **Neon Glow** | `#34d59a` | `--color-neon-glow` | **THE accent** — terminal-green |
| Neon Muted | `#285d49` | `--color-neon-muted` | Subtle viz tones |
| System Warning | `#ff3621` | `--color-system-warning` | Urgent attention only |
| Scanline Fade | `linear-gradient(90deg, rgba(57,165,125,0.6) 50%, transparent 50%)` | gradient | Terminal scanline effect |

## Typography (2 fonts)
### Inter (Display + Body)
- Weights: 400, 500. Sizes: 10-80px (16 distinct sizes!)
- **Tight negative tracking:** -3.2px @ 80px, -1.2px @ 48px, normal at body

### GeistMono (Code + UI labels)
- Sub: Fira Code, Source Code Pro. Weights: 400, 500, 600
- Sizes: 12-20px. Letter-spacing: -0.7px @ 14px, -0.43px @ 16px

### Type Scale
| Role | Size | Tracking |
|------|------|----------|
| caption | 12 | -0.7px |
| body | 16 | -0.43px |
| subheading | 18 | -0.36px |
| heading-sm | 24 | -0.24px |
| heading | 32 | -0.64px |
| heading-lg | 48 | -1.2px |
| display | **80** | -3.2px |

## Spacing & Shapes
- Base 4px, comfortable
- Page max-width: **1200px**
- Section gap: **96-128px** (very generous)
- Card padding: 24px
- Element gap: 8-16px

### Border Radius (signature dichotomy)
| Element | Value |
|---------|-------|
| cards | **4px** (sharp!) |
| inputs | **4px** |
| containers | **4px** |
| **buttons** | **9999px** (full pill!) |

**THE bipolar pattern:** 9999px buttons + 4px containers. Stark tension.

## Components

### Primary Pill Button (signature CTA)
**Whiteout (#fff) bg, Graphite Deep (#151617) text, 9999px radius, 12px/28px padding.** Inter font.

### Ghost Pill Button
Transparent bg, Whiteout text, 1px Graphite Light border, 9999px radius, 12px/18px padding.

### Feature List Item
Whiteout text + Inter, **Neon Glow dot/icon prefix**.

### Navigation Link
Ash text + Inter. Hover/active → Whiteout.

### Tag Badge
Small all-caps GeistMono in Ash, **Neon Glow icon prefix**.

### Announcement Bar
Full-width Blackout bg, Whiteout or Neon Glow text.

### Logo Bar
Monochrome Ash/Pewter logos on Blackout bg.

## Imagery
**ZERO photography.** Abstract generative graphics: data streams, server activity, glitch art. **Thin vertical lines in Neon Glow** + muted tones. Atmospheric backdrops, NOT informational. Stylized terminal screenshots and code blocks. Code-native digital environment.

## Layout
**Full-bleed black** infinite canvas. Centered headline + abstract data-viz hero. **Centered max-width 1200px container.** Sections flow seamlessly without dividers, **96-128px vertical spacing**. Centered stacks for headlines, 2-col for features, multi-col for logo grids. Sticky header.

## Motion Notes
- **Scanline gradient effect** on highlighted code/UI (signature terminal mimic)
- Subtle data-stream animations in bg
- Pill button hover: Whiteout → slight Cloud transition
- Code block syntax highlighting "appears" via reveal
- "Scrolling through a server room" feel

## Do's
- **Pure Blackout #000 for ALL main bg**
- Reserve Neon Glow #34d59a for highlights/viz/dots ONLY
- Whiteout pill buttons for primary CTA
- GeistMono for code/labels/data
- Tight negative letter-spacing on 48px+ headlines (-1.2px+)
- Layered near-black surfaces for depth (NOT shadows)
- **Strict shape dichotomy: 9999px buttons, 4px containers**

## Don'ts
- No gradients or bg colors on main sections
- No traditional box-shadows
- **Neon Glow NEVER for body or headlines**
- No saturated colors except brand green + red alert
- Don't mix Inter + GeistMono in same sentence
- No rounded corners > 4px on cards/inputs
- **Buttons MUST be pill-shaped**

## Similar Brands
Vercel, Linear, GitHub, Replit

## Key Insight
**The "developer terminal" cyber neon archetype.** Pure mono base + ONE terminal-green accent (#34d59a) + signature shape dichotomy (9999px pill buttons + 4px sharp containers). Layered near-blacks (#000 → #0a0a0b → #151617 → #242628 → #303236) create depth without shadows. The 80px Inter display with -3.2px tracking is the typographic flex. **Scanline gradient effect** mimics terminal glow on highlighted code.
