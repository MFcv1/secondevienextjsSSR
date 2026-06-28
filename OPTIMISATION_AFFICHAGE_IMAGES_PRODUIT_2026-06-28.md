# Optimisation affichage images produit - 2026-06-28

Ce document fige la passe d'optimisation faite apres l'audit visuel des fiches produit, autour des versions locales 1.5.2 / 1.5.3. Il doit etre relu avant toute modification qui touche:

- l'image centrale des fiches produit;
- le fond flou desktop du detail produit;
- les preloads/preconnect Storage;
- les cartes categorie et galerie avec warmup produit;
- les miniatures produit;
- les scripts d'audit froid images.

Objectif produit: garder une experience premium, avec image centrale nette le plus vite possible, sans retour du voile flou central, sans flash, et sans charger tout le catalogue en avance.

## Diagnostic initial

Symptomes observes:

- sur certains meubles, l'image centrale affichait un voile flou ou un panneau terne avant l'image nette;
- sur d'autres meubles, l'image apparaissait puis disparaissait/reapparaissait rapidement, ce qui creait un flash;
- le grand fond flou desktop derriere la fiche etait valide et devait rester;
- Debongout donnait une impression plus directe car ses images etaient souvent deja pretes ou chargees sans placeholder blur central visible;
- les latences restantes apres la premiere correction etaient similaires desktop/mobile, ce qui pointait vers le chemin commun image froide / Storage / poids image plutot qu'un probleme responsive.

Conclusion: il ne fallait pas supprimer le fond flou d'ambiance. Il fallait traiter la mecanique de reveal de l'image centrale et le chemin reseau de l'image detail.

## Passe robuste appliquee

### Priorite 1 - retirer le blocage React sur la premiere image

Principe:

- l'image principale initiale ne doit pas attendre `hasPrimaryImagePainted` pour etre visible;
- le navigateur doit pouvoir peindre l'image native des qu'elle est decodee;
- le gate `decode()` reste utile pour les changements de miniatures, pas pour masquer le premier rendu;
- le voile central base `blurDataUrl` a ete retire de l'image du milieu.

Effet attendu:

- moins d'attente quand l'image est deja en cache ou deja prechargee;
- moins de dependance a l'hydratation React;
- disparition du panneau flou central juge peu premium.

Fichier cle:

- `src/kit/marketplace/ProductDetailShellIsland.jsx`

Invariant a garder:

- le grand fond flou desktop derriere la fiche reste conserve;
- ne pas remettre de `blurDataUrl` ou de placeholder flou sur le cadre central de l'image principale.

### Priorite 2 - preconnect Storage

Principe:

- prechauffer la connexion vers Firebase Storage avant les requetes images;
- ajouter `dns-prefetch` en complement du `preconnect` existant.

Effet attendu a froid:

- gain typique de quelques dizaines a quelques centaines de millisecondes selon DNS/TLS/connexion;
- moins de penalite sur la premiere image Storage.

Fichier cle:

- `app/layout.jsx`

Invariant a garder:

- `https://firebasestorage.googleapis.com` doit rester preconnecte sur les routes publiques.

### Priorite 3 - warmup produit sur les pages categorie

Principe:

- les cartes categorie doivent exposer les memes attributs de warmup que les cartes galerie;
- au hover/focus/pointerdown/touchstart, l'ile client prefetch la route produit et precharge l'image detail;
- l'image prechargee est la vraie image detail nette, pas une vignette degradee.

Effet attendu:

- depuis `/categorie/buffets`, l'image detail commence a charger avant la navigation;
- le clic parait beaucoup plus direct sur les meubles visibles ou presque visibles.

Fichiers cles:

- `src/kit/marketplace/CategoryServerView.jsx`
- `src/kit/marketplace/GalleryGridActionsIsland.jsx`
- `src/kit/marketplace/GalleryProductCardServer.jsx`

Invariant a garder:

- les cartes produit restent de vrais liens vers `/produit/...`;
- le warmup ne doit pas intercepter ou remplacer la navigation native.

### Priorite 4 - limiter les miniatures concurrentes

Principe:

- l'image centrale reste prioritaire;
- les miniatures non actives ne doivent pas partir toutes en `eager`;
- seules les miniatures actives peuvent etre chargees plus tot, les autres restent `lazy` avec priorite basse.

Effet attendu:

- moins de concurrence reseau sur les produits avec beaucoup de photos;
- l'image principale garde la bande passante disponible.

Fichier cle:

- `src/kit/marketplace/ProductDetailShellIsland.jsx`

Invariant a garder:

- ne pas recharger massivement les miniatures au premier affichage produit.

### Priorite 5 - srcSet propre, a garder prudent

Constat:

- Debongout laisse souvent le navigateur choisir la meilleure taille via `srcset/sizes`;
- ce levier peut reduire le poids quand `card` suffit visuellement;
- mais il peut aussi reintroduire des swaps ou flashs si l'image visible change de source apres paint.

Decision actuelle:

- ne pas reintroduire `srcSet` complexe sur l'image centrale tant que le reveal actuel donne un vrai gain;
- si ce levier est repris, il faut le faire avec un preload coherent et sans upgrade visuel apres paint.

### Priorite 6 - option infra plus ambitieuse

Levier:

- mettre les images derriere un domaine/CDN/proxy image maitrise;
- ou generer des variantes plus adaptees au rendu detail.

Decision actuelle:

- ne pas commencer par la refonte infra;
- mesurer d'abord les images froides lentes et traiter les pires cas.

## Derniere amelioration - warmup visible au scroll

Apres les premiers retours, le warmup hover/touch etait efficace mais encore trop tardif quand l'utilisateur cliquait tres vite ou naviguait mobile sans hover.

Amelioration ajoutee:

- `GalleryGridActionsIsland` accepte `observeVisibleWarmup`;
- sur les pages categorie, `CategoryServerView` active cette option;
- un `IntersectionObserver` observe les cartes categorie proches du viewport;
- quand une carte arrive dans une marge d'environ `650px`, l'image detail est mise en file de warmup;
- le setup attend idle ou un court delai pour ne pas concurrencer le premier rendu;
- le warmup est coupe sur `saveData` ou reseau 2g;
- les images deja prechauffees ne sont pas rechargees;
- la file reste bornee par `MAX_ACTIVE_WARMUPS = 2`.

Important: `low`, `auto` ou `high` concernent la priorite reseau, pas la qualite image. Le warmup charge la meme image detail nette. La limite sert seulement a ne pas lancer trop d'images HD en parallele.

Priorites retenues:

- carte proche/visible: warmup en arriere-plan via la file existante;
- hover/focus: warmup d'intention;
- press/touch/clic: priorite haute immediate;
- image centrale de la fiche ouverte: priorite haute.

Fichiers cles:

- `src/kit/marketplace/GalleryGridActionsIsland.jsx`
- `src/kit/marketplace/CategoryServerView.jsx`

## Audit froid images

Un script dedie a ete ajoute pour separer les problemes UI des problemes fichier/reseau:

- `scripts/audit-product-detail-images-cold.mjs`
- commande: `npm run perf:product-images:cold`

Il mesure:

- produit;
- URL detail;
- variante utilisee;
- poids en Ko;
- temps fetch froid;
- `cache-control`;
- dimensions metadata;
- option navigateur avec cache desactive.

Commande utile pour les buffets:

```powershell
npm run perf:product-images:cold -- --category=buffets --limit=15 --browser --browser-limit=4 --assert
```

Resultat observe apres la passe:

- les headers Storage sont bons: `public, max-age=31536000, immutable`;
- les cas encore lents sont surtout des fichiers `medium` lourds ou froids;
- exemples mesures: certains buffets autour de 359 Ko peuvent rester proches de 0.9 a 1.2 s en fetch froid.

Conclusion:

- si une image reste lente apres warmup, le prochain levier n'est plus React;
- c'est soit le poids du fichier, soit le froid reseau Storage.

## Validations effectuees

Validations locales lancees pendant la passe:

```powershell
node --check scripts/audit-product-detail-images-cold.mjs
git diff --check
npm run mobile:contract
npm run lint
npm run build
npm run perf:product-images:cold -- --category=buffets --limit=15 --browser --browser-limit=4 --assert
```

Validation App Hosting de la premiere passe:

- deploy sandbox App Hosting effectue sur `secondevie-next-sandbox`;
- retours utilisateur: gain net, fiches plus reactives, persistance seulement sur certains meubles froids/lourds;
- retour mobile: latences restantes proches du desktop, ce qui confirme le diagnostic image froide commune.

## Prochains leviers recommandes

1. Verrouiller le mecanisme actuel: ne pas remettre le blur central, ne pas remettre un fade global, ne pas remettre toutes les miniatures en eager.
2. Utiliser regulierement `perf:product-images:cold` pour identifier les images lentes.
3. Creer une variante `detail-fast` ou recompression ciblee pour les pires images si les memes produits restent lents.
4. Evaluer ensuite seulement un `srcSet/sizes` de l'image centrale, avec beaucoup de prudence.
5. Garder l'option CDN/proxy image pour une passe infra plus large, pas comme correction UI rapide.

## Regles a ne pas casser

- Le fond flou desktop derriere le produit est voulu.
- Le cadre central doit afficher une image nette, sans voile flou par-dessus.
- Le premier affichage ne doit pas attendre une hydratation React inutile.
- Les cartes categorie et galerie doivent rester des liens natifs.
- Le warmup ne doit jamais charger tout le catalogue.
- Le warmup doit respecter `saveData` et les connexions tres lentes.
- Le clic/touch utilisateur garde la priorite haute.
- Toute modification mobile marketplace doit relire `alertemobile.md` et passer `npm run mobile:contract`.

## Option gardee sous le pied - CDN / proxy image

Cette option n'est pas la prochaine correction UI recommandee. Elle doit rester une piste d'architecture si, apres warmup et recompression ciblee, les images restent lentes a froid.

### Image mentale

CDN seul:

```text
Client
-> depot proche
-> image deja stockee pres de lui
```

Au lieu que chaque visiteur aille chercher l'image dans l'atelier principal, un reseau de depots garde des copies proches des visiteurs.

Proxy image:

```text
Client
-> atelier de preparation
-> image coupee a la bonne taille, bon format, bon poids
```

Le proxy ne fait pas que rapprocher l'image. Il peut preparer une version adaptee au contexte d'affichage.

CDN + proxy:

```text
Client
-> CDN proche
-> version optimisee deja fabriquee par le proxy
-> retour rapide si cache chaud
```

Le proxy fabrique la bonne version une fois, puis le CDN la sert rapidement aux visiteurs suivants.

### Definition technique

Un CDN est un reseau de serveurs qui cache des fichiers statiques pres des utilisateurs. Pour une image produit:

```text
Navigateur
-> CDN
-> si cache hit: reponse immediate depuis le CDN
-> si cache miss: le CDN recupere l'image depuis Firebase Storage
-> le CDN garde une copie
-> les prochaines visites repartent du CDN
```

Un proxy image est un service intermediaire qui recoit une URL ou des parametres, recupere l'image source, puis peut la transformer:

```text
Source Storage:
photo_full.webp, 1920px, 600 Ko

Demande navigateur:
https://images.secondevie.fr/products/abc?w=900&format=avif

Proxy:
-> recupere la source
-> redimensionne a 900px
-> encode en AVIF ou WebP selon navigateur
-> compresse
-> renvoie une image plus legere
```

### Difference avec la strategie actuelle

Strategie actuelle:

```text
Navigateur
-> Firebase Storage
-> variante existante: thumb/card/medium/large/full
```

Strategie CDN/proxy:

```text
Navigateur
-> domaine image proche / CDN
-> variante exacte pour l'ecran et le DPR
-> cache CDN long
```

La strategie actuelle est simple et saine: variantes WebP, cache Storage long, warmup, preconnect. Le CDN/proxy ajoute une couche infra pour ameliorer surtout le vrai froid reseau et les tailles exactes.

### Gains possibles

- reduire la latence a froid quand Firebase Storage est loin ou pas encore chaud;
- servir l'image depuis un domaine proche du site;
- generer une largeur exacte au lieu de choisir seulement `card`, `medium` ou `large`;
- servir AVIF aux navigateurs compatibles, WebP sinon;
- garder un cache long par variante transformee;
- ameliorer les produits dont `medium` reste trop lourd pour le rendu central.

### Risques et couts

- nouvelle infra a maintenir;
- cout CDN ou cout de transformation image;
- risque de cache stale si les URLs ne sont pas versionnees;
- risque de premier hit lent si la transformation se fait a la demande et n'est pas pregeneree;
- besoin de bien gerer les headers `cache-control`;
- risque de reintroduire des swaps visuels si les tailles changent apres paint;
- risque de complexite si on melange trop de sources: Storage brut, variants existants, proxy, CDN.

### Conditions avant de lancer cette piste

Ne pas partir sur CDN/proxy tant que ces points ne sont pas mesures:

1. Audit froid complet du catalogue avec `perf:product-images:cold`.
2. Liste des images vraiment lentes, avec poids et temps fetch.
3. Recompression ou variante `detail-fast` testee sur les pires cas.
4. Comparaison avant/apres sur sandbox App Hosting.
5. Confirmation que la latence restante vient encore du reseau froid, pas du poids fichier ou de l'UI.

### Decision recommandee aujourd'hui

Court terme:

- garder le mecanisme actuel;
- continuer le warmup categorie/scroll;
- auditer les images lentes;
- traiter les plus gros fichiers par recompression ou variante `detail-fast`.

Moyen / long terme:

- etudier CDN/proxy si beaucoup d'images restent lentes malgre des fichiers raisonnables;
- privilegier un domaine image stable, par exemple `images.secondevie.fr`;
- garder des URLs versionnees pour pouvoir mettre un cache long;
- ne pas lancer de transformation a la demande non cachee sur le chemin critique produit.

Le CDN/proxy est donc un levier puissant, mais c'est une passe architecture/performance, pas une correction rapide de l'UI.
