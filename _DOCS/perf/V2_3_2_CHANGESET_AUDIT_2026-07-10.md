# Audit differentiel v2.3.2

Date : 2026-07-10

Objet : determiner objectivement ce qui doit etre conserve, corrige ou retire entre la revision stable precedente et `v2.3.2`, sans restaurer tout le depot a l'aveugle.

## References Git

- revision precedente : `62e5232` (`v2.3.1`) ;
- revision auditee : `d6ad35b` (`v2.3.2`) ;
- branche : `main` ;
- delta commit : 30 fichiers, 2 042 insertions et 10 331 suppressions ;
- la suppression du `package-lock.json` racine explique 10 178 suppressions ;
- 10 fichiers performance sont actuellement modifies dans le working tree apres `v2.3.2` : ils sont analyses separement et ne doivent pas etre attribues au commit.

## Verdict executif

`v2.3.2` est globalement utile, mais pas homogene. Un retour complet a `v2.3.1` supprimerait des ameliorations SEO, infra et performance prouvees. Le comportement d'ouverture du menu a donc ete restaure selectivement, puis la CI et les artefacts locaux ont ete nettoyes.

| Domaine | Note | Verdict |
| --- | ---: | --- |
| Architecture Next SSR/SSG/ISR | 8,5/10 | conserver |
| SEO produits et categories | 8,5/10 | conserver |
| Chargement et cold-scroll | 7/10 | gain reel, chantier non termine |
| Menu principal desktop | 4/10 | regression au premier clic |
| Infra et headers | 8/10 | conserver, smoke tests complets encore necessaires |
| Toolchain et hygiene Git | 8/10 | artefact pnpm retire, budget CI conserve en mode informatif |

Note globale indicative apres correctifs : 7,7/10. Cette note ne justifie ni un reset global ni une promotion production sans validation visuelle.

## Mega menu : comparaison precise

Fichier determinant : `src/kit/marketplace/GlobalMenuTriggerIsland.jsx`.

### Comportement v2.3.1

- import statique de `GlobalMenu` ;
- portal monte des l'hydratation, meme menu ferme ;
- geometrie du menu, header et bandeau disponible avant le premier clic ;
- cout JS et montage paye plus tot, mais ouverture plus previsible.

### Changement v2.3.2

- `GlobalMenu` passe derriere `lazy()` et `Suspense` ;
- le portal n'existe qu'apres `hasPanelMounted` ;
- le chunk commence a charger sur `pointerenter`, focus ou `pointerdown` ;
- le fallback `Suspense` est `null`.

### Cause du bandeau qui apparait/disparait

Sur desktop, `presentPanel()` ajoute immediatement la classe racine `global-menu-desktop-open`. Le CSS fixe alors le header en utilisant les variables de geometrie disponibles, ou leurs valeurs par defaut. Le composant lazy arrive ensuite et son `useLayoutEffect` mesure `.gallery-announcement-banner`, renseigne `--global-menu-announcement-height` et ajoute `global-menu-announcement-visible`.

Le premier affichage se produit donc en deux phases :

1. header/menu declare ouvert sans geometrie finale du bandeau ;
2. chunk charge, bandeau mesure, header et contenu recalcules.

Ce decalage explique le saut visuel et le sentiment que le bandeau disparait puis revient.

### Cause du premier clic lent

Le premier `pointerdown` declenche a la fois :

- le fetch/parse/evaluation du chunk `GlobalMenu` ;
- le premier montage React du shell ;
- la mesure de geometrie ;
- le scroll lock ;
- le rendu de la variante desktop ;
- la sequence visuelle du menu.

Le hover ne masque le cout que si l'utilisateur laisse assez de temps entre l'entree du pointeur et le clic. Un clic direct paie tout le cout.

### Ce que v2.3.2 n'a pas introduit

Les constantes suivantes existaient deja en `v2.3.1` :

- verrou ouverture mobile : 260 ms ;
- verrou fermeture mobile : 220 ms ;
- fermeture desktop : 520 ms ;
- suppression du clic suivant un `pointerdown` via `pointerOpenedRef`.

La sensation de "limite de clic" n'est donc pas creee par ces valeurs dans `v2.3.2`. Le montage lazy et le premier rendu tardif rendent cependant ce mecanisme beaucoup plus perceptible.

`GlobalMenu.jsx`, le CSS du bandeau, `ArchitecturalHeaderServer.jsx` et `AnnouncementBannerServer.jsx` n'ont pas change dans le commit. Le delta causal est concentre dans le trigger.

### Decision menu

Corriger selectivement le trigger, sans restaurer tout `v2.3.1` :

1. ne plus appliquer la classe de repositionnement du header avant que le panneau existe ;
2. precharger le chunk au survol, au focus et au `pointerdown`, sans monter le DOM cache pendant le premier scroll ;
3. conserver le split `GlobalMenuDesktop` / `GlobalMenuMobile` et l'absence de preload Firebase/login ;
4. conserver les animations sequencees du menu ;
5. ne modifier ni le mega menu horizontal ni le CSS du bandeau sans preuve, car ils ne font pas partie du delta `v2.3.2`.

La restauration statique exacte de `v2.3.1` a ete testee puis ecartee : elle remonte le JS initial de la home de 142 Ko a 193 Ko et a produit un gap Instagram de 350 a 366,7 ms sous CPU x4. Le correctif final est hybride : chunk lazy precharge sur intention, portal monte au premier geste, classe du header posee par le menu seulement quand le panneau existe, et verrou `pointerdown` expire automatiquement en 350 ms. Les animations internes restent intactes. Les gates finaux passent sur desktop et mobile ; le premier shell desktop apparait en 464 ms, le premier panneau en 691 ms, et ouverture/fermeture successives fonctionnent.

## Matrice v2.3.2 : garder, corriger, retirer

| Bloc | Fichiers principaux | Decision | Motif |
| --- | --- | --- | --- |
| Contrat SEO produit | `src/lib/seo/indexability.js`, `src/lib/server/products.js` | garder | remplace la denylist de titres par des regles generales : publication, fixture E2E, description, image, noindex explicite |
| Metadata produit | `app/produit/[slugOrId]/page.jsx` | garder | accepte `seoTitle`/`seoDescription` et conserve le `noindex` des fiches faibles |
| Categories | `src/lib/seo/categories.js`, route categorie, sitemap | garder | alias `deco`, titres propres, categories vides hors sitemap/noindex |
| Back-office SEO | `src/kit/admin/AdminForm.jsx` | garder | rend la decision editoriale explicite avant publication |
| Projection catalogue | `functions-public/src/public/catalog.js` | garder | transmet les champs necessaires au contrat SEO |
| Gate SEO | `scripts/check-seo-indexability.cjs` | garder | le test direct passe sur l'etat courant |
| Hero images | `MarketplaceHeroServer.jsx`, `HeroMotionIsland.jsx` | garder sous surveillance | 4 images hero initiales -> 1 ; le timing est plus complexe et doit rester valide visuellement |
| Pastilles Instagram | reveal, CSS et markup serveur | garder | progression au scroll et etat settled individuel ; gain froid mesure, mouvement final conserve |
| Avis | interactions, CSS et markup serveur | garder | calques limites aux cartes visibles/en transition, etoiles conservees |
| Gate cold-scroll | `scripts/audit-gallery-scroll-lag.mjs` | garder | le mode true cold revele le probleme que le premier gate trop chaud masquait |
| Menu principal | `GlobalMenuTriggerIsland.jsx` | corrige | montage anticipe de `v2.3.1` restaure, animations et logique de fermeture conservees |
| Origine et endpoint catalogue | `src/lib/server/env.js`, `apphosting.yaml` | garder | evite une origine deployee locale/non HTTPS et rend la region configurable |
| Headers securite | `next.config.mjs` | garder avec smoke tests | utile sur App Hosting ; login, Stripe, App Check et analytics doivent rester testes |
| Pnpm unique racine | `package.json`, `pnpm-lock.yaml`, suppression du lock npm racine | garder | clarifie la source de verite de l'application racine |
| CI | `.github/workflows/quality.yml` | corrige | `perf:budget` reste visible comme rapport informatif sans bloquer la chaine tant que la baseline est rouge |
| Artefact pnpm | `.pnpm-store/v11/index.db` | corrige | base locale retiree du depot et `.pnpm-store/` ajoute a `.gitignore` |
| ESLint | `eslint.config.mjs` | garder mais ne pas sur-vendre | remet le lint racine en route, mais ignore scripts, Functions et documentation et degrade plusieurs regles en warnings |

## SEO : pourquoi il ne faut pas revenir

La logique actuelle ne contient plus de liste `hello`, `dd`, `test`, `photo`, etc. Une fiche est indexable selon des criteres durables :

- identifiant present ;
- statut `published` ;
- absence de marqueur E2E ;
- `seoIndexable !== false` ;
- titre d'au moins 4 caracteres ;
- description d'au moins 48 caracteres ;
- image disponible.

Le catalogue peut encore afficher une fiche publiee non indexable. Le sitemap, les metadata robots et `generateStaticParams()` partagent la meme decision. Revenir a `v2.3.1` restaurerait une denylist ponctuelle et supprimerait les champs SEO admin.

Le gate direct a ete relance pendant cet audit :

```text
[seo:surface] Contrat produits, categories, metadata robots et sitemap : OK
```

## Performance : ce qui est prouve et ce qui ne l'est pas

Le palier sandbox stable passe de 650 ms a 199,9 ms sur le pire gap Instagram et de 1 429 411 a 778 708 octets avant scroll. Ces gains interdisent de qualifier tout le lot de regression.

En revanche :

- le seuil 120 ms reste rouge ;
- le paint/raster agrege ne baisse pas uniformement ;
- le DOM responsive est toujours duplique ;
- la meilleure variante P6 est locale et non validee visuellement ;
- P7 et P8 ont ete rejetes car ils degradaient un gap.

Le detail complet est conserve dans `COLD_SCROLL_FIRST_VISIT_DIAGNOSTIC_2026-07-10.md`.

## Changements locaux apres v2.3.2

Ces changements ne sont pas dans le commit `d6ad35b` :

| Changement local | Signal mesure | Decision d'audit |
| --- | --- | --- |
| `content-visibility` sur les chapitres et cartes | P6 atteint 183,4 ms | prometteur, validation visuelle obligatoire |
| images Petits Prix/Avant-Apres/footer differees | 35 -> 25 requetes, 826 Ko -> 630 Ko | garder dans P6 tant qu'aucun flash/blank n'est observe |
| seulement trois images Instagram chargees par branche au depart | baisse du decode | garder sous test de navigation carrousel |
| calques Instagram limites aux cartes en transition | coherent avec la trace | garder |
| preparation de seulement trois avis de la branche visible | cout DOM/couches reduit | garder |
| suppression du preload idle du panier | P3 199,9 ms -> P4 200 ms | faible preuve de gain, risque sur le premier panier ; a reconsiderer |
| `prefetch={false}` sur `/devis` | attribution impossible dans le lot P6 | faible confiance ; mesurer le clic avant de conserver |
| menu hybride lazy sur intention | 142 Ko initiaux ; gates desktop/mobile verts | garder : evite le DOM cache au scroll, le saut du header et le verrou de clic persistant |

## Toolchain et CI

Le budget actuel lu dans `.next` echoue notamment sur :

- home : 142,71 Ko JS gzip pour un budget de 135 Ko ;
- categories : 147,69 Ko pour 130 Ko ;
- CSS public : 58,72 Ko pour 55 Ko ;
- page A propos : 191,95 Ko pour 170 Ko ;
- devis : 143,56 Ko pour 125 Ko.

La CI publie maintenant `pnpm perf:budget` comme etape informative avec `continue-on-error: true`. Le budget reste visible sur chaque execution, mais il ne bloque plus toute la chaine tant que la baseline n'est pas fermee. Il devra redevenir obligatoire quand les seuils publics seront verts.

`git diff --check 62e5232..d6ad35b` signale aussi quatre lignes de trailing whitespace dans les deux rapports ajoutes par le commit. Ce n'est pas une regression runtime, mais cela contredit la mention de validation propre dans la roadmap.

## App Hosting et premiere connexion

`minInstances: 0` existait deja en `v2.3.1`. La mise en veille possible du conteneur n'est donc pas une regression `v2.3.2`.

Le passage eventuel a `minInstances: 1` doit faire l'objet d'une decision cout/latence. Il reduira surtout le reveil serveur et le TTFB ; il ne remplace pas le chantier navigateur Instagram/avis.

## Ordre de correction recommande

1. Tester la variante finale sur le sandbox App Hosting, en particulier Instagram/avis et le premier clic menu.
2. Fermer les budgets publics avant de rendre `perf:budget` bloquant a nouveau.
3. Mesurer ensuite l'unification du DOM responsive Instagram/avis.
4. Decider separement `minInstances: 1` a partir du cout et du TTFB reel.

## Validations de cette passe

Executions reussies :

- contrat SEO direct ;
- contrat mobile galerie ;
- classification des routes Next depuis les artefacts locaux ;
- build Next sandbox complet, 22 pages statiques generees ;
- gates menu desktop et mobile, ouverture/fermeture et absence de requete Firebase ;
- mesures `true cold fling` finales sous CPU x4.

Echecs ou limites constates :

- budget performance public encore rouge et conserve comme rapport informatif ;
- seuil strict scroll 120 ms encore rouge : Instagram 200,1 a 250 ms, avis 33,4 ms ;
- aucune comparaison A/B complete de toutes les routes n'a ete reconstruite ; le menu a en revanche ete compare entre montage statique et variante hybride sur le meme build local.

## Decision finale

- pas de reset global vers `v2.3.1` ;
- correctif hybride du trigger menu applique : pas de saut anticipe du header, verrou de clic borne, lazy sur intention ;
- SEO, routes SSG/ISR, headers, hero differe, pastilles progressives et avis prepares conserves ;
- optimisations P6 conservees comme candidat sandbox, avec gates menu et build verts mais seuil scroll strict encore rouge ;
- artefact pnpm retire et budget CI rendu informatif en attendant la fermeture des seuils.
