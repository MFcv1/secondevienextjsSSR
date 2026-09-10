# Qualification empirique du cycle des événements

10 septembre 2026. Protocole du [plan technique](../infra/FIABILITE_EVENEMENTS.md).
**Matrice à qualifier par lot ; les preuves restent propres à chaque scénario.**
Les [résultats d'implémentation](../infra/EVENEMENTS_IMPLEMENTATION_2026-09-10.md)
distinguent tests locaux, Emulator et retrait cloud des anciens schedulers.
La [qualification cloud du même jour](../infra/EVENEMENTS_CLOUD_2026-09-10.md)
consigne les scénarios effectivement exercés et les gates encore ouvertes.
Les 230 tests locaux du prototype précédent ne prouvent pas les nouvelles garanties.
Commandes et restrictions : [QUALITE_TESTS.md](QUALITE_TESTS.md).

## Méthode et preuves

Commencer par le pilote expiration des liens. Utiliser horloge contrôlée et
injection de panne locale, puis émulateur pour les transactions concurrentes,
puis recette sandbox bornée pour transport/IAM/retries réels. Ne pas simuler
un succès cloud dans un double de test. Les tests Stripe sensibles conservent
leurs restrictions et leur autorisation propre.

Chaque preuve contient révision de code, environnement, configuration, période
UTC exacte, jeu de données, résultat attendu/réel et identifiants expurgés.
L'oracle est l'état métier durable et, si nécessaire, le fournisseur ; pas
uniquement le log du handler ni la projection qui est elle-même testée.

## Matrice obligatoire

| Scénario injecté | Preuve attendue |
| --- | --- |
| Aucun objet actif, aucune action ; horloge avancée 7 jours | Zéro tâche/scan métier créé ou exécuté dans le périmètre migré ; distinguer les métriques infrastructure |
| Création puis expiration normale | Intention dans le commit, tâche liée, effet et résultat durable uniques |
| Échec de transaction / callback réexécuté | Ni intention orpheline ni appel externe dans le callback |
| Crash après commit avant enqueue | Reprise automatique du dispatch, même identité d'effet |
| Enqueue réussi puis crash avant confirmation | Rejeu sans double effet ; état de dispatch finit cohérent |
| Doublon d'événement/tâche et événements inversés | Version courante respectée, compteurs analytiques non doublés |
| Prolongation, annulation ou paiement avant expiration | Ancienne tâche inoffensive ; nouvelle échéance couverte ; aucune annulation d'une commande payée |
| Deux workers / lease expiré | Fencing empêche l'ancien worker d'écraser le nouveau résultat |
| Crash après effet externe avant confirmation locale | Réconciliation fournisseur ; aucun second effet financier ambigu |
| Queue suspendue / invocation refusée / worker jamais démarré | Alerte reçue sans dépendre du handler ; opération retrouvable et reprise testée |
| Retry épuisé / fenêtre transport dépassée | Aucun silence présenté comme succès ; incident corrélé, réparation bornée prouvée |
| Upload incomplet / finalisation bloquée ou concurrente | Échéance liée à la session, tentatives bornées, publication CAS préservée |
| Webhook manquant puis tardif, inbox failed ou lease dépassé | États distingués, incident résolu après preuve métier, stock/paiement appliqués une fois |
| Session longue puis inactive ; frontière jour/mois | Pas de tâche par heartbeat ; clôture et agrégats corrects après rejeu partiel |
| Panne de projection admin | Action métier conservée ; projection marquée indisponible ou en retard, puis reconstruite |
| Amorçage ancien stock d'opérations, coexistence et rollback | Aucun objet oublié, aucun double effet, comptages avant/après concordants |

Pour chaque travail critique, vérifier l'invariant : toute intention acceptée
est soit terminée, soit en attente avec échéance/livraison connue, soit en
attention explicitement visible. Tester aussi l'alerte défaillante et consigner
la limite de détection ; un journal durable seul n'est pas une alerte.

## Mesurer l'efficacité sans déplacer le coût

Comparer ancienne et nouvelle stratégie sur les mêmes charges : inactivité,
activité normale, rafale, pannes. Mesurer invocations Functions, durée CPU/mémoire,
créations/livraisons Cloud Tasks, lectures/écritures Firestore, volume de logs,
surveillance et latences p50/p95 de fin de traitement. Ventiler travail utile,
reprises, doublons et tâches obsolètes. Inclure le coût ponctuel de migration.

Fixer avant la recette un budget par opération et un délai maximal par type
d'effet, puis les inscrire dans le rapport du pilote. Valeurs encore à mesurer :
ne pas inventer un pourcentage d'économie ni qualifier « validé » un seuil vide.
À vide : zéro scan métier. Sous activité : coût total comparé, pas seulement
nombre de Functions. Une optimisation qui dégrade la fiabilité échoue la gate.

## Performance et Incidents

- Geler la même borne de fin UTC ; comparer 1 h, 6 h, 24 h, 3 j, 7 j pour
  Incidents, puis les fenêtres disponibles dont 7 j/30 j pour Performance.
- Distinguer occurrences dans la fenêtre, groupes dédupliqués et compteur
  historique. Tester les événements aux bornes et leur arrivée tardive.
- Comparer API Google Logging/Monitoring et projection sur mêmes ressources,
  filtres et délais d'ingestion ; vérifier pagination, limites et échantillonnage.
- Séparer 4xx, 5xx, exceptions applicatives, refus sécurité et tentatives ;
  un 4xx n'est pas automatiquement une attaque, un HTTP 200 ne prouve pas
  un succès métier. Une console d'incidents n'est pas un audit de sécurité.
- Inclure les logs HTTP et erreurs sans severity ; signaler toute couverture
  partielle et donnée manquante. Identifier App Hosting séparément des Functions.
- Rejouer un jeu connu avec exactement N opérations/occurrences ; vérifier
  compteurs, moyennes pondérées, p95 et retard de projection. Préserver consentement
  et exclusion admin pour l'analytics de navigation, distincte du suivi technique.

## Décision finale par lot

Le rapport coche séparément : revue de code, tests locaux, concurrence réelle,
transport et alerte cloud, reprise, coût, migration et rollback. Toute preuve
manquante laisse sa gate ouverte. Une recette sandbox réussie ne garantit pas
« parfaitement pour toujours » ; elle définit les scénarios et limites établis.
Aucun scheduler retiré sur la seule base des tests unitaires.
