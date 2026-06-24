# Rapport Rail Prod - 2026-06-24

## Mission

Traiter le chantier "Rail prod toujours a definir" sans creer ni inventer de production.

Perimetre respecte:

- audit et documentation uniquement;
- aucun deploiement;
- aucune activation App Check;
- aucune modification de `TODO.md`, `RUNBOOK.md` ou `mapV2.md` pendant cette passe de coordination.

## Commandes lancees

```powershell
git status --short
firebase projects:list
firebase apphosting:backends:list --project secondevienextjsssr
npm run infra:env
node --check scripts/audit-infra-env.cjs
```

Commandes de lecture locale:

```powershell
Get-Content -Raw .firebaserc
Get-Content -Raw apphosting.yaml
Get-Content -Raw firebase.json
Get-Content -Raw .env.production.example
Get-Content -Raw .env.sandbox.example
```

## Etat observe

### Firebase CLI

Projets visibles via la CLI:

- `secondevienextjsssr` est le projet courant du clone;
- aucun projet explicitement nomme comme rail prod Seconde Vie Next n'est configure dans `.firebaserc`;
- la CLI montre un seul backend App Hosting pour `secondevienextjsssr`.

Backend App Hosting observe:

```text
Backend: secondevie-next-sandbox
URL: https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app
Region: europe-west4
Project: secondevienextjsssr
```

### Fichiers locaux

`.firebaserc`:

- alias `default` uniquement;
- `default` pointe vers `secondevienextjsssr`;
- pas d'alias `prod` ou `production`.

`firebase.json`:

- un seul backend App Hosting local;
- backend ID: `secondevie-next-sandbox`;
- aucun backend non-sandbox declare.

`apphosting.yaml`:

- variables Firebase publiques de sandbox;
- `NEXT_PUBLIC_SITE_URL` classe comme `sandbox-hosted-app`;
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` classe comme `pk_test`;
- `SUPER_ADMIN_EMAIL` reference en secret runtime.

`.env.production`:

- fichier local present, non affiche dans ce rapport;
- classification non sensible via `npm run infra:env`:
  - project id: present;
  - site URL: `legacy-hosting`;
  - auth domain: present;
  - storage bucket: present;
  - App Check reCAPTCHA site key: missing;
  - Stripe public key: missing.

## Gate ajoute

`scripts/audit-infra-env.cjs` expose maintenant un bloc `railProd` dans la sortie JSON de `npm run infra:env`.

Le gate ne publie pas de secrets. Il classe uniquement les valeurs:

- `sandbox-hosted-app`;
- `legacy-hosting`;
- `https-candidate`;
- `pk_test`;
- `pk_live`;
- `missing`;
- `present`;
- `same-as-sandbox`.

Resultat actuel:

```json
{
  "decision": "prod-absent-or-not-wired",
  "currentRail": {
    "firebaseDefaultProject": "secondevienextjsssr",
    "firebaseProdAlias": "missing",
    "appHostingBackendIds": ["secondevie-next-sandbox"],
    "appHostingSiteUrlClass": "sandbox-hosted-app",
    "appHostingStripePublicKeyClass": "pk_test"
  },
  "localProductionEnv": {
    "fileExists": true,
    "projectIdClass": "present",
    "siteUrlClass": "legacy-hosting",
    "authDomain": "present",
    "storageBucket": "present",
    "recaptchaSiteKey": "missing",
    "stripePublicKeyClass": "missing"
  }
}
```

`npm run infra:env` reste `ok: true`; le rail prod absent est un warning documente, pas une erreur sandbox.

## Decision Rail Prod

Decision: rail prod absent / non cable dans ce clone.

Raisons:

- `.firebaserc` n'a pas d'alias `prod` ou `production`;
- `firebase.json` ne declare aucun backend App Hosting non-sandbox;
- App Hosting local pointe vers le domaine sandbox;
- App Hosting local utilise une cle Stripe test;
- `.env.production` local pointe encore vers une classe d'URL legacy, pas vers un domaine App Hosting prod final;
- `.env.production` n'a pas de cle App Check reCAPTCHA prod concrete;
- `.env.production` n'a pas de cle publique Stripe live classee `pk_live`.

Conclusion: ne pas deployer en production et ne pas considerer la prod comme validee. Le clone reste valide pour sandbox/preprod.

## Prerequis exacts pour creer ou valider le rail prod

1. Creer ou selectionner le projet Firebase production final.
2. Ajouter un alias `.firebaserc` explicite, par exemple `production`, sans remplacer `default` sandbox tant que le cutover n'est pas decide.
3. Creer un backend App Hosting prod dedie, avec un backend ID distinct de `secondevie-next-sandbox`.
4. Definir le domaine HTTPS final et renseigner `NEXT_PUBLIC_SITE_URL` / `VITE_SITE_URL`.
5. Ajouter le domaine final dans Firebase Auth authorized domains.
6. Creer la Web App Firebase prod si necessaire et verifier `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
7. Creer une cle App Check Web reCAPTCHA v3 prod pour le domaine final.
8. Ne jamais enregistrer de debug token App Check sur prod hors CI controlee.
9. Definir `PUBLIC_ALLOWED_ORIGINS` et tout CORS/origin Functions vers le domaine prod.
10. Creer les secrets Stripe live separes:
    - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_*`;
    - `STRIPE_SECRET_KEY=sk_live_*`;
    - `STRIPE_WH_SECRET=whsec_*` pour l'endpoint live.
11. Creer ou separer les secrets email prod si l'envoi email est actif.
12. Verifier Storage bucket, Firestore rules/indexes, Functions codebases et App Hosting runtime env dans Firebase Console.
13. Lancer les gates prod intentionnellement et seulement apres accord:
    - `npm run build:prod`;
    - `npm run next:routes`;
    - `npm run infra:env`;
    - smoke admin/revalidation;
    - smoke checkout/webhook/email.

## Propositions d'integration pour l'agent principal

Ces changements sont proposes mais non appliques pendant cette passe:

- `TODO.md`: cocher/annoter "rail prod" comme explicitement reporte: absent/non cable, sans bloquer la sandbox.
- `RUNBOOK.md`: ajouter une section courte "Rail prod absent au 2026-06-24" qui pointe vers ce rapport.
- `mapV2.md`: remplacer le gate recommande `prod:env-check` par le bloc existant `railProd` de `npm run infra:env`, ou noter que ce gate existe maintenant partiellement.

## Validation

Validation courte executee:

```text
node --check scripts/audit-infra-env.cjs: OK
npm run infra:env: OK, warning prod-rail attendu
```

Aucun build, serveur local, Playwright, navigateur, screenshot, deploy ou test runtime prod n'a ete lance.
