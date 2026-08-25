# Synthese du noyau commerce

Derniere mise a jour: 2026-08-25
Statut: `POINT_ENTREE_COMMERCE`
Qualification actuelle: `PREPROD_TRANSACTIONAL_READY`

## 1. Role de ce document

Ce document est le point d'entree unique pour comprendre l'etat du commerce
sans parcourir tous les chapitres techniques. Il centralise:

- le resultat de la stabilisation;
- le contenu des Gates 0A a 8;
- les preuves finales;
- l'etat actuellement deploye;
- les limites qui restent avant une ouverture publique ou live;
- la route vers chaque source canonique de detail.

Il ne remplace pas les chapitres specialises et ne constitue pas une nouvelle
roadmap. En cas de contradiction, le code executable puis les chapitres lies
en section 10 restent autoritaires.

## 2. Verdict actuel

Le noyau commerce est qualifie `PREPROD_TRANSACTIONAL_READY` sur le projet
Firebase sandbox `secondevienextjsssr`. La qualification initiale sur fixtures
techniques allowlistees a ete completee le 2026-07-29 par une fenetre
`v2_all` bornee a cinq meubles reels, trois commandes Loa et Stripe test. Le
sandbox est maintenant ouvert durablement en mode transactionnel de test; cela
ne constitue ni une ouverture Stripe live ni un GO production.

La qualification couvre:

- checkout et reprise;
- PaymentIntent Stripe et Stripe Connect en mode test;
- reservation et conservation quantitative du stock;
- webhooks signes et idempotents;
- annulation provider-first;
- fulfillment;
- remboursements;
- retours, inspection, restock ou write-off;
- lecture client et administration forte;
- e-mails transactionnels durables;
- documents sandbox non fiscaux;
- rapprochement financier, incidents et cleanup.

Elle ne constitue pas:

- une activation Stripe live ou production;
- une autorisation Stripe Live;
- un GO production;
- une validation fiscale, comptable ou juridique;
- une validation du domaine final, du DNS ou de Resend.

Le rail admin de liens de paiement sans compte est deploye sur le sandbox
depuis le 2026-08-01. Il reutilise les orders, reservations, PaymentIntent,
webhooks et outboxes v2. Apres la fermeture du game day du 2026-08-24, le
controle a ete rouvert durablement sur autorisation explicite le 2026-08-25.
L'etat courant est `v2_all/v2` revision 77 avec la policy
`sandbox_transactional_policy_20260802`; Stripe reste exclusivement en mode test.

La migration Functions G8 du 2026-08-19 duplique en Gen2 les 35 callables
commerce hors checkout/webhooks/workers et deux legacy encore appelees (`createOrder` et
`getOrderStatusClient`). Les 37 cibles sont `ACTIVE` sous Node 22 et le
registre client les selectionne; leurs Gen1 restent intactes. Une fixture
jetable unique a prouve les lectures, transitions, retour, restock et
write-off avec restauration exacte, sans creer de paiement ni refund. Le
dry-run P1 a trouve 10 candidats `inventoryVersion: 0` prets sur 37 meubles,
mais aucune ecriture n'etait autorisee par le prompt G8. Le plan read-only
porte maintenant, pour chacun, `lastUpdateTime`, un hash de preuve et un digest
deterministe des dix preconditions afin qu'un futur backfill refuse tout drift.

G9 a deploye le 2026-08-22 les 24 paralleles checkout, Connect, refund,
operations et liens de paiement en Gen2, sans retirer leurs Gen1. Les quatre
schedulers ont chacun prouve double invocation bornee et rollback inverse;
leurs jobs Gen2 sont owners finaux. La probe Auth/App Check des trois lecteurs
est verte. Le registre client est servi par `build-2026-08-22-001`, apres
rollback reel vers `build-2026-08-19-005` et reactivation; G9 est fermee.

G10 a ferme le 2026-08-22 la bascule des webhooks sous Stripe test. Les
paralleles `stripeWebhookV2Gen2` et `stripeConnectWebhookV2Gen2` sont `ACTIVE`
sous Node 22; leurs sources Gen1 et les deux legacy historiques restent
intactes. Platform et Connect ont chacun prouve activation, rollback fournisseur
et reactivation. Le replay Connect a produit une seule tentative inbox
`processed`, sans changer la commande ni dupliquer fait, outbox, mouvement ou
refund. Aucun paiement/refund supplementaire ni build App Hosting n'a ete cree.

## 3. Ce qui a ete realise par Gate

| Gate | Objet | Resultat ferme |
| --- | --- | --- |
| 0A | runner, CI et anti-faux-vert | suites bloquantes, zero test saute et exit non nul prouves |
| 0B | confinement du legacy | anciens writers et mutations dangereuses bloques avant effet |
| 1 | modele de domaine v2 | schema, reducer, invariants monétaires/stock et compatibilite read-only |
| 2 | policy, livraison, Connect et inventaire | prix serveur, versions epinglees et mouvements quantitatifs idempotents |
| 3 | orchestration transactionnelle | checkout/reprise, PaymentIntent, inbox webhook, leases, reconciler et outbox |
| 4 | commandes metier | fulfillment, annulation, refund, retours, dispositions et actions admin autorisees serveur |
| 5 | consommateurs client/admin | checkout UI, reprise 3DS/reload, panier revisionne, lecteurs UID/admin et documents |
| 6 | migration et fixtures | classification legacy et scope technique isole avec stocks 1, 2 et 10 |
| 7A | exploitation | faits financiers, projections, documents, e-mails, incidents, sante et cleanup borne |
| 7B | qualification automatisee | deux runs heberges verts sur le meme SHA/release, 11 scenarios chacun |
| 8 | recette humaine sandbox | matrice client/admin, rapprochement final, quarantaine et fermeture de la fenetre |

## 4. Parcours verifies en Gate 8

### Client

- paiement carte accepte;
- carte refusee puis retry sur la meme commande et le meme PaymentIntent;
- challenge 3DS complete;
- fermeture, rechargement et reprise durable;
- annulation explicite avec PaymentIntent annule avant liberation du stock;
- concurrence de deux onglets sur un produit de stock 1;
- commande authentifiee;
- verification OTP invite et acces au parcours;
- suivi dans `/mes-commandes`;
- recu sandbox disponible uniquement apres capture durable.

### Administration

- consultation des commandes et actions autorisees derivees serveur;
- transition interdite refusee sans changement de version;
- preparation, expedition avec ou sans suivi, correction auditee du suivi et
  livraison;
- remboursement avant fulfillment;
- remboursement apres livraison;
- ouverture, reception et resolution d'un retour;
- restock seulement apres disposition physique admissible;
- suspension d'une policy avec refus checkout a zero effet;
- reactivation puis nouveau checkout fonctionnel;
- consultation des e-mails, documents, statistiques, incidents et
  rapprochement.

### Defaut trouve pendant la recette

Le client d'annulation envoyait `cancellationRequestId` alors que la Function
attendait `commandId`. L'echec est reste sur, sans liberation de stock. Le
contrat a ete corrige, couvert par regression, redeploye puis reteste avec
succes.

## 5. Preuves finales

| Preuve | Resultat |
| --- | --- |
| captures | 3 captures Stripe test correlees |
| remboursements | 2 refunds Stripe test correles |
| montant unitaire des preuves Gate 8 | 1 200 centimes EUR |
| e-mails attendus | 5 sur 5 `sent`, chacun avec identifiant fournisseur |
| documents | recus et confirmations immuables `non_fiscal_sandbox` |
| reservations Gate 8 | 8 au total, zero `held` final |
| projection financiere | zero divergence |
| incidents ouverts | zero |
| operations | `healthy`, tous les compteurs a zero |
| cleanup | 10 auxiliaires quarantaines, 41 preuves preservees |
| suppressions | zero |
| controle final | revision 22, admin `read_only`, offline `off` |

Runs humains correles:

- `run_gate8_recipe_v4_20260728`;
- `run_gate8_recipe_v5_20260728`.

Recette catalogue reel bornee:

- run `run_v2all_20260729_loa_orders_retry5`;
- une commande 10 EUR payee;
- une commande 80 EUR payee puis remboursee integralement;
- une commande 400 EUR payee avec trois meubles;
- cinq reservations finales `committed`, cinq stocks a zero et aucun restock
  automatique sur refund;
- trois inbox Stripe `payment_intent.succeeded` traites, quatre outbox e-mail
  `sent`, quatre faits financiers et aucun incident;
- operations `healthy`, tous les compteurs a zero;
- controle referme a la revision 32 et policy fixture restauree.

Release fonctionnel Gate 8:

- commit correctif final: `27dda7e`;
- manifeste: `release_gate7a_27dda7ebd409_3b1c4e7b0ade`;
- commit de fermeture UI: `dd27fa5`;
- deployment App Hosting observe apres fermeture:
  `sv-ms56blql-cbe19551502f`;
- commit de cloture documentaire: `3a4bd99`.

## 6. Etat fonctionnel du sandbox

Etat courant depuis l'ouverture durable du 2026-08-25:

- le checkout v2 est toujours expose dans le build sandbox;
- `adminMutationMode=v2`;
- `offlinePaymentMode=off`;
- `newCheckoutMode=v2_all`, revision 77, sans scope fixture ni echeance de fenetre;
- policy active `sandbox_transactional_policy_20260802`;
- les produits de test restent `e2eOnly` et exclus du catalogue public;
- Stripe est exclusivement en mode test et aucun secret live n'est attendu;
- l'endpoint Connect sandbox qualifie est
  `stripeConnectWebhookV2` en `europe-west1`;
- commandes, faits financiers, mouvements, audits et documents n'ont pas ete
  supprimes par le cleanup.

Les trois dossiers de cette recette restent visibles sur le compte Loa pour la
future passe UI/UX de `/mes-commandes`. Les defauts de projection observes
(`Date en attente`, adresse v2 non reprise, image de repli identique) et la
reprise `awaiting_method` sont suivis dans
[COMMERCE_REPRISE.md](COMMERCE_REPRISE.md).

## 7. Invariants obtenus

- Le navigateur n'est jamais autoritaire pour le prix, le stock ou le statut
  de paiement.
- Une capture Stripe durable converge vers `payment.status=succeeded`.
- Un refus reessayable conserve la commande et le hold.
- Un stock reserve n'est libere qu'apres annulation fournisseur ou preuve
  durable qu'aucune creation de PaymentIntent n'a commence.
- Les retries reutilisent les memes identites metier et Stripe.
- Un remboursement ne remet jamais seul un produit en vente.
- Le restock exige un retour physique et une disposition admissible.
- Les actions admin exigent App Check, registre admin et AAL2 Google ou
  passkey; aucune minuterie de reauthentification n'est appliquee.
- Les e-mails, faits financiers, documents et mouvements portent des
  identites deterministes.
- Le cleanup est run-scoped, borne et ne supprime aucune preuve comptable.

## 8. Validations executees

- `test:commerce:unit`: 83 tests verts avant la recette catalogue reel;
- `test:commerce:rules`: 12 tests verts apres alignement des champs panier;
- `lint:functions`: vert;
- build Next sandbox: reussi;
- deux runs Gate 7B complets: verts;
- recette Stripe/Connect, Gmail et Firebase hebergee: terminee;
- verification documentaire: `git diff --check` vert et aucun lien Markdown
  local casse.

Les warnings generaux non bloquants deja presents dans le build frontend ne
font pas partie de cette stabilisation.

Passe UX du 2026-07-30: le contrat checkout accepte desormais un telephone
optionnel, borne a 40 caracteres, et le persiste dans le snapshot de livraison.
Il reste non autoritaire pour toute donnee financiere.

Depuis le 2026-08-01, la demande de retour depuis l'espace client est un
dossier persistant `customer_return_requests`, et non plus un `mailto:`. Elle
cree une notification outbox administrateur et rejoint l'onglet Retours. Deux
decisions admin reutilisent les rails v2 existants: remboursement direct
uniquement lorsque `fulfillmentSummary.custody=merchant`, ou autorisation du
retour lorsque la piece a quitte l'atelier. Dans ce second parcours, le refund
Stripe n'est disponible qu'apres reception, disposition d'inspection et
resolution du dossier physique. Le stock reste une decision separee. Le code
et les tests sont locaux; aucun deploiement ni activation `adminMutationMode=v2`
n'en decoule.

## 9. Ce qui reste avant une ouverture publique

La prochaine etape n'est pas une nouvelle Gate de correction. Elle exige une
decision separee et un nouveau perimetre:

1. corriger la reprise de modale Stripe et la projection v2 de
   `/mes-commandes`;
2. terminer la recette UX/appareils de l'Axe R1;
3. finaliser domaine et URLs de retour;
4. valider Stripe Connect Live, KYC, cles et webhooks live;
5. confirmer taxes, livraison, frais, devise et responsabilites;
6. obtenir la validation juridique des CGV/retours;
7. mettre en place Resend/DNS et les garanties e-mail finales;
8. activer les sauvegardes, alertes, SLO et App Check production;
9. effectuer un paiement puis remboursement live de faible montant.

Aucune de ces actions n'a ete effectuee implicitement.

Les deux anciennes Functions de preuve Stripe `e2eCheckoutProof` et
`e2eStripeHardeningProof` ont ete retirees du sandbox en `G12-A:G3` apres 310
secondes sans trafic. Les commandes `e2e:hosted-stripe` et
`e2e:refund-stripe` restent `DO_NOT_RUN` et fail-closed; aucune requete Stripe,
mutation commerce ou destruction de donnee n'a ete executee. Le code et les
versions de secrets sont restes disponibles pendant le rollback date. Apres
expiration formelle, G12-B:G3 a retire les deux modules et scripts historiques;
les commandes package restent fail-closed et les secrets partages n'ont pas
ete detruits.

## 10. Sources de detail

L'observabilite active du 2026-08-24 ne change aucune source de verite
commerce. Six triggers Gen2 projettent uniquement les transitions
critiques vers `business_events`; les faits, commandes, mouvements, inbox et
outbox restent autoritaires. Le reconciler lit les rollups atomiques et repare
25 commandes par passage avec curseur, au lieu de tronquer silencieusement les
faits a 5 000 et les commandes a 500. Ces exports sont actifs sur le sandbox;
Stripe reste exclusivement en mode test.

Les commandes portent aussi un `orderNumber` entier, attribue dans la meme
transaction que la creation via `sys_counters/orders`. Les 131 commandes
sandbox existantes ont ete numerotees chronologiquement; la prochaine valeur
est 132. L'UI et les e-mails affichent `CMD-<numero>` et conservent l'ancien ID
opaque comme identifiant technique et fallback, sans le remplacer en base.

La campagne de resilience checkout D0 a D5 est close le 2026-08-24. Les suites
locales deterministes couvrent les frontieres navigateur/Functions/Stripe,
l'idempotence, les workers/outbox et la timeline incidents; la suite Emulator
couvre concurrence, doublons, desordre et cleanup par `runId`. Le game day
sandbox a cree quatre PaymentIntent test au total, deux payes et deux annules,
sans refund ni e-mail. R07 a ete prouve par un failpoint strictement local au
runner; R10 par une pause de cinq secondes du seul endpoint webhook Stripe
test, restaure `enabled` dans le `finally`. Aucun failpoint public ou deploye
n'existe. RC-006 est ferme par quatre episodes froids confirmes dans Cloud Run:
3,731 s a 5,013 s cote serveur, mediane 4,331 s. Le signal initial proche de
8,6 s n'est pas reproduit; `minInstances: 0` est conserve et aucun changement
de capacite n'est justifie sur le sandbox.

| Besoin | Source |
| --- | --- |
| fonctionnement checkout, Stripe, refunds et preuves | [COMMERCE_STRIPE.md](COMMERCE_STRIPE.md) |
| reprise differee R1 a R5 | [COMMERCE_REPRISE.md](COMMERCE_REPRISE.md) |
| statut global et invariants obligatoires | [AGENTS.md](../../AGENTS.md) |
| cartographie code, routes, donnees et Functions | [map.md](../../map.md) |
| parcours administrateur | [BACKOFFICE.md](../admin/BACKOFFICE.md) |
| parcours client, reprise et documents | [ESPACE_CLIENT.md](../client/ESPACE_CLIENT.md) |
| sandbox, regions, webhooks et deploiement | [INFRASTRUCTURE.md](../infra/INFRASTRUCTURE.md) |
| exploitation, ouverture/fermeture et cleanup | [EXPLOITATION.md](../operations/EXPLOITATION.md) |
| suites de tests et limites des preuves | [QUALITE_TESTS.md](../quality/QUALITE_TESTS.md) |

## 11. Regle de maintenance

Mettre a jour cette synthese lorsqu'un changement modifie:

- le statut de qualification;
- un mode de controle commerce;
- la frontiere fixture/public/live;
- le provider ou l'endpoint transactionnel;
- une preuve de release ou un rollback;
- une condition obligatoire avant production.

Les details d'implementation restent mis a jour dans leur chapitre specialise;
la synthese conserve uniquement la vue transversale necessaire a la reprise.
