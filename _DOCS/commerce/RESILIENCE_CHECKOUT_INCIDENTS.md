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
| RC-001 | majeure | `CMD-111` ne retrouve pas la commande existante | la recherche `order` lit seulement `orders/{value}` et ne requete pas `orderNumber` | normaliser `CMD-*`, extraire le numero et effectuer une requete bornee/indexee | `OUVERTE` |
| RC-002 | majeure | webhook inbox traite absent d'une timeline comparee | la timeline ne lit pas directement `commerce_webhook_inbox`; le journal `business_events` historique est vide | projeter les webhooks de maniere durable ou lire une projection bornee dediee; ajouter un test historique | `OUVERTE` |
| RC-003 | moyenne | une erreur d'ecriture audit n'empecherait pas la consultation | `writeSecurityAudit` journalise l'erreur mais reste fail-open | rendre l'audit de lecture incident fail-closed ou definir une preuve durable equivalente avant reponse | `OUVERTE` |
| RC-004 | moyenne | recherche invalide absente des audits fonctionnels | normalisation executee avant l'ecriture d'audit | auditer les tentatives refusees avec type et valeur haches, sans conserver l'entree brute | `OUVERTE` |
| RC-005 | faible | plafond 100 non exerce sur donnees existantes | aucun aggregate ne depasse 31 evenements | construire uniquement en L2 une fixture synthetique de 101+ evenements | `OUVERTE` |
| RC-006 | moyenne | premier appel froid proche de 8,6 s | Function Gen2 `minInstances: 0` et initialisation a froid | mesurer plusieurs appels froids avant toute decision; ameliorer le feedback UI ou la capacite seulement si seuil confirme | `A_MESURER` |

Aucune correction n'est implementee au moment de la creation de ce document.

## 14. Journal des changements

| Date | SHA | Changement | Validation | Deploiement |
| --- | --- | --- | --- | --- |
| 2026-08-24 | `53aa224` | checkpoint avant campagne; console/observabilite existantes | lint 0 erreur; 17 tests cibles; secret scan et diff-check propres | non |
| 2026-08-24 | commit D0, voir historique Git | creation du plan et branche `codex/checkout-resilience-lab` | liens et diff documentaire a verifier | non |

Chaque futur changement de code obtient une ligne distincte avec les tests et
le statut du deploiement. Ne jamais regrouper plusieurs injections sans raison.

## 15. Journal d'execution

| Run ID | Scenario | SHA/revision | Resultat | Preuves | Anomalies | Nettoyage |
| --- | --- | --- | --- | --- | --- | --- |
| PRE-INCIDENTS-20260824 | baseline console read-only | `53aa224` / sandbox courant | `PARTIEL` | section 12 | RC-001 a RC-006 | aucun |

## 16. Gates de progression

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

### Gate D2 - tests deterministes locaux

- scenarios L0/L1 reproductibles;
- chaque anomalie reproduite par un test rouge avant correction;
- aucune ressource cloud utilisee;
- rapport de couverture de la matrice mis a jour.

### Gate D3 - Emulator Suite

- fixtures jetables et namespacées par `runId`;
- concurrence, duplications et desordre testes;
- preuve de nettoyage local;
- aucun appel Stripe ou e-mail reel.

### Gate D4 - game day sandbox

- autorisation explicite distincte;
- manifeste de run et abort conditions confirmes;
- Stripe test uniquement et outbox neutralisee ou compte de recette autorise;
- deploiement cible explicitement approuve, si indispensable;
- comparaison console/Firestore/Stripe test/Logging pour chaque run.

### Gate D5 - cloture

- anomalies corrigees et requalifiees ou dette explicitement acceptee;
- mecanismes temporaires retires;
- decisions durables fusionnees dans les chapitres commerce, admin,
  observabilite/data, securite, qualite et exploitation;
- references retirees de `AGENTS.md`, `_DOCS/README.md` et `map.md`;
- ce document supprime au plus tard le 2026-10-31; Git conserve l'historique.

## 17. References de methode

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
