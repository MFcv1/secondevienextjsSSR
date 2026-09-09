# Intégration du runtime public — suite locale du 9 septembre

**Photographie de la clôture locale, avant autorisation de livraison.**
Suite actuelle : [livraison directe sandbox](LIVRAISON_SANDBOX.md).
Ce suivi complète le [plan](PLAN_PUBLIC_CHAUD.md) et le [pilote passkeys](INTEGRATION_PASSKEYS.md).
Les changements admin/UI/dépendances préexistants sont préservés. Aucun commit,
push, changement IAM, email, compte, commande ou paiement cloud créé.

## Implémentation et frontières

Les quatre passkeys restent dans `/api/auth/passkeys/[operation]`.
Le registre `shared/publicOperationTransport.mjs` ajoute 18 opérations sur
`/api/public/[operation]`, avec activation explicite par groupe :

| Groupe | Opérations |
|---|---|
| otp | send/verify CustomerLoginOtp et GuestCheckoutOtp |
| sessions | updateUserSessions |
| orders / order-status | listMyOrdersV2 / getOrderStatusClient |
| checkout | createCheckoutV2, resumeCheckoutV2 |
| payment-links | getAdminPaymentLinkPublic, prepareAdminPaymentLinkPayment, resumeAdminPaymentLinkPayment |
| promotions | previewPromotionCodeV2 |
| newsletter | drawNewsletterReward, claimNewsletterReward, listMyNewsletterRewards |
| quotes | createQuoteRequest, finalizeQuoteRequest |

Les handlers sont des factories injectables partagées avec les anciens wrappers.
Aucun proxy réseau vers les anciennes Functions ; aucun import du fichier global
de déploiement, de Sharp ou de PDF dans les modules publics. Email importé seulement
à l'envoi ; client Stripe réutilisé, nouvelles routes limitées aux clés `sk_test_*`.

Transport : POST, origine exacte, JSON 64 Kio, App Check, révocation du token fourni,
Auth obligatoire sur les opérations UID, IP établie pour les limiteurs par IP.
Enveloppe/erreurs callable conservées, réponses privées/no-store, aucun fallback
ni rejeu automatique d'une mutation. Transactions, prix/stock, HMAC, challenges
et reprises métier restent partagés avec les anciens endpoints.

Les OTP directs de la modale/checkout et le suivi historique des paiements utilisent
désormais le registre. Le tirage newsletter anticipé au survol/visibilité a été
retiré : seul le module peut être préchargé, avec SaveData respecté ; le clic tire.

Les deux lectures client `listMyOrdersV2` et `listMyNewsletterRewards` partagent
uniquement leurs requêtes simultanées, par objet Auth, huit entrées en vol maximum.
Aucun résultat conservé ; une réponse après changement d'utilisateur est rejetée.
L'aperçu promo est exclu car il peut matérialiser un code.

Le cache catalogue retient au plus trois releases validées / 24 Mio de JSON estimé
et leurs promesses concurrentes. Tous les champs du pointeur entrent dans la clé.
Pointeurs toujours relus frais, rejets non mémorisés, validation après changement,
secours et ISR 300 conservés. La limite JSON ne borne pas toute l'empreinte V8.

## Admin et corrections du plan

`readAdminSharedGen2` : nouvelle cible locale séparée, europe-west1, 1 CPU/512 Mio,
concurrence 4, min 0/max 1. Dix lecteurs bornés : commandes, retours, demandes de
retour, timeline commande, listes/détail devis, workspace factures, liens, promotions,
livraison. App Check puis claim/registre actif/AAL2 à chaque appel, avant import.
Le serveur retient le code, jamais les résultats privés. Flag client
`NEXT_PUBLIC_SHARED_ADMIN_READER=true`, désactivé par défaut.

Les sept autres candidats B restent spécialisés : Analytics, deux statuts Billing,
publication catalogue, opérations commerce, diagnostic et incidents système.
Data conserve ses canaux matérialisés. Préchargements existants bornés, arrêt hors
ligne/écran/droits, caches purgés ; aucun polling de maintien artificiel.

Corrections de classement : `getUserStats` et `deleteSession` sont admin.
`logUserConnection` n'a aucun appelant dans `src/` hors registre : endpoint dormant
conservé, aucune nouvelle collecte IP. `updateUserSessions` reste non bloquant,
une invocation dans chaque chemin de connexion, pas trois dans un même chemin.

La lecture admin des liens conserve le HMAC nécessaire aux URL signées, mais
n'initialise Stripe qu'à l'opération fournisseur. La nouvelle identité admin
n'a donc besoin d'aucun secret Stripe. Upload photos, PDF, webhooks, annulations,
remboursements et traitements de fond gardent leurs services spécialisés.

## Preuves et limites

Résultats, commandes, horodatages et empreintes :
[preuves-runtime-public.json](preuves-runtime-public.json).

Validation finale sous Node 22.23.2 : **623/623 tests Node**, **8/8 scénarios
navigateur desktop/mobile** avec fournisseurs simulés, build Next fixture réussi
(`local-public-runtime-20260909-qualified-final`), **22/22 routes compilées refusées 401
sans App Check**. ESLint ciblé : zéro erreur, six avertissements préexistants.
Les serveurs locaux ont été arrêtés. Aucun émulateur ni parcours fournisseur réel
lancé ; les transactions métier de ces suites utilisent leurs doubles de test.
Versions installées relues : Next 16.3.0, React 19.2.7, Admin SDK 13.10.0
dans les deux runtimes (la mention 13.3.1 du pilote décrit son état antérieur).
`git diff --check` passe et 203 cibles de liens locaux sont vérifiées présentes.
Aucun fichier supprimé ou renommé ; extraction dans de nouveaux modules.

Campagne `scripts/measure-public-runtime-local.mjs` : loopback et GET allowlistés,
paliers 1/4/8/16, plafond 480 requêtes et 60 s/palier, timeout 10 s, arrêt à trois
erreurs, RSS échantillonné 384 Mio ou deux fenêtres p95 lentes.
**480 réponses réussies**, environ 2,64 s, pic RSS échantillonné **165,1 Mio**.
40 échantillons par route/palier ; à concurrence 16, p95 galerie 43,1 ms,
catalogue 29,5 ms, version 31,0 ms. Premiers GET : galerie 62 ms,
catalogue 210,7 ms. Mesures de réponse complète sur fixture/loopback, pas TTFB cloud.
Campagne sur le premier build de cette reprise, avant les derniers ajustements
client ; build final et empreintes consignés séparément.

**1 CPU/512 Mio non qualifiés** : ni Docker/Podman local ni contrainte cgroup,
pas de parcours Auth/fournisseur réel pendant la charge. Importer tous les modules
métier publics sans réseau utilise 58,4 Mio RSS, pas une preuve de pic opérationnel.
Pas de comparaison avant/après représentative, ni capacité multi-instance,
lectures Firestore, p95 utilisateur ou économie démontrés. Aucune promesse de
10 000 connexions simultanées.

`PUBLIC_RUNTIME_METRICS=true` prépare des mesures par opération : App Check, Auth,
chargement, métier réussi, total, RSS et uptime. Aucun payload/token/email/IP.
CPU et concurrence doivent être rapprochés de Monitoring ; le temps fournisseur
reste inclus dans le métier tant qu'une mesure distante ne le distingue pas.

## Cloud relu sans mutation et coûts

App Hosting sert encore `secondevie-next-sandbox-build-2026-09-09-005`,
min 0/max 10, concurrence 80, ingress `all`. Les 563 révisions observées ont
minScale absent/zéro : les 563 entrées de trafic/tag ne sont pas 563 maintiens.
Passkeys : `00004-xak` et `00004-qiw`, sans minimum de service/révision déclaré,
sans ancien tag de trafic. Aucun maintien partagé activé.

Compte public : `firebase-app-hosting-compute@secondevienextjsssr.iam.gserviceaccount.com`.
Le rôle existant `firebase.sdkAdminServiceAgent` donne déjà des droits étendus
Firestore/Auth/App Check. Ni les rôles projet lus ni la politique propre du compte
ne montrent `iam.serviceAccounts.signBlob` ; héritages éventuels et signature réelle
restent à vérifier. Le compte `admin-reader-runtime` n'existe pas encore.

**0,57 € observés, 3,22 € prévus** : consultation Billing historique du 9 septembre,
non relue pendant cette reprise. Aucun coût mensuel après bascule mesuré.
10–15 €/mois reste un souhait ; 20 € n'est pas un plafond garanti.

## Cibles exactes et autorisations restantes

[Manifeste candidat](../../../deploy/public-runtime-candidate.json).
`apphosting.yaml` reste inchangé ; le build fixture n'est jamais déployable.

1. Autorisation IAM distincte : rôle personnalisé `publicRuntimeTokenSigner` ne contenant que
   `iam.serviceAccounts.signBlob`, lié au propre compte public, après vérification
   des héritages. Pas de Token Creator au projet ni Editor/Owner.
   [Contrat Firebase](https://firebase.google.com/docs/auth/admin/create-custom-tokens).
2. Secret Accessor du compte public sur les cinq secrets du manifeste seulement,
   après contrôle des bindings existants. Versions relues : OTP HMAC 1, Gmail email 2,
   **Gmail password 6**, Stripe 4, paiement HMAC 1. RUNTIME seulement, Gmail conservé.
   Aucun Resend/Stripe live ou secret de clé privée ajouté.
3. Créer le compte admin dédié, lecture Firestore via `roles/datastore.viewer`,
   accès au seul PAYMENT_LINK_HMAC_SECRET ; droit d'usage du compte pour le builder
   existant. Déployer seulement `readAdminSharedGen2` via l'allowlist ciblée.
4. Construire/livrer App Hosting avec catalogue réel, deploymentId unique,
   transports client Functions et min 0. Examiner le paquet complet : les changements
   UI/admin préexistants du worktree seraient également inclus.
5. Qualifier proxies et ingress alternatif avant tout `PUBLIC_AUTH_PROXY_HOPS`.
   L'actuel `all` ne justifie aucun nombre de sauts. Pas de valeur 1/2 devinée.
   [X-Forwarded-For Google](https://docs.cloud.google.com/load-balancing/docs/https#x-forwarded-for_header).
   Tout changement d'ingress nécessite autorisation et validation de compatibilité App Hosting.
6. Recette à effets externes : autorisation séparée avec destinataires, fixtures,
   montants et cleanup précis avant envoi. Matrice : inscription/connexion passkey,
   UV/rejeu/révocation, OTP et reprise, préparation/reprise checkout et lien Stripe test.
   Aucune lecture mail implicitement autorisée.
7. Activer seulement les groupes qualifiés ; tester une instance contrainte puis
   candidat min 1/max 3/concurrence 16, comparer 32/80. Vérifier deux rollouts et
   rollback sans ancienne révision chaude taguée. Aucun retrait massif de tags.

Rollback : rebâtir les flags client Functions, conserver endpoints min 0 et états
d'idempotence. Restaurer le rollout connu après relecture de sa disponibilité.
Un changement runtime seul ne modifie pas les anciens bundles ; ne pas réintroduire
les deux maintiens passkey pour ce rollback.

## Tableau de clôture locale

| Étape | Implémenté localement | Testé | Déployé par cette reprise | Mesuré | Restant |
|---|---|---|---|---|---|
| 1 Passkeys | Pilote partagé + métriques | Signature WebAuthn, UV/rejeu/refus HTTP | Non | Import/transport local | IP, IAM, cérémonie réelle |
| 2 OTP/sessions | 4 OTP + conversion, appelants raccordés | HMAC/transitions/reprises/guards | Non | Aucun délai email cloud | Secrets et recette réelle |
| 3 Client/checkout | Lectures, checkout/liens, promo, newsletter, devis légers | Domaines/fautes + paiement navigateur simulé | Non | Aucun gain Stripe/Firestore établi | Recette bornée, activation par groupe |
| 4 Public/admin | Cache releases, lectures simultanées privées, anticipation sans mutation, lecteur admin séparé | Caches/perte d'identité/préchargements/refus admin | Non | 480 GET fixture | IAM lecteur, UI/lectures/données réelles |
| 5 Mesure/livraison | Protocole, métriques, manifeste, rollback | Build fixture et gates locales | Non | Cloud relu, 165,1 Mio local, coût historique | Ressources contraintes, deux rollouts/rollback, p50/p95 cloud et Billing |
