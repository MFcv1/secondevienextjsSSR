# Recette reelle des e-mails - Plan Luna

Derniere mise a jour: 2026-07-31
Statut: `PLAN_TEMPORAIRE_EXECUTION`
Executeur: `Luna`, agent rapide de reproduction et diagnostic
Correcteur ulterieur: `GPT-5.6-sol`
Echeance: 2026-08-06
Cloture: fusion des preuves utiles dans `EMAILS_TRANSACTIONNELS.md` et
`COMMERCE_STRIPE.md`, puis suppression de ce plan
Lanceur de nouveau chat: `$client-admin-test` via
[.agents/skills/client-admin-test/SKILL.md](../../.agents/skills/client-admin-test/SKILL.md)
(guide: [TEST_CLIENT_ADMIN_LUNA.md](../../TEST_CLIENT_ADMIN_LUNA.md))

## 1. Mission

Luna doit reproduire sur le vrai site sandbox le parcours humain complet qui
permet de declencher et de recevoir les e-mails transactionnels.

L'objectif est de verifier en conditions reelles:

- les deux comptes et leurs permissions;
- la livraison Gmail;
- les destinataires;
- le contenu et le design;
- les liens;
- les changements d'etat dans les interfaces;
- les effets Stripe test;
- l'idempotence;
- l'absence de doublon;
- la coherence entre client, administrateur, Firestore et Stripe.

Luna est un agent de test et de diagnostic. Il ne corrige aucune anomalie.

## 2. Directive absolue pour Luna

Luna est autorise a:

- utiliser le navigateur comme un utilisateur humain;
- se connecter aux deux comptes de recette deja autorises;
- publier des meubles de recette sur le sandbox;
- effectuer des achats Stripe test;
- appliquer les changements d'etat admin necessaires;
- demander les remboursements Stripe test prevus par le plan;
- consulter les deux boites Gmail avec les acces deja autorises;
- lire les interfaces, journaux, outbox et preuves techniques;
- prendre des captures;
- ajouter des anomalies dans `anomalies.md`;
- completer le compte rendu de recette.

Luna n'est pas autorise a:

- modifier le code;
- appliquer un patch;
- modifier les rules, indexes ou schemas;
- modifier un secret;
- changer un mot de passe;
- creer un nouvel acces ou une fixture d'authentification;
- desactiver Auth, App Check, les signatures Stripe ou une protection;
- activer Stripe live ou une production;
- inventer une correction;
- corriger directement une anomalie meme si la solution parait evidente;
- supprimer une commande payee ou une preuve financiere;
- relancer aveuglement un paiement ou un remboursement ambigu.

Si une anomalie apparait, Luna:

1. arrete le sous-parcours concerne;
2. securise et referme les controles temporaires si necessaire;
3. conserve les preuves;
4. cree ou complete une entree dans `anomalies.md`;
5. indique la reproduction exacte;
6. classe l'impact;
7. continue uniquement les scenarios independants;
8. remet le diagnostic a GPT-5.6-sol sans proposer de patch.

## 3. Environnement obligatoire

| Element | Valeur |
| --- | --- |
| projet | `secondevienextjsssr` |
| environnement | sandbox uniquement |
| site | `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app` |
| Stripe | mode test uniquement |
| administrateur | `loa.gto15@gmail.com` |
| client sans droits admin | `pvml7008@gmail.com` |
| documentation visuelle | `EMAILS_TRANSACTIONNELS.md` |
| registre des anomalies | `anomalies.md` |

Ne jamais inscrire un mot de passe, OTP, token, cookie, PIN, secret
d'application ou donnee de carte dans un Markdown, une capture persistante ou
le compte rendu.

Les numeros de carte Stripe mentionnes dans ce plan sont des valeurs publiques
de test Stripe. Ils ne doivent jamais etre utilises hors du sandbox.

### 3.1 Configuration d'acces validee

La recette doit utiliser le Chrome externe avec l'extension ChatGPT active.
Cette surface sait ouvrir la fenetre Google OAuth et reutiliser les sessions
du profil Chrome; le navigateur integre avait bloque cette confirmation lors
du run precedent.

- boite client: connecteur Gmail autorise pour `pvml7008@gmail.com`;
- boite admin: session Gmail ouverte dans Chrome pour
  `loa.gto15@gmail.com`;
- transfert Gmail admin vers client: actif comme filet de confort, mais
  insuffisant comme preuve de reception admin;
- connexion client: OTP reel, lu sans jamais le conserver dans les preuves;
- connexion admin: Google OAuth dans Chrome, puis verification de l'acces
  fort au back-office.

Luna ouvre elle-meme le selecteur de comptes Google lorsque l'identite visible
n'est pas celle du scenario. Elle lit les OTP dans les boites sandbox
autorisees et les saisit directement dans le site; elle ne demande pas a
l'utilisateur de le faire et ne rend jamais le code visible dans le chat, une
capture, un log ou un document. Seuls un mot de passe, un PIN systeme, Touch
ID, Face ID, une passkey, un CAPTCHA, une recuperation de compte ou une
confirmation materielle non automatisable restent a la charge de
l'utilisateur.

Pour chaque prise de controle, Luna doit identifier les onglets exacts,
confirmer le domaine sandbox et verifier le compte affiche avant d'agir. Elle
doit rechercher les messages client avec `in:anywhere` et controler aussi le
dossier spam. Les notifications admin doivent etre verifiees directement dans
la boite admin, meme si le transfert est active.

## 4. Resultat attendu

La recette doit retrouver les 13 modeles visuels:

| ID | Famille | Modele | Destinataire |
| --- | --- | --- | --- |
| M01 | OTP | connexion client | client |
| M02 | OTP | validation checkout | client |
| M03 | paiement | commande payee | client |
| M04 | paiement | nouvelle commande dediee | administrateur |
| M05 | cycle | en preparation | client |
| M06 | cycle | prete au retrait | client |
| M07 | cycle | retiree | client |
| M08 | cycle | expediee | client |
| M09 | cycle | livree | client |
| M10 | remboursement | confirme | client |
| M11 | remboursement | confirme | administrateur |
| M12 | remboursement | echec/anomalie | client |
| M13 | remboursement | echec/anomalie | administrateur |

Deux commandes sont necessaires, car retrait et expedition sont deux branches
metier incompatibles sur une meme commande.

## 5. Strategie de donnees

Creer deux annonces reelles depuis le site admin:

### Produit A - livraison

- titre prefixe: `[RECETTE EMAIL LIVRAISON]`;
- une ou deux images sans donnee personnelle;
- description clairement marquee comme recette;
- prix faible compatible avec Stripe test;
- stock `1`;
- categorie valide choisie dans l'interface;
- destination: parcours livraison/transporteur.

### Produit B - retrait et remboursement en echec

- titre prefixe: `[RECETTE EMAIL RETRAIT]`;
- images et description differentes;
- prix faible compatible avec Stripe test;
- stock `1`;
- categorie valide;
- destination: retrait atelier.

Les annonces sont publiees par l'interface normale. Luna ne cree pas les
documents directement dans Firestore.

## 6. Preflight ferme

Avant tout achat:

1. verifier que l'URL contient bien le backend sandbox;
2. verifier que Stripe est en mode test;
3. lancer les validations en lecture seule prevues par le projet;
4. confirmer que les operations commerce sont `healthy`;
5. relever la revision des controles commerce;
6. confirmer `offlinePaymentMode=off`;
7. confirmer que le compte client n'a aucun role ou claim admin;
8. confirmer l'acces autorise aux deux boites Gmail;
9. relever l'heure de debut Europe/Paris;
10. creer un `runId` unique prefixe `run_email_luna_`;
11. verifier qu'aucune ancienne recherche Gmail ne peut etre confondue avec le
    nouveau run;
12. preparer un dossier de preuves ignore par Git sous
    `logs/email-luna/<runId>/`.

Gate P0:

- projet, URL, Stripe test, comptes et boites exacts;
- operations saines;
- aucune production configuree comme cible;
- aucun secret visible;
- controles temporaires encore fermes.

Si P0 echoue, ne rien publier et documenter le blocage.

## 7. Scenario OTP connexion - M01

1. ouvrir le site dans une session client deconnectee;
2. ouvrir la connexion depuis le parcours public;
3. saisir l'adresse client;
4. demander un seul code;
5. attendre l'e-mail sans redemander de code;
6. verifier le message dans la boite client et lire le code courant;
7. ne jamais copier le code dans les preuves, le chat ou un fichier;
8. Luna saisit elle-meme le code dans le site;
9. confirmer la connexion du client;
10. verifier que `/admin` reste interdit.

Verifier:

- destinataire client uniquement;
- objet connexion;
- design conforme a M01;
- expiration dix minutes et usage unique;
- absence de BCC visible;
- connexion reussie;
- aucun droit admin.

## 8. Scenario OTP checkout - M02

1. deconnecter proprement le client;
2. ajouter le Produit A au panier;
3. commencer le checkout comme utilisateur humain;
4. demander la verification e-mail checkout;
5. attendre un unique message;
6. verifier M02 dans la boite client et lire le code courant;
7. Luna saisit elle-meme le code sans le conserver;
8. poursuivre jusqu'a l'etape de paiement;
9. ne pas payer avant la Gate P1.

Verifier:

- objet distinct de l'OTP connexion;
- texte centre sur la validation de commande;
- meme systeme graphique;
- aucun deuxieme envoi spontane;
- code a usage unique.

Gate P1: M01 et M02 recus, lisibles et utilisables.

## 9. Commande A - livraison et remboursement reussi

### 9.1 Paiement

Utiliser une carte Stripe de reussite standard documentee pour le sandbox.
Ne jamais utiliser une carte reelle.

1. choisir le mode livraison/transporteur;
2. verifier adresse, telephone et montant avant paiement;
3. effectuer un seul paiement;
4. attendre le statut durable `paid`;
5. relever `orderId` et PaymentIntent sans enregistrer de secret;
6. verifier la commande dans `/mes-commandes`;
7. verifier la commande dans le back-office;
8. chercher M03 dans la boite client;
9. chercher M04 dans la boite administrateur.

Verifier M03:

- client destinataire;
- article, quantite, total, livraison et adresse;
- bouton vers `/mes-commandes`;
- aucune donnee d'une autre commande.

Verifier M04:

- administrateur destinataire direct;
- absence de BCC comme mecanisme principal;
- nom, e-mail, telephone et adresse client;
- moyen de livraison;
- montant;
- PaymentIntent;
- bouton contenant l'`order_id` et ouvrant la bonne commande admin.

### 9.2 Cycle livraison

Depuis le back-office normal:

1. passer la commande en preparation;
2. attendre et verifier M05;
3. confirmer qu'une seule notification a ete recue;
4. passer la commande en expedition avec un numero de suivi de recette;
5. attendre et verifier M08;
6. confirmer que le numero de suivi apparait;
7. passer la commande en livraison terminee;
8. attendre et verifier M09;
9. verifier chaque statut dans les interfaces client et admin.

Ne pas cliquer deux fois pour forcer un resultat. En cas de reponse lente,
attendre puis rafraichir les preuves serveur avant toute nouvelle action.

### 9.3 Remboursement reussi

1. demander un remboursement complet unique depuis le back-office;
2. utiliser un motif explicitement marque recette;
3. attendre la confirmation Stripe durable;
4. verifier le montant rembourse;
5. verifier M10 cote client;
6. verifier M11 cote administrateur;
7. verifier l'identifiant Refund Stripe;
8. verifier la commande et les documents cote client;
9. verifier le remboursement cote admin;
10. confirmer qu'aucun restock automatique n'a eu lieu.

Gate A:

- M03, M04, M05, M08, M09, M10 et M11 recus;
- une seule commande et un seul PaymentIntent;
- un seul remboursement;
- capture et remboursement egaux;
- net financier nul pour la commande A;
- stock toujours `0`;
- interfaces et e-mails coherents.

## 10. Commande B - retrait et remboursement asynchrone en echec

Stripe documente une carte de test de remboursement asynchrone en echec:

- numero public sandbox: `4000 0000 0000 5126`;
- PaymentMethod equivalent: `pm_card_refundFail`;
- le paiement reussit;
- le remboursement peut d'abord sembler reussi;
- il passe ensuite a `failed` et emet `refund.failed`.

Reference officielle:
[Stripe - Simuler un remboursement asynchrone](https://docs.stripe.com/testing#refunds).

### 10.1 Gate technique obligatoire avant utilisation

Le code observe au 2026-07-30 montre que le worker webhook v2 traite
explicitement les evenements `payment_intent.*`. Luna doit verifier le
comportement deploye, mais ne doit pas corriger ce point.

Avant de payer avec la carte de remboursement en echec:

1. verifier les endpoints Stripe v2 actifs;
2. verifier que l'evenement `refund.failed` du compte sandbox atteint bien un
   consommateur v2;
3. verifier qu'un echec tardif peut mettre a jour la commande, la tentative,
   les faits financiers et les deux outbox d'anomalie;
4. si cette prise en charge n'est pas prouvable, creer immediatement une
   anomalie `BLOQUANTE`;
5. transmettre a GPT-5.6-sol;
6. ne pas executer le remboursement en echec tant que le blocage n'est pas
   corrige et redeploye par un autre agent.

Luna peut continuer les tests de retrait independants, mais pas improviser un
document `refund_failed` ou injecter une outbox.

### 10.2 Paiement et retrait

1. acheter le Produit B avec le compte client;
2. choisir retrait atelier;
3. utiliser uniquement la carte Stripe test de remboursement en echec;
4. attendre `paid`;
5. verifier les e-mails de paiement sans les compter comme nouveaux modeles;
6. passer en preparation et verifier M05;
7. passer en pret au retrait et verifier M06;
8. confirmer le retrait physique de recette et verifier M07;
9. verifier les statuts client/admin apres chaque action.

### 10.3 Remboursement en echec

Executer seulement si la Gate technique est verte:

1. demander un remboursement complet unique;
2. relever l'etat initial renvoye par Stripe;
3. ne jamais conclure au succes sur le seul premier statut;
4. attendre l'evenement asynchrone `refund.failed`;
5. surveiller la commande, la tentative, les faits financiers et l'outbox;
6. verifier M12 dans la boite client;
7. verifier M13 dans la boite administrateur;
8. verifier que les messages n'affirment pas qu'un remboursement est acquis;
9. verifier la consigne admin de ne pas relancer aveuglement;
10. verifier qu'aucun second remboursement n'est cree;
11. verifier qu'aucun restock automatique n'a lieu.

Resultat financier attendu apres echec final:

- montant effectivement rembourse: `0`;
- capture conservee;
- net financier egal au montant capture;
- statut explicite `refund_failed` ou `needs_review`;
- aucune suppression de fait financier;
- toute correction comptable eventuelle append-only et auditable.

Si le remboursement apparait d'abord reussi puis echoue, Luna doit consigner la
chronologie exacte des e-mails recus. Recevoir M10/M11 avant M12/M13 peut etre
le comportement Stripe simule; ce n'est pas automatiquement un doublon, mais
la communication doit rester comprehensible.

Gate B:

- M06, M07, M12 et M13 recus;
- evenement Stripe `refund.failed` prouve;
- aucune double tentative;
- projection financiere coherente avec un remboursement finalement echoue;
- stock inchange;
- aucun correctif applique par Luna.

## 11. Controle de chaque e-mail

Pour chaque modele M01 a M13, consigner:

| Champ | Preuve attendue |
| --- | --- |
| modele | ID M01-M13 |
| destinataire | client ou administrateur attendu |
| objet | exact ou resume sans PII |
| date | Europe/Paris |
| ordre associe | reference bornee |
| provider | identifiant hashable ou masque |
| dossier Gmail | principale, promotions ou spam |
| SPF/DKIM/DMARC | resultat sans header sensible |
| texte | present |
| HTML | present |
| bouton | URL same-origin correcte |
| informations | article, montant, livraison, Stripe selon modele |
| doublon | oui/non avec justification |
| capture | chemin sous `logs/email-luna/<runId>/` |

Les captures Gmail restent temporaires si elles montrent:

- un OTP;
- une adresse personnelle;
- un telephone;
- un identifiant de session;
- un header complet;
- toute information non necessaire.

Pour une conservation documentaire, produire ensuite une capture sanitisee.

## 12. Regles de recherche Gmail

Pour eviter les faux positifs:

1. utiliser l'heure de debut du run;
2. rechercher par reference de commande et objet;
3. verifier `To`, pas seulement la presence dans une conversation;
4. controler boite principale, promotions, tous les messages et spam;
5. ne pas marquer un message absent avant le delai de propagation;
6. ne pas redemander un OTP ou rejouer une action pour accelerer;
7. verifier l'identifiant fournisseur de l'outbox;
8. distinguer deux commandes des doublons d'une meme outbox.

Le classement spam est une anomalie de delivrabilite deja connue `A-010`. Luna
doit mesurer sa recurrence, pas tenter de contourner Gmail.

## 13. Format obligatoire d'une anomalie Luna

Ajouter dans `anomalies.md`:

```text
ID:
Statut: OUVERTE
Severite:
RunId:
Phase et modele Mxx:
Compte concerne:
OrderId borne:
Heure Europe/Paris:
Preconditions:
Etapes exactes de reproduction:
Attendu:
Observe:
Reproductibilite:
Impact client/admin/finance/stock/securite:
Preuves et captures sanitisees:
Etat Stripe:
Etat commande client:
Etat commande admin:
Etat outbox:
Controles refermes: oui/non
Correction appliquee par Luna: NON
Handoff recommande: GPT-5.6-sol
```

Severites:

- `BLOQUANTE`: paiement, remboursement, finance, stock, permission ou securite;
- `MAJEURE`: e-mail absent, mauvais destinataire, mauvais contenu ou lien
  incorrect;
- `MINEURE`: information secondaire incomplete;
- `COSMETIQUE`: ecart visuel sans ambiguite metier.

## 14. Arret et securisation

Arret immediat si:

- projet ou URL non sandbox;
- Stripe n'est pas clairement en mode test;
- compte client admin par erreur;
- montant ou stock incoherent;
- deux PaymentIntents pour une action;
- remboursement ambigu;
- evenement `refund.failed` non pris en charge;
- e-mail adresse au mauvais destinataire;
- secret ou OTP visible dans une preuve persistante;
- operations commerce en divergence;
- controls impossibles a refermer.

Dans tous les cas:

1. ne pas corriger;
2. ne pas rejouer;
3. refermer la fenetre de mutation avec le mecanisme officiel;
4. confirmer `v2_fixture` ou mode ferme attendu;
5. confirmer mutations admin `read_only`;
6. confirmer paiement offline `off`;
7. consigner l'anomalie;
8. transmettre a GPT-5.6-sol.

## 15. Nettoyage de recette

Le nettoyage ne supprime aucune commande payee.

Luna doit:

- archiver les deux annonces de recette avec la commande admin normale;
- ne pas les remettre en vente sur la seule base d'un remboursement;
- laisser les commandes, evenements, faits financiers et preuves Stripe;
- fermer les controles temporaires;
- confirmer operations `healthy` ou documenter l'ecart;
- conserver seulement les captures sanitisees utiles;
- ne jamais utiliser de suppression recursive ou purge globale.

## 16. Definition de done

La recette est terminee uniquement si:

- les 13 modeles distincts ont ete recus ou une anomalie explicite explique
  chaque modele manquant;
- les deux branches livraison et retrait ont ete executees;
- les deux boites ont ete controlees;
- la notification admin est dediee et non une simple BCC;
- paiement et remboursement reussi sont coherents;
- le remboursement asynchrone en echec est prouve ou bloque par une anomalie;
- chaque e-mail est correle a une outbox unique;
- aucune permission admin n'est accordee au client;
- aucun restock implicite n'est observe;
- tous les controles sont refermes;
- Luna n'a modifie aucun code;
- `anomalies.md` contient toutes les divergences;
- un rapport final distingue clairement `REUSSI`, `ECHEC`, `BLOQUE` et
  `NON_EXECUTE`.

## 17. Rapport final Luna

Le rapport doit commencer par:

```text
Verdict global:
RunId:
Commandes creees:
Modeles recus sur 13:
Modeles manquants:
Anomalies bloquantes:
Anomalies majeures:
Paiement A:
Refund A:
Paiement B:
Refund failed B:
Permissions client:
Etat operations:
Controles finaux:
Code modifie par Luna: NON
Prochaine action pour GPT-5.6-sol:
```

Puis fournir:

1. la matrice M01-M13;
2. la chronologie des deux commandes;
3. le rapprochement paiement/remboursement;
4. les anomalies avec reproduction;
5. les captures sanitisees;
6. la preuve de fermeture des controles.

## 18. Requalification partielle du 2026-07-31

Run: `run_v2all_20260731_chrome01`.

| Modele | Resultat | Preuve fonctionnelle |
| --- | --- | --- |
| M01 | `REUSSI` | OTP client recu, premiere validation transitoirement en erreur reseau, retry reussi |
| M02 | `NON_EXECUTE` | le client etait deja authentifie au debut des achats |
| M03 | `REUSSI` | confirmations client des commandes simple et multiple |
| M04 | `REUSSI` | deux notifications dediees dans la boite admin |
| M05 | `REUSSI` | message client de mise en preparation |
| M06 | `REUSSI` | message client pret au retrait |
| M07 | `NON_EXECUTE` | retrait physique non confirme |
| M08 | `NON_EXECUTE` | branche expedition non executee |
| M09 | `NON_EXECUTE` | branche livraison finale non executee |
| M10 | `REUSSI` | confirmation client de remboursement complet |
| M11 | `REUSSI` | confirmation admin de remboursement complet |
| M12 | `NON_EXECUTE` | aucun remboursement en echec simule |
| M13 | `NON_EXECUTE` | aucun remboursement en echec simule |

Les six messages observes dans la boite client etaient tous classes dans
`SPAM`, ce qui requalifie la recurrence de A-010 sans demontrer un defaut de
transport. Les trois notifications admin controlees etaient dans la boite de
reception. L'outbox et l'audit serveur confirmaient les envois `sent` et la
coherence des transitions.

La campagne a produit deux commandes Stripe test, une simple ensuite
remboursee integralement et une multiple restee `paid`. Les controles ont ete
refermes a la revision `52`, les operations etaient `healthy` et Luna/Codex
n'ont applique aucun patch. Les six modeles non executes restent a couvrir
avant de declarer la recette M01-M13 complete.
