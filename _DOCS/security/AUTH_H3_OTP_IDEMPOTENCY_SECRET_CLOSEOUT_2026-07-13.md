# Closeout H3 - OTP idempotent et secret HMAC dedie

Date: 2026-07-13  
Statut: `VALIDEE_SANDBOX`  
Branche: `codex/auth-production-hardening`  
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)

## 1. Decision

H3 est validee sur sandbox. La verification OTP client ne perd plus definitivement un code valide lorsqu'une panne transitoire survient apres sa verification mais avant l'emission complete de la session Firebase.

Le HMAC OTP n'utilise plus le mot de passe SMTP Gmail. Il utilise un secret cryptographique independant `OTP_HMAC_SECRET`, genere aleatoirement et stocke dans Google Secret Manager.

## 2. Defaut corrige

Avant H3, `verifyCustomerLoginOtp` effectuait cet ordre:

1. verification du code en transaction;
2. ecriture immediate de `usedAtMillis` et suppression du hash;
3. creation/recherche utilisateur;
4. creation du Custom Token.

Une panne aux etapes 3 ou 4 rendait le code inutilisable sans avoir livre de session. L'utilisateur devait demander un nouvel email.

Le mot de passe d'application Gmail servait egalement de cle HMAC. Une rotation SMTP changeait donc implicitement la cryptographie OTP et augmentait l'impact d'une compromission du secret SMTP.

## 3. Machine d'etat

Le document backend `sys_ratelimit/customer_login_otp_<emailHash>` porte maintenant une operation bornee:

```text
active
  -> issuing(user)
  -> issuing(token)
  -> token_issued

issuing expiré ou erreur transitoire
  -> failed_retryable
  -> issuing (une seule reprise)
  -> token_issued
```

Champs principaux:

- `status`;
- `responseHash`;
- `operationUid`;
- `operationStage`;
- `operationLeaseUntilMillis`;
- `operationExpiresAtMillis`;
- `retryCount`;
- `tokenIssueCount`;
- `lastOperationErrorCode` generique;
- `expireAt` pour la retention TTL.

Le code et l'adresse email brute ne sont pas ajoutes a l'etat. `responseHash` est un HMAC avec separation de domaine `customer-login-response`.

## 4. Garanties de reprise

- la premiere verification valide passe atomiquement de `active` a `issuing`;
- le hash OTP original est supprime dans cette transaction;
- une lease de 30 secondes bloque deux emissions simultanees;
- une panne de lookup/creation utilisateur produit `failed_retryable` sans UID;
- une panne de mint produit `failed_retryable` avec UID;
- la reprise exige exactement le meme `responseHash`;
- `MAX_OPERATION_RETRIES = 1`;
- l'operation expire avec le code initial, au plus dix minutes;
- le Custom Token n'est jamais ecrit dans Firestore ou dans les logs;
- apres la reprise, tout appel supplementaire est refuse;
- un code modifie est refuse sans reprendre l'operation.

La creation utilisateur reste idempotente: apres une creation suivie d'une panne, la reprise retrouve le compte par email. Le profil existant n'est jamais retrograde de son role actuel vers `client`.

## 5. Secret cryptographique

Secret Manager:

- nom logique: `OTP_HMAC_SECRET`;
- version active: `1`;
- replication: automatique;
- longueur generee: 48 octets aleatoires avant encodage;
- valeur affichee ou documentee: jamais;
- lecteur IAM: service account runtime App Engine/Functions du projet uniquement;
- humain ajoute comme lecteur de valeur pendant H3: aucun.

`functions/helpers/secrets.js` declare le secret avec `defineSecret()`.

Functions utilisant le nouveau HMAC:

- `sendCustomerLoginOtp`;
- `verifyCustomerLoginOtp`;
- `sendGuestCheckoutOtp`;
- `verifyGuestCheckoutOtp`.

Les Functions d'envoi conservent `GMAIL_PASSWORD` uniquement pour SMTP. Les Functions de verification ne montent plus le mot de passe Gmail.

## 6. Rotation

Procedure de rotation minimale:

1. creer une nouvelle version de `OTP_HMAC_SECRET` sans afficher la valeur;
2. choisir une fenetre de faible trafic;
3. invalider ou laisser expirer les codes en vol pendant dix minutes;
4. redeployer ensemble les quatre Functions OTP dans toutes les regions encore actives;
5. realiser un envoi/verification client et checkout;
6. desactiver l'ancienne version seulement apres la recette;
7. journaliser les numeros de versions, jamais les valeurs.

Le code ne maintient pas deux cles HMAC simultanees. Une rotation sans fenetre peut donc invalider un code en vol; cette contrainte est explicite et devra etre reevaluee avec le provider transactionnel H7 si une rotation sans interruption devient obligatoire.

## 7. Preuves automatisees

Commande:

```bash
npm run test:auth
```

Resultat final Node `22.23.1`:

| Indicateur | Resultat |
| --- | ---: |
| tests | 32 |
| succes | 32 |
| echecs | 0 |
| duree TAP | 177.7834 ms |

Scenarios H3 couverts:

- succes nominal puis `token_issued`;
- lookup utilisateur en panne une fois puis reprise;
- mint Custom Token en panne une fois puis reprise;
- second appel pendant la lease refuse `unavailable`;
- tentative supplementaire apres la reprise refusee;
- code modifie apres verification refuse;
- reprise limitee a une fois;
- token absent de l'etat persiste;
- HMAC dedie et absence de `GMAIL_PASSWORD` dans `hashOtp()`;
- App Check conserve.

Les erreurs imprimees pendant le test sont des fixtures locales generiques; elles ne contiennent aucune donnee ou valeur cloud.

## 8. Deploiement sandbox

Les quatre Functions OTP ont ete deployees de maniere coordonnee:

- `sendCustomerLoginOtp`;
- `verifyCustomerLoginOtp`;
- `sendGuestCheckoutOtp`;
- `verifyGuestCheckoutOtp`.

Regions transitoires mises a jour:

- `europe-west1`;
- `us-central1` jusqu'a H6.

Resultat: huit mises a jour reussies, runtime Node 22. Firebase a accorde `roles/secretmanager.secretAccessor` au service account runtime sur ce secret precis.

Aucun rollout App Hosting ni changement UI n'etait necessaire pour H3.

## 9. Recette reelle OTP

La recette sandbox a ete executee apres le deploy:

1. deconnexion de la session passkey;
2. ouverture de la modale commune depuis `/mes-commandes`;
3. choix du fallback `Recevoir un code par email`;
4. envoi reel du code;
5. reception et saisie locale des six chiffres par l'utilisateur;
6. verification serveur avec `OTP_HMAC_SECRET`;
7. connexion Firebase Custom Token AAL1;
8. fermeture de la modale;
9. chargement de l'espace client et de ses donnees;
10. ouverture de `/admin` refusee par la barriere AAL2;
11. retour a l'espace client.

Preuves live redigees sans PII:

- route `/mes-commandes?e2e_run=auth-h3-otp`;
- bouton de deconnexion present;
- titre `Vos commandes, simplement.`;
- historique, factures, adresse et profil charges;
- `/admin` affiche `Confirmez votre identite`;
- aucun OTP, token, secret, telephone, adresse ou contenu de commande copie dans cette documentation.

## 10. Gate H3

| Critere | Etat | Preuve |
| --- | --- | --- |
| secret OTP separe de SMTP | PASS | Secret Manager + contrat source |
| valeur jamais exposee | PASS | creation en memoire, metadata seules relues |
| verification atomique | PASS | transaction `active -> issuing` |
| reprise creation utilisateur | PASS | test comportemental |
| reprise mint | PASS | test comportemental |
| concurrence bornee | PASS | lease + test appel simultane |
| hash different refuse | PASS | test comportemental |
| expiration bornee | PASS | operation alignee sur `expiresAtMillis` |
| token jamais stocke | PASS | test et inspection source |
| OTP reel apres deploy | PASS | recette utilisateur |
| AAL1 ne franchit pas admin | PASS | verification live `/admin` |

## 11. Rollback

Un rollback doit etre coordonne entre envoi et verification:

1. redeployer ensemble les quatre Functions precedentes;
2. ne jamais supprimer `OTP_HMAC_SECRET` tant qu'une revision le reference;
3. ne jamais recopier la valeur dans le code ou une variable publique;
4. invalider les codes en vol lors d'un changement de cle;
5. rouvrir H3 si le mot de passe SMTP redevient la cle HMAC.

## 12. Suite autorisee

H4 peut commencer: registry admin par UID, retrait idempotent des droits et appel obligatoire a `revokeRefreshTokens(uid)` avant de considerer une revocation terminee.
