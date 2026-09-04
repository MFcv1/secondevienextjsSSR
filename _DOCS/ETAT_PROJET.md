# État du projet

Revue documentaire : 2026-09-04. Propriétaire : équipe Seconde Vie.
Source : code du worktree, historique Git et preuves de livraison.
La revue documentaire initiale était sans contrôle cloud. La consolidation
sandbox du 4 septembre a ensuite été vérifiée ; versions, validations et limites
figurent dans [la livraison](operations/EXPLOITATION.md#consolidation-main-et-livraison-performance-du-2026-09-04).

Ce document est la synthèse de reprise. Les contrats restent dans les chapitres ;
les détails de chaque campagne restent dans son suivi. Un statut historique,
une date dépassée ou un fichier local ne suffisent pas à prouver une livraison.

## Socle et fonctionnalités

| Domaine | État documenté | Référence |
| --- | --- | --- |
| Public | App Router natif, serveur/SSG/ISR 300, galerie canonique `/` | [Architecture](architecture/NEXTJS_SEO.md) |
| Catalogue | `furniture` autoritaire, snapshot Storage unique, publication/revalidation événementielles | [Catalogue](catalogue/ANNONCES_CATALOGUE.md) |
| Auth/admin | OTP, Google et passkeys ; claim + registre + AAL2 ; stabilisation sandbox historique fermée | [Auth](security/AUTHENTIFICATION.md), [sécurité](security/SECURITE_GLOBALE.md) |
| Commerce | `PREPROD_TRANSACTIONAL_READY` ; ouverture durable sandbox `v2_all/v2` décidée le 25 août, dernière révision consignée 77 ; Stripe test, offline off | [Synthèse](commerce/COMMERCE_SYNTHESE.md) |
| Client | Commandes, documents sandbox, suivi/retours, wishlist, profil/adresse et avantages | [Espace client](client/ESPACE_CLIENT.md) |
| Back-office | Publication, commandes/retours, livraison, factures manuelles, devis, newsletter, Stats/Data/Performance/Incidents | [Back-office](admin/BACKOFFICE.md) |
| Galerie | Cartes produit en passe-partout blanc, badge Vendu dérivé du stock, `srcSet` élargi ; livré `build-2026-09-04-003` | [Livraison](operations/EXPLOITATION.md#refonte-des-cartes-galerie-du-2026-09-04), [maquette](../doc/archives/2026-09-04/design/README.md) |
| E-mail | Gmail de recette actif ; Resend préparé, non activé ; délivrabilité finale non acquise | [E-mails](email/EMAILS_TRANSACTIONNELS.md) |
| Meta | Rails Gen2 et rollback documentés ; OAuth historique prouvé, publication sociale réelle à requalifier sur contenu autorisé | [Runbook Meta](admin/INSTAGRAM_OAUTH_RUNBOOK.md) |
| Infra | App Hosting sandbox ; migration Gen2 réalisée avec trois exceptions Auth Gen1 ; clôture d'observation non prouvée | [ADR runtime](architecture/FUNCTIONS_RUNTIME_ADR.md) |
| Devis IA | Collecte/revue métier existantes ; analyse IA non implémentée | [Cadrage IA](ai/ASSISTANT_DEVIS.md) |
| Juridique | Brouillon non publiable sans validation | [CGV/retours](legal/CGV_RETOURS_DRAFT.md) |

## Travaux récents et preuves restantes

| Sujet | Ce que l'on sait | Ce qui n'est pas terminé |
| --- | --- | --- |
| Dashboard/Incidents événementiels | Projections, historique financier, compteur newsletter et badge Retours implémentés ; cutover sandbox consigné | Fenêtres longues, mesures segmentaires/coût et rollback final des gates encore ouvertes |
| Data temps réel P4/P5 | Bootstrap/shadow et lecteur sandbox qualifiés ; rollback App Hosting exercé ; flag dans `apphosting.yaml` | Mesures complètes à froid, p95 utilisateur et coûts/observation P6 |
| Sessions Data | Livré et qualifié le 4 septembre sur build-2026-09-04-001, maintenu dans la consolidation build-2026-09-04-002 ; Function 00009-jen ; dix cartes, pagination par dix, parcours écouté, présence 150 s, suppressions propagées ; preuves dans EXPLOITATION.md | p95 longue durée/Billing et exercice de rollback propre à cette extension non requalifiés |
| Performance Functions | Livré sur build-2026-09-04-002, même commit que main local/GitHub ; API protégée, IAM de lecture minimal et cache privé ; Chrome : 158 fonctions, fenêtres 24 h/7 j/30 j et recherche vérifiées | Pas de mesure Billing, p95 froid ou campagne multi-appareils ; fin du retrait physique des index non recontrôlée |
| CI et clôture locale | Build, lint, tests ciblés/Gen2/Emulator passent ; correction des deux assertions de sécurité obsolètes validée par audit statique et poussée sur `main` le 4 septembre | CI GitHub non verte ; sept avis de dépendances à traiter séparément, aucun seuil d'audit abaissé |
| Recette humaine HRT | HRT-004 badge, HRT-006 fuseau et HRT-008 exclusion marqués fermés sandbox | HRT-001 observation ; HRT-002 course checkout, HRT-003 refund live UI, HRT-005 connexion admin à requalifier ; HRT-007 à mesurer |
| Navigation/Auth | Correctifs vidéo/login des 2 septembre dans Git ; le code local ne force plus une redirection vers admin après connexion publique | La preuve humaine HRT-005 reste distincte du constat de code |
| Maintenance catalogue | Backend de rollback/reconstruction conservé, mais onglet et appelants UI retirés | L'ancienne procédure par bouton n'est plus applicable ; aucun nouveau parcours opérateur n'a été implémenté dans ce rangement |

Les anciens blocs « overview_bundle actif », « admin automatiquement redirigé »
ou « Gen1 conservées » peuvent décrire une étape de migration, pas le comportement
actuel. Les chapitres et la carte ont été corrigés là où ces contradictions
affectaient l'entrée de lecture.

## Suivis encore ouverts

- [Temps réel/coûts/DevOps](infra/TEMPS_REEL_COUTS_DEVOPS.md) :
  P5 partiel, P6 restant ; revue cible 30 septembre.
- [Dashboard/Incidents](admin/OPTIMISATION_DASHBOARD_INCIDENTS.md) :
  `SANDBOX_CUTOVER_EFFECTUE_QUIET_WINDOW_A_FERMER`.
- [Recette humaine](quality/RECETTE_HUMAINE_SANDBOX.md) :
  corrections déployées, requalification partielle ; revue cible 10 septembre.
- [Finalisation Gen2](../apphostingaudit/FINALISATION_MIGRATION_GEN2.md) :
  F5 terminé, F6 non marqué complet dans les preuves. Échéance du 1er septembre
  dépassée ; revalider la fenêtre et la topologie exactes, ne pas annoncer un soak
  courant de sept jours à partir d'une ancienne fenêtre.
- [Reprise commerce](commerce/COMMERCE_REPRISE.md) :
  décisions/recettes restantes ; aucune autorisation de production implicite.
- [Anomalies](../anomalies.md) : registre historique avec points à requalifier ;
  lire le détail et sa dernière preuve, pas seulement sa table ancienne.

Une échéance dépassée est un signal de revue, pas une clôture automatique.
Les plans Meta et sécurité ont été remplacés par leurs références durables et
archivés sans affirmer que toutes les recettes externes ou la production sont closes.

## Ce qui reste volontairement différé

Domaine et DNS, RP ID final/réenrôlement passkeys, Resend/SPF/DKIM/DMARC,
projet Firebase/App Hosting production, Stripe/Connect live, App Check production,
recette finale appareils/Safari/Face ID, mesures et exploitation production,
validation juridique/comptable. Les protections et recettes sandbox déjà
autorisées ont leurs propres conditions ; aucune preuve sandbox ne vaut GO live.

Dette non bloquante : budget CSS/JS public, convergence régionale, pagination
selon volumes, nettoyage de médias après preuve, Cache Components/Partial
Prefetching, gestion des passkeys client et assistant IA devis.

## Maintenir cette synthèse

Mettre à jour seulement lors d'un changement de statut significatif. Indiquer
la date, le périmètre, la preuve et ce qui manque. Garder SHA/release et
métriques détaillés dans la référence d'exploitation concernée, avec leur date.
Ne pas transformer ce fichier en journal de chaque commande.
