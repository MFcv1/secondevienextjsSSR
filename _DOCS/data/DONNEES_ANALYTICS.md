# Donnees, Firestore et analytics

Derniere mise a jour: 2026-08-12
Statut: `REFERENCE_ACTIVE`

Deploiement sandbox: moteur actif depuis le 2026-07-15 sur App Hosting et Functions `europe-west1`.

Mesures et attribution des couts: [AUDIT_COUTS_FIRESTORE.md](AUDIT_COUTS_FIRESTORE.md). Ce rapport separe les lectures catalogue, admin, analytics non-streaming et listeners, puis fixe le protocole avant/apres des optimisations.

## 1. Principes

- Firestore est la base applicative principale;
- Storage contient les medias, Firestore leurs references;
- Firebase Auth porte l'identite, pas le profil metier complet;
- Stripe est la source financiere externe;
- les snapshots de commande conservent l'historique d'achat;
- les migrations sont dry-run, comptees, sauvegardees et reversibles;
- les analytics doivent etre bornes, minimises et soumis a une politique de retention.

## 2. Arbre logique Firestore

```text
artifacts/{appId}/public/data/furniture/{productId}
users/{uid}
  cart/{itemId}
  wishlist/{itemId}
  passkeys/{credentialId}
  passkey_challenges/{type}
orders/{orderId}
commerce_financial_facts/{factId}
commerce_financial_projections/current
commerce_financial_totals/{currency}
commerce_financial_daily/{date}_{currency}
newsletter_subscribers/{id}
newsletter_reward_plays/{id}
newsletter_rewards/{id}
commerce_promotion_codes/{sha256(code)}
  customers/{sha256(uid)}
  redemptions/{orderId}
sys_metadata/{docId}
sys_ratelimit/{id}
sys_admin_access/{uid}
sys_idempotency/{id}
analytics_sessions/{sessionId}
sales_stats_daily/{id}
order_stats_projections/{orderId}
legacy_order_email_deliveries/{deliveryId}
inventory_stats/{id}
```

Cette carte decrit les collections connues du code. `firestore.rules`, Functions et `map.md` restent les sources pour les permissions et producteurs.

`order_stats_projections/{orderId}` est un ledger backend-only sans TTL propre:
sa retention suit celle de la commande comptable. `onOrderStatsWrite` relit la
commande autoritaire et ce ledger dans une transaction avant tout increment;
un doublon Eventarc ou un evenement ancien recalcule donc la meme projection
au lieu d'ajouter une seconde fois. Le passage d'une commande legacy vers v2
ou sa suppression retire une seule fois sa contribution.

`legacy_order_email_deliveries/{deliveryId}` ne contient ni adresse ni ID de
commande en clair: seulement un hash, le type de message, le provider, le
claim et le resultat technique. Les etats terminaux portent `purgeAt` a 90
jours. La policy TTL est une precondition G2-B et n'est pas appliquee par le
lot local G2-A.

## 3. Catalogue

La collection `furniture` contient annonces, stock, publication, SEO et references image. Les visiteurs ne la lisent pas: la version publique et la revalidation sont portees par les pointeurs/revisions du snapshot Storage.

Les mutations massives doivent conserver:

- identifiant document;
- timestamps utiles;
- images/variantes/metadata;
- statuts et stock;
- categorie et ordre editorial;
- champs SEO;
- compatibilite avec le contrat same-origin `/api/catalog`.

## 4. Utilisateurs

`users/{uid}` contient le profil materialise par les Functions. Le document
racine est en ecriture backend-only; le proprietaire peut le lire mais ne peut
y injecter ni profil, ni role, ni `securityData`. Le registre admin est separe
dans `sys_admin_access`.

Les sous-collections panier et wishlist appartiennent a l'utilisateur avec des
schemas Rules bornes. La wishlist est un snapshot d'affichage non autoritaire:
son identifiant produit doit correspondre a l'ID du document et ses prix ne
sont jamais reutilises au checkout. Les passkeys et challenges sont geres par
les Functions Auth; le client ne doit pas ecrire une attestation WebAuthn
arbitraire.

## 5. Commandes

`orders` est cree cote serveur. Une commande doit garder:

- identite technique utilisateur et e-mail verifie;
- snapshot articles/prix/quantites;
- adresse et livraison;
- total/devise;
- PaymentIntent et compte Stripe utiles;
- statut paiement/logistique;
- traces de reservation/restauration stock;
- refund, idempotence et e-mails.

La retention des commandes doit respecter les obligations comptables. Une demande de suppression utilisateur ne signifie pas la suppression brute d'une facture.

La lecture client est liee uniquement au `userId`/UID materialise au checkout.
L'e-mail verifie reste dans le snapshot metier, mais ne permet jamais de lire
la commande d'un UID different.

Les faits financiers v2 sont append-only. Le total par devise et la serie
quotidienne sont des projections reconstruisibles, maintenues dans la meme
transaction que chaque nouveau fait puis rapprochees par le reconciliateur
horaire. Ces quatre collections sont backend-only dans `firestore.rules`;
l'admin les consomme par callable fort. La serie quotidienne utilise l'index
simple automatique `dateKey`, sans index composite. Aucun TTL ne s'applique:
les rollups suivent la retention des faits et commandes dont ils derivent.

## 6. Metadata systeme

`sys_metadata` porte des configurations comme livraison, galerie, images home, paiement et theme. La liste publique autorisee est explicite dans `firestore.rules`; les autres documents exigent un admin fort ou le serveur.

`sys_ratelimit`, `sys_idempotency` et `sys_admin_access` sont backend-only. Ils ne doivent pas servir de stockage UI generaliste.

Les parties newsletter sont temporaires et ne stockent ni e-mail brut ni IP
brute. `newsletter_rewards` conserve le code, le pourcentage, le hash de
l'adresse, l'échéance et la preuve d'envoi; `newsletter_subscribers` reste la
source d'abonnement administrable. La lecture client passe par Function et
jamais par une requête Firestore du navigateur.

Les promotions sont backend-only. La racine conserve le code, ses contraintes
et des compteurs d'usage; les cles client sont des SHA-256 d'UID et chaque
redemption garde l'UID/orderId necessaire a l'audit transactionnel. Le checkout
ne lit jamais ces documents depuis le navigateur. Aucun index composite n'est
requis: la liste admin utilise le champ simple `createdAt` et la materialisation
newsletter la recherche simple `code`.

## 7. Analytics

Le moteur est le portage fonctionnel du moteur de Tous a Table. Les adaptations sont limitees a Next App Router, aux routes Seconde Vie, a la region Functions `europe-west1` et au controle admin fort deja present dans le projet.

Pipeline:

```text
app/AnalyticsCollectorIsland
  -> AuthProvider avec Firebase Auth anonyme
  -> mapping des routes Next.js vers une page analytics
  -> AnalyticsProvider
  -> initLiveSession, syncSession, beacon
  -> analytics_sessions/{sessionId}, tableau journey embarque
  -> AdminAnalytics
```

Routes suivies:

| Route | Cle analytics |
| --- | --- |
| `/`, `/galerie` | `gallery` |
| `/categorie/[categoryId]` | `category` + identifiant |
| `/produit/[slugOrId]` | `detail` + identifiant |
| `/a-propos` | `about` |
| `/devis` | `quote` |
| `/recherche` | `search` |
| `/wishlist` | `wishlist` |
| `/checkout` | `checkout` |
| `/mes-commandes` | `my-orders` |

Contrat du moteur:

- le collecteur attend 1,5 seconde et ignore les robots courants;
- chaque visiteur obtient un UID Firebase anonyme persistant si aucun compte n'est connecte;
- l'IP est determinee cote Function a partir des en-tetes proxy, jamais fournie par le client;
- l'identite fiable utilise le UID Firebase, puis l'IP serveur, puis l'ID session si l'IP manque;
- le ratio UID/IP mesure l'ecart entre visiteurs uniques et IP uniques;
- la premiere page et chaque changement de route sont synchronises en moins d'une seconde apres initialisation;
- la synchronisation periodique est adaptative: le prochain heartbeat est planifie 15 secondes apres la synchronisation la plus recente et uniquement lorsque l'onglet est visible; une route ou un retour visible evite ainsi un heartbeat immediatement redondant;
- une route demandee pendant un appel en vol est mise en attente et conservee; un heartbeat devenu redondant pendant cet appel est abandonne;
- le beacon de fermeture envoie le dernier parcours et utilise un `fetch keepalive` si le navigateur refuse sa mise en file;
- un jeton aleatoire n'est conserve qu'en version hachee dans Firestore et protege reprise/synchronisation;
- le hash autoritaire du jeton est reutilise au plus 60 secondes dans un cache memoire borne a 1 000 sessions par instance Function; un cache miss et toute reprise relisent Firestore;
- une session supprimee n'est jamais recreee depuis ce cache: l'update autoritaire Firestore doit toujours reussir;
- `lastSyncReason` et `syncReasonCounts` instrumentent `init`, route, heartbeat, visibilite et beacons dans la meme ecriture de session, sans operation Firestore supplementaire;
- une reprise exige le meme UID, le bon jeton, une activite de moins d'une heure et une session non admin;
- une session explicitement fermee ne peut etre reprise que pendant une grace de 15 secondes, afin de tolerer un rechargement immediat sans fusionner un retour plusieurs minutes plus tard;
- l'admin lit au maximum 5 000 sessions commencees dans la derniere annee;
- l'onglet Stats effectue une lecture distincte, sans listener, bornee a 500 sessions commencees dans les 30 derniers jours pour les intentions devis et tendances produits; une erreur de cette lecture ne bloque pas les agregats commerce;
- les vues et visiteurs restent calcules exclusivement depuis `analytics_sessions`; le classement « Meubles en tendance » est ensuite filtre par les identifiants/slugs du catalogue public courant, afin qu'un meuble supprime disparaisse immediatement sans effacer l'historique de visite; le catalogue ne sert aussi qu'a resoudre les miniatures, sans lecture de `furniture`;
- un cache IndexedDB de six heures evite une nouvelle lecture complete a chaque ouverture;
- l'etat live est derive d'une activite de moins de 30 secondes et l'admin ecoute en temps reel les 100 sessions les plus recentes;
- les erreurs analytics ne bloquent jamais checkout, Auth ou navigation;
- ne pas stocker plus de donnees personnelles que necessaire.
- les callables navigateur imposent App Check; le beacon de fermeture exige
  origine exacte, JSON borne et jeton de synchronisation opaque;
- `initLiveSession` ignore tout type `admin` fourni par le navigateur et derive
  le type depuis Auth et le registre IP serveur;
- aucune IP n'est envoyee a un service de geolocalisation tiers; `geo` reste
  `Unknown` tant qu'un fournisseur HTTPS contractualise n'est pas valide;
- les logs de conversion ne contiennent ni e-mail ni IP bruts.

Exclusion admin:

- le collecteur ne cree pas de session lorsque les claims admin sont actifs;
- `trackAdminIP` enregistre l'IP d'un UID present et actif dans `sys_admin_access`;
- `initLiveSession` classe une IP admin comme session `admin`;
- `updateUserSessions` supprime les sessions recentes de l'IP lors de la connexion d'un admin et convertit les sessions anonymes lors de la connexion d'un client;
- `updateUserSessions` determine ce statut depuis `sys_admin_access` sans relire le profil `users/{uid}`, dont le resultat etait auparavant toujours ecrase par le registre;
- les sessions `type == admin` sont exclues de tous les calculs du panneau Data;
- l'e-mail proprietaire est lu depuis le secret serveur `SUPER_ADMIN_EMAIL`, jamais code en dur cote client.

Migration Gen2 sandbox: `updateUserSessionsGen2` est ACTIVE avec le meme handler
que la Gen1, App Check et le runtime dedie `analytics-runtime`. La revision
`updateusersessionsgen2-00001-zoq`, les limites, IAM et deux refus App Check 401
sont conformes. La requalification acceleree a compare une connexion admin
Gen1 puis Gen2: HTTP 200, Auth et App Check valides, donnees conformes, ancien
onglet admin sain et zero nouvel appel Gen1 apres cutover. Le rollout
`g4-a2-cutover-20260817-002` sert `build-2026-08-17-001`; le registre cible
desormais la Gen2. La Gen1 et `build-2026-08-16-001` restent preserves comme
rollback exact jusqu'a G12-A.

`initLiveSessionGen2` est ACTIVE sous un nouveau nom avec
le meme handler que la Gen1, App Check, CPU Gen1, concurrence/max 1 et le
runtime `analytics-runtime`. Sa revision, IAM et deux refus App Check 401 sont
conformes. Le rollout `g4-a3-cutover-20260817-002` sert
`build-2026-08-17-002`; Gen1 et Gen2 ont retourne 200 avec Auth/App Check
valides, les donnees sont equivalentes et zero appel Gen1 suit le cutover
final. Un reload pilote ayant cree une seconde session a ete reproduit de
facon identique sur Gen1; le handler partage et `test:analytics` couvrent la
parite de reprise. La prochaine cible unique est `syncSessionGen2`.

`syncSessionGen2` est ACTIVE avec le meme handler que la Gen1,
App Check, CPU Gen1, concurrence/max 1, `analytics-runtime` et aucun secret.
La revision `syncsessiongen2-00001-zeg`, IAM et deux refus App Check 401 sont
conformes. La reference Gen1 a retourne 200; le registre source est prepare
sur la Gen2 pour le cutover App Hosting. La Gen1 reste intacte.
Le cutover App Hosting n'est pas encore effectif. Apres deux echecs d'upload,
`build-2026-08-17-003` a ete cree READY par transport Google Storage
reprenable et son rollout a reussi. La session Chrome historique s'etant
fermee avant la preuve ancien onglet, le rollback exact a remis
`build-2026-08-17-002` en service. Le client appelle donc encore la Gen1;
aucune donnee ou Function n'a ete supprimee.
La requalification acceleree suivante a conserve un ancien onglet `002`
pendant le rollout `g4-a4-cutover-20260817-002` vers `003`. Ancien et nouvel
onglet ont rendu la galerie; six appels Gen2 ont reussi sans erreur et, apres
le dernier appel Gen1 de fermeture en 200, aucun nouveau trafic Gen1 n'est
apparu. Les donnees avant/apres restent conformes. G4-A4 est fermee et la
prochaine cible unique est `syncSessionBeaconGen2`.

`syncSessionBeaconGen2` est preparee sous un nouveau nom avec le handler Gen1,
origine exacte, jeton opaque, corps 64 KiB et JSON/text. App Check est
explicitement non applicable au transport `sendBeacon`, qui ne peut pas
ajouter son header; le jeton serveur reste obligatoire. CPU Gen1,
concurrence/max 1, `analytics-runtime` et absence de secret sont explicites.
La revision `syncsessionbeacongen2-00001-dih`, IAM et refus origine/jeton 403
sont conformes. La reference navigateur Gen1 reproduit le 415 `text/plain`
deja documente, sans ecriture; le registre source est prepare sur la Gen2 afin
de prouver la correction en 200.

Le cutover `build-2026-08-17-004` a conserve ancien et nouvel onglets sains,
mais le vrai beacon navigateur vers la Gen2 a retourne 403 et n'a pas modifie
la session, restee active. Le rollback exact vers `build-2026-08-17-003` est
SUCCEEDED, les routes publiques/admin repondent 200 et le registre client est
revenu sur la Gen1. IAM Cloud Run reste public au transport; l'origine ou le
jeton doit etre identifie comme cause exacte avant une nouvelle tentative.
Aucune Function, IAM ou donnee n'a ete supprimee.

La cause exacte etait l'absence de variable projet/site dans le runtime Gen2,
qui faisait attendre localhost comme origine. `SITE_URL` est maintenant
explicite sur `syncsessionbeacongen2-00002-vec`. Le retry build `004` est
ferme: ancien/nouvel onglet sains, beacon navigateur 200, session fermee avec
raison `beforeunload`, zero erreur Gen2 et zero nouvel appel Gen1. G4-A5/G4
sont fermees; la Gen1 et le rollback build `003` restent preserves jusqu'a
G12-A.

Limite acceptee pour cette version: le panneau repose sur une lecture bornee et des calculs navigateur, sans rollup. Au-dela de 5 000 documents dans la fenetre, l'interface signale une couverture plafonnee. L'architecture haut trafic sera traitee dans une phase distincte demandee par l'utilisateur.

Optimisation de cout locale au 2026-07-17: la cadence visible, le seuil live, le parcours et la securite de reprise restent inchanges. Le cache de hash et l'arbitrage des synchronisations visent uniquement les relectures et appels rapproches observes dans la fenetre Data Access. Leur gain exact doit etre mesure apres deploiement sandbox avec le protocole de [AUDIT_COUTS_FIRESTORE.md](AUDIT_COUTS_FIRESTORE.md).

Les anciennes collections de rollup peuvent encore exister dans le sandbox apres les versions precedentes, mais aucun code actif ne les lit ou ne les alimente. Aucune purge de donnees historique n'est executee pendant ce portage.

### 7.1 Evenements devis

La vue `Data` distingue strictement la demande de devis du tunnel d'achat direct. Les evenements actuellement emis par le formulaire de restauration sont:

- `quote_request` : consultation de la page, portee par une etape de parcours;
- `quote_start` : premier changement explicite dans le formulaire;
- `quote_email_opened` : ouverture du brouillon e-mail pre-rempli apres validation locale.

`quote_email_opened` exprime une intention d'envoi, pas une demande effectivement recue ni un devis accepte: le formulaire actuel ouvre `mailto:`. Les etats metier `recu`, `qualifie`, `envoye` et `accepte` devront provenir d'un workflow de demande/CRM distinct avant d'etre affiches comme conversions commerciales.

Dans Stats, ce signal est donc affiche comme `Brouillons e-mail ouverts`. Le tunnel compte une fois chaque session par etape et affiche la conversion entre visites, demarrages et ouvertures. Les evenements reposent sur `lastEventPreview`, borne aux 16 derniers evenements de la session: il s'agit d'un indicateur d'intention, pas d'un registre commercial exhaustif.

## 8. Retention

Le sandbox applique des bornes explicites a l'ecriture et dispose d'une purge
manuelle idempotente. Il n'existe volontairement aucune tache planifiee de
suppression: `scripts/purge-expired-firestore.cjs` est un outil operateur en
dry-run par defaut; `--commit` exige une decision distincte. Aucune suppression
n'a ete lancee pendant la passe du 2026-08-12.

| Donnees | Finalite/acces | Borne sandbox |
| --- | --- | --- |
| `analytics_sessions` | mesure produit, admin fort en lecture | 366 jours, `expireAt` a la creation |
| anciens rollups analytics | statistiques historiques techniques | 366 jours par timestamp/date |
| `sys_ratelimit`, `sys_idempotency` | anti-abus et idempotence, backend-only | 30 jours maximum ou expiration explicite |
| audits securite, Stripe Connect, devis et Meta | imputabilite/support, backend-only | 366 jours, `expireAt` |
| tirages/gains newsletter et etats OAuth Meta temporaires | anti-rejeu et reprise, Functions uniquement | expiration explicite, fallback 30 jours |
| promotions inactives sans redemption | configuration commerciale backend-only | 366 jours apres expiration, purge operateur uniquement |
| redemptions et compteurs promotionnels lies a une commande | preuve de montant et anti-double usage, backend-only | meme retention que la commande; aucune purge generique |
| `affiliate_clicks` | attribution bornee, backend-only | 90 jours |
| registre `admin_ips` | exclusion analytics des administrateurs | nettoyage opportuniste apres 90 jours |

G11-R ferme la classification des suppressions analytics: les purges globales
`clearAllSessions` et `clearAllAffiliateClicks` sont `RETIRE_G12_A`, car elles
effacent toute la collection sans respecter la fenetre de retention et doublent
l'outil operateur borne. `deleteSession` est `MIGRATE_GEN2`: l'action ciblee
reste exposee pour le support dans `AdminAnalytics`, mais sa future Gen2 doit
etre dry-run par defaut, liee a la version observee du document et auditee.

Les audits securite conservent l'UID brut parce qu'il est la cle
d'imputabilite, mais e-mail, IP et user-agent y sont hashes. Les sessions
analytics gardent les donnees minimales necessaires au moteur pendant leur
fenetre; aucune geolocalisation tierce n'est appelee.

Sont explicitement exclus de la purge technique generique:

- commandes, faits financiers, factures emises et PDF, soumis aux obligations
  comptables;
- `quote_requests` et leurs photos, car une suppression correcte doit etre
  coordonnee entre Firestore et Storage;
- abonnements newsletter et profils utilisateur, qui exigent une politique
  metier/juridique de droit d'acces, d'export et de suppression.

Avant production restent a valider: consentement/cookies, durees juridiques
des documents commerciaux, workflow d'anonymisation/suppression coordonnee,
sauvegarde/restauration, responsable du traitement et sous-traitants. Ces
decisions ne sont pas necessaires pour presenter le sandbox mais conditionnent
le GO production.

## 9. Indexes

`firestore.indexes.json` declare les indexes catalogue et commandes, ainsi que les exemptions pour les champs analytics volumineux. Toute nouvelle requete composite doit:

1. etre bornee;
2. avoir un index justifie;
3. eviter d'indexer des tableaux/objets lourds inutiles;
4. etre testee sur sandbox;
5. documenter son cout potentiel.

## 10. Scripts de migration

Outils manuels sensibles:

```text
scripts/copy-firestore-project.mjs
scripts/replace-firestore-string.mjs
scripts/purge-expired-firestore.cjs
scripts/backfill-product-*.cjs
scripts/cleanup-product-image-variants.cjs
```

Procedure obligatoire:

1. identifier source et destination;
2. refuser production par defaut;
3. exporter/sauvegarder;
4. dry-run et comptages par collection;
5. echantillons avant/apres;
6. mode commit avec confirmation explicite;
7. verifier rules, indexes, catalogue, admin et checkout;
8. conserver le log de migration hors secrets;
9. preparer rollback ou import de restauration.

## 11. Production

Il n'existe pas encore de migration vers un rail production definitif. Lorsque ce rail sera cree, construire un plan date qui precise:

- freeze d'ecriture;
- export sandbox si des donnees doivent etre reprises;
- transformations de schema;
- import et comptages;
- validation images/Storage;
- creation des comptes/claims sans copier de secrets;
- smoke public/admin/checkout;
- cutover DNS;
- rollback.

Ce chapitre remplace les anciens plans de migration et constitue la seule reference active pour une future copie de donnees.
