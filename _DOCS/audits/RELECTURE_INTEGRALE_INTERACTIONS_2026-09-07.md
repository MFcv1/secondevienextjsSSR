# Relecture intégrale des interactions — 7 septembre 2026

**Résultat : relecture intégrale des 448 fichiers du périmètre applicatif, corrections locales et vérifications terminées. Aucun déploiement.**

Ce rapport complète la [première passe](AUDIT_INTERACTIONS_2026-09-07.md), qui ne couvrait que 94 fichiers par lecture ciblée. Les 17 groupes de correctifs de cette première passe sont conservés. La présente passe a repris chaque fichier dans son intégralité, puis vérifié ses appelants, ses consommateurs et les changements nécessaires. Elle ne se limite pas à une recherche de motifs ni à un résultat de linter.

## 1. Périmètre exact et traçabilité

Les 442 fichiers de l'inventaire précédent ont tous été relus intégralement. Six petits modules ont été ajoutés et également relus : état OTP conditionnel, concurrence de publication, classement d'inventaire, export utilisateurs, durée de vie des interactions DOM et focus des dialogues.

Le périmètre comprend tous les fichiers JS/JSX/MJS/CJS/TS/TSX présents sous `app/`, `src/`, `shared/` et `functions/`, ainsi que `next.config.mjs`, `firestore.rules` et `storage.rules`. Il couvre les pages, composants, stores, transports, guards, domaines métier, repositories, workers, projections, intégrations et templates de mail. Les sources analytics ont aussi été lues ; aucune mesure serveur, consultation de logs cloud ou analyse de trafic n'a été effectuée.

Les feuilles de style, images, vidéos, dépendances tierces, archives et scripts d'exploitation ne sont **pas** présentés comme intégralement audités. Les tests, configurations et documents nécessaires ont été consultés séparément. La complétude annoncée porte sur ce périmètre applicatif explicite, pas sur chaque fichier physique du dépôt.

- [Inventaire des 448 fichiers](preuves/interactions-2026-09-07-relecture-integrale.json) : lecture, notes individuelles, empreinte à la lecture, empreinte finale, taille, modifications par rapport au début de cette passe.
- [Validations reproductibles](preuves/interactions-2026-09-07-relecture-validations.json) : commande exacte, tests sélectionnés, empreintes et alertes ESLint.
- [Journal des tests locaux](preuves/interactions-2026-09-07-relecture-tests.txt).
- [Patch des sources de cette passe](preuves/interactions-2026-09-07-relecture-sources.patch) : comparaison avec la copie locale prise au démarrage de la relecture ; ce n'est pas un diff contre HEAD.

Base : branche `codex/stats-data-performance`, HEAD `10c6b1b8b402a6011045b37b683acf185c1e06b8`, arbre de travail déjà modifié. **109 sources modifiées ou ajoutées** par cette passe, dont les six modules nouveaux ; un index Firestore complémentaire est également défini. Les changements préexistants n'ont pas été réinitialisés. Les fichiers entièrement lus puis corrigés portent les empreintes avant et après : l'empreinte de lecture n'est pas remplacée silencieusement par celle du correctif.

Méthode : lecture manuelle par l'agent, sans prétendre être un auditeur humain, sans Codex Security, sans scan de plugin, sans sous-agent et sans navigateur. Les guides Next installés ont été consultés avant les modifications concernées. Les expériences de concurrence utilisent des dépendances simulées et le garde réseau du dépôt.

## 2. Identité, accès et isolation des sessions

### R01 — Passkey : réexaminer le propriétaire et le compteur dans la transaction

La vérification cryptographique ne suffisait pas à rendre atomiques la lecture et l'enregistrement du credential. Le serveur relit le credential au moment de la transaction et refuse un propriétaire ou un compteur devenu incompatible. Deux authentifications concurrentes ne peuvent plus écraser silencieusement la progression du compteur.

Source : [passkeys.js](../../functions/src/auth/passkeys.js). Preuves : `passkey-transaction-audit`, `passkey-server-hardening`, `passkey-registration-audit`.

### R02 — Migration administrateur : ne pas réactiver un accès retiré entre deux lectures

Les chemins de migration/promotion relisent le registre et l'invitation dans leur transaction. Une révocation concurrente ne peut plus être remplacée par la copie périmée lue avant l'opération. Les claims, le registre actif et l'assurance forte restent nécessaires ; aucun compte de recette n'a été promu.

Sources : [adminManagement.js](../../functions/src/auth/adminManagement.js), [grantAdmin.js](../../functions/src/auth/grantAdmin.js). Preuves : `admin-migration-audit`, `auth-admin-revocation`, `auth-claims`.

### R03 — OTP : empêcher un ancien callback de modifier un nouveau challenge

Le nouveau helper [otpState.js](../../functions/src/auth/otpState.js) compare la génération attendue dans la transaction avant toute mise à jour. Un retour tardif de l'envoi du mail ou de l'émission du token ne peut plus modifier les tentatives, le statut ou le challenge suivant. Les chemins client et checkout invité utilisent ce contrôle.

Preuves : `otp-state-audit`, `auth-unified-otp-contract`, `auth-backend-transitions`.

### R04 — Connexion : attacher le token OTP au couple email/code

Un token conservé pour réessayer une connexion réseau est maintenant associé à l'email et au code qui l'ont produit. Changer l'un des deux invalide sa réutilisation. Un verrou commun évite les opérations Google/OTP/passkey concurrentes ; une réponse reçue après fermeture ne poursuit pas la connexion. Les champs sont verrouillés pendant l'opération et les erreurs de préchargement Google sont capturées.

Source : [LegacyLoginModalFullIsland.jsx](../../src/kit/marketplace/LegacyLoginModalFullIsland.jsx). Preuves : `login-retry-isolation-audit`, `auth-store-contract`, `auth-custom-token-sign-in`.

### R05 — Initialisation Auth et changement d'identité

L'écoute Auth est installée même si la récupération du résultat de redirection Google échoue. Les racines Wishlist et Admin sont recréées pour la nouvelle identité afin de ne pas réutiliser l'état asynchrone du compte précédent. La vidéo du login n'est chargée que dans le contexte desktop admissible et respecte la réduction des animations.

Sources : [authStore.js](../../src/kit/auth/authStore.js), [AdminAppIsland.jsx](../../app/admin/AdminAppIsland.jsx), [WishlistPageIsland.jsx](../../app/wishlist/WishlistPageIsland.jsx), [LoginBackgroundVideo.jsx](../../src/kit/auth/LoginBackgroundVideo.jsx). Preuve comportementale : `auth-redirect-audit`.

### R06 — Registre administrateur historique protégé dans les rules

Les écritures directes dans `sys_metadata/admin_users` sont désormais exclues de la liste des métadonnées administrables. Cela évite de fabriquer des entrées de registre qui peuvent perturber les opérations de retrait/migration. Ce constat ne signifie pas qu'une entrée seule donnait une claim propriétaire.

Source : [firestore.rules](../../firestore.rules). Le contrat statique est testé. Un scénario d'émulateur a été ajouté, **mais l'émulateur n'a pas été lancé** : l'application effective des rules reste à vérifier lors de leur qualification autorisée.

## 3. Panier, checkout et reprise du paiement

### R07 — Identifiants de lignes de panier dupliqués

La normalisation serveur du checkout refuse les doublons de `cartLineId`. Un panier artificiel ne peut plus faire diverger l'identité des lignes et les écritures de commande/réservation.

Source : [checkoutInput.js](../../functions/src/commerce/domain/checkoutInput.js). Preuve : `gate2-policy-inventory`.

### R08 — Migration du panier invité et nettoyage après paiement

La fusion vers le panier du compte utilise une transaction et conserve une ligne distante déjà présente. Le retrait local vise uniquement les lignes effectivement migrées, avec la même identité/révision. Le nettoyage du descripteur de reprise exige maintenant l'UID et la commande attendus ; les appelants ont été adaptés. Un paiement dans un autre onglet ne doit pas effacer une reprise plus récente.

Sources : [checkoutRecovery.js](../../src/kit/commerce/checkoutRecovery.js), [CheckoutPageIsland.jsx](../../app/checkout/CheckoutPageIsland.jsx), appelants recensés dans l'inventaire. Preuve : `cart-recovery-races-audit`.

### R09 — Verrouillage du snapshot de commande dans l'interface

Les champs du checkout et les changements de mode de paiement sont bloqués pendant la préparation et après obtention de l'identifiant de commande. L'utilisateur ne peut plus afficher de nouvelles données de formulaire tout en poursuivant le paiement d'un ancien snapshot.

Source : [CheckoutView.jsx](../../src/kit/commerce/CheckoutView.jsx). Les prix, droits et stocks restent contrôlés côté serveur.

### R10 — Retour Stripe et lien de paiement

La commande explicitement désignée par le retour Stripe a priorité sur une reprise provenant d'un autre onglet. Le nettoyage du panier cible les lignes correspondantes. La page du lien de paiement est recréée quand sa commande/son token change ; l'expiration est affichée depuis la valeur reçue. Après une vérification longue, le panneau conserve un état de vérification avec une relance possible, sans proclamer un succès non durable.

Sources : [CheckoutPageIsland.jsx](../../app/checkout/CheckoutPageIsland.jsx), [PaymentLinkPageIsland.jsx](../../app/payer/[orderId]/[token]/PaymentLinkPageIsland.jsx), [checkoutRecovery.js](../../src/kit/commerce/checkoutRecovery.js). Preuves : `customer-ui-audit`, tests de reprise et de frontières checkout.

### R11 — Expiration concurrente avec prolongation d'un lien

Le worker relit l'échéance dans la transaction précédant l'annulation fournisseur. Si une prolongation a gagné, la saga s'arrête avant l'appel Stripe. Réciproquement, une prolongation refuse une tentative déjà engagée dans l'annulation. Cela ferme la fenêtre où un lien prolongé pouvait être annulé sur une ancienne date.

Sources : [reservationExpiryWorker.js](../../functions/src/commerce/domain/reservationExpiryWorker.js), [checkoutSagaRepository.js](../../functions/src/commerce/domain/checkoutSagaRepository.js), [checkoutSagaService.js](../../functions/src/commerce/domain/checkoutSagaService.js), [adminPaymentLinkCoordinator.js](../../functions/src/commerce/domain/adminPaymentLinkCoordinator.js). Preuve : `expiry-extension-audit`.

### R12 — Suppression du writer legacy devenu interdit

[createOrder.js](../../functions/src/commerce/createOrder.js) passe de 618 lignes à un point d'entrée court qui rejette explicitement l'ancien rail avant effet. Le code de création SDK obsolète a été retiré, les compatibilités de lecture et de drainage restent dans leurs modules dédiés.

Preuve : `legacy-entrypoint-audit`, avec absence d'écriture métier sur les appels legacy.

## 4. Commandes, remboursements, retours et documents

### R13 — Décision de retour et remboursement atomiques

La décision financière sur une demande client ne repose plus sur plusieurs écritures indépendantes. Les repositories relisent les faits, vérifient la version et enregistrent la décision avec ses effets attendus atomiquement. Les données nécessaires à la réception et aux reprises sont conservées. Les remboursements restent idempotents ; remboursement financier, réception physique et remise en stock restent distincts.

Sources : [customerReturnRequest.js](../../functions/src/commerce/domain/customerReturnRequest.js), [returnCase.js](../../functions/src/commerce/domain/returnCase.js), [refundRepository.js](../../functions/src/commerce/domain/refundRepository.js), [returnRepository.js](../../functions/src/commerce/domain/returnRepository.js), transports v2 et runtime associés. Preuves : `return-decision-audit`, `customer-return-requests`, `gate4-commands-returns`, `gate4-refund`.

### R14 — Présentation client et admin des montants remboursables

Les montants confirmés et les remboursements en attente sont pris en compte séparément. Une donnée financière absente n'est plus remplacée par le total initial de la commande. Les remboursements partiels, l'aide en cas d'incident et la portée des listes chargées sont explicités. Le rafraîchissement de Retours conserve la version la plus récente ; le verrou d'action évite les doubles décisions.

Sources : [MyOrdersView.jsx](../../src/kit/commerce/MyOrdersView.jsx), [AdminReturns.jsx](../../src/kit/admin/AdminReturns.jsx), [orderPresentation.js](../../src/kit/admin/components/orders/orderPresentation.js). Preuves : `customer-ui-audit`, `admin-returns-audit`, `admin-orders-presentation`.

### R15 — Réponses de commandes tardives et focus

Pagination, actualisation et lecture ciblée sont protégées par génération. Une ancienne réponse ne remplace plus une commande de `stateVersion` supérieure. L'ouverture d'une commande hors de la page chargée utilise sa lecture ciblée ; le cache concerné est invalidé après changement. Les valeurs inconnues restent affichées comme inconnues. Les dialogues conservent le focus et empêchent une fermeture accidentelle pendant l'action.

Sources : [AdminOrders.jsx](../../src/kit/admin/AdminOrders.jsx), [OrderModalShell.jsx](../../src/kit/admin/components/orders/OrderModalShell.jsx).

### R16 — Workers bornés et historique financier par devise

Le sweeper termine correctement lorsque le curseur atteint la dernière page, au lieu d'annoncer à tort une reprise incomplète. La projection financière EUR ignore les faits d'une autre devise au lieu d'effacer/remplacer des données EUR ; le compteur de captures suit la même règle.

Sources : [boundedWorkerSweeper.js](../../functions/src/commerce/domain/boundedWorkerSweeper.js), [financialHistoryProjection.js](../../functions/src/admin/financialHistoryProjection.js), [businessEvents.js](../../functions/src/observability/businessEvents.js). Preuves : `gate3-workers`, `financial-history-projection`, `manual-audit-completion`.

### R17 — PDF complets, immuables et contrôlés

Le document commerce conserve jusqu'aux 50 lignes autorisées au lieu d'en tronquer après 20. Les factures manuelles paginent les longues descriptions et toutes les lignes autorisées avec répétition des en-têtes. Un artefact existant est relu et contrôlé par génération, empreinte, taille et signature PDF ; une concurrence de création reprend l'objet gagnant au lieu de réécrire un document émis.

Sources : [commerceDocumentArtifact.js](../../functions/src/commerce/domain/commerceDocumentArtifact.js), [manualInvoicePdf.js](../../functions/src/invoicing/manualInvoicePdf.js), [manualInvoices.js](../../functions/src/invoicing/manualInvoices.js). Preuves : `manual-invoice-artifact-audit`, tests de génération avec jsPDF réel. **Pas de recette visuelle PDF.**

### R18 — Brouillon de facture et lecture de document

Une nouvelle facture reçoit une identité stable et une version initiale cohérente. La sauvegarde est dédupliquée, attendue avant la génération du PDF et verrouillée après émission. Les dates calendaires impossibles sont refusées. Le lecteur de document neutralise les réponses et URL Blob devenues obsolètes après fermeture/changement de document.

Sources : [AdminInvoices.jsx](../../src/kit/admin/AdminInvoices.jsx), [manualInvoiceDomain.js](../../functions/src/invoicing/manualInvoiceDomain.js), [CommerceDocumentModal.jsx](../../src/kit/commerce/CommerceDocumentModal.jsx). Preuves : suites `invoicing`.

## 5. Mails, devis et publications externes

### R19 — Un accusé de livraison ambigu n'est pas un succès

L'outbox classe un résultat fournisseur sans accusé exploitable en `delivery_unknown`. Elle ne le marque pas envoyé et ne le rejoue pas automatiquement. Les callbacks tardifs du programme newsletter ne peuvent plus réattribuer ou renvoyer un avantage déjà réservé/envoyé/ambigu pour un autre propriétaire.

Sources : [v2Runtime.js](../../functions/src/commerce/domain/v2Runtime.js), [newsletterRewards.js](../../functions/src/newsletter/newsletterRewards.js). Preuves : `outbox-runtime-audit`, `newsletter-delivery-audit`, `newsletter-rewards`. L'incertitude de livraison exige toujours un traitement explicite ; aucune boîte mail n'a été lue.

Dans [AdminNewsletter.jsx](../../src/kit/admin/AdminNewsletter.jsx), une erreur de lecture est distincte d'une liste vide ; une dernière page devenue vide conserve la possibilité de revenir à la page précédente.

### R20 — Photos de devis : identité unique et suppression prudente

Chaque tentative d'upload reçoit son propre chemin UUID. La transaction reconnaît une photo déjà enregistrée ; elle ne supprime que l'objet de sa propre tentative dont le caractère doublon est confirmé. Une réponse perdue ne provoque plus la suppression aveugle d'une photo potentiellement référencée.

Source : [quoteRequests.js](../../functions/src/quotes/quoteRequests.js). Preuves : `quote-photo-audit`, `quote-receipt-audit`, `quote-requests`.

### R21 — Formulaire de devis et suivi admin

Le formulaire possède un verrou de soumission couvrant aussi ses étapes. Une reprise conserve les informations durables de soumission et le nombre de photos ; une réponse perdue reprend la finalisation utile. Le chargement différé dispose d'un délai de secours si l'événement d'animation n'arrive pas. Côté admin, sélection, photos et réponses tardives sont isolées ; les erreurs et la portée des compteurs sont visibles, les champs sont bloqués pendant sauvegarde.

Sources : [QuoteFormIsland.jsx](../../src/kit/marketplace/QuoteFormIsland.jsx), [QuoteFormDeferredIsland.jsx](../../src/kit/marketplace/QuoteFormDeferredIsland.jsx), [quoteRequestClient.js](../../src/kit/marketplace/quoteRequestClient.js), [AdminQuotes.jsx](../../src/kit/admin/AdminQuotes.jsx). Preuve : `quote-client-audit` et suites devis.

### R22 — OAuth Meta et publication concurrente

La finalisation OAuth revalide l'état, le registre admin et la connexion dans la transaction finale. Les variantes de produit utilisent une génération de source déterminée et des noms uniques ; les écritures vérifient la version courante. Le journal de suppression du catalogue utilise une identité qui ne se confond pas avec la dernière mise à jour.

Sources : [meta.js](../../functions/src/integrations/meta.js), [productPublication.js](../../functions/src/publication/productPublication.js), [catalogMutationRecorder.js](../../functions/src/catalog/catalogMutationRecorder.js). Preuves : `meta-authorization-audit`, `publication-concurrency-audit`, `mutation-deletion-audit`.

### R23 — Publication UI : limiter la concurrence et conserver les reprises utiles

Deux compressions au plus s'exécutent ensemble. Après le premier échec, aucune tâche supplémentaire n'est lancée, mais les travaux déjà partis sont attendus. Le formulaire conserve les variantes uploadées pour une reprise compatible, protège la publication par un verrou et distingue une publication enregistrée de sa finalisation catalogue. Les champs, hashtags et commandes Meta suivent l'état occupé. Le collage du texte de story est borné ; le dépôt HTML natif est neutralisé.

Sources : [AdminForm.jsx](../../src/kit/admin/AdminForm.jsx), [publicationConcurrency.js](../../src/kit/admin/publicationConcurrency.js), composants de publication recensés dans l'inventaire. Preuve : `publication-concurrency-audit.test.mjs`.

## 6. Catalogue, recherche, favoris et navigation

### R24 — Disponibilité et catalogue admin bornés

Les disponibilités serveur sont lues par huit workers au plus en conservant l'ordre. Le catalogue admin parcourt toutes les pages nécessaires, jusqu'à 6 000 produits, détecte les curseurs répétés et ne mélange pas deux versions de snapshot ; il peut recommencer une fois après changement de version.

Sources : [availability.js](../../functions/src/catalog/availability.js), [adminPublicCatalog.js](../../src/kit/admin/adminPublicCatalog.js). Preuves : `availability-concurrency`, `admin-public-catalog-audit`.

### R25 — Réordonner un inventaire sans réécrire toutes ses lignes

Le déplacement normal utilise une position intermédiaire et une seule écriture. Si des positions anciennes égales imposent une normalisation, celle-ci reste atomique et limitée à 400 modifications ; au-delà, l'opération refuse avant effet. La transaction compare les positions actuelles, sans réorganisation optimiste trompeuse. Les consommateurs du catalogue acceptent les positions numériques intermédiaires.

Sources : [inventoryOrdering.js](../../src/kit/admin/inventoryOrdering.js), [GlobalInventoryView.jsx](../../src/kit/admin/GlobalInventoryView.jsx). Preuve : `inventory-ordering-audit`.

### R26 — Favoris : limiter les lectures et préserver les ajouts concurrents

Le rollback d'une ancienne copie complète ne remplace plus une liste actualisée. Les actions sont verrouillées et leurs erreurs exposées. L'enrichissement produit utilise huit workers et mémorise les identifiants tentés pour éviter une boucle de lectures infructueuses. Le vidage travaille par lots de 400 et ne supprime que les favoris sélectionnés au départ. Le partage assume le caractère privé de la page et traite l'échec du presse-papiers.

Sources : [WishlistPageIsland.jsx](../../app/wishlist/WishlistPageIsland.jsx), [WishlistView.jsx](../../src/kit/marketplace/WishlistView.jsx), [wishlistState.js](../../src/kit/marketplace/wishlistState.js). Preuve : `wishlist-interactions`, dont un cas de 805 favoris avec ajout concurrent.

### R27 — Recherche : une seule préparation et un vrai nombre de résultats

La table des catégories et le classement sont calculés une fois par recherche. Les contraintes de prix/disponibilité conservent les termes textuels. La réponse distingue nombre total, résultats affichés et dépassement de la limite de 250. La page suit les paramètres Next, annule les requêtes dépassées et affiche les erreurs. Les suggestions utilisent des identifiants propres, traitent Escape et ferment les overlays lors de la navigation.

Sources : [searchModel.js](../../src/kit/marketplace/searchModel.js), [SearchResultsIsland.jsx](../../src/kit/marketplace/SearchResultsIsland.jsx), [SearchSuggestIsland.jsx](../../src/kit/marketplace/SearchSuggestIsland.jsx). Preuve : `public-search-audit`.

### R28 — Filtres de catégorie et précision du prix

Les facettes sont calculées en une passe. Le maximum de prix ne dépend plus d'un étalement potentiellement volumineux. Un prix maximal égal à zéro est traité de façon cohérente dans URL, contrôles et filtre. Les clics modifiés gardent leur comportement natif et les temporisations sont nettoyées. Le prix sur demande est transmis au client ; le détail produit ne supprime plus les centimes par arrondi.

Sources : [categoryViewModel.js](../../src/kit/marketplace/categoryViewModel.js), [CategoryControlsIsland.jsx](../../src/kit/marketplace/CategoryControlsIsland.jsx), vues serveur catégorie/produit. Preuve : `category-filter-audit`.

### R29 — Ajout panier depuis la fiche et transitions

La fiche produit utilise le contrat partagé de transfert d'événement panier ; l'ancien paramètre ignoré a été remplacé. Le point d'origine de l'animation distingue les images mobile/desktop et les demandes dépassées sont invalidées. L'identité du shell suit produit et version catalogue. Un garde de dix secondes libère la transition de navigation si le changement de route échoue.

Sources : [ProductDetailShellIsland.jsx](../../src/kit/marketplace/ProductDetailShellIsland.jsx), [ProductDetailServerView.jsx](../../src/kit/marketplace/ProductDetailServerView.jsx), [RouteTransitionIsland.jsx](../../app/RouteTransitionIsland.jsx). Preuve : `cart-event-handoff`.

### R30 — Menu, stockage navigateur et erreurs publiques

Les accès aux préférences navigateur sont protégés si le stockage est refusé. Les verrous de navigation temporaires et timers de thème sont libérés. Le retour en haut respecte la réduction des animations. Le menu admin traite Escape, Tab, scroll et restitution du focus ; les éléments réellement désactivés ne sont pas considérés comme focusables. Une erreur de production n'affiche plus sa cause interne au visiteur.

Sources : [GlobalMenuTriggerIsland.jsx](../../src/kit/marketplace/GlobalMenuTriggerIsland.jsx), [PremiumMegaMenuLazyIsland.jsx](../../src/kit/marketplace/PremiumMegaMenuLazyIsland.jsx), [DarkModeToggleIsland.jsx](../../src/kit/marketplace/DarkModeToggleIsland.jsx), [dialogFocus.js](../../src/kit/ui/dialogFocus.js), [ErrorBoundary.jsx](../../src/kit/shared/ErrorBoundary.jsx), sidebar et footer.

## 7. Édition du site et durée de vie des animations

### R31 — Accueil : comparer les champs et conserver les médias référencés

La sauvegarde compare, dans une transaction, chaque champ modifié à la valeur chargée par l'éditeur. Une modification concurrente du même champ est refusée ; une modification indépendante reste possible. Les uploads ont des noms uniques. Les erreurs de lecture bloquent l'édition, et les erreurs de sauvegarde restent visibles. Aucune suppression Storage n'est déclenchée sur la seule hypothèse qu'un upload a échoué ou qu'une réponse s'est perdue.

Les commandes d'édition d'anciennes sections qui n'alimentent plus le rendu public sont rendues non modifiables, notamment l'ancien hero About et plusieurs réglages de galerie. Le bandeau et les contenus réellement consommés restent éditables. Cela évite d'annoncer une publication qui n'aurait aucun effet public.

Sources : [AdminHomepage.jsx](../../src/kit/admin/AdminHomepage.jsx), [AdminImageCard.jsx](../../src/kit/admin/components/AdminImageCard.jsx). Preuve de concurrence par champ : `manual-audit-completion`.

### R32 — Éditeurs texte et recadrage : attendre la vraie sauvegarde

Le recadrage attend le callback de persistence, refuse le double clic et reste ouvert en cas d'échec. Une image remplacée invalide le résultat du recadrage précédent. L'éditeur texte conserve sa saisie lors d'un rerender du parent ; il ne réinitialise plus le formulaire sur de nouveaux objets équivalents. Les deux dialogues disposent de focus, Tab, Escape et verrouillage pendant sauvegarde.

Sources : [ImageCropperModal.jsx](../../src/kit/admin/components/ImageCropperModal.jsx), [TextEditorModal.jsx](../../src/kit/admin/components/TextEditorModal.jsx), [useModalFocus.js](../../src/kit/ui/useModalFocus.js). Preuves : échec de sauvegarde, double appel et image obsolète dans `manual-audit-completion`.

### R33 — Carrousels : nettoyer tous les effets d'une instance

[domLifetime.js](../../src/kit/ui/domLifetime.js) regroupe écouteurs, timers, frames et observateurs. Les interactions des sections fixes annulent tout au démontage ; les callbacks tardifs ne peuvent plus poursuivre une animation. Les marqueurs d'initialisation sont réinitialisés pour un nouveau montage. L'autoplay est suspendu hors visibilité et en mouvement réduit ; l'annulation du délai de pause manuelle ne laisse plus le carrousel bloqué définitivement.

Source : [GalleryFixedSectionsInteractions.jsx](../../src/kit/marketplace/GalleryFixedSectionsInteractions.jsx). Preuve : `dom-lifetime-audit` pour l'annulation effective des ressources et callbacks.

### R34 — À propos : imports différés, compteurs et FAQ

Les imports et initialisations d'animation ont un traitement d'erreur ; les contextes, écouteurs, compteurs et rafraîchissements différés sont nettoyés. Les animations de titres respectent le mouvement réduit. Les réponses FAQ longues ne sont plus coupées par une hauteur maximale fixe ; leur état d'accessibilité suit l'ouverture.

Sources : [AboutMotionIsland.jsx](../../src/kit/vitrine/AboutMotionIsland.jsx), [AboutSv4HeroMotionIsland.jsx](../../src/kit/vitrine/AboutSv4HeroMotionIsland.jsx), [AboutCriticalStyles.jsx](../../src/kit/vitrine/AboutCriticalStyles.jsx), [AboutFaqIsland.jsx](../../src/kit/vitrine/AboutFaqIsland.jsx). Vérification statique ; aucune comparaison visuelle annoncée.

## 8. Back-office, diagnostics et code analytics

### R35 — Export utilisateurs et chiffres horaires

La lecture Auth charge une page de 500 au maximum. L'export suit jusqu'à 20 pages, déduplique les UID, refuse un curseur répété et interrompt toute réponse devenue étrangère à la session. Le compteur absent reste une erreur. Le graphique intrajournalier lit les captures confirmées à leur date de succès, dans une fenêtre bornée ; il ne transforme plus une date de commande en date de paiement et ne mélange pas des données financières incompatibles.

Sources : [adminManagement.js](../../functions/src/auth/adminManagement.js), [adminUserExport.js](../../src/kit/admin/adminUserExport.js), [AdminDashboard.jsx](../../src/kit/admin/AdminDashboard.jsx), [adminDashboardProjection.js](../../src/kit/admin/adminDashboardProjection.js). Preuve : `admin-export-audit`.

### R36 — Chronologie des incidents : récent d'abord, diagnostic partiel explicite

Les limites des requêtes événements sont appliquées aux événements les plus récents ; le résultat est ensuite présenté chronologiquement. Atteindre une limite de source rend le diagnostic partiel et interdit de conclure automatiquement qu'une reprise est sûre. Un index `business_events(aggregateId ASC, occurredAt DESC)` a été ajouté dans la configuration. Les comparaisons de codes excluent les propriétés héritées comme `constructor`.

Sources : [diagnosticTimeline.js](../../functions/src/observability/diagnosticTimeline.js), [incidentProjection.js](../../functions/src/observability/incidentProjection.js), [AdminIncidentConsole.jsx](../../src/kit/admin/AdminIncidentConsole.jsx), [firestore.indexes.json](../../firestore.indexes.json). Preuves : `incident-console`, `observability-contract`, `manual-audit-completion`.

### R37 — Un incident résolu ne doit pas être rouvert par un événement ancien

La projection d'incident conserve la version Firestore de sa source. Les doublons et versions antérieures sont ignorés dans la transaction. Un événement d'échec reçu après l'événement de résolution ne rouvre plus l'incident et ne gonfle plus son compteur.

Source : [businessEvents.js](../../functions/src/observability/businessEvents.js). Preuve comportementale : séquence échec → résolution → ancien échec → doublon de résolution dans `manual-audit-completion`.

### R38 — Collector : durée de vie et mémoire bornées

Les accès à `localStorage`/`sessionStorage`, y compris leurs getters, sont protégés. Le collector démonté ne peut plus réarmer son heartbeat via une réponse tardive. Une file de parcours devenue inutilisée et susceptible de grossir hors ligne a été supprimée ; le payload continue d'utiliser l'historique borné. La reprise conserve la durée accumulée et peut enregistrer la première vue de la nouvelle session. Les métadonnées de périphérique sont des chaînes bornées. Une route mal encodée ne fait plus tomber le shell ; les mesures de performance ponctuelles sont libérées.

Sources : [AnalyticsProvider.jsx](../../src/kit/shared/AnalyticsProvider.jsx), [sessions.js](../../functions/src/analytics/sessions.js), [AnalyticsCollectorIsland.jsx](../../app/AnalyticsCollectorIsland.jsx), [clientPerf.js](../../src/kit/shared/clientPerf.js). Preuves : suites analytics et test de heartbeat après démontage.

### R39 — Sessions : propriété et finalisation contrôlées dans la transaction

La conversion d'une session exige un token correspondant à son empreinte actuelle. Une ancienne session sans empreinte ne peut pas être revendiquée par cette opération. Le registre admin est relu dans la transaction. Le scheduler de fin d'inactivité relit les sessions avant de les fermer : un heartbeat arrivé après sa requête initiale est préservé. Le retrait d'un fait matérialisé refuse une contribution devenue différente et borne sa reconstruction à 20 000 faits avant toute écriture.

Sources : [updateUserSessions.js](../../functions/src/analytics/updateUserSessions.js), [rollups.js](../../functions/src/analytics/rollups.js). Preuves : `manual-audit-completion`, `analytics-rollups-contract`.

### R40 — Suppression de code sans appelant et purge du cache privé historique

Le composant local `BoutiqueAnalytics`, jamais rendu et retenu artificiellement par `void BoutiqueAnalytics`, a été supprimé avec ses helpers/imports sans usage. Le panneau Data actif demeure. Ce nettoyage retire plus de mille lignes à `AdminAnalytics.jsx`, sans supprimer de fichier.

Le fallback de données privé ne lit ni n'écrit plus dans l'ancien IndexedDB non lié à l'identité. Il utilise le cache mémoire autorisé commun. Les variables de module sont purgées lors d'un changement de génération ; réponses tardives, restaurations et promesses partagées sont contrôlées. **Une ancienne base IndexedDB éventuellement déjà présente chez un utilisateur n'a pas été effacée à distance : le nouveau code ne la consulte plus.**

Source : [AdminAnalytics.jsx](../../src/kit/admin/AdminAnalytics.jsx). Preuves : `admin-data-cache-contract`, `admin-analytics-performance`, `analytics-realtime`, `analytics-live-sessions`, ESLint et recherche des appelants.

## 9. Validation et portée des preuves

Validation Node **22.23.2**, avec `--require ./tests/commerce/helpers/no-network.cjs` : **591 tests réussis, 0 échec, 0 ignoré**. La sélection complète et les empreintes des tests sont dans le fichier de validations. Elle couvre le domaine commerce, les fautes fournisseur, les reprises, l'authentification, les rules par contrats statiques, le catalogue, les emails, les factures, les interfaces et les projections.

Les tests ajoutés reproduisent notamment : révocation concurrente, callback OTP tardif, mauvaise réutilisation de token, expiration contre prolongation, pertes d'accusé d'envoi, doublons de photos, concurrence de publication, panier multi-onglet, export borné, contribution modifiée, incident réordonné, recadrage devenu obsolète et démontage pendant une opération.

Deux assertions de texte du formulaire OTP ont été adaptées à son nouveau verrou commun et au token lié à email/code ; les tests comportementaux de réutilisation demeurent. Une assertion Wishlist ancienne a été adaptée à la limitation de concurrence. Aucun échec métier n'a été masqué par un test ignoré.

ESLint : **446 fichiers exécutables, zéro erreur, 121 avertissements conservés** :

| Famille | Nombre | Interprétation |
| --- | ---: | --- |
| `@next/next/no-img-element` | 55 | Utilisation d'images natives, dont certaines via la chaîne de variantes du projet ; pas une preuve de lenteur mesurée. |
| `react/no-unescaped-entities` | 35 | Ponctuation littérale JSX ; pas une injection démontrée. |
| Règles d'interaction/accessibilité | 29 | Alertes à examiner en contexte, sans certification clavier/lecteur d'écran par ce lint. |
| `react-hooks/exhaustive-deps` | 2 | Nettoyages de refs dans Wishlist et Dashboard ; conservés dans la preuve, pas assimilés à des erreurs bloquantes. |

`git diff --check` a réussi. Les liens locaux ajoutés au rapport et aux documents modifiés ont été vérifiés. Les tests exécutés ne nécessitent aucune infrastructure réelle.

Non exécutés : build Next, serveur, navigateur, Playwright, E2E, émulateurs Firebase, requêtes de mesure cloud, paiement Stripe réel ou test hébergé, remboursement, envoi de mail, lecture de boîte mail, recette visuelle PDF, commit, push et déploiement.

## 10. Limites résiduelles et conditions concrètes

1. **La relecture est complète sur le périmètre annoncé ; l'absence de toute faille n'est pas certifiée.** Les tests simulés vérifient les branches et invariants cités, pas toute l'infrastructure ni toutes les interactions d'un navigateur réel.
2. **Les correctifs ne sont pas servis sur le sandbox.** L'index commandes de la première passe, le nouvel index de chronologie et les rules restent locaux. Une livraison future devra coordonner ces prérequis avec leurs lecteurs ; aucune commande de déploiement n'a été exécutée ici.
3. **Les historiques restent volontairement bornés.** Certains filtres/recherches et jointures admin portent sur les pages chargées. Une commande ou un retour ancien peut nécessiter une lecture ciblée ou une pagination. Les plafonds de 6 000 produits, 10 000 comptes exportés, 400 écritures de reclassement et 20 000 faits reconstruits provoquent un refus explicite ; ils ne constituent pas une prise en charge illimitée.
4. **Ambiguïté fournisseur et données historiques :** un mail `delivery_unknown` demande une décision opérationnelle, pas un renvoi aveugle. Les anciens médias éventuellement orphelins, artefacts, credentials et données historiques n'ont pas été supprimés ou réparés en masse. Les gardes introduites n'attestent pas rétroactivement leur qualité.
5. **Performance : gains structurels uniquement.** Moins de requêtes simultanées, moins d'écritures d'ordre, moins de code mort et cleanup effectif sont démontrables dans les sources. Aucun pourcentage de rapidité, p95, LCP ou gain financier n'est inventé ; les logs Google Cloud et la console navigateur restent hors de cette campagne.
6. **Accessibilité et rendu :** les 29 alertes d'interaction restantes et l'absence de recette visuelle sont explicites. Les modifications de focus et de contenu ne valent pas certification WCAG. Les PDF sont testés au niveau contenu/pagination, sans contrôle visuel exhaustif.
7. **Compatibilité locale :** les anciens points d'entrée interdits continuent de refuser avant effet. Les configurations de production, Resend, Stripe live, DNS et domaine WebAuthn final restent différées conformément au projet.

Aucun fichier source n'a été supprimé ou déplacé par cette passe. Les retraits sont des blocs de code sans usage ou devenus interdits, visibles dans le patch. Les nouveaux modules sont courts et dédiés à des invariants partagés ; aucune nouvelle collection métier n'a été introduite par la relecture.
