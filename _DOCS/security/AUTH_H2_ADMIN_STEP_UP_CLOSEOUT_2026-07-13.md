# Closeout H2 - assurance forte et step-up administrateur

Date: 2026-07-13  
Statut: `VALIDEE_SANDBOX`  
Branche: `codex/auth-production-hardening`  
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)

## 1. Decision

H2 est validee sur le sandbox. Un role `admin` ou `superAdmin` ne suffit plus pour ouvrir le backoffice ou appeler une operation administrative protegee. Le serveur, les Rules et le client exigent desormais une authentification interne AAL2.

Le parcours client reste identique:

- OTP email: AAL1, espace client autorise;
- passkey avec User Verification: AAL2;
- Google: AAL2 selon la politique operationnelle du compte proprietaire;
- operation sensible: AAL2 et `auth_time` inferieur ou egal a 900 secondes.

Les termes AAL1/AAL2 sont internes au projet et ne constituent pas une certification NIST.

## 2. Contrat de session

Le Custom Token passkey emis apres verification WebAuthn porte exclusivement des claims serveur:

```text
authMethod: passkey
authAssurance: aal2
userVerified: true
```

Le Custom Token OTP porte:

```text
authMethod: email_otp
authAssurance: aal1
userVerified: false
```

Le client ne peut ni fabriquer ni elever ces claims. Pour Google, le serveur et les Rules reconnaissent uniquement `firebase.sign_in_provider == 'google.com'`.

## 3. Controle serveur centralise

`functions/helpers/security.js` fournit maintenant:

- `getAuthAssurance(context)`;
- `checkStrongAdmin(context)`;
- `checkStrongSuperAdmin(context)`;
- `checkRecentStrongAdmin(context, 900)`;
- `checkRecentStrongSuperAdmin(context, 900)`.

Les anciens helpers `checkRecentAdmin()` et `checkRecentSuperAdmin()` deleguent aux variantes fortes. Les callables existantes ne peuvent donc plus conserver silencieusement l'ancien comportement role + fraicheur sans methode forte.

Les erreurs de step-up utilisent des details structures:

```text
reason: strong-auth-required
reason: recent-strong-auth-required
requiredAssurance: aal2
```

## 4. Operations protegees

Le perimetre H2 couvre:

- ajout, retrait et synchronisation super-admin;
- statistiques et listes utilisateurs;
- remboursement et resynchronisation Stripe;
- lecture, onboarding, synchronisation et reconnexion Stripe Connect;
- email de diagnostic et notification de remboursement;
- outils de maintenance destructifs;
- generation d'URL d'upload admin;
- lectures/ecritures directes du backoffice dans Firestore;
- ecritures et suppressions Storage admin.

Les actions destructives, financieres ou super-admin exigent AAL2 recente. Les lectures administratives et l'ouverture du backoffice exigent au minimum AAL2.

H4 ajoutera en plus une registry admin active par UID et la revocation des refresh tokens.

## 5. Rules Firebase

Firestore definit `hasStrongAuth()` et `isStrongArtisan()`. Tous les chemins auparavant accessibles directement avec `isArtisan()` utilisent maintenant `isStrongArtisan()` pour les acces admin:

- profils utilisateurs;
- produits brouillons et mutations catalogue;
- metadata privees;
- newsletter;
- commandes;
- analytics et tableaux de bord.

Storage exige le role admin et la meme preuve AAL2 avant toute ecriture. Les limites de taille et de type MIME restent appliquees aux creations/mises a jour; la suppression reste possible avec AAL2.

Les Rules Firestore et Storage ont compile puis ete publiees avec succes par Firebase CLI.

## 6. Interface et AuthStore

`AuthStore` expose desormais:

- `authAssurance`;
- `authMethod`;
- `userVerified`;
- `authTime`.

`AuthContext` expose egalement `hasStrongAuth`.

Un admin AAL1 qui ouvre `/admin` voit une barriere calme `Confirmez votre identite`. Le bouton ouvre la modale commune existante avec Google, connexion rapide et fallback OTP. Aucun second formulaire de connexion n'a ete cree.

Une connexion OTP conserve l'acces client mais ne franchit pas cette barriere. Une connexion passkey AAL2 met a jour le store via le pipeline Firebase existant et affiche le backoffice sans boucle ni changement de route.

## 7. Preuves automatisees

Commande:

```bash
npm run test:auth
```

Resultat Node `22.23.1`:

| Indicateur | Resultat |
| --- | ---: |
| tests | 29 |
| succes | 29 |
| echecs | 0 |
| duree TAP | 172.0119 ms |

Scenarios H2 executes:

- admin OTP AAL1 refuse;
- admin passkey UV recente autorise;
- passkey admin agee de 901 secondes refusee;
- Google admin reconnu AAL2;
- client non admin avec passkey AAL2 refuse;
- claims de mint passkey/OTP conformes;
- Firestore et Storage alignes sur le meme contrat.

Compilation Next production:

- Next.js `15.5.20`;
- compilation reussie;
- 22 pages statiques generees;
- duree totale 74 secondes;
- avertissements historiques presents, aucune erreur bloquante H2.

## 8. Deploiement sandbox

Cloud Functions:

- 25 fonctions ciblees mises a jour;
- Functions passkey/OTP publiees dans `europe-west1` et dans la copie transitoire `us-central1`;
- autres callables admin publiees en `us-central1` selon leur definition actuelle;
- runtime Node 22;
- suppression des copies Auth `us-central1` reportee a H6.

Rules:

- `firestore.rules`: compilation et publication reussies;
- `storage.rules`: compilation et publication reussies.

App Hosting:

- backend `secondevie-next-sandbox`;
- rollout termine;
- source de deploiement isolee depuis `HEAD`;
- seuls `AdminAppIsland.jsx`, `authStore.js` et `AuthContext.jsx` ont ete injectes;
- les modifications concurrentes de transition de route n'ont pas ete embarquees.

## 9. Recette physique Windows Hello

Recette effectuee le 2026-07-13:

1. ouverture de `/admin` avec une session anterieure sans claims H2;
2. barriere `Confirmez votre identite` affichee;
3. ouverture de la modale commune;
4. `Connexion rapide sur cet appareil` visible pour le compte local;
5. premiere ceremonie expiree en l'absence de l'utilisateur, sans elevation;
6. ceremonie relancee manuellement;
7. PIN Windows Hello saisi localement par l'utilisateur;
8. Custom Token AAL2 accepte par Firebase Auth;
9. barriere retiree et dashboard admin charge.

Preuve live apres step-up:

- route `/admin?e2e_run=auth-h2-stepup`;
- titre `Gestion Boutique`;
- onglets `Stats`, `Data`, `Publication`, `Vue Globale`;
- agregats CA, commandes et ventes charges;
- aucune boucle de modale;
- le PIN, l'assertion WebAuthn et le Custom Token n'ont jamais ete lus, transmis ou documentes.

Le chargement des donnees administratives apres publication des Rules prouve que la session possede a la fois le role requis et l'assurance AAL2.

## 10. Politique Google et limite production

Google est accepte comme AAL2 par contrat technique lorsque Firebase atteste `google.com`. Le MFA reel du compte Google proprietaire ne peut pas etre atteste par un claim Firebase standard: il reste une exigence d'exploitation a verifier manuellement avant `VALIDEE_PRODUCTION`.

Jusqu'a cette preuve, la passkey UV constitue la methode privilegiee pour l'administration. Aucun OTP email seul ne doit etre utilise comme solution de repli admin.

## 11. Gate H2

| Critere | Etat | Preuve |
| --- | --- | --- |
| OTP ne produit pas AAL2 | PASS | test comportemental + claims serveur |
| passkey UV produit AAL2 | PASS | test + recette Windows Hello |
| role admin toujours exige | PASS | test client passkey refuse |
| fraicheur 15 minutes | PASS | test 901 secondes refuse |
| backoffice bloque en AAL1 | PASS | etat live avant step-up |
| Firestore/Storage non contournables par UI | PASS | Rules compilees et publiees |
| dashboard accessible apres step-up | PASS | DOM live et donnees chargees |
| interface commune conservee | PASS | modale existante reutilisee |
| boucle de navigation/modale | PASS | aucune observee |
| politique Google documentee | PASS sandbox | preuve MFA proprietaire requise avant production |

## 12. Rollback

Le rollback doit conserver le controle de role. En cas de regression passkey:

1. conserver les Rules et helpers AAL2;
2. utiliser temporairement Google pour le step-up;
3. ne jamais revenir a OTP seul pour l'administration;
4. redeployer le frontend precedent uniquement avec une alternative forte fonctionnelle;
5. rouvrir H2 si une couche serveur, Rules ou client est retiree.

## 13. Suite autorisee

H3 peut commencer: rendre la verification OTP idempotente apres consommation logique et separer le secret HMAC OTP du mot de passe SMTP. La creation du secret cloud devra etre faite sans afficher sa valeur.
