# Audit des chargements du back-office — 9 septembre 2026

**Suite à la demande utilisateur : [préchargement progressif sans instance permanente](PRECHARGEMENT.md).**
Le rapport ci-dessous décrit la première intervention. La suite ajoute une file
après Stats et les caches Liens/Promo ; correctifs toujours locaux, non déployés.

## Conclusion

Les captures montrent deux attentes distinctes : téléchargement/évaluation de la
vue lazy (roue commune), puis lectures métier (squelettes gris). Les logs sandbox
retrouvés aux heures des captures confirment un **démarrage d'instance pour chacun
des sept lecteurs commerciaux**, avant leur première lecture. La lenteur ne vient
donc pas seulement du volume de données ou du rendu React.

La principale anomalie évitable est le démarrage global des exports Functions
pour Codes promo et Liens de paiement. Livraison présente le même problème de
code. Les autres lecteurs disposent déjà d'une entrée isolée. Le préchargement
des données Devis/Factures/Retours/Livraison n'était pas raccordé à la navigation.

Correctifs locaux : entrée isolée pour ces trois Functions, un seul runtime par
lecture des liens, préchargement sur intention pour les vues ayant déjà un cache.
**Aucun déploiement. Aucun gain en secondes revendiqué après correctif.**

## Périmètre et méthode

- Six vues des captures : Ventes, Devis, Liens de paiement, Factures, Retours,
  Codes promo ; lecture complémentaire des points d'entrée des autres onglets.
- Code : arbre propre avant intervention ; empreinte de départ dans
  `baseline.txt`. Next déclaré `^16.3.0`, React `^19.2.7`, Node cible 22.x.
- Inspection du shell, effets de montage, clients, cache, handlers, requêtes,
  sérialisation, sécurité et configuration runtime. Guide Next installé
  `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` lu.
- Cloud en lecture seule : requêtes Cloud Run des sept lecteurs, démarrages,
  configuration/révisions ; aucune donnée client, aucun corps ni jeton exporté.
- Fenêtre principale : 9 septembre, 14:43–14:45 UTC (16:43–16:45 Paris),
  correspondant aux captures. Une seconde séquence le 8 septembre est présente
  dans les 24 h consultées ; ce n'est pas une distribution représentative.
- Pas de lecture Gmail, de connexion nouvelle, de scénario commerce, de build,
  de navigateur ni de mesure clic→pixel. Les fichiers cloud sont des observations
  datées ; ils ne prouvent pas l'identité du code local et du code servi.

## Les mesures retrouvées

Durées serveur Cloud Run, en secondes, arrondies. `OPTIONS` précède le `POST` ;
il ne lit pas la liste métier. Tous les POST sont 200, OPTIONS 204.

| Vue / lecteur | OPTIONS | POST | Somme des deux durées serveur |
| --- | ---: | ---: | ---: |
| Ventes / listOrdersAdminV2Gen2 | 1,264 | 0,912 | 2,176 |
| Devis / listQuoteRequestsAdminGen2 | 1,233 | 0,861 | 2,094 |
| Liens / listAdminPaymentLinksGen2 | 3,856 | 0,449 | 4,304 |
| Factures / getManualInvoiceWorkspaceAdminGen2 | 1,226 | 0,922 | 2,148 |
| Retours physiques / listReturnsAdminV2Gen2 | 1,238 | 0,820 | 2,058 |
| Demandes retours / listCustomerReturnRequestsAdminV2Gen2 | 2,255 | 1,054 | 3,309 |
| Codes promo / listPromotionCodesAdminGen2 | 5,527 | 1,324 | 6,850 |

Les lignes Retours sont parallèles : **ne pas additionner 2,058 et 3,309 s**.
Le cache Ventes peut éviter son troisième appel : aucun nouveau POST Ventes
n'apparaît à l'ouverture Retours de cette séquence, cohérent avec le code.
La somme exclut les intervalles entre requêtes, le réseau navigateur, les chunks,
App Check/Auth côté client et le rendu. Ce n'est ni un temps utilisateur total,
ni un p95, ni une durée Firestore pure.

Les logs `Starting new instance` puis `STARTUP TCP probe succeeded` encadrent
les requêtes préparatoires de ces sept services. Cela prouve le démarrage à froid
sur cette séquence, sans attribuer chaque milliseconde à un import précis.
Les services consultés ont une concurrence de 1 et un maximum de 1 instance ;
aucun minimum de révision n'est déclaré dans le relevé. Le code fixe minInstances
à 0. Une file d'attente sous concurrence est possible, pas démontrée ici.
Le startup CPU boost est déjà activé dans les annotations consultées.

Preuves : [requêtes](requests.json), [démarrages](startups.json),
[configuration](services.json), [base Git](baseline.txt).

## Chemin commun

Source : `app/admin/AdminAppIsland.jsx`, `AdminSidebar.jsx`,
`src/kit/config/firebaseLazy.js`, `functions/helpers/security.js`.

1. Résolution Auth/claim et assurance forte. Pour un non-super-admin, le contrôle
   d'onboarding facturation peut précéder l'accès au back-office.
2. Le shell attache les résumés d'incidents métier, système et actions Retours.
   La vérification de deploymentId est indépendante des listes commerciales.
3. Le clic change l'onglet interne et monte son module `React.lazy` sous Suspense.
   Quitter la vue la démonte ; les états React locaux ne survivent pas au retour.
4. Les effets de la vue lancent ses lectures. Le client callable charge le SDK
   Functions/App Check partagé ; le SDK transporte l'authentification et App Check.
5. Chaque service froid doit démarrer. L'appel métier contrôle claim/AAL2 et
   relit `sys_admin_access/{uid}` avant les données. Ce contrôle n'est pas supprimé.
6. Les documents sont lus, enrichis/sérialisés, puis l'état React est rempli.

Le cache admin est mémoire seulement, lié à UID + génération de droits, borné à
100 entrées. Il déduplique les promesses en vol. TTL 120 s par défaut, Devis 30 s.
Ventes/Devis/Factures/Retours peuvent afficher une ancienne page autorisée pendant
la relecture. Un rechargement complet du navigateur repart sans ce cache.
Précharger après un changement de droits ne doit pas remplir la session suivante.

## Détail des six vues

### Ventes

`AdminOrders.jsx` → `adminCommerceData.js` → `commerceV2Client.js` →
`v2OrderQueries.js:createListOrdersAdminHandler`.

- Première page : 50 `orders`, tri `createdAt desc`, aucun catalogue séparé.
  Une page suivante relit son document curseur puis la tranche.
- Si `ADMIN_ORDER_ARCHIVE_INDEX_READY` n'est pas actif, les archives sont filtrées
  après la lecture ; une page peut contenir moins de 50 lignes affichables.
- Le mode compact retire les médias/descriptions des lignes renvoyées. Les
  documents Firestore complets sont toujours lus : c'est un gain de transfert
  vers le navigateur, pas une réduction du nombre de lectures Firestore.
- Pour une commande avec remboursement demandé non entièrement soldé, lecture
  supplémentaire du dernier `refunds` (limit 1), en parallèle entre commandes.
  Jusqu'à une requête additionnelle par commande concernée. Les remboursements
  entièrement terminés diffèrent cet enrichissement au détail.
- Sélection : timeline supplémentaire, bornée à 100 événements ; détail exact
  disponible. Les actions revérifient l'état serveur.
- Cache première page partagé avec Retours. Préchargement existant au menu,
  désormais protégé contre rejet non géré et changement de génération.
- Limite UI constatée : le résumé latéral peut afficher zéro avant la première
  page (`OrdersOverviewPanel` reçoit le résumé d'une liste vide). Il faut lire
  l'indicateur de chargement ; ce zéro ne prouve pas l'absence de commandes.
  Ce défaut de présentation reste ouvert dans cet audit.

### Devis

`AdminQuotes.jsx` → `quoteAdminClient.js` →
`quotes/quoteRequests.js:listQuoteRequestsAdminHandler` → `admin/readPage.js`.

- Jusqu'à 100 demandes, tri création ; lecture de débordement pour hasMore via
  le helper paginé. Les compteurs concernent les demandes chargées uniquement.
- La liste ne signe/télécharge pas toutes les photos. La ligne amorce le détail ;
  la lecture des photos privées est différée au dossier sélectionné avec photos.
- Cache 30 s, détail par ID/version ; liens signés à durée bornée. Une nouvelle
  version du dossier impose de ne pas réutiliser aveuglément les anciennes photos.
- Préchargement déjà exporté mais inutilisé par le menu : raccordé dans le patch.
- Ne pas précharger toutes les photos : coût, données privées et expiration des URL
  déplaceraient le problème. Le squelette initial attend surtout la callable froide.

### Liens de paiement

`AdminPaymentLinks.jsx` → `adminPaymentLinkClient.js` →
`v2AdminPaymentLinks.js` → `domain/adminPaymentLinkCoordinator.js`.

- Deux branches : catalogue public côté shell, et callable liste+configuration.
  La callable lance la liste et `getSetup` en parallèle après autorisation.
- Liste : `orders` filtré `checkout.channel=admin_payment_link`, tri création,
  50 lignes + une de débordement. Sérialisation des URL privées avec HMAC local.
- Setup : contrôle commerce courant puis policy immuable active, modes de livraison.
  Pas d'appel API Stripe dans ces deux méthodes ; le runtime construit néanmoins
  un client Stripe et les dépendances métier. Le patch évite de le construire deux fois.
- Pas de cache de liste partagé actuellement : chaque remontage refait cette lecture.
  Le patch anticipe seulement le module JS, sans appel spéculatif supplémentaire.
- Le catalogue peut continuer à charger indépendamment du registre. Il est conservé
  dans l'état du shell, pas dans l'état de la vue.
- Le bandeau « désactivés » de la capture peut apparaître parce que setup vaut null
  pendant l'attente (`canMutate=false`) : **ce n'est pas une preuve de fermeture
  du commerce sandbox**. Aucune mutation de contrôle n'a été faite.
- Cache futur envisageable : séparer liste consultable et fraîcheur du setup,
  invalider après création/extension/régénération/annulation/recréation, garder les
  vérifications serveur. Pas de cache persistant des URL privées ajouté ici.

### Factures

`AdminInvoices.jsx` → `getManualInvoiceWorkspaceAdminGen2` →
`invoicing/manualInvoices.js:getManualInvoiceWorkspaceHandler`.

- Au montage : profil vendeur et 60 factures récentes (plus débordement), parallèles
  après le contrôle admin ; `includeProducts:false` exclut déjà les produits.
- Aucun PDF généré, aucun e-mail envoyé, aucun accès Stripe lors de cette ouverture.
  Le moteur PDF et le transport mail sont déjà requis à la demande côté serveur.
- « Créer » ouvre ensuite le sélecteur : appel productsOnly, maximum 300 produits,
  sans relire les factures, mais avec relecture du profil vendeur. Cache produits 30 s.
- Workspace 120 s, mémoire connue au retour ; invalidation lors des modifications.
  Préchargement existant désormais raccordé au menu.
- Le bouton de création attend le workspace ; ce choix explique le blocage visible.
  Afficher le formulaire plus tôt exigerait de séparer disponibilité du vendeur,
  des produits et de l'historique, et de vérifier chaque action selon ses prérequis.

### Retours

`AdminReturns.jsx` → `adminCommerceData.js:loadAdminReturnsFirstPage` →
les trois lecteurs de `v2OrderQueries.js`.

- Première page Ventes (cache réutilisé), 50 retours physiques en collectionGroup
  `returns`, 50 demandes en collectionGroup `customer_return_requests`.
- Les demandes sont enrichies avec commande, retour et remboursement référencés :
  références uniques regroupées par `getAll`, au plus 150 documents liés pour
  50 demandes. Cette optimisation existe déjà ; pas de seconde copie ajoutée.
- Les trois lectures partent en parallèle, mais `Promise.allSettled` publie le
  résultat seulement après la plus lente. Une erreur lente retarde donc aussi les
  blocs déjà disponibles. Les anciennes données restent possibles ; un refus
  d'autorisation invalide l'ensemble.
- Cache 120 s ; préchargement désormais raccordé à la navigation. Sur la séquence
  observée, seule la branche commandes pouvait déjà être chaude en mémoire.
- Optimisation structurelle possible : rendre séparément les trois sources avec
  couverture/erreur propres. Exige de revoir compteurs, rapprochements, pagination,
  actions et réponses tardives ; supprimer seulement le Promise.allSettled serait
  insuffisant. Non implémentée dans ce patch.

### Codes promo

`AdminPromotionCodes.jsx` → client promotions →
`v2PromotionCodes.js:createPromotionHandlers().listAdmin`.

- Contrôle admin puis une requête `commerce_promotion_codes`, création décroissante,
  limit 100. Compteurs déjà dans les documents, aucun recomptage global au montage.
- Catalogue public parallèle pour le ciblage produit. Le LoadingPanel masque toute
  la vue pendant la callable ; pas de cache partagé, chaque remontage la relance.
- Temps observé majoritairement avant le POST. L'entrée isolée est le correctif
  backend prioritaire ; le préchargement du chunk seul aide la première roue.
- Limite : les 100 codes ne constituent pas forcément tout l'historique ; pas de
  pagination de cette liste dans le contrat actuel. Un cache futur de 30 s pourrait
  améliorer les retours, avec invalidation après création/changement de statut.

## Autres onglets : points d'entrée contrôlés

Ces chemins ont été inspectés dans le code ; pas de temps utilisateur mesuré.

| Vue | Lectures à l'ouverture et attentes | Conséquence / limite |
| --- | --- | --- |
| Stats | `AdminDashboard`, `dashboardReads` : projection KPI Firestore ; insights, catalogue et historique financier selon panneaux/périodes | Peu de données pour le premier écran ; mémoire et écoutes retenues. Ne pas charger l'historique commerce complet à sa place |
| Data | `AdminAnalytics`, canaux realtime : documents de projection + sessions bornées ; détail de parcours à la sélection | Dix sessions récentes, pages anciennes bornées ; mémoire et grâce de navigation. Projection fraîche et chargement rapide sont deux propriétés distinctes |
| Publication | `AdminPublicationWorkspace` monte le formulaire ou l'historique ; `AdminItemList` : listener paginé 50 et quatre agrégations de compteurs, recherche bornée 200 | Ne pas confondre coût du formulaire, statut Meta et coût de la liste ; pas de scan intégral pour chaque ligne |
| Vue Globale | `ensureAdminCatalog` → `adminPublicCatalog` → API snapshot public ; montage de l'inventaire après succès complet | Lectures séquentielles de pages de 120, jusqu'à 50 pages / 6 000 produits, reprise une fois si release change. `limit=120` n'est pas un plafond total |
| Studio | `AdminStudio` → `useLiveTheme` | Paramétrage thème partagé, pas de liste commerce |
| Livraison | `AdminLivraison` → `getDeliveryPolicyAdmin` : registre admin puis transaction contrôle, métadonnées livraison, policy active | Cache 120 s. Entrée isolée et préchargement ajoutés ; transaction/cohérence préservées |
| Paiement | `AdminPaymentSettings` : listener `payment_settings` + callable statut Connect ; retour onboarding peut programmer une synchronisation | Ne pas précharger la synchronisation : elle peut contacter Stripe et persister l'état. Le statut simple et la synchronisation sont distincts |
| Personnalisation | `AdminHomepage` : documents about/gallery de `sys_metadata` en parallèle | État local perdu au démontage ; aucun traitement d'image requis par ces lectures initiales |
| Infos | `AdminNewsletter` : résumé matérialisé + listener de 50 abonnés, curseur | Pas de téléchargement de tous les abonnés ; listeners démontés à la sortie |
| SEO | `AdminSEO` : `getDoc(sys_metadata/contact_info)` | Une lecture ; erreur aujourd'hui seulement journalisée, valeurs par défaut peuvent apparaître. Limite existante, non corrigée ici |
| Mon compte | `AdminAccount` affiche Auth disponible puis lazy `BillingOnboardingOperator` et callable statut guide | Attente du panneau facturation distincte de l'identité affichée |
| Clients | `AdminUsers` écoute `sys_metadata/admin_users` | Registre admin ; ne télécharge pas tous les comptes Firebase Auth au montage |
| Performance | `AdminFunctionPerformance` : tokens Auth/App Check parallèles puis API Next `/api/admin/function-metrics` ; cache serveur et lecture Monitoring/inventaire si nécessaire | Cache React 15 min tant que la vue reste montée ; une visite peut relancer l'API mais pas nécessairement Monitoring |
| Incidents | Résumé système déjà partagé par le shell ; timeline sur recherche explicite | Ne pas précharger une recherche auditée au survol. Le résumé et la recherche historique ont des coûts distincts |

## Constats, corrections et arbitrages

| ID | Preuve / impact | Traitement et fermeture |
| --- | --- | --- |
| LOAD-01 | Cloud : démarrage des sept lecteurs ; OPTIONS peut dominer la latence | Confirmé sur cette session. Refaire mesures à froid/chaud après déploiement pour clôturer le gain |
| LOAD-02 | Code : Promo/Liens/Livraison absents de `readerEntrypoint`, chargement des exports globaux | Corrigé localement ; mêmes handlers, options, App Check, secrets déclarés et observation. Tests endpoint/refus/graphe passés |
| LOAD-03 | Code : préchargements Devis/Factures/Livraison exportés mais non raccordés, Retours disponible dans le cache partagé | Raccordés au focus/survol/toucher ; génération vérifiée après import, erreurs spéculatives absorbées, retry porté par la vue |
| LOAD-04 | Code : runtime Liens créé deux fois dans la même lecture | Instance de runtime unique par requête, branches liste/setup toujours parallèles |
| LOAD-05 | Code : Retours attend la plus lente des sources | Reste ouvert ; rendu progressif à qualifier avant toute modification de rapprochement métier |
| LOAD-06 | Code : Liens/Promo perdent leur liste au démontage | Reste ouvert ; cache avec invalidation et fraîcheur de configuration à concevoir. Le patch ne promet pas un retour instantané |
| LOAD-07 | Captures + code : faux zéros Ventes / faux état désactivé Liens durant attente | Reste ouvert ; états inconnus à distinguer des résultats confirmés |

Précharger toutes les pages à la connexion ferait démarrer toutes leurs Functions,
consommerait les lectures même sans visite et pourrait saturer la capacité limitée.
Le patch utilise l'intention de navigation, sans timer de maintien en température.
Un survol rapide peut néanmoins déclencher une lecture inutilisée ; les TTL et la
déduplication bornent la répétition. Aucun préchargement de mutation ou de photo privée.

Une instance minimale chaude éliminerait une partie des démarrages mais ajoute un
coût permanent par service. Augmenter concurrence/capacité peut traiter une file
d'attente, sans prouver un gain sur la première ouverture solitaire. Ces paramètres
cloud n'ont pas été modifiés ; aucune estimation Billing n'est inventée.

Une projection de liste admin peut devenir utile pour les enrichissements Retours
si les mesures à chaud montrent qu'ils dominent. Elle ajoute producteurs, reprise,
indexes/rules/rétention et surveillance de fraîcheur. Ce n'est pas nécessaire pour
expliquer les 5,5 s d'OPTIONS Codes promo, où la liste n'est pas encore exécutée.

## Validation et limites de livraison

Tests ciblés : caches (déduplication, données périmées, purge, réponses tardives),
contrats lecteurs existants, trois nouvelles entrées isolées (mêmes endpoints que
G8/G9, pas d'import analytics/email ni G8/G9 au démarrage, refus non authentifié).
Résultats exacts et lint : [validation](validation.txt).

Pas de build, E2E, mesure navigateur, mutation de données, augmentation d'instances,
commit, push ou déploiement. Aucun fichier déplacé ou supprimé.
La relecture runtime doit conserver OPTIONS dans les mesures, distinguer première
visite/retour mémoire/retour après TTL/rechargement et ne pas publier de p95 avec
seulement deux parcours. Les durées par phase Firestore et octets réellement
transférés restent non instrumentés ; le POST ne permet pas de les isoler.
