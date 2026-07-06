# Roadmap PageSpeed sans redesign

Date: 2026-07-06  
Statut: chantiers principaux traites en sandbox; reste une mesure Lighthouse finale mobile/desktop si besoin de preuve PageSpeed externe

## Principe

Objectif: gagner en PageSpeed mobile/desktop sans casser le design ni diminuer la qualite percue des meubles.

Les corrections doivent rester invisibles ou quasi invisibles:

- pas de redesign;
- pas de compression destructive des originaux produit;
- pas de changement de shell mobile galerie;
- pas de remplacement de l'architecture Next native;
- pas de mutation production sans dry-run et validation explicite.

## Priorite 1 - Produit test avec image carte enorme

Statut 2026-07-06: termine. Le produit de test a ete supprime de Firestore sandbox, `catalogVersion` a ete bump, `/api/revalidate-catalog` a repondu 200, `publicCatalog` a ete redeploye, et les controles publics ne retrouvent plus ni son id ni son libelle dans `/` et `/galerie`.

Constat PageSpeed initial:

Le produit public de test `[TEST STRIPE SANDBOX] Produit refund repetable` utilisait `/images/gallery-hero-1.webp` comme image carte. Lighthouse estimait environ 639 KiB gaspilles sur ce seul item.

Action realisee:

1. Document Firestore sandbox `sv-e2e-stripe-refund-product` supprime.
2. Revalidation catalogue lancee avec succes.
3. Function publique `publicCatalog` redeployee avec le filtre `e2eOnly` / `e2ePurpose`.
4. Verification post-deploiement OK: catalogue public, `/` et `/galerie` ne contiennent plus le produit.

Garde-fous:

- ne pas masquer des produits reels;
- ne pas changer le layout galerie.

Preuves attendues:

```bash
npm run perf:gallery-direct
npm run perf:category-direct
```

Puis Lighthouse mobile/desktop sur Hosting sandbox.

## Priorite 2 - Backfill des variantes carte Firebase

Statut 2026-07-06: termine en sandbox.

Le code supporte `thumb320` et `thumb384`, et les anciennes donnees sandbox ont ete backfillees.

Action realisee:

1. `scripts/backfill-product-image-card-thumbs.cjs` accepte maintenant `FIREBASE_SERVICE_ACCOUNT_JSON` / `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`, sans fichier secret local.
2. Dry-run sandbox OK:

```bash
npm run images:card-thumbs:dry -- --published-only --env=sandbox
```

3. Commit sandbox OK:

```bash
npm run images:card-thumbs:commit -- --published-only --env=sandbox
```

4. Resultat: 38 produits scannes, 309 images, 618 variantes creees, 38 documents mis a jour, `catalogVersion` bump, 0 erreur.
5. `publicCatalog?scope=cards` expose `thumb320` et `thumb384` pour 38/38 produits.
6. App Hosting sandbox redeploye et revalide; `/` et `/galerie` contiennent les nouvelles URLs `_thumb320_` / `_thumb384_`.

Interdits:

- pas de production dans cette passe;
- pas de suppression Storage;
- pas de regeneration des originaux;
- pas de modification des variantes detail.

Preuves attendues:

- dry-run: `logs/card-thumbs/2026-07-06T13-54-45-097Z-dry-run.json`;
- commit: `logs/card-thumbs/2026-07-06T14-04-20-161Z-commit.json`;
- revalidation: `logs/revalidate-after-card-thumbs-2026-07-06T14-05-11-112Z.json`;
- gates sandbox OK: `mobile:contract`, `perf:product-images`, `perf:gallery-direct`, `perf:category-direct`.

## Parenthese UX - Image centrale produit mobile

Statut 2026-07-06: termine et deploye sandbox.

Constat:

Sur mobile, l'image centrale de la fiche produit peut paraitre trop grande, proche de la taille ressentie apres ouverture du zoom/lightbox. Le zoom perd alors une partie de son role, et le titre ainsi que le bouton `Details` respirent moins.

Ce point est separe du backfill `thumb320/thumb384`: il ne concerne pas les cartes galerie/categorie et ne demande aucune mutation Storage/Firestore.

Etat variantes:

- l'image centrale produit utilise deja `detailFast` avec fallback `medium`, `large`;
- le zoom/lightbox garde `full` / `large` pour la haute qualite;
- ne pas creer de nouvelle variante image pour cette parenthese sans audit dedie.

Idee d'ajustement layout:

```js
width: 'min(88vw, 390px)'
maxHeight: 'min(56svh, 560px)'
```

Effet attendu:

- image centrale un peu plus elegante, moins envahissante;
- plus de respiration autour du meuble;
- le bouton `Details` et le titre respirent mieux;
- le zoom retrouve un vrai role;
- aucun changement de donnees Storage necessaire;
- impact perf limite, sauf si la variante chargee change aussi.

Garde-fous:

- ne pas toucher au shell mobile galerie;
- ne pas changer les variantes chargees sans preuve;
- tester la page produit mobile et le zoom, car ce reglage touche le ressenti principal.

Preuves attendues si ce point est traite:

```bash
npm run mobile:contract
npm run perf:product-images
```

Puis controle visuel mobile sur une fiche produit representative.

## Priorite 4 - Favicon 404

Statut 2026-07-06: termine et deploye sandbox. `public/favicon.ico` a ete genere depuis le favicon PNG existant, la metadata Next declare explicitement `/favicon.ico`, `/favicon_final.png` et `apple-touch-icon.png`, et le controle HTTP sandbox confirme `200 OK` sur `/favicon.ico`.

Constat PageSpeed:

`/favicon.ico` ressort en 404 et ajoute un warning console.

Action recommandee:

1. Ajouter un vrai `public/favicon.ico`.
2. Ou corriger la reference metadata si la source canonique est ailleurs.
3. Verifier que `GET /favicon.ico` repond 200 en local et Hosting sandbox.

Preuves attendues:

```bash
npm run build
```

Puis controle HTTP direct sur `/favicon.ico`.

## Priorite 5 - Accessibilite desktop sans redesign

Statut 2026-07-06: termine et deploye sandbox.

Constat PageSpeed:

Score desktop autour de 87, surtout a cause de details de markup/classes.

Chantiers identifies:

- contraste de textes comme `Prix bas`, `FRANCE / CAVE`, `2X / 3X / FRAIS 0%`;
- logo avec `aria-label` qui ne reprend pas le texte visible;
- boutons dots avis trop petits;
- panier masque avec `aria-hidden` contenant encore des elements focusables;
- ordre de titres autour de `LIVRAISON SOIGNEE`.

Action recommandee:

1. Corriger le contraste avec des ajustements de couleur discrets.
2. Aligner `aria-label` et texte visible pour le logo.
3. Agrandir la surface interactive des dots sans changer leur apparence percue.
4. Quand le panier est masque, retirer les focusables du flux ou utiliser `inert`.
5. Retablir un ordre de titres coherent.

Action realisee:

1. Les micro-labels de reassurance sont plus lisibles, et `FRANCE / CAVE` est remplace par `FRANCE / RETRAIT`.
2. Le lien logo annonce `Seconde Vie par Anais - retour a la galerie`.
3. Les dots avis gardent leur apparence, avec une surface interactive plus grande et une surbrillance active coherente.
4. Les panneaux panier masques utilisent `inert` / `aria-hidden` pour sortir les elements focusables du parcours clavier.
5. Les titres de la zone reassurance utilisent un niveau plus coherent autour de `LIVRAISON SOIGNEE`.

Garde-fous:

- garder le look global;
- ne pas recreer de composants;
- tester mobile et desktop, car ces zones touchent navigation/panier/sections publiques.

Preuves attendues:

```bash
npm run mobile:contract
npm run perf:gallery-direct
```

Preuves realisees:

- validation syntaxe JSX ciblee OK;
- `git diff --check` OK;
- deploiement App Hosting sandbox OK.

Preuve restante optionnelle: Lighthouse accessibilite desktop sandbox.

## Priorite 6 - Headers cache et bfcache

Statut 2026-07-06: termine et deploye sandbox.

Constat PageSpeed:

Lighthouse signale que le retour navigateur peut etre empeche par `Cache-Control: no-store`.

Risque:

Sur les routes publiques statiques/ISR, `no-store` contredit l'intention `force-static` + `revalidate = 300`.

Action recommandee:

1. Auditer les headers reels Hosting/App Hosting sur:
   - `/`
   - `/galerie`
   - `/categorie/[categoryId]`
   - `/produit/[slugOrId]`
   - `/a-propos`
   - `/devis`
2. Identifier si `no-store` vient de Firebase/App Hosting, middleware, API, auth, ou service worker.
3. Corriger uniquement les routes publiques si confirme.

Audit realise:

- `/` repondait en `Cache-Control: no-store` parce que le middleware passait sur la home.
- `/galerie`, `/categorie/[categoryId]`, `/produit/[slugOrId]`, `/a-propos` et `/devis` etaient deja en ISR correct.

Action realisee:

1. `middleware.js` supprime.
2. La compatibilite de l'ancien `/?page=gallery` est deplacee dans `next.config.mjs` via une redirection statique vers `/galerie`.
3. La documentation architecture et le gate `perf:gallery-direct` ont ete ajustes pour ce nouveau chemin sans middleware.
4. App Hosting sandbox redeploye.

Resultat apres deploiement:

- `/`, `/galerie`, `/categorie/buffets`, `/produit/buffet-KrTETXPknYNwgak66T8p`, `/a-propos` et `/devis`: `200 OK`, `Cache-Control: s-maxage=300, stale-while-revalidate=31535700`;
- `/?page=gallery`: `308 Permanent Redirect` vers `/galerie?page=gallery`;
- plus de header middleware detecte sur les routes publiques auditees.

Garde-fous:

- ne pas changer les tunnels dynamiques `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`;
- ne pas casser App Check, auth ou checkout;
- ne pas forcer un cache long sur des pages qui affichent des donnees sensibles.

Preuves attendues:

```bash
npm run next:routes
```

Preuves realisees:

- `mobile:contract` OK;
- `perf:gallery-direct --assert` OK sur Hosting sandbox;
- audit headers HTTP direct OK sur les routes publiques listees ci-dessus;
- `next:routes` source OK, mais la partie post-build locale n'a pas pu etre conclue sans artefacts `.next/server/app` locaux apres deploiement cloud.

## Ordre recommande

1. Ajouter/corriger `/favicon.ico`: termine sandbox.
2. Corriger les points accessibilite desktop sans redesign: termine sandbox.
3. Auditer et corriger les headers `no-store` publics si confirme: termine sandbox.

## Gates de cloture

Selon le chantier touche:

```bash
npm run build
npm run next:routes
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:category-direct
npm run perf:product-images
```

Pour toute mutation Storage:

```bash
npm run images:card-thumbs:dry -- --published-only --env=sandbox
```

Production uniquement dans une passe separee, apres validation explicite.
