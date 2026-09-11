# Résolution d’une copie documentaire ambiguë — sandbox

État au 11 septembre 2026 : A-038 clôturé par abandon explicitement autorisé
par le propriétaire, sans renvoi et sans attestation de livraison.
Il ne modifie aucune Function et ne nécessite pas de déploiement Hosting.

## Quand l’utiliser

`scripts/reconcile-document-delivery.mjs` concerne uniquement une outbox
`commerce-document-copy`, destinataire client, en `delivery_unknown`, sans
tentative active ni relance prévue. L’ancien outil
`reconcile-commerce-outbox-delivery.mjs` concerne un autre scénario admin ;
ne pas le détourner pour cette copie.

Un timeout SMTP, y compris `ETIMEDOUT` avec `command=CONN`, ne prouve pas
l’absence de livraison : le timeout générique de Nodemailer porte aussi
cette commande. Ne pas renvoyer, ni marquer envoyé sur cette seule base.

Il faut une preuve examinée par l’opérateur : acceptation fournisseur ou
réception du message exact, correspondant au document, à la commande et au
destinataire. La lecture d’une boîte mail nécessite une autorisation explicite
du workflow. Un fichier arbitraire ou une simple absence de résultat ne sont
pas une preuve. Le SHA-256 attache la décision au fichier examiné ; il
n’authentifie pas son contenu. Sans preuve concluante, conserver l’incident
ouvert et décrire précisément ce qui manque, sauf décision explicite du
propriétaire d'abandonner cette ancienne demande sans renvoi.

## Abandon autorisé sans preuve de livraison

Le mode `abandon` exige un plan frais et la confirmation exacte
`ABANDON_UNCERTAIN_COPY_NO_RESEND_<outboxId>_<fingerprint>`, avec les mêmes
arguments `--project`, `--env` et `--plan` que le mode `apply`.
Il conserve `deliveryUnknownAt` et l'erreur d'origine, inscrit une décision
auditée `deliveryAbandonment`, puis passe uniquement cette outbox en
`suppressed_stale`. Il ne crée ni `sentAt`, ni accusé fournisseur ; aucune
commande, aucun document et aucun e-mail ne sont supprimés ou renvoyés.
Une tentative concurrente interdit la décision ; une répétition identique
est sans effet. Une maintenance existante est clôturée en `cancelled`.

Ce mode a été appliqué à A-038 le 11 septembre après autorisation explicite.
Le rapprochement manuel borné des opérations est ensuite revenu `healthy`,
sans incident actif dans son échantillon et avec ses compteurs à zéro.

## Préparation en lecture seule

Depuis la racine du dépôt, sous Node 22, avec le compte gcloud autorisé :

```sh
node scripts/reconcile-document-delivery.mjs plan \
  --project=secondevienextjsssr --env=sandbox \
  --outbox-id=<identifiant-exact> --output=<fichier-local-prive.json>
```

Le fichier est créé en mode 0600, sans écraser un fichier existant. Ne pas
versionner le plan ni les preuves privées. Le plan conserve la version exacte
et l’empreinte de l’objet : un changement concurrent interdit l’application.

Un plan A-038 a été préparé avec succès, sans écriture cloud, dans
`logs/recette/final_maintenance_20260910/a038-resolution-plan.private.json`.
Il peut devenir obsolète ; ne jamais modifier manuellement sa version ou son
empreinte pour contourner un refus.

## Attestation et application

Après examen de la preuve, créer un JSON privé avec les valeurs exactes du
plan et les dates constatées, sans inventer une date de livraison :

```json
{
  "schemaVersion": 1,
  "outboxId": "<plan.outboxId>",
  "orderId": "<plan.orderId>",
  "documentId": "<plan.documentId>",
  "recipientHash": "<plan.recipientHash>",
  "attemptCount": 1,
  "observation": "recipient_received",
  "proofSha256": "<sha256 du fichier de preuve>",
  "observedAt": "<date ISO de vérification>",
  "sentAt": "<date ISO constatée du message>"
}
```

`attemptCount` doit correspondre au plan ; `observation` accepte aussi
`provider_acceptance`. Conserver le fichier de preuve en accès privé.

```sh
node scripts/reconcile-document-delivery.mjs apply \
  --project=secondevienextjsssr --env=sandbox \
  --plan=<plan.json> --evidence=<attestation.json> --proof=<preuve> \
  --confirm=CONFIRM_DELIVERED_NO_RESEND_<outboxId>_<proofSha256>
```

Cette opération modifie uniquement l’outbox ciblée dans une transaction,
conserve la justification et clôture son éventuel suivi en attention.
Elle n’envoie aucun e-mail, ne touche aucun paiement et n’invente pas
d’identifiant fournisseur. Une répétition identique ne réécrit pas l’objet.

## Vérification après résolution

1. Relire l’outbox : `sent` avec preuve pour une livraison attestée, ou
   `suppressed_stale` avec décision d'abandon et incertitude conservée ;
   aucune nouvelle tentative.
2. Vérifier que `journalOutboxStatusGen2` a clôturé l’incident de cet objet.
3. Utiliser le rapprochement manuel existant des opérations via le parcours
   admin autorisé, puis relire la santé et les compteurs live. Vérifier aussi
   la fermeture de l’incident agrégé `operations-deliveryUnknown`.
4. Ne pas écrire directement un statut `healthy` ni fermer les incidents en
   masse. Ne reprendre la recette transactionnelle que lorsque ses gates sont
   réellement satisfaites.

`operationsStatus=stop` est un verdict de supervision/préflight. Il ne faut
pas le présenter comme une fermeture automatique du checkout : le contrôle
commerce observé reste `v2_all/v2`.

### Compteur et registre d'incidents incohérents

`ADMIN_INCIDENT_SUMMARY_INVALID` peut signaler un compteur ne correspondant
plus aux contributions déjà acquittées dans `admin_incident_projections`.
Ne pas borner les nombres négatifs à zéro et ne pas fermer les incidents
pour masquer le défaut. L'outil opérateur `scripts/repair-incident-summary.mjs`
recalcule uniquement le compteur depuis ces contributions (maximum 100),
sauvegarde compteur et registres en fichier privé, puis vérifie leurs versions
dans une transaction. Aucun incident métier ni registre n'est réécrit. Les
événements de fermeture encore en attente peuvent ensuite appliquer leur delta.

Sous Node 22 avec les credentials sandbox du workflow autorisé :

```sh
node scripts/with-env.mjs .env.sandbox node scripts/repair-incident-summary.mjs plan secondevienextjsssr
node scripts/with-env.mjs .env.sandbox node scripts/repair-incident-summary.mjs apply secondevienextjsssr <sauvegarde-privee-inexistante.json>
```

Relire ensuite le compteur, les contributions et les reprises du journal.
Le 11 septembre, le plan a trouvé 24 contributions, dont deux critiques
actives, face à un compteur à zéro. La réparation a restauré deux, sans
réouvrir aucun incident métier. L'origine historique de l'écart n'est pas
prouvée ; cela ne justifie aucun rapprochement périodique supplémentaire.

## Validation du correctif

```sh
node --test tests/commerce/reconcile-document-delivery.test.mjs tests/commerce/reconcile-delivery.test.mjs
node node_modules/eslint/bin/eslint.js --no-ignore scripts/reconcile-document-delivery.mjs tests/commerce/reconcile-document-delivery.test.mjs --max-warnings 0
```

Résultat local : 7 tests réussis (dont 2 de l’ancien outil), lint réussi.
Couverture : preuve obligatoire, mauvaise cible, dates incohérentes, refus
d’un timeout seul, concurrence, absence de double écriture et suivi durable.
Les transactions sont simulées dans ces tests ; l’application réelle et les
projections cloud restent à qualifier après obtention de la preuve.
