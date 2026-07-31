---
name: client-admin-test
description: Exécute la recette humaine complète client et administrateur de Seconde Vie sur le sandbox avec Chrome, Gmail et Stripe test, puis documente les anomalies sans corriger le code. Utiliser quand l’utilisateur écrit $client-admin-test, « client admin test », « test client/admin », demande à Luna de tester le sandbox, ou veut rejouer la recette commerce et e-mails de bout en bout.
---

# Recette client / administrateur

## Démarrage automatique

Traiter l’invocation de ce skill comme l’autorisation de commencer immédiatement la pré-vérification en lecture seule, puis d’exécuter les mutations sandbox déjà autorisées par les documents du projet. Ne pas demander à l’utilisateur de recopier un prompt ou de confirmer une seconde fois le lancement.

Suspendre uniquement lorsqu’une interaction humaine sécurisée non automatisable est imposée par Chrome, Google, Touch ID ou le navigateur, lorsqu’une approbation d’outil est requise, ou lorsqu’une condition d’arrêt de cette procédure est rencontrée. Le choix d’un compte Google déjà connecté et la lecture/saisie d’un OTP de recette ne nécessitent pas l’intervention de l’utilisateur. Ne jamais demander qu’un secret soit copié dans le chat.

Cette recette est conçue pour Luna en raisonnement très élevé. Elle reste utilisable par tout modèle disposant des mêmes outils et accès.

## Charger la vérité du projet

Se placer à la racine du dépôt, trois niveaux au-dessus de ce fichier, puis lire intégralement et dans cet ordre :

1. `AGENTS.md` ;
2. `map.md` ;
3. `TEST_CLIENT_ADMIN_LUNA.md` ;
4. `TEST_COMMERCE_SANDBOX.md` ;
5. `_DOCS/email/RECETTE_EMAILS_LUNA.md` ;
6. `anomalies.md` ;
7. les chapitres canoniques commerce, administration, espace client, e-mail, qualité et exploitation cités par ces documents et utiles aux scénarios retenus.

Le code et la configuration exécutables restent la preuve finale. En cas de contradiction, appliquer l’ordre de vérité défini par `AGENTS.md` et signaler l’écart.

## Périmètre immuable

- Site exclusif : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.
- Projet Firebase : `secondevienextjsssr`.
- Paiement : Stripe test exclusivement, jamais Stripe live.
- Client : `pvml7008@gmail.com`, compte lambda sans claim, rôle ni droit administrateur.
- Administrateur : `loa.gto15@gmail.com`, connexion Google réelle et assurance forte dans Chrome.
- Exécuteur : agent de recette et de diagnostic uniquement.
- Correcteur ultérieur des anomalies applicatives : `GPT-5.6-sol`.

Ne jamais activer la production, un domaine live, Stripe live, une fenêtre `v2_all` permanente, un contournement Auth, ni une protection affaiblie.

## Contrôler Chrome et Gmail

Utiliser le Chrome externe déjà équipé de l’extension ChatGPT, pas le navigateur intégré. Charger et suivre le skill `browser:control-in-app-browser` lorsqu’il est disponible, sélectionner explicitement Chrome, nommer la session de recette et revendiquer uniquement les onglets sandbox et Gmail nécessaires.

Utiliser le connecteur Gmail autorisé pour la boîte client `pvml7008@gmail.com`. Contrôler la boîte administrateur directement dans Chrome sous `loa.gto15@gmail.com`. Le transfert admin vers client n’est qu’un filet de secours et ne constitue jamais une preuve de réception dans la boîte admin.

Le profil Chrome contient déjà les comptes de recette autorisés. Lorsque Google ou Gmail affiche le sélecteur de comptes, cliquer soi-même sur l’identité exacte nécessaire au scénario, notamment `pvml7008@gmail.com` ou `loa.gto15@gmail.com`. Ne pas s’arrêter simplement parce que `matthis.fradin2@gmail.com` ou une autre identité de recette est active : ouvrir le sélecteur et basculer vers le bon compte avant toute lecture ou mutation.

Pour chaque e-mail client attendu, rechercher aussi avec `in:anywhere` et inspecter le spam. Corréler l’heure, le destinataire, le numéro de commande, le montant et le `runId`, sans exposer le contenu sensible.

Pour un OTP envoyé par Seconde Vie dans la boîte de recette autorisée, ouvrir le message, lire le code courant et le saisir soi-même dans le formulaire du sandbox. L’OTP peut être utilisé transitoirement pour achever le scénario, mais il ne doit jamais être affiché dans la conversation, dicté à l’utilisateur, conservé dans un fichier ou un log, ajouté au presse-papiers, ni présent dans une capture ou le rapport final. Ne pas demander à l’utilisateur de saisir l’OTP lorsque la boîte est accessible.

Suspendre seulement pour un mot de passe, un PIN système, Touch ID, Face ID, une passkey, un CAPTCHA, une récupération de compte ou une confirmation matérielle que l’agent ne peut pas accomplir. Ne jamais lire, recopier, conserver ni photographier ces secrets, un token, un cookie, des données de carte ou une clé secrète.

## Pré-vérification obligatoire

Avant toute mutation :

1. créer un `runId` unique, court et visible dans les noms des données de recette ;
2. confirmer visuellement l’URL exacte du sandbox et Stripe en mode test ;
3. confirmer les deux identités actives et l’absence totale de droit admin pour le client ;
4. lire l’état des contrôles commerce et vérifier `v2_fixture`, mutations admin `read_only`, paiement offline `off`, opérations `healthy`, zéro incident et zéro hold ouvert ;
5. confirmer le mécanisme de fermeture et de retour à cet état ;
6. définir la fenêtre temporelle, les produits autorisés et les montants attendus conformément aux recettes ;
7. relever les résidus connus, notamment A-015 et A-016, sans les confondre avec le nouveau run.

Ne commencer aucune écriture tant que la cible, l’identité, le mode Stripe, la policy bornée ou la possibilité de refermer les contrôles reste incertaine.

## Exécuter la recette client

Procéder comme un humain dans l’interface :

1. se connecter avec le client par le parcours OTP normal ;
2. vérifier qu’aucune surface ou action admin n’est accessible ;
3. réaliser un achat simple autorisé, sans rejouer une soumission ambiguë ;
4. réaliser un achat de plusieurs meubles si la fenêtre documentée l’autorise ;
5. contrôler le récapitulatif, le paiement Stripe test et la confirmation durable `paid` ;
6. ouvrir `/mes-commandes` et vérifier présence, lignes, montants, statut, historique et documents ;
7. vérifier le profil, l’adresse et les informations de livraison ;
8. vérifier les e-mails correspondants côté client.

Le bouton client de demande de remboursement ouvre seulement le contact support. Il ne doit jamais être traité comme un remboursement financier Stripe. Effectuer tout remboursement réel exclusivement depuis le back-office avec l’administrateur fort.

## Exécuter la recette administrateur

Procéder comme l’humain responsable du back-office :

1. se connecter avec `loa.gto15@gmail.com` par Google OAuth et accomplir l’assurance forte demandée ;
2. vérifier la réception et la projection des commandes créées pendant ce run ;
3. publier, via l’interface normale, un meuble de recette portant le préfixe et le `runId` prescrits ;
4. vérifier sa présence dans le catalogue public matérialisé et son caractère achetable ;
5. tester les transitions de préparation, livraison et retrait prévues par la campagne, y compris les deux branches lorsque le plan les exige ;
6. déclencher depuis le back-office le remboursement Stripe test autorisé ;
7. vérifier le statut remboursé côté admin puis côté client ;
8. vérifier que le remboursement seul ne remet pas automatiquement le meuble en stock ;
9. contrôler chaque e-mail directement dans la boîte admin et dans la boîte client.

Ne jamais supprimer ou annuler une commande payée pour simuler un remboursement. Ne jamais rejouer aveuglément un paiement, un webhook ou un remboursement dont le résultat est ambigu.

## Vérifier la matrice e-mail M01–M13

Lire les déclencheurs, destinataires et preuves exacts dans `_DOCS/email/RECETTE_EMAILS_LUNA.md`, puis produire un résultat séparé `REUSSI`, `ECHEC`, `BLOQUE` ou `NON_EXECUTE` pour chacun :

- M01 : OTP de connexion client ;
- M02 : OTP de validation checkout ;
- M03 : commande payée au client ;
- M04 : nouvelle commande à l’administrateur ;
- M05 : commande en préparation au client ;
- M06 : commande prête au retrait au client ;
- M07 : commande retirée au client ;
- M08 : commande expédiée au client ;
- M09 : commande livrée au client ;
- M10 et M11 : remboursement confirmé au client et à l’administrateur ;
- M12 et M13 : remboursement en échec ou anomalie au client et à l’administrateur.

Utiliser deux commandes distinctes pour les branches livraison et retrait, qui sont incompatibles sur une même commande. N’exécuter le remboursement asynchrone en échec qu’après réussite de la gate technique spécifique décrite dans la recette ; sinon le marquer `BLOQUE` et le transmettre à `GPT-5.6-sol` sans improviser.

Ne pas inventer une preuve manquante et ne pas considérer un transfert comme la réception dans la boîte d’origine.

## Gérer une anomalie

À la première anomalie :

1. arrêter uniquement le sous-parcours affecté ;
2. sécuriser et refermer immédiatement les contrôles si le paiement, le stock, l’identité ou l’idempotence peuvent être touchés ;
3. poursuivre seulement les scénarios réellement indépendants ;
4. consigner dans `anomalies.md` une entrée reproductible et sanitizée avec `runId`, environnement, identité non secrète, étapes, attendu, observé, impact, preuves, résidus et état des contrôles ;
5. préparer le handoff vers `GPT-5.6-sol`.

Ne modifier aucun code, n’appliquer aucun patch, ne déployer rien et ne changer ni secrets, rules, indexes, claims, DNS ou configuration cloud. Une demande de connexion humaine n’est pas une anomalie.

## Fermer proprement la campagne

Avant le rapport final :

1. archiver les meubles de recette par l’interface normale ;
2. préserver les commandes payées, remboursements et preuves financières ;
3. vérifier explicitement le produit résiduel A-015 et les documents A-016 ;
4. ramener et prouver les contrôles à `v2_fixture`, mutations admin `read_only`, paiement offline `off`, opérations `healthy`, zéro incident et zéro hold ;
5. fermer ou libérer proprement les onglets contrôlés selon le skill navigateur ;
6. lister tout résidu non supprimable ou toute preuve encore attendue.

Si la fermeture n’est plus garantie, arrêter toute nouvelle action et privilégier le retour à l’état sûr.

## Rendre le rapport final

Présenter un compte rendu concis mais complet avec :

- verdict global et `runId` ;
- matrice client et matrice administrateur ;
- commandes, montants et produits concernés ;
- résultat du paiement et du remboursement ;
- cohérence du stock et des permissions ;
- tableau M01–M13 ;
- e-mails reçus, retardés, manquants ou non exécutés dans chaque boîte ;
- anomalies inscrites et scénarios arrêtés ;
- données de recette ou résidus restants ;
- état final prouvé de tous les contrôles ;
- handoff précis vers `GPT-5.6-sol` ;
- mention exacte : `Code modifié par Luna: NON`.

Ne jamais déclarer la recette réussie si une preuve obligatoire manque ou si les contrôles ne sont pas refermés.
