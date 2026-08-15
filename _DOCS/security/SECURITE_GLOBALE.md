# Securite globale

Derniere mise a jour: 2026-08-12
Statut: `PREPROD_READY`
Reference Auth associee: `AUTHENTIFICATION.md`
Suivi temporaire de cloture: `STABILISATION_SECURITE_SANDBOX.md`

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

L'e-mail `SUPER_ADMIN_EMAIL` n'est jamais un role operationnel. Il n'est
accepte que par `syncSuperAdminClaim`, pour amorcer une fois le claim et le
registre proprietaire avec e-mail verifie et AAL2. Les routes Next admin et les
Functions exigent ensuite claim, registre actif et AAL2; l'ajout ou le retrait
d'un autre administrateur exige en plus le role `owner` du registre.

## 3. Firestore Rules

`firestore.rules` est la source executable. Principaux contrats:

| Zone | Lecture | Ecriture |
| --- | --- | --- |
| catalogue public `artifacts/.../public/data/...` | public selon rules | admin fort uniquement |
| metadata publique | selon document | admin fort |
| `users/{uid}` | proprietaire/admin selon cas | serveur uniquement |
| panier `users/{uid}/cart` | proprietaire | proprietaire |
| wishlist `users/{uid}/wishlist` | proprietaire | proprietaire, schema borne et ID document concordant |
| `orders` | UID client proprietaire ou admin fort | serveur uniquement |
| `quote_requests` | Functions admin AAL2 uniquement | Functions publiques bornées ou admin AAL2 |
| `newsletter_reward_plays`, `newsletter_rewards` | Functions uniquement | Functions publiques bornées |
| `newsletter_subscribers` | admin fort | Functions publiques bornées ou admin fort |
| `sys_metadata` | cas par cas | admin fort |
| `sys_ratelimit` | aucune lecture client | serveur uniquement |
| `sys_admin_access` | controle strict | serveur/super-admin |
| `sys_idempotency` | aucune lecture client | serveur uniquement |
| `sys_audit_security`, `sys_audit_stripe_connect` | aucune lecture client | serveur uniquement |
| `product_publication_sessions` | aucune lecture client | serveur uniquement |
| analytics et rollups | admin selon besoin | serveur |
| `sys_meta_connections`, `sys_meta_oauth_states`, `sys_meta_asset_choices`, `sys_social_publications`, `sys_audit_meta` | aucune lecture client | serveur uniquement |

Toute nouvelle collection doit avoir une decision explicite dans les rules avant son utilisation. Le fallback final doit rester deny-by-default.

Le document racine `users/{uid}` est materialise exclusivement par les
Functions: ni le proprietaire ni un admin via SDK client ne peut y injecter un
champ. Le panier conserve son contrat client borne. La wishlist n'accepte que
son snapshot d'affichage non autoritaire, un `originalId` identique a l'ID du
document, des tailles/prix bornes et aucun champ supplementaire.

Pour une commande, l'UID materialise au checkout est l'unique preuve de
propriete cote Rules. Un compte possedant la meme adresse e-mail, meme verifiee
par Google, ne peut pas lire la commande d'un autre UID. L'e-mail reste une
coordonnee de snapshot et de notification, jamais une capacite d'acces.

Les demandes de devis suivent une frontiere stricte: aucun SDK client ne peut
lire ou ecrire `quote_requests` ni `sys_audit_quotes`. Les photos sont
re-encodees par Function, stockees sous `quote-requests/v1` avec Rules fermees,
puis exposees a l'admin par URL signee courte. Le rate limit ne conserve pas
l'adresse IP brute dans le dossier client. Les limites OTP, passkeys, devis et
newsletter utilisent le meme helper `helpers/clientIp.js`: l'IP normalisee
fournie par le runtime prime sur `X-Forwarded-For`, les IPv4 mappees en IPv6 et
les formes IPv6 equivalentes convergent vers la meme cle, et un en-tete forge
ne peut donc pas multiplier les quotas lorsque le runtime fournit l'adresse.

Le jeu newsletter suit la même frontière serveur: App Check et rate limit sur
le tirage/la réclamation, identifiants de documents hashés, aucun e-mail dans
un ID, aucune lecture directe des gains. L'espace client reçoit seulement une
projection bornée lorsque l'adresse du jeton Firebase est vérifiée.

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

Le rail de creation produit isole les sources sous
`furniture/publication-sessions/{sessionId}/originals/{slotId}`. Storage Rules
verifie admin fort, registre actif et proprietaire de session. Les sources ne
sont jamais lisibles directement, les variantes sont en ecriture backend
uniquement et les anciens chemins `furniture`, `thumbnails` et `responsive`
restent explicitement separes afin qu'aucune regle recursive ne contourne ces
restrictions.

Les seules racines vitrine generiques publiques sont `gallery` et `homepage`.
Le fallback Storage final refuse lecture et ecriture: creer un nouveau dossier
ne peut donc plus le rendre public ou inscriptible implicitement.

La campagne adversariale locale couvre egalement les photos de devis avec un
jeton etranger, un contenu non image, une image au-dessus de 25 millions de
pixels et un MIME declare different du format reel. Les echecs ne laissent pas
d'objet WebP; un format reel supporte est toujours re-encode en WebP prive et
ne conserve jamais le type annonce par le navigateur.

## 5. Cloud Functions

Les helpers communs sont dans `functions/helpers/security.js`, `clientIp.js`,
`runtime.js`, `secrets.js` et `config.js`.

Controles attendus selon le type:

- callable client: Auth, App Check si compatible, validation schema, rate limit et idempotence;
- callable admin: Auth + role + registre + assurance AAL2 Google ou passkey;
- webhook Stripe: lecture du corps brut et verification de signature;
- trigger Firestore: validation defensive des donnees, idempotence et effets bornes;
- tache planifiee: limite, retention, journalisation et absence de confiance dans les donnees historiques;
- endpoint E2E: fail-closed hors configuration de test explicite.

Les endpoints de preuve commerce exigent simultanement le projet sandbox exact,
`E2E_PROOF_ENABLED=true`, leur secret constant-time et les gardes de confinement
metier. Le seul fait d'etre deploye sur le sandbox ne les active plus.

Le catalogue public ne possede plus de Function HTTP ni de codebase separe. App Hosting lit le bucket snapshot prive avec son compte de service; les clients Firestore anonymes ne peuvent pas lire `furniture`.

Les callbacks OAuth Meta/Instagram sont les seuls endpoints publics du rail
social. Chaque tentative utilise un state aleatoire dont seul le hash est
stocke, lie a l'UID et a l'origine admin, avec expiration et consommation
unique. Les echanges de code et de jeton restent serveur; les jetons Facebook
et Instagram sont chiffres AES-256-GCM avec le secret commun de chiffrement.
La deconnexion exige le super-admin, une assurance forte et une confirmation
textuelle specifique au fournisseur.

## 6. App Check

App Check reduit l'abus automatise mais ne remplace ni Auth, ni les rules, ni les signatures.

Le sandbox impose App Check sur Auth, Firestore et Storage depuis le
2026-08-11. Les debug tokens restent reserves aux tests et ne doivent jamais
entrer dans un environnement live. Pour le futur projet production:

1. re-verifier l'etat reel dans Firebase Console;
2. mesurer les requetes `VALID`, `MISSING` et `INVALID` par produit;
3. separer navigateur, SSR, webhooks, Functions publiques et E2E;
4. confirmer qu'aucun parcours client legitime ne casse;
5. activer progressivement avec un rollback ecrit.

Ne jamais committer un debug token App Check.

Tous les transports `.https.onCall` sous `functions/src`, y compris les cinq
callables Stripe Connect, imposent localement `enforceAppCheck: true`. La gate
`tests/security-hardening.test.mjs` decouvre chaque transport callable au lieu
de verifier une liste manuelle, et echoue lorsqu'un runtime direct ou partage
n'apporte pas ce controle. Les deux routes Next admin verifient aussi
`x-firebase-appcheck` avec Firebase Admin avant le token Auth.

Les webhooks Stripe/Meta et le beacon de fermeture analytics restent des
transports HTTP distincts: les webhooks utilisent leur signature fournisseur;
`sendBeacon` ne porte pas le header App Check et reste limite a une origine
exacte, un corps JSON de 64 Kio et un secret de session aleatoire dont seul le
hash est stocke.

`tests/security-output-encoding.test.cjs` verrouille les frontieres de sortie:
echappement HTML des e-mails, neutralisation de `</script>` dans tous les
JSON-LD alimentes par les donnees, conversion sure de l'editeur riche avant
`innerHTML`, rendu React des notes admin et primitives texte des PDF. Le
sandbox conserve en plus `script-src-attr 'none'`.

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

`scripts/with-env.mjs` utilise une allowlist fermee pour le pont historique
`VITE_*` vers `NEXT_PUBLIC_*`. Une nouvelle variable n'entre donc jamais dans
le bundle navigateur par simple convention de nom. IBAN, BIC, titulaire
bancaire et e-mail proprietaire sont explicitement neutralises. `.gitignore`,
`.firebaseignore` et le contexte App Hosting excluent `.env*`, comptes de
service et cles PEM. App Hosting ne recoit plus `SUPER_ADMIN_EMAIL`; seul le
bootstrap Cloud Functions y accede via Secret Manager.

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
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`;
- `Cross-Origin-Resource-Policy: same-site`;
- `Origin-Agent-Cluster: ?1` et politique cross-domain Adobe fermee;
- `script-src-attr 'none'`, upgrade HTTPS et directives worker/manifest bornees;
- `no-store` et `X-Robots-Tag` sur tunnels et API prives;
- corps JSON bornes a 4 Kio ou 512 Kio sur les routes admin catalogue.

Une nouvelle origine externe doit etre ajoutee a la directive CSP minimale correspondante. Ne pas ouvrir `connect-src`, `frame-src` ou `script-src` avec un wildcard pour corriger rapidement un blocage.

Le layout de production affiche dans la console un avertissement anti-self-XSS:
ne jamais coller du code recu par message, video ou assistant IA, et rappel du
Code penal. Ce message est dissuasif et pedagogique; il ne detecte pas
l'ouverture des DevTools et ne remplace aucune autorisation serveur.

## 9. Audit de durcissement du 2026-08-11

La passe locale, le controle read-only du cloud puis le deploiement cible
sandbox ont etabli:

- aucun vrai `.env`, compte de service, PEM ou cle privee suivi par Git;
- aucune valeur de secret local retrouvee dans le build `.next` inspecte
  (1 615 fichiers, 7 secrets locaux compares sans afficher leur valeur) ni
  dans les assets JavaScript servis par le sandbox;
- aucune source map JavaScript publique observee;
- acces anonyme refuse a `furniture`, au control plane commerce, aux buckets et
  a l'IAM projet; metadata publiques limitees aux projections attendues;
- zero vulnerabilite connue apres mise a jour/verrouillage des dependances,
  contre 27 avis initiaux sur l'ensemble production + outillage;
- cinq Functions OAuth Instagram ont ete supprimees de facon ciblee apres
  autorisation explicite. Le merge source posterieur `6be360e` a reintroduit
  leurs exports et appelants sans redeploiement; G0 les place sous
  `HOLD_META_RECONCILIATION`. Les neuf Functions Meta/Facebook/saga restent
  deployees;
- la cle Web du site heberge est desormais distincte de la cle de developpement,
  limitee aux API Firebase requises et a l'origine exacte du sandbox;
- les metriques App Check sur sept jours ont confirme des jetons valides pour
  l'application legitime avant activation. Auth, Firestore et Storage sont
  maintenant `ENFORCED` sur le projet sandbox, avec rollback `UNENFORCED`
  documente;
- les trois comptes de service historiques ne portent plus `roles/editor`.
  Les roles minimaux ont ete appliques apres inventaire des runtimes, simulation
  IAM et preparation d'une politique de rollback;
- la contrainte projet empechant les attributions automatiques futures de
  `roles/editor` n'a pas pu etre activee: le compte operateur ne possede pas
  `setOrgPolicy`. Ce verrou preventif reste une action proprietaire cloud.

Les Rules Storage, 18 Functions ciblees et App Hosting ont ensuite ete deployes
avec succes sur le sandbox. Les sondes hebergees confirment les refus attendus:
401 sans App Check sur un callable, 403 pour une origine beacon inconnue, 403
sur les preuves E2E desactivees, 401 sur la route Next admin sans identite, 415
pour un corps non JSON et 404 sur `/.env` et `/.git/config`.

Le code analytics n'envoie plus l'IP visiteur au service tiers `ip-api.com` en
HTTP et ne journalise plus e-mail/IP bruts lors de la conversion de session.
La geolocalisation affiche `Inconnu` tant qu'un fournisseur HTTPS contractualise
et conforme n'est pas choisi.

La stabilisation du 2026-08-12 retire aussi e-mail et UID des logs du trigger
d'attribution admin, ainsi que les adresses destinataires des logs des anciens
triggers e-mail commande. Les erreurs de ces transports sont journalisees sous
forme `name`/`code` bornee; les preuves privees metier conservent le
destinataire seulement lorsqu'il reste necessaire au support et a
l'idempotence.

Les audits `sys_audit_security`, `sys_audit_stripe_connect`,
`sys_audit_quotes` et `sys_audit_meta` sont backend-only et recoivent un
`expireAt` a 366 jours. Les audits de securite conservent l'UID autoritaire
pour l'imputabilite, mais dupliquent e-mail, IP et user-agent uniquement sous
forme SHA-256; les e-mails cibles des mutations admin suivent la meme regle et
Meta conserve de meme un hash d'e-mail. Les reponses Functions `internal`
restent generiques et ne renvoient jamais le message brut d'un provider. La purge manuelle
`scripts/purge-expired-firestore.cjs` reste en dry-run par defaut et aucune
purge sandbox n'a ete executee pendant cette stabilisation.

## 10. Operations destructives

Les remises a zero, purges, remboursements, retraits admin et nettoyages de donnees exigent:

- une autorisation serveur forte;
- une intention explicite et une confirmation adaptee;
- un scope visible;
- une journalisation avec acteur et horodatage;
- une operation idempotente ou reprenable;
- une preuve de sauvegarde/rollback quand la perte est irreversible.

Ne jamais lancer un script de migration, de purge ou de backfill en mode commit pour explorer son comportement.

## 11. Dettes production

| Sujet | Statut | Condition de fermeture |
| --- | --- | --- |
| rail Firebase production absent | `PRODUCTION_DEFERRED` | projet/alias/backend prod, IAM, secrets et recette crees |
| App Check production | `PRODUCTION_DEFERRED` | reproduire sur le futur projet production apres telemetrie representative |
| domaine, CSP et origines finales | `PRODUCTION_DEFERRED` | domaine achete et configure |
| sauvegardes, alertes et observabilite prod | `PRODUCTION_DEFERRED` | politique d'exploitation approuvee |
| endpoints E2E exportes | `DEBT` | garder fail-closed ou retirer dans une passe Functions dediee |
| prevention des grants Editor automatiques | `CLOUD_OWNER_ACTION` | activer `iam.automaticIamGrantsForDefaultServiceAccounts` avec `setOrgPolicy` |
| CSP avec `unsafe-inline` | `ARCHITECTURE_DEBT` | migration nonce/hash compatible avec les pages publiques statiques et les integrations tierces |

## 12. Checklist avant livraison production

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
