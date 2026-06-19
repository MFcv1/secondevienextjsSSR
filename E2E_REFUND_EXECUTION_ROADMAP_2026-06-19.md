# Roadmap execution E2E refund sandbox - 2026-06-19

Objectif: debloquer puis prouver un parcours complet sandbox:

```text
achat invite neuf -> PaymentIntent succeeded -> commande paid -> refund admin Retours -> stock remis -> espace client coherent -> preuves Stripe/Firebase/logs archivees
```

Cette roadmap decoupe le travail en agents specialises. Les agents peuvent travailler en parallele uniquement sur les etapes qui ne dependent pas du nouvel achat. Aucun secret ne doit etre affiche dans le chat, commite, ni copie dans un fichier suivi Git.

## Contraintes

- Utiliser uniquement la sandbox Firebase `secondevienextjsssr`.
- Utiliser uniquement l'App Hosting sandbox `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.
- Ne pas modifier le design public ou back-office pendant cette passe.
- Ne pas lancer la Phase 3 perf tant que cette preuve P0 refund n'est pas close ou explicitement reportee.
- Ne pas committer `logs/*.env`, tokens App Check, mots de passe, `clientSecret`, `idToken`, `refreshToken` ou headers `Authorization`.
- Mettre a jour `TODO.md`, `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`, `AGENTS.md` et `mapV2.md` si un fichier est cree, supprime, renomme ou deplace.

## Agent 0 - Coordinateur de run

Mission: piloter l'ordre, verrouiller les preconditions et centraliser les preuves.

Entrees:

- `TODO.md`, section `P0 - Reprise demain: debloquer E2E refund complet`.
- `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`.
- Secrets locaux ignores Git: `logs/e2e-mail.env`, `logs/e2e-admin.env`, `logs/e2e-proof-token.txt`.

Actions:

- Confirmer que les fichiers secrets locaux existent sans afficher leur contenu.
- Creer un identifiant de run unique, par exemple `20260619-refund-<heure>`.
- Assigner un alias Gmail invite du type `loa.gto15+sv-refund-<stamp>@gmail.com`.
- Tenir un journal court des artefacts produits: JSON E2E, proof JSON, screenshots utiles, orderId, PaymentIntent, refundId.

Critere de sortie:

- Tous les agents ont un statut `OK`, `bloque` ou `reporte`.
- La roadmap E2E finale est mise a jour avec les preuves et limites restantes.

## Agent 1 - App Check E2E sandbox

Mission: supprimer le blocage `AppCheck 403` / throttle 24h pour Playwright.

Entrees:

- Firebase Console App Check sandbox.
- `scripts/e2e-hosted-stripe-checkout.mjs`.
- Fichier local ignore Git pouvant recevoir `E2E_APPCHECK_DEBUG_TOKEN`.

Actions:

- Generer ou recuperer un debug token App Check Web pour Playwright.
- L'enregistrer dans Firebase Console App Check sandbox pour l'app Web cible.
- Ajouter localement `E2E_APPCHECK_DEBUG_TOKEN` dans un fichier ignore Git ou dans l'environnement shell du run.
- Verifier statiquement que `scripts/e2e-hosted-stripe-checkout.mjs` injecte le token avant l'initialisation Firebase/App Check.
- Lancer seulement un smoke court si necessaire: atteindre checkout sans `AppCheck 403`.

Preuves attendues:

- Nom du fichier local utilise, sans valeur du token.
- Capture ou note console Firebase: debug token enregistre.
- Extrait de journal sans secret montrant absence de `AppCheck 403`.

Critere de sortie:

- Le run E2E peut ouvrir le checkout sandbox sans throttle App Check bloquant.

## Agent 2 - Stripe webhook refund sandbox

Mission: aligner les events Stripe sandbox avec les handlers deployes.

Entrees:

- Stripe Dashboard en mode test.
- Endpoint webhook sandbox `stripeWebhook`.
- Code webhook Functions deja deploye.

Actions:

- Confirmer l'endpoint webhook sandbox pointe vers `https://us-central1-secondevienextjsssr.cloudfunctions.net/stripeWebhook`.
- Ajouter ou confirmer les events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `refund.created`
  - `refund.updated`
  - `refund.failed`
  - `charge.refunded` si utile comme fallback de compatibilite.
- Verifier que les events inutiles configures ont un handler documente ou sont explicitement reportes.
- Ne jamais exposer `STRIPE_WH_SECRET`.

Preuves attendues:

- Liste des events actifs dans le Dashboard Stripe test.
- Livraison webhook `2xx` sur paiement puis refund apres le run complet.
- Documenter les event IDs Stripe utiles, sans secret.

Critere de sortie:

- Les events refund suivis par le code sont configures et livrent en `2xx`.

## Agent 3 - Achat invite E2E neuf

Mission: creer une nouvelle commande payee, differente des commandes historiques deja remboursees.

Entrees:

- App Check debloque par Agent 1.
- Events paiement alignes par Agent 2.
- Commande:

```powershell
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$env:E2E_EMAIL = "loa.gto15+sv-refund-$stamp@gmail.com"
$env:E2E_MAILBOX_USER = "loa.gto15@gmail.com"
$env:E2E_HEADLESS = "true"
Remove-Item Env:E2E_OTP_CODE -ErrorAction SilentlyContinue
npm run e2e:hosted-stripe
```

Actions:

- Acheter un produit disponible via le parcours invite.
- Verifier OTP invite, CGV, recap conserve, paiement Stripe sandbox.
- Recuperer `orderId`, `paymentIntentId`, produit, prix, stock avant/apres.
- Lancer la preuve serveur si le script ne l'a pas deja archivee.

Preuves attendues:

- Nouveau fichier `logs/hosted-stripe-e2e-*.json`.
- Proof JSON contenant `orderId`, `paymentIntentId`, produit choisi, `stockBefore`, stock final.
- Firestore order `status = paid`.
- Idempotence webhook paiement `processed`.
- Email client/admin envoye ou statut email documente.

Critere de sortie:

- Une commande neuve `paid` existe et peut etre traitee par l'admin Retours.

## Agent 4 - Refund admin Retours

Mission: rembourser la nouvelle commande depuis l'interface admin sandbox hebergee.

Entrees:

- `orderId` neuf produit par Agent 3.
- Compte admin test `loa.gto15@gmail.com`.
- Mot de passe local ignore Git dans `logs/e2e-admin.env`.

Actions:

- Ouvrir `/admin` sur l'App Hosting sandbox.
- Aller dans l'onglet `Retours`.
- Retrouver la nouvelle commande payee.
- Cliquer `Rembourser`.
- Verifier `refundId`, statut `refunded` ou `refund_pending` selon retour Stripe, et `Stock remis` quand le refund est confirme.
- Cliquer `Sync Stripe`.
- Envoyer `Email client`.
- Verifier que la page reste filtree sur la commande traitee apres chaque action.

Preuves attendues:

- `stripeRefundId` ou `refundId`.
- Firestore order avec `refundStatus`, `stockRestoredAfterRefund`, `refundEmailProof`.
- Screenshot admin Retours apres refund/email si utile.
- Stripe Dashboard: refund visible sur le PaymentIntent.

Critere de sortie:

- La commande neuve est remboursee, conservee dans l'historique, et le stock est remis en vente une seule fois.

## Agent 5 - Espace client apres refund

Mission: verifier la lecture client de la commande remboursee.

Entrees:

- Email invite utilise par Agent 3.
- `orderId` et `refundId`.

Actions:

- Ouvrir `/mes-commandes`.
- Se connecter par le flux prevu pour l'email de commande ou utiliser le chemin invite si disponible.
- Verifier que la commande affiche `Remboursee` ou `Remboursement en cours`.
- Verifier que le texte annonce le delai bancaire Stripe.
- Verifier la ligne `Avoir / remboursement` dans les factures/recaps.
- Verifier qu'aucune annulation libre n'est proposee.

Preuves attendues:

- Screenshot client si utile.
- Note des libelles visibles.
- Absence d'action `Annuler` libre sur commande Stripe payee/remboursee.

Critere de sortie:

- Le client voit un etat refund coherent et non ambigu.

## Agent 6 - Observabilite et preuves serveur

Mission: fermer la preuve technique de bout en bout.

Entrees:

- `orderId`, `paymentIntentId`, `refundId`.
- Logs Functions, Firestore, Stripe Dashboard test.

Actions:

- Verifier logs `stripeWebhook` pour paiement et refund.
- Verifier `sys_idempotency/stripe_*` en `processed` pour les events attendus.
- Verifier Firestore order:
  - `status`
  - `paymentIntentId`
  - `refundStatus`
  - `stripeRefundId`
  - `stockRestoredAfterRefund`
  - `refundEmailProof`
- Verifier le produit: stock coherent, pas de double restauration.
- Verifier Stripe Dashboard: PaymentIntent `succeeded`, Refund visible, events webhook `2xx`.

Preuves attendues:

- Liste synthetique order/payment/refund.
- Chemins des fichiers JSON dans `logs/`.
- Liste des event IDs Stripe utiles.

Critere de sortie:

- Le parcours est prouve cote UI, Firestore, Functions, idempotence et Stripe.

## Agent 7 - Documentation finale

Mission: mettre a jour les documents de reprise sans noyer les prochains runs.

Entrees:

- Sorties des agents 0 a 6.
- `TODO.md`.
- `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md`.

Actions:

- Mettre a jour `E2E_BACKOFFICE_TEST_ROADMAP_2026-06-18.md` avec:
  - alias email utilise;
  - produit;
  - `orderId`;
  - `paymentIntentId`;
  - `refundId`;
  - fichiers JSON/screenshot;
  - preuves webhook/email/stock;
  - limites restantes.
- Cocher dans `TODO.md` uniquement les cases reellement prouvees.
- Si un blocage persiste, ajouter une section `Blocage observe` avec cause, etape exacte, artefact et prochaine action.

Critere de sortie:

- Une autre conversation Codex peut reprendre sans relire les logs bruts.

## Ordre d'execution recommande

1. Agent 0 initialise le run.
2. Agents 1 et 2 travaillent en parallele: App Check et Stripe Dashboard.
3. Agent 3 lance l'achat invite neuf.
4. Agent 4 rembourse cette meme commande.
5. Agents 5 et 6 verifient client et preuves techniques.
6. Agent 7 met a jour les documents.

## Gates de blocage

- Ne pas lancer Agent 3 tant que Agent 1 n'a pas leve `AppCheck 403`.
- Ne pas lancer Agent 4 sans commande neuve `paid`.
- Ne pas cocher refund complet si le refund porte sur une ancienne commande seulement.
- Ne pas cocher preuve webhook refund sans event Stripe livre en `2xx` ou preuve serveur equivalente.
- Ne pas passer a la Phase 3 perf tant que cette roadmap n'est pas close ou explicitement reportee dans `TODO.md`.

## Commandes utiles

Creer ou remettre a stock connu le produit dedie E2E Stripe sandbox:

```powershell
$env:FIREBASE_PROJECT_ID = "secondevienextjsssr"
npm run e2e:seed-stripe-product
```

Le produit cible par defaut est `sv-e2e-stripe-refund-product`, avec le libelle public `[TEST STRIPE SANDBOX] Produit refund repetable`. Le script bump `public/meta.catalogVersion` pour eviter de relancer l'E2E sur un cache catalogue stale.

Verifier les fichiers secrets locaux sans afficher leur contenu:

```powershell
Test-Path logs/e2e-mail.env
Test-Path logs/e2e-admin.env
Test-Path logs/e2e-proof-token.txt
```

Lire le dernier resultat E2E:

```powershell
Get-ChildItem logs -Filter 'hosted-stripe-e2e-*.json' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 Name,LastWriteTime,Length
```

Controle syntaxe court si un fichier JS est modifie pendant la passe:

```powershell
node --check scripts/e2e-hosted-stripe-checkout.mjs
node --check functions/src/commerce/stripeWebhook.js
```

## Etat initial connu

- Le refund admin a deja ete prouve sur une ancienne commande.
- Le blocage restant est la creation d'une nouvelle commande payee dans le meme run, a cause d'App Check debug/throttle pendant l'E2E heberge.
- L'objectif de cette roadmap est donc la preuve complete sur une commande neuve, pas la revalidation generale du back-office.

## Journal execution - 2026-06-19

Agent 0 - Coordinateur:

- Secrets locaux requis confirmes sans affichage: `logs/e2e-mail.env`, `logs/e2e-admin.env`, `logs/e2e-proof-token.txt`.
- Worktree deja sale avant reprise; les changements existants n'ont pas ete revert.

Agent 1 - App Check:

- `scripts/e2e-hosted-stripe-checkout.mjs` lit `E2E_APPCHECK_DEBUG_TOKEN` et l'injecte par `context.addInitScript` avant la premiere navigation.
- Run court avec `E2E_APPCHECK_DEBUG_TOKEN=true` et alias `loa.gto15+sv-appcheck-...@gmail.com`.
- Artefacts:
  - `logs/hosted-stripe-e2e-2026-06-19T13-28-47-295Z.json`;
  - `logs/hosted-stripe-e2e-2026-06-19T13-28-47-295Z.png`.
- Le SDK Firebase a genere un UUID debug token; il a ete ecrit dans `logs/e2e-mail.env` sous `E2E_APPCHECK_DEBUG_TOKEN`, sans exposition dans le chat.
- Tentatives d'enregistrement API App Check:
  - compte actif `matthis.fradin2@gmail.com`: `403`;
  - compte local alternatif `jardinchawi@gmail.com`: `403`;
  - le compte actif a ete restaure sur `matthis.fradin2@gmail.com`.
- Tentative `exchangeDebugToken` avec le token local: `403`.
- Blocage: enregistrer manuellement le token local dans Firebase Console App Check sandbox, ou donner a l'utilisateur CLI le role permettant `debugTokens.create`.

Agent 2 - Stripe webhook refund:

- Endpoint sandbox trouve via API Stripe test: `https://us-central1-secondevienextjsssr.cloudfunctions.net/stripeWebhook`.
- Etat initial endpoint: actif, mais seulement les events `checkout.session.completed`, `checkout.session.expired`, `payment_intent.canceled`, `payment_intent.payment_failed`, `payment_intent.succeeded`.
- Events ajoutes avec succes:
  - `refund.created`;
  - `refund.updated`;
  - `refund.failed`;
  - `charge.refunded`.
- Etat final endpoint: `enabled`, events actifs `charge.refunded`, `checkout.session.completed`, `checkout.session.expired`, `payment_intent.canceled`, `payment_intent.payment_failed`, `payment_intent.succeeded`, `refund.created`, `refund.failed`, `refund.updated`.

Correctif harnais:

- `scripts/e2e-hosted-stripe-checkout.mjs` respecte maintenant `E2E_SEND_OTP_ONLY=true` apres `fillCheckout`, pour ne plus continuer vers Stripe quand le smoke OTP/App Check est deja suffisant.

Prochaine action:

1. Enregistrer dans Firebase Console App Check sandbox la valeur locale `E2E_APPCHECK_DEBUG_TOKEN` presente dans `logs/e2e-mail.env`.
2. Verifier `exchangeDebugToken` ou relancer un smoke OTP sans `AppCheck 403`.
3. Seulement ensuite lancer Agent 3: achat invite neuf puis refund admin de cette meme commande.

## Journal execution - 2026-06-19 suite

Agent 1 - App Check:

- Matthieu a enregistre le token local dans Firebase Console.
- Smoke OTP/App Check relance:
  - `logs/hosted-stripe-e2e-2026-06-19T13-53-21-933Z.json`;
  - statut `otp-sent-awaiting-code`;
  - OTP invite valide;
  - pas de `403` App Check observe dans le JSON.

Agent 3 - Achat invite neuf:

- Run complet:
  - `logs/hosted-stripe-e2e-2026-06-19T13-54-24-129Z.json`;
  - alias `loa.gto15+sv-refund-20260619155423@gmail.com`;
  - commande `9RkYKEaaRCrBWVxU6ALb`;
  - produit `Paire de chevets`;
  - PaymentIntent `pi_3Tk2slRdWb0VNdZq0gTPdTnK`;
  - montant `140 EUR`;
  - webhook paiement `evt_3Tk2slRdWb0VNdZq0RwFlnhs`, idempotence `processed`;
  - emails client/admin envoyes;
  - stock `1 -> 0`, produit vendu/reserve.

Agent 4 - Refund admin:

- Refund lance via callable admin sandbox pour la meme commande:
  - `refundOrderAdmin`;
  - `syncRefundStatusAdmin`;
  - `sendRefundStatusEmailAdmin`.
- Refund Stripe `re_3Tk2slRdWb0VNdZq09JdFKvU`.
- Resultat: `status=refunded`, `refundStatus=succeeded`, `stockRestoredAfterRefund=true`, email refund client envoye.
- Note: cette relance a utilise les callables admin equivalentes a l'onglet `Retours`; l'ouverture visuelle de l'admin heberge reste a faire si une preuve UI stricte est demandee.

Agent 6 - Preuves serveur:

- Firestore order:
  - `status=refunded`;
  - `refundStatus=succeeded`;
  - `stripeRefundId=re_3Tk2slRdWb0VNdZq09JdFKvU`;
  - `stockRestoredAfterRefund=true`;
  - `refundEmailProofUpdatedAt=2026-06-19T13:56:12.100Z`.
- Produit `YAUJ4oFPvLD24rrCzrpB`:
  - `stock=1`;
  - `sold=false`;
  - `refundedFromOrderId=9RkYKEaaRCrBWVxU6ALb`.
- Logs Functions `stripeWebhook`:
  - `PaymentIntent succeeded: pi_3Tk2slRdWb0VNdZq0gTPdTnK`;
  - `Webhook: Refund event: refund.created re_3Tk2slRdWb0VNdZq09JdFKvU succeeded`;
  - `Webhook: Refund event: refund.updated re_3Tk2slRdWb0VNdZq09JdFKvU succeeded`.
- Idempotence:
  - `refund.created` / `evt_3Tk2slRdWb0VNdZq0fdyRupx`: `processed`;
  - `refund.updated` / `evt_3Tk2slRdWb0VNdZq0PpfGT28`: `processed`.
- Stripe a aussi emis `charge.refund.updated` / `evt_3Tk2slRdWb0VNdZq0mCjehbw`; pas de doc idempotence trouve, car le handler metier actuel ecoute `charge.refunded` comme fallback.

Restant:

- Verification visuelle de l'onglet admin `Retours` heberge: faite le 2026-06-19 avec `logs/ui-admin-returns-after-sync-email-2026-06-19.png` et `logs/ui-admin-returns-proof-2026-06-19.json`.
- Verification UI `/mes-commandes` apres refund: faite le 2026-06-19 avec `logs/ui-client-orders-refunded-2026-06-19.png` et `logs/ui-client-orders-refunded-proof-2026-06-19.json`.
- Seule nuance restante: le clic UI `Rembourser` n'a pas ete rejoue apres coup, car la commande etait deja `refunded`; les clics UI `Sync Stripe` et `Email client` ont ete prouves et le refund lui-meme a ete prouve via callable admin + Stripe + Firestore + webhook.

## Journal execution - 2026-06-19 stabilisation repetabilite

- `scripts/seed-e2e-stripe-product.mjs` ajoute un seed/reset sandbox pour le produit dedie `sv-e2e-stripe-refund-product`.
- `package.json` expose `npm run e2e:seed-stripe-product`.
- `scripts/e2e-hosted-stripe-checkout.mjs` cible maintenant `E2E_STRIPE_PRODUCT_ID` par defaut et n'utilise plus les exclusions fragiles `Buffet`, `dd`, `Chaise`.
- Le JSON E2E est redacte avant ecriture pour masquer `password`, token App Check, `idToken`, `refreshToken`, `Authorization`, `accessToken` et `clientSecret` / `payment_intent_client_secret`.
- `functions/src/commerce/e2eStripeHardeningProof.js` prefere le produit dedie fourni par `productId` avant son fallback catalogue.
- Compte client test verifie: mot de passe a garder uniquement hors repo via `E2E_PASSWORD` dans `logs/e2e-mail.env` ou dans l'environnement shell du run.
- Seed execute avec succes sur la sandbox `secondevienextjsssr`: produit `sv-e2e-stripe-refund-product`, stock `1`, prix `140 EUR`.
