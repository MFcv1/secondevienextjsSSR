# Assistant IA pour les demandes de devis

Derniere mise a jour: 2026-08-09
Statut: `COLLECTE_ET_REVUE_ACTIVE - IA_NON_IMPLEMENTEE`

## 1. Decision produit

L'assistant doit ameliorer la qualite des demandes de devis sans devenir un chat libre couteux. Le formulaire structure collecte d'abord les donnees; l'IA intervient ensuite pour analyser, resumer et proposer des questions. Anais garde la validation humaine des prix, travaux et reponses.

La collecte structuree, le stockage `quote_requests`, les photos privees et la
vue admin de revue sont actifs dans le code. Aucune integration IA ne doit etre
supposee active dans le site actuel.

## 2. Cas d'usage

- restaurer un meuble;
- vendre un meuble;
- obtenir une estimation indicative;
- demander conseil sur finition, transformation ou livraison.

Valeur attendue:

- moins d'allers-retours;
- demandes avec photos/dimensions/etat;
- resume admin uniforme;
- questions manquantes explicites;
- brouillon de reponse a relire;
- base de cas similaires gouvernee.

## 3. MVP recommande

### Etape A - collecte sans IA

Champs:

- intention;
- type de meuble;
- dimensions;
- materiaux;
- etat et defauts;
- objectif de restauration;
- localisation et delai;
- budget facultatif;
- description;
- jusqu'a trois photos compressees;
- contact minimal et consentement.

Pas d'appel IA avant un contexte minimum exploitable.

### Etape B - analyse serveur

L'appel peut:

- decrire les observations visibles;
- distinguer faits, hypotheses et inconnues;
- proposer les questions manquantes;
- classer la demande;
- rapprocher des cas metier autorises;
- produire une fourchette indicative avec avertissement;
- generer un resume et un brouillon admin.

### Etape C - revue humaine

L'admin corrige, complete et valide avant envoi. Aucun devis contractuel ni engagement de prix ne part automatiquement.

## 4. Architecture cible

```text
/devis (formulaire guide)
  -> callables publiques App Check et rate-limitees
  -> upload medias borne, re-encode et prive
  -> quote_requests/{quoteId}
  -> vue admin de revue protegee AAL2
  -> accusé de réception client asynchrone
  -> [future] route serveur IA
  -> fournisseur IA avec sortie structuree
  -> reponse humaine
```

La cle fournisseur reste uniquement serveur. L'appel doit etre trace par identifiant, latence, modele, tokens/cout estime et resultat, sans stocker de contenu personnel inutile dans les logs.

## 5. Modele de donnees propose

```text
quote_requests/{quoteId}
  customer
  consent
  intent
  furniture
  photoUrls
  clientDescription
  aiAnalysis
  missingQuestions
  estimateRange
  similarCaseIds
  adminDraft
  status
  createdAt / updatedAt
```

Statuts possibles:

```text
draft_client
submitted
ai_analyzed
needs_human_review
waiting_customer_info
quote_sent
closed
```

Ils restent a confirmer avant implementation.

## 6. Sortie IA

Utiliser un schema structure, par exemple:

```text
observations[]
hypotheses[]
missing_information[]
recommended_next_questions[]
service_category
complexity_level
indicative_estimate { min, max, currency, assumptions }
admin_summary
customer_draft
safety_flags[]
```

Le backend valide le schema et refuse une sortie libre incomplete.

## 7. Garde-fous

L'IA peut assister; elle ne doit pas:

- garantir une essence, une epoque ou une authenticite sur photo;
- diagnostiquer un risque structurel avec certitude;
- donner un prix contractuel;
- confirmer une disponibilite atelier ou livraison;
- modifier une annonce, une commande ou un devis sans validation;
- collecter des donnees personnelles inutiles;
- reutiliser les photos hors finalite annoncee;
- recevoir des secrets ou donnees admin non necessaires.

Les textes client doivent rappeler que l'estimation est indicative et soumise a inspection/validation.

## 8. Cout et anti-abus

- formulaire structure avant IA;
- limite de photos, pixels et taille;
- un appel principal par soumission;
- rate limit IP/session/compte;
- quota journalier et alerte;
- modele adapte a la tache, choisi au moment de l'implementation;
- cache uniquement pour les contenus non personnels et strictement equivalents;
- timeout et fallback vers une demande classique;
- aucune boucle agent autonome au MVP.

## 9. Confidentialite

Avant lancement:

- informer sur le traitement IA;
- definir retention photos/demandes;
- obtenir le consentement adapte;
- permettre suppression selon obligations;
- verifier localisation et conditions du fournisseur;
- mettre a jour politique de confidentialite et sous-traitants;
- separer donnees metier de reference et donnees client.

## 10. Phases fermees

1. formulaire guide sans IA — implemente;
2. stockage `quote_requests` + vue admin — implemente;
3. appel IA serveur structure et garde-fous;
4. base de cas similaires validee;
5. mesure qualite/cout;
6. eventuelle bulle site-wide seulement apres stabilisation du devis.

La bulle globale n'appartient pas au MVP initial.

## 11. Definition de done MVP

- collecte utilisable sans IA;
- photos compressees et protegees;
- cle jamais exposee au client;
- sortie structuree validee;
- rate limits et quotas;
- fallback sans IA;
- revue humaine obligatoire;
- cout et latence visibles;
- tests prompt/schema et cas adverses;
- mentions legales/confidentialite validees;
- documentation et `map.md` mis a jour.

Lors de la reprise, consulter la documentation officielle a jour du fournisseur choisi avant d'ecrire l'integration.
