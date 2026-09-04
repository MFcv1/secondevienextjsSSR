# Commerce — synthèse

Revue documentaire : 2026-09-04. Propriétaire : commerce.
Qualification : `PREPROD_TRANSACTIONAL_READY`, sandbox uniquement.
État transversal : [ETAT_PROJET.md](../ETAT_PROJET.md).

## État utile

Le noyau v2 est qualifié sur fixtures puis sur des meubles sandbox réels :
checkout/reprise, stock quantitatif, Stripe/Connect test, webhooks, annulations,
livraison/retrait, retours/remboursements, documents et e-mails.

Depuis la décision du 25 août, le sandbox est ouvert durablement en
`newCheckoutMode=v2_all`, `adminMutationMode=v2`, `offlinePaymentMode=off`.
Dernier contrôle consigné : révision 77, policy
`sandbox_transactional_policy_20260802`. Relire les valeurs réelles avant
mutation ; aucune expiration de fenêtre n'est implicitement attachée à cet état.
Les anciennes fermetures en révisions 22/32/52 sont historiques.

Aucun GO production, Stripe live, validation juridique/fiscale, domaine final
ou transport Resend ne découle de cette qualification.

## Contrats à conserver

- Prix, stock, policy, identité de commande et paiement autoritaires serveur.
- Réservation → PaymentIntent → inbox signée → effet durable ; un refus
  réessayable conserve les identités. Annulation fournisseur avant libération,
  sauf preuve durable qu'aucune création de PaymentIntent n'a commencé.
- Reprise 3DS/reload sur la même commande/PI, pas nouvelle création aveugle.
- Fulfillment, paiement et garde physique sont des axes distincts.
- Refund financier séparé du retour physique et du restock. Après sortie de
  l'atelier, suivre réception/inspection/disposition avant résolution appropriée.
- Actions admin : Auth, claim, registre, AAL2 et App Check ; aucun timer de
  reconnexion arbitraire. Les actions permises sont calculées serveur.
- Snapshots, facts, inbox/outbox, documents et mouvements idempotents conservés.
  Un cleanup de recette ne supprime aucune preuve comptable.
- Succès client seulement après `paid` durable ; manque de projection/lecture
  signalé comme indisponibilité, jamais faux historique vide.
- `C<orderNumber>` est la référence humaine partagée ; compteur transactionnel
  `sys_counters/orders`. L'ID Firestore reste technique, sans fallback visuel.
  Recherche Incidents accepte les anciennes références `CMD-`.

Domaine, transitions et fichiers : [COMMERCE_STRIPE.md](COMMERCE_STRIPE.md).

## Parcours ajoutés après le noyau initial

- Liens de paiement admin sans compte : URL privée HMAC, stock/PI/webhooks v2,
  extension/rotation/expiration bornées et auditées.
- Demande client de retour persistante, notification admin et traitement Retours ;
  ce n'est plus un simple `mailto:`.
- Suivi transporteur normalisé, expédition avec/sans suivi et correction distincte,
  même information dans l'admin, l'e-mail et l'espace client.
- Codes promotionnels et gains newsletter revalidés/réservés serveur au checkout.
- PDF sandbox immuables et privés, ouverture/téléchargement/partage et copie e-mail.
  Ne pas les présenter comme des documents fiscaux de production.
- Projections Stats/finance asynchrones : une panne de copie UI ne bloque ni
  capture ni refund. Les facts financiers restent transactionnels.
- Outbox/réservations déclenchées par événements vers Cloud Tasks aux échéances ;
  schedulers conservés comme reprise, pas suppression implicite.
- Code du 3 septembre : état explicite du checkout perdant, listener UID borné
  des commandes et badge Retours global. Le code existe ; les preuves humaines
  restantes sont dans [la recette HRT](../quality/RECETTE_HUMAINE_SANDBOX.md).

## Qualification : portée des preuves

| Campagne | Résultat conservé | Limite |
| --- | --- | --- |
| Gates 0A–8, juillet | Domaine, confinement legacy, tests/reprises et recette humaine fermés ; 7B : deux runs, 11 scénarios chacun | Pas une autorisation live |
| Catalogue réel, 29 juillet | Cinq produits, commandes 10/80/400 EUR ; celle à 80 EUR remboursée, pas de restock implicite | État fermé de cette ancienne fenêtre, pas contrôle actuel |
| Gen2 G8–G12 | Consumers, workers et webhooks test migrés ; retraits legacy documentés | Les listes Gen1 conservées pendant le rollback ne sont plus l'inventaire courant |
| Résilience D0–D5, 24 août | Concurrence/rejeu/pannes, quatre PI test dont deux payés/deux annulés ; R07 runner local et R10 endpoint réactivé | Aucun failpoint public ; minInstances 0 conservé sur les mesures de cette campagne |
| HRT, 3 septembre | Paiement/stock/retour/refund cohérents | Courses UX, rafraîchissement et latences encore à requalifier selon le suivi |

Les détails de release, identifiants et résultats initiaux sont conservés dans
[COMMERCE_STRIPE.md](COMMERCE_STRIPE.md), les suivis et les archives.
Ne pas recopier un nombre historique de commandes, un endpoint legacy ou une
ancienne version d'App Hosting comme valeur actuelle.

Les commandes `e2e:hosted-stripe` et `e2e:refund-stripe` restent
`DO_NOT_RUN` ; leurs endpoints de preuve ont été retirés.
`commerce:e2e:gate7b` nécessite son mandat sandbox borné.

## Reprise ciblée

[COMMERCE_REPRISE.md](COMMERCE_REPRISE.md) garde seulement les axes ouverts.
La procédure de test est [RECETTE_CLIENT_ADMIN.md](../quality/RECETTE_CLIENT_ADMIN.md).
Contrôler [anomalies.md](../../anomalies.md) et les gates HRT avant de refaire une
correction déjà livrée. Une requalification ne se remplace pas par la lecture du code.

Admin : [BACKOFFICE.md](../admin/BACKOFFICE.md). Client :
[ESPACE_CLIENT.md](../client/ESPACE_CLIENT.md). Tests :
[QUALITE_TESTS.md](../quality/QUALITE_TESTS.md). Déploiement et rollback :
[INFRASTRUCTURE.md](../infra/INFRASTRUCTURE.md) et
[EXPLOITATION.md](../operations/EXPLOITATION.md).

Maintenir cette synthèse lors d'un changement de contrat ou de qualification,
pas à chaque commande de test.
