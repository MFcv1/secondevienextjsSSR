# beehiiv — Style Reference
> Galactic Command Center

**URL:** https://beehiiv.com
**Refero ID:** 350b1557-56f0-4361-8c8b-b7a88081982b
**Theme:** dark
**Category Tags:** Dark UI, SaaS, Newsletter, Galactic

## Tokens — Colors (deep navy + magenta + electric blue)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Ink | `#060419` | `--color-midnight-ink` | **Page bg** — deep navy/black |
| Shadow Violet | `#0d0b28` | `--color-shadow-violet` | Card bg, secondary surface |
| Storm Gray | `#4e4e6c` | `--color-storm-gray` | Disabled, subtle text |
| Cloud Whisper | `#c4c2d6` | `--color-cloud-whisper` | Tertiary text, inactive |
| Ghost White | `#f7f5ff` | `--color-ghost-white` | Secondary body text |
| Starfield White | `#ffffff` | `--color-starfield-white` | Primary text |
| Electric Blue | `#2f39ba` | `--color-electric-blue` | **Primary CTA** |
| Cosmic Magenta | `#ff5ec4` | `--color-cosmic-magenta` | Secondary highlights |
| Indigo Fusion | `linear-gradient(90deg, rgb(47,57,186) 0%, rgb(255,94,196) 100%)` | gradient | Hero gradient |

## Typography
### Satoshi (Body)
- Sub: Inter. Weights: 400, 500, 600, 700
- Sizes: 12-48px. **Letter-spacing: 0.045em (consistent positive)**

### Clash Grotesk (Display)
- Sub: Archivo. Weights: 400, 700. Sizes: 16-72px

## Spacing & Shapes
- Base 8px, comfortable
- Section gap: 48px, Card padding: 24px, Element gap: 16px

### Border Radius (bipolar)
| Element | Value |
|---------|-------|
| **buttons** | **9999px** (pill) |
| **tags** | **9999px** |
| inputs | 6px |
| default | 6px |

## Components

### Primary CTA (Ghost Pill)
**Transparent bg, white text, 1px #ffffff0f border, 9999px radius, 12/24px padding**.

### Secondary CTA (Solid Pill)
Shadow Violet bg, Ghost White text, 9999px, 12/24px.

### Accent Gradient Button
**Indigo Fusion gradient bg, white text, 7px radius (sharp!), 24px all-side padding**.

### Feature Card
Shadow Violet bg, **6px radius**, no shadow, 24px padding.

### Testimonial Card (with shadow!)
Shadow Violet, 6px, **box-shadow `rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.1) 0 4px 6px -4px`**.

## Do's
- Midnight Ink (#060419) primary bg
- Electric Blue for CTAs/active states
- **9999px radius for buttons & tags** (pills)
- 6px radius for cards & inputs (sharp)
- Clash Grotesk headings 48-72px, Satoshi everywhere else
- Shadow Violet cards with 6px radius
- Indigo Fusion gradient for hero accents

## Don'ts
- No white backgrounds on dark sections
- No radii other than 6px or 9999px
- No strong shadows except testimonials
- No font mixing (Clash + Satoshi only)
- No saturated colors for large text
- Cosmic Magenta sparingly (impact only)

## Key Insight
**The "galactic SaaS" archetype.** Deep navy `#060419` (NOT pure black, has slight blue) + ghost pill buttons + Indigo Fusion gradient. Bipolar radius (6px containers + 9999px pills) creates tension. Letter-spacing 0.045em on Satoshi = open feel against UI precision.
