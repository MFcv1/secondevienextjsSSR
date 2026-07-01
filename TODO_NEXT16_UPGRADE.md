# TODO - Migration Next 16 / Turbopack

Objectif demain : evaluer puis planifier la mise a jour Next 15.5.18 -> Next 16, avec un test optionnel de Next 16.3 Preview pour les gains memoire Turbopack.

## Pourquoi

- Reduire la memoire du serveur dev Next pendant les longues sessions.
- Profiter de Turbopack par defaut en dev/build avec Next 16.
- Tester le cache filesystem Turbopack pour accelerer les builds chauds.
- Garder une base compatible avec les futures ameliorations Next/Vercel.

## Sources officielles a relire

- Next 16 upgrade : https://nextjs.org/docs/app/guides/upgrading/version-16
- Turbopack docs : https://nextjs.org/docs/app/api-reference/turbopack
- Next 16.3 Preview Turbopack : https://nextjs.org/blog/next-16-3-turbopack

## Plan prudent

1. Creer une branche dediee `codex/next-16-upgrade`.
2. Relever une baseline courte : version Next, memoire dev, temps de demarrage.
3. Tester d'abord Turbopack sur la version actuelle si pertinent.
4. Migrer vers Next 16 stable avec le codemod officiel ou une mise a jour manuelle.
5. Lancer les gates adaptes : `npm run build`, `npm run next:routes`, puis gates publiques critiques.
6. Tester `next@preview` seulement si les gains memoire Next 16 stable ne suffisent pas ou si on veut valider 16.3 avant sa stable.

## Points d'attention repo

- Verifier les routes publiques App Router et les pages dynamiques `/categorie/[categoryId]`, `/produit/[slugOrId]`.
- Surveiller les differences CSS/HMR dues a Turbopack.
- Ne pas reintroduire de routing SPA/hash ni de grosse ile client publique.
- Garder App Hosting/Firebase sandbox en dernier, apres validation locale.

