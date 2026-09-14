# Ouverture des fiches depuis la galerie — 14 septembre 2026

Demande : ouverture plus reguliere sur mobile, preparation au scroll de toutes
les cartes visibles et retrait de « Ouverture… ». Implementation et mise a
disposition sandbox autorisees ; recette manuelle reservee a l'utilisateur.

Statut : **livré sur sandbox, retour utilisateur positif sur mobile et desktop**.
Consignes liées : [AGENTS.md](../../AGENTS.md) ; contrat courant :
[Images et médias](IMAGES_MEDIA.md).

## Problème traité

Les images pouvaient être préchargées sans que la page produit le soit.
Le préchargement des routes attendait 240 ms de pause et ne concernait que
les deux cartes centrales visibles à au moins 60 %. Une autre carte pouvait
donc attendre le toucher pour récupérer sa fiche. Les demandes d'images en
attente étaient également supprimées puis recréées au scroll.

Le badge « Ouverture… » reflétait la navigation Next en cours ; il n'ajoutait
pas de délai volontaire et ne mesurait pas le chargement des images.

## Changements

- Observateurs installes au montage, avec le vrai conteneur de scroll conserve.
  Toute carte partiellement visible prepare sa route Next ; suppression de la
  condition 60 % / deux cartes / pause de 240 ms pour les routes.
- Registre de demandes borne a 64 routes ; invalidation Next transmise a la
  surface actuellement montee, meme apres retour depuis une fiche. Reprise
  seulement si la route reste visible, sans polling ni statut « charge » invente.
- Plan d'images par surface : premieres photos visibles, premiers fonds,
  puis voisines dans le sens du scroll (250 px, au plus 2 mobile/5 ordinateur).
  Reconciliation des demandes et priorites, sans vider les demandes utiles.
  URL partagees dedoublonnees, ressources visibles protegees dans la limite
  de la moitie du cache 32/64. Les transferts en cours ne sont pas interrompus.
- Apres 240 ms de pause : decodage sequentiel des premieres photos, puis
  miniatures et photos suivantes par tours entre les meubles visibles.
  Scroll, navigation, changement de catalogue et demontage retirent les
  demandes speculatives devenues inutiles. Save-Data/2G restent respectes.
- Pression : premiere photo et premier fond prioritaires ; les autres
  miniatures restent de basse priorite. Navigation jamais conditionnee par
  la fin d'un album. Swipe, zoom et restauration du retour non modifies.
- Composant `ProductNavigationFeedback.jsx` et CSS associe supprimes, avec
  retrait des deux appelants galerie/categorie. Aucun autre fichier supprime.

## Validation et livraison

- Lint cible reussi sous Node 22.23.2 ; `git diff --check` reussi.
- Contrat statique catalogue adapte aux nouveaux points d'entree.
- Aucun test automatise, navigateur, E2E ou mesure de performance execute.
- App Hosting `build-2026-09-14-002` livre : Cloud Build `SUCCESS`, rollout
  `SUCCEEDED`, revision a 100 % du trafic le 14 septembre a 09:06 UTC.
  HTTP 200 et deployment ID `sv-mu10lvuk-5fc4f71b41b1` lus sur `/` ; minimum
  service toujours 1. Preuve dans `logs/images-opening-20260914/delivery.json`.
  Aucune livraison Functions, rules ou mutation catalogue/commerce.
- À la livraison, code images non commité, aucun push. Copie isolée basée sur `51f7f15`, après attente de la
  livraison devis `build-2026-09-14-001` terminee : les nouveaux devis sont
  ainsi conserves. Le diff supplementaire ne contient que ce lot images.
- Empreinte SHA-256 du patch source :
  `3e5d2c7a51fb61ab76123af889ea35218e8d58753e245b787ed90f9dbbcd9047`.
  Patch et empreintes des fichiers dans `logs/images-opening-20260914/`.
- Controle commerce relu avant livraison : `v2_all/v2`, offline `off`.
  Version initiale observee : `build-2026-09-13-008`, trafic 100 %.
  Retour arriere de ce lot : `build-2026-09-14-001` (preserve les devis).

## Retour utilisateur et clôture

Le 14 septembre, après essai sur mobile et desktop, l'utilisateur constate
une ouverture « beaucoup mieux et beaucoup plus fluide ». Il accepte ce lot
en l'état ; les éventuels détails seront examinés plus tard, sans nouveau
chantier demandé ici. Ce retour qualitatif ne constitue pas une mesure chiffrée
ni une validation exhaustive de tous les appareils et conditions réseau.

Clôture documentaire et commit sur `main` demandés : ce bilan, le contrat
images, le lien depuis `AGENTS.md`, l'état du chantier et les fichiers du lot
sont regroupés dans le commit. Les modifications parallèles du panier sont
conservées hors de ce commit. Aucun nouveau déploiement ni push pour cette
clôture ; contrôles d'empreintes, de liens et de diff uniquement.

## Écart de déploiement constaté à la clôture panier

Le contrôle ultérieur du 14 septembre compare la source Hosting `011`, active
à 100 %, avec `main`. Les cinq fichiers applicatifs du commit `61efd41`
(`CategoryServerView.jsx`, `GalleryGridActionsIsland.jsx`,
`GalleryProductCardServer.jsx`, `imageUtils.js`, `productImageLoader.js`)
diffèrent : le cloud contient leur version antérieure au présent lot.
Une livraison suivante a donc écrasé le lot images publié dans `002`.
La preuve de publication et la recette ci-dessus restent historiques ; le lot
est conservé sur `main`, mais sa restauration cloud reste ouverte. Aucune
restauration ni nouvelle recette images effectuée pendant la clôture panier.

## Limites de la recette

Le code ne prouve pas un temps clic-vers-affichage sur telephone. Le cache
Next et le cache HTTP peuvent expirer ; une carte touchee immediatement apres
un scroll rapide peut encore etre en preparation. La concurrence speculative
reste de deux transferts mobile/trois ordinateur, avec une place supplementaire
pour une action explicite. Les images natives visibles restent gerees par le
navigateur, hors de cette limite applicative.

Cas de recette de référence (sans qualification exhaustive déclarée) : premiere ouverture de plusieurs cartes, y compris une
rangee partiellement visible ; scroll rapide puis toucher, pause puis toucher,
retour a la galerie et parcours categorie. Verifier aussi le swipe existant.
