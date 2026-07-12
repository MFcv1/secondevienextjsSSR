# Closeout portabilite passkey - phase 2

Date: 2026-07-11
Statut: `IMPLEMENTATION VALIDEE, MATRICE PHYSIQUE A REJOUER APRES DEPLOIEMENT`
Roadmap: `_DOCS/security/AUTHENTICATION_ROBUSTNESS_ROADMAP_2026-07-11.md`

## Resultat

La couche WebAuthn reste portable, mais l'UX grand public a ete revisee en `email-first` le 2026-07-12.

- un navigateur sans historique local voit email + code;
- un navigateur avec activation locale voit `Connexion rapide sur cet appareil`;
- l'email local sert au pre-remplissage et au choix du compte rapide;
- le fallback `Recevoir mon code` reste visible et accessible;
- l'activation WebAuthn est proposee apres une connexion reussie;
- `autocomplete="username webauthn"` prepare l'evolution Conditional UI sans l'activer;
- le texte client privilegie Windows Hello, Face ID ou le code appareil.

## Detection de capacites

Authentification:

- contexte securise requis;
- `window.PublicKeyCredential` requis;
- `navigator.credentials.get` requis.

Enregistrement:

- `navigator.credentials.create` requis.

`isUserVerifyingPlatformAuthenticatorAvailable()` n'est plus bloquant. Une absence d'authentificateur integre ne masque donc plus une cle USB, un telephone par QR, un gestionnaire tiers ou un authentificateur distant.

## Challenges prepares

- enregistrement: `createdAt` et expiration locale de quatre minutes deja appliques;
- authentification: `createdAt` ajoute et expiration locale de quatre minutes appliquee;
- un challenge expire n'est plus reutilise;
- sur `deadline-exceeded` ou `failed-precondition`, le cache prepare est efface et une nouvelle action utilisateur est necessaire;
- aucune boucle automatique de ceremonies WebAuthn.

## Retour au contexte

La creation d'une passkey ne force plus `router.push('/')`. La modale se ferme sur la route courante, ce qui preserve wishlist, commandes, checkout ou galerie. Aucun redirect externe n'est construit.

## Validations

Environnement: Node `22.23.1`.

- contrats AuthStore + portabilite: `8/8`;
- lint cible phase 2: aucune erreur;
- build Next production: succes;
- Playwright desktop passkey: `2/2`;
  - coherence `Quitter` / `Mon espace`;
  - validation historique remplacee par l'avenant UX email-first du 2026-07-12;
- routes publiques: classification inchangee lors de la validation de phase 1.

## Limites de rollout

La matrice physique suivante exige un deploiement sandbox, car WebAuthn lie la credential au RP ID:

- Chrome + Windows Hello;
- Brave + Windows Hello;
- Edge + Windows Hello;
- Safari/macOS ou iOS si disponible;
- cle USB/NFC si disponible;
- telephone par QR;
- nouveau profil navigateur sans stockage local;
- annulation, timeout et refus utilisateur.

Les passkeys sandbox restent jetables et devront etre recreees sur le domaine final.

## Decision de gate

L'implementation de phase 2 est validee. La phase 3 peut commencer sur le serveur sandbox. Le rollout production et la promesse de compatibilite navigateur restent interdits avant la matrice physique et le domaine final.

## Avenant UX du 2026-07-12

La recette cliente a montre que le bouton generique `Utiliser une passkey` ouvrait des choix WebAuthn avances (QR code, cle physique ou appareil distant) trop tot dans le parcours.

Le contrat produit est donc ajuste:

- premiere connexion: email puis code a six chiffres;
- apres connexion reussie: proposition d'activer la connexion rapide sur l'appareil;
- visites suivantes avec marqueur local: bouton `Connexion rapide sur cet appareil`;
- fallback email toujours disponible;
- aucune autorisation ne depend du marqueur local, qui reste uniquement un indice d'affichage.
