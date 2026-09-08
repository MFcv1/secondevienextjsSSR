# Livraison sandbox — interactions des 7 et 8 septembre 2026

**État au 8 septembre : LIVRÉ ET PRÊT POUR LA RECETTE UTILISATEUR, avec les réserves explicites ci-dessous.**

Le frontend sert `build-20260908-6188058` à 100 %, deployment ID `sv-mtsl55c9-5fafadb9b720`, depuis le commit immuable `6188058a112fcf691308956043c663c536045916`. Les 116 Functions nommées sont actives, les règles Firestore relues correspondent au fichier versionné (ruleset `bea0db5f-4f97-45b6-a306-6e8e60391ead`) et les 22 index sont `READY`. Les 42 Functions exclues sont inchangées. Aucun index, override de champ ni règle Storage n'a été supprimé ou remplacé hors périmètre.

Le [manifeste exécutable](../../../deploy/interactions-20260908.json) nomme les cibles, chacune mise à jour séparément par le validateur existant. Le [constat final](livraison-2026-09-08.json) conserve leurs révisions réellement servies, y compris le correctif de transport du déclencheur des mails. L'archive Functions a pour SHA-256 `d1f57ece8ef8becbbe83903e46165729f757889408bfcb5a3e93d625db2c740f` ; les sources cloud téléchargées ont été comparées. Les 116 archives de rollback sont vérifiées. Les journaux bruts restent privés dans `logs/livraison/2026-09-08-reprise/`, ignoré par Git.

## Version et périmètre

- Cible exclusive : [sandbox Seconde Vie](https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/), projet `secondevienextjsssr`, backend `secondevie-next-sandbox`, région `europe-west4`.
- Branche préparée : `codex/livraison-interactions-20260907` ; commit applicatif `6326dab`.
- Version servie, relue le 8 septembre à 12:47 UTC : `build-20260908-6188058`, trafic 100 %, deployment ID `sv-mtsl55c9-5fafadb9b720`. Rollout `rollout-20260908-6188058` : `SUCCEEDED`.
- Base de comparaison Git : `10c6b1b8b402a6011045b37b683acf185c1e06b8` ; aucun merge vers `main`.
- [Audit conservé](../2026-09-07-audit-interactions/README.md), [inventaire de préparation](manifest.json), [preuves de qualification](qualification.json), [fiche de recette utilisateur](RECETTE_UTILISATEUR.md).

Le commit applicatif comprend **230 fichiers examinés : 167 modifiés, 63 ajoutés, aucune suppression**. L'inventaire distingue les 109 fichiers de la seconde passe, 16 fichiers de la première passe sans nouveau changement lors de la seconde, 28 prérequis déjà présents dans la photographie auditée, 68 fichiers de tests et neuf supports de livraison. Ces nombres ne s'additionnent pas aux 448 fichiers relus pour former un nouvel audit : aucune relecture intégrale n'a été recommencée.

Les prérequis comprennent la reconstruction du paiement, le lecteur client isolé, le catalogue et les caches admin déjà livrés antérieurement mais absents de HEAD. Les omettre aurait perdu des dépendances de la version auditée. Le manifeste conserve leur provenance séparément. Le patch de `scripts/deploy-functions-targeted.mjs` conserve la signature CloudEvent de la réservation, déjà nécessaire à sa livraison précédente.

Les **230 suppressions préexistantes sous `.agents/skills/`** et le rangement des archives restent hors du commit. Les changements documentaires étrangers à cette préparation sont conservés dans le worktree. Aucun média Storage n'a été supprimé. L'ancien writer de commande et le panneau analytics sans appelant ont été retirés à l'intérieur de leurs fichiers pendant l'audit ; leurs refus/consommateurs ont été couverts par la qualification.

Le travail local « Avant / après » du 8 septembre est également préservé et exclu du paquet livré. App Hosting a été construit depuis un worktree détaché sur le commit exact, pas depuis les fichiers locaux en cours d'édition.

Commits de la branche : `6326dab` sources qualifiées ; `8d65c1b` et `fe7b168` preuves initiales ; `66b36ef` compatibilité Firebase CLI ; `261a8d5` manifeste/outillage ; `6188058` source immuable ; `7d1ff39`, `568be4f`, `b8d8d82` provenance et sauvegardes ; `eb973d5` signature CloudEvent du déclencheur des mails. Les commits suivants de compte rendu ne changent pas la source applicative servie. Aucun merge vers `main`.

## Contrôles et corrections effectués

Environnement : Node `22.23.2`, pnpm `11.7.0`, Next `16.3.0`, React `19.2.7`, Java 21. Le Node global était différent ; les validations utilisent explicitement Node 22. Installation pnpm avec lockfile figé et installation Functions `npm ci` effectuées.

| Contrôle | Résultat |
| --- | --- |
| Sélection reproductible de l'audit | 591 réussis, aucun échec ni test ignoré ; relancée après les corrections |
| Lint application / Functions | Zéro erreur ; 121 avertissements application conservés ; Functions strict sans avertissement |
| Suite commerce complète | Réussie : runner, confinement, domaine, interface, navigateur, propriétés, fautes et émulateurs |
| Émulateurs commerce | Confinement 17 scénarios ; transactions 20 ; résilience 6 ; rules v2 6, dont le registre admin protégé |
| Catalogue | Core/résilience réussis ; security et Firestore/Storage/devis : 14 tests émulateurs réussis |
| Analytics temps réel | Contrats et émulateur réussis |
| Auth, Functions Gen2, devis, newsletter, factures, onboarding, cache/admin, Meta, observabilité, rétention | Suites locales réussies ; aucune preuve OAuth/Stripe hébergée déduite |
| Reconstruction paiement | Scénarios Playwright desktop/mobile réussis avec fournisseurs simulés et réseau externe bloqué |
| Build normal sandbox | Réussi, sans fixture catalogue ; build final et ID local dans `qualification.json` |
| Surface SEO, origine compilée, classification des routes, contrat mobile, App Check, cache de déploiement et audits infra locaux | Réussis |
| Recherche de secrets dans le bundle | Réussie |
| Audit dépendances Functions au seuil modéré | Réussi ; un avis de sévérité faible SimpleWebAuthn reste déclaré |
| Gate globale `security:audit` | Échec initial conservé ; **réussie le 8 septembre après adaptation de Firebase CLI à `stream-json` 3.6.0** |
| Git / liens documentaires | `git diff --check` et liens locaux vérifiés |

Les échecs initiaux n'ont pas été supprimés des preuves locales. Corrections de qualification :

1. Deux variables de test nommées `module` renommées, et une expression régulière normalisée : les assertions métier sont conservées.
2. Les contrats de navigation/onboarding et de dashboard suivent désormais les groupes actuels et la projection partagée validée, au lieu de rechercher l'ancien texte.
3. Le nouveau scénario `admin-invitations-are-backend-only` a été ajouté au manifeste du runner ; il s'exécute réellement et confirme le refus d'écriture du registre.
4. Le test Storage de devis vérifie le chemin effectivement persisté, compatible avec les noms uniques qui évitent les collisions.
5. La fixture d'échec outbox est datée après les événements de commande pour appartenir à la fenêtre des 100 événements les plus récents ; le contrôle de troncature et du compteur reste actif.
6. `fast-uri` passe de 3.1.5 à 3.1.6 et `qs` de 6.15.3 à 6.16.0, avec lockfiles racine et Functions mis à jour. Aucun autre paquet applicatif n'a été mis à niveau.

## Blocage initial et résolution

La [gate de qualité](../../quality/QUALITE_TESTS.md) et `.github/workflows/quality.yml` exigent `pnpm audit --audit-level=moderate`, y compris les dépendances de développement. Au checkpoint initial du 7 septembre, la gate échouait sur [GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x), concernant les filtres de `stream-json` et leur coût excessif sur un JSON profondément imbriqué.

`firebase-tools` 15.26.0 dépend de `stream-json ^1.7.3` ; le registre npm annonce encore la même dépendance pour 15.29.0. Le correctif publié de `stream-json` est 3.5.0. Une substitution locale a été vérifiée puis retirée : les quatre chemins `filters/Pick`, `filters/Filter`, `streamers/StreamArray`, `streamers/StreamObject` utilisés par la CLI deviennent introuvables. Garder cet override aurait rendu vert l'audit de dépendances en cassant des commandes Firebase. Il n'est pas dans les commits.

La dépendance concernée appartient à l'outillage CLI, pas au bundle public. Cela ne suffisait pas à rendre la gate verte. Aucun avis n'a été ignoré, aucun seuil modifié, aucune protection désactivée. Le propriétaire a choisi la correction compatible de la CLI, réalisée ci-dessous sans exception.

### Reprise du 8 septembre 2026

Après demande explicite de correction de l'outillage, un [patch versionné de Firebase CLI](../../../patches/README.md) adapte ses trois usages de `stream-json` aux flux Node de la version 3.6.0 corrigée. La gate `security:audit` complète passe : zéro vulnérabilité racine connue, seul l'avis faible Functions précédemment déclaré demeure, sous le seuil inchangé. Six tests de compatibilité passent, dont les lots Auth, le filtrage Database, l'analyse Next et le refus des imbrications excessives avant envoi. Les sept tests de l'émulateur temps réel passent avec la CLI corrigée. L'installation frozen, le lint du test, les commandes d'aide Auth/Database/deploy et la lecture réelle du backend App Hosting sandbox passent. Preuves locales : `logs/livraison/2026-09-08-reprise/`. Aucun déploiement n'est déduit de ces contrôles.

Checkpoint antérieur à cette correction : le push des commits `6326dab` (sources) et `8d65c1b` (documentation) sur `codex/livraison-interactions-20260907` avait été confirmé. L'audit des dépendances échouait encore sur l'unique avis modéré `GHSA-528h-pc64-c93x`. La CLI publiée 15.29.0 dépendait toujours de `stream-json ^1.7.3`. Les exports ESM de `stream-json` 3.6.0 rendaient les quatre anciens imports introuvables : une substitution seule était insuffisante, d'où l'adaptation des consommateurs et ses tests.

La sandbox avait été relue le 8 septembre à 10:38 UTC : HTTP 200, cache public 300 s et deployment ID `sv-mtp4ho36-474b1fdfaa07`. Aucun composant n'avait encore été déployé à ce checkpoint. Les résultats historiques expurgés sont conservés dans [reprise-2026-09-08.json](reprise-2026-09-08.json), et les sorties brutes dans `logs/livraison/2026-09-08-reprise/` et `logs/livraison/2026-09-07-interactions/dependency-audit-resume.json`. Le statut actuel figure en tête de ce compte rendu.

## Préflight cloud et ordre de livraison exécuté

Les lectures ont été faites avec le projet explicite : le projet Google CLI par défaut était différent et n'a pas été modifié. Le contrôle commerce relu est toujours révision 77, `v2_all/v2`, offline `off`, policy `sandbox_transactional_policy_20260802`. La version de secret Stripe utilisée par les cibles a été vérifiée en mémoire comme **test**, sans enregistrer ni afficher sa valeur.

Les 158 Functions présentes ont été inventoriées en lecture seule. Le plan d'impact donne **116 cibles nommées** à partir des modules modifiés et de leurs imports transitifs, après résolution individuelle des wrappers G8/G9 ; 42 restent hors de ce plan. L'autorisation utilisateur couvre la sandbox ; le validateur applique une cible par opération. `manifest.json` reste l'inventaire historique de préparation ; `livraison-2026-09-08.json` porte le constat final.

Ordre retenu lors de la préparation, exécuté après levée de la gate et préflight frais :

1. Capturer les révisions, configurations, sources et trafic avant mutation ; télécharger et vérifier 116 archives de retour arrière. Leurs empreintes sont liées au manifeste versionné.
2. Livrer les règles Firestore, puis ajouter les deux index `orders(userId ASC, updatedAt DESC)` et `business_events(aggregateId ASC, occurredAt DESC)` ; les 22 index sont ensuite `READY`. Les trois overrides de champ existants sont préservés.
3. Livrer 115 Gen2 une par une, avec comparaison des sources et configurations ; capacité, IAM, secrets, queues, horaires et protections conservés. Les 42 Functions exclues ont été relues et sont inchangées.
4. Livrer `grantAdminOnAuth` Gen1 en `us-central1`, version 28 → 29. Les aliases webhook existants `stripeWebhookV2` / `stripeConnectWebhookV2` sont conservés dans le paquet, derrière le garde des lecteurs légers. Les 116 points d'entrée et trois lecteurs isolés ont été vérifiés.
5. Construire et livrer App Hosting depuis `6188058`, vérifier le trafic et les réponses HTTP. Archive frontend SHA-256 `773567c6d9b4732c9c0332c1dfae5c1db6b39426f1a64301a1764645e76d2a11`, génération Storage `1788866656110326`. `/` est public avec cache 300 s ; `/admin` est privé/no-store ; le pointeur catalogue est relu frais.
6. Après recette, corriger seulement `FUNCTION_SIGNATURE_TYPE=cloudevent` sur `onCommerceOutboxWrittenGen2`, révision `oncommerceoutboxwrittengen2-00004-kuj`. Le ZIP cloud régénéré garde exactement le même SHA-256. Aucun autre paramètre ou contrôle d'accès n'est modifié.

Retour arrière préparé, **non exécuté** : l'ancien build `build-2026-09-06-002` reste `READY` et la création d'un rollout vers celui-ci a passé `validateOnly`. Pour les Functions, le lanceur `scripts/deploy-interactions-source.mjs rollback NOM` contrôle la révision courante et utilise la source capturée ; `status-rollback NOM` relit l'opération. Ne jamais lancer un ensemble global. La dernière configuration outbox est conservée séparément : un retour du code ne doit pas supprimer par accident la signature CloudEvent. Les règles précédentes sont sauvegardées, mais aucun retour à une règle permissive ni suppression des index ajoutés n'est automatique. Conserver commandes, faits financiers, échéances et mouvements ; le remboursement n'est pas un retour arrière de base de données.

## Recette navigateur et incidents résolus

La version compilée locale a été parcourue dans Chrome : galerie, menu, fiche, ajout panier, récapitulatif du panier, accès favoris vide, catégorie Armoires et filtre `En stock` (4 → 1), recherche `armoire` (4 résultats), ouverture/fermeture du dialogue de connexion. La ligne de panier visiteur créée pour cet essai a été retirée ; le serveur et les onglets temporaires ont été fermés.

Le checkout local affiche « Vérification nécessaire » : l'origine locale reçoit `auth/firebase-app-check-token-is-invalid`. Aucun contournement n'a été ajouté. Les tests des composants paiement simulés passent, mais Auth réelle et achat ne sont pas qualifiés sur cette origine.

Sur la **nouvelle version hébergée**, galerie, recherche « armoire » (4 résultats), fiche, panier et retrait de ligne sont vérifiés. Favori ajouté, conservé après actualisation, puis retiré ; les quatre favoris préexistants sont préservés. La déconnexion purge les données affichées. Le client dédié reste non administrateur. Les connexions Google client puis administrateur ont été effectuées avec intervention humaine pour l'authentification sur l'appareil ; aucun secret n'a été demandé dans le chat. L'admin a ouvert Stats, Ventes, Retours, Devis, Factures et Data avec une session forte valide.

Une seule commande a été créée : **C145**, `ord_ff71557b-7014-4de6-9a07-7b8b41b7adae`, run `run_v2all_20260908_interactions`, article dédié `product-b56acc05-9e5f-458d-a2f5-93ca14d06623`, 2 €, retrait gratuit. Paiement Stripe test avec challenge 3DS réussi ; confirmation après `paid` durable et panier vidé. Demande de retour client, puis remboursement admin de 2 € confirmé une seule fois. Stripe relu : `livemode=false`, 200 centimes capturés, un remboursement réussi de 200 centimes ; net nul. Côté client : « Remboursée », demande terminée, reçu et confirmation de remboursement disponibles. Aucun restock automatique, aucune commande étrangère modifiée. Ne pas rejouer de paiement ou remboursement sur C145.

**Mails :** le déclencheur Firestore répondait 204 sans programmer de tâche car sa signature CloudEvent manquait dans l'environnement réel. Test de régression rouge avant correction, puis 11 tests ciblés et 22 gates G0 verts, lint ciblé sans erreur. Après correction, les quatre messages déjà envoyés par la reprise horaire n'ont pas été rejoués ; les deux remboursements encore jamais tentés ont été programmés séparément avec leurs identifiants de tâche idempotents. Une nouvelle copie de la confirmation C145 a ensuite prouvé le chemin automatique : événement à 12:45:44 UTC, tâche programmée à 12:45:45, envoi à 12:45:48, reçu dans Gmail. Au total sept entrées envoyées, chacune avec une seule tentative. Les trois notifications admin sont reçues dans la boîte `loa.gto15@gmail.com` ; les quatre mails client sont reçus par `pvml7008@gmail.com`. Les deux copies de document sont en réception, paiement et remboursement client en spam. Les corps des mails client confirment référence, montant et lien sandbox corrects.

**Catalogue :** deux lignes ERROR correspondaient à une seule vérification HTML trop précoce après le paiement (`CATALOG_SERVED_ROUTE_STALE`, réponse 500). Le snapshot et les pages publiques servaient ensuite tous la révision 342. Une reprise bornée du plan d'impact existant, limité à l'article C145, a validé les pages sans changer les données : `published/revalidated/served=342`, `servedState=observed`, échecs remis à zéro par le workflow normal, `lastError=null` à 12:50:38 UTC. Les erreurs historiques restent dans les preuves ; une absence de log ERROR n'avait pas suffi à détecter le problème des mails.

## Réserves pour la recette utilisateur

- Délivrabilité : deux mails client arrivent en spam. Aucun changement DNS/Resend/production n'a été engagé ; vérifier aussi Indésirables pendant la recette.
- Les deux documents sont générés et leurs copies reçues. Le navigateur d'automatisation a refusé l'inspection de l'URL `blob:` du PDF : contrôle visuel manuel encore ouvert, sans contournement par une autre surface.
- La recette hébergée n'a pas exercé une deuxième commande avec abandon/reprise, deux profils simultanés ni un téléphone réel. Les tests locaux desktop/mobile du checkout restent distincts de cette preuve hébergée. L'édition/publication d'un contenu admin n'a pas été ajoutée à cette campagne.
- Le rollback est préparé et ses sources vérifiées, mais aucun retour arrière réel n'a été provoqué sur la sandbox.

Aucun script `DO_NOT_RUN`, `commerce:e2e:gate7b`, scan Codex Security, sous-agent, merge main ou déploiement production n'a été utilisé. La [fiche courte](RECETTE_UTILISATEUR.md) indique quoi faire, le résultat attendu et les informations utiles en cas d'échec.

Les logs complets et les observations privées restent sous `logs/livraison/2026-09-07-interactions/` (ignoré par Git). `qualification.json` conserve les résultats et empreintes expurgés ; le dossier audit initial reste une photographie historique.

Le patch historique est conservé octet pour octet avec son empreinte initiale. Un attribut Git limité à cet artefact le traite comme pièce jointe : les lignes de contexte vides d'un patch contiennent une espace syntaxique et ne doivent pas être « corrigées » comme du code. Les contrôles de whitespace restent actifs sur les sources et les documents de livraison.
