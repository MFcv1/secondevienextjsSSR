# Registre temporaire des anomalies de recette commerce

Derniere mise a jour: 2026-08-08
Statut: `OUVERT`
Campagne: [TEST_COMMERCE_SANDBOX.md](TEST_COMMERCE_SANDBOX.md)
Echeance de fusion et suppression: 2026-08-06

## Regles

- une ligne de synthese est ajoutee des qu'une anomalie est observee;
- le detail est complete avant toute correction;
- aucun mot de passe, OTP, token, PIN, secret, donnee de carte ou donnee
  personnelle inutile n'est consigne;
- une anomalie `BLOQUANTE` interdit de passer a la phase suivante;
- une anomalie fermee conserve sa preuve de requalification jusqu'a la fusion
  dans le chapitre canonique;
- ce registre est supprime apres fusion de toutes les informations durables;
  Git en conserve l'historique.

## Synthese

| ID | Phase | Severite | Statut | Resume |
| --- | --- | --- | --- | --- |
| A-001 | Publication admin | `BLOQUANTE` | `FERMEE` | La session forte est controlee seulement apres l'envoi des images |
| A-002 | Validation locale | `MINEURE` | `FERMEE` | Le test de confinement cherchait l'ancien nom de la projection dashboard |
| A-003 | Validation Firebase | `MINEURE` | `FERMEE` | Les tests Web SDK recevaient un transform d'increment Admin SDK incompatible |
| A-004 | Publication admin | `BLOQUANTE` | `FERMEE` | L'outil de capture a signale `/admin` vide lorsque Chrome avait perdu le premier plan |
| A-005 | Publication admin | `MAJEURE` | `FERMEE` | Les actions catalogue exigeaient inutilement une reconnexion admin toutes les 15 minutes |
| A-006 | Connexion client | `MAJEURE` | `FERMEE` | La wishlist envoyait le client non connecte vers la connexion admin |
| A-007 | Connexion client | `BLOQUANTE` | `FERMEE` | La wishlist hydratait une liste locale differente du HTML serveur |
| A-008 | E-mails commande | `BLOQUANTE` | `FERMEE` | Le secret Gmail sandbox expire faisait echouer l'outbox en `EAUTH` |
| A-009 | Commande/e-mails | `MINEURE` | `FERMEE` | Le mode de livraison choisi n'etait pas conserve dans le snapshot de commande |
| A-010 | Delivrabilite e-mail | `MAJEURE` | `DIFFEREE_EXTERNE` | Gmail classe le message transactionnel sandbox authentifie dans les spams |
| A-011 | Couverture e-mail v2 | `MAJEURE` | `FERMEE` | BCC admin, transitions fulfillment absentes, OTP divergents et anomalies refund incompletes |
| A-012 | Preflight recette Luna | `BLOQUANTE` | `FERMEE` | La boîte Gmail admin nécessitait une récupération Google avant connexion |
| A-013 | Preflight recette Luna | `BLOQUANTE` | `FERMEE` | Google OAuth fonctionne dans Chrome externe avec l'extension active |
| A-014 | Connexion client | `MINEURE` | `FERMEE` | Une validation OTP a subi une erreur reseau transitoire, puis le retry a reussi |
| A-015 | Nettoyage recette | `MINEURE` | `OUVERTE` | Le meuble de smoke test publie reste a archiver |
| A-016 | Documents client | `MINEURE` | `FERMEE` | Les documents ont ete projetes apres le controle immediat; aucune perte durable |
| A-017 | Remboursement asynchrone | `BLOQUANTE` | `CORRIGEE_A_REQUALIFIER` | Le rail v2 ingere et applique desormais les evenements `refund.*` supportes |
| A-018 | Fulfillment livraison | `MAJEURE` | `CORRIGEE_A_REQUALIFIER` | L'etat durable etait correct; le cache et la chronologie admin restaient obsoletes |
| A-019 | Session client / checkout | `MINEURE` | `FERMEE` | Le panier et la session etaient charges apres hydratation; la reprise a permis les deux commandes |
| A-020 | Accès administrateur Google | `BLOQUANTE` | `FERMEE` | Le premier parcours n’achevait pas le sélecteur Google; reprise explicite du compte admin réussie |
| A-021 | Publication admin | `MAJEURE` | `CORRIGEE_A_REQUALIFIER` | Le renouvellement du jeton démontait le parcours, fermait la progression et réinitialisait la vue sur Créer |

Severites:

- `BLOQUANTE`: paiement, stock, securite, donnees, role ou suite impossible;
- `MAJEURE`: resultat incorrect ou forte friction sans alternative sure;
- `MINEURE`: defaut visible ou information incompletement presentee;
- `COSMETIQUE`: finition visuelle sans ambiguite metier.

Statuts:

- `OUVERTE`;
- `EN_DIAGNOSTIC`;
- `CORRIGEE_A_REQUALIFIER`;
- `FERMEE`;
- `DIFFEREE_EXTERNE`.

## Anomalies

### A-001 - Reauthentification pendant la finalisation d'une publication

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: publication admin par le site Hosting
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_client_purchase_v1`
- `productId`: non cree
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: la publication cree une annonce publique apres l'envoi des deux
  images et la finalisation.
- observe: deux tentatives atteignent la finalisation, puis la modale de
  connexion s'ouvre. Le formulaire et les images restent intacts et aucune
  annonce portant le titre de recette n'apparait dans la liste.
- preuve: observation directe dans Chrome sur `/admin`; progression complete
  des variantes d'image puis `FINALISATION`.
- impact: impossible de poursuivre l'achat client sans remettre
  l'authentification administrateur dans un etat valide.
- cause racine ou hypothese: cause confirmee dans le code. `AdminForm`
  transfere toutes les variantes Storage avant le premier appel de commande,
  tandis que `createProductAdmin` exige ensuite une assurance forte agee de
  moins de 15 minutes. Une session deja ancienne n'est donc detectee qu'apres
  les transferts.
- decision de correction: ajouter une prevalidation serveur sans mutation,
  protegee par App Check, le controle commerce fail-closed et
  `checkRecentActiveStrongAdmin`, puis l'appeler avant toute compression ou
  ecriture Storage.
- fichiers/Functions touches: `functions/src/commerce/v2ProductCommands.js`,
  `functions/index.js`, `src/kit/commerce/adminProductCommandClient.js`,
  `src/kit/admin/AdminForm.jsx` et test de contrat Gate 4.
- validations lancees: deux parcours manuels complets avant correction;
  24 tests cibles Gate 4 verts; `npm run lint:functions` vert;
  `git diff --check` vert.
- resultat de requalification: parcours Hosting reussi avec le compte recette
  admin exact. Le preflight a autorise la session AAL2, les deux images ont ete
  transferees, puis le produit
  `product-2c1f1f00-be4c-4508-8b90-559f2357c162` a ete cree et publie sans
  nouvelle demande de connexion.
- documentation canonique a mettre a jour: `map.md`,
  `_DOCS/catalogue/ANNONCES_CATALOGUE.md`,
  `_DOCS/admin/BACKOFFICE.md`, mis a jour localement.

### A-002 - Assertion de confinement desynchronisee du dashboard

- statut: `FERMEE`
- severite: `MINEURE`
- phase: validations locales avant deploiement
- environnement: local, aucune ecriture cloud
- `runId`: sans objet
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: la suite `test:commerce:containment` reconnait le repli financier
  autoritaire encore present dans `AdminDashboard`.
- observe: la suite cherchait `commerceOperations.operations?.projection`,
  identifiant retire lors de la migration vers l'etat `commerceStatus.data`.
- preuve: 11 scenarios de confinement sur 12 verts; seul
  `commerce-ui-is-explicitly-read-only` echouait sur cette recherche textuelle.
- impact: faux rouge de validation; aucun impact runtime ou donnees.
- cause racine ou hypothese: assertion non alignee avec le renommage deja
  present dans le commit courant du dashboard.
- decision de correction: viser le chemin executable actuel
  `commerceStatus.data?.operations?.projection` sans modifier le runtime.
- fichiers/Functions touches: `tests/commerce/suites/containment.cjs`.
- validations lancees: scenario de confinement puis suite commerce complete a
  rejouer.
- resultat de requalification: assertion ciblee corrigee; suite complete en
  attente.
- documentation canonique a mettre a jour: aucune, contrat runtime inchange.

### A-003 - Transform d'increment non injectable dans les tests Firebase

- statut: `FERMEE`
- severite: `MINEURE`
- phase: validations Firebase locales avant deploiement
- environnement: emulateur local demo, aucune ecriture cloud
- `runId`: sans objet
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: les repositories de paiement et remboursement acceptent le
  transform atomique correspondant au client Firestore injecte.
- observe: quatre scenarios Firebase refusaient le
  `NumericIncrementTransform` de l'Admin SDK dans une transaction Web SDK.
- preuve: erreur explicite sur `capturedCents` dans
  `commerce_financial_daily/2026-07-26_EUR`.
- impact: faux rouges des tests d'integration; le runtime Functions Admin SDK
  reste compatible.
- cause racine ou hypothese: le transform atomique etait le seul adaptateur
  Firestore non injecte dans deux modules pourtant concus pour recevoir leurs
  dependances.
- decision de correction: rendre `increment` injectable avec l'Admin SDK comme
  valeur production par defaut, et injecter le transform Web SDK uniquement
  dans la suite emulateur.
- fichiers/Functions touches:
  `functions/src/commerce/domain/paymentEffectApplier.js`,
  `functions/src/commerce/domain/refundRepository.js`,
  `tests/commerce/suites/firebase-domain.cjs`.
- validations lancees: suites domaine et faults vertes; integration Firebase
  `15/15`; regles v2 `5/5`.
- resultat de requalification: ferme; le transform Web SDK injecte est accepte
  par toutes les transactions emulateur et la valeur production Admin SDK
  reste le defaut.
- documentation canonique a mettre a jour: aucune, contrat runtime inchange.

### A-004 - Page admin vide apres actualisation

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: publication admin par le site Hosting
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_full_manual_v2`
- `productId`: non cree
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: une actualisation de `/admin` restaure la session admin forte et
  recharge le formulaire avec la revision de controle commerce courante.
- observe: l'interface admin fonctionnait avant actualisation, puis l'outil de
  controle ne remontait plus aucun contenu applicatif et montrait un fond gris.
- preuve: observation directe dans Chrome apres ouverture controlee de la
  revision `37`; titre et URL restent `/admin`, arbre d'accessibilite vide.
- impact: impossible de publier ou de verifier le controle UI sans contourner
  une friction reproductible du parcours humain.
- cause racine ou hypothese: faux signal de l'outil de controle local. Une
  capture d'ecran independante a prouve que ChatGPT etait au premier plan et
  que Chrome etait simplement derriere. La reponse Hosting et le chunk admin
  etaient par ailleurs disponibles en HTTP 200.
- decision de correction: fermeture de securite de la fenetre commerce,
  redemarrage de Chrome sans effacer le profil, puis activation explicite de
  Chrome avant chaque lecture et requalification de la restauration Auth.
- fichiers/Functions touches: aucun a ce stade.
- validations lancees: reponse `/admin` HTTP 200; chunk admin HTTP 200;
  redemarrage Chrome; restauration automatique de la session admin exacte;
  nouvelle actualisation manuelle.
- resultat de requalification: `/admin` restaure l'interface complete et la
  capture redevient correcte des que Chrome est active; aucune correction
  applicative requise.
- documentation canonique a mettre a jour: aucune.

### A-005 - Recence admin disproportionnee pour les actions catalogue

- statut: `FERMEE`
- severite: `MAJEURE`
- phase: publication admin par le site Hosting
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_full_manual_v4`
- `productId`: non cree
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: une session admin persistante, active et AAL2 permet de gerer le
  catalogue sans reconnexion periodique.
- observe: le preflight refuse la publication des que `auth_time` depasse
  quinze minutes, rouvre la modale et peut faire perdre le formulaire local.
- preuve: retour serveur `recent-strong-auth-required` lors du preflight, puis
  restauration de l'interface apres reconnexion Google.
- impact: friction recurrente sans gain proportionne pour une publication ou
  une mise a jour produit courante.
- cause racine ou hypothese: toutes les commandes produit utilisaient
  `checkRecentActiveStrongAdmin`, politique prevue pour les mutations les plus
  sensibles.
- decision de correction: utiliser `checkActiveStrongAdmin` pour les six
  commandes produit et leur preflight. Conserver la recence de quinze minutes
  pour les remboursements et operations destructives.
- fichiers/Functions touches:
  `functions/src/commerce/v2ProductCommands.js`, `AdminForm`,
  `AdminAppIsland`, test de contrat Gate 4, `map.md` et chapitres canoniques
  admin/authentification.
- validations lancees: `87/87` tests commerce unitaires; `3/3` tests claims
  admin; `git diff --check`; deploiement reussi des six Functions produit.
- resultat de requalification: une session admin AAL2 agee de plus de quinze
  minutes a ouvert le formulaire, passe le preflight, envoye deux images et
  publie le produit
  `product-2c1f1f00-be4c-4508-8b90-559f2357c162` sans reconnexion. La recence
  reste active pour les remboursements et mutations destructives.
- documentation canonique a mettre a jour: mise a jour effectuee dans
  `map.md`, `_DOCS/admin/BACKOFFICE.md` et
  `_DOCS/security/AUTHENTIFICATION.md`.

### A-006 - La connexion wishlist redirige vers l'administration

- statut: `FERMEE`
- severite: `MAJEURE`
- phase: connexion du compte client avant achat
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_full_manual_v6`
- `productId`: `product-2c1f1f00-be4c-4508-8b90-559f2357c162`
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: depuis `/wishlist`, `connectez-vous` ou `inscrivez-vous` ouvre la
  modale Auth publique commune.
- observe: le bouton redirige directement vers `/admin`, dont l'ecran et le
  formulaire sont reserves a l'administration.
- preuve: parcours humain dans Chrome apres deconnexion du compte admin; URL
  passee de `/wishlist` a `/admin`.
- impact: forte confusion et blocage de la connexion d'un client lambda.
- cause racine ou hypothese: cause confirmee. `WishlistPageIsland` implementait
  explicitement `onShowLogin` avec `router.push('/admin')`.
- decision de correction: utiliser le meme evenement `sv:open-login` que
  `OrdersPageIsland` et le header public.
- fichiers/Functions touches: `app/wishlist/WishlistPageIsland.jsx` et chapitre
  canonique espace client.
- validations lancees: lint, build, deploiement App Hosting et parcours humain
  depuis `/wishlist`.
- resultat de requalification: le bouton ouvre la modale Auth publique sur la
  meme route; la connexion Google du client exact reussit sans passage par
  `/admin` ni elevation de privilege.
- documentation canonique a mettre a jour:
  `_DOCS/client/ESPACE_CLIENT.md`, mis a jour localement.

### A-007 - Divergence d'hydratation sur la wishlist

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: connexion du compte client avant achat
- environnement: sandbox / Stripe test
- `runId`: sans objet, controles commerce fermes
- `productId`: `product-2c1f1f00-be4c-4508-8b90-559f2357c162`
- `orderId`: sans objet
- reference provider non sensible: React production error `418`
- attendu: `/wishlist` affiche immediatement un shell coherent, puis charge la
  liste locale apres montage.
- observe: le HTML serveur rend une liste vide tandis que le premier rendu
  navigateur lit trois IDs depuis `localStorage`. React signale une divergence
  d'hydratation et Chrome peut rester sur un fond gris jusqu'a un changement de
  taille de fenetre.
- preuve: erreur React `418` dans la console du rollout
  `sv-ms7ntdmo-0c83a1f51291`; inspection du state initial dans
  `WishlistPageIsland`.
- impact: route client visuellement vide et connexion impossible de maniere
  fiable.
- cause racine ou hypothese: cause confirmee. L'initialiseur de `useState`
  appelait `readWishlistIds()`: `[]` au rendu serveur, valeurs persistantes au
  premier rendu navigateur.
- decision de correction: initialiser la liste a `[]` des deux cotes et laisser
  `subscribeWishlistItems` charger `localStorage` apres montage.
- fichiers/Functions touches: `app/wishlist/WishlistPageIsland.jsx` et chapitre
  canonique espace client.
- validations lancees: lint, build, deploiement App Hosting, chargement direct
  et actualisation de `/wishlist` avec trois IDs locaux.
- resultat de requalification: shell serveur et premier rendu navigateur
  commencent tous deux avec une liste vide, puis les trois souhaits sont
  charges apres montage; aucune erreur React `418` ni ecran gris.
- documentation canonique a mettre a jour:
  `_DOCS/client/ESPACE_CLIENT.md`, mis a jour localement.

### A-008 - Authentification SMTP Gmail expiree

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: double verification de la commande et des e-mails
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_full_manual_v7`
- `productId`: `product-2c1f1f00-be4c-4508-8b90-559f2357c162`
- `orderId`: `ord_cf6220c7-890d-4e78-bb6f-c049df51fb08`
- reference provider non sensible:
  `cd606ad5cd7942fd40171d4a7754581a7747661eb38e4351a9c11170549fddb7`
- attendu: l'outbox commande passe a `sent` et le client recoit la
  confirmation.
- observe: l'entree restait en echec avec `EAUTH`; aucun message de commande
  recent n'etait visible dans la boite client.
- preuve: entree `commerce_outbox` ciblee, tentative SMTP refusee avant
  acceptation provider.
- impact: paiement et commande durables mais aucune confirmation e-mail.
- cause racine ou hypothese: mot de passe d'application Gmail du secret
  `GMAIL_PASSWORD` invalide ou revoque.
- decision de correction: creer un mot de passe d'application dedie au SMTP
  sandbox, ajouter une nouvelle version Secret Manager sans jamais l'afficher
  ni l'ecrire dans le depot, redeployer uniquement le dispatcher et supprimer
  immediatement le fichier temporaire local.
- fichiers/Functions touches: aucun secret dans le code; redeploiement de
  `commerceOutboxDispatcher`.
- validations lancees: invocation bornee du dispatcher, outbox `sent`,
  `attemptCount=6`, `lastError=null`, identifiant fournisseur present et
  message recu par le client.
- resultat de requalification: ferme; le meme secret a envoye le remboursement
  suivant des la premiere tentative.
- documentation canonique a mettre a jour:
  `_DOCS/infra/INFRASTRUCTURE.md`.

### A-009 - Mode de livraison absent du snapshot durable

- statut: `FERMEE`
- severite: `MINEURE`
- phase: audit premium des e-mails
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_full_manual_v7`
- `productId`: `product-2c1f1f00-be4c-4508-8b90-559f2357c162`
- `orderId`: `ord_cf6220c7-890d-4e78-bb6f-c049df51fb08`
- reference provider non sensible: sans objet
- attendu: la commande conserve le mode de livraison autoritaire choisi afin
  que les interfaces, documents et e-mails futurs puissent le restituer.
- observe: `shippingSnapshot` et le montant de livraison etaient conserves,
  mais pas l'identifiant/libelle de la policy de livraison.
- preuve: inspection du constructeur de commande et du document de la
  campagne; l'ancienne commande ne porte aucun `deliverySnapshot`.
- impact: un message futur pouvait afficher un libelle de repli moins precis,
  sans modifier le montant paye.
- cause racine ou hypothese: `checkoutRepository` ne transmettait pas l'objet
  `delivery` deja calcule a `createInitialOrderState`.
- decision de correction: ajouter un `deliverySnapshot` clone au document de
  commande pour toute nouvelle creation, sans retro-modifier les commandes
  financieres existantes.
- fichiers/Functions touches:
  `functions/src/commerce/domain/checkoutRepository.js`,
  `functions/src/commerce/domain/orderState.js`,
  `functions/src/commerce/v2Operations.js` et tests Gate 7A.
- validations lancees: `89/89` tests commerce unitaires, lint Functions cible
  et deploiement de `createCheckoutV2`, `resumeCheckoutV2` et du dispatcher.
- resultat de requalification: contrat durable couvert par test; l'ordre
  historique reste volontairement immutable.
- documentation canonique a mettre a jour:
  `_DOCS/commerce/COMMERCE_STRIPE.md`, `map.md`.

### A-010 - Message Gmail sandbox classe en spam

- statut: `DIFFEREE_EXTERNE`
- severite: `MAJEURE`
- phase: delivrabilite e-mail de remboursement
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_refund_manual_v8`
- `productId`: `product-2c1f1f00-be4c-4508-8b90-559f2357c162`
- `orderId`: `ord_cf6220c7-890d-4e78-bb6f-c049df51fb08`
- reference provider non sensible:
  `228a67952287b05e493efa06a96adf062dd3a7f1c451c880d6fcda1fbadec49f`
- attendu: le message transactionnel arrive dans la boite principale du
  client.
- observe: le message est livre, lisible et indexe, mais porte le label Gmail
  `SPAM`.
- preuve: lecture du MIME recu: SPF `pass`, DKIM `pass`, DMARC `pass`, TLS
  actif, parties texte et HTML presentes; classement `SPAM` applique apres
  livraison.
- impact: notification moins visible malgre un transport et un contenu
  corrects.
- cause racine ou hypothese: reputation du compte Gmail de recette et usage
  sandbox; aucune faute d'authentification ou de MIME ne justifie une
  correction applicative hasardeuse.
- decision de correction: ne pas contourner le filtre ni affaiblir le contenu.
  La resolution durable passe par le domaine expediteur final, Resend,
  SPF/DKIM/DMARC et la montee en reputation, deja differes jusqu'a la
  production.
- fichiers/Functions touches: aucun pour la delivrabilite. Le template premium
  a ete qualifie separement.
- validations lancees: MIME original, headers d'authentification, rendu texte,
  contenu HTML et lien same-origin verifies.
- resultat de requalification: transport qualifie; placement inbox non
  qualifiable sur le Gmail sandbox actuel.
- observation complementaire du run `run_v2all_20260731_codex02`: l'OTP M01
  a ete recu, lu sans exposition et utilise avec succes, mais le message est
  encore classe `SPAM`; aucune erreur SMTP, MIME ou Auth applicative n'a ete
  observee.
- documentation canonique a mettre a jour:
  `_DOCS/commerce/COMMERCE_STRIPE.md`,
  `_DOCS/infra/INFRASTRUCTURE.md`.

### A-011 - Couverture transactionnelle e-mail v2 incomplete

- statut: `FERMEE`
- severite: `MAJEURE`
- phase: audit global des e-mails
- environnement: sandbox / Stripe test
- attendu: un message adapte a chaque audience et a chaque transition utile,
  avec reprise idempotente et informations operationnelles completes.
- observe: l'administrateur recevait une copie BCC du message client; les
  transitions v2 de preparation, expedition, livraison et retrait n'emettaient
  rien; les anomalies de remboursement et les deux OTP n'avaient pas un
  systeme visuel commun.
- impact: exploitation moins lisible, client non informe apres paiement et
  risque de traitement manuel incomplet d'un remboursement ambigu.
- cause racine: le nouveau noyau v2 avait volontairement coupe les triggers
  legacy de `orderEmails.js` sans les remplacer pour tout le cycle.
- decision de correction: design system partage, notification admin dediee,
  deux outbox atomiques sur paiement/refund, outbox client sur chaque commande
  fulfillment, lien direct vers la commande admin et OTP unifies.
- fichiers/Functions touches:
  `functions/src/email/*EmailTemplates.js`,
  `functions/src/commerce/domain/paymentEffectApplier.js`,
  `refundRepository.js`, `orderCommandRepository.js`,
  `v2Operations.js`, les deux Functions OTP et le back-office.
- validations lancees: 90 tests unitaires commerce, 34 tests de panne, 15
  scenarios Firestore/70 assertions, 58 tests Auth; 13 rendus HTML captures et
  inspection visuelle.
- resultat de requalification: 15 Functions concernees `ACTIVE` en
  `europe-west1`; App Hosting `build-2026-07-30-019` `READY` et rollout
  `SUCCEEDED`; liens client et admin `200`; transport Gmail deja qualifie par
  A-008/A-010 et 13 rendus finaux inspectes. Le run reel
  `run_v2all_20260731_chrome01` a ensuite confirme M01, M03, M04, M05, M06,
  M10 et M11 dans les deux vraies boites. Les six autres modeles restent dans
  le perimetre d'execution de la recette Luna, sans remettre en cause la
  fermeture du defaut de couverture du code.
- documentation canonique:
  `_DOCS/commerce/COMMERCE_STRIPE.md`,
  `_DOCS/security/AUTHENTIFICATION.md`, `map.md`.

## Modele d'anomalie

Dupliquer cette section pour chaque anomalie et remplacer `A-000`.

### A-000 - Titre court

- statut: `FERMEE`
- severite:
- phase:
- environnement: sandbox / Stripe test
- `runId`:
- `productId`:
- `orderId`:
- reference provider non sensible:
- attendu:
- observe:
- preuve:
- impact:
- cause racine ou hypothese:
- decision de correction:
- fichiers/Functions touches:
- validations lancees:
- resultat de requalification:
- documentation canonique a mettre a jour:

### A-012 - Boîte Gmail administrateur indisponible pour le preflight

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: preflight P0 de la recette e-mails Luna
- environnement: sandbox / Stripe test
- `runId`: `run_email_luna_20260730_2020`
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: les deux boîtes de recette, client et administrateur, sont
  accessibles avant tout envoi OTP, publication ou paiement.
- observe: le connecteur Gmail actif confirme uniquement la boîte client
  `pvml7008@gmail.com`. Le navigateur Gmail ouvert est authentifié sur un
  autre compte et ne propose pas `loa.gto15@gmail.com`. La tentative d'ajout
  de la boîte admin déclenche ensuite la procédure Google de récupération
  avec un délai de sécurité de 24 heures; la session admin n'est donc pas
  ouverte.
- preuve: profil Gmail et observation de la liste de comptes Gmail au
  2026-07-30 20:20 Europe/Paris, puis capture utilisateur de l'écran Google
  de récupération à 21:52; aucune recherche ni mutation de message n'a été
  effectuée sur une boîte admin.
- impact: impossible de vérifier le destinataire, le contenu, la réception
  et les doublons des notifications M04, M11 et M13; le double contrôle
  client/admin ne peut pas être déclaré sûr.
- cause racine ou hypothese: connexion Gmail admin absente du connecteur et
  du profil navigateur courant; ce n'est pas une anomalie applicative
  démontrée.
- decision de correction: aucune correction par Luna; faire connecter ou
  autoriser explicitement la boîte admin, puis reprendre le preflight P0.
- fichiers/Functions touches: aucun
- validations lancees: audit infra sandbox vert; contrôle visuel de l'URL
  sandbox dans le navigateur; profil Gmail client vérifié.
- resultat de requalification: la boîte admin a été récupérée et ouverte;
  l'OTP du site a été reçu. Le 2026-07-31, les deux notifications de commande
  et la notification de remboursement ont ete controlees directement dans
  cette boite. La confirmation forte admin est fermee separement par A-013.
- documentation canonique a mettre a jour: aucune; acces de recette retabli.

### A-013 - Confirmation forte Google admin bloquée dans le navigateur intégré

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: preflight P0 / accès back-office avant publication
- environnement: sandbox / Stripe test
- `runId`: `run_email_luna_20260730_2020`
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: après la connexion OTP admin, la confirmation Google ou la
  connexion rapide établit l'assurance forte `aal2` et ouvre `/admin`.
- observe: la connexion OTP admin est réussie mais reste `aal1`. Depuis la
  page `/admin`, le bouton de confirmation Google reste en état
  `Connexion avec Google…` pendant plus de vingt secondes; aucun onglet OAuth
  n'apparaît et aucune confirmation `aal2` n'est obtenue. La connexion rapide
  n'est pas proposée dans cette session de navigateur.
- preuve: snapshots et captures de la page `/admin` à 22:21 Europe/Paris;
  deux tentatives contrôlées, Playwright puis clic navigateur, sans nouvelle
  fenêtre ni erreur applicative visible.
- impact: impossible de publier les deux annonces, de modifier les statuts
  ou de demander un remboursement depuis le back-office; la recette réelle ne
  peut pas passer la Gate P0.
- cause racine ou hypothese: limitation ou blocage de la fenêtre OAuth
  `signInWithPopup` dans le navigateur intégré; aucune anomalie backend
  démontrée à ce stade.
- decision de correction: aucune correction par Luna; reprendre depuis une
  surface navigateur avec OAuth/popup fonctionnel ou une connexion rapide
  déjà enregistrée, puis requalifier sans modifier le code.
- fichiers/Functions touches: aucun
- validations lancees: boîte Gmail admin accessible; OTP admin reçu et
  validé; accès `/admin` vérifié; deux tentatives OAuth contrôlées.
- resultat de requalification: le 2026-07-31, Chrome externe avec l'extension
  ChatGPT a ouvert Google OAuth et authentifie `loa.gto15@gmail.com` avec
  l'assurance forte attendue. `/admin` a ensuite permis de consulter les deux
  commandes, publier un meuble, appliquer deux transitions de fulfillment et
  effectuer un remboursement Stripe test complet. Aucun patch applicatif
  n'etait necessaire.
- documentation canonique a mettre a jour:
  `TEST_COMMERCE_SANDBOX.md` et
  `_DOCS/email/RECETTE_EMAILS_LUNA.md`, mis a jour.

### A-014 - Erreur reseau transitoire pendant la validation OTP client

- statut: `FERMEE`
- severite: `MINEURE`
- phase: reconnexion client apres remboursement
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260731_chrome01`
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: `auth/network-request-failed`
- attendu: le code OTP valide la session client au premier envoi.
- observe: la premiere validation a affiche une erreur reseau Firebase. Un
  unique nouvel essai avec le meme code encore valide a reussi et la session
  client a ete ouverte.
- preuve: observation de la modale Auth puis acces reussi a
  `/mes-commandes`; aucun second OTP demande.
- impact: friction ponctuelle recuperee sans doublon ni perte de donnees.
- cause racine ou hypothese: incident reseau transitoire de la surface
  navigateur; aucune panne Auth durable demontree.
- decision de correction: aucun patch sur un evenement unique non
  reproductible; conserver le retry utilisateur existant et surveiller une
  recurrence.
- fichiers/Functions touches: aucun.
- validations lancees: second essai reussi, identite client confirmee, aucune
  permission admin.
- resultat de requalification: ferme pour ce run; rouvrir avec une nouvelle
  preuve si l'erreur devient reproductible.
- documentation canonique a mettre a jour: aucune.

### A-015 - Meuble de smoke test non archive apres la recette

- statut: `OUVERTE`
- severite: `MINEURE`
- phase: nettoyage de recette
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260731_chrome01`
- `productId`: `product-6d13f3bf-0f2a-449b-94ad-4c72fda7729d`
- `orderId`: sans objet
- reference provider non sensible: catalogue public version `198`
- attendu: le meuble de publication est archive par la commande admin normale
  avant la fermeture de la campagne.
- observe: le dialogue natif de confirmation d'archivage a bloque la surface
  d'automatisation Chrome. Le controle commerce a ensuite ete referme sans
  forcer la mutation. Le produit reste `published`, stock `1`, sans image et
  `seoIndexable=false`.
- preuve: API catalogue publique et audit final apres fermeture revision 52.
- impact: residu de recette visible dans le sandbox, mais non indexable et non
  implique dans les commandes payees.
- cause racine ou hypothese: limitation de pilotage du dialogue natif Chrome,
  pas une anomalie metier du site demontree.
- decision de correction: lors de la prochaine fenetre admin bornee, archiver
  cet identifiant exact par l'interface normale; ne pas rouvrir `v2_all`
  uniquement pour masquer le resultat de cette campagne.
- fichiers/Functions touches: aucun.
- validations lancees: controle ferme, operations `healthy`, produit relu par
  son identifiant exact.
- resultat de requalification: en attente de l'archivage et de sa disparition
  du catalogue public.
- documentation canonique a mettre a jour: aucune apres nettoyage.

### A-016 - Documents des nouvelles commandes absents au controle immediat

- statut: `FERMEE`
- severite: `MINEURE`
- phase: projection client apres paiement et remboursement
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260731_chrome01`
- `productId`: sans objet
- `orderId`: `ord_033f4418-2e02-488e-ab68-60f2f24b5629` et
  `ord_fcc6307f-c996-4c40-b576-b9ce391838e1`
- reference provider non sensible: sans objet
- attendu: les documents sandbox de paiement, puis de remboursement pour la
  commande concernee, deviennent disponibles dans `/mes-commandes`.
- observe: au controle immediat, l'interface indiquait que le document etait a
  venir et l'audit retournait une liste de documents vide. Une commande plus
  ancienne affichait correctement ses documents.
- preuve: lecture client et audit serveur en fin de run.
- impact: aucun impact paiement, remboursement ou statut; justificatifs
  temporairement indisponibles.
- cause racine ou hypothese: projection asynchrone pas encore terminee ou
  generation manquante; la relecture differee doit trancher avant tout patch.
- decision de correction: recontroler les deux commandes sans nouvelle
  mutation. Si les documents restent absents, transmettre la reproduction a
  GPT-5.6-sol.
- fichiers/Functions touches: aucun pendant cette recette.
- validations lancees: paiements, remboursement, outbox, statuts et sante
  operations tous coherents.
- resultat de requalification: relecture serveur ciblee du 2026-07-31 sans
  nouvelle mutation: `ord_fcc6307f-c996-4c40-b576-b9ce391838e1` contient le
  `sandbox_payment_receipt`; `ord_033f4418-2e02-488e-ab68-60f2f24b5629`
  contient le `sandbox_payment_receipt` et la
  `sandbox_refund_confirmation`. Le delai de projection n'a entraine aucune
  perte durable.
- documentation canonique a mettre a jour: chapitre commerce seulement si le
  contrat de generation doit etre corrige.

### A-017 - Evenement Stripe refund.failed non pris en charge par le rail v2

- statut: `CORRIGEE_A_REQUALIFIER`
- severite: `BLOQUANTE`
- phase: gate technique avant remboursement asynchrone M12/M13
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260731_email02`
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: un evenement Stripe `refund.failed` atteint un consommateur v2
  deploye et met a jour durablement la commande, la tentative et les deux
  outbox d'anomalie, sans creer un faux fait financier de remboursement.
- observe: le code du consommateur v2 `createStripeWebhookIngress` ignore
  tout evenement qui ne commence pas par `payment_intent.`; le worker v2
  `createWebhookWorker` rejette aussi les types hors `payment_intent.*`. Le
  support `refund.failed` visible dans `stripeWebhook.js` appartient au rail
  legacy et ne constitue pas une preuve du rail v2 qualifiant.
- preuve: inspection du code executable actuel dans
  `functions/src/commerce/domain/stripeWebhookIngress.js`,
  `functions/src/commerce/domain/webhookWorker.js` et
  `functions/src/commerce/stripeWebhook.js`, avant toute ouverture ou achat
  de la campagne; controles commerce encore fermes a la revision 52.
- impact: impossible de qualifier sans risque M12/M13, la chronologie d'un
  remboursement asynchrone Stripe et la projection financiere finale.
- cause racine ou hypothese: cause technique apparente, a confirmer par
  `GPT-5.6-sol` sur le cablage deploye et les endpoints Stripe actifs.
- decision de correction: aucune correction par Luna; ne pas utiliser la carte
  de test `refund.failed`, marquer M12/M13 `BLOQUE` et transmettre le rail a
  `GPT-5.6-sol`.
- fichiers/Functions touches: aucun pendant cette recette.
- validations lancees: preflight v2_all en lecture seule reussi; controle
  sandbox ferme; operations `healthy` avec compteurs nuls; aucun paiement ou
  remboursement asynchrone execute.
- fichiers/Functions touches: `stripeWebhookIngress.js`, `webhookWorker.js`,
  `refundEffectApplier.js`, `v2Runtime.js`, tests workers et Firestore.
- validations lancees: routage ingress/worker local vert; Firestore Emulator
  16/16, 75 assertions, dont echec refund durable, tentative terminale, zero
  faux fait financier et deux alertes outbox.
- preuve de deploiement complementaire du 2026-07-31: `stripeWebhookV2` et
  `stripeConnectWebhookV2` sont `ACTIVE`, revision 4, issus du meme build et
  mis a jour respectivement a 16:11:03 et 16:11:09 Europe/Paris, apres la
  correction de 16:03. Le statut reste `CORRIGEE_A_REQUALIFIER` jusqu'au smoke
  fonctionnel M12/M13; l'ancien texte « deploiement attendu » ne bloque plus
  le reste de la campagne.
- resultat de requalification: code et webhooks v2 deployes; la gate non mutante
  `commerce:refund-failed:preflight`, puis le smoke sandbox borne M12/M13,
  ferment la requalification.
- gate technique du 2026-07-31: `commerce:refund-failed:preflight` retourne
  `READY`; les trois Functions sont actives, les deux endpoints refusent la
  requete non signee et l'endpoint Stripe test Connect ecoute
  `refund.created`, `refund.updated` et `refund.failed`. M12/M13 ne sont plus
  bloques avant paiement; seul leur smoke fonctionnel reste a executer.
- documentation canonique a mettre a jour: commerce, qualite et cartographie,
  mis a jour dans le meme changement.

### A-018 - Etat de preparation non rafraichi dans le back-office

- statut: `CORRIGEE_A_REQUALIFIER`
- severite: `MAJEURE`
- phase: fulfillment livraison admin
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260731_email02`
- `productId`: `BfVsRJC01QMNDvx9Tldf`
- `orderId`: `ord_c0f56ca7-0a10-4bb8-a089-136dd257dbc6`
- reference provider non sensible: `CMD-ORD_C0F56C`
- attendu: l'action admin de mise en preparation fait evoluer
  `fulfillmentSummary.status`, rafraichit la commande, retire l'action deja
  consommee, ouvre la transition suivante et ajoute l'etape a l'historique.
- observe: le clic admin a cree l'evenement `fulfillment-prepare` et l'outbox
  `order-preparing` a ete envoyee; l'e-mail client de preparation est bien
  arrive. Le back-office a conserve sa page en cache, l'historique UI ignorait
  les evenements fulfillment et l'etiquette financiere `paid` a ete interpretee
  a tort comme l'etat logistique.
- preuve: relecture serveur ciblee du 2026-07-31: commande `paid` sur l'axe
  financier, `fulfillmentSummary.status=preparing`, `stateVersion=3`, evenement
  `fulfillment-prepare` present et outbox `order-preparing` en `sent`.
- impact: la branche livraison ne peut pas être menée jusqu'à expédition,
  livraison et remboursement sans risquer de produire des événements
  contradictoires.
- cause racine: l'ecriture etait atomique et durable; `AdminOrders` ne forcait
  pas la relecture apres la callable et `buildAdminOrderTimeline` ne projetait
  pas les cinq actions fulfillment.
- decision de correction: forcer une premiere page admin fraiche apres chaque
  commande, recharger la chronologie, afficher un badge logistique separe et
  prendre en charge les cinq evenements fulfillment dans le lecteur serveur.
- fichiers/Functions touches: `AdminOrders.jsx`, `v2OrderQueries.js` et le
  contrat `gate5-consumers`.
- validations lancees: lecture sandbox ciblee; tests lecteurs/workers 24/24;
  Firestore Emulator 16/16 et 75 assertions.
- preuve de deploiement complementaire du 2026-07-31: le lecteur
  `getOrderTimelineAdminV2` est `ACTIVE`, revision 3, mis a jour a 16:10:20
  Europe/Paris; le backend App Hosting sandbox a ete mis a jour a 16:19:19.
  L'ancien texte « deploiement attendu » ne constitue donc plus un blocage.
- resultat de requalification: correction Function et App Hosting deployee;
  la branche livraison A-018 doit encore fermer le smoke admin borne sans
  repetition d'une transition ambiguë.
- documentation canonique a mettre a jour: commerce et back-office, mis a
  jour dans le meme changement.

### A-019 - Validation OTP client en erreur reseau persistante

- statut: `CORRIGEE_A_REQUALIFIER`
- severite: `MAJEURE`
- phase: M01 avant ouverture de la fenetre commerce; classe a tort en P0 par
  la campagne initiale
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260731_terra01`
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: `auth/network-request-failed`
- attendu: le code de connexion recu dans la boite de recette client ouvre la
  session de `pvml7008@gmail.com`, qui reste sans droit administrateur.
- observe: apres un seul envoi OTP et la saisie directe du code courant, la
  modale a affiche `Firebase: Error (auth/network-request-failed)`. Un unique
  retry controle avec le meme code a produit la meme erreur. Aucun second OTP,
  achat, publication, ouverture `v2_all`, paiement, remboursement ou mutation
  admin n'a ete tente.
- preuve: parcours Chrome externe sur le sandbox, 2026-07-31; les deux
  tentatives ont ete faites avant toute ouverture, avec la boite client
  accessible par le connecteur. Le code n'est pas conserve dans ce registre.
- impact: M01 a ete interrompu et Terra a assimile a tort ce scenario a la
  Gate P0, ce qui a condamne M02--M13 alors que M02 et les controles
  independants pouvaient encore progresser sans paiement.
- cause racine: les logs Cloud sanitizes de 18:53 Europe/Paris prouvent deux
  succes `verifyCustomerLoginOtp` consecutifs pour le meme hash client, le
  second en reprise. L'OTP, App Check et la Function etaient donc sains. Les
  deux echecs ont eu lieu ensuite pendant `signInWithCustomToken`. La modale
  regroupait les deux phases dans le meme `catch`, perdait le Custom Token
  apres l'erreur et journalisait a tort l'ensemble comme un echec de
  verification OTP. La recette traitait en plus M01 comme une Gate P0 globale.
- decision de correction: le client retente desormais deux fois, de facon
  courte et bornee, l'echange Firebase Auth avec le meme Custom Token. Si le
  transport reste indisponible, le token demeure uniquement en memoire dans
  la modale pour un retry utilisateur sans nouvel appel OTP. Les metriques
  separent verification et ouverture de session. La recette qualifie M01 hors
  P0, poursuit M02 jusqu'au paiement sans payer, puis requalifie M01 avant de
  completer P1.
- fichiers/Functions touches: `customTokenSignIn.js`, `AuthContext.jsx`,
  `LegacyLoginModalFullIsland.jsx`, tests, contrat Auth et procedure de recette;
  aucune Function, rule, donnee ou configuration cloud modifiee.
- validations lancees: status sandbox `CLOSED`, preflight des cinq produits
  `READY`, gate A-017 `READY`, puis status final `CLOSED` avec operations
  `healthy` et compteurs nuls.
- resultat de requalification: 61/61 tests Auth, lint cible sans erreur et
  build sandbox verts. App Hosting `build-2026-07-31-003` a termine son rollout
  `SUCCEEDED` le 2026-07-31 a 19:14:46 Europe/Paris; `/galerie` repond HTTP 200
  et le chunk public contient la metrique et le message de reprise. M01 reste
  a rejouer fonctionnellement par Terra.
- documentation canonique a mettre a jour:
  `_DOCS/security/AUTHENTIFICATION.md`,
  `_DOCS/email/RECETTE_EMAILS_LUNA.md`, `map.md`.

### A-019 - Session OTP cliente perdue avant le checkout

- statut: `FERMEE`
- severite: `MINEURE`
- phase: connexion client et checkout
- environnement: App Hosting sandbox / Stripe test
- `runId`: `run_v2all_20260801_luna01`
- identite: `pvml7008@gmail.com`, sans role admin attendu
- attendu: apres OTP valide, la session cliente et les deux ajouts panier
  persistent jusqu'a `/checkout`, qui permet de choisir livraison ou retrait.
- observe: l'interface a expose `Se deconnecter` apres validation OTP, puis,
  apres l'ouverture de deux fiches produit autorisees et le passage a
  `/checkout`, elle est revenue sur la galerie avec `Connexion` et un panier
  vide. Aucun formulaire de checkout, Payment Element, paiement, commande,
  publication, transition, remboursement ou mutation admin n'a ete atteint.
- etapes: ouvrir le sandbox; deconnecter la session initiale; demander et
  saisir l'OTP courant du client; ajouter les produits autorises
  `9yl4isQ7IjfnApVGQC5C` et `9eA4qVqGCUsPZLkg7bEu`; ouvrir `/checkout`.
- resultat de requalification: apres attente d'hydratation et observation de
  l'aside panier, les deux lignes etaient presentes; `/checkout` a conserve la
  session et a permis les commandes `CMD-ORD_337B35` et `CMD-ORD_7A455C`.
- impact: friction de chargement initiale sans perte de données; les deux
  commandes sont devenues durables et payées.
- preuve sanitisee: preflight `READY`, gate A-017 `READY`; status avant
  fermeture `OPEN` avec operations `healthy` et compteurs nuls; status final
  `CLOSED`, `v2_fixture`, admin `read_only`, offline `off`, revision `60`.
- residus: aucune commande, hold, paiement, remboursement, produit smoke ou
  mutation admin creee par ce run; les deux produits autorises doivent etre
  verifies disponibles avant requalification.
- controle: fermer la fenetre avant tout retry; ne pas rejouer un paiement.

### A-020 - Connexion Google administrateur interrompue lors du premier parcours

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: accès administrateur
- environnement: App Hosting sandbox / Stripe test
- `runId`: `run_v2all_20260801_luna02`
- identite: `loa.gto15@gmail.com`; session admin obtenue lors de la reprise
- attendu: Google OAuth ouvre le back-office avec assurance forte.
- observe: deux clics contrôlés sur `Continuer avec Google` ont laissé
  `/admin` sur l'écran d'accès avec `Firebase: Error (auth/network-request-failed)`.
  La reprise a ouvert le sélecteur Google avec plusieurs comptes; la sélection
  explicite de `loa.gto15@gmail.com` a fermé la popup et chargé le back-office.
- impact initial: l'accès admin était bloqué dans le premier parcours; les
  transitions livraison/retrait, l'archivage A-015, le remboursement et
  M04/M05-M13 restent volontairement non exécutés dans ce run ciblé.
- preuve sanitizée: l'admin affiche `Loa A`, l'adresse `loa.gto15@gmail.com`,
  le rôle `Administrateur` et `Authentification forte confirmée`; aucun contrôle
  métier ni aucune mutation n'a été lancé pendant la reprise.
- résidus: produit smoke historique A-015 toujours à archiver; aucune nouvelle
  commande, hold, paiement ou mutation créée.
- contrôle: session laissée en lecture seule, puis fermeture de la fenêtre après
  vérification de l'identité et de la protection serveur.

### A-021 - Confirmation de publication fermee avant le changement de vue

- statut: `CORRIGEE_A_REQUALIFIER`
- severite: `MAJEURE`
- phase: publication admin reelle depuis App Hosting
- environnement: sandbox / App Hosting
- `runId`: `run_admin_publication_20260808_popup01`
- `productId`: `product-689bcaf1-19d3-4884-a5bd-2d2b310c05ea`, masque en
  brouillon apres la recette
- attendu: la confirmation reste lisible jusqu'a l'action explicite « Voir la
  publication », puis l'onglet Publications s'ouvre sur le meuble cree.
- observe: a 407 ms, la modale affiche 4 % et « Verification securisee »; a
  932 ms, elle a disparu, le formulaire est vide et l'onglet Creer reste
  actif. Le meuble devient durablement visible comme PUBLIC dans la liste
  environ neuf secondes plus tard, apres ouverture manuelle de Publications.
- preuve: parcours humain complet dans Chrome avec trois images et le compte
  admin deja authentifie; aucun avertissement ni erreur console pendant la
  publication. Le navigateur charge le rollout
  `sv-msjjievb-33379840138c`.
- cause racine: `AdminForm` renouvelle le jeton avant la commande. Le listener
  Auth passe alors brievement `claimsStatus` a `loading`, tandis que
  `AdminAppIsland` retournait immediatement son ecran de chargement pour tout
  etat `loading`. Cette branche demontait `AdminPublicationWorkspace` et
  `AdminForm`: la modale locale disparaissait, l'operation asynchrone perdait
  son callback de fin, puis le remontage reprenait la vue initiale `Creer`.
- decision de correction: conserver monte un back-office dont l'utilisateur,
  le role admin et l'AAL2 sont deja resolus pendant la seule relecture des
  claims. Le garde initial reste bloque tant que ces trois preuves ne sont pas
  disponibles; les controles serveur restent autoritaires pendant la courte
  relecture.
- fichiers/Functions touches: `app/admin/AdminAppIsland.jsx`, contrat Auth et
  chapitre canonique du back-office; aucune Function ni donnee catalogue.
- resultat de requalification: correction locale en attente de deploiement et
  d'un nouveau parcours humain complet.

## Journal de campagne

| Horodatage Europe/Paris | Evenement | Resultat | Identifiants non sensibles |
| --- | --- | --- | --- |
| 2026-08-01 | Recette client interrompue et fermeture de securite | OTP client confirme, puis retour galerie/panier vide au checkout; aucun paiement ni mutation admin; controles restaures | `run_v2all_20260801_luna01`, `controlRevision=60`, A-019 |
| 2026-08-01 | Reprise recette client | Panier hydrate puis deux commandes Stripe test payees: livraison 464 EUR et retrait 350 EUR; historique client confirme; OAuth admin bloque par transport | `run_v2all_20260801_luna02`, `CMD-ORD_337B35`, `CMD-ORD_7A455C`, `A-020` |
| 2026-08-01 | Reprise ciblée accès admin | Sélecteur Google repris avec `loa.gto15@gmail.com`; back-office chargé, rôle Administrateur et authentification forte confirmés; aucune mutation | `run_v2all_20260801_luna02`, `A-020` |
| 2026-08-08 | Publication admin reelle | Progression visible environ 0,5 s puis démontage du parcours pendant le renouvellement Auth; retour incorrect sur Creer malgré la création durable du meuble | `run_admin_publication_20260808_popup01`, `A-021`, `sv-msjjievb-33379840138c` |
| 2026-07-30 | Initialisation du plan et du registre | En attente du preflight | - |
| 2026-07-30 15:15 | Publication admin depuis le site Hosting | Bloquee en finalisation par une demande de connexion | `run_v2all_recipe_20260730_client_purchase_v1` |
| 2026-07-30 15:18 | Fermeture de securite de la fenetre commerce | `v2_fixture`, mutations `read_only`, paiement offline `off` | `controlRevision=36` |
| 2026-07-30 15:23 | Verification de l'identite active | Le compte connecte etait un super-admin distinct; deconnexion sans nouvelle mutation | - |
| 2026-07-30 15:30 | Correction locale A-001 | Prevalidation avant upload; tests cibles et lint verts | - |
| 2026-07-30 15:34 | Validation commerce | Faux rouge de confinement localise puis corrige dans son assertion | `A-002` |
| 2026-07-30 15:38 | Validation Firebase | Incompatibilite de transform entre SDK isolee et rendue injectable | `A-003` |
| 2026-07-30 15:42 | Requalification locale | Commerce, navigateur local, Firebase, rules, Auth et build verts | `A-002`, `A-003` fermes; `A-001` a deployer |
| 2026-07-30 16:34 | Connexion admin exacte et preflight | Identite forte confirmee; controle sain puis fenetre ouverte | `run_v2all_recipe_20260730_full_manual_v2`, `controlRevision=37` |
| 2026-07-30 16:37 | Actualisation de `/admin` | Page vide, publication interrompue avant toute donnee | `A-004` |
| 2026-07-30 16:38 | Fermeture de securite | Retour aux controles fermes | `controlRevision=38` |
| 2026-07-30 16:42 | Requalification A-004 | Session restauree apres redemarrage Chrome; actualisation suivante reussie | `A-004` fermee |
| 2026-07-30 16:47 | Preuve independante A-004 | Chrome etait derriere ChatGPT; interface admin intacte au retour au premier plan | `A-004` faux signal local |
| 2026-07-30 16:51 | Preflight de publication | Refus apres expiration de la fenetre de quinze minutes; aucun upload lance | `run_v2all_recipe_20260730_full_manual_v4`, `A-005` |
| 2026-07-30 16:52 | Fermeture de securite | Retour aux controles fermes avant correction | `controlRevision=42` |
| 2026-07-30 17:00 | Correction A-005 | Recence retiree des commandes produit, protections admin actives et AAL2 conservees | Six Functions produit deployees |
| 2026-07-30 17:12 | Publication reelle | Produit cree avec deux images sans reconnexion admin | `product-2c1f1f00-be4c-4508-8b90-559f2357c162`; `A-001`, `A-005` fermees |
| 2026-07-30 17:16 | Connexion depuis `/wishlist` | Redirection incorrecte vers `/admin`, cause localisee et corrigee | `A-006` |
| 2026-07-30 17:24 | Requalification du rollout client | Divergence d'hydratation React `418` localisee dans l'initialisation wishlist | `A-007` |
| 2026-07-30 17:32 | Requalification wishlist | Connexion publique et hydratation propres sur Hosting | `A-006`, `A-007` fermees |
| 2026-07-30 17:37 | Achat client Stripe test | Paiement unique et commande durable `paid` | `ord_cf6220c7-890d-4e78-bb6f-c049df51fb08`, `pi_3Tyw1jRnGkmlBCey0Gc9oJla` |
| 2026-07-30 17:49 | Reprise e-mail commande | Secret Gmail sandbox renouvele, outbox reprise et message recu | `A-008` fermee |
| 2026-07-30 17:55 | Deploiement e-mails premium | Templates paiement/remboursement et snapshot livraison deployes | `A-009` fermee |
| 2026-07-30 18:00 | Remboursement admin Stripe test | Remboursement complet unique confirme | `re_3Tyw1jRnGkmlBCey0jP0Fk0p` |
| 2026-07-30 18:01 | Fermeture de securite | `v2_fixture`, mutations `read_only`, paiement offline `off` | `controlRevision=50` |
| 2026-07-30 18:03 | Verification client finale | Commande remboursee, 120 EUR, documents paiement/remboursement visibles | `CMD-ORD_CF6220` |
| 2026-07-30 18:04 | Audit MIME remboursement | Contenu premium et SPF/DKIM/DMARC verts; classement Gmail spam | `A-010` differee externe |
| 2026-07-30 18:08 | Rapprochement final | Operations `healthy`, controle ferme, commande `refunded`, stock produit `0`, aucun restock implicite | `controlRevision=50` |
| 2026-07-30 19:15 | Refonte e-mail v2 locale | 13 modeles premium, admin dedie, lifecycle/refund/OTP et lien commande | `A-011` corrigee a requalifier |
| 2026-07-30 19:24 | Deploiement et smoke e-mails v2 | 15 Functions actives, App Hosting build 019 reussi, liens admin/client 200 | `A-011` fermee |
| 2026-07-30 20:20 | Preflight recette e-mails Luna | Boîte client accessible; boîte admin absente de la session; aucune mutation lancée | `run_email_luna_20260730_2020`, `A-012` |
| 2026-07-30 21:52 | Tentative de connexion Gmail admin | Google impose une récupération avec délai de sécurité de 24 h; aucune tentative supplémentaire effectuée | `A-012` |
| 2026-07-30 21:54 | Récupération Gmail admin terminée | Boîte `loa.gto15@gmail.com` ouverte; accès Gmail admin rétabli | `A-012` fermée |
| 2026-07-30 21:58 | OTP admin du sandbox | Code reçu et connexion standard validée; assurance forte encore requise pour `/admin` | `run_email_luna_20260730_2020` |
| 2026-07-30 22:21 | Confirmation forte Google | OAuth intégré bloqué après deux tentatives; aucune mutation commerce lancée | `A-013` |
| 2026-07-31 13:45 | Preflight puis ouverture bornee | Operations saines, cinq produits autorises, Stripe test | `run_v2all_20260731_chrome01`, `controlRevision=51` |
| 2026-07-31 13:49 | Achat client simple | Commande retrait durable `paid`, 750 EUR | `ord_033f4418-2e02-488e-ab68-60f2f24b5629` |
| 2026-07-31 13:53 | Achat client multiple | Deux meubles et livraison, commande durable `paid`, 2 449 EUR | `ord_fcc6307f-c996-4c40-b576-b9ce391838e1` |
| 2026-07-31 13:56 | Requalification OAuth admin | Connexion Google forte reussie dans Chrome externe | `A-013` fermee |
| 2026-07-31 13:59 | Publication admin | Meuble non indexable publie, catalogue version 198 | `product-6d13f3bf-0f2a-449b-94ad-4c72fda7729d` |
| 2026-07-31 14:01 | Fulfillment admin | Preparation puis pret au retrait confirmes | M05, M06 |
| 2026-07-31 14:03 | Remboursement admin | Remboursement complet unique, aucun restock | `re_3TzEysRnGkmlBCey0ltN1XMf` |
| 2026-07-31 14:05 | Controle des deux boites | Client: six messages en spam; admin: trois notifications en inbox | A-010 recurrente; M01/M03/M04/M05/M06/M10/M11 |
| 2026-07-31 14:06 | Reconnexion et verification client | Premier essai OTP en erreur reseau, retry reussi; commande remboursee visible | `A-014` fermee; `A-016` en diagnostic |
| 2026-07-31 14:07 | Fermeture et audit final | `v2_fixture`, mutations `read_only`, operations `healthy`, compteurs nuls | `controlRevision=52` |
| 2026-07-31 14:09 | Nettoyage produit | Dialogue Chrome non pilotable; produit laisse publie et non indexable | `A-015` ouverte |
| 2026-07-31 15:30 | Achat livraison client | Paiement Stripe test durable de 240 EUR; confirmation client et admin reçues | `ord_c0f56ca7-0a10-4bb8-a089-136dd257dbc6` |
| 2026-07-31 15:34 | Fulfillment préparation | Événement et e-mail émis mais commande toujours `paid` après audit; aucune répétition | `A-018` ouverte |
| 2026-07-31 15:35 | Recette e-mails | Confirmation et préparation client trouvées dans SPAM; notification admin en inbox | `A-010` recurrente |
| 2026-07-31 15:36 | Fermeture et audit final | `v2_fixture`, mutations `read_only`, opérations `healthy`, compteurs nuls | `run_v2all_20260731_email02`, `controlRevision=54` |
| 2026-07-31 16:00 | Diagnostic A-016/A-018 | Documents differes presents; fulfillment durable `preparing`, axe financier `paid` correct | A-016 fermee; A-018 corrigee a requalifier |
| 2026-07-31 16:03 | Correction webhook refund v2 | Ingress/worker/refund applier couverts; Firestore 16/16, 75 assertions | A-017 corrigee a requalifier |
