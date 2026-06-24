# App Check enforcement readiness sandbox

Date: 2026-06-24
Agent: App Check Enforcement
Projet sandbox: `secondevienextjsssr`
Web app: `secondevie-next-sandbox`

## Mission

Verifier la telemetrie App Check sandbox et preparer une decision d'enforcement service par service, sans activer d'enforcement global.

Perimetre traite:

- Firestore
- Firebase Storage
- Identity Toolkit / Auth
- Cloud Functions: lecture de l'etat deploye et clarification du modele, sans modification Stripe/checkout/refund

## Changements effectues

- Ajout de `scripts/audit-app-check-service-state.mjs`.
  - Script read-only.
  - Lit l'etat App Check via Firebase App Check REST API.
  - Lit les metriques Cloud Monitoring `firebaseappcheck.googleapis.com/services/verification_count` sur 24h et 7j.
  - Reduit les debug tokens aux noms/display names/update times; le secret du token n'est jamais lu ni affiche.
- Ajout de ce rapport.

Aucune modification de `TODO.md`, `RUNBOOK.md`, Stripe, checkout, refund ou fonctions metier.

## Commandes lancees

```powershell
git status --short
rg -n "App Check|appcheck|app check|enforcement|enforce|debug token|audit-app-check" TODO.md RUNBOOK.md P0_INFRA_CLOSEOUT_ROADMAP_2026-06-24.md scripts package.json firebase.json apphosting.yaml .firebaserc
Get-Content -Path scripts\audit-app-check-paths.cjs
firebase --version
firebase appcheck --help
gcloud --version
gcloud auth list --format=json
gcloud services list --enabled --project secondevienextjsssr --format="value(config.name)"
gcloud projects describe secondevienextjsssr --format=json
firebase projects:list --json --non-interactive
firebase apps:list WEB --project secondevienextjsssr --json --non-interactive
firebase apphosting:backends:list --project secondevienextjsssr --json --non-interactive
npm run appcheck:audit
node --check scripts/audit-app-check-service-state.mjs
node scripts/audit-app-check-service-state.mjs
```

Lectures REST non destructives lancees avec `gcloud auth print-access-token` et le header `x-goog-user-project: secondevienextjsssr`:

```text
GET https://firebaseappcheck.googleapis.com/v1/projects/231220287936/services
GET https://firebaseappcheck.googleapis.com/v1/projects/231220287936/apps/1:231220287936:web:fb5eebec3b0fa2281ed025/recaptchaV3Config
GET https://firebaseappcheck.googleapis.com/v1/projects/231220287936/apps/1:231220287936:web:fb5eebec3b0fa2281ed025/debugTokens
GET https://monitoring.googleapis.com/v3/projects/secondevienextjsssr/metricDescriptors?filter=metric.type=starts_with("firebaseappcheck.googleapis.com")
GET https://monitoring.googleapis.com/v3/projects/secondevienextjsssr/timeSeries?metric.type="firebaseappcheck.googleapis.com/services/verification_count"
```

## Etat CLI et APIs

- Firebase CLI: `15.3.1`.
- `firebase appcheck --help` ne fournit pas de sous-commandes App Check dans ce CLI.
- `gcloud` stable: `552.0.0`.
- Les groupes `gcloud alpha firebase` et `gcloud beta firebase` ne sont pas installes localement.
- L'API `firebaseappcheck.googleapis.com` est active sur le projet sandbox.
- Premiere tentative REST sans `x-goog-user-project`: refusee car quota project manquant.
- Tentative REST avec `x-goog-user-project: secondevienextjsssr`: OK.

## Etat App Check prouve par API

`node scripts/audit-app-check-service-state.mjs` a confirme:

```text
firebasestorage.googleapis.com: UNENFORCED, updateTime 2026-06-14T15:25:02.804783Z
firestore.googleapis.com: UNENFORCED, updateTime 2026-06-14T15:25:09.997439Z
identitytoolkit.googleapis.com: UNENFORCED, updateTime 2026-06-14T15:25:02.507823Z
```

Config reCAPTCHA v3 web:

```text
siteSecretSet: true
tokenTtl: 86400s
minValidScore: 0.5
```

Debug tokens enregistres, secrets non affiches:

```text
Codex E2E Stripe, updateTime 2026-06-15T13:20:39.671135Z
Codex E2E refund 2026-06-19, updateTime 2026-06-19T13:50:49.002079Z
hosted-stripe-e2e-20260622-153711, updateTime 2026-06-22T13:37:18.852399Z
```

## Telemetrie App Check lue

Metrique disponible:

```text
firebaseappcheck.googleapis.com/services/verification_count
firebaseappcheck.googleapis.com/resources/verification_count
firebaseappcheck.googleapis.com/services/verdict_count (deprecated)
```

Fenetre 24h lue le 2026-06-24 vers 17:07 UTC:

```text
firestore.googleapis.com | MISSING_UNKNOWN_ORIGIN | ALLOW | UNKNOWN: 5
identitytoolkit.googleapis.com | MISSING_UNKNOWN_ORIGIN | ALLOW | UNKNOWN: 2
```

Fenetre 7j lue le 2026-06-24 vers 17:07 UTC:

```text
firestore.googleapis.com | VALID | ALLOW | 1:231220287936:web:fb5eebec3b0fa2281ed025: 1558
firestore.googleapis.com | INVALID | ALLOW | UNKNOWN: 504
firestore.googleapis.com | MISSING_UNKNOWN_ORIGIN | ALLOW | UNKNOWN: 127
firestore.googleapis.com | MISSING_OUTDATED_CLIENT | ALLOW | UNKNOWN: 3
identitytoolkit.googleapis.com | VALID | ALLOW | 1:231220287936:web:fb5eebec3b0fa2281ed025: 184
identitytoolkit.googleapis.com | INVALID | ALLOW | UNKNOWN: 44
identitytoolkit.googleapis.com | MISSING_UNKNOWN_ORIGIN | ALLOW | UNKNOWN: 51
identitytoolkit.googleapis.com | MISSING_OUTDATED_CLIENT | ALLOW | UNKNOWN: 4
```

Storage ne remonte pas de serie `verification_count` sur les fenetres 24h/7j lues. Cela signifie absence de trafic App Check observe dans ces donnees, pas preuve que Storage est enforceable.

## Decision enforcement par service

### Firestore

Decision: ne pas activer enforcement maintenant.

Raison:

- Le service est bien `UNENFORCED`.
- Il existe du trafic valide, mais aussi du trafic recent non verifie:
  - 24h: `MISSING_UNKNOWN_ORIGIN = 5`
  - 7j: `INVALID = 504`, `MISSING_UNKNOWN_ORIGIN = 127`, `MISSING_OUTDATED_CLIENT = 3`

Condition minimale avant test enforcement:

- Obtenir une fenetre 24h propre sans `INVALID` ni `MISSING_*` sur les flux critiques.
- Relancer les smoke tests publics et back-office qui couvrent les lectures/ecritures Firestore.
- Preparer rollback API/console vers `UNENFORCED` avant toute activation.

### Identity Toolkit / Auth

Decision: ne pas activer enforcement maintenant.

Raison:

- Le service est bien `UNENFORCED`.
- Il existe du trafic valide, mais aussi du trafic recent non verifie:
  - 24h: `MISSING_UNKNOWN_ORIGIN = 2`
  - 7j: `INVALID = 44`, `MISSING_UNKNOWN_ORIGIN = 51`, `MISSING_OUTDATED_CLIENT = 4`

Condition minimale avant test enforcement:

- Rejouer `npm run e2e:auth-email` et les flux login/admin avec debug token sandbox.
- Confirmer ensuite une fenetre 24h propre sur `identitytoolkit.googleapis.com`.

### Firebase Storage

Decision: ne pas activer enforcement maintenant.

Raison:

- Le service est `UNENFORCED`.
- Aucune serie recente `verification_count` n'a ete vue pour Storage dans la fenetre lue.
- Absence de donnees != validation. Il faut generer du trafic Storage representatif avant de juger.

Condition minimale avant test enforcement:

- Rejouer un smoke qui charge des images publiques et, si possible, un upload/delete admin sandbox.
- Relancer `node scripts/audit-app-check-service-state.mjs`.
- Si Storage reste sans trafic, verifier la console Firebase App Check pour confirmer si la tuile Storage expose des requetes.

### Cloud Functions

Decision: pas d'enforcement Functions active dans cette passe.

Raison:

- `projects/231220287936/services` ne liste pas `cloudfunctions.googleapis.com` comme service App Check global.
- Le repo utilise de nombreuses Functions v1 `https.onCall` et `https.onRequest`.
- Les endpoints `onRequest` publics, SEO, webhook Stripe et helpers E2E ne doivent pas recevoir une exigence App Check globale sans tri par endpoint.
- Les callables peuvent etre proteges par App Check de facon explicite dans le code ou par verification de contexte selon le runtime, mais cela exige une passe dediee par famille de fonctions.

Decision pratique:

- Ne pas traiter Functions comme un interrupteur global.
- Faire une roadmap dediee si le projet veut App Check sur callables:
  - callables client publiques: checkout/auth/analytics;
  - callables admin;
  - endpoints `onRequest` publics a exclure ou proteger autrement;
  - webhook Stripe a exclure d'App Check.

## Commande de reprise

Pour refaire l'etat App Check sans modifier la prod ni la sandbox:

```powershell
node scripts/audit-app-check-service-state.mjs
```

Optionnel:

```powershell
node scripts/audit-app-check-service-state.mjs --project=secondevienextjsssr --web-app-id=1:231220287936:web:fb5eebec3b0fa2281ed025
```

## Blocages restants

- Firestore et Identity Toolkit ont encore du trafic non verifie sur les metriques lues.
- Storage manque de trafic mesure dans Cloud Monitoring; il faut un smoke Storage avant decision.
- Functions n'a pas de bouton global equivalent dans l'API lue; il faut une strategie par endpoint/callable.
- Console Firebase peut encore apporter une vue UX plus lisible par service; ce rapport prouve ce qui est accessible par API/CLI, pas une capture console.

## Conclusion

Statut P0 App Check au 2026-06-24: chemins client audites OK, configuration sandbox lue OK, telemetrie lue OK, mais enforcement non autorise maintenant.

Decision: garder Firestore, Storage et Identity Toolkit en `UNENFORCED` tant que les metriques ne sont pas propres et tant que Storage/Functions n'ont pas une preuve dediee. Tester ensuite un seul service a la fois, avec rollback pret.
