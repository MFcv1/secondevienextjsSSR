# Cartographie du projet Seconde Vie Next

Derniere verification: 2026-08-12
Statut: `CARTE_CANONIQUE_ACTIVE`

## 1. Role et maintenance

Cette carte repond a trois questions:

1. quelle route ou quel parcours l'utilisateur utilise;
2. quels fichiers executent ce parcours;
3. quelles donnees, Functions et services sont traverses.

La stabilisation securite finale du sandbox et ses preuves sont suivies dans
`_DOCS/security/STABILISATION_SECURITE_SANDBOX.md`. Les Gates S0-S4 sont fermees
avec le statut `SANDBOX_SECURITY_STABILIZED`; aucun rail production n'a ete
cree. Le compte rendu reste present jusqu'a la fusion de la PR #5, puis ses
decisions canoniques seront verifiees avant sa suppression.

Elle doit etre mise a jour dans le meme changement que toute creation, suppression, renommage ou deplacement structurel. `AGENTS.md` contient les regles; `_DOCS/README.md` indexe les chapitres metier.

Legende:

- `[S]`: rendu ou logique serveur;
- `[C]`: composant/client navigateur;
- `[API]`: route Next;
- `[F]`: Cloud Function;
- `[DB]`: Firestore;
- `[ST]`: Firebase Storage;
- `[EXT]`: service externe;
- `ISR`: Incremental Static Regeneration;
- `DYN`: route dynamique non cachee publiquement.

## 2. Carte visible du site

```text
Seconde Vie
|-- / ................................ Home galerie canonique
|   |-- hero / categories / selection / contenus editoriaux
|   |-- recherche, wishlist, panier, menu, devis
|   `-- liens vers categories et produits
|-- /galerie ......................... Alias compatible, canonical /
|-- /categorie/[categoryId] .......... Liste serveur filtree
|-- /produit/[slugOrId] .............. Fiche produit, medias et actions
|-- /recherche ....................... Resultats non indexables
|-- /a-propos ........................ Atelier, histoire, FAQ, avant/apres
|-- /devis ........................... Demande de restauration/devis
|-- /wishlist ........................ Liste personnelle dynamique
|-- /checkout ........................ Tunnel panier/paiement dynamique
|-- /payer/[orderId]/[token] ......... Paiement prive sans compte, lien admin signe
|-- /mes-commandes ................... Espace client dynamique
|-- /admin ........................... Back-office dynamique
|-- /api/search ...................... Recherche catalogue serveur
|-- /api/catalog ..................... Snapshot public same-origin non persistant
|-- /api/catalog/version ............. Identite publique minimale ETag/304
|-- /api/revalidate-catalog .......... Invalidation ISR signee du catalogue
|-- /sitemap.xml ..................... Sitemap Next dynamique/cache
`-- /robots.txt ...................... Politique robots Next
```

## 3. Contrat de rendu des routes

| Route | Type | Cache | SEO | Entree | Vue metier |
| --- | --- | --- | --- | --- | --- |
| `/` | `[S]` statique | ISR 300 | index, canonical `/` | `app/page.jsx` | `GalleryRoutePage` |
| `/galerie` | `[S]` statique | ISR 300 | canonical `/` | `app/galerie/page.jsx` | `GalleryRoutePage` |
| `/categorie/[categoryId]` | `[S]` SSG/fallback | ISR 300 | index conditionnel | route dynamique | `CategoryServerView` |
| `/produit/[slugOrId]` | `[S]` SSG/fallback | ISR 300 | index conditionnel | route dynamique | `ProductDetailServerView` |
| `/a-propos` | `[S]` | ISR 300 | index | `app/a-propos/page.jsx` | `AboutServerView` |
| `/devis` | `[S]+[C]` | ISR 300 | index | `app/devis/page.jsx` | `QuoteRequestServerView` |
| `/recherche` | `[S]+[C]` | ISR 300 | noindex/follow | `app/recherche/page.jsx` | `SearchResultsIsland` |
| `/wishlist` | `[C]` tunnel | DYN | noindex/nofollow | `app/wishlist/page.jsx` | `WishlistPageIsland` |
| `/checkout` | `[C]` tunnel | DYN | noindex/nofollow | `app/checkout/page.jsx` | `CheckoutPageIsland` |
| `/payer/[orderId]/[token]` | `[C]` tunnel prive | DYN | noindex/nofollow, no-referrer | route dynamique | `PaymentLinkPageIsland` |
| `/mes-commandes` | `[C]` tunnel | DYN | noindex/nofollow | `app/mes-commandes/page.jsx` | `OrdersPageIsland` |
| `/admin` | `[C]` tunnel | DYN | noindex/nofollow | `app/admin/page.jsx` | `AdminAppIsland` |
| `/api/search` | `[API]` | reponse non persistante | non indexable | `route.js` | recherche serveur |
| `/api/catalog` | `[API]` | reponse non persistante | non indexable | `route.js` | catalogue materialise |
| `/api/catalog/version` | `[API]` | ETag/304 revalide | non indexable | `route.js` | revision + aggregateSha256 |
| `/api/admin/catalog-publication-status` | `[API]` admin | aucun, no-store | non indexable | `route.js` | App Check + token non revoque + claim + registre actif + AAL2, corps 4 Kio, preuve fraiche de la release exacte |
| `/api/revalidate-catalog` | `[API]` | aucun, no-store | non indexable | `route.js` | HMAC builder ou App Check + admin fort, corps 512 Kio + revalidation catalogue |

## 4. Parcours et dependances

### 4.1 Consultation catalogue

```text
route publique [S]
  -> src/lib/server/products.js
  -> src/lib/server/materializedCatalog.js
  -> current/previous/last-known-good [ST]
  -> snapshot catalogue immuable [ST]
  -> normalisation + indexabilite
  -> ServerView
  -> petites iles interactions [C]
```

### 4.2 Publication d'une annonce

Le parcours cible de connexion OAuth et de publication simultanee
site/Instagram/Facebook est borne par le plan temporaire
`_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md`. Le code local couvre M1 a M3;
secrets, deploiement et recette Meta reelle restent M4/M5.

```text
/admin [C]
  -> AdminPublicationWorkspace (vues Creer / Publications plein viewport)
  -> AdminForm / StoryEditor / AdminItemList
  -> MetaConnectionBadge + useMetaConnection [C]
     -> start/get/select/verify Meta OAuth [F]
     -> popup Meta [EXT] -> metaOAuthCallback [F]
     -> sys_meta_connections / states / asset_choices [DB, backend-only]
  -> InstagramPublicationPreview [C] (iPhone 17 Pro 402 x 874,
     titre + histoire + 10 premiers medias + hashtags)
  -> description Markdown bornee -> RichTextStory (resume admin + fiche publique)
  -> renouvellement du jeton Auth (2 reprises reseau bornees) puis preflightProductMutationAdmin [F]
     (App Check + admin actif + AAL2)
  -> preparation puis upload de toutes les variantes catalogue [ST]
     (une lecture source, concurrence bornee a quatre)
  -> createPublishedProductAdmin seulement apres succes de tous les uploads [F]
     -> contenu + offre + stock + publication dans une transaction [DB]
  -> preuve admin non cachee `/api/admin/catalog-publication-status`
     (App Check + token Auth non revoque + claim + registre actif + AAL2)
     du produit et de la release exacte; HTML ISR non bloquant
  -> succes -> bascule automatique vers Publications [C]
  -> archivage: modale applicative + commandId stable -> deleteProductAdmin [F]
     -> archive souple auditee, historique stock conserve [DB]
  -> prepareSocialPublicationAdmin [F] apres confirmation site
  -> sys_social_publications/{commandHash} [DB, backend-only]
  -> runSocialPublicationAdmin [F]
     -> Instagram media/container/media_publish [EXT]
     -> Facebook photos/feed [EXT]
     -> reprise ciblee des destinations non publiees
  -> onCatalogSourceWrite [F]
  -> Cloud Tasks build [EXT]
  -> snapshot/manifeste/impact-plan [ST]
  -> CAS current puis previous/LKG [ST]
  -> dispatchCatalogRevalidation [F]
  -> /api/revalidate-catalog HMAC [API]
  -> tag pointeur API + chemins impactes
  -> preuve API exacte /api/catalog/version
  -> sys_catalog_live/current [DB] -> onglets visibles
     -> grilles galerie rechargees depuis la release exacte + router.refresh
  -> preuve HTML versionnee asynchrone (200 courant, 404 ancien chemin retire)
     -> servedState/reprises d'exploitation
```

Connexion et exploitation sociales:
`_DOCS/admin/INSTAGRAM_OAUTH_RUNBOOK.md`.

### 4.3 Authentification

```text
header/menu/route privee
  -> LegacyLoginModalFullIsland [C]
  -> AuthContext + authStore
  |-- Google -> Firebase Auth [EXT]
  |-- OTP -> send/verifyCustomerLoginOtp [F] -> Gmail/Resend [EXT]
  `-- passkey -> 4 callables WebAuthn [F] -> users/{uid}/passkeys [DB]
  -> loginWithCustomToken (retry reseau borne, meme token garde en memoire)
  -> etat partage header/menu/espace client
  -> admin: claim + registre actif + AAL2 Google ou passkey
  -> meme session pour lectures et mutations, sans step-up temporel
```

Reference visuelle et cycle de vie:
`_DOCS/email/EMAILS_TRANSACTIONNELS.md`.

Plan temporaire de reproduction humaine sans correction de code:
`_DOCS/email/RECETTE_EMAILS_LUNA.md`.
Skill reutilisable de cette recette par l'agent du chat actif:
`.agents/skills/client-admin-test/SKILL.md`, invoque par `$client-admin-test`.
Guide court: `TEST_CLIENT_ADMIN_LUNA.md`.

### 4.4 Achat

```text
carte produit
  -> guestCart ou users/{uid}/cart
  -> /checkout
  -> OTP/compte verifie
  -> adresse + telephone normalises dans shippingSnapshot
  -> methode/policy de livraison figee dans deliverySnapshot
  -> createOrder [F]
  -> transaction stock + orders [DB]
  -> Stripe Payment Element [EXT]
  -> fermeture/reload: descriptor UID -> resumeCheckoutV2 -> meme PaymentIntent si encore payable
     -> recapitulatif reconstruit depuis les lignes immuables de la commande, jamais depuis le panier courant
  -> paiement deja durable: terminal PAID -> descriptor retire -> lignes achetees nettoyees par revision
  -> stripeWebhook [F]
  -> order paid + fait financier + recu sandbox + deux outbox atomiques:
     client + notification admin dediee
  -> /mes-commandes + /admin
     -> documents + derniere demande client; index subcollection updatedAt desc
     -> erreur reader visible/rejouable, jamais convertie en faux historique vide
  -> fulfillment derive de deliverySnapshot:
     -> retrait: preparer -> pret -> retire
     -> transport: preparer -> expedier -> livre/suivi
  -> expedition admin: modale transporteur/suivi -> commande idempotente
     -> outbox client -> meme suivi dans /mes-commandes
     -> correction du suivi par commande separee, sans rejouer l'expedition
  -> document client: modale mobile/desktop -> prepareCommerceDocumentDelivery [F]
     -> Auth/App Check + UID proprietaire -> PDF immutable prive [ST]
     -> ouvrir/enregistrer/partager [C] + copie e-mail outbox dedupliquee
  -> demande client de retour persistante [F]
     -> orders/{orderId}/customer_return_requests/{requestId} [DB]
     -> outbox notification administrateur [DB]
     -> Retours admin: rembourser maintenant si custody=merchant
        ou autoriser le retour si custody=carrier/customer
     -> reception + disposition + resolution du retour physique
     -> remboursement Stripe seulement apres inspection dans ce second parcours

confinement Gate 0B SANDBOX_ACTIVE
  |-- createOrder/manual/deferred -> refus fail-closed avant effet
  |-- fermeture/client/admin/cleanup/refund -> aucun release legacy
  |-- webhook PI existant -> drainage signe + lease fencee
  |-- Admin commerce -> consultation read-only
  `-- Rules -> orders/policy/champs commerce/delete media fermes
```

Rail de secours admin, deploye sur le sandbox avec controls fermes au 2026-08-01:

```text
/admin -> Liens de paiement [C]
  -> selection de 1 a 20 meubles + livraison + validite + e-mail optionnel
  -> createAdminPaymentLink [F] sous admin actif AAL2 et control v2
  -> prix/stock/policy/Connect relus serveur, hold + order v2 atomiques [DB]
  -> URL HMAC opaque /payer/[orderId]/[token], sans compte ni OTP
  -> coordonnees client allowlistees -> PaymentIntent idempotent [EXT]
  -> webhooks v2 -> paid + stock commit + outboxes client/admin [DB]
  -> extension bornee a 24 h; rotation invalide l'ancienne URL avant PI
  -> annulation/expiration provider-first -> stock libere seulement apres Stripe
  -> lien ferme -> recreation = nouvelle commande et nouvelle verification stock/prix
```

Configuration livraison admin:

```text
/admin -> Livraison [C]
  -> getDeliveryPolicyAdmin [F] -> control + policy active [DB]
  -> saveDeliveryPolicyAdmin [F] (App Check + admin actif AAL2)
  -> nouvelle commerce_policy_versions/{version} immuable [DB]
  -> bascule transactionnelle sys_commerce_control/current [DB]
  -> projection publique sys_metadata/delivery [DB]
  -> commandes existantes conservees sur leur policy epinglee
```

L'audit et la roadmap temporaire 0A a 8 sont clos. Leur verite durable est
fusionnee dans `_DOCS/commerce/COMMERCE_STRIPE.md` et les chapitres canoniques
admin, client, qualite, infrastructure et exploitation.

La reprise post-Gate 8 est bornee par
`_DOCS/commerce/COMMERCE_REPRISE.md` et le handoff `TODO.md`. R2 a execute une
fenetre `v2_all` catalogue reel autorisee puis refermee le 2026-07-29. La suite
revient a R1 UX et n'autorise aucune activation `v2_all` permanente, live ou
production.

Noyau v2 deploye en sandbox, writer verrouille par controle absent:

```text
politique/control backend fail-closed
  -> schema v2 + validateurs/reducer pur
  -> commandId/payloadHash/expectedVersion idempotents
  -> policy/livraison/Connect epingles [Gate 2]
  -> inventoryKey + holds quantitatifs [Gate 2]
  -> projection legacy + readers v1/v2
  -> lecteurs UID/admin frontend actifs
  -> timeline admin bornee: creation/paiement + journal annulation/refund
  -> flags checkout/reprise et commandes frontend off
  -X createCheckout/mutations v2 refuses par controle serveur explicite off

Flux cible restant:

politique/control backend fail-closed
  -> createCheckout + clientOrderId/requestHash
  -> reservation quantitative par commande/cle inventaire
  -> saga PaymentIntent idempotente
  -> inbox webhook a lease + reducer/reconciler commun
  -> axes payment/fulfillment/custody + refunds/returns separes
  -> projections legacy, outbox, stats et documents reconstruisibles
  -> UI client/admin via commandes serveur
```

Gates 0A a 8 sont fermees en sandbox depuis le 2026-07-28. Par decision
explicite du 2026-08-02, checkout et workers v2 sont actifs en `v2_all` pour
les tests fonctionnels publication/achat; lecteurs UID/admin et exploitation
restent actifs. Les mutations admin sont `v2`, Stripe reste en mode test et le
paiement offline reste `off`.

Gate 6 ajoute un rail de migration sans writer:

```text
scripts/classify-legacy-commerce.mjs
  -> pagination orders + checkpoint local ignore
  -> relecture Stripe sandbox des etats financiers ambigus
  -> legacy_terminal_read_only | safe_to_adopt | needs_review
  -> manifeste hash/updateTime sans PII

scripts/prepare-commerce-fixtures.mjs
  -> preflight + sauvegarde des cibles
  -> UID technique Firebase Auth
  -> produits furniture e2eOnly stocks 1/2/10
  -> policy + compte Connect v2 + commerce_fixture_scopes backend-only
  -> sys_commerce_control/current explicitement newCheckoutMode=off

scripts/build-commerce-release-manifest.mjs
  -> manifeste Gate 7A immutable, hash source et cibles regionales

scripts/activate-commerce-fixture.mjs
  -> activation atomique fail-closed du seul scope et manifeste epingles

scripts/commerce-v2-all-window.mjs
scripts/configure-commerce-sandbox.mjs
  -> statut recuperable, decouverte read-only, preflight, ouverture et fermeture
     auditee `v2_all` sur cinq produits exacts
  -> policy UI sandbox epinglee puis policy precedente restauree

scripts/audit-refund-failed-v2.mjs
  -> gate non mutante des Functions deployees, rejet non signe et abonnements
     Stripe test `refund.created|updated|failed` avant M12/M13

refund `succeeded -> failed`
  -> inbox Stripe autoritaire + fait append-only `refund_reversal`
  -> rollup financier compense, stock inchange, commande `needs_review`
  -> reader client masque la confirmation obsolete sans supprimer la preuve

scripts/confirm-commerce-order-v2.mjs
scripts/refund-commerce-order-v2.mjs
scripts/cleanup-paid-order-cart-v2.mjs
  -> commandes sandbox exactes, cible/etat/montant/confirmation fail-closed

scripts/inspect-commerce-orders-v2.mjs
scripts/audit-commerce-orders-v2.mjs
  -> lecture bornee des commandes, Stripe, stocks, mouvements, outbox et faits
```

Le scope `fixture_gate6_20260728` ne reference que les produits
`fixture_*`; le snapshot public exclut `e2eOnly`. Aucune adoption legacy ni
activation checkout n'est effectuee en Gate 6.

### 4.5 Remboursement

```text
AdminReturns
  -> requestRefundAdmin v2, demande idempotente [F]
  -> etat pending conserve la meme refundRequestId
  -> lecture admin joint la derniere tentative bornee
  -> Rapprocher Stripe rejoue exactement cette tentative [F]
  -> Stripe create/retrieve avec la meme cle idempotente [EXT]
  -> order refunded [DB]
  -> physicalDispositionRequired=true
  `-> aucune remise en stock automatique
```

La cible separe refund financier, retour physique, inspection et remise en stock.

### 4.6 Analytics

```text
AnalyticsCollectorIsland + AuthProvider anonyme [C]
  -> AnalyticsProvider [C]
  -> heartbeat adaptatif + raisons init/route/visible/beacon [C]
  -> initLiveSession/syncSession/beacon + cache borne du hash de jeton [F]
  -> analytics_sessions/{sessionId} avec journey et compteurs de raisons embarques [DB]
  -> AdminDashboard: intentions/tendances 30 jours + miniatures du snapshot public court [C]
  -> AdminAnalytics: historique borne, cache IndexedDB, listener live et frise illustree [C]
  -> UID/IP, courbe, bandeau live cumulatif, visiteurs et parcours [C]
```

Mesure des lectures et couts: `_DOCS/data/AUDIT_COUTS_FIRESTORE.md` (Usage Insights, Query Insights, Monitoring, Data Access et attribution au code).

### 4.7 Demande de devis restauration

```text
/devis [S]+[C]
  -> shell serveur complet sans JavaScript
  -> assistant interactif en 7 étapes: meuble -> état -> photos -> détails
     -> prestations -> contact -> estimation indicative
  -> validation des coordonnées avant l'estimation finale
  -> createQuoteRequest [F]: validation, prix serveur, rate limit et dossier durable
  -> uploadQuoteRequestPhoto [F]: compression client puis re-encodage WebP prive
  -> finalizeQuoteRequest [F]: réception confirmée sans dépendre d'une boîte métier
  -> onQuoteRequestSubmitted [F]: accusé de réception client asynchrone
  -> quote_requests/{quoteId} + médias Storage privés
  -> AdminQuotes [C]: recherche, statuts, fiche, photos signées et notes internes
```

### 4.8 Jeu newsletter et avantages client

```text
galerie: choix d'une carte [C]
  -> drawNewsletterReward [F]: tirage pondéré serveur, App Check et rate limit
  -> saisie e-mail + consentement newsletter [C]
  -> claimNewsletterReward [F]: code durable, abonné et envoi Gmail/Resend
  -> newsletter_rewards/{rewardId} + newsletter_subscribers/{emailHash} [DB]
  -> materialisation commerce_promotion_codes/{sha256(code)} [DB backend-only]
  -> confirmation immédiate avec code [C]
  -> /mes-commandes#avantages
     -> listMyNewsletterRewards [F]: session Auth et e-mail vérifié
     -> dernier code visible, copie et historique borné [C]
  -> /checkout: previewPromotionCodeV2 [F], aperçu prix serveur
  -> createCheckoutV2 [F]: revalidation + reservation code/stock/commande atomique
  -> webhook Stripe succeeded [F]: redemption committed et gain newsletter used
```

## 5. Arborescence racine

```text
.
|-- AGENTS.md ......................... Bible agents, etat, regles et index
|-- map.md ............................ Cette cartographie
|-- _DOCS/ ........................... Chapitres canoniques
|-- apphostingaudit/ ................. Centre audits Firebase/App Hosting, migration Gen2 et suivi G0-G13
|-- app/ ............................. Next App Router
|-- src/ ............................. Modules UI/metier et helpers
|-- functions/ ....................... Cloud Functions privees, codebase main
|-- scripts/ ......................... Gates, E2E, audits, migrations
|-- tests/ ........................... Contrats Node et smoke Playwright
|-- deploy/ .......................... Dashboard sandbox
|-- public/ .......................... Assets statiques servis tels quels
|-- .agents/skills/ .................. Skills locaux UI/design
|-- .github/workflows/quality.yml .... CI Node 22/pnpm
|-- package.json / pnpm-lock.yaml .... Dependances et commandes racine
|-- next.config.mjs .................. Next, deploymentId, expiration ISR, CSP, headers et redirects
|-- apphosting.yaml .................. App Hosting sandbox
|-- firebase.json .................... Firebase resources et codebases
|-- .firebaserc ...................... Alias projet sandbox
|-- firestore.rules ................. Autorisations Firestore
|-- firestore.indexes.json .......... Indexes/exemptions, dont agregation faits financiers type + montant
|-- storage.rules .................... Autorisations Storage
|-- playwright.config.mjs ........... Configuration navigateur
|-- eslint.config.mjs ............... Qualite statique
`-- .env.* ........................... Contrats locaux, secrets reels non documentes
```

## 6. Arborescence `app/`

```text
app/
|-- layout.jsx ........................ layout racine, metadata, providers globaux
|-- page.jsx .......................... `/`, galerie canonique
|-- error.jsx ......................... erreur client racine
|-- not-found.jsx ..................... 404
|-- sitemap.js ........................ sitemap public
|-- robots.js ......................... robots
|-- RouteClientProviders.jsx .......... providers des tunnels client
|-- RouteTransitionIsland.jsx ......... transitions globales
|-- route-transition.config.js ........ contrat des transitions
|-- ViewportHeightSyncIsland.jsx ...... hauteur visualViewport globale et persistante
|-- GalleryMobileShellIsland.jsx ...... shell mobile galerie
|-- HeroVideoSliderIsland.jsx ......... hero video interactif
|-- HomeMotionIslandV4.jsx ............ motion home
|-- MobileNavIsland.jsx ............... navigation mobile
|-- galerie/
|   `-- page.jsx ...................... alias `/galerie`
|-- categorie/[categoryId]/
|   `-- page.jsx ...................... SSG/ISR categorie + metadata
|-- produit/[slugOrId]/
|   `-- page.jsx ...................... SSG/ISR produit + JSON-LD/preloads
|-- a-propos/
|   `-- page.jsx ...................... page vitrine serveur
|-- devis/
|   `-- page.jsx ...................... page devis serveur + formulaire differe
|-- recherche/
|   `-- page.jsx ...................... recherche noindex
|-- wishlist/
|   |-- page.jsx ...................... route dynamique
|   `-- WishlistPageIsland.jsx ........ donnees et actions wishlist
|-- checkout/
|   |-- page.jsx ...................... route dynamique
|   `-- CheckoutPageIsland.jsx ........ auth/panier vers CheckoutView
|-- payer/[orderId]/[token]/
|   |-- page.jsx ...................... route privee dynamique noindex/no-referrer
|   `-- PaymentLinkPageIsland.jsx ..... coordonnees puis Payment Element sans compte
|-- mes-commandes/
|   |-- page.jsx ...................... route dynamique
|   |-- loading.jsx ................... loading coherent du compte
|   `-- OrdersPageIsland.jsx .......... auth, orders et wishlist
|-- admin/
|   |-- layout.jsx .................... layout admin
|   |-- page.jsx ...................... route dynamique
|   |-- AdminAppIsland.jsx ............ shell, groupes, lazy tabs, gate facturation, catalogue snapshot a la demande
|   `-- AdminSidebar.jsx .............. navigation laterale responsive
`-- api/
    |-- catalog/route.js .............. catalogue snapshot same-origin
    |   `-- version/route.js .......... version minimale ETag/304
    |-- search/route.js ............... recherche catalogue
    `-- revalidate-catalog/route.js ... revalidation admin
```

## 7. Arborescence `src/`

### 7.1 Styles et assets

```text
src/
|-- index.css ......................... styles globaux et contrats responsive
|-- home-v4.css ....................... styles home version courante
`-- assets/
    |-- quote-restoration-hero.webp ... media devis actif
    |-- quote-restoration-hero.png .... source/candidat nettoyage controle
    |-- marseille-vieux-port-blueprint.png
    `-- marseille-notre-dame-blueprint.png
```

### 7.2 Configuration, contexte et Auth

```text
src/kit/
|-- auth/
|   |-- authStore.js .................. source et abonnement session UI
|   |-- customTokenSignIn.js .......... reprise reseau bornee du Custom Token
|   |-- googleAuthDiagnostics.js ...... classification et historique local sanitise Google
|   `-- redirectState.js .............. marqueur redirect borne, session/localStorage resilient
|-- contexts/
|   `-- AuthContext.jsx ............... login Google/OTP/passkey et session
|-- config/
|   |-- constants.js .................. taxonomie, collections, tabs admin
|   |-- firebaseCore.js ............... app Firebase minimale
|   |-- firebaseLazy.js ............... services/Functions charges a la demande
|   |-- firebase.js ................... facade Firebase historique/active
|   |-- firebaseEnv.js ................ resolution env Firebase
|   |-- firebaseStorage.js ............ Storage
|   |-- stripe.js ..................... Stripe client
|   `-- theme.js ...................... theme partage
|-- shared/
|   |-- AnalyticsProvider.jsx ......... pipeline analytics navigateur
|   |-- analyticsEvents.js ............ bus borne des actions metier vers la session
|   |-- clientPerf.js ................. mesures client
|   |-- ErrorBoundary.jsx ............. frontiere erreur
|   `-- CustomerTestimonialsCarousel.jsx
`-- ui/
    `-- Toast.jsx ...................... notifications
```

### 7.3 Marketplace public

```text
src/kit/marketplace/
|-- GalleryRoutePage.jsx .............. composition donnees de `/` et `/galerie`
|-- GalleryServerView.jsx ............. rendu final galerie
|-- GalleryLiveProductGridIsland.jsx .. grilles live + insertion ciblee post-publication sans carte hors grille
|-- MarketplaceHeroServer.jsx ......... hero serveur
|-- AnnouncementBannerServer.jsx ...... bandeau commercial
|-- ArchitecturalHeaderServer.jsx ..... header serveur
|-- CategoryRailServer.jsx ............ rail categories
|-- GalleryProductCardServer.jsx ...... carte produit serveur
|-- ProductCardMediaServer.jsx ........ media carte canonique galerie/categorie
|-- CatalogVersionSyncIsland.jsx ...... signal visible + garde version/prefetch
|-- ProductSectionsServer.jsx ......... sections fixes galerie
|-- FooterServer.jsx .................. footer serveur
|-- GalleryGridActionsIsland.jsx ...... actions des cartes
|-- GalleryFixedSectionsInteractions.jsx
|-- HeroMotionIsland.jsx .............. animation hero
|-- InstagramFloatingTokensReveal.jsx . reveal Instagram
|-- CategoryServerView.jsx ............ page categorie
|-- CategoryControlsIsland.jsx ........ filtres/tri categorie
|-- categoryViewModel.js .............. modele categorie
|-- ProductDetailServerView.jsx ....... fiche produit serveur
|-- ProductDetailShellIsland.jsx ...... galerie/detail interactif
|-- ProductDetailActionsIsland.jsx .... panier/wishlist/devis
|-- ProductDetailLightboxIsland.jsx ... zoom medias
|-- ProductReturnRestoreIsland.jsx .... retour produit vers position galerie/categorie
|-- PageBreadcrumb.jsx ................ fil d'Ariane
|-- SearchSuggestIsland.jsx ........... suggestions header
|-- SearchResultsIsland.jsx ........... resultats page
|-- searchModel.js .................... normalisation/recherche
|-- seoCopy.js ........................ textes SEO marketplace
|-- WishlistToggleIsland.jsx .......... action wishlist
|-- WishlistView.jsx .................. vue wishlist
|-- wishlistState.js .................. persistence/abonnement wishlist
|-- CartPanelIsland.jsx ............... panneau panier
|-- LazyCartPanelIsland.jsx ........... chargement differe panier
|-- DarkModeToggleIsland.jsx .......... theme
|-- HeaderAccountIsland.jsx ........... etat compte header
|-- GlobalMenuTriggerIsland.jsx ....... bouton menu
|-- PremiumMegaMenuIsland.jsx ......... panneau principal
|-- PremiumMegaMenuLazyIsland.jsx ..... facade lazy
|-- LegacyLoginModalFullIsland.jsx .... modale Auth actuelle (nom historique)
|-- QuoteRequestServerView.jsx ........ page devis serveur
|-- QuoteFormSsrShell.jsx ............. shell formulaire
|-- QuoteFormDeferredIsland.jsx ....... lazy formulaire
|-- QuoteFormIsland.jsx ............... formulaire interactif
|-- newsletterRewardClient.js ......... tirage, réclamation et lecture des avantages
|-- FooterBackToTopButtonIsland.jsx ... retour haut
`-- FooterMapFrameIsland.jsx .......... carte footer differee
```

### 7.4 Commerce et espace client

```text
src/kit/commerce/
|-- CartSidebar.jsx ................... UI panier
|-- guestCart.js ...................... panier invite/handoff
|-- purchasability.js ................. regle unique achetable
|-- CheckoutView.jsx .................. orchestration checkout
|-- CheckoutStripeModal.jsx ........... suivi commande/paiement
|-- CheckoutPaymentStep.jsx ........... Stripe Payment Element
|-- adminPaymentLinkClient.js ......... callables admin/public du rail de secours
|-- checkoutController.js ............. controller v2 et stateVersion
|-- orderAdapter.js ................... lecture UI v1/v2 sans ambiguite
|-- checkoutRecovery.js ............... reprise 3DS/reload namespacee, sans secret
|-- checkoutContract.js ............... entree checkout allowlistee, sans prix client
|-- commerceV2Client.js ............... lecteurs v2, checkout/reprise et aperçu promotion serveur
|-- commerceCommandClient.js .......... commandes admin/client, controle serveur fail-closed
|-- shippingCarriers.js ............... choix transporteurs UI sans URL libre
|-- adminProductCommandClient.js ...... callables produit, flag Gate 4 off
|-- OrderSuccessModal.jsx ............. confirmation
|-- CommerceDocumentModal.jsx ......... PDF ouvrir/enregistrer/partager + etat e-mail
|-- MyOrdersView.jsx .................. espace client via reader UID `listMyOrdersV2`, suivi et entree documents
`-- LoginView.jsx ..................... login admin/compatibilite
```

### 7.5 Layout et vitrine

```text
src/kit/layout/
|-- GlobalMenu.jsx .................... facade menu
|-- GlobalMenuDesktop.jsx ............. composition desktop
`-- GlobalMenuMobile.jsx .............. composition mobile

src/kit/vitrine/
|-- AboutServerView.jsx ............... rendu A propos
|-- aboutContent.js ................... contenu structure
|-- AboutCriticalStyles.jsx ........... styles critiques
|-- about-sv4-hero.css ................ styles hero
|-- Sv4HomeHero.jsx / Sv4SiteNav.jsx .. composants vitrine
|-- AboutSv4HeroMotionIsland.jsx ...... motion hero
|-- AboutMotionIsland.jsx ............. motion principale
|-- AboutMotionDeferredIsland.jsx ..... motion differee
|-- AboutStylesIsland.jsx ............. styles client
|-- AboutBeforeAfterIsland.jsx ........ avant/apres
|-- AboutFaqIsland.jsx ................ FAQ
|-- AboutInstagramCounterIsland.jsx ... compteur social
`-- AboutTestimonialsIsland.jsx ....... temoignages
```

### 7.6 Back-office

```text
src/kit/admin/
|-- AdminDashboard.jsx ................ pilotage commerce, devis/tendances analytics bornes, miniatures du snapshot public, exports et maintenance rapide
|-- AdminQuotes.jsx ................... réception et suivi des demandes de restauration
|-- quoteAdminClient.js ............... cache court et callables protégées Devis
|-- AdminAnalytics.jsx ................ moteur Data canonique: UID/IP, live, parcours illustres, courbes
|-- AdminForm.jsx ..................... creation/edition annonces
|   |-- productPublicationClient.js ... utilitaires historiques de session + attente de la release publique exacte
|   |-- components/InstagramPublicationPreview.jsx .. apercu prive Instagram iPhone 17 Pro
|   |-- components/MetaConnectionBadge.jsx ........ gestion des connexions Instagram direct et Facebook
|   |-- components/useMetaConnection.js ........... etat OAuth agrege des deux fournisseurs
|   `-- metaPublicationClient.js ................... callables OAuth Instagram direct, Facebook optionnel et saga sociale
|-- AdminItemList.jsx ................. liste publications
|-- GlobalInventoryView.jsx ........... vue catalogue/ordres
|-- AdminStudio.jsx ................... studio contenu
|-- AdminHomepage.jsx ................. personnalisation publique
|-- AdminOrders.jsx ................... ventes/logistique: conteneur lectures + commandes commerce, scope charge explicite
|   |-- components/orders/orderPresentation.js .... derivations pures: priorite actionnable, remboursements, recherche, formats, CSV
|   |-- components/orders/orderTones.js ........... tons et surfaces partages clair/sombre
|   |-- components/orders/OrderRow.jsx ............ ligne dense, etat en quatre temps
|   |-- components/orders/OrderDetailPanel.jsx .... detail: prochaine etape, parcours horodate, panier, client
|   |-- components/orders/OrdersOverviewPanel.jsx . resume affiche tant qu'aucune commande n'est ouverte
|   |-- components/orders/OrderModalShell.jsx ..... voile, piege de focus, feuille mobile
|   |-- components/orders/OrderActionButtons.jsx .. action primaire/fantome
|   |-- components/orders/ConfirmDialog.jsx ....... confirmation retrait/livraison/archivage
|   `-- components/orders/ShipmentDialog.jsx ...... expedition et suivi transporteur
|-- AdminPaymentLinks.jsx ............. creation, copie et cycle de vie des liens prives
|-- AdminPromotionCodes.jsx ........... creation/suspension des remises bornees et ciblees produit
|-- promotionCodeClient.js ............ callables promo admin et mapping d'erreurs
|-- AdminInvoices.jsx ................ selection meubles, edition, apercu A4, brouillons et envoi PDF
|-- AdminReturns.jsx .................. demandes client + remboursements + retours physiques detailles
|-- AdminLivraison.jsx ................ configuration livraison
|-- AdminUsers.jsx .................... comptes/acces admin
|-- AdminIPManager.jsx ................ configuration IP complementaire
|-- AdminIPTracker.jsx ................ collecte signal IP admin
|-- AdminSEO.jsx ...................... outils SEO
|-- AdminNewsletter.jsx ............... abonnes/informations
|-- AdminPaymentSettings.jsx .......... Stripe Connect/carte
|-- AdminMaintenance.jsx .............. maintenance
|-- AdminAccount.jsx .................. profil admin et conteneur onboarding dedie
|-- BillingOnboardingGuide.jsx ........ guide Google Billing manuel, progression et placeholders captures
|-- BillingOnboardingOperator.jsx ..... validation/reinitialisation admin forte
|-- analyticsReliability.js ........... fiabilite/checkpoints
|-- exportCsv.js ...................... exports
|-- adminCommerceData.js .............. premiere page commandes/demandes/retours et prechargement de session
|-- adminDataCache.js ................. cache memoire borne Stats/Ventes/Retours
|-- adminPublicCatalog.js ............. lecture snapshot admin sans cache persistant
`-- components/
    |-- AdminImageCard.jsx
    |-- ImageCropperModal.jsx
    |-- MetaConnectionBadge.jsx ....... controle Instagram direct et Facebook facultatif
    |-- useMetaConnection.js .......... etat OAuth agrege et actions par fournisseur
    `-- TextEditorModal.jsx
```

### 7.7 Bibliotheques serveur et utilitaires

```text
src/lib/server/
|-- env.js ............................ env publique/serveur
|-- firebaseAdmin.js .................. Firebase Admin Next
|-- adminAuthorization.js ............. App Check + Auth revoquee + claim + registre + AAL2 pour API Next
|-- requestBody.js .................... lecture JSON streaming bornee et UTF-8 stricte
|-- products.js ....................... acces/normalisation catalogue
|-- productRoute.js ................... resolution pure ID ou slug canonique, y compris IDs avec tirets
|-- materializedCatalog.js ............ lecteur Storage current/previous/LKG
|-- materializedCatalogValidation.cjs . schema, hashes et contrat snapshot
|-- catalogRevalidationContract.js .... validation plan/projet/audience
|-- catalogVersionContract.js ......... payload version et contrat 200/304
|-- galleryPersonalization.js ......... metadata galerie
|-- about.js .......................... donnees A propos
`-- theme.js .......................... theme serveur

src/lib/seo/
|-- categories.js ..................... taxonomie URL/SEO
|-- indexability.js ................... garde-fous indexation
`-- productStructuredData.js .......... JSON-LD produit

src/utils/
|-- imageUtils.js ..................... variantes/metadata/images
|-- generateCommerceDocument.js ....... ancien renderer PDF client, non appele
|-- generateInvoice.js ................ generateur PDF legacy non fiscal et masque
|-- shippingAddress.js ................ format adresse
|-- slug.js ........................... slugs
`-- time.js ........................... temps/dates
```

## 8. Arborescence Functions

```text
functions/
|-- index.js .......................... exports codebase main
|-- helpers/
|   |-- runtime.js .................... region et logs perf
|   |-- security.js ................... auth/assurance/validation
|   |-- clientIp.js ................... identite IP canonique des limites d'abus
|   |-- secrets.js .................... definitions Secret Manager
|   `-- config.js ..................... config serveur
`-- src/
    |-- auth/
    |   |-- grantAdmin.js
    |   |-- adminManagement.js
    |   |-- customerLoginOtp.js
    |   |-- guestCheckoutOtp.js
    |   `-- passkeys.js
    |-- commerce/
    |   |-- createOrder.js
    |   |-- legacyContainment.js ........ hard-stop backend fail-closed Gate 0B
    |   |-- domain/ ...................... noyau v2 Gates 1 a 4, mutations off
    |   |   |-- orderState.js ............ schema, factory, reducer, reader
    |   |   |-- money.js
    |   |   |-- inventoryInvariants.js
    |   |   |-- legacyProjection.js
    |   |   |-- policy.js
    |   |   |-- idempotency.js
    |   |   |-- dependencies.js
    |   |   |-- failpoints.js
    |   |   |-- checkoutInput.js ......... entree allowlistee et lignes versionnees
    |   |   |-- promotionCode.js ......... normalisation, definition et calcul de remise serveur
    |   |   |-- inventoryKey.js .......... identite canonique de SKU
    |   |   |-- connectPolicy.js ......... readiness et compte epingle
    |   |   |-- reservationRepository.js . mouvements hold/commit/release
    |   |   |-- checkoutRepository.js .... order, hold, promotion, tentative et identite atomiques
    |   |   |-- adminPaymentLink.js ...... token HMAC, expiration et statuts du lien
    |   |   |-- adminPaymentLinkCoordinator.js  reservation, PI, rotation et liberation sure
    |   |   |-- checkoutCoordinator.js ... create/resume sur etat durable
    |   |   |-- checkoutSaga.js .......... tentative PI et matrice de reprise
    |   |   |-- checkoutSagaService.js ... orchestration Stripe injectee, non exportee
    |   |   |-- checkoutSagaRepository.js  persistance saga et settlement atomique
    |   |   |-- webhookInbox.js .......... lease, backoff et fencing
    |   |   |-- webhookInboxRepository.js  commit inbox + effet atomique
    |   |   |-- stripeWebhookIngress.js ... signature et scope plateforme/Connect
    |   |   |-- webhookWorker.js .......... retrieve PI/refund puis apply sous fence
    |   |   |-- reconcilePayment.js ...... mapping complet des statuts PI
    |   |   |-- paymentEffectApplier.js ... order/inventaire/fait/recu/outbox atomiques
    |   |   |-- refundEffectApplier.js .... refund webhook, tentative/audit/document/outbox atomiques
    |   |   |-- commerceEffects.js ....... faits financiers/outbox deterministes
    |   |   |-- outboxRepository.js / outboxWorker.js ... lease, dead-letter et delivery_unknown
    |   |   |-- financialProjection.js .. projection financiere absolue
    |   |   |-- financialRollup.js ....... deltas total/jour atomiques et idempotents
    |   |   |-- commerceDocuments.js ..... recus sandbox non fiscaux
    |   |   |-- commerceDocumentArtifact.js  PDF Node deterministe + Storage prive
    |   |   |-- operationsHealth.js ...... incidents, seuils et sante Gate 7A
    |   |   |-- fixtureScope.js / fixtureCleanup.js ... autorisation et cleanup run-scoped
    |   |   |-- checkoutAccessToken*.js ... token backend opaque rotatif
    |   |   |-- guestCheckoutCoordinator.js
    |   |   |-- boundedWorkerSweeper.js / firestoreWorkerQueries.js
    |   |   |-- reservationExpiryWorker.js
    |   |   |-- allowedActions.js ......... actions client/admin derivees serveur
    |   |   |-- returnCase.js ............. retours/dispositions quantitatifs Gate 4
    |   |   |-- orderCommandRepository.js . fulfillment idempotent + audit
    |   |   |-- cancellationCoordinator.js / cancellationAuditRepository.js
    |   |   |-- refundSaga*.js ............ refund Stripe reprenable et epingle
    |   |   |-- refundRepository.js ....... cumul/fait/document/outbox atomiques, sans stock
    |   |   |-- returnRepository.js ....... allocations, dispositions et audit
    |   |   |-- productCommands.js ......... transitions produit fermees Gate 4
    |   |   |-- productCommandRepository.js  produit idempotent + audit append-only
    |   |   |-- shippingTracking.js ....... transporteurs allowlistes et liens officiels
    |   |   `-- v2Runtime.js .............. cablage callables et workers Gate 7A
    |   |-- promotionMaterialization.js ... raccord newsletter vers registre promotionnel
    |   |-- v2PromotionCodes.js ........... preview client et mutations admin AAL2/App Check
    |   |-- v2ProductCommands.js ........... callables produit actives sous controle v2
    |   |-- v2OrderCommands.js ............. fulfillment/archive/suivi idempotents actifs sous controle v2
    |   |-- v2Cancellation.js .............. callable annulation active sous controle v2
    |   |-- v2ControlGuard.js ............... verrou serveur mutations selon controle
    |   |-- v2Checkout.js .................. create/resume limites au scope fixture
    |   |-- v2AdminPaymentLinks.js ......... callables admin/public + expiration planifiee
    |   |-- v2DeliveryPolicyAdmin.js ....... lecture + versionnement immutable des tarifs livraison
    |   |-- v2Operations.js ................ schedulers, exploitation et synthese Stats fraiche par agregations
    |   |-- v2OrderQueries.js .............. lecteurs UID/admin exportes et actifs
    |   |-- v2DocumentDelivery.js .......... acces PDF proprietaire + outbox bornee
    |   |-- v2RefundCommands.js ............ callable refund active sous controle v2
    |   |-- v2ReturnCommands.js ............ callables retours actives sous controle v2
    |   |-- v2CustomerReturnRequests.js .... demande client + decisions admin vers refund/retour existants
    |   |-- stripeWebhook.js
    |   |-- stripeConnect.js
    |   |-- cancelOrder.js
    |   |-- refundOrder.js
    |   |-- orderStatus.js
    |   |-- orderStats.js
    |   |-- e2eCheckoutProof.js
    |   `-- e2eStripeHardeningProof.js
    |-- email/
    |   |-- emailDesignSystem.js .......... shell HTML/texte premium partage
    |   |-- commerceEmailTemplates.js ..... paiement, fulfillment, refund et document v2
    |   |-- otpEmailTemplates.js .......... OTP connexion/checkout unifies
    |   |-- transactionalEmail.js ......... Gmail/Resend + PDF memoire borne
    |   |-- transactionalEmailRuntime.js
    |   `-- orderEmails.js
    |-- invoicing/
    |   |-- manualInvoiceDomain.js .... validation, montants entiers, hash et numerotation
    |   |-- manualInvoicePdf.js ....... rendu PDF deterministe facture/brouillon
    |   `-- manualInvoices.js ......... callables admin, persistance privee et envoi e-mail
    |-- quotes/
    |   |-- quoteRequestDomain.js ..... validation, statuts et estimation autoritaire
    |   |-- quoteEmailTemplates.js .... accusé de réception client
    |   `-- quoteRequests.js .......... dépôt public, photos privées et commandes admin
    |-- newsletter/
    |   |-- newsletterRewardDomain.js . validation, tirage et codes serveur
    |   |-- newsletterRewardEmail.js .. confirmation du gain client
    |   `-- newsletterRewards.js ...... callables jeu, abonnement et espace client
    |-- analytics/
    |   |-- constants.js
    |   |-- sessionAuthorizationCache.js ... cache borne/TTL du hash de jeton
    |   |-- sessions.js
    |   |-- updateUserSessions.js
    |   `-- adminIP.js
    |-- maintenance/
    |   `-- tools.js
    |-- onboarding/
    |   |-- billingGuide.js ........... callables, modes, etat backend-only
    |   `-- billingGuideContract.js ... modes, etapes, UID cible et format Billing
    |-- integrations/
    |   |-- meta.js .................... OAuth, statut et saga Instagram/Facebook
    |   `-- metaContract.js ............ chiffrement, state et projections purs
    |-- publication/
    |   `-- productPublication.js ...... rail historique inactif cote UI, diagnostic/reprise/collecte des sessions existantes
    |-- triggers/
    |   |-- onArtifactDeleted.js
    |   |-- onArtifactUpdated.js
    |   `-- mediaCleanup.js
    `-- catalog/
        |-- onCatalogSourceWrite.js ... trigger leger, dedup et enqueue
        |-- buildCatalogSnapshot.js ... lease, projection, manifestes et CAS
        |-- snapshotStorage.js ......... objets immuables et pointeurs
        |-- impactPlan.js .............. diff immutable cible/full
        |-- catalogRoutes.js ........... chemins produit/categorie purs
        |-- releaseGarbageCollection.js  retention bornee des releases Storage
        |-- catalogRevalidation.js ..... task HMAC vers App Hosting
        |-- catalogReconciler.js ....... reprise des publications bloquees
        |-- catalogMaintenance.js ...... statut, rollback valide et reconstruction admin
        |-- mediaGarbageCollection.js .. quarantaine media 90 jours + GC quotidien
        `-- publicProjection.js ........ projection publique canonique
```

## 9. Exports Cloud Functions

Baseline G0 du 2026-08-15: `functions/index.js` contient 157 exports uniques;
152 sont `ACTIVE` dans le sandbox (139 Gen1, 13 Gen2). Les cinq exports
Instagram direct `startInstagramOAuthAdmin`, `instagramOAuthCallback`,
`getInstagramConnectionStatusAdmin`, `verifyInstagramConnectionAdmin` et
`disconnectInstagramConnectionAdmin` existent dans le source et leurs
appelants UI, mais pas dans le cloud. Ils restent sous
`HOLD_META_RECONCILIATION` et sont exclus du wrapper de deploiement. Les
decisions par nom, appelants, acces donnees, IAM, secrets et rollback sont dans
`apphostingaudit/manifests/functions-g0.json`; la reconciliation des 13 Gen2,
Schedulers, queues et Eventarc est dans
`apphostingaudit/manifests/functions-platform-g0.json`.

G1 est en `READY_HEALTH_TARGETED_DEPLOY`: protections Firestore, backup,
restore reconcilie et deux canaux Monitoring testes sont actifs; seules les
preuves cloud du correctif sante/workers et l'arbitrage financier restent non
fermes. Le reconciler Gen1 reste en version 11 sur le compte global appspot,
mais sa source epingle maintenant une identite runtime dediee minimale verifiee;
un unique retry cible est autorise apres commit et validation du wrapper.
Les plans read-only P1/P2 sont dans
`apphostingaudit/manifests/functions-gen2-g1-data-plan.json`; aucun passage G2
n'est autorise dans cet etat.

| Domaine | Exports |
| --- | --- |
| commerce | `createOrder`, `stripeWebhook`, `stripeConnectWebhook`, `cancelOrderClient`, `getOrderStatusClient` |
| commerce v2 checkout/lecture | `createCheckoutV2`, `resumeCheckoutV2`, `listMyOrdersV2`, `prepareCommerceDocumentDelivery`, `requestCustomerReturn`, `listOrdersAdminV2`, `getOrderTimelineAdminV2`, `listReturnsAdminV2`, `listCustomerReturnRequestsAdminV2` |
| codes promotionnels | `previewPromotionCodeV2`, `listPromotionCodesAdmin`, `createPromotionCodeAdmin`, `setPromotionCodeStatusAdmin` |
| liens de paiement admin | `createAdminPaymentLink`, `listAdminPaymentLinks`, `extendAdminPaymentLink`, `regenerateAdminPaymentLink`, `recreateAdminPaymentLink`, `cancelAdminPaymentLink`, `getAdminPaymentLinkPublic`, `prepareAdminPaymentLinkPayment`, `resumeAdminPaymentLinkPayment`, `expireAdminPaymentLinks` |
| commerce v2 retours client | `decideCustomerReturnRequestAdmin`, puis commandes refund/retour v2 existantes selon le parcours choisi |
| commerce v2 operations | `commerceOutboxDispatcher`, `commerceOperationsReconciler`, `commerceReservationExpiryDispatcher`, `getCommerceOperationsStatusAdmin`, `rebuildCommerceOperationsAdmin`, `cleanupFixtureRunAdmin` |
| commerce v2 produit | `preflightProductMutationAdmin`, `createProductAdmin`, `createPublishedProductAdmin`, `updateProductOfferAdmin`, `publishProductAdmin`, `adjustInventoryAdmin`, `deleteProductAdmin` |
| publication produit durable historique, inactive dans AdminForm | `startProductPublicationAdmin`, `getProductPublicationSessionAdmin`, `reportProductPublicationClientErrorAdmin`, `retryProductPublicationFinalizationAdmin`, `processProductPublicationImage`, `reconcileProductPublicationSessions`, `cleanupProductPublicationSessions` |
| Meta OAuth/publication | `startMetaOAuthAdmin`, `metaOAuthCallback`, `getMetaConnectionStatusAdmin`, `selectMetaAssetAdmin`, `verifyMetaConnectionAdmin`, `disconnectMetaConnectionAdmin`, `prepareSocialPublicationAdmin`, `runSocialPublicationAdmin`, `getSocialPublicationStatusAdmin` |
| refunds/Connect | `refundOrderAdmin`, `syncRefundStatusAdmin`, `getStripeConnectStatus`, `startStripeConnectOnboarding`, `syncStripeConnectAccount`, `requestStripeConnectReconnect`, `confirmStripeConnectReconnect` |
| preuves E2E | `e2eCheckoutProof`, `e2eStripeHardeningProof` |
| Auth/admin | `grantAdminOnAuth`, `onRegisteredUserCreated`, `onRegisteredUserDeleted`, `addAdminUser`, `removeAdminUser`, `logUserConnection`, `getUserStats`, `syncSuperAdminClaim`, `ensureAdminAccessRegistry` |
| OTP/passkeys | `sendGuestCheckoutOtp`, `verifyGuestCheckoutOtp`, `sendCustomerLoginOtp`, `verifyCustomerLoginOtp`, quatre endpoints passkey |
| onboarding facturation | `getBillingGuideStatus`, `saveBillingGuideProgress`, `getBillingGuideOperatorStatus`, `completeBillingGuideAdmin`, `resetBillingGuideTest` |
| factures manuelles admin | `getManualInvoiceWorkspaceAdmin`, `saveManualInvoiceDraftAdmin`, `prepareManualInvoicePdfAdmin`, `sendManualInvoiceAdmin` |
| demandes de devis | `createQuoteRequest`, `uploadQuoteRequestPhoto`, `finalizeQuoteRequest`, `listQuoteRequestsAdmin`, `getQuoteRequestAdmin`, `updateQuoteRequestAdmin`, `onQuoteRequestSubmitted` |
| newsletter/avantages | `drawNewsletterReward`, `claimNewsletterReward`, `listMyNewsletterRewards` |
| publication sociale | `startInstagramOAuthAdmin`, `instagramOAuthCallback`, `getInstagramConnectionStatusAdmin`, `verifyInstagramConnectionAdmin`, `disconnectInstagramConnectionAdmin`; rail Facebook optionnel `startMetaOAuthAdmin`, `metaOAuthCallback`, `getMetaConnectionStatusAdmin`, `selectMetaAssetAdmin`, `verifyMetaConnectionAdmin`, `disconnectMetaConnectionAdmin`; saga `prepareSocialPublicationAdmin`, `runSocialPublicationAdmin`, `getSocialPublicationStatusAdmin` |
| e-mail | `onOrderCreated`, `onOrderUpdated`, `sendTestEmail`, `sendRefundStatusEmailAdmin` |
| analytics | `initLiveSession`, `syncSession`, `syncSessionBeacon`, `deleteSession`, `clearAllSessions`, `clearAllAffiliateClicks`, `trackAdminIP`, `updateUserSessions`, `onOrderStatsWrite` |
| maintenance | resets/purges, `runGarbageCollector`, `getUploadUrl` |
| triggers catalogue | `onArtifactDeleted`, `onArtifactUpdated` |
| catalogue materialise | `onCatalogSourceWrite`, `dispatchCatalogBuild`, `dispatchCatalogRevalidation`, `catalogReconciler`, `catalogMediaGarbageCollector`, `getCatalogPublicationStatus`, `rollbackCatalogSnapshot`, `rebuildCatalogSnapshot` |

## 10. Donnees

```text
Firestore
|-- artifacts/{appId}/public/data/furniture/{productId}
|-- users/{uid}
|   |-- cart/{itemId}
|   |-- wishlist/{itemId}
|   |-- passkeys/{credentialId}
|   `-- passkey_challenges/{type}
|-- orders/{orderId}
|   |-- documents/{documentId} ........ recus sandbox non fiscaux immutables
|   |   `-- artifacts/current ......... chemin/hash/taille PDF backend-only
|   |-- customer_return_requests/{requestId} . demande client et decision admin, backend-only
|   `-- returns/{returnId} ............ retours physiques, index group updatedAt
|-- commerce_document_delivery_limits/{uidHash}_{day} . quota backend-only
|-- commerce_financial_facts/{factId} . faits financiers append-only
|-- commerce_financial_projections/current
|-- commerce_financial_totals/{currency} . total financier materialise backend-only
|-- commerce_financial_daily/{date}_{currency} . serie quotidienne materialisee backend-only
|-- commerce_outbox/{eventId}
|-- commerce_webhook_inbox/{eventId}
|-- commerce_incidents/{incidentId}
|-- commerce_fixture_scopes/{scopeId}
|-- commerce_release_manifests/{releaseId}
|-- sys_commerce_control/current
|-- sys_commerce_operations/current
|-- newsletter_subscribers/{id}
|-- newsletter_reward_plays/{id} ...... tirage temporaire backend-only
|-- newsletter_rewards/{id} ........... code et preuve d'envoi backend-only
|-- commerce_promotion_codes/{sha256(code)} . definition/compteurs backend-only
|   |-- customers/{sha256(uid)} ....... limite par compte backend-only
|   `-- redemptions/{orderId} ......... reservation/consommation liee a la commande
|-- sys_metadata/{docId}
|-- sys_ratelimit/{id} ................ backend-only
|-- sys_admin_access/{uid} ............ backend-only
|-- product_publication_sessions/{id} . progression/reprise backend-only, expiration 30 jours
|-- sys_user_stats/current ............ compteur comptes, triggers Auth backend-only
|-- sys_idempotency/{id} .............. backend-only
|-- sys_audit_security/{id} ........... audit Auth/admin 366 j, acteur reseau hashe, backend-only
|-- sys_audit_stripe_connect/{id} ..... audit Connect 366 j, backend-only
|-- sys_billing_onboarding/{uid} ...... progression guide, backend-only
|-- sys_meta_connections/default ...... actifs Meta + Page token chiffre
|-- sys_meta_oauth_states/{stateId} ... state one-shot expire
|-- sys_meta_asset_choices/{sessionId}  choix temporaire si plusieurs Pages
|-- sys_social_publications/{id} ...... snapshot et saga par destination
|-- sys_audit_meta/{id} ............... connexions et publications auditees, expiration 366 j
|-- admin_business_profiles/invoicing . profil emetteur backend-only
|-- admin_invoices/{invoiceId} ........ brouillon ou facture emise verrouillee
|   |-- artifacts/{contentHash} ....... preuve du PDF prive materialise
|   `-- deliveries/{sendRequestId} .... statut d'envoi et hash destinataire
|-- admin_invoice_sequences/{year} .... numerotation transactionnelle backend-only
|-- quote_requests/{quoteId} .......... demande, suivi, estimation et pointeurs photos backend-only
|-- sys_audit_quotes/{auditId} ........ creation et changements de suivi sans contenu libre, expiration 366 j
|-- sys_catalog_publication/secondevie  mode, lease et revisions
|-- sys_catalog_publication_events/{eventHash}
|   `-- deduplication/outbox catalogue
|-- sys_catalog_publication_builds/{buildId}
|   `-- journal borne des builds catalogue
|-- sys_catalog_media_gc/{id} ......... quarantaine media
|-- analytics_sessions/{sessionId} .... session + tableau `journey`, expiration 366 j
|-- sales_stats_daily/{id}
`-- inventory_stats/{id}

Storage
|-- furniture/... ..................... sources et medias produit
|-- furniture/thumbnails/... .......... thumb320/thumb384/thumb
|-- furniture/responsive/... .......... card/detailFast/medium/large/full
|-- furniture/publication-sessions/{id}/originals/slot-XX/ . sources privees reprenables
|-- furniture/publication-sessions/{id}/variants/slot-XX/ .. variantes serveur publiques
|-- catalog-projection/v1/releases/{rev}/  objets immuables, manifeste et plan d'impact
|-- catalog-projection/v1/pointers/ .... current/previous/last-known-good
|-- commerce-documents/v2/... ......... PDF commande prives, lecture directe interdite
|-- quote-requests/v1/{quoteId}/... ... photos devis privées, URL admin signée quinze minutes
|-- admin-invoices/v1/... ............. PDF factures emises prives, lecture directe interdite
`-- autres chemins admin .............. contenus hero/about selon configuration
```

## 11. Scripts et tests

### Outils de developpement local

```text
with-env.mjs ......................... charge l'environnement et lance Next; genere NEXT_DEPLOYMENT_ID avant chaque build
deployment-id.mjs .................... identifiant URL-safe unique et validation du version skew
```

### Gates de contrat

```text
check-next-route-classification.cjs
check-mobile-marketplace-contract.cjs
check-seo-indexability.cjs
check-performance-budget.cjs
check-product-ssr.mjs
verify-analytics-reliability.mjs
audit-app-check-paths.cjs ............. ordre d'initialisation App Check navigateur
tests/security-hardening.test.mjs ..... inventaire exhaustif des callables + contrats secrets/Rules/HTTP/logs
tests/security-client-ip.test.cjs ..... en-tetes forges et canonicalisation IPv4/IPv6 des rate limits
tests/security-output-encoding.test.cjs  e-mails, JSON-LD, admin, PDF/OAuth sans injection; erreurs provider non exposees
tests/meta-oauth-contract.test.cjs
tests/invoicing/manual-invoices.test.cjs
tests/billing-onboarding-contract.test.cjs
tests/admin-data-cache-contract.test.mjs
tests/deployment-cache-contract.test.mjs
```

### Audits techniques hors galerie

```text
audit-category-direct.mjs
audit-product-page-direct.mjs
audit-about-direct.mjs
audit-quote-direct.mjs
audit-desktop-global-menu.mjs
audit-mobile-global-menu.mjs
audit-product-detail-images*.mjs
benchmark-auth-ui.mjs
```

### E2E cloud

```text
e2e-auth-email-otp.mjs
e2e-sandbox-role-session.mjs ......... bootstrap ephemere client/admin, sandbox strict, sans secret persiste
e2e-hosted-stripe-checkout.mjs ........ en quarantaine commerce
e2e-refund-latest-stripe-order.mjs .... en quarantaine commerce
read-latest-auth-otp.mjs .............. outil local sensible
audit-refund-failed-v2.mjs ............ gate non mutante M12/M13, zero evenement injecte
```

### Donnees/images

```text
backfill-product-image-*.cjs
backfill-product-thumbnails.cjs
audit-storage-orphans.cjs
cleanup-product-image-variants.cjs .... destructif, confirmation forte
copy-firestore-project.mjs
replace-firestore-string.mjs
purge-expired-firestore.cjs
```

### Tests Node

```text
tests/auth-*.test.cjs
tests/passkey-*.test.cjs
tests/data-retention-contract.test.cjs ... dry-run, expirations et minimisation des audits
tests/security-client-ip.test.cjs ........ identite reseau bornee pour OTP/passkeys/devis/newsletter
tests/security-output-encoding.test.cjs .. encodage HTML/script/PDF + erreurs internes generiques
tests/billing-onboarding-contract.test.cjs
tests/smoke.spec.mjs
tests/catalog/*.test.cjs
tests/catalog/emulator/*.test.cjs
tests/commerce/runner/*.cjs
tests/commerce/suites/*.cjs
tests/commerce/domain/*.test.cjs .......... unitaire + contrats UI/migration Gates 5/6
tests/commerce/browser/*.spec.mjs ......... reprise/revisions multi-onglet locale
tests/commerce/faults/*.test.cjs
tests/commerce/rules/*.cjs
tests/commerce/fixtures/*.json
tests/commerce/runner-self-test.cjs
tests/commerce/run-rules-containment.cjs
```

Gate 0A fournit le runner anti-faux-vert, `test:commerce:containment`,
`test:commerce:rules:containment`, l'agregat et `lint:functions`. Gate 0B ajoute
les preuves hard-stop et Rules Firestore/Storage. Gate 1 fournit les suites
domaine, property, Firestore, Rules et failpoints. Gate 2 etend ces suites avec
policy, Connect, concurrence stock et mouvements quantitatifs. Gates 1 a 5 ont
d'abord ete deployees en sandbox en mode read-only. Gate 6 ajoute le classificateur,
les manifests locaux ignores et le scope fixture backend-only. Gate 7A active
ce seul scope, les workers bornes, projections, documents sandbox,
exploitation et cleanup audite sur un manifeste immutable. Gate 7B execute le
runner `scripts/e2e-commerce-core-gate7b.mjs` deux fois sur le meme SHA/release
avec Stripe Connect, 3DS, OTP Gmail et drain final. Les trois lecteurs Gate 5
restent actifs; depuis le 2026-08-02, l'UI publique et les mutations admin sont
ouvertes sur le sandbox en `v2_all/v2`, Stripe test uniquement.

## 12. Matrice d'impact rapide

| Changement | Lire | Zones a inspecter | Gates typiques |
| --- | --- | --- | --- |
| route/rendu/SEO | `NEXTJS_SEO.md` | `app`, `src/lib/seo`, ServerViews | SEO, routes, build, direct route |
| annonce/categorie | `ANNONCES_CATALOGUE.md` | AdminForm, products, snapshot Storage, catalogue Functions | galerie/categorie/produit/revalidation |
| menu/mobile | `INTERFACE_NAVIGATION.md` | layout, marketplace menu/header, CSS | menus + mobile contract |
| image | `IMAGES_MEDIA.md` | imageUtils, AdminForm, Storage/scripts | images dry-run + routes |
| Auth | `AUTHENTIFICATION.md` | authStore, AuthContext, modal, auth Functions | `test:auth` + smoke |
| securite/rules | `SECURITE_GLOBALE.md` | rules, helpers security, Functions | tests negatifs + sandbox cible |
| espace client | `ESPACE_CLIENT.md` | routes compte, MyOrders, wishlist | smoke compte |
| paiement/refund | `COMMERCE_SYNTHESE.md`, puis `COMMERCE_STRIPE.md` | commerce client/Functions/admin | Gates 0A a 8 fermees; `PREPROD_TRANSACTIONAL_READY` sandbox; checkout `v2_all` et mutations admin `v2` actifs pour tests, Stripe test uniquement, offline et live fermes |
| admin | `BACKOFFICE.md` | AdminAppIsland, tabs, Functions | smoke tabs + action cible |
| infra | `INFRASTRUCTURE.md` | yaml/json/env/runtime | audits read-only + build |
| donnees | `DONNEES_ANALYTICS.md` + `AUDIT_COUTS_FIRESTORE.md` | rules/indexes/scripts/Functions | dry-run/comptage/rollback + mesure avant/apres |

## 13. Dossiers generes ou non canoniques

Ne pas inclure dans une cartographie fonctionnelle ni modifier comme source:

```text
.next/
node_modules/
.pnpm-store/
logs/
test-results/
playwright-report/
.firebase/
dist/
```

Les dossiers de travail image/video (`imagediag`, `imageexport`, `imagehero`, `imageproduit`, `videohero`) sont des sources/outils locaux potentiels. Toute suppression demande inventaire des imports, comparaison avec `public`/`src/assets` et validation visuelle.
