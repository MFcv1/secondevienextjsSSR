# Audits d’architecture et de fiabilité

**Préparation de livraison du 7 septembre : [qualification, blocage et recette utilisateur](2026-09-07-livraison-interactions/README.md).**
Sources enregistrées ; aucune nouvelle livraison sandbox, gate dépendances CLI ouverte.

Créé le 5 septembre 2026 à la demande du propriétaire du projet.

Ce dossier contient les nouvelles campagnes d’audit. Les contrats applicables
restent dans les chapitres de [_DOCS](../README.md) ; les conclusions d’un audit
ne deviennent pas automatiquement des décisions d’implémentation.

| Campagne | Périmètre | Livrables | Statut |
| --- | --- | --- | --- |
| Backend, 2026-09-05 | Firebase/Next, données admin, coût, capacité, fiabilité | [Rapport](AUDIT_BACKEND_2026-09-05.md), [lots proposés](PLAN_BACKEND_2026-09-05.md), [inventaire](preuves/backend-2026-09-05-inventaire.json), [reproductions](preuves/backend-2026-09-05-reproductions.cjs) | Audit livré ; défauts ouverts ; aucun correctif déployé |
| Qualification back-office, 2026-09-05 | Parcours réels admin cliente, concordance, cache/reconnexion et suivi devis borné | [Rapport et preuves locales](QUALIFICATION_BACKOFFICE_2026-09-05.md) | Qualification partielle ; réserves de présentation ; BA-01 à BA-13 non clos ; aucun correctif ni déploiement |

## Règles pour les campagnes suivantes

Suite opérationnelle après qualification :
[plan d’implémentation I0 à I9](IMPLEMENTATION_BACKOFFICE_POST_QUALIFICATION_2026-09-05.md).
Il ordonne les correctifs et les validations ; aucune implémentation ni
livraison n’a été réalisée lors de sa rédaction.

1. Dater le code, le worktree, les ressources et les fenêtres mesurées. Une
   révision `ACTIVE` ne prouve ni son identité avec le code local ni sa fiabilité.
2. Partir des producteurs, consommateurs, requêtes et contrôles exécutables.
   Utiliser les documents pour retrouver un contrat, puis le contredire si la
   preuve le justifie. Ne pas recopier les anciens verdicts de livraison.
3. Attribuer un identifiant stable à chaque constat. Distinguer **défaut
   reproduit**, **constat de code/configuration**, **hypothèse**, **mesure cloud**
   et **preuve manquante**. Une suggestion d’architecture reste une proposition.
4. Pour chaque défaut : préciser déclencheur, impact, fichier/lignes,
   correction minimale, risques de migration et critère de fermeture.
5. Séparer latence de lecture, fraîcheur de projection, démarrage, attente de
   capacité et rendu navigateur. Ne pas additionner des requêtes parallèles
   ni inventer un p95 à partir de quelques appels.
6. Compter lectures/écritures/invocations/index/transferts avant de chiffrer.
   Une métrique Monitoring n’est pas un export Billing ; un cache navigateur
   ne rend pas son producteur gratuit.
7. Les preuves enregistrées sont expurgées : pas de contenu client, token,
   secret, corps de webhook ou export complet de base.
8. Une reproduction doit pouvoir s’exécuter sans infrastructure réelle.
   Les scénarios cloud, E2E, réparations de données et déploiements ont leur
   propre périmètre autorisé. Ne pas les déclencher en lisant un rapport.
9. Clore un constat avec la preuve appropriée : patch, test de régression,
   révision effectivement servie et mesure si nécessaire. Ne pas renuméroter
   les constats anciens ; les nouveaux audits indiquent ceux qu’ils revalident.

## Format d’un prochain rapport

- Décision utile et limites de la conclusion.
- Périmètre, versions et méthode.
- Points solides à préserver.
- Constats hiérarchisés et reproductions.
- Architecture proposée, coûts déplacés et alternatives rejetées.
- Validation, preuves manquantes et conditions de fermeture.
- Sources officielles datées et preuves locales expurgées.

Un rapport n’autorise aucun commit, déploiement, changement IAM ou nettoyage.
Les anciens audits restent historiques ; aucun document n’est déplacé par la
création de ce dossier.
