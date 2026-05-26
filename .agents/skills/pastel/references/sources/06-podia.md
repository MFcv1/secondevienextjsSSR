# Podia — Style Reference
> Playful market stall atop soft-glowing white

**URL:** https://www.podia.com
**Refero ID:** 342f1c3b-a123-49b6-a980-3491bc7793db
**Theme:** light
**Category Tags:** Pastel, Playful, Card-Heavy, Multi-Accent

## Tokens — Colors (multi-pastel + earth tones)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink Black | `#06040e` | `--color-ink-black` | **Primary text + outline + CTA bg** |
| Deep Ocean | `#10242f` | `--color-deep-ocean` | Secondary text, solid buttons |
| Crystal Canvas | `#ffffff` | `--color-crystal-canvas` | Page bg, cards |
| Cloud Gray | `#e1edf2` | `--color-cloud-gray` | Light surfaces, button text |
| Warm Sand | `#f5f5f5` | `--color-warm-sand` | Main page bg |
| Sky Blue | `#a5c8d8` | `--color-sky-blue` | **Feature card bg accent** |
| Lavender Mist | `#cbb0eb` | `--color-lavender-mist` | Feature card bg accent |
| Sunset Orange | `#e39a4d` | `--color-sunset-orange` | Feature card bg accent |
| Rich Plum | `#1f1738` | `--color-rich-plum` | Feature card bg (dark variant) |
| Earthy Umber | `#452623` | `--color-earthy-umber` | Feature card bg (dark variant) |
| Light Peach | `#f6ddc4` | `--color-light-peach` | Text on dark bg, icon accents |

## Typography
### StabilGrotesk (Single font, all roles)
- Sub: Inter. Weights: 400, 500, 700
- Sizes: **11, 12, 16, 18, 20, 22, 24, 36, 40, 60px** (10 sizes!)
- Letter-spacing: -1.8px (60px) → -0.33px (11px) — **progressive negative tracking**

## Spacing & Shapes
- Base 8px, comfortable
- Scale: 8, 16, 24, 32, 40, 56, 80, 120, 128, 144
- Section gap: 40px
- Card padding: 16px
- Element gap: 16px

### Border Radius (multi-tier signature)
| Element | Value |
|---------|-------|
| links | 8px |
| **buttons** | **16px** |
| misc | 24px |
| **cards** | **56px** (signature soft-pill) |

## Components

### Primary Filled Button
**Ink Black bg, Cloud Gray text, 14px radius, 16px/24px padding (generous)**.

### Secondary Filled Button
Deep Ocean bg, Cloud Gray text, 8px radius, 10/16 padding.

### Outlined Button
Transparent, Ink Black text + 1px border, 8px radius, 10/16 padding.

### Hero Feature Card - Sky Blue (etc.)
**Sky Blue/Sunset Orange/Rich Plum bg, Ink Black text, 56px radius (signature large pill cards!)**.

### Hero Feature Card - Lavender (Dark variant)
Rich Plum bg, Light Peach text, **Lavender Mist border**, 56px radius.

## Surfaces
| Level | Color | Purpose |
|-------|-------|---------|
| 0 | #f5f5f5 (Warm Sand) | Page bg |
| 1 | #ffffff (Crystal) | Cards |
| 2 | #e1edf2 (Cloud Gray) | Elevated sections |

## Imagery
**Light candid lifestyle photography** of diverse individuals, slightly desaturated, often in **circular/organic crops**. Flat 2D illustrations using brand accent colors. Product screenshots nested in abstract card designs. Outlined lightweight monochrome icons. Balanced density, contained in card structures.

## Layout
Max-width contained at top, transitions to full-bleed for larger cards/bg sections. Hero: prominent centered headline + light bg + floating abstract shapes. Vertical rhythm with alternating light/gray bands. **3-column card grids** for features (sometimes 2). Text-left/image-right alternating. Sticky top nav minimal + Sign up CTA.

## Motion Notes
- Floating abstract shapes drift in hero
- Card hover with subtle elevation/scale
- Section bg transitions
- Decorative shapes may rotate slowly
- Soft, friendly, market-stall energy

## Do's
- Ink Black for primary text + outlines + CTA bg
- Crystal Canvas / Warm Sand for page/card bg
- 16px radius on buttons, 56px on prominent cards
- Negative letter-spacing on StabilGrotesk progressive
- Sky Blue / Sunset Orange / Lavender Mist for feature card bg
- 16px element gap, 16px card padding
- Ink Black bg + Cloud Gray text for primary CTA

## Don'ts
- No arbitrary radii (16/8/56 only)
- No saturated colors except defined accents
- No generic system fonts (StabilGrotesk required)
- No heavy shadows or gradients (color contrast for depth)
- No deviation from 16/40px spacing rhythm
- No chromatic body text
- No Light Peach as bg (text/icons only)

## Similar Brands
ConvertKit, Teachable, Carrd, CreatorKit, Stripe

## Key Insight
**The "market-stall pastel"** — Multi-pastel feature cards (Sky Blue, Sunset Orange, Lavender, Rich Plum) **with 56px radius (extreme pills)** create a literal market-stall feel. ONE typeface (StabilGrotesk) with 10 sizes and progressive negative tracking. Dark CTA buttons (#06040e) provide contrast against pastel landscape. Each feature card is its own colored pill — the playfulness comes from card-color-rotation, not type or motion.
