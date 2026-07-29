# Plan de reprise commerce

Derniere mise a jour: 2026-07-29
Statut: `PLAN_REPRISE_DIFFERE`
Proprietaire: commerce, UX transactionnelle, exploitation et production
Echeance de gouvernance: 2026-10-31
Point d'entree et etat actuel:
[COMMERCE_SYNTHESE.md](COMMERCE_SYNTHESE.md)

## 1. Objectif

Ce document permet de reprendre plus tard les axes qui commencent apres la
stabilisation des Gates 0A a 8. Il ne reouvre aucune Gate fermee et
n'autorise aucune activation cloud par sa seule existence.

Ordre de reprise:

1. terminer le rangement documentaire;
2. effectuer la recette UX complementaire;
3. corriger les enseignements de la fenetre `v2_all` sandbox refermee;
4. fermer les decisions metier;
5. construire le rail production;
6. lancer progressivement avec rollback et observation.

## 2. Etat de depart a ne pas perdre

- statut: `PREPROD_TRANSACTIONAL_READY` sur sandbox/fixtures;
- Gates 0A a 8 fermees;
- `NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_UI=false`;
- `NEXT_PUBLIC_COMMERCE_V2_UI=false`;
- `adminMutationMode=read_only`;
- `offlinePaymentMode=off`;
- `newCheckoutMode=v2_fixture` borne a `fixture_gate6_20260728`;
- Stripe test uniquement;
- operations `healthy`, compteurs a zero;
- controle revision 32;
- fenetre `v2_all` catalogue reel du 2026-07-29 refermee avec policy fixture
  restauree;
- aucune activation `v2_all` permanente, live ou production.

Avant toute reprise, relire:

1. `AGENTS.md`;
2. `map.md`;
3. [COMMERCE_SYNTHESE.md](COMMERCE_SYNTHESE.md);
4. [COMMERCE_STRIPE.md](COMMERCE_STRIPE.md);
5. le présent plan;
6. le code executable touche.

## 3. Axe R0 - Rangement documentaire

Etat: `DONE_2026_07_29`

Travail:

- relire et enregistrer `COMMERCE_SYNTHESE.md`;
- retirer de `COMMERCE_STRIPE.md` les formulations historiques presentees
  comme etat courant;
- relier la synthese, le plan et `TODO.md`;
- verifier les liens Markdown et `git diff --check`;
- commit/push sans inclure les fichiers UI utilisateur hors scope.

Done:

- la synthese est le point d'entree;
- l'historique reste clairement etiquete;
- aucun lien local n'est casse;
- le commit documentaire est pousse.

## 4. Axe R1 - Recette UX complementaire

Etat: `IN_PROGRESS`

Perimetre:

- step-up admin visible avec vraie passkey ou Google;
- paiement invite OTP complet de bout en bout;
- Safari/iPhone;
- Chrome Android;
- textes d'erreur, retry, retour 3DS et reprise apres fermeture;
- accessibilite minimale des actions checkout/admin touchees.

Recette Safari desktop ajoutee le 2026-07-29:

- compte exact `loa.gto15@gmail.com`, parcours client normal malgre le claim
  admin;
- commande 10 EUR payee par le Payment Element visible;
- commande 80 EUR payee puis remboursement Stripe test complet;
- commande 400 EUR avec trois meubles, hold puis commit quantitatif de trois
  unites;
- `/mes-commandes` affiche trois dossiers et 80 EUR rembourses;
- l'admin du compte n'a pas modifie le contrat checkout, le proprietaire des
  commandes ou le reader UID. Une smoke non-admin reste necessaire pour
  verifier l'absence d'effet purement visuel du shell.

Defauts UX/contrat a corriger avant polissage:

- corrige localement le 2026-07-29: quitter l'ecran Stripe conserve le
  controller en `awaiting_method`, le `clientSecret` en memoire et une action
  explicite de reprise; aucun nouveau `START` n'est emis;
- corrige localement le 2026-07-29: apres reload, le descriptor lie a
  l'identite Firebase recharge `orderId`/`clientOrderId`, appelle
  `resumeCheckoutV2`, recupere le total autoritaire et rouvre le PaymentIntent
  existant avant la garde panier vide, sans dependre du formulaire
  reinitialise;
- corrige localement le 2026-07-29: le paiement Stripe est presente comme un
  ecran plein viewport responsive avec retour au recapitulatif, focus initial,
  Escape, piege de focus et restauration du focus; la qualification hebergee
  et la matrice appareils restent a executer;
- corrige le 2026-07-29: `MyOrdersView` normalise les Timestamps callable,
  projette `shippingSnapshot`, raccorde les documents immuables et evite le
  chevauchement des actions de document;
- corrige le 2026-07-29: Retours normalise les champs Stripe/refund v2 et
  affiche les dossiers physiques detailles meme en consultation read-only;
- le contrat `shippingAddress` v2 exclut le telephone saisi au checkout; le
  profil reste donc `A completer` malgre la saisie visible;
- les snapshots d'item ne fournissent pas encore l'image attendue par la vue,
  qui montre la meme image de repli sur les trois dossiers.

Contraintes:

- fixtures et Stripe test uniquement;
- aucune donnee cliente choisie par fallback;
- demander l'interaction utilisateur pour Touch ID, passkey, Google ou OTP
  quand elle est indispensable;
- ne jamais demander ni journaliser un code, token ou secret dans un Markdown.

Done:

- matrice appareils/navigateurs renseignee;
- admin AAL2 observe dans l'interface;
- guest OTP termine une commande fixture et retrouve sa commande;
- aucune divergence backend ou incident final.

## 5. Axe R2 - Activation `v2_all` sandbox

Etat: `DONE_CONTROLLED_2026_07_29`

Cette phase a ete executee avec autorisation utilisateur explicite, catalogue
reel borne et Stripe test uniquement.

Preparation:

- choisir explicitement les produits non-fixtures admissibles;
- valider policy, prix, stock, livraison, Connect et URLs sandbox;
- capturer l'etat initial et preparer le rollback;
- definir duree, responsable et seuils de la fenetre;
- verifier operations `healthy`, inbox/outbox et incidents;
- conserver Stripe test et interdire toute cle live.

Activation:

- modifier le controle par une commande auditee et versionnee;
- ouvrir l'UI seulement sur le release attendu;
- observer captures, refunds, holds, stock, e-mails et documents;
- ne jamais adopter automatiquement une commande legacy ambigue.

Rollback:

- UI publique commerce `false`;
- `newCheckoutMode=off` ou retour au mode borne approuve;
- `adminMutationMode=read_only`;
- aucun cleaner legacy reactive;
- rapprochement et terminalisation avant cloture.

Done:

- run `run_v2all_20260729_loa_orders_retry5`, cinq produits exacts et policy
  temporaire `sandbox_v2all_policy_20260729`;
- trois commandes v2 durables:
  `ord_8b4f13e1-5a41-4c47-8321-fc54f15904b9` payee 1 000 centimes,
  `ord_5f591b28-0f34-4028-9196-f10c581d579e` capturee puis remboursee
  8 000 centimes, et
  `ord_eb608abd-7d0e-49c6-89ed-c2834e8ef385` payee 40 000 centimes avec trois
  lignes;
- cinq reservations finales `committed`, cinq stocks a zero, aucun restock
  induit par le remboursement;
- trois webhooks `payment_intent.succeeded` traites, quatre e-mails outbox
  `sent`, quatre faits financiers correles et aucun incident;
- operations `healthy`, tous les compteurs a zero;
- panier de la commande a trois lignes nettoye apres preuve durable du
  paiement;
- fermeture testee meme apres consommation des cinq stocks; controle revision
  32, policy precedente restauree, `v2_fixture` et `read_only`;
- flag UI transactionnel remis a `false`.

Enseignements non bloquants pour la conservation des preuves:

- `sold` reste `false` lorsque le stock atteint zero; l'achat est bloque par
  la regle autoritaire de stock, mais la semantique editoriale merite une
  decision separee;
- le nettoyage panier automatique n'a pas pu s'executer quand la confirmation
  Stripe finale a ete effectuee par l'outil serveur apres le blocage de reprise;
  un cleanup exact et garde a reproduit le nettoyage client attendu.

## 6. Axe R3 - Decisions metier

Etat: `BLOCKED_EXTERNAL_DECISIONS`

A confirmer avec la cliente et, selon le sujet, un professionnel:

- catalogue et produits reellement vendables;
- zones, modes, prix et delais de livraison;
- taxes, frais, devise et arrondis;
- politique d'annulation, remboursement et retour;
- responsabilite des frais Stripe/Connect;
- nature des recus, factures et avoirs;
- CGV et mentions legales;
- retention comptable et anonymisation.

Done:

- chaque decision possede un proprietaire;
- textes juridiques valides;
- policy serveur versionnee;
- aucun placeholder de demonstration utilise en live.

## 7. Axe R4 - Rail production

Etat: `PRODUCTION_DEFERRED`

Pre-requis:

- domaine final et URLs de retour;
- projet/cible production explicite;
- Stripe Live et Connect Live separes du sandbox;
- KYC et capabilities valides;
- webhooks live signes et supervises;
- Resend, SPF, DKIM et DMARC;
- App Check production;
- sauvegardes, alertes, SLO et runbooks;
- secrets et IAM minimaux;
- Rules/indexes/deploiements verifies;
- procedure de rollback production.

Done:

- aucune configuration sandbox partagee par erreur;
- tests non transactionnels production verts;
- alertes et restauration prouvees;
- responsable d'exploitation identifie.

## 8. Axe R5 - Lancement progressif

Etat: `PENDING_R4`

Ordre:

1. paiement live de faible montant;
2. confirmation commande/stock/webhook/e-mail/document;
3. remboursement complet;
4. rapprochement Stripe et bancaire;
5. retour/restock si applicable;
6. observation sans incident;
7. ouverture limitee;
8. extension seulement apres decision explicite.

Stop immediat:

- paiement Stripe non projete durablement;
- stock negatif ou compensation dupliquee;
- webhook mort ou incident non arbitre;
- divergence financiere;
- document ou e-mail trompeur;
- doute sur la cible sandbox/live.

## 9. Ce qui ne doit pas etre fait automatiquement

- activer `v2_all`;
- utiliser une cle Stripe Live;
- deployer une cible production;
- modifier DNS ou provider e-mail;
- activer App Check enforcement production;
- effectuer un paiement live;
- publier CGV/retours non valides;
- supprimer commandes ou preuves comptables;
- reutiliser les fixtures comme catalogue client.

## 10. Cloture du plan

Ce plan est temporaire. Il est ferme lorsque:

- R1 a R5 sont termines ou explicitement reclasses dans les chapitres
  canoniques;
- toutes les decisions durables sont fusionnees dans les documents de domaine;
- `TODO.md`, `_DOCS/README.md`, `AGENTS.md` et `map.md` ne le referencent plus;
- le fichier est supprime, Git conservant l'historique.

Si aucune reprise n'a lieu avant le 2026-10-31, revoir explicitement son statut
et son echeance au lieu de le laisser actif silencieusement.
