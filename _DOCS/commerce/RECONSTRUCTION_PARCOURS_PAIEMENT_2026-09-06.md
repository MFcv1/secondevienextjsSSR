# Reconstruction ciblée du parcours paiement

Date : 6 septembre 2026. Statut : **LIVRÉ SUR SANDBOX — RECETTE STRIPE/3DS RÉELLE NON EXÉCUTÉE**.

Ce document transmet les décisions de la conversation et les défauts observés
pendant la recette humaine du 5 septembre. Les sections 1 à 7 conservent la
spécification ; la section 8 consigne le travail local et ses limites, avant
autorisation de livraison. La section 9 consigne le déploiement ensuite demandé
par l'utilisateur. Sa lecture ne déclenche aucune opération hébergée.

## 1. Objectif et décisions retenues

Fiabiliser les achats de meubles en stock unique, avec un parcours compréhensible,
reprenable et cohérent entre galerie, panier, checkout, espace client et admin.
Réutiliser le domaine commerce V2 existant ; « reconstruction » ne signifie pas
réécriture du système de paiement.

Décisions finales, qui remplacent les propositions intermédiaires du diagnostic :

1. Panier et saisie des coordonnées : **aucune réservation**.
2. Clic sur « Procéder au paiement sécurisé » : vérification et réservation
   transactionnelles côté serveur, puis préparation du paiement Stripe.
3. Réservation normale : **15 minutes à compter de la prise serveur**, au lieu
   des 30 minutes observées pour C143. C'est une décision produit, pas un gain
   mesuré. L'échéance n'est prolongée ni par reload, ni par reprise, ni par refus
   de carte. Ne pas modifier rétroactivement les échéances des dossiers existants.
4. Après création de la réservation, les sorties vers la galerie proposées par
   le checkout expriment un abandon : **« Annuler et retourner à la galerie »**,
   avec confirmation. Avant réservation, « Continuer mes achats » conserve
   simplement le panier et les coordonnées.
5. « Récapitulatif » revient aux informations de cette réservation, sans annuler.
   Ne pas rendre modifiables des données qui rendraient le paiement existant
   incohérent. Toute modification nécessitant une recréation doit être explicite.
6. Une fermeture d'onglet, une coupure ou une déconnexion ne prouvent pas un
   abandon. Aucun appel d'annulation automatique au `beforeunload` ou sur logout.
7. Au retour sur le site avec la bonne identité, une proposition de reprise
   apparaît après vérification serveur. **Aucun démarrage de paiement automatique
   depuis la galerie ou une simple reconnexion.**
8. Une validation dans l'application bancaire ou un challenge 3D Secure fait
   partie de `stripe.confirmPayment`, pas d'un abandon ou d'une nouvelle commande.
9. Un refus de carte permet une nouvelle tentative sur le même dossier pendant
   le délai restant. Ne pas confondre refus, authentification en cours, traitement
   fournisseur, succès et résultat inconnu.
10. « Réservé » n'est pas « Vendu ». Ne jamais annoncer une vente sans preuve
    métier, y compris au client qui perd la course au dernier meuble.

La règle de priorité est **le premier à obtenir la réservation serveur**, pas
le premier à ouvrir le formulaire ni nécessairement le premier à être débité.
La réservation lui donne temporairement le droit exclusif de payer ces pièces.

## 2. État constaté et preuves à réutiliser

Diagnostic détaillé local :
[RAPPORT de l'incident](../../logs/recette/incident_20260905_2246/RAPPORT.md).
Ce dossier de logs peut être ignoré par Git : les constats nécessaires sont
également résumés ci-dessous. Ne pas relancer toute l'ancienne recette.

### Incident C143

- Commande `ord_8baa6ce4-7550-436b-9a4b-75a58fb82064`, créée le 5 septembre
  à 22:45:52 Paris, deux meubles, 990 EUR dont 90 EUR de livraison.
- Au diagnostic : `pending_payment`, `awaiting_method`, Stripe test
  `requires_payment_method`, encaissé 0. Deux réservations `held`, aucun commit
  de vente. Il ne s'agissait pas d'une vente ou d'un encaissement fantôme.
- Échéance 23:15:52 Paris. À 23:24:50, les deux unités restaient réservées.
- L'utilisateur a ensuite constaté leur remise en vente. Cela ne prouve pas une
  libération à l'échéance : le secours était programmé à 23:31. Ne pas affirmer
  sans nouvelle preuve que ce passage précis a effectué la libération.
- Deux refus initiaux `invalid-argument` à 22:44:46 et 22:45:09 n'ont pas de raison
  domaine conservée dans les logs expurgés. Leur cause exacte demeure inconnue.

### Défauts et limites démontrés

| Sujet | Constat à traiter |
| --- | --- |
| Expiration | Image déployée de `onCommerceReservationWrittenGen2`, révision `oncommercereservationwrittengen2-00001-nuq` : `FUNCTION_SIGNATURE_TYPE.default=event`, sans surcharge service, alors que le SDK attend `cloudevent`. Deux POST 204 sans planification et file d'expiration vide. Reproduction locale du défaut de forme réussie. Observation datée, configuration à revérifier avant livraison. |
| Reprise expirée | `resolveCheckoutResumeTerminalCode` attend une fermeture durable ; l'échéance dépassée seule ne bloque pas la reprise. `openExistingPayment` peut aussi rouvrir un secret déjà en mémoire sans rappeler le serveur. |
| Déconnexion | Le panier de la nouvelle identité peut être comparé à `lastNonEmptyCartRef` de l'ancienne. Un panier vide active un faux message « une autre personne a payé ». |
| Confirmation bancaire | `CheckoutPaymentStep.isProcessing` est local. Le parent autorise « Récapitulatif » selon `confirmationState`, qui passe en attente seulement après le retour de `confirmPayment`. Les états de soumission et de fermeture ne sont pas synchronisés. |
| Contrôleur | Les états `processing` et `requires_action` existent, mais leur présence dans le reducer ne prouve pas leur connexion aux événements Stripe de la vue. Examiner les appelants réels. |
| Annulation client | `handleConfirmCancel` ignore l'`outcome` renvoyé. Le serveur peut retourner `paid` lors d'une course : ce n'est pas un succès d'annulation. |
| Disponibilité publique | `isSoldOut` et l'overview assimilent stock zéro à vente. Attention : le commit V2 ne renseigne pas systématiquement `furniture.sold=true`. Se fier seulement à ce booléen casserait certaines ventes existantes. |
| Espace client | `getStatusInfo` omet `pending_payment` et affiche « Préparée » par défaut ; « Document à venir » apparaît sans condition de paiement ; un fallback d'image peut montrer un autre meuble. |
| Tri admin | « Toutes » groupe les priorités avant la date : C143 était 29e, première dans « En attente ». La capture a confirmé sa présence, elle n'avait pas disparu. |
| Cache admin | Cache par identité, fraîcheur 120 s. Une entrée périmée disparaît de l'affichage pendant son rechargement. Les commandes ne se rafraîchissent pas continuellement dans la vue montée. |
| Habillage checkout | La route monte le header catalogue ; son bandeau est rendu en dehors du `<header>`. Masquer uniquement ce dernier ne supprime pas le bandeau. |
| Repère publication | `focusProduct` persiste dans l'URL ; le liseré de cinq secondes peut se réactiver au retour du détail. |

La clôture backend antérieure portait un périmètre et des preuves antérieurs à
cette recette. Elle ne valide pas ces cas nouveaux. Les correctifs précédents de
`listMyOrdersV2Gen2` et les changements Git préexistants doivent être préservés.

## 3. Parcours cible et textes

### Avant réservation

- Plusieurs clients peuvent voir le même meuble et remplir leurs informations.
- Panier et coordonnées conservés en revenant à la galerie ; aucune promesse de
  disponibilité définitive. Le serveur revérifie prix, stock, droits et livraison.
- « Procéder au paiement » ne doit pas réserver un panier partiel si une de ses
  lignes n'est plus disponible : résultat atomique, erreurs par article utiles.

### Réservation obtenue

- Même commande et même PaymentIntent lors des répétitions ou reprises.
- Afficher l'échéance issue du serveur, pas une durée redémarrée localement.
- Texte : « Vos pièces sont réservées jusqu'à HH:MM. Aucun paiement n'a encore
  été effectué. » Ce texte n'est valable que pour l'état impayé vérifié.
- « Payer », « Récapitulatif » et « Annuler la réservation » ont des rôles distincts.
- Sortie volontaire vers la galerie : confirmation « Si vous confirmez, ces
  pièces ne vous seront plus réservées. » Boutons « Garder ma réservation » et
  « Annuler et retourner à la galerie ».
- Attendre le résultat réel d'annulation avant d'annoncer une libération. Si le
  réseau coupe, afficher la vérification nécessaire, pas un faux succès.

### Paiement soumis / validation bancaire

- Une seule soumission effective. Désactiver les actions concurrentes du site
  dès la soumission, sur carte comme sur Express Checkout. Ne pas fermer ou
  démonter le Payment Element pendant son authentification bancaire.
- Le navigateur peut néanmoins fermer ou naviguer : la récupération serveur
  doit fonctionner sans dépendre d'un callback React final.
- Une erreur de saisie ou un refus connu permet de corriger et réessayer ; un
  état financier inconnu exige une vérification avant toute nouvelle tentative.
- Le succès UI et le nettoyage des lignes du panier exigent le `paid` durable,
  pas seulement une URL `order_success=true` ou le nom d'un callback de succès.
- Les 45 s actuelles d'attente de confirmation UI ne sont ni un timeout bancaire
  ni une autorisation d'annuler. Prévoir une issue Réessayer/Consulter le dossier
  après cette attente, sans présenter la transaction comme échouée.

### Retour après interruption

- Au retour identifié, recherche bornée des dossiers actifs appartenant à l'UID,
  réutilisant les lectures/cache existants si possible. Aucun polling global.
- Popup accessible, une seule présentation par retour pertinent, sans répétition
  à chaque navigation : « Vous avez un paiement à finaliser. Vos pièces sont
  réservées jusqu'à HH:MM. » Actions Reprendre / Annuler la réservation, plus une
  fermeture qui conserve le délai et laisse une carte visible dans panier/compte.
- Seul « Reprendre » ouvre le paiement depuis la galerie. Un reload direct du
  paiement peut restaurer le même dossier après contrôle serveur.
- Si payé, montrer la confirmation ; si expiré/annulé, expliquer et proposer de
  revérifier la disponibilité ; si inconnu, proposer de vérifier son état.
- Même compte, autre appareil : reprise depuis les dossiers serveur autorisés,
  sans dépendre uniquement du localStorage. Invité : identité anonyme conservée
  sur ce navigateur uniquement ; aucune récupération par simple e-mail ou ID.
- Purger les données visibles et invalider les callbacks de l'ancien UID au
  changement d'identité. Ne pas annuler sa commande ni effacer son panier serveur.
- Un nouveau panier ne remplace pas silencieusement le dossier réservé. Garder
  les nouvelles lignes séparées et rendre explicite tout abandon/recréation.

## 4. Contrat serveur : concurrence, annulation et échéance

Réutiliser transactions, sagas, commandes idempotentes, inbox/outbox, mouvements
et mécanismes de rapprochement existants. Pas de remise à zéro ni de nouveau
moteur parallèle. Les états ci-dessous sont un contrat fonctionnel ; les mapper
sur le schéma existant avant de créer des champs ou collections.

- **Course au dernier meuble** : une transaction arbitre tous les articles du
  panier. Un seul détenteur d'une unité ; aucun stock négatif. Une lecture UI
  préalable n'est jamais une autorisation de vendre.
- **Requêtes répétées/deux onglets** : identifiants stables et déduplication
  serveur ; pas de hold ni de PaymentIntent supplémentaire au rejeu. Ne pas
  rallonger implicitement la réservation via une recréation automatique.
- **Création interrompue** : couvrir hold réussi puis erreur Stripe, ou Stripe
  réussi mais réponse perdue. Retrouver le résultat avec la même idempotence ;
  compenser seulement une situation certaine. Aucun hold orphelin sans reprise.
- **Annulation** : réutiliser `requestOrderCancellation`. Vérifier le fournisseur,
  annuler ce qui est annulable, libérer une seule fois après confirmation. Si
  Stripe a payé entre-temps, conserver la vente et retourner le vrai résultat.
- **Échéance** : tâche ciblée à 15 min, correct format CloudEvent, retries et
  secours existant. Une tâche obsolète ne ferme pas un autre état du dossier.
  Corriger les refus de reprise expirée même si la tâche n'a pas encore tourné.
- **Paiement en cours à l'échéance** : ne pas réouvrir le stock par simple horloge
  ni interrompre aveuglément une validation bancaire. Rapprocher l'état fournisseur.
  Une réservation impayée inerte doit être clôturée ; un paiement engagé/incertain
  peut nécessiter une rétention de sécurité au-delà des 15 min, avec retries
  bornés et incident exploitable. Distinguer cette rétention de la possibilité
  pour le client de prolonger sa réservation. Ne pas inventer un délai bancaire
  universel ; préciser dans l'implémentation les transitions selon les statuts
  réellement servis et les moyens de paiement activés.
- **Événements retardés/doublons** : rapprochement fournisseur, cohérence des
  versions, effets uniques sur stock, paiement et faits financiers. Tester la
  course expiration/annulation/succès, pas seulement chaque handler isolément.
- **Publication** : projeter la disponibilité correcte dans le snapshot public
  puis utiliser la signalisation bornée existante. Sans ventes confirmées,
  afficher Réservé/Indisponible selon la preuve disponible, pas Vendu. Pas de
  lecteur Firestore public ajouté pour rendre l'affichage artificiellement rapide.

## 5. Périmètre UI complémentaire retenu

- Espace client : « Paiements à finaliser », montant à régler, échéance, reprise
  et annulation. Réservations distinctes des achats payés. Aucun faux « Préparée »,
  document promis ou image d'un autre meuble ; placeholder neutre si nécessaire.
- Admin Ventes : « Toutes » par création décroissante, ordre stable et pagination
  conservés. Garder les filtres métiers. Afficher les états d'attente/expiration
  sans masquer une nouvelle commande derrière un groupe de dossiers anciens.
- Admin Ventes/Devis/Factures/Retours : dernière page connue affichée pendant une
  actualisation bornée avec indication de fraîcheur. Conserver purge des droits,
  déduplication, erreurs visibles et invalidation après mutation. Pas de chargement
  global de tous les historiques ni de rafraîchissement Firebase permanent.
- Checkout : habillage cohérent aux étapes coordonnées/reprise/paiement, sans
  bandeau catalogue ni catégories. Préserver identité premium, responsive, focus,
  Escape quand admissible, safe areas et réduction des animations.
- Publication : consommer le repère vert une seule fois, nettoyer les timers,
  conserver scroll et retour au bon meuble.

## 6. Points d'entrée utiles

Lecture de reprise : [AGENTS.md](../../AGENTS.md), [map.md](../../map.md),
[Commerce Stripe](COMMERCE_STRIPE.md), [Synthèse commerce](COMMERCE_SYNTHESE.md),
[Qualité/tests](../quality/QUALITE_TESTS.md). Les anciens mandats de recette ne
sont pas reconduits par ces lectures.

| Responsabilité | Fichiers |
| --- | --- |
| Page, identité, panier, retour Stripe | `app/checkout/page.jsx`, `app/checkout/CheckoutPageIsland.jsx` |
| Création/reprise et récapitulatif | `src/kit/commerce/CheckoutView.jsx`, `checkoutController.js`, `checkoutRecovery.js`, `commerceV2Client.js` |
| Confirmation Stripe et fermeture | `src/kit/commerce/CheckoutPaymentStep.jsx`, `CheckoutStripeModal.jsx` |
| Client et annulation | `src/kit/commerce/MyOrdersView.jsx`, `commerceCommandClient.js`, `orderAdapter.js` |
| API et domaine | `functions/src/commerce/v2Checkout.js`, `v2Cancellation.js`, `domain/checkoutRepository.js`, `checkoutCoordinator.js`, `checkoutSagaService.js`, `reservationRepository.js`, `cancellationCoordinator.js` |
| Expiration et déploiement | `functions/src/commerce/commerceEventDispatch.js`, `v2ReservationExpiry.js`, `domain/reservationExpiryWorker.js`, `scripts/deploy-functions-targeted.mjs` |
| Stock et galerie | `src/kit/commerce/purchasability.js`, `functions/src/catalog/inventoryProjection.js`, `src/kit/marketplace/GalleryLiveProductGridIsland.jsx`, `ArchitecturalHeaderServer.jsx` |
| Admin | `src/kit/admin/AdminOrders.jsx`, `components/orders/orderPresentation.js`, `adminDataCache.js`, `adminCommerceData.js`, `app/admin/AdminAppIsland.jsx` |

Vérifier les imports/appelants réels et le packaging des Functions avant modification.
Le runtime Stripe et les états distants ne sont pas déductibles d'une simple
capture. Référence fournisseur : [confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment).

## 7. Validation finie et critères de livraison

Réutiliser les tests existants et compléter les scénarios manquants. Points de
départ : `tests/commerce/resilience/checkout-boundaries.test.cjs`,
`tests/commerce/browser/checkout-resilience.spec.mjs`,
`tests/commerce/domain/gate5-consumers.test.cjs`,
`tests/admin-data-cache-contract.test.mjs`, `tests/catalog/`.
Choisir les commandes depuis le guide qualité, vérifier qu'aucun runner local
ne vise silencieusement Firebase ou Stripe hébergés.

| Cas à valider | Preuve attendue |
| --- | --- |
| Deux clients, même dernier meuble | Un seul hold/paiement ; message exact au perdant ; pas de panier partiellement réservé. |
| Double clic, deux onglets, retry réseau | Même dossier, effets uniques, échéance identique. |
| Erreur à chaque frontière de création | Paiement/hold retrouvés ou compensés sans doublon ni libération hasardeuse. |
| Retour récapitulatif puis sortie volontaire | Conservation puis annulation confirmée ; annulation refusée si déjà payé. |
| Carte refusée et correction | Même dossier, délai non prolongé. |
| Validation bancaire/Express Checkout | Pas de fermeture concurrente du site ni démontage de l'authentification ; succès après preuve durable. |
| Page fermée ou réseau coupé après soumission | Reprise par état réel ; jamais une deuxième commande par défaut. |
| Retour Stripe et webhook retardé | Paramètres URL non considérés comme preuve ; UI de vérification puis état exact. |
| Échéance avant/pendant paiement | Fermeture sûre, pas de reprise périmée ni revente d'une unité payée. |
| Webhook/tâche dupliqué, retardé, hors ordre | Stock et faits uniques, aucun état terminal régressé. |
| Déconnexion/changement UID/autre appareil | Isolation, droits préservés, popup adapté ; pas de faux conflit ni de fuite de panier. |
| Nouveau panier avec réservation active | Aucun écrasement silencieux des lignes ou du dossier. |
| Client/admin/catalogue | Statuts et images exacts, tri récent, pagination et cache autorisé conservés. |
| Navigation locale desktop/mobile | Bandeau absent du checkout, sortie/reprise lisibles, focus correct, liseré non réactivé. |

Tests métier purs et émulateurs **demo** pour concurrence/idempotence ; scénarios
navigateur locaux avec fournisseur simulé pour les états UI. Une simulation ne
prouve pas un vrai 3D Secure ou un vrai transport Eventarc : distinguer les preuves
locales des vérifications sandbox à autoriser avant livraison.

Critère de fin : corrections locales terminées, validations adaptées passées,
aucun blocage connu non nommé, documentation alignée et liste exacte des cibles
à livrer avec rollback. Aucun nouvel audit général ni promesse d'infaillibilité.

## 8. Réalisation locale du 6 septembre 2026

Liste finie réalisée :

- Réservation standard de 900 secondes dans la transaction de création, après
  la branche de rejeu idempotent ; aucun hold pendant les coordonnées. Échéances
  historiques et échéances explicites des liens admin conservées. Reprise serveur
  refusée après échéance, sans annoncer prématurément une libération.
- Identité de requête enregistrée avant l'appel, isolée par UID, conservée après
  perte de réponse ; Web Locks coordonne les onglets compatibles. Sans Web Locks,
  l'arbitrage transactionnel serveur protège toujours le stock, sans garantie
  d'identifiant client commun entre deux onglets simultanés.
- Reprise depuis le récapitulatif, le compte et une proposition en galerie,
  sans confirmation Stripe automatique. Découverte limitée à 25 commandes ;
  un dossier plus ancien reste accessible par la pagination du compte. Les
  lignes et coordonnées de reprise viennent du dossier serveur appartenant au UID.
- Carte et Express Checkout partagent une barrière synchrone de soumission.
  Elements reste monté pendant la confirmation bancaire ; fermeture concurrente
  bloquée. Réponse ambiguë et retour Stripe attendent le paiement durable,
  avec vérification bornée et accès au compte après timeout.
- Sortie vers galerie confirmée par dialogue accessible. Annulation provider-first :
  un paiement déjà réussi reste payé ; processing/requires_action/requires_capture
  conservent la réservation en vérification. Expiration et notification retardée
  réutilisent la saga et les mouvements idempotents existants.
- Transport `FUNCTION_SIGNATURE_TYPE=cloudevent` préparé pour le seul déclencheur
  réservation ; événement mal formé rejeté. Retries bornés et secours horaire
  existants conservés, sans changement de capacité.
- Statuts client distincts, documents attendus seulement après paiement, image
  neutre lorsque la ligne n'a pas d'image. Catalogue : disponibilité explicite,
  stock nul seul insuffisant pour annoncer « Vendu ». La construction du snapshot
  consulte au plus 51 réservations par produit publié à stock nul sans vente
  explicite ; au-delà de 50, preuve incomplète et disponibilité indéterminée.
  Ces lectures métier supplémentaires ne masquent pas une lenteur ; leur coût
  hébergé n'a pas été mesuré. Aucun backfill des données historiques.
- Admin : « Toutes » par création décroissante stable ; dernière page autorisée
  conservée pendant actualisation/erreur dans commandes, devis, retours et factures,
  avec indication d'actualisation ; purge d'autorisation et pagination conservées.
- Checkout sans bandeau catalogue ni navigation globale ; `focusProduct` consommé
  après révélation et repère nettoyé. Faux conflit panier retiré, composants de
  checkout et compte isolés par UID. Changements préexistants du reader préservés.

### 8.1 Preuves locales et limites

Environnement : Node **22.23.2** sélectionné explicitement, pnpm **11.7.0**,
Next installé **16.3.0**, React **19.2.7**. Guides Next installés consultés avant
modification. Runners Node protégés par `no-network.cjs` ; navigateur sur serveur
loopback avec fournisseur et Firestore simulés, requêtes externes bloquées ;
Firestore exécuté exclusivement sur `demo-secondevie-commerce`.

| Cas de la matrice | Preuve obtenue et limite |
| --- | --- |
| Deux clients, dernier meuble | Transactions et courses des suites domaine/Firestore demo ; aucune recette financière hébergée. |
| Double clic, deux onglets, retry | R02/R03 métier et navigateur ; test navigateur du véritable stockage d'identité avec Web Locks et reload. |
| Frontières de création | `checkout-boundaries` R01/R02/R05/R07/R16 et suites faults ; fournisseur simulé. |
| Récapitulatif et sortie | Conservation par contrôleur/recovery ; dialogue réel testé pour choix explicite, Escape et restauration du focus ; résultat paid/canceled vérifié au domaine. |
| Refus et correction | Composants paiement réels sous fournisseur simulé : refus connu autorise retry, ambiguïté bloque la double soumission ; délai serveur épinglé. |
| Banque et Express | Tests carte/wallet des composants réels : un seul appel, Elements monté, fermeture bloquée, succès seulement après notification paid ; pas de vrai 3DS. |
| Interruption après soumission | R04/reload, identité persistante et saga après réponse perdue ; fermeture réelle d'une banque externe non testée. |
| Retour Stripe/webhook retardé | R10, test UI de notification paid retardée, contrat du listener de retour ; URL non probante. Pas de redirection Stripe réelle. |
| Échéance avant/pendant | Test de frontière exacte, refus client avant confirm, worker processing/requires_action/requires_capture puis succès retardé ; expiration inerte annule avant release. |
| Doublons et désordre | Suites faults/property/régression et R09/R13 : monotonie, commit ou release, effets uniques. |
| UID/autre appareil | Tests de propriété du descriptor et cache, R14 ; découverte serveur bornée et clés UID contrôlées dans le code. Deux appareils physiques non utilisés. |
| Nouveau panier/réservation | R04 et reprise des lignes immuables ; suppression du faux conflit et conservation du dossier contrôlées dans le code. |
| Client/admin/catalogue | Tests projection/disponibilité, présentation/tri, cache périmé et purge ; build. Pas de recette navigateur complète des quatre listes sur données réelles. |
| Desktop/mobile | 20 tests navigateur locaux : parcours de résilience et composants paiement/dialogue. Absence du bandeau et nettoyage focusProduct vérifiés dans le code/build ; pas de comparaison visuelle complète des pages. |

Résultats : **206/206 tests Node ciblés**, **20/20 tests navigateur desktop/mobile**,
**20/20 scénarios Firestore demo (114 assertions)**, build Next avec
`CATALOG_BUILD_FIXTURE=true` réussi. Le script `test:checkout-reconstruction`
permet de rejouer le complément ciblé ; les commandes générales restent dans
[le guide qualité](../quality/QUALITE_TESTS.md).
Lint ciblé frontend et backend : **0 erreur**, trois avertissements historiques
`img` et un argument inutilisé historique dans le script de déploiement.
`git diff --check` réussi ; **105 liens locaux** des chapitres concernés résolus.
Le complément cache retours vérifie aussi l'échec partiel d'actualisation et la
purge lorsque le lecteur refuse l'autorisation.

La campagne Node élargie avait révélé une assertion obsolète hors périmètre dans
`gate7a-operations.test.cjs` (« Gate7A dashboard ») : elle attend l'ancien accès
direct `admin_dashboard`, alors que le HEAD préexistant utilise `dashboardReads`.
Elle n'a pas été modifiée. Les autres échecs rencontrés ont été corrigés et les
206 tests ciblés sont repassés. Les deux refus historiques `invalid-argument`
restent de **cause inconnue**. Aucun gain de performance n'est annoncé.

### 8.2 Livraison et vérifications à autoriser

**État avant la nouvelle autorisation de livraison : aucun commit, push, merge,
déploiement ou effet métier hébergé effectué.** Livraison ensuite consignée en §9.
Le [plan local de livraison](../../deploy/checkout-reconstruction-20260906.json)
énumère les **12 cibles Functions exactes** vérifiées contre le script de
déploiement, le backend App Hosting frontend et le correctif de transport.
La règle de 900 secondes est locale au nouveau checkout standard : aucune
mutation de politique cloud, d'index, de données ou de capacité. La migration
des 142 commandes / 181 faits reste hors périmètre.

Une nouvelle autorisation doit couvrir le déploiement ciblé sandbox de ces
12 Functions et du frontend, après capture des révisions réellement actives,
digests sources, environnement, files de tâches, politique et pointeurs catalogue.
Ne pas recopier les observations datées de l'incident comme inventaire actuel.

Vérifications hébergées à autoriser explicitement : livraison d'un vrai CloudEvent,
création d'une tâche à l'échéance de 15 minutes et comportement des retries ;
recette Stripe **test** bornée avec refus, 3DS, Express Checkout, interruption,
annulation et succès retardé ; convergence stock/commande et publication de la
disponibilité ; reprise avec changement d'identité ; retour checkout/galerie,
statuts/documents et fraîcheur/pagination admin. Les tests locaux ne ferment pas
ces preuves. Aucun runner `DO_NOT_RUN` n'a été exécuté.

Rollback à préparer avant livraison : restaurer les révisions frontend/Functions
capturées, conserver un transport CloudEvent correct, vérifier les tâches en vol
et la convergence avant reprise. Préserver les échéances persistées, paiements,
faits et mouvements ; aucune restauration manuelle de stock ni suppression de
commande. Aucun déploiement global Functions.

## 9. Livraison sandbox autorisée le 6 septembre 2026

L'utilisateur a ensuite demandé de tout mettre à jour pour tester. App Hosting
sert **`build-2026-09-05-003`**, READY et **100 % du trafic**, avec le deployment ID
**`sv-mtp14jn2-5a4f788bc171`**. Le nom du build utilise la date UTC du 5 septembre ;
la livraison a lieu le 6 septembre en heure de Paris.

Les **12 Functions prévues**, plus **`listMyOrdersV2Gen2`** dont le correctif
préexistant restait à livrer, sont **ACTIVE**. Le [manifeste de livraison](../../deploy/checkout-reconstruction-20260906.json)
porte le périmètre et les empreintes. Les preuves et sauvegardes locales sont
dans `logs/recette/checkout_delivery_20260906/` : inventaire avant/après, opérations,
archives de rollback avec SHA-256, sources livrées et bundle Git de la copie isolée.

Les mises à jour portent seulement sur les sources et, pour
`onCommerceReservationWrittenGen2`, la variable `FUNCTION_SIGNATURE_TYPE=cloudevent`
en conservant les autres variables. Capacités, identités de service et
configuration des triggers ont été comparées et conservées. Le packaging conserve
les deux noms d'entrée webhook réellement déployés, absents de l'inventaire local
ordinaire. Le lecteur conserve son chemin de chargement isolé ; révision finale
**`listmyordersv2gen2-00004-xeb`**. La branche de travail reste inchangée : commits
techniques uniquement dans une copie détachée de livraison, aucun push ou merge.

Le contrôle commerce relu est toujours révision **77**, `v2_all/v2`, offline off.
La politique historique reste à 1800 secondes ; le code livré impose 900 secondes
aux seules nouvelles réservations standard, après le rejeu idempotent. Aucune
échéance existante, commande ou donnée financière n'a été migrée.

Le snapshot catalogue a été reconstruit une fois pour projeter la nouvelle
disponibilité, via l'identité IAM opérateur autorisée et la file existante avec
son identité `catalog-enqueuer`. Mise à jour du contrôle sous précondition de
version, puis tâche déterministe ; aucun produit métier modifié. Révision
**338**, publiée, revalidée, `servedState=observed`, `dirty=false`, sans erreur.
Le snapshot public expose **36 pièces : 5 disponibles et 31 vendues** à cette
observation ; aucun stock nul n'est promu vendu sans preuve.

Contrôles hébergés effectués : `/`, `/checkout`, `/mes-commandes`, `/admin` et
`/api/catalog/version` répondent **200** ; les pages privées restent `no-store`.
Création, reprise et lecteur refusent l'appel anonyme (**401**) ; le webhook refuse
la requête sans signature (**400**). Aucun paiement, remboursement, connexion de
recette ou e-mail déclenché manuellement. La configuration Eventarc est livrée ;
un véritable événement de réservation, l'expiration à 15 minutes et Stripe/3DS
restent à exercer dans une recette financière bornée, distincte du déploiement.
La lecture bornée des logs des nouvelles révisions depuis le début du déploiement
ne relève aucune entrée ERROR à la clôture ; ce constat n'est pas un soak prolongé.
`git diff --check` et les **106 liens locaux** concernés ont été vérifiés.

Rollback conservé : hosting **`build-2026-09-05-002`**, les 13 révisions et archives
Functions antérieures inventoriées, et pointeurs catalogue **337/335/333** capturés
avant reconstruction. Ne pas restaurer manuellement les faits, paiements ou stocks.
