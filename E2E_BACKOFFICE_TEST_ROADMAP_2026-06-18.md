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
