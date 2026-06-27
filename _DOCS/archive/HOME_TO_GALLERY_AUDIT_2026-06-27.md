# Audit archive - suppression home V4 vers galerie

Date: 2026-06-27

## Decision

La page home V4 n'est plus une surface publique active. L'entree racine `/` redirige de facon permanente vers `/galerie`, et `/galerie` reste la page de reference SEO, sitemap, canonical et JSON-LD.

Ce choix evite de dupliquer le meme contenu entre `/` et `/galerie`, conserve les liens existants vers la galerie, et ne modifie pas le rendu visuel de la galerie actuelle.

## Impacts audites

- Route racine: `app/page.jsx` ne rend plus `HomePageV4`; il appelle `permanentRedirect('/galerie')`.
- Edge routing: `middleware.js` redirige toute arrivee sur `/` vers `/galerie`, en supprimant l'ancien parametre `page` et en conservant les autres query params utiles.
- SEO: `app/sitemap.js` ne liste plus `/`, seulement `/galerie` comme entree catalogue principale.
- Gates: les scripts ne cherchent plus `data-ssr-home` sur `/`; ils attendent maintenant la galerie SSR apres redirection.
- Navigation vitrine: le logo du header SV4 pointe vers `/galerie`.
- Galerie mobile: aucun fichier de rendu galerie mobile n'a ete modifie (`GalleryServerView`, `GalleryMobileShellIsland`, scroll/touch CSS conserves).

## Archives

- Source home active archivee: `_DOCS/archive/page-home-v4-2026-06-27.jsx`.
- Ile sticky propre a cette home archivee: `_DOCS/archive/AtelierStickyIsland-home-v4-2026-06-27.jsx`.
- Archive precedente conservee: `_DOCS/archive/page-home-v3.jsx`.

Les modules SV4 encore utilises par `/a-propos` restent actifs: `HomeMotionIslandV4`, `HeroVideoSliderIsland`, `MobileNavIsland`, `Sv4HomeHero`, `Sv4SiteNav` et `src/home-v4.css`.

## Validation

Validation volontairement limitee a des scans statiques courts, conformement a `AGENTS.md`.

- `git diff --check`: OK, uniquement avertissements CRLF Git.
- `node --check` sur les scripts modifies: OK.
- `rg "HomePageV4|AtelierStickyIsland" app src scripts`: aucun appel actif.
- `npm run next:routes`: controles source OK; echec ensuite sur les verifications post-build car les artefacts `.next/server/app/*.html` ne sont pas presents a jour. Aucun build n'a ete lance.

Aucun serveur local, Playwright, navigateur ou screenshot n'a ete lance dans cette passe.
