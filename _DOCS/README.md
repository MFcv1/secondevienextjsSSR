# Bibliotheque canonique - Seconde Vie Next

Derniere consolidation: 2026-07-15
Statut: `REFERENCE_ACTIVE`

## Role

Ce dossier est le livre technique du projet. `AGENTS.md` en est le sommaire operationnel, `map.md` la cartographie precise et les fichiers ci-dessous les chapitres de reference.

Une information structurante ne doit avoir qu'une seule reference active. Les anciens audits, roadmaps et closeouts datés ont ete absorbes dans ces chapitres puis retires du disque de travail. Leur detail reste consultable dans l'historique Git.

## Chapitres

| Domaine | Reference canonique | Contenu |
| --- | --- | --- |
| Architecture et SEO | [NEXTJS_SEO.md](architecture/NEXTJS_SEO.md) | App Router, rendu, cache, metadata, indexation, revalidation |
| Catalogue et annonces | [ANNONCES_CATALOGUE.md](catalogue/ANNONCES_CATALOGUE.md) | modele produit, categories, publication, recherche, cycle de vie |
| Interface et navigation | [INTERFACE_NAVIGATION.md](ux/INTERFACE_NAVIGATION.md) | header, mega menu, mobile, transitions, accessibilite UX |
| Images et medias | [IMAGES_MEDIA.md](images/IMAGES_MEDIA.md) | Storage, variantes, metadata, affichage, backfills |
| Authentification | [AUTHENTIFICATION.md](security/AUTHENTIFICATION.md) | OTP, Google, passkeys, session, step-up admin, reprise production |
| Securite globale | [SECURITE_GLOBALE.md](security/SECURITE_GLOBALE.md) | frontieres de confiance, rules, App Check, secrets, risques |
| Espace client | [ESPACE_CLIENT.md](client/ESPACE_CLIENT.md) | compte, commandes, factures, wishlist, adresse, support |
| Commerce et Stripe | [COMMERCE_STRIPE.md](commerce/COMMERCE_STRIPE.md) | panier, checkout, paiements, webhooks, remboursements, Connect |
| Back-office | [BACKOFFICE.md](admin/BACKOFFICE.md) | onglets, droits, publication, ventes, maintenance, analytics |
| Infrastructure | [INFRASTRUCTURE.md](infra/INFRASTRUCTURE.md) | Firebase, App Hosting, regions, environnements, production |
| Performance | [PERFORMANCE.md](perf/PERFORMANCE.md) | budgets, invariants, mesures et dettes restantes |
| Donnees et analytics | [DONNEES_ANALYTICS.md](data/DONNEES_ANALYTICS.md) | collections, rollups, retention, migration et fiabilite |
| Exploitation | [EXPLOITATION.md](operations/EXPLOITATION.md) | commandes, deploiement, rollback, incidents et backlog controle |
| Qualite et tests | [QUALITE_TESTS.md](quality/QUALITE_TESTS.md) | CI, gates, tests cibles, matrice de validation |
| Assistant devis IA | [ASSISTANT_DEVIS.md](ai/ASSISTANT_DEVIS.md) | cadrage MVP non implemente, garde-fous et conditions de reprise |
| Legal | [CGV_RETOURS_DRAFT.md](legal/CGV_RETOURS_DRAFT.md) | brouillon metier a faire valider par un professionnel du droit |

Specification rattachee demandee explicitement pour le domaine donnees: [ARCHITECTURE_ANALYTICS.md](data/ARCHITECTURE_ANALYTICS.md). `DONNEES_ANALYTICS.md` reste le chapitre canonique de l'etat reel; cette specification fixe le contrat, l'implementation V3 codee, les budgets et les gates restant avant preproduction.

## Niveaux de statut

- `REFERENCE_ACTIVE`: verite actuelle, a maintenir avec le code.
- `PREPROD_READY`: implemente et acceptable pour la demonstration, avec conditions de production explicites.
- `PRODUCTION_DEFERRED`: volontairement reporte jusqu'au domaine, aux comptes live ou a une decision metier.
- `CONCEPTION`: specification conservee mais fonctionnalite non implementee.
- `DEBT`: dette connue, non bloquante tant que sa condition de reprise n'est pas atteinte.

## Regle d'archivage

Git est l'archive. Ne pas recreer un dossier d'anciens rapports dans `_DOCS`.

Avant de supprimer ou remplacer une reference canonique:

1. prouver qu'elle est obsolette ou que tout son contenu utile a ete fusionne;
2. rechercher ses liens avec `rg`;
3. mettre a jour `AGENTS.md`, `map.md` et ce sommaire;
4. verifier `git diff --check` et les liens locaux;
5. mentionner clairement les suppressions dans le compte rendu.

## Ordre de lecture recommande

1. [AGENTS.md](../AGENTS.md) pour les regles et l'etat courant;
2. [map.md](../map.md) pour localiser routes, modules, donnees et Functions;
3. le chapitre du domaine touche;
4. `quality/QUALITE_TESTS.md` pour choisir la validation;
5. `operations/EXPLOITATION.md` si le travail touche un deploiement, des donnees ou un secret.
