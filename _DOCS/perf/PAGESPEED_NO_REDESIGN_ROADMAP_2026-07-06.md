# Roadmap PageSpeed sans redesign

Date: 2026-07-06  
Statut: suite recommandee apres la passe `thumb320/thumb384` + AVIF galerie

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

Statut:

Le code supporte maintenant `thumb320` et `thumb384`, mais les anciennes donnees doivent etre backfillees pour produire le gain complet.

Action recommandee:

1. Configurer les credentials Google locaux sandbox.
2. Lancer:

```bash
npm run images:card-thumbs:dry -- --published-only --env=sandbox
```

3. Verifier le nombre de produits/images candidates, les chemins cibles et les estimations de poids.
4. Si le dry-run est coherent:

```bash
npm run images:card-thumbs:commit -- --published-only --env=sandbox
```

5. Relancer les gates perf et PageSpeed sandbox.

Interdits:

- pas de production dans cette passe;
- pas de suppression Storage;
- pas de regeneration des originaux;
- pas de modification des variantes detail.

Preuves attendues:

- logs JSON dans `logs/card-thumbs/`;
- `catalogVersion` bump quand des produits sont mis a jour;
- cartes choisissant majoritairement `thumb320`, `thumb384` ou `thumb`, pas `card/medium`.

## Priorite 3 - Favicon 404

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

## Priorite 4 - Accessibilite desktop sans redesign

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

Garde-fous:

- garder le look global;
- ne pas recreer de composants;
- tester mobile et desktop, car ces zones touchent navigation/panier/sections publiques.

Preuves attendues:

```bash
npm run mobile:contract
npm run perf:gallery-direct
```

Puis Lighthouse accessibilite desktop sandbox.

## Priorite 5 - Headers cache et bfcache

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

Garde-fous:

- ne pas changer les tunnels dynamiques `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`;
- ne pas casser App Check, auth ou checkout;
- ne pas forcer un cache long sur des pages qui affichent des donnees sensibles.

Preuves attendues:

```bash
npm run next:routes
```

Puis audit headers sandbox avec captures HTTP avant/apres.

## Ordre recommande

1. Backfill sandbox `thumb320/thumb384`.
2. Ajouter/corriger `/favicon.ico`.
3. Corriger les points accessibilite desktop sans redesign.
4. Auditer et corriger les headers `no-store` publics si confirme.

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
