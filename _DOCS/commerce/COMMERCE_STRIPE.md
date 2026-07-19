# Commerce, checkout et Stripe

Derniere mise a jour: 2026-07-14
Statut: `PREPROD_READY`

## 1. Perimetre

Le tunnel couvre panier, verification e-mail, reservation stock, paiement Stripe, confirmation par webhook, espace client, annulation admissible, remboursement admin et remise en vente.

Le navigateur orchestre l'UX; Cloud Functions et Stripe sont autoritaires pour prix, stock et paiement.

## 2. Flux d'achat

```text
produit achetable
  -> panier local/Firestore
  -> /checkout dynamique
  -> connexion ou OTP invite
  -> snapshot panier verrouille
  -> createOrder
  -> transaction stock + order pending_payment
  -> Payment Element
  -> Stripe PaymentIntent
  -> webhook signe
  -> order paid
  -> UI de confirmation durable
  -> e-mails + espace client + admin
```

`createOrder` revalide chaque article, le prix, le stock, l'identite et l'e-mail verifie. La disponibilite affichee par le client ne suffit pas.

## 3. Panier et checkout

Composants principaux:

- `CartSidebar` pour le panneau;
- `guestCart.js` pour la persistance visiteur et l'handoff;
- `CheckoutView` pour adresse, livraison et creation de commande;
- `CheckoutStripeModal` pour le suivi durable de commande;
- `CheckoutPaymentStep` pour Stripe Elements.

Pendant le paiement, le recap utilise un snapshot du panier. Une reservation stock ne doit pas faire disparaitre visuellement les articles ou modifier le total deja presente.

## 4. Stock et idempotence

La creation de commande reserve le stock dans une transaction. Le webhook ou le cleanup restaure le stock seulement dans les etats admissibles.

Invariants:

- pas de stock negatif;
- pas de double ligne pour le meme produit;
- pas de double commande sur une meme operation logique;
- `sys_idempotency` protege les evenements Stripe;
- une commande `paid` ne doit jamais etre restauree comme abandonnee;
- un remboursement restaure une seule fois, apres validation Stripe;
- les conflits de restauration passent en etat a verifier, pas en succes silencieux.

`cleanupPendingPayments` traite les `pending_payment` expires apres verification de l'etat Stripe.

## 5. Statuts

| Statut | Sens |
| --- | --- |
| `pending_payment` | commande et stock reserves, paiement non confirme |
| `paid` | paiement confirme durablement |
| `payment_failed` | echec Stripe, stock restaurable/restaure |
| `canceled` | paiement/commande annule selon regles |
| `refund_pending` | remboursement cree, attente Stripe |
| `refunded` | remboursement confirme et stock restaure si coherent |
| `refund_failed` | intervention ou nouvelle synchronisation requise |

Les statuts logistiques se superposent au cycle metier selon l'interface admin; ne pas reutiliser un statut paiement pour representer une expedition.

## 6. Webhooks

`stripeWebhook` et `stripeConnectWebhook` verifient la signature Stripe. Le handler doit:

- utiliser le secret de l'environnement correspondant;
- traiter l'evenement de facon idempotente;
- verifier la concordance `orderId`, PaymentIntent, montant, devise et compte Connect;
- journaliser un rejet sans exposer de secret;
- repondre assez vite et decoupler les effets secondaires non critiques si necessaire.

Evenements principaux: succes/echec/annulation PaymentIntent et creation/mise a jour/echec de refund, avec `charge.refunded` comme signal complementaire.

## 7. Remboursements

`refundOrderAdmin` est l'action metier forte. Elle cree un Refund Stripe idempotent, conserve la commande, met a jour son statut et restaure le stock apres succes. `syncRefundStatusAdmin` relit Stripe pour recuperer un etat incomplet.

Le back-office `AdminReturns` fournit:

- liste des commandes remboursables;
- confirmation explicite;
- remboursement et remise en vente;
- synchronisation Stripe;
- e-mail client;
- preuve du refund et de la restauration.

Une suppression manuelle de commande payee est interdite.

## 8. Stripe Connect

Le sandbox a valide le flux Connect: onboarding, statut, paiement rattache au compte, webhook Connect et remboursement. `AdminPaymentSettings` pilote l'etat metier carte/wallets.

Avant production:

- creer/valider le compte live de la cliente;
- terminer KYC et capabilities;
- choisir clairement destination charges/frais/transferts;
- creer les secrets et endpoints webhook live;
- effectuer un petit paiement puis remboursement reel;
- documenter rapprochement, litiges et responsabilite des frais.

## 9. E-mails transactionnels

Les evenements commande et remboursement passent par `functions/src/email/transactionalEmail.js`. Gmail reste actif pour la demonstration; Resend est code mais inactif jusqu'au domaine expediteur valide. Voir `../security/AUTHENTIFICATION.md` et `../infra/INFRASTRUCTURE.md`.

Un echec e-mail ne doit pas inverser un paiement confirme. Il doit etre journalise et pouvoir etre renvoye de facon idempotente.

## 10. Preuves sandbox acquises

- paiement carte heberge avec commande `paid` et stock coherent;
- webhook signe et idempotent;
- confirmation UI seulement apres etat durable;
- annulation/cleanup d'une commande non payee;
- remboursement depuis le back-office;
- refund visible dans Stripe;
- stock restaure et espace client coherent;
- Stripe Connect sandbox complet.

La preuve d'un moyen de paiement a redirection externe comme iDEAL/Wero n'a pas ete obtenue, car il n'etait pas selectable dans la configuration sandbox utilisee. Ce point ne bloque pas la carte pour la demonstration.

L'interface ne promet pas statiquement Apple Pay, Google Pay ou un autre wallet: le Payment Element affiche seulement les moyens actifs et eligibles. Avant live, verifier les moyens actives, la verification de domaine requise pour les wallets et l'absence de warning Stripe.

L'architecture PaymentIntent actuelle est stable. Une migration vers Checkout Sessions ou une autre integration ne doit etre envisagee que si elle simplifie concretement les redirects, webhooks et la maintenance sans casser la reservation atomique du stock.

## 11. Fichiers structurants

```text
src/kit/commerce/CartSidebar.jsx
src/kit/commerce/CheckoutView.jsx
src/kit/commerce/CheckoutStripeModal.jsx
src/kit/commerce/CheckoutPaymentStep.jsx
src/kit/commerce/purchasability.js
functions/src/commerce/createOrder.js
functions/src/commerce/stripeWebhook.js
functions/src/commerce/stripeConnect.js
functions/src/commerce/cancelOrder.js
functions/src/commerce/cleanupPendingPayments.js
functions/src/commerce/refundOrder.js
functions/src/commerce/orderStatus.js
src/kit/admin/AdminOrders.jsx
src/kit/admin/AdminReturns.jsx
src/kit/admin/AdminPaymentSettings.jsx
```

## 12. Gates

```bash
npm run e2e:hosted-stripe
npm run e2e:refund-stripe
pnpm maintenance:audit
```

Ces gates touchent des services externes et creent des donnees sandbox. Ne pas les lancer pour un correctif visuel ou documentaire.

## 13. Conditions production

- [ ] cles et webhooks Stripe live separes;
- [ ] compte Connect live valide;
- [ ] moyens de paiement actifs et domaines wallet explicitement verifies;
- [ ] domaine final et return URLs finales;
- [ ] CGV/retours valides juridiquement;
- [ ] taxes, frais, livraison et devise confirms par la cliente;
- [ ] paiement/remboursement live de faible montant;
- [ ] alertes webhook et rapprochement operationnel;
- [ ] moyen redirect teste seulement s'il est active commercialement.
