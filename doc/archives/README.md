# Archives documentaires

Archivage autorisé le 2026-09-04. Propriétaire : équipe Seconde Vie.
Ces textes sont des photographies historiques, **pas des consignes exécutables**.
Les dates, modèles, statuts, commandes et autorisations qu'ils contiennent
ne décrivent pas nécessairement le projet actuel.

Reprise normale : [README du projet](../../README.md) et
[état du projet](../../_DOCS/ETAT_PROJET.md).
Méthode : [audit documentaire](../README.md).
Inventaire exhaustif de départ : [INVENTAIRE.md](2026-09-04/INVENTAIRE.md).

## Classement et relais actifs

| Source avant rangement | Archive | Décision et relais |
| --- | --- | --- |
| `AGENTS.md` | [Photographie](2026-09-04/AGENTS-avant-rangement.md) | Remplacé : règles conservées, journal et état mouvant sortis du fichier automatique. [Référence](../../AGENTS.md). |
| `map.md` | [Photographie](2026-09-04/map.md) | Remplacé : carte des points d'entrée, sans historique de chaque déploiement. [Référence](../../map.md). |
| `TODO.md` | [Photographie](2026-09-04/TODO.md) | Fusionné : doublon du suivi commerce ; décisions ouvertes conservées. [Référence](../../_DOCS/commerce/COMMERCE_REPRISE.md). |
| `jean.md` | [Photographie](2026-09-04/jean.md) | Fusionné : note brute de besoin back-office intégrée aux contrats existants. [Référence](../../_DOCS/admin/BACKOFFICE.md). |
| `facture.md` | [Photographie](2026-09-04/facture.md) | Fusionné : cahier de conception factures ; contrat actif dans le back-office. [Référence](../../_DOCS/admin/BACKOFFICE.md). |
| `TEST_COMMERCE_SANDBOX.md` | [Photographie](2026-09-04/TEST_COMMERCE_SANDBOX.md) | Remplacé : ancienne fenêtre commerce et lanceur de recette devenus trompeurs. [Référence](../../_DOCS/quality/RECETTE_CLIENT_ADMIN.md). |
| `TEST_CLIENT_ADMIN_LUNA.md` | [Photographie](2026-09-04/TEST_CLIENT_ADMIN_LUNA.md) | Remplacé : lanceur lié à un modèle ; procédure unique et skill conservés. [Référence](../../_DOCS/quality/RECETTE_CLIENT_ADMIN.md). |
| `audit/2026-08-09_AUDIT_CHATGPT_ULTRA.md` | [Photographie](2026-09-04/audit/2026-08-09_AUDIT_CHATGPT_ULTRA.md) | Obsolète comme état courant : photographie de modèle/runtime et de limites anciennes. [Référence](2026-09-04/audit/2026-08-09_AUDIT_CHATGPT_ULTRA.md). |
| `_DOCS/email/RECETTE_EMAILS_LUNA.md` | [Photographie](2026-09-04/_DOCS/email/RECETTE_EMAILS_LUNA.md) | Remplacé : matrice M01–M13 et règles utiles transférées dans la recette unique. [Référence](../../_DOCS/quality/RECETTE_CLIENT_ADMIN.md). |
| `_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md` | [Photographie](2026-09-04/_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md) | Fusionné : conception dans le runbook ; publication réelle reste à requalifier. [Référence](../../_DOCS/admin/INSTAGRAM_OAUTH_RUNBOOK.md). |
| `_DOCS/security/STABILISATION_SECURITE_SANDBOX.md` | [Photographie](2026-09-04/_DOCS/security/STABILISATION_SECURITE_SANDBOX.md) | Fusionné : preuve sandbox historique, sans extrapolation à la production. [Référence](../../_DOCS/security/SECURITE_GLOBALE.md). |
| `_DOCS/commerce/COMMERCE_SYNTHESE.md` | [Photographie](2026-09-04/_DOCS/commerce/COMMERCE_SYNTHESE.md) | Remplacé : synthèse contractuelle courte, état sandbox durable corrigé. [Référence](../../_DOCS/commerce/COMMERCE_SYNTHESE.md). |
| `_DOCS/commerce/COMMERCE_REPRISE.md` | [Photographie](2026-09-04/_DOCS/commerce/COMMERCE_REPRISE.md) | Remplacé : décisions ouvertes et gates conservées sans anciens scripts opérateur. [Référence](../../_DOCS/commerce/COMMERCE_REPRISE.md). |

## Conservation

Neuf anciens emplacements ont été retirés ; leur contenu est récupérable ici.
Quatre documents maintenus ont une photographie avant réécriture.
Seuls un bandeau historique, les destinations des liens Markdown et quatre
fins de ligne de l'audit Ultra ont été ajustés dans les copies.
Les noms techniques cités restent des noms historiques.

L'ancien AGENTS est volontairement nommé `AGENTS-avant-rangement.md` :
aucune nouvelle consigne automatique `AGENTS.md` n'est créée dans l'archive.
`.ignore` exclut ce dossier des recherches `rg` ordinaires, pas de Git.
Une recherche historique explicite reste possible :

```bash
rg --no-ignore -n "expression exacte" doc/archives
```

Ne pas remettre une ancienne procédure en service par simple copie. Recouper
avec le code actuel, les contrats maintenus et l'autorisation de la tâche.
