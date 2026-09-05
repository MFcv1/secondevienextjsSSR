# Suivi local des lots I0 à I6

Validation initiale : 2026-09-05, sans commit, push, déploiement ni mutation cloud.
Après cette validation, le commit et le frontend ont été livrés dans
l'[extension Stats/Data](SUIVI_STATS_DATA_2026-09-05.md). Les états du tableau
ci-dessous décrivent la réception locale initiale ; les Functions et migrations
restent non livrées.
Référence : `2c6c5b4358bffbb04674ddc8b869e3239f74ff2d`.
Le [plan](IMPLEMENTATION_BACKOFFICE_POST_QUALIFICATION_2026-09-05.md), les deux
rapports et les preuves historiques restent conservés. Les suppressions des
skills et les modifications documentaires déjà présentes ne font pas partie
de cette implémentation. Node 22.23.2, pnpm 11.7.0, Next installé 16.3.0.
Guide installé `use-client` lu avant code. Aucun opt-in de rendu Next ajouté.

## Suivi par lot

| Lot | État local | Changements et preuve | Livraison / qualification hébergée |
| --- | --- | --- | --- |
| I0 | code validé localement | Git identifié ; preuves historiques présentes ; marques Performance existantes conservées ; scénarios versionnés dans les nouveaux tests | Non / non |
| I1 | code validé localement | Stats reprend le contrat Ventes ; inconnus explicites ; attente/erreur Factures et Commandes ; résumés manquants indisponibles ; observer insights réinstallé après le squelette et sans verrou survivant au cleanup | Non / non |
| I2 | code validé localement | Cache propriétaire/génération, invalidations Auth et refus serveur, rejet des lectures tardives, 100 entrées maximum ; brouillon Devis et expectedVersion indépendants du serveur, rapprochement explicite après conflit | Non / non |
| I3 | code validé localement, migration obligatoire | Delta ledger/source ; activation baseline explicite ; séquence/génération sync et beacon ; source/exclusion relues pour les faits ; reconstruction par shard paginée ; propagation jour/mois/année/insights transactionnelle | Non / non |
| I4 | code validé localement, activation archives différée | Suivi Devis avant photos ; cache par ID/version ; zéro produit au seul accueil Factures ; curseurs et références exactes ; documents liés Retours dédupliqués ; dernière tentative des remboursements complets différée au détail | Non / non |
| I5 | code validé localement, services réels restant à mesurer | Entrée ciblée de huit lecteurs ; découverte globale conservée ; Sharp/PDF/e-mail différés ; metadata identiques ; premier handler autorisé mesuré avec lectures doublées | Non / non |
| I6 | code validé localement | Prise avec échéance/tentative/lease ; marque avant envoi ; tentative expirée ambiguë isolée ; reschedule d'une tâche obsolète ; aucune modification de queue | Non / non |

Les états locaux ne ferment pas les constats hébergés. I7 n'est pas exécuté ;
I8/I9 restent hors périmètre. QBO-06 conserve son attribution ouverte : les
protections de brouillon ne prouvent pas le payload de l'incident Q1.

## Validation et mesures

Nouveaux tests : `tests/backoffice-post-qualification.test.cjs`,
`backoffice-reconciliation.test.mjs`, `backoffice-emulator.test.cjs` et
`backoffice-browser.spec.mjs`. Les reproductions historiques ne sont pas
réécrites : leurs anciennes attentes décrivent la référence Git, pas le code
corrigé. Deux anciens contrats statiques demandaient un préchargement dans le
shell alors que le code le définit dans les vues lazy ; ces assertions ont été
replacées sur les bons modules, sans ajouter de lecture au shell.

Résultats métier vérifiés : sept demandes, vingt contacts, fait à 120 secondes,
session fermée à 120 secondes malgré un ancien heartbeat. Firestore Emulator
`demo-secondevie-backoffice` vérifie une seule prise concurrente, session
disparue, pagination stable et reconstruction de 2 001 faits. Le harness
navigateur monte les vrais composants React ; seuls les transports et les
primitives de mouvement sont doublés. Il vérifie attente/erreur/retry,
changement de dépendance et payload insights invalide, suivi avant photos et
conservation des notes, sélection rapide et saisie pendant sauvegarde : huit
passages desktop/mobile. Il ne constitue pas une recette visuelle hébergée.

Suites complémentaires exécutées sous Node 22 : commerce unit (148), property
(3), faults (46), Auth (78), contrats Functions (165), analytics (9), rétention
(5). Build avec fixture catalogue CI ; aucun catalogue hébergé utilisé.
Passe finale ciblée : 26 tests réussis ; navigateur : 8/8 ; émulateur demo :
4/4. ESLint complet : zéro erreur, 127 avertissements. Dernier build Next sous
Node 22 réussi avec `CATALOG_BUILD_FIXTURE=true` et deploymentId local unique.
`git diff --check` et vérification des liens documentaires ajoutés réussis.
Le cache couvre également le refus tardif d'un ancien admin : il ne purge pas
les données du nouvel admin. La reprise de session restitue la source relue
transactionnellement et refuse les messages de l'ancienne génération.
Les résultats de la dernière passe sont conservés localement dans les fichiers
`/tmp/sv-i0-i6-*` et `/tmp/sv-bo-browser.log` ; ils ne portent pas de secrets.
Le total des suites n'est pas un nombre de scénarios distincts : elles se recouvrent.

Mesure reproductible : `node scripts/measure-backoffice-readers.cjs`.
Trois processus frais par cible et par mode, réseau interdit. Le mode discovery
charge tous les exports du code corrigé ; le mode targeted charge le lecteur.
Les huit metadata d'endpoints sont identiques entre les deux modes. Un premier
handler sans Auth est réellement appelé et refusé ; **son temps n'est pas celui
d'une requête admin autorisée avec Firestore ou signature Storage**.

| Cible | Imports discovery, ms | Imports targeted, ms | Modules après premier refus ciblé |
| --- | --- | --- | --- |
| listOrdersAdminV2Gen2 | 526 / 511 / 514 | 136 / 134 / 135 | 487 |
| listReturnsAdminV2Gen2 | 502 / 502 / 505 | 134 / 136 / 133 | 487 |
| listCustomerReturnRequestsAdminV2Gen2 | 504 / 509 / 505 | 136 / 136 / 135 | 487 |
| getOrderTimelineAdminV2Gen2 | 504 / 507 / 506 | 135 / 137 / 135 | 487 |
| getBillingGuideStatusGen2 | 503 / 503 / 501 | 136 / 133 / 134 | 477 |
| getManualInvoiceWorkspaceAdminGen2 | 505 / 504 / 505 | 136 / 136 / 136 | 480 |
| listQuoteRequestsAdminGen2 | 502 / 504 / 503 | 136 / 138 / 136 | 485 |
| getQuoteRequestAdminGen2 | 504 / 503 / 505 | 137 / 136 / 138 | 485 |

Les résultats bruts incluent RSS, premier handler et noms des exports. Ce sont
des mesures locales, pas un cold start cloud ni un SLO. La première mesure de
ce tour avant scission était 912 ms / 1 738 modules / 160 137 216 octets RSS ;
c'est un échantillon unique, distinct des mesures historiques du rapport.

`node scripts/measure-backoffice-authorized.cjs` complète cette mesure avec le
SDK Firestore réel chargé et le contrôle Auth/registre actif réellement exécuté.
Seules les lectures sont doublées (listes vides, commande legacy, devis sans
média), réseau interdit. Médianes de trois processus frais, temps total incluant
imports et premier handler autorisé :

| Cible | Discovery, ms | Targeted, ms | RSS targeted, Mio |
| --- | --- | --- | --- |
| listOrdersAdminV2Gen2 | 500 | 136 | 76,5 |
| listReturnsAdminV2Gen2 | 555 | 137 | 76,6 |
| listCustomerReturnRequestsAdminV2Gen2 | 507 | 137 | 76,6 |
| getOrderTimelineAdminV2Gen2 | 499 | 266 | 76,4 |
| getBillingGuideStatusGen2 | 996 | 208 | 76,5 |
| getManualInvoiceWorkspaceAdminGen2 | 501 | 136 | 76,6 |
| listQuoteRequestsAdminGen2 | 919 | 251 | 76,5 |
| getQuoteRequestAdminGen2 | 1020 | 337 | 76,3 |

Ces échantillons sont sensibles à la charge locale. Ils ne mesurent ni la
latence Firestore réelle, ni la signature Storage, ni un parcours non vide
complet. Les mesures brutes sont conservées dans
`logs/recette/implementation_bo_local_20260905/`, séparées des preuves Q1.

Gains nominaux établis par code/doubles : Devis sans photo passe de deux appels
à un ; retour dans la fraîcheur du cache à zéro ; Factures ne lit plus les
jusqu'à 300 produits à l'accueil. Une commande entièrement remboursée ne lit
plus sa dernière tentative avant ouverture du détail. Les demandes Retours
partagent les références identiques dans la requête ; les documents nécessaires
aux alertes/décisions restent lus. Ce n'est pas un DTO entièrement compact,
ni une mesure de lectures facturées. Les pages ajoutent une ligne de lookahead
pour prouver `hasMore` ; une poursuite lit aussi le document curseur.

## Préparation de livraison — autorisation distincte obligatoire

Cibles : projet `secondevienextjsssr`, région `europe-west1` pour les Functions,
App Hosting `secondevie-next-sandbox` en `europe-west4`. Relire au moment de
l'autorisation la branche, les révisions servies, IAM, indexes et le contrôle
commerce. Aucune autorisation Q1 n'est réutilisable. Aucun `deploy functions`
global et aucun changement CPU, concurrence, min/max ou retries de queue.

Cibles de lecture : les huit noms du tableau, plus `listAdminPaymentLinksGen2`.
Cibles données : `projectAdminActionSummaryGen2`, `projectNewsletterSubscriberGen2`,
`initLiveSessionGen2`, `syncSessionGen2`, `syncSessionBeaconGen2`,
`aggregateAnalyticsSessionGen2`, `maintainAnalyticsGen2`.
Cibles outbox : `dispatchCommerceOutboxTaskGen2`, `commerceOutboxDispatcherGen2`
et `onCommerceOutboxWrittenGen2` pour conserver un contrat de tâche cohérent.
Champ d'archive : `archiveOrderAdminGen2`, `createCheckoutV2Gen2`,
`createAdminPaymentLinkGen2`, `recreateAdminPaymentLinkGen2` et tout writer de
création legacy encore servi à identifier au préflight. Les consommateurs de
`orderState` conservent leur contrat, mais aucun ancien créateur ne doit
réintroduire un document sans `adminArchived` après activation de l'index.

Ordre :

1. Sauvegarder révisions, configuration et données concernées. Publier les trois
   indexes ajoutés : faits jour/shard/ID ; commandes archive/date ; liens
   canal/référence/date. Attendre READY. Aucune suppression d'index existant.
2. Livrer les lecteurs additifs avant le frontend : l'ancien frontend conserve
   produits et détails complets ; les nouveaux paramètres sont pris en compte
   avant d'annoncer une recherche globale par référence dans l'interface.
3. Remplacer ensemble les deux writers de session et init, y compris les
   éventuels alias encore servis. Publier le frontend séquencé ensuite. La
   compatibilité sans protocole est réduite : durée non décroissante, fermeture
   conservée jusqu'à init, pas d'arbitrage complet du parcours. Elle prend fin
   le 12 septembre 2026 UTC par défaut. Relire/configurer une échéance valide
   `ANALYTICS_LEGACY_PROTOCOL_UNTIL`, au plus sept jours après livraison ; ne
   jamais prolonger indéfiniment. Un ancien client ne rétrograde pas une session
   séquencée ; il reçoit une nouvelle session pendant cette fenêtre.
4. Pour Retours/Newsletter, fermer la gate de projection (`ledgerBaselineReady`
   faux), remplacer tous les anciens projecteurs, conserver les événements en
   retry. Ne pas appliquer les nouveaux projecteurs directement à l'ancienne
   baseline Newsletter qui n'identifie pas ses membres.
5. Construire par pages les contributions de chaque source et les tombstones
   des anciens ledgers sans source. Aucun projecteur ne modifie les ledgers
   pendant cette phase. Compter les contributions effectivement écrites,
   vérifier sauvegarde/checkpoints puis activer total + gate dans une transaction
   CAS sur la révision attendue. Drainer les événements : la relecture source
   rattrape créations/suppressions survenues pendant l'énumération. Ne pas
   remplacer un total pendant les écritures de projection.
6. Backfill additif `adminArchived = Boolean(archivedAt)` et `shardId` déterministe
   des faits anciens, avec précondition de version et pages de 500 maximum.
   Activer `ADMIN_ORDER_ARCHIVE_INDEX_READY=true` seulement après couverture
   complète et remplacement des writers. Le fallback local reste explicitement
   `legacy_archive_filter` tant que cette activation n'est pas faite.
   Activer `ANALYTICS_FACT_SHARD_INDEX_READY=true` seulement après couverture
   des faits et index READY. Avant cela, la reconstruction parcourt le jour par
   pages et filtre le shard en mémoire, y compris les anciens faits sans champ.
7. Livrer l'outbox durcie sans augmenter les retries de transport. Les tâches v1
   déjà créées portent normalement tentative/échéance ; celles sans identité
   restent protégées par échéance/lease. Un ancien processing expiré sans preuve
   d'avant-envoi devient incertain. Qualifier les reprises avant toute décision
   de queue, qui reste un autre acte autorisé.
8. Qualifier source → projection → affichage, deux admins, conflits, coupure avec
   mutation distante et parcours Factures non vide dans I7 explicitement autorisé.

Préparateurs locaux : `scripts/prepare-backoffice-reconciliation.mjs` fournit
un dry-run pur sur snapshot expurgé, digest, changements, préconditions et
checkpoint ; `prepareSchemaMigration` prépare les champs additifs par pages.
Les tests exécutent leur dry-run sur fixtures. Aucun snapshot hébergé n'a été
exporté ici, aucun manifeste réel de divergence n'est donc affirmé prêt à appliquer.
L'applicateur cloud et ses preuves de sauvegarde/CAS restent à exécuter sous
autorisation de migration ; aucun effet commerce/finance ne sert de réparation.

Rollback : conserver les nouveaux champs et ledgers ; désactiver d'abord l'usage
des indexes archive/shard si nécessaire. Un rollback frontend vers la version précédente
est compatible avec les lecteurs additifs. Ne pas remettre un vieux projector
delta/événement ou un ancien writer sync sur une source corrigée : arrêter sa
livraison, garder les événements et restaurer un backend qui conserve les gardes.
Pour l'outbox, aucune entrée `delivery_unknown` ne devient automatiquement
`failed` ou `pending`. Une restauration de total exige reprise des checkpoints,
pas restauration aveugle d'une ancienne sauvegarde sous trafic.

## Limites toujours ouvertes

Latence autorisée complète et RSS du premier accès aux services, gains hébergés,
coût Billing, convergence multi-admin hébergée, qualité des données historiques,
recette non vide Factures et identification des anciennes révisions/writers.
La reconstruction paginée retire le plafond de 2 000 faits mais reste une
transaction Firestore : sa durée et sa taille maximales au volume réel restent
à mesurer. Aucune nouvelle politique de rétention/compaction I8 n'est déduite.
Les imports lecteurs Factures/Devis conservent encore des déclarations des
handlers voisins ; les effets lourds sont différés. La scission n'est pas
présentée comme une séparation exhaustive de chaque décorateur historique.

Aucun fichier métier déplacé ou supprimé. Les preuves historiques Q1 et leurs
restaurations restent intactes. Git reste volontairement non committé.
