# Cartographie du projet Seconde Vie Next

Derniere verification: 2026-08-17
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
|-- /admin ........................... Back-office dynamique, invisible avant claim admin
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
| `/admin` | `[C]` tunnel | DYN | noindex/nofollow | `app/admin/page.jsx` | `AdminAppIsland`; visiteur, anonyme ou client renvoye silencieusement vers `/` |
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
  -> PublicationBatchControl [C] (composition locale ordonnee, apercu meuble par meuble)
     -> uploads bornes a deux meubles puis confirmations catalogue bornees a trois
     -> commandes produit idempotentes distinctes, publication groupee sans ecriture client autoritaire
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
  -> chemins impactes revalides
  -> pointeur mutable Storage relu frais + preuve API exacte /api/catalog/version
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
  -> client: session publique, aucune entree admin visible
  -> admin: claim + registre actif + AAL2 Google ou passkey
     -> redirection post-connexion vers /admin
     -> lien Admin visible dans le header
  -> /admin direct sans claim admin -> retour silencieux vers /
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
  -> timeline admin bornee: creation/paiement + journal annulation/refund,
     inbox historiques par objectId provider borne et audit fail-closed
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

Gates 0A a 8 sont fermees en sandbox depuis le 2026-07-28. Apres la fermeture
du game day resilience du 2026-08-24, le controle transactionnel a ete rouvert
durablement par autorisation explicite le 2026-08-25: `v2_all/v2` revision 77,
policy `sandbox_transactional_policy_20260802`, Stripe test et paiement offline
`off`. Aucun `runId` ni minuteur de fenetre temporaire ne pilote cette ouverture.

Reference commande partagee:

```text
shared/orderReference.cjs
  -> format canonique C<orderNumber> pour UI, admin, e-mails et PDF
  -> miroir functions/src/shared/orderReference.cjs requis par le packaging Firebase
  -> fallback Référence indisponible, jamais l'orderId opaque
  -> parse recherche Incidents: C/c, numero nu, CMD-/cmd- legacy
  -> orderId technique conserve pour routes, jointures, Stripe et idempotence
```

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

scripts/reconcile-commerce-outbox-delivery.mjs
  -> rapprochement sandbox fail-closed d'un `delivery_unknown` observe dans
     Gmail; dry-run, confirmation exacte, audit et aucun renvoi
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

Extension Data evenementielle **producteur et lecteur UI actifs sur sandbox**:
`aggregateAnalyticsSessionGen2` -> `functions/src/analytics/realtime.js`
-> `analytics_realtime_control/current` + `analytics_realtime_ledgers/*`
+ `analytics_realtime_buckets/*` (backend-only)
-> `admin_analytics_realtime/recent|history` (deux resumes strong-admin)
-> `adminAnalyticsRealtime.js` / `adminAnalyticsRealtimeStore.js`
-> `AdminAnalytics` (une ecoute possedee par `AdminAppIsland`).
Flags explicites: `ANALYTICS_REALTIME_ENABLED` cote Functions et
`NEXT_PUBLIC_ADMIN_ANALYTICS_REALTIME` cote build. Sans flags, le rail deploye
ci-dessous est conserve. Le preparateur offline est
`scripts/prepare-analytics-realtime-seed.mjs`; les gates locales sont
`test:realtime-ops` et `test:realtime-emulator`.
P4 ajoute `scripts/inventory-analytics-realtime-sandbox.mjs` (snapshot borne,
export prive sans UID/parcours) et `scripts/bootstrap-analytics-realtime-sandbox.mjs`
(create-only, paused, verification puis shadow et rattrapage). P5 autorisee:
lecteur active dans `apphosting.yaml` BUILD/RUNTIME, `build-2026-09-03-002`
(`sv-mtm5ndde-e6ff894eb978`), recette Chrome temps reel qualifiee. Ancien build
`build-2026-09-03-001` exerce comme rollback. Mesures completes P5/P6 ouvertes.
`scripts/probe-analytics-realtime-sandbox.mjs` qualifie trois sources synthetiques,
leur reception automatique, rejeu et retrait admin; P4 validee sur la revision
`aggregateanalyticssessiongen2-00007-bas` (188 -> 191 -> 188, historique exact).

Diagnostic local du chargement: `src/kit/admin/adminAnalyticsPerformance.js`
relie la selection Data dans `AdminAppIsland` au cache, au chargement du module,
aux callables et a une opportunite de rendu dans `AdminAnalytics`. Maximum vingt
traces en memoire, aucune emission reseau ni ecriture Firestore. Le handler
`getAnalyticsAdminGen2` peut retourner `serverTimings` expurges (acces/lecture/audit).
`scripts/audit-interactive-runtime.mjs` complete ce diagnostic par les OPTIONS,
POST et demarrages Cloud Run en lecture seule; ce n'est pas une mesure Billing.
La transformation evenementielle reste suivie, sans cutover implicite, dans
[_DOCS/infra/TEMPS_REEL_COUTS_DEVOPS.md](_DOCS/infra/TEMPS_REEL_COUTS_DEVOPS.md).

```text
AnalyticsCollectorIsland + AuthProvider anonyme [C]
  -> AnalyticsProvider [C]
  -> heartbeat adaptatif + raisons init/route/visible/beacon [C]
  -> initLiveSession/syncSession/beacon + cache borne du hash de jeton [F]
  -> analytics_sessions/{sessionId} sans e-mail/IP/user-agent, journey recent borne a 25 et compteurs de raisons [DB]
  -> rollups quoteSessions + vues produit -> admin_dashboard/insights,
     devis 30 j/3 m/6 m/1 an et top cinq produits 30 j [F/DB]
  -> AdminDashboard: listener allowliste finance/orders/activity, puis insights et catalogue lazy [C/DB]
  -> aggregateAnalyticsSessionGen2 -> liveSessions.js -> admin_analytics_sessions
     + admin_analytics_session_details (carte expurgee et 25 etapes) [F/DB]
  -> AdminAnalytics + liveSessionsChannel: 10 cartes recentes, une page ancienne
     de 10 sur demande, un parcours ouvert; listeners admin forts [C/DB].
     Cache brut ignore; legacy callable conserve uniquement pour rollback.
     liveSessionPresence: expiration locale du signal a 150 s [C]
  -> admin_action_summary/current: badge Retours pousse par
     projectAdminActionSummaryGen2, sans scan de collection [F/DB]
  -> AdminIncidentConsole: recherche support CMD/provider/correlation/e-mail,
     timeline expurgee, attemptCount et audit fail-closed via callable AAL2 [C/F]
     -> vue Systeme: Log Router -> Pub/Sub -> projectSystemIncidentGen2,
        ledger de rejeu -> summary current avec 50 groupes bornes [EXT/F/DB]
        -> un listener partage badge/console, filtres locaux et lien Logs Explorer [C/DB]
     -> Error Reporting et alerte Monitoring directe sur les erreurs inattendues [EXT]
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
|-- instrumentation-client.js ....... coupure Performance avant transition vers une route sensible
|-- shared/orderReference.cjs ....... format/parse unique des references humaines C<orderNumber>
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
|-- PerformanceMonitoringIsland.jsx ... SDK Firebase Performance lazy sur allowlist vitrine
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
|   `-- OrdersPageIsland.jsx .......... shell Auth leger; MyOrdersView lazy apres connexion
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
|   |-- performanceRoutePolicy.js ..... allowlist pure des routes Performance non sensibles
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
|-- publicCatalogWishlist.js .......... enrichissement catalogue des favoris
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
|-- AdminDashboard.jsx ................ listener KPI a trois documents, fail-closed, historiques/insights/commandes recentes lazy
|-- adminDashboardProjection.js ....... validateurs purs snapshots finance/orders/activity/insights
|-- AdminQuotes.jsx ................... réception et suivi des demandes de restauration
|-- quoteAdminClient.js ............... cache court et callables protégées Devis
|-- AdminAnalytics.jsx ................ moteur Data canonique: UID pseudonyme, live, parcours bornes, courbes
|-- AdminIncidentConsole.jsx .......... console incidents, recherche, timeline et verdict de reprise
|-- SystemIncidentConsole.jsx ......... lignes Cloud dedupliquees et inspecteur a la demande
|-- AdminForm.jsx ..................... creation/edition annonces
|   |-- productPublicationClient.js ... nettoyage local de reprise obsolete + attente de la release publique exacte
|   |-- components/PublicationBatchControl.jsx .... mode lot, compteur et selecteur d'apercu ordonne
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
|-- AdminIPTracker.jsx ................ compatibilite historique, non montee
|-- AdminSEO.jsx ...................... outils SEO
|-- AdminNewsletter.jsx ............... abonnes/informations
|-- AdminPaymentSettings.jsx .......... Stripe Connect/carte
|-- AdminMaintenance.jsx .............. maintenance
|-- AdminAccount.jsx .................. profil admin et conteneur onboarding dedie
|-- BillingOnboardingGuide.jsx ........ guide Google Billing manuel, progression et placeholders captures
|-- BillingOnboardingOperator.jsx ..... validation/reinitialisation admin forte
|-- analyticsReliability.js ........... fiabilite/checkpoints
|-- exportCsv.js ...................... exports
|-- adminCommerceData.js .............. premiere page commandes/demandes/retours chargee par leurs onglets
|-- adminDataCache.js ................. cache memoire invalidable, sans repeuplement apres logout
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
    |-- admin/
    |   `-- dashboardProjection.js .... contrats purs finance/orders/activity et ordre Timestamp complet
    |-- auth/
    |   |-- grantAdmin.js
    |   |-- adminManagement.js
    |   |-- customerLoginOtp.js
    |   |-- guestCheckoutOtp.js
    |   `-- passkeys.js
    |-- admin/
    |   |-- financialHistoryDomain.js . normalisation legacy/v2 en centimes
    |   `-- financialHistoryProjection.js . jours/mois/années matérialisés
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
    |   |   |-- outboxRepository.js / outboxWorker.js ... lease, dead-letter immediat si non reprenable et delivery_unknown
    |   |   |-- financialProjection.js .. projection financiere absolue
    |   |   |-- financialRollup.js ....... deltas total/jour atomiques et idempotents
    |   |   |-- commerceDocuments.js ..... recus sandbox non fiscaux
    |   |   |-- commerceDocumentArtifact.js  PDF Node deterministe + Storage prive
    |   |   |-- commerceDocumentStorage.js .. resolver bucket Gen2 partage callable/outbox via config ou ADC
    |   |   |-- operationsHealth.js ...... incidents, failed/dead-letter et sante Gate 7A
    |   |   |-- fixtureScope.js / fixtureCleanup.js ... autorisation et cleanup run-scoped
    |   |   |-- checkoutAccessToken*.js ... token backend opaque rotatif
    |   |   |-- guestCheckoutCoordinator.js
    |   |   |-- boundedWorkerSweeper.js / firestoreWorkerQueries.js
    |   |   |-- reservationExpiryWorker.js
    |   |   |-- allowedActions.js ......... actions client/admin derivees serveur, aucune apres archive
    |   |   |-- returnCase.js ............. retours/dispositions quantitatifs Gate 4
    |   |   |-- orderCommandRepository.js . fulfillment/archive idempotents + audit
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
    |   |-- v2Operations.js ................ reconciliation finance/orders nocturne + watchdog inbox cible
    |   |-- v2OrderQueries.js .............. lecteurs UID/admin exportes et actifs
    |   |-- v2DocumentDelivery.js .......... acces PDF proprietaire + outbox bornee
    |   |-- v2RefundCommands.js ............ callable refund active sous controle v2
    |   |-- v2ReturnCommands.js ............ callables retours actives sous controle v2
    |   |-- v2CustomerReturnRequests.js .... demande client + decisions admin vers refund/retour existants
    |   |-- v2Webhooks.js ................ webhooks paiement/Connect Gen2 seuls apres G12-B
    |   |-- commerceEventDispatch.js ...... outbox/réservations vers Cloud Tasks à l'échéance
    |   |-- stripeConnect.js
    |   |-- orderStatus.js
    |   |-- orderStats.js ................. projection orders legacy/v2 et ledger unique idempotent avec tombstones
    |   `-- legacyContainment.js .......... barriere de compatibilite sans export legacy
    |-- email/
    |   |-- emailDesignSystem.js .......... shell HTML/texte systeme epure partage
    |   |-- commerceEmailTemplates.js ..... paiement, fulfillment, refund et document v2
    |   |-- otpEmailTemplates.js .......... OTP connexion/checkout unifies
    |   |-- legacyOrderEmailDelivery.js ... claim/lease e-mail legacy backend-only
    |   |-- transactionalEmail.js ......... Gmail/Resend + PDF memoire borne
    |   |-- transactionalEmailRuntime.js
    |   `-- orderEmails.js
    |-- invoicing/
    |   |-- manualInvoiceDomain.js .... validation, montants entiers, hash et numerotation
    |   |-- manualInvoicePdf.js ....... rendu PDF deterministe facture/brouillon
    |   |-- manualInvoiceEmailTemplate.js . rendu e-mail facture partage et testable
    |   `-- manualInvoices.js ......... callables admin, persistance privee et envoi e-mail
    |-- quotes/
    |   |-- quoteRequestDomain.js ..... validation, statuts et estimation autoritaire
    |   |-- quoteEmailTemplates.js .... accusé de réception client
    |   `-- quoteRequests.js .......... dépôt public, photos privées et commandes admin
    |-- newsletter/
    |   |-- newsletterRewardDomain.js . validation, tirage et codes serveur
    |   |-- newsletterRewardEmail.js .. confirmation du gain client
    |   |-- newsletterRewards.js ...... callables jeu, abonnement et espace client
    |   |-- newsletterProjectionDomain.js . delta présence idempotent
    |   `-- newsletterProjection.js ... compteur global + ledger sans PII
    |-- analytics/
    |   |-- constants.js
    |   |-- sessionAuthorizationCache.js ... cache borne/TTL du hash de jeton
    |   |-- sessions.js ................. collecte pseudonymisee, parcours borne et suppression ciblee Gen2
    |   |-- sessionMaintenance.js ....... contrat G11 dry-run/precondition/audit/reprise ciblee
    |   |-- updateUserSessions.js
    |   |-- adminIP.js
    |   `-- rollups.js .................. agregats jour/mois/annee, HLL, insights 30 j sur digest et archive Storage
    |-- observability/
    |   |-- incidentProjection.js ......... table code/severite/categorie + deltas resume fail-closed
    |   |-- businessEvents.js ........... journal transitions + projections finance/incidents asynchrones
    |   |-- diagnosticTimeline.js ....... recherche admin AAL2, timeline expurgee et audit
    |   |-- systemIncidents.js .......... lecteur Cloud Logging legacy conserve hors chemin UI
    |   `-- systemIncidentProjection.js . projection Pub/Sub runtime idempotente et expurgee
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
        |-- catalogRevalidation.js ..... task HMAC, supersession monotone et backoff durable
        |-- catalogReconciler.js ....... reprise idempotente des publications bloquees
        |-- catalogMaintenance.js ...... statut, rollback valide et reconstruction admin
        |-- mediaGarbageCollection.js .. quarantaine media 90 jours + GC quotidien
        `-- publicProjection.js ........ projection publique canonique
```

## 9. Exports Cloud Functions

Etat courant au 2026-09-03: `functions/index.js` contient 161 exports uniques
locaux; 158 Functions sont deployees dans le sandbox (3 Gen1, 155 Gen2).
Les trois seules Gen1 sont les triggers Auth
`grantAdminOnAuth`, `onRegisteredUserCreated` et `onRegisteredUserDeleted`.
Toutes les autres cibles cloud conservees sont Gen2 `ACTIVE`; les quatre
owners Scheduler commerce sont `ENABLED` et les endpoints Stripe test pointent
uniquement vers les owners Gen2. L'ecart exact est 156 noms communs, cinq
exports uniquement locaux (les cinq Instagram legacy) et deux webhooks v2 uniquement
cloud (`stripeWebhookV2Gen2`, `stripeConnectWebhookV2Gen2`) avec source et
entree de deploiement dediees. `commerceWebhookCoverageWatchdogGen2` est
desormais deploye et `ENABLED` toutes les quinze minutes. Les cinq legacy
Instagram restent explicitement hors deploy global.

Les dix retraits maintenance, les six G3 et les neuf cohortes restantes ont
ete supprimes individuellement apres appelants, trafic, quiet-windows et
archives de rollback digestees. Les fenetres G12 ont expire et ces archives ne
constituent plus des rollbacks autonomes. Leurs manifests sont indexes par
`apphostingaudit/manifests/functions-gen2-g12a-remaining.json`; le nettoyage
source est prouve par `functions-gen2-g12b-remaining.json`. Aucun IAM partage,
secret, donnee ou trigger Auth n'a ete retire.

G13 conserve un seul tuning cible du statut catalogue. F5 a exerce le rollback
max 1 en `getcatalogpublicationstatusgen2-00003-mol`, puis la reactivation max
2 en revision finale `getcatalogpublicationstatusgen2-00004-hiv`, avec deux
sources immuables digestees et sous hold. Le wrapper local refuse toute autre
revision/generation/digest; le soak final en cours reste dans
`apphostingaudit/FINALISATION_MIGRATION_GEN2.md`. App Hosting a recu le rollout
Stats du 2026-09-01; `build-2026-08-25-002` est son rollback precedent. L'ADR canonique est
`_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md`.

Le collecteur read-only `scripts/functions-gen2-final-observe.mjs`, expose par
`npm run functions:gen2:final-observe`, verifie a chaque checkpoint la revision
finale, les 137 Functions, le trafic Cloud Run, les deux holds Storage et les
429/5xx/erreurs Gen2 et Auth Gen1 depuis l'origine F6 sans recopier les
messages sensibles.

Le verrou local `scripts/functions-gen2-final-closeout.mjs`, expose par
`npm run functions:gen2:final-closeout`, recoupe les manifestes F1 a F7, la
gate CI et les references Markdown. Ses modes `preflight`, `ready` et `closed`
empechent respectivement une preuve incomplete, une fermeture avant 604800 s
et la conservation du plan ou de references mortes apres F9.

G1 est `TERMINEE_G2_A_LOCAL_ONLY`: protections Firestore, backup,
restore reconcilie et deux canaux Monitoring testes sont actifs. Le reconciler Gen1 est en version
12 sur une identite runtime dediee minimale verifiee.
Le chemin Firebase CLI reste bloque avant mise a jour; le wrapper porte un
fallback gcloud Gen1 fail-closed limite au seul reconciler, sans cle de service
et avec toute la configuration cloud explicite. La version 12 est active sur le
compte dedie; son run manuel prouve `stop`, schema 3, un incident primaire et
aucune troncature. Le resolver borne ferme uniquement l'incident avec un audit
append-only et interdit toute mutation commande/refund/faits/stock.
La resolution autorisee a applique deux ecritures et le run suivant prouve
`healthy`, zero incident primaire et aucune troncature. Les trois workers G1-E
sont actifs sur leurs comptes dedies, avec roles projet et secrets
resource-level exacts, sans cle. Le dispatcher reservations a prouve sur Stripe
test une annulation fournisseur avant liberation unique, stock fixture
10 -> 9 -> 10, puis un second run sans effet; aucun refund, replay, restock ou
delete. Le manifeste est
`apphostingaudit/manifests/functions-gen2-g1-worker-rollout.json`.
Le script `scripts/configure-functions-gen2-g1-monitoring.mjs` maintient les
cinq metriques, huit policies et deux canaux G1. Les deux alertes commerce
lisent uniquement les payloads applicatifs et excluent les logs `Violation*`;
elles sont limitees a une notification par heure afin qu'une notification
Monitoring ne puisse plus recreer son propre signal. Le contrat local dashboard
abaisse cet anti-repetition a cinq minutes; il n'est pas applique au cloud sans
gate de monitoring explicitement autorisee.
Les plans read-only P1/P2 sont dans
`apphostingaudit/manifests/functions-gen2-g1-data-plan.json`. G2-A local est
fermee pour les treize Gen2; son runtime/IAM/retry/data/rollback consolide est
dans `apphostingaudit/manifests/functions-gen2-g2a-plan.json`. Le premier lot
G2-B stats a seed 26 `order_stats_projections` sans toucher aux agregats puis
deploie uniquement `onOrderStatsWrite`; preuves IAM/data/rollout dans les
manifestes `functions-gen2-g2b-stats-*.json`. Sa quiet-window est fermee avec
zero drift; TTL e-mail et IAM/data de chaque lot restent des gates distinctes,
avec preflight et une seule cible a la fois.
Le lot G2-B2 catalogue remplace localement la cle `event.id` du ledger par la
cle semantique document + `updateTime`, puis deploie seulement
`onCatalogSourceWrite`; preuves dans `functions-gen2-g2b-catalog-*.json` et
quiet-window fermee sans drift.
Le lot G2-B3 de `catalogReconciler` epingle `catalog-builder` comme
runtime car la reprise peut reecrire un pointeur Storage; `catalog-enqueuer`
reste uniquement l'identite OIDC du job cinq minutes. Les conflits de
`stateVersion` sont repris trois fois au maximum dans la Function, tandis que
Scheduler conserve zero retry. La revision `catalogreconciler-00010-dob` est
fermee apres deux executions naturelles `healthy` et zero drift.
Le preflight G2-B4 rend `catalogMediaGarbageCollector` fail-closed: un seul
kill-switch couvre medias et releases et reste `false` sur le sandbox. La
mesure read-only retrouve zero candidat media/release; aucune suppression
n'appartient au rollout de configuration. La revision
`catalogmediagarbagecollector-00010-zen` est fermee apres une execution
manuelle `dry_run`, zero ecriture et zero suppression.
Le preflight G2-B5 de `onArtifactUpdated` borne les ecritures au seul ledger
`sys_catalog_media_gc`, utilise le runtime sans cle `catalog-media-enqueuer`
et le transport Eventarc partage. Les 672 intents restent en grace et zero est
eligible; aucun stockage ne peut etre supprime par ce trigger.
La revision `onartifactupdated-00024-cuj` est active; la probe valide hors
namespace retourne 204 et laisse les 672 intents inchanges. La quiet-window de
330 secondes est fermee sans erreur ni drift.
Le preflight de `onArtifactDeleted` a retrouve en cloud l'ancien effacement de
sous-collections sociales sans appelant, rule ou donnee sandbox. Cette archive est
conservee uniquement comme preuve; le rollback pointe vers un bundle sur qui
restaure seulement les limites d'infrastructure. Le futur rollout n'ecrit que
la quarantaine media et ne supprime aucune donnee sociale ni objet Storage.
La revision `onartifactdeleted-00024-roh` active desormais cette source sure;
la probe hors namespace retourne 204 et la quiet-window de 377 secondes se
ferme avec le ledger 672/672 `pending`, sans suppression ni drift.
Le preflight du worker `processProductPublicationImage` trouve zero session et
zero erreur. Son replay d'une image deja prete conserve maintenant le slot si
la seule finalisation metier echoue; le reconciler reprend cette finalisation.
Runtime, build et Eventarc `us-central1` sont dedies avant rollout cible.
La revision `processproductpublicationimage-00004-nep` est active; sa probe
non canonique retourne 204 et la quiet-window de 686 secondes conserve zero
session, zero ecriture ou suppression et aucun drift.
Le scheduler `cleanupProductPublicationSessions` est actif en revision
`00003-hig` avec runtime/build dedies, concurrence/max 1 et retry zero. Le job
quotidien utilise le meme compte dedie en OIDC. Sa probe Scheduler est lancee
uniquement apres un comptage nul et retourne 200 sans ecriture, suppression ou
drift apres 321 secondes; le rollback exact de la revision 2 reste sous
temporary hold.
Le scheduler `reconcileProductPublicationSessions` est actif en revision
`00004-pip` avec runtime/build dedies, concurrence/max 1 et OIDC dedie. Le
marquage `attention_required` relit l'etat courant en transaction. Sa probe
Scheduler retourne 200 et la quiet-window de 327 secondes conserve zero
session, ecriture, warning, erreur ou drift; la revision 3 reste sous hold.
Le lot G2-B10 e-mail active `onOrderCreated` en revision
`onordercreated-00029-zul`: Firestore create `orders/{orderId}`, retry actif,
runtime `legacy-order-email-worker`, builder/Eventarc dedies, concurrence/max
1 et TTL `purgeAt` ACTIVE sur `legacy_order_email_deliveries`. La quiet-window
passive ferme 314 secondes avec zero ledger et zero e-mail. Le rollback restaure
la revision 28, son runtime/trigger compute, concurrence 80/max 20/retry off,
sans retirer secrets, IAM ou TTL.
Le lot G2-B11 applique la meme isolation a `onOrderUpdated` en revision
`onorderupdated-00029-moj`, avec le filtre Firestore update exact, retry actif
et quiet-window passive de 307 secondes sans ledger ni e-mail. Le rollback
revision 28 conserve TTL, secrets et IAM.
Le lot G2-B12 active `dispatchCatalogBuild` en revision
`dispatchcatalogbuild-00013-rij`: queue Cloud Tasks privee inchangée,
runtime/build dedies, 512 MiB, timeout/deadline 300 s, concurrence/max 1. La
quiet-window de 316 secondes conserve queue vide et controle catalogue
295/295/295 valide, sans lease ni ecriture. Le rollback revision 12 ne modifie
ni queue, IAM, endpoint ou pointeurs.
Le lot G2-B13 active `dispatchCatalogRevalidation` en revision
`dispatchcatalogrevalidation-00012-zer`, HMAC v3, timeout/deadline 300 s et
concurrence/max 1. La quiet-window de 320 secondes conserve queue vide et
controle 295/295/295 valide/observe, sans appel signe ni ecriture. Les 13/13
Gen2 initiales sont stabilisees; le manifeste de cloture G2-B porte la reprise
G3 sans retrait cloud automatique.

G3 classe `e2eCheckoutProof`, `e2eStripeHardeningProof` et les quatre callables
historiques de `productPublicationClient` en `RETIRE_G12_A`. L'admin executable
utilise `createPublishedProductAdmin`, aucune session historique ne subsiste et
les deux commandes package Stripe sont fail-closed. Les sources, endpoints,
IAM et secrets restent conserves jusqu'a G12; G4 analytics est la reprise.

G4-A1 ajoute le registre `src/kit/config/functionTargets.js` et l'export
parallele `trackAdminIPGen2`. Seul le nom logique `trackAdminIP` pointe
desormais sur cette Gen2; les sept autres noms restent Gen1. Son handler met a
jour `sys_metadata/admin_ips` en transaction sur le runtime dedie
`analytics-runtime`, CPU Gen1/concurrence 1. App Hosting sert le build
`build-2026-08-16-001`; la Gen1 et le build precedent restent preserves pour
rollback pendant la quiet-window jusqu'au 2026-08-18T19:16:52Z. Les trois
callables de suppression analytics restent sous hold G11 et aucun autre target
cloud n'etait autorise avant fermeture de l'observation. L'utilisateur a leve
la borne temporelle et G4-A1 est fermee par deux appels admin Gen2 reussis,
zero erreur, mise a jour idempotente et zero trafic Gen1; la compatibilite
ancien onglet est remplacee par la preuve que la Gen1 ACTIVE, son endpoint,
son IAM et son code sont preserves.

Etat source courant du 2026-08-24: cette collecte IP historique est desactivee.
`AdminIPTracker` n'est plus monte, l'onglet `ip_manager` est retire et
`trackAdminIPGen2` repond en no-op sans lecture ni ecriture. Les nouvelles
sessions ne lisent plus l'IP et ne stockent plus `ipMeta`.

G4-A2 est fermee: `updateUserSessionsGen2` partage
le handler de la Gen1, utilise `analytics-runtime`, CPU Gen1, concurrence 1,
min 0/max 1 et App Check. Le registre client cible maintenant
`updateUserSessionsGen2`; la revision `updateusersessionsgen2-00001-zoq`, les
limites, IAM et refus App Check sont conformes. L'inventaire est donc de 159
exports locaux pour 154 Functions cloud, 139 Gen1 et 15 Gen2. La Gen1 et son
endpoint restent preserves; le rollback client revient au build App Hosting
READY `build-2026-08-16-001`. Le rollout `g4-a2-cutover-20260817-002` sert
`build-2026-08-17-001`. La comparaison Gen1/Gen2 a prouve HTTP 200,
Auth/App Check valides, donnees conformes, ancien onglet admin sain et zero
nouvel appel Gen1 apres cutover. La prochaine cible unique est
`initLiveSessionGen2`.
G4-A3 est fermee: `initLiveSessionGen2` partage le handler Gen1, porte App
Check, `analytics-runtime`, CPU Gen1, concurrence/max 1 et aucun secret. La
revision `initlivesessiongen2-00001-hoh` est ACTIVE et App Hosting sert
`build-2026-08-17-002`. Les appels Gen1/Gen2 et les donnees sont conformes,
zero appel Gen1 suit le cutover final. Le reload pilote observe a ete reproduit
sur Gen1 et n'est pas une regression Gen2. La Gen1 et
`build-2026-08-17-001` restent le rollback; prochaine cible unique:
`syncSessionGen2`.
G4-A4 a deploye `syncSessionGen2` sous un nouveau nom avec le meme handler que
la Gen1, App Check, `analytics-runtime`, CPU Gen1 et concurrence/max 1. La
revision `syncsessiongen2-00001-zeg`, IAM et refus App Check sont conformes;
le registre source est prepare sur la Gen2 pour le cutover reversible. La Gen1
reste intacte.
Le cutover App Hosting G4-A4 n'est pas effectif: `build-2026-08-17-003` a ete
cree READY et son rollout a reussi via un upload Google Storage reprenable,
mais la session Chrome historique s'est fermee avant la preuve ancien onglet.
Le rollback `g4-a4-rollback-20260817-001` sert de nouveau
`build-2026-08-17-002`; le bundle effectif conserve `syncSession` Gen1 et la
cible Gen2 ACTIVE reste inutilisee et reversible.
La requalification suivante a ferme G4-A4: ancien onglet `002` sain apres
cutover, nouvel onglet `003` sain, six appels `syncSessionGen2` reussis, zero
erreur et zero trafic Gen1 apres l'appel final de fermeture. App Hosting sert
`build-2026-08-17-003`; rollback exact `002`. Prochaine cible unique:
`syncSessionBeaconGen2`.
G4-A5 prepare `syncSessionBeaconGen2` avec le meme handler HTTP que la Gen1,
origine exacte, jeton opaque, corps 64 KiB et content-types JSON/text. Le
runtime Gen2 utilise CPU Gen1, concurrence/max 1 et `analytics-runtime`; la
Gen1 et le registre restent intacts avant preuve cloud.
La revision `syncsessionbeacongen2-00001-dih` est ACTIVE avec runtime/IAM
conformes et refus origine/jeton en 403. Le vrai transport Gen1 reproduit le
415 `text/plain` deja documente; le registre source est prepare sur la Gen2
pour le cutover correctif et la preuve 200.
Le cutover via `build-2026-08-17-004` a ete immediatement annule: ancien et
nouvel onglets rendaient, mais le beacon navigateur Gen2 a retourne 403 et la
session est restee active. Le rollback `g4a5-rollback-20260817t2004` sert de
nouveau `build-2026-08-17-003`, `/` et `/admin` repondent 200, et le registre
client pointe de nouveau sur `syncSessionBeacon` Gen1. La Gen2 reste ACTIVE,
sans retrait ni changement IAM/donnee; G4-A5 est bloquee jusqu'au diagnostic
borne origine/jeton.
La cause a ensuite ete fermee par `SITE_URL` explicite sur la seule Function
Gen2. La revision `syncsessionbeacongen2-00002-vec` accepte l'origine sandbox
et refuse toujours l'origine etrangere. Le retry build `004` est ferme: ancien
et nouvel onglets sains, beacon 200, session fermee `beforeunload`, zero erreur
Gen2 et zero nouvel appel Gen1. G4 est fermee; rollback exact build `003`,
prochaine cible unique `getUserStatsGen2` en G5.
G5-A1 a ferme `getUserStatsGen2` sous nouveau nom avec le handler Gen1,
App Check et admin actif AAL2 identiques. Le runtime `auth-reader-runtime`
utilise Auth viewer et Firestore sans droit Auth admin; concurrence/max 1,
min 0, 512 MiB et 300 s. La revision `getuserstatsgen2-00001-niv` est ACTIVE;
les comptes runtime/build, les quatre roles bornes, l'absence de cle et le
refus 401 sans Auth/App Check sont conformes. Le rollout
`g5-a1-cutover-20260818-001` sert `build-2026-08-17-005`: ancien onglet `004`
sain, compteur admin 34, Gen2 HTTP 200, donnees inchangees, zero erreur et zero
nouvel appel Gen1. Le rollback exact est `build-2026-08-17-004`; aucune Gen1,
IAM ou donnee ne doit etre retiree. Le harnais admin sandbox cree Custom Token
et App Check en memoire et injecte App Check sur Auth et Functions sans
persister de jeton. La prochaine cible unique G5 est
`logUserConnectionGen2`.
G5-A2 a ferme `logUserConnectionGen2` sous nouveau nom avec le handler Gen1,
App Check, CPU 167m, 256 MiB, 60 s, concurrence/max 1 et le runtime minimal
`auth-session-runtime`. La revision `loguserconnectiongen2-00001-fab` est
ACTIVE. Le rollout `g5-a2-cutover-20260818-001` sert
`build-2026-08-18-001`: ancien onglet `005` sain, `/` et `/admin` en 200,
appel Gen2 200, ecriture `lastLoginAt` observee, zero erreur Gen2 et zero
nouvel appel Gen1. Rollback exact `build-2026-08-17-005`; aucune Gen1, IAM ou
donnee retiree. Prochaine cible unique `ensureAdminAccessRegistryGen2`.
Inventaire: 164 local, 159 cloud, 139 Gen1, 20 Gen2, 8 schedulers, 2 queues et
7 Eventarc.
G5-A3 a ferme `ensureAdminAccessRegistryGen2` avec le handler Gen1, App Check,
CPU 167m, 256 MiB, 60 s, concurrence/max 1, runtime
`auth-registry-runtime` et secret `SUPER_ADMIN_EMAIL:3`. La revision
`ensureadminaccessregistrygen2-00001-lak` est ACTIVE. Le rollout
`g5-a3-cutover-20260818-001` sert `build-2026-08-18-002`: ancien onglet `001`
sain, routes 200, appel Gen2 200 avec `migrated:false`, registre inchange, zero
erreur Gen2 et zero nouvel appel Gen1. Rollback exact
`build-2026-08-18-001`; aucune Gen1, IAM, secret ou donnee retiree. Prochaine
cible unique `sendGuestCheckoutOtpGen2`. Inventaire: 165 local, 160 cloud,
139 Gen1, 21 Gen2, 8 schedulers, 2 queues et 7 Eventarc.
G5-A4 a ferme `sendGuestCheckoutOtpGen2` avec le handler Gen1, App Check,
CPU 167m, 256 MiB, 60 s, concurrence/max 1, runtime
`auth-otp-email-runtime`, Gmail et les quatre versions de secrets epinglees.
La revision `sendguestcheckoutotpgen2-00001-neh` est ACTIVE. Le rollout
`g5-a4-cutover-20260818-001` sert `build-2026-08-18-003`: ancien onglet `002`
authentifie et rendu, routes 200, compteur admin 34, un seul envoi OTP sandbox
HTTP 200 sans lecture du code, zero erreur Gen2 et zero nouvel appel Gen1.
Rollback exact `build-2026-08-18-002`; aucune Gen1, IAM, secret ou donnee
retiree. Prochaine cible unique `verifyGuestCheckoutOtpGen2`. Inventaire:
166 local, 161 cloud, 139 Gen1, 22 Gen2, 8 schedulers, 2 queues et 7 Eventarc.
G5-A5 a ferme `verifyGuestCheckoutOtpGen2` avec le handler Gen1, App Check,
CPU 167m, 256 MiB, 60 s, concurrence/max 1, runtime
`auth-otp-verify-runtime` et `OTP_HMAC_SECRET:1`. La revision
`verifyguestcheckoutotpgen2-00001-wim` est ACTIVE. Le build
`build-2026-08-18-004` est servi apres cutover, rollback reel vers `003` et
reactivation finale: ancien onglet `003` authentifie, routes 200, compteur 34,
verification OTP HTTP 200 par transport RSA-OAEP process-local, zero erreur
Gen2, zero appel Gen1 et donnees stables. Aucune Gen1, IAM, secret ou donnee
n'est retiree.
G5-A6 `sendCustomerLoginOtpGen2` est fermee en revision
`sendcustomerloginotpgen2-00002-kod`, avec runtime et builder conformes, refus
401 puis envoi sandbox 200 sans lecture de l'OTP. App Hosting sert
`build-2026-08-18-005` apres cutover, rollback reel `004` et reactivation;
une session admin ouverte sous `004` est restee authentifiee apres le retour
sur `005`, sans nouvel appel Gen1 ni mutation de la donnee OTP.
Inventaire apres G5-A12-A14: 176 local, 171 cloud, 139 Gen1, 32 Gen2,
8 schedulers, 2 queues et
7 Eventarc. G5-A7-A9 ferment `verifyCustomerLoginOtpGen2`,
`generatePasskeyAuthenticationOptionsGen2` et
`verifyPasskeyAuthenticationGen2` sous le runtime borne `auth-login-runtime`.
Les trois deploys Functions ont ete allowlistes individuellement; le build
App Hosting `006`, l'ancien onglet `005`, le cutover, le rollback et la
quiet-window ont ete mutualises une seule fois. G5-A10-A11 ferment ensuite
`generatePasskeyRegistrationOptionsGen2` et `verifyPasskeyRegistrationGen2`
avec le runtime minimal `auth-passkey-runtime`. Les deux deploys sont
allowlistes individuellement; App Hosting sert `build-2026-08-19-001` apres
rollback reel `006`, reactivation et quiet-window sans erreur ni appel Gen1.
G5-A12-A14 ferment enfin `syncSuperAdminClaimGen2`, `addAdminUserGen2` et
`removeAdminUserGen2` sous le runtime minimal `auth-admin-runtime`: Firestore,
Firebase Auth admin, logs, service usage et le seul secret
`SUPER_ADMIN_EMAIL:3`. Les trois deploys ont ete allowlistes individuellement;
le harnais sans navigateur a prouve refus App Check 401, refus non-owner 403,
sync owner, promotion puis revocation avec refresh tokens revoques et fixture
jetable restauree. App Hosting sert `build-2026-08-19-002` apres rollback reel
`001`, reactivation et quiet-window de 313 secondes a zero erreur Gen2 et zero
appel Gen1. Les trois Gen1 et les trois triggers Auth limites restent intacts.
  La migration est fermee; l'architecture executable et les conditions de
  reprise ciblee sont dans `_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md`.
  L'ancien prompt de migration ne doit plus etre utilise.

Inventaire apres les deploys Functions G9: 275 exports locaux, 270 cloud,
139 Gen1 et 131 Gen2. Les 24 nouvelles cibles sont ACTIVE et toutes les Gen1
restent intactes. App Hosting sert `build-2026-08-22-001`, rollback exact vers
`build-2026-08-19-005` et reactivation prouves. G9 est fermee; G10 n'est pas
ouvert.

| Domaine | Exports |
| --- | --- |
| commerce | `createOrder`, `stripeWebhook`, `stripeConnectWebhook`, `cancelOrderClient`, `getOrderStatusClient` |
| commerce v2 checkout/lecture | `createCheckoutV2`, `resumeCheckoutV2`, `listMyOrdersV2`, `prepareCommerceDocumentDelivery`, `requestCustomerReturn`, `listOrdersAdminV2`, `getOrderTimelineAdminV2`, `listReturnsAdminV2`, `listCustomerReturnRequestsAdminV2` |
| codes promotionnels | `previewPromotionCodeV2`, `listPromotionCodesAdmin`, `createPromotionCodeAdmin`, `setPromotionCodeStatusAdmin` |
| liens de paiement admin | `createAdminPaymentLink`, `listAdminPaymentLinks`, `extendAdminPaymentLink`, `regenerateAdminPaymentLink`, `recreateAdminPaymentLink`, `cancelAdminPaymentLink`, `getAdminPaymentLinkPublic`, `prepareAdminPaymentLinkPayment`, `resumeAdminPaymentLinkPayment`, `expireAdminPaymentLinks` |
| commerce v2 retours client | `decideCustomerReturnRequestAdmin`, puis commandes refund/retour v2 existantes selon le parcours choisi |
| commerce v2 operations | `commerceOutboxDispatcher`, `commerceOperationsReconciler` (03:17 UTC), `commerceWebhookCoverageWatchdog` (15 min), `commerceReservationExpiryDispatcher`, `getCommerceOperationsStatusAdmin`, `rebuildCommerceOperationsAdmin`, `cleanupFixtureRunAdmin` |
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
| analytics | `initLiveSession`, `syncSession`, `syncSessionBeacon`, `deleteSessionGen2`, `trackAdminIP`, `updateUserSessions`, `onOrderStatsWrite`; les Gen1 `deleteSession`, `clearAllSessions` et `clearAllAffiliateClicks` ont ete retirees du cloud en G12-A puis de la source en G12-B |
| maintenance | les sept Gen1 resets/purges, `runGarbageCollector` et `getUploadUrl` ont ete retires du cloud en G12-A puis de la source en G12-B; aucun IAM ou secret dedie n'existait, les identites partagees sont preservees |
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
|-- legacy_order_email_deliveries/{sha256(orderId,type)} . claim e-mail legacy, TTL 90 j planifie G2-B
|-- commerce_webhook_inbox/{eventId}
|-- commerce_incidents/{incidentId}
|-- admin_incident_summary/current .... resume badge expurge, lecture admin forte exacte
|-- admin_incident_projections/{incidentId} . ledger backend-only avec tombstones
|-- admin_action_summary/current ..... retours pending_review, resume global sans PII
|-- admin_action_projections/{hash} .. ledger backend-only du badge Retours
|-- admin_dashboard/finance ........... projection EUR absolue expurgee
|-- admin_dashboard/orders ............ partition orders legacy/v2 expurgee
|-- admin_dashboard/activity .......... revisions independantes Auth/catalogue
|-- admin_dashboard/insights .......... devis 30 j/3 m/6 m/1 an + top cinq produits 30 j, sans donnees personnelles
|-- analytics_session_exclusions/{sessionId} . tombstone admin temporaire backend-only, TTL 7 j
|-- admin_user_stats_projections/{uid}  ledger Auth backend-only avec tombstones
|-- admin_finance_capture_projections/{factId} . ledger de capture backend-only
|-- admin_newsletter_summary/current . compteur global sans PII
|-- admin_newsletter_subscriber_projections/{subscriberId} . ledger/tombstone backend-only
|-- admin_finance_history_days/{date} . historique legacy + v2 matérialisé
|-- admin_finance_history_months/{month} . agrégat mensuel au clic
|-- admin_finance_history_years/{year} . agrégat annuel borné pour Max
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
|-- sys_catalog_publication/secondevie  mode, lease, revisions et backoff revalidation
|-- sys_catalog_publication_events/{eventHash}
|   `-- deduplication/outbox catalogue
|-- sys_catalog_publication_builds/{buildId}
|   `-- journal borne des builds catalogue
|-- sys_catalog_media_gc/{id} ......... quarantaine media
|-- analytics_sessions/{sessionId} .... session minimisee + `journey` recent max 25, expiration cible 90 j
|-- analytics_session_facts/{sessionId} fait d'idempotence du rollup, TTL 120 j
|-- analytics_rollup_days/{day} ........ total permanent + shards quotidiens temporaires
|-- analytics_rollup_months/{month} .... agregat permanent compact
|-- analytics_rollup_years/{year} ...... agregat permanent compact pour l'historique complet
|-- business_events/{eventId} ......... journal metier minimal append-only, backend-only
|-- sys_counters/orders ............... prochain numero humain de commande, transactionnel
|-- sales_stats_daily/{id}
|-- order_stats_projections/{orderId} . ledger backend-only, retention de la commande
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
|-- bucket prive analytics archive .... JSONL gzip pseudonymise, Coldline 30 j, suppression 730 j
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
read-latest-auth-otp.mjs .............. outil local sensible
audit-refund-failed-v2.mjs ............ gate non mutante M12/M13, zero evenement injecte
```

### Donnees/images

```text
backfill-product-image-*.cjs
backfill-analytics-session-facts-sandbox.cjs  rejeu borne et idempotent des faits analytics
bootstrap-financial-history-sandbox.cjs ..... jours/mois/annees admin materialises
bootstrap-newsletter-summary-sandbox.cjs .... compteur newsletter sans PII
configure-dashboard-event-invokers.mjs ...... invoker Eventarc ressource par ressource
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
tests/observability-contract.test.cjs .... correlation, minimisation et frontiere serveur
tests/admin-dashboard-projections.test.cjs . projecteurs, reader critique, incidents, watchdog et reconciliation
tests/admin-data-cache-contract.test.mjs ... purge session et invalidation des lectures en vol
tests/system-incidents.test.cjs .......... groupes, redaction, bornes et audit Cloud Logging
tests/performance-route-policy.test.mjs . allowlist Performance et coupure avant route privee
scripts/configure-analytics-aggregate-trigger-iam.mjs . preflight/apply IAM borne du transport Eventarc de l'agregateur analytics
tests/billing-onboarding-contract.test.cjs
tests/smoke.spec.mjs
tests/catalog/*.test.cjs
tests/catalog/emulator/*.test.cjs
tests/commerce/runner/*.cjs
tests/commerce/suites/*.cjs
tests/commerce/suites/resilience-emulator.cjs ... Gate D3 locale: concurrence, doublons, desordre, troncature, cleanup runId
tests/commerce/domain/*.test.cjs .......... unitaire + contrats UI/migration Gates 5/6
tests/commerce/browser/*.spec.mjs ......... reprise/revisions multi-onglet locale
tests/commerce/faults/*.test.cjs
tests/commerce/resilience/*.test.cjs ...... Gate D2: frontieres checkout, workers/outbox et console Incidents
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
restent actifs. Le sandbox est ouvert durablement en `v2_all/v2` depuis le
2026-08-25, Stripe test uniquement; le paiement offline et tout rail live
restent fermes.

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
| paiement/refund | `COMMERCE_SYNTHESE.md`, puis `COMMERCE_STRIPE.md` | commerce client/Functions/admin | Gates 0A a 8 fermees; `PREPROD_TRANSACTIONAL_READY` sandbox; controle courant `v2_all/v2` revision 77, Stripe test uniquement, offline et live fermes |
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
