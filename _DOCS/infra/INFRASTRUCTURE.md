# Infrastructure Firebase, Next.js et environnements

Derniere mise a jour: 2026-08-17
Statut: `PREPROD_READY - PRODUCTION_DEFERRED`

## 1. Runtime et gestionnaire de paquets

| Element | Contrat |
| --- | --- |
| Node.js | `22.x` |
| gestionnaire | `pnpm 11.7.0` |
| Next.js | `16.3.x`, Turbopack par defaut |
| React | `19.2.x` |
| Functions | Node 22 dans le package prive `functions/` |

Node 24 local ne doit pas devenir la reference tant que `engines`, CI, App Hosting et Functions imposent Node 22. La migration Next.js 16.3 est qualifiee localement sous Node 22; son deploiement doit encore etre qualifie sur le sandbox avant toute promotion.

Next.js 16.3 conserve ici le modele de cache historique. `cacheComponents`,
`partialPrefetching`, le React Compiler Rust et `experimental.useOffline` ne
sont pas actifs. Turbopack est le bundler standard de developpement et de
build; aucun fallback Webpack ne doit etre ajoute sans incompatibilite prouvee.

La publication 16.3 etant recente, `pnpm-workspace.yaml` porte une exception
`minimumReleaseAgeExclude` bornee aux paquets Next/SWC 16.3.0 effectivement
verrouilles. Elle ne permet aucune autre famille ou version et pourra etre
retiree apres la fenetre de refroidissement du registre.

## 2. Etat des environnements

| Environnement | Etat | Identifiant |
| --- | --- | --- |
| local sandbox | actif | `.env.sandbox` charge par `scripts/with-env.mjs` |
| App Hosting sandbox | actif | backend `secondevie-next-sandbox` |
| Firebase sandbox/preprod | actif | projet `secondevienextjsssr` |
| production locale | fichier prepare | `.env.production`, a ne pas utiliser pour ecritures sans accord |
| Firebase/App Hosting production | absent | aucun alias/backend prod cable dans `.firebaserc` |

URL sandbox:

```text
https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app
```

Le sandbox est l'environnement de demonstration cliente. Il n'est pas le domaine final et ses passkeys seront a reenroler.

Firebase classe les versions de framework plus recentes que sa version active
comme preview App Hosting. Le build local ne suffit donc pas a qualifier Next
16.3: un rollout sandbox et les smokes ISR/catalogue/navigation restent requis
avant toute promotion.

Qualification locale du 2026-08-04 sous Node 22.22.3:

- build Turbopack complet, 52 pages generees sur 52;
- compilation Turbopack observee a 6,8 s a froid puis 1,2 s avec cache chaud;
- build Webpack de controle sous Next 16.3 compile en 14,6 s;
- contrats lint, Auth, catalogue, SEO, routes, mobile et cache de deploiement
  valides;
- smoke du serveur final: `/`, `/a-propos`, `/admin` et `/robots.txt` en 200,
  revalidation catalogue sans authentification refusee en 401;
- qualification locale fermee avant le premier rollout sandbox Next 16.3.

Rollout Next.js 16.3 sandbox du 2026-08-04:

- source locale commit `072aed2` (`chore: migrer vers Next.js 16.3`), Node 22;
- App Hosting build `build-2026-08-04-003` `READY`, rollout du meme nom
  `SUCCEEDED` a 11:53:00 UTC;
- URL active:
  `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`;
- `deploymentId` servi: `sv-mseljeam-4fd6db9da896`, identique dans
  `data-dpl-id`, les assets `?dpl=` et `x-nextjs-deployment-id` sur navigation
  RSC;
- `/`, `/galerie`, `/a-propos`, `/devis`, `/recherche`, `/admin`, `/checkout`,
  `/mes-commandes`, `/wishlist`, `/robots.txt`, `/sitemap.xml` et
  `/api/catalog/version` en HTTP 200;
- routes publiques en `s-maxage=300`, tunnels prives en `no-store`, catalogue
  revision 227 et routes categorie/produit en HTTP 200;
- rollback App Hosting de reference: build precedent `build-2026-08-04-002`;
- le push de `072aed2` vers `origin/main` a ete refuse par la protection locale:
  le sandbox est donc temporairement en avance sur le depot distant et aucun
  redeploiement depuis Git ne doit etre lance avant synchronisation explicite.

Serveur local accessible sur le reseau:

```bash
npm run dev:host
npm run dev:host:auto
```

`dev:host` conserve le port previsible `3000`. `dev:host:auto` teste les ports a partir de `3000`, transmet le premier port libre a Next et affiche les URL cliquables bureau et telephone sur le meme Wi-Fi.

## 3. Topologie actuelle

```text
navigateur
  -> Firebase App Hosting, europe-west4
       -> Next App Router / API routes
       -> /api/catalog same-origin
       -> bucket catalogue prive, europe-west4
       -> Firebase Auth
  -> Cloud Functions privees, europe-west1
       -> trigger catalogue + Cloud Tasks + builder/revalidation
       -> Stripe
       -> Gmail actif / Resend prepare
  -> bucket medias produit, us-central1
       -> processProductPublicationImage, us-central1 (contrainte Storage)
```

App Hosting (`apphosting.yaml`):

- `minInstances: 0`;
- `maxInstances: 10`;
- `concurrency: 80`;
- `cpu: 1`;
- `memoryMiB: 512`.

`minInstances: 0` accepte les cold starts pour limiter le cout preproduction. Une instance chaude payante ne doit etre decidee qu'avec trafic et mesure production.

## 4. Codebases Functions

`firebase.json` declare:

| Codebase | Dossier | Role |
| --- | --- | --- |
| `main` | `functions/` | Auth, admin, commerce, email, analytics, maintenance et catalogue materialise |

La fermeture G8 du 2026-08-19 recense 246 Functions cloud: 139 Gen1 et
107 Gen2. Les 37 exports commerce G8 sont dupliques en Gen2
et `ACTIVE` en `europe-west1`, Node 22. Le
manifeste G0 conserve la baseline regionale initiale, dont les six cibles US
`grantAdminOnAuth`, `e2eCheckoutProof`, `e2eStripeHardeningProof`,
`stripeWebhook`, `stripeConnectWebhook` et le trigger Gen2
`processProductPublicationImage`, qui reste proche du bucket produit
`secondevienextjsssr.firebasestorage.app`. Les 251 exports locaux et les
246 cibles cloud donnent `l = 2` pour les legacy G8 conservees; toutes les
Gen1 restent intactes. Le detail machine final est dans
`apphostingaudit/manifests/functions-gen2-g8.json`.
L'extracteur courant recalcule ces 246 cibles depuis les 251 exports et refuse
toute vague parallele inconnue. Pour les creations G6-G8, le wrapper refuse
desormais toute archive dont l'URI, le SHA-256, la generation ou la taille ne
correspond pas exactement au manifeste signe; il relit et rehache aussi les
octets Storage avant le lancement de `gcloud functions deploy`.
Le correctif outbox post-audit a ete deploye seul depuis `main` au commit
`0f09dc8`: `commerceOutboxDispatcher` Gen1 version 12 est `ACTIVE`, build
`43c90da7-3738-4058-85cf-a0045d953009`, avec le Scheduler `ENABLED` conserve.

Etat courant du chantier Gen2 au 2026-08-22: G0-G10 sont fermes. Les deux
webhooks G10 Gen2 sont `ACTIVE`, soit 275 local / 272 cloud / 139 Gen1 / 133
Gen2. Les endpoints Stripe test Platform et Connect servent
`stripeWebhookV2Gen2` et `stripeConnectWebhookV2Gen2`; l'ancien endpoint
Connect est `disabled`, les quatre Gen1 et leurs secrets de rollback sont
conserves. Aucun build App Hosting G10 n'a ete cree:
`build-2026-08-22-001` reste servi. Les 24
Functions G9 sont `ACTIVE`. Leur inventaire de fermeture avant G10 valait 275
local / 270 cloud / 139 Gen1 / 131 Gen2; aucun rail Gen1 n'a ete retire. Les
quatre jobs Gen1 G9 sont
`PAUSED`, les jobs HTTP Gen2 correspondants `ENABLED`, avec IAM OIDC, double
invocation bornee, fence libere et rollback inverse prouves. L'archive source
immutable de 97 Mo a ete composee depuis 24 composants bornes. App Hosting sert
`build-2026-08-22-001`, apres rollback reel vers `build-2026-08-19-005` et
reactivation. G9 est fermee. Les paragraphes suivants conservent les
details durables des lots G4 et G5.
G11 est fermee par
`apphostingaudit/manifests/functions-gen2-g11-r.json`: les dix Gen1 sont
toujours presentes, neuf sont classees `RETIRE_G12_A` et seule
`deleteSession` est `MIGRATE_GEN2` (`d = 1`). `deleteSessionGen2` est `ACTIVE`
en revision `deletesessiongen2-00001-mug`, sous Node 22 et le compte runtime
analytics au moindre privilege. L'inventaire est 276 local / 273 cloud / 139
Gen1 / 134 Gen2. App Hosting sert `build-2026-08-22-002` apres rollback reel
vers `build-2026-08-22-001` et reactivation. La probe est dry-run, sans ecriture
ni suppression; aucun Gen1, IAM ou secret n'a ete retire. Le manifeste final
est `apphostingaudit/manifests/functions-gen2-g11.json`.
G5-A1 ajoute
`getUserStatsGen2`, ACTIVE en revision `getuserstatsgen2-00001-niv`, avec
runtime `auth-reader-runtime`, CPU 167m, 512 MiB, 300 s, concurrence/max 1 et
min 0. Le rollout
`g5-a1-cutover-20260818-001` sert `build-2026-08-17-005`: ancien onglet `004`
sain, `/` et `/admin` en 200, compteur admin 34, un appel Gen2 200, zero erreur
et zero nouvel appel Gen1. G5-A2 ajoute `logUserConnectionGen2`, ACTIVE en
revision `loguserconnectiongen2-00001-fab`, avec runtime
`auth-session-runtime`, CPU 167m, 256 MiB, 60 s, concurrence/max 1 et min 0.
Le rollout `g5-a2-cutover-20260818-001` sert `build-2026-08-18-001`: ancien
onglet `005` sain, routes 200, ecriture attendue, zero erreur Gen2 et zero
nouvel appel Gen1. Son rollback exact est `005`.
G5-A3 ajoute `ensureAdminAccessRegistryGen2`, ACTIVE en revision
`ensureadminaccessregistrygen2-00001-lak`, avec runtime
`auth-registry-runtime`, les memes limites et le seul secret
`SUPER_ADMIN_EMAIL:3`. Le rollout `g5-a3-cutover-20260818-001` sert build
`002`: ancien onglet `001` sain, routes et appel Gen2 200, registre inchange,
zero erreur et zero appel Gen1. Inventaire: 165 local, 160 cloud, 139 Gen1,
21 Gen2, 8 schedulers, 2 queues et 7 Eventarc. Rollback exact `001`; aucune
Gen1, IAM, secret ou donnee n'est retiree avant G12-A. G5-A4 ajoute ensuite
`sendGuestCheckoutOtpGen2`, ACTIVE en revision
`sendguestcheckoutotpgen2-00001-neh`, runtime `auth-otp-email-runtime`, Gmail,
App Check et quatre secrets epingles. Le rollout
`g5-a4-cutover-20260818-001` sert `build-2026-08-18-003`: ancien onglet `002`
sain, routes 200, un seul OTP sandbox emis sans lecture du code, zero erreur et
zero appel Gen1 pendant la quiet-window. Inventaire: 166 local, 161 cloud,
139 Gen1, 22 Gen2, 8 schedulers, 2 queues et 7 Eventarc. Rollback exact `002`.
G5-A5 ajoute `verifyGuestCheckoutOtpGen2`, ACTIVE en revision
`verifyguestcheckoutotpgen2-00001-wim`, runtime `auth-otp-verify-runtime`, App
Check et `OTP_HMAC_SECRET:1`. Le build `build-2026-08-18-004` est actif apres
cutover, rollback reel vers `003` et reactivation finale; ancien onglet `003`
authentifie, routes 200, compteur 34, verification OTP 200 en memoire chiffree,
zero erreur, zero appel Gen1 et aucune mutation pendant la quiet-window.
Inventaire: 167 local, 162 cloud, 139 Gen1, 23 Gen2, 8 schedulers, 2 queues et
7 Eventarc. Rollback exact `003`; prochaine cible `sendCustomerLoginOtpGen2`.

Depuis G1 le 2026-08-15, Firestore `(default)` `eur3` porte delete protection,
PITR sept jours, un backup quotidien conserve quatorze jours et un backup
hebdomadaire dimanche UTC conserve quatorze semaines. Le premier backup est
`READY` et le restore vers `restore-drill-20260815-a` est reconcilie sans drift
de donnees/index. Les preuves sante/workers G1 et la stabilisation G2-B des
treize Gen2 initiales sont fermees. G4-A1 est fermee par validation acceleree
apres levee explicite de la borne temporelle: deux appels admin reussis, zero
erreur, donnees idempotentes et zero trafic Gen1. `updateUserSessionsGen2` est
ACTIVE en revision `updateusersessionsgen2-00001-zoq`; limites, IAM et refus
App Check sont conformes. Le retry a produit `build-2026-08-17-001` READY et
SUCCEEDED, puis la gate de reconnexion Google a ete interrompue avant Auth.
`rollback-20260817-001` sert de nouveau `build-2026-08-16-001`, sans
reconciliation active. Monitoring
porte cinq metriques logs, huit policies, un dashboard, un canal e-mail primaire
et un canal Pub/Sub interne secondaire. Le correctif du 2026-08-17 exclut les
journaux internes d'incident des deux metriques commerce et utilise des alertes
`LogMatch` directes avec severite, limitation a une notification par heure et
auto-close six heures; il supprime une boucle ouverture/resolution sans changer
le destinataire `loa.gto`. Les huit policies portent maintenant une severite
`ERROR` ou `WARNING`. L'IAM publisher du service agent est borne au topic G1.

Le drill mesure un RPO de 1 374 secondes et un RTO de restore de 1 064 secondes.
Les deux TTL ne sont pas restaures par le backup et restent volontairement
absents de la base isolee. Auth, Storage, secrets et configuration ont ete
inventories sans valeur secrete; aucun runtime ou Eventarc ne cible la base de
drill.

Le codebase public historique et Firebase Hosting ne font plus partie de la configuration. Les Functions SEO/`publicCatalog` historiques ont ete supprimees du sandbox le 2026-07-18 et le site Hosting `secondevienextjsssr` a ete desactive apres verification de l'URL App Hosting.

Catalogue materialise:

- bucket prive: `secondevienextjsssr-catalog-europe-west4`;
- queues Cloud Tasks: build et revalidation en `europe-west1`;
- comptes de service: `catalog-enqueuer` et `catalog-builder`; tous deux ont `run.invoker` uniquement sur `dispatchcatalogbuild`, car les triggers et les reconstructions peuvent signer les Cloud Tasks; `catalog-enqueuer` porte aussi `storage.objectViewer` borne au bucket catalogue, necessaire au reconciler planifie qui valide les pointeurs et releases;
- runtime App Hosting: lecture d'objets uniquement sur le bucket catalogue;
- secret runtime: `CATALOG_REVALIDATION_HMAC_SECRET`;
- source publique unique: snapshot Storage, sans variable de selection ni fallback Firestore.

IAM reste ressource/cible autant que possible: l'enqueuer peut publier les tasks et invoquer les workers autorises; le builder peut lire Firestore, ecrire les releases/pointeurs, invoquer la revalidation et lire le secret HMAC. `firebase-app-hosting-compute` a `secretAccessor` et `secretmanager.viewer` uniquement sur le secret HMAC, ainsi que `objectViewer` sur le bucket catalogue. Ne pas elargir ces bindings au projet sans nouvelle justification.

## 5. Fichiers de configuration

```text
.firebaserc                 alias Firebase, sandbox seulement
firebase.json              rules, indexes, codebase main et App Hosting
apphosting.yaml            runtime et variables App Hosting sandbox
next.config.mjs            Next, images, headers, redirects
firestore.rules            autorisations Firestore
firestore.indexes.json     indexes et exemptions
storage.rules              autorisations Storage
.firebaseignore            exclusions de deploiement
.env.sandbox.example       contrat local sandbox
.env.production.example    contrat futur production
functions/.env.secondevienextjsssr.example
                           parametres non secrets Functions sandbox
```

Les rules `furniture/**` utilisent `firestore.get/exists` pour relire le
registre administrateur actif. Le deploiement initial de ce contrat doit
conserver l'autorisation interservice Storage Rules vers le Firestore par
defaut demandee par Firebase CLI; ne pas remplacer ce controle par une
ouverture publique ou par une simple confiance dans les claims.

Les callables `getDeliveryPolicyAdmin` et `saveDeliveryPolicyAdmin` sont le
seul writer admin des tarifs de livraison. Ils creent une politique immutable,
font basculer le control plane dans une transaction et publient la projection
publique; le navigateur n'ecrit jamais ces documents directement.

Deploiement sandbox du 2026-08-04 a 15:58 Europe/Paris: Functions Node 22,
Rules Firestore/Storage et rollout App Hosting termines avec succes. Les routes
`/admin` et `/galerie` repondent HTTP 200 apres rollout; le backend
`secondevie-next-sandbox` sert cette version depuis `europe-west4`.

Correctif upload admin deploye le 2026-08-04 a 17:58 Europe/Paris: les Rules
Storage alignees sur le contrat admin Google/passkey ont ete republiees, puis
le rollout App Hosting du backend `secondevie-next-sandbox` a termine avec
succes. Les probes `/admin`, `/galerie` et `/api/catalog/version` repondent
HTTP 200. Aucune Function, donnee, configuration Stripe ou cible production
n'a ete modifiee pendant ce deploiement cible.

Correctif de confirmation publication deploye le 2026-08-08 a 15:21
Europe/Paris: App Hosting `build-2026-08-08-003` `SUCCEEDED`, deployment ID
`sv-mskef8s2-913ad46d9a2a`. Le rollout remplace le faux pourcentage de la
modale par des etapes reelles, renforce la preuve de galerie et bascule
automatiquement vers Publications apres succes. Les probes `/admin` et
`/galerie` repondent HTTP 200, partagent le meme deployment ID, la galerie
conserve `s-maxage=300` et `/api/catalog/version` sert la revision 255. Le
deploiement a cible uniquement App Hosting; aucune Function, Rule, donnee,
configuration Stripe ou cible production n'a ete modifiee.

Correctif d'ouverture Publications deploye le 2026-08-08 a 15:47
Europe/Paris: App Hosting `build-2026-08-08-004` `SUCCEEDED`, deployment ID
`sv-mskfcyxa-905c12925108`. La table Publications se precharge desormais hors
ecran pendant la composition, le formulaire est renouvele apres succes et la
confirmation apparait en bas a droite. `/admin` repond HTTP 200 en `no-store`.
Le deploiement a cible uniquement App Hosting; aucune Function, Rule, donnee,
configuration Stripe ou cible production n'a ete modifiee.

Correctif de decouplage galerie deploye le 2026-08-08 a 16:09 Europe/Paris:
App Hosting `build-2026-08-08-005` `SUCCEEDED`, deployment ID
`sv-mskg5z9r-542b0038bb26`. Le pop-up confirme desormais la release publique
exacte sans attendre la convergence du HTML ISR. Le bouton de confirmation
cible le meuble par identifiant dans la galerie avec transition et secours API
si la page statique est encore en retard. Les probes `/admin` et `/` repondent
HTTP 200. Le deploiement a cible uniquement App Hosting; aucune Function, Rule,
donnee, configuration Stripe ou cible production n'a ete modifiee.

Synchronisation structurelle catalogue deployee le 2026-08-08 a 16:40
Europe/Paris: App Hosting `build-2026-08-08-006` `SUCCEEDED`, deployment ID
`sv-mskh8vli-4f294aaa5d57`, et Function ciblee
`main:dispatchCatalogRevalidation` `ACTIVE` en `europe-west1`. Le signal
`sys_catalog_live/current` est maintenant emis apres preuve API exacte et avant
la preuve HTML; la galerie recharge Nouveautes/Petits Prix depuis cette release
publique exacte. La preuve HTML reste le controle asynchrone de `servedState` et
des reprises. `/` et `/api/catalog/version` repondent HTTP 200; la revision
observee apres rollout est 258. Aucune autre Function, Rule, donnee, configuration
Stripe ou cible production n'a ete modifiee.

Correctif du bouton post-publication deploye le 2026-08-08 a 18:44
Europe/Paris: rollout App Hosting `SUCCEEDED`, deployment ID
`sv-msklnbd1-4a86cd563824`. Le bouton de confirmation envoie desormais une
demande explicite a la transition galerie, avec repli sur le routeur Next, puis
cible la carte du meuble par identifiant. Le lisere vert de la confirmation
porte une rotation CSS legere avec repli `prefers-reduced-motion`. Le sandbox
sert le nouveau style et la cible `hh` est retrouvee et surlignee sur `/`.
Aucune Function, Rule, donnee, configuration Stripe ou cible production n'a
ete modifiee.

Correctif Safari/iPad du clic post-publication deploye le 2026-08-08 a 19:15
Europe/Paris: rollout App Hosting `SUCCEEDED`, deployment ID
`sv-mskmsgmx-00209dd5068b`. La passe precedente est remplacee: le conteneur
racine du pop-up n'utilise plus `pointer-events: none`, et l'action redevient un
lien Next natif vers `/?focusProduct=<id>#gallery-pieces`. La transition
admin-vers-galerie a ete reproduite sur le sandbox avant le patch; la correction
cible donc la zone cliquable Safari/iPad. Aucune Function, Rule, donnee,
configuration Stripe ou cible production n'a ete modifiee.

Retour galerie post-publication deploye le 2026-08-08 a 19:29 Europe/Paris:
rollout App Hosting `SUCCEEDED`, deployment ID
`sv-mskn99jn-5ddbf2b5b053`. Le lien du pop-up utilise la variante courte
`galleryReturn`, sans logo ni signature Atelier. Le secours produit n'ajoute
plus de carte autonome au-dessus de Nouveautes: il injecte et dedoublonne le
meuble directement dans la grille. La verification hebergee retrouve `x` une
seule fois dans la grille, sans bloc de secours, avec 40 px entre le titre et la
grille. Aucune Function, Rule, donnee, configuration Stripe ou cible production
n'a ete modifiee.

Les vrais `.env` sont locaux. Verifier avec `git ls-files` avant toute hypothese et ne jamais afficher leurs valeurs dans un rapport.

Audit et durcissement securite sandbox du 2026-08-11:

- `.env*`, comptes de service et cles PEM sont exclus simultanement de Git, de
  Firebase CLI et du contexte d'upload App Hosting;
- le pont `VITE_*` vers `NEXT_PUBLIC_*` est une allowlist fermee; les donnees
  bancaires ne peuvent plus devenir publiques automatiquement;
- App Hosting ne reference plus `SUPER_ADMIN_EMAIL`; ce secret reste attache
  uniquement au bootstrap owner dans Cloud Functions;
- la cle Web Firebase hebergee est separee de la cle de developpement et limitee
  aux deux referers techniques requis: l'origine App Hosting
  `secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app` et le
  handler Firebase Auth `secondevienextjsssr.firebaseapp.com`;
- cinq Functions OAuth Instagram ont ete supprimees du cloud apres
  autorisation explicite pendant la stabilisation. Le merge source ulterieur
  `6be360e` a reintroduit leurs exports et appelants UI sans les redeployer;
  ce drift, place sous `HOLD_META_RECONCILIATION` en G0, est resolu par G7:
  cinq paralleles Instagram Gen2 et neuf Meta/Facebook/saga Gen2 sont ACTIVE,
  tandis que toutes les Gen1 sont preservees;
- Auth, Firestore et Storage sont `ENFORCED` App Check sur le sandbox apres
  lecture des metriques valides sur sept jours;
- aucun binding IAM public ni aucun `roles/editor` ne subsiste. Les comptes de
  service Appspot, Compute et Cloud Services portent uniquement leurs roles
  runtime identifies;
- l'activation de la contrainte
  `iam.automaticIamGrantsForDefaultServiceAccounts` reste refusee faute du droit
  `setOrgPolicy`; elle ne doit pas etre contournee avec un compte plus large non
  autorise.

Deploiement cible termine le 2026-08-11 a 14:47 Europe/Paris:

- Rules Storage publiees apres validation emulator; tout nouveau repertoire
  racine est prive par defaut;
- 18 Functions Auth/admin/analytics/e-mail/E2E mises a jour, dont les deux
  preuves E2E maintenues desactivees sans flag explicite;
- rollout App Hosting `SUCCEEDED`, deployment ID
  `sv-msongnhg-71f98102199c`;
- controles heberges: `/` et `/admin` HTTP 200, admin en `private, no-store`
  et `noindex`, chemins `/.env` et `/.git/config` HTTP 404, route admin sans
  identite HTTP 401, contenu non JSON HTTP 415;
- controles Functions: appel sans App Check HTTP 401, origine beacon inconnue
  HTTP 403 et endpoints E2E inactifs HTTP 403.

Aucune Rule Firestore, donnee Firestore/Storage, configuration Stripe, cle API,
permission IAM ou cible production n'a ete modifiee pendant ce deploiement.

Seconde phase de durcissement explicitement autorisee le 2026-08-11:

- retrait des trois bindings projet `roles/editor` apres inventaire, simulation
  et sauvegarde de la politique de rollback;
- suppression ciblee des cinq anciennes Functions Instagram/OAuth, sans toucher
  aux cinq Functions Meta actuelles;
- passage App Check a `ENFORCED` pour Auth, Firestore et Storage;
- cle Firebase Web App Hosting dediee, bornee aux API Firebase requises, au
  referer du sandbox et au referer du handler Firebase Auth; une origine tierce
  est refusee par la restriction;
- rollout App Hosting `build-2026-08-11-002` `SUCCEEDED`, deployment ID
  `sv-msos946q-a4ef2272161d`;
- page publique HTTP 200 sans erreur navigateur; la rotation de cle provoque
  une deconnexion unique des sessions Firebase deja stockees sous l'ancienne
  cle, puis les nouvelles connexions utilisent la cle bornee;
- aucune erreur Cloud Functions/Cloud Run observee apres la reduction IAM.

Aucune donnee Firestore/Storage, configuration Stripe, cible ou rail production
n'a ete cree ou modifie pendant cette seconde phase.

Correction Google Auth du 2026-08-12:

- la premiere restriction de la cle hebergee ne conservait que le referer App
  Hosting; le popup Firebase echouait donc dans `__/auth/handler` avec
  `Unable to verify that the app domain is authorized`;
- `https://secondevienextjsssr.firebaseapp.com/*` a ete ajoute aux referers
  autorises sans elargir les API accessibles ni retirer la restriction App
  Hosting;
- le parcours heberge atteint de nouveau l'ecran de selection de compte Google;
  aucun compte ni mot de passe n'a ete utilise pendant cette verification;
- aucune Function, Rule, donnee ou cible production n'a ete modifiee.

Consolidation depuis le commit `ebe2e0a` terminee le 2026-08-11 vers 18:15
Europe/Paris:

- Storage Rules recompilees et confirmees a jour;
- le premier redeploiement Functions complet a revele la permission minimale
  manquante apres le retrait de `Editor`: le compte de build Compute ne pouvait
  plus lire/ecrire le cache `gcf-artifacts`;
- `roles/artifactregistry.writer` a ete accorde uniquement sur les depots
  `gcf-artifacts` de `europe-west1` et `us-central1`, pas au niveau projet;
- toutes les Functions qui importent le garde-fou central, ainsi que les
  endpoints directement modifies, ont ensuite ete redeployees par petits lots
  avec succes; les echecs initiaux de permission/quota sont remplaces par des
  versions deployees reussies;
- rollout App Hosting `build-2026-08-11-003` `SUCCEEDED`, deployment ID
  `sv-msotm4xf-a865f38aaf65`;
- sondes finales: site HTTP 200, callable sans App Check HTTP 401 et preuve E2E
  fermee HTTP 403.

Ce correctif IAM de build ne redonne aucun role `Editor` et ne change aucun
droit des administrateurs humains du back-office.

## 6. Variables publiques et secrets

Variables publiques typiques:

- configuration Web Firebase;
- region Functions cliente;
- cle publique Stripe;
- cle publique reCAPTCHA/App Check;
- URL et metadata du site;
- coordonnees metier destinees a l'affichage.

Variables Functions non secretes du rail media:

- `PRODUCT_MEDIA_BUCKET`: bucket des sources et variantes produit;
- `PRODUCT_MEDIA_REGION`: region physique du bucket pour le trigger Storage,
  `us-central1` sur le sandbox courant.

Secrets serveur centralises dans `functions/helpers/secrets.js`:

- `GMAIL_EMAIL`, `GMAIL_PASSWORD`;
- `RESEND_API_KEY`;
- `OTP_HMAC_SECRET`;
- `STRIPE_SECRET_KEY`, `STRIPE_WH_SECRET`, `STRIPE_CONNECT_WH_SECRET`;
- `PAYMENT_LINK_HMAC_SECRET`, signature opaque des liens admin sans compte;
- `E2E_PROOF_TOKEN`;
- `SUPER_ADMIN_EMAIL`;
- `META_APP_ID`, `META_APP_SECRET`, `META_OAUTH_REDIRECT_URI` pour le rail Facebook optionnel;
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_OAUTH_REDIRECT_URI` pour Instagram Login;
- `META_TOKEN_ENCRYPTION_KEY`, commun au chiffrement des deux familles de jetons sans les confondre;
- les secrets Meta attaches aux neuf cibles cloud sont consignes uniquement
  par nom/version dans le manifeste G0; la disponibilite des secrets Instagram
  directs ne vaut pas autorisation de deployer les cinq exports sous hold;
- `CATALOG_REVALIDATION_HMAC_SECRET` pour l'appel machine Function -> App Hosting.

`PAYMENT_LINK_HMAC_SECRET@1` est provisionne dans Secret Manager depuis le
2026-08-01 et attache uniquement aux Functions du rail de paiement admin. Sa
valeur aleatoire est distincte des secrets OTP et catalogue. Sa rotation
invalide les URL non payees en circulation et doit donc etre planifiee.

Etat Secret Manager verifie le 2026-07-29 apres nettoyage definitif:

- le build App Hosting actif `build-2026-07-29-011` reference uniquement
  `SUPER_ADMIN_EMAIL@3` et `CATALOG_REVALIDATION_HMAC_SECRET@3`;
- 14 anciennes versions Gmail, Stripe, E2E, super-admin et HMAC catalogue ont
  ete detruites immediatement apres confirmation explicite; leurs versions
  courantes sont restees actives;
- les trois secrets orphelins `ANALYTICS_SESSION_HMAC_KEY`,
  `ANALYTICS_AUDIENCE_HMAC_KEY` et `ANALYTICS_BROWSER_HMAC_KEY` ont ete
  supprimes avec leurs six versions, apres verification qu'aucun build actif,
  Function deployee ou code executable courant ne les reference;
- Secret Manager contient desormais 11 secrets et 11 versions actives, soit
  une seule version utile par secret;
- le delai de destruction de sept jours a ete restaure sur les secrets
  rotatifs concernes pour proteger les futures rotations.

Parametres non secrets:

- `TRANSACTIONAL_EMAIL_PROVIDER`, valeur par defaut `gmail`;
- `RESEND_FROM_EMAIL`, vide tant que le domaine n'est pas valide.
- `BILLING_GUIDE_MODE`, valeur par defaut et rollback `disabled`;
- `BILLING_GUIDE_TEST_UID`, UID unique autorise en mode `test`;
- `BILLING_GUIDE_LIVE_UID`, UID unique de la cliente en mode `live`;
- `BILLING_GUIDE_TECHNICAL_EMAIL`, adresse Google technique que la cliente ajoute au compte Billing.

Les parametres du guide sont lus exclusivement par les Functions. Aucun mode, UID cible ou e-mail technique n'est fixe dans le bundle navigateur. Un mode inconnu, un UID cible absent ou une erreur de configuration echoue ferme: le guide n'est impose a personne. La collection `sys_billing_onboarding` est backend-only dans `firestore.rules`.

Le guide ne depend d'aucun service account Cloud Billing, d'aucune cle JSON et d'aucun OAuth Google. Le rattachement de projets et les budgets restent des operations manuelles hors du site. Il ne faut donc pas activer l'API Cloud Billing ni ajouter de permissions projet pour tester seulement l'interface.

## 7. E-mail transactionnel

L'adaptateur Gmail/Resend est implemente et teste. Pour la demonstration:

- Gmail reste actif;
- Resend ne doit pas etre active par erreur;
- la cle Resend existe dans Secret Manager;
- aucun expediteur Resend final n'est configure.

Bascule production seulement apres:

1. achat/validation du domaine final;
2. ajout du domaine dans Resend;
3. DNS SPF, DKIM et DMARC;
4. adresse From metier;
5. test limite et suivi delivrabilite;
6. changement du provider;
7. rollback Gmail temporaire documente.

Le sous-domaine `hosted.app` appartient a Google et ne peut pas servir de domaine expediteur gere par la cliente.

## 8. App Check

Le sandbox impose App Check depuis le 2026-08-11 sur Firebase Auth, Firestore et
Storage. L'activation a ete precedee d'une lecture agregee sur sept jours: les
jetons de l'application Web legitime etaient valides, tandis que du trafic
invalide ou sans jeton etait encore accepte en mode observation. Les webhooks
signes, le SSR et les endpoints publics conservent leurs controles propres.

Ce statut ne vaut pas activation production: le futur projet production devra
etre observe et active separement. Le rollback sandbox consiste a remettre les
trois services en `UNENFORCED` si un parcours legitime casse.

Commande read-only disponible:

```bash
node scripts/audit-app-check-service-state.mjs
```

Toute activation doit etre progressive et accompagnee d'un retour `UNENFORCED` prepare.

Pour un E2E ponctuel, un jeton debug peut etre enregistre uniquement avec autorisation explicite. Le role `roles/firebaseappcheck.admin` doit etre temporaire, le jeton revoque dans un `finally`, puis le role retire. Les appels REST avec identifiants utilisateur doivent porter `x-goog-user-project: secondevienextjsssr`; ne jamais journaliser le jeton.

## 9. Firebase Hosting legacy

Le bloc `hosting`, ses rewrites et les Functions SEO historiques ont ete retires. Le site Firebase Hosting sandbox `secondevienextjsssr` est desactive depuis le 2026-07-18; un nouveau deploiement Hosting explicite serait necessaire pour le reactiver. Le site public de reference reste exclusivement l'App Hosting `secondevie-next-sandbox`.

## 10. Deploiement sandbox

Le contrat de coherence entre versions navigateur, assets Next et rollouts est
detaille dans
[DEPLOIEMENT_CACHE_CLIENT.md](DEPLOIEMENT_CACHE_CLIENT.md). Chaque build doit
embarquer un `deploymentId` unique et les pages ISR ne doivent pas conserver la
fenetre stale annuelle par defaut.

Le dashboard local est l'entree conseillee:

```bash
npm run dashboard
npm run dashboard -- --status
```

Il doit rester limite au projet `secondevienextjsssr` et au backend sandbox. Pour un deploiement cible, verifier explicitement `firebase use`, le codebase et les secrets requis.

Ne jamais utiliser un `firebase deploy` sans `--only` pendant une passe ciblee.

Optimisation de cout appliquee le 2026-07-29, inventaire historique remplace
par le manifeste G0 du 2026-08-15:

- inventaire final Functions: 91, dont 86 en `europe-west1` et 5 uniques en
  `us-central1`;
- politiques Artifact Registry actives sur les deux depots
  `gcf-artifacts`: suppression apres sept jours et conservation de la version
  la plus recente par package, apres dry-run sans candidat;
- meme politique active sur le depot gere App Hosting
  `firebaseapphosting-images`, apres inventaire d'un seul package et d'une
  seule version courante, sans candidat age de plus de sept jours;
- le smoke Stripe a confirme la cle sandbox et la signature du webhook v2 avec
  un evenement sans effet metier;
- le smoke catalogue a confirme l'authentification HMAC, puis revele que le
  build deploye compare l'audience a l'URL interne Cloud Run. Le code source
  compare desormais le contrat a `publicEnv.siteUrl`; ce correctif sera actif
  au prochain rollout App Hosting, qui devra etre suivi d'un nouveau smoke
  complet de revalidation.

Etat commerce sandbox au 2026-07-28:

- App Hosting `rollout-2026-07-28-006` /
  `build-2026-07-28-009` `SUCCEEDED`;
- indexes commerce `READY`;
- Functions Gate 7A en `europe-west1`: checkout fixture, dispatcher outbox,
  reconciler operations et commandes admin de statut/rebuild/cleanup;
- manifeste immutable `release_gate7a_c5259a87f875_f00378380561`, SHA
  `c5259a8`;
- controle revision 7: `newCheckoutMode=v2_fixture` limite a
  `fixture_gate6_20260728`, mutations admin `read_only`, offline `off`;
- sante operations `healthy`, compteurs de divergence a zero et TTL commerce
  explicitement desactivee;
- webhooks historiques maintenus en `us-central1`; le cleaner legacy
  `cleanupPendingPayments` a ete retire le 2026-07-29 apres verification de
  son absence d'effet et de 67 executions inutiles sur sept jours;
- Rules Firestore/Storage restrictives publiees apres le rollout UI;
- aucun rail production ni flag transactionnel public active.
- Gate 7B verte deux fois avec 11 scenarios par run;
- Gate 8 fermee sur fixtures avec rapprochement final vide, operations
  `healthy`, cleanup borne sans suppression et controle revision 22;
- endpoint Stripe Connect sandbox actif:
  `stripeConnectWebhookV2` en `europe-west1`;
- UI fixture refermee apres recette, mutations admin `read_only`, offline
  `off`; aucune cible live ou production activee.

Le transport Gmail sandbox utilise un mot de passe d'application dedie stocke
uniquement dans Secret Manager sous `GMAIL_PASSWORD`. En cas de `EAUTH`, la
rotation consiste a creer une nouvelle version du secret, redeployer seulement
le dispatcher outbox, reprendre les entrees echouees puis verifier
`providerMessageId`; aucun mot de passe ordinaire, mot de passe d'application
ou fichier temporaire ne doit rester dans le depot ou les rapports. Cette
rotation ne resout pas la reputation Gmail: la delivrabilite finale reste
conditionnee au domaine expediteur Resend et a ses DNS.

Rollout e-mail v2 du 2026-07-30:

- 15 Functions Auth/commerce ciblees `ACTIVE` en `europe-west1`;
- App Hosting `build-2026-07-30-019` `READY`, rollout `SUCCEEDED`;
- URL admin avec `order_id` et `/mes-commandes` verifiees en HTTP `200`;
- aucun flag commerce, rail live ou cible production n'a ete active.

Correctif transport Auth OTP du 2026-07-31:

- App Hosting `build-2026-07-31-003`, rollout `SUCCEEDED` a 19:14:46
  Europe/Paris;
- `/galerie` verifiee en HTTP `200` et chunk Auth public controle;
- aucune Function, rule, donnee, configuration commerce ou cible production
  modifiee.

Deploiement commerce/admin du 2026-08-01:

- commit `bd86467` pousse sur `origin/main`;
- App Hosting sandbox deploye, Cloud Build
  `e6b6fc20-823d-4533-ad22-fb7ec35c7919` `SUCCESS`;
- liens de paiement, expiration planifiee, demandes client de retour et quatre
  callables de facturation manuelle `ACTIVE` en `europe-west1`;
- `PAYMENT_LINK_HMAC_SECRET@1`, Rules Firestore/Storage et nouveaux index
  deployes; index liens de paiement `READY`;
- smokes `/`, `/admin`, `/payer/...` et `/api/catalog/version` en HTTP `200`;
- callable publique sans App Check refusee en HTTP `401`;
- controle commerce revision 62: `v2_fixture`, `read_only`, offline `off`,
  operations `healthy` et compteurs a zero; aucune fenetre `v2_all` ouverte.

Activation fonctionnelle sandbox du 2026-08-02:

- App Hosting sandbox et six Functions catalogue redeployes avec succes;
- smokes `/`, `/admin`, `/checkout` et `/api/catalog/version` en HTTP `200`;
- controle commerce revision 63: `v2_all`, mutations admin `v2`, offline `off`;
- policy active `sandbox_transactional_policy_20260802`;
- operations `healthy` et compteurs a zero;
- Stripe reste en mode test; aucun rail live ou production active.

## 11. Rollback

App Hosting:

1. ouvrir les rollouts du backend sandbox dans Firebase Console;
2. pour le lot commerce Gate 7A du 2026-07-28, le precedent stable est
   `rollout-2026-07-28-002` / `build-2026-07-28-003`;
3. lancer le rollback;
4. verifier `/`, `/produit/...`, Auth et la zone touchee;
5. consulter les logs Functions si le changement les concernait.

Functions/rules:

- conserver la liste des exports avant changement;
- deployer un codebase ou une Function cible;
- restaurer le commit stable et redeployer la meme cible en cas de regression;
- ne pas restaurer des rules permissives pour contourner un incident.
- ne pas recreer les neuf doublons mutateurs legacy supprimes en
  `us-central1`.

Rollback specifique au guide:

1. remettre le parametre `BILLING_GUIDE_MODE=disabled`;
2. verifier avec le compte cible que les onglets admin s'ouvrent normalement;
3. si le code lui-meme regresse, restaurer la version stable de l'App Hosting et des cinq callables;
4. laisser les documents `sys_billing_onboarding` en place pendant le diagnostic: ils sont inaccessibles au client et ne bloquent rien en mode `disabled`;
5. ne jamais desactiver la facturation d'un projet Google pour rollbacker une interface.

## 12. Conditions de creation du rail production

- [ ] domaine final choisi;
- [ ] projet Firebase ou strategie d'isolation prod approuvee;
- [ ] alias `.firebaserc` explicite;
- [ ] backend App Hosting prod;
- [ ] variables et secrets live separes;
- [ ] Stripe live + Connect + webhooks;
- [ ] Auth authorized domains et RP ID final;
- [ ] Resend et DNS;
- [ ] App Check decide;
- [ ] sauvegarde/restauration;
- [ ] budgets, quotas, logs et alertes;
- [ ] smoke desktop/mobile et recette cliente;
- [ ] runbook cutover et rollback date.

## 13. Gates infra

```bash
npm run infra:env
npm run infra:deploy
npm run appcheck:audit
npm run security:audit
npm run build
```

Les audits cloud necessitent une session CLI valide et doivent rester read-only sauf deploiement explicitement demande.

Depuis G0, tout deploiement Functions passe par
`scripts/deploy-functions-targeted.mjs`. Le wrapper exige le projet exact,
`codebase=main`, le commit HEAD, les manifestes et leurs digests, ainsi qu'une
allowlist non vide de dix noms maximum. Les cibles finance, webhook et
scheduler restent seules dans leur lot. `firebase deploy --only functions`,
y compris en dry-run, n'est plus un chemin autorise.

Deploiement de cloture recette du 2026-08-13: apres verification explicite du
projet `secondevienextjsssr`, `listMyOrdersV2` a ete mise a jour seule en
`europe-west1`, puis le seul backend App Hosting
`secondevie-next-sandbox` a ete deploye en `europe-west4`. Le rollout est
termine et sert le deployment ID `sv-msqodiu9-9adc770019d2`; la route
`/mes-commandes` repond HTTP 200. Aucune cible production, Function hors scope,
Rule, Stripe live, cle live, commit ou push n'a ete touche.

Deploiement codes promotionnels du 2026-08-13: projet actif verifie
`secondevienextjsssr`; 13 Functions strictement ciblees (checkout/reprise,
annulation/expiration, webhooks/reconciliation, newsletter et quatre callables
promotion) ont ete creees ou mises a jour en `europe-west1`. Les Rules et
indexes Firestore du meme projet ont ensuite ete deployes, puis uniquement le
backend App Hosting `secondevie-next-sandbox` en `europe-west4`. Le correctif de
format monetaire a donne le rollout final `sv-msqvxgxt-2442e21ef725`, controle
sur `/checkout`. Stripe reste test-only; aucune production, cle live ou
Function hors liste ciblee n'a ete modifiee.
