---
name: client-admin-test
description: Exécuter ou requalifier la recette humaine client/admin de Seconde Vie sur sandbox avec Chrome externe, Gmail et Stripe test, sans corriger le code. Utiliser pour une demande de recette de bout en bout ou $client-admin-test ; ne pas exécuter la campagne lors d'un simple audit documentaire du skill.
---

# Recette client / administrateur

## Mission et périmètre

L'agent du chat exécute la campagne autorisée jusqu'à son bilan, indépendamment
de son modèle. Un seul agent contrôle Chrome ; aucune délégation automatique.
Il teste et consigne les défauts, sans correction, commit, déploiement ou
modification des protections. Les corrections nécessitent une tâche distincte.

Lire la [procédure canonique](../../../_DOCS/quality/RECETTE_CLIENT_ADMIN.md)
en entier, puis les entrées pertinentes d'[anomalies.md](../../../anomalies.md).
Les règles transverses sont dans [AGENTS.md](../../../AGENTS.md).
Ne pas charger les anciens plans de juillet ou l'archive par défaut.

Le prompt utilisateur de campagne porte les autorisations Chrome/Gmail,
changements de comptes, OTP non exposés, données fictives, publications,
paiements et refunds Stripe test bornés. Ne pas les redemander si elles sont
déjà explicites ; une sélection implicite du skill ou sa lecture pour audit
ne crée pas ces autorisations. Les protections imposées par la plateforme
restent prioritaires.

## Exécution

1. Vérifier projet/origine sandbox, comptes client/admin exacts, Stripe test,
   contrôle commerce réel et santé initiale. Définir runId et produits exacts.
2. Utiliser Chrome externe via la liaison de contrôle disponible et autorisée.
   Lire sa documentation dynamique ; ne pas dépendre d'un ancien skill
   `chrome:control-chrome` absent de l'environnement.
3. Choisir les comptes déjà connectés via Google, contrôler l'adresse visible,
   lire uniquement les deux boîtes de recette autorisées. Un compte personnel
   visible dans le sélecteur n'autorise pas la lecture de sa boîte.
4. Accomplir la matrice M01–M13, les deux commandes livraison/retrait, la
   publication/archivage d'un smoke, les documents et contrôles client/admin.
   Les contraintes précises et la gate M12/M13 sont dans la procédure.
5. Comparer l'état autoritaire avant toute reprise financière. Consigner les
   anomalies au fil de l'eau et poursuivre les scénarios indépendants.
6. Rapprocher les effets et résidus ; rendre le bilan complet de la procédure.

## Points qui évitent les erreurs historiques

- Le sandbox est ouvert durablement depuis le 25 août. Ne pas exiger
  `v2_fixture/read_only` ni le restaurer à la fin par habitude.
  Une fenêtre temporaire ne s'ouvre/se ferme que dans le mandat correspondant.
- `CORRIGEE_A_REQUALIFIER` est une instruction de test, pas un blocage.
- Timeout, mauvais compte ou onglet absent : récupération sûre et différente.
  Ne pas rendre un checkpoint intermédiaire comme résultat final.
- Intervention humaine uniquement devant une protection réellement présentée,
  une autorisation manquante ou un état dangereux/ambigu ; continuer les
  lectures et scénarios indépendants sûrs.
- Ne jamais exposer/conserver OTP, mots de passe, PIN, cookies, tokens ou données
  de carte. Ne jamais contourner biométrie, CAPTCHA, refus de politique ou accès.
- Aucun paiement réel, aucune production, aucun restock implicite après refund.
- Rapport : distinguer réussi/échec/bloqué/non exécuté, prouver les contrôles
  finaux du mode choisi, lister les résidus. Ne pas annoncer une recette verte
  si une preuve obligatoire manque.
