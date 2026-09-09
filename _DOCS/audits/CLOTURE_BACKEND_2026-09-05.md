# Clôture de l’optimisation backend — préproduction

## Livraison ciblée effectuée — 5 septembre, 20 h 34 Paris

Après nouvel accord utilisateur, `listMyOrdersV2Gen2` est livré en
`europe-west1` sur `secondevienextjsssr` : révision
`listmyordersv2gen2-00002-rab`, ACTIVE, 100 % du trafic relu. Seule la source
a été mise à jour (`updateMask=buildConfig.source`). Comparaison intégrale
de `serviceConfig` hors révision et du trigger : identiques ; contrôle commerce
révision 77, `v2_all/v2`, offline off inchangé. Aucun rollout App Hosting,
commit/push, paiement, remboursement, e-mail ou migration.

Archive construite depuis la source déjà livrée aux lecteurs admin, avec
uniquement les deux fichiers Functions corrigés par rapport à cette baseline.
SHA-256 téléchargé depuis le bucket source final et vérifié :
`d46ec2b9adca60bca90510c3bca47b22e4ecdfd413dc9b5fbf68735f7bd9e7fa`.
Source et configuration de rollback de `listmyordersv2gen2-00001-wug`
sauvegardées dans `logs/recette/livraison_client_20260905/`.
Le contrôle initial de chemin source a été adapté à la copie automatique de
l’upload par Functions : c’est l’égalité des octets SHA-256 qui prouve la source.

Préflight de l’archive isolée sous Node 22 : mêmes metadata que le code testé,
un seul export ciblé et refus anonyme. Les 48 tests de clôture sont réutilisés.
Après livraison : appel anonyme 401 ; connexion Google du client de recette,
24 commandes distinctes, 37 documents et aucun état d’erreur. Appel authentifié
POST 200 corrélé à la nouvelle révision. Il dure 9,764 s côté serveur sur cet
échantillon ; aucun gain cloud, p95 ou comparaison froid/chaud n’en est déduit.
Les 24 commandes tiennent dans une page de 25 : aucun bouton de continuation,
donc pagination hébergée non exercée ; les tests locaux de curseur restent verts.
Pas de nouvelle méthode de connexion activée ni donnée métier modifiée.

[Preuve expurgée de livraison](preuves/backend-client-livraison-2026-09-05.json).
Les logs techniques et archives restent dans le dossier local ignoré ci-dessus.
La livraison du dernier correctif est terminée. Les sections suivantes
conservent le verdict et le périmètre de la passe locale précédente.

## Passe locale avant autorisation de livraison

5 septembre 2026. Passe locale sur `codex/stats-data-performance`, HEAD initial
`10c6b1b`, après vérification de `eccd278` et de sa livraison consignée.
Aucune autorisation historique reprise. Aucun commit, push, déploiement,
changement de capacité, accès métier hébergé, paiement, remboursement ou e-mail.

**Le chantier d’optimisation est terminé pour le périmètre de préproduction examiné.**
La livraison restait à effectuer à la fin de cette passe locale ; elle est
désormais effectuée comme décrit ci-dessus.
Aucun blocage fonctionnel connu non traité dans les chemins examinés.
Ce verdict ne ferme ni les gates de production ni les observations longues
distinctes ; il ne certifie pas une charge multi-admin ou un coût Billing.

## Périmètre et décisions finies

Point de départ : [inventaire daté](preuves/backend-2026-09-05-inventaire.json),
158 Functions (155 Gen2, trois Auth Gen1), `functions/index.js`,
`src/kit/config/functionTargets.js` et `map.md`. Aucun inventaire cloud nouveau
ni audit individuel de chaque Function. Les exports locaux ne sont pas assimilés
aux services actifs. Les changements documentaires et suppressions de skills
préexistants sont préservés ; aucune identité visuelle modifiée.

| Chemin examiné | Constat concret et décision |
| --- | --- |
| Public → snapshot Storage → catalogue/produit/version | Objets immuables cachés, pointeurs frais, lectures cartes/full parallèles et fallback validé. Validation complète répétée connue (BA-10) conservée : elle garantit la santé de la release annoncée, sans délai bloquant démontré sur le petit catalogue. Un cache de validation supplémentaire et un builder incrémental ne sont pas nécessaires à cette clôture. |
| Auth → accès admin → huit lecteurs ciblés | Entrée légère et services lourds différés déjà livrés. Registre/AAL2 et App Check conservés ; aucune mise en cache supplémentaire des droits. |
| Client → `listMyOrdersV2Gen2` | Double lecture du même curseur démontrée dans le code. Réutilisation du snapshot déjà contrôlé pour l’UID ; entrée légère étendue à cette neuvième cible. Aucun élargissement du résultat ni suppression des documents joints. |
| Commandes/Retours admin | Pages ≤ 50, curseurs conservés, détails de remboursement nécessaires aux décisions ; enrichissement unique `getAll` ≤ 150 références par page. Trois lecteurs Retours parallèles, cache commun. Réponse Commandes de l’ordre de 124 Ko déjà observée : le DTO conserve notamment les données du détail inline et des décisions. Pas de suppression de champs métier ni nouvelle lecture de détail imposée. |
| Devis/Factures | Recherche exacte et pagination avec lookahead ; photos signées en parallèle au détail, Sharp/PDF/e-mail différés ; Factures sans produits à l’accueil, sélecteur ≤ 300. Les décorateurs voisins restants ne justifient pas une scission complète. |
| Stats/Data et projecteurs | Écoutes partagées, suspension et purge autorisée déjà corrigées. Relecture source/ledger dans les transactions, filtre de contribution, séquences et générations conservés. Les lectures communes entre projections restent dans leurs transactions respectives : les fusionner changerait les frontières de cohérence, sans contention bloquante démontrée ici. |
| Checkout/reprise → domaine → inbox/outbox | Runtime fournisseur différé, état serveur autoritaire, prise à échéance/lease, tâche obsolète replanifiée et résultat ambigu non rejoué. Les étapes transactionnelles et fournisseur restent ordonnées ; les tests commerce/faults antérieurs sont réutilisés. Aucune nouvelle opération financière exécutée. |

Liste fixée avant modification : double lecture du curseur, imports de ce même
lecteur, cohérence documentaire. Une seule extension après validation : corriger
l’assertion statique obsolète de la gate consumers qui exigeait l’ancien cache
insights. Elle vérifie maintenant la souscription retenue, le document unique
et la purge ; les interdictions de writers et gardes commerce restent intactes.

## Corrections et validation locale

Node **22.23.2** sélectionné explicitement via son PATH ; pnpm déclaré **11.7.0**,
Next installé **16.3.0**, cible Functions Node **22**. Guide Next installé
`01-app/02-guides/lazy-loading.md` lu avant code. Aucun opt-in Next ajouté.

- `v2OrderQueries.js` : le curseur client contrôlé est transmis au helper de
  pagination ; première page sans lecture de curseur, page suivante une lecture
  au lieu de deux. Curseur absent ou appartenant à un autre UID refusé avant
  la requête. Même snapshot utilisé pour autorisation et position de page.
- `readerEntrypoint.js` : `listMyOrdersV2Gen2` appelle sa factory existante via
  le wrapper observé. Métadonnées strictement identiques à la découverte globale,
  y compris région, App Check, timeout et capacité. Cible inconnue : découverte
  globale inchangée ; aucun writer déplacé ou réimplémenté.
- `backend-closeout.test.cjs` : cinq tests nouveaux, dont pages, refus et
  comparaison des entrées dans six processus isolés sous garde réseau.

Commande finale sous Node 22 :

```sh
node --test tests/backend-closeout.test.cjs tests/backoffice-post-qualification.test.cjs tests/commerce/domain/gate5-consumers.test.cjs tests/functions-gen2-g8.test.mjs tests/stats-data-performance.test.mjs
```

**48/48 passent.** Première passe : 44/45, seul échec sur l’ancienne assertion
insights ; passe finale verte après sa correction. ESLint ciblé : zéro erreur
et avertissement. `git diff --check` et liens documentaires vérifiés.
Logs locaux : `logs/recette/cloture_backend_20260905/`.

Mesure nouvelle uniquement pour le lecteur modifié, trois processus frais par
mode, réseau interdit et même Node. Découverte → entrée ciblée : **1 739 → 487
modules** ; médiane imports **555 → 168 ms**, RSS après import environ
**153 → 77 Mio**. Réponse autorisée vide identique, un appel de query dans les
deux modes ; requête anonyme refusée. Ce sont des mesures locales, pas un gain
de cold start cloud, de latence Firestore, de p95 ou de coût facturé.

Les preuves précédentes sont conservées : 49 tests ciblés, sept scénarios demo,
20 passages navigateur, build fixture et lint global dans le
[suivi Stats/Data](SUIVI_STATS_DATA_2026-09-05.md) ; commerce unit/property/faults,
Auth et contrats Functions dans le [suivi I0–I6](SUIVI_IMPLEMENTATION_BACKOFFICE_2026-09-05.md).
Pas de nouveau build, navigateur ou émulateur : aucun frontend, schéma, index,
writer ou requête Firestore modifié ; les nouvelles assertions couvrent la
réutilisation du snapshot et le chargement de la factory.

## Capacité et livraison

Configuration **observée dans l’inventaire daté**, relue localement, pas nouvelle
photographie cloud : `listMyOrdersV2Gen2`, CPU `167m`, mémoire `256Mi`,
concurrence 1, min 0, max 1. Le code déclare `gcf_gen1`, `256MiB`, 1/0/1 et 60 s.
Les lecteurs admin conservent aussi leur capacité ; les preuves de livraison
constatent sa conservation. Pas de preuve d’OOM ni de saturation courante sur
ces parcours. **Aucun ajustement CPU/mémoire/concurrence/instances proposé** :
augmenter la capacité ajouterait du coût sans résoudre une cause démontrée.
La réduction d’imports locale n’est pas un dimensionnement en charge.

Dernier état hébergé **prouvé par les pièces du 5 septembre**, sans relecture
cloud dans cette passe : hosting `build-2026-09-05-002`, lecteurs admin
`listordersadminv2gen2-00005-feg` et
`listcustomerreturnrequestsadminv2gen2-00005-lex`, après les 23 cibles initiales.
Les correctifs de périodes, reconnexion et payloads ne sont donc plus « à livrer ».
La [livraison](LIVRAISON_BACKEND_2026-09-05.md) et le
[suivi récent](SUIVI_STATS_DATA_2026-09-05.md) portent les preuves.

Action exacte à autoriser séparément : livrer **seulement
`listMyOrdersV2Gen2`**, projet `secondevienextjsssr`, région `europe-west1`, depuis
une archive isolée incorporant les deux fichiers Functions modifiés. Préflight :
relire branche/révision/configuration, sauvegarder la source de rollback,
comparer les metadata et ne mettre à jour que la source. Vérifier ensuite la
révision active, refus anonyme et pagination client autorisée. Aucun besoin de
rollout App Hosting, livraison globale Functions, migration, nouveau secret ou
changement de capacité. Commit/push restent des actions distinctes non effectuées.

## Limites classées

**Blocages de clôture : aucun identifié dans le périmètre examiné.**

Limites de preuve et améliorations facultatives : p95/coût Billing, concurrence
de deux identités admin, recette hébergée Factures non vide/Devis avec photos,
attribution du payload historique QBO-06 (pas un bug actuel démontré), volume
maximal de reconstruction transactionnelle, compaction prudente des auxiliaires
et optimisation de la validation catalogue. Les scénarios locaux de brouillons,
photos et facture restent acquis ; le scénario Data hébergé récent démontre un
cas de mutation/reconnexion, sans prétendre couvrir toute la charge.

Les **142 commandes/181 faits**, l’activation archive/shard et les exemptions
d’index restent hors périmètre. La compatibilité paginée fonctionne sans eux ;
aucun blocage démontré ne les impose avant cette livraison. Les gates longues
et production restent dans leurs suivis, sans rouvrir ce chantier d’optimisation.
Aucun déplacement ni suppression de fichier dans cette passe.
