# Terminer la maintenance sans scans fixes

10 septembre 2026 — **implémentation locale en cours, aucune bascule cloud**.
Source examinée : HEAD `211ff63`, après activation de l'inactivité groupée.
[Audit des cinq contrôles](../audits/2026-09-10-stabilite-fonctions/README.md),
[socle durable](FIABILITE_EVENEMENTS.md),
[analytics groupée déjà livrée](../data/INACTIVITE_GROUPES_CLOUD_2026-09-10.md).
Accès depuis AGENTS.md via l'index documentaire et ETAT_PROJET.md.

## État d'exécution

Base de travail de l'implémentation : `7d21629` (les correctifs Data intervenus
depuis la relecture du plan sont conservés).

- Lots 1–2 : intentions outbox atomiques à la création/claim/échec/fin ; reprise
  d'un lease expiré avant envoi, état ambigu après beginDelivery sans réenvoi.
  Intention unique sur le checkout public, anciens messages invalidés par le
  propriétaire durable ; les liens gardent leur propriétaire existant.
- Lot 3 : intention partagée par cycle de catalogue, récupération bornée à cinq
  passages, échéances de lease/backoff respectées, enregistrement de l'échec de
  revalidation non avalé, rollback/reconstruction manuels armés. Une rafale partage
  l'identifiant du build encore à venir. La clôture recontrôle l'état catalogue
  dans sa transaction pour préserver une mutation concurrente.
- Scripts locaux : trois nouvelles cibles de déploiement (expiration checkout,
  planificateur et worker cycle catalogue), adaptation des deux queues commerce,
  bootstrap paginé et reprise versionnée étendus. La génération de politiques
  inclut ces queues ; **aucune politique cloud modifiée dans cette étape**.
- Lot 4 local : marqueurs journée et watermark global dans les transactions
  autoritaires des runtimes checkout, annulation, paiement, refund, retour et
  commandes admin. Comparaison indépendante des faits du jour aux rollups et des
  commandes aux projections ; contrôle concurrent rejeté si le watermark change.
  Journées comptables UTC conservées, rendez-vous à 03:17 Paris le lendemain,
  rattrapage tardif regroupé à cinq minutes. Santé lue explicitement et partagée
  une minute par instance ; aucun faux rafraîchissement permanent d'un ancien relevé.
- Lot 5 local : cohortes médias marquées avec les candidats, registre releases
  alimenté par finalisation Storage relivrable, pages de 25, relais au plus à
  28 jours, reprise des protections lors d'une nouvelle version/changement de
  pointeur. Worker exclusivement dry-run, sans chemin de suppression automatique.
  Une activation destructive future exigerait le fence publication/suppression
  et rattachement média : **elle n'est pas livrée ni activable par ce worker**.

Les nouveaux producteurs d'intentions restent désactivés par défaut : activation
explicite `COMMERCE_EVENT_MAINTENANCE_MODE=durable` et
`CATALOG_EVENT_MAINTENANCE_MODE=durable`. Les objets déjà migrés gardent leur
propriétaire si le mode est retiré. Déployer et qualifier les consommateurs,
leurs queues privées et leurs alertes **avant** les producteurs (Functions et
runtime Hosting concernés), puis migrer les objets existants avec sauvegarde.
Le bootstrap explicite prépare le nouveau mode même avant activation des
producteurs ; ne l'exécuter qu'après qualification des consommateurs.

Tests locaux sans réseau : **378/378 réussis**, nouvelles suites `outbox-maintenance`,
`reservation-maintenance`, `catalog-cycle`, plus domaines/fautes/résilience
commerce, catalogue, socle durable, inactivité groupée et opérations événements.
Sept tests supplémentaires réussissent sur l'émulateur Firestore, dont vraies
transactions concurrentes/avortées, watermark concurrent, ambiguïté outbox et
continuation GC. Build Next de production réussi (55 pages).
La simulation de sept jours n'est pas sept jours observés en cloud.
Les gates ci-dessous restent ouvertes : injection de
pannes aux frontières Storage/CAS réelles, preuve IAM/transport/alertes sandbox,
inventaire et migration des objets legacy. **Ne suspendre aucun des cinq scans
sur la seule base des tests unitaires.** Aucun commit ni déploiement effectué.

## Décision, en mots simples

Conserver les protections, remplacer les rendez-vous fixes par des rendez-vous
justifiés. Une action commerce a sa reprise propre. Les contrôles de finance et
de nettoyage partagent un rendez-vous lorsqu'ils concernent plusieurs éléments.
Pas de tâche par visiteur supplémentaire ; analytics ne change pas dans ce chantier.

| Contrôle actuel | Cible retenue | Ce que l'on conserve |
| --- | --- | --- |
| Actions commerce en attente, horaire | Envoi et reprise attachés à l'action et à son étape réelle | Protection contre double envoi et résultat fournisseur inconnu |
| Réservations expirées, horaire | Échéance durable attachée au checkout, mise à jour lors d'une prolongation | Paiement confirmé prioritaire, annulation fournisseur avant libération du stock |
| Catalogue, horaire | Une reprise par cycle de publication, regroupant les modifications proches | Vérification version servie, pointeurs, rollback, contrôle manuel complet |
| Commandes/finance, quotidien | Un contrôle regroupé après une journée ayant changé + contrôle explicite si nécessaire | Rapprochement indépendant, incidents et fraîcheur honnête de l'admin |
| Médias/releases, quotidien | Groupes de candidats réellement existants, à leur échéance | Quarantaine, rétention, générations Storage et versions protégées ; dry-run actuel |

Cible : supprimer **74 lancements fixes/jour**, soit 518/semaine. Ce chiffre
n'est pas le gain net : les événements, écritures, continuations, reprises et
contrôles sollicités ont un coût à mesurer. Un groupe créé puis vidé peut encore
recevoir sa livraison déjà programmée une fois ; il ne repart pas en boucle.

## Contrat commun à tous les lots

1. Inscrire l'intention dans la transaction métier qui la justifie. Une panne
   après commit et avant enqueue doit laisser un travail durable et relivrable.
2. Réutiliser `durableWork.cjs` pour le transport, les identités, leases, retries
   bornés et réparation, sans remplacer les fences et clés métier existantes.
   Une seule stratégie propriétaire par objet, écrite explicitement et migrable.
3. Éviter les doubles garde-fous : recenser tâches existantes et échéances ; ne
   pas ajouter un second contrôle équivalent lorsque le premier est déjà durable.
   Les notifications de bookkeeping sont filtrées ; pas d'auto-boucle d'écritures.
4. Une reprise relit l'état autoritaire. Un message ancien ne remet jamais une
   commande payée en attente, ne ferme pas une réservation prolongée et ne publie
   pas une version dépassée. Plafond initial cinq essais métier par génération,
   puis needs_attention ; conserver les backoffs métier plus stricts existants.
5. Alertes de livraison, backlog réellement en retard, retries épuisés et opérations
   bloquées. Relier l'incident à l'objet et à sa génération. Reprise opérateur
   explicite/versionnée, sans ressusciter de travail terminé ni rejouer un effet ambigu.
6. Nouvelles collections uniquement avec rules privées, indexes et rétention.
   Succès techniques : rétention 14 jours proposée, audit de reprise 180 jours ;
   besoins métier et travaux en attention gardent leur conservation actuelle.
   TTL sert à retirer une preuve terminale, jamais à déclencher une action métier.
7. Préserver queues et identités par domaine. Ne pas faire une méga-fonction avec
   tous les secrets, ni élargir les droits analytics aux paiements ou aux médias.

## Lot 1 — outbox : terminer la reprise de l'action

### Cause actuelle

`commerceEventDispatch.js` programme pending/failed. `outboxRepository.js` pose
processingUntil au claim ; `outboxSchedule()` ignore processing. La queue d'envoi
n'a qu'une tentative de transport. Le scan horaire rattrape notamment un processus
arrêté après le claim. Simplement augmenter les retries de l'envoi ne suffit pas.

### Changements

- Écrire une intention durable sur `commerce_outbox/{id}` à la création et au
  changement d'échéance. Intégrer l'expiration du lease lors du claim dans la même
  transaction. Conserver `deliveryContractVersion`, `deliveryStartedAt` et les fences.
- Adapter l'événement existant au nouveau mode. Les messages de l'ancien mode
  continuent de fonctionner tant que leurs objets lui appartiennent.
- Le traitement d'une échéance de lease ne renvoie pas automatiquement l'e-mail :
  avant `beginDelivery`, reprise possible suivant le contrat existant ; après le
  début d'envoi, résultat inconnu → delivery_unknown + incident, sans double envoi.
- Fin normale sent/suppressed : terminer l'intention. Erreur récupérable : échéance
  de retry persistée ; erreur de configuration/délivrabilité définitive : arrêt
  et incident. Ne pas prolonger aveuglément le budget d'essais à chaque relivraison.
- Réutiliser le worker et la queue, avec enveloppe versionnée, plutôt qu'un nouveau
  worker de scan. L'alarme de lease est justifiée uniquement par un claim existant.

Fichiers : `commerceEventDispatch.js`, `domain/eventDispatch.js`,
`domain/outboxRepository.js`, `domain/outboxWorker.js`, `v2Operations.js`,
`maintenance/durableWork.cjs`, règles/indexes si requis.

### Gate avant pause du scan

Tests : crash avant claim, après claim, après beginDelivery, après acceptation du
fournisseur avant markSent ; message dupliqué, ancien essai, livraison refusée,
échéance perdue, erreur non récupérable. Oracle : un seul effet fournisseur au
maximum, incident pour ambiguïté, aucune entrée processing abandonnée sans suivi.
Tests d'envoi en doubles locaux ; pas d'e-mail réel implicite dans la recette cloud.

## Lot 2 — réservations : un seul propriétaire de l'expiration

### Analyse à résoudre avant l'écriture

Les réservations sont déjà déclenchées par `onCommerceReservationWrittenGen2`.
Le scan utilise le même `reservationExpiryWorker`. Un lien admin possède aussi
son propre travail d'expiration : ne pas multiplier les contrôles d'un seul checkout.

### Changements

- Inventorier tous les producteurs held, prolongations, reprises, libérations et
  anciennes réservations. Retenir le checkout comme propriétaire de l'échéance,
  puisque le worker relit déjà la commande. Pour les liens, réutiliser le suivi
  livré ; pour le checkout standard, lui donner le même contrat durable avec une
  clé de domaine distincte des contrôles de paiement.
- Inscrire version/échéance avec la mutation de réservation/checkout. Une prolongation
  invalide le vieux rendez-vous. Traiter tous les holds du checkout via la saga
  existante, sans une tâche redondante par ligne de panier.
- Garder `cancelProviderFirst`, expectedExpiry et mouvements de stock idempotents.
  Paiement confirmé pendant la reprise → aucune annulation ni libération.
- Cas échoué/transport épuisé : état durable, incident et réparation ciblée.
  Amorcage borné des réservations existantes, y compris orphelines en attention.

Fichiers : `domain/checkoutRepository.js`, `domain/v2Runtime.js`,
`domain/reservationExpiryWorker.js`, `commerceEventDispatch.js`,
`v2ReservationExpiry.js`, `maintenance/*` et producteurs de liens concernés.

Gate : paiement contre expiration, prolongation contre ancien message, crash
entre annulation Stripe et libération, deux réservations d'un checkout, ancienne
réservation sans commande, reprises épuisées. Oracle : état durable fournisseur,
commande et stock cohérents, jamais un second mouvement de libération.
Recette Stripe test sur fixture bornée préparée avec ses préconditions ; aucun
produit commercial ni achat réel pour prouver ce lot.

## Lot 3 — catalogue : rendre autonomes les reprises utiles

### Cause actuelle

`catalogReconciler` inspecte périodiquement les pointeurs et relance publication ou
revalidation. Une relance utile a été observée le 10 septembre. La revalidation
écrit son échec et `revalidationRetryNotBefore`, mais sa queue n'a qu'une tentative.
Les chemins de crash build/rollback doivent aussi être couverts, pas seulement
le `catch` d'une erreur connue.

### Changements

- Inscrire une intention de cycle dans `CONTROL_DOCUMENT` (référence définie dans
  `publicationState.js`) avec la première mutation ayant un impact public. Réutiliser
  le regroupement `computeQuietUntil`, version cible monotone et borne maximale
  d'attente ; ne pas générer un nouveau scan pour chaque modification d'un champ.
- À chaque étape build → publication CAS → revalidation → vérification servie,
  persister la prochaine obligation avant d'abandonner la précédente. Un lease
  de build/rollback porte son rendez-vous de fin ; succès clôture le cycle.
- Échec servi/cache : enregistrer atomiquement l'échec ET sa reprise à
  `revalidationRetryNotBefore`. Le transport relivre cette intention, sans attendre
  l'heure suivante. Ne plus avaler une erreur de persistance du suivi de panne.
- Une nouvelle révision rend obsolète le travail précédent ; le worker ne modifie
  que l'identité/version qu'il possède. Les parcours pause/rollback/reprise manuelle
  doivent eux aussi inscrire leurs obligations durables.
- Extraire du reconciler les réparations bornées réutilisables. Garder le diagnostic
  complet manuel et une vérification après déploiement/restauration. Un échec de
  lecture du catalogue peut produire un signal dédupliqué, jamais un full scan à
  chaque page publique. Préserver intégralement le chemin de lecture statique/CDN.

Compromis explicite : sans observation périodique, une corruption externe pendant
une inactivité totale ne sera pas détectée immédiatement. Les alertes infrastructure,
la prochaine lecture/publication et le contrôle explicite constituent alors les
points de détection. Ne pas promettre une détection spontanée sans aucun signal.

Fichiers : `catalogMutationRecorder.js`, `onCatalogSourceWrite.js`,
`buildCatalogSnapshot.js`, `catalogRevalidation.js`, `catalogMaintenance.js`,
`catalogReconciler.js`, `publicationState.js`, configuration de déploiement et alertes.

Gate : 100 modifications rapprochées produisent un nombre borné de traitements ;
crash à chaque frontière commit/enqueue/Storage/CAS ; révision dépassée, pointeur
absent, rollback interrompu, revalidation momentanément obsolète puis rétablie.
Oracle : dernière version servie correcte, current/previous/last-known-good valides,
aucune publication perdue et zéro réveil après clôture des cycles.

## Lot 4 — contrôle finance regroupé après activité

### Séparer deux responsabilités aujourd'hui mélangées

`runOperationsRebuild()` compare commandes/finance ET construit la santé des files.
Les lots 1–3 et les observateurs existants prennent en charge les échéances des
actions. Le rapprochement indépendant des compteurs reste nécessaire.

### Changements

- Un marquage par jour métier modifié, dans la transaction de mutation autoritaire
  des commandes/écritures financières ; couvrir paiement, remboursement, expédition,
  annulation, retour et corrections admin, pas seulement le succès checkout.
- Un rendez-vous après clôture de ce jour, proposé au prochain 03:17 Europe/Paris,
  avec génération sale/vérifiée. Aucun job pour un jour sans mutation. Réutiliser
  les projecteurs existants pour le marquage uniquement s'ils garantissent eux-mêmes
  une livraison durable ; ne pas faire dépendre la preuve d'un unique projecteur
  dont le contrôle est censé détecter l'échec.
- Comparer les sources autoritaires et projections indépendamment ; ne pas vérifier
  un compteur en relisant uniquement ce même compteur. Contrôle borné/paginé et
  watermark : une mutation pendant la comparaison empêche de déclarer le nouveau
  contenu vérifié et laisse un rattrapage regroupé. Les corrections tardives d'un
  ancien jour réarment un seul travail pour ce jour, pas tout l'historique.
- Séparer « dernière génération vérifiée » et « disponibilité du contrôle ».
  `operationsHealth.js` possède un validUntil temporel : ne pas prolonger ce champ
  arbitrairement ou transformer un relevé ancien en vert permanent. Les incidents
  de files évoluent avec leurs objets/échéances ; si le statut demande une preuve
  fraîche, lecture explicite bornée et coalescée, affichage « à vérifier » en attendant.
- Conservation initiale d'un diagnostic manuel intégral. Pas de nouvelle tâche
  déclenchée par chaque ouverture du dashboard, aucun rafraîchissement toutes les heures.

Stockage proposé : `sys_commerce_reconciliation/{dateKey}` avec intention, générations
et résultat borné, rules backend-only et TTL terminal. Aucun détail client dupliqué.
Fichiers : producteurs commerce, `v2Operations.js`, `domain/operationsHealth.js`,
projecteurs finance/commandes concernés, lecteur admin, rules/indexes.

Gate : mille mutations du même jour regroupées, jour vide, nuit/DST, remboursement
tardif, projection volontairement incorrecte, mutation concurrente à la clôture,
lecture d'un statut ancien. Oracle : divergence détectée, pas de faux vert ni faux
incident d'expiration à vide. Il ne s'agit pas de modifier les règles financières.

## Lot 5 — médias et releases : candidats regroupés, aucun nettoyage général à vide

### Contraintes conservées

Les médias ont une quarantaine de 90 jours. Les releases ont une grâce de 48 h,
les dix plus récentes sont conservées, ainsi que les pointeurs protégés ; la
rétention des références médias des snapshots a ses propres règles. Ne pas
uniformiser ces durées. Le mode cloud observé est dry-run : cet état reste conservé.

### Changements

- Réutiliser `sys_catalog_media_gc` pour les médias candidats existants. Inscrire
  un rendez-vous de groupe à leur échéance lors de leur création, sans dupliquer
  une liste complète de chemins. Regroupement quotidien de candidats, pages de 25
  initialement, continuation seulement si la page suivante existe.
- Pour les releases, créer un registre technique de versions réellement produites
  avec état candidate/protected/pending-delete/deleted et génération Storage ;
  finalisation de build et événement Storage rejouable couvrent le crash entre
  création Storage et enregistrement. Un import initial borné couvre l'existant.
- Une publication, un changement de pointeur ou la fin d'une période de grâce
  réveille le groupe concerné. Une release protégée parce qu'elle est parmi les
  dix dernières devient dormante ; la prochaine publication réexamine les anciennes
  protections. Ne pas revérifier quotidiennement une release dont rien ne change.
- Préparer des lots explicites. Revalider références source, pointeurs, générations
  et rétention avant suppression. Un lease commun aux mutations de pointeurs/rollback
  et au marquage pending-delete empêche une version de redevenir courante entre
  contrôle et suppression. Un callback de suppression utilise ifGenerationMatch.
  Même protection contre le rattachement d'un média déjà marqué pour suppression.
- Retenir une version en cas de doute ; rapport opérateur pour protection incohérente.
  Aucune suppression commerciale réelle dans la qualification : fixtures locales,
  dry-run cloud, backup et quarantaine restent obligatoires pour tout futur commit GC.

Les tâches Google ne se programment qu'à **30 jours maximum**. Pour 90 jours,
utiliser un relais durable par groupe au plus à 28 jours, réarmé seulement tant
que ce groupe possède des candidats. Ce sont des réveils liés à une quarantaine
existante, pas des scans du catalogue ; les compter dans la mesure de gain.
Une cohorte sans candidat ne crée ni relais ni groupe. Voir les
[limites Cloud Tasks](https://docs.cloud.google.com/tasks/docs/quotas).
Le TTL Firestore n'est pas ponctuel et ne supprime pas les sous-collections :
ne pas en faire le réveil du GC. [Contrat TTL](https://docs.cloud.google.com/firestore/native/docs/ttl).

Stockage proposé : registre `sys_catalog_release_gc`, rendez-vous
`sys_catalog_gc_groups`, pas de payload catalogue dupliqué ; indexes ciblés et
rétention seulement terminale. Fichiers : `mediaGarbageCollection.js`,
`releaseGarbageCollection.js`, finalisation `buildCatalogSnapshot.js`,
`catalogMaintenance.js`, règles/indexes et déclencheur de finalisation ciblé.

Gate : aucun candidat, 90 jours simulés, lot >25, média réutilisé, rollback pendant
GC, génération remplacée, pointeur courant/protégé, ancienne release devenant
éligible seulement après une nouvelle publication, crash partiel et reprise.
Oracle : aucun objet référencé supprimé, aucun inventaire global répété à vide.

## Mesure et critères de stabilité

Comparer le système actuel et chaque lot avec le même jeu d'événements :

| Scénario | Preuve attendue |
| --- | --- |
| Sept jours sans activité et sans travaux antérieurs | Zéro nouveau réveil métier dans les cinq domaines |
| Quelques commandes/liens et aucun changement catalogue | Travail uniquement sur ces objets ; aucun scan catalogue/GC |
| Rafale de 100/1 000 mutations catalogue ou finance | Groupes et continuations bornés ; pas un audit complet par mutation |
| Visites analytics nombreuses sans vente | Aucun nouveau contrôle commerce/finance/GC dû au seul trafic |
| Transport refusé, queue suspendue, retry épuisé | Incident observé et réparation ciblée ; pas d'état perdu |
| Crash fournisseur/Storage | Fences et preuve métier préservées, ambiguïté visible |

Compter tâches, notifications Firestore (y compris no-op), lectures, écritures,
opérations Storage, retries et durée. Comparer faible activité et rafales : moins
de jobs Scheduler ne suffit pas à conclure à un gain net. Les relais de quarantaine,
livraisons déjà programmées et travaux en vol sont comptés séparément.
Aucun prix cloud ni garantie de capacité déduit du temps d'un émulateur.

Tests unitaires des transitions, Firestore Emulator pour vraies transactions et
conflits, tests domaines pour effets idempotents, puis recette sandbox bornée par
lot. Avant toute injection hébergée, fixer objets/volume/durée/plafond ; aucune
charge de mille objets cloud implicite. Cas minimaux : outbox sans e-mail, checkout
Stripe test sous procédure dédiée, publication technique contrôlée, finance sur
fixtures, GC dry-run. Exercer notification et reprise, pas seulement simuler le log.

## Ordre de livraison, pause et retour arrière

1. Relever à nouveau source/config cloud, préserver le correctif Data en cours et
   sauvegarder avant toute migration. Chaque lot possède ses propres flags.
2. Implémenter/tester les lots 1 et 2. Livrer consumers compatibles, puis producteurs.
   Inventorier par pages, dry-run/backup puis migrer uniquement les objets éligibles.
3. Qualifier le lot 1 avant pause du seul outbox horaire ; lot 2 avant pause du seul
   scan réservations. Ne pas créer une nouvelle queue par objet et ne pas retirer
   les anciens handlers tant que des tâches utilisent leur ancien contrat.
4. Livrer le lot 3 et exercer le cas réel de version servie obsolète ; suspendre
   ensuite le seul reconciler catalogue. Pas d'arrêt anticipé de ce secours utile.
5. Séparer santé et rapprochement, livrer le lot 4, prouver jour vide/jour modifié
   puis suspendre le quotidien finance. Les lots 1–3 sont un prérequis de santé.
6. Livrer le lot 5 en dry-run, importer l'existant de façon bornée, vérifier protections
   et relais, puis suspendre le quotidien GC. Pas d'activation destructive implicite.
7. Relire l'inventaire Scheduler, les queues et la couverture des travaux ; vérifier
   sept jours simulés vides et un cycle réel de chaque domaine, incidents nettoyés
   selon leur état réel, chiffres Data/finance identiques. Les gates sans preuve
   restent ouvertes : pas de qualificatif « parfait » ou « sans risque ».
8. Commit(s) locaux du périmètre revu et validé pour les archives immuables ; déploiements
   ciblés sous autorisation du workflow, rapport avec révisions et rollback. Ne pas
   embarquer le correctif Data non lié. Pas de push/merge implicite. Ensuite gel
   fonctionnel de sept jours, sauf régression constatée, pour les tests utilisateur.

Rollback par lot : arrêter les nouveaux producteurs, réattribuer explicitement
les travaux actifs et conserver les consumers compatibles. Réactiver temporairement
le seul ancien scan concerné si nécessaire après contrôle des fences et effets
fournisseur. Ne pas supprimer intents, audits, commandes ni sources de référence.

## Verdict de relecture

Les cinq scans ont une alternative cohérente. Les lots 1–2 sont les premiers
gains ciblés ; le catalogue et le GC demandent plus de garde-fous, la finance une
séparation de responsabilités. **Plan validé pour implémentation, stabilité finale
conditionnée aux gates ci-dessus.** Aucun code runtime ni cloud changé pour préparer
ce document initialement ; l'implémentation locale et ses validations figurent
maintenant dans l'état d'exécution en tête. Les 82 tests de l'audit initial ne
constituent pas la preuve de cette nouvelle implémentation.
