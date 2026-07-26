# Reprise du travail - 2026-07-28

Statut: `HANDOFF_TEMPORAIRE`
Point d'arret: 2026-07-27
Fin de validite: 2026-07-31
Source de verite: `_DOCS/commerce/NOYAU_COMMERCE_STABILISATION.md`

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
- Aucune activation sandbox, migration, recette hebergee, commit ou push
  effectue pendant cette passe.
- Le worktree contient les changements Gate 4 non committes. Ne pas lancer
  `git reset`, `git clean` ou `git checkout --` pour reprendre.

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
- commit, push ou pull request.

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
