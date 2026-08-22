# Qualite, tests et gates

Derniere mise a jour: 2026-08-12
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

1. installation frozen lockfile, dependances Functions, Chromium Playwright et
   runtimes locaux des emulateurs Firestore/Storage;
2. gate `security:audit`: contrats statiques, hygiene env et audits de toutes
   les dependances racine/production Functions au seuil modere;
3. lint application puis `lint:functions`, strict sur `functions/index.js`,
   tous les helpers et tous les domaines `functions/src`;
4. agregat bloquant `test:commerce`;
5. suites catalogue coeur, resilience et Rules Emulator;
6. tests Auth;
7. devis, newsletter, analytics, retention, onboarding facturation, factures
   manuelles, cache admin et Meta OAuth;
8. audit de l'initialisation App Check cote navigateur;
9. contrat de coherence des versions de deploiement et du cache ISR;
10. contrat SEO public;
11. build Next;
12. scan du build contre les valeurs sensibles locales et les source maps
    publiques avec `security:audit:bundle`;
13. classification des routes;
14. budget performance en rapport non bloquant.

Une CI verte ne remplace pas les E2E Firebase/Stripe ni une recette visuelle.
Chromium est installe explicitement avant `test:commerce`, dont quatre contrats
navigateur Playwright sont bloquants; un runner GitHub vierge ne fournit pas ce
binaire par l'installation npm seule. Firestore et Storage sont eux aussi
precharges explicitement: le harnais commerce refuse volontairement de
telecharger un JAR pendant un test et continue d'exiger un projet `demo-*` sans
credential cloud.

Le contrat statique de securite parcourt tous les fichiers JavaScript sous
`functions/src`, decouvre chaque transport `.https.onCall` et exige
`enforceAppCheck: true` sur son runtime direct ou partage. Ce controle est
exhaustif pour les callables et ne remplace pas la verification separee des
routes HTTP, signatures webhook et exceptions documentees comme `sendBeacon`.
La meme gate execute `tests/security-client-ip.test.cjs`: priorite a l'IP du
runtime, refus des valeurs malformees et canonicalisation IPv4/IPv6 pour les
limites OTP, passkeys, devis et newsletter.
`tests/security-output-encoding.test.cjs` verifie les sorties e-mail, JSON-LD,
admin, PDF et OAuth qui pourraient transformer une donnee stockee en markup,
ainsi que l'absence de message d'erreur provider brut dans les reponses
`HttpsError('internal')`.

### 2.2 Garde Functions Gen1 -> Gen2

```bash
npm run test:functions-g0
```

Cette suite verrouille l'inventaire G0 a 157 exports/152 cibles cloud, les
classifications par nom, les 13 Gen2, 8 schedulers, 2 queues et 7 triggers
Eventarc. Elle interdit un nouveau trigger Auth Gen1 hors
`grantAdminOnAuth`, `onRegisteredUserCreated` et
`onRegisteredUserDeleted`, ainsi que tout retour de `functions.config()`.
Elle prouve aussi que le wrapper de deploiement refuse projet/codebase/commit/
digest incoherents, allowlist vide ou superieure a dix, cible inconnue, cinq
Instagram sous hold et lot multiple finance/webhook/scheduler. Aucun test de
cette suite n'appelle Firebase, Stripe ou un deploy.

Depuis le 2026-08-17, la meme commande inclut le contrat Monitoring G1: les
deux signaux commerce ne peuvent pas compter les logs internes `Violation*`,
les alertes `LogMatch` sont limitees a une notification par heure avec
auto-close six heures, les huit policies portent une severite et Pub/Sub reste
le canal secondaire par defaut. Ce test reste local et sans ecriture cloud.

La gate `test:functions-g4` couvre aussi la preparation locale de
`updateUserSessionsGen2`: handler partage avec la Gen1, limites runtime, App
Check, compte dedie et cible unique du wrapper. Apres le deploy, elle exige la
revision cloud attendue et la preservation de la Gen1. Apres rollback d'une
gate Auth, elle exige aussi le registre client Gen1 et la preuve du build exact.
La suite locale ne contacte pas le cloud.

G8 est ferme par `npm run test:functions-g8`: les tests Node et les cinq
controles Firestore rules couvrent les 37 wrappers commerce,
le registre client et les contrats unit/property/fault directement touches.
`npm run functions:prove-commerce:g8` utilise une fixture sandbox unique,
ephemere et reversible pour les lecteurs, versions, fulfillment, retours,
restock et write-off; toute outbox marquee par son `testContext` est neutralisee
avant le provider. Le succes du harnais n'est emis qu'apres cleanup exhaustif,
retries bornes et verification d'absence des racines, mouvements et outboxes.
La gate verifie aussi le recalcul des 251 exports locaux/246 cibles cloud et la
liaison exacte archive URI/SHA-256/generation/taille au manifeste approuve. Le
lint Functions a ete execute une fois. La quiet-window finale compte zero
erreur Gen2 et zero entree Gen1 correspondante.

G9 ajoute `npm run test:functions-g9`: 100 tests Node et 5 controles Rules
sont verts apres une correction locale bornee de l'extracteur, puis
`lint:functions` a passe une seule fois. Les 24 revisions cloud sont ACTIVE et
la probe sans paiement des trois lecteurs Gen2 passe avec Auth/App Check. Les
quatre schedulers ont passe double invocation et rollback inverse. La gate 7B
n'a pas ete lancee car son preflight `v2_fixture/read_only` ne correspond pas
au sandbox `v2_all/v2`. Le build App Hosting `build-2026-08-22-001`, son
rollback exact vers `build-2026-08-19-005`, sa reactivation et la quiet-window
finale ferment G9. Les suites interdites n'ont pas ete executees.

G10 ajoute `npm run test:functions-g10`: 39 tests couvrent le corps brut, le
refus de signature, les secrets de transition, l'inbox et la deduplication. La
suite est verte apres la correction bornee du constat Gen1/Gen2; le lint
Functions a passe une seule fois. Les deux refus non signes cloud retournent
400. Le replay Connect identique retourne deux fois 200 pour une seule tentative
inbox `processed`, commande inchangee; Platform utilise un replay signe non
mutateur faute de PaymentIntent v2 Platform sur le sandbox. La quiet-window de
330 secondes compte zero erreur et zero inbox bloquee. Aucun script
`e2e:hosted-stripe`, `e2e:refund-stripe` ou `commerce:e2e:gate7b` n'a ete lance.

La gate G5 courante est bornee a `npm run test:functions-g5`, `npm run
test:auth`, l'audit App Check et `npm run lint:functions`. G5-A1 a G5-A3 sont
fermees: `test:functions-g5` porte 10/10 contrats, dont le harnais Auth/App Check et le
manifeste de rollout; les gates precedentes Auth 77/77, App Check et lint
restent valides. Le rollout `005` a prouve ancien onglet, `/` et `/admin` 200,
appel admin Gen2 200 avec compteur 34, donnees inchangees, zero erreur Gen2 et
zero nouvel appel Gen1. Le rollout G5-A2 `001` a ensuite prouve ancien onglet
`005`, routes 200, appel `logUserConnectionGen2` 200, ecriture attendue, zero
erreur et zero nouvel appel Gen1. Le rollout G5-A3 `002` prouve aussi ancien
onglet `001`, appel registre Gen2 200, `migrated:false`, document inchange,
zero erreur et zero appel Gen1. Le Custom Token et le jeton App Check de recette sont
crees et injectes uniquement en memoire; ils ne doivent jamais entrer dans les
preuves ou les logs.

Pour G1, `npm run functions:audit:g1` et
`npm run functions:data-plan:g1` sont des lectures sandbox fail-closed sur le
projet exact. Le second produit le plan des `inventoryVersion` et les
comptages/hashes analytics sans payload. Les contrats de faux vert et de runs
workers incomplets sont couverts par `gate7a-operations.test.cjs` et
`gate3-workers.test.cjs`. Ces preuves locales n'autorisent pas un deploy avant
backup `READY`, restore drill et canaux Monitoring redondants testes.

`npm run functions:prove-reservation-expiry:g1 -- --commit=<HEAD>` est
read-only par defaut. Son mode `--apply` exige la confirmation litterale
`G1_RESERVATION_EXPIRY_STRIPE_TEST_ONLY_NO_REFUND_NO_RESTOCK`, le projet et les
credentials sandbox exacts, une sante fraiche sans incident, la Function v3
sur son compte runtime dedie et Stripe test. Il ne touche qu'une fixture
`e2eOnly`, exige annulation fournisseur avant liberation et rejoue le
scheduler pour prouver le mouvement unique. Il interdit refund, restock,
suppression et toute cle live. Son contrat statique fait partie de
`test:functions-g0`.

Pour G2-A stats, `npm run test:functions-g2a` couvre creation, replay,
transition, changement de jour, suppression, exclusion v2, baseline legacy
manquante, options runtime et confinement du ledger. `npm run
functions:plan-stats:g2a -- --report=apphostingaudit/manifests/functions-gen2-g2a-stats.json`
recompte en lecture seule les commandes legacy, le dashboard, les rollups
journaliers et les ledgers; il refuse tout `--apply` et laisse
`deploymentAllowed: false` tant que le bootstrap n'est pas approuve et prouve.
Le lot G2-B stats utilise `functions:bootstrap-stats:g2b` avec digest manifeste,
commit et approbation litterale, puis `functions:configure-stats-iam:g2b` pour
les trois identites sans cle. `test:functions-g0` couvre le transport gcloud
Gen2 cible et son rollback; `test:functions-g2a` couvre le bootstrap
transactionnel, ses preconditions et l'absence d'ecriture hors ledger.
Pour G2-B catalogue, `functions:plan-catalog:g2b` reste read-only et refuse
controle dirty, lease, build non stable, erreur courante ou revision historique
non supersedee. Les tests G2-A/G2-B imposent une cle semantique basee sur
`updateTime` et interdisent le retour a un ledger indexe seulement par
`event.id`.
Pour le scheduler catalogue, `functions:plan-catalog-reconciler:g2b` verifie en
lecture seule controle, trois pointeurs, Function HTTP et job OIDC. La commande
`functions:configure-catalog-reconciler-iam:g2b` exige commit, operateur et
approbation litterale avant d'ajouter uniquement Service Usage Consumer et
ActAs au runtime `catalog-builder`. `test:functions-g0` verrouille le transport
HTTP Scheduler et son rollback; `test:functions-g2a` couvre la reprise bornee
des conflits `RECONCILE_STATE_ADVANCED`.
La meme suite interdit au scheduler GC d'appeler le nettoyage des releases
avec `commit: true`: medias et releases doivent recevoir le booleen derive de
`CATALOG_MEDIA_GC_COMMIT === 'true'`, et les compteurs de dry-run/suppression
doivent rester observables dans les logs structures.

`npm run functions:restore-verify:g1` compare la base nommee au snapshot PITR
exact et produit uniquement comptages/digests; `npm run
functions:cross-service-verify:g1` inventorie Auth, Storage, etats de versions
de secrets et routage sans valeur de secret ni identite utilisateur. Ces deux
scripts sont read-only et refusent toute autre cible.

`test:retention` verrouille le dry-run par defaut, l'inventaire des collections
techniques, les expirations `expireAt`/`expiresAt`, la minimisation des acteurs
d'audit et l'expiration des sessions. Les emulateurs de confinement couvrent
aussi l'UID de commande contre une collision d'e-mail, le profil utilisateur
backend-only, le schema wishlist et les collections d'audit privees.

Le contrat OAuth social est couvert par
`node --test tests/meta-oauth-contract.test.cjs`: state anti-rejeu,
chiffrement authentifie, projection sans secret, normalisation medias/legende,
destinations et idempotence. Une connexion ou
une publication reelle reste une gate externe sandbox et ne doit jamais etre
declenchee automatiquement par cette suite.

### 2.1 Restriction noyau commerce

Etat `CODE_READY`:

- `lint:functions` couvre strictement `functions/index.js`, tous les helpers,
  tous les domaines Functions, les adaptateurs commerce client et le harnais;
- `test:commerce:runner` prouve les sorties rouges, timeouts, statuts interdits
  et manifests incomplets;
- `test:commerce:containment` compte les effets et prouve le hard-stop Gate 0B;
- `test:commerce:rules:containment` utilise Firestore + Storage Emulator;
- `test:commerce:unit` valide schema, reducer, projections, compatibilite,
  actions serveur, retours quantitatifs, versionnement immutable des tarifs de
  livraison et separation entre demande client,
  retour physique et remboursement Stripe; il couvre aussi les segments,
  priorites et actions de la presentation Ventes, notamment la suspension du
  fulfillment pendant un remboursement en attente ou complet; il couvre aussi signature opaque,
  rotation, bornes d'expiration et statuts des liens admin sans compte;
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

Suite actuelle (dont la reprise OTP apres erreur transitoire, les lookups Auth
admin fail-closed, le prechargement Google fail-closed, le diagnostic transport
borne et l'equivalence AAL2 Google ou passkey pour les mutations
administrateur):

```text
auth-claims.test.cjs
auth-store-contract.test.cjs
auth-custom-token-sign-in.test.mjs
auth-google-diagnostics.test.mjs
auth-unified-otp-contract.test.cjs
auth-backend-transitions.test.cjs
auth-admin-revocation.test.cjs
auth-assurance.test.cjs
auth-region-convergence.test.cjs
auth-email-provider-adapter.test.cjs
passkey-portability-contract.test.cjs
passkey-server-hardening.test.cjs
```

Les contrats testent la source de session, les transitions OTP, l'idempotence,
la revocation, le registre actif, l'absence de minuterie admin, les diagnostics
sans donnee brute, les regions, l'adaptateur e-mail et WebAuthn.

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
| réception devis + admin | `test:quotes`, lint cible, build; envoi Gmail réel uniquement sur demande explicite; contrôle hébergé admin avec `node scripts/with-env.mjs .env.sandbox node scripts/e2e-sandbox-role-session.mjs --role=admin --expect-quote=<reference>` |
| newsletter + avantages client | `test:newsletter`, lint cible, build; recette Gmail et espace client uniquement sur demande explicite |
| codes promo checkout/admin | `test:commerce:unit`, `test:commerce:firebase`, `test:commerce:rules`, lint, build; creation admin et application Stripe test sur sandbox uniquement sur demande explicite |
| menu/header | `perf:menu-desktop`, `perf:menu-mobile`, `mobile:contract` |
| Auth | `test:auth`, build, smoke reel selon changement |
| checkout/Stripe | toutes les gates transitives 0A a 7B; hosted final seulement en 7B apres projections 7A |
| remboursement | toutes les gates transitives; domaine en 4, projections 7A, hosted final 7B |
| catalogue coeur/publication | `test:catalog:core`, incluant le contrat de publication produit |
| catalogue resilience | `test:catalog:resilience` |
| catalogue securite/Rules | `test:catalog:security` |
| catalogue materialise | `test:catalog`, recette navigateur sandbox et Data Access seulement si explicitement demande |
| Functions/rules | tests cibles, audit exports/rules, deploiement sandbox cible |
| securite transverse | `security:audit`, `test:auth`, `test:catalog:security`, lint, build et probes sandbox passives |
| guide facturation | `test:billing-onboarding`, lint cible, reprise de progression, smoke compte test/super-admin uniquement sur demande |
| factures manuelles admin | `test:invoices`, lint cible, build; envoi Gmail reel uniquement sur demande explicite |
| couts Firestore | `test:analytics`, mesure Usage Insights/Data Access avant-apres si necessaire |
| retention/audits | `test:retention`, `security:audit:static`, dry-run de purge uniquement sur autorisation explicite |
| G11 maintenance destructrice | G11-R: manifeste/appelants/trafic en lecture seule; G11-D: `test:functions-g11` unique, refus Auth/App Check, confirmation invalide, dry-run, precondition, audit/reprise et zero destruction de donnees reelles |
| infra | `test:deployment-cache`, `infra:env`, `infra:deploy`, `appcheck:audit` en lecture |
| socle Next.js majeur | lint, `test:deployment-cache`, `test:auth`, `test:admin-cache`, `test:catalog:core`, `test:catalog:resilience`, `test:catalog:security`, `seo:surface`, build Turbopack, `next:routes`, `mobile:contract`, smoke local, puis smoke sandbox lors du deploiement autorise |

## 5. Gates publiques

```bash
npm run lint
npm run security:audit
npm run test:deployment-cache
npm run test:admin-cache
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

Windows Hello, Face ID, Touch ID et certains wallets requierent une
intervention humaine sur l'appareil. Dans une recette sandbox explicitement
autorisee, l'agent peut utiliser le selecteur de comptes Google deja connectes,
lire un OTP dans la boite de recette autorisee et le saisir directement dans
le site sans jamais l'afficher ni le conserver. Les mots de passe, PIN
systeme, passkeys, CAPTCHA et confirmations materielles restent saisis par
l'utilisateur.

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

Les suites catalogue Firestore et Storage utilisent le meme namespace demo et
s'executent avec `--test-concurrency=1`. Cette serialisation evite qu'un
`clearFirestore()` d'une suite efface le registre administrateur prepare par
l'autre pendant l'evaluation interservice des Storage Rules.

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
la publication, le retry acquitte avant version obsolete, l'archive souple et
un audit append-only par commande.

La meme gate couvre la matrice fulfillment par `deliverySnapshot`, le refus du
titre public illisible ou du materiau vide, la modale d'archivage a cle stable
et les identites distinctes Ecrire/Apercu. `test:auth` couvre en plus les deux
reprises bornees d'une erreur reseau pendant le renouvellement du jeton admin.

Le rail Meta possede une gate locale dediee:

```bash
npm run test:meta
```

Elle couvre le state OAuth et son anti-rejeu, le chiffrement AES-GCM
authentifie, la projection publique sans identifiant ni token, la normalisation
des medias et destinations, la legende sociale bornee et l'idempotence de la
commande. Elle ne prouve ni les permissions de l'application Meta, ni la
recuperabilite des URL Storage par Meta, ni une publication distante reelle;
ces preuves appartiennent aux Gates M4/M5 sandbox.

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
Stripe perdue, reprise de la meme tentative par un second administrateur fort,
audit de reprise, cumul exact, compte Connect historique et zero restock. La
lecture admin couvre aussi la jointure bornee de la derniere tentative, sa
reference Stripe et son indicateur `resumable`.
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
Emulator ont ete rejouees. La requalification du 2026-07-31 conserve
l'agregat complet vert: confinement Rules 12/12, Firestore 16/16 avec 75
assertions, dont le settlement webhook `refund.failed`, et Rules v2 5/5.

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

`tests/commerce/domain/document-delivery.test.cjs` couvre en plus le rendu PDF
deterministe, la reutilisation de l'artefact Storage immutable, la
deduplication e-mail, le masquage du destinataire, le confinement du prefixe
Storage et le contrat UI ouvrir/enregistrer/partager. Le test adaptateur e-mail
verifie la piece jointe PDF en memoire pour Gmail et son encodage Base64 pour
Resend.

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

Avant le scenario humain M12/M13, lancer
`npm run commerce:refund-failed:preflight`. Cette gate externe reste non
mutante pour le commerce: versions Functions, rejet d'une requete webhook non signee et
abonnements Stripe test. Une sortie rouge suspend seulement le remboursement
asynchrone en echec; elle ne remplace pas la preuve fonctionnelle finale.

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

- `core`: diff prix/stock/vente/remise en vente/titre/categorie/publication/suppression/image/ordre, ancien et nouveau slug, parents, determinisme, bornes `full`, preuve admin fraiche post-publication, parite des routes et hash du plan dans le manifeste;
- `resilience`: CAS et fallbacks, publication partielle et reprise `pointer_committed_control_pending`, debounce interactif borne, ecriture/verification parallele des payloads immuables, reconciliations concurrentes, rollback vivant/expire/high-water, `stateVersion`/lease/fence, lecture Storage epinglee et retry de generation, GC releases/medias;
- `security` partie Node: HMAC corps exact/timestamp, projet/audience, plan strict, redirection/JSON incoherent, version N contre N+1, signal exact emis avant une preuve HTML eventuellement stale, preuve HTML servie/reparable, endpoint version 200/304, hydratation galerie exacte et contrats images/navigation/signal;
- `security` partie emulateurs: interdiction de lire `furniture`/`public/meta`, controle backend des etats et ecriture client refusee sur `sys_catalog_live/current`. Java reste requis pour executer cette partie.

Les gates `next:routes` et `mobile:contract` protegent en plus ISR/SSG et le shell mobile. La recette cold/warm, la mesure des telechargements et le comportement `router.refresh()` restent des preuves navigateur sandbox et ne doivent pas etre declares par les tests statiques.

La recette catalogue complete se fait dans le navigateur sandbox. Le rollback reel est exclusivement expose par Maintenance admin et exige App Check, registre actif, AAL2 Google ou passkey et revisions explicites, sans minuterie de reconnexion.

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
