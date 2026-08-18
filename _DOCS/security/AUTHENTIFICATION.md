# Authentification - reference canonique

Date de consolidation: 2026-08-12
Statut: `AUTH_PATCH_CLOSED_FOR_DEMO - PREPROD_READY - PRODUCTION DIFFEREE`
Projet Firebase: `secondevienextjsssr`
Commit de reference du chantier: `34302d6 feat(auth): harden authentication for client demo`

## 1. Role de ce document

Ce fichier est l'unique reference operationnelle pour l'authentification de Seconde Vie. Il remplace les anciennes roadmaps, journaux de progression, baselines et closeouts Auth produits entre le 11 et le 14 juillet 2026.

Il doit permettre a un agent ou a un developpeur de reprendre le chantier lorsque le domaine final sera disponible, sans devoir reconstituer les decisions depuis l'historique de conversation.

L'objectif de livraison reste le suivant:

> Arriver a un etat de preproduction permettant de presenter le site a la cliente avec les grosses fonctionnalites deja codees, puis terminer les gates strictement dependantes du domaine lors du passage en production.

Les anciens documents restent recuperables dans l'historique Git, notamment dans le commit `34302d6`, mais ils ne sont plus des consignes actives.

## 2. Resume executif

La passe Auth de demonstration est terminee. Les parcours suivants sont implementes et valides sur le sandbox:

- connexion client par code OTP Gmail;
- connexion Google;
- activation d'une passkey apres une premiere connexion;
- reconnexion par Windows Hello avec verification locale obligatoire;
- fallback OTP apres annulation ou indisponibilite de la passkey;
- synchronisation de la session Firebase entre le header, le mega menu et l'espace client;
- acces administrateur soumis a une authentification forte Google ou passkey,
  sans reauthentification temporelle pendant la session Firebase valide;
- OTP idempotent et secret HMAC separe du mot de passe SMTP;
- registre administrateur et revocation des refresh tokens;
- adaptateur transactionnel Gmail/Resend centralise;
- accessibilite clavier essentielle de la modale;
- tests Auth, build Next et recettes sandbox concluants.

Le systeme n'est pas encore declare `VALIDEE_PRODUCTION`, pour quatre raisons externes au code principal:

1. le domaine final et le RP ID WebAuthn ne sont pas connus;
2. Resend ne peut pas etre active sans domaine expediteur, SPF, DKIM et DMARC;
3. les passkeys sandbox devront etre reenrolees sur le domaine final;
4. la recette multi-appareils et la fin du soak regional appartiennent a la mise en production.

Ces points ne bloquent pas la demonstration cliente.

## 3. Evaluation avant/apres

Cette notation est une grille interne de maturite, pas une certification de securite.

| Axe | Avant chantier | Etat consolide | Apport principal |
| --- | ---: | ---: | --- |
| coherence session/UI | 45/100 | 94/100 | source Firebase unique, fermeture apres session reelle, header/menu coherents |
| fiabilite OTP | 58/100 | 91/100 | transition atomique, reprise bornee, secret dedie |
| securite passkey | 55/100 | 92/100 | User Verification exigee et verifiee serveur |
| securite administrateur | 35/100 | 88/100 | AAL2 Google/passkey, registre actif, revocation |
| resistance aux pannes | 42/100 | 87/100 | idempotence, fallback OTP/Google, rollback documente |
| tests et non-regression | 35/100 | 93/100 | gate finale 57/57 et recettes reelles |
| accessibilite essentielle | 50/100 | 84/100 | focus, clavier, annonces et anti-double soumission |
| exploitabilite production | 40/100 | 72/100 | regions et provider prepares, domaine/DNS encore manquants |

Synthese:

- maturite avant chantier: environ `46/100`;
- maturite demonstration/preproduction: environ `89/100`;
- preparation production definitive: environ `78/100`.

Le gain principal concerne la coherence, la securite et la recuperation apres panne. Le chantier ne prouve pas encore une baisse statistique de toutes les latences serveur.

## 4. Environnement valide

| Element | Valeur actuelle |
| --- | --- |
| App Hosting sandbox | `secondevie-next-sandbox` |
| URL | `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app` |
| runtime de reference | Node `22.23.1` |
| region client Functions | `europe-west1` |
| source Functions privees | `FUNCTION_REGIONS=[europe-west1]` |
| Functions `us-central1` | six cibles uniques: trigger Auth, preuves E2E, webhooks legacy et worker image; aucune simple copie de callable Auth a retirer |
| fournisseur email actif | `gmail` |
| fournisseur prepare | `resend`, inactif |
| passkey validee | Windows Hello sur sandbox Chromium |
| etat demo | `AUTH_PATCH_CLOSED_FOR_DEMO` |

Le bucket catalogue peut conserver une region distincte. La convergence decrite ici concerne les Functions privees/Auth; il n'existe plus de Function HTTP catalogue separee.

## 5. Architecture d'authentification

### 5.1 Source de verite client

Firebase Auth est la source de verite. `authStore` observe `onIdTokenChanged` une seule fois par onglet et expose un snapshot normalise aux consommateurs.

Les anciens evenements globaux et marqueurs `window` ne sont que des ponts sortants de compatibilite. Ils ne doivent jamais redevenir une deuxieme source d'autorite.

Regles:

- attendre `signInWithCustomToken()` avant de fermer la modale;
- ne pas afficher un etat connecte sur la seule presence d'un token retourne par une Function;
- ne pas autoriser une action depuis un indicateur local de passkey;
- resynchroniser le menu a son ouverture comme filet de securite;
- Firebase reste autoritaire apres reload et entre plusieurs onglets.

### 5.2 Flux OTP client

```text
email
  -> sendCustomerLoginOtp + App Check + limites
  -> OTP envoye par l'adaptateur transactionnel
  -> saisie des six chiffres
  -> verifyCustomerLoginOtp
  -> transaction active -> issuing -> completed
  -> creation/reprise utilisateur
  -> Firebase Custom Token
  -> signInWithCustomToken avec reprise reseau bornee du meme token
  -> fermeture modale
  -> header Quitter + menu Mon espace
```

L'OTP produit une assurance interne `aal1`. Il permet l'espace client, mais pas une operation administrative sensible.
Le Custom Token reste uniquement en memoire dans la modale jusqu'a la
connexion. Une erreur `auth/network-request-failed` declenche deux reprises
courtes de l'echange Firebase Auth sans rappeler la Function OTP; si elles
echouent, le bouton reutilise encore ce meme token au lieu de consommer une
nouvelle operation OTP. Les metriques distinguent desormais validation du
code et ouverture de session.

### 5.3 Flux passkey

```text
utilisateur deja authentifie
  -> activation sur cet appareil
  -> options WebAuthn userVerification=required
  -> Windows Hello / Face ID / Touch ID / PIN appareil
  -> verification serveur requireUserVerification=true
  -> credential enregistree

connexion suivante
  -> email connu localement ou saisi
  -> Connexion rapide sur cet appareil
  -> challenge atomique
  -> preuve WebAuthn avec flag UV
  -> Custom Token avec authMethod=passkey, authAssurance=aal2
  -> signInWithCustomToken attendu
```

Le serveur refuse une inscription ou une assertion dont le flag User Verification est absent. Le texte UI peut parler de connexion rapide, mais le contrat serveur reste WebAuthn.

### 5.4 Flux Google

Google reste disponible depuis la meme modale. Le store identifie le fournisseur `google.com` et normalise la methode en `google`.

Le runtime Firebase Auth et le fournisseur Google sont prepares des l'ouverture
de la modale. Le clic appelle ainsi `signInWithPopup` sans chargement dynamique
intermediaire susceptible de perdre l'activation utilisateur du navigateur.
Le bouton bloque aussi les demandes concurrentes afin d'eviter une popup
annulee ou un onglet `__/auth/handler` orphelin. Le mode PWA iOS conserve
`signInWithRedirect`, requis par WebKit.

La cle Web Firebase restreinte doit autoriser simultanement le referer App
Hosting et `https://secondevienextjsssr.firebaseapp.com/*`: le handler OAuth
Firebase s'execute sur ce second domaine avant de revenir au sandbox. Retirer
ce referer casse Google popup et redirect meme si le domaine App Hosting reste
present dans les domaines autorises de Firebase Authentication.

Un echec de preparation ne rend plus le bouton faussement disponible: l'UI
affiche une reprise explicite qui recharge le runtime avant une nouvelle
ceremonie. Les tentatives conservent pendant sept jours un diagnostic local
borne et sans identite, token, URL ou message brut: etape, resultat, code
Firebase, categorie transport, etat reseau et identifiant aleatoire de
tentative. Cela distingue notamment offline, fetch Auth, popup bloquee et
transport iframe/GAPI sans exposer les donnees OAuth.

Google produit `aal2` pour ouvrir, consulter et modifier l'administration. Une
passkey verifiee produit le meme niveau. Les deux methodes sont equivalentes
pour l'autorisation admin tant que le token Firebase, le claim et le registre
actif restent valides. La passkey demeure une connexion rapide et locale; elle
n'est pas un palier d'autorisation impose apres Google.

### 5.5 Autorisation administrateur sans friction temporelle

Un role `admin` ou `superAdmin` ne suffit pas. Toute lecture ou mutation du
back-office exige:

- un role autorise;
- une entree active dans le registre administrateur;
- une assurance AAL2 issue de Google ou d'une passkey verifiee;
- App Check et les validations metier de la Function lorsque celle-ci est
  appelee.

OTP seul reste `aal1` et ne donne pas acces a l'administration. Aucune mutation
ne depend de `auth_time`, d'une passkey recente ou d'une minuterie de quinze
minutes.

Les lecteurs, commandes produit, fulfillment, retours, remboursements, liens de
paiement, configuration livraison, Stripe Connect et maintenance utilisent
`checkActiveStrongAdmin` ou `checkActiveStrongSuperAdmin`. Les operations a
fort impact conservent confirmation explicite, role owner lorsque prevu,
idempotence, audit et validation serveur; elles ne redemandent pas la passkey.

Firestore Rules, Storage Rules et les callables appliquent cette politique cote
serveur. Tous les chemins admin directs relisent le registre actif et acceptent
Google ou passkey AAL2. Les chemins backend-only, champs commerce et documents
proteges restent inaccessibles au SDK navigateur et passent par leurs Functions.

Depuis le durcissement du 2026-08-11, `SUPER_ADMIN_EMAIL` ne constitue plus un
fallback d'autorisation. Il est lu uniquement par le bootstrap
`syncSuperAdminClaim`, avec e-mail verifie et AAL2, pour creer le claim et le
registre owner. Les deux API Next admin ajoutent token non revoque et App Check
a ce meme contrat. Seul un owner actif AAL2 peut ajouter ou retirer un admin.

## 6. Garanties techniques implementees

### 6.1 Passkeys

- `userVerification: 'required'` lors de l'inscription;
- `requireUserVerification: true` lors de la verification d'inscription;
- `userVerification: 'required'` lors de l'authentification;
- `requireUserVerification: true` lors de la verification d'assertion;
- challenge a usage unique, TTL et transitions atomiques;
- controle d'origine exact, sans wildcard `.hosted.app`;
- controle du RP ID;
- limites d'essais et protections App Check;
- compteur et protections replay conserves;
- aucun PIN, secret ou credential prive journalise.

### 6.2 OTP

- generation cryptographique;
- HMAC avec `OTP_HMAC_SECRET` dedie;
- comparaison temporellement sure;
- expiration et usage unique logique;
- limites email/IP/operation;
- transition transactionnelle `active -> issuing -> completed`;
- lease de reprise bornee;
- creation utilisateur idempotente;
- emission Custom Token recuperable;
- token jamais stocke dans Firestore;
- verrous client synchrones contre double envoi et double verification.
- reprise reseau bornee de `signInWithCustomToken` avec le meme token en
  memoire, sans nouvelle verification OTP.

Le mot de passe Gmail ne doit jamais redevenir le secret HMAC OTP.

### 6.3 Administration et revocation

La migration G5 a ferme le lecteur `getUserStatsGen2`, sous nouveau nom
et avec le meme handler que la Gen1. App Check, registre admin actif et AAL2
restent obligatoires. Son identite dediee `auth-reader-runtime` ne porte que
`firebaseauth.viewer`, Firestore user, logs et service usage; aucun role Auth
admin ni cle utilisateur. La revision `getuserstatsgen2-00001-niv` est ACTIVE
et le refus sans Auth/App Check retourne 401. Le rollout
`g5-a1-cutover-20260818-001` sert le build `005`; la recette admin ephemere a
retourne 34, l'ancien onglet `004` reste fonctionnel, les donnees sont
inchangees et la quiet-window compte zero erreur Gen2 et zero appel Gen1. La
Gen1 et son IAM sont preserves; rollback client exact vers `004`.

G5-A2 ferme aussi `logUserConnectionGen2` avec le handler Gen1 et App Check
identiques. Son runtime `auth-session-runtime` porte uniquement Firestore,
logs et service usage, sans cle utilisateur ni acces secret. La revision
`loguserconnectiongen2-00001-fab` est ACTIVE et le rollout
`g5-a2-cutover-20260818-001` sert le build `001`. L'ancien onglet `005` reste
fonctionnel, l'appel ephemere retourne 200, `lastLoginAt` est mis a jour,
les erreurs Gen2 et les nouveaux appels Gen1 valent zero. La Gen1 reste
intacte; rollback client exact vers `005`. Prochaine cible unique:
`ensureAdminAccessRegistryGen2`.

G5-A3 ferme ce registre sous nouveau nom avec le handler Gen1, App Check et
AAL2 identiques. Le runtime `auth-registry-runtime` porte Firestore, logs,
service usage et un acces borne au seul secret `SUPER_ADMIN_EMAIL:3`, sans cle
utilisateur. La revision `ensureadminaccessregistrygen2-00001-lak` est ACTIVE;
le rollout `g5-a3-cutover-20260818-001` sert build `002`. L'ancien onglet `001`
reste sain, l'appel retourne 200 avec `migrated:false`, le registre est
strictement inchange, les erreurs Gen2 et les appels Gen1 valent zero. La Gen1
et le secret restent intacts; rollback exact `001`. Prochaine cible unique:
`sendGuestCheckoutOtpGen2`.

G5-A7 a A9 ferment le lot de connexion client sous trois nouveaux noms:
`verifyCustomerLoginOtpGen2`, `generatePasskeyAuthenticationOptionsGen2` et
`verifyPasskeyAuthenticationGen2`. Les handlers Gen1 restent partages et les
trois endpoints historiques restent actifs. Le runtime dedie
`auth-login-runtime` porte Firestore, Firebase Auth admin, logs, service usage,
la signature de Custom Token sur sa propre identite et l'acces au seul secret
`OTP_HMAC_SECRET:1`; il ne possede aucune cle utilisateur ni role parasite.
Les revisions `verifycustomerloginotpgen2-00001-kew`,
`generatepasskeyauthenticationoptionsgen2-00001-mam` et
`verifypasskeyauthenticationgen2-00001-geb` sont ACTIVE. App Hosting sert
`build-2026-08-18-006` apres cutover groupe, rollback reel `005` et
reactivation. L'ancien onglet `005` est reste authentifie, les routes sont 200
et la quiet-window compte zero erreur Gen2 et zero appel Gen1. La preuve OTP
n'a envoye aucun e-mail et a restaure sa fixture; la preuve passkey a confirme
`userVerification=required` puis le refus d'une assertion invalide.

- registre administrateur par UID;
- entree active obligatoire pour les callables critiques;
- retrait des claims lors d'une revocation;
- appel `revokeRefreshTokens()`;
- ancienne session refusee par les callables si le registre est inactif;
- journalisation structuree des etapes de revocation;
- reprise idempotente d'une revocation partiellement terminee.

Pour `furniture/**`, Storage Rules consulte directement `sys_admin_access`:
le retrait du registre coupe donc les nouveaux uploads sans attendre une
fenetre d'authentification. Cette lecture interservice est facturee comme une
lecture Firestore par evaluation de Rules et reste bornee au faible volume des
uploads administrateur. Les autres chemins Storage directs appliquent le meme
contrat: claim admin, registre actif et AAL2 Google ou passkey, sans fenetre
temporelle arbitraire. La revocation des refresh tokens reste le mecanisme de
coupure de session.

### 6.4 Emails transactionnels

Tous les flux raccordes passent par l'adaptateur central:

- OTP de connexion client;
- OTP checkout invite;
- e-mails de commande;
- e-mails de remboursement/statut;
- e-mails de test couverts.

Les OTP connexion et checkout partagent le meme rendu
`functions/src/email/otpEmailTemplates.js`, construit sur
`emailDesignSystem.js`: identite visuelle commune, code a six chiffres,
expiration, usage unique, avertissement anti-partage et repli texte. La logique
de generation, de hash, d'expiration et de verification reste separee par
parcours. Les captures de reference sont conservees dans
[EMAILS_TRANSACTIONNELS.md](../email/EMAILS_TRANSACTIONNELS.md).

Configuration:

- `TRANSACTIONAL_EMAIL_PROVIDER`, valeur par defaut `gmail`;
- `GMAIL_EMAIL` et `GMAIL_PASSWORD` pour Gmail;
- `RESEND_API_KEY` dans Secret Manager;
- `RESEND_FROM_EMAIL`, vide tant que le domaine n'est pas verifie;
- aucun basculement Resend possible si l'expediteur est absent.

## 7. Contrat UI/UX

Le parcours valide est volontairement email-first:

1. premiere connexion: Google ou email + code;
2. apres succes: proposition facultative `Activer sur cet appareil`;
3. prochaines connexions sur un appareil connu: `Connexion rapide sur cet appareil`;
4. fallback `Recevoir un code par email` toujours accessible;
5. une annulation Windows Hello ne doit jamais enfermer l'utilisateur;
6. la modale se ferme seulement apres la session Firebase effective;
7. la route courante est preservee apres activation d'une passkey;
8. le header et le mega menu doivent presenter le meme etat.

Ne pas reintroduire le bouton generique `Utiliser une passkey` avant enrôlement: il expose trop tot les choix navigateur QR, cle physique ou appareil distant et a ete juge confus lors de la recette.

### Accessibilite essentielle

- focus initial sur une action previsible;
- focus visible;
- confinement Tab et Shift+Tab dans la modale;
- fermeture par Escape;
- retour du focus au declencheur;
- labels `Chiffre 1 du code` a `Chiffre 6 du code`;
- messages dynamiques en `status` ou `alert` avec `aria-live`;
- boutons occupes exposes avec `aria-busy` et desactivation coherente.

## 8. Historique consolide du chantier

| Phase | Resultat consolide |
| --- | --- |
| phase 0 | environnement Firebase/App Check/CLI inventorie, baseline UI et limites documentees |
| phase 1 | AuthStore unique, pipeline Custom Token attendu, header/menu synchronises |
| phase 2 | UX passkey portable puis revisee email-first, fallback OTP conserve |
| phase 3 | recette passkey reelle et correction de la connexion rapide |
| H0 | runner Auth Node 22 et contrats comportementaux etablis |
| H1 | User Verification WebAuthn obligatoire, recette Windows Hello sandbox |
| H2 | AAL1/AAL2, step-up admin et Rules durcies |
| H3 | OTP idempotent et secret HMAC dedie dans Secret Manager |
| H4 | registre administrateur et revocation des refresh tokens |
| H5 | differee: domaine final, AuthDomain et RP ID |
| H6 | source convergee vers `europe-west1`, copies US conservees pendant le soak |
| H7 | adaptateur Gmail/Resend code et teste; activation Resend differee au domaine |
| H8 | recettes preproduction, navigateurs Windows, accessibilite et closeout demo |

## 9. Preuves disponibles

### 9.1 Gates finales

- Node de reference: `22.23.1`;
- `npm run test:auth`: `57/57 PASS`, zero echec;
- build Next.js: succes;
- test accessibilite contractuel cible: `5/5 PASS`;
- smoke Chrome, Edge et Brave: `3/3 PASS`;
- benchmark ouverture modale: `30/30 PASS`;
- recette OTP Gmail reelle: succes;
- la recette client du 2026-07-29 a confirme une livraison classee en spam par
  Gmail; l'interface indique donc explicitement de verifier les courriers
  indesirables apres envoi et l'OTP checkout fournit aussi une partie texte;
- activation Windows Hello: succes;
- deconnexion puis reconnexion passkey: succes;
- `Quitter` et `Mon espace` visibles de facon coherente;
- espace `/mes-commandes` accessible avec la session attendue;
- backoffice refuse en AAL1 et accessible apres step-up AAL2;
- audit borne du diff: aucun secret Auth/Resend ajoute en clair.

### 9.2 Progression des tests

Les suites ont progresse d'une baseline d'environ 18 controles contractuels cibles vers 56 tests Auth:

- apres H1: 23 tests;
- apres H2: 29 tests;
- apres H3: 32 tests;
- apres H4: 40 tests;
- apres adaptateur email: 53 tests;
- gate initiale: 54 tests;
- contrat session admin persistante et step-up sans deconnexion: 56 tests.

### 9.3 Mesures ponctuelles

Baseline historique d'ouverture de modale, 30 iterations:

- cold p50: `1 181 ms`;
- cold p95: `1 215 ms`;
- warm p50: `120 ms`;
- warm p95: `216 ms`.

Echantillons serveur sandbox observes:

- options passkey: environ `453 ms`;
- verification passkey: environ `4 544 ms`;
- envoi OTP: environ `4 978 ms`;
- verification OTP: environ `4 446 ms`.

Ces valeurs ne sont pas des p50/p95 de production. Elles peuvent inclure un cold start Gen1, Firestore et Firebase Admin. Ne pas les utiliser comme SLO contractuels.

## 10. Cartographie du code Auth

### Client

- `src/kit/auth/authStore.js`: source de verite Firebase, claims et assurance;
- `src/kit/contexts/AuthContext.jsx`: API Auth exposee aux composants;
- `src/kit/marketplace/LegacyLoginModalFullIsland.jsx`: modale unifiee, OTP, Google, passkey et accessibilite;
- `app/admin/AdminAppIsland.jsx`: gate client du backoffice;
- `src/kit/admin/AdminDashboard.jsx`: etats de step-up et actions admin.

### Functions

- `functions/src/auth/customerLoginOtp.js`: OTP client et session Firebase;
- `functions/src/auth/guestCheckoutOtp.js`: OTP checkout;
- `functions/src/auth/passkeys.js`: inscription/authentification WebAuthn;
- `functions/src/auth/adminManagement.js`: registre et revocation admin;
- `functions/src/auth/grantAdmin.js`: transition de claims/registre;
- `functions/helpers/security.js`: roles, AAL2, fraicheur et registre;
- `functions/helpers/secrets.js`: declarations Secret Manager/config;
- `functions/helpers/runtime.js`: region primaire;
- `functions/src/email/transactionalEmail.js`: adaptateur Gmail/Resend;
- `functions/src/email/transactionalEmailRuntime.js`: provider et secrets runtime.

### Rules et tests

- `firestore.rules`: role, AAL2 et registre sur les surfaces sensibles;
- `storage.rules`: role et AAL2 pour les ecritures admin;
- `tests/auth-*.test.cjs`: contrats store, claims, OTP, assurance, revocation, region et email;
- `tests/passkey-*.test.cjs`: portabilite et hardening serveur;
- `scripts/audit-auth-preprod-browsers.mjs`: smoke navigateurs preproduction;
- `scripts/benchmark-auth-ui.mjs`: benchmark UI sans envoi OTP.

## 11. Commandes de validation

Utiliser Node 22 impose par le projet.

```bash
npm run test:auth
npm run build
npm run perf:auth:ui
npm run auth:preprod:browsers
```

Ne pas lancer automatiquement les tests physiques WebAuthn: Windows Hello, Face ID ou Touch ID exigent l'intervention de l'utilisateur.

## 12. Runbook de demonstration

### Avant le rendez-vous

1. verifier que le sandbox charge;
2. verifier que la modale s'ouvre;
3. verifier l'acces a la boite de recette;
4. demander un unique OTP et confirmer sa reception;
5. verifier que Windows Hello est disponible si la passkey doit etre montree;
6. ne modifier ni le provider email ni les regions le jour de la demo.

### Ordre conseille

1. connexion OTP Gmail;
2. affichage de `Quitter` et `Mon espace`;
3. proposition ou activation de Windows Hello si necessaire;
4. deconnexion;
5. reconnexion rapide;
6. ouverture de `/mes-commandes`;
7. si besoin, montrer qu'un admin OTP doit effectuer un step-up.

### Replis

| Incident | Repli |
| --- | --- |
| passkey annulee/indisponible | OTP Gmail, puis Google |
| OTP expire | attendre le delai et renvoyer un seul code |
| email lent ou absent de la boite principale | l'interface invite a verifier les spams, puis Google |
| action admin refusee | step-up passkey ou Google proprietaire |
| regression App Hosting | restaurer la revision sandbox precedente stable |

Ne jamais activer Resend ou supprimer une Function regionale pendant une demonstration.

## 13. Reprise lorsque le domaine final sera connu

Cette section est la prochaine action canonique. Ne pas creer une nouvelle roadmap avant d'avoir execute cette checklist.

### Gate P1 - Decision domaine

Documenter explicitement:

- domaine canonique, par exemple `secondevie.fr` ou `www.secondevie.fr`;
- politique de redirection entre apex et `www`;
- sous-domaine App Hosting eventuel;
- domaine expediteur, recommande: `auth.secondevie.fr` ou `mail.secondevie.fr`;
- RP ID WebAuthn retenu;
- origines HTTPS exactes autorisees.

Le RP ID doit etre stable avant d'enroler des clientes reelles. Une passkey est liee au RP ID; elle ne se migre pas magiquement depuis `hosted.app`.

### Gate P2 - Firebase/App Hosting

1. ajouter et verifier le domaine dans App Hosting/Firebase;
2. configurer les DNS demandes par Google;
3. ajouter le domaine aux domaines autorises Firebase Auth;
4. verifier OAuth Google et ses origines/redirections;
5. mettre a jour les origines passkey autorisees sans wildcard;
6. configurer le RP ID final;
7. deployer d'abord sur une fenetre controlee;
8. tester les routes publiques et privees.

### Gate P3 - Campagne passkey

1. considerer toutes les credentials `hosted.app` comme jetables;
2. ne pas tenter de copier les credentials vers le nouveau RP ID;
3. conserver OTP et Google pendant toute la transition;
4. demander un nouvel enrollement sur le domaine final;
5. tester inscription, deconnexion, reconnexion et fallback;
6. tester au minimum Windows Chrome/Edge, Safari iPhone avec Face ID et Android Chrome;
7. ne promettre une compatibilite plateforme qu'apres preuve physique.

### Gate P4 - Resend et DNS

1. ajouter le domaine expediteur dans Resend;
2. publier les enregistrements DKIM fournis par Resend;
3. publier/aligner SPF sans multiplier les enregistrements concurrents;
4. publier DMARC d'abord en observation si necessaire;
5. attendre le statut verifie;
6. renseigner `RESEND_FROM_EMAIL` avec une adresse du domaine controle;
7. conserver `TRANSACTIONAL_EMAIL_PROVIDER=gmail` pendant le premier deploiement;
8. executer un canari Resend limite aux adresses de recette;
9. verifier Gmail, Outlook et iCloud, contenu, spam et liens;
10. passer le provider a `resend` dans une fenetre controlee;
11. tester OTP Auth, OTP checkout, commande et remboursement;
12. surveiller erreurs, bounces et plaintes;
13. conserver Gmail comme rollback court;
14. retirer le mot de passe d'application Gmail apres stabilisation.

Le domaine `hosted.app` ne peut pas etre utilise comme domaine expediteur: sa zone DNS appartient a Google et le projet ne peut pas y publier SPF/DKIM/DMARC.

### Gate P5 - Convergence regionale

Etat historique observe pendant la cloture demo, remplace pour les decisions de
migration par le manifeste G0 du 2026-08-15:

- client dirige vers `europe-west1`;
- source `FUNCTION_REGIONS` limitee a `europe-west1`;
- trafic structure observe: 9 terminaisons Auth EU, 0 US sur la fenetre bornee;
- copies US conservees comme rollback;
- trigger `grantAdminOnAuth` a traiter avec prudence;
- `syncSessionBeacon` construit son URL depuis la region client.

Avant suppression:

1. collecter une fenetre de trafic representative;
2. confirmer zero appel legitime sur chaque copie US;
3. verifier clients anciens, scripts et webhooks;
4. traiter separement les triggers non duplicables;
5. supprimer explicitement, Function par Function;
6. verifier logs, erreurs et latences EU;
7. conserver un runbook de redeploiement d'urgence.

### Gate P6 - Recette production

Recette minimale:

- OTP valide, invalide, expire et renvoye;
- Google;
- activation et reconnexion passkey;
- fallback apres annulation;
- reload et deuxieme onglet;
- header `Quitter` et menu `Mon espace` coherents;
- espace client;
- admin AAL1 refuse;
- step-up AAL2 accepte;
- revocation administrateur avec second compte jetable;
- e-mails Resend sur plusieurs fournisseurs;
- clavier et lecteur d'ecran essentiels;
- Chrome, Edge, Safari/iPhone et Android Chrome.

### Gate P7 - Validation finale

Executer:

```bash
npm run test:auth
npm run build
npm run auth:preprod:browsers
```

Puis produire dans ce fichier, et non dans un nouveau closeout:

- date et commit deploye;
- domaines et RP ID;
- provider email actif;
- regions restantes;
- resultats des tests;
- resultats des recettes physiques;
- incidents et rollbacks;
- decision `VALIDEE_PRODUCTION` ou blocage explicite.

## 14. Criteres `VALIDEE_PRODUCTION`

Le statut ne peut etre attribue que si:

- domaine final actif et stable;
- AuthDomain et OAuth valides;
- RP ID final configure;
- nouvelles passkeys testees sur le domaine final;
- OTP, Google et passkey E2E verts;
- SPF, DKIM et DMARC publies;
- Resend valide sur Gmail, Outlook et iCloud;
- Gmail retire ou conserve uniquement selon une decision explicite de rollback;
- matrice Windows/iPhone/Android minimale terminee;
- step-up et revocation admin prouves;
- regions legacy supprimees ou maintien justifie et date;
- tests Auth et build verts;
- aucun secret dans Git ou les documents;
- runbook d'incident exploitable.

## 15. Rollback production

### Passkey

- maintenir OTP et Google;
- desactiver uniquement l'amorcage passkey si necessaire;
- ne pas affaiblir `requireUserVerification`;
- corriger RP ID/origines avant de reenroler.

### Email

- remettre `TRANSACTIONAL_EMAIL_PROVIDER=gmail`;
- redeployer les Functions email/OTP concernees;
- verifier un OTP reel;
- conserver les logs Resend pour diagnostic;
- ne jamais copier une cle API dans le chat ou Git.

### Administration

- ne jamais retirer la verification du registre pour contourner un incident;
- restaurer explicitement une entree admin apres step-up proprietaire;
- auditer toute reactivation;
- conserver AAL2 et fraicheur.

### Region

- redeployer la Function concernee dans la region precedente seulement depuis un commit connu;
- ne pas changer simultanement region, provider email et RP ID;
- verifier App Check, CORS, client region et logs.

## 16. Secrets et donnees sensibles

Ne jamais inscrire dans ce document, Git, une issue ou le chat:

- valeur d'un OTP;
- PIN Windows Hello ou code appareil;
- credential WebAuthn privee;
- Firebase Custom Token ou ID Token;
- mot de passe d'application Gmail;
- `OTP_HMAC_SECRET`;
- `RESEND_API_KEY`;
- cle privee de service account.

Les preuves doivent utiliser uniquement les noms de secrets, versions, statuts IAM et resultats rediges.

## 17. Decisions durables

- conserver une seule modale pour clients et administrateurs;
- conserver l'UX email-first;
- garder OTP et Google comme fallback de passkey;
- imposer User Verification cote serveur;
- ne pas confondre role admin, registre actif et preuve AAL2;
- ne pas reintroduire de fenetre temporelle ou de passkey obligatoire apres une
  connexion Google admin valide;
- ne pas consommer irreversiblement un OTP avant emission de session;
- garder le secret OTP independant du transport email;
- utiliser l'adaptateur transactionnel pour tous les nouveaux e-mails;
- ne pas declarer production avant domaine, DNS et recettes physiques;
- mettre a jour ce document au lieu de recreer une serie de roadmaps Auth.

## 18. Prochaine action exacte

Avant l'achat du domaine: aucune nouvelle phase Auth n'est requise pour la demonstration, sauf bug bloquant reel.

Des que le domaine est confirme: commencer a la section **Gate P1 - Decision domaine**, poursuivre dans l'ordre jusqu'a **Gate P7 - Validation finale**, puis remplacer le statut en tete par `VALIDEE_PRODUCTION` uniquement si tous les criteres de la section 14 sont satisfaits.

## 19. Sessions de recette automatisee sandbox

Deux commandes locales permettent a un agent de charger les vues privees avec
les comptes de recette exacts, sans conserver de mot de passe ni d'OTP:

```bash
npm run e2e:sandbox:client
npm run e2e:sandbox:admin
```

Le rail `scripts/e2e-sandbox-role-session.mjs` est fail-closed:

- cible limitee au projet `secondevienextjsssr`, au sandbox App Hosting exact
  ou a localhost;
- client exact `pvml7008@gmail.com`, refuse si un claim ou registre admin est
  detecte;
- administrateur exact `loa.gto15@gmail.com`, refuse si le claim ou le registre
  actif manque;
- Custom Token garde uniquement en memoire, jamais ecrit dans les preuves;
- le harnais sandbox ajoute le jeton App Check ephemere aux echanges
  `identitytoolkit.googleapis.com` et `cloudfunctions.net`, sans le journaliser;
- ouverture via un hook navigateur expose seulement avec `e2e_run` sur le
  sandbox exact ou localhost;
- aucune creation de compte, promotion admin, modification de mot de passe ou
  desactivation de protection.

Cette session technique qualifie les vues et leurs autorisations, pas la
ceremonie humaine de connexion. Les preuves OTP/Gmail, Google et passkey restent
des scenarios separes. Le connecteur Gmail de Codex est lie a un seul compte a
la fois; l'acces simultane aux deux boites doit passer par deux connexions
autorisees distinctes ou par un transfert Gmail explicite vers la boite de
recette centrale, jamais par un secret inscrit dans le depot.
