# Temps reel, couts et livraison Next.js/Firebase

Date: 2026-09-04
Statut: `P5_CUTOVER_QUALIFIE_MESURES_COMPLETES_RESTANTES`
Proprietaire: equipe Seconde Vie
Revue et cloture cible: 2026-09-30. Une gate non prouvee reste ouverte.

## 1. Mandat et fin du chantier

Extension sessions du 2026-09-04, explicitement autorisee avec GitHub/staging:
projecteur de cartes et parcours expurges dans le trigger Analytics existant;
aucune nouvelle Function ni instance chaude. Listeners: dix recentes, une page
ancienne sur demande, un parcours ouvert. Tests locaux Node et Emulator passes;
qualification hebergee et revision de livraison consignees apres deploiement.
Les mesures longues P5/P6 ne sont pas declarees closes par ce correctif.

Plan temporaire explicitement demande apres la recette humaine et la latence
Data du 3 septembre. Il regroupe le raccordement Data, le partage des ecoutes,
les mesures cout/latence et le reglage des fonctions interactives. Il ne remplace
pas les preuves D0-D5/I1-I3 du plan dashboard ni les anomalies HRT de la recette.
Ces documents gardent leur autorite sur leurs gates propres; aucune nouvelle
implementation parallele des KPI Stats ou du noyau commerce n'est autorisee.

Fin: Data evenementielle requalifiee, budgets mesures, cohortes interactives
traitees ou explicitement conservees sur preuve, livraison reproductible et
rollback exerce. Fusion dans les chapitres canoniques, puis suppression de ce
plan. Pas de migration de fournisseur, de base ni de region dans ce chantier.

## 2. Baseline prouvee, sans extrapolation

- App Hosting: Next.js 16.3, pages publiques ISR/CDN, min 0, max 10, CPU 1,
  512 MiB, concurrency 80. Les routes privees restent no-store.
- Firestore: `eur3`; Functions principalement europe-west1, App Hosting
  europe-west4. Aucun deplacement de donnees pour gagner quelques millisecondes.
- 158 Functions cloud: 155 Gen2, trois exceptions Auth Gen1. 154 Gen2 acceptent
  une seule requete par instance; 152 ont maxInstances=1. MinInstances=0 partout
  dans l'inventaire Gen2 du 4 septembre.
- Data 23:12 le 3 septembre: OPTIONS 5,788 s avec demarrage d'instance, puis
  POST 0,417 s / 0,220 s. Cela n'est ni un p95 ni une mesure complete clic->KPI.
- Data utilise encore overview_bundle et un cache 5 min. Les faits ordinaires
  sont materialises a la fermeture; compactDay est planifie toutes les 15 min,
  les mois/annees au changement de jour. Ni cache ni serveur chaud ne rendent
  ce pipeline reellement evenementiel.
- Les visiteurs uniques sont estimes par HLL. Les sessions sont des compteurs;
  ne pas confondre sessions, sujets techniques et personnes physiques.

## 3. Contrat cible

### Affichage

- Garder Next/ISR/CDN pour le catalogue public. Aucun cache public de donnees
  admin; Auth, registre et AAL2 restent obligatoires.
- Lire des projections globales expurgees pour les KPI, jamais les sessions
  brutes. Pas de callable de secours si une projection manque.
- Une ecoute partagee par jeu de donnees et session admin. Acquisition a la
  premiere visite Data; conservation lors d'un aller-retour entre onglets;
  arret et effacement a la perte d'autorisation/deconnexion. Pas de listener
  identique dans chaque carte, pas d'ecoute des historiques bruts invisibles.
- Cache connu immediat, distingue de la confirmation serveur; document absent,
  schema incorrect ou manque de couverture = indisponible/partiel, jamais zero
  invente ni confiance 100 % pendant le chargement.
- Dix sessions recentes se chargent independamment; detail au clic et pages
  suivantes par dix. Aucun prechargement de l'ensemble du catalogue pour les KPI.

### Production evenementielle et exactitude

- Nouvelle session admissible, changement de parcours utile et fermeture
  produisent une contribution; un heartbeat qui ne modifie que la presence
  ne reecrit pas tous les compteurs historiques. Presence et historique ont
  des semantiques distinctes, pas de faux statut live apres 30 s si le heartbeat
  autorise est de 60 s.
- Un seul proprietaire de projection. Dedupliquer via ledger, version source
  complete (secondes+nanos) et contribution absolue; ne pas se fier a l'ordre
  Eventarc. Relire la source autoritaire si necessaire, ne pas ressusciter une
  session admin sur rejeu apres suppression.
- Mise a jour atomique des compteurs concernes. Une correction d'identite ou
  exclusion admin doit corriger aussi les visiteurs estimes, pas seulement
  sessions--. Retrait HLL non inversible: reconstruction ciblee bornee ou
  structure de comptage reversible a qualifier; aucune soustraction de HLL,
  aucun scan silencieux sans borne. Ce choix est une gate bloquante P2.
- Reutiliser l'historique existant via baseline verifiee; aucun double comptage
  entre faits historiques et nouvelles contributions. TTL des details conserve
  l'historique; exclusion admin le corrige. Tombstones couvrent les rejeux.
- Projections recentes et historiques separees par cadence de mutation. Taille
  testee sous 256 Kio/document, nombres de buckets/document fixes. Ne pas
  reecrire cinquante annees a chaque heartbeat. Aucun UID, e-mail, parcours ni
  identifiant individuel dans les documents globaux lisibles.
- 1 h: buckets minute; 1 j: buckets horaires avec bornes explicitement
  documentees; 7 j/30 j: jours; 1 an: mois; Tout: annees bornees. Les libelles
  distinguent fenetre glissante et periodes calendaires. Pas de sommation des
  uniques de buckets: union des sketches. Les frontieres inexactes ou une
  precision plus grossiere que la fenetre doivent etre indiquees, jamais
  annoncees comme exactes. DST/minuit couverts par tests.
- L'horloge de l'affichage fait expirer les buckets sans lecture reseau ni
  ecriture chaque minute. La validite du cache et la couverture source sont
  distinctes de la date du dernier evenement. Un silence de trafic ne doit pas
  etre presente comme une panne.
- Retry borne et reprise ciblee si echec. La reconciliation de secours ne
  devient pas le moteur normal de fraicheur. Analytics ne bloque jamais paiement.

### Fonctions interactives et DevOps

- Pas de hausse globale CPU/concurrency/maxInstances, ni minInstances gratuit
  suppose. Commencer par lectures admin non mutantes; Auth/checkout/refund sont
  des cohortes distinctes avec leurs tests de concurrence et idempotence.
- Comparer froid/chaud, 1/2/5 demandes simultanees, p50/p95, 429, temps CPU,
  lectures/ecritures par action reussie, pas seulement prix par milliseconde.
- Examiner les imports/initialisations du point d'entree commun avant de
  multiplier codebases, runtimes ou instances reservees.
- Budget et alertes sur depense et erreurs; un budget n'est pas un plafond
  automatique. Retention logs/artefacts et rollback protege restent explicites.
- CI locale sans credentials cloud: schemas, rejeux, desordre, transactions,
  Rules, navigation/cache, regression finance et rapport de performance.
- Archives sources immuables, digest, deploy cible, verification IAM/Eventarc,
  smoke, puis observation. Pas de fermeture sur la seule base d'une CI verte.

## 4. Gates et conditions de sortie

| Gate | Livraison / condition de sortie | Etat |
| --- | --- | --- |
| P0 | Baseline, contrats, rattachement aux anciens plans, liste exacte des ecarts | `BASELINE_ET_CONTRAT_DOCUMENTES` |
| P1 | Instrumentation clic/cache/SDK/appel/rendu; rapport HTTP incluant OPTIONS; tests locaux, aucune PII ni compteur Firestore ajoute | `DEPLOYEE`, extraction des traces internes a qualifier |
| P2 | Moteur delta, versions/tombstones, uniques corrigeables, bornes, reconstitution historique et tests Emulator concurrentiels | `CODE_ET_TESTS_LOCAUX_OK`, inventaire historique reel a qualifier en P4 |
| P3 | Lecteur Data partage, horloge sans polling, etats cache/serveur/fail-closed, pagination, tests UI et couts | `RECETTE_UI_SANDBOX_OK`, cout facture a mesurer en P6 |
| P4 | Dry-run, sauvegarde, bootstrap et shadow sandbox autorises, zero divergence apres rejeux et exclusions admin | `VALIDEE_SANDBOX`, preuve fonctionnelle bornee ci-dessous |
| P5 | Cutover cible, visite client visible automatiquement, 30 mesures froid/chaud, pas de polling ni scans, rollback exerce | `PARTIELLE`: cutover/probe UI/30 retours chauds/rollback qualifies; froid, ingestion client et p95 interne restants |
| P6 | Regler ou conserver chaque cohorte interactive sur mesures comparables, verifier cout 24 h et alertes, observation 7 jours, fusion documentaire | `APRES_P5` |

P0/P1 ne signifient pas que Data est temps reel. P2/P3 n'autorisent pas un
cutover sans P4. Aucune gate ancienne n'est fermee implicitement par ce plan.

Livraison P1 locale du 2026-09-04:

- `adminAnalyticsPerformance.js`: vingt traces en memoire, ressources expurgees,
  aucun upload/ecriture Firestore; effacement a la deconnexion/changement de compte.
- `AdminAppIsland`/`AdminAnalytics`: selection, cache, module, SDK, appel et
  opportunite de rendu. Deux requestAnimationFrame ne prouvent pas un pixel
  effectivement peint; le diagnostic navigateur reste a requalifier en P5.
- `rollups.js`: durees acces/lecture/audit dans la reponse admin, sans nouvelle
  requete ni nouveau log d'audit. Les appels existants restent en place jusqu'a P3.
- `audit-interactive-runtime.mjs`: acces cloud uniquement explicite, lecture
  seule, services/fenetre/volume bornes; configuration courante distinguee de
  l'historique. Lecture reelle qualifiee sur 21:11-21:14 UTC le 3 septembre:
  un demarrage, deux OPTIONS (max 5788 ms), deux POST (max 417 ms), aucune erreur
  403/429/5xx dans cette petite fenetre. Aucune extrapolation p95/cout mensuel.
- Dix nouveaux tests diagnostic + dix-huit tests cache/navigation/rollups passes
  sous Node 22.23.2; lint cible sans erreur, trois avertissements preexistants.
  Vingt-deux tests Stats/newsletter/historique financier et le verificateur
  analytics passent egalement; total cinquante tests Node sur ce lot.
  Gate ajoutee a la CI, non executee sur GitHub tant que non poussee.
- Pas de nouveau deploiement, de mesure apres optimisation, de test de charge,
  de bootstrap ni de shadow cloud dans ce premier lot. La suite locale est decrite ci-dessous.

### Livraison locale P2/P3

- `functions/src/analytics/realtime.js` est appele par le trigger existant
  `aggregateAnalyticsSessionGen2`, uniquement avec `ANALYTICS_REALTIME_ENABLED=true`.
  Pas de nouvel export Function, Scheduler ou instance chaude. Les flags sont
  absents par defaut: le sandbox existant n'est pas modifie par ce code local.
- Le choix P2 est un histogramme reversible des rangs HLL (1024 registres,
  64 rangs, compteurs uint32 compresses), backend-only par bucket temporel,
  pas un compteur distribue. Une contribution entree/sortie change cinq buckets
  minute/heure/jour/mois/annee sans lire les autres sessions. Les sketches publics
  restent des estimations, compatibles avec les HLL existants.
- Deux documents `admin_analytics_realtime/recent|history` contiennent au plus
  61 minutes/25 heures et 31 jours/13 mois/50 annees. Chaque document est teste
  et borne a 256 Kio; depassement = transaction refusee, jamais troncature cachee.
- Source, exclusion et ledger sont relus dans la transaction. Le payload
  Eventarc sert seulement a filtrer les ecritures sans effet. Les versions
  sources conservent secondes+nanos; les deux resumes portent la meme revision.
  L'horloge de pruning ne recule pas lors d'un retry concurrent.
- Creation, correction d'identite/device et fermeture alimentent les KPI.
  Un heartbeat ou un changement de page seul n'affecte pas le compteur de
  visiteurs/sessions. La duree et le rebond sont finalises a la fermeture.
  Les parcours detailles et les insights Stats conservent leur circuit existant.
- `buildSeed` construit hors cloud une baseline disjointe: jours immuables
  anterieurs a `mutableSinceMs`, sessions connues posterieures avec ledgers.
  Maximum 20000 contributions de sessions/faits fusionnes et 18300 jours en
  entree; doublons/chevauchement refuses. La borne mutable doit etre minuit Paris.
  Les sources courantes priment sur les anciens faits et les exclusions priment
  sur les deux; un fait de moins de deux jours sans source precise est refuse.
  `analytics:prepare-realtime -- --input <inventaire.json>` ne fait que valider
  et retourner digest/comptages/tailles; ni acces cloud ni ecriture. L'adaptation
  et verification des faits historiques sans detail restent une preuve P4,
  pas une affirmation de completude depuis les fixtures. L'etat initial est
  toujours `paused` avec `bootstrapComplete=false`.
- `adminAnalyticsRealtimeStore.js`/`adminAnalyticsRealtime.js`: une query
  documentId allowlistee a deux IDs, partagee jusqu'a sortie du back-office ou
  perte d'acces. Le flag build `NEXT_PUBLIC_ADMIN_ANALYTICS_REALTIME=true`
  active ce chemin. Absence, schema invalide, mutation locale, revision
  regressive ou incoherente = indisponible; aucune callable de secours.
- 1 h signifie 60 minutes calendaires avec minute courante; 1 j, 24 tranches
  horaires avec heure courante. Les libelles exposent cet arrondi. 7 j/30 j et
  12 mois incluent la periode courante. L'heure UTC identifie les buckets et
  Europe/Paris les libelles: les deux heures du retour d'heure restent distinctes.
- L'horloge UI fait expirer les fenetres sans requete; cache et confirmation
  serveur sont distingues. La liste de dix sessions reste independante.
- Rules strong-admin + AAL2, refus d'ecriture client et exemptions d'index
  sont codes. Ledgers, tombstones et buckets prives sont durables, sans TTL
  autonome: leur suppression exige une compaction/baseline verifiee puis retrait
  controle de la generation. Ne pas leur appliquer le TTL des sessions brutes,
  qui casserait les corrections. Les resumes publics ont des anneaux bornes.

Validations locales de cette suite: 63 tests Node (dont 13 moteur/lecteur),
trois scenarios Emulator reels, lint cible sans erreur et build Next avec
fixture catalogue et lecteur active reussis. Aucun acces client live, aucune
recette navigateur authentifiee, aucun deploy ou bootstrap cloud. Le build
fixture local n'est pas un artefact a deployer; refaire le build sandbox normal
apres la gate P4. Les tests de permissions produisent volontairement des refus
PERMISSION_DENIED dans l'Emulator.

### Preuves P4 avant autorisation P5

Qualification terminee le 2026-09-04, 01:16 Paris:

- Commit local autorise `cf697cd63f059631fc9481c40b1a52a37e11facb`, sans push.
  Une seule Function deployee depuis un worktree propre:
  `aggregateanalyticssessiongen2-00007-bas`, ACTIVE, flag backend true,
  333m/512Mi, concurrence 1, min 0/max 1 inchanges. Transport prive Eventarc
  verifie; Rules deployees et exemptions des quatre nouvelles collections.
- Bootstrap: 627 creations de documents + un controle initial, verification
  create-only, puis activation shadow. Rattrapage des 387 sources: 173 noop et
  214 tombstones, aucune ecriture de source. Revision initiale des resumes: 1.
- Test `p4-realtime-probe-1788477320710`: trois sources fictives actives, deux
  identites fictives, reception par onSnapshot des deux resumes sans polling.
  Total 188 -> 191, trois sessions et deux visiteurs estimes dans la derniere
  heure. Trois rejeux manuels: noop, revision inchangee. Retrait via exclusions
  admin: retour a 188, sketches et compteurs annuels exactement restaures.
  Trois nouveaux rejeux refusent la resurrection (tombstone). Revision finale 7.
- Les trois sources et trois exclusions temporaires ont ete supprimees;
  absence de faits legacy de test verifiee. Les trois tombstones et les buckets
  vides restent volontairement conserves. Aucune commande, Auth ou Stripe touche.
- Comparaison independante de tous les buckets publics non nuls avec une
  nouvelle reconstruction de l'inventaire: exacte. Pause du controle testee:
  projectSession retourne disabled et ne modifie pas la revision; shadow
  retabli ensuite (deux ecritures du controle).
- Six POST Eventarc observes, tous 204, durees HTTP 0,304 a 1,275 s;
  aucune erreur >=400 ni log ERROR sur la fenetre bornee
  `2026-09-03T23:15:15Z` a `23:16:00Z`.
- Les trois creations sont visibles ensemble environ 3,2 s apres leur commit.
  Cette soustraction utilise deux horloges: precision non garantie. Les deltas
  commit->callback comprennent deux valeurs negatives (-6/-10 ms), donc ne
  prouvent aucun p95 de latence. Le premier snapshot mesure l'age de la
  projection, pas une livraison tardive. Le probe distingue desormais horloge
  locale monotone, deltas inter-horloges et premier snapshot. Pas de mesure UI.
- Preuves privees ignorees: `output/analytics-realtime/` (probe et
  shadow-verification-p4.json). Rollback source SHA-256
  `260746928e4465d2abc74675e907284d9bb3c76203a12b0c913ae780f98f1096`
  copie sous temporary hold; ancienne release Rules dans le manifeste P4.
- P5 reste fermee: aucun build App Hosting, aucun lecteur Data active, aucun
  test navigateur authentifie ou serie de trente mesures. Cout Billing reel,
  observation longue et hausse eventuelle de capacite restent P6.

Autorisation P4 et commit local (sans push/merge) recue le 2026-09-04.
Inventaire transactionnel borne: 387 sources dont 214 admins, 188 faits,
45 jours et aucune exclusion temporaire. Total conserve: 188 sessions,
dont 173 sources non-admin et 15 sessions historiques dans cinq jours de mai.
Ces cinq baselines ont ete comparees aux faits, compteurs et HLL identiques.
Treize sources attestent une ancienne datation UTC au lieu de Paris, expliquant
les ecarts de repartition sur dix jours; aucun ecart de nombre de sessions
inexplique. Ne pas recopier ces anciens jours dans la partie mutable.
La frontiere mutable est `2026-07-14T22:00:00Z`; la completude universelle de
l'historique n'est pas affirmee (`historyComplete=false`).

`inventory-analytics-realtime-sandbox.mjs` ne fait aucune ecriture cloud:
snapshot coherent, limite 2000 par collection, export local prive 0600 sans UID,
e-mail ou parcours. Les identifiants de session restent prives pour le rattrapage.
`bootstrap-analytics-realtime-sandbox.mjs` exige projet/autorisation/digest,
cree uniquement des cibles absentes, reprend un lot interrompu sans ecrasement,
verifie chaque document avant shadow puis rejoue les sources courantes et
initiales. Inventaire expire apres trente minutes. Il ne modifie pas les sources.
Les admins connus recoivent aussi des tombstones au bootstrap.

1. Autorisation explicite sandbox avant export de donnees, bootstrap ou deploy.
2. Inventorier les jours permanents, faits conserves, sessions et exclusions;
   fixer une borne mutable couvrant tous les details encore modifiables. Refuser
   les trous et conserver `historyComplete=false` tant que la couverture n'est
   pas prouvee. Un fait recent sans date de debut precise ne peut pas inventer
   des minutes pour la vue 1 h.
3. Sauvegarder les cibles/digests; charger la baseline en mode paused sans
   lecteur UI actif. Verifier comptages/digests et rattraper tous les changements
   survenus pendant cette preparation; ne pas activer sur un export non fige.
4. Activer le projecteur en shadow, mesurer rejeux/retraits/concurrence puis
   seulement activer le lecteur dans un build App Hosting cible et requalifier.
5. Rollback: revenir au build precedent (flag lecteur absent/false), puis
   mettre le controle projecteur en paused. Conserver les sources/ledgers;
   aucune suppression necessaire et aucun fallback automatique a chaud.
6. Les cohortes CPU/concurrence et budgets factures restent P6: aucune mesure
   Emulator ne justifie seule une hausse de puissance ni un cout en euros.

### P5 autorisee le 4 septembre 2026

L'utilisateur autorise explicitement l'activation du lecteur et le deploiement
App Hosting sandbox. Flag BUILD/RUNTIME ajoute dans `apphosting.yaml`;
build sandbox normal reussi (sans fixture), 38 tests cibles passes, lint global
sans erreur (127 avertissements). Le build actuellement servi avant bascule est
`build-2026-09-03-001`, deployment ID `sv-mtlle76d-daa1d98532b0`, trafic 100 %.
Cette cible est conservee pour le rollback. Aucun push/merge, production ou
Stripe live. Qualification navigateur ci-dessous; les mesures manquantes sont
explicitement conservees et ne ferment pas P5/P6.

Qualification navigateur du build `build-2026-09-03-002`, deployment ID
`sv-mtm5ndde-e6ff894eb978`:

- Chrome, session admin forte existante: les six periodes affichent leur
  resultat depuis les projections. 1 h/1 j vides, 7 j = 9 sessions,
  30 j = 33 sessions, 12 mois/Tout = 188 sessions. Les deux dernieres vues
  sont honnetement marquees Partiel (couverture anterieure non prouvee).
- Probe `p4-realtime-probe-1788478282269`, maintenu visible 45 secondes:
  trois sources fictives pour deux identites. L'ecran ouvert passe seul de
  zero a deux visiteurs/trois sessions et affiche une barre a 01:31 Paris;
  retrait ensuite visible sans Actualiser. Total 188 -> 191 -> 188,
  revisions 7 -> 10 -> 13, rejeux noop puis tombstones, compteurs/sketches
  annuels restaures exactement. Trois sources et trois exclusions temporaires
  retirees; trois tombstones conserves. Aucune operation commerce/Auth/Stripe.
- 30 allers-retours Stats -> Data: resultat present au premier controle DOM
  dans les 30 cas. Aller-retour de l'outil d'automatisation (clic et lecture
  DOM inclus): mediane 399 ms, p95 405 ms, maximum 407 ms. Ce n'est PAS le
  p95 interne clic -> pixel ni une serie d'ouvertures a froid. Les six
  changements de periode prennent 379 a 778 ms avec le meme outil.
- Sur `23:30:00Z` -> `23:33:00Z`, un seul appel Analytics POST (200, 341 ms)
  et son OPTIONS (204); le seul audit serveur confirme action=list,
  resultCount=3, aucune action overview/overview_bundle. Il s'agit de la
  liste detaillee independante, non d'un recalcul des graphiques.
- Les six livraisons Eventarc sont 204. Une nouvelle instance demarre au
  premier evenement: HTTP 4,047 s, autres livraisons 0,239 a 0,614 s.
  Temps monotone local source acquittee -> trois projections recues:
  5,466 s; cible operationnelle de 5 s depassee sur cet echantillon a froid.
  Les deltas inter-horloges commit -> callback sont 17 a 34 ms, sans horloges
  synchronisees: ils ne prouvent pas le p95 navigateur <1 s.
- Cout reel en euros non disponible sur cette fenetre. Ne pas extrapoler le
  budget d'operations en facture. Reste a qualifier: ouvertures a froid,
  p95 interne navigateur, observation longue P6 et couverture visite client
  reelle depuis l'ingestion (le probe injecte a la frontiere Firestore).
- Observation UX distincte: l'heure « Maj » reste celle de la liste detaillee,
  pas celle du dernier evenement KPI; elle ne mesure donc pas la fraicheur du
  listener. Les cartes insights Stats restent hors perimetre de cette bascule.
- Rollback reel: `p5-rollback-20260904-001` SUCCEEDED, trafic 100 % vers
  `build-2026-09-03-001`, ancien deployment ID observe dans Chrome.
  Reactivation du build qualifie via `p5-reactivate-20260904-001`, sans
  reconstruire ni redeployer de Function. Le controle producteur reste shadow;
  revenir au build precedent restaure donc exactement l'etat avant P5.
  Reactivation SUCCEEDED a `2026-09-03T23:40:34Z`, trafic 100 % vers le build
  qualifie; Chrome confirme son deployment ID et Data synchronise a zero
  apres retrait des fixtures. Onglet temporaire ferme. Manifeste durable:
  `apphostingaudit/manifests/analytics-realtime-p5.json`.

### Budget local du nouveau projecteur (hors retries)

| Operation | Lectures | Ecritures |
| --- | ---: | ---: |
| heartbeat sans changement utile filtre avant transaction | 0 | 0 |
| livraison dupliquee, contribution deja appliquee | 4 | 0 |
| nouvelle session / fermeture / correction dans les memes buckets | 11 | 8 |
| correction de date vers cinq autres buckets | au plus 16 | au plus 13 |
| ouverture KPI Data | 2 documents + lectures Rules | 0 |
| changement de periode / aller-retour onglet deja connecte | 0 | 0 |

Ce budget compte le projecteur seul, pas l'ingestion de session, le rail des
rollups existants encore necessaire aux insights Stats et au rollback, les
retries, la facturation des index/Rules, le transfert
reseau ni les listeners des autres administrateurs. Aucune economie mensuelle
ou p95 cloud apres bascule n'est declaree avant P5/P6.

## 5. Acceptation et preuves

- Ouverture Data: cible <=10 documents KPI/resumes, hors dix details de sessions
  et lectures de securite explicitement comptees. Pas de callable KPI.
- Aller-retour entre onglets: zero nouvelle ecoute identique; changement de
  periode: zero appel si buckets couverts. Les reconnexions reelles peuvent etre
  facturees, ne pas les masquer dans le rapport.
- Clic->KPI: p95 chaud <700 ms apres acces fort, global <2 s; froid mesure
  separement sans retirer les OPTIONS, App Check ou la validation Auth.
- Commit projection->callback cible p95 <1 s; source->projection->ecran mesure
  a part, objectif operationnel <5 s, pas de garantie absolue d'Eventarc.
- Compteurs exacts apres rejeu/desordre/retrait admin; HLL reste explicitement
  estime. Aucun retour arriere de revision, aucune perte aux changements d'heure.
- Budgets par chemin etablis par tests qui comptent les operations effectives;
  inclure retries, controle admin, audit, lectures de Rules et diffusion aux
  listeners. Ne pas annoncer des euros reels depuis de simples compteurs.
- Mesures cloud avant/apres sur meme fenetre et meme scenario; aucun total
  mensuel compare a une tranche de test de dix minutes. Logs limites/expurges.
- Jeux synthétiques jetables en Emulator; sandbox seulement apres autorisation
  explicite, donnees de recette scopees. Production/Stripe live interdits.

## 6. Sources et integrations

- [Agregations a l'ecriture](https://firebase.google.com/docs/firestore/solutions/aggregation)
- [Ecoutes et couts](https://firebase.google.com/docs/firestore/pricing)
- [Ordre/rejeu des triggers](https://firebase.google.com/docs/functions/firestore-events)
- [CPU/concurrence/instances](https://firebase.google.com/docs/functions/manage-functions)
- [Initialisations et cold starts](https://firebase.google.com/docs/functions/tips)
- [Cache App Hosting](https://firebase.google.com/docs/app-hosting/optimize-cache)
- Next local: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`
  et `production-checklist.md` lus; cacheComponents reste inactif.
- [Plan dashboard](../admin/OPTIMISATION_DASHBOARD_INCIDENTS.md)
- [Recette humaine](../quality/RECETTE_HUMAINE_SANDBOX.md)
- [Architecture Functions](../architecture/FUNCTIONS_RUNTIME_ADR.md)
