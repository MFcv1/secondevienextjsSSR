# Qualite, tests et gates

Derniere mise a jour: 2026-07-14
Statut: `REFERENCE_ACTIVE`

## 1. Principe de proportion

La validation depend du risque et de la demande:

- correctif cible: verification locale minimale, pas de build/navigateur automatique sans demande;
- changement structurel: lint/test cible/build selon impact;
- audit ou preuve: gates completes et resultats reproductibles;
- ecriture cloud: sandbox explicite, scope cible, preuve et nettoyage;
- production: plan de recette et rollback approuves.

Toujours annoncer ce qui a ete lance et ce qui ne l'a pas ete.

## 2. CI

`.github/workflows/quality.yml` s'execute sur pull request et push `main` avec Node 22/pnpm:

1. installation frozen lockfile;
2. lint;
3. contrat SEO public;
4. build Next;
5. classification des routes;
6. budget performance en rapport non bloquant.

Une CI verte ne remplace pas les E2E Firebase/Stripe ni une recette visuelle.

## 3. Tests automatises Auth

```bash
npm run test:auth
```

Suite actuelle:

```text
auth-claims.test.cjs
auth-store-contract.test.cjs
auth-unified-otp-contract.test.cjs
auth-backend-transitions.test.cjs
auth-admin-revocation.test.cjs
auth-assurance.test.cjs
auth-region-convergence.test.cjs
auth-email-provider-adapter.test.cjs
passkey-portability-contract.test.cjs
passkey-server-hardening.test.cjs
```

Les contrats testent la source de session, les transitions OTP, l'idempotence, la revocation, AAL2, les regions, l'adaptateur e-mail et WebAuthn.

## 4. Matrice par domaine

| Domaine touche | Gates recommandees |
| --- | --- |
| documentation seulement | liens locaux, references, `git diff --check` |
| route/SEO publique | `seo:surface`, `next:routes`, build, gate direct route |
| galerie | `perf:gallery-direct`, `mobile:contract`, scroll si concerne |
| categorie | `perf:category-direct`, SEO |
| produit/images | `perf:product-direct`, `perf:product-images`, audit images selon scope |
| A propos | `perf:about-direct` |
| devis | `perf:quote-direct` |
| menu/header | `perf:menu-desktop`, `perf:menu-mobile`, `mobile:contract` |
| Auth | `test:auth`, build, smoke reel selon changement |
| checkout/Stripe | tests locaux + `e2e:hosted-stripe` sur sandbox si demande |
| remboursement | `e2e:refund-stripe` sur commande test explicite |
| revalidation | `e2e:revalidate-catalog` |
| Functions/rules | tests cibles, audit exports/rules, deploiement sandbox cible |
| infra | `infra:env`, `infra:deploy`, `appcheck:audit` en lecture |

## 5. Gates publiques

```bash
npm run lint
npm run build
npm run seo:surface
npm run seo:check
npm run next:routes
npm run mobile:contract
npm run perf:budget
```

`seo:check` et plusieurs audits navigateur peuvent exiger un serveur ou l'URL sandbox. Lire le script avant execution.

## 6. Playwright et smoke

`tests/smoke.spec.mjs` et `playwright.config.mjs` couvrent les parcours de base. Pour une recette manuelle, verifier au minimum:

- rendu direct de la route sans flash d'une autre page;
- navigation clavier et focus des overlays touches;
- mobile et desktop du composant touche;
- erreurs console/reseau pertinentes;
- retour arriere et refresh;
- etat froid puis chaud si le probleme concernait la performance.

Windows Hello, Face ID, Touch ID, selecteur de compte Google et certains wallets requierent une intervention humaine sur l'appareil. Le test peut etre orchestre par l'agent, mais le secret/PIN reste saisi par l'utilisateur.

## 7. Tests cloud

Avant un E2E:

- confirmer le projet et l'URL;
- refuser production par defaut;
- utiliser un compte test;
- ne jamais afficher OTP, mot de passe, token ou cle;
- identifier les donnees creees;
- verifier le resultat dans Firestore/Stripe/logs;
- nettoyer uniquement ce que le test a cree;
- conserver une preuve redigee.

## 8. Tests de rules

Une modification `firestore.rules` ou `storage.rules` doit avoir au moins des cas:

- visiteur;
- utilisateur proprietaire;
- autre utilisateur;
- admin claim sans registre;
- admin registre sans assurance forte;
- admin fort;
- token revoque/expiré si le scenario le permet;
- schema valide et schema malforme.

L'Emulator Suite complete reste une amelioration possible, mais n'est pas requise pour rouvrir la passe Auth de demonstration deja close.

## 9. Definition de done

Un changement est termine quand:

- le besoin utilisateur est satisfait;
- les invariants du chapitre concerne sont preserves;
- les gates proportionnees passent;
- les erreurs et etats vides sont geres;
- les donnees de test sont identifiees;
- la documentation canonique et `map.md` sont mises a jour si l'architecture change;
- aucune dette non formulee n'est cachee dans un nouveau rapport;
- le compte rendu distingue code, validation et deploiement.

## 10. Validation documentaire

Pour une restructuration comme celle-ci:

```powershell
rg --files -g "*.md"
rg -n "ancien-nom\.md" .
git diff --check
git status --short
```

Verifier egalement que chaque chemin entre backticks dans `AGENTS.md`, `map.md` et `_DOCS/README.md` existe ou est clairement presente comme un futur chemin.
