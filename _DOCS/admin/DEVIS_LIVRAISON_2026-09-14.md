# Livraison sandbox des devis — 14 septembre 2026

Autorisation utilisateur : commit du seul chantier devis, App Hosting sandbox,
puis accord explicite pour les deux Functions nécessaires. Aucun push demandé.
Contrat fonctionnel : [Back-office](BACKOFFICE.md#51-demandes-de-devis).

## Source et isolation

- `f886009` : interface, chiffrage, photos privées, envoi, corbeille et tests.
- `51f7f15` : bucket explicite du lecteur admin partagé.
- `5532c8c` : référence Gmail du mutateur alignée sur le transport sandbox actif.
- Hosting construit depuis une copie isolée de `f886009`, hors modifications
  non terminées sur les fiches produit. Les deux commits suivants ne modifient
  que le manifeste de déploiement, pas les sources applicatives.
- Aucun fichier de l'optimisation parallèle n'a été commité ou déployé.

## État cloud vérifié

Projet `secondevienextjsssr`, backend `secondevie-next-sandbox`, europe-west4.
Rollout `build-2026-09-14-001` : `SUCCEEDED`, trafic 100 %.
Deployment ID servi : `sv-mu10ek6e-5d8a5948339c`.

| Function, europe-west1 | Révision active |
| --- | --- |
| `readAdminSharedGen2` | `readadminsharedgen2-00003-juv` |
| `updateQuoteRequestAdminGen2` | `updatequoterequestadmingen2-00003-yil` |

Les deux cibles ont été mises à jour par `deploy-functions-targeted.mjs`,
avec manifeste/digest et archive source vérifiés. SHA-256 de l'archive :
`7cd377b49818cabbdd1f0a2f38267df804cb8d1ebbcb22640cd3d6e111c42f16`.

Le lecteur n'avait aucun accès Storage et pas de bucket explicite. Ajout de
`FIREBASE_CONFIG` et d'un binding conditionnel `roles/storage.objectViewer`
pour `admin-reader-runtime`, limité au préfixe
`projects/_/buckets/secondevienextjsssr.firebasestorage.app/objects/quote-requests/v1/`.
La condition est portée par le projet, le bucket utilisant des ACL ; aucun
changement du mode d'accès du bucket, de ses ACL ni des rules Firebase.
Ce mécanisme est pris en charge par [IAM Cloud Storage](https://docs.cloud.google.com/storage/docs/access-control/iam).
Les photos restent servies par le callable admin fort via le secours privé.

## Vérifications et limites

- Build Next sous Node 22 réussi, 55 pages ; quatre contrats de cache réussis.
- Dix tests devis/lecteur partagé supplémentaires réussis ; validations de
  construction précédentes : 33 tests et quatre scénarios UI locaux.
- `/`, `/admin`, `/devis` : HTTP 200 et même deployment ID ; admin no-store.
- Deux photos du dernier dossier : métadonnées lisibles avec l'identité réelle
  `admin-reader-runtime`, sans lecture de boîte mail ni modification du dossier.
- Deux callables : HTTP 401 sans authentification/App Check.
- Pas de recette admin complète avec session utilisateur, pas d'envoi réel,
  pas de suppression/restauration de données cloud. Ces actions restent à tester
  par l'utilisateur. Le test historique G6 sur le nombre d'exports reste ouvert.

## Retour arrière

Hosting précédent : `build-2026-09-13-008`.
Functions précédentes : `readadminsharedgen2-00002-vac` et
`updatequoterequestadmingen2-00002-wej`. Sources et configurations sauvegardées
localement dans `logs/devis-deploy-20260914/` avant mutation ; les archives
source proviennent de générations Storage explicitement identifiées.
Restaurer uniquement ces cibles en cas de besoin, en conservant les documents.
Le binding IAM ajouté est identifié par `admin-private-quote-photos` et peut
être retiré isolément. Aucun rollback n'a été exécuté lors de cette livraison.

## Simplification du chiffrage — seconde livraison

Demande utilisateur : interface épurée, « Modifier le devis », ajout depuis les
prestations du formulaire public, prix précis et message expliquant la révision.
Source : `0a02aa0`, construite depuis un worktree isolé ; les changements locaux
parallèles des fiches, images et panier ne sont pas inclus.

- Une action ouvre les prestations demandées ; chaque ligne conserve sa
  fourchette indicative et propose un seul montant manuel. Aucun prix médian
  n'est choisi automatiquement.
- Les six prestations publiques sont partagées avec l'éditeur admin ; les
  prestations déjà présentes sont exclues du sélecteur d'ajout.
- Le message accompagne le total dans la prévisualisation existante.
- Quinze tests ciblés et quatre scénarios Playwright ordinateur/mobile passent.
  ESLint sans erreur (deux avertissements image préexistants), build Node 22 et
  `git diff --check` réussis. Envoi simulé seulement, aucun e-mail réel envoyé.

App Hosting uniquement : `build-2026-09-14-003`, état `SUCCEEDED`, trafic 100 %.
Identifiant servi : `sv-mu1151al-d52c86310c39`. Vérification après publication :
`/`, `/admin`, `/devis` en HTTP 200, même identifiant, admin `private, no-store`.
Les Functions n'ont pas été redéployées lors de cette seconde livraison.
Révision précédente observée juste avant déploiement et disponible pour retour
arrière : `build-2026-09-14-002` (identifiant `sv-mu10lvuk-5fc4f71b41b1`).
