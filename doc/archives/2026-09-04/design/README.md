# Design des cartes produit — galerie

Maquette de choix produite le 2026-09-04. Propriétaire : équipe Seconde Vie.
Photographie historique : elle fige les options telles qu'elles ont été
présentées, **pas l'état actuel du site**.

Fichier : [design-cartes-galerie-2026-09.html](design-cartes-galerie-2026-09.html)
Page autonome, à ouvrir directement dans un navigateur. Toutes les photos sont
intégrées en base64, aucune dépendance réseau. Elle reprend le fond `#FAFAF9`,
la grille et les polices Cormorant / Plus Jakarta du site, et permet de basculer
thème clair/sombre, fond neutre/teinté et 4 ou 5 colonnes.

## Les options présentées

| | Option | Principe |
| --- | --- | --- |
| — | L'existant | Photo à bord perdu, survol à voile noir plat et équerres. |
| A | **Passe-partout blanc** | Contenant blanc, marge de 6 px autour de la photo, méta rentrée dans la carte. |
| B | Bord perdu, survol verre | Silhouette conservée, seul le survol est repris. |
| C | Bandeau verre | Nom et prix posés sur la photo dans un bandeau flouté. |
| D | Marie-Louise ivoire | Passe-partout ivoire `#F3EDE4`, la marge existe par la couleur. |

Un bloc de fin compare quatre traitements du badge « Vendu », absent de la
galerie jusque-là.

## Décision

**Option A retenue**, implémentée dans `src/index.css` (`.product-card-shell` et
les règles `.product-card-hover-*`) et appliquée aux deux cartes du site :
`GalleryProductCardServer` et `CategoryProductCard`.

## Écarts assumés entre la maquette et l'implémentation

La maquette n'avait pas les contraintes du vrai site ; trois points ont dû
diverger, chacun pour une raison mesurée :

- **Désaturation des pièces vendues abandonnée.** Élégante avec une carte vendue
  sur cinq ; sur le catalogue réel 43 cartes sur 46 sont vendues, elle vidait de
  sa couleur la galerie entière. Le badge et le prix en brun suffisent.
- **`content-visibility` retiré de `.product-card-wrap`.** Il implique le
  confinement de peinture, qui découpait l'ombre de la carte en rectangle gris à
  bords francs. Le différé par section (`.gallery-deferred-render`) est conservé
  et porte l'essentiel du gain au défilement.
- **Transitions rendues asymétriques.** Durées d'entrée identiques à la maquette,
  sortie unifiée à 200 ms pour les six propriétés : avec six durées différentes,
  un survol repris en vol les désynchronisait et se lisait comme un tremblement.

## Constat annexe sur les images

Relevé le même jour sur la galerie : **32 pièces sur 33 ont une image maître
comprise entre 490 et 630 px de large**, une seule atteint 1024 px. Le pipeline
n'agrandit jamais (`Math.min(sourceWidth, spec.width)`) et ne réduit rien avant
de générer les variantes — les photos envoyées à l'admin étaient déjà petites.
Le `srcSet` des cartes monte désormais jusqu'à 1024/1440 px, mais le gain
n'apparaîtra qu'après un renvoi des originaux depuis l'appareil photo.
