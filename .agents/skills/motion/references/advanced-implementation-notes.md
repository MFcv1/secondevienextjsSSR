# motion - Advanced Implementation Notes

These sections were moved out of SKILL.md to keep the runtime skill closer to the Clean SaaS structure while preserving detailed implementation examples for deeper work.

Load this file only after choosing the archetype and only when the compact component kit in SKILL.md is not enough.

## Component Contracts

### Navigation

Motion navigation should feel like part of the system:

- Brutalist: flat full-width or corner-aligned, uppercase, no radius.
- Type Foundry: persistent top bar, small margins, bordered simple controls.
- Nebula: ghost buttons on translucent/dark background, green active state.
- Stark Editorial: sparse text cluster, no filled backgrounds, hairline separators.
- Instrument Panel: corner controls, condensed labels, status indicators.
- Holographic: transparent sticky bar over imagery, underline active states.
- Neon Noir: pill links and persistent bottom nav are allowed.
- Geometric Soft-Cards: minimal nav plus sharp blue action.
- Iridescent: top-left identity and top-right contact/social cluster.

### Buttons

Decide CTA stance per archetype:

- **Sharp filled:** Brutalist black/white; Geometric pure blue.
- **Ghost bordered:** Stark Editorial, Holographic, Neon Noir, Instrument Panel.
- **Translucent ghost:** Nebula, Holographic.
- **Catalog button:** Type Foundry border plus frost fill.

Hover states should use inversion, border shift, underline reveal, internal icon movement, or accent edge. Avoid generic `translateY(-2px)` lift unless it matches the archetype.

### Cards And Stages

- Cards must have stable dimensions through loading, hover, selected, empty, and error states.
- Use `aspect-ratio`, explicit grid tracks, and `minmax(0, 1fr)` to prevent motion from resizing layout.
- If a card contains media, animate the inner media, not the card's outer box.
- If the archetype uses 0px radius, do not sneak in rounded card defaults.
- If the archetype uses extreme radius, exaggerate it confidently and contrast it with sharp controls.

### Product Proof

The first viewport needs a proof object: product photo, app shell, search interface, type preview, 3D object, shader canvas, animated map, geometric card, or editorial character render. Do not rely on copy alone.
