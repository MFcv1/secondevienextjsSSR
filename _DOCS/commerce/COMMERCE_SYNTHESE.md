# Synthese du noyau commerce

Derniere mise a jour: 2026-07-29
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
`v2_all` bornee a cinq meubles reels, trois commandes Loa et Stripe test. Cette
fenetre est refermee; elle ne constitue pas une ouverture publique permanente.

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

- une activation publique permanente `v2_all`;
- une autorisation Stripe Live;
- un GO production;
- une validation fiscale, comptable ou juridique;
- une validation du domaine final, du DNS ou de Resend.

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

## 6. Etat de securite et de fermeture

Apres la recette:

- `NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_UI=false`;
- `NEXT_PUBLIC_COMMERCE_V2_UI=false`;
- `adminMutationMode=read_only`;
- `offlinePaymentMode=off`;
- `newCheckoutMode=v2_fixture` reste borne a
  `fixture_gate6_20260728`;
- les produits de test restent `e2eOnly` et exclus du catalogue public;
- Stripe est exclusivement en mode test;
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
- Les actions admin sensibles exigent App Check, registre admin et AAL2
  recent.
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
Il reste non autoritaire pour toute donnee financiere. La demande de retour
depuis l'espace client est un contact contextualise avec l'atelier: le
remboursement Stripe, la reception physique et le restock restent exclusivement
des transitions serveur/admin protegees.

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

## 10. Sources de detail

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
