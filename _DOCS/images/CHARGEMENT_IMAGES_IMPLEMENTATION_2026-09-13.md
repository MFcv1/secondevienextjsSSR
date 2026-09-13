# Chargement des fiches — implementation du 13 septembre 2026

Suite autorisee a l'[audit du prechargement](PRECHARGEMENT_GALERIE_2026-09-13.md).
Demande: implementation complete, commit et Hosting sandbox, puis recette par
l'utilisateur sur Android, Mac et Windows. Aucun test automatise ou navigateur
de l'agent sur ce lot. La recette n'est pas declaree reussie par le code.

## Changements

- File commune galerie/fiche/zoom: deux transferts speculatifs mobile, trois
  ordinateur, une place reservee a une action explicite. Promotion d'une image
  deja en cours, delai de chargement 20 s et decodage 5 s; erreurs recuperables.
- Cache borne 32/64 images chargees, files bornees 48 transferts/16 decodages,
  un decodage a la fois. Un cache HTTP chaud ne garantit pas une image decodee.
- Galerie/categories: cartes proches reordonnees toutes les 120 ms au scroll,
  jusqu'a huit candidates dans une marge de 250 px. La preparation des grandes
  images visibles ne force pas leur decodage. Les deux cartes centrales a 60 %
  de visibilite preparent leur route et leurs miniatures apres une pause de
  450 ms. Un mouvement tactile de plus de 10 px annule l'intention d'appui.
- Observation conservee apres entree dans l'ecran, resynchronisation des cartes
  et des URLs apres modification du catalogue; pas de scan reseau periodique.
- Miniatures/fond flou: variante existante thumb320, puis replis; meme selection
  dans les cartes, la fiche et le preload serveur. Prefixe d'URL partage une fois
  par attribut DOM, lecteur compatible avec l'ancien format.
- Fiche: suppression de la bascule forcee apres 500 ms. L'ancienne photo reste
  visible pendant l'attente; animation de sortie seulement apres affichage de
  la nouvelle. Erreur et bouton Reessayer. Voisines circulaires preparees en
  premier; les suivantes se chargent sequentiellement sans decodage anticipe.
- Upload et recadrage: type reel verifie, JPEG de repli si l'encodage WebP
  n'existe pas, aucune extension WebP ajoutee a un PNG de repli.

## Reparation des fichiers

### Ajustement apres recette utilisateur (meme jour)

L'utilisateur constate une ouverture nettement meilleure mais un swipe avec
retour arriere et une molette qui attend au debut. Correction suivante:

- Selection de photo immediate, miniature provisoire si necessaire, puis photo
  de detail decodee. Une reponse ancienne ne peut plus remplacer la selection.
  La derniere photo effectivement peinte reste dessous pendant l'attente.
- Mobile: fondu entrant de 160 ms, sans deplacement/retour a l'origine ni sortie
  transparente de l'ancienne photo. Le geste choisit la photo au relachement;
  la photo ne suit plus le doigt. Mouvement reduit respecte.
- Galerie/categories: apres 240 ms de pause, toutes les miniatures et les
  photos de detail des cartes visibles (jusqu'a 5 ordinateur/2 mobile, 16 photos
  par produit). Tours equitables, une photo par meuble, dans la file commune
  2/3 transferts; aucun decodage explicite de tout l'album pendant la galerie.
  Un nouveau scroll annule les tours suivants. Save-Data/2G restent respectes.
- URLs de detail derivees du snapshot complet, compactees par prefixe dans le
  DOM. Ce supplement augmente le HTML; le cout reseau depend des meubles vus.
  Ni nouvelle lecture Firestore ni changement de serveur/CDN.

Lint cible sans erreur (9 avertissements), contrat statique adapte sans
execution. Aucune recette navigateur ni mesure FPS par l'agent.
Commit `885fd47`, livre depuis une worktree propre sur
`build-2026-09-13-005`; Cloud Build SUCCESS, rollout termine. Lecture technique:
HTTP 200, deployment ID `sv-mu07at15-8442337f1c17`, revision 005 a 100 % du
trafic, minimum service toujours 1. Controle commerce relu `v2_all/v2/off`.
Aucun push, deploiement Functions ou mutation catalogue dans cet ajustement.
Retour arriere Hosting vers `build-2026-09-13-004`.

### Fichiers historiques

`scripts/repair-product-image-formats.cjs` est borne aux trois IDs fautifs
du catalogue actuel (ils different de certains IDs cites dans l'audit initial).
Preparation sans ecriture cloud: 19 photos, 152 variantes, encodage WebP
verifie, sauvegarde privee des anciennes references et fichiers prepares.
Commit: nouveaux chemins immuables, batch de trois documents conditionne par
leur version, lecture de confirmation; aucun ancien media supprime.
Le trigger catalogue existant assure publication et revalidation.

Reparation terminee: 3 documents confirmes, 152 variantes retrouvees dans le
catalogue public version 353 (72/72, 48/48, 32/32). Aucun ancien fichier supprime.
Sauvegarde operateur privee conservee dans
`/Users/matthis/.codex/backups/secondevie-images-20260913/plan.json`.

Images principales preparees: 144 906, 174 166 et 119 530 octets contre
1 865 276, 2 389 573 et 1 907 345 octets servis avant reparation.
Cela mesure les fichiers, pas le temps d'affichage sur appareil reel.

## Verification et livraison

Lint cible et `git diff --check`; construction assuree par App Hosting.
Tests de contrat adaptes mais non executes a la demande de l'utilisateur.
Aucun test navigateur, E2E, mesure FPS ou comparaison visuelle automatique.
Les modifications preexistantes du devis et de `src/index.css` sont exclues.
Code commite: `91effbf`, branche `codex/product-image-loading-20260913`.
Hosting livre depuis une worktree propre de ce commit:
`build-2026-09-13-004`, construction READY et deploiement termine.
Lecture technique apres livraison: `/` HTTP 200, deployment ID
`sv-mu06cs5f-eaa2bd00f6e6`; revision Cloud Run
`secondevie-next-sandbox-build-2026-09-13-004` a 100 % du trafic, minimum
service toujours 1. Aucun push Git ni deploiement Functions.
Cette confirmation de version ne constitue pas une recette navigateur.

Le service Cloud Run a ete relu: `run.googleapis.com/minScale=1` au niveau
service; revision active initiale `build-2026-09-13-003` a 100 % du trafic.
Le minimum 0 de la revision ne supprime pas ce minimum du service.
Ce maintien evite le demarrage a froid du serveur Next, pas le travail du
navigateur (JavaScript, decode, rendu). Il ne garantit pas la permanence d'un
processus precis lors des remplacements ou deploiements.

## Retour arriere et recette

Hosting: restaurer `build-2026-09-13-003` si necessaire. Les nouvelles variantes
restent compatibles avec cette version. Si les fichiers doivent aussi etre
restaures, utiliser `rollback <plan prive>` avec le script de reparation:
verification des references courantes, batch conditionnel, aucune suppression.
Le plan prive doit etre conserve avant nettoyage des fichiers temporaires.

Recette utilisateur: galerie et categorie, ouverture immediate/apres pause,
defilement rapide, glissements successifs dans une fiche, zoom, retour et
reouverture. Inclure les trois meubles corriges et plusieurs produits jamais
ouverts. Valider Android, Mac et Windows. Ne pas annoncer un gain de fluidite
mesure avant ce retour. Aucune migration CDN ni modification Functions.
