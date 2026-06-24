# Roadmap P0 infra avant Phase 3 perf

Date de creation: 2026-06-24
Objectif: fermer ou reporter explicitement les derniers P0 infra avant toute passe Phase 3 hydratation/perf.
Perimetre: App Hosting sandbox/prod, App Check, revalidation catalogue, Stripe webhook/email/refund, checkout redirect, chemins Firebase enforceables.

## Principe directeur

La Phase 3 perf ne doit pas commencer tant que les P0 infra ci-dessous ne sont pas:

- prouves en sandbox;
- reportes explicitement avec raison, risque, owner et condition de reprise;
- ou bloques par l'absence du rail prod, sans masquer ce blocage.

Ne pas modifier le design public ou back-office dans cette roadmap. Ne pas supprimer d'assets visibles. Ne jamais exposer de secret dans un log, un rapport, un screenshot ou un fichier versionne.

## Documents a lire avant implementation

1. `AGENTS.md`
2. `TODO.md`
3. `INFRA_PROD_PHASE2_REPORT_2026-06-14.md`
4. `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`
5. `E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md`
6. `RUNBOOK.md`
7. `mapV2.md`
8. `NEXT_PUBLIC_ROUTES_STATIC_ARCHITECTURE_ROADMAP_2026-06-16.md` si la passe touche revalidation, cache public, produit, categorie ou sitemap.
9. `alertemobile.md` seulement si une modification touche galerie, produit mobile, scroll mobile ou shell marketplace.

Sources techniques primaires deja retenues par le projet:

- Stripe PaymentIntents lifecycle: https://docs.stripe.com/payments/paymentintents/lifecycle
- Stripe webhooks/signatures: https://docs.stripe.com/webhooks/signatures
- Stripe refunds: https://docs.stripe.com/refunds
- Stripe Payment Element: https://docs.stripe.com/payments/payment-element
- Firebase App Check Web reCAPTCHA v3: https://firebase.google.com/docs/app-check/web/recaptcha-provider
- Firebase App Check debug provider: https://firebase.google.com/docs/app-check/web/debug-provider
- Firebase Auth custom claims: https://firebase.google.com/docs/auth/admin/custom-claims

## Non-objectifs

- Pas de redesign.
- Pas d'optimisation JS/CSS tant que les P0 ne sont pas clos ou reportes.
- Pas d'enforcement App Check global sans telemetrie verte service par service.
- Pas de creation de rail prod en improvisation si les domaines, secrets, CORS, Stripe live et App Check live ne sont pas prets.
- Pas de contournement admin permanent pour faciliter les tests.

## Definition de fini globale

Le prochain agent peut declarer "P0 infra ferme" seulement si:

- `TODO.md` est mis a jour avec les cases fermees ou explicitement reportees.
- Un rapport court est ajoute ou mis a jour avec les preuves: commandes, horodatage, URL sandbox, event IDs Stripe non secrets, order IDs, chemins revalides.
- Les secrets restent absents du diff et des logs versionnes.
- Les validations longues lancees sont justifiees par la tache et leurs resultats sont documentes.
- La decision "Phase 3 autorisee / non autorisee" est ecrite clairement.

## Ordre d'execution recommande

1. Etat initial et garde-fous.
2. Rail prod: valider ce qui existe, reporter ce qui n'existe pas.
3. App Check sandbox: lire la telemetrie avant enforcement.
4. ID token admin automatisable pour `/api/revalidate-catalog`.
5. Revalidation catalogue effective: galerie, categorie, produit, sitemap.
6. Stripe webhook signe et email: preuve sandbox, prod reportee si rail absent.
7. Refund: reconciler l'incoherence TODO sans recoder inutilement.
8. Checkout redirect: prouver au moins un moyen redirect sandbox.
9. App Check enforcement readiness: migrer les chemins signales par `npm run appcheck:audit`.
10. Mettre a jour TODO, RUNBOOK/rapport, puis statuer sur Phase 3.

## 0. Etat initial et garde-fous

### Actions

- Verifier le statut Git avant toute modification.
- Identifier les changements utilisateur deja presents et ne pas les revert.
- Lancer uniquement les audits courts necessaires a la passe.
- Verifier que les fichiers `.env*`, logs sensibles, screenshots et exports Stripe/Firebase ne seront pas ajoutes au diff.

### Commandes utiles

```powershell
git status --short
git diff -- AGENTS.md TODO.md RUNBOOK.md mapV2.md
rg -n "whsec_|sk_live_|sk_test_|rk_live_|rk_test_|E2E_APPCHECK_DEBUG_TOKEN|idToken|refreshToken|clientSecret" .
```

Adapter le dernier `rg` si le repo contient volontairement des exemples rediges. Ne pas afficher de secrets complets dans le compte rendu.

### Sortie attendue

- Un court resume de l'etat du worktree.
- Une liste des fichiers que l'agent prevoit de toucher.

## 1. Rail prod: `NEXT_PUBLIC_SITE_URL` et App Check prod

### Etat connu

- Sandbox App Hosting existe et repond.
- Le rail prod propre n'existe pas encore dans ce clone selon `TODO.md` et `mapV2.md`.

### Actions

- Confirmer si un backend App Hosting prod existe deja dans Firebase.
- Si le rail prod n'existe pas, ne pas inventer de valeur prod dans les env.
- Si le rail prod existe, verifier:
  - domaine HTTPS final;
  - `NEXT_PUBLIC_SITE_URL` / equivalents Vite bridge;
  - domaines autorises Firebase Auth;
  - App Check Web reCAPTCHA v3 prod;
  - absence de debug token hors CI controlee;
  - origins publiques Functions/CORS;
  - Stripe live separe de sandbox.

### Commandes utiles

```powershell
firebase apphosting:backends:list --project <project-prod-ou-sandbox>
npm run infra:env
rg -n "NEXT_PUBLIC_SITE_URL|VITE_SITE_URL|RECAPTCHA|APPCHECK|PUBLIC_ALLOWED_ORIGINS" .env*.example apphosting.yaml scripts src app functions functions-public
```

### Critere d'acceptation

- Sandbox: valeur et URL confirmees.
- Prod: soit rail confirme avec domaine et App Check, soit report explicite dans `TODO.md` avec mention "bloque tant que le rail prod n'existe pas".

## 2. App Check sandbox: telemetrie avant enforcement

### Objectif

Verifier Firestore, Functions et Storage en sandbox avant de passer un service en enforcement.

### Actions

- Lire la console Firebase App Check sandbox pour chaque service.
- Noter les pourcentages de requetes verifiees/non verifiees et la fenetre temporelle.
- Croiser avec les scripts E2E recents: auth email, checkout Stripe, refund/admin si disponibles.
- Ne pas activer enforcement si un flux critique genere encore du trafic non verifie.

### Preuves attendues

- Date/heure de lecture console.
- Services lus: Firestore, Functions, Storage, Identity Toolkit si visible.
- Etat par service: `UNENFORCED`, eligible enforcement, ou bloque.
- Capture ou transcription sans token ni secret.

### Critere d'acceptation

- `TODO.md` indique clairement si la sandbox reste `UNENFORCED` ou si un service est candidat a un test enforcement limite.

## 3. Debloquer `/api/revalidate-catalog` avec ID token admin automatisable

### Probleme

Le script `npm run e2e:revalidate-catalog` existe mais le dernier blocage documente est `admin_requires_google_or_passkey` pour `loa.gto15@gmail.com`. Il faut un ID token admin utilisable par script, sans connexion Google interactive.

### Option preferee: token custom Firebase sandbox

Creer un script local/E2E qui:

- prend un UID admin sandbox deja verifie et deja porteur des claims necessaires;
- utilise Firebase Admin local/CI pour creer un custom token;
- echange ce custom token contre un ID token via Identity Toolkit REST;
- n'ecrit jamais le token complet en clair;
- expire naturellement comme un ID token Firebase standard;
- refuse de tourner contre prod sauf variable explicite tres visible.

Variables candidates:

```text
E2E_ADMIN_UID=<uid admin sandbox>
E2E_FIREBASE_API_KEY=<api key web sandbox ou NEXT_PUBLIC Firebase api key>
E2E_ALLOW_PROD_ADMIN_TOKEN=false
```

Points de securite:

- Ne pas ajouter de service account au repo.
- Ne pas stocker l'ID token dans un fichier versionne.
- Redacter `idToken`, `refreshToken`, `Authorization`.
- Ne pas mint de claims `superAdmin` dans le custom token si les claims existent deja sur l'utilisateur. Preferer un UID sandbox qui porte deja les claims serveur.

### Alternative acceptable

Utiliser un compte admin test email/password uniquement si la politique admin du projet l'autorise encore, avec mot de passe hors repo. Si la securite exige Google/passkey pour l'UI admin, ne pas affaiblir cette regle pour le back-office humain.

### Fichiers probables

- `scripts/e2e-revalidate-catalog.mjs`
- eventuellement nouveau helper `scripts/get-e2e-admin-id-token.mjs`
- `package.json` si une commande dediee est ajoutee
- documentation dans `RUNBOOK.md` ou rapport infra

### Critere d'acceptation

- Le script obtient un ID token admin sans interaction navigateur Google.
- Le token permet l'appel `/api/revalidate-catalog`.
- Les logs prouvent le statut HTTP et les routes controlees sans exposer le token.

## 4. Revalidation catalogue effective

### Objectif

Prouver le flux complet:

```text
mutation admin -> publicCatalogVersion/cache bump -> /api/revalidate-catalog -> /galerie, /categorie/[categoryId], /produit/[slugOrId], /sitemap.xml
```

### Actions

- Relire `app/api/revalidate-catalog/route.js`.
- Relire `scripts/e2e-revalidate-catalog.mjs`.
- Choisir un produit test sandbox et une categorie reelle.
- Declencher une mutation admin reversible ou un bump de version catalogue sandbox.
- Appeler `/api/revalidate-catalog` avec ID token admin.
- Verifier les routes publiques apres invalidation.

### Preuves minimales

- `catalogVersion` avant/apres ou preuve equivalente.
- URL revalidee `/galerie`.
- URL revalidee `/categorie/<id>`.
- URL revalidee `/produit/<slugOrId>`.
- `/sitemap.xml` relu apres mutation.
- Statut de l'appel API et corps de reponse redige si besoin.

### Commandes utiles

```powershell
npm run e2e:revalidate-catalog
npm run next:routes
```

Ne lancer `build`, serveur local ou navigateur que si la correction l'exige ou si l'utilisateur demande une validation complete.

### Critere d'acceptation

- Les quatre surfaces publiques listent ou refletent la mutation attendue.
- La revalidation ne depend d'aucun secret `NEXT_PUBLIC_*`.
- `TODO.md` est coche pour les routes prouvees.

## 5. Stripe webhook signe et email sandbox/prod

### Objectif

Confirmer que le paiement sandbox heberge est prouve par webhook Stripe signe, idempotence serveur et email client/admin.

### Actions sandbox

- Relire `functions/src/commerce` autour de `stripeWebhook`, create order, refund et emails.
- Verifier dans Stripe Dashboard sandbox:
  - endpoint webhook actif;
  - secret `STRIPE_WH_SECRET` distinct sandbox;
  - events configures alignes avec les handlers;
  - livraison recente en `2xx`.
- Croiser avec logs Functions:
  - event `payment_intent.succeeded` ou equivalent traite;
  - entree `sys_idempotency/stripe_*` en `processed`;
  - commande Firestore `paid`;
  - preuve email client/admin si applicable.

### Actions prod

- Si le rail prod n'existe pas, reporter explicitement.
- Si le rail prod existe, verifier uniquement la separation des secrets et endpoint, sans lancer de vrai paiement live sauf demande explicite.

### Preuves acceptables

- ID event Stripe sandbox, sans secret.
- Order ID sandbox.
- PaymentIntent ID sandbox.
- Horodatage logs Functions.
- Statut webhook `2xx`.
- Statut email ou preuve d'envoi deja redigee.

### Critere d'acceptation

- `TODO.md` coche `webhook signe` et `email si applicable` seulement si les deux preuves existent pour un run recent.
- Le runbook explique comment retrouver la preuve sans exposer `whsec_*`.

## 6. Refund: reconciler l'incoherence TODO

### Probleme

Dans `TODO.md`, `cliquer Rembourser` reste non coche, alors que `refundId`, `refunded`, `Stock remis`, `Sync Stripe`, `Email client` et les preuves finales sont coches.

### Actions

- Relire `E2E_REFUND_EXECUTION_ROADMAP_2026-06-19.md`.
- Relire `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`.
- Verifier les logs/preuves mentionnes dans `logs/hosted-stripe-e2e-*.json` si presents localement.
- Decider:
  - si une preuve montre que le clic UI `Rembourser` a bien ete effectue, cocher la ligne et ajouter une note courte;
  - sinon, garder la ligne non cochee et reformuler la checklist en "preuve UI clic remboursement a refaire".

### Critere d'acceptation

- La checklist ne se contredit plus.
- Aucun recodage du flux refund n'est fait sans bug concret.

## 7. Checkout redirect sandbox

### Objectif

Le parsing du retour Stripe sur `/checkout` existe. Il manque la preuve runtime avec au moins un moyen de paiement redirect sandbox.

### Actions

- Verifier quels moyens redirect sont actifs dans Stripe sandbox.
- Activer seulement un moyen sandbox si necessaire et documenter la decision.
- Executer un paiement sandbox redirect sur `/checkout`.
- Verifier au retour:
  - `order_success`;
  - `order_id`;
  - `payment_intent_client_secret`;
  - `redirect_status`;
  - etat UI succes/echec/en cours;
  - commande Firestore finale;
  - webhook signe si le moyen declenche un event asynchrone.

### Critere d'acceptation

- Une preuve runtime est ajoutee au rapport ou au runbook.
- Les warnings Stripe `payment method not activated` sont absents ou documentes avec cause.
- Les moyens non actifs en prod ne sont pas annonces dans l'UI publique.

## 8. App Check enforcement readiness: migrer les chemins restants

### Objectif

Faire passer les chemins Firestore/Functions/legacy-config par une initialisation App Check avant tout enforcement.

### Actions

- Lancer l'audit courant.
- Classer les 51 chemins signales:
  - Firestore client;
  - Functions client;
  - Storage deja migre;
  - legacy-config a supprimer ou adapter;
  - faux positifs.
- Migrer par petits lots coherents.
- Ne pas changer le comportement metier.
- Garder `UNENFORCED` en sandbox tant que les flux critiques ne sont pas verts.

### Commandes utiles

```powershell
npm run appcheck:audit
rg -n "from ['\\\"]src/kit/config/firebase|from ['\\\"].*/firebase|firebaseStorage|getFirestore\\(|getFunctions\\(|httpsCallable\\(" src app scripts
```

### Fichiers probables

- `src/kit/config/firebaseCore*`
- `src/kit/config/firebaseLazy*`
- modules panier/auth/admin/checkout qui importent Firestore ou Functions directement
- scripts d'audit App Check si les faux positifs doivent etre mieux classes

### Critere d'acceptation

- `npm run appcheck:audit` ne signale plus les chemins critiques, ou les faux positifs sont documentes.
- Firestore, Functions et Storage peuvent etre testes service par service.
- Aucun debug token n'est utilise hors sandbox/CI controlee.

## 9. Decision Phase 3

### Autoriser Phase 3 uniquement si

- Revalidation catalogue prouvee ou reportee explicitement.
- Webhook signe/email sandbox prouves ou reportes explicitement.
- App Check sandbox telemetrie lue et decision enforcement documentee.
- App Check paths critiques migres ou plan de migration restant documente avec risque.
- Checkout redirect prouve ou reporte explicitement.
- Rail prod absent clairement note comme blocage prod, pas comme P0 sandbox.

### Message attendu dans le rapport

```text
Decision Phase 3: autorisee / non autorisee.
Raison:
- ...
Restes bloques:
- ...
Prochaine premiere tache:
- ...
```

## Checklist condensable dans `TODO.md`

- [ ] Prod rail: confirme ou reporte car absent.
- [ ] App Check sandbox telemetrie Firestore/Functions/Storage lue.
- [ ] ID token admin automatisable disponible hors Google interactif.
- [ ] `/api/revalidate-catalog` prouve sur galerie/categorie/produit/sitemap.
- [ ] Stripe webhook signe sandbox prouve.
- [ ] Email commande sandbox prouve ou explicitement non applicable.
- [ ] Incoherence refund `cliquer Rembourser` clarifiee.
- [ ] Checkout redirect sandbox prouve.
- [ ] `npm run appcheck:audit` traite ou reste documente par lots.
- [ ] Decision Phase 3 ecrite.

## Journal implementation - 2026-06-24

- `scripts/e2e-revalidate-catalog.mjs` supporte maintenant un mode admin non interactif via `E2E_ADMIN_UID`: custom token Firebase Admin, echange Identity Toolkit, appel `/api/revalidate-catalog`, puis controle galerie/categorie/produit/sitemap.
- Le script charge `.env.sandbox`, `logs/e2e-mail.env` et `logs/e2e-admin.env`, force le quota/project sandbox pour eviter les restes d'anciens projets, et classe les erreurs connues (`known-admin-otp-blocked`, `known-adc-project-mismatch`, `known-adc-signer-missing`, `known-iam-signblob-missing`).
- Run tente le 2026-06-24: le script atteint la creation de custom token mais l'ADC local n'a pas `iam.serviceAccounts.signBlob` sur le service account signataire. La revalidation effective reste donc a prouver apres correction IAM ou fourniture d'un service account local hors repo.
- Suite 2026-06-24: `roles/iam.serviceAccountTokenCreator` a ete ajoute pour `matthis.fradin2@gmail.com` sur `secondevienextjsssr@appspot.gserviceaccount.com` puis au niveau projet sandbox, mais `sign-blob` restait refuse sur ce service account.
- Fallback implemente et prouve: si `E2E_ADMIN_PASSWORD` est present hors repo, le script obtient un ID token admin via Identity Toolkit `signInWithPassword`.
- Preuve revalidation passee: `logs/revalidate-catalog-e2e-2026-06-24T16-05-12-902Z.json`, API 200, `/galerie`, `/categorie/meubles`, `/produit/buffet-VdMQLvZvXJL7mKVxCBvb` et `/sitemap.xml` en 200.
- `src/kit/config/firebase.js` initialise App Check avant les instances legacy `db` / `functions`, afin de securiser les consommateurs existants sans refactor massif du back-office.
- `scripts/audit-app-check-paths.cjs` distingue maintenant les creations reelles d'instances Firebase des imports modulaires utilitaires. Validation: `npm run appcheck:audit` OK avec `findingCount=0`.
- `TODO.md` clarifie l'incoherence refund: le refund est prouve via callables admin + Stripe + Firestore + webhook, mais le clic UI strict `Rembourser` reste non coche car il n'a pas ete rejoue avant remboursement sur la commande deja `refunded`.
