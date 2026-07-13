# Journal de progression - hardening Auth production

Date de creation: 2026-07-12  
Statut global: `AUTH_PATCH_CLOSED_FOR_DEMO - PRODUCTION DIFFEREE`
Roadmap normative: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Roadmap historique: [`AUTHENTICATION_ROBUSTNESS_ROADMAP_2026-07-11.md`](./AUTHENTICATION_ROBUSTNESS_ROADMAP_2026-07-11.md)
Plan ferme avant demonstration: [`AUTH_DEMO_PATCH_CLOSEOUT_PLAN_2026-07-13.md`](./AUTH_DEMO_PATCH_CLOSEOUT_PLAN_2026-07-13.md)
Runbook demonstration: [`AUTH_DEMO_RUNBOOK_2026-07-13.md`](./AUTH_DEMO_RUNBOOK_2026-07-13.md)

Objectif de livraison courant:

> L'idee est d'arriver a un etat pre-prod de presentation du site et que toutes les plus grosses fonctionnalites soient deja codees.

En consequence, le domaine final, le RP ID final et le DNS email restent des gates de production differees. Ils ne bloquent ni le codage des integrations, ni les preuves sandbox, ni la creation d'un closeout `PREPROD_READY` distinct de la validation production.

## 1. Mode d'emploi

Ce fichier est le fil d'Ariane obligatoire du chantier.

- la roadmap explique ce qui doit etre fait;
- ce journal enregistre ce qui a reellement ete fait;
- une case cochee sans preuve n'est pas une validation;
- une phase ne passe a `VALIDEE_*` qu'apres satisfaction de toute sa gate;
- les secrets, OTP, tokens et donnees personnelles ne sont jamais copies ici.

Chaque session de travail doit commencer par lire:

1. le tableau de statut;
2. la derniere entree du journal chronologique;
3. les blocages et acces requis;
4. la prochaine action exacte.

## 2. Statuts autorises

```text
NON_DEMARREE
EN_COURS
EN_VALIDATION
BLOQUEE
BLOQUEE_PRODUCTION
VALIDEE_SANDBOX
PREPROD_CODE_READY
PREPROD_VALIDATION_READY
PREPROD_READY
VALIDEE_PRODUCTION
ROLLBACK
```

## 3. Tableau directeur

| Phase | Sujet | Statut | Gate principale | Derniere preuve | Prochaine action |
| --- | --- | --- | --- | --- | --- |
| H0 | Baseline et contrats | `VALIDEE_SANDBOX` | toutes les suites Auth executables | closeout 2026-07-13, `22/22 PASS` | aucune |
| H1 | UV passkey obligatoire | `VALIDEE_SANDBOX` | assertions sans UV refusees | closeout Windows Hello 2026-07-13 | compatibilite multi-navigateurs reportee H8 |
| H2 | Step-up admin | `VALIDEE_SANDBOX` | OTP admin interdit pour actions sensibles | closeout AAL2 + Windows Hello 2026-07-13 | preuve MFA Google reportee H8 |
| H3 | OTP idempotent + secret | `VALIDEE_SANDBOX` | reprise apres panne token | closeout secret v1 + OTP reel 2026-07-13 | aucune, passer H4 |
| H4 | Revocation admin | `VALIDEE_SANDBOX` | claims + registry + tokens revoques | closeout registre UID 2026-07-13 | preuve destructive jetable reportee H8 |
| H5 | Domaine/RP ID | `BLOQUEE_PRODUCTION` | domaine final et recettes WebAuthn | domaine non achete; non bloquant pour la presentation sandbox | conserver le runbook de bascule et attendre la validation cliente |
| H6 | Region europe-west1 | `EN_COURS_SOAK` | zero copie Auth us-central1 | E2E passkey + OTP europe-west1 valides le 2026-07-13, copies US conservees | mesurer une fenetre post-rollout complete puis traiter le trigger Auth |
| H7 | Email transactionnel/DNS | `PREPROD_CODE_READY` | Gmail retire + DNS valide en production | runtime Gmail/Resend centralise sur tous les flux, secret v1, tests `9/9` et gate Auth Node 22 `53/53`; aucun E2E Resend reel | garder Gmail actif pour la demo; canari `resend.dev` facultatif et limite; domaine final requis pour clients/DNS |
| H8 | Closeout preprod puis production | `PREPROD_READY` | presentation sandbox puis aucun P1 production | closeout 2026-07-13: OTP + passkey post-deploiement, session UI coherente et logs structures | reprendre les seules gates production differees apres domaine/soak |

## 4. Baseline figee au 2026-07-12

### Git et deploiement

- branche: `main`;
- commit de reference: `f0b8331`;
- libelle: `feat(auth): fiabiliser les connexions OTP et passkey`;
- App Hosting sandbox: `secondevie-next-sandbox`;
- URL sandbox: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`;
- runtime Functions: Node 22;
- region client Functions: `europe-west1`;
- regions serveur Auth encore publiees: `us-central1` et `europe-west1`.

### Fonctionnel deja prouve

- AuthStore unique et un seul `onIdTokenChanged()`;
- header `Quitter` et menu `Mon espace` synchronises;
- OTP reel Gmail execute avec succes sur sandbox;
- connexion OTP admin possible sans reecrire son role client;
- creation passkey Windows Hello executee physiquement sur sandbox;
- reconnexion rapide affichee apres marqueur local;
- premiere connexion email-first sans bouton passkey generique;
- fallback OTP visible;
- App Check refuse un appel passkey sans token;
- origines passkey exactes, sans wildcard `.hosted.app`;
- TTL Firestore active pour les groupes temporaires selon les preuves de phase 3;
- navigation mega menu vers `/mes-commandes` masquee jusqu'au changement de route.

### Tests au 2026-07-12

| Suite | Resultat | Nature de la preuve | Limite |
| --- | --- | --- | --- |
| AuthStore | `4/4 PASS` | contrat source | peu comportemental |
| OTP unifie | `3/3 PASS` | contrat source | idempotence cible traitee en H3 |
| transitions backend | `2/2 PASS` | execution avec mocks Firebase Admin | baseline avant H3/H4 |
| passkey client | `4/4 PASS` | contrat source | pas de vraie ceremonie automatisee |
| passkey serveur | `7/7 PASS` | contrat source | UV non exigee par le contrat actuel |
| claims admin | `2/2 PASS` | trigger execute avec mocks Firebase v1/Admin | cas verifies positifs a enrichir avec H2/H4 |

### Suivi des findings

| ID | Priorite | Statut | Evidence / decision |
| --- | --- | --- | --- |
| F-UV-001 | P1 | resolu sandbox | H1 exige UV a l'inscription et a l'authentification |
| F-ADMIN-001 | P1 | resolu sandbox | H2 impose AAL2 et une authentification forte recente aux actions sensibles |
| F-OTP-001 | P1 | resolu sandbox | H3 reserve puis finalise l'OTP avec reprise idempotente |
| F-REVOKE-001 | P1 | resolu sandbox | H4 desactive le registre avant claims et `revokeRefreshTokens()` |
| F-DOMAIN-001 | P1 gate | bloque | domaine/RP ID final non fixes; traiter H5 apres achat |
| F-REGION-001 | P1 | ouvert | deux regions restent actives; traiter H6 |
| F-MAIL-001 | P1 | ouvert | Gmail SMTP reste actif; traiter H7 avec domaine et provider |
| F-TEST-001 | P2 | resolu sandbox | contrats claims repares et integres a `test:auth` en H0 |

## 5. Phase H0 - Baseline et contrats

Statut: `VALIDEE_SANDBOX`

### Checklist

- [x] identifier les suites Auth;
- [x] executer sous Node `22.23.1`;
- [x] constater les quatre suites vertes;
- [x] constater l'echec du runner claims;
- [x] ajouter `runWith()` au mock Firebase Functions;
- [x] ajouter un script agregateur `test:auth`;
- [x] ajouter tests comportementaux OTP/revocation;
- [x] sauvegarder une sortie finale sans secret;
- [x] marquer H0 `VALIDEE_SANDBOX`.

### Preuves

#### 2026-07-12 - Audit manuel initial

- commande: cinq appels `node --test` sous Node 22;
- resultat:
  - AuthStore `4/4`;
  - OTP `3/3`;
  - passkey client `4/4`;
  - passkey serveur `7/7`;
  - claims admin: echec `functions.runWith is not a function`;
- secret affiche: aucun;
- conclusion: H0 reste ouverte.

#### 2026-07-13 - Gate finale H0

- branche: `codex/auth-production-hardening`;
- commit de depart: `f0b8331854dfcf280b2961ccac89fbd586a3ab88`;
- Node: `22.23.1`;
- Firebase CLI: `15.23.0`;
- commande: `npm run test:auth`;
- resultat: `22/22 PASS`, `0 FAIL`, duree TAP `181.3925 ms`;
- couverture ajoutee:
  - consommation OTP valide puis creation du Custom Token;
  - conservation du role d'un utilisateur existant;
  - retrait admin: claims, profil Firestore, whitelist et audit;
  - chargement reel du trigger `runWith(...).auth.user().onCreate(...)`;
- inventaire cloud en lecture seule: Functions Auth Node `22`, encore presentes en `europe-west1` et `us-central1`;
- baseline UI reutilisee: ouverture modale cold p50 `1 181 ms`, p95 `1 215 ms`; warm p50 `120 ms`, p95 `216 ms`;
- limite assumee: aucune nouvelle mesure OTP/passkey physique en H0, car cette phase ne change pas le runtime;
- secret ou donnee personnelle affichee: aucun;
- closeout: [`AUTH_H0_BASELINE_CONTRACTS_CLOSEOUT_2026-07-13.md`](./AUTH_H0_BASELINE_CONTRACTS_CLOSEOUT_2026-07-13.md);
- conclusion: gate H0 satisfaite sur sandbox.

### Prochaine action exacte

Demarrer H1 en imposant la User Verification dans les options et les verifications WebAuthn serveur, puis ajouter les contrats de refus sans UV.

### Rollback disponible

Revenir uniquement sur le mock si le nouveau test ne represente pas l'API v1 utilisee par `grantAdmin.js`.

## 6. Phase H1 - UV passkey obligatoire

Statut: `VALIDEE_SANDBOX`

### Checklist implementation

- [x] inscription: `userVerification: 'required'`;
- [x] verification inscription: `requireUserVerification: true`;
- [x] authentification: `userVerification: 'required'`;
- [x] verification authentification: `requireUserVerification: true`;
- [x] defense en profondeur sur `registrationInfo/authenticationInfo.userVerified`;
- [x] logs structures limites a `ceremony`, `uv` et nom d'erreur;
- [x] erreur UV generique et traduite;
- [x] fallback OTP conserve;
- [x] deploiement sandbox des quatre Functions dans les deux regions temporaires;
- [x] reconnexion sandbox avec credential existante et UV serveur obligatoire;
- [x] synchronisation `Quitter` + `Mon espace` apres reconnexion;
- [x] creation d'une nouvelle passkey Windows Hello apres le deploy H1;
- [x] deconnexion puis reconnexion avec cette nouvelle credential;
- [ ] recette Chrome, Edge et Brave sur Windows avant validation production H8;
- [ ] recette Safari/iOS ou macOS avant promesse multi-plateforme;
- [x] closeout H1 et statut `VALIDEE_SANDBOX`.

### Preuves du 2026-07-13

- tests locaux Node `22.23.1`: `23/23 PASS`, `0 FAIL`, TAP `139.695 ms`;
- syntaxe Functions: `node --check functions/src/auth/passkeys.js` vert;
- deploiement cible:
  - `generatePasskeyRegistrationOptions`;
  - `verifyPasskeyRegistration`;
  - `generatePasskeyAuthenticationOptions`;
  - `verifyPasskeyAuthentication`;
- regions mises a jour: `europe-west1` et `us-central1`, conformement au rollout transitoire avant H6;
- runtime deploye: Node 22, Functions v1;
- test reel sandbox:
  - `Connexion rapide sur cet appareil` executee avec une credential existante;
  - succes impossible sans `authenticationInfo.userVerified === true` cote serveur;
  - modale fermee sans relance automatique;
  - header `Quitter` observe;
  - mega menu `Mon espace` observe;
  - deconnexion executee;
  - `Recevoir un code par email` et `Recevoir mon code` observes;
- UI modifiee: non, contrat email-first conserve;
- secret, PIN, assertion WebAuthn ou donnee personnelle copiee dans la documentation: aucun.

#### Recette physique utilisateur finale

- nouvelle passkey Windows Hello activee apres le deploiement H1;
- PIN saisi localement par l'utilisateur, jamais transmis a l'agent;
- deconnexion puis reconnexion rapide terminees;
- controle live apres reconnexion:
  - route `/mes-commandes`;
  - titre `Vos commandes, simplement.`;
  - bouton `Quitter` present;
  - acces aux donnees du compte fonctionnel;
  - role administrateur conserve visuellement;
- aucune boucle de popup signalee;
- fallback OTP deja prouve avant la recette;
- closeout: [`AUTH_H1_PASSKEY_UV_CLOSEOUT_2026-07-13.md`](./AUTH_H1_PASSKEY_UV_CLOSEOUT_2026-07-13.md).

### Incident de deploiement sans impact

- premier filtre sans codebase: aucun matching, aucune mutation;
- second essai: timeout local de decouverte a 10 secondes, aucun upload/deploiement;
- correction: `functions:main:<nom>` et `FUNCTIONS_DISCOVERY_TIMEOUT=30000`;
- resultat final: huit mises a jour reussies, quatre fonctions dans deux regions.

### Prochaine action exacte

Demarrer H2: definir les claims d'assurance emis exclusivement par le serveur, puis remplacer les controles admin sensibles par un step-up fort recent sans modifier l'interface de connexion commune.

### Compatibilite restante avant production

- Chrome, Edge et Brave sur Windows;
- Safari/iOS ou macOS si une compatibilite Apple est annoncee;
- ces recettes ne rouvrent H1 que si une incompatibilite UV est constatee;
- elles sont inscrites dans la gate integree H8.

### Donnees/migrations

- aucune migration automatique de cle publique;
- credentials ne supportant pas UV a reenroler;
- conserver les credentials existantes tant qu'elles ne sont pas prouvees incompatibles;
- toutes les credentials sandbox restent jetables avant H5.

### Preuves a joindre

- sortie tests;
- noms et versions navigateurs;
- type authentificateur;
- resultat creation/reconnexion;
- erreur observee sans UV;
- logs serveur rediges.

## 7. Phase H2 - Step-up administrateur

Statut: `VALIDEE_SANDBOX`

### Decisions a prendre

- [x] confirmer AAL1 client et AAL2 admin;
- [x] definir liste exhaustive des actions sensibles;
- [x] definir passkey UV et Google comme methodes fortes;
- [ ] confirmer MFA obligatoire sur le compte Google proprietaire;
- [ ] decider si Identity Platform/TOTP est active plus tard;
- [ ] definir recuperation proprietaire.

### Checklist implementation

- [x] claims `authMethod`, `authAssurance`, `userVerified` emis serveur;
- [x] helper `getAuthAssurance()`;
- [x] helper `checkStrongAdmin()`;
- [x] helper `checkRecentStrongAdmin()`;
- [x] OTP admin limite a l'espace client;
- [x] intercepteur UI `/admin` demandant step-up;
- [x] retour `/admin` apres succes;
- [x] refresh ID Token/AuthStore;
- [x] callables sensibles migres;
- [x] tests autorise/refuse;
- [x] closeout H2.

### Matrice d'actions a remplir

| Action | Claim requis | Assurance | Fraicheur | Registry H4 |
| --- | --- | --- | --- | --- |
| voir dashboard agregats | admin | AAL2 | standard | active |
| exporter utilisateurs | superAdmin | AAL2 | <= 15 min | active |
| ajouter admin | superAdmin | AAL2 | <= 15 min | active |
| retirer admin | superAdmin | AAL2 | <= 15 min | active |
| rembourser | admin/superAdmin | AAL2 | <= 15 min | active |
| changer configuration | superAdmin | AAL2 | <= 15 min | active |

### Acces potentiellement requis

- verification MFA du compte Google proprietaire;
- decision Identity Platform et cout;
- appareil passkey du proprietaire.

### Preuves du 2026-07-13

- tests Auth Node 22: `29/29 PASS`, `0 FAIL`, TAP `172.0119 ms`;
- build Next production: succes en 74 secondes;
- Functions H2 ciblees deployees, dont Auth dans `europe-west1` et `us-central1` transitoire;
- Rules Firestore et Storage compilees puis publiees;
- App Hosting deploye depuis une source isolee excluant les changements de transition de route;
- barriere AAL1 observee sur `/admin`;
- step-up passkey Windows Hello effectue physiquement;
- dashboard et donnees admin charges apres le step-up;
- aucune boucle de modale;
- aucun PIN, token ou assertion WebAuthn expose;
- closeout: [`AUTH_H2_ADMIN_STEP_UP_CLOSEOUT_2026-07-13.md`](./AUTH_H2_ADMIN_STEP_UP_CLOSEOUT_2026-07-13.md).

### Prochaine action exacte

Demarrer H3 en concevant la machine d'etat OTP idempotente et le secret `OTP_HMAC_SECRET`, puis tester les pannes apres verification sans stocker le Custom Token.

## 8. Phase H3 - OTP idempotent et secret dedie

Statut: `VALIDEE_SANDBOX`

### Checklist secret

- [x] generer `OTP_HMAC_SECRET` aleatoire;
- [x] creer Secret Manager sans exposer la valeur;
- [x] accorder l'acces aux seules Functions OTP;
- [x] ajouter reference dans le code;
- [x] retirer `GMAIL_PASSWORD` de `hashOtp()`;
- [x] definir rotation et compatibilite courte.

### Checklist machine d'etat

- [x] schema operation documente;
- [x] `responseHash` defini;
- [x] transition active -> issuing atomique;
- [x] creation utilisateur idempotente;
- [x] UID persiste sans PII inutile;
- [x] mint token repris une fois;
- [x] token jamais stocke;
- [x] hash different refuse;
- [x] expiration dix minutes alignee;
- [x] TTL Firestore conserve;
- [x] tests crash windows;
- [x] tests concurrence;
- [x] closeout H3.

### Scenarios de test a enregistrer

| Scenario | Injection | Resultat attendu | Resultat reel |
| --- | --- | --- | --- |
| panne createUser/lookup | mock reject une fois | reprise meme OTP | PASS |
| panne createCustomToken | mock reject une fois | reprise bornee | PASS |
| double verification | deux appels simultanes | un resultat logique | PASS, second appel refuse pendant lease |
| reponse modifiee | hash different | refus | PASS |
| operation expiree | expiration alignee au code | nouveau code requis | PASS contrat |

### Preuves du 2026-07-13

- `OTP_HMAC_SECRET` version 1 cree avec 48 octets aleatoires, valeur jamais affichee;
- replication Secret Manager automatique;
- IAM limite au service account runtime pour la lecture du secret;
- quatre Functions OTP deployees dans `europe-west1` et `us-central1` transitoire;
- tests Auth finaux: `32/32 PASS`, TAP `177.7834 ms`;
- OTP email reel recu et saisi localement par l'utilisateur;
- espace client charge apres Custom Token AAL1;
- `/admin` refuse cette session OTP et demande AAL2;
- closeout: [`AUTH_H3_OTP_IDEMPOTENCY_SECRET_CLOSEOUT_2026-07-13.md`](./AUTH_H3_OTP_IDEMPOTENCY_SECRET_CLOSEOUT_2026-07-13.md).

### Prochaine action exacte

Demarrer H4: registry admin par UID, revocation des refresh tokens, ordre d'ecriture idempotent et preuves de refus apres retrait.

## 9. Phase H4 - Revocation admin

Statut: `VALIDEE_SANDBOX`

### Checklist data model

- [x] choisir collection registry par UID;
- [x] schema `active/role/revokedAt`;
- [x] politique lecture Rules;
- [x] cout Rules borne a un document dependant par requete admin;
- [x] migration des admins existants;
- [x] proprietaire protege.

### Checklist revocation

- [x] step-up H2 exige;
- [x] registry inactive en premier;
- [x] claims retires;
- [x] `revokeRefreshTokens(uid)` appele;
- [x] profil utilisateur preserve;
- [x] whitelist/archive mise a jour;
- [x] audit started/completed;
- [x] erreurs partielles reprenables;
- [x] double revocation idempotente;
- [x] tests Rules;
- [x] tests callable;
- [x] closeout H4.

### Preuves requises

- token avant revocation;
- timestamp revocation;
- refus lecture admin apres registry inactive;
- refus callable sensible;
- nouvelle connexion sans claim admin;
- donnees commandes/client conservees.

### Preuves du 2026-07-13

- gate Auth Node 22: `40/40 PASS`, `0 FAIL`;
- tests comportementaux: idempotence, panne refresh token, owner protege, migration sans reactivation;
- registre `sys_admin_access`: `1` document actif, `0` inactif, sans UID/PII affiche;
- callable de migration europe-west1: Auth et App Check valides, HTTP `200`;
- Rules Firestore compilees et publiees;
- dashboard encore autorise apres Rules: `23` commandes, `5 545 EUR`;
- Functions H4 et App Hosting sandbox deployes;
- aucun PIN, OTP, token, UID ou secret conserve dans la documentation;
- closeout: [`AUTH_H4_ADMIN_REVOCATION_CLOSEOUT_2026-07-13.md`](./AUTH_H4_ADMIN_REVOCATION_CLOSEOUT_2026-07-13.md).

### Report non bloquant vers H8

La revocation destructive d'un second admin reel n'a pas ete executee car le sandbox ne dispose actuellement que d'un registre admin actif. Elle sera rejouee avec un compte jetable afin de prouver le refus nouvelle session sans risquer le seul acces administrateur.

### Prochaine action exacte

H5 restant bloquee par l'absence de domaine final, demarrer H6 par un inventaire regional et une mesure de trafic en lecture seule. Ne supprimer aucune Function avant la preuve de zero trafic legitime.

## 10. Phase H5 - Domaine final et RP ID

Statut: `BLOQUEE_PRODUCTION`

### Blocage

Le domaine client n'est pas encore achete. Aucun choix de RP ID production ne doit etre fige par supposition.

Ce blocage est accepte pour l'objectif `PREPROD_READY`: la sandbox `hosted.app` reste le support de presentation et de recette interne. Les passkeys qui y sont creees restent jetables et seront reenrolees apres validation cliente et achat du domaine.

### Informations a obtenir

- [ ] domaine achete;
- [ ] acces DNS;
- [ ] apex choisi;
- [ ] hostname canonique choisi;
- [ ] strategie `www`/redirection;
- [ ] AuthDomain same-site choisi;
- [ ] projet Firebase production/separation decide;
- [ ] date de bascule.

### Checklist configuration

- [ ] App Hosting custom domain;
- [ ] certificat HTTPS actif;
- [ ] `NEXT_PUBLIC_SITE_URL`;
- [ ] `PASSKEY_ALLOWED_ORIGINS`;
- [ ] Authorized Domains Firebase;
- [ ] Google OAuth origins;
- [ ] Google OAuth redirect URIs;
- [ ] App Check domaine final;
- [ ] RP ID code et documentation;
- [ ] tests PWA/iOS redirect;
- [ ] reenrolement passkeys production;
- [ ] closeout H5.

### Rappel irreversible

Les passkeys `hosted.app` ne fonctionneront pas automatiquement sur le domaine final. Le journal devra enregistrer la campagne de reenrolement, pas une migration fictive.

## 11. Phase H6 - Convergence regionale

Statut: `EN_COURS_SOAK`

### Checklist inventaire

- [x] lister Functions Auth europe-west1;
- [x] lister Functions Auth us-central1;
- [x] comparer versions et hashes;
- [x] comparer les references de secrets sans lire leur valeur;
- [x] comparer les contrats App Check par source et hash deploye;
- [x] extraire trafic sept jours;
- [x] identifier appels directs;
- [x] separer Functions catalogue non Auth.

### Checklist migration

- [x] code `regionalFunctions()` europe-west1 seulement;
- [x] deploy Functions primaires;
- [x] E2E OTP;
- [x] E2E passkey;
- [ ] monitoring soak;
- [ ] zero trafic legitime legacy;
- [ ] liste de suppression approuvee;
- [ ] suppression explicite us-central1;
- [ ] verification post-suppression;
- [ ] closeout H6.

### Tableau inventaire a remplir

| Function | europe-west1 | us-central1 | Trafic legacy | Decision |
| --- | --- | --- | --- | --- |
| sendCustomerLoginOtp | actif, Node 22 | actif, Node 22 | 2 executions sur la baseline 7 j | conserver US pendant soak |
| verifyCustomerLoginOtp | actif, Node 22 | actif, Node 22 | 2 executions sur la baseline 7 j | conserver US pendant soak |
| generatePasskeyRegistrationOptions | actif, Node 22 | actif, Node 22 | 2 executions sur la baseline 7 j | conserver US pendant soak |
| verifyPasskeyRegistration | actif, Node 22 | actif, Node 22 | 2 executions sur la baseline 7 j | conserver US pendant soak |
| generatePasskeyAuthenticationOptions | actif, Node 22 | actif, Node 22 | 2 executions sur la baseline 7 j | conserver US pendant soak |
| verifyPasskeyAuthentication | actif, Node 22 | actif, Node 22 | aucune serie legacy retournee | conserver jusqu'a gate globale |

### Rollout additif du 2026-07-13

- client App Hosting: `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=europe-west1`;
- catalogue public: `PUBLIC_CATALOG_REGION=us-central1`, volontairement hors migration privee;
- `regionalFunctions()` ne declare plus que `europe-west1` dans la source finale;
- 38 endpoints prives cibles existent dans `europe-west1` et `us-central1` pendant le soak;
- 38/38 utilisent Node 22;
- aucun endpoint cible ne manque dans une region;
- aucun hash ne diverge entre les deux copies au moment du controle;
- references OTP comparees sans valeur: `GMAIL_EMAIL:v2`, `GMAIL_PASSWORD:v4`, `OTP_HMAC_SECRET:v1` dans les deux regions;
- suite locale apres convergence: `44/44 PASS`, `0 FAIL`;
- App Hosting sandbox publie avec succes;
- verification HTTP du site: statut `200`, 13/13 scripts initiaux charges;
- aucune Function US n'a ete supprimee.

### Baseline trafic sept jours avant soak

Les compteurs Cloud Monitoring `execution_count` ont retourne du trafic legacy sur plusieurs copies Auth. Une absence de serie est notee comme absence observee, pas comme preuve definitive de zero.

| Function | europe-west1 | us-central1 |
| --- | ---: | ---: |
| ensureAdminAccessRegistry | 10 | aucune serie |
| generatePasskeyAuthenticationOptions | 92 | 2 |
| generatePasskeyRegistrationOptions | 30 | 2 |
| sendCustomerLoginOtp | 36 | 2 |
| verifyCustomerLoginOtp | 34 | 2 |
| verifyPasskeyAuthentication | 26 | aucune serie |
| verifyPasskeyRegistration | 10 | 2 |

Conclusion: la gate de suppression n'etait pas satisfaite le 2026-07-13. La nouvelle fenetre de soak commence apres le rollout H6 du 2026-07-13. Le controle suivant doit mesurer une fenetre complete post-rollout et distinguer les appels legitimes des sondes ou tests.

### Exceptions de cutover encore ouvertes

- `grantAdminOnAuth` reste temporairement en `us-central1`: un trigger Auth ne doit pas etre duplique sans verifier son idempotence et la strategie de bascule;
- les webhooks Stripe et les endpoints SEO directs restent dans leur region actuelle, car leur migration exige une coordination externe distincte;
- `syncSessionBeacon` est publie dans les deux regions pendant le soak, mais le client construit maintenant son URL avec `functionsRegion` et cible donc `europe-west1`;
- le closeout H6 et toute suppression US restent interdits avant la gate zero trafic.

### E2E regional du 2026-07-13

- passkey Windows Hello executee physiquement par l'utilisateur, avec PIN saisi localement et jamais transmis;
- apres la connexion passkey: `Se deconnecter`, `Mon espace` et `Admin.` observes dans le meme etat de session;
- traces Cloud de la ceremonie passkey: appels observes sur `generatePasskeyAuthenticationOptions` et `verifyPasskeyAuthentication` en `europe-west1`, aucun appel US correspondant dans la fenetre de controle;
- OTP envoye puis saisi localement par l'utilisateur, sans code copie dans le journal;
- `sendCustomerLoginOtp`: succes HTTP `200` en `europe-west1`, duree serveur observee `4 978 ms`;
- `verifyCustomerLoginOtp`: succes HTTP `200` en `europe-west1`, duree serveur observee `4 446 ms`;
- apres la connexion OTP: `Se deconnecter`, `Mon espace` et `Admin.` observes, confirmant la synchronisation AuthStore/header/menu;
- recherche explicite des traces `verifyCustomerLoginOtp` en `us-central1` sur la fenetre de trente minutes: aucun resultat;
- conclusion: le routage client H6 est valide de bout en bout pour passkey et OTP; cette preuve ponctuelle ne remplace pas la fenetre de soak requise avant suppression.

## 12. Phase H7 - Email transactionnel et DNS

Statut: `PREPROD_CODE_READY`

Closeout intermediaire: [`AUTH_H7_TRANSACTIONAL_EMAIL_PREPROD_CLOSEOUT_2026-07-13.md`](./AUTH_H7_TRANSACTIONAL_EMAIL_PREPROD_CLOSEOUT_2026-07-13.md)

### Decision provider

| Critere | Postmark | Resend | SendGrid/Mailgun | Decision |
| --- | --- | --- | --- | --- |
| RGPD/DPA | non retenu | DPA disponible, revue juridique finale requise | non retenu | Resend sous reserve de revue avant production |
| webhooks | non retenu | a configurer et verifier par signature | non retenu | Resend cible, preuve encore requise |
| idempotence | non retenu | cle API `Idempotency-Key`, retention 24 h | non retenu | Resend conforme au contrat cible |
| cout | 100 emails/mois gratuits puis palier payant | 3 000 emails/mois gratuits, 100/jour | offre variable | Resend adapte au lancement |
| delivrabilite | reconnue, non retenue pour le cout initial | SPF/DKIM requis, DMARC a ajouter | non retenu | a mesurer sur Gmail/Outlook/iCloud |

### Checklist provider

- [x] compte cree;
- [ ] domaine expediteur verifie;
- [x] API key Secret Manager;
- [x] adaptateur email implemente;
- [x] timeout/retry borne;
- [x] idempotency key;
- [ ] webhook signe;
- [ ] hard bounce gere;
- [ ] OTP absent des logs;
- [ ] Gmail retire;
- [x] selection provider centralisee avec Gmail par defaut;
- [x] tous les flux transactionnels raccordes au runtime commun;

### Preparation implementee le 2026-07-13

- adaptateur commun: `functions/src/email/transactionalEmail.js`;
- fournisseur actif: `gmail`, sans changement de secret ni de comportement de production;
- fournisseur cible prepare: `resend` via `POST https://api.resend.com/emails`;
- aucun SDK supplementaire: utilisation du `fetch` natif Node 22;
- timeout Resend borne entre 1 et 10 secondes, valeur par defaut 5 secondes;
- deux tentatives maximum uniquement pour timeout, erreur reseau, HTTP `408`, `429` ou `5xx` transitoire;
- meme `Idempotency-Key` reutilisee pendant le retry; la cle ne contient qu'un type de flux, un hash email et l'expiration de l'operation;
- `customerLoginOtp`, `guestCheckoutOtp` et `orderEmails` utilisent le runtime commun et ne dependent plus directement de Nodemailer;
- `TRANSACTIONAL_EMAIL_PROVIDER` selectionne le transport et conserve `gmail` par defaut;
- `RESEND_FROM_EMAIL` est obligatoire en mode Resend et reste volontairement vide avant verification du domaine;
- commandes, remboursements, expedition, livraison et diagnostic possedent des cles d'idempotence stables et non sensibles;
- une configuration Resend incomplete echoue explicitement au lieu de revenir silencieusement sur Gmail;
- compte Resend cree le 2026-07-13;
- cle Resend limitee a `Sending access`; aucun droit d'administration provider n'est accorde au runtime;
- cle API transferee directement dans Google Secret Manager sous `RESEND_API_KEY`, version `1`, sans ecriture dans le depot ni dans la documentation;
- aucun domaine expediteur configure et aucun envoi Resend declenche pendant cette sous-phase.

### Preuves locales

- Node `22.23.1`;
- tests adaptateur: `6/6 PASS`;
- gate Auth complete: `50/50 PASS`, `0 FAIL`, TAP `230.9056 ms`;
- syntaxe Node des deux flux OTP et de l'adaptateur: valide;
- `git diff --check`: valide, uniquement des avertissements de normalisation LF/CRLF;
- aucun e-mail reel envoye et aucun secret affiche.
- validation complementaire apres migration complete: syntaxe des quatre modules validee sous Node `24.14.0`, tests adaptateur/runtime et logs `9/9 PASS`;
- validation canonique: gate Auth complete sous Node `22.23.1`, `53/53 PASS`, `0 FAIL`, TAP `236.1126 ms`;

### Checklist DNS

- [ ] SPF publie et valide;
- [ ] DKIM publie et valide;
- [ ] DMARC `p=none` + rapports;
- [ ] analyse rapports;
- [ ] passage `quarantine`;
- [ ] passage `reject` apres validation;
- [ ] domaine bounce/return-path;
- [ ] alignement SPF ou DKIM;
- [ ] tests Gmail;
- [ ] tests Outlook;
- [ ] tests iCloud si possible;
- [x] closeout H7-PREPROD;
- [ ] closeout H7.

### Metriques a enregistrer

- p50/p95 appel API provider;
- p50/p95 livraison boite;
- taux delivered;
- taux soft bounce;
- taux hard bounce;
- plaintes;
- erreurs quota;
- retry count.

## 13. Phase H8 - Validation et closeout production

Statut: `PREPROD_READY`

Rapport de readiness: [`AUTH_H8_PREPROD_READINESS_2026-07-13.md`](./AUTH_H8_PREPROD_READINESS_2026-07-13.md)
Closeout preproduction: [`AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md`](./AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md)

### Checklist intermediaire H8-PREPROD

- [x] H0 a H4 validees sandbox;
- [x] OTP, passkey, fallback, header/menu, espace client et step-up admin prouves sur sandbox;
- [x] routage Auth `europe-west1` prouve par E2E;
- [x] compte Resend, cle `Sending access`, secret cloud et adaptateur disponibles;
- [x] code de selection provider et migration des derniers flux email termine, sans activation Resend;
- [x] gate Auth complete relancee sur le changeset final sous Node 22, `53/53 PASS`;
- [x] tests negatifs independants du domaine inclus dans la gate Auth;
- [x] smoke de presentation Chrome/Edge/Brave documente, `3/3 PASS`;
- [x] mesures ponctuelles sandbox enregistrees et dette p50/p95 serveur explicitement acceptee pour la presentation;
- [x] runbooks domaine/RP ID, Resend/DNS et rollback documentes;
- [x] closeout `PREPROD_READY` cree.

Les cases H5, DNS/delivrabilite H7, suppression regionale definitive, Safari/Face ID sur domaine final et recette cliente restent dans la checklist production ci-dessous.

### Checklist finale

- [ ] H0 validee;
- [ ] H1 validee production;
- [ ] H2 validee production;
- [ ] H3 validee production;
- [ ] H4 validee production;
- [ ] H5 validee production;
- [ ] H6 validee production;
- [ ] H7 validee production;
- [ ] matrice navigateurs complete;
- [ ] tests negatifs complets;
- [ ] SLO mesures;
- [ ] dashboards/alertes actifs;
- [ ] runbooks recuperation/revocation/email;
- [ ] rollback teste;
- [ ] recette proprietaire;
- [ ] recette cliente;
- [ ] closeout final cree;
- [ ] roadmap historique mise a jour.

## 14. Blocages et acces requis

| Date | Phase | Besoin | Privilege minimal | Responsable | Statut |
| --- | --- | --- | --- | --- | --- |
| 2026-07-12 | H5 | achat/choix domaine final | proprietaire domaine | utilisateur | bloque |
| a definir | H5/H7 | acces DNS | edition enregistrements DNS | utilisateur | en attente |
| 2026-07-13 | H7 | compte provider email | admin provider | utilisateur | obtenu; compte et cle crees |
| a definir | H2 | preuve MFA Google proprietaire | action utilisateur locale | utilisateur | en attente |
| 2026-07-13 | H1/H8 | Windows Hello sandbox | validation locale, jamais partage PIN | utilisateur | obtenu |
| a definir | H5/H8 | Face ID/Safari domaine final | validation locale, jamais partage secret | utilisateur | en attente production |

## 15. Journal chronologique

### 2026-07-12 - Creation du fil d'Ariane

- type: documentation et planification;
- action: creation roadmap de hardening production et journal lie;
- source: audit manuel du systeme Auth apres merge `f0b8331`;
- code runtime modifie: non;
- cloud modifie: non;
- secrets consultes/copier: aucun;
- resultat: phases H0 a H8 definies, H0 en cours, H5 bloquee;
- prochaine action: reparer le test claims admin H0.

### 2026-07-13 - Phase H0 validee sur sandbox

- statut avant: `EN_COURS`;
- objectif: rendre tous les contrats Auth executables avant le hardening runtime;
- fichiers modifies: `tests/auth-claims.test.cjs`, `tests/auth-backend-transitions.test.cjs`, `package.json`, documentation Auth;
- ressources cloud modifiees: aucune;
- commandes executees: runner Auth Node 22, Firebase CLI `--version`, `functions:list` en lecture seule;
- tests/resultats: `22/22 PASS`, `0 FAIL`;
- mesures: TAP `181.3925 ms`; baseline UI historique conservee;
- erreurs rencontrees: terminal Codex sans Node dans le PATH, runtime Node 22 appele explicitement;
- secrets exposes: aucun;
- rollback disponible: retirer le runner, le nouveau fichier de test et restaurer le mock initial;
- statut apres: `VALIDEE_SANDBOX`;
- gate satisfaite: oui;
- blocage/acces requis: aucun pour H1 code; interaction locale requise plus tard pour la recette Windows Hello/Face ID;
- prochaine action exacte: H1, exiger `userVerification: 'required'` et `requireUserVerification: true` puis tester les refus sans UV.

### 2026-07-13 - Phase H1 implementee et deployee, validation partielle

- statut avant: `NON_DEMARREE`;
- objectif: rendre la verification locale obligatoire pour inscription et authentification passkey;
- fichiers modifies: `functions/src/auth/passkeys.js`, `tests/passkey-server-hardening.test.cjs`, journal Auth;
- ressources cloud modifiees: quatre Functions passkey mises a jour en `europe-west1` et `us-central1`;
- commandes executees: `npm run test:auth`, syntax check, deploy cible Firebase;
- tests/resultats: `23/23 PASS`, reconnexion sandbox reelle reussie;
- preuve UI: `Quitter`, `Mon espace`, fallback email, aucune boucle de modale;
- erreurs rencontrees: filtre codebase manquant puis timeout local de decouverte; corriges sans deploiement partiel;
- secrets exposes: aucun;
- rollback disponible: redeployer la version precedente des quatre Functions;
- statut apres: `EN_VALIDATION`;
- gate satisfaite: partiellement, authentification et fallback prouves; nouvel enrollement et matrice navigateurs restants;
- blocage/acces requis: presence utilisateur pour Windows Hello et acces aux navigateurs locaux; aucun PIN ne doit etre transmis;
- prochaine action exacte: nouvel enrollement Windows Hello, reconnexion, puis Chrome/Edge/Brave.

### 2026-07-13 - Phase H1 validee sur sandbox

- statut avant: `EN_VALIDATION`;
- objectif: prouver l'enrolement et la reconnexion Windows Hello avec UV serveur obligatoire;
- code runtime modifie pendant cette recette: non;
- ressources cloud modifiees pendant cette recette: aucune;
- test physique: nouvelle passkey, deconnexion, reconnexion rapide;
- preuve live: `/mes-commandes`, `Quitter`, page compte chargee et role conserve;
- fallback email: deja observe apres deconnexion;
- boucle popup: aucune signalee;
- secrets/PIN exposes: aucun;
- statut apres: `VALIDEE_SANDBOX`;
- gate satisfaite: oui pour sandbox;
- limite production: matrice Chrome/Edge/Brave et Apple reportee H8;
- closeout: `AUTH_H1_PASSKEY_UV_CLOSEOUT_2026-07-13.md`;
- prochaine action exacte: H2, assurance forte et step-up administrateur.

### 2026-07-13 - Phase H2 validee sur sandbox

- statut avant: `NON_DEMARREE`;
- objectif: interdire l'administration par OTP seul tout en conservant la modale commune;
- fichiers modifies: helpers securite, mint OTP/passkey, callables admin, Rules, AuthStore, AuthContext, ile admin, tests et documentation;
- ressources cloud modifiees: Functions H2 ciblees, Firestore Rules, Storage Rules et App Hosting sandbox;
- commandes executees: `npm run test:auth`, `npm run build`, deploys Firebase cibles;
- tests/resultats: `29/29 PASS`, build Next vert, Rules compilees;
- preuve physique: barriere admin AAL1 puis Windows Hello et dashboard charge;
- erreur rencontree: premiere ceremonie Windows Hello expiree car l'utilisateur etait absent; relance manuelle reussie sans elevation intermediaire;
- isolation deploy: changements concurrents de transition de route exclus par staging depuis `HEAD` et comparaison de hash;
- secrets/PIN exposes: aucun;
- rollback disponible: version precedente par couche, sans jamais autoriser OTP seul comme fallback admin;
- statut apres: `VALIDEE_SANDBOX`;
- gate satisfaite: oui sur sandbox;
- limite production: MFA du compte Google proprietaire a prouver manuellement dans H8;
- closeout: `AUTH_H2_ADMIN_STEP_UP_CLOSEOUT_2026-07-13.md`;
- prochaine action exacte: H3, OTP idempotent et secret HMAC dedie.

### 2026-07-13 - Phase H3 validee sur sandbox

- statut avant: `NON_DEMARREE`;
- objectif: permettre une reprise OTP bornee et separer cryptographie OTP/SMTP;
- fichiers modifies: secrets, OTP client/checkout, tests et documentation;
- ressources cloud modifiees: Secret Manager et huit instances de quatre Functions OTP;
- secret: version 1 generee en memoire, valeur jamais affichee, IAM runtime uniquement;
- tests/resultats: `32/32 PASS`, pannes user/mint, concurrence, rejeu et hash different;
- preuve reelle: envoi email, saisie utilisateur, espace client charge;
- cloisonnement: session OTP autorisee client et refusee sur `/admin`;
- App Hosting modifie: non;
- secrets/OTP/PII exposes: aucun;
- rollback disponible: redeploiement coordonne des quatre Functions sans supprimer le secret reference;
- statut apres: `VALIDEE_SANDBOX`;
- gate satisfaite: oui;
- closeout: `AUTH_H3_OTP_IDEMPOTENCY_SECRET_CLOSEOUT_2026-07-13.md`;
- prochaine action exacte: H4, registry UID et revocation des refresh tokens.

### 2026-07-13 - Phase H4 validee sur sandbox

- statut avant: `NON_DEMARREE`;
- objectif: rendre la revocation admin immediate pour les autorisations serveur et convergente apres panne partielle;
- fichiers modifies: registre admin, helpers d'autorisation, Rules, Functions sensibles, dashboard et tests;
- ressources cloud modifiees: Functions H4 ciblees, Firestore Rules et App Hosting sandbox;
- tests/resultats: `40/40 PASS`, registre actif confirme, Rules compilees;
- preuves: migration UID idempotente, App Check/Auth valides, dashboard admin charge apres Rules;
- limite: preuve destructive sur second admin jetable reportee H8;
- secrets/PIN/UID exposes: aucun;
- rollback disponible: versions precedentes Functions/Rules, sans reactiver un registre inactif;
- statut apres: `VALIDEE_SANDBOX`;
- gate satisfaite: oui sur sandbox;
- closeout: `AUTH_H4_ADMIN_REVOCATION_CLOSEOUT_2026-07-13.md`;
- prochaine action exacte: H6, H5 restant bloquee par le domaine final.

### 2026-07-13 - Phase H6 rollout additif et ouverture du soak

- statut avant: `NON_DEMARREE`;
- objectif: converger les Functions privees appelees par le client vers `europe-west1` sans suppression prematuree;
- fichiers modifies: runtime regional, callables Auth/admin/analytics/maintenance/commerce/email, beacon client, tests et journal;
- ressources cloud modifiees: 38 Functions privees dans les deux regions pendant le rollout et App Hosting sandbox;
- commandes executees: inventaire `gcloud`, metriques Monitoring sept jours, `npm run test:auth`, deploys Firebase cibles, verification HTTP;
- tests/resultats: `44/44 PASS`, 38/38 endpoints Europe, 38/38 US conserves, hashes identiques, Node 22;
- mesures: trafic legacy non nul sur cinq endpoints Auth dans la baseline sept jours;
- preuves: refs OTP identiques, App Hosting publie, HTTP `200`, 13/13 scripts initiaux charges;
- erreur rencontree: quota de creation europeen; cinq endpoints lourds manquants detectes par inventaire puis deployes dans un second petit lot;
- secrets exposes: aucun, seules les references/version ont ete comparees;
- rollback disponible: copies US conservees pendant le soak;
- statut apres: `EN_COURS_SOAK`;
- gate satisfaite: non, zero trafic legacy non encore prouve et trigger Auth non bascule;
- blocage/acces requis: attendre une fenetre post-rollout complete; aucune action utilisateur immediate;
- prochaine action exacte: E2E OTP/passkey Europe maintenant executes; mesurer la fenetre legacy post-rollout complete et traiter la bascule idempotente du trigger Auth avant toute liste de suppression.

### 2026-07-13 - Phase H6 E2E regional passkey et OTP

- statut avant: `EN_COURS_SOAK`;
- objectif: prouver que les deux parcours de connexion reels utilisent la region primaire europeenne apres le rollout;
- code runtime modifie pendant cette recette: non;
- ressources cloud modifiees pendant cette recette: aucune;
- recette passkey: Windows Hello valide localement, session synchronisee dans le header et le menu;
- recette OTP: envoi et saisie utilisateur reels, session synchronisee dans le header et le menu;
- preuves serveur: appels passkey et OTP observes en `europe-west1`; aucune validation OTP observee en `us-central1` dans la fenetre de controle;
- latences serveur ponctuelles: envoi OTP `4 978 ms`, validation OTP `4 446 ms`; ces valeurs incluent un parcours a froid et ne constituent pas encore un SLO statistique;
- secrets, PIN, OTP, token ou identifiant utilisateur conserves: aucun;
- statut apres: `EN_COURS_SOAK`;
- gate satisfaite: partiellement; E2E europeen valide, mais la fenetre complete zero trafic legacy et la bascule controlee de `grantAdminOnAuth` restent ouvertes;
- rollback disponible: copies US conservees, aucune suppression executee;
- prochaine action exacte: mesurer la fenetre post-rollout complete, concevoir puis valider la bascule idempotente du trigger Auth, et ne preparer la suppression US qu'apres zero trafic legitime.

### 2026-07-13 - Phase H7 choix Resend et adaptateur preparatoire

- statut avant: `NON_DEMARREE`;
- objectif: preparer le remplacement de Gmail sans activer un provider non configure et sans attendre le domaine final;
- decision: Resend retenu pour le lancement, sous reserve des validations DPA/RGPD et de la recette de delivrabilite production;
- fichiers runtime modifies: adaptateur email commun, OTP client et OTP checkout;
- fournisseur actif apres changement: Gmail;
- fournisseur cible disponible dans le code: Resend avec timeout, retry borne et idempotence obligatoire;
- ressources cloud modifiees: aucune;
- tests/resultats: adaptateur `6/6 PASS`, gate Auth `50/50 PASS`, syntaxe Node 22 valide;
- limites: compte, cle API, domaine, SPF, DKIM, DMARC, webhooks et bounces non configures;
- secrets ou e-mails reels exposes: aucun;
- rollback disponible: remettre les deux flux OTP sur leur transporteur Gmail local precedent; aucun schema de donnees ne change;
- statut apres: `EN_PREPARATION`;
- gate satisfaite: non, Gmail reste actif et les preuves provider/DNS dependent du compte et du domaine;
- prochaine action exacte: creer le compte Resend, puis enregistrer la cle en Secret Manager sans la copier dans le chat; la bascule d'envoi attendra le domaine expediteur verifie.

### 2026-07-13 - Phase H7 compte Resend et secret cloud

- statut avant: `EN_PREPARATION`, compte et secret absents;
- objectif: creer l'identite provider et stocker sa cle hors du depot sans activer l'envoi;
- ressources cloud modifiees: secret Google Secret Manager `RESEND_API_KEY`, version `1`, projet `secondevienextjsssr`;
- configuration Resend: compte cree par authentification Google et cle d'onboarding limitee a `Sending access`;
- commandes executees: creation conditionnelle du secret puis ajout de la premiere version via Google Cloud CLI;
- preuve: sorties cloud `Created secret [RESEND_API_KEY]` et `Created version [1]`;
- e-mail reel envoye: aucun;
- secret expose dans le code, le commit ou la documentation: aucun;
- domaine, SPF, DKIM, DMARC, webhook et bounces: non configures, en attente du domaine definitif;
- fournisseur runtime actif: Gmail; aucune bascule et aucun deploiement effectues;
- rollback disponible: supprimer ou desactiver la version du secret, sans effet sur le runtime Gmail actuel;
- statut apres: `EN_PREPARATION`;
- gate satisfaite: partiellement; compte et coffre sont prets, mais la delivrabilite et le retrait de Gmail ne sont pas valides;
- prochaine action exacte: conserver `RESEND_API_KEY` inutilise jusqu'au choix du domaine, puis ajouter/verifier le domaine Resend, publier SPF/DKIM/DMARC et executer une recette avant toute bascule.

### 2026-07-13 - Recentrage du closeout sur la preproduction de presentation

- decision utilisateur: "L'idee est d'arriver a un etat pre-prod de presentation du site et que toutes les plus grosses fonctionnalites soient deja codees.";
- consequence: H5 devient `BLOQUEE_PRODUCTION`, sans bloquer le closeout sandbox;
- H7 doit terminer le code dormant, la selection de provider, les derniers flux email et les runbooks sans activer Resend;
- Resend reel n'est pas encore valide: seuls l'adaptateur simule, la cle `Sending access` et le secret cloud sont prouves;
- H8 est separe en une gate `PREPROD_READY` executable maintenant et une gate `VALIDEE_PRODUCTION` differee;
- dependances reportees: domaine, AuthDomain, RP ID, reenrolement passkeys, SPF/DKIM/DMARC, delivrabilite, retrait Gmail et recette cliente;
- prochaine action exacte: terminer H7 en mode dormant, puis executer H8-PREPROD pendant que H6 poursuit sa fenetre de soak.

### 2026-07-13 - Phase H7 closeout code-ready de preproduction

- statut avant: `EN_PREPARATION`;
- objectif: coder toutes les grosses fonctionnalites email avant la presentation sans activer Resend avant le domaine final;
- implementation: ajout d'un runtime centralise pilote par `TRANSACTIONAL_EMAIL_PROVIDER`, avec `gmail` par defaut et `RESEND_FROM_EMAIL` obligatoire en mode Resend;
- flux migres: OTP Auth, OTP checkout, confirmation commande admin/client, remboursement, expedition, livraison et diagnostic;
- secrets montes: Gmail et `RESEND_API_KEY`; aucune valeur secrete ajoutee au depot ou a la documentation;
- idempotence: cles SHA-256 stables et non sensibles pour chaque operation transactionnelle;
- tests/resultats: syntaxe des quatre modules validee, adaptateur/runtime/logs `9/9 PASS`, gate Auth `53/53 PASS`, `0 FAIL`;
- environnement canonique: Node `22.23.1`, gate Auth `53/53 PASS`; Node `24.14.0` a egalement servi au controle de syntaxe complementaire;
- e-mail Resend reel envoye: aucun;
- provider actif: Gmail;
- deploiement cloud: aucun;
- fichier de reference: [`AUTH_H7_TRANSACTIONAL_EMAIL_PREPROD_CLOSEOUT_2026-07-13.md`](./AUTH_H7_TRANSACTIONAL_EMAIL_PREPROD_CLOSEOUT_2026-07-13.md);
- statut apres: `PREPROD_CODE_READY`;
- gate satisfaite: H7-PREPROD oui; H7 production non;
- rollback: conserver ou remettre `TRANSACTIONAL_EMAIL_PROVIDER=gmail`;
- prochaine action exacte: poursuivre H8-PREPROD avec les smokes navigateurs, les SLO sandbox et le closeout global.

### 2026-07-13 - Phase H8 readiness preproduction de presentation

- statut avant: `EN_COURS`;
- objectif: prouver que les grosses fonctionnalites Auth sont pretes a etre presentees sans attendre le domaine final;
- gate code: Node `22.23.1`, `53/53 PASS`, `0 FAIL`;
- smoke navigateurs: Chrome, Edge et Brave installes, `3/3 PASS`, aucun formulaire soumis et aucun OTP envoye;
- preuve session: header deconnexion, page `/mes-commandes`, navigation `Quitter` et entree mega menu `Mon espace` coherents dans la meme session;
- benchmark UI: `30/30 PASS`, modale warm p95 `206 ms` pour un objectif `<= 300 ms`, cold p95 `1 106 ms`;
- observabilite: les anciens logs `function_perf` ont ete trouves mais leur format multiline Gen1 empeche l'agregation fiable;
- correctif observabilite: passage a `firebase-functions/logger` avec champs bornes et sans OTP;
- script ajoute: `scripts/audit-auth-preprod-browsers.mjs`;
- rapport: [`AUTH_H8_PREPROD_READINESS_2026-07-13.md`](./AUTH_H8_PREPROD_READINESS_2026-07-13.md);
- deploiement effectue: aucun;
- statut apres: `PREPROD_VALIDATION_READY`;
- gate restante: deploiement sandbox, Gmail confirme actif, OTP/passkey post-deploiement et premiere mesure des logs structures;
- prochaine action exacte: demander l'autorisation de deployer le changeset Functions en sandbox, puis effectuer le closeout `PREPROD_READY`.

### 2026-07-13 - Decision transport email pour la demonstration cliente

- objectif: lever l'ambiguite entre test technique Resend, demonstration cliente et bascule production;
- decision: Gmail reste le provider actif pour tous les OTP et e-mails reels de la demonstration cliente;
- URL de demonstration: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`;
- contrainte: `hosted.app` appartient a Google; le projet ne controle pas sa zone DNS et ne peut pas y publier les preuves SPF/DKIM/DMARC necessaires a un expediteur Resend;
- Resend avant domaine: un canari avec `onboarding@resend.dev` est techniquement possible, mais uniquement vers l'adresse associee au compte Resend;
- portee du canari: validation de la cle, de l'appel API, de la reponse et des logs seulement; aucune preuve d'envoi vers les clientes ni de delivrabilite du domaine final;
- garde-fou: `TRANSACTIONAL_EMAIL_PROVIDER` reste sur `gmail` et `RESEND_FROM_EMAIL` reste inutilisable tant qu'un domaine expediteur controle n'est pas verifie;
- future bascule: verifier le domaine ou sous-domaine final dans Resend, publier SPF/DKIM/DMARC, tester Gmail/Outlook/iCloud, activer Resend sur une fenetre controlee et conserver Gmail comme rollback;
- retrait Gmail: uniquement apres recette et periode d'observation concluantes;
- impact UI/UX: aucun changement du parcours de connexion attendu;
- secrets exposes: aucun;
- statut apres: H7 reste `PREPROD_CODE_READY`, H8 reste `PREPROD_VALIDATION_READY`;
- prochaine action exacte: reprendre H8-PREPROD avec le deploiement sandbox du changeset Functions, confirmer Gmail actif, rejouer OTP/passkey et mesurer les premiers logs structures.

### 2026-07-13 - H8 deploiement sandbox Auth/email

- statut avant: `PREPROD_VALIDATION_READY`;
- objectif: publier l'adaptateur email commun et les logs Auth structures sans activer Resend ni supprimer les copies regionales de rollback;
- premier essai: arret local avant mutation, timeout de discovery Firebase a 10 secondes;
- deuxieme essai: arret local avant mutation, parametres `TRANSACTIONAL_EMAIL_PROVIDER` et `RESEND_FROM_EMAIL` non explicites en mode non interactif;
- garde-fou ajoute: configuration locale ignoree par Git avec `TRANSACTIONAL_EMAIL_PROVIDER=gmail` et `RESEND_FROM_EMAIL` vide;
- troisieme essai: source televersee et IAM `secretAccessor` confirme pour `RESEND_API_KEY`, puis arret avant mise a jour des Functions afin de ne pas supprimer les copies `us-central1`;
- strategie finale: rollout additif temporaire des callables dans `europe-west1` et `us-central1`, triggers Firestore email maintenus uniquement en `europe-west1`, puis retour immediat de la source locale a `FUNCTION_REGIONS=[europe-west1]`;
- ressources mises a jour: 12 Functions en `europe-west1`, dont 8 Auth, 2 callables email et 2 triggers email; 10 copies callables `us-central1` mises au meme niveau et conservees;
- suppressions cloud: aucune;
- activation Resend: aucune;
- preuve configuration apres deploiement sur `sendCustomerLoginOtp(europe-west1)`: `TRANSACTIONAL_EMAIL_PROVIDER: gmail`, `RESEND_FROM_EMAIL: ''`;
- secret consulte ou expose: aucun; seuls le nom et le droit d'acces ont ete verifies;
- statut apres: `PREPROD_VALIDATION_READY`;
- gate satisfaite: deploiement et garde-fou provider oui; E2E OTP/passkey et mesure des logs structures encore requis;
- rollback disponible: copies US conservees et provider Gmail explicite;
- prochaine action exacte: lancer un OTP Gmail reel et une reconnexion passkey sur la sandbox, puis lire les evenements `function_perf` structures avant le closeout `PREPROD_READY`.

### 2026-07-13 - H8 closeout PREPROD_READY

- statut avant: `PREPROD_VALIDATION_READY`;
- objectif: prouver les deux connexions reelles apres deploiement et fermer la gate de presentation;
- recette OTP: envoi Gmail reel, code saisi localement par l'utilisateur, validation reussie et session Firebase active;
- coherence OTP: `Quitter`, `Mon espace` et le compte de recette observes ensemble;
- logs OTP structures Europe: `sendCustomerLoginOtp` succes `5 662 ms`, `verifyCustomerLoginOtp` succes `4 705 ms`;
- recette passkey: deconnexion, Windows Hello, PIN saisi localement, authentification UV reussie et session Firebase active;
- coherence passkey: `Quitter`, `Mon espace` et le compte de recette observes ensemble;
- logs passkey structures Europe: generation options succes `453 ms`, verification succes `4 544 ms`;
- donnees sensibles conservees: aucun OTP, PIN, token ou e-mail dans le closeout;
- interpretation SLO: echantillons ponctuels seulement; dette p50/p95 serveur explicitement acceptee pour la presentation, non pour la production;
- regressions historiques: aucune desynchronisation header/menu, aucun blocage de l'espace client, aucun fallback perdu;
- fichier de reference: [`AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md`](./AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md);
- statut apres: `PREPROD_READY`;
- gate satisfaite: oui pour la preproduction de presentation;
- production: non validee, dependances H5/H6/H7 et recettes finales toujours ouvertes;
- prochaine action exacte: poursuivre passivement le soak H6; reprendre H5 et H7 des que le domaine final est choisi.

### 2026-07-13 - Gel du perimetre de cloture avant demonstration

- decision utilisateur: finir concretement la passe Auth sans ajouter de nouvelles fonctionnalites a chaque revue;
- document de pilotage: [`AUTH_DEMO_PATCH_CLOSEOUT_PLAN_2026-07-13.md`](./AUTH_DEMO_PATCH_CLOSEOUT_PLAN_2026-07-13.md);
- obligatoire avant cloture: gate code finale, smoke accessibilite essentiel, photographie H6 sans suppression, runbook demo et cloture Git/deploiement;
- explicitement hors perimetre demo: dashboards avances, alertes calibrees, statistiques p50/p95 de production, page de gestion des passkeys, Emulator Suite complete, matrice Apple/Android, canari Resend et suppression US;
- regle: aucun element differe ne peut etre reintroduit dans cette passe sauf regression P0/P1 reproductible sur OTP, Google, passkey, session ou step-up admin;
- statut Auth fonctionnel: `PREPROD_READY` conserve;
- prochaine action exacte: executer les gates G2 a G5 du plan ferme, puis declarer la passe de patch Auth cloturee.

### 2026-07-13 - Gates G2 a G5 et publication finale sandbox

- statut avant: `PREPROD_READY`;
- objectif: executer la liste fermee sans reintroduire de nouvelle fonctionnalite;
- G2: Node `22.23.1`, gate Auth finale `54/54 PASS`, build Next final vert, aucun secret ou fichier `.env` actif versionne;
- G3: blocage de focus initial corrige, boucle Tab, fermeture Escape, retour du focus, statuts OTP accessibles et verrous anti-double soumission valides;
- G3 preuve hebergee: focus initial `Fermer la connexion`, dialogue modal et retour a `Ouvrir la connexion` apres Escape;
- G4 fenetre: `2026-07-13T19:09:00Z` a `2026-07-13T22:07:07Z`;
- G4 trafic structure: `9` terminaisons Auth `europe-west1`, `0` `us-central1`;
- G4 mutation cloud: aucune; copies US conservees;
- G5 runbook: [`AUTH_DEMO_RUNBOOK_2026-07-13.md`](./AUTH_DEMO_RUNBOOK_2026-07-13.md);
- G5 App Hosting: rollout final termine sur `secondevie-next-sandbox`, code de sortie `0`;
- Functions/regles/secrets modifies pendant le deploy final: aucun;
- secrets exposes: aucun;
- rollback disponible: revision App Hosting precedente, Gmail actif et copies US conservees;
- statut apres: `AUTH_PATCH_READY_FOR_USER_VALIDATION`;
- gate satisfaite: G2, G3 et G4 oui; G5 technique oui, fusion `main` volontairement en attente;
- prochaine action exacte: commit squash et push de la branche, validation utilisateur de la sandbox, puis fusion vers `main` et statut `AUTH_PATCH_CLOSED_FOR_DEMO`.

### 2026-07-14 - Validation utilisateur et cloture de la passe Auth

- statut avant: `AUTH_PATCH_READY_FOR_USER_VALIDATION`;
- validation utilisateur recue: `valide` apres recette de la sandbox publiee;
- changeset de branche identifie: `5167be7`, pousse sur `origin/codex/auth-production-hardening`;
- fusion autorisee: squash merge vers `main` apres validation explicite;
- nouveau deploiement necessaire: non, la sandbox validée expose deja le bundle final;
- regressions P0/P1 ouvertes: aucune;
- provider email: Gmail conserve;
- rollback: revision App Hosting precedente et copies Functions US conservees;
- secrets exposes: aucun;
- statut apres: `AUTH_PATCH_CLOSED_FOR_DEMO`;
- gate satisfaite: G1 a G5 terminees;
- prochaine action Auth avant demonstration: aucune;
- seuls motifs de reprise: regression bloquante reproductible, demande cliente ou nouvelle passe production apres acquisition du domaine final.

## 16. Modele d'entree pour chaque session

Copier ce bloc sous `Journal chronologique`:

```markdown
### YYYY-MM-DD HH:mm - Phase HX - titre

- statut avant:
- objectif:
- hypothese:
- fichiers modifies:
- ressources cloud modifiees:
- commandes executees:
- tests/resultats:
- mesures p50/p95 si applicables:
- preuves:
- erreurs rencontrees:
- secrets exposes: aucun;
- rollback disponible:
- statut apres:
- gate satisfaite: oui/non;
- blocage/acces requis:
- prochaine action exacte:
```

## 17. Regles de preuve

Une preuve acceptable est:

- sortie de test reproductible;
- statut de deploiement avec Function/region/version;
- capture Console sans identifiant sensible;
- metrique Cloud Logging agregee;
- resultat E2E redige;
- hash de commit;
- verification DNS publique sans secret;
- recette physique signee par le testeur.

Ne sont pas suffisants seuls:

- `ca semble marcher`;
- un test regex sans test comportemental;
- une capture sans date/contexte;
- un build vert sans execution du flux;
- un marqueur `localStorage`;
- une UI masquee sans preuve serveur.

## 18. Definition de reprise apres interruption

Si le chantier est interrompu:

1. ne pas reexecuter les phases marquees validees;
2. reprendre la premiere phase `EN_COURS`;
3. lire sa derniere preuve;
4. verifier l'etat Git et cloud avant toute mutation;
5. relancer seulement la gate necessaire;
6. documenter toute divergence entre code et journal;
7. demander l'acces utilisateur uniquement si le blocage est reel.
