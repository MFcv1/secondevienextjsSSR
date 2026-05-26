# ChatGPT — Technical UI Source Notes

Source: https://styles.refero.design/style/52a007ed-ad1b-46a6-bd44-b76f91df6d0c
Original URL: https://chatgpt.com
Category scan: Technical UI
Theme: light
North star: Frosted glass workstation.

## Essence

ChatGPT is an austere workstation UI. It prioritizes textual interaction, calm
neutral surfaces, a fixed sidebar, a centered prompt/input area, and extremely
restrained color. Depth comes from Snow/Fog panel contrast, not heavy shadows.
The technicality is in the interaction model and focus, not in decorative code
motifs.

## Color Tokens

| Name | Value | Role |
| --- | --- | --- |
| Carbon | `#0d0d0d` | Primary text, headings, icons |
| Snow | `#ffffff` | Main background, button fills |
| Fog | `#f9f9f9` | Sidebar and secondary panels |
| Pewter | `#5d5d5d` | Secondary and placeholder text |
| Stone | `#8f8f8f` | Inactive icons, subtle borders |
| Arctic Mist | `#ececec` | Hover state for ghost controls |
| Link Blue | `#007aff` | Conversational links only |

## Typography

- `ui-sans-serif`: all core UI.
- `OpenAI Sans`: centered prompt/headline.
- Sizes: `14px`, `16px`, `18px`, `24px`.
- Weights: `400`, `500`, `600`.
- No weights above `600`.

## Layout

- Two-column fixed workstation layout.
- Left sidebar for persistent navigation.
- Main area centered around the primary input.
- Max width around `1150px`.
- Section gap around `64px`.
- Element gap can be as tight as `4px`.

## Components

- Ask-anything input: rounded `28px`, central primary object.
- Sidebar nav item: `10px` radius, compact padding.
- Pill outline button: full pill, white fill, subtle border.
- Black filled auth button: carbon fill, white text.
- Voice/action button inside input: rounded and quiet.

## Reusable Lessons

- A technical UI can be almost colorless if the primary workflow is obvious.
- The input can be the hero.
- Sidebars can use background shifts instead of borders.
- Keep shadows nearly absent for a calm workstation feel.

## Anti-Patterns

- Do not introduce extra accent colors.
- Do not use sharp corners for inputs/buttons.
- Do not add explicit heavy shadows.
- Do not break the centered interaction model with busy sections.

