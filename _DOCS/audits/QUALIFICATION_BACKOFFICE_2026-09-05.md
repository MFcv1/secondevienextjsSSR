# Qualification du back-office — 5 septembre 2026

Statut : `QUALIFICATION_PARTIELLE — RESERVES_EXPLICITES`.
Run : `run_qualification_bo_20260905_01`.
Deux séquences le 5 septembre, vers 00:30–00:58 puis 12:44–13:00 Europe/Paris.
Les preuves utilisent UTC. Lecture seule, puis seul lot Q1 explicitement autorisé ;
aucun correctif applicatif ni déploiement.

**Verdict : Ventes et le suivi du devis de recette sont démontrables avec leurs
limites de couverture. Data peut être présenté comme une lecture de projections,
pas comme une garantie de convergence. Stats ne doit pas servir de référence
pour le statut des dernières commandes : un remboursement terminé y est affiché
« En attente ». Factures n'est qualifié que sur son état vide.**

La campagne ne ferme aucun constat BA-01 à BA-13. Elle complète
l'[audit backend](AUDIT_BACKEND_2026-09-05.md) et son
[plan](PLAN_BACKEND_2026-09-05.md), sans implémenter leurs recommandations.

## Environnement et méthode

- Code local : `2c6c5b4358bffbb04674ddc8b869e3239f74ff2d`, worktree déjà modifié.
  Node de validation `22.23.2`, cible Node 22 / pnpm 11.7.0. Pas de build.
- Sandbox `secondevienextjsssr`, App Hosting `secondevie-next-sandbox`,
  région `europe-west4`. Révision recevant 100 % du trafic relue :
  `secondevie-next-sandbox-build-2026-09-04-004`.
  HTML `/admin` HTTP 200, `private, no-store, max-age=0`, marqueur et assets
  `sv-mtn3jine-72e40daa0324`, revérifié après l'interruption.
  Le code local n'a pas été comparé octet par octet aux bundles déployés.
- Chrome externe, version installée `152.0.7977.77`, profil existant ; session
  fonctionnelle **admin de recette** de la procédure, rôle Administrateur,
  authentification forte confirmée. L'adresse n'est pas recopiée dans les preuves.
  La session super-administrateur initiale a été écartée des séries comparables.
  Google a demandé une intervention humaine ; aucune boîte mail consultée.
  Après redémarrage de Chrome, la même identité applicative a été retrouvée.
- DevTools : **No throttling**, **Disable cache décoché**. Connexion habituelle
  de la machine ; débit, RTT, pertes, VPN et charge CPU non caractérisés.
  Pas d'effacement de cache ni de profil réseau représentatif d'une cliente distante.
  Safari, autorisé en recours, n'a pas été nécessaire.
- Instrumentation sans patch : arbre accessible/DOM, horloge de l'outil,
  DevTools Network et logs HTTP Cloud Run. Les contrôles DOM incluent l'aller-retour
  de l'outil ; ils ne mesurent ni le premier pixel ni l'INP. Les clics sans transition
  vérifiable, délais de locator et l'intervalle humain d'authentification sont exclus
  des séries de performance. Les panneaux hors viewport ne valent pas interface visible.
- Sources Firestore : GET avec masques et requêtes `runQuery` bornées. Les POST
  `runQuery` sont des lectures. Aucun corps client, jeton, cookie, en-tête Auth,
  photo, identité brute de session ou contenu de commande complet n'est conservé.
  Aucune capture brute n'a été ajoutée aux livrables.

Preuves locales expurgées :
[environnement](../../logs/recette/run_qualification_bo_20260905_01/environment.json),
[reprise](../../logs/recette/run_qualification_bo_20260905_01/environment-resume.json),
[mesures navigateur](../../logs/recette/run_qualification_bo_20260905_01/browser-measures.json),
[lectures métier](../../logs/recette/run_qualification_bo_20260905_01/read-only.json).
Ces fichiers sont sous `logs/recette/`, ignoré par Git ; le rapport reste lisible
sans eux, mais leur conservation est nécessaire pour refaire une contre-expertise.

## Mesures des parcours

### Trois retours sur écrans déjà chargés

Séquence du 4 septembre **22:50:28.492 à 22:50:37.720 UTC**, trois tours dans
l'ordre Stats → Data → Ventes → Retours → Factures → Devis, identité recette.
Chaque nombre est une mesure individuelle en millisecondes, incluant le contrôle
DOM par l'outil. Aucun percentile n'est calculé.

| Parcours | n | Essai 1 | Essai 2 | Essai 3 | Première donnée utilisable retenue | Fin des chargements nécessaires |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Stats | 3 | 634 | 514 | 508 | KPI présents ; valeurs déjà connues | Non établie pour les insights, marqueurs de chargement encore présents |
| Data | 3 | 440 | 429 | 420 | KPI et sessions déjà chargés | Aucun marqueur de chargement au contrôle ; listeners restent actifs |
| Commandes/Ventes | 3 | 777 | 806 | 817 | Liste/recherche sur données chargées | Non isolée : une lecture serveur dépasse le contrôle DOM |
| Retours | 3 | 446 | 469 | 453 | Dossiers déjà chargés | Aucun marqueur au contrôle ; dépendances de listes à distinguer |
| Factures | 3 | 306 | 300 | 316 | État vide connu, bouton Créer disponible | Non : workspace rechargé en arrière-plan à chaque remontage |
| Devis | 3 | 732 | 424 | 436 | Détail et bouton Enregistrer présents | Le détail est relu à chaque remontage, voir logs ci-dessous |

L'interface et la donnée étaient présentes au même contrôle dans cette série :
leur instant exact d'apparition n'est pas séparé. **« Présent via cache » ne veut
pas dire « toutes les requêtes terminées ».** Exemple vérifié : POST Factures à
22:50:30.922 UTC, durée 1 630,838 ms, alors que le contrôle DOM de ce tour prend
306 ms. Ces durées ne doivent pas être présentées comme des durées réseau.

### Premiers accès aux lecteurs : décomposition serveur

Une observation par ligne, première séquence hébergée, pas un échantillon de p95.
Les logs de requêtes et de démarrage sont corrélés par **service, révision et même
instance**. Pour les neuf lignes, le message de démarrage est compris entre le
début et la fin de l'OPTIONS concerné. Un démarrage associé à cet accès est donc
prouvé ; la durée de l'OPTIONS n'est pas intégralement attribuable au démarrage.

L'enveloppe va du début de l'OPTIONS à la fin du premier POST de cette instance.
Elle inclut l'intervalle entre les deux requêtes, pas le JS/Auth antérieur ni le
rendu ultérieur. Corrélation temporelle du parcours, sans identifiant de clic.

| Lecteur / action | Début UTC le 4/09 | OPTIONS ms | POST ms | Enveloppe ms |
| --- | --- | ---: | ---: | ---: |
| Contrôle facturation admin cliente | 22:47:22.449 | 3 761,162 | 876,952 | 5 014,141 |
| Commandes, première liste | 22:48:22.957 | 3 263,747 | 1 037,935 | 4 666,263 |
| Commandes, timeline au détail | 22:48:42.347 | 4 380,335 | 1 290,216 | 6 084,346 |
| Retours physiques | 22:49:04.015 | 2 462,814 | 815,744 | 3 628,445 |
| Demandes de retour | 22:49:04.017 | 3 763,983 | 493,189 | 4 666,625 |
| Factures, workspace | 22:49:25.100 | 2 844,894 | 924,987 | 4 055,065 |
| Devis, liste | 22:49:51.160 | 2 942,115 | 868,908 | 4 066,516 |
| Devis, détail automatiquement sélectionné | 22:49:55.372 | 3 875,077 | 1 274,254 | 5 377,130 |
| Q1, première sauvegarde du suivi | 22:53:55.184 | 3 267,489 | 1 025,224 | 4 508,838 |

Retours lance ses lecteurs en parallèle : **ne pas additionner** 3,63 et 4,67 s.
Devis lance réellement liste puis détail : la fenêtre serveur de cette ouverture
va de 22:49:51.160 à environ 22:50:00.749 UTC, soit environ 9,59 s. La liste
est exploitable avant les photos/détails ; les deux fins de tâche diffèrent.

Les POST Factures des trois retours sont respectivement 1 630,838 / 1 126,215 /
1 263,761 ms ; ceux du détail Devis 270,379 / 248,236 / 243,878 ms.
Les OPTIONS chauds ne sont pas systématiques : leur cache CORS est distinct du
cache métier. Tous les HTTP des neuf lecteurs dans cette extraction sont 200
pour les POST et 204 pour les OPTIONS ; cela ne prouve pas chaque résultat métier.

[Chronologie individuelle](../../logs/recette/run_qualification_bo_20260905_01/network-summary.json),
[corrélation complète](../../logs/recette/run_qualification_bo_20260905_01/instance-correlation.json),
[neuf démarrages associés](../../logs/recette/run_qualification_bo_20260905_01/correlated-starts.json).
Extraction de campagne : 163 lignes HTTP, plafond 200 non atteint, plusieurs
services de fond inclus. Extraction ciblée démarrages/requêtes : 61 lignes,
plafond 200 non atteint. Une première lecture de logs trop précoce avait retourné
zéro ligne : ce zéro n'a pas été pris pour une absence d'appels.

### Détail, recherche, pagination et reprise

| Scénario | n / conditions | Résultat observé | Limite de la mesure |
| --- | --- | --- | --- |
| Commande C142 : recherche puis détail | 1, recherche locale, première page 49 lignes | Résultat trouvé, détail remboursé ; timeline chargée séparément | Premier contrôle détail à 724 ms, timeline encore en chargement ; fin navigateur exacte non isolée |
| Commandes : page suivante | 1 | 49 → 99 lignes ; couverture limitée explicitement affichée | Encore 49 au contrôle à 870 ms, 99 au suivant ; pas de durée précise inventée |
| Data : Tracer | 1 | Parcours chargé après l'état d'attente | Au premier contrôle à 814 ms, parcours encore en attente |
| Data : historique | 1 | Page ancienne accessible et bouton de retour ; dix sessions supplémentaires | Pas de recherche globale proposée dans cette vue ; durée finale non isolée |
| Retours : pagination | 1, seconde séquence | Tout 38 → 61 ; Historique 15 → 17 | Contrôle à 1 688 ms encore en chargement ; ces périmètres mélangent dossiers/commandes, pas un compteur de demandes en attente |
| Retours : recherche C142 | 1, après pagination | « Remboursement terminé » retrouvé | Recherche sur données chargées, pas sur toute la base |
| Retours : Détails du dossier | 1 | Détail existant déplié, statut fournisseur affiché | Contrôle outil à 2 589 ms ; identifiants fournisseur exclus du rapport |
| Factures : détail/recherche/pagination | 0 | Collection vérifiée vide (0 document, borne 61) | Pas de facture émise/créée pour fabriquer une preuve ; parcours non qualifiés |
| Devis : liste/détail | 1 dossier de recette ; trois retours | Liste et détail lisibles ; suivi Q1 ci-dessous | Recherche et pagination au-delà des 100 demandes non qualifiées |
| Data : arrière-plan/reprise | 1, environ 78,853 s entre contrôles natifs | KPI présents au contrôle de reprise à 723 ms | Pas de mutation distante ; pas de preuve de suspension de tous les listeners |
| Data : réseau Offline puis retour | 1, 58,748 s, DevTools de l'onglet uniquement | Requêtes `ERR_INTERNET_DISCONNECTED`, KPI conservés avec état cache ; retour « Synchronisé avec le serveur » au contrôle à 1 541 ms | Aucune modification distante pendant la coupure : rattrapage de nouvelles données non prouvé |
| Première ouverture après longue interruption | 1, nouvelle fenêtre Chrome environ douze heures plus tard | Pas de shell à 3 260 ms ; shell/KPI observés à 14 138 ms ; identité recette conservée | Onglet initialement non sélectionné et intervalle entre outils : série exclue du verdict de latence interactive |

La première ouverture admin de la nuit n'a pas été instrumentée de bout en bout.
L'inactivité **de la campagne** ne prouve pas l'inactivité de tous les usagers ou
des services cloud. Le segment JS (téléchargement/parse/exécution), la résolution
Auth, le contrôle complet des droits, les callbacks Firestore et le rendu ne sont
pas chronométrés séparément. Le contrôle de facturation est la seule partie des
droits dont une enveloppe serveur est corrélée ici. Pas de compte de lectures
facturées par clic, de Query Explain, de Billing ou de test de charge.

## Concordance et fraîcheur

Lecture bornée du 4 septembre **22:42:25–22:42:27 UTC**, hors transaction globale.
Les valeurs ci-dessous sont des concordances ponctuelles ; elles ne garantissent
ni l'ordre des prochains événements ni l'absence d'une dérive passée.

| Domaine | Source vérifiée | Projection / affichage | Conclusion |
| --- | --- | --- | --- |
| Commandes | 142 documents sur borne 201 : 50 paid, 27 refunded, 4 completed, 6 en attente selon le contrat, 55 annulées | 87 actives = 81 groupe payé + 6 attente ; projection révision 39 ; KPI concordants | Concordance source/projection/UI des agrégats ; « groupe payé » inclut les remboursées, distinct des 68 captures financières |
| Finance | 93 faits sur borne 501, EUR, somme captures 2 174 000 c, remboursements nets des reversals 833 800 c, net 1 340 200 c | Totaux et `admin_dashboard/finance` identiques ; révision 11 ; affichage 21 740 / 8 338 / 13 402 € | Concordance arithmétique ; pas de rapprochement Stripe ni validation exhaustive de l'unicité effectId |
| Fraîcheur finance | `commerce_financial_totals/EUR.updateTime` 2/09 21:58:44.983231 UTC | `finance.sourceUpdateTime` exactement égal | La projection couvre cette version des totaux ; leur ancienneté ne prouve pas un retard sans nouvelle source |
| Retours en attente | 3 demandes existantes sur borne 201, zéro `pending_review` | `admin_action_summary/current.pendingReturns=0` | Concordance ponctuelle BA-01 ; « À traiter 4 » de Retours couvre un autre périmètre |
| Newsletter | 1 document existant sur borne 201 | `activeCount=1` | Concordance ponctuelle BA-02, pas test du retrait/création désordonné |
| Utilisateurs | `sys_user_stats/current=34` | Activity users=34, KPI=34 | Concordance intermédiaire seulement ; aucun inventaire complet Firebase Auth réalisé |
| Data, dix cartes récentes | Dix sources relues avec masques | Durée, activité, nombre d'étapes, début et dernière activité identiques pour 10/10 cartes | Cinq champs scalaires seulement ; pas de validation intégrale des parcours ni des buckets KPI |
| Factures | Zéro document réel | État final vide | État final exact, mais absence affichée prématurément pendant le chargement initial |
| Devis | Un dossier Q1 relu, versions 1 → 2 → 3 → 4 → 5 | A puis B affichés, B conservé après retour/Actualiser, notes vides restaurées | Voir chronologie ; lecture directe, pas projection asynchrone |

[Comparaison Data](../../logs/recette/run_qualification_bo_20260905_01/data-read.json),
[source C142 et Q1 avant](../../logs/recette/run_qualification_bo_20260905_01/target-preflight.json),
[état final revérifié après interruption](../../logs/recette/run_qualification_bo_20260905_01/target-final-resume.json).

Deux sessions de **deux identités admin autorisées** n'ont pas été établies.
Les comptes Google visibles et l'ancien super-admin ne constituent pas une
autorisation à les employer comme seconde identité de recette. Aucun compte
client promu et aucune nouvelle identité créée. Les tests de révocation/cache
BA-11 et de convergence entre deux admins restent ouverts.

## Défauts et observations reliés aux BA

| ID campagne | Force de preuve | Résultat, impact et référence |
| --- | --- | --- |
| QBO-01 / BA-12 | Défaut hébergé + source + code | C142 a `status=refunded`, capture=remboursement=124 000 c, net=0 ; Ventes/Retours l'affichent remboursée. Stats l'affiche « En attente ». `getOrderStatus` ne gère que shipped/completed/paid puis retourne attente : [AdminDashboard.jsx](../../src/kit/admin/AdminDashboard.jsx), lignes 824–828 et 1612. Bloque l'usage de cette liste comme référence de traitement. |
| QBO-02 / BA-12, BA-08 | État transitoire reproduit + code | Factures affiche « Aucune facture enregistrée » alors que Créer est désactivé avec « Catalogue en cours de synchronisation… ». Le zéro final est exact ici ; l'état initial ne prouve pas l'absence. [AdminInvoices.jsx](../../src/kit/admin/AdminInvoices.jsx), lignes 473–498 et 516–528. |
| QBO-03 / BA-12 | Observation répétée, cause ouverte | Les panneaux Intentions de devis/Tendances montrent encore des marqueurs de chargement sur plusieurs visites Stats, y compris après mise du titre dans le viewport (top 364,5 px) à 10:52:18 UTC. Le document insights existe, révision 11, productsState ready ; seule sa metadata a été relue. Fin de chargement non acquise, pas de preuve que le document complet est valide. Examiner le cycle reset/chargement différé : [AdminDashboard.jsx](../../src/kit/admin/AdminDashboard.jsx), lignes 1133–1190 et 1203–1235. Une annulation de callback/reset est une hypothèse, pas une cause démontrée. |
| QBO-04 / BA-05, BA-08 | Logs corrélés + code | Neuf démarrages associés aux OPTIONS. Le détail Devis est automatiquement demandé après la liste, avec son propre démarrage. Le premier détail de commande déclenche une timeline à ~6,08 s d'enveloppe serveur. |
| QBO-05 / BA-08 | Logs + code | Factures relit tout le workspace aux retours pourtant rapides via cache ; détail Devis relu à chaque remontage. [AdminInvoices.jsx](../../src/kit/admin/AdminInvoices.jsx), lignes 493–498 ; [AdminQuotes.jsx](../../src/kit/admin/AdminQuotes.jsx), lignes 174–192 ; workspace serveur produits/factures/profil : [manualInvoices.js](../../functions/src/invoicing/manualInvoices.js), lignes 151–165. |
| QBO-06 / Q1 | Incident de recette, attribution ouverte | Troisième sauvegarde conservant B ; audit `notesChanged=false`. Le serveur a conservé la valeur reçue, mais le payload navigateur n'a pas été capturé : saisie automatisée ou réponse tardive d'Actualiser restent possibles. Pas de défaut applicatif affirmé. Quatrième sauvegarde autorisée séparément, restauration vérifiée. |

[Metadata insights](../../logs/recette/run_qualification_bo_20260905_01/insights-read.json).
Une capture DOM contient aussi les nœuds hors écran : leur seul libellé
« chargement » n'a pas été qualifié de blocage avant contrôle de visibilité.

### Reproductions hors ligne et couverture des treize constats

Les cinq reproductions existantes ont été relancées sous Node 22, réseau interdit.
Elles attendent le comportement défectueux actuel ; leur succès **ne valide pas
un correctif**. [Résultats](../../logs/recette/run_qualification_bo_20260905_01/reproductions.json),
[script existant](preuves/backend-2026-09-05-reproductions.cjs).

| Constat | Résultat de cette campagne | Preuve qui reste ouverte |
| --- | --- | --- |
| BA-01 | Désordre Retours reproduit : 6 au lieu de 7 ; zéro hébergé concordant ponctuellement | Convergence hébergée et réparation éventuelle |
| BA-02 | Suppression avant création : 19 au lieu de 20 ; total hébergé 1 concordant | Baseline et désordre hébergés |
| BA-03 | Fait historique retombe de 120 à 60 s | Concordance complète historique/KPI et corrections tardives hébergées |
| BA-04 | Ancien sync réactive à 60 s une session fermée à 120 s | Course réelle beacon/sync ; source correcte après reconnexion avec mutations |
| BA-05 | Neuf démarrages corrélés aux OPTIONS ; pénalité cliente et chaîne devis mesurées | Gain d'une optimisation, capacité sous concurrence, coût |
| BA-06 | 10 cartes concordantes, retour Data rapide | Comptage réel des lectures/écritures par événement et listeners hors écran |
| BA-07 | Aucun test de compaction ou suppression | Rétention et événements après compaction |
| BA-08 | Pagination 49→99 et Retours 38→61 ; relances workspace/détail observées | Limites grandes listes ; nombre facturé de lectures ; facture ancienne |
| BA-09 | Prise prématurée outbox reproduite : processing au lieu de not-due | Reprise hébergée, envoi et effets fournisseur ; aucun e-mail provoqué |
| BA-10 | Build/HTML revalidés, pas mesure spécifique du catalogue | Coût de validation et builder, aucun gain affirmé |
| BA-11 | Passage à l'identité recette, sans preuve contrôlée de révocation | Perte de droits même UID, cache global et réponses tardives |
| BA-12 | QBO-01/QBO-02 reproduits ; Data distingue cache/hors ligne puis serveur | Erreur de liste Commandes forcée, absence de tous les résumés, fraîcheur métier globale |
| BA-13 | Pas de modification ni de mesure d'index | Query Explain, volume index et coût attribué |

41 tests ciblés passent : projections dashboard, newsletter, realtime,
live sessions et cache admin, garde réseau du dépôt chargé.
[Sortie TAP](../../logs/recette/run_qualification_bo_20260905_01/tests.tap).
Les garanties hors ligne de doublons/régressions ne s'étendent pas automatiquement
à tous les producteurs : BA-01 à BA-04 restent précisément les exceptions.

## Lot Q1 : périmètre soumis puis autorisé

Lot Q1 uniquement : suivi du devis de recette `DEV-20260809-5558A0`, visible
dans l'atelier Devis et portant une description de recette du 10 août.
Avant écriture, vérifier son identité, sa version et `intakeStatus=submitted`.

| Opération | Donnée | Résultat attendu | Effets secondaires |
| --- | --- | --- | --- |
| Q1-A | Ajouter aux notes existantes le marqueur synthétique `[QUALIF-BO-20260905-01 A]`, statut inchangé | Source version V+1 et détail identiques | Une écriture devis + un audit ; relecture du détail et signatures temporaires des photos existantes |
| Q1-B | Remplacer immédiatement A par `[QUALIF-BO-20260905-01 B]`, après acquittement de A | Version V+2, aucune régression vers A ; comparaison après navigation et actualisation | Mêmes effets, aucun fichier ajouté |
| Q1-R | Restaurer exactement les notes et le statut initiaux | Valeurs métier restaurées, version V+3 | Audit/version/horodatages conservés, aucune suppression d'audit |

Plafond : un devis existant, trois sauvegardes UI réussies, une seule session
admin, aucune commande, paiement, publication, identité ou configuration modifiée.
Les valeurs initiales restent uniquement en mémoire ; aucun contenu personnel
dans les preuves. Si une version concurrente est détectée, arrêt du lot et
rapprochement avant remise en état ; aucune restauration aveugle.

Le handler de suivi ne programme pas d'e-mail. Le trigger d'accusé retourne
immédiatement lorsque `before.intakeStatus` vaut déjà `submitted`
([code](../../functions/src/quotes/quoteRequests.js), lignes 444–500).
La qualification couvre ici source → réponse → cache → affichage, sans
projecteur asynchrone de KPI. Ce lot ne qualifie pas BA-01 à BA-04.

Les mutations de sessions, compteurs, retours, newsletter et finances ne sont
pas incluses dans Q1. Les preuves de convergence événementielle hébergée
restent ouvertes ; les reproductions hors ligne sont autorisées et exécutées.

### Exécution et remise en état

L'utilisateur a autorisé Q1, puis explicitement une quatrième sauvegarde de
restauration lorsque le plafond initial a été atteint. Aucune autre mutation
métier n'a été réalisée par cette campagne.

| Étape | Commit source UTC le 4/09 | Version | Notes / audit |
| --- | --- | ---: | --- |
| Avant | 9/08 23:18:30.952943 | 1 | Vides ; statut new ; intake submitted ; accusé déjà sent |
| A | 22:53:59.592159 | 2 | Marqueur A ; notesChanged=true |
| B | 22:54:18.178767 | 3 | Marqueur B ; notesChanged=true ; affiché après retour et Actualiser |
| R, première tentative | 22:54:50.488591 | 4 | B conservé ; notesChanged=false ; anomalie de recette signalée sans rejeu automatique |
| R, supplément autorisé | 22:55:49.119759 | 5 | Notes vides, compteur UI 0/4000 avant sauvegarde ; empreinte identique à l'origine |

A et B sont séparés de **18,587 s entre commits**, avec acquittement et relecture
intermédiaire. Il s'agit de modifications successives, **pas d'une course
subseconde ni d'un test d'événements livrés hors ordre**. La première attente
UI a dépassé le délai de locator de l'outil ; la source a été relue avant toute
action suivante, sans doubler la sauvegarde.

La restauration a été revérifiée le 5 septembre à 10:55 UTC : version 5 et notes
vides persistantes. Statut et intake inchangés, état d'accusé toujours sent.
Quatre audits de suivi conservés ; versions, horodatages et dernière attribution
admin sont les résidus attendus, non restaurés artificiellement.
Le contrôle commerce reste `v2_all/v2`, offline off, révision 77 inchangée.
Le devis n'appelle pas Stripe ; aucun paiement/refund n'a été exécuté ni mode
Stripe modifié. Aucun accusé n'a été demandé ; sa non-réémission est étayée par
le garde du trigger et l'état source, pas par une lecture de boîte mail.

[Audits Q1 expurgés](../../logs/recette/run_qualification_bo_20260905_01/q1-audits.json),
[restauration](../../logs/recette/run_qualification_bo_20260905_01/target-restored-final.json).

## Optimisations classées selon l'impact constaté

1. **Justesse avant vitesse :** corriger le statut C142 dans Stats et les états
   vide/chargement trompeurs, puis requalifier la fin des panneaux différés.
   L'impact démontré est une consigne de traitement fausse, pas seulement une gêne.
   BA-01 à BA-04 restent prioritaires pour garantir les transitions, même si les
   totaux lus aujourd'hui concordent.
2. **Premier accès :** réduire les dépendances et le travail d'initialisation sur
   les lecteurs critiques. Les enveloppes de 4–6 s et les démarrages associés
   justifient ce lot BA-05 ; elles ne quantifient pas encore son gain possible.
   Préserver le contrôle des droits, notamment le passage facturation cliente.
3. **Chaînes et travail répété :** éviter le deuxième démarrage imposé au détail
   Devis ; ne relire ses photos/détails que selon le besoin de fraîcheur. Réexaminer
   le rechargement intégral Factures aux retours et charger les produits lorsque
   l'utilisateur ouvre leur sélecteur. La liste vide actuelle ne justifie pas une
   lecture de tout le catalogue à chaque remontage.
4. **Couverture des listes :** conserver les périmètres explicites et ajouter les
   moyens de retrouver des données anciennes avant croissance. Pagination actuelle
   Commandes/Retours fonctionnelle sur les pages testées ; aucune justification
   pour augmenter aveuglément les bornes.
5. **Capacité, index, compaction et catalogue :** pas de classement en euros ou de
   valeur CPU/concurrence recommandée à partir de cette seule campagne. BA-06/07/
   10/13 restent à mesurer selon leur contrat ; BA-09 reste une gate indépendante
   si la démonstration inclut les e-mails.

## Verdict de présentation

- **Commandes / Retours : présentables sur les données testées**, avec chargement
  initial annoncé et recherche limitée aux lignes chargées. Les mutations commerce
  et financières ne sont pas qualifiées ici.
- **Devis : suivi présentable sur le dossier de recette**, source et affichage
  vérifiés et notes restaurées. La première ouverture liste+détail est sensiblement
  plus lente que les retours ; concurrence inter-admin non qualifiée.
- **Data : lecture et état réseau présentables avec réserves explicites** ; dix
  cartes concordent sur cinq champs et la reconnexion revient au serveur. Ne pas
  annoncer une fraîcheur garantie après deux mutations distantes ou une immunité
  au désordre, compte tenu de BA-03/04.
- **Stats : présentation limitée aux agrégats rapprochés.** Ne pas s'appuyer sur
  les statuts de la liste récente ; les insights ne sont pas qualifiés comme
  complètement chargés. QBO-01 est un défaut visible à corriger avant de présenter
  cette liste comme fiable.
- **Factures : seul l'accueil vide est vérifié.** Aucune facture existante pour
  qualifier détail/recherche/pagination ; création, émission et envoi non exécutés.

## Clôture et limites

Pas de code applicatif modifié, build, serveur local, déploiement, commit, push,
changement de capacité, test de charge, achat, remboursement, publication, envoi
d'e-mail demandé, lecture de boîte ou création d'identité. Le mode réseau local
de l'onglet est rétabli sur No throttling et DevTools fermé. Deux preuves JSON
créées par cette campagne ont été rangées dans son dossier local de preuves ;
aucun fichier préexistant déplacé ni supprimé. Les notes Q1 sont restaurées ;
les quatre audits restent.

Les preuves manquantes ne sont pas masquées : première ouverture interactive
précise après inactivité, décomposition JS/Auth/listeners/rendu, seconde identité
admin, mutations distantes pendant la coupure, événements hébergés désordonnés,
factures non vides, grande volumétrie, p95 représentatif et coût par parcours.
Les résultats sont des observations du build et des fenêtres nommés, pas une
certification générale de préproduction.

Contrôles finaux : statut Git avant/après, empreintes des fichiers préexistants,
liens locaux et `git diff --check` vérifiés. Les empreintes préexistantes sont
inchangées, sauf l'index des audits et `anomalies.md`, complétés par cette campagne.
Le rapport nouveau a également été contrôlé pour les espaces de fin de ligne.
Résultat détaillé dans la preuve locale `validation.json`.

Code applicatif modifié par l'agent de recette : **NON**.
