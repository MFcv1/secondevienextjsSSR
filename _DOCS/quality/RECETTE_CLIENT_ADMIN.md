# Recette client et administrateur — sandbox

Révision : 2026-09-04. Propriétaire : équipe Seconde Vie.
Statut : `PROCEDURE_ACTIVE`. Ce document remplace les lanceurs et plans de
recette de juillet ; les preuves anciennes restent archivées.

## Mandat et autorisations

Cette recette s'exécute seulement à la demande de l'utilisateur, dans les
limites du prompt de campagne. Le lire comme documentation n'autorise ni Gmail,
ni paiement, ni mutation. Le lanceur [$client-admin-test](../../.agents/skills/client-admin-test/SKILL.md)
prépare un prompt explicite pour Chrome/Gmail et les opérations Stripe test.
Une autorisation déjà explicite ne doit pas être redemandée par principe.

L'agent du chat réalise la campagne ; un seul agent contrôle Chrome. Le rôle de
testeur est indépendant du modèle : aucune correction de code, de rules, de
secret, d'IAM ou de déploiement pendant la recette. Les corrections relèvent
d'une demande distincte, sans réserver ce droit à Sol, Luna, Terra ou Astra.

## Cible et préparation

| Élément | Périmètre |
| --- | --- |
| Firebase | `secondevienextjsssr` |
| Site | https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app |
| Client | `pvml7008@gmail.com`, sans claim ni registre admin |
| Admin | `loa.gto15@gmail.com`, Google OAuth et AAL2 |
| Navigateur | Chrome externe, liaison disponible et autorisée |
| Finance | Stripe test seulement ; offline off ; jamais de carte réelle |
| Produits | Cinq IDs exacts sélectionnés et validés avant les achats |
| Campagne | `run_v2all_YYYYMMDD_<suffixe>`, deux commandes maximum et un smoke distinct |

Lire [la synthèse commerce](../commerce/COMMERCE_SYNTHESE.md),
[les e-mails](../email/EMAILS_TRANSACTIONNELS.md) et les anomalies pertinentes
dans [le registre](../../anomalies.md). Pour les constats de septembre :
[recette HRT](RECETTE_HUMAINE_SANDBOX.md), section Gates de fermeture.

Avant toute mutation : vérifier origine/projet, identités, Stripe test, contrôle
commerce réel, opérations saines, stock et version servie. Identifier les deux
boîtes autorisées et l'heure de début. Un compte personnel visible dans le
sélecteur Google n'autorise pas à lire sa boîte.

### Deux modes de contrôle, à ne pas mélanger

- **Sandbox durable ouvert** : décision du 25 août, dernier état consigné
  `v2_all/v2` révision 77. Relire sa valeur réelle. Ne pas appeler les anciennes
  commandes d'ouverture/fermeture temporaire ni restaurer `v2_fixture` par habitude.
  Conserver l'état autorisé au départ ; aucune modification de policy hors mandat.
- **Fenêtre temporaire explicitement demandée** : lire le contrat du script
  `scripts/commerce-v2-all-window.mjs` et la policy autorisée ; vérifier
  status/discover/preflight, préparer la fermeture avant open, confirmer
  `OPEN` et le même `activeRunId`, fermer avant expiration puis prouver
  `CLOSED` et la restauration de l'état initial. Ne pas reprendre une fenêtre
  expirée ni une policy de juillet comme autorisation actuelle.

Le `runId` sert toujours à corréler les preuves, même sans contrôle temporaire.
Si la cible, l'état ou le périmètre autorisé sont incertains, poursuivre les
lectures sûres mais ne pas créer de paiement/publication.

## Parcours et matrice M01–M13

| ID | Déclencheur / contrôle | Boîte |
| --- | --- | --- |
| M01 | Connexion client OTP depuis la galerie, compte sans accès admin | Client |
| M02 | Vérification e-mail checkout depuis une session déconnectée | Client |
| M03 | Commande payée : articles, quantités, prix/livraison et lien espace client | Client |
| M04 | Notification nouvelle commande dédiée, lien vers la commande exacte ; pas une BCC | Admin |
| M05 | Mise en préparation | Client |
| M06 | Prête au retrait | Client |
| M07 | Retrait confirmé | Client |
| M08 | Expédition avec même transporteur/suivi côté serveur, UI et e-mail | Client |
| M09 | Livraison confirmée | Client |
| M10 | Remboursement confirmé | Client |
| M11 | Remboursement confirmé | Admin |
| M12 | Échec/anomalie de remboursement, sans promettre un remboursement acquis | Client |
| M13 | Échec/anomalie, consigne de traitement sans relance aveugle | Admin |

1. **OTP** : demander un code courant, vérifier destinataire et usage, le saisir
   sans le montrer ni le conserver. Une erreur réseau après validation n'est pas
   la preuve d'un mauvais code : utiliser la reprise prévue par l'application.
2. **Commande A livraison** : un ou deux produits autorisés, paiement Stripe test
   de réussite standard, `paid` durable, M03/M04, préparation/expédition/livraison,
   puis parcours retour physique admissible et remboursement complet unique.
3. **Commande B retrait** : autre produit autorisé, `paid`, préparation/prête/
   retirée. Tester le remboursement asynchrone en échec seulement après sa gate.
4. **Publication smoke** : au plus une annonce séparée, titre
   `[RECETTE <runId>]`, au plus deux images fictives sans donnée personnelle,
   stock/prix bornés. Vérifier snapshot et fiche, puis archiver par l'interface.
   Ne pas acheter ce smoke dans les deux commandes.
5. **Client/admin** : après chaque étape, comparer lignes, montant, référence
   humaine, livraison, statut, documents et permissions. Contrôler les deux
   boîtes directement ; le transfert Gmail ne prouve pas une réception admin.

Pour M08 : `Autre transporteur`, `Transporteur recette`, `RECETTE-<runId>`.
Deux branches livraison/retrait incompatibles ne se forcent pas sur une commande.
Les transitions et décisions physiques doivent suivre les actions autorisées
du domaine ; jamais d'injection directe Firestore/outbox pour obtenir un e-mail.

### Gate particulière M12/M13

`npm run commerce:refund-failed:preflight` est une vérification non mutante des
consommateurs/endpoints Stripe test. `READY` ne prouve pas le scénario humain.
Vérifier la prise en charge actuelle de `refund.failed` avant d'utiliser le
moyen de paiement de test prévu dans la [documentation Stripe](https://docs.stripe.com/testing#refunds).

Gate rouge : suspendre M12/M13, continuer les scénarios indépendants autorisés.
Ne pas fabriquer un événement ou une outbox. Après une tentative unique,
attendre l'état final et contrôler commande, tentative, facts/rollup et e-mails.
M10/M11 attendent une stabilisation de cinq minutes et une relecture de la
tentative avant envoi : un succès déjà renversé doit être `suppressed_stale`
(A-025). Si l'échec survient après un envoi réellement acquis, conserver la
chronologie exacte et distinguer compensation tardive et confirmation obsolète.

Après échec final : remboursement effectif nul, capture conservée, net égal à
la capture, anomalie explicite, correction financière append-only et stock
inchangé. Après succès A : capture = remboursement, net nul, aucun restock
implicite. Ne jamais supprimer une commande payée pour « nettoyer ».

## Preuves, récupération et arrêt

Pour chaque modèle : verdict `REUSSI`, `ECHEC`, `BLOQUE` ou `NON_EXECUTE`,
heure Europe/Paris, commande, destinataire attendu, dossier Gmail, contenu/
rendu/liens, doublons éventuels et outbox/provider corrélés. Rechercher après
l'heure du run, par référence et objet, avec `in:anywhere` et le spam.
Vérifier `To` ; ne pas confondre une conversation ancienne et le message du run.

Protéger OTP, cookies, tokens, mots de passe, PIN et données de carte : ni chat,
ni presse-papiers, ni capture persistante, ni rapport. Preuves expurgées uniquement
sous `logs/recette/<runId>/` (ignoré par Git). Délivrabilité Gmail : A-010,
pas de contournement ni promesse de résultat production.

Un onglet absent, mauvais compte, locator périmé ou timeout appelle une reprise
sûre et différente, pas l'abandon. Utiliser le sélecteur Google autorisé.
L'utilisateur intervient seulement pour la protection réellement présentée
(mot de passe, biométrie, CAPTCHA, récupération, approbation imposée).
Ne pas contourner un refus d'outil.

Suspendre les mutations concernées si cible/identité/mode test incertains,
paiement/refund/stock ambigu, destinataire incorrect ou divergence autoritaire.
Sécuriser une fenêtre temporaire ouverte si nécessaire. Dans le mode durable,
ne pas fermer globalement le commerce sans autorisation ; demander l'action
précise requise. Ne jamais rejouer une mutation financière pour accélérer.

Une anomalie ouverte ne bloque que ses dépendances. `CORRIGEE_A_REQUALIFIER`
ordonne de rejouer le test ; ce n'est pas une gate rouge. Un checkpoint vert
ne termine pas la campagne si des scénarios sûrs restent exécutables.

## Fin de campagne

Consigner les anomalies au fil de l'eau dans `anomalies.md` : run, scénario,
étapes, attendu/observé, impact, preuve, état autoritaire et résidus. Aucun
nouveau journal parallèle. Ne pas effacer les preuves existantes ni corriger
le code pendant la recette.

Avant le rapport : archiver seulement le smoke du run, préserver commandes/
facts/audits, rapprocher stock/holds/inbox/outbox, vérifier les opérations et
l'état des contrôles attendu pour le mode choisi. Ne pas supprimer un ancien
résidu sans identité et autorisation exactes.

Rapport final : verdict, run, deux commandes/montants, matrice M01–M13,
permissions, Stripe/stock, deux boîtes, anomalies et preuves manquantes,
résidus et état final. Ne pas annoncer une réussite si une preuve obligatoire
manque. Terminer par `Code modifié par l'agent de recette: NON`.
