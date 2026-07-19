# Synchronisation catalogue, caches, navigation et images - roadmap d'implementation

- Creation: 2026-07-19
- Statut: `TEMPORARY_EXECUTION_PLAN_ACTIVE`
- Source factuelle: [CATALOGUE_SYNCHRONISATION_SITUATION.md](CATALOGUE_SYNCHRONISATION_SITUATION.md)
- Cloture prevue: 2026-07-26, ou plus tot apres validation complete
- Cible: sandbox `secondevienextjsssr`; aucune production implicite

## 1. Regle d'utilisation

Cette roadmap temporaire a ete demandee explicitement pour lancer l'implementation dans une nouvelle tache Codex.

Elle ne constitue pas une autorisation cloud. Avant un commit, push, deploiement, modification IAM, Data Access ou ecriture sandbox, la nouvelle tache doit verifier l'autorisation explicite disponible dans son propre contexte.

La prochaine tache doit:

1. lire `AGENTS.md` et `map.md`;
2. lire entierement le [document de situation](CATALOGUE_SYNCHRONISATION_SITUATION.md);
3. relire cette roadmap;
4. verifier le commit et le worktree reels;
5. suivre les phases dans l'ordre;
6. ne pas commencer les optimisations visuelles avant d'avoir ferme les risques de concurrence;
7. mettre a jour les chapitres canoniques dans le meme changement;
8. supprimer les deux documents temporaires a la cloture.

## 2. Objectif ferme

Livrer une chaine unique et explicable:

```text
mutation Firestore
  -> release Storage immutable
  -> plan d'impact exact
  -> pointeur publie sans course
  -> revalidation des seules dependances
  -> preuve de version servie
  -> signal borne aux onglets visibles
  -> navigation Next native
  -> images cachees sans faux flash
```

Le chantier est termine uniquement si:

- les risques reconciler/builder/rollback sont couverts par des transactions et des tests;
- une modification normale ne purge plus toutes les fiches et categories;
- l'ancienne et la nouvelle URL d'un produit sont traitees;
- le pointeur est frais lors d'une regeneration ISR;
- l'ISR 300 est l'unique filet temporel des pages;
- un onglet visible apprend qu'un contenu public a change sans lire `furniture`;
- galerie et categories partagent le meme moteur media;
- `Petits Prix` ne retire plus les URL image;
- une image chaude ne repasse plus artificiellement par un fond blanc;
- une categorie ne rend plus quatre copies du meme produit;
- les liens internes ne rechargent plus le document;
- les trois suites catalogue, les gates Next et la recette sandbox passent;
- Data Access confirme le nouveau contrat;
- la documentation canonique correspond au code;
- le code mort et les documents temporaires sont retires.

## 3. Contraintes non negociables

- conserver `furniture` comme source Firestore;
- conserver le snapshot Storage comme unique source publique;
- conserver `current`, `previous`, `last-known-good`;
- conserver la verification Firestore du checkout;
- conserver ISR `300`;
- aucun fallback `public/meta`, `publicCatalog`, legacy, shadow ou canary;
- aucun listener public sur la collection catalogue;
- aucune suppression de meuble reel;
- aucune suppression de media reel sans inventaire et dry-run;
- aucune lecture de secret;
- aucune production;
- aucune multiplication des scripts de test;
- aucun redesign visuel hors des corrections de chargement;
- aucun passage global a `next/image` dans ce chantier;
- aucune invalidation des URL image pour prix, stock, texte ou categorie.

## 4. Strategie de livraison

L'implementation doit etre decoupee en changements revisables, dans cet ordre:

1. contrats d'etat et concurrence;
2. plan d'impact immutable;
3. revalidation exacte et sante;
4. caches, version et signal;
5. navigation et images;
6. nettoyage et documentation;
7. validation locale puis sandbox.

Ne pas faire un commit geant melangeant toutes les phases si des commits intermediaires coherents sont possibles. Ne pas pousser une phase connue cassante.

### 4.1 Avancement local au 2026-07-19

Baseline: branche `codex/analytics-live-robust`, commit `1bcecd5`; les modifications documentaires deja presentes au depart ont ete preservees. Les phases code 1 a 6 sont implementees dans le worktree local. Sous la baseline exacte Node `22.23.1` et pnpm `11.7.0`, les suites `core` (7/7), `resilience` (17/17) et `security` sont vertes; `security` inclut 10/10 tests Node puis 5/5 tests Firestore/Storage Rules executes localement sous Temurin Java 21. Le lint (0 erreur, 259 avertissements preexistants), le build avec fixture, `seo:surface`, `next:routes` et `mobile:contract` sont aussi verts. `perf:gallery-direct` et `perf:category-direct` passent avec les routes de fixture; les gates produit/images attendent le catalogue Storage reel du sandbox. `perf:budget` confirme la dette CSS/JS globale deja documentee et reste non bloquant. La recette navigateur, le deploiement sandbox, Data Access, la CI, le commit et le push restent a executer dans la phase de recette autorisee. Les cases ci-dessous distinguent les preuves locales acquises des preuves sandbox encore attendues; les deux documents temporaires restent actifs jusqu'a cette recette.

## 5. Phase 0 - Baseline et preparation

### 5.1 Verifier l'etat de depart

- [x] executer `git status --short`;
- [x] noter la branche courante;
- [x] noter le commit de depart;
- [x] identifier les changements utilisateur eventuels;
- [x] ne pas ecraser un fichier modifie sans rapport;
- [x] confirmer Node 22 et pnpm 11.7.0 pour les gates;
- [x] relire les fichiers structurants listes dans le document de situation.

### 5.2 Capturer les contrats actuels

Avant modification, relever dans une note temporaire ignoree ou dans le compte rendu:

- schema du document `sys_catalog_publication/secondevie`;
- schema d'un pointeur Storage;
- schema du manifeste;
- champs d'identite des builds;
- tags et chemins actuellement invalides;
- headers de `/api/catalog` et `/api/search`;
- nombre de representations DOM par produit categorie;
- politique `priority/loading/fetchPriority` de chaque surface;
- imports reels des helpers de prechargement.

### 5.3 Baseline automatisee

Lancer avant implementation, sans navigateur:

```bash
pnpm run test:catalog:core
pnpm run test:catalog:resilience
pnpm run lint
```

Lancer `test:catalog:security` seulement si Java et les emulateurs sont disponibles. Sinon, noter explicitement que la CI devra fournir cette preuve.

### Gate phase 0

- [x] worktree compris et changements utilisateur preserves;
- [x] baseline enregistree;
- [x] aucun cloud modifie;
- [x] aucun navigateur lance;
- [x] aucun nouveau script cree sans necessite.

## 6. Phase 1 - Fermer les courses de publication

Priorite: `P0`. Aucune optimisation d'image ne doit etre livree avant cette phase.

### 6.1 Versionner les transitions de controle

Introduire une version monotone de l'etat de controle, par exemple `stateVersion`, avec compatibilite pour les documents historiques sans ce champ.

Regles:

- toute transaction qui change un etat de publication incremente la version;
- une reparation basee sur une ancienne version doit etre abandonnee ou recalculee;
- aucune ecriture `merge` non transactionnelle ne doit effacer un lease ou une revision plus recente;
- `desiredRevision` est toujours le maximum entre la valeur fraiche et la valeur proposee;
- les identites `revision + manifestSha256` restent obligatoires.

Fichiers principaux:

```text
functions/src/catalog/publicationState.js
functions/src/catalog/catalogMutationRecorder.js
functions/src/catalog/buildCatalogSnapshot.js
functions/src/catalog/catalogReconciler.js
functions/src/catalog/catalogMaintenance.js
```

### 6.2 Rendre les reparations du reconciler transactionnelles

Remplacer les reparations basees sur un snapshot ancien par des helpers transactionnels qui:

1. relisent le document de controle;
2. comparent `stateVersion` attendu;
3. comparent `leaseToken` et `leaseExpiresAt`;
4. comparent l'identite du pointeur attendue;
5. recalculent `desiredRevision` avec la valeur fraiche;
6. refusent la reparation si l'etat a avance;
7. appliquent seulement les champs dont le reconciler est proprietaire.

Interdictions:

- ne jamais appeler un `set(..., { merge: true })` tardif contenant `leaseToken: null` sans transaction;
- ne jamais remettre `buildState: queued` a partir d'une lecture ancienne;
- ne jamais rabaisser `desiredRevision`;
- ne jamais conclure `healthy` uniquement parce qu'aucune reparation n'a ete appliquee.

### 6.3 Donner une identite complete au rollback

Ajouter ou normaliser:

```text
rollbackOperationId
rollbackOwner
rollbackStartedAt
rollbackHeartbeatAt
rollbackExpiresAt
rollbackState
rollbackSourceRevision/hash
rollbackTargetRevision/hash
```

Regles:

- la preparation et le CAS appartiennent a la meme operation;
- le reconciler ne reprend pas une operation avant expiration reelle;
- une operation active emet ou renouvelle son heartbeat;
- un rollback et un build ne peuvent pas posseder simultanement le droit de changer `current`;
- une reprise compare l'identite source/cible avant toute ecriture;
- une ancienne Function ne peut pas finaliser une operation remplacee.

### 6.4 Renouveler le lease avant le CAS

Dans `buildCatalogSnapshot.js`:

- renouveler le lease apres les operations longues;
- relire transactionnellement le controle juste avant le CAS;
- verifier token, revision cible, version d'etat et absence de rollback actif;
- definir une marge minimale de validite du lease avant le CAS;
- abandonner proprement si le lease ne peut pas etre prolonge;
- ne pas faire tourner `previous` ou LKG si le CAS `current` est refuse.

### 6.5 Representer le CAS reussi mais la finalisation incomplete

Introduire l'etat explicite:

```text
pointer_committed_control_pending
```

Cet etat couvre:

```text
CAS Storage current reussi
        |
        X panne avant finalisation Firestore
```

Le reconciler doit savoir:

- verifier que `current` correspond a la release preparee;
- finaliser l'etat Firestore sans republier;
- reparer `previous`/LKG de facon idempotente;
- relancer le plan de revalidation associe;
- ne jamais construire une nouvelle identite pour cette reprise.

### 6.6 Epingler la generation Storage

Dans `snapshotStorage.js`:

- lire la generation du pointeur;
- telecharger exactement cette generation;
- verifier que les metadata utilisees appartiennent a cette generation;
- recommencer si la generation a change;
- retourner ensemble `body`, `value`, `generation`, `etag` et identite validee;
- appliquer le meme contrat aux comparaisons et CAS;
- supprimer physiquement un candidat fallback rejete seulement lorsque le protocole de suppression est sur et couvert par test.

### 6.7 Tests a ajouter dans `resilience`

- [x] reconciler lit N, builder acquiert un lease, reconciler ne l'efface pas;
- [x] reconciler lit N, mutation cree N+1, `desiredRevision` reste N+1;
- [x] deux reconciliations concurrentes restent idempotentes;
- [x] rollback `preparing` vivant n'est pas vole;
- [x] rollback expire est repris une seule fois;
- [x] ancien rollback ne peut pas finaliser une nouvelle operation;
- [x] build et rollback ne changent pas `current` simultanement;
- [x] lease proche de l'expiration est renouvele avant CAS;
- [x] lease perdu avant CAS empeche la publication;
- [x] CAS reussi puis panne Firestore produit `pointer_committed_control_pending`;
- [x] reconciler finalise cet etat sans nouvelle release;
- [x] generation pointeur changeant entre metadata/body declenche un retry;
- [x] CAS refuse ne modifie ni `previous` ni LKG;
- [x] retry de rotation reste idempotent.

### Gate phase 1

- [x] toutes les transitions sensibles ont un proprietaire explicite;
- [x] aucune reparation tardive non transactionnelle ne peut ecraser un etat recent;
- [x] tests d'interleavings verts;
- [x] aucun changement visible public necessaire pour fermer cette phase;
- [x] aucune ecriture cloud lancee.

## 7. Phase 2 - Produire un plan d'impact immutable

Priorite: `P0/P1`. Le plan ne doit pas dependre uniquement de l'evenement Firestore initial.

### 7.1 Source du diff

Comparer:

- la derniere release saine effectivement servie;
- la nouvelle projection publique normalisee.

Pourquoi:

- plusieurs mutations peuvent etre regroupees par debounce;
- une suppression n'est plus presente dans l'etat final;
- une reprise ou reconstruction doit obtenir le meme resultat;
- le reconciler doit pouvoir rejouer exactement le plan du build;
- le diff des snapshots represente le contenu public, pas seulement l'intention d'une ecriture.

### 7.2 Separer revision et contenu

Calculer et conserver:

```text
revision                 identite operationnelle
manifestSha256           identite du manifeste
aggregateSha256          identite du contenu public visible
impactPlanSha256         identite canonique du plan d'impact
```

Une reconstruction dont `aggregateSha256` est identique ne doit pas notifier inutilement les navigateurs.

### 7.3 Schema cible du plan

Exemple indicatif a adapter au schema executable:

```json
{
  "schemaVersion": 1,
  "mode": "targeted",
  "revision": 46,
  "manifestSha256": "...",
  "aggregateSha256": "...",
  "planHash": "...",
  "products": [
    {
      "id": "product-id",
      "changeType": "updated",
      "beforePath": "/produit/ancien-slug-product-id",
      "afterPath": "/produit/nouveau-slug-product-id",
      "beforeCategories": ["buffets", "meubles"],
      "afterCategories": ["commodes", "meubles"],
      "purchasabilityChanged": false,
      "searchChanged": true,
      "sitemapChanged": true
    }
  ],
  "paths": [],
  "affectsGallery": true,
  "affectsSearch": true,
  "affectsSitemap": true,
  "generatedAt": "..."
}
```

Le JSON canonique utilise pour le hash doit avoir:

- ordre stable des cles;
- tableaux tries/dedupliques;
- chemins normalises;
- aucune valeur volatile incluse dans le hash si elle ne change pas l'impact;
- bornes explicites sur produits, categories et chemins.

### 7.4 Chemins canoniques

Centraliser une fonction pure partagee ou un contrat teste garantissant la parite entre:

- la construction de l'URL publique dans Next;
- la construction avant/apres dans les Functions;
- la validation de l'endpoint de revalidation.

Elle doit couvrir:

- accents;
- apostrophes;
- espaces et ponctuation;
- titre vide ou historique;
- identifiant stable;
- ancienne URL;
- nouvelle URL;
- redirection canonique eventuelle.

Ne pas copier silencieusement une troisieme implementation de slug.

### 7.5 Graphe des categories

Construire un helper executable qui retourne:

- categorie feuille;
- parents publics;
- aliases/redirects concernes;
- pages editoriales dependantes si necessaire.

Le plan doit inclure l'union avant/apres.

### 7.6 Regles d'impact par type de changement

| Changement | Fiche | Categories | Galerie | Recherche | Sitemap |
| --- | --- | --- | --- | --- | --- |
| prix | oui | listes affichant le prix | oui si selection | oui | non en principe |
| stock/vendu | oui | listes affichant disponibilite | oui | oui | selon indexabilite |
| titre/slug | ancienne + nouvelle | oui | oui | oui | oui |
| categorie | oui | ancienne + nouvelle + parents | oui | oui | oui si URL/indexation |
| publication | oui | nouvelles dependances | oui | oui | oui |
| depubli/suppression | ancienne fiche | anciennes dependances | oui | oui | oui |
| image | oui | listes utilisant la carte | oui | oui si indexabilite | selon SEO |
| ordre editorial | non si contenu fiche identique | selon surface | oui | non | non |

Cette matrice doit devenir du code teste, pas rester uniquement documentaire.

### 7.7 Persistance et reprise

Le plan doit etre immutable et lie a la release, par exemple comme objet de release reference et hashe par le manifeste.

Le journal de build/control conserve au minimum:

```text
impactPlanPath
impactPlanSha256
aggregateSha256
```

Le builder, le retry et le reconciler doivent charger ce meme objet. Ils ne doivent jamais recalculer un plan different pour la meme identite de release.

### 7.8 Mode global borne

`mode: full` est reserve a:

- rollback;
- migration de taxonomie;
- plan absent/corrompu;
- diff depassant les bornes;
- changement massif explicitement reconnu;
- reprise d'une ancienne release sans plan compatible.

La raison doit etre journalisee avec un code stable.

### 7.9 Tests a ajouter dans `core`

- [x] creation produit;
- [x] modification prix seule;
- [x] stock `1 -> 0`;
- [x] stock `0 -> 1`;
- [x] vendu et remise en vente;
- [x] titre et slug;
- [x] categorie feuille et parent;
- [x] publication/depublication;
- [x] suppression;
- [x] image remplacee;
- [x] ordre editorial seul;
- [x] diff identique avec revision nouvelle;
- [x] ordre des documents sans effet sur les hashes;
- [x] ancien/nouveau chemin canonique;
- [x] planHash stable;
- [x] depassement de borne produit basculant en `full`;
- [x] plan malforme refuse.

### Gate phase 2

- [x] chaque release nouvelle possede un plan verifiable;
- [x] le plan est reproductible et immutable;
- [x] l'ancien et le nouveau produit sont representes;
- [x] les parents de categorie sont couverts;
- [x] retry/reconciler utilisent exactement le meme plan;
- [x] `aggregateSha256` est separe de `revision`.

## 8. Phase 3 - Revalidation exacte et sante observable

### 8.1 Transporter l'identite complete

Le payload signe doit contenir ou referencer de facon verifiable:

```text
schemaVersion
revision
manifestSha256
aggregateSha256
impactPlanPath ou plan borne
impactPlanSha256
mode
```

La signature HMAC couvre le corps exact. Toute alteration d'un chemin, d'un hash ou d'une revision doit invalider la signature.

### 8.2 Valider strictement l'entree

Dans `/api/revalidate-catalog`:

- refuser les schemas inconnus;
- verifier projet/audience attendus;
- verifier timestamp et HMAC;
- verifier les hashes hexadecimaux;
- borner produits, categories et chemins;
- dedupliquer;
- refuser `..`, protocole, domaine externe, backslash et chemin hors catalogue;
- reconstruire ou valider les chemins a partir des identites metier;
- reserver `full` aux raisons autorisees;
- ne jamais accepter un chemin arbitraire simplement parce que l'appel est signe.

### 8.3 Invalidation normale

Pour un plan cible:

- invalider le cache mutable du pointeur utilise par les API;
- invalider `/` si `affectsGallery`;
- invalider `/galerie` avec la meme condition;
- invalider ancienne et nouvelle URL de chaque produit;
- invalider categories feuille et parentes avant/apres;
- invalider `/api/catalog` et `/api/search` selon impact;
- invalider le sitemap uniquement si `affectsSitemap`;
- ne pas invalider le tag global des releases immuables;
- ne pas invalider toutes les fiches ou categories par defaut.

### 8.4 Reponse contractuelle

La route doit retourner un JSON verifiable, par exemple:

```json
{
  "ok": true,
  "acceptedRevision": 46,
  "manifestSha256": "...",
  "aggregateSha256": "...",
  "planHash": "...",
  "mode": "targeted",
  "paths": ["/", "/produit/..."],
  "tags": ["catalog:api-pointer"]
}
```

Le dispatcher:

- refuse les redirections;
- refuse un corps non JSON;
- compare toutes les identites;
- compare le `planHash`;
- distingue timeout, refus, reponse incoherente et erreur serveur;
- ne considere pas un simple HTTP 2xx comme preuve de fraicheur.

### 8.5 Exposer la version servie

Chaque surface catalogue doit exposer sans donnee sensible:

```text
revision
aggregateSha256
manifestSha256 abrege ou identite publique equivalente
```

Supports possibles:

- attribut racine `data-catalog-revision` et `data-catalog-version`;
- metadata HTML non indexante;
- headers serveur pour les API.

Le choix doit etre stable et testable sans analyser du texte metier.

### 8.6 Verification bornee apres invalidation

Apres acceptation, verifier avec timeout et nombre limites:

- `/api/catalog/version`;
- `/` si touchee;
- une ancienne/nouvelle fiche touchee;
- une categorie touchee;
- le sitemap seulement si touche.

Le probe doit verifier la version attendue, pas seulement le statut HTTP.

Eviter une boucle infinie:

- nombre maximal de tentatives;
- backoff borne;
- journal d'erreur structure;
- reprise ulterieure par le reconciler.

### 8.7 Remplacer `healthy`

Representer separement:

```text
integrityState          valid/invalid/unknown
sourceLagState          current/behind/unknown
invalidationState       pending/accepted/failed
servedState             pending/observed/stale/failed
servedRevision
servedAggregateSha256
lastVerifiedAt
```

Une vue admin peut calculer un resume humain, mais les Functions ne doivent pas ecraser ces dimensions par un seul booleen optimiste.

### 8.8 Tests

Dans `core`/`resilience`/`security`:

- [x] payload exact avec planHash;
- [x] corps altere refuse;
- [x] timestamp expire refuse;
- [x] signature incorrecte refusee;
- [x] redirection refusee;
- [x] JSON incoherent refuse;
- [x] ancien/nouveau slug invalides;
- [x] categorie parente invalidee;
- [x] sitemap epargne pour prix seul;
- [x] mode full borne et journalise;
- [x] retry rejoue les memes chemins;
- [x] revalidation N ne peut pas marquer N+1 sain;
- [x] version API correcte mais HTML ancien reste `servedState: stale`;
- [x] verification finale attend la version observee;
- [x] timeout laisse un etat reparable.

### Gate phase 3

- [x] mutation normale sans pattern global;
- [x] chemins canoniques exacts;
- [x] reponse endpoint entierement verifiee;
- [x] `healthy` remplace par des etats observables;
- [x] reprise reconciler conserve le meme plan.

## 9. Phase 4 - Un seul proprietaire des caches et fraicheur client

### 9.1 Separer les lecteurs pointeur et release

Refactorer `materializedCatalog.js` pour distinguer:

```text
readFreshCurrentPointer()
readFreshFallbackPointer(name)
readImmutableRelease(path, manifestSha256)
readApiPointerCached()
```

Regles:

- les pages en regeneration utilisent les pointeurs frais;
- les releases sont cachees longtemps par chemin/hash;
- le cache API mutable a son tag dedie, par exemple `catalog:api-pointer`;
- aucun tag normal ne purge toutes les releases;
- les fallbacks restent validates dans l'ordre current/previous/LKG;
- un fallback ne remet jamais Firestore dans le chemin public.

### 9.2 Garder ISR 300 comme seul minuteur de page

- conserver `export const revalidate = 300` sur les routes existantes;
- ne pas ajouter un second TTL de 300 au pointeur lu pendant la regeneration;
- documenter que la premiere requete apres expiration peut declencher un refresh SWR;
- ne pas promettre un plafond exact sans mesure du CDN;
- ne pas changer a 30 secondes ou 30 minutes pendant ce chantier.

### 9.3 Clarifier `/api/catalog`

Decision cible:

- reponse courante et correcte;
- comportement de cache explicite;
- suppression de l'ETag si tous les consommateurs restent `no-store`;
- suppression des affirmations `CDN/ETag` non executees;
- bornes `limit/cursor` conservees;
- aucune persistence navigateur du catalogue complet.

### 9.4 Creer `/api/catalog/version`

Reponse minimale:

```json
{
  "revision": 46,
  "aggregateSha256": "...",
  "publishedAt": "..."
}
```

Contrat:

- aucune liste produit;
- lecture fraiche ou cache mutable explicitement invalide;
- ETag base sur `aggregateSha256`;
- support `If-None-Match`/304;
- payload minuscule;
- aucune donnee admin;
- rate/couts mesurables;
- test fonctionnel 200 puis 304.

### 9.5 Creer le signal temps reel borne

Chemin indicatif a confirmer avec la convention de donnees:

```text
sys_catalog_live/current
```

Schema maximal:

```json
{
  "schemaVersion": 1,
  "revision": 46,
  "aggregateSha256": "...",
  "changedProductIds": ["..."],
  "affectedCategoryIds": ["..."],
  "affectsGallery": true,
  "affectsSearch": true,
  "full": false,
  "publishedAt": "server timestamp"
}
```

Regles de securite:

- lecture publique du seul document;
- ecriture refusee au navigateur, meme admin;
- ecriture uniquement via Admin SDK du backend de publication;
- champs et tailles bornes;
- aucune description, prix, stock, image ou information privee;
- un seul document courant, pas d'historique infini;
- rules et contrat de retention documentes.

Ordre d'ecriture obligatoire:

```text
release validee
  -> current publie
  -> invalidation acceptee
  -> version servie observee ou politique de signal explicite
  -> signal ecrit
```

Ne jamais signaler une version avant qu'elle puisse etre lue.

### 9.6 Ile client de synchronisation

Creer une petite ile globale limitee aux routes catalogue:

- connait la version rendue dans le DOM;
- s'abonne au document uniquement si `document.visibilityState === 'visible'`;
- se desabonne immediatement en etat cache;
- au `pageshow` ou retour visible, appelle une fois `/api/catalog/version`;
- compare `aggregateSha256`;
- ignore les revisions au contenu identique;
- verifie la pertinence du plan pour la route courante;
- appelle un seul `router.refresh()`;
- empeche les boucles si la nouvelle page rend encore l'ancienne version;
- journalise localement seulement des codes non sensibles;
- ne bloque jamais le rendu initial;
- fonctionne sans Auth;
- respecte App Check/rules sans contournement.

### 9.7 Garde apres navigation prefetchee

Une route produit peut avoir ete prefetchee avant le changement catalogue.

Ajouter un controle apres changement de pathname:

- comparer la version rendue a la derniere version connue;
- rafraichir une seule fois si elle est ancienne;
- vider les caches applicatifs de warmup correspondant a l'ancienne version;
- ne pas provoquer un rechargement complet du document;
- conserver scroll et etat client non concerne.

### 9.8 Tests

- [x] endpoint version 200;
- [x] endpoint version 304 avec ETag identique;
- [x] hash different retourne 200;
- [ ] signal rejete en ecriture publique;
- [ ] signal lisible sans lecture de `furniture`;
- [ ] schema signal trop grand refuse;
- [ ] onglet cache sans abonnement;
- [ ] retour visible effectue un seul controle;
- [ ] hash identique ne rafraichit pas;
- [ ] hash different rafraichit une fois;
- [ ] signal produit non pertinent n'actualise pas une fiche sans rapport;
- [ ] signal full actualise toutes les surfaces catalogue;
- [ ] navigation vers un prefetch ancien est corrigee;
- [ ] absence de signal ne casse pas l'ISR ni la navigation.

### Gate phase 4

- [x] une seule couche temporelle de page a 300 s;
- [x] release immutable jamais purgee normalement;
- [x] API version conditionnelle fonctionnelle;
- [x] listener borne au document signal;
- [x] aucun polling;
- [x] aucun listener `furniture`;
- [x] Data Access attendu documente avant recette.

## 10. Phase 5 - Unifier navigation et images

### 10.1 Creer un composant media canonique

Creer un composant partage, nom indicatif:

```text
ProductCardMediaServer.jsx
```

Il devient l'unique proprietaire de:

- `picture`;
- `source` desktop si necessaire;
- `src`;
- `srcSet`;
- `sizes`;
- largeur/hauteur ou ratio;
- `loading`;
- `decoding`;
- `fetchPriority`;
- `dominantColor`;
- `blurDataUrl`;
- attributs de warmup;
- accessibilite de l'image.

`GalleryProductCardServer` et la carte categorie l'utilisent au lieu de reconstruire chacun leur markup media.

### 10.2 Placeholder reel

Politique cible:

- le conteneur reserve le bon ratio;
- la couleur dominante est disponible immediatement;
- le blur peut etre place derriere l'image nette;
- l'image nette n'est pas masquee si elle est deja disponible;
- aucun fond blanc fixe ne remplace les metadata valides;
- en absence de metadata historique, utiliser un fallback neutre non brutal;
- `prefers-reduced-motion` reste respecte.

Option la plus robuste pour cette passe: supprimer tout fade obligatoire. Si une transition froide est conservee, elle doit:

- etre declenchee uniquement apres un vrai `load/decode`;
- tester `img.complete && img.naturalWidth > 0` au montage;
- ne pas rejouer sur une image chaude;
- ne jamais maintenir l'image a `opacity: 0` en cas d'erreur JS.

### 10.3 Supprimer le report `Petits Prix`

Retirer:

- `deferImagesUntilCalm`;
- `data-cold-scroll-deferred-*`;
- la file 240 ms/92 ms;
- l'IntersectionObserver dedie uniquement a cette injection.

Toujours emettre `src/srcSet` dans le HTML. Conserver:

- `loading="lazy"` pour les cartes hors ecran;
- `decoding="async"`;
- placeholder;
- `content-visibility` uniquement si une mesure prouve son utilite au niveau de la section, pas empile sans raison sur chaque carte.

### 10.4 Politique de priorite partagee

Le moteur est commun, mais la priorite depend de la surface.

| Surface | Cartes initialement visibles | Cartes suivantes | Detail |
| --- | --- | --- | --- |
| categorie directe | premiere rangee `eager/high` | lazy | chauffe a environ un viewport |
| galerie en haut | hero prioritaire; produits hors premier viewport lazy | lazy | chauffe a l'approche |
| galerie restauree pres des produits | rangee restauree eligible a priorite bornee | lazy | chauffe a l'approche |
| Petits Prix | src present, lazy natif | lazy | chauffe a l'approche |
| Save-Data/2G | indispensable seulement | lazy | aucun warmup speculatif |

Ne pas definir toutes les cartes galerie en `eager`.

### 10.5 Fusionner le moteur de warmup

Choisir un seul proprietaire, de preference le cache de promesses/decodage de `imageUtils.js`, puis:

- supprimer le second `new Image()` de `GalleryGridActionsIsland`;
- partager une file de concurrence maximale `2`;
- conserver les promesses en cours pour dedupliquer;
- permettre un retry apres echec au lieu de garder une URL definitivement dans un `Set`;
- chauffer `detailFast`, pas `full`;
- utiliser le conteneur de scroll galerie sur mobile;
- utiliser le viewport document en categorie;
- regler la proximite a environ un viewport, avec mesure;
- route produit uniquement sur hover, focus ou press;
- pression prioritaire devant les warmups mous;
- annuler ou ignorer le travail devenu hors contexte;
- vider l'identite logique lors d'une nouvelle version catalogue si necessaire;
- respecter Save-Data et reseaux 2G.

### 10.6 Reduire la categorie a une representation par produit

Remplacer les quatre `map(filteredItems)` par une seule liste de produits.

Le composant unique doit pouvoir adopter:

- grille mobile;
- liste mobile;
- grille desktop;
- liste desktop;

via:

- classes racines et media queries;
- attributs d'etat synchronises avec l'URL;
- markup commun ou sous-parties conditionnelles legeres sans dupliquer l'image;
- accessibilite et ordre DOM stables.

Contrat testable:

```text
pour chaque productId visible:
nombre de [data-category-product="productId"] == 1
nombre d'images de carte actives == 1
```

### 10.7 Navigation Next native

Inventorier tous les `<a>` de `src/kit/marketplace` et classifier:

Garder `<a>`:

- URL externe;
- `mailto:`;
- `tel:`;
- ancre dans le meme document;
- telechargement ou rechargement explicitement voulu.

Convertir en `Link` ou routeur:

- `/`;
- `/galerie`;
- `/a-propos`;
- `/devis`;
- categories;
- produits;
- recherche;
- liens du footer vers une route;
- liens categorie associee;
- changement de route avec query lorsque le rechargement n'est pas necessaire.

Les filtres doivent:

- rester partageables par URL;
- fonctionner sans JavaScript si le contrat le demande;
- ne pas provoquer une page intermediaire;
- conserver focus et scroll de facon previsible.

Apres nettoyage, ajouter ou durcir un contrat lint/test qui interdit un `<a href="/...">` pour les routes publiques, avec exceptions documentees pour les ancres.

### 10.8 Tests de code images/navigation

Ajouter aux suites ou gates existantes, sans nouveau script si possible:

- [x] `Petits Prix` emet toujours `src` et `srcSet`;
- [x] aucune constante 240/92 ms dediee aux images froides;
- [x] aucune carte ne marque loaded sur la seule presence d'une URL;
- [x] aucune animation globale ne force une image chaude de 0 a 1;
- [x] couleur dominante/blur transmis au media;
- [x] aucune variante `full` dans une carte;
- [x] premiere rangee categorie prioritaire;
- [x] galerie ne rend pas toutes les cartes prioritaires;
- [x] Save-Data/2G coupe le warmup;
- [x] concurrence maximale deux;
- [x] route prefetchee seulement sur intention;
- [x] chaque produit categorie rendu une seule fois;
- [x] aucun lien interne inter-route en `<a>`;
- [x] ancres, email, telephone et externes restent valides;
- [x] changement prix/stock conserve les URL image;
- [x] remplacement image produit une nouvelle URL;
- [x] fixture catalogue contient variantes et metadata image.

### Gate phase 5

- [x] un composant media partage;
- [x] un moteur de warmup partage;
- [x] plus de report manuel `Petits Prix`;
- [x] plus de faux fade blanc;
- [x] une representation DOM par produit categorie;
- [x] navigation route interne Next native;
- [x] aucune suppression de compatibilite media non prouvee.

## 11. Phase 6 - Nettoyage et alignement documentaire

### 11.1 Candidats de suppression apres preuve

Rechercher imports statiques, dynamiques, noms de donnees et references avant suppression.

Candidats connus:

- second moteur de prechargement dans `GalleryGridActionsIsland`;
- exports sans appelant de `imageUtils.js` apres fusion;
- `observeSeoIntro` si toujours sans appelant;
- attributs/classes `data-cold-scroll-deferred-*`;
- animation `product-card-image-fade-in` devenue inutile;
- classes galerie mortes identifiees par recherche;
- branches media dupliquees;
- quatre representations categorie remplacees;
- options `next/image` sans effet, apres confirmation qu'aucun import n'existe;
- tags de cache sans proprietaire reel;
- commentaires affirmant un comportement ancien.

Ne pas supprimer:

- fallbacks media historiques avant inventaire des produits reels;
- scripts de backfill encore necessaires;
- chemins Storage sur la seule base de `rg`;
- code de checkout ou Auth sans rapport.

### 11.2 Documents canoniques a mettre a jour

`ANNONCES_CATALOGUE.md`:

- plan d'impact;
- etats de publication;
- signal de version;
- contrat Data Access final;
- recette de cloture.

`PERFORMANCE.md`:

- revalidation reellement ciblee;
- ISR unique;
- cache pointeur/release;
- politique galerie/categorie mesuree;
- resultats avant/apres.

`IMAGES_MEDIA.md`:

- composant media canonique;
- placeholder reel;
- priorites par surface;
- warmup partage;
- contrat des medias historiques.

`INTERFACE_NAVIGATION.md`:

- classification `Link`/`a`;
- controle de version apres navigation;
- restauration galerie/categorie.

`QUALITE_TESTS.md`:

- nouveaux contrats dans les trois suites existantes;
- recette cold/warm;
- Data Access du signal.

`map.md`:

- nouveaux modules structurants;
- endpoint `/api/catalog/version`;
- document de signal et rules;
- retrait de la mention `CDN/ETag` si elle n'est plus vraie;
- suppression/renommage des moteurs morts.

### 11.3 Supprimer les documents temporaires a la cloture

Quand toutes les gates sont vertes:

- fusionner les decisions utiles;
- rechercher les liens vers les deux documents;
- supprimer `CATALOGUE_SYNCHRONISATION_SITUATION.md`;
- supprimer `CATALOGUE_SYNCHRONISATION_ROADMAP.md`;
- retirer leur section de `_DOCS/README.md` et du chapitre catalogue;
- verifier les liens;
- conserver le detail dans Git.

### Gate phase 6

- [x] aucun code mort prouve ne subsiste;
- [x] aucun fallback historique supprime sans preuve;
- [x] carte et chapitres correspondent au code;
- [x] aucun document concurrent permanent cree;
- [x] suppression temporaire planifiee mais seulement apres validation finale.

## 12. Phase 7 - Validation locale, sandbox et cloture

### 12.1 Gates locales minimales

```bash
pnpm run lint
pnpm run test:catalog:core
pnpm run test:catalog:resilience
pnpm run test:catalog:security
pnpm run seo:surface
pnpm run next:routes
pnpm run mobile:contract
pnpm run build
```

Si Java manque localement:

- ne pas contourner les Rules;
- lancer les parties Node possibles;
- laisser la CI avec Java executer les emulateurs;
- ne pas declarer la suite securite complete avant son resultat.

### 12.2 Gates performance/images

Apres code stable:

```bash
pnpm run perf:gallery-direct
pnpm run perf:category-direct
pnpm run perf:product-direct
pnpm run perf:product-images
pnpm run perf:budget
```

`perf:budget` reste informatif. Une dette CSS/JS sans lien ne doit pas elargir ce chantier.

### 12.3 CI et Git

- [x] `git diff --check`;
- [x] aucun secret dans le diff;
- [x] aucune donnee sandbox encodee en dur;
- [ ] commits scopes et explicites;
- [x] branche `codex/*`;
- [ ] push sans merge si autorise;
- [ ] CI Node 22/pnpm verte;
- [x] aucune production touchee.

### 12.4 Deploiement sandbox

Seulement avec autorisation explicite valide:

- deployer uniquement les Functions catalogue modifiees;
- creer un rollout du backend App Hosting sandbox;
- verifier revisions et logs;
- conserver la release/rollout precedente pour retour arriere;
- ne pas lire les valeurs de secrets;
- ne pas modifier les roles IAM hors strict besoin approuve;
- retirer tout role temporaire apres recette.

### 12.5 Donnees de recette

Preferer un meuble sandbox existant:

- noter son ID et son etat initial sans publier de valeur sensible;
- modifier puis restaurer prix et stock;
- ne pas supprimer ce meuble;
- ne creer un meuble temporaire que si la preuve de creation/suppression est indispensable;
- supprimer seulement le meuble temporaire et ses donnees de test;
- ne supprimer aucun media reel;
- checkout sans paiement;
- nettoyer uniquement commande/panier non payes crees par la recette.

### 12.6 Data Access

Avec autorisation explicite:

- capturer politique et etag initiaux;
- activer temporairement `DATA_READ` et `DATA_WRITE` uniquement pour Firestore;
- fermer onglets et processus parasites;
- ouvrir une fenetre courte et horodatee;
- effectuer le parcours borne;
- verifier:
  - aucune lecture publique `furniture`;
  - aucun acces `public/meta`;
  - lectures initiales et notifications attendues du seul signal;
  - ecriture signal uniquement backend;
  - lectures/ecritures admin attendues;
  - checkout Firestore attendu;
- restaurer exactement politique et etag initiaux;
- desactiver immediatement l'audit;
- documenter les comptages sans exposer tokens ou donnees personnelles.

## 13. Strategie de rollback de l'implementation

### Avant deploiement

- conserver le dernier commit et rollout sains;
- identifier les Functions touchees;
- verifier que les nouveaux champs de controle sont backward-compatible;
- rendre les lecteurs tolerants aux anciens documents pendant la transition;
- deployer les producteurs avant les consommateurs uniquement si le schema le permet;
- ne jamais necessiter un downgrade destructif de donnees.

### En cas d'echec code

- revenir au rollout App Hosting precedent;
- redeployer les Functions catalogue precedentes si necessaire;
- ne pas modifier les pointeurs manuellement;
- utiliser Maintenance rollback seulement si la release publique est invalide;
- conserver les nouveaux champs Firestore inoffensifs plutot que les purger;
- reconstruire depuis Firestore apres stabilisation.

### En cas d'echec signal

- desactiver l'ile/listener sans toucher au snapshot;
- conserver ISR 300 et invalidation serveur;
- le checkout reste autoritaire;
- ne pas reconnecter la collection `furniture` au public.

### En cas d'echec images/navigation

- le composant media doit toujours rendre un `<img>` natif valide;
- le placeholder ne doit jamais masquer durablement l'image;
- une erreur de warmup ne doit jamais bloquer le clic;
- `Link` doit garder une destination navigable sans JS;
- le cache Storage reste independant du rollout.

## 14. Checklist fonctionnelle finale detaillee

Cette section doit etre executee apres implementation. Chaque case doit recevoir une preuve ou une note d'ecart.

### 14.1 Publication et plan d'impact

- [ ] une modification de prix produit un plan `targeted`;
- [ ] le plan contient l'ID du meuble;
- [ ] le plan conserve l'ancien et le nouveau chemin si le slug change;
- [ ] un prix seul ne marque pas automatiquement le sitemap;
- [ ] stock zero modifie fiche, listes et recherche pertinentes;
- [ ] remise en stock produit le plan inverse correct;
- [ ] changement de categorie contient ancienne feuille, nouvelle feuille et parents;
- [ ] publication ajoute fiche, listes et sitemap selon indexabilite;
- [ ] depubli/suppression conserve l'ancien chemin pour invalidation;
- [ ] ordre editorial seul ne reconstruit pas les fiches sans raison;
- [ ] image remplacee invalide les donnees concernees sans purger l'ancienne URL du cache;
- [ ] planHash est stable sur le meme diff;
- [ ] retry utilise exactement le meme planHash;
- [ ] diff identique change la revision mais pas `aggregateSha256`;
- [ ] diff trop grand bascule explicitement en `full`.

### 14.2 Concurrence et reprise

- [ ] deux modifications rapides restent monotones;
- [ ] un ancien worker ne libere pas le lease du nouveau;
- [ ] un reconciler tardif ne rabaisse jamais `desiredRevision`;
- [ ] rollback actif n'est pas pris pour une panne;
- [ ] rollback expire est repris proprement;
- [ ] build et rollback sont mutuellement exclusifs au CAS;
- [ ] lease est renouvele avant CAS;
- [ ] lease perdu empeche le CAS;
- [ ] CAS refuse laisse previous/LKG intacts;
- [ ] CAS reussi puis panne Firestore est reparable;
- [ ] lecture d'un pointeur utilise une seule generation;
- [ ] corps/metadata discordants sont rejetes;
- [ ] revalidation N ne peut pas marquer N+1 sain;
- [ ] reconciler rejoue le plan persiste, pas un plan recalcule.

### 14.3 Revalidation et sante

- [ ] modification normale n'invalide pas tous les produits;
- [ ] modification normale n'invalide pas toutes les categories;
- [ ] ancienne URL produit invalidee;
- [ ] nouvelle URL produit invalidee;
- [ ] categories parentes invalidees;
- [ ] home/galerie seulement quand necessaire;
- [ ] recherche seulement quand necessaire;
- [ ] sitemap seulement quand necessaire;
- [ ] release immutable jamais invalidee normalement;
- [ ] endpoint refuse une redirection;
- [ ] endpoint refuse un planHash incorrect;
- [ ] endpoint refuse un chemin hors scope;
- [ ] reponse JSON contient les identites attendues;
- [ ] version servie est observee avant etat final sain;
- [ ] erreurs distinguent integrity/source/invalidation/served;
- [ ] Maintenance affiche un resume coherent de ces etats.

### 14.4 Cache et ISR

- [ ] toutes les routes catalogue conservent ISR 300;
- [ ] pointeur lu fraichement lors d'une regeneration;
- [ ] release lue via cache immutable par chemin/hash;
- [ ] aucune double fenetre 300 pointeur + page;
- [ ] API catalogue a un header coherent avec ses consommateurs;
- [ ] ETag inutile retire de `/api/catalog` si decision `no-store`;
- [ ] `/api/catalog/version` retourne 200 a froid;
- [ ] `/api/catalog/version` retourne 304 sur ETag identique;
- [ ] nouvelle version retourne 200 et nouvel ETag;
- [ ] panne de revalidation reste recuperable par ISR/reconciler;
- [ ] aucun polling 30/60 secondes dans le bundle.

### 14.5 Onglets visibles et caches navigateur

- [ ] route catalogue rend sa revision/version dans un attribut stable;
- [ ] onglet visible s'abonne au seul signal;
- [ ] onglet cache se desabonne;
- [ ] retour au premier plan effectue un seul controle de version;
- [ ] `pageshow` apres restauration verifie la version;
- [ ] revision nouvelle mais hash identique ne refresh pas;
- [ ] hash different appelle un seul `router.refresh()`;
- [ ] refresh preserve scroll et etat client non concerne;
- [ ] signal sans rapport ne rafraichit pas inutilement une fiche;
- [ ] signal full rafraichit la route catalogue;
- [ ] navigation vers une route prefetchee ancienne se corrige;
- [ ] perte du signal ne casse ni page ni checkout;
- [ ] aucune donnee produit presente dans le document signal.

### 14.6 Galerie a froid

- [ ] hero reste prioritaire;
- [ ] la premiere zone produit ne bloque pas le LCP du hero;
- [ ] chaque carte reserve son ratio;
- [ ] couleur dominante ou blur visible avant une image froide;
- [ ] aucune grande surface blanche imposee;
- [ ] aucune image `full` chargee dans une carte;
- [ ] seules les variantes adaptees sont demandees;
- [ ] les cartes hors ecran restent lazy;
- [ ] le scroll initial reste fluide;
- [ ] aucune erreur console image/preload;
- [ ] aucun telechargement massif de tout le catalogue.

### 14.7 Galerie chaude et retour de navigation

- [ ] galerie -> categorie utilise Next sans requete document complete;
- [ ] categorie -> galerie utilise Next;
- [ ] produit -> retour galerie restaure correctement la position attendue;
- [ ] image deja vue ne rejoue pas un fade depuis blanc;
- [ ] URL image deja vue indique cache memoire/disque ou zero octet transfere selon navigateur;
- [ ] carte chaude apparait immediatement;
- [ ] caches de warmup ne sont pas detruits par un lien interne classique;
- [ ] aucun flash d'une ancienne page ou d'une autre galerie.

### 14.8 `Petits Prix`

- [ ] `src` present dans le HTML initial;
- [ ] `srcSet` present dans le HTML initial;
- [ ] aucune attente fixe 240 ms;
- [ ] aucune activation sequentielle 92 ms;
- [ ] lazy loading natif actif;
- [ ] image cachee consultable immediatement;
- [ ] placeholder visible pendant un vrai chargement froid;
- [ ] navigation produit beneficie du warmup commun;
- [ ] section vide reste masquee correctement;
- [ ] ordre editorial Petits Prix inchange.

### 14.9 Categories

- [ ] un seul noeud produit par ID;
- [ ] une seule image active par produit;
- [ ] grille mobile fonctionnelle;
- [ ] liste mobile fonctionnelle;
- [ ] grille desktop fonctionnelle;
- [ ] liste desktop fonctionnelle;
- [ ] changement de vue conserve filtres et URL;
- [ ] tri conserve filtres et URL;
- [ ] reset conserve navigation Next/progressive enhancement;
- [ ] premiere rangee visible `eager/high` uniquement;
- [ ] cartes suivantes lazy;
- [ ] `detailFast` chauffe avant clic a proximite;
- [ ] route produit attend hover/focus/press;
- [ ] aucun double telechargement mobile/desktop cache par markup duplique.

### 14.10 Warmup et contraintes reseau

- [ ] un seul moteur de prechargement importe;
- [ ] promesse d'une URL dedupliquee;
- [ ] echec autorise un retry ulterieur;
- [ ] maximum deux warmups simultanes;
- [ ] pression utilisateur passe avant warmup mou;
- [ ] galerie utilise son conteneur de scroll mobile;
- [ ] categorie utilise le viewport document;
- [ ] proximite environ un viewport mesuree;
- [ ] seule `detailFast` est chauffee avant clic;
- [ ] `full/large` attend lightbox/zoom;
- [ ] Save-Data coupe les anticipations;
- [ ] reseau 2G coupe les anticipations;
- [ ] warmup ne bloque jamais la navigation.

### 14.11 Navigation et accessibilite

- [ ] aucun `<a href="/route">` residuel non justifie;
- [ ] liens externes gardent `rel` adapte;
- [ ] `mailto:` et `tel:` restent des ancres;
- [ ] ancres dans la home conservent le bon scroll;
- [ ] focus visible apres navigation clavier;
- [ ] retour arriere coherent;
- [ ] refresh direct de chaque route fonctionne;
- [ ] canonical et metadata inchanges sauf besoin;
- [ ] reduced motion respecte;
- [ ] aucun bouton carte imbrique illegalement dans un lien apres refactor;
- [ ] panier et wishlist restent utilisables.

### 14.12 Commerce

- [ ] prix modifie visible sur la fiche apres publication;
- [ ] checkout utilise le prix Firestore courant;
- [ ] stock zero refuse l'ajout/achat selon le flux existant;
- [ ] meuble supprime/masque refuse au checkout;
- [ ] `priceOnRequest` reste non achetable;
- [ ] aucune confiance accordee au signal ou au snapshot au paiement;
- [ ] checkout sans paiement termine avant toute creation payee;
- [ ] donnees non payees de recette identifiees et nettoyees.

### 14.13 Images lors des mutations

- [ ] prix change: URL image identique;
- [ ] stock change: URL image identique;
- [ ] vendu: URL image identique;
- [ ] categorie change: URL image identique;
- [ ] titre change: URL image identique;
- [ ] remplacement photo: nouvelle URL horodatee;
- [ ] seule nouvelle image est transferee;
- [ ] ancienne image reste en quarantaine, pas supprimee directement;
- [ ] previous/LKG continuent a proteger les medias references;
- [ ] aucun backfill lance sans dry-run.

### 14.14 Data Access et couts

- [ ] fenetre Data Access explicitement autorisee;
- [ ] politique/etag initiaux captures;
- [ ] `DATA_READ` et `DATA_WRITE` seulement;
- [ ] onglets parasites fermes;
- [ ] heure debut/fin notee;
- [ ] zero lecture publique `furniture`;
- [ ] zero acces `public/meta`;
- [ ] initialisation signal conforme au nombre de visiteurs de test;
- [ ] notifications signal conformes au nombre de publications;
- [ ] aucune ecriture signal depuis le navigateur;
- [ ] builder lit Firestore uniquement comme attendu;
- [ ] admin ecrit uniquement le meuble restaure;
- [ ] checkout effectue les lectures metier attendues;
- [ ] politique initiale restauree exactement;
- [ ] audit desactive immediatement;
- [ ] aucun token, OTP ou secret dans le rapport.

### 14.15 Pointeurs et nettoyage sandbox

- [ ] `current` sain et correspond a Firestore restaure;
- [ ] `previous` sain et non transitoire;
- [ ] LKG sain et non transitoire;
- [ ] aucune release test rejetee choisie comme LKG;
- [ ] aucun rollback laisse `preparing`;
- [ ] aucun lease actif orphelin;
- [ ] aucune task de build bloquee;
- [ ] aucun meuble reel supprime;
- [ ] meuble temporaire eventuel supprime;
- [ ] media temporaire eventuel traite selon quarantaine;
- [ ] commande non payee de test nettoyee;
- [ ] aucun paiement effectue.

### 14.16 Documentation et code mort

- [x] `ANNONCES_CATALOGUE.md` correspond au flux reel;
- [x] `PERFORMANCE.md` ne promet plus une intention non testee;
- [x] `IMAGES_MEDIA.md` decrit le composant media reel;
- [x] `INTERFACE_NAVIGATION.md` decrit `Link`/ancres;
- [x] `QUALITE_TESTS.md` contient les gates finales;
- [x] `map.md` contient endpoint version et signal;
- [ ] `_DOCS/README.md` ne conserve aucun lien temporaire apres cloture;
- [x] aucun helper sans appelant conserve sans justification;
- [x] aucune classe CSS morte liee au faux fade;
- [x] aucune configuration `next/image` trompeuse;
- [x] aucun tag de cache decoratif;
- [x] aucun commentaire legacy inexact;
- [x] `rg` ne trouve aucun retour `public/meta`, `publicCatalog`, shadow ou canary executable;
- [ ] les deux documents temporaires sont supprimes apres fusion.

## 15. Gate finale de cloture

La tache ne doit annoncer `termine` que lorsque:

- [ ] tous les tests locaux applicables sont verts;
- [ ] la CI est verte;
- [ ] le sandbox deploye la version attendue;
- [ ] la recette catalogue est complete;
- [ ] les observations cold/warm images sont conformes;
- [ ] Data Access est conforme et desactive;
- [ ] meuble et pointeurs sont restaures;
- [ ] aucun paiement ni production;
- [ ] documentation canonique fusionnee;
- [ ] documents temporaires supprimes;
- [ ] worktree propre;
- [ ] commit et push effectues seulement si autorises;
- [ ] compte rendu final distingue code, tests, cloud, donnees et dette concrete.

Format de compte rendu final:

```text
Resultat
Architecture/code modifies
Suppressions justifiees
Tests locaux
CI
Deploiement sandbox
Recette navigateur
Data Access
Donnees modifiees et restauration
Pointeurs finaux
Documentation fusionnee
Dette restante, uniquement si prouvee
```
