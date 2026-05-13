# Completion Audit - 2026-05-13

## Objective

Creer un clone Next.js SSR/SSG maintenable de `SecondevieAnais` dans `C:\Users\matth\Travail\SecondevieNextjsSSR`, sans modifier le projet source, pour comparer SPA Vite/Firebase et Next SSR/Firebase sur SEO, image loading, produit, accueil, mobile et desktop.

## Checklist

| Exigence | Evidence | Statut |
| --- | --- | --- |
| Nouveau dossier sibling, source intact | Dossier cible present; `git status --short` vide dans `SecondevieAnais` | OK |
| Lire `AGENTS.md` et `alertemobile.md` | Fichiers copies dans le clone; invariant mobile verifie par `npm run mobile:contract` | OK |
| Inspecter configs/source/functions | `src`, `functions`, configs Firebase, scripts et assets copies; Next build compile ces sources | OK |
| Next.js recent App Router | `app/` routes App Router; build Next.js 15.5.18 | OK |
| Firebase conserve | `firebase.json`, rules, functions, envs et SDK client conserves; Admin SDK server-only | OK |
| Firebase SSR compatible / docs lues | Voir `MIGRATION_REPORT.md` section docs officielles | OK |
| App Hosting recommande | `apphosting.yaml` + docs dans `RUNBOOK.md` et `MIGRATION_REPORT.md` | OK |
| Pas de secret serveur client | Scans `.next/static` sans Admin SDK ni secrets serveur; `VITE_SUPER_ADMIN_EMAIL` reste public comme dans la SPA legacy | OK |
| Strategie sandbox/read-only | `.env.sandbox` par defaut; `RUNBOOK.md` documente sandbox/read-only/emulateur | OK |
| Pages produit SSR/SEO | `app/produit/[slugOrId]/page.jsx`; `npm run seo:check` OK | OK |
| HTML initial produit | Test Playwright raw SSR + `seo:check` verifient article, h1, image, JSON-LD | OK |
| Galerie/detail mobile conserves | `Router.jsx` invariant conserve; `npm run mobile:contract` OK | OK |
| Admin/auth/commerce presents | Modules `src/kit/admin`, `src/kit/commerce`, `AuthContext`; routes `/admin`, `/checkout`, `/wishlist`, `/mes-commandes` 200 | OK statique/runtime route |
| Publication meubles conservee | `AdminForm` add/update Firestore + `bumpPublicCatalogVersion`; `Router` status/delete/sold actions | OK statique |
| Admin ecriture sandbox testee | Aucun compte admin sandbox ni validation ecriture fournis; pas d'ecriture lancee volontairement | Limite connue |
| Checkout/panier/wishlist | Modules et routes presents; tests non destructifs route shell OK | OK non destructif |
| Docs livrees | `MIGRATION_REPORT.md`, `COMPARISON.md`, `RUNBOOK.md` | OK |
| Strategie base de donnees | `DATABASE_MIGRATION_PLAN.md` documente pourquoi le clone existe, les collections, sandbox/export-import, tests restants et cutover | OK |
| Commandes attendues | `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run seo:check`, `npm run mobile:contract`, `npm run test:e2e` | OK |
| Playwright desktop/mobile | 20 tests passent | OK |
| Comparaison objective | `scripts/compare-spa-next.mjs`, `scripts/compare-runtime.mjs` + mesures dans `COMPARISON.md` | OK |
| Ne pas promettre que SSR supprime les lags | Rapports indiquent que galerie/mobile doivent rester mesures runtime | OK |
| Roadmap optimisation Next | `NEXTJS_OPTIMIZATION_ROADMAP.md`; N1 cache tags, N2 ISR produit, N3 images, N5 prefetch; benchmark local optimise | OK partiel |
| Function `publicCatalog` sandbox | Codebase isole `functions-public`; `firebase deploy --only functions:public:publicCatalog`; endpoint HTTP 200 + CORS App Hosting OK | OK |

## Residual Risk

- Le workflow admin complet avec publication/modification de meuble n'a pas ete execute avec un compte admin sandbox afin d'eviter toute ecriture non validee.
- La mesure runtime locale couvre requetes, bytes JS/images/total, LCP/CLS approximatifs et long tasks. Les traces longues type Lighthouse/scroll frame gaps sur vrais appareils restent a faire avant decision de migration definitive.
- La galerie complete reste client-side par choix de fidelite au projet source.
- `publicCatalog` est deployee sans Stripe/Gmail via le codebase separe `public`; les fonctions commerce/email historiques restent non deployees tant que les secrets sandbox ne sont pas definis.
- Les optimisations N1/N2/N3/N5 sont en place; N4 hydratation fine et N6 monitoring App Hosting restent a poursuivre apres deploiement GitHub/App Hosting.
