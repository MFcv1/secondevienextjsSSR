# Rapport infra prod Phase 2 - 2026-06-14

## Perimetre

Passe initiale appliquee dans l'ordre de priorite `TODO.md`, sans validation longue, build, serveur local, Playwright ni paiement Stripe reel.

## Sources fiables consultees

- Next.js Environment Variables: https://nextjs.org/docs/app/guides/environment-variables
- Next.js revalidatePath: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- Next.js revalidateTag: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- Firebase App Hosting configuration: https://firebase.google.com/docs/app-hosting/configure
- Firebase App Check reCAPTCHA v3 Web: https://firebase.google.com/docs/app-check/web/recaptcha-provider
- Stripe webhook signature verification: https://docs.stripe.com/webhooks/signature

## Correctifs appliques

- `.firebaseignore` exclut maintenant explicitement `.env*`, `service-account.json`, `*.pem` et `*.key`.
- `.env.sandbox.example` et `.env.production.example` exposent les placeholders publics Next manquants `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` et `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`.
- `scripts/audit-infra-env.cjs` cartographie les variables publiques Next, App Hosting, Functions, Stripe, Gmail/email, revalidation et admin/security.
- `package.json` expose `npm run infra:env`.
- `/api/revalidate-catalog` revalide maintenant aussi `/galerie`, `/sitemap.xml`, les patterns dynamiques `/categorie/[categoryId]` et `/produit/[slugOrId]`, et garde les chemins precis envoyes par l'admin.
- Les surfaces publiques `AuthContext`, `HeaderAccountIsland` et `GlobalMenuPanelAuthIsland` ne donnent plus le statut admin via `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`; elles s'appuient sur le custom claim `admin`.
- `functions/src/auth/grantAdmin.js` attribue le custom claim admin au `SUPER_ADMIN_EMAIL` configure cote serveur lors de la creation du compte.
- `sendTestEmail` est exportee et protegee par `checkIsAdmin`.
- `CheckoutPaymentStep` remplace le `return_url` legacy `/?order_success=true` par `/checkout?order_success=true` avec `order_id` si disponible.
- `stripeWebhook` refuse les methodes non-POST, exige `req.rawBody` pour la verification de signature Stripe, renvoie `500` sur erreur de handler et garde un verrou idempotent `processing` / `processed` / `failed`.

## Decisions

- `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` ne doit plus servir de logique d'autorisation sur les surfaces publiques. Les droits runtime doivent venir des custom claims ou des verifications serveur.
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` est une cle publique App Check; elle doit etre configuree pour le build App Hosting, puis l'enforcement doit etre verifie dans la console Firebase.
- Les secrets Functions restent hors `NEXT_PUBLIC_*`: `STRIPE_SECRET_KEY`, `STRIPE_WH_SECRET`, `GMAIL_EMAIL`, `GMAIL_PASSWORD`, `SUPER_ADMIN_EMAIL`.
- `revalidateTag(tag)` est conserve sans deuxieme argument pour rester compatible avec le Next installe (`15.3.0`), meme si la documentation Next actuelle recommande les profils de revalidation plus explicites.

## Gates et commandes lancees

- `node --check app\api\revalidate-catalog\route.js` par l'agent revalidation.
- `node --check scripts\audit-infra-env.cjs` par l'agent env.
- `npm run infra:env` par l'agent env: echec attendu tant que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` manque dans `apphosting.yaml`.
- `node --check functions/src/auth/grantAdmin.js`
- `node --check functions/src/email/orderEmails.js`
- `node --check functions/src/commerce/stripeWebhook.js`
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- `npx eslint src/kit/commerce/CheckoutPaymentStep.jsx src/kit/contexts/AuthContext.jsx src/kit/marketplace/HeaderAccountIsland.jsx src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx app/api/revalidate-catalog/route.js`: exit 0, mais les fichiers JSX sont ignores par la configuration ESLint courante.

## Risques restants

- Verifier dans Firebase Console que les valeurs App Hosting sandbox/prod correspondent au rail vise; la console peut surcharger `apphosting.yaml`.
- Ajouter la vraie `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` App Check dans App Hosting sandbox/prod, puis verifier l'enforcement App Check.
- Verifier `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` App Hosting et la separation des secrets webhook sandbox/prod.
- Tester le flux runtime complet: mutation admin, bump `public/meta.catalogVersion`, appel `/api/revalidate-catalog`, puis mise a jour `/galerie`, `/categorie/[categoryId]`, `/produit/[slugOrId]` et `/sitemap.xml`.
- Tester Stripe sandbox complet avec webhook signe, creation commande, decrement stock, emails, annulation et restauration.
- Clarifier plus tard `public/og-image.jpg` absent et les fonctions SEO legacy liees aux rewrites Firebase Hosting.
