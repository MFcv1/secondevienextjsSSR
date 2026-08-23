# Finalisation contradictoire de la migration Firebase Functions Gen2

Derniere mise a jour: 2026-08-23

Statut: `F5_ROLLBACK_PROUVE - REACTIVATION_EN_COURS`

Proprietaire: mainteneur Seconde Vie

Echeance de fusion et suppression: 2026-09-01

Ce plan temporaire est cree a la demande explicite de l'utilisateur apres
l'audit contradictoire du commit `b430109`. Il ne rouvre ni une migration
fonctionnelle supplementaire ni la production. Il ferme uniquement les preuves,
gates et rollbacks qui empechent de qualifier G0 a G13 de definitivement termines.

## 1. Etat de depart verifie

- `140` exports locaux;
- `137` Functions cloud dans le seul sandbox `secondevienextjsssr`;
- `134` Gen2 `ACTIVE`, toutes sous Node 22;
- exactement trois Gen1 Auth conservees:
  `grantAdminOnAuth`, `onRegisteredUserCreated` et
  `onRegisteredUserDeleted`;
- huit jobs Scheduler actifs et quatre anciens jobs commerce `PAUSED`;
- App Hosting sert `build-2026-08-22-003`, avec `002` disponible;
- aucune anomalie de region, runtime, capacite, identite ou reference de secret;
- aucune preuve E2E externe n'a ete rejouee pendant l'audit.

La topologie est donc complete. Au debut de cette reprise, la cloture restait
bloquee par un rollback G13 non operationnel, deux gates locales rouges,
l'absence de soak de sept jours de l'etat final et des erreurs historiques non
qualifiees. Les gates locales et le rail logiciel sont maintenant corriges;
l'exercice cloud et le soak restent ouverts; la protection Storage F4 est
desormais prouvee.

## 2. Definition de done fermee

La migration initiale est definitivement terminee seulement lorsque toutes les
conditions suivantes sont vraies en meme temps:

1. `npm run test:functions-gen2`, `npm run test:catalog:core`,
   `npm run lint:functions` et `npm run lint` sont verts sous Node 22;
2. la CI execute l'agregat Gen2 G0 a G13;
3. le wrapper autorise uniquement le rollback G13 exact de
   `getCatalogPublicationStatusGen2`, depuis la revision tunée attendue vers la
   source precedente, avec generation, taille et SHA-256 verifies;
4. la generation Storage de rollback porte un hold ou une retention qui la
   soustrait effectivement au lifecycle;
5. un exercice sandbox explicitement autorise prouve le rollback puis la
   reactivation de la capacite finale, sans production, Stripe live ni App
   Hosting;
6. la revision finale observee passe sept jours complets apres le dernier
   changement cloud;
7. les HTTP 500/429 historiques sont dates, attribues et distingues des erreurs
   de la revision finale; la quiet-window finale ne masque aucune erreur;
8. les limites des archives G12 sont formulees comme telles et non comme des
   rollbacks autonomes encore disponibles;
9. `AGENTS.md`, `map.md`, les chapitres canoniques et le centre
   `apphostingaudit` ne se contredisent plus;
10. les decisions durables et preuves finales sont fusionnees dans les
    chapitres canoniques, puis ce fichier temporaire est supprime.

## 3. Lots d'execution

| Lot | Action | Gate de sortie | Etat |
| --- | --- | --- | --- |
| F1 | retirer le contrat catalogue `safeSession` devenu obsolete et borner le test e-mail aux deux triggers legacy | catalogue core et suite Gen2 verts | `TERMINE_LOCAL` |
| F2 | ajouter `test:functions-gen2` couvrant G0 a G13 et le rendre bloquant dans la CI | commande locale verte et workflow reference | `TERMINE_LOCAL` |
| F3 | ajouter au wrapper un registre G13 exact, un refus de mauvaise revision, la verification generation/taille/hold/SHA et les arguments max 1 | tests locaux du wrapper verts | `TERMINE_LOCAL` |
| F4 | proteger l'objet rollback exact dans Storage | read-back prouve `temporary_hold=true` ou retention equivalente | `TERMINE_CLOUD` |
| F5 | exercer le rollback max 2 vers max 1 puis la reactivation max 2 | deux revisions `ACTIVE`, config exacte, aucun autre deploy | `ROLLBACK_TERMINE_REACTIVATION_PRETE` |
| F6 | observer sept jours complets a partir de la revision finale | fenetre post-changement de 604800 s, inventaire frais et logs qualifies | `EN_ATTENTE_F5` |
| F7 | classifier les erreurs G13 historiques et refaire une quiet-window finale | causes documentees, aucune affirmation `healthy` fondee sur un agregat ambigu | `A_FAIRE_READ_ONLY` |
| F8 | corriger les contradictions et qualifier les rollbacks G12 expires | bible, map, ADR, infra, exploitation, qualite et centre coherents | `EN_COURS` |
| F9 | fusionner les preuves durables et supprimer ce plan | liens verifies, `git diff --check`, aucune reference morte | `EN_ATTENTE_F6` |

Preuves locales du 2026-08-23:

- `test:catalog:core`: 13/13;
- `test:functions-g2a`: 26/26;
- `test:functions-gen2`: 154/154;
- test cible G13: 6/6;
- `lint:functions`: vert sans avertissement;
- lint complet en mode `--quiet`: zero erreur;
- `git diff --check`: vert.
- F4: la generation canonique `1787147721443973` a d'abord ete protegee et
  verifiee. Comme ce hold bloque le staging interne de Cloud Functions, les
  memes octets ont ete recopies dans le chemin immuable `g13-rollback/<sha>`,
  generation `1787449114510784`, taille `381285`, SHA-256 exact et
  `temporary_hold=true`. L'original reste protege jusqu'au dernier preflight;
  preuve initiale `manifests/functions-gen2-finalisation-f4.json`.
- F5 rollback: revision `getcatalogpublicationstatusgen2-00003-mol`
  `ACTIVE`, max `1`, concurrence `1`, trafic `100 %`; preuve
  `manifests/functions-gen2-finalisation-f5-rollback.json`.

## 4. Rail rollback G13 attendu

La cible unique est `getCatalogPublicationStatusGen2` dans
`europe-west1`. Le wrapper doit refuser toute execution si une seule valeur
differe:

- projet `secondevienextjsssr` et codebase `main`;
- revision courante attendue
  `getcatalogpublicationstatusgen2-00002-yoq` tant qu'aucune reactivation ne
  l'a remplacee;
- source immuable versionnee generation `1787449114510784`;
- taille `381285` octets;
- SHA-256
  `dacf4c1eb1257fdd18c94a03889822dfa042642d0835b0dd68b3be8f9b8f46da`;
- runtime Node 22, compte runtime `catalog-builder`, compte build dedie;
- CPU `167m`, memoire `512Mi`, concurrence `1`, min `0`, max `1`, timeout
  `60s`;
- objet protege contre le lifecycle avant tout deploy;
- une approbation litterale specifique G13.

La reactivation doit utiliser l'archive immutable du code courant,
retablir max `2` et enregistrer la nouvelle revision comme origine de la
fenetre F6. Aucun deploy global ou build App Hosting n'est autorise.

## 5. Qualification des observations

La fenetre historique du 15 au 22 aout reste une preuve de trafic sur la
periode, mais pas un soak de sept jours de la topologie finale: G12-A s'est
terminee environ douze minutes avant la fin de cette fenetre et le tuning G13
est posterieur.

F7 doit au minimum separer:

- erreurs avant/apres retrait Gen1;
- erreurs de charge volontaire;
- erreurs de `dispatchCatalogRevalidation`,
  `onQuoteRequestSubmittedGen2` et `onOrderStatsWrite`;
- indisponibilites Cloud Tasks et erreurs applicatives;
- erreurs de configuration de metrique, dont le 404
  `firestore.googleapis.com/document/write_conflict_count`.

Une erreur historique expliquee n'impose pas un correctif applicatif si la
revision finale et sa quiet-window sont saines. Une erreur non expliquee ne
peut pas etre masquee par un total agrege.

## 6. Commandes locales autorisees

```bash
npm run test:functions-gen2
npm run test:catalog:core
npm run test:auth
npm run test:commerce:unit
npm run lint:functions
npm run lint
git diff --check
git status --short
```

Les tests Stripe heberges, remboursements reels, navigateur, E2E externe,
purges et emulateurs non necessaires restent hors de cette passe.

## 7. Autorisation cloud bornee recue

Le 2026-08-23, l'utilisateur a explicitement autorise l'execution autonome de
F4, F5 et du suivi necessaire a la cloture sur le seul sandbox. Cette
autorisation couvre:

1. poser et conserver le hold sur les generations Storage exactes;
2. deployer le rollback G13;
3. redeployer la revision max 2;
4. lire les inventaires, revisions, logs et metriques necessaires au soak.

Avant chaque ecriture, l'operateur reconfirme projet, commit, revision,
generation, digest, configuration courante et rollback. La production,
App Hosting, Stripe live, IAM, secrets, Scheduler et les donnees metier restent
hors scope.

## 8. Sortie documentaire

A la fermeture F9:

- conserver l'architecture et le calendrier Node dans
  `_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md`;
- conserver les commandes/rollbacks dans
  `_DOCS/operations/EXPLOITATION.md`;
- conserver l'etat cloud et production future dans
  `_DOCS/infra/INFRASTRUCTURE.md`;
- conserver la gate CI dans `_DOCS/quality/QUALITE_TESTS.md`;
- corriger l'arithmetique local/cloud dans `map.md` en mentionnant les cinq
  exports Instagram local-only et les deux webhooks cloud-only;
- retirer les formulations `rollback exact` pour les archives G12 dont les
  fenetres ont expire;
- supprimer ce fichier et retirer sa reference du centre de suivi.
