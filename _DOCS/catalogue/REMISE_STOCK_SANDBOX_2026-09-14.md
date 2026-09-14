# Remise en stock sandbox — livraison du 14 septembre 2026

Contrôle final : 12:01 UTC. Projet `secondevienextjsssr`, backend
`secondevie-next-sandbox`, aucune cible production.
Commit local `de692d1d20382212c335fef4bad83b68633ac8be`, branche
`codex/remise-stock-sandbox`, sans push. Déploiement et commit local explicitement
autorisés par l'utilisateur.

## Comportement livré

Dans Publications, une fiche publiée à stock zéro propose la remise à une unité
pour les essais. Le serveur bloque toute réservation encore détenue, y compris
échue, et exige une vente unitaire V2 prouvée avec compte Connect test. Un
remboursement, un retour déjà engagé ou une preuve insuffisante entraîne un refus
explicite. Les commandes et paiements sont conservés ; un crédit sur la
réservation empêche le retour ultérieur de recréditer deux fois l'unité test.
[Contrat détaillé](ANNONCES_CATALOGUE.md#61-remise-en-stock-rapide-pour-les-tests-sandbox).

## Déploiement vérifié

Les lecteurs du crédit ont été livrés et vérifiés avant son producteur, puis
l'interface. Pour chaque Function, le code du correctif a été comparé aux octets
de l'archive source réellement déployée.

| Cible | Révision active |
| --- | --- |
| `restockReturnLinesAdminGen2` | `restockreturnlinesadmingen2-00004-los` |
| `writeOffReturnLinesAdminGen2` | `writeoffreturnlinesadmingen2-00004-bim` |
| `adjustInventoryAdminGen2` | `adjustinventoryadmingen2-00002-tuq` |

Les trois cibles sont `ACTIVE`, Node 22, en `europe-west1`. Seules ces trois
Functions ont été déployées via le wrapper et le
[manifeste ciblé](../../deploy/sandbox-stock-20260914.json).
Firebase CLI a retourné un code 1 après chaque succès à cause de l'absence de
politique de nettoyage Artifact Registry en `europe-west4` : ce message annexe
ne remet pas en cause les révisions actives vérifiées. Aucune politique de
suppression automatique n'a été ajoutée.

Hosting `build-2026-09-14-012` est `READY`, son rollout `SUCCEEDED`, avec 100 % du
trafic. Identifiant servi sur `/` et `/admin` : `sv-mu16tkaq-6556d88cf290`.
Le build cloud `6c375400-03b1-4eaf-8a74-b885e2bbc4ab` a réussi en `europe-west4`.

La source Hosting part de l'archive de `011` et applique les fichiers du
correctif, sans remplacer les cinq fichiers galerie par leurs variantes locales
plus récentes. Quatorze fichiers ont été comparés à l'archive uploadée, dont ces
cinq fichiers préservés. Les fichiers `.env` réels sont exclus de l'archive.
Archive :
`gs://firebaseapphosting-sources-231220287936-europe-west4/secondevie-next-sandbox--37762-1iFAQREd27p9-.zip`.
SHA-256 : `66d1895299f2673fc9b85905f5001f8ff533658568fba504f40840430976d3d1`.

## Validations et limites

- 102 tests réussis sous Node 22 via `test:commerce:sandbox-stock` : réservations,
  rejeux, échec de commit, nouvelle vente, retour et write-off avec crédit,
  parcours retour ordinaire et régressions commerce.
- Builds Node 22 réussis, dont le build de la source Hosting isolée ; build
  cloud réussi. Lint ciblé sans erreur, un avertissement `<img>` préexistant.
- Contrôle commerce relu avant déploiement : révision 77, `v2_all/v2`, offline
  off. Compte Connect actif explicitement `livemode: false`.
- `/`, `/admin` et `/api/catalog/version` répondent HTTP 200 après activation.
- Les trois callables refusent un POST sans Auth/App Check avec HTTP 401,
  `UNAUTHENTICATED` ; aucun produit réel n'a été envoyé à ces probes.
- Aucun stock, paiement, commande, remboursement ou retour n'a été muté pour la
  livraison. Pas de navigateur, émulateur ou E2E Stripe lancé. La recette
  authentifiée et la publication après une remise réelle restent à exercer par
  l'utilisateur ; les tests locaux ne prouvent pas la contention hébergée.

## Rollback

Hosting : revenir au build `build-2026-09-14-011`. Anciennes sources Functions
sauvegardées localement avec leurs générations avant mutation, dans
`logs/sandbox-stock-20260914` (hors Git).

| Source précédente | Révision | SHA-256 de l'archive sauvegardée |
| --- | --- | --- |
| Remise physique | `restockreturnlinesadmingen2-00003-cek` | `3c907423e8eda0550f7a2eee0bbd8416a75612280e62a6a3aa113cf866178469` |
| Write-off | `writeoffreturnlinesadmingen2-00003-haf` | `3c907423e8eda0550f7a2eee0bbd8416a75612280e62a6a3aa113cf866178469` |
| Ajustement stock | `adjustinventoryadmingen2-00001-jay` | `81b055b246a0fc88a5bc258c2e6376c7cf05b023d7e6c0a099e7cac2f7132f15` |

Après une première remise sandbox, conserver impérativement les lecteurs du
crédit même si l'interface ou le producteur est retiré. Un ancien lecteur
ignorerait les crédits existants. Ne pas effacer de crédit, commande ou fait
financier pour revenir en arrière. Aucun rollback n'a été exécuté.

Preuves machine locales : `hosting-state.json`, `hosting-source-proof.json`,
`auth-probes.json`, `rollback-digests.json` dans le même dossier de logs.

## Fiabilisation de l'affichage public après recette

La remise réelle testée par l'utilisateur a écrit le stock à 12:43:06 UTC ;
le signal catalogue a été publié à 12:43:26 UTC. Ce délai de publication ne
prouve pas la cause du rafraîchissement manuel sur son téléphone. La lecture
du client a néanmoins identifié des pertes de signal possibles : erreur
terminale d'écoute sans reconnexion, hydratation tardive d'une grille,
props serveur ignorées et confirmation trop courte d'une release exacte.

Le correctif ajoute un signal confirmé rejouable, des reprises bornées, des
requêtes annulables et une comparaison des révisions, exposées aussi par
l'API cartes. Retour visible, focus, `pageshow` et `online` relancent la
convergence. Les grilles appliquent les nouvelles props sans régresser à une
ancienne révision. Aucun changement de stock, réservation, vente ou retour
n'est effectué par cette synchronisation.

Livraison conjointe demandée avec le retrait « Ouverture… » de la tâche
**Supprimer l’indicateur Ouverture**. Cette tâche n'avait pas créé de nouveau
commit : son retrait était déjà livré sur Hosting `013`. La nouvelle source
part de cette archive exacte et conserve ce retrait, sans restaurer les trois
autres fichiers d'optimisation images encore différents de la branche locale.

Validation : build local Node 22 réussi ; huit tests de synchronisation, et
58 tests catalogue réussis sur la branche locale. Sur la source combinée,
57 tests passent ; le contrôle statique images de la branche locale attend
`syncImageLoadPlan`/le préchargement immédiat, absents des fichiers Hosting
préservés. Ce contrôle échoue et a été exclu de la relance ciblée ; il n'est
pas déclaré validé sur Hosting. Lint du correctif et diff-check réussis.
Pas de navigateur/E2E ni de mutation métier. Le test multiappareil reste
la recette utilisateur après rechargement initial pour recevoir le nouveau JS.

Preuves de cette livraison : `logs/catalog-sync-20260914/`, source initiale
`source-before.zip`, archive reçue `source-uploaded.zip`, comparaison
`source-proof.json`, logs de build et de déploiement. Retour arrière Hosting :
`build-2026-09-14-013` ; aucune Function à redéployer.

Hosting `build-2026-09-14-014` est `READY`, rollout `SUCCEEDED`, trafic à 100 %.
Cloud Build `22e194a6-4c46-462d-820f-a4f7c82fc0e5` réussi. Identifiant servi :
`sv-mu19757i-7489dca13999`. Accueil, `/galerie`, `/categorie/buffets` et `/admin`
répondent HTTP 200 ; aucun indicateur « Ouverture… » dans leurs scripts.
Le signal de synchronisation est présent dans les trois surfaces publiques.
Les API version et cartes exposent la même révision 356 et la même empreinte,
avec 35 cartes. Contrôle commerce relu avant livraison : révision 77,
`v2_all/v2`, offline `off`. Aucun commit, push ou déploiement Functions.

Archive reçue :
`gs://firebaseapphosting-sources-231220287936-europe-west4/secondevie-next-sandbox--42334-48OCr3Bt1mWR-.zip`.
Neuf fichiers diffèrent de `013` (dont deux nouveaux) ; tous les autres sont
identiques. Aucun fichier `.env` réel dans cette archive. Preuves finales :
`delivery.json`, `traffic.json`, `builds-build-2026-09-14-014.json` et
`rollouts-build-2026-09-14-014.json` dans le dossier de logs ci-dessus.

### Recette utilisateur confirmée

Le 14 septembre, après livraison de `014`, l'utilisateur confirme que le stock
s'est actualisé automatiquement sur la galerie en environ 20 secondes. Le
badge « Vendu » est devenu « Nouveau », sans rechargement manuel. Ce retour
valide son essai multiappareil ; il ne constitue pas une borne maximale de
latence ni une qualification exhaustive des pannes réseau. Clôture et commit
local demandés, avec rappel du contrat dans `AGENTS.md` ; aucun nouveau
déploiement ni push pour cette clôture.

### Boutons désactivés avant confirmation

Le contrôle préalable lit les mêmes critères de vente que la mutation via
`sandboxInventoryEligibility.js` (extraction sans changement des critères).
L'API admin `POST /api/admin/sandbox-restock-eligibility` exige App Check,
claim admin, registre actif et AAL2 ; elle accepte au plus dix produits par
requête, lit leurs historiques bornés en transactions read-only et ne renvoie
que l'éligibilité, la raison et les versions demandées. Aucune nouvelle
collection, aucun mouvement ni modification de commande.

Les flèches sont grisées et désactivées tant que la vérification n'a pas abouti
positivement. Le survol expose la raison : retour/remboursement, réservation,
vente non prouvée ou vérification indisponible. La liste se revérifie après
changement de version produit, retour visible, focus et reconnexion, sans
polling. Les réponses devenues obsolètes sont ignorées. Un refus métier reçu
à la confirmation désactive aussi la ligne et le bouton de la fenêtre.
Cette lecture n'est pas une réservation : une situation peut changer ensuite,
et le serveur garde son contrôle transactionnel au moment de la mutation.

105 tests commerce réussis sous Node 22, dont contrôle préalable sans écriture,
égalité des refus lecture/mutation sur seize situations, états du bouton,
autorisation et bornage de l'API. Build local réussi, lint sans erreur (un
avertissement image préexistant). Pas de navigateur/E2E ni de mutation réelle.
La fonction de mutation déjà déployée conserve les mêmes règles ; seule la
livraison Hosting est nécessaire. Preuves : `logs/restock-eligibility-20260914/`.

Le premier lancement Hosting a reçu HTTP 409 : le correctif responsive du
checkout était en cours de livraison. Après succès de `016`, une seconde
source isolée reprend son archive exacte et ajoute uniquement les sept
fichiers de ce correctif (dont trois nouveaux). Les changements checkout,
images et synchronisation présents dans `016` sont donc conservés. Build
local de cette combinaison réussi. Retour arrière : `build-2026-09-14-016`.

Livré sur `build-2026-09-14-017` : READY, rollout SUCCEEDED, trafic à 100 %.
Cloud Build `935b3b31-eac0-41ea-97c9-5402ca3497dd` réussi ; identifiant servi
`sv-mu1a3z5k-bfcf20d03dbc`. `/`, `/admin` et `/checkout` répondent HTTP 200,
le chunk admin servi contient le lecteur d'éligibilité et la nouvelle API
refuse un POST anonyme avec 401. Pas de recette authentifiée/navigateur :
l'essai des flèches reste à effectuer par l'utilisateur après rechargement.
Contrôle commerce relu : révision 77, `v2_all/v2`, offline off.

Archive :
`gs://firebaseapphosting-sources-231220287936-europe-west4/secondevie-next-sandbox--48443-Z9UTisxT0DoE-.zip`.
Comparaison intégrale dans `combined-source-proof.json` : sept fichiers changés,
tous les autres identiques à `016`, aucun `.env` réel envoyé. `delivery.json`
et les états build/rollout/traffic consignent les contrôles finaux dans le
dossier de preuves ci-dessus. Aucun commit/push pour cette livraison.
