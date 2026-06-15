# TODO - Phase Infra Prod puis Hydratation/Perf

Date de preparation: 2026-06-13
Objectif demain: commencer par assainir l'infra prod avant de reprendre SEO/perf fine.

## Regle de travail

- Ne pas toucher au design actuel des pages publiques et du backoffice pendant la phase infra.
- Ne pas supprimer d'assets visibles pendant cette phase.
- Documenter chaque decision qui change le chemin prod, les variables, la revalidation ou Stripe.
- Garder `AGENTS.md`, `mapV2.md` et les rapports a jour si un fichier est cree, supprime, renomme ou deplace.

## Phase 2 - Infra prod

### P0 - Environnement et secrets

- [ ] Valider `NEXT_PUBLIC_SITE_URL` prod et sandbox:
  - [x] sandbox: valeur App Hosting confirmee et domaine HTTPS repond en 200;
  - [ ] prod: a definir quand le rail prod existe.
- [x] Ajouter/valider `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` pour App Check sandbox.
- [ ] Verifier la configuration App Check Firebase cote sandbox/prod:
  - [x] sandbox: app Web enregistree reCAPTCHA v3;
  - [x] sandbox: enforcement laisse en monitoring (`UNENFORCED`);
  - [ ] sandbox: verifier les requetes App Check apres prochain rollout;
  - [ ] prod: a configurer/verifier quand le rail prod existe.
- [x] Creer/valider le secret App Hosting `SUPER_ADMIN_EMAIL` avant rollout.
- [x] Reevaluer `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`:
  - [x] supprimer l'exposition publique du super-admin;
  - [x] si c'est une logique d'autorisation, deplacer vers claims/serveur.
- [x] Cartographier les variables:
  - [x] publiques Next `NEXT_PUBLIC_*`;
  - [x] serveur App Hosting;
  - [x] Functions main;
  - [x] Functions public;
  - [x] Stripe;
  - [x] Gmail/email;
  - [x] revalidation interne;
  - [x] admin/security.

### P0 - Hygiene deploy

- [x] Durcir `.firebaseignore` avec exclusions explicites:

```text
.env*
service-account.json
*.pem
*.key
```

- [x] Verifier qu'aucun secret local ou config sensible n'est embarque dans App Hosting/Functions.
- [x] Verifier separation sandbox/prod:
  - [x] `.firebaserc`;
  - [x] `apphosting.yaml`;
  - [x] `firebase.json`;
  - [x] codebase `functions`;
  - [x] codebase `functions-public`;
  - [x] Firestore rules/indexes;
  - [x] Storage rules.

### P0 - Revalidation catalogue

- [ ] Tester le flux complet:

```text
mutation admin -> publicCatalogVersion/cache bump -> /api/revalidate-catalog -> produit/categorie/sitemap
```

- [ ] Verifier que les pages suivantes se mettent a jour correctement:
  - [ ] `/galerie`;
  - [ ] `/categorie/[categoryId]`;
  - [ ] `/produit/[slugOrId]`;
  - [ ] `/sitemap.xml`.
- [x] Confirmer que la revalidation ne depend pas d'un secret expose en `NEXT_PUBLIC_*`.
- [x] Documenter les gates ou commandes exactes dans le rapport infra.

### P0 - Stripe sandbox complet

- [x] Ajouter `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` sandbox App Hosting depuis le compte Stripe test de Matthieu (`pk_test_...` uniquement).
- [ ] Tester commande sandbox complete:
  - [ ] panier;
  - [ ] checkout;
  - [ ] paiement Stripe sandbox;
  - [ ] webhook signe;
  - [ ] creation commande;
  - [ ] decrement stock;
  - [ ] email si applicable.
- [ ] Tester annulation/restauration:
  - [ ] annulation commande;
  - [ ] restauration stock;
  - [ ] coherence espace client;
  - [ ] coherence admin commandes.
- [x] Reevaluer `return_url` Stripe actuellement compatible legacy `/?order_success=true`.
- [ ] Verifier que les webhooks utilisent bien les secrets sandbox/prod separes:
  - [x] `STRIPE_SECRET_KEY` sandbox cree en secret Firebase Functions et deploye sur `createOrder` / `stripeWebhook`;
  - [x] `STRIPE_WH_SECRET` sandbox cree depuis l'endpoint webhook Stripe et deploye sur `stripeWebhook`.

### P1 - Risques infra deja identifies

- [x] `sendTestEmail`: appel admin trouve sans Function exportee; corriger ou retirer le bouton diagnostic.
- [ ] `public/og-image.jpg`: absent alors que reference par metadata; a traiter en phase SEO, mais noter l'impact prod.
- [ ] `functions/src/seo/seoTools.js` + rewrites Firebase Hosting: clarifier legacy encore utile ou a retirer plus tard.
- [x] Verifier que `functions-public/src/public/catalog.js` reste le seul endpoint catalogue public actif.

## Phase 3 - Hydratation / perf

Ne commencer cette phase qu'apres les P0 infra.

### P0 perf - Galerie

- [ ] Reprendre la baseline `/galerie`.
- [ ] Confirmer le budget mesure autour de `176.35 kB JS gzip initial`.
- [ ] Identifier les chunks initiaux exacts.
- [ ] Ne pas modifier le design ni le contrat mobile galerie.
- [ ] Lire `alertemobile.md` avant toute modification de galerie/mobile/scroll/produit.

### P1 perf - Ilots bas

- [ ] Differer encore les ilots bas non critiques:
  - [ ] Instagram;
  - [ ] temoignages;
  - [ ] before/after;
  - [ ] sections basses non essentielles au premier rendu.
- [ ] Garder des hauteurs reservees pour eviter les sauts de layout.
- [ ] Mesurer avant/apres avec les scripts existants.

### P1 perf - Header public

- [ ] Isoler panier/auth du header public.
- [ ] Charger panier/auth seulement:
  - [ ] sur interaction;
  - [ ] si session persistante detectee;
  - [ ] sur routes privees ou checkout.
- [ ] Verifier que la navigation publique reste identique visuellement.

### P2 perf - Produit direct

- [ ] Repasser `/produit/[slugOrId]` apres galerie/header.
- [ ] Confirmer le budget mesure autour de `119.84 kB JS gzip initial`.
- [ ] Separer mieux media/actions si le gain est clair.
- [ ] Relancer le gate produit direct apres modification.

## Rapports attendus

- [x] Creer ou mettre a jour un rapport infra prod precis apres la Phase 2.
- [x] Reporter:
  - [x] fichiers touches;
  - [x] variables validees;
  - [x] risques restants;
  - [x] commandes/gates lancees;
  - [x] decisions sandbox/prod.
- [ ] Ne passer a la Phase 3 que quand les P0 infra sont traites ou explicitement reportes.
