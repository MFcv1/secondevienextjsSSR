# Inactivité regroupée — activation sandbox du 10 septembre 2026

Demande explicite : activer et déployer le changement pour les prochains jours
de test du site. Projet `secondevienextjsssr`, App Hosting
`secondevie-next-sandbox`, Functions `europe-west1`.
[Conception et mesures locales](INACTIVITE_GROUPES_IMPLEMENTATION_2026-09-10.md).

## Livraison

Source immuable : commit `e9be585d3bce001c9078b22510d519bd89747c7f`.
Archive Functions SHA-256 :
`1f22fc5e0bdf8a5012c9567f7b7823d9b5272e439a42a862d866a10902fd56fb`.
Les anciennes sources et configurations des cinq fonctions modifiées sont
sauvegardées dans le dossier de preuves privé.

Hosting `build-2026-09-10-003` : **SUCCEEDED à 14:24:31 UTC**.
Build local Node 22 réussi avant livraison. Source isolée du correctif Data
non committé présent dans le workspace ; ce correctif est conservé intact.

Deux nouvelles Functions privées : `scheduleAnalyticsInactivityGroupGen2`
et `dispatchAnalyticsInactivityGroupGen2`. Agrégateur et worker individuel
compatibles avec les deux modes. Activation des trois producteurs de sessions
avec `ANALYTICS_INACTIVITY_MODE=grouped` et `ANALYTICS_INACTIVITY_PARTITIONS=4`.
Les nouvelles sessions utilisent les groupes ; une session individuelle existante
garde son suivi jusqu'à sa fin. Aucun arrêt de la queue individuelle.

Relecture finale : les sept cibles sont ACTIVE. Révisions des producteurs :
`initlivesessiongen2-00006-dod`, `syncsessiongen2-00006-now`,
`syncsessionbeacongen2-00008-xos`. Nouveaux contrôles :
`scheduleanalyticsinactivitygroupgen2-00001-ceq` et
`dispatchanalyticsinactivitygroupgen2-00001-buk`. Agrégateur `00015-kej`,
worker individuel `00002-bug`. Mode `grouped` relu sur les trois producteurs.
GET public après livraison : HTTP 200. Aucun log ERROR sur ces contrôles et
producteurs dans la fenêtre relue à partir de 14:25 UTC ; observation bornée,
pas une garantie d'absence d'erreurs futures.

Firestore : index composite `analytics_sessions/sessionActive/inactivityGroup.groupId`
**READY**, règles privées publiées, exemptions d'index des groupes appliquées,
TTL des groupes **ACTIVE**, à 14 jours après succès uniquement.
Queue `dispatchAnalyticsInactivityGroupGen2` RUNNING, une exécution simultanée,
une distribution/seconde, dix tentatives, backoff 30–600 secondes.
Invocation réservée au compte analytics ; déclencheur réservé au compte Eventarc.
Sonde anonyme du worker : **HTTP 403**.

Les cinq règles Monitoring existantes couvrent désormais la nouvelle queue et
son abonnement Eventarc. Aucun nouveau scheduler. Les cinq anciens scans de
liens, watchdog, maintenance analytics et publications sont toujours **PAUSED**.

## Qualification réelle

Trois sessions synthétiques, créées à 14:22:53 UTC, deux groupes attendus à
14:25:00 UTC. Le transport Firestore → Eventarc → Cloud Tasks → worker est réel.
Les sessions ont des dates techniques permettant de vérifier le traitement sans
attendre 35 minutes ; cela ne constitue pas une visite navigateur de 35 minutes.

| Cas | Résultat observé après l'échéance |
| --- | --- |
| Plus de nouvelles depuis plus de 35 minutes | `sessionActive=false`, `finalizedBy=inactivity_group`, groupe `succeeded` |
| Départ déjà reçu | Session conservée inactive, groupe `succeeded` sans nouvelle clôture |
| Signal récent | Session conservée active, pointeur déplacé vers le prochain groupe, ancien groupe `succeeded` |

Durée conservée à 123 secondes dans les trois cas. Nettoyage par le mécanisme
d'exclusion existant, puis suppression des seules sources techniques. Relecture :
aucune des trois sources, faits historiques, cartes live ou détails techniques
ne subsiste. Les groupes et l'audit sont conservés ; un rendez-vous futur déjà
justifié peut constater sa liste vide une fois, puis se terminer.

Lecture bornée des sessions actives après nettoyage : zéro session, zéro session
sans suivi ; aucune migration de masse nécessaire à cet instant. La galerie a
été ouverte dans le navigateur. Aucun parcours admin AAL2 visuel complet ni
nouvelle preuve visuelle du voyant dans cette recette ; son code reste inchangé.

Validation avant livraison : **101 tests réussis**, incluant contrats de déploiement
et tests Data déjà présents dans le workspace. Les cinq tests Firestore Emulator
de l'implémentation restent une preuve locale distincte. Le build isolé inclut
uniquement la source committée de cette livraison.

## Limites et retour arrière

L'utilisateur a demandé l'activation pour une phase de test sur plusieurs jours.
Le regroupement réduit les contrôles dans les simulations documentées, mais le
coût monétaire complet et la capacité sous trafic soutenu ne sont pas encore
mesurés. Quatre partitions sont le réglage de cette phase, pas une capacité garantie.
Les gates économiques du plan restent ouvertes comme critères de qualification,
sans être présentées comme satisfaites par le déploiement.

Retour arrière : remettre `ANALYTICS_INACTIVITY_MODE=individual` sur les trois
producteurs, en préservant les autres variables. Les sessions groupées actives
restent suivies par les groupes ; si nécessaire les migrer explicitement avec
`scripts/migrate-analytics-inactivity.mjs`, dry-run puis page sauvegardée et auditée.
Ne pas supprimer le worker groupé tant que des sessions ou tâches en dépendent.
Restaurer une source depuis les sauvegardes seulement après vérification des
révisions, et ne pas réactiver les anciens scans pour ce retour arrière.

Preuves détaillées : `logs/recette/grouped_inactivity_20260910/`, ignoré par Git.
Les fichiers `*.private.json` contiennent des configurations : ne pas les publier.
Aucune action production, aucun paiement, e-mail, push ou suppression de fichier
métier. Commit local de source nécessaire à l'archive immuable et au Hosting isolé.
