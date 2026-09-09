# Coûts du projet — données Google uniquement

Correction du 9 septembre 2026 à la demande utilisateur : seuls les mois
réellement reçus de Google sont affichés. Aucun calendrier de 36 mois prérempli,
aucun import manuel, aucune donnée de démonstration ni estimation de remplacement.
L'aperçu fictif et son script ont été supprimés. Les anciennes captures ne
représentent plus la page actuelle.

## État réel du raccordement

Raccordement autorisé le 9 septembre 2026 (« vas-y, on part là-dessus, intègre
ça »). API Billing Budgets activée, budget filtré sur le seul projet créé et
collecteur `captureProjectCostsGen2` ACTIVE en europe-west1, min 0/max 1,
0,167 CPU/256 Mio. Build Functions `71f5ab66-5b80-4bc9-80d6-23bc4691754c`.
App Hosting : rollout `build-2026-09-09-007` SUCCEEDED à 20:38 UTC, build
`f72bb3e4-baab-418e-aa05-f90d60f6f475` SUCCESS avec catalogue réel. Révision
007, trafic 100 %, tag `t-3005039258`, variable PROJECT_COSTS_CONNECTED=true.
Aucun relevé de coûts Google reçu au contrôle après livraison ; le document
est absent, pas égal à zéro.
Le montant historique 0,57 € n'est pas injecté comme dépense actuelle.

## Contrat

Onglet Administration → Coûts du projet, chargé au clic. GET admin protégé par
App Check, Auth/révocation, claim, registre actif et AAL2. Deux documents maximum :
`sys_project_costs/current` et l'agrégat `admin_analytics_realtime/history`.
Le lecteur n'expose que les enregistrements `google_budget` valides en EUR,
triés par mois. Pas de mois ajouté avant ou entre les relevés. Sans données,
aucun graphique ni montant de substitution. Export uniquement des lignes reçues.

Moyenne et comparaison sur mois couverts ; aucune variation mensuelle calculée
sur deux mois non consécutifs. Ratios et corrélation exigent une couverture réelle
compatible, Pearson au moins six mois et des séries non constantes. Une corrélation
n'est pas une causalité ; le trafic mesuré dépend du consentement et ses dates
Europe/Paris peuvent différer de la facturation. Les coûts restent provisoires.

Le collecteur Pub/Sub vérifie compte Billing, budget exact, schéma, devise et
horodatage. Transactions idempotentes ; correction récente à la baisse acceptée.
Un document borné conserve au plus 36 mois de données réellement reçues : c'est
une limite technique de stockage, pas un historique affiché ni créé. Purge à la
mise à jour et TTL de sécurité après 1 140 jours sans mise à jour. Rules deny-all
pour les clients ; indexation désactivée, TTL sur expiresAt.

[Raccordement cloud préparé](../../deploy/project-costs-candidate.json) : API
Budgets, flux filtré au seul projet, collecteur min 0 et droits dédiés, publication
sandbox. Aucun email ni coupure de facturation. Budget créé :
`85a74a6a-6e91-4ab6-8c35-79f34159092f`, compte `010EDA-57C968-C0B9E7`,
projet `231220287936`, crédits inclus, EUR. Le montant technique de 20 € ne
constitue ni achat, ni plafond. L'ancien budget « Limite 10 Euros » est conservé.
Google a accordé automatiquement le rôle publisher sur le seul topic à
`billing-budget-alert@system.gserviceaccount.com`. Le compte dédié du collecteur
a datastore.user et eventarc.eventReceiver au projet, run.invoker sur le seul
collecteur ; le builder peut utiliser ce compte. Aucun invoker public ajouté.

Rules compilées puis publiées : `ac5768f7-9e13-4dc6-b15b-2014e6ada4f4` ;
la version cloud précédente correspondait exactement au HEAD local.
Indexation désactivée sur la seule collection ; TTL expiresAt ACTIVE.
La CLI Rules échouait sans quota project : publication via l'API officielle avec
quota project explicite, sans changement de droits pour résoudre cette erreur.

Validation : tests ciblés de source, absence de remplissage, zéros/crédits,
rejeu/désordre/corrections et Pearson ; ESLint ciblé et git diff --check.
Six tests passent et ESLint ciblé passe. Pas de recette navigateur authentifiée,
ni de notification financière synthétique envoyée. La première réception réelle
reste à constater. API gratuite ; traitement et stockage facturés selon usage et
quotas disponibles, coût marginal non encore mesuré. Les anciennes factures ne
sont pas récupérées par ce flux.

Contrôles hébergés : /admin et /api/catalog/version 200 ; API coûts sans
identité 401, private/no-store. Aucun refus App Check/Auth contourné. Le build
App Hosting remet le maximum du service à 20 malgré le maximum de révision 3 :
maximum du service réappliqué à 3 après rollout, minimum de service 1, révision
min 0, 1 CPU/512 Mio. Aucun maintien permanent ajouté pour le collecteur.

Rollback : restaurer le rollout App Hosting précédent (révision
`secondevie-next-sandbox-public-shared-ip3`, rollout 006), déconnecter uniquement
le nouveau budget/topic, conserver les relevés déjà reçus. Ne pas toucher à la
facturation ni au budget d'alerte existant.
