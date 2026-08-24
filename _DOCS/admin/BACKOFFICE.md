# Back-office

Derniere mise a jour: 2026-08-12
Statut: `PREPROD_READY`

Etat actif:

> Le sandbox est fonctionnel en `v2_all` avec mutations admin actives pour les
> tests publication, commandes, fulfillment, remboursements et retours.
> App Check, registre admin, AAL2, idempotence et audit restent obligatoires.
> Stripe live et la production ne sont pas actifs.

## 1. Architecture

`/admin` est une route dynamique, `noindex`, montee par `AdminAppIsland`. Elle
n'expose aucun portail de connexion autonome: la galerie et son bouton
`Connexion` constituent l'unique entree visible. Une visite directe sans
session, avec la session Firebase anonyme d'analytics ou avec un compte client
est renvoyee silencieusement vers `/`. Apres une connexion publique, la
resolution d'un claim admin redirige vers `/admin` et revele le lien `Admin`
du header. Cette discretion ne participe pas a la decision de securite, qui
reste appliquee par claims, registre actif, AAL2, App Check, Rules et Functions.
Les grandes vues sont chargees avec `React.lazy` pour ne pas placer tout le
back-office dans le bundle initial. La route ne lit jamais le catalogue public
avant l'authentification. Une fois l'acces admin fort etabli, Stats charge le
catalogue public court en parallele de ses agregats afin de resoudre les
miniatures des meubles en tendance; ce chargement visuel ne bloque pas les
statistiques.

Le sandbox expose l'onglet lazy `Incidents`. Il appelle uniquement
`getDiagnosticTimelineAdminGen2`, exige l'admin fort AAL2 et retourne une
timeline expurgee par commande, paiement, remboursement, correlation ou e-mail
client recherche cote serveur. L'e-mail recherche n'est ni renvoye ni logue;
chaque consultation ecrit un audit hashe. Aucun bouton de reprise financiere
directe n'est expose dans cette console.

L'interface commune de connexion est conservee. L'acces admin repose sur
Firebase Auth, claims, registre `sys_admin_access` et assurance AAL2 Google ou
passkey. La session valide autorise lectures et mutations sans minuterie de
quinze minutes.

## 2. Onglets

La liste executable est `KIT_CONFIG.adminTabs` dans `src/kit/config/constants.js`.

La navigation visible utilise un panneau lateral persistant sur desktop et un tiroir sur les ecrans plus etroits. Les IDs restent inchanges et sont regroupes en cinq ensembles metier afin de reduire la charge cognitive:

- `Vue d'ensemble`: Stats, Data;
- `Catalogue`: Publication, Vue Globale, Studio;
- `Ventes`: Ventes, Devis, Liens de paiement, Factures, Retours, Livraison, Paiement;
- `Communication`: Personnalisation, Infos, SEO;
- `Administration`: Mon compte, Clients, Securite, Maintenance.

Le regroupement est porte par `ADMIN_NAV_GROUPS` dans `AdminAppIsland`; `AdminSidebar` ne modifie ni le routing interne ni le lazy loading des vues.

| ID | Label | Module principal | Role |
| --- | --- | --- | --- |
| `dashboard` | Stats | `AdminDashboard` | synthese cliente des ventes nettes, encaissements, remboursements, panier moyen, commandes, clients, devis, tendances et exports |
| `analytics` | Data | `AdminAnalytics` | visiteurs UID/IP, sessions live, parcours, courbe |
| `furniture` | Publication | `AdminForm`, `AdminItemList` | CRUD annonces et images |
| `inventory` | Vue Globale | `GlobalInventoryView` | ordres editoriaux et stock catalogue |
| `studio` | Studio | `AdminStudio` | outils de contenu/creation |
| `homepage` | Personnalisation | `AdminHomepage` | hero, categories, contenus vitrine |
| `orders` | Ventes | `AdminOrders` + `components/orders/*` | commandes et logistique, liste dense et detail maitre/detail |
| `promotions` | Codes promo | `AdminPromotionCodes` | creation, ciblage produit, bornes temporelles et compteurs d'utilisation des remises serveur |
| `quotes` | Devis | `AdminQuotes` | réception, qualification, photos privées, statuts et notes internes |
| `payment_links` | Liens de paiement | `AdminPaymentLinks` | reservation de meubles et paiement Stripe prive sans compte |
| `invoices` | Factures | `AdminInvoices` | selection de meubles, brouillons, apercu A4, emission PDF verrouillee et envoi e-mail |
| `returns` | Retours | `AdminReturns` | remboursements Stripe |
| `livraison` | Livraison | `AdminLivraison` | tarifs et configuration livraison |
| `users` | Clients | `AdminUsers` | comptes et acces admin |
| `seo` | SEO | `AdminSEO` | controle contenu/indexation |
| `newsletter` | Infos | `AdminNewsletter` | abonnés issus notamment du jeu galerie, recherche et export |
| `payment_settings` | Paiement | `AdminPaymentSettings` | Stripe Connect et activation carte |
| `account` | Mon compte | `AdminAccount`, `BillingOnboardingOperator` | identite admin et pilotage de l'onboarding facturation |
| `maintenance` | Maintenance | `AdminMaintenance` | outils destructifs controles |

Les labels peuvent evoluer; les ID sont des contrats de navigation et ne doivent pas etre renommes sans migration.

Sur desktop (`>= 1024 px`), `AdminAppIsland` affiche une navigation laterale fixe en cinq groupes. Elle reference les IDs de `KIT_CONFIG.adminTabs`, sans precharger leurs vues. Sous ce seuil, `AdminSidebar` devient un tiroir lateral; les IDs et le lazy loading restent identiques.

Le catalogue public court (`scope=cards&limit=120`) est charge paresseusement uniquement par Stats, Data et Vue Globale, qui consomment ses miniatures ou ses donnees. Seule une requete en vol est dedupliquee; aucun catalogue n'est conserve dans `sessionStorage` ou dans un cache module persistant.

## 3. Publication catalogue

`AdminPublicationWorkspace` separe Publication en deux vues grand ecran plein
viewport: `Creer` regroupe le formulaire aere et son resume vivant;
`Publications` affiche une table avec recherche, categories, actions et
synthese des statuts. La liste charge au plus 50 documents par lot; un filtre
de categorie interroge directement cette categorie au lieu de filtrer la seule
tranche globale deja chargee. Les compteurs Total, Publiees, Brouillons et
Vendues proviennent d'agregations Firestore sur toute la collection et ne sont
donc pas des compteurs du lot visible. La recherche reste bornee aux 200
publications les plus recentes. Les trois compteurs sont aussi des filtres:
ils affichent respectivement tous les produits publies disponibles, les
brouillons et les produits publies vendus; un second clic retire le filtre et
le filtre de statut se combine avec la categorie active. A partir de `1280 px`, le document ne scrolle pas: seules
les zones de contenu internes prennent le relais sur un ecran bas. Les formats
plus etroits reviennent au scroll naturel et les categories utilisent un rail
horizontal sans barre visible, puis passent sur plusieurs lignes quand la
largeur le permet. `AdminForm` gere les champs produit, la preparation des
variantes et la sauvegarde. Pour une creation, toutes les images sont envoyees
sur les chemins Storage catalogue historiques avant la premiere creation
Firestore. Le formulaire applique ensuite contenu, offre, stock et statut public
avec une seule commande idempotente et une seule ecriture produit. Un clic Publier ne peut
donc plus laisser apparaitre un brouillon technique sans photo: si l'upload
echoue, aucun meuble n'est cree; s'il reussit, le produit est finalise public.
Une fenetre modale affiche les operations reelles des photos, de l'ecriture et
de la projection. Elle n'affiche plus de pourcentage interpretable comme une
duree: les coches sont autoritaires et chaque libelle ne passe au vert qu'apres
la fin de son operation. La verification securisee couvre le renouvellement du
jeton et le preflight; Photos couvre la generation puis l'envoi des variantes;
Enregistrement couvre la commande produit; Galerie couvre la construction et la
confirmation de la release publique. Le succes n'est confirme qu'apres lecture
du produit dans `/api/catalog`, puis confirmation de la meme identite par
`/api/catalog/version`. Le HTML ISR de `/` continue sa revalidation en
arriere-plan: il n'est plus un verrou du pop-up, car les reprises Cloud Tasks
peuvent le faire converger plusieurs minutes apres un snapshot public deja
valide. L'attente bornee reste de cinq minutes pour la construction du
catalogue. Au succes, l'interface bascule automatiquement vers
Publications sans reinitialiser d'abord le formulaire et met en evidence la
ligne creee. Un handoff court en `sessionStorage` preserve cette vue si l'ile
admin est remontee pendant la transition, sans conserver de donnee catalogue.
La table Publications reste montee mais masquee pendant la composition: sa
premiere page et ses compteurs se chargent en arriere-plan, afin que la bascule
finale n'affiche pas un compteur global rempli au-dessus d'une liste encore
vide. Le formulaire est remonte a neuf uniquement apres une publication
reussie. La confirmation persistante apparait en bas a droite pour ne pas
recouvrir les commandes superieures du back-office. Son lisere vert porte une
rotation lumineuse legere, neutralisee par `prefers-reduced-motion`. Le
conteneur interactif conserve les evenements pointeur jusque sur Safari/iPad;
son bouton est un lien Next natif, pris en charge par la transition galerie,
qui cible l'identifiant du meuble et revele sa carte. Ce lien demande une
transition courte sans logo ni signature Atelier. Si le HTML ISR n'inclut pas
encore le meuble, `/api/catalog?id=...` l'insere directement dans la grille
Nouveautes; aucune carte de secours distincte ne doit creer de vide ou de
doublon pendant la convergence de la release.
Pendant le traitement, les deux vues et l'apercu public sont neutralises et
`beforeunload` avertit avant une fermeture. L'espace de publication reste monte
pendant le renouvellement du jeton administrateur: la transition
interne de relecture des claims ne doit ni fermer la progression, ni perdre le
passage final vers Publications. Sa grille droite
utilise quatre rangees `auto / auto / auto / minmax(220px, 1fr)`: seule la
quatrieme rangee absorbe l'espace vertical restant. Dimensions occupe la
troisieme rangee, avec des controles bornes en largeur. Le formulaire ne
presente plus de panneau SEO manuel: titre, description et eligibilite sont
deduits automatiquement du nom, de l'histoire, de l'image et du statut public.
Le renouvellement force du jeton reprend au maximum deux erreurs transitoires
`auth/network-request-failed` (250 puis 750 ms) avant le preflight. Les autres
erreurs Auth ne sont jamais rejouees. En cas d'echec final, formulaire et
photos restent montes pour une reprise explicite, sans dupliquer une commande
produit.

La liste classe d'abord `status: draft` comme Brouillon, meme si une ancienne
donnee incoherente porte encore `sold: true`. Seuls les produits publies dont
le marqueur de vente est actif sont Vendus. Un brouillon sans media affiche `Photos en attente`, ne
peut pas etre publie manuellement et ne propose aucune action de vente.
`StoryEditor` occupe ensuite les six colonnes de la rangee
extensible; le panneau Photos et le resume utilisent eux aussi `flex: 1` sur ce
meme axe. L'editeur WYSIWYG masque toute syntaxe technique pendant la saisie et
convertit un DOM borne en Markdown au changement: gras, italique, surlignage,
intertitre, citation et listes. Un second clic retire les formats bascules, le
collage est force en texte brut et aucun HTML arbitraire n'est conserve.
Le surlignage est applique par une balise `mark` locale a un seul paragraphe;
l'outil propose les modes Fond, Souligne et Texte avec cinq couleurs stables.
La selection native reste translucide puis se replie apres application pour ne
pas masquer le resultat; la palette sait aussi recolorer ou retirer un `mark`
depuis un simple curseur place dans le texte.
Ses branches Ecrire et Apercu possedent des identites React distinctes: le DOM
`contentEditable` non controle n'est pas reutilise comme conteneur de rendu,
ce qui garantit une seule histoire dans l'apercu.

Le rail de brouillon cree avant upload est retire du parcours actif le
2026-08-07 apres le refus Storage reproductible `STORAGE_UNAUTHORIZED`. Ses
sessions backend restent temporairement disponibles uniquement pour le
diagnostic et leur collecte planifiee; `AdminForm` ne les cree ni ne les reprend.

L'intertitre H2 ne transforme qu'une ligne complete et refuse une selection
partielle avec un retour visible dans le pied de l'editeur.
Deux commandes Annuler et Retablir, placees entre les outils et le choix
Ecrire/Apercu, partagent le meme historique avec les raccourcis clavier. Cet
historique garde au plus 80 etats, regroupe la frappe par salves de 700 ms et
isole chaque collage ou commande de mise en forme afin de restaurer le contenu
et son apparence ensemble.
`RichTextStory` previsualise ce sous-ensemble et l'affiche sur la fiche publique.

Le controle Meta place dans l'en-tete de `AdminForm` ouvre le parcours OAuth
Facebook dans un popup, relit le statut serveur et active ensuite les
destinations Instagram et Facebook sans demander de token ni d'identifiant a
l'operatrice. Si plusieurs Pages sont disponibles, le serveur retourne des
choix opaques et l'interface demande seulement le couple Page/Instagram a
utiliser. `MetaConnectionBadge` et `useMetaConnection` ne recoivent jamais le
Page access token.

Une fois Instagram active, `InstagramPublicationPreview`
reproduit un iPhone 17 Pro sur une surface logique `402 x 874`, puis compose un
fil Instagram clair avec le compte `seconde_vie_pour_nos_objets`, le logo de
l'atelier, le titre, l'histoire reduite en texte brut, les hashtags et un
carrousel manipulable. Les 10 premiers medias sont retenus pour cet apercu; les
eventuels medias 11 a 23 restent destines au site et sont signales dans
l'interface. Les hashtags restent un parametre editorial de la commande
sociale, pas un champ du produit public.

La publication simultanee confirme d'abord le meuble sur le site, puis
`prepareSocialPublicationAdmin` fige un snapshot social derive du produit
serveur. `runSocialPublicationAdmin` publie ensuite les destinations demandees
et persiste chaque etape dans `sys_social_publications`. Instagram accepte une
photo ou un carrousel de dix images maximum; Facebook accepte une photo ou un
post multi-images. Une destination deja `published` n'est jamais relancee par
la reprise ciblee. Le code et les Rules sont presents localement; la
reconciliation G7-R confirme les neuf Gen1 Meta/Facebook/saga et classe les
cinq Instagram directs `MIGRATE_GEN2` (`m = 5`). Le callback Instagram reste
absent du cloud et `HOLD_META_RECONCILIATION` interdit encore G7-D; les preuves
M4/M5 historiques ne valent pas preuve d'etat courant.

`AdminItemList`
affiche les annonces. `GlobalInventoryView` pilote les classements editoriaux.

Avant de creer la session, `AdminForm` force le renouvellement du jeton Firebase
puis appelle `preflightProductMutationAdmin`. Le serveur confirme App Check, le
registre admin actif et une authentification forte AAL2. Le meme jeton a jour
est ensuite presente a Storage. Seul le proprietaire de
`product_publication_sessions/{sessionId}` peut ecrire les sources sous
`furniture/publication-sessions/.../originals`; les variantes sont en ecriture
backend uniquement. Les anciens chemins produit restent reserves a un admin
fort actif. Les sources d'une publication terminee sont placees dans la
quarantaine media et les sessions expirees sont collectees quotidiennement.
La publication catalogue est
independante de `adminMutationMode`, qui reste reserve aux commandes commerce
transactionnelles. Les commandes produit, remboursements et operations
confirmees n'imposent aucune reconnexion temporelle; les protections a fort
impact reposent sur confirmation, role, audit et validation serveur.

Apres mutation:

- l'ecriture doit respecter `firestore.rules`;
- `onCatalogSourceWrite` enregistre la revision et construit le snapshot;
- la task HMAC rafraichit les routes ISR;
- les erreurs partielles doivent rester visibles et reprenables.

### 3.1 Publication Instagram directe et Facebook optionnel

`MetaConnectionBadge` et `useMetaConnection` donnent la priorite a la connexion professionnelle
Instagram. Le popup officiel Instagram demande les identifiants au fournisseur,
jamais au back-office. Un compte Instagram Business ou Creator peut donc
autoriser la publication sans compte ni Page Facebook. Le serveur conserve le
jeton long terme chiffre dans `sys_meta_connections/instagram_direct`.

Facebook reste un rail distinct et facultatif dans
`sys_meta_connections/default`. Il est ajoute uniquement lorsque la Page doit
elle aussi recevoir la publication. Pour Instagram, la saga prefere toujours
la connexion directe et conserve l'ancien compte Instagram lie a une Page
comme fallback de compatibilite. Le choix du fournisseur est fige lors de la
preparation afin qu'une reprise ne change pas silencieusement d'identite.

Les destinations sont validees independamment: Instagram exige une connexion
Instagram directe ou liee a Facebook; Facebook exige une Page connectee. Les
projections renvoyees au navigateur n'exposent ni ID distant ni jeton chiffre.

Le profil renvoye par l'API Instagram Login est lu selon son enveloppe
`data[]` et ses champs `user_id,username`. Apres le callback, le controle garde
un etat de synchronisation jusqu'a la confirmation serveur. Il distingue
explicitement `Connecte`, `Via Facebook` et `Non connecte`; le bouton generique
`Connecter` devient `Connecter en direct` lorsque seul le fallback Facebook est
actif, puis disparait des que la connexion Instagram directe est confirmee.
L'identifiant `user_id` du profil est autoritaire: l'identifiant app-scope du
premier echange de token ne doit pas lui etre compare comme une identite
publique. La fermeture du popup conserve une fenetre de grace de 18 secondes
pour laisser le callback terminer avant d'afficher un echec.

La confirmation finale distingue la connexion du routage de la publication.
Le resume conserve une seule action `Publier`. Elle ouvre un dialogue modal ou
le site est toujours inclus et ou seules les destinations sociales reellement
connectees sont proposees. L'operatrice peut choisir le site seul, le site avec
Instagram, le site avec Facebook ou les trois. Le bouton de confirmation nomme
les destinations retenues. Une connexion Instagram active ne provoque donc
jamais, a elle seule, un envoi, et une cliente sans Page ne voit pas Facebook
dans ce dialogue.

La configuration Meta/Firebase, la recette et le diagnostic OAuth sont
centralises dans [INSTAGRAM_OAUTH_RUNBOOK.md](INSTAGRAM_OAUTH_RUNBOOK.md).

## 4. Personnalisation

`AdminHomepage` ecrit des documents `sys_metadata` pour hero, images, textes et sections. Chaque nouveau bloc personnalisable doit avoir:

- un schema borne;
- un fallback serveur stable;
- une validation d'URL/image;
- un rendu public sans dependance a l'admin;
- une strategie de revalidation.

## 5. Ventes, retours et paiements

- `AdminOrders`: consultation, statut logistique, modale d'expedition et
  actions admissibles. La vue est organisee en maitre/detail: liste dense
  segmentee par `A traiter / En attente / Cloturees`, recherche locale, puis
  panneau de detail ouvrant sur l'action attendue, le parcours horodate, le
  panier et le contact. Le detail passe en feuille sous `xl`. Les fonctions
  de derivation (etat en quatre temps, segments, recherche, colonnes CSV)
  sont isolees dans `components/orders/orderPresentation.js` et ne lisent ni
  n'ecrivent aucune donnee;
- `AdminInvoices`: creation assistee de factures manuelles, reprise des
  brouillons et bascule detail/vue d'ensemble dans le selecteur catalogue;
- `AdminQuotes`: reception des demandes envoyees depuis `/devis`, recherche
  locale sur les cent dossiers les plus recents, indicateurs bornes, fiche
  client/projet, photos privees, statut de suivi et notes internes;
- `AdminReturns`: remboursement, synchronisation et e-mail client;
- `AdminPaymentSettings`: Connect, carte/wallets et etat de disponibilite;
- `AdminLivraison`: configuration des frais.

### 5.1 Demandes de devis

Le formulaire public ne cree aucun document Firestore directement. Il appelle
`createQuoteRequest`, transmet chaque photo compressee a
`uploadQuoteRequestPhoto`, puis finalise le dossier avec
`finalizeQuoteRequest`. Les tarifs indicatifs et libelles de prestations sont
recalcules par le serveur; le navigateur ne peut pas imposer un montant.

`AdminQuotes` est charge paresseusement et sa premiere liste est prechargee
apres validation de l'acces admin fort. Les lectures et changements de statut
passent par des callables qui exigent claim, registre actif et AAL2. Une
version optimiste empeche d'ecraser une modification concurrente. Les photos
restent sous `quote-requests/v1` avec lecture Storage directe interdite; la
fiche admin recoit uniquement des URL signees de quinze minutes.

Le workflow actif est `Nouveau`, `A qualifier`, `A recontacter`, `En etude`,
`Proposition prete`, `Termine` ou `Non retenu`. Les changements sont audites
sans recopier les notes libres dans l'audit. La notification client est un
effet secondaire: son echec n'annule jamais la reception du dossier. Aucun
e-mail n'est envoye a une adresse metier Seconde Vie tant que cette adresse
n'existe pas.

La recette sandbox du 2026-08-10 a valide le parcours public complet, l'accuse
Gmail client et l'apparition du meme dossier dans la liste puis la fiche admin.
Le controle admin reproductible utilise
`e2e-sandbox-role-session.mjs --role=admin --expect-quote=<reference>` avec
une session ephemere AAL2 et un jeton App Check borne; il ne remplace pas la
ceremonie de connexion Google reelle.

### 5.2 Newsletter et avantages

Le jeu public ajoute ou met à jour `newsletter_subscribers` uniquement via
Function. L'onglet `Infos` conserve sa liste administrateur et son export; le
code promotionnel reste séparé dans `newsletter_rewards`, inaccessible au SDK
navigateur. Le tirage est serveur, la partie est temporaire, la réclamation
est idempotente et le client relit ses codes par callable authentifiée.

La recette sandbox du 2026-08-10 a confirme que la reduction et le code
durable sont strictement identiques dans la galerie, l'e-mail client et le
bloc `Mes avantages` de `/mes-commandes`.

Le 2026-08-13, l'onglet dedie `Codes promo` a ete ajoute au groupe Ventes. Il
reprend les composants et materiaux normalises du back-office: entete compacte,
panneaux sans decoration superflue, champs natifs lisibles et etats explicites.
L'administrateur peut creer un code genere par le serveur ou nomme, choisir un
pourcentage de 1 a 50 %, une selection de produits ou tout le catalogue, une
periode, un minimum, un plafond et des limites globale/par client. Il peut
ensuite suspendre ou reactiver le code.

Toutes ces actions passent exclusivement par des callables App Check qui
exigent claim admin, registre actif et AAL2, puis verifient le control plane
commerce. Les documents et sous-collections `commerce_promotion_codes` restent
backend-only dans les Rules: le back-office ne peut pas forger les compteurs
avec le SDK Firestore. Les compteurs `reserved` et `committed` distinguent un
checkout encore payable d'un paiement Stripe confirme.

La requalification sandbox du 2026-08-13 a confirme cette distinction dans le
back-office: `RECETTE10-AUG13` est passe de `0/1 utilise, 1 reserve` pendant la
reprise du checkout a `1/1 utilise, 0 reserve` apres paiement Stripe test. La
vue Ventes expose la meme commande payee a 765 EUR pour un produit affiche a
850 EUR avant remise.

### 5.3 Contrat de la vue Ventes

La vue repond d'abord a l'actionnabilite, sans confondre paiement, logistique,
remboursement et garde physique:

- `A traiter`: action boutique requise, anomalie a verifier ou remboursement
  complet dont la piece est encore sous garde `merchant`;
- `En attente`: paiement, retrait client ou transport en attente d'un tiers;
- `Cloturees`: dossier logistique termine, annule ou rembourse avec piece
  sortie de la garde boutique;
- `Toutes`: commandes chargees, ordonnees `A traiter`, puis `En attente`, puis
  `Cloturees`, avec ordre chronologique stable dans chaque groupe.

La premiere page reste bornee a 50 commandes. Les compteurs, la recherche et
l'export CSV portent explicitement sur les commandes chargees; l'interface
signale quand un historique plus large reste disponible. L'export conserve
les 15 colonnes comptables et annonce le nombre de lignes exportees. Aucune
commande n'est selectionnee automatiquement, sauf `focusOrderId`, afin de ne
pas charger une timeline sans intention operatrice.

Le detail affiche une seule action primaire issue de `allowedActions`. Les
actions de fulfillment sont suspendues par le serveur lorsque le remboursement
est `pending`, `needs_review` ou `full`; la presentation applique la meme garde
contre une projection client en cache. Un remboursement `partial` conserve les
actions logistiques admissibles et porte le libelle explicite
`Remb. partiel`. Un remboursement complet avec garde `merchant` reste dans
`A traiter`, sans bouton de retrait ni d'expedition: la piece ne doit pas etre
republiee tant que sa remise en stock n'a pas ete enregistree dans `Retours`.
La methode figee dans `deliverySnapshot` separe ensuite strictement les rails:
preparation puis pret/retrait pour `delivery-pickup`, preparation puis
expedition/livraison pour le transport. L'interface ne peut pas rendre une
action de l'autre rail et le serveur refuse la meme transition en appel direct.

La timeline conserve les douze types d'evenements commerce, le repli des
commandes v1, le chargement a la demande et le rafraichissement apres commande.
Les confirmations utilisent les modales communes avec piege de focus, retour
du focus et `Escape`; les libelles fonctionnels restent lisibles a partir de
10 px et les montants utilisent des chiffres tabulaires.

`AdminLivraison` ne possede plus de faux bouton en lecture seule. Les callables
`getDeliveryPolicyAdmin` et `saveDeliveryPolicyAdmin` lisent la politique
active puis creent une nouvelle version immutable lors de chaque sauvegarde.
La transaction bascule `sys_commerce_control/current.activePolicyVersion`,
incremente `controlRevision` et met a jour la projection publique
`sys_metadata/delivery`. Les commandes existantes restent epinglees sur leur
ancienne version. Une revision concurrente est refusee puis rechargee dans
l'interface au lieu d'ecraser silencieusement les tarifs.

Le sandbox transactionnel garde Stripe carte actif. Le faux interrupteur
Paiement en lecture seule a ete remplace par un statut: le rail offline/Wero
reste explicitement inactif tant qu'il n'existe pas de commande serveur v2
qualifiee correspondante.

Cette politique sans minuterie, le writer Livraison et les corrections de
Publication ont ete deployes sur le sandbox le 2026-08-04. Le compte Google ou
la passkey ne donne des droits qu'avec claim et registre admin actif; une
session OTP/AAL1 ou un registre retire reste refuse.

Etat actuel depuis le 2026-08-02:

- les onglets Publication, Inventaire, Ventes, Retours, Livraison et Paiement
  sont utilisables sur le sandbox avec Stripe test;
- l'ancien wrapper UI `read_only`/`inert` a ete retire;
- les Rules refusent les writes SDK `orders`, create/delete produit, champs
  commerce produit et politiques, y compris avec claims admin forts;
- le dashboard presente les montants financiers autoritaires avec des libelles
  metier et sans exposer les metadonnees techniques de qualification;
- cet etat est deploye sur le sandbox; le release qualifiant Gate 7B est
  `build-2026-07-28-009` / `release_gate7a_c5259a87f875_f00378380561`.
- Gate 8 a valide actions autorisees derivees serveur, transition interdite,
  fulfillment, refunds avant/apres livraison, retour/restock et suspension de
  policy; ces commandes sont maintenant ouvertes durablement sur le sandbox
  pour la batterie de tests fonctionnels.

Cible: toute transition commande, fulfillment, inventaire, refund/retour et politique commerce passe par une commande serveur idempotente. Firestore reste une projection et non une API metier admin.

### 5.4 Factures manuelles

L'onglet `invoices` est distinct des recus commerce sandbox. Il charge
paresseusement `AdminInvoices` et propose trois etapes: selection de plusieurs
meubles, edition des coordonnees/lignes avec apercu A4, puis envoi du PDF. Une
ligne libre reste possible et les prix du brouillon sont explicites; cette
surface ne modifie ni le catalogue, ni le stock, ni une commande Stripe.

Les quatre callables `getManualInvoiceWorkspaceAdmin`,
`saveManualInvoiceDraftAdmin`, `prepareManualInvoicePdfAdmin` et
`sendManualInvoiceAdmin` exigent App Check, registre admin actif et AAL2. Les
brouillons restent modifiables avec controle de version. Le premier envoi
attribue dans une transaction un numero `FAC-AAAA-NNNNNN`, passe le document a
`issued` et le verrouille. Le PDF serveur est materialise sous un chemin
Storage prive derive de son hash; l'envoi reutilise le provider transactionnel
et conserve un dossier de livraison sans stocker l'adresse e-mail en clair.

Le profil emetteur `admin_business_profiles/invoicing`, les factures
`admin_invoices`, leurs sous-collections et les sequences
`admin_invoice_sequences` sont backend-only dans les Rules. L'administratrice
doit completer nom legal, adresse, e-mail et SIREN avant la premiere
sauvegarde. Le regime TVA reste un choix explicite a valider avec les
informations juridiques et comptables finales avant production.

Historique Gate 0B: jusqu'a l'activation fixture, Publication, Ventes, Retours,
Livraison et Paiement etaient read-only pour prix, stock, vente, commande,
policy et medias destructifs. Depuis l'activation sandbox, les actions metier
passent par les commandes serveur et `allowedActions`.

Le transport callable fulfillment/archive commande est deploye dans
`functions/src/commerce/v2OrderCommands.js`: App Check, registre admin actif,
AAL2 Google ou passkey et acteur derive du contexte Auth. `AdminOrders`
l'appelle derriere le controle serveur actif et des `allowedActions` calcules
serveur.

L'archivage d'une publication utilise une modale applicative, pas
`window.confirm`. La cle de commande est creee a l'ouverture puis conservee
pendant les reprises; l'interface attend la reponse callable et affiche succes
ou erreur. Pour une commande, le serveur conserve la projection financiere et
ecrit `archivedAt`, `archivedBy` et `archiveReason`; toute action ulterieure est
refusee et la lecture admin l'exclut de la liste active. Pour un produit, le
statut devient `archived`. Dans les deux cas, l'audit et l'historique de stock
sont conserves et aucune suppression optimiste locale n'est permise.

L'expedition n'utilise plus de dialogue natif. Une modale integree distingue
explicitement l'expedition avec suivi, sans suivi et l'annulation sans effet.
Le transporteur et le numero sont valides serveur. Une commande distincte
`updateOrderTrackingAdmin` permet ensuite d'ajouter, corriger ou retirer le
suivi d'une commande expediee sans rejouer la transition d'expedition. Les
liens client sont derives d'une liste de transporteurs autorises; aucune URL
libre du navigateur n'est stockee.

Le transport refund admin est prepare dans
`functions/src/commerce/v2RefundCommands.js` avec les memes controles forts,
le secret Stripe et un runtime minimal reprenable. Il est exporte et actif sur
le sandbox derriere `adminMutationMode=v2`.

Les transports de retour physique sont prepares dans
`functions/src/commerce/v2ReturnCommands.js`: ouverture, annulation,
reception, restock, write-off et resolution sont des commandes fermees avec
App Check, registre admin actif, AAL2 Google ou passkey, acteur Auth serveur,
versions et quantites bornees. Ils sont exportes et actifs sur le sandbox
derriere `adminMutationMode=v2`.

Gate 5 active les lecteurs Functions pagines pour Ventes et Retours. Les
commandes v2 exposent leurs seules `allowedActions` serveur et les historiques
v1 restent read-only. Aucun des cinq onglets
commerce n'ecrit plus directement un champ commerce via le SDK navigateur.

Dans Ventes, la ligne de commande normalise les Timestamps Firestore et
callable afin d'afficher la date et l'heure jusqu'a la seconde. L'ouverture
d'une commande charge, via `getOrderTimelineAdminV2`, au plus 100 entrees de
son journal serveur et compose une chronologie bornee: creation, paiement
confirme, cinq etapes fulfillment, annulation et etapes de remboursement. Les commandes legacy sans
journal conservent un repli sur leurs champs de projection disponibles,
signale comme moins detaille lorsque aucune date exploitable n'existe.

Apres une commande fulfillment, Ventes force une relecture de la premiere page
et de la chronologie ciblee. Le badge financier (`paid`, rembourse, etc.) reste
separe du badge logistique (`preparing`, prete au retrait, expediee, livree):
un paiement durable ne doit jamais etre interprete comme l'absence de
transition logistique.

Dans Retours, les commandes v2 sont normalisees depuis `payment`,
`refundAggregate`, `shippingSnapshot` et les projections de statut avant le
filtrage Stripe. Les dossiers `orders/{orderId}/returns/{returnId}` lus par
`listReturnsAdminV2` restent visibles et detailles independamment des commandes
de mutation: statut, motif, date et quantites demandees, recues puis disposees.
L'activation des boutons ne change pas ce contrat de consultation. La requete
collection group `returns` est
portee par l'index `updatedAt` ascendant/descendant de
`firestore.indexes.json`. Les lecteurs commandes et retours physiques sont
isoles avec `Promise.allSettled`: une indisponibilite du second ne masque plus
les remboursements deja projetes dans les commandes. Cet index a ete deploye
sur le sandbox `secondevienextjsssr` le 2026-07-29 apres confirmation dans les
logs de l'erreur Firestore `FAILED_PRECONDITION`.

Depuis le 2026-08-01, Retours charge aussi la file bornee
`orders/{orderId}/customer_return_requests/{requestId}` avec
`listCustomerReturnRequestsAdminV2`. Une demande client est separee du refund
Stripe et du retour physique. L'administratrice choisit soit `Rembourser
maintenant` lorsque la garde serveur est encore `merchant`, soit `Autoriser le
retour` lorsque la garde est `carrier` ou `customer`. Le second choix cree le
dossier physique quantitatif existant; `Rembourser apres inspection` reste
indisponible jusqu'a sa reception, sa disposition (`restock` ou `write_off`)
et sa resolution. Un refus est trace sans appel Stripe. Les decisions restent
derriere `adminMutationMode=v2`, actif sur le sandbox depuis le 2026-08-02.
L'index collection-group `customer_return_requests.updatedAt` est
deploye sur le sandbox depuis le 2026-08-01.

La seconde passe UX du 2026-08-01 remplace la synthese en six cartes et le
mode d'emploi permanent par une file de travail compacte. Les vues `A traiter`,
`Retours en cours`, `Stripe`, `Remboursement manuel`, `Historique` et `Tout`
comptent des commandes distinctes et partagent une recherche meuble/client.
Le meuble, le client et l'etape metier restent au premier niveau; IDs Stripe,
dates de synchronisation et quantites detaillees sont replies dans le dossier.
Les actions de reception, disposition et resolution utilisent une modale
quantitative integree et n'ouvrent plus de `window.prompt`. Le mode
`read_only` est signale une fois en tete sans repeter une explication dans
chaque ligne.

La lecture admin joint au plus la derniere tentative
`orders/{orderId}/refunds/{refundRequestId}` pour chaque commande remboursee
ou en rapprochement. Elle expose uniquement la reference, le montant, les
statuts fournisseur/domaine et la date necessaires a l'exploitation. Une
commande `refund_pending` propose `Verifier Stripe` lorsque les mutations
admin v2 sont autorisees: l'action rejoue la meme `refundRequestId` et la meme
cle Stripe idempotente, y compris avec un autre administrateur fort, sans
creer un second remboursement. Chaque reprise porte un evenement d'audit
dedupe par tentative, version et acteur.

Apres une mutation, Retours force une relecture de sa premiere page au lieu de
conserver le cache deux minutes. Un bouton `Actualiser` reste disponible. Les
compteurs utilisent les `allowedActions` et axes v2 (`pending`, `full`,
`needs_review`) plutot que les seuls statuts legacy; leur perimetre charge est
affiche et ils s'etendent avec la pagination. Les references Refund et dates
de synchronisation proviennent de la tentative v2 lorsque la projection
legacy ne les contient pas.

Publication, Ventes et Retours embarquent leurs transports de commande, mais
leur exposition ne depend plus du flag public checkout. Le backend conserve le
control plane fail-closed; `adminMutationMode=v2` est actif sur le sandbox.
Livraison/Paiement continuent de passer par leurs commandes serveur qualifiees.

Recette historique sandbox du 2026-07-28: une session admin forte existante a charge le
dashboard et les lecteurs pagines `Ventes`/`Retours` sans erreur sous les Rules
restrictives. `Livraison` et `Paiement` etaient encore read-only a cette date;
`Publication` ne presentait aucun controle de mutation commerce actif. Aucune
commande, aucun refund et aucune transition de retour n'ont ete executes.

Passe UX du 2026-07-30:

- `Ventes` normalise les commandes v1 et v2 avant affichage et export:
  `shippingSnapshot`, `customerSnapshot`, montants en centimes, titres et prix
  snapshots sont projetes vers un modele d'affichage unique;
- une valeur financiere absente n'est plus rendue comme `undefined EUR`, et les
  coordonnees absentes portent un libelle explicite;
- le statut financier du dashboard retente deux fois la lecture admin apres une
  erreur transitoire. Une projection deja en cache reste affichee si le
  rafraichissement echoue, sans inventer de chiffre.

Cette passe historique precede l'activation sandbox permanente du 2026-08-02.

### 5.5 Liens de paiement de secours

L'onglet `payment_links` charge paresseusement `AdminPaymentLinks`. Il permet
de selectionner un a vingt meubles achetables depuis le snapshot admin, de
choisir la livraison et une validite de 30 minutes a 24 heures, puis de copier
une URL privee. L'e-mail client est facultatif; lorsqu'il est renseigne il est
verrouille et masque sur la page publique. Aucun compte, OTP ou session client
n'est requis pour payer.

Le serveur relit les produits Firestore, le prix, le stock, la policy et le
compte Connect avant de creer atomiquement l'order v2 et ses reservations. Les
actions exigent App Check, registre admin actif, AAL2 Google ou passkey,
`newCheckoutMode=v2_all` et `adminMutationMode=v2`. Ces conditions sont actives
sur le sandbox depuis le 2026-08-02.

Un lien actif peut etre prolonge sans depasser 24 heures restantes. Son URL ne
peut etre changee que tant qu'aucun PaymentIntent n'a ete remis au client;
l'ancienne signature devient alors invalide. L'annulation et l'expiration
passent par la saga provider-first: Stripe est rapproche avant liberation du
stock. Un lien expire ou annule n'est jamais reactive; `Nouveau lien` cree une
nouvelle commande et revalide prix et disponibilite. Un etat Stripe ambigu
reste `needs_review` et ne propose aucune duplication aveugle.

Ce rail, son index Firestore, ses Functions et le secret
`PAYMENT_LINK_HMAC_SECRET@1` sont deployes sur le sandbox depuis le 2026-08-01.
Les controls `v2_all/v2` rendent ce rail utilisable sur le sandbox depuis le
2026-08-02 avec Stripe test.

## 6. Utilisateurs et securite

`AdminUsers` appelle les Functions de gestion d'acces. Seul un owner actif
connecte avec Google ou passkey peut ajouter ou retirer un autre administrateur
apres la confirmation explicite. L'owner reste
protege a trois niveaux: email configure, enregistrement `superAdmin/owner` et
registre `sys_admin_access`; aucune interface ni Function ne peut le revoquer.
Les promotions/retraits restent traces et exigent le niveau d'assurance defini
dans le chapitre Auth.

La gestion IP est un signal complementaire; elle ne remplace pas Auth, AAL2, rules ou registre admin sauf si un controle serveur explicite l'impose.

### 6.1 Guide manuel de facturation Google

Le guide `BillingOnboardingGuide` est un parcours pedagogique, pas une integration Cloud Billing. Il ne cree pas de compte, ne rattache aucun projet et ne configure aucun budget. Toutes les actions financieres restent effectuees par la cliente dans la console officielle Google; le site ne recoit jamais sa carte, ses coordonnees bancaires ou un jeton Google.

Le parcours remplace temporairement les onglets pour l'unique UID cible et comprend:

1. une explication courte du partage des responsabilites;
2. un lien officiel vers la creation du compte Google Billing;
3. la saisie de l'identifiant Billing au format `AAAAAA-BBBBBB-CCCCCC`;
4. l'ajout de l'adresse technique avec `Billing Account User` et `Billing Account Costs Manager`;
5. un ecran d'attente pendant la mise en place manuelle par le super-admin.

Les emplacements de captures sont volontairement des placeholders tant que le parcours reel avec le compte test n'a pas ete photographie. Les captures devront etre recadrees pour masquer adresse personnelle, carte, raison sociale sensible, identifiant Payments et toute donnee inutile avant integration.

Le compte super-admin conserve un bypass permanent du parcours cible.
L'onglet dedie `Mon compte` charge paresseusement
`BillingOnboardingOperator` pour tout administrateur actif: en mode actif, ce
panneau montre uniquement le compte cible, son etat, son e-mail admin et son
identifiant Billing. Aucun statut d'onboarding n'est affiche dans Stats. La
validation exige la phrase `VALIDER LA FACTURATION`; la reinitialisation exige
`REINITIALISER LE TEST` et n'existe qu'en mode `test`. Ces actions passent par
Functions, exigent une authentification admin AAL2 active et sont auditees
sans donnee bancaire.

Quand les callables ne sont pas encore deployees ou accessibles depuis le runtime local, `Mon compte` affiche un etat neutre `Non raccorde`; il ne doit jamais exposer au super-admin le message brut Firebase `internal`. Cette indisponibilite n'active aucun parcours et ne bloque pas Stats.

Modes serveur:

| Mode | Effet |
| --- | --- |
| `disabled` | guide inactif pour tous; valeur par defaut et rollback immediat |
| `test` | guide visible uniquement pour `BILLING_GUIDE_TEST_UID` |
| `live` | guide visible uniquement pour `BILLING_GUIDE_LIVE_UID` |
| `completed` | guide globalement clos; les onglets normaux sont affiches |

Une completion individuelle ouvre aussi le back-office normal pour l'UID concerne. La progression reside dans `sys_billing_onboarding/{uid}`, inaccessible aux SDK clients et ecrite uniquement par les callables:

- `getBillingGuideStatus`;
- `saveBillingGuideProgress`;
- `getBillingGuideOperatorStatus`;
- `completeBillingGuideAdmin`;
- `resetBillingGuideTest`.

Les deux roles Google indiques ne sont pas presentes comme temporaires dans le guide. Ils servent durablement a rattacher les projets autorises et a suivre/configurer leurs couts, sans donner acces au moyen de paiement. Une revocation future reste une decision explicite de la cliente ou un changement de responsabilite, pas une etape d'onboarding.

Recette manuelle fermee, seulement apres validation d'un deploiement sandbox:

1. creer l'identite Google de test et l'ajouter comme admin non proprietaire via `AdminUsers`;
2. relever son UID Firebase puis configurer `BILLING_GUIDE_TEST_UID`, `BILLING_GUIDE_TECHNICAL_EMAIL` et enfin `BILLING_GUIDE_MODE=test`;
3. parcourir les cinq ecrans avec ce compte, fermer/reouvrir `/admin` entre deux etapes et realiser les captures;
4. revenir avec le super-admin, copier l'identifiant Billing, effectuer ou simuler la mise en place technique convenue, puis valider;
5. verifier que le compte test retrouve les onglets admin;
6. utiliser `Recommencer` si une seconde passe de captures est necessaire;
7. a la fin, remettre d'abord `BILLING_GUIDE_MODE=disabled`, retirer l'acces admin du compte test et conserver le code dormant.

Cette recette n'autorise aucun rattachement du vrai sandbox ou d'une future production sans action cloud separee et explicitement approuvee.

## 7. Analytics et statistiques

Le dashboard lit les agregats:

- `dashboard_stats/commerce`;
- `inventory_stats/overview`;
- `sales_stats_daily`;
- `order_stats_projections/{orderId}` comme ledger backend-only idempotent;
- commandes recentes bornees.

Les cartes `Ventes nettes`, `Commandes`, `Panier moyen` et la repartition des
statuts ne dependent plus seules du rollup legacy. Chaque nouveau fait
financier met a jour atomiquement `commerce_financial_totals/{currency}` et
`commerce_financial_daily/{date}_{currency}`. A chaque nouvelle consultation
authentifiee de `/admin`, `getCommerceOperationsStatusAdmin` lit le total
materialise et au plus 366 jours, sans rescanner les faits financiers. Les
nombres de commandes payees, expediees, en attente et annulees restent
calcules par des agregations `count`.

La valeur deja connue reste affichee pendant cet aller-retour puis est
remplacee par la synthese serveur complete. Le navigateur ne l'ajoute jamais
localement a l'ancienne valeur, ce qui evite le double comptage.

Le dashboard consomme les claims admin deja resolus par `AuthContext`. Il ne
force pas de renouvellement du jeton Firebase a son montage: un rafraichissement
de claims en arriere-plan ne doit jamais demonter puis remonter Stats en boucle.

Les montants financiers conservent un etat `loading/error/ready`: une valeur
absente n'est jamais rendue comme un vrai `0 EUR`. Le compteur clients utilise
`sys_user_stats/current`, maintenu par les triggers Auth create/delete; le
premier appel apres migration initialise ce document par un scan borne aux
pages Firebase Auth, puis les ouvertures suivantes lisent le compteur.

La surface Stats affiche les ventes nettes, les montants encaisses et
rembourses ainsi que le panier moyen des commandes encaissees. La carte
principale conserve ce bilan par defaut et permet de basculer vers le dernier
graphique des ventes. Les vues 1 heure et 24 heures chargent a la demande un
historique borne a 300 commandes recentes pour fournir une granularite de cinq
minutes puis horaire; les vues 7 jours, 30 jours, 365 jours et Max reutilisent
les rollups quotidiens deja charges. Le selecteur se replie sur deux lignes et
le SVG reste borne a la largeur de la carte sur mobile.

Les selecteurs Bilan/Graphique et periode forment un meme bloc compact; le
second apparait directement sous le premier en vue Graphique. L'infobulle des
montants reste dans une reserve interne en haut du SVG et ne peut plus passer
sous les controles, y compris lorsqu'un pic atteint le maximum de l'axe.
Les champs de controle internes de la projection (source, mode, faits,
divergences et date de construction) restent disponibles cote serveur pour
l'exploitation mais ne sont pas exposes a la cliente.

Restriction commerce: le rollup legacy conserve uniquement le repli historique
tant que la projection v2 n'a pas encore ete initialisee. Les cartes et le
graphique quotidien utilisent les faits immuables qualifies via leurs rollups
materialises. Un encaissement ou remboursement confirme actualise ces rollups
dans la meme transaction idempotente; l'ecran n'attend donc aucun scheduler.
Le reconciliateur horaire reconstruit les valeurs absolues uniquement comme
filet de securite et moyen de reprise.

Un fallback historique borne existe encore pour les commandes si leurs agregats manquent. Stats ne scanne plus `furniture` lorsque `inventory_stats/overview` est absent: la valeur catalogue affiche alors un tiret jusqu'a la prochaine publication snapshot, dont le builder regenere l'agregat. Ce garde-fou evite jusqu'a 300 lectures produit a chaque ouverture de Stats sans afficher un faux zero comme une valeur autoritaire.

Les modules `Intentions de devis` et `Meubles en tendance` lisent separement au maximum 500 documents `analytics_sessions` commences dans les 30 derniers jours, sans listener temps reel. Les sessions admin sont exclues cote client. Les tendances comptent les etapes `detail`, dedupliquent les visiteurs par UID puis IP puis session et reprennent le nom/prix deja embarque dans `journey.itemId`. Le tunnel devis compte les sessions ayant visite `quote`, emis `quote_start` ou emis `quote_email_opened`. Les images du classement sont resolues par identifiant ou slug depuis le snapshot catalogue public court deja utilise par l'admin; elles n'ajoutent aucune lecture Firestore produit et restent purement representatives.

Sur mobile, les libelles et la note du tunnel devis reviennent a la ligne sans
elargir la carte. Le classement des meubles reste borne a la largeur du panneau
et utilise un rail horizontal tactile avec snap; seul ce rail defile, jamais la
page admin complete.

La repartition des commandes utilise trois anneaux ouverts concentriques:
Payees, Expediees et En attente. Le total reste au centre; la legende compacte
affiche pour chaque statut son volume et sa part, sans grandes lignes empilees.

Cette lecture analytics est non bloquante: son echec laisse les agregats commerce, l'inventaire et les commandes recentes disponibles. Une couverture de 500 documents est signalee comme plafonnee. `quote_email_opened` reste libelle comme ouverture d'un brouillon e-mail; Stats ne presente jamais ce signal comme un devis recu, envoye ou accepte.

`AdminAnalytics` lit maintenant les rollups serveur permanents pour les KPI et
graphiques, y compris la periode `Tout`. La liste recente est independante:
250 projections legeres par page, maximum 1 000 visibles. Le parcours borne
est charge uniquement via le callable admin AAL2 au clic sur `Tracer`; aucune
lecture directe de `analytics_sessions` ou IP brute n'est autorisee au
navigateur. Le cache local accelere la liste mais ne conditionne jamais
l'historique affiche a une nouvelle administratrice.

Le parcours reste vertical sous 1024 px et devient une frise en grille sur desktop: les etapes occupent une ligne tant que la largeur le permet, puis reprennent naturellement a la ligne suivante, sans barre de defilement horizontale. Chaque etape desktop reserve un media 66x84 px: les etapes `detail` affichent la premiere variante `thumb320` du produit lorsqu'elle existe; les sous-categories `buffets`, `armoires`, `miroirs` et `commodes` reprennent les memes images `*-config-rail.webp` que les quatre cartes sous le hero de la galerie; les categories parentes `meubles`, `assises`, `eclairage` et `decorations` utilisent les illustrations WebP dediees de `public/images/analytics`; Galerie, A propos et Devis utilisent des visuels editoriaux differencies. Les images sont resolues depuis les assets ou le catalogue deja charges et n'alourdissent pas les documents analytics.

Lorsqu'une etape porte un identifiant, le parcours affiche le prefixe compact `ID`: le bleu ardoise des fiches produit et le vert sauge des categories permettent de distinguer une reference produit d'un slug de categorie; les identifiants de contenu residuels restent neutres.

Les sessions admin sont exclues par les claims: le collecteur ne demarre pas
pour un admin. Le tracker et l'onglet IP ne sont plus montes; `trackAdminIP`
reste temporairement un no-op de compatibilite. `updateUserSessions` cible une
seule session prouvee, sans requete par e-mail ou IP.

## 8. Maintenance

Les operations de `AdminMaintenance` et `AdminDashboard` peuvent purger utilisateurs, produits, commandes ou statistiques. Elles exigent:

- assurance admin AAL2 Google ou passkey et registre actif;
- confirmation explicite et scope lisible;
- Function serveur;
- limites et audit;
- absence de suppression silencieuse en cas d'echec partiel.

Ne pas ajouter de bouton de maintenance qui ecrit directement un grand ensemble Firestore depuis le navigateur.

Etat Gate 0B:

- `resetAllStats`, `runGarbageCollector`, `resetAllUsers`, `purgeAnonymousUsers`,
  `purgeAllProducts` et `resetAllOrders` appellent le hard-stop avant
  authentification, lecture ou mutation;
- leurs boutons rapides ne sont plus proposes par Stats et l'onglet Maintenance
  est read-only;
- leurs parties encore utiles au rollback restent temporairement en source,
  mais sont inaccessibles tant que le hard-stop est en place; le reset social
  sans appelant et les nettoyages associes ont ete retires, car ce modele ne
  porte aucune donnee sandbox et n'appartient pas a Seconde Vie.

Gate 7A fournit un cleanup fixture run-scoped, borne et audite. Il ne supprime
ni commandes, ni faits financiers, ni mouvements, ni audits; seuls les
auxiliaires terminaux du run sont mis en quarantaine. Les purges globales
restent desactivees; leur eventuelle reconstruction avec
comptage, sauvegarde, pagination, reprise et quarantaine attend un besoin
metier/pre-live distinct.

Decision G11-R du 2026-08-22: les six outils globaux ci-dessus,
`getUploadUrl`, `clearAllAffiliateClicks` et `clearAllSessions` sont
`RETIRE_G12_A`. Les handlers de dashboard conserves ne constituent pas des
appelants atteignables; les deux boutons analytics globaux n'ont aucun trafic
sur trente jours et doivent converger vers la retention bornee. Seule la
suppression ciblee `deleteSession` reste un besoin d'exploitation et doit etre
reconstruite en Gen2 avec confirmation serveur structuree, dry-run,
precondition de version, audit idempotent et reprise avant toute bascule. Cette
bascule est fermee: `AdminAnalytics` execute d'abord le dry-run
`deleteSessionGen2`, puis exige son `updateTime` exact pour un commit confirme;
la probe de qualification n'a supprime aucune donnee.

La cohorte `G12-A:maintenance/destructives-G11` est fermee. Les deux boutons
globaux de purge analytics et leurs entrees de registre client ont ete retires
du build actif `build-2026-08-22-003`; la suppression ciblee reste disponible
via `deleteSessionGen2`. Apres rollback reel vers `build-2026-08-22-002`,
reactivation et quiet-window de 445 secondes sans appel legacy, les dix Gen1
G11 ont ete retirees individuellement. Aucun handler destructif n'a ete invoque
et aucune donnee, IAM, secret ou source serveur n'a ete supprime pendant G12-A.
La fenetre a expire immediatement sur approbation formelle le
`2026-08-22T22:45:38Z`. G12-B a ensuite retire les dix exports Gen1 et les
anciens handlers/modales admin devenus inaccessibles. `deleteSessionGen2` reste
le seul parcours de suppression de session expose. Aucun IAM ou secret dedie
n'existait; les identites partagees ont ete preservees.

## 9. Performance du back-office

- garder les vues lourdes lazy;
- lancer le chargement utile de Stats puis precharger les donnees Ventes et
  Retours des que l'acces admin fort est valide, sans attendre une periode idle;
- partager une seule premiere page commandes entre Ventes et Retours via
  `adminCommerceData`, au lieu de refaire le meme appel serveur dans chaque vue;
- conserver deux minutes les agregats Stats, tendances et premieres pages
  Ventes/Retours dans `adminDataCache`; une donnee connue reste affichee
  pendant son rafraichissement, mais l'entree dans une nouvelle session admin
  force une synthese serveur fraiche des montants, commandes et statuts;
  le cache de session est vide a la deconnexion ou au changement de compte;
- ne jamais afficher `0` comme resultat tant que la premiere lecture Ventes ou
  Retours n'est pas terminee; utiliser un squelette ou un tiret neutre;
- borner listeners, requetes et exports;
- paginer ou limiter les collections croissantes;
- eviter les calculs de stats complets dans le navigateur;
- ne pas bloquer le premier rendu du dashboard sur tous les onglets;
- reserver les graphiques et cartes live aux vues qui les utilisent.

## 10. Fichiers structurants

```text
app/admin/page.jsx
app/admin/AdminAppIsland.jsx
app/admin/AdminSidebar.jsx
src/kit/admin/*.jsx
src/kit/admin/AdminAccount.jsx
src/kit/admin/BillingOnboardingGuide.jsx
src/kit/admin/BillingOnboardingOperator.jsx
src/kit/admin/components/*
src/kit/admin/components/MetaConnectionBadge.jsx
src/kit/admin/components/useMetaConnection.js
src/kit/admin/metaPublicationClient.js
src/kit/admin/productPublicationClient.js
src/kit/admin/analyticsReliability.js
src/kit/admin/adminCommerceData.js
src/kit/admin/adminPublicCatalog.js
src/kit/admin/adminDataCache.js
src/kit/config/constants.js
functions/src/auth/adminManagement.js
functions/src/auth/userStats.js
functions/src/onboarding/billingGuide.js
functions/src/onboarding/billingGuideContract.js
functions/src/integrations/meta.js
functions/src/integrations/metaContract.js
functions/src/publication/productPublication.js
functions/src/maintenance/*
functions/src/analytics/*
firestore.rules
storage.rules
```

## 11. Dettes controlees

| Sujet | Statut | Condition de reprise |
| --- | --- | --- |
| pagination complete de certaines listes | `DEBT` | croissance reelle des volumes ou mesure de cout |
| politique de roles plus fine qu'admin/super-admin | `CONCEPTION` | plusieurs operateurs metier confirmes |
| suppression des outils E2E/etude embarquee | `DEBT` | decision produit apres stabilisation preprod |
| incidents/reconciliation sandbox | `PREPROD_READY` | surveiller les compteurs avant toute nouvelle fenetre fixture |
| alert policies, SLO, astreinte et runbooks live | `PRODUCTION_DEFERRED` | rail production et SLO approuves |

## 12. Validation

Pour une passe back-office complete:

1. connexion admin et step-up si requis;
2. chargement de chaque onglet touche sans erreur;
3. mutation sandbox cible et lecture publique correspondante;
4. verification rules/Function pour une action sensible;
5. absence de lecture non bornee;
6. smoke mobile uniquement si le back-office mobile est dans le scope;
7. build et tests du domaine touche.
