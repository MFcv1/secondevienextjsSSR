# Registre temporaire des anomalies de recette commerce

Derniere mise a jour: 2026-08-13
Statut: `FERME_AVEC_RESIDU_EXTERNE_EMAIL`
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
| A-017 | Remboursement asynchrone | `BLOQUANTE` | `FERMEE_APRES_REQUALIFICATION_SANDBOX` | Le rail v2 applique aussi la reversal Stripe `succeeded -> failed` sans faux remboursement ni restock |
| A-018 | Fulfillment livraison | `MAJEURE` | `CORRIGEE_A_REQUALIFIER` | L'etat durable etait correct; le cache et la chronologie admin restaient obsoletes |
| A-019 | Session client / checkout | `MINEURE` | `FERMEE` | Le panier et la session etaient charges apres hydratation; la reprise a permis les deux commandes |
| A-020 | Accès administrateur Google | `BLOQUANTE` | `FERMEE` | Le premier parcours n’achevait pas le sélecteur Google; reprise explicite du compte admin réussie |
| A-021 | Publication admin | `MAJEURE` | `CORRIGEE_A_REQUALIFIER` | Le renouvellement du jeton démontait le parcours, fermait la progression et réinitialisait la vue sur Créer |
| A-022 | Gate refund.failed Gen2 | `IMPORTANTE` | `REQUALIFIEE` | Le préflight M12/M13 cible désormais les trois Functions Gen2 finales et leurs URL publiques |

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

- statut: `REQUALIFIEE`
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
- resultat de requalification: controle public du 2026-08-23 sur la revision
  catalogue 306: l'identifiant exact est absent de `/api/catalog`. Le nouveau
  smoke de campagne a lui aussi ete archive par l'interface normale et sa
  route produit finale repond 404; aucun residu public dangereux ne subsiste.
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

- statut: `FERMEE_APRES_REQUALIFICATION_SANDBOX`
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
  l'ancien `functions/src/commerce/stripeWebhook.js` (retire en G12-B), avant
  toute ouverture ou achat de la campagne; controles commerce encore fermes a
  la revision 52.
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
- smoke humain final du 2026-08-13: un seul remboursement de 120 EUR a ete
  demande sur `CMD-ORD_D98296`. Stripe test l'a d'abord retourne `succeeded`,
  puis `failed` avec `expired_or_canceled_card`. Les trois evenements
  `refund.created`, `refund.failed` et `refund.updated` ont ete ingeres. Apres
  correction de la reversal, la tentative unique est `failed`, la commande
  est `needs_review`, `refundedCents=0`, `netCents=12000`, le stock reste
  engage et `restockedQty=0`. M12 client et M13 admin ont ete recus une fois.
- documentation canonique a mettre a jour: commerce, qualite et cartographie,
  mis a jour dans le meme changement.

### A-018 - Etat de preparation non rafraichi dans le back-office

- statut: `REQUALIFIEE`
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

- statut: `REQUALIFIEE`
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
  et le chunk public contient la metrique et le message de reprise. La campagne
  active du 2026-08-23 a ensuite rejoue M01 avec le compte client exact: OTP
  recu, validation et session Firebase reussies; le client est reste sans
  acces admin. Suite Auth finale `77/77`.
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

- statut: `REQUALIFIEE`
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
- resultat de requalification: campagne active du 2026-08-23 avec le compte
  admin Google/AAL2 exact: publication durable du meuble
  `product-90f942d4-9d3e-483d-a3e9-76ac3dce8de2`, confirmation conservee,
  presence publique en revision 305 puis archivage normal en revision 306.
  Les deux anciens identifiants smoke A-015/A-021 sont absents de
  `/api/catalog`; aucune Function ou production touchee par cette correction.

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

## Campagne fonctionnelle humaine objective du 2026-08-12

Identifiant de campagne: `REC-20260812-C1`

Perimetre autorise: sandbox App Hosting `secondevienextjsssr` et Stripe test exclusivement.
Methode: nouvelle observation humaine dans Chrome; aucun ancien audit, statut documentaire ou resultat historique n'est repris comme preuve. Aucun code, script, endpoint, fixture, seed, configuration cloud ou donnee injectee n'est utilise pour executer les parcours.

### Journal progressif

| Heure Europe/Paris | Scenario | Statut | Compte | Etapes reellement effectuees et observation | Attendu | Friction/anomalie, impact et preuve non sensible | Etat final des donnees |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08-12 16:35 | Controle initial: ouverture du sandbox | RÉUSSI | Visiteur non connecte | Ouverture manuelle dans Chrome de l'URL exacte; chargement de la page d'accueil intitulee « Galerie de mobilier ancien restauré »; hero, recherche, navigation, categories, connexion, favoris, panier, menu, CTA pieces et devis visibles. | Le sandbox exact charge une interface publique exploitable sans erreur visible. | Premiere tentative de controle macOS sans rendu Chrome, resolue en utilisant le mode CUA de l'extension Chrome autorisee; ce point concerne l'outil de recette, pas le site. Preuve: URL exacte et capture visuelle non sensible de l'accueil charge. | Aucune donnee creee; visiteur non connecte. |
| 2026-08-12 16:43 | Parcours public desktop et mobile | RÉUSSI | Visiteur non connecte | Parcours manuel de l'accueil, mega-menu, categorie Meubles, fiche produit Armoire, recherche « Armoire », panier vide, À propos et Devis; ouverture/fermeture du panier et du menu; controle mobile manuel en largeur 390 px puis retour desktop. | Pages principales, navigation, recherche, fiche, panier et devis lisibles et utilisables sans blocage aux deux largeurs. | Navigation globalement fluide. Une publication manifestement incoherente est visible publiquement: titre `"fr`, image de fleur violette, matiere inconnue, prix 23 EUR, classee dans Meubles/LES TABLES (`REC-20260812-A01`). Preuves: captures visuelles non sensibles des pages et identifiant releve ensuite dans l'administration. | Aucun panier conserve et aucune donnee metier creee. |
| 2026-08-12 16:47 | Connexion Google administrateur et acces back-office | RÉUSSI | `loa.gto15@gmail.com` | Ouverture de la connexion Google, selection explicite du compte autorise, confirmation visuelle de l'identite active, refus de l'enrolement rapide facultatif, puis ouverture de `/admin`; consultation des vues Stats et Publication ainsi que du menu des principales vues. | Le compte administrateur exact obtient un acces fort reconnu et le back-office charge sans erreur visible. | Acces admin confirme par le badge ADMIN, l'entree « Admin. Backoffice » et le chargement effectif du tableau de bord. Aucun compte personnel ni compte client utilise. | Session admin active; aucune mutation metier a ce stade. |
| 2026-08-12 16:54 | Creation humaine d'une annonce, tentative 1 | ÉCHEC | `loa.gto15@gmail.com` | Depuis Publication > Creer: validation du formulaire vide, choix COMMODES & CHEVETS, saisie du titre « Chevet en chêne miel aux poignées laiton », prix 180 EUR, stock 1, chêne, couleur miel naturel, style vintage, dimensions 42 x 34 x 70 cm, description realiste; televersement manuel d'une photo non sensible de chevet; controle de l'aperçu puis clic unique sur « Publier sur le site ». | L'annonce est enregistree, publiee, visible dans l'administration et le catalogue public. | Echec explicite pendant la verification securisee: `Firebase: Error (auth/network-request-failed)`. Le compteur reste a 33, une recherche exacte retourne 0 resultat et aucune annonce durable n'est visible (`REC-20260812-A03`). L'aperçu du formulaire repetait aussi deux fois une description saisie une seule fois (`REC-20260812-A02`). | Aucune annonce ni brouillon durable cree; aucune action financiere. Une seule nouvelle tentative controlee reste prevue apres ce constat. |
| 2026-08-12 16:58 | Creation humaine d'une annonce, tentative controlee 2 | RÉUSSI | `loa.gto15@gmail.com` | Sans ressaisie ni nouveau televersement, nouveau clic unique sur « Publier sur le site » apres preuve d'absence durable; les quatre etapes verification, photos, enregistrement et galerie aboutissent; recherche publique exacte puis ouverture de la fiche. | Une seule annonce durable, correctement achetable et sans doublon. | Confirmation « Publication réussie ». Recherche publique a 1 resultat; fiche avec image, titre, prix 180 EUR, description unique, chêne, dimensions 42x34x70 cm, disponibilite et bouton d'ajout au panier. L'echec precedent reste une friction intermittente P1. Preuves non sensibles: captures de confirmation, resultat de recherche et fiche publique. | Annonce publiee: `product-110a2407-4dda-4187-8c88-545da3da7709`; stock public disponible avant achat. |
| 2026-08-12 17:00 | Separation des permissions | RÉUSSI | `pvml7008@gmail.com` | Deconnexion admin; connexion Google avec selection explicite du compte client; confirmation du profil « ml pv » et de l'adresse du compte dans Mon espace; absence de badge/entree admin; navigation directe vers `/admin`. | Le compte client reste client et l'administration est refusee proprement. | Page claire: « Accès admin refusé — Ce compte n'a pas les droits administrateur », avec retour au site. Aucun compte personnel utilise. | Session client active; aucun droit ni parametre modifie. |
| 2026-08-12 17:05 | Commande simple du meuble cree, Stripe test | ÉCHEC | `pvml7008@gmail.com` | Recherche et ouverture du chevet; ajout unique au panier; controle image, quantite 1, prix et total 180 EUR; checkout en retrait atelier; coordonnees sandbox; acceptation des conditions; saisie Stripe test; clic unique de paiement; attente de la confirmation; rapprochement ulterieur dans l'administration et les deux boites Gmail. | Le paiement durable `paid` cree une commande client persistante avec ses lignes, son statut et ses documents. | Le paiement et la commande sont durables cote administration, le meuble devient « Déjà réservé » et les e-mails client/admin existent. Pourtant, l'espace client affiche 0 commande et 0 document, y compris apres attente, rafraichissement et reconnexion (`REC-20260812-A04`). Aucun rejeu effectue. | Commande `CMD-ORD_692D22`, identifiant `ord_692d22b6-df80-4be4-96d2-6497641c21d2`, 180 EUR, retrait; paiement confirme puis remboursement total Stripe test confirme; projection client toujours absente. |
| 2026-08-12 17:12 | E-mails de la commande simple | RÉUSSI | Client `pvml7008@gmail.com`, admin `loa.gto15@gmail.com` | Recherche dans les boites exactes, y compris Tous les messages et spam; ouverture des messages; controle reference, produit, quantite, montant, mode de remise, liens, redaction et rendu. | Un e-mail client et une notification admin coherents arrivent sans doublon ni contenu technique. | Client: confirmation `CMD-ORD_692D22` complete mais classee dans SPAM (`REC-20260812-A05`). Admin: notification inbox complete, montant 180 EUR, produit et lien back-office coherents. Preuves: sujets, horodatages et captures visuelles non sensibles; aucun OTP ni contenu personnel consigne. | E-mails conserves; aucun message supprime ni parametre Gmail modifie. |
| 2026-08-12 17:20 | Deuxieme commande groupee, Stripe test | ÉCHEC | `pvml7008@gmail.com` | Ajout de deux Armoires distinctes a 1 150 et 1 300 EUR; controle des deux lignes, images et sous-totaux; suppression de la premiere ligne sans perte de la seconde; retour catalogue avec panier persistant; re-ajout; checkout en livraison Marseille a 49 EUR; paiement Stripe test unique; succes puis ouverture de l'espace client. | Une seule commande groupee durable contient les deux lignes distinctes, total 2 499 EUR, livraison et documents, sans melange avec la premiere commande. | Le succes, l'administration et la chronologie confirment la commande groupee et les deux lignes. L'espace client reste cependant a 0 commande et 0 document, comme pour la premiere commande (`REC-20260812-A04`). | Commande `CMD-ORD_C00403`, identifiant `ord_c00403f4-8bc2-4d79-a1ea-f8289bb6bce0`, 2 499 EUR, livraison; paiement confirme puis rembourse en deux etapes; aucun paiement en attente. |
| 2026-08-12 17:24 | Gestion des deux commandes cote administrateur | RÉUSSI | `loa.gto15@gmail.com` | Rapprochement des deux commandes, client, lignes, montants et modes; commande livraison: preparation puis expedition sans numero de suivi; commande retrait: preparation, prete au retrait puis retrait confirme; attente des confirmations, rafraichissements et controle des chronologies. | Les transitions proposees correspondent au mode, persistent et restent compréhensibles. | Les transitions choisies persistent avec confirmation et chronologie. Les mutations prennent souvent 15 a 20 s avec chargement visible. Des actions incompatibles sont aussi proposees (expedition pour retrait, prete au retrait pour livraison), non utilisees (`REC-20260812-A06`). | `CMD-ORD_C00403` expédiee avant remboursement; `CMD-ORD_692D22` retiree avant remboursement. |
| 2026-08-12 17:31 | Remboursement total de la commande simple | RÉUSSI | `loa.gto15@gmail.com` | Retours > Remboursement manuel; ouverture de la commande de 180 EUR; verification du montant pre-rempli; clic unique sur « Rembourser 180.00 EUR »; attente; ouverture de l'historique. | Un remboursement total unique est confirme par Stripe test et persiste sans ambiguite. | Dossier deplace de Remboursement manuel vers Historique; reference de remboursement presente, synchronisation horodatee et etat Stripe `succeeded`. Chronologie admin remboursee. | Commande simple entierement remboursee; aucun rejeu; stock a recontroler publiquement apres remboursement. |
| 2026-08-12 17:32 | Remboursement partiel puis solde de la commande groupee | RÉUSSI | `loa.gto15@gmail.com` | Ouverture de la commande 2 499 EUR; remplacement manuel du montant par 1 150 EUR, correspondant a la premiere ligne; clic unique; attente de `succeeded`; reouverture montrant un solde de 1 349 EUR; clic unique sur ce solde seulement apres preuve durable du partiel; attente puis controle Historique et Ventes. | Le remboursement partiel persiste, le solde restant est exact, puis le remboursement du solde est confirme sans doublon. | Premier remboursement `succeeded`; solde recalcule exactement a 1 349 EUR (1 300 EUR + 49 EUR); second remboursement `succeeded`; deux paires d'evenements demandé/confirme dans la chronologie; commande admin « Remboursée » et encore « Expédiée ». L'interface ne permet pas d'associer explicitement le remboursement a une ligne, seulement de saisir un montant. | Commande groupee remboursee au total en deux operations successives; aucun paiement ni remboursement ambigu. |
| 2026-08-12 17:37 | E-mails commande groupee, transitions et remboursements | RÉUSSI | Client `pvml7008@gmail.com`, admin `loa.gto15@gmail.com` | Recherche des deux references dans les boites exactes; controle des deux confirmations, de cinq transitions et de trois remboursements cote client; controle des notifications admin de nouvelle commande et de remboursement; lecture des lignes, montants, modes et liens sans recopier de donnees personnelles. | Tous les evenements emis arrivent une seule fois par action, avec lignes et montants exacts, et les notifications admin sont exploitables. | Dix messages client retrouves: deux confirmations, preparation des deux commandes, expedition, prete au retrait, retrait effectue et trois remboursements; les deux Armoires, 1 150/1 300 EUR, total 2 499 EUR et livraison sont exacts. Tous les dix sont classes SPAM (`REC-20260812-A05`). Les notifications admin de commande et remboursement sont en inbox; le remboursement mentionne « sans remise en stock automatique ». | E-mails conserves dans les deux boites; aucun doublon d'action observe, aucun message supprime et aucun parametre modifie. |
| 2026-08-12 17:40 | Projection client finale apres transitions et remboursements | ÉCHEC | `pvml7008@gmail.com` | Reconnexion Google exacte; ouverture de Mon espace apres tous les evenements; attente de chargement; controle de la vue d'ensemble, Commandes et Documents. | Les deux commandes, leurs chronologies, remboursements et recus apparaissent durablement apres reconnexion. | Toujours 0 commande, 0 document et 0,00 EUR de remboursement; la page Documents affiche « Aucun reçu émis » malgre deux paiements et trois remboursements confirmes (`REC-20260812-A04`). Preuve: capture visuelle non sensible apres synchronisation. | Les donnees existent cote administration/Stripe/e-mails mais aucune projection client exploitable. |
| 2026-08-12 17:42 | Stock apres remboursements | RÉUSSI | `pvml7008@gmail.com`, puis lecture publique | Recherche du chevet et des deux Armoires apres remboursement total; ouverture de la fiche du chevet. | Aucun remboursement ne remet silencieusement un meuble en vente sans decision physique distincte. | Chevet affiche « Réservé » puis bouton désactivé « Déjà réservé »; les deux Armoires achetees affichent aussi « Réservé ». La notification admin confirme explicitement l'absence de remise en stock automatique. | Les trois meubles ont stock public 0 et restent non achetables. |
| 2026-08-12 17:46 | Archivage et nettoyage final | BLOQUÉ | `loa.gto15@gmail.com`, puis visiteur | Recherche exacte de l'annonce dans Publication > Publications; constat PUBLIC, stock 0; clic sur l'action Archiver; confirmation native acceptee; attente; controle depuis une seconde vue admin et recherche publique; nouvel essai uniquement apres preuve d'absence de changement; confirmation acceptee; nouveau controle public; verification panier vide; deconnexion finale du site. | L'annonce est archivee et disparait du public; aucun panier, paiement ou remboursement ne reste ambigu; le site est deconnecte. | L'annonce reste PUBLIC et visible en recherche, mais non achetable car reservee. L'acceptation de la confirmation native ne rend jamais un resultat durable et le controle du navigateur expire (`REC-20260812-A07`). Panier vide, deux commandes totalement remboursees, aucun paiement en attente, session du site deconnectee. | Annonce non archivee, publique mais stock 0/non achetable; commandes et remboursements conserves comme preuves; e-mails conserves; aucun autre objet modifie. |

### Anomalies observees pendant la campagne

#### REC-20260812-A01 — P2 — Publication catalogue publiquement incoherente

- Parcours concerne: catalogue public, categorie Meubles et fiche produit.
- Etapes exactes de reproduction: ouvrir le sandbox; parcourir la galerie ou la categorie Meubles; reperer la publication au titre `"fr`; ouvrir sa fiche si proposee.
- Attendu: chaque publication publique possede un titre lisible, une photographie de meuble ou objet correspondant, une categorie et des caracteristiques coherentes.
- Observe: titre `"fr`, image de fleur violette, matiere « Inconnue », prix 23 EUR et classement Meubles/LES TABLES; identifiant `product-fd16e545-6f2c-42bd-94e5-1200a02853ce` releve visuellement dans l'administration.
- Frequence: 1 publication incoherente observee pendant le parcours catalogue de cette campagne.
- Impact client ou administrateur: perte de confiance et risque d'achat d'une fiche non qualifiee; pollution du catalogue public.
- Correction recommandee, sans implementation: auditer la publication via l'administration, l'archiver si elle n'est pas legitime et renforcer les validations de titre/image/categorie avant diffusion.
- Verifications apres correction: absence de la fiche dans galerie, categorie, recherche et URL publique; impossibilite de republier des donnees equivalentes sans validation explicite.

#### REC-20260812-A02 — P2 — Description dupliquee dans l'aperçu de creation

- Parcours concerne: administration, Publication > Creer, etape Informations.
- Etapes exactes de reproduction: creer une annonce; saisir une seule fois un paragraphe dans Description; observer l'aperçu a droite; remplacer integralement le texte et observer de nouveau.
- Attendu: l'aperçu affiche exactement une occurrence du contenu saisi.
- Observe: le meme paragraphe apparait deux fois dans l'aperçu alors que l'editeur ne contient visuellement qu'une seule occurrence; le remplacement integral n'elimine pas la duplication de l'aperçu.
- Frequence: 2/2 observations au cours de la meme saisie.
- Impact client ou administrateur: risque de publier une fiche avec contenu duplique ou de faire corriger inutilement le texte par l'administratrice; confiance reduite dans l'aperçu.
- Correction recommandee, sans implementation: verifier la source de rendu de l'aperçu et supprimer la double projection du champ riche sans modifier la valeur sauvegardee.
- Verifications apres correction: texte simple et multiligne affiche une seule fois dans l'aperçu, puis controle identique sur la fiche publique apres publication.

#### REC-20260812-A03 — P1 — Publication admin bloquee par une erreur reseau d'authentification

- Parcours concerne: administration, creation et publication d'un meuble.
- Etapes exactes de reproduction: se connecter par Google avec `loa.gto15@gmail.com`; ouvrir `/admin`; remplir tous les champs d'une annonce valide; televerser une image; avancer jusqu'a Diffusion; cliquer une seule fois sur « Publier sur le site ».
- Attendu: verification forte acceptee, photo enregistree, meuble cree et catalogue public mis a jour, avec confirmation durable.
- Observe: le dialogue de progression s'interrompt avec `Firebase: Error (auth/network-request-failed)`; retour au formulaire; aucune annonce ni brouillon durable, compteur catalogue inchange a 33 et recherche exacte a 0 resultat.
- Frequence: 1 echec sur 2 tentatives; la seconde tentative controlee a reussi sans doublon apres verification d'absence durable.
- Impact client ou administrateur: blocage complet de la creation d'annonce et, par dependance, impossibilite d'acheter le meuble de campagne.
- Correction recommandee, sans implementation: diagnostiquer la phase de verification Firebase dans le contexte OAuth Google, conserver le brouillon local en cas d'echec et presenter une reprise sure distinguant reseau, session expiree et assurance insuffisante.
- Verifications apres correction: publication unique sans doublon, presence admin puis publique, rafraichissement persistant, et absence de creation fantome apres erreur ou nouvelle tentative.

#### REC-20260812-A04 — P0 — Paiement confirme mais commande absente de l'espace client

- Parcours concerne: achat simple, Stripe test, page de succes et espace client.
- Etapes exactes de reproduction: avec `pvml7008@gmail.com`, ajouter uniquement `product-110a2407-4dda-4187-8c88-545da3da7709`; choisir retrait; renseigner les champs requis et accepter les conditions; payer une seule fois 180 EUR en Stripe test; depuis le succes cliquer « Voir ma commande »; attendre puis rafraichir.
- Attendu: apres confirmation durable, la commande et ses documents apparaissent immediatement ou apres un etat de synchronisation explicite et borne.
- Observe: succes explicite « Commande confirmée », « Paiement Confirmé », « Commande Bien enregistrée », « Suivi Disponible dans votre espace », reference courte `692D22B6`; l'espace `pvml7008@gmail.com` affiche ensuite 0 commande, 0 document et « Aucune commande », encore apres plus de 30 secondes et rafraichissement.
- Frequence: 2/2 commandes de la campagne, apres attente, rafraichissement et reconnexion.
- Impact client ou administrateur: critique; le client peut etre debite sans preuve de commande, document ni moyen de suivi, et un rejeu risquerait un double paiement. Les deux paiements ont ete rapproches cote administration et e-mails avant de poursuivre; l'ambiguite financiere est levee mais la projection client reste defectueuse.
- Correction recommandee, sans implementation: garantir l'atomicite logique entre confirmation durable et projection client, ou afficher un etat de synchronisation recuperable; instrumenter et alerter les webhooks/projections; ne jamais promettre une disponibilite immediate avant lecture effective de la commande.
- Verifications apres correction: chaque paiement simple ou groupe produit une seule commande visible apres succes, attente, rafraichissement et reconnexion; lignes, images, quantites, montants, mode, chronologie et documents exacts; rapprochement admin/client/Stripe/e-mails; webhook retarde ou rejoue sans doublon.

#### REC-20260812-A05 — P1 — Confirmation client livree dans le dossier spam

- Parcours concerne: e-mail transactionnel client apres paiement.
- Etapes exactes de reproduction: payer la commande simple en Stripe test avec `pvml7008@gmail.com`; ouvrir la boite exacte; rechercher la reference `CMD-ORD_692D22` dans Tous les messages puis SPAM.
- Attendu: la confirmation de commande arrive dans la boite de reception principale avec une presentation et des informations correctes.
- Observe: le message est bien recu, complet et visuellement coherent, mais classe dans SPAM; la notification administrateur correspondante arrive dans l'inbox admin.
- Frequence: 10/10 messages client de la campagne classes SPAM: deux confirmations, cinq transitions et trois remboursements. Les notifications administrateur correspondantes controlees restent en inbox.
- Impact client ou administrateur: le client peut croire que sa commande n'existe pas, impact aggrave ici par l'absence simultanee de la commande dans son espace.
- Correction recommandee, sans implementation: auditer la delivrabilite du canal Gmail sandbox, l'alignement d'expediteur et la reputation; conserver un message transactionnel concis et une aide visible invitant a verifier les indésirables en cas de retard.
- Verifications apres correction: confirmations simple et groupee, transitions et remboursements recus sans spam, sans doublon, avec references, lignes, totaux, modes et liens exacts; revalidation distincte avec Resend et DNS de production.

#### REC-20260812-A06 — P1 — Transitions de livraison et retrait incompatibles proposees dans l'administration

- Parcours concerne: administration des commandes, progression de preparation, livraison et retrait.
- Etapes exactes de reproduction: ouvrir une commande livraison payee; la mettre en preparation; observer les actions; ouvrir une commande retrait payee puis en preparation; observer les actions.
- Attendu: seules les transitions compatibles avec le mode de remise sont proposees et autorisees.
- Observe: la commande livraison propose « Prête au retrait » et la commande retrait propose « Confirmer l'expédition », en plus de leur action correcte. Les actions incompatibles n'ont pas ete declenchees pendant la campagne.
- Frequence: observe sur les deux commandes et a plusieurs etats paye/preparation.
- Impact client ou administrateur: risque important de placer une commande dans un etat incoherent, d'envoyer un mauvais e-mail et de rendre la prochaine action incomprehensible.
- Correction recommandee, sans implementation: filtrer les transitions par mode de remise dans l'interface et les refuser egalement cote serveur; afficher le parcours attendu avant confirmation.
- Verifications apres correction: matrice complete livraison/retrait a chaque etat; absence des actions croisees; tentative directe refusee cote serveur; chronologie et e-mails uniquement compatibles.

#### REC-20260812-A07 — P1 — Archivage d'une publication sans resultat durable

- Parcours concerne: administration, Publication > Publications, nettoyage d'une annonce au stock 0.
- Etapes exactes de reproduction: rechercher « Chevet en chêne miel aux poignées laiton »; constater le statut PUBLIC et le stock 0; cliquer sur l'icone Archiver; accepter la confirmation native; attendre; controler la liste admin et la recherche publique.
- Attendu: une confirmation durable indique l'archivage; la publication quitte la liste publique et ne peut plus etre ouverte ou achetee.
- Observe: la confirmation native est bien ouverte et acceptee, mais l'operation ne fournit pas de confirmation durable; apres attente et controle depuis une seconde vue, la publication reste PUBLIC, compte toujours parmi les 34 publiees et demeure visible en recherche. Un second essai n'a ete effectue qu'apres preuve d'absence de changement et produit le meme resultat. Elle reste toutefois non achetable, stock 0 et « Déjà réservé ».
- Frequence: 2/2 tentatives controlees pendant le nettoyage final; attribution exacte entre le dialogue natif et la mutation applicative a confirmer.
- Impact client ou administrateur: l'administratrice ne peut pas terminer le cycle de gestion ni retirer proprement une fiche vendue; le catalogue conserve une annonce inutile, meme si aucun nouvel achat n'est possible.
- Correction recommandee, sans implementation: remplacer ou entourer la confirmation native par une modale applicative accessible avec etat de chargement, retour d'erreur et reprise sure; rendre l'operation idempotente et afficher le statut durable obtenu.
- Verifications apres correction: archivage unique depuis une fiche stock 0, disparition de la liste publique/recherche/URL, persistance apres rafraichissement et reconnexion, absence de suppression des commandes ou medias historiques, nouvel essai sans doublon apres erreur reseau.

### Journal de correction du 2026-08-12

Les statuts ci-dessous sont intermediaires. `CORRIGEE_A_REQUALIFIER` signifie
que la correction et ses tests locaux existent, pas que l'anomalie est fermee;
la fermeture exige encore le deploiement et la recette humaine sandbox.

#### REC-20260812-A04 — `CORRIGEE_A_REQUALIFIER`

- Cause racine prouvee: `listMyOrdersV2` trouvait bien les deux commandes par
  l'UID exact du compte client, puis echouait entierement avec
  `FAILED_PRECONDITION` sur la requete
  `orders/{id}/customer_return_requests orderBy(updatedAt, desc)`. Les logs
  Functions demandent explicitement un index `COLLECTION`; le fichier et le
  projet ne portaient que l'index `COLLECTION_GROUP`. Les cinq documents
  existaient et leurs `ownerUid` correspondaient deja au client. Le `catch` de
  `MyOrdersView` transformait ensuite cette erreur 500 en tableaux vides, d'ou
  les faux compteurs zero.
- Classification: raccordement infrastructure/reader, aggrave par une erreur
  de presentation silencieuse; ni perte de commande, ni defaut webhook, ni
  incoherence d'UID.
- Correction locale: ajout de l'index descendant de portee `COLLECTION` en
  conservant les index groupe; erreurs initiale et de pagination visibles et
  rejouables, sans faux historique vide ni perte de la page deja lue.
- Fichiers: `firestore.indexes.json`,
  `src/kit/commerce/MyOrdersView.jsx`, tests Gate 5, documentation client et
  cartographie.
- Tests locaux: contrat index et etats d'erreur Gate 5 passes sous Node 22.

#### REC-20260812-A06 — `CORRIGEE_A_REQUALIFIER`

- Cause racine prouvee: `computeAllowedActions` derivait les etats financiers
  et logistiques, mais ignorait `deliverySnapshot`; les deux actions croisees
  etaient donc autorisees par le serveur et rendues fidelement par l'UI.
- Classification: incoherence metier du derive serveur des actions.
- Correction locale: matrice fail-closed fondee sur le snapshot fige:
  retrait = preparer, pret, retire; transport = preparer, expedier, livre et
  suivi. Un snapshot absent n'autorise aucun raccourci apres preparation.
- Fichiers: `functions/src/commerce/domain/allowedActions.js`, tests Gate 4,
  documentation commerce/admin et cartographie.
- Tests locaux: matrice des deux rails et refus direct des transitions
  incompatibles passes sous Node 22.

#### REC-20260812-A07 — `CORRIGEE_A_REQUALIFIER`

- Cause racine prouvee: aucune invocation `deleteProductAdmin` n'apparait dans
  les logs de la fenetre des deux essais. Le dialogue natif `window.confirm`
  interrompait le pilotage avant l'appel; le rail serveur existant etait deja
  une archive souple transactionnelle, auditee et idempotente.
- Classification: raccordement UI/commande, sans defaut du modele de retention.
- Correction locale: modale applicative accessible, etats attente/succes/erreur,
  appel attendu avant confirmation durable et `commandId` stable conserve en
  cas de reprise; aucune suppression locale optimiste.
- Fichiers: `src/kit/admin/AdminItemList.jsx`,
  `app/admin/AdminAppIsland.jsx`,
  `src/kit/commerce/adminProductCommandClient.js`, tests Gate 4,
  documentation admin/catalogue et cartographie.
- Tests locaux: contrats absence de `window.confirm`, modale applicative,
  idempotence et archive souple passes sous Node 22.

#### REC-20260812-A03 — `CORRIGEE_A_REQUALIFIER`

- Cause racine prouvee: le preflight forcait `user.getIdToken(true)` une seule
  fois; l'erreur transitoire `auth/network-request-failed` interrompait le
  parcours avant tout upload ou writer. Le formulaire restant monte explique
  la seconde tentative reussie sans doublon.
- Classification: resilience bornee de verification Auth, pas assurance faible
  ni transaction produit partielle.
- Correction locale: deux reprises reseau seulement (250 puis 750 ms), aucune
  reprise des autres erreurs Auth, formulaire/photos conserves et message final
  explicite. Le preflight reste avant upload et commande.
- Fichiers: `src/kit/admin/adminAuthorization.js`,
  `src/kit/admin/adminTokenRetry.js`, `src/kit/admin/AdminForm.jsx`,
  `tests/admin-token-retry.test.mjs`, `package.json`, tests Gate 4,
  documentation admin et cartographie.
- Tests locaux: succes apres deux erreurs, absence de retry d'un refus Auth et
  borne stricte a trois appels passes sous Node 22.

#### REC-20260812-A05 — `RESIDU_EXTERNE_A_REQUALIFIER`

- Cause racine prouvee dans le perimetre applicatif: les messages utilisent le
  compte Gmail sandbox authentifie comme `From` et `Reply-To`; les controles
  MIME de la campagne precedente rapportaient SPF, DKIM et DMARC passes. Les
  contenus, references et deduplications etaient exacts, tandis que Gmail
  classait 10/10 messages client en spam mais les notifications admin en inbox.
- Classification: delivrabilite/reputation du canal Gmail sandbox, externe au
  code metier; aucune correction de template ne peut garantir la boite
  principale. Resend et le DNS final restent volontairement differes et
  interdits par ce perimetre.
- Correction locale: aucune mutation speculative du contenu, de l'expediteur
  ou du provider. La requalification doit relire les en-tetes des nouveaux
  messages et noter le classement reel; le residu externe sera conserve si
  Gmail sandbox continue de les filtrer.
- Fichiers: documentation/registre uniquement.
- Tests locaux: contrat adaptateur e-mail inclus dans `test:auth` a executer
  avant deploiement; preuve fonctionnelle requise dans Gmail apres les deux
  commandes autorisees.

#### REC-20260812-A02 — `CORRIGEE_A_REQUALIFIER`

- Cause racine prouvee: les branches Ecrire et Apercu de `StoryEditor` etaient
  deux `div` conditionnels sans identite. React reutilisait le DOM
  `contentEditable` non controle, conservait son `innerHTML`, puis montait
  `RichTextStory` dans le meme noeud: une seule valeur sauvegardee, deux rendus
  visuels.
- Classification: reconciliation DOM React dans l'apercu, sans duplication de
  donnee catalogue.
- Correction locale: cles distinctes pour forcer deux identites de branche.
- Fichiers: `src/kit/admin/components/StoryEditor.jsx`, tests Gate 4,
  documentation admin.
- Tests locaux: contrat des deux identites de branche passe sous Node 22;
  controle visuel simple et multiligne encore requis sur sandbox.

#### REC-20260812-A01 — `CORRIGEE_A_REQUALIFIER`

- Cause racine prouvee: le produit releve existe dans `furniture` avec
  `status: published`, titre `"fr`, `material` vide, stock 1 et
  `seoIndexable: false`. La validation serveur courante exigeait seulement un
  nom et une categorie non vides; le formulaire pouvait donc encore produire
  cette incoherence. La correspondance semantique d'une photo ne peut pas etre
  prouvee automatiquement dans le rail actuel.
- Classification: invariant de qualite de publication incomplet et donnee
  sandbox a nettoyer, pas lecteur catalogue legacy.
- Correction locale: titre public d'au moins quatre caracteres et trois
  lettres/chiffres, materiau obligatoire, verifies avant upload puis de nouveau
  par la commande serveur. La fiche incoherente doit etre archivee via le rail
  durable corrige pendant la requalification.
- Fichiers: `src/kit/admin/AdminForm.jsx`,
  `functions/src/commerce/domain/productCommands.js`, tests Gate 4,
  documentation catalogue.
- Tests locaux: refus serveur du titre `"fr` et du materiau vide, publication
  complete valide, passes sous Node 22.

### Synthese de cloture de la campagne `REC-20260812-C1`

- Verdict sandbox: **NON VALIDABLE pour une future mise en production en l'etat**. Le noyau paiement/remboursement et le back-office sont fonctionnels sur les deux commandes testees, mais le P0 `REC-20260812-A04` prive la cliente de tout historique, document et suivi malgre des paiements durables.
- Niveau de confiance: **eleve** pour les parcours executes, fondé uniquement sur les observations de cette campagne dans Chrome, les deux espaces du sandbox, Stripe test projete par l'administration et les deux boites Gmail autorisees.
- Comptes utilises: `loa.gto15@gmail.com` uniquement pour l'administration et sa boite Gmail; `pvml7008@gmail.com` uniquement pour le parcours client et sa boite Gmail. Les comptes personnels visibles n'ont pas ete utilises.
- Annonce: `Chevet en chêne miel aux poignées laiton`, `product-110a2407-4dda-4187-8c88-545da3da7709`, 180 EUR. Creee et publiee manuellement; achetee; stock final 0; remboursement sans restock; archivage bloque; fiche encore publique mais non achetable.
- Commande simple: `CMD-ORD_692D22`, 180 EUR, retrait atelier; payee, preparee, prete au retrait, retiree, puis remboursee totalement en Stripe test.
- Commande groupee: `CMD-ORD_C00403`, 2 499 EUR dont 49 EUR de livraison; deux lignes a 1 150 et 1 300 EUR; payee, preparee et expediee; remboursement partiel durable de 1 150 EUR puis remboursement durable du solde exact de 1 349 EUR.
- Stripe test: deux paiements confirmes et trois operations de remboursement `succeeded`; aucun double clic, rejeu, paiement en attente ou etat financier ambigu.
- Client: authentification et panier simple/groupe fonctionnels; separation des permissions correcte; historique final 0 commande, 0 document, 0,00 EUR rembourse malgre toutes les operations.
- Administration: acces fort, creation et publication, projection des deux commandes, transitions choisies, chronologies et remboursements persistants. Publication initialement intermittente, transitions croisees dangereuses et archivage non abouti.
- E-mails: dix messages transactionnels client presents avec references, lignes, montants et modes coherents, mais tous dans SPAM. Les notifications administrateur controlees sont en inbox, completes et coherentes.
- Stock: chevet et deux Armoires restent reserves/non achetables apres remboursement; aucune remise en vente silencieuse.
- UX: public desktop et largeur mobile 390 px globalement lisibles et fluides; chargements admin de 15 a 20 s mais visibles; apercu de description duplique; libelles de transition incompatibles; nettoyage par confirmation native non concluant.
- Anomalies de campagne: P0 = 1 (`A04`); P1 = 4 (`A03`, `A05`, `A06`, `A07`); P2 = 2 (`A01`, `A02`); P3 = 0.
- Scenarios bloques ou non executes: projection client et documents bloques par `A04`; archivage bloque par `A07`; confirmation finale de livraison non executee avant le remboursement total de la commande groupee et devenue indisponible ensuite. Aucun troisieme achat n'a ete cree.
- Residus: annonce de campagne publique mais stock 0/non achetable; commandes, remboursements et e-mails conserves comme preuves; aucune session du site active, aucun panier ni paiement en attente.
- Ordre recommande des corrections: 1. `A04` projection client/documents; 2. `A06` garde des transitions; 3. `A07` archivage durable; 4. `A03` reprise sure de publication; 5. `A05` delivrabilite; 6. `A02` apercu; 7. `A01` qualite catalogue.
- Requalification apres correction: deux nouvelles commandes au maximum couvrant retrait et livraison, projection client apres reconnexion, documents paiement/remboursement, transitions strictement bornees, remboursement partiel avec solde, absence de restock, archivage et delivrabilite inbox.
- Transposable avec prudence: logique de panier, checkout, paiement Stripe test, projection admin, chronologies, e-mails rendus et remboursements ont fourni des preuves sandbox reelles; elles ne valident aucune configuration live.
- Revalidation production obligatoire et distincte: domaine final, cles Stripe live, webhooks live et idempotence, Resend avec SPF/DKIM/DMARC et DNS, App Check production, sauvegardes/alertes/SLO, et validation juridique des CGV, retours, factures et conservation des donnees.

## Cloture des corrections et requalification sandbox du 2026-08-12

Cette section remplace les statuts intermediaires `CORRIGEE_A_REQUALIFIER`
ci-dessus. La cible verifiee avant chaque ecriture cloud etait exclusivement le
projet Firebase `secondevienextjsssr`, le backend App Hosting
`secondevie-next-sandbox` et Stripe test. Deux nouvelles commandes exactement
ont ete creees: `CMD-ORD_1E485D` (retrait, 25 EUR) et `CMD-ORD_AC4D1F`
(deux lignes, livraison Marseille, 304 EUR).

### REC-20260812-A04 — `FERMEE`

- Cause racine prouvee et classification: index Firestore `COLLECTION`
  descendant manquant pour `customer_return_requests.updatedAt`, puis erreur
  transformee par l'UI en faux historique vide; raccordement
  infrastructure/reader, sans perte de commandes, documents ou UID.
- Correction: index de collection ajoute sans retirer le `COLLECTION_GROUP`;
  l'espace client affiche maintenant l'erreur initiale ou de pagination et
  permet la reprise sans effacer les donnees deja lues.
- Fichiers: `firestore.indexes.json`, `src/kit/commerce/MyOrdersView.jsx`,
  `tests/commerce/domain/gate5-consumers.test.cjs`, `_DOCS/client/ESPACE_CLIENT.md`,
  `_DOCS/quality/QUALITE_TESTS.md`, `map.md`.
- Tests: Gate 5 ciblee, `test:commerce:unit`, `test:auth`, lint et build passes;
  index deploye sur le sandbox.
- Requalification: reconnexion de `pvml7008@gmail.com`, 15 commandes et
  24 documents visibles; `CMD-ORD_1E485D` expose un recu et une confirmation
  de remboursement, `CMD-ORD_AC4D1F` un recu et deux confirmations. Le PDF du
  recu de 304 EUR s'ouvre et sa copie e-mail avec piece jointe est arrivee.
  Le reconciliateur documentaire horaire, declenche de facon bornee pour ne
  pas attendre son prochain passage, a produit les cinq documents attendus.
- Residu externe: aucun pour la projection; le classement Gmail du message de
  copie releve de `A05`.

### REC-20260812-A06 — `FERMEE`

- Cause racine prouvee et classification: `computeAllowedActions` ignorait le
  `deliverySnapshot`; incoherence metier du derive serveur.
- Correction: matrice fail-closed figee par mode de remise, avec aucun
  raccourci autorise lorsqu'un snapshot est absent.
- Fichiers: `functions/src/commerce/domain/allowedActions.js`,
  `tests/commerce/domain/gate4-commands-returns.test.cjs`,
  `_DOCS/commerce/COMMERCE_STRIPE.md`, `_DOCS/admin/BACKOFFICE.md`, `map.md`.
- Tests: matrice unitaire retrait/livraison, refus des transitions croisees,
  Gate 4 et `test:commerce:unit` passes; callables cibles deployes.
- Requalification: `CMD-ORD_1E485D` a suivi uniquement Payee -> En preparation
  -> Prete au retrait -> Retiree; `CMD-ORD_AC4D1F` uniquement Payee -> En
  preparation -> Expediee sans suivi -> Livree. Aucune action incompatible
  n'a ete proposee. Les chronologies et e-mails correspondants ont ete emis.
- Residu externe: aucun.

### REC-20260812-A07 — `FERMEE`

- Cause racine prouvee et classification: la confirmation native interrompait
  le pilotage avant `deleteProductAdmin`; raccordement UI/commande, le modele
  serveur d'archive souple etant sain.
- Correction: `alertdialog` applicatif accessible, attente/succes/erreur
  visibles et `commandId` stable pour une reprise idempotente.
- Fichiers: `src/kit/admin/AdminItemList.jsx`,
  `app/admin/AdminAppIsland.jsx`,
  `src/kit/commerce/adminProductCommandClient.js`, tests Gate 4,
  `_DOCS/admin/BACKOFFICE.md`, `_DOCS/catalogue/ANNONCES_CATALOGUE.md`, `map.md`.
- Tests: contrats de modale, absence de `window.confirm`, archive souple et
  idempotence passes; App Hosting sandbox deploye.
- Requalification: trois archives ont abouti une seule fois via la modale,
  dont l'annonce initiale `product-110a2407-4dda-4187-8c88-545da3da7709` et le
  produit final de recette. Rechargement admin: 32 publications et objets
  absents. Firestore conserve les trois sources en `status: archived` avec
  `archivedAt`; le snapshot public n'en contient aucune.
- Residu externe: aucun.

### REC-20260812-A03 — `FERMEE`

- Cause racine prouvee et classification: `getIdToken(true)` sans reprise sur
  `auth/network-request-failed`; resilience bornee Auth, sans ecriture
  produit partielle.
- Correction: deux reprises reseau seulement (250/750 ms), aucun retry des
  refus Auth, preflight toujours place avant upload/commande et formulaire
  conserve.
- Fichiers: `src/kit/admin/adminAuthorization.js`,
  `src/kit/admin/adminTokenRetry.js`, `src/kit/admin/AdminForm.jsx`,
  `tests/admin-token-retry.test.mjs`, `package.json`,
  `_DOCS/admin/BACKOFFICE.md`, `_DOCS/quality/QUALITE_TESTS.md`, `map.md`.
- Tests: injection de deux erreurs reseau puis succes, refus Auth non rejoue,
  borne a trois appels, `test:auth`, lint et build passes.
- Requalification: publication unique de
  `product-39905b9c-f3de-429b-87cd-baf5d9e74f3f`; un seul produit cree, quatre
  etapes terminees, projection admin et publique exacte, aucune perte de
  formulaire ni duplication. L'archive finale a ensuite reussi.
- Residu externe: aucun; la panne reseau est couverte par injection
  deterministe, le parcours nominal complet par Chrome sandbox.

### REC-20260812-A05 — `RESIDU_EXTERNE_CONFIRME`

- Cause racine prouvee et classification: reputation du compte Gmail sandbox.
  Le message de confirmation groupee porte `From`, `Return-Path` et `Reply-To`
  Gmail alignes; Gmail rapporte DKIM=pass, SPF=pass et DMARC=pass. Les contenus
  et deduplications sont exacts. Ce n'est ni une faute de template, ni un
  defaut d'authentification SMTP corrigeable dans le rail courant.
- Correction: aucune mutation speculative du contenu ou du provider; le canal
  Gmail sandbox et ses invariants ont ete conserves. Resend et le domaine final
  restent differes jusqu'au chantier production explicitement autorise.
- Fichiers: registre et documentation e-mail existante uniquement; aucun code
  applicatif modifie pour masquer le signal externe.
- Tests: contrat adaptateur dans `test:auth`; lecture Gmail des nouveaux
  messages et d'un en-tete complet.
- Requalification: 11 messages client de paiement, transitions et
  remboursements plus la copie PDF ont tous ete emis avec les bonnes
  references et montants, mais les 12 sont classes `SPAM`. La copie PDF de
  `CMD-ORD_AC4D1F` est bien jointe.
- Residu externe: filtre/reputation Gmail sandbox. La fermeture fonctionnelle
  de l'emission est acquise; l'obtention de l'inbox requiert le futur domaine
  et Resend avec SPF/DKIM/DMARC, hors perimetre et interdits ici.

### REC-20260812-A02 — `FERMEE`

- Cause racine prouvee et classification: reutilisation par React du meme DOM
  `contentEditable` entre Ecrire et Apercu; reconciliation UI sans duplication
  de donnee.
- Correction: identites React distinctes pour les deux branches.
- Fichiers: `src/kit/admin/components/StoryEditor.jsx`, tests Gate 4,
  `_DOCS/admin/BACKOFFICE.md`.
- Tests: contrat des cles de branche, lint et build passes.
- Requalification: l'histoire multiligne du chevet de recette apparait une
  seule fois dans l'apercu avant publication et une seule fois sur la fiche
  publique.
- Residu externe: aucun.

### REC-20260812-A01 — `FERMEE`

- Cause racine prouvee et classification: invariant de publication trop faible
  (titre et categorie seulement), donnees incoherentes acceptees; puis
  raccordement de preuve HTML qui exigeait a tort HTTP 200 sur l'ancien chemin
  d'un produit archive, pourtant attendu en 404. Aucun lecteur legacy.
- Correction: titre public lisible d'au moins quatre caracteres et trois
  lettres/chiffres, materiau obligatoire, controles UI et serveur; le
  verificateur catalogue exige 200+hash sur les chemins courants et 404 sur
  l'ancien chemin archive ou renomme.
- Fichiers: `src/kit/admin/AdminForm.jsx`,
  `functions/src/commerce/domain/productCommands.js`,
  `functions/src/catalog/catalogRevalidation.js`,
  `tests/commerce/domain/gate4-commands-returns.test.cjs`,
  `tests/catalog/security.test.cjs`, `_DOCS/catalogue/ANNONCES_CATALOGUE.md`,
  `map.md`.
- Tests: refus du titre `"fr` et du materiau vide, publication valide,
  non-regression 404 d'archivage, 12/12 tests securite catalogue et 14/14
  tests coeur catalogue passes.
- Requalification: la mauvaise fiche
  `product-fd16e545-6f2c-42bd-94e5-1200a02853ce` est archivee et repond 404;
  le produit valide a ete publie puis archive. Snapshot public revision 286,
  32 produits, aucune des trois archives; controle catalogue final
  `buildState: published`, `servedState: observed`, `integrityState: valid`,
  `sourceLagState: current`, `lastError: null`.
- Residu externe: aucun.

### Verdict final de la reprise

- Campagne: `FERMEE_AVEC_RESIDU_EXTERNE_A05`.
- Stripe test: deux paiements, trois remboursements (130, 174 et 25 EUR),
  aucun paiement ambigu; total rembourse client passe de 3 669 a 3 998 EUR.
- Stock: les trois lignes achetees restent a 0 apres remboursement; aucune
  remise en vente automatique.
- Cloud: index Firestore, callables cibles, App Hosting sandbox et dispatcher
  de revalidation catalogue cibles deployes; production et Stripe live non
  touches.
- Git: aucun commit, push ou merge.

## Nouvelle recette fonctionnelle humaine objective du 2026-08-12

Identifiant de campagne: `REC-20260812-C2`

Debut: 2026-08-12 19:31 Europe/Paris.

Perimetre: URL App Hosting sandbox exacte, projet Firebase
`secondevienextjsssr`, comptes `loa.gto15@gmail.com` et
`pvml7008@gmail.com`, Stripe test exclusivement. Cette campagne repart de
zero: aucun resultat historique ci-dessus n'est repris comme preuve.

Methode: parcours exclusivement humain dans Chrome externe. Aucun script,
Playwright, requete API, fixture, seed, correction de code, changement cloud,
deploiement, commit ou push. Seul ce registre peut etre complete.

### Journal progressif `REC-20260812-C2`

| Heure Europe/Paris | Scenario | Statut | Compte | Etapes effectuees et resultat observe | Attendu | Friction/anomalie et preuve non sensible | Etat final des donnees |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08-12 19:31 | Initialisation de la campagne | RÉUSSI | Aucun | Cible, comptes autorises, limites Stripe test et regle des deux commandes confirmes avant toute navigation. | Demarrer sans reutiliser d'ancienne preuve et sans mutation hors interface. | Aucune. | Aucune donnee creee; aucune session fonctionnelle ouverte par la campagne. |
| 2026-08-12 19:32 | Controle public desktop | RÉUSSI | Visiteur deconnecte | Ouverture de l'URL exacte; controle de l'accueil, du menu, d'une categorie Commodes, d'une fiche reservee, de la recherche `armoire`, du panier vide, de la page A propos et du devis; retour navigateur verifie. | Les principales pages, liens, modales et retours chargent sans erreur ni blocage visible. | Le pilotage a selectionne une categorie lors d'un premier clic devenu obsolete apres fermeture du menu; friction de l'outil de recette, sans anomalie du site. Les pages observees sont ensuite toutes exploitables. | Aucune donnee metier creee; visiteur deconnecte et panier vide. |
| 2026-08-12 19:35 | Controle mobile manuel | RÉUSSI | Visiteur deconnecte | Largeur Chrome ramenee a 390 px sur le devis; header, CTA, formulaire et menu mobile ouverts; recherche et collections accessibles; retour desktop prevu avant connexion. | Navigation, menu, lisibilite et boutons restent utilisables en largeur mobile. | Aucun blocage ni contenu incoherent visible. | Aucune donnee creee. Trois meubles disponibles reperes visuellement pour la commande groupee: `Armoir` 1 250 EUR, `Buffet art deco` 990 EUR et `Buffet` 750 EUR. |
| 2026-08-12 19:38 | Connexion et habilitations administrateur | RÉUSSI | `loa.gto15@gmail.com` | Connexion Google via le selecteur de compte exact; acces a `/admin`; controle visuel des onglets principaux du back-office. | Le compte administrateur accede au back-office avec ses fonctions et le compte client n'en herite pas. | Aucune anomalie d'authentification observee. | Session administrateur ensuite fermee avant le parcours client. |
| 2026-08-12 19:40 | Creation et publication d'un produit simple | RÉUSSI | `loa.gto15@gmail.com` | Validation du refus d'un formulaire vide; creation de `Commode basse en châtaignier patiné`, 65 EUR, stock 1, materiau Chataignier, dimensions 82 x 38 x 71, histoire en deux paragraphes et une image locale non sensible; apercu controle; publication Site declenchee une seule fois. La progression se termine par le succes durable. | Une fiche valide est publiee une fois, sans doublon de description, puis visible dans l'administration et le catalogue public. | Aucune erreur Auth/reseau sur ce parcours nominal; le scenario de reprise sur panne n'est pas couvert par cette campagne humaine. L'histoire apparait une seule fois dans l'apercu. | Produit `product-0b66ff63-3d88-4e1d-982a-26bad0ee7325`, PUBLIC, stock 1. |
| 2026-08-12 19:41 | Visibilite catalogue du produit cree | RÉUSSI | Visiteur | Recherche du titre exact: un resultat unique, image, prix 65 EUR et disponibilite correcte; ouverture de la fiche publique; titre, histoire unique, materiau, dimensions et ajout au panier presents. | La publication admin est raccordee au catalogue public et la fiche est achetable. | Aucune incoherence catalogue visible. | Produit public et ajoutable au panier. |
| 2026-08-12 19:42 | Separation des roles client/admin | RÉUSSI | `pvml7008@gmail.com` | Deconnexion admin puis connexion Google avec le compte client exact; profil `ml pv` et adresse e-mail exacts; aucun lien Admin dans le menu; acces direct a `/admin` refuse explicitement. | Un client sans droits ne voit ni n'ouvre le back-office. | Aucune. | Session client active. Baseline avant commande: 15 commandes, 24 documents, 3 998 EUR rembourses. |
| 2026-08-12 19:44 | Panier et checkout commande simple | RÉUSSI JUSQU'AU PAIEMENT | `pvml7008@gmail.com` | Une ligne unique du produit cree, image et prix 65 EUR; retrait atelier gratuit; coordonnees client; CGV acceptees; resume a 65 EUR. Stripe affiche explicitement le mode test; le formulaire carte test est renseigne et la declaration d'action pour autrui cochee. | Une commande simple de 65 EUR doit pouvoir etre payee une seule fois puis apparaitre durablement dans l'espace client. | Une duplication temporaire de l'e-mail a ete provoquee par la saisie de l'outil sur un champ pre-rempli, puis corrigee visuellement avant le checkout; friction de recette, pas anomalie du site. | Reference de checkout visible `8270420A`; aucun clic de paiement confirme avant l'interruption de la recette. |
| 2026-08-12 19:47 | Reprise apres interruption du checkout simple | REPRISE ATTENDUE | `pvml7008@gmail.com` | Juste apres la coupure, le panier conservait la ligne a 65 EUR et `/checkout` proposait de retrouver le paiement. La projection client a ensuite affiche `CMD-ORD_827042` avec un libelle visuel ambigu `Preparee`, alors que la lecture serveur autoritaire a prouve `status=pending_payment`, `payment.status=awaiting_method`, capture 0 et stock reserve. | Une interruption avant validation Stripe doit conserver une unique commande en attente et permettre de reprendre exactement son PaymentIntent. | La commande n'etait pas payee: la reprise du paiement de 65 EUR etait correcte. La projection client ne suffisait pas a conclure a un paiement durable. | Une commande en attente unique; aucun debit, aucune duplication. |
| 2026-08-12 19:54 | Nouvelle tentative de paiement demandee apres coupure | DIAGNOSTIC RECTIFIE | `pvml7008@gmail.com` | La tentative a d'abord ete suspendue par prudence a cause du libelle client `Preparee`. L'inspection serveur bornee a ensuite etabli que le paiement avait bien ete interrompu avant confirmation. | Decider la reprise sur l'etat commerce autoritaire, pas sur un libelle de projection. | La coupure expliquait bien l'absence de paiement; la commande devait etre reprise, pas consideree payee. | Commande toujours `pending_payment`, capture 0. |
| 2026-08-12 19:56 | Preparation commande groupee | RÉUSSI JUSQU'AU CHECKOUT | `pvml7008@gmail.com` | Le panier residuel contenait encore la commode deja commandee; elle a ete retiree. Ajout de `Armoir` 1 250 EUR et `Buffet art deco` 990 EUR. Retrait puis re-ajout de l'armoire verifies sans perte du buffet. Sous-total final correct: 2 240 EUR. | Deux lignes distinctes, images/prix exacts et manipulations de panier independantes. | La ligne deja payee restant dans le panier constitue un defaut de nettoyage, recupere humainement avant toute commande. | Panier groupe final: armoire + buffet uniquement, sous-total 2 240 EUR. |
| 2026-08-12 19:57 | Checkout groupe apres paiement simple | BLOQUÉ — P0 | `pvml7008@gmail.com` | Le recapitulatif affiche les deux lignes a 1 250 et 990 EUR, mais `TOTAL A PAYER 65 EUR` et `REPRENDRE LE PAIEMENT SECURISE`. L'ouverture retourne au Payment Element test de la reference courte `8270420A`, bouton `Payer 65 EUR`. Deconnexion, reconnexion Google exacte et retour au recapitulatif reproduisent l'incoherence. Aucun clic de paiement n'est effectue. | Le checkout doit creer/reprendre une commande correspondant exactement au panier courant, soit 2 240 EUR plus le mode de livraison choisi; une commande deja durable ne doit plus rester payable. | Nouvelle anomalie `REC-20260812-C2-A02`: session de paiement simple recyclee sur un nouveau panier. Risque de double debit de 65 EUR et de commande groupee au mauvais montant. | Une seule commande durable connue; aucune deuxieme commande/paiement cree; panier groupe conserve dans le recapitulatif mais checkout financier interdit. |
| 2026-08-12 20:47 | Requalification apres correctif et redeploiement sandbox | RÉUSSI | `pvml7008@gmail.com` | Le checkout repris affiche uniquement `Commode basse en châtaignier patiné` et 65 EUR. Paiement Stripe test soumis une seule fois; page `Commande confirmee`; espace client `CMD-ORD_827042`, une piece, 65 EUR, payee. Lecture serveur: `status=paid`, `paymentStatus=succeeded`, `capturedCents=6500`, `inventoryStatus=committed`. | La reprise doit utiliser le snapshot immutable de la commande interrompue puis confirmer durablement le paiement. | Aucune incoherence de lignes ou de montant apres deploiement. | Une seule commande payee; capture test 65 EUR; stock engage. |
| 2026-08-12 20:49 | Conservation du panier groupe apres reprise | RÉUSSI | `pvml7008@gmail.com` | Le panier contient toujours uniquement `Armoir` 1 250 EUR et `Buffet art déco` 990 EUR, sous-total 2 240 EUR. `Commander` ouvre un checkout neuf listant exactement ces deux lignes et `TOTAL A PAYER 2240 EUR`; aucun paiement groupe soumis. | Le nettoyage de la commande reprise ne doit supprimer que ses revisions achetees et doit laisser les ajouts posterieurs disponibles pour un checkout neuf. | Aucune. | Panier groupe intact; aucune deuxieme commande creee. |
| 2026-08-12 21:12 | Deuxieme et derniere commande, branche livraison | RÉUSSI | `pvml7008@gmail.com` | Checkout des deux lignes conservees, livraison Marseille 49 EUR, total 2 289 EUR. Le Payment Element test affiche `Payer 2289 EUR`; soumission unique et confirmation visible. Lecture serveur: `ord_690ae656-6693-4ef6-b5e1-fc9ef61add2f`, `paid`, capture 228 900 centimes, deux lignes et inventaire `committed`. L'espace client affiche `CMD-ORD_690AE6`, deux pieces, 2 289 EUR et 17 commandes. | La seconde commande doit etre une livraison distincte, payee une fois, projetee avec ses deux lignes et son montant exact. | Aucune anomalie de paiement ou de panier. Le recu de cette commande est encore `Document a venir` au controle immediat, tandis que le recu de la commande simple a converge et porte le compteur documents a 25. | Exactement deux nouvelles commandes pour la campagne: retrait 65 EUR et livraison 2 289 EUR. Aucune troisieme commande autorisee ni creee. |
| 2026-08-12 21:14 | Transition livraison en preparation | RÉUSSI | `loa.gto15@gmail.com` | Ventes affiche la commande groupee exacte; action unique `Mettre en preparation`, puis relecture durable `En preparation` et evenement horodate. | La branche livraison payee accepte sa transition de preparation. | Aucune. | Commande groupee en preparation. |
| 2026-08-12 21:15 | Expedition avec suivi | RÉUSSI | `loa.gto15@gmail.com` | `Confirmer l'expedition`, mode avec suivi, `Autre transporteur`, nom `Transporteur recette`, numero borne `RECETTE-REC-20260812-C2`; relecture durable `Expediee` et suivi visible. | Les donnees de suivi doivent etre exigees, conservees et projetees. | Aucune. | Commande groupee expediee. |
| 2026-08-12 21:16 | Livraison finale | RÉUSSI | `loa.gto15@gmail.com` | Confirmation explicite dans la modale, puis relecture durable `Livree`; serveur ensuite `status=completed`, capture 228 900 et stock toujours `committed`. | Une commande expediee peut devenir livree sans alterer son paiement ni son stock. | Aucune. | Commande livraison terminee, aucun remboursement. |
| 2026-08-12 21:17 | Branche retrait complete | RÉUSSI | `loa.gto15@gmail.com` | Commande simple exacte: `Payee` vers `En preparation`, puis `Prete au retrait`, puis confirmation explicite `Retiree`; chaque etat a ete relu apres convergence. | Les transitions retrait doivent etre compatibles et durables. | Aucune transition incompatible ni blocage. | Commande simple retiree avant remboursement. |
| 2026-08-12 21:19 | Remboursement Stripe test complet | RÉUSSI | `loa.gto15@gmail.com` | Retours, dossier manuel exact `ord_8270420a-4d64-4975-adc7-120c7fe296d9`, maximum 65 EUR et avertissement stock inchange; soumission unique. Serveur: `status=refunded`, `refundedCents=6500`, capture 6500, inventaire `committed`, `restockedQty=0`. | Remboursement unique, montant exact, aucune remise en stock automatique. | Aucune. | Commande simple remboursee integralement; produit non restocke. |
| 2026-08-12 21:21 | E-mails commande, transitions et remboursement | PARTIELLEMENT RÉUSSI — RESIDU SPAM | client et administrateur | Boite client: confirmations payees des deux commandes, preparation des deux branches, pret au retrait, retrait, expedition, livraison et remboursement 65 EUR recus avec references/montants exacts; tous portent le libelle Gmail `SPAM`. Boite admin directe: notifications de nouvelle commande et confirmation de remboursement presentes dans la boite de reception; l'e-mail admin precise l'absence de remise en stock automatique. | Les messages M03 a M11 doivent etre recus avec le bon destinataire et le bon contenu; les messages client ne doivent pas etre classes spam. | Transport fonctionnel et contenu coherent, mais recurrence de l'anomalie externe de delivrabilite Gmail sandbox: tous les messages client controles sont en spam. | M03-M11 prouves sur les deux commandes; M01/M02 et M12/M13 restent hors de cette continuation. |
| 2026-08-12 21:23 | Connexion client par code e-mail et M01 | RÉUSSI AVEC RESIDU SPAM | `pvml7008@gmail.com` | Deconnexion puis demande d'un code de connexion au compte client exact; reception du message `Votre code de connexion · Seconde Vie`, saisie du code dans Chrome et retour authentifie dans `/mes-commandes`. | Le code doit etre recu par le bon compte et ouvrir une session client, sans droit admin. | Le message M01 est fonctionnel mais porte lui aussi le libelle Gmail `SPAM`. Aucun code, token ou secret n'est conserve dans ce registre. | Session client active; compte toujours sans acces administrateur. M02 non execute car le client etait deja authentifie pendant les deux checkouts et la limite de deux commandes est atteinte. |
| 2026-08-12 21:24 | Archivage durable du produit de recette | RÉUSSI | `loa.gto15@gmail.com`, puis visiteur | Dans Publication, action unique `Archiver durablement` sur `Commode basse en châtaignier patiné`; apres rechargement, le produit est absent des publications actives. Recherche publique du titre exact: zero resultat. | Une archive doit survivre au rechargement et disparaitre du catalogue public. | Aucune. | Produit `product-0b66ff63-3d88-4e1d-982a-26bad0ee7325` archive durablement et non public; stock non restaure par le remboursement precedent. |
| 2026-08-12 21:27 | Projection finale espace client, adresses et documents | PARTIELLEMENT RÉUSSI — ANOMALIE DOCUMENTAIRE | `pvml7008@gmail.com` | Reconnexion puis rechargement: 17 commandes; `CMD-ORD_690AE6` livree avec deux pieces, 2 289 EUR, transporteur et suivi exacts; `CMD-ORD_827042` remboursee 65 EUR avec delai bancaire explicite. Adresse de livraison/facturation Marseille et profil (nom, e-mail, telephone) repris depuis la derniere commande. Compteur documents reste a 25. | Les deux commandes et tous leurs documents de paiement/remboursement doivent etre visibles et ouvrables apres convergence. | Le recu de paiement de `CMD-ORD_690AE6` reste `Document a venir`; la confirmation de remboursement de `CMD-ORD_827042` est absente de la liste, meme apres rechargement plusieurs minutes apres les operations. Le seul bouton de cette commande ouvre encore son recu de paiement. | Commandes, montants, suivi, remboursement, adresse et profil converges; deux PDF attendus non projetes. Nouvelle anomalie `REC-20260812-C2-A03`. |
| 2026-08-12 21:28 | Matrice e-mail M01-M13 | PARTIELLEMENT RÉUSSI | client et administrateur | M01, M03, M04, M05, M06, M07, M08, M09, M10 et M11 recus et controles sur les boites exactes. M04 est prouve pour les deux commandes, dont `Nouvelle commande CMD-ORD_690AE6 · 2 289,00 €` en boite admin. | Couvrir les 13 familles sans depasser les limites de donnees ou provoquer artificiellement une erreur financiere. | M02 non execute: aucun OTP checkout requis pendant les deux commandes. M12/M13 non executes: aucun remboursement asynchrone en echec, et une troisieme commande est interdite. Tous les messages client controles, y compris M01, sont classes spam. | Aucune commande supplementaire, aucun echec Stripe provoque et aucun message Gmail deplace. |
| 2026-08-12 22:20 | Deploiement borne du correctif documentaire | RÉUSSI | Sandbox uniquement | Preflight commerce relu sur `secondevienextjsssr`: `v2_all`, mutations admin v2, paiement offline desactive et operations saines. Deploiement des quatre Functions concernees en `europe-west1`, puis du seul backend App Hosting `secondevie-next-sandbox` en `europe-west4`. Rollout `build-2026-08-12-006` termine `SUCCEEDED`. | Publier le correctif uniquement sur la cible sandbox avant requalification humaine. | Un premier filtre de noms Functions trop court a ete refuse avant toute mutation; la commande corrigee avec les noms de codebase complets a reussi. | Production, Stripe live, donnees reelles, commit et push non touches. |
| 2026-08-12 22:25 | Requalification des documents manquants | RÉUSSI | `pvml7008@gmail.com` | Rechargement de `/mes-commandes`: compteur passe de 25 a 27. Le recu de paiement de `CMD-ORD_690AE6` et la confirmation de remboursement de `CMD-ORD_827042` sont presents. Chacun ouvre la modale `Votre document est prêt`, avec reference, montant exact, lien PDF blob, sauvegarde/partage et copie e-mail programmee. | Les deux documents jusque-la absents doivent etre listes et ouvrables apres deploiement, sans nouveau paiement ni remboursement. | Aucune anomalie documentaire residuelle. Les documents sandbox portent correctement la mention non fiscale. | 17 commandes et 27 documents; aucune donnee financiere supplementaire creee. |
| 2026-08-12 22:31 | M02 — code e-mail de validation checkout | RÉUSSI AVEC RESIDU SPAM | `pvml7008@gmail.com` | Deconnexion du compte, ajout temporaire d'un buffet disponible et ouverture du checkout visiteur. Une seule demande de code a ete emise vers le compte client exact; le message `Validez votre commande · Seconde Vie` a ete retrouve, puis le code saisi. Le checkout confirme `Email verifie pour cette commande.` sans creation de commande ni ouverture de paiement. | Le code checkout doit parvenir au bon destinataire et valider l'e-mail avant paiement. | Fonctionnellement reussi, mais le message est classe dans Spam, nouvelle preuve de `REC-20260812-A05`. Aucun code ou secret n'est conserve dans ce registre. | Aucune troisieme commande et aucun paiement; article temporaire a retirer du panier avant cloture. |
| 2026-08-13 00:15 | M12/M13 — remboursement asynchrone en echec | ÉCHEC METIER ATTENDU, ANOMALIE TECHNIQUE DETECTEE | admin `loa.gto15@gmail.com`, client `pvml7008@gmail.com` | Dans Retours, soumission unique du remboursement total de 120 EUR de `CMD-ORD_D98296`. Stripe test a accepte puis inverse le refund en `failed` (`expired_or_canceled_card`). Les webhooks `refund.created`, `refund.failed` et `refund.updated` sont tous marques traites. | L'echec final doit annuler la projection de remboursement, conserver le stock et emettre M12/M13 sans seconde tentative. | Le worker considerait a tort la tentative `succeeded` comme terminale et classait la transition Stripe valide `succeeded -> failed` en conflit; la commande restait faussement remboursee 120 EUR. Nouvelle anomalie `REC-20260812-C2-A04`. | Un seul refund provider et une seule tentative domaine; aucune nouvelle commande, aucun restock. |
| 2026-08-13 00:29 | Correction et reparation bornee du refund inverse | RÉUSSI | Sandbox uniquement | Le rail accepte un fait append-only `refund_reversal`, compense le rollup et la commande, conserve l'inventaire et emet les alertes client/admin. Les quatre Functions du rail refund ont ete redeployees; l'evenement deja traite a ete repris une seule fois par le worker contre le Refund Stripe autoritaire, sans nouvel appel de remboursement. | Retablir la verite financiere sans effacer l'audit ni creer une seconde operation Stripe. | Deux essais techniques de reprise de l'inbox sont traces en plus du traitement initial, mais toujours un seul document de tentative de remboursement et un seul refund Stripe. | `capturedCents=12000`, `refundedCents=0`, `netCents=12000`, commande `needs_review`, inventaire `committed`, `restockedQty=0`. |
| 2026-08-13 00:34 | Contenu M12/M13 | RÉUSSI AVEC RESIDU SPAM CLIENT | client et administrateur | M12 client `Remboursement CMD-ORD_D98296 à vérifier` contient 120 EUR, Chaise, absence de nouveau debit et aucune action requise; M13 admin `Action requise · remboursement CMD-ORD_D98296` contient montant, client, produit, ID refund, interdiction de relancer a l'aveugle et lien back-office. | Un seul message exploitable pour chaque destinataire. | M12 est classe SPAM malgre SPF/DKIM/DMARC passes; M13 arrive en boite de reception. | Outbox client et admin chacune `sent`, `attemptCount=1`; aucun message deplace. |
| 2026-08-13 00:46 | Projection client finale apres correction et redeploiement | RÉUSSI | `pvml7008@gmail.com` | Apres deploiement de `listMyOrdersV2` et du seul backend App Hosting sandbox, `CMD-ORD_D98296` affiche `À vérifier`, l'explication Stripe correcte et un seul bouton document. La liste conserve uniquement le reçu de paiement de 120 EUR; la confirmation devenue obsolete est masquee. Le reçu s'ouvre dans `Votre document est prêt` avec PDF sandbox non fiscal. | La vue client doit suivre la verite financiere finale sans supprimer la preuve serveur historique. | Aucune anomalie residuelle de projection. | 17 commandes, 27 documents visibles; aucun nouveau paiement, remboursement ou commande. |

### REC-20260812-C2-A01 — reprise de paiement apres fermeture/interruption

- Statut: `COMPORTEMENT_ATTENDU_CONFIRME`.
- Frequence: reprise stable du meme checkout interrompu avant validation.
- Preconditions: client Google connecte `pvml7008@gmail.com`, panier simple de
  65 EUR, retrait atelier, checkout Stripe test deja cree sous la reference
  visible `8270420A`, mais paiement non confirme.
- Reproduction:
  1. interrompre ou fermer l'onglet apres affichage du formulaire Stripe et
     avant le clic final;
  2. revenir dans l'espace client, ouvrir le panier conserve et cliquer
     `Commander`;
  3. observer `/checkout` sur `Nous retrouvons votre paiement`;
  4. attendre une boucle complete, rafraichir, puis restaurer l'onglet ferme.
- Attendu: restaurer le Payment Element associe a la commande existante, ou
  presenter un retour controle vers le recapitulatif permettant de reprendre
  sans duplication.
- Observe initial: la projection client a affiche la commande avec le libelle
  `Preparee`, mais la preuve serveur autoritaire etait sans ambiguite:
  `pending_payment`, `awaiting_method`, capture 0 et stock reserve. La reprise
  du meme PaymentIntent et du meme montant etait donc attendue.
- Classification finale: interruption utilisateur normale avant paiement; pas
  une anomalie commerce. Le libelle de projection initial etait insuffisant
  pour qualifier l'etat financier.
- Preuve non sensible: total 65 EUR controle avant Stripe test; reference
  courte `8270420A`; compteurs client inchanges; aucun numero de carte, secret,
  token ou identifiant Stripe conserve.
- Requalification: continuer les controles aval sur cette unique commande;
  ne jamais retenter un paiement tant que la convergence n'a pas ete controlee
  dans l'historique client.

### REC-20260812-C2-A02 — P0 — lignes du panier courant affichees sur une reprise Stripe anterieure

- Statut: `CORRIGEE_ET_REQUALIFIEE_SANDBOX`.
- Frequence: 2/2 apres constitution du panier groupe, avant puis apres une
  deconnexion/reconnexion Google du compte client.
- Preconditions: commande simple `CMD-ORD_827042` a 65 EUR en realite encore
  `pending_payment`; nouveau panier contenant `Armoir` 1 250 EUR et
  `Buffet art deco` 990 EUR.
- Reproduction:
  1. apres convergence de la commande simple, retirer sa ligne residuelle du
     panier;
  2. ajouter l'armoire et le buffet, verifier le sous-total 2 240 EUR;
  3. ouvrir le checkout;
  4. observer que les deux lignes sont listees mais que `TOTAL A PAYER` vaut
     65 EUR et que l'action propose de reprendre le paiement;
  5. ouvrir cette reprise: Stripe test affiche encore la commande courte
     `8270420A` et le bouton `Payer 65 EUR`;
  6. revenir sans payer, se deconnecter/reconnecter avec
     `pvml7008@gmail.com`: l'incoherence persiste.
- Attendu: une reprise active doit afficher les lignes et le montant du snapshot
  immutable de sa commande. Les lignes ajoutees ensuite au panier doivent etre
  conservees pour un checkout neuf apres la reprise.
- Observe: le montant financier de 65 EUR appartenait correctement a la
  commande en attente, mais l'interface lui substituait les deux lignes du
  panier courant totalisant 2 240 EUR. Deux contextes metier etaient donc
  melanges dans le meme recapitulatif.
- Impact: consentement de paiement trompeur, impossibilite de savoir quels
  produits seraient acquis et risque de nettoyage des mauvaises lignes apres
  paiement. Aucun double debit n'avait eu lieu avant la requalification.
- Recuperations tentees: retour au recapitulatif, deconnexion/reconnexion Google
  et nouvelle lecture du checkout; echec reproductible. Aucun effacement de
  stockage navigateur, appel API ou modification de code n'a ete utilise.
- Requalification requise: reconstruire toute reprise depuis le snapshot
  serveur de la commande, payer une fois la commande en attente, puis verifier
  que le panier posterieur reste intact et ouvre un checkout neuf coherent.

#### Correction locale du 2026-08-12

- Cause racine prouvee: la commande n'etait pas payee. `resumeCheckoutV2`
  rendait correctement le PaymentIntent encore actif et son `totalCents`, mais
  ne rendait pas les lignes immutables de la commande. `CheckoutView` associait
  alors ce montant autoritaire aux lignes du panier courant. Le premier
  durcissement ajoute en parallele sur les commandes reellement payees reste un
  invariant valide, mais ne constituait pas le declencheur observe.
- Classification: invariant financier de reprise checkout rompu, P0; defaut
  de raccordement serveur/client, sans lecteur legacy ni incoherence du domaine
  v2.
- Correction appliquee: `resumeCheckoutV2` renvoie maintenant les lignes
  bornees du snapshot immutable de commande. Le client les valide et reconstruit
  le brouillon verrouille ainsi que son sous-total depuis cette seule source.
  Le nettoyage reste revisionnel et ne retire que les lignes effectivement
  achetees. Une commande reellement payee renvoie en plus le terminal
  `COMMERCE_CHECKOUT_TERMINAL_PAID` avant tout nouvel appel Stripe.
- Fichiers modifies:
  `functions/src/commerce/domain/checkoutCoordinator.js`,
  `src/kit/commerce/checkoutRecovery.js`,
  `src/kit/commerce/CheckoutView.jsx`,
  `app/checkout/CheckoutPageIsland.jsx`, tests commerce, `map.md`,
  `_DOCS/commerce/COMMERCE_STRIPE.md` et `_DOCS/client/ESPACE_CLIENT.md`.
- Tests locaux: suite commerce complete verte hors fixture catalogue devenue
  plus stricte, ensuite corrigee avec le materiau requis; domaine Firebase
  18/18 (93 assertions), rules v2 5/5, unitaires commerce 125/125, faults 42/42,
  UI 18/18, browser 4/4, property 3/3 et tests cibles de reprise/panier 52/52.
  `npm run test:auth` 77/77, `npm run lint -- --quiet`,
  `npm run lint:functions`, build Next.js 16.3 (53 pages) et
  `git diff --check` verts.
- Deploiement sandbox: `resumeCheckoutV2` seule en `europe-west1`, puis backend
  App Hosting `secondevie-next-sandbox` seul en `europe-west4`, projet explicite
  `secondevienextjsssr`. Aucun deploiement production, Stripe live, commit ou
  push.
- Requalification sandbox: reussie. Le checkout repris montre uniquement la
  commode et 65 EUR; paiement Stripe test soumis une fois. Serveur:
  `status=paid`, `paymentStatus=succeeded`, `capturedCents=6500`, stock
  `committed`. L'espace client affiche `CMD-ORD_827042`, une piece, 65 EUR,
  payee. Le panier posterieur contient toujours l'armoire et le buffet a
  2 240 EUR et ouvre un checkout neuf exactement a 2 240 EUR. Aucun second
  paiement ni nouvelle commande groupee n'a ete cree.
- Residu externe: le document de la nouvelle commande etait encore affiche
  `Document a venir` lors du premier controle immediat; generation asynchrone a
  surveiller dans la requalification documents, sans effet sur le paiement.

### REC-20260812-C2-A03 — P1 — documents partiellement absents apres paiement et remboursement

- Statut: `FERMEE_APRES_REQUALIFICATION_SANDBOX`.
- Frequence: 2 documents manquants sur les 3 attendus pour les deux commandes
  de la campagne, apres rechargement et plusieurs minutes de convergence.
- Preconditions: commandes sandbox exactes `CMD-ORD_690AE6` payee puis livree
  et `CMD-ORD_827042` payee, retiree puis remboursee integralement.
- Reproduction:
  1. ouvrir `/mes-commandes` avec `pvml7008@gmail.com`;
  2. recharger apres convergence des statuts et des e-mails;
  3. constater 17 commandes mais toujours 25 documents;
  4. ouvrir le dossier groupe: `Document a venir`;
  5. ouvrir le dossier simple rembourse: un seul document disponible, le recu
     de paiement, sans confirmation de remboursement dans la liste.
- Attendu: un recu de paiement pour chaque commande payee et une confirmation
  de remboursement pour le remboursement confirme, tous visibles et ouvrables.
- Observe: le recu simple de 65 EUR existe et s'ouvre; le recu groupe de
  2 289 EUR et la confirmation de remboursement de 65 EUR sont absents. Les
  e-mails correspondant aux trois operations sont pourtant bien recus, ce qui
  isole l'ecart a la production/projection documentaire.
- Impact: historique financier client incomplet malgre des commandes et un
  remboursement durables; requalification complete de l'anomalie documentaire
  initiale impossible.
- Recuperations tentees: attente, rechargement de `/mes-commandes`, nouvelle
  authentification client et nouvelle lecture de l'onglet Documents; echec
  stable. Aucune commande, mutation cloud ou correction de code supplementaire.
- Requalification requise: diagnostiquer le pipeline de generation/projection
  PDF pour les deux evenements exacts, corriger sans regenerer de paiement,
  redeployer uniquement le sandbox puis verifier compteur, liste et ouverture
  des deux PDF manquants.

#### Correction locale du 2026-08-12

- Cause racine prouvee: les recus et confirmations n'etaient crees que par
  `commerceOperationsReconciler`, planifie toutes les 60 minutes. Paiements,
  refunds, faits financiers et e-mails convergeaient atomiquement, mais le
  document visible par `listMyOrdersV2` pouvait manquer jusqu'au rebuild
  horaire suivant.
- Classification: invariant de projection documentaire rompu, P1; defaut de
  raccordement du chemin nominal v2, sans incoherence financiere, lecteur
  legacy ni perte de preuve.
- Correction appliquee: le recu est maintenant cree dans la transaction du
  paiement durable; la confirmation est creee dans la transaction du refund
  reussi, pour le chemin synchrone et le webhook asynchrone. L'identite et le
  `contentHash` sont controles avant reutilisation. Le rebuild horaire reste
  un mecanisme idempotent de reparation historique.
- Fichiers modifies: `functions/src/commerce/domain/commerceDocuments.js`,
  `paymentEffectApplier.js`, `refundRepository.js`,
  `refundEffectApplier.js`, `v2Runtime.js`, tests Firebase/faults,
  `map.md`, `_DOCS/commerce/COMMERCE_STRIPE.md` et
  `_DOCS/client/ESPACE_CLIENT.md`.
- Tests locaux deja passes: commerce unitaires 125/125, Firebase domain 18/18
  avec 97 assertions dont creation atomique du recu et des confirmations,
  faults 43/43, suite commerce complete, lint Functions, lint applicatif,
  build Next.js 16.3 et `git diff --check`.
- Deploiement sandbox: quatre Functions ciblees (`stripeWebhookV2`,
  `stripeConnectWebhookV2`, `requestRefundAdmin` et
  `commerceOperationsReconciler`) en `europe-west1`, puis seul backend App
  Hosting `secondevie-next-sandbox` en `europe-west4`. Rollout
  `build-2026-08-12-006` `SUCCEEDED`. Aucun environnement production, Stripe
  live, commit ou push touche.
- Requalification sandbox: reussie avec le compte client exact. Le compteur
  passe de 25 a 27 documents. Le recu de `CMD-ORD_690AE6` (2 289 EUR) et la
  confirmation de remboursement de `CMD-ORD_827042` (65 EUR) sont listes et
  s'ouvrent chacun dans la modale de document pret avec PDF telechargeable et
  copie e-mail. Aucun nouveau paiement ni remboursement n'a ete declenche.
- Residu externe: aucun pour cette anomalie. Le classement Gmail en spam reste
  suivi separement par `REC-20260812-A05`.

### REC-20260812-C2-A04 — P0 — reversal Stripe d'un remboursement confirme

- Statut: `FERMEE_APRES_REQUALIFICATION_SANDBOX`.
- Cause racine prouvee: Stripe autorise exceptionnellement un Refund a passer
  de `succeeded` a `failed`. `refundSaga` traitait pourtant `succeeded` comme
  terminal et `refundEffectApplier` classait l'evenement ulterieur en conflit.
  Les webhooks etaient bien signes, ingeres et traites, mais la commande
  conservait donc a tort 120 EUR rembourses et un document de confirmation.
- Classification: invariant financier asynchrone rompu, P0; defaut de
  raccordement au cycle de vie fournisseur actuel, sans regression vers le
  rail legacy.
- Correction appliquee: autorisation bornee de la seule transition meme-ID
  `succeeded -> failed/canceled`; ajout d'un fait append-only
  `refund_reversal`; compensation du rollup et de la projection financiere;
  retour de la commande en `needs_review`; conservation du stock engage;
  emission idempotente des e-mails d'echec client/admin. Le reader client
  masque la confirmation obsolete lorsque le montant rembourse autoritaire
  vaut zero, mais ne supprime aucune preuve historique.
- Fichiers modifies:
  `functions/src/commerce/domain/commerceEffects.js`,
  `financialRollup.js`, `financialProjection.js`, `refundSaga.js`,
  `orderState.js`, `refundEffectApplier.js`,
  `functions/src/commerce/v2Operations.js`, `v2OrderQueries.js`,
  `src/kit/commerce/orderAdapter.js`, `MyOrdersView.jsx`, tests commerce,
  `map.md`, `_DOCS/commerce/COMMERCE_STRIPE.md` et
  `_DOCS/client/ESPACE_CLIENT.md`.
- Tests executes: faults 44/44, unitaires commerce finaux 127/127, domaine
  Firebase 19/19 avec 106 assertions, suite commerce complete, lint Functions,
  lint applicatif, build Next.js 16.3 de 52 pages et `git diff --check`, tous
  verts. Le preflight deploye final retourne `READY` pour
  `refund.created|updated|failed`.
- Deploiement: Functions refund ciblees puis `listMyOrdersV2` uniquement en
  `europe-west1`; backend App Hosting `secondevie-next-sandbox` uniquement en
  `europe-west4`, projet explicite `secondevienextjsssr`. Version servie finale
  `sv-msqodiu9-9adc770019d2`. Aucun environnement production, Stripe live,
  commit ou push touche.
- Resultat de requalification sandbox: un seul refund Stripe test
  `re_3TzKhZRnGkmlBCey1JwyLKDO` et une seule tentative domaine. Etat final de
  `CMD-ORD_D98296`: commande `needs_review`, tentative `failed`, capture
  12 000, rembourse 0, net 12 000 centimes, inventaire `committed`, quantite
  engagee 1, restockee 0. M12 et M13 sont envoyes une fois. L'espace client
  affiche `A verifier`, le texte d'echec correct et uniquement le recu de
  paiement ouvrable.
- Residu externe: M12 client reste classe dans Spam; M13 admin est en boite de
  reception. Ce residu est rattache a `REC-20260812-A05`.

## Cloture de la campagne `REC-20260812-C2`

Verdict: `FERMEE_AVEC_RESIDU_EXTERNE_A05`. Les parcours M01 a M13 ont ete
executes et requalifies sur le sandbox. Exactement deux nouvelles commandes
ont ete creees pendant la campagne; aucune troisieme commande, aucun Stripe
live et aucune donnee production n'ont ete touches.

| Anomalie initiale | Cause racine prouvee / classification | Correction et fichiers principaux | Validations et requalification sandbox | Statut final / residu |
| --- | --- | --- | --- | --- |
| `REC-20260812-A04` P0 | Reader client non raccorde a la projection UID v2 et documents hors chemin nominal; raccordement commerce/client | Reader UID, projections commandes/remboursements/documents; `v2OrderQueries.js`, pipeline documents, adaptateur/vue client | commandes simple et groupee, espace client, 27 documents, PDFs ouverts | `FERMEE`; aucun residu |
| `REC-20260812-A06` P1 | Actions fulfillment derivees sans garde stricte du mode de remise; invariant logistique | `allowedActions.js`, presentation admin et tests transitions | branches livraison et retrait completes, aucune action incompatible | `FERMEE`; aucun residu |
| `REC-20260812-A07` P1 | Archivage UI non raccorde a une commande serveur durable; raccordement catalogue | commande d'archivage serveur, retry Auth et UI publication | produit de campagne archive, absent apres rechargement et recherche publique | `FERMEE`; aucun residu |
| `REC-20260812-A03` P1 | Renouvellement Auth/reseau demontait le parcours de publication; robustesse transport | retry token/admin sans reinitialiser le formulaire; fichiers admin et client de commande | publication nominale unique et persistante, tests retry | `FERMEE`; panne forcee non rejouee humainement, couverte par tests |
| `REC-20260812-A05` P1 | Transport et authentification Gmail valides, reputation/domaine sandbox insuffisants; residu externe de delivrabilite | aucun contournement applicatif; diagnostics et contenu e-mail conserves | M01-M12 client tous recus mais classes Spam; messages admin dont M13 en Inbox; SPF/DKIM/DMARC passes | `RESIDU_EXTERNE_CONFIRME`; DNS/domaine/Resend differes |
| `REC-20260812-A02` P2 | Description rendue deux fois dans l'apercu; defaut de presentation | source unique dans `StoryEditor.jsx` / apercu admin | histoire en deux paragraphes affichee une seule fois avant publication | `FERMEE`; aucun residu |
| `REC-20260812-A01` P2 | Publication ancienne incoherente et validation metier insuffisante; qualite catalogue | validation titre/matiere et commandes catalogue actuelles | nouvelle fiche complete coherente publiquement, archive durable finale | `FERMEE`; aucun residu |

Matrice e-mail finale: M01 connexion par code, M02 validation checkout, M03
confirmation client, M04 notification admin, M05 preparation, M06 pret au
retrait, M07 retrait, M08 expedition, M09 livraison, M10 remboursement client,
M11 remboursement admin, M12 echec refund client et M13 echec refund admin ont
tous ete recus et controles sur les comptes exacts. Le contenu et les montants
sont coherents; seul le classement Spam des messages client demeure externe.

Code modifié par l'agent de recette: NON. Les corrections ont ete effectuees
pendant des pauses explicites de recette, validees et deployees sur le sandbox;
la requalification humaine finale a ensuite repris sans nouvelle modification
de code.

### A-022 - Le preflight refund.failed cible les anciens noms de Functions

- statut: `REQUALIFIEE`
- severite: `IMPORTANTE`
- phase: preflight M12/M13 de la qualification Gen1 vers Gen2
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260823_gen2q01`
- attendu: la gate non mutante decrit les deux webhooks Gen2 actifs, verifie
  leur refus des requetes non signees et recoupe les endpoints Stripe test.
- observe: `commerce:refund-failed:preflight` echoue sur un 404 en decrivant
  `stripeWebhookV2`; le script cible aussi `stripeConnectWebhookV2`, alors que
  les cibles cloud finales sont `stripeWebhookV2Gen2` et
  `stripeConnectWebhookV2Gen2`.
- reproductibilite: `1/1` sous Node 22, controle commerce ferme revision 64.
- impact: faux blocage de M12/M13 et ancien appelant local Gen1/ancien nom
  encore accessible dans un harnais de qualification; aucun paiement,
  remboursement, stock ou webhook n'a ete mute.
- preuve sanitisee: erreur Cloud Functions 404 sur le nom retire; inventaire
  live separe confirmant 134 Gen2 actives et trois seules Gen1 Auth.
- cause racine ou hypothese: cause racine confirmee dans
  `scripts/audit-refund-failed-v2.mjs`; la liste et le rapprochement d'URL
  n'ont pas ete actualises apres G10/G12.
- correction appliquee: verrouillage des trois noms cloud Gen2 finaux par
  test, retrait des noms supprimes et utilisation de l'URL publique
  `descriptor.url` plutot que de l'URI interne Cloud Run pour le recoupement
  Stripe et la probe non signee.
- validations: le test cible a echoue avant chaque correctif puis passe
  `11/11`; la gate sandbox retourne `READY`, les trois Functions sont
  `ACTIVE`, les endpoints Platform/Connect sont `enabled` et aucun evenement
  Stripe n'a ete injecte.
- deploiement: aucun; script et test locaux uniquement.
- controles refermes: oui, `v2_fixture`, admin `read_only`, offline `off`,
  operations `healthy`, compteurs a zero.

### A-023 - Le rapprochement post-campagne exige exactement trois commandes

- statut: `REQUALIFIEE`
- severite: `MINEURE`
- phase: rapprochement final de la qualification Gen1 vers Gen2
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260823_gen2q01`
- attendu: auditer les deux commandes distinctes autorisees par la campagne
  actuelle sans creer une troisieme commande payee.
- observe: `audit-commerce-orders-v2.mjs` refuse toute liste dont la longueur
  n'est pas exactement trois, valeur heritee d'une ancienne campagne.
- reproductibilite: `1/1` par inspection et validation d'entree sous Node 22.
- impact: le rapprochement final commandes/Stripe/stock ne peut pas etre lance
  avec le perimetre autorise; aucun etat cloud n'est modifie.
- cause racine: cardinalite historique codee en dur sans invariant metier qui
  l'impose; les campagnes qualifiantes actuelles utilisent deux commandes.
- correction appliquee: accepter deux ou trois IDs distincts et valides, sans
  autoriser une campagne plus large; test de regression et chapitre canonique
  mis a jour.
- validations: test cible `12/12`; audit sandbox reussi avec exactement deux
  commandes distinctes, controle revision 66 ferme, panier vide, trois unites
  engagees, zero restock, Stripe test uniquement et webhooks traites.
- deploiement: aucun; harnais local uniquement.

### A-024 - L'apercu de publication presente un slug seul comme URL produit

- statut: `REQUALIFIEE`
- severite: `MINEURE`
- phase: publication et archivage du smoke Gen2
- environnement: sandbox
- `runId`: `run_v2all_20260823_gen2q01`
- attendu: l'apercu ne doit afficher comme URL valide que la route canonique
  `<slug>-<id>` acceptee par `/produit/[slugOrId]`.
- observe: avant creation de l'ID, la barre d'adresse simule
  `/produit/<slug>`; cette route renvoie 404, tandis que la route par ID du
  produit smoke repond 200 avant archivage.
- impact: information trompeuse dans l'apercu admin, sans perte catalogue ni
  effet SEO public.
- cause racine: `SitePublicationPreview.jsx` construisait localement un slug
  seul alors que le contrat public exige l'ID comme valeur directe ou suffixe.
- correction appliquee: pour une creation, suffixe explicite
  `id-apres-publication`; pour une edition, passage de l'ID et reutilisation de
  `getProductUrl`. Test catalogue de regression ajoute.
- validation sandbox deja acquise sur le cycle metier: produit
  `product-90f942d4-9d3e-483d-a3e9-76ac3dce8de2` publie en revision 305,
  archive en revision 306, absent de `/api/catalog` et route finale 404.
- requalification: test catalogue `14/14`, build Next.js 16.3 distant reussi,
  rollout cible du seul backend `secondevie-next-sandbox` termine et routes
  `/` puis `/api/catalog/version` en HTTP 200. Le code servi construit
  desormais l'URL canonique avec l'ID en edition et affiche explicitement
  `id-apres-publication` avant creation; aucune nouvelle publication n'a ete
  necessaire.
- deploiement: App Hosting sandbox uniquement; aucune production.

### A-025 - Un refund renverse envoie aussi des confirmations devenues fausses

- statut: `REQUALIFIEE`
- severite: `IMPORTANTE`
- phase: M10-M13, remboursement asynchrone Stripe test
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_20260823_gen2q01`
- attendu: la commande au remboursement finalement `failed` envoie seulement
  M12/M13; M10/M11 restent reserves au remboursement durablement reussi.
- observe: Gmail contient d'abord les confirmations client/admin de
  `CMD-ORD_7B2DC5`, puis les deux alertes d'echec a la meme minute. L'etat
  autoritaire final reste correct: `needs_review`, capture 55 000, rembourse
  0 centime, stock engage 1 et restock 0.
- reproductibilite: `1/1` avec la carte de test Stripe de refund asynchrone;
  M10/M11 obsoletes et M12/M13 sont tous presents dans les boites exactes.
- impact: communication client et back-office contradictoire, sans divergence
  financiere ni double remboursement.
- cause racine: le domaine compensait deja `succeeded -> failed`, mais les
  intentions e-mail de succes devenaient immediatement eligibles et le
  dispatcher ne relisait pas la tentative avant Gmail.
- correction appliquee: ajout du `refundRequestId` au payload, fenetre de
  stabilisation de cinq minutes pour M10/M11, puis relecture autoritaire de la
  tentative au moment de l'envoi. Un succes entre-temps renverse devient
  `suppressed_stale`; les e-mails d'echec restent immediats et idempotents.
- validations finales: tests refund/outbox cibles `32/32`; domaine Firestore
  `20/20`, `114` assertions; commerce `139/139`; Functions Gen2 `162/162`;
  preflight distant `READY`, endpoints Platform et Connect `enabled`, refus
  non signe 400 et etat financier final de la commande echec inchange. Le
  replay est idempotent et non mutateur: aucune nouvelle commande, aucun
  nouveau remboursement et aucun nouvel e-mail n'ont ete crees.
- deploiement: uniquement `commerceOutboxDispatcherGen2`,
  `requestRefundAdminGen2`, `stripeWebhookV2Gen2` et
  `stripeConnectWebhookV2Gen2` sur le sandbox, un export a la fois depuis des
  archives immuables; aucun deploy global, Stripe live ou production.

### A-026 - L'archive de qualification G10 ne contient plus les entry points deploy-only

- statut: `REQUALIFIEE`
- severite: `MINEURE`
- phase: deploiement cible de la correction refund
- environnement: sandbox / Stripe test
- attendu: mettre a jour les deux owners webhook Gen2 depuis une archive
  immuable sans recreer les exports Gen1 retires en G12.
- observe: le premier build `stripeWebhookV2Gen2` reussit, mais la revision
  `00002-pid` ne demarre pas avec `Function 'stripeWebhookV2' is not defined`.
  Elle ne recoit aucun trafic; `00001-qul` conserve 100 % du trafic.
- cause racine: l'archive etait un `git archive` du code final G12, alors que
  l'archive G10 historique ajoutait les deux entry points deploy-only vers les
  handlers partages encore actifs.
- correction appliquee: archive G10 reconstruite depuis le commit borne avec
  un adaptateur limite a `stripeWebhookV2` et `stripeConnectWebhookV2`, SHA-256
  `f72cb7b18849cbb4623cc8cdac5315ecf89068d0c1d91e89d3d18f53244407fb`,
  generation Storage `1787486117719842`; manifeste et digest commites.
- validations: Platform `00003-naj` et Connect `00002-reb` `ACTIVE`, 100 %
  du trafic sur leur derniere revision, secrets Stripe test conserves,
  preflight distant `READY` et `test:functions-g10` `39/39`.
- impact: aucun appel fournisseur perdu, aucune interruption de l'ancien
  endpoint actif, aucune donnee ou configuration Stripe live touchee.

### A-027 - Un e-mail Gmail observe reste en delivery_unknown et maintient la sante a STOP

- statut: `REQUALIFIEE`
- severite: `IMPORTANTE`
- phase: fermeture finale de la fenetre commerce
- environnement: sandbox / Gmail de recette
- attendu: une livraison Gmail ambigue mais ensuite observee dans la boite
  exacte doit pouvoir etre rapprochee sans renvoyer le message.
- observe: M11 de `CMD-ORD_712D89` est visible dans Gmail admin, mais son
  outbox reste `delivery_unknown`; la sante commerce affiche `stop` avec ce
  seul compteur a 1, tous les compteurs financiers et stock restant a zero.
- cause racine: le choix fail-closed interdisait correctement le retry, mais
  aucun outil borne ne permettait d'enregistrer la preuve humaine ulterieure.
- correction appliquee: ajout de
  `scripts/reconcile-commerce-outbox-delivery.mjs`, dry-run par defaut,
  preconditions sandbox/outbox/commande/template/role/attempt strictes,
  confirmation exacte, transaction et audit `noResend: true`.
- validations: test cible `2/2`, ESLint cible vert, dry-run `resend:false`,
  application sur l'unique outbox correlee, puis execution manuelle unique du
  Scheduler existant `commerceOperationsReconcilerGen2` sans changement de
  configuration. Etat final `healthy`, evaluation
  `2026-08-23T12:24:19.325Z` et neuf compteurs a zero.
- effets adjacents: aucun nouvel e-mail, paiement, remboursement ou mouvement
  de stock; Scheduler toujours `ENABLED` sur sa cadence horaire.

### A-028 - La preuve HTML catalogue boucle sur un alias categorie en 308

- statut: `CORRIGEE_A_REQUALIFIER`
- severite: `IMPORTANTE`
- phase: checkpoint final Gen2 et revalidation catalogue 306
- environnement: sandbox
- attendu: apres l'archivage du meuble smoke, la revision 306 doit converger
  vers `revalidatedRevision=306` et `servedState=observed` sans retry Cloud
  Tasks ni HTTP 500.
- observe: `dispatchCatalogRevalidation` revision
  `dispatchcatalogrevalidation-00012-zer` rejoue la meme tache et produit
  `CATALOG_SERVED_ROUTE_HTTP_308`; le controle alterne entre
  `verifying_served_html` et `degraded`, avec revision publiee 306 mais
  revision revalidee 304. Le catalogue public et `/api/catalog/version`
  servent bien la revision 306.
- impact: la demonstration publique reste lisible, mais la preuve durable de
  publication ne converge pas et genere des 5xx repetes; le sandbox ne peut
  pas etre declare totalement fiable dans cet etat.
- cause racine: le plan d'impact signe contient l'alias historique
  `/categorie/deco` et sa categorie canonique `/categorie/decorations`.
  `verifyServedCatalog` choisissait le premier chemin trie, donc l'alias que
  Next redirige volontairement en 308, alors qu'il exigeait un statut 200.
- correction appliquee: selectionner directement une categorie canonique du
  plan signe en utilisant le registre d'alias catalogue; conserver le refus
  des redirections arbitraires et le controle du hash HTML.
- regression: test dedie avec un produit archive de categorie `deco`; la sonde
  appelle `/categorie/decorations` et n'appelle jamais `/categorie/deco`.
- validation locale avant deploy: test catalogue cible vert; deploiement et
  requalification de la tache existante encore requis.
- deploiement prevu: uniquement `dispatchCatalogRevalidation` Gen2 sur le
  sandbox via le wrapper fail-closed; aucun App Hosting, production, Stripe,
  IAM, secret ou Scheduler.

## Raccordement codes promotionnels — 2026-08-13

Statut courant: `FERMEE_APRES_REQUALIFICATION_STRIPE_SANDBOX`.

- Besoin confirme: les gains 5/10/15 % du jeu newsletter existaient durablement
  dans l'e-mail et `Mes avantages`, mais aucun invariant commerce ne permettait
  de les appliquer au checkout. Le contrat checkout refusait tout champ de
  promotion et `discountCents` restait toujours a zero.
- Classification: fonctionnalite metier non raccordee, avec enjeu financier et
  anti-double usage; extension vers l'avant du noyau commerce v2 actuel.
- Correction locale: registre backend-only
  `commerce_promotion_codes/{sha256(code)}`, compteurs globaux/par compte et
  redemption liee a la commande. Le serveur relit prix, perimetre, audience,
  periode et limites, calcule la remise, puis reserve code, stock et commande
  dans une seule transaction. Stripe recoit uniquement le total durable. Le
  webhook transforme la reservation en consommation une fois; annulation et
  expiration la liberent, remboursement sans reutilisation.
- Newsletter: les gains existants sont materialises paresseusement lors du
  premier controle; les nouveaux le sont apres reclamation. Ils restent
  mono-usage et lies au hash de l'e-mail Firebase verifie.
- Back-office: nouvel onglet Apple OS epure `Codes promo`, groupe Ventes;
  creation/generation serveur, remise 1–50 %, catalogue ou produits choisis,
  minimum/plafond, dates, limites, suspension/reactivation. Callables proteges
  par App Check, admin actif/AAL2 et control plane commerce.
- Fichiers principaux: `functions/src/commerce/domain/promotionCode.js`,
  `checkoutInput.js`, `checkoutRepository.js`, `paymentEffectApplier.js`,
  `promotionMaterialization.js`, `v2PromotionCodes.js`,
  `newsletterRewards.js`, `functions/index.js`, `firestore.rules`,
  `CheckoutView.jsx`, `commerceV2Client.js`, `checkoutContract.js`,
  `AdminPromotionCodes.jsx`, `promotionCodeClient.js`, `AdminAppIsland.jsx`,
  constantes admin, tests commerce, `map.md` et chapitres canoniques.
- Preuves locales acquises: lint Functions vert, lint application vert,
  unitaires commerce 132/132, domaine Firestore 20/20 et 112 assertions dont
  montant Stripe remisé et consommation idempotente, Rules commerce 5/5 avec
  registre et redemptions inaccessibles au navigateur. Suite newsletter 5/5,
  suite commerce complete et deux builds Next.js 16.3 de 52 pages verts.
- Deploiement sandbox: 13 Functions ciblees en `europe-west1`, Rules et indexes
  Firestore, puis seul backend App Hosting `secondevie-next-sandbox` en
  `europe-west4`. Version finale servie `sv-msqvxgxt-2442e21ef725`. Aucun
  environnement production, Stripe live, secret live ou push touche.
- Requalification humaine acquise: connexion Google exacte admin
  `loa.gto15@gmail.com`; onglet `Codes promo` visible dans Ventes; creation
  serveur du code produit `RECETTE10-AUG13`, 10 %, une utilisation globale et
  par client, cible `Buffet vitrine`; compteur `1 actif`, `0/1 utilise`,
  `0 reserve`. Connexion exacte client `pvml7008@gmail.com`; panier d'une ligne
  a 850 EUR; code admin applique a −85 EUR et total 765 EUR. Le code newsletter
  existant du meme client est aussi accepte a 15 %, −127,50 EUR et total
  722,50 EUR. Le format decimal a ete corrige, redeploye et requalifie.
- Autorisation complementaire: le 2026-08-13, l'utilisateur a explicitement
  autorise une unique commande Stripe test supplementaire pour fermer la
  requalification du code promotionnel. Une seule commande a ete creee:
  `CMD-ORD_5B88D5` / confirmation checkout `5B88D5D7`.
- Requalification Stripe de bout en bout: prix autoritaire 850 EUR, remise
  `RECETTE10-AUG13` de 85 EUR et montant Stripe affiche puis paye 765 EUR. Un
  premier abandon du panneau Stripe a laisse exactement la meme commande et
  la meme reservation reprenables; la reprise a confirme cette commande, sans
  doublon. La modale finale affiche la confirmation durable.
- Preuves client: `/mes-commandes` affiche une seule nouvelle commande
  `CMD-ORD_5B88D5`, `Buffet vitrine`, 765,00 EUR, statut `Payee`; son recu de
  paiement est liste, genere et ouvrable en PDF sandbox. Le meuble public est
  non achetable (`Deja reserve`).
- Preuves administrateur: la vue Ventes affiche `CMD-ORD_5B88D5`, `Payee`,
  retrait atelier, prix produit 850,00 EUR et total encaisse 765,00 EUR. Le
  registre du code est passe de `0/1 utilises · 1 reserve` pendant la reprise
  a `1/1 utilises · 0 reserves` apres confirmation Stripe.
- Verdict: le code admin s'applique reellement au PaymentIntent Stripe, est
  consomme uniquement apres paiement durable et ne reste pas reserve apres le
  succes. Aucun Stripe live, environnement production, nouvelle Function,
  nouveau deploiement ou seconde commande supplementaire n'a ete touche.
