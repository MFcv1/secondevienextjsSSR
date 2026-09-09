# Plan d'implémentation — un seul maintien chaud public partagé

Suite d'implémentation locale : [runtime public partagé](INTEGRATION_RUNTIME_PUBLIC.md).
Les quatre passkeys et 18 opérations publiques sont préparées, ainsi que dix
lecteurs admin dans une cible séparée min 0. Transports toujours désactivés ;
aucune bascule cloud par cette reprise. Ce suivi précise les corrections de
classement (getUserStats/deleteSession admin, logUserConnection sans appelant),
les preuves locales et les gates cloud encore ouvertes.

9 septembre 2026. **Implémentation locale demandée après audit ; livraison cloud
à qualifier séparément.** Cette proposition remplace les variantes du
[premier plan](PLAN_IMPLEMENTATION.md) : l'utilisateur demande galerie et
connexions ensemble, un seul maintien permanent, et admin à minimum zéro.
**Décision après audit : réutiliser le serveur App Hosting existant, 1 vCPU et
512 MiB, pour le public et les connexions. Un seul maintien permanent au total ;
aucun maintien dédié aux passkeys. Maximum proposé de trois répliques publiques
pour les pics, sans maintenir les deux renforts au repos. La contrainte ancienne
« max 1 » est remplacée par « un seul maintien chaud ».**
Le [rapport](README.md) et l'[inventaire des 158 Functions](INVENTAIRE.md)
restent les preuves datées. Les anciennes recommandations de séparation en
deux services chauds ne sont plus la cible.

## Priorité d'exécution après accord utilisateur

### Point de décision après lecture de la facturation du 9 septembre

Le rapport du projet affiche 0,57 € enregistrés, après 0,57 € d'économies,
et une prévision de 3,22 € pour septembre. Les principaux postes affichés sont
Secret Manager (0,22 €), Artifact Registry (0,19 €), Scheduler (0,11 €) et
Storage aux Pays-Bas (0,03 €). Le CPU Functions europe-west1 affiche 0,44 €
compensés par −0,44 € de remise. Le détail ne permet pas d'attribuer cette
remise à un programme précis. Les données du 9 sont partielles : ces montants
ne prouvent pas le coût mensuel de la configuration chaude proposée.

Les révisions passkey avec minimum 1 ont été créées le 9 septembre vers
13 h 38, heure de Paris ; celles sans maintien vers 20 h 07. La période de
configuration chaude est donc d'environ 6 h 30, pas un mois. Le résumé de
facturation couvre le 1–8 septembre et ne mesure pas encore son coût complet.

**La mutualisation vise d'abord la latence des parcours publics.** Elle ne
doit pas être présentée comme une économie démontrée sur les 0,57 € observés.
Les 10–15 € restent une enveloppe souhaitée, pas un minimum à dépenser.
Conserver la cible d'un seul maintien public, sous réserve du gain mesuré et
de la qualification mémoire ; conserver les traitements spécialisés à min 0.
Ne pas fusionner les 158 fonctions dans Next.

État : retrait des deux maintiens effectué ; quatre opérations passkey
préparées localement et désactivées par défaut ; aucun serveur partagé chaud
activé. Prochaine étape concrète : terminer la qualification du pilote passkey
(ingress/IP, droits de signature, parcours réel, mémoire et rollback), puis
migrer OTP/sessions, puis commandes et préparation des paiements. Chaque lot
doit distinguer code local, recette et bascule effective. Le cache public et
les préchargements admin restent des optimisations complémentaires ; aucun
préchargement ne doit simuler un maintien permanent par des appels périodiques.

1. Retirer les deux maintiens passkey dédiés à min 1 pour arrêter ce coût dès
   maintenant, en conservant les endpoints et leurs protections. Cette étape
   transitoire peut réintroduire un démarrage froid avant la bascule partagée.
2. Extraire les quatre handlers passkey communs et les exécuter dans Next, avec
   un transport réversible. Qualifier les droits, l'ingress/IP, le parcours réel
   et le maintien public unique avant d'activer le nouveau transport.
3. Poursuivre OTP/sessions et commandes publiques, puis les optimisations
   catalogue et back-office. Les numéros de lots ci-dessous identifient les
   périmètres, pas une obligation de terminer toutes les optimisations avant
   de retirer les anciens maintiens.

Avancement et manifeste exact : [intégration passkeys](INTEGRATION_PASSKEYS.md).
Les nouveaux handlers Next sont locaux et désactivés par défaut ; leur présence
ne prouve pas que les visiteurs les utilisent déjà.

## Mode d'emploi pour l'agent auditeur

Ce fichier est le document principal à auditer, sans devoir retrouver la
conversation. L'utilisateur demande de commencer par réunir les passkeys et le
site pour remplacer les deux maintiens passkey existants, puis de poursuivre
les optimisations. La lecture du document ne vaut pas autorisation de déployer,
modifier IAM, migrer les données ni envoyer des messages. Les consignes du dépôt restent
applicables ; les propositions de ce plan peuvent et doivent être contestées
si le code, les droits ou les mesures ne les justifient pas.

Projet : `secondevienextjsssr`. Backend App Hosting :
`secondevie-next-sandbox`, région `europe-west4`. Functions principalement
`europe-west1`. Sandbox :
https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app.
Ni production, ni Stripe live, ni domaine final ne sont inclus.

Référence Git locale observée : `main`,
`424239b30d24f02e7bc4f394395ee8a776b6ec45`, worktree modifié. Les correctifs
admin existants sont locaux et non déployés selon les preuves de ce chantier.
Révision App Hosting observée antérieurement : `build-2026-09-09-005` ; sa
correspondance Git exacte reste à établir. Actualiser ces faits avant exécution.

Livrable attendu de l'auditeur : verdict réalisable / corrections nécessaires,
constats priorisés avec preuves et lignes de code, risques de régression,
contradictions de coût, éléments manquants et changements précis à apporter au
plan. Un audit documentaire ne déclenche pas automatiquement un scan de sécurité.

Points décisifs à contredire ou confirmer :

1. Les opérations déplacées s'exécutent dans Next et ne redémarrent pas en
   coulisse les anciennes Functions.
2. Le public tient réellement dans 512 MiB / une instance aux charges testées.
3. App Check, Auth, WebAuthn, OTP, droits et isolation des caches restent valides.
4. Le compte technique public a seulement les permissions requises ; une route
   séparée n'isole pas les privilèges dans un même processus.
5. Tous les anciens minimums payants et les effets des tags/révisions sont
   comptabilisés, y compris pendant migration et rollback.
6. Le back-office ne précharge que des lectures utiles et ne partage pas de
   données entre utilisateurs ; aucun maintien permanent ne lui est ajouté.
7. Le coût présenté sépare maintien, activité et autres produits ; le plafond
   d'instances n'est pas présenté comme un forfait ni un plafond de dépenses.

## Ce que la cliente et les visiteurs constateraient

Le site disposerait d'un serveur déjà disponible pour afficher les pages qui
ne sont pas dans le cache et traiter les connexions. Il ne faudrait plus
réveiller une petite application différente à chaque étape d'un même parcours.
Le contenu public déjà préparé continuerait à être distribué par le CDN.

Dans le back-office, le tableau de bord s'afficherait en premier. Pendant que
l'admin le consulte, le site préparerait progressivement les premières données
des autres onglets. Un onglet déjà préparé afficherait ses données directement,
puis les actualiserait au besoin. Un clic très rapide sur un onglet non préparé
pourrait encore attendre : on évite un coût permanent pour deux utilisateurs.

Une instance chaude ne supprime pas le téléchargement des images, l'exécution
du JavaScript, les appels Firebase Auth/Stripe ni le délai de réception d'un
email. Le plan traite donc aussi les données et le navigateur, pas uniquement
le nombre d'instances.

## Configuration proposée et règle de choix mémoire

Réutiliser **App Hosting existant en europe-west4**, sans nouveau serveur public
supplémentaire : 1 vCPU, **512 MiB**, un minimum public total de 1 / maximum proposé de 3, facturation à la
requête. Les anciennes Functions passkey deviennent min 0 après bascule.

La mémoire actuelle de Next atteint environ 55 % dans les agrégats de l'audit ;
cela justifie de tester 512 MiB, pas d'affirmer que l'assemblage tiendra déjà.
Les bibliothèques et connexions Firebase doivent être réutilisées et les caches
bornés. Mesurer l'application réunie avant de décider le réglage livré.

- Retenir 512 MiB si les essais représentatifs n'ont ni OOM ni croissance mémoire
  continue, avec RSS maximal inférieur à environ 75 % de l'allocation et latence
  satisfaisante. Ce seuil est une marge de qualification, pas une loi universelle.
- Si la mémoire dépasse cette marge, réduire les imports/caches/allocations et
  la concurrence, puis recommencer les essais concernés. Si le problème reste
  présent, signaler l'échec de qualification 512 MiB avec preuves ; ne pas livrer
  une configuration instable et ne pas augmenter les ressources sans une
  nouvelle décision de l'utilisateur.
- Concurrence candidate 16, à comparer à 32 et à l'actuelle 80 sur Next.
  Retenir le meilleur compromis mesuré entre attente, débit et mémoire, sans
  supposer que la plus petite valeur est la meilleure.
- **Maximum proposé de 3 pour le public**, avec seulement un maintien permanent.
  Les renforts temporaires sont facturés à l'usage et ne garantissent pas la tenue
  de 10 000 connexions simultanées. Mesurer le débit et les limites ; Firestore ne
  supprime pas le goulot du serveur. Ce réglage n'est pas une garantie du nombre physique
  à tout instant : Google documente des dépassements transitoires et les
  révisions/taguées nécessitent un contrôle distinct.
- Services admin, analytics et workers : minimum zéro. Aucun nouveau service
  identité à min 1. Aucun engagement CUD annuel ni déménagement aux États-Unis.

Configuration cible à appliquer ultérieurement dans `apphosting.yaml`, sans
écraser le reste du fichier (concurrence 16 = valeur initiale de qualification) :

```yaml
runConfig:
  minInstances: 1
  maxInstances: 3
  concurrency: 16
  cpu: 1
  memoryMiB: 512
```

Vérifier aussi la configuration cloud effective et les éventuelles surcharges
de la console. Contrôler les niveaux service/révision : un maximum par révision
ne limite pas nécessairement toutes les révisions cumulées. App Hosting doit
rester propriétaire de son cycle de déploiement ; le mécanisme retenu doit
survivre au rollout suivant.

**Ne pas appliquer le YAML min 1 seul.** La configuration observée porte le
minimum au niveau révision. Avant activation, prouver un minimum de service
durable compatible App Hosting ou le retrait ciblé des tags des anciennes
révisions chaudes dans chaque livraison. Tester deux rollouts et un rollback.
Le YAML existant reste inchangé tant que ce mécanisme n'est pas qualifié.
[Limites officielles du maximum](https://docs.cloud.google.com/run/docs/configuring/max-instances).

« Une instance » désigne ici le **service public regroupé**. Une Function admin
ou un worker à min 0 peut démarrer une instance lors d'un appel. Firestore,
Storage et Firebase Auth restent des services distincts. Le plan ne promet donc
pas un unique processus pour tout le projet Google Cloud.

## Répartition des opérations : tous les groupes de l'inventaire

| Famille | Destination et ordre | Effet concret |
|---|---|---|
| Pages galerie, catégories, produit, recherche, API catalogue/version | App Hosting partagé, lot 1 | Réutiliser les pages préparées et éviter le démarrage d'un serveur au premier accès origine |
| Passkeys : options + vérification, connexion et enregistrement | Handlers exécutés directement dans Next, lot 2 | Enchaîner les étapes sur le même runtime disponible |
| OTP client et invité : envoi + vérification | Même runtime public, lot 2 ; transport email existant importé à la demande | Supprimer le démarrage de Functions de connexion supplémentaires, conserver le délai fournisseur réel |
| Sessions utilisateur : updateUserSessions, logUserConnection, deleteSession | Même runtime, lot 2 après contrôle du besoin de chaque appel | Dédupliquer les mises à jour ; seules celles nécessaires à la validité de session bloquent le succès |
| Lectures client : listMyOrdersV2, getOrderStatusClient, listMyNewsletterRewards, getAdminPaymentLinkPublic, getUserStats | Routes publiques ou privées selon contrat, même runtime, lot 3 | Éviter un nouveau démarrage dans l'espace client et les liens de paiement |
| Checkout create/resume et préparation/reprise de paiement par lien | Commandes légères dans le runtime public, lot 3, sans déplacer les webhooks | Réduire notre attente serveur avant Stripe ; prix, stock et idempotence restent autoritaires |
| Newsletter : draw/claim reward, preview promotion ; devis create/finalize | Même runtime pour commandes interactives légères, lot 3 | Réduire l'attente après action ; ne jamais exécuter ces écritures par préchargement |
| Photos devis, PDF, traitement images, emails de fond, signatures webhook, publication catalogue | Workers/endpoints spécialisés min 0 conservés | Leur travail lourd ne ralentit pas la galerie ou les connexions |
| Analytics initLiveSession, syncSession, syncSessionBeacon ; trackAdminIP | Min 0, lot 4 sur fréquence et déduplication | Réduire les appels plutôt que donner une instance permanente à la collecte |
| Lecteurs admin (17 candidats du groupe B) | Préchargement puis API commune min 0, lot 4 | Un amorçage partagé, premières pages mises en cache privé |
| Autres commandes admin, intégrations Meta/Stripe Connect, événements Auth, planifications et reprises | Min 0 conservé ; seulement correctifs ciblés de fréquence/imports justifiés par mesure | Préserver les parcours rares utiles sans ajouter de maintien permanent |

Cette table précise les destinations nouvelles des groupes I/P/B/T/W/S du
premier inventaire. Les 35 événements/planifications et le reste des commandes
spécialisées ne doivent pas être fusionnés pour atteindre artificiellement
« deux services au total ». L'objectif porte sur **un seul socle chaud**.
Le lot 3 est nécessaire pour annoncer des parcours publics complets optimisés ;
un pilote limité aux passkeys doit être présenté comme tel.

Google Sign-In et Firebase Auth restent des services gérés ; on regroupe notre
code de préparation/vérification, pas leurs infrastructures. Le temps de saisie
du code, Face ID/Windows Hello, Google et la délivrabilité email ne sont pas des
gains de serveur que nous pouvons promettre.

## Lot 0 — baseline, coût réel et contrat de migration

### Points d'entrée à relire avant modification

| Périmètre | Sources à examiner dans le dépôt |
|---|---|
| Consignes / contrats | `AGENTS.md`, `map.md`, `_DOCS/README.md`, chapitres Auth/Commerce/Back-office/Cache/Qualité pertinents |
| Runtime / build | `package.json`, lockfiles, `functions/package.json`, `next.config.mjs`, `apphosting.yaml` ; guides de la version installée dans `node_modules/next/dist/docs/` avant code Next |
| Galerie | `app/page.jsx`, `src/kit/marketplace/GalleryRoutePage.jsx`, `GalleryServerView.jsx`, `GalleryGridActionsIsland.jsx`, `CatalogVersionSyncIsland.jsx` |
| Catalogue serveur | `src/lib/server/materializedCatalog.js`, `materializedCatalogValidation.cjs`, `app/api/catalog/route.js`, `app/api/catalog/version/route.js` |
| Identité serveur | `functions/src/auth/passkeys.js`, `passkeyRegistration.js`, `customerLoginOtp.js`, `guestCheckoutOtp.js`, `otpState.js` ; helpers runtime/clientIp/secrets |
| Identité navigateur | `src/kit/auth/authStore.js`, `passkeyPreparation.js`, `src/kit/contexts/AuthContext.jsx`, `src/kit/marketplace/LegacyLoginModalFullIsland.jsx` et appelants réels |
| Transport / SDK serveur | `src/kit/config/functionTargets.js`, `src/lib/server/firebaseAdmin.js`, initialisations Admin SDK côté Functions |
| Admin | `app/admin/AdminAppIsland.jsx`, `src/kit/admin/adminPreloadQueue.js`, `AdminDashboard.jsx`, `AdminReturns.jsx`, `AdminPaymentLinks.jsx`, `AdminPromotionCodes.jsx`, `promotionCodeClient.js`, `src/kit/commerce/adminPaymentLinkClient.js` |
| Entrées Functions / collecte | `functions/src/admin/readerEntrypoint.js`, `functions/index.js`, `src/kit/shared/AnalyticsProvider.jsx`, producteurs sessions/rollups concernés |

Les chemins abrégés d'une même cellule sont relatifs au répertoire indiqué en
début de cellule. Rechercher les imports et appelants des opérations de la table
de répartition ; ne pas supposer que tous les appels passent par functionTargets.
Ne pas lire les fichiers `.env` ou imprimer des secrets pour établir ces liens.

Baseline cible Node 22 et versions réellement verrouillées ; ne pas migrer Next,
React ou Firebase SDK au milieu de ce chantier de performance. Les correctifs
admin déjà présents comprennent cache Liens/Promo, file séquentielle et entrées
lecteurs allégées : les relire, préserver puis qualifier, sans les réimplémenter
par-dessus ni présenter leurs tests historiques comme une recette du regroupement.

1. Actualiser inventaires, Git et révisions réellement servies. Capturer
   paramètres et rollback ; préserver les correctifs locaux admin déjà présents.
2. Lire le rapport Cloud Billing par SKU/projet et les crédits réellement
   appliqués si les accès le permettent. Sans cet accès, conserver des estimations
   avant franchise, jamais une facture inventée. Ne pas ouvrir un export BigQuery
   payant uniquement pour obtenir quelques chiffres de départ.
3. Instrumenter avec noms d'opérations bornés : total, Auth/App Check, base,
   fournisseurs, sérialisation, cache, démarrage. Aucune donnée personnelle dans
   les labels/logs. Mesurer CPU, RSS et temps d'attente avec plusieurs requêtes.
4. Baseline navigateur mobile/desktop : arrivée galerie, produit, retour galerie,
   connexion, commandes, devis, paiement ; admin Stats/Data/ventes/retours/devis/
   factures/liens/promo. Distinguer première visite, cache, utilisateur connecté.

Sortie : tableau avant/après renseignable, source livrée certaine, coûts
observés ou indisponibilité explicitement signalée.

## Lot 1 — alléger le public avant d'acheter de la capacité

- Dans `materializedCatalog.js`, mémoriser le snapshot validé par identité
  immuable avec taille maximale, et la promesse de chargement concurrente.
  Relire les pointeurs frais, conserver les contrôles d'intégrité et secours.
  La version de 142 octets ne doit pas revalider sans nécessité l'intégralité
  du catalogue à chaque vérification.
- Conserver HTML ISR 300 s, CDN et revalidation ciblée après publication.
  Le premier accès après changement de contenu doit encore produire la bonne
  version ; aucune longue durée de cache ajoutée aux pointeurs ou données privées.
- Examiner les 798 ko d'HTML décompressés et les données sérialisées, retirer
  les duplications inutiles. Vérifier tailles réellement transférées des images,
  petites variantes, priorité à l'image initiale, polices et imports JavaScript.
- Reporter analytics et composants secondaires après l'affichage ; réutiliser
  Firebase Auth/App Check, ne pas réinitialiser plusieurs SDK pour une navigation.
- Anticiper seulement le contenu visible/proche ou visé par l'utilisateur,
  avec SaveData respecté. Ne pas charger toutes les pages chez chaque visiteur.
- Garder le signal catalogue borné existant ; fusionner ses vérifications
  simultanées. Un ETag économise une réponse, pas forcément toutes les lectures
  serveur : mesurer les deux.

Sortie : cache fonctionnel après publication/rollback, baisse des calculs et
octets démontrée, aucune régression visuelle/scroll/focus/stock.

## Lot 2 — galerie et connexions réellement dans la même application

Extraire les handlers des modules `functions/src/auth/passkeys.js`,
`customerLoginOtp.js`, `guestCheckoutOtp.js` et sessions vers un package métier
partageable. Les handlers sont déjà exportés, mais leurs fichiers importent
encore les wrappers Functions et initialisent Firestore au chargement : ce ne
sont pas des modules Next prêts à importer tels quels.

Produire un manifeste de migration versionné pour chaque opération : nom
logique, ancien endpoint déployé, nouvel endpoint same-origin, fichier handler,
appelants, schémas entrée/sortie, règles Auth/App Check, secrets/permissions,
idempotence, cache, tests et retour arrière. Aucune opération omise ne doit
être réputée déplacée par déduction.

Première allowlist exacte : `generatePasskeyAuthenticationOptionsGen2`,
`verifyPasskeyAuthenticationGen2`, `generatePasskeyRegistrationOptionsGen2`,
`verifyPasskeyRegistrationGen2`, `sendCustomerLoginOtpGen2`,
`verifyCustomerLoginOtpGen2`, `sendGuestCheckoutOtpGen2`,
`verifyGuestCheckoutOtpGen2`. Les sessions et autres opérations suivent la
table de répartition et doivent être ajoutées explicitement au manifeste.

Contrat de transport à préciser dans le code : routes POST d'authentification,
JSON borné et validé, pas d'identifiants/OTP dans les URLs, méthode et content-type
vérifiés, erreurs traduites sans contenu sensible. Choisir une route dédiée par
opération ou un dispatcher sur allowlist fermée ; jamais d'import de module ou
d'appel de fonction sélectionné librement depuis la requête.

- Routes Node Next sous `/api/auth/...`, no-store. Dépendances injectées,
  Firebase Admin partagé, bibliothèques lourdes uniquement où nécessaires.
  Initialiser les dépendances critiques avant readiness si le packaging permet
  de supprimer leur coût au premier appel ; mesurer le résultat, ne pas le
  remplacer par des pings périodiques ou du travail non attendu après réponse.
- Préserver les formats d'erreur utiles ; adapter les clients qui utilisaient
  `httpsCallable`. Pas de proxy vers une ancienne Function comme solution finale.
  Le same-origin peut éviter un preflight CORS de nos appels ; il n'élimine pas
  les appels nécessaires aux services externes.
- Auth et App Check vérifiés explicitement sur le nouveau transport ; origine,
  RP ID, user verification, challenge/OTP, limitation de tentatives, session et
  idempotence conservent leurs contrats. Ne jamais considérer un client masqué
  ou une route interne comme une autorisation.
- Documenter la réunion des privilèges dans le compte technique public : ce
  n'est pas une isolation par route. Accès minimaux aux collections/secrets et
  à la signature du custom token ; pas de rôle Editor/Owner ou de droits admin
  financiers ajoutés par facilité. Secrets runtime uniquement, jamais build,
  HTML, client ou `NEXT_PUBLIC_*`.
- Préserver les pages publiques statiques : pas de cookie serveur/global
  d'identité introduit dans le layout galerie ; réponses de connexion privées.
- Conserver les envois OTP attendus et leur idempotence. Pas de nouvelle file
  asynchrone déclarant un envoi réussi avant un traitement durable.

Sortie : enregistrement/connexion passkey, OTP et Google de secours testés,
aucun double envoi, aucun challenge rejoué, session invalide refusée, connexion
réussie uniquement après `loginWithCustomToken`. Qualification mémoire à 512 MiB.

## Lot 3 — autres parcours publics

Adapter `functionTargets.js` et les clients concernés par un registre de
transport explicite, opération par opération. Les anciens endpoints restent
disponibles pendant la transition, à minimum zéro.

Lectures : borner pagination/champs, dédupliquer les requêtes en cours et
mettre en cache privé par utilisateur avec invalidation après mutation.
Éviter une succession de fetch indépendants si une même projection suffit.

Commandes checkout/newsletter/devis : préserver transactions, prix/stock
serveur, autorisations, clés d'idempotence, reprises et réponses existantes.
Charger Stripe/transport email à la demande, sans charger Sharp/PDF dans le
chemin galerie. Extraire les handlers réutilisables, pas tout le module de
déploiement Functions et ses secrets.

Aucun appel de paiement, réservation, tirage newsletter ou envoi déclenché
par survol/préchargement. Un résultat de paiement reste confirmé seulement
après état durable approprié ; une mutation ambiguë n'est pas rejouée aveuglément.

Sortie : chaque route publique du tableau a une destination vérifiée et une
preuve fonctionnelle. Les éventuelles opérations gardées froides sont nommées
et leur délai résiduel communiqué avant de déclarer le lot terminé.

## Lot 4 — admin et collecte à minimum zéro

Livrer d'abord les correctifs locaux existants après revalidation : file après
Stats, Data puis ventes/retours/devis/factures/liens/promotions/livraison ; une
préparation à la fois, première page seulement, arrêt hors ligne/caché/retrait
de droits. Clic prioritaire, pas d'export ou de reconstruction en arrière-plan.

Puis mutualiser les lecteurs qui causent les démarrages successifs dans une
API admin **min 0**, en préservant claim + registre actif + AAL2 + App Check.
Pour cette API admin nouvelle : min 0 / max 1, 1 vCPU / 512 MiB et concurrence
initiale 4 à qualifier avec les deux opérateurs. Ne pas réécrire globalement les
maxInstances des workers existants, qui ont leurs propres contraintes métier.
Ne pas placer ces lecteurs privilégiés dans le runtime public simplement pour
profiter de sa chaleur. Cache privé purgé à la déconnexion/retrait des droits,
actualisation après mutation, donnée absente distincte de zéro.

Pour analytics : consentement, batching/déduplication, arrêt hors écran,
absence de heartbeat inutile, pas de synchronisation de session inchangée.
Conserver les événements nécessaires au métier et vérifier leur fraîcheur.
Les rejets historiques ne sont pas du trafic utilisateur à dimensionner.

Les planifications sont revues selon leur travail utile : compter scans,
documents changés et reprises, pas seulement invocations. N'espacer aucune
expiration/réconciliation sans vérifier les garanties de stock et paiement.

Sortie : navigation admin déjà préparée sans skeleton bloquant dans le cas
chaud, premier accès non préparé mesuré, volume de lectures avant/après connu.
Le préchargement déplace et peut augmenter des lectures : aucune promesse
automatique d'économie Firestore.

## Coûts : modèle applicable à notre projet

Documentation pertinente relue : services Cloud Run à la requête, minimum
d'instances et versions taguées, Functions Gen1/Gen2, App Hosting, Firestore,
Storage, franchises et engagements. Cela n'est pas une consultation de la
facture réelle. Les grilles Jobs/CPU alloué en permanence ne servent pas à
chiffrer le socle public proposé.

Belgique `europe-west1` et Pays-Bas `europe-west4` sont dans le même niveau de
prix Cloud Run que `us-central1`. Le gratuit est partagé au compte de
facturation ; aucun avantage justifiant un déplacement aux États-Unis ici.

Pour l'instance publique 1 vCPU / 512 MiB, 730 h/mois, prix USD hors franchises,
taxes, réseau et autres produits :

| Activité du serveur public sur le mois | Total estimé du calcul public |
|---|---:|
| Référence : uniquement maintenu au repos | 9,86 $ |
| 10 heures actives, 720 heures au repos | 10,63 $ |
| 100 heures actives, 630 heures au repos | 17,60 $ |

Les lignes sont des alternatives, pas des montants à additionner. Un visiteur
qui lit une fiche cinq minutes ne fait pas travailler le serveur cinq minutes.
Une réponse peut être préparée en une fraction de seconde, puis le serveur
attend. Les durées ci-dessus sont illustratives, pas une prévision du trafic.

Les heures sont du **temps d'instance actif**, pas la somme des durées de
requêtes simultanées. Référence : CPU idle 0,0000025 $/s ; actif 0,000024 $/s ;
mémoire 0,0000025 $/GiB/s dans les deux cas. Chaque heure active remplaçant une
heure idle ajoute 0,0774 $ de CPU. Les requêtes sont en supplément selon leur
franchise (0,40 $/million hors franchise). Démarrages et chevauchements transitoires
ajoutent du temps facturable. [Tarifs Cloud Run](https://cloud.google.com/run/pricing).

**Budget de travail : environ 10–11 $/mois pour le calcul public à faible
activité en 512 MiB, avant crédits, sans en faire une garantie.** Le total Firebase ne peut pas
être borné à ces montants sans consommation et facture détaillées.

Postes à surveiller séparément :

- App Hosting : bande passante CDN/hors cache, builds, artefacts, secrets et
  logs ; les téléchargements en cache ne sont pas tous gratuits.
  [Grille App Hosting](https://firebase.google.com/docs/app-hosting/costs).
- Firestore : lectures de documents/index, écritures, écoutes et reconnexions,
  suppressions TTL, stockage/sauvegardes ; ce coût ne disparaît pas en fusionnant
  les Functions. [Facturation Firestore](https://firebase.google.com/docs/firestore/pricing).
- Storage : photos et snapshots, opérations et sorties réseau selon bucket/
  région ; ne pas appliquer automatiquement une franchise de région US à nos
  buckets européens. [Facturation Storage](https://cloud.google.com/storage/pricing).
- Les 3 Functions Gen1 Auth restantes, les Gen2 à min 0 et les tâches planifiées
  restent facturables à l'usage. Aucun maintien permanent supplémentaire prévu.
- Cloud Scheduler facture les tâches définies, même en pause, et non chaque
  exécution : 0,10 $ par tâche sur 31 jours, trois offertes par compte. Espacer
  une tâche réduit éventuellement ses lectures/exécutions, pas son abonnement
  Scheduler. Examiner les doublons avant tout retrait, pas simplement le nombre
  d'appels. [Tarif Scheduler](https://cloud.google.com/scheduler/pricing).
  Les opérations Cloud Tasks et la livraison d'événements ont également leurs
  compteurs propres, distincts de l'exécution des Functions ; les mesurer dans
  les SKU de la facture. [Tarif Cloud Tasks](https://cloud.google.com/tasks/pricing).
- Aucune remise annuelle achetée : mesurer d'abord le socle réel après
  franchises, puis reconsidérer seulement si l'économie justifie l'engagement.

### Empêcher les maintiens cachés

L'inventaire App Hosting de l'audit contient **563 entrées avec tag de trafic**.
Cela ne signifie pas 563 instances payantes : leurs minimums ne sont pas tous
établis par cette observation. Mais Google précise qu'un minimum au niveau
révision avec un tag peut maintenir cette révision chaude sans trafic normal.

Avant activer min 1 : établir le comportement de `runConfig.minInstances` dans
le rollout App Hosting et contrôler les minimums de toutes les révisions taguées.
Préférer un minimum de service lorsqu'il est compatible avec la gestion App
Hosting ; sinon prévoir une gestion des anciennes références taguées dans le
workflow de livraison, sans casser le rollback. Pas de changement manuel
éphémère que le prochain rollout annule, ni de suppression massive de tags
avant étude de leurs usages.

Critère de livraison : **un seul socle chaud public en régime établi**, aucune
ancienne passkey ni ancienne révision conservée chaude par inadvertance.
Une transition peut temporairement coûter davantage, à mesurer.
Vérifier les anciennes passkeys au niveau de leurs révisions, pas seulement
leurs derniers paramètres Functions. Conserver un ancien endpoint à min 0 ne
garantit pas qu'une vieille révision taguée a cessé d'être maintenue chaude.
[Règles officielles minInstances et tags](https://docs.cloud.google.com/run/docs/configuring/min-instances).

## Gains attendus et recette de sortie

| Parcours | Attente supprimée ou réduite | Objectif à vérifier, pas résultat acquis |
|---|---|---|
| Première galerie hors cache | Démarrage serveur et validations répétées | Viser TTFB origine chaud < 800 ms ; plusieurs secondes peuvent être gagnées sur le cas à 6,3 s, sans promettre leur suppression totale |
| Galerie déjà en cache | Rendu serveur déjà évité ; optimiser octets/images/JS | Préserver réponse CDN rapide ; viser LCP ≤ 2,5 s sur profil mobile de référence |
| Navigation produit/retour | Données/imports rechargés inutilement | Transition sans écran intermédiaire ni flash et état/scroll restaurés |
| Connexion | Démarrages entre étapes et appels redondants | Viser traitement serveur p95 < 1 s par étape hors délai email/interaction humaine ; gain supplémentaire potentiellement modeste pour passkeys déjà chaudes aujourd'hui |
| Checkout/espace client | Démarrages de Functions et fetch répétés | Mesurer séparation temps interne/fournisseur ; aucune promesse sur la latence Stripe |
| Admin préparé | Données déjà chargées pendant consultation de Stats | Viser affichage utile < 300 ms après clic si cache valide ; premier passage non préparé garde une attente possible |

Ces objectifs sont des cibles d'ingénierie. LCP est qualifié sur un profil
documenté et confirmé ensuite par mesures terrain ; quelques sondes locales
ne prouvent pas un percentile réel d'utilisateurs. La sonde 6,3 s puis 17 ms
du précédent audit est un exemple daté, pas une moyenne ni une promesse de gain.

Recette : tests unitaires/contrats ciblés, build et budget bundles ; navigation
mobile/desktop ; login complet WebAuthn/OTP ; refus Auth/App Check ; absence
de fuite de cache ; changements de catalogue ; admin simultané ; lectures par
paliers 1/4/8/16 avec durée et arrêt bornés. Toute recette qui émet des emails
ou manipule Stripe suit sa propre autorisation sandbox ; aucune action live.

Si le CPU est peu occupé mais la requête lente, corriger base/réseau/fournisseur
avant d'ajouter CPU ou RAM. La mémoire ne pilote pas l'autoscaling : suivre
RSS/OOM séparément, ainsi que 429/5xx, attente, p95 et cache HIT/MISS.

### Protocole borné pour la capacité d'une instance

Qualifier d'abord le bundle réellement construit avec 1 vCPU / 512 MiB / max 1, pas le
serveur de développement. Documenter le poste/réseau, le jeu de données et les
durées. Comparer repos prolongé, premier appel à chaque route, puis répétitions.

Pour les lectures seules : paliers 1, 4, 8 et 16 requêtes simultanées, maximum
60 secondes par palier, plafond de 600 requêtes au total pour une campagne.
Arrêter sur OOM, erreurs répétées ou p95 > 2 secondes pendant deux fenêtres
successives de dix secondes lorsque le volume permet ce calcul. Ces seuils
sont des règles de qualification proposées, pas des garanties de production.
Reporter p50/p95, maximum, erreurs, CPU/RSS, taille de réponses et lectures base.
Au moins 30 échantillons sont requis pour publier un p95 ; sinon publier les
mesures individuelles et le faible effectif.

Tester aussi une connexion pendant une rafale de lectures. Les actions à effets
(email, réservation, paiement, création de compte) ne font pas partie du burst
de lectures : mocks/émulateurs pour la concurrence métier, puis recette sandbox
bornée autorisée. Ne pas réutiliser un challenge passkey consommé pour simuler
des utilisateurs et ne pas se servir de la production comme générateur de charge.

Publier le point de rupture d'une seule instance, puis qualifier séparément les
renforts temporaires jusqu'à max 3. Vérifier la publication et l'invalidation
du catalogue sur plusieurs répliques. Un résultat à trois instances ne doit pas
être présenté comme la capacité d'une seule. Le plafond de 600 requêtes sert
au diagnostic initial, pas à promettre 10 000 connexions simultanées.

## Livraison, contrôle et retour arrière

Implémenter les lots localement, puis préparer une livraison ciblée sandbox
avec preuves et prix de configuration. Aucun commit/push/déploiement autorisé
par la seule rédaction de ce plan. Pas de déploiement global des 158 Functions.

### Ordre de bascule à faire auditer

1. Préparer les handlers partagés et les nouveaux transports, avec anciens
   wrappers conservés. Vérifier la compatibilité fonctionnelle et les droits.
2. Qualifier localement la configuration contrainte ; préparer le paquet exact
   App Hosting et les seules modifications Functions nécessaires.
3. Dans une recette sandbox explicitement autorisée, valider les nouveaux
   endpoints avant de basculer les clients ; documenter comment une version
   de test est routée sans ajouter un maintien chaud permanent.
4. Basculer ensemble transport public et configuration App Hosting : un seul
   minimum permanent, max 3 proposé / 512 MiB. Vérifier que les anciennes passkeys
   restent à min 0 ; réduire au minimum le chevauchement de maintiens et conserver
   sa durée dans les preuves. Il n'existe pas de transaction atomique regroupant
   tous ces déploiements : l'ordre et le rollback doivent être préparés.
5. Vérifier les tags/révisions, le trafic effectif et les anciens endpoints.
   Une vieille page navigateur peut encore appeler une Function froide :
   compatibilité conservée, pas promesse de performance du nouveau transport
   pour une page qui n'a jamais rechargé sa nouvelle version.
6. Livrer/qualifier l'admin min 0 indépendamment de l'activation du maintien
   public pour faciliter le diagnostic. Aucun préchargement n'exécute de mutation.

Ne pas modifier le RP ID/WebAuthn simplement parce que le serveur change de
transport. Le navigateur reste sur le même domaine ; la préparation d'un domaine
de production et l'éventuelle réinscription des passkeys restent hors périmètre.

Conserver les anciens endpoints à min 0 pendant la transition et un registre
client permettant un retour de transport. Ne pas jouer les écritures en double
pour comparer. Vérifier que le nouveau service exécute les handlers et n'appelle
pas systématiquement les anciennes Functions. Retirer leurs min 1 dès bascule
qualifiée, sans les supprimer tant que des clients anciens peuvent les utiliser.

Après livraison autorisée : vérifier révision/paramètres, authentification,
cache, latences, erreurs et coût facturable ; recontrôler après chaque rollout
les anciennes révisions taguées. Définir des alertes de dépense convenues et
de mémoire/latence, sans arrêt automatique du site à un montant arbitraire.
Une alerte budgétaire n'est pas un plafond dur de facture.

Rollback préparé : ancienne révision + transport + IAM/configuration capturés,
sans toucher aux données métier. Ne déclarer le site prêt à présentation que
sur les parcours réellement qualifiés ; l'optimisation ne clôture pas les
réserves de délivrabilité email, PDF ou domaine de production existantes.

## Validation de cette proposition

### Checklist de fin d'implémentation (à renseigner, aucune case acquise)

- [ ] Manifestes des opérations déplacées et des endpoints restés séparés complets.
- [ ] Nouvelle exécution directe prouvée ; pas de relais systématique vers les anciennes Functions.
- [ ] App Hosting effectif : 1 CPU, 512 MiB, un seul minimum permanent, max 3 proposé ; concurrence documentée.
- [ ] Anciens endpoints passkey et révisions taguées sans maintien chaud résiduel.
- [ ] Back-office et API admin à min 0, aucune lecture privée dans un cache partagé non cloisonné.
- [ ] Contrats Auth/App Check/OTP/WebAuthn/transactions conservés et tests de refus passés.
- [ ] Données de catalogue fraîches après publication et rollback ; cache CDN public vérifié.
- [ ] Aucun OOM ni croissance mémoire continue, limite de charge constatée et publiée.
- [ ] Avant/après navigateur et serveur séparés, gains mesurés sans attribuer les délais fournisseurs au CPU.
- [ ] Coût réel ou estimé clairement identifié ; aucun crédit gratuit appliqué deux fois.
- [ ] Recette cliente sans régression, réserves résiduelles explicites, rollback reproductible.

Le compte rendu final de l'implémentation devra présenter cette checklist avec
preuves, commandes exécutées, échecs/non-exécutés et état local/déployé. Une case
non prouvée reste ouverte. L'agent auditeur doit notamment vérifier que les tests
proposés couvrent les ruptures de transport et de droits, pas seulement le code
heureux ou l'absence de loader.

La rédaction initiale était sans modification de source ou de cloud. La suite
autorisée est tracée dans [INTEGRATION_PASSKEYS.md](INTEGRATION_PASSKEYS.md), qui
distingue les changements cloud ciblés, le code local, les tests et les gates ouvertes.
