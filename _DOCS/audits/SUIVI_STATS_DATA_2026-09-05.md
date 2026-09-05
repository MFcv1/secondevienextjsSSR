# Stats et Data — ouvertures et coût de lecture

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
