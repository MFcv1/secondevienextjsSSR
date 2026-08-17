# Centre de suivi Firebase, App Hosting et migration Gen2

Derniere mise a jour: 2026-08-16

Statut: `CENTRE_DE_SUIVI_ACTIF - G1_TERMINEE - G2_TERMINEE - G3_TERMINEE - G4_A2_EN_COURS`

Proprietaire: mainteneur Seconde Vie et agent d'execution des phases validees

Condition de cloture: toutes les gates autorisees sont fermees, les preuves et
rollbacks sont consignes, les decisions durables sont fusionnees dans `_DOCS`,
puis ce centre temporaire est retire selon la gouvernance documentaire.

## 1. Contenu centralise

Ce dossier est l'unique point d'entree du chantier:

| Document | Role |
| --- | --- |
| [AUDIT_ARCHITECTURE_APP_HOSTING.md](AUDIT_ARCHITECTURE_APP_HOSTING.md) | photographie read-only de l'architecture Firestore, App Hosting, donnees, fiabilite et risques |
| [AUDIT_MIGRATION_FUNCTIONS_GEN2.md](AUDIT_MIGRATION_FUNCTIONS_GEN2.md) | contre-audit des 152 Functions cloud et 157 exports locaux, prerequis fiabilite, architecture cible, phases G0-G13, gates, rollbacks et prompt d'execution |
| `README.md` | tableau de bord vivant, journal des executions et point de reprise obligatoire |

Le dossier racine `Gen2/` a ete remplace par cette centralisation. Aucun contenu
de l'audit Gen2 n'a ete supprime.

## 2. Sources de verite

En cas de contradiction:

1. demande actuelle explicite de l'utilisateur;
2. code et configuration executables;
3. `AGENTS.md`;
4. `map.md`;
5. chapitres canoniques `_DOCS`;
6. audit Gen2;
7. audit d'architecture historique;
8. ce tableau de suivi, qui ne doit contenir que l'etat prouve.

## 3. Baseline avant execution

| Controle | Etat prouve |
| --- | --- |
| Functions cloud | 152 actives: 139 Gen1 et 13 Gen2 |
| exports locaux | 157, dont 5 Instagram locaux sous `HOLD_META_RECONCILIATION` |
| cible maximale cloud actuel | 149 Gen2 et 3 exceptions Auth Gen1, avant retraits prouves |
| cible maximale si les 5 Instagram sont conserves | 154 Gen2 et 3 Auth Gen1, avant retraits prouves |
| configuration Gen2 actuelle | CPU 1 et max 20 sur 13/13; concurrence 80 sur 12, worker image 4; options source encore implicites |
| garde de deploiement | wrapper fail-closed actif; projet/codebase/commit/manifeste/digest/allowlist obligatoires, dix cibles maximum et une seule cible finance/webhook/scheduler |
| projet operateur | Firebase cible correcte; `gcloud` global observe sur `vibefx-v2`, donc projet explicite obligatoire |
| dispatcher reservations | v3 sur SA dedie; expiration Stripe test et replay scheduler sans effet prouves |
| incident commerce | incident ferme par deux ecritures auditees; aucun replay/refund/restock, sante `healthy` |
| recuperation Firestore | delete protection, PITR 7 jours, backups quotidien/hebdomadaire actifs et backup `READY` |
| restauration | restore nomme `restore-drill-20260815-a` reconcilie, isole et sans trafic |
| Storage | soft delete 7 jours sur buckets media/catalogue, versioning absent, restauration non testee |
| observabilite | 5 metriques logs, 8 policies, dashboard, e-mail primaire et Pub/Sub secondaire testes |
| budget/quota | budget Billing non verifie; aucune alerte quota confirmee |
| produits legacy | 10 meubles sans `inventoryVersion` |
| commandes legacy | 26 sur 125 |
| runtime | Node 22 deprecie le 2027-04-30 et retire le 2027-10-31; succession a planifier |
| production | rail Firebase/App Hosting/Stripe live absent et hors de ce chantier sandbox |
| tests historiques | 127 commerce + 14 catalogue + 5 retention = 146 verts, non rejoues pendant l'inventaire |
| mutations de l'audit | aucun deploiement, paiement, build, charge ou ecriture Firestore |

## 4. Regles de mise a jour du suivi

L'agent charge d'une phase doit:

1. lire ce fichier puis les deux audits complets;
2. regenerer les compteurs avant toute action cloud;
3. modifier le statut uniquement avec une preuve reproductible;
4. renseigner tests, cible, revision, logs, donnees touchees et rollback;
5. ne garder qu'une phase `EN_COURS` a la fois;
6. marquer `BLOQUEE` avec la condition exacte, jamais avec une hypothese vague;
7. ne marquer `TERMINEE` que lorsque toutes les gates de la phase sont fermees;
8. mettre a jour les chapitres canoniques dans le meme changement si
   l'architecture executable evolue.

Valeurs autorisees:

- `A_FAIRE`;
- `EN_COURS`;
- `BLOQUEE`;
- `TERMINEE`;
- `NON_APPLICABLE_PREUVE`.

## 5. Tableau de progression G0-G13

| Phase | Objet | Statut | Gate de sortie essentielle | Preuve/compte rendu |
| --- | --- | --- | --- | --- |
| G0 | baseline 152/157, manifeste, hold Meta et wrapper de deploiement | `TERMINEE` | projet explicite, zero ecart, deploy global fail-closed, cinq Instagram en hold | manifestes `apphostingaudit/manifests/functions-*-g0.json`, journal section 8 |
| G1 | alertes, DR/restore, sante/incident et preuve des workers | `TERMINEE` | quatre P0 fermes; Stripe test borne uniquement | manifestes `functions-gen2-g1-*.json`, journal G1 |
| G2 | socle Gen2 puis stabilisation ciblee des 13 Gen2 actuelles | `TERMINEE` | 13/13 Gen2 deployees et observees, inventaire sans drift, rollback conserve | `functions-gen2-g2b-closeout.json` |
| G3 | decisions retrait/migration legacy, E2E, maintenance, publication historique | `TERMINEE` | six retraits differes G12-A, commandes Stripe fail-closed, zero suppression | `functions-gen2-g3-decisions.json` |
| G4 | analytics | `EN_COURS` | parite, App Check, caches concurrents, observation acceleree autorisee | A2 ACTIVE; build Gen2 READY puis rollback exact apres gate Auth |
| G5 | Auth callables, OTP et passkeys | `A_FAIRE` | Auth complete, parcours sandbox et rollback client | a renseigner |
| G6 | catalogue admin, devis, newsletter, e-mail et factures | `A_FAIRE` | writers/readers et trigger devis sans double effet | a renseigner |
| G7 | Meta et reconciliation Instagram | `A_FAIRE` | hold leve par preuves, OAuth/secrets/rollback valides | a renseigner |
| G8 | commerce non financier, lectures et hygiene P1 | `A_FAIRE` | stock/prix/KPI/cohortes sans divergence | a renseigner |
| G9 | checkout, Connect, refunds, schedulers et workers | `A_FAIRE` | une cible a la fois, owner explicite, Stripe test borne | a renseigner |
| G10 | webhooks Stripe v2 Gen2 | `A_FAIRE` | signatures, double endpoint deduplique, zero double effet | a renseigner |
| G11 | maintenance destructrice | `A_FAIRE` | AAL2, dry-run, sauvegarde, instance/concurrence 1 | a renseigner |
| G12 | retrait cible Gen1 puis nettoyage differe | `A_FAIRE` | G12-A garde le rollback; G12-B nettoie apres fenetre approuvee; trois Auth restent | a renseigner |
| G13 | charge/cout/IAM/runtime et cloture documentaire | `A_FAIRE` | sandbox migre et durci, runtime futur planifie, docs fusionnees | a renseigner |

## 6. Suivi des risques et ordre corrige

| Niveau | Action | Statut courant | Gate exacte |
| --- | --- | --- | --- |
| P0 | baseline projet/manifeste et deploiement fail-closed | `TERMINEE` | projet explicite, 152/157 reconcilies, wrapper allowlist teste |
| P0 | alertes, canaux, dashboard et runbooks | `TERMINEE` | ouverture, notification, acquittement et retour testes |
| P0 | PITR, protection, backups et restauration | `TERMINEE` | backup `READY`, base nommee, RPO/RTO et DR cross-service prouves |
| P0 | `terminal_refund_conflict` et faux `healthy` | `TERMINEE` | `healthy -> stop -> healthy`, resolution auditee sans replay/refund/restock |
| P0 | dispatcher et contrat des workers | `TERMINEE` | expiration Stripe test, effet unique et replay scheduler sans effet |
| P1 | 10 produits, 26 commandes, KPI et reconciler borne | `A_FAIRE` | dry-run/backup/preconditions, cohortes, pagination/`truncated` |
| P1 | budgets, quota, charge et cout | `A_FAIRE` (budget non verifie) | operateur Billing, alertes quota, charge sandbox mesuree |
| P2 | analytics historiques | `A_FAIRE` (classification partielle) | export/quarantaine puis decision de retention post-cutover |

Les P0 bloquent les paiements reels et les vagues Gen2 cloud. Ils ne bloquent
pas une presentation cliente du sandbox en Stripe test, bornee et surveillee.
Les P1/P2 ne doivent pas retarder la demo par eux-memes.

Un statut partiel dans cette section ne signifie pas qu'une phase ulterieure a
commence: seul le journal d'execution fait foi. G1, G2 et G3 sont fermees; la
prochaine phase est G4 analytics.

## 7. Fiche obligatoire pour chaque vague

Copier ce bloc sous la section Journal avant chaque execution:

```text
### Vague <ID> - <titre>

- Date/heure et fuseau:
- Agent/operateur:
- Branche et commit de depart:
- Projet/environnement:
- Phase et fonctions exactes:
- Generation/region avant:
- Cible Gen2 et revision:
- Appelants bascules:
- Compte runtime/build:
- Secrets attaches, noms uniquement:
- Concurrence/min-max/memoire/timeout:
- Donnees lues:
- Donnees ecrites:
- Tests locaux:
- Probes sandbox positives/negatives:
- Logs/metriques avant-apres:
- Incidents:
- Rollback execute et resultat:
- Documentation mise a jour:
- Decision: poursuivre / corriger / rollback / bloquer
- Prochaine action autorisee:
```

## 8. Journal d'execution

### G0 - reconciliation et classification

- Date/heure et fuseau: 2026-08-15, Africa/Casablanca;
- agent/operateur: Codex / compte CLI Google consigne dans le manifeste;
- branche et commit de depart: `codex/functions-gen2-migration`,
  `f80dc7213a8d738fb1edde11a926028bcb57ab28`;
- projet/environnement: sandbox `secondevienextjsssr`, confirme par
  `gcloud projects describe --project=secondevienextjsssr` et Firebase CLI;
  le projet `gcloud` global reste `vibefx-v2` et n'a jamais servi de cible
  implicite;
- outils: Node `22.22.3`, pnpm global `11.19.0` contre baseline `11.7.0`,
  Firebase CLI locale epinglee `15.26.0`;
- inventaire: 157 exports locaux uniques, 152 Functions cloud `ACTIVE`,
  139 Gen1, 13 Gen2, 146 en `europe-west1`, 6 en `us-central1`;
- classification: 13 `KEEP_GEN2`, 3 `KEEP_GEN1_AUTH`, 116 `MIGRATE`,
  20 `MIGRATE_OR_RETIRE`, 5 `HOLD_META_RECONCILIATION`;
- plateforme: 8 schedulers `ENABLED`, 2 queues `RUNNING`, 7 triggers
  Eventarc (6 `eur3`, 1 `us-central1`), 152 politiques invoker rapprochees;
- manifestes:
  `apphostingaudit/manifests/functions-g0.json`,
  `apphostingaudit/manifests/functions-platform-g0.json` et
  `apphostingaudit/manifests/functions-g0-digests.json`;
- garde: `functions/package.json` ne contient plus de deploy global; le
  wrapper `scripts/deploy-functions-targeted.mjs` refuse projet/codebase/HEAD/
  manifeste/digest incoherents, inputs non committes, allowlist vide ou
  superieure a dix, cible hors manifeste, les cinq Instagram et tout lot de
  plus d'une cible finance/webhook/scheduler;
- Meta: les cinq exports Instagram directs sont utilises par l'UI locale mais
  absents du cloud. La suppression cloud du chantier securite a precede le
  merge `6be360e` qui les a reintroduits dans le source. Les preuves M4/M5 du
  runbook sont donc historiques, pas l'etat cloud actuel. Decision G0:
  `HOLD_META_RECONCILIATION`, sans redeploiement ni suppression avant G7;
- drifts documentaires: ancien inventaire 91 dans Infrastructure, statut
  operationnel Instagram direct, reutilisation temporaire de `appspot` et
  options runtime implicites des 13 Gen2; corrections fusionnees dans les
  chapitres canoniques touches et le plan;
- risques mesures a fermer avant les vagues concernees: 70 options runtime
  source/cloud implicites sur les 13 Gen2, 31 exports dont l'idempotence reste
  `NOT_PROVEN_STATIC`, et 136 cibles actuelles sur le compte runtime historique
  `appspot`; aucun nouveau nom Gen2 ne peut reutiliser cette identite;
- tests: `npm run test:functions-g0`, `npm run lint:functions` et controles
  documentaires sont consignes a la cloture de G0;
- donnees/ecritures cloud/deploiement/paiement/build/suppression: aucun;
- decision: G0 fermee; ne pas commencer G1 sans autorisation explicite.

Premier lot local G2 propose, non execute: `G2-A1_SOCLE_SANS_BASCULE`, avec
adaptateur callable Gen2 commun, registre client identite par defaut et profils
runtime cibles sans `setGlobalOptions`. Aucune cible n'est remappee. Rollback
exact: revert du commit local G2-A1; aucun rollback cloud, donnees, IAM, secret,
endpoint ou App Hosting puisque le lot reste non deploye.

### G1 - fiabilite, incident et workers

- date/fuseau: 2026-08-15, Africa/Casablanca;
- branche: `codex/functions-gen2-migration`; commits G1 jusqu'au runner de
  preuve `6a48a09db7fbd47f00efc79d298a068872e3a126`;
- projet: sandbox `secondevienextjsssr`, toujours passe explicitement aux CLI;
- observabilite: cinq metriques logs, huit policies, dashboard, canal primaire
  e-mail et secondaire Pub/Sub testes en ouverture, resolution et
  acquittement;
- reprise: delete protection, PITR 7 jours, schedules quotidien 14 jours et
  hebdomadaire 14 semaines; backup `READY`; restore nomme isole reconcilie,
  RPO 1 374 s et RTO gere 1 064 s;
- sante: reconciler v12 sur SA dedie; transition `healthy -> stop` prouvee,
  incident financier ferme par deux ecritures auditees, puis retour
  `healthy`, zero incident et aucune troncature; aucun replay, refund, fait
  financier, commande ou stock modifie par la resolution;
- workers: reservation v3, outbox v11 et liens de paiement v5, chacun deploye
  seul, SA dedie, secrets resource-level, 512 MB, 300 s, max instances 1 et
  retry Function desactive;
- preuve reservation: fixture deterministe `e2eOnly`, Stripe test, stock
  10 -> 9 -> 10, annulation fournisseur avant mouvement `release`, puis second
  run sans effet; `releasedQty: 1`, `restockedQty: 0`, zero refund/replay/delete;
- preuves machine:
  `functions-gen2-g1-runtime-iam.json`,
  `functions-gen2-g1-worker-iam.json`,
  `functions-gen2-g1-worker-rollout.json`,
  `functions-gen2-g1-restore.json`,
  `functions-gen2-g1-cross-service.json` et
  `functions-gen2-g1-data-plan.json`;
- donnees de preuve conservees: un produit fixture, une commande annulee, une
  reservation et ses mouvements; aucune suppression de donnees;
- rollback: non execute. Pour une cible, redeployer seulement la source
  `f80dc7213a8d738fb1edde11a926028bcb57ab28` depuis un worktree isole en
  conservant le SA dedie, build SA, secrets/versions, topic, Node 22, 512 MB,
  timeout 300 s, max 1, no-retry et ingress; ne jamais restaurer appspot;
- tests: `test:functions-g0` 19/19, lint cible du runner, audits G1 apres chaque
  worker; les deux E2E Stripe interdits n'ont pas ete lances;
- deploiements: quatre Gen1 cibles au total pendant G1 (reconciler et trois
  workers), toujours par allowlist d'une cible; aucun App Hosting/Gen2/prod;
- verdict: `G1_TERMINEE_G2_A_LOCAL_ONLY`. Budget Billing reste `NON_VERIFIE`;
  G2-B n'est pas commence.

### G2-A1 - projection stats locale

- cible: `onOrderStatsWrite`, aucun deploy;
- code: projection transactionnelle depuis la commande autoritaire et ledger
  `order_stats_projections/{orderId}` backend-only;
- runtime cible: CPU 1, concurrence 1, min 0, max 1, 256 MiB, 60 s, retry
  explicite, SA dedie `order-stats-projector` a creer seulement en G2-B;
- plan read-only: 126 commandes, 26 legacy, 0 ledger existant, 26 manquants;
- reconciliation: dashboard exact (5 665, 24 commandes) et huit jours exacts,
  zero drift;
- garde: une commande legacy historique sans ledger echoue avant increment;
  `deploymentAllowed: false` dans
  `manifests/functions-gen2-g2a-stats.json`;
- tests: `test:functions-g2a` 12/12, compatibilite/Gate 7A 24/24,
  `test:functions-g0` 19/19, `test:retention` 5/5 et lint Functions vert;
- ecritures cloud/IAM/rules/deploiement: aucune;
- lot catalogue local: `onCatalogSourceWrite`, `catalogReconciler` et
  `catalogMediaGarbageCollector` portent CPU/concurrence/min-max explicites;
  retry event actif et retry schedulers a zero; catalogue core 14/14 et
  resilience 18/18, aucun deploy;
- lot publication local: vrai retry Eventarc apres persistance d'echec image,
  worker borne a concurrence/max 4, deux schedulers concurrence/max 1 et retry
  zero, futur SA dedie `product-publication-worker`; aucun IAM/deploy;
- lot e-mail local: ledger/claim, huit tentatives, Gmail ambigu sans retry,
  concurrence/max 1, futur SA `legacy-order-email-worker`, TTL 90 j a activer;
- lot Tasks local: mesure p99 read-only puis runtime/deadline 300 s et
  concurrence/max 1; queues cloud inchangees;
- lot artefacts local: quarantaine idempotente, futur SA
  `catalog-media-enqueuer`, aucune suppression de sous-collection;
- cloture G2-A: manifeste des treize cibles et matrice IAM/rollback consolides;
  aucune G2-B avant seed stats, IAM et TTL.

Le manifeste consolide `manifests/functions-gen2-g2a-plan.json` couvre les 13
cibles et porte le verdict
`G2_A_LOCAL_COMPLETE_G2_B_BLOCKED_ON_DATA_IAM_TTL`, avec
`deploymentAllowed: false`. G2-A est donc fermee localement; la prochaine
action n'est pas un deploy mais la preparation auditee des preconditions G2-B.

### G3 - decisions legacy sans retrait cloud

- projet effectif: `secondevienextjsssr` sur toutes les lectures; projet
  gcloud global `vibefx-v2` ignore par garde explicite;
- six Functions Gen1 actives reconciliees avec runtime, revision, IAM,
  compte runtime/build, secrets et 30 jours de logs;
- decision: six `RETIRE_G12_A`, zero cible Gen2 a creer et zero suppression;
- publication historique: aucun des quatre appels n'est importe par
  `AdminForm`, qui utilise `createPublishedProductAdmin`; collection
  `product_publication_sessions` a zero document;
- Stripe: `E2E_PROOF_ENABLED` absent, preuves desactivees; commandes
  `e2e:hosted-stripe` et `e2e:refund-stripe` remplacees par un refus
  fail-closed, scripts historiques conserves;
- activite: aucune execution apres le 11 aout; le 500 de
  `e2eStripeHardeningProof` est le containment `COMMERCE_READ_ONLY` attendu;
- rollback G3: revert local de la neutralisation package; aucune restauration
  cloud ou donnees car aucune ecriture cloud n'a eu lieu;
- manifeste: `manifests/functions-gen2-g3-decisions.json`;
- tests: `test:functions-g3` 4/4, `test:functions-g0` 21/21,
  `test:functions-g2a` 26/26, lint Functions et inventaire
  157/152/139/13 + 8 schedulers/2 queues/7 Eventarc verts.

### G4-A1 - trackAdminIP Gen2, cutover en observation

- huit Gen1 analytics reconciliees; 345 sessions dont 148 marquees actives,
  zero clic affilie et 52 entrees IP admin, en lecture seule;
- trois suppressions admin placees sous
  `HOLD_G11_DESTRUCTIVE_PRECONDITIONS`, aucune invocation ou cible Gen2;
- drift corrige localement: 66 fermetures beacon en 415 car le client envoie
  `text/plain`; origine, taille et token restent obligatoires;
- course corrigee localement: mise a jour `admin_ips` transactionnelle;
- cible unique `trackAdminIPGen2`, CPU `gcf_gen1`, concurrence 1, min 0,
  max 1, 256 MiB, 60 s, App Check, SA dedie `analytics-runtime`;
- registre client bascule uniquement `trackAdminIP` vers `trackAdminIPGen2`;
- wrapper `gcloud-gen2-create` refuse cible existante, mauvais projet,
  manifeste bloque ou plus d'une cible;
- IAM applique: `analytics-runtime` porte exactement datastore user, log writer
  et service usage consumer, sans secret, cle, Editor ou Owner; gate de
  creation de la cible unique levee;
- tests locaux avant et apres cutover: G4 9/9, G0 21/21, G2-A 26/26, G3 4/4,
  analytics, App Check et lint Functions verts;
- cloud: `trackAdminIPGen2` revision `00001-goj`, App Check refuse la probe
  invalide en 401 sans ecriture; avant preparation G4-A2, inventaire 158 source / 153 cloud /
  139 Gen1 / 14 Gen2, 8 schedulers, 2 queues et 7 Eventarc;
- App Hosting: build `build-2026-08-16-001` READY puis rollout SUCCEEDED,
  trafic 100 %, `/` et `/admin` 200, bundle servi
  `trackAdminIP -> trackAdminIPGen2`; build precedent exact
  `build-2026-08-13-002` conserve pour rollback;
- donnees: `sys_metadata/admin_ips` reste a 52 entrees et au meme updateTime;
  zero log/5xx Gen2 depuis la bascule initiale;
- borne temporelle levee explicitement par l'utilisateur; validation acceleree
  fermee avec deux appels admin Gen2 en 200, zero erreur, une IP attendue ajoutee
  puis rafraichie idempotemment et zero trafic Gen1;
- aucun ancien onglet pre-cutover ne subsistait dans Chrome; la preuve de
  compatibilite repose sur la Gen1 ACTIVE, version 9, endpoint/IAM/code preserves.

### G4-A2 - updateUserSessions Gen2, cutover ferme

- nouvel export local `updateUserSessionsGen2`; inventaire de travail 159
  exports locaux, cloud inchange a 153/139 Gen1/14 Gen2;
- handler unique partage avec `updateUserSessions` Gen1, donc logique Auth,
  classification admin/client et mutations de sessions identiques;
- runtime prepare: CPU `gcf_gen1`, concurrence 1, min 0/max 1, 256 MiB, 60 s,
  App Check et compte `analytics-runtime`, sans secret;
- manifeste/digest:
  `functions-gen2-g4-update-user-sessions.json` et
  `functions-gen2-g4-update-user-sessions-digest.json`;
- revision: `updateusersessionsgen2-00001-zoq`, ACTIVE, CPU 167m, concurrence 1,
  min 0/max 1, 256 MiB, 60 s, runtime/build SA conformes;
- App Check: appels sans jeton et avec jeton invalide refuses en 401 avant handler;
- garde: `deploymentAllowed=true`, `clientCutoverAuthorized=true`, registre
  source `updateUserSessions -> updateUserSessionsGen2`;
- validations: G4 11/11, G0 26/26, analytics, App Check et lint Functions verts;
- inventaire: 159 exports locaux, 154 Functions cloud, 139 Gen1 et 15 Gen2;
- rollback: Gen1 intacte et retour App Hosting exact au build READY
  `build-2026-08-16-001` sans suppression ni changement IAM/donnee.
- retry: `build-2026-08-17-001` READY/SUCCEEDED et registre Gen2 servi; session
  admin persistante et sante conformes, mais reconnexion Google interrompue
  avant Auth;
- rollback: `rollback-20260817-001` SUCCEEDED sert `build-2026-08-16-001`,
  `/` et `/admin` en 200, registre source Gen1, zero suppression de donnee.
- validation acceleree: rollout `g4-a2-cutover-20260817-002` SUCCEEDED vers
  `build-2026-08-17-001`; connexion admin Gen1 puis Gen2 en HTTP 200,
  Auth/App Check valides, donnees conformes, ancien onglet admin sain et zero
  nouvel appel Gen1 apres cutover;
- decision: G4-A2 fermee; prochaine cible unique `initLiveSessionGen2`.

### G4-A3 - initLiveSession Gen2, cutover ferme

- export parallele `initLiveSessionGen2` avec handler partage avec la Gen1;
- runtime `analytics-runtime`, CPU Gen1, concurrence 1, min 0/max 1,
  256 MiB, 60 s, App Check, sans secret;
- manifeste et digest ont borne le deploy a cette seule Function;
- tests: G4 13/13, analytics, App Check et lint Functions verts;
- revision `initlivesessiongen2-00001-hoh` ACTIVE, runtime/build/IAM conformes,
  deux probes App Check 401 avant handler;
- reference Gen1: HTTP 200, Auth et App Check valides;
- inventaire: 160 exports locaux, 155 cloud, 139 Gen1 et 16 Gen2;
- cutover: `g4-a3-cutover-20260817-002` SUCCEEDED sert
  `build-2026-08-17-002`; Gen1 et Gen2 ont retourne 200 avec Auth/App Check
  valides, les donnees observees sont equivalentes et zero nouvel appel Gen1
  suit le cutover final;
- investigation: un reload pilote a cree une seconde session sur Gen2 puis de
  facon identique sur Gen1; le handler partage et `test:analytics` prouvent la
  parite de reprise, sans regression Gen2;
- rollback exact: registre `initLiveSession` puis build
  `build-2026-08-17-001`; aucune suppression ou modification Gen1.
- decision: G4-A3 fermee; prochaine cible unique `syncSessionGen2`.

### G4-A4 - syncSession Gen2, preparation cible unique

- export parallele `syncSessionGen2` avec handler partage avec la Gen1;
- CPU Gen1, concurrence 1, min 0/max 1, 256 MiB, 60 s, App Check,
  `analytics-runtime`, sans secret;
- cible cloud absente, Gen1 et registre client preserves;
- manifeste machine et wrapper bornent le deploy a une seule Function;
- tests: G4 15/15, analytics, App Check et lint Functions verts;
- rollback futur: garder `syncSession` dans le registre et
  `build-2026-08-17-002`; aucune suppression ou modification de donnees.

## 9. Conditions d'arret immediat

Arreter la vague au premier:

- ecart entre cloud et exports non explique;
- mauvais projet, region, compte ou secret;
- utilisation du projet `gcloud` global sans verification explicite;
- deploy Functions global, allowlist vide/superieure a dix ou plus d'une cible
  finance/webhook/scheduler;
- export `HOLD_META_RECONCILIATION` present dans une allowlist;
- regression Auth/App Check ou fuite de secret;
- lancement de `e2e:hosted-stripe` ou `e2e:refund-stripe`;
- double commande, mouvement, e-mail, fait financier ou refund;
- divergence prix, stock, paiement, projection ou incident;
- sante stale/unknown presentee comme `healthy` ou worker incomplete presente
  comme succes;
- absence de rollback prouve;
- besoin de production, Stripe live ou suppression de donnees non autorise.

## 10. Point de reprise

La reprise courante prepare uniquement `syncSessionGen2`. App Hosting sert
`build-2026-08-17-002` avec `trackAdminIP`, `updateUserSessions` et
`initLiveSession` sur leurs cibles Gen2. Leurs Gen1, endpoints, IAM et code
restent preserves; les six retraits G3 restent differes a G12-A.
