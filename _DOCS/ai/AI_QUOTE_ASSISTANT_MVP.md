# Assistant IA devis Seconde Vie - MVP

Document de cadrage pour permettre a Codex avec le plugin OpenAI Developers de construire un premier assistant IA specialise Seconde Vie.

Objectif: remplacer progressivement la page devis brute par un parcours guide, economique en tokens, qui collecte un contexte propre avant d'appeler l'IA. L'IA ne doit pas devenir un chat libre des le depart: elle intervient quand les donnees utiles sont deja structurees.

---

## Vision produit

L'assistant doit aider un visiteur a preparer une demande de devis pour:

- vendre un meuble;
- restaurer un meuble;
- obtenir une estimation indicative;
- demander conseil sur un meuble, une finition, une livraison ou une transformation.

Le gain attendu pour la gerante:

- recevoir des demandes plus completes;
- eviter les allers-retours par email pour les infos manquantes;
- obtenir un resume clair de chaque projet;
- prequalifier les demandes selon type de meuble, etat, urgence, photos et budget;
- proposer une reponse brouillon prete a relire;
- enrichir progressivement une base metier de cas similaires.

Principe important: l'IA assiste, mais ne remplace pas la validation humaine. Les prix restent indicatifs tant qu'Anais n'a pas valide.

---

## Parcours MVP recommande

### 1. Collecte guidee sans IA

La page `/devis` affiche une interface de type conversation/formulaire avec choix rapides.

Message initial:

```txt
Bonjour, je peux vous aider a preparer votre demande pour Anais. Que souhaitez-vous faire ?
```

Choix rapides:

- Je veux restaurer un meuble
- Je veux vendre un meuble
- Je veux une estimation
- Je veux un conseil avant de me decider

Questions guidees:

- type de meuble: buffet, commode, table, chaise, fauteuil, armoire, miroir, luminaire, autre;
- dimensions: largeur, hauteur, profondeur;
- matiere: bois massif, placage, metal, rotin/cannage, tissu, inconnu;
- etat percu: bon etat, rayures, vernis jauni, structure fragile, placage abime, humidite, pieces manquantes;
- objectif: restauration proche de l'origine, modernisation, revente, simple avis;
- localisation;
- delai souhaite;
- budget si connu;
- description libre;
- photos.

Contraintes MVP:

- limiter l'upload a 3 photos au debut;
- compresser/redimensionner les photos cote client avant upload/analyse;
- demander au moins 1 photo de face et idealement 1 photo des defauts;
- ne pas appeler OpenAI tant que les champs minimum ne sont pas presents.

Champs minimum avant appel IA:

- intention;
- type de meuble ou "autre";
- description libre;
- au moins une photo ou une description detaillee;
- contact minimal si creation de demande.

### 2. Appel IA seulement apres contexte minimum

Quand le contexte est pret, le backend appelle OpenAI pour:

- analyser les photos;
- extraire les defauts visibles;
- classer le meuble;
- detecter les informations manquantes;
- chercher les cas similaires dans la base metier;
- proposer une estimation indicative;
- produire un resume admin.

L'IA doit toujours distinguer:

- observations visibles;
- hypotheses;
- informations manquantes;
- estimation indicative;
- decision a valider par Anais.

### 3. Creation d'une demande admin

Le MVP doit enregistrer une demande structuree dans Firestore, par exemple `quote_requests/{quoteId}`.

La demande doit contenir:

- donnees client;
- intention;
- donnees meuble;
- URLs photos;
- analyse IA;
- estimation indicative;
- questions manquantes;
- cas metier similaires;
- brouillon de reponse;
- statut admin.

Statuts proposes:

- `draft_client`
- `ai_analyzed`
- `needs_human_review`
- `waiting_customer_info`
- `quote_sent`
- `closed`

---

## Architecture technique cible

## Deux experiences IA distinctes

Il faut bien separer deux produits dans le meme ecosysteme IA.

### Experience A - Page devis type ChatGPT guide

Sur `/devis`, l'interface peut ressembler a une vraie conversation pleine page, proche d'un chat ChatGPT, mais avec des etapes guidees.

Role:

- accompagner une demande longue;
- accepter photos et description detaillee;
- poser des questions de qualification;
- analyser le meuble;
- pre-remplir une demande admin;
- produire un resume complet pour Anais.

UI attendue:

- zone conversationnelle principale;
- choix rapides au debut;
- formulaire progressif integre dans le fil;
- upload photos visible;
- resume final avant envoi;
- bouton clair "Envoyer ma demande a Anais".

Contexte autorise:

- contexte complet de la demande;
- photos;
- cas metier similaires;
- historique court de la conversation;
- donnees client necessaires au devis.

Cette experience peut consommer plus de tokens, car elle intervient sur une demande a forte valeur.

### Experience B - Extension flottante site-wide

Sur la galerie, les pages produit, la home, les categories et eventuellement `/a-propos`, l'assistant doit plutot etre une bulle compacte en bas a droite du site, comme les assistants Amazon, Autodoc ou support client.

Ce n'est pas un chat plein ecran. C'est une extension flottante:

- bouton rond ou capsule en bas a droite;
- panneau compact quand on clique;
- categories de questions avant chat libre;
- reponses courtes;
- redirection vers les bonnes actions;
- escalade vers `/devis` si la demande devient complexe.

Categories rapides possibles:

- Disponibilite d'un produit
- Livraison et retrait
- Paiement
- Restaurer un meuble
- Vendre un meuble
- Conseils style et dimensions
- Suivi de commande
- Contacter Anais

Contexte transmis a l'IA:

- page courante;
- produit courant si l'utilisateur est sur une fiche produit;
- categorie courante;
- panier/wishlist uniquement si autorise et utile;
- question choisie via les boutons;
- extrait de FAQ ou politique pertinente;
- resultats catalogue limites si l'utilisateur cherche un produit.

Exemples:

- sur une fiche produit, la bulle connait le nom, prix, stock, dimensions et livraison du produit;
- sur une categorie, elle peut proposer des filtres ou rediriger vers des produits;
- sur la galerie, elle peut aider a trouver "une commode claire sous 400 euros";
- si l'utilisateur demande une estimation de son meuble, elle bascule vers le parcours `/devis`.

Garde-fous de la bulle:

- pas d'analyse photo dans la bulle site-wide au MVP;
- pas de devis complet dans la bulle;
- pas de chat libre illimite;
- reponses courtes par defaut;
- 3 a 5 tours maximum avant proposition d'action;
- si la question devient metier/devis, rediriger vers `/devis`;
- si la question concerne une commande, demander une authentification ou rediriger vers l'espace client.

Composants probables:

- `src/kit/marketplace/AiSupportBubbleIsland.jsx`
- `src/kit/marketplace/AiSupportPanel.jsx`
- `app/api/ai-support/message/route.js`

Outils backend possibles:

- `getCurrentProductContext(productId)`
- `searchPublicCatalog(query)`
- `getDeliveryPolicy()`
- `getQuoteEntryPoint(intent)`
- `createSupportLead(data)` si l'utilisateur veut etre recontacte.

Regle de priorite:

- `/devis` = assistant profond, conversationnel, oriente creation de demande;
- bulle site-wide = assistant leger, navigation/support/conseil, oriente action rapide.

### Frontend

Fichiers actuels lies au devis:

- `app/devis/page.jsx`
- `src/kit/marketplace/QuoteRequestServerView.jsx`
- `src/kit/marketplace/QuoteFormIsland.jsx`

Evolution MVP:

- garder `QuoteRequestServerView` comme page SSR;
- remplacer ou encapsuler `QuoteFormIsland` par une ile client dediee, par exemple `QuoteAssistantIsland.jsx`;
- conserver un fallback formulaire simple si l'IA est indisponible;
- afficher un parcours guide, puis seulement ensuite une zone de reponse IA.

### Backend Next

Routes API recommandees:

- `app/api/quote-assistant/analyze/route.js`
- `app/api/quote-assistant/create-request/route.js`
- `app/api/quote-assistant/message/route.js` si une vraie conversation est ajoutee plus tard.

Responsabilites backend:

- verifier les limites;
- valider les champs;
- recuperer les cas metier pertinents;
- appeler OpenAI;
- verifier la sortie structuree;
- enregistrer la demande;
- ne jamais exposer `OPENAI_API_KEY` au navigateur.

### OpenAI

Modele recommande pour le MVP:

- modele principal: modele `mini` recent pour classification, chat guide et extraction;
- modele plus fort seulement pour l'analyse finale avec photos si la qualite du devis le justifie.

Le plugin OpenAI Developers peut aider demain a:

- configurer une cle API OpenAI locale/projet;
- verifier la doc OpenAI actuelle;
- proposer le bon SDK;
- construire les routes API;
- structurer les prompts et schemas;
- ajouter les garde-fous.

### Firebase / Firestore

Collections recommandees:

```txt
quote_requests
quote_cases
quote_assistant_sessions
quote_knowledge
```

`quote_requests`: demandes client.

`quote_cases`: base metier validee par la gerante.

`quote_assistant_sessions`: historique limite d'une session de devis.

`quote_knowledge`: FAQ, livraison, restauration, conditions, ton de marque, reponses types.

---

## Base metier des cas similaires

La base metier est la vraie valeur du systeme. L'IA ne doit pas inventer les prix: elle doit comparer la demande utilisateur a des cas valides par la gerante.

Exemple de document `quote_cases/{caseId}`:

```json
{
  "title": "Buffet ancien - vernis jauni et rayures legeres",
  "furnitureType": "buffet",
  "intent": "restoration",
  "materials": ["bois", "placage"],
  "detectedIssues": ["vernis_jauni", "rayures_surface"],
  "conditionLevel": "standard",
  "restorationSteps": [
    "nettoyage",
    "poncage_leger",
    "reprise_teinte",
    "finition_mate"
  ],
  "priceRange": {
    "min": 180,
    "max": 320,
    "currency": "EUR"
  },
  "durationRange": {
    "minWeeks": 1,
    "maxWeeks": 3
  },
  "questionsToAsk": [
    "Dimensions exactes",
    "Photo du plateau",
    "Photo de l'arriere",
    "Presence d'humidite"
  ],
  "managerNotes": "Prix a ajuster si placage decolle ou structure instable.",
  "active": true,
  "validatedByManager": true
}
```

Matching MVP:

- filtrer d'abord par `furnitureType` et `intent`;
- comparer les `detectedIssues`;
- prendre 3 a 5 cas proches;
- donner ces cas a l'IA comme contexte;
- demander une estimation uniquement si un cas similaire existe.

Regle de prudence:

- si aucun cas proche n'est trouve, l'IA ne donne pas de prix precis;
- elle peut dire que l'etude humaine est necessaire;
- elle liste les informations manquantes.

---

## Memoire et contexte

L'IA ne doit pas "se souvenir" toute seule. Le serveur reconstruit le contexte a chaque appel.

Contexte permanent:

- prompt systeme Seconde Vie;
- ton d'Anais;
- regles de prudence;
- interdictions;
- format de sortie.

Contexte session:

- choix utilisateur;
- description;
- photos;
- derniers messages;
- resume court de la conversation.

Contexte metier:

- cas similaires `quote_cases`;
- FAQ et politiques du site;
- donnees catalogue utiles si la question concerne un produit.

Memoire longue:

- a eviter au MVP sauf consentement clair;
- stocker seulement les donnees necessaires a la demande de devis.

---

## Garde-fous obligatoires

### Ce que l'IA peut faire

- guider le client;
- poser des questions;
- analyser visuellement les photos de facon indicative;
- proposer des hypotheses;
- pre-remplir une demande;
- proposer une fourchette indicative si un cas metier similaire existe;
- preparer un brouillon pour Anais.

### Ce que l'IA ne doit pas faire

- promettre un prix final;
- garantir une valeur de rachat;
- affirmer avec certitude une essence de bois, une epoque ou une authenticite seulement depuis photo;
- promettre un delai ferme sans validation humaine;
- accepter une commande ou un paiement;
- donner des conseils dangereux de bricolage ou produits chimiques;
- collecter des donnees personnelles inutiles.

### Reponse type prudente

```txt
A premiere vue, votre meuble semble correspondre a une restauration standard, mais cette estimation reste indicative. Anais devra confirmer apres verification des photos et des dimensions.
```

---

## Sortie structuree attendue de l'IA

Le backend doit demander une sortie JSON stricte.

Schema cible:

```json
{
  "intent": "restoration_quote",
  "furnitureType": "buffet",
  "confidence": 0.82,
  "visibleObservations": [
    "vernis jauni",
    "rayures visibles sur le plateau"
  ],
  "detectedIssues": [
    "vernis_jauni",
    "rayures_surface"
  ],
  "conditionLevel": "standard",
  "missingInformation": [
    "dimensions exactes",
    "photo de l'arriere"
  ],
  "matchedCaseIds": [
    "case_buffet_vernis_rayures_standard"
  ],
  "estimatedPriceRange": {
    "min": 180,
    "max": 320,
    "currency": "EUR",
    "confidence": "medium"
  },
  "restorationSteps": [
    "nettoyage",
    "poncage leger",
    "reprise teinte",
    "finition de protection"
  ],
  "customerMessage": "Merci pour les photos. A premiere vue...",
  "adminSummary": "Client souhaite restaurer un buffet...",
  "adminSuggestedReply": "Bonjour, merci pour votre demande..."
}
```

Le backend doit rejeter ou corriger toute sortie qui:

- manque de champs obligatoires;
- contient un prix final non indicatif;
- contient une promesse trop ferme;
- ne respecte pas le vocabulaire metier autorise.

---

## Prompt systeme initial

Version de depart a utiliser et affiner:

```txt
Tu es l'assistant IA de Seconde Vie, atelier et marketplace de mobilier ancien et restaure.
Tu aides les visiteurs a preparer une demande de devis claire pour Anais, la gerante.

Ton:
- chaleureux;
- professionnel;
- artisanal;
- precis;
- jamais arrogant;
- jamais trop commercial.

Regles:
- Tu ne donnes jamais de prix final.
- Tu donnes seulement une estimation indicative si le contexte et les cas metier fournis le permettent.
- Tu distingues toujours observation visible, hypothese et validation humaine.
- Tu demandes les informations manquantes quand elles sont importantes.
- Tu ne promets pas de delai ferme.
- Tu n'inventes pas les politiques du site.
- Tu t'appuies uniquement sur les donnees et cas metier fournis par le backend.
- Si une question sort du cadre Seconde Vie, tu reorientes poliment.

Objectif:
- aider le client a comprendre les prochaines etapes;
- produire un resume utile pour Anais;
- reduire les allers-retours inutiles.
```

---

## Limites cout et anti-abus

MVP recommande:

- 3 photos maximum au debut;
- taille compressee avant analyse;
- 1 analyse IA finale gratuite par session;
- pas de chat libre illimite;
- 8 messages maximum si la conversation libre est activee;
- cooldown par IP/session;
- captcha ou App Check si abus;
- journaliser cout estime et nombre d'appels.

Ne pas envoyer:

- toute la base de connaissance;
- tout l'historique complet;
- toutes les photos en pleine resolution;
- les secrets;
- les donnees admin non necessaires.

Optimisation:

- collecter d'abord sans IA;
- resumer la session;
- envoyer seulement les cas similaires;
- utiliser un modele mini pour extraction/classification;
- reserver le modele plus fort a l'analyse finale.

---

## Admin MVP

Ajouter plus tard dans le back-office une vue "Demandes IA".

Champs affiches:

- nom client;
- email;
- telephone;
- intention;
- type de meuble;
- photos;
- estimation indicative;
- niveau de confiance;
- infos manquantes;
- resume IA;
- reponse suggeree;
- bouton "Valider";
- bouton "Demander plus d'infos";
- bouton "Corriger l'analyse".

Important: chaque correction d'Anais doit pouvoir enrichir la base metier.

Exemple:

- l'IA propose `standard`, Anais corrige en `lourd`;
- le systeme peut proposer de creer ou mettre a jour un `quote_case`;
- cette correction ameliore les prochaines analyses.

---

## Etapes d'implementation recommandees

### Phase 1 - MVP sans OpenAI

- Creer `QuoteAssistantIsland.jsx`.
- Transformer le devis en parcours guide.
- Limiter les photos a 3.
- Remplacer le `mailto:` direct par une creation de demande structuree.
- Garder un fallback `mailto:` si backend indisponible.

### Phase 2 - OpenAI analyse finale

- Ajouter `OPENAI_API_KEY` cote serveur uniquement.
- Ajouter route API d'analyse.
- Construire prompt systeme + schema JSON.
- Appeler l'IA apres collecte minimum.
- Enregistrer l'analyse dans `quote_requests`.

### Phase 3 - Base metier

- Creer collection `quote_cases`.
- Seed manuel de 10 a 20 cas valides par Anais.
- Ajouter matching simple cote serveur.
- Donner les cas proches a l'IA.
- Bloquer les prix si aucun cas proche.

### Phase 4 - Admin

- Ajouter une page admin demandes IA.
- Ajouter validation/correction humaine.
- Ajouter generation de brouillon email.
- Ajouter enrichissement de la base metier depuis les corrections.

### Phase 5 - Extension IA flottante site-wide

- Ajouter une bulle compacte en bas a droite, differente de l'experience `/devis`;
- commencer par des categories de questions cliquables;
- transmettre le contexte de page courant au backend;
- brancher catalogue public et FAQ/politiques;
- repondre court, puis proposer une action;
- rediriger vers `/devis` pour toute demande d'estimation, vente ou restauration complexe;
- limiter strictement les outils accessibles;
- ne pas melanger l'etat conversationnel de la bulle avec l'assistant devis tant que le MVP devis n'est pas stable.

---

## Definition of Done MVP

Le MVP est considere pret si:

- la page `/devis` collecte un contexte structure avant IA;
- l'utilisateur peut deposer des photos limitees;
- l'appel IA ne se fait qu'a la fin;
- l'analyse renvoie un JSON valide;
- une demande est creee dans Firestore;
- l'admin peut lire le resume et les photos;
- aucun prix final n'est promis;
- la cle OpenAI n'est jamais exposee au client;
- une panne IA laisse un chemin formulaire classique.

---

## Notes pour le prochain agent Codex

Avant implementation:

- utiliser le plugin OpenAI Developers pour verifier la doc API actuelle;
- configurer la cle API via le flux OpenAI Developers si necessaire;
- ne pas lancer de validation longue sauf demande explicite;
- respecter la discipline env du projet: `.env.sandbox` et `.env.production`, jamais `.env` racine;
- eviter de toucher a la galerie/mobile sauf necessite;
- mettre a jour cette roadmap si des choix techniques changent.

Point d'integration probable:

- `src/kit/marketplace/QuoteFormIsland.jsx` est le composant a remplacer progressivement;
- `src/kit/marketplace/QuoteRequestServerView.jsx` peut rester le shell SSR;
- une nouvelle route API Next est preferable pour garder OpenAI cote serveur.
