# Audit et plan d'execution de la migration Cloud Functions Gen2

Derniere contre-verification: 2026-08-16

Statut: `PLAN_TEMPORAIRE_REVALIDE - G2_B1_STATS_TERMINE - G2_B2_CATALOGUE_TERMINE`

Proprietaire: mainteneur Seconde Vie et agent charge de la migration

Environnement observe: sandbox Firebase `secondevienextjsssr` uniquement

Echeance de revue: 2026-10-31
Condition de cloture: migration sandbox qualifiee, trois exceptions Auth
documentees, ancien rail Gen1 retire uniquement apres preuves, decisions
durables fusionnees dans les chapitres canoniques, puis suppression de ce plan.

Documents canoniques a maintenir pendant l'execution:

- `_DOCS/infra/INFRASTRUCTURE.md`;
- `_DOCS/operations/EXPLOITATION.md`;
- `_DOCS/quality/QUALITE_TESTS.md`;
- `_DOCS/security/AUTHENTIFICATION.md`;
- `_DOCS/security/SECURITE_GLOBALE.md`;
- `_DOCS/commerce/COMMERCE_SYNTHESE.md` et `_DOCS/commerce/COMMERCE_STRIPE.md`;
- `_DOCS/data/DONNEES_ANALYTICS.md` et `_DOCS/data/AUDIT_COUTS_FIRESTORE.md`;
- `map.md`.

## 1. Objet, perimetre et limites

Ce document transforme l'audit d'architecture precedent en inventaire
executable pour migrer les Cloud Functions Firebase de generation 1 vers la
generation 2 sans casser le site, l'authentification, le stock, les commandes,
les remboursements, les e-mails, les analytics ou le catalogue.

Il couvre:

- les 152 Functions actuellement deployees dans le sandbox;
- les 157 exports presents dans `functions/index.js`;
- les appelants navigateur, scripts, schedulers, triggers et fournisseurs;
- les changements de signature entre Gen1 et Gen2;
- les comptes de service, secrets, regions, quotas et options runtime;
- la coexistence temporaire Gen1/Gen2, le basculement et le rollback;
- les prerequis hors Functions trouves lors de l'audit d'architecture;
- les gates de validation et le prompt final d'execution.

Ce document ne constitue pas une autorisation de:

- deployer en production;
- utiliser Stripe live;
- supprimer des Functions ou des donnees sans preuve et gate explicite;
- lancer un `firebase deploy --only functions` global;
- deployer les cinq exports Instagram locaux tant que l'ecart entre le cloud et
  le PRD Meta n'est pas reconcilie;
- modifier Firestore pendant la phase d'inventaire.

Les controles cloud ayant servi a l'inventaire etaient en lecture seule. La
seule modification effectuee pendant cette passe est documentaire.

## 2. Verdict executif

### 2.1 Cible recommandee

La cible correcte est:

> `GEN2_MAXIMAL_AVEC_3_EXCEPTIONS_AUTH_GEN1_JUSTIFIEES`

La migration est recommandee pour la tranquillite a cinq ans, mais elle ne
doit pas etre une conversion massive. Firebase permet la coexistence des deux
generations et recommande une migration progressive, Function par Function.

Etat mesure le 2026-08-15:

| Mesure | Valeur |
| --- | ---: |
| Functions cloud | 152 |
| Functions cloud actives | 152 |
| Gen1 cloud | 139 |
| Gen2 cloud | 13 |
| exports locaux | 157 |
| exports locaux non deployes | 5 |
| region `europe-west1` | 146 |
| region `us-central1` | 6 |
| runtime Gen1 | Node.js 22 |

Repartition des declencheurs:

| Type | Nombre |
| --- | ---: |
| callables Firebase | 123 |
| HTTP brutes | 8 |
| schedulers | 8 |
| triggers evenementiels | 11 |
| Cloud Tasks | 2 |
| total | 152 |

Si les 136 Functions Gen1 techniquement migrables etaient toutes conservees
et migrees, l'etat maximal serait de 149 Gen2 et 3 Gen1. Le total final devrait
etre plus bas si les Functions legacy, E2E ou de maintenance sont prouvees
obsoletes et retirees au lieu d'etre migrees.

Si les cinq exports Instagram locaux etaient ensuite autorises et deployes,
le maximum source deviendrait 154 Gen2 et 3 Gen1, soit 157 Functions avant
retraits. Ce second nombre n'est pas l'etat cloud courant et ne vaut pas
autorisation de deploiement.

### 2.2 Verdict de la contre-revue

L'inventaire fonctionnel est suffisamment detaille pour commencer G0, mais la
version initiale du plan n'etait pas encore executable telle quelle. La
contre-revue du code, des chapitres canoniques et de la documentation Firebase
officielle a ferme les ecarts de conception suivants dans le present document:

| Ecart trouve | Risque sans correction | Decision integree |
| --- | --- | --- |
| CPU Gen2 non specifie | cout par milliseconde jusqu'a 10,5 fois superieur a 128 MiB et comportement different de Gen1 | `cpu: "gcf_gen1"` + `concurrency: 1` pour la parite initiale, puis optimisation mesuree |
| 13 Gen2 actuelles traitees comme deja qualifiees | concurrence, retry, CPU ou plafond implicites non revus | audit de configuration des 13 avant toute nouvelle vague |
| un script local permet un deploiement global | publication accidentelle de 157 exports, dont cinq absents du cloud | garde fail-closed, CLI epinglee et allowlist obligatoire en G0 |
| G3 supprimait trop tot code, secrets ou alertes | rollback Gen1 rendu impossible avant G12 | G3 devient decision et neutralisation reversible uniquement |
| chevauchement suppose sur tous les schedulers | `expireAdminPaymentLinks` ne possede pas de lease externe commun | proprietaire/kill-switch explicite avant deploiement du nouveau scheduler |
| restauration decrite vers un projet isole | la sauvegarde Firestore restaure vers une nouvelle base du meme projet | runbook corrige, IAM/TTL/Rules verifies, chemin de recopie/reprise explicite et aucun failover direct |
| suppression analytics melee aux prerequis de migration | action destructive sans benefice pour le cutover Gen2 | classification en G1, quarantaine et suppression differee apres observation |
| statut Instagram suppose bloque avant M4 | le PRD declare M4 fermee/M5 OAuth valide alors que cinq exports locaux restent absents du cloud | gate `HOLD_META_RECONCILIATION`, sans deployer jusqu'a preuve |
| scripts Stripe en quarantaine non interdits dans le prompt | un test peut cibler une commande non bornee ou donner un faux vert | `e2e:hosted-stripe` et `e2e:refund-stripe` restent `DO_NOT_RUN` |

Verdict apres integration de ces corrections:

> `PLAN_EXECUTABLE_A_PARTIR_DE_G0_UNIQUEMENT`

Cela n'est ni un GO de deploiement, ni un GO paiement, ni un GO production.
G0 reste read-only; chaque ecriture cloud, deploiement sandbox, test Stripe ou
suppression exige ensuite la gate et l'autorisation correspondant a sa phase.

### 2.3 Trois Functions doivent rester en Gen1

Firebase ne prend pas en charge en Gen2 les triggers Auth basiques utilises
ici. Ces trois Functions sont des exceptions legitimes, pas un echec:

- `grantAdminOnAuth`;
- `onRegisteredUserCreated`;
- `onRegisteredUserDeleted`.

Elles restent en Gen1 tant que Firebase ne fournit pas d'equivalent compatible
ou qu'une refonte Auth distincte n'est pas explicitement decidee.

### 2.4 Ce qui rendrait la migration dangereuse

Une migration serait consideree dangereuse si elle:

- remplace simplement `firebase-functions/v1` par des imports `v2`;
- tente un changement de generation sous le meme nom;
- laisse la concurrence Gen2 par defaut sans audit des variables globales;
- utilise le compte Compute Gen2 sans reproduire les droits utiles;
- deploie tout `functions/index.js`, ce qui publierait cinq endpoints Instagram
  absents du cloud et non reconcilies avec le PRD Meta;
- fait tourner deux schedulers ou deux triggers mutateurs sans idempotence;
- bascule les webhooks Stripe sans nouveau secret de signature et sans preuve
  de deduplication;
- supprime l'ancienne Function avant observation et rollback;
- commence une vague de deploiement/cutover Gen2 alors que la recuperation
  Firestore et l'alerting sont absents;
- cree encore une nouvelle Function Gen1 hors des trois exceptions Auth;
- active un scheduler Gen2 avant d'avoir prouve le mecanisme d'exclusion avec
  son homologue Gen1;
- utilise un `minInstances` global sur des dizaines de Functions ou change CPU,
  region et generation dans la meme vague;
- execute les scripts Stripe places en quarantaine par le chapitre qualite.

## 3. Conservation explicite de l'audit precedent

### 3.1 Ordre de correction recommande conserve

| Ordre | Sujet | Etat verifie le 2026-08-15 | Gate restante |
| ---: | --- | --- | --- |
| 1 | redeployer et verifier `commerceReservationExpiryDispatcher` | Function `ACTIVE`, scheduler `ENABLED`, execution reussie toutes les deux minutes | exercer une vraie expiration Stripe test et verifier la liberation idempotente du stock |
| 2 | resoudre `terminal_refund_conflict` et corriger la sante | un incident reste ouvert; `sys_commerce_operations/current` reste a tort `healthy` | prouver `healthy -> stop`, fraicheur/troncature fail-closed, resolution auditee sans replay, puis retour justifie a `healthy`; ajouter `warning` seulement avec schema/tests explicites |
| 3 | PITR, protection de suppression et sauvegardes | PITR desactive, protection desactivee, retention native 3600 s, zero backup, zero schedule | activer, definir retention, restaurer vers une base nommee du meme projet, rapprocher les comptages et documenter RPO/RTO |
| 4 | alertes operationnelles | zero politique Monitoring retrouvee | creer metriques/alertes, canal de notification et test de declenchement/resolution |
| 5 | inventorier Functions et analytics historiques | inventaire Functions ferme dans ce document; collections historiques classees ci-dessous | aucune suppression avant export, Data Access et preuve d'absence de producteur/consommateur |
| 6 | normaliser les donnees legacy | 10 meubles sans `inventoryVersion`; 26 commandes legacy sur 125 | dry-run, sauvegarde, manifeste, ecriture bornee, recomptage et rollback |

### 3.2 Preuve de tests precedente conservee

La preuve historique suivante reste attachee a l'audit:

> Les tests locaux executes sont verts: **127 tests commerce, 14 catalogue et
> 5 retention**, soit **146 tests reussis**. Aucun changement, deploiement,
> test de paiement, build, test de charge ou ecriture Firestore n'avait ete
> effectue pendant cette passe.

Ces 146 tests n'ont pas ete rejoues pendant le present inventaire documentaire.
Ils constituent une baseline, pas une preuve de compatibilite Gen2 ni une
preuve de concurrence hebergee.

### 3.3 Evolution depuis la photographie precedente

La photographie precedente recensait 148 Functions, dont 135 Gen1, et signalait
le dispatcher d'expiration hors ligne. L'etat actuel en compte 152, dont 139
Gen1. Les quatre Functions supplementaires sont:

- `createPromotionCodeAdmin`;
- `listPromotionCodesAdmin`;
- `previewPromotionCodeV2`;
- `setPromotionCodeStatusAdmin`.

Elles sont `ACTIVE`. Le dispatcher est lui aussi revenu `ACTIVE`. L'ancien
audit reste une photographie historique; ce document devient la baseline de
migration.

### 3.4 Ordre d'execution corrige sans perdre l'ordre historique

Les six sujets historiques restent tous conserves. Leur ordre de travail doit
cependant etre ajuste pour ne pas tester ou modifier un systeme sans filet:

1. figer la baseline, fermer le deploiement global, epingler les outils et
   verifier quotas/couts;
2. creer l'observabilite minimale et tester le canal d'alerte;
3. activer la recuperation Firestore et effectuer le restore drill;
4. corriger le faux `healthy`, puis qualifier l'incident financier;
5. exercer le dispatcher d'expiration en Stripe test avec preuve idempotente;
6. classifier les 10 meubles et les 26 commandes, puis ne normaliser que les
   cas prouvables apres sauvegarde;
7. classifier les collections analytics, sans les supprimer pour debloquer la
   migration;
8. construire le socle Gen2 et migrer par vagues reversibles;
9. retirer les Gen1 seulement en G12, puis optimiser IAM, CPU, concurrence et
   organisation du codebase en G13.

Ce nouvel ordre ne declare pas le dispatcher moins important. Il place
simplement d'abord les moyens de detecter une regression et de recuperer les
donnees. La suppression des analytics historiques est volontairement sortie du
chemin critique: elle reduit la dette, mais n'ameliore ni le paiement ni le
cutover Gen2.

## 4. Contraintes Firebase officielles a respecter

Sources officielles consultees:

- [comparaison Gen1/Gen2](https://firebase.google.com/docs/functions/version-comparison);
- [guide de migration Node.js](https://firebase.google.com/docs/functions/2nd-gen-upgrade);
- [gestion des renommages, regions et triggers](https://firebase.google.com/docs/functions/manage-functions);
- [quotas et limites Functions](https://firebase.google.com/docs/functions/quotas);
- [retries des Functions evenementielles](https://firebase.google.com/docs/functions/retries);
- [evenements Firestore](https://firebase.google.com/docs/functions/firestore-events);
- [Functions planifiees et chevauchement](https://firebase.google.com/docs/functions/schedule-functions);
- [organisation en codebases](https://firebase.google.com/docs/functions/organize-functions);
- [configuration d'environnement Functions](https://firebase.google.com/docs/functions/config-env);
- [calendrier de support des runtimes](https://cloud.google.com/functions/docs/runtime-support);
- [callables Firebase](https://firebase.google.com/docs/functions/callable);
- [triggers Auth basiques](https://firebase.google.com/docs/auth/extend-with-functions);
- [PITR Firestore](https://firebase.google.com/docs/firestore/use-pitr);
- [sauvegardes et restauration Firestore](https://firebase.google.com/docs/firestore/backups);
- [protection de suppression Firestore](https://firebase.google.com/docs/firestore/manage-databases);
- [configuration App Hosting](https://firebase.google.com/docs/app-hosting/configure);
- [rollbacks App Hosting](https://firebase.google.com/docs/app-hosting/rollouts);
- [couts App Hosting](https://firebase.google.com/docs/app-hosting/costs);
- [budgets Cloud Billing](https://cloud.google.com/billing/docs/how-to/budgets);
- [alertes de quota](https://cloud.google.com/docs/quotas/set-up-quota-alerts);
- [export/import Firebase Auth](https://firebase.google.com/docs/cli/auth);
- [soft delete Cloud Storage pour Firebase](https://firebase.google.com/docs/storage/web/delete-files);
- [destruction differee des versions de secrets](https://cloud.google.com/secret-manager/docs/delay-destruction-of-secret-versions).

Contraintes fermees:

1. Gen2 repose sur Cloud Run et Eventarc. App Hosting reste distinct.
2. Firebase recommande Gen2 pour les nouvelles Functions et continue de
   supporter Gen1.
3. Une Gen1 ne se convertit pas en Gen2 sous le meme nom en une operation. Il
   faut un nouveau nom, un deploiement parallele, un basculement, puis un retrait.
4. Firebase recommande une Function a la fois avec verification.
5. Un callable Gen2 recoit `request`: `request.data`, `request.auth`,
   `request.app` et `request.rawRequest`.
6. Le compte par defaut change de `appspot` en Gen1 vers Compute en Gen2.
7. Gen2 peut traiter jusqu'a 1 000 requetes concurrentes par instance; la
   valeur courante par defaut est 80.
8. Les triggers Auth `auth.user().onCreate/onDelete` ne sont pas disponibles en
   Gen2.
9. Le chevauchement nom/region/trigger doit rester idempotent.
10. Les callables Gen2 sont compatibles avec le SDK Web du projet, mais le nom
    cible client doit changer.
11. Jusqu'a 2 Gio, Gen2 alloue par defaut un CPU entier. Par rapport aux
    valeurs Gen1, le cout CPU par milliseconde documente peut etre multiplie
    par 10,5 a 128 Mio, 5,3 a 256 Mio et 2,7 a 512 Mio. La migration doit donc
    fixer CPU et concurrence au lieu de copier uniquement la memoire.
12. Firebase recommande des deploiements cibles et, pour les grands ensembles,
    des groupes de dix Functions au maximum. La limite d'ecriture de gestion
    Gen2 est de 60 operations par 60 secondes et par region, non augmentable.
13. Une Function evenementielle est livree au moins une fois et l'ordre n'est
    pas garanti. Si `retry: true` est active, la fenetre Gen2 est de 24 heures
    contre sept jours en Gen1; le retry doit etre choisi par cible, avec
    idempotence et politique d'evenement trop ancien, jamais herite
    implicitement.
14. Une sauvegarde Firestore restaure les donnees et configurations d'index
    dans une nouvelle base du meme projet. Elle n'inclut ni Rules ni politiques
    TTL; IAM doit etre revalide et la base restauree n'est pas un failover
    direct de `(default)`.
15. La protection de suppression empeche la suppression de la base, pas la
    suppression ou corruption de documents. Elle complete PITR et les backups
    mais ne les remplace pas.
16. PITR offre jusqu'a sept jours de versions avec une granularite d'une
    minute. Les sauvegardes quotidiennes/hebdomadaires peuvent etre conservees
    au maximum quatorze semaines et sont facturables sur Blaze.
17. Les budgets Google Cloud avertissent mais ne plafonnent pas les depenses.
    Ils doivent etre combines aux plafonds d'instances, quotas, alertes de
    derive et runbooks.
18. Un rollback App Hosting instantane remet l'image et la configuration de
    l'ancien rollout; un rollback avec reconstruction reutilise la configuration
    courante. Le choix doit etre ecrit avant chaque cutover client.
19. Node.js 22 est annonce en deprecation le 2027-04-30 et en retrait le
    2027-10-31. « Tranquille cinq ans » signifie donc une gouvernance annuelle
    des runtimes et dependances, pas un socle fige jusqu'en 2031.
20. Aucun usage `functions.config()` n'a ete trouve. Une CI doit empecher son
    retour avant l'arret des nouveaux deploiements qui en dependent apres mars
    2027.

## 5. Reconciliation cloud, code et consommateurs

### 5.1 Ecart de cinq exports locaux

Les 152 noms cloud existent tous dans `functions/index.js`. Les cinq exports
locaux absents du cloud sont:

- `startInstagramOAuthAdmin`;
- `instagramOAuthCallback`;
- `getInstagramConnectionStatusAdmin`;
- `verifyInstagramConnectionAdmin`;
- `disconnectInstagramConnectionAdmin`.

Le code local et le cloud prouvent seulement qu'ils ne sont pas deployes. Le
PRD Meta affirme en parallele `SANDBOX_M4_COMPLETE_M5_OAUTH_VALIDE`; il est donc
incorrect de les qualifier automatiquement de simples travaux M1-M3 bloques
avant M4. G0 doit etablir s'ils sont volontairement locaux, oublies, remplaces
par les neuf Functions Meta, ou conditionnes par une autre gate.

Jusqu'a cette reconciliation, leur statut est
`HOLD_META_RECONCILIATION`: ni suppression comme orphelins, ni migration cloud,
ni deploiement accidentel. S'ils sont finalement conserves, leur premiere
definition deployee doit etre Gen2. Cette situation interdit tout deploiement
global du codebase pendant la migration.

### 5.2 Appelants navigateur a basculer

Le helper `src/kit/config/firebaseLazy.js` construit actuellement un callable
avec le nom recu. Un registre de cibles doit permettre de basculer une Function
sans modifier toutes les vues.

Des appels contournent ce helper et doivent etre centralises ou configurables:

- `src/kit/shared/AnalyticsProvider.jsx`: `initLiveSession`, `syncSession` et URL
  brute `syncSessionBeacon`;
- `src/kit/commerce/CheckoutView.jsx`: OTP guest et fallback `createOrder`;
- `src/kit/commerce/CheckoutStripeModal.jsx`: `getOrderStatusClient`;
- `src/kit/admin/AdminIPTracker.jsx`: `trackAdminIP`;
- `src/kit/marketplace/LegacyLoginModalFullIsland.jsx`: quatre callables passkey
  et deux callables OTP client.

Les clients commerce/admin recents passent deja par `getCallableFunction`, mais
leurs noms doivent etre couverts par le registre et des tests de contrat.

### 5.3 Appelants externes ou noms codifies en dur

- `scripts/e2e-hosted-stripe-checkout.mjs`: URL `e2eCheckoutProof`;
- `scripts/e2e-commerce-core-gate7b.mjs`: base Functions et webhook Connect;
- `scripts/e2e-refund-latest-stripe-order.mjs`: `requestRefundAdmin`;
- `scripts/audit-refund-failed-v2.mjs`: noms et URL des webhooks;
- `scripts/build-commerce-release-manifest.mjs`: liste obligatoire;
- console Stripe test: endpoints plateforme et Connect;
- console Meta: URI de callback OAuth;
- Cloud Scheduler/Pub/Sub pour les schedulers Gen1;
- Cloud Tasks/IAM pour les workers catalogue deja Gen2.

## 6. Inventaire exhaustif des Functions

Legende:

- `KEEP_GEN2`: deja Gen2;
- `MIGRATE`: cible Gen2 confirmee;
- `MIGRATE_OR_RETIRE`: verifier l'usage puis retirer ou migrer;
- `KEEP_GEN1_AUTH`: exception Firebase;
- `HOLD_META_RECONCILIATION`: ne ni deployer ni supprimer avant resolution de
  l'ecart code/cloud/PRD; convertir en Gen2 si la cible est conservee.

### 6.1 Treize Functions deja en Gen2

| Domaine | Functions | Nb | Action | Controle requis |
| --- | --- | ---: | --- | --- |
| catalogue | `onCatalogSourceWrite`, `dispatchCatalogBuild`, `dispatchCatalogRevalidation`, `catalogReconciler`, `catalogMediaGarbageCollector` | 5 | `KEEP_GEN2` | comptes catalogue, queues concurrence 1, HMAC, CAS, regions |
| e-mail commande | `onOrderCreated`, `onOrderUpdated` | 2 | `KEEP_GEN2` | idempotence, secrets et compte runtime |
| publication produit | `processProductPublicationImage`, `reconcileProductPublicationSessions`, `cleanupProductPublicationSessions` | 3 | `KEEP_GEN2` | Storage `us-central1`, CPU/memoire et reprise |
| stats commande | `onOrderStatsWrite` | 1 | `KEEP_GEN2` | double livraison Eventarc et agregats idempotents |
| artefacts | `onArtifactDeleted`, `onArtifactUpdated` | 2 | `KEEP_GEN2` | evenements Firestore et absence de boucle |
| total |  | 13 |  |  |

`KEEP_GEN2` signifie « ne pas remigrer », pas « configuration deja parfaite ».
La lecture des definitions locales montre encore des options implicites:

| Cibles actuelles | Options explicites utiles | Options a fermer en G0/G2 |
| --- | --- | --- |
| `onCatalogSourceWrite` | region, retry, SA, timeout, memoire | CPU, concurrence, min/max instances, traitement evenement trop ancien |
| deux Cloud Tasks catalogue | SA, retry et rate limits | CPU, concurrence runtime, min/max instances, timeout explicite par worker |
| deux schedulers catalogue | SA, horaire, timeout, memoire | CPU, concurrence, min/max instances, retry/overlap |
| `onOrderCreated`, `onOrderUpdated` | region et secrets | CPU, concurrence, min/max instances, decision retry explicite |
| `processProductPublicationImage` | region, timeout, memoire, concurrence 4, retry | CPU, max instances, comportement sur erreur capturee |
| deux schedulers publication | horaire, region, timeout, memoire | CPU, concurrence, min/max instances, overlap |
| `onOrderStatsWrite` | region | CPU, concurrence, min/max instances, retry/reconstruction |
| `onArtifactDeleted`, `onArtifactUpdated` | region et timeout | CPU, concurrence, min/max instances, retry/reconciliation |

Avant de prendre ces Functions comme modele, exporter leur configuration cloud,
comparer source/runtime et choisir explicitement chaque valeur. Une option peut
rester a sa valeur actuelle, mais elle ne doit plus rester inconnue. Il ne faut
pas appliquer un `setGlobalOptions` CPU ou compte de service qui modifierait les
comptes catalogue specialises ou le worker image.

La contre-verification cloud a mesure CPU 1 et `maxInstances: 20` sur les 13
Gen2. Douze ont une concurrence runtime de 80; le worker image conserve 4. Les
deux queues catalogue limitent actuellement l'entree a une tache concurrente et
une tache/seconde, ce qui borne leur concurrence effective tant que tous les
appels passent bien par Cloud Tasks. Les quatre schedulers Gen2 mutateurs n'ont
pas de plafond explicite dans le source alors que Firebase avertit qu'une
execution peut chevaucher la suivante. G0 doit conserver un manifeste
avant/apres et G2 doit rendre le source autoritaire, sans
`preserveExternalChanges` global.

Les queues `dispatchCatalogBuild` et `dispatchCatalogRevalidation` sont
`RUNNING`, sans backlog observe, avec `maxConcurrentDispatches: 1`,
`maxDispatchesPerSecond: 1`, dix tentatives et un backoff 5 a 300 secondes. Le
timeout cloud des workers est cependant de 60 secondes alors que l'enqueue du
build autorise un `dispatchDeadline` de 1 800 secondes. G2 doit mesurer le p99,
aligner timeout et deadline sans depasser les limites Cloud Tasks, puis alerter
sur tentative echouee, epuisement des retries et age de la plus vieille tache.

Deux dettes de fiabilite existantes doivent aussi etre fermees avant de prendre
le rail Gen2 comme reference:

- `onOrderStatsWrite` applique des increments sans ledger d'`event.id`; une
  double livraison Eventarc peut donc doubler la projection legacy. Il faut un
  ledger transactionnel ou une projection reconstruite/deterministe;
- `onOrderCreated` et `onOrderUpdated` envoient les e-mails legacy sans claim
  transactionnel commun. Une cle d'idempotence fournisseur ne suffit pas a
  prouver l'exactly-once, notamment avec Gmail; il faut soit les faire passer
  par l'outbox durable, soit documenter/reconcilier l'at-least-once.

### 6.2 Trois exceptions Auth a conserver en Gen1

| Function | Region | Raison | Action |
| --- | --- | --- | --- |
| `grantAdminOnAuth` | `us-central1` | trigger Auth creation basique | `KEEP_GEN1_AUTH` |
| `onRegisteredUserCreated` | `europe-west1` | trigger Auth creation basique | `KEEP_GEN1_AUTH` |
| `onRegisteredUserDeleted` | `europe-west1` | trigger Auth suppression basique | `KEEP_GEN1_AUTH` |

Controles a ajouter: tests creation/suppression, compteur `sys_user_stats`,
alerte d'erreur, compte `appspot` documente et reexamen annuel.

### 6.3 Auth, administration et analytics migrables

| Famille | Functions Gen1 | Nb | Action | Vague |
| --- | --- | ---: | --- | --- |
| administration Auth | `addAdminUser`, `ensureAdminAccessRegistry`, `getUserStats`, `logUserConnection`, `removeAdminUser`, `syncSuperAdminClaim` | 6 | `MIGRATE` | G5 |
| OTP checkout/client | `sendGuestCheckoutOtp`, `verifyGuestCheckoutOtp`, `sendCustomerLoginOtp`, `verifyCustomerLoginOtp` | 4 | `MIGRATE` | G5 |
| passkeys | `generatePasskeyAuthenticationOptions`, `generatePasskeyRegistrationOptions`, `verifyPasskeyAuthentication`, `verifyPasskeyRegistration` | 4 | `MIGRATE` | G5 |
| analytics sessions | `initLiveSession`, `syncSession`, `syncSessionBeacon`, `deleteSession`, `clearAllSessions`, `clearAllAffiliateClicks` | 6 | `MIGRATE` | G4 |
| analytics admin | `trackAdminIP`, `updateUserSessions` | 2 | `MIGRATE` | G4 |
| total |  | 22 |  |  |

Risques: contexte Auth/App Check, droit `firebaseauth.admin`, cache global
`adminIpCache`, cache LRU/TTL de session, URL/origine du beacon et contrat
WebAuthn/custom token.

### 6.4 Catalogue, e-mail, publication, contenu et services admin

| Famille | Functions Gen1 | Nb | Action | Vague |
| --- | --- | ---: | --- | --- |
| maintenance catalogue | `getCatalogPublicationStatus`, `rebuildCatalogSnapshot`, `rollbackCatalogSnapshot` | 3 | `MIGRATE` | G6 |
| e-mail manuel | `sendRefundStatusEmailAdmin`, `sendTestEmail` | 2 | `MIGRATE` | G6 |
| publication produit historique | `getProductPublicationSessionAdmin`, `reportProductPublicationClientErrorAdmin`, `retryProductPublicationFinalizationAdmin`, `startProductPublicationAdmin` | 4 | `MIGRATE_OR_RETIRE` | G3 |
| onboarding facturation | `completeBillingGuideAdmin`, `getBillingGuideOperatorStatus`, `getBillingGuideStatus`, `resetBillingGuideTest`, `saveBillingGuideProgress` | 5 | `MIGRATE` | G3/G6 |
| factures manuelles | `getManualInvoiceWorkspaceAdmin`, `prepareManualInvoicePdfAdmin`, `saveManualInvoiceDraftAdmin`, `sendManualInvoiceAdmin` | 4 | `MIGRATE` | G6 |
| demandes de devis | `createQuoteRequest`, `finalizeQuoteRequest`, `getQuoteRequestAdmin`, `listQuoteRequestsAdmin`, `onQuoteRequestSubmitted`, `updateQuoteRequestAdmin`, `uploadQuoteRequestPhoto` | 7 | `MIGRATE` | G6 |
| newsletter | `claimNewsletterReward`, `drawNewsletterReward`, `listMyNewsletterRewards` | 3 | `MIGRATE` | G6 |
| Meta deploye | `disconnectMetaConnectionAdmin`, `getMetaConnectionStatusAdmin`, `getSocialPublicationStatusAdmin`, `metaOAuthCallback`, `prepareSocialPublicationAdmin`, `runSocialPublicationAdmin`, `selectMetaAssetAdmin`, `startMetaOAuthAdmin`, `verifyMetaConnectionAdmin` | 9 | `MIGRATE` apres gate Meta | G7 |
| maintenance generale | `getUploadUrl`, `purgeAllProducts`, `purgeAnonymousUsers`, `resetAllOrders`, `resetAllStats`, `resetAllUsers`, `runGarbageCollector` | 7 | `MIGRATE_OR_RETIRE` | G3/G11 |
| total |  | 44 |  |  |

Points de decision:

- la publication produit est historique/inactive cote UI: verifier sessions,
  appelants et logs avant migration;
- `getUploadUrl` et `resetAllStats` sont candidats au retrait apres preuve;
- les purges/resets conserves migrent en dernier, avec concurrence et instances
  a 1, confirmation, audit et dry-run;
- `onQuoteRequestSubmitted` exige une deduplication pendant le chevauchement;
- `metaOAuthCallback` change d'URL: console Meta et secret URI coordonnes.

### 6.5 Commerce legacy et Stripe

| Famille | Functions Gen1 | Nb | Action | Vague |
| --- | --- | ---: | --- | --- |
| checkout/statut/annulation/refund legacy | `createOrder`, `cancelOrderClient`, `getOrderStatusClient`, `refundOrderAdmin`, `syncRefundStatusAdmin` | 5 | `MIGRATE_OR_RETIRE` apres suppression prouvee des fallbacks | G8 |
| webhooks legacy | `stripeWebhook`, `stripeConnectWebhook` | 2 | `MIGRATE_OR_RETIRE` selon abonnements Stripe reels | G8/G10 |
| preuves E2E | `e2eCheckoutProof`, `e2eStripeHardeningProof` | 2 | `MIGRATE_OR_RETIRE`; desactivees par defaut | G3 |
| Stripe Connect callables | `confirmStripeConnectReconnect`, `getStripeConnectStatus`, `requestStripeConnectReconnect`, `startStripeConnectOnboarding`, `syncStripeConnectAccount` | 5 | `MIGRATE` | G9 |
| total |  | 14 |  |  |

`createOrder` reste le fallback de `CheckoutView` lorsque v2 est inactif et
`getOrderStatusClient` reste appele par la modale Stripe. Ils ne sont donc pas
supprimables sur le seul suffixe « legacy ». Les webhooks doivent etre classes
depuis les endpoints Stripe test et leurs logs, pas depuis leurs noms.

### 6.6 Commerce v2

| Famille | Functions Gen1 | Nb | Action | Vague |
| --- | --- | ---: | --- | --- |
| produit | `adjustInventoryAdmin`, `createProductAdmin`, `createPublishedProductAdmin`, `deleteProductAdmin`, `preflightProductMutationAdmin`, `publishProductAdmin`, `updateProductOfferAdmin` | 7 | `MIGRATE` | G8 |
| fulfillment commande | `archiveOrderAdmin`, `markOrderDeliveredAdmin`, `markOrderPickedUpAdmin`, `markOrderPreparingAdmin`, `markOrderReadyForPickupAdmin`, `markOrderShippedAdmin`, `updateOrderTrackingAdmin` | 7 | `MIGRATE` | G8 |
| annulation | `requestOrderCancellation` | 1 | `MIGRATE` | G8 |
| document prive | `prepareCommerceDocumentDelivery` | 1 | `MIGRATE` | G8 |
| refund | `requestRefundAdmin` | 1 | `MIGRATE` | G9 |
| demande de retour client | `decideCustomerReturnRequestAdmin`, `requestCustomerReturn` | 2 | `MIGRATE` | G8 |
| commandes de retour | `cancelReturnAdmin`, `markReturnReceivedAdmin`, `openReturnAdmin`, `resolveReturnAdmin`, `restockReturnLinesAdmin`, `writeOffReturnLinesAdmin` | 6 | `MIGRATE` | G8 |
| checkout | `createCheckoutV2`, `resumeCheckoutV2` | 2 | `MIGRATE` | G9 |
| lecteurs commandes | `getOrderTimelineAdminV2`, `listCustomerReturnRequestsAdminV2`, `listMyOrdersV2`, `listOrdersAdminV2`, `listReturnsAdminV2` | 5 | `MIGRATE` | G3/G8 |
| operations | `cleanupFixtureRunAdmin`, `commerceOperationsReconciler`, `commerceOutboxDispatcher`, `getCommerceOperationsStatusAdmin`, `rebuildCommerceOperationsAdmin` | 5 | `MIGRATE` | G9 |
| expiration reservation | `commerceReservationExpiryDispatcher` | 1 | `MIGRATE` apres preuve fonctionnelle Gen1 | G9 |
| webhooks v2 | `stripeConnectWebhookV2`, `stripeWebhookV2` | 2 | `MIGRATE` | G10 |
| liens de paiement admin | `cancelAdminPaymentLink`, `createAdminPaymentLink`, `expireAdminPaymentLinks`, `extendAdminPaymentLink`, `getAdminPaymentLinkPublic`, `listAdminPaymentLinks`, `prepareAdminPaymentLinkPayment`, `recreateAdminPaymentLink`, `regenerateAdminPaymentLink`, `resumeAdminPaymentLinkPayment` | 10 | `MIGRATE` | G9/G10 |
| livraison | `getDeliveryPolicyAdmin`, `saveDeliveryPolicyAdmin` | 2 | `MIGRATE` | G8 |
| promotions | `createPromotionCodeAdmin`, `listPromotionCodesAdmin`, `previewPromotionCodeV2`, `setPromotionCodeStatusAdmin` | 4 | `MIGRATE` | G8 |
| total |  | 56 |  |  |

Cette famille est la plus risquee: transactions, command IDs, leases, fences,
inbox/outbox et faits financiers doivent rester identiques sous double
livraison et concurrence.

### 6.7 Cinq exports Instagram locaux en attente de reconciliation

| Functions locales | Action |
| --- | --- |
| `startInstagramOAuthAdmin`, `instagramOAuthCallback`, `getInstagramConnectionStatusAdmin`, `verifyInstagramConnectionAdmin`, `disconnectInstagramConnectionAdmin` | `HOLD_META_RECONCILIATION`: exclure de tout deploiement; en G0, rapprocher PRD, appelants, secrets, redirects et cloud; convertir en Gen2 seulement si conservation approuvee |

Controle arithmetique: 13 Gen2 + 3 exceptions Auth + 22 Auth/analytics + 44
contenu/admin + 14 commerce legacy + 56 commerce v2 = 152 Functions cloud.
Les cinq cibles locales non deployees portent l'inventaire source a 157.

### 6.8 Matrice par type de trigger

Les huit endpoints HTTP bruts, qui ne doivent jamais etre transformes en
callables, sont:

- `syncSessionBeacon`;
- `metaOAuthCallback`;
- `e2eCheckoutProof`;
- `e2eStripeHardeningProof`;
- `stripeWebhook`;
- `stripeConnectWebhook`;
- `stripeWebhookV2`;
- `stripeConnectWebhookV2`.

Les huit schedulers sont:

- Gen1: `commerceOperationsReconciler`, `commerceOutboxDispatcher`,
  `commerceReservationExpiryDispatcher`, `expireAdminPaymentLinks`;
- Gen2: `catalogReconciler`, `catalogMediaGarbageCollector`,
  `cleanupProductPublicationSessions`, `reconcileProductPublicationSessions`.

Les quatre jobs lies aux Gen1 sont observes dans Scheduler `us-central1`, avec
le fuseau `America/Los_Angeles`; les quatre jobs crees par les Gen2 sont en
`europe-west1`/UTC, avec des `attemptDeadline` observes de 180 ou 540 secondes
et un retry config laisse implicite. G0 doit exporter, job par job, expression,
fuseau, region, `retryCount`, `maxRetrySeconds`, backoffs, deadline, cible,
identite OIDC et dernier statut avant toute reproduction.

Les onze triggers evenementiels sont:

- Gen1: `grantAdminOnAuth`, `onRegisteredUserCreated`,
  `onRegisteredUserDeleted`, `onQuoteRequestSubmitted`;
- Gen2: `onCatalogSourceWrite`, `processProductPublicationImage`,
  `onOrderCreated`, `onOrderUpdated`, `onOrderStatsWrite`,
  `onArtifactDeleted`, `onArtifactUpdated`.

Les sept triggers Eventarc Gen2 observes comprennent six triggers Firestore
filtrant explicitement `database=(default)` et `namespace=(default)`, plus le
trigger Storage image en `us-central1`. Le manifeste conserve aussi type exact,
path/pattern, bucket, retry, age maximum et compte d'identite.

Les deux Cloud Tasks, deja Gen2, sont `dispatchCatalogBuild` et
`dispatchCatalogRevalidation`. Les 123 autres Functions cloud sont des
callables Firebase.

### 6.9 Matrice de region

Les six Functions en `us-central1` sont:

- `grantAdminOnAuth`;
- `e2eCheckoutProof`;
- `e2eStripeHardeningProof`;
- `stripeWebhook`;
- `stripeConnectWebhook`;
- `processProductPublicationImage`.

`processProductPublicationImage` doit rester proche du bucket Storage produit.
`grantAdminOnAuth` reste une exception Auth Gen1. Pour les quatre endpoints
legacy/E2E, une convergence de region ne doit etre decidee qu'avec leur sort
fonctionnel; changer simultanement generation et region augmente le risque et
modifie les URL.

Avant de coder chaque vague, exporter un manifeste read-only de la configuration
cloud de chaque cible et comparer apres deploiement au minimum:

- generation, region, trigger et event filters;
- runtime, memoire, CPU, timeout, concurrence;
- min/max instances et ingress;
- compte runtime et compte de build;
- secrets attaches et parametres non secrets, sans leurs valeurs;
- URL/service Cloud Run, revision et etat;
- scheduler/topic/subscription ou queue associee;
- date de mise a jour et labels de deploiement.

## 7. Options runtime et concurrence

### 7.1 Regle de depart

Pour la parite de migration, toute nouvelle cible remplaçant une Gen1 commence
avec les deux options officielles de compatibilite:

```text
cpu: "gcf_gen1"
concurrency: 1
```

Fixer aussi `minInstances: 0` sur le sandbox, le timeout, la memoire et un
`maxInstances` justifie. Ne jamais definir ces valeurs globalement pour les 149
cibles: cela modifierait les Gen2 specialisees et un `minInstances` global
creerait un cout permanent multiplie par le nombre de Functions.

Apres parite et charge, G13 peut adopter un CPU entier et augmenter la
concurrence cible par cible:

| Profil | Exemples | Concurrence de migration | Cible a evaluer en G13 | `maxInstances` initial |
| --- | --- | ---: | ---: | ---: |
| T1 mutation financiere | checkout, refund, webhooks, reservations | 1 | 1, sauf preuve contraire | 5 a 10 |
| T2 scheduler/worker | outbox, reconciler, expiration, payment links | 1 | 1 | 1 |
| T3 mutation admin | stock, commandes, retours, comptes admin | 1 | 1 a 5 | 5 |
| R1 lecture authentifiee | listes/statuts/admin | 1 | 10 a 20 | 10 a 20 |
| R2 analytics | init/sync/beacon | 1 | 10 a 20 | 20 a 30 |
| N1 reseau/e-mail/OTP | Gmail, Resend, Meta, OTP | 1 | 1 a 5 | 5 a 10 |
| C1 CPU/memoire | PDF, images, GC | 1 | 1 | 1 a 2 |

Ces nombres sont des plafonds sandbox de depart, pas des valeurs production
automatiques. Avant de choisir `maxInstances`, calculer la capacite aval
Firestore/Stripe/e-mail, le budget, les quotas regionaux et le comportement en
429. Une limite trop basse peut refuser des requetes; une limite absente peut
amplifier cout, contention et appels fournisseur.

### 7.2 Variables globales identifiees

| Fichier | Etat global | Risque | Gate |
| --- | --- | --- | --- |
| `functions/src/analytics/adminIP.js` | `adminIpCache` TTL cinq minutes | lecture/invalidations concurrentes | test appels concurrents, invalidation et borne memoire |
| `functions/src/analytics/sessions.js` | cache d'autorisation LRU/TTL | acces concurrent au `Map`, cache non partage entre instances | test 100 appels, suppression, tokens faux/vrai, eviction 1 000 |
| `functions/src/email/transactionalEmailRuntime.js` | `cachedRuntime` | reutilisation voulue; verifier transport et reprise | test envois paralleles mockes et reprise apres erreur |

Les autres `Map`/`Set` trouves sont surtout des constantes immuables ou des
structures locales. Une recherche des variables mutables de module doit rester
une gate CI.

## 8. IAM, comptes de service et secrets

### 8.1 Etat IAM observe

Le compte Gen1 `secondevienextjsssr@appspot.gserviceaccount.com` possede
notamment:

- `roles/datastore.user`;
- `roles/firebaseauth.admin`;
- `roles/storage.objectAdmin`;
- `roles/cloudtasks.enqueuer`;
- `roles/logging.logWriter`;
- `roles/serviceusage.serviceUsageConsumer`.

Le compte Compute Gen2
`231220287936-compute@developer.gserviceaccount.com` possede notamment:

- `roles/datastore.user`;
- `roles/storage.objectAdmin`;
- `roles/eventarc.eventReceiver`;
- `roles/run.invoker`;
- `roles/logging.logWriter`;
- `roles/serviceusage.serviceUsageConsumer`.

Il ne possede pas `roles/firebaseauth.admin`. Migrer les callables Auth en
laissant le compte Gen2 par defaut provoquerait donc une regression probable.

Les Functions catalogue utilisent deja deux comptes specialises:

- `catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com`;
- `catalog-builder@secondevienextjsssr.iam.gserviceaccount.com`.

### 8.2 Strategie IAM de migration

Le compte `appspot` observe ne porte ni `roles/eventarc.eventReceiver` ni
`roles/run.invoker` au niveau projet, alors que le compte Compute les porte.
Il reste attache aux Gen1 existantes pendant leur fenetre de rollback, mais
aucune nouvelle cible Gen2 ne doit le reutiliser. Un remplacement evenementiel,
scheduler ou Task peut echouer si l'on copie seulement les permissions metier
du runtime historique.

Pour separer parite metier et refonte IAM sans creer une regression:

1. produire pour chaque cible une matrice `transport -> runtime SA -> invoker ->
   build SA -> permissions Firebase/Google -> secrets`;
2. creer ou selectionner pour chaque nouveau callable/HTTP Gen2 un compte de
   domaine au moindre privilege; reproduire les acces metier requis sans
   assigner le compte global `appspot` a la nouvelle cible;
3. pour Firestore/Eventarc, scheduler et Cloud Tasks, conserver ou ajouter les
   roles techniques minimaux sur la bonne identite et la bonne ressource, sans
   grant projet large implicite;
4. conserver les comptes catalogue specialises et leurs bindings cibles;
5. verifier `run.invoker`, Eventarc, Scheduler, Tasks et Secret Manager par
   transport positif et negatif;
6. ne jamais restituer `roles/editor` et ne pas utiliser `owner` comme runtime;
7. conserver les bindings historiques necessaires au rollback des anciennes
   Gen1 jusqu'a G12-B; en G13, retirer seulement les permissions devenues
   orphelines, avec IAM Policy Simulator et rollback.

L'identite de domaine est donc un prerequis de chaque nouvelle Gen2 et non un
durcissement differe. G13 reste la gate de nettoyage des permissions legacy,
pas le moment de corriger une nouvelle cible deja deployee avec une identite
globale.

### 8.3 Secrets et parametres a recopier explicitement

Chaque nouvelle definition doit lister uniquement ses secrets utiles:

- e-mail: `GMAIL_EMAIL`, `GMAIL_PASSWORD`, `RESEND_API_KEY`;
- OTP: `OTP_HMAC_SECRET` et secrets e-mail;
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WH_SECRET`,
  `STRIPE_CONNECT_WH_SECRET`;
- liens de paiement: `PAYMENT_LINK_HMAC_SECRET`;
- preuves E2E: `E2E_PROOF_TOKEN`;
- admin: `SUPER_ADMIN_EMAIL`;
- Meta/Instagram: identifiants, secrets, URI OAuth et
  `META_TOKEN_ENCRYPTION_KEY`;
- catalogue: `CATALOG_REVALIDATION_HMAC_SECRET`.

Parametres non secrets a preserver:

- region Functions cliente et URL du site;
- provider e-mail et expediteur;
- origins passkey;
- bucket/region media;
- parametres du guide de facturation;
- flags E2E et Meta fermes par defaut.

Un endpoint Stripe possede son propre secret de signature. Le cutover doit
creer des secrets de migration distincts pour les endpoints Gen2; il ne faut
pas supposer que l'ancien secret reconnaitra le nouvel endpoint.

Le manifeste stocke uniquement les noms et versions, jamais les valeurs.
Conserver l'ancienne version active pendant la fenetre de rollback, puis la
desactiver avant destruction. Pour les secrets critiques, evaluer la destruction
differee Secret Manager et une alerte de destruction programmee; supprimer un
secret entier reste immediatement destructif et n'est jamais une action de
nettoyage automatique.

## 9. Architecture de compatibilite a implementer

### 9.0 Garde de deploiement issue de G0

A l'ouverture de G0, le script `functions/package.json` exposait
`firebase deploy --only functions`, donc un deploiement global de `main`. G0
l'a remplace par le wrapper fail-closed
`scripts/deploy-functions-targeted.mjs`. Toute commande autorisee exige
simultanement:

- projet exact `secondevienextjsssr`;
- codebase `main`;
- une allowlist non vide de dix noms maximum;
- syntaxe cible `functions:main:<nom>`;
- confirmation que les cinq Instagram non deployees sont absentes;
- CLI epinglee au depot et version consignee;
- branche/commit et manifeste de configuration hashes;
- arret si une cible hors manifeste est decouverte.

Un `firebase deploy --dry-run` n'est pas classe read-only: la CLI peut preparer
ou activer des API. G0 utilise uniquement les commandes de description/liste et
ne lance aucune forme de deploy. Les cibles financieres, webhooks et schedulers
sont deployees une par une, jamais dans un lot de dix.

### 9.1 Nommage parallele

Convention proposee:

```text
nom Gen1: createCheckoutV2
nom Gen2: createCheckoutV2Gen2
```

Le suffixe reste stable pendant la coexistence. Renommer ensuite la Gen2 vers
l'ancien nom imposerait un second cutover sans benefice; conserver le nom Gen2
derriere un registre client est plus fiable.

Le precontrole des noms proposes avec suffixe ne trouve aucun depassement; le
plus long candidat observe mesure 44 caracteres. Le wrapper G0 doit recalculer
ce controle a chaque nouvel export.

### 9.2 Adaptateur callable

Les corps actuels attendent `(data, context)`. Construire un adaptateur Gen2
commun qui:

1. recoit `request`;
2. transmet `request.data` comme `data`;
3. construit un contexte avec `auth`, `app` et `rawRequest`;
4. conserve `enforceAppCheck: true`;
5. traduit les erreurs `HttpsError` sans perdre `code`, `message`, `details`;
6. journalise nom logique, generation et revision sans secret;
7. interdit toute mutation du contexte partage.

Les tests doivent appeler le meme handler par wrapper Gen1 et Gen2 et comparer
resultat, refus, code d'erreur et effets repository.

### 9.3 Registre client de cibles

Ajouter un registre unique dans le rail Firebase client:

```text
createCheckoutV2 -> createCheckoutV2Gen2
```

Il doit:

- etre teste et versionne;
- rester ferme par environnement;
- permettre un rollback App Hosting vers Gen1;
- couvrir les URL HTTP manuelles;
- ne jamais accepter un nom arbitraire fourni par l'utilisateur.

Tester quatre combinaisons avant retrait: ancien client cache -> Gen1, nouveau
client -> Gen2, rollback du client -> Gen1 et ancien client encore actif apres
le rollout. Un rollback de trafic ne defait aucune ecriture deja produite par
Gen2: paiement, stock ou e-mail exigent reconciliation et eventuelle commande
compensatoire, jamais une restauration globale Firestore pour annuler une
mutation metier.

### 9.4 Triggers evenementiels et schedulers

Pour chaque trigger/scheduler:

- conserver un handler metier independant du provider;
- adapter le `CloudEvent` Gen2;
- utiliser `event.id` dans un meme trigger et une cle metier/claim/outbox
  deterministe entre Gen1 et Gen2; `event.id` seul ne deduplique pas deux
  triggers distincts;
- rendre le chevauchement sans effet double;
- verifier fuseau, expression, topic, region et dernier succes;
- retirer l'ancien apres observation et verification des compteurs.

Firebase precise qu'une Function planifiee peut etre declenchee plusieurs fois
et que l'execution suivante peut chevaucher la precedente. Le deploiement de la
Gen2 cree en outre son propre job. Chaque scheduler migrable doit donc posseder
une preuve individuelle d'exclusion:

- `commerceOperationsReconciler`, `commerceOutboxDispatcher` et
  `commerceReservationExpiryDispatcher`: verifier leases, duree, renouvellement,
  fence et comportement apres crash;
- `expireAdminPaymentLinks`: ajouter d'abord dans la Gen1 un proprietaire de
  generation/kill-switch ou un fence transactionnel; le handler actuel ne
  possede pas de lease globale partagee;
- activer un seul proprietaire a la fois; tester double invocation, timeout et
  reprise; le retour arriere reactive explicitement l'ancien proprietaire.

La simple idempotence de `runtime().expire()` ne remplace pas la preuve de
proprietaire, car deux sweeps peuvent toujours multiplier les appels Stripe,
les logs et la contention.

Les schedulers commerce Gen1 sont controles depuis `us-central1` alors que
leurs Functions tournent en `europe-west1`. Le nom du job contient la region
de Function. Les commandes de verification doivent couvrir cette particularite.

### 9.5 HTTP brutes et fournisseurs

Pour `syncSessionBeacon`, webhooks, E2E et callbacks OAuth:

- conserver methodes, limites de corps, CORS/origins et codes HTTP;
- verifier `req.rawBody` pour Stripe;
- verifier les signatures invalides en negatif;
- creer le nouvel endpoint fournisseur avant retrait de l'ancien;
- prouver la deduplication quand les deux endpoints recoivent un evenement;
- basculer l'URI Meta sans perdre les states OAuth en cours;
- documenter URL et secret de rollback sans inscrire leur valeur.

## 10. Prerequis hors Functions

La migration Gen2 ne doit pas masquer les risques de fiabilite deja trouves.

### P0-A - Recuperation Firestore et plan DR global

Etat Firestore confirme:

- base Standard/Native `(default)` en `eur3`;
- PITR desactive et retention de versions 3 600 secondes;
- protection contre la suppression desactivee;
- zero backup et zero calendrier;
- 13 indexes composites `READY`;
- deux TTL actifs sur `sys_catalog_publication_builds.expireAt` et
  `sys_catalog_publication_events.expireAt`;
- aucun role dedie `backupsAdmin`, `backupSchedulesAdmin` ou `restoreAdmin`
  observe; un Owner projet existe mais ne doit pas servir de role operateur
  permanent.

Drill Firestore obligatoire:

1. approuver cout, RPO/RTO et retentions, puis activer la protection de
   suppression; rappeler qu'elle ne protege pas les documents. Attribuer a
   l'operateur seulement les roles backup/schedule/restore necessaires et
   temporaires, jamais `Owner` comme procedure normale;
2. activer PITR et noter que la fenetre de sept jours se constitue a partir de
   l'activation;
3. creer au maximum un schedule quotidien et un hebdomadaire, avec retentions
   explicites dans la limite de quatorze semaines;
4. attendre un backup `READY` avant de parler de restauration prouvee;
5. restaurer vers une nouvelle base nommee `restore-drill-*` du meme projet et
   de la meme localisation, jamais vers `(default)`;
6. ne raccorder ni App Hosting, ni clients, ni Gen1 a cette base; les SDK
   ciblent `(default)` par defaut et les triggers Firestore Gen1 ne supportent
   pas les bases nommees;
7. acceder avec un Admin SDK explicitement configure avec le `databaseId`;
8. attendre la fin du restore et les 13 indexes `READY`, puis rapprocher
   racines, sous-collections/collection groups, comptages, hashes et invariants
   commandes/stock/faits/projections sans restituer de PII;
9. verifier que les Rules de la base restauree restent fail-closed; ne deployer
   des Rules dediees que si un test client explicite l'exige. Revalider IAM,
   puis reappliquer les deux TTL seulement apres toutes les preuves: un backup
   restaure donnees + indexes, pas Rules ni TTL;
10. mesurer RPO, RTO, cout, temps de construction d'index et chemin de recopie
    selectif vers `(default)`;
11. documenter qu'un restore gere n'est pas un failover. Une isolation dans un
    autre projet exige export/import; une restauration in-place avec suppression
    de `(default)` est une procedure catastrophique distincte et interdite dans
    le drill;
12. conserver puis supprimer la base de drill uniquement sous approbation
    destructive separee.

Valeurs par defaut a faire approuver: PITR sept jours, backup quotidien garde
14 jours, backup hebdomadaire garde quatorze semaines. Objectifs provisoires,
non encore prouves: RPO inferieur ou egal a une minute dans la fenetre PITR,
sinon dernier backup quotidien inferieur ou egal a 24 heures; RTO commerce
inferieur ou egal a quatre heures pour le faible volume actuel. Le RTO ne
s'arrete pas quand la base est `READY`, mais apres reconciliation cross-service.

Preuve supplementaire: les six triggers Eventarc Firestore observes filtrent
explicitement `database=(default)` et `namespace=(default)`. Ils ne recevront
donc aucun evenement de la base nommee du drill. Cette absence de trafic est le
comportement attendu d'un exercice de restauration, pas une preuve de failover.

PITR/backup Firestore ne protegent pas tout le service. Le runbook DR doit aussi
inventorier et exercer proportionnellement:

| Actif | Protection/preuve attendue |
| --- | --- |
| Firebase Auth | export chiffre et borne, import test dans cible isolee, parametres Scrypt traites comme secrets, claims controles, procedure de revocation; aucune copie banale de comptes live |
| Storage media et catalogue | soft delete 7 jours confirme sur les deux buckets metier; versioning absent. Restaurer un objet synthetique non sensible avec hash/metadata/IAM; ne pas toucher un media client. Le bucket source App Hosting a aussi un lifecycle 30 jours |
| Secret Manager | inventaire noms/versions/IAM sans valeur, anciennes versions gardees pendant rollback, destruction differee evaluee et alertee |
| configuration | Rules, indexes, TTL, IAM, Scheduler, queues, alertes, `firebase.json`, `apphosting.yaml` et manifests reproductibles |
| App Hosting | rollout stable identifie, rollback instantane et rollback reconstruit distingues, smoke apres retour |
| Stripe/Meta/e-mail | endpoints, evenements, redirects et versions de secrets documentes sans leur valeur; aucune dependance a une console non inventoriee |

Une base `READY` et des hashes corrects ne suffisent pas a remettre le commerce
en service. Le runbook post-restore doit geler checkout et ecritures admin,
puis rapprocher depuis le point de restauration: paiements/refunds/webhooks
Stripe, stock physique/mouvements/idempotence, inbox/outbox/leases, profils Auth,
claims/revocations et registre admin, references Storage/PDF, ainsi que les
suppressions/anonymisations legales posterieures au snapshot. La retention des
backups doit etre raccordee aux obligations RGPD/comptables, car un backup peut
conserver temporairement une donnee supprimee de la base active.

Gate: aucune ecriture de donnees ou vague commerce mutatrice avant restore drill
Firestore et runbook DR approuves. Les correctifs locaux peuvent etre prepares
avant, mais pas deployes sans observabilite.

### P0-B - Incident financier et calcul de sante

Etat actuel:

- 10 incidents conserves, dont 1 ouvert `terminal_refund_conflict`;
- la commande liee est `needs_review`; paiement fournisseur reussi, tentative
  de refund marquee en echec mais un `refundId` existe;
- les faits montrent capture, refund et refund reversal de meme montant;
- `sys_commerce_operations/current.status` vaut pourtant `healthy` et les neuf
  compteurs connus valent zero;
- le calcul actuel ne connait que `healthy/stop`, pas encore `warning`, et une
  sante ancienne peut rester verte si le reconciler cesse de tourner.

Cause code:

- `buildHealth` ne compte que certaines familles et ignore notamment
  `terminal_refund_conflict`, des orphelins/mismatches et les codes inconnus;
- la lecture bornee a 100 incidents ne rend pas la troncature visible;
- les incidents synthetiques `operations-*` sont derives. Un futur
  « count-all » naif se compterait lui-meme et empecherait le retour a vert.

Taches:

1. conserver l'incident ouvert jusqu'au deploiement du correctif afin de prouver
   `healthy -> stop`; ne jamais rejouer le refund pour explorer;
2. definir une table `code -> severite`, inconnus fail-closed, avec tout incident
   financier primaire ouvert au minimum `warning` et conflits terminaux,
   orphelins/divergences/unknown a `stop`;
3. publier `primaryOpenIncidentCount`, histogramme code/severite, echantillons
   bornes, marqueur `truncated` et fraicheur; une sante stale/unknown n'est
   jamais `healthy`;
4. exclure les incidents derives `operations-*` du comptage primaire tout en
   les gardant auditables;
5. ajouter une resolution controlee avec expected version, evidence,
   `resolutionCode`, note, `resolvedBy`, date et audit AAL2;
6. afficher banniere, total, codes, fraicheur et troncature dans le back-office;
7. tester healthy/warning/stop, code inconnu, plus de 100 incidents, doublon,
   boucle derivee, stale, resolution et retour justifie a healthy;
8. apres preuve du `stop`, rapprocher Stripe en lecture seule, puis resoudre ou
   maintenir l'incident avec justification, sans replay financier;
9. alerter sur ouverture, transition, `warning`, `stop`, stale et resolution.

La sante n'est aujourd'hui pas branchee directement au runtime checkout:
`prepareCheckout` lit le controle commerce, pas
`sys_commerce_operations/current`. G1 doit prendre une decision explicite et
testee entre:

- sante observationnelle, alerte immediate et kill-switch actionne par runbook;
- circuit breaker automatique sur `stop` ou stale, avec seuils, reprise et
  tests de non-blocage des erreurs non financieres.

Ne pas presenter un blocage checkout comme automatique avant ce cablage. Le
reconciler financier relit jusqu'a 5 000 faits et ne tourne qu'une fois par
heure: separer si possible le heartbeat/signal de sante leger du rebuild lourd,
ou au minimum alerter des la creation d'un incident et sur toute sante stale.

Gate: aucun paiement reel tant que ce faux vert ou une resolution non auditee
reste possible.

### P0-C - Dispatcher d'expiration

Etat actuel:

- Gen1 Node 22 `ACTIVE` en `europe-west1`, version cloud 2;
- scheduler `ENABLED` toutes les deux minutes et executions recentes `ok`;
- 107 reservations observees, zero hold actuellement `held/expired`;
- les runs recents sont donc surtout no-op et prouvent la plateforme, pas le
  scenario metier d'expiration;
- le sweeper traite au plus 25 x 4 = 100 candidats par run;
- `commerce_reservation_expiry_incomplete` est journalise en cas d'erreurs ou
  d'epuisement, puis le handler retourne succes; la plateforme ne retry donc pas;
- cadence deux minutes, timeout cinq minutes et plafond Gen1 effectif large
  rendent un chevauchement possible.

Taches:

1. produire un signal structure `completed/incomplete` avec failures,
   exhausted, backlog age, dernier succes reel et holds expires;
2. choisir un retry borne ou une file durable de travail echoue; ne pas laisser
   une erreur aval devenir un succes silencieux;
3. alerter sur absence de completion Function, incomplete, backlog/exhausted et
   `expiredHolds`, pas seulement sur le publish Scheduler;
4. fixer/proteger le chevauchement Gen1, puis definir en Gen2
   `concurrency: 1`, `maxInstances: 1` et le mecanisme de proprietaire;
5. creer un hold Stripe test borne, laisser expirer et verifier annulation
   fournisseur avant liberation, transition, mouvement unique, stock +1,
   commande close et reservation released;
6. rejouer pour prouver zero double liberation et tester les races
   `succeeded/processing`, l'echec fournisseur et l'ouverture/resolution de
   l'alerte.

Appliquer le meme contrat aux autres sweepers: l'outbox peut retourner
`failures/exhausted` apres deux lots bornes sans faire echouer la Function, et
l'expiration des liens de paiement capture les erreurs puis retourne succes.
Avant live, chacun doit exposer completion/incomplete, age/backlog, retry ou
travail echoue durable, proprietaire/overlap et alerte sur le resultat aval.

Le probleme de disponibilite est corrige; le succes metier et la visibilite des
echecs ne le sont pas encore.

### P0-D - Monitoring, budgets et runbooks

Etat confirme:

- zero politique Monitoring;
- zero metrique logs personnalisee;
- zero dashboard personnalise;
- canaux de notification non verifies avec la version CLI disponible;
- budgets Cloud Billing `NON_VERIFIES`: l'API Budget et/ou les droits du compte
  de facturation n'ont pas permis la lecture, et aucune API n'a ete activee.

Budget, Monitoring et quotas sont trois controles distincts. Un budget avertit
avec retard et ne bloque pas la facture; une alerte quota exige une policy
Monitoring; `maxInstances` est un garde-fou runtime, pas un budget.

Alertes minimales avant tout prochain deploiement Gen2:

- App Hosting/Cloud Run et Function non prets, 5xx, 429, taux d'erreur, latence
  p95/p99, CPU, memoire, instances et cold starts;
- heartbeat/completion de chaque scheduler, overlap et execution incomplete;
- Cloud Tasks backlog/age/echec et Eventarc retry/double livraison;
- sante commerce `warning/stop/stale`, incident primaire ouvert, holds expires,
  inbox/outbox en retard, lease expiree, dead-letter, `deliveryUnknown`,
  orphelins et divergences;
- webhooks Stripe 4xx/5xx, signature invalide anormale et evenement trop ancien;
- refus Auth/App Check anormal, OTP/rate limit et revocations;
- quotas/deploiements/couts et publication/revalidation catalogue.

Chaque alerte exige seuil, fenetre, comportement en absence de donnees,
proprietaire, canal principal et secours testes, runbook, test d'ouverture et de
resolution, puis politique anti-bruit. Les metriques basees sur les logs sont
facturables: labels de faible cardinalite, sans e-mail, UID, IP, orderId brut ni
secret. Ajouter les runbooks `payment ambiguity/refund conflict`, reservation
expiree, webhook/inbox/outbox, restore et derive de cout.

Baseline logs:

- aucune entree `severity >= ERROR` n'a ete retournee sur les dernieres 24 h
  au moment du controle;
- la fenetre de sept jours contenait 369 entrees associees a
  `dispatchCatalogRevalidation`, principalement
  `CATALOG_SERVED_ROUTE_HTTP_404` et `CATALOG_SERVED_VERSION_STALE`, dont la
  derniere le 2026-08-12;
- `listMyOrdersV2` comptait 10 entrees sur cette meme fenetre;
- de nombreuses Functions portaient une entree unique le 2026-08-11 pendant
  les echecs/reprises de deploiement IAM.

Avant G4, classifier ces erreurs en erreurs runtime, retries attendus ou
echecs de deploiement, puis figer une baseline zero/non-zero par Function. Une
migration ne doit pas etre declaree responsable d'un bruit anterieur, mais elle
ne doit pas non plus le masquer.

### P1-A - Donnees legacy et coherence des KPI

Cette hygiene est importante avant la migration des mutations commerce G8/G9,
mais elle ne bloque ni G0-G7 ni, a elle seule, les paiements: le code traite une
`inventoryVersion` absente comme 0 et les commandes legacy restent fail-closed.

Etat actuel:

- 36 meubles, dont 10 sans entier `inventoryVersion`;
- 125 commandes, dont 99 v2 et 26 legacy;
- parmi les 26 legacy: 10 `refunded`, 6 `paid`, 6 `canceled`, 2
  `cancelled_by_client` et 2 `payment_failed`.

Le manifeste historique
`logs/commerce/gate6/classification-manifest.json` du 2026-07-28 classait ces
26 commandes `needs_review`, mais il precede le rail v2 (`v2Existing: 0`) et le
controle actuel. C'est une preuve historique, pas une classification finale;
les commandes payees/remboursees exigent un rapprochement Stripe read-only.

Taches meubles:

1. dry-run avec IDs/hashes, `updateTime`, stock/statut et valeur proposee 0;
2. sauvegarde et manifeste;
3. refus des stocks invalides/ambigus;
4. batch borne avec precondition `lastUpdateTime`, skip des races et courte
   fenetre admin;
5. recomptage zero manquant;
6. anticiper le trigger catalogue et verifier snapshot, prix, stock et
   mouvements strictement inchanges;
7. rollback seulement si l'etat correspond encore exactement au backfill.

Taches commandes:

1. rendre le classificateur strictement read-only lorsque `v2_all` est actif,
   ou autoriser une fenetre checkout-off explicite; le script actuel refuse ce
   mode et son commit est impossible par conception;
2. rejouer le classificateur dry-run et son digest;
3. distinguer terminales, non terminales, payees, remboursees, ambiguës;
4. ne jamais inventer un etat v2 historique;
5. conserver snapshots, faits et obligations comptables;
6. documenter le reader/adapter legacy;
7. migrer seulement les champs prouvables;
8. segmenter les KPI `all/v2/legacy`: le revenu v2 ne doit pas etre divise par
   un nombre de commandes toutes cohortes;
9. tester listes, documents et KPI par classe.

### P1-B - Reconciler financier et montee en charge

Le rebuild courant borne silencieusement les faits a 5 000 et les commandes v2
a 500, sans pagination deterministe complete. Ce n'est pas un blocage pour les
volumes actuels, mais ce serait un faux calcul de sante/projection a mesure que
la boutique grandit.

Avant d'approcher ces seuils: count et `truncated` fail-closed, pagination
deterministe, checkpoints/lots reprenables, publication atomique seulement
apres couverture complete et digest stable, puis tests au-dela de 5 000 faits,
500 commandes et reprise apres timeout. Separer le heartbeat/signal de sante du
rebuild financier horaire.

### P2-A - Collections analytics historiques

Leur inventaire est obligatoire; leur suppression ne bloque ni Gen2 ni le
paiement et reste hors chemin critique.

Comptages observes le 2026-08-14/15:

| Collection | Documents | Classification |
| --- | ---: | --- |
| `analytics_sessions` | 345 | active, moteur courant |
| `analytics_admin_audit_v3` | 605 | historique/residuelle, aucun consommateur courant prouve |
| `analytics_business_facts_v3` | 1 | historique |
| `analytics_session_facts_v3` | 14 | historique |
| `analytics_sessions_v3` | 14 | historique/residuelle |
| `analytics_rollup_days_v3` | 3 | historique |
| `analytics_rollup_months_v3` | 0 | historique vide |
| `analytics_page_daily` | 6 | historique |
| `analytics_transition_daily` | 2 | historique |
| `analytics_unique_markers` | 7 | historique |
| `analytics_item_daily` | 7 | ancien rollup; retention encore referencee, producteur actif non prouve |

A ne pas confondre avec des orphelines:

- `dashboard_stats` (1), alimente par `onOrderStatsWrite` et lu par l'admin;
- `inventory_stats` (1), alimente par le builder et lu par l'admin;
- `sales_stats_daily` (8), alimente par `onOrderStatsWrite` et lu par l'admin.

Protocole avant suppression historique:

1. exporter avec manifestes/comptages/hashes;
2. analyser Data Access sur tous les parcours;
3. fermer les anciens bundles susceptibles d'ecrire du V3;
4. verifier code, Functions, Cloud Run, scripts, rules, indexes et consoles;
5. appliquer une quarantaine instrumentee sans lecture/ecriture pendant une
   fenetre approuvee, suffisamment longue pour couvrir les parcours rares;
6. faire approuver la liste exacte;
7. supprimer par petits lots avec rollback par import;
8. retirer rules/indexes/retention apres les donnees et producteurs.

La classification et le manifeste peuvent etre prepares en G1. Les etapes 5 a
8 attendent le post-cutover et une autorisation destructive distincte.

La politique canonique actuelle conserve ces anciens rollups 366 jours et ne
programme pas leur purge. Une suppression avant echeance ne peut donc pas etre
presentee comme l'application automatique de la retention: elle exige une
decision explicite de minimisation, la mise a jour de la politique canonique et
toutes les preuves ci-dessus.

### Synthese des priorites

| Niveau | Bloque | Contenu |
| --- | --- | --- |
| P0 | paiements reels, production et nouvelles vagues Gen2 cloud | DR/restore global, alertes/runbooks, faux `healthy`/incident financier, preuve metier et contrat d'echec des workers |
| P1 | montee en charge et migration des mutations commerce G8/G9 selon la gate | 10 `inventoryVersion`, 26 commandes/KPI, budgets/quota, pagination du reconciler, charge/couts |
| P2 | rien dans la demo ni le cutover fonctionnel | purge analytics historique, convergence regionale, codebase/optimisations non critiques |

Le sandbox reste presentable a la cliente avec Stripe test borne et surveillance
manuelle. Ce verdict n'autorise aucun paiement live tant que les quatre P0 ne
sont pas fermes.

## 11. Phases d'implementation fermees

Les phases sont sequentielles pour les mutations cloud. Les correctifs locaux
peuvent etre prepares en parallele, mais une gate non fermee interdit la vague
suivante. Le premier agent d'execution n'est autorise a lancer que G0.

### G0 - Baseline, garde de deploiement et decisions

1. identifier branche, commit, Node, pnpm, Firebase CLI et operateur;
2. refuser toute commande dont le projet explicite n'est pas
   `secondevienextjsssr`: la configuration `gcloud` globale observée pointe sur
   `vibefx-v2`;
3. regenerer un manifeste machine a 157 lignes et rapprocher les 152 cibles
   cloud. Pour chaque export: generation, type/filtre, region, runtime/build/
   invoker SA, IAM, secrets noms/versions, CPU, memoire, timeout, concurrence,
   min/max, retry, appelants, lectures/ecritures, idempotence, overlap, vague,
   observation et rollback;
4. rapprocher les treize Gen2 source/cloud, les queues, Scheduler, Eventarc et
   les chapitres canoniques. Consigner les drifts `map.md`/infrastructure;
5. remplacer le script global `firebase deploy --only functions` par un garde
   fail-closed exigeant projet, codebase, commit, manifeste et allowlist non
   vide de dix noms maximum. Finance, webhook et scheduler: une cible;
6. classer chaque export `KEEP_GEN2`, `KEEP_GEN1_AUTH`, `MIGRATE`,
   `MIGRATE_OR_RETIRE` ou `HOLD_META_RECONCILIATION`;
7. resoudre la contradiction entre PRD Meta, neuf cibles Meta cloud et cinq
   exports Instagram locaux; jusque-la, ces cinq noms sont exclus de toute
   allowlist;
8. fermer les decisions sur E2E, maintenance, publication historique,
   commerce legacy, sante observationnelle ou circuit breaker, et proprietaire
   des schedulers;
9. interdire tout nouveau trigger Auth Gen1 hors des trois exceptions et ajouter
   une CI qui refuse `functions.config()`; aucun usage actuel n'en a ete trouve.

Gate: 152/152 cloud et 157/157 source rapproches, zero ecart inexpliqué,
allowlist fail-closed testee, cinq Instagram en hold explicite, manifestes de
rollback et responsables nommes. G0 est strictement read-only cote cloud.

Execution G0 du 2026-08-15: gate fermee. Les preuves machine sont
`apphostingaudit/manifests/functions-g0.json`,
`apphostingaudit/manifests/functions-platform-g0.json` et
`apphostingaudit/manifests/functions-g0-digests.json`. Le rapprochement retrouve
exactement 152 cibles cloud sur 157 exports locaux; les cinq seules absences
sont les exports Instagram directs places sous `HOLD_META_RECONCILIATION`.
Le wrapper `scripts/deploy-functions-targeted.mjs` remplace le script global et
ses contrats sont couverts par `tests/functions-gen2-g0.test.mjs`.

La contradiction Meta est expliquee par l'ordre historique: la suppression
cloud documentee par la stabilisation securite a precede le merge `6be360e`,
qui a reintroduit les cinq exports et leurs appelants UI dans le source. Les
preuves M4/M5 restent historiques; elles ne prouvent pas que les cinq cibles
sont encore deployees. G0 ne choisit ni redeploiement ni retrait: G7 devra
requalifier secrets, redirect, callback, App Check, IAM et rollback avant de
lever formellement le hold.

Aucun deploiement, build, paiement, suppression, ecriture Firestore/Storage,
mutation IAM, secret ou configuration cloud n'a ete effectue en G0. G1 reste
interdite sans nouvelle autorisation explicite.

### G1 - Fermer les quatre P0 operationnels avant toute nouvelle Gen2

L'ordre interne est obligatoire:

1. **G1-A Observabilite:** creer canaux redondants, alertes minimales,
   dashboard et runbooks; tester ouverture, reception, acquittement et retour.
   Le statut Budget reste `NON_VERIFIE` jusqu'a lecture par un operateur Billing
   autorise. Une ecriture cloud exige son autorisation explicite;
2. **G1-B Protection:** activer delete protection, PITR et schedules proposes
   quotidien 14 jours + hebdomadaire 14 semaines, apres validation cout/RGPD;
   attendre un backup `READY`;
3. **G1-C Reprise:** restaurer dans une base nommee du meme projet, verifier
   donnees/indexes/Rules/IAM/TTL, exercer Auth/Storage/secrets/config, mesurer
   RPO/RTO et interdire tout branchement du trafic applicatif;
4. **G1-D Sante:** corriger et tester le calcul, la fraicheur, la troncature,
   la resolution auditee et l'affichage. Deployer par allowlist seulement apres
   G1-A et G1-C, prouver l'incident actuel `healthy -> stop`, rapprocher Stripe en
   lecture seule, puis resoudre sans replay si les faits le justifient;
5. **G1-E Workers:** instrumenter completion/incomplete, backlog, failures,
   retry et overlap du dispatcher reservations, de l'outbox et des liens de
   paiement. Prouver le dispatcher avec un scenario Stripe test borne et sûr;
6. **G1-F Donnees P1:** preparer sauvegarde, dry-runs et plans pour les dix
   `inventoryVersion`, les 26 commandes et les KPI; aucune ecriture n'est
   requise pour fermer G0-G7;
7. **G1-G Analytics P2:** classifier/exporter seulement. Une purge anticipee
   exige une decision de retention distincte et reste post-cutover.

Gate avant toute cible Gen2 supplementaire: restauration réellement prouvee,
alertes/runbooks testes, faux vert ferme, incident financier arbitre sans
replay et dispatcher prouve idempotent. Aucun paiement reel n'est autorise.

#### Execution G1 du 2026-08-15 - `G1_EN_COURS`

La cible effective a ete verifiee sur `secondevienextjsssr`; la configuration
globale `gcloud` reste hors autorite. Les protections suivantes sont actives
sur la base `(default)` `eur3`: delete protection, PITR sept jours, schedule
quotidien quatorze jours et schedule hebdomadaire dimanche UTC quatorze
semaines. La mesure Monitoring avant activation etait de 41 171 420 octets.
Un backup `READY` a ensuite ete produit avec un snapshot au
`2026-08-15T17:54:15.202270Z`. Le restore vers
`restore-drill-20260815-a` a demarre a `18:17:09Z` et s'est terminee
`SUCCESSFUL` a `18:34:54Z`; la destination inexistante avant l'appel reste sans
trafic et protegee contre la suppression. Le RPO observe est de 1 374 secondes
et le RTO du restore gere de 1 064 secondes.

La reconciliation PITR au snapshot exact retrouve 60 collections racines et
toutes les collections critiques sans drift, 13/13 indexes identiques, les
deux TTL source absents comme documente, aucun IAM public et un refus anonyme
403. L'isolation cross-service compte Auth, buckets et versions de secrets sans
sortir PII ni valeur secrete; aucun runtime ou Eventarc ne cible la base nommee.

G1-A a cree cinq metriques logs, huit policies et un dashboard. Un log
synthetique sans PII a produit une notification primaire `ALERT`, puis
`RESOLVED` quarante secondes plus tard. La destination Gmail sandbox n'a pas
ete reutilisee. Un canal secondaire Pub/Sub interne a ete cree, les huit
policies y sont rattachees et un nouveau test a livre puis acquitte les messages
d'ouverture et de resolution. Le service agent Monitoring ne peut publier que
sur le topic G1.

Les correctifs locaux ferment le faux vert dans le calcul de sante, rendent
stale/inconnu/tronque fail-closed, exposent les incidents primaires dans
l'admin et font echouer les trois workers commerce apres un run incomplet. Les
plafonds locaux de ces schedulers sont `maxInstances: 1`. Ils ne sont pas
deployes: G1-D/E attendent obligatoirement G1-A et G1-C. L'incident primaire
`terminal_refund_conflict` reste ouvert; le rapprochement Stripe strictement
read-only confirme le mode test, un refund fournisseur `failed` et des faits
capture/refund/reversal equilibres. La decision reste
`CANDIDATE_RESOLUTION_REVERSAL_BALANCED`, sans resolution ni replay avant la
preuve de transition `healthy -> stop`.

G1-F/G restent read-only. Le classificateur accepte desormais le dry-run sous
`v2_all`, mais son mode commit demeure ferme; les 26 commandes legacy sont
`needs_review`, dont dix non terminales. Le manifeste data retrouve dix
meubles sans `inventoryVersion`, tous eligibles a la valeur proposee 0 apres
backup/restore/approbation G8 et precondition `lastUpdateTime`. Les onze
collections analytics retrouvent les comptages de l'audit; seuls leurs
identifiants/updateTimes sont hashes, aucun payload ni purge n'a ete produit.

Verdict intermediaire: `G1_HOLD_HEALTH_AND_WORKER_PROOFS`. Aucun deploy
Functions/App Hosting, paiement, refund, replay, restock, ecriture de document,
suppression ou passage a G2 n'a ete effectue.

Le premier essai de deploiement cible du reconciler a valide le wrapper puis a
echoue pendant l'upload du bundle, avant mise a jour Cloud Functions. La cible
est restee `ACTIVE`, Gen1 version 11, mise a jour du 2026-08-13. La verification
post-echec a revele qu'elle reutilise encore le compte runtime global
`secondevienextjsssr@appspot.gserviceaccount.com`, lequel porte notamment Auth
admin, Storage object admin et Tasks enqueuer en plus de Firestore/logging. Ce
profil est interdit par les invariants du chantier. Aucun retry n'a ete lance.

Le hold IAM a ete leve localement et cote cloud par le manifeste
`functions-gen2-g1-runtime-iam.json`: le compte dedie
`commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com`
porte exactement `datastore.user`, `logging.logWriter` et
`serviceusage.serviceUsageConsumer`, sans cle utilisateur, impersonation
publique, Auth, Storage, Tasks, Editor ou Owner. La source epingle cette
identite uniquement sur le reconciler et un test interdit sa regression.

Le retry autorise du reconciler a ensuite echoue avant mise a jour sur la
lecture Firebase `adminSdkConfig`. La version 11 est restee `ACTIVE`, runtime
global appspot, `512 MB`, timeout `300 s`, et aucun code ni IAM runtime n'a ete
bascule. `firebase projects:list` a reproduit le meme `AggregateError`; la
lecture a reussi avec `NODE_OPTIONS=--dns-result-order=ipv4first`. Le wrapper
borne maintenant cette option au processus Firebase CLI et son test verifie
qu'elle n'est ni globale ni dupliquee.

Le chemin Firebase reste bloque avec la session locale meme apres priorite
IPv4; ADC et le jeton gcloud confirment que les API et permissions cloud sont
joignables, mais `FIREBASE_TOKEN` n'est pas un transport de deploy acceptable.
Aucune cle de service n'a ete creee. Le wrapper porte donc un fallback
`gcloud-gen1` borne exclusivement a `commerceOperationsReconciler`, avec projet,
generation Gen1, source, entry point, trigger, runtime, build/runtime SA,
memoire, timeout, max instances, retry et ingress explicites. Le preflight lit
la Function active et refuse tout drift de nom, etat ou trigger.

Le fallback a deploye avec succes la version 12 le 2026-08-15, build
`6f3e9e27-b8cf-4674-90f5-2dddcb3d4a8f`: `ACTIVE`, Gen1, Node 22, compte runtime
dedie, build SA preserve, 512 MB, timeout 300 s, max instances 1, retry desactive,
variables et topic inchanges. Une execution manuelle unique du scheduler a
termine en 6,375 s (`o24ki8o5hysl`) et publie `commerce_health_unhealthy` avec
`status: stop`, schema 3, un incident primaire, aucune troncature et une validite
de 90 minutes. L'audit immediat confirme zero compteur operationnel divergent et
un seul incident `terminal_refund_conflict`.

Nouveau verdict: `G1_HEALTH_STOP_PROVED_INCIDENT_RESOLUTION_READY`. Le resolver
`resolve-commerce-incident-g1.mjs` reste read-only par defaut et exige projet,
sandbox, HEAD, acteur et approbation litterale. En apply, il ne peut fermer que
l'unique incident si Stripe test est terminal, refund/reversal sont exactement
equilibres et la sante est `stop`; il ecrit seulement l'incident et un evenement
append-only. Aucun replay, refund, restock, changement commande/tentative/fait
financier n'est permis. Le rollback code exact est le redeploiement cible de la
source pre-correctif `f80dc7213a8d738fb1edde11a926028bcb57ab28` depuis un
worktree isole, en conservant le compte runtime dedie et toute la configuration
de la version 12; ne jamais restaurer le compte appspot global.

La resolution explicitement autorisee a ensuite applique exactement deux
ecritures transactionnelles avec le digest
`a87c96b47001269a60c638ea90c0d8ffc867a7bcd34fc1b80dd229a68684b872`:
fermeture de l'incident et evenement append-only. Les preuves de sortie portent
`orderMutated: false`, `refundMutated: false`, `financialFactsMutated: false` et
`stockMutated: false`. Le run suivant `e1tqg5pqyj5o` a termine `ok` en 3,696 s
avec `status: healthy`, zero incident primaire et aucune troncature. L'audit
read-only confirme zero incident ouvert et zero compteur operationnel divergent;
la triage retourne correctement `G1_INCIDENT_EXPECTED_ONE:0`.

Verdict courant: `G1_HEALTH_INCIDENT_CLOSED_WORKERS_NEXT`. G1-E reprend un seul
worker par deploiement, avec compte runtime dedie minimal et preuve de completion
ou d'echec; G2 reste interdit tant que les trois workers ne sont pas qualifies.

Les comptes `commerce-reservation-expiry`, `commerce-outbox-dispatcher` et
`admin-payment-link-expiry` ont ensuite ete crees sans cle. Le manifeste
`functions-gen2-g1-worker-iam.json` prouve pour chacun exactement
`datastore.user`, `logging.logWriter`, `serviceusage.serviceUsageConsumer`, zero
cle utilisateur, aucune impersonation publique et uniquement les secrets deja
lies a sa Function. Aucune valeur de secret n'a ete lue. Verdict courant:
`G1_E_RUNTIME_IAM_VERIFIED_RESERVATION_NEXT`; le premier deploy reste borne au
seul `commerceReservationExpiryDispatcher`.

G1-E est ensuite fermee un scheduler a la fois. Les versions actives sont
`commerceReservationExpiryDispatcher` v3, `commerceOutboxDispatcher` v11 et
`expireAdminPaymentLinks` v5, chacune sur son compte runtime dedie, 512 MB,
timeout 300 s, `maxInstances: 1`, retry Function desactive et seules les
versions de secrets attendues. Les runs outbox et liens de paiement sont
`completed`, zero echec, non epuises et sans element a traiter.

La preuve metier du dispatcher utilise le runner fail-closed
`functions:prove-reservation-expiry:g1` au commit
`6a48a09db7fbd47f00efc79d298a068872e3a126`. La fixture historique ayant ete
nettoyee, il a recree uniquement son produit deterministe `e2eOnly` stock 10.
Stripe est strictement en test. Le run `i41gvihfcdsf` a traite exactement une
reservation expiree: annulation fournisseur observee avant liberation, stock
10 -> 9 -> 10, mouvement `release` unique, `releasedQty: 1` et
`restockedQty: 0`. Le replay scheduler `i41gxiq28x2v` a traite zero element;
le mouvement et le stock sont demeures inchanges. Aucun refund, replay
financier, restock ou suppression n'a ete effectue. L'audit final conserve
`healthy`, schema 3, zero incident ouvert, zero compteur divergent et aucune
troncature. Le manifeste complet est
`functions-gen2-g1-worker-rollout.json`.

Verdict G1 final: `G1_TERMINEE_G2_A_LOCAL_ONLY`. Les quatre P0 sont fermes; le
budget Billing reste `NON_VERIFIE` et les plans P1/P2 restent sans ecriture,
mais ne bloquent pas G2-A local. G2-B conserve son autorisation cloud distincte.

### G2 - Socle Gen2 et stabilisation des treize cibles existantes

**G2-A local, sans deploiement:**

- module Gen2 et adaptateur callable avec erreurs compatibles;
- registre de noms client et URLs, quatre combinaisons ancien/nouveau client et
  backend, test d'un onglet ancien;
- profil initial de toute Gen1 migree: `cpu: "gcf_gen1"`, `concurrency: 1`,
  `minInstances: 0`, memoire/timeout/instances explicites et plafond par cible;
- matrice IAM transport -> runtime -> invoker/OIDC -> build -> droits metier ->
  secrets, sans compte global par defaut;
- manifeste scheduler complet: horaire, fuseau, region du job, retry/backoff,
  deadline, timeout, identite OIDC, owner/lease et kill-switch;
- manifeste evenement complet: filtres exacts, retry, age maximum, ordre non
  garanti, cle metier/claim/outbox; `event.id` seul ne deduplique pas deux
  triggers distincts;
- logs structures avec generation, revision et correlation sans PII;
- stabilisation obligatoire des treize Gen2: ledger/projection deterministe
  pour `onOrderStatsWrite`, outbox/claim et plafond fournisseur pour les deux
  e-mails, vraie strategie retry du worker image, alignement Task
  timeout/deadline apres mesure p99, plafonds explicites des quatre schedulers;
- claim/outbox Gen1-compatible pour `onQuoteRequestSubmitted` avant sa
  coexistence Gen1/Gen2;
- tests du wrapper, parite, erreurs, doubles livraisons et globals mutables.

Gate G2-A: code/tests locaux verts, options et IAM explicites cible par cible,
diff et rollback approuves. Aucune ecriture cloud pendant G2-A.

#### Execution G2-A1 locale - projection stats

Le premier lot local ferme le risque de double increment de
`onOrderStatsWrite`. La Function relit desormais la commande autoritaire et le
ledger backend-only `order_stats_projections/{orderId}` dans une transaction;
un replay ou evenement ancien converge vers la projection courante. Une
commande legacy historique sans ledger echoue avant tout increment. Le runtime
cible est explicite: Gen2 `europe-west1`, CPU 1, concurrence 1, min 0, max 1,
256 MiB, timeout 60 s, retry actif et compte dedie planifie
`order-stats-projector`, sans reutiliser le compte compute/appspot.

Le plan cloud strictement read-only
`functions-gen2-g2a-stats.json` retrouve 126 commandes dont 26 legacy, zero
ledger existant et 26 a initialiser. Le recomptage correspond exactement au
dashboard (5 665 de revenu legacy, 24 commandes) et aux huit rollups journaliers:
zero drift. Verdict: `G2_A_STATS_BOOTSTRAP_REQUIRED`, `deploymentAllowed:
false`. Aucun ledger, IAM, rule ou Function n'est deploye. G2-B devra creer le
SA sans cle, seed les 26 ledgers avec preconditions source, rapprocher encore
les agregats, puis seulement deployer cette cible unique. Le rollback data
eventuel exige snapshot, updateTimes et approbation destructive; le rollback
code conserve trigger et IAM et redeploie l'ancienne source ciblee.

Le lot G2-A2 rend ensuite les options source completes pour trois cibles
catalogue qui disposent deja d'identites dediees:
`onCatalogSourceWrite`, `catalogReconciler` et
`catalogMediaGarbageCollector`. Toutes portent CPU 1, concurrence 1, min 0,
max 1, memoire et timeout explicites. Le trigger Firestore conserve retry
actif; les deux schedulers declarent `retryCount: 0`. Aucun deploy ni IAM n'a
ete modifie. Les suites catalogue core 14/14, resilience 18/18, G2-A 6/6 et le
lint Functions sont vertes. Leur configuration cloud actuelle reste celle du
manifeste G0 jusqu'a G2-B ciblee.

Le lot G2-A3 ferme localement le faux retry du worker image. Les erreurs de
traitement sont maintenant persistees dans la session puis relancees vers
Eventarc; une generation deja `ready` reste idempotente. Le worker porte CPU 1,
concurrence 4, min 0, max 4, 1 GiB, timeout 540 s et retry actif. Les schedulers
`cleanupProductPublicationSessions` et
`reconcileProductPublicationSessions` portent CPU/concurrence 1, min 0, max 1,
512 MiB, timeout 540 s et `retryCount: 0`. Les trois ciblent localement le futur
SA sans cle `product-publication-worker`; aucune creation IAM ni aucun deploy
n'a eu lieu. Tests G2-A 7/7, catalogue core 14/14 et lint Functions verts.

Le lot G2-A4 remplace l'envoi direct non reclame des deux triggers legacy
e-mail par un ledger backend-only deterministe, claim/lease transactionnel,
backoff, plafond huit tentatives et etats terminaux explicites. Gmail ambigu
devient `delivery_unknown` sans retry; Resend conserve son idempotency key. Les
deux cibles portent CPU/concurrence 1, min 0, max 1, 256 MiB, timeout 60 s,
retry actif et futur SA `legacy-order-email-worker`. La collection est refusee
aux clients et porte `purgeAt` 90 jours; IAM, secrets nommes et TTL restent des
preconditions G2-B. Aucun e-mail n'a ete emis.

Le lot G2-A5 s'appuie sur une mesure Logging read-only trente jours: build 22
latences HTTP, p99/max 16,181 s; revalidation 446 latences, p99 5,667 s et max
9,359 s. Runtime et toutes les dispatch deadlines sont alignes a 300 s, avec
concurrence/max 1, CPU/memoire explicites. Les deux queues observees restent
`RUNNING`, max concurrence/debit 1, dix tentatives et backoff 5-300 s. Aucun
parametre cloud n'a ete modifie.

Le lot G2-A6 rend les intents de quarantaine media idempotents par chemin et
generation. Les deux triggers artefacts portent CPU/concurrence 1, min 0, max
1, 256 MiB, timeout 300 s, retry actif et futur SA
`catalog-media-enqueuer`. Le trigger delete ne supprime plus `likes/comments`:
ces donnees restent en place jusqu'a une procedure destructive distincte et
approuvee. Tests G2-A 12/12, catalogue core 14/14, resilience 18/18,
compatibilite/Gate 7A 24/24 et lint Functions verts.

Le manifeste consolide `functions-gen2-g2a-plan.json` rapproche ces treize
decisions de leur baseline cloud G0 et fixe runtime, build/transport/runtime
SA, IAM, secrets nommes, acces donnees, idempotence, overlap et rollback. Son
verdict est `G2_A_LOCAL_COMPLETE_G2_B_BLOCKED_ON_DATA_IAM_TTL` et
`deploymentAllowed: false`. Les blocages sont le seed preconditionne des 26
ledgers stats, la creation/verification des identites sans cle, le TTL
`purgeAt` du ledger e-mail et une regeneration source/cloud juste avant chaque
deploiement cible. Aucun deploiement Gen2, rules, IAM ou TTL n'a ete applique
pendant G2-A.

#### Execution G2-B1 - stats cible unique

Le 2026-08-16, le seed fail-closed a revalide les 126 commandes et les 26
legacy par hash et `updateTime`, puis cree atomiquement exactement 26 documents
dans `order_stats_projections`. Il n'a ecrit aucune commande, aucun agregat,
stock ou fait financier. Le rapprochement suivant retrouve 26/26 ledgers,
zero drift dashboard et zero drift sur les huit rollups. Le backup eur3
`6c33ce73-dfe5-4081-8112-9369ae8b3af8` reste `READY`.

Trois identites sans cle ont ete creees et verifiees: runtime
`order-stats-projector`, build `functions-gen2-builder` et transport
`functions-eventarc-invoker`. Le runtime n'a que Datastore User, Log Writer et
Service Usage Consumer; le build a Log Writer au projet, Writer sur le seul
depot `gcf-artifacts` et Object Viewer sur les deux buckets source; Eventarc a
Receiver au projet et Run Invoker uniquement sur `onorderstatswrite`. Aucun
compte compute/appspot, invoker public, Editor, Owner ou cle utilisateur.

Le wrapper cible a deploye uniquement `onOrderStatsWrite` depuis le commit
`7045bd63a0f3f1e2ce367ba37daaf409d1fe6e44`. La revision
`onorderstatswrite-00026-cec` est `ACTIVE` et `Ready`, a 100 %, avec CPU 1,
256 MiB, timeout 60 s, concurrence 1, min 0, max 1 et retry actif. Le filtre
reste `orders/{orderId}` sur `(default)` eur3; le remplacement attendu du
trigger `930307` par `838473` conserve un seul proprietaire. La plateforme
reste a 152 Functions (139 Gen1, 13 Gen2), huit schedulers `ENABLED`, deux
queues `RUNNING` et sept triggers Eventarc. Le demarrage ne porte aucune erreur
et la sante commerce reste `healthy` sans incident. Deux premieres probes
directes de l'operateur ont volontairement evite toute commande mais encode un
CloudEvent Firestore invalide: elles ont produit deux HTTP 500 et trois entrees
`ERROR`, classes comme erreur de probe et non comme panne Eventarc/data. La
probe corrigee, authentifiee par le SA Eventarc et ciblee sur un identifiant
inexistant, a retourne 204 avec `outcome: no_change`, zero ecriture, puis le
rapprochement est reste strictement identique.

L'archive exacte de la revision precedente a ete copiee en prive dans
`g2b-rollback/onOrderStatsWrite/onorderstatswrite-00025-nac-function-source.zip`
(generation `1786883731057943`, SHA-256
`fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92`). Le
fichier porte un temporary hold Storage et le wrapper le verifie avant usage.
Le
transport fail-closed `gcloud-gen2-rollback` exige la revision courante, ce
digest et l'approbation `G2B_ROLLBACK_ON_ORDER_STATS_WRITE`; il restaure le
code/config precedent tout en conservant les IAM durcies, le endpoint, les
alertes et les ledgers. Aucune suppression de ledger n'appartient a ce
rollback. Le hash Firebase historique reste un label stale conserve par
gcloud; build, generation source et SHA-256 sont autoritaires et le wrapper
ajoute desormais un label de commit aux rollouts suivants.

Manifestes: `functions-gen2-g2b-stats-bootstrap.json`,
`functions-gen2-g2b-stats-iam.json`,
`functions-gen2-g2b-stats-reconciliation.json` et
`functions-gen2-g2b-stats-rollout.json`, scelles par
`functions-gen2-g2b-stats-digests.json`. Apres 970 secondes, la quiet-window
est fermee: aucun 5xx apres la probe valide, IAM et revision stables, 26/26
ledgers, zero drift et sante `healthy`. Verdict: `G2B1_COMPLETE`. La cible
suivante exige une regeneration target-specific; elle n'est pas autorisee par
ce seul verdict.

#### Execution G2-B2 - trigger catalogue cible unique

Le preflight a releve que le ledger historique de `onCatalogSourceWrite`
utilisait uniquement `sha256(event.id)`, en contradiction avec l'invariant qui
interdit `event.id` seul pendant un remplacement de trigger. Avant deploy, la
cle a ete remplacee par un hash stable de `appId`, `productId` et de
`updateTime` Firestore; l'ID evenement ne sert plus qu'a la correlation. Les
tests unitaires, catalogue core 14/14, resilience 18/18 et lint Functions sont
verts.

Le controle catalogue est `active`, non dirty, sans lease ni erreur, avec
desired/published/revalidated a 295. Les 26 ledgers historiques sont tous
`scheduled`; les 21 builds `failed` sont supersedes (maximum 284) et aucun
echec/prepared ne depasse la revision publiee. Le schema controle v1 est
classe legacy compatible avec le lecteur actuel, sans migration data
implicite.

L'IAM ajoute uniquement Service Usage Consumer et ActAs au runtime deja dedie,
puis Run Invoker au SA Eventarc sur le seul service. Le build commun reste
borne a Artifact Registry et aux deux buckets source, sans cle. Les anciens
droits Eventarc/Invoker de `catalog-enqueuer` restent conserves pour le
rollback; aucune liaison n'est retiree en G2-B.

Le commit `6d75cf3928374e597d09624f0350b0ebb8311c35` est deploye uniquement sur
`onCatalogSourceWrite`. La revision `oncatalogsourcewrite-00011-kaj` est
`ACTIVE`, CPU 1, 256 MiB, timeout 60 s, concurrence/max 1 et retry actif. Le
trigger eur3 conserve exactement son filtre et devient `130316`; les 7
triggers Eventarc restent presents. Le label `migration-source-commit` est
correct. Une probe authentifiee dans un namespace hors `secondevie` retourne
`ignored_app`/HTTP 200 sans ecriture; controle, ledgers et builds restent
identiques et les logs ne portent ni erreur ni 5xx.

L'archive precedente revision 10 est preservee avec temporary hold, generation
`1786885189999864`, SHA-256
`3c9a44606a3098c774be1d80be6f0af82e54c0bbe3b63534e4a28fb81e8674b4`.
Le rollback cible exige `G2B_ROLLBACK_ON_CATALOG_SOURCE_WRITE`, restaure
concurrence 80/max 20/retry actif et conserve IAM, trigger, endpoint et data.
Manifestes: `functions-gen2-g2b-catalog-iam.json`,
`functions-gen2-g2b-catalog-reconciliation.json` et
`functions-gen2-g2b-catalog-rollout.json`, scelles par
`functions-gen2-g2b-catalog-digests.json`. Apres 935 secondes, la revision ne
porte aucune erreur ni 5xx, IAM est encore exacte, la sante reste `healthy`,
le controle reste publie 295/295 et aucun ledger/build n'a derive. Verdict:
`G2B2_COMPLETE`.

#### Execution G2-B3 - scheduler catalogue cible unique

Le preflight de `catalogReconciler` a resolu un drift entre le code/cloud et le
manifeste G2-A. Le reconciler peut reparer le pointeur Storage `previous`
pendant une reprise rollback; le runtime `catalog-enqueuer`, limite a Object
Viewer, ne pouvait pas executer cette branche. La source cible desormais
`catalog-builder`, deja Object Admin sur le seul bucket catalogue, avec 512
MiB et 540 s comme le plan G2-A. Le job conserve son identite OIDC distincte
`catalog-enqueuer`, sa cadence cinq minutes UTC et zero retry; son deadline
a ete aligne a 540 s dans la meme operation ciblee.

Les conflits transactionnels historiques `RECONCILE_STATE_ADVANCED` ont
produit des 500 jusqu'au 8 aout, puis aucun sur la fenetre recente. Ils sont
maintenant repris en interne au plus trois fois, sans rendre Scheduler
retryable. Le controle catalogue est stable en revision 295, sans dirty,
lease ou erreur; `current`, `previous` et `last-known-good` sont verifies avec
leurs generations et digests. La revision 9 est archivee sous temporary hold
dans `g2b-rollback/catalogReconciler/`, sans suppression.

Le commit `66536d468e92c990387d079aeac8742e559bd389` a deploye uniquement
`catalogReconciler` en revision `catalogreconciler-00010-dob`, avec build
dedie reussi, CPU/concurrence/max 1, min 0, 512 MiB et timeout 540 s. Le job
existant est reste `ENABLED`, cinq minutes UTC, OIDC `catalog-enqueuer`, zero
retry et deadline 540 s. Deux executions naturelles ont retourne HTTP 200 en
2,618 s puis 1,169 s avec resultat `healthy`, sans 5xx, retry interne, lease,
ecriture ou drift: controle 295/295/295 et hash public inchanges. La
quiet-window couvre 584 secondes. Les inventaires restent 157/152, 139 Gen1,
13 Gen2, huit schedulers, deux queues et sept Eventarc. Manifestes:
`functions-gen2-g2b-catalog-reconciler-{reconciliation,iam,inventory,rollout}.json`,
scelles par leur manifeste de digests. Verdict: `G2B3_COMPLETE`.

**G2-B deploiement cible et observation, apres autorisation distincte:**

1. deployer une seule des treize cibles a la fois, depuis l'allowlist G0;
2. fermer d'abord ledger stats, claim/outbox e-mail, retry image et alignement
   Tasks, puis les options/overlap des schedulers;
3. verifier revision, trigger/queue/job, IAM, secrets, probes, doubles
   livraisons, alertes et donnees avant/apres;
4. observer au minimum une fenetre couvrant le trigger/schedule et les parcours
   rares convenus; redeployer le commit precedent au premier ecart;
5. rapprocher le manifeste cloud/source apres chaque cible.

Gate G2-B avant G4: les treize Gen2 live ont configuration source explicite,
idempotence/retry effectifs et observation stable. Aucun nouveau remplacement
Gen1 -> Gen2 ne commence tant que cette gate n'est pas fermee.

### G3 - Decisions de conservation, sans retrait premature

Classer avec preuves E2E, maintenance, publication historique, commerce legacy
et anciens webhooks. G3 peut neutraliser un appelant de facon reversible et
ouvrir une fenetre d'observation. Il ne supprime jamais encore Function cloud,
code de rollback, secret, alerte, dashboard ou script de diagnostic. Leur
retrait atomique et cible n'arrive qu'en G12.

### G4 - Analytics actives

Ordre: callables admin, `trackAdminIP`/`updateUserSessions`,
`initLiveSession`, `syncSession`, puis `syncSessionBeacon`.

Gates: Auth/App Check/origine, parite sessions/journey/UID-IP, concurrence des
caches, cout Firestore, rollback registre client, ancien onglet et 48 heures
d'observation. Les collections historiques P2 ne sont pas purgees ici.

### G5 - Auth callables, OTP et passkeys

Conserver les trois triggers Auth Gen1. Migrer les quatorze callables par
sous-lots: lecteurs, logs/registre, OTP, options passkey, verification passkey,
puis mutations admin.

Gates: `test:auth`, 401/403, Google/OTP/passkey sandbox, custom token,
ajout/retrait admin et revocation, compteur stable, aucun OTP dans les logs,
rollback client et quiet-window de l'ancien nom.

### G6 - Contenu, catalogue admin, devis, newsletter, e-mail et factures

Lecteurs avant writers. Le claim/outbox de `onQuoteRequestSubmitted` doit etre
actif dans la Gen1 avant double trigger.

Gates: suites de domaine, catalogue/queue/CAS, devis/newsletter/e-mail/PDF,
upload prive, aucune publication ou double envoi, rollback exact et
observation fournisseur.

### G7 - Meta et reconciliation Instagram

Migrer les neuf Functions Meta cloud uniquement apres leurs gates de domaine.
Pour les cinq Instagram locaux, appliquer la decision G0: conserver en local,
retirer avec preuve, ou convertir sous nouveau nom Gen2. Aucun deploiement tant
que `HOLD_META_RECONCILIATION` n'est pas formellement leve.

Gates: anti-rejeu OAuth, chiffrement, projection sans secret, URI callback,
secrets/IAM, rollback console et aucune publication distante non autorisee.

### G8 - Commerce non financier, lectures et hygiene P1

Ordre: lecteurs, livraison, produit, fulfillment, retours, documents,
promotions, puis decision legacy non Stripe. Apres le drill G1, executer si
approuve le backfill `inventoryVersion: 0` avec precondition `lastUpdateTime`,
et classifier les commandes sans inventer d'historique v2. Segmenter les KPI
`all/v2/legacy`; le classificateur exige un redesign read-only ou une fenetre
checkout-off explicite lorsque `v2_all` est actif.

Gates: unit/property/faults/UI/rules, stock/prix/mouvements/snapshot inchanges,
versions/command IDs, listes paginees, cohortes KPI, rollback et aucun incident.

### G9 - Checkout, Connect, refunds, schedulers et workers

Migrer une seule cible finance ou scheduler a la fois. L'ancien rail webhook
reste autoritaire jusqu'a G10. Avant coexistence, chaque scheduler obtient son
propre owner/kill-switch/lease/fence; `expireAdminPaymentLinks` n'en possede pas
encore. Tester double invocation, timeout, saturation et reprise.

`e2e:hosted-stripe` et `e2e:refund-stripe` restent `DO_NOT_RUN`. Utiliser
uniquement `commerce:e2e:gate7b` fail-closed ou un runner equivalemment borne,
apres approbation de la gate et avec `runId`/`orderId` explicites.

Gates: commerce local, probe hebergee sans paiement puis Stripe test borne,
acceptation/refus/3DS/reprise/annulation, refund sans restock, expiration,
inbox/outbox/faits/projections, alertes et sante coherente. Aucun Stripe live.

### G10 - Webhooks Stripe v2

1. deployer une seule cible Gen2 sans endpoint Stripe;
2. verifier requete non signee refusee et vrai `rawBody`;
3. creer endpoint et secret Stripe test distincts plateforme/Connect;
4. activer uniquement les evenements requis;
5. prouver la deduplication pendant double acheminement;
6. exercer paiement/refund test borne;
7. desactiver l'ancien endpoint, observer, puis conserver son secret pendant
   toute la fenetre de rollback;
8. repeter separement pour Connect.

Gate: aucun double fait/document/e-mail/mouvement/refund, zero inbox bloquee,
signatures invalides refusees, plateforme/Connect separes et aucune cle live.

### G11 - Maintenance destructrice

Chaque Function conservee exige admin fort/AAL2, App Check, confirmation,
dry-run, `concurrency: 1`, `maxInstances: 1`, batches bornes, audit, sauvegarde,
rollback et test negatif sandbox. Retirer plutot que migrer sans besoin prouve.

### G12 - Retrait Gen1 cible, reversible puis nettoye

Avant chaque suppression:

- Gen2 active, revision et rollback identifies;
- tests/probes verts et donnees reconciliees;
- consommateurs courants bascules;
- zero invocation de l'ancien nom pendant une quiet-window couvrant la duree
  maximale d'une session/ancien bundle supporte, ou facade compatible gardee;
- alertes/metriques stables, secret et ancien endpoint encore restaurables;
- nom unique et lot destructif approuves.

**G12-A:** apres bascule et quiet-window du trafic/provider, retirer uniquement
la cible cloud Gen1 approuvee. Conserver pendant une fenetre de rollback datee
le code redeployable, la configuration, les versions de secrets, IAM minimal,
dashboards, alertes et manifestes. Verifier l'absence de trafic ancien et la
stabilite Gen2; au premier ecart, redeployer le commit/config precedent et
reactiver l'ancien endpoint.

**G12-B:** seulement apres expiration formellement approuvee de cette fenetre et
decision qu'aucun rollback Gen1 n'est encore requis, supprimer dans un
changement distinct les appelants/code/scripts exclusivement anciens, puis IAM
et versions de secrets devenus inutiles avec destruction differee. Adapter ou
archiver les alertes sans perdre les preuves forensiques. Chaque cible conserve
son manifeste Git et son historique de logs/decisions.

Ne jamais supprimer les trois triggers Auth. L'ordre reste: lecture, analytics,
Auth callables, contenu/admin, commerce non financier, schedulers/workers,
webhooks/finance, maintenance.

### G13 - Durcissement post-cutover et horizon cinq ans

- regenerer le manifeste et confirmer trois Gen1 justifiees seulement;
- mesurer charge, cold starts, p95/p99, 429/OOM, Firestore contention et cout;
- optimiser ensuite CPU/concurrence/min/max sans perdre la parite;
- creer les comptes runtime par domaine au moindre privilege;
- decider par ADR si le codebase `main` doit etre scinde par domaine ou
  dependance lourde; ne pas cumuler ce chantier avec le cutover;
- paginer/reprendre le reconciler au-dela de 5 000 faits et 500 commandes,
  refuser toute publication partielle et separer heartbeat du rebuild lourd;
- planifier le runtime successeur avant depreciation Node 22 le 30 avril 2027
  et retrait le 31 octobre 2027;
- verifier Artifact Registry, budgets/quota, SLO, App Hosting et la strategie
  de production separee;
- avant tout futur Stripe live, rendre l'attente `livemode` dependante de
  l'environnement: le controle sandbox considere correctement `livemode=true`
  comme une derive, mais ce hardcode bloquerait une vraie production;
- fusionner les decisions dans `_DOCS`/`map.md`, puis retirer ce plan temporaire
  selon la gouvernance.

Gate finale sandbox: statut `SANDBOX_GEN2_MIGRATED_AND_HARDENED`. Ce statut
n'autorise ni rail production, ni Stripe live, ni domaine/DNS, Resend, App Check
enforcement ou publication juridique.

## 12. Matrice de gates et rollback

| Type | Tests/preuves minimum | Observation de bascule | Rollback |
| --- | --- | --- | --- |
| callable lecture | parite resultat/erreurs, Auth/App Check, ancien onglet | comptes autorise/interdit, zero trafic ancien sur quiet-window | registre client Gen1 + rollout precedent; un JS deja charge ne revient pas seul |
| callable mutation | unit/property/faults, command ID/claim | mutation sandbox bornee, audit et zero double effet | registre Gen1; Gen2 presente mais sans trafic |
| HTTP brute | methodes, taille, origine/signature, `rawBody` | probe negative puis positive | URL client/provider precedente |
| Firestore/Eventarc | filtre exact, age, non-ordre, retry, cle metier/ledger | create/update/replay et preuve deterministe | ancien trigger seul proprietaire |
| scheduler | fuseau/job, retry/backoff, deadline, owner/lease/fence | double run, saturation, heartbeat downstream | desactiver nouveau proprietaire puis reactiver l'ancien |
| Cloud Tasks | queue IAM, rate/concurrence, timeout/deadline, retries | backlog, age, epuisement et idempotence | producteur/worker precedent, taches reconciliees |
| webhook | vrai raw body, signature, inbox dedup | Stripe test double endpoint | ancien endpoint/secret conserves |
| Auth | claims, revocation, OTP/passkey | Google/OTP/passkey sandbox | callable Gen1; trois triggers restent Gen1 |
| catalogue | CAS, queue, HMAC, version et media | API/routes/version exactes | pointeur/Function selon runbook |
| restauration | counts/hashes + invariants cross-service | base nommee sans trafic App Hosting/Gen1 | aucune bascule; `(default)` intacte |

Commandes locales a selectionner selon la vague, jamais comme liste aveugle:

```bash
npm run lint:functions
npm run infra:env
npm run appcheck:audit
npm run test:deployment-cache
npm run test:auth
npm run test:analytics
npm run test:quotes
npm run test:newsletter
npm run test:invoices
npm run test:billing-onboarding
npm run test:commerce:unit
npm run test:commerce:property
npm run test:commerce:faults
npm run test:commerce:rules
npm run test:catalog:core
npm run test:catalog:resilience
npm run test:catalog:security
npm run test:meta
npm run test:retention
```

`e2e:hosted-stripe` et `e2e:refund-stripe` ne doivent pas etre lances. E2E,
paiements, emulateurs complets, builds, charge et deploiements attendent la
phase, l'environnement et l'autorisation explicites.

## 13. Observabilite, SLO, charge et cout

Baseline du 2026-08-15: zero policy Monitoring, zero metrique logs
personnalisee et zero dashboard personnalise; canaux non verifies; budget Billing
`NON_VERIFIE`; aucune alerte quota confirmee. App Hosting est deja borne a
`minInstances: 0`, `maxInstances: 10`, `concurrency: 80`, CPU 1/512 MiB. Les
Functions, surtout Gen1, exigent des plafonds mesures par tier.

Cette baseline de debut d'audit est historique. Apres l'execution partielle G1
du meme jour, l'etat courant est cinq metriques logs, huit policies, un
dashboard et un canal primaire teste; la redondance, le budget Billing et les
alertes quota restent non verifies/non fermes.

| Signal | Seuil initial/gate | Correlation requise |
| --- | --- | --- |
| incident financier primaire, health `stop`, dead-letter, `deliveryUnknown`, `expiredHolds` | alerte des que > 0 | code/severite, revision, identifiant metier hashe |
| dispatcher reservations | heartbeat/completion absent > 6 min ou incomplete > 0 | run ID, failures, exhausted, backlog age |
| health commerce | stale/unknown jamais vert | `computedAt`, couverture, truncated, primary count |
| inbox/outbox/webhook | age, backlog, 4xx/5xx, signature anormale | event/inbox/outbox ID sans payload sensible |
| Tasks/Scheduler/Eventarc | age, retries, overlap, epuisement, 429 | queue/job/trigger, attempt et owner |
| App Hosting/Functions | 5xx, 429, p95/p99, CPU, memoire, instances | backend/service, revision, route/famille |
| quotas/cout | erreurs quota immediates; 70/85/95% si metrique; budget 50/80/100% et forecast 100% apres acces | projet, service, quota/budget; jamais PII |

Pour latence et taux d'erreur, collecter sept jours de baseline et ajouter un
minimum d'echantillons avant de figer les seuils. Les metriques logs
personnalisees sont payantes: preferer une alerte log-match pour les evenements
rares et n'utiliser que des labels de faible cardinalite.

Chaque vague suit invocations, erreurs/retries, p50/p95/p99, instances,
concurrence, CPU/memoire/cold starts, Firestore et contention, fournisseurs,
incidents, cout/jour, revision, bascule et rollback. Les logs portent nom
logique/deploye, generation, revision, request/event/run ID et identifiant
metier hashe. Jamais token, OTP, secret, carte, adresse complete ou facture.

Avant G8/G9 et en G13, exercer une charge sandbox sans Stripe live: scale to
zero, burst representatif puis marge approuvee, latence, 429/OOM, concurrence
Firestore, backlog et cout. Le catalogue public Storage protege Firestore du
trafic de lecture, mais ne prouve pas la capacite du checkout ou des workers.

## 14. Definition de succes

La migration est terminee uniquement si:

- les 157 exports sont classes, les 152 cloud rapproches et le deploy global
  impossible par defaut;
- les treize Gen2 initiales sont stabilisees avec options source explicites et
  revisions G2-B effectivement deployees/observees; une dette G2 non fermee
  bloque les vagues dependantes sauf acceptation de risque datee, attribuee et
  approuvee; aucune derogation pour double effet, finance, stock, Auth, secret
  ou perte d'e-mail;
- toutes les cibles conservees et supportees sont Gen2, sauf les trois Auth;
- `HOLD_META_RECONCILIATION` est resolu sans publication accidentelle;
- aucune legacy, donnee, secret ou alerte n'est retire sans preuve/rollback;
- Auth, App Check, IAM, secrets, regions, retries, timeouts, instances,
  concurrence et proprietaires sont verifies;
- événements, e-mails, schedulers, queues et webhooks restent idempotents sous
  double livraison, non-ordre, overlap et reprise;
- DR Firestore/Auth/Storage/secrets/config est exerce et la reconciliation
  Stripe/stock/inbox/outbox/Auth/RGPD documentee;
- alertes, runbooks, charge, cout et rollback sont testes;
- l'incident financier ne peut plus etre masque et sa resolution est auditee;
- les 10 meubles, 26 commandes et KPI suivent leur plan P1 valide;
- analytics historiques restent classifiees/exportables avant toute purge P2;
- aucun script Stripe `DO_NOT_RUN`, rail production ou secret live n'a ete
  utilise;
- Node/runtime, docs canoniques et manifeste final ont un proprietaire/date.

## 15. Prompt final pour lancer l'execution

Copier ce prompt dans une nouvelle tache Codex. Il autorise exclusivement G0;
les ecritures cloud des phases suivantes demanderont leur autorisation propre.

```text
Tu travailles dans le depot Seconde Vie Next.

Objectif: executer progressivement le plan sandbox Firebase Functions Gen1 ->
Gen2 de `apphostingaudit/AUDIT_MIGRATION_FUNCTIONS_GEN2.md`, sans confondre
migration technique, fiabilite pre-live et creation d'une production.

Commence uniquement par G0, en lecture seule cote cloud.

Avant toute action:
1. lis completement `AGENTS.md`, `map.md`, le README et les deux audits du
   dossier `apphostingaudit`, puis les chapitres canoniques cites;
2. inspecte le code executable et regenere les inventaires local/cloud;
3. preserve tous les changements utilisateur; identifie branche, commit,
   Node, pnpm, Firebase CLI, operateur et cible; isole le chantier sur
   `codex/functions-gen2-migration` sans ecraser le worktree existant;
4. passe `--project secondevienextjsssr` aux controles cloud et echoue si le
   projet effectif differe; la configuration gcloud globale peut viser
   `vibefx-v2`;
5. ne lance aucun deploiement, paiement, suppression, build ou ecriture pendant
   G0.

Livrables G0 obligatoires:
- manifeste machine des 157 exports, rapproche aux 152 Functions cloud, avec
  trigger/filtre, region, generation, runtime/build/invoker SA, IAM, secrets
  noms/versions, CPU/memoire/timeout/concurrence/min-max/retry, appelants,
  lectures/ecritures, idempotence, owner/overlap, cible, vague et rollback;
- reconciliation source/cloud des 13 Gen2, queues, schedulers et Eventarc;
- classification de chaque nom et resolution documentee des drifts;
- decision `HOLD_META_RECONCILIATION` pour les cinq Instagram locaux;
- remplacement du script global Functions par un wrapper fail-closed exigeant
  projet, codebase, commit, manifeste et allowlist non vide de 10 noms maximum;
  finance, webhook et scheduler restent a une cible;
- tests du wrapper, de l'inventaire et de l'interdiction de nouveau Gen1 Auth
  ou `functions.config()`;
- proposition du premier lot local G2, sans le deployer.

Interdictions permanentes:
- jamais `firebase deploy --only functions` sans allowlist;
- aucune production Firebase/App Hosting, aucun Stripe live, aucun secret live;
- ne jamais supprimer/migrer `grantAdminOnAuth`,
  `onRegisteredUserCreated`, `onRegisteredUserDeleted`;
- ne jamais deployer les cinq Instagram tant que le hold n'est pas leve;
- ne jamais lancer `e2e:hosted-stripe` ni `e2e:refund-stripe`;
- aucune suppression de donnee sans backup READY, restore drill, dry-run,
  manifeste, preconditions, rollback et approbation destructive;
- ne jamais ouvrir les rules, reutiliser Editor/global appspot par defaut,
  exposer un secret ou laisser CPU/concurrence/retry implicites;
- ne jamais utiliser un `firebase deploy --dry-run` comme preuve read-only.

Ordre ulterieur obligatoire apres autorisation: G1, G2, G3, puis G4 a G13, une
vague a la fois. Toute nouvelle cible remplaçant Gen1 commence en parite
`cpu: gcf_gen1`, `concurrency: 1`, `minInstances: 0`; creer un nouveau nom
suffixe Gen2, deployer au plus 10 cibles et une seule cible finance/webhook/
scheduler, tester, basculer reversiblement, observer un ancien onglet et une
quiet-window, puis retirer la cible cloud Gen1 seulement en G12-A. Conserve
code, secrets, IAM, endpoint et alertes pendant la fenetre de rollback; leur
nettoyage distinct n'arrive qu'en G12-B apres approbation.

Arrete-toi au premier ecart de projet, inventaire, finance, stock, Auth,
App Check, IAM, signature, donnees, sante, idempotence ou rollback.

A la fin de G0, rends exactement: verdict de reconciliation, manifestes crees,
decisions par Function, drifts documentaires, fichiers modifies, tests lances
et non lances, deploiement oui/non, risques bloquants et premier lot propose
avec rollback exact. Ne passe pas automatiquement a G1.
```
