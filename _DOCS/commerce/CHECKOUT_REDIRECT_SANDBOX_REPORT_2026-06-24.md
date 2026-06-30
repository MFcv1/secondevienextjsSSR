# Rapport checkout redirect sandbox - 2026-06-24

## Mission

Tester ou preparer la preuve runtime d'au moins un moyen de paiement redirect sandbox sur `/checkout`.

## Resultat

Statut: non prouve en runtime complet, mais le verrou checkout heberge avant Stripe est leve.

Le harnais E2E a ete etendu pour supporter un paiement redirect iDEAL/Wero sandbox. Apres stabilisation du checkout heberge, le paiement carte atteint le Stripe Payment Element et passe jusqu'a la preuve serveur. Le run iDEAL ne produit pas encore une preuve redirect: Stripe sandbox ne rend pas la banque/methode iDEAL selectable dans la configuration courante.

## Changements effectues

`scripts/e2e-hosted-stripe-checkout.mjs`:

- ajoute `E2E_STRIPE_PAYMENT_METHOD=card|ideal`;
- ajoute `E2E_STRIPE_IDEAL_BANK`;
- ajoute `E2E_STRIPE_AUTHORIZE_REDIRECT`;
- ajoute le mode `E2E_CHECKOUT_MODE=otp-user`, pour connecter un utilisateur par OTP avant de passer au checkout;
- separe la lecture OTP login vs OTP validation checkout;
- ajoute selection iDEAL/Wero dans le Stripe Payment Element;
- ajoute tentative d'autorisation de la page redirect Stripe de test;
- classe `stripe-redirect-method-unavailable` si iDEAL/Wero n'est pas disponible dans Stripe sandbox.
- preserve `emailVerified` et `providerData` dans la synchro auth navigateur, pour eviter de rebasculer a tort sur l'OTP checkout invite;
- utilise la preuve serveur `e2eCheckoutProof` apres paiement au lieu d'une assertion UI trop stricte.

## Commande cible

```powershell
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$env:E2E_EMAIL = "loa.gto15+sv-redirect-$stamp@gmail.com"
$env:E2E_MAILBOX_USER = "loa.gto15@gmail.com"
$env:E2E_CHECKOUT_MODE = "otp-user"
$env:E2E_STRIPE_PAYMENT_METHOD = "ideal"
$env:E2E_STRIPE_IDEAL_BANK = "ING"
$env:E2E_STRIPE_AUTHORIZE_REDIRECT = "true"
$env:E2E_HEADLESS = "true"
$env:FIREBASE_PROJECT_ID = "secondevienextjsssr"
npm run e2e:seed-stripe-product
npm run e2e:hosted-stripe
```

Secrets attendus hors repo:

```text
E2E_GMAIL_APP_PASSWORD
E2E_APPCHECK_DEBUG_TOKEN
```

## Runs observes

Artefact historique bloque avant Stripe:

```text
logs/hosted-stripe-e2e-2026-06-24T17-11-16-486Z.json
```

Resume:

- `checkoutMode=otp-user`;
- `stripePaymentMethod=ideal`;
- `targetProductId=sv-e2e-stripe-refund-product`;
- utilisateur cree/connecte par custom token;
- panier seed effectue sur le produit dedie;
- blocage final: `known-blocked-otp`;
- console: `Guest checkout OTP verify error: FirebaseError: Code invalide`;
- le Payment Element Stripe n'a pas ete atteint sur ce run.

Artefact carte apres stabilisation:

```text
logs/hosted-stripe-e2e-2026-06-24T20-50-15-627Z.json
```

Resume:

- `status=passed`;
- `stripe.paymentElementReady=true`;
- `stripe.paymentMethod=card`;
- commande `AgbBxeY8oNAwx8PIpFGi` en `paid`;
- PaymentIntent `succeeded`;
- webhook idempotence `processed`;
- email client envoye;
- stock decremente depuis le stock Firestore reel.

Artefact iDEAL apres stabilisation:

```text
logs/hosted-stripe-e2e-2026-06-24T20-51-01-227Z.json
```

Resume:

- `checkoutMode=otp-user`;
- `stripePaymentMethod=ideal`;
- produit cible charge depuis Firestore REST (`source=firestore-rest-target-refresh`);
- classification finale `known-blocked-stripe-redirect-method`;
- erreur: `Stripe iDEAL bank "ING" was not selectable.`

## Decision

Ne pas cocher "tester au moins un moyen de paiement redirect en sandbox".

Le code E2E est pret et le checkout heberge est stabilise jusqu'au Payment Element. Le restant est cote configuration/eligibilite Stripe sandbox du moyen redirect iDEAL/Wero.

## Prochaine reprise

1. Verifier dans Stripe Dashboard sandbox que iDEAL/Wero est actif et eligible pour le compte test, la devise EUR et le Payment Element.
2. Relancer `E2E_STRIPE_PAYMENT_METHOD=ideal`.
3. Cocher le TODO uniquement quand le retour `/checkout` contient une preuve `redirect_status` + commande finale coherente.
