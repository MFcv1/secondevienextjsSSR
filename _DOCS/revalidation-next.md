# Revalidation catalogue Next.js

Le clone Next.js SSR utilise ISR 5 minutes sur les pages publiques principales et une invalidation admin ciblee.

## Routes concernees

- `/`
- `/sitemap.xml`
- `/produit/[slugOrId]`
- `/categorie/[categoryId]`

Les pages produit et categorie declarent `revalidate = 300` et utilisent `generateStaticParams` pour pre-rendre les entrees publiees connues.

## Declenchement admin

Les actions admin passent par `src/kit/admin/publicCatalogInvalidation.js`:

1. purge du cache `sessionStorage` public cote navigateur;
2. bump du document Firestore `artifacts/{appId}/public/meta`;
3. appel POST `/api/revalidate-catalog` avec le token Firebase de l admin connecte.

Les appels existants couvrent:

- creation/modification produit via `AdminForm`;
- changement de statut publie/brouillon;
- suppression;
- vendu/disponible.

## Securite

`app/api/revalidate-catalog/route.js` refuse les appels sans Bearer token Firebase.

Le token est verifie avec Firebase Admin (`verifyIdToken(token, true)`). L appel est autorise seulement si:

- le claim custom `admin === true` est present;
- ou l email correspond a la variable serveur `SUPER_ADMIN_EMAIL`.

La route refuse aussi les chemins sans `/` et les chemins `/api/*`.

## Invalidation effectuee

La route invalide les tags:

- `catalog`
- `products`
- `categories`
- `product:{productId}` si fourni
- `category:{categoryId}` pour chaque categorie fournie

Elle revalide les chemins:

- `/`
- `/sitemap.xml`
- `/categorie/{categoryId}`
- `/produit/{productId}`
- chemins additionnels transmis par l admin, par exemple le slug canonique produit.

## Regles d exploitation

- Ne pas appeler cette route depuis un navigateur public.
- Garder `revalidate = 300` comme filet de securite meme si l invalidation admin echoue.
- Apres un changement de modele de slug, transmettre explicitement l ancien et le nouveau chemin dans `paths`.
- Si le catalogue devient volumineux, ajouter `generateSitemaps` et segmenter les invalidations sitemap.
