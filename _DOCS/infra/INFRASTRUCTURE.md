# Infrastructure Firebase, Next.js et environnements

Derniere mise a jour: 2026-07-18
Statut: `PREPROD_READY - PRODUCTION_DEFERRED`

## 1. Runtime et gestionnaire de paquets

| Element | Contrat |
| --- | --- |
| Node.js | `22.x` |
| gestionnaire | `pnpm 11.7.0` |
| Next.js | branche 15 actuelle du `package.json` |
| React | 19 |
| Functions | Node 22 dans les deux packages |

Node 24 local ne doit pas devenir la reference tant que `engines`, CI, App Hosting et Functions imposent Node 22. Une migration majeure se fait dans une branche dediee avec build et E2E.

## 2. Etat des environnements

| Environnement | Etat | Identifiant |
| --- | --- | --- |
| local sandbox | actif | `.env.sandbox` charge par `scripts/with-env.mjs` |
| App Hosting sandbox | actif | backend `secondevie-next-sandbox` |
| Firebase sandbox/preprod | actif | projet `secondevienextjsssr` |
| production locale | fichier prepare | `.env.production`, a ne pas utiliser pour ecritures sans accord |
| Firebase/App Hosting production | absent | aucun alias/backend prod cable dans `.firebaserc` |

URL sandbox:

```text
https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app
```

Le sandbox est l'environnement de demonstration cliente. Il n'est pas le domaine final et ses passkeys seront a reenroler.

## 3. Topologie actuelle

```text
navigateur
  -> Firebase App Hosting, europe-west4
       -> Next App Router / API routes
       -> /api/catalog same-origin
       -> bucket catalogue prive, europe-west4
       -> Firebase Auth
  -> Cloud Functions privees, europe-west1
       -> trigger catalogue + Cloud Tasks + builder/revalidation
       -> Stripe
       -> Gmail actif / Resend prepare
```

App Hosting (`apphosting.yaml`):

- `minInstances: 0`;
- `maxInstances: 10`;
- `concurrency: 80`;
- `cpu: 1`;
- `memoryMiB: 512`.

`minInstances: 0` accepte les cold starts pour limiter le cout preproduction. Une instance chaude payante ne doit etre decidee qu'avec trafic et mesure production.

## 4. Codebases Functions

`firebase.json` declare:

| Codebase | Dossier | Role |
| --- | --- | --- |
| `main` | `functions/` | Auth, admin, commerce, email, analytics, maintenance et catalogue materialise |

Le runtime source de `main` converge vers `europe-west1` via `functions/helpers/runtime.js`. Des copies historiques `us-central1` peuvent encore exister dans le cloud comme rollback; leur suppression exige inventaire CLI, observation et rollback documente.

Le codebase public historique et Firebase Hosting ne font plus partie de la configuration. Les Functions SEO/`publicCatalog` historiques ont ete supprimees du sandbox le 2026-07-18 et le site Hosting `secondevienextjsssr` a ete desactive apres verification de l'URL App Hosting.

Catalogue materialise:

- bucket prive: `secondevienextjsssr-catalog-europe-west4`;
- queues Cloud Tasks: build et revalidation en `europe-west1`;
- comptes de service: `catalog-enqueuer` et `catalog-builder`; tous deux ont `run.invoker` uniquement sur `dispatchcatalogbuild`, car les triggers et les reconstructions peuvent signer les Cloud Tasks;
- runtime App Hosting: lecture d'objets uniquement sur le bucket catalogue;
- secret runtime: `CATALOG_REVALIDATION_HMAC_SECRET`;
- source publique unique: snapshot Storage, sans variable de selection ni fallback Firestore.

IAM reste ressource/cible autant que possible: l'enqueuer peut publier les tasks et invoquer les workers autorises; le builder peut lire Firestore, ecrire les releases/pointeurs, invoquer la revalidation et lire le secret HMAC. `firebase-app-hosting-compute` a `secretAccessor` et `secretmanager.viewer` uniquement sur le secret HMAC, ainsi que `objectViewer` sur le bucket catalogue. Ne pas elargir ces bindings au projet sans nouvelle justification.

## 5. Fichiers de configuration

```text
.firebaserc                 alias Firebase, sandbox seulement
firebase.json              rules, indexes, codebase main et App Hosting
apphosting.yaml            runtime et variables App Hosting sandbox
next.config.mjs            Next, images, headers, redirects
firestore.rules            autorisations Firestore
firestore.indexes.json     indexes et exemptions
storage.rules              autorisations Storage
.firebaseignore            exclusions de deploiement
.env.sandbox.example       contrat local sandbox
.env.production.example    contrat futur production
```

Les vrais `.env` sont locaux. Verifier avec `git ls-files` avant toute hypothese et ne jamais afficher leurs valeurs dans un rapport.

## 6. Variables publiques et secrets

Variables publiques typiques:

- configuration Web Firebase;
- region Functions cliente;
- cle publique Stripe;
- cle publique reCAPTCHA/App Check;
- URL et metadata du site;
- coordonnees metier destinees a l'affichage.

Secrets serveur centralises dans `functions/helpers/secrets.js`:

- `GMAIL_EMAIL`, `GMAIL_PASSWORD`;
- `RESEND_API_KEY`;
- `OTP_HMAC_SECRET`;
- `STRIPE_SECRET_KEY`, `STRIPE_WH_SECRET`, `STRIPE_CONNECT_WH_SECRET`;
- `E2E_PROOF_TOKEN`;
- `SUPER_ADMIN_EMAIL`.
- `CATALOG_REVALIDATION_HMAC_SECRET` pour l'appel machine Function -> App Hosting.

Parametres non secrets:

- `TRANSACTIONAL_EMAIL_PROVIDER`, valeur par defaut `gmail`;
- `RESEND_FROM_EMAIL`, vide tant que le domaine n'est pas valide.

## 7. E-mail transactionnel

L'adaptateur Gmail/Resend est implemente et teste. Pour la demonstration:

- Gmail reste actif;
- Resend ne doit pas etre active par erreur;
- la cle Resend existe dans Secret Manager;
- aucun expediteur Resend final n'est configure.

Bascule production seulement apres:

1. achat/validation du domaine final;
2. ajout du domaine dans Resend;
3. DNS SPF, DKIM et DMARC;
4. adresse From metier;
5. test limite et suivi delivrabilite;
6. changement du provider;
7. rollback Gmail temporaire documente.

Le sous-domaine `hosted.app` appartient a Google et ne peut pas servir de domaine expediteur gere par la cliente.

## 8. App Check

Le sandbox a ete configure et observe, mais l'enforcement production n'est pas acquis. Les webhooks, le SSR, les endpoints publics et les tests ont des besoins differents.

Commande read-only disponible:

```bash
node scripts/audit-app-check-service-state.mjs
```

Toute activation doit etre progressive et accompagnee d'un retour `UNENFORCED` prepare.

Pour un E2E ponctuel, un jeton debug peut etre enregistre uniquement avec autorisation explicite. Le role `roles/firebaseappcheck.admin` doit etre temporaire, le jeton revoque dans un `finally`, puis le role retire. Les appels REST avec identifiants utilisateur doivent porter `x-goog-user-project: secondevienextjsssr`; ne jamais journaliser le jeton.

## 9. Firebase Hosting legacy

Le bloc `hosting`, ses rewrites et les Functions SEO historiques ont ete retires. Le site Firebase Hosting sandbox `secondevienextjsssr` est desactive depuis le 2026-07-18; un nouveau deploiement Hosting explicite serait necessaire pour le reactiver. Le site public de reference reste exclusivement l'App Hosting `secondevie-next-sandbox`.

## 10. Deploiement sandbox

Le dashboard local est l'entree conseillee:

```bash
npm run dashboard
npm run dashboard -- --status
```

Il doit rester limite au projet `secondevienextjsssr` et au backend sandbox. Pour un deploiement cible, verifier explicitement `firebase use`, le codebase et les secrets requis.

Ne jamais utiliser un `firebase deploy` sans `--only` pendant une passe ciblee.

## 11. Rollback

App Hosting:

1. ouvrir les rollouts du backend sandbox dans Firebase Console;
2. choisir le dernier rollout stable;
3. lancer le rollback;
4. verifier `/`, `/produit/...`, Auth et la zone touchee;
5. consulter les logs Functions si le changement les concernait.

Functions/rules:

- conserver la liste des exports avant changement;
- deployer un codebase ou une Function cible;
- restaurer le commit stable et redeployer la meme cible en cas de regression;
- ne pas restaurer des rules permissives pour contourner un incident.

## 12. Conditions de creation du rail production

- [ ] domaine final choisi;
- [ ] projet Firebase ou strategie d'isolation prod approuvee;
- [ ] alias `.firebaserc` explicite;
- [ ] backend App Hosting prod;
- [ ] variables et secrets live separes;
- [ ] Stripe live + Connect + webhooks;
- [ ] Auth authorized domains et RP ID final;
- [ ] Resend et DNS;
- [ ] App Check decide;
- [ ] sauvegarde/restauration;
- [ ] budgets, quotas, logs et alertes;
- [ ] smoke desktop/mobile et recette cliente;
- [ ] runbook cutover et rollback date.

## 13. Gates infra

```bash
npm run infra:env
npm run infra:deploy
npm run appcheck:audit
npm run build
```

Les audits cloud necessitent une session CLI valide et doivent rester read-only sauf deploiement explicitement demande.
