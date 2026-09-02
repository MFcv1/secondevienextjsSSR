# Optimisation du dashboard et observabilite evenementielle

Derniere mise a jour: 2026-09-01

Statut: `SANDBOX_CUTOVER_EFFECTUE_QUIET_WINDOW_A_FERMER`

Verdict d'audit: `VALIDE_SOUS_AJUSTEMENTS_CIBLES`

Proprietaire: back-office, commerce et observabilite Seconde Vie

Cible autorisee: implementation locale et sandbox explicitement autorise le
2026-09-01

Production, Stripe live et donnees live: hors perimetre

Date limite de revue: 2026-09-15

Etat d'execution au 2026-09-01:

| Gate | Etat | Preuve/limite |
| --- | --- | --- |
| D0 | `PARTIEL_READ_ONLY` | inventaires code/cloud, compteurs sandbox, sauvegarde, policies et canaux releves; cout consolide sur 24 h non encore ferme |
| D1 | `FERMEE_LOCAL` | schemas, deltas, ordre nanoseconde, tombstones, baselines fail-closed et table incidents testes |
| D2 | `FERMEE` | reader trois documents, cache -> serveur, indisponible, lazy loading, badge, Rules deployees et Emulator 7/7 |
| D3 | `FERMEE_SANDBOX` | backup READY `339d85e6-c1b7-4211-9f25-9368d8dd5009`, bootstrap additif 185 documents par digest, puis verification sans ecriture |
| D4 | `SHADOW_CONFORME_QUIET_WINDOW_COURTE` | projecteurs deployes; rejeu/tombstones/no-op prouves; 140/140 orders, 34/34 users, 11/11 incidents et finance exacte; fenetre longue et recette refund fixture restent ouvertes |
| D5 | `CUTOVER_SANDBOX_PARTIELLEMENT_MESURE` | App Hosting deploye; trois lectures critiques, aucune callable sante/utilisateur, badge push; p95 reload chaud 822 ms et global < 2 s, mais segment exact `backOfficeReady -> KPI` < 700 ms non encore instrumente |
| I1 | `FERMEE_SANDBOX` | `onDocumentWritten`, filtre no-op, ledger/tombstones, resume push et badge sans polling deployes et prouves |
| I2 | `DEPLOYEE_COUT_24H_A_FERMER` | watchdog limite aux deux trous inbox, `limit(1)`, toutes les 15 min; runs sains sans incident, cout journalier complet non encore mesure |
| I3 | `DEPLOYEE_RUN_MANUEL_OK_FENETRE_NATURELLE_A_OBSERVER` | reconciliateur borne finance/orders programme a 03:17 UTC; run manuel sain en 877 ms, aucune divergence; premiere fenetre naturelle reste requise |
| C | `OUVERTE` | le plan reste present jusqu'aux quiet-windows, mesures segmentaires/cout et rollback final fermes |

Extension du 2026-09-01: le schema `insights` v2 ajoute les intentions de devis
sur 30 jours, 3 mois, 6 mois et 1 an, ainsi que le top cinq produits sur 30
jours. Les tests analytics/dashboard et le build local passent; l'interface est
presente dans App Hosting `build-2026-09-02-003`, mais le sandbox conserve le
document Firestore v1 tant que les deux Functions analytics ne sont pas
redeployees par le rail cible gouverne.

Mesures sandbox du 2026-09-01:

- ouverture critique: exactement trois documents Firestore et zero callable
  `getCommerceOperationsStatusAdminGen2`/`getUserStatsGen2` observee;
- dix reloads chauds jusqu'a `KPI · A jour`: mediane 589 ms, p95/max 822 ms;
- projecteurs incidents observes a 161/871 ms, 223/331 ms et 125/220 ms
  (`duration/source lag`); projecteur orders a 99-189/173-286 ms;
- apres trois nouvelles captures Stripe test: 90 faits, 66 captures, 66
  ledgers, source et projection strictement egales a 976 200 centimes nets;
- aucune ecriture production, aucun Stripe live et aucun `minInstances`.

## 1. Role et cycle de vie

Ce document rassemble le plan technique propose pour:

- supprimer le chargement progressif et incoherent des KPI de `/admin`;
- remplacer les recalculs a la consultation par des projections Firestore
  materialisees au fil des evenements;
- separer les donnees critiques, les historiques, les insights et la sante
  operationnelle;
- retirer le bandeau `Sante commerce` de Stats;
- faire de la console `Incidents` l'unique surface de diagnostic;
- privilegier la detection evenementielle et les notifications push;
- conserver un filet de reconciliation cible pour les pannes silencieuses;
- diminuer les lectures Firestore, les invocations Functions et les demarrages
  a froid sans affaiblir Auth, App Check, AAL2, Rules ou les invariants
  commerce.

Ce plan n'est pas une source canonique et n'autorise aucun deploiement. Apres
audit, implementation et fermeture des gates, ses decisions durables devront
etre fusionnees dans:

- `_DOCS/admin/BACKOFFICE.md`;
- `_DOCS/data/DONNEES_ANALYTICS.md`;
- `_DOCS/commerce/COMMERCE_SYNTHESE.md` et, si necessaire,
  `_DOCS/commerce/COMMERCE_STRIPE.md`;
- `_DOCS/operations/EXPLOITATION.md`;
- `_DOCS/quality/QUALITE_TESTS.md`;
- `map.md`;
- `firestore.rules`, `firestore.indexes.json` et la configuration Functions
  si leur contrat change.

Le present fichier devra ensuite etre supprime. Git conservera l'audit et le
plan ferme.

## 2. Decision proposee

La cible n'est ni une Function monolithique, ni une Function par carte, ni un
snapshot serveur par administrateur.

La cible est une projection globale par domaine, commune a tous les
administrateurs, maintenue cote serveur lorsque les faits metier changent:

```text
faits financiers ───────────────> admin_dashboard/finance
commandes et transitions ───────> admin_dashboard/orders
Auth + publication catalogue ───> admin_dashboard/activity
rollups analytics ───────────────> admin_dashboard/insights

erreurs explicites ─────────────> commerce_incidents / alertes Monitoring
                                       |
                                       `-> admin_incident_summary/current

admin A ─┐
admin B ─┼─ Auth + AAL2 + registre actif -> meme projection globale
admin C ─┘
```

Le navigateur n'ecrit aucune projection. Il lit une projection expurgee sous
`isStrongArtisan()` et recoit les changements par listener Firestore. Les
sources autoritaires restent les commandes, faits financiers, mouvements de
stock, outboxes, inboxes, registres et documents systeme existants.

### 2.1 Verdict technique du 2026-09-01

L'architecture centrale est validee. Firestore est ici le bon produit Firebase:
projections materialisees a l'ecriture pour les KPI, listener temps reel pour
les quelques documents utiles, Cloud Monitoring pour les erreurs runtime et un
watchdog uniquement pour les absences que Monitoring ou les workers existants
ne couvrent pas.

L'audit ne recommande ni Realtime Database, ni Data Connect, ni BigQuery sur le
chemin de Stats, ni bus Eventarc supplementaire, ni compteur distribue, ni
`minInstances` pour masquer un reader couteux. Les quatre documents sont un
decoupage logique par domaine, pas des shards physiques.

Les ajustements obligatoires avant implementation sont:

- ecouter seulement `finance`, `orders` et `activity` sur le chemin
  critique; charger `insights` une fois, sous la ligne de flottaison;
- ne jamais faire dependre le traitement d'un paiement de la projection UI;
- rendre les resumes orders et incidents idempotents face aux livraisons
  rejouees, supprimees et non ordonnees;
- distinguer les incidents metier materialises du flux Cloud
  Logging/Monitoring, qui reste notifie et consulte a la demande;
- ne pas dupliquer par watchdog les heartbeats et recuperations deja en place;
- supprimer du dashboard la requete directe `analytics_sessions`, actuellement
  incompatible avec les Rules, au lieu de la deplacer derriere un scheduler;
- mesurer separement la gate d'onboarding facturation et le rendu de Stats.

## 3. Constats prouves dans le code actuel

### 3.1 Le dashboard melange plusieurs sources

`src/kit/admin/AdminDashboard.jsx` charge aujourd'hui en parallele:

- `dashboard_stats/commerce`;
- `inventory_stats/overview`;
- jusqu'a 366 documents `sales_stats_daily`;
- cinq commandes recentes;
- `getUserStats` pour le compteur client;
- une tentative de requete directe de jusqu'a 500 documents
  `analytics_sessions` pour les modules du bas.

Les Rules versionnees refusent toute lecture SDK de `analytics_sessions`.
Cette derniere requete est donc une contradiction code/Rules et peut faire
echouer le module; elle ne constitue pas une preuve de 500 lectures facturees.
La Gate D0 doit verifier l'absence de drift cloud, puis le reader doit etre
supprime.

`app/admin/AdminAppIsland.jsx` lance separement
`getCommerceOperationsStatusAdmin`, puis precharge aussi les modules et donnees
Factures, Livraison, Devis, Commandes et Retours alors que Stats est la vue
visible.

Le cache `src/kit/admin/adminDataCache.js` est uniquement en memoire. Il est
perdu au rechargement complet et sa valeur peut etre affichee avant une
revalidation forcee.

### 3.2 La callable commerce bloque des donnees deja materialisees

`functions/src/commerce/v2Operations.js` fait attendre la meme reponse sur:

- deux documents systeme;
- quatre aggregations `count()` sur `orders`;
- `commerce_financial_totals/EUR`;
- jusqu'a 366 documents `commerce_financial_daily`;
- deux recherches live dans `commerce_outbox`.

Les quatre `count()` ne telechargent pas toutes les commandes. Ils parcourent
des entrees d'index et leur latence augmente avec le nombre d'entrees. Ils
restent toutefois sur le chemin critique et sont recalcules a chaque nouvelle
consultation.

Les montants financiers, eux, sont deja incrementes atomiquement par
`functions/src/commerce/domain/financialRollup.js`. L'ecran attend donc une
verification operationnelle complete pour afficher une valeur deja connue.

### 3.3 Le compteur historique ne couvre pas commerce v2

`functions/src/commerce/orderStats.js` exclut explicitement les commandes dont
`schemaVersion >= 2`. `dashboard_stats/commerce` ne peut donc pas devenir la
source autoritaire des commandes v2 sans migration.

Ce point explique le comportement observe dans les captures:

```text
ancien rollup visible: 25 commandes
        puis
count() autoritaire: 81 commandes
```

Le probleme est une divergence de projection, pas un volume de donnees.

### 3.4 Le reconciliateur horaire fait trop de choses

`commerceOperationsReconcilerGen2`, planifie toutes les 60 minutes, execute
actuellement dans un meme run:

- lecture des totaux financiers;
- lecture de jusqu'a 366 jours financiers;
- reconstruction d'une projection absolue;
- inspection d'une page de 25 commandes;
- lecture des faits financiers lies a ces commandes;
- creation ou verification de documents commerce;
- recherche de webhooks, leases, outboxes, reservations et incidents bloques;
- verification de Stripe Connect;
- reecriture de `sys_commerce_operations/current`;
- reecriture des incidents derives, y compris pour des compteurs a zero.

Au plafond, la seule relecture des 366 jours represente 8 784 lectures par
jour. Les commandes, faits financiers, requetes de sante et ecritures derivees
s'y ajoutent.

### 3.5 La console Incidents est deja partiellement evenementielle

Le socle actuel possede deja:

- des logs structures d'erreurs inattendues;
- des policies Cloud Monitoring `LogMatch`;
- des alertes Cloud Run 5xx;
- des alertes `commerce_worker_incomplete`;
- des heartbeats d'absence pour reservations, outbox et liens de paiement;
- des triggers Gen2 qui journalisent les faits financiers, mouvements,
  incidents, statuts d'outbox et statuts d'inbox;
- `getSystemIncidentsAdminGen2`, appelee uniquement a l'ouverture de la console,
  au changement de filtre ou au clic sur `Actualiser`;
- `getDiagnosticTimelineAdminGen2` pour la recherche par commande.

Le futur systeme doit reutiliser ce socle. Il ne doit pas creer un second
pipeline d'observabilite concurrent.

### 3.6 Mesures cloud observees pendant l'audit

Sur les requetes HTTP sandbox disponibles sur 14 jours au 2026-09-01:

| Lecteur | Echantillon | Mediane | p95 | Maximum |
| --- | ---: | ---: | ---: | ---: |
| `getCommerceOperationsStatusAdminGen2` | 27 | 0,80 s | 1,47 s | 2,52 s |
| `getUserStatsGen2` | 41 | 0,91 s | 5,42 s | 5,97 s |

Les deux Functions ont `minInstances: 0`, `maxInstances: 1`, concurrence 1 et
167 mCPU. Les temps ci-dessus n'incluent pas toute la phase Auth, le chargement
des chunks ni les lectures Firestore directes du dashboard.

## 4. Objectifs et non-objectifs

### 4.1 Objectifs bloquants

- Une seule version coherente des KPI est affichee.
- Aucun passage visible d'un rollup legacy a un compteur v2.
- Les montants et compteurs critiques apparaissent ensemble.
- Aucune lecture de 366 jours ni de 500 sessions ne precede les KPI.
- Aucun detail de sante ou d'incident ne bloque Stats.
- Une vente ou un remboursement confirme actualise la projection sans attendre
  un scheduler.
- Une erreur explicite ouvre ou actualise un incident sans scan global.
- Une absence d'evenement critique reste detectee par heartbeat ou watchdog.
- Les lectures et ecritures restent bornees, mesurables et auditees.
- L'admin faible, inactif ou non AAL2 ne lit aucune projection privee.

### 4.2 Non-objectifs

- aucune activation Stripe live;
- aucun rail production;
- aucun changement de source autoritaire commerce;
- aucun affaiblissement Rules, App Check, registre admin ou AAL2;
- aucun redesign general du back-office;
- aucune suppression immediate des rollups, readers ou schedulers existants;
- aucune purge de commandes, faits, sessions, logs ou documents historiques;
- aucun compteur distribue avant preuve de contention reelle.

## 5. Modele Firestore cible pour Stats

### 5.1 Collection lisible par admin fort

```text
admin_dashboard/finance
admin_dashboard/orders
admin_dashboard/activity
admin_dashboard/insights
```

Tous ces documents sont globaux. Aucun chemin ne contient l'UID d'un admin.

Regle cible:

```text
match /admin_dashboard/{docId} {
  allow get, list:
    if docId in ['finance', 'orders', 'activity', 'insights']
    && isStrongArtisan();
  allow write: if false;
}
```

Les ecritures passent exclusivement par Admin SDK. La projection ne contient
ni e-mail, ni telephone, ni adresse, ni UID client, ni orderId, ni token, ni
secret, ni payload fournisseur.

Les Rules ne filtrent pas une requete. Le listener critique doit donc porter
une contrainte `documentId() in ['finance', 'orders', 'activity']`; une
ecoute libre de toute la collection est interdite. Les tests Emulator prouvent
egalement qu'un futur document non allowliste reste illisible.

### 5.2 `admin_dashboard/finance`

Schema propose:

```js
{
  schemaVersion: 1,
  currency: 'EUR',
  capturedCents: 1681200,
  refundedCents: 709800,
  netCents: 971400,
  capturedOrderCount: 75,
  sourceFactCount: 79,
  source: 'commerce_financial_totals_projection',
  sourceUpdateTime: Timestamp,
  updatedAt: Timestamp,
  revision: 123
}
```

Le panier moyen n'est pas stocke comme un flottant:

```text
averagePaidOrder = capturedCents / capturedOrderCount
```

Les montants restent des entiers en centimes. `capturedOrderCount` doit compter
les captures de commande uniques, pas le nombre total de faits financiers.

Implementation proposee:

1. etendre le delta financier pour distinguer `captureCount`, `refundCount` et
   `refundReversalCount`;
2. verifier par test et audit qu'une commande ne produit qu'une capture
   comptable autoritaire;
3. si plusieurs captures par commande deviennent possibles, utiliser un
   ledger backend-only par orderId au lieu d'incrementer directement;
4. conserver le fait et `commerce_financial_totals/EUR` atomiques dans la
   transaction metier existante;
5. etendre le trigger existant `journalFinancialFactGen2`, sans creer une
   nouvelle Function, pour relire ce total autoritaire et recopier une valeur
   absolue dans `admin_dashboard/finance`;
6. ignorer transactionnellement une source dont l'`updateTime` est anterieur
   ou egal a celui deja projete;
7. ne jamais recalculer ces valeurs au chargement de Stats.

La projection admin est reconstruisible et ne doit jamais elargir le domaine de
panne du paiement. Une erreur transitoire du projecteur est rejouee; une erreur
permanente de schema ouvre un incident et met la projection en
`Indisponible`, sans bloquer indefiniment un paiement deja capture chez
Stripe.

### 5.3 `admin_dashboard/orders`

Schema propose:

```js
{
  schemaVersion: 1,
  totalOrders: 81,
  paidOrders: 75,
  shippedOrders: 0,
  pendingOrders: 6,
  cancelledOrders: 0,
  source: 'orders_all_schemas_projector',
  latestObservedSourceUpdateTime: Timestamp,
  updatedAt: Timestamp,
  revision: 456
}
```

Le projecteur doit couvrir les commandes legacy et v2. Il est au moins une
fois et doit donc etre idempotent et tolerant au rejeu, au desordre Eventarc,
a la suppression, et au changement de date ou de statut.

`totalOrders` conserve la semantique actuelle des commandes non annulees.
`paidOrders`, `shippedOrders` et `pendingOrders` forment une partition
mutuellement exclusive de ce total; `cancelledOrders` est compte a part.
Chaque statut legacy et v2 doit etre mappe explicitement ou faire echouer la
projection, jamais tomber silencieusement dans `pending`.

Ledger cible pendant le shadow mode:

```text
admin_dashboard_order_projections/{orderId}
```

Schema minimal du ledger:

```js
{
  schemaVersion: 1,
  orderId,
  sourceUpdateTime,
  deleted: false,
  summary: {
    totalOrders,
    paidOrders,
    shippedOrders,
    pendingOrders,
    cancelledOrders
  },
  updatedAt: Timestamp
}
```

Le trigger lit l'ordre courant et le ledger, calcule le delta entre ancien et
nouvel etat, puis met a jour le compteur et le ledger dans une transaction.
Deux livraisons du meme evenement doivent produire un seul effet.

`sourceUpdateTime` conserve la precision complete de l'`updateTime`
Firestore (secondes + nanosecondes), jamais un simple `toMillis()` susceptible
de confondre deux commits rapproches.

Avant d'ouvrir la transaction, le trigger compare les resumes normalises
`before` et `after` et ignore toute ecriture qui ne change aucun champ
projete. Une suppression conserve un tombstone avec resume nul et
`deleted: true`; le ledger n'est pas supprime tant qu'un rejeu de la source
reste possible.

Le depot possede deja `order_stats_projections/{orderId}`. Le ledger distinct
ci-dessus n'est accepte que pour isoler le shadow mode et son rollback du
projecteur legacy. La Gate C doit ramener l'architecture a un seul ledger
durable. Si cette isolation n'est plus necessaire avant D1, le schema existant
est migre sur place au lieu de creer une seconde collection.

`latestObservedSourceUpdateTime` indique seulement la source la plus recente
observee; il ne prouve pas que tous les evenements intermediaires ont ete recus.
Seuls le bootstrap et la reconciliation absolue prouvent la completude.

Le bootstrap initial est une operation separee:

- dry-run obligatoire;
- comptage par schema et statut;
- digest deterministe des orderId, updateTime et resumes normalises;
- sauvegarde Firestore avant apply;
- precondition sur le digest et le commit;
- ecriture du compteur et des ledgers par lots bornes;
- recomptage independant apres ecriture;
- aucun envoi Stripe, e-mail, refund, restock ou mutation de commande.

Le projecteur legacy existant reste intact pendant la qualification. Il ne sera
retire ou transforme qu'apres cutover stable et audit des appelants.

### 5.4 `admin_dashboard/activity`

Schema propose:

```js
{
  schemaVersion: 1,
  users: {
    registeredUsers: 34,
    sourceRevision: 12,
    sourceUpdatedAt: Timestamp
  },
  catalog: {
    stockValueCents: 579800,
    sourceRevision: 77,
    sourceUpdatedAt: Timestamp
  },
  updatedAt: Timestamp,
  revision: 21
}
```

Alimentation:

- les triggers Auth create/delete conservent `sys_user_stats/current` et
  reportent le compteur expurge vers `admin_dashboard/activity`;
- la transaction Auth incremente une vraie `revision` monotone; le
  `version: 1` actuel reste un numero de schema et ne sert pas de revision;
- cette revision et le compteur sont proteges par
  `admin_user_stats_projections/{uid}`, ledger backend-only contenant
  `present`, `sourceEventTime` et le dernier `eventId`.
  Rejeu et evenement ancien sont des no-op; une suppression conserve un
  tombstone. D0 compare le compteur a un listage Auth borne avant bootstrap;
- le builder catalogue conserve `inventory_stats/overview` et reporte les
  champs expurges apres publication reussie. `stockValueCents` vaut
  `Math.round(totalStockValue * 100)` et `sourceRevision` reprend
  `catalogRevision`;
- aucun compteur catalogue non affiche n'est copie dans la projection;
- les revisions et timestamps `users` et `catalog` restent independants:
  une ecriture de l'une des sources ne peut pas faire paraitre l'autre fraiche;
- une absence de source affiche `Indisponible`, jamais un faux zero;
- aucun scan Auth ou catalogue n'est lance par Stats.

### 5.5 `admin_dashboard/insights`

Les modules `Intentions de devis` et `Meubles en tendance` ne doivent plus lire
500 sessions a chaque ouverture.

Schema v2 implemente localement, borne:

```js
{
  schemaVersion: 2,
  windowDays: 30,
  quote: {
    visits: 0,
    starts: 0,
    submitted: 0
  },
  quoteWindows: {
    '30d': { visits: 0, starts: 0, submitted: 0 },
    '3m': { visits: 0, starts: 0, submitted: 0 },
    '6m': { visits: 0, starts: 0, submitted: 0 },
    '1y': { visits: 0, starts: 0, submitted: 0 }
  },
  productsState: 'ready',
  products: [],
  coverageThrough: Timestamp,
  source: 'analytics_rollups',
  updatedAt: Timestamp,
  revision: 9
}
```

Contraintes:

- maximum cinq produits lorsque `productsState === 'ready'`;
- aucun UID, IP, e-mail ou parcours brut;
- supprimer toute requete periodique ou client de 500 sessions;
- etendre le fait de session et les rollups existants avec trois drapeaux de
  session devis ainsi que `productViews` et `productViewSessions`; ne creer ni
  nouveau trigger de session ni nouveau scheduler;
- reconstruire les quatre fenetres devis depuis 30 jours et 12 mois de rollups,
  et le top cinq produits depuis les 30 jours, uniquement lorsqu'un digest de
  rollup source a change ou que la fenetre franchit un nouveau jour, dans le
  run de maintenance existant; ne pas reecrire `admin_dashboard/insights` si
  son contenu est identique;
- calculer le digest des metriques journalieres hors `compactedAt` et ne plus
  reecrire les rollups `today/yesterday` inchanges toutes les 15 minutes;
- ne fixer le seuil de fraicheur qu'apres mesure: avec 35 minutes d'inactivite,
  un scheduler de 15 minutes et un trigger asynchrone qui peut manquer la
  compaction du meme run, le pire cas nominal approche deja 65 minutes avant
  tout backlog;
- une erreur insights ne bloque jamais les KPI finance/orders/activity;
- les images restent resolues depuis le snapshot catalogue public courant.

Le contrat v2 retient uniquement les `itemId` valides rencontres dans les
etapes `detail`, leur nombre de vues et un drapeau de session par produit. Le
top cinq expose donc des vues exactes et une somme de sessions interessees par
produit; il ne pretend pas fournir des visiteurs uniques inter-produits. Les
cartes distinguent chargement, activite nulle et indisponibilite technique.
Aucun fallback vers les sessions brutes n'est autorise. Cette extension reste
locale jusqu'a un deploiement Functions/App Hosting explicitement autorise.

## 6. Lecture client cible

### 6.1 Un listener Firestore critique, pas quatre callables

Apres resolution de `AuthContext`, claim admin, AAL2 et registre actif:

```js
onSnapshot(
  query(
    collection(db, 'admin_dashboard'),
    where(documentId(), 'in', ['finance', 'orders', 'activity'])
  ),
  { includeMetadataChanges: true },
  handleSnapshot
)
```

Le premier snapshot attendu contient les trois documents critiques. L'interface
valide:

- la presence des documents critiques `finance`, `orders`, `activity`;
- leur `schemaVersion`;
- la validite des entiers et timestamps;
- l'absence de revision regressive;
- la fraicheur selon un seuil propre a chaque domaine.

Stats ne rend pas une combinaison provenant de snapshots differents. Au premier
chargement sans cache, le squelette coherent reste visible jusqu'au premier
snapshot serveur. Ce snapshot termine toujours le squelette: la grille apparait
en une fois et chaque domaine absent ou invalide affiche `Indisponible`, au
lieu d'attendre indefiniment un snapshot qui ne peut pas devenir valide.

Cette garantie concerne le premier rendu et la coherence interne de chaque
domaine; elle ne pretend pas rendre atomiques des projecteurs finance et orders
independants. Apres le premier rendu, une mise a jour valide remplace seulement
son domaine sans remettre la grille en squelette ni revenir a un reader legacy.

Firestore peut emettre d'abord une valeur issue de son cache local. Cette valeur
peut etre affichee avec `Actualisation...`, mais l'etat `A jour` n'est permis
que lorsque `snapshot.metadata.fromCache === false`.

L'option `includeMetadataChanges` est obligatoire pour recevoir la transition
cache vers serveur lorsque les donnees sont identiques. Il n'est pas prevu de
cache serveur ou de document par UID admin. Le cache reste en memoire; aucune
persistance IndexedDB de donnees financieres admin n'est activee sans decision
de securite distincte. Le listener est detache au demontage et a la
deconnexion. Un changement d'UID, un retrait admin ou un
`permission-denied` purge tout etat derive du compte precedent.

### 6.2 Priorites de chargement

Ordre cible:

1. shell admin et controles d'acces;
2. listener `admin_dashboard`;
3. rendu coherent des KPI;
4. cinq commandes recentes uniquement apres le premier rendu KPI ou a l'entree
   de leur panneau dans le viewport;
5. lecture unique de `admin_dashboard/insights` et catalogue public court
   uniquement si le bloc tendances approche du viewport;
6. historique financier au clic sur `Graphique`;
7. code et donnees des onglets non visibles au survol, a la selection ou
   pendant une vraie periode idle.

`AdminAppIsland` ne doit plus precharger les donnees Factures, Livraison,
Devis, Retours et Commandes sur le chemin critique de Stats. Un prechargement
de code sans lecture metier peut etre conserve s'il est demontre non concurrent
avec le chunk Stats.

Apres cutover, `getCommerceOperationsStatusAdmin` et ses trois tentatives ne
sont plus lances par le shell Stats; la callable reste reservee aux surfaces de
maintenance/diagnostic qui en ont besoin. `getUserStats` disparait egalement
du reader Stats, puisque `activity.users` porte deja le compteur expurge.

Les cinq commandes recentes restent une query bornee
`orders orderBy(createdAt).limit(5)`, car elles contiennent des informations
de commande qui n'ont rien a faire dans une projection globale expurgee. Son
listener n'est attache qu'apres le premier rendu KPI ou la premiere entree du
panneau dans le viewport, puis reste actif jusqu'au demontage de Stats afin
d'eviter des reabonnements au scroll. Elles ne comptent pas dans les lectures
critiques.

`getBillingGuideStatus` conditionne encore `backOfficeReady` avant le montage
de Stats. Le plan ne le masque pas: D0 mesure separement
`Auth forte -> backOfficeReady` et `backOfficeReady -> KPI`. Une optimisation
de cette gate n'entre dans ce chantier que si la premiere mesure prouve qu'elle
reste le goulet dominant.

### 6.3 Historique financier a la demande

Le panneau `Bilan` ne lit aucun document journalier.

Au clic sur `Graphique`:

| Periode | Lecture cible |
| --- | --- |
| 1 heure | commandes/faits recents bornes, uniquement a la demande |
| 24 heures | source intraday bornee, uniquement a la demande |
| 7 jours | 7 rollups journaliers |
| 30 jours | 30 rollups journaliers |
| 1 an | rollups journaliers existants, uniquement au clic; mensuels apres mesure |
| Max | rollups annuels/mensuels si leur usage le justifie, jamais toutes les commandes |

Le cutover n'ajoute pas de nouveau pipeline mensuel uniquement pour optimiser un
panneau rarement ouvert. Si la mesure demontre une latence ou un cout reels,
les rollups mensuels sont produits cote finance et jamais reconstruits depuis
les commandes dans le navigateur.

## 7. Architecture evenementielle des incidents

### 7.1 Positionnement UI

Le bandeau vert `Sante commerce : HEALTHY` est supprime de Stats.

La console `Incidents` devient l'unique surface detaillee. Elle conserve:

- le mode `Systeme` pour Cloud Logging et Error Reporting;
- le mode `Commande` pour la timeline metier;
- les filtres, regroupements, piles expurgees et lectures a la demande.

Un badge compact peut apparaitre dans la navigation:

```text
Incidents        2
```

Il n'apparait que si un incident actif requiert une action. L'absence
d'incident ne reserve aucun grand espace dans Stats.

### 7.2 Resume minimal ecoute par l'admin

```text
admin_incident_summary/current
```

Schema propose:

```js
{
  schemaVersion: 1,
  activeCritical: 0,
  activeWarnings: 0,
  activeTotal: 0,
  latestOpenedAt: Timestamp | null,
  latestResolvedAt: Timestamp | null,
  latestCategory: 'payment' | 'refund' | 'inventory' | 'email' | 'webhook' |
    'worker' | 'projection' | 'unknown' | null,
  updatedAt: Timestamp,
  revision: 88
}
```

Le document ne contient ni identifiant de commande, ni payload, ni e-mail, ni
stack, ni correlation sensible. Il est lisible par `isStrongArtisan()` et
backend-write-only.

```text
match /admin_incident_summary/{docId} {
  allow get: if docId == 'current' && isStrongArtisan();
  allow list, write: if false;
}

match /admin_incident_projections/{incidentId} {
  allow read, write: if false;
}
```

Le badge compte uniquement les incidents durables, actionnables et
materialises dans `commerce_incidents`, y compris ceux ouverts par le
watchdog. Les erreurs runtime presentes uniquement dans Cloud Logging restent
notifiees par Cloud Monitoring et visibles dans la console Systeme a la
demande. Elles ne sont pas artificiellement dupliquees dans Firestore.

Les incidents actuels ne portent pas tous `severity` et `category`. D1
introduit donc une table pure, exhaustive et testee `code ->
{ severity, category }`, partagee par les writers et le projecteur:

| Famille de codes | Categorie | Severite par defaut |
| --- | --- | --- |
| `payment_*`, `paid_payment_*`, `requires_capture_*`, `unknown_payment_*` | `payment` | `critical` |
| `refund_*`, `terminal_refund_*` | `refund` | `critical`, sauf allowlist warning |
| `inventory_conflict`, `refund_stock_divergence`, `operations_expiredHolds`, `operations_refundStockDivergences` | `inventory` | `critical` |
| `operations_dueInbox`, `operations_expiredInboxLeases` | `webhook` | `critical` |
| `operations_failedOutbox`, `operations_deadLetterOutbox`, `operations_deliveryUnknown` | `email` | `critical` |
| `operations_projectionDivergences` | `projection` | `critical` |
| `operations_connectDrift`, `operations_orphanPayments` | `payment` | `critical` |
| code worker materialise | `worker` | explicite |

La table reutilise les allowlists warning/stop deja presentes dans
`operationsHealth.js`. Tout code actif inconnu devient
`critical/unknown`, emet un log de contrat deterministe et fait echouer la
gate de schema; il n'est jamais ignore ni classe silencieusement.

Le shell admin attache un listener a ce seul document. Cout attendu lorsque le
systeme est sain:

- une lecture initiale;
- aucune nouvelle lecture tant que le resume, la connexion, les Rules et le
  document d'autorisation dependant ne changent pas;
- par ouverture, evolution ou fermeture: une lecture du resume et jusqu'a une
  lecture dependante `sys_admin_access/{uid}` lors de la reevaluation Rules,
  soit jusqu'a deux lectures par admin connecte.

Les details restent charges uniquement dans l'onglet Incidents.

### 7.3 Erreurs explicites: push d'abord

Une erreur explicite doit produire son signal a la source:

| Source | Evenement | Effet cible |
| --- | --- | --- |
| callable/HTTP Gen2 | `function_failed`, 5xx inattendu | policy LogMatch + notification Cloud |
| worker | `commerce_worker_incomplete` | notification Cloud; incident seulement si materialise a la source |
| outbox | transition `failed`, `dead_letter`, `delivery_unknown` | upsert incident email |
| webhook inbox | transition `failed`, `dead_letter` | upsert incident webhook |
| paiement | mismatch, orphan, statut inconnu | incident financier primaire |
| remboursement | mismatch, orphan, conflit terminal | incident financier primaire |
| stock | inventory conflict ou divergence refund/stock | incident inventaire |
| projection | divergence detectee a l'ecriture | incident projection |

Les triggers Firestore existants de `businessEvents.js` sont etendus; ils ne
sont pas dupliques par un second journal. En particulier,
`journalCommerceIncidentGen2` passe de `onDocumentCreated` a
`onDocumentWritten` afin de journaliser aussi les resolutions. Il ignore les
updates qui ne changent ni statut, ni severite, ni categorie, ni code; un simple
`lastSeenAt` ne cree pas un nouvel evenement metier.

Ce filtre `before/after` est execute avant le journal et avant le projecteur de
resume. Il neutralise notamment les reecritures horaires actuelles qui ne
changent que des timestamps, pendant toute la duree du shadow mode. La creation
d'un incident deja `closed` et la suppression d'un incident deja inactif sont
egalement des no-op.

Chaque incident utilise une cle deterministe derivee de sa source et de son
type. Les rejeux incrementent un compteur ou actualisent `lastSeenAt`, sans
creer de doublon. Une transition de fermeture decremente le resume une seule
fois.

Une cle deterministe ne suffit pas a garantir ce dernier point. Un ledger
backend-only `admin_incident_projections/{incidentId}` conserve le dernier
etat actif, la severite, la categorie et le `sourceUpdateTime`. Le projecteur
met a jour ledger et resume dans une transaction, ignore les evenements anciens
ou identiques et conserve un tombstone apres suppression. Une modification
limitee a `lastSeenAt` ne reecrit pas le resume si le badge ne change pas.

Chaque code d'incident doit definir son contrat de resolution: transition
source qui ferme, preuve de convergence et comportement en cas de suppression.
Le bootstrap initialise le ledger depuis les incidents ouverts existants avant
le cutover.

Pour le journal metier, l'ID d'evenement inclut la version de transition ou
l'`updateTime`; l'ID d'incident seul ne suffit pas, sinon l'evenement de
fermeture entrerait en collision avec l'evenement d'ouverture.

Cloud Monitoring conserve les canaux existants. Le canal Pub/Sub configure
n'a actuellement aucun consommateur local prouve et n'alimente donc pas le
resume Firestore. Une policy `LogMatch` declenche sur le log d'erreur lui-meme;
son rate limit d'une heure est un anti-repetition, pas un polling. D0 verifie les
destinataires et mesure le bruit avant de le reduire, par exemple a cinq
minutes.

### 7.4 Pannes silencieuses: watchdog de dernier recours

Un modele 100 % evenementiel ne detecte pas qu'un evenement attendu n'est
jamais arrive. Un inventaire D0 doit toutefois eviter de scanner deux fois le
meme risque.

Les reservations, l'outbox et les liens de paiement possedent deja des workers
de reprise toutes les deux minutes, des logs `worker_incomplete` et/ou des
policies d'absence de heartbeat. Un second scheduler Firestore qui les rescane
par defaut est interdit.

Le watchdog nouveau est limite aux trous de couverture prouves, par exemple:

- webhook reste `received` ou `processing` sans recuperation equivalente;
- projection versionnee cesse d'avancer alors que son document source expose
  une revision plus recente; orders est controle par recomptage nocturne, pas
  par l'`updateTime` natif de la collection;
- resume d'incident cesse d'avancer alors qu'un incident materialise change.

Couverture cible:

1. conserver les alertes Monitoring d'absence de heartbeat deja presentes;
2. reutiliser les workers metier existants pour leur propre recuperation;
3. lorsque la source expose une deadline, utiliser une requete indexee ciblee
   `where(deadline <= now).limit(1)`;
4. pour une source versionnee, comparer uniquement ses documents de revision ou
   watermarks explicites; ne pas inventer une query uniforme sur `deadline`;
5. ne lire le detail que si le premier candidat existe;
6. ouvrir un incident deterministe au premier constat;
7. fermer l'incident lorsque la reprise prouve la convergence;
8. conserver une reconciliation nocturne ou manuelle bornee aux projections
   explicitement listees.

Cadence maximale proposee pour les seuls probes nouveaux: 15 minutes. Si D0 ne
trouve aucun trou, aucun nouveau Scheduler n'est cree. Les schedulers metier
qui traitent les expirations conservent leur propre cadence et leur
idempotence; le watchdog observe, il ne remplace pas leur travail.

### 7.5 Decomposition du reconciliateur horaire

La Function actuelle ne doit pas etre simplement supprimee. Elle est decomposee
apres qualification en quatre responsabilites:

```text
commerceIncidentProjector
  - evenementiel
  - ouvre/actualise/ferme les incidents explicites

commerceStallWatchdog
  - cadence 15 minutes
  - uniquement les trous non couverts
  - requetes overdue limitees
  - aucune reconstruction financiere

commerceProjectionReconcile
  - nocturne et manuel
  - finance: compare les totaux a des aggregations sur les faits immuables
  - orders: compare le resume aux quatre `count()` bornes existants
  - ne scanne les commandes/ledgers pour reparation qu'apres divergence
  - repare uniquement avec preconditions et digest

commerceDocumentRepair
  - manuel ou nocturne borne apres incident `document_missing`
  - aucune invocation sur chaque mutation de commande ou de fait
```

La reconciliation privilegie `sum()` et `count()` par devise et type de fait,
avec Query Explain. Elle ne relit ni 366 jours ni tous les faits lorsque les
aggregations serveur suffisent. La reconstruction des 366 jours, la reparation
des documents et le diagnostic de sante ne partagent plus la meme invocation.
Lorsqu'elle repare `commerce_financial_totals/EUR`, elle republie ensuite la
projection finance absolue avec la meme garde `sourceUpdateTime`; une
reparation ne peut pas laisser Stats sur une ancienne valeur.

Pour orders, `buildAdminOrderSummary()` reste un audit nocturne ou manuel,
jamais un reader de Stats. Ses quatre aggregations detectent une divergence a
faible cout au volume courant. Une divergence declenche alors un dry-run
pagine des commandes et ledgers; le resume et les ledgers ne sont repares
qu'apres digest et preconditions.

Ces quatre responsabilites sont des contrats, pas l'obligation de deployer
quatre nouvelles Functions. Les handlers et schedulers existants sont
reutilises lorsque cela evite une invocation ou un owner supplementaire.

Le job historique `commerceOperationsReconcilerGen2` reste deploye et
reactivable pendant la fenetre de comparaison. Son Scheduler n'est desactive
qu'apres preuve des remplacements et couvertures effectivement retenus, avec
rollback documente.

## 8. Estimation relative des couts

Les valeurs sont des plafonds architecturaux, pas une facture. Elles devront
etre confirmees par Firebase Usage et, pour les requetes critiques, Query
Explain.

### 8.1 Ouverture de Stats

Etat actuel potentiel:

| Source | Plafond par ouverture |
| --- | ---: |
| `sales_stats_daily` | 366 documents |
| `commerce_financial_daily` via callable | 366 documents |
| `analytics_sessions` | requete refusee par les Rules versionnees; 500 non prouves |
| commandes recentes | 5 documents |
| documents KPI/systeme | plusieurs |
| aggregations orders | 4 requetes d'index |
| onglets invisibles | plusieurs callables et pages bornees |

Le chemin autorise approche deja 740 lectures de documents ou lots d'index au
plafond normal, avant certains prechargements. Le fallback legacy de 300
commandes peut le pousser au-dela de 1 000. La valeur `1 200` n'est pas
retenue comme baseline tant que D0 n'a pas prouve un drift de Rules autorisant
les 500 sessions.

Etat cible:

| Source | Cout initial cible |
| --- | ---: |
| query critique `admin_dashboard` | 3 documents |
| registre admin lu par Rules | 1 document dependant pour cette requete |
| `admin_incident_summary/current` | 1 document |
| registre admin lu par Rules pour le resume | 1 document dependant |
| historique/insights bruts | 0 |

Objectif: environ 6 lectures critiques par ouverture, et dans tous les cas
moins de 10. Une lecture unique d'`insights` et le listener borne des cinq
commandes recentes arrivent ensuite seulement si leur panneau est demande.

Un listener facture le snapshot initial puis chaque document ajoute, modifie ou
retire de son resultat. Les lectures dependantes des Rules peuvent etre
refacturees lors d'une mise a jour, d'une reconnexion, d'un changement de Rules
ou du document dependant. Une reconnexion peut aussi etre facturee comme une
nouvelle requete selon la persistance et la duree de deconnexion; ces couts
doivent figurer dans la mesure, pas etre presentes comme du cache gratuit.

### 8.2 Systeme sain sans admin connecte

Etat actuel:

- 24 runs du reconciliateur par jour;
- jusqu'a 366 jours relus par run;
- page de commandes et faits relus;
- requetes de sante;
- ecritures d'etat et d'incidents derives.

Etat cible:

- zero invocation de lecture pour une erreur explicite inexistante;
- policies Logging/Monitoring en attente de signal;
- watchdog uniquement sur les trous prouves; avec `Q` probes toutes les
  15 minutes, le plancher est `Q * 96` lectures de requete vides par jour;
- insights 30 jours: `30 * R` lectures de rollups par jour, ou `R` est le
  nombre de runs dont le digest source a change, avec un plafond de 96 runs et
  donc 2 880 lectures/jour; D0 doit mesurer `R` avant cutover;
- orders: quatre aggregations `count()` par reconciliation nocturne; un scan
  de documents n'est autorise qu'apres divergence;
- controle borne une fois par nuit; scan de reparation uniquement sur
  divergence ou demande manuelle;
- une ecriture de projection par fait metier concerne;
- une ecriture d'incident uniquement a l'ouverture, evolution ou fermeture.

### 8.3 Cout des ecritures cible

| Evenement | Surcout cible |
| --- | --- |
| fait financier | deux lectures transactionnelles total/projection + au plus une ecriture absolue, dans le trigger existant |
| commande avec resume modifie | lecture transactionnelle ordre/ledger + ecriture resume/ledger |
| commande sans changement projete | zero transaction apres le no-op local |
| Auth ou publication catalogue | un merge du sous-domaine concerne seulement si sa revision change |
| session analytics fermee | pipeline sharde existant; insights reecrit seulement si le digest change |
| transition d'incident | ledger + resume transactionnels; aucun write pour `lastSeenAt` seul |

### 8.4 Pourquoi ne pas distribuer les compteurs maintenant

Les compteurs distribues Firestore augmentent le debit d'ecriture en repartissant
les increments, mais leur cout de lecture augmente avec le nombre de shards.
Le volume courant ne justifie pas ce mecanisme.

Le sharding retenu est logique par domaine (`finance`, `orders`, `activity`,
`insights`) afin d'eviter qu'un changement de sante ou d'analytics ne reecrive
les finances. Un sharding physique des compteurs ne sera introduit que si un
test de charge demontre une contention sur un document.

## 9. Securite et confidentialite

- Toutes les projections sont globales, jamais par UID admin.
- `isStrongArtisan()` reste obligatoire: claim admin ou super-admin, Google ou
  passkey AAL2, registre actif.
- Les SDK clients ne peuvent ecrire aucun agregat ni incident.
- App Check reste initialise et son enforcement futur ne remplace pas Rules.
- Les projections ne contiennent aucune donnee personnelle.
- Les documents backend-only actuels restent backend-only.
- Le resume incident ne contient ni stack, ni payload, ni identifiant provider.
- La console detaillee conserve expurgation, audit fail-closed et lecture au
  clic.
- Un refus de projection ou de listener n'est jamais converti en zero.
- Aucune valeur monetaire n'utilise un flottant comme stockage autoritaire.
- Les logs de notification ne doivent pas contenir orderId, e-mail, IP, token,
  adresse ou payload Stripe.
- Les champs de projection et de ledger lus uniquement par chemin exact sont
  exemptes des index single-field inutiles; seuls les champs des requetes
  watchdog conservent les index necessaires.
- Aucun TTL n'est applique aux projections courantes ni aux ledgers
  d'idempotence tant qu'un rejeu de source reste possible. Un TTL eventuel ne
  concerne que le detail d'un incident ferme apres validation de sa retention;
  il n'est jamais utilise comme deadline metier.

## 10. Fiabilite et invariants

### 10.1 Livraison au moins une fois

Les triggers Firestore et Eventarc peuvent etre rejoues. Chaque projecteur doit:

- utiliser un ledger ou une cle de commande stable;
- comparer `sourceUpdateTime`;
- appliquer un delta ancien/nouveau dans une transaction;
- tolerer un evenement deja traite;
- tolerer l'ordre inverse de deux livraisons;
- ne jamais decrementer un compteur sous zero;
- emettre un incident si une precondition de projection est impossible a
  prouver.

Les triggers critiques utilisent `retry: true`. Une erreur transitoire est
relancee; une erreur permanente de schema ou de donnee est classee, journalisee
une fois avec une cle deterministe et mise en quarantaine/fail-closed afin
d'eviter une boucle de retry couteuse.

Les valeurs actuelles `maxInstances: 1` et `concurrency: 1` ne sont ni
augmentees ni recopies aveuglement. Elles restent prudentes pendant le shadow;
seule la mesure du lag evenement -> projection et un test de contention peuvent
justifier un changement. `minInstances` reste a zero puisque aucune Function
n'est sur le segment `backOfficeReady -> KPI`. La callable de gate facturation
reste, elle, sur le chemin global tant qu'elle n'a pas satisfait la gate D5.

### 10.2 Fraicheur

Chaque document expose `updatedAt`, `revision` et une source. Seuils proposes:

| Projection | Seuil d'alerte |
| --- | --- |
| finance | aucune regression; alerte si une source financiere plus recente existe |
| orders | erreurs du trigger notifiees; completude verifiee par les quatre `count()` nocturnes |
| activity/users | aucune alerte temporelle; ledger + bootstrap Auth prouves avant cutover |
| activity/catalog | alerte si plus ancien que la release catalogue courante |
| insights | seuil fixe apres mesure du lag fermeture -> compaction, pas avant |
| incident summary | warning si revision inferieure a la derniere transition incident connue |

La fraicheur est determinee par comparaison de revisions propres a chaque
source et de `latestObservedSourceUpdateTime`, pas par un polling permanent du
navigateur. Un maximum de timestamp observe ne prouve jamais, a lui seul, la
completude d'une suite d'evenements non ordonnee.

### 10.3 Reconciliation

La projection evenementielle est la voie nominale. La reconciliation:

- detecte les divergences;
- compare nocturnement le resume orders a un recomptage absolu; elle ne tente
  pas d'interroger l'`updateTime` natif comme un champ de collection;
- produit un plan dry-run et un digest;
- ne repare qu'avec preconditions;
- preserve une valeur incrementale plus recente;
- journalise les documents compares et repares sans payload sensible;
- ne devient jamais la nouvelle voie nominale horaire.

## 11. Plan de migration ferme

### Gate D0 - Baseline read-only

- relever les documents actuels, schemas, updateTime et compteurs;
- compter commandes legacy/v2 par statut;
- recompter les comptes Auth eligibles et qualifier toute divergence de
  `sys_user_stats/current`;
- mesurer les documents journaliers et sessions effectivement lus;
- mesurer les appels et latences du chargement admin;
- confirmer que les Rules cloud refusent `analytics_sessions` comme les Rules
  versionnees et qualifier la requete actuelle comme bug ou drift;
- mesurer separement `Auth forte -> backOfficeReady` et
  `backOfficeReady -> KPI`;
- relever les couts du reconciliateur sur 24 heures;
- verifier les policies et canaux Monitoring actifs;
- cartographier, panne par panne, les workers, heartbeats, policies et trous de
  couverture avant d'autoriser un nouveau watchdog;
- produire des digests sans payload ni identite client.

Sortie: rapport borne, aucune ecriture.

### Gate D1 - Contrats de projection locaux

- definir schemas et validateurs purs;
- implementer projection absolue finance, deltas orders et merges activity;
- couvrir creation, transition, annulation, suppression, rejeu et desordre;
- couvrir capture, refund et refund reversal;
- couvrir schema legacy et v2;
- couvrir compteurs sous zero et baseline absente;
- couvrir resume incident open/update/close;
- couvrir tous les codes incidents emis par le depot, leurs categories et
  severites; code inconnu fail-closed;
- couvrir no-op avant transaction, tombstone de suppression et erreurs
  transitoires versus permanentes;
- couvrir rejeu et desordre create/delete du ledger utilisateurs;
- couvrir revisions independantes users/catalog et projection finance absolue.

Sortie: tests unitaires rouges puis verts, aucun cloud.

### Gate D2 - Rules et lecteurs UI locaux

- ajouter les collections projetees aux Rules;
- prouver lecture admin fort;
- refuser client, anonyme, admin retire et admin sans AAL2;
- refuser toute ecriture SDK, y compris super-admin;
- implementer la query allowlistee a trois documents, avec
  `includeMetadataChanges: true`, et la validation de snapshot;
- supprimer le rendu partiel des KPI;
- retirer le bandeau sante de Stats;
- ajouter le badge incident conditionnel;
- deferer historique, lecture unique insights, commandes recentes et onglets
  invisibles;
- prouver la purge memoire sur logout, changement d'UID et
  `permission-denied`.

Sortie: Emulator + tests UI/contrats, aucun cloud.

### Gate D3 - Bootstrap sandbox controle

- sauvegarde Firestore et preuve de restauration disponible;
- dry-run avec digest et commit exact;
- approbation litterale specifique au sandbox;
- ecriture bornee des compteurs et ledgers;
- recompte independant;
- bootstrap backend unique et pagine des 30 jours d'insights; cette lecture
  initiale n'est ni un reader client ni un scan periodique;
- bootstrap du ledger utilisateurs par UID depuis le listage Auth approuve,
  sans exposer les UID dans le rapport;
- bootstrap du ledger de resume depuis les incidents ouverts existants;
- zero e-mail, paiement, refund, restock ou changement de commande;
- nettoyage uniquement des fixtures explicitement creees par le harnais.

Sortie: projections sandbox initialisees, readers existants inchanges.

### Gate D4 - Shadow mode

- deployer les projecteurs nouveaux sans cutover UI;
- comparer nouvelle projection, callable actuelle et sources autoritaires;
- rejouer les memes evenements pour prouver l'idempotence;
- exercer au moins creation, paiement test, fulfillment, refund test et
  inscription/suppression d'un compte de fixture autorise;
- conserver une quiet-window sans divergence;
- conserver des chemins shadow distincts et un seul writer par resume;
- ne jamais afficher la projection si son schema ou sa fraicheur est invalide.

Sortie: manifeste de comparaison accepte.

### Gate D5 - Cutover Stats

- build App Hosting cible avec deploymentId unique;
- basculer uniquement Stats vers `admin_dashboard`;
- verifier ancien onglet, nouvel onglet et retour arriere;
- mesurer les deux segments de chargement, les lectures Firestore et l'absence
  de callables inutiles;
- interdire la fermeture de D5 si `Auth forte -> backOfficeReady` reste le
  goulet dominant ou si le p95 chaud global `Auth forte resolue -> KPI`
  depasse deux secondes; dans ce cas la gate facturation recoit un correctif
  cible, sans `minInstances` par defaut;
- mesurer `commit source -> projection -> callback onSnapshot` a chaud et a
  froid;
- verifier que Graphique charge ses donnees uniquement au clic;
- verifier que commandes recentes et insights ne chargent qu'apres les KPI;
- verifier que les onglets invisibles ne lisent rien au demarrage;
- rollback App Hosting exact disponible.

Sortie: Stats rapide et coherent sur sandbox.

### Gate I1 - Incidents evenementiels

- brancher les transitions explicites vers les incidents idempotents;
- figer et tester la table exhaustive `code -> severity/category`;
- passer le journal d'incident a `onDocumentWritten` et appliquer le ledger
  transactionnel;
- documenter la resolution de chaque categorie badgee;
- maintenir `admin_incident_summary/current`;
- tester notifications Logging/Monitoring sur erreur synthetique expurgee;
- prouver ouverture, deduplication, compteur, resolution et badge;
- verifier que la console detaillee reste a la demande;
- ne pas generer de notification pour un refus attendu ou une fixture
  explicitement neutralisee.

Sortie: signal push fonctionnel sans polling Stats.

### Gate I2 - Watchdog cible

- prouver d'abord que chaque probe nouveau couvre un trou non couvert;
- implementer uniquement ces requetes overdue indexees et `limit(1)`;
- requalifier, sans les dupliquer, les heartbeats et workers existants;
- tester chaque trou retenu et chaque panne deja couverte par Monitoring;
- prouver zero faux vert lorsque le worker ne produit plus d'evenement;
- mesurer le cout d'une journee saine.

Sortie: pannes silencieuses couvertes a cout borne.

### Gate I3 - Decomposition du reconciliateur

- deployer les responsabilites retenues sans imposer quatre nouvelles
  Functions;
- conserver l'ancien job disponible mais sans double effet;
- comparer les aggregations serveur nocturnes aux rollups incrementaux;
- prouver la reparation documentaire manuelle/nocturne bornee;
- observer au moins une fenetre complete de scheduler;
- desactiver l'ancien job seulement apres approbation et rollback prouve.

Sortie: aucun scan financier complet horaire.

### Gate C - Cloture

- comparer mesures avant/apres;
- fusionner les decisions durables dans les chapitres canoniques;
- mettre a jour `map.md`, Rules, indexes et inventaires Functions;
- verifier references et liens;
- supprimer ce plan temporaire;
- `git diff --check` et controle de secrets;
- ne laisser aucune roadmap successeur.

## 12. Strategie de tests

### 12.1 Projecteurs

- fonctions pures de normalisation et delta;
- property tests: somme des deltas egale recomptage absolu;
- rejeu identique;
- evenement ancien apres evenement recent;
- suppression/recreation;
- suppression suivie d'un rejeu absorbe par tombstone;
- transition payee -> expediee sans double comptage;
- annulation avant/apres paiement;
- refund partiel, total et reversal;
- baseline absente fail-closed;
- transaction concurrente et retry;
- erreur permanente sans boucle de retry ni blocage du paiement;
- schema inattendu fail-closed.
- table incident exhaustive et code inconnu `critical/unknown`.

### 12.2 Rules Emulator

- admin fort actif lit les deux collections projetees;
- admin sans AAL2 refuse;
- claim sans registre refuse;
- registre inactif refuse;
- compte client et anonyme refuses;
- toutes les ecritures clientes refusees;
- query `documentId() in ['finance', 'orders', 'activity']` autorisee;
- query collection libre, ID inconnu et futur document refuses.

### 12.3 UI

- aucun affichage `25 -> 81`;
- aucun montant manquant pendant que d'autres KPI sont deja finaux;
- cache local marque `Actualisation`;
- snapshot serveur marque `A jour`;
- document absent affiche `Indisponible`, pas zero;
- aucune insertion tardive du bandeau sante;
- badge incident absent a zero, visible au-dessus de zero;
- commandes recentes et insights absents du chemin critique;
- desabonnement des listeners a la deconnexion;
- changement d'UID sans fuite visuelle;
- reduced motion preserve.

### 12.4 Performance et cout

- instrumentation du nombre de lectures au chargement;
- test contractuel interdisant `limit(366)` sur le chemin critique et toute
  lecture dashboard directe de `analytics_sessions`;
- test contractuel interdisant le preload data des onglets invisibles;
- p50/p95 `Auth -> backOfficeReady` et `backOfficeReady -> KPI` sur plusieurs
  ouvertures froides et chaudes;
- p50/p95 `commit source -> projection -> callback onSnapshot`;
- cout watchdog sur 24 heures sans incident;
- cout d'une ouverture et fermeture d'incident;
- Query Explain des aggregations conservees pour audit/reconciliation.

### 12.5 Commerce et observabilite

- suites commerce unit/fault/resilience directement touchees;
- contrat App Check et Auth;
- tests de monitoring sans boucle recursive sur les logs Monitoring;
- absence de payload sensible dans incident, log, notification et UI;
- restauration de l'ancien scheduler;
- rollback App Hosting exact.

## 13. Criteres d'acceptation

### Dashboard

- moins de 10 lectures critiques par ouverture normale;
- zero lecture directe `analytics_sessions` par le dashboard;
- zero jour financier lu en vue `Bilan`;
- zero callable de sante bloquant Stats;
- KPI critiques affiches ensemble;
- p95 `backOfficeReady -> KPI serveur confirmes` inferieur a 700 ms sur
  sandbox chaud; `Auth -> backOfficeReady` est mesure et qualifie separement;
- p95 chaud global `Auth forte resolue -> KPI serveur confirmes` inferieur a
  deux secondes; D5 reste ouverte si la gate facturation domine encore;
- une capture/refund durable actualise finance sans scheduler;
- un changement de commande actualise la repartition sans `count()` a
  l'ouverture;
- apres commit de la projection, le callback du listener connecte arrive en
  moins d'une seconde au p95; le delai source -> projection est mesure a chaud
  et a froid et devient bloquant si son p95 chaud depasse cinq secondes;
- aucune divergence apres rejeu et quiet-window.

### Incidents

- aucune surface sante permanente dans Stats;
- erreur explicite notifiee sans attendre le watchdog;
- badge mis a jour sans polling periodique de l'admin;
- aucun nouveau cout de lecture lorsque le resume ne change pas, uniquement
  tant que connexion, Rules et document dependant restent inchanges;
- heartbeat absent et etat bloque detectes sans evenement source;
- reconciliation finance/orders bornee au plus nocturne ou manuelle;
- aucun scan des 366 jours toutes les heures;
- detail Cloud et timeline toujours charges a la demande.

### Securite

- aucune PII dans les projections;
- aucune ecriture SDK autorisee;
- registre, claim et AAL2 prouves par Emulator;
- aucune production ou Stripe live touches;
- aucun secret ou token dans les preuves.

## 14. Rollback

Le changement reste additif jusqu'a la cloture:

- les nouvelles collections ne remplacent aucune source autoritaire;
- la callable actuelle reste deployee pendant le shadow mode;
- l'ancien dashboard peut etre restaure par rollback App Hosting;
- l'ancien Scheduler reste descriptible et reactivable avec sa revision,
  son compte runtime et sa cadence connus;
- aucun ancien ledger n'est supprime pendant le cutover;
- une divergence affiche `Indisponible` fail-closed et declenche un rollback
  operateur par revision App Hosting ou flag global; le navigateur ne reactive
  jamais silencieusement l'ancien reader couteux;
- les nouvelles projections peuvent etre ignorees sans modifier les commandes,
  faits, paiements, stocks ou outboxes;
- toute suppression ulterieure exige recherche d'appelants, manifeste, quiet
  window et rollback digeste.

## 15. Risques et mitigations retenues

| Risque | Mitigation proposee |
| --- | --- |
| double increment Eventarc | ledger + transaction + `sourceUpdateTime` |
| contention sur un document | sharding logique; test de charge avant sharding physique |
| projection finance bloque un paiement | projection asynchrone absolue depuis le total autoritaire |
| capture multiple par commande | verifier invariant; ledger distinct si necessaire |
| listener expose une donnee interne | schema allowliste + Rules admin fort + tests Emulator |
| valeur cachee presentee comme fraiche | `fromCache` et libelle `Actualisation` |
| incident jamais ferme | `onDocumentWritten` + contrat de resolution + ledger/tombstone |
| panne silencieuse non detectee | Monitoring existant + watchdog reserve aux trous prouves |
| boucle alerte -> log -> alerte | filtres excluant les logs Monitoring deja en place |
| cout de listener | trois documents critiques bornes; insights one-shot; detachement au demontage |
| ancienne et nouvelle projection divergent | shadow mode, digest et fail-closed |
| scheduler retire trop tot | desactivation apres preuve des remplacements et rollback |

## 16. Decisions rendues par l'audit

1. `capturedOrderCount` compte les `orderId` uniques ayant au moins une
   capture reussie. Le panier moyen est le montant brut capture divise par ce
   nombre; remboursements et reversals ne changent pas le denominateur. Un
   panier net serait un KPI distinct.
2. Le ledger orders distinct est tolere pendant le shadow uniquement pour
   isoler le rollback. La cible durable ne conserve qu'un ledger; les
   tombstones ne sont pas expires tant que les rejeux restent possibles.
3. Fait financier et rollups financiers restent atomiques. La projection admin
   est asynchrone, absolue, idempotente et n'est jamais une condition de succes
   du paiement.
4. Aucune contention credible n'est prouvee au volume courant. Le sharding
   physique et les compteurs distribues sont refuses jusqu'a un test de charge
   qui les justifie.
5. Le chemin critique utilise une seule query allowlistee sur trois documents.
   `insights` est une lecture unique et paresseuse, pas un quatrieme document
   ecoute en permanence.
6. Aucun seuil `insights` n'est affirme avant mesure. Le pire cas nominal
   approche deja 65 minutes si la materialisation manque la compaction du meme
   run; Finance, orders et activity restent evenementiels.
7. Les erreurs runtime LogMatch/5xx restent Cloud-only. Le badge ne couvre que
   les incidents actionnables materialises; aucune passerelle
   Monitoring -> Firestore n'est ajoutee.
8. Une requete temporelle n'est admise que pour un trou de couverture prouve.
   Reservations, outbox, liens de paiement et heartbeats existants ne sont pas
   rescannes par defaut.
9. Quinze minutes est une cadence maximale acceptable pour les probes restants;
   le reconcile finance/orders devient nocturne ou manuel et utilise des
   aggregations serveur avant tout scan de reparation.
10. D0 doit verifier les destinataires reels. Le Pub/Sub configure n'a pas de
    consommateur local prouve; le rate limit LogMatch d'une heure est un
    anti-repetition a mesurer, pas une detection horaire.
11. Un incident badge a un contrat de fermeture et un ledger transactionnel.
    Un incident uniquement Cloud se ferme selon Cloud Monitoring et n'est pas
    miroir dans Firestore.
12. Les exact-path projections/ledgers evitent les index inutiles. Pas de TTL
    sur les documents courants ni les ledgers; TTL eventuel uniquement sur les
    details d'incidents fermes apres decision de retention.
13. Les gates minimales sont D0 a D5 pour Stats, I1 pour les incidents et I2/I3
    seulement pour les probes/remplacements effectivement retenus.
14. Les gates bloquantes sont moins de 10 lectures critiques,
    `backOfficeReady -> KPI` p95 sous 700 ms a chaud, callback listener p95
    sous une seconde apres projection et source -> projection p95 chaud sous
    cinq secondes. Le p95 chaud global `Auth forte resolue -> KPI` reste sous
    deux secondes afin de ne pas masquer la gate facturation.
15. L'ancien reader et l'ancien scheduler ne sont retires qu'apres bootstrap,
    shadow single-writer, quiet-window sans divergence, rollback exact et
    approbation sandbox. Aucun fallback client silencieux n'est conserve.

## 17. References techniques

Sources internes principales:

- `app/admin/AdminAppIsland.jsx`;
- `src/kit/admin/AdminDashboard.jsx`;
- `src/kit/admin/adminDataCache.js`;
- `src/kit/admin/AdminIncidentConsole.jsx`;
- `src/kit/admin/SystemIncidentConsole.jsx`;
- `functions/src/commerce/orderStats.js`;
- `functions/src/commerce/v2Operations.js`;
- `functions/src/commerce/domain/financialRollup.js`;
- `functions/src/commerce/domain/operationsHealth.js`;
- `functions/src/auth/userStats.js`;
- `functions/src/observability/businessEvents.js`;
- `scripts/configure-functions-gen2-g1-monitoring.mjs`;
- `firestore.rules`;
- `firestore.indexes.json`.

Documentation officielle:

- aggregations Firestore:
  <https://firebase.google.com/docs/firestore/query-data/aggregation-queries>;
- aggregations materialisees a l'ecriture:
  <https://firebase.google.com/docs/firestore/solutions/aggregation>;
- listeners temps reel:
  <https://firebase.google.com/docs/firestore/query-data/listen>;
- listeners temps reel a l'echelle:
  <https://firebase.google.com/docs/firestore/real-time_queries_at_scale>;
- facturation Firestore et Rules dependantes:
  <https://firebase.google.com/docs/firestore/pricing>;
- transactions et ecritures atomiques:
  <https://firebase.google.com/docs/firestore/manage-data/transactions>;
- triggers Firestore Gen2:
  <https://firebase.google.com/docs/functions/firestore-events>;
- retries Functions:
  <https://firebase.google.com/docs/functions/retries>;
- TTL Firestore:
  <https://firebase.google.com/docs/firestore/ttl>;
- compteurs distribues:
  <https://firebase.google.com/docs/firestore/solutions/counters>;
- alertes basees sur les logs:
  <https://docs.cloud.google.com/logging/docs/alerting/log-based-alerts>;
- alertes d'absence de metrique:
  <https://cloud.google.com/monitoring/alerts/metric-absence>;
- gestion des instances Functions:
  <https://firebase.google.com/docs/functions/manage-functions>.
