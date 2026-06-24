# Runbook Next.js SSR

## Installation

```powershell
cd C:\Users\matth\Travail\SecondevieNextjsSSR
npm install
```

## Configuration env locale

Les vrais fichiers `.env.sandbox` et `.env.production` ne sont pas commits dans le depot public.

```powershell
Copy-Item .env.sandbox.example .env.sandbox
Copy-Item .env.production.example .env.production
```

Remplir ensuite les valeurs Firebase/Stripe du projet cible. Les credentials serveur Firebase Admin doivent rester sans prefixe `NEXT_PUBLIC_`.

Pour App Hosting, configurer les memes variables publiques et les secrets serveur dans Firebase/App Hosting, pas dans le depot GitHub public.

## Developpement sandbox

```powershell
npm run dev
```

Le script charge `.env.sandbox` puis mappe les variables publiques `VITE_*` en `NEXT_PUBLIC_*`.

URL locale par defaut : `http://localhost:3000`.

## Build sandbox

```powershell
npm run build
npm run start
```

`start` charge aussi `.env.sandbox`.

## Developpement prod local

```powershell
npm run dev:prod
npm run build:prod
npm run start:prod
```

Ne pas utiliser ces commandes pour des tests d'ecriture sans validation explicite.

## Validation

```powershell
npm run lint
npm run build
npm run start
npm run seo:check
npm run mobile:contract
npm run test:e2e
```

`seo:check` et `test:e2e` attendent un serveur Next actif sur `http://127.0.0.1:3000`.

## Comparaison SPA vs Next

Dans un terminal pour la SPA source, lecture seule :

```powershell
cd C:\Users\matth\Travail\SecondevieAnais
npm run dev -- --host 127.0.0.1 --port 4173
```

Dans le clone Next :

```powershell
cd C:\Users\matth\Travail\SecondevieNextjsSSR
$env:SPA_BASE_URL='http://127.0.0.1:4173'
$env:NEXT_BASE_URL='http://127.0.0.1:3000'
npm run perf:compare
npm run perf:runtime
```

Arreter ensuite le serveur SPA.

## Firebase

Architecture recommandee : Firebase App Hosting.

## Bootstrap owner / super-admin

Le bootstrap super-admin doit rester une operation rare, explicite et auditable.

Prerequis :

- `SUPER_ADMIN_EMAIL` est configure uniquement cote serveur, via Secret Manager/App Hosting, jamais en `NEXT_PUBLIC_*`.
- Le compte Firebase Auth correspondant existe et `emailVerified === true`.
- L'operateur est deja connecte avec ce compte owner et dispose d'un ID token frais.

Procedure :

1. Verifier dans Firebase Authentication que l'email owner est bien verifie.
2. Ouvrir le back-office avec le compte owner.
3. Lancer uniquement l'action d'administration qui appelle `syncSuperAdminClaim`.
4. Forcer un refresh du token cote client, puis rouvrir le back-office.
5. Controler `sys_metadata/admin_users` et `users/{uid}` : role `owner`, `admin=true`, `superAdmin=true`.
6. Noter la date, l'UID, l'email et le motif dans le rapport agent ou le journal d'exploitation.

Ne pas appeler `syncSuperAdminClaim` pendant les parcours client standard, les runs checkout ou les tests E2E. Si l'email owner n'est pas verifie, la Function doit refuser le bootstrap et aucun claim admin ne doit etre attribue.

## Dashboard de deploiement sandbox

```powershell
npm run dashboard
```

Le dashboard ne propose que la sandbox du clone Next (`secondevienextjsssr`) et le backend App Hosting `secondevie-next-sandbox`.

Options disponibles :

- App Hosting sandbox : build local de controle puis `firebase deploy --only apphosting:secondevie-next-sandbox --project secondevienextjsssr`
- Functions uniquement
- Firestore rules + indexes
- Storage rules
- Tout deployer en sandbox

Note Functions : `publicCatalog` est isole dans le codebase `functions-public` pour pouvoir deployer le cache catalogue sans secrets Stripe/Gmail.

```powershell
firebase deploy --project secondevienextjsssr --only functions:public:publicCatalog --non-interactive
```

Les fonctions historiques du dossier `functions` restent dans le codebase `main` et ne doivent pas etre deployees tant que les secrets sandbox `GMAIL_EMAIL`, `GMAIL_PASSWORD`, `STRIPE_SECRET_KEY` et `STRIPE_WH_SECRET` ne sont pas definis.

Etat sandbox 2026-06-18 :

- Les secrets Functions `STRIPE_SECRET_KEY` et `STRIPE_WH_SECRET` pointent vers le compte Stripe test sandbox et sont deployes sur `createOrder` / `stripeWebhook`.
- Le secret `GMAIL_PASSWORD` est un mot de passe d'application Gmail fonctionnel pour les emails E2E sandbox.
- Le paiement Stripe sandbox a ete valide cote UI, webhook signe, Firestore, email client/admin et stock.
- Les triggers Firestore sont deployes en Functions v2 `europe-west1`, necessaire avec la base Firestore europeenne `eur3`.

Controle non interactif :

```powershell
npm run dashboard -- --status
```

Le statut affiche aussi :

- l'URL App Hosting sandbox actuellement ciblee ;
- le health check public `GET /galerie` ;
- le lien console Firebase des rollouts App Hosting ;
- les commandes `infra:env`, `infra:deploy` et logs Functions utiles.

## Rollback App Hosting Sandbox

Le rollback App Hosting se fait depuis la console Firebase, sur le backend sandbox :

```text
https://console.firebase.google.com/project/secondevienextjsssr/apphosting/backends/secondevie-next-sandbox
```

Procedure :

1. Ouvrir le backend App Hosting `secondevie-next-sandbox`.
2. Dans les rollouts, choisir le dernier rollout stable connu.
3. Lancer l'action `Roll back` depuis la console Firebase.
4. Attendre la fin du rollout de rollback.
5. Verifier `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/galerie`.
6. Controler les logs si besoin :

```powershell
firebase functions:log --project secondevienextjsssr
```

Lire aussi :

- `DATABASE_MIGRATION_PLAN.md` pour la strategie base de donnees, sandbox, export/import, tests admin/checkout et cutover.

Fichiers utiles :

- `apphosting.yaml`
- `.env.sandbox`
- `.env.production`
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `functions/`

Regles :

- Garder les secrets serveur hors `NEXT_PUBLIC_*`.
- Utiliser Secret Manager/App Hosting env secrets pour les secrets reels.
- Ne pas committer `apphosting.local.yaml`.
- Ne pas faire de tests destructifs sur production.
- Utiliser sandbox, read-only production ou emulateur/export-import pour les comparaisons de donnees.

## Stripe Sandbox Et Webhooks Signes

Endpoint sandbox attendu :

```text
https://us-central1-secondevienextjsssr.cloudfunctions.net/stripeWebhook
```

Events Stripe sandbox configures au 2026-06-18 :

```text
checkout.session.completed
checkout.session.expired
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
```

Events supplementaires a ajouter au webhook Stripe pour le suivi temps reel des remboursements :

```text
refund.created
refund.updated
refund.failed
charge.refunded
```

Etat des handlers :

- `payment_intent.succeeded` : handler actif. Valide statut, montant, devise, PaymentIntent id, metadata, statut commande et stock reserve avant de passer `paid`.
- `payment_intent.payment_failed` : handler actif. Passe la commande en `payment_failed`, restaure le stock si `stockReserved === true`, puis marque `stockReserved=false`.
- `payment_intent.canceled` : handler actif. Passe la commande en `canceled`, restaure le stock si `stockReserved === true`, puis marque `stockReserved=false`.
- `checkout.session.completed` : handler legacy actif pour retrocompatibilite Stripe Checkout historique.
- `checkout.session.expired` : handler actif. Journalise l'expiration et, si une commande legacy est referencee en metadata, restaure une commande non payee avec `cancelReason=checkout_session_expired`.
- `refund.created` / `refund.updated` / `refund.failed` : handler actif. Relie le refund a la commande, met a jour `refundStatus`, et restaure le stock seulement si le remboursement complet reussit.
- `charge.refunded` : handler fallback actif pour les endpoints Stripe qui envoient l'objet Charge rembourse.

Preuves sandbox recentes :

- Succes paiement + webhook + emails + stock : `logs/hosted-stripe-e2e-2026-06-18T18-20-27-462Z.json`
- Carte refusee + `payment_intent.payment_failed` + restauration stock : `logs/hosted-stripe-e2e-2026-06-18T18-24-35-852Z.json`
- Refund admin Stripe + stock : commande `q1tUtmNyjNpSeUTjGyFW`, refund `re_3TjkYbRdWb0VNdZq1SLulN7D`
- Retry `createOrder` + `payment_intent.canceled` + webhook `processed` + stock restaure : `logs/stripe-hardening-proof-2026-06-18T21-26-40.json`
- Checkout heberge stabilise jusqu'au Payment Element + carte sandbox passee : `logs/hosted-stripe-e2e-2026-06-24T20-50-15-627Z.json`
- Clic UI strict `Rembourser` depuis admin `Retours` + stock restaure : `logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.json`

Decision metier 2026-06-19 :

- Une commande Stripe deja payee ne s'annule pas librement cote client.
- Le back-office expose un seul flux : `Rembourser et remettre en vente`.
- La section admin `Retours` centralise les commandes Stripe remboursables, les refunds en attente, la synchronisation Stripe et l'email client.
- Si Stripe accepte le remboursement, la commande passe `refunded` et le stock est restaure automatiquement.
- Si un refund est partiel ou ambigu, le stock n'est pas restaure automatiquement et la commande passe en verification.
- L'espace client indique un remboursement initie/confirme et annonce un delai indicatif Stripe d'environ 5 a 10 jours ouvrables selon la banque.
- Reference Stripe : `https://docs.stripe.com/refunds`.

Commande logs utile :

```powershell
firebase functions:log --only stripeWebhook --project secondevienextjsssr
```

Verification attendue :

- Stripe Dashboard indique une livraison `2xx` pour l'event.
- `stripeWebhook` affiche l'event correspondant et finit en status code `200`.
- Firestore `sys_idempotency/stripe_<eventId>` passe en `processed`.
- La commande conserve l'historique metier; le stock n'est restaure que si `stockReserved === true`.

## Revalidation Catalogue E2E Admin

Commande sandbox:

```powershell
npm run e2e:revalidate-catalog
```

Mode non interactif ajoute le 2026-06-24:

- `scripts/e2e-revalidate-catalog.mjs` charge `.env.sandbox`, `logs/e2e-mail.env` et `logs/e2e-admin.env`.
- Si `E2E_ADMIN_PASSWORD` ou `E2E_REVALIDATE_PASSWORD` est present hors repo, le script obtient directement un ID token Firebase via Identity Toolkit `signInWithPassword`.
- Si `E2E_ADMIN_UID` ou `E2E_REVALIDATE_ADMIN_UID` est fourni, le script n'ouvre pas Playwright: il cree un custom token Firebase Admin, l'echange contre un ID token via Identity Toolkit, puis appelle `/api/revalidate-catalog`.
- Le projet cible est force depuis `E2E_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ou `VITE_FIREBASE_PROJECT_ID`; `FIREBASE_PROJECT_ID` n'est qu'un fallback pour eviter les restes d'anciens projets.
- Le service account signataire est `E2E_ADMIN_SIGNER_SERVICE_ACCOUNT` ou, par defaut, `secondevienextjsssr@appspot.gserviceaccount.com`.
- En local avec Application Default Credentials, l'identite ADC doit avoir `iam.serviceAccounts.signBlob` sur ce service account, sinon le JSON E2E classe l'echec en `known-iam-signblob-missing`.
- Note 2026-06-24: le role `roles/iam.serviceAccountTokenCreator` a ete ajoute pour `matthis.fradin2@gmail.com`, mais le test direct `sign-blob` sur `secondevienextjsssr@appspot.gserviceaccount.com` restait refuse. Le run E2E valide utilise donc le fallback password admin hors repo.

Variables utiles hors repo:

```text
E2E_ADMIN_UID=<uid admin sandbox email verifie avec claim admin/superAdmin>
E2E_ADMIN_SIGNER_SERVICE_ACCOUNT=<service-account@project.iam.gserviceaccount.com>
E2E_ADMIN_PASSWORD=<mot de passe admin sandbox hors repo>
```

Ne jamais stocker ni afficher l'ID token complet. Les logs du script redigent `idToken`, `refreshToken`, `Authorization`, tokens longs et OTP.

Preuve sandbox:

```text
logs/revalidate-catalog-e2e-2026-06-24T16-05-12-902Z.json
status=passed
/galerie=200
/categorie/meubles=200
/produit/buffet-VdMQLvZvXJL7mKVxCBvb=200
/sitemap.xml=200
/api/revalidate-catalog=200
```

## App Check Enforcement Readiness

Etat sandbox prouve le 2026-06-24 dans:

```text
APP_CHECK_ENFORCEMENT_READINESS_2026-06-24.md
```

Commande read-only de reprise:

```powershell
node scripts/audit-app-check-service-state.mjs
```

Decision actuelle:

- Firestore: rester `UNENFORCED`, trafic recent non verifie observe.
- Identity Toolkit/Auth: rester `UNENFORCED`, trafic recent non verifie observe.
- Storage: rester `UNENFORCED`, pas assez de trafic mesure pour juger.
- Functions: pas de bouton global traite; definir une strategie par endpoint/callable, en excluant les webhooks Stripe et endpoints publics.

Ne pas activer enforcement App Check global tant qu'une fenetre de telemetrie propre n'est pas obtenue et qu'un rollback vers `UNENFORCED` n'est pas pret.

## Rail Prod

Etat au 2026-06-24:

```text
RAIL_PROD_AUDIT_REPORT_2026-06-24.md
```

Decision: rail prod absent / non cable dans ce clone.

`npm run infra:env` expose un bloc `railProd` qui classe l'etat sans afficher de secrets. Le resultat courant attendu est:

```text
railProd.decision = prod-absent-or-not-wired
```

Ne pas deployer en production tant que le backend App Hosting prod, le domaine final, App Check prod, Stripe live, CORS/origins, secrets live et gates prod ne sont pas explicitement configures.

## Checkout Redirect Sandbox

Etat au 2026-06-24:

```text
CHECKOUT_REDIRECT_SANDBOX_REPORT_2026-06-24.md
```

Le harnais `scripts/e2e-hosted-stripe-checkout.mjs` supporte maintenant:

```text
E2E_STRIPE_PAYMENT_METHOD=ideal
E2E_STRIPE_IDEAL_BANK=ING
E2E_STRIPE_AUTHORIZE_REDIRECT=true
E2E_CHECKOUT_MODE=otp-user
```

La preuve runtime redirect n'est pas encore acquise. Le checkout heberge atteint maintenant le Stripe Payment Element et la carte sandbox passe, mais le dernier run iDEAL `logs/hosted-stripe-e2e-2026-06-24T20-51-01-227Z.json` est classe `known-blocked-stripe-redirect-method`: iDEAL/Wero n'est pas selectable dans la configuration Stripe sandbox courante.

## Stripe Payment Methods UI

Etat au 2026-06-24:

- Le checkout ne promet plus statiquement Apple Pay, Google Pay ou PayPal dans `src/kit/commerce/CheckoutView.jsx`.
- L'UI affiche un choix generique `Paiement Stripe` et laisse le Payment Element afficher les moyens actifs/eligibles.

Avant live, verifier dans Stripe Dashboard:

- moyens de paiement actifs sandbox puis prod;
- Apple Pay domain verification si Apple Pay doit etre visible;
- absence de warning `payment method not activated` sur un run prod-like.

## Refund UI Strict

Etat au 2026-06-24:

```text
REFUND_UI_STRICT_PROOF_2026-06-24.md
```

La preuve stricte du clic UI `Rembourser` sur une commande fraiche `paid` est acquise:

```text
logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.json
logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.png
```

Preuve: `clickedRefund=true`, confirm natif accepte, commande `xxHfLd2NLLWyFN5VXz01` en `refunded`, `refundStatus=succeeded`, refund `re_3TlxoeRdWb0VNdZq1RL5SfaS`, `stockRestoredAfterRefund=true`, produit restaure `stock=1`, `sold=false`.

## Note env

Next peut afficher `Environments: .env.production` au build parce que le fichier existe dans le dossier. Les scripts du clone chargent explicitement le fichier voulu avant `next` via `scripts/with-env.mjs`; par defaut, `dev`, `build` et `start` utilisent `.env.sandbox`.
