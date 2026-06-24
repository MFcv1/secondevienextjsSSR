# TODO - Phase Infra Prod puis Hydratation/Perf

Date de preparation: 2026-06-13
Objectif demain: commencer par assainir l'infra prod avant de reprendre SEO/perf fine.

## Regle de travail

- Ne pas toucher au design actuel des pages publiques et du backoffice pendant la phase infra.
- Ne pas supprimer d'assets visibles pendant cette phase.
- Documenter chaque decision qui change le chemin prod, les variables, la revalidation ou Stripe.
- Garder `AGENTS.md`, `mapV2.md` et les rapports a jour si un fichier est cree, supprime, renomme ou deplace.

## Phase 2 - Infra prod

### P0 - Environnement et secrets

- [ ] Valider `NEXT_PUBLIC_SITE_URL` prod et sandbox:
  - [x] sandbox: valeur App Hosting confirmee et domaine HTTPS repond en 200;
  - [ ] prod: a definir quand le rail prod existe.
  - [x] decision 2026-06-24: rail prod explicitement absent/non cable dans ce clone; voir `RAIL_PROD_AUDIT_REPORT_2026-06-24.md`.
- [x] Ajouter/valider `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` pour App Check sandbox.
- [ ] Verifier la configuration App Check Firebase cote sandbox/prod:
  - [x] sandbox: app Web enregistree reCAPTCHA v3;
  - [x] sandbox: enforcement laisse en monitoring (`UNENFORCED`);
  - [x] sandbox: debug token Playwright enregistre et `exchangeDebugToken` verifie (`ttl=3600s`);
  - [x] sandbox: flux auth email OTP A/Z sans erreur console App Check via `npm run e2e:auth-email`;
  - [x] sandbox: verifier telemetrie Firestore/Functions/Storage avant tout enforcement;
    - [x] preuve API/Monitoring 2026-06-24: `APP_CHECK_ENFORCEMENT_READINESS_2026-06-24.md`;
    - [x] decision: garder Firestore, Storage et Identity Toolkit en `UNENFORCED`; Firestore/Auth ont encore du trafic `MISSING`/`INVALID`, Storage manque de trafic representatif, Functions necessite une strategie par endpoint/callable.
  - [ ] prod: a configurer/verifier quand le rail prod existe.
- [x] Creer/valider le secret App Hosting `SUPER_ADMIN_EMAIL` avant rollout.
- [x] Reevaluer `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`:
  - [x] supprimer l'exposition publique du super-admin;
  - [x] si c'est une logique d'autorisation, deplacer vers claims/serveur.
- [x] Cartographier les variables:
  - [x] publiques Next `NEXT_PUBLIC_*`;
  - [x] serveur App Hosting;
  - [x] Functions main;
  - [x] Functions public;
  - [x] Stripe;
  - [x] Gmail/email;
  - [x] revalidation interne;
  - [x] admin/security.

### P0 - Hygiene deploy

- [x] Durcir `.firebaseignore` avec exclusions explicites:

```text
.env*
service-account.json
*.pem
*.key
```

- [x] Verifier qu'aucun secret local ou config sensible n'est embarque dans App Hosting/Functions.
- [x] Verifier separation sandbox/prod:
  - [x] `.firebaserc`;
  - [x] `apphosting.yaml`;
  - [x] `firebase.json`;
  - [x] codebase `functions`;
  - [x] codebase `functions-public`;
  - [x] Firestore rules/indexes;
  - [x] Storage rules.

### P0 - Revalidation catalogue

- [ ] Tester le flux complet:

```text
mutation admin -> publicCatalogVersion/cache bump -> /api/revalidate-catalog -> produit/categorie/sitemap
```

  - [x] script E2E ajoute: `npm run e2e:revalidate-catalog`;
  - [x] le script lit le sitemap, choisit une categorie et un produit reels, puis controle les routes publiques apres appel API;
  - [x] dernier run classe le blocage auth admin: `admin_requires_google_or_passkey` pour `loa.gto15@gmail.com`;
  - [x] fournir un ID token admin automatisable hors Google interactif pour debloquer l'appel `/api/revalidate-catalog`;
    - [x] implementation ajoutee le 2026-06-24: si `E2E_ADMIN_UID` est fourni, le script mint un custom token admin via Firebase Admin puis l'echange contre un ID token REST, sans Playwright ni OTP;
    - [x] le script charge `.env.sandbox`, `logs/e2e-mail.env` et `logs/e2e-admin.env`, force le projet sandbox `secondevienextjsssr` et classe les blocages connus;
    - [x] role `roles/iam.serviceAccountTokenCreator` ajoute le 2026-06-24 pour `matthis.fradin2@gmail.com` sur le service account `secondevienextjsssr@appspot.gserviceaccount.com` puis au niveau projet sandbox;
    - [x] fallback password admin hors repo ajoute et utilise quand `E2E_ADMIN_PASSWORD` existe, afin d'obtenir l'ID token sans Google interactif ni `signBlob`.
- [x] Verifier que les pages suivantes se mettent a jour correctement:
  - [x] `/galerie`;
  - [x] `/categorie/[categoryId]`;
  - [x] `/produit/[slugOrId]`;
  - [x] `/sitemap.xml`.
  - [x] preuve 2026-06-24: `logs/revalidate-catalog-e2e-2026-06-24T16-05-12-902Z.json`, API 200, routes controlees 200, produit cible `/produit/buffet-VdMQLvZvXJL7mKVxCBvb`.
- [x] Confirmer que la revalidation ne depend pas d'un secret expose en `NEXT_PUBLIC_*`.
- [x] Documenter les gates ou commandes exactes dans le rapport infra.

### P0 - Stripe sandbox complet

- [x] Ajouter `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` sandbox App Hosting depuis le compte Stripe test de Matthieu (`pk_test_...` uniquement).
- [ ] Tester commande sandbox complete:
  - [x] script E2E heberge cree: `npm run e2e:hosted-stripe`;
  - [x] debug token App Check E2E ajoute et pris en charge par le script;
  - [x] panier;
  - [x] checkout;
  - [x] paiement Stripe sandbox;
  - [x] webhook signe;
  - [x] creation commande confirmee cote UI apres paiement;
  - [x] decrement/reservation stock observe pendant le parcours sandbox;
  - [x] email si applicable.
  - [x] precondition: email utilisateur verifie avant paiement Stripe.
  - [x] precondition: produit test avec stock disponible/non reserve pour finaliser Stripe.
- [x] Tester annulation/restauration:
  - [x] annulation commande;
  - [x] restauration stock;
  - [x] coherence espace client;
  - [x] coherence admin commandes.
- [x] Reevaluer `return_url` Stripe actuellement compatible legacy `/?order_success=true`.
- [x] Verifier que les webhooks utilisent bien les secrets sandbox/prod separes:
  - [x] `STRIPE_SECRET_KEY` sandbox cree en secret Firebase Functions et deploye sur `createOrder` / `stripeWebhook`;
  - [x] `STRIPE_WH_SECRET` sandbox cree depuis l'endpoint webhook Stripe et deploye sur `stripeWebhook`.

### P1 - Risques infra deja identifies

- [x] `sendTestEmail`: appel admin trouve sans Function exportee; corriger ou retirer le bouton diagnostic.
- [x] `public/og-image.jpg`: absent alors que reference par metadata; a traiter en phase SEO, mais noter l'impact prod.
- [ ] `functions/src/seo/seoTools.js` + rewrites Firebase Hosting: clarifier legacy encore utile ou a retirer plus tard.
- [x] Verifier que `functions-public/src/public/catalog.js` reste le seul endpoint catalogue public actif.

## Phase 3 - Hydratation / perf

Ne commencer cette phase qu'apres les P0 infra.

### P0 perf - Galerie

- [ ] Reprendre la baseline `/galerie`.
- [ ] Confirmer le budget mesure autour de `176.35 kB JS gzip initial`.
- [ ] Identifier les chunks initiaux exacts.
- [ ] Ne pas modifier le design ni le contrat mobile galerie.
- [ ] Lire `alertemobile.md` avant toute modification de galerie/mobile/scroll/produit.

### P1 perf - Ilots bas

- [ ] Differer encore les ilots bas non critiques:
  - [ ] Instagram;
  - [ ] temoignages;
  - [ ] before/after;
  - [ ] sections basses non essentielles au premier rendu.
- [ ] Garder des hauteurs reservees pour eviter les sauts de layout.
- [ ] Mesurer avant/apres avec les scripts existants.

### P1 perf - Header public

- [ ] Isoler panier/auth du header public.
- [ ] Charger panier/auth seulement:
  - [ ] sur interaction;
  - [ ] si session persistante detectee;
  - [ ] sur routes privees ou checkout.
- [ ] Verifier que la navigation publique reste identique visuellement.

### P2 perf - Produit direct

- [ ] Repasser `/produit/[slugOrId]` apres galerie/header.
- [ ] Confirmer le budget mesure autour de `119.84 kB JS gzip initial`.
- [ ] Separer mieux media/actions si le gain est clair.
- [ ] Relancer le gate produit direct apres modification.

## Rapports attendus

- [x] Creer ou mettre a jour un rapport infra prod precis apres la Phase 2.
- [x] Reporter:
  - [x] fichiers touches;
  - [x] variables validees;
  - [x] risques restants;
  - [x] commandes/gates lancees;
  - [x] decisions sandbox/prod.
- [ ] Ne passer a la Phase 3 que quand les P0 infra sont traites ou explicitement reportes.

## Phase 2.5 - Solidification proche prod post-E2E

Date d'ajout: 2026-06-15
Origine: retours multi-agents apres tests App Check + Stripe sandbox heberge.
Objectif: rendre le tunnel client, les paiements, les stocks, l'auth admin et l'observabilite assez solides pour une version proche production.

Sources primaires a garder sous la main:
- Stripe PaymentIntents lifecycle: https://docs.stripe.com/payments/paymentintents/lifecycle
- Stripe webhooks/signatures: https://docs.stripe.com/webhooks/signatures
- Stripe refunds: https://docs.stripe.com/refunds
- Stripe Payment Element: https://docs.stripe.com/payments/payment-element
- Firebase App Check Web reCAPTCHA v3: https://firebase.google.com/docs/app-check/web/recaptcha-provider
- Firebase App Check debug provider: https://firebase.google.com/docs/app-check/web/debug-provider
- Firebase Auth custom claims: https://firebase.google.com/docs/auth/admin/custom-claims

Avancement 2026-06-18:
- [x] Blocage annulation/restauration libre des commandes Stripe deja payees cote client, Function et admin.
- [x] Confirmation UI durable: succes affiche seulement apres confirmation Firestore/webhook `paid`, avec etat intermediaire clair.
- [x] Cleanup serveur programme des commandes `pending_payment` abandonnees avec verification Stripe avant restauration stock.
- [x] Claims admin durcis: attribution `admin` / `superAdmin` refusee si l'email Firebase n'est pas verifie.
- [x] Popup succes paiement modernisee et plus sobre.
- [x] Bug checkout corrige: pendant le paiement, le recap conserve le snapshot panier/sous-total meme si la reservation stock fait disparaitre l'article du panier live.
- [x] Deploiement sandbox Functions + App Hosting effectue, puis redeploiement App Hosting apres correction du snapshot checkout.
- [x] Preuve manuelle paiement sandbox: recap panier/total conserves, statut Firestore `paid`, webhook Stripe traite, email client/admin envoye et stock final vendu/reserve verifies le 2026-06-18 via `logs/hosted-stripe-e2e-2026-06-18T17-12-44-576Z.proof.json`.

### P0 - Securite admin et claims

- [x] Exiger `email_verified === true` avant toute attribution serveur de claim `admin` / `superAdmin`:
  - [x] `grantAdminOnAuth`: ne pas promouvoir un email pending/admin non verifie;
  - [x] `syncSuperAdminClaim`: refuser le bootstrap si l'email n'est pas verifie;
  - [x] ajouter un test negatif: email super-admin non verifie => aucun claim admin;
  - [x] ajouter un test negatif: email pending admin non verifie => aucun claim admin.
- [x] Rendre le bootstrap super-admin explicite, rare et auditable:
  - [x] ne plus appeler `syncSuperAdminClaim` pour chaque client connecte standard;
  - [x] supprimer les erreurs CORS `syncSuperAdminClaim` des runs checkout;
  - [x] documenter la procedure owner dans le runbook.

### P0 - Paiement Stripe, remboursement et annulation

- [x] Bloquer l'annulation automatique d'une commande Stripe deja `paid` sans remboursement Stripe:
  - [x] cote client `Mes commandes`: ne pas proposer l'annulation libre d'une commande payee carte;
  - [x] cote Function `cancelOrderClient`: refuser ou router les commandes `paid` vers un flux remboursement;
  - [x] cote admin: ne jamais supprimer/restaurer une commande payee sans trace ni refund;
  - [x] definir les statuts `refund_pending`, `refunded`, `refund_failed` si remboursement gere.
- [x] Creer un flux serveur de remboursement/annulation payee:
  - [x] appeler Stripe Refund avec idempotence;
  - [x] conserver la commande dans l'historique client/admin;
  - [x] restaurer automatiquement le stock apres remboursement reussi;
  - [x] verifier dans Stripe Dashboard/API que le PaymentIntent porte le remboursement.
- [x] Simplifier le back-office vers un flux unique `Rembourser et remettre en vente`.
- [x] Creer une section admin dediee `Retours` pour initier les refunds, synchroniser Stripe et informer le client.
- [x] Ajouter une synchro serveur `syncRefundStatusAdmin` pour relire le statut Refund Stripe et remettre le stock si le refund reussit.
- [x] Ajouter la reception webhook `refund.*` / `charge.refunded` pour suivre les refunds Stripe hors back-office.
- [x] Ajouter un brouillon CGV/retours a faire valider par juriste: `docs/CGV_RETOURS_DRAFT_2026-06-19.md`.
- [x] Verifier et aligner les events webhook Stripe configures:
  - [x] si `payment_intent.canceled` est gere dans le code, l'ajouter dans le dashboard Stripe;
  - [x] si `checkout.session.expired` reste configure, ajouter un handler ou le retirer;
  - [x] documenter pour chaque event configure: handler, effet attendu, test de preuve.

### P0 - Reprise demain: debloquer E2E refund complet

Blocage observe le 2026-06-19 pendant le run achat -> refund:

Roadmap d'execution dediee: `E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md`.

- [x] Debloquer App Check E2E sandbox:
  - [x] generer/recuperer un debug token App Check Web pour Playwright;
  - [x] l'enregistrer dans Firebase Console App Check sandbox;
  - [x] ajouter localement `E2E_APPCHECK_DEBUG_TOKEN` dans un fichier ignore Git ou une procedure claire;
  - [x] verifier que `scripts/e2e-hosted-stripe-checkout.mjs` injecte bien le token avant initialisation Firebase;
  - [x] relancer l'achat invite E2E et verifier disparition des `AppCheck 403` / throttle 24h.
- [x] Ajouter dans Stripe Dashboard sandbox les events refund suivis par le webhook:
  - [x] `refund.created`;
  - [x] `refund.updated`;
  - [x] `refund.failed`;
  - [x] `charge.refunded` en fallback si utile avec la version API/endpoint actuelle.
- [x] Relancer un parcours complet neuf:
  - [x] achat invite avec alias Gmail;
  - [x] PaymentIntent `succeeded`;
  - [x] commande Firestore `paid`;
  - [x] webhook paiement `processed`;
  - [x] email commande client/admin;
  - [x] stock produit passe vendu/reserve.
- [x] Depuis l'admin sandbox heberge:
  - [x] ouvrir `Retours`;
  - [x] retrouver la nouvelle commande payee/remboursee;
  - [x] cliquer `Rembourser`;
    - [x] preuve stricte 2026-06-24: commande fraiche `xxHfLd2NLLWyFN5VXz01`, clic UI `Rembourser`, confirm natif accepte, refund `re_3TlxoeRdWb0VNdZq1RL5SfaS`; voir `logs/ui-admin-returns-strict-refund-2026-06-24-xxHfLd2NLLWyFN5VXz01.json`.
  - [x] verifier `refundId`, statut `refunded`, `Stock remis`;
  - [x] cliquer `Sync Stripe`;
  - [x] envoyer `Email client`;
  - [x] verifier que la page filtre bien sur la commande traitee apres chaque action.
- [x] Verifier l'espace client apres refund:
  - [x] la commande affiche `Remboursee` ou `Remboursement en cours`;
  - [x] le texte annonce le delai bancaire Stripe;
  - [x] la section factures affiche la ligne `Avoir / remboursement`;
  - [x] aucune annulation libre n'est proposee.
- [x] Verifier les preuves et logs:
  - [x] nouveau JSON `logs/hosted-stripe-e2e-*.json`;
  - [x] screenshot checkout/succes/admin/client si utile;
  - [x] logs `stripeWebhook` pour paiement + refund;
  - [x] Firestore order: `refundStatus`, `stripeRefundId`, `stockRestoredAfterRefund`, `refundEmailProof`;
  - [x] Stripe Dashboard/API: refund visible et events webhook traites.
- [x] Mettre a jour `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md` avec les preuves finales.

### P0 - Reservation stock et commandes orphelines

- [x] Ajouter un cleanup serveur programme des commandes `pending_payment` abandonnees:
  - [x] detecter les commandes `pending_payment` agees de X minutes;
  - [x] verifier l'etat Stripe du PaymentIntent avant toute restauration;
  - [x] annuler le PaymentIntent si necessaire;
  - [x] restaurer le stock et passer `stockReserved=false`;
  - [x] garantir qu'un paiement reussi tardif ne restaure jamais le stock.
- [x] Tester les scenarios `payment_intent.payment_failed` et `payment_intent.canceled`:
  - [x] statut commande attendu: `payment_failed` ou `canceled`;
  - [x] stock restaure;
  - [x] espace client coherent;
  - [x] admin commandes coherent;
  - [x] logs Functions sans erreur critique.

### P0 - Confirmation paiement et webhook

- [x] Corriger le succes UI pour attendre une confirmation durable:
  - [x] apres `confirmPayment`, poller ou ecouter `orders/{orderId}` jusqu'a `status=paid`;
  - [x] afficher un etat intermediaire honnete: paiement recu, confirmation en cours;
  - [x] vider le panier seulement apres confirmation durable;
  - [x] ne promettre l'email que si l'envoi est confirme ou reformuler le texte.
- [ ] Gerer le retour Stripe redirect sur `/checkout`:
  - [x] lire `order_success`, `order_id`, `payment_intent_client_secret`, `redirect_status`;
  - [x] restaurer l'etat succes/echec/en-cours apres retour redirect;
  - [ ] tester au moins un moyen de paiement redirect en sandbox.
    - [x] harnais prepare 2026-06-24: `E2E_STRIPE_PAYMENT_METHOD=ideal`, selection banque et autorisation redirect dans `scripts/e2e-hosted-stripe-checkout.mjs`;
    - [x] checkout heberge stabilise jusqu'au Payment Element: run carte `logs/hosted-stripe-e2e-2026-06-24T20-50-15-627Z.json` en `passed`;
    - [ ] preuve redirect non obtenue: dernier run iDEAL `logs/hosted-stripe-e2e-2026-06-24T20-51-01-227Z.json` classe `known-blocked-stripe-redirect-method`, iDEAL/Wero non selectable dans la config Stripe sandbox courante.
- [x] Corriger la preuve E2E serveur:
  - [x] le JSON de preuve inclut `orderId`, `paymentIntentId`, produit choisi et stock final;
  - [x] verifier Firestore `orders/{orderId}.status === paid`;
  - [x] verifier `sys_idempotency/stripe_*` en `processed`;
  - [x] verifier event Stripe `payment_intent.succeeded` traite par webhook;
  - [x] verifier email de confirmation si applicable.
  - [x] ajouter explicitement le stock avant paiement dans le JSON de preuve automatique.

### P0 - UX checkout client

- [x] Verrouiller le recap checkout pendant le paiement:
  - [x] conserver les articles et le sous-total du panier au moment de `createOrder`;
  - [x] garder `prix meubles + frais de port` visible pendant Stripe, meme si le panier live change apres reservation stock;
  - [x] liberer le snapshot si le client ferme le paiement ou si la creation de commande echoue.
- [x] Garder un seul gate email coherent au checkout:
  - [x] connexion client par code a 6 chiffres => email Firebase marque verifie cote serveur;
  - [x] utilisateur invite => meme code a 6 chiffres demande dans la page checkout avant `createOrder`;
  - [x] pas de deuxieme lien Firebase `sendEmailVerification` dans le tunnel checkout;
  - [x] conserver le panier pendant la verification OTP.
- [x] Centraliser une regle `isPurchasable`:
  - [x] condition: `!sold && stock > 0 && price > 0 && !priceOnRequest`;
  - [x] cartes galerie: aucun bouton panier si non achetable;
  - [x] fiche produit: remplacer par `Vendu`, `Deja reserve` ou `Demander un devis`;
  - [x] checkout: surveiller `stock <= 0` en plus de `sold`;
  - [x] message panier clair si le produit devient indisponible.
- [x] Eviter les doublons panier:
  - [x] document panier deterministe par produit ou merge avant ajout;
  - [x] double clic = une seule ligne;
  - [x] afficher `Deja dans le panier` quand applicable;
  - [x] ne plus creer d'erreur stock par doublon du meme article.
- [x] Ajouter des etats clairs pour `/checkout` direct:
  - [x] non connecte => inviter a se connecter;
  - [x] connecte sans panier => panier vide + retour galerie;
  - [x] jamais afficher un formulaire checkout anonyme ou vide.

### P1 - Moyens de paiement et coherence Stripe live

- [ ] Aligner UI et moyens de paiement vraiment actifs dans Stripe:
  - [x] masquer PayPal/Amazon/Klarna/Apple Pay si non actives ou domaine non verifie;
    - [x] implementation 2026-06-24: `src/kit/commerce/CheckoutView.jsx` ne promet plus Apple Pay/Google Pay/PayPal statiquement; libelles generiques `Selon Stripe` / `Wallets eligibles`.
  - [ ] verifier Apple Pay domain verification avant live;
  - [ ] zero warning Stripe `payment method not activated` en run prod-like;
  - [ ] documenter les methodes activees sandbox puis prod.
    - [ ] reste a confirmer dans Stripe Dashboard sandbox/prod; le Payment Element reste dynamique.
- [ ] Etudier migration moyen terme vers Checkout Sessions / Payment Element custom:
  - [ ] comparer avec l'architecture PaymentIntent actuelle;
  - [ ] garder la reservation stock atomique comme contrainte;
  - [ ] ne migrer que si le gain simplifie redirect, webhooks et maintenance.

### P1 - App Check et chemins Firebase

- [ ] Rendre App Check enforceable progressivement:
  - [x] inventorier les imports restants de `src/kit/config/firebase.js` et `firebaseStorage.js` avec `npm run appcheck:audit`;
  - [x] faire passer Storage par `getStorageInstance()` pour initialiser App Check avant `getStorage`;
  - [x] migrer les 51 chemins Firestore/Functions/legacy-config signales par `npm run appcheck:audit`;
  - [x] faire passer Firestore/Functions par un chemin qui initialise App Check;
    - [x] implementation 2026-06-24: `src/kit/config/firebase.js` initialise App Check avant les instances legacy `db` / `functions`, et `npm run appcheck:audit` distingue maintenant les creations d'instances des imports modulaires utilitaires;
    - [x] validation courte: `npm run appcheck:audit` OK, `findingCount=0`.
  - [x] sandbox: conserver `UNENFORCED` jusqu'a telemetrie verte;
    - [x] decision 2026-06-24: enforcement refuse pour l'instant, voir `APP_CHECK_ENFORCEMENT_READINESS_2026-06-24.md`.
  - [ ] tester enforcement service par service: Firestore, Storage, Identity Toolkit;
    - [ ] reporte: ne pas tester tant que Firestore/Auth ont du trafic non verifie et que Storage n'a pas de smoke representatif.
  - [ ] prod: vraie `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, aucun debug token hors CI controlee.
- [x] Reduire les details d'erreur publics:
  - [x] `/api/revalidate-catalog`: ne pas renvoyer `error.message` brut au client sur token invalide;
  - [x] log serveur interne uniquement;
  - [x] reponse publique stable: `invalid_token`.
- [x] Nettoyer les restes env publics super-admin:
  - [x] retirer `VITE_SUPER_ADMIN_EMAIL` des `.env.*.example` si inutile;
  - [x] verifier que le bridge `VITE_ -> NEXT_PUBLIC_` ne peut pas reexposer un owner.

### P1 - Observabilite et runbooks

- [x] Ajouter un runbook `preuve webhook signe`:
  - [x] verifier endpoint Stripe sandbox, events, secret separe sandbox/prod;
  - [x] verifier event livre en `2xx` dans Stripe Dashboard;
  - [x] verifier logs Functions correspondants;
  - [x] verifier idempotence Firestore `sys_idempotency`.
- [x] Mettre a jour `RUNBOOK.md`:
  - [x] remplacer les mentions Stripe dummy par l'etat 2026-06-18;
  - [x] documenter paiement sandbox valide cote UI;
  - [x] documenter webhook/email prouves;
  - [x] documenter rollback App Hosting.
- [x] Etendre le dashboard deploy:
  - [x] afficher URL rollout App Hosting;
  - [x] health check `/galerie`;
  - [x] commandes `infra:env`, `infra:deploy`, logs Functions;
  - [x] procedure rollback ou lien console.

### P1 - Donnees de test et E2E repetable

- [x] Ajouter un E2E auth email OTP permanent:
  - [x] script ajoute: `npm run e2e:auth-email`;
  - [x] genere un alias Gmail frais `loa.gto15+auth-a-z-...@gmail.com`;
  - [x] lit uniquement un UID Gmail plus recent que le dernier mail connu pour cet alias;
  - [x] prouve la creation implicite du compte par OTP;
  - [x] prouve la deconnexion puis reconnexion du meme compte;
  - [x] verifie que la reconnexion conserve le meme UID Firebase;
  - [x] dernier run OK: `logs/auth-email-otp-e2e-2026-06-22T14-16-55-637Z.json`.
- [x] Creer un produit sandbox dedie aux tests Stripe:
  - [x] script de seed/reset ajoute: `npm run e2e:seed-stripe-product`;
  - [x] produit clairement marque test: `[TEST STRIPE SANDBOX] Produit refund repetable`;
  - [x] stock connu et restaurable via `E2E_STRIPE_PRODUCT_STOCK`;
  - [x] produit effectivement cree/verifie dans Firestore sandbox apres execution du seed;
  - [x] reset possible avant/apres run.
- [ ] Creer ou documenter un compte client test verifie dedie:
  - [x] email verifie confirme pour `loa.gto15@gmail.com` via Identity Toolkit;
  - [x] mot de passe attendu hors repo via `E2E_PASSWORD` dans `logs/e2e-mail.env` ou env shell ignore Git;
  - [x] alternative sans mot de passe: creation/reconnexion client verifiee par OTP avec alias frais via `npm run e2e:auth-email`;
  - [ ] ajouter effectivement `E2E_PASSWORD` dans l'env local pour tester le mode `verified-user`;
  - [ ] rotation si partage accidentel.
- [x] Supprimer les exclusions fragiles par nom dans le script E2E:
  - [x] ne plus eviter manuellement `Buffet`, `dd`, `Chaise`;
  - [x] choisir le produit test dedie via `E2E_STRIPE_PRODUCT_ID` par defaut `sv-e2e-stripe-refund-product`;
  - [x] E2E complet repetable 3 fois sans consommer le catalogue.
- [x] Redacter les logs E2E:
  - [x] masquer `password`;
  - [x] masquer App Check debug token;
  - [x] masquer `idToken`, `refreshToken`, `Authorization`, `clientSecret`;
  - [x] classifier les erreurs connues et echouer seulement sur erreurs inattendues.

### P2 - Details client/admin et confiance

- [x] Normaliser l'adresse de livraison:
  - [x] harmoniser `shipping.zip` et `shipping.postalCode`;
  - [x] email client/admin affiche toujours le code postal;
  - [x] export CSV et fiche admin coherents.
- [ ] Nettoyer les petites frictions panier/compte:
  - [x] retirer les boutons quantite `- / +` s'ils ne sont pas actifs;
  - [x] synchroniser les compteurs panier/wishlist du menu global;
  - [x] garder les commandes annulees visibles avec statut `Annulee`.
- [ ] Harmoniser rules et claims:
  - [x] verifier si `superAdmin == true` doit etre accepte explicitement dans Firestore/Storage rules;
  - [ ] conserver `admin == true` comme chemin principal si les Functions posent toujours les deux.
