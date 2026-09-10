# Audit de stabilité et consommation des fonctions — 10 septembre 2026

Suite demandée après cet audit : [plan des cinq optimisations restantes](../../infra/PLAN_FIN_MAINTENANCE_PERIODIQUE.md).
**Suite livrée : [bascule et preuves du 10 septembre](../../infra/MAINTENANCE_GROUPES_LIVRAISON_2026-09-10.md).**
Les cinq horaires décrits dans la photographie ci-dessous ont depuis été suspendus.
La décision utilisateur est de terminer ces optimisations avant le gel proposé
ci-dessous. Ce rapport conserve les constats de l'audit, pas une instruction
d'interrompre le chantier suivant.

Verdict : **base exploitable pour une semaine de recette sandbox, avec cinq
traitements périodiques encore actifs et des limites de mesure explicites**.
Aucun changement de runtime, scheduler, queue ou donnée métier pendant cet audit.
Ne pas présenter ce verdict comme « zéro scan » ou comme une validation complète
des parcours commerciaux, de sécurité ou de capacité.

## Périmètre et preuves

Code HEAD `211ff63`, source du regroupement `e9be585`. Trois modifications
préexistantes du lecteur Data, de son test et de BACKOFFICE.md conservées.
Inventaire des **172 fonctions déployées**, leurs déclencheurs et ressources ;
lecture ciblée des chemins périodiques, reprises commerce, maintenance analytics
et calculs de coûts. Pas de relecture intégrale des 172 handlers.

[Inventaire expurgé](inventaire.json) : 172 ACTIVE, 170 en europe-west1 et deux en
us-central1. Aucun minInstances positif déclaré sur les Functions inventoriées ;
cela ne décrit pas les instances Hosting ni la facture du projet.
Onze queues Cloud Tasks, toutes RUNNING. Scheduler lu dans europe-west1,
us-central1 et europe-west4 : cinq jobs actifs, neuf PAUSED, aucun job en west4.
Les quatre jobs legacy us-central1 sont PAUSED, y compris deux anciens rythmes
de deux minutes. Aucune recherche globale de jobs dans toutes les régions Google.

Les logs des contrôles ont été lus sur les dernières 24 heures. La requête
Cloud Run severity ERROR à partir de 14:30 UTC n'a retourné aucune ligne lors
de l'audit ; fenêtre courte et logs disponibles, pas garantie permanente.
Les preuves de bascule sont dans le [rapport cloud analytics](../../data/INACTIVITE_GROUPES_CLOUD_2026-09-10.md).

## SF-01 — contrôles périodiques restants

| Fonction | Rythme actif | Travail et constat | Décision conseillée pendant la recette |
| --- | --- | --- | --- |
| commerceOutboxDispatcherGen2 | Chaque heure, 24/j | Recherche actions dues et traitements interrompus ; 24 résumés, zéro action traitée | Conserver provisoirement, remplacer la reprise avant suppression |
| commerceReservationExpiryDispatcherGen2 | Chaque heure, 24/j | Recherche réservations expirées ; 24 résumés, zéro réservation traitée | Candidat au retrait après qualification complète du chemin événementiel |
| catalogReconciler | Chaque heure, 24/j | Vérifie pointeurs Storage, publication et revalidation ; 22 healthy, un backoff et une relance | Conserver : reprise utile effectivement observée |
| commerceOperationsReconcilerGen2 | Tous les jours à 03:17 selon le job | Compare compteurs commandes/finance, écrit état de contrôle et incidents | Faible fréquence ; possible contrôle à la clôture d'une journée ayant des changements après qualification |
| catalogMediaGarbageCollector | Quotidien, 1/j | Candidats médias et anciennes releases, aujourd'hui dry-run, zéro candidat inspecté/supprimé | Pas bloquant pour la semaine ; conserver garde-fous avant toute modification |

Total théorique : **74 lancements/jour, 518/semaine**, indépendants du nombre
de visiteurs. Ce n'est ni un décompte de lectures ni une estimation en euros.
Les cinq scans du chantier précédent restent PAUSED : liens, watchdog,
maintenance analytics et deux anciens traitements de publication.

## SF-02 — pourquoi ne pas arrêter immédiatement les deux scans commerce

Faits de code/configuration : `commerceEventDispatch.js` programme déjà les
actions outbox et réservations via deux événements Firestore avec retry.
`eventDispatch.js` n'inscrit l'outbox que pour pending/failed ; processing ne
programme aucun contrôle de fin de lease. La queue `dispatchCommerceOutboxTaskGen2`
a **maxAttempts=1** dans le code et dans le cloud.

Risque déduit : un arrêt brutal après prise en charge peut laisser une entrée
processing que son seul message ne reprend plus. Le scan horaire recherche
explicitement les leases expirés. Son absence de travail sur 24 h ne prouve donc
pas qu'il est supprimable. Ce scénario cloud de crash n'a pas été injecté ici.

Correction future minimale : rattacher une reprise durable à la prise en charge
et à son échéance, vérifier panne avant/après l'effet fournisseur, transport perdu,
réparation opérateur et doublons. Ne pas rejouer aveuglément une livraison ambiguë.
Pour les réservations : prouver stock/commande/paiement et reprise quand les
tentatives sont épuisées avant de retirer la recherche horaire.

Une tâche par action commerciale est cohérente avec le faible volume attendu.
Le regroupement par créneau convient au trafic analytics ; ne pas le transposer
aux paiements si cela retarde leur finalisation ou mélange leurs responsabilités.

## SF-03 — le secours catalogue a réellement réparé une revalidation

Le worker `dispatchCatalogRevalidation` a échoué le 10 septembre à 12:53 UTC avec
`CATALOG_SERVED_VERSION_STALE`. Le reconciler a enregistré `revalidation_enqueued`
à **13:53:09 UTC**, révision cible 344 ; le worker a reçu une livraison à
13:53:10 UTC et répondu 204. La queue de revalidation a maxAttempts=1.
La correspondance temporelle et le log de relance confirment une utilité du
reconciler ; ils ne prouvent pas tous les scénarios de reprise de publication.

Retirer ce job exige de rendre autonomes les reprises de build, revalidation,
lease et rollback. Conserver le contrôle durant la recette est préférable à
remplacer précipitamment ce mécanisme. Source : `catalogReconciler.js`.

## SF-04 — la page Performance est une mesure d'appels, pas de lectures

Relevé de la capture utilisateur : 9 septembre 14:37 → 10 septembre 14:37 UTC,
collecté à 14:42:44 UTC. 3 191 appels, 1 546 erreurs serveur, 28 refus.
339 séries brutes Cloud Monitoring relues indépendamment : **zéro écart** avec
le cache pour appels/erreurs/refus de chaque fonction Gen2. Cette comparaison
ne requalifie pas les percentiles ni les métriques Gen1.

`captureProjectCostsGen2` : 1 545 réponses 500 de l'ancienne révision, dues au
format Pub/Sub ; 26 réponses 204 de la nouvelle révision dans ce relevé. Correctif
déjà livré à 11:47:58 UTC. Un total sur 24 h conserve les échecs d'avant correction.
Les 306 notifications `scheduleAnalyticsCompactionGen2` ne sont pas 306 consolidations :
54 dispatchs réussis et un refus dans ce relevé ; le rattrapage de 51 jours et les
transitions des travaux ont produit une activité ponctuelle importante.

Un appel peut consommer calcul/mémoire, opérations Firestore, Storage, transport
et logs selon son code. Certains ne font aucune lecture Firestore. Les quotas
gratuits peuvent absorber une consommation sans montant supplémentaire visible.
Nombre d'appels, nombre de lectures et montant facturé sont trois mesures distinctes.
[Tarification Cloud Run](https://cloud.google.com/run/pricing).

## SF-05 — une semaine ne suffit pas à la corrélation de Coûts du projet

`projectCostsCore.cjs` conserve des agrégats **mensuels**, alimentés par les
notifications budgétaires Google. Le nouveau relevé remplace le précédent du
même mois ; la page n'offre pas d'historique quotidien. La corrélation automatique
requiert six mois complets avec trafic comparable. Une semaine permet de suivre
l'évolution du mois et les appels, pas d'obtenir cette corrélation.
Le total inclut aussi Hosting, builds, stockage et autres services du projet ;
une hausse n'est pas automatiquement imputable aux visites.

## Base de recette recommandée

Geler cette révision pendant sept jours, sauf panne fonctionnelle ou sécurité
constatée. Garder les 74 lancements/jour connus dans la référence ; ne pas les
confondre avec une régression. Laisser passer 24 h après la dernière bascule pour
une première fenêtre entièrement postérieure aux migrations.

Pour chaque journée : noter période exacte, sessions et durée active, parcours,
checkout/paiements Stripe test, appels principaux, erreurs nouvelles et total
mensuel de coût avec heure du relevé. Séparer activité normale et essais provoquant
volontairement erreurs/reprises. Plusieurs heures sur le même navigateur ne
représentent pas automatiquement plusieurs visiteurs uniques ni une charge concurrente.
Un ratio appels/session doit être rapproché de la durée : un visiteur présent
plusieurs heures envoie légitimement davantage de signaux.

Ces recommandations ne créent aucun monitor automatique. Aucun achat, e-mail,
suppression de média ou test de charge cloud lancé par cet audit.

## Validation

**82 tests locaux réussis** : grouped-inactivity, durable-maintenance,
activity-maintenance, event-maintenance-operations, maintenance-alert,
commerce/domain/event-dispatch, commerce/resilience/worker-outbox et
commerce/faults/gate3-workers. Pas de build ni nouveau test navigateur nécessaires
à cet audit en lecture seule. Inventaire/configuration cloud observés ; égalité
de toutes les sources cloud avec HEAD non démontrée. Aucun défaut nouveau
reproduit justifiant une modification urgente sur les scénarios examinés.

Document et inventaire créés, liens et `git diff --check` vérifiés. Aucun commit,
push ou déploiement effectué pendant cet audit.
