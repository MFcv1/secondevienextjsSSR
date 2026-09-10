# Graphiques Data — livraison staging du 10 septembre 2026

## Complément historique livré à 16:10 UTC

Commit `9f496b6` : conservation des barres historiques tant que les nouvelles
tranches ne couvrent pas toutes les sessions de chaque jour/mois. Hosting seul,
`build-2026-09-10-004` READY et servi à 100 %, rollout réussi. Archive source
téléchargée et lecteur comparé au commit par SHA-256 : correspondance exacte.
Exécution de ce lecteur livré sur les projections cloud : 7 barres non nulles,
26 sessions sur 7 jours ; 12 créneaux mensuels dont 4 non nuls, 214 sessions
sur l’année. Aucun historique n’a été inventé ou réécrit.

26 tests Node 22 réussis, lint et build local réussis ; Cloud Build
`107ac2ff-5be1-4d06-bf93-e9d184214c57` SUCCESS. HTTP 200 sur `/`, `/admin` et
`/api/catalog/version`, deployment ID `sv-mtvpzujf-5d289d4248bc` cohérent sur
les deux pages, ISR 300 et admin no-store conservés. Pas de nouvelle recette
visuelle admin connectée. Aucune Function, rule ni donnée modifiée par ce lot.
Retour arrière identifié : `build-2026-09-10-003`, non exercé.
Preuve : `logs/analytics-history-hosting-20260910/verified.json` (hors Git).

Les sections suivantes décrivent la livraison initiale et sa limite historique,
corrigée par ce complément.

Autorisation : commit et déploiement staging demandés par l’utilisateur.
Projet `secondevienextjsssr`, backend `secondevie-next-sandbox`, aucune production.

## Versions servies

- Code : `c24db683699889b0c13d861f044dd999a9470737`, branche
  `codex/event-maintenance-sandbox-20260910`. Aucun push.
- App Hosting : `build-2026-09-10-002`, rollout réussi, build READY,
  révision `secondevie-next-sandbox-build-2026-09-10-002` à 100 %.
- Cloud Build : `d31519ea-9b0e-4cfd-8637-13fe5a961419`, SUCCESS.
- Deployment ID servi : `sv-mtvkgjdf-7a5b9444be7f`, identique sur `/` et `/admin`.
- Seule Function mise à jour : `aggregateAnalyticsSessionGen2`, ACTIVE,
  `aggregateanalyticssessiongen2-00014-xen`, Node 22, `europe-west1`.
  Mise à jour source seule via le wrapper ciblé ; déclencheur, identités,
  variables, secrets, limites et retry comparés et préservés.
- Archive Functions SHA-256 :
  `f8c772f2bced048c5daf6e641e46d49b748136f4d2fd623fbb08f968a07972a6`.

Le lecteur compatible a été livré avant la Function. La collecte détaillée est
qualifiée à partir de cette livraison ; aucun réamorçage de l’historique ancien.

## Vérifications

- Node 22.23.2 : 19 tests analytics + 4 tests deployment-cache réussis.
- Émulateur `demo-secondevie-analytics` : 7 scénarios réussis, dont concurrence,
  rejeu, reprise et autorisations. Build local Next réussi, 55 pages générées.
- Lint ciblé sans erreur (deux avertissements préexistants), diff sans erreur.
- HTTP 200 sur `/`, `/admin`, `/api/catalog/version` ; ISR 300 s et admin
  `private, no-store` conservés. Galerie → armoire art déco → galerie vérifié
  dans le navigateur après déploiement.
- Sonde sandbox `p4-realtime-probe-1789047473777` : trois sessions ajoutées,
  **214 → 217 → 214** ; trois rejeux `noop`, retrait exact, puis trois
  rejeux `tombstone`. Révisions analytics **286 → 289 → 292**.
  Les trois sources et exclusions temporaires sont retirées ; les trois
  tombstones de preuve restent conservés. Aucune donnée commerciale modifiée.
- Projections cloud relues avec le validateur du nouveau lecteur :
  **60 / 24 / 28 / 30 / 36** créneaux sur 1 h / 1 j / 7 j / 1 mois / 1 an.
  Les KPI historiques restent à 214 sessions sur l’année et « Tout ».
- Commerce relu : révision 77, `v2_all`, admin `v2`, offline `off`.

## Limites et retour arrière

Pas de session admin AAL2 disponible dans le navigateur : le rendu visuel du
graphique connecté n’est pas qualifié. L’ancien détail horaire ou par tiers
de mois absent n’est pas reconstruit ; l’interface signale sa couverture partielle.
La sonde prouve le flux événementiel et le retrait, pas un p95 ni un coût Billing.

Retour arrière Hosting identifié avant livraison : `build-2026-09-10-001`.
Source précédente de la Function `00013-rox` téléchargée et digestée avant
mutation. Le lecteur précédent refuse les nouveaux champs : ne pas revenir
isolément à l’ancien Hosting. Garder le lecteur compatible pendant un retour
à l’ancienne source Function ; toute restauration des projections exige un
contrôle explicite pour préserver les contributions reçues depuis la livraison.
Aucun rollback réel exercé sur ce lot.

Preuves privées expurgées en sortie console :
`logs/analytics-bars-20260910/verified.json`, manifeste/source/rollback dans le
même dossier et sonde dans `output/analytics-realtime/` (hors Git).
Les modifications documentaires concurrentes hors de ce périmètre ont été
préservées. Aucun déplacement ni suppression de fichier projet.
