# Bun — Style Reference
> Synthwave dark lab — precision code with neon accents

**URL:** https://bun.sh
**Refero ID:** 408a149c-702f-4442-99df-bea49d9c0d9b
**Theme:** dark
**Category Tags:** Dark UI, Developer, Synthwave, Neon

## Tokens — Colors (mono surfaces + 4 neon accents + 3 gradients)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Core | `#0d0e11` | `--color-midnight-core` | **Page bg** |
| Obsidian Base | `#14151a` | `--color-obsidian-base` | Card bg, sections |
| Charcoal Canvas | `#282a36` | `--color-charcoal-canvas` | Code blocks, components |
| Slate Border | `#3a3a3f` | `--color-slate-border` | Subtle borders |
| Graphite Accent | `#3b3f4b` | `--color-graphite-accent` | Accent borders, hover |
| Ash Text | `#6b7280` | `--color-ash-text` | Secondary, disabled |
| Silver Text | `#e5e7eb` | `--color-silver-text` | Primary body text |
| Polar White | `#ffffff` | `--color-polar-white` | High-contrast headings |
| **Cyber Pink** | `#f472b6` | `--color-cyber-pink` | **Brand accent + interactive** |
| Neon Violet | `#a855f7` | `--color-neon-violet` | Secondary brand |
| Faded Rose | `#fbcfe8` | `--color-faded-rose` | Subtle highlight text |
| **Magenta Glow** | `#ec4899` | `--color-magenta-glow` | **CTA button bg** |
| Electric Cyan | `#22d3ee` | `--color-electric-cyan` | Data status highlights |
| Virtual Violet | `#c084fc` | `--color-virtual-violet` | Tooltips, active filters |
| System Green | `#34d399` | `--color-system-green` | Success |
| Warning Yellow | `#fcd34d` | `--color-warning-yellow` | Warning |
| Danger Red | `#f87171` | `--color-danger-red` | Error |
| **Gradient Pink Pulse** | `linear-gradient(to right, transparent, rgba(236,72,153,0.5), transparent)` | gradient | Pulse around content |
| Gradient Cosmos | `radial-gradient(134.26% 244.64% at 42.92% -80.36%, rgb(179,1,179) 25.45%, rgb(56,29,189) 100%)` | gradient | Illustration depth |

## Typography
### system-ui (Primary, 6 weights!)
- Sub: Inter. Weights: 300, 400, 500, 600, 700, **800**
- Sizes: 12-60px (11 values). `font-feature-settings: "kern"`

### JetBrains Mono (Code only)
- Sub: Fira Code. Weights: 400-700. Sizes 12-19px. `"kern"` enabled

## Spacing & Shapes
- Base 4px, comfortable
- Page max-width: **1280px**
- Section gap: **128px** (very generous)
- Element gap: 8px

### Border Radius
| Element | Value |
|---------|-------|
| **badge** | **9999px** (pill) |
| input | **7px** |
| buttons | **8px** |
| default | **8px** |

**Restricted set:** Only 4, 7, 8, 12, 30, 9999px allowed.

## Components

### Primary CTA Button
**Magenta Glow (#ec4899) bg, Polar White text, 8px radius, 16/36px padding**.

### Ghost Navigation Button
Transparent, Silver Text, **`7px 7px 0 0` radius (top-only)**, Charcoal Canvas border, 16px padding. Tab-style!

### Text Accent Button
Transparent, white text, `rgba(255,255,255,0.16)` border, 6px radius, 4px padding.

### Large Feature Card
Transparent, white text, **Graphite Accent border, 5px radius, 32px padding**.

### Command Line Input
Charcoal Canvas bg, Polar White text, Slate Border, 8px radius, 16px padding.

### Performance Bar Graph
Obsidian Base bg + **Cyber Pink bars with shadow `rgba(0,0,0,0.25) 0 25px 50px -12px`**.

### Code Block
Charcoal Canvas bg, **syntax-highlighted: Faded Rose keywords, Electric Cyan types, Polar White code**, JetBrains Mono.

### Highlight Badge ("Replaces")
**Cyber Pink/Neon Violet bg, white text, 9999px pill, 4/8px padding**.

## Surfaces (3 tiers)
| Level | Color |
|-------|-------|
| 0 | #0d0e11 (Midnight Core) |
| 1 | #14151a (Obsidian Base) |
| 2 | #282a36 (Charcoal Canvas) |

## Imagery
**Functional & illustrative.** Performance graphs, command-line outputs, code blocks. **No product photography.** Sparse vibrant geometric "bug" illustrations as badges. Mono outlined/filled icons.

## Layout
Max-width **1280px** centered. Hero: centered headline + dark bg + side CTAs. Sections alternate text + visual asymmetric. **128px section gaps**. 2-3 col card grids. Sticky top bar with primary CTA + Discord link.

## Motion Notes
- **Pink pulse gradient ripples** around key content (signature)
- Code block syntax highlight reveals on scroll
- Performance bar animations
- Button hover: Magenta Glow intensity shift
- Synthwave feel — neon glow accents pulse

## Do's
- Midnight Core (#0d0e11) base bg
- Charcoal Canvas (#282a36) for cards/code blocks
- **Magenta Glow CTA + Polar White text**
- Pure White headings, Silver Text body
- 9999px radius for tags/badges (pill)
- JetBrains Mono RESERVED for code only
- Cyber Pink + Neon Violet sparingly (key accents)

## Don'ts
- No light backgrounds (exclusive dark)
- No strong shadows (vary surfaces + inner borders)
- Don't use system-ui for code (JetBrains Mono only)
- No chromatic overuse (accents not primary)
- No generic button styles
- **No radii beyond 4/8/12/30/9999**

## Similar Brands
Vercel, GitHub, Linear, Tailwind UI dark, Stripe docs

## Key Insight
**The "synthwave dev tool" archetype.** Multi-tier blacks (#0d → #14 → #28) + neon pink/violet accents + "pulse gradient" decorations. Strict radius set (only 4/8/12/30/9999). Magenta Glow CTA + Cyber Pink accents = high-energy without overwhelming. Tab-style ghost nav buttons (top-only radius) is unusual.
