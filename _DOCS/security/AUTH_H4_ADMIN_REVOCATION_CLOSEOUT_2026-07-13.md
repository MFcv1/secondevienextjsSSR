# Closeout H4 - Revocation administrateur complete

Date: 2026-07-13  
Branche: `codex/auth-production-hardening`  
Statut: `VALIDEE_SANDBOX`

## 1. Resultat

H4 introduit une source d'autorisation administrateur serveur adressee par UID et rend la revocation convergente vers un etat refuse, meme lorsqu'une sous-etape Firebase echoue temporairement.

Le flux UI de connexion n'a pas ete modifie. Le changement concerne le moteur d'autorisation, les Rules, les Functions sensibles et le bootstrap des administrateurs existants.

## 2. Modele de donnees

Collection backend-only:

```text
sys_admin_access/{uid}
  uid
  active: true|false
  role: admin|owner
  emailHash: SHA-256(email normalise)
  activatedByUid
  activatedAt
  updatedAt
  revokedAt
  revokedByUid
  revocationState: registry_inactive|completed
  version: 1
```

Decisions:

- l'UID Firebase est la cle canonique;
- aucune adresse email brute n'est dupliquee dans le registre;
- `active:false` est irreversible par la migration de compatibilite;
- une reactivation est une nouvelle operation forte via `addAdminUser`, jamais un rollback automatique;
- le document `users/{uid}` conserve les donnees client et commandes;
- `sys_metadata/admin_users` reste temporairement la whitelist de compatibilite et de presentation.

## 3. Autorisation

### Firestore Rules

`isStrongArtisan()` exige maintenant simultanement:

1. claim `admin` ou `superAdmin`;
2. assurance AAL2 Google ou passkey avec verification locale;
3. `sys_admin_access/{request.auth.uid}.active == true`.

Le registre est inaccessible aux clients (`allow read, write: if false`). L'appel `exists()` puis `get()` vise le meme document; Firestore peut reutiliser l'acces dans une meme evaluation. Le budget logique ajoute au plus un document dependant par requete admin protegee, sous les limites Rules actuelles.

### Functions sensibles

Nouveaux helpers asynchrones:

- `getActiveAdminAccess()`;
- `checkActiveStrongAdmin()`;
- `checkActiveStrongSuperAdmin()`;
- `checkRecentActiveStrongAdmin()`;
- `checkRecentActiveStrongSuperAdmin()`.

Les callables admin, maintenance, remboursements, Stripe Connect, emails de test et suppressions analytics utilisent ces helpers. Une ancienne session possedant encore un ID token avec `admin:true` est donc refusee si le registre est inactif.

## 4. Sequence de revocation

`removeAdminUser` execute:

1. step-up proprietaire AAL2 recent;
2. protection email/whitelist/registre du role `owner`;
3. audit `admin.revoke_started`;
4. ecriture `active:false` et `revocationState:registry_inactive`;
5. retrait des claims `admin` et `superAdmin`;
6. `admin.auth().revokeRefreshTokens(uid)`;
7. profil `users/{uid}` remis a `role:user` sans suppression metier;
8. whitelist active archivee/supprimee;
9. registre marque `revocationState:completed`;
10. audit `admin.revoke_completed` avec le resultat de chaque sous-etape.

En cas d'echec, `admin.revoke_failed` conserve l'avancement. Une nouvelle execution reprend depuis un registre deja inactif et ne restaure jamais les droits.

## 5. Migration des admins existants

`ensureAdminAccessRegistry` est une Function de transition App Check, publiee dans `europe-west1` et temporairement `us-central1` jusqu'a H6.

Elle autorise uniquement un appelant qui possede deja:

- un claim admin;
- une assurance AAL2;
- un email Firebase verifie;
- une entree legacy `active` indexee par son propre UID et le meme email.

Si le document UID existe avec `active:false`, la migration refuse explicitement la reactivation. L'appel est idempotent lorsque le document est deja actif.

`AdminDashboard` appelle ce bootstrap avant ses autres callables. Le proprietaire peut aussi migrer les entrees legacy absentes lors de `syncSuperAdminClaim`.

## 6. Tests

Commande:

```text
npm run test:auth
```

Runtime: Node `22.23.1`  
Resultat final: `40/40 PASS`, `0 FAIL`, TAP `204.757 ms` lors de la gate regionale finale.

Couverture H4:

- registre inactif refuse un token AAL2 possedant encore `admin:true`;
- registre actif autorise le callable;
- activation du registre avant attribution des claims au nouvel admin;
- ordre registre inactif, claims retires, refresh tokens revoques, profil mis a jour;
- double revocation idempotente;
- panne simulee de `revokeRefreshTokens()` puis reprise sans reactivation;
- proprietaire impossible a revoquer;
- self-migration legacy autorisee uniquement si le registre est absent;
- registre inactif jamais reactive par la migration;
- contrat source Firestore Rules sur `sys_admin_access`.

## 7. Preuves cloud sandbox

- 26 Functions sensibles H4 mises a jour avec succes en `us-central1` avant migration;
- `ensureAdminAccessRegistry` publiee dans `europe-west1` et `us-central1`;
- verification callable: Auth `VALID`, App Check `VALID`, HTTP `200`;
- premier appel de migration: environ `4.4 s` avec cold start et ecritures;
- second appel idempotent: environ `51 ms`;
- comptage Firestore sans UID ni email affiche: `1` document, `1` actif, `0` inactif;
- Firestore Rules compilees et publiees avec succes;
- apres publication Rules, `/admin` recharge les agregats: `23` commandes et `5 545 EUR` de chiffre d'affaires;
- deux rollouts App Hosting realises depuis une source isolee excluant les changements concurrents de transition de route.

## 8. Limites et reports explicites

- aucune revocation destructive n'a ete lancee sur l'unique compte admin reel du sandbox;
- la preuve destructive nouvelle connexion sans claim sera rejouee en H8 avec un second admin jetable;
- Cloud Storage Rules ne peuvent pas lire Firestore: un ancien ID token peut conserver un acces Storage direct jusqu'a son expiration. Les refresh tokens sont revoques et les claims retires, mais une coupure Storage strictement immediate demanderait de faire passer toutes les ecritures admin par des callables/URL signees et de refuser les ecritures directes;
- `ensureAdminAccessRegistry` reste une Function de transition et devra etre retiree apres migration complete;
- la duplication regionale reste volontaire jusqu'a H6.

## 9. Rollback

Ne pas retirer l'exigence de registre apres une revocation. En cas d'incident de migration, corriger ou creer explicitement le document d'un administrateur encore autorise apres step-up proprietaire et audit. Ne jamais remettre automatiquement `active:true` sur une entree inactive.

## 10. Prochaine phase

H5 reste bloquee jusqu'a l'achat du domaine final. La prochaine phase executable est H6: inventaire des copies regionales, mesure du trafic, convergence vers `europe-west1`, puis suppressions explicites apres preuve de zero trafic legitime.
