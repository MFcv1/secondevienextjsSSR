# Avant / après — trois propositions de fond

Ouvrir [index.html](index.html) dans un navigateur. Le dossier fonctionne en
local, sans installation, connexion ni serveur. Conserver les fichiers et le
dossier `assets` ensemble.

- **Lumière d’atelier** : ivoire et champagne, avec les mêmes volumes mats que
  Relief sauge (disque en haut à gauche et forme arrondie à droite). Cette
  version affinée remplace la feuille de verre initiale à la demande du client.
- **Relief sauge** : volumes mats et lumière rasante sur fond minéral.
- **Galerie nocturne** : charbon, lentille fumée et halo bronze.

Les onglets permettent de comparer au même emplacement. « Voir les trois » les
affiche à la suite. Le réglage du décor et le retour aux couleurs actuelles du
module permettent de distinguer le choix du fond de celui de la palette.
Les comparateurs fonctionnent au pointeur et au clavier. Le meuble sélectionné
et la séparation sont synchronisés entre les trois propositions.

## Origine et périmètre

Prototype HTML/CSS/JavaScript, adapté de la composition de
[`ProductSectionsServer.jsx`](../../src/kit/marketplace/ProductSectionsServer.jsx)
(`BeforeAfterSectionServer`, `BeforeAfterSliderPlaceholder`) et des styles de
[`src/index.css`](../../src/index.css). Il conserve les textes, le monogramme,
les trois couples d’images et les deux panneaux du module. Ce n’est pas le
composant React exécuté dans Next : le slider et la navigation sont simplifiés
pour cette page de choix visuel.

Les images sont des copies des variantes galerie du projet, le logo provient
de `public/images/logoanais-320.webp`. Les polices Cormorant Garamond et Plus
Jakarta Sans sont copiées des ressources latines du build local existant.
Aucun build n’est nécessaire pour consulter le prototype.

Les trois fonds et leurs formes sont en CSS, sans image générée. Les petites
phrases en bordure sont des propositions éditoriales. Le CTA ouvre la page
À propos du sandbox dans un autre onglet. Aucun autre accès réseau n’est requis.

Le dossier de comparaison reste hors de `public` et `app`. Le design ivoire
en relief retenu est intégré localement à `BeforeAfterSectionServer` et
`src/index.css`. Les chevrons de cette maquette sont désormais en SVG ; son
repère de focus clavier est limité à la poignée, sans liseré autour de la photo.
Les images décoratives d’origine restent conservées. Livraison des deux
sections : [état du projet](../../_DOCS/ETAT_PROJET.md).
