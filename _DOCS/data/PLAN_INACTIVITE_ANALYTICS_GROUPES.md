# Analytics — plan de vérification des sessions par groupes

10 septembre 2026. **Implémentation locale, activation cloud non effectuée.**
Résultats et gates restantes : [rapport d'implémentation](INACTIVITE_GROUPES_IMPLEMENTATION_2026-09-10.md).
Demande : réduire le coût du contrôle d'inactivité lorsque les visites augmentent,
en conservant la présence visible dans l'admin et les résultats Data.
Contrat : [fiabilité des événements](../infra/FIABILITE_EVENEMENTS.md).
État livré servant de comparaison : [bascule événementielle](../infra/EVENEMENTS_CLOUD_2026-09-10.md).

## Décision proposée, en mots simples

Conserver les messages « je suis là » et « je pars ». Remplacer uniquement
les contrôles d'inactivité individuels par des contrôles de petits groupes.
Créer un groupe uniquement s'il contient une visite à vérifier ; aucun réveil
permanent lorsqu'il n'y a personne. Diviser un groupe chargé en plusieurs morceaux
pour qu'une seule grosse opération ne bloque pas les suivantes.

Le gain espéré concerne les tâches et leurs invocations, pas la disparition de
toutes les lectures par visiteur. Les inscriptions dans les groupes ajoutent
des écritures : comparer le coût complet avant d'activer le remplacement.
La conception est cohérente avec les écritures transactionnelles existantes ;
sa rentabilité et sa capacité restent des gates à prouver.

## Comportements à conserver

| Situation | Résultat attendu |
| --- | --- |
| Page visible | Signal de présence environ toutes les 60 s, même sans clic |
| Onglet caché ou fermé | Message de départ, passage hors ligne dès sa réception valide |
| Départ non reçu | Retrait du voyant après 150 s sans nouvelles, réévaluation UI toutes les 10 s |
| Retour sur la page | Signal de présence et réactivation selon les règles de session existantes |
| Contrôle d'inactivité | Clôture durable après au moins 35 min sans signal, jamais avant |
| Visite déjà terminée, supprimée ou exclue | Aucun nouvel effet analytics, aucune recréation de visite |
| Aucun visiteur à suivre | Aucun groupe ni tâche de contrôle créé |

La disparition du voyant n'attend ni 35 min, ni le passage du groupe.
Une page visible sans clic n'est pas considérée absente tant qu'elle envoie
ses signaux. Un signal navigateur de fermeture peut manquer : ne pas promettre
une disparition instantanée garantie.

Le regroupement proposé peut retarder la **clôture durable** de moins de cinq
minutes supplémentaires, hors retard de transport. Cela ne doit ni prolonger
la durée de visite comptée ni changer son affichage en ligne. Ce compromis doit
être vérifié dans les agrégats et la répartition jour/mois avant activation.

## Périmètre et points d'entrée à modifier

- `src/kit/shared/AnalyticsProvider.jsx`, `liveSessionPresence.js` et les lecteurs
  Data servent de contrats de non-régression : ne pas augmenter l'intervalle de
  présence, modifier le consentement ou redessiner l'interface dans ce lot.
- `functions/src/analytics/sessions.js` : création, reprise et messages ordonnés
  de session ; inscription atomique lors d'une création/réactivation acceptée.
- `functions/src/maintenance/durableWork.cjs` et `scheduleActivity.cjs` : séparer
  la nouvelle stratégie du travail individuel existant, sans toucher aux liens,
  paiements ou inbox. Un flag global maintenance ne convient pas à cette bascule.
- `functions/src/analytics/rollups.js` : l'agrégateur appelle actuellement
  `scheduleSessionActivity`. Préserver ses projections métier et son filtre des
  écritures purement techniques ; retirer seulement le dispatch individuel des
  sessions explicitement migrées.
- Ajouter un module pur de calcul d'échéance/partition, un repository de groupes,
  un dispatch événementiel et un worker paginé, privés et observables.
- `firestore.rules`, `firestore.indexes.json`, inventaire de déploiement,
  IAM/queues/alertes : contrats de stockage et transport avant toute activation.

Les fichiers analytics déjà modifiés dans le workspace appartiennent à d'autres
changements : relire leur diff au début de l'implémentation et les préserver.
La collecte, la consolidation regroupée et l'archivage existants restent en place.
Le vieillissement des fenêtres des insights Stats sans événement n'est pas prouvé
par ce lot d'inactivité ; ne pas confondre ces deux garanties.

## Modèle technique proposé

### Échéance et répartition

Paramètre initial à mesurer : créneaux UTC de **5 minutes**. Pour une session,
`eligibleAt = lastActivityAt + 35 minutes`, puis arrondir au prochain créneau.
Répartir les sessions par hash stable dans plusieurs partitions si les mesures
l'exigent. Tester 1, 4 et 16 partitions ; fixer le nombre et une version de
routage avant chaque campagne. Ne pas créer de partition vide.

Une session réactivée porte une nouvelle génération de suivi. Un ancien message,
groupe ou worker ne peut pas fermer cette nouvelle génération. Le nombre de
partitions n'est pas modifié à chaud sans migration explicite.

### Stockage borné et inscription atomique

Architecture retenue après mesure : racines `analytics_inactivity_groups/{groupId}`
et pointeur indexé dans chaque session existante. Aucune sous-collection de membres :
la duplication initialement envisagée ajoutait des lectures et écritures évitables.
Pas de tableau de sessions ni de compteur global écrit à chaque visite.

- Racine : version de format/routage, échéance, état, génération de livraison,
  lease, progression, tentatives, dates de fin et de rétention.
- Session : mode de suivi et référence/génération du groupe courant.
  Une requête bornée utilise `sessionActive == true` et `inactivityGroup.groupId`.

Écrire session et inscription dans la **même transaction** autoritaire. Créer la
racine seulement si nécessaire, sans la réécrire ni incrémenter son compteur pour
chaque inscription. Lire son état pour interdire une inscription après scellement.
Un conflit se rejoue sans appel Cloud Tasks dans le callback transactionnel.
Les lectures de racine et conflits restent mesurés : partitionner n'élimine pas
automatiquement toute contention.

Rules : aucun accès navigateur aux groupes. Index composite sur les deux champs
de sélection des sessions. TTL à 14 jours sur les racines réussies, affecté seulement
au commit terminal du moteur durable. Les travaux en attention restent conservés
jusqu'à traitement opérateur et leur accumulation doit être surveillée. Les sessions
gardent leur rétention existante. Chiffrer les suppressions TTL dans le coût cloud ;
aucun nettoyage global périodique ajouté.

### Déclenchement et traitement

1. La création durable d'un groupe déclenche son enqueue pour l'échéance du groupe.
   Identité de tâche déterministe, confirmation durable et retry Eventarc ; un
   crash entre commit et enqueue ne doit perdre aucun groupe.
2. Le worker prend un lease et scelle les inscriptions avant de lire les sessions.
   L'inscription choisit un créneau futur ; une racine scellée est refusée, et un
   retry recalcule le créneau depuis l'heure courante. Aucun ajout dans un lot fermé.
3. Lire une page bornée de **100 sessions**. Relire chaque
   session et sa génération avant toute décision. Ne pas faire une transaction
   géante portant sur tout le groupe.
4. Session terminée/supprimée : elle sort naturellement de la requête. Session
   exclue/admin : retirer son pointeur sans changer les faits métier. Session toujours
   présente : déplacer son pointeur et créer le prochain groupe atomiquement.
   Session réellement inactive : fermer la session sans modifier durée ou dernier
   signal. Chaque opération vérifie le propriétaire et le lease frais.
5. Une page peut être rejouée sans double résultat. Pas de curseur : chaque session
   traitée quitte la sélection par fermeture ou déplacement atomique. Une erreur
   laisse la session sélectionnable au retry. Si nécessaire, continuation durable
   après une seconde, attachée au groupe existant.
6. Terminer le groupe lorsque toutes ses pages sont traitées. Aucune tâche ne
   reprogramme le même groupe vide. Un groupe en échec produit une alerte corrélée
   et permet une reprise opérateur précise, sans scan permanent.

Un heartbeat accepté ne déplace pas le pointeur et n'ajoute pas de tâche. Le groupe
recalcule l'échéance depuis l'état frais de la session lors de son passage.
La fermeture normale reste immédiate et retire la session de la sélection sans
écriture supplémentaire de nettoyage. La tâche du groupe déjà programmée subsiste :
elle peut constater un groupe vide une seule fois, puis se termine définitivement.

## Lots d'implémentation et critères de sortie

| Lot | Livrable | Condition de sortie |
| --- | --- | --- |
| 1. Référence | Compteurs du système actuel et générateur de visites à horloge contrôlée | Même jeu de données, mêmes résultats attendus, configuration et révision enregistrées |
| 2. Noyau | Calcul des groupes et transitions de session/membre/groupe, sans réseau | Invariants, générations, bornes temporelles et doublons testés |
| 3. Stockage | Transactions d'inscription, déplacement, clôture et pagination ; rules/rétention | Tests Firestore Emulator avec vrais conflits, refus client et reprise après crash |
| 4. Transport | Enqueue, worker privé, continuations, IAM, alertes et réparation | Livraison autorisée, refus anonyme, panne et notification réellement exercés |
| 5. Charge | Comparaison individuel/groupé, lectures et écritures incluses | Gain et capacité prouvés aux charges retenues ; aucun chiffre métier différent |
| 6. Bascule | Producteurs compatibles, migration bornée, activation progressive et retour arrière | Couverture complète des sessions, pas de double propriétaire de clôture, preuve après activation |

## Tests obligatoires

- Présence : ouverture, page visible sans clic, navigation, fermeture, arrière-plan,
  retour, coupure réseau, départ non reçu. Les délais du voyant restent identiques.
- Identité : deux onglets, admin exclu, consentement retiré, suppression TTL,
  messages dupliqués ou inversés, reprise avec nouvelle génération.
- Temps : juste avant/après 35 min, frontière du créneau, minuit, mois et changement
  d'heure ; jamais de fermeture anticipée, durée conservée et attribution inchangée.
- Concurrence : dernière inscription pendant scellement, réactivation pendant
  fermeture, deux workers, lease expiré, déplacement pendant retry.
- Pannes : commit refusé, crash après commit/enqueue/effet/avant curseur, membre
  illisible, queue suspendue, retries épuisés, reprise opérateur.
- Pagination : groupe dépassant plusieurs pages, doublons et échecs au milieu,
  aucune session sautée, aucune boucle infinie ni chargement non borné.
- À vide : sept jours simulés, zéro groupe/tâche créé ; après fin de toutes les
  visites, seuls les travaux déjà justifiés se terminent, puis aucun réveil.
- Résultats : mêmes visites, durées, parcours et agrégats Data entre les variantes ;
  vérifier les documents autoritaires, pas seulement les logs du worker.

## Mesure de charge et décision économique

Tester localement/émulateur des cohortes de 1, 100, 1 000 et 10 000 sessions,
puis trafic étalé et rafale. Inclure visites courtes, longues, retours fréquents
entre onglets et pertes de réseau. Ces tailles sont des scénarios techniques,
pas une estimation de fréquentation ni une autorisation de charge cloud massive.

Comparer sur les **mêmes arrivées et mêmes messages de présence** :

- tâches créées/exécutées, continuations, retries et contrôles devenus inutiles ;
- invocations et temps CPU/mémoire, événements déclenchés par les écritures de suivi ;
- lectures/écritures/suppressions Firestore, taille stockée, contention et logs ;
- délai p50/p95/max de clôture après l'échéance, backlog et vitesse de résorption ;
- coût total par 1 000 sessions, en distinguant collecte commune et maintenance.

Ne pas déduire un prix cloud d'un chronométrage Emulator. Avant recette hébergée,
fixer un volume, une durée et un plafond de dépenses explicites ; relever les tarifs
alors applicables. Commencer petit, augmenter seulement si le palier précédent
reste sain. Arrêter l'injection si le backlog croît sans se résorber, si les chiffres
divergent ou si le plafond est atteint. Aucun visiteur synthétique dans les chiffres
cliente : utiliser l'exclusion existante et vérifier le retrait après chaque lot.

Cibles initiales à vérifier : zéro perte/double comptage, aucun effet sur les délais
du voyant ; clôture jamais avant 35 min, attente liée au regroupement < 5 min,
p95 de retard du transport < 60 s à la charge cible, et traitement du pic plus
rapide que l'arrivée soutenue retenue. Ce sont des critères de recette, pas un SLA
déjà démontré. Budget économique accepté seulement après mesure : ne pas remplacer
le système actuel si le coût total augmente à la charge cible ou si le faible trafic
subit une régression non justifiée. Un résultat négatif reste un résultat valable.

## Migration et retour arrière

Flag propre à l'inactivité analytics, mode inscrit par session et support simultané
des deux formats. Livrer lecteurs/worker compatibles avant les producteurs.
Pas de fermeture par les deux stratégies : le worker individuel doit ignorer une
session devenue groupée, et inversement. Les tâches déjà en file peuvent terminer
en no-op ; les comptabiliser dans le coût ponctuel de migration.

Inventorier les sessions actives par pages avec dry-run, sauvegarde des seuls champs
de suivi et préconditions de version ; migrer atomiquement le propriétaire et
l'inscription, sans changer `lastActivityAt`, les parcours ou la durée. Vérifier
ensuite qu'aucune session active n'est sans suivi. Un mode d'observation éventuel
reste borné, sans effet de clôture et sans être laissé en double fonctionnement.

Après qualification seulement, arrêter la création des tâches individuelles pour
les nouvelles sessions. L'ancien scan toutes les 15 minutes reste PAUSED ; aucun
secours récurrent n'est réintroduit. Ne pas retirer les anciens handlers tant que
des tâches ou sessions de l'ancien format en dépendent.

Retour arrière : les nouvelles sessions reviennent au mode individuel ; migrer les
sessions groupées actives vers une intention individuelle dans une transaction
contrôlée. Les groupes constatent le changement de propriétaire et n'ont plus
d'effet. Conserver les preuves, ne pas remettre un scan global en service par défaut.

Mettre à jour le chapitre analytics, l'inventaire, le rapport de coût/charge et l'état
du projet à chaque gate franchie. L'implémentation locale ne vaut pas preuve de
déploiement, de coût cloud ou de capacité réelle.
