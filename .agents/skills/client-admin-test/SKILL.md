---
name: client-admin-test
description: Exécuter en autonomie la recette humaine complète client et administrateur de Seconde Vie sur le sandbox avec Chrome externe, Gmail et Stripe test, vérifier M01–M13, requalifier les corrections et consigner les anomalies sans corriger le code. Utiliser quand l’utilisateur écrit $client-admin-test, « client admin test », « test client/admin », demande de tester le sandbox ou veut rejouer la recette commerce et e-mails de bout en bout.
---

# Recette client / administrateur

## Mission

Exécuter toute la campagne comme un testeur humain autonome. Chercher le résultat attendu, raisonner à partir de l’état réel de l’interface et adapter le chemin lorsque Chrome, Google ou le site présente une friction ordinaire.

L’agent qui reçoit le skill reste propriétaire de la campagne. Ne pas déléguer automatiquement selon le nom ou le modèle de l’agent. Si l’utilisateur demande explicitement une délégation, ne confier Chrome qu’à un seul agent et ne jamais lancer deux campagnes concurrentes.

Commencer immédiatement. L’invocation et le prompt par défaut autorisent, pour cette campagne sandbox uniquement :

- le contrôle de Chrome sur Seconde Vie et Gmail ;
- la lecture des e-mails de recette de `pvml7008@gmail.com` et `loa.gto15@gmail.com` ;
- le changement entre les comptes Google déjà connectés ;
- la connexion Google OAuth administrateur et la saisie transitoire des OTP Seconde Vie sans exposition ;
- les coordonnées fictives, images de recette sans donnée personnelle, publications, paiements et remboursements Stripe test prévus par la recette.

Une confirmation imposée au moment exact par la plateforme reste prioritaire. Ne jamais contourner un mot de passe, un PIN, Touch ID, Face ID, une passkey, un CAPTCHA, une récupération de compte ou une protection matérielle.

## Contrat d’autonomie et de complétion

L’invocation du skill constitue déjà la demande d’exécuter toute la recette et l’autorisation d’utiliser les accès de recette énumérés ci-dessus. Ne pas demander à l’utilisateur de se connecter, de choisir un compte déjà visible, d’ouvrir Gmail, de retrouver un message, de lire ou saisir un OTP de recette, ni d’accomplir une navigation ordinaire que Chrome permet à l’agent d’effectuer lui-même. Une intervention utilisateur n’est légitime que si la plateforme présente effectivement une protection humaine non automatisable ou demande une approbation d’outil au moment exact. Prouver cette contrainte visible avant de suspendre.

Un préflight vert, une connexion réussie, un OTP validé, une commande payée, un remboursement confirmé ou une fenêtre refermée sont des checkpoints, jamais une définition implicite de fin. Après chaque checkpoint, déterminer les objectifs obligatoires encore non prouvés et continuer immédiatement vers le meilleur prochain objectif sûr. Ne rendre le rapport final qu’après la section « Fin de campagne », ou après un blocage réel répondant aux critères de suspension et après avoir poursuivi tous les scénarios indépendants.

Raisonner librement sur l’ordre d’exécution à partir des dépendances, de l’état autoritaire, du temps restant et du risque. Ces règles imposent le résultat et les garde-fous, pas une séquence mécanique. Avant chaque pause ou clôture anticipée, se demander explicitement : « Puis-je accomplir moi-même la prochaine action ? » et « Reste-t-il un scénario sûr et autorisé ? ». Si la réponse est oui, continuer.

## Sources de vérité

Depuis la racine du dépôt, lire avant la campagne :

1. `AGENTS.md` ;
2. `map.md` ;
3. `TEST_COMMERCE_SANDBOX.md` ;
4. `_DOCS/email/RECETTE_EMAILS_LUNA.md` ;
5. `anomalies.md` ;
6. les chapitres canoniques utiles cités par ces documents.

Le code et la configuration exécutables priment sur les notes historiques. Un statut `CORRIGEE_A_REQUALIFIER` demande de rejouer le test ; il ne bloque jamais la campagne à lui seul.

## Chrome et comptes Google

Utiliser exclusivement le Chrome externe avec le skill `chrome:control-chrome`. Lire ce skill et sa documentation dynamique, obtenir une seule liaison Chrome, puis la conserver jusqu’à la fin.

Chrome contient trois comptes Google déjà connectés :

- `matthis.fradin2@gmail.com` : compte personnel pouvant être affiché au départ ;
- `pvml7008@gmail.com` : compte client de recette, sans aucun droit admin ;
- `loa.gto15@gmail.com` : compte administrateur de recette.

Un mauvais compte affiché, un écran de sélection Google, une session à reprendre ou un message placé dans le spam ne sont pas des demandes d’intervention humaine. Cliquer sur l’avatar ou l’icône de compte Google, ouvrir le sélecteur et choisir soi-même l’adresse exacte nécessaire. Faire de même dans Gmail et pendant Google OAuth. Vérifier l’adresse visible après chaque changement avant de lire un e-mail ou d’effectuer une action.

Réutiliser les onglets sandbox et Gmail visibles. Si un onglet manque, l’ouvrir dans la même instance Chrome. Si l’origine n’est pas autorisée par l’extension, demander seulement à l’utilisateur d’activer l’extension sur cet onglet, conserver le checkpoint et reprendre dans la même campagne.

Pour les e-mails client, chercher aussi dans `in:anywhere` et le spam. Pour un OTP Seconde Vie, lire le code et le saisir directement dans le sandbox. Ne jamais afficher, dicter, enregistrer, copier dans le presse-papiers, journaliser ou capturer un OTP, un cookie, un token, un mot de passe ou des données de carte.

## Manière de travailler

Travailler selon cette boucle jusqu’à la fin :

1. observer l’état visible et l’état autoritaire disponible ;
2. choisir l’action humaine la plus directe ;
3. agir une seule fois ;
4. vérifier le résultat avant toute action financière ou irréversible suivante ;
5. noter une anomalie applicative reproductible ;
6. continuer tous les scénarios indépendants.

Être pleinement autonome pour les navigations, changements de compte, reconnexions ordinaires, onglets absents, pages obsolètes, locators cassés, délais réseau et recherches Gmail. Essayer une récupération sûre et différente au lieu de répéter aveuglément la même action. Ne jamais transformer une friction récupérable en checkpoint remis à l’utilisateur.

Ne suspendre toute la campagne que si :

- une intervention humaine sécurisée est réellement obligatoire ;
- l’identité, le mode Stripe ou la cible ne peuvent pas être prouvés ;
- un paiement, remboursement, stock ou webhook se trouve dans un état ambigu ;
- la fermeture des contrôles sandbox n’est plus garantie.

Sinon, isoler seulement le scénario affecté et poursuivre le reste. Avant une reprise, vérifier l’état autoritaire ; ne jamais rejouer aveuglément un paiement, un remboursement, un webhook ou une transition de commande.

Maintenir mentalement une matrice des preuves obligatoires : client, administrateur, deux commandes, transitions livraison et retrait, remboursement réussi, remboursement en échec si sa gate est verte, publication puis archivage du smoke, contrôles Gmail et M01–M13, résidus et état final. Après chaque action, marquer uniquement la preuve réellement obtenue et choisir parmi les cases restantes celle dont les dépendances sont satisfaites. L’absence de prochaine étape écrite dans l’interface ou dans le dernier message n’autorise jamais l’arrêt.

## Garde-fous immuables

- Site : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app` uniquement.
- Firebase : `secondevienextjsssr` uniquement.
- Stripe : mode test uniquement, jamais live.
- Client : `pvml7008@gmail.com`, jamais administrateur.
- Admin : `loa.gto15@gmail.com` avec Google OAuth et assurance forte.
- Exactement deux commandes : une livraison et un retrait ; aucune troisième commande.
- Utiliser uniquement les cinq produits découverts avant l’ouverture de la fenêtre.
- Publier au plus un meuble smoke portant le `runId`, puis l’archiver.
- Ne jamais supprimer ou annuler une commande payée pour simuler un remboursement.
- Un remboursement ne remet jamais automatiquement le meuble en stock.
- Ne modifier aucun code, secret, rule, index, claim, DNS ou déploiement. Réserver les corrections applicatives à Sol dans une tâche séparée.

## Préflight et fenêtre sandbox

Suivre les commandes et critères de `TEST_COMMERCE_SANDBOX.md` :

1. vérifier `status` avant de créer un run et sécuriser tout run déjà actif ;
2. créer un `runId` `run_v2all_YYYYMMDD_<suffixe>` ;
3. confirmer visuellement le sandbox, les identités et Stripe test ;
4. exiger `v2_fixture`, admin `read_only`, offline `off`, opérations `healthy` et compteurs à zéro ;
5. exécuter `discover`, puis `preflight`, avec le client et exactement cinq produits ;
6. préparer la commande de fermeture avant toute ouverture ;
7. exécuter `commerce:refund-failed:preflight` pour A-017 ; une gate rouge bloque seulement M12/M13 ;
8. accomplir les connexions et accès Gmail prévisibles avant d’ouvrir ;
9. n’accepter l’ouverture que si la sortie vaut `OPEN` et si le même `activeRunId` est confirmé ;
10. fermer au plus tard cinq minutes avant l’échéance, puis exiger `CLOSED` et le retour complet à l’état sûr.

Ne pas fermer la fenêtre simplement parce que les deux paiements sont terminés. Tant que le temps et l’état autoritaire le permettent, la conserver pour les mutations encore obligatoires du même run : publication smoke, transitions administrateur, expédition, retrait, livraison, remboursement qualifiant et requalification M12/M13. La fermer dès que toutes les mutations requises sont prouvées, à l’approche de l’échéance ou lorsqu’une condition de sécurité l’impose. Une fermeture de sécurité anticipée protège le sandbox mais ne termine pas la recette : poursuivre les contrôles indépendants et déclarer précisément les scénarios désormais bloqués, sans présenter le checkpoint comme un résultat final complet.

Si une pause humaine survient pendant la fenêtre, arrêter les nouvelles mutations et fermer la fenêtre avant de demander l’intervention.

## Scénarios à accomplir

### Client

- Tester M01 par connexion OTP et confirmer l’absence totale d’accès admin.
- Se déconnecter, puis déclencher M02 depuis le checkout.
- Créer une commande livraison, avec deux meubles si le stock le permet, et une commande retrait simple.
- Vérifier récapitulatifs, paiements Stripe test, statut durable `paid`, `/mes-commandes`, lignes, montants, historique, documents, profil, adresse et livraison.
- Vérifier les e-mails client correspondants.

Une erreur `auth/network-request-failed` après validation OTP est un incident de transport, pas la preuve d’un mauvais code. Utiliser la reprise bornée prévue par l’application et vérifier les logs sanitizés avant de demander un nouvel OTP.

### Administrateur

- Se connecter avec `loa.gto15@gmail.com` par Google OAuth et accomplir l’assurance forte demandée.
- Vérifier les deux commandes et leurs projections.
- Publier au plus un meuble smoke, vérifier sa présence publique, puis prévoir son archivage.
- Tester les transitions des branches livraison et retrait.
- Pour l’expédition, utiliser `Autre transporteur`, `Transporteur recette` et `RECETTE-<runId>`.
- Déclencher le remboursement Stripe test depuis le back-office, puis vérifier admin, client et stock.
- Vérifier directement les e-mails admin et client.

### E-mails M01–M13

Produire un résultat `REUSSI`, `ECHEC`, `BLOQUE` ou `NON_EXECUTE` pour chaque scénario défini dans `_DOCS/email/RECETTE_EMAILS_LUNA.md` : OTP client et checkout, commande payée, notification admin, préparation, retrait, expédition, livraison, remboursement réussi et remboursement en échec côté client et admin.

A-017, A-018 et toute autre entrée `CORRIGEE_A_REQUALIFIER` doivent être réellement rejouées. Une difficulté sur l’expédition ne bloque pas la branche retrait, les remboursements, les documents ou les contrôles Gmail indépendants.

## Anomalies rencontrées

Consigner au fil de la campagne toute anomalie applicative reproductible dans `anomalies.md`, sans attendre la fin. Inclure : `runId`, environnement, identité non secrète, scénario, étapes, attendu, observé, impact, preuve sanitizée, résidus et état des contrôles.

Ne pas inscrire comme anomalie applicative un onglet fermé, un compte Google mal sélectionné, une permission d’extension absente ou une interaction biométrique. Les traiter comme frictions de surface et reprendre dès qu’elles sont résolues.

Ne créer aucun autre fichier de rapport ou checkpoint et ne corriger aucun défaut. Si une anomalie touche l’identité, le paiement, le stock ou l’idempotence, sécuriser d’abord la fenêtre, vérifier l’état autoritaire et poursuivre uniquement ce qui reste sûr.

## Fin de campagne

Avant le rapport :

- archiver le meuble smoke par l’interface ;
- préserver les commandes, remboursements et preuves financières ;
- vérifier les résidus A-015 et A-016 ;
- prouver `CLOSED`, `v2_fixture`, admin `read_only`, offline `off`, opérations `healthy`, zéro incident et zéro hold ;
- libérer uniquement les onglets ouverts ou contrôlés par la campagne ;
- lister toute preuve manquante ou tout résidu restant.

Avant de conclure, vérifier explicitement que chaque scénario client, administrateur et M01–M13 possède un verdict étayé, que toutes les mutations prévues pendant la fenêtre ont été tentées dans le bon état, et qu’aucune action encore sûre et autorisée n’a été laissée à l’utilisateur. Si une case reste sans preuve alors qu’elle est encore exécutable, la campagne continue.

Rendre un rapport avec le verdict, le `runId`, les deux commandes et montants, les résultats client/admin, Stripe, stock et permissions, le tableau M01–M13, les e-mails par boîte, les anomalies ajoutées, les résidus et l’état final des contrôles.

Terminer par la mention exacte : `Code modifié par l'agent de recette: NON`.

Ne jamais déclarer la recette réussie si une preuve obligatoire manque ou si les contrôles ne sont pas refermés.
