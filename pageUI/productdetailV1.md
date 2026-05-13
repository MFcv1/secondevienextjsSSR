# 📱 Product Detail — Spécification Architecture & Design (Référence Midjourney)

Ce document détaille l'implémentation technique de la fiche produit immersive de "Seconde Vie Anaïs", inspirée du design système de Midjourney (Mobile-first, Premium, Motion-driven).

---

## 🏗️ 1. Architecture des Calques (Layers 0-5)

Pour reproduire la profondeur et les interactions natives d'une application mobile, l'interface est structurée en 6 couches de profondeur (`z-index`) :

| Layer | Désignation | Rôle technique |
| :--- | :--- | :--- |
| **Layer 0** | **Background** | Fond noir pur (`#000000`) servant de canevas global. |
| **Layer 1** | **Main Image Viewport** | Conteneur de l'image centrale. Gère le redimensionnement fluide (`scale-90`, `translate-y`) lors de l'ouverture de la modale. |
| **Layer 2** | **Header & Thumbs** | Navigation secondaire (miniatures). S'efface (`translate-y-full`) au scroll pour libérer l'espace visuel. |
| **Layer 3** | **Image Overlay Footer** | Informations résumées (Nom, desc courte, actions rapides). Visible uniquement au repos pour une immersion totale. |
| **Layer 4** | **Scrollable Bottom Sheet** | Le "Tiroir" de contenu. Utilise `backdrop-blur-3xl` et `rounded-t-3xl`. Gère son propre flux de défilement vertical. |
| **Layer 5** | **Floating Action Button (FAB)** | Bouton d'action principal (Panier/Enchère). Toujours accessible, flottant par-dessus le contenu pour maximiser le taux de conversion. |

---

## ⚡ 2. Logique d'Interaction & Gestes (Touch-System)

L'interface utilise un système de détection de gestes sur mesure pour séparer la navigation produit de l'exploration du contenu :

1.  **Swipe Horizontal (X-Axis) :** Navigation entre les images de la galerie (`activeImg`).
2.  **Swipe Vertical (Y-Axis) :** 
    *   *Ouverture :* Un swipe vers le haut sur l'image centrale déclenche l'état `isMobilePanelOpen`.
    *   *Fermeture :* Un swipe vers le bas lorsque le panneau est à son sommet (`scrollTop <= 10`) réinitialise l'interface.
3.  **Swipe-to-Go-Back (120Hz Native Feel) :** 
    *   **Performance :** Utilisation de `requestAnimationFrame` (rAF) plutôt que GSAP pour le tracking en temps réel, garantissant 120 FPS sur les écrans modernes.
    *   **Hardware Acceleration :** Utilisation exclusive de `translate3d` pour déporter le calcul sur le GPU.
    *   **Velocity Engine :** Implémentation d'un calcul de vélocité (px/ms). Un "flick" (mouvement rapide) ferme la page instantanément même si la distance parcourue est faible, tandis qu'un "drag" lent nécessite 30% de la largeur d'écran pour valider.

---

## 🌀 3. Persistance & Stabilité de la Galerie

Pour garantir une expérience sans interruptions visuelles lors des retours en arrière :

*   **Single-Run Title Animation :** L'animation d'entrée du titre "MEUBLES" (via `SplitType`) est verrouillée par `useRef` pour ne s'exécuter qu'une seule fois au premier chargement. Elle ne se redéclenche plus lors des navigations "Back", évitant les surcharges processeur et les clignotements.
*   **Memoized Product Grid :** Utilisation de `useMemo` sur le filtrage des produits dans `GalleryView.jsx`. Cela empêche le re-rendu complet de la grille lors du retour depuis un produit, préservant ainsi la position exacte du scroll.

---

## 🎨 4. Détails de Design & UX Premium

*   **Cinematic Backdrop :** Sur Desktop, un fond flouté dynamique (`blur-[80px]`) basé sur l'image active crée une immersion "Gallery".
*   **Architectural Micro-Rounding :** Les images de la galerie possèdent un arrondi extrêmement discret (`rounded-md` / 6px) pour adoucir les angles sans compromettre la rigueur géométrique du design.
*   **Adaptive Header Compression :** 
    *   *Desktop :* Utilisation de `top-[-5.5rem]` pour remonter la grille et aligner les textes des produits avec la sidebar.
    *   *Mobile :* Centrage vertical agressif (`top-[-4rem]`) pour remonter le titre et la première photo, garantissant que le prix et le titre du produit sont visibles "Above the fold" (sans scroll) dès l'ouverture.
*   **Zero Conflict Scroll :** L'usage de `overscroll-y-none` sur le panneau de description bloque le "Pull-to-refresh" natif, permettant à l'utilisateur de fermer la modale sans rechargement.

---

## 🛠️ 5. Stack d'Animation

*   **requestAnimationFrame :** Coeur du moteur de swipe pour une fluidité absolue.
*   **GSAP (GreenSock) :** Utilisé pour l'entrée initiale des éléments et les transitions d'états finaux (snap-back).
*   **Tailwind Transitions :** Gestion des états de la modale mobile via des courbes de bézier personnalisées (`cubic-bezier(0.25, 1, 0.5, 1)`).

---
*Dernière mise à jour par Antigravity — 07 Avril 2026 — Optimisation 120Hz & UI Refinement*
