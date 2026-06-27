---
name: visual-annotation-tuning
description: Use when Codex must adjust any UI/UX element in a page section from screenshots with arrows, circles, red marks, or user annotations. Applies to buttons, cards, images, titles, text blocks, badges, icons, decorative elements, overlays, spacing, size, alignment, and visual hierarchy, especially for iterative frontend tweaks where the user says move this left/right/up/down, make it bigger/smaller, align it, avoid nearby elements, or preserve desktop while tuning mobile.
---

# Visual Annotation Tuning

## Purpose

Use this skill for screenshot-driven UI tuning on any visible section element. It complements `frontsymmetry`: `frontsymmetry` explains layout mechanics; this skill prevents misreading the user's visual annotation and makes each iteration converge faster.

## Core Rule

Treat the screenshot as the source of truth. The user's red arrow/circle usually identifies a specific rendered element and a desired visual direction. Before editing, translate the annotation into a concrete sentence:

```text
Target: the purple decorative element near the CTA.
Requested change: move it further left, not under the black CTA arrow.
Scope: mobile only; desktop must stay unchanged.
```

If that sentence is ambiguous, infer from the newest screenshot and the user's latest wording. The newest instruction wins.

For any non-trivial visual tweak, send a one-sentence interpretation before editing:

```text
I understand this as: move only the purple accent left of the CTA farther left, not the purple accent near the title.
```

This is not asking permission; it is an error check. If the user interrupts, follow the correction. If not, patch immediately.

## Annotation Reading Protocol

1. Identify the exact target element by visual identity, not only by code name.
   Examples: "button Rejoindre Instagram", "central product card", "headline", "small purple decoration left of CTA", "right carousel card", "heart icon on the card".

2. Identify the reference object.
   Common references are title text, CTA pill, icon button, product card, carousel edge, viewport edge, or another decorative token.

3. Identify the forbidden area.
   Users often mean "not too close to text", "not behind the card", "not cut by the edge", or "not overlapping the button".

4. Convert the request to a visible delta.
   Small deltas often look like no change in screenshots. For mobile visual tuning, use meaningful first moves:
   - horizontal nudge: 4-8 percentage points or 16-32px;
   - vertical nudge: 10-28px;
   - size nudge: 4-8px for small tokens, 8-14px for larger tokens;
   - opacity nudge: 0.04-0.10.

5. Preserve the active scope.
   If the user says mobile, edit only mobile media queries or mobile classes. Do not touch desktop positioning.

6. Verify the target's implementation path.
   Check whether the rendered element is controlled by component classes, inline style variables, CSS variables, media queries, JS animation, or transform math. If variables are overridden inline, edit direct scoped CSS properties or the source data that emits the inline style.

7. Check for twins.
   If two elements share color, icon, shape, or size, disambiguate by nearby anchors: "purple near title", "purple left of CTA", "purple bottom right". Never patch a same-colored sibling unless it is the one at the arrow location.

## Direction Semantics

Be precise about the user's wording:

- "plus a gauche" means lower the `left` value, unless the element is transformed from its own center and the visual result proves otherwise.
- "plus a droite" means raise the `left` value.
- "remonte" means lower `top` or use a negative Y transform.
- "descend" means raise `top` or use a positive Y transform.
- "pas derriere le bouton" means keep the element outside the button's visual footprint.
- "derriere le bouton" means overlap intentionally behind the button, but only if the user explicitly asks for overlap.
- "trop pres du texte" means move away from the text, even if that slightly breaks previous symmetry.

When the user corrects you, do not defend the previous interpretation. Restate the corrected meaning and make a larger, obvious adjustment.

## Coordinate Calibration

Use the rendered screenshot coordinate system, not only semantic layout intuition:

- Determine whether the target is anchored by its center (`left/top` plus `translate(-50%, -50%)`) or by its top-left corner.
- With center anchoring, changing `left` moves the center. A 40px-wide element at `left: 91%` may be partly clipped on narrow mobile screens.
- If the element looks unchanged after a patch, suspect one of four issues:
  1. the wrong selector was edited;
  2. an inline style or animation overrides the CSS;
  3. the delta was too small;
  4. the browser still shows stale compiled CSS.

For screenshot-guided iterations, prefer visible changes over tiny "mathematical" nudges until the user says the placement is close.

## Decorative Token Placement

For any element in a section:

- Separate content, controls, media, and decoration before editing.
- Content includes titles, labels, paragraphs, counters, and captions.
- Controls include buttons, inputs, tabs, toggles, icon buttons, links, and CTAs.
- Media includes images, video frames, cards, carousel slides, thumbnails, and product tiles.
- Decoration includes blobs, floating icons, background shapes, lines, badges, ornaments, and atmospheric accents.
- Never assume the annotation targets the most visually similar element globally; it targets the element at the arrow/circle location in the newest screenshot.

## Element-Specific Heuristics

Use the element type to choose the safest change:

- Text or headings: prefer width, max-width, line-height, font-size, or local transform. Avoid moving surrounding sections unless requested.
- Buttons and CTAs: preserve hit area and readable label. Move decorative neighbors away before shrinking the button.
- Cards and images: preserve aspect ratio first. Use container dimensions and object-position before cropping blindly.
- Icons and badges: tune size in 2-6px steps and position in 4-12px steps once close.
- Overlays and floating controls: check z-index and pointer-events before moving. Do not hide an interactive control behind decoration.
- Decorations: tune position, size, opacity, and distribution. They may overlap softly only when the user asks for that visual effect.

## Decorative Element Placement

For decorative blobs, icons, or floating accents:

- Build a constellation: one primary accent, two or three secondary accents, and small micro accents.
- Do not cluster many tokens on one side unless the design intentionally asks for it.
- Avoid centers too close to edges; a token centered at `91%` with `40px` width can be partly cut on narrow screens.
- Keep tokens out of readable text unless they are faint background texture.
- Let empty space host decoration; never make decoration compete with the CTA or product card.
- Use z-index only when the desired overlap is explicit. Prefer position/size fixes first.

## Iteration Discipline

When a user says "no visible change", assume the delta was too small or the wrong token was edited.

Do this next:

1. Re-identify the target from the latest screenshot.
2. Check whether another similarly colored token exists.
3. Apply a larger delta to only the target.
4. Report the exact value changed, e.g. `left: 32% -> 18%`.

Avoid changing multiple nearby elements during a micro-correction unless the user points to multiple targets.

When the user is frustrated, switch to "single-target mode":

- edit exactly one element;
- change only one or two properties;
- make the value change large enough to be visible;
- report only that target and the before/after values.

Do not continue polishing neighboring elements until the user confirms the target moved correctly.

## Self-Test Before Final

Before final response, run this mental checklist:

```text
Did I edit the element at the arrow/circle, not a similar sibling?
Did I use the latest screenshot and latest wording?
Did I preserve the requested breakpoint/scope?
Would the value change be visible in a screenshot?
Did I avoid moving unrelated section content?
Did I state exact values if the user is iterating visually?
```

If any answer is no, fix the patch before final.

## Patch Style

Prefer isolated CSS changes for visual-only adjustments:

```css
@media (max-width: 1023px) {
  .example-token {
    left: 18%;
    top: 236px;
    width: 42px;
    height: 42px;
  }
}
```

Use existing class names, tokens, and breakpoints. If inline style variables override CSS variables, set direct CSS properties (`left`, `top`, `width`, `height`) in the scoped media query.

## Reporting

Keep the response short. Say:

- what target changed;
- exact before/after values when useful;
- whether desktop was untouched;
- whether validation was skipped or limited by project instruction.
