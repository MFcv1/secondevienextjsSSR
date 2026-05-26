---
source: Refero Styles
refero_url: https://styles.refero.design/style/3172cd4d-118a-4a16-a259-6b634d32322e
brand_url: https://mercury.com
style_family: technical-sans
theme: dark
captured_for: design-skills-db
---

# Mercury - Technical Sans Source Notes

## Core read

Mercury is a spacious dark command-center brand. It is less dense than Linear
and less tactile than Cursor. Its contribution to Technical Sans is atmospheric
restraint: dark surfaces, light custom typography, one violet-blue accent, and
generous section rhythm. It proves that a technical/financial product can feel
expansive without sacrificing interface clarity.

The system avoids shadow-based depth. Instead, depth comes from neutral layers,
large spacing, contrast, and precise blue emphasis. Typography uses light weights
and positive tracking, giving the interface authority through air rather than
through heaviness.

## Extracted tokens

| Token | Value | Use |
| --- | --- | --- |
| Mercury Blue | #5266eb | Primary CTA only |
| Ghost Blue | #cdddff | Secondary button backing and hover states |
| Deep Space | #171721 | Outermost page background |
| Midnight Slate | #1e1e2a | Main page/section background |
| Graphite | #272735 | Subtle interactive surfaces |
| Lead | #70707d | Borders, dividers, quiet UI strokes |
| Silver | #c3c3cc | Secondary copy and disabled text |
| Starlight | #ededf3 | Primary text on dark surfaces |
| Pure White | #ffffff | Text on blue CTA only |

## Typography

- Display: arcadiaDisplay or Inter/Manrope fallback.
- Display weights: 360, 480, 530.
- Display sizes: 21, 24, 28, 32, 42, 49, 65.
- Display line-height: about 1.10 to 1.20.
- Display tracking: subtle positive tracking around 0.01 to 0.02em.
- UI/body: arcadia or Inter/Manrope fallback.
- UI weights: 360, 400, 420, 480.
- UI sizes: 12, 14, 16, 18, 21.
- UI line-height: 1.20 to 1.50.

## Structure

- Theme: dark.
- Density: spacious.
- Base unit: 4px.
- Max width: around 1200px.
- Section gap: 80 to 120px.
- Element gap: 12 to 32px.
- Buttons: 32px or 40px radius.
- Inputs: 32px radius.
- Containers: 4px radius.
- Cards: often 0px or very subtle; hierarchy is not card-heavy.

## Components to reuse

1. Blue primary pill
   - #5266eb fill.
   - White text.
   - 32px radius.
   - Action only.

2. Header ghost pill
   - Ghost Blue at low opacity.
   - Starlight text.
   - 40px radius.

3. Text-only nav link
   - Transparent.
   - Starlight.
   - No border or fill.

4. Joined hero email input
   - Transparent/dark field.
   - Rounded left side.
   - Joined to a pill action button.

5. Feature list link
   - Bottom border in Lead.
   - Display type for title.
   - No card frame.

## Design lessons

- A dark technical site can be spacious and calm.
- Shadowless elevation is possible if surface colors and spacing are controlled.
- Positive tracking can make light typography feel composed.
- Blue should stay action-oriented; do not turn it into decorative glow.
- Full-bleed atmospheric imagery can open the experience, but product sections
  should become text-driven and operational.

## Anti-patterns

- Do not use Mercury Blue for body text or decoration.
- Do not use heavy typography above 530.
- Do not add generic shadows.
- Do not use pure white for body copy.
- Do not make dense card grids; Mercury needs air.

