# Audit images Next.js / Firebase - Seconde Vie SSR

Date: 2026-05-15

## Synthese

Le site n'a pas besoin de pousser aveuglement toutes les images produit dans l'Image Optimization API de Next. Sur Firebase App Hosting, l'optimisation d'image Next est desactivee par defaut sauf configuration explicite. Le projet a deja un pipeline plus previsible pour un catalogue avec beaucoup d'images: generation de variantes WebP a l'upload, stockage Firebase immutable, rendu public via variantes adaptees au contexte.

Decision recommandee pour ce site: garder les variantes Storage comme source de verite, rendre `next/image` explicite en mode `unoptimized`, et mesurer avant toute bascule vers un loader d'optimisation a la demande.

## Etat actuel verifie

- Produits publies sandbox audites: 35.
- Slots images audites: 293.
- Variantes manquantes: 0.
- Metadata manquantes: 0.
- Fichiers Storage orphelins: 0.
- HTML App Hosting deploye: les images `next/image` sortent en URLs Storage directes, sans `/_next/image`, ce qui confirme le comportement App Hosting attendu.
- HTML produit deploye verifie: `data-ssr-product`, JSON-LD Product, dimensions `width`/`height`, blur placeholder, et aucune route `/_next/image`.
- Benchmark architecture deploye: sur `/produit/buffet-KrTETXPknYNwgak66T8p`, Next App Hosting charge environ 1437 KB d'images contre 6288 KB sur la SPA sandbox dans ce run.

Commandes executees:

```powershell
node scripts/backfill-product-image-metadata.cjs --dry-run --published-only --env=sandbox
node scripts/backfill-product-image-variants.cjs --dry-run --published-only --env=sandbox
node scripts/audit-storage-orphans.cjs --dry-run --env=sandbox
npm run images:audit
npm run lint
npm run build
npm run seo:check
npm run mobile:contract
npm run test:e2e
npm run perf:architecture
```

Un alias npm regroupe maintenant ces controles:

```powershell
npm run images:audit
```

## Pipeline publication admin

Le flux normal est coherent:

1. L'admin importe des images, y compris lourdes issues d'appareils photo.
2. `src/utils/imageUtils.js` convertit en WebP et limite la largeur maximale.
3. `PRODUCT_IMAGE_VARIANT_SPECS` genere `thumb` 480, `card` 768, `medium` 1024, `large` 1440 et `full` 1920.
4. `src/kit/admin/AdminForm.jsx` envoie ces variantes dans Storage avec `Cache-Control: public, max-age=31536000, immutable`.
5. Firestore stocke `images`, `thumbnails`, `imageVariants` et `imageMetadata`.
6. `publicCatalog` projette seulement la variante utile pour les cartes publiques.
7. Les pages SSR produit/categorie/home utilisent `next/image`, mais sur App Hosting les sources restent les variantes WebP deja preparees.

Corrections appliquees pendant cet audit:

- Recadrer une image existante dans l'admin remet maintenant `isExisting` a `false`, vide `variantUrls` et force le re-upload. Avant, un `blob:` local pouvait etre persiste dans Firestore lors d'une edition.
- `createProductImageVariantFiles` genere les variantes sequentiellement au lieu de lancer cinq canvas en parallele. C'est plus robuste pour les photos lourdes issues d'appareils haute resolution.
- `next.config.mjs` declare explicitement `images.unoptimized: true`, ajoute une allowlist `qualities`, et restreint les `remotePatterns` aux chemins `furniture/**`.
- Le script dangereux `cleanup-product-image-variants.cjs` refuse maintenant le mode `--commit` sans `--confirm-break-responsive-pipeline`.
- Le fond decoratif floute du detail produit client passe en `loading="lazy"` et `fetchpriority="low"` pour ne plus concurrencer l'image principale prioritaire.

## Rendu public produit et categorie

Ce qui est bon:

- Page produit SSR: image principale issue de `large` ou `medium`, dimensions et blur depuis `imageMetadata`, `sizes={PRODUCT_DETAIL_IMAGE_SIZES}`, image prioritaire unique.
- Pages home/categorie SSR: cartes en `card`, dimensions, `sizes={PRODUCT_CARD_IMAGE_SIZES}`, blur si disponible, `prefetch={false}` sur listes longues.
- Galerie client: cartes avec `srcSet` manuel `thumb/card/medium`, `sizes`, `loading` natif et garde-fous `saveData` / 2g sur prewarm.
- Detail mobile: staging, decode et currentSrc stabilisent le changement d'image et evitent le flash de coins.

Risques restants:

- Apres hydratation, `ClientApp` remplace le fallback SSR et les composants interactifs utilisent encore des `<img>` directs. C'est volontaire pour l'experience marketplace, mais cela peut dupliquer la premiere image produit chargee en SSR.
- Plusieurs warmups client ameliorent le clic percu mais augmentent les telechargements Storage. Les files sont bornees, mais doivent rester mesurees.
- Les images decoratives du detail produit ne sont plus marquees en haute priorite. A surveiller quand meme dans un audit LCP terrain.

## Pourquoi ne pas activer tout de suite l'optimisation Next serveur

Firebase App Hosting indique que l'optimisation d'image Next integree est desactivee par defaut, sauf `images.unoptimized: false` ou loader custom. Firebase recommande un loader custom avec l'extension Image Processing si l'on veut de l'optimisation a la demande.

Pour ce site, activer l'optimisation serveur sans autre changement aurait trois couts:

- double traitement de WebP deja redimensionnes a l'upload;
- plus de variantes cachees par format/qualite/largeur;
- risque de CPU/cold start sur le service App Hosting, dimensionne pour SSR et non pour transformer de gros lots d'images.

La bonne trajectoire est donc:

1. garder les variantes WebP Storage pour les images produit;
2. mesurer LCP et poids reel;
3. seulement ensuite tester un loader Firebase Image Processing sur un environnement dedie si les gains justifient le cout.

## Plan d'amelioration priorise

1. **Court terme fait**: corriger le bug `blob:` admin, expliciter `unoptimized`, auditer les variantes existantes.
2. **Court terme**: ajouter une mesure Playwright/Lighthouse dediee poids images/LCP sur `/produit/[id]`, `/categorie/buffets` et home.
3. **Moyen terme**: reduire la duplication SSR/client sur page produit en reutilisant la meme variante principale apres hydratation, ou en isolant un ilot client detail plus fin.
4. **Moyen terme**: ajuster les warmups client avec un budget explicite par viewport et connection type.
5. **Long terme optionnel**: POC Firebase Image Processing custom loader, compare a la strategie actuelle avec `npm run perf:architecture` et un audit Storage/App Hosting.

## Passe 2026-05-15 - premier clic produit depuis galerie

Hypothese confirmee: le rang de la carte n'est pas la vraie cause. Le retard vient surtout du premier passage dans le pipeline detail client et du premier chargement froid de la variante detail. Une carte deja visible ou survolee peut etre rendue beaucoup plus rapide si sa variante detail primaire est deja en vol avant `setView('detail')`.

Corrections ajoutees:

- `ProductCard` lance maintenant le prechauffage primaire avant l'ouverture detail, sur `pointerdown`, `touch`, `click`, `hover/focus`, et quand la carte entre pres du viewport via `IntersectionObserver`.
- Le prechauffage de visibilite est borne par `saveData` / 2g et se deconnecte apres le premier lancement pour eviter une file infinie.
- Sur mobile, le prechauffage force la variante `medium` sans `srcSet`; avant, le DPR pouvait faire choisir `large` et annuler le gain.
- Le detail mobile garde la premiere image visible sur `medium/card/thumb` tant que le premier paint n'a pas eu lieu. Le staging `currentSrc/decode` ne peut plus remplacer cette premiere image par `large` avant le paint.
- Les miniatures et fonds decoratifs restent en basse priorite jusqu'au paint de l'image principale.
- La prechauffe mobile initiale de galerie utilise maintenant `detailVariant: 'medium'` et `detailSrcSet: false`.

Mesures Playwright locales, Next production, serveur temporaire `next start`, flux galerie hydratee -> produit:

| Scenario | Avant reference | Apres mesure locale | Commentaire |
| --- | ---: | ---: | --- |
| Desktop, carte survolee puis clic | 587-888 ms sur sandbox deployee froide | 424-571 ms, mediane 507 ms | Gain ressenti: le hover/focus lance la variante detail avant le clic. |
| Mobile, carte visible puis tap | 780-1021 ms sur sandbox deployee froide | 2346 ms dans le run local cache-on | Le run local reste penalise par le chargement SPA/Firebase et le scroll Playwright, mais verifie que la premiere image visible est `medium`, pas `large`. |
| Mobile, cache desactive artificiellement | non comparable | 2646 ms et requete `medium` dupliquee | Sert seulement a verifier la variante; le cache desactive invalide volontairement le benefice du prechauffage. |

Limites de mesure:

- Le plugin Browser etait disponible dans la session, mais les mesures repetees isolees ont ete faites en Playwright brut: il fallait controler contextes, cache, resource timing et serveur temporaire.
- Les temps locaux ne sont pas strictement comparables a App Hosting deploye: le host, l'auth anonyme sandbox locale et la latence Storage varient. Le signal fiable est le changement de sequence reseau: `medium` part avant le clic ou avant le paint, et `large` ne bloque plus le premier rendu mobile.
- Un artefact `.next` incoherent a ete nettoye: `index.html` pointait vers un chunk webpack absent apres des runs precedents. Suppression de `.next` puis rebuild propre.

## Passe 2026-05-25 - display stable et zoom progressif

Decision confirmee: les variantes Storage sont conservees. Le probleme n'etait pas leur existence, mais le changement visible de fichier entre detail produit et zoom initial. Le pipeline suit maintenant des roles explicites:

- `thumb`: blur, fond leger et miniatures.
- `card`: cartes galerie.
- display mobile: `medium`.
- display desktop: `large`.
- zoom initial: meme URL que l'image display deja visible.
- `full`: upgrade progressif uniquement apres ouverture de la lightbox, apres preload/decode, sans bloquer l'ouverture.

Corrections appliquees:

- `src/utils/imageUtils.js` centralise les choix avec `getProductDisplayImageSrc`, `getProductZoomInitialImageSrc` et `getProductZoomFullImageSrc`.
- `ArchitecturalProductDetail` et l'ile directe `ProductPageExperience` ouvrent la lightbox sur l'URL visible courante au lieu de demarrer en `full`.
- Le staging mobile du detail conserve son intention: il attend une image `medium` prete/decodee avant affichage, sans `srcSet` visible qui pourrait choisir `large/full` au dernier moment.
- Les preloads intentionnels hover/focus/pointerdown visent la variante display et ne chargent plus `full` avant zoom.
- Le detail galerie ne precharge plus le reste des images produit desktop apres idle; seuls l'image active et les voisines proches sont chauffees.

Preuves locales:

- `npm run perf:product-direct`: page produit directe desktop en `large`, mobile en `medium`, aucun `full` avant zoom, lightbox initiale egale a l'image visible, puis `full` seulement apres ouverture.
- `npm run perf:product-images`: parcours galerie -> detail desktop/mobile sans requete `full` avant zoom; mobile detail en `medium`, desktop detail en `large`, avec warmup borne aux voisines proches.
- `NEXT_BASE_URL=http://127.0.0.1:4300 npm run perf:architecture`: route produit Next a 29 requetes / 1338 KB total / 420 KB images dans ce run local, contre 94 requetes / 7339 KB sur la SPA sandbox.

## Checklist prompt -> preuves

| Demande | Preuve |
| --- | --- |
| Auditer par rapport a la doc Next.js | Sources officielles consultees et comparaison `next/image`, `sizes`, LCP, remote images, App Hosting. |
| Lire le code concerne | Fichiers audites: `next.config.mjs`, `app/produit/[slugOrId]/page.jsx`, `app/categorie/[categoryId]/page.jsx`, `app/page.jsx`, `src/utils/imageUtils.js`, `src/kit/admin/AdminForm.jsx`, `ProductCard`, `ArchitecturalProductDetail`, Functions `publicCatalog`. |
| Lancer equipes d'agents specialistes | Trois sous-agents ont audite admin/upload, rendu public, et cout/App Hosting. |
| Verifier les images importees lourdes | Pipeline canvas/WebP inspecte; generation de variantes rendue sequentielle pour limiter les pics memoire. |
| Optimiser qualite vs poids | Variantes WebP 480/768/1024/1440/1920, qualites progressives, cache immutable, pas de full-size sur cartes/detail SSR. |
| Verifier l'etat reel du catalogue | `images:audit` dry-run: 35 produits, 293 slots, 0 manque, 0 orphelin. |
| Mesurer la performance image produit | `npm run perf:architecture`: page produit Next 2235 KB total / 1437 KB images, SPA 7339 KB total / 6288 KB images. |
| Verifier le HTML deploye | Requete live App Hosting: status 200, `data-ssr-product=true`, JSON-LD Product present, `/_next/image=false`. |
| Deployer la version auditee | `firebase deploy --only apphosting:secondevie-next-sandbox --project secondevienextjsssr` termine avec rollout App Hosting complet. |

## Sources officielles

- Next.js Image Component: https://nextjs.org/docs/app/api-reference/components/image
- Next.js Image configuration: https://nextjs.org/docs/pages/api-reference/config/next-config-js/images
- Next.js Optimizing Images: https://nextjs.org/docs/14/app/building-your-application/optimizing/images
- Firebase App Hosting image loading: https://firebase.google.com/docs/app-hosting/optimize-image-loading
- Firebase App Hosting cache: https://firebase.google.com/docs/app-hosting/optimize-cache
- Chrome/Lighthouse properly size images: https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images/
