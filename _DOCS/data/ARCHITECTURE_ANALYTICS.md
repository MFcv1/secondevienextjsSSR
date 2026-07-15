# Architecture du moteur analytics

Derniere decision: 2026-07-15  
Statut: `REFERENCE_ARCHITECTURE_APPROUVEE_A_IMPLEMENTER`  
Proprietaire: domaine donnees/analytics  
Parent canonique: [DONNEES_ANALYTICS.md](DONNEES_ANALYTICS.md)

Ce document est le contrat technique detaille du moteur analytics. Il a ete cree a la demande explicite du proprietaire du projet. Il ne remplace pas le chapitre canonique du domaine: `DONNEES_ANALYTICS.md` conserve l'etat reel, les collections actives et les decisions d'exploitation.

Il doit etre mis a jour dans le meme changement que toute modification de:

- protocole de collecte ou de session;
- schema Firestore analytics;
- source d'identite, geolocalisation ou consentement;
- calcul des rollups et visiteurs uniques;
- source des trois vues `Vue d'ensemble`, `Parcours` et `Sessions`;
- retention, cout cible, gate BigQuery ou controle d'acces.

## 1. Decision

La direction proposee est validee, mais pas sa premiere formulation sans amendements.

Sont valides:

- un collecteur global leger fonde sur les routes Next;
- une collecte independante de la connexion Firebase Auth;
- des lots d'evenements bornes et idempotents;
- une racine de session legere avec details charges a la demande;
- des rollups journaliers compactes pour ne plus relire des milliers de sessions;
- une identite pseudonymisee, une geolocalisation approximative et aucune IP brute dans le stockage analytics normal;
- un E2E synthetique isole par `testRunId`;
- une preparation explicite a BigQuery sans l'activer prematurement.

Les corrections obligatoires sont:

1. deux modes de mesure distincts pour ne pas melanger audience minimisee et parcours individuels consentis;
2. une session technique par onglet, avec identite navigateur partagee seulement quand le mode l'autorise;
3. un protocole `batchId + tabSessionId + seq`, pas un simple tableau ecrase au dernier write;
4. une finalisation revisable avec reconciliation, pas une confiance aveugle dans `pagehide` ou un beacon;
5. des shards configurables et des cartes strictement bornees, pas quatre documents quotidiens monolithiques;
6. des visiteurs multi-jours estimes par sketch fusionnable, jamais presentes comme un exact;
7. des paiements et conversions durables produits par les sources metier serveur;
8. trois indicateurs de qualite technique, jamais un score de confiance attribue a une personne.

## 2. Etat reel avant implementation

Au 15 juillet 2026, le moteur actuel ne constitue pas une analytics fiable:

- `src/kit/shared/AnalyticsProvider.jsx` n'est monte dans aucune route ou layout;
- meme monte, il attend un utilisateur Firebase alors que le trafic public a `user: null`;
- la taxonomie utilise encore un ancien etat SPA au lieu de la route Next native;
- seuls `quote_start` et `quote_email_opened` sont emis, sans listener actif;
- aucun favori, panier, checkout ou paiement n'alimente effectivement le pipeline;
- les trois vues actives chargent le meme lot pouvant atteindre 5 000 racines de sessions sur un an;
- `Parcours` et `Sessions` se limitent aux 16 dernieres etapes de preview;
- aucun lecteur actif ne consomme les collections `*_daily` existantes;
- les rollups par trigger incrementent sans ledger transactionnel global et peuvent doubler en cas de nouvelle livraison;
- l'identite actuelle est un SHA-1 tronque de `IP|User-Agent`, sans secret;
- IP, e-mail et User-Agent complet sont stockes dans la racine;
- la geolocalisation utilise une API tierce en HTTP;
- le beacon n'a ni App Check verifie ni jeton de possession de session;
- la liaison apres connexion se fait par IP et peut attribuer les sessions d'autres personnes derriere un NAT;
- le checkpoint admin peut serialiser des documents sensibles dans `localStorage`.

La V3 demarre donc une nouvelle epoque analytique. Les rollups V2 ne doivent pas etre consideres comme une base exacte ni fusionnes silencieusement avec la V3.

## 3. Objectifs et non-objectifs

### 3.1 Objectifs

- mesurer pages, categories, produits et transitions avec une taxonomie stable;
- mesurer favoris, panier, devis, checkout et paiement avec une source qualifiee;
- fournir une vue d'ensemble rapide, des parcours agreges et des sessions detaillees paginees;
- survivre aux retries, a l'offline, aux lots hors ordre, aux rechargements et aux fermetures absentes;
- connaitre et afficher la couverture, la fraicheur et les limites de la donnee;
- conserver un cout Firestore proportionnel aux sessions, pas aux ouvertures du dashboard;
- permettre une suppression et une rotation de secrets controlees;
- garder les pages publiques ISR et leur HTML independants du collecteur.

### 3.2 Non-objectifs

- fingerprinting du terminal;
- localisation GPS ou adresse physique;
- publicite, suivi inter-sites ou enrichissement par des data brokers;
- profilage d'un client pour modifier prix, paiement, acces ou devis;
- attribution marketing multi-touch exhaustive dans Firestore;
- remplacement d'un data warehouse pour les requetes ad hoc complexes.

## 4. Deux modes de mesure obligatoires

La conformite exacte dependra de la configuration finale et d'une validation juridique. Le nom `audience_minimized` signifie que le mode est concu pour viser le cadre le plus limite; il ne constitue pas, a lui seul, une declaration d'exemption de consentement.

| Contrat | `audience_minimized` | `product_analytics_consented` |
| --- | --- | --- |
| Finalite | audience, navigation, ergonomie, capacite | analyse produit et parcours individuel |
| Activation | configuration juridiquement validee, information et opposition requises | consentement explicite, versionne et retirable |
| Identifiant | identifiant audience first-party separe, ou mesure ephemere si aucun traceur n'est autorise | IUD produit first-party aleatoire |
| UID Firebase | interdit | liaison autorisee apres verification serveur et consentement |
| Parcours individuel en admin | interdit | oui, pendant la retention detaillee |
| Acquisition | domaine referent et categories allowlistees | parametres allowlistes; jamais URL/query brute |
| Commerce | KPI serveur agreges, sans attribution individuelle | attribution au parcours si consentie |
| Sortie | rollups agreges et cellules de cardinalite suffisante | rollups + sessions detaillees bornees |

Consequences UI:

- `Vue d'ensemble` et `Parcours` peuvent inclure l'audience minimisee et les KPI metier agreges;
- `Sessions` ne liste que le trafic detaille autorise;
- l'interface affiche `couverture des sessions detaillees = sessions consenties / sessions mesurees`;
- chaque requete et chaque rollup porte `measurementMode`;
- deux populations ne sont jamais additionnees silencieusement;
- le retrait du consentement arrete la collecte detaillee et declenche la suppression associee.

## 5. Autorite de chaque donnee

| Donnee | Source autoritaire | Regle |
| --- | --- | --- |
| route/page | route Next normalisee cote collecteur | jamais URL ou query string brute |
| heure de reception | serveur | `receivedAt` prime pour les controles |
| ordre de navigation | `tabSessionId + seq` | jamais deduit uniquement du timestamp |
| duree active | visibilite/focus client valides et cumules | separee du temps mural |
| UID connecte | token Firebase verifie cote serveur | jamais accepte depuis un champ client |
| e-mail | aucune source analytics | ne pas stocker dans analytics |
| IP | requete recue derriere un proxy Google valide | ephemere, jamais autorite d'identite |
| ville | resolution GeoIP serveur | `city_approx`, jamais position exacte |
| favori/panier observe | interaction client allowlistee | signal d'usage, pas preuve financiere |
| devis consulte/demarre | collecteur client | distinguer intention et demande recue |
| devis durable | futur workflow serveur/CRM | idempotence metier obligatoire |
| commande/paiement | commande et webhook Stripe serveur | aucun `purchase` client ne compte du CA |

## 6. Vue d'architecture

```text
Pages Next ISR/SSR
  -> AnalyticsCollectorIsland [C, leger, usePathname]
       -> file locale bornee de lots non acquittes
       -> POST same-origin /api/analytics/* [API]
            -> validation schema + mode + possession + App Check
            -> identite/geo pseudonymisees [S]
            -> analytics_sessions_v3 + chunks [DB]
                 -> finaliseur/reconciliateur [F]
                 -> analytics_session_facts_v3 [DB]
                 -> rollups journaliers shards [DB]
                 -> compaction D+2 et mensuelle [F]

Commandes / wishlist / devis durable / Stripe webhook [S/F]
  -> faits metier idempotents
  -> rollups de conversion

Admin Data [C]
  -> Vue d'ensemble: compacts quotidiens/mensuels
  -> Parcours: transitions et funnel compactes
  -> Sessions: endpoint admin pagine + chunks a la demande
```

### 6.1 Frontiere d'ingestion retenue

La facade primaire est un Route Handler Next same-origin. Ce choix:

- n'impose pas Firebase Auth ou Firestore dans le bundle public;
- evite un CORS permissif;
- permet des cookies de capacite `HttpOnly`, `Secure`, `SameSite=Lax`;
- conserve les routes publiques statiques: seule la route API est dynamique;
- permet `fetch(..., { keepalive: true })` avec un corps borne.

Les travaux asynchrones, le finaliseur, la compaction et les sources commerce restent dans Cloud Functions. La liaison Auth peut utiliser une callable afin que l'UID provienne de `context.auth.uid`, ou un endpoint serveur qui verifie explicitement l'ID token Firebase.

Deux gates precedent l'implementation de cette facade:

1. confirmer la region reelle de Firestore et placer le compute au plus pres;
2. verifier en sandbox la chaine de proxy App Hosting avant de faire confiance a l'en-tete IP.

Si l'une de ces gates echoue, le meme protocole est porte par une Function HTTPS 2e generation regionalisee. Le client et le schema ne changent pas.

## 7. Collecteur Next

Le collecteur est un petit ilot client monte dans le layout racine et desactive sur `/admin`.

Invariants:

- `usePathname()` est la source des changements de route;
- les routes sont transformees en cles stables comme `home`, `gallery`, `category`, `product`, `quote`, `checkout`;
- seules des query keys allowlistees sont lues; e-mail, token, texte libre et URL brute sont rejetes;
- aucune navigation n'attend l'analytics;
- aucune erreur analytics ne bloque Auth, panier, devis ou paiement;
- aucun heartbeat n'est envoye si aucun delta utile n'existe;
- l'App Check web est charge paresseusement et mesure par le budget de performance;
- un lot non acquitte reste dans une file IndexedDB bornee et est rejoue avec le meme `batchId`;
- si la fermeture ne peut pas joindre le serveur, la reprise suivante envoie le lot; aucun endpoint non authentifie n'est ajoute pour sauver un beacon.

### 7.1 Onglets et sessions

- `browserSubjectId` peut etre partage entre onglets seulement dans le mode autorise;
- chaque onglet obtient un `tabSessionId` distinct dans `sessionStorage`;
- chaque onglet ecrit une racine Firestore distincte;
- deux onglets ne mettent jamais a jour la meme racine mutable;
- une `visit` regroupant plusieurs onglets sur une fenetre de 30 minutes est une vue derivee, pas la cle d'ecriture;
- l'inactivite nominale de session est de 30 minutes;
- la duree absolue maximale d'une session technique est de 24 heures.

### 7.2 Enveloppe d'evenement

```text
schemaVersion
eventId
batchId
tabSessionId
seq
eventName
routeKey
occurredAt
activeDeltaMs
context allowliste
measurementMode
consentVersion|null
synthetic
testRunId|null
```

`receivedAt` est ajoute par le serveur. La taille, le nombre d'evenements et les valeurs sont limites avant toute ecriture.

### 7.3 Taxonomie minimale

Pages:

- `page_view`;
- `gallery_view`;
- `category_view`;
- `product_view`;
- `wishlist_view`;
- `quote_view`;
- `checkout_view`;
- `account_orders_view`.

Actions:

- `favorite_add`, `favorite_remove`;
- `cart_add`, `cart_remove`, `cart_open`;
- `quote_start`, `quote_email_intent`;
- `checkout_start`;
- `order_created_server`, `payment_paid_server`, `refund_server`.

Les suffixes `_server` ne peuvent etre produits que par une source serveur authentifiee et idempotente.

## 8. Identite, IP et geolocalisation

### 8.1 Identite pseudonymisee

L'IUD est un alea first-party d'au moins 128 bits. Il ne derive pas du canvas, des polices, de l'ecran, du materiel ou du User-Agent.

Les identifiants stockes sont des HMAC-SHA-256 base64url complets, avec separation stricte des domaines:

```text
audienceSubjectId = HMAC(K_audience_epoch, siteId | audienceIud)
browserSubjectId  = HMAC(K_browser_epoch, siteId | productIud)
authSubjectId     = HMAC(K_auth_vN, projectId | context.auth.uid)
networkDayId      = HMAC(K_network_vN, utcDate | canonicalNetworkPrefix)
sessionTokenHash  = HMAC(K_session_vN, sessionId | opaqueToken)
```

Chaque document porte son `keyId`. Les secrets vivent dans Secret Manager avec IAM minimal. Un secret unique pour toutes les finalites est interdit.

Rotation:

- ecriture avec la cle N;
- lecture/suppression compatible N et N-1 pendant la fenetre de migration;
- aucune rotation ne relie silencieusement l'historique du mode audience;
- les anciennes cles sont conservees uniquement tant qu'elles sont necessaires a la verification ou l'effacement;
- les comparaisons de jetons utilisent un temps constant.

### 8.2 Jeton de possession

L'initialisation cree un jeton aleatoire de 32 octets. Seul son digest est stocke. Chaque append ou fermeture doit presenter la capacite correspondante, en plus des controles d'integrite disponibles.

`Origin` et `Sec-Fetch-Site` sont des controles complementaires, pas une authentification.

App Check:

- verification sur chaque endpoint d'ingestion des que l'enforcement production est autorise;
- phase preprod en observation pour mesurer faux negatifs et poids client;
- replay protection reservee aux endpoints qui la justifient, car elle ajoute latence et appels;
- App Check ne remplace ni le jeton de session, ni Auth, ni l'idempotence.

### 8.3 IP et ville

L'IP brute existe seulement en memoire pendant la requete:

1. extraction depuis la chaine de proxy Google validee;
2. normalisation IPv4/IPv6;
3. resolution GeoIP locale/offline de preference;
4. production de `country`, `region`, `city`, `accuracy: city_approx`;
5. reduction en prefixe reseau puis HMAC journalier;
6. suppression de la valeur brute avant l'ecriture et les logs.

Une API distante n'est acceptable qu'en HTTPS, avec DPA, region/transferts verifies, non-retention, timeout court et circuit breaker. Elle ne doit jamais bloquer la creation de session.

Le schema normal ne contient ni IP brute, ni IP masquee reversible. L'admin peut voir `Reseau 7F2A`, derive d'un identifiant pseudonyme court, et une ville marquee approximative.

Un eventuel signal de securite IP appartient a une collection separee, chiffree, auditee et TTL inferieur ou egal a 72 heures. Il ne nourrit pas les parcours analytics.

## 9. Protocole idempotent

### 9.1 Lots immuables

Chaque lot possede un `batchId` deterministe et immuable. Dans une transaction serveur:

1. verifier la session, le jeton, le mode et le schema;
2. lire `chunks/{batchId}`;
3. s'il existe, retourner le meme accuse sans increment;
4. sinon creer le chunk et mettre a jour la racine avec des operations monotones;
5. retourner le dernier `seq` accepte et l'etat de qualite.

Les lots `1, 3, 2` sont acceptes et reconstruits par `seq`. Une collision de `seq` avec un contenu different est rejetee et tracee comme anomalie.

### 9.2 Cycle de vie et donnees tardives

```text
open -> dirty -> provisional -> final
```

Champs de controle:

```text
eventVersion
aggregatedVersion
lastReceivedAt
closeHintAt
status
previousContributionHash
```

- `pagehide` ne produit qu'un indice de fermeture;
- un finaliseur traite une session apres environ 35 minutes d'inactivite;
- un lot tardif est accepte pendant 24 heures, incremente `eventVersion` et remet la session `dirty`;
- le reconciliateur calcule le delta entre le fait precedent et le nouveau;
- exacts, contribution et ledger sont ecrits atomiquement;
- D et D-1 restent provisoires;
- la compaction D+2 reconstruit une verite autoritaire;
- un traitement rejoue avec la meme version devient un no-op.

Les sketches d'uniques ne sachant pas soustraire proprement, une suppression ou correction destructive declenche une reconstruction du jour concerne a partir des faits encore autorises.

## 10. Schema Firestore cible

```text
analytics_sessions_v3/{sessionId}
  schemaVersion
  measurementMode
  consentVersion|null
  browserSubjectId|null
  authSubjectId|null
  networkDayId|null
  identitySource
  geo { country, region, city, accuracy }
  device { class, osFamily, browserFamily }
  acquisition { referrerHost, sourceClass }
  firstReceivedAt
  lastReceivedAt
  activeDurationMs
  pageViewCount
  eventCount
  eventVersion
  aggregatedVersion
  status
  outcome
  dataQuality
  synthetic
  testRunId|null
  keyIds
  expireAt

  chunks/{batchId}
    tabSessionId
    firstSeq
    lastSeq
    events[]
    activeDeltaMs
    receivedAt
    expireAt

analytics_session_facts_v3/{sessionId}
  factVersion
  dayKey
  measurementMode
  contribution bornee
  contributionHash
  synthetic
  expireAt

analytics_rollup_days_v3/{dayKey}
  config { shardCount, shardSchemaVersion, timezone, provisional }
  summary_shards/{shardId}
  product_shards/{productId__shardId}
  compact/{overview|paths|products}

analytics_rollup_months_v3/{monthKey}
  compact/{overview|paths|products}

analytics_admin_audit_v3/{auditId}
analytics_privacy_requests_v3/{requestId}
```

Toutes les collections obtiennent avant deploiement:

- rules explicites;
- index minimum justifie;
- exemptions pour tableaux, maps, HLL, contributions et `expireAt`;
- politique TTL;
- tests positifs et negatifs;
- budget de taille document.

Une TTL sur un parent ne supprimant pas ses sous-collections, la suppression des sessions doit couvrir explicitement les chunks.

## 11. Rollups et visiteurs uniques

### 11.1 Valeurs exactes

Apres reconciliation, sont exacts pour les evenements recus et valides:

- sessions techniques;
- pages et actions;
- transitions normalisees;
- duree active cumulee;
- commandes, paiements et remboursements serveur;
- devis durables lorsque leur workflow serveur existera.

### 11.2 Valeurs estimees

Les visiteurs uniques sur plusieurs jours utilisent un HyperLogLog fusionnable et versionne.

- precision cible initiale `p=12`, erreur standard theorique proche de 1,6 %;
- merge entre shards, jours et mois;
- affichage `environ` ou `≈` dans l'UI;
- aucune somme d'uniques quotidiens presentee comme unique multi-jours;
- pas de HLL par ville ou produit a forte cardinalite;
- tests statistiques reproductibles et tolerance documentee.

### 11.3 Shards et bornes

Le nombre de shards n'est jamais une constante universelle.

- candidat initial: 8 shards pour le resume incluant le sketch;
- valeurs autorisees: 4, 8 ou 16 apres load test;
- `shardCount` est fige pour une journee et versionne;
- augmentation si contention/retries/p95 depassent les seuils;
- diminution possible un jour suivant si le trafic reel le permet;
- les jours compactes ne relisent plus leurs shards.

Le shard resume contient uniquement des dimensions fermees et bornees:

- KPI globaux;
- classe d'appareil, familles OS/navigateur;
- pays/regions bornes;
- funnel normalise;
- transitions entre noeuds normalises;
- actions allowlistees.

Sont separes:

- produits: document journalier par produit et shard, puis top N compacte;
- villes: session consentie ou top N avec seuil de cardinalite et bucket `autres`;
- URL, texte libre et parametres non allowlistes: interdits;
- parcours produit-a-produit long tail: sessions detaillees ou futur BigQuery.

## 12. Sources des trois vues

| Vue | Source | Lecture cible | Exactitude visible |
| --- | --- | --- | --- |
| Vue d'ensemble | compacts quotidiens/mensuels + shards du jour | chargement initial puis refresh maitrise | exacts + uniques `≈`, fraicheur, mode |
| Parcours | compact `paths`, transitions/funnel bornes | meme cache que la vue d'ensemble | couverture, jour provisoire, `autres` |
| Sessions | endpoint admin pagine sur racines consenties | 25 racines, curseur; chunks au clic | couverture detaillee et chunks manquants |

Regles d'interface:

- un changement d'onglet ne relance pas les memes requetes;
- le cache partage connait sa fenetre et sa version de schema;
- seuls les agregats rediges peuvent etre caches dans `sessionStorage`;
- aucune session detaillee, IP, UID, token ou identifiant long n'est stocke dans `localStorage`;
- une session de plus de 16 etapes charge tous ses chunks par pagination;
- la liste affiche ville approximative, device, duree active, etapes, resultat et source d'identite pseudonymisee;
- toute donnee partielle, provisoire, estimee ou mise en cache est marquee.

Objectifs de lecture apres compaction:

- 30 jours: environ 29 compacts + shards du jour + 25 sessions, objectif inferieur a 100 lectures;
- un an: mois complets + jours de bord + page de sessions, objectif inferieur a 150 lectures;
- detail session: seulement ses 1 a 5 chunks courants.

## 13. Qualite de mesure

Le score actuel fonde principalement sur le ratio UID/IP est abandonne.

Trois indicateurs versionnes sont affiches:

1. `identity_resolution`: repartition compte verifie, IUD consenti, identifiant audience, fallback session;
2. `data_completeness`: lots acquittes, trous de sequence, fermeture/finalisation, chunks disponibles, fenetre complete;
3. `ingestion_integrity`: App Check, schema valide, duplications neutralisees, trafic synthetique/bot exclu, reconciliation.

Chaque indicateur expose:

- sa categorie (`forte`, `bonne`, `partielle`, `faible`);
- les raisons;
- la couverture et la taille d'echantillon;
- la version de formule.

Invariant:

> `analytics_quality_score` decrit la qualite technique de la mesure. Il ne decrit jamais la fiabilite d'un client et ne declenche aucune decision de prix, devis, paiement, remboursement ou acces.

Un futur score fraude ou risque serait un traitement separe avec finalite, base legale, transparence, revue humaine et analyse d'impact a evaluer.

## 14. Securite et acces admin

- aucun client n'ecrit directement dans les collections analytics;
- les champs serveur, identites et modes ne sont jamais surchargeables par le payload;
- les schemas sont allowlistes, bornes en taille et profondeur;
- les rollups rediges peuvent etre lus par un admin fort autorise;
- les sessions et chunks ne sont pas exposes en lecture Firestore directe generale;
- l'endpoint sessions exige Auth, registre admin actif, AAL2 recent et capacite `analytics_session_viewer`;
- detail, recherche, export, suppression et consultation de petits segments geographiques sont audites;
- les exports appliquent les memes redactions et limites que l'UI;
- les robots, admins, tests synthetiques et environnements sont classes avant rollup;
- les donnees `synthetic=true` sont exclues par construction, pas nettoyees seulement apres coup.

## 15. Retention cible

Les valeurs suivantes sont des limites techniques par defaut, a confirmer juridiquement avant production:

| Donnee | Retention cible |
| --- | --- |
| IP brute analytics | aucune persistance |
| `networkDayId` | 7 jours maximum |
| lots audience temporaires non exposes | 24 a 72 heures |
| sessions/chunks consentis | 90 jours |
| faits necessaires a reconciliation | 90 jours maximum |
| rollups quotidiens/mensuels | 13 mois par defaut |
| IUD first-party | 13 mois maximum, sans renouvellement automatique |
| logs securite IP separes | 72 heures maximum si actives |
| tests synthetiques | 7 jours maximum, rollups exclus |

La suppression par IUD/UID couvre toutes les versions de cle encore actives, les chunks, les faits, les audits autorises et les rollups reconstruisibles. Les commandes/factures suivent leur propre retention legale et ne sont jamais supprimees comme de simples analytics.

## 16. Cout et capacite

### 16.1 Situation actuelle

Si le collecteur V2 etait monte, une session courante de cinq etapes et deux actions pourrait depasser 25 a 40 ecritures a cause des documents par evenement, transactions de rate-limit, root updates et triggers. Une actualisation admin peut lire 5 000 sessions.

### 16.2 Budget V3

Formule indicative:

```text
ecritures par session =
  creation racine
  + 2 x nombre de lots (chunk + root)
  + fait/finalisation
  + shard resume
  + produits distincts touches
  + corrections tardives eventuelles
```

Budgets de conception:

- p50: 8 a 12 ecritures par session consentie typique;
- p95: au plus 16 ecritures hors parcours exceptionnel;
- aucun heartbeat sans delta;
- un lot vise 8 a 25 evenements et reste sous 32 Kio;
- dashboard 30 jours sous 100 lectures en regime compacte;
- toute vue admin sous 150 lectures hors pagination explicite;
- aucune requete de dashboard ne balaie les faits ou sessions brutes.

Le quota gratuit Firestore courant est de 20 000 ecritures et 50 000 lectures par jour pour une base eligible. Les prix et quotas sont verifies avant production, car ils varient selon produit, region et options. Le cout GeoIP peut depasser Firestore si le cache ou la base locale sont mal concus.

### 16.3 Alertes et gates de scale

Mesures obligatoires:

- ecritures p50/p95 par session;
- lectures par ouverture de chaque vue;
- taux de retry/abort des transactions de rollup;
- p95 ingestion et finalisation;
- taille p95/max des shards et compacts;
- taux de lots dupliques, hors ordre ou perdus;
- ecart reconciliation faits/rollups;
- taux de cache GeoIP et cout par resolution;
- couverture consentie et couverture geographique.

BigQuery devient le candidat principal si une condition persiste:

- plus de 100 000 sessions par jour ou environ 1 million d'evenements par jour pendant une semaine;
- besoin de croisements arbitraires ville x source x produit x periode;
- une vue necessite plus de 500 lectures Firestore;
- reconstruction recurrente de plus de 50 000 faits;
- retention ou analyse ad hoc des evenements bruts au-dela de Firestore;
- attribution multi-session complexe.

Ces seuils sont des gates d'exploitation du projet, pas des limites officielles de Firestore.

## 17. Migration V2 vers V3

1. fixer `schemaVersion: 3`, les nouveaux namespaces et un instant de cutover;
2. deployer rules, indexes, TTL, secrets et endpoints backend avant le collecteur;
3. activer le collecteur en shadow/synthetique et verifier les budgets;
4. activer les rollups V3 sans dual-rollup V2;
5. brancher Vue d'ensemble et Parcours sur les compacts V3;
6. brancher Sessions sur l'endpoint pagine V3;
7. marquer l'historique V2 `legacy/partial`, sans le fusionner dans les KPI exacts;
8. arreter les triggers V2 apres soak et rollback valide;
9. inventorier IP/e-mails/User-Agents historiques;
10. preparer une purge dry-run avec comptages, sauvegarde et impact rollups;
11. mettre a jour `DONNEES_ANALYTICS.md`, `map.md`, rules, indexes et gates au fil du code reel.

Un backfill exact V2 est impossible pour les sessions dont seuls les previews tronques subsistent. Aucun chiffre reconstruit ne doit etre presente comme exact.

## 18. Gates de validation

### 18.1 Unitaires

- taxonomie route Next et rejet des query keys sensibles;
- validation schema/taille/profondeur;
- HMAC par domaine, rotation N/N-1 et comparaison constante;
- canonicalisation IPv4/IPv6;
- calcul de duree active;
- ordre `seq`, transitions et lots hors ordre;
- merge HLL dans la tolerance annoncee;
- delta entre contributions;
- classification des sources commerce.

### 18.2 Integration/emulateurs

- meme lot envoye deux fois: aucun double compte;
- lots `1, 3, 2`: parcours final correct;
- collision de sequence differente: rejet et qualite degradee;
- fermeture absente: finalisation automatique;
- lot tardif apres rollup: delta correct;
- deux onglets: meme navigateur, deux sessions sans contention;
- session de plus de 16/24 etapes: aucune troncature silencieuse;
- TTL parent/chunks et suppression recursive;
- rules negatives et acces admin detaille;
- paiement client forge ignore, webhook durable compte une fois;
- trafic admin/bot/synthetique exclu;
- cout maximal par scenario mesure.

### 18.3 E2E sandbox

Avec un compte client non-admin dedie et un `testRunId`:

```text
Accueil -> Galerie -> Categorie -> Produit -> Favori
        -> Panier -> Devis -> debut formulaire
```

Verifier:

- route et actions dans l'ordre;
- meme visiteur pseudonyme quand le mode le permet;
- session detaillee visible seulement avec le mode consenti;
- compte lie uniquement apres Auth serveur;
- rollups Vue d'ensemble et Parcours concordants;
- rechargement/offline sans doublon;
- ville marquee approximative et aucune IP/e-mail dans Firestore;
- paiement non declare sans webhook;
- donnees synthetiques exclues des KPI puis nettoyables;
- lectures/ecritures conformes au budget.

### 18.4 Charge et exploitation

- load tests 4/8/16 shards;
- p95 et taux `ABORTED` documentes;
- Query Explain pour chaque requete admin;
- test minuit `Europe/Paris` et changements d'heure;
- reconciliation quotidienne faits versus rollups;
- alerte budget et quotas avant enforcement production.

## 19. Definition de done du moteur

Le moteur est considere fonctionnel seulement lorsque:

- le collecteur public est monte sans rendre les pages dynamiques;
- les evenements utiles sont emis par les vrais flux;
- les trois vues utilisent leurs sources dediees;
- idempotence, hors ordre, reprise et finalisation sont testes;
- paiements et conversions durables viennent du serveur;
- privacy modes, retrait et suppression sont operationnels;
- IP/e-mail/User-Agent brut ne sont plus ecrits;
- les couts observes respectent les budgets;
- l'E2E sandbox concorde dans les trois vues;
- docs, map, rules, indexes et retention correspondent au code deploye;
- aucun deploiement production n'a lieu avant validation juridique, App Check, alertes et rollback.

## 20. References officielles

- [Tarification Firestore](https://firebase.google.com/docs/firestore/pricing)
- [Bonnes pratiques Firestore](https://firebase.google.com/docs/firestore/best-practices)
- [Transactions et batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Compteurs distribues](https://firebase.google.com/docs/firestore/solutions/counters)
- [Triggers Firestore: ordre non garanti et livraison au moins une fois](https://firebase.google.com/docs/functions/firestore-events)
- [TTL Firestore](https://firebase.google.com/docs/firestore/ttl)
- [App Check pour un backend personnalise](https://firebase.google.com/docs/app-check/custom-resource-backend)
- [App Check Web et reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- [Integration Firestore vers BigQuery](https://firebase.google.com/docs/firestore/solutions/bigquery)
- [CNIL: solutions de mesure d'audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience)
- [CNIL: identifier et pseudonymiser les donnees personnelles](https://www.cnil.fr/fr/identifier-les-donnees-personnelles)
- [CNIL: profilage et decision automatisee](https://www.cnil.fr/fr/profilage-et-decision-entierement-automatisee)
- [Firebase: confidentialite et securite](https://firebase.google.com/support/privacy)
