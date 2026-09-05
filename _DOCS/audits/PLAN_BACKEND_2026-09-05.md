# Améliorations backend proposées — 5 septembre 2026

Statut : `PROPOSITION — AUCUN_LOT_IMPLEMENTE_OU_DEPLOYE`.
Base : [audit et preuves BA-01 à BA-13](AUDIT_BACKEND_2026-09-05.md).

Après qualification navigateur : le [plan d’implémentation I0 à I9](IMPLEMENTATION_BACKOFFICE_POST_QUALIFICATION_2026-09-05.md)
précise les priorités et critères à partir des démarrages corrélés et des
constats QBO. Utiliser ce dernier pour conduire l’exécution ; les propositions
et explications architecturales ci-dessous restent leur référence.

L’objectif est de conserver le socle Firebase/Next et de rendre ses garanties
uniformes. L’ordre proposé privilégie la justesse des données, puis le temps
d’accès et le coût total. Il ne demande pas une réécriture préalable à la
présentation cliente. Les changements de capacité restent compatibles avec
`minInstances:0` ; aucune valeur proposée ci-dessous n’est une consigne de
déploiement automatique.

## Ordre et décisions

| Lot | Résultat attendu | Constats | Dépendances |
| --- | --- | --- | --- |
| A | Compteurs et sessions qui convergent malgré le désordre | BA-01 à BA-04 | Définir les baselines et versions avant réparation |
| B | Reprise outbox à la bonne échéance, sans réenvoi ambigu | BA-09 | Vérification atomique avant hausse des retries |
| C | Données admin explicites, cache lié aux droits, listes parcourables | BA-08, BA-11, BA-12 | A pour qualifier la justesse des compteurs |
| D | Moins de travail au premier appel et capacité adaptée aux lecteurs | BA-05 | Mesure avant/après ; aucune dépendance à une migration Gen1 |
| E | Coût analytics et stockage bornés sans perte de corrections | BA-06, BA-07, BA-13 | A ; baseline de compaction avant suppression |
| F | Signal catalogue léger et cache immuable validé | BA-10 | Préserver la sélection de release saine et le CAS |

Pour une présentation proche : commencer par A et les états trompeurs de C,
puis qualifier les écrans montrés. B est prioritaire si les e-mails font partie
de la démonstration. D apporte le gain structurel sur les démarrages ; E ferme
la dette de montée en charge. Le builder catalogue incrémental de F ne devient
prioritaire qu’avec une mesure de coût ou de durée qui le justifie.

## A — Fiabilité des compteurs et du collecteur

### Changement proposé

- Retours : calculer `contribution courante - contribution déjà appliquée`,
  après lecture transactionnelle de la source et du ledger. Une suppression
  doit conserver une trace suffisante pour absorber les événements tardifs.
- Newsletter : donner une identité aux contacts comptés dans la baseline.
  Initialiser un total sans ses appartenances ne permet pas de distinguer un
  ancien contact d’une création dont l’événement est arrivé en retard.
- Faits historiques : relire la source/exclusion et mémoriser sa version ;
  refuser la régression, gérer les suppressions et la propagation des
  corrections jour → mois/année → insights.
- Collecteur : un numéro de génération et une séquence commune à sync/beacon,
  contrôlés atomiquement côté serveur. Distinguer la reprise volontaire d’une
  session d’un paquet ancien ; conserver une règle explicite pour plusieurs
  onglets et la fermeture. Traiter les réponses `{success:false}` côté client.

### Preuve de réception

Les quatre reproductions doivent devenir des tests attendant le bon résultat,
et non simplement échouer après une modification. Couvrir créations,
modifications, exclusions, suppressions, doublons et permutations ; tester une
baseline non vide, un événement pendant son bootstrap, une recréation du même
identifiant et un ancien événement après compaction. Le total final doit égaler
la somme des contributions autoritaires, sans compteur négatif ni fait régressif.

La réparation de données hébergées est une opération distincte : simulation
bornée, écarts comptés, sauvegarde, checkpoint et reprise idempotente. Ne pas
recalculer un total à chaud puis le remplacer sans contrôler les écritures
arrivées pendant le scan. Rejouer uniquement une projection ; jamais un effet
Stripe, un mouvement financier ou un envoi d’e-mail pour réparer une statistique.

## B — Reprise outbox

Contrôler dans la transaction de prise le statut, la version de tentative,
`nextAttemptAt` et le lease. Une tâche en retard ou trop tôt ne doit pas déclencher
l’effet. Le mécanisme doit garantir qu’une tâche admissible ou une reprise
planifiée existe toujours après le refus d’une tâche périmée.

Tester les interruptions avant prise, après prise, avant envoi, après réponse
fournisseur et avant persistance. Vérifier qu’une indisponibilité Firestore
n’attend plus systématiquement le secours horaire. Définir ensuite un nombre
borné de reprises Cloud Tasks et une fenêtre de reprise mesurable ; conserver
le scheduler comme filet de sécurité et rendre visible l’âge du plus vieux
travail admissible. Une cible initiale à discuter est une reprise connue en
moins de cinq minutes, distincte d’une garantie de livraison.

Un résultat SMTP incertain reste `delivery_unknown` et demande une décision
explicite. Les reprises de transport ne doivent pas introduire de double envoi.
L’acceptation SMTP ne prouve pas la réception en boîte et ne crée pas une
idempotence fournisseur. Aucun passage à Resend n’est inclus dans ce lot.

## C — Lecture admin utile et complète

1. Attacher le cache partagé à l’UID et à une génération d’autorisation ;
   invalider depuis Auth, sur perte de droit et sur refus serveur. Ignorer les
   réponses lancées sous une ancienne génération. Vérifier logout hors admin,
   changement d’utilisateur et révocation à UID identique.
2. Distinguer chargement, absence, erreur, résultat vide, couverture partielle
   et valeur confirmée. Un résumé absent ne vaut pas zéro et une erreur de
   chargement des commandes ne vaut pas « aucune commande ».
3. Retours : réponses de liste minimales ; documents détaillés au clic ;
   dédupliquer les références communes. Une projection de liste n’est ajoutée
   que si l’économie de lectures justifie ses écritures et sa maintenance.
4. Factures : sortir les 300 produits du chargement initial ; les charger au
   choix de pièce avec recherche/pagination. Ajouter un curseur réel aux
   factures, devis et liens de paiement ; filtrer les archives avant pagination.
5. Conserver le détail de la couverture de recherche/export ; ajouter les
   recherches serveur indexées nécessaires au travail de l’atelier.

Réception : une facture ancienne et un devis au-delà de la première page sont
retrouvables ; aucune commande active n’est cachée derrière une page vide
d’archives ; le nombre de produits lus à l’ouverture Factures devient zéro
tant que le sélecteur reste fermé. Les lectures Retours doivent être expliquées
par un compteur d’opérations avant/après, et non par la seule baisse de durée.

La fraîcheur se mesure avec une source attendue et une version projetée,
complétées par le retard de traitement. Ne pas ajouter une écriture de heartbeat
sur chaque résumé pour simuler la fraîcheur quand il n’y a aucune activité.

## D — Démarrage et capacité sans instance chaude permanente

### Première étape : supprimer le travail inutile

Séparer les handlers des décorateurs Firebase, puis différer les dépendances
de domaines qui ne servent pas la cible. Préserver les noms d’exports, régions,
options, secrets attachés, droits, signatures et chemins des triggers. Ne pas
retirer un export utilisé seulement côté cloud sur la foi d’un inventaire local.

Mesurer le graphe chargé avec `FUNCTION_TARGET` pour un lecteur, un collecteur,
un worker financier et les images. Pour le lecteur commandes, Stripe, Sharp,
PDF, mail et WebAuthn ne doivent être chargés que si une dépendance réellement
nécessaire le justifie. Vérifier aussi la découverte des exports au déploiement :
une optimisation conditionnelle ne doit pas faire disparaître des fonctions.

Ne pas présenter le report de tous les imports au premier appel comme un gain.
Mesurer import, premier handler et requête complète. Mutualiser les vérifications
du deployment ID du shell avant d’envisager un endpoint léger dédié.

### Deuxième étape : expérience de capacité ciblée

Comparer, sur quelques lecteurs admin explicitement sélectionnés :

| Profil candidat | Minimum | CPU | Concurrence | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Référence actuelle | 0 | Fractionnaire | 1 | 1 |
| Lecteur candidat | 0 | 1 | 8 puis 16 si la mémoire le permet | 2 puis 3 si nécessaire |

Ce tableau définit des expériences successives, pas une recommandation uniforme.
Mesurer mémoire par requête, contention, refus, délai de queue et coût par
opération réussie. Garder des profils distincts pour images, SMTP, checkout et
transactions analytics. Augmenter les instances d’un projecteur qui écrit sur
un document partagé peut empirer les reprises.

Le regroupement éventuel de quelques lectures dans un service protégé unique
se décide après mesure. Il doit réduire le nombre de démarrages et préserver
l’autorisation par opération. Une API Next qui appelle ensuite les mêmes
Functions ajoute une étape ; un codebase commun ne mutualise pas leurs instances.

## E — Coût analytics, contention et rétention

Établir d’abord une matrice par événement : création, heartbeat, route,
fermeture, exclusion et suppression. Compter source, contrôle, ledger,
agrégats, listener, reprises et CPU. Le nombre de documents lus par l’écran
n’est qu’une partie du coût.

Optimiser par paliers :

1. Mutualiser les lectures source/exclusion compatibles et éviter de recalculer
   des contributions inchangées, sans perdre la version de source utilisée.
2. Mesurer les écoutes maintenues hors Data et dans les onglets navigateur
   masqués. Décider selon le bénéfice d’un retour instantané et le volume reçu.
3. Relever les champs interrogés avant de retirer les index inutiles. Préserver
   les chemins de réparation, notamment `contribution.dateKey`, ou les migrer
   d’abord vers une requête racine jour/shard vérifiée.
4. Rendre les reconstructions paginées et reprenables ; supprimer le plafond
   bloquant des 2 000 faits d’un jour par un traitement du shard pertinent.
5. Si les transactions partagées saturent, répartir les contributions et publier
   les résumés sur une courte fenêtre proposée de 1–5 s. Préserver les corrections
   d’unicité ; un HLL uniquement additif ne sait pas annuler une identité.
6. Définir la compaction des ledgers/buckets : baseline vérifiée, watermark,
   fenêtre de correction et tombstones. Les documents hors fenêtre ne sont
   supprimables qu’après preuve que les événements tardifs ne les recréent pas
   et ne réappliquent pas une contribution déjà compactée.

Réception : exactitude stable sous événements désordonnés, corrections tardives
et plusieurs admins ; moins d’opérations par événement à résultat équivalent ;
borne de stockage explicitée en fonction des sessions et de la durée conservée.
Le gain d’index porte sur stockage/travail d’écriture, pas sur le nombre
d’écritures de document facturées. Une TTL seule ne clôt pas la compaction.

## F — Catalogue et Next

Mettre en cache les résultats de validation des releases immuables par chemin
et empreinte, avec mémoire bornée et déduplication en vol. Continuer à relire
les pointeurs frais ; sélectionner une release réellement valide avant de
répondre sur sa version. Tester pointeur corrompu, objet manquant, empreinte
incorrecte, bascule previous/last-known-good et publication concurrente.

Mesurer les objets téléchargés et le temps de validation de `/api/catalog/version`
sur 200 et 304. Le deuxième appel sur une même release ne doit pas refaire
l’analyse complète déjà validée. Garder séparées revalidation Next et propagation
CDN ; pas d’activation implicite de Cache Components.

Le builder peut rester intégral tant que le catalogue le permet. Si sa durée
ou son coût croissent trop, utiliser le plan d’impact pour reconstruire les
fragments concernés et publier un manifeste atomique. Le lecteur public ne doit
jamais utiliser Firestore comme solution de secours.

## Mesures communes et clôture

Avant chaque lot, figer le code, la révision réellement servie, les options,
le scénario et les unités comptées. Distinguer l’admin propriétaire de l’admin
cliente, qui passe aussi par le contrôle de facturation. La présentation doit
être qualifiée avec les droits réellement utilisés par la cliente.

Pour la latence : séparer première ouverture après inactivité, requêtes chaudes,
retour via cache, OPTIONS, serveur, attente Eventarc et rendu navigateur.
Corréler les cold starts aux journaux d’instance ; un appel lent seul n’en est
pas une preuve. Construire des échantillons suffisants pour comparer les
distributions, pas quelques maxima. Toute campagne hébergée ou de charge reste
une exécution distincte, avec périmètre et plafond convenus.

Objectifs initiaux proposés pour les lectures admin : premier résultat utile
chaud p95 inférieur à 800 ms ; première ouverture après inactivité autour de
3 s ou moins. Ce sont des cibles à discuter avec la cliente et à mesurer, pas
des garanties de Firebase avec min zéro. Rapporter aussi taux d’erreur, données
manquantes, fraîcheur métier et coût : accélérer une réponse incorrecte n’est
pas un succès. Si le besoin exige un démarrage toujours immédiat, réexaminer
explicitement une capacité chaude limitée au chemin critique.

Pour le coût : lectures/écritures et invocations par scénario, événements par
session, CPU/durée/mémoire, index et stockage ; puis rapprochement Billing sur
une période comparable. Ne pas transformer les 17 857 lectures de la fenêtre
d’audit en facture mensuelle ou en coût par visite sans attribution.

Chaque lot se ferme avec tests ciblés, preuve des données, mesure appropriée,
révision livrée lorsque le déploiement est demandé et procédure de retour
arrière. Versionner les contrats de projection si nécessaire ; ne pas remettre
un ancien producteur incompatible avec une nouvelle baseline. Les suites
existantes et les cinq reproductions constituent le départ, pas une preuve de
charge ni une autorisation de fermer les anciennes gates.
