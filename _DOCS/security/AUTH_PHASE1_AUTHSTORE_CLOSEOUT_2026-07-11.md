# Closeout AuthStore - phase 1

Date: 2026-07-11
Statut: `VALIDE LOCALEMENT ET SUR FUNCTIONS SANDBOX`
Roadmap: `_DOCS/security/AUTHENTICATION_ROBUSTNESS_ROADMAP_2026-07-11.md`

## Resultat

L'etat d'authentification client possede maintenant une source unique: `src/kit/auth/authStore.js`.

Le store expose un snapshot stable:

- `status`: `unknown`, `anonymous`, `authenticated` ou `error`;
- `user`;
- claims `admin` et `superAdmin`;
- `claimsStatus`;
- `lastAuthMethod`;
- `authReady`;
- erreur courante eventuelle.

Firebase Auth est observe une seule fois par onglet avec `onIdTokenChanged`. Les evenements `sv:auth-user-changed`, `sv:auth-admin-changed`, `window.__svAuthUser` et `window.__svAuthIsAdmin` restent uniquement comme ponts sortants de migration.

## Consommateurs migres

- `AuthContext`;
- header de compte;
- menu global desktop critique;
- panneau Auth du menu global;
- panneau panier;
- modale de connexion via son `AuthProvider` partageant le singleton.

Le menu force une resynchronisation du store a chaque ouverture. Cette action ne cree pas de seconde subscription.

## Pipeline unifie

Les connexions ne publient l'utilisateur qu'apres resolution de l'appel Firebase:

```text
resultat fournisseur ou Custom Token
  -> signIn Firebase attendu
  -> AuthStore authenticated
  -> claims lus sans refresh force systematique
  -> ponts UI et consommateurs React notifies
```

La deconnexion suit:

```text
signOut Firebase attendu
  -> AuthStore anonymous
  -> header, menu et panier mis a jour
```

Un echec `signOut` ne produit donc plus un faux etat local deconnecte.

`lastAuthMethod` distingue maintenant `google`, `password`, `email_otp`, `passkey` et `custom_token`.

## Synchronisation onglets

- `BroadcastChannel('secondevie-auth')` diffuse uniquement un signal de statut;
- fallback `storage` sur `sv:auth-signal`;
- aucun ID token, Custom Token, email ou credential n'est diffuse;
- le signal demande une verification Firebase reelle et ne donne jamais un droit;
- Firebase reste autoritaire pour la persistence multi-onglets.

## Etat `unknown`

Le header n'affiche plus immediatement `Connexion` pendant une restauration potentielle. Un placeholder stable et non interactif est affiche jusqu'a resolution.

## Adaptateur E2E

`window.__svE2EInjectAuthUser` existe uniquement si les deux conditions sont vraies:

- query string contenant `e2e_run`;
- hostname `localhost`, `127.0.0.1` ou sandbox `.hosted.app`.

Il sert au contrat visuel passkey et ne remplace pas les tests Firebase reels. Sans ces conditions, aucun adaptateur n'est expose.

## Validations executees

Environnement: Node `22.23.1`.

1. Gate statique `tests/auth-store-contract.test.cjs`: `4/4`.
2. Lint cible: aucune erreur; trois avertissements historiques/cosmetiques dans `AuthContext`.
3. Build Next production: succes.
4. Gate de classification Next: succes; routes publiques toujours statiques/SSG/ISR et tunnels Auth dynamiques.
5. Playwright cible passkey UI: `1/1`; `Quitter` et `Mon espace` visibles simultanement.
6. E2E OTP reel via Gmail/App Check/Functions sandbox:
   - envoi et reception OTP: succes;
   - verification OTP: succes;
   - `signInWithCustomToken`: succes;
   - coherence header/menu: succes;
   - deconnexion: succes;
   - reconnexion: succes;
   - meme UID retrouve: oui.

Les deux erreurs console de l'E2E reel sont `requestStorageAccess: Permission denied` sur localhost, liees au contexte tiers AuthDomain; elles n'ont pas interrompu le flux Custom Token.

## Limites restantes

- la vraie ceremonie passkey doit etre rejouee sur le hostname sandbox apres deploiement, car la credential WebAuthn est liee au RP ID et ne fonctionne pas sur localhost;
- la synchronisation deux onglets doit recevoir un test E2E reel dedie lors du rollout sandbox;
- les consommateurs legacy restants qui lisent seulement `window.__svAuthUser` seront migres progressivement, mais ils ne creent plus de subscription Firebase;
- `AdminDashboard` conserve un refresh de claims explicite lie a son action metier; il ne cree pas d'observateur Auth concurrent.

## Decision de gate

La phase 1 est validee pour poursuivre la phase 2. Le deploiement sandbox et la recette passkey physique restent des gates de rollout, pas des raisons de conserver l'ancienne architecture concurrente.
