# Graphiques Data — livraison staging du 10 septembre 2026

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
