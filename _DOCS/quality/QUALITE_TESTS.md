# Qualite, tests et gates

Derniere mise a jour: 2026-07-28
Statut: `REFERENCE_ACTIVE`

## 1. Principe de proportion

La validation depend du risque et de la demande:

- correctif cible: verification locale minimale, pas de build/navigateur automatique sans demande;
- changement structurel: lint/test cible/build selon impact;
- audit ou preuve: gates completes et resultats reproductibles;
- ecriture cloud: sandbox explicite, scope cible, preuve et nettoyage;
- production: plan de recette et rollback approuves.

Toujours annoncer ce qui a ete lance et ce qui ne l'a pas ete.

## 2. CI

`.github/workflows/quality.yml` s'execute sur pull request et push `main` avec Node 22/pnpm:

1. installation frozen lockfile;
2. lint application puis `lint:functions`;
3. agregat bloquant `test:commerce`;
4. suites catalogue coeur, resilience et Rules Emulator;
5. tests Auth;
6. contrat de coherence des versions de deploiement et du cache ISR;
7. contrat SEO public;
8. build Next;
9. classification des routes;
10. budget performance en rapport non bloquant.

Une CI verte ne remplace pas les E2E Firebase/Stripe ni une recette visuelle.

### 2.1 Restriction noyau commerce

Etat `CODE_READY`:

- `lint:functions` couvre commerce, e-mail, maintenance et le harnais;
- `test:commerce:runner` prouve les sorties rouges, timeouts, statuts interdits
  et manifests incomplets;
- `test:commerce:containment` compte les effets et prouve le hard-stop Gate 0B;
- `test:commerce:rules:containment` utilise Firestore + Storage Emulator;
- `test:commerce:unit` valide schema, reducer, projections, compatibilite,
  actions serveur et retours quantitatifs;
- `test:commerce:ui` valide les transports/consommateurs Gates 4 et 5, le
  contrat checkout sans prix client, l'identite Auth serveur et l'absence de
  writer SDK sur les surfaces v2;
- `test:commerce:browser` exerce localement sous Chromium la reprise
  namespacee, le reload et les conflits `cartLineId/cartRevision` multi-onglet;
- `test:commerce:property` genere algebre monetaire, cycles Stripe non
  terminaux et permutations de payload sans reseau;
- `test:commerce:faults` prouve idempotence, ordre lookup/version, saga,
  annulation provider-first, scopes webhook, reprise des workers et refund
  accepte avec reponse perdue;
- `test:commerce:firebase` valide atomicite/rollback sur Firestore Emulator,
  dont create/attach PI, inbox, capture + mouvement + fait + outbox et token
  guest mono-usage, commandes auditees, refunds cumules sans restock et
  retours/dispositions concurrents;
- `test:commerce:rules` ferme explicitement sous-collections et collections v2;
- `commerce:legacy:classify` produit le manifeste Gate 6 read-only avec
  pagination, checkpoint, hashes et relecture Stripe;
- `commerce:fixtures:prepare` exige cible sandbox, manifeste de classification,
  sauvegarde et confirmation avant toute creation additive;
- `commerce:release:manifest` construit et verifie le manifeste immutable du
  release Gate 7A;
- `commerce:fixture:activate` refuse toute cible non sandbox et active
  atomiquement le seul scope fixture epingle;
- `test:commerce` agrege toutes les suites et bloque la CI.

Les scripts actuels `e2e:hosted-stripe` et `e2e:refund-stripe` sont en
quarantaine `DO_NOT_RUN`: le premier peut sortir vert sur preuve incomplete et
le second peut cibler la derniere commande. Ils ne redeviennent executables
qu'apres remplacement fail-closed, `runId/orderId` explicites, fixture dediee,
region correcte, AAL2/App Check et zero fallback.

La stabilisation du noyau commerce a cree `test:commerce:runner`,
`test:commerce:containment`,
`test:commerce:rules:containment`, `test:commerce` et `lint:functions`, avec un
self-test qui prouve l'exit non nul. Gate 0B etend les scenarios de confinement.
Gate 1 ajoute `test:commerce:unit`, `test:commerce:property`,
`test:commerce:firebase`, `test:commerce:rules` et
`test:commerce:faults`. Elles sont vertes, bloquantes dans l'agregat et ont
precede l'activation sandbox read-only.

## 3. Tests automatises Auth

```bash
npm run test:auth
```

Suite actuelle:

```text
auth-claims.test.cjs
auth-store-contract.test.cjs
auth-unified-otp-contract.test.cjs
auth-backend-transitions.test.cjs
auth-admin-revocation.test.cjs
auth-assurance.test.cjs
auth-region-convergence.test.cjs
auth-email-provider-adapter.test.cjs
passkey-portability-contract.test.cjs
passkey-server-hardening.test.cjs
```

Les contrats testent la source de session, les transitions OTP, l'idempotence, la revocation, AAL2, les regions, l'adaptateur e-mail et WebAuthn.

Le contrat analytics importe le verificateur du moteur Tous a Table et controle la deduplication UID/IP, les fenetres temporelles, la coherence KPI/courbe/groupes, le masquage IP et le jeton de reprise:

```bash
npm run test:analytics
```

Le contrat du guide de facturation controle les modes fermes, les UID cibles, le bypass super-admin, le format Billing et l'ordre des etapes:

```bash
npm run test:billing-onboarding
```

Ce test ne simule aucune API Cloud Billing car le guide n'en appelle aucune. La recette reelle porte sur l'ergonomie de la console Google et utilise uniquement l'identite/compte Billing de test approuves; elle ne doit jamais rattacher implicitement le vrai sandbox ou une future production.

Les anciennes gates de micro-cache `public/meta` ont ete retirees avec `publicCatalog`. Les couts catalogue se prouvent par la suite securite, une recette navigateur bornee et, uniquement sur demande explicite, une fenetre Data Access temporaire.

## 4. Matrice par domaine

| Domaine touche | Gates recommandees |
| --- | --- |
| documentation seulement | liens locaux, references, `git diff --check` |
| route/SEO publique | `seo:surface`, `next:routes`, build, gate direct route |
| galerie | `mobile:contract`; toute investigation de performance repart du symptome et du code actuel |
| categorie | `perf:category-direct`, SEO |
| produit/images | `perf:product-direct`, `perf:product-images`, audit images selon scope |
| A propos | `perf:about-direct` |
| devis | `perf:quote-direct` |
| menu/header | `perf:menu-desktop`, `perf:menu-mobile`, `mobile:contract` |
| Auth | `test:auth`, build, smoke reel selon changement |
| checkout/Stripe | toutes les gates transitives 0A a 7B; hosted final seulement en 7B apres projections 7A |
| remboursement | toutes les gates transitives; domaine en 4, projections 7A, hosted final 7B |
| catalogue coeur | `test:catalog:core` |
| catalogue resilience | `test:catalog:resilience` |
| catalogue securite/Rules | `test:catalog:security` |
| catalogue materialise | `test:catalog`, recette navigateur sandbox et Data Access seulement si explicitement demande |
| Functions/rules | tests cibles, audit exports/rules, deploiement sandbox cible |
| guide facturation | `test:billing-onboarding`, lint cible, reprise de progression, smoke compte test/super-admin uniquement sur demande |
| couts Firestore | `test:analytics`, mesure Usage Insights/Data Access avant-apres si necessaire |
| infra | `test:deployment-cache`, `infra:env`, `infra:deploy`, `appcheck:audit` en lecture |

## 5. Gates publiques

```bash
npm run lint
npm run test:deployment-cache
npm run build
npm run seo:surface
npm run seo:check
npm run next:routes
npm run mobile:contract
npm run perf:budget
```

`seo:check` et plusieurs audits navigateur peuvent exiger un serveur ou l'URL sandbox. Lire le script avant execution.

## 6. Playwright et smoke

`tests/smoke.spec.mjs` et `playwright.config.mjs` couvrent les parcours de base. Pour une recette manuelle, verifier au minimum:

- rendu direct de la route sans flash d'une autre page;
- navigation clavier et focus des overlays touches;
- mobile et desktop du composant touche;
- erreurs console/reseau pertinentes;
- retour arriere et refresh;
- etat froid puis chaud si le probleme concernait la performance.

Windows Hello, Face ID, Touch ID, selecteur de compte Google et certains wallets requierent une intervention humaine sur l'appareil. Le test peut etre orchestre par l'agent, mais le secret/PIN reste saisi par l'utilisateur.

## 7. Tests cloud

Avant un E2E:

- confirmer le projet et l'URL;
- refuser production par defaut;
- utiliser un compte test;
- ne jamais afficher OTP, mot de passe, token ou cle;
- identifier les donnees creees;
- verifier le resultat dans Firestore/Stripe/logs;
- nettoyer uniquement ce que le test a cree;
- conserver une preuve redigee.

## 8. Tests de rules

Une modification `firestore.rules` ou `storage.rules` doit avoir au moins des cas:

- visiteur;
- utilisateur proprietaire;
- autre utilisateur;
- admin claim sans registre;
- admin registre sans assurance forte;
- admin fort;
- token revoque/expiré si le scenario le permet;
- schema valide et schema malforme.

La passe Auth de demonstration deja close n'impose pas de rouvrir toutes ses
preuves historiques. En revanche, toute nouvelle Rule commerce, reservation,
sous-collection commande ou champ inventaire doit etre couverte par
`test:commerce:rules:containment` en Gate 0B, puis
`test:commerce:rules` sous Emulator Suite a partir de Gate 1.

Le wrapper commerce unique utilise
`firebase emulators:exec --project demo-secondevie-commerce`: Firestore +
Storage pour le confinement Gate 0B, Firestore seul pour integration et Rules
Gate 1. Il fixe les ports, refuse tout credential/projet reel et n'autorise que
les suites manifestees. Les tests unit/property/faults utilisent un garde
reseau qui refuse meme les connexions locales.

La couverture Gate 4 ajoute les commandes fulfillment/annulation, les refunds
reprenables, les retours quantitatifs et le rail produit. Le scenario produit
Firestore exerce un double create concurrent, l'offre, l'ajustement de stock,
la publication, le retry acquitte avant version obsolete, l'archive douce et
un audit append-only par commande.

Le transport callable fulfillment/archive commande est couvert dans
`test:commerce:unit`: acteur derive du contexte Auth, autorisation avant acces
repository, App Check exige, export present et garde controle fail-closed.
Le transport d'annulation client ajoute les preuves de session obligatoire,
proprietaire derive du contexte Auth, payload acteur ignore, validation avant
runtime, App Check/secret Stripe, export present et runtime minimal
provider-first verrouille.
Le transport refund admin couvre admin fort derive du contexte Auth, montant
entier en centimes, validation avant runtime, App Check/secret Stripe et runtime
minimal verrouille. `test:commerce:faults` conserve les preuves de reponse
Stripe perdue, cumul exact, compte Connect historique et zero restock.
Les transports retour admin couvrent acteur Auth/AAL2 serveur, commandes
d'evenement fermees, quantites et versions validees avant runtime, refus des
lignes inconnues, App Check, runtime retour minimal, exports presents et
controle mutations `off`.

Gate 5 ajoute les preuves create/resume checkout lies a l'UID Auth, validation
avant runtime, runtime minimal, lecteurs UID/admin pagines, `allowedActions`
retour quantitatives, contrat navigateur sans prix, reprise sans secret,
nettoyage exact des revisions et absence des anciens writers sur le chemin v2.

Au point d'arret Gate 7A du 2026-07-28, `lint:functions`, le lint UI cible (zero
erreur), `test:commerce:runner` (13/13), `test:commerce:containment` (12/12,
217 assertions), `test:commerce:unit` (81/81), `test:commerce:ui` (11/11),
`test:commerce:browser` (4/4), `test:commerce:property` (3/3),
`test:commerce:faults` (33/33) et le build Next sont verts. Temurin Java
21.0.11 a ete installe dans le cache utilisateur puis toutes les suites
Emulator ont ete rejouees: confinement Rules 10/10, Firestore 15/15 avec
69 assertions et Rules v2 5/5. L'agregat `test:commerce` complet est vert.

Preuves sandbox du meme jour: indexes commerce `READY`, exports Gate 7A
presents en `europe-west1`, anciens doublons mutateurs `us-central1` absents,
callables sans Auth/App Check refuses `401`, webhook non signe refuse `400`,
Rules Firestore/Storage publiees et rollout App Hosting qualifiant
`build-2026-07-28-009` `SUCCEEDED`. La recette authentifiee hebergee valide
aussi la session client OTP et `listMyOrdersV2`, puis une session admin forte
sur les lecteurs `Ventes`/`Retours`; `Livraison` et `Paiement` restent
read-only. Aucun writer ni parcours Stripe n'a ete active pendant ces smokes.

Gate 6 ajoute 9 tests de classification, adoption delta stock zero, scope
fixture, refus de cible et confirmation d'ecriture. Le classificateur sandbox a
ete rejoue deux fois avec le meme digest: 26 commandes legacy classees, 10 non
terminales, zero non-classee et aucune candidate d'adoption. La preparation
fixture a prouve le compte Stripe test, sauvegarde les cibles, cree un UID
technique et sept documents backend-only, puis verifie
`newCheckoutMode=off`, zero commande/stock client touche et exclusion des
fixtures du catalogue public.

Gate 7A ajoute les tests de projection financiere, documents sandbox,
outbox/reconciliation, sante operations, cleanup run-scoped et frontieres
fixture. Gate 7B ajoute `commerce:e2e:gate7b`, fail-closed sur projet,
environnement, release, confirmation, Auth/App Check et scope. Le manifeste
`release_gate7a_c5259a87f875_f00378380561` est active a revision 7 avec
`newCheckoutMode=v2_fixture`; les runs 1 et 2 ont chacun passe 11 scenarios
sur le SHA `c5259a8`. Le statut operations est `healthy`, tous les compteurs
de divergence sont a zero et le catalogue public n'expose aucune fixture.

L'emulateur ne prouve pas a lui seul:

- la contention et les limites Firestore hebergees;
- que les indexes sont deployes;
- IAM, App Check reel, regions ou secrets;
- Stripe/Connect, la livraison de webhooks ou le provider e-mail reel.

Ces limites sont couvertes separement: l'outbox et la reconciliation sont
couvertes en Gate 7A; regions, Stripe/Connect, 3DS et provider e-mail reel
ont ete valides par Gate 7B puis observes humainement en Gate 8. Cette recette
a couvert carte acceptee, refus/retry, 3DS, reprise, annulation, concurrence
stock, mutations admin autorisees/interdites, refund, retour/restock, policy,
e-mails, documents et cleanup. Le rapprochement final est sans divergence,
les operations sont `healthy` et tous les compteurs sont a zero. Gmail
post-acceptation reste
`delivery_unknown`, jamais une preuve exactly-once. Elles ne doivent pas etre
masquees par un test local vert.

## 9. Definition de done

Un changement est termine quand:

- le besoin utilisateur est satisfait;
- les invariants du chapitre concerne sont preserves;
- les gates proportionnees passent;
- les erreurs et etats vides sont geres;
- les donnees de test sont identifiees;
- la documentation canonique et `map.md` sont mises a jour si l'architecture change;
- aucune dette non formulee n'est cachee dans un nouveau rapport;
- le compte rendu distingue code, validation et deploiement.

## 10. Validation documentaire

Pour une restructuration comme celle-ci:

```powershell
rg --files -g "*.md"
rg -n "ancien-nom\.md" .
git diff --check
git status --short
```

Verifier egalement que chaque chemin entre backticks dans `AGENTS.md`, `map.md` et `_DOCS/README.md` existe ou est clairement presente comme un futur chemin.

## 11. Gates du catalogue materialise

```bash
npm run test:catalog:core
npm run test:catalog:resilience
npm run test:catalog:security
```

Couverture locale actuelle:

- `core`: diff prix/stock/vente/remise en vente/titre/categorie/publication/suppression/image/ordre, ancien et nouveau slug, parents, determinisme, bornes `full`, parite des routes et hash du plan dans le manifeste;
- `resilience`: CAS et fallbacks, publication partielle et reprise `pointer_committed_control_pending`, reconciliations concurrentes, rollback vivant/expire/high-water, `stateVersion`/lease/fence, lecture Storage epinglee et retry de generation, GC releases/medias;
- `security` partie Node: HMAC corps exact/timestamp, projet/audience, plan strict, redirection/JSON incoherent, version N contre N+1, preuve HTML servie, endpoint version 200/304, contrats images/navigation/signal;
- `security` partie emulateurs: interdiction de lire `furniture`/`public/meta`, controle backend des etats et ecriture client refusee sur `sys_catalog_live/current`. Java reste requis pour executer cette partie.

Les gates `next:routes` et `mobile:contract` protegent en plus ISR/SSG et le shell mobile. La recette cold/warm, la mesure des telechargements et le comportement `router.refresh()` restent des preuves navigateur sandbox et ne doivent pas etre declares par les tests statiques.

La recette catalogue complete se fait dans le navigateur sandbox. Le rollback reel est exclusivement expose par Maintenance admin et exige App Check, registre actif, authentification forte recente et revisions explicites.

La recette de cutover du 2026-07-18 a inclus plus de 20 builds de comparaison alors necessaires, creation, prix, stock nul, suppression, publication/revalidation, API same-origin froide/chaude et checkout sans paiement. Ces anciens modes ne sont plus des gates actives: le moteur public unique est le snapshot Storage. Le checkout reste autoritaire sur Firestore, meme si le snapshot est en retard. Le contrat actuel `/api/catalog` est non persistant; seul `/api/catalog/version` utilise un ETag public.

Data Access est une preuve separee: fenetre courte, onglets parasites fermes, configuration avant/apres capturee et desactivation immediate. Ne jamais l'activer implicitement pour lancer les suites locales.
Le build CI utilise `CATALOG_BUILD_FIXTURE=true` avec une fixture publique minimale versionnee. Cette option est limitee au workflow de qualite: elle permet de compiler sans identifiants Google et ne doit jamais etre configuree dans App Hosting ou dans un environnement deploye.

Cloture du chantier catalogue le 2026-07-19:

- Node `22.23.1`, pnpm `11.7.0` et Temurin Java 21: `core` 7/7, `resilience` 17/17, `security` Node 10/10 et Rules Emulator 5/5;
- lint: 0 erreur et 259 avertissements historiques; build fixture, `seo:surface`, `next:routes`, `mobile:contract` et `git diff --check` reussis;
- CI `Next quality gates` verte sur `6134386`;
- sandbox: probes routes/API et ETag 304 reussis;
- recette navigateur: galerie 20 produits uniques, fiche sans galerie parasite avec image initiale adaptee, retour Next, categorie Buffets 18 cartes uniques sans image cassee;
- Data Access: preuve catalogue du 2026-07-19 conforme, meuble existant et pointeurs restaures, aucune commande ni paiement, audit desactive avec `auditConfigs: null`.
