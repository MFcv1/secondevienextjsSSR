# Closeout H1 - verification locale passkey obligatoire

Date: 2026-07-13
Statut: `VALIDEE_SANDBOX`
Branche: `codex/auth-production-hardening`
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)

## 1. Decision

La phase H1 est validee sur sandbox. Une passkey ne peut plus etre creee ou utilisee sans User Verification WebAuthn, c'est-a-dire une confirmation locale par Windows Hello, Face ID, Touch ID, PIN ou code appareil selon la plateforme.

Le parcours UI email-first reste identique. Le changement porte sur le moteur serveur et sur la preuve cryptographique UV.

## 2. Garanties techniques implementees

### Options d'inscription

La Function `generatePasskeyRegistrationOptions` impose:

```text
authenticatorSelection.userVerification = required
```

Le navigateur doit demander une authentification locale compatible UV pendant l'enrolement.

### Verification d'inscription

La Function `verifyPasskeyRegistration` impose deux controles:

```text
requireUserVerification = true
registrationInfo.userVerified === true
```

Le premier controle est applique par SimpleWebAuthn. Le second constitue une defense en profondeur avant l'ecriture du credential dans Firestore.

### Options d'authentification

La Function `generatePasskeyAuthenticationOptions` impose:

```text
userVerification = required
```

### Verification d'authentification

La Function `verifyPasskeyAuthentication` impose:

```text
requireUserVerification = true
authenticationInfo.userVerified === true
```

Aucun Custom Token Firebase n'est emis si UV n'est pas prouvee.

## 3. Journalisation et confidentialite

Les logs ajoutes ne stockent jamais la reponse WebAuthn, la cle publique complete, le PIN, les donnees biometriques ou le Custom Token.

Les champs structures sont limites a:

- type de ceremonie: inscription ou authentification;
- resultat UV booleen;
- nom generique d'erreur en cas de rejet.

Le message utilisateur en cas d'absence UV est:

```text
Confirmez votre identite avec Windows Hello, Face ID ou le code de votre appareil.
```

## 4. Deploiement sandbox

Les quatre Functions suivantes ont ete mises a jour:

- `generatePasskeyRegistrationOptions`;
- `verifyPasskeyRegistration`;
- `generatePasskeyAuthenticationOptions`;
- `verifyPasskeyAuthentication`.

Deploiement transitoire realise dans:

- `europe-west1`, region utilisee par le client;
- `us-central1`, copie historique conservee jusqu'a H6.

Runtime: Node 22, Functions v1.

Aucun deploiement App Hosting n'etait necessaire: aucun composant client ni texte UI n'a change.

## 5. Preuves automatisees

Commande:

```bash
npm run test:auth
```

Resultat apres H1:

| Indicateur | Resultat |
| --- | ---: |
| tests | 23 |
| succes | 23 |
| echecs | 0 |
| duree TAP | 139.695 ms |

Le contrat H1 verifie notamment:

- deux options `userVerification: 'required'`;
- deux verifications `requireUserVerification: true`;
- absence des anciennes valeurs `preferred/false`;
- controle explicite de `userVerified`;
- message de recuperation traduit;
- maintien des protections App Check, origine, challenge, replay, TTL, compteur et limites d'abus.

## 6. Recette physique Windows Hello

La recette a ete effectuee par l'utilisateur apres le deploiement H1:

1. connexion initiale via le parcours commun;
2. activation d'une nouvelle passkey sur l'appareil;
3. validation Windows Hello locale;
4. deconnexion;
5. reconnexion via `Connexion rapide sur cet appareil`;
6. seconde validation Windows Hello;
7. ouverture de l'espace compte.

Preuves observees apres reconnexion:

- route live: `/mes-commandes`;
- titre principal: `Vos commandes, simplement.`;
- bouton `Quitter` present dans le header;
- donnees du compte chargees;
- role administrateur conserve;
- aucune boucle de popup;
- fallback `Recevoir un code par email` toujours disponible avant reconnexion.

Le PIN Windows Hello a ete saisi uniquement par l'utilisateur dans la fenetre systeme. Il n'a jamais ete transmis, lu ou enregistre par l'agent.

## 7. Gate H1

| Critere | Etat | Preuve |
| --- | --- | --- |
| options inscription UV required | PASS | contrat source |
| verification inscription UV obligatoire | PASS | SimpleWebAuthn + defense en profondeur |
| options authentification UV required | PASS | contrat source |
| verification authentification UV obligatoire | PASS | SimpleWebAuthn + defense en profondeur |
| nouvelle passkey Windows Hello | PASS | recette utilisateur |
| deconnexion/reconnexion | PASS | recette utilisateur et etat live |
| Custom Token puis session Firebase | PASS | `/mes-commandes` authentifiee |
| synchronisation UI | PASS | `Quitter`, espace compte |
| fallback OTP | PASS | controle visible avant reconnexion |
| aucune boucle popup | PASS | recette physique |
| aucun secret/PIN expose | PASS | preuve redigee sans valeur sensible |

## 8. Compatibilite restant obligatoire avant production

La validation sandbox prouve Windows Hello dans le navigateur integre Chromium. Avant `VALIDEE_PRODUCTION`, H8 devra encore couvrir:

- Chrome sur Windows;
- Edge sur Windows;
- Brave sur Windows;
- Safari sur iPhone/iPad ou macOS si Face ID/Touch ID est annonce au client;
- cle FIDO2 avec PIN si cette compatibilite est revendiquee.

Une incompatibilite constatee rouvrira H1. L'absence actuelle de cette matrice interdit seulement une promesse multi-navigateurs definitive; elle ne remet pas en cause la preuve UV serveur du sandbox.

## 9. Rollback

Le rollback consiste a redeployer la version precedente des quatre Functions. Il ne doit etre utilise sur sandbox qu'en cas de regression navigateur confirmee. Tout rollback rouvrirait H1, car `preferred/false` n'est pas acceptable en production.

## 10. Suite autorisee

H2 peut commencer. Elle doit conserver l'interface commune tout en distinguant cote serveur:

- connexion client/recuperation par OTP: assurance interne AAL1;
- passkey avec UV: assurance interne AAL2;
- action admin sensible: AAL2 recente avec step-up explicite.
