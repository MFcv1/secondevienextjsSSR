---
name: "FrontSymmetry — Pixel-Perfect Alignment & Independent Element Control"
description: "Expert skill for achieving perfect visual symmetry, independent element positioning, and surgical CSS adjustments in complex layouts. Think like a Figma pro, code like an architect."
---

# 📐 FrontSymmetry Skill

> **Mission** : Rendre l'agent capable de déplacer n'importe quel élément d'une page **indépendamment** des autres, de créer une **symétrie parfaite** entre les marges, et de calibrer des alignements au **pixel près** — comme un expert Figma travaillant en code.

> [!IMPORTANT]
> Ce skill est **OBLIGATOIRE** dès qu'un utilisateur demande :
> - "Bouge cet élément **mais juste** cet élément"
> - "Aligne X avec Y"
> - "Je veux la même marge / le même espacement entre..."
> - "Crée de la symétrie entre..."
> - Toute demande d'ajustement visuel fin

---

## 🧠 PHILOSOPHIE FONDAMENTALE

### Règle n°1 — Tu es un chirurgien, pas un déménageur

Quand l'utilisateur dit "bouge les cartes", il veut que **SEULES** les cartes bougent. Le titre, la sidebar, le header, le footer — tout doit rester **EXACTEMENT** à sa place d'avant la requête.

**Avant de toucher à quoi que ce soit, tu dois TOUJOURS :**
1. Identifier l'élément cible
2. Identifier son **système d'ancrage** (flow, fixed, absolute, sticky)
3. Identifier **tous les éléments frères** qui partagent le même conteneur parent
4. Vérifier si ta modification CSS va affecter le flux des frères

### Règle n°2 — Comprendre les 4 systèmes d'ancrage

| Système | Propriété CSS | Comportement | Affecte les voisins ? |
|---------|---------------|--------------|----------------------|
| **Flow (Normal)** | `position: static/relative` | L'élément prend de la place dans le flux. Ses frères se positionnent après lui. | ✅ OUI — `margin`, `padding`, `height` poussent les frères |
| **Fixed** | `position: fixed` | Ancré à la **fenêtre du navigateur**. Ignore le flux. | ❌ NON — totalement indépendant |
| **Absolute** | `position: absolute` | Ancré au **parent positionné** le plus proche. Ignore le flux. | ❌ NON — invisible pour les frères |
| **Sticky** | `position: sticky` | Hybride : flow normal puis fixed au scroll. | ⚠️ PARTIELLEMENT — prend de la place dans le flow mais se fixe au scroll |

### Règle n°3 — Le piège du couplage par flux

**SITUATION DANGEREUSE** : Deux éléments A et B sont dans le même conteneur `div` en flux normal :
```html
<div>        ← Conteneur parent
  <A />      ← Élément A (flow)
  <B />      ← Élément B (flow) — se positionne APRÈS A
</div>
```

Si tu augmentes le `margin-bottom` de A, **B descend**. Si tu augmentes le `padding-top` de B, **B descend** mais A reste. C'est le couplage par flux.

**TECHNIQUES POUR BOUGER A SANS BOUGER B :**

| Technique | Propriété | Résultat |
|-----------|-----------|----------|
| ✅ `position: relative` + `top` | `top: -2rem` sur A | A remonte visuellement mais son espace dans le flux NE CHANGE PAS → B reste en place |
| ✅ `transform: translateY()` | `translateY(-2rem)` sur A | Même effet que `top` — purement visuel, le flux ne bouge pas |
| ❌ `margin-top` négatif | `margin-top: -2rem` sur A | A remonte ET tire B vers le haut (le flux collapse) |
| ⚠️ `margin-top` négatif sur B | `margin-top: -2rem` sur B | B remonte mais A reste SEULEMENT si la marge ne dépasse pas l'espace du flux |

**TECHNIQUES POUR BOUGER B SANS BOUGER A :**

| Technique | Propriété | Résultat |
|-----------|-----------|----------|
| ✅ `margin-top` sur B | `margin-top: 2rem` sur B | B descend, A ne bouge pas ✅ |
| ✅ `position: relative` + `top` sur B | `top: 2rem` sur B | B descend visuellement, A et le reste ne bougent pas ✅ |
| ❌ `padding-bottom` sur A | `padding-bottom: 2rem` sur A | B descend MAIS A grandit aussi (l'espace total du parent change) |

---

## 🔬 PROTOCOLE D'AUDIT OBLIGATOIRE

> [!CAUTION]
> **AVANT toute modification de positionnement**, si la page n'a pas encore été auditée, l'agent DOIT exécuter un audit structurel. Sans audit, l'agent n'a AUCUNE certitude sur les effets de bord.

### Quand déclencher un audit ?

- **TOUJOURS** si c'est la première modification de positionnement sur cette page
- **TOUJOURS** si l'utilisateur dit "sans bouger le reste" ou "indépendamment"
- **TOUJOURS** si l'élément à bouger est dans un flux partagé avec d'autres éléments
- **OPTIONNEL** si l'élément est `fixed` ou `absolute` (déjà isolé du flux)

### Checklist d'audit — Les 8 points à vérifier

```
□ 1. IDENTIFIER L'ÉLÉMENT CIBLE
     Quel est l'élément exact (tag, classe, ligne du fichier source) ?

□ 2. IDENTIFIER LE PARENT DIRECT
     Quel est le conteneur parent immédiat ?
     Quel est son `display` ? (flex, grid, block, inline)
     Quel est son `position` ? (static, relative, fixed, absolute)

□ 3. IDENTIFIER LES FRÈRES (siblings)
     Quels sont les autres enfants du même parent ?
     Sont-ils dans le flux normal ou en position absolue/fixe ?

□ 4. CARTOGRAPHIER LE SYSTÈME D'ANCRAGE
     L'élément cible est-il en flow, fixed, absolute, ou sticky ?
     Si flow : quel spacing (margin/padding) crée l'espace autour de lui ?

□ 5. TESTER LA DÉPENDANCE
     Si je modifie le margin-top de l'élément cible, est-ce qu'un frère bouge ?
     Si oui → couplage détecté → utiliser `top` ou `transform` à la place

□ 6. IDENTIFIER L'ÉLÉMENT DE RÉFÉRENCE (si alignement demandé)
     Quel est l'élément de référence pour l'alignement ?
     Quel est SON système d'ancrage ?
     ⚠️ Si cible et référence ont des ancrages DIFFÉRENTS (ex: l'un est flow,
     l'autre est fixed), l'alignement parfait est DÉPENDANT DE LA TAILLE D'ÉCRAN.

□ 7. VÉRIFIER LA RESPONSIVITÉ
     La modification doit-elle s'appliquer sur mobile, tablet, desktop, ou tous ?
     Utiliser les prefixes responsive (sm:, md:, lg:, xl:, 2xl:) en conséquence.

□ 8. DOCUMENTER LE CHANGEMENT
     Après l'ajustement, noter la valeur exacte dans le document de mapping de la page
     (ex: gallery.md) pour référence future.
```

---

## 📏 L'ART DE LA SYMÉTRIE PARFAITE

### Principe 1 — La Règle du Miroir

Pour créer une symétrie visuelle parfaite entre deux éléments, les marges doivent être **identiques de chaque côté de l'axe de symétrie**.

```
SYMÉTRIE HORIZONTALE (gauche-droite) :
┌─────┐                    ┌─────┐
│  A  │←── margin-right ──→│  B  │
└─────┘                    └─────┘
         doit être = à
         margin-left de B

SYMÉTRIE VERTICALE (haut-bas) :
┌─────┐
│  A  │
└─────┘
   ↕  margin-bottom de A doit = margin-top de B
┌─────┐
│  B  │
└─────┘
```

### Principe 2 — Marges Symétriques = Même valeur, Pas de guessing

**❌ MAUVAIS** : "Je vais mettre `mt-4` en haut et `mb-6` en bas, ça a l'air bien."
**✅ BON** : "L'espace entre le titre et les cartes est `gap-8` (32px). L'espace entre les cartes et le footer doit aussi être exactement `32px` → `pb-8`."

### Principe 3 — Le Token System

Pour garantir la symétrie sur toute la page, utiliser des **tokens d'espacement constants** :

```css
/* Tokens de symétrie recommandés */
--space-section: 4rem;     /* Entre les grandes sections */
--space-element: 2rem;     /* Entre les éléments d'une section */
--space-micro: 0.5rem;      /* Ajustements fins */
--space-px: 1px;            /* Pixel-perfect */
```

Quand l'utilisateur demande "la même marge entre X et le bas de l'écran que entre Y et le bas de l'écran", c'est un cas classique de **symétrie par rapport à un axe commun** (ici le bas de la fenêtre). Les deux éléments doivent avoir la même distance à cet axe.

### Principe 4 — Le Problème Fixed vs Flow (⚠️ CRITIQUE)

**Quand deux éléments avec des ancrages DIFFÉRENTS doivent être alignés :**

```
SITUATION :
┌──────────────────────────────────────┐
│ FENÊTRE DU NAVIGATEUR                │
│                                      │
│  [Sidebar FIXED]  │  [Contenu FLOW]  │
│  ...              │  ...             │
│  ...              │  [Cartes]        │
│  [Bouton ↓]       │  [Labels]        │
│  (bottom: 0)      │  (flow normal)   │
└──────────────────────────────────────┘
```

Le bouton est ancré au **sol** (fixed bottom-0). Les labels sont dans le **flux** (ils descendent depuis le plafond). Sur un écran de 900px de haut, ils sont peut-être alignés. Sur un écran de 1200px, le bouton descend de 300px mais les labels restent au même endroit → **désalignement garanti**.

**Solutions pour cette situation :**

| Solution | Impact | Recommandation |
|----------|--------|----------------|
| 1. Calibrer `margin-top` sur les labels pour l'écran courant | Fragile — change avec la résolution | ⚠️ OK si l'écran cible est connu et fixe |
| 2. Retirer `mt-auto` du bouton pour l'accrocher au contenu plutôt qu'au sol | Robuste — l'alignement est dans le même système | ✅ IDÉAL pour la symétrie universelle |
| 3. Utiliser `calc(100vh - Xpx)` sur les labels | Rend les labels fixed-like | ⚠️ Complexe, peut casser le scroll |
| 4. Utiliser CSS `anchor()` (futur) | Parfait mais pas supporté partout | 🔮 Futur |

**Recommandation de l'agent** : Toujours mentionner à l'utilisateur quand un alignement demandé implique deux systèmes d'ancrage différents. Proposer la solution 2 comme idéale, et accepter la solution 1 si l'utilisateur veut un calibrage rapide pour son écran.

---

## 🎯 TECHNIQUES D'AJUSTEMENT AU PIXEL PRÈS

### Méthode du Calibrage Itératif

Quand l'alignement exact ne peut pas être calculé mathématiquement (ex: deux systèmes d'ancrage différents), utiliser un calibrage par approximation successive :

```
ÉTAPE 1 — Estimation initiale
   Estimer visuellement le décalage en pixels depuis le screenshot fourni.
   Appliquer une correction de l'ordre de grandeur (ex: -4rem si gros décalage).

ÉTAPE 2 — Bisection
   Si trop haut → réduire la correction de moitié.
   Si trop bas → augmenter la correction de moitié.
   Ex: -4rem trop haut → essayer -2rem → si trop bas → essayer -3rem.

ÉTAPE 3 — Micro-ajustement
   Une fois dans la bonne zone (±10px), passer aux unités fines :
   - rem avec décimales : -0.25rem, -0.5rem, -0.75rem
   - Pixels arbitraires en Tailwind : mt-[-3px], mt-[-7px], mt-[11px]

ÉTAPE 4 — Validation
   Demander à l'utilisateur de confirmer visuellement.
   Les DevTools du navigateur ne suffisent pas toujours car les rendus GSAP
   et les animations peuvent modifier le positionnement final.
```

### Unités préférées (du plus gros au plus fin)

| Unité | Usage | Exemple Tailwind |
|-------|-------|-----------------|
| `rem` | Ajustements de section (>16px) | `mt-[-2rem]`, `gap-8` |
| `rem` décimal | Ajustements intermédiaires (4-16px) | `mt-[-0.25rem]`, `gap-[0.75rem]` |
| `px` | Pixel-perfect (<4px) | `mt-[-3px]`, `gap-[5px]` |
| `vh`/`vw` | Proportionnel à la fenêtre | `h-[80vh]`, `w-[50vw]` |

### Tailwind : Valeurs Arbitraires

Tailwind permet des valeurs arbitraires entre crochets `[]` pour un calibrage chirurgical :

```html
<!-- Valeurs négatives avec préfixe - -->
<div class="mt-[-0.25rem]">  <!-- -4px -->
<div class="mt-[-7px]">       <!-- exactement -7px -->
<div class="top-[-1.5rem]">   <!-- -24px en position relative -->

<!-- Breakpoints responsive -->
<div class="mt-[-2rem] lg:mt-[-0.25rem]">
<!-- Mobile: remonte de 32px, Desktop: remonte de 4px -->
```

---

## 🛡️ GARDES-FOU — Éviter les Catastrophes

### Avant CHAQUE modification, vérifier :

```
✅ Est-ce que je modifie le BON fichier ? (Vérifier le chemin)
✅ Est-ce que je modifie la BONNE ligne ? (Vérifier le numéro de ligne)
✅ Est-ce que ma modification est RESPONSIVE ? (Ai-je utilisé le bon prefix lg:/md:/sm: ?)
✅ Est-ce que je touche au FLUX ou seulement au VISUEL ?
   - margin/padding = FLUX (dangereux, affecte les voisins)
   - top/left/transform = VISUEL (safe, n'affecte pas les voisins)
✅ Y a-t-il des ANIMATIONS GSAP sur cet élément ?
   - Si oui, vérifier que GSAP ne set pas les mêmes propriétés en JS
   - GSAP écrase les styles CSS ! Vérifier les gsap.set() et gsap.to()
```

### Les erreurs classiques à NE JAMAIS commettre

| Erreur | Pourquoi c'est grave | Solution |
|--------|---------------------|----------|
| Modifier le `padding` du parent pour bouger un enfant | Tous les enfants bougent | Modifier le `margin` de l'enfant cible uniquement |
| Ajouter `position: absolute` pour "isoler" un élément | L'élément sort du flux → les frères collapse | Utiliser `position: relative + top` à la place |
| Mettre un `height: fixed` sur un conteneur flex | Les enfants peuvent déborder (`overflow: hidden` les coupe) | Utiliser `min-height` ou `flex-shrink: 0` |
| Modifier une classe Tailwind qui est utilisée dans un `@apply` | Tous les éléments utilisant ce `@apply` sont affectés | Vérifier le CSS global avant de modifier |
| Changer les `gap` de la grille pour déplacer UNE carte | Toutes les cartes changent d'espacement | Mettre un `margin` custom sur la carte spécifique |

### 🤫 Les 3 Secrets Avancés du Frontmaster

1. **Le paradoxe du Z-Index** : Utiliser `position: relative` + `top` crée un **nouveau contexte d'empilement**. L'élément déplacé peut passer "sous" ou "sur" un voisin. Toujours anticiper et ajuster le `z-10`, `z-20`, `z-30` si l'élément se retrouve masqué.
2. **Le piège Mobile Safari (vh vs dvh)** : Pousser un élément au bas de l'écran (`bottom-0` ou `mt-auto`) casse souvent sur mobile à cause de la barre d'adresse qui apparaît/disparaît. Pour un élément fixed en mobile, l'agent doit être attentif aux contraintes de Dynamic Viewport (`h-[100dvh]`) et aux safe-areas.
3. **L'Autorité absolue de GSAP** : Si GSAP anime un élément avec `{ y: 50 }` ou `clearProps: "all"`, TOUTE tentative de le positionner avec `mt-` ou `translate-y-` en CSS Tailwind entrera en conflit. Si un élément est manipulé en JavaScript par ScrollTrigger ou useGSAP, **son point de chute final doit se régler dans le hook GSAP**, pas en CSS standard.

---

## 🗂️ DOCUMENTS DE MAPPING (Pages Auditées)

Quand un audit structurel est complété pour une page, le résultat est stocké dans `_DOCS/`.

### Pages déjà auditées :

| Page | Document | Dernière MAJ |
|------|----------|-------------|
| Galerie (GalleryView) | [gallery.md](file:///c:/Users/matth/Travail/SecondevieAnais/_DOCS/gallery.md) | 2026-04-08 |

> [!TIP]
> **TOUJOURS consulter le document de mapping AVANT de modifier une page auditée.**
> Il contient les numéros de ligne exacts, les classes CSS, et les guides de modification indépendante.

### Template pour un nouvel audit

Quand une nouvelle page doit être auditée, créer un fichier dans `_DOCS/` avec la structure suivante :

```markdown
# 🗺️ [NOM DE LA PAGE] — Structure Map & Audit

## 🏛️ Architecture Générale (Arbre DOM)
→ Diagramme mermaid de la hiérarchie des composants

## 📐 Détail Zone par Zone
→ Pour chaque zone : fichier, lignes, position, classes, dépendances

## 🔗 Diagramme des Dépendances Verticales
→ Diagramme mermaid montrant le couplage entre zones

## 🎯 Guide de Modification Indépendante
→ Recettes précises : "pour bouger X, modifier Y à la ligne Z"

## ✅ Corrections Appliquées — Historique
→ Log de toutes les modifications avec valeurs testées et résultat
```

---

## 💡 AIDE-MÉMOIRE RAPIDE

### L'utilisateur dit... → Tu fais...

| L'utilisateur dit | Action de l'agent |
|-------------------|-------------------|
| "Bouge les cartes vers le haut" | Modifier `margin-top` du wrapper grille (pas du parent !) |
| "Bouge les cartes **sans toucher** au titre" | Vérifier le couplage flux → si couplé, utiliser `margin-top` sur le wrapper grille (le titre ne bouge pas car le margin s'applique seulement sur la grille, pas sur le hero) |
| "Aligne X avec Y" | 1. Identifier les ancrages de X et Y. 2. Si même ancrage → calcul direct. 3. Si ancrages différents → prévenir l'utilisateur et calibrer itérativement |
| "Même marge entre A et le bord que entre B et le bord" | Symétrie par rapport au bord = même `padding`/`margin` vers ce bord |
| "Juste cet élément, pas le reste" | AUDIT OBLIGATOIRE si pas déjà fait. Utiliser `relative + top` ou `transform` pour un déplacement visuel pur |
| "Descends ça de 10 pixels" | `mt-[10px]` ou `top-[10px]` selon le contexte (flow vs visual) |
| "Centre ça" | Horizontalement : `mx-auto` (block) ou `justify-center` (flex). Verticalement : `items-center` (flex) ou `top-1/2 -translate-y-1/2` (absolute) |

---

## 📚 CAS D'ÉTUDE : Alignement Cartes / Bouton Réinitialiser (Galerie)

### Contexte
L'utilisateur voulait que le mot "Table" (label sous la première carte produit) soit aligné horizontalement avec le bord inférieur du bouton "RÉINITIALISER" dans la sidebar.

### Analyse
- **Bouton RÉINITIALISER** : `position: fixed` (via la sidebar fixed) + `mt-auto` (ancré au sol de la fenêtre)
- **Mot "Table"** : `position: static` (flux normal, ancré au plafond via le titre Hero et les images des cartes)
- **Verdict** : Deux systèmes d'ancrage **incompatibles** pour un alignement universel. Le calibrage itératif est la seule option rapide.

### Processus
1. Estimation : décalage d'environ ~40px → essai `lg:mt-[-4rem]` (trop)
2. Bisection : `-4rem` trop haut → `-1.5rem` (encore trop)
3. Réduction : `-0.5rem` (presque) → `-0.25rem` (✅ validé)

### Leçon
Quand on calibre entre fixed et flow, la **bisection** est plus rapide que le calcul mathématique car les rendus finaux incluent des paddings, borders, line-heights, et animations GSAP qui ne sont pas triviaux à calculer.

---

*Skill créé le 2026-04-08. Basé sur l'expérience du projet Seconde Vie Anaïs.*
