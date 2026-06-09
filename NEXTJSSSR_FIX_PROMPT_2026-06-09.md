# Prompt /goal - correction residus SPA publics Next SSR

```text
/goal Utilise le skill local nextjsssr et le playbook racine nextjsssr.md pour corriger les residus legacy SPA publics identifies dans NEXTJSSSR_LEGACY_AUDIT_2026-06-09.md.

Contexte deja acquis:
- Le detail produit legacy SPA a ete supprime.
- La route /produit/[slugOrId] est le standard cible: Next App Router SSR/SSG, ProductDetailServerView, iles client bornees, metadata/JSON-LD, gate npm run perf:product-direct -- --assert.
- /devis est deja une route native sans ClientApp.
- Le but n'est pas de redesigner le site: copier/transposer l'UI SPA existante vers Next SSR, puis supprimer le chemin SPA equivalent.

Objectif:
1. Auditer a nouveau avec rg les chemins ClientApp / src/app.jsx / src/Router.jsx / setView / hash / CategoryPage / HomeGalleryLauncher.
2. Corriger les routes publiques restantes dans cet ordre:
   a. Categories: faire de app/categorie/[categoryId]/page.jsx l'unique affichage categorie. Supprimer le chemin SPA CategoryPage dans src/Router.jsx et src/app.jsx, remplacer les navigations categorie publiques par des liens/URLs Next, puis ajouter un gate direct categorie.
   b. /a-propos: supprimer ClientApp defer de app/a-propos/page.jsx apres avoir garde/transporte l'UI publique souhaitee. Supprimer la branche SPA /a-propos ou HomeView si elle devient orpheline. Ajouter un gate direct /a-propos.
   c. Galerie: creer d'abord un gate scripts/audit-gallery-direct.mjs qui prouve l'etat actuel. Puis migrer progressivement la galerie publique hors ClientApp en conservant l'UI de GalleryView/MarketplaceLayout, avec donnees serveur et iles client minimales. Ne pas casser alertemobile.md ni le shell mobile tant que la migration n'est pas terminee.
3. Ne pas traiter les tunnels noindex /admin, /checkout, /wishlist, /mes-commandes comme priorite SEO. Les documenter comme tunnels client temporaires, sauf si une correction publique les touche.
4. Supprimer chaque residu SPA public une fois son equivalent Next natif prouve: imports React.lazy publics inutiles, view publique, setView public, hash routing public, helpers orphelins, props inertes, docs operationnelles obsoletes.

Contraintes strictes:
- Lire nextjsssr.md avant de coder.
- Lire alertemobile.md avant toute modification qui touche src/Router.jsx, galerie mobile, marketplace-gallery-shell, marketplace-gallery-scroll, ou handlers touch.
- Ne pas creer une nouvelle UI. Ne pas ajouter un second header. Ne pas empiler SSR + SPA.
- Ne pas supprimer les compatibilites data utiles comme LEGACY_CATEGORY_IDS sans backfill.
- Ne pas deployer tant que les gates locaux ne sont pas verts, sauf demande explicite.

Gates minimum:
- npm run lint
- npm run mobile:contract si Router/galerie/mobile touche
- npm run build
- npm run perf:budget
- npm run perf:product-direct -- --assert pour verifier que le standard produit reste intact
- nouveau gate categorie direct
- nouveau gate a-propos direct
- gate galerie direct au moins en audit si migration galerie commence

Preuves attendues dans le rapport final:
- rg montrant que ProductDetail.jsx / ArchitecturalProductDetail / setView('detail') restent absents.
- rg montrant que CategoryPage SPA n'est plus appele par Router/src app apres correction categories.
- pour chaque route corrigee: marker SSR present, data-sv-client-hydrated absent si route native, absence de galerie shell quand non pertinent.
- liste des fichiers supprimes et des fichiers transformes en iles client.
- resultats des gates.
```
