---
name: viewport-fit
description: Use this skill when the user asks to make a section, hero, or page fill exactly the mobile viewport height without overflow. Covers full-screen mobile sections where the background must stop precisely at the bottom of the screen, with consistent margins on all devices. USE FOR: "section qui s'arrete au bas de l'ecran", "fond qui ne depasse pas le fold", "hauteur exacte viewport mobile", "marge constante en bas", "pas de fond qui continue sous l'ecran". DO NOT USE FOR: desktop-only layout, min-height sections that can grow, or scroll-based animations.
---

# Viewport-Fit: Section plein ecran mobile avec fond qui s'arrete au fold

## Le probleme

Quand l'utilisateur demande qu'une section avec un fond colore (ex: beige, terre) s'arrete **pile au bas de l'ecran mobile** au premier chargement, sans que le fond continue en dessous ni que la section suivante soit visible.

### Erreurs courantes a eviter absolument

1. **`min-h` au lieu de `h`** — `min-height` permet a la section de depasser l'ecran. Le fond colore continue sous le fold. **Toujours utiliser `h` (hauteur exacte) sur mobile.**
2. **Variable CSS inexistante au chargement** — `var(--global-menu-header-height, 112px)` n'existe qu'a l'ouverture du menu mobile dans ce projet. Au chargement normal, seul le fallback est utilise et il peut etre faux. **Calculer la vraie hauteur du header manuellement.**
3. **Hauteur d'image fixe** — Si l'image a une hauteur fixe (`h-[230px]`) dans un conteneur a hauteur viewport, la marge sous l'image varie selon l'ecran. **Utiliser `flex-1` sur l'image pour absorber l'espace variable.**

## Architecture du header dans ce projet

```
Bandeau d'annonce (AnnouncementBannerServer) : 28px (height: 28px dans index.css)
Header sticky (ArchitecturalHeaderServer)     : 64px mobile (h-16) / 76px desktop (md:h-[76px])
Border-bottom du header                      : ~1px
────────────────────────────────────────────
Total mobile                                  : ~92px
Total desktop (md+)                           : ~105px
```

> **IMPORTANT** : Le bandeau d'annonce n'est PAS sticky. Il scroll normalement. Le header EST sticky `top-0`. Au premier chargement, les deux sont visibles et poussent le contenu vers le bas.

## Pattern CSS a appliquer

### Sur la section (`<section>`)

```jsx
// Mobile : hauteur EXACTE = viewport - header total (92px)
// Desktop (lg+) : hauteur auto avec min-height pour le confort
className="h-[calc(100dvh-92px)] lg:h-auto lg:min-h-[540px]"
```

- `h` et pas `min-h` sur mobile — c'est la cle. La section ne depasse jamais le viewport.
- `100dvh` — dynamic viewport height, s'adapte aux barres de navigation Chrome/Safari.
- `92px` — bandeau 28px + header 64px. Valeur verifiee dans le code source.
- `lg:h-auto lg:min-h-[540px]` — sur desktop, on laisse le contenu respirer.

### Sur le conteneur flex interne

```jsx
// h-full pour epouser la section, flex-col pour empiler verticalement
className="flex flex-col justify-start h-full px-4 pt-3.5 pb-7"
```

- `h-full` — le conteneur prend toute la hauteur de la section.
- `pb-7` (28px) — la marge beige constante en bas de la section, visible sur tous les ecrans.

### Sur le conteneur d'image (mobile)

```jsx
// flex-1 absorbe l'espace restant, min-h empeche l'image de disparaitre
className="mt-4 flex-1 min-h-[140px] overflow-hidden rounded-[18px] sm:h-[280px] sm:flex-none"
```

- `flex-1` — l'image prend tout l'espace entre le texte et le padding bottom. Sur un grand ecran, l'image est plus haute. Sur un petit, plus courte.
- `min-h-[140px]` — l'image ne descend jamais en dessous de 140px.
- `sm:h-[280px] sm:flex-none` — sur tablette, on revient a une hauteur fixe.
- `object-cover object-bottom` sur le `<img>` — l'image remplit le conteneur sans deformation.

## Schema visuel

```
┌──────────────────────────┐ ← Haut du viewport mobile
│  Bandeau annonce (28px)  │
│  Header sticky   (64px)  │
├──────────────────────────┤ ← Debut de la section hero
│                          │
│  Fil d'Ariane            │  ← justify-start : contenu en haut
│  Titre h1                │
│  Description             │
│  Proof items (icones)    │
│                          │
│  ┌────────────────────┐  │
│  │                    │  │  ← Image flex-1 : absorbe l'espace
│  │   Image meuble     │  │
│  │                    │  │
│  └────────────────────┘  │
│         pb-7 (28px)      │  ← Marge beige CONSTANTE
├──────────────────────────┤ ← Bas du viewport = bas de la section
│                          │
│  Section suivante blanc  │  ← Visible uniquement au scroll
│                          │
```

## Exemple d'implementation complet (reference : page Devis)

```jsx
// Fichier: src/kit/marketplace/QuoteRequestServerView.jsx

const QuoteHero = () => (
  <section className="relative overflow-hidden h-[calc(100dvh-92px)] lg:h-auto lg:min-h-[540px]">
    {/* Fond beige absolu */}
    <div className="absolute inset-0 bg-[#f4eee5]" />

    {/* Conteneur principal */}
    <div className="relative mx-auto flex flex-col justify-start max-w-[1480px] px-4 pt-3.5 pb-7 h-full lg:h-auto lg:min-h-[540px]">

      {/* Bloc texte (hauteur naturelle) */}
      <div className="w-full mb-4">
        <PageBreadcrumb current="Devis" />
      </div>
      <div className="flex max-w-[540px] flex-col py-3">
        <h1>Titre</h1>
        <p>Description</p>
        {/* Proof items */}
      </div>

      {/* Image flexible (absorbe le reste) */}
      <div className="mt-4 flex-1 min-h-[140px] overflow-hidden rounded-[18px] ring-1 ring-black/5 sm:h-[280px] sm:flex-none lg:hidden">
        <img src="..." className="h-full w-full object-cover object-bottom" />
      </div>
    </div>
  </section>
);
```

## Checklist avant de valider

- [ ] `h-[calc(100dvh-92px)]` sur la section (pas `min-h`)
- [ ] `h-full` sur le conteneur flex interne (pas `min-h-[calc(...)]`)
- [ ] Image en `flex-1 min-h-[140px]` (pas de hauteur fixe sur mobile)
- [ ] `pb-7` sur le conteneur pour la marge constante
- [ ] `lg:h-auto` pour ne pas casser le desktop
- [ ] Tester sur au moins 3 tailles : 375x667 (iPhone SE), 390x844 (iPhone 14), 412x915 (Pixel 7)
