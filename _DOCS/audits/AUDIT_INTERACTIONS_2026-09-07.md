# Audit manuel des interactions — 7 septembre 2026

Statut : **correctifs locaux, non déployés**. Aucun commit, push, paiement,
envoi réel de mail ou changement de données cloud.

## Résultat actuel et historique de couverture

**La relecture a été complétée après cette première passe : les 442 sources
de son inventaire ont été lues intégralement, ainsi que six modules ajoutés,
soit 448 fichiers.** La validation élargie donne 591 tests réussis et zéro
erreur ESLint (121 avertissements conservés). Les corrections restent locales.
Le [rapport de relecture intégrale](RELECTURE_INTEGRALE_INTERACTIONS_2026-09-07.md)
et son inventaire font autorité pour la couverture et les limites actuelles.

### Première passe — chiffres historiques

Cette campagne a corrigé 17 groupes de défauts de sécurité, de fiabilité et de
coût côté code sur les parcours d'achat, les favoris, l'espace client,
l'authentification et le back-office. Les vérifications finales donnent
**439 tests réussis sur 439**, sans test ignoré, et **zéro erreur ESLint**.
Les 127 avertissements ESLint restants ne sont pas présentés comme résolus.

Le travail est manuel, sans scan Codex Security ni délégation. L'inventaire
contient 437 fichiers source au départ, puis 442 avec les cinq nouveaux modules.
Il distingue **94 fichiers relus manuellement sur leurs sections utiles**,
333 fichiers inventoriés et soumis aux contrôles statiques, et 15 fichiers
analytics différés. Les styles, assets, dépendances, scripts opérationnels et
archives ne sont pas assimilés à des fichiers métier audités.

À cette étape initiale, la relecture intégrale n'était pas acquise. Cette
limite a motivé la passe complémentaire liée ci-dessus. Les chiffres de ce
paragraphe et les deux artefacts ci-dessous sont conservés comme historique ;
ils ne décrivent plus la couverture finale.

- [Inventaire par fichier, empreintes avant/après et couverture](preuves/interactions-2026-09-07-inventaire.json).
- [Résultats et commandes exactes de validation](preuves/interactions-2026-09-07-validations.json).

## Périmètre et méthode

Base locale : branche `codex/stats-data-performance`, commit
`10c6b1b8b402a6011045b37b683acf185c1e06b8`, worktree déjà largement modifié.
Une copie initiale des sources a permis de distinguer les changements de cette
campagne des travaux précédents. Les suppressions de skills, les corrections
du 6 septembre et les autres changements préexistants ont été conservés.

Versions constatées : Node de validation `22.23.2`, pnpm `11.7.0`, Next
`16.3.0`, React `19.2.7`, ESLint `9.39.4`. Le Node par défaut du terminal était
plus récent ; les résultats finaux ci-dessus proviennent explicitement de Node 22.

La revue suit les entrées UI, leurs clients callable, les contrôles de droits,
les transactions, les états Stripe, les effets métier et leurs consommateurs.
Les guides Next locaux ont été consultés. Aucun navigateur du site n'a été
utilisé. Une recherche documentaire ponctuelle a vérifié la durée de conservation
des clés d'idempotence dans la documentation officielle Stripe.

Les scénarios nouveaux injectent des dépendances locales : transaction simulée,
sender fictif, horloge contrôlée, callbacks tardifs et perte de réponse. Les
tests utilisent le garde réseau existant `tests/commerce/helpers/no-network.cjs`.

## Corrections de sécurité et de livraison

### INT-01 — Enrôlement d'une passkey administrateur depuis une session faible

**Priorité haute, défaut de contrôle serveur corrigé.** Une authentification
OTP suffisait auparavant pour enregistrer une passkey, y compris pour un compte
admin. Cette nouvelle passkey pouvait ensuite fournir l'assurance forte exigée
par le back-office. Le contrôle d'enrôlement ne devait pas permettre à une
session faible de fabriquer elle-même son moyen d'élévation.

Les étapes de génération des options et de vérification de l'inscription
appellent maintenant `authorizePasskeyRegistration`. Une claim admin/superAdmin
ou un registre admin actif impose une session déjà admise par
`checkActiveStrongAdmin`. Le registre couvre aussi le cas d'un ancien token
sans claim après promotion du compte. L'inscription d'un client ordinaire après
OTP demeure possible. Les contrôles WebAuthn de présence de vérification locale
restent actifs.

Fichiers : [garde serveur](../../functions/src/auth/passkeyRegistration.js),
[deux étapes WebAuthn](../../functions/src/auth/passkeys.js).
Preuve : `tests/passkey-registration-audit.test.cjs` vérifie refus des sessions
faibles, compte actif sans claim récente, Google/passkey forts et client ordinaire.
Limite : aucune passkey historique n'a été supprimée ou rétroactivement qualifiée.

### INT-02 — Identité du contact de commande non vérifiée dans le transport v2

**Priorité haute, défaut d'intégration corrigé.** L'interface collectait l'email
et une preuve OTP, mais `createCheckoutV2` ne transmettait pas cette preuve au
handler. Celui-ci utilisait directement l'email du token Auth, éventuellement
absent pour un invité ou non vérifié. Cela pouvait notamment priver l'outbox
client de son destinataire.

Le client transmet désormais `customerEmail` et `checkoutOtpToken`. Le serveur
accepte soit l'adresse Auth correspondante avec `email_verified: true`, soit
une validation OTP serveur. La sélection d'un fournisseur Google côté client
ne suffit plus à éviter l'OTP si `emailVerified` est faux. Le contact vérifié
alimente le snapshot ; **l'UID reste la seule preuve de propriété de la commande**.

Fichiers : [identité email](../../functions/src/commerce/checkoutEmailIdentity.js),
[handler](../../functions/src/commerce/v2Checkout.js),
[client callable](../../src/kit/commerce/commerceV2Client.js),
[checkout](../../src/kit/commerce/CheckoutView.jsx).
Preuve : `interaction-audit.test.cjs` couvre email vérifié, autre destinataire,
invité, email absent et preuve refusée ; le contrat transport existant passe.
Limite : les anciennes commandes sans contact ne sont pas réparées automatiquement.

### INT-03 — Rejeu Stripe au-delà de la protection d'idempotence

**Priorité haute, reprise dangereuse corrigée.** Paiements et remboursements
sans identifiant fournisseur pouvaient répéter une création sans limite d'âge.
Une clé Stripe peut être supprimée après au moins 24 heures ; sa réutilisation
ne garantit alors plus le même objet. [Contrat fournisseur](https://docs.stripe.com/api/idempotent_requests?lang=node).

`providerCreateWindow` refuse une création dès 23 heures depuis le `createdAt`
immuable de la tentative, ou si sa date est absente, invalide ou future. Cette
borne s'applique aussi à la récupération par création avant annulation.
`updatedAt` ne prolonge pas la fenêtre. Un objet déjà identifié peut toujours
être relu. Un remboursement identifié mais introuvable n'est jamais recréé.
Les transports exposent un besoin de rapprochement, sans compensation financière
ni libération automatique de stock.

Fichiers : [borne commune](../../functions/src/commerce/domain/providerCreateWindow.js),
[paiement/annulation](../../functions/src/commerce/domain/checkoutSagaService.js),
[remboursement](../../functions/src/commerce/domain/refundSagaService.js), ainsi
que les transports checkout, annulation, retours, liens de paiement et refund.
Preuve : `provider-create-window.test.cjs` et les suites de pannes des sagas.
Le test ancien bloque toute création et tout effet stock ; le test d'un refund
connu ancien conserve la possibilité de rapprochement.
Limite : un ancien dossier incertain peut rester bloqué jusqu'à vérification.

### INT-04 — Acquittement email incomplet traité comme un échec réessayable

**Priorité haute, risque de duplication corrigé.** Après réponse du sender,
un acquittement sans identifiant pouvait tomber dans le chemin de nouvel essai.
La possibilité d'acceptation est désormais retenue avant validation du résultat.
Un `providerMessageId` absent, vide ou composé d'espaces conduit à
`delivery_unknown`, sans renvoi automatique.

Fichier : [worker outbox](../../functions/src/commerce/domain/outboxWorker.js).
Preuve : `interaction-audit.test.cjs`, cas réponse nulle, objet vide et ID vide.
Cette protection privilégie le rapprochement d'un email incertain à sa duplication.

### INT-05 — Factures manuelles : concurrence, destinataire et résultat incertain

**Priorité haute pour la fiabilité documentaire, corrigée.** Un appel refusé
pouvait écrire `failed` dans la livraison d'un autre appel toujours en cours.
Un claim expiré pouvait être repris alors que le mail était peut-être parti.
L'erreur de persistance après acceptation ne conservait pas systématiquement
cette incertitude. Le client générait également un nouvel ID à chaque essai.

Seul l'appel ayant obtenu le claim peut maintenant enregistrer son échec. Un
état `sending` ou `delivery_unknown` interdit un nouveau départ, même avec un
autre ID. Une même demande est liée au hash du destinataire. La perte de réponse
d'une transaction ayant déjà écrit `sent` ne rétrograde plus ce succès.
L'interface verrouille la soumission et conserve l'ID de demande après erreur.
Un nouvel envoi explicitement demandé après succès reste possible.

Fichiers : [facturation serveur](../../functions/src/invoicing/manualInvoices.js),
[interface](../../src/kit/admin/AdminInvoices.jsx).
Preuve : `manual-invoice-delivery-audit.test.cjs` simule doublon, nouvel ID,
destinataire différent, demande invalide, acquittement manquant et pertes de
réponse avant/après commit. Aucun mail réel ni document cloud n'a été créé.
Limite : un claim abandonné nécessite une vérification, il n'expire plus en renvoi.

### INT-06 — Accusés de devis : reprise d'un envoi potentiellement déjà effectué

**Priorité moyenne, corrigée.** Un ancien état `sending` pouvait être repris,
et une erreur après acceptation du mail pouvait devenir `failed`.
Un claim expiré devient maintenant `delivery_unknown`. Les acquittements
incomplets et les erreurs après acceptation restent incertains ; un succès
durable n'est pas écrasé par la perte de sa réponse.

Fichier : [accusé de devis](../../functions/src/quotes/quoteRequests.js).
Preuve : `quote-receipt-audit.test.cjs`, lease expiré et pertes de réponse.

## Corrections des interactions et du coût côté code

| ID | Défaut et résultat du correctif | Fichiers principaux | Vérification |
| --- | --- | --- | --- |
| INT-07 | Cache wishlist commun à plusieurs identités : espaces visiteur et UID séparés ; l'ancienne clé ambiguë n'est plus importée | [wishlistState](../../src/kit/marketplace/wishlistState.js) | Deux comptes, invité et ancienne clé dans `wishlist-interactions.test.mjs` |
| INT-08 | Payload wishlist contenant des prix `undefined`, succès local malgré refus serveur : champs optionnels valides seulement ; état local après succès distant | [wishlistState](../../src/kit/marketplace/wishlistState.js) | Payload et suppression refusée simulés |
| INT-09 | Migrations et écoutes wishlist dupliquées : canal partagé par UID, migrations sérialisées, callbacks annulés ignorés ; un import échoué ne masque plus les favoris du compte | [wishlistState](../../src/kit/marketplace/wishlistState.js) | Deux abonnés, un import/une écoute, désabonnement et import refusé |
| INT-10 | Nettoyage du panier après paiement pouvant supprimer une ligne modifiée depuis sa lecture : relecture transactionnelle de chaque ligne et comparaison ID/révision | [helper](../../src/kit/commerce/purchasedCartCleanup.js), [page checkout](../../app/checkout/CheckoutPageIsland.jsx) | Révision modifiée, ligne réajoutée et ligne inchangée simulées |
| INT-11 | Ajouts successifs perdus pendant le chargement du panier : file d'événements transmise une seule fois après installation des listeners ; ancienne écoute de compte ignorée | [handoff](../../src/kit/marketplace/cartEventHandoff.js), [chargement](../../src/kit/marketplace/LazyCartPanelIsland.jsx), [panier](../../src/kit/marketplace/CartPanelIsland.jsx) | Deux ajouts, rejeu et signal ready répété ; contrats panier |
| INT-12 | Ancienne navigation différée ou fermeture de rideau pouvant prendre le dessus sur une navigation plus récente : timer précédent annulé et identité courante vérifiée | [transition](../../app/RouteTransitionIsland.jsx) | Lecture des chemins et ESLint ; pas de recette navigateur |
| INT-13 | Anciennes suggestions d'adresse pouvant remplacer les nouvelles : requête annulée au changement, à la sélection et au démontage ; réponses HTTP invalides et réponses annulées ignorées | [checkout](../../src/kit/commerce/CheckoutView.jsx) | Lecture de concurrence et ESLint ; pas d'appel au service d'adresses |
| INT-14 | Vérifications concurrentes d'un lien de paiement et callbacks après départ : une boucle active, limite 45 s, séquence de lectures et verrou synchrone de soumission | [page de paiement](../../app/payer/[orderId]/[token]/PaymentLinkPageIsland.jsx) | Contrats/suites paiement existants et ESLint ; pas de qualification UI réelle |
| INT-15 | Listener commandes comparant un Timestamp à des `updatedAt` ISO : seuil ISO et tri décroissant pour les 25 mises à jour les plus récentes ; index correspondant ajouté | [Mon espace](../../src/kit/commerce/MyOrdersView.jsx), [index](../../firestore.indexes.json) | Contrats de requête ; index non déployé |
| INT-16 | Recherche limitée aux 120 premières cartes avant classement : recherche sur tout le snapshot public, résultats ensuite bornés ; jointure wishlist/catalogue indexée par ID | [recherche](../../app/api/search/route.js), [résolution wishlist](../../src/kit/marketplace/publicCatalogWishlist.js) | Produit en position 121, produit non public exclu, ordre des favoris et produit absent |
| INT-17 | Branches email inaccessibles et ancienne modale de connexion panier sans chemin d'ouverture : retrait des doublons et maintien du renderer canonique | [opérations email](../../functions/src/commerce/v2Operations.js), [panier](../../src/kit/marketplace/CartPanelIsland.jsx) | Recherche des appelants, suites templates/outbox et contrats panier |

## Chaîne achat → Stripe → état durable → email

La revue a confirmé dans les chemins examinés et les tests exécutés :

1. Le navigateur transmet des références et quantités ; les prix, disponibilités,
   promotions et conditions de livraison sont revérifiés par le serveur.
2. La réservation et l'identité de checkout passent par des transactions et
   des identifiants métier déterministes. Un rejeu reprend la même commande.
3. Le paiement garde son compte Connect et ses montants de référence. Les
   rapprochements vérifient identifiants, devise, montants et métadonnées.
4. Les webhooks restent signés, dédupliqués par inbox et traités avec leases.
   Un conflit terminal ou un paiement orphelin ne devient pas un succès silencieux.
5. Les effets financiers, mouvements et intentions email sont persistés avant
   que l'interface puisse conclure au succès durable. Un mail échoué ne défait
   jamais un paiement.
6. Annulation, remboursement, retour physique et remise en stock restent des
   opérations distinctes ; les tests de pannes et d'invariants correspondants passent.

**Échec de paiement :** le code conserve le même PaymentIntent pour un refus
de carte réessayable et l'interface présente l'erreur. Il n'existe pas d'email
dédié à chaque refus de carte dans ce flux. Les templates `order-refund-failed`
signalent un échec de remboursement. Aucun nouveau comportement d'envoi sur
refus de carte n'a été inventé pendant cet audit.

## Back-office, droits et données

Les handlers examinés de commandes, retours, remboursements, documents et
facturation imposent le contrôle admin fort serveur. Les routes Next admin
vérifient App Check, token révoqué, assurance et registre actif. Les boutons
conditionnels ne constituent pas le contrôle de sécurité.

Les readers de commandes imposent l'UID propriétaire et vérifient le curseur.
Les commandes restent non modifiables directement par le client dans les rules.
Les collections de paiement, effets financiers, inbox et outbox restent privées.
Les readers admin examinés bornent leurs pages et les vues réutilisent leur cache
avec purge à la perte d'autorisation. Cela ne prouve pas chaque vue du back-office :
la couverture fichier par fichier est donnée dans l'inventaire.

## Bilan performance et nettoyage

Les changements mesurables dans le code sont une écoute wishlist commune par
UID au lieu d'une par consommateur, une migration unique, une jointure catalogue
en O(favoris + produits), l'annulation des suggestions devenues inutiles et
l'élimination de boucles de vérification de paiement concurrentes.

Le coût n'est pas uniquement réduit : le nettoyage sûr du panier remplace le
batch final par des transactions individuelles ; la vérification d'enrôlement
passkey ajoute des lectures de registre ; rechercher tout le catalogue peut
augmenter le travail CPU par recherche. Ces coûts servent la cohérence ou la
sécurité. Aucun gain de millisecondes, p95, Core Web Vitals ou coût cloud n'est
annoncé sans mesure.

Dans les sources de cette campagne : **29 fichiers créés/modifiés, 391 lignes
ajoutées et 402 retirées**, calculées par rapport à la copie initiale du worktree,
pas au diff Git englobant les travaux précédents. À cela s'ajoutent un manifeste
d'index, huit nouveaux fichiers de tests, quatre tests de contrat ajustés et la
documentation. Les branches email retirées représentent 257 lignes remplacées
par 11 lignes dans `v2Operations`.

Aucun fichier métier entier, média, document client ou archive n'a été supprimé
ou déplacé. Aucun package ni lockfile n'a été changé par cette campagne.

## Validations de la première passe et évolution des réserves

- **439/439 tests** sous Node 22 avec réseau interdit, zéro échec/ignoré/annulé.
  Ils couvrent domaine commerce, pannes, reconstruction paiement, catalogue,
  Auth/passkeys/révocation, panier/favoris, contrats navigation, back-office,
  devis, factures, encodage et confidentialité. Les huit fichiers nouveaux
  apportent vingt scénarios de régression, plusieurs avec variantes.
- **ESLint : 439 fichiers, zéro erreur, 127 avertissements.** Les avertissements
  n'ont pas été masqués par une modification de configuration.
- Quatre tests préexistants ont été réalignés : identité email vérifiée dans le
  transport, forme réelle du listener commandes, ancienne assertion de navigation
  devenue obsolète, lecture dashboard extraite et indication de synchronisation.
  Leur succès ne permet pas d'attribuer à cet audit les corrections UI antérieures.
- `git diff --check` et contrôle des liens des documents modifiés exécutés en
  clôture ; statuts Git avant/après conservés localement.
- **Non exécutés :** build, serveur, navigateur, Playwright, émulateurs/rules
  réelles, Stripe hébergé, mails réels, logs Google Cloud et audit réseau des
  dépendances. Aucune conclusion sur les versions effectivement servies.

Points qui restent ouverts ou ont un effet de compatibilité :

1. La réserve de couverture initiale est levée sur le périmètre applicatif
   de 448 fichiers, relus intégralement dans la passe complémentaire. Les
   121 avertissements finaux restent détaillés dans sa preuve ESLint.
2. Le vidage des favoris a été corrigé dans la relecture : lots de 400,
   conservation des ajouts concurrents, scénario de 805 favoris testé.
   Les limites de pagination restantes sont précisées dans le nouveau rapport.
3. L'index `orders(userId ASC, updatedAt DESC)` est local. Le déploiement devra
   le rendre disponible avant qualification de l'écoute ; les changements du
   transport checkout nécessitent aussi des clients et Functions compatibles.
4. L'ancien cache de favoris non attribuable n'est plus affiché/importé. Il est
   conservé tel quel, les favoris distants demeurent disponibles. Les commandes
   anciennes sans email et les passkeys existantes n'ont pas été migrées.
5. Les cas email ou Stripe incertains nécessitent un rapprochement. Les
   protections ajoutées empêchent des renvois/recréations, elles ne constituent
   pas une console de résolution ni une preuve de livraison fournisseur.
6. Les enchaînements réels de navigation, de focus, d'autocomplétion, de paiement
   et de changement de compte ne sont pas qualifiés par un test navigateur de
   cette campagne. Les tests simulés indiquent précisément leur portée.

Ces réserves sont des limites du travail local livré, et non des gates cloud
fermées par supposition. Aucun déploiement n'a été entrepris.
