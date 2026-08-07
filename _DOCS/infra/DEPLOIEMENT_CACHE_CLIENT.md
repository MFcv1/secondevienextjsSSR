# Deploiement atomique et coherence du cache client

Derniere mise a jour: 2026-08-07
Statut: `REFERENCE_ACTIVE`
Proprietaire: infrastructure Next.js et Firebase App Hosting

## 1. Objet et perimetre

Ce document fixe le contrat qui empeche un navigateur de melanger une ancienne
version de l'application avec un nouveau rollout App Hosting. Il complete
[INFRASTRUCTURE.md](INFRASTRUCTURE.md) sans modifier le contrat ISR catalogue.

Il couvre:

- l'identite unique de chaque build Next.js;
- la protection native contre le version skew;
- la duree maximale des reponses ISR stale dans Cloud CDN;
- le comportement attendu des onglets deja ouverts;
- la validation et le rollback.

Il ne met en place ni service worker, ni purge du stockage utilisateur, ni
suppression de cookies.

## 2. Cause du comportement historique

Les routes publiques utilisent ISR avec `revalidate = 300`. Sans configuration
explicite de `expireTime`, Next.js genere par defaut une tres longue directive
`stale-while-revalidate`. App Hosting place Cloud CDN devant le serveur et
respecte cette directive.

Le site pouvait donc temporairement combiner:

1. un onglet avec l'ancien runtime JavaScript et son Router Cache;
2. une reponse HTML ou RSC encore stale dans Cloud CDN;
3. la nouvelle revision Cloud Run deja active.

Vider le cache du navigateur supprimait cet etat, mais ce n'est pas une
procedure de deploiement acceptable.

References officielles:

- [Next.js `deploymentId`](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId);
- [Next.js CDN caching](https://nextjs.org/docs/app/guides/cdn-caching);
- [Firebase App Hosting cache](https://firebase.google.com/docs/app-hosting/optimize-cache);
- [Firebase App Hosting rollouts](https://firebase.google.com/docs/app-hosting/rollouts).

## 3. Contrat executable

### 3.1 Identifiant unique par build

`scripts/with-env.mjs` appelle `ensureDeploymentId` uniquement pour
`next build`.

- si le pipeline fournit `NEXT_DEPLOYMENT_ID`, cette valeur est conservee;
- sinon `scripts/deployment-id.mjs` genere un identifiant URL-safe compose d'un
  timestamp et d'une entropie aleatoire;
- l'identifiant est cree une seule fois avant le processus `next build`;
- toutes les instances issues du meme build partagent donc le meme identifiant;
- `NEXT_DEPLOYMENT_ID` ne doit jamais etre fixe a une valeur statique dans
  `apphosting.yaml` ou dans un fichier `.env`.

`next.config.mjs` transmet cet identifiant a l'option native `deploymentId`.
Avec la version Next.js 16.3.0 actuellement verrouillee, Next.js:

- ajoute `?dpl=<deploymentId>` aux assets;
- ajoute `x-deployment-id` aux requetes de navigation client;
- ajoute `x-nextjs-deployment-id` aux reponses de navigation;
- injecte `data-dpl-id` sur l'element `<html>`.

L'App Router compare ainsi l'identifiant du build client avec celui de la
reponse RSC et remplace une navigation incompatible par une navigation
document complete. Le build doit prouver les marqueurs applicables aux
artefacts statiques et au manifeste; le smoke sandbox doit ensuite prouver les
en-tetes de navigation reels.

### 3.2 Cache ISR borne

`next.config.mjs` fixe `expireTime: 300`, aligne sur le `revalidate = 300` des
routes publiques.

Le resultat attendu est:

- une reponse ISR fraiche peut etre servie par Cloud CDN pendant 300 secondes;
- apres expiration, aucune fenetre stale annuelle ne doit subsister;
- les assets immuables et hashes restent caches longtemps sans risque, car
  `deploymentId` ajoute aussi un cache busting propre au rollout.

Cette configuration ne remplace pas la revalidation evenementielle du
catalogue. Elle borne seulement la copie CDN lorsqu'une page expire.

### 3.3 Onglets deja ouverts

Un deploiement ne peut pas executer du code dans un onglet totalement inactif.
Le contrat est donc:

- nouvel acces non cache: nouvelle revision;
- onglet ancien qui effectue une navigation serveur: detection du mismatch puis
  rechargement automatique;
- onglet admin ancien qui reprend le focus: lecture non cachee du document
  `/admin`, comparaison de son `data-dpl-id` avec celui du document courant,
  blocage des mutations et demande d'actualisation en cas d'ecart;
- retour purement local dans l'historique: l'etat peut rester affiche jusqu'a
  la prochaine requete, afin de conserver la restauration fluide du scroll;
- aucun utilisateur ne doit avoir a vider manuellement le cache applicatif.

Le controle admin attend sa premiere verification avant de reprendre une
publication conservee dans IndexedDB. Une actualisation ne perd donc pas les
photos deja preparees.

## 4. Procedure de build et de deploiement

Les commandes canoniques restent:

```bash
pnpm run build
pnpm run build:prod
```

Le wrapper affiche l'identifiant public du build:

```text
[build] NEXT_DEPLOYMENT_ID genere: sv-...
```

App Hosting doit construire la source avec la commande `build` du
`package.json`. Ne pas ajouter une valeur constante `NEXT_DEPLOYMENT_ID` dans
la configuration du backend.

Avant rollout:

```bash
pnpm run test:deployment-cache
pnpm run build
```

Apres rollout, verifier:

1. le rollout courant et son build dans Firebase Console;
2. une ouverture directe de `/`;
3. une navigation galerie -> produit -> retour;
4. la valeur `config.deploymentId` dans
   `.next/required-server-files.json`;
5. la presence de `?dpl=` sur les assets Next et de `x-deployment-id` dans le
   runtime client compile;
6. l'absence de la fenetre
   `stale-while-revalidate=31535700` sur une route ISR.

## 5. Rollback

Un rollback App Hosting restaure l'ancien conteneur avec son identifiant
embarque. Un client du build annule qui rencontre ce rollout detecte a son tour
le mismatch et recharge les assets correspondants.

Ne jamais rollbacker ce mecanisme en:

- effacant cookies ou stockage local;
- ajoutant `Clear-Site-Data`;
- desactivant tout cache public;
- reutilisant volontairement le meme identifiant pour deux builds differents.

## 6. Gate de non-regression

`pnpm run test:deployment-cache` verifie:

- le format et l'unicite des identifiants generes;
- la conservation d'un identifiant fourni par un pipeline;
- le refus des caracteres interdits;
- l'activation de `deploymentId`;
- l'alignement de `expireTime` sur 300 secondes.

Toute modification de `next.config.mjs`, `scripts/with-env.mjs`,
`scripts/deployment-id.mjs`, de la commande `build` ou du cache des routes
publiques doit relancer cette gate et le build.
