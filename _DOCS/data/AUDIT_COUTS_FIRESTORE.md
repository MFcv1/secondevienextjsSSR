# Audit des lectures et couts Firestore

Derniere mise a jour: 2026-07-16
Statut: `P0_LOCAL_VALIDE_MESURE_SANDBOX_REQUISE`
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

- heartbeat toutes les 15 secondes;
- environ 240 appels `syncSession`;
- chaque appel effectue actuellement une lecture du document session puis une ecriture;
- si Data est ouvert, chaque mise a jour du document peut provoquer environ une lecture supplementaire par panneau admin qui l'ecoute.

Le timer periodique continue actuellement quand l'onglet public est masque. Le beacon marque deja la session inactive au masquage et une synchronisation immediate existe au retour visible. Suspendre le heartbeat masque economiserait donc les appels inutiles sans ralentir le live visible.

Pour l'admin Data:

- cache froid: historique `H` jusqu'a 5 000 plus listener initial `L` jusqu'a 100;
- cache IndexedDB valide de moins de six heures: listener `L` seulement;
- clic Actualiser: nouvelle lecture historique `H`;
- remount/reconnexion du listener: jusqu'a `L`;
- chaque document modifie dans le jeu ecoute: environ une lecture, et non 100.

### 5.4 Effets des tests locaux

Le localhost utilise actuellement le vrai projet Firebase. React Strict Mode peut remonter certains effets en developpement. Les onglets ouverts, HMR, prechargements et rechargements locaux peuvent donc consommer le quota sandbox. Pour les tests repetitifs, l'Emulator Suite doit devenir la cible par defaut.

## 6. Optimisations classees par risque

### P0 - implemente localement, validation requise avant deploiement

Le lot du 2026-07-16 applique uniquement les changements dont le resultat fonctionnel reste identique:

1. `publicCatalog` rejette `limit`/`cursor` malformes avant la lecture de `public/meta`; un curseur valide est canonicalise avant de former la cle de cache.
2. L'appel normal de recherche demande 120 cartes, qui est deja la borne reelle de la Function, au lieu de creer une URL Next distincte avec `limit=160` silencieusement plafonnee. Le fallback Firestore direct reste a 160 pour conserver sa couverture en mode degrade.
3. Une carte categorie proche du viewport continue de chauffer ses images, mais sa route produit n'est prechargee qu'au hover, focus ou press.
4. Le mega-menu precharge seulement le groupe vise, puis chaque enfant au moment de son intention propre.
5. Le heartbeat analytics de 15 secondes est suspendu lorsque l'onglet est masque. Le beacon de masquage, le retour visible immediat, le seuil live de 30 secondes et le listener admin sont conserves.
6. `updateUserSessions` ne relit plus `users/{uid}` avant `sys_admin_access`, puisque cette lecture etait toujours ecrasee par le registre et ne pouvait changer le resultat.

Les gains ne sont pas convertis en promesse exacte avant une fenetre Usage Insights comparable. Ils ciblent les causes inutiles sans diminuer la cadence visible, la richesse des images, la navigation Next, l'exclusion admin ou la fraicheur catalogue.

### Decisions volontairement non appliquees

- aucun cache TTL n'est ajoute autour de `public/meta`: apres un bump et une revalidation Next, une instance Function pourrait fournir l'ancienne version a la premiere reconstruction, puis la remettre en cache ISR jusqu'a 300 secondes;
- aucun changement n'est revendique sur le menu global: l'ancien eventail de 20 routes audite appartenait a un composant non monte; le chemin actif conservait deja uniquement le prechargement du compte authentifie;
- le heartbeat visible et le listener temps reel ne sont ni ralentis ni supprimes;
- le fallback de claims de `trackAdminIP` reste en place tant qu'un test de propagation/revocation ne prouve pas qu'il peut etre retire sans refuser un admin legitime;
- la recherche vide continue d'afficher ses suggestions premium; la supprimer serait une regression UX, pas une optimisation neutre.

### P1 - mesure avant implementation

1. Ne charger le catalogue admin que pour les onglets qui en ont besoin, apres le controle admin fort, avec cache de session partage.
2. Borner et purger `limitedCatalogCache`, qui conserve actuellement les anciennes versions et combinaisons categorie/cursor jusqu'a la destruction de l'instance.
3. Distinguer le `404` produit autoritatif d'une indisponibilite technique avant de supprimer les fallbacks Admin/REST.
4. Ajouter dans Cloud Logging des logs structures sans donnee personnelle: `operation`, `cacheHit`, `scope`, `limit`, `returnedDocs`, `category`, `reason` (`heartbeat`, `route`, `beacon`). Ne pas ecrire ces compteurs dans Firestore.
5. Borner le listener Data aux sessions recemment actives tout en conservant l'historique separe; verifier l'index et le comportement de reconnexion.
6. Transformer Actualiser en synchronisation incrementale, avec recalcul complet explicite seulement lorsque necessaire.

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

## 9. Etat du lot P0 au 2026-07-16

Le lot conservateur est implemente et valide localement. Aucun commit, push ou deploiement cloud n'a ete effectue dans cette passe.

Validations passees:

- `test:firestore-cost`: 2 tests, 2 reussis;
- contrat de fiabilite analytics: reussi;
- suite Auth/passkeys: 54 tests, 54 reussis;
- ESLint: 0 erreur, 298 avertissements preexistants;
- build Next 15.5.20: reussi, routes statiques generees;
- `mobile:contract`: reussi;
- `next:routes`: reussi apres le build;
- verification syntaxique des deux Functions modifiees: reussie;
- `git diff --check`: reussi, hors avertissements CRLF du poste Windows.

La validation de cout reste volontairement ouverte: les gains exacts ne seront chiffres qu'apres un deploiement sandbox autorise et une fenetre Usage Insights comparable. La gate de deploiement doit aussi verifier manuellement le live, le tracer, la reprise apres masquage, la navigation catalogue et l'exclusion admin.
