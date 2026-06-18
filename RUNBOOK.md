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

Etat sandbox 2026-05-13 :

- Secrets crees pour debloquer le deploy `main` :
  - `GMAIL_EMAIL=matthis.fradin2@gmail.com`
  - `GMAIL_PASSWORD=dummy_gmail_password`
  - `STRIPE_SECRET_KEY=sk_test_dummy_not_configured`
  - `STRIPE_WH_SECRET=whsec_dummy_not_configured`
- Stripe est volontairement dummy : ne pas tester le paiement carte tant qu'une vraie cle `sk_test_*` n'est pas configuree.
- Gmail password est dummy : les emails de commande ne partiront pas tant qu'un vrai mot de passe d'application Gmail n'est pas configure.
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

## Note env

Next peut afficher `Environments: .env.production` au build parce que le fichier existe dans le dossier. Les scripts du clone chargent explicitement le fichier voulu avant `next` via `scripts/with-env.mjs`; par defaut, `dev`, `build` et `start` utilisent `.env.sandbox`.
