# Roadmap E2E client + back-office sandbox - 2026-06-18

Ce document sert de point de reprise pour relancer une grosse passe de verification dans une autre conversation Codex.

## Contexte de test

- Projet Firebase sandbox: `secondevienextjsssr`
- App Hosting sandbox: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`
- Email boîte test: `loa.gto15@gmail.com`
- Compte admin test Firebase Auth:
  - email: `loa.gto15@gmail.com`
  - uid: `VReuoj5dgiRByGXcCptaX9S0vhF3`
  - `emailVerified: true`
  - custom claims: `admin: true`, `superAdmin: false`
  - role Firestore: `admin`
- Mot de passe admin test local: `logs/e2e-admin.env` (ignore Git, ne pas committer).
- Boîte IMAP test local: `logs/e2e-mail.env` (ignore Git, ne pas committer).
- Token preuve serveur local: `logs/e2e-proof-token.txt` (ignore Git, ne pas committer).

Le compte `loa.gto15@gmail.com` doit rester un compte sandbox de verification. Ne pas l'utiliser en production.

## Ce qui a deja ete audite

Run de reference:

- Parcours: visiteur invite -> panier -> checkout -> OTP email -> Stripe sandbox -> confirmation serveur -> preuve serveur.
- Fichier brut du run: `logs/hosted-stripe-e2e-2026-06-18T17-12-44-576Z.json`
- Fichier preuve serveur: `logs/hosted-stripe-e2e-2026-06-18T17-12-44-576Z.proof.json`

Preuves obtenues:

- OTP checkout invite valide via Gmail.
- Recap checkout conserve pendant Stripe malgre reservation stock.
- Stripe PaymentIntent: `succeeded`.
- Firestore order: `status = paid`.
- Webhook Stripe: event `payment_intent.succeeded` retrouve.
- Idempotence webhook: `processed`.
- Email client envoye.
- Email admin envoye.
- Stock final du produit commande: `stock: 0`, `sold: true`.
- Produit du run: `Paire de chevets`.
- Total du run: `140 EUR`.

Run hardening Stripe/Firebase complementaire:

- Fichier preuve serveur: `logs/stripe-hardening-proof-2026-06-18T21-26-40.json`
- Helper serveur protege: `e2eStripeHardeningProof`
- Le helper a active `payment_intent.canceled` sur l'endpoint webhook Stripe sandbox.
- Un ordre E2E precedent reste reserve apres absence de webhook `canceled` a ete nettoye (`staleCleanupCount: 1`).
- Double appel `createOrder` avec le meme `clientOrderId`: meme `orderId`, meme `PaymentIntent`, second appel marque `reused: true`.
- Stripe PaymentIntent annule: `status = canceled`.
- Webhook `payment_intent.canceled`: idempotence `processed`.
- Firestore order final: `status = canceled`, `stockReserved = false`.
- Stock produit restaure au niveau initial.

Assertions preuve serveur:

```json
{
  "orderPaid": true,
  "paymentIntentSucceeded": true,
  "metadataMatchesOrder": true,
  "webhookProcessed": true,
  "emailAttempted": true,
  "clientEmailSent": true,
  "stockStillReservedForOrder": true
}
```

## Corrections faites pendant la passe

- Le mode E2E `guest-otp` ne force plus une session Firebase Auth inexistante.
- Le parseur IMAP OTP ignore les nombres techniques des headers SMTP et cible le code du corps du mail.
- Le script E2E supporte un email checkout different de la boîte IMAP via `E2E_MAILBOX_USER`, utile pour les alias Gmail `+sv-e2e-*`.
- Le script saisit le code OTP comme un humain et attend le bouton de validation.
- La confirmation paiement invite ne depend plus uniquement du listener Firestore direct sur `orders/{orderId}`.
- Ajout de `getOrderStatusClient`: Function callable minimale qui retourne le statut commande apres verification Auth ou token OTP invite.
- La popup Stripe utilise `getOrderStatusClient` en fallback si Firestore refuse le listener direct.
- La preuve serveur `e2eCheckoutProof` verifie commande, PaymentIntent, webhook/idempotence, emailProof et stock final.
- Les emails de commande enregistrent une preuve `emailProof` sur la commande.

## Bugs ou points faibles rencontres

1. Le script E2E confondait mode invite et mode utilisateur connecte.
   - Symptome: `Firebase browser auth user was not persisted after login`.
   - Corrige dans le script.

2. Le parseur OTP lisait parfois un nombre a 6 chiffres dans les headers SMTP.
   - Symptome: code lu depuis Gmail mais refuse par l'app.
   - Corrige dans le script.

3. Le rate-limit OTP bloque vite les tests repetes sur le meme email.
   - Symptome: `Trop de codes demandes pour cet email`.
   - Mitigation: utiliser des alias Gmail `loa.gto15+sv-e2e-<timestamp>@gmail.com` comme email checkout, avec `E2E_MAILBOX_USER=loa.gto15@gmail.com`.

4. Le listener Firestore direct sur `orders/{orderId}` ne marche pas pour un invite non authentifie.
   - Symptome apres paiement Stripe: `Missing or insufficient permissions`.
   - Corrige par fallback callable `getOrderStatusClient`.

5. Les assertions de succes E2E etaient trop strictes sur le wording UI.
   - Symptome: ecran reel OK mais test KO car texte attendu ancien.
   - Corrige dans le script.

6. Apres paiement, l'UI peut afficher en meme temps un bloc `Victime de son succes` et le succes commande.
   - Cause probable: la reservation stock fait reagir l'observation panier/stock live alors que la commande vient d'etre confirmee.
   - A verifier visuellement: le succes doit dominer; le message d'indisponibilite ne doit pas perturber l'utilisateur apres paiement.

7. Le JSON de preuve serveur ne contient pas encore le stock avant paiement.
   - TODO: enrichir le script pour enregistrer `stockBefore` au moment de la selection produit.

## Reprise Codex - 2026-06-18 soir

Tests et corrections ajoutes pendant la reprise:

- Phase 3 back-office testee en local Next `http://localhost:3010` branche sur la sandbox, avec le compte admin `loa.gto15@gmail.com`.
- Resultat Phase 3 local: acces admin autorise, aucun libelle super-admin visible, commande payee invite visible apres ouverture de l'onglet `Ventes`, statut paye, produit `Paire de chevets`, total `140`, paiement Stripe, blocage `Refund Stripe requis`, PaymentIntent visible, preuves email client/admin visibles.
- Export CSV admin teste: telechargement OK, email commande present, PaymentIntent present, colonnes preuves email presentes.
- Phase 2 espace client: le parcours OTP client sur l'alias de commande a prouve l'acces a `/mes-commandes`, la commande payee, le total, l'adresse/facture et l'absence de bouton `Annuler` pour la commande Stripe payee. Une relance apres ajout du libelle produit a ete instable a cause du flux OTP/modal apres plusieurs codes; a retester au calme ou via un harnais auth dedie.
- Blocage UX corrige: le fallback signe-out de `/mes-commandes` propose maintenant un bouton direct `Se connecter` en plus du retour galerie, utile surtout mobile ou la connexion header est cachee.
- Lisibilite client corrigee: les lignes de commandes affichent maintenant un resume des articles, par exemple `Paire de chevets`.
- Bug post-paiement corrige: apres confirmation Stripe durable, le checkout passe en etat terminal `order_success` et vide les indisponibilites locales pour eviter que `Victime de son succes` masque le succes commande.
- Admin corrige: l'onglet commandes charge 50 commandes par defaut, affiche PaymentIntent, methode de verification et preuves email, exporte ces traces en CSV, et ne propose plus `Reouvrir` sur une commande Stripe deja payee/livree.
- Fiche produit corrigee: une fiche produit vendue/stock 0 desactive les boutons panier desktop et mobile avec le libelle `Indisponible`.
- Phase 4 corrigee cote webhook: si un `payment_intent.payment_failed` temporaire restaure le stock puis qu'un retry du meme PaymentIntent reussit, le handler `payment_intent.succeeded` tente de reserver a nouveau le stock en transaction avant de marquer la commande `paid`; en cas de conflit, la commande est marquee avec `fulfillmentConflict`.

Validations lancees:

- `node --check functions/src/commerce/stripeWebhook.js` OK.
- `git diff --check` OK.
- `npm run lint` OK.
- Playwright local admin Phase 3 OK sur `http://localhost:3010` avec donnees sandbox.

Reprise suivante - 2026-06-18 soir:

- Phase 5 implementee cote serveur/UI: `refundOrderAdmin` appelle Stripe Refund avec cle d'idempotence par commande/PaymentIntent, conserve la commande, expose les statuts `refund_pending`, `refunded`, `refund_failed`, et ne remet le stock en vente que via l'action admin explicite `Refund + stock`.
- Back-office branche sur le refund serveur: une commande Stripe payee affiche `Rembourser` et `Refund + stock` au lieu d'une annulation/suppression libre.
- Preuve E2E enrichie: `scripts/e2e-hosted-stripe-checkout.mjs` envoie `stockBefore` et `selectedProduct` a `e2eCheckoutProof`; la preuve expose `stockBefore` et l'assertion `stockDecrementedFromBefore`.
- Scenarios negatifs prepares: le script E2E accepte `E2E_STRIPE_CARD` et `E2E_EXPECT_STRIPE_FAILURE=true` pour rejouer une carte Stripe refusee sans dupliquer le parcours.
- Deploy sandbox effectue: codebase Functions `main` redeploye, `refundOrderAdmin` actif, `stripeWebhook` version 16, `e2eCheckoutProof` redeploye, puis App Hosting `secondevie-next-sandbox` relance.
- Run succes heberge OK: `logs/hosted-stripe-e2e-2026-06-18T18-20-27-462Z.json`, commande `q1tUtmNyjNpSeUTjGyFW`, PaymentIntent `pi_3TjkYbRdWb0VNdZq1dXDmDiR`, statut `paid`, webhook `processed`, emails client/admin envoyes, stock `Table` `1 -> 0`.
- Run negatif carte refusee OK: `logs/hosted-stripe-e2e-2026-06-18T18-24-35-852Z.json`, puis preuve serveur apres webhook: commande `4HTLjAn3nsA1prJEUq6S`, statut `payment_failed`, PaymentIntent `requires_payment_method`, stock `Paire de chevets` restaure `1`, produit non vendu.
- Refund admin sandbox OK: callable `refundOrderAdmin` appelee avec admin test sur la commande succes, Refund Stripe `re_3TjkYbRdWb0VNdZq1SLulN7D`, statut commande `refunded`, stock `Table` restaure `1`, produit non vendu.

Limites restantes:

- Phase 4 `payment_intent.payment_failed` est validee par carte refusee et restauration stock; `payment_intent.canceled` reste a verifier via Stripe Dashboard/CLI ou un harnais serveur dedie.
- Phase 5 refund serveur est validee par l'API Stripe sandbox; il reste seulement a verifier visuellement le Refund dans Stripe Dashboard si besoin.

## Commandes de reprise

Verifier que les secrets locaux existent:

```powershell
Test-Path logs/e2e-mail.env
Test-Path logs/e2e-admin.env
Test-Path logs/e2e-proof-token.txt
```

Relancer un paiement invite complet avec alias Gmail:

```powershell
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$env:E2E_EMAIL = "loa.gto15+sv-e2e-$stamp@gmail.com"
$env:E2E_MAILBOX_USER = "loa.gto15@gmail.com"
$env:E2E_HEADLESS = "true"
Remove-Item Env:E2E_OTP_CODE -ErrorAction SilentlyContinue
npm run e2e:hosted-stripe
```

Lire le dernier resultat:

```powershell
Get-ChildItem logs -Filter 'hosted-stripe-e2e-*.json' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 Name,LastWriteTime,Length
```

## Roadmap automatisee cible

### Phase 1 - Client invite

- Acheter un produit en invite avec alias Gmail.
- Verifier:
  - OTP reçu et valide;
  - bouton paiement actif uniquement apres email verifie + CGV + livraison;
  - recap conserve meuble + livraison;
  - PaymentIntent `succeeded`;
  - commande `paid`;
  - webhook `processed`;
  - email client/admin envoye;
  - stock final vendu/reserve.

### Phase 2 - Espace client

- Se connecter avec le compte client lie a l'email de commande ou tester l'acces commande invite si prevu.
- Verifier:
  - la commande apparait dans `Mes commandes`;
  - total, produit, livraison, statut et date sont coherents;
  - aucune annulation libre n'est proposee pour une commande Stripe payee;
  - facture ou recap telechargeable si disponible;
  - message email/paiement coherent.

### Phase 3 - Back-office admin

- Se connecter a `/admin` avec `loa.gto15@gmail.com` et le mot de passe de `logs/e2e-admin.env`.
- Verifier:
  - acces admin autorise;
  - pas de droits super-admin visibles;
  - commande payee visible dans la liste commandes;
  - produit, email client, PaymentIntent, montant, livraison et statut `paid` visibles;
  - stock produit visible comme vendu/reserve;
  - action d'annulation libre bloquee pour Stripe paye;
  - trace email et trace paiement exploitables;
  - exports CSV ne cassent pas.

### Phase 4 - Scenarios negatifs Stripe

- Simuler `payment_intent.payment_failed`.
- Simuler `payment_intent.canceled`.
- Verifier:
  - statut commande attendu;
  - stock restaure;
  - espace client coherent;
  - admin coherent;
  - logs Functions sans erreur critique.

### Phase 5 - Remboursement admin

- Implementer puis tester un flux refund serveur.
- Verifier:
  - statuts `refund_pending`, `refunded`, `refund_failed`;
  - Stripe Refund idempotent;
  - commande conservee dans l'historique;
  - stock restaure seulement apres action explicite;
  - trace admin/client lisible.

### Phase 6 - Redirect Stripe

- Tester un moyen de paiement redirect sandbox.
- Verifier:
  - retour `/checkout` avec `redirect_status`;
  - UI en cours/succes/echec correcte;
  - commande finalisee seulement apres confirmation durable.

## Consignes pour une autre conversation Codex

1. Lire `AGENTS.md`, puis ce fichier.
2. Ne jamais afficher les secrets contenus dans `logs/*.env` ou `logs/*token*`.
3. Utiliser uniquement la sandbox App Hosting.
4. Preferer les alias Gmail pour eviter le rate-limit OTP.
5. Apres chaque run paye, interroger `e2eCheckoutProof` et archiver le JSON de preuve dans `logs/`.
6. Mettre a jour ce fichier avec chaque bug rencontre, correction appliquee et preuve obtenue.
