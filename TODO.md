# Reprise du travail - 2026-07-28

Statut: `HANDOFF_TEMPORAIRE`
Point d'arret: 2026-07-27
Fin de validite: 2026-07-31
Source de verite: `_DOCS/commerce/NOYAU_COMMERCE_STABILISATION.md`
Checkpoint Git: `4f74914` (`chore(checkpoint): advance commerce gate 4 and marketplace UX`)

Ce fichier sert uniquement a reprendre rapidement le travail. Il ne remplace
ni la roadmap commerce ni les chapitres canoniques. A la cloture de la Gate 4,
son contenu utile doit etre fusionne dans les documents canoniques, puis ce
fichier doit etre supprime. S'il est encore present le 2026-07-31, le
rapprocher avec le code et la roadmap avant de l'utiliser.

## Point d'arret exact

- Gates 0A a 3: `CODE_READY_LOCAL`.
- Gate 4: `IN_PROGRESS_LOCAL`.
- Decision globale: `NO_GO_TRANSACTIONNEL`.
- Runtime commerce v2: dormant, non importe par `functions/index.js`.
- Aucun endpoint v2, scheduler, writer, policy ou flag transactionnel actif.
- Aucune activation sandbox, migration ou recette hebergee effectuee.
- Le checkpoint `4f74914` est le point de reprise. Au dernier controle, `HEAD`,
  `main` et `origin/main` pointaient tous sur ce commit et le worktree etait
  propre.

## Synchroniser le Mac avant de reprendre

Ne pas supposer que le clone Mac est propre. Commencer par:

```bash
git status --short
git branch --show-current
git fetch origin
git log --oneline --decorate -3
```

Si le worktree Mac est propre et que la branche attendue est `main`:

```bash
git switch main
git pull --ff-only origin main
git rev-parse --short HEAD
```

Le dernier resultat doit etre `4f74914`. Si le Mac contient deja des
changements locaux, ne pas les ecraser et ne pas lancer de reset/clean:
inspecter ou isoler ces changements avant le pull.

## Dossier de lecture obligatoire

Codex sur le Mac ne doit pas se fier a ce seul TODO. Lire dans cet ordre:

1. `AGENTS.md`
   - bible operationnelle, invariants, autorisations et politique de
     validation;
2. `TODO.md`
   - point d'arret et ordre de reprise;
3. `map.md`
   - cartographie executable des flux, modules, donnees et Rules;
4. `_DOCS/README.md`
   - index des chapitres canoniques;
5. `_DOCS/commerce/NOYAU_COMMERCE_STABILISATION.md`
   - roadmap complete, gates 0A a 8, criteres d'acceptation et etat local;
6. `_DOCS/commerce/COMMERCE_STRIPE.md`
   - verite canonique du paiement, stock, refund, retour et Connect;
7. `_DOCS/quality/QUALITE_TESTS.md`
   - commandes de validation, limites des emulateurs et preuves attendues;
8. `_DOCS/admin/BACKOFFICE.md`
   - architecture admin, lazy loading et actions sensibles;
9. `_DOCS/client/ESPACE_CLIENT.md`
   - espace commandes et actions client;
10. `_DOCS/security/SECURITE_GLOBALE.md`
    - frontieres de confiance, Rules, App Check et secrets;
11. `_DOCS/security/AUTHENTIFICATION.md`
    - acteur admin, registre actif et assurance AAL2 recente;
12. `_DOCS/catalogue/ANNONCES_CATALOGUE.md`
    - source `furniture`, commandes produit et publication snapshot.

Lire `_DOCS/infra/INFRASTRUCTURE.md` et
`_DOCS/operations/EXPLOITATION.md` avant toute proposition cloud, deploiement
ou activation. Aucune action cloud n'est autorisee par ce handoff.

## Code executable a inspecter avant de modifier

Noyau Gate 4:

```text
functions/src/commerce/domain/allowedActions.js
functions/src/commerce/domain/orderCommandRepository.js
functions/src/commerce/domain/cancellationCoordinator.js
functions/src/commerce/domain/cancellationAuditRepository.js
functions/src/commerce/domain/refundCoordinator.js
functions/src/commerce/domain/refundRepository.js
functions/src/commerce/domain/refundSaga.js
functions/src/commerce/domain/refundSagaService.js
functions/src/commerce/domain/returnCase.js
functions/src/commerce/domain/returnRepository.js
functions/src/commerce/domain/productCommands.js
functions/src/commerce/domain/productCommandRepository.js
functions/src/commerce/domain/v2Runtime.js
functions/src/commerce/v2ProductCommands.js
```

Surfaces frontend/admin:

```text
app/admin/AdminAppIsland.jsx
src/kit/admin/AdminForm.jsx
src/kit/admin/AdminItemList.jsx
src/kit/admin/AdminOrders.jsx
src/kit/admin/AdminReturns.jsx
src/kit/commerce/adminProductCommandClient.js
src/kit/commerce/MyOrdersView.jsx
src/kit/commerce/CheckoutView.jsx
```

Preuves:

```text
tests/commerce/domain/gate4-commands-returns.test.cjs
tests/commerce/faults/gate4-refund.test.cjs
tests/commerce/faults/gate3-saga.test.cjs
tests/commerce/faults/gate3-workers.test.cjs
tests/commerce/suites/firebase-domain.cjs
tests/commerce/rules/v2-boundaries.cjs
tests/commerce/manifest.json
firestore.rules
package.json
```

## Ce qui est termine dans la Gate 4

- `allowedActions` derive cote serveur.
- Commandes fulfillment idempotentes et auditees.
- Annulation client provider-first avec audit convergent.
- Refund Stripe reprenable, cumul exact, compte Connect historique epingle et
  aucun restock automatique.
- Retours quantitatifs par ligne: ouverture, annulation, reception, restock,
  write-off et resolution.
- Allocations concurrentes bornees et mouvements d'inventaire idempotents.
- Archive de commande et de produit sous forme de soft-delete.
- Commandes produit serveur:
  - creation en brouillon;
  - offre/prix;
  - ajustement de stock avec `inventoryVersion`;
  - publication;
  - archive douce.
- Callables produit AAL2/App Check preparees dans
  `functions/src/commerce/v2ProductCommands.js`, mais non exportees.
- Formulaire et liste produits branches sur
  `src/kit/commerce/adminProductCommandClient.js`.
- Flag `COMMERCE_V2_ADMIN_COMMANDS_ENABLED` force a `false`.
- Rules backend-only ajoutees pour allocations de retour, resultats de
  commandes et audits produit.
- `map.md` et les chapitres catalogue, commerce et qualite sont synchronises.

## Premier travail a reprendre

Ordre recommande, sans sauter de gate:

- [ ] Creer le transport callable dormant pour les commandes fulfillment et
  archive de commande.
- [ ] Creer le transport callable dormant pour l'annulation client.
- [ ] Creer le transport callable dormant pour les refunds admin.
- [ ] Creer le transport callable dormant pour ouverture, reception,
  disposition et resolution des retours.
- [ ] Deriver l'acteur exclusivement du contexte Auth; ne jamais accepter
  `uid`, role ou AAL2 depuis le payload client.
- [ ] Exiger App Check, admin actif et assurance forte recente sur les actions
  admin sensibles.
- [ ] Brancher les interfaces Commandes/Retours sur ces transports derriere un
  flag compile a `false`.
- [ ] Retirer des chemins v2 toutes les mutations commerce directes
  `updateDoc/deleteDoc`; garder les anciennes surfaces inertes tant que leur
  remplacement n'est pas complet.
- [ ] Ajouter les tests de non-admin, admin faible, double clic, retry reseau,
  payload conflictuel, version obsolete et audit unique.
- [ ] Rejouer `lint:functions`, le lint UI cible et `pnpm run test:commerce`.
- [ ] Mettre a jour `map.md`, `COMMERCE_STRIPE.md`,
  `NOYAU_COMMERCE_STABILISATION.md` et `QUALITE_TESTS.md`.
- [ ] Ne passer la Gate 4 a `CODE_READY_LOCAL` que lorsque tous ses transports
  et branchements UI dormants sont presents et verts.

## Preuves vertes au point d'arret

- `lint:functions`: vert.
- `test:commerce:runner`: 13/13.
- `test:commerce:containment`: 12/12, 213 assertions.
- `test:commerce:unit`: 31/31.
- `test:commerce:property`: 3/3.
- `test:commerce:faults`: 33/33.
- `test:commerce:rules:containment`: 10/10.
- `test:commerce:firebase`: 14/14, 64 assertions.
- `test:commerce:rules`: 4/4.
- Agregat `pnpm run test:commerce`: vert.
- `git diff --check`: vert.
- Lint UI cible: zero erreur; 24 avertissements legacy restent presents dans
  `AdminForm.jsx` et `AdminItemList.jsx`.
- Execution locale observee avec Node 24.14.0/pnpm 11.9.0, alors que la
  baseline du projet reste Node 22.x/pnpm 11.7.0.

## Validations volontairement non lancees

- build global Next;
- navigateur, screenshots ou Playwright;
- E2E Stripe/Firebase heberges;
- migration ou backfill;
- deploiement Firebase/App Hosting;
- activation d'un flag ou d'une policy;
- recette avec comptes client/admin;
- nouveau commit/push apres les ajustements de handoff de ce document.

## Apres la Gate 4

- Gate 5: basculer checkout, espace commandes, admin et Rules vers le contrat
  v2, writer encore desactive.
- Gate 6: classifier le legacy et preparer les fixtures sandbox; toute
  execution cloud exige une autorisation separee.
- Gate 7A: projections, documents, outbox et exploitation.
- Gate 7B: E2E coeur sandbox final, deux runs consecutifs sur le meme SHA;
  autorisation explicite obligatoire.
- Gate 8: recette humaine client/admin uniquement apres les preuves
  automatiques et l'autorisation sandbox.

## Garde-fous pour demain

- Lire `AGENTS.md`, `map.md`, ce fichier, puis le chapitre commerce canonique.
- Verifier `git status --short` avant toute modification.
- Preserver les changements non lies deja presents dans le worktree,
  notamment les fichiers de galerie/CSS.
- Ne pas exporter `v2ProductCommands.js` ni activer un flag pour simplement
  faire passer un test.
- Ne pas deployer ou toucher au sandbox sans demande explicite.
- Ne jamais remettre en stock sur la seule base d'un refund.
- Ne jamais supprimer une commande payee, un audit, un mouvement ou un fait
  financier.

## Prompt pret a copier dans Codex sur le Mac

```text
Tu travailles dans le depot secondevienextjsSSR sur mon Mac. Tu n'as aucun
historique de la conversation precedente. Le checkpoint de reference est le
commit 4f74914 sur main/origin-main.

Objectif: reprendre strictement la roadmap de stabilisation du noyau commerce
au point d'arret Gate 4 IN_PROGRESS_LOCAL, sans activer le runtime ni toucher
au sandbox.

Avant toute modification:
1. lis integralement AGENTS.md;
2. lis TODO.md;
3. inspecte git status, la branche et le commit courant sans ecraser de
   changements locaux;
4. lis map.md et _DOCS/README.md;
5. lis integralement:
   - _DOCS/commerce/NOYAU_COMMERCE_STABILISATION.md
   - _DOCS/commerce/COMMERCE_STRIPE.md
   - _DOCS/quality/QUALITE_TESTS.md
   - _DOCS/admin/BACKOFFICE.md
   - _DOCS/client/ESPACE_CLIENT.md
   - _DOCS/security/SECURITE_GLOBALE.md
   - _DOCS/security/AUTHENTIFICATION.md
   - _DOCS/catalogue/ANNONCES_CATALOGUE.md
6. inspecte ensuite tous les fichiers listes dans les sections "Code
   executable a inspecter" et "Preuves" de TODO.md.

Etat a ne pas reouvrir:
- Gates 0A a 3 sont CODE_READY_LOCAL;
- Gate 4 est IN_PROGRESS_LOCAL;
- allowedActions, fulfillment repository, annulation provider-first auditee,
  refunds reprenables, retours/dispositions, commandes produit et soft-archive
  sont deja codes;
- les callables produit et le formulaire/liste produit sont cables, mais
  COMMERCE_V2_ADMIN_COMMANDS_ENABLED reste false;
- v2Runtime est dormant et aucune Function v2 n'est exportee;
- NO_GO_TRANSACTIONNEL reste actif.

Travail suivant autorise:
1. implementer localement les transports callable dormants pour
   fulfillment/archive commande, annulation client, refund admin et
   retours/dispositions;
2. deriver UID/role/AAL2 uniquement du contexte Auth;
3. exiger App Check et admin actif avec assurance forte recente selon
   l'action;
4. brancher Commandes/Retours derriere des flags compiles a false;
5. retirer les mutations commerce SDK directes uniquement sur les chemins v2
   remplaces, sans ouvrir les writers legacy;
6. ajouter les tests negatifs, idempotence, retry, concurrence, version et
   audit;
7. lancer les validations proportionnees definies dans QUALITE_TESTS.md;
8. synchroniser map.md, les chapitres canoniques et TODO.md.

Interdictions:
- ne pas exporter/activer les Functions v2;
- ne pas changer un flag a true;
- ne pas deployer, migrer, backfiller ou acceder au sandbox sans demande
  explicite;
- ne pas lancer build, navigateur, Playwright ou E2E heberge sans demande;
- ne jamais restock sur la seule base d'un refund;
- ne jamais supprimer une commande payee, un audit, un mouvement ou un fait
  financier;
- ne pas creer une nouvelle roadmap;
- ne pas utiliser git reset/clean/checkout pour effacer un travail existant;
- ne pas commit/push sans ma demande explicite.

Condition d'arret de cette passe: les transports et branchements UI Gate 4
restants sont presents en mode dormant, les tests locaux proportionnes sont
verts, la documentation est synchronisee, et Gate 4 n'est marquee
CODE_READY_LOCAL que si tous ses criteres locaux sont reellement satisfaits.

Commence par me donner un court etat factuel apres lecture, puis implemente la
prochaine tranche Gate 4 sans me redemander les informations deja presentes
dans le depot.
```
