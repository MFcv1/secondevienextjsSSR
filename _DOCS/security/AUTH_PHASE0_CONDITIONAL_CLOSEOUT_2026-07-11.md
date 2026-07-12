# Closeout conditionnel Auth - phase 0 sandbox

Date: 2026-07-11
Statut: `VALIDE CONDITIONNELLEMENT POUR LE SANDBOX`
Roadmap: `_DOCS/security/AUTHENTICATION_ROBUSTNESS_ROADMAP_2026-07-11.md`

## Portee de la validation

La phase 0 est suffisamment etablie pour commencer les changements d'architecture client qui ne dependent pas du domaine final. Ce closeout ne constitue pas une autorisation de mise en production.

Les controles ont ete effectues manuellement, sans Codex Security, avec Firebase Console, Firebase CLI, Google Cloud CLI, audit statique du depot et Playwright en lecture seule.

## Environnement valide

- projet Firebase et Google Cloud: `secondevienextjsssr`;
- environnement produit courant: sandbox App Hosting;
- Node local: `22.23.1`;
- npm: `10.9.8`;
- Firebase CLI: `15.23.0`;
- Google Cloud SDK: `575.0.1`;
- runtime Functions observe: `nodejs22`;
- base Firestore `(default)`: mode natif, edition Standard, region multi-region `eur3`;
- application Web Firebase: `secondevie-next-sandbox`, active;
- application Web App Check: enregistree.

Aucun token, mot de passe, code OTP ou credential cloud n'est copie dans ce document.

## Firebase Authentication

Configuration observee dans la Console:

- fournisseur Email/Mot de passe: actif;
- fournisseur Google: actif;
- fournisseur Telephone: actif, sans usage confirme dans le produit actuel;
- association automatique des comptes partageant la meme adresse email: active;
- Identity Platform: non active;
- MFA SMS: indisponible tant qu'Identity Platform n'est pas active;
- quota SMS affiche pour le projet: 1 000 envois par jour;
- domaines autorises: `localhost`, domaines Firebase par defaut et hostname sandbox App Hosting exact.

Decision:

- conserver Email/Mot de passe tant que la connexion admin l'utilise;
- conserver Google;
- auditer puis desactiver Telephone si aucun parcours vivant ne le requiert;
- ne pas activer Identity Platform/MFA sans decision produit et plan de cout/recuperation admin.

## App Check

Etat Console observe:

- application Web sandbox: enregistree;
- Storage: `Non applique`;
- Cloud Firestore: `Surveillance`;
- Authentication Preview: `Non applique`;
- Functions: enforcement gere par chaque callable dans le code.

Etat du code Auth:

- OTP client et checkout: `enforceAppCheck: true`;
- quatre callables passkey: aucun enforcement App Check observe;
- le token debug reste reserve aux tests locaux/E2E.

L'enforcement global Firestore/Storage ne doit pas etre active brutalement. Il necessite une phase de mesure, une verification de tous les clients et un rollout surveille. L'enforcement des callables passkey appartient a la phase 3.

## Regions et deploiements

Les Functions Auth existent simultanement en `europe-west1` et `us-central1`, notamment les quatre fonctions passkey et les fonctions OTP. Le client cible `europe-west1`, mais les copies historiques `us-central1` restent deployees.

Risques:

- double surface publique;
- configuration App Check et correctifs potentiellement divergents;
- confusion dans les logs et alertes;
- cout et exploitation inutiles;
- appels accidentels vers une ancienne version.

La suppression des copies historiques est reportee a la phase de convergence regionale. Elle devra preceder une verification d'absence de trafic et utiliser une liste explicite de fonctions; aucune suppression en masse n'est autorisee.

## TTL et donnees temporaires

`gcloud firestore fields ttls list` ne retourne aucune politique TTL.

Les challenges passkey possedent une expiration logique de cinq minutes dans le code, mais aucun nettoyage TTL serveur n'est configure. La mise en place du champ Firestore TTL aligne et du nettoyage explicite appartient a la phase 3.

## Baseline UI

Reference: `_DOCS/perf/AUTH_PHASE0_UI_BASELINE_2026-07-11.md`.

- 30/30 ouvertures reussies;
- cold: p50 `1 181 ms`, p95 `1 215 ms`, maximum `1 245 ms`;
- warm: p50 `120 ms`, p95 `216 ms`, maximum `243 ms`.

Les anciennes preuves OTP comprennent au moins une execution reelle reussie. Une serie de 30 OTP reels n'a pas ete declenchee, car elle provoquerait spam, quotas et rate limiting. Les mesures detaillees OTP/passkey seront instrumentees avant une campagne controlee.

## Exceptions ouvertes

| Exception | Effet | Phase de resolution |
|---|---|---|
| Domaine final non achete | RP ID production impossible a figer | Gate preproduction AUTH-000 |
| Passkeys sandbox jetables | Reinscription necessaire sur le futur domaine | Gate preproduction AUTH-000 |
| Origine `.hosted.app` toleree par famille dans le code | Politique trop large pour production | Phase 3 / gate domaine |
| App Check absent des callables passkey | Surface d'abus | Phase 3 |
| Functions Auth dupliquees entre deux regions | Surface et exploitation incoherentes | Phase 5 |
| Aucune politique TTL | Documents temporaires orphelins | Phase 3 |
| Baseline OTP/passkey complete non capturee | SLO encore incomplet | Phases 4, 7 et 8 |

## Decision de gate

La phase 0 est validee conditionnellement pour poursuivre les phases 1 et 2 sur sandbox. La production reste interdite tant que les exceptions preproduction ne sont pas fermees et qu'un closeout final domaine/RP ID n'est pas ajoute.

Prochaine phase autorisee: phase 1, source d'etat Auth unique.
