# Stabilisation securite sandbox

Derniere mise a jour: 2026-08-12
Statut: `SANDBOX_SECURITY_STABILIZED`
Baseline d'ouverture: `45caf28`
Environnement: sandbox Firebase `secondevienextjsssr`
Production: `PRODUCTION_DEFERRED_BY_OWNER`
Revue finale: fermee sur le socle technique `05f4830`

## 1. Objet et condition de fin

Ce document est le suivi borne de la derniere phase de stabilisation securite.
Il conserve les actions, preuves et decisions entre les sessions sans rouvrir
un audit general a chaque reprise.

La phase sandbox est fermee lorsque les Gates S0 a S4 sont vertes sur un commit
gele, sans finding critique ou eleve ouvert. La phase production P1 reste
volontairement interdite tant que le projet n'a pas ete presente a la cliente
et que le proprietaire n'a pas autorise explicitement sa preparation.

Apres fusion de la PR #5:

1. fusionner les decisions durables dans `SECURITE_GLOBALE.md`,
   `AUTHENTIFICATION.md`, `QUALITE_TESTS.md`, `DONNEES_ANALYTICS.md`,
   `INFRASTRUCTURE.md`, les chapitres commerce et `map.md`;
2. verifier toutes les references avec `rg` et `git diff --check`;
3. supprimer ce compte rendu temporaire et ses references dans `AGENTS.md` et
   `_DOCS/README.md`;
4. conserver l'historique et les preuves detaillees dans Git.

## 2. Regles de pilotage

Statuts autorises:

- `A_FAIRE`: travail identifie mais non commence;
- `EN_COURS`: lot actif;
- `FAIT_A_REQUALIFIER`: implementation terminee, preuve finale manquante;
- `FERME`: implementation et preuves terminees;
- `ACCEPTE_NON_BLOQUANT`: dette documentee qui ne bloque pas la presentation;
- `PRODUCTION_DIFFEREE`: action interdite avant decision explicite de reprise.

Regles de non-derivation:

- aucun nouveau chantier n'entre dans ce plan sans chemin d'attaque plausible
  sur Auth, administration, paiement, donnees personnelles, upload, secrets ou
  integration externe;
- un finding faible ou theorique rejoint la dette canonique et ne rouvre pas
  toutes les Gates;
- apres gel du commit, un changement ordinaire ne rejoue que ses tests cibles;
- un audit complet n'est rouvert que pour une nouvelle surface publique, un
  changement Auth/Rules/IAM, un provider externe, un flux financier ou une
  vulnerabilite critique de dependance;
- aucun deploiement, secret live, domaine, Stripe live ou rail Firebase
  production n'est implicite.

## 3. Etat d'ouverture confirme

Forces deja acquises:

- admin protege par token Firebase, claim, registre actif et AAL2;
- App Check `ENFORCED` sur Auth, Firestore et Storage du sandbox;
- Firestore et Storage deny-by-default;
- prix, stock, commandes, remboursements et webhooks autoritaires serveur;
- signatures Stripe, idempotence et reprises commerce couvertes;
- secrets exclus du depot et du bundle controle;
- IAM sandbox sans role `Editor` historique;
- endpoints E2E fail-closed;
- gates Auth, catalogue, commerce, Rules et build deja substantielles.

Preuves d'ouverture du 2026-08-12:

- `tests/security-hardening.test.mjs`: 11/11 verts en execution directe;
- `scripts/audit-infra-env.cjs`: `ok: true`, rail production correctement
  detecte comme absent;
- `scripts/audit-app-check-paths.cjs`: `findingCount: 0`;
- worktree Git propre avant implementation;
- la commande agregee `pnpm security:audit:static` n'a pas demarre localement
  car le poste expose Node 24/pnpm 11.16 au lieu de Node 22/pnpm 11.7; ce point
  devra etre requalifie sur la baseline officielle et ne constitue pas un
  echec de securite.

## 4. Gate S0 - Perimetre et inventaire

Statut global: `FERME`

- [x] Geler la baseline d'ouverture `45caf28`.
- [x] Confirmer le projet sandbox, Stripe test et Gmail actif.
- [x] Confirmer que le rail production est absent et hors scope.
- [x] Comparer les audits precedents aux surfaces ajoutees depuis juillet.
- [x] Produire un inventaire executable des 94 transports callable et exiger
  App Check sur leur runtime direct ou partage.
- [x] Completer l'inventaire des neuf transports HTTP Functions et des cinq
  routes API Next: beacon origine/corps/token, callback OAuth one-shot,
  webhooks signes, preuves E2E fail-closed, API publiques bornees et routes
  admin AAL2/App Check.
- [x] Requalifier l'inventaire apres integration Instagram directe: 94
  callables, neuf transports HTTP, cinq routes API, Rules Firestore et racines
  Storage couvertes par les contrats statiques/emulateurs.

Condition de fermeture: aucune Function callable, route Next privee, webhook,
racine Firestore ou racine Storage sensible n'est absente de l'inventaire.

## 5. Gate S1 - Ecarts de code connus

Statut global: `FERME`

### S1.1 App Check Stripe Connect

Statut: `FERME`

- [x] Ajouter `enforceAppCheck: true` aux cinq callables Stripe Connect.
- [x] Remplacer la liste partielle du test de durcissement par un controle
  exhaustif de tous les `.https.onCall` sous `functions/src`.
- [x] Verifier que les cinq callables conservent admin actif, AAL2 et secrets.
- [x] Lancer la gate de durcissement ciblee: 12/12 tests verts, dont 90
  transports callable inventories; la suite finale porte 15/15 tests avec les
  inventaires HTTP/API et l'absence de reader commande par e-mail.

### S1.2 Donnees personnelles, logs et retention

Statut: `FERME`

- [x] Retirer e-mail/UID des logs du trigger d'attribution admin et les
  destinataires des logs des anciens triggers e-mail commande; borner leurs
  erreurs fournisseur a `name`/`code`.
- [x] Terminer l'inventaire des autres logs Functions et classifier les
  identifiants techniques encore necessaires a l'exploitation: l'UID reste
  brut dans l'audit d'imputabilite; e-mail/IP/user-agent y sont hashes; les
  IDs commande/provider restent des identifiants operationnels.
- [x] Hasher aussi les e-mails cibles des mutations admin et interdire dans
  les reponses `internal` tout message d'erreur brut provenant d'un provider.
- [x] Inventorier `analytics_sessions`, `sys_audit_security`,
  `sys_audit_stripe_connect`, devis, newsletter et limites de taux.
- [x] Fixer une duree de conservation sandbox: analytics/audits 366 jours,
  systeme 30 jours, attribution 90 jours; commandes/factures et devis/photos
  exclus de la purge generique pour ne pas casser les obligations ou Storage.
- [x] Ajouter expiration/purge idempotente et tests de bornes: outil manuel en
  dry-run par defaut, cinq contrats verts, aucune purge executee.
- [x] Documenter acces, finalite, retention et droit de suppression dans
  `DONNEES_ANALYTICS.md`; le workflow juridique/coordonne production reste P1.

### S1.3 Identite et schemas Rules

Statut: `FERME`

- [x] Retirer la lecture commande par e-mail verifie: l'UID checkout est
  l'unique identite client dans les Rules et l'ancien listener UI Firestore
  par `userEmail` a ete supprime.
- [x] Tester UID different/e-mail identique avec e-mail verifie Google; le
  provider, la casse et la revocation ne peuvent plus ouvrir un fallback e-mail
  puisqu'aucun e-mail n'intervient dans la decision.
- [x] Borner le schema wishlist; rendre le document racine profil backend-only.
- [x] Declarer explicitement `sys_audit_security` et
  `sys_audit_stripe_connect` backend-only.
- [x] Rejouer les emulateurs Firestore et Storage: confinement 17/17 et
  frontieres commerce v2 5/5.

### S1.4 Couverture CI des surfaces recentes

Statut: `FERME`

- [x] Integrer `appcheck:audit`, Meta, factures, analytics, onboarding et cache
  admin a la gate qualite appropriee.
- [x] Etendre `lint:functions --max-warnings 0` de son ancien scope partiel a
  `functions/index.js`, tous les helpers et tous les domaines `functions/src`.
- [x] Conserver le temps CI borne et separer les preuves cloud externes: les
  six ajouts sont locaux et ne contactent aucun provider.
- [x] Rejouer localement toute la composition CI sur Node 22.22.3 avec pnpm
  11.7.0 et les lockfiles figes; les installs racine/Functions sont passees.
- [x] Obtenir le run GitHub vert sur le commit gele: PR #5, run
  `31591766542`, 3 min 25 s, apres installation explicite des prerequis
  Chromium et emulateurs locaux sur le runner vierge.

Condition de fermeture S1: tous les items ci-dessus sont `FERME` ou portent
une decision `ACCEPTE_NON_BLOQUANT` explicite et justifiee; aucun risque moyen
non accepte ne touche Auth, admin, paiement ou donnees personnelles.

## 6. Gate S2 - Validation automatisee finale

Statut global: `FERME`

Sur la baseline Node 22/pnpm 11.7:

- [x] `security:audit:static`: 24/24 apres S3 et la pre-cloture; audits racine
  et Functions a zero vulnerabilite connue au seuil modere;
- [x] `npm run lint` avec zero erreur et 162 warnings historiques, plus
  `npm run lint:functions` strict vert sur l'ensemble des Functions;
- [x] `npm run test:auth`: 74/74;
- [x] `test:catalog`: coeur/publication 14/14, resilience 18/18, securite 11/11 et
  emulateurs Firestore/Storage/devis 12/12 avant l'extension S3;
- [x] tous les constituants `test:commerce`: runner 13/13, containment 12/12,
  unit 121/121, UI 16/16, navigateur 4/4, property 3/3, faults 41/41,
  Rules containment 17/17, Firebase domain 18/18 et Rules v2 5/5;
- [x] devis, newsletter, Meta, factures, analytics, onboarding, App Check,
  retention, cache admin, deploiement-cache, support, release et a11y verts;
- [x] build Next 16 Webpack, puis scan de 1 633 fichiers du bundle sans secret
  ni source map publique; origine, SEO, routes et contrat mobile verts;
- [x] build Next 16 Turbopack canonique et controles post-build verts dans
  GitHub Actions sur le commit `72b753a`;
- [x] `git diff --check` et liens documentaires avant le lot S3.

Les gates cloud ou hebergees restent separees et ne sont jamais lancees par
implication de cette liste.

Condition de fermeture: toutes les gates locales obligatoires sont vertes sur
le meme commit; tout test non lance est explicitement motive.

La limite locale `EPERM` du worker PostCSS est levee comme incertitude: le
runner GitHub a compile le build Turbopack canonique, puis passe l'audit bundle,
l'origine publique, la classification des routes et le rapport performance.

## 7. Gate S3 - Campagne adversariale sandbox bornee

Statut global: `FERME`

La liste suivante est fermee avant execution. Elle ne devient pas une recherche
illimitee:

- [x] matrice anonyme/client A/client B/admin sans AAL2/admin AAL2/admin
  revoque/App Check absent couverte par Auth, Rules et l'inventaire exhaustif
  des 90 callables;
- [x] IDOR commandes, retours, factures/documents, liens de paiement et etats
  Meta couverts par les contrats commerce/Auth; devis/photos complete par un
  jeton etranger refuse en emulateur;
- [x] rejeu/concurrence OTP, passkeys, OAuth Meta, checkout, webhooks,
  remboursements et liens de paiement couverts par les suites Auth, Meta et
  les tests de fautes/transactions commerce;
- [x] images tronquees, faux MIME, dimensions extremes, charge memoire et
  nettoyage apres echec: jeton etranger, contenu invalide, limite 25 millions
  de pixels, MIME divergent re-encode et absence d'orphelin prouves sur
  emulateurs; publication produit rattachee a `test:catalog:core`;
- [x] XSS/injections dans produits, notes admin, donnees client, e-mails, PDF
  et JSON-LD: gate transverse 4/4, soit securite statique totale 23/23;
- [x] rafales devis/newsletter/OTP et tentative de contournement IP,
  `X-Forwarded-For`, e-mail et IPv6: helper commun canonique ajoute; IP runtime
  prioritaire, formes IPv6 equivalentes et IPv4 mappees convergentes, quatre
  tests adversariaux verts;
- [x] smokes heberges sans mutation: route API admin 401, callable privee 401,
  webhooks Stripe plateforme/Connect sans signature 400, deux endpoints E2E
  absents 404, et cinq surfaces privees avec `private, no-store` +
  `noindex, nofollow, noarchive`.

Condition de fermeture: zero critique/eleve ouvert; les corrections sont
rejouees uniquement sur le scenario touche et ses voisins directs.

## 8. Gate S4 - Revue finale et decision sandbox

Statut global: `FERME`

- [x] Relire une derniere fois le diff complet Auth/admin, commerce/Stripe,
  Meta OAuth, devis/uploads, Rules, logs, retention et CI par l'agent
  responsable de l'implementation; aucune independance artificielle n'est
  revendiquee.
- [x] Confirmer zero critique/eleve ouvert et requalifier les deux derniers
  ecarts admin/audit avec Auth 74/74, retention 5/5 et securite statique 24/24.
- [x] Confirmer qu'aucun risque moyen non accepte ne touche Auth, admin,
  paiement ou donnees personnelles; les seules limites residuelles sont les
  dettes non bloquantes fermees de la section 10 et les prerequis production P1.
- [x] Prononcer `SANDBOX_SECURITY_STABILIZED` sur le socle technique
  `05f4830`, valide par le run GitHub `31592172386` entierement vert.

Ce statut signifie que le sandbox est suffisamment proche de la production
pour la presentation cliente. Il ne constitue pas un GO live.

## 9. Phase P1 - Production volontairement differee

Statut global: `PRODUCTION_DIFFEREE`

Reprise interdite avant presentation cliente et decision explicite du
proprietaire. La liste connue est:

- [ ] projet Firebase et backend App Hosting production distincts;
- [ ] nom de domaine, TLS, origines Auth/CORS/CSP et RP ID WebAuthn finals;
- [ ] Resend et DNS SPF/DKIM/DMARC;
- [ ] Stripe live, Connect/KYC, secrets et webhooks live;
- [ ] App Check production apres telemetrie representative;
- [ ] IAM/secrets production, sauvegarde restauree, alertes et runbook incident;
- [ ] validation juridique CGV/retours et coordonnees finales;
- [ ] paiement puis remboursement live de faible montant autorise.

Condition de fermeture future: Gates S0-S4 fermees, P1 prouvee sur un projet
distinct et decision humaine explicite `PRODUCTION_SECURITY_READY`.

## 10. Dettes explicitement non bloquantes

Sauf nouveau chemin d'exploitation demontre, ne bloquent pas la presentation:

- migration complete de la CSP hors `unsafe-inline` apres tests XSS verts;
- SBOM/SLSA et provenance avancee;
- fuzzing illimite ou matrice exhaustive de tous les navigateurs;
- contrainte organisationnelle automatique contre les futurs grants Editor si
  l'inventaire IAM reste sans Editor et qu'un controle de derive est conserve;
- optimisations CSS/JS, p50/p95 production et convergence regionale.

## 11. Journal d'execution

| Date | Commit/base | Action | Resultat | Suite autorisee |
| --- | --- | --- | --- | --- |
| 2026-08-12 | `05f4830` / PR #5 | revue finale S4 demandee au responsable | demande de revue tierce retiree avant toute review; diff complet relu, CI exacte verte, aucun critique/eleve ni moyen non accepte sur les surfaces sensibles; statut `SANDBOX_SECURITY_STABILIZED` prononce sans revendiquer une independance externe | presentation cliente; production P1 toujours interdite sans decision explicite |
| 2026-08-12 | `72b753a` / PR #5 | troisieme CI du commit gele | run `31591766542` vert en 3 min 25 s: audits, lints, commerce complet avec navigateur/emulateurs, catalogue, Auth, suites transverses, build Turbopack et controles post-build | S1/S2 fermees; obtenir la revue independante S4 |
| 2026-08-12 | `9c6705a` / PR #5 | deuxieme CI du commit gele | Chromium installe et contrats navigateur passes; arret fail-closed au premier harnais Rules car les JAR Firestore/Storage n'etaient pas precharges sur le runner vierge | precharger explicitement les emulateurs locaux, sans credential ni projet cloud, puis requalifier la PR |
| 2026-08-12 | `b6adaf4` / PR #5 | premiere CI du commit gele | echec d'infrastructure avant les gates suivantes: Chromium Playwright absent du runner; quatre tests navigateur non executes, aucun echec applicatif | installer Chromium explicitement dans la CI puis requalifier la PR |
| 2026-08-12 | worktree apres `45caf28` | pre-cloture admin et CI | lookups Auth admin transitoires fail-closed; e-mails cibles d'audit hashes; erreurs `internal` generiques; lint strict etendu a toutes les Functions; lint vert, Auth 74/74, retention 5/5, securite statique 24/24 | figer un commit puis obtenir CI GitHub/Turbopack et revue S4 independante |
| 2026-08-12 | sandbox deploye + worktree apres `45caf28` | fermeture S3 | securite statique 23/23; uploads adversariaux 2/2 sur emulateurs demo; API/callable/webhooks heberges refusent 401/400, E2E 404, routes privees no-store/noindex; aucune mutation ni deploiement | requalifier S1/S2 sur commit gele puis S4 independante |
| 2026-08-12 | worktree apres `45caf28` | ouverture S3 rate limits et uploads | helper IP commun sur OTP/passkeys/devis/newsletter; 19/19 securite, 72/72 Auth, 14/14 catalogue coeur/publication; upload devis jeton etranger/faux image/nettoyage 2/2 sur emulateurs demo; aucune ecriture cloud | completer bornes images et injections locales |
| 2026-08-12 | worktree apres `45caf28` | requalification S2 Node 22.22.3/pnpm 11.7.0 | installs lockes, audits dependances sans vulnerabilite, toutes suites CI locales vertes; build Webpack 22 pages, bundle 1 633 fichiers sans secret; Turbopack bloque uniquement par port PostCSS `EPERM` | run GitHub sur commit gele avant fermeture S2 |
| 2026-08-12 | worktree apres `45caf28` | prequalification S2 locale | securite statique 15/15, retention 5/5, Auth 72/72, Meta/devis 12/12, consumer commerce 16/16, lint global sans erreur et lint Functions strict vert; baseline locale Node 24 donc S2 reste ouverte | rejouer l'agregat sur Node 22/pnpm 11.7 |
| 2026-08-12 | worktree apres `45caf28` | fermeture S0, S1.2 et S1.3 | inventaires 90 callables/8 HTTP/5 API; retention 5/5; securite 15/15; Rules confinement 17/17 et v2 5/5; ancien reader e-mail retire; aucune purge ni ecriture cloud | requalifier les gates locales S2 sur Node 22 |
| 2026-08-12 | worktree apres `45caf28` | S1.4 ajout des suites recentes a la CI | analytics et App Check verts; onboarding, factures, cache admin et Meta 20/20 verts apres alignement du test facture sur le deny explicite Storage; CI Node 22 non encore executee | requalifier la CI officielle Node 22 |
| 2026-08-12 | worktree apres `45caf28` | debut S1.2 minimisation des logs | identifiants de compte retires des logs admin/e-mail; test de non-regression ajoute; securite 12/12 et Auth/e-mail 18/18 verts | inventorier retention sans lancer de purge |
| 2026-08-12 | worktree apres `45caf28` | S1.1 App Check Stripe Connect + inventaire callable exhaustif | cinq callables durcis; syntaxe valide; gate ciblee 11/11 verte sur 90 transports; aucun deploiement | ouvrir S1.2 logs/retention apres revue du diff |
| 2026-08-12 | `45caf28` | audit de cloture rapide et controles locaux directs | fondations confirmees; S1.1, retention, identite et CI identifies comme derniers lots code | commencer S1.1 sans deploiement |
