# Product detail image UX audit

Date: 2026-05-25

## Scope

Audit and optimize the cold gallery -> product detail image path on desktop and mobile, without making the gallery first scroll heavier and without removing the desktop blurred backdrop.

Target flow:

```text
/ gallery -> select a product card -> product detail overlay -> primary image, backdrop and thumbnails stabilize
```

Reference product used for local measurements:

```text
/produit/buffet-KrTETXPknYNwgak66T8p
```

## Findings

1. The detail overlay rendered both mobile and desktop image trees, relying on responsive CSS to hide one side. Browsers can still schedule hidden `img` downloads, so opening one product could warm images for a layout that was not visible.
2. The mobile staging pipeline correctly waited for `decode()` and animation frames, but it used the full `srcSet`. On high DPR mobile, Chrome upgraded the staged visible image to `large`, even though the first stable detail paint only needs `medium`.
3. Thumbnail rails used the full product `srcSet` even though their rendered size is 32-58 px. That gave the browser more candidates than needed and made the request waterfall harder to control.
4. The secondary detail warmup requested many `large` variants shortly after opening the page. This competed with the primary paint and the thumbnail rail, especially on a cold cache.
5. The desktop blurred backdrop is useful and should stay, but it only needs the small backdrop source, not the full detail image.

## Changes

- `src/kit/marketplace/ArchitecturalProductDetail.jsx`
  - Render only the active layout branch: mobile detail on mobile, desktop detail on desktop.
  - Keep the mobile `currentSrc`/`decode()` staging, but force the normal detail stage to the `medium` variant without `srcSet`.
  - Keep lightbox behavior separate so full-resolution viewing remains available when explicitly opened.
  - Limit secondary warmups to a small active-neighbor window, then defer the rest to idle.
  - Skip the active mobile image in the post-paint warmup, because the visible `medium` image has already loaded.
  - Make desktop warmups choose `medium` or `large` from viewport width and DPR instead of always preloading `large`.
  - Make thumbnail rails load the explicit `thumb` URL only.
  - Use existing `blurDataUrl` / `dominantColor` metadata as stable placeholders for the main mobile frame and thumbnails.
- `scripts/audit-product-detail-images.mjs`
  - Replays the cold gallery -> detail path on desktop and mobile.
  - Fails if mobile detail requests `large` responsive variants, if desktop DPR1 requests `large` at 1440 px, if the wrong branch renders, or if the desktop blurred backdrop disappears.

## Measurements

Environment:

```text
URL: http://127.0.0.1:4300/
Build: npm run build + npm run start
Browser: Playwright Chromium, cache disabled, CPU throttle x4
Viewports: desktop 1440x900, mobile 390x844 DPR 3
```

Baseline:

```text
desktop: first detail image complete ~462 ms after click; secondary large variants loaded for slots 1-6.
mobile: first detail image complete ~325 ms after tap; visible/staged image upgraded to large; large variants loaded for slots 0-6.
```

After:

```text
desktop: first visible detail image ready ~352 ms after click; secondary warmups use medium at 1440x900 DPR 1; no large secondary requests in the measured waterfall.
mobile: first visible detail marker ~70 ms after tap; normal detail requests medium + thumbs; no large detail variants in the measured waterfall.
mobile product image bytes in the run dropped from ~1157 kB to ~878 kB.
final gate: mobile no longer re-requests the active slot 0 medium variant after tap; only neighbor medium variants are warmed.
```

The only console warning during rendered QA was the existing local sandbox warning:

```text
[Firebase] AppCheck desactive - NEXT_PUBLIC_RECAPTCHA_SITE_KEY non configuree.
```

## Validation

Commands run:

```powershell
npm run lint
npm run mobile:contract
npm run build
npm run perf:budget
npm run perf:scroll
npm run perf:product-images
NEXT_BASE_URL=http://127.0.0.1:4300 npm run perf:architecture
```

Important results:

```text
mobile:contract: OK, including Router invariant and mobile staging contracts.
perf:budget: OK, public route budgets still pass.
perf:scroll: OK, ProductDetail does not mount during immediate gallery scroll.
perf:product-images: OK, mobile and desktop detail image assertions pass.
perf:product-images also checks the active mobile medium variant is not re-requested after tap.
perf:architecture local Next product route: 46 requests, 2218 kB total, 516 kB images.
```

## Remaining risk

- Real-device mobile validation is still stronger than emulation for Chrome decode/raster behavior and touch inertia. A Samsung Android ADB interface was detected, but `adb devices` currently reports the device as `offline`, so the browser/CDP phone test still needs USB authorization on the device.
- The thumbnail rail still downloads all visible product thumbnails after detail open. This is intentional for visual completeness, but the placeholders now hide the cold-cache blank state.
- Larger DPR desktop displays may still choose `large` for adjacent warmups. That is intentional when the computed display target exceeds the medium variant.
