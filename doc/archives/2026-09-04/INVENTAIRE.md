# Inventaire Markdown avant rangement

Photographie locale du 2026-09-04. Propriétaire : équipe Seconde Vie.
Inventaire clos de cette passe, pas fichier à recharger dans une tâche ordinaire.
[Résultat et méthode](../../README.md) · [Archives et relais](../README.md).

Périmètre : chemins `.md` du projet, y compris `.agents/`, hors dépendances,
builds, caches et résultats générés. 270 fichiers utiles à classer ; un rapport
ignoré supplémentaire identifié sans lecture de contenu. Les lignes et SHA-256
sont ceux de l'inventaire initial, pas nécessairement les valeurs actuelles.
Le worktree était déjà modifié et contenait des travaux récents non commités.

Méthode : inventaire et volumétrie exhaustifs ; lecture complète des candidats
archivés ; confrontation des entrées et contradictions au code, à Git et aux
preuves du domaine ; analyse structurelle des bibliothèques de skills.
Ce tableau n'atteste pas une validation métier ligne par ligne de toutes les
références design ni une requalification cloud.

## Documents projet

| Chemin initial | Lignes | Décision |
| --- | ---: | --- |
| [AGENTS.md](AGENTS-avant-rangement.md) | 613 | Remplacé : règles conservées, journal et état mouvant sortis du fichier automatique. |
| [TEST_CLIENT_ADMIN_LUNA.md](TEST_CLIENT_ADMIN_LUNA.md) | 77 | Remplacé : lanceur lié à un modèle ; procédure unique et skill conservés. |
| [TEST_COMMERCE_SANDBOX.md](TEST_COMMERCE_SANDBOX.md) | 433 | Remplacé : ancienne fenêtre commerce et lanceur de recette devenus trompeurs. |
| [TODO.md](TODO.md) | 62 | Fusionné : doublon du suivi commerce ; décisions ouvertes conservées. |
| [_DOCS/README.md](../../../_DOCS/README.md) | 80 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/admin/BACKOFFICE.md](../../../_DOCS/admin/BACKOFFICE.md) | 1143 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/admin/INSTAGRAM_OAUTH_RUNBOOK.md](../../../_DOCS/admin/INSTAGRAM_OAUTH_RUNBOOK.md) | 534 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md](_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md) | 637 | Fusionné : conception dans le runbook ; publication réelle reste à requalifier. |
| [_DOCS/admin/OPTIMISATION_DASHBOARD_INCIDENTS.md](../../../_DOCS/admin/OPTIMISATION_DASHBOARD_INCIDENTS.md) | 1533 | Conservé actif : preuves/gates ouvertes, lecture ciblée. |
| [_DOCS/ai/ASSISTANT_DEVIS.md](../../../_DOCS/ai/ASSISTANT_DEVIS.md) | 198 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md](../../../_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md) | 162 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/architecture/NEXTJS_SEO.md](../../../_DOCS/architecture/NEXTJS_SEO.md) | 175 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/catalogue/ANNONCES_CATALOGUE.md](../../../_DOCS/catalogue/ANNONCES_CATALOGUE.md) | 390 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/client/ESPACE_CLIENT.md](../../../_DOCS/client/ESPACE_CLIENT.md) | 389 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/commerce/COMMERCE_REPRISE.md](_DOCS/commerce/COMMERCE_REPRISE.md) | 411 | Remplacé : décisions ouvertes et gates conservées sans anciens scripts opérateur. |
| [_DOCS/commerce/COMMERCE_STRIPE.md](../../../_DOCS/commerce/COMMERCE_STRIPE.md) | 742 | Maintenu : ancienne fermeture sandbox distinguée du contrôle durable. |
| [_DOCS/commerce/COMMERCE_SYNTHESE.md](_DOCS/commerce/COMMERCE_SYNTHESE.md) | 372 | Remplacé : synthèse contractuelle courte, état sandbox durable corrigé. |
| [_DOCS/data/AUDIT_COUTS_FIRESTORE.md](../../../_DOCS/data/AUDIT_COUTS_FIRESTORE.md) | 590 | Conservé : méthode ou preuve historique encore référencée. |
| [_DOCS/data/DONNEES_ANALYTICS.md](../../../_DOCS/data/DONNEES_ANALYTICS.md) | 636 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/email/EMAILS_TRANSACTIONNELS.md](../../../_DOCS/email/EMAILS_TRANSACTIONNELS.md) | 494 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/email/RECETTE_EMAILS_LUNA.md](_DOCS/email/RECETTE_EMAILS_LUNA.md) | 701 | Remplacé : matrice M01–M13 et règles utiles transférées dans la recette unique. |
| [_DOCS/images/IMAGES_MEDIA.md](../../../_DOCS/images/IMAGES_MEDIA.md) | 200 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/infra/DEPLOIEMENT_CACHE_CLIENT.md](../../../_DOCS/infra/DEPLOIEMENT_CACHE_CLIENT.md) | 173 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/infra/INFRASTRUCTURE.md](../../../_DOCS/infra/INFRASTRUCTURE.md) | 878 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/infra/TEMPS_REEL_COUTS_DEVOPS.md](../../../_DOCS/infra/TEMPS_REEL_COUTS_DEVOPS.md) | 398 | Conservé actif : preuves/gates ouvertes, lecture ciblée. |
| [_DOCS/legal/CGV_RETOURS_DRAFT.md](../../../_DOCS/legal/CGV_RETOURS_DRAFT.md) | 137 | Conservé : contrat canonique utile, hors lecture systématique. |
| [_DOCS/operations/EXPLOITATION.md](../../../_DOCS/operations/EXPLOITATION.md) | 824 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/quality/QUALITE_TESTS.md](../../../_DOCS/quality/QUALITE_TESTS.md) | 815 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/quality/RECETTE_HUMAINE_SANDBOX.md](../../../_DOCS/quality/RECETTE_HUMAINE_SANDBOX.md) | 294 | Conservé actif : preuves/gates ouvertes, lecture ciblée. |
| [_DOCS/security/AUTHENTIFICATION.md](../../../_DOCS/security/AUTHENTIFICATION.md) | 790 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/security/SECURITE_GLOBALE.md](../../../_DOCS/security/SECURITE_GLOBALE.md) | 445 | Maintenu et corrigé dans son domaine ; pas de doublon créé. |
| [_DOCS/security/STABILISATION_SECURITE_SANDBOX.md](_DOCS/security/STABILISATION_SECURITE_SANDBOX.md) | 312 | Fusionné : preuve sandbox historique, sans extrapolation à la production. |
| [_DOCS/ux/INTERFACE_NAVIGATION.md](../../../_DOCS/ux/INTERFACE_NAVIGATION.md) | 203 | Conservé : contrat canonique utile, hors lecture systématique. |
| [anomalies.md](../../../anomalies.md) | 2324 | Conservé actif : preuves/gates ouvertes, lecture ciblée. |
| [apphostingaudit/AUDIT_ARCHITECTURE_APP_HOSTING.md](../../../apphostingaudit/AUDIT_ARCHITECTURE_APP_HOSTING.md) | 816 | Conservé : méthode ou preuve historique encore référencée. |
| [apphostingaudit/FINALISATION_MIGRATION_GEN2.md](../../../apphostingaudit/FINALISATION_MIGRATION_GEN2.md) | 224 | Conservé actif : preuves/gates ouvertes, lecture ciblée. |
| [apphostingaudit/README.md](../../../apphostingaudit/README.md) | 486 | Conservé : méthode ou preuve historique encore référencée. |
| [apphostingaudit/runbooks/G1_OPERATIONS.md](../../../apphostingaudit/runbooks/G1_OPERATIONS.md) | 270 | Conservé : méthode ou preuve historique encore référencée. |
| [audit/2026-08-09_AUDIT_CHATGPT_ULTRA.md](audit/2026-08-09_AUDIT_CHATGPT_ULTRA.md) | 104 | Obsolète comme état courant : photographie de modèle/runtime et de limites anciennes. |
| [facture.md](facture.md) | 243 | Fusionné : cahier de conception factures ; contrat actif dans le back-office. |
| [jean.md](jean.md) | 12 | Fusionné : note brute de besoin back-office intégrée aux contrats existants. |
| [map.md](map.md) | 1566 | Remplacé : carte des points d'entrée, sans historique de chaque déploiement. |

## Skills de projet — inventaire exhaustif

Aucun doublon de contenu byte-à-byte repéré. Les styles proches ne sont pas
des fichiers obsolètes par définition. Les descriptions constituent la surface
de découverte ; les instructions/références ne sont à lire que si pertinentes.
Seul `client-admin-test` a été réécrit ; les autres fichiers sont conservés.

| Chemin | Lignes | Octets | Décision |
| --- | ---: | ---: | --- |
| [.agents/skills/clean-saas/SKILL.md](../../../.agents/skills/clean-saas/SKILL.md) | 746 | 44350 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/design-use-cases.md](../../../.agents/skills/clean-saas/references/design-use-cases.md) | 67 | 3194 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/lastskill.md](../../../.agents/skills/clean-saas/references/lastskill.md) | 716 | 40149 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/refero-style-database.md](../../../.agents/skills/clean-saas/references/refero-style-database.md) | 1141 | 86125 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/sources/01-autosend.md](../../../.agents/skills/clean-saas/references/sources/01-autosend.md) | 125 | 8518 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/sources/02-fresha.md](../../../.agents/skills/clean-saas/references/sources/02-fresha.md) | 83 | 6986 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/sources/03-workable.md](../../../.agents/skills/clean-saas/references/sources/03-workable.md) | 98 | 6789 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/sources/04-all-in-one-salon.md](../../../.agents/skills/clean-saas/references/sources/04-all-in-one-salon.md) | 94 | 21434 | Bibliothèque spécialisée conservée. |
| [.agents/skills/clean-saas/references/sources/05-slack.md](../../../.agents/skills/clean-saas/references/sources/05-slack.md) | 101 | 19178 | Bibliothèque spécialisée conservée. |
| [.agents/skills/client-admin-test/SKILL.md](../../../.agents/skills/client-admin-test/SKILL.md) | 171 | 14362 | Simplifié, procédure dédupliquée. |
| [.agents/skills/cyber-neon/SKILL.md](../../../.agents/skills/cyber-neon/SKILL.md) | 917 | 42239 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/design-use-cases.md](../../../.agents/skills/cyber-neon/references/design-use-cases.md) | 66 | 3030 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/lastskill.md](../../../.agents/skills/cyber-neon/references/lastskill.md) | 892 | 39678 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/refero-style-database.md](../../../.agents/skills/cyber-neon/references/refero-style-database.md) | 2423 | 64895 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/sources/01-chainzoku.md](../../../.agents/skills/cyber-neon/references/sources/01-chainzoku.md) | 123 | 5118 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/sources/02-sbs-town.md](../../../.agents/skills/cyber-neon/references/sources/02-sbs-town.md) | 88 | 3810 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/sources/03-neon.md](../../../.agents/skills/cyber-neon/references/sources/03-neon.md) | 121 | 5015 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/sources/04-jetbrains.md](../../../.agents/skills/cyber-neon/references/sources/04-jetbrains.md) | 150 | 7970 | Bibliothèque spécialisée conservée. |
| [.agents/skills/cyber-neon/references/sources/05-off-white.md](../../../.agents/skills/cyber-neon/references/sources/05-off-white.md) | 107 | 4770 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/SKILL.md](../../../.agents/skills/dark-ui/SKILL.md) | 925 | 42237 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/design-use-cases.md](../../../.agents/skills/dark-ui/references/design-use-cases.md) | 66 | 2806 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/lastskill.md](../../../.agents/skills/dark-ui/references/lastskill.md) | 900 | 39550 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/refero-style-database.md](../../../.agents/skills/dark-ui/references/refero-style-database.md) | 2546 | 65511 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/sources/01-beehiiv.md](../../../.agents/skills/dark-ui/references/sources/01-beehiiv.md) | 77 | 2958 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/sources/02-fey.md](../../../.agents/skills/dark-ui/references/sources/02-fey.md) | 98 | 4264 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/sources/03-bun.md](../../../.agents/skills/dark-ui/references/sources/03-bun.md) | 123 | 5284 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/sources/04-circle.md](../../../.agents/skills/dark-ui/references/sources/04-circle.md) | 120 | 5035 | Bibliothèque spécialisée conservée. |
| [.agents/skills/dark-ui/references/sources/05-superwhisper.md](../../../.agents/skills/dark-ui/references/sources/05-superwhisper.md) | 134 | 6160 | Bibliothèque spécialisée conservée. |
| [.agents/skills/design-taste-frontend/SKILL.md](../../../.agents/skills/design-taste-frontend/SKILL.md) | 226 | 21140 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/SKILL.md](../../../.agents/skills/editorial-minimal/SKILL.md) | 1022 | 41213 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/advanced-implementation-notes.md](../../../.agents/skills/editorial-minimal/references/advanced-implementation-notes.md) | 108 | 2650 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/design-use-cases.md](../../../.agents/skills/editorial-minimal/references/design-use-cases.md) | 66 | 2815 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/lastskill.md](../../../.agents/skills/editorial-minimal/references/lastskill.md) | 988 | 37798 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/refero-style-database.md](../../../.agents/skills/editorial-minimal/references/refero-style-database.md) | 3029 | 65422 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/sources/01-openai.md](../../../.agents/skills/editorial-minimal/references/sources/01-openai.md) | 103 | 3384 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/sources/02-anthropic.md](../../../.agents/skills/editorial-minimal/references/sources/02-anthropic.md) | 105 | 3600 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/sources/03-legend.md](../../../.agents/skills/editorial-minimal/references/sources/03-legend.md) | 103 | 3353 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/sources/04-intercom.md](../../../.agents/skills/editorial-minimal/references/sources/04-intercom.md) | 106 | 3535 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-minimal/references/sources/05-limitless.md](../../../.agents/skills/editorial-minimal/references/sources/05-limitless.md) | 98 | 3033 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/SKILL.md](../../../.agents/skills/editorial-type/SKILL.md) | 1087 | 40996 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/design-use-cases.md](../../../.agents/skills/editorial-type/references/design-use-cases.md) | 66 | 2904 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/lastskill.md](../../../.agents/skills/editorial-type/references/lastskill.md) | 1053 | 38052 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/refero-style-database.md](../../../.agents/skills/editorial-type/references/refero-style-database.md) | 1270 | 61434 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/sources/01-volume.md](../../../.agents/skills/editorial-type/references/sources/01-volume.md) | 84 | 6946 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/sources/02-victor-cango.md](../../../.agents/skills/editorial-type/references/sources/02-victor-cango.md) | 83 | 5765 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/sources/03-no-ideas.md](../../../.agents/skills/editorial-type/references/sources/03-no-ideas.md) | 81 | 5257 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/sources/04-sociotype.md](../../../.agents/skills/editorial-type/references/sources/04-sociotype.md) | 130 | 7209 | Bibliothèque spécialisée conservée. |
| [.agents/skills/editorial-type/references/sources/05-christopherdoyle.md](../../../.agents/skills/editorial-type/references/sources/05-christopherdoyle.md) | 80 | 4904 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/SKILL.md](../../../.agents/skills/experimental-type/SKILL.md) | 1005 | 43996 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/design-use-cases.md](../../../.agents/skills/experimental-type/references/design-use-cases.md) | 66 | 2884 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/lastskill.md](../../../.agents/skills/experimental-type/references/lastskill.md) | 974 | 41201 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/refero-style-database.md](../../../.agents/skills/experimental-type/references/refero-style-database.md) | 2938 | 63441 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/sources/01-teenage-engineering.md](../../../.agents/skills/experimental-type/references/sources/01-teenage-engineering.md) | 72 | 2959 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/sources/02-charlie.md](../../../.agents/skills/experimental-type/references/sources/02-charlie.md) | 67 | 2519 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/sources/03-typelist.md](../../../.agents/skills/experimental-type/references/sources/03-typelist.md) | 73 | 2603 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/sources/04-egstad.md](../../../.agents/skills/experimental-type/references/sources/04-egstad.md) | 67 | 2410 | Bibliothèque spécialisée conservée. |
| [.agents/skills/experimental-type/references/sources/05-sociotype.md](../../../.agents/skills/experimental-type/references/sources/05-sociotype.md) | 68 | 2333 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/SKILL.md](../../../.agents/skills/expressive-brand/SKILL.md) | 1105 | 46372 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/design-use-cases.md](../../../.agents/skills/expressive-brand/references/design-use-cases.md) | 66 | 2805 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/lastskill.md](../../../.agents/skills/expressive-brand/references/lastskill.md) | 1080 | 43901 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/refero-style-database.md](../../../.agents/skills/expressive-brand/references/refero-style-database.md) | 2699 | 61411 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/sources/01-family.md](../../../.agents/skills/expressive-brand/references/sources/01-family.md) | 99 | 3325 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/sources/02-mymind.md](../../../.agents/skills/expressive-brand/references/sources/02-mymind.md) | 91 | 3285 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/sources/03-antimetal.md](../../../.agents/skills/expressive-brand/references/sources/03-antimetal.md) | 92 | 2992 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/sources/04-empower.md](../../../.agents/skills/expressive-brand/references/sources/04-empower.md) | 85 | 2668 | Bibliothèque spécialisée conservée. |
| [.agents/skills/expressive-brand/references/sources/05-retool.md](../../../.agents/skills/expressive-brand/references/sources/05-retool.md) | 93 | 2929 | Bibliothèque spécialisée conservée. |
| [.agents/skills/frontsymmetry/SKILL.md](../../../.agents/skills/frontsymmetry/SKILL.md) | 361 | 18265 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/SKILL.md](../../../.agents/skills/geometric-modern/SKILL.md) | 1033 | 44749 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/design-use-cases.md](../../../.agents/skills/geometric-modern/references/design-use-cases.md) | 66 | 2795 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/lastskill.md](../../../.agents/skills/geometric-modern/references/lastskill.md) | 1001 | 42180 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/refero-style-database.md](../../../.agents/skills/geometric-modern/references/refero-style-database.md) | 1274 | 62878 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/sources/01-greenspace.md](../../../.agents/skills/geometric-modern/references/sources/01-greenspace.md) | 74 | 4991 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/sources/02-artem-militonian.md](../../../.agents/skills/geometric-modern/references/sources/02-artem-militonian.md) | 81 | 5265 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/sources/03-vac.md](../../../.agents/skills/geometric-modern/references/sources/03-vac.md) | 83 | 5341 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/sources/04-theodore-ellison-designs.md](../../../.agents/skills/geometric-modern/references/sources/04-theodore-ellison-designs.md) | 101 | 6934 | Bibliothèque spécialisée conservée. |
| [.agents/skills/geometric-modern/references/sources/05-eindhoven-design-district.md](../../../.agents/skills/geometric-modern/references/sources/05-eindhoven-design-district.md) | 80 | 6981 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/SKILL.md](../../../.agents/skills/glossy-modern/SKILL.md) | 941 | 42226 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/design-use-cases.md](../../../.agents/skills/glossy-modern/references/design-use-cases.md) | 66 | 2716 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/lastskill.md](../../../.agents/skills/glossy-modern/references/lastskill.md) | 916 | 39674 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/refero-style-database.md](../../../.agents/skills/glossy-modern/references/refero-style-database.md) | 3186 | 69340 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/sources/01-changelog.md](../../../.agents/skills/glossy-modern/references/sources/01-changelog.md) | 92 | 2993 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/sources/02-raycast.md](../../../.agents/skills/glossy-modern/references/sources/02-raycast.md) | 95 | 3088 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/sources/03-dia-browser.md](../../../.agents/skills/glossy-modern/references/sources/03-dia-browser.md) | 92 | 2877 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/sources/04-ayo-lava.md](../../../.agents/skills/glossy-modern/references/sources/04-ayo-lava.md) | 77 | 2634 | Bibliothèque spécialisée conservée. |
| [.agents/skills/glossy-modern/references/sources/05-monopo-saigon.md](../../../.agents/skills/glossy-modern/references/sources/05-monopo-saigon.md) | 82 | 2697 | Bibliothèque spécialisée conservée. |
| [.agents/skills/gpt-taste/SKILL.md](../../../.agents/skills/gpt-taste/SKILL.md) | 76 | 8725 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/SKILL.md](../../../.agents/skills/high-contrast/SKILL.md) | 1033 | 41022 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/design-use-cases.md](../../../.agents/skills/high-contrast/references/design-use-cases.md) | 66 | 2714 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/lastskill.md](../../../.agents/skills/high-contrast/references/lastskill.md) | 1009 | 38974 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/refero-style-database.md](../../../.agents/skills/high-contrast/references/refero-style-database.md) | 2708 | 62088 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/sources/01-colab.md](../../../.agents/skills/high-contrast/references/sources/01-colab.md) | 52 | 2093 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/sources/02-holographik.md](../../../.agents/skills/high-contrast/references/sources/02-holographik.md) | 49 | 1972 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/sources/03-hardclo.md](../../../.agents/skills/high-contrast/references/sources/03-hardclo.md) | 50 | 1902 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/sources/04-hyperaktiv.md](../../../.agents/skills/high-contrast/references/sources/04-hyperaktiv.md) | 54 | 2095 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-contrast/references/sources/05-hugging-face.md](../../../.agents/skills/high-contrast/references/sources/05-hugging-face.md) | 57 | 2363 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/SKILL.md](../../../.agents/skills/high-end-design/SKILL.md) | 1048 | 47582 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/design-use-cases.md](../../../.agents/skills/high-end-design/references/design-use-cases.md) | 66 | 2971 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/lastskill.md](../../../.agents/skills/high-end-design/references/lastskill.md) | 1020 | 44994 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/refero-style-database.md](../../../.agents/skills/high-end-design/references/refero-style-database.md) | 1085 | 95432 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/sources/01-bang-olufsen.md](../../../.agents/skills/high-end-design/references/sources/01-bang-olufsen.md) | 83 | 15528 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/sources/02-bmwcom.md](../../../.agents/skills/high-end-design/references/sources/02-bmwcom.md) | 85 | 13658 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/sources/03-ferrari.md](../../../.agents/skills/high-end-design/references/sources/03-ferrari.md) | 80 | 13540 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/sources/04-true-staging.md](../../../.agents/skills/high-end-design/references/sources/04-true-staging.md) | 84 | 5640 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-design/references/sources/05-peak-design.md](../../../.agents/skills/high-end-design/references/sources/05-peak-design.md) | 113 | 22172 | Bibliothèque spécialisée conservée. |
| [.agents/skills/high-end-visual-design/SKILL.md](../../../.agents/skills/high-end-visual-design/SKILL.md) | 98 | 10561 | Bibliothèque spécialisée conservée. |
| [.agents/skills/industrial-brutalist-ui/SKILL.md](../../../.agents/skills/industrial-brutalist-ui/SKILL.md) | 92 | 8456 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/SKILL.md](../../../.agents/skills/light-ui/SKILL.md) | 714 | 38950 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/design-use-cases.md](../../../.agents/skills/light-ui/references/design-use-cases.md) | 66 | 2685 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/lastskill.md](../../../.agents/skills/light-ui/references/lastskill.md) | 687 | 35951 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/refero-style-database.md](../../../.agents/skills/light-ui/references/refero-style-database.md) | 2870 | 60055 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/sources/01-luma.md](../../../.agents/skills/light-ui/references/sources/01-luma.md) | 66 | 2485 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/sources/02-lightdash.md](../../../.agents/skills/light-ui/references/sources/02-lightdash.md) | 71 | 2694 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/sources/03-circle.md](../../../.agents/skills/light-ui/references/sources/03-circle.md) | 70 | 2479 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/sources/04-lift-off-challenge.md](../../../.agents/skills/light-ui/references/sources/04-lift-off-challenge.md) | 71 | 2654 | Bibliothèque spécialisée conservée. |
| [.agents/skills/light-ui/references/sources/05-tailark-pro.md](../../../.agents/skills/light-ui/references/sources/05-tailark-pro.md) | 71 | 2626 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/SKILL.md](../../../.agents/skills/minimal-design/SKILL.md) | 1015 | 37514 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/advanced-implementation-notes.md](../../../.agents/skills/minimal-design/references/advanced-implementation-notes.md) | 114 | 2592 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/design-use-cases.md](../../../.agents/skills/minimal-design/references/design-use-cases.md) | 66 | 2671 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/lastskill.md](../../../.agents/skills/minimal-design/references/lastskill.md) | 982 | 34420 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/refero-style-database.md](../../../.agents/skills/minimal-design/references/refero-style-database.md) | 2915 | 64075 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/sources/01-general-intelligence-company.md](../../../.agents/skills/minimal-design/references/sources/01-general-intelligence-company.md) | 82 | 2723 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/sources/02-sprig.md](../../../.agents/skills/minimal-design/references/sources/02-sprig.md) | 83 | 2628 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/sources/03-standards.md](../../../.agents/skills/minimal-design/references/sources/03-standards.md) | 86 | 2300 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/sources/04-rox.md](../../../.agents/skills/minimal-design/references/sources/04-rox.md) | 89 | 2589 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimal-design/references/sources/05-copy.md](../../../.agents/skills/minimal-design/references/sources/05-copy.md) | 86 | 2531 | Bibliothèque spécialisée conservée. |
| [.agents/skills/minimalist-ui/SKILL.md](../../../.agents/skills/minimalist-ui/SKILL.md) | 85 | 7901 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/SKILL.md](../../../.agents/skills/monochrome-ui/SKILL.md) | 1003 | 38317 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/advanced-implementation-notes.md](../../../.agents/skills/monochrome-ui/references/advanced-implementation-notes.md) | 102 | 2327 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/design-use-cases.md](../../../.agents/skills/monochrome-ui/references/design-use-cases.md) | 66 | 2670 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/lastskill.md](../../../.agents/skills/monochrome-ui/references/lastskill.md) | 971 | 35638 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/refero-style-database.md](../../../.agents/skills/monochrome-ui/references/refero-style-database.md) | 1086 | 63028 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/sources/01-figma-config.md](../../../.agents/skills/monochrome-ui/references/sources/01-figma-config.md) | 84 | 5712 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/sources/02-mono.md](../../../.agents/skills/monochrome-ui/references/sources/02-mono.md) | 101 | 6387 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/sources/03-yung-studio.md](../../../.agents/skills/monochrome-ui/references/sources/03-yung-studio.md) | 93 | 14080 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/sources/04-kaisermann.md](../../../.agents/skills/monochrome-ui/references/sources/04-kaisermann.md) | 76 | 5373 | Bibliothèque spécialisée conservée. |
| [.agents/skills/monochrome-ui/references/sources/05-ui.md](../../../.agents/skills/monochrome-ui/references/sources/05-ui.md) | 92 | 7238 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/SKILL.md](../../../.agents/skills/motion/SKILL.md) | 1018 | 48451 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/advanced-implementation-notes.md](../../../.agents/skills/motion/references/advanced-implementation-notes.md) | 44 | 2267 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/design-use-cases.md](../../../.agents/skills/motion/references/design-use-cases.md) | 66 | 2782 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/lastskill.md](../../../.agents/skills/motion/references/lastskill.md) | 993 | 45896 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/refero-style-database.md](../../../.agents/skills/motion/references/refero-style-database.md) | 3085 | 84288 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/01-liquid-death.md](../../../.agents/skills/motion/references/sources/01-liquid-death.md) | 177 | 8304 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/02-heavyweight.md](../../../.agents/skills/motion/references/sources/02-heavyweight.md) | 118 | 4801 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/03-handshake.md](../../../.agents/skills/motion/references/sources/03-handshake.md) | 149 | 5436 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/04-cthdrl.md](../../../.agents/skills/motion/references/sources/04-cthdrl.md) | 110 | 3870 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/05-superlative.md](../../../.agents/skills/motion/references/sources/05-superlative.md) | 114 | 4067 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/06-mekaverse.md](../../../.agents/skills/motion/references/sources/06-mekaverse.md) | 134 | 4807 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/07-hape-prime.md](../../../.agents/skills/motion/references/sources/07-hape-prime.md) | 107 | 4234 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/08-moving-parts.md](../../../.agents/skills/motion/references/sources/08-moving-parts.md) | 165 | 6543 | Bibliothèque spécialisée conservée. |
| [.agents/skills/motion/references/sources/09-homunculus.md](../../../.agents/skills/motion/references/sources/09-homunculus.md) | 111 | 4349 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/SKILL.md](../../../.agents/skills/pastel/SKILL.md) | 1097 | 43899 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/design-use-cases.md](../../../.agents/skills/pastel/references/design-use-cases.md) | 66 | 2663 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/lastskill.md](../../../.agents/skills/pastel/references/lastskill.md) | 1067 | 41162 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/refero-style-database.md](../../../.agents/skills/pastel/references/refero-style-database.md) | 2318 | 66573 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/sources/01-pastel.md](../../../.agents/skills/pastel/references/sources/01-pastel.md) | 99 | 3802 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/sources/02-palette-supply.md](../../../.agents/skills/pastel/references/sources/02-palette-supply.md) | 113 | 4359 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/sources/03-recess.md](../../../.agents/skills/pastel/references/sources/03-recess.md) | 96 | 4457 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/sources/04-graza.md](../../../.agents/skills/pastel/references/sources/04-graza.md) | 106 | 4974 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/sources/05-podcorn.md](../../../.agents/skills/pastel/references/sources/05-podcorn.md) | 105 | 4211 | Bibliothèque spécialisée conservée. |
| [.agents/skills/pastel/references/sources/06-podia.md](../../../.agents/skills/pastel/references/sources/06-podia.md) | 104 | 4634 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/SKILL.md](../../../.agents/skills/playful-design/SKILL.md) | 1206 | 44126 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/design-use-cases.md](../../../.agents/skills/playful-design/references/design-use-cases.md) | 66 | 2742 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/lastskill.md](../../../.agents/skills/playful-design/references/lastskill.md) | 1182 | 42016 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/refero-style-database.md](../../../.agents/skills/playful-design/references/refero-style-database.md) | 3088 | 67164 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/sources/01-playful-software.md](../../../.agents/skills/playful-design/references/sources/01-playful-software.md) | 69 | 2416 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/sources/02-maxima-therapy.md](../../../.agents/skills/playful-design/references/sources/02-maxima-therapy.md) | 71 | 2524 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/sources/03-playdate.md](../../../.agents/skills/playful-design/references/sources/03-playdate.md) | 69 | 2251 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/sources/04-duolingo.md](../../../.agents/skills/playful-design/references/sources/04-duolingo.md) | 70 | 2444 | Bibliothèque spécialisée conservée. |
| [.agents/skills/playful-design/references/sources/05-clay.md](../../../.agents/skills/playful-design/references/sources/05-clay.md) | 70 | 2451 | Bibliothèque spécialisée conservée. |
| [.agents/skills/redesign-existing-projects/SKILL.md](../../../.agents/skills/redesign-existing-projects/SKILL.md) | 178 | 15060 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/SKILL.md](../../../.agents/skills/serif-display/SKILL.md) | 1015 | 38245 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/advanced-implementation-notes.md](../../../.agents/skills/serif-display/references/advanced-implementation-notes.md) | 181 | 4535 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/design-use-cases.md](../../../.agents/skills/serif-display/references/design-use-cases.md) | 66 | 2663 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/lastskill.md](../../../.agents/skills/serif-display/references/lastskill.md) | 986 | 35558 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/refero-style-database.md](../../../.agents/skills/serif-display/references/refero-style-database.md) | 2318 | 64921 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/sources/01-sociotype.md](../../../.agents/skills/serif-display/references/sources/01-sociotype.md) | 91 | 3385 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/sources/02-fidele-editions.md](../../../.agents/skills/serif-display/references/sources/02-fidele-editions.md) | 113 | 4563 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/sources/03-pangram-pangram.md](../../../.agents/skills/serif-display/references/sources/03-pangram-pangram.md) | 125 | 4720 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/sources/04-standards.md](../../../.agents/skills/serif-display/references/sources/04-standards.md) | 101 | 3669 | Bibliothèque spécialisée conservée. |
| [.agents/skills/serif-display/references/sources/05-unveil.md](../../../.agents/skills/serif-display/references/sources/05-unveil.md) | 81 | 2985 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/SKILL.md](../../../.agents/skills/soft-gradients/SKILL.md) | 1006 | 43336 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/design-use-cases.md](../../../.agents/skills/soft-gradients/references/design-use-cases.md) | 66 | 2736 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/lastskill.md](../../../.agents/skills/soft-gradients/references/lastskill.md) | 980 | 40478 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/refero-style-database.md](../../../.agents/skills/soft-gradients/references/refero-style-database.md) | 3362 | 79534 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/sources/01-base44.md](../../../.agents/skills/soft-gradients/references/sources/01-base44.md) | 106 | 3925 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/sources/02-dia-browser.md](../../../.agents/skills/soft-gradients/references/sources/02-dia-browser.md) | 105 | 3333 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/sources/03-sprig.md](../../../.agents/skills/soft-gradients/references/sources/03-sprig.md) | 98 | 3370 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/sources/04-superhuman.md](../../../.agents/skills/soft-gradients/references/sources/04-superhuman.md) | 106 | 3268 | Bibliothèque spécialisée conservée. |
| [.agents/skills/soft-gradients/references/sources/05-retool.md](../../../.agents/skills/soft-gradients/references/sources/05-retool.md) | 101 | 3393 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/SKILL.md](../../../.agents/skills/technical-sans/SKILL.md) | 695 | 38724 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/design-use-cases.md](../../../.agents/skills/technical-sans/references/design-use-cases.md) | 66 | 2695 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/lastskill.md](../../../.agents/skills/technical-sans/references/lastskill.md) | 666 | 35553 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/refero-style-database.md](../../../.agents/skills/technical-sans/references/refero-style-database.md) | 2963 | 69003 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/sources/01-antimetal.md](../../../.agents/skills/technical-sans/references/sources/01-antimetal.md) | 113 | 4213 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/sources/02-plain.md](../../../.agents/skills/technical-sans/references/sources/02-plain.md) | 109 | 3820 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/sources/03-cursor.md](../../../.agents/skills/technical-sans/references/sources/03-cursor.md) | 107 | 3718 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/sources/04-linear.md](../../../.agents/skills/technical-sans/references/sources/04-linear.md) | 110 | 3526 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-sans/references/sources/05-mercury.md](../../../.agents/skills/technical-sans/references/sources/05-mercury.md) | 108 | 3317 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/SKILL.md](../../../.agents/skills/technical-ui/SKILL.md) | 705 | 39010 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/design-use-cases.md](../../../.agents/skills/technical-ui/references/design-use-cases.md) | 66 | 2730 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/lastskill.md](../../../.agents/skills/technical-ui/references/lastskill.md) | 677 | 35913 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/refero-style-database.md](../../../.agents/skills/technical-ui/references/refero-style-database.md) | 3162 | 60461 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/sources/01-user-interviews.md](../../../.agents/skills/technical-ui/references/sources/01-user-interviews.md) | 73 | 2731 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/sources/02-chatgpt.md](../../../.agents/skills/technical-ui/references/sources/02-chatgpt.md) | 67 | 2199 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/sources/03-attio.md](../../../.agents/skills/technical-ui/references/sources/03-attio.md) | 71 | 2391 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/sources/04-telepathic-instruments.md](../../../.agents/skills/technical-ui/references/sources/04-telepathic-instruments.md) | 68 | 2366 | Bibliothèque spécialisée conservée. |
| [.agents/skills/technical-ui/references/sources/05-todesktop.md](../../../.agents/skills/technical-ui/references/sources/05-todesktop.md) | 71 | 2543 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/SKILL.md](../../../.agents/skills/utilitarian/SKILL.md) | 720 | 38926 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/design-use-cases.md](../../../.agents/skills/utilitarian/references/design-use-cases.md) | 66 | 2696 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/lastskill.md](../../../.agents/skills/utilitarian/references/lastskill.md) | 691 | 35937 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/refero-style-database.md](../../../.agents/skills/utilitarian/references/refero-style-database.md) | 1088 | 79005 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/sources/01-office-chair-finder.md](../../../.agents/skills/utilitarian/references/sources/01-office-chair-finder.md) | 86 | 5433 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/sources/02-makr.md](../../../.agents/skills/utilitarian/references/sources/02-makr.md) | 83 | 4952 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/sources/03-norm.md](../../../.agents/skills/utilitarian/references/sources/03-norm.md) | 92 | 5622 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/sources/04-superpower.md](../../../.agents/skills/utilitarian/references/sources/04-superpower.md) | 97 | 31239 | Bibliothèque spécialisée conservée. |
| [.agents/skills/utilitarian/references/sources/05-ordinal.md](../../../.agents/skills/utilitarian/references/sources/05-ordinal.md) | 90 | 7564 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/SKILL.md](../../../.agents/skills/vibrant-accents/SKILL.md) | 827 | 36145 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/advanced-implementation-notes.md](../../../.agents/skills/vibrant-accents/references/advanced-implementation-notes.md) | 469 | 11626 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/design-use-cases.md](../../../.agents/skills/vibrant-accents/references/design-use-cases.md) | 66 | 2740 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/lastskill.md](../../../.agents/skills/vibrant-accents/references/lastskill.md) | 801 | 33561 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/refero-style-database.md](../../../.agents/skills/vibrant-accents/references/refero-style-database.md) | 2718 | 60413 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/sources/01-stripe.md](../../../.agents/skills/vibrant-accents/references/sources/01-stripe.md) | 109 | 3563 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/sources/02-squadeasy.md](../../../.agents/skills/vibrant-accents/references/sources/02-squadeasy.md) | 102 | 3253 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/sources/03-base44.md](../../../.agents/skills/vibrant-accents/references/sources/03-base44.md) | 104 | 3434 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/sources/04-empower.md](../../../.agents/skills/vibrant-accents/references/sources/04-empower.md) | 102 | 3087 | Bibliothèque spécialisée conservée. |
| [.agents/skills/vibrant-accents/references/sources/05-copy.md](../../../.agents/skills/vibrant-accents/references/sources/05-copy.md) | 102 | 3043 | Bibliothèque spécialisée conservée. |
| [.agents/skills/viewport-fit/SKILL.md](../../../.agents/skills/viewport-fit/SKILL.md) | 132 | 6622 | Bibliothèque spécialisée conservée. |
| [.agents/skills/visual-annotation-tuning/SKILL.md](../../../.agents/skills/visual-annotation-tuning/SKILL.md) | 181 | 8960 | Bibliothèque spécialisée conservée. |

## Hors corpus actif

- `security-audits/AUDIT_SECURITE_2026-08-11.md` : 354 lignes, 16570 octets ; rapport local déjà ignoré, métadonnées seulement, non déplacé ni publié ici.

## Empreintes des sources archivées

Empreintes avant rangement pour contrôle d'identité, pas données sensibles.
Les archives ajoutent un bandeau, rebasent les liens et normalisent quatre
fins de ligne de l'audit Ultra ; leur hash est donc différent.

| Source | SHA-256 initial |
| --- | --- |
| `AGENTS.md` | `bd6b94c9a656146142c70cf2d38849e929bd6d3a0f1c1f0001725408cdc321fd` |
| `TEST_CLIENT_ADMIN_LUNA.md` | `88ae17d9b5e9316aa8ad79fbf3688872108af94f5f739146ef258c2c00e3b4b9` |
| `TEST_COMMERCE_SANDBOX.md` | `221376e656c8d2103273c4f306f65849a1e1ea818d8adce71104c635c6dc1823` |
| `TODO.md` | `c00a3b68f08c29087286ede45060721cb88c68b6bb608994808d408a4008bfdb` |
| `_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md` | `785003cd6bca830e4678a9cc78f73902f51cf381c7ce7bc0bfca7bcc773b0bfc` |
| `_DOCS/commerce/COMMERCE_REPRISE.md` | `cfa6177b4fc7c877618ff8a75e6d6c12f8aac663d726df638dba8d20d5cc8844` |
| `_DOCS/commerce/COMMERCE_SYNTHESE.md` | `6c0cc57c378fd92e3295531241dbb9e070d5f534bd95146af6bf740d5d464330` |
| `_DOCS/email/RECETTE_EMAILS_LUNA.md` | `70a71c7fe4234595007c32c4d0c111a4d329f4527257d55ddbdd11019c36c6bb` |
| `_DOCS/security/STABILISATION_SECURITE_SANDBOX.md` | `870ce1ad756f5fdd1fc008b26805aedd3db2bb503e101aa9cb0cf2f1cc8d81c6` |
| `audit/2026-08-09_AUDIT_CHATGPT_ULTRA.md` | `7f3f8ffd3b05d244514a3ff5d505d89d7b27933083ee823b2016e8f50170be86` |
| `facture.md` | `f33cd9d2a6a6701a901e638f70054afe7c7bf0906b00cdf71e680e576140afbe` |
| `jean.md` | `89e8852abc6ca171bce806a8e3810cc0ead6446fe979505347f4945ac6321d47` |
| `map.md` | `a20a9a4f63cf67bdd7b13029db12dcc24613d0d73e618776fc76086ba74cc7e3` |
