# Lift-off challenge — Light UI Source Notes

Source: https://styles.refero.design/style/cf1f4666-bb5b-4fc4-a3e6-660218996cbb
Original URL: https://liftoffchallenge.hypr-space.com
Category scan: Light UI
Theme: light
North star: Aircraft control panel.

## Essence

Lift-off challenge is a light UI built like a retro-futuristic control panel.
The page uses a light gray chassis, dark embedded display modules, compact
technical text, monospaced readouts, and urgent red action states. It is dense
and modular rather than airy. The lightness comes from the surrounding panel
surface; the energy comes from black display blocks and alarm-like red.

## Color Tokens

| Name | Value | Role |
| --- | --- | --- |
| Control Panel Grey | `#e5e7eb` | Main canvas and chassis |
| Display Black | `#11161c` | Dark interface panels |
| Obsidian Grey | `#000000` | Primary light-surface text |
| Digital White | `#ffffff` | Text on dark panels |
| Graphite | `#bbbbbb` | Secondary borders |
| Steel Grey | `#a3a3a3` | Muted/inactive states |
| Slate Blue | `#575c75` | Secondary technical text |
| Urgency Red | `#f43325` | Primary critical action and warnings |
| Active Blue | `#0078a8` | Secondary interactive link |
| Gradient Night | `#c9cbe4` | Decorative atmospheric gradient |

## Typography

- Proxima Nova: main UI, headings, buttons.
- SF Mono: technical labels and data readouts.
- Helvetica Neue: minor supporting text.
- Doto: large pixel/digital display values at `106px`.

## Layout

- Full-bleed multi-panel control interface.
- Asymmetric modular grid.
- Dense panels nested in light gray chassis.
- Navigation is implied by in-panel controls.
- Element gap around `8px`.
- Section gap around `48px`.

## Components

- Primary red button: red fill, white text, extreme pill radius.
- Ghost button: transparent, black text, zero radius.
- Dark interface card: black display panel, white text, large rounded radius.
- Pill card: dark pill with subtle white glow.
- Input: transparent, white border, white text, zero radius.
- Doto number display: `106px`, white on black.
- Status indicator: mono/proxima text with red warning.

## Reusable Lessons

- Light UI does not always mean airy; it can be a light chassis around dense UI.
- Red must be reserved for mission-critical action.
- Mono data and digital display type make the panel believable.
- Modular control surfaces need consistent compact gaps.

## Anti-Patterns

- Do not use red decoratively.
- Do not add broad gradients to general content.
- Do not use generic rounded buttons; use extreme pill/control geometry.
- Do not add excessive whitespace; this style is intentionally dense.

