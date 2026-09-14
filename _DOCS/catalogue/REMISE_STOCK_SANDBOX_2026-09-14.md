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
