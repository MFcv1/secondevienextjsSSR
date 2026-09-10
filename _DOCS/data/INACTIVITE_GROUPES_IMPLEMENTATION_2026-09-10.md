# Inactivité analytics par groupes — implémentation et preuves locales

10 septembre 2026. Ce rapport décrit la qualification locale avant livraison.
**Depuis : activé en sandbox**, voir le [rapport cloud](INACTIVITE_GROUPES_CLOUD_2026-09-10.md).
[Plan relu](PLAN_INACTIVITE_ANALYTICS_GROUPES.md),
[contrat données](DONNEES_ANALYTICS.md),
[état cloud antérieur](../infra/EVENEMENTS_CLOUD_2026-09-10.md).

## Résultat en mots simples

Les visites peuvent partager le même rendez-vous de contrôle. Le système ne crée
ce rendez-vous que lorsqu'une visite existe. Il traite au maximum 100 visites par
passage, puis reprend le reste si nécessaire. Les visites déjà terminées sortent
automatiquement de la liste à vérifier. Un rendez-vous déjà programmé peut donc
se terminer vide une fois ; il ne se relance pas à intervalles réguliers.

Le voyant vert garde ses messages de présence et de départ. Le regroupement ne
modifie ni le délai de présence, ni la durée de visite enregistrée. Il concerne
uniquement la clôture durable après 35 minutes sans signal, avec moins de cinq
minutes d'attente supplémentaire liée au créneau, hors retard de livraison.

## Architecture réellement écrite

- `functions/src/maintenance/groupedInactivity.cjs` : créneaux UTC de cinq minutes,
  partitions 1/4/16, inscription atomique, contrôle du propriétaire et du lease,
  pagination 100, déplacement ou clôture atomique, migration dans les deux sens.
- `functions/src/analytics/sessions.js` : création et réactivation inscrivent le
  suivi dans la transaction autoritaire. Les heartbeats ne créent pas de nouveau
  groupe. Les refus de token, génération ou séquence gardent leur traitement.
- `analytics_inactivity_groups` contient les intentions durables. L'appartenance
  est un pointeur `inactivityGroup` sur la session existante : aucune liste copiée,
  aucun compteur global. Requête composite `sessionActive` + `inactivityGroup.groupId`.
- `durableWork.cjs` transporte le lease jusqu'au worker et donne un TTL de 14 jours
  aux seuls groupes réussis. Une panne laisse les sessions restantes sélectionnables.
  Les travaux en attention restent disponibles pour une réparation ciblée.
- `rollups.js` ignore les changements du seul pointeur de suivi. Le worker individuel
  et l'ancien outil d'amorçage ignorent les sessions appartenant à un groupe.
- `firestore.rules` interdit l'accès navigateur aux groupes ; indexes et TTL sont
  déclarés dans `firestore.indexes.json`.
- `scripts/migrate-analytics-inactivity.mjs` : une page de 100 documents, dry-run
  par défaut, sauvegarde exclusive mode 0600 avant écriture, précondition de version,
  raison et audit à rétention 90 jours. Aucun champ métier changé. Un conflit arrête
  la page ; les migrations déjà appliquées restent identifiables et idempotentes.
- `scripts/repair-event-maintenance.mjs` accepte `sessionGroup`, avec l'identité
  analytics existante et les mêmes préconditions de reprise.

La relecture a aussi corrigé l'arrondi des timestamps Firestore contenant une
fraction de milliseconde : arrondir vers le haut avant de construire une échéance
entière évite de perdre un report et empêche une clôture anticipée.

## Configuration et inventaire de livraison

`ANALYTICS_INACTIVITY_MODE` vaut `individual` par défaut, ou `grouped` après
qualification. `ANALYTICS_INACTIVITY_PARTITIONS` vaut 4 par défaut ; 1 et 16 sont
également acceptés. Ce choix reste un candidat de qualification, pas un réglage
de capacité cloud validé.

Le mode est attaché à la session : changer le flag concerne les nouvelles sessions,
sans voler la responsabilité des sessions existantes. Le retour arrière des sessions
groupées actives exige la migration explicite. Ne pas désactiver le flag global
maintenance ni suspendre la queue individuelle tant que des sessions en dépendent.

Inventaire ciblé préparé dans ce lot local, livré ensuite selon le rapport cloud :

| Cible | Modification |
| --- | --- |
| `scheduleAnalyticsInactivityGroupGen2` | Nouveau déclencheur Firestore privé, retry, compte analytics |
| `dispatchAnalyticsInactivityGroupGen2` | Nouveau worker Cloud Tasks privé, 100 sessions/page |
| `initLiveSessionGen2` | Création et reprise avec inscription transactionnelle |
| `syncSessionGen2`, `syncSessionBeaconGen2` | Réactivation compatible avec les deux propriétaires |
| `aggregateAnalyticsSessionGen2` | Pas de tâche individuelle pour les sessions groupées ; pointeur technique filtré |
| `dispatchAnalyticsInactivityGen2` | Compatibilité avec la migration et échéances entières |

Le catalogue de `scripts/deploy-functions-targeted.mjs` inclut les deux nouvelles
cibles. Le générateur Monitoring inclut leur queue via `taskNames` ; les politiques
déjà installées ne sont pas mises à jour automatiquement. Il faudra aussi ajouter
l'abonnement Eventarc réellement créé et exercer notification/reprise.

## Vérifications effectuées

- **94 tests locaux réussis** : groupes, moteur durable, opérations, câblage Functions,
  présence, sessions, buffer d'événements, agrégats et lecteurs admin.
- **5 tests Firestore Emulator réussis** : 12 inscriptions simultanées sur une racine,
  transaction avortée, plusieurs pages et doublon, migration retour, heartbeat tardif,
  refus de lecture/écriture navigateur y compris avec claim admin.
- Tests supplémentaires du noyau : sept jours vides sans tâche, lease invalide,
  panne après une clôture déjà commise suivie d'une reprise sans double effet,
  exclusion/suppression/admin, réactivation, rollback et timestamps submilliseconde.
- Contributions historiques identiques avant/après changement du pointeur ou
  clôture différée, y compris frontières du mois, de l'année et changement d'heure.
- ESLint sans erreur ni warning sur les modules et tests du lot. Le script de
  déploiement contient un warning préexistant `g10Webhook`/`name`, sans nouvelle erreur.
- `git diff --check` et liens relatifs des documents modifiés vérifiés.

Commandes reproductibles, sous Node 22 :

```sh
node --require ./tests/commerce/helpers/no-network.cjs --test tests/grouped-inactivity.test.cjs tests/durable-maintenance.test.cjs tests/activity-maintenance.test.cjs tests/event-maintenance-operations.test.mjs tests/analytics-rollups-contract.test.cjs tests/analytics-realtime.test.mjs tests/analytics-live-sessions.test.mjs tests/analytics-events-buffer.test.mjs tests/admin-analytics-performance.test.mjs
node scripts/test-event-maintenance-emulator.mjs --grouped
node scripts/measure-grouped-inactivity.mjs /tmp/inactivity-groups-new-report.json
```

Emulator : Java 21, projet exclusivement `demo-secondevie-events`, sans credentials
cloud et accès loopback. Le fichier du rapport de mesure doit ne pas encore exister.
Pas de build Next, navigateur, test Stripe ou mutation cloud dans ce lot.

## Mesures comparatives

48 simulations : 1, 100, 1 000 et 10 000 visites, trois comportements, suivi individuel
et groupes à 1/4/16 partitions. Le vrai moteur exécute ses transactions dans un
stockage mémoire instrumenté. Les états finaux, durées et derniers signaux sont
identiques entre variantes. Ces cohortes sont simultanées ; elles ne représentent
pas 10 000 visites réparties sur une journée.

Exemple à **10 000 visites simultanées, quatre partitions** :

| Scénario | Contrôles individuel → groupé | Lectures modélisées | Écritures modélisées |
| --- | ---: | ---: | ---: |
| Départ perdu | 10 000 → 102 | 50 000 → 50 714 | 50 000 → 20 314 |
| Départ reçu à cinq minutes | 10 000 → 4 | 40 000 → 20 032 | 30 000 → 20 020 |
| Visite longue, départ reçu à 90 minutes | 30 000 → 208 | 160 000 → 141 460 | 110 000 → 60 648 |

À 100 visites simultanées, le départ perdu passe de 100 à 4 contrôles, 500 à 528
lectures, 500 à 220 écritures. À **une seule visite**, ce même scénario garde un
contrôle mais passe de 5 à 12 lectures et de 5 à 7 écritures : le regroupement a
un coût fixe et ne garantit pas une économie à toute fréquentation.

Limites : heartbeats intermédiaires communs omis ; le scénario long contient des
signaux à 34 et 68 minutes, puis un départ à 90 minutes. Les opérations réelles des
projections aval, retries réseau, TTL, latences et temps CPU cloud ne sont pas
mesurés. Les événements documentaires comptés ne sont pas une facture Functions.
Les chiffres démontrent une réduction des contrôles dans ces scénarios, pas un
prix en euros ni une capacité de production.

## Gates ouvertes avant activation

1. Mesurer trafic étalé, retours fréquents et contention soutenue ; choisir le
   partitionnement selon la charge cible et le coût complet, y compris faible trafic.
2. Qualifier index READY, IAM, queue privée, Eventarc, alertes et reprise sur le
   sandbox avec volume, durée et budget bornés. Les tests Emulator ne prouvent pas
   l'installation de l'index ni le transport cloud.
3. Vérifier Data de bout en bout et présence réelle sur la révision déployée.
   La comparaison des contributions locales ne remplace pas cette preuve.
4. Après acceptation du coût et de la capacité, activer progressivement les producteurs,
   inventorier/migrer si nécessaire et prouver la couverture de chaque session active.

Les anciens scans restent dans l'état décrit par le rapport cloud antérieur.
Aucun scheduler n'a été ajouté, relancé, supprimé ou modifié ici. Aucun commit,
push, déplacement ou suppression de fichier dans ce lot.
