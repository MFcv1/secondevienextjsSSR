# Campagne de resilience checkout et console d'incidents

Derniere mise a jour: 2026-08-24

Statut: `PLAN_TEMPORAIRE_EXECUTION`

Proprietaire: Seconde Vie, execution assistee par Codex

Branche isolee: `codex/checkout-resilience-lab`

Socle immuable: commit `53aa224`, tag `checkpoint/incidents-console-2026-08-24`

Environnement maximal autorisable: Firebase/App Hosting sandbox `secondevienextjsssr`, Stripe test uniquement

Revue et cloture au plus tard: 2026-10-31

## 1. Role du document

Ce document est l'unique plan temporaire et registre d'execution de la campagne
de resilience du checkout et de qualification de la console `Admin > Incidents`.
Il doit permettre de savoir, sans dependre d'une conversation:

- quel comportement est teste et pourquoi;
- quelle panne est injectee, a quel endroit et avec quel rayon d'impact;
- quelles donnees de test sont lues ou creees;
- quelles preuves ont ete observees dans l'interface, Firestore, Stripe test et
  Cloud Logging;
- quels fichiers, flags, Functions ou configurations sont modifies;
- comment arreter l'experience et revenir au socle connu;
- quelles anomalies ont ete trouvees, corrigees puis requalifiees.

Ce document n'autorise par lui-meme aucune ecriture cloud, aucun deploiement et
aucune operation Stripe. Chaque phase conserve ses propres gates et
autorisations explicites.

## 2. Resultat recherche

La campagne doit prouver qu'une interruption ou une repetition a n'importe
quelle frontiere critique du checkout ne provoque jamais:

- deux commandes pour une meme intention d'achat;
- deux PaymentIntents, captures ou remboursements pour une meme commande;
- un stock negatif, un double mouvement ou une reservation orpheline;
- une commande affichee `paid` avant un etat serveur durable;
- une regression d'etat causee par un webhook tardif ou desordonne;
- la perte silencieuse d'un effet secondaire obligatoire;
- l'exposition d'un e-mail, d'une adresse, d'un telephone, d'une IP, d'un
  token ou d'un secret dans la console ou les logs visibles.

Quand une reprise automatique n'est pas sure, le resultat attendu est un etat
`needs_review` explicite, observable et exploitable, jamais une supposition de
succes ou d'echec.

## 3. Principes non negociables

1. Ne jamais injecter un bug aleatoire dans `main`.
2. Travailler uniquement depuis le tag de checkpoint sur la branche isolee.
3. Commencer par des tests deterministes locaux, puis l'emulateur; le sandbox
   reel vient seulement apres autorisation distincte.
4. Une experience = une hypothese, un seul type de panne principal, un `runId`
   unique et, si elle utilise de l'aleatoire, une seed persistante.
5. Le mecanisme d'injection est inactif par defaut et fail-closed. Il ne doit
   jamais etre activable depuis un parametre public du navigateur.
6. Toute injection serveur future doit refuser l'execution hors du projet
   `secondevienextjsssr`, porter une expiration et une allowlist de profils.
7. Aucune cle, aucun token, aucune donnee personnelle complete et aucun moyen
   de paiement ne doit entrer dans Git, un rapport ou une capture.
8. Les identifiants techniques peuvent etre conserves uniquement sous forme
   tronquee ou hachee dans ce document.
9. Aucun test de charge contre Stripe test; les appels restent sequentiels et
   bornes.
10. Un abort condition atteint arrete immediatement l'experience. La campagne
    ne tente pas de reparer automatiquement une divergence financiere.
11. Les changements de code, de donnees, de configuration et les deploiements
    sont journalises separement.
12. Une anomalie trouvee devient un test de non-regression reproductible avant
    sa requalification.

## 4. Perimetre et interdictions

### Inclus

- checkout commerce v2;
- reservation et engagement du stock;
- creation, confirmation et reconciliation d'un PaymentIntent Stripe test;
- reception, deduplication et traitement des webhooks;
- reprise navigateur, multi-onglet et double soumission;
- outbox transactionnelle, sans livraison e-mail reelle par defaut;
- projection des evenements dans la console d'incidents;
- controles AAL2, audit, minimisation et cout de consultation.

### Exclus sans nouvelle decision explicite

- toute production, domaine final ou Stripe live;
- tout paiement, remboursement ou e-mail sandbox reel;
- tout deploiement App Hosting ou Functions;
- toute purge, suppression ou correction manuelle de donnees;
- tout test de charge;
- toute baisse de rules, App Check, signature webhook ou assurance admin;
- toute panne globale de projet, region, bucket ou compte Stripe;
- toute utilisation de donnees d'une cliente reelle.

## 5. Modele d'experience

Chaque experience suit cet ordre ferme:

1. **Etat stable**: version, flags, compteurs, stock et sante connus.
2. **Hypothese**: comportement attendu formule avant l'injection.
3. **Preconditions**: cible, profil, fixture, autorisations et rollback valides.
4. **Injection**: panne unique, bornee dans le temps et dans le scope.
5. **Observation**: UI, console Incidents, Firestore, Stripe test et logs.
6. **Invariants**: comptages exacts et transitions d'etat verifiees.
7. **Arret**: injection desactivee avant toute analyse longue.
8. **Nettoyage**: seulement par le rail dedie et autorise; sinon donnees
   conservees et etiquetees pour investigation.
9. **Verdict**: `OK`, `ANOMALIE`, `BLOQUE` ou `NON_EXECUTE`.
10. **Rejeu**: commande et seed suffisantes pour reproduire le resultat.

## 6. Niveaux d'execution

| Niveau | Cible | Effets externes | Autorisation |
| --- | --- | --- | --- |
| L0 | tests purs/domaines | aucun | autorise sur la branche |
| L1 | navigateur local + mocks/proxy | aucun appel Stripe ou e-mail | autorise sur la branche |
| L2 | Firebase Emulator Suite + fixtures jetables | donnees locales seulement | autorise apres preflight local |
| L3 | sandbox read-only avec donnees existantes | audits techniques attendus seulement | autorisation de lecture sandbox |
| L4 | sandbox transactionnel + Stripe test | nouvelles donnees et operations test | autorisation explicite par fenetre |

Le passage a L4 exige un manifeste de run, un meuble/stock dedie, un compte de
recette, un budget d'appels, un rail e-mail neutralise, une heure de debut et
une heure de fin. La presente creation documentaire reste en L0.

## 7. Architecture d'injection envisagee

La priorite est d'injecter les pannes depuis le runner, le navigateur ou des
adapters de test. Un failpoint dans le code metier n'est ajoute que si aucune
frontiere externe ne permet de reproduire le cas.

Garde-fous obligatoires pour un futur failpoint serveur:

- aucun controle `NEXT_PUBLIC_*`;
- aucun parametre libre accepte depuis le client;
- projet sandbox exact et environnement non live verifies cote serveur;
- profil enumere, `runId`, expiration et compteur maximal d'activations;
- journal technique sans payload metier;
- desactivation automatique et explicite dans le `finally` du runner;
- test prouvant que le profil est inaccessible lorsque le garde-fou est absent;
- inventaire dans `map.md` et suppression a la cloture si non durable.

Les profils prevus restent des noms de conception tant qu'ils ne sont pas
implementes:

```text
drop_client_response_after_order_create
timeout_after_payment_intent_create
fail_before_order_commit
fail_after_order_commit
delay_webhook_processing
duplicate_webhook_delivery
reverse_webhook_order
interrupt_outbox_after_claim
expire_auth_before_resume
delay_callable_response
```

## 8. Matrice initiale des scenarios

| ID | Panne ou condition | Niveau initial | Invariants principaux | Preuve attendue dans Incidents | Statut |
| --- | --- | --- | --- | --- | --- |
| R00 | parcours temoin sans panne | L0/L2 puis L4 | une commande, un paiement, stock exact | timeline complete et ordonnee | `A_PREPARER` |
| R01 | hors-ligne avant `createCheckoutV2` | L1 | aucune commande/PI, panier conservé | aucune fausse commande | `A_PREPARER` |
| R02 | reponse perdue apres creation serveur | L1/L2 | meme commande au retry | tentative et reprise correlees | `A_PREPARER` |
| R03 | double clic et appels concurrents | L1/L2 | un effet metier | doublon neutralise visible | `A_PREPARER` |
| R04 | reload/fermeture pendant confirmation | L1/L2 | reprise depuis etat durable | etape d'arret identifiable | `A_PREPARER` |
| R05 | timeout apres creation Stripe | L0/L2 puis L4 | meme idempotency key, aucun second PI | etat indetermine puis reconciliation | `A_PREPARER` |
| R06 | echec Firestore avant effet Stripe | L0/L2 | aucun effet Stripe | echec explicite sans stock perdu | `A_PREPARER` |
| R07 | echec Firestore apres effet Stripe | L0/L2 puis L4 | reconciliation, aucun double debit | `needs_review` ou convergence prouvee | `A_PREPARER` |
| R08 | webhook duplique | L0/L2 | effets idempotents | reception et deduplication visibles | `A_PREPARER` |
| R09 | webhooks livres dans le desordre | L0/L2 | aucun recul d'etat | ordre d'arrivee et decision visibles | `A_PREPARER` |
| R10 | webhook retarde ou temporairement indisponible | L1/L2 | UI reste `processing`, reconciliation | attente puis convergence | `A_PREPARER` |
| R11 | worker interrompu apres claim | L0/L2 | retry sans double effet | tentative, retry et resultat | `A_PREPARER` |
| R12 | echec d'envoi e-mail | L0/L2 | paiement independant, outbox reprise | e-mail `failed/dead_letter` visible | `A_PREPARER` |
| R13 | expiration reservation en concurrence avec paiement | L0/L2 | pas de vente sans stock ni liberation abusive | mouvements et arbitrage visibles | `A_PREPARER` |
| R14 | expiration Auth ou App Check pendant reprise | L1 | reauth sans seconde commande | refus puis reprise correlee | `A_PREPARER` |
| R15 | deux clients sur le dernier exemplaire | L0/L2 | un seul gagnant, stock jamais negatif | deux commandes explicables | `A_PREPARER` |
| R16 | Function lente, cold start ou `503` transitoire | L1/L2 | retry borne avec backoff | latence/erreur puis reprise | `A_PREPARER` |
| R17 | plus de 100 evenements | L2 uniquement | 100 plus recents et indicateur clair | troncature clairement affichee | `A_PREPARER` |
| R18 | webhook mal signe | L0/L2 | rejet sans mutation | erreur securite sans secret | `A_PREPARER` |
| R19 | consultation par non-admin/AAL1 | L3 | refus avant lecture metier | audit/refus sans donnee | `PARTIELLEMENT_PROUVE` |

## 9. Abort conditions

Arret immediat si l'une de ces conditions apparait:

- cible ou cle Stripe non test;
- projet Firebase different de `secondevienextjsssr`;
- Function, flag ou revision non prevu dans le manifeste;
- donnee personnelle complete ou secret visible dans une sortie;
- plus d'un PaymentIntent, capture ou remboursement pour l'operation;
- stock negatif ou mouvement financier sans commande correlee;
- e-mail reel sur un run qui devait neutraliser l'outbox;
- profil de panne encore actif apres la duree declaree;
- absence de chemin de rollback ou de diagnostic autorise;
- erreur non bornee affectant une commande hors fixture.

Apres un abort, aucune mutation corrective improvisée n'est permise. Les
preuves read-only sont relevees, l'anomalie est qualifiee, puis une decision
separee autorise ou non la correction.

## 10. Preuves obligatoires par run

```text
Run ID:
Date/heure debut-fin:
Operateur:
Git SHA / deploymentId:
Niveau L0-L4:
Profil/seed:
Autorisation explicite L4:
Fixture et identifiants tronques:
Etat stable avant:
Hypothese:
Etapes executees:
Resultat navigateur:
Resultat console Incidents:
Comptages Firestore:
Etat Stripe test:
Requete Cloud Logging bornee:
Invariants:
Donnees creees:
Nettoyage/retention:
Abort condition:
Verdict:
Anomalies liees:
Chemins des preuves non sensibles:
```

Les captures et journaux volumineux vont dans un dossier ignore. Ce document
ne conserve que des syntheses, hashes, compteurs et chemins de preuve.

## 11. Registre des donnees de campagne

| Run ID | Environnement | Donnees creees | Operations Stripe/e-mail | Retention/nettoyage | Statut |
| --- | --- | --- | --- | --- | --- |
| PRE-INCIDENTS-20260824 | sandbox read-only | aucune donnee metier; audits de consultation attendus | aucune | aucun nettoyage requis | `CLOS` |
| D4-STRIPE-6d9be04ee9e6 | sandbox transactionnel | 2 commandes fixture, 2 PaymentIntents test, 1 fait financier, mouvements et auxiliaires correles | 1 paiement test, 1 annulation PI, 0 remboursement, 0 e-mail | preuves financieres preservees; 3 auxiliaires quarantaines; 0 suppression | `PARTIEL` |
| D4-CLOSE-2d209b1a854c | sandbox transactionnel | 2 commandes fixture, 2 PaymentIntents test, 1 fait financier, mouvements et auxiliaires correles | 1 paiement test, 1 annulation PI, 0 remboursement, 0 e-mail; endpoint Connect pause 5 s puis reactive | 10 preuves preservees; 3 auxiliaires quarantaines; 0 suppression | `CLOS` |

Toute fixture future est inscrite ici avant son utilisation. Une donnee non
inscrite est consideree hors scope et ne doit pas etre modifiee.

## 12. Baseline deja observee le 2026-08-24

Cette baseline precede la campagne de fault injection. Elle a ete executee sur
la console sandbox avec des donnees existantes, sans paiement, remboursement,
e-mail, deploiement ni ecriture metier.

| Controle | Resultat borne | Verdict |
| --- | --- | --- |
| ouverture Admin > Incidents | console chargee sous session admin forte | `OK` |
| recherche identifiant technique | une commande existante retrouvee | `OK` |
| recherche PaymentIntent Stripe test | meme commande retrouvee, concordance Stripe test | `OK` |
| recherche remboursement existant | meme commande retrouvee, concordance Stripe test | `OK` |
| recherche `CMD-111` | aucune commande retournee alors que `orderNumber=111` existe | `ANOMALIE` |
| recherche invalide/inexistante | erreur generique ou resultat vide sans fuite | `OK` |
| chronologie | 18 evenements visibles, ordre non decroissant | `OK` |
| etape bloquee | commande `needs_review` classee `Reprise a verifier`; paiement reussi, fulfillment non traite, remboursement a verifier | `OK` |
| familles d'evenements | commande, paiement, stock, remboursement, documents et e-mails presents sur l'echantillon | `PARTIEL` |
| webhook | un webhook traite existe dans l'inbox mais n'apparait pas dans la timeline | `ANOMALIE` |
| limite 100 | libelle code, mais maximum observe dans les donnees existantes: 31 evenements | `NON_VERIFIABLE` |
| donnees sensibles UI/logs | aucun e-mail, adresse, IP, token ou secret complet observe | `OK_BORNE` |
| rail serveur | UI liee au seul callable diagnostic; 6 soumissions initiales = 6 requetes Function | `OK` |
| utilisateur client | callable refuse avec `403 PERMISSION_DENIED` | `OK` |
| administrateur AAL1 | callable refuse avec `FAILED_PRECONDITION` | `OK` |
| administrateur AAL2 | consultations reussies | `OK` |
| audits | 7 consultations valides observees, recherches hachees | `PARTIEL` |
| performances | apres chauffe, recherches autour de 0,4 a 1,1 s; premier appel froid autour de 8,6 s | `PARTIEL` |
| recherche e-mail/multi-commandes | non executee, autorisation de saisie refusee | `NON_EXECUTE` |

Comparaison read-only de l'ordre echantillon:

- timeline affichee: 18 evenements;
- Firestore: 4 evenements commande, 1 tentative, 1 remboursement, 2
  documents, 2 faits financiers, 2 mouvements stock, 6 sorties e-mail;
- inbox webhook: 1 evenement traite non projete;
- Stripe test: paiement et remboursement `succeeded`, montants et devise
  concordants;
- Cloud Logging: aucune correspondance e-mail ou motif de secret dans la
  fenetre bornee.

## 13. Anomalies baseline a fermer avant d'utiliser la console comme oracle

| ID | Gravite | Preuve | Cause probable | Correction necessaire | Statut |
| --- | --- | --- | --- | --- | --- |
| RC-001 | majeure | `CMD-111` ne retrouve pas la commande existante | la recherche `order` lit seulement `orders/{value}` et ne requete pas `orderNumber` | normaliser `CMD-*`, extraire le numero et effectuer une requete bornee/indexee | `CORRIGEE_LOCAL_A_REQUALIFIER` |
| RC-002 | majeure | webhook inbox traite absent d'une timeline comparee | la timeline ne lit pas directement `commerce_webhook_inbox`; le journal `business_events` historique est vide | projeter les webhooks de maniere durable ou lire une projection bornee dediee; ajouter un test historique | `CORRIGEE_LOCAL_A_REQUALIFIER` |
| RC-003 | moyenne | une erreur d'ecriture audit n'empecherait pas la consultation | `writeSecurityAudit` journalise l'erreur mais reste fail-open | rendre l'audit de lecture incident fail-closed ou definir une preuve durable equivalente avant reponse | `CORRIGEE_LOCAL_A_REQUALIFIER` |
| RC-004 | moyenne | recherche invalide absente des audits fonctionnels | normalisation executee avant l'ecriture d'audit | auditer les tentatives refusees avec type et valeur haches, sans conserver l'entree brute | `CORRIGEE_LOCAL_A_REQUALIFIER` |
| RC-005 | faible | plafond 100 non exerce sur donnees existantes | aucun aggregate ne depasse 31 evenements | fixture synthetique 101+ uniquement sous Emulator | `PROUVEE_D3_EMULATOR` |
| RC-006 | moyenne | premier appel froid proche de 8,6 s | Function Gen2 `minInstances: 0` et initialisation a froid | mesurer plusieurs appels froids avant toute decision; ameliorer le feedback UI ou la capacite seulement si seuil confirme | `A_MESURER` |
| RC-007 | majeure | le controle sandbox etait `v2_fixture` mais sans `fixtureScopeVersion`, et sa policy ne correspondait pas au seul scope actif | fenetre fixture historique restauree avec des references devenues absentes | reconfigurer le sandbox dans une passe dediee avec manifeste, puis verifier checkout et rollback | `CORRIGEE_D4_SANDBOX` |

Aucune correction n'etait implementee au moment de D0. D2 a reproduit
RC-001 a RC-004 en rouge, applique les corrections locales autorisees et passe
leurs tests au vert; aucun deploiement ou requalification sandbox n'a eu lieu.

## 14. Gate D1 - audit statique et conception des seams

Statut: `OK`

Date de cloture: 2026-08-24

Perimetre de preuve: code et tests locaux au commit `8ebe5e7`, sans execution
de test, serveur, navigateur, build, E2E ou acces cloud.

### 14.1 Cartographie reelle du checkout v2

```text
navigateur non fiable
  CheckoutView
  -> clientOrderId stable tant que l'intention d'achat ne change pas
  -> input allowliste sans prix ni total client
  -> createCheckoutV2 via Functions callable
     -> Firebase Auth obligatoire + App Check
     -> controle commerce serveur fail-closed
     -> transaction Firestore unique
        -> checkout identity = hash(ownerUid, clientOrderId)
        -> requestHash canonique de l'input normalise
        -> policy/livraison/compte Connect relus et epingles
        -> produits/prix/stock/inventoryVersion relus
        -> order + orderNumber + payment_attempt
        -> reservations quantitatives + mouvements hold
        -> promotion reservee, si presente
     -> saga PaymentIntent
        -> tentative create_pending -> create_inflight
        -> Stripe create avec une idempotency key derivee orderId/attemptId
        -> PI valide sur orderId/requestHash/montant/devise/Connect
        -> tentative attached + PI attache a la commande
     -> reponse client: orderId, clientSecret, montants serveur, Connect
  -> descriptor local UID/orderId/clientOrderId/cartLineId/cartRevision,
     sans clientSecret ni montant
  -> Stripe Payment Element / confirmPayment
  -> UI en attente; succes affiche seulement apres order.payment=succeeded

Stripe test
  -> webhook Platform ou Connect signe
  -> corps brut verifie puis eventId/payloadHash persistants
  -> commerce_webhook_inbox/{inboxId}
     received -> processing(leaseToken, processingUntil) -> processed
     ou failed(backoff) -> dead_letter
  -> worker relit le PaymentIntent/Refund autoritaire dans le compte epingle
  -> transaction Firestore fencee unique
     -> reducer monotone de commande
     -> reservation held -> committed ou released
     -> mouvement stock deterministe
     -> fait financier append-only + rollups total/jour
     -> recu sandbox immutable
     -> deux outboxes deterministes client/admin
     -> inbox processed dans la meme transaction
  -> commerce_outbox
     pending/failed -> processing(lease) -> sent
     ou dead_letter/delivery_unknown/suppressed_*

workers Gen2
  -> Scheduler fence 8 minutes, maxInstances=1, retryCount=0
  -> inbox/outbox/reservations: pages 25, quatre pages maximum
  -> outbox et expiration toutes les deux minutes
  -> reservation expiree: rapprochement/cancel Stripe provider-first,
     puis liberation idempotente seulement apres etat canceled
  -> reconciliation operations horaire
     -> rollups financiers + documents + incidents + health

observabilite et console
  -> six triggers business_events append-only et idempotents
     commande / finance / stock / incident / outbox / webhook
  -> getDiagnosticTimelineAdminGen2
     Auth admin + registre actif + AAL2 + App Check
  -> recherches bornees par order/payment/refund/e-mail/correlation
  -> fusion commande, tentative, refund, retour, document, fait,
     mouvement, outbox, incident et business_events
  -> tri chronologique, 100 evenements les plus recents, indicateur truncated
  -> AdminIncidentConsole, sans acces direct Firestore/Cloud Logging
```

Le navigateur ne confirme jamais un paiement depuis le seul retour de
`stripe.confirmPayment`. En v2, `CheckoutStripeModal` attend la projection
durable `payment.status=succeeded` par listener Firestore. Une erreur de ce
listener reste une confirmation en attente et n'est pas convertie en succes.

### 14.2 Identites, deduplication et correlations

| Identite | Construction et portee | Garantie |
| --- | --- | --- |
| `clientOrderId` | genere dans `CheckoutView`, conserve pendant les retries/reprises de la meme intention | une identite navigateur stable; un changement de panier/promotion admissible la renouvelle |
| checkout identity | SHA-256 de `ownerUid + clientOrderId` | une commande durable par intention et proprietaire; conflit si `requestHash` differe |
| `requestHash` | hash canonique de l'input checkout normalise et allowliste | prix, ordre des cles et champs libres du navigateur ne peuvent pas modifier l'identite serveur |
| `orderId` / `attemptId` | UUID serveur prefixes `ord_` / `att_` | identites durables de commande et tentative |
| `commandId` | UUID serveur pour le hold initial; fourni par le client pour les commandes metier puis associe a `payloadHash` | lookup du resultat avant `expectedVersion`; retry acquitte sans seconde transition |
| `stateVersion` / `expectedVersion` | entiers monotones sur commande, tentative, reservation et commandes admin | precondition optimiste; une version stale est refusee sauf retry deja acquitte |
| Stripe idempotency key | SHA-256 de `v1|payment_intent.create|orderId|attemptId`, prefixe `sv_checkout_v1_` | meme PaymentIntent apres timeout, crash ou resultat inconnu |
| `eventId` Stripe | identifiant fournisseur verifie | identite externe de livraison webhook |
| `inboxId` | SHA-256 de `scope|accountId|eventId` | dedup Platform/Connect; le meme ID avec un autre `payloadHash` est un conflit |
| `leaseToken` / fence inbox | UUID, lease 60 s, verification dans la transaction d'effet | un worker expire ne peut pas committer apres reprise par un autre |
| `effectId` stock | hash de `type|orderId|inventoryKey` | un seul hold/commit/release par effet et cle inventaire |
| `effectId` financier | hash de `financial|type|account|providerObjectId` | un fait capture/refund/reversal append-only par effet fournisseur |
| `outboxId` | hash de `effectId|template|recipientRole|email` | une intention par effet/template/destinataire; transmise comme cle d'idempotence provider |
| `eventId` metier | hash de `sourceRef|eventType|correlation/version` | projection `business_events` append-only avec `.create`, doublon ignore |
| `correlationId` | priorite `commandId`, `effectId`, event Stripe ou ID source | liaison console entre commande, finance, stock, e-mail et webhook sans payload personnel |
| `runId` fixture | format `run_*`, epingle au scope fixture et propage dans `testContext` | confinement, neutralisation e-mail et quarantaine run-scoped |
| `runId` worker | UUID du passage Scheduler | heartbeat technique sans identifiant commande ni donnee personnelle |
| fence Scheduler | lease documentee par scheduler, token UUID et compteur `fence` | zero chevauchement Gen1/Gen2 ou double invocation active |

### 14.3 Transactions, verrous, retries, timeouts et transitions

- La preparation checkout est une transaction Firestore unique. Elle relit
  d'abord identite, control, policy, scope fixture eventuel, compte Connect,
  produits, promotion et compteur de commande; elle ecrit ensuite commande,
  tentative, reservations, mouvements, promotion et identite. Un echec avant
  commit ne laisse ni commande ni hold.
- L'appel Stripe est deliberement hors transaction. Les fenetres entre effet
  Stripe et persistance sont fermees par la meme idempotency key et par les
  etats `create_inflight` / `create_unknown` / `attached`.
- `saveAttempt` exige identite Stripe/request/Connect identique et une seule
  progression de `stateVersion`; un PI different pour la meme commande est un
  conflit explicite.
- L'inbox persiste avant traitement. Claim, application des effets et passage
  `processed` sont fences; l'effet et l'acquittement inbox partagent la meme
  transaction Firestore.
- Le reducer paiement est monotone. Les statuts Stripe non terminaux gardent le
  hold; un statut inconnu, `requires_capture`, un orphan ou un conflit terminal
  cree un incident et/ou `needs_review`, sans compensation speculative.
- Capture, mouvements `commit`, fait financier, rollups, recu, promotions et
  deux outboxes sont ecrits atomiquement. Un refund ne restocke jamais.
- Inbox et outbox utilisent une lease de 60 secondes, huit tentatives au plus
  et un backoff exponentiel plafonne a une heure. Une erreur e-mail non
  reprenable devient `dead_letter` immediat; une acceptation Gmail ambigue
  devient `delivery_unknown` sans retry automatique.
- Les sweepers sont bornes a 25 elements par page et quatre pages. Un run avec
  echec ou curseur restant est `incomplete` et fait echouer le Scheduler au
  lieu de produire un faux vert.
- Les owners Scheduler Gen2 ont `retryCount: 0`, concurrence/max instance 1 et
  une fence Firestore de huit minutes. Outbox et expirations tournent toutes
  les deux minutes; la reconciliation operations toutes les 60 minutes.
- Les callables checkout Gen2 ont un timeout de 60 secondes. L'attente UI de
  confirmation durable est bornee a 45 secondes; son expiration affiche un
  etat encore en verification, jamais un succes.
- La reprise recharge la commande et la tentative sous UID proprietaire,
  refuse les terminaux `paid`, `expired` et `canceled`, puis reutilise le meme
  PaymentIntent. Le recapitulatif vient des lignes immuables de la commande.

### 14.4 Couverture R00-R19 et seams recommandes

`Couvert` signifie qu'un test local actuel prouve l'invariant principal. Il ne
signifie pas que la preuve correspondante est deja qualifiee dans la console.

| ID | Couverture actuelle et preuves | Seam D2/D3 recommande | Preuve attendue dans Incidents |
| --- | --- | --- | --- |
| R00 | `PARTIELLEMENT_COUVERT`: create/settlement nominal Emulator, reducer, UI durable; aucune qualification comportementale complete de la console | runner pur puis fixture Emulator composee | creation, hold, tentative, webhook processed, commit, capture, recu et deux outboxes, ordre chronologique, recovery `safe` |
| R01 | `NON_COUVERT`: aucun test hors-ligne avant callable | interception reseau navigateur avant `createCheckoutV2`; aucune reponse serveur simulee | zero match/commande pour le `clientOrderId`; aucune fausse timeline |
| R02 | `COUVERT`: checkout atomique/idempotent Emulator, crash apres hold, retry meme commande | mock callable qui perd la reponse, puis repository Emulator avec meme input | une commande, une tentative et un hold; retry correle, aucun doublon |
| R03 | `PARTIELLEMENT_COUVERT`: concurrence stock et identite backend; pas de double clic navigateur | deux appels concurrents sur le meme mock/adaptateur, puis Emulator | un seul orderId/effect; si le doublon est journalise, correlation identique et aucun second mouvement |
| R04 | `PARTIELLEMENT_COUVERT`: descriptor reload/multi-onglet et resume serveur; confirmation Stripe non composee | navigateur local avec storage reel et adaptateurs checkout/etat commande | point d'arret `attached`/`processing`, reprise sur meme order/PI, puis convergence ou attente explicite |
| R05 | `COUVERT`: reponse Stripe perdue, crash avant attach/apres attach, meme cle et un PI dans les tests saga | adaptateur Stripe deterministe existant; aucun reseau | tentative `create_unknown` puis `attached`, meme correlation; jamais deux PI |
| R06 | `COUVERT_D3`: rollback transactionnel avant persist rejoue avec fixture `runId` et nettoyage prouve | failpoint repository dans transaction Emulator | aucun order/hold/mouvement/PI; echec explicite sans incident financier |
| R07 | `PARTIELLEMENT_COUVERT`: fenetres apres reponse Stripe couvertes par mocks, pas par Stripe test | adaptateur Stripe + failpoint avant attach/persist; L4 ulterieur seulement sur autorisation | etat indetermine visible, tentative reprise avec meme PI, ou `needs_review` si mismatch |
| R08 | `COUVERT_D3`: deux persistences concurrentes du meme event reutilisent une inbox et produisent un fait unique | runner ingress puis Emulator sur le meme event deux fois | reception/processed uniques ou doublon neutralise, un seul fait/mouvement/outbox |
| R09 | `COUVERT_D3`: deux inbox distinctes sont appliquees en ordre `succeeded` puis `processing`; la commande ne regresse pas | runner de permutations puis deux inbox Emulator en ordre inverse | ordre d'arrivee distinct de la decision metier; aucun recul apres `succeeded` |
| R10 | `PARTIELLEMENT_COUVERT`: UI attend 45 s, hold non terminal, sweeper retry; pas de delai compose | horloge/adaptateur worker + interception navigateur de la projection commande | `processing`/attente, inbox due/failed puis processed, convergence sans succes precoce |
| R11 | `COUVERT`: crash apres claim/retrieve, avant commit/apres commit, expiry lease et fencing Emulator | failpoints inbox existants sous Emulator | tentative 1 interrompue, lease reprise, tentative suivante, un effet final unique |
| R12 | `COUVERT`: failed, dead-letter, delivery_unknown, sent et fixture suppressed testes | mock adaptateur e-mail/outbox worker; jamais de provider | paiement reste succeeded; e-mail failed/dead_letter/delivery_unknown avec attemptCount et recovery bloque si ambigu |
| R13 | `COUVERT`: race annulation/paiement, expiry provider-first et release unique | horloge controlee + saga pure, puis Emulator | arbitrage paid ou canceled, mouvements commit/release exclusifs et ordre explicite |
| R14 | `NON_COUVERT`: autorisations transport testees, pas expiration pendant resume/re-auth | interception callable `unauthenticated`/App Check puis mock de reauth et retry meme descriptor | refus sans lecture metier, puis reprise meme order; aucune nouvelle commande |
| R15 | `COUVERT_D3`: deux holds concurrents sur stock 1 donnent exactement un gagnant et un refus, puis nettoyage | Emulator avec deux UID et deux `clientOrderId` | gagnant avec hold; perdant refuse sans stock negatif ni mouvement orphelin |
| R16 | `NON_COUVERT`: timeouts du runner anti-faux-vert seulement, pas le comportement checkout 503/lent | interception reseau navigateur 503 puis delai, horloge fake et retry manuel borne | erreur/latence puis reprise meme `clientOrderId`; aucune duplication; cold start mesure separement |
| R17 | `COUVERT_D3`: 101 evenements commande et une outbox sont composes dans Firestore Emulator; la reponse contient 100 evenements et `truncated=true` | fake Firestore deterministe en D2 puis fixture 101+ en Emulator D3 | exactement 100 plus recents, ordre stable et indicateur `truncated=true` visible |
| R18 | `COUVERT`: mauvais secret/scope refuse dans les tests ingress et contrat signature | runner pur du handler/ingress avec corps signe invalide | aucune mutation/timeline commande; log/audit technique expurge, aucun secret |
| R19 | `PARTIELLEMENT_COUVERT`: baseline L3 refuse client et AAL1; contrats Auth/App Check statiques | conserver L3 read-only pour la preuve transport; unit test de l'autorisation en D2 si seam injectable | refus avant requetes metier, audit hashe sans valeur de recherche ni donnee commande |

Les scenarios qui necessitent encore une preuve sandbox pour leur semantique
fournisseur reelle sont R05, R07, R10 et R18; cette limite n'empeche pas D2 et
D3 de prouver localement leurs invariants. Aucun scenario D1 n'autorise L4.

### 14.5 Choix des seams

Ordre retenu:

1. **Runner pur** pour reducer, idempotence, permutations, horloge, leases,
   backoff, timeouts et evaluation console.
2. **Mocks/adaptateurs injectes** pour Stripe, e-mail, callable checkout,
   lecture de commande et Auth/App Check. Les factories runtime acceptent deja
   `stripe`, `clock`, `ids`, `repository` et `failpoints` sans configuration
   globale.
3. **Interception reseau navigateur** uniquement pour R01, R02, R04, R14 et
   R16, aux frontieres callable/projection; aucun appel externe ne doit sortir.
4. **Emulator Suite** pour transactions, concurrence, rollback, leases,
   fencing, troncature et composition multi-collections.
5. **Failpoint serveur** non retenu pour D2/D3. Il ne sera reconsidere en D4
   que si Stripe test ne permet pas de placer deterministement la panne depuis
   le runner ou l'adaptateur.

Le module `domain/failpoints.js` actuel est une dependance en memoire: le
runtime executable passe `null` par defaut, aucun handler ne lit un profil dans
le payload, aucune variable d'environnement ne l'active et aucun
`NEXT_PUBLIC_*` ne le reference. Les tests l'injectent directement dans les
factories.

### 14.6 Protections contre une activation hors test/sandbox

Protections obligatoires D2/D3:

- harnais et profils uniquement sous `tests/commerce/resilience/` ou helpers
  de tests, jamais importes par `functions/index.js`, `v2Checkout.js`,
  `v2Webhooks.js`, `gen2G9.js` ou le bundle Next;
- garde reseau existante `tests/commerce/helpers/no-network.cjs` pour L0/L1;
- Emulator uniquement avec projet `demo-*`, sans credential Firebase/Google,
  via le wrapper commerce existant;
- aucun champ `failpoint`, `fault`, `profile`, `seed` ou `runId` de resilience
  ajoute au contrat public checkout; le `runId` fixture existant reste reserve
  au scope backend allowliste;
- aucun `NEXT_PUBLIC_*`, query string, localStorage, header libre ou valeur de
  formulaire ne selectionne une panne;
- seed et horloge injectees par le runner, rapportees sans payload metier;
- toute suite echoue si un appel reseau, un scenario saute, un timeout ou un
  manifeste incomplet est observe.

Si un failpoint serveur devenait indispensable en D4, une decision distincte
devrait exiger simultanement: projet exact `secondevienextjsssr`, environnement
Stripe test verifie cote serveur, service/revision allowlistes, configuration
serveur non publique absente par defaut, profil enumere, `runId` manifeste,
expiration absolue courte, compteur maximal d'activations, admin fort AAL2,
audit technique sans payload, desactivation en `finally`, deploy cible et test
prouvant le refus lorsque l'un de ces gardes manque. Aucun de ces mecanismes
n'est implemente en D1.

### 14.7 Liste exacte des tests D2 a construire

Fichiers futurs autorises en D2, sans modifier le code applicatif tant qu'un
seam existant suffit:

`tests/commerce/resilience/checkout-boundaries.test.cjs`

1. `R00 nominal local conserve une commande, un PI logique et un settlement`;
2. `R01 offline avant callable ne cree aucun effet et conserve l'intention`;
3. `R02 reponse callable perdue reprend le meme clientOrderId et orderId`;
4. `R03 deux soumissions concurrentes retournent un seul resultat durable`;
5. `R05 timeout Stripe reutilise exactement la meme idempotency key`;
6. `R07 effet Stripe acquis puis persistance interrompue converge ou needs_review`;
7. `R09 toutes les permutations non terminales puis succeeded restent monotones`;
8. `R10 webhook retarde garde processing puis converge apres retry`;
9. `R13 expiration et succeeded concurrents produisent commit XOR release`;
10. `R16 503 puis retry manuel garde la meme intention et un backoff borne`.

`tests/commerce/resilience/worker-outbox.test.cjs`

11. `R08 livraison webhook dupliquee ne produit qu'un effet`;
12. `R11 interruption apres claim perd la fence et le successeur commit une fois`;
13. `R11 interruption apres commit rend le retry sans effet supplementaire`;
14. `R12 echec retryable e-mail devient failed sans inverser le paiement`;
15. `R12 echec non retryable devient dead_letter a la premiere tentative`;
16. `R12 accuse Gmail ambigu devient delivery_unknown sans nouvel envoi`;
17. `R18 signature invalide est rejetee avant persist et sans payload sensible`.

`tests/commerce/resilience/incident-console.test.cjs`

18. `R00 timeline fusionne et ordonne toutes les familles checkout attendues`;
19. `R05 create_unknown puis attached partage la correlation de tentative`;
20. `R08 webhook received puis processed est visible sans doublon de source`;
21. `R09 ordre arrivee webhook ne fait pas regresser le verdict de reprise`;
22. `R11 retry worker expose attemptCount et resultat final`;
23. `R12 dead_letter et delivery_unknown bloquent le verdict de reprise`;
24. `R17 101 evenements retourne les 100 plus recents et truncated true`;
25. `console ne retourne jamais e-mail adresse telephone IP token secret ou payload outbox`;
26. `recherche correlation reste bornee a dix commandes et cent evenements`;
27. `echec audit de consultation ne retourne aucune timeline` — test rouge
    attendu tant que RC-003 n'est pas corrige, sans correction pendant D2;
28. `recherche CMD par orderNumber retrouve la commande` — test rouge attendu
    tant que RC-001 n'est pas corrige;
29. `webhook historique traite apparait dans la timeline` — test rouge attendu
    tant que RC-002 n'est pas corrige;
30. `recherche invalide produit un audit hashe` — test rouge attendu tant que
    RC-004 n'est pas corrige.

`tests/commerce/browser/checkout-resilience.spec.mjs`

31. `R02 perte de reponse create puis reload reprend le meme descriptor`;
32. `R03 double clic ne lance pas deux intentions client`;
33. `R04 reload pendant confirmation reprend les lignes immuables commande`;
34. `R10 timeout confirmation affiche verification en cours jamais succes`;
35. `R14 Auth ou App Check expire puis reauth reprend la meme commande`;
36. `R16 callable lent ou 503 conserve une reprise explicite sans boucle`.

Les tests navigateur D2 utiliseront une page/harness locale et des routes
interceptees; ils ne lanceront ni site complet, ni Firebase reel, ni Stripe,
ni provider e-mail. R06 et R15 restent deja prouves par Emulator et seront
rejoues/composes en D3 plutot que dupliques artificiellement en D2.

### 14.8 Preuves console minimales communes

Pour chaque scenario qui atteint une commande, la preuve future devra montrer:

- identifiant commande technique tronque dans le rapport, jamais les donnees
  client completes;
- etat commande, paiement, fulfillment, refund et `stateVersion` finals;
- timeline chronologique et `truncated` explicite;
- correlation de la tentative, du webhook, des mouvements, du fait et des
  outboxes sans exposer de payload;
- nombre exact de holds/commit/release, faits et outboxes;
- statut/attemptCount inbox et outbox lorsque la panne les concerne;
- verdict `safe`, `review` ou `blocked` et raisons compatibles avec les etats
  autoritaires;
- absence d'e-mail, adresse, telephone, IP, token, secret, clientSecret et
  corps webhook complet.

### 14.9 Inconnues et blocages constates

Constats D1 et resolution observee pendant D2/D3:

- RC-001 a RC-004 ont ete reproduits en rouge puis corriges et requalifies
  localement en D2; la console refuse maintenant la timeline si son audit
  echoue et les recherches invalides restent auditees sans valeur brute;
- `buildOrderDiagnostic` relit maintenant les inbox historiques par identite
  provider autoritaire, avec limites strictes et sans payload; RC-002 est
  requalifie localement;
- le plafond 100, seulement statique en D1, passe avec 101 evenements sur fake
  Firestore D2 puis Firestore Emulator D3; RC-005 est ferme localement;
- Les timestamps de plusieurs sous-collections sont tries seulement apres
  fusion; l'ordre stable en cas de timestamps identiques n'est pas defini par
  un tie-breaker explicite.
- Le client v2 n'a pas de retry automatique du callable create sur 503; la
  reprise repose sur un retry utilisateur avec le meme `clientOrderId`. D2 a
  verifie ce contrat sans introduire de boucle automatique.
- Les garanties Stripe sur erreur reseau de bas niveau, livraison webhook et
  idempotence provider ne sont prouvables completement qu'en L4 Stripe test;
  D1 n'autorise ni appel ni paiement.
- L'Emulator ne prouve ni IAM, App Check reel, index deploye, cold start, Stripe
  Connect ni contention hebergee. Apres D3, ces limites restent reservees a
  D4 ou a une mesure hebergee ulterieure explicitement autorisee.
- La preuve R19 L3 existe dans la baseline et l'echec fail-closed de l'audit
  est maintenant requalifie localement; le transport sandbox reste hors D3.
- RC-006 reste la seule lacune de cette serie non mesuree: le cold start exige
  un environnement heberge et une autorisation ulterieure.

### 14.10 Journal D1

Fichiers et zones lus integralement avant audit:

- `AGENTS.md`, `map.md`;
- ce document;
- `COMMERCE_SYNTHESE.md`, `COMMERCE_STRIPE.md`;
- `BACKOFFICE.md`, `DONNEES_ANALYTICS.md`, `AUDIT_COUTS_FIRESTORE.md`;
- `AUTHENTIFICATION.md`, `SECURITE_GLOBALE.md`;
- `QUALITE_TESTS.md`, `EXPLOITATION.md`.

Code executable inspecte:

- client: `CheckoutView.jsx`, `CheckoutStripeModal.jsx`,
  `CheckoutPaymentStep.jsx`, `checkoutController.js`, `checkoutRecovery.js`,
  `checkoutContract.js`, `commerceV2Client.js`, `orderAdapter.js`;
- checkout/runtime: `v2Checkout.js`, `v2Webhooks.js`, `v2Operations.js`,
  `v2ReservationExpiry.js`, `gen2G9.js`, `domain/v2Runtime.js`;
- domaine: `checkoutRepository.js`, `checkoutCoordinator.js`,
  `checkoutSaga.js`, `checkoutSagaService.js`, `checkoutSagaRepository.js`,
  `idempotency.js`, `failpoints.js`, `reservationRepository.js`,
  `stripeWebhookIngress.js`, `webhookInbox.js`,
  `webhookInboxRepository.js`, `webhookWorker.js`, `reconcilePayment.js`,
  `paymentEffectApplier.js`, `commerceEffects.js`, `financialRollup.js`,
  `outboxRepository.js`, `outboxWorker.js`, `firestoreWorkerQueries.js`,
  `boundedWorkerSweeper.js`, `reservationExpiryWorker.js`,
  `workerRunHealth.js`, `schedulerFence.js`, `operationsHealth.js`;
- observabilite/admin: `businessEvents.js`, `diagnosticTimeline.js`,
  `AdminIncidentConsole.jsx`;
- tests/manifeste: `tests/commerce/faults/*.cjs`,
  `tests/commerce/suites/firebase-domain.cjs`,
  `tests/commerce/domain/order-state.test.cjs`,
  `gate5-consumers.test.cjs`, `gate7a-operations.test.cjs`,
  `property.test.cjs`, `tests/commerce/browser/gate5-browser.spec.mjs`,
  `tests/commerce/manifest.json`, `tests/observability-contract.test.cjs`,
  `tests/security-hardening.test.mjs`, `package.json`.

Validations D1 executees avant edition: verification read-only de la branche,
du HEAD, du checkpoint, du tag et du worktree; recherches `rg` sur fichiers,
identites, failpoints, transactions, tests et appelants. Aucune suite n'a ete
lancee conformement aux interdictions D1.

Conclusion D1: les seams locaux necessaires existent deja et sont inactifs par
defaut. D2 peut rester entierement local, deterministe et sans failpoint
serveur. Gate D1 = `OK`.

## 15. Gate D2 - tests deterministes locaux

Statut: `OK`

Date d'execution: 2026-08-24

Perimetre execute: runners Node sous garde anti-reseau et harness Playwright
local sur `127.0.0.1`. Aucun Emulator, Firebase reel, Stripe, provider e-mail,
donnee metier ou cloud n'a ete utilise.

### 15.1 Tests construits et resultats

Les 36 tests prevus en section 14.7 existent maintenant dans:

- `tests/commerce/resilience/checkout-boundaries.test.cjs`: 10/10 passes;
- `tests/commerce/resilience/worker-outbox.test.cjs`: 7/7 passes;
- `tests/commerce/resilience/incident-console.test.cjs`: 13/13 passes apres
  reproduction rouge et correction autorisee des cinq lacunes;
- `tests/commerce/browser/checkout-resilience.spec.mjs`: 6/6 passes sur le
  projet Playwright `desktop` et un serveur local ephemere.

Bilan D2 final: 36/36 passes, zero `TODO` et zero echec inattendu. RC-001 a
RC-004 et `D2-GAP-001` ont d'abord ete prouves en rouge, puis corriges apres
autorisation explicite. Le premier run a aussi detecte une fixture R09
incomplete qui omettait montant/devise sur `payment_succeeded`; seule cette
fixture a ete corrigee, puis R09 a passe contre le reducer executable.

Regression ciblee: 75/75 tests existants passent sur faults, consommateurs
checkout, proprietes et contrat d'observabilite; 33/33 tests securite/Auth
cibles passent. ESLint passe sans warning sur les fichiers modifies.

Un premier passage a utilise Node `v26.7.0`. L'integralite de D2, ESLint et des
75 regressions ciblees a ensuite ete rejouee avec Node `v22.23.2` et pnpm
`11.7.0`, conformement a la baseline du depot, avec des resultats identiques.

### 15.2 Couverture observee R00-R19

| ID | Resultat D2 | Limite restante |
| --- | --- | --- |
| R00 | `OK_LOCAL` | aucune semantique provider reelle |
| R01 | `OK_LOCAL` | harness de frontiere, pas le site complet |
| R02 | `OK_LOCAL` Node + navigateur | aucune latence hebergee |
| R03 | `OK_LOCAL` Node + navigateur | concurrence Firestore reservee a D3 |
| R04 | `OK_LOCAL` navigateur | Stripe test non utilise |
| R05 | `OK_LOCAL` saga + console | erreur reseau provider reelle reservee a D4 |
| R06 | `HORS_D2` | rollback transactionnel Emulator reserve a D3 |
| R07 | `OK_LOCAL` | fenetre Stripe test reservee a D4 |
| R08 | `OK_LOCAL` ingress + worker + console | composition transactionnelle Emulator reservee a D3 |
| R09 | `OK_LOCAL` permutations reducer + console | desordre de deux inbox Firestore reserve a D3 |
| R10 | `OK_LOCAL` horloge + navigateur | delai webhook heberge reserve a D4 |
| R11 | `OK_LOCAL` | `attemptCount` projete et affiche; lease Firestore reservee a D3 |
| R12 | `OK_LOCAL` | aucun provider e-mail contacte |
| R13 | `OK_LOCAL` | concurrence transactionnelle reservee a D3 |
| R14 | `OK_LOCAL` navigateur | Auth/App Check reels non utilises |
| R15 | `HORS_D2` | concurrence stock Emulator reservee a D3 |
| R16 | `OK_LOCAL` Node + navigateur | cold start heberge non mesure |
| R17 | `OK_LOCAL` | 101 evenements sur fake Firestore; Emulator reserve a D3 |
| R18 | `OK_LOCAL` | signature Stripe test reelle reservee a D4 |
| R19 | `OK_LOCAL` | L3 deja prouve; audit fail-closed local, transport sandbox a requalifier |

### 15.3 Corrections fermees localement et limites suivantes

- RC-001: `CMD-<numero>` est converti en entier sur une expression stricte,
  puis recherche par `orderNumber` avec une limite de deux resultats;
- RC-002: les inbox historiques sont relues par au plus dix `objectId`
  autoritaires issus du PaymentIntent et des faits financiers, vingt documents
  par objet et cinquante au total; aucun payload webhook n'est renvoye;
- RC-003: `writeSecurityAudit` retourne maintenant son resultat et la timeline
  refuse toute reponse lorsque l'audit de consultation echoue;
- RC-004: une recherche invalide produit, apres autorisation admin, un audit de
  type et valeur haches avant de renvoyer l'erreur, sans lecture metier;
- `D2-GAP-001`: `attemptCount` borne est projete depuis tentative, inbox,
  outbox ou `business_event`, puis affiche dans la console.

RC-005 a ensuite ete requalifie sur Firestore Emulator avec 101 evenements;
voir section 16. RC-006 est une mesure de cold start heberge et reste reservee
a une gate ulterieure autorisee. Le replay Node 22 est ferme.

### 15.4 Commandes executees

```bash
export PATH="/Users/matthis/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm run test:commerce:faults
pnpm run test:commerce:ui
pnpm run test:commerce:property
node --require ./tests/commerce/helpers/no-network.cjs --test tests/observability-contract.test.cjs
node --require ./tests/commerce/helpers/no-network.cjs --test tests/commerce/resilience/checkout-boundaries.test.cjs tests/commerce/resilience/worker-outbox.test.cjs tests/commerce/resilience/incident-console.test.cjs
pnpm exec playwright test tests/commerce/browser/checkout-resilience.spec.mjs --project=desktop
pnpm exec eslint tests/commerce/resilience/checkout-boundaries.test.cjs tests/commerce/resilience/worker-outbox.test.cjs tests/commerce/resilience/incident-console.test.cjs tests/commerce/browser/checkout-resilience.spec.mjs --max-warnings 0
node --test tests/security-hardening.test.mjs tests/auth-assurance.test.cjs tests/auth-admin-revocation.test.cjs
pnpm run lint
```

## 16. Gate D3 - Emulator Suite

Statut: `OK`

Date d'execution: 2026-08-24

Perimetre execute: Firestore Emulator local sur le projet force
`demo-secondevie-commerce`, port `127.0.0.1:8185`, sans credential cloud. Le
wrapper refuse un projet non `demo-*`, un port different, un credential
Firebase/Google et tout telechargement d'emulateur absent du cache.

### 16.1 Suite et preuves

La suite durable `resilience-emulator`, declaree dans
`tests/commerce/manifest.json`, execute six scenarios isoles dans six workers:

1. R06: failpoint avant persistance, rollback sans resultat partiel;
2. R15: deux holds concurrents sur stock 1, un gagnant et un refus;
3. R08: deux livraisons du meme webhook, une inbox et un fait financier;
4. R09: deux inbox distinctes appliquees en ordre inverse, `succeeded` puis
   `processing`, sans regression de l'etat `paid`;
5. R17: 101 evenements commande et une outbox, reponse bornee a 100 avec
   `truncated=true` et `attemptCount` conserve;
6. confinement: deux fixtures `runId` supprimees puis collection locale vide.

Chaque scenario utilise un `runId` au format `run_d3_*`, propage
`testContext.runId`, enregistre les references creees, les supprime avant le
teardown et verifie leur absence. `clearFirestore()` reste un second filet dans
le `finally`, pas la preuve principale de nettoyage.

Resultat Node `22.23.2`, pnpm `11.7.0`, Java Temurin 21: 6/6 scenarios, 28
assertions, aucun skip, TODO, timeout ou echec. Rapport machine ignore:
`test-results/commerce/resilience-emulator.json`.

La regression historique `firebase-domain` a d'abord revele que son fixture
checkout ne creait pas `sys_counters/orders` depuis l'ajout du numero de
commande. Seul `seedGate3Checkout` a ete complete par `nextOrderNumber: 1`.
Apres cette correction de fixture, la suite historique passe 20/20 avec 114
assertions. Les 30 tests Node D2 et les 13 contrats du runner passent aussi
43/43; ESLint cible passe sans warning.

Un premier run D3 vert a ete observe sous Node 26 avant le replay complet sous
Node 22. Le verdict D3 repose uniquement sur le replay Node 22. Aucun appel
Stripe, e-mail, Firebase reel, sandbox ou cloud n'a eu lieu. Aucun paiement,
remboursement, message, donnee metier ou deploiement n'a ete cree.

### 16.2 Limites et prochaine decision

RC-005 est ferme localement par la preuve Emulator. RC-006 reste non mesure:
un cold start heberge ne peut pas etre prouve en L2. L'Emulator ne qualifie pas
IAM, App Check reel, index deployes, Stripe test, contention hebergee ni Cloud
Logging. D4 a ensuite ete autorisee et executee partiellement; voir section 17.

### 16.3 Commandes executees

```bash
export PATH="/Users/matthis/.nvm/versions/node/v22.23.2/bin:$PATH"
pnpm run test:commerce:resilience:emulator
pnpm run test:commerce:firebase
pnpm exec eslint tests/commerce/suites/resilience-emulator.cjs tests/commerce/run-rules-containment.cjs --max-warnings 0
node --test tests/commerce/runner-self-test.cjs tests/commerce/resilience/checkout-boundaries.test.cjs tests/commerce/resilience/worker-outbox.test.cjs tests/commerce/resilience/incident-console.test.cjs
```

## 17. Gate D4 - game day sandbox

Statut: `OK`

Date d'execution: 2026-08-24, de `18:16:04Z` a `18:17:12Z`.

Autorisation: message utilisateur explicite pour D4 puis autorisation
explicite de bascule cloud temporaire et rollback. Aucun deploiement n'a ete
necessaire ou execute.

### 17.1 Manifeste et rayon d'impact

- projet exact `secondevienextjsssr`, environnement sandbox;
- Stripe `sk_test_*` et compte Connect `livemode=false`, charges actives;
- App Hosting HTTP 200 et operations commerce `healthy` avant ouverture;
- un seul produit `e2eOnly` existant, publie, stock initial 10;
- deux sous-runs `run_d4_*`, deux PaymentIntents au maximum;
- budget realise: un PI annule provider-first, un PI paye, zero refund;
- outbox fixture obligatoire, deux intentions finales `suppressed_test`, zero
  appel provider e-mail;
- rapport machine ignore:
  `logs/commerce/resilience/run_d4_1787595364997.json`, run hash
  `6d9be04ee9e6`.

Le preflight a detecte RC-007: le controle etait deja `v2_fixture`, mais ses
references fixture etaient absentes ou decalees du seul scope actif. La
fenetre D4 a donc epingle temporairement le scope actif a la revision 73. Le
rollback a restaure le mode, la policy et les champs originaux a la revision
74. La contre-verification a trouve deux champs auparavant absents restaures a
`null`; ils ont ete supprimes sous precondition a la revision 75. La forme
initiale est restauree. RC-007 reste volontairement non corrigee: la campagne
n'avait pas autorite pour transformer le rollback en reconfiguration durable.

### 17.2 Resultats des scenarios

| Scenario | Verdict | Preuve sandbox |
| --- | --- | --- |
| R00 nominal | `OK_D4` | paiement `succeeded`, commande durable `paid`, stock `committed`, 1 fait, 1 mouvement commit, 1 inbox processed, 2 outboxes; console diagnostic: 1 match |
| R05 reponse create perdue | `OK_D4` | commande/PI durables avant consommation de la reponse, retry meme orderId et meme PI, puis annulation provider-first; decouverte 5,836 s |
| R07 echec Firestore apres effet Stripe | `NON_EXECUTE` | aucun seam externe ne place cette coupure sans failpoint serveur deploye |
| R10 webhook retarde | `PARTIEL` | livraison Stripe reelle puis etat durable en 1,229 s; aucun retard injecte car desactiver l'endpoint partage depassait le rayon autorise |
| R18 signature invalide | `OK_D4` | HTTP 400 et zero document inbox pour l'event invalide |

La console Admin n'a pas ete pilotee visuellement: son callable AAL2/App Check
a retourne exactement une timeline pour la commande nominale. Firestore,
Stripe test et la projection console concordent. Les 32 entrees Cloud Logging
bornees couvrent create checkout, webhook, diagnostic, outbox et cleanup;
zero severite `ERROR` ou superieure et aucune troncature.

### 17.3 Nettoyage et etat final

- commande R05: `canceled`, PI `canceled`, zero fait, zero hold, zero refund;
- commande R00: paiement/PI `succeeded`, un fait, zero hold, zero refund;
- deux outboxes R00 `suppressed_test`; preuve structurelle de zero envoi;
- cleanup officiel execute en dry-run puis commit pour les deux runId:
  10 preuves protegees preservees, 3 auxiliaires quarantaines, zero delete;
- controle restaure en `v2_fixture`, revision 75, champs fixture initialement
  absents de nouveau absents;
- aucun secret, token ou identifiant complet inscrit dans le document.

### 17.4 Limites observees apres le premier run

Le premier run restait `PARTIEL`: R07 exigeait un point de coupure apres effet
Stripe et R10 un retard de livraison isole. Une autorisation ulterieure a
permis de fermer ces deux limites sans deployer de failpoint serveur; voir
section 17.5. RC-006 reste une mesure de cold start separee.

Commande qualifiante:

```bash
export PATH="/Users/matthis/.nvm/versions/node/v22.23.2/bin:$PATH"
node scripts/with-env.mjs .env.sandbox node scripts/checkout-resilience-game-day-d4.mjs --project=secondevienextjsssr --env=sandbox --commit=true --confirm=RUN_D4_secondevienextjsssr --max-payment-intents=2
```

### 17.5 Closeout R07/R10 et RC-007

Autorisation utilisateur explicite recue apres le run partiel. Le closeout
`2d209b1a854c`, execute de `18:46:47Z` a `18:49:11Z`, a conserve le meme
budget: deux PI test maximum, zero refund et zero e-mail.

- RC-007: le controle est durablement aligne a la revision 76 sur le scope
  actif et sa policy, en `v2_fixture`, `read_only` et paiement offline `off`;
- R07: le failpoint memoire existant
  `create.after_stripe_response_before_attach` a ete injecte uniquement par le
  runner local. Il n'existe aucun parametre public, variable d'environnement,
  callable ou code deploye permettant son activation. Une commande et une
  tentative ont survecu a la coupure; le retry a retrouve le meme PI par la
  meme cle Stripe, puis l'ordre a ete annule provider-first;
- R10: l'unique endpoint Connect Stripe test a ete desactive exactement 5 s
  via l'API Stripe officielle. Pendant la pause, le PI etait `succeeded` mais
  la commande restait `awaiting_method`, sans faux succes. L'endpoint a ete
  reactive avant une livraison signee; la commande est devenue durable en
  136 ms, avec stock commit;
- restauration: endpoint Connect `enabled`, `livemode=false`, controle
  revision 76 aligne, operations `healthy`;
- donnees: commande R07 et PI `canceled`; commande R10 et PI `succeeded`; zero
  hold et zero refund; deux outboxes R10 `suppressed_test`;
- console: un match AAL2/App Check pour R10;
- cleanup: dry-run puis commit, 10 preuves preservees, 3 auxiliaires
  quarantaines, zero delete;
- logs: 24 entrees bornees sur webhook, diagnostic, outbox et cleanup, zero
  severite `ERROR` ou superieure, aucune troncature.

Rapport machine ignore:
`logs/commerce/resilience/run_d4_close_1787597207225.json`. Le closeout a
utilise `scripts/checkout-resilience-game-day-d4-close.mjs`; aucune Function,
revision App Hosting ou configuration de production n'a ete deployee.

Gate D4 finale = `OK`. RC-006 reste hors de cette gate: elle demande une
campagne de mesures froides distincte, pas une injection de panne checkout.

## 18. Journal des changements

| Date | SHA | Changement | Validation | Deploiement |
| --- | --- | --- | --- | --- |
| 2026-08-24 | `53aa224` | checkpoint avant campagne; console/observabilite existantes | lint 0 erreur; 17 tests cibles; secret scan et diff-check propres | non |
| 2026-08-24 | commit D0, voir historique Git | creation du plan et branche `codex/checkout-resilience-lab` | liens et diff documentaire a verifier | non |
| 2026-08-24 | ce commit D1 | cartographie checkout, couverture R00-R19 et seams D2/D3 | audit statique, references, secret scan et diff-check | non |
| 2026-08-24 | worktree D2 non commite | 36 tests locaux, reproduction rouge puis corrections RC-001 a RC-004/D2-GAP-001 | 36 passes D2, 75 regressions, 33 securite/Auth, ESLint | non |
| 2026-08-24 | worktree D3 non commite | suite Emulator `runId`, concurrence, doublon, desordre, troncature et nettoyage; fixture compteur historique completee | D3 6/6 et 28 assertions; firebase-domain 20/20 et 114 assertions; Node/runner 43/43; ESLint | non |
| 2026-08-24 | worktree D4 non commite | runner game day fail-closed, 2 PI test max, outbox neutralisee, cleanup et rollback | R00/R05/R18 OK; R10 partiel; R07 non execute; 32 logs bornes sans erreur | aucune revision deployee |
| 2026-08-24 | worktree D4 close non commite | failpoint runner R07, pause endpoint test R10, correction RC-007 | R07/R10 OK; endpoint restaure; controle 76; 24 logs sans erreur | aucune revision deployee |

Chaque futur changement de code obtient une ligne distincte avec les tests et
le statut du deploiement. Ne jamais regrouper plusieurs injections sans raison.

## 19. Journal d'execution

| Run ID | Scenario | SHA/revision | Resultat | Preuves | Anomalies | Nettoyage |
| --- | --- | --- | --- | --- | --- | --- |
| PRE-INCIDENTS-20260824 | baseline console read-only | `53aa224` / sandbox courant | `PARTIEL` | section 12 | RC-001 a RC-006 | aucun |
| D2-LOCAL-20260824 | runners purs et navigateur local | `8631e28` + worktree D2 | `OK`: 36/36 passes apres corrections | section 15 | RC-005 requalifiee ensuite en D3; RC-006 a mesurer ulterieurement | serveur local ferme; aucune donnee |
| D3-EMU-20260824 | Firestore Emulator local, six workers `run_d3_*` | `8631e28` + worktree D2/D3 | `OK`: 6/6, 28 assertions; regression 20/20 | section 16 + rapports ignores | RC-005 fermee localement; RC-006 hors L2 | references supprimees et absence verifiee avant teardown |
| D4-STRIPE-6d9be04ee9e6 | sandbox + Stripe test, 2 PI max | revision cloud existante + fenetre controle 73, rollback 75 | `PARTIEL`: R00/R05/R18 OK, R10 partiel, R07 non execute | section 17 + rapport ignore + 32 logs bornes | RC-007 detectee; RC-006 non mesuree | PI actif annule, holds 0, outboxes neutralisees, auxiliaires quarantaines, preuves preservees |
| D4-CLOSE-2d209b1a854c | sandbox + Stripe test, 2 PI max, pause webhook 5 s | controle 76, Functions existantes | `OK`: R07/R10 et RC-007 fermes | section 17.5 + rapport ignore + 24 logs bornes | RC-006 hors gate | endpoint reactive, holds 0, outboxes neutralisees, 3 auxiliaires quarantaines, preuves preservees |

## 20. Gates de progression

### Gate D0 - cadre documentaire

- branche isolee depuis le checkpoint;
- document reference dans `AGENTS.md`, `_DOCS/README.md` et `map.md`;
- matrice, abort conditions, registre et format de preuve presents;
- aucun code de panne, deploiement ou changement cloud.

### Gate D1 - audit statique et conception des seams

- cartographie exacte du checkout, des transactions, idempotency keys,
  webhooks, outbox, reservations et reconciliation;
- couverture existante associee a R00-R19;
- choix argumente entre proxy navigateur, mocks, emulator et failpoint;
- aucun code mort ou controle public de panne.

Cloture le 2026-08-24 avec statut `OK`; preuves et choix en section 14.

### Gate D2 - tests deterministes locaux

- scenarios L0/L1 reproductibles;
- chaque anomalie reproduite par un test rouge avant correction;
- aucune ressource cloud utilisee;
- rapport de couverture de la matrice mis a jour.

Cloturee le 2026-08-24 avec statut `OK`; resultats, cycle rouge/vert et limites
en section 15. Aucun critere D3 ou D4 n'est revendique.

### Gate D3 - Emulator Suite

- fixtures jetables et namespacées par `runId`;
- concurrence, duplications et desordre testes;
- preuve de nettoyage local;
- aucun appel Stripe ou e-mail reel.

Cloturee le 2026-08-24 avec statut `OK`; preuves, nettoyage et limites en
section 16. Aucun critere D4 n'est revendique.

### Gate D4 - game day sandbox

- autorisation explicite distincte;
- manifeste de run et abort conditions confirmes;
- Stripe test uniquement et outbox neutralisee ou compte de recette autorise;
- deploiement cible explicitement approuve, si indispensable;
- comparaison console/Firestore/Stripe test/Logging pour chaque run.

Cloturee le 2026-08-24 avec statut `OK`; preuves en sections 17.1 a 17.5.
Aucun deploiement ni failpoint serveur activable publiquement. R07 est ferme
par injection runner et R10 par une pause Stripe test de 5 s restauree.

### Gate D5 - cloture

- anomalies corrigees et requalifiees ou dette explicitement acceptee;
- mecanismes temporaires retires;
- decisions durables fusionnees dans les chapitres commerce, admin,
  observabilite/data, securite, qualite et exploitation;
- references retirees de `AGENTS.md`, `_DOCS/README.md` et `map.md`;
- ce document supprime au plus tard le 2026-10-31; Git conserve l'historique.

## 21. References de methode

- Stripe, idempotence et erreurs reseau:
  <https://docs.stripe.com/error-low-level>
- Stripe, webhooks dupliques, desordonnes et asynchrones:
  <https://docs.stripe.com/webhooks>
- Firebase, Functions idempotentes et retries:
  <https://firebase.google.com/docs/functions/retries>
- Shopify Engineering, idempotency keys et recovery points:
  <https://shopify.engineering/building-resilient-graphql-apis-using-idempotency/>
- Google SRE, tests de fiabilite:
  <https://sre.google/sre-book/testing-reliability/>
- Principles of Chaos Engineering, hypothese et blast radius:
  <https://principlesofchaos.org/>
