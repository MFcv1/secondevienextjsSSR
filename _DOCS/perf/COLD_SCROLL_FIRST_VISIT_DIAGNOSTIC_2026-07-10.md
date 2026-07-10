# Diagnostic fige - freezes du premier scroll a froid

Date : 2026-07-10

Statut : reference situationnelle figee. Ce document conserve le diagnostic, les mesures et les limites connues avant la prochaine passe structurelle. Il ne remplace pas la roadmap d'implementation.

## Conclusion

Le gel du premier passage Instagram ne vient pas principalement du flottement permanent des pastilles. Il apparait quand plusieurs couts froids se superposent sur le thread principal pendant un scroll rapide :

- hydratation et execution React encore en cours ;
- style, layout et premiere rasterisation d'un DOM serveur volumineux ;
- deux arbres responsive Instagram et deux arbres responsive avis presents dans le HTML ;
- chargement et decodage d'images hero, produits, Avant/Apres et Instagram ;
- creation simultanee de calques pour les cartes, pastilles, ombres et etoiles.

Les optimisations deja appliquees sont utiles : le pire gap Instagram mesure sur le sandbox passe de 650 ms a 199,9 ms, soit environ -69 %. Elles ne ferment cependant pas le chantier : le budget strict de 120 ms n'est pas atteint et les metriques de paint/raster restent elevees.

Les animations finales sont conservees : arrivee progressive des pastilles, flottement stabilise, vague des etoiles et transitions des carrousels.

## Protocole de reference

- cible deployee : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/` ;
- viewport desktop : 1440 x 950 ;
- CPU : ralentissement x4 ;
- scenario : navigation froide puis scroll rapide vers Instagram et avis ;
- instrumentation : requetes, frame gaps, long tasks et trace Chrome ;
- scenario de reference : `cold-sections` lance sans attendre un ancien marqueur d'hydratation SPA.

La mesure la plus severe, dite `true cold fling`, remplace comme reference les premiers essais cibles a 50 ms. Ces premiers essais etaient utiles pour valider le declenchement des animations, mais ne reproduisaient pas assez fidelement la concurrence complete du tout premier chargement.

## Resultats mesures

| Palier | Requetes avant scroll | Octets avant scroll | Gap Instagram max | Gap avis max | Long tasks Instagram | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sandbox true cold initial | 46 | 1 429 411 | 650 ms | 33,4 ms | 6 / 1 323 ms / max 591 ms | baseline |
| Sandbox P0 | 42 | 1 020 504 | 233,4 ms | 33,4 ms | 2 / 244 ms / max 194 ms | intermediaire utile |
| Sandbox P1 | 35 | 778 708 | 199,9 ms | 50 ms | 8 / 693 ms / max 127 ms | palier deploye stable |
| Local P6 | 25 | 629 757 | 183,4 ms | 50 ms | 7 / 706 ms / max 146 ms | meilleure variante locale |
| Local P7 | 25 | 630 977 | 249,9 ms | 50 ms | 8 / 804 ms / max 150 ms | rejete |
| Local P8 | 25 | 629 946 | 199,9 ms | 66,7 ms | 8 / 694 ms / max 132 ms | rejete |
| Local final menu hybride | 25 | ~631 000 | 200,1 a 250 ms | 33,4 ms | max long task Instagram 135 a 159 ms | candidat sandbox ; seuil strict encore rouge |

Gains du palier deploye P1 par rapport a la baseline :

- gap Instagram : 650 ms -> 199,9 ms, environ -69,2 % ;
- poids avant scroll : 1,43 Mo -> 779 Ko, environ -45,5 % ;
- requetes avant scroll : 46 -> 35, environ -23,9 %.

Gains de la meilleure variante locale P6 par rapport a la baseline :

- gap Instagram : 650 ms -> 183,4 ms, environ -71,8 % ;
- poids avant scroll : 1,43 Mo -> 630 Ko, environ -55,9 % ;
- requetes avant scroll : 46 -> 25, environ -45,7 %.

La variante finale conserve le faible bundle initial et corrige le verrou/saut du mega menu. Sur deux passages froids CPU x4, le gap Instagram varie de 200,1 a 250 ms ; les avis restent a 33,4 ms. Cette variance confirme que le seuil de 120 ms n'est pas ferme et que le test sandbox reel reste necessaire avant toute promotion en production.

## Ce que montre la trace

| Cout agrege | Baseline true cold | Local P6 | Evolution |
| --- | ---: | ---: | ---: |
| Scripting | 4 756,1 ms | 1 968,1 ms | -58,6 % |
| Style et layout | 2 544,9 ms | 1 911,5 ms | -24,9 % |
| Image decode | 563,9 ms | 269,8 ms | -52,1 % |
| Paint, raster et composite | 4 003,7 ms | 4 336 ms | +8,3 % |

La baisse du gap visible ne signifie donc pas que tous les couts ont baisse. Le scripting et le decodage progressent fortement, mais paint/raster/composite reste la dette dominante. Les totaux agreges couvrent toute la trace et ne doivent pas etre confondus avec le seul blocage Instagram.

Le chemin image initial confirme le deplacement de charge :

| Palier | Images initiales | Images hero | Images produit | Images Avant/Apres |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 26 | 4 | 15 | 2 |
| Sandbox P1 | 16 | 1 | 10 | 0 |
| Local P6 | 6 | 1 | 0 | 0 |

## Changements utiles deja prouves

- une seule image hero est chargee initialement au lieu des quatre ;
- les images secondaires sont reparties hors de la fenetre critique ;
- les pastilles apparaissent par rang au fur et a mesure de l'entree dans la section ;
- chaque pastille passe individuellement a son mouvement flottant stabilise ;
- `will-change` est reserve aux elements prepares ou en transition ;
- les cartes avis visibles sont preparees par petits lots ;
- le JSON duplique des donnees Instagram/avis a ete remplace par un compteur DOM ;
- le gate cold-scroll vise maintenant le vrai premier passage.

## Dette dominante restante

La source structurelle la plus probable est maintenant le volume a rendre et a peindre :

- 5 cartes Instagram mobile et 5 cartes desktop sont rendues simultanement ;
- 5 cartes avis mobile et 5 cartes desktop sont rendues simultanement ;
- headers, controles, etoiles, ombres et textes sont egalement dupliques par breakpoint ;
- les cartes produit conservent un DOM interne important ;
- `content-visibility: auto` peut aider, mais peut aussi reporter le cout exactement sur le premier scroll si sa distance intrinseque ou son seuil est mal calibre.

Le prochain chantier structurel doit donc comparer un DOM responsive unifie et une reduction du DOM interne des cartes, sans transformer les sections SSR en sections client-only et sans retirer les animations.

## Premiere connexion apres plusieurs minutes

Ce phenomene est distinct du freeze navigateur. `apphosting.yaml` contient depuis avant `v2.3.2` :

```yaml
runConfig:
  minInstances: 0
  maxInstances: 10
  concurrency: 80
  cpu: 1
  memoryMiB: 512
```

Avec `minInstances: 0`, aucune instance n'est garantie active en permanence. Passer a `minInstances: 1` est un levier pour reduire le reveil du serveur et le TTFB, avec un cout recurrent. Cela n'elimine pas directement les blocages de scroll lies a React, au DOM, au decode et au raster.

Reference officielle : https://firebase.google.com/docs/app-hosting/configure

## Decisions figees

1. Ne pas revenir globalement a `v2.3.1` : les gains reseau et frame gap sont reels.
2. Ne pas attribuer le probleme au flottement permanent sans nouvelle preuve.
3. Ne pas declarer le seuil 120 ms atteint.
4. Conserver le sandbox P1 comme palier deploye stable tant que P6 n'a pas passe une validation visuelle et navigateur.
5. Conserver P6 comme meilleure piste locale, mais pas comme closeout.
6. Ne pas retenir P7/P8, qui degradent le gap Instagram ou avis.
7. Traiter le cold start App Hosting et le cold scroll navigateur comme deux budgets separes.

## Limites de la preuve

- chaque palier principal repose sur une trace de reference, pas sur une distribution de dizaines de runs ;
- les mesures sandbox et locales ne sont pas directement interchangeables ;
- le ralentissement CPU x4 est un profil de stress, pas une prediction exacte pour chaque appareil ;
- la variante locale P6 n'a pas encore de preuve visuelle multi-navigateur archivee ;
- le ressenti reel utilisateur reste prioritaire quand il contredit un gate trop chaud ou trop cible.

## Fichiers de preuve

- baseline : `logs/scroll-audit/apphosting-true-cold-fling-2026-07-10/2026-07-10T00-28-41-740Z-summary.json` ;
- sandbox P0 : `logs/scroll-audit/apphosting-cold-scroll-p0-2026-07-10/2026-07-10T00-46-55-975Z-summary.json` ;
- sandbox P1 : `logs/scroll-audit/apphosting-cold-scroll-p1-2026-07-10/2026-07-10T01-04-04-438Z-summary.json` ;
- local P6 : `logs/scroll-audit/local-cold-scroll-p6-card-containment-2026-07-10/2026-07-10T01-23-18-646Z-summary.json` ;
- local P7 : `logs/scroll-audit/local-cold-scroll-p7-fast-guard-2026-07-10/2026-07-10T01-27-22-205Z-summary.json` ;
- local P8 : `logs/scroll-audit/local-cold-scroll-p8-scroll-first-cards-2026-07-10/2026-07-10T01-30-26-070Z-summary.json`.

Le dossier `logs/` est ignore par Git. Ces chemins sont des preuves locales de travail ; le present document en conserve les chiffres essentiels.
