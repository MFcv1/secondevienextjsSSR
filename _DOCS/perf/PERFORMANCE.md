# Performance et budgets

Derniere mise a jour: 2026-07-17
Statut: `REFERENCE_ACTIVE - DETTES MESUREES`

## 1. Objectif

La performance doit ameliorer le temps reel et la perception sans supprimer l'identite visuelle, les animations utiles ou le contenu SEO. Une optimisation n'est acceptee qu'avec une cause identifiee, une mesure avant/apres et une verification fonctionnelle.

## 2. Architecture deja acquise

- routes publiques Next natives;
- HTML serveur final pour galerie, categorie, produit, A propos et devis;
- ISR a 300 secondes;
- iles client fines pour les interactions;
- menu critique premonte, contenu personnalise differe;
- grandes vues admin chargees en lazy;
- variantes images dimensionnees et metadata anti-CLS;
- `detailFast` pour le detail produit;
- miniatures 320/384 pour les cartes;
- catalogue public cache et revalidation ciblee;
- micro-cache de cinq secondes et deduplication en vol pour la version du catalogue public;
- heartbeat analytics adaptatif et cache serveur borne du hash de session, sans ralentir le live visible;
- CI avec build et classification de routes.

Ne pas rouvrir une migration SPA ou supprimer les animations comme raccourci de performance.

## 3. Mesures a distinguer

| Mesure | Question |
| --- | --- |
| TTFB | quand le serveur commence-t-il a repondre ? |
| FCP | quand le premier contenu est-il visible ? |
| LCP | quand le contenu principal est-il rendu ? |
| CLS | le layout saute-t-il ? |
| INP | les interactions repondent-elles vite ? |
| hydratation | combien de JS et de travail client sont necessaires ? |
| navigation a froid | route/chunk/cache jamais charges |
| navigation chaude | route deja prefetchee/cachee |
| p50 | mediane des utilisateurs/mesures |
| p95 | seuil sous lequel se trouvent 95 % des mesures |

Une mesure locale unique n'est pas un p95 production. Les statistiques production sont differees jusqu'a un trafic representatif.

## 4. Gates disponibles

Routes directes:

```bash
npm run perf:gallery-direct
npm run perf:product-direct
npm run perf:category-direct
npm run perf:about-direct
npm run perf:quote-direct
```

Interactions:

```bash
npm run perf:menu-desktop
npm run perf:menu-mobile
npm run perf:scroll
npm run perf:product-images
```

Budget global:

```bash
npm run perf:budget
```

`perf:budget` est actuellement informatif/non bloquant dans la CI. Il represente la dette CSS/JS restante et ne doit pas etre corrige pendant un nettoyage documentaire.

## 5. Methode de travail

1. reproduire sur une URL et un etat precis;
2. separer cold/warm, desktop/mobile et local/heberge;
3. capturer waterfall, long tasks, layout shifts ou trace selon le symptome;
4. identifier le module responsable;
5. faire le plus petit changement structurel;
6. relancer le meme scenario;
7. verifier rendu, accessibilite et metier;
8. documenter la dette restante dans ce chapitre, pas dans un nouveau rapport date.

## 6. Budgets d'architecture

Les seuils executables restent dans les scripts, pas dans ce texte. Invariants:

- aucune grosse ile client globale sur les pages publiques;
- pas de SDK admin/commerce dans le chemin critique d'une page publique;
- pas d'image `full` dans une carte;
- pas de listener Firebase inutile avant interaction;
- imports lourds (`jspdf`, graphiques, Stripe, Three/GSAP specialises) dynamiques quand leur usage est differe;
- pas de lecture Firestore illimitee;
- layout reserve pour les contenus differes;
- `transform` et `opacity` preferes aux animations de layout.

## 7. Cold starts serveur

App Hosting utilise `minInstances: 0`; les Functions peuvent egalement subir un reveil a froid. Les optimisations possibles sont:

- rapprocher les regions;
- reduire dependances et initialisation globale;
- charger les SDK couteux seulement dans les fonctions qui les utilisent;
- reutiliser les clients en scope module;
- limiter les appels sequentiels;
- ajuster min instances seulement avec un besoin et un budget.

La promesse de connexion instantanee ne peut pas etre absolue a froid sur une infrastructure scale-to-zero.

## 8. Images et premier scroll

Les anciens freezes de premier scroll ont motive le rendu serveur des sections et le report des enrichissements bas de page. Les zones a surveiller restent:

- Instagram et temoignages;
- before/after;
- cartes et medias proches du premier viewport;
- animations GSAP/Framer Motion;
- chargement de polices;
- listeners et analytics au premier scroll.

Conserver les hauteurs reservees et ne pas remplacer une section par un squelette visuellement different apres hydratation.

## 9. Navigation percue

- prefetch Next sur les liens probables;
- shell de menu immediat;
- loading de route coherent;
- fermeture immediate de l'overlay apres navigation;
- aucune etape galerie avant une route compte;
- import Auth/panier differe sur pages publiques quand la session ne le necessite pas;
- message de traitement seulement si l'action depasse le seuil perceptible.

## 10. Dettes controlees

| Dette | Statut | Condition de reprise |
| --- | --- | --- |
| budget CSS/JS global | `DEBT` | passe perf dediee apres fonctionnalites prioritaires |
| regions App Hosting/Functions dispersees | `DEBT` | decision infra avant prod |
| cold starts scale-to-zero | `ACCEPTE_PREPROD` | mesures reelles et budget production |
| p50/p95 production absents | `PRODUCTION_DEFERRED` | trafic representatif et dashboard |
| sections riches bas de galerie | `SURVEILLANCE` | regression mesuree sur appareil cible |
| matrice exhaustive appareils | `PRODUCTION_DEFERRED` | domaine final et recette de lancement |
| gain exact des caches Firestore P1 | `A_MESURER_SANDBOX` | meme parcours Data Access avant/apres de huit minutes |

## 11. Regle de cloture

Une passe performance est close quand:

- le scenario initial est mesure avant/apres;
- les gates du perimetre passent ou les ecarts sont expliques;
- aucune regression visuelle/SEO/metier n'est introduite;
- la dette restante est inscrite ici avec une condition de reprise;
- aucun nouveau rapport concurrent n'est cree.
