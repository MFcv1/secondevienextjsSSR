# Seconde Vie

Vitrine, boutique de meubles restaurés et demandes de restauration pour l'atelier
Seconde Vie. Le site public met les pièces et le savoir-faire en valeur ; le
back-office permet à la cliente de gérer son activité sans manipuler Firebase,
Stripe, des identifiants techniques ou des jetons.

## Ce que l'on construit

- Une galerie éditoriale et premium, rapide sur mobile comme sur ordinateur,
  avec catégories, recherche, fiches produit, favoris et panier.
- Un achat fiable : paiement, stock, livraison ou retrait, suivi de commande,
  documents, retours et remboursements cohérents entre client et administratrice.
- Un formulaire de restauration guidé, photos privées, estimation indicative
  et revue humaine dans le back-office.
- Un outil d'administration utile : publications, ventes, factures manuelles,
  devis, newsletter, statistiques et incidents compréhensibles.
- Des connexions Instagram/Facebook sans saisie manuelle de jetons ; toute
  publication sociale reste une action explicite.

La priorité actuelle est une **préproduction stable et présentable à la cliente**.
Le commerce fonctionne en sandbox avec Stripe test. Ce n'est pas une mise en
production : domaine, comptes live, e-mail final et validation juridique
restent des décisions distinctes.

## Comment faire évoluer le projet

Préserver le rendu et les parcours déjà travaillés. Corriger les problèmes
reproductibles avant d'ajouter des couches techniques. Mesurer la vitesse et les
coûts sur le parcours réel ; ne pas confondre cache chaud, temps serveur et
latence perçue. Les données manquantes doivent être annoncées, jamais maquillées
en zéro ou en succès.

Chaque changement doit répondre à un besoin concret, être petit autant que
possible, vérifiable et réversible. Ni refonte générique, ni migration de
fournisseur, ni audit sans fin par défaut. Les fonctionnalités futures — dont
l'aide IA aux devis — restent séparées des fonctionnalités réellement actives.
L'administratrice garde la validation des prix, travaux et réponses de devis.

Ces intentions synthétisent les décisions présentes dans le dépôt et la demande
de rangement du 4 septembre 2026 ; elles n'ajoutent pas de fonctionnalité au périmètre.

## Où lire

| Besoin | Document |
| --- | --- |
| Travailler dans le dépôt | [AGENTS.md](AGENTS.md) |
| Savoir ce qui existe et ce qui reste ouvert | [État du projet](_DOCS/ETAT_PROJET.md) |
| Trouver le code d'un parcours | [Carte technique](map.md) |
| Comprendre un contrat métier/technique | [Index des références](_DOCS/README.md) |
| Rejouer la recette autorisée | [Recette client/admin](_DOCS/quality/RECETTE_CLIENT_ADMIN.md) |
| Comprendre le rangement ou retrouver une ancienne note | [Inventaire et archives](doc/README.md) |

## Développement local

Baseline : Node 22.x, pnpm 11.7.0, Next.js 16.3 et React 19.2.
Les versions exécutables sont dans `package.json` et les lockfiles.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Les scripts passent par `scripts/with-env.mjs` et attendent l'environnement
sandbox local. Les valeurs sensibles ne se partagent pas dans le dépôt ou
le chat. Installation complète, Functions et opérations :
[EXPLOITATION.md](_DOCS/operations/EXPLOITATION.md).
Choisir les tests selon le changement, pas lancer toute la CI pour une note.

Le changement de modèle d'IA ne change ni l'architecture ni les autorisations.
La documentation décrit le produit, pas un comportement réservé à un modèle.
