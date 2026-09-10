# Fiabilité des événements — décision et plan d'implémentation

Relecture technique du 10 septembre 2026. **Direction validée pour
implémentation ; qualification et retrait décidés par domaine.** Ce contrat remplace les
choix de secours périodiques du [prototype](MAINTENANCE_EVENEMENTIELLE.md).
Suivi : [état du projet](../ETAT_PROJET.md). Preuves attendues :
[protocole de qualification](../quality/QUALIFICATION_EVENEMENTS.md).

Implémentation, preuves locales et changements cloud :
[rapport local du 10 septembre](EVENEMENTS_IMPLEMENTATION_2026-09-10.md), puis
[livraison et qualification cloud](EVENEMENTS_CLOUD_2026-09-10.md).
Le second rapport porte l'état actuel des scans et les limites restantes.

## Objectif et limite de la garantie

Aucune invocation de maintenance métier sans opération réelle à suivre.
Chaque travail doit découler d'une création, d'une transition, d'une échéance
attachée à un objet existant ou d'un incident identifié. Pas de scan quotidien
ou horaire global comme solution cible. Une tâche devenue inutile après un
paiement peut encore arriver : son résultat explicite est « devenue obsolète ».
Cela reste une conséquence d'une opération réelle, à mesurer et à réduire.

La surveillance de l'infrastructure reste nécessaire : files, transport,
échecs de livraison et disponibilité. Elle n'est pas un scan périodique des
commandes et son coût doit apparaître dans le bilan. On ne promet ni livraison
exactement une fois, ni absence de panne illimitée. On démontre des effets
métier idempotents et une détection/reprise dans un périmètre de pannes testé.

## Relecture du code et corrections du raisonnement

| Élément relu | Constat | Décision |
| --- | --- | --- |
| `functions/src/commerce/domain/adminPaymentLinkCoordinator.js` et `checkoutRepository.js` | La création passe par `prepareCheckout`, transactionnelle ; l'expiration utilise la saga fournisseur et revérifie l'échéance | Porter l'intention d'expiration dans l'écriture autoritaire ; préserver la saga, les contrôles paid/closed et les prolongations |
| `functions/src/maintenance/` | Prototype avec tâches ciblées mais secours globaux, sans suivi durable complet de livraison/épuisement | Réutilisation partielle seulement ; ne pas activer son manifeste comme solution finale |
| `functions/src/catalog/catalogMutationRecorder.js` | Ledger et contrôle de publication écrits atomiquement, puis enqueue ; ledger repris au rejeu | Bon mécanisme à réutiliser ; le ledger est créé par un trigger après la mutation source : il ne prouve pas l'intention atomique à la création originale |
| `functions/src/commerce/domain/webhookInbox.js` et `outboxRepository.js` | États durables, tentatives, leases et protections de livraison déjà présents | Étendre les mécanismes du domaine ; éviter un orchestrateur général et un deuxième journal concurrent |
| `functions/src/commerce/v2Operations.js`, `runWebhookCoverageWatchdog` | Deux requêtes limit(1) détectent inbox due ou lease expiré ; ouvrent/ferment deux incidents globaux | Ce watchdog ne répare pas un paiement et ne détecte pas un webhook jamais reçu. Remplacer par suivi des inbox connues ; traiter séparément l'attente du fournisseur |

Une intention persistée ne se réveille pas seule. Firestore et Cloud Tasks ne
participent pas à la même transaction. Le trou entre commit et enqueue doit
être traité par reprise du dispatch, puis alerte si cette reprise échoue.
La simple présence d'un log ou d'une clé de tâche ne ferme pas ce risque.

## Contrat minimal à implémenter

1. **Accepter l'action.** Identifier l'opération et sa version côté serveur.
   Écrire état métier et intention du travail obligatoire dans la même
   transaction Firestore. Inventorier tous les producteurs, y compris admin,
   imports et mutations indirectes. Aucun appel externe dans le callback de
   transaction, qui peut être réexécuté.
2. **Distribuer.** Un événement portant cette intention programme une tâche
   privée avec identifiant déterministe par opération/version/type/échéance.
   Persister `pending`, puis `scheduled` après confirmation. Échec d'enqueue
   propagé ; rejeu avec la même identité. Une nouvelle livraison de réparation
   a une génération explicite, sans changer l'identité de l'effet métier.
3. **Exécuter.** Relire état et version, obtenir un lease avec fencing si
   concurrence, appliquer l'effet idempotent puis confirmer durablement.
   Ne pas faire confiance au payload ancien. Une tâche trop tôt est reportée,
   une version dépassée est ignorée explicitement, un succès n'est pas rejoué.
4. **Conclure.** Suivre séparément `succeeded`, `cancelled`, `superseded`,
   `retry_wait`, `needs_attention` ; tentative, prochaine échéance et motif
   expurgé. L'opération « lien créé » réussit immédiatement après commit ;
   son travail « expiration » reste planifié. Expiration normale ≠ incident.
5. **Rendre visible.** Projection admin asynchrone et bornée : action initiale,
   état, délai, tentatives, dernier résultat, intervention possible. Une panne
   d'analytics ne doit pas annuler un succès métier déjà commité.

Champs sémantiques attendus : `operationId`, `schemaVersion`, version métier,
type d'effet, corrélation/causalité, timestamps serveur, état de dispatch,
échéance, génération de livraison, tentative, lease, résultat et rétention.
Leur schéma exact sera fixé pour le pilote. Réutiliser documents/collections
existants ; toute nouvelle collection nécessite justification, rules, indexes,
rétention et budget de volume avant code. Pas de tableaux d'historique illimités.
Les mises à jour de suivi ne doivent pas produire leur propre boucle de triggers.

Une opération Stripe peut réussir avant un crash local. Conserver la référence
fournisseur et la clé d'idempotence, interroger l'état autoritaire avant reprise
ambiguë ; `needs_attention` si impossible de trancher. Une clé Stripe n'est pas
une garantie éternelle. Aucun rejeu aveugle d'un paiement/remboursement.

## Détection sans scan métier permanent

Le pilote doit fournir une preuve bout en bout des cas suivants :

- Commit réussi, enqueue indisponible : intention durable, reprise du trigger,
  puis alerte transport avant expiration de sa fenêtre de retry.
- Tâche créée mais endpoint inaccessible, queue suspendue ou worker qui ne
  démarre jamais : signal d'infrastructure utilisable sans exécution du worker.
- Reprises épuisées : incident durable corrélé, sans supposer que le dernier
  handler pourra lui-même écrire l'incident.
- Après rétablissement : réparation déclenchée par l'incident ou un opérateur,
  requête bornée sur les intentions concernées, cursor/checkpoint, même protection
  contre les doubles effets. Pas de scan récurrent en l'absence d'incident.

**Gate ouverte :** sélectionner et tester les métriques, règles d'alerte,
destination et mécanisme de réparation réels. Ne pas supposer une dead-letter
queue Cloud Tasks automatique. Une panne commune au transport et à l'alerte
doit être explicitée avec sa procédure de reprise après rétablissement.
Tant que ce chemin n'est pas démontré, ne pas retirer la protection existante
ni présenter le prototype comme conforme. Les scans existants restent un état
transitoire non migré, pas une exception acceptée à l'objectif.

## Lots et critères de sortie

| Lot | Travail | Condition de sortie |
| --- | --- | --- |
| 0 — Mesure | Cartographier producteurs, effets, transport, coûts et trous d'observation ; fixer délais admissibles par effet | Inventaire complet du pilote, budgets et scénarios définis avant mesures |
| 1 — Pilote liens | Intention atomique création/prolongation ; dispatch durable ; expiration ciblée ; incident et réparation | Qualification locale puis cloud, aucun scan à vide dans le périmètre migré |
| 2 — Publications | Enregistrer session et attentes d'upload/finalisation ; réveils à échéance, lease, échec terminal lisible | Crash/concurrence/CAS/revalidation exercés ; aucune reprise d'une session terminée |
| 3 — Commerce | Contrôles ciblés à réception inbox et prise de lease ; attente fournisseur attachée à une tentative checkout réelle | Distinguer webhook absent, reçu, en traitement, terminé ; incident et résolution traçables sans modifier les faits financiers |
| 4 — Analytics | Séparer clôture d'inactivité, consolidation des périodes modifiées et rétention ; regrouper l'activité | Pas de tâche par heartbeat, rejouabilité des agrégats, coûts mesurés ; pas de maintenance globale à vide |
| 5 — Admin | Relier cycle métier, tâches et incidents ; corriger fenêtres et couverture Performance/Incidents | Comptages comparés à la source sur fenêtres identiques et données absentes explicites |

Le journal des mouvements de stock conserve ses déclenchements métier et son
idempotence : beaucoup d'appels ne prouvent pas du gaspillage. Chaque fonction
sera classée en travail utile, doublon, refus, reprise ou contrôle obsolète.
Ne pas transposer automatiquement l'expiration des liens à tous les services.
Une rétention liée au temps doit viser des données existantes avec un mécanisme
borné ; ce lot n'autorise pas une nouvelle boucle globale de nettoyage.

## Migration et revue avant activation

Livrer par domaine : lecteurs compatibles puis producteurs d'intentions, tâches
et observabilité ; inventorier les opérations anciennes et les amorcer une fois
avec dry-run/comptage/checkpoint. Protéger la coexistence temporaire avec les
anciens handlers par les mêmes versions et invariants métier. Désactiver les
schedulers du domaine uniquement après les preuves de couverture et de reprise.

Relire le diff, les producteurs oubliés, les droits IAM, rules/indexes/rétention,
la configuration effective des retries et la matrice de tests. Rollback ciblé
documenté avant bascule : restaurer le traitement précédent si nécessaire,
conserver intentions et résultats, éviter deux acteurs non coordonnés. Aucun
déploiement global, production ou mutation financière réelle implicite.

## Références techniques vérifiées

- [Transactions Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions) : atomicité interne et callback rejouable.
- [Événements Firestore](https://firebase.google.com/docs/functions/firestore-events) : doublons possibles et ordre non garanti.
- [Retries Firebase](https://firebase.google.com/docs/functions/retries) : retries à activer et fenêtre finie ; la documentation décrit 24 h en Gen2, configuration déployée à vérifier.
- [Configuration Cloud Tasks](https://docs.cloud.google.com/tasks/docs/configuring-queues) et [quotas](https://docs.cloud.google.com/tasks/docs/quotas) : limites de reprises, de programmation et de rétention à intégrer aux gates.
- [Idempotence Stripe](https://docs.stripe.com/api/idempotent_requests) : réponse mémorisée, même en erreur ; clé susceptible d'être supprimée après au moins 24 h.
