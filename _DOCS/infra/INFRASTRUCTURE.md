# Infrastructure Firebase, Next.js et environnements

Derniere mise a jour: 2026-08-04
Statut: `PREPROD_READY - PRODUCTION_DEFERRED`

## 1. Runtime et gestionnaire de paquets

| Element | Contrat |
| --- | --- |
| Node.js | `22.x` |
| gestionnaire | `pnpm 11.7.0` |
| Next.js | `16.3.x`, Turbopack par defaut |
| React | `19.2.x` |
| Functions | Node 22 dans le package prive `functions/` |

Node 24 local ne doit pas devenir la reference tant que `engines`, CI, App Hosting et Functions imposent Node 22. La migration Next.js 16.3 est qualifiee localement sous Node 22; son deploiement doit encore etre qualifie sur le sandbox avant toute promotion.

Next.js 16.3 conserve ici le modele de cache historique. `cacheComponents`,
`partialPrefetching`, le React Compiler Rust et `experimental.useOffline` ne
sont pas actifs. Turbopack est le bundler standard de developpement et de
build; aucun fallback Webpack ne doit etre ajoute sans incompatibilite prouvee.

La publication 16.3 etant recente, `pnpm-workspace.yaml` porte une exception
`minimumReleaseAgeExclude` bornee aux paquets Next/SWC 16.3.0 effectivement
verrouilles. Elle ne permet aucune autre famille ou version et pourra etre
retiree apres la fenetre de refroidissement du registre.

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

Firebase classe les versions de framework plus recentes que sa version active
comme preview App Hosting. Le build local ne suffit donc pas a qualifier Next
16.3: un rollout sandbox et les smokes ISR/catalogue/navigation restent requis
avant toute promotion.

Qualification locale du 2026-08-04 sous Node 22.22.3:

- build Turbopack complet, 52 pages generees sur 52;
- compilation Turbopack observee a 6,8 s a froid puis 1,2 s avec cache chaud;
- build Webpack de controle sous Next 16.3 compile en 14,6 s;
- contrats lint, Auth, catalogue, SEO, routes, mobile et cache de deploiement
  valides;
- smoke du serveur final: `/`, `/a-propos`, `/admin` et `/robots.txt` en 200,
  revalidation catalogue sans authentification refusee en 401;
- aucun deploiement cloud effectue; le rollout sandbox reste la prochaine gate.

Serveur local accessible sur le reseau:

```bash
npm run dev:host
npm run dev:host:auto
```

`dev:host` conserve le port previsible `3000`. `dev:host:auto` teste les ports a partir de `3000`, transmet le premier port libre a Next et affiche les URL cliquables bureau et telephone sur le meme Wi-Fi.

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

Le runtime source de `main` converge vers `europe-west1` via
`functions/helpers/runtime.js`. Les 23 doublons `us-central1` sans execution sur
sept jours ont ete supprimes du sandbox le 2026-07-29. Les cinq Functions
uniques conservees dans cette region sont `grantAdminOnAuth`,
`e2eCheckoutProof`, `e2eStripeHardeningProof`, `stripeWebhook` et
`stripeConnectWebhook`; elles ne doivent pas etre supprimees comme de simples
doublons.

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
functions/.env.secondevienextjsssr.example
                           parametres non secrets Functions sandbox
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
- `PAYMENT_LINK_HMAC_SECRET`, signature opaque des liens admin sans compte;
- `E2E_PROOF_TOKEN`;
- `SUPER_ADMIN_EMAIL`.
- `CATALOG_REVALIDATION_HMAC_SECRET` pour l'appel machine Function -> App Hosting.

`PAYMENT_LINK_HMAC_SECRET@1` est provisionne dans Secret Manager depuis le
2026-08-01 et attache uniquement aux Functions du rail de paiement admin. Sa
valeur aleatoire est distincte des secrets OTP et catalogue. Sa rotation
invalide les URL non payees en circulation et doit donc etre planifiee.

Etat Secret Manager verifie le 2026-07-29 apres nettoyage definitif:

- le build App Hosting actif `build-2026-07-29-011` reference uniquement
  `SUPER_ADMIN_EMAIL@3` et `CATALOG_REVALIDATION_HMAC_SECRET@3`;
- 14 anciennes versions Gmail, Stripe, E2E, super-admin et HMAC catalogue ont
  ete detruites immediatement apres confirmation explicite; leurs versions
  courantes sont restees actives;
- les trois secrets orphelins `ANALYTICS_SESSION_HMAC_KEY`,
  `ANALYTICS_AUDIENCE_HMAC_KEY` et `ANALYTICS_BROWSER_HMAC_KEY` ont ete
  supprimes avec leurs six versions, apres verification qu'aucun build actif,
  Function deployee ou code executable courant ne les reference;
- Secret Manager contient desormais 11 secrets et 11 versions actives, soit
  une seule version utile par secret;
- le delai de destruction de sept jours a ete restaure sur les secrets
  rotatifs concernes pour proteger les futures rotations.

Parametres non secrets:

- `TRANSACTIONAL_EMAIL_PROVIDER`, valeur par defaut `gmail`;
- `RESEND_FROM_EMAIL`, vide tant que le domaine n'est pas valide.
- `BILLING_GUIDE_MODE`, valeur par defaut et rollback `disabled`;
- `BILLING_GUIDE_TEST_UID`, UID unique autorise en mode `test`;
- `BILLING_GUIDE_LIVE_UID`, UID unique de la cliente en mode `live`;
- `BILLING_GUIDE_TECHNICAL_EMAIL`, adresse Google technique que la cliente ajoute au compte Billing.

Les parametres du guide sont lus exclusivement par les Functions. Aucun mode, UID cible ou e-mail technique n'est fixe dans le bundle navigateur. Un mode inconnu, un UID cible absent ou une erreur de configuration echoue ferme: le guide n'est impose a personne. La collection `sys_billing_onboarding` est backend-only dans `firestore.rules`.

Le guide ne depend d'aucun service account Cloud Billing, d'aucune cle JSON et d'aucun OAuth Google. Le rattachement de projets et les budgets restent des operations manuelles hors du site. Il ne faut donc pas activer l'API Cloud Billing ni ajouter de permissions projet pour tester seulement l'interface.

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

Le contrat de coherence entre versions navigateur, assets Next et rollouts est
detaille dans
[DEPLOIEMENT_CACHE_CLIENT.md](DEPLOIEMENT_CACHE_CLIENT.md). Chaque build doit
embarquer un `deploymentId` unique et les pages ISR ne doivent pas conserver la
fenetre stale annuelle par defaut.

Le dashboard local est l'entree conseillee:

```bash
npm run dashboard
npm run dashboard -- --status
```

Il doit rester limite au projet `secondevienextjsssr` et au backend sandbox. Pour un deploiement cible, verifier explicitement `firebase use`, le codebase et les secrets requis.

Ne jamais utiliser un `firebase deploy` sans `--only` pendant une passe ciblee.

Optimisation de cout appliquee le 2026-07-29:

- inventaire final Functions: 91, dont 86 en `europe-west1` et 5 uniques en
  `us-central1`;
- politiques Artifact Registry actives sur les deux depots
  `gcf-artifacts`: suppression apres sept jours et conservation de la version
  la plus recente par package, apres dry-run sans candidat;
- meme politique active sur le depot gere App Hosting
  `firebaseapphosting-images`, apres inventaire d'un seul package et d'une
  seule version courante, sans candidat age de plus de sept jours;
- le smoke Stripe a confirme la cle sandbox et la signature du webhook v2 avec
  un evenement sans effet metier;
- le smoke catalogue a confirme l'authentification HMAC, puis revele que le
  build deploye compare l'audience a l'URL interne Cloud Run. Le code source
  compare desormais le contrat a `publicEnv.siteUrl`; ce correctif sera actif
  au prochain rollout App Hosting, qui devra etre suivi d'un nouveau smoke
  complet de revalidation.

Etat commerce sandbox au 2026-07-28:

- App Hosting `rollout-2026-07-28-006` /
  `build-2026-07-28-009` `SUCCEEDED`;
- indexes commerce `READY`;
- Functions Gate 7A en `europe-west1`: checkout fixture, dispatcher outbox,
  reconciler operations et commandes admin de statut/rebuild/cleanup;
- manifeste immutable `release_gate7a_c5259a87f875_f00378380561`, SHA
  `c5259a8`;
- controle revision 7: `newCheckoutMode=v2_fixture` limite a
  `fixture_gate6_20260728`, mutations admin `read_only`, offline `off`;
- sante operations `healthy`, compteurs de divergence a zero et TTL commerce
  explicitement desactivee;
- webhooks historiques maintenus en `us-central1`; le cleaner legacy
  `cleanupPendingPayments` a ete retire le 2026-07-29 apres verification de
  son absence d'effet et de 67 executions inutiles sur sept jours;
- Rules Firestore/Storage restrictives publiees apres le rollout UI;
- aucun rail production ni flag transactionnel public active.
- Gate 7B verte deux fois avec 11 scenarios par run;
- Gate 8 fermee sur fixtures avec rapprochement final vide, operations
  `healthy`, cleanup borne sans suppression et controle revision 22;
- endpoint Stripe Connect sandbox actif:
  `stripeConnectWebhookV2` en `europe-west1`;
- UI fixture refermee apres recette, mutations admin `read_only`, offline
  `off`; aucune cible live ou production activee.

Le transport Gmail sandbox utilise un mot de passe d'application dedie stocke
uniquement dans Secret Manager sous `GMAIL_PASSWORD`. En cas de `EAUTH`, la
rotation consiste a creer une nouvelle version du secret, redeployer seulement
le dispatcher outbox, reprendre les entrees echouees puis verifier
`providerMessageId`; aucun mot de passe ordinaire, mot de passe d'application
ou fichier temporaire ne doit rester dans le depot ou les rapports. Cette
rotation ne resout pas la reputation Gmail: la delivrabilite finale reste
conditionnee au domaine expediteur Resend et a ses DNS.

Rollout e-mail v2 du 2026-07-30:

- 15 Functions Auth/commerce ciblees `ACTIVE` en `europe-west1`;
- App Hosting `build-2026-07-30-019` `READY`, rollout `SUCCEEDED`;
- URL admin avec `order_id` et `/mes-commandes` verifiees en HTTP `200`;
- aucun flag commerce, rail live ou cible production n'a ete active.

Correctif transport Auth OTP du 2026-07-31:

- App Hosting `build-2026-07-31-003`, rollout `SUCCEEDED` a 19:14:46
  Europe/Paris;
- `/galerie` verifiee en HTTP `200` et chunk Auth public controle;
- aucune Function, rule, donnee, configuration commerce ou cible production
  modifiee.

Deploiement commerce/admin du 2026-08-01:

- commit `bd86467` pousse sur `origin/main`;
- App Hosting sandbox deploye, Cloud Build
  `e6b6fc20-823d-4533-ad22-fb7ec35c7919` `SUCCESS`;
- liens de paiement, expiration planifiee, demandes client de retour et quatre
  callables de facturation manuelle `ACTIVE` en `europe-west1`;
- `PAYMENT_LINK_HMAC_SECRET@1`, Rules Firestore/Storage et nouveaux index
  deployes; index liens de paiement `READY`;
- smokes `/`, `/admin`, `/payer/...` et `/api/catalog/version` en HTTP `200`;
- callable publique sans App Check refusee en HTTP `401`;
- controle commerce revision 62: `v2_fixture`, `read_only`, offline `off`,
  operations `healthy` et compteurs a zero; aucune fenetre `v2_all` ouverte.

Activation fonctionnelle sandbox du 2026-08-02:

- App Hosting sandbox et six Functions catalogue redeployes avec succes;
- smokes `/`, `/admin`, `/checkout` et `/api/catalog/version` en HTTP `200`;
- controle commerce revision 63: `v2_all`, mutations admin `v2`, offline `off`;
- policy active `sandbox_transactional_policy_20260802`;
- operations `healthy` et compteurs a zero;
- Stripe reste en mode test; aucun rail live ou production active.

## 11. Rollback

App Hosting:

1. ouvrir les rollouts du backend sandbox dans Firebase Console;
2. pour le lot commerce Gate 7A du 2026-07-28, le precedent stable est
   `rollout-2026-07-28-002` / `build-2026-07-28-003`;
3. lancer le rollback;
4. verifier `/`, `/produit/...`, Auth et la zone touchee;
5. consulter les logs Functions si le changement les concernait.

Functions/rules:

- conserver la liste des exports avant changement;
- deployer un codebase ou une Function cible;
- restaurer le commit stable et redeployer la meme cible en cas de regression;
- ne pas restaurer des rules permissives pour contourner un incident.
- ne pas recreer les neuf doublons mutateurs legacy supprimes en
  `us-central1`.

Rollback specifique au guide:

1. remettre le parametre `BILLING_GUIDE_MODE=disabled`;
2. verifier avec le compte cible que les onglets admin s'ouvrent normalement;
3. si le code lui-meme regresse, restaurer la version stable de l'App Hosting et des cinq callables;
4. laisser les documents `sys_billing_onboarding` en place pendant le diagnostic: ils sont inaccessibles au client et ne bloquent rien en mode `disabled`;
5. ne jamais desactiver la facturation d'un projet Google pour rollbacker une interface.

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
