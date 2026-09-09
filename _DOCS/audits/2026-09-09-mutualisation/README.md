# Mutualisation, cache et capacité — 9 septembre 2026

Suite livrée après cet audit : [runtime public et admin sur sandbox](LIVRAISON_SANDBOX.md).
Le rapport ci-dessous reste une photographie datée, pas l'état de livraison du code.

**Suite demandée : [plan public + connexions sur un seul service chaud](PLAN_PUBLIC_CHAUD.md).**
Il remplace les recommandations initiales ci-dessous après clarification du
budget : 512 MiB à qualifier, public min 1 / max 1, admin min 0 avec
préchargement, aucun second socle identité permanent. Facturation et risque
des anciennes révisions taguées y sont détaillés. Plan uniquement, non livré.

Audit demandé pour réduire les attentes publiques et admin sans multiplier les
instances payantes. **Aucune infrastructure modifiée, aucun déploiement.**
Les correctifs admin du [précédent audit](../2026-09-09-chargements-admin/README.md)
restent des changements locaux ; ce rapport ne mesure pas leurs gains.

## Conclusion et décision proposée

Oui, plusieurs opérations peuvent partager une instance si elles sont exécutées
dans le même service. Mais une simple passerelle vers les anciennes Functions ne
supprime ni leurs démarrages ni leurs coûts. Il faut déplacer les handlers et
leurs dépendances, avec leurs contrôles d'accès.

La cible économique n'est pas « 158 fonctions chaudes » : c'est **un ou deux
services maintenus disponibles**, plus des workers et commandes spécialisées à
minimum zéro. Les 158 services ne deviennent donc pas littéralement deux services.

Deux variantes sont possibles :

1. **Cible souhaitée public + admin** : réutiliser App Hosting pour les pages et
   les opérations publiques compatibles ; regrouper les lecteurs admin dans une
   petite API. Faire entrer la connexion passkey dans le public impose une
   décision explicite sur les droits du serveur Next. Le compte technique
   `auth-login-runtime` est actuellement distinct. Il ne faut pas donner ses
   droits d'émission de tokens à toute la vitrine sans revoir cette frontière.
2. **Variante recommandée pour commencer** : fusionner les deux opérations de
   connexion passkey dans un seul service identité chaud, conserver App Hosting,
   et mutualiser l'API admin à minimum zéro avec le préchargement progressif.
   Cela peut ramener le socle chaud à **un service**, puis à deux si App Hosting
   est maintenu chaud. L'admin demeure rapide après amorçage, sans abonnement
   permanent. On conserve la séparation des droits identité/vitrine.

Je recommande la seconde comme première étape réversible. La première reste
réalisable si l'on accepte et valide la frontière de privilèges commune.
Le [plan](PLAN_IMPLEMENTATION.md) détaille les lots et critères de décision.

## Preuves, portée et limites

- Cloud : projet `secondevienextjsssr`, sandbox uniquement. Inventaire complet
  [158 Functions](functions.json), [156 services Cloud Run](services.json).
  155 Functions Gen2, 3 Gen1, un service App Hosting.
- Git local à la clôture : branche `main`,
  `424239b30d24f02e7bc4f394395ee8a776b6ec45`, worktree déjà modifié par les
  correctifs admin précédents. Aucun commit créé pendant cet audit.
- [Inventaire par fonction](INVENTAIRE.md) : ressources, identité technique,
  déclencheur, volume 24 h / 7 j / 30 j et destination proposée pour chaque ligne.
- Fenêtres Monitoring terminées à **15:51 UTC** : 24 h, 7 jours, 30 jours.
  [24 h](metrics-24h.json), [7 jours](metrics-7d.json), [30 jours](metrics-30d.json).
  Collecte par [script reproductible](collect.mjs), jeton uniquement en mémoire.
- [Charge sur 24 h](resources-24h.json), autre fenêtre indiquée dans le fichier,
  agrégats de cinq minutes ; [sondes HTTP](public-probes.json) à 16:01 UTC.
- Relecture ciblée : routes galerie/catalogue, snapshots, synchronisation,
  initialisation identité, analytics, préchargement admin, adaptateurs Gen2,
  runtime passkeys et registre client. Ce n'est pas une nouvelle revue ligne à
  ligne de tous les handlers métier. Leur migration nécessite les tests du lot.
- La révision App Hosting servant 100 % du trafic lors de cette observation est
  `secondevie-next-sandbox-build-2026-09-09-005`, deployment ID HTTP
  `sv-mtu74p03-8bde71f24a3c`. Elle diffère des anciennes preuves de livraison.
  Son identité Git exacte n'a pas été établie ici ; code local et cloud sont
  distingués. Ce chantier n'a déclenché aucun de ces rollouts.
- Pas de facture Cloud Billing, de traces navigateur, de LCP/INP, de mesure
  réseau mobile, de test de charge ou d'instrumentation Firestore par opération.
  Les prix ci-dessous sont des modèles, les gains futurs ne sont pas mesurés.

## Ce que fait réellement la galerie

| Étape | Code / comportement | Cache et conséquence |
|---|---|---|
| HTML initial | `app/page.jsx`, `GalleryRoutePage.jsx` : page statique, ISR 300 s, catalogue cartes limité à 48 et personnalisation en parallèle | HTML partagé via CDN ; pas un rendu complet pour chaque visiteur |
| Catalogue serveur | `materializedCatalog.js` : pointeur Storage frais, manifeste puis bundles full/cards en parallèle, validation des empreintes | Objets immuables cachés un an ; pointeurs actuels et secours restent frais |
| Navigation / images | `GalleryGridActionsIsland.jsx` : intention de navigation et images ; anticipation des cartes visibles avec marge d'un écran | Le navigateur doit encore télécharger, décoder et hydrater ; une instance chaude ne supprime pas cela |
| Vérification catalogue | `CatalogVersionSyncIsland.jsx` : `/api/catalog/version` au montage/retour visible/pageshow, requêtes concurrentes dédupliquées | ETag et 304 déjà présents ; fraîcheur oblige un passage serveur |
| Signal catalogue | Écoute bornée au document `sys_catalog_live/current`, arrêt quand caché ; confirmation HTTP bornée après signal pertinent | Charge SDK Firestore et connexion côté navigateur ; pas de polling permanent |
| Identité | `HeaderAccountIsland` et `authStore` : initialisation forcée si compte persisté/retour connexion/parcours privé ; modale importée à l'intention | Les passkeys ne sont pas appelées à chaque affichage de galerie |
| Analytics | `AnalyticsCollectorIsland`, `AnalyticsProvider`, Performance Firebase : consentement, initialisation différée, session/sync/beacon | Coût à traiter par fréquence et données utiles, pas en bloquant l'affichage |
| Admin | Shell, import de la vue, puis données propres à la vue | Cache privé de session, pas de CDN partagé entre utilisateurs |

La version catalogue de 142 octets utilise aujourd'hui le lecteur de snapshot
complet : même avec les téléchargements immuables cachés, la validation des
bundles est répétée. **Optimisation candidate** : mémoriser le résultat validé
par identité immuable avec borne mémoire, et partager la promesse de chargement.
Toujours relire le pointeur frais et vérifier sa correspondance avec la release ;
conserver les secours et le contrôle d'intégrité. Ne pas transformer une réponse
rapide mais non vérifiée en annonce de publication réussie.

L'HTML sondé fait **798 318 octets décompressés**, environ **105 173 octets gzip**,
avec 14 scripts externes référencés. Cela justifie une analyse ultérieure des
duplications de données/cartes mobile-desktop et du JS initial. Ce nombre
n'inclut ni les images, ni les imports dynamiques, ni les polices : ce n'est pas
le poids total d'une visite. Réduire les octets peut aider davantage le mobile
qu'ajouter une instance.

### Mesure publique reproductible

Deux GET successifs sans cache-busting depuis le même poste :

| Requête | Attente avant les en-têtes | Preuve |
|---|---:|---|
| Première galerie | 6 339 ms | `x-nextjs-cache: REVALIDATED`, `s-maxage=300` |
| Galerie suivante | 16,7 ms | Même ETag, `Age: 1` : réponse CDN réutilisée |
| Version catalogue | 427 ms | 142 octets, ETag, revalidation obligatoire |

Les [logs corrélés](hosting-probe-logs.json) montrent une nouvelle instance à
16:01:10.811 UTC, une sonde de démarrage réussie à 16:01:12.878 et une requête
origine de 5,509 s. Le démarrage à froid contribue donc à l'attente observée ;
on ne peut pas lui attribuer les 6,339 s entières : réseau, CDN, attente et ISR
interviennent aussi. Le log 304 voisin est cohérent avec une revalidation CDN
de la version, malgré la réponse finale 200 reçue par la sonde.

Le cache fonctionne déjà pour les visiteurs suivants, **par objet et point de
présence CDN**, jusqu'à expiration/éviction/invalidation. Il n'est ni éternel ni
un cache global unique. `minInstances: 1` garde un processus disponible, sans
garantir que toutes les pages et données soient déjà calculées. Un redémarrage,
déploiement ou surcroît de trafic peut encore créer une instance froide.

## Fonctions utilisées : distinguer trafic utile et travail de fond

| Famille proposée | Fonctions | Requêtes / exécutions observées sur 7 j |
|---|---:|---:|
| Workers, événements et planifications | 35 | 8 126 |
| Collecte non bloquante | 4 | 1 468 |
| Lecteurs admin candidats | 17 | 466 |
| Lectures client candidates | 5 | 190 |
| Identité et sessions | 11 | 174 |
| Commandes / intégrations spécialisées | 86 | 252 |
| Total | 158 | 10 676 |

Environ 76 % du comptage est donc dans les événements/planifications. Exemples :
expiration des liens 2 016, watchdog commerce 672, réconciliation publication
672, maintenance analytics 672. Ces fréquences ont une fonction métier et ne
doivent pas être diminuées sans vérifier les échéances, reprises et garanties.

Parmi les appels interactifs ou liés à la navigation : sync session 1 176,
beacon 179, commandes client 142, init session 113, analytics admin 102,
ventes 97, devis 46, retours 39 par lecteur, factures 37, liens 17, promotions 10.
Les deux opérations de connexion passkey comptent **13 et 6 requêtes sur 7 j**,
respectivement 36 et 11 sur 30 j. Le maintien de deux services distincts pour
ce parcours est un candidat clair à mutualisation.

82 fonctions n'ont aucune série sur 7 j ; 38 sur 30 j. **Absence de série ne
signifie pas fonction inutile** : remboursement, restauration, suppression de
compte, reprise d'incident ou intégration rarement utilisée restent nécessaires.
Les noms, volumes et comptes techniques sont tous dans l'inventaire, y compris
les fonctions sans trafic observé.

Ces volumes incluent OPTIONS, HTTP rejetées, événements et recette sandbox ;
ils ne comptent pas des personnes. Exemple : sur 7 j, journal inventaire affiche
1 240 requêtes dont 1 224 réponses 4xx. Sur 30 j, l'agrégation analytics affiche
35 445 requêtes dont 34 541 réponses 4xx ; revalidation catalogue 5 615 erreurs
5xx sur 5 666 requêtes. Sur 7 j, cette dernière n'affiche plus d'erreur sur 16
requêtes et l'inventaire n'affiche pas de rejet sur les dernières 24 h.
L'historique contient donc des épisodes anormaux et des changements de
configuration : ne pas dimensionner une nouvelle API sur ces totaux bruts.
Les erreurs historiques ne sont ni déclarées actuelles ni déclarées corrigées
par ce rapport ; leur attribution exacte exige une lecture datée complémentaire.

## Ressources et capacité

État actuel confirmé : App Hosting **1 vCPU, 512 MiB, concurrence 80, min 0,
max 10**. Les deux Functions passkey chaudes : **1 vCPU, 256 MiB, concurrence 8,
min 1, max 2 chacune**. Les 156 autres Functions sont à min 0 : cela autorise
l'arrêt au repos, cela ne veut pas dire zéro instance pendant les requêtes.

Une instance est un processus/conteneur avec un budget CPU et mémoire. Un vCPU
est une unité de capacité processeur virtualisée, pas un modèle de serveur
physique garanti. Plusieurs requêtes peuvent partager ce budget ; Node peut
attendre plusieurs accès réseau simultanément, mais une opération CPU lourde
bloque son thread JavaScript. Voir les [limites CPU Cloud Run](https://docs.cloud.google.com/run/docs/configuring/services/cpu).

Sur les 24 h mesurées :

- App Hosting : 1 124 requêtes origine, pic de **133 requêtes dans une tranche
  de cinq minutes**, soit 0,44/s en moyenne sur cette tranche. Ce n'est pas le
  pic instantané et cela exclut les réponses entièrement servies par CDN.
- Maximum des p95 CPU par tranches de cinq minutes : **23,75 %** pour
  App Hosting ; mémoire **54,5 %**. Pas d'indice de saturation soutenue dans
  ces agrégats, mais ils ne prouvent pas l'absence de courts pics.
- La distribution de concurrence App Hosting atteint un maximum des p95 par
  tranches de cinq minutes de **15,8**, pour une limite configurée de 80.
  Ce quantile interpolé n'est ni un nombre entier de visiteurs ni un maximum
  instantané ; il montre pourquoi la moyenne de 0,44 requête/s ne suffit pas
  à décrire les rafales.
- Plusieurs Functions 256 MiB atteignent un maximum des p95 mémoire de
  **75 à 79 %** : session, beacon, promotions newsletter, liens et options
  passkey. Mutualiser en 256 MiB sans mesure de mémoire serait fragile.
- L'agrégat instance_count comporte une valeur 2 pour une série App Hosting ;
  le fichier conserve un maximum par série/état/révision, pas le total simultané
  exact de toute la flotte. Cela ne prouve pas une nécessité durable de deux
  instances ni la cause de leur création.

**Point de départ à tester : 1 vCPU, 512 MiB pour une petite API partagée,
concurrence 8 ; 1 GiB si l'assemblage augmente trop la mémoire.** Pour Next,
conserver initialement les ressources existantes et mesurer avant de changer
la concurrence. Aucune promesse de « X utilisateurs » avec ce CPU : un visiteur
peut ne produire aucune requête origine ou déclencher plusieurs opérations.

Exemple pédagogique seulement : 8 requêtes simultanées de 250 ms correspondent
théoriquement à 32 requêtes/s sans saturation ni attente supplémentaire. Ce n'est
pas un benchmark du site et cela ne dimensionne ni Firestore ni Stripe.

Cloud Run peut ajouter une réplique du service chargé automatiquement, sans
déployer une troisième application. Il considère CPU et concurrence, avec
cible par défaut de 60 % ; **la mémoire ne déclenche pas l'autoscaling**.
Conserver une marge mémoire et surveiller les OOM est donc nécessaire.
[Documentation autoscaling](https://docs.cloud.google.com/run/docs/about-instance-autoscaling).

## Coûts : comparer le même matériel

Modèle de maintien au repos, 730 h/mois, prix USD publics en facturation à la
requête : CPU idle 0,0000025 $/vCPU/s, RAM 0,0000025 $/GiB/s.
Formule : `2 628 000 × (vCPU × 0,0000025 + GiB × 0,0000025)`.

| Socle chaud | Estimation mensuelle au repos |
|---|---:|
| Situation actuelle : 2 passkeys, chacune 1 CPU / 256 MiB | 16,43 $ |
| Un service mutualisé, 1 CPU / 512 MiB | 9,86 $ |
| Deux services, chacun 1 CPU / 512 MiB | 19,71 $ |
| Deux services, chacun 1 CPU / 1 GiB | 26,28 $ |
| Deux nouveaux services 512 MiB en conservant les deux anciens chauds | 36,14 $ — doublon à éviter |

Deux services plus puissants ne coûtent donc pas automatiquement moins que les
huit petites Functions fractionnaires évoquées précédemment (~25 $ de maintien).
Le bénéfice de mutualisation est de partager le CPU et la mémoire, de limiter
les démarrages successifs et de ne payer qu'un ou deux socles. À ressources
identiques, huit services 1 CPU/512 MiB coûteraient 78,84 $ au repos.

Ces montants sont **hors franchises, taxes, conversion monétaire et activité**,
et ne sont pas la facture totale Firebase. Le temps actif remplace le tarif
CPU idle par le tarif actif ; des répliques supplémentaires et les démarrages
ajoutent de la consommation. Firestore, Storage, réseau, artefacts, builds,
secrets et logs sont séparés. Les franchises sont partagées au compte de
facturation, donc ne pas les soustraire plusieurs fois.
[Tarifs Cloud Run](https://cloud.google.com/run/pricing).

La facturation « CPU toujours alloué / par instance » serait bien plus chère
au repos : environ 49,93 $ par mois pour 1 CPU/512 MiB aux tarifs 0,000018 et
0,000002. Ce n'est pas le modèle retenu. App Hosting observé a
`cpu-throttling: true` ; ce choix doit être revérifié sur chaque cible livrée.

Le CDN réduit le travail serveur, pas tous les frais par visite : App Hosting
annonce 10 GiB de bande passante sans coût puis 0,15 $/GiB en cache et
0,20 $/GiB hors cache. Les photos servies depuis Storage suivent leurs propres
tarifs. [Coûts App Hosting](https://firebase.google.com/docs/app-hosting/costs).

## Ordre des améliorations

1. Garder le cache public et réduire les calculs répétés/poids initial ; ne pas
   précharger toutes les pages chez chaque visiteur.
2. Livrer et mesurer le préchargement admin déjà préparé, puis une API commune
   aux lecteurs pour ne payer qu'un amorçage par groupe.
3. Fusionner les deux opérations passkey dans un runtime identité unique,
   avant d'acheter des instances supplémentaires.
4. Si supprimer l'attente froide de la première galerie est prioritaire,
   maintenir App Hosting chaud : deux socles au total avec l'identité, admin
   à zéro. Environ 19,71 $ de maintien avec deux runtimes 512 MiB.
5. N'activer le schéma public+identité / admin tous deux chauds qu'après
   validation des droits et comparaison mesurée avec la variante précédente.

Le plus gros gain probable est la combinaison **cache partagé + moins
d'appels/calculs + un runtime déjà disponible sur les parcours prioritaires**.
Le constat de 6,3 s puis 17 ms prouve un problème de premier accès dans cette
mesure ; il ne permet pas de promettre 17 ms pour une page privée ou un login.

## Reproduction et validations

Scripts : [collect.mjs](collect.mjs), [probe.mjs](probe.mjs),
[inventory.mjs](inventory.mjs). Node 22.23.2, accès gcloud en lecture.
La sonde effectue trois GET publics et peut réchauffer les caches ; elle
n'appelle aucun handler de commande. La mesure de concurrence utilise une
distribution p95 par cinq minutes, pas un maximum instantané.

Les JSON contiennent uniquement inventaires, agrégats, en-têtes et logs
techniques sélectionnés. Aucun contenu de compte, token, secret ou boîte mail.
Pas de modification applicative dans cet audit, pas de tests métier/build/E2E
relancés. À la clôture : JSON valides, 158 entrées uniques, liens locaux des
rapports/index/état contrôlés sans lien manquant, `git diff --check` réussi.
Aucun déplacement ni suppression.
