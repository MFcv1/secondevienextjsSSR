# Préparation de livraison — interactions du 7 septembre 2026

**Verdict : BLOQUÉ avant déploiement. La version auditée n'est pas encore prête pour la recette utilisateur sur sandbox.**

La préparation, les corrections de qualification et l'enregistrement Git ont été réalisés. La gate obligatoire `security:audit` reste rouge sur une dépendance de la CLI Firebase. Aucune règle, aucun index, aucune Function et aucun frontend n'ont été déployés pendant cette campagne.

## Version et périmètre

- Cible exclusive : [sandbox Seconde Vie](https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/), projet `secondevienextjsssr`, backend `secondevie-next-sandbox`, région `europe-west4`.
- Branche préparée : `codex/livraison-interactions-20260907` ; commit applicatif `6326dab`.
- Version actuellement servie, relue le 7 septembre : `build-2026-09-06-002`, trafic 100 %, deployment ID `sv-mtp4ho36-474b1fdfaa07`. Cette version antérieure ne prouve pas les corrections de l'audit.
- Base de comparaison Git : `10c6b1b8b402a6011045b37b683acf185c1e06b8` ; aucun merge vers `main`.
- [Audit conservé](../2026-09-07-audit-interactions/README.md), [inventaire de préparation](manifest.json), [preuves de qualification](qualification.json), [fiche de recette utilisateur](RECETTE_UTILISATEUR.md).

Le commit applicatif comprend **230 fichiers examinés : 167 modifiés, 63 ajoutés, aucune suppression**. L'inventaire distingue les 109 fichiers de la seconde passe, 16 fichiers de la première passe sans nouveau changement lors de la seconde, 28 prérequis déjà présents dans la photographie auditée, 68 fichiers de tests et neuf supports de livraison. Ces nombres ne s'additionnent pas aux 448 fichiers relus pour former un nouvel audit : aucune relecture intégrale n'a été recommencée.

Les prérequis comprennent la reconstruction du paiement, le lecteur client isolé, le catalogue et les caches admin déjà livrés antérieurement mais absents de HEAD. Les omettre aurait perdu des dépendances de la version auditée. Le manifeste conserve leur provenance séparément. Le patch de `scripts/deploy-functions-targeted.mjs` conserve la signature CloudEvent de la réservation, déjà nécessaire à sa livraison précédente.

Les **230 suppressions préexistantes sous `.agents/skills/`** et le rangement des archives restent hors du commit. Les changements documentaires étrangers à cette préparation sont conservés dans le worktree. Aucun média Storage n'a été supprimé. L'ancien writer de commande et le panneau analytics sans appelant ont été retirés à l'intérieur de leurs fichiers pendant l'audit ; leurs refus/consommateurs ont été couverts par la qualification.

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
| Gate globale `security:audit` | **ÉCHEC : `stream-json` transitif de `firebase-tools`** |
| Git / liens documentaires | `git diff --check` et liens locaux vérifiés |

Les échecs initiaux n'ont pas été supprimés des preuves locales. Corrections de qualification :

1. Deux variables de test nommées `module` renommées, et une expression régulière normalisée : les assertions métier sont conservées.
2. Les contrats de navigation/onboarding et de dashboard suivent désormais les groupes actuels et la projection partagée validée, au lieu de rechercher l'ancien texte.
3. Le nouveau scénario `admin-invitations-are-backend-only` a été ajouté au manifeste du runner ; il s'exécute réellement et confirme le refus d'écriture du registre.
4. Le test Storage de devis vérifie le chemin effectivement persisté, compatible avec les noms uniques qui évitent les collisions.
5. La fixture d'échec outbox est datée après les événements de commande pour appartenir à la fenêtre des 100 événements les plus récents ; le contrôle de troncature et du compteur reste actif.
6. `fast-uri` passe de 3.1.5 à 3.1.6 et `qs` de 6.15.3 à 6.16.0, avec lockfiles racine et Functions mis à jour. Aucun autre paquet applicatif n'a été mis à niveau.

## Blocage concret

La [gate de qualité](../../quality/QUALITE_TESTS.md) et `.github/workflows/quality.yml` exigent `pnpm audit --audit-level=moderate`, y compris les dépendances de développement. La gate échoue encore sur [GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x), concernant les filtres de `stream-json` et leur coût excessif sur un JSON profondément imbriqué.

`firebase-tools` 15.26.0 dépend de `stream-json ^1.7.3` ; le registre npm annonce encore la même dépendance pour 15.29.0. Le correctif publié de `stream-json` est 3.5.0. Une substitution locale a été vérifiée puis retirée : les quatre chemins `filters/Pick`, `filters/Filter`, `streamers/StreamArray`, `streamers/StreamObject` utilisés par la CLI deviennent introuvables. Garder cet override aurait rendu vert l'audit de dépendances en cassant des commandes Firebase. Il n'est pas dans les commits.

La dépendance concernée appartient à l'outillage CLI, pas au bundle public. Cela ne rend pas la gate actuelle verte. Aucun avis n'a été ignoré, aucun seuil modifié, aucune protection désactivée. La reprise du déploiement exige un correctif CLI compatible ou une décision explicite du propriétaire sur cette gate d'outillage ; aucune exception n'est présumée ici.

### Reprise du 8 septembre 2026

Le push des commits `6326dab` (sources) et `8d65c1b` (documentation) sur `codex/livraison-interactions-20260907` a été confirmé. L'audit des dépendances relancé échoue toujours sur un unique avis modéré, `GHSA-528h-pc64-c93x`. La dernière CLI publiée, 15.29.0, dépend encore de `stream-json ^1.7.3`. Le paquet publié `stream-json` 3.6.0 a été inspecté sans modifier l'installation : ses exports ESM dirigent les quatre anciens imports Firebase vers des fichiers absents. Cette nouvelle version ne permet donc pas davantage une substitution compatible.

La sandbox a été relue le 8 septembre à 10:38 UTC : HTTP 200, cache public 300 s et deployment ID toujours `sv-mtp4ho36-474b1fdfaa07`. Aucun composant n'a été déployé lors de cette reprise. Les validations applicatives précédentes restent valables pour le commit inchangé ; la recette hébergée de la nouvelle version reste ouverte. Les résultats expurgés sont conservés dans [reprise-2026-09-08.json](reprise-2026-09-08.json), et les sorties brutes dans `logs/livraison/2026-09-08-reprise/` et `logs/livraison/2026-09-07-interactions/dependency-audit-resume.json`.

## Préflight cloud et ordre de livraison réservé

Les lectures ont été faites avec le projet explicite : le projet Google CLI par défaut était différent et n'a pas été modifié. Le contrôle commerce relu est toujours révision 77, `v2_all/v2`, offline `off`, policy `sandbox_transactional_policy_20260802`. La version de secret Stripe utilisée par les cibles a été vérifiée en mémoire comme **test**, sans enregistrer ni afficher sa valeur.

Les 158 Functions présentes ont été inventoriées en lecture seule. Le plan d'impact donne **116 cibles nommées** à partir des modules modifiés et de leurs imports transitifs, après résolution individuelle des wrappers G8/G9 ; 42 restent hors de ce plan. C'est un impact conservateur au niveau des modules, pas un déploiement global ni un manifeste exécutable autorisant une mutation. La liste complète des ressources, révisions, points d'entrée et sources immuables est dans `manifest.json`.

Ordre à appliquer après levée de la gate, avec un préflight frais :

1. Conserver les révisions/source et le build réellement servis ; télécharger/vérifier les archives nécessaires au rollback avant mutation. Les références ont été capturées ici, mais le rollback multi-Functions n'a pas été exercé ni son packaging final produit.
2. Livrer les règles Firestore et ajouter les deux index `orders(userId ASC, updatedAt DESC)` et `business_events(aggregateId ASC, occurredAt DESC)` ; attendre `READY`. Ils sont absents des 20 index composites relus. Aucun index existant à supprimer, aucune modification des règles Storage ni migration de données à exécuter.
3. Livrer uniquement les cibles retenues du manifeste par le validateur existant. Lots finance/webhook/scheduler unitaires ; aucune cible sous hold ni réactivation legacy. Conserver capacité, IAM, secrets, triggers, queues, horaires et signature CloudEvent.
4. Traiter explicitement `grantAdminOnAuth` Gen1 et les deux webhooks cloud dont les points d'entrée sont `stripeWebhookV2` / `stripeConnectWebhookV2`. Le packaging webhook doit conserver les aliases existants ; copier simplement `functions/index.js` ne suffit pas. Préserver l'entrée légère des lecteurs.
5. Construire/livrer App Hosting depuis le commit exact avec un nouvel ID de déploiement. Comparer chaque révision active et le build servi, puis exécuter la recette hébergée.

Le rollback frontend devra restaurer le build capturé au moment réel de la livraison. Le rollback backend devra viser les mêmes cibles et sources capturées ; conserver les faits de paiement, les échéances et les mouvements. Ne jamais remettre une règle permissive, rétablir du stock à la main, supprimer une commande payée ou annuler une opération financière incertaine.

## Recette navigateur et éléments ouverts

La version compilée locale a été parcourue dans Chrome : galerie, menu, fiche, ajout panier, récapitulatif du panier, accès favoris vide, catégorie Armoires et filtre `En stock` (4 → 1), recherche `armoire` (4 résultats), ouverture/fermeture du dialogue de connexion. La ligne de panier visiteur créée pour cet essai a été retirée ; le serveur et les onglets temporaires ont été fermés.

Le checkout local affiche « Vérification nécessaire » : l'origine locale reçoit `auth/firebase-app-check-token-is-invalid`. Aucun contournement n'a été ajouté. Les tests des composants paiement simulés passent, mais Auth réelle et achat ne sont pas qualifiés sur cette origine.

Sur la sandbox antérieure : galerie visible et réponses HTTP 200 pour `/`, `/admin` et `/api/catalog/version`, même ID public sur `/` et `/admin`, cache public 300 s et admin privé/no-store. Un HTTP 200 sur `/admin` n'est pas une authentification administrateur.

Restent ouverts pour la nouvelle version : connexion avec les deux identités dédiées, favoris synchronisés, reprise panier entre comptes, commande dédiée Stripe test/3DS, remboursement, documents, mails dédiés, administration réelle, publication et comportement après rollout. Aucun paiement, remboursement, envoi de mail ou lecture de boîte n'a été effectué. Aucun script `DO_NOT_RUN`, `commerce:e2e:gate7b`, scan Codex Security ou sous-agent n'a été utilisé. Aucune nouvelle révision sandbox n'est revendiquée.

Les logs complets et les observations privées restent sous `logs/livraison/2026-09-07-interactions/` (ignoré par Git). `qualification.json` conserve les résultats et empreintes expurgés ; le dossier audit initial reste une photographie historique.

Le patch historique est conservé octet pour octet avec son empreinte initiale. Un attribut Git limité à cet artefact le traite comme pièce jointe : les lignes de contexte vides d'un patch contiennent une espace syntaxique et ne doivent pas être « corrigées » comme du code. Les contrôles de whitespace restent actifs sur les sources et les documents de livraison.
