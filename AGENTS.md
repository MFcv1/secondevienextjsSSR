# AGENTS.md - Bible operationnelle de Seconde Vie Next

Derniere consolidation: 2026-07-17
Statut: `REFERENCE_MAITRE_ACTIVE`
Projet: `secondevienextjsSSR`

## 1. Mission de ce fichier

Ce fichier est le point d'entree obligatoire pour tout agent ou developpeur qui travaille dans le depot. Il fixe:

- l'etat reel du projet;
- les decisions qui ne doivent pas etre reouvertes sans raison;
- la route vers le bon chapitre technique;
- les regles de changement, validation, documentation et suppression;
- les conditions de livraison preproduction et production.

Il n'a pas vocation a recopier tous les details. Le livre complet est compose de:

```text
AGENTS.md ............... sommaire operationnel, regles et etat
map.md .................. cartographie routes/code/donnees/Functions
_DOCS/README.md ......... table des chapitres canoniques
_DOCS/<domaine>/*.md .... verite technique detaillee par domaine
Git ..................... archive des anciens audits et roadmaps
```

Avant de modifier le code:

1. lire ce fichier;
2. ouvrir `map.md` pour localiser le flux;
3. lire le chapitre canonique du domaine;
4. inspecter le code executable, qui reste la preuve finale;
5. choisir une validation proportionnee.

## 2. Hierarchie des sources de verite

En cas de contradiction, utiliser cet ordre:

1. demande actuelle explicite de l'utilisateur;
2. code, configuration, rules et schemas executables;
3. ce `AGENTS.md`;
4. `map.md`;
5. chapitre canonique de `_DOCS`;
6. historique Git;
7. conversations et captures anciennes.

Une contradiction entre code et documentation doit etre signalee et corrigee dans le meme changement si elle concerne le perimetre traite.

## 3. Etat executif du projet

| Domaine | Etat actuel |
| --- | --- |
| application publique | Next App Router natif, pages publiques serveur/ISR |
| home | `/` est la galerie canonique; `/galerie` est un alias |
| catalogue | collection unifiee `furniture`, administration et revalidation ciblee |
| Auth | passe de demonstration close, `PREPROD_READY`; production differee |
| espace client | commandes, factures, wishlist, adresse/profil de synthese, support |
| commerce | carte Stripe sandbox, webhooks, refund et Connect valides en preprod |
| back-office | 16 onglets lazy, acces admin fort, publication/ventes/data/maintenance |
| images | variantes Storage WebP, `detailFast`, miniatures 320/384, metadata anti-CLS |
| securite | rules fortes, AAL2 admin, secrets serveur; App Check prod encore differe |
| infrastructure | App Hosting sandbox actif; rail production absent |
| e-mail | Gmail actif pour demo; Resend code et secret prepare, DNS final manquant |
| performance | architecture SSR acquise; budget CSS/JS et statistiques prod differes |
| IA devis | conception uniquement, aucune integration active |
| legal | brouillon CGV/retours non publiable avant validation juridique |

Objectif de livraison courant:

> Maintenir un etat de preproduction stable et presentable a la cliente, avec les fonctionnalites majeures codees. Les travaux qui dependent du domaine, des comptes live, du DNS ou du trafic production restent explicitement differes.

## 4. Environnement de reference

| Element | Valeur |
| --- | --- |
| Node | `22.x` |
| pnpm | `11.7.0` |
| Firebase projet courant | `secondevienextjsssr` |
| App Hosting | `secondevie-next-sandbox` |
| URL | `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app` |
| App Hosting region | `europe-west4` |
| Functions privees source | `europe-west1` |
| publicCatalog | `us-central1` |
| email actif | Gmail |
| email futur | Resend, inactif |
| production | non cablee dans `.firebaserc` |

Ne pas convertir Node 24 local en nouvelle baseline sans migration dediee. Ne jamais traiter le sandbox comme le domaine final WebAuthn ou e-mail.

## 5. Bibliotheque des modules

| Module | Chapitre obligatoire | Code principal | Statut |
| --- | --- | --- | --- |
| architecture Next/SEO | [NEXTJS_SEO.md](_DOCS/architecture/NEXTJS_SEO.md) | `app`, `src/lib/server`, `src/lib/seo` | actif |
| annonces/catalogue | [ANNONCES_CATALOGUE.md](_DOCS/catalogue/ANNONCES_CATALOGUE.md) | AdminForm, products, marketplace, publicCatalog | actif |
| interface/navigation | [INTERFACE_NAVIGATION.md](_DOCS/ux/INTERFACE_NAVIGATION.md) | layout, header, mega menu, CSS | actif |
| images/medias | [IMAGES_MEDIA.md](_DOCS/images/IMAGES_MEDIA.md) | imageUtils, Storage, scripts image | actif |
| authentification | [AUTHENTIFICATION.md](_DOCS/security/AUTHENTIFICATION.md) | authStore, AuthContext, modal, auth Functions | preprod close |
| securite globale | [SECURITE_GLOBALE.md](_DOCS/security/SECURITE_GLOBALE.md) | rules, helpers security, secrets, headers | preprod |
| espace client | [ESPACE_CLIENT.md](_DOCS/client/ESPACE_CLIENT.md) | routes compte, MyOrders, wishlist | preprod |
| commerce/Stripe | [COMMERCE_STRIPE.md](_DOCS/commerce/COMMERCE_STRIPE.md) | commerce client/Functions/admin | preprod |
| back-office | [BACKOFFICE.md](_DOCS/admin/BACKOFFICE.md) | AdminAppIsland, `src/kit/admin` | preprod |
| infrastructure | [INFRASTRUCTURE.md](_DOCS/infra/INFRASTRUCTURE.md) | Firebase/App Hosting/config/env | sandbox actif |
| performance | [PERFORMANCE.md](_DOCS/perf/PERFORMANCE.md) | scripts perf, iles, cache/images | dette controlee |
| donnees/analytics | [DONNEES_ANALYTICS.md](_DOCS/data/DONNEES_ANALYTICS.md) + [AUDIT_COUTS_FIRESTORE.md](_DOCS/data/AUDIT_COUTS_FIRESTORE.md) | Firestore, UID/IP, sessions live, couts et migrations | moteur Tous a Table adapte, P1 couts public/analytics implemente localement, mesure sandbox requise |
| exploitation | [EXPLOITATION.md](_DOCS/operations/EXPLOITATION.md) | commandes, deploy, rollback, backlog | actif |
| qualite/tests | [QUALITE_TESTS.md](_DOCS/quality/QUALITE_TESTS.md) | CI, tests, scripts | actif |
| assistant devis IA | [ASSISTANT_DEVIS.md](_DOCS/ai/ASSISTANT_DEVIS.md) | futur | conception |
| legal | [CGV_RETOURS_DRAFT.md](_DOCS/legal/CGV_RETOURS_DRAFT.md) | textes futurs | validation requise |

Ne pas creer une nouvelle roadmap pour un de ces domaines. Mettre a jour son chapitre canonique, sauf si l'utilisateur demande explicitement un plan temporaire distinct. Un plan temporaire doit avoir une date de fin et etre fusionne/supprime a la cloture.

## 6. Invariants d'architecture publique

Routes:

- `/`: home galerie canonique, `force-static`, ISR 300;
- `/galerie`: alias, `force-static`, ISR 300, canonical `/`;
- `/categorie/[categoryId]`: SSG/ISR avec `generateStaticParams`;
- `/produit/[slugOrId]`: SSG/ISR avec `generateStaticParams`;
- `/a-propos`, `/devis`: rendu serveur + ISR;
- `/recherche`: noindex, contenu serveur + ile de resultats;
- `/admin`, `/checkout`, `/wishlist`, `/mes-commandes`: tunnels dynamiques noindex.

Interdictions:

- ne pas recreer `ClientApp`, `src/app.jsx`, `src/Router.jsx`, `setView` ou du hash routing;
- ne pas utiliser `cookies()`, `headers()`, `draftMode()` ou des `searchParams` serveur sur les pages publiques statiques;
- ne pas remplacer le HTML final par un faux rendu puis une grosse ile client;
- ne pas dupliquer `/` et `/galerie` avec deux implementations;
- ne pas rendre l'indexation dependante de Firebase Auth ou du navigateur;
- ne pas afficher une autre page pendant une transition de route.

## 7. Invariants par domaine

### 7.1 Catalogue

- `furniture` est l'ID de collection actuel; ne pas le renommer sans migration complete;
- toutes les surfaces utilisent le produit normalise;
- `isPurchasable` est la regle unique d'achat;
- l'ecriture admin doit bump `catalogVersion` et revalider;
- publication, indexabilite, stock et ordre editorial restent des concepts separes;
- le serveur revalide prix et stock au checkout.

### 7.2 Images

- conserver `imageVariants` et `imageMetadata`;
- cartes: petites variantes; detail initial: `detailFast`; zoom: grande variante a l'interaction;
- ne jamais supprimer un fichier Storage sur la seule base de `rg`;
- dry-run obligatoire avant backfill ou cleanup;
- ratio/couleur/blur doivent eviter CLS et flash brutal.

### 7.3 Navigation et UX

- ouverture du menu visuellement immediate;
- Auth/panier/wishlist ne bloquent pas le shell;
- focus, Escape, restauration du focus et safe areas preserves;
- navigation Next native;
- aucune galerie visible entre menu et espace client;
- sur mobile, la galerie conserve volontairement son conteneur de scroll interne fixe et peut donc laisser la barre d'URL Chrome visible; les pages categorie utilisent le scroll document natif, qui masque la barre en descendant et la restaure en remontant;
- `app/ViewportHeightSyncIsland.jsx` reste l'unique proprietaire global de `--marketplace-viewport-height` et doit suivre `visualViewport` pendant le repli des barres navigateur, l'orientation et le retour au premier plan; ne pas remettre cette mesure dans une route ou une ile qui se demonte a la navigation;
- respecter `prefers-reduced-motion` pour les animations non essentielles;
- ne pas redesign une zone lors d'un correctif technique cible.

### 7.4 Authentification

- `authStore`/`AuthContext` restent la source UI partagee;
- une passkey ne ferme la modale qu'apres `loginWithCustomToken` reussi;
- verification locale WebAuthn exigee et verifiee serveur;
- fallback OTP/Google toujours disponible;
- OTP idempotent et secret HMAC dedie;
- admin sensible = claim + registre + assurance forte recente;
- retrait admin = claims + registre + revocation refresh tokens;
- UI actuelle conservee sauf bug UX confirme;
- domaine final implique nouveau RP ID et reenrolement des passkeys.

### 7.5 Commerce

- le navigateur n'est jamais autoritaire pour prix, stock ou paiement;
- commande et webhooks idempotents;
- succes UI apres statut durable `paid`;
- une commande payee n'est jamais supprimee/annulee sans refund;
- refund complet valide avant remise en vente automatique;
- snapshot de commande conserve l'historique;
- Stripe sandbox et live strictement separes.

### 7.6 Admin et securite

- les actions sensibles passent par Functions/rules, pas par un simple bouton masque;
- les grandes vues restent lazy;
- listes et exports bornes;
- operations destructives: assurance forte, confirmation, audit et rollback;
- aucun secret dans `NEXT_PUBLIC_*`;
- App Check complete Auth/rules mais ne les remplace pas;
- les webhooks utilisent leur signature fournisseur;
- le codebase public reste minimal.

### 7.7 Donnees

- dry-run, comptages et sauvegarde avant ecriture massive;
- ne pas copier claims, secrets ou comptes live comme de simples documents;
- les commandes suivent la retention comptable;
- analytics non bloquants, bornes et minimises;
- toute nouvelle collection obtient rules, indexes et retention explicites.

## 8. Mode de travail selon la demande

### Correctif cible

1. reproduire ou localiser la cause;
2. appliquer le plus petit changement demande;
3. lancer seulement une verification rapide necessaire;
4. s'arreter quand le correctif est en place;
5. indiquer les validations non lancees.

Ne pas lancer automatiquement build, serveur, Playwright, navigateur, screenshot ou E2E si l'utilisateur ne le demande pas.

### Changement ou construction

1. inspecter les flux amont/aval dans `map.md`;
2. lire le chapitre;
3. implementer sans elargir le scope;
4. mettre a jour documentation/cartographie si structure modifiee;
5. valider proportionnellement au risque;
6. livrer un resultat concret et un prochain pas seulement s'il est deja approuve.

### Audit ou diagnostic

1. rester read-only sauf demande de correction;
2. distinguer faits, hypotheses et dettes;
3. verifier le code actuel plutot que citer un ancien rapport;
4. classer impact, preuve et action;
5. ne pas creer une roadmap infinie;
6. si un plan est demande, definir une fin fermee et des gates.

Ne pas lancer Codex Security ou un plugin de scan securite sans demande explicite de l'utilisateur.

### Deploiement ou cloud

1. confirmer projet, environnement, branche et cible;
2. executer les gates requises;
3. deployer avec `--only` ou le dashboard cible;
4. verifier le rollout et le parcours touche;
5. documenter l'URL/version;
6. garder un rollback.

Un terminal connecte au cloud n'autorise pas une ecriture production implicite.

## 9. Politique de validation

Choisir dans `_DOCS/quality/QUALITE_TESTS.md`.

Gates courantes:

```bash
npm run lint
npm run build
npm run seo:surface
npm run next:routes
npm run mobile:contract
npm run test:auth
npm run perf:gallery-direct
npm run perf:product-direct
npm run perf:category-direct
npm run perf:about-direct
npm run perf:quote-direct
npm run perf:menu-desktop
npm run perf:menu-mobile
npm run perf:budget
```

Gates externes, uniquement sur demande/scope explicite:

```bash
npm run e2e:auth-email
npm run e2e:hosted-stripe
npm run e2e:refund-stripe
npm run e2e:revalidate-catalog
npm run infra:deploy
```

`perf:budget` reste un rapport non bloquant; ne pas le transformer en chantier pendant une autre passe.

## 10. Securite, secrets et donnees sensibles

Ne jamais:

- afficher ou committer `.env`, cle API secrete, OTP, PIN, mot de passe applicatif, ID token, refresh token ou service account;
- lire une boite mail utilisateur sans mecanisme explicitement autorise;
- demander a l'utilisateur de coller un PIN Windows Hello/Face ID dans le chat;
- stocker un secret dans un rapport Markdown ou un screenshot;
- reutiliser le mot de passe Gmail comme secret HMAC;
- desactiver rules/App Check/signatures pour faire passer un test;
- lancer une purge ou migration en production pour explorer.

Les cles Firebase Web et Stripe publishable sont publiques par conception, mais leur usage et leurs domaines doivent rester bornes.

## 11. Gouvernance documentaire

### 11.1 Une verite par domaine

Chaque domaine a un chapitre canonique. Toute decision durable va dans ce chapitre. Ne pas creer:

- `ROADMAP_FINAL_V2.md`;
- `AUDIT_NEW.md`;
- un closeout par micro-phase;
- une copie du chapitre avec une date;
- un dossier archive dans `_DOCS`.

Git conserve l'historique. Les preuves volumineuses temporaires vont dans les logs ignores ou dans le compte rendu, puis sont nettoyees selon besoin.

### 11.2 Quand un nouveau document est permis

Seulement si:

- un nouveau domaine majeur apparait;
- aucun chapitre existant ne peut l'accueillir proprement;
- son proprietaire, statut et condition de mise a jour sont definis;
- il est ajoute a `_DOCS/README.md`, `AGENTS.md` et `map.md` si structurel.

Le nom doit etre stable, sans date ni version marketing.

### 11.3 Mise a jour obligatoire

Mettre a jour le chapitre et `map.md` lorsqu'un changement modifie:

- une route ou son rendu;
- un module/fichier structural;
- une collection, index ou rule;
- un export Function;
- une region, un provider ou un secret attendu;
- un parcours metier;
- une gate ou commande;
- le statut preprod/production d'une fonctionnalite.

### 11.4 Suppression documentaire controlee

Toute suppression future exige:

1. lecture complete du document candidat;
2. classification `obsolete`, `fusionne`, `incorrect` ou `remplace`;
3. transfert de chaque decision encore utile;
4. recherche des references avec `rg`;
5. verification de l'historique Git;
6. mise a jour des index;
7. `git diff --check` et controle des liens;
8. liste explicite des suppressions dans le compte rendu.

Ne jamais supprimer une reference canonique parce qu'elle semble longue. La reduire ou la scinder de facon gouvernee.

## 12. Gouvernance du code et des fichiers

Utiliser `apply_patch` pour les modifications manuelles. Preserver les changements utilisateur et les fichiers non lies.

Avant suppression/renommage de code ou asset:

1. rechercher imports, require, noms dynamiques et configuration;
2. verifier routes, lazy imports, Functions exports et scripts;
3. verifier donnees Firestore/Storage si les references peuvent etre en base;
4. verifier assets via reseau/visuel si necessaire;
5. mettre a jour `map.md`;
6. lancer les gates du perimetre;
7. garder un diff reversible.

Ne pas utiliser `git reset --hard`, `git clean`, `git checkout --` ou une suppression recursive pour effacer un travail non identifie.

## 13. Git et branches

- prefixe de branche agent: `codex/`;
- partir d'un worktree propre ou isoler les changements existants;
- ne pas melanger documentation, feature et correction sans raison;
- verifier `git status --short` avant/apres;
- ne pas commit/push/merge/deployer sans demande ou autorisation correspondant au workflow;
- squash merge uniquement sur demande;
- l'historique Git est l'archive officielle des anciens documents.

## 14. Backlog ferme

### Autorise avant demo

- correctifs de bugs reproductibles qui bloquent ou degradent clairement la presentation;
- aucune nouvelle phase Auth cachee;
- aucun chantier production dependants du domaine.

### Differe jusqu'a la production

- domaine final et DNS;
- RP ID et reenrolement passkeys;
- Resend/SPF/DKIM/DMARC;
- Firebase/App Hosting production;
- Stripe live et Connect live;
- App Check enforcement;
- sauvegardes, alertes et SLO;
- recette Safari/Face ID et matrice finale appareils;
- p50/p95 production;
- validation juridique.

### Dette technique non bloquante

- budget CSS/JS public;
- convergence regionale;
- Hosting/SEO legacy;
- assets candidats apres audit visuel;
- pagination admin selon volumes;
- gestion passkeys dans l'espace client si besoin confirme;
- Next 16/Turbopack;
- assistant IA devis.

Ces elements ne doivent pas revenir dans un patch en cours sauf demande explicite ou bug directement lie.

## 15. Definition de done

Une tache est terminee quand:

- le besoin demande est satisfait;
- aucun invariant n'est casse;
- le scope n'a pas derive;
- les validations proportionnees sont passees;
- les validations non lancees sont indiquees;
- les donnees de test et deploiements sont mentionnes;
- `map.md` et le chapitre sont a jour si necessaire;
- les suppressions sont justifiees;
- le prochain pas n'est pas invente apres la cloture.

Format de compte rendu recommande:

```text
Resultat
Fichiers/architecture touches
Validations lancees
Validations non lancees
Deploiement: oui/non, cible
Dette concrete restante: seulement si dans le plan
```

## 16. Verification rapide de la bible

Apres une passe documentaire ou structurelle:

```powershell
rg --files -g "*.md"
rg -n "ancien-document\.md" .
git diff --check
git status --short
```

Verifier ensuite que:

- chaque chapitre de `_DOCS/README.md` existe;
- chaque lien de la table des modules existe;
- chaque route et module structural de `map.md` correspond au code;
- aucun document supprime n'est encore cite;
- aucun secret n'apparait dans le diff.
