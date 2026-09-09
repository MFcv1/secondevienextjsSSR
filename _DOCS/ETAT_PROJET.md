# État du projet

Revue documentaire : 2026-09-05. Propriétaire : équipe Seconde Vie.
Source : code du worktree, historique Git et preuves de livraison.
La revue documentaire initiale était sans contrôle cloud. La consolidation
sandbox du 4 septembre a ensuite été vérifiée ; versions, validations et limites
figurent dans [la livraison](operations/EXPLOITATION.md#consolidation-main-et-livraison-performance-du-2026-09-04).

Ce document est la synthèse de reprise. Les contrats restent dans les chapitres ;
les détails de chaque campagne restent dans son suivi. Un statut historique,
une date dépassée ou un fichier local ne suffisent pas à prouver une livraison.

Livraison du 8 septembre sur `codex/livraison-interactions-20260907` :
**sandbox livrée et prête pour la recette utilisateur**, `build-20260908-6188058`,
116 Functions, rules et 22 index READY. C145 : paiement 3DS et remboursement Stripe test
de 2 € vérifiés ; mails reçus, dont deux en spam côté client. PDF à contrôler visuellement.
La gate CLI est corrigée sans dérogation. Les états d'audit ci-dessous sont historiques ;
le design local ultérieur reste hors livraison. Preuves, périmètre et recette dans le
[dossier de livraison](audits/2026-09-07-livraison-interactions/README.md).

## Rapidité passkey — correctif local du 9 septembre

Correctif préparé, **non committé et non déployé** : entrée isolée pour les deux
fonctions de reconnexion, CPU 1, concurrence 8, minimum 1 / maximum 2 instances,
mesures par étape sans identité. Contrat dans [Auth](security/AUTHENTIFICATION.md#capacité-et-mesures-de-la-reconnexion-passkey).
Seconde passe locale : import Firebase général retiré de la modale, préparation
en cours dédoublonnée, callable de vérification prêt avant biométrie, mesures
client des succès/échecs. Lecture préalable du challenge supprimée au profit
de sa transaction de tentative ; reprise de token et contrôles concurrents
conservés. Aucune connexion réelle ni mutation cloud.

Validation Node 22.23.2 : 70 tests ciblés (dont le garde de déploiement) et
80 tests Auth passent (150 tests distincts au total). Les 11 tests passkey de
préparation, performance et transactions/inscription sont ensuite intégrés à
`test:auth` pour la CI : agrégat relancé, 91/91 réussis. `git diff --check` passe.
Chargement
local sur trois processus frais par mode : découverte complète 666–946 ms,
1 743 modules, RSS 155–156 MiB ; entrée options 340–358 ms et vérification
232–271 ms, 746 modules, RSS 85–86 MiB. Cette comparaison de chargement local
n'est ni une latence cloud ni une preuve de l'objectif de 1–2 s sur téléphone.
ESLint ciblé : aucune erreur ; cinq avertissements préexistants dans la modale
et un sur l'argument `name` du script de déploiement empêchent le passage strict.
Pas de build Next, navigateur ni connexion humaine exécutés.

La livraison exige un commit explicitement autorisé, puis une archive immuable
vérifiée et un manifeste ciblé via `scripts/deploy-functions-targeted.mjs`.
Le déploiement source seul doit également appliquer les nouveaux paramètres
de capacité : ne pas annoncer ceux-ci actifs après une simple mise à jour du code.
Les observations cloud avant livraison sont conservées localement dans
`logs/passkey-performance-20260909/` ; relire les révisions avant mutation et
conserver leurs sources de rollback. La seconde passe modifie aussi le client :
elle nécessitera une livraison App Hosting distincte avec les gates associées.

## Avant / après et newsletter — livraison des designs du 8 septembre

Les deux designs retenus sont intégrés : relief ivoire/champagne pour
l’avant/après, ovales « Champagne équilibré » et en-tête euro pour la
newsletter. Anciens décors et préchargement retirés, médias conservés.
Les comportements du comparateur et du jeu serveur restent en place.
Validation : build Next 16.3 sous Node 22, 9 tests newsletter/cache, contrats
mobile/SEO/routes, ESLint ciblé sans erreur (8 avertissements), captures du
site à 390/1440 px sans débordement ni erreur JavaScript.
Livré sur App Hosting sandbox le 8 septembre à 15:57 (Europe/Paris), depuis
le commit `323b031`, branche `codex/design-sections-20260908`.
Build/rollout `build-2026-09-08-001` : `READY` / `SUCCEEDED` ; deployment ID
servi `sv-mtsqcm71-b1c129e1acd3`. HTTP 200, deux décors présents, images
chargées et comparateur clavier fonctionnel ; captures hébergées à 390/1440 px
sans débordement ni erreur JavaScript. Aucun envoi newsletter réel effectué.
Retour arrière identifié : `build-20260908-6188058` (rollout précédent réussi).
Preuves locales : `logs/designs-20260908/`.
Complément du 8 septembre : le galet inférieur droit de l’avant/après est
désormais un ovale couché (−20°), distinct de celui de la newsletter. Livré
depuis `86e9c68`, build/rollout `build-2026-09-08-002` réussi, deployment ID
`sv-mtsv22jg-de1f25aba992`. Build local Node 22 et quatre tests cache validés ;
contrôle hébergé à 390/1440 px : HTTP 200, rayon 50 %, aucune erreur JS ni
débordement. Preuves : `logs/designs-20260908-ovale/`. Retour arrière :
`build-2026-09-08-001`.
Contrats : [Interface](ux/INTERFACE_NAVIGATION.md#section-avant--après).

## Audit des interactions — correctifs locaux du 7 septembre

Après la première passe ciblée, les 442 sources de l'inventaire ont été relues
intégralement, ainsi que six modules ajoutés : **448 fichiers couverts**.
La relecture a modifié/ajouté 109 sources : transactions de retours, OTP et
passkeys, concurrence paiement/publication, reprises email, panier/favoris,
exports et listes bornés, PDF, édition, navigation et cleanup des animations.
Le code analytics a également été lu ; aucune analyse de logs cloud.
Validation locale : **591 tests réussis sous Node 22**, ESLint sans erreur
sur 446 fichiers exécutables, 121 avertissements conservés.
**Aucun déploiement.** Rules et indexes `orders(userId ASC, updatedAt DESC)` et
`business_events(aggregateId ASC, occurredAt DESC)` restent locaux.
Le [rapport détaillé de relecture](audits/RELECTURE_INTEGRALE_INTERACTIONS_2026-09-07.md)
porte l'inventaire individuel, le patch de cette passe, les preuves et les limites.
Il ne certifie ni l'absence de toute faille ni les parcours réellement hébergés.

## Parcours paiement — livré sur sandbox le 6 septembre

Complément UI livré ensuite : App Hosting **`build-2026-09-06-002`**, 100 % du
trafic, deployment ID `sv-mtp4ho36-474b1fdfaa07`. Livraison locale grisée hors
code postal `13xxx` ou avant saisie complète ; sélection devenue invalide retirée
sans choisir le retrait gratuit. Dialogues de reprise/annulation harmonisés avec
l'espace client, boutons hiérarchisés et focus conservé. Validation : 7 tests Node,
8 scénarios navigateur simulés desktop/mobile, lint sans erreur, trois routes
hébergées 200. Functions, tarifs et paiements inchangés. Preuves locales dans
`logs/recette/checkout_ux_20260906/` ; rollback avant ce complément :
`build-2026-09-05-003`. La livraison initiale ci-dessous reste une preuve datée.

Réservation standard 15 minutes, reprise par propriétaire, soumission bancaire et
annulation synchronisées, transport CloudEvent préparé, disponibilité/statuts
client et actualisation admin corrigés localement. Validation : 206 tests Node
ciblés, 20 tests navigateur simulés desktop/mobile, 20 scénarios Firestore demo
(114 assertions) et build fixture réussis. Déploiement ensuite autorisé : hosting
`build-2026-09-05-003`, 100 % du trafic, deployment ID `sv-mtp14jn2-5a4f788bc171` ;
13 Functions ACTIVE, incluant le reader client préexistant ; catalogue 338 publié,
revalidé et servi. Routes 200, accès anonymes refusés, capacités conservées.
Le [suivi de livraison](commerce/RECONSTRUCTION_PARCOURS_PAIEMENT_2026-09-06.md#9-livraison-sandbox-autorisée-le-6-septembre-2026)
décrit les preuves et le rollback. Aucun paiement de recette ; vrais Stripe/3DS et
événement d'expiration non exercés. Les statuts ci-dessous restent historiques.

## Socle et fonctionnalités

| Domaine | État documenté | Référence |
| --- | --- | --- |
| Public | App Router natif, serveur/SSG/ISR 300, galerie canonique `/` | [Architecture](architecture/NEXTJS_SEO.md) |
| Catalogue | `furniture` autoritaire, snapshot Storage unique, publication/revalidation événementielles | [Catalogue](catalogue/ANNONCES_CATALOGUE.md) |
| Auth/admin | OTP, Google et passkeys ; claim + registre + AAL2 ; stabilisation sandbox historique fermée | [Auth](security/AUTHENTIFICATION.md), [sécurité](security/SECURITE_GLOBALE.md) |
| Commerce | `PREPROD_TRANSACTIONAL_READY` ; ouverture durable sandbox `v2_all/v2` décidée le 25 août, dernière révision consignée 77 ; Stripe test, offline off | [Synthèse](commerce/COMMERCE_SYNTHESE.md) |
| Client | Commandes, documents sandbox, suivi/retours, wishlist, profil/adresse et avantages | [Espace client](client/ESPACE_CLIENT.md) |
| Back-office | Publication, commandes/retours, livraison, factures manuelles, devis, newsletter, Stats/Data/Performance/Incidents | [Back-office](admin/BACKOFFICE.md) |
| Galerie | Cartes produit en passe-partout blanc, badge Vendu dérivé du stock, `srcSet` élargi ; livré `build-2026-09-04-003` | [Livraison](operations/EXPLOITATION.md#refonte-des-cartes-galerie-du-2026-09-04), [maquette](../doc/archives/2026-09-04/design/README.md) |
| E-mail | Gmail de recette actif ; Resend préparé, non activé ; délivrabilité finale non acquise | [E-mails](email/EMAILS_TRANSACTIONNELS.md) |
| Meta | Rails Gen2 et rollback documentés ; OAuth historique prouvé, publication sociale réelle à requalifier sur contenu autorisé | [Runbook Meta](admin/INSTAGRAM_OAUTH_RUNBOOK.md) |
| Infra | App Hosting sandbox ; migration Gen2 réalisée avec trois exceptions Auth Gen1 ; clôture d'observation non prouvée | [ADR runtime](architecture/FUNCTIONS_RUNTIME_ADR.md) |
| Devis IA | Collecte/revue métier existantes ; analyse IA non implémentée | [Cadrage IA](ai/ASSISTANT_DEVIS.md) |
| Juridique | Brouillon non publiable sans validation | [CGV/retours](legal/CGV_RETOURS_DRAFT.md) |

## Travaux récents et preuves restantes

**Optimisation backend terminée pour le périmètre de préproduction examiné** :
[verdict, corrections et validations finales](audits/CLOTURE_BACKEND_2026-09-05.md).
Dernier correctif livré : `listMyOrdersV2Gen2` (curseur lu une seule
fois, entrée légère), révision `00002-rab` ACTIVE et 100 % du trafic relu,
contrôle client réussi. Aucun blocage fonctionnel connu dans ce périmètre ; les
gates longues et production ci-dessous restent distinctes.

Stats/Data : retours rapides sans recréation d'écoutes, suspension au masquage
ou après 30 s hors page, catalogue différé et actualisation des tendances.
[Implémentation, tests et livraison](audits/SUIVI_STATS_DATA_2026-09-05.md).

Implémentation locale I0–I6 du 2026-09-05 : affichage/insights, cache autorisé,
brouillons Devis, séquences sessions et projections, lectures/pagination,
imports ciblés et outbox ont reçu des corrections et validations locales.
[Suivi par lot, résultats, migrations et limites](audits/SUIVI_IMPLEMENTATION_BACKOFFICE_2026-09-05.md).
Frontend livré sur `build-2026-09-05-002` avec les correctifs Stats/Data ;
[23 Functions livrées, compteurs initialisés](audits/LIVRAISON_BACKEND_2026-09-05.md).
Les lecteurs Commandes/Retours ont ensuite reçu `eccd278` ; leurs révisions et
la convergence Data sur mutation/reconnexion sont prouvées dans le suivi Stats/Data.
Le complément de champs archive/shard reste exclu ; p95/Billing, multi-admin et
attribution QBO-06 restent des limites distinctes, sans blocage démontré pour
cette clôture. Les paragraphes d'audit suivants décrivent leurs
campagnes historiques et ne sont pas une preuve contre les nouveaux tests métier.

L’[audit backend du 5 septembre](audits/AUDIT_BACKEND_2026-09-05.md) confronte
code, configuration cloud et documentation : 13 constats ouverts, dont cinq
défauts reproduits hors ligne sur les compteurs, sessions/faits analytics et
l’échéance outbox. Les 366 tests existants exécutés sous Node 22 passent ; cela
ne couvre pas ces défauts ni la charge. Le [plan proposé](audits/PLAN_BACKEND_2026-09-05.md)
sépare fiabilité, lecture admin, démarrage/capacité, coût et rétention.
Aucun code applicatif corrigé ni déploiement dans cette campagne ; aucune gate
antérieure fermée. Les statuts de livraison ci-dessous restent des preuves
fonctionnelles datées, pas une certification de toutes les données admin.

| Sujet | Ce que l'on sait | Ce qui n'est pas terminé |
| --- | --- | --- |
| Dashboard/Incidents événementiels | Projections, historique financier, compteur newsletter et badge Retours implémentés ; cutover sandbox consigné | Fenêtres longues, mesures segmentaires/coût et rollback final des gates encore ouvertes |
| Data temps réel P4/P5 | Bootstrap/shadow et lecteur sandbox qualifiés ; rollback App Hosting exercé ; flag dans `apphosting.yaml` | Mesures complètes à froid, p95 utilisateur et coûts/observation P6 |
| Sessions Data | Livré et qualifié le 4 septembre sur build-2026-09-04-001, maintenu dans la consolidation build-2026-09-04-002 ; Function 00009-jen ; dix cartes, pagination par dix, parcours écouté, présence 150 s, suppressions propagées ; preuves dans EXPLOITATION.md | p95 longue durée/Billing et exercice de rollback propre à cette extension non requalifiés |
| Performance Functions | Livré sur build-2026-09-04-002, même commit que main local/GitHub ; API protégée, IAM de lecture minimal et cache privé ; Chrome : 158 fonctions, fenêtres 24 h/7 j/30 j et recherche vérifiées | Pas de mesure Billing, p95 froid ou campagne multi-appareils ; fin du retrait physique des index non recontrôlée |
| CI et clôture locale | Build, lint, tests ciblés/Gen2/Emulator passent ; correction des deux assertions de sécurité obsolètes validée par audit statique et poussée sur `main` le 4 septembre | CI GitHub non verte ; sept avis de dépendances à traiter séparément, aucun seuil d'audit abaissé |
| Recette humaine HRT | HRT-004 badge, HRT-006 fuseau et HRT-008 exclusion marqués fermés sandbox | HRT-001 observation ; HRT-002 course checkout, HRT-003 refund live UI, HRT-005 connexion admin à requalifier ; HRT-007 à mesurer |
| Navigation/Auth | Correctifs vidéo/login des 2 septembre dans Git ; le code local ne force plus une redirection vers admin après connexion publique | La preuve humaine HRT-005 reste distincte du constat de code |
| Maintenance catalogue | Backend de rollback/reconstruction conservé, mais onglet et appelants UI retirés | L'ancienne procédure par bouton n'est plus applicable ; aucun nouveau parcours opérateur n'a été implémenté dans ce rangement |

Les anciens blocs « overview_bundle actif », « admin automatiquement redirigé »
ou « Gen1 conservées » peuvent décrire une étape de migration, pas le comportement
actuel. Les chapitres et la carte ont été corrigés là où ces contradictions
affectaient l'entrée de lecture.

## Suivis encore ouverts

- [Temps réel/coûts/DevOps](infra/TEMPS_REEL_COUTS_DEVOPS.md) :
  P5 partiel, P6 restant ; revue cible 30 septembre.
- [Dashboard/Incidents](admin/OPTIMISATION_DASHBOARD_INCIDENTS.md) :
  `SANDBOX_CUTOVER_EFFECTUE_QUIET_WINDOW_A_FERMER`.
- [Recette humaine](quality/RECETTE_HUMAINE_SANDBOX.md) :
  corrections déployées, requalification partielle ; revue cible 10 septembre.
- [Finalisation Gen2](../apphostingaudit/FINALISATION_MIGRATION_GEN2.md) :
  F5 terminé, F6 non marqué complet dans les preuves. Échéance du 1er septembre
  dépassée ; revalider la fenêtre et la topologie exactes, ne pas annoncer un soak
  courant de sept jours à partir d'une ancienne fenêtre.
- [Reprise commerce](commerce/COMMERCE_REPRISE.md) :
  décisions/recettes restantes ; aucune autorisation de production implicite.
- [Anomalies](../anomalies.md) : registre historique avec points à requalifier ;
  lire le détail et sa dernière preuve, pas seulement sa table ancienne.

Une échéance dépassée est un signal de revue, pas une clôture automatique.
Les plans Meta et sécurité ont été remplacés par leurs références durables et
archivés sans affirmer que toutes les recettes externes ou la production sont closes.

## Ce qui reste volontairement différé

Domaine et DNS, RP ID final/réenrôlement passkeys, Resend/SPF/DKIM/DMARC,
projet Firebase/App Hosting production, Stripe/Connect live, App Check production,
recette finale appareils/Safari/Face ID, mesures et exploitation production,
validation juridique/comptable. Les protections et recettes sandbox déjà
autorisées ont leurs propres conditions ; aucune preuve sandbox ne vaut GO live.

Dette non bloquante : budget CSS/JS public, convergence régionale, pagination
selon volumes, nettoyage de médias après preuve, Cache Components/Partial
Prefetching, gestion des passkeys client et assistant IA devis.

## Maintenir cette synthèse

Mettre à jour seulement lors d'un changement de statut significatif. Indiquer
la date, le périmètre, la preuve et ce qui manque. Garder SHA/release et
métriques détaillés dans la référence d'exploitation concernée, avec leur date.
Ne pas transformer ce fichier en journal de chaque commande.
