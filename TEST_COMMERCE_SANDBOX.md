# Campagne de recette commerce sandbox

Derniere mise a jour: 2026-07-31
Statut: `RECETTE_REELLE_EXECUTEE_CONTROLES_FERMES`
Proprietaire: recette commerce
Environnement exclusif: `secondevienextjsssr` / App Hosting sandbox / Stripe test
Echeance de cloture: 2026-08-06
Registre associe: [anomalies.md](anomalies.md)
Lanceur Luna: `$client-admin-test` via
[.agents/skills/client-admin-test/SKILL.md](.agents/skills/client-admin-test/SKILL.md)
(guide: [TEST_CLIENT_ADMIN_LUNA.md](TEST_CLIENT_ADMIN_LUNA.md))

## 1. Objectif ferme

Qualifier de bout en bout, avec deux identites distinctes:

1. la creation et la publication d'un meuble par l'administrateur de recette;
2. sa disponibilite dans le catalogue materialise;
3. son achat par le compte client lambda sans droit administrateur;
4. la projection durable de la commande cote client et cote back-office;
5. les e-mails de commande recus par le client et l'administrateur;
6. un remboursement Stripe test complet;
7. la projection du remboursement cote client et cote back-office;
8. les e-mails de remboursement;
9. la qualite visuelle et informationnelle de tous les e-mails transactionnels touches.

La campagne se termine lorsque les criteres de la section 9 sont satisfaits.
Elle n'autorise ni Stripe live, ni production, ni activation permanente de
`v2_all`.

## 2. Identites et separation des roles

- administrateur de recette: `loa.gto15@gmail.com`;
- client lambda: `pvml7008@gmail.com`;
- les deux comptes sont utilises exclusivement par les interfaces normales du
  site Hosting, comme deux utilisateurs humains;
- aucune identite fixture, aucun alias technique et aucun nouvel acces ne sont
  crees pour cette campagne;
- le client doit rester sans claim, registre ou droit administrateur;
- chaque verification doit confirmer l'identite active avant une mutation;
- aucun mot de passe, OTP, token, PIN, secret ou donnee de carte n'est consigne
  dans ce fichier, dans `anomalies.md`, dans un log partage ou dans une capture.

L'agent utilise lui-meme le selecteur de comptes Google deja connectes et lit
puis saisit les OTP recus dans les boites sandbox autorisees. Les interactions
Touch ID, Face ID, passkey, PIN systeme, CAPTCHA, recuperation de compte ou
confirmation materielle qui exigent reellement une presence humaine sont
interrompues au point exact, puis reprises apres l'interaction de
l'utilisateur. Un secret n'est jamais demande dans la conversation.

### 2.1 Acces durable pour Codex, Luna et les agents suivants

La configuration de recette validee le 2026-07-31 est la suivante:

- utiliser le Chrome externe avec l'extension ChatGPT active; le navigateur
  integre ne doit pas servir a la connexion Google administrateur;
- le profil Chrome conserve les sessions Google des deux comptes de recette;
- si un autre compte de recette est affiche, l'agent ouvre le selecteur Google
  et bascule lui-meme vers `pvml7008@gmail.com` ou `loa.gto15@gmail.com` selon
  le parcours;
- la boite client est lisible par le connecteur Gmail autorise;
- la boite administrateur est ouverte dans Chrome;
- le transfert Gmail admin vers la boite client est actif, mais il ne remplace
  jamais le controle direct de la boite admin: Gmail peut ne pas transferer
  certains messages emis vers soi-meme;
- le client se connecte avec l'OTP reel recu dans sa boite;
- l'agent lit cet OTP et le saisit directement dans le sandbox, sans le
  montrer dans le chat, un log, une capture ou un document;
- l'administrateur se connecte avec Google OAuth dans Chrome, ce qui etablit
  l'assurance forte necessaire au back-office.

Au debut de chaque recette, nommer le `runId`, ouvrir uniquement le sandbox,
identifier explicitement les onglets site et Gmail, puis confirmer l'adresse
du compte visible avant toute mutation. Aucun mot de passe, OTP, cookie ou
token ne doit etre inscrit dans cette procedure.

## 3. Donnee de recette

Toute donnee creee pour la publication est identifiable et reversible:

- titre prefixe par `[RECETTE AAAA-MM-JJ]`;
- description fictive sans donnee personnelle;
- categorie choisie parmi les categories existantes;
- prix en EUR borne et compatible avec Stripe test;
- stock initial: `1`, sauf exigence executable contraire;
- medias de recette libres de droits ou generes pour la campagne;
- identifiant produit, revision catalogue, `runId`, `orderId`, PaymentIntent,
  refund et documents correles releves sans secret.

Pour les achats, une campagne bornee peut utiliser des meubles sandbox
existants explicitement autorises par sa policy. Pour la publication, elle
cree au plus un meuble de smoke test, de preference non indexable s'il n'a pas
de medias. Un produit ne doit jamais etre choisi par un fallback du type
« dernier produit » ou « derniere commande ». Toutes les operations sont
correlees par les identifiants exacts de la campagne.

## 4. Garde-fous d'ouverture et de fermeture

### Avant ouverture

Verifier en lecture:

- projet Firebase et cible App Hosting sandbox exacts;
- Stripe test uniquement;
- operations commerce `healthy` et compteurs d'incident a zero;
- controle courant `v2_fixture`, `adminMutationMode=read_only`,
  `offlinePaymentMode=off`;
- UI transactionnelle publique fermee hors fenetre;
- etat Git et version deployee;
- plan de fermeture utilisable meme si le navigateur ou la session se coupe.

### Fenetre bornee

Toute ouverture utilise:

- un `runId` unique;
- une policy et un perimetre explicites;
- `v2_all` uniquement le temps strictement necessaire au meuble de recette;
- mutations admin `v2` uniquement le temps des commandes autorisees;
- Stripe test;
- observation des commandes, holds, stocks, inbox, outbox, faits financiers
  et incidents.

### Fermeture

Dans tous les cas, succes ou echec:

- refermer l'UI transactionnelle;
- restaurer `v2_fixture`;
- restaurer `adminMutationMode=read_only`;
- conserver `offlinePaymentMode=off`;
- verifier la policy precedente;
- rapprocher les operations terminales;
- confirmer `healthy`, zero incident ouvert et zero hold orphelin;
- ne supprimer aucune commande payee, preuve financiere, outbox, audit ou
  mouvement d'inventaire.

## 5. Deroulement et gates

### Phase A - Preflight

1. verifier les outils, sessions et acces necessaires;
2. lire l'etat cloud sans mutation;
3. inspecter le code de publication, checkout, commandes, remboursements et
   e-mails;
4. choisir les validations locales proportionnees;
5. enregistrer les identifiants de campagne.

Gate A: cible sandbox certaine, controle sain, rollback pret, comptes exacts.

Le preflight serveur ne remplace aucun geste fonctionnel. Il sert seulement a
prouver la cible, la sante initiale et la possibilite de refermer la fenetre.
Publication, achat, paiement, consultation de commande et remboursement sont
executes depuis les interfaces normales du site Hosting.

### Phase B - Publication administrateur

1. ouvrir `/admin` avec l'administrateur;
2. confirmer claim, registre et assurance forte;
3. creer le meuble avec ses medias;
4. verifier les validations, messages, focus, retry et absence d'erreur
   console/reseau pertinente;
5. suivre `furniture` vers le build snapshot, la revalidation et la version
   publique;
6. ouvrir la fiche produit et verifier titre, prix, categorie, stock, images,
   metadata anti-CLS et achat possible.

Gate B: une seule annonce exacte, snapshot publie, fiche publique coherente,
aucune friction bloquante.

### Phase C - Achat client lambda

1. fermer la session admin et ouvrir une session distincte client;
2. confirmer l'absence de tout acces ou controle administrateur;
3. ajouter le meuble exact au panier;
4. terminer adresse, livraison et Payment Element avec une carte Stripe test;
5. verifier que le serveur reste autoritaire pour total et stock;
6. attendre le statut durable `paid`;
7. verifier nettoyage du panier, stock et absence de double commande;
8. ouvrir `/mes-commandes` et verifier commande, montant, articles, image,
   adresse, telephone, statut et document sandbox non fiscal.

Le bouton client de demande de retour/remboursement ouvre le parcours de
contact support. Il ne declenche pas directement un remboursement Stripe. Le
remboursement financier qualifiant est une action administrateur forte depuis
Retours.

Gate C: commande exacte `paid`, stock commis une fois, lecture limitee au
client proprietaire, aucune elevation de privilege.

### Phase D - Double verification commande et e-mails

1. verifier dans la boite client le message de confirmation exact;
2. verifier dans la boite administrateur la notification exacte;
3. controler expediteur, destinataire, objet, horodatage, montant, articles,
   quantites, adresse utile, numero de commande, statut, liens et rendu mobile;
4. verifier l'outbox et la preuve fournisseur;
5. rouvrir `/admin` avec l'administrateur et verifier Ventes, timeline,
   coordonnees, montants, lignes et statut;
6. verifier qu'aucune autre commande ou donnee client n'est confondue.

Gate D: client, administrateur, Firestore, Stripe test et e-mails convergent
sur la meme commande.

### Phase E - Qualite premium des e-mails

Auditer et, si necessaire, corriger:

- identite visuelle Seconde Vie et rendu responsive;
- hierarchie claire, typographie, contraste et texte de repli;
- recapitulatif complet sans donnee superflue;
- montants et devise sans ambiguite;
- informations de livraison et de support;
- statut et prochaine etape realistes;
- liens same-origin sandbox pendant la recette;
- echappement HTML, absence de secret et minimisation des donnees;
- idempotence/outbox, gestion `delivery_unknown` et reprise;
- compatibilite Gmail et lisibilite sans images.

Apres changement: lancer les tests e-mail/commerce cibles, deployer uniquement
les Functions sandbox necessaires, puis rejouer la notification concernee sans
creer de doublon non maitrise.

Gate E: contenu premium et exact, transport prouve, aucune regression metier.

### Phase F - Remboursement Stripe test

1. garder l'`orderId` exact de la campagne;
2. ouvrir Retours avec un administrateur fort;
3. demander un remboursement complet explicite et idempotent;
4. verifier la tentative et la reference Stripe exactes;
5. simuler/reprendre une interruption seulement si le rail qualifiant le
   permet sans risque de double refund;
6. attendre `refunded`;
7. confirmer qu'aucun restock automatique n'a lieu;
8. verifier `/mes-commandes`, le document de remboursement et le delai
   bancaire formule sans promesse absolue;
9. verifier Retours, Ventes, timeline, Stripe test, faits financiers, outbox et
   e-mails client/admin attendus.

Gate F: un remboursement financier exact, zero doublon, zero restock implicite,
projections et communications coherentes.

### Phase G - Cloture

1. refermer la fenetre selon la section 4;
2. rejouer les validations du perimetre modifie;
3. verifier les liens documentaires, `git diff --check` et l'absence de secret;
4. fusionner les decisions durables dans les chapitres canoniques;
5. conserver dans les chapitres canoniques les preuves utiles et la dette
   concrete;
6. supprimer ce plan et `anomalies.md` au plus tard le 2026-08-06, une fois
   toutes les informations utiles fusionnees; Git en conserve l'historique.

## 6. Regle de traitement des anomalies

Chaque anomalie est ajoutee a `anomalies.md` avant correction avec:

- un identifiant stable;
- phase, environnement et identifiants correles;
- attendu, observe et preuve sans secret;
- impact et severite;
- cause racine confirmee ou hypothese explicite;
- correction minimale et raison du choix;
- tests de non-regression;
- resultat de requalification.

Une anomalie bloquante stoppe la phase suivante. Apres correction, le scenario
reprend au dernier point autoritaire stable; il ne saute jamais la preuve qui
avait echoue.

## 7. Strategie de correction

Pour chaque defaut:

1. reproduire et borner l'impact;
2. verifier la source autoritaire et les invariants amont/aval;
3. privilegier une correction structurelle petite et idempotente;
4. ajouter une protection ou un test qui empeche la recurrence;
5. mettre a jour `map.md` et le chapitre canonique si le contrat change;
6. valider localement;
7. deployer uniquement la cible sandbox necessaire;
8. requalifier le parcours visible et les projections serveur.

Les correctifs ne doivent pas ouvrir une dette production differee, redesign
une zone sans rapport, relacher Auth/Rules/App Check ou rendre le navigateur
autoritaire.

## 8. Validations prevues

Socle avant/apres changement commerce:

```text
npm run lint:functions
npm run test:commerce
npm run test:auth
```

Selon le code touche: lint UI cible, build Next, tests catalogue, verification
des routes, recette navigateur sandbox et controle Gmail. Les scripts
`e2e:hosted-stripe` et `e2e:refund-stripe` restent interdits
(`DO_NOT_RUN`). Le rail qualifiant exige toujours `runId`, `orderId`, release,
AAL2/App Check et zero fallback.

Les produits exacts utilises par une campagne sont listes dans sa policy
bornee. Aucun produit hors policy ne doit etre achete ou modifie.

## 9. Definition de done

- annonce publiee et achetee une seule fois par le client lambda;
- compte client toujours sans droit admin;
- commande `paid` visible et exacte sur les deux interfaces;
- e-mails commande client/admin recus, exacts et premium;
- remboursement Stripe test complet et unique;
- remboursement visible et exact sur les deux interfaces;
- e-mails de remboursement attendus recus, exacts et premium;
- documents sandbox immuables et non fiscaux coherents;
- stock, holds, webhooks, inbox/outbox, faits et timeline sans divergence;
- toutes les anomalies fermees ou dette externe explicitement classee;
- controle referme, operations `healthy`, aucun incident ouvert;
- chapitres canoniques mis a jour;
- ce plan et `anomalies.md` fusionnes puis supprimes avant l'echeance.

## 10. Etat de la campagne au 2026-07-30

- annonce reelle publiee depuis `/admin`:
  `product-2c1f1f00-be4c-4508-8b90-559f2357c162`;
- achat reel du client lambda confirme:
  `ord_cf6220c7-890d-4e78-bb6f-c049df51fb08`, 120 EUR, Stripe test;
- commande `paid` verifiee cote client et admin, puis remboursement complet
  unique confirme par Stripe;
- commande `refunded`, montant, delai bancaire et documents sandbox verifies
  dans `/mes-commandes`;
- projection admin Retours `REMBOURSEE`, identifiant Stripe et etat
  `succeeded` verifies;
- outbox paiement et remboursement `sent`, sans derniere erreur et avec
  identifiants fournisseur;
- e-mail de remboursement premium recu et MIME qualifie;
- refonte complete deployee le 2026-07-30: notification admin dediee
  sans BCC, lien direct commande, transitions v2 preparation/expedition/
  livraison/retrait, anomalies de remboursement et OTP visuellement unifies;
- 13 captures de reference generees sous `logs/email-previews/`; 15 Functions
  `ACTIVE`, App Hosting `build-2026-07-30-019` `READY`, rollout `SUCCEEDED`
  et smoke HTTP client/admin `200`; A-011 fermee;
- Gmail sandbox a classe le message client en spam malgre SPF, DKIM et DMARC
  `pass`; dette externe A-010 liee au rail Gmail de recette et au domaine final;
- rapprochement final: commande `refunded`, capture 120 EUR, remboursement
  120 EUR, net zero, produit toujours publie avec stock `0` et inventaire
  version `2`; aucun restock implicite;
- preflight final en lecture seule: operations `healthy`, compteurs de sante
  nuls et controle revision 50 ferme;
- fenetre `v8` refermee a la revision 50:
  `newCheckoutMode=v2_fixture`, `adminMutationMode=read_only`,
  `offlinePaymentMode=off`.

## 11. Execution humaine automatisee du 2026-07-31

Run: `run_v2all_20260731_chrome01`.

### 11.1 Parcours client

- identite `pvml7008@gmail.com` confirmee, sans contexte administrateur;
- achat simple de 750 EUR par retrait reussi:
  `ord_033f4418-2e02-488e-ab68-60f2f24b5629`;
- achat multiple de deux meubles, livraison comprise, total 2 449 EUR reussi:
  `ord_fcc6307f-c996-4c40-b576-b9ce391838e1`;
- panier vide apres paiement, commandes et lignes visibles dans
  `/mes-commandes`, adresse/profil de recette projetes;
- commande simple ensuite affichee `REMBOURSEE`, total rembourse exact et
  delai bancaire correctement explique;
- les documents des deux nouvelles commandes n'etaient pas encore visibles
  au controle immediat; voir A-016 pour la relecture differee.

### 11.2 Parcours administrateur

- Google OAuth reel reussi dans Chrome externe; A-013 est requalifiee fermee;
- les deux commandes, clients, lignes, montants et statuts sont visibles dans
  Ventes;
- publication reussie du meuble non indexable
  `product-6d13f3bf-0f2a-449b-94ad-4c72fda7729d`, catalogue public version
  `198`;
- la protection SEO a correctement refuse une publication indexable sans
  image, puis a autorise la publication apres desactivation explicite de
  l'indexation;
- transitions `EN PREPARATION` puis `PRETE AU RETRAIT` confirmees par l'audit
  durable et les e-mails;
- remboursement complet unique de 750 EUR confirme par Stripe test, sans
  restock automatique;
- l'archivage final du meuble de smoke test reste a faire, voir A-015.

### 11.3 E-mails et rapprochement

- boite client: OTP, confirmations des deux commandes, preparation, pret au
  retrait et remboursement recus;
- ces six messages ont tous ete classes dans `SPAM`, recurrence de A-010;
- boite admin controlee directement dans Chrome: deux notifications de
  nouvelle commande et une confirmation de remboursement presentes dans la
  boite de reception;
- outbox serveur `sent` pour les destinataires client/admin attendus;
- M01, M03, M04, M05, M06, M10 et M11 sont requalifies sur le vrai parcours;
  M02, M07, M08, M09, M12 et M13 restent non executes pendant ce run.

### 11.4 Etat final autoritaire

- commande multiple `paid`, 244 900 centimes, deux lignes commises;
- commande simple `refunded`, remboursement Stripe test unique de 75 000
  centimes et aucun restock implicite;
- operations `healthy`, neuf compteurs a zero, aucun incident ouvert;
- fermeture confirmee a `controlRevision=52`:
  `newCheckoutMode=v2_fixture`, `adminMutationMode=read_only`,
  `offlinePaymentMode=off`;
- aucun correctif de code ni deploiement realise pendant cette recette;
- toute correction applicative issue du registre est reservee a
  `GPT-5.6-sol` apres reproduction et validation.
