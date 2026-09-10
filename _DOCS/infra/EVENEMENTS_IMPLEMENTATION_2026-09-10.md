# Événements — implémentation et qualification du 10 septembre

Contrat : [fiabilité des événements](FIABILITE_EVENEMENTS.md).
Tests : [qualification empirique](../quality/QUALIFICATION_EVENEMENTS.md).
Candidat : [manifeste ciblé](../../deploy/activity-maintenance-candidate.json).

**État actualisé :** les nouveaux services et les producteurs sont désormais
déployés dans le sandbox. Lire le [rapport cloud du même jour](EVENEMENTS_CLOUD_2026-09-10.md)
pour les révisions, recettes, bascules et gates restantes. Les sections suivantes
conservent la photographie locale **antérieure à cette livraison** : leurs
mentions « non déployé » ou « à qualifier » ne décrivent pas l'état cloud actuel.

## Résultat local

Le moteur `functions/src/maintenance/durableWork.cjs` conserve l'intention,
la génération de livraison, l'échéance, le lease, les tentatives et le résultat
dans les documents du domaine. Il distingue l'identité de l'effet de celle de
sa livraison. Un crash après enqueue se rejoue avec le même nom de tâche ;
une reprise opérateur explicite change la génération et est auditée. Un lease
expiré ne peut pas confirmer un succès. L'idempotence financière reste dans
la saga métier existante, pas dans le transport.

| Domaine | Câblage local | Limite concrète |
| --- | --- | --- |
| Liens | Intention dans la transaction de création et de prolongation ; expiration relisant l'état payé/fermé/échéance | Provider réel et déploiement à qualifier |
| Checkout | Intention au checkout réel ; pour un lien admin, seulement à l'utilisation du paiement ; contrôle initial à 5 min puis échéance checkout + 1 min si attente normale | Observe et ouvre un incident ; ne rejoue pas un paiement et ne conclut pas qu'un webhook absent signifie paiement échoué |
| Inbox webhook | Intention à réception, renouvelée lors du claim/échec ; état terminal conservé ; incident ciblé ouvert/fermé | Ne répare pas une opération financière ; livraison et alerte externes à exercer |
| Sessions | Intention créée/réactivée dans l'écriture source ; clôture après 35 min d'inactivité ; heartbeat sans nouvelle tâche | Les anciennes sessions nécessitent l'amorçage borné avant bascule |
| Agrégats | Intention de consolidation écrite atomiquement avec la modification du shard ; regroupement par 5 min | L'agrégateur existant reste en place ; ses écritures de suivi ne relancent pas les projections analytics |
| Archivage | Un travail par jour ayant produit des faits ; après fin du jour + 75 jours ; relais de 28 jours attachés à ce jour | Outil d'amorçage historique disponible ; exécution à qualifier avant retrait de la maintenance globale |
| Incidents | Compteurs de fenêtre séparés du total historique ; HTTP 5xx et stderr sans severity couverts ; suivi commande enrichi | Flux borné à 50 groupes, 512 timestamps/groupe ; historique absent ou tronqué explicitement signalé |
| Coûts | Adaptateur Pub/Sub pour les signatures native et gcloud ; testé avec le SDK réel | Corrige localement le format rejeté ; aucune preuve de livraison Budget cloud nouvelle |

Les délais 5 min/1 min sont des seuils initiaux de qualification, pas des SLA
mesurés. Le contrôle de création distingue un PaymentIntent attaché, encore en
attente du client, d'une création bloquée/inconnue. Les tentatives métier sont
limitées à 5 ; Cloud Tasks dispose de 10 livraisons pour inclure les conflits de
lease. Chaque tâche privée a minInstances=0 et une concurrence bornée.

## Données, visibilité et coût

`maintenanceWork` est un objet borné dans orders, analytics_sessions et inbox.
Le suivi checkout indépendant utilise `paymentWatchWork` dans orders. Aucun
payload fournisseur ni secret n'est copié dans les tâches ou leurs logs.
Les documents quotidiens réutilisent `sys_analytics_maintenance` avec `expireAt`
à 400 jours et déclaration TTL dans `firestore.indexes.json` ; les rules
existantes y interdisent déjà les accès client. Le TTL doit être déployé.

Les reprises et échéances sont visibles dans la timeline de diagnostic de la
commande pour liens, checkout et inbox. Les logs structurés portent le domaine,
l'état et une corrélation opaque. La page Performance conserve les métriques
Google par fonction : une ventilation graphique du coût par opération n'est
pas livrée par ces logs seuls. Comparaison des coûts réels encore ouverte.

Le suivi ajoute des écritures et donc des invocations de triggers. Le filtre
de maintenance évite les recalculs analytics sur ces écritures, mais n'annule
pas leur coût d'invocation. Les tâches devenues obsolètes restent mesurables.
Aucune économie monétaire ou baisse globale des appels n'est annoncée sans
mesure du coût total à charge identique.

Le compteur Incidents utilise [début, fin[. La déduplication du transport reste
dans le ledger existant ; deux logs distincts d'un même échec peuvent compter
deux occurrences. `≥` indique une couverture partielle, `—` un historique
ancien indisponible. Les nouveaux compteurs ne reconstruisent pas rétroactivement
les sept jours précédents. Le sink modifié doit être appliqué dans le cloud.

## Vérifications locales et lectures sandbox

Runtime Node **22.23.2**. Résultats finaux du lot :

- **292 tests sans réseau réussis** : moteur durable, wiring SDK/CLI, fenêtres
  Incidents, Pub/Sub, coûts, domaines/résilience commerce et publication.
- **30 contrats UI/analytics réussis**, incluant les modifications préexistantes
  du realtime conservées dans le workspace.
- **3 tests Firestore Emulator réussis** : commit avorté, concurrence réelle de
  workers et intention de consolidation/archivage atomique avec réarmement.
- ESLint ciblé : **0 erreur**, un avertissement `name` préexistant dans le script
  de déploiement ; build Next avec `CATALOG_BUILD_FIXTURE=true` validé.
- `git diff --check` et liens des documents du chantier vérifiés.

Commande principale reproductible :

```sh
node --require ./tests/commerce/helpers/no-network.cjs --test tests/event-maintenance-operations.test.mjs tests/pubsub-event-wiring.test.cjs tests/project-costs.test.cjs tests/durable-maintenance.test.cjs tests/activity-maintenance.test.cjs tests/system-incidents.test.cjs tests/incident-windows.test.cjs tests/analytics-rollups-contract.test.cjs tests/commerce/domain/*.test.cjs tests/commerce/resilience/*.test.cjs tests/catalog/product-publication.test.cjs tests/catalog/publication-concurrency-audit.test.cjs
node scripts/test-event-maintenance-emulator.mjs
node --test tests/analytics-realtime.test.mjs tests/analytics-live-sessions.test.mjs tests/admin-analytics-performance.test.mjs
```

Les tests Emulator exigent Java 21 et leur runner dédié (projet `demo-*`,
loopback) ; les lancer directement sous la garde sans réseau ne les qualifie
pas. Une première invocation incorrecte a échoué, puis le runner dédié a été
utilisé. Le test d'environnement du projecteur a également révélé qu'un
déploiement ne devait pas remettre implicitement le flag maintenance à false :
il est maintenant conservé sauf choix explicite.

Le dry-run sandbox paginé a inspecté **145 commandes**, **199 inbox webhook** et
**413 sessions analytics**, sans écriture : **0 candidate active** à cet instant
pour les amorçages liens/checkout/inbox/sessions. Cela ne dispense pas d'une
nouvelle passe après livraison des producteurs. Le dry-run historique du
9 septembre a trouvé **1 jour candidat**, sans écriture.

Les tests de transport cloud, de notification reçue, de panne fournisseur et la
mesure de coût réel ne sont pas exécutés par ces suites. Aucun E2E Stripe
interdit, aucun paiement/remboursement, aucun nouveau test navigateur hébergé.

## Preuve du retrait des anciennes publications

À **2026-09-10T01:01:15.999Z**, le script
[retire-publication-scans.mjs](../../scripts/retire-publication-scans.mjs)
a confirmé l'absence des producteurs `startProductPublicationAdmin` et
`startProductPublicationAdminGen2`, ainsi que **0 document** dans
`product_publication_sessions`, puis vérifié ces états :

| Job Cloud Scheduler, europe-west1 | Avant | Après |
| --- | --- | --- |
| `firebase-schedule-reconcileProductPublicationSessions-europe-west1` | ENABLED, every 15 minutes | PAUSED |
| `firebase-schedule-cleanupProductPublicationSessions-europe-west1` | ENABLED, every 24 hours | PAUSED |

Cela retire **97 lancements programmés/jour** de ce circuit obsolète. Aucun
document ou média supprimé, aucune Function supprimée ou redéployée. Les
producteurs métier actuels et le catalogue CAS existant sont conservés. Les
deux tâches de publication du prototype sont exclues du nouveau manifeste.
Ne pas réintroduire ces jobs lors d'un futur déploiement des anciens exports.

Retour arrière ciblé, uniquement si ce circuit est réactivé avec son producteur :

```sh
gcloud scheduler jobs resume firebase-schedule-reconcileProductPublicationSessions-europe-west1 --location=europe-west1 --project=secondevienextjsssr
gcloud scheduler jobs resume firebase-schedule-cleanupProductPublicationSessions-europe-west1 --location=europe-west1 --project=secondevienextjsssr
```

## Outils de reprise et conditions encore ouvertes

- [bootstrap-event-maintenance.mjs](../../scripts/bootstrap-event-maintenance.mjs) :
  dry-run par défaut, pages de 100 avec curseur, champs manquants ou intentions
  `pending` à réarmer après rollout ; sauvegarde du champ et vérification de
  version avant mutation. Aucun état terminé n'est relancé.
- [repair-event-maintenance.mjs](../../scripts/repair-event-maintenance.mjs) :
  lecture d'une cible explicite, puis réparation avec version/génération exactes,
  motif et audit transactionnel ; pas de scan de rattrapage permanent.
- [bootstrap-analytics-maintenance.mjs](../../scripts/bootstrap-analytics-maintenance.mjs) :
  jours historiques avec données, fenêtre explicite de 31 jours maximum,
  dry-run/sauvegarde/préconditions ; évite de recréer les archives déjà terminées.
- [event-maintenance-monitoring.mjs](../../scripts/event-maintenance-monitoring.mjs) :
  configurations d'alerte pour erreurs d'enqueue/livraison, retard, événement
  Pub/Sub non acquitté et queue interrompue. Exige les vraies subscriptions et
  destinations ; **générer une configuration ne prouve pas la réception**.

La profondeur d'une queue ne suffit pas : elle inclut les tâches futures.
Les métriques d'échec ne suffisent pas non plus pour un worker jamais invoqué.
Il faut exercer la panne, la notification et la réparation, y compris le cas
où la dernière tentative ne peut pas écrire son état. Sources :
[Cloud Tasks](https://docs.cloud.google.com/tasks/docs/monitor) et
[diagnostic Eventarc](https://docs.cloud.google.com/eventarc/standard/docs/run/troubleshoot).

Les nouveaux services ne sont **pas déployés**. Les schedulers liens, watchdog
commerce et maintenance analytics restent actifs jusqu'à qualification. Les
autres schedulers commerce/catalogue ne sont pas retirés par ce lot. La
proposition de secours simplement moins fréquents est désormais refusée par
le code (`ACTIVITY_MAINTENANCE_SLOW_RESCUE=true` échoue explicitement).

Avant bascule : source committée/digestée, IAM précis (Firestore, enqueue et
invocation des seules queues), TTL, livraison des producteurs dans les runtimes
effectifs, amorçage complet incluant archives historiques, tests fournisseur,
réception d'alerte, coût et rollback. Le script ciblé exige les inputs committés
(`assertCleanDeploymentInputs`). Le commit local de ce chantier a été autorisé
le 10 septembre ; les modifications préexistantes du graphique analytics en
sont exclues. Aucun push ni déploiement des nouveaux services n'est effectué.
Le fichier `activity-maintenance-candidate.json` est un inventaire candidat,
pas encore le manifeste exécutable attendu par le script : métadonnées de
baseline, entrées par Function et digest restent à préparer pour la recette.
