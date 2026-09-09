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
| [TEST_CLIENT_ADMIN_LUNA.md](TEST_CLIENT_ADMIN_LUNA.md) | 77 | Remplacé : procédure documentaire conservée ; skill ensuite retiré sur demande. |
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

Décision ultérieure explicite : les 33 skills sont tous retirés du projet
actif, y compris `client-admin-test`. Les chemins ci-dessous sont historiques ;
les liens donnent désormais accès à l'archive compressée contenant les fichiers,
pas à un skill actif. Aucune extraction ou restauration automatique.
Le [manifeste SHA-256](skills-locaux.manifest.json) permet de vérifier la conservation.

| Chemin | Lignes | Octets | Décision |
| --- | ---: | ---: | --- |
| [.agents/skills/clean-saas/SKILL.md](skills-locaux.tar.gz) | 746 | 44350 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/design-use-cases.md](skills-locaux.tar.gz) | 67 | 3194 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/lastskill.md](skills-locaux.tar.gz) | 716 | 40149 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/refero-style-database.md](skills-locaux.tar.gz) | 1141 | 86125 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/sources/01-autosend.md](skills-locaux.tar.gz) | 125 | 8518 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/sources/02-fresha.md](skills-locaux.tar.gz) | 83 | 6986 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/sources/03-workable.md](skills-locaux.tar.gz) | 98 | 6789 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/sources/04-all-in-one-salon.md](skills-locaux.tar.gz) | 94 | 21434 | Archivé sur demande, non actif. |
| [.agents/skills/clean-saas/references/sources/05-slack.md](skills-locaux.tar.gz) | 101 | 19178 | Archivé sur demande, non actif. |
| [.agents/skills/client-admin-test/SKILL.md](skills-locaux.tar.gz) | 171 | 14362 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/SKILL.md](skills-locaux.tar.gz) | 917 | 42239 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 3030 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/lastskill.md](skills-locaux.tar.gz) | 892 | 39678 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/refero-style-database.md](skills-locaux.tar.gz) | 2423 | 64895 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/sources/01-chainzoku.md](skills-locaux.tar.gz) | 123 | 5118 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/sources/02-sbs-town.md](skills-locaux.tar.gz) | 88 | 3810 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/sources/03-neon.md](skills-locaux.tar.gz) | 121 | 5015 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/sources/04-jetbrains.md](skills-locaux.tar.gz) | 150 | 7970 | Archivé sur demande, non actif. |
| [.agents/skills/cyber-neon/references/sources/05-off-white.md](skills-locaux.tar.gz) | 107 | 4770 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/SKILL.md](skills-locaux.tar.gz) | 925 | 42237 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2806 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/lastskill.md](skills-locaux.tar.gz) | 900 | 39550 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/refero-style-database.md](skills-locaux.tar.gz) | 2546 | 65511 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/sources/01-beehiiv.md](skills-locaux.tar.gz) | 77 | 2958 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/sources/02-fey.md](skills-locaux.tar.gz) | 98 | 4264 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/sources/03-bun.md](skills-locaux.tar.gz) | 123 | 5284 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/sources/04-circle.md](skills-locaux.tar.gz) | 120 | 5035 | Archivé sur demande, non actif. |
| [.agents/skills/dark-ui/references/sources/05-superwhisper.md](skills-locaux.tar.gz) | 134 | 6160 | Archivé sur demande, non actif. |
| [.agents/skills/design-taste-frontend/SKILL.md](skills-locaux.tar.gz) | 226 | 21140 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/SKILL.md](skills-locaux.tar.gz) | 1022 | 41213 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/advanced-implementation-notes.md](skills-locaux.tar.gz) | 108 | 2650 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2815 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/lastskill.md](skills-locaux.tar.gz) | 988 | 37798 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/refero-style-database.md](skills-locaux.tar.gz) | 3029 | 65422 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/sources/01-openai.md](skills-locaux.tar.gz) | 103 | 3384 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/sources/02-anthropic.md](skills-locaux.tar.gz) | 105 | 3600 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/sources/03-legend.md](skills-locaux.tar.gz) | 103 | 3353 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/sources/04-intercom.md](skills-locaux.tar.gz) | 106 | 3535 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-minimal/references/sources/05-limitless.md](skills-locaux.tar.gz) | 98 | 3033 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/SKILL.md](skills-locaux.tar.gz) | 1087 | 40996 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2904 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/lastskill.md](skills-locaux.tar.gz) | 1053 | 38052 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/refero-style-database.md](skills-locaux.tar.gz) | 1270 | 61434 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/sources/01-volume.md](skills-locaux.tar.gz) | 84 | 6946 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/sources/02-victor-cango.md](skills-locaux.tar.gz) | 83 | 5765 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/sources/03-no-ideas.md](skills-locaux.tar.gz) | 81 | 5257 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/sources/04-sociotype.md](skills-locaux.tar.gz) | 130 | 7209 | Archivé sur demande, non actif. |
| [.agents/skills/editorial-type/references/sources/05-christopherdoyle.md](skills-locaux.tar.gz) | 80 | 4904 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/SKILL.md](skills-locaux.tar.gz) | 1005 | 43996 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2884 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/lastskill.md](skills-locaux.tar.gz) | 974 | 41201 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/refero-style-database.md](skills-locaux.tar.gz) | 2938 | 63441 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/sources/01-teenage-engineering.md](skills-locaux.tar.gz) | 72 | 2959 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/sources/02-charlie.md](skills-locaux.tar.gz) | 67 | 2519 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/sources/03-typelist.md](skills-locaux.tar.gz) | 73 | 2603 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/sources/04-egstad.md](skills-locaux.tar.gz) | 67 | 2410 | Archivé sur demande, non actif. |
| [.agents/skills/experimental-type/references/sources/05-sociotype.md](skills-locaux.tar.gz) | 68 | 2333 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/SKILL.md](skills-locaux.tar.gz) | 1105 | 46372 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2805 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/lastskill.md](skills-locaux.tar.gz) | 1080 | 43901 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/refero-style-database.md](skills-locaux.tar.gz) | 2699 | 61411 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/sources/01-family.md](skills-locaux.tar.gz) | 99 | 3325 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/sources/02-mymind.md](skills-locaux.tar.gz) | 91 | 3285 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/sources/03-antimetal.md](skills-locaux.tar.gz) | 92 | 2992 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/sources/04-empower.md](skills-locaux.tar.gz) | 85 | 2668 | Archivé sur demande, non actif. |
| [.agents/skills/expressive-brand/references/sources/05-retool.md](skills-locaux.tar.gz) | 93 | 2929 | Archivé sur demande, non actif. |
| [.agents/skills/frontsymmetry/SKILL.md](skills-locaux.tar.gz) | 361 | 18265 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/SKILL.md](skills-locaux.tar.gz) | 1033 | 44749 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2795 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/lastskill.md](skills-locaux.tar.gz) | 1001 | 42180 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/refero-style-database.md](skills-locaux.tar.gz) | 1274 | 62878 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/sources/01-greenspace.md](skills-locaux.tar.gz) | 74 | 4991 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/sources/02-artem-militonian.md](skills-locaux.tar.gz) | 81 | 5265 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/sources/03-vac.md](skills-locaux.tar.gz) | 83 | 5341 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/sources/04-theodore-ellison-designs.md](skills-locaux.tar.gz) | 101 | 6934 | Archivé sur demande, non actif. |
| [.agents/skills/geometric-modern/references/sources/05-eindhoven-design-district.md](skills-locaux.tar.gz) | 80 | 6981 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/SKILL.md](skills-locaux.tar.gz) | 941 | 42226 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2716 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/lastskill.md](skills-locaux.tar.gz) | 916 | 39674 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/refero-style-database.md](skills-locaux.tar.gz) | 3186 | 69340 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/sources/01-changelog.md](skills-locaux.tar.gz) | 92 | 2993 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/sources/02-raycast.md](skills-locaux.tar.gz) | 95 | 3088 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/sources/03-dia-browser.md](skills-locaux.tar.gz) | 92 | 2877 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/sources/04-ayo-lava.md](skills-locaux.tar.gz) | 77 | 2634 | Archivé sur demande, non actif. |
| [.agents/skills/glossy-modern/references/sources/05-monopo-saigon.md](skills-locaux.tar.gz) | 82 | 2697 | Archivé sur demande, non actif. |
| [.agents/skills/gpt-taste/SKILL.md](skills-locaux.tar.gz) | 76 | 8725 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/SKILL.md](skills-locaux.tar.gz) | 1033 | 41022 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2714 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/lastskill.md](skills-locaux.tar.gz) | 1009 | 38974 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/refero-style-database.md](skills-locaux.tar.gz) | 2708 | 62088 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/sources/01-colab.md](skills-locaux.tar.gz) | 52 | 2093 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/sources/02-holographik.md](skills-locaux.tar.gz) | 49 | 1972 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/sources/03-hardclo.md](skills-locaux.tar.gz) | 50 | 1902 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/sources/04-hyperaktiv.md](skills-locaux.tar.gz) | 54 | 2095 | Archivé sur demande, non actif. |
| [.agents/skills/high-contrast/references/sources/05-hugging-face.md](skills-locaux.tar.gz) | 57 | 2363 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/SKILL.md](skills-locaux.tar.gz) | 1048 | 47582 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2971 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/lastskill.md](skills-locaux.tar.gz) | 1020 | 44994 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/refero-style-database.md](skills-locaux.tar.gz) | 1085 | 95432 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/sources/01-bang-olufsen.md](skills-locaux.tar.gz) | 83 | 15528 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/sources/02-bmwcom.md](skills-locaux.tar.gz) | 85 | 13658 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/sources/03-ferrari.md](skills-locaux.tar.gz) | 80 | 13540 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/sources/04-true-staging.md](skills-locaux.tar.gz) | 84 | 5640 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-design/references/sources/05-peak-design.md](skills-locaux.tar.gz) | 113 | 22172 | Archivé sur demande, non actif. |
| [.agents/skills/high-end-visual-design/SKILL.md](skills-locaux.tar.gz) | 98 | 10561 | Archivé sur demande, non actif. |
| [.agents/skills/industrial-brutalist-ui/SKILL.md](skills-locaux.tar.gz) | 92 | 8456 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/SKILL.md](skills-locaux.tar.gz) | 714 | 38950 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2685 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/lastskill.md](skills-locaux.tar.gz) | 687 | 35951 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/refero-style-database.md](skills-locaux.tar.gz) | 2870 | 60055 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/sources/01-luma.md](skills-locaux.tar.gz) | 66 | 2485 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/sources/02-lightdash.md](skills-locaux.tar.gz) | 71 | 2694 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/sources/03-circle.md](skills-locaux.tar.gz) | 70 | 2479 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/sources/04-lift-off-challenge.md](skills-locaux.tar.gz) | 71 | 2654 | Archivé sur demande, non actif. |
| [.agents/skills/light-ui/references/sources/05-tailark-pro.md](skills-locaux.tar.gz) | 71 | 2626 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/SKILL.md](skills-locaux.tar.gz) | 1015 | 37514 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/advanced-implementation-notes.md](skills-locaux.tar.gz) | 114 | 2592 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2671 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/lastskill.md](skills-locaux.tar.gz) | 982 | 34420 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/refero-style-database.md](skills-locaux.tar.gz) | 2915 | 64075 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/sources/01-general-intelligence-company.md](skills-locaux.tar.gz) | 82 | 2723 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/sources/02-sprig.md](skills-locaux.tar.gz) | 83 | 2628 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/sources/03-standards.md](skills-locaux.tar.gz) | 86 | 2300 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/sources/04-rox.md](skills-locaux.tar.gz) | 89 | 2589 | Archivé sur demande, non actif. |
| [.agents/skills/minimal-design/references/sources/05-copy.md](skills-locaux.tar.gz) | 86 | 2531 | Archivé sur demande, non actif. |
| [.agents/skills/minimalist-ui/SKILL.md](skills-locaux.tar.gz) | 85 | 7901 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/SKILL.md](skills-locaux.tar.gz) | 1003 | 38317 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/advanced-implementation-notes.md](skills-locaux.tar.gz) | 102 | 2327 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2670 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/lastskill.md](skills-locaux.tar.gz) | 971 | 35638 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/refero-style-database.md](skills-locaux.tar.gz) | 1086 | 63028 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/sources/01-figma-config.md](skills-locaux.tar.gz) | 84 | 5712 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/sources/02-mono.md](skills-locaux.tar.gz) | 101 | 6387 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/sources/03-yung-studio.md](skills-locaux.tar.gz) | 93 | 14080 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/sources/04-kaisermann.md](skills-locaux.tar.gz) | 76 | 5373 | Archivé sur demande, non actif. |
| [.agents/skills/monochrome-ui/references/sources/05-ui.md](skills-locaux.tar.gz) | 92 | 7238 | Archivé sur demande, non actif. |
| [.agents/skills/motion/SKILL.md](skills-locaux.tar.gz) | 1018 | 48451 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/advanced-implementation-notes.md](skills-locaux.tar.gz) | 44 | 2267 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2782 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/lastskill.md](skills-locaux.tar.gz) | 993 | 45896 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/refero-style-database.md](skills-locaux.tar.gz) | 3085 | 84288 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/01-liquid-death.md](skills-locaux.tar.gz) | 177 | 8304 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/02-heavyweight.md](skills-locaux.tar.gz) | 118 | 4801 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/03-handshake.md](skills-locaux.tar.gz) | 149 | 5436 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/04-cthdrl.md](skills-locaux.tar.gz) | 110 | 3870 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/05-superlative.md](skills-locaux.tar.gz) | 114 | 4067 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/06-mekaverse.md](skills-locaux.tar.gz) | 134 | 4807 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/07-hape-prime.md](skills-locaux.tar.gz) | 107 | 4234 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/08-moving-parts.md](skills-locaux.tar.gz) | 165 | 6543 | Archivé sur demande, non actif. |
| [.agents/skills/motion/references/sources/09-homunculus.md](skills-locaux.tar.gz) | 111 | 4349 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/SKILL.md](skills-locaux.tar.gz) | 1097 | 43899 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2663 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/lastskill.md](skills-locaux.tar.gz) | 1067 | 41162 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/refero-style-database.md](skills-locaux.tar.gz) | 2318 | 66573 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/sources/01-pastel.md](skills-locaux.tar.gz) | 99 | 3802 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/sources/02-palette-supply.md](skills-locaux.tar.gz) | 113 | 4359 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/sources/03-recess.md](skills-locaux.tar.gz) | 96 | 4457 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/sources/04-graza.md](skills-locaux.tar.gz) | 106 | 4974 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/sources/05-podcorn.md](skills-locaux.tar.gz) | 105 | 4211 | Archivé sur demande, non actif. |
| [.agents/skills/pastel/references/sources/06-podia.md](skills-locaux.tar.gz) | 104 | 4634 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/SKILL.md](skills-locaux.tar.gz) | 1206 | 44126 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2742 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/lastskill.md](skills-locaux.tar.gz) | 1182 | 42016 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/refero-style-database.md](skills-locaux.tar.gz) | 3088 | 67164 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/sources/01-playful-software.md](skills-locaux.tar.gz) | 69 | 2416 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/sources/02-maxima-therapy.md](skills-locaux.tar.gz) | 71 | 2524 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/sources/03-playdate.md](skills-locaux.tar.gz) | 69 | 2251 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/sources/04-duolingo.md](skills-locaux.tar.gz) | 70 | 2444 | Archivé sur demande, non actif. |
| [.agents/skills/playful-design/references/sources/05-clay.md](skills-locaux.tar.gz) | 70 | 2451 | Archivé sur demande, non actif. |
| [.agents/skills/redesign-existing-projects/SKILL.md](skills-locaux.tar.gz) | 178 | 15060 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/SKILL.md](skills-locaux.tar.gz) | 1015 | 38245 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/advanced-implementation-notes.md](skills-locaux.tar.gz) | 181 | 4535 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2663 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/lastskill.md](skills-locaux.tar.gz) | 986 | 35558 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/refero-style-database.md](skills-locaux.tar.gz) | 2318 | 64921 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/sources/01-sociotype.md](skills-locaux.tar.gz) | 91 | 3385 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/sources/02-fidele-editions.md](skills-locaux.tar.gz) | 113 | 4563 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/sources/03-pangram-pangram.md](skills-locaux.tar.gz) | 125 | 4720 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/sources/04-standards.md](skills-locaux.tar.gz) | 101 | 3669 | Archivé sur demande, non actif. |
| [.agents/skills/serif-display/references/sources/05-unveil.md](skills-locaux.tar.gz) | 81 | 2985 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/SKILL.md](skills-locaux.tar.gz) | 1006 | 43336 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2736 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/lastskill.md](skills-locaux.tar.gz) | 980 | 40478 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/refero-style-database.md](skills-locaux.tar.gz) | 3362 | 79534 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/sources/01-base44.md](skills-locaux.tar.gz) | 106 | 3925 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/sources/02-dia-browser.md](skills-locaux.tar.gz) | 105 | 3333 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/sources/03-sprig.md](skills-locaux.tar.gz) | 98 | 3370 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/sources/04-superhuman.md](skills-locaux.tar.gz) | 106 | 3268 | Archivé sur demande, non actif. |
| [.agents/skills/soft-gradients/references/sources/05-retool.md](skills-locaux.tar.gz) | 101 | 3393 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/SKILL.md](skills-locaux.tar.gz) | 695 | 38724 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2695 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/lastskill.md](skills-locaux.tar.gz) | 666 | 35553 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/refero-style-database.md](skills-locaux.tar.gz) | 2963 | 69003 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/sources/01-antimetal.md](skills-locaux.tar.gz) | 113 | 4213 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/sources/02-plain.md](skills-locaux.tar.gz) | 109 | 3820 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/sources/03-cursor.md](skills-locaux.tar.gz) | 107 | 3718 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/sources/04-linear.md](skills-locaux.tar.gz) | 110 | 3526 | Archivé sur demande, non actif. |
| [.agents/skills/technical-sans/references/sources/05-mercury.md](skills-locaux.tar.gz) | 108 | 3317 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/SKILL.md](skills-locaux.tar.gz) | 705 | 39010 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2730 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/lastskill.md](skills-locaux.tar.gz) | 677 | 35913 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/refero-style-database.md](skills-locaux.tar.gz) | 3162 | 60461 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/sources/01-user-interviews.md](skills-locaux.tar.gz) | 73 | 2731 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/sources/02-chatgpt.md](skills-locaux.tar.gz) | 67 | 2199 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/sources/03-attio.md](skills-locaux.tar.gz) | 71 | 2391 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/sources/04-telepathic-instruments.md](skills-locaux.tar.gz) | 68 | 2366 | Archivé sur demande, non actif. |
| [.agents/skills/technical-ui/references/sources/05-todesktop.md](skills-locaux.tar.gz) | 71 | 2543 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/SKILL.md](skills-locaux.tar.gz) | 720 | 38926 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2696 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/lastskill.md](skills-locaux.tar.gz) | 691 | 35937 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/refero-style-database.md](skills-locaux.tar.gz) | 1088 | 79005 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/sources/01-office-chair-finder.md](skills-locaux.tar.gz) | 86 | 5433 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/sources/02-makr.md](skills-locaux.tar.gz) | 83 | 4952 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/sources/03-norm.md](skills-locaux.tar.gz) | 92 | 5622 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/sources/04-superpower.md](skills-locaux.tar.gz) | 97 | 31239 | Archivé sur demande, non actif. |
| [.agents/skills/utilitarian/references/sources/05-ordinal.md](skills-locaux.tar.gz) | 90 | 7564 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/SKILL.md](skills-locaux.tar.gz) | 827 | 36145 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/advanced-implementation-notes.md](skills-locaux.tar.gz) | 469 | 11626 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/design-use-cases.md](skills-locaux.tar.gz) | 66 | 2740 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/lastskill.md](skills-locaux.tar.gz) | 801 | 33561 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/refero-style-database.md](skills-locaux.tar.gz) | 2718 | 60413 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/sources/01-stripe.md](skills-locaux.tar.gz) | 109 | 3563 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/sources/02-squadeasy.md](skills-locaux.tar.gz) | 102 | 3253 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/sources/03-base44.md](skills-locaux.tar.gz) | 104 | 3434 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/sources/04-empower.md](skills-locaux.tar.gz) | 102 | 3087 | Archivé sur demande, non actif. |
| [.agents/skills/vibrant-accents/references/sources/05-copy.md](skills-locaux.tar.gz) | 102 | 3043 | Archivé sur demande, non actif. |
| [.agents/skills/viewport-fit/SKILL.md](skills-locaux.tar.gz) | 132 | 6622 | Archivé sur demande, non actif. |
| [.agents/skills/visual-annotation-tuning/SKILL.md](skills-locaux.tar.gz) | 181 | 8960 | Archivé sur demande, non actif. |

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
