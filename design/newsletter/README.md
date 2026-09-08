# Newsletter — trois finitions d’ovales asymétriques

Ouvrir [index.html](index.html) dans un navigateur. Garder le dossier `assets`
et les deux fichiers CSS/JavaScript à côté du HTML. Aucun serveur ni accès
réseau nécessaire pour cette maquette.

1. **Champagne équilibré**, choisi par le client et affiché par défaut : les proportions du croquis
   choisi, un ovale large en haut à gauche et un galet dressé en bas à droite.
2. **Ivoire aérien** : ovale supérieur plus aplati, galet inférieur élancé,
   matière plus claire et ombres légères.
3. **Relief enveloppant** : galet supérieur plus rond, ovale inférieur couché,
   champagne plus soutenu et relief plus présent autour des coins.

Le client a choisi « Ovales asymétriques » dans les
[croquis de composition](compositions.html), conservés comme référence de
la sélection. Les deux autres croquis sont rejetés, comme le précédent
essai « Découpe minérale ». La finition retenue est « Champagne équilibré » ;
les deux autres restent disponibles pour comparaison. L’en-tête « Offre
exclusive » associe un cartouche légèrement arrondi, une étiquette euro
dessinée en SVG, un long filet et le monogramme de la marque, sans étoiles.
Le module newsletter complet est identique dans les trois.
Les ovales sont réalisés en CSS : bord supérieur mat, reflet partiel sur le
volume inférieur et ombres localisées, sans liseré blanc extérieur. Les
nuances sont rapprochées pour un contraste doux, sans image distante.
Leur taille et position sont adaptées au mobile.

Les onglets permettent de comparer au même emplacement, « Voir les trois »
les affiche à la suite. La présence du décor est réglable.

## Module et démonstration

La composition est adaptée de `NewsletterSectionServer` dans
[`ProductSectionsServer.jsx`](../../src/kit/marketplace/ProductSectionsServer.jsx)
et de la famille de styles `.discount-*` dans
[`src/index.css`](../../src/index.css). Les panneaux éditorial/jeu, textes,
formulaire, consentement, trois cartes et monogramme reprennent le projet.
Les fontes et le logo sont des copies des mêmes ressources que la maquette
avant/après. Aucune nouvelle image générée ni dépendance distante.

Le retournement est une simulation locale simplifiée, distincte du jeu réel.
Chaque carte révèle la même réduction fictive de 10 % pour comparer le même
état entre les variantes. Les gains réels de 5/10/15 %, les probabilités,
App Check, la création de code et l’inscription serveur ne sont pas exécutés.
Le formulaire valide localement l’adresse et le consentement, puis affiche
une confirmation explicitement fictive. Aucun e-mail n’est envoyé, aucun code
valide n’est créé et aucune donnée saisie n’est stockée ou transmise.

Le bouton « Revoir les cartes » remet le jeu et les formulaires à zéro. Le
choix de carte est partagé entre les trois compositions pour la comparaison.
Le mouvement respecte `prefers-reduced-motion` et les contrôles sont natifs.

Les [préférences validées](../PREFERENCES.md) servent de référence. Le fond
« Champagne équilibré » et l’en-tête euro sont reportés dans
`NewsletterSectionServer` et `src/index.css`, avec le vrai jeu et formulaire.
Ce prototype reste une démonstration autonome. Livraison des deux sections :
[état du projet](../../_DOCS/ETAT_PROJET.md).
