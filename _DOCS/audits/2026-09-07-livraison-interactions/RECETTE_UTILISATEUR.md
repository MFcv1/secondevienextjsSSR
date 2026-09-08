# Fiche de recette Seconde Vie

**Prêt pour votre recette.** Version livrée le 8 septembre : `build-20260908-6188058`, code `6188058`, deployment ID `sv-mtsl55c9-5fafadb9b720`. Le correctif de transport des mails (`eb973d5`) est également actif. [Compte rendu et réserves](README.md).

URL : https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/

Prévoir un essai ordinateur puis téléphone pour les tests 1–4. Utiliser le client `pvml7008@gmail.com` et l'administrateur `loa.gto15@gmail.com`. Saisir les codes, mots de passe et confirmations matérielles directement sur l'appareil, jamais dans le chat ou une capture.

| N° | Action | Résultat attendu | En cas d'échec, noter |
| --- | --- | --- | --- |
| 1 | Ouvrir la galerie, une catégorie puis une fiche ; utiliser Retour. Ouvrir le menu puis Échap. | Bonne page à chaque étape, images visibles, retour utilisable et menu fermé. | URL, appareil, action exacte, image absente ou mauvaise page. |
| 2 | Rechercher « armoire », filtrer une catégorie « En stock », changer le prix maximal, puis revenir en arrière. | Recherche et filtres concordent avec l'URL et les pièces affichées. | Terme/filtres, nombre annoncé, pièce incohérente. |
| 3 | Ajouter une pièce disponible au panier et aux favoris, puis la retirer. Tester après connexion client. | Une seule ligne par pièce, prix/quantité cohérents, retraits conservés. | Nom de la pièce, montant, doublon ou élément réapparu. |
| 4 | Se connecter au compte client, ouvrir Favoris et Mes commandes, puis se déconnecter. | Seules les données de ce compte sont visibles ; aucun accès admin. | Compte utilisé, URL et message exact, sans code ni donnée privée. |
| 5 | Dans Mes commandes, consulter C145 et ouvrir ses deux documents. | Remboursée, 2 €, reçu et confirmation lisibles, mention sandbox non fiscale. | Référence, document, texte/montant absent, capture expurgée. |
| 6 | Facultatif, sur une nouvelle commande dédiée : vérifier le total, quitter/reprendre le paiement puis payer uniquement en Stripe **test**. | Reprise du même dossier, succès après confirmation durable, panier vidé, sans doublon. | Référence avant/après, heure, montant, étape ; ne pas repayer si le résultat est incertain. |
| 7 | Avec l'admin dédié, ouvrir Ventes, Retours, Devis, Factures et Stats/Data. Actualiser une liste et consulter la commande de recette. | Données lisibles, statuts cohérents ; erreur ou donnée absente indiquée explicitement. | Onglet, référence, filtre/période et valeur incohérente. |
| 8 | Vérifier les mails C145 dans les deux boîtes dédiées, y compris Indésirables. Pour une nouvelle commande test seulement, traiter son retour/remboursement une fois puis comparer les statuts. | Paiement, remboursement et documents portent la même référence et le bon montant ; aucun restock financier implicite. | Référence, montant, heure, destinataire, réception/spam ; ne pas relancer un remboursement incertain. |
| 9 | Ouvrir un dialogue dans un brouillon admin dédié, saisir une modification puis fermer sans sauvegarder. | Fermeture et clavier utilisables, contenu publié inchangé. | Champ, action, message et comportement du focus. |

**C145 est clôturée : 2 € payés puis remboursés en Stripe test, sans remise en stock automatique. La consulter uniquement.** Ses deux mails transactionnels client arrivent en spam ; les copies PDF et notifications admin arrivent en réception. Le contrôle visuel des PDF, le téléphone réel et la reprise d'une deuxième commande restent à votre recette.

Avant toute nouvelle opération financière des tests 6/8 : vérifier que Stripe est toujours en test, utiliser un article disponible dédié et identifier la nouvelle commande par `run_v2all_YYYYMMDD_<suffixe>`. Deux commandes maximum par campagne ; la campagne du 8 septembre en a créé une. Ne jamais utiliser une carte réelle, une commande antérieure/étrangère ou un destinataire non dédié. S'arrêter si le mode test ou le périmètre est incertain.

Pour transmettre un problème : **numéro de test, date/heure, ordinateur/téléphone, URL, action, attendu, observé**, puis une capture expurgée si utile. Une seule tentative financière suffit si le résultat est ambigu.
