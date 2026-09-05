# Implémentation backend et back-office après qualification

Date : 2026-09-05. Statut : `IMPLEMENTATION_LOCALE_I0_I6 — NON_LIVREE`.
Le [suivi par lot](SUIVI_IMPLEMENTATION_BACKOFFICE_2026-09-05.md) distingue code,
validations locales, migrations, mesures encore manquantes et qualification hébergée.

Ce plan transforme l’[audit BA-01 à BA-13](AUDIT_BACKEND_2026-09-05.md) et la
[qualification QBO-01 à QBO-06](QUALIFICATION_BACKOFFICE_2026-09-05.md) en lots
exécutables. Il précise l’ordre opérationnel du [plan d’architecture initial](PLAN_BACKEND_2026-09-05.md),
qui conserve les explications longues. Un plan prêt ne vaut ni code corrigé,
ni autorisation de mutation cloud, ni qualification de livraison.

## 1. Décision et preuves qui orientent le travail

Conserver Firebase/Next, les droits serveur, le commerce transactionnel et les
projections utiles. Corriger les incohérences, supprimer les lectures inutiles,
puis réduire le démarrage des lecteurs. La hausse de capacité vient après
une comparaison à paramètres constants ; elle n’est pas le premier correctif.

| Preuve disponible | Conséquence pour l’implémentation |
| --- | --- |
| Stats présente une commande remboursée comme « En attente » | Corriger le contrat d’affichage avant recette de cette liste |
| Factures affiche un état vide pendant son chargement | Séparer chargement/absence/erreur |
| Insights restent en chargement ; cause non démontrée | Reproduire le cycle React et la réponse avant de corriger |
| Contrôle facturation cliente : enveloppe serveur 5,014 s avec démarrage corrélé | Inclure ce lecteur dans les optimisations du premier accès |
| Devis : liste 4,067 s, puis détail 5,377 s ; fenêtre successive ~9,59 s | Rendre les données de suivi déjà reçues utilisables sans attendre les photos |
| Factures relance son workspace ; détail Devis relu à chaque remontage | Cache appartenant à la session autorisée, fraîcheur explicite et invalidation ciblée |
| 18 retours DOM de 300 à 817 ms, outil inclus | Préserver les retours rapides ; ne pas les confondre avec fin réseau ou p95 |
| Cinq défauts encore reproduits, agrégats hébergés ponctuellement concordants | Corriger les transitions et contrôler les données ; aucune reconstruction générale présumée nécessaire |
| Q1 a demandé une restauration supplémentaire ; payload inconnu | Tester les réponses tardives et brouillons ; ne pas déclarer QBO-06 bug applicatif prouvé |

Relecture de code complémentaire : `serializeQuote` transmet déjà `version`,
`internalNotes`, client et projet dans la liste. Le détail ajoute notamment les
photos et leurs URL signées pendant quinze minutes. Le suivi peut donc être
amorcé depuis la liste sans attendre une seconde réponse, à condition de
préserver version, droits, états de fraîcheur et conflits. Sources :
[quoteRequests.js](../../functions/src/quotes/quoteRequests.js),
[AdminQuotes.jsx](../../src/kit/admin/AdminQuotes.jsx).

## 2. Jalons et dépendances

| Lot | Périmètre | Prérequis | Preuve de sortie |
| --- | --- | --- | --- |
| I0 | Figer la référence, les scénarios et les surfaces affectées | Aucun | Baseline et inventaire local, sans rejouer toute la campagne |
| I1 | Vérité de l’affichage et fin des insights | I0 | QBO-01/02 corrigés ; QBO-03 expliqué et testé |
| I2 | Cache lié aux droits et protection des brouillons | I0 | BA-11 et courses de réponse couvertes |
| I3 | Compteurs, source sessions et faits historiques | I0 | BA-01 à BA-04 corrigés localement + stratégie de transition |
| I4 | Lectures Devis/Factures/Retours et pagination | I2 ; états I1 | Appels/lectures évités démontrés, anciens dossiers accessibles |
| I5 | Imports Functions et lecteurs critiques | I4 pour comparer les chemins finaux | Graphe réduit, découverte des exports inchangée, tests transports |
| I6 | Échéance et reprise outbox | I0 | BA-09 corrigé localement ; reprises ambiguës toujours interdites |
| I7 | Livraison ciblée et qualification comparative | I1 à I6, autorisation distincte | Révision hébergée, tests de convergence et mesures avant/après |
| I8 | Capacité, coût analytics, index et compaction | I3, référence I7 | Expériences bornées et preuve de coût/capacité/rétention |
| I9 | Validation du catalogue et builder selon volume | Chemin public préservé | BA-10 mesuré et corrigé au niveau justifié |

**Première conversation d’implémentation : I0 à I6, code et validations locales.**
Les sous-lots sont des checkpoints de travail, pas des demandes de confirmation
à chaque fichier. Une dépendance cloud réellement requise est préparée et
signalée ; les travaux locaux indépendants continuent. I7 nécessite une
livraison demandée explicitement. I8/I9 restent des lots séparés afin de mesurer
leurs gains et de ne pas confondre correction métier et changement de capacité.

## 3. I0 — Référence et périmètre

- Vérifier Git et les changements préexistants ; ne pas les réattribuer au lot.
  La référence auditée était `2c6c5b4358bffbb04674ddc8b869e3239f74ff2d`.
- Lire AGENTS, map, les chapitres utiles et les guides Next installés avant code.
  Sélectionner Node 22 explicitement ; vérifier pnpm et les dépendances locales.
- Conserver les mesures publiées comme observations datées. Les preuves de
  qualification sont dans `logs/recette/run_qualification_bo_20260905_01/`,
  ignorées par Git : vérifier leur présence, ne pas y enregistrer de secrets,
  ne pas committer tout le dossier pour le rendre partageable.
- Définir les scénarios réutilisables et les points de mesure : accès admin,
  droits établis, lecteur lancé, donnée reçue, donnée utile rendue, médias prêts.
  Réutiliser les marques Performance existantes avant d’ajouter des mesures
  locales expurgées. Aucun nouveau collecteur permanent ou polling global.
- Relever le nombre nominal de callables/documents par scénario via les doubles
  de tests et le code. Ces compteurs ne sont pas des lectures facturées mesurées.

## 4. I1 — Affichage fidèle et chargements terminables

**Entrées :** [AdminDashboard.jsx](../../src/kit/admin/AdminDashboard.jsx),
[orderPresentation.js](../../src/kit/admin/components/orders/orderPresentation.js),
[AdminInvoices.jsx](../../src/kit/admin/AdminInvoices.jsx),
[AdminOrders.jsx](../../src/kit/admin/AdminOrders.jsx),
[AdminAppIsland.jsx](../../app/admin/AdminAppIsland.jsx).

1. Faire converger le statut de la liste Stats avec le contrat Ventes existant,
   en conservant la distinction paiement/remboursement/fulfillment. Couvrir
   refunded, paid, completed, shipped, annulations, attente et valeur inconnue.
   Un statut inconnu doit être explicitement inconnu, jamais attente par défaut.
2. Afficher un chargement pour Factures avant confirmation de liste vide, une
   erreur actionnable si la lecture échoue, et distinguer le rafraîchissement
   d’une liste déjà reçue. Étendre le principe aux résumés absents du shell et
   à l’échec de lecture Commandes identifié en BA-12.
3. Reproduire QBO-03 avec promesse retardée, changement de dépendances, retour
   d’onglet, observer déclenché avant/après reset et erreurs de validation.
   Inspecter la validité de la réponse : metadata `ready` ne valide pas le payload.
   L’association `insightsRequestedRef` / cleanup / reset est une piste, pas une
   cause acquise. Corriger le cycle prouvé, conserver le chargement différé et
   fournir erreur/retry si nécessaire ; ne pas masquer le problème avec des zéros.

**Réception :** tests comportementaux avec réponses différées ; aucun chargement
orphelin dans les scénarios testés ; statut remboursé cohérent entre vues ;
absence jamais déduite d’un chargement en cours. Aucun redesign demandé.

## 5. I2 — Cache autorisé, fraîcheur et édition

**Entrées :** [adminDataCache.js](../../src/kit/admin/adminDataCache.js),
[authStore.js](../../src/kit/auth/authStore.js), AdminAppIsland et AdminQuotes.

- Porter propriétaire et génération d’autorisation dans le cache partagé.
  Purger depuis les transitions Auth communes, y compris logout hors `/admin`,
  perte de claim/assurance ou refus d’autorisation. Ne pas attendre un changement
  d’UID. Ignorer aussi les réponses tardives dans les consommateurs montés.
- Garder la déduplication en vol, les bornes de mémoire, des clés incluant
  paramètres/curseurs et les invalidations métier ciblées. Aucune persistance
  nouvelle de données admin dans localStorage/IndexedDB.
- Définir par lecteur ce qui est frais, affichable depuis le cache, à revalider
  ou inutilisable. Un cache ne prouve pas une fraîcheur entre deux admins.
  Pas d’allongement global des TTL ni de cache long du registre serveur.
- Devis : séparer la version serveur reçue du brouillon édité. Une réponse
  d’Actualiser ou de chargement photo ne doit pas écraser des notes modifiées
  entre-temps. Préserver `expectedVersion`, gérer le conflit sans sauvegarde
  automatique et conserver la saisie à résoudre. Ne pas actualiser la version
  attendue sous un ancien brouillon comme si l’utilisateur l’avait rapproché.
- Cache des photos : échéance explicite des URL, invalidation par version,
  renouvellement sur besoin/expiration ; une URL encore valide ne prouve pas
  que les droits de la session le sont. Ne pas allonger les signatures.

**Réception :** logout ailleurs → autre admin ; révocation même UID ; refus
serveur ; réponse après purge ; Actualiser lent → saisie ; sauvegarde → ancienne
lecture ; sélection rapide de deux devis. QBO-06 reste d’attribution ouverte
si son incident précis n’est pas reproduit, même si ces protections sont ajoutées.

## 6. I3 — Convergence des données

**Entrées :** [actionSummaryProjection.js](../../functions/src/admin/actionSummaryProjection.js),
[newsletterProjectionDomain.js](../../functions/src/newsletter/newsletterProjectionDomain.js),
[newsletterProjection.js](../../functions/src/newsletter/newsletterProjection.js),
[sessions.js](../../functions/src/analytics/sessions.js),
[AnalyticsProvider.jsx](../../src/kit/shared/AnalyticsProvider.jsx),
[rollups.js](../../functions/src/analytics/rollups.js).

Traiter séparément et dans cet ordre logique :

1. Retours/Newsletter : delta depuis contribution appliquée vers source courante,
   version/tombstone et baseline d’appartenance explicite. Le bootstrap Newsletter
   actuel ne donne qu’un total : une simple valeur false pour ledger absent
   casserait la suppression des contacts de baseline.
2. Sessions : séquence/génération partagée par sync/beacon, arbitrage atomique,
   gestion des réponses métier négatives et de session disparue. Définir les
   comportements fermeture/reprise, plusieurs onglets et paquets retardés.
3. Faits historiques : source/exclusion relues, version comparée, suppressions
   et corrections propagées aux agrégats concernés ; reconstruction paginée du
   shard, pas refus définitif dès qu’un jour dépasse 2 000 faits.

Les quatre reproductions deviennent des tests attendant les bons résultats :
7 demandes, 20 contacts, fait à 120 s et session fermée à 120 s pour leurs
scénarios. Garder les reproductions historiques identifiables et versionner les
nouveaux tests métier ; ne pas supprimer la preuve pour obtenir une suite verte.

**Transition obligatoire avant livraison :** anciens onglets sans séquence,
sessions existantes, ledgers absents, nouveaux/anciens projecteurs et événements
en attente. Définir un rollout compatible et une fin bornée de compatibilité ;
ne pas laisser un writer ancien continuer à réintroduire la course. Une
compatibilité limitée qui réduit temporairement la garantie doit être annoncée.

Préparer un rapprochement dry-run et une réparation bornée/checkpointée pour
les seules divergences constatées. Aucun remplacement de total pendant des
écritures concurrentes sans mécanisme de rattrapage. Ne pas reconstruire les
finances ou rejouer des effets commerce pour corriger un compteur analytics.

## 7. I4 — Chemins de lecture et couverture des listes

**Entrées :** [quoteAdminClient.js](../../src/kit/admin/quoteAdminClient.js),
AdminQuotes, AdminInvoices, quoteRequests,
[manualInvoices.js](../../functions/src/invoicing/manualInvoices.js),
[v2OrderQueries.js](../../functions/src/commerce/v2OrderQueries.js),
[adminCommerceData.js](../../src/kit/admin/adminCommerceData.js).

**Devis :** initialiser le suivi depuis la ligne autorisée qui contient déjà
notes/statut/version ; conserver l’auto-sélection actuelle. Charger les médias
séparément sans bloquer les champs de suivi. Réutiliser les détails frais par
ID/version/propriétaire ; invalider après mutation et revalider selon le contrat.
Éviter le deuxième appel lorsqu’aucune information supplémentaire n’est nécessaire,
notamment sans photos. Ne pas signer toutes les photos des cent lignes en liste.

**Factures :** séparer liste/profil et produits du sélecteur. Zéro lecture produit
au seul accueil. Éviter un `force:true` au simple remontage ; actualisation
explicite et invalidation après sauvegarde/émission restent efficaces. Respecter
les factures émises immuables et la vérification serveur des données de création.
Préférer un contrat additif compatible avec l’ancien frontend pendant livraison.

**Retours :** retirer de la liste les enrichissements nécessaires uniquement au
détail ; dédupliquer les références dans la requête. Conserver les champs qui
déterminent une alerte ou une action admissible. `getAll` réduit les tours réseau,
pas la facturation de chaque document distinct.

**Pagination :** ajouter curseurs stables aux lecteurs Devis/Factures/liens de
paiement et signal de couverture ; garder des limites bornées. Vérifier index,
tri avec départage et validation des curseurs. Filtrer les archives au niveau
requêtable avant pagination ; un nouveau champ nécessite une stratégie pour
les documents anciens, sans scan ou backfill cloud implicite. Les recherches
par référence doivent atteindre les anciens dossiers ; ne pas promettre une
recherche textuelle globale sans contrat supplémentaire.

**Réception :** compte d’appels au retour sans mutation/expiration réduit ; zéro
produit lu à l’accueil Factures ; suivi Devis utile avant les médias ; pagination
sans perte/doublon dans un jeu stable ; anciennes données retrouvables ; réponses
obsolètes et conflits correctement gérés. Une liste contenant encore des objets
complets ne doit pas être qualifiée de DTO compact sans réduction effective.

## 8. I5 — Réduire l’initialisation des Functions

**Entrées :** [functions/index.js](../../functions/index.js), wrappers/runtime,
[billingGuide.js](../../functions/src/onboarding/billingGuide.js) et domaines lecteurs.

Choisir d’abord les cibles du chemin réellement mesuré : contrôle facturation,
listes Commandes/Retours/Factures/Devis, détail Devis et timeline commande.
Séparer handlers métier et déclarations Firebase, différer les dépendances
inutiles à la cible, conserver les clients réutilisables adaptés au domaine.
Le gain recherché vient du travail supprimé ; un import simplement déplacé au
premier handler doit être compté dans la requête complète.
[Conseils Firebase sur l’initialisation](https://firebase.google.com/docs/functions/tips),
revérifiés le 5 septembre 2026.

Mesurer sous Node 22, sans réseau, plusieurs processus frais : modules chargés,
temps d’import, premier handler et RSS. Comparer au même environnement local,
sans transformer la référence 836 ms / 1 735 modules / 153 MiB en mesure cloud.

Préserver la découverte de tous les exports lors de l’analyse Firebase, y compris
sans `FUNCTION_TARGET`. Tester noms, régions, trigger paths, secrets, options,
App Check et autorisation effective. Conserver les exceptions Auth Gen1 et
les ressources cloud-only. Pas de proxy Next supplémentaire en cascade, de
contournement CORS/Auth, de fusion générale des Functions ni de warm-up périodique.
Le contrôle facturation cliente doit rester effectif après accélération.

**Réception locale :** graphe des lecteurs réduit avec explication des imports
restants ; aucun changement involontaire du manifeste des Functions ; succès des
tests transports/sécurité concernés. Le gain de démarrage hébergé attend I7.

## 9. I6 — Outbox et reprises

**Entrées :** [outboxRepository.js](../../functions/src/commerce/domain/outboxRepository.js),
[commerceEventDispatch.js](../../functions/src/commerce/commerceEventDispatch.js), worker.

Vérifier atomiquement statut, identité de tentative, échéance et lease avant
effet. Refuser une ancienne tâche ou une tentative prématurée, tout en assurant
l’existence de la bonne tâche/reprise. Définir la compatibilité avec les tâches
déjà créées avant durcissement du contrat.

Tester les interruptions avant prise, avant envoi, après acceptation et avant
persistance. Conserver `delivery_unknown` hors reprise automatique. Préparer
le changement borné des retries de transport après preuve d’idempotence ; ne
pas modifier la queue pendant l’implémentation locale. Ni la signature d’une
tâche ni son nom ne rendent SMTP exactement-once. BA-09 se ferme séparément de
la qualification des données Stats.

## 10. I7 — Livraison et comparaison, sous autorisation distincte

Préparer une liste exacte de fichiers, Functions, index, schémas et migrations,
l’ordre frontend/backend compatible, les validations et le rollback. La
publication devra être ciblée sur le sandbox et ses cibles relues au moment
de l’action. Aucun `functions` global. L’autorisation de notes Q1 était bornée
et consommée : elle n’autorise pas de nouvelles mutations de recette.

Après livraison demandée, rejouer les six écrans avec l’admin cliente. Conserver
conditions et comptes comparables, distinguer cache, serveur et médias. Pour
Devis, rapporter séparément le temps de suivi utilisable et le temps photos.
Corréler les démarrages par instance/révision ; relever aussi les erreurs et
résultats négatifs. La baisse d’une enveloppe OPTIONS n’est pas toute la baisse
du chargement utilisateur.

Une campagne bornée distincte doit prouver source → projection → affichage,
deux admins autorisés, conflit d’édition et mutation distante pendant coupure.
S’il manque une seconde identité autorisée, le test reste ouvert. Les données
de recette, effets et restauration sont préparés avant approbation ; aucune
émission de facture/e-mail ou mutation financière ne sert de fixture implicite.

**Critères pour présenter les écrans :** statut et états justes ; insights
terminés ou erreur intelligible ; parcours non vide Factures réellement qualifié ;
convergence testée des données montrées ; délais froids expliqués et acceptables.
Les cibles proposées restent retour utile <1 s et première lecture utile autour
de 3 s ; elles ne sont pas garanties et ne se calculent pas en p95 sur trois
retours outil. Une petite série peut montrer une tendance, pas certifier un SLO.

## 11. I8/I9 — Capacité, coûts et suite complète

**I8a — Capacité lecteurs.** Conserver min zéro pendant les premiers essais.
Comparer à code identique : fractionnaire/concurrence 1, puis 1 CPU/concurrence
modérée (point de départ 4–8) ; max 2 uniquement si besoin démontré. Augmenter
un paramètre à la fois. Tester 1/3/5 admins sous plafond convenu ; distinguer
démarrage d’une instance et attente faute de capacité. Mesurer mémoire, refus,
temps et coût par opération réussie. Le CPU entier permet la multiconcurrence,
mais n’établit pas une économie à lui seul.
[Options de capacité Firebase](https://firebase.google.com/docs/functions/manage-functions),
revérifiées le 5 septembre 2026. Les valeurs exploratoires 8–16 du premier plan
ne sont pas une configuration approuvée ; commencer plus bas facilite l’attribution.

**I8b — Analytics et index (BA-06/13).** Quantifier source + producteurs +
listeners par création/heartbeat/route/fermeture/exclusion. Mutualiser les
lectures compatibles, conserver les versions, mesurer les écoutes hors écran.
Inventorier champs/requêtes avant exemption ; garder les requêtes de réparation.
Répartir/regrouper les écritures seulement si la contention le justifie, avec
une fraîcheur analytics explicitement convenue. Ne pas ralentir commerce/finance
par application du même délai. Aucun total en euros sans rapprochement Billing.

**I8c — Rétention (BA-07).** Implémenter baseline, watermark, corrections tardives
et tombstones avant retrait de ledgers/buckets. Tester ancien événement après
compaction, exclusion tardive et reprise interrompue. Une TTL seule n’est pas
une compaction. Préparer dry-run/comptages/sauvegarde avant toute suppression.

**I9 — Catalogue (BA-10).** Cache borné du résultat validé d’une release immuable,
pointeurs toujours frais, appels coalescés et fallbacks réellement validés.
Mesurer 200/304 et allocations. Le builder incrémental vient seulement si le
coût ou la durée du rebuild complet le justifie ; préserver CAS, empreintes,
ISR et absence de fallback Firestore public. Aucun opt-in Next implicite.

Ces lots restent visibles et ouverts jusqu’à leur exécution ou une décision
motivée. La présentation cliente n’exige pas de les déclarer artificiellement
fermés ; une ouverture à plus de trafic exige une capacité démontrée pour le
volume attendu.

## 12. Validation et compte rendu pour la conversation principale

Choisir les commandes dans [QUALITE_TESTS](../quality/QUALITE_TESTS.md) et vérifier
leur contenu courant. I1/I2/I4 : tests comportementaux UI/cache/Auth/devis/factures ;
I3 : projections/analytics/retention ; I5 : contrats Functions/transport et import ;
I6 : commerce unit/property/faults. Ajouter les permutations et interruptions
absentes des suites existantes. Un test de chaînes de caractères ne valide pas
une course React. Employer Emulator en projet `demo` pour les garanties
transactionnelles/rules nécessaires, sans connexion aux services réels.

Build/lint et tests navigateur locaux nécessitent la portée prévue dans le
prompt d’implémentation. Ne pas relancer les 366 tests après chaque petit patch ;
valider proportionnellement, puis intégrer les lots. Les tests hébergés Stripe
interdits et les gates demandant une autorisation spécifique restent inchangés.

Maintenir pour chaque lot : `à faire / code validé localement / livré / qualifié`,
fichiers, tests, mesures et limites. Une cellule `livré` nécessite la révision
servie ; une cellule `qualifié` nécessite sa preuve. Mettre les contrats durables
dans leurs chapitres, le statut synthétique dans ETAT_PROJET ; ne pas réécrire
les mesures historiques. Préserver les notes Q1 restaurées et leurs audits.

Le compte rendu final donne : lots achevés, constats encore ouverts, appels et
lectures évités, gains mesurés ou seulement attendus, migrations/rollout prêts,
validations exécutées/non exécutées, fichiers déplacés/supprimés et état Git.
Aucun score global « 100 % fiable » ni gain chiffré sans comparaison adéquate.
