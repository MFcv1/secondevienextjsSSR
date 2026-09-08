# Compatibilité de Firebase CLI

`firebase-tools@15.26.0.patch` adapte les trois consommateurs de `stream-json`
de la CLI à la version 3.6.0 corrigée pour GHSA-528h-pc64-c93x. L'override est
limité à `firebase-tools>stream-json` dans `pnpm-workspace.yaml`. Aucun avis
d'audit n'est ignoré et le seuil de qualité reste inchangé.

Les chemins ESM et les adaptateurs Node `asStream` / `withParserAsStream`
remplacent les anciennes classes CommonJS. Node 22.23.2 permet le chargement
synchrone de ces modules ESM sans top-level await. La limite de profondeur
1024 de la bibliothèque corrigée reste active. Les erreurs des flux sont
propagées à la commande, y compris plusieurs événements d'erreur sur l'import
Auth et le rejet de l'analyse Next.

`tests/firebase-cli-stream-json.test.cjs` exécute les consommateurs installés,
avec les opérations d'envoi remplacées par des collecteurs locaux et le réseau
interdit : lots Auth de 1000 utilisateurs, filtrage des chemins Database,
analyse des dépendances Next, refus des JSON trop profonds et chargement des
commandes de déploiement. Cette suite fait partie de `security:audit:static`.

Installation reproductible : `pnpm install --frozen-lockfile`. Validation :
`pnpm security:audit`, puis les émulateurs et lectures sandbox nécessaires au
déploiement. Ne pas valider uniquement `firebase --version`, car la CLI charge
les commandes à la demande.

Lors d'une mise à jour de Firebase CLI, réévaluer le patch et le retirer avec
l'override seulement si la nouvelle dépendance et les tests le permettent.
Le retour arrière doit restaurer ensemble le patch, la configuration pnpm et
le lockfile ; rétablir l'ancienne dépendance rendrait la gate rouge à nouveau.
