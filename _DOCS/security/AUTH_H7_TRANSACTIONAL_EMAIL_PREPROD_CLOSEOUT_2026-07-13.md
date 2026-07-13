# Closeout H7-PREPROD - email transactionnel Gmail/Resend

Date: 2026-07-13  
Statut: `PREPROD_CODE_READY`  
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)

## 1. Objectif de livraison

> L'idee est d'arriver a un etat pre-prod de presentation du site et que toutes les plus grosses fonctionnalites soient deja codees.

H7 est donc ferme ici uniquement pour son perimetre de preproduction: le moteur Resend est code, configurable, teste sans reseau et raccorde a tous les flux. Gmail reste volontairement actif pour la presentation. La validation du domaine, les DNS et les envois Resend reels appartiennent au closeout de production.

## 2. Etat obtenu

| Element | Etat preprod | Etat production restant |
| --- | --- | --- |
| Compte Resend | cree | revue DPA/RGPD finale |
| Cle API | `Sending access`, secret `RESEND_API_KEY` v1 | rotation et procedure d'incident |
| Provider actif | Gmail par defaut | Resend apres canary valide |
| Selection | `TRANSACTIONAL_EMAIL_PROVIDER` | valeur `resend` au deploiement controle |
| Expediteur Resend | parametre `RESEND_FROM_EMAIL` prevu mais vide | adresse du domaine verifie |
| Flux raccordes | OTP Auth, OTP checkout, commande, remboursement, expedition, livraison, diagnostic | recette de delivrabilite reelle |
| DNS | non applicable au sandbox actuel | SPF, DKIM, DMARC et return-path |
| Passkeys/domaine | sandbox demonstrable | RP ID final et reenrolement H5 |

Resend ne fonctionne donc pas encore en envoi reel. Ce qui fonctionne deja est le contrat logiciel complet, le coffre cloud et la possibilite de basculer sans reecrire les parcours metier. Les e-mails de presentation continuent de partir par Gmail.

### Decision pour la demonstration cliente

- Gmail reste le transport reel des OTP et des e-mails transactionnels pendant toute la preproduction de presentation.
- Le parcours visible ne change pas: la future bascule vers Resend est une modification du moteur d'envoi, pas de l'UI Auth.
- L'URL sandbox `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app` ne peut pas etre utilisee comme domaine expediteur Resend: `hosted.app` appartient a Google et nous ne controlons pas sa zone DNS pour y publier SPF, DKIM et DMARC.
- `onboarding@resend.dev` permet eventuellement un test canari de l'API vers l'adresse associee au compte Resend uniquement. Ce test ne permet pas d'envoyer des OTP a des clientes et ne remplace pas la recette de delivrabilite du domaine final.
- Aucun passage global a `TRANSACTIONAL_EMAIL_PROVIDER=resend` n'est autorise avant la verification d'un domaine expediteur controle par le projet.
- Gmail sera conserve comme rollback pendant la bascule et retire uniquement apres une periode d'observation Resend concluante.

## 3. Architecture implementee

- `functions/src/email/transactionalEmail.js`: contrats Gmail et Resend, timeout, retry borne et idempotence obligatoire pour Resend;
- `functions/src/email/transactionalEmailRuntime.js`: selection centralisee, adresse expediteur, secrets montes et generation de cles d'idempotence hashees;
- `functions/helpers/secrets.js`: `RESEND_API_KEY`, `TRANSACTIONAL_EMAIL_PROVIDER` et `RESEND_FROM_EMAIL`;
- `functions/src/auth/customerLoginOtp.js`: OTP de connexion via le runtime commun;
- `functions/src/auth/guestCheckoutOtp.js`: OTP checkout via le runtime commun;
- `functions/src/email/orderEmails.js`: confirmations, remboursements, expedition, livraison et diagnostic via le runtime commun.

Le provider par defaut est `gmail`. Le runtime ne fait aucun fallback silencieux: si `resend` est selectionne sans cle ou sans `RESEND_FROM_EMAIL`, l'operation echoue avec `EMAIL_PROVIDER_CONFIG`.

## 4. Idempotence et fiabilite

- deux tentatives Resend maximum;
- retry seulement sur timeout, reseau, HTTP `408`, `429` et erreurs `5xx` transitoires;
- meme en-tete `Idempotency-Key` pendant le retry;
- cles derivees par SHA-256, sans e-mail, UID, ID commande ou reference Stripe en clair;
- operations distinctes pour admin, client, remboursement, expedition, livraison et diagnostic;
- aucune valeur OTP ecrite par le nouvel adaptateur dans les logs.

## 5. Preuves du 2026-07-13

- controles de syntaxe: `transactionalEmailRuntime.js`, `orderEmails.js`, `customerLoginOtp.js`, `guestCheckoutOtp.js` valides;
- tests adaptateur/runtime et logs: `9/9 PASS`;
- gate Auth complete sous Node `22.23.1`: `53/53 PASS`, `0 FAIL`, TAP `236.1126 ms`;
- `git diff --check`: a relancer apres documentation finale;
- aucun envoi Resend reel;
- aucun secret affiche ou stocke dans le depot.

Les controles de syntaxe complementaires ont utilise Node `24.14.0`, puis la gate canonique a ete relancee avec le Node `22.23.1` impose par le projet. Les deux environnements sont verts; la preuve de reference est celle de Node 22.

## 6. Runbook de bascule apres validation cliente

Ne pas executer ces actions avant acquisition et choix du domaine final.

1. Ajouter le domaine expediteur dans Resend.
2. Publier exactement les enregistrements SPF et DKIM fournis par Resend.
3. Publier DMARC en observation `p=none` avec une boite de rapports exploitee.
4. Attendre le statut de domaine verifie chez Resend et verifier l'alignement.
5. Definir `RESEND_FROM_EMAIL` avec une adresse du domaine verifie, sans nom d'affichage imbrique.
6. Conserver `TRANSACTIONAL_EMAIL_PROVIDER=gmail` pendant un premier deploiement de verification.
7. Executer un diagnostic admin Gmail et verifier l'absence de regression.
8. Passer `TRANSACTIONAL_EMAIL_PROVIDER=resend` sur une fenetre controlee.
9. Envoyer un diagnostic canary vers des boites Gmail, Outlook et iCloud si disponible.
10. Tester OTP Auth, OTP checkout, commande et remboursement sans exposer les codes ni secrets.
11. Mesurer latence API, delai de livraison, bounces, plaintes et quotas.
12. Revenir immediatement a `gmail` si le canary echoue; ne retirer les secrets Gmail qu'apres la periode d'observation acceptee.

Un canari technique anticipe avec `onboarding@resend.dev` reste facultatif. S'il est execute avant l'achat du domaine, son perimetre est strictement limite a la validation de la cle, de l'appel API, de la reponse et des journaux vers l'adresse du compte Resend. Il ne modifie pas le provider actif et ne ferme aucune gate DNS ou delivrabilite.

## 7. Dette explicitement differee

- domaine final et adresse expediteur;
- SPF, DKIM, DMARC et return-path;
- webhooks signes de livraison, bounce et plainte;
- traitement des hard bounces;
- tests reels Gmail, Outlook et iCloud via Resend;
- mesures p50/p95 et taux de delivrabilite;
- retrait du mot de passe d'application Gmail;
- revue DPA/RGPD et conditions provider;
- closeout `VALIDEE_PRODUCTION` H7.

## 8. Prochaine phase

Poursuivre H8-PREPROD sans attendre le domaine:

1. documenter le smoke Chrome, Edge et Brave;
2. mesurer ou accepter explicitement la dette SLO sandbox;
3. finaliser les runbooks de presentation et rollback;
4. produire le closeout global `PREPROD_READY`.
