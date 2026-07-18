# Audit des lectures et couts Firestore

Derniere mise a jour: 2026-07-18
Statut: `P1_PUBLIC_META_ET_ANALYTICS_IMPLEMENTES_CATALOGUE_POST_CUTOVER_MESURE`
Projet mesure: `secondevienextjsssr`

## 1. Objet et fin de l'audit

Ce document conserve la preuve de mesure demandee pour expliquer les lectures Firestore, puis choisir des optimisations qui ne degradent ni le temps reel ni la fiabilite du parcours analytics.

Il complete [DONNEES_ANALYTICS.md](DONNEES_ANALYTICS.md). Le code et les consoles Google Cloud restent les preuves finales. Une fois les optimisations mesurees avant/apres, les decisions durables doivent etre fusionnees dans le chapitre canonique et ce rapport peut etre classe comme historique dans Git.

L'audit ne doit jamais comparer directement:

- le compteur mensuel des appels Functions;
- le quota journalier des lectures Firestore;
- une fenetre glissante de 24 heures dans Usage Insights.

Ces compteurs ne portent ni sur la meme unite ni sur la meme periode.

## 2. Reponse executive

La hausse observee ne vient pas principalement des sessions analytics.

Sur la fenetre de 24 heures inspectee dans Firestore Usage Insights, 10 871 lectures non-streaming ont ete ventilees. Les principaux postes sont:

| Collection ou chemin | Lectures | Part du total ventile | Attribution actuelle |
| --- | ---: | ---: | --- |
| `artifacts/secondevie/public/data/furniture` | 7 592 | 69,8 % | catalogue public, SSR, prechargements et admin |
| `sys_admin_access` | 972 | 8,9 % | controles Rules et Functions admin |
| `artifacts/secondevie/public` | 705 | 6,5 % | lecture de `public/meta` par `publicCatalog` |
| `sys_metadata` | 296 | 2,7 % | configuration publique/admin |
| `analytics_sessions` | 105 | 1,0 % | moteur de sessions actuel, hors listeners |
| `analytics_sessions_v3` | 97 | 0,9 % | activite V3 residuelle dans la fenetre |

Les deux collections de sessions representent donc 202 lectures non-streaming, soit 1,86 % du total ventile. Le catalogue est le premier levier d'optimisation. Cela permet de reduire les lectures sans ralentir le bandeau live ni le suivi de parcours.

Limite importante: Usage Insights ne ventile pas les requetes streaming/listeners. Le listener du panneau Data et les notifications de ses mises a jour restent facturables, mais ne figurent pas dans les 202 lectures ci-dessus.

## 3. Sources de mesure et precision reelle

Il n'existe pas une source Google Cloud unique donnant a la seconde le cout facture, la collection, la requete et la cause metier.

| Source | Meilleure utilisation | Granularite/retard | Limite structurante |
| --- | --- | --- | --- |
| Firebase Usage | alerte quota journaliere | agrégé, retard possible | aucune attribution par collection |
| Firestore Usage Insights | attribution des operations par collection | fenetres jusqu'a 45 jours, retard de 1 a 2 h | exclut les requetes streaming/listeners; top 100 et echantillonnage possibles |
| Firestore Query Insights | empreintes des requetes non-streaming | pas de 10 min jusqu'a 4 jours, puis 1 h; retard de 1 a 2 h | exclut `Listen`, `GetDocument` et les listeners temps reel |
| Cloud Monitoring | correlation temporelle du volume global | echantillonnage environ toutes les 60 s, affichage jusqu'a environ 4 min plus tard | pas de dimension collection/requete |
| Cloud Audit Logs Data Access | chronologie RPC, methodes et listeners | horodatage evenementiel fin | desactive par defaut ici; volume et cout de logs; ne remplace pas seul le compteur facture |
| Cloud Billing export | montant facture par SKU/projet | retard de facturation | pas de collection ni de requete |
| logs applicatifs structures | attribution a une action metier et a un cache hit/miss | immediate | doit etre ajoutee au code sans ecrire de compteurs dans Firestore |

Sources officielles:

- [Firestore Usage Insights](https://cloud.google.com/firestore/native/docs/usage-insights)
- [Firestore Query Insights](https://cloud.google.com/firestore/native/docs/query-insights)
- [Surveiller l'utilisation Firestore](https://cloud.google.com/firestore/native/docs/monitor-usage)
- [Metriques Firestore dans Cloud Monitoring](https://cloud.google.com/monitoring/api/metrics_gcp_d_h)
- [Journaux d'audit Firestore](https://cloud.google.com/firestore/native/docs/audit-logging)
- [Configurer les journaux Data Access](https://cloud.google.com/logging/docs/audit/configure-data-access)

Conclusion d'acces: aucun CLI n'est necessaire pour lire ces tableaux. `gcloud` ou une API servent surtout a automatiser les exports. Le compte actuellement authentifie peut consulter Usage Insights, Query Insights, Monitoring et Logs Explorer. Pour voir chaque appel Data Access, il faut en plus activer `DATA_READ` pour le service Firestore/Datastore et disposer de `roles/logging.privateLogViewer` pour lire les journaux prives.

## 4. Mesures observees

### 4.1 Firebase Usage

Capture du 2026-07-16:

- Firestore: environ 15 000 lectures sur le quota journalier affiche;
- Firestore: environ 1 200 ecritures;
- Firestore: 2 suppressions;
- Functions: environ 13 000 appels sur la periode mensuelle affichee;
- cout projet affiche: 0,90 EUR.

Le compteur Functions ne doit pas etre rapproche numeriquement des 15 000 lectures: chaque appel peut produire zero, une ou plusieurs operations Firestore et les periodes sont differentes.

### 4.2 Usage Insights, fenetre de 24 heures

Fenetre consultee: environ 2026-07-15 02:50 a 2026-07-16 01:50, heure affichee par la console.

- lectures consolidees: 10 871;
- ecritures consolidees: 4 171;
- suppressions TTL: 3;
- detail principal: voir la table de la section 2;
- `analytics_admin_audit_v3`: 605 operations d'ecriture;
- `analytics_sessions`: 114 operations d'ecriture sur 142 documents;
- `analytics_sessions_v3`: 77 operations d'ecriture sur 103 documents;
- plusieurs collections de rollup V3 ont encore eu une activite faible dans cette fenetre.

L'ecart entre 10 871 et le compteur Firebase proche de 15 000 n'est pas une anomalie prouvee. Il est compatible avec:

- des fenetres horaires non alignees;
- le retard des consoles;
- les listeners streaming absents de Usage Insights;
- les limites de groupement/top 100 et l'echantillonnage documentes.

### 4.3 Usage Insights, fenetre de 6 heures

- lectures: 2 980;
- ecritures: 205;
- `furniture`: 2 364 lectures, soit environ 79,3 %;
- `analytics_sessions`: 105 lectures et 114 ecritures.

Cette fenetre confirme que le catalogue domine encore pendant les tests recents.

### 4.4 Query Insights

Sur 24 heures, les empreintes visibles incluaient notamment:

- une requete V3 par `measurementMode`, 571 executions et aucun resultat;
- une requete V3 de sessions obsoletes, 46 executions et aucun resultat;
- la requete du moteur actuel `analytics_sessions` par IP et session active, 15 executions et aucun resultat.

Le code actuel ne contient aucune reference a `analytics_sessions_v3`, `analytics_admin_audit_v3` ou aux rollups V3. La liste Cloud Functions/Cloud Run inspectee ne montre pas non plus de service V3 explicite. L'activite V3 de cette fenetre est donc classee `RESIDUELLE_A_IDENTIFIER`, par exemple un ancien bundle admin reste ouvert pendant la periode. Elle ne doit pas etre attribuee a une Function orpheline sans preuve Data Access.

### 4.5 Cloud Audit Logs

La requete suivante ne retourne aucun evenement sur 24 heures malgre l'activite Firestore:

```text
logName="projects/secondevienextjsssr/logs/cloudaudit.googleapis.com%2Fdata_access"
protoPayload.serviceName="firestore.googleapis.com"
```

Conclusion: les journaux Data Access `DATA_READ` ne sont actuellement pas actives pour le projet. Les activer est une mutation IAM/audit et peut produire un volume de logs facture. Cette activation doit etre courte, explicite et retiree apres le test.

### 4.6 Fenetre Data Access controlee du 2026-07-17

Une fenetre courte a ete executee sur le sandbox apres autorisation explicite. Seul `DATA_READ` a ete active pour `datastore.googleapis.com`; `DATA_WRITE` n'a pas ete active. Les journaux ont ete desactives a la fin et l'absence de configuration Datastore/Firestore a ete reverifiee dans la politique IAM.

Scenarios horodates en UTC:

- public, `23:24:58` a `23:25:10`: galerie, fiche produit, retour galerie, categorie;
- Admin Stats, `23:26:04` a `23:26:23`;
- ouverture Admin Data, `23:26:33` a `23:26:41`;
- actualisation manuelle Data, `23:32:32` a `23:32:40`;
- calibration volontaire, `23:30:58` a `23:30:59`: lecture bornee a un document de `analytics_admin_audit_v3`.

Attribution Data Access expurgee:

| Scenario | Methodes et collections observees | Conclusion |
| --- | --- | --- |
| public | `RunQuery` sur `furniture`; `BatchGetDocuments` sur `artifacts` et `sys_metadata` | aucun acces V3 |
| Admin Stats | `RunQuery` sur `furniture`; `BatchGetDocuments` sur `artifacts`, `sys_admin_access` et `sys_metadata`; listeners `orders` et `sales_stats_daily` | aucun acces V3 |
| ouverture Data | listeners `analytics_sessions` | aucun acces V3 |
| bouton Actualiser | listeners `analytics_sessions` uniquement dans la fenetre | aucun acces V3; l'historique etait reutilise depuis le cache local |
| calibration | un `ListDocuments` sur `analytics_admin_audit_v3`, `pageSize=1` | Data Access identifie bien la collection lorsqu'elle est reellement lue |

Un listener `analytics_sessions` etait deja actif avant le premier scenario, a `23:23:40`; ses evenements de flux ont ete classes comme bruit identifie et non comme lectures du parcours public. Aucun `ListDocuments` autre que la calibration volontaire n'a ete observe pendant toute la fenetre.

Correlation Cloud Monitoring disponible au moment du test:

- point termine a `23:26`: 61 lectures, compatible avec le parcours public et ses retours catalogue;
- point termine a `23:27`: 94 lectures et 2 ecritures pendant le chargement Admin;
- point termine a `23:28`: 51 lectures, compatible avec l'initialisation et les listeners Admin;
- aucun lot d'environ 300 lectures n'a ete reproduit par le code courant dans ces scenarios.

Conclusion fermee: `analytics_admin_audit_v3` n'est lue ni par le parcours public teste, ni par Stats, ni par Data, ni par son actualisation manuelle. La calibration prouve que Data Access aurait nomme cette collection sans ambiguite si elle avait ete touchee. Les anciens lots `ListDocuments` d'environ 300 restent donc attribues avec une forte probabilite a une surface externe au code courant, notamment un explorateur Firestore ou un ancien bundle V3 reste ouvert. L'attribution historique exacte ne peut pas etre declaree absolue tant que cette surface externe n'est pas reproduite avec le compte qui dispose de la lecture des documents.

### 4.7 Parcours telephone seul apres deploiement du catalogue Admin lazy

Le commit `9efe612` a ete deploye sur App Hosting avant cette mesure. La fenetre a ete scellee du `2026-07-17T00:22:30.486Z` au `2026-07-17T00:30:31.416Z`, soit 8 minutes et 1 seconde. Le scenario a ete realise uniquement depuis le telephone sur les pages publiques; aucun onglet Admin n'etait necessaire pour produire la charge.

Seul `DATA_READ` Firestore/Datastore a ete active. Il a ete desactive immediatement apres le test, puis l'etat desactive de `DATA_READ`, `DATA_WRITE` et des journaux d'activite Admin a ete reverifie dans la console IAM.

Le compteur Firebase agrege est passe d'environ 3,8 k a 4,2 k lectures et de 63 a 96 ecritures. La variation de lectures n'est pas un delta exact: les valeurs en milliers sont arrondies et les tableaux peuvent avoir du retard. Data Access donne l'attribution evenementielle plus fiable de la fenetre:

| Appel ou chemin | Appels Data Access | Documents retournes/lus | Interpretation |
| --- | ---: | ---: | --- |
| `RunQuery` sur `furniture` | 5 | 74 (`38 + 4 + 10 + 18 + 4`) | chargements de listes galerie/categorie |
| `BatchGetDocuments` sur `furniture/{id}` | 24 | 24 | fiches produit ouvertes ou resolues individuellement |
| `BatchGetDocuments` sur `artifacts/secondevie/public/meta` | 28 | 28 | version catalogue relue avant les acces publics |
| `BatchGetDocuments` sur `analytics_sessions/{id}` | 71 | 71 | validation du jeton avant chaque synchronisation de session |
| `BatchGetDocuments` sur `sys_metadata/admin_ips` | 2 | 2 | exclusion IP admin lors de l'initialisation/cold start |
| `BatchGetDocuments` sur `sys_metadata/gallery_app` | 1 | 1 | personnalisation de la galerie |
| **Total** | **131 RPC** | **200 lectures documentaires observees** | 126 appels directs + 5 requetes |

Repartition des identites techniques: 129 RPC ont ete emis par le service account Functions `secondevienextjsssr@appspot.gserviceaccount.com` et 2 par le service account App Hosting. Aucun appel `datastore.googleapis.com` separe n'a ete observe.

Conclusions de cette reproduction:

- le telephone seul suffit a produire un volume significatif; le panneau Admin Data n'est pas la cause de ce scenario;
- les acces catalogue representent 127 lectures sur 200, soit 63,5 %, en comptant listes, fiches, version et personnalisation; les 2 lectures restantes hors sessions concernent le controle d'IP admin;
- les synchronisations de session representent 71 lectures sur 200, soit 35,5 %; chaque heartbeat, changement de route ou beacon valide actuellement le jeton par une lecture avant l'ecriture;
- les images elles-memes sont servies par Storage/CDN et leur redecodage visuel ne consomme pas une lecture Firestore; ce sont les nouvelles resolutions de donnees catalogue lors des navigations qui sont mesurees ici;
- le delta Firebase arrondi proche de 400 ne doit pas etre presente comme 400 lectures exactes du telephone. La fenetre Data Access prouve 200 lectures documentaires attribuees; le reste apparent est compatible avec l'arrondi, le retard des compteurs et des operations hors bornes temporelles exactes.

Priorites prudentes issues de la preuve: reduire d'abord les 28 relectures de `public/meta` et la repetition des resolutions catalogue sans toucher au rendu ni aux images; instrumenter ensuite la raison de chaque synchronisation (`heartbeat`, `route`, `visible`, `beacon`) avant de modifier la cadence ou la validation de securite des 71 lectures de session.

### 4.8 Optimisations locales issues de la fenetre telephone

Le lot local du 2026-07-17 cible uniquement les deux couts redondants prouves en 4.7:

1. `public/meta` dispose maintenant d'un micro-cache en memoire de cinq secondes par instance `publicCatalog`, avec deduplication d'une lecture deja en vol. Cette fenetre courte absorbe les rafales metadata/page/prefetch sans remplacer les mecanismes de version, de revalidation et de cache catalogue existants.
2. La validation du jeton analytics conserve en memoire, pendant 60 secondes et au plus pour 1 000 sessions par instance Function, le hash autoritaire deja lu ou cree. Un cache miss ou une reprise de session reste autoritaire via Firestore. Une suppression de session n'est jamais recreee par le cache: l'update Firestore echoue toujours si le document a disparu.
3. Le heartbeat navigateur reste a 15 secondes en onglet visible, mais il est maintenant planifie 15 secondes apres la synchronisation la plus recente. Une route ou un retour visible repousse donc le prochain heartbeat au lieu de produire deux appels rapproches.
4. Une synchronisation non-heartbeat demandee pendant un appel en vol est mise en attente puis envoyee; un heartbeat devenu redondant pendant cet appel est abandonne. Le parcours route reste prioritaire.
5. Chaque ecriture de session transporte `lastSyncReason` et incremente `syncReasonCounts.<reason>` dans la meme operation Firestore. Cette instrumentation ne cree ni document de log, ni lecture, ni ecriture supplementaire.

Les raisons autorisees sont `init`, `route`, `affiliate`, `heartbeat`, `visible`, `visibility_hidden`, `beforeunload`, `pagehide` et `manual`. Aucune journalisation Cloud Logging par heartbeat n'est activee: l'attribution est disponible dans le document de session existant, avec un cout operationnel nul par rapport a l'ecriture deja necessaire.

Garde-fous conserves:

- cadence live visible de 15 secondes et seuil admin de 30 secondes;
- synchronisation immediate au retour visible;
- beacon de sortie et parcours complet;
- hash seul dans Firestore et comparaison timing-safe;
- reprise bornee par UID, jeton, age et statut admin;
- aucune modification du catalogue retourne, des images ou du rendu public.

Le gain exact n'est pas encore revendique. Le cache est local a une instance Function: un cold start ou un routage vers une autre instance provoque encore une lecture autoritaire. Une nouvelle fenetre Data Access apres deploiement doit comparer le meme parcours de huit minutes avant de fermer cette mesure.

## 5. Attribution au code

### 5.1 Catalogue public: source dominante

`functions-public/src/public/catalog.js` lit `artifacts/{appId}/public/meta` a chaque requete HTTP avant de consulter ses caches catalogue. La collection `public` n'a pas d'autre lecteur significatif trouve dans le depot. Les 705 lectures observees correspondent donc tres fortement au nombre d'invocations `publicCatalog` sur la fenetre.

Lors d'un cache catalogue froid, la Function lit ensuite les documents `furniture` retournes. Les principaux amplificateurs sont:

- home: jusqu'a 48 cartes;
- categorie: jusqu'a 120 cartes;
- admin dynamique: jusqu'a 120 cartes, meme pour ouvrir Stats ou Data;
- recherche: jusqu'a 120 produits avant filtrage;
- fiche produit: un document lors d'un cache froid;
- prechargement automatique des fiches visibles autour du viewport categorie;
- mega-menu qui precharge la route parente et ses enfants au survol/focus;
- scan d'inventaire complet apres une ecriture produit si le trigger de maintenance est sollicite.

Le cache HTTP repond avec `max-age=60`, `s-maxage=120`, le cache memoire Function dure cinq minutes et le cache Next revalide a cinq minutes. Un nouvel instance/cold start ou une nouvelle cle `scope/limit/categorie/cursor` peut toutefois relire les documents.

### 5.2 `sys_admin_access`

Les 972 lectures proviennent de deux familles:

- les Rules utilisent le registre pour autoriser les lectures admin protegees;
- les Functions sensibles relisent le registre a chaque callable admin.

`trackAdminIP` et `updateUserSessions` lisent aussi ce document a la connexion. Ce volume est un cout d'autorisation plausible, pas une fuite prouvee. Il ne faut pas supprimer ou cacher longtemps ce controle: la revocation admin immediate est un invariant de securite.

### 5.3 Moteur analytics actuel

Pour une session publique visible pendant une heure:

- heartbeat adaptatif au plus toutes les 15 secondes lorsque l'onglet est visible;
- un changement de route ou un retour visible repousse le prochain heartbeat de 15 secondes;
- un cache borne de 60 secondes reutilise le hash autoritaire du jeton dans une instance Function;
- un cache miss relit le document session, puis les synchronisations suivantes valident le jeton sans nouvelle lecture pendant la fenetre;
- chaque synchronisation utile conserve une ecriture de session afin de maintenir le live et le parcours;
- si Data est ouvert, chaque mise a jour du document peut provoquer environ une lecture supplementaire par panneau admin qui l'ecoute.

Le heartbeat est suspendu lorsque l'onglet public est masque. Le beacon marque la session inactive au masquage et une synchronisation immediate existe au retour visible. Les synchronisations rapprochees sont arbitrees cote navigateur: la route est conservee, le heartbeat redondant est abandonne.

La reprise reste une lecture autoritaire car elle doit verifier le UID, l'age, le statut et le jeton du document. Le cache ne remplace donc pas les controles qui dependent de l'etat complet de la session.

Pour l'admin Data:

- cache froid: historique `H` jusqu'a 5 000 plus listener initial `L` jusqu'a 100;
- cache IndexedDB valide de moins de six heures: listener `L` seulement;
- clic Actualiser: nouvelle lecture historique `H`;
- remount/reconnexion du listener: jusqu'a `L`;
- chaque document modifie dans le jeu ecoute: environ une lecture, et non 100.

### 5.4 Effets des tests locaux

Le localhost utilise actuellement le vrai projet Firebase. React Strict Mode peut remonter certains effets en developpement. Les onglets ouverts, HMR, prechargements et rechargements locaux peuvent donc consommer le quota sandbox. Pour les tests repetitifs, l'Emulator Suite doit devenir la cible par defaut.

## 6. Optimisations classees par risque

### P0 - deploye et mesure

Le lot du 2026-07-16 applique uniquement les changements dont le resultat fonctionnel reste identique:

1. `publicCatalog` rejette `limit`/`cursor` malformes avant la lecture de `public/meta`; un curseur valide est canonicalise avant de former la cle de cache.
2. L'appel normal de recherche demande 120 cartes, qui est deja la borne reelle de la Function, au lieu de creer une URL Next distincte avec `limit=160` silencieusement plafonnee. Le fallback Firestore direct reste a 160 pour conserver sa couverture en mode degrade.
3. Une carte categorie proche du viewport continue de chauffer ses images, mais sa route produit n'est prechargee qu'au hover, focus ou press.
4. Le mega-menu precharge seulement le groupe vise, puis chaque enfant au moment de son intention propre.
5. Le heartbeat analytics de 15 secondes est suspendu lorsque l'onglet est masque. Le beacon de masquage, le retour visible immediat, le seuil live de 30 secondes et le listener admin sont conserves.
6. `updateUserSessions` ne relit plus `users/{uid}` avant `sys_admin_access`, puisque cette lecture etait toujours ecrasee par le registre et ne pouvait changer le resultat.

Les gains ne sont pas convertis en promesse exacte avant une fenetre Usage Insights comparable. Ils ciblent les causes inutiles sans diminuer la cadence visible, la richesse des images, la navigation Next, l'exclusion admin ou la fraicheur catalogue.

### Decisions volontairement non appliquees dans le lot P0

- aucun cache long n'est ajoute autour de `public/meta`: le lot P1 limite volontairement sa fenetre a cinq secondes, tres inferieure aux caches HTTP/ISR deja actifs;
- aucun changement n'est revendique sur le menu global: l'ancien eventail de 20 routes audite appartenait a un composant non monte; le chemin actif conservait deja uniquement le prechargement du compte authentifie;
- le heartbeat visible et le listener temps reel ne sont ni ralentis ni supprimes;
- le fallback de claims de `trackAdminIP` reste en place tant qu'un test de propagation/revocation ne prouve pas qu'il peut etre retire sans refuser un admin legitime;
- la recherche vide continue d'afficher ses suggestions premium; la supprimer serait une regression UX, pas une optimisation neutre.

### P1 - progression mesuree

1. **Deploye et mesure le 2026-07-17**: `/admin` ne charge plus le catalogue sur Stats. Le catalogue court est demande uniquement par Data et Vue Globale, les deux consommateurs reels de `initialItems`; la requete est prechargee sur hover/focus, dedupliquee en vol, partagee en memoire et `sessionStorage`, puis purgee par l'invalidation catalogue existante. Publication et Studio conservent leurs lectures Firestore autoritaires sans ajouter une deuxieme lecture publique inutile. Le second chemin trouve dans `AdminDashboard` est egalement ferme: si `inventory_stats/overview` manque, Stats affiche une valeur catalogue indisponible au lieu de scanner jusqu'a 300 documents `furniture`. La reproduction telephone seul de la section 4.7 confirme qu'aucun onglet Admin n'est necessaire pour expliquer la charge publique restante; elle ne remet donc pas en cause la fermeture de cette lecture Admin inutile.
2. **Implemente localement le 2026-07-17**: micro-cache `public/meta` de cinq secondes avec deduplication en vol.
3. **Implemente localement le 2026-07-17**: cache borne du hash de jeton analytics, heartbeat adaptatif et arbitrage des appels concurrents, sans ralentir le live visible.
4. **Implemente localement le 2026-07-17**: raisons de synchronisation comptees dans l'ecriture de session existante. Cloud Logging par heartbeat est volontairement evite pour ne pas deplacer le cout vers les journaux.
5. Borner et purger `limitedCatalogCache`, qui conserve actuellement les anciennes versions et combinaisons categorie/cursor jusqu'a la destruction de l'instance.
6. Distinguer le `404` produit autoritatif d'une indisponibilite technique avant de supprimer les fallbacks Admin/REST.
7. Borner le listener Data aux sessions recemment actives tout en conservant l'historique separe; verifier l'index et le comportement de reconnexion.
8. Transformer Actualiser en synchronisation incrementale, avec recalcul complet explicite seulement lorsque necessaire.

### P2 - ne pas engager pendant ce correctif

- rollups haut trafic;
- agrégat inventaire incrementiel;
- pagination generale Returns/Newsletter;
- restructuration des Rules ou des collections;
- ralentissement du heartbeat visible;
- suppression du listener temps reel.

## 7. Protocole de mesure precise controlee

Decision du 2026-07-16: `DIFFERE_NON_NECESSAIRE_POUR_P0`.

Data Access n'est pas requis pour les premieres optimisations, car Usage Insights et le code attribuent deja la majorite des lectures au catalogue. Il sera active uniquement si, apres la passe P0, l'un des criteres suivants reste vrai:

- l'ecart entre le total Firebase/Monitoring et les collections ventilees reste superieur a 20 % sur deux fenetres comparables;
- les lectures continuent de croitre lorsque le catalogue est au repos;
- le panneau Data montre des reconnexions, doublons ou pertes de live que les metriques agregees n'expliquent pas;
- une decision sur la frequence heartbeat/listener exige une preuve evenementielle.

Ce que Data Access apporterait alors:

- l'horodatage de chaque RPC `GetDocument`, `RunQuery` et `Listen`;
- l'identification des ouvertures, mises a jour periodiques et fermetures d'un meme listener via son operation ID;
- la distinction entre appel navigateur, Function et action admin lorsque l'identite et les metadonnees le permettent;
- la correlation d'un scenario controle avec le pic Cloud Monitoring a la minute.

Ce qu'il n'apporterait pas seul:

- un montant en euros par requete;
- une equivalence toujours directe entre un evenement de log et le nombre facture de lectures documentaires;
- l'attribution metier d'un cache hit/miss sans logs structures dans l'application.

Le CLI `gcloud` n'est pas un prerequis et ne debloque aucune granularite supplementaire. Il ne serait utile que pour automatiser l'activation, l'export et la restauration de la politique. La console web authentifiee suffit pour une fenetre manuelle.

Prerequis avant activation future:

- autorisation explicite de modifier la politique d'audit du projet `secondevienextjsssr`;
- permission IAM permettant `setIamPolicy` et role `roles/logging.privateLogViewer` pour relire les journaux prives;
- budget et retention de logs bornes;
- fermeture des anciens onglets publics/admin afin d'eviter les signaux parasites;
- interdiction de committer des IP, jetons, e-mails ou payloads complets extraits des logs.

Pour attribuer les listeners et les appels a une action utilisateur, utiliser une fenetre Data Access de 30 minutes maximum:

1. fermer les anciens onglets du site/admin et noter l'heure de depart;
2. activer `DATA_READ` pour `datastore.googleapis.com`/Firestore au niveau projet;
3. attendre la prise en compte de la politique;
4. executer separement trois scenarios de cinq minutes:
   - galerie/categorie/produit sans admin ouvert;
   - session publique avec Data ouvert;
   - navigation admin sans visite publique;
5. filtrer les logs par methode, operation ID, principal et intervalle;
6. comparer les pics a la minute dans Cloud Monitoring;
7. attendre Usage Insights pour confirmer les collections;
8. desactiver `DATA_READ` immediatement apres le test;
9. conserver un export JSON expurge de tout token/IP complete dans les artefacts ignores, pas dans Git.

Cette fenetre exige une autorisation explicite car elle modifie la politique d'audit et peut avoir un cout de journalisation.

## 8. Gates avant/apres

Avant toute optimisation:

- fixer une fenetre et un scenario reproductible;
- relever `read_ops_count` et `write_ops_count` Monitoring;
- relever Usage Insights par collection apres son retard normal;
- verifier le bandeau live, les parcours, la reprise de session et l'exclusion admin.

Apres chaque changement P0:

- meme scenario et meme duree;
- comparer lectures, ecritures, appels Functions et latence live;
- refuser le changement si une session visible met plus de 30 secondes a disparaitre ou si un parcours se perd;
- ne deployer qu'apres validation du build et du smoke cible sur sandbox.

## 9. Etat historique des lots conservateurs au 2026-07-17

Le lot P0 catalogue/admin avait ete deploye et mesure. A cette date, le lot P1 `public/meta` et analytics etait encore uniquement local; cet etat historique est remplace par le cutover deploye et la preuve finale des sections 10.1 et 10.2.

Validations passees:

- `test:firestore-cost`: 3 tests, 3 reussis, dont expiration/borne du cache de jeton, micro-cache metadata et cadence adaptative;
- contrat de fiabilite analytics: reussi;
- verification syntaxique des Functions modifiees: reussie;
- ESLint cible: 0 erreur; trois avertissements de dependances hooks preexistants dans `AnalyticsProvider`;
- build Next 15.5.20: reussi, 53 pages statiques generees;
- `git diff --check`: reussi, hors avertissements CRLF du poste Windows.

Cette validation a ete fermee le 2026-07-18 par la fenetre Data Access post-retrait legacy de la section 10.2.

## 10. Catalogue materialise deploye le 2026-07-18

Le sandbox sert les lectures publiques catalogue depuis un snapshot immuable Storage via `/api/catalog`. Cette source est unique: les selecteurs legacy/canary et le fallback Firestore ont ete retires du code local le 2026-07-18. Les mutations `furniture` sont regroupees par trigger/outbox/Cloud Tasks; le builder effectue un scan de l'etat final par lot publie, et non un scan par visiteur ou par ecriture.

Preuves deja acquises:

- plus de 20 builds shadow sans divergence contractuelle;
- creation, changement de prix, stock a zero et suppression reproduits;
- publication/revalidation et manifests/hashes valides;
- CDN same-origin: 40 requetes, ETag stable et 100 % de hits apres echauffement;
- API et routes publiques servies sur une revision saine (41 au controle final, valeur monotone);
- checkout loa.gto sans paiement bloque et actualise le total lorsqu'un prix Firestore change, avant toute reservation ou PaymentIntent;
- trois suites locales coeur/resilience/securite et recette navigateur/Data Access separee.

### 10.1 Preuve Data Access post-cutover du 2026-07-18

La fenetre a ete executee sur le sandbox deploye, de `12:34:59Z` a `12:37:03Z`. `DATA_READ` et `DATA_WRITE` ont ete actives temporairement pour `Firestore/Datastore API` depuis la console Google Cloud. Une lecture bornee de `sys_catalog_publication/secondevie` a ete observee avant le parcours, puis une seconde lecture a servi de marqueur de fermeture. Ces deux calibrations prouvent que Cloud Logging recevait effectivement les appels Firestore de la fenetre.

Le parcours a produit 28 requetes publiques:

- accueil, galerie, categorie, recherche, wishlist et fiche produit dans le navigateur;
- 21 appels same-origin a `/api/catalog?limit=120` et un appel a `/sitemap.xml`;
- les 22 appels HTTP instrumentes ont tous retourne `200`;
- les appels catalogue ont conserve un ETag unique et stable: la valeur brute n'est pas conservee dans Git.

Les sept entrees Firestore visibles entre les marqueurs comprennent les deux calibrations et du bruit applicatif borne (`Listen`, `RunQuery`, `BatchGetDocuments`). L'analyse expurgee du chemin et des requetes donne:

| Cible catalogue interdite au visiteur | References observees |
| --- | ---: |
| `artifacts/secondevie/public/meta` | **0** |
| `artifacts/secondevie/public/data/furniture` | **0** |
| requete sur la collection racine `furniture` | **0** |

Conclusion fermee: le parcours public mesure ne lit plus le catalogue dans Firestore. Il sert le snapshot Storage via `/api/catalog`; le checkout reste volontairement autoritaire sur Firestore et n'appartient pas a cette fenetre de navigation. `DATA_READ` et `DATA_WRITE` ont ete desactives immediatement apres le marqueur final. La console affichait les deux colonnes desactivees et la politique IAM a ensuite retourne `auditConfigs: null`.

Cette preuve a ferme la gate du cutover initial. La preuve finale apres retrait cloud est documentee ci-dessous.

### 10.2 Preuve Data Access finale apres retrait legacy du 2026-07-18

La fenetre probante a ete calibree par un marqueur effectivement visible dans Cloud Logging a `16:51:21Z`, puis fermee a `16:53:10Z`. Une premiere tentative plus tot dans l'apres-midi n'est pas utilisee comme preuve, car la propagation de la configuration IAM avait commence apres son parcours public.

Scenario calibre:

- accueil, categorie meubles, fiche produit, recherche et wishlist dans le navigateur;
- huit appels `/api/catalog?limit=120` et un sitemap, tous `200`;
- reconstruction admin bornee, publiee en revision `41` avec etat `healthy`;
- marqueur final en lecture de `sys_catalog_publication/secondevie`;
- desactivation immediate de `DATA_READ` et `DATA_WRITE`, puis verification `auditConfigs: null`.

Les 58 entrees Data Access expurgees de la fenetre se repartissent en 24 `BatchGetDocuments`, 21 `Listen`, un `RunQuery` et 12 `Commit`.

| Verification | Resultat |
| --- | --- |
| reference `artifacts/secondevie/public/meta` | **0** |
| lecture `furniture` | **1**, exclusivement `catalog-builder` pendant son scan autoritaire |
| lecture `furniture` attribuee a la navigation publique | **0** |
| ecritures `catalog-builder` | controle de publication, builds, inventaire et audit securite |
| ecritures applicatives annexes | deux mises a jour `sys_metadata/admin_ips` attendues |
| pointeurs finaux verifies | `current=41`, `previous=40`, LKG `39`, 38 produits chacun |

Conclusion fermee: apres suppression de `publicCatalog`, `onInventorySourceWrite`, `public/meta` et des Functions SEO, la navigation publique ne lit ni n'ecrit le catalogue Firestore. Seul le builder prive scanne `furniture` pendant une publication explicite. Aucun payload Data Access brut ni ETag n'est conserve dans Git.
