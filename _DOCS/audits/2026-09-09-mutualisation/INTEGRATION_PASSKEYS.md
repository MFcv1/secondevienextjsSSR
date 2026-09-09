# Premier lot : suppression des maintiens passkey et intégration Next

**Suivi ultérieur : [intégration runtime public](INTEGRATION_RUNTIME_PUBLIC.md).**
Ce document conserve la preuve du premier lot ; OTP, sessions et parcours publics
ont depuis été préparés localement. Aucune activation cloud supplémentaire.

9 septembre 2026. Demande utilisateur : corriger le plan et commencer par
remplacer les deux maintiens passkey séparés par un seul serveur public partagé.
Branche locale `main`, base `424239b30d24f02e7bc4f394395ee8a776b6ec45`, travail
admin et documentaire préexistant préservé. Aucun commit/push.

## État réel

- **Cloud : les deux fonctions de connexion sont maintenant min 0**, vérifiées
  ACTIVE le 9 septembre à 18:08 UTC. Aucun minimum de service ni ancienne révision
  chaude encore référencée par tag/traffic sur ces deux services.
- La mutation porte uniquement sur `serviceConfig.minInstanceCount`, via PATCH
  Cloud Functions v2 avec updateMask explicite. Google a créé de nouveaux builds
  et de nouvelles révisions à partir de la source distante existante ; aucun
  upload du code local et aucun déploiement global Functions.
- **App Hosting n'a pas été modifié** : il reste min 0, avec son code précédent.
  Il n'existe donc pas encore de maintien public partagé actif. Le premier appel
  passkey peut subir un démarrage froid pendant cette transition.
- **Local : les quatre opérations passkey ont un handler Next direct**, sans
  appel réseau aux anciennes Functions. Le transport reste Functions par défaut
  tant que les gates cloud ci-dessous ne sont pas qualifiées.
- OTP, sessions, checkout, newsletter, devis et mutualisation des lecteurs admin
  ne sont pas migrés par ce premier lot. Le plan global n'est pas déclaré terminé.

## Preuve cloud et retour arrière

| Opération | Minimum avant → après | Révision active après |
|---|---|---|
| generatePasskeyAuthenticationOptionsGen2 | 1 → 0 | generatepasskeyauthenticationoptionsgen2-00004-xak |
| verifyPasskeyAuthenticationGen2 | 1 → 0 | verifypasskeyauthenticationgen2-00004-qiw |

Projet `secondevienextjsssr`, région `europe-west1`. Les deux services restent
1 CPU / 256 MiB, concurrence 8, max 2. Les endpoints restent disponibles.
Les comptes techniques et protections Auth/App Check ne sont pas modifiés.
Comparaison des anciennes/nouvelles révisions : mêmes comptes, concurrence,
timeout, ressources, variables d'environnement et références de secrets.
Deux POST sans App Check/Auth sont refusés HTTP 401 `UNAUTHENTICATED` après la
mise à jour, sans entrer dans le métier. Les nouveaux builds sont SUCCESS.
Le code source local ET `scripts/deploy-functions-targeted.mjs` portent min 0
pour empêcher sa réintroduction par la prochaine livraison ciblée.

Opérations de mise à jour :

- `operation-1788977174681-65b10b5021706-771bad51-350abff0`
- `operation-1788977176089-65b10b5179283-cca73cc8-e87f9001`

Rollback de configuration : PATCH du même champ à 1 sur la seule cible concernée,
si une nouvelle décision justifie de réintroduire ce coût. Ne pas supprimer de
fonction ni modifier les données/challenges pour revenir en arrière.
Les anciennes révisions `00003-kos` et `00003-xoq` ne reçoivent plus le trafic.

## Manifeste de transport local

Les handlers partagés sont dans
`functions/src/auth/passkeyHandlers.cjs`. Les anciens wrappers
`functions/src/auth/passkeys.js` et le runtime Next
`src/lib/server/publicPasskeys.js` exécutent exactement ce même module métier.

| Nom logique | Ancien endpoint (europe-west1) | Nouveau chemin POST |
|---|---|---|
| generatePasskeyAuthenticationOptions | generatePasskeyAuthenticationOptionsGen2 | /api/auth/passkeys/generatePasskeyAuthenticationOptions |
| verifyPasskeyAuthentication | verifyPasskeyAuthenticationGen2 | /api/auth/passkeys/verifyPasskeyAuthentication |
| generatePasskeyRegistrationOptions | generatePasskeyRegistrationOptionsGen2 | /api/auth/passkeys/generatePasskeyRegistrationOptions |
| verifyPasskeyRegistration | verifyPasskeyRegistrationGen2 | /api/auth/passkeys/verifyPasskeyRegistration |

Registre fermé : `shared/passkeyTransport.mjs`. Entrée Next :
`app/api/auth/passkeys/[operation]/route.js`. Client : `getCallableFunction`
dans `firebaseLazy.js`, utilisé par les quatre appels de la modale de connexion.
Le SDK Firebase `httpsCallableFromURL` conserve les tokens, erreurs et l'enveloppe
`{data}`. Aucun fallback automatique vers une Function après un échec ambigu.

Contrat : JSON limité à 64 Kio, POST, origine exacte, App Check obligatoire,
ID token fourni vérifié avec révocation ; Auth obligatoire pour l'inscription.
Les admins doivent conserver claim, registre actif et AAL2. Les challenges,
compteurs, TTL et émissions de token restent transactionnels dans les mêmes
collections. Toutes les réponses sont privées/no-store. RP ID inchangé.
SDK Admin partagé ; WebAuthn importé à la demande via une promesse commune.
Le SDK serveur `13.3.1`, déjà utilisé par les Functions, est verrouillé dans
les dépendances Next. Aucun import du fichier d'exports global Functions.

## Activation et gates encore ouvertes

1. Qualifier la chaîne de proxies App Hosting et bloquer/traiter les chemins
   d'ingress alternatifs avant de fixer `PUBLIC_AUTH_PROXY_HOPS` (entier 1–4).
   La valeur désigne la position de l'IP visiteur en partant de la droite dans
   X-Forwarded-For, pas une confiance accordée à sa première valeur. Aucune valeur
   par défaut devinée. IP non établie = refus 503, jamais un limiteur `unknown`.
2. Vérifier IAM minimum et signature `createCustomToken` pour le compte App
   Hosting. Aucun secret de compte de service n'est à fournir au build/client.
3. Déployer le code sandbox sans activer le client ; `PUBLIC_PASSKEY_ENABLED=true`
   est un réglage serveur runtime uniquement, après qualification de l'ingress.
   Sans ce réglage, le nouveau handler répond 503 sans appeler le métier.
4. Qualifier authentification/inscription réelles, refus et reprise, mémoire
   512 MiB, et le maintien public unique sur deux rollouts plus rollback.
5. Basculer `NEXT_PUBLIC_PASSKEY_TRANSPORT=apphosting` au BUILD du client validé.
   Retour `functions` au BUILD pour rollback du transport ; les anciennes pages
   restent compatibles. Un simple changement d'env runtime ne modifie pas le JS
   déjà livré. Ne pas activer `runConfig.minInstances: 1` sans gérer les tags.

Ces réglages ne sont pas ajoutés activés à `apphosting.yaml` par ce lot. Les
correctifs admin préexistants ne sont pas implicitement publiés avec lui.

## Validation locale

- Node 22.23.2, pnpm 11.7.0 ; installation avec scripts désactivés.
- **89 tests ciblés réussis** : passkey/Auth/transport, configuration de
  déploiement et correctifs admin préexistants. Le test
  HTTP utilise une vraie signature ECDSA/WebAuthn avec base et émission de token
  simulées : succès, rejeu concurrent refusé et UV absent refusé. Aucun compte
  réel, email, secret client, paiement ou navigateur connecté n'est utilisé.
- Build de production local avec `CATALOG_BUILD_FIXTURE=true` réussi : galerie
  et pages publiques restent statiques/ISR 300, nouvelle route Auth dynamique.
  Ce build contient le catalogue de test et n'est pas un artefact à déployer.
- ESLint ciblé : zéro erreur ; avertissements UI préexistants et Functions
  exclues du lint principal. Les modules Functions sont testés sous Node 22.
- Aucun benchmark cloud de capacité ni cérémonie WebAuthn réelle ; les tests
  ne prouvent donc pas encore la latence ou l'empreinte mémoire de l'ensemble.
- `git diff --check` réussi ; 141 liens locaux des sept documents concernés
  vérifiés sans cible manquante. Aucun fichier supprimé ou renommé : extraction
  du code métier passkey dans un nouveau module, wrappers conservés.

Commande des 89 tests, sans accès réseau :

```sh
node --require ./tests/commerce/helpers/no-network.cjs --test --test-reporter=dot \
  tests/public-passkey-http.test.mjs tests/passkey-transaction-audit.test.cjs \
  tests/passkey-registration-audit.test.cjs tests/passkey-server-hardening.test.cjs \
  tests/passkey-performance.test.cjs tests/auth-assurance.test.cjs \
  tests/passkey-portability-contract.test.cjs tests/passkey-preparation.test.mjs \
  tests/auth-custom-token-sign-in.test.mjs tests/functions-gen2-g5.test.mjs \
  tests/admin-reader-startup.test.cjs tests/admin-preload-list-cache.test.mjs \
  tests/admin-preload-queue.test.mjs
```

Références : [plan](PLAN_PUBLIC_CHAUD.md),
[contrat Auth](../../security/AUTHENTIFICATION.md),
[configuration Cloud Functions v2](https://docs.cloud.google.com/functions/docs/reference/rest/v2/projects.locations.functions/patch).
