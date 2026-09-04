# Recette humaine sandbox

Derniere mise a jour: 2026-09-03
Statut: `CORRECTIONS_DEPLOYEES_REQUALIFICATION_PARTIELLE`
Proprietaire: equipe Seconde Vie
Perimetre: sandbox `secondevienextjsssr`, Stripe test uniquement
Fenetre auditee: 2026-09-02 23:40 -> 2026-09-03 00:10 Europe/Paris

## 1. Role et cycle de vie

Ce document est le compte rendu temporaire de la recette humaine client/admin
explicitement demandee le 2026-09-03. Il ne remplace aucun chapitre canonique
et ne vaut pas autorisation de production.

Il doit etre fusionne dans les chapitres commerce, espace client, back-office,
donnees, exploitation et qualite, puis supprime lorsque les constats HRT-001 a
HRT-008 ont ete corriges et requalifies sur le sandbox. Revue au plus tard le
2026-09-10.

Aucune adresse e-mail, UID, IP, token, adresse postale ou payload Stripe n'est
conserve dans ce rapport.

## 2. Scenario humain execute

- connexion d'un client existant;
- commande de trois articles;
- commande d'un article;
- tentative concurrente du meme article depuis une autre session;
- demande client de retour;
- decision administrateur et remboursement Stripe test integral;
- consultation des vues Stats, Data, Ventes et Retours;
- observation de la propagation temps reel et des changements de compte.

## 3. Resultat transactionnel

Le noyau transactionnel a tenu.

| Preuve | Resultat |
| --- | --- |
| commande `ord_dfb5edcd-f223-4331-bfb8-e5d9df3b201d` | 3 articles, 364 000 centimes, `paid`, paiement `succeeded`, inventaire `committed` quantite 3 |
| commande `ord_2873996f-39d0-433d-93eb-6d7e65309a12` | 1 article, 124 000 centimes, puis `refunded`, inventaire `committed` quantite 1 |
| double vente | aucune troisieme creation serveur; exactement deux appels POST `createCheckoutV2Gen2`, donc la tentative perdante a ete stoppee avant creation de commande |
| retour | demande `pending_review` creee puis traitee; etat final `completed` |
| remboursement | tentative `succeeded`, 124 000 centimes rembourses, document de confirmation present |
| restock | zero remise en stock automatique apres remboursement, conforme au contrat physique |
| finance Stats | projection mise a jour a 23:58:45 locale, incluant le remboursement |
| commandes Stats | projection mise a jour apres la deuxieme capture, revision 39 |

Chronologie utile, heure de Paris:

- 23:48:46: creation de la commande a trois articles;
- 23:49:20: paiement et inventaire confirmes;
- 23:55:06: creation de la commande a un article;
- 23:55:38: paiement et inventaire confirmes;
- 23:57:22: demande de retour client;
- 23:58:43: remboursement demande par l'administrateur;
- 23:58:44: remboursement Stripe test confirme;
- 23:58:45: demande de retour et projection finance finalisees.

## 4. Analytics et tracking

Quatre documents de session publique subsistent dans la tranche proche de
minuit: deux sessions du meme client de recette, une session d'un autre client
Google et une session anonyme. Elles correspondent a trois sujets techniques
uniques et sont toutes fermees proprement par `beforeunload`.

La session visible a 23:53 dans la liste n'est pas perdue. Le rollup journalier
contient six sessions dans la cle horaire `21`, dont les sessions de 23:46,
23:52, 23:53 et 23:57 heure de Paris. Le code calcule actuellement
`hourKey` avec `toISOString()`, donc en UTC, puis reconstruit le graphique en
UTC. La liste detaillee, elle, affiche l'heure locale. Cela explique exactement
le dernier point a 21 h dans la courbe face a une session a 23:53 dans la
liste.

Conclusion: le tracking a fonctionne, mais l'axe horaire Data est faux de deux
heures en heure d'ete.

Le compteur agrege n'est toutefois pas encore fiable. Pour l'heure UTC `21`,
la source courante contient quatre sessions et trois sujets uniques, tandis que
le rollup affiche six sessions et environ cinq visiteurs uniques. Deux faits
agreges restent presents alors que leur document source a ete supprime. Sur la
journee, cinq faits sur douze n'ont plus de document source; le rollup affiche
donc douze sessions et environ neuf visiteurs, contre sept sessions sources
encore presentes et six sujets techniques exacts.

Le flux de connexion admin supprime bien la session source via
`updateUserSessionsGen2`, mais `aggregateAnalyticsSessionGen2` ignore les
deletions et ne retire pas le fait deja materialise. Les deux faits orphelins de
l'heure test sont fortement coherents avec deux nettoyages de connexion admin,
mais l'identite exacte d'un fait anonyme supprime n'est plus prouvable sans une
fenetre Data Access active au moment de la suppression. L'UID administrateur
final n'apparait pas dans les faits de l'heure test; c'est la contribution
anonyme anterieure a la resolution admin qui peut rester comptee.

## 5. Erreurs runtime et projections manquantes

Trois triggers Firestore Gen2 ont recu leurs evenements, mais leur identite
Eventarc ne possede pas `roles/run.invoker` sur le service Cloud Run cible:

| Service | Identite du trigger | 403 pendant la fenetre |
| --- | --- | ---: |
| `journalInventoryMovementGen2` | `commerce-operations-reconciler` | 117 |
| `journalOrderEventGen2` | `commerce-operations-reconciler` | 39 |
| `projectCommerceFinancialHistoryGen2` | `order-stats-projector` | 41 |

Total: 197 requetes rejetees sur 620 requetes Functions, soit 31,8 %. Les
reprises ont continue jusqu'a 00:18:44 locale avec 26 rejets supplementaires.

Les services n'ont aucun binding IAM. A l'inverse,
`aggregateAnalyticsSessionGen2`, qui fonctionne, possede un binding
`roles/run.invoker` ressource uniquement pour son identite Eventarc. Le script
`configure-dashboard-event-invokers.mjs` ne couvre que trois services plus
anciens et a omis ces trois nouveaux services.

Impact:

- aucune corruption de commande, paiement, remboursement ou inventaire;
- absence des journaux derives pour les mouvements et evenements de commande;
- historique financier long non projete pour ces faits;
- retries et logs inutiles;
- les projections critiques `admin_dashboard/finance` et `orders` sont restees
  justes car elles utilisent d'autres projecteurs.

## 6. Latences observees

Mesures des requetes POST, sans OPTIONS, sur la fenetre:

| Chemin | Echantillons | p50 | p95/max |
| --- | ---: | ---: | ---: |
| `createCheckoutV2Gen2` | 2 | 2 051 ms | 2 051 ms |
| `listOrdersAdminV2Gen2` | 3 | 1 314 ms | 2 080 ms |
| `listMyOrdersV2Gen2` | 8 | 1 428 ms | 2 479 ms |
| `getAnalyticsAdminGen2` | 9 | 201 ms | 959 ms |
| `requestCustomerReturnGen2` | 1 | 911 ms | 911 ms |
| `decideCustomerReturnRequestAdminGen2` | 1 | 2 343 ms | 2 343 ms |

La lenteur percue de Ventes est confirmee: le premier clic charge a la fois le
chunk React lazy et la premiere page serveur. Le shell ne precharge aujourd'hui
que Data et Incidents au survol; Ventes n'utilise pas son prechargeur existant.

## 7. Cout mesure sur les trente minutes

Les valeurs ci-dessous viennent de Cloud Monitoring et Cloud Logging, pas
d'une extrapolation du code:

| Ressource | Mesure |
| --- | ---: |
| requetes Functions hors OPTIONS | 620, dont 423 reussies et 197 rejetees IAM |
| requetes App Hosting | 539; deux 404 non critiques sur `apple-touch-icon-precomposed.png` |
| Firestore lectures | 1 548 |
| Firestore ecritures | 465 |
| Firestore suppressions | 6 |
| Functions CPU alloue | 500,695 vCPU-secondes |
| Functions memoire allouee | 59,266 GiB-secondes |
| App Hosting CPU alloue | 76,463 vCPU-secondes |
| App Hosting memoire allouee | 22,500 GiB-secondes |

Valorisation indicative avant quotas gratuits, aux tarifs publics cites dans
`AUDIT_COUTS_FIRESTORE.md` et aux tarifs Cloud Run du jour:

- Firestore: environ 0,00177 USD;
- Functions/Cloud Run: environ 0,00938 USD;
- App Hosting/Cloud Run: environ 0,00164 USD;
- Eventarc Standard et Pub/Sub: 0 USD a ce volume dans les quotas gratuits;
- total brut indicatif: environ 0,0128 USD, soit de l'ordre de 1,3 centime USD.

Ce total n'est pas encore le montant debite. Les remises de free tier sont
partagees au niveau du compte de facturation et l'export Billing consolide avec
retard. La facture attribuable definitivement a cette fenetre doit donc etre
relue apres 24 heures. Les 197 refus IAM ne consomment pas le calcul du
conteneur cible, car ils sont rejetes avant son demarrage; leur dommage
principal est la perte de projection, les retries et le bruit de logs.

References tarifaires:

- <https://cloud.google.com/run/pricing>
- <https://firebase.google.com/docs/firestore/pricing>
- <https://cloud.google.com/eventarc/pricing>
- <https://cloud.google.com/pubsub/pricing>

## 8. Constats a corriger

### HRT-001 - IAM Eventarc incomplet - P0

Etendre l'allowlist du script IAM aux trois couples service/identite reels,
verifier l'absence d'invoker public, appliquer uniquement sur sandbox apres
autorisation, puis rejouer de nouveaux evenements bornes. La gate exige zero
403, un ledger/journal unique par evenement et un historique finance mis a
jour sans modifier la projection critique ni le paiement.

### HRT-002 - Experience de perte de course checkout - P1

La protection serveur est correcte, mais l'interface perdante peut tomber sur
l'etat generique `Panier vide`. Le checkout doit conserver le brouillon visuel
verrouille et afficher un etat explicite: « Cette piece vient d'etre vendue »
avec retour galerie, sans creer de commande ni vider silencieusement le
contexte. La cause exacte de la disparition de la ligne doit etre reproduite
avec deux profils navigateur isoles; les logs serveur seuls ne permettent pas
de distinguer une synchronisation de panier d'un stockage invite partage.

### HRT-003 - Remboursement client non temps reel - P1

`MyOrdersView` appelle `listMyOrdersV2` au montage, a la pagination et au bouton
Reessayer uniquement. Aucun listener n'actualise une commande deja affichee.
Ajouter un signal borne par utilisateur ou un listener de liste limitee qui ne
relit que les commandes visibles et fusionne la mise a jour locale. La gate
exige que `refund_succeeded` apparaisse sans refresh manuel et sans polling.

### HRT-004 - Badges d'actions dans la sidebar - P1

La sidebar ne recoit actuellement que les resumes Incidents. Materialiser un
seul resume global sans donnee personnelle pour les actions administrateur,
notamment le nombre de retours `pending_review`, puis l'ecouter une seule fois
dans le shell. Preferer un compteur d'actions encore a traiter a un simple
compteur « lu/non lu »: il disparait lorsque le dossier est traite, sans
ecriture artificielle de lecture.

### HRT-005 - Redirection admin imposee - P2

`HeaderAccountIsland` execute explicitement `router.push('/admin')` apres une
connexion dont le claim admin vient d'etre resolu. Supprimer cette redirection
automatique; garder le compte sur la galerie et laisser le bouton Admin ouvrir
le back-office volontairement. Les controles d'acces `/admin` ne changent pas.

### HRT-006 - Fuseau horaire Data - P1

Calculer `dateKey` et `hourKey` dans le meme fuseau metier `Europe/Paris`, puis
reconstruire les timestamps du graphique avec le decalage correct. Ajouter des
tests ete/hiver et passage de minuit. Recalculer de facon bornee les rollups du
jour affecte avant requalification; aucune lecture de sessions brutes ne doit
revenir dans le chemin critique du dashboard.

### HRT-007 - Premier affichage Ventes - P2

Utiliser au survol/focus du lien Ventes le chargement du chunk et le
`preloadAdminCommerceData` deja presents. Le cache en vol doit dedupliquer le
clic suivant et conserver sa borne de deux minutes. La gate compare clic froid
et retour chaud, sans ajouter de polling ni charger Ventes a l'ouverture de
Stats.

### HRT-008 - Suppression admin non repercutee dans les rollups - P0

La suppression de `analytics_sessions/{sessionId}` doit retirer ou invalider
sa contribution deja materialisee. Le correctif doit rester idempotent et ne
pas tenter de decrementer directement un HLL non reversible. La solution doit
reconstruire de facon bornee le jour touche depuis les faits encore admissibles,
ou retarder la finalisation jusqu'a la resolution du proprietaire. Une reprise
bornee des cinq faits orphelins du jour est requise apres dry-run. La gate exige
qu'une connexion admin supprime la session et laisse exactement zero session et
zero visiteur supplementaire dans le rollup, y compris apres rejeu.

## 9. Gates de fermeture

Etat des constats apres la passe du 2026-09-03:

| Constat | Etat | Preuve restante |
| --- | --- | --- |
| HRT-001 IAM | `CORRIGE_QUIET_WINDOW_A_FERMER` | aucun 403 apres 13:59 UTC; prolonger l'observation |
| HRT-002 checkout perdant | `CORRIGE_A_REQUALIFIER` | refaire la course avec deux profils navigateur |
| HRT-003 refund temps reel | `CORRIGE_A_REQUALIFIER` | remboursement Stripe test humain sans refresh |
| HRT-004 badge Retours | `FERME_SANDBOX` | transition synthetique `0 -> 1 -> 0`, fixtures nettoyees |
| HRT-005 redirection admin | `CORRIGE_A_REQUALIFIER` | connexion Google admin depuis la galerie |
| HRT-006 fuseau Data | `FERME_SANDBOX` | 12 faits audites, 5 supprimes, 7 corriges, controle final 0/0 |
| HRT-007 premier affichage Ventes | `CORRIGE_A_MESURER` | comparaison clic froid/retour chaud navigateur |
| HRT-008 retrait admin | `FERME_SANDBOX` | creation puis tombstone d'un fait synthetique sans PII |

App Hosting sert `sv-mtlle76d-daa1d98532b0`. Les revisions finales des deux
nouveaux rails evenementiels sont `projectadminactionsummarygen2-00006-wov`
et `aggregateanalyticssessiongen2-00006-xak`. Aucune production, Stripe live
ou donnee personnelle n'a ete utilisee.

1. tests locaux des contrats IAM, fuseau horaire, exclusion admin et rollbacks
   de faits, checkout concurrent, rafraichissement remboursement, badges et
   navigation admin;
2. lint cible, tests commerce, analytics, admin dashboard, admin cache,
   observabilite et Rules Emulator;
3. build Next apres lecture de la documentation Next.js locale pertinente;
4. deploiements sandbox cibles uniquement, avec rollback exact;
5. nouvelle recette humaine a deux profils pour la course checkout;
6. remboursement Stripe test visible sans refresh;
7. zero 403 sur les trois projecteurs et quiet-window sans retry;
8. comparaison Monitoring avant/apres sur une fenetre equivalente;
9. lecture Billing consolidee apres 24 heures;
10. fusion des decisions durables dans les chapitres canoniques et suppression
    de ce document.

## 10. Actions non realisees pendant l'audit

- aucune modification de donnees Firestore;
- aucune modification IAM;
- aucun appel Stripe d'ecriture;
- aucun deploiement Functions ou App Hosting;
- aucune production ni Stripe live;
- aucun correctif runtime encore applique.
