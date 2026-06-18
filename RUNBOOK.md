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

Etat des handlers :

- `payment_intent.succeeded` : handler actif. Valide statut, montant, devise, PaymentIntent id, metadata, statut commande et stock reserve avant de passer `paid`.
- `payment_intent.payment_failed` : handler actif. Passe la commande en `payment_failed`, restaure le stock si `stockReserved === true`, puis marque `stockReserved=false`.
- `payment_intent.canceled` : handler actif. Passe la commande en `canceled`, restaure le stock si `stockReserved === true`, puis marque `stockReserved=false`.
- `checkout.session.completed` : handler legacy actif pour retrocompatibilite Stripe Checkout historique.
- `checkout.session.expired` : handler actif. Journalise l'expiration et, si une commande legacy est referencee en metadata, restaure une commande non payee avec `cancelReason=checkout_session_expired`.

Preuves sandbox recentes :

- Succes paiement + webhook + emails + stock : `logs/hosted-stripe-e2e-2026-06-18T18-20-27-462Z.json`
- Carte refusee + `payment_intent.payment_failed` + restauration stock : `logs/hosted-stripe-e2e-2026-06-18T18-24-35-852Z.json`
- Refund admin Stripe + stock : commande `q1tUtmNyjNpSeUTjGyFW`, refund `re_3TjkYbRdWb0VNdZq1SLulN7D`
- Retry `createOrder` + `payment_intent.canceled` + webhook `processed` + stock restaure : `logs/stripe-hardening-proof-2026-06-18T21-26-40.json`

Decision metier 2026-06-19 :

- Une commande Stripe deja payee ne s'annule pas librement cote client.
- Le back-office expose un seul flux : `Rembourser et remettre en vente`.
- Si Stripe accepte le remboursement, la commande passe `refunded` et le stock est restaure automatiquement.
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

## Note env

Next peut afficher `Environments: .env.production` au build parce que le fichier existe dans le dossier. Les scripts du clone chargent explicitement le fichier voulu avant `next` via `scripts/with-env.mjs`; par defaut, `dev`, `build` et `start` utilisent `.env.sandbox`.
