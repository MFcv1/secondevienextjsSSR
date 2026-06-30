# Architecture benchmark decision - SPA Hosting vs Next App Hosting

Date de mesure : 2026-05-13

## Objectif

Comparer objectivement les deux structures deployees :

- SPA React/Vite sur Firebase Hosting : `https://secondeviesandbox.web.app`
- Next.js SSR sur Firebase App Hosting : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`

Le but n'est pas de dire que Next est automatiquement meilleur. Le but est de separer :

- ce qui change vraiment pour le SEO ;
- ce qui change pour les temps de chargement ;
- ce qui change pour le scale ;
- ce qui reste du JavaScript client, donc potentiellement les memes lags ;
- ce qui permet de choisir avec des arguments mesurables.

## Environnements testes

| Site | Hebergement | Base Firebase | Role |
| --- | --- | --- | --- |
| SPA React/Vite | Firebase Hosting | `secondeviesandbox` | Projet source actuel, lu uniquement |
| Next.js SSR | Firebase App Hosting | `secondevienextjsssr` | Clone Next avec base importee |

Le projet source `C:\Users\matth\Travail\SecondevieAnais` est reste intact pendant ce benchmark.

## Commandes executees

```powershell
$env:SPA_BASE_URL='https://secondeviesandbox.web.app'
$env:NEXT_BASE_URL='https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
npm run perf:compare
```

```powershell
$env:SPA_BASE_URL='https://secondeviesandbox.web.app'
$env:NEXT_BASE_URL='https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
npm run perf:runtime
```

```powershell
npm run perf:architecture
```

Viewport principal du benchmark architecture : desktop `1440x950`.

## Resultats SEO HTML initial

| App | Route | Status | HTML KB | H1 | Meta description | Canonical | Product JSON-LD | SSR product |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- |
| SPA Hosting | home | 200 | 5 | non | oui | oui | non | non |
| Next App Hosting | home | 200 | 10 | non | oui | non | non | non |
| SPA Hosting | category | 200 | 9 | oui | oui | oui | non | non |
| Next App Hosting | category | 200 | 9 | oui | oui | oui | non | non |
| SPA Hosting | product | 200 | 10 | oui | oui | oui | oui | non |
| Next App Hosting | product | 200 | 18 | oui | oui | oui | oui | oui |

Lecture :

- La SPA deployee n'est pas un simple shell vide sur categorie/produit. Elle a deja des balises SEO initiales, probablement via la strategie SEO existante du projet.
- Next ajoute un vrai rendu serveur produit dans le HTML initial avec `data-ssr-product`.
- Pour Google, les deux peuvent etre indexables si le HTML final est propre, mais Next donne une preuve plus directe : le contenu produit est dans la reponse serveur de la route.
- Point a corriger cote Next : la home n'a pas encore de canonical detectee par ce benchmark.

## Resultats runtime desktop

| App | Route | Requests | Total KB | JS KB | Image KB | LCP ms | CLS | Long tasks | Max long task ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| SPA Hosting | home | 126 | 8689 | 908 | 7439 | 868 | 0.0007 | 2 | 314 |
| Next App Hosting | home | 86 | 2697 | 760 | 1743 | 556 | 0.0022 | 3 | 63 |
| SPA Hosting | category | 87 | 5861 | 897 | 4614 | 1612 | 0.1878 | 1 | 68 |
| Next App Hosting | category | 49 | 1354 | 372 | 789 | 1444 | 0.1863 | 0 | 0 |
| SPA Hosting | product | 94 | 7339 | 872 | 6288 | 484 | 0.0004 | 2 | 98 |
| Next App Hosting | product | 73 | 2240 | 397 | 1641 | 584 | 0.0003 | 0 | 0 |

Lecture :

- Next App Hosting transfere beaucoup moins de donnees sur les trois routes mesurees.
- Le gain le plus visible est sur les images et le nombre de requetes.
- Le JS transfere est aussi plus bas cote Next dans cette mesure.
- Le LCP n'est pas toujours meilleur cote Next : produit desktop est un peu plus rapide cote SPA dans ce run. Donc il ne faut pas conclure "Next est meilleur partout".
- Le CLS categorie est eleve des deux cotes autour de `0.186`, donc le probleme semble venir du layout commun/repris, pas seulement du choix SPA vs SSR.

## Resultats scroll / lag desktop

| App | Route | Max frame gap ms | Frames > 50 ms | Frames > 100 ms | Scroll final |
| --- | --- | ---: | ---: | ---: | ---: |
| SPA Hosting | home | 33.4 | 0 | 0 | 7939 |
| Next App Hosting | home | 16.8 | 0 | 0 | 6246 |
| SPA Hosting | category | 16.8 | 0 | 0 | 4109 |
| Next App Hosting | category | 16.8 | 0 | 0 | 2675 |

Lecture :

- Aucun gros blocage de scroll desktop n'a ete mesure sur ce run.
- Next est plus propre sur la home, mais la categorie est equivalente.
- Ce test ne prouve pas l'absence de lag mobile reel. Les lags mobile doivent rester mesures sur telephone, surtout galerie/detail produit.

## Difference Hosting vs App Hosting

### Firebase Hosting avec SPA React/Vite

Firebase Hosting sert des fichiers statiques depuis un CDN. C'est simple, rapide, stable et souvent moins cher.

Avantages :

- tres bon pour servir HTML/CSS/JS/images statiques ;
- CDN efficace ;
- peu de complexite serveur ;
- scale tres bien pour du trafic public simple ;
- moins de risques de cold start serveur.

Limites :

- l'application fait beaucoup de travail dans le navigateur ;
- le SEO depend de la strategie mise en place autour du HTML initial ;
- les secrets serveur ne doivent pas etre dans le front ;
- si chaque visiteur lit beaucoup Firestore, le cout et les perfs dependent fortement des lectures client ;
- plus difficile d'avoir une page produit "pure serveur" sans systeme supplementaire.

### Firebase App Hosting avec Next.js SSR

App Hosting lance l'application Next cote serveur. Les routes peuvent generer du HTML initial, des metadata et du JSON-LD avant hydration.

Avantages :

- meilleur controle SEO route par route ;
- contenu produit dans le HTML initial ;
- possibilite de garder `firebase-admin` et secrets cote serveur ;
- possibilite de cacher ou precharger des donnees publiques cote serveur ;
- meilleure base pour des pages publiques catalogue/produit qui doivent etre indexees proprement.

Limites :

- plus complexe qu'un hosting statique ;
- cout serveur possible selon trafic, cold starts, regions et cache ;
- toutes les parties interactives restent du React client ;
- SSR ne regle pas automatiquement les lags galerie, animations, images ou scroll ;
- il faut surveiller les logs, la latence serveur et les caches.

## Quelle structure scale mieux ?

Reponse courte : ca depend du type de charge.

Pour servir beaucoup de visiteurs sur une vitrine simple, Firebase Hosting SPA scale tres bien parce que ce sont des fichiers statiques CDN.

Pour un catalogue SEO avec pages produit, metadata propres, JSON-LD, partage social, rendu initial fiable et logique serveur, Next App Hosting scale mieux architecturalement parce que tu peux controler le rendu serveur, les caches et les secrets.

Dans ce projet precis :

- pour le SEO produit, avantage Next ;
- pour le poids reseau mesure, avantage Next ;
- pour le scroll desktop, pas de difference critique mesuree ;
- pour les lags mobile, aucune promesse automatique : il faut continuer a mesurer ;
- pour le cout/complexite, avantage SPA Hosting ;
- pour une architecture long terme avec admin, checkout, SEO produit et server-only, avantage Next App Hosting.

## Decision recommandee

Je recommande de continuer la validation du clone Next comme cible future, mais pas de basculer immediatement la production.

Raison :

- Next apporte un gain reel sur le HTML produit SSR et le poids charge sur les routes mesurees.
- La base importee dans `secondevienextjsssr` permet de tester sans toucher a la base source.
- App Hosting correspond mieux a une architecture ecommerce/catalogue avec SEO.
- Mais il reste des validations obligatoires : admin, checkout, auth, Storage uploads, Stripe test, droits Firebase, cout App Hosting, vrais tests mobile.

Decision pratique :

1. Garder la SPA Hosting comme reference stable.
2. Continuer les tests Next sur App Hosting sandbox.
3. Ne pas migrer le domaine principal avant validation admin/commerce/mobile.
4. Corriger les ecarts SEO restants comme la canonical home Next.
5. Refaire le benchmark apres chaque gros changement image/cache/layout.

## Limites du benchmark

- Benchmark synthetique Playwright, pas donnees terrain Chrome UX Report.
- Une seule date de mesure.
- Une seule region utilisateur depuis la machine locale.
- Desktop mesure plus profondement que mobile dans ce document.
- Les flows admin/checkout connectes ne sont pas inclus dans ce benchmark architecture.
- Les performances peuvent varier selon cache CDN, cold start App Hosting, reseau et etat des images.

## Commande a relancer

```powershell
npm run perf:architecture
```

Avec URLs personnalisees :

```powershell
$env:SPA_BASE_URL='https://secondeviesandbox.web.app'
$env:NEXT_BASE_URL='https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
npm run perf:architecture
```
