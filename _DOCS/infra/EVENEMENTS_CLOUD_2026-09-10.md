# Événements — livraison et qualification sandbox du 10 septembre 2026

Ce rapport complète les [preuves locales](EVENEMENTS_IMPLEMENTATION_2026-09-10.md)
et le [contrat durable](FIABILITE_EVENEMENTS.md). Projet `secondevienextjsssr`,
Functions `europe-west1`, App Hosting `secondevie-next-sandbox` en `europe-west4`.
La qualification est limitée aux scénarios ci-dessous ; aucune garantie de
perfection permanente ni économie monétaire mesurée n'est annoncée.

## Livraison effective

- Les **10 nouvelles Functions** sont ACTIVE : quatre événements Firestore et
  six workers Cloud Tasks. Producteurs Firestore avec retry activé ; six queues
  RUNNING, 10 tentatives de transport, backoff 30–600 s, concurrence 1.
- Workers privés, minInstances 0, maxInstances 1, timeout 540 s. Les comptes de
  domaine ont les droits enqueue et invocation ciblés. Les six sondes anonymes
  ont reçu HTTP 403 ; une livraison OIDC autorisée a reçu HTTP 204.
- **17 Functions existantes** ont reçu une mise à jour de source ciblée :
  création/prolongation/recréation/régénération des liens, préparation/reprise
  du paiement des liens, création/reprise checkout, deux webhooks Stripe,
  trois producteurs de sessions, agrégateur analytics, projecteur Incidents,
  capture des coûts et timeline admin. Triggers, secrets, identités et limites
  existants conservés ; adaptateurs des deux anciens entrypoints Stripe testés.
- `aggregateAnalyticsSessionGen2` est ACTIVE en révision `00013-rox`, activation
  événementielle à true. Projecteur Incidents ACTIVE en `00003-tes` après ajout
  de la réception des alertes Monitoring. Sink étendu aux HTTP 5xx et stderr
  sans severity. TTL `sys_analytics_maintenance.expireAt` confirmé ACTIVE.
- App Hosting : **`build-2026-09-10-001`, SUCCEEDED**, terminé à
  **12:01:15 UTC**. Source committée isolée des modifications analytics
  préexistantes ; build local Node 22, quatre tests deployment-cache réussis.
  Galerie, fiche produit et retour galerie vérifiés dans le navigateur.
  Pas de session admin authentifiée disponible pour une recette visuelle AAL2.

Sources immuables : commit `e872f85992a5d5ea1d5d6b691f96c69b713bf4ed`
pour les nouveaux services ; `cc47e364a95d9b3d6da7c673c3d8871169a2e28f`
pour les producteurs et Hosting ; `01b9257464e628a75537895fb711b304847b80ca`
pour le complément alertes. Déploiements ciblés, aucun déploiement global,
aucun push, aucune production, aucun paiement/remboursement ni e-mail.

## Résultats mesurés

| Scénario | Oracle et résultat |
| --- | --- |
| Intention Firestore → tâche privée → worker | Première recette : lien synthétique à tâche obsolète, résultat superseded/stale. Recette finale : réservation réelle d'une unité e2eOnly, Stripe test canceled, travail succeeded/expired, réservation released, mouvement de libération présent et stock 4 → 3 → 4 ; scan désactivé pendant la preuve |
| Session inactive | Première recette en moins de 5 s. Après arrêt du scan, seconde session clôturée en environ 10 s, succeeded/finalized ; session de recette supprimée via l'exclusion analytics existante |
| Livraison refusée puis reprise | Mauvaise identité OIDC : trois tentatives HTTP 403 observées ; tâche de recette supprimée, reprise explicite version/génération auditée ; bonne livraison et résultat stale. L'état needs_attention initial était injecté, pas un épuisement métier réellement subi |
| Observateurs commerce | Création de paiement bloquée : incident ouvert ; inbox sous lease : échéance différée ; dead_letter : incident ouvert ; états terminaux : deux incidents fermés. Recette réussie avant et après arrêt du watchdog. Aucun événement fournisseur signé simulé, aucun effet financier |
| Amorçage historique | 51 jours avec données consolidés, 51 travaux succeeded ; 46 archives programmées, cinq jours déjà archivés. Pas de suppression des faits source |
| Couverture avant bascule, 12:26:11 UTC | Lecture paginée : 148 commandes, 200 inbox, 413 sessions ; zéro candidat à amorcer et zéro needs_attention dans ces domaines. Deux anciens incidents watchdog fermés |
| Incidents | Cinq logs synthétiques répartis dans le temps : compteurs 1, 2, 3, 4, 5 sur 1 h, 6 h, 24 h, 3 j, 7 j, confirmés par cinq requêtes indépendantes Cloud Logging aux mêmes bornes. Un HTTP 503 et un stderr DEFAULT projetés séparément |
| Alertes | Suspension réelle : notification Pub/Sub `21762620733843868` reçue à 12:41:40.994 UTC, requête au projecteur à 12:41:41.148 UTC, HTTP 200. Rappel de l'incident `0.ocgrj5ucxyck` déjà projeté : compteur conservé à 1, conformément à la déduplication. Rejeu initial et livraison automatique distingués |

Les fichiers de recette portent des identifiants `qualification_*`. Les commandes
synthétiques sont closes sans paiement, l'inbox synthétique est processed avec
rétention bornée. Elles restent identifiables comme preuves, sans effacement
d'audit. Les queues suspendues pour la recette ont été remises RUNNING.

Comparaison indépendante Monitoring → cache Performance, même fin UTC
**2026-09-10T11:52:00Z**, mêmes services Gen2 déployés :

| Fenêtre | Appels Google | Appels du cache | Écarts par service |
| --- | ---: | ---: | ---: |
| 24 h | 2 727 | 2 727 | 0 |
| 7 j | 9 748 | 9 748 | 0 |
| 30 j | 98 322 | 98 322 | 0 |

L'inventaire contient 170 Functions après les dix créations. Les totaux incluant
Gen1 sont respectivement 2 731, 9 772 et 98 419 ; ne pas les comparer aux seuls
services Gen2. Une relecture du cache n'a généré aucun nouvel appel Monitoring.
Cette vérification porte sur les volumes ; elle ne constitue pas une nouvelle
qualification des percentiles ni du consentement analytics de navigation.

## Bascule terminée et limites de qualification

Les deux anciens scans de publication sont PAUSED : **97 lancements/jour
retirés**, après preuve de zéro session et de l'absence des producteurs anciens.
À **12:49:04 UTC**, les schedulers `maintainAnalyticsGen2` et
`commerceWebhookCoverageWatchdogGen2` ont été vérifiés **PAUSED** après
qualification : **192 lancements/jour supplémentaires retirés**. Les tâches de
clôture des sessions, consolidation et archivage restent actives ; arrêter ce
scan ne désactive ni la collecte ni les lecteurs Data. La consolidation du
jour a ensuite terminé `succeeded/compacted` à **12:55:13.816 UTC**, sans ce scan.

Après la demande explicite de terminer la bascule, la recette fournisseur est
limitée au produit technique existant `fixture_gate6_stock10_03`, marqué
`e2eOnly`, sans toucher à l'armoire ou au stock commercial. Le lanceur utilise
le repository de checkout réel, le canal lien admin et une échéance de recette
de 90 secondes ; il ne simule pas une identité admin et ne constitue pas une
recette du formulaire authentifié. Aucun moyen de paiement n'est présenté,
aucun encaissement ni e-mail n'est autorisé. **Recette réussie à 12:52:55 UTC**,
commande `ord_647e5012-d1b8-4a6f-b6b2-1822e94528e5`. Le travail a terminé
`succeeded/expired` ; Stripe test est `canceled`, réservation `released`,
mouvement de libération présent, stock revenu de 3 à 4. La commande et ses
preuves sont conservées ; aucun lien commercial ni produit technique créé.

À **12:56:21 UTC**, les cinq schedulers sont confirmés **PAUSED** :

| Suffixe du job `firebase-schedule-…-europe-west1` | Ancien rythme | Lancements/jour retirés |
| --- | --- | ---: |
| `expireAdminPaymentLinksGen2` | 5 min | 288 |
| `commerceWebhookCoverageWatchdogGen2` | 15 min | 96 |
| `maintainAnalyticsGen2` | 15 min | 96 |
| `reconcileProductPublicationSessions` | 15 min | 96 |
| `cleanupProductPublicationSessions` | 24 h | 1 |
| **Total** | | **577** |

Les jobs et anciens handlers sont conservés pour retour arrière, sans exécution
programmée. Aucun secours lent ajouté. Ne pas les réactiver en redéployant leurs
anciens exports. Les autres schedulers commerce/catalogue restent hors de ce lot.
Les six queues événementielles sont RUNNING. Lecture finale paginée : 150
commandes, 202 inbox, 413 sessions ; zéro intention à amorcer et zéro
`needs_attention` dans ces domaines. Les tâches futures d'archivage restent
attachées à des jours ayant des données ; leur présence n'est pas un scan global.

Le coût global avant/après à charge identique et la capacité en rafale restent
à mesurer. Une tâche ajoute des écritures Firestore, des événements et des
livraisons ; la baisse des lancements programmés n'est pas une facture mesurée.
La console Incidents reste bornée à 50 groupes et 512 timestamps par groupe :
`≥` signifie couverture partielle, `—` historique absent ; aucun rattrapage
rétroactif exhaustif des anciens logs. Elle ne prouve pas l'absence d'attaques.
La recette après bascule prouve l'inactivité des sessions et la consolidation
Data sous événement. Elle n'exerce pas le vieillissement des fenêtres des
insights Stats pendant une longue période sans événement ni le parcours admin
authentifié complet ; ces cas ne sont pas annoncés comme validés.

La surveillance de l'âge Pub/Sub couvre aussi la subscription qui livre les
alertes à l'admin. Une panne de ce circuit peut néanmoins retarder son propre
signal dans l'admin : consulter directement Monitoring reste nécessaire dans
ce cas. Les alertes de logs ont également des limites de fréquence et de volume
Google ; elles ne remplacent pas l'historique des erreurs.
[Limites et comportement documentés par Google](https://docs.cloud.google.com/logging/docs/alerting/monitoring-logs).

Configuration finale des alertes : cinq règles Monitoring, canal Pub/Sub
existant `16752775952550280322`, topic `monitoring-g1-alerts`, trigger Eventarc
`maintenance-alerts-shared-to-admin` vers le projecteur privé. L'adaptateur
n'accepte que les cinq règles du projet et expurge leur contenu. Les autres
notifications de ce topic partagé sont ignorées ; elles peuvent néanmoins
occasionner une invocation du projecteur. Le topic, canal et trigger
supplémentaires de recette ainsi que la règle dupliquée ont été supprimés,
sans toucher aux autres règles ni au topic existant.

## Reproduction, preuves et retour arrière

- [Recette observateurs](../../scripts/qualify-event-observers.mjs),
  [inactivité](../../scripts/qualify-event-inactivity.mjs),
  [transport obsolète](../../scripts/qualify-event-transport.mjs) : confirmations
  sandbox explicites, aucune mutation fournisseur autorisée par ces scripts.
- [Expiration fournisseur sur fixture](../../scripts/qualify-event-link-expiry.mjs) :
  Stripe test uniquement, une unité technique, scan suspendu pendant la preuve
  puis rétabli en cas d'échec. Aucun nettoyage financier aveugle.
- [Reprise auditée](../../scripts/repair-event-maintenance.mjs) : cible exacte,
  version/génération et motif. Le compte de service de la queue est explicite,
  y compris avec ADC utilisateur ; aucun replay financier aveugle.
- [Déploiement source seule](../../scripts/deploy-event-producers.mjs) : source
  committée/digestée, révision attendue et archive de retour arrière vérifiée.
  Réutiliser ces préconditions pour restaurer la source précédente, en préservant
  configuration et secrets ; ne pas redéployer tous les exports Functions.
- Pour rétablir un scan migré : `gcloud scheduler jobs resume JOB
  --location=europe-west1 --project=secondevienextjsssr`. Lire l'état métier et
  la coexistence des acteurs avant reprise. Ne pas effacer intentions et audits.
- Les archives et preuves détaillées sont conservées localement dans
  `logs/recette/event_maintenance_20260910/`, ignoré par Git. Certaines sauvegardes
  de configuration sont privées : ne jamais les publier ni afficher leurs env.

Validation locale complémentaire : **15 tests réussis** pour alertes,
déduplication des réouvertures, fenêtres Incidents et outils de maintenance.
**30 tests analytics/lecteurs/UI réussis à nouveau après bascule**. Lint ciblé
des scripts de recette et de monitoring sans erreur ni avertissement.
Les 292 tests moteur/domaines et trois tests Emulator du rapport initial
restent des preuves datées, non réexécutées à chaque livraison.
