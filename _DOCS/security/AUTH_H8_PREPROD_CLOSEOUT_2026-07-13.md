# Closeout H8 - Auth PREPROD_READY

Date: 2026-07-13  
Statut: `PREPROD_READY`  
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)  
Readiness precedente: [`AUTH_H8_PREPROD_READINESS_2026-07-13.md`](./AUTH_H8_PREPROD_READINESS_2026-07-13.md)

## 1. Conclusion

> L'idee est d'arriver a un etat pre-prod de presentation du site et que toutes les plus grosses fonctionnalites soient deja codees.

Cette cible est atteinte pour le systeme d'authentification sur la sandbox. Les parcours OTP Gmail, Google, passkey avec verification locale, fallback email, espace client et step-up administrateur sont implementes. Les regressions historiques de synchronisation entre le header et le mega menu ne sont pas reproduites.

Le statut ne signifie pas `VALIDEE_PRODUCTION`. Le domaine final, le RP ID final, la delivrabilite Resend, le retrait Gmail, la fin du soak regional et certaines recettes multi-plateformes restent volontairement differes.

## 2. Deploiement H8

- projet: `secondevienextjsssr`;
- runtime cloud: Node.js 22;
- provider email actif confirme apres deploiement: `gmail`;
- `RESEND_FROM_EMAIL`: vide;
- `RESEND_API_KEY`: montee depuis Secret Manager, valeur jamais lue ni affichee;
- Functions mises a jour en `europe-west1`: 12;
- copies callables mises au meme niveau et conservees en `us-central1`: 10;
- triggers email `onOrderCreated` et `onOrderUpdated`: `europe-west1` uniquement;
- Function supprimee: aucune;
- App Hosting redeploye pendant cette gate: non;
- activation Resend: aucune.

Le rollout additif des callables a ete necessaire pour que Firebase ne supprime pas les copies US conservees comme rollback pendant H6. Apres deploiement, la source locale a ete remise sur `FUNCTION_REGIONS=[europe-west1]`.

## 3. Recette OTP Gmail post-deploiement

- compte de recette: adresse de test connue, non reproduite dans ce closeout;
- e-mail envoye par le provider actif Gmail;
- code saisi localement par l'utilisateur, jamais transmis dans le chat ni les logs;
- verification OTP: succes;
- session Firebase: active;
- header: `Quitter` present;
- mega menu: `Mon espace` et compte coherent presents;
- desynchronisation header/menu: aucune.

Logs structures europeens observes:

| Function | Phase | Temps ponctuel |
| --- | --- | ---: |
| `sendCustomerLoginOtp` | `success` | `5 662 ms` |
| `verifyCustomerLoginOtp` | `success` | `4 705 ms` |

## 4. Recette passkey post-deploiement

- deconnexion apres la recette OTP;
- entree `Connexion rapide sur cet appareil` disponible;
- Windows Hello declenche;
- PIN saisi localement par l'utilisateur et jamais partage;
- verification WebAuthn avec UV obligatoire: succes;
- session Firebase: active;
- header: `Quitter` present;
- mega menu: `Mon espace` et compte coherent presents;
- fallback OTP conserve;
- boucle ou popup residuelle: aucune observee.

Logs structures europeens observes:

| Function | Phase | Temps ponctuel |
| --- | --- | ---: |
| `generatePasskeyAuthenticationOptions` | `success` | `453 ms` |
| `verifyPasskeyAuthentication` | `success` | `4 544 ms` |

## 5. Gates automatisees conservees

- gate Auth canonique Node `22.23.1`: `53/53 PASS`, `0 FAIL`;
- adaptateur email et logs: `9/9 PASS`;
- smoke Chrome, Edge et Brave: `3/3 PASS`;
- benchmark UI: `30/30 PASS`;
- modale warm p95: `206 ms`, objectif `<= 300 ms` atteint;
- aucune relance du bundle apres le deploiement Functions, car aucun code client ni App Hosting n'a change apres ces preuves.

## 6. Lecture performance

Les quatre latences serveur sont des echantillons ponctuels de sandbox et non des p50/p95 statistiquement representatifs. Les validations OTP et passkey autour de 4,5 a 4,7 secondes incluent potentiellement le demarrage a froid de Functions Gen1 et les appels Firebase Admin/Firestore.

Pour la presentation cliente, la dette SLO serveur est acceptee explicitement parce que:

- les parcours aboutissent sans erreur;
- la coherence de session est correcte;
- la modale warm respecte son budget;
- les logs sont maintenant structures et permettront une mesure statistique apres davantage de trafic.

Cette acceptation ne vaut pas SLO production. Il faudra collecter un volume suffisant pour p50/p95, distinguer cold/warm et optimiser les phases dominantes avant engagement contractuel.

## 7. Etat email pour la demonstration

- Gmail reste le transport reel des OTP et e-mails transactionnels;
- Resend est code, teste par contrat, coffre et desactive;
- aucun basculement accidentel n'est possible sans `TRANSACTIONAL_EMAIL_PROVIDER=resend` et un `RESEND_FROM_EMAIL` valide;
- `hosted.app` ne peut pas servir de domaine expediteur, car sa zone DNS appartient a Google;
- un canari `onboarding@resend.dev` reste facultatif et limite a l'adresse du compte Resend;
- l'UI Auth ne changera pas lors de la future bascule provider.

## 8. Travail production explicitement differe

1. Acheter et fixer le domaine final.
2. Configurer l'AuthDomain et le RP ID final.
3. Reenroler les passkeys creees sur la sandbox si necessaire.
4. Ajouter un domaine ou sous-domaine expediteur dans Resend.
5. Publier SPF, DKIM et DMARC puis realiser la recette de delivrabilite.
6. Basculer progressivement vers Resend en conservant Gmail comme rollback.
7. Terminer le soak H6 et supprimer les copies US uniquement apres zero trafic legitime prouve.
8. Mesurer les SLO serveur sur un echantillon representatif.
9. Prouver Safari/Face ID sur le domaine final et le MFA du compte Google proprietaire.
10. Executer la recette cliente et produire le closeout `VALIDEE_PRODUCTION`.

## 9. Reprise du chantier

Tant que le domaine final n'est pas disponible, aucune action Auth bloquante n'est requise pour la demonstration. Le prochain travail autonome utile est le suivi du soak H6 et la collecte passive des logs structures. La reprise de H5/H7 production doit commencer des que le domaine est choisi.
