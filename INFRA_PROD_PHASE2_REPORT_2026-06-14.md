# Rapport infra prod Phase 2 - 2026-06-14

## Perimetre

Passe initiale appliquee dans l'ordre de priorite `TODO.md`, sans validation longue, build, serveur local, Playwright ni paiement Stripe reel.

## Sources fiables consultees

- Next.js Environment Variables: https://nextjs.org/docs/app/guides/environment-variables
- Next.js revalidatePath: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- Next.js revalidateTag: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- Firebase App Hosting configuration: https://firebase.google.com/docs/app-hosting/configure
- Firebase App Check reCAPTCHA v3 Web: https://firebase.google.com/docs/app-check/web/recaptcha-provider
- Next.js Environment Variables, mise a jour consultee le 2026-06-14: les variables `NEXT_PUBLIC_*` sont inlinees au build et envoyees au navigateur.
- Firebase App Hosting configuration, mise a jour consultee le 2026-06-14: `apphosting.yaml` supporte les references `secret:` vers Cloud Secret Manager pour eviter de versionner des valeurs sensibles.
- Stripe webhook signature verification: https://docs.stripe.com/webhooks/signature
- Stripe API keys, mise a jour consultee le 2026-06-14: les cles sandbox `pk_test_...` sont publiables et utilisables cote frontend; les cles `sk_test_...` et secrets webhook restent cote serveur/Secret Manager.

## Correctifs appliques

- `.firebaseignore` exclut maintenant explicitement `.env*`, `service-account.json`, `*.pem` et `*.key`.
- `.env.sandbox.example` et `.env.production.example` exposent les placeholders publics Next manquants `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` et `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`.
- `scripts/audit-infra-env.cjs` cartographie les variables publiques Next, App Hosting, Functions, Stripe, Gmail/email, revalidation et admin/security.
- `scripts/audit-infra-deploy.cjs` verifie le rail sandbox, les ignores App Hosting, les codebases Functions, les chemins rules/indexes, les secrets interdits dans App Hosting/public Functions, et signale les rewrites Hosting SEO legacy.
- `package.json` expose `npm run infra:env` et `npm run infra:deploy`.
- `/api/revalidate-catalog` revalide maintenant aussi `/galerie`, `/sitemap.xml`, les patterns dynamiques `/categorie/[categoryId]` et `/produit/[slugOrId]`, et garde les chemins precis envoyes par l'admin.
- Les surfaces publiques `AuthContext`, `HeaderAccountIsland` et `GlobalMenuPanelAuthIsland` ne donnent plus le statut admin via `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`; elles s'appuient sur les custom claims `admin` / `superAdmin`.
- `AdminDashboard` et `AdminUsers` ne lisent plus `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`; les commandes critiques et le statut proprietaire viennent du claim `superAdmin` ou du document serveur `admin_users`.
- `functions/src/auth/grantAdmin.js` attribue les custom claims `admin` et `superAdmin` au `SUPER_ADMIN_EMAIL` configure cote serveur lors de la creation du compte.
- `syncSuperAdminClaim` a ete ajoutee et exportee pour bootstrapper un compte super-admin deja existant: la Function verifie cote serveur `SUPER_ADMIN_EMAIL`, pose les claims `admin`/`superAdmin`, puis met a jour `sys_metadata/admin_users` et `users/{uid}`.
- Le flux `AdminUsers` -> `addAdminUser` -> `grantAdminOnAuth` a ete verifie pour l'ajout d'une cliente testeuse: l'onglet admin appelle bien la Function, qui ajoute soit un admin actif si le compte existe deja, soit une entree `pending_*` transformee en admin au premier login. Les emails sont maintenant normalises en minuscules cote Functions pour eviter un echec lie a la casse.
- `functions/helpers/security.js`, `/api/revalidate-catalog` et les fonctions analytics acceptent le claim `superAdmin` en plus du fallback email serveur.
- `apphosting.yaml` ne versionne plus la valeur `SUPER_ADMIN_EMAIL` en clair; la variable runtime reference maintenant le secret Cloud Secret Manager `SUPER_ADMIN_EMAIL`.
- `sendTestEmail` est exportee et protegee par `checkIsAdmin`.
- `CheckoutPaymentStep` remplace le `return_url` legacy `/?order_success=true` par `/checkout?order_success=true` avec `order_id` si disponible.
- `stripeWebhook` refuse les methodes non-POST, exige `req.rawBody` pour la verification de signature Stripe, renvoie `500` sur erreur de handler et garde un verrou idempotent `processing` / `processed` / `failed`.
- `functions-public/src/public/catalog.js` reste le seul export HTTP `publicCatalog` actif dans le codebase `functions-public`; le codebase `functions` principal ne l'exporte pas.
- `apphosting.yaml` declare maintenant `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` avec le placeholder `REPLACE_WITH_RECAPTCHA_SITE_KEY`; la vraie cle site reCAPTCHA/App Check doit remplacer ce placeholder avant deploy sandbox.

## Decisions

- `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` est retire: l'email super-admin ne doit plus etre expose au navigateur ni versionne dans App Hosting. Les droits runtime viennent des custom claims ou des verifications serveur.
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` est une cle publique App Check; elle doit etre configuree pour le build App Hosting, puis l'enforcement doit etre verifie dans la console Firebase.
- Aucune valeur App Check sandbox n'est presente dans `.env.sandbox`; le placeholder App Hosting ne vaut pas validation App Check tant que la vraie cle site publique Firebase/App Check n'est pas collee.
- Le rail actuel reste sandbox-only: `.firebaserc` pointe `default` vers `secondevienextjsssr`, `firebase.json` declare `secondevie-next-sandbox`, et aucun rail App Hosting prod n'est encore configure dans ce clone.
- Les secrets Functions restent hors `NEXT_PUBLIC_*`: `STRIPE_SECRET_KEY`, `STRIPE_WH_SECRET`, `GMAIL_EMAIL`, `GMAIL_PASSWORD`, `SUPER_ADMIN_EMAIL`.
- Le prochain rollout App Hosting necessite que le secret `SUPER_ADMIN_EMAIL` existe dans Cloud Secret Manager/Firebase App Hosting.
- `revalidateTag(tag)` est conserve sans deuxieme argument pour rester compatible avec le Next installe (`15.3.0`), meme si la documentation Next actuelle recommande les profils de revalidation plus explicites.

## Gates et commandes lancees

- `node --check app\api\revalidate-catalog\route.js` par l'agent revalidation.
- `node --check scripts\audit-infra-env.cjs` par l'agent env.
- `npm run infra:env` par l'agent env: echec attendu tant que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` manque dans `apphosting.yaml`.
- `npm run infra:env` relance le 2026-06-14 avant placeholder: echec confirme, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` absent; `.env.sandbox` ne contient pas non plus de valeur App Check.
- `node --check scripts/audit-infra-deploy.cjs`
- `npm run infra:deploy`: OK, avec warning attendu sur les rewrites Hosting SEO legacy.
- `rg "publicCatalog|exports\\.public|functions-public|cloudfunctions\\.net/publicCatalog" functions functions-public app src scripts firebase.json`: confirme que `functions-public/index.js` exporte seul `publicCatalog`.
- `node --check functions/src/auth/grantAdmin.js`
- `node --check functions/helpers/security.js`
- `node --check functions/src/auth/adminManagement.js`
- `node --check functions/index.js`
- `node --check functions/src/auth/grantAdmin.js` apres normalisation des emails admin.
- `node --check functions/src/analytics/updateUserSessions.js`
- `node --check functions/src/analytics/adminIP.js`
- `node --check functions/src/analytics/sessions.js`
- `node --check functions/src/email/orderEmails.js`
- `node --check functions/src/commerce/stripeWebhook.js`
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- `npx eslint src/kit/commerce/CheckoutPaymentStep.jsx src/kit/contexts/AuthContext.jsx src/kit/marketplace/HeaderAccountIsland.jsx src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx app/api/revalidate-catalog/route.js`: exit 0, mais les fichiers JSX sont ignores par la configuration ESLint courante.
- `npm run infra:env`: OK apres retrait de `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`; warnings restants sur `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, variables publiques business/contact/facture App Hosting et mapping local `VITE_*`.
- `rg "NEXT_PUBLIC_SUPER_ADMIN_EMAIL" app src functions apphosting.yaml .env.sandbox.example .env.production.example`: aucune occurrence active restante.
- `npx eslint src/kit/admin/AdminDashboard.jsx src/kit/admin/AdminUsers.jsx src/kit/contexts/AuthContext.jsx`: exit 0, mais ces fichiers JSX sont ignores par la configuration ESLint courante.
- Tentative de validation Firebase Console/CLI App Check: la CLI locale ne liste pas de commande `appcheck`, et `firebase apps:list WEB --project secondevienextjsssr` est bloque par `firebase login --reauth`. Validation console/runtime App Check encore manuelle.
- Apres `firebase login --reauth`, validation Firebase/App Check sandbox via CLI/API:
  - `firebase apps:list WEB --project secondevienextjsssr`: app Web `secondevie-next-sandbox` trouvee avec l'App ID attendu.
  - `firebase apphosting:backends:list --project secondevienextjsssr`: backend `secondevie-next-sandbox` trouve, domaine sandbox confirme.
  - API Firebase App Check `recaptchaV3Config`: `siteSecretSet=true`, `tokenTtl=86400s`, `minValidScore=0.5`.
  - API Firebase App Check `services`: Firestore, Storage et Identity Toolkit sont en `UNENFORCED`; decision monitoring confirmee, pas d'enforcement actif.
  - `firebase apphosting:secrets:describe SUPER_ADMIN_EMAIL --project secondevienextjsssr`: echec 404, secret App Hosting encore absent.
- Secret App Hosting `SUPER_ADMIN_EMAIL` cree depuis `.env.sandbox` sans afficher la valeur, puis verifie:
  - `firebase apphosting:secrets:describe SUPER_ADMIN_EMAIL --project secondevienextjsssr`: version 1 `ENABLED`.
  - `firebase apphosting:secrets:grantaccess SUPER_ADMIN_EMAIL --backend secondevie-next-sandbox --location europe-west4 --project secondevienextjsssr`: IAM binding applique au backend sandbox.
- `NEXT_PUBLIC_SITE_URL` sandbox valide:
  - `apphosting.yaml` pointe vers `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.
  - Requete HTTPS `HEAD` sur le domaine sandbox: status `200`.
- Decision Stripe sandbox: utiliser temporairement le compte Stripe test de Matthieu pour les validations avant que la cliente fournisse son compte Stripe. La variable App Hosting a ajouter est uniquement `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` avec une cle `pk_test_...`; les secrets `STRIPE_SECRET_KEY` et `STRIPE_WH_SECRET` restent serveur/Secret Manager.
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` sandbox ajoute dans `apphosting.yaml` avec la cle publique test du compte Stripe de Matthieu. `npm run infra:env` ne remonte plus le warning Stripe public.
- `STRIPE_SECRET_KEY` sandbox cree en secret Firebase Functions sans exposer la valeur dans le chat. Firebase a cree la version 2 et redeploye `createOrder(us-central1)` et `stripeWebhook(us-central1)` sur cette version.
- Verification post-secret Stripe:
  - `firebase functions:secrets:get STRIPE_SECRET_KEY --project secondevienextjsssr`: version 2 `ENABLED`.
  - `firebase functions:list --project secondevienextjsssr`: `createOrder` callable et `stripeWebhook` HTTPS sont deployees en `us-central1`.
- Endpoint webhook Stripe sandbox cree dans le dashboard Stripe test avec l'URL `https://us-central1-secondevienextjsssr.cloudfunctions.net/stripeWebhook` et les evenements `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `payment_intent.succeeded`.
- `STRIPE_WH_SECRET` sandbox cree en secret Firebase Functions sans exposer la valeur dans le chat. Firebase a cree la version 2 et redeploye `stripeWebhook(us-central1)`.
- Verification post-secret webhook:
  - `firebase functions:secrets:get STRIPE_WH_SECRET --project secondevienextjsssr`: version 2 `ENABLED`.
  - `firebase functions:list --project secondevienextjsssr`: `stripeWebhook` HTTPS est deployee en `us-central1`.
- Audit des valeurs publiques business/facture: `.env.sandbox` et `.env.production` ne contiennent pas les cles `NEXT_PUBLIC_*` correspondantes; seul `VITE_CONTACT_NAME` est present localement. Les autres valeurs doivent etre fournies avant synchronisation App Hosting.

## Risques restants

- Verifier dans Firebase Console que les valeurs App Hosting sandbox/prod correspondent au rail vise; la console peut surcharger `apphosting.yaml`.
- Observer les requetes App Check dans Firebase Console apres prochain rollout sandbox pour confirmer la telemetrie runtime.
- Ajouter la vraie `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` App Check dans le futur rail prod, puis verifier l'enforcement App Check prod.
- Ajouter aussi `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` et les variables publiques business/contact/facture dans App Hosting si elles doivent alimenter les factures et surfaces publiques deployees.
- Verifier `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` App Hosting et la separation des secrets webhook sandbox/prod.
- Tester le flux runtime complet: mutation admin, bump `public/meta.catalogVersion`, appel `/api/revalidate-catalog`, puis mise a jour `/galerie`, `/categorie/[categoryId]`, `/produit/[slugOrId]` et `/sitemap.xml`.
- Tester Stripe sandbox complet avec webhook signe, creation commande, decrement stock, emails, annulation et restauration.
- Clarifier plus tard `public/og-image.jpg` absent et les fonctions SEO legacy liees aux rewrites Firebase Hosting.
