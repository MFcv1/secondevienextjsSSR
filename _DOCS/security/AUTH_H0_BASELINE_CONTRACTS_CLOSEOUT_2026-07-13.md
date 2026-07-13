# Closeout H0 - baseline et contrats Auth executables

Date: 2026-07-13  
Statut: `VALIDEE_SANDBOX`  
Branche: `codex/auth-production-hardening`  
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)

## 1. Decision

La phase H0 est validee sur sandbox. Le chantier dispose maintenant d'un runner Auth unique et reproductible sous Node 22. Les six fichiers de test demarrent ensemble et les transitions backend critiques disposent d'une premiere preuve comportementale avec Firebase Admin simule.

Cette validation ne signifie pas que les findings H1 a H7 sont corriges. Elle garantit que leur implementation peut commencer sur une baseline executable et datee.

## 2. Changements effectues

### Mock Firebase Functions v1

`tests/auth-claims.test.cjs` supporte desormais la chaine utilisee en production:

```text
functions.runWith(...).auth.user().onCreate(...)
```

Le mock retourne le meme objet Functions apres `runWith()`. Les deux refus d'attribution admin pour email non verifie executent donc reellement le handler du trigger.

### Contrats comportementaux backend

`tests/auth-backend-transitions.test.cjs` execute deux parcours avec des doubles Firebase limites au comportement utile:

1. OTP client valide:
   - lecture transactionnelle de l'etat OTP;
   - validation du HMAC avec une fixture non sensible;
   - marquage `usedAtMillis` et suppression du hash;
   - conservation du role d'un utilisateur existant;
   - creation du Custom Token avec `signInProvider: 'email_otp'`.
2. retrait d'un administrateur:
   - lecture de la whitelist;
   - passage des claims `admin` et `superAdmin` a `false`;
   - passage du profil a `role: 'user'`;
   - suppression de l'entree whitelist;
   - emission de l'audit metier.

Ces tests figent volontairement le comportement actuel. H3 remplacera le moment de consommation OTP par une machine d'etat idempotente. H4 ajoutera la revocation des refresh tokens et le registre d'autorisation actif.

### Runner unique

Le script suivant a ete ajoute a `package.json`:

```bash
npm run test:auth
```

Il execute:

- claims admin;
- AuthStore;
- contrat OTP unifie;
- transitions backend OTP/revocation;
- passkey client/portabilite;
- passkey serveur/hardening.

## 3. Preuves reproductibles

### Environnement

| Element | Valeur prouvee |
| --- | --- |
| Node local de gate | `22.23.1` |
| contrainte projet | `22.x` |
| Firebase CLI | `15.23.0` |
| commit de depart | `f0b8331854dfcf280b2961ccac89fbd586a3ab88` |
| runtime Functions inventorie | `nodejs22` |

### Resultat des tests

Commande:

```bash
npm run test:auth
```

Resultat du 2026-07-13:

| Indicateur | Resultat |
| --- | ---: |
| tests | 22 |
| succes | 22 |
| echecs | 0 |
| ignores/todo | 0 |
| duree TAP | 181.3925 ms |

### Inventaire cloud en lecture seule

`firebase functions:list --project secondevienextjsssr` confirme:

- Functions Auth executees sur Node 22;
- callables Auth presentes en `europe-west1`;
- copies historiques Auth encore presentes en `us-central1`;
- aucune mutation cloud realisee pendant H0.

Ce constat maintient H6 ouverte.

### Baseline de latence reutilisee

La baseline UI du 2026-07-11 reste la reference avant changements runtime:

| Ouverture modale | p50 | p95 |
| --- | ---: | ---: |
| cold | 1 181 ms | 1 215 ms |
| warm | 120 ms | 216 ms |

Source: [`AUTH_PHASE0_UI_BASELINE_2026-07-11.md`](../perf/AUTH_PHASE0_UI_BASELINE_2026-07-11.md).

Elle ne mesure ni la livraison email, ni la verification OTP, ni une ceremonie WebAuthn physique. Ces mesures seront produites par les phases qui modifient ces flux.

## 4. Gate H0

| Critere | Etat | Preuve |
| --- | --- | --- |
| toutes les suites Auth demarrent | PASS | runner unique execute |
| toutes les suites Auth passent | PASS | `22/22` |
| transitions critiques non limitees aux regex | PASS | deux handlers executes avec mocks Admin |
| baseline datee | PASS | environnement, commit, tests, regions, latence UI |
| aucune donnee personnelle reelle | PASS | domaines `.test`, UID fictifs, HMAC fixture |
| aucun secret dans les sorties | PASS | aucun secret consulte ou copie |

## 5. Limites reportees explicitement

- H1: User Verification passkey encore optionnelle dans le runtime actuel;
- H2: assurance forte admin non encore imposee;
- H3: OTP encore consomme avant la creation du Custom Token;
- H4: refresh tokens admin non encore revoques;
- H5: domaine final et RP ID non fixes;
- H6: copies `us-central1` encore publiees;
- H7: Gmail et secret HMAC encore couples.

## 6. Rollback

H0 n'a modifie aucun runtime et aucune ressource cloud. Le rollback consiste uniquement a retirer le script `test:auth`, le fichier de transitions backend et le support `runWith()` du mock. Aucun rollback de donnees n'est necessaire.

## 7. Suite autorisee

La phase H1 peut commencer. Sa gate devra prouver que:

- l'inscription passkey demande `userVerification: 'required'`;
- l'authentification passkey demande `userVerification: 'required'`;
- les deux verifications serveur utilisent `requireUserVerification: true`;
- une assertion sans drapeau UV est refusee;
- Windows Hello, Face ID, Touch ID ou le code appareil restent choisis par le systeme d'exploitation, sans changement du parcours email-first actuel.
