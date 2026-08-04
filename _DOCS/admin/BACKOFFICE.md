# Back-office

Derniere mise a jour: 2026-08-04
Statut: `PREPROD_READY`

Etat actif:

> Le sandbox est fonctionnel en `v2_all` avec mutations admin actives pour les
> tests publication, commandes, fulfillment, remboursements et retours.
> App Check, registre admin, AAL2, idempotence et audit restent obligatoires.
> Stripe live et la production ne sont pas actifs.

## 1. Architecture

`/admin` est une route dynamique, `noindex`, montee par `AdminAppIsland`. Les grandes vues sont chargees avec `React.lazy` pour ne pas placer tout le back-office dans le bundle initial. La route ne lit jamais le catalogue public avant l'authentification. Une fois l'acces admin fort etabli, Stats charge le catalogue public court en parallele de ses agregats afin de resoudre les miniatures des meubles en tendance; ce chargement visuel ne bloque pas les statistiques.

L'interface commune de connexion est conservee. L'acces admin repose sur Firebase Auth, claims, registre `sys_admin_access` et assurance forte recente pour les operations sensibles.

## 2. Onglets

La liste executable est `KIT_CONFIG.adminTabs` dans `src/kit/config/constants.js`.

La navigation visible utilise un panneau lateral persistant sur desktop et un tiroir sur les ecrans plus etroits. Les IDs restent inchanges et sont regroupes en cinq ensembles metier afin de reduire la charge cognitive:

- `Vue d'ensemble`: Stats, Data;
- `Catalogue`: Publication, Vue Globale, Studio;
- `Ventes`: Ventes, Liens de paiement, Factures, Retours, Livraison, Paiement;
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
| `orders` | Ventes | `AdminOrders` | commandes et logistique |
| `payment_links` | Liens de paiement | `AdminPaymentLinks` | reservation de meubles et paiement Stripe prive sans compte |
| `invoices` | Factures | `AdminInvoices` | selection de meubles, brouillons, apercu A4, emission PDF verrouillee et envoi e-mail |
| `returns` | Retours | `AdminReturns` | remboursements Stripe |
| `livraison` | Livraison | `AdminLivraison` | tarifs et configuration livraison |
| `users` | Clients | `AdminUsers` | comptes et acces admin |
| `ip_manager` | Securite | `AdminIPManager` | suivi/configuration IP complementaire |
| `seo` | SEO | `AdminSEO` | controle contenu/indexation |
| `newsletter` | Infos | `AdminNewsletter` | abonnes/informations |
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
synthese des statuts. A partir de `1280 px`, le document ne scrolle pas: seules
les zones de contenu internes prennent le relais sur un ecran bas. Les formats
plus etroits reviennent au scroll naturel et les categories utilisent un rail
horizontal sans barre visible, puis passent sur plusieurs lignes quand la
largeur le permet. `AdminForm` gere les champs produit, la
compression/upload image, les variantes et la sauvegarde. Sa grille droite
utilise quatre rangees `auto / auto / auto / minmax(220px, 1fr)`: seule la
quatrieme rangee absorbe l'espace vertical restant. Dimensions occupe la
troisieme rangee, avec des controles bornes en largeur. Le formulaire ne
presente plus de panneau SEO manuel: titre, description et eligibilite sont
deduits automatiquement du nom, de l'histoire, de l'image et du statut public.
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
L'intertitre H2 ne transforme qu'une ligne complete et refuse une selection
partielle avec un retour visible dans le pied de l'editeur.
Deux commandes Annuler et Retablir, placees entre les outils et le choix
Ecrire/Apercu, partagent le meme historique avec les raccourcis clavier. Cet
historique garde au plus 80 etats, regroupe la frappe par salves de 700 ms et
isole chaque collage ou commande de mise en forme afin de restaurer le contenu
et son apparence ensemble.
`RichTextStory` previsualise ce sous-ensemble et l'affiche sur la fiche publique.
`AdminItemList`
affiche les annonces. `GlobalInventoryView` pilote les classements editoriaux.

Avant le premier upload, `AdminForm` appelle
`preflightProductMutationAdmin`. Le serveur confirme App Check, le registre
admin actif et une authentification forte AAL2. La publication catalogue est
independante de `adminMutationMode`, qui reste reserve aux commandes commerce
transactionnelles. Les commandes produit courantes n'imposent
plus une reconnexion toutes les quinze minutes; la recence reste reservee aux
remboursements et aux operations destructives.

Apres mutation:

- l'ecriture doit respecter `firestore.rules`;
- `onCatalogSourceWrite` enregistre la revision et construit le snapshot;
- la task HMAC rafraichit les routes ISR;
- les erreurs partielles doivent rester visibles et reprenables.

### 3.1 Publication Instagram directe et Facebook optionnel

`MetaConnectionControl` donne la priorite a la connexion professionnelle
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
  actions admissibles;
- `AdminInvoices`: creation assistee de factures manuelles et reprise des
  brouillons;
- `AdminReturns`: remboursement, synchronisation et e-mail client;
- `AdminPaymentSettings`: Connect, carte/wallets et etat de disponibilite;
- `AdminLivraison`: configuration des frais.

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

### 5.1 Factures manuelles

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

De Gate 0B jusqu'a l'activation fixture, Publication, Ventes, Retours,
Livraison et Paiement restent read-only pour prix, stock, vente, commande,
policy et medias destructifs. Les actions reviennent uniquement via les
commandes serveur et `allowedActions`.

Le transport callable fulfillment/archive commande est deploye dans
`functions/src/commerce/v2OrderCommands.js`: App Check, registre admin actif,
AAL2 recent et acteur derive du contexte Auth. Il est exporte mais bloque par
le controle mutations serveur absent; `AdminOrders` l'appelle uniquement
derriere l'autorisation serveur et des `allowedActions` calcules serveur.

L'expedition n'utilise plus de dialogue natif. Une modale integree distingue
explicitement l'expedition avec suivi, sans suivi et l'annulation sans effet.
Le transporteur et le numero sont valides serveur. Une commande distincte
`updateOrderTrackingAdmin` permet ensuite d'ajouter, corriger ou retirer le
suivi d'une commande expediee sans rejouer la transition d'expedition. Les
liens client sont derives d'une liste de transporteurs autorises; aucune URL
libre du navigateur n'est stockee.

Le transport refund admin est prepare dans
`functions/src/commerce/v2RefundCommands.js` avec les memes controles forts,
le secret Stripe et un runtime minimal reprenable. Il est exporte mais bloque
par le controle serveur; `AdminReturns` l'appelle uniquement derriere un flag
compile a `false`.

Les transports de retour physique sont prepares dans
`functions/src/commerce/v2ReturnCommands.js`: ouverture, annulation,
reception, restock, write-off et resolution sont des commandes fermees avec
App Check, registre admin actif, AAL2 recent, acteur Auth serveur, versions et
quantites bornees. Ils sont exportes mais bloques par le controle serveur et
sont branches a `AdminReturns` derriere le meme flag `false`.

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

Recette sandbox du 2026-07-28: une session admin forte existante a charge le
dashboard et les lecteurs pagines `Ventes`/`Retours` sans erreur sous les Rules
restrictives. `Livraison` et `Paiement` ont confirme leur etat read-only;
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

### 5.2 Liens de paiement de secours

L'onglet `payment_links` charge paresseusement `AdminPaymentLinks`. Il permet
de selectionner un a vingt meubles achetables depuis le snapshot admin, de
choisir la livraison et une validite de 30 minutes a 24 heures, puis de copier
une URL privee. L'e-mail client est facultatif; lorsqu'il est renseigne il est
verrouille et masque sur la page publique. Aucun compte, OTP ou session client
n'est requis pour payer.

Le serveur relit les produits Firestore, le prix, le stock, la policy et le
compte Connect avant de creer atomiquement l'order v2 et ses reservations. Les
actions sensibles exigent App Check, registre admin actif, AAL2 recent,
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

`AdminUsers` appelle les Functions de gestion d'acces. Un administrateur actif
et fort recent peut ajouter ou retirer un autre administrateur. L'owner reste
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
Functions, exigent une authentification admin forte recente et sont auditees
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

`AdminAnalytics` reprend le moteur de Tous a Table: lecture bornee a 5 000 sessions sur un an, cache IndexedDB de six heures, actualisation manuelle de l'historique, ecoute Firestore des 100 sessions les plus recentes, visiteurs uniques dedupliques par UID Firebase puis IP serveur, ratio UID/IP, regroupement par jour et visiteur, sessions live et parcours. Une session est consideree en ligne lorsque sa derniere activite remonte a moins de 30 secondes. Le bandeau live apparait sans actualisation manuelle et cumule les sessions actives avec leur ville et leur appareil.

Le parcours reste vertical sous 1024 px et devient une frise en grille sur desktop: les etapes occupent une ligne tant que la largeur le permet, puis reprennent naturellement a la ligne suivante, sans barre de defilement horizontale. Chaque etape desktop reserve un media 66x84 px: les etapes `detail` affichent la premiere variante `thumb320` du produit lorsqu'elle existe; les sous-categories `buffets`, `armoires`, `miroirs` et `commodes` reprennent les memes images `*-config-rail.webp` que les quatre cartes sous le hero de la galerie; les categories parentes `meubles`, `assises`, `eclairage` et `decorations` utilisent les illustrations WebP dediees de `public/images/analytics`; Galerie, A propos et Devis utilisent des visuels editoriaux differencies. Les images sont resolues depuis les assets ou le catalogue deja charges et n'alourdissent pas les documents analytics.

Lorsqu'une etape porte un identifiant, le parcours affiche le prefixe compact `ID`: le bleu ardoise des fiches produit et le vert sauge des categories permettent de distinguer une reference produit d'un slug de categorie; les identifiants de contenu residuels restent neutres.

Les sessions admin sont exclues a trois niveaux: le collecteur ne demarre pas quand les claims admin sont actifs, `trackAdminIP` maintient le registre des IP admin, puis `updateUserSessions` supprime les sessions recentes de l'IP lors d'une connexion admin. L'e-mail proprietaire reste un secret serveur et n'est jamais embarque dans le bundle client.

## 8. Maintenance

Les operations de `AdminMaintenance` et `AdminDashboard` peuvent purger utilisateurs, produits, commandes ou statistiques. Elles exigent:

- assurance admin forte recente;
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
- leur ancien corps reste temporairement en source pour historique et future
  reconstruction, mais il est inaccessible tant que le hard-stop est en place.

Gate 7A fournit un cleanup fixture run-scoped, borne et audite. Il ne supprime
ni commandes, ni faits financiers, ni mouvements, ni audits; seuls les
auxiliaires terminaux du run sont mis en quarantaine. Les purges globales
restent desactivees; leur eventuelle reconstruction avec
comptage, sauvegarde, pagination, reprise et quarantaine attend un besoin
metier/pre-live distinct.

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
src/kit/admin/analyticsReliability.js
src/kit/admin/adminCommerceData.js
src/kit/admin/adminPublicCatalog.js
src/kit/admin/adminDataCache.js
src/kit/config/constants.js
functions/src/auth/adminManagement.js
functions/src/auth/userStats.js
functions/src/onboarding/billingGuide.js
functions/src/onboarding/billingGuideContract.js
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
