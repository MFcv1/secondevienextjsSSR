# Documentation de Seconde Vie

Révision : 2026-09-04. Propriétaire : équipe Seconde Vie.
Ouvrir le chapitre du sujet traité, pas toute cette bibliothèque.

- [Projet et intentions](../README.md)
- [Consignes agents](../AGENTS.md)
- [État des fonctionnalités et suivis ouverts](ETAT_PROJET.md)
- [Carte des points d'entrée](../map.md)

## Références durables

| Sujet | Référence | À lire pour |
| --- | --- | --- |
| Next/SEO | [NEXTJS_SEO.md](architecture/NEXTJS_SEO.md) | Rendu, routes, cache, indexation |
| Functions | [FUNCTIONS_RUNTIME_ADR.md](architecture/FUNCTIONS_RUNTIME_ADR.md) | Générations, exceptions, runtime et capacité |
| Catalogue | [ANNONCES_CATALOGUE.md](catalogue/ANNONCES_CATALOGUE.md) | Produit, publication, snapshot, recherche |
| Interface | [INTERFACE_NAVIGATION.md](ux/INTERFACE_NAVIGATION.md) | Navigation, mobile, focus et transitions |
| Médias | [IMAGES_MEDIA.md](images/IMAGES_MEDIA.md) | Variantes, upload, Storage et nettoyage |
| Auth | [AUTHENTIFICATION.md](security/AUTHENTIFICATION.md) | OTP, Google, passkeys et session |
| Sécurité | [SECURITE_GLOBALE.md](security/SECURITE_GLOBALE.md) | Autorisations, rules, secrets et limites |
| Client | [ESPACE_CLIENT.md](client/ESPACE_CLIENT.md) | Commandes, documents, favoris et profil |
| Commerce | [COMMERCE_SYNTHESE.md](commerce/COMMERCE_SYNTHESE.md) | Contrats et qualification ; détail dans [COMMERCE_STRIPE.md](commerce/COMMERCE_STRIPE.md) |
| Back-office | [BACKOFFICE.md](admin/BACKOFFICE.md) | Vues admin, factures, devis, Stats/Data/Performance |
| Meta | [INSTAGRAM_OAUTH_RUNBOOK.md](admin/INSTAGRAM_OAUTH_RUNBOOK.md) | Connexion, saga, configuration et recette sociale |
| E-mails | [EMAILS_TRANSACTIONNELS.md](email/EMAILS_TRANSACTIONNELS.md) | Templates, destinataires, outbox et transport |
| Données | [DONNEES_ANALYTICS.md](data/DONNEES_ANALYTICS.md) | Collections, analytics, rétention et indexes |
| Coûts | [AUDIT_COUTS_FIRESTORE.md](data/AUDIT_COUTS_FIRESTORE.md) | Méthode de mesure et baseline **historique**, pas facture actuelle |
| Infrastructure | [INFRASTRUCTURE.md](infra/INFRASTRUCTURE.md) | Environnements, configuration et déploiement |
| Cache de livraison | [DEPLOIEMENT_CACHE_CLIENT.md](infra/DEPLOIEMENT_CACHE_CLIENT.md) | Deployment ID, ISR/CDN et rollback |
| Exploitation | [EXPLOITATION.md](operations/EXPLOITATION.md) | Installation, commandes, incidents et rollback |
| Tests | [QUALITE_TESTS.md](quality/QUALITE_TESTS.md) | Choix des validations et CI |
| Recette humaine | [RECETTE_CLIENT_ADMIN.md](quality/RECETTE_CLIENT_ADMIN.md) | Procédure client/admin et M01–M13, sans correction |
| IA devis | [ASSISTANT_DEVIS.md](ai/ASSISTANT_DEVIS.md) | Collecte active, analyse IA future |
| Juridique | [CGV_RETOURS_DRAFT.md](legal/CGV_RETOURS_DRAFT.md) | Brouillon à valider, non publiable |

## Suivis à consulter uniquement pour leur chantier

Le statut synthétique et les échéances sont maintenus dans [ETAT_PROJET.md](ETAT_PROJET.md).
Les fichiers ci-dessous portent les preuves et conditions de fermeture :

- [TEMPS_REEL_COUTS_DEVOPS.md](infra/TEMPS_REEL_COUTS_DEVOPS.md)
- [OPTIMISATION_DASHBOARD_INCIDENTS.md](admin/OPTIMISATION_DASHBOARD_INCIDENTS.md)
- [RECETTE_HUMAINE_SANDBOX.md](quality/RECETTE_HUMAINE_SANDBOX.md)
- [COMMERCE_REPRISE.md](commerce/COMMERCE_REPRISE.md)
- [FINALISATION_MIGRATION_GEN2.md](../apphostingaudit/FINALISATION_MIGRATION_GEN2.md)
- [anomalies.md](../anomalies.md)

[apphostingaudit/README.md](../apphostingaudit/README.md) indexe les preuves
d'infrastructure, dont des photographies anciennes. Ce n'est pas un deuxième
état courant du projet.

## Règles de maintenance

Un contrat → un chapitre. Une décision produit globale → README.
Un statut de chantier → ETAT_PROJET. Un point d'entrée de code → map.
Les mesures datées ne se réécrivent pas comme des vérités actuelles.

Conserver les détails longs s'ils servent à diagnostiquer ou exploiter ;
privilégier des titres précis et une lecture par section. Ne pas recopier des
listes d'exports ou chaque rollout dans les documents d'accueil.
`PREPROD_READY` ou `PREPROD_TRANSACTIONAL_READY` ne vaut jamais GO production.

Un plan n'est archivé qu'après transfert des décisions utiles et des points
encore ouverts. Lire le candidat entièrement, vérifier Git et les références,
corriger les liens et annoncer son déplacement. Les archives demandées le
4 septembre sont dans [doc/archives](../doc/archives/README.md), hors parcours
normal ; `.ignore` les exclut de `rg`, sans les supprimer de Git ni les rendre
inaccessibles. [Inventaire et méthode](../doc/README.md).
