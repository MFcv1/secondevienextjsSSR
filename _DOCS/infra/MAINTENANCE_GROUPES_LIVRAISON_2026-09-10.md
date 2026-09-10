# Maintenance liée aux événements — livraison sandbox

10 septembre 2026, bascule des horaires à **17:36 UTC / 19:36 Paris**.
[Plan et contrats](PLAN_FIN_MAINTENANCE_PERIODIQUE.md).

## Résultat livré

Les cinq contrôles restants ne démarrent plus à heure fixe. Leurs jobs sont
**PAUSED**, conservés pour retour arrière. Inventaire après bascule : **181
Functions ACTIVE** ; les **14 anciens jobs Scheduler sont tous PAUSED** dans
europe-west1/europe-west4/us-central1. Aucun job actif dans cet inventaire.

| Domaine | Déclenchement livré |
| --- | --- |
| Actions commerce/outbox | Intention écrite avec l'action et ses étapes ; reprise du lease expiré, sans renvoi aveugle après résultat fournisseur ambigu |
| Réservation checkout | Une échéance par commande ; paiement/fermeture/prolongation relus avant action ; liens admin gardent leur suivi existant |
| Catalogue | Un suivi partagé par cycle, reprises bornées et fermeture après invalidation acceptée/version servie observée |
| Commandes et finance | Un contrôle regroupé par journée modifiée, après clôture ; watermark transactionnel empêchant une vérification dépassée |
| Médias et versions | Cohortes de candidats, échéances et pagination ; contrôle **dry-run uniquement**, aucun effacement automatique activable |

Cela retire **74 démarrages fixes par jour, 518 par semaine**. Ce n'est pas une
économie monétaire calculée ni le gain net d'invocations : les événements,
notifications de métadonnées, transactions, tâches et reprises utiles restent
facturables. Un groupe de quarantaine existant peut avoir un relais à 28 jours ;
une tâche déjà programmée pour un groupe devenu vide se termine sans se réarmer.
Les visites seules ne créent pas ces contrôles commerce/finance/GC. Le regroupement
analytics livré précédemment est conservé.

## Versions et infrastructure

- Implémentation : commit `339548298994410880ee749f03d25a9616ed93e1`.
- Correction trouvée pendant la qualification :
  `2da3f3a1ebc9eb35c748d12af1e85dc3567a6d48`, déployée sur
  `dispatchCatalogCycleGen2` et `catalogReconciler`.
- Réarmement des médias retirés après une cohorte terminée : `ac18942`, ciblé sur
  `onArtifactUpdated`, `onArtifactDeleted`, `processProductPublicationImage`.
  Même génération Storage, nouveau retrait : nouvelle quarantaine de 90 jours.
  Les doublons d'une cohorte encore active ne créent pas d'écritures supplémentaires.
- Hosting : **`build-2026-09-10-005` SUCCEEDED**, révision
  `secondevie-next-sandbox-build-2026-09-10-005`, trafic 100 %.
  Le code Hosting vient de `3395482` ; le correctif suivant concerne le
  réconciliateur Functions, sans modification du code Next exécuté.
- Déploiement ciblé de 9 nouvelles Functions et mise à jour de 43 existantes,
  dont le réconciliateur historique conservé en secours manuel. Aucun déploiement
  global. Les archives sources des 52 cibles ont été comparées à celles préparées
  localement ; toutes concordent, toutes les cibles sont ACTIVE.
- Cinq queues concernées RUNNING, 20 essais de transport, concurrence 1,
  accès invoker privés. Les six nouveaux déclencheurs Eventarc disposent de
  l'invoker limité à leurs services. Les cinq politiques de transport existantes
  couvrent les nouvelles queues et leurs six abonnements.
- Rules Firestore déployées ; TTL `expireAt` des groupes finance/GC ACTIVE.
  Résultats terminaux conservés 400 jours, problèmes ouverts sans TTL ; le registre
  de releases n'a pas de suppression TTL tant que les versions existent.
- Modes relus dans les producteurs Functions et le runtime Hosting : commerce
  `durable`, catalogue `durable`, finance `grouped`, GC `grouped_dry_run`.

## Vérifications et corrections

**Local :** 378 tests initiaux réussis, puis 64 tests catalogue/cycle/GC réussis
après les correctifs, dont deux nouveaux tests (380 cas distincts au total). Sept tests sur
l'émulateur Firestore passent également : transactions avortées/concurrentes,
watermark, reprise outbox et continuation GC. Build Next de production réussi,
55 pages. Vérification de diff sans erreur.

**Cloud, parcours réellement exercés :**

- Outbox de recette : Firestore → Eventarc → Tasks → `suppressed_test`, sans e-mail.
- Réservation : intention sur une commande déjà fermée, terminée `superseded`,
  sans mutation de paiement/stock ; aucun hold existant à migrer.
- Catalogue : passage sain, puis invalidation en échec volontaire sur la version
  courante 344. La première reprise a révélé un désaccord entre état et identité
  déjà vérifiée. Le correctif exige aussi les états acceptée/observée ; après
  déploiement, revalidation réelle réussie à 17:32:53 UTC, puis cycle terminé.
  Pointeurs et version publique conservés.
- Finance : **96 faits sur 11 journées historiques**, comparés aux sommes
  journalières et aux projections globales, sans divergence. Le jour courant
  possède son rendez-vous après clôture, pas une validation anticipée.
- GC : cohorte vide terminée ; candidat média absent inspecté et classé missing,
  zéro suppression ; anciennes releases inspectées en dry-run et retenues.
- Finalisation Storage réelle sur un objet de recette : registre alimenté par
  Eventarc ; objet et entrée de recette ensuite retirés.
- Préconditions Storage réelles : création concurrente et suppression avec
  génération dépassée refusées (412), contenu conservé, objet de recette retiré.
- Des refus IAM initiaux ont conservé les intentions en attente. Après correction
  des accès, les mêmes événements ont été relivrés et les travaux ont abouti.
  Aucun consommateur rendu public pour faire passer les tests.
- Hosting : `/`, `/galerie`, `/admin`, `/api/catalog/version` répondent 200 ; les
  trois API admin métriques/coûts/publication refusent l'appel sans session (401).

L'infrastructure west4 du nouveau déclencheur Storage nécessitait aussi des droits
de lecture source et d'écriture du cache Artifact Registry pour le compte de build.
Ils ont été accordés sur les deux ressources concernées, sans rôle global ajouté.

## Migration et traces

Avant écriture : inventaires bornés, dry-run, sauvegarde des seuls champs de
maintenance et préconditions sur les versions source. Aucun objet commerce actif
sans propriétaire à migrer ; 672 candidats médias rattachés à **cinq cohortes**,
80 objets représentant **dix releases** importés dans le registre. Douze journées
finance armées, dont onze historiques vérifiées et le jour courant à venir.

Les trois documents de recette et la métadonnée temporaire sur la commande fermée
ont été retirés ; aucune donnée métier de cette commande modifiée. La preuve de
catalogue et les vérifications financières utiles sont conservées. Aucun fichier
source déplacé ni supprimé.

Preuves locales expurgées, dans `logs/recette/final_maintenance_20260910/` :
[vérification déploiement](../../logs/recette/final_maintenance_20260910/deployment-verification.json),
[états finaux](../../logs/recette/final_maintenance_20260910/qualification-results.json),
[rapprochement historique](../../logs/recette/final_maintenance_20260910/finance-baseline-results.json),
[horaires suspendus](../../logs/recette/final_maintenance_20260910/schedulers-after.json),
[inventaire Functions](../../logs/recette/final_maintenance_20260910/inventory-after.json).
Les configurations de rollback contenant des paramètres privés restent en fichiers
locaux ignorés par Git, permissions 0600 ; aucun secret recopié ici.

## Limites de la validation

Cette qualification ne représente pas une semaine de trafic ni une preuve de
coût à forte charge. Aucun nouvel achat Stripe, remboursement réel, e-mail ni
nettoyage commercial destructif n'a été exécuté. Les courses paiement/expiration,
les crashs fournisseur, les conflits de publication et les longues quarantaines
sont couverts par les tests locaux/émulateur ; le parcours cloud réservation
vérifie ici la neutralisation d'une échéance sur commande terminale.

Le rapprochement refuse explicitement une journée dépassant 2 000 faits au lieu
de déclarer une comparaison tronquée correcte. Une telle journée demande une
reprise opérateur/pagination supplémentaire. Les pages GC traitent 25 candidats.
Les politiques d'alerte et leurs destinations existantes sont conservées et leurs
filtres étendus ; aucune nouvelle preuve de réception humaine n'est revendiquée.

La page Performance garde les anciens appels dans sa fenêtre glissante de 24 h,
7 j ou 30 j, y compris les essais et refus IAM de cette livraison. La comparaison
pertinente commence après la bascule ; une ligne encore visible n'est pas la
preuve que son ancien horaire tourne toujours.

## Retour arrière

1. Si nécessaire, reprendre **les cinq jobs nommés dans la preuve de bascule**
   avec leurs définitions sauvegardées, après lecture des travaux actifs.
2. Conserver les consommateurs durables et leurs queues tant que des objets leur
   appartiennent. Ne pas purger les queues ni retirer les métadonnées en masse.
   Un objet migré conserve son propriétaire même si le flag producteur est retiré.
3. Restaurer uniquement les sources/configurations ciblées depuis les sauvegardes
   et les révisions constatées ; Hosting précédent `build-2026-09-10-004`.
   Pour le catalogue, préférer la version corrigée `2da3f3a` à l'ancienne logique.
4. Reprendre un travail en erreur avec le script de réparation versionné du
   [socle durable](FIABILITE_EVENEMENTS.md), jamais un effet financier ambigu.

Les anciens exports restent disponibles pour rollback et diagnostic manuel :
un futur déploiement global Firebase pourrait recréer leurs horaires. Continuer
les déploiements ciblés et contrôler l'état Scheduler après toute livraison.
