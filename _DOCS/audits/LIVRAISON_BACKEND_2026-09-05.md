# Livraison backend après I0–I6 et Stats/Data

2026-09-05. Autorisation utilisateur de livrer l'ensemble du backend sandbox,
puis accord explicite pour la migration bornée des compteurs. Aucune ancienne
autorisation Q1 réutilisée. Production, paiements, remboursements et e-mails de
recette non sollicités. Aucun push.

## Livré et vérifié

23 Functions Gen2 actives sur `secondevienextjsssr`, `europe-west1` : neuf lecteurs
admin ; init/sync/beacon ; agrégation et maintenance analytics ; deux projecteurs
de compteurs ; trois traitements outbox ; quatre writers de création/archive.
Les révisions avant/après sont dans la [preuve expurgée](preuves/backend-livraison-2026-09-05.json).

La mise à jour a porté uniquement sur `buildConfig.source`. Le contrôle après
livraison confirme la conservation de tous les paramètres de service, hors
révision, et des déclencheurs (ordre des filtres normalisé). CPU, mémoire,
concurrence, min/max, comptes de service, secrets et politique de retry conservés.
Les sources/configurations de rollback sont sauvegardées dans le dossier local
privé ignoré `logs/recette/backend_delivery_20260905/`.

Le préflight a révélé plusieurs Functions sans `FUNCTION_TARGET` explicite.
La sélection des huit lecteurs légers reconnaît aussi leur `K_SERVICE` exact ;
une cible inconnue conserve la découverte globale. Test ajouté, metadata
recomparées. Cette adaptation est déployée, pas seulement simulée localement.

Neuf POST sans authentification sur les lecteurs renvoient 401 : disponibilité
et maintien du refus d'accès, pas une recette AAL2 ni une mesure de vitesse.
Le hosting reste `build-2026-09-05-001`, déjà livré dans
le [suivi Stats/Data](SUIVI_STATS_DATA_2026-09-05.md).

## Migrations

Compteurs : test de la procédure sur Firestore demo, sauvegarde des résumés,
fermeture des gates, remplacement des projecteurs, attente des anciennes
requêtes puis transaction atomique de six documents. Trois ledgers Retours et
un ledger Newsletter initialisés ; deux résumés réactivés. Readback :
`pendingReturns=0`, `activeCount=1`, `ledgerBaselineReady=true` pour les deux.
Les sources et les documents financiers ne sont pas modifiés.

Trois indexes ajoutés, opérations terminées sans erreur : archive/date des
commandes, jour/shard des faits, référence des liens de paiement. Aucun index
supprimé. Leur usage archive/shard reste en mode compatible tant que le
complément de champs n'a pas été autorisé puis appliqué.

Dry-run complémentaire préparé : 142 commandes et 181 faits nécessitent un
champ technique. Applicateur borné avec versions, sauvegarde et updateMask,
vérifié sur demo pour conserver statut, montant et durée. Accord utilisateur
encore attendu ; aucun de ces 323 documents n'a été modifié par ce complément.

## Validation et limites

Node 22.23.2. Huit tests de régression ciblés, cinq tests demo incluant les
migrations, comparaison des huit metadata d'endpoints. Les validations I0–I6
et Stats/Data restent conservées. `git diff --check` propre.

Les gains backend peuvent maintenant être qualifiés sur les lecteurs livrés.
Aucun p95, gain Billing ou convergence multi-admin n'est déduit des refus 401.
QBO-06 et la qualification comparative I7 restent ouverts.

Rollback : lecteurs vers leur source précédente si nécessaire. Pour les
projecteurs, ne pas réinstaller l'ancien calcul delta/événement sur les ledgers
initialisés : fermer la gate, conserver les événements et corriger avec un code
qui respecte la nouvelle baseline. Même prudence pour les writers séquencés.
Une entrée outbox incertaine ne doit jamais être rejouée automatiquement.
