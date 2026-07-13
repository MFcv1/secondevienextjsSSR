# Plan ferme de cloture de la passe Auth avant demonstration

Date: 2026-07-13  
Statut: `ACTIVE - LISTE FERMEE`  
Branche: `codex/auth-production-hardening`  
Roadmap normative: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)  
Dernier closeout fonctionnel: [`AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md`](./AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md)

## 1. Decision de livraison

Le systeme Auth est deja `PREPROD_READY` pour une demonstration cliente. Cette passe ne doit plus recevoir de nouvelle fonctionnalite. Elle sera cloturee apres les cinq gates finies et bornees de ce document.

Objectif exact:

> Livrer une connexion demonstrable, stable et reversible sur la sandbox, puis geler le chantier jusqu'au domaine final ou jusqu'a l'apparition d'une regression P0/P1 reproductible.

Les validations de production dependantes du domaine, du trafic reel ou d'appareils non disponibles ne sont pas des bloqueurs de cette passe.

## 2. Fonctionnalites deja acquises - ne pas refaire

- AuthStore unique et synchronisation session/header/mega menu;
- OTP Gmail reel, idempotent et protege par un secret HMAC dedie;
- passkey Windows Hello avec User Verification obligatoire;
- premiere connexion email-first et connexion rapide seulement apres activation;
- fallback OTP apres erreur ou annulation passkey;
- Google disponible dans la modale commune;
- step-up fort pour l'administration et refus d'un OTP seul pour les actions sensibles;
- registre administrateur et revocation des refresh tokens;
- App Check, rate limiting, anti-enumeration, challenge atomique et validation stricte passkey;
- routage client Auth vers `europe-west1`;
- adaptateur Gmail/Resend centralise avec Gmail verrouille comme provider de demonstration;
- logs `function_perf` structures;
- gate Auth Node 22 `54/54 PASS`;
- smoke Chrome/Edge/Brave `3/3`;
- recettes post-deploiement OTP et passkey avec `Quitter` + `Mon espace` coherents.

## 3. Liste fermee des gates restantes

### G1 - Coherence documentaire et gel du scope

Statut: `TERMINEE`

- roadmap historique marquee comme historique;
- roadmap de hardening, fil d'Ariane et present plan relies;
- distinction `PREPROD_READY` / `VALIDEE_PRODUCTION` explicite;
- exclusions avant demonstration ecrites et opposables au glissement de perimetre.

### G2 - Gate finale du changeset local

Statut: `TERMINEE - 2026-07-13`

Executer une seule fois, sur l'etat final de la branche:

1. `git diff --check`;
2. gate Auth complete sous Node 22;
3. build Next, car le changeset contient aussi des fichiers client/admin;
4. verifier qu'aucun secret ou fichier `.env` n'est versionne;
5. verifier que `FUNCTION_REGIONS` reste limite a `europe-west1` dans la source;
6. verifier que le provider par defaut reste `gmail` et que l'expediteur Resend reste vide.

Condition de sortie: commandes vertes ou dette non bloquante precisement documentee. Aucun refactoring opportuniste pendant cette gate.

Preuves d'execution:

- runtime: Node `v22.23.1` via NVM;
- `git diff --check`: aucune erreur de whitespace; seuls les avertissements de conversion locale LF vers CRLF ont ete emis;
- `npm run test:auth`: `53/53 PASS`, zero echec, zero test ignore;
- `npm run build`: succes avec Next.js `15.5.20`, compilation en `13.2 s`, generation statique `22/22` et code de sortie `0`;
- les avertissements ESLint historiques du projet restent non bloquants; aucun avertissement n'a fait echouer le build;
- seuls `.env.production.example` et `.env.sandbox.example` sont suivis par Git; aucun fichier `.env` actif n'est versionne;
- analyse bornee du diff: aucun motif de cle privee, cle Firebase, cle Resend ou secret Auth ajoute en clair;
- `FUNCTION_REGIONS = [PRIMARY_FUNCTIONS_REGION]` et `PRIMARY_FUNCTIONS_REGION = 'europe-west1'` confirmes dans `functions/helpers/runtime.js`;
- `TRANSACTIONAL_EMAIL_PROVIDER` reste fixe par defaut a `gmail` et `RESEND_FROM_EMAIL` reste vide dans `functions/helpers/secrets.js`.

Decision G2: gate verte. Aucun correctif runtime supplementaire n'est requis.

### G3 - Smoke accessibilite essentiel de la modale

Statut: `TERMINEE - 2026-07-13`

Perimetre strict, sur le navigateur de demonstration:

- ouverture de la modale au clavier;
- focus initial visible et place dans le dialogue;
- navigation `Tab`/`Shift+Tab` sans perte de focus derriere la modale;
- fermeture par `Escape` et retour du focus au declencheur;
- champs email et code avec noms accessibles;
- erreur et etat de chargement lisibles sans dependre uniquement de la couleur;
- double soumission impossible pendant une requete.

Condition de sortie: aucun blocage clavier de niveau P0/P1. Un audit WCAG complet et une certification lecteur d'ecran ne font pas partie de cette passe.

Correctif borne applique pendant la gate:

- focus initial place sur le bouton `Fermer la connexion` a l'ouverture;
- anneau de focus visible ajoute a ce bouton;
- confinement `Tab` / `Shift+Tab` dans le dialogue;
- fermeture `Escape` avec retour du focus au declencheur d'origine, ou au bouton `Ouvrir le menu` en repli;
- nom accessible explicite `Adresse email du compte`;
- messages OTP exposes comme `status` ou `alert` avec `aria-live`;
- boutons de soumission exposes avec `aria-busy`;
- verrous synchrones distincts contre le double envoi et la double verification OTP.

Preuves du smoke local sur la configuration sandbox:

- declencheur expose comme `BUTTON type="button"`, donc activable nativement au clavier;
- dialogue expose avec `role="dialog"`, `aria-modal="true"` et le nom `Connexion Seconde Vie`;
- focus initial: `Fermer la connexion`, a l'interieur du dialogue, avec ring visible `2 px`;
- `Shift+Tab` depuis le premier controle rejoint le dernier controle `Politique de confidentialite` sans sortir du dialogue;
- `Tab` depuis ce dernier controle reboucle sur `Fermer la connexion`;
- `Escape` retire le dialogue et rend le focus a `Ouvrir la connexion`;
- les six cases OTP conservent les noms `Chiffre 1 du code` a `Chiffre 6 du code`;
- test contractuel cible: `5/5 PASS`;
- lint cible: zero erreur; six avertissements historiques non bloquants dans le composant.

Decision G3: gate verte. Aucun audit d'accessibilite supplementaire n'est requis pour cette passe.

### G4 - Photographie H6 sans suppression regionale

Statut: `TERMINEE - 2026-07-13`

1. lire le trafic recent des callables Auth en `us-central1` et `europe-west1`;
2. enregistrer la fenetre, le nombre d'appels et leur origine probable lorsqu'elle est identifiable;
3. confirmer que le client courant appelle `europe-west1`;
4. conserver toutes les copies US avant la demonstration, quel que soit le resultat;
5. ne supprimer aucun trigger ni Function pendant cette gate.

Condition de sortie: photographie datee et rollback US conserve. La fin du soak et la suppression US sont reportees apres trafic suffisant; elles ne bloquent pas la cloture de la passe.

Photographie en lecture seule:

- projet: `secondevienextjsssr`;
- fenetre: `2026-07-13T19:09:00Z` a `2026-07-13T22:07:07Z`;
- signal compte: evenements de terminaison structures `function_perf`;
- premier evenement Auth de la fenetre: `2026-07-13T19:16:07.443195Z`;
- dernier evenement Auth de la fenetre: `2026-07-13T22:01:55.570425Z`;
- total `europe-west1`: `9`;
- total `us-central1`: `0`;
- detail Europe: `generatePasskeyAuthenticationOptions=5`, `sendCustomerLoginOtp=1`, `verifyCustomerLoginOtp=1`, `verifyPasskeyAuthentication=2`;
- origine probable: recettes sandbox H8/G3 et ouvertures de la modale Auth; aucune origine utilisateur finale ne peut etre affirmee avec ce faible echantillon;
- les quatre callables mesurees sont `ACTIVE` dans les deux regions;
- le client conserve `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'europe-west1'` et le test de convergence regional reste vert;
- aucune Function, aucun trigger et aucune copie US n'ont ete supprimes ou modifies pendant G4.

Decision G4: gate verte. Le rollback `us-central1` est conserve jusqu'a une future passe de production distincte.

### G5 - Runbook demo, Git et remise finale

Statut: `EN_ATTENTE_VALIDATION_UTILISATEUR - 2026-07-13`

Runbook de demonstration a figer:

1. navigateur principal: Chrome ou Edge sous Windows;
2. ordre conseille: OTP Gmail, activation/reconnexion Windows Hello, puis espace client;
3. fallback immediat: OTP Gmail, puis Google si la passkey est annulee ou indisponible;
4. verifier avant rendez-vous que Gmail peut envoyer un code et que le compte de recette est accessible;
5. ne pas presenter Resend, Face ID, Android ou le domaine final comme deja valides;
6. conserver Gmail et les copies US comme rollback.

Cloture technique:

1. relire le diff Auth final et exclure les changements sans rapport;
2. produire un commit squash coherent sur la branche;
3. pousser la branche et fusionner seulement apres validation utilisateur;
4. deployer uniquement si le commit final contient un runtime non encore publie;
5. verifier une derniere fois l'URL sandbox et archiver la preuve de revision;
6. passer ce document a `CLOTUREE` et le fil d'Ariane a `AUTH_PATCH_CLOSED_FOR_DEMO`.

Condition de sortie: branche propre, revision identifiable, sandbox utilisable et runbook remis.

Elements termines:

- runbook cree: [`AUTH_DEMO_RUNBOOK_2026-07-13.md`](./AUTH_DEMO_RUNBOOK_2026-07-13.md);
- gate Auth finale Node `22.23.1`: `54/54 PASS`, zero echec;
- build Next final: succes, compilation `13.8 s`, generation statique `22/22`;
- App Hosting sandbox deploye uniquement sur `secondevie-next-sandbox`;
- rollout Firebase termine avec code de sortie `0`;
- URL publiee: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`;
- smoke heberge post-deploiement: dialogue present, focus initial interne, `Escape` ferme et rend le focus a `Ouvrir la connexion`;
- Functions, regles, secrets et provider email non modifies par ce dernier deploiement.

Reste volontairement avant fermeture definitive de G5:

1. produire et pousser le commit squash de la branche;
2. obtenir la validation utilisateur de la sandbox;
3. fusionner vers `main` seulement apres cette validation;
4. inscrire le hash final et passer le statut a `CLOTUREE`.

## 4. Explicitement non obligatoire avant la demonstration

Les elements suivants sont retires de cette passe. Ils ne doivent pas etre reproposes comme prochaine etape avant la cloture:

| Sujet | Decision | Declencheur de reprise |
| --- | --- | --- |
| Dashboards Google Cloud complets | reporte | preparation du go-live production |
| Alertes calibrees | reporte | volume reel permettant de fixer des seuils |
| p50/p95 serveur statistiques | collecte passive seulement | echantillon representatif disponible |
| Page de gestion des passkeys | backlog produit | besoin confirme par la cliente ou phase compte V2 |
| Firebase Emulator Suite complete | backlog qualite | industrialisation CI avant production |
| Firefox/Apple/Android exhaustifs | matrice production | appareils disponibles et domaine final fixe |
| Face ID et passkeys definitives | bloque domaine | RP ID final configure |
| Canari Resend `resend.dev` | facultatif, reporte | besoin de valider l'API avant le domaine |
| SPF/DKIM/DMARC et bascule Resend | bloque domaine | domaine expediteur achete et controle |
| Suppression des Functions US | interdite dans cette passe | soak complet et zero trafic legitime |
| `minInstances` et optimisation cold start payante | reporte | SLO reel insuffisant et cout accepte |
| Ecran avance de securite du compte | backlog produit | apres retour cliente |

## 5. Definition de cloture de cette passe

La partie connexion est cloturee pour la demonstration lorsque:

- G1 a G5 sont terminees;
- aucune regression P0/P1 n'est ouverte sur OTP, Google, passkey, session ou step-up admin;
- Gmail est toujours le provider actif;
- la sandbox expose la revision finale;
- le runbook de demonstration est utilisable;
- le changeset est identifie dans Git;
- toutes les dettes non necessaires a la demo restent dans la section 4, sans etre transformees en nouvelles gates.

Apres cloture, seules trois raisons autorisent la reouverture de cette passe:

1. regression reproductible bloquant la demonstration;
2. demande explicite de la cliente modifiant le parcours;
3. acquisition du domaine final, qui ouvre une nouvelle passe de production H5/H7 distincte.

## 6. Ordre d'execution restant

```text
G2 gate code finale
  -> G3 smoke accessibilite essentiel
  -> G4 photographie regionale sans suppression
  -> G5 runbook + Git + validation utilisateur
  -> AUTH_PATCH_CLOSED_FOR_DEMO
```

Il n'y a aucune phase cachee apres G5 pour la demonstration.
