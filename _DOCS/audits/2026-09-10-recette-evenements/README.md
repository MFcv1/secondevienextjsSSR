# Recette des parcours et maintenances événementielles — 10 septembre 2026

## Décision

### Reprise autorisée du 11 septembre — recette ciblée réussie

- Dernière vérification des logs : A-041 découvert puis réparé. Le compteur
  incidents était à zéro contre deux contributions encore actives. Sauvegarde
  privée, réparation du compteur depuis 24 registres, sans modification des
  incidents ; reprises automatiques HTTP 204 à 00:02:08 et 00:03:03 UTC,
  compteur final zéro. Trois tests opérateur et lint réussis. Aucun scan ajouté.
- Cycle catalogue final 350 : désiré, publié et servi concordants, maintenance
  `succeeded/completed`, queue vide. Trois erreurs de revalidation pendant les
  changements avaient signalé une route encore ancienne ; les reprises ont
  réellement confirmé la nouvelle version avant de se terminer.
- Commit applicatif `ffadb9f` intégré en avance rapide sur `main`. Sources des
  cinq lecteurs/UI modifiés comparées octet à octet avec l'archive Hosting
  déployée : identiques. Hosting 007 prêt et trafic 100 %. L'outil opérateur de
  réparation ajouté après cette livraison ne fait pas partie du runtime web.
- **A-038 clôturé par abandon**, après décision explicite du propriétaire.
  Outbox `ae8620032bfb743d135909e685ad1c86aad2c8fd586976feae5211b8df70247b`
  en `suppressed_stale`, tentative 1 et incertitude conservées, aucun `sentAt`,
  aucun renvoi. Rapprochement manuel borné revenu `healthy`, compteurs à zéro.
- **Publication Safari réussie**, produit
  `product-c9860689-782f-4f5c-8865-5eff718142a3`, titre
  `[RECETTE run_20260911_final] Publication sans vente`, prix 2 €, stock 1,
  une illustration publique du projet, réseaux sociaux désactivés. Galerie et
  fiche effectivement affichées ; API snapshot HTTP 200, version 345.
  Archivage ensuite réussi par l'interface, API publique HTTP 404. Aucun achat
  de ce produit, aucun média supprimé.
- **Lien C147 créé puis annulé dans Safari**, commande
  `ord_2cc658c0-1dba-4c4f-beb0-a7547629e72d`, armoire
  `product-2b9b2ab2-c701-4640-99d5-76a35aebb672`, 450 €, retrait, deux heures,
  aucun envoi. Suivi d'abord `scheduled`, puis `superseded/checkout_terminal`
  à l'annulation ; commande `canceled`, stock final 1.
- Le test a découvert une fixture historique de qualification mal formée,
  `qualification_event_1789040468223` (une seconde entrée invalide est
  `qualification_repair_1789041987476`), qui faisait échouer toute la liste des
  liens. Correctif : isoler ces lignes, signaler leur présence, conserver les
  liens valides et ne jamais masquer les erreurs de configuration HMAC.
  Deux fonctions de lecture seulement déployées :
  `readadminsharedgen2-00002-vac`, `listadminpaymentlinksgen2-00005-raw`,
  toutes deux `ACTIVE`, configuration inchangée, archives de retour disponibles.
- **Paiement Stripe test C148 réussi**, commande
  `ord_b5f4528e-76e6-487d-934c-1f84736d8fd8`, buffet
  `product-56af4d4e-54ee-4fd8-8510-4e949f2ab3e0`, 450 €, retrait.
  `livemode=false` relu auprès de Stripe avant paiement. Confirmation Safari,
  dossier client et admin concordants ; état durable `paid/succeeded`, checkout
  fermé, réservation `committed`, stock 0. Les deux outbox `order-paid` et
  `order-paid-admin` sont `sent`, tentative 1. Aucune réception Gmail directement
  vérifiée dans ce scénario. La commande payée est conservée, sans remboursement
  ni remise en vente artificielle.
- Le suivi paiement est `succeeded/checkout_terminal`. Le suivi d'expiration
  a exécuté son unique échéance initiale à 02:03 Europe/Paris : état final
  `superseded/stale`, tentative 1, queue vide, commande toujours payée. Aucun
  réarmement. Ce réveil lié à une vraie réservation n'est pas un scan périodique.
- Dernier préflight à 02:04 Europe/Paris : `v2_all/v2`, offline off,
  `operationsStatus=healthy`, tous les compteurs live à zéro. Compteur incidents
  également zéro après ses deux reprises automatiques.
- **Hosting `secondevie-next-sandbox-build-2026-09-10-007` déployé.** Après
  nouvelle connexion Google admin dans Safari et rechargement, Stats affiche
  « KPI · Synchronisés », Data « Synchronisé avec le serveur » et les sessions
  en direct, sans Actualiser. Admin `loa.gto15@gmail.com`, rôle Administrateur,
  authentification forte confirmée. Client `pvml7008@gmail.com` connecté par
  Google pour C148, claims admin/super-admin absents. Les 14 jobs historiques
  sont toujours `PAUSED`.
- 153 tests unitaires commerce réussis, dont 7 tests des liens ; 9 tests des
  outils de résolution documentaire réussis. Build Node 22 réussi. Livraison
  Hosting candidate achevée ; 34 tests ciblés rejoués après relecture, tous
  réussis. 68 tests des maintenances rejoués, tous réussis. Ces comptes de tests
  se recoupent et ne doivent pas être additionnés.

La recette ciblée permet la phase d'observation utilisateur de quelques jours.
Elle ne prouve pas toutes les courses cloud, toutes les échéances longues ni
les parcours livraison/remboursement M01–M13. Aucun paiement réel, aucune
publication sociale et aucune suppression de commande/document/média.

Les sections suivantes conservent les observations datées antérieures ; les
mentions d'A-038 ouvert ou de mutations non exécutées y sont historiques.

### Reprise du 11 septembre — validation finale encore ouverte

**Contre-test Safari au premier plan, 11 septembre vers 01:26 Europe/Paris :
Stats et Data passent.** Parcours galerie → menu → Admin, puis Stats → Data ;
identité `loa.gto15@gmail.com`, Administrateur et authentification forte
confirmées. Stats affiche « KPI synchronisés », Data « Synchronisé avec le
serveur » et « Sessions en direct ». Après un rechargement complet de `/admin`,
Stats puis Data confirment à nouveau leurs données serveur. Aucun clic sur
Actualiser, aucun changement de préférence, aucun droit modifié.
Ce contre-test concerne la version déjà en ligne, pas les correctifs locaux.
Le blocage initial n'est plus reproduit dans ces conditions ; la suspension
en arrière-plan reste une hypothèse, pas une cause mesurée. A-038 et les
scénarios transactionnels ne sont pas résolus par ce test.

La révision Cloud Run relue est `secondevie-next-sandbox-build-2026-09-10-006`,
trafic 100 %. Les correctifs locaux postérieurs du délai Stats/Data ne sont
pas encore déployés. Le passage sur `main` et la livraison finale restent
conditionnés à la qualification demandée par le propriétaire.

- Build local Node 22 réussi, 55 pages, identifiant
  `sv-mtw4runq-69f8d917007a`.
- 43 tests canaux/préchargement/analytics/résolution documentaire et 29 tests
  dashboard/navigation/newsletter/finance réussis. L'ancien contrat statique
  interdisant tout préchargement commercial dans le shell a été actualisé :
  la préparation documentée après le premier résultat Stats est admise ;
  aucun fallback métier n'est ajouté dans Stats. Les tests comportementaux de
  la file bornée restent réussis.
- Lint : aucune erreur sur les fichiers examinés ; deux avertissements de
  `AdminAnalytics.jsx` reproduits à l'identique sur HEAD avant modifications.
  Les autres fichiers du correctif passent avec zéro avertissement.
- Safari : identité admin/AAL2 confirmée ; chargement Stats reproduit après
  rechargement. L'inspecteur ne montre qu'un 401 de ressource reCAPTCHA PAT,
  ce qui ne prouve pas une panne App Check. Les saisies de l'outil ne sont
  pas prises en compte de façon fiable ; visibilité réelle de la page non
  mesurée. Aucune préférence Safari modifiée. Cause initiale non démontrée.
- Gmail : connecteur confirmé sur le seul compte client de recette. Recherche
  du 8 septembre, puis fenêtre ciblée 14:00–15:00 UTC, tous dossiers inclus :
  aucun message correspondant à la tentative de 14:07. Les copies retrouvées
  sont antérieures à cette tentative et ne constituent pas sa preuve. Aucun
  message envoyé et aucun statut outbox modifié.
- Contrôle commerce relu : `v2_all/v2`, offline off, `operationsStatus=stop`,
  `deliveryUnknown=1`, autres compteurs retournés nuls. Une décision explicite
  sur l'abandon éventuel de cette ancienne copie est demandée ; elle n'est
  pas présumée et ne signifierait pas une livraison confirmée.

Paiement, lien et publication restent non exécutés dans cette reprise.
Aucun commit, merge ou déploiement effectué pendant cette reprise. Aucun
résultat local ne vaut qualification du sandbox ou clôture d'A-038/A-039.

### Verdict de la campagne initiale

**Verdict : BLOCAGE À CORRIGER avant la semaine de recette commerce.**

La version servie permet réellement la navigation publique, la connexion
cliente, la conservation du panier et l'ouverture/reprise d'un checkout dans
Safari. Les deux sessions créées par deux onglets sont restées distinctes,
leurs parcours ont été projetés puis leur fermeture a été constatée. Les
travaux catalogue, finance et GC existants ont une cause et une échéance ; les
14 anciens horaires sont toujours arrêtés.

Le préflight commerce autoritaire a toutefois répondu `stop` avant toute
mutation : une copie de document client du 8 septembre reste en
`delivery_unknown`. Ce statut protège correctement contre un renvoi aveugle,
mais il interdit de considérer le rail commerce prêt. Aucun paiement, lien de
paiement ou changement de stock n'a donc été créé pour contourner ce garde-fou.
La publication n'a pas été rejouée faute de fixture exacte et de session admin
forte réutilisable sans secret. Le constat commerce est enregistré comme
[A-038](../../../anomalies.md#a-038---une-livraison-ambigue-residuelle-maintient-le-preflight-commerce-a-stop).

Cette décision ne remet pas en cause la livraison des maintenances groupées ;
elle dit que la recette commerce ne doit pas commencer avant qualification et
résolution explicite de cette livraison ambiguë.

La reprise ciblée de 19:05 UTC a conservé ce verdict. Elle a en revanche fermé
la preuve analytics qui était encore future : les trois groupes ont été
exécutés une fois à leur échéance, ont terminé `succeeded` et n'ont laissé
aucune tâche en queue. Elle a aussi reproduit une seconde anomalie admin :
Stats et Data restent en chargement dans Safari alors que Mon compte,
Performance, Incidents, Liens de paiement et Publication chargent. Voir
[A-039](../../../anomalies.md#a-039---stats-et-data-restent-en-chargement-dans-safari).

## Cible et fenêtre observées

| Élément | Valeur vérifiée |
| --- | --- |
| Projet / environnement | `secondevienextjsssr` / sandbox uniquement |
| Site | App Hosting `secondevie-next-sandbox`, `europe-west4` |
| Révision servie | `secondevie-next-sandbox-build-2026-09-10-005`, prête, trafic sur la dernière révision |
| Dépôt | branche `codex/event-maintenance-sandbox-20260910`, `eb3dcf98118d3796920af1172ec0e98618404d81` |
| Versions annoncées retrouvées | `3395482`, `2da3f3a`, `ac18942`, `eb3dcf9` |
| Functions | 181 Gen2 `ACTIVE` lors du relevé |
| Début | 2026-09-10 18:13:38 UTC, soit 20:13:38 Europe/Paris |
| Fin | 2026-09-10 18:37:14 UTC, soit 20:37:14 Europe/Paris |
| Navigateur | Safari natif, comptes de recette existants, aucune lecture de boîte mail ou de secret |
| Identifiant de campagne | `run_recette_evenements_20260910_safari01` |

La racine répondait HTTP 200 avec `s-maxage=300`, cache Next `HIT` et stale
time 300. `/api/catalog/version` répondait HTTP 200 avec la révision 344,
identique à la révision publiée et servie du contrôle catalogue.

## Méthode et niveaux de preuve

- **NAVIGATEUR** : comportement effectivement vu dans Safari.
- **CLOUD** : état Firestore, Cloud Run, Cloud Tasks, Scheduler, Monitoring ou
  logs relu en lecture seule sur le projet explicitement nommé.
- **LOCAL** : contrat reproduit par un test ciblé sous la baseline Node 22.
- **NON VÉRIFIÉ** : scénario non exécuté ; aucune conclusion positive n'en est
  tirée.

La visite n'a utilisé ni Playwright, ni Chrome, ni boîte mail. Les commandes
cloud ont toujours porté `--project=secondevienextjsssr` car le projet `gcloud`
par défaut de la machine était différent. Aucun scan large, build, émulateur ou
suite complète n'a été lancé.

## Scénarios

| Scénario et action | Attendu, état durable et arrêt | Observé et preuve | Verdict |
| --- | --- | --- | --- |
| Galerie, catégorie, fiche, retour et rechargement | Navigation utilisable, auth conservée, catalogue public 344 | Galerie, `/categorie/buffets` (15 cartes) et une fiche disponible à 450 € rendues ; fermeture de la fiche et rechargement cohérents ; menu non bloqué. **NAVIGATEUR** | Conforme dans le périmètre vu |
| Connexion cliente normale | Compte client sans privilège admin | Sélecteur Google existant, connexion cliente réussie ; aucun accès `ADMIN`. **NAVIGATEUR** | Conforme |
| Deux onglets et analytics | Une session par onglet, événements et projections cohérents, pas de multiplication sur reload | Deux sessions distinctes commencées à 18:16:38 et 18:17:48 UTC. Leurs parcours galerie/catégorie/détail puis détail/checkout sont présents ; cartes, détails et faits associés existent. Les rechargements ont incrémenté la session existante. **NAVIGATEUR + CLOUD** | Conforme |
| Fermeture des onglets | Fermeture explicite ou inactivité selon le contrat ; aucun jugement instantané | Les deux sessions sont devenues inactives ; le premier contrôle borné les confirmait inactives environ 10,5 s après la dernière activité. Fermetures `beforeunload` enregistrées à 18:19:11 et 18:20:41 UTC. **CLOUD** | Conforme ; délai exact inférieur à 10,5 s non mesuré |
| Double clic ajout panier | Une seule ligne et aucun double effet durable | Bouton neutralisé pendant l'ajout puis `DÉJÀ DANS LE PANIER`; quantité 1, sous-total 450 €. **NAVIGATEUR** | Conforme côté client |
| Ouvrir, recharger puis abandonner le checkout | État client repris ; aucune réservation avant validation nécessaire | Checkout ouvert avec identité préremplie, paiement désactivé faute de champs/CGV ; rechargement stable ; onglet fermé. Aucune commande, réservation ni travail commerce nouveau. **NAVIGATEUR + CLOUD** | Conforme pour la préparation/abandon sans soumission |
| Checkout soumis, reprise et échéance de réservation | Une réservation justifiée, une tâche bornée, neutralisation si payé/fermé | Préflight commerce `stop`; aucune soumission autorisée. **NON VÉRIFIÉ** | Bloqué par A-038 |
| Lien de paiement de recette | Création/annulation sans envoi, effets idempotents | Non exécuté : garde-fou commerce à l'arrêt et session admin forte non restaurable sans nouvelle saisie de mot de passe. **NON VÉRIFIÉ** | Bloqué par A-038 et frontière d'authentification |
| Publication catalogue réversible | Produit de recette identifié, cycle partagé, invalidation et version servie | Aucune fixture exacte n'a été identifiée et la reconnexion admin aurait demandé un secret. Aucune mutation faite. Le cycle 344 existant est `published`, revalidation acceptée, version servie observée, sans retry dû. **CLOUD**, parcours neuf **NON VÉRIFIÉ** | État courant sain ; mutation non rejouée |
| Finance | Une journée changée regroupée ; jour courant non présenté comme vérifié avant clôture | Onze journées historiques `succeeded/verified`; journée du 10 septembre encore `scheduled`, échéance 11 septembre 01:17 UTC. Une seule tâche correspondante. **CLOUD** | Conforme à l'instant observé |
| Médias et releases | Dry-run, cohortes justifiées, pointeurs protégés, arrêt après échéance | Cohortes 8/9 septembre terminées en dry-run ; deux échéances release et cinq médias ont exactement sept tâches futures. Courante 344, précédente 343 et secours 342 existent dans le registre. Aucun delete. **CLOUD** | Conforme pour l'état courant |
| Réarmement média même génération | Nouvelle activité après cohorte terminée réarme la quarantaine | Cas complexe non provoqué dans Storage. Régression ciblée incluse dans les 71 tests. **LOCAL** | Contrat local seulement |
| Reprises et courses difficiles | Avant/après envoi, expiration/paiement, stale, mutation à la clôture, retries épuisés, groupe vide | 71/71 tests ciblés réussis sous Node 22.23.2 et pnpm 11.7.0. **LOCAL** | Conforme localement ; pas une preuve cloud |
| Repos après fermeture | Aucun ancien scan ni boucle sans cause ; tâches futures admises | Après 15 min 43 s sans activité cliente, les deux sessions sont toujours inactives, aucune commande/outbox nouvelle et aucun 5xx. Les appels restants sont Hosting, analytics et lectures admin antérieures au repos ; aucun des anciens consommateurs périodiques n'apparaît. **CLOUD** | Conforme sur cette fenêtre bornée |

Le test d'une coupure réseau n'a pas été exécuté : les outils disponibles ne
permettaient pas d'isoler proprement un onglet sans perturber une session
partagée. Aucune queue, permission IAM ou panne fournisseur n'a été manipulée.

## Anciennes périodicités et travaux durables

Les 14 jobs Cloud Scheduler recensés sont tous `PAUSED` : dix ressources sont
en `europe-west1` et quatre anciens jobs, malgré leur suffixe de nom
`europe-west1`, sont enregistrés en `us-central1`. Aucun job n'est présent en
`europe-west4`. Cela couvre les anciens reconciliateurs catalogue/commerce,
outbox, réservations, expiration de liens, analytics et GC. Ce relevé confirme
leur état, pas une économie nette.

Les 14 queues pertinentes sont `RUNNING`, avec concurrence 1 et débits bornés.
Au départ, les travaux légitimes étaient :

- une finance du 10 septembre, due le 11 septembre à 01:17 UTC ;
- deux cohortes release, dues les 11 et 13 septembre à 00:00 UTC ;
- cinq cohortes média, dues autour du 8 octobre à 17:26 UTC ;
- trois groupes analytics issus des onglets de recette, déjà sans session
  active mais encore dus vers 18:55/19:00 UTC. Le contrat permet un dernier
  réveil vide, qui doit alors se terminer sans réarmement.

Relecture à 19:08 UTC : les deux groupes dus à 18:55 ont terminé à
18:55:06 UTC et le groupe dû à 19:00 a terminé à 19:00:00 UTC. Tous trois sont
`succeeded`, tentative 1, résultat journalisé `group_completed`; la queue
`dispatchAnalyticsInactivityGroupGen2` est vide. Les écritures terminales ont
bien réveillé le trigger de planification, mais n'ont créé aucune nouvelle
tâche. Ce point est désormais **CLOUD confirmé**, pas seulement attendu.

Il n'existait au départ aucune tâche catalogue-cycle, outbox, réservation ou
maintenance de commande ouverte. Une visite publique n'en a créé aucune.

## Catalogue, finance et médias

Le contrôle catalogue `sys_catalog_publication/secondevie` est cohérent :
`desired/prepared/published/revalidated/served = 344`, pointeurs précédent 343
et secours 342, intégrité valide, invalidation acceptée, source courante et
aucun échec/retry dû. Le travail de maintenance du cycle est terminé en
génération 3.

La finance distingue bien les onze jours historiques vérifiés du jour courant
encore planifié. Ce relevé n'observe pas le passage de l'échéance du lendemain.

Le GC reste exclusivement `dry_run`. Les groupes terminés et planifiés sont
adossés à des entrées Cloud Tasks exactes. L'existence des trois releases
pointées a été vérifiée ; leur protection d'exécution et le réarmement
`ac18942` reposent en complément sur les tests locaux. Les attentes de 28/90
jours n'ont pas été simulées ni raccourcies.

## Performance, Data, Incidents et Google Cloud

### Avant les interactions

- Data, fenêtre 1 jour : 3 visiteurs, 4 sessions, 5 sessions brutes, aucune
  session en ligne avant la visite. Les nouvelles sessions et leurs parcours
  ont ensuite été confirmés directement dans leurs projections expurgées.
- Performance, fenêtre glissante affichée du 9 septembre 20:11 au 10 septembre
  20:11 Europe/Paris : 4 049 appels, 1 546 réponses 5xx et 86 réponses 4xx sur
  les Functions retenues par la vue.
- Monitoring sur la même fenêtre, en excluant App Hosting : 4 045 appels,
  1 546 5xx et 86 4xx. Les classes d'erreur coïncident ; l'écart de quatre
  appels est compatible avec le cache et la frontière glissante. En incluant
  App Hosting : 5 792 requêtes, dont 3 234 2xx, 717 3xx, 295 4xx et 1 546 5xx.
- Incidents affichait un incident actif. Les erreurs système visibles les plus
  récentes précédaient le début de campagne ; aucune erreur cloud de sévérité
  au moins `ERROR` n'a été trouvée après 18:13:38 UTC au relevé intermédiaire.

Les 1 545 erreurs 5xx de `captureCostsFromBigQueryGen2` expliquent presque
entièrement le niveau historique de la vue Performance ; elles ne sont pas des
erreurs créées par les deux sessions Safari. Un 409 de
`syncSessionBeaconGen2`, suivi d'un succès, correspond à une course de
génération/fermeture attendue et non à un 5xx serveur.

### Fenêtre exacte de cette recette

Du 10 septembre 18:13:38 au 18:37:14 UTC, les journaux de requêtes Cloud Run
comptent 386 requêtes : 265 Hosting et 121 Functions, réparties en 249 2xx,
135 3xx, 2 4xx et 0 5xx. Les deux 4xx sont un 400 de lecture admin et le 409
analytics déjà décrit ; tous deux sont des avertissements, sans log de
sévérité `ERROR` ou supérieure.

Cloud Monitoring, relu à 18:38:09 UTC sur le même intervalle exact, exposait
385 requêtes : 268 Hosting et 117 Functions, soit 248 2xx, 135 3xx, 2 4xx et
0 5xx. L'écart net est d'une requête, avec quatre requêtes Functions encore
absentes et trois requêtes Hosting supplémentaires à la frontière des séries.
La collecte avait moins d'une minute de recul : ce résultat est cohérent mais
encore provisoire, et n'est pas transformé en coût.

Les seules Functions présentes sont les handlers analytics, lectures admin,
projection d'incident et capture de coûts sollicités pendant la campagne.
Aucun ancien consommateur périodique commerce, réservation, catalogue,
finance ou GC n'apparaît. Au relevé Firestore de 18:37:13 UTC, les deux
sessions sont toujours inactives, `newOrders=0`, `newReservations=0`,
`newOutbox=0` depuis le début et `deliveryUnknown=1` inchangé. Le statut
officiel relu après le repos reste `stop`, avec ce seul compteur non nul. Les
trois groupes analytics restent
`scheduled` pour 18:55/19:00 UTC, sans tentative avant leur échéance.

La page admin n'a pas été laissée ouverte : après la déconnexion cliente, la
reconnexion Google admin demandait un mot de passe. Cette frontière normale a
été respectée ; le contrôle postérieur repose donc sur Cloud, pas sur une
seconde lecture de l'interface Data/Performance/Incidents.

## Anomalie A-038

### Faits confirmés

Le script de statut officiel, exécuté sous Node 22 sur le sandbox, confirme
`newCheckoutMode=v2_all`, `adminMutationMode=v2`, Stripe test et paiement
offline désactivé, mais renvoie `operationsStatus=stop`. Le compteur live
`deliveryUnknown` vaut 1 ; tous les autres compteurs sont nuls.

L'objet correspondant est une copie de document client créée le 8 septembre à
14:07:07 UTC. Une tentative a commencé puis est passée
`delivery_unknown` à 14:07:30 UTC avec la classe
`GMAIL_DELIVERY_UNKNOWN`. Il n'a ni identifiant fournisseur certain, ni lease,
ni prochaine tentative, ni maintenance ouverte. Deux incidents restent
ouverts : l'agrégat exploitation et l'incident critique de cet objet.

### Impact

Le système se met correctement en sécurité, mais la situation durable n'est
pas terminale d'un point de vue opérateur. Les scénarios qui pourraient créer
une commande, une réservation, un lien ou un nouvel effet fournisseur ne sont
pas sûrs à lancer pendant cette campagne. Rejouer la copie pourrait la livrer
deux fois.

### Hypothèse et preuve manquante

La cause de l'ambiguïté elle-même n'est pas établie par cette recette : coupure
après acceptation fournisseur, timeout ou autre incident restent possibles.
Il manque une preuve fournisseur/journal ciblée permettant de décider si le
message a été accepté. L'absence d'identifiant fournisseur ne prouve pas
l'absence de livraison.

### Correctif minimal proposé

Qualifier cet objet unique à partir des journaux/provider autorisés, puis
appliquer la procédure opérateur versionnée de résolution ambiguë **sans
renvoi automatique**. Relancer le rapprochement borné, exiger
`operationsStatus=healthy` avec tous les compteurs live à zéro et vérifier la
fermeture des deux incidents. Aucun correctif de code n'est proposé tant que
la cause n'a pas démontré un défaut de traitement.

### Qualification complémentaire de 19:05 UTC

La recherche expurgée dans Cloud Logging, bornée à l'objet, sa commande et son
document, ne trouve qu'une preuve d'enqueue. Autour de l'exécution, le worker
rapporte `GMAIL_DELIVERY_UNKNOWN`, `responseCode=null`, puis un timeout
Nodemailer `ETIMEDOUT` avec `command=CONN`. Aucun `250`, identifiant de message,
accusé d'acceptation ou réponse fournisseur n'est présent. Cette trace ne
prouve donc ni réception ni absence de réception.

Le plan privé reste en mode `0600`. À 19:12:20 UTC, l'objet satisfait toujours
les critères de l'outil et sa version comme son empreinte correspondent encore
au plan ; il demeure `delivery_unknown`, tentative 1 et `resend=false`.
Aucune attestation ni commande `apply` n'a été créée. À défaut de preuve
provider ou destinataire, A-038 reste ouverte et aucune santé n'a été forcée.

## Reprise ciblée des preuves manquantes

| Preuve demandée | Résultat de la reprise | Statut |
| --- | --- | --- |
| Analytics après échéance | Trois groupes `succeeded` en une tentative ; queue vide ; aucun réarmement | **VALIDÉ CLOUD** |
| Paiement Stripe test complet | Préflight toujours `stop`, `deliveryUnknown=1`; aucune commande créée | **NON TESTÉ — A-038** |
| Lien de paiement | Vue admin lisible et trois vrais produits achetables proposés, mais aucune création autorisée tant que le gate est rouge | **NON TESTÉ — A-038** |
| Publication smoke | Session admin exacte et AAL2 confirmées ; aucune fixture `e2eOnly`, aucun brouillon `[RECETTE …]` et aucun produit de recette dédié | **NON TESTÉ — gate rouge et fixture absente** |
| Résultat durable client/admin, stock, réservation et documents | Aucun paiement n'ayant été créé, aucun de ces effets n'a été fabriqué | **NON TESTÉ — A-038** |

L'identité Safari a été relue avant les parcours admin :
`loa.gto15@gmail.com`, rôle Administrateur, authentification forte confirmée.
Le compte client n'a pas été utilisé dans cette reprise et n'a reçu aucun droit.

### A-039 — chargement indéfini de Stats et Data

Dans cette même session admin vérifiée, Stats est restée sur « Chargement des
statistiques… » et Data sur « Chargement des résumés serveur… / Chargement des
sessions… ». Une navigation Stats → Data, un clic Actualiser Data et un unique
rechargement de `/admin` n'ont pas produit de données ni d'état d'erreur. Les
autres vues citées ci-dessus ont chargé normalement ; Performance affichait
ses métriques et Incidents son registre.

Le fait confirmé est un blocage d'interface des deux lecteurs temps réel dans
Safari. Les projections cloud et les groupes analytics existent et ont été
relus indépendamment ; l'écran vide ne signifie donc pas zéro donnée. Le code
local courant utilise des listeners Firestore `onSnapshot`; il sait afficher
une erreur reçue, mais ne borne pas le cas où le transport ne produit ni
snapshot ni erreur. Cela rend plausible un transport temps réel suspendu, sans
prouver que c'est la cause déployée.

Il manque une trace réseau/console Safari expurgée pour isoler Auth, App Check,
WebChannel ou validation de snapshot. Le correctif minimal à étudier est un
timeout visible et une reprise bornée des canaux Stats/Data, après diagnostic
du transport. Aucun code n'a été modifié pendant la recette.

### Performance sur la fenêtre de reprise

Safari affichait à 21:09 Europe/Paris, pour la fenêtre exacte du 9 septembre
21:04 au 10 septembre 21:04 : 4 151 appels Functions, 1 546 5xx et 86 4xx.
Cloud Monitoring relu à 21:11:29 pour les mêmes bornes UTC et en excluant
Hosting comptait 4 147 appels, 1 546 5xx et 86 4xx. Les classes d'erreur
coïncident ; quatre appels et deux services n'étaient pas encore visibles dans
Monitoring. L'écart est compatible avec le cache et le délai de collecte ; il
n'est pas converti en lectures Firestore ni en coût.

### Repos terminal de la reprise

Safari a été placé sur `about:blank` sans déconnecter la session. Du
10 septembre 19:13:00 au 19:28:37 UTC, Cloud Logging ne contient aucune
requête Cloud Run sur le projet : 0 appel, 0 4xx et 0 5xx. Le relevé final à
19:28:58 UTC confirme `newOrders=0`, `newReservations=0`, `newOutbox=0`, les
trois groupes analytics toujours `succeeded` en tentative 1 et leur queue
vide. Les 14 anciens jobs sont toujours `PAUSED`.

`deliveryUnknown=1` et les deux incidents commerce restent ouverts. Une
autorisation ciblée de recherche dans la boîte Gmail cliente a été demandée,
mais n'a pas été reçue pendant cette reprise ; aucune boîte n'a été consultée.
Il n'existe donc toujours aucune preuve autorisant l'application du plan A-038.

## Effets laissés et limites

- Aucune commande, réservation, transaction Stripe, mutation de stock,
  publication catalogue, tâche commerce, copie e-mail ou suppression média
  créée par cette campagne.
- Un panier local Safari conserve une ligne de recette à 450 € après
  déconnexion ; aucun état cloud associé. Il n'a pas été effacé car le
  nettoyage n'était pas nécessaire à l'intégrité du sandbox.
- Les trois groupes analytics initialement futurs ont terminé en une tentative
  lors de la reprise ; leur queue était vide au premier contrôle post-échéance.
- Pas d'observation sur 24 h ou une semaine, pas de coût déduit des appels, pas
  de validation production.
- Aucun code ou paramètre cloud modifié, aucun déploiement, commit, push ou
  merge.
- Mutations sandbox de la reprise : aucune. Seules des lectures et la navigation
  admin ont été réalisées.

## Validation locale ciblée

Sous Node 22.23.2 et pnpm 11.7.0, 71 tests sur 71 ont réussi : maintenance
durable, outbox, réservations, cycle catalogue, rapprochement commerce,
groupes GC, inactivité groupée et maintenance d'activité. Ils couvrent les
reprises avant/après claim et début d'envoi, ambiguïté d'envoi, doubles effets,
retries épuisés, paiement contre expiration, message périmé après
prolongation, mutation pendant clôture, groupes vides, regroupements volumineux
et réarmement média après cohorte terminée.

Ce sont des preuves de contrat local, pas la preuve que toutes ces courses ont
eu lieu dans le cloud pendant cette recette. Les 7 tests émulateur et le build
antérieurs n'ont pas été rejoués.
