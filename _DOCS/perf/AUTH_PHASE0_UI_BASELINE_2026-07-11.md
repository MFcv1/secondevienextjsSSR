# Baseline UI authentification - phase 0

Date: 2026-07-11
Statut: preuve partielle validee, phase 0 non cloturee
Roadmap: `_DOCS/security/AUTHENTICATION_ROBUSTNESS_ROADMAP_2026-07-11.md`

## Perimetre

Cette mesure couvre uniquement le cout visible de l'ouverture de la modale de connexion sur le sandbox App Hosting:

- 30 contextes navigateur neufs pour le parcours cold;
- une seconde ouverture dans le meme contexte pour le parcours warm;
- aucun formulaire rempli;
- aucun OTP envoye;
- aucune mutation Firebase;
- Chromium headless via Playwright;
- viewport 1440 x 1000, locale `fr-FR`.

URL mesuree: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`

## Resultats

| Mesure | Volume | Minimum | p50 | p95 | Maximum | Moyenne |
|---|---:|---:|---:|---:|---:|---:|
| DOMContentLoaded home | 30 | 95 ms | 182 ms | 266 ms | 309 ms | 181 ms |
| Clic vers modale visible, cold | 30 | 660 ms | 1 181 ms | 1 215 ms | 1 245 ms | 1 046 ms |
| Clic vers modale visible, warm | 30 | 71 ms | 120 ms | 216 ms | 243 ms | 136 ms |

Taux de succes du protocole: `30/30`, soit `100 %`.

## Interpretation

La modale warm est rapide. Le cout dominant se situe au premier chargement de l'ile de connexion et de ses dependances: le p50 cold est environ 9,8 fois le p50 warm. Cette baseline sert de point de comparaison aux phases de decoupage Firebase/App Check et d'optimisation du bundle; elle ne prouve pas encore la latence d'envoi, de livraison ou de verification OTP, ni celle d'une vraie ceremonie WebAuthn.

## Reproduction

```bash
npm run perf:auth:ui
```

Script: `scripts/benchmark-auth-ui.mjs`

Le JSON brut local a ete genere dans `logs/auth-phase0-ui-baseline-2026-07-11T17-15-40-309Z.json`. Le dossier `logs/` reste ignore et le present document contient les chiffres de reference durables.

## Limites et gates restantes

- execution realisee sous Node `24.14.0`, alors que le projet exige Node `22.x`;
- aucune mesure d'OTP reel en serie afin d'eviter le spam, les quotas et les rate limits;
- aucune mesure passkey reelle, car elle exige un authentificateur et une interaction utilisateur;
- configuration Firebase Console non encore prouvee;
- domaine canonique et RP ID de production non encore fixes.

Le domaine final a ete officiellement differe le 2026-07-11. Le RP ID sandbox reste strictement provisoire et les passkeys de recette actuelles sont jetables; cette dette est une gate de livraison production documentee dans la roadmap.

Cette preuve valide uniquement le sous-volet UI de `AUTH-002`. Elle ne constitue pas un closeout de la phase 0.
