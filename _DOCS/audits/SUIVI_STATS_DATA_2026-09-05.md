# Stats et Data — ouvertures et coût de lecture

## Livraison autorisée le 5 septembre — hosting et deux lecteurs livrés

L'utilisateur a autorisé la livraison sandbox et le scénario Data synthétique
borné. Aucune autorisation Q1 réutilisée ; migration des 142 commandes/181 faits
et activation des index toujours exclues.

App Hosting : `build-2026-09-05-002` READY, trafic relu à 100 %, deployment ID
`sv-mtok7tji-f3482ed863f6`. Cloud Build
`655be055-5740-4e51-90bc-c5e9d6ab45c9`. Source isolée à partir du HEAD existant
avec les sept fichiers frontend corrigés ; changements documentaires antérieurs
exclus. `/admin`, `/` et `/galerie` renvoient 200 avec le même deployment ID ;
admin `private, no-store`, public `s-maxage=300`. Capacité identique entre builds :
CPU 1, 512 Mio, concurrence 80, max 10. Rollback hosting : `build-2026-09-05-001`.

23 contrôles de préflight supplémentaires réussis. Chrome admin après rollout :
30 cycles Stats/Data, 60 contrôles de période et synchronisation réussis
(Stats trois mois, Data sept jours). Aucun comptage d'écoutes ou gain de latence
ne découle de ces seuls contrôles AX. Les premiers essais de mesure CUA rendaient
un état en retard d'une navigation : exclus de toute comparaison de vitesse.
Un second onglet admin restaure l'accès ; retour au premier après masquage
prolongé : sept jours conservés, 9 visiteurs et confirmation serveur. Le mode
Tout affiche le nouveau libellé d'historique incomplet séparé de la synchronisation.

Source unique autorisée `analytics_sessions/qualif_post_20260905_1354_synthetic` :
création à 15:58:11 UTC, progression 60 s à 15:58:39, progression 120 s pendant
la coupure à 15:59:55, exclusion à 16:00:48, suppression à 16:01:32.
Cinq écritures opérateur avec préconditions, aucun patch des compteurs agrégés.
Data sept jours passe de 9 visiteurs estimés/12 sessions à 10/13 ; carte Linux
1 min visible. DevTools Offline confirmé avec `ERR_INTERNET_DISCONNECTED` :
carte conservée à 1 min, libellé cache, alors que la projection distante vaut
2 min. Retour No throttling : carte 2 min et synchronisation sans rechargement.
Les sessions actives ne finalisent pas la durée des KPI : ces progressions
portent sur la carte live, le total de sessions reste 13.

Après exclusion : retour visible à 9/12, carte retirée. Après suppression :
source, résumé live, détail et fait absents ; ledger tombstone conservé avec
contribution nulle. Aucun total global restauré, aucun paiement/e-mail/commande.
Ces observations prouvent un exemple de convergence et de reconnexion, pas
un p95, une facture Firebase ni la convergence entre deux identités admin.

Preuves locales : `logs/recette/livraison_correctifs_20260905/` (rollout,
readbacks, contrôle commerce révision 77 inchangé, HTTP, capacité, cinq phases
et nettoyage). Les JSON `.private` restent ignorés et ne contiennent pas de
token d'accès sauvegardé.

Après accord utilisateur complémentaire, commit ciblé `eccd278`, sans push.
30 tests de préflight passent sous Node 22.23.2. Les deux lecteurs sont ACTIVE :
`listordersadminv2gen2-00005-feg` et
`listcustomerreturnrequestsadminv2gen2-00005-lex`. Seul `buildConfig.source`
a été mis à jour ; comparaison intégrale des paramètres de service hors
révision et des déclencheurs : identiques. Archive SHA-256
`13d9893ccd2fde6dd310f4f2c951daa48ae1d28545151ae5180d05a6d8749e8e` ;
seul `src/commerce/v2OrderQueries.js` diffère de l'archive précédente.
Rollback : sources/configurations des révisions `00004-fal` et `00004-kec`
sauvegardées dans `livraison_correctifs_20260905/backend-before/`.

Après rechargement admin, Commandes affiche 49 puis 99 commandes distinctes
après pagination. Le détail C142 conserve panier, total et parcours.
Retours passe de 38 à 61 dossiers après pagination et affiche les trois
demandes avec références de commande, articles et étapes enrichies.
Les journaux HTTP confirment les POST 200 sur les nouvelles
révisions : liste Commandes 124 697 octets, détail 3 049, page suivante
118 856 ; demandes Retours 8 637. Ce sont des tailles de réponse Cloud Run,
pas des documents Firestore facturés. Les premiers POST observés prennent
6,69 s et 6,17 s ; aucun avant/après comparable, p95 ou gain hébergé déduit.
Preuves : `backend-verification.json`, `backend-http-readback.json` et
`backend-artifact.json` dans le dossier de livraison. Aucun changement de
capacité, migration, paiement, remboursement ou e-mail dans cette livraison.

## Correctifs locaux après qualification — 5 septembre, 17 h 30 Paris

Travail local uniquement, non committé et non livré. Les sections historiques
ci-dessous et les preuves de qualification sont conservées. Changements
préexistants (dont rangement documentaire et suppression des anciens skills)
préservés. Node **22.23.2** explicitement sélectionné ; guides Next installés
`use-client` et `lazy-loading` lus avant code.

### Constats confrontés et corrections

- Les périodes étaient initialisées au montage : Stats « 3 mois » et Data
  « 7j » sont maintenant conservés dans la mémoire de la session autorisée,
  purgée à la révocation/changement d'UID. Aucun appel ni stockage persistant.
- Les anciennes connexions sont déjà invalidées par génération. En revanche,
  un snapshot SDK local vide pouvait remplacer une valeur connue après reprise :
  correction des canaux KPI Stats, Data et sessions récentes. La mémoire reste
  annoncée en cache jusqu'à confirmation serveur, sans transformer une erreur
  de schéma/permission en succès. Les suppressions confirmées restent recevables.
- Protection ajoutée aux réponses tardives du lecteur Data compatible ; le
  lecteur realtime calcule toutes les périodes depuis les deux mêmes documents,
  sans requête par sélection. Stats protégeait déjà ses réponses financières ;
  le tableau annuel n'est plus inversé en place dans le cache partagé.
- Data indique « Historique incomplet sur cette période » lorsque la couverture
  est la seule cause, sans changer la preuve exigée pour un historique complet.
- Commandes compactes : médias/descriptions catalogue des lignes omis du
  transport, détails exacts intacts. Aucun changement des documents stockés,
  prix, droits, actions, filtres ou curseurs.
- Demandes Retours : références liées uniques lues en un `getAll` borné par la
  page, au lieu de plusieurs RPC individuelles. Même réponse et mêmes documents.
  La page Retours conserve ses trois lecteurs parallèles et leur cache partagé :
  retirer les commandes aurait supprimé des possibilités de remboursement manuel.

### Première ouverture : causes et portée des mesures

Auth forte puis contrôle d'accès restent obligatoires. La qualification hébergée
avait distingué 372 ms de restauration et 2 775 ms supplémentaires jusqu'à
l'accès lors d'un exemple froid ; ce délai n'est pas attribuable aux graphiques.
Les vues lazy attendent ensuite chargement/évaluation de leur code. Stats ajoute
son écoute KPI, puis les tendances au panneau visible. Commandes attend son
lecteur et sa sérialisation ; Retours attend le plus lent de ses trois lecteurs,
avec enrichissement backend des demandes. Factures charge déjà son workspace
sans produits : aucun appel catalogue à avancer et aucune lecture à ajouter.
Les corrections portent sur les payloads et RPC évitables, sans modifier Auth
ni capacité. Pas de nouveau gain en millisecondes Auth/code/backend/peinture
affirmé : les tests composants doublent les transports et n'émulent pas les
démarrages froids cloud.

Mesures comparables sur **la même fixture locale et le même processus Node** :

| Mesure | Avant | Après | Limite |
| --- | ---: | ---: | --- |
| JSON d'une commande avec médias/descriptif embarqués | 6 916 octets | 1 946 octets | Fixture volontairement riche, pas les 142 commandes hébergées |
| RPC liées à trois demandes portant sur deux commandes | 2 | 1 | Hors lecture de page et autorisation |
| Documents liés demandés dans ce scénario | 2 | 2 | Compteur du double de transport, pas Billing |
| Écoutes Stats sur 30 retours rapprochés | 2 | 2 | Optimisation antérieure conservée, pas un gain nouveau |

Aucun p95, coût Firebase, baisse d'écriture ou gain de vitesse hébergé revendiqué.

### Validations

- 49 tests Node ciblés : cache/UID/expiration, réponses anciennes, projections,
  sessions, contrats Commandes/Retours ; réponses groupées identiques et compteurs
  d'appels/documents contrôlés.
- 7 scénarios Firestore demo : Data atteint 0 → 1 → 2 → 3 sessions après
  écriture distante visible, pause puis réseau coupé/reconnecté ; rejeu stable.
  Stats reçoit 12 500 → 25 000 → 37 500 → 50 000 centimes via son canal retenu,
  après expiration de grâce et masquage ; 30 retours sans nouvelle écoute.
  Ce test Stats écrit une projection demo, il ne simule pas un paiement réel.
  Le délai de grâce est déclenché par horloge injectée, pas une attente physique.
  Les clients/emulateurs sont arrêtés en fin de scénario.
- 20 passages Playwright desktop/mobile avec composants React réels, transports
  doublés et réseau externe bloqué : périodes, retours, photo Devis locale et
  notes conservées, détail Factures avec désignation/quantité/prix, erreurs/retry,
  réponse Data partie sur 24 h reçue après sélection 7j (77 visiteurs, pas 11).
- Build avec fixture catalogue réussi ; lint global : 0 erreur, 127 warnings
  préexistants ; `git diff --check` propre. Aucun fichier source déplacé/supprimé.

Commandes reproductibles : Node 22, `node scripts/test-analytics-realtime-emulator.mjs`,
`playwright test tests/backoffice-browser.spec.mjs --workers=2`,
`CATALOG_BUILD_FIXTURE=true npm run build`, `eslint .`.
Logs locaux conservés dans `logs/recette/correctifs_locaux_20260905/` :
`sv-qualification-{unit,emulator,browser,lint,build}.log`.
Un premier runner demo a été arrêté après assertions réussies mais fermeture
incomplète ; le nettoyage explicite du client a été corrigé et la suite entière
relancée avec sortie 0. Aucun succès n'est déduit de ce premier arrêt.

### Autorisations restantes

[Livraison ciblée et scénario hébergé avec nettoyage](RECETTE_STATS_DATA_HEBERGEE_A_AUTORISER.md).
App Hosting et les deux lecteurs modifiés nécessitent un nouvel accord ;
les mutations synthétiques Data nécessitent leur accord borné distinct.
Les champs des 142 commandes/181 faits et les drapeaux d'usage des index restent
inchangés et soumis à une autorisation séparée. Aucun paiement, remboursement,
e-mail, commit, push ou déploiement effectué.

2026-09-05. Extension demandée après I0–I6, puis commit et livraison sandbox
effectués. Périmètre Functions à préciser ; aucune autorisation Q1 réutilisée.

## Code et contrat

Stats conserve en mémoire les trois KPI et cinq commandes récentes. Les
tendances restent différées au panneau, puis écoutent leur unique document :
une nouvelle projection actualise la page sans rechargement. Le catalogue
n'est demandé que pour des produits réellement à illustrer. Data ne demande
plus le catalogue à son ouverture, mais à l'ouverture d'un parcours.

Retour en moins de 30 s : données immédiates et connexions partagées. Au-delà,
les écoutes Stats/Data sont suspendues, y compris la page historique Data.
Masquage du navigateur : suspension immédiate, détail ouvert compris. Au retour,
la mémoire est annoncée en actualisation jusqu'au serveur ; callbacks anciens
ignorés. Purge sur transition d'autorisation, sans persistance nouvelle.

Les périodes financières sont dédupliquées 30 s avec période/jour UTC/révision
finance dans la clé. Une ancienne sélection ne remplace pas la suivante.
Erreur des commandes récentes distincte de liste vide, retry ; KPI indisponibles
jamais libellés « À jour ». Identité visuelle conservée.

Aucun nouveau polling ou writer. Les écritures des projecteurs serveur ne
dépendent pas de la consultation des écrans : aucune réduction de ces écritures
n'est revendiquée.

## Preuves locales

Node 22.23.2, guide Next installé `use-client` lu avant code. 44 tests ciblés
réussis, 12 passages navigateur desktop/mobile, build avec fixture catalogue
réussi, lint complet 0 erreur/127 avertissements. Logs `/tmp/sv-stats-data-*`.

Test navigateur : première ouverture puis 30 retours Stats, deux souscriptions
initiales, aucune supplémentaire. Avant, chaque montage recréait les deux
écoutes. Le canal teste pause/reprise/confirmation serveur, réponse tardive et
révocation. Transports doublés : ce ne sont pas des lectures facturées.
Les documents modifiés restent reçus et peuvent être facturés. Une reconnexion
après suspension peut également relire les documents.

Correction de l'explication conversationnelle : le composant `BoutiqueAnalytics`
contenant la requête de 3 000 clics n'est pas monté dans Data. Ce n'est pas une
dépense active démontrée ; aucune suppression opportuniste de ce code.

## Livraison et limites

Complément ultérieur : [backend livré et compteurs migrés](LIVRAISON_BACKEND_2026-09-05.md).
Le paragraphe ci-dessous conserve le périmètre du premier rollout hosting.

Code committé `cb2db14` sur `codex/stats-data-performance`, sans push.
App Hosting livré : `build-2026-09-05-001`, 100 % du trafic relu après succès.
Cloud Build `62806d88-bb93-42fc-9f1e-c3e2f835a931` terminé SUCCESS le
2026-09-05 à 12:54:43 UTC. Révision de rollback relevée avant livraison :
`secondevie-next-sandbox-build-2026-09-04-004` (100 % avant mutation).
Contrôle commerce relu : revision 77, `v2_all/v2`, offline off, inchangé.
Functions, indexes, baselines, capacité, paiements et e-mails non modifiés.
Les correctifs backend I0–I6 sont committés mais ne sont pas actifs par ce
déploiement hosting. La qualification comparative n'a pas été exécutée.

Cible : `secondevie-next-sandbox`, projet `secondevienextjsssr`, `europe-west4`.
Configuration relue : Analytics temps réel activé ; capacité inchangée.
La compatibilité I4 est gardée : recherche exacte proposée uniquement quand la
réponse expose le nouveau contrat de pagination. Un ancien backend ne fait
pas annoncer une recherche globale qu'il ignore. Les migrations I3 et les
Functions restent distinctes du déploiement App Hosting.

Qualification hébergée après décision utilisateur : aucun p95 clic→KPI, gain
Billing ou délai source→projection→écran déduit de ces tests locaux.
Les limites du [suivi I0–I6](SUIVI_IMPLEMENTATION_BACKOFFICE_2026-09-05.md)
restent ouvertes. Les preuves historiques sont conservées.
