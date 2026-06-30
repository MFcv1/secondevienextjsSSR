# Roadmap home SEO / entree galerie - 2026-05-17

## Objectif

Etudier puis, si valide, transformer l'accueil `/` en page d'entree plus lisible pour le referencement, sans perdre l'experience premium actuelle de la galerie.

Le principe n'est pas de supprimer la galerie. Le principe est de donner a Google et aux visiteurs froids une vraie porte d'entree: contenu clair, liens internes, categories, selection de pieces et promesse de marque. L'experience immersive actuelle resterait accessible via un CTA principal type "Entrer dans la galerie", avec le preloader et l'animation existants.

## Pourquoi ce serait utile pour le SEO

Aujourd'hui, l'accueil ouvre directement sur le shell galerie avec preloader. C'est fort visuellement, mais le contenu le plus important depend vite de l'application client: animations, header, recherche, filtres, panier, wishlist, etc.

Une landing SSR/ISR visible apporterait:

- Un H1 visible immediatement dans le HTML et a l'ecran.
- Un texte editorial plus riche autour des requetes cibles: mobilier ancien restaure, meuble vintage, buffet restaure, armoire ancienne, restauration de meuble autour de Marseille.
- Des liens internes propres vers les pages categorie et produit, ce qui aide Google a comprendre la structure du catalogue.
- Une meilleure surface pour les extraits de recherche: titre, description, sections, categories, contenus locaux.
- Un premier affichage plus simple a analyser pour les crawlers et les outils type Lighthouse/PageSpeed.
- Un contexte de marque avant la galerie: atelier, selection, livraison, pieces uniques, restauration.

Ce que ca apporte de plus que l'arrivee directe sur la galerie:

- La galerie est excellente pour convertir et immerger un visiteur deja interesse.
- La landing est meilleure pour expliquer, positionner et mailler le site.
- Les deux peuvent coexister: la landing attire et clarifie, la galerie fait vivre l'experience.

## Ce qu'il ne faut pas casser

- L'entree galerie actuelle doit rester disponible, avec preloader "Entree dans la Galerie".
- Le style premium du site doit rester coherent; pas de page marketing generique.
- Ne pas ajouter de gros bloc explicatif lourd ou banal.
- Ne pas cacher les produits derriere trop de discours.
- Ne pas toucher aux invariants mobile marketplace sans relire `alertemobile.md`.

## Decision a prendre avant implementation

Choisir le comportement de `/`:

1. Option A - Home landing SEO visible par defaut
   - `/` affiche la landing SSR/ISR.
   - CTA principal: "Entrer dans la galerie".
   - La galerie immersive se lance apres clic.
   - Meilleur SEO home, changement UX le plus visible.

2. Option B - Home actuelle conservee, landing sur une route dediee
   - `/` garde preloader + galerie.
   - Nouvelle route possible: `/mobilier-ancien-restaure` ou `/galerie`.
   - Moins risqué UX, mais moins fort pour le SEO de la racine.

3. Option C - Home hybride progressive
   - `/` affiche d'abord une hero SSR tres proche du design actuel.
   - Le preloader/galerie reste accessible immediatement via CTA ou apres intention.
   - Compromis, mais demande plus de design/test pour ne pas sembler indecis.

## Roadmap de demain

### H0 - Audit rapide de l'existant

- Relire `NEXTJS_OPTIMIZATION_ROADMAP.md`, `NEXTJS_SEO_ROADMAP.md` et cette roadmap.
- Capturer l'etat actuel de `/`: HTML, H1, title, description, liens internes, JS charge, LCP.
- Verifier les mots cles et intentions deja couverts par produits/categories.

Validation:

```powershell
npm run lint
npm run build
npm run seo:check
npm run perf:budget
```

### H1 - Architecture de contenu

- Definir la structure de la landing:
  - hero claire;
  - CTA "Entrer dans la galerie";
  - categories principales;
  - selection de pieces publiees;
  - bloc atelier/restauration;
  - zone locale Marseille / livraison;
  - liens vers `/devis`, `/a-propos`, categories et produits.
- Garder les contenus courts, utiles et non generiques.
- Prevoir un maillage interne naturel vers les pages qui rankent vraiment.

### H2 - Prototype SSR/ISR sans changer la galerie

- Construire la page avec des Server Components Next.
- Reutiliser `getPublicCatalog`, les helpers categories et les images Firebase variants.
- Ne monter le shell galerie que selon l'option choisie.
- Si option A/C: garder un CTA qui lance l'experience galerie actuelle.
- Si option B: creer une route landing dediee et laisser `/` intact.

### H3 - Donnees structurees

- Ajouter ou ajuster:
  - `WebSite`;
  - `CollectionPage`;
  - `ItemList`;
  - `LocalBusiness` si pertinent;
  - breadcrumbs si route dediee.
- Verifier que les donnees structurees ne dupliquent pas ou ne contredisent pas les pages produit/categorie.

### H4 - UX et mobile

- Tester desktop et mobile.
- S'assurer que le CTA galerie est clair et rapide.
- Verifier que l'utilisateur qui veut "voir les meubles" n'est pas ralenti par trop de contenu.
- Ne pas transformer la page en landing marketing froide.

### H5 - Mesure

- Comparer avant/apres:
  - HTML initial;
  - nombre de liens internes indexables;
  - JS initial et differe;
  - LCP/CLS;
  - score PageSpeed;
  - `npm run perf:architecture`.

Validation finale:

```powershell
npm run lint
npm run build
npm run seo:check
npm run perf:budget
npm run perf:architecture
```

## Recommandation initiale

Commencer par l'option B ou C, pas l'option A directement.

La raison: l'identite actuelle du site tient beaucoup a l'entree immersive galerie. Avant de remplacer le comportement de `/`, il vaut mieux prototyper une landing SSR visible et mesurer sa valeur. Si le prototype est fort visuellement et utile SEO, on pourra ensuite decider si elle devient la home.

## Critere de succes

La page est reussie si:

- elle explique mieux le site a Google et a un nouveau visiteur;
- elle cree plus de liens internes utiles vers categories/produits;
- elle conserve une entree galerie premium;
- elle ne donne pas l'impression d'un site marketing standard;
- elle n'alourdit pas le parcours d'achat.
