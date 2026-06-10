# Contexte Next SSR / Legacy UI

Derniere mise a jour : 2026-06-09

## Intention

Le projet `SecondevieNextjsSSR` a ete migre vers Next.js App Router SSR/SSG. L'architecture cible est la bonne : il ne faut pas revenir a la SPA globale legacy.

Le probleme actuel est que la migration a trop simplifie l'UI/UX legacy : header, mega menu, hamburger, login, hero, sections, categories, footer, animations et comportements.

La mission n'est pas de remettre l'ancienne SPA. La mission est de reprendre fidelement le design et les comportements legacy, puis de les transposer dans une architecture Next.js SSR propre avec des iles client ciblees.

## Interdits

- Ne pas restaurer `ClientApp`.
- Ne pas recreer `src/app.jsx`.
- Ne pas recreer `src/Router.jsx`.
- Ne pas remettre `setView`.
- Ne pas remettre `window.location.hash` comme routing.
- Ne pas recreer une UI seulement inspiree du legacy.
- Ne pas simplifier les composants legacy.
- Ne pas remplacer les menus legacy par des panneaux basiques.
- Ne pas deployer sans accord explicite.

## Methode Attendue

- Lire les composants legacy via `git show HEAD:...` ou via un ancien commit.
- Reprendre DOM, classes, layout, organisation et animations.
- Remplacer uniquement les callbacks SPA par des routes Next natives.
- Garder les Server Components pour le rendu principal.
- Ajouter une ile client seulement pour le menu, login/auth, animations impossibles serveur, slider/carousel, wishlist/panier, ou shell mobile quand l'invariant mobile est respecte.

Conversions typiques :

- `setView('gallery')` -> `/galerie` ; l'ancien `/?page=gallery` doit seulement rester une compatibilite/redirection
- `setView('detail')` -> `/produit/...`
- categorie SPA -> `/categorie/...`
- devis -> `/devis`
- compte -> `/mes-commandes`
- admin -> `/admin`
- wishlist -> `/wishlist`
- checkout -> `/checkout`

## Architecture Actuelle Restaurée

Header public :

- `ArchitecturalHeaderServer.jsx` garde le header en Server Component.
- Les interactions sont isolees dans `HeaderAccountIsland`, `GlobalMenuTriggerIsland` et `DarkModeToggleIsland`.
- Le bouton Connexion ne renvoie plus vers l'ancien ecran admin/Tous a Table.
- Le header peut basculer apres auth vers `MON COMPTE / QUITTER`.

Hero galerie :

- `MarketplaceHeroServer.jsx` a recupere l'effet bulles/particules sur le CTA `Faire un devis`.
- Le hero reste SSR, avec seulement les animations necessaires en iles.

Sections basses :

- Avant/Apres restaure avec `BeforeAfterSliderIsland`.
- Instagram restaure avec `InstagramCarouselIsland`.
- Temoignages restaure avec `TestimonialsCarouselIsland`.
- Newsletter et footer repris dans l'esprit legacy.
- Footer public adapte aux liens Next.

Categories :

- Les pages `/categorie/...` ne sont plus un rendu SEO simplifie.
- Elles utilisent un rendu proche marketplace legacy : header, hero categorie, grille produit, reassurance, footer.
- Un tri serveur evite que des produits backfill visuellement incoherents apparaissent en premier.

Login :

- Popup login legacy restaure.
- Video `/video/login-bg.mp4` a gauche, formulaire sombre a droite.
- Ile client lazy-loadee.
- Apres login, les iles auth emettent/suivent `sv:auth-user-changed` pour synchroniser header/menu sans remonter la SPA.

## Menus A Ne Pas Melanger

### Hamburger Legacy

Source legacy principale : `src/kit/layout/GlobalMenu.jsx`.

C'est le vrai design hamburger legacy :

- sidebar gauche : Accueil, A propos, Commandes, Devis, connexion;
- colonne Meubles par categorie;
- colonne Meubles par piece;
- bloc Notre selection;
- bloc L'atelier Seconde Vie;
- tuiles images;
- bande services : livraison, paiement, meubles uniques, equipe humaine;
- classes `global-menu-*`;
- animations Framer Motion legacy.

Architecture actuelle :

```text
ArchitecturalHeaderServer
  -> GlobalMenuTriggerIsland
      bouton Menu/X leger
      -> lazy-load GlobalMenuPanelAuthIsland uniquement a l'ouverture
          -> charge AuthProvider/ToastProvider
          -> charge le vrai GlobalMenu.jsx
          -> passe user/isAdmin/logout/onShowLogin
```

Fichiers concernes :

- `src/kit/layout/GlobalMenu.jsx`
- `src/kit/marketplace/GlobalMenuTriggerIsland.jsx`
- `src/kit/marketplace/GlobalMenuPanelAuthIsland.jsx`
- `src/kit/marketplace/HeaderAccountIsland.jsx`
- `src/kit/marketplace/LegacyLoginModalIsland.jsx`
- `src/kit/marketplace/LegacyLoginModalFullIsland.jsx`

Important :

- Ne pas importer directement `GlobalMenu.jsx` dans le header serveur ou dans un composant charge immediatement.
- Le menu doit rester lazy-loade au clic hamburger pour eviter d'exploser le JS initial.
- Le scroll lock garde la scrollbar droite visible, bloque la page, utilise `overflow-y: scroll`, `scrollbar-gutter: stable`, intercepte wheel/touch/clavier, et evite le body fixed qui masque la scrollbar.

### Mega Menu Hover Desktop

Source legacy : `src/kit/marketplace/components/PremiumMegaMenu.jsx`.

Ce menu gere la barre nav desktop :

- Nouveautes;
- Meubles;
- Assises;
- Eclairage;
- Decorations;
- Prix bas;
- A propos.

Il vit maintenant dans `src/kit/marketplace/PremiumMegaMenuIsland.jsx`.

Ne pas faire :

- Ne pas utiliser `PremiumMegaMenuIsland` pour ouvrir le hamburger.
- Ne pas remplacer Nouveautes par un lien simple.
- Ne pas recreer une structure plus simple.

Architecture actuelle :

```text
ArchitecturalHeaderServer
  -> PremiumMegaMenuIsland
      menu hover desktop legacy
```

## Connexion / Compte

Comportement attendu :

- Avant login : bouton Connexion.
- Clic : popup plein ecran avec video gauche et formulaire droit.
- Apres login : header affiche un etat compte, pas encore Connexion.
- Dans le menu, Commandes et l'espace compte tiennent compte de l'etat user.
- Admin voit un badge/admin path.
- Deconnexion possible via Quitter.

Etat actuel :

- `HeaderAccountIsland.jsx` gere Connexion / Mon compte / Quitter.
- `LegacyLoginModalFullIsland.jsx` contient la modale login video.
- `LegacyLoginModalIsland.jsx` sert de wrapper leger lazy-load.
- `AuthContext.jsx` emet `sv:auth-user-changed` apres login/logout.
- Les iles header/menu ecoutent cet evenement pour se synchroniser.

A tester encore :

- Cycle reel avec un vrai compte Firebase.
- Un test simule a deja confirme le passage `CONNEXION` -> `MON COMPTE / QUITTER`.

## Validations Deja Passees

Commandes mentionnees comme validees :

- `npm run lint`
- `npm run build`
- `npm run perf:budget`
- `npm run mobile:contract`
- `npm run perf:gallery-direct -- --url http://127.0.0.1:4300`

Controles anti-SPA :

- rechercher `setView(`
- rechercher `window.location.hash`
- rechercher `location.hash`
- rechercher `NEXT_VIEW_PATHS`
- rechercher `ClientApp`
- rechercher `src/app.jsx`
- rechercher `src/Router.jsx`

Ces recherches ne doivent montrer aucun routing SPA actif dans `app`, `src` ou `scripts`.

Controles Playwright effectues :

- hamburger ouvre le vrai `GlobalMenu`;
- menu se ferme via Menu / X;
- popup login video s'ouvre depuis header;
- popup login video s'ouvre depuis menu;
- scrollbar reste visible pendant le menu;
- scroll page bloque pendant le menu;
- header bascule vers `MON COMPTE / QUITTER` apres evenement auth simule;
- `data-sv-client-hydrated` absent;
- `data-ssr-gallery` present sur `/galerie` ; `/?page=gallery` sert seulement de compatibilite a rediriger.

Captures utiles :

- `logs/global-menu-legacy-check.png`
- `logs/global-menu-can-close.png`
- `logs/global-menu-scrollbar-visible.png`
- `logs/legacy-login-modal-header.png`
- `logs/legacy-login-modal-from-menu.png`
- `logs/header-auth-account-state.png`

## Points Encore A Traiter

- Comparer les ecarts UI/UX restants avec les captures `imagediag`.
- Auditer la nouvelle route `/galerie` route par route avec canonical, Open Graph, JSON-LD et contenu HTML indexable.
- Verifier le dark mode : bouton revenu, propagation sombre possiblement incomplete sur tous les Server Components.
- Comparer les pages categorie precisement au legacy.
- Verifier les sections basses : restaurees, mais pas forcement pixel-perfect.
- Nettoyer les textes mojibake/ASCII si besoin.
- Tester le login Firebase reel avec un vrai compte.
- Relier parfaitement les counts panier/wishlist dans le header SSR public.
- Valider sur mobile reel si une modification touche shell, scroll, galerie, produit ou detail.

## Fichiers A Lire Avant Modification

- `AGENTS.md`
- `nextjsssr.md`
- `alertemobile.md` si galerie/mobile/scroll/shell
- `NEXTJS_OPTIMIZATION_ROADMAP.md` si perf/hydratation/images/cache
- les prompts/audits Next SSR existants selon la zone touchee

## Regle Finale

Ne jamais moderniser ou reinventer l'UI. Le but est de recuperer exactement le comportement et le feeling legacy, mais dans une architecture Next.js App Router SSR/SSG propre.
