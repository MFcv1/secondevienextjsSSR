# Rangement documentaire

Revue : 2026-09-04. Propriétaire : équipe Seconde Vie.
Statut : `RANGEMENT_EFFECTUE_CONTROLES_LOCAUX`.
Ce compte rendu décrit la passe documentaire, pas une qualification cloud.

## Résultat

Le problème principal n'était pas le nombre de fichiers : les règles, états
courants, recettes, anciens audits et journaux étaient mélangés. Une même
décision était recopiée puis mise à jour seulement à certains endroits.

| Entrée | Avant | Après |
| --- | ---: | ---: |
| AGENTS | 613 lignes / 31 021 octets | 150 lignes / 9 191 octets |
| Carte technique | 1 566 lignes / 93 238 octets | 119 lignes / 9 403 octets |
| Synthèse commerce | 372 lignes | 97 lignes |
| Reprise commerce | 411 lignes | 81 lignes |

Le couple AGENTS + carte passe de 124 259 à 18 594 octets (**−85 %**).
Ce n'est pas une mesure de tokens ni une garantie de contexte total.
Les détails utiles restent accessibles par sujet, sans être imposés à chaque tâche.

## Organisation retenue

| Fichier / dossier | Rôle |
| --- | --- |
| [README](../README.md) | Produit, intentions et manière de le faire évoluer |
| [AGENTS](../AGENTS.md) | Règles transverses et lecture ciblée |
| [État du projet](../_DOCS/ETAT_PROJET.md) | Réalisé, local, déployé/documenté, restant et différé |
| [Carte](../map.md) | Trouver les points d'entrée exécutables |
| [Index technique](../_DOCS/README.md) | Un contrat maintenu par domaine |
| Suivis ouverts | Preuves et gates propres au chantier, à ouvrir seulement si utile |
| [Archives](archives/README.md) | Anciennes notes et photographies avant réécriture |

Aucun nouveau système de documentation, base de données ou générateur.
Les contrats longs gardent leur place lorsqu'ils servent au diagnostic ou à
l'exploitation. Le volume historique total n'est pas artificiellement effacé.

## Inventaire et décisions

L'[inventaire exhaustif](archives/2026-09-04/INVENTAIRE.md) couvre les **270
Markdown du dépôt hors générés/dépendances** : 42 documents projet et 228
fichiers dans 33 skills de projet. Un rapport local ignoré supplémentaire a
été repéré par métadonnées seulement ; aucun scan de sécurité n'a été exécuté.

Neuf notes/plans/lanceurs retirés des emplacements actifs, treize photographies
conservées au total. Leur [classement](archives/README.md) indique le relais
utile. Aucun historique n'est perdu. Les plans encore ouverts, le registre
d'anomalies et les preuves Gen2 ne sont pas classés « finis » par ancienneté.

Les 33 skills ont été inventoriés (structure, poids, déclencheurs, liens et
doublons exacts). Les bases de références design sont des bibliothèques
spécialisées, pas l'état du projet ; aucune suppression sur la seule taille.
Le skill client/admin a été simplifié et raccordé à une procédure unique.
Cette passe ne prétend pas avoir réécrit sémantiquement les 228 fichiers de skills.

## Incohérences corrigées

- Commerce fermé temporairement en juillet vs ouverture durable décidée le
  25 août : état courant séparé des anciennes campagnes.
- Gen1 « toutes conservées », hold Meta encore affiché et anciens comptages :
  étapes datées, inventaire de référence dans l'ADR, sans fausse vérification cloud.
- Data `overview_bundle` présenté comme lecteur courant malgré P4/P5 :
  ancien lecteur identifié comme historique/hors flag.
- Redirection admin automatique contredite par le correctif courant :
  comportement de code corrigé, recette humaine encore distinguée.
- A-015/A-018/A-021 restées ouvertes dans la synthèse malgré les preuves
  ultérieures ; A-023 à A-032 absentes de l'index : synthèse réconciliée.
- Maintenance catalogue : backend conservé mais onglet retiré. La procédure
  par bouton est marquée non applicable ; aucun parcours de remplacement inventé.
- Recettes dupliquées, liées à Luna/Sol et consignes de fermeture périmées :
  procédure unique, rôles indépendants du modèle et mandat explicite.

## Contexte IA : ce que l'archivage change vraiment

Tous les `.md` ne sont pas automatiquement chargés. AGENTS fournit des
instructions hiérarchiques ; une carte doit orienter vers une lecture ciblée.
C'est le principe retenu d'après la [documentation officielle AGENTS](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
La [guidance officielle Astra](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)
recommande de revoir les instructions et skills existants : ici, suppression
des ambiguïtés plutôt qu'ajout de consignes spécifiques à un modèle.

`.ignore` retire `doc/archives/` des recherches `rg` par défaut ; AGENTS
demande de ne pas les lire hors besoin historique. Ce n'est **ni une permission
d'accès ni une exclusion absolue de tous les outils/IA**. Les fichiers restent
suivables dans Git et récupérables. Aucun skill personnel extérieur au dépôt
ni réglage global de Codex n'a été modifié.

## Validation et limites

Contrôles locaux : liens Markdown, chemins structuraux de la carte, absence
de références actives vers les notes retirées, conservation des treize
photographies et `git diff --check`. Test de clôture Gen2 : **5/5 sous Node
22.23.2**, dont l'exclusion stricte des archives sans ignorer les références actives.
Lint ciblé du vérificateur et de son test : vert. Les quinze Markdown du dossier
d'archives et les liens actifs ont été contrôlés sans cible manquante.

Le validateur Python du skill n'a pas pu démarrer (PyYAML absent) ; frontmatter,
YAML UI, longueurs et lien de prompt contrôlés avec le parseur YAML local.
Pas d'installation de dépendance. Seul code non documentaire changé :
filtrage des archives dans le vérificateur documentaire Gen2 et son test.

Pas de build, serveur, navigateur, E2E, lecture de Gmail, paiement, mutation
cloud, déploiement, commit ou push. Les modifications applicatives présentes
avant cette passe ont été préservées. Les statuts de livraison reposent sur
le code local et les preuves déjà consignées, pas sur une nouvelle observation.

Pour maintenir le rangement : contrat dans son chapitre, statut dans l'état
du projet, point d'entrée dans la carte. Pas de journal de rollout dans AGENTS.
