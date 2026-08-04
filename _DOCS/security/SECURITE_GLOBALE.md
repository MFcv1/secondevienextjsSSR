# Securite globale

Derniere mise a jour: 2026-08-04
Statut: `PREPROD_READY`
Reference Auth associee: `AUTHENTIFICATION.md`

## 1. Perimetre et modele de confiance

Ce document couvre la securite hors detail du workflow Auth. Les frontieres principales sont:

```text
navigateur non fiable
  -> Next.js public
  -> Firebase Auth / App Check
  -> Firestore et Storage rules
  -> Cloud Functions privees
  -> Stripe / Gmail ou Resend
  -> donnees et secrets serveur
```

Regles fondatrices:

- le navigateur ne constitue jamais une frontiere d'autorisation;
- une variable `NEXT_PUBLIC_*` est publique par definition;
- les operations metier sensibles passent par une Function serveur ou des rules strictes;
- l'identite, le role, l'assurance AAL2 et l'etat du registre admin sont des controles distincts;
- les webhooks sont authentifies par leur signature fournisseur, pas par App Check;
- les endpoints publics restent minimaux, bornes et sans donnees privees.

## 2. Authentification et autorisation

Le detail OTP, Google, passkeys, sessions et step-up est dans `AUTHENTIFICATION.md`.

Pour un administrateur, un claim seul ne suffit pas. Le controle fort exige:

1. un ID token Firebase valide;
2. un claim `admin` ou `superAdmin`;
3. une entree active dans `sys_admin_access/{uid}`;
4. une assurance AAL2 Google ou passkey pendant la session Firebase valide;
5. les controles metier propres a la Function.

La suppression d'un acces admin doit retirer les claims, desactiver le registre et revoquer les refresh tokens. Les interfaces peuvent masquer une action, mais le serveur doit toujours la refuser de facon autonome.

## 3. Firestore Rules

`firestore.rules` est la source executable. Principaux contrats:

| Zone | Lecture | Ecriture |
| --- | --- | --- |
| catalogue public `artifacts/.../public/data/...` | public selon rules | admin fort uniquement |
| metadata publique | selon document | admin fort |
| `users/{uid}` | proprietaire/admin selon cas | proprietaire borne ou serveur |
| panier `users/{uid}/cart` | proprietaire | proprietaire |
| wishlist `users/{uid}/wishlist` | proprietaire | proprietaire |
| `orders` | client proprietaire ou admin | serveur/admin selon operation |
| `sys_metadata` | cas par cas | admin fort |
| `sys_ratelimit` | aucune lecture client | serveur uniquement |
| `sys_admin_access` | controle strict | serveur/super-admin |
| `sys_idempotency` | aucune lecture client | serveur uniquement |
| analytics et rollups | admin selon besoin | serveur |

Toute nouvelle collection doit avoir une decision explicite dans les rules avant son utilisation. Le fallback final doit rester deny-by-default.

## 4. Storage Rules

`storage.rules` protege les medias. Les lectures publiques servent le catalogue.
Tous les chemins d'ecriture admin autorises exigent un claim admin, une
assurance AAL2 Google ou passkey et une entree active relue dans
`sys_admin_access` via les fonctions interservices Firestore des Storage Rules.
Aucune fenetre de quinze minutes ni passkey obligatoire n'est imposee.

Avant d'ajouter un chemin Storage:

- definir qui peut lire et ecrire;
- borner type MIME et taille lorsque possible;
- verifier que le nom de chemin ne permet pas d'ecraser un autre domaine;
- prevoir la suppression liee au document Firestore;
- tester un admin sans registre, un admin Google actif, une passkey active meme
  ancienne, un claim absent et un fichier invalide;
- conserver une Function avec registre actif avant les parcours metier qui
  precedent un upload direct.

## 5. Cloud Functions

Les helpers communs sont dans `functions/helpers/security.js`, `runtime.js`, `secrets.js` et `config.js`.

Controles attendus selon le type:

- callable client: Auth, App Check si compatible, validation schema, rate limit et idempotence;
- callable admin: Auth + role + registre + assurance AAL2 Google ou passkey;
- webhook Stripe: lecture du corps brut et verification de signature;
- trigger Firestore: validation defensive des donnees, idempotence et effets bornes;
- tache planifiee: limite, retention, journalisation et absence de confiance dans les donnees historiques;
- endpoint E2E: fail-closed hors configuration de test explicite.

Le catalogue public ne possede plus de Function HTTP ni de codebase separe. App Hosting lit le bucket snapshot prive avec son compte de service; les clients Firestore anonymes ne peuvent pas lire `furniture`.

## 6. App Check

App Check reduit l'abus automatise mais ne remplace ni Auth, ni les rules, ni les signatures.

Le dernier etat documente du sandbox est un mode d'observation, avec debug token reserve aux tests. Avant tout enforcement:

1. re-verifier l'etat reel dans Firebase Console;
2. mesurer les requetes `VALID`, `MISSING` et `INVALID` par produit;
3. separer navigateur, SSR, webhooks, Functions publiques et E2E;
4. confirmer qu'aucun parcours client legitime ne casse;
5. activer progressivement avec un rollback ecrit.

Ne jamais committer un debug token App Check.

## 7. Secrets et configuration

Secrets typiques:

- cles Stripe serveur et signatures webhook;
- compte et mot de passe applicatif Gmail tant qu'il reste actif;
- `RESEND_API_KEY` preparee mais inactive;
- secret HMAC OTP dedie;
- e-mail super-admin;
- secrets E2E locaux.
- identifiants d'application Meta, redirect URI exact et cle AES-GCM dediee au
  chiffrement du Page access token.

Regles:

- Secret Manager ou configuration Functions pour toute valeur serveur sensible;
- aucune valeur sensible dans Git, le chat, les logs de test ou une capture;
- rotation apres exposition suspectee;
- secrets sandbox et production separes;
- permissions IAM minimales;
- un secret ne doit pas etre reutilise comme cle cryptographique pour un autre usage.

Le rail Meta stocke uniquement un Page access token chiffre en AES-256-GCM
dans `sys_meta_connections`. Les states OAuth sont one-shot, expires et
proteges par un verificateur dont seul le hash est persiste. Les collections
OAuth, choix d'actifs, sagas sociales et audits sont interdites au navigateur
par `firestore.rules`; toutes les projections retournees au client retirent les
IDs Meta et le token chiffre.

## 8. Securite HTTP et navigateur

`next.config.mjs` applique:

- CSP en production;
- HSTS en production;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- Referrer Policy stricte;
- Permissions Policy;
- suppression du header `X-Powered-By`.

Une nouvelle origine externe doit etre ajoutee a la directive CSP minimale correspondante. Ne pas ouvrir `connect-src`, `frame-src` ou `script-src` avec un wildcard pour corriger rapidement un blocage.

## 9. Operations destructives

Les remises a zero, purges, remboursements, retraits admin et nettoyages de donnees exigent:

- une autorisation serveur forte;
- une intention explicite et une confirmation adaptee;
- un scope visible;
- une journalisation avec acteur et horodatage;
- une operation idempotente ou reprenable;
- une preuve de sauvegarde/rollback quand la perte est irreversible.

Ne jamais lancer un script de migration, de purge ou de backfill en mode commit pour explorer son comportement.

## 10. Dettes production

| Sujet | Statut | Condition de fermeture |
| --- | --- | --- |
| rail Firebase production absent | `PRODUCTION_DEFERRED` | projet/alias/backend prod, IAM, secrets et recette crees |
| App Check enforcement non prouve | `PRODUCTION_DEFERRED` | telemetrie representative et rollout progressif |
| domaine, CSP et origines finales | `PRODUCTION_DEFERRED` | domaine achete et configure |
| sauvegardes, alertes et observabilite prod | `PRODUCTION_DEFERRED` | politique d'exploitation approuvee |
| endpoints E2E exportes | `DEBT` | garder fail-closed ou retirer dans une passe Functions dediee |

## 11. Checklist avant livraison production

- [ ] projet et alias production distincts;
- [ ] secrets production crees et permissions revues;
- [ ] domaine, TLS, CSP et origines Auth/WebAuthn finalises;
- [ ] Firestore/Storage rules deployees et testees;
- [ ] App Check decide produit par produit;
- [ ] Stripe live, webhooks live et Connect valides;
- [ ] Resend + SPF/DKIM/DMARC valides;
- [ ] sauvegarde et restauration testees;
- [ ] alertes erreurs, paiements et Auth configurees;
- [ ] E2E et outils de maintenance fermes en production;
- [ ] runbook incident et rollback relu.
