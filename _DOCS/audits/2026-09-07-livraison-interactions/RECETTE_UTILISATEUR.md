# Fiche de recette Seconde Vie

**Statut : à exécuter après livraison vérifiée de la version préparée.** La sandbox sert encore l'ancienne version `build-2026-09-06-002` ; les essais actuels ne valident pas les correctifs du 7 septembre.

URL : https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/

Prévoir un essai ordinateur puis téléphone pour les tests 1–4. Utiliser le client `pvml7008@gmail.com` et l'administrateur `loa.gto15@gmail.com`. Saisir les codes, mots de passe et confirmations matérielles directement sur l'appareil, jamais dans le chat ou une capture.

| N° | Action | Résultat attendu | En cas d'échec, noter |
| --- | --- | --- | --- |
| 1 | Ouvrir la galerie, une catégorie puis une fiche ; utiliser Retour. Ouvrir le menu puis Échap. | Bonne page à chaque étape, images visibles, retour utilisable et menu fermé. | URL, appareil, action exacte, image absente ou mauvaise page. |
| 2 | Rechercher « armoire », filtrer une catégorie « En stock », changer le prix maximal, puis revenir en arrière. | Recherche et filtres concordent avec l'URL et les pièces affichées. | Terme/filtres, nombre annoncé, pièce incohérente. |
| 3 | Ajouter une pièce disponible au panier et aux favoris, puis la retirer. Tester après connexion client. | Une seule ligne par pièce, prix/quantité cohérents, retraits conservés. | Nom de la pièce, montant, doublon ou élément réapparu. |
| 4 | Se connecter au compte client, ouvrir Favoris et Mes commandes, puis se déconnecter. | Seules les données de ce compte sont visibles ; aucun accès admin. | Compte utilisé, URL et message exact, sans code ni donnée privée. |
| 5 | Sur une commande dédiée à la recette, vérifier le total avant un paiement Stripe **test**. Attendre la confirmation ; consulter Mes commandes et le reçu. | Succès après confirmation durable, même référence/montant dans commande et document, panier correctement nettoyé. | Référence `C…`, heure, total et statut ; ne pas repayer si le résultat est incertain. |
| 6 | Sur une autre commande dédiée, quitter/reprendre le paiement ou revenir après actualisation. | Reprise du même dossier, sans nouvelle commande ni faux succès. | Référence avant/après, étape, message et état du panier. |
| 7 | Avec l'admin dédié, ouvrir Ventes, Retours, Devis, Factures et Stats/Data. Actualiser une liste et consulter la commande de recette. | Données lisibles, statuts cohérents ; erreur ou donnée absente indiquée explicitement. | Onglet, référence, filtre/période et valeur incohérente. |
| 8 | Traiter le retour et le remboursement autorisés de la commande de recette via l'admin, puis vérifier côté client et dans les deux boîtes dédiées. | Montant confirmé cohérent, statut actualisé, mails aux bons destinataires ; aucun restock financier implicite. | Référence, montant, heure, destinataire et état observé ; ne pas relancer un remboursement incertain. |
| 9 | Dans l'éditeur d'accueil ou un brouillon dédié, ouvrir un dialogue, modifier puis enregistrer ; vérifier la réponse ou fermer sans sauvegarder. | Une sauvegarde unique, erreur visible si refus, saisie conservée et clavier utilisable. | Champ, double clic éventuel, message et contenu avant/après. |

Avant les tests 5, 6 et 8 : faire confirmer que la nouvelle version est livrée, que Stripe est toujours en test et que les articles/commandes appartiennent au run dédié `run_v2all_YYYYMMDD_<suffixe>`. Deux commandes maximum. Ne jamais utiliser une carte réelle, une commande antérieure ou un destinataire non dédié. Les essais paiement/remboursement ne sont pas encore exécutés pour cette version.

Pour transmettre un problème : **numéro de test, date/heure, ordinateur/téléphone, URL, action, attendu, observé**, puis une capture expurgée si utile. Une seule tentative financière suffit si le résultat est ambigu.
