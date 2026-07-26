# Qualite, tests et gates

Derniere mise a jour: 2026-07-26
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
2. lint;
3. suites catalogue coeur, resilience et Rules Emulator;
4. contrat SEO public;
5. build Next;
6. classification des routes;
7. budget performance en rapport non bloquant.

Une CI verte ne remplace pas les E2E Firebase/Stripe ni une recette visuelle.

### 2.1 Restriction noyau commerce

Il n'existe actuellement:

- aucun script `test:commerce:*`;
- aucune suite comportementale locale pour create/order/webhook/cancel/cleanup/refund;
- aucune suite Rules Emulator sur les commandes et champs de vente admin;
- aucune gate commerce dans la CI;
- aucun lint de `functions/**` ou `scripts/**`, ces chemins etant ignores.

Les scripts actuels `e2e:hosted-stripe` et `e2e:refund-stripe` sont en
quarantaine `DO_NOT_RUN`: le premier peut sortir vert sur preuve incomplete et
le second peut cibler la derniere commande. Ils ne redeviennent executables
qu'apres remplacement fail-closed, `runId/orderId` explicites, fixture dediee,
region correcte, AAL2/App Check et zero fallback.

Gate 0A de [NOYAU_COMMERCE_STABILISATION.md](../commerce/NOYAU_COMMERCE_STABILISATION.md)
cree d'abord `test:commerce:runner`, `test:commerce:containment`,
`test:commerce:rules:containment`,
`test:commerce` et `lint:functions`, avec un self-test qui prouve l'exit non nul.
Gate 1 ajoute ensuite `test:commerce:unit`, `test:commerce:property`,
`test:commerce:firebase`, `test:commerce:rules` et
`test:commerce:faults`. Toutes deviennent bloquantes avant une activation.

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
| infra | `infra:env`, `infra:deploy`, `appcheck:audit` en lecture |

## 5. Gates publiques

```bash
npm run lint
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
`test:commerce:rules` sous Emulator Suite.

Le wrapper commerce unique utilise
`firebase emulators:exec --project demo-secondevie-commerce --only firestore`
(ajouter Auth seulement si le scenario l'exige), fixe les ports, refuse tout
credential/projet reel et lance integration, faults et Rules dans la meme
session.

L'emulateur ne prouve pas a lui seul:

- la contention et les limites Firestore hebergees;
- que les indexes sont deployes;
- IAM, App Check reel, regions ou secrets;
- Stripe/Connect, la livraison de webhooks ou le provider e-mail reel.

Ces limites sont couvertes separement: regions/config Stripe par Gate 7B,
outbox/provider e-mail par Gate 7A puis recette Gate 8, et reconciliation sur
le release final. Gmail post-acceptation reste `delivery_unknown`, jamais une
preuve exactly-once. Elles ne doivent pas etre masquees par un test local vert.

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
