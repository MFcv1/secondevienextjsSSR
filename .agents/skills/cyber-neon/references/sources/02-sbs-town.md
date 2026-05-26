# SBS Town — Style Reference
> Neon Cyberpunk Metropolis

**URL:** https://open-sbs.brig.ht/city
**Refero ID:** d670d78f-4542-4a66-b886-fc32361b8562
**Theme:** dark
**Category Tags:** Cyber Neon, 3D Immersive, Minimal UI, Map

## Tokens — Colors (multi-neon glow)
| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Void | `#111111` | `--color-midnight-void` | **Deep bg** for immersive scenes |
| Ghost Marble | `#ffffff` | `--color-ghost-marble` | Text, icon fills, accent borders |
| **Cyber Glow Pink** | `#ff00d9` | `--color-cyber-glow-pink` | Decorative glow accent (NOT CTA) |
| **Aqua Beam** | `#00f0ff` | `--color-aqua-beam` | Decorative glow accent (NOT CTA) |
| **Voltage Yellow** | `#fafa00` | `--color-voltage-yellow` | Bright POI markers |
| Infrared Red | `#f0445d` | `--color-infrared-red` | Tags, urgency labels |

## Typography (single font, single weight)
### Circular (UI only)
- Sub: system-ui. Weight: **400 only**. Size: **16px only**
- Line height: 1.15
- **THE most minimal typography** — single size, single weight

## Spacing & Shapes
- Base 4px, comfortable
- Scale: 5, 20, 29, 30, 43 (sparse)
- Section gap: 43px
- Card padding: 20px
- Element gap: 5px (very tight)

### Border Radius (uniform extreme pill)
| Element | Value |
|---------|-------|
| **tags** | **100px** |
| **buttons** | **100px** |
| **overlays** | **100px** |

**Everything is 100px pill.** No exceptions.

## Components

### Kickoff Tag Button (Primary CTA)
**Warning Amber bg `#ff7c24`, white text, Circular 400 16px, 100px radius**, 5px/20px padding.

### Label Tag (Informational)
Infrared Red OR Warning Amber bg, white text, 100px radius, same 5/20 padding.

### Map Overlay Icon
Outlined Ghost Marble icon + 16px Circular text. **No background, minimal positioning.**

## Imagery
**3D rendered futuristic cityscape** — full viewport. Dimensional buildings, glowing pathways, abstract geometric icons (cubes). **Dark moody lighting + Aqua Beam + Cyber Glow Pink + Voltage Yellow** define outlines and interactive elements. Filled glow-in-dark icons.

## Layout
**Full-bleed 3D scene** as primary visual fills viewport. **No traditional page width constraint.** Hero IS the immersive 3D scene. UI = minimal floating overlays + tags integrated into 3D environment. Nav elements (Map icon, Show me around) subtly in corners. **No traditional sections or grids** — interactive map with annotated features.

## Motion Notes
- 3D city camera animation/orbit
- **Glowing accent pulse animations** on points of interest
- Pill tag hover: glow intensification
- Smooth camera transitions between POI
- Holographic float effect on tags
- The whole experience is the motion

## Do's
- Midnight Void (#111111) for ALL bg surfaces
- Ghost Marble for primary text/icons
- Cyber Glow Pink + Aqua Beam for interactive glow accents
- **ALL rounded elements 100px (commit to pill shape)**
- Circular 400 16px for ALL UI text
- Warning Amber + Infrared Red for semantic tags
- 5px/20px padding on small interactive

## Don'ts
- No saturated bg colors (deep dark only)
- No heavy shadows (rely on glow accents)
- No deviation from Circular 400 16px (consistency!)
- **No subtle radii — 100px ONLY**
- No non-glowing accent colors
- No large blocky UI components (lightweight ethereal)
- No dense text (concise labels only)

## Similar Brands
Cyberpunk 2077 (game UI), TRON: Legacy, Brave Browser, Linear

## Key Insight
**The "Map UI" cyber neon archetype.** The website IS a 3D city — UI shrinks to floating glow-pill annotations. Single font + single weight + single size + single radius (16px Circular 400, 100px pill) = ultimate restraint. The motion comes from the 3D scene, not the UI. Multi-glow palette (pink + aqua + yellow + red) is NEVER a CTA — it's environmental lighting.
