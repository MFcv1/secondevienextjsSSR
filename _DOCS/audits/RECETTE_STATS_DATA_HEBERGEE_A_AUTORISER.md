# Recette hébergée après correctifs locaux — non exécutée

Mise à jour : accord utilisateur reçu le 5 septembre ; hosting et scénario Data
avec nettoyage exécutés. [Résultat et limites](SUIVI_STATS_DATA_2026-09-05.md).
La procédure ci-dessous conserve la séparation des périmètres ; le commit local
requis par la gate Functions reste en attente d'accord, les deux lecteurs non livrés.

Cette préparation ne vaut pas autorisation. Aucune autorisation Q1 réutilisée.

## Livraison distincte

Autoriser explicitement un rollout App Hosting du code frontend validé vers
`secondevie-next-sandbox`, projet `secondevienextjsssr`, région `europe-west4`,
et une livraison ciblée de `listOrdersAdminV2` et
`listCustomerReturnRequestsAdminV2` en `europe-west1`. Avant action : relire les
révisions actives, le contrôle commerce, les configurations/capacités et les
droits ; enregistrer la source de rollback et refaire les gates nécessaires.
Ne modifier aucune capacité ni autre Function. Commit/push restent distincts.

## Lecture et mesure

Avec l'admin de recette autorisé, mesurer séparément restauration Auth forte,
contrôle d'accès backend, téléchargement/évaluation du code lazy, POST lecteurs,
callback serveur et affichage utile. Même navigateur, viewport, cache, visibilité
et réseau avant/après ; conserver chaque observation, sans p95 sur petit lot.
Exécuter 30 retours avec Stats « 3 mois » et Data « 7j », absence >30 s,
onglet masqué et réseau coupé, puis confirmation serveur. Contrôler les détails,
recherches et pages suivantes des Commandes/Retours. Ne pas confondre appels RPC,
documents lus, transports longue durée et coût Billing.

## Mutation Data et nettoyage à autoriser séparément

Le scénario borné existant est conservé :
[source synthétique, préconditions et nettoyage](../../logs/recette/qualification_post_livraison_20260905_1354/SCENARIO_CONVERGENCE_A_AUTORISER.md).
Il propose une source analytics unique, au plus cinq écritures opérateur,
120 s par phase et dix minutes hors nettoyage. Vérifier son absence avant
création ; attendre les changements métier à l'écran et dans les projections,
pas seulement un HTTP 200. Comparer la contribution propre à cette source,
sans restaurer un total global susceptible d'avoir changé entre-temps.

Nettoyage : exclure cette source par son type admin, attendre le retrait de sa
contribution et de ses projections de session, puis supprimer uniquement la
source créée. Inventorier les tombstones/ledgers d'idempotence conservés. Si le
retrait ne converge pas ou si la version diverge, arrêter et conserver la preuve
expurgée ; aucune correction globale improvisée. Les données Stats financières
ne sont pas modifiées par ce scénario. Pour leur convergence hébergée, observer
un événement métier réel autorisé, ou demander un scénario distinct.

Les 142 commandes/181 faits et l'activation des drapeaux d'usage des index
restent un chantier soumis à son propre accord. Aucune migration, facture,
commande, paiement, remboursement ou notification n'est autorisé ici.
