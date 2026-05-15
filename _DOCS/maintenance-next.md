# Maintenance Next.js, React et Firebase

Cette procedure garde le clone Next.js SSR maintenable en solo dev sans executer de commande systeme depuis l admin navigateur.

## Audit local

1. Lancer l audit depuis le poste de dev:

```bash
npm run maintenance:audit
```

2. Le script execute `npm audit --omit=dev`, lit les versions installees depuis les lockfiles et genere:

```text
public/maintenance/audit.json
```

3. L onglet admin Maintenance lit ce JSON en lecture seule. Il ne lance jamais `npm audit`.

## Mise a jour Next / React

1. Lire les release notes Next.js et React si une version majeure est visee.
2. Mettre a jour de facon ciblee:

```bash
npm update next react react-dom
```

3. Verifier:

```bash
npm run lint
npm run build
npm run seo:check
npm run mobile:contract
```

4. Si une route publique change, verifier le HTML serveur de `/`, `/a-propos`, `/produit/[slugOrId]` et `/categorie/[categoryId]`.

## Mise a jour Firebase

1. Mettre a jour le client et l admin SDK:

```bash
npm update firebase firebase-admin
```

2. Si `functions/` ou `functions-public/` ont leurs propres lockfiles, mettre aussi a jour dans ces dossiers.
3. Verifier les rules, claims admin et endpoints publics cacheables avant deploy.

## Vulnerabilites

- En cas d advisory securite Next.js, patcher rapidement, meme hors cycle fonctionnel.
- Si `npm audit --omit=dev` signale une vulnerabilite exploitable en production, traiter avant deploy App Hosting.
- Si une vulnerabilite est uniquement transitive et sans fix disponible, documenter la chaine et surveiller la dependency amont.

## Rollback

1. Revenir au dernier commit stable.
2. Relancer `npm ci` si les lockfiles ont change.
3. Rebuilder:

```bash
npm run build
```

4. Redeployer via le dashboard sandbox:

```bash
npm run dashboard
```

Le dashboard doit rester sandbox-only pour ce clone.
