# Maintenance liée à l'activité — plan et qualification

> **Prototype antérieur, remplacé le 10 septembre 2026.** La cible actuelle est
> le [plan de fiabilité des événements](FIABILITE_EVENEMENTS.md), avec son
> [protocole de tests](../quality/QUALIFICATION_EVENEMENTS.md). Les secours
> quotidiens/horaires décrits ci-dessous ne sont plus une décision validée.
> Le code et les résultats locaux sont conservés comme étape de travail ;
> ne pas activer ce manifeste ni `ACTIVITY_MAINTENANCE_SLOW_RESCUE` sur la base
> de ce document. Les sections suivantes décrivent uniquement ce prototype.

10 septembre 2026. Demande : plan relu puis implémentation locale des liens,
publications et maintenance analytique. Aucun déploiement autorisé implicitement.

## Décisions après relecture

- Réutiliser Cloud Tasks et les événements Firestore, déjà présents pour les
  réservations/outbox. Aucun timer navigateur ni nouvelle collection.
- Le document métier et ses échéances sont l'intention durable. Un événement
  Firestore rejouable programme la tâche ; une erreur d'enqueue doit être levée.
  Les contrôles globaux existants récupèrent un événement manqué.
- Les tâches relisent le document courant. Doublons, prolongations, paiements,
  suppressions et événements désordonnés ne doivent jamais agir sur un état ancien.
- Les échéances métier actuelles sont bornées à 24 h (liens), 35 min (session)
  et 15 min (upload). Une échéance inattendue au-delà de 29 jours échoue
  explicitement ; aucun abandon silencieux ni relais infini.
- Migration en deux temps : nouveaux endpoints et qualification d'abord ;
  cadence de secours ensuite, avec flag explicite. Le défaut conserve le legacy.
- Pas de changement aux droits client, au prix/stock, au remboursement, à la
  publication CAS ou à l'exclusion des sessions admin.

## Lots

1. Liens : événement orders actif → tâche d'expiration ; handler métier existant
   conservé, validant aussi l'échéance à l'intérieur de l'opération. Secours quotidien
   candidat, sans ralentir la cadence avant recette et reprise des liens existants.
2. Publications : événement de session → contrôle ciblé de blocage/finalisation ;
   réutiliser les transactions et le verrou de finalisation. Reprises bornées,
   puis attention opérateur ; secours horaire candidat.
3. Analytics : création/réactivation → clôture différée après 35 min d'inactivité,
   sans tâche par heartbeat ; activité persistante → report par la tâche.
   Écriture de shard → consolidation des seules périodes touchées, regroupée
   par tranche temporelle ; clôture quotidienne/archivage séparés des tâches.
   Le secours quotidien conserve le rattrapage borné des sessions oubliées.

Le watchdog commerce est un chantier distinct : il ouvre/ferme des alertes et ne
répare pas un paiement. Sa cadence reste inchangée dans ces trois lots ; le déplacer
nécessite une qualification spécifique des délais webhook et de leurs alertes.

## Relecture obligatoire avant bascule

Tests sans réseau : enqueue en échec/rejeu, suppression, ancien événement, tâche
précoce, activité concurrente, expiration prolongée/payée, publication terminée,
limite des reprises, tâches lointaines, consolidation après changement de jour.
Contrôles des exports et lint ciblé. Relire le diff après tests.

Cloud : vérifier identités dédiées, enqueuer + invocation des seules tâches,
format CloudEvent, queues/retry, secrets de l'expiration ; recette sandbox bornée,
réception effective, exécution, progression et absence de doublon. Amorcer les
documents actifs préexistants avant réduction des schedulers. Deux phases de
livraison ciblées, rollback des flags/cadences sans annuler les états métier.

## Statut

Plan relu contre les handlers et les mécanismes de reprise existants.
Implémentation locale effectuée, puis relue. Trois nouveaux déclencheurs
(liens, publications, shards) et quatre tâches privées. La programmation de
l'inactivité utilise l'agrégateur existant : aucun déclencheur supplémentaire
à chaque heartbeat. Les imports lourds restent différés au traitement.

Deux flags distincts : `ACTIVITY_MAINTENANCE_ENABLED` active les tâches et leur
programmation ; `ACTIVITY_MAINTENANCE_SLOW_RESCUE` autorise les cadences candidates.
Le second sans le premier échoue à la découverte/configuration. Ils ne sont
pas activés dans les configurations cloud du projet par cette intervention.
Le script ciblé reprend les mêmes cadences que les exports SDK et conserve
le format CloudEvent explicite pour les nouveaux événements.

Les traitements quotidiens existants restent réunis dans `maintainAnalyticsGen2`
(rattrapage borné, changement de jour, archivage), mais les sessions et les
périodes modifiées ont désormais leurs propres tâches. Aucun archivage n'est
déclenché par un heartbeat. La consolidation d'un jour reprend aussi son mois,
son année et les insights ; un rejeu après échec partiel ne saute pas ces étapes.

Relecture : doublon d'export retiré ; alignement des limites SDK/CLI ; contrôle
upload concurrent par updateTime ; pas de nouvelle chaîne à chaque écriture
interne de finalisation ; pas de tâche par heartbeat ; enqueue en échec propagé.
Les cinq tentatives sont une limite par tâche, pas une suppression des secours.

Validation Node **22.23.2**, garde réseau : **230 tests réussis**, incluant
18 tests nouveaux (moteur, endpoints et configuration ciblée), les domaines
commerce, publication/concurrence, contrats rollups et correctifs d'audit.
Commande : `node --require ./tests/commerce/helpers/no-network.cjs --test
tests/activity-maintenance.test.cjs tests/commerce/domain/*.test.cjs
tests/catalog/product-publication.test.cjs
tests/catalog/publication-concurrency-audit.test.cjs
tests/analytics-rollups-contract.test.cjs tests/manual-audit-completion.test.cjs`.
ESLint ciblé avec `--no-ignore` : zéro erreur, avertissement préexistant `name`
dans le script de déploiement. Pas de build Next ni navigateur pour ce lot
Functions. Aucun émulateur ou fournisseur réel testé ; les doubles locaux ne
prouvent pas le transport cloud ni les conflits Firestore réellement exécutés.

[Manifeste candidat](../../deploy/activity-maintenance-candidate.json).
Le déploiement ciblé reste soumis aux gates ci-dessus. Les limites de secours
actuelles sont conservées (25 liens, 100 sessions par passage, archivage borné) :
**ne pas ralentir avant d'avoir amorcé les anciens documents et vérifié que le
rattrapage résiduel reste admissible**. Un backlog dépassant ces limites exige
une reprise bornée supplémentaire avant bascule, pas une déclaration de succès.
Pour revenir en arrière : rétablir les cadences legacy avant de désactiver les
tâches ; conserver les états métier et vérifier le rattrapage des jours analytics.

Les journaux structurés distinguent programmation, doublon, report, état dépassé,
travail terminé et échec ; ils ne journalisent ni identifiant de session ni payload.
Ils ne sont pas encore une nouvelle ventilation dans la page Performance.
Aucune économie, capacité cloud ou réduction effective des appels n'est acquise.
Aucun commit, push, déploiement, changement IAM ni suppression/déplacement.

Références fournisseur relues : [tâches Firebase](https://firebase.google.com/docs/functions/task-functions),
[limites Cloud Tasks](https://docs.cloud.google.com/tasks/docs/quotas).
