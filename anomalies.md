# Registre temporaire des anomalies de recette commerce

Derniere mise a jour: 2026-07-30
Statut: `OUVERT`
Campagne: [TEST_COMMERCE_SANDBOX.md](TEST_COMMERCE_SANDBOX.md)
Echeance de fusion et suppression: 2026-08-06

## Regles

- une ligne de synthese est ajoutee des qu'une anomalie est observee;
- le detail est complete avant toute correction;
- aucun mot de passe, OTP, token, PIN, secret, donnee de carte ou donnee
  personnelle inutile n'est consigne;
- une anomalie `BLOQUANTE` interdit de passer a la phase suivante;
- une anomalie fermee conserve sa preuve de requalification jusqu'a la fusion
  dans le chapitre canonique;
- ce registre est supprime apres fusion de toutes les informations durables;
  Git en conserve l'historique.

## Synthese

| ID | Phase | Severite | Statut | Resume |
| --- | --- | --- | --- | --- |
| A-001 | Publication admin | `BLOQUANTE` | `CORRIGEE_A_REQUALIFIER` | La session forte est controlee seulement apres l'envoi des images |
| A-002 | Validation locale | `MINEURE` | `FERMEE` | Le test de confinement cherchait l'ancien nom de la projection dashboard |
| A-003 | Validation Firebase | `MINEURE` | `FERMEE` | Les tests Web SDK recevaient un transform d'increment Admin SDK incompatible |

Severites:

- `BLOQUANTE`: paiement, stock, securite, donnees, role ou suite impossible;
- `MAJEURE`: resultat incorrect ou forte friction sans alternative sure;
- `MINEURE`: defaut visible ou information incompletement presentee;
- `COSMETIQUE`: finition visuelle sans ambiguite metier.

Statuts:

- `OUVERTE`;
- `EN_DIAGNOSTIC`;
- `CORRIGEE_A_REQUALIFIER`;
- `FERMEE`;
- `DIFFEREE_EXTERNE`.

## Anomalies

### A-001 - Reauthentification pendant la finalisation d'une publication

- statut: `FERMEE`
- severite: `BLOQUANTE`
- phase: publication admin par le site Hosting
- environnement: sandbox / Stripe test
- `runId`: `run_v2all_recipe_20260730_client_purchase_v1`
- `productId`: non cree
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: la publication cree une annonce publique apres l'envoi des deux
  images et la finalisation.
- observe: deux tentatives atteignent la finalisation, puis la modale de
  connexion s'ouvre. Le formulaire et les images restent intacts et aucune
  annonce portant le titre de recette n'apparait dans la liste.
- preuve: observation directe dans Chrome sur `/admin`; progression complete
  des variantes d'image puis `FINALISATION`.
- impact: impossible de poursuivre l'achat client sans remettre
  l'authentification administrateur dans un etat valide.
- cause racine ou hypothese: cause confirmee dans le code. `AdminForm`
  transfere toutes les variantes Storage avant le premier appel de commande,
  tandis que `createProductAdmin` exige ensuite une assurance forte agee de
  moins de 15 minutes. Une session deja ancienne n'est donc detectee qu'apres
  les transferts.
- decision de correction: ajouter une prevalidation serveur sans mutation,
  protegee par App Check, le controle commerce fail-closed et
  `checkRecentActiveStrongAdmin`, puis l'appeler avant toute compression ou
  ecriture Storage.
- fichiers/Functions touches: `functions/src/commerce/v2ProductCommands.js`,
  `functions/index.js`, `src/kit/commerce/adminProductCommandClient.js`,
  `src/kit/admin/AdminForm.jsx` et test de contrat Gate 4.
- validations lancees: deux parcours manuels complets avant correction;
  24 tests cibles Gate 4 verts; `npm run lint:functions` vert;
  `git diff --check` vert.
- resultat de requalification: deploiement sandbox puis parcours Hosting avec
  `loa.gto15@gmail.com` en attente.
- documentation canonique a mettre a jour: `map.md`,
  `_DOCS/catalogue/ANNONCES_CATALOGUE.md`,
  `_DOCS/admin/BACKOFFICE.md`, mis a jour localement.

### A-002 - Assertion de confinement desynchronisee du dashboard

- statut: `FERMEE`
- severite: `MINEURE`
- phase: validations locales avant deploiement
- environnement: local, aucune ecriture cloud
- `runId`: sans objet
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: la suite `test:commerce:containment` reconnait le repli financier
  autoritaire encore present dans `AdminDashboard`.
- observe: la suite cherchait `commerceOperations.operations?.projection`,
  identifiant retire lors de la migration vers l'etat `commerceStatus.data`.
- preuve: 11 scenarios de confinement sur 12 verts; seul
  `commerce-ui-is-explicitly-read-only` echouait sur cette recherche textuelle.
- impact: faux rouge de validation; aucun impact runtime ou donnees.
- cause racine ou hypothese: assertion non alignee avec le renommage deja
  present dans le commit courant du dashboard.
- decision de correction: viser le chemin executable actuel
  `commerceStatus.data?.operations?.projection` sans modifier le runtime.
- fichiers/Functions touches: `tests/commerce/suites/containment.cjs`.
- validations lancees: scenario de confinement puis suite commerce complete a
  rejouer.
- resultat de requalification: assertion ciblee corrigee; suite complete en
  attente.
- documentation canonique a mettre a jour: aucune, contrat runtime inchange.

### A-003 - Transform d'increment non injectable dans les tests Firebase

- statut: `CORRIGEE_A_REQUALIFIER`
- severite: `MINEURE`
- phase: validations Firebase locales avant deploiement
- environnement: emulateur local demo, aucune ecriture cloud
- `runId`: sans objet
- `productId`: sans objet
- `orderId`: sans objet
- reference provider non sensible: sans objet
- attendu: les repositories de paiement et remboursement acceptent le
  transform atomique correspondant au client Firestore injecte.
- observe: quatre scenarios Firebase refusaient le
  `NumericIncrementTransform` de l'Admin SDK dans une transaction Web SDK.
- preuve: erreur explicite sur `capturedCents` dans
  `commerce_financial_daily/2026-07-26_EUR`.
- impact: faux rouges des tests d'integration; le runtime Functions Admin SDK
  reste compatible.
- cause racine ou hypothese: le transform atomique etait le seul adaptateur
  Firestore non injecte dans deux modules pourtant concus pour recevoir leurs
  dependances.
- decision de correction: rendre `increment` injectable avec l'Admin SDK comme
  valeur production par defaut, et injecter le transform Web SDK uniquement
  dans la suite emulateur.
- fichiers/Functions touches:
  `functions/src/commerce/domain/paymentEffectApplier.js`,
  `functions/src/commerce/domain/refundRepository.js`,
  `tests/commerce/suites/firebase-domain.cjs`.
- validations lancees: suites domaine et faults vertes; integration Firebase
  `15/15`; regles v2 `5/5`.
- resultat de requalification: ferme; le transform Web SDK injecte est accepte
  par toutes les transactions emulateur et la valeur production Admin SDK
  reste le defaut.
- documentation canonique a mettre a jour: aucune, contrat runtime inchange.

## Modele d'anomalie

Dupliquer cette section pour chaque anomalie et remplacer `A-000`.

### A-000 - Titre court

- statut: `OUVERTE`
- severite:
- phase:
- environnement: sandbox / Stripe test
- `runId`:
- `productId`:
- `orderId`:
- reference provider non sensible:
- attendu:
- observe:
- preuve:
- impact:
- cause racine ou hypothese:
- decision de correction:
- fichiers/Functions touches:
- validations lancees:
- resultat de requalification:
- documentation canonique a mettre a jour:

## Journal de campagne

| Horodatage Europe/Paris | Evenement | Resultat | Identifiants non sensibles |
| --- | --- | --- | --- |
| 2026-07-30 | Initialisation du plan et du registre | En attente du preflight | - |
| 2026-07-30 15:15 | Publication admin depuis le site Hosting | Bloquee en finalisation par une demande de connexion | `run_v2all_recipe_20260730_client_purchase_v1` |
| 2026-07-30 15:18 | Fermeture de securite de la fenetre commerce | `v2_fixture`, mutations `read_only`, paiement offline `off` | `controlRevision=36` |
| 2026-07-30 15:23 | Verification de l'identite active | Le compte connecte etait un super-admin distinct; deconnexion sans nouvelle mutation | - |
| 2026-07-30 15:30 | Correction locale A-001 | Prevalidation avant upload; tests cibles et lint verts | - |
| 2026-07-30 15:34 | Validation commerce | Faux rouge de confinement localise puis corrige dans son assertion | `A-002` |
| 2026-07-30 15:38 | Validation Firebase | Incompatibilite de transform entre SDK isolee et rendue injectable | `A-003` |
| 2026-07-30 15:42 | Requalification locale | Commerce, navigateur local, Firebase, rules, Auth et build verts | `A-002`, `A-003` fermes; `A-001` a deployer |
