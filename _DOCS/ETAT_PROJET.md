# État du projet

Synchronisation du 9 septembre : ensemble des changements locaux autorisé pour
GitHub et App Hosting sandbox. Comparaison avec l'archive du rollout 007 : seule
modification applicative restante, la géométrie du graphique Data (toutes périodes).
Les deux nouveaux services Functions sont déjà ACTIVE et ne sont pas redéployés.
Contrôles ciblés : 21/21 après actualisation du contrat de navigation pour Coûts.
Publication du graphique en cours ; preuve finale ajoutée après le rollout.

Chantier du 9 septembre : [page Coûts du projet](admin/COUTS_PROJET.md),
mois réellement reçus de Google et comparaison trafic. Aperçu fictif et import
retirés à la demande utilisateur ; raccordement Billing/PubSub autorisé et créé,
collecteur et page déployés (rollout 007 réussi). Premier relevé Google en attente ;
aucun montant inventé. API privée contrôlée, recette admin authentifiée non exécutée.

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

## Consolidation main et livraison UI — 9 septembre

**Runtime public partagé et optimisations back-office activés
sur sandbox** depuis le rollout `build-2026-09-09-006`, puis inclus dans 007
avec la page Coûts, un minimum de service public 1 et
maximum 3, 1 CPU/512 Mio ; lecteur admin partagé à minimum zéro. Connexion réelle,
emails, checkout et performances à qualifier par la recette demandée après livraison.
[Actions, preuves et rollback](audits/2026-09-09-mutualisation/LIVRAISON_SANDBOX.md).
Les paragraphes suivants décrivent les étapes antérieures.

Après clarification du budget, [plan public chaud unique](audits/2026-09-09-mutualisation/PLAN_PUBLIC_CHAUD.md)
actualisé : App Hosting galerie + connexions + opérations publiques interactives,
1 vCPU/512 MiB à qualifier, un seul maintien permanent / max 3 proposé, back-office
min 0 préchargé. [Premier lot passkeys](audits/2026-09-09-mutualisation/INTEGRATION_PASSKEYS.md) :
le 9 septembre à 18:08 UTC, les deux fonctions de connexion sont ACTIVE/min 0,
sans ancienne révision chaude référencée. Aucun App Hosting modifié : phase
transitoire froide. Les quatre handlers passkey directs Next sont locaux,
testés et désactivés par défaut ; ingress/IP, IAM, cérémonie réelle et maintien
public unique restent à qualifier avant bascule. Suite :
[18 opérations publiques et dix lecteurs admin préparés localement](audits/2026-09-09-mutualisation/INTEGRATION_RUNTIME_PUBLIC.md),
avec OTP/checkout, cache catalogue borné et suppression du tirage newsletter anticipé.
Transports désactivés, aucune livraison de cette reprise ; mesures locales sur
fixture, pas qualification cloud 1 CPU/512 Mio ni économie démontrée.

Audit de mutualisation demandé ensuite : [rapport et plan](audits/2026-09-09-mutualisation/README.md).
158 Functions inventoriées, 2 passkeys à min 1 ; App Hosting à min 0.
Sonde galerie : premier accès 6,3 s avec démarrage corrélé, suivant 17 ms via CDN.
Proposition de mutualisation identité/lecteurs et comparaison de un/deux socles
chauds ; aucune mise en œuvre ni modification cloud. Révision App Hosting
observée le 9 septembre à 16 h UTC : `build-2026-09-09-005`, distincte des preuves
de livraison historiques ci-dessous ; correspondance Git non vérifiée par cet audit.

Audit de chargement admin du 9 septembre : [diagnostic et preuves cloud](audits/2026-09-09-chargements-admin/README.md).
Démarrages à froid confirmés aux heures des captures. Entrées lecteurs isolées
Promo/Liens/Livraison corrigées localement, non déployées. À la demande suivante,
maintien permanent à chaud écarté pour son coût : [préchargement progressif](audits/2026-09-09-chargements-admin/PRECHARGEMENT.md)
après Stats, avec préparation Data bornée et caches Liens/Promo, implémenté localement.
Aucun réglage cloud modifié. Gains après correctif non mesurés ; rendu progressif
Retours et faux zéros du résumé Ventes restent ouverts.

Les changements locaux sont consolidés sur `main` et poussés sur GitHub en
quatre commits : `e948eaa` (documentation, audits et archivage des 33 anciens
skills), `d7b7ae4` (passkeys), `097bacb` (hero/mobile, menu et galerie),
`865429c` (consentement cookies). L'archive des skills a été vérifiée par SHA256 ;
aucun skill archivé n'a été restauré. Les anciens commits livrés sur les branches
de travail sont intégrés par avance rapide, sans réécriture de l'historique.

Le push de `865429c` a déclenché le rollout automatique App Hosting sandbox
`rollout-2026-09-09-001`, **SUCCEEDED**, build `build-2026-09-09-001` **READY**,
100 % du trafic. Source Git vérifiée : branche `main`, hash complet
`865429c086d9e5c6a299fd83bbcb9d6e98a0c2e7`. Deployment ID servi :
`sv-mtu0bdmb-19c6b77d7843`, HTTP 200 et `s-maxage=300`.
Retour arrière identifié avant livraison : `build-2026-09-08-003`.

Validation locale sous Node 22.23.2 : 159 tests distincts réussis (91 Auth,
50 catalogue/newsletter/cache/contrats Gen2, 18 UI/cookies/accessibilité),
build Next 16.3.0, contrats SEO/routes/mobile et `git diff --check` réussis.
Lint des sources : zéro erreur, 121 avertissements ; commande explicite
`eslint . --ignore-pattern 'logs/**'` pour exclure les copies techniques locales
non versionnées. La commande brute avait rencontré 103 erreurs dans ces copies.
Les liens locaux de la documentation active modifiée ont été vérifiés.

Recette Chromium locale et hébergée à 390 et 1440 px : refus, persistance après
rechargement, réglages depuis le pied de page, acceptation puis retrait,
démontage de la carte Google et restauration du focus réussis. Aucun bouton
cookies flottant après choix, aucun débordement horizontal ni erreur JS.
Le menu mobile n'active pas la recherche à son ouverture. Captures et preuves
locales : `logs/livraison-hosting-20260909/` (non versionné).

La première livraison avait remplacé à tort les annonces demandées dans la
tâche « Adapter le hero mobile » par des textes génériques. Correctif du
9 septembre, sur rappel utilisateur : « Livraison offerte autour de Marseille »,
« Abonnez-vous à notre newsletter » et « Payez en 3 fois sans frais avec Klarna ».
La newsletter remplace ici le programme de fidélité de la demande initiale,
conformément à la demande actuelle. La clé de cache des annonces est renouvelée ;
le test des promesses publiques autorise uniquement la formulation Klarna
explicitement demandée. Ce changement éditorial ne modifie pas la configuration
Stripe ni les conditions d'éligibilité au paiement.

Limites de cette première livraison hosting : aucune nouvelle livraison Functions,
rules ou indexes ; le complément serveur passkey est livré séparément ci-dessous.
Aucune connexion passkey humaine, commande ou opération Stripe test exécutée.
La CI GitHub [34344923891](https://github.com/MFcv1/secondevienextjsSSR/actions/runs/34344923891)
reste **rouge** sur l'audit des dépendances : neuf alertes, dont deux critiques
Next.js (versions antérieures à 16.3.3), deux hautes et cinq modérées.
Les dépendances n'ont pas été modifiées et aucun seuil n'a été abaissé.
Cette livraison sandbox pour recette ne constitue pas une validation de
sécurité ni un GO production. Références des alertes critiques :
[Windows](https://github.com/advisories/GHSA-p293-qw3h-jr36) et
[optimisation AVIF](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4).

## Rapidité passkey — correctif et livraison serveur du 9 septembre

Après clarification de la demande de livraison complète, les deux Functions
ont été déployées depuis le commit de déploiement `acae5d1`, en `europe-west1` :

- `generatePasskeyAuthenticationOptionsGen2` : `generatepasskeyauthenticationoptionsgen2-00003-kos` ;
- `verifyPasskeyAuthenticationGen2` : `verifypasskeyauthenticationgen2-00003-xoq`.

Les deux sont `ACTIVE`, chacune reçoit 100 % du trafic de son service, avec
1 CPU, 256 MiB, concurrence 8, minimum 1 / maximum 2 instances et timeout 60 s.
Les identités d'exécution/build, politiques IAM et variables d'environnement
ont été comparées avant/après et sont conservées. Le script emploie désormais
`--update-env-vars` pour préserver `LOG_EXECUTION_ID` à la mise à jour de SITE_URL.
Les deux appels sans App Check sont refusés HTTP 401.

L'archive déployée a été relue dans Storage : `index.js`, `passkeys.js`,
`passkeyPerformance.js` et `readerEntrypoint.js` correspondent exactement aux
sources committées. Les archives précédentes sont copiées et protégées par
temporary hold ; configurations et révisions de retour arrière sont dans le
[manifeste ciblé](../deploy/passkey-performance-20260909.json), vérifié par son
[digest](../deploy/passkey-performance-20260909-digest.json).
[Résultats de vérification](../deploy/passkey-performance-20260909-result.json).

Validation complémentaire : 61 tests ciblés réussis, lint ciblé zéro erreur
(un avertissement préexistant), `git diff --check` réussi. Aucun déploiement
global Functions, aucune mutation commerce ni lecture de boîte mail.
La connexion biométrique humaine et la latence réelle sur téléphone restent
à mesurer ; des révisions actives ne prouvent pas un délai de 1–2 secondes.

Correctif committé dans `d7b7ae4`, **client et serveur désormais déployés** : entrée isolée pour les deux
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

La livraison serveur a utilisé l'autorisation Functions ciblée, une archive
immuable vérifiée et le manifeste via `scripts/deploy-functions-targeted.mjs`.
Le déploiement source seul doit également appliquer les nouveaux paramètres
de capacité : ne pas annoncer ceux-ci actifs après une simple mise à jour du code.
Les observations cloud avant livraison sont conservées localement dans
`logs/passkey-performance-20260909/` ; relire les révisions avant mutation et
conserver leurs sources de rollback. La seconde passe modifie aussi le client :
elle est livrée par App Hosting dans la consolidation du 9 septembre ci-dessus.

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
