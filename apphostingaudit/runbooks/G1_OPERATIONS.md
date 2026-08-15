# Runbook G1 - fiabilite du sandbox Functions

Derniere mise a jour: 2026-08-15

Statut: `G1_TERMINEE_G2_A_LOCAL_ONLY`

Projet unique: `secondevienextjsssr`

Environnement unique: sandbox

## 1. Invariants

- toujours passer `--project=secondevienextjsssr`;
- aucun Stripe live, aucun secret live et aucune production;
- aucun refund, replay financier, restock ou suppression pour diagnostiquer;
- ne jamais raccorder App Hosting, client, Gen1 ou Gen2 a une base de restore;
- ne jamais supprimer une base de drill, un backup ou une donnee sans
  approbation destructive et preconditions du plan;
- les logs/labels ne contiennent ni e-mail, UID, IP, orderId, provider ID ni
  secret.

## 2. Observabilite G1-A

Ressources appliquees le 2026-08-15:

- un canal e-mail primaire Monitoring;
- un canal secondaire Pub/Sub interne, avec topic et abonnement pull de drill;
- cinq metriques logs `secondevie_*` pour sante et workers;
- huit policies `G1 Sandbox - *` couvrant erreurs Gen1, 5xx Gen2, backlog
  Tasks, sante commerce, runs incomplets et heartbeats absents;
- dashboard `Seconde Vie Sandbox - Functions Gen2 G1`;
- les huit policies publient vers les deux canaux.

Le test synthetique du 2026-08-15 a ouvert l'alerte primaire puis a produit la
notification de resolution. La destination Gmail sandbox configuree n'a pas
ete promue automatiquement: le secours reste entierement interne au projet.
Pub/Sub a recu et acquitte un message d'ouverture et un message de resolution.
Le service agent Monitoring ne porte `pubsub.publisher` que sur le topic G1;
l'abonnement conserve les messages un jour et n'expire pas automatiquement.

Commande idempotente:

```bash
npm run functions:monitoring:g1
npm run functions:monitoring:g1 -- --apply
```

Test d'ouverture autorise: ecrire un seul log synthetique avec
`message=commerce_worker_incomplete`, `worker=g1_alert_test`, `test=true`, sans
identifiant metier. Verifier ensuite:

1. entree Logging recue;
2. metrique logs incrementee;
3. incident Monitoring ouvert;
4. notification recue sur le canal primaire;
5. acquittement documente;
6. fermeture apres disparition du signal;
7. repetition sur le canal secondaire lorsqu'il existe.

En incident reel: geler le deploiement et la mutation touchee, relever policy,
Function/revision, region, fenetre et compteurs sans PII, puis suivre le
runbook de domaine. Ne jamais desactiver signature, Auth, App Check ou Rules.

## 3. Protection Firestore G1-B

Etat applique le 2026-08-15 sur `(default)`/`eur3`:

- delete protection: activee;
- PITR: active, retention sept jours;
- backup quotidien: retention quatorze jours;
- backup hebdomadaire le dimanche UTC: retention quatorze semaines;
- premier backup `READY`: snapshot `2026-08-15T17:54:15.202270Z`, expiration
  `2026-08-29T17:54:15.202270Z`.

Base mesuree avant activation: `41 171 420` octets. A cette volumetrie, PITR,
28 copies de backup en regime stable et un restore de drill restent de l'ordre
de quelques centimes USD par mois selon les tarifs officiels du jour. Cette
estimation n'est pas un budget et doit etre rapprochee de Billing.

Les backups restent dans la localisation source `eur3`. Ils peuvent conserver
temporairement des donnees supprimees de la base active; la retention de
quatorze semaines est le maximum approuve pour ce drill sandbox et doit etre
reevaluee avec les obligations RGPD/comptables avant toute production.

## 4. Restore drill G1-C

Preconditions:

1. backup source avec etat `READY`;
2. ressource, snapshot time, taille et expiration consignes;
3. destination `restore-drill-20260815-a` inexistante;
4. projet et localisation identiques;
5. aucun routage applicatif vers cette base.

Commande executee le 2026-08-15 apres selection du backup `READY`:

```bash
gcloud firestore databases restore \
  --source-backup=<backup-ready-complet> \
  --destination-database=restore-drill-20260815-a \
  --project=secondevienextjsssr
```

La destination etait inexistante avant l'appel. L'operation a demarre a
`2026-08-15T18:17:09.677494Z` et s'est terminee `SUCCESSFUL` a
`18:34:54.052514Z`. Le RPO observe entre snapshot et lancement du restore est
de 1 374 secondes; le RTO du restore gere est de 1 064 secondes. La destination
porte delete protection et aucun trafic.

Gate de verification:

- operation de restore terminee et base `READY`;
- racines, sous-collections et collection groups comptes et hashes;
- 13 indexes composites `READY`;
- Rules clientes fail-closed sur la base nommee;
- IAM relu, aucun grant public ajoute;
- deux TTL absents attendus, puis reappliques seulement si le drill le requiert;
- Auth, Storage, Secret Manager, configuration et endpoints inventories sans
  valeur de secret;
- RPO depuis le snapshot du backup et RTO jusqu'a la reconciliation globale;
- aucune Function/Eventarc declenchee: les filtres restent sur `(default)`;
- aucune recopie vers `(default)`.

Preuves obtenues:

- 60 collections racines et toutes les collections critiques ont des
  comptages/digests identiques a la source relue par PITR au snapshot exact;
- 13/13 indexes composites `READY` et definitions identiques;
- les deux TTL source sont absents de la destination, omission attendue et
  documentee; aucun TTL n'a ete recree dans la base de drill;
- aucun binding IAM public et acces REST anonyme a un document reel refuse 403;
- Auth compte 252 utilisateurs sans sortir leurs identites, 8 buckets et 19
  secrets sont inventories sans valeur de secret;
- aucune reference runtime ni cible Eventarc ne pointe vers la base de drill.

Manifestes: `functions-gen2-g1-restore.json` et
`functions-gen2-g1-cross-service.json`.

La base de drill est conservee apres preuve. Sa suppression est une operation
destructive separee, jamais une etape automatique de G1.

### 4.1 Donnees P1/P2 preparees

`npm run functions:data-plan:g1` regenere sans ecriture le manifeste des dix
`inventoryVersion` manquantes et les comptages/hashes des collections
analytics. `npm run commerce:legacy:classify -- --stripe-read=false` accepte le
controle `v2_all` en dry-run; tout `--commit` reste fail-closed. Aucun payload
analytics n'est exporte tant qu'aucune purge n'est autorisee; un managed export
et un import de rollback seront obligatoires avant une future suppression.

## 5. Sante financiere G1-D

Baseline prouvee:

- un incident primaire `terminal_refund_conflict` ouvert;
- document de sante schema 2 affiche `healthy` sans compteur primaire;
- Stripe test: refund `failed`, tentative `failed`, capture/refund/reversal de
  meme montant, aucun objet live;
- decision: candidat a resolution apres preuve `healthy -> stop`, sans replay.

Ordre obligatoire:

1. remplacer le runtime appspot global du reconciler par un compte dedie
   Firestore/logging, sans Auth, Storage, Tasks ou Editor;
2. deployer uniquement le correctif de sante apres G1-A et G1-C;
3. attendre/rejouer le reconciler sans action Stripe;
4. prouver status `stop`, fraicheur, histogramme et absence de troncature;
5. verifier l'alerte et la banniere admin;
6. resoudre l'incident avec version attendue, evidence, acteur et audit;
7. ne modifier ni faits financiers, ni refund, ni stock;
8. relancer le reconciler et justifier le retour a `healthy`.

Le premier essai cible du 2026-08-15 a echoue a l'upload, avant toute mise a
jour de la Function. La version 11 est restee active. Le compte runtime dedie
est maintenant epingle dans la source et verifie par
`functions-gen2-g1-runtime-iam.json`: exactement Firestore user, log writer et
service usage consumer, aucune cle utilisateur ni capacite Auth/Storage/Tasks.
Le retry cible a echoue avant mise a jour sur la lecture Firebase
`adminSdkConfig`. La version 11 est restee active. Le meme echec du CLI a ete
reproduit avec `projects:list`, puis resolu en lecture avec
`--dns-result-order=ipv4first`. Cette option est maintenant bornee au processus
Firebase CLI par le wrapper et testee, mais le chemin deploy reste bloque avec
la session Firebase locale. Le fallback `gcloud-gen1` du wrapper est strictement
limite au reconciler et explicite generation, trigger, runtime, build/runtime
SA, memoire, timeout, max instances, retry et ingress. Il refuse tout drift
cloud avant ecriture et n'utilise aucune cle de service.

Resultat du 2026-08-15: version 12 `ACTIVE`, build
`6f3e9e27-b8cf-4674-90f5-2dddcb3d4a8f`, compte runtime dedie, max instances 1.
Le run manuel unique `o24ki8o5hysl` a termine `ok` en 6,375 s et produit une
sante `stop`, schema 3, un incident primaire, `truncated: false`. L'audit G1 a
confirme zero compteur operationnel divergent. Le resolver financier est
read-only par defaut et son apply est borne a deux ecritures: fermeture de
l'incident et evenement append-only; aucun objet Stripe, commande, refund, fait
financier ou stock n'est modifie.

Resolution fermee: deux ecritures transactionnelles, digest
`a87c96b47001269a60c638ea90c0d8ffc867a7bcd34fc1b80dd229a68684b872`, aucune
mutation commande/refund/faits/stock. Le run suivant `e1tqg5pqyj5o` a termine
`ok` en 3,696 s avec `healthy`, zero incident primaire et aucune troncature.
L'audit confirme zero incident ouvert et zero compteur divergent. Reprendre
G1-E un worker a la fois; G2 reste ferme.

IAM workers: `functions-gen2-g1-worker-iam.json` prouve trois comptes dedies,
trois roles projet exacts chacun, zero cle, aucune impersonation publique et
acces seulement aux secrets nommes/versions deja lies. Premiere cible unique:
`commerceReservationExpiryDispatcher`.

## 6. Workers G1-E

Chaque run publie uniquement:

- `runId` technique aleatoire;
- `completed` ou `incomplete`;
- duree, pages, processed, failures, exhausted et age de backlog si connu;
- aucun identifiant metier.

Un run avec failure ou exhaustion lève une erreur apres le log structure. Les
trois schedulers commerce sont bornes a `maxInstances: 1` dans le correctif
local. La preuve metier du dispatcher reservations doit creer un hold Stripe
test borne, attendre son expiration, verifier annulation fournisseur avant
liberation et rejouer pour prouver l'effet unique. Elle reste interdite avant
restore drill et deploiement cible du correctif.

Execution fermee le 2026-08-15: les trois workers sont actifs sur des comptes
runtime dedies et chaque run publie un resume `completed`. La preuve Stripe
test du dispatcher a cree une fixture `e2eOnly`, reserve une unite, observe
l'annulation fournisseur avant la liberation 10 -> 9 -> 10, puis rejoue le
scheduler sans nouvel effet. Executions `i41gvihfcdsf` puis `i41gxiq28x2v`;
zero echec, zero epuisement, un seul mouvement `release`, aucun refund, replay,
restock ou delete. Reprendre en G2-A local uniquement. Le detail machine est
dans `../manifests/functions-gen2-g1-worker-rollout.json`.

## 7. Rollback

- Monitoring: desactiver la policy fautive, conserver metriques, dashboard et
  canaux pour l'enquete; ne supprimer qu'en nettoyage approuve;
- PITR/backups: conserver par defaut. Toute reduction de retention ou
  suppression de schedule/backup exige une decision cout/RGPD distincte;
- correctif Functions: redeployer par allowlist la revision precedente d'une
  seule Function; ne pas modifier l'incident pendant le rollback;
- UI: revenir au rollout App Hosting precedent uniquement si la banniere casse
  le back-office, sans toucher au backend;
- restore drill: ne jamais basculer le trafic; conserver la base nommee jusqu'a
  approbation destructive de suppression.
