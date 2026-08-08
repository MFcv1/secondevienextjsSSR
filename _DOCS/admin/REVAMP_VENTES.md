# Revamp de la page Ventes (back-office)

Derniere mise a jour: 2026-08-08
Statut: `SPEC_IMPLEMENTATION_ACTIVE`
Perimetre: onglet `orders` du back-office (`AdminOrders`)
Continuite: applique a `Ventes` le vocabulaire visuel et le niveau technique
du revamp `Publication` (`AdminPublicationWorkspace`, `AdminItemList`,
`PublicationActionBar`).

---

## 1. Objectif

La page Ventes doit repondre en moins de trois secondes a la seule question
que se pose la commercante quand elle ouvre le back-office:

> **Qu'est-ce que je dois faire maintenant, et pour qui ?**

Aujourd'hui elle repond a une autre question, beaucoup moins utile:
« quelles sont les 50 dernieres lignes de la collection `orders` ? ».

Le revamp ne change ni le modele de donnees, ni les callables, ni les
commandes commerce. Il change la **hierarchie de l'information**, la
**densite**, la **place des actions** et le **langage visuel**.

---

## 2. Diagnostic de l'existant

Constate sur `src/kit/admin/AdminOrders.jsx` (907 lignes, composant unique).

### 2.1 Structure

| # | Probleme | Consequence |
| --- | --- | --- |
| 1 | Liste plate, tri chronologique seul | Aucune notion d'urgence: une commande payee non preparee est noyee entre deux commandes livrees |
| 2 | Carte de 125 px pour 3 informations | 7 commandes visibles sur un ecran 27" |
| 3 | Cle de lecture = nom du client | Tous les tests s'appellent `ml pv`; aucune reference commande, aucun apercu du panier |
| 4 | Ni recherche, ni filtre, ni segmentation | Retrouver « le buffet de Mme X » impose de derouler 50 cartes |
| 5 | Legende « En cours / Expediees / Terminees » decorative | Elle ne correspond a aucun badge reellement affiche (`Payee`, `Remboursee`, `En preparation`) : elle desinforme |
| 6 | Deux badges independants (paiement + logistique) | `REMBOURSEE` + `PRETE AU RETRAIT` cote a cote est illisible: aucune notion de progression |
| 7 | Actions en bas du panneau deroulant, dans la carte « Contact & livraison » | Il faut deplier puis scroller pour agir; les 5 boutons ont le meme poids visuel, l'action attendue n'est pas identifiable |
| 8 | Accordeon dans un conteneur `max-h-[750px]` scrollable | Le contenu saute a chaque ouverture; l'historique (7 evenements) fait 500 px |
| 9 | `window.confirm` / `alert()` | Ruptures brutales, incoherentes avec la modale d'expedition deja soignee |
| 10 | Champs techniques exposes au meme niveau que le metier | `PaymentIntent`, `UID`, `checkoutAuthMethod`, preuves e-mail au milieu de l'adresse de livraison |

### 2.2 Langage visuel

L'existant empile `font-black uppercase tracking-widest text-[9px]`,
`rounded-3xl`, `shadow-xl`, `border-2`, aplats `bg-emerald-50` sans equivalent
sombre. C'est exactement la signature « genere par IA » que le revamp
Publication a supprimee.

Reference cible (deja en place sur Publication):

```
conteneur ......... rounded-[26px] + border stone-200 / white-10, fond #11110f en sombre
sous-surface ...... #F7F6F3 clair / black-20 sombre, ring-1 black/[0.045]
titre de colonne .. text-[8px] font-extrabold uppercase tracking-[0.12em] stone-400
ligne ............. text-[12px] font-extrabold tracking-[-0.015em]
metadonnee ........ text-[9px] / [10px] font-medium stone-400
chiffres .......... tabular-nums
transition ........ duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
action ronde ...... grid h-8 w-8 place-items-center rounded-full ring-1
action primaire ... pilule sombre + pastille interne (PrimaryAction)
```

---

## 3. Principes du nouveau design

1. **Trier par ce qui reste a faire, pas par date.** La date reste le tri
   interne; l'axe principal devient l'etat d'avancement.
2. **Une commande = une ligne dense** (~56 px), lisible en diagonale.
3. **Un seul indicateur d'etat** au lieu de deux badges: une progression a
   quatre temps, plus une pastille d'exception quand le dossier sort du
   parcours nominal.
4. **L'action attendue est en haut du detail, pas en bas.** Une action
   primaire, le reste en secondaire.
5. **Maitre / detail** plutot qu'accordeon: la liste ne bouge jamais quand on
   consulte une commande.
6. **Le technique se replie.** L'operateur voit du metier; l'ingenieur ouvre
   un `<details>`.
7. **Zero `alert` / `confirm` natif.** Les confirmations passent par la meme
   grammaire de modale que l'expedition.
8. **Parite sombre / clair systematique** et `prefers-reduced-motion`
   respecte.

---

## 4. Modele d'etat presente a l'ecran

Derive **uniquement** de champs deja servis par `listOrdersAdminV2`
(`payment.status`, `fulfillmentSummary.status`, `refundAggregate`, `status`
projete par `adaptCommerceOrder`, `allowedActions`). Aucune nouvelle lecture.

### 4.1 Parcours nominal — 4 temps

| Temps | Libelle | Condition |
| --- | --- | --- |
| 1 | Payee | `payment.status === 'succeeded'` |
| 2 | En preparation | `fulfillmentSummary.status === 'preparing'` |
| 3 | Prete au retrait **ou** Expediee | `ready_for_pickup` / `shipped` |
| 4 | Retiree **ou** Livree | `picked_up` / `delivered` |

Rendu: quatre segments de 14 x 3 px, remplis jusqu'au temps courant.
Le libelle du temps courant est affiche a cote, en clair.

### 4.2 Voies d'exception — pastille, pas de progression

| Etat | Libelle | Ton |
| --- | --- | --- |
| `pending_payment` | En attente de paiement | ambre |
| `payment_failed` | Paiement echoue | rouge |
| `cancelled` / `canceled` | Annulee | rouge |
| `refund_pending` | Remboursement en cours | ambre |
| `refunded` | Remboursee | ciel |
| `refund_failed` | Remboursement a verifier | rouge |
| `needs_review` | A verifier | rouge |

Une commande remboursee **conserve** l'affichage de son etape logistique en
seconde ligne (« Prete au retrait ») : c'est la seule facon de comprendre la
capture 2 sans deux badges concurrents.

### 4.3 Segments de la liste — le coeur du revamp

| Segment | Regle | Sens pour la boutique |
| --- | --- | --- |
| **A traiter** | paiement `succeeded` et logistique dans `{unfulfilled, preparing}`, ou statut dans `{needs_review, refund_pending, refund_failed, payment_failed}`, ou `refundAggregate.hasFailure` | La boutique doit agir |
| **En cours** | logistique dans `{ready_for_pickup, shipped}`, ou paiement en attente | On attend le client, le transporteur ou la banque |
| **Terminees** | logistique dans `{picked_up, delivered, canceled}`, ou statut dans `{completed, refunded, cancelled}` | Dossier clos |
| **Toutes** | tout | Filet de securite |

Segment par defaut: **Toutes** (comportement previsible). Le segment
« A traiter » porte une pastille ambre avec son compte, visible en
permanence: c'est l'appel a l'action, sans jamais cacher une commande a
l'ouverture de la page.

---

## 5. Architecture d'ecran

### 5.1 xl et plus — maitre / detail plein ecran

```
+-------------------------------------------------------------------------+
| Ventes 50    [recherche.............]   [A traiter 4][En cours][Term.]  |
|                                                          [Export CSV]   |
+-----------------------------------------------+-------------------------+
| Client / ref | Panier | Avancee | Date | Total |  Detail de la commande  |
|-----------------------------------------------|                         |
| o ml pv        Buffet      ####    1 aout  350 |  Prochaine etape        |
|   CMD-A1B2C3   +2 autres                       |  [Mettre en prepa.]     |
|-----------------------------------------------|                         |
| o Loa A        Commode     ##--    29 juil 400 |  Parcours (timeline)    |
| ...                                            |  Panier                 |
|                                                |  Client & livraison     |
| [Charger les commandes anterieures]            |  > Details techniques   |
+-----------------------------------------------+-------------------------+
```

- Colonne gauche `minmax(0,1fr)`, colonne droite `minmax(400px, 34%)`.
- Hauteur pleine (`xl:h-[100dvh]`), chaque colonne scrolle independamment.
  Cela impose d'etendre au tab `orders` le mode immersif deja utilise par
  `furniture` dans `app/admin/AdminAppIsland.jsx`.
- **Pas de selection automatique** au chargement: cela declencherait un appel
  `getOrderTimelineAdminV2` non demande a chaque visite. Le panneau vide
  affiche a la place un resume utile (a traiter, en cours, encaisse sur les
  commandes chargees) — l'etat vide devient une information, pas un trou.
- `focusOrderId` (arrivee depuis une notification) selectionne et charge la
  commande visee: comportement actuel conserve.

### 5.2 Sous xl — liste + feuille

Une seule colonne. Le detail s'ouvre en **feuille** (bottom sheet plein
ecran arrondi en haut), meme composant, focus piege, `Escape` pour fermer,
scroll du fond verrouille. On evite ainsi l'accordeon qui deplace la liste.

### 5.3 Ligne de liste

Grille `lg` : `[minmax(220px,2.1fr)] [1.4fr] [1.3fr] [.9fr] [.8fr]`

| Colonne | Contenu |
| --- | --- |
| Commande | pastille d'etat 8 px, nom du client, `CMD-XXXXXXXXXX` en mono 8 px |
| Panier | premier article + `+N autres`, quantite si > 1 |
| Avancee | micro-stepper 4 temps + libelle, ou pastille d'exception |
| Date | date courte + heure, `tabular-nums` |
| Total | montant, `tabular-nums`, aligne a droite |

Hauteur cible 56 px, separateurs `divide-y` 1 px, survol `#FAF9F6`,
selection = anneau + fond emeraude tres dilue (meme code que le highlight
de `AdminItemList`).

### 5.4 Panneau de detail

Ordre impose (du plus actionnable au plus technique):

1. **En-tete** — client, `CMD-…` copiable, montant, pastille d'etat.
2. **Prochaine etape** — une action primaire (pilule sombre, style
   `PrimaryAction`), les autres en actions fantomes. Contextualise par le
   mode de livraison (`deliverySnapshot.id`):
   - `delivery-pickup` en preparation -> primaire « Prete au retrait »;
   - sinon en preparation -> primaire « Confirmer l'expedition ».
   Aucune action n'est proposee si elle n'est pas dans `allowedActions`.
   Quand il n'y a rien a faire: phrase d'etat, pas de bouton grise.
3. **Parcours** — la timeline horodatee, rail vertical continu de 1 px,
   pastille 20 px, libelle et heure sur une seule ligne (~34 px par
   evenement au lieu de 56). Etats `chargement` et `historique indisponible`
   conserves a l'identique.
4. **Panier** — lignes `nom … quantite … prix`, total en pied.
5. **Client & livraison** — e-mail compte, e-mail livraison, telephone,
   adresse, mode de livraison, moyen de paiement, bloc suivi transporteur
   quand `fulfillmentSummary.status === 'shipped'`. Copie en un clic sur
   e-mail, telephone, adresse et numero de suivi.
6. **`<details>` Details techniques** — `PaymentIntent`, `UID`,
   verification checkout, preuves d'e-mail. Replie par defaut.

---

## 6. Decoupage technique

| Fichier | Role | Nature |
| --- | --- | --- |
| `src/kit/admin/AdminOrders.jsx` | conteneur: lectures, commandes commerce, etat d'ecran | orchestrateur, seul point d'appel des callables |
| `src/kit/admin/components/orders/orderPresentation.js` | fonctions pures: normalisation, parcours, segments, recherche, formats, resume | testable sans DOM |
| `src/kit/admin/components/orders/OrderRow.jsx` | une ligne de liste | presentation, `React.memo` |
| `src/kit/admin/components/orders/OrderDetailPanel.jsx` | detail complet (colonne ou feuille) | presentation + rappels |
| `src/kit/admin/components/orders/ShipmentDialog.jsx` | modale expedition / suivi | deplacee depuis `AdminOrders`, restylee |
| `src/kit/admin/components/orders/ConfirmDialog.jsx` | confirmation retrait / livraison / archivage | remplace `window.confirm` |

**Invariant d'architecture**: aucun de ces fichiers n'importe `firebase/firestore`
en ecriture. `setDoc`, `updateDoc`, `deleteDoc`, `refundOrderAdmin` restent
interdits sur toute la surface `orders` — la garde existante de
`tests/commerce/domain/gate5-consumers.test.cjs` est **etendue** aux nouveaux
fichiers, jamais affaiblie.

### 6.1 Qualite d'execution

- derivations (`filtrage`, `segments`, `resume`) memoisees;
- lignes memoisees, rappels stables (`useCallback`);
- pas de nouvel appel reseau: memes callables, memes caches
  (`ADMIN_ORDERS_FIRST_PAGE_KEY`, `loadAdminOrdersFirstPage`,
  `getOrderTimelineAdminV2`, pagination par curseur inchangee);
- l'export CSV exporte **ce que l'operateur voit** (segment + recherche
  appliques) et le nom du fichier le precise;
- squelettes de chargement au lieu d'un vide.

### 6.2 Accessibilite

- liste = `<ul role="list">`, ligne = `<button aria-current>`;
- navigation clavier haut / bas dans la liste, `Entree` ouvre, `Echap` ferme;
- feuille mobile et modales: `role="dialog"`, `aria-modal`, piege de focus,
  restitution du focus a la fermeture;
- `aria-live` sur les messages d'erreur de commande;
- toutes les pastilles ont un libelle textuel, jamais la couleur seule.

---

## 7. Ce qui ne doit pas casser

Verifie ligne a ligne avant modification:

1. **Les etapes de chaque vente** (capture 3): `getOrderTimelineAdminV2`,
   les 12 types d'evenements (`order_created`, `payment_succeeded`,
   `order_cancelled`, `refund_requested`, `refund_succeeded`,
   `refund_failed`, `fulfillment_prepare`, `fulfillment_ready`,
   `fulfillment_pickup`, `fulfillment_ship`, `fulfillment_update_tracking`,
   `fulfillment_deliver`), le repli `fallbackTimeline` pour les commandes
   anciennes, l'etat de chargement.
2. **Le garde-fou `allowedActions`**: aucune action n'est declenchable si le
   serveur ne l'autorise pas; `mutationsEnabled` et
   `COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED` continuent de neutraliser la
   surface, avec le message d'explication.
3. **Le rafraichissement apres commande** (`refreshOrder`): rechargement
   force de la premiere page **et** de la timeline, avec le message
   « commande appliquee mais actualisation echouee » quand la seconde etape
   echoue.
4. **La modale d'expedition**: mode `ship` / `update`, avec ou sans numero de
   suivi, transporteur `other` nomme, message d'erreur, piege de focus.
5. **Le repli schema v1**: `normalizeAdminOrder` conserve la lecture des
   commandes non migrees (`legacyReadOnly`, pas d'action).
6. **La pagination**: curseur v2 (`nextCursor`) et repli `onSnapshot` +
   `orderLimit` quand `COMMERCE_V2_ADMIN_READERS_ENABLED` est faux.
7. **`focusOrderId`**: selection automatique a l'arrivee.
8. **L'export CSV**: memes colonnes qu'aujourd'hui (contrat comptable).

---

## 8. Plan d'implementation

1. `orderPresentation.js` — fonctions pures + resume.
2. `ShipmentDialog.jsx` / `ConfirmDialog.jsx` — modales.
3. `OrderRow.jsx`, `OrderDetailPanel.jsx`.
4. Reecriture de `AdminOrders.jsx` (conteneur).
5. Mode immersif du tab `orders` dans `AdminAppIsland.jsx`.
6. Animations `.sales-*` dans `src/index.css`, alignees sur `.pub-*`.
7. Extension des gardes `gate5-consumers` aux nouveaux fichiers.
8. Mise a jour de `map.md` et `_DOCS/admin/BACKOFFICE.md`.

## 9. Validation

- `pnpm run test:commerce:ui` (gardes consommateurs, surface `orders`);
- `pnpm run test:commerce:unit` (non-regression domaine);
- `pnpm run build` (compilation Next);
- controle visuel clair / sombre, xl et mobile, sur les six etats:
  a traiter, en preparation, prete au retrait, expediee avec suivi,
  remboursee, ancienne commande v1 sans historique.
