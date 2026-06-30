# Database Migration Plan - Seconde Vie Next.js SSR

## Pourquoi ce clone existe

Ce projet n'est pas une migration definitive de production. C'est un clone Next.js SSR/SSG separe du projet React/Vite actuel, cree pour comparer objectivement :

- SEO reel des pages produit;
- HTML initial disponible avant hydration;
- chargement des images;
- poids JavaScript;
- comportement accueil, galerie, produit, admin et commerce;
- rendu mobile et desktop;
- compatibilite Firebase avec SSR.

Le projet source reste la version de reference :

```text
C:\Users\matth\Travail\SecondevieAnais
```

Le clone Next vit separement :

```text
C:\Users\matth\Travail\SecondevieNextjsSSR
```

La raison principale du clone est de mesurer avant de migrer. SSR aide clairement le SEO produit et le HTML initial, mais ne garantit pas a lui seul la disparition des lags galerie/mobile, car ces zones dependent encore du JavaScript client, des images, du scroll et des interactions tactiles.

## Etat actuel cote base de donnees

Le clone garde Firebase comme source de verite.

Par defaut, les scripts `dev`, `build` et `start` chargent :

```text
.env.sandbox
```

La production ne doit pas etre modifiee sans validation explicite.

Le clone sait lire les produits publics pour SSR via :

- Firebase Admin SDK cote serveur si des credentials serveur sont fournis;
- fallback `publicCatalog`;
- fallback Firestore REST en lecture publique;
- filtre obligatoire `status === 'published'`.

Les modules admin, panier, wishlist, checkout et commandes restent majoritairement client-side, avec les memes collections Firebase que la SPA.

## Collections et donnees concernees

Surfaces principales :

| Surface | Donnees Firebase | Usage |
| --- | --- | --- |
| Catalogue public | `artifacts/{appId}/public/data/furniture` | Produits, images, prix, stock, publication |
| Version catalogue | `artifacts/{appId}/public/meta` | Invalidation du cache public |
| Panier | `users/{uid}/cart` | Panier utilisateur |
| Wishlist | `users/{uid}/wishlist` | Favoris utilisateur |
| Commandes | `orders` | Checkout, espace client, admin |
| Metadata site | `sys_metadata/*` | Contact, livraison, paiement, theme, homepage |
| Admins | `sys_metadata/admin_users` + custom claims | Gestion admin |
| Analytics | `analytics_*`, `analytics_sessions` | Dashboard et suivi |
| Newsletter | `newsletter_subscribers` | Admin newsletter |

## Ce qui reste a faire avant migration reelle

### 1. Choisir la strategie de donnees

Option recommandee pour continuer les tests :

1. Garder la SPA en production.
2. Utiliser le projet sandbox Firebase pour le clone Next.
3. Tester toutes les ecritures admin/checkout dans sandbox uniquement.
4. Comparer les deux versions avec les memes donnees exportees ou synchronisees.

Options possibles :

- **Sandbox existante** : plus simple, faible risque.
- **Emulateur Firestore/Auth/Storage** : meilleur pour tests destructifs, mais demande un export/import et des fixtures.
- **Lecture read-only production** : utile pour SEO/perf, mais interdit pour tests admin/checkout.
- **Projet Firebase sandbox dedie** : le plus propre si la comparaison doit durer.

### 2. Exporter/importer les donnees si on veut une sandbox fidele

A faire hors production directe :

```powershell
# Exemple conceptuel, a adapter au projet Firebase exact
firebase firestore:export gs://<bucket-export>
firebase firestore:import gs://<bucket-export>
```

Pour Storage, il faudra aussi copier les images produit et verifier que les URLs/metadata restent coherentes.

Points a verifier :

- IDs produits conserves;
- `status` conserve;
- `imageVariants` conserve;
- `imageMetadata` conserve;
- documents `sys_metadata` presents;
- rules/indexes deployes sur sandbox;
- custom claims admin recrées sur les comptes sandbox.

### 3. Valider les droits et secrets

Avant toute mise en ligne Next SSR :

- Creer les secrets serveur dans App Hosting / Secret Manager si Admin SDK serveur requis.
- Ne jamais mettre de cle privee dans `NEXT_PUBLIC_*`.
- Verifier que `firebase-admin` reste absent de `.next/static`.
- Verifier que les routes admin ne rendent pas de donnees privees dans le HTML initial.
- Confirmer que les rules Firestore couvrent la meme logique que la SPA.

### 4. Tester les ecritures dans sandbox

Tests a faire avec un vrai compte admin sandbox :

- login admin;
- creation meuble;
- upload images;
- publication/draft;
- modification prix/description/images;
- marquer vendu/disponible;
- suppression meuble test;
- invalidation `publicCatalog`;
- lecture SSR du produit publie apres modification.

Tests commerce sandbox :

- ajout panier;
- wishlist;
- checkout paiement differe;
- checkout Stripe en mode test;
- creation commande;
- espace client `mes-commandes`;
- annulation commande si applicable;
- stock restaure apres annulation.

### 5. Mesurer avant decision

Mesures deja disponibles dans le clone :

```powershell
npm run perf:compare
npm run perf:runtime
npm run seo:check
npm run test:e2e
npm run mobile:contract
```

Mesures encore a faire avant migration definitive :

- Lighthouse mobile/desktop sur SPA et Next;
- trace Performance Chrome sur galerie et page produit;
- vrai telephone Android/iOS;
- scroll frame gaps sur galerie;
- image bytes et request waterfall;
- INP/TBT proxy sur interactions produit;
- test direct produit depuis Google-like cold load;
- test clic galerie -> produit.

## Strategie de migration progressive

### Phase 1 - Comparaison

Etat actuel.

- SPA reste source de verite production.
- Clone Next mesure SEO/perf et compatibilite Firebase.
- Aucune ecriture production.

### Phase 2 - Sandbox ecriture

- Brancher le clone sur sandbox.
- Executer tests admin/checkout complets.
- Corriger les ecarts fonctionnels.
- Garder les rapports a jour.

### Phase 3 - Preproduction

- Creer backend Firebase/App Hosting de preprod.
- Configurer secrets serveur.
- Importer donnees proches production.
- Tester SSR, admin, checkout et images.

### Phase 4 - Decision

Migrer uniquement si les mesures montrent un gain net ou un benefice SEO justifie.

Si Next est retenu :

- choisir App Hosting comme cible principale;
- garder Functions existantes;
- deployer rules/indexes;
- verifier DNS/canonical/sitemap;
- basculer progressivement le trafic.

## Risques principaux

- Le SSR produit ameliore le HTML initial, mais la galerie reste client-side.
- `next/image` peut changer les couts/deploiements selon la cible Firebase.
- App Hosting necessite Blaze.
- Les secrets serveur doivent etre configures hors repository.
- Les custom claims admin doivent etre recrées ou verifies dans chaque projet Firebase.
- Les images Storage et leurs variantes doivent rester coherentes apres export/import.

## Definition de pret pour migrer la base

La base peut etre consideree prete pour une migration Next seulement quand :

- un projet sandbox/preprod contient une copie coherente des donnees;
- les images Storage sont accessibles;
- les rules/indexes sont deployes;
- un compte admin sandbox peut publier/modifier un meuble;
- un client sandbox peut faire panier/wishlist/checkout;
- une page produit modifiee en admin apparait correctement en SSR;
- les scripts `seo:check`, `test:e2e`, `mobile:contract`, `perf:compare` et `perf:runtime` passent;
- aucun secret serveur n'apparait dans `.next/static`;
- les limites et gains mesures historiques sont documentes dans `_DOCS/archive/migration-spa-to-next/COMPARISON.md`.
