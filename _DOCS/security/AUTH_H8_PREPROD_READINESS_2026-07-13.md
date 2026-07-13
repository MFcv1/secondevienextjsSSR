# H8 - Readiness preproduction de presentation

Date: 2026-07-13  
Statut: `PREPROD_READY`  
Roadmap: [`AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_ROADMAP_2026-07-12.md)  
Fil d'Ariane: [`AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md`](./AUTH_PRODUCTION_HARDENING_PROGRESS_2026-07-12.md)
Closeout: [`AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md`](./AUTH_H8_PREPROD_CLOSEOUT_2026-07-13.md)

## 1. Cible

> L'idee est d'arriver a un etat pre-prod de presentation du site et que toutes les plus grosses fonctionnalites soient deja codees.

Cette readiness couvre la presentation sur la sandbox `hosted.app`. Elle ne remplace pas la validation production liee au domaine final, au RP ID, aux DNS Resend et a la recette cliente.

## 2. Resultat global

Le code, les preuves locales et le changeset Functions H7/H8 sont deployes sur la sandbox. La recette post-deploiement OTP/passkey et la premiere lecture des logs structures sont concluantes. Le statut `PREPROD_READY` est attribue dans le closeout lie.

| Gate | Resultat | Conclusion |
| --- | --- | --- |
| Auth Node 22 | `53/53 PASS`, `0 FAIL` | conforme |
| Adaptateur email/logs | `9/9 PASS` | conforme |
| Chrome/Edge/Brave | `3/3 PASS` | conforme pour le smoke UI headless |
| Session connectee navigateur integre | header deconnexion + menu `Mon espace` + `/mes-commandes` | conforme |
| Route `/devis` directe | rendu direct sans detour galerie | conforme |
| Benchmark UI | `30/30 PASS` | conforme |
| Warm modal p95 | `206 ms`, objectif `<= 300 ms` | SLO atteint |
| Metriques serveur OTP/passkey | instrumentation deployee, parcours post-deploiement requis | premiere mesure encore requise |
| Provider reel | Gmail confirme sur la Function OTP europeenne | conforme pour la demonstration |
| Resend reel | non active, expediteur vide | volontairement differe au domaine final |

## 3. Matrice navigateurs

Script reproductible: `scripts/audit-auth-preprod-browsers.mjs`.

| Navigateur installe | Modale visible | Fallback e-mail | Route devis | Erreur page | Resultat |
| --- | ---: | --- | --- | --- | --- |
| Chrome | `686 ms` | visible | directe | aucune | PASS |
| Edge | `757 ms` | visible | directe | aucune | PASS |
| Brave | `649 ms` | visible | directe | aucune | PASS |

Brave a emis sur un passage intermediaire un avertissement `requestStorageAccess: Permission denied`, sans erreur page ni blocage du parcours. Le passage final est vert. Le smoke ne soumet aucun formulaire, n'envoie aucun OTP et ne modifie aucune donnee Firebase.

La verification Windows Hello ne peut pas etre automatisee en headless. Les preuves physiques H1 et H6 restent la reference pour l'activation et la reconnexion passkey avec UV obligatoire.

## 4. Session et coherence UI

Le navigateur integre disposait d'une session reelle existante. Les signaux suivants ont ete observes ensemble:

- bouton de deconnexion dans le header;
- page `/mes-commandes` chargee avec le compte et les commandes;
- bouton `Quitter` dans la navigation espace client;
- entree `Mon espace` dans le mega menu avec le meme compte;
- aucune erreur console pendant ce smoke.

Cette preuve couvre la regression historique ou le header indiquait une session tandis que le mega menu affichait `Se connecter`.

## 5. Performance UI

Benchmark Node `22.23.1`, Chromium headless, 30 contextes neufs:

| Mesure | p50 | p95 | Maximum | Evolution utile |
| --- | ---: | ---: | ---: | --- |
| DOMContentLoaded home | `212 ms` | `362 ms` | `3 157 ms` | un outlier cold a surveiller |
| Modale cold | `1 056 ms` | `1 106 ms` | `1 244 ms` | p95 ameliore face a `1 215 ms` |
| Modale warm | `152 ms` | `206 ms` | `230 ms` | objectif `<= 300 ms` atteint |

Le cold reste domine par le premier chargement Firebase/App Check. Il n'est pas masque par un seuil artificiel. La presentation warm, cas courant apres la premiere ouverture, respecte le SLO avec marge.

## 6. Observabilite serveur

Les anciens logs `function_perf` existent pour OTP et passkey, mais `console.info` serialise l'objet sur plusieurs lignes dans Functions Gen1. Les p50/p95 fiables ne peuvent donc pas etre reconstruits automatiquement avec le format deploye.

Le changeset remplace ce format par `firebase-functions/logger`:

- evenement structure `function_perf`;
- champs bornes: fonction, region, duree, phase et correlation non sensible;
- aucune valeur OTP;
- requetes et metriques Cloud Logging possibles apres deploiement.

Cette dette n'est pas fermee par supposition. Il faut deployer, produire quelques parcours legitimes, puis mesurer les SLO serveur.

## 7. Derniere gate avant PREPROD_READY

1. [x] Deployer les Functions Auth/email modifiees sur la sandbox.
2. [x] Verifier que `TRANSACTIONAL_EMAIL_PROVIDER` reste `gmail`.
3. [x] Verifier le montage de `RESEND_API_KEY` sans activer Resend.
4. [x] Executer un OTP Gmail reel et une reconnexion passkey avec validation locale utilisateur.
5. [x] Confirmer `Quitter` et `Mon espace` apres les deux reconnexions.
6. [x] Lire les nouveaux logs structures et enregistrer les premiers temps serveur.
7. [x] Ne pas relancer le smoke bundle: aucun deploiement App Hosting ni changement client apres la gate `3/3`; la gate Node 22 `53/53` reste la preuve code de reference.
8. [x] Creer le closeout global `PREPROD_READY`.

## 8. Travail production differe

- achat et choix du domaine;
- AuthDomain et RP ID final;
- reenrolement des passkeys sandbox;
- domaine expediteur Resend;
- SPF, DKIM, DMARC et return-path;
- tests de delivrabilite Gmail/Outlook/iCloud;
- webhooks signes et gestion des bounces;
- retrait Gmail;
- suppression definitive des copies regionales apres soak;
- Safari/Face ID sur le domaine final;
- recette cliente et statut `VALIDEE_PRODUCTION`.
