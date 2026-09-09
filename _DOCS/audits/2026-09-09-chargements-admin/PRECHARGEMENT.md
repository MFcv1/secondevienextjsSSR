# Suite demandée : préparer le back-office pendant son utilisation

9 septembre 2026. L'utilisateur écarte le coût d'une instance minimale permanente
et demande de préparer les pages progressivement après l'arrivée dans le back-office.
Cette décision remplace la stratégie limitée au survol du premier rapport ; ses
mesures cloud et ses constats de code initial restent une photographie antérieure.

## Résultat local

1. Stats affiche ses KPI (ou son erreur initiale) avant le lancement de la file.
2. Après une pause de 1,5 s, Data prépare son module puis ses projections et les
   dix sessions récentes, via les canaux déjà partagés. Arrêt de la préparation
   au résultat/erreur ou après cinq secondes, puis fermeture des écoutes si la
   page n'est pas affichée. Un changement de droits ne laisse pas ce cleanup
   arrêter les canaux d'un nouveau propriétaire.
3. Ventes, Retours, Devis, Factures, Liens, Codes promo et Livraison chargent leurs
   modules et premières pages/configurations en séquence. Retours conserve sa
   parallélisation interne ; sa lecture Ventes réutilise la première page déjà lue.
4. Les autres onglets préparent leurs modules seulement. Aucun montage caché de
   formulaire, traitement de photos, export, recherche auditée ou synchronisation
   avec un fournisseur ne se produit. Aucun catalogue complet n'est anticipé.

Le menu avance la page visée dans la file et prépare son code. La page cliquée
lit immédiatement ses données ; elle n'attend pas sa place dans la file. Si cette
lecture était déjà en cours ou encore fraîche, le cache partagé la réutilise.
Une lecture réseau déjà envoyée n'est pas annulable par cette file : elle peut
coexister temporairement avec le clic prioritaire, sans lancer une deuxième
lecture identique de première page.

Un seul passage par montage/génération autorisée, sans répétition après expiration
du cache ni retry automatique. La file attend 1,5 s entre tâches et se suspend
quand l'onglet est masqué, hors ligne ou Save-Data activé. Sortie/révocation :
destruction de la file ; cache et promesses restent protégés par UID/génération.
Les tâches déjà tentées ne sont pas relancées lors d'une reprise.

## Liens et Codes promo

Leur cache manquant est ajouté, sinon préparer ces pages aurait seulement réchauffé
la Function et provoqué une seconde lecture au clic. Durée de fraîcheur : 120 s,
mémoire privée uniquement. Après expiration, l'ouverture relit ; aucune fraîcheur
infinie n'est promise. Les changements d'un autre admin ne sont pas poussés dans
ces caches ; le serveur reste autoritaire pour toutes les actions.

Création/changement de statut Promo et les cinq mutations Liens invalident la
première page avant et après l'opération. Un résultat de préchargement antérieur
ne peut repeupler ce cache. Actualiser Liens force la lecture ; les pages suivantes
et recherches exactes restent distinctes. Le bandeau « commerce désactivé » exige
désormais un setup connu, ce qui évite ce faux diagnostic pendant l'attente initiale.

## Coût et limites

Aucune instance minimale augmentée : le coût fixe de maintien permanent n'est pas
activé. Le préchargement n'est pas gratuit : une visite suffisamment longue peut
déclencher les lecteurs même sans consultation ultérieure. Le nombre de visites,
la taille des premières pages et les tarifs effectifs déterminent ce surcoût ;
aucun montant mensuel n'est extrapolé sans cet usage.

Le gain vise la navigation après quelques secondes dans le back-office. Un clic
immédiat sur une page encore froide peut toujours attendre. Il ne faut pas
confondre données déjà chargées dans le navigateur et garantie d'une Function
chaude plusieurs heures plus tard. TTL existants conservés (Devis 30 s, principales
pages commerce 120 s) ; rechargement complet et nouvelle session repartent à vide.

Retours publie encore son résultat après la plus lente des sources. Les faux zéros
du résumé Ventes ne sont pas corrigés par ce changement. Les autres onglets dont
seul le code est anticipé conservent leur lecture métier à l'ouverture.

## Validation

Sous Node 22.23.2 : tests de file séquentielle, priorité, suspension/reprise,
destruction en vol, libération des canaux Data après résultat/timeout/masquage,
maintien de leur propriétaire visible ; tests de partage/invalidation des nouveaux
caches, séparation des recherches et refus après changement d'autorisation.
Une liste en vol avant mutation est explicitement refusée après celle-ci.
Preuve : [validation de la suite](preload-validation.txt).

ESLint ciblé : zéro erreur, un avertissement préexistant dans AdminDashboard,
confirmé sur la version HEAD avant modification (`historyRequestRef` au cleanup).
Contrôle des liens documentaires et `git diff --check` effectués.
Pas de build, navigateur, E2E ou déploiement. Aucune suppression ni déplacement.
Les gains de temps navigateur après déploiement restent à qualifier.
