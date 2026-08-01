# Factures manuelles administrateur

Derniere mise a jour: 2026-08-01
Statut: `DEPLOYE_SANDBOX_CONTROLES_FERMES`
Point d'entree associe: [jean.md](jean.md)

## 1. Role du document

Ce document decrit le nouvel atelier de facturation manuelle du back-office
Seconde Vie. Il sert de fiche de reprise courte pour Jean et ne remplace pas
les sources canoniques du projet:

- [Back-office](_DOCS/admin/BACKOFFICE.md) pour l'interface administrateur;
- [E-mails transactionnels](_DOCS/email/EMAILS_TRANSACTIONNELS.md) pour le
  transport Gmail/Resend;
- [Donnees et analytics](_DOCS/data/DONNEES_ANALYTICS.md) pour la retention;
- [Qualite et tests](_DOCS/quality/QUALITE_TESTS.md) pour les validations;
- [Cartographie technique](map.md) pour les fichiers, collections et exports.

En cas de contradiction, le code executable puis ces chapitres canoniques
restent autoritaires.

## 2. Besoin couvert

L'administratrice peut produire une facture lorsqu'un client ne retrouve plus
son document ou lorsqu'une vente doit etre facturee manuellement, sans creer
une fausse commande Stripe.

Le parcours est guide en trois etapes:

1. choisir un ou plusieurs meubles dans le catalogue;
2. completer la facture dans un editeur avec apercu A4 en direct;
3. sauvegarder, generer le PDF puis envoyer la facture par e-mail.

La facture peut aussi contenir une ligne libre. Chaque ligne permet de modifier
la designation, la description, la quantite et le prix unitaire. Cette edition
n'affecte ni le prix catalogue, ni le stock, ni une commande commerce.

## 3. Experience administrateur

L'onglet `Factures` se trouve dans le groupe `Ventes` de `/admin`. Sa vue est
chargee paresseusement comme les autres grandes surfaces du back-office.

### 3.1 Accueil

L'accueil presente:

- un bouton `Creer une facture`;
- les trois etapes du parcours;
- les brouillons sauvegardes;
- les factures emises;
- le montant, le client, la date et l'etat d'envoi de chaque document.

### 3.2 Selection des meubles

Le selecteur affiche jusqu'a 300 meubles provenant de `furniture`, y compris
les pieces vendues ou archivees utiles a une facturation a posteriori. Une
recherche par nom ou categorie et une selection multiple sont disponibles.

### 3.3 Editeur

L'editeur regroupe:

- le type de client, particulier ou entreprise;
- le nom, le prenom, l'e-mail, le telephone et l'adresse du client;
- les meubles et lignes libres;
- les dates de facture, de vente et d'echeance;
- le mode et les conditions de reglement;
- une note visible sur le PDF;
- les informations legales de l'entreprise;
- un apercu A4 recalcule en direct.

Les informations emetteur sont memorisees puis preinscrites sur les prochaines
factures. Si le profil n'est pas encore complet, sa section s'ouvre
automatiquement. Le nom legal, l'adresse, l'e-mail et le SIREN sont requis.

### 3.4 Sauvegarde et PDF

Un brouillon reste modifiable. Sa sauvegarde utilise une version attendue afin
d'eviter qu'une session ancienne ecrase silencieusement une modification plus
recente.

Le bouton PDF produit:

- un brouillon marque sans valeur comptable avant emission;
- la facture definitive apres emission.

Le rendu serveur est deterministe: un meme snapshot produit le meme document
et le meme hash.

### 3.5 Envoi par e-mail

La fenetre d'envoi demande l'adresse du destinataire et rappelle les controles
a effectuer. Au premier envoi:

1. un numero `FAC-AAAA-NNNNNN` est attribue dans une transaction;
2. la facture passe de `draft` a `issued`;
3. son contenu est verrouille;
4. le PDF est materialise dans Storage prive;
5. Gmail, ou Resend lorsqu'il sera active, envoie le PDF en piece jointe;
6. le resultat est conserve sous `sent`, `failed` ou `delivery_unknown`.

Une facture emise peut etre telechargee ou renvoyee, mais plus modifiee. Une
correction future devra creer un nouveau document adapte, et non reecrire
l'original.

## 4. Architecture

### Interface

```text
app/admin/AdminAppIsland.jsx
`-- lazy AdminInvoices

src/kit/admin/AdminInvoices.jsx
|-- accueil et historique
|-- selecteur multi-meubles
|-- editeur et apercu A4
|-- sauvegarde et telechargement
`-- modale d'envoi
```

### Backend

```text
functions/src/invoicing/
|-- manualInvoiceDomain.js  validation, montants, hash, numerotation
|-- manualInvoicePdf.js     rendu PDF deterministe
`-- manualInvoices.js       callables, Firestore, Storage et e-mail
```

Exports de `functions/index.js`:

- `getManualInvoiceWorkspaceAdmin`;
- `saveManualInvoiceDraftAdmin`;
- `prepareManualInvoicePdfAdmin`;
- `sendManualInvoiceAdmin`.

## 5. Donnees

```text
Firestore
|-- admin_business_profiles/invoicing
|-- admin_invoices/{invoiceId}
|   |-- artifacts/{contentHash}
|   `-- deliveries/{sendRequestId}
`-- admin_invoice_sequences/{year}

Storage
`-- admin-invoices/v1/{invoiceId}/{contentHash}.pdf
```

Les factures, profils, sequences, artefacts et livraisons sont backend-only.
Les Rules interdisent leur lecture ou ecriture directe depuis le navigateur.
Les PDF `admin-invoices` sont aussi exclus de la lecture publique Storage.

L'adresse e-mail de livraison est validee par le serveur. Le dossier d'envoi
ne conserve que son hash, le provider, l'identifiant fournisseur et l'etat.

## 6. Securite et invariants

Chaque callable exige:

- Firebase Auth;
- App Check;
- un claim administrateur valide;
- un registre `sys_admin_access` actif;
- une assurance forte AAL2.

Les montants sont stockes en centimes entiers. Une facture doit contenir au
moins une ligne et un total strictement positif. Le serveur valide les champs,
les longueurs, les dates, l'e-mail, le SIREN, le SIRET, les quantites et les
montants avant toute sauvegarde.

Le navigateur n'est pas autoritaire sur le numero definitif ni sur l'etat
`issued`. La sequence annuelle et le verrouillage sont attribues par le
backend.

## 7. Validation realisee

Commande cible:

```bash
npm run test:invoices
```

Les quatre contrats couvrent:

- normalisation et calcul en centimes;
- numerotation annuelle;
- coordonnees obligatoires;
- PDF deterministe et borne;
- chargement lazy de l'interface;
- exports des callables;
- confidentialite Firestore et Storage.

Validations terminees le 2026-08-01:

- `npm run test:invoices`: 4 tests verts;
- lint cible: vert, sans avertissement;
- `npm run build`: vert;
- `git diff --check`: vert.

La compilation generale conserve des avertissements historiques hors de ce
perimetre. Aucun avertissement nouveau ne provient de `AdminInvoices`.

## 8. Etat de livraison

- implementation locale: oui;
- deploiement Functions: non;
- deploiement Rules: non;
- deploiement App Hosting: non;
- e-mail reel de recette: non;
- activation production: non.

Le code ne rend donc pas encore l'onglet operationnel sur le sandbox heberge.
Un deploiement futur exige une demande explicite, des cibles Firebase bornees,
un controle du rollout et une recette avec donnees fictives.

## 9. Point juridique avant production

Le regime de TVA selectionne doit correspondre a la situation reelle de
l'entreprise. Le profil legal, les mentions obligatoires, la numerotation, les
conditions de paiement, la conservation et le futur cadre de facturation
electronique doivent etre valides avec la cliente et son conseil comptable ou
juridique avant toute emission de production.

Le choix par defaut `franchise` ajoute la mention
`TVA non applicable, art. 293 B du CGI`. Il ne constitue pas une determination
automatique du regime fiscal de Seconde Vie.

## 10. Fichiers principaux

- [Interface Factures](src/kit/admin/AdminInvoices.jsx)
- [Integration du back-office](app/admin/AdminAppIsland.jsx)
- [Validation metier](functions/src/invoicing/manualInvoiceDomain.js)
- [Generation PDF](functions/src/invoicing/manualInvoicePdf.js)
- [Callables et envoi](functions/src/invoicing/manualInvoices.js)
- [Rules Firestore](firestore.rules)
- [Rules Storage](storage.rules)
- [Tests](tests/invoicing/manual-invoices.test.cjs)

Retour a l'index de travail: [jean.md](jean.md).
