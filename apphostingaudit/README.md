# Centre de suivi Firebase, App Hosting et migration Gen2

Derniere mise a jour: 2026-08-15

Statut: `CENTRE_DE_SUIVI_ACTIF - G0_TERMINEE - G1_NON_AUTORISEE`

Proprietaire: mainteneur Seconde Vie et agent d'execution des phases validees

Condition de cloture: toutes les gates autorisees sont fermees, les preuves et
rollbacks sont consignes, les decisions durables sont fusionnees dans `_DOCS`,
puis ce centre temporaire est retire selon la gouvernance documentaire.

## 1. Contenu centralise

Ce dossier est l'unique point d'entree du chantier:

| Document | Role |
| --- | --- |
| [AUDIT_ARCHITECTURE_APP_HOSTING.md](AUDIT_ARCHITECTURE_APP_HOSTING.md) | photographie read-only de l'architecture Firestore, App Hosting, donnees, fiabilite et risques |
| [AUDIT_MIGRATION_FUNCTIONS_GEN2.md](AUDIT_MIGRATION_FUNCTIONS_GEN2.md) | contre-audit des 152 Functions cloud et 157 exports locaux, prerequis fiabilite, architecture cible, phases G0-G13, gates, rollbacks et prompt d'execution |
| `README.md` | tableau de bord vivant, journal des executions et point de reprise obligatoire |

Le dossier racine `Gen2/` a ete remplace par cette centralisation. Aucun contenu
de l'audit Gen2 n'a ete supprime.

## 2. Sources de verite

En cas de contradiction:

1. demande actuelle explicite de l'utilisateur;
2. code et configuration executables;
3. `AGENTS.md`;
4. `map.md`;
5. chapitres canoniques `_DOCS`;
6. audit Gen2;
7. audit d'architecture historique;
8. ce tableau de suivi, qui ne doit contenir que l'etat prouve.

## 3. Baseline avant execution

| Controle | Etat prouve |
| --- | --- |
| Functions cloud | 152 actives: 139 Gen1 et 13 Gen2 |
| exports locaux | 157, dont 5 Instagram locaux sous `HOLD_META_RECONCILIATION` |
| cible maximale cloud actuel | 149 Gen2 et 3 exceptions Auth Gen1, avant retraits prouves |
| cible maximale si les 5 Instagram sont conserves | 154 Gen2 et 3 Auth Gen1, avant retraits prouves |
| configuration Gen2 actuelle | CPU 1 et max 20 sur 13/13; concurrence 80 sur 12, worker image 4; options source encore implicites |
| garde de deploiement | wrapper fail-closed actif; projet/codebase/commit/manifeste/digest/allowlist obligatoires, dix cibles maximum et une seule cible finance/webhook/scheduler |
| projet operateur | Firebase cible correcte; `gcloud` global observe sur `vibefx-v2`, donc projet explicite obligatoire |
| dispatcher reservations | actif toutes les deux minutes; runs recents no-op, preuve d'expiration/idempotence manquante |
| incident commerce | 1 `terminal_refund_conflict` ouvert mais sante affichee `healthy` |
| recuperation Firestore | PITR et protection desactives; aucune sauvegarde ni schedule |
| restauration | doit creer une base nommee du meme projet et de la meme localisation; aucun failover de `(default)` |
| Storage | soft delete 7 jours sur buckets media/catalogue, versioning absent, restauration non testee |
| observabilite | 0 policy, 0 metrique logs personnalisee, 0 dashboard personnalise; canaux non verifies |
| budget/quota | budget Billing non verifie; aucune alerte quota confirmee |
| produits legacy | 10 meubles sans `inventoryVersion` |
| commandes legacy | 26 sur 125 |
| runtime | Node 22 deprecie le 2027-04-30 et retire le 2027-10-31; succession a planifier |
| production | rail Firebase/App Hosting/Stripe live absent et hors de ce chantier sandbox |
| tests historiques | 127 commerce + 14 catalogue + 5 retention = 146 verts, non rejoues pendant l'inventaire |
| mutations de l'audit | aucun deploiement, paiement, build, charge ou ecriture Firestore |

## 4. Regles de mise a jour du suivi

L'agent charge d'une phase doit:

1. lire ce fichier puis les deux audits complets;
2. regenerer les compteurs avant toute action cloud;
3. modifier le statut uniquement avec une preuve reproductible;
4. renseigner tests, cible, revision, logs, donnees touchees et rollback;
5. ne garder qu'une phase `EN_COURS` a la fois;
6. marquer `BLOQUEE` avec la condition exacte, jamais avec une hypothese vague;
7. ne marquer `TERMINEE` que lorsque toutes les gates de la phase sont fermees;
8. mettre a jour les chapitres canoniques dans le meme changement si
   l'architecture executable evolue.

Valeurs autorisees:

- `A_FAIRE`;
- `EN_COURS`;
- `BLOQUEE`;
- `TERMINEE`;
- `NON_APPLICABLE_PREUVE`.

## 5. Tableau de progression G0-G13

| Phase | Objet | Statut | Gate de sortie essentielle | Preuve/compte rendu |
| --- | --- | --- | --- | --- |
| G0 | baseline 152/157, manifeste, hold Meta et wrapper de deploiement | `TERMINEE` | projet explicite, zero ecart, deploy global fail-closed, cinq Instagram en hold | manifestes `apphostingaudit/manifests/functions-*-g0.json`, journal section 8 |
| G1 | alertes, DR/restore, sante/incident et preuve des workers | `A_FAIRE` | quatre P0 fermes; Stripe test borne uniquement | a renseigner |
| G2 | socle Gen2 puis stabilisation ciblee des 13 Gen2 actuelles | `A_FAIRE` | G2-A local vert; G2-B deploye/observe une cible a la fois apres autorisation | a renseigner |
| G3 | decisions retrait/migration legacy, E2E, maintenance, publication historique | `A_FAIRE` | decision et observation reversibles; aucune suppression prematuree | a renseigner |
| G4 | analytics | `A_FAIRE` | parite, App Check, caches concurrents, 48 h observees | a renseigner |
| G5 | Auth callables, OTP et passkeys | `A_FAIRE` | Auth complete, parcours sandbox et rollback client | a renseigner |
| G6 | catalogue admin, devis, newsletter, e-mail et factures | `A_FAIRE` | writers/readers et trigger devis sans double effet | a renseigner |
| G7 | Meta et reconciliation Instagram | `A_FAIRE` | hold leve par preuves, OAuth/secrets/rollback valides | a renseigner |
| G8 | commerce non financier, lectures et hygiene P1 | `A_FAIRE` | stock/prix/KPI/cohortes sans divergence | a renseigner |
| G9 | checkout, Connect, refunds, schedulers et workers | `A_FAIRE` | une cible a la fois, owner explicite, Stripe test borne | a renseigner |
| G10 | webhooks Stripe v2 Gen2 | `A_FAIRE` | signatures, double endpoint deduplique, zero double effet | a renseigner |
| G11 | maintenance destructrice | `A_FAIRE` | AAL2, dry-run, sauvegarde, instance/concurrence 1 | a renseigner |
| G12 | retrait cible Gen1 puis nettoyage differe | `A_FAIRE` | G12-A garde le rollback; G12-B nettoie apres fenetre approuvee; trois Auth restent | a renseigner |
| G13 | charge/cout/IAM/runtime et cloture documentaire | `A_FAIRE` | sandbox migre et durci, runtime futur planifie, docs fusionnees | a renseigner |

## 6. Suivi des risques et ordre corrige

| Niveau | Action | Statut courant | Gate exacte |
| --- | --- | --- | --- |
| P0 | baseline projet/manifeste et deploiement fail-closed | `TERMINEE` | projet explicite, 152/157 reconcilies, wrapper allowlist teste |
| P0 | alertes, canaux, dashboard et runbooks | `A_FAIRE` | ouverture, notification, acquittement et retour testes |
| P0 | PITR, protection, backups et restauration | `A_FAIRE` | backup `READY`, base nommee du meme projet et de la meme localisation, RPO/RTO et DR cross-service prouves |
| P0 | `terminal_refund_conflict` et faux `healthy` | `A_FAIRE` | `healthy -> stop`, triage Stripe read-only, resolution auditee sans replay |
| P0 | dispatcher et contrat des workers | `A_FAIRE` (plateforme active seulement) | expiration Stripe test, effet unique, failures/backlog/overlap alertes |
| P1 | 10 produits, 26 commandes, KPI et reconciler borne | `A_FAIRE` | dry-run/backup/preconditions, cohortes, pagination/`truncated` |
| P1 | budgets, quota, charge et cout | `A_FAIRE` (budget non verifie) | operateur Billing, alertes quota, charge sandbox mesuree |
| P2 | analytics historiques | `A_FAIRE` (classification partielle) | export/quarantaine puis decision de retention post-cutover |

Les P0 bloquent les paiements reels et les vagues Gen2 cloud. Ils ne bloquent
pas une presentation cliente du sandbox en Stripe test, bornee et surveillee.
Les P1/P2 ne doivent pas retarder la demo par eux-memes.

Un statut partiel dans cette section ne signifie pas qu'une phase ulterieure a
commence: seul le journal d'execution fait foi. G0 y est fermee; G1 reste non
autorisee.

## 7. Fiche obligatoire pour chaque vague

Copier ce bloc sous la section Journal avant chaque execution:

```text
### Vague <ID> - <titre>

- Date/heure et fuseau:
- Agent/operateur:
- Branche et commit de depart:
- Projet/environnement:
- Phase et fonctions exactes:
- Generation/region avant:
- Cible Gen2 et revision:
- Appelants bascules:
- Compte runtime/build:
- Secrets attaches, noms uniquement:
- Concurrence/min-max/memoire/timeout:
- Donnees lues:
- Donnees ecrites:
- Tests locaux:
- Probes sandbox positives/negatives:
- Logs/metriques avant-apres:
- Incidents:
- Rollback execute et resultat:
- Documentation mise a jour:
- Decision: poursuivre / corriger / rollback / bloquer
- Prochaine action autorisee:
```

## 8. Journal d'execution

### G0 - reconciliation et classification

- Date/heure et fuseau: 2026-08-15, Africa/Casablanca;
- agent/operateur: Codex / compte CLI Google consigne dans le manifeste;
- branche et commit de depart: `codex/functions-gen2-migration`,
  `f80dc7213a8d738fb1edde11a926028bcb57ab28`;
- projet/environnement: sandbox `secondevienextjsssr`, confirme par
  `gcloud projects describe --project=secondevienextjsssr` et Firebase CLI;
  le projet `gcloud` global reste `vibefx-v2` et n'a jamais servi de cible
  implicite;
- outils: Node `22.22.3`, pnpm global `11.19.0` contre baseline `11.7.0`,
  Firebase CLI locale epinglee `15.26.0`;
- inventaire: 157 exports locaux uniques, 152 Functions cloud `ACTIVE`,
  139 Gen1, 13 Gen2, 146 en `europe-west1`, 6 en `us-central1`;
- classification: 13 `KEEP_GEN2`, 3 `KEEP_GEN1_AUTH`, 116 `MIGRATE`,
  20 `MIGRATE_OR_RETIRE`, 5 `HOLD_META_RECONCILIATION`;
- plateforme: 8 schedulers `ENABLED`, 2 queues `RUNNING`, 7 triggers
  Eventarc (6 `eur3`, 1 `us-central1`), 152 politiques invoker rapprochees;
- manifestes:
  `apphostingaudit/manifests/functions-g0.json`,
  `apphostingaudit/manifests/functions-platform-g0.json` et
  `apphostingaudit/manifests/functions-g0-digests.json`;
- garde: `functions/package.json` ne contient plus de deploy global; le
  wrapper `scripts/deploy-functions-targeted.mjs` refuse projet/codebase/HEAD/
  manifeste/digest incoherents, inputs non committes, allowlist vide ou
  superieure a dix, cible hors manifeste, les cinq Instagram et tout lot de
  plus d'une cible finance/webhook/scheduler;
- Meta: les cinq exports Instagram directs sont utilises par l'UI locale mais
  absents du cloud. La suppression cloud du chantier securite a precede le
  merge `6be360e` qui les a reintroduits dans le source. Les preuves M4/M5 du
  runbook sont donc historiques, pas l'etat cloud actuel. Decision G0:
  `HOLD_META_RECONCILIATION`, sans redeploiement ni suppression avant G7;
- drifts documentaires: ancien inventaire 91 dans Infrastructure, statut
  operationnel Instagram direct, reutilisation temporaire de `appspot` et
  options runtime implicites des 13 Gen2; corrections fusionnees dans les
  chapitres canoniques touches et le plan;
- risques mesures a fermer avant les vagues concernees: 70 options runtime
  source/cloud implicites sur les 13 Gen2, 31 exports dont l'idempotence reste
  `NOT_PROVEN_STATIC`, et 136 cibles actuelles sur le compte runtime historique
  `appspot`; aucun nouveau nom Gen2 ne peut reutiliser cette identite;
- tests: `npm run test:functions-g0`, `npm run lint:functions` et controles
  documentaires sont consignes a la cloture de G0;
- donnees/ecritures cloud/deploiement/paiement/build/suppression: aucun;
- decision: G0 fermee; ne pas commencer G1 sans autorisation explicite.

Premier lot local G2 propose, non execute: `G2-A1_SOCLE_SANS_BASCULE`, avec
adaptateur callable Gen2 commun, registre client identite par defaut et profils
runtime cibles sans `setGlobalOptions`. Aucune cible n'est remappee. Rollback
exact: revert du commit local G2-A1; aucun rollback cloud, donnees, IAM, secret,
endpoint ou App Hosting puisque le lot reste non deploye.

## 9. Conditions d'arret immediat

Arreter la vague au premier:

- ecart entre cloud et exports non explique;
- mauvais projet, region, compte ou secret;
- utilisation du projet `gcloud` global sans verification explicite;
- deploy Functions global, allowlist vide/superieure a dix ou plus d'une cible
  finance/webhook/scheduler;
- export `HOLD_META_RECONCILIATION` present dans une allowlist;
- regression Auth/App Check ou fuite de secret;
- lancement de `e2e:hosted-stripe` ou `e2e:refund-stripe`;
- double commande, mouvement, e-mail, fait financier ou refund;
- divergence prix, stock, paiement, projection ou incident;
- sante stale/unknown presentee comme `healthy` ou worker incomplete presente
  comme succes;
- absence de rollback prouve;
- besoin de production, Stripe live ou suppression de donnees non autorise.

## 10. Point de reprise

Pour commencer le chantier, utiliser le prompt de la section 15 de
[AUDIT_MIGRATION_FUNCTIONS_GEN2.md](AUDIT_MIGRATION_FUNCTIONS_GEN2.md), en
commencant exclusivement par G0. Toute reprise ulterieure commence par la
derniere entree du Journal et regenere la baseline avant de poursuivre.
