# Roadmap architecture, SEO et premier scroll fluide

Date : 2026-07-10  
Statut : premiers lots locaux architecture, SEO, Instagram et avis implémentés ; budgets globaux, preuves navigateur/trace et opérations Firebase externes restantes  
Source : audit direct du code actif, du build Next, du backend App Hosting sandbox et des sections galerie Instagram/avis

## Avancement du 2026-07-10

Première passe implémentée :

- rangs de révélation distincts mobile/desktop pour les 11 pastilles ;
- progression pilotée par l'intersection de la section, sans listener `scroll` ;
- file d'attente limitée à un rang toutes les 105 ms si plusieurs seuils sont franchis d'un coup ;
- préchauffage des calques étalé par rang ;
- décodage progressif et basse priorité des cinq images Instagram ;
- état `settled` individuel : chaque pastille rejoint ensuite le flottement CSS existant ;
- positions, tailles, gradients, ombres et keyframes finales inchangés.

Deuxième passe implémentée :

- socle racine fixé sur Node 22 et pnpm 11.7, lockfile npm retiré et ESLint 9 remis en fonctionnement ;
- CI lecture seule ajoutée avec installation figée, lint, contrat SEO, build, routes et budget public ;
- contrat pur `getProductSeoDecision()` partagé entre visibilité publique, SSG, metadata et sitemap ;
- descriptions et contrôles SEO ajoutés au formulaire produit, avec blocage des nouvelles publications indexables trop faibles ;
- fixtures E2E explicitement marquées, fiches faibles/sans image exclues de la surface indexable et catégories vides en `noindex` ;
- alias `/categorie/deco` redirigé vers `/categorie/decorations`, titres de catégories corrigés ;
- origine HTTPS rendue obligatoire sur App Hosting, endpoint `publicCatalog` rendu configurable par région/base URL ;
- headers de sécurité déplacés dans Next afin qu'App Hosting les applique réellement ;
- JSON dupliqué Instagram/avis retiré des attributs HTML au profit d'un simple compteur ;
- étoiles des avis et calques des cartes préchauffés en amont, par lots, sans modifier leurs keyframes ;
- mode `perf:scroll:cold-sections` ajouté pour mesurer séparément le premier passage Instagram puis avis.

Décision produit confirmée ensuite : aucune denylist durable fondée sur des noms temporaires (`hello`, `dd`, `test`, etc.). Ces données de démonstration seront supprimées avant production ; le code conserve uniquement les règles générales de qualité et les marqueurs techniques E2E explicites.

Contrôles réalisés : ESLint sans erreur bloquante, gate `seo:surface` réussi, contrat mobile réussi, classification des routes réussie, contrôles syntaxiques des scripts réussis et `git diff --check` réussi. Le budget basé sur le dernier build reste rouge (notamment JS home/catégories et CSS global) ; un nouveau build sera nécessaire pour mesurer l'effet réel de ce lot. Le build complet, le gate navigateur cold-scroll et la comparaison visuelle avant/après restent à exécuter dans une passe de validation explicite.

Les étapes d'unification des DOM mobile/desktop et de scission complète de `ProductSectionsServer.jsx` restent volontairement conditionnées à la trace : elles touchent fortement le rendu et ne doivent pas être appliquées à l'aveugle alors que l'objectif explicite est de conserver les animations et leur qualité.

Restant externe ou dépendant d'une décision de production : création du backend App Hosting production, choix du domaine commercial, relevé de la région Firestore, déploiement comparatif d'un `publicCatalog` européen, réglages Auth/App Check/CORS/Stripe et suppression éventuelle du Hosting historique après analyse de trafic.

## Validation App Hosting sandbox du 2026-07-10

> Mise a jour : les chiffres de 50 ms / 33,4 ms ci-dessous correspondent a un premier gate cible, utile mais trop optimiste pour representer le pire premier chargement. Le scenario `true cold fling` execute ensuite a mesure 650 ms avant optimisation, puis 199,9 ms sur le palier sandbox stable et 183,4 ms sur la meilleure variante locale. La reference active est `_DOCS/perf/COLD_SCROLL_FIRST_VISIT_DIAGNOSTIC_2026-07-10.md` ; le seuil strict de 120 ms reste non atteint.

- build Next complet réussi avec 22 pages statiques générées et routes SSG/ISR conservées ;
- rollout `secondevie-next-sandbox` réussi sur App Hosting ;
- réponse publique `200`, CSP Next présente et nouveaux contrats Instagram/avis présents dans le HTML servi ;
- gate ciblé corrigé pour ignorer les titres responsive cachés et arrêter le scroll sur les vraies sections visibles ;
- profil desktop 1440 px, CPU ralenti x4, cache froid : zéro long task pendant les segments Instagram et avis ;
- gap maximal Instagram : 50 ms ; gap maximal avis : 33,4 ms ; aucun gap supérieur à 100 ms ;
- préparation Instagram confirmée, 11 pastilles révélées ; préparation puis libération des calques des 10 cartes avis confirmée ;
- résultat final du gate `cold-sections` : réussi.

Rapport machine local : `logs/scroll-audit/apphosting-cold-sections-targeted-2026-07-10/2026-07-10T00-16-30-433Z-summary.json` (logs générés, non versionnés).

## Décision directrice

L'ordre recommandé est volontairement strict :

1. rendre la chaîne de build reproductible ;
2. empêcher l'indexation de contenus faibles ou de test ;
3. verrouiller le domaine, le cache et le rail de production ;
4. réduire le poids HTML/RSC sans perdre le rendu serveur ;
5. mesurer précisément le premier passage Instagram/avis ;
6. déplacer le coût de préparation des animations avant le scroll visible ;
7. optimiser le DOM et les effets uniquement si la trace le justifie ;
8. fermer les gates SEO, visuels et performance sur sandbox avant toute promotion.

Le socle SSG/ISR actuel n'est pas à remplacer. Il faut le consolider. Le chantier de fluidité ne doit pas devenir un redesign ou une suppression d'animations.

## Objectifs de sortie

### Architecture

- un runtime Node et un gestionnaire de paquets uniques et fixés ;
- un build, un lint et des gates exécutés automatiquement avant déploiement ;
- un rail sandbox et un rail production réellement séparés ;
- une origine canonique HTTPS obligatoire au build de production ;
- une topologie App Hosting / Functions / Firestore documentée et mesurée ;
- les anciennes rewrites Firebase Hosting isolées ou supprimées après preuve d'inutilité.

### SEO

- aucune URL de test ou fiche faible dans le sitemap ;
- aucune catégorie vide indexable ;
- aucune collision volontaire entre alias de catégorie ;
- titres et descriptions produit suffisamment différenciés ;
- une seule fonction de décision détermine visibilité catalogue, indexabilité, sitemap et pré-génération ;
- canonicals, robots et JSON-LD cohérents entre HTML local, sandbox et production.

### Fluidité

- animations actuelles des pastilles et étoiles conservées à l'état stabilisé ;
- aucune préparation lourde déclenchée pendant un fling ; seule l'entrée légère en `transform`/`opacity` peut progresser avec le scroll ;
- images Instagram utiles décodées avant leur première apparition ;
- première rasterisation et préparation des calques réalisées pendant une fenêtre idle ou en amont de la section ;
- aucune frame bloquée plus de 100 ms au passage Instagram -> avis ;
- aucune régression visible sur les trajectoires, rythmes, ombres, couleurs et profondeurs finales.

## Invariants à ne pas casser

- `/` reste la home canonique `force-static` avec ISR 300 secondes.
- `/galerie` reste un alias avec canonical vers `/`.
- produits et catégories restent SSG/ISR avec `generateStaticParams`.
- Instagram, avis, Avant/Après et newsletter restent rendus directement dans le HTML serveur.
- le scroll mobile reste le scroll natif de `#marketplaceGalleryScroll` ; pas de moteur de smooth-scroll JavaScript.
- aucune mise à jour React par frame de scroll.
- pas de remplacement des sections finales par des placeholders clients.
- pas de suppression des animations flottantes ou des étoiles pour faire passer artificiellement un budget.
- `prefers-reduced-motion` reste respecté.
- aucune mutation production dans cette roadmap sans validation explicite.

## Ce que je modifierais en premier

### 1. Fiabiliser les outils avant de toucher au comportement

Le lint échoue actuellement dans l'environnement audité alors que le build `--no-lint` réussit. Deux lockfiles résolvent des versions différentes et le runtime racine n'est pas fixé. Corriger le SEO ou les animations sans une base reproductible rendrait les comparaisons fragiles.

Fichiers concernés :

- `package.json` ;
- `pnpm-lock.yaml` ;
- `package-lock.json` ;
- `pnpm-workspace.yaml` ;
- `eslint.config.mjs` ;
- nouveau workflow CI, si GitHub reste le gestionnaire du dépôt.

Implémentation :

1. Choisir pnpm comme source de vérité, puisque le workspace et le lockfile pnpm sont déjà présents, ou documenter explicitement un autre choix.
2. Conserver un seul lockfile après comparaison et validation du build.
3. Fixer Node 22 pour la racine, comme dans les deux codebases Functions.
4. Épingler une matrice compatible Next 15 / React 19 / ESLint au lieu de laisser les outils varier silencieusement.
5. Réparer la configuration ESLint sous ce runtime.
6. Ajouter une CI lecture seule exécutant lint, build, classification des routes, gate SEO et budget public.
7. Interdire la promotion App Hosting si un gate obligatoire échoue.

Critères de sortie :

- installation déterministe depuis un clone propre ;
- `lint` et `build` passent sous Node 22 ;
- aucun `--no-lint` dans la CI finale ;
- un seul lockfile ;
- versions Next/React identiques en local et CI ;
- table de routes identique à la baseline.

Estimation : 1 à 2 jours.

### 2. Centraliser l'éligibilité SEO

Le défaut actuel n'est pas l'absence de métadonnées. C'est la divergence potentielle entre ce qui est publié, affiché, pré-généré et ajouté au sitemap. Une fiche `hello` passe actuellement tous ces niveaux.

Fichiers concernés :

- nouveau `src/lib/seo/indexability.js` ;
- `src/lib/server/products.js` ;
- `functions-public/src/public/catalog.js` ;
- `app/produit/[slugOrId]/page.jsx` ;
- `app/categorie/[categoryId]/page.jsx` ;
- `app/sitemap.js` ;
- `src/lib/seo/categories.js` ;
- `src/kit/admin/AdminForm.jsx` ;
- nouveau `scripts/check-seo-indexability.cjs`.

Contrat proposé :

```js
getProductSeoDecision(product) => ({
  publicVisible,
  indexable,
  reasons,
  canonicalSlug,
  title,
  description,
})
```

Cette fonction pure doit être consommable côté serveur Next et par les tests. Elle ne doit dépendre ni du navigateur ni de Firebase.

Règles minimales :

- statut `published` obligatoire pour être visible ;
- `e2eOnly`, `e2ePurpose` et marqueurs équivalents exclus ;
- titre métier d'au moins 4 caractères, sans liste spéciale liée aux anciennes données temporaires ;
- description utile au-dessus d'un seuil à définir après inventaire, par exemple 80 caractères ;
- image principale exploitable ;
- slug canonique stable ;
- possibilité explicite `seoIndexable: false` pour une fiche réelle mais trop faible ;
- raisons d'exclusion journalisées et visibles dans l'admin.

Flux à aligner :

- `generateStaticParams()` ne pré-génère que les fiches indexables ;
- le sitemap n'inclut que les fiches indexables ;
- `generateMetadata()` pose `noindex, follow` aux fiches publiques non indexables ;
- le catalogue peut continuer à afficher une fiche non indexable si le métier le souhaite ;
- les JSON-LD ne doivent jamais contredire la décision robots/canonical ;
- l'admin doit signaler les champs insuffisants avant publication.

Critères de sortie :

- aucune fixture explicitement marquée E2E dans le sitemap ou le pré-rendu indexable ;
- aucune URL avec description vide ou quasi vide dans le sitemap ;
- rapport machine lisible listant chaque exclusion et sa raison ;
- une modification des règles déclenche les mêmes résultats dans sitemap, metadata et SSG ;
- tests unitaires sur fiches publiée, brouillon, E2E, faible et valide.

Estimation : 2 à 3 jours, hors réécriture des contenus.

### 3. Assainir les catégories et les métadonnées

Fichiers concernés :

- `src/lib/seo/categories.js` ;
- `app/categorie/[categoryId]/page.jsx` ;
- `app/sitemap.js` ;
- `next.config.mjs` si un alias doit devenir une redirection ;
- back-office SEO si des champs dédiés sont ajoutés.

Implémentation :

1. Décider une seule route canonique entre `deco` et `decorations`.
2. Rediriger l'alias de manière permanente ou lui attribuer le canonical de la route retenue.
3. Calculer le nombre de produits indexables avant de produire metadata et sitemap.
4. Mettre les catégories vides en `noindex, follow` et les retirer du sitemap.
5. Pour les catégories de un ou deux produits, choisir explicitement entre enrichissement éditorial et `noindex` temporaire.
6. Corriger les titres génériques et accords, par exemple le modèle `ARMOIRES restaurés`.
7. Ajouter des champs SEO optionnels produit, avec un fallback généré depuis nom, matériau, style et caractéristique distinctive.
8. Détecter les groupes de titres dupliqués dans le gate SEO.

Cibles :

- 100 % de titres catégorie uniques ;
- au moins 95 % de titres produit uniques, puis 100 % à mesure que les contenus sont enrichis ;
- zéro catégorie vide indexable ;
- zéro alias concurrent dans le sitemap ;
- une description propre à chaque catégorie indexée.

Estimation : 2 à 4 jours selon le travail éditorial.

## Deuxième bloc : architecture de déploiement et cache

### 4. Verrouiller l'origine canonique et le rail production

Fichiers concernés :

- `src/lib/server/env.js` ;
- `apphosting.yaml` et configuration du futur backend production ;
- `.firebaserc` ;
- `firebase.json` ;
- scripts d'audit infra.

Implémentation :

1. Ajouter une validation d'environnement qui refuse `localhost`, une chaîne vide ou une origine non HTTPS lors d'un build de déploiement.
2. Conserver `localhost` uniquement pour le développement local explicite.
3. Créer un alias Firebase et un backend App Hosting production distincts du sandbox.
4. Fixer le domaine final avant ouverture à l'indexation.
5. Vérifier Auth authorized domains, App Check, CORS Functions et Stripe sur ce domaine.
6. Ajouter un smoke test après rollout pour canonical, robots, sitemap, cache et noindex des tunnels privés.
7. Ne supprimer le Hosting historique qu'après preuve que son domaine ne reçoit plus de trafic utile.

Critères de sortie :

- impossible de produire un sitemap production pointant vers `localhost` ou le sandbox ;
- aucun secret ou identifiant live dans le rail sandbox ;
- canonicals et sitemap utilisent le domaine commercial final ;
- rollback App Hosting documenté.

Estimation : 2 à 4 jours, dépendant de la création du projet et du domaine.

### 5. Aligner les régions et clarifier la chaîne de données

Le backend App Hosting observé est en `europe-west4`, les Functions clientes en `europe-west1`, tandis que `publicCatalog` est appelé en `us-central1`.

Fichiers concernés :

- `src/lib/server/env.js` ;
- `functions-public/index.js` ;
- configuration régionale Functions ;
- scripts de benchmark infra.

Implémentation :

1. Mesurer p50/p95/p99 de `publicCatalog` à froid et à chaud depuis App Hosting.
2. Relever la région Firestore dans la console avant toute décision.
3. Déployer une variante Europe de `publicCatalog` sans couper l'ancienne.
4. Comparer latence, erreurs et coût.
5. Basculer l'URL Next par variable d'environnement, pas par chaîne codée en dur.
6. Garder un rollback vers l'endpoint précédent pendant la phase de preuve.
7. Documenter l'ordre des caches : ISR Next, cache fetch, CDN Function, cache mémoire versionné.

Critères de sortie :

- région du catalogue configurable ;
- baisse mesurée de la latence de régénération ;
- invalidation `catalogVersion` et `revalidateTag` toujours cohérente ;
- aucune double source de vérité.

Estimation : 2 à 3 jours plus observation.

### 6. Faire appliquer les en-têtes par Next/App Hosting

Les headers définis dans `firebase.json` pour Hosting classique ne sont pas servis par le backend App Hosting audité.

Fichiers concernés :

- `next.config.mjs` ;
- scripts de smoke HTTP ;
- scripts inline du layout et JSON-LD si la CSP impose leur externalisation ou des hashes.

Implémentation :

1. Ajouter les headers dans le chemin réellement servi par Next.
2. Commencer par `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` et `frame-ancestors` via CSP.
3. Construire la CSP depuis l'inventaire réel Firebase, Stripe, Google et cartes.
4. Éviter une CSP permissive copiée de l'ancien Hosting.
5. Tester login, App Check, checkout, cartes, analytics et JSON-LD.
6. Masquer `X-Powered-By` si compatible avec l'exploitation.

Critères de sortie :

- headers visibles sur le domaine App Hosting ;
- aucune erreur CSP console sur les parcours principaux ;
- aucun impact sur l'indexation ou les données structurées.

Estimation : 1 à 3 jours selon la CSP.

## Troisième bloc : réduire le poids sans perdre le SEO

### 7. Réduire HTML et RSC avant de retoucher les animations

Constats du build audité : environ 855 kB de HTML non compressé pour la home et 1,39 Mo pour `/categorie/meubles`.

Fichiers concernés :

- `src/kit/marketplace/GalleryRoutePage.jsx` ;
- `src/kit/marketplace/GalleryServerView.jsx` ;
- `src/kit/marketplace/ProductSectionsServer.jsx` ;
- `src/kit/marketplace/CategoryServerView.jsx` ;
- helpers de projection catalogue.

Implémentation :

1. Mesurer la contribution HTML/RSC de chaque section, sans deviner.
2. Créer des view models minimaux par section plutôt que transmettre le produit complet.
3. Vérifier si les mêmes produits sont sérialisés plusieurs fois entre nouveautés et petits prix.
4. Fixer un nombre initial de cartes serveur suffisant pour le SEO et le premier écran.
5. Garder les autres produits découvrables via sitemap et pages produit ; ajouter un chargement progressif accessible si nécessaire.
6. Scinder `ProductSectionsServer.jsx`, actuellement très volumineux, en composants serveur par section pour rendre les coûts lisibles.
7. Ne pas utiliser `content-visibility: auto` aveuglément : il peut déplacer le coût de rendu exactement sur le premier scroll. Le valider uniquement avec la trace cold-scroll.

Cibles initiales :

- home sous 600 kB HTML non compressé ;
- catégorie représentative sous 800 kB ;
- aucune perte de H1, texte éditorial, liens principaux, canonical ou JSON-LD ;
- baisse du JS/CSS public vers les budgets existants.

Estimation : 2 à 4 jours.

## Quatrième bloc : premier scroll Instagram/avis sans casser les animations

## Diagnostic code actuel

Les éléments suivants sont des causes probables à confirmer par trace :

| Zone | Comportement actuel | Risque surtout à froid |
| --- | --- | --- |
| Pastilles Instagram | 11 objets avec gradients, ombres, filtres et entrée déclenchée près de la section | première rasterisation et promotion simultanée de nombreux calques pendant le scroll |
| Déclencheur pastilles | `data-floating-ready` posé 40 ms après intersection avec `rootMargin: 32%` | travail commencé alors que l'utilisateur est encore en plein défilement |
| État stabilisé | mouvement `transform` continu après 2,8 s | à conserver ; il n'est pas considéré coupable sans preuve |
| Images Instagram | 5 images `loading="lazy"`, dupliquées dans les DOM mobile et desktop | fetch, decode et upload texture au premier passage |
| Cartes Instagram | 10 cartes au total pour 5 contenus, `will-change-transform` permanent | couches et mémoire supplémentaires |
| Avis | 5 cartes desktop + 5 cartes mobile | DOM et styles dupliqués |
| Étoiles | deux groupes de 5 avec animation de transform et drop-shadow | premier paint/raster potentiellement coûteux ; animation finale à préserver |
| Interactions | le composant global initialise Avant/Après, Instagram et avis dès l'hydratation | travail de setup non contextualisé, possible concurrence avec le premier scroll |
| Hydratation globale | plusieurs îles publiques, header et comportements démarrent après le HTML | si l'utilisateur descend immédiatement, leur travail peut chevaucher le cold-scroll |
| Gate actuel | audit surtout orienté scroll desktop global ou newsletter | ne cible pas précisément Instagram/avis ni le scroller mobile imbriqué |

L'observation produit est prioritaire : si le freeze disparaît après le premier passage, il faut d'abord supprimer le coût de chauffe, pas réduire le mouvement stabilisé.

### 8. Construire un gate cold-scroll ciblé avant toute optimisation

Fichier principal :

- extension de `scripts/audit-gallery-scroll-lag.mjs`, ou nouveau `scripts/audit-gallery-cold-sections.mjs` si la séparation reste plus lisible.

Nouveau script package proposé :

```json
"perf:scroll:cold-sections": "node scripts/audit-gallery-cold-sections.mjs --assert"
```

Scénarios obligatoires :

1. cache froid, premier scroll rapide depuis la home vers Instagram ;
2. passage lent sur l'entrée des pastilles ;
3. fling rapide Instagram -> avis -> newsletter ;
4. retour arrière avis -> Instagram ;
5. second passage chaud, utilisé comme contrôle ;
6. clic carrousel pendant que le scroll vient de s'arrêter.

Viewports :

- mobile 390 x 844 utilisant `#marketplaceGalleryScroll` ;
- tablette 768 x 1024 ;
- desktop 1440 x 900 utilisant le scroll document ;
- au moins un profil CPU ralenti x4 et un réseau froid simulé.

Instrumentation :

- `PerformanceObserver('longtask')` ;
- échantillonnage `requestAnimationFrame` sur le vrai scroller ;
- Event Timing pour les contrôles ;
- Layout Shift ;
- trace Chrome : style, layout, paint, raster, composite et image decode ;
- nombre d'animations actives par section ;
- état `data-floating-*` au moment des gaps ;
- requêtes et décodages des cinq images Instagram ;
- distinction premier passage / second passage.

Budgets initiaux sur profil ralenti :

- aucun gap supérieur à 100 ms ;
- zéro ou au maximum un gap entre 50 et 100 ms, à éliminer avant clôture ;
- p95 des gaps inférieur ou égal à 24 ms ;
- aucune long task supérieure à 50 ms pendant l'entrée Instagram/avis ;
- CLS cumulé des deux sections inférieur à 0,02 ;
- interaction carrousel inférieure à 200 ms ;
- activité décorative hors écran mesurée ; aucune pause imposée tant que son coût est nul ou négligeable dans la trace.

Ces seuils ne garantissent pas mathématiquement zéro latence sur tous les appareils. Ils visent l'absence de blocage perceptible sur des profils réalistes et ralentis.

Estimation : 1 à 2 jours.

### 9. Préparer les images avant leur première apparition

La priorité n'est pas de recompresser les cinq fichiers, déjà raisonnables, mais d'éviter leur décodage au moment exact où le scroll traverse la section.

Fichiers concernés :

- `src/kit/marketplace/ProductSectionsServer.jsx` ou futur composant Instagram séparé ;
- `src/kit/marketplace/InstagramFloatingTokensReveal.jsx`, renommé si son rôle devient plus large ;
- nouveau helper client de warmup si nécessaire.

Implémentation :

1. Détecter la branche réellement visible avec `matchMedia`.
2. Collecter les URLs uniques, pas les dix noeuds image dupliqués.
3. Quand la section Petits Prix précédente approche, lancer en priorité le fetch/decode de la carte centrale et de ses deux voisines.
4. Utiliser `requestIdleCallback`, `scheduler.postTask` en priorité background si disponible, avec fallback borné.
5. Appeler `HTMLImageElement.decode()` et journaliser sa durée.
6. Décoder les deux cartes restantes dans une seconde tranche idle.
7. Ne pas précharger ces images dans le `<head>` : elles ne doivent pas concurrencer le LCP, les images produit ou les polices.
8. Ajouter dimensions intrinsèques et `aspect-ratio` cohérents pour stabiliser le raster.
9. Démarrer l'autoplay quand la carte centrale est décodée et que la section est suffisamment visible, sans attendre la fin du scroll.

Critères de sortie :

- aucune opération `ImageDecode` longue pendant l'entrée visible ;
- carte centrale nette au premier passage ;
- aucun coût réseau ajouté au chemin LCP ;
- second passage identique au premier en fluidité.

Estimation : 1 à 2 jours.

### 10. Préparer les calques en amont, puis révéler les pastilles avec la progression du scroll

Les trajectoires et le mouvement final restent identiques. Seul le calendrier de préparation change.

État proposé :

```text
idle -> prepared -> revealed(rank 1...5) -> settled par pastille
```

- `prepared` : gradients/ombres présents, calques préparés hors de la fenêtre de scroll visible ;
- `revealed` : chaque rang apparaît quand la section franchit son seuil de progression ;
- `settled` : chaque pastille démarre ensuite son animation flottante actuelle, sans attendre les autres.

Fichiers concernés :

- `src/kit/marketplace/InstagramFloatingTokensReveal.jsx` ;
- `src/index.css` autour de `.instagram-floating-field` ;
- futur gate cold-scroll.

Implémentation :

1. Garder l'IntersectionObserver actif au lieu de le déconnecter au premier passage.
2. Créer une phase `prepared` une à deux hauteurs de viewport avant la section, pendant une fenêtre idle.
3. Promouvoir/rasteriser les pastilles par petits lots, pas les 11 dans la même frame.
4. Lier l'entrée à la progression de la section dans le viewport, pas à `scrollend` : rang 1 quand le haut de section approche 92 % de la hauteur visible, puis rangs suivants autour de 78 %, 64 %, 50 % et 36 %.
5. Préférer une animation CSS liée à la vue (`view-timeline` / `animation-timeline`) lorsqu'elle est supportée, avec uniquement `transform` et `opacity`.
6. Prévoir un fallback par IntersectionObserver et sentinelles internes, sans listener `scroll` qui recalcule le layout à chaque frame.
7. Si un fling franchit plusieurs seuils dans la même frame, mettre les rangs en file et en révéler au maximum un toutes les 80 à 120 ms : l'entrée continue pendant le scroll, mais ne part jamais en bloc.
8. Construire l'ordre depuis la position visuelle : éléments supérieurs et principaux d'abord, éléments médians ensuite, éléments bas en dernier. Le mapping peut différer entre mobile et desktop pour respecter la constellation visible.
9. Dès que la transition d'une pastille se termine, démarrer son `instagram-token-float` actuel ; ne pas attendre que les 11 soient entrées.
10. Une pastille révélée ne disparaît pas si l'utilisateur remonte : elle reste visible et continue à flotter comme aujourd'hui.
11. Remplacer le timeout global arbitraire de 2,8 s par l'état individuel de chaque pastille.
12. Retirer `will-change` après l'entrée de chaque pastille ; le réactiver seulement si l'entrée doit réellement être rejouée.
13. Vérifier que les filtres restent statiques pendant la transition. Ne les simplifier que si la trace prouve un repaint excessif après préchauffage.

Protection visuelle :

- mêmes positions finales ;
- mêmes tailles et opacités finales ;
- mêmes gradients et ombres ;
- mêmes trajectoires et durées stabilisées ;
- arrivée progressive pilotée par l'avancement dans la section, sans attente de fin de scroll ;
- aucune disparition de pastille sur les appareils normaux.

Estimation : 2 à 3 jours.

### 11. Préparer la section avis sans retirer l'animation des étoiles

Fichiers concernés :

- futur composant `TestimonialsSectionServer.jsx` ;
- runtime des interactions galerie ;
- `src/index.css` autour de `.testimonial-star`.

Implémentation :

1. Instrumenter séparément le premier paint des cartes, des ombres et des étoiles.
2. Préparer la variante responsive visible avant son entrée dans le viewport.
3. Démarrer l'animation des étoiles pendant une fenêtre calme, légèrement avant leur apparition, pour que le premier raster ne tombe pas sur le scroll.
4. Conserver la vague, les délais et le drop-shadow tant que la trace après préchauffage respecte les budgets.
5. Si le drop-shadow animé reste le dernier goulot prouvé, tester un équivalent visuel via pseudo-élément opacity/transform et comparer image par image avant adoption.
6. Limiter `will-change` aux 500 ms de transition des cartes ; le retirer sur `transitionend`.
7. Ne pas faire tourner une seconde variante responsive cachée.

Critères de sortie :

- animation des cinq étoiles visuellement identique ;
- aucun pic de paint/raster à l'entrée de la section ;
- contrôles avis immédiatement interactifs ;
- zéro animation active dans une branche `display:none`.

Estimation : 1 à 2 jours.

### 12. Unifier le DOM responsive seulement après les gains de warmup

Le code rend actuellement deux carrousels Instagram et deux carrousels avis, un mobile et un desktop. Cette dette augmente HTML, DOM et styles, mais elle ne doit pas être corrigée en premier si le problème réel est uniquement le cold raster.

Fichiers concernés :

- scission de `src/kit/marketplace/ProductSectionsServer.jsx` ;
- nouveaux composants serveur Instagram et Testimonials ;
- `GalleryFixedSectionsInteractions.jsx` ou runtime remplaçant.

Implémentation :

1. Rendre une seule liste de cinq posts Instagram.
2. Rendre une seule liste de cinq avis.
3. Adapter tailles, positions, header et contrôles avec CSS responsive et variables.
4. Remplacer `data-items={JSON.stringify(...)}` par un contrat DOM minimal quand les données sont déjà dans le HTML.
5. Garder les textes, liens et images dans le HTML SSR.
6. Comparer les états mobile et desktop avant/après, pas seulement l'état initial.

Cette phase est conditionnelle : elle devient prioritaire si la trace montre que DOM, style ou mémoire de calques restent élevés après les phases 9 à 11.

Estimation : 2 à 4 jours.

### 13. Repenser le runtime des sections sans charger du JS pendant le scroll

Le runtime actuel initialise toutes les sections dans un seul `useEffect`. La cible n'est pas forcément de créer davantage de chunks : charger un chunk dynamique au moment du scroll pourrait aggraver le freeze.

Approche recommandée :

1. Garder un orchestrateur client très petit.
2. Préparer les modules d'interaction en idle après le chemin critique.
3. Attacher chaque section quand elle approche, mais jamais au milieu d'un scroll actif.
4. Utiliser l'event delegation lorsque possible.
5. Nettoyer observers, timers et listeners au démontage.
6. Ne lancer aucun calcul de layout dans un handler `scroll`.
7. Conserver l'IntersectionObserver et un détecteur de scroll idle partagé.

Fichiers possibles :

- `GallerySectionRuntimeIsland.jsx` ;
- `galleryRuntime/beforeAfter.js` ;
- `galleryRuntime/instagram.js` ;
- `galleryRuntime/testimonials.js`.

Le découpage exact doit être choisi après mesure de la taille des chunks. Le principe est : code prêt avant usage, initialisation hors scroll, aucun montage React lourd au passage.

Estimation : 1 à 3 jours.

## Matrice de validation visuelle des animations

Pour Instagram et avis, capturer avant/après aux instants suivants :

- avant entrée ;
- 200 à 300 ms après début d'entrée ;
- 700 ms ;
- fin d'entrée ;
- état stabilisé à 4 s ;
- état flottant à 8 s ;
- carrousel après clic précédent/suivant ;
- mode clair, sombre et reduced-motion ;
- mobile 390 px, tablette et desktop 1440 px.

Comparer :

- position et taille de chaque pastille ;
- ordre d'apparition ;
- amplitude et période du flottement ;
- ombres, saturation, profondeur et opacité ;
- vague et couleur des étoiles ;
- positions des cartes avant et après navigation ;
- absence de flash d'image ou de texte.

La clôture exige une validation visuelle en plus des métriques. Une amélioration de trace qui dégrade nettement l'identité animée n'est pas acceptée.

## Gates proposés

### À chaque lot architecture/SEO

```bash
npm run lint
npm run build
npm run next:routes
npm run seo:surface
npm run perf:budget
```

### À chaque lot Instagram/avis

```bash
npm run mobile:contract
npm run perf:gallery-direct
npm run perf:scroll:cold-sections
npm run perf:budget
```

### Avant promotion sandbox -> production

- smoke HTTP canonical/robots/sitemap/cache ;
- validation JSON-LD ;
- cold-scroll mobile et desktop ;
- screenshots/vidéos comparatifs ;
- aucune erreur console ;
- rollback documenté ;
- validation manuelle du propriétaire produit.

## Ordre de commits recommandé

1. `chore/toolchain-reproducible`
2. `test/seo-indexability-gate`
3. `feat/seo-indexability-contract`
4. `fix/category-canonicals-and-thin-pages`
5. `chore/prod-origin-and-app-hosting-rail`
6. `perf/server-payload-projections`
7. `test/gallery-cold-scroll-gate`
8. `perf/instagram-image-prewarm`
9. `perf/instagram-progressive-entry`
10. `perf/testimonials-cold-raster-warmup`
11. `refactor/fixed-sections-responsive-dom` si encore nécessaire
12. `docs/architecture-seo-perf-closeout`

Un commit ne doit pas mélanger nettoyage SEO, migration régionale et animation. Chaque lot doit pouvoir être annulé isolément.

## Calendrier indicatif

| Bloc | Durée indicative | Dépendance |
| --- | ---: | --- |
| Outils reproductibles | 1-2 jours | aucune |
| Éligibilité SEO et catégories | 4-7 jours | outils stables |
| Rail prod, origine, régions, headers | 5-10 jours | décisions infra externes |
| Réduction HTML/RSC | 2-4 jours | gate SEO actif |
| Gate cold-scroll | 1-2 jours | build stable |
| Warmup images et arrivée progressive | 3-5 jours | trace baseline |
| Avis et runtime sections | 2-5 jours | résultats de trace |
| Unification DOM conditionnelle | 2-4 jours | seulement si encore utile |
| Closeout sandbox | 1-2 jours | tous les lots retenus |

Total réaliste : environ 3 à 5 semaines selon les validations visuelles, les décisions de domaine et la migration régionale. Le sous-chantier cold-scroll seul est estimé à 1 à 2 semaines avec instrumentation et preuve multi-appareils.

## Ce qu'il ne faut pas faire

- ajouter Lenis ou un smooth-scroll JavaScript pour masquer les frames perdues ;
- supprimer les pastilles, figer les étoiles ou réduire arbitrairement leur nombre ;
- poser `will-change` sur toute la page en permanence ;
- précharger toutes les images secondaires dans le `<head>` ;
- charger un nouveau gros chunk exactement quand Instagram entre à l'écran ;
- piloter l'animation avec un listener `scroll` non passif ou un state React ;
- appliquer `content-visibility: auto` sans trace cold-scroll ;
- transformer Instagram/avis en sections client-only ;
- corriger uniquement `hello` sans créer une règle systémique ;
- déployer le domaine sandbox comme canonical de production.

## Définition de terminé

La roadmap est terminée quand :

1. la CI garantit le contrat Next/SEO ;
2. le sitemap ne contient que des URL utiles et différenciées ;
3. le domaine production et les régions sont documentés ;
4. les routes publiques restent SSG/ISR et sous budget ;
5. le premier scroll froid Instagram/avis respecte les seuils sur mobile et desktop ;
6. le second passage n'est pas significativement meilleur que le premier, signe que le coût de chauffe a été déplacé ;
7. les pastilles continuent à flotter et les étoiles continuent leur vague avec la même qualité perçue ;
8. les preuves métriques et visuelles sont archivées dans un closeout daté.
