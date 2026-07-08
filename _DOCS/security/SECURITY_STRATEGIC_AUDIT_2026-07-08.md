# Audit securite strategique - Seconde Vie Next/Firebase

Date de demarrage: 2026-07-08

## Objectif

Premiere passe securite manuelle avant presentation cliente, sans workflow Codex Security automatise.

But: identifier les portes d'acces attaquables les plus importantes sur l'infra Next.js/Firebase, documenter l'avancement phase par phase, puis prioriser les corrections avant mise en production.

## Perimetre

Dans le perimetre:

- routes Next App Router: `app/`;
- helpers serveur et configuration: `src/lib`, `src/kit/config`, `src/kit/contexts`;
- surfaces client sensibles: `src/kit/admin`, `src/kit/commerce`, `src/kit/marketplace`;
- Cloud Functions privees: `functions/`;
- Cloud Functions publiques: `functions-public/`;
- regles Firebase: `firestore.rules`, `storage.rules`;
- hebergement et deploy: `firebase.json`, `apphosting.yaml`, `.firebaserc`, `.firebaseignore`;
- scripts infra/env/deploy: `scripts/`;
- exemples d'environnement: `.env.production.example`, `.env.sandbox.example`.

Hors perimetre de cette premiere passe:

- pentest externe reel;
- scan reseau/prod;
- tests destructifs;
- verification de secrets reels dans les consoles Firebase/Stripe;
- correction automatique des findings, sauf demande explicite.

## Methode

Audit manuel par lecture de code et recherches ciblees.

Les niveaux utilises:

- `P0`: exploitable ou bloquant avant demonstration/prod.
- `P1`: risque serieux a corriger avant production.
- `P2`: durcissement recommande.
- `P3`: hygiene ou documentation.

Chaque finding doit contenir:

- surface;
- fichier et ligne si possible;
- scenario d'exploitation;
- impact;
- recommandation;
- statut.

## Etat global

Statut courant: en cours.

Synthese provisoire:

- Aucun `P0` confirme a ce stade.
- Plusieurs `P1/P2` ont ete traites pendant l'implementation: attribution admin, maintenance destructive, refund admin, App Check Functions, endpoints E2E et analytics.
- Le rail App Hosting sandbox/test est conserve volontairement pour cette phase.
- Points rassurants deja observes: regles Firestore restrictives sur commandes/produits, Storage limite aux admins et images, `/api/revalidate-catalog` verifie un token Firebase admin, coeur checkout/Stripe avec recalcul serveur, transactions et webhook signe.

## Phase 0 - Cartographie des surfaces

Statut: fait pour la premiere passe.

Objectif:

- lister les entrees HTTP Next;
- lister les Functions exportees;
- lister les collections Firestore et chemins Storage critiques;
- isoler les surfaces admin, checkout, revalidation et maintenance.

Surfaces attendues:

- public SEO: `/`, `/galerie`, `/categorie/[categoryId]`, `/produit/[slugOrId]`, `/a-propos`, `/devis`;
- tunnels prives: `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`;
- API Next: `/api/revalidate-catalog`;
- Function publique: `publicCatalog`;
- Functions privees: commerce, auth/admin, analytics, email, maintenance, SEO legacy;
- donnees: produits, commandes, utilisateurs, paniers, wishlist, fichiers image produit.

Constats:

- Routes Next recensees: `/`, `/galerie`, `/categorie/[categoryId]`, `/produit/[slugOrId]`, `/a-propos`, `/devis`, `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`, `/api/revalidate-catalog`, `robots`, `sitemap`.
- Functions exportees depuis `functions/index.js`: commerce, auth/admin, OTP, passkeys, emails, analytics, maintenance, SEO legacy et triggers.
- Function publique separee: `functions-public/index.js` exporte `publicCatalog`.
- Surfaces a risque prioritaire: `functions/src/maintenance/tools.js`, `functions/src/commerce/refundOrder.js`, `functions/src/commerce/createOrder.js`, `functions/src/commerce/stripeWebhook.js`, `functions/src/auth/adminManagement.js`, `functions/src/analytics/sessions.js`, `app/api/revalidate-catalog/route.js`.

## Phase 1 - Secrets, env et exposition deployable

Statut: premiere passe faite.

Objectif:

- verifier que les secrets ne sont pas prefixes `NEXT_PUBLIC_` ou `VITE_`;
- verifier les fichiers deployables et ignores;
- verifier les exemples `.env.*.example`;
- verifier le risque de deploy de `.env.production`, `.env.sandbox`, cles ou comptes de service.

Constats:

- Positif: `.gitignore` ignore `.env`, `.env.*`, `service-account.json`, `apphosting.local.yaml`, `*.pem`, `*.key`.
- Positif: `.firebaseignore` ignore `.env*`, `service-account.json`, `.firebase/`, cles `.pem/.key`, logs et builds.
- Positif: `SUPER_ADMIN_EMAIL` est reference comme secret App Hosting dans `apphosting.yaml:64-65`.
- `P1`: `apphosting.yaml` contient encore la configuration sandbox et Stripe test: `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` vaut une cle `pk_test` (`apphosting.yaml:68-69`) et `NEXT_PUBLIC_SITE_URL` pointe vers le backend sandbox (`apphosting.yaml:78-79`). Bloquant avant vraie prod.
- `P1`: `firebase.json` declare un backend App Hosting `secondevie-next-sandbox` (`firebase.json:19-21`). Le rail prod distinct n'est pas present dans ce clone.

## Phase 2 - Firebase Hosting, App Hosting, CORS et App Check

Statut: premiere passe faite.

Objectif:

- verifier la separation sandbox/prod;
- verifier les rewrites Firebase Hosting;
- verifier `PUBLIC_ALLOWED_ORIGINS`;
- verifier App Check et domaines autorises;
- verifier les endpoints publics exposes.

Constats:

- `P1`: rail prod non separe du sandbox dans les fichiers deploy locaux (`firebase.json:19-21`, `apphosting.yaml:78-79`).
- `P2`: le bloc Firebase Hosting legacy reste actif avec rewrites vers Functions SEO (`firebase.json:49-79`). A clarifier avant prod pour eviter qu'un deploy Hosting ancien serve un fallback SPA ou des Functions SEO legacy en parallele d'App Hosting.
- `P2`: CSP presente dans le bloc Hosting legacy (`firebase.json:139-140`), mais pas de `headers()` Next equivalent observe dans `next.config.mjs`. Si la prod passe par App Hosting Next et non par Firebase Hosting legacy, verifier comment ces headers securite sont poses en prod.
- Constat initial: App Check etait initialise cote client (`src/kit/config/firebase.js:17-26`, `src/kit/config/firebaseLazy.js:24-35`), mais aucune occurrence `enforceAppCheck` n'avait ete trouvee dans `functions/` ou `functions-public/`.
- Etat apres implementation: enforcement ajoute sur les callables admin sensibles, maintenance, refund, analytics, OTP et commerce client; beacon durci par origine/taille/rate-limit; Stripe webhook et `publicCatalog` restent hors App Check par design.

## Phase 3 - Firestore Rules et Storage Rules

Statut: premiere passe faite.

Objectif:

- verifier lecture publique catalogue;
- verifier isolation commandes/panier/wishlist;
- verifier ecritures admin;
- verifier uploads Storage;
- verifier claims admin/superAdmin.

Constats:

- Positif: produits publics lisibles seulement si `status == 'published'`, ecriture produit reservee admin (`firestore.rules:70-72`).
- Positif: commandes creees uniquement via Cloud Function (`firestore.rules:131-146`).
- Positif: cart/wishlist isoles par utilisateur (`firestore.rules:119-126`).
- Positif: `sys_metadata/stripe_connect` est protege en ecriture via `isProtectedMetadataDoc` (`firestore.rules:37-43`, `firestore.rules:151-152`).
- Positif: Storage est lisible publiquement mais ecriture limitee aux admins/superAdmins, images uniquement, moins de 10 Mo, SVG exclu (`storage.rules:5-16`).
- Point a surveiller: lecture Storage publique globale (`storage.rules:5`). C'est coherent pour images produit publiques, mais il faut eviter de stocker dans le bucket des documents prives ou exports admin.

## Phase 4 - Cloud Functions publiques et privees

Statut: premiere passe partielle faite.

Objectif:

- inventorier les exports;
- verifier auth, claims, App Check, CORS et validation d'entrees;
- verifier `createOrder`, `stripeWebhook`, `cancelOrder`, refunds, admin management et maintenance.

Constats:

- Positif: `publicCatalog` ne sert que les produits publics, limite `limit` a 120 et filtre `status === 'published'`.
- Positif: `createOrder` recalcule prix/stock serveur, normalise produit/quantite, rate-limit par utilisateur, et reserve le stock en transaction (`functions/src/commerce/createOrder.js:135-194`, `functions/src/commerce/createOrder.js:325-494`).
- Positif: `stripeWebhook` exige signature Stripe et raw body, puis dedupe via `sys_idempotency` (`functions/src/commerce/stripeWebhook.js:503-517`, `functions/src/commerce/stripeWebhook.js:630-656`).
- Positif: validation du paiement Stripe sur montant, devise, PaymentIntent, user, email, statut et reservation stock (`functions/src/commerce/stripeWebhook.js:33-60`, `functions/src/commerce/stripeWebhook.js:325-372`).
- Constat initial: fonctions maintenance destructives appelees avec seulement `checkIsSuperAdmin(context)`, sans re-auth recente ni phrase de confirmation.
- Etat apres implementation: maintenance destructive durcie par session recente, phrase de confirmation et audit.
- Decision produit: remboursement Stripe conserve pour les admins, mais durci par session admin recente, phrase de confirmation et audit.
- `P2`: endpoints E2E `e2eCheckoutProof` et `e2eStripeHardeningProof` sont exportes depuis la codebase principale (`functions/index.js:31-32`). Ils sont proteges par `E2E_PROOF_TOKEN` (`functions/src/commerce/e2eCheckoutProof.js:90-104`, `functions/src/commerce/e2eStripeHardeningProof.js:227-241`), mais ils devraient etre exclus du rail prod ou gates par projet/env.

## Phase 5 - Routes Next, API route et rendu serveur

Statut: premiere passe faite.

Objectif:

- verifier `/api/revalidate-catalog`;
- verifier les routes dynamiques privees;
- verifier que les pages publiques ne fuitent pas de donnees privees;
- verifier les parametres dynamiques produit/categorie.

Constats:

- Positif: `/api/revalidate-catalog` est dynamique et requiert un Bearer token Firebase verifie avec revocation (`app/api/revalidate-catalog/route.js:29-43`, `app/api/revalidate-catalog/route.js:60-73`).
- Positif: revalidation refuse les chemins non absolus et `/api/*` (`app/api/revalidate-catalog/route.js:14-24`).
- Point a surveiller: le check accepte aussi l'email `SUPER_ADMIN_EMAIL` sans comparer `email_verified` dans cette route (`app/api/revalidate-catalog/route.js:41-43`). Les tokens Firebase email/password sont normalement controles par Firebase, mais aligner avec `checkIsAdmin` cote Functions serait plus strict.

## Phase 6 - Admin, auth et backoffice

Statut: premiere passe partielle faite.

Objectif:

- verifier que les controles admin ne sont pas seulement UI;
- verifier les appels `httpsCallable`;
- verifier roles, exports, remboursements, edition catalogue, publication et analytics.

Constats:

- Positif: admin management utilise `checkIsSuperAdmin` pour ajouter/retirer un admin (`functions/src/auth/adminManagement.js:59-127`).
- Positif: `syncSuperAdminClaim` exige super-admin et email verifie avant bootstrap claim (`functions/src/auth/adminManagement.js:12-31`).
- Etat apres implementation: actions backoffice destructives et financieres durcies par auth recente, phrase de confirmation et journal d'audit.

## Phase 7 - Checkout, Stripe et commandes

Statut: premiere passe faite.

Objectif:

- verifier recalcul serveur prix/stock;
- verifier signature webhook;
- verifier idempotence;
- verifier creation, annulation, refund et restock;
- verifier donnees client exposees.

Constats:

- Positif: prix et frais sont recalcules serveur; le client ne fixe pas le total final (`functions/src/commerce/createOrder.js:367-416`).
- Positif: stock reserve en transaction avant PaymentIntent, puis restaure si Stripe echoue (`functions/src/commerce/createOrder.js:325-515`).
- Positif: webhook signe, raw body requis, validation forte du paiement et idempotence (`functions/src/commerce/stripeWebhook.js:33-60`, `functions/src/commerce/stripeWebhook.js:503-656`).
- Etat apres implementation: refund admin conserve pour les admins, mais durci comme action financiere sensible.

## Phase 8 - Injections, XSS et donnees non fiables

Statut: premiere passe faite.

Objectif:

- rechercher `dangerouslySetInnerHTML`, `eval`, `new Function`;
- verifier rendu HTML admin/SEO;
- verifier redirects, URLs externes, logs, emails et champs texte catalogue.

Constats:

- Aucun `eval`, `new Function`, `insertAdjacentHTML` ou `document.write` trouve dans le perimetre scanne.
- `dangerouslySetInnerHTML` est utilise pour JSON-LD, petits scripts de restauration, styles inline et scripts theme. Les JSON-LD observes utilisent `JSON.stringify(data).replace(/</g, '\\u003c')`, par exemple `app/produit/[slugOrId]/page.jsx:19` et `src/kit/marketplace/GalleryRoutePage.jsx:136`.
- `P3`: conserver une revue XSS a chaque ajout de contenu admin dans JSON-LD ou script inline. Le pattern actuel est acceptable tant que les donnees restent serialisees et echappees.

## Phase 9 - Dependances et scripts sensibles

Statut: premiere passe initiale faite.

Objectif:

- verifier scripts `package.json`;
- verifier dependances sensibles Firebase/Stripe/Next;
- identifier scripts destructifs ou deploy dangereux;
- noter les audits automatiques utiles, sans les lancer sans decision explicite.

Constats:

- `P2`: pas d'audit npm lance pendant cette passe. A prevoir explicitement si besoin: `npm audit --omit=dev`, audit `functions/package*.json`, et verification des scripts de deploy.
- `P2`: les scripts existants `infra:env`, `infra:deploy`, `appcheck:audit`, `maintenance:audit` peuvent servir de gates rapides apres corrections ou avant prod.

## Findings

### P1-001 - Rail prod absent, configuration App Hosting encore sandbox/test

Surface: App Hosting, Firebase project, Stripe public key.

Preuves:

- `firebase.json:19-21` declare `backendId: secondevie-next-sandbox`.
- `apphosting.yaml:68-69` utilise une cle Stripe publique `pk_test`.
- `apphosting.yaml:78-79` pointe `NEXT_PUBLIC_SITE_URL` vers le hosted.app sandbox.

Scenario:

- Un deploy/prod reuse le rail sandbox ou les cles test; la cliente voit un site presentable mais le passage en prod n'est pas verrouille, et les domaines/CORS/App Check/Stripe live risquent d'etre incoherents.

Impact:

- Blocage prod, risque de mauvais projet Firebase/Stripe, donnees et paiements non separes.

Recommandation:

- Creer un rail App Hosting prod distinct, domaine prod, Stripe live, secrets live, `PUBLIC_ALLOWED_ORIGINS` prod, App Check prod, puis gate `infra:env`/`infra:deploy`.

Statut: accepte/depriorise pour cette phase. Le rail sandbox est attendu a ce stade.

### P1-002 - Functions maintenance destructives sans auth recente ni confirmation forte

Surface: Cloud Functions maintenance.

Preuves:

- Constat initial: `resetAllUsers`, `purgeAnonymousUsers`, `purgeAllProducts`, `resetAllOrders` utilisaient `checkIsSuperAdmin(context)` seulement.
- Constat initial: `checkRecentSuperAdmin` existait deja (`functions/helpers/security.js:61-70`) mais n'etait pas utilise dans ces fonctions.
- Etat apres implementation: `checkRecentSuperAdmin` est utilise sur les purges super-admin.

Scenario:

- Une session super-admin volee, trop ancienne, ou un clic accidentel dans l'admin suffit a declencher des suppressions massives.

Impact:

- Perte de comptes, produits, commandes ou images.

Recommandation:

- Remplacer par `checkRecentSuperAdmin`, exiger `confirmText`, journaliser dans une collection d'audit, et idealement ajouter un mode dry-run/preview avant execution.

Statut: corrige par durcissement session recente, confirmation serveur et audit.

### P1-003 - Refund Stripe accessible a tout admin

Surface: remboursements, Stripe, backoffice commandes.

Preuves:

- `refundOrderAdmin` utilise `checkIsAdmin(context)` (`functions/src/commerce/refundOrder.js:116-119`).

Scenario:

- Un admin non super-admin, ou un compte admin compromis, peut declencher un remboursement Stripe et une remise en stock.

Impact:

- Mouvement financier non desire, incoherence stock/commande.

Recommandation:

- Exiger super-admin ou role refund dedie, auth recente, phrase de confirmation, et audit trail non modifiable.

Statut: corrige selon la decision produit: remboursement conserve pour admin, mais session recente, confirmation et audit obligatoires.

### IMPLEMENTE - Attribution admin blindee

Changements:

- `syncSuperAdminClaim`, `addAdminUser` et `removeAdminUser` utilisent maintenant une session super-admin recente.
- `syncSuperAdminClaim` exige aussi que l'email du caller corresponde au `SUPER_ADMIN_EMAIL` serveur.
- `addAdminUser` et `removeAdminUser` exigent une phrase de confirmation serveur.
- Chaque changement admin ecrit un audit dans `sys_audit_security`.
- L'UI `AdminUsers` envoie les phrases de confirmation attendues.

Risque residuel:

- Un vrai super-admin recent conserve le pouvoir d'ajouter/retirer un admin, ce qui est le comportement attendu.

### IMPLEMENTE - Refund admin conserve mais durci

Decision produit:

- Le remboursement reste accessible aux admins, car le perimetre attendu est le dev + la cliente admin.

Changements:

- `refundOrderAdmin` exige maintenant une session admin recente.
- `refundOrderAdmin` exige `confirmText: "REMBOURSER COMMANDE"`.
- Les ecrans `AdminOrders` et `AdminReturns` demandent la phrase avant l'appel.
- Chaque remboursement ecrit un audit dans `sys_audit_security` avec commande, montant, devise, refund Stripe et statut.

Risque residuel:

- Un vrai admin recent peut rembourser, ce qui est le comportement attendu.

### IMPLEMENTE - Maintenance destructive durcie

Changements:

- Les purges `resetAllUsers`, `purgeAnonymousUsers`, `purgeAllProducts`, `resetAllOrders` exigent maintenant une session super-admin recente.
- `resetAllStats` exige aussi une session super-admin recente.
- `runGarbageCollector` conserve l'acces admin, mais exige une session admin recente.
- Chaque action exige une phrase de confirmation serveur propre a l'action.
- Chaque action ecrit un audit dans `sys_audit_security`.
- Le dashboard admin demande la phrase avant d'appeler les Functions.

Risque residuel:

- Les actions restent destructives par design. Le durcissement reduit le risque de mauvais clic/session ancienne, mais ne remplace pas un backup avant operation reelle.

### IMPLEMENTE - App Check, E2E et analytics

Changements:

- App Check enforce ajoute sur les callables admin sensibles, maintenance, refund, analytics `initLiveSession` et `syncSession`.
- App Check enforce ajoute sur OTP client/invite, `createOrder`, `cancelOrderClient` et `getOrderStatusClient`.
- Les webhooks Stripe restent sans App Check, car ils doivent accepter les appels Stripe signes.
- `syncSessionBeacon` refuse maintenant les origines absentes ou non autorisees et limite la taille du payload.
- Analytics ajoute un rate-limit serveur par IP/type de flux.
- Les endpoints E2E `e2eCheckoutProof` et `e2eStripeHardeningProof` refusent hors sandbox explicite ou `E2E_PROOF_ENABLED=true`.

Risque residuel:

- `publicCatalog` reste public par design.
- Le beacon analytics ne porte pas de token App Check, donc il est durci par origine, taille et rate-limit plutot que par enforcement App Check.

### P1-004 - App Check initialise cote client mais non impose cote Functions

Surface: Firebase callable/onRequest Functions.

Preuves:

- Constat initial: App Check etait initialise dans `src/kit/config/firebase.js:17-26` et `src/kit/config/firebaseLazy.js:24-35`, mais aucune occurrence `enforceAppCheck` n'etait presente.
- Etat apres implementation: `enforceAppCheck` est ajoute aux callables admin sensibles, maintenance, refund, analytics, OTP et commerce client.

Scenario:

- Des clients hors navigateur officiel peuvent appeler directement certaines Functions, en s'appuyant uniquement sur auth/rate-limit/logique metier.

Impact:

- Surface d'abus plus large: OTP, analytics, commandes, endpoints publics, couts Functions/Firestore.

Recommandation:

- Activer progressivement `enforceAppCheck` sur les Functions compatibles, commencer par analytics/OTP/commande, avec phase monitoring puis enforcement.

Statut: corrige partiellement: enforcement ajoute sur callables admin sensibles, maintenance, refund, analytics, OTP et commerce client. Webhooks Stripe et catalogue public restent hors App Check par design.

### P2-001 - Endpoints E2E exportes dans la codebase Functions principale

Surface: `e2eCheckoutProof`, `e2eStripeHardeningProof`.

Preuves:

- Exports presents dans `functions/index.js:31-32`.
- Protection par secret `E2E_PROOF_TOKEN` dans les handlers (`functions/src/commerce/e2eCheckoutProof.js:90-104`, `functions/src/commerce/e2eStripeHardeningProof.js:227-241`).

Scenario:

- Un endpoint de preuve reste deploye en prod. Le token limite l'exploitation, mais l'existence du chemin augmente la surface et peut manipuler Stripe/stock en sandbox/prod si mal configure.

Impact:

- Surface inutile en prod, risque operationnel si secret/projet mal separe.

Recommandation:

- Exclure ces exports du rail prod ou les rendre conditionnels par projet/env avec fail-closed.

Statut: corrige par garde fail-closed hors sandbox explicite ou `E2E_PROOF_ENABLED=true`.

### P2-002 - Analytics writable sans auth metier forte

Surface: `initLiveSession`, `syncSession`, `syncSessionBeacon`.

Preuves:

- Functions analytics publiques/callables sans auth obligatoire (`functions/src/analytics/sessions.js:234-327`).

Scenario:

- Un acteur externe peut polluer les analytics ou generer du cout Firestore/Functions, surtout sans enforcement App Check.

Impact:

- Donnees analytics degradees, couts et bruit backoffice.

Recommandation:

- Ajouter App Check enforcement, limiter taille payload, durcir rate-limit par IP/session, et ignorer les origines absentes pour le beacon.

Statut: corrige par App Check sur callables, refus origine absente sur beacon, limite payload et rate-limit serveur.

### P2-003 - Firebase Hosting legacy encore deployable

Surface: Firebase Hosting legacy, rewrites SEO Functions.

Preuves:

- Bloc `hosting` avec rewrites vers `homeMeta`, `productMeta`, `categoryMeta` et fallback `/index.html` (`firebase.json:49-79`).

Scenario:

- Un deploy Hosting legacy ou une confusion de rail sert l'ancien fallback ou les anciennes Functions SEO en parallele d'App Hosting.

Impact:

- Surface publique plus large, incoherence SEO/cache, chemins legacy difficiles a auditer.

Recommandation:

- Decider explicitement: supprimer/archiver ce bloc si App Hosting Next est seul rail, ou documenter son role exact et le gate de non-regression.

Statut: confirme.

### P3-001 - Passkey autorise largement les domaines `.hosted.app`

Surface: passkeys.

Preuves:

- `getExpectedOrigin` accepte tout hostname finissant par `.hosted.app` (`functions/src/auth/passkeys.js:39`).

Scenario:

- Les previews/sandboxes hosted.app restent autorisees plus largement que le domaine attendu.

Impact:

- Durcissement WebAuthn incomplet, surtout avant prod domaine final.

Recommandation:

- Remplacer par une allowlist exacte: domaine prod, domaine sandbox, localhost dev.

Statut: confirme.

## Journal d'avancement

- 2026-07-08: creation du document d'audit strategique manuel et lien depuis `AGENTS.md`.
- 2026-07-08: premiere passe manuelle config infra, Firebase rules, Functions commerce/auth/maintenance/analytics, API revalidation et recherche XSS.
- 2026-07-08: implementation phase 1 demarree. Ajout des helpers serveur `checkRecentAdmin`, `assertConfirmText` et `writeSecurityAudit` dans `functions/helpers/security.js`.
- 2026-07-08: implementation terminee pour attribution admin, refund admin, maintenance destructive, App Check callables admin/client, endpoints E2E et analytics.
- 2026-07-08: validations ciblees OK avec le runtime Node embarque: `node --check` sur les fichiers Functions modifies et `tests/auth-claims.test.cjs` avec 2 tests passants.
