# Comparison - SPA Vite vs Next.js SSR

Document de decision detaille ajoute le 2026-05-13 :

- `ARCHITECTURE_BENCHMARK_DECISION.md` compare les deux URLs deployees, leurs bases distinctes, le SEO initial, le poids reseau, les signaux runtime desktop et le scroll.

## Identique

- Backend Firebase/Firestore.
- Cloud Functions commerce, Stripe, analytics, maintenance.
- Design global et composants principaux repris du dernier etat SPA.
- Pipeline images Firebase avec variantes `thumb`, `card`, `medium`, `large`, `full`.
- Corrections mobile marketplace conservees.

## Change

- Routage public Next App Router.
- Metadata produit generee par Next au lieu d'une injection client/Functions SEO.
- Page produit directe avec HTML serveur initial.
- `firebase-admin` isole dans du code server-only.
- Deploiement cible recommande : Firebase App Hosting.

## SSR

- `/produit/[slugOrId]` : HTML initial produit, metadata, OpenGraph/Twitter, JSON-LD.
- `/categorie/[categoryId]` : metadata et preuve serveur de categorie avant shell client.
- `/robots.txt` et `/sitemap.xml` : routes Next.

## Client-side

- Galerie interactive complete.
- Detail produit anime.
- Panier, wishlist, checkout.
- Auth Firebase.
- Admin.
- Analytics client.

## Mesure HTML brute

Commande executee le 2026-05-13 :

```powershell
$env:SPA_BASE_URL='http://127.0.0.1:4173'
$env:NEXT_BASE_URL='http://127.0.0.1:3000'
npm run perf:compare
```

La SPA Vite a ete lancee en sandbox sur `127.0.0.1:4173`, puis arretee. Le projet source est reste sans changement git.

| Route | SPA status | SPA HTML bytes | Next status | Next HTML bytes | SPA h1 produit | Next h1 produit | Next JSON-LD Product | Next SSR article |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| home | 200 | 4573 | 200 | 8133 | false | false | false | false |
| category | 200 | 4573 | 200 | 7884 | false | true | false | false |
| product | 200 | 4573 | 200 | 26172 | false | true | true | true |

Lecture : la SPA renvoie le meme shell HTML minimal sur ces routes. Le clone Next renvoie plus de HTML sur produit parce que le contenu SEO produit est deja dans la reponse initiale.

## Mesure runtime locale

Commande executee le 2026-05-13 :

```powershell
$env:SPA_BASE_URL='http://127.0.0.1:4173'
$env:NEXT_BASE_URL='http://127.0.0.1:3000'
npm run perf:runtime
```

Mesure Playwright headless, 3 routes, desktop `1440x950`, mobile `390x844`. Les valeurs LCP/CLS sont des signaux locaux approximatifs, pas un audit Lighthouse terrain.

| App | Profil | Route | Requests | Total KB | JS KB | Image KB | LCP ms | CLS | Long tasks | Product JSON-LD | SSR Product |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| SPA | desktop | home | 112 | 8311 | 6457 | 1714 | 1452 | 0.002 | 2 | false | false |
| Next | desktop | home | 62 | 2847 | 1225 | 1297 | 568 | 0.0003 | 2 | false | false |
| SPA | desktop | category | 86 | 6964 | 6106 | 717 | 872 | 0.1864 | 1 | false | false |
| Next | desktop | category | 44 | 2208 | 1165 | 717 | 1032 | 0.1879 | 0 | false | false |
| SPA | desktop | product | 120 | 8432 | 6655 | 1636 | 348 | 0.0004 | 1 | true | false |
| Next | desktop | product | 70 | 3291 | 1264 | 1684 | 560 | 0.0003 | 0 | true | true |
| SPA | mobile | home | 99 | 7787 | 6146 | 1500 | 340 | 0 | 2 | false | false |
| Next | mobile | home | 51 | 2911 | 1171 | 1414 | 496 | 0 | 1 | false | false |
| SPA | mobile | category | 92 | 7759 | 6106 | 1512 | 272 | 0 | 1 | false | false |
| Next | mobile | category | 50 | 3002 | 1165 | 1512 | 508 | 0 | 0 | false | false |
| SPA | mobile | product | 117 | 8538 | 6576 | 1821 | 1024 | 0 | 1 | true | false |
| Next | mobile | product | 67 | 3462 | 1250 | 1869 | 1124 | 0 | 0 | true | true |

Lecture : dans cette mesure locale, Next reduit fortement le nombre de requetes, les bytes totaux et les bytes JS transferes. Les images produit restent comparables, parfois legerement plus lourdes cote Next a cause de l'image prioritaire SSR. Les LCP locaux ne sont pas uniformement meilleurs; ils doivent etre interpretes route par route.

## Validation fonctionnelle

- `npm run build` : OK.
- `npm run lint` : OK.
- `npm run seo:check` : OK.
- `npm run mobile:contract` : OK.
- `npm run test:e2e` : OK, 20 tests desktop/mobile.
- `npm run perf:runtime` : OK, comparaison runtime locale SPA vs Next.

## Conclusion

Le clone Next apporte un gain objectif sur le HTML initial et le SEO des pages produit : titre, description, image et JSON-LD sont presents avant hydration.

SSR ne supprime pas automatiquement les lags galerie/mobile. Ces zones restent surtout dependantes du JavaScript client, du poids des images, des animations, du scroll et des gestes tactiles. Les mesures runtime a faire ensuite sont LCP, CLS, INP/TBT proxy, request count, image bytes, JS bytes et scroll frame gaps.

## Mesure deployee Hosting vs App Hosting

Commande executee le 2026-05-13 :

```powershell
npm run perf:architecture
```

URLs mesurees :

- SPA Hosting : `https://secondeviesandbox.web.app`
- Next App Hosting : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`

Synthese desktop `1440x950` :

| Route | SPA requests | SPA total KB | SPA JS KB | SPA images KB | Next requests | Next total KB | Next JS KB | Next images KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 126 | 8689 | 908 | 7439 | 86 | 2697 | 760 | 1743 |
| category | 87 | 5861 | 897 | 4614 | 49 | 1354 | 372 | 789 |
| product | 94 | 7339 | 872 | 6288 | 73 | 2240 | 397 | 1641 |

Conclusion mesuree : Next App Hosting charge moins de requetes et moins de donnees sur les routes publiques testees. Le LCP n'est pas uniformement meilleur route par route, donc la decision doit rester basee sur SEO + poids + complexite + validation fonctionnelle, pas sur une promesse generale de vitesse.
