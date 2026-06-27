# Playbook agent - Micro-frictions UI/UX

Objectif: aider un agent a detecter les petites anomalies UI/UX qui ne sont pas toujours des bugs techniques, mais qui cassent la fluidite percue du site: etats qui restent ouverts, libelles qui ne correspondent pas a l'intention, overlays en concurrence, priorites visuelles incoherentes, retours utilisateur ambigus.

Ce playbook doit servir avant une passe d'audit UI/UX generale sur les parcours publics, checkout, panier, menu, wishlist, compte client et back-office. Il ne doit pas etre utilise comme une liste de bugs deja connus a rechercher, mais comme une grille de lecture.

## Nom du sujet

Appeler ces sujets:

- micro-frictions UX;
- anomalies de coherence UI;
- conflits d'etat d'interface;
- dettes de parcours utilisateur;
- details de priorite visuelle et d'intention.

## Posture d'audit

Chercher ce que l'utilisateur voulait faire, puis verifier si l'interface accompagne vraiment cette intention.

Ne pas se limiter a "le clic fonctionne". Demander plutot:

- Est-ce que l'action affichee correspond a ce qui va arriver?
- Est-ce que l'utilisateur garde le controle de son parcours?
- Est-ce qu'un ancien etat visuel reste affiche alors qu'un nouvel etat prioritaire s'ouvre?
- Est-ce qu'un panneau, modal, drawer ou menu peut se retrouver derriere un autre?
- Est-ce qu'une action secondaire risque de faire croire a une validation, annulation ou perte de donnees?
- Est-ce que le wording rassure sur ce qui est conserve, supprime, valide ou encore modifiable?

## Zones a inspecter

Prioriser les zones ou plusieurs etats interactifs peuvent coexister:

- header desktop et mobile;
- menu global, mega menu, recherche, compte, panier, wishlist;
- checkout et retour vers la galerie;
- modales de paiement, login, confirmation, erreurs;
- detail produit, ajout panier, stock indisponible, devis;
- parcours client: commandes, wishlist, retour boutique;
- back-office quand une action admin ouvre un panneau ou modifie un statut.

## Familles de micro-frictions

### 1. Conflits d'overlays

Verifier les menus, panels, drawers, modales et toasts.

Signaux:

- un overlay reste ouvert quand un autre s'ouvre;
- le header change d'etat mais pas le panneau associe;
- un drawer est visuellement derriere un menu;
- un backdrop bloque le clic alors que le panneau visible n'est plus le bon;
- Escape, close, navigation ou ouverture d'un autre outil ne ferment pas l'etat precedent.

Correction typique: centraliser ou propager un evenement de fermeture d'overlays concurrents, puis donner la priorite au nouvel overlay.

### 2. Wording et intention utilisateur

Verifier que le libelle de bouton decrit l'intention reelle, pas seulement l'implementation.

Signaux:

- "Retour" peut signifier perdre une etape, revenir a un drawer ou continuer les achats;
- "Valider" apparait avant une confirmation durable;
- "Annuler" ne dit pas si le panier, le stock ou la commande pending est conserve;
- une action technique est exposee au lieu d'une action utilisateur.

Correction typique: renommer l'action selon le resultat attendu et ajuster la navigation sans changer les donnees si l'utilisateur n'a rien confirme.

### 3. Conservation et perte de donnees

Verifier les transitions ou l'utilisateur peut craindre de perdre son panier, formulaire, choix de livraison ou paiement.

Signaux:

- quitter une page de checkout donne l'impression d'annuler le panier;
- fermer une modale de paiement ne clarifie pas le statut de commande;
- changer de page efface un choix sans confirmation;
- une commande pending est creee alors que l'utilisateur pense seulement consulter l'etape suivante.

Correction typique: conserver les donnees tant qu'une action finale n'est pas confirmee, et clarifier le libelle ou le message de retour.

### 4. Priorite visuelle

Verifier que l'element le plus important est devant, lisible et cliquable.

Signaux:

- badge, menu, drawer ou toast masque un bouton critique;
- z-index incoherent entre header, menu, panier et modal;
- un ancien panneau garde des zones cliquables invisibles;
- le scroll de page et le scroll interne se battent.

Correction typique: fermer l'etat concurrent, corriger le stacking context, ou isoler les scroll regions.

### 5. Parcours non lineaires

Verifier les cas ou l'utilisateur revient en arriere, ajoute autre chose, change d'avis ou reprend plus tard.

Signaux:

- le parcours suppose un achat immediat;
- "retour" ramene au mauvais niveau;
- continuer ses achats est plus naturel qu'ouvrir le panier;
- une route directe ne restaure pas l'etat attendu.

Correction typique: privilegier une route stable, souvent `/galerie`, et garder panier/wishlist/formulaires coherents.

## Methode rapide sans validation lourde

Quand l'utilisateur demande seulement un correctif ou un audit court:

1. Lire les composants qui pilotent les etats interactifs concernes.
2. Identifier les etats concurrents: `isOpen`, `panelOpen`, `modalOpen`, `drawerOpen`, `checkoutState`, events `sv:*`.
3. Rechercher les transitions utilisateur: click header, open cart, close menu, checkout back, add product, payment cancel.
4. Corriger au point d'orchestration le plus petit possible.
5. Ne pas lancer de build, serveur, Playwright ou validation visuelle sauf demande explicite.
6. Indiquer dans le compte rendu ce qui a ete modifie et ce qui n'a pas ete valide.

## Methode d'audit approfondi

Quand l'utilisateur demande explicitement une passe d'audit UI/UX:

1. Lister 5 a 8 parcours critiques.
2. Pour chaque parcours, noter l'intention utilisateur.
3. Lire le code des composants d'etat et les evenements globaux.
4. Chercher les incoherences par familles: overlays, wording, donnees, priorite visuelle, retour/navigation.
5. Produire une liste de constats actionnables, sans patcher si l'utilisateur a demande seulement un audit.
6. Si l'utilisateur demande correction, patcher les cas un par un en gardant le scope etroit.

## Heuristiques de recherche code

Requetes utiles:

```bash
rg -n "isOpen|open|close|panelOpen|modal|drawer|toast|z-|z\\[|sv:|onBack|Retour|Annuler|Valider|checkoutState" app src -S
rg -n "window.dispatchEvent|addEventListener|CustomEvent|router.push|location.href|location.assign" app src -S
rg -n "panier|checkout|wishlist|menu|login|commande|paiement|retour" app src -S
```

Chercher aussi les duplications de responsabilite:

- plusieurs composants ouvrent le meme panel;
- un composant emet un event mais ne ferme pas ses concurrents;
- une page garde une action legacy alors que le parcours Next a change;
- un libelle francais est reste d'une ancienne architecture.

## Definition d'un bon correctif

Un bon correctif:

- respecte l'intention utilisateur;
- garde les donnees tant qu'aucune action finale n'est confirmee;
- ferme ou neutralise les etats concurrents;
- evite les regressions de navigation;
- ne transforme pas une micro-friction en refactor global;
- garde le wording simple et actionnable.

## Compte rendu attendu

Format court:

- nommer la micro-friction traitee;
- citer les fichiers modifies;
- expliquer l'effet utilisateur en une phrase;
- dire explicitement si aucune validation runtime n'a ete lancee.

Exemple:

```text
Micro-friction corrigee: conflit entre deux overlays concurrents.
Le nouveau panel ferme maintenant les overlays de navigation avant de s'ouvrir, ce qui garantit qu'il reste visible et cliquable.
Validation: controle diff uniquement, pas de build ni test visuel.
```
