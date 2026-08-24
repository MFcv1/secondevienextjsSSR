# Bibliotheque canonique - Seconde Vie Next

Derniere consolidation: 2026-08-24
Statut: `REFERENCE_ACTIVE`

## Role

Ce dossier est le livre technique du projet. `AGENTS.md` en est le sommaire operationnel, `map.md` la cartographie precise et les fichiers ci-dessous les chapitres de reference.

Une information structurante ne doit avoir qu'une seule reference active. Les anciens audits, roadmaps et closeouts datés ont ete absorbes dans ces chapitres puis retires du disque de travail. Leur detail reste consultable dans l'historique Git.

## Chapitres

| Domaine | Reference canonique | Contenu |
| --- | --- | --- |
| Architecture et SEO | [NEXTJS_SEO.md](architecture/NEXTJS_SEO.md) | App Router, rendu, cache, metadata, indexation, revalidation |
| Runtime Firebase Functions | [FUNCTIONS_RUNTIME_ADR.md](architecture/FUNCTIONS_RUNTIME_ADR.md) | architecture post-Gen2, exceptions Auth, capacite, rollback et horizon Node |
| Catalogue et annonces | [ANNONCES_CATALOGUE.md](catalogue/ANNONCES_CATALOGUE.md) | modele produit, categories, publication, recherche, cycle de vie |
| Interface et navigation | [INTERFACE_NAVIGATION.md](ux/INTERFACE_NAVIGATION.md) | header, mega menu, mobile, transitions, accessibilite UX |
| Images et medias | [IMAGES_MEDIA.md](images/IMAGES_MEDIA.md) | Storage, variantes, metadata, affichage, backfills |
| Authentification | [AUTHENTIFICATION.md](security/AUTHENTIFICATION.md) | OTP, Google, passkeys, session, step-up admin, reprise production |
| E-mails transactionnels | [EMAILS_TRANSACTIONNELS.md](email/EMAILS_TRANSACTIONNELS.md) | galerie, OTP, paiement, cycle de commande, remboursements, transport et captures |
| Securite globale | [SECURITE_GLOBALE.md](security/SECURITE_GLOBALE.md) | frontieres de confiance, rules, App Check, secrets, risques |
| Espace client | [ESPACE_CLIENT.md](client/ESPACE_CLIENT.md) | compte, commandes, documents provisoires, wishlist, adresse, support |
| Commerce - synthese | [COMMERCE_SYNTHESE.md](commerce/COMMERCE_SYNTHESE.md) | point d'entree unique: statut, Gates, preuves, limites et liens |
| Commerce et Stripe - detail | [COMMERCE_STRIPE.md](commerce/COMMERCE_STRIPE.md) | panier, checkout, paiements, webhooks, remboursements, Connect |
| Back-office | [BACKOFFICE.md](admin/BACKOFFICE.md) | onglets, droits, publication, ventes, maintenance, analytics |
| OAuth Instagram/Facebook | [INSTAGRAM_OAUTH_RUNBOOK.md](admin/INSTAGRAM_OAUTH_RUNBOOK.md) | configuration Meta/Firebase, roles testeurs, flux, deploiement, recette et incidents |
| Infrastructure | [INFRASTRUCTURE.md](infra/INFRASTRUCTURE.md) | Firebase, App Hosting, regions, environnements, production |
| Deploiement et cache client | [DEPLOIEMENT_CACHE_CLIENT.md](infra/DEPLOIEMENT_CACHE_CLIENT.md) | identite des builds, version skew, cache CDN ISR, rollback |
| Donnees et analytics | [DONNEES_ANALYTICS.md](data/DONNEES_ANALYTICS.md) | collections, rollups, retention, migration et fiabilite |
| Audit couts Firestore | [AUDIT_COUTS_FIRESTORE.md](data/AUDIT_COUTS_FIRESTORE.md) | mesures Usage/Query Insights, attribution des lectures et protocole avant/apres |
| Exploitation | [EXPLOITATION.md](operations/EXPLOITATION.md) | commandes, deploiement, rollback, incidents et backlog controle |
| Qualite et tests | [QUALITE_TESTS.md](quality/QUALITE_TESTS.md) | CI, gates, tests cibles, matrice de validation |
| Assistant devis IA | [ASSISTANT_DEVIS.md](ai/ASSISTANT_DEVIS.md) | cadrage MVP non implemente, garde-fous et conditions de reprise |
| Legal | [CGV_RETOURS_DRAFT.md](legal/CGV_RETOURS_DRAFT.md) | brouillon metier a faire valider par un professionnel du droit |

## Plan temporaire actif

| Perimetre | Document | Statut | Echeance et cloture |
| --- | --- | --- | --- |
| stabilisation securite sandbox | [STABILISATION_SECURITE_SANDBOX.md](security/STABILISATION_SECURITE_SANDBOX.md) | `SANDBOX_SECURITY_STABILIZED`, Gates S0-S4 fermees; production explicitement differee | conserver jusqu'a la fusion de la PR #5, puis verifier la fusion canonique et supprimer |
| publication Meta sans friction | [META_OAUTH_PUBLICATION_PRD.md](admin/META_OAUTH_PUBLICATION_PRD.md) | `IMPLEMENTATION_LOCALE_M1_M3`, OAuth/saga/UI codes, configuration sandbox non lancee | Gates M4-M6, revue au plus tard le 2026-10-31, fusion admin/infra/securite/qualite/carte puis suppression |
| reprise commerce post-Gate 8 | [COMMERCE_REPRISE.md](commerce/COMMERCE_REPRISE.md) | `PLAN_REPRISE_DIFFERE`, R0 documentaire termine, R1 UX suivant | revue au plus tard le 2026-10-31, fusion canonique puis suppression avec `TODO.md` |
| resilience checkout et console incidents | [RESILIENCE_CHECKOUT_INCIDENTS.md](commerce/RESILIENCE_CHECKOUT_INCIDENTS.md) | `PLAN_TEMPORAIRE_EXECUTION`, Gate D0 documentaire; fault injection non commencee | revue au plus tard le 2026-10-31, fusion commerce/admin/data/securite/qualite/exploitation puis suppression |
| recette reelle e-mails Luna | [RECETTE_EMAILS_LUNA.md](email/RECETTE_EMAILS_LUNA.md) | `PLAN_TEMPORAIRE_EXECUTION`, Luna teste et documente sans corriger | execution avant le 2026-08-06, fusion dans les chapitres e-mail/commerce puis suppression |
| skill client/admin autonome | [.agents/skills/client-admin-test/SKILL.md](../.agents/skills/client-admin-test/SKILL.md) | `LANCEUR_TEMPORAIRE_ACTIF`, execution par l'agent du chat, invocation `$client-admin-test` sans prompt a recopier; guide [TEST_CLIENT_ADMIN_LUNA.md](../TEST_CLIENT_ADMIN_LUNA.md) | fusion avec la recette e-mail puis suppression avant le 2026-08-06 |

## Niveaux de statut

- `REFERENCE_ACTIVE`: verite actuelle, a maintenir avec le code.
- `PREPROD_READY`: implemente et acceptable pour la demonstration, avec conditions de production explicites.
- `PREPROD_TRANSACTIONAL_READY`: noyau transactionnel qualifie sur sandbox et
  fixtures, sans autoriser une activation publique ou live.
- `PRODUCTION_DEFERRED`: volontairement reporte jusqu'au domaine, aux comptes live ou a une decision metier.
- `CONCEPTION`: specification conservee mais fonctionnalite non implementee.
- `DEBT`: dette connue, non bloquante tant que sa condition de reprise n'est pas atteinte.
- `STABILISATION_ACTIVE`: fonctionnalite codee mais non qualifiee sur son perimetre critique.
- `PLAN_TEMPORAIRE_EXECUTION`: audit/plan explicitement demande, avec echeance et suppression obligatoire a la cloture.

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
