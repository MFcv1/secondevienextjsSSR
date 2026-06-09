---
name: nextjsssr
description: Use when auditing or migrating Seconde Vie public routes from legacy React SPA behavior to Next.js App Router SSR/SSG, especially gallery, product, category, quote/devis, ClientApp, Router.jsx, refresh divergence, SEO, and removal of obsolete SPA residue while preserving the existing UI.
---

# Next.js SSR Seconde Vie

Use this skill for any task involving:

- detecting legacy SPA residue in public routes;
- comparing direct refresh vs internal navigation;
- migrating gallery/category/product/devis surfaces to native Next App Router SSR/SSG;
- preserving the existing SPA UI while removing public SPA routing;
- adding or updating direct-refresh Playwright gates;
- proving SEO/public routes no longer depend on `ClientApp`, `src/app.jsx`, or `src/Router.jsx`.

Before acting, read the root playbook:

```text
../../../nextjsssr.md
```

If marketplace mobile, product media, `marketplace-gallery-shell`, `marketplace-gallery-scroll`, or `src/Router.jsx` are touched, also read:

```text
../../../alertemobile.md
```

Follow the playbook order: inventory, classify, migrate by copying existing UI, remove the equivalent SPA path, then prove with `rg`, `npm run lint`, `npm run build`, route-specific direct-refresh gates, and `npm run mobile:contract` when mobile marketplace is involved.
