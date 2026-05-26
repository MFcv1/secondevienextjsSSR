# Motion - Types De Design Et Sites

Ce fichier resume, en version ecrite, ce que ce skill doit permettre de produire. Il ne remplace pas SKILL.md: il sert de reference rapide pour comprendre la patte graphique, les types de sites naturels, et les demandes ou ce skill a une vraie utilite.

## Type De Design

Design ou le mouvement fait partie de l'architecture. Il sert aux experiences cinetiques, scroll narratives, heros 3D, transitions sequencees et interfaces ou l'animation explique l'information.

Mots clefs de sensation: kinetic, cinematic, responsive, tactile, sequenced, alive.

## Sites Et Interfaces Qui En Decoulent

- Scroll narrative
- Launch anime
- Demo produit cinematique
- Hero 3D ou shader
- Kinetic typography
- Story interactive

## Signatures Visuelles Attendues

- Motion Archetypes By Engine: choose GSAP scroll, 3D camera/orbit, shader field, scanline terminal, kinetic type, or physical card stack.
- Static Frame Test: every section must still read if animation is disabled.
- Reduced Motion Contract: provide a visible but nonmoving equivalent.
- Choreography Map: hero, transition, proof, interaction, and footer each get distinct motion roles.

## Archetypes Naturels

- Scroll Narrative: pinned text, scrubbed media, chapter transitions. launch storytelling.
- Interactive 3D Stage: camera, object rotation, pointer parallax. product and game.
- Kinetic Typography: words reveal, split, mask, or scrub. editorial and campaigns.
- Motion Product Demo: UI states animate as workflow proof. SaaS and apps.

## Composants Qui Portent La Patte

- pinned-scroll-chapter
- scrubbed-gallery
- kinetic-word-reveal
- motion-card-stack
- cursor-parallax-stage
- timeline-control
- animated-product-demo
- reduced-motion-fallback

## Bonnes Demandes Pour Ce Skill

- Creer une page ou le scroll, les transitions et la sequence expliquent le produit.
- Ajouter une couche motion utile a une experience 3D, narrative ou cinetique.

## Ce Que Le Skill Doit Ameliorer

- Remplacer les choix visuels generiques par une intention specifique au style.
- Forcer des tokens coherents pour couleur, type, espacement, radius, ombre et etats.
- Donner une structure de page ou d'interface qui correspond vraiment au domaine.
- Rendre la patte visible dans le premier viewport, puis la repeter dans les composants.
- Garder les controles, textes, etats et breakpoints utilisables.

## A Eviter

- No animating everything.
- No motion used to compensate for weak content.
- No width/height/top/left animation when transform can do it.

## Test De Qualite

Une generation reussie avec ce skill doit encore etre reconnaissable si on retire le nom du skill. Si la page pourrait etre decrite comme "jolie mais generique", le skill n'a pas assez pilote les decisions de design.
