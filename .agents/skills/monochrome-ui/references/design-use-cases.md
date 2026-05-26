# Monochrome UI - Types De Design Et Sites

Ce fichier resume, en version ecrite, ce que ce skill doit permettre de produire. Il ne remplace pas SKILL.md: il sert de reference rapide pour comprendre la patte graphique, les types de sites naturels, et les demandes ou ce skill a une vraie utilite.

## Type De Design

Design monochrome fonde sur noir, blanc et gris. Il remplace la couleur decorative par inversion, bordures, densite, typographie, etats et contrastes disciplines.

Mots clefs de sensation: disciplined, stark, systematic, editorial, exact, reduced.

## Sites Et Interfaces Qui En Decoulent

- Dashboard gris/noir/blanc
- Brand site monochrome
- Console technique
- Archive editoriale
- Documentation reduite
- Interface sans chroma

## Signatures Visuelles Attendues

- Achromatic State System: hover uses gray lift, active uses inversion, focus uses outline, disabled uses opacity plus cursor.
- Gray Job Table: write semantic gray tokens before designing components.
- Border Rhythm: hairlines and dividers create organization without color.
- Image Treatment: use grayscale, duotone, high contrast crop, or mask; do not introduce random color.

## Archetypes Naturels

- Monochrome Dashboard: tables, filters, panels, exact gray states. apps.
- Black/White Editorial: huge type, grayscale imagery, index rows. brand sites.
- Reduced Commerce: product grid with inversion hover. stores.
- System Utility: settings, forms, lists with state clarity. tools.

## Composants Qui Portent La Patte

- gray-token-shell
- inversion-button
- monochrome-table
- bordered-filter-rail
- black-white-card
- grayscale-gallery
- mono-status-row
- reduced-footer

## Bonnes Demandes Pour Ce Skill

- Creer une interface noir/blanc/gris ou les etats restent distincts sans couleur.
- Transformer une page monochrome en systeme complet de contraste, inversion et bordures.

## Ce Que Le Skill Doit Ameliorer

- Remplacer les choix visuels generiques par une intention specifique au style.
- Forcer des tokens coherents pour couleur, type, espacement, radius, ombre et etats.
- Donner une structure de page ou d'interface qui correspond vraiment au domaine.
- Rendre la patte visible dans le premier viewport, puis la repeter dans les composants.
- Garder les controles, textes, etats et breakpoints utilisables.

## A Eviter

- No random gray ramp.
- No metadata too faint to read.
- No missing state design because color is absent.

## Test De Qualite

Une generation reussie avec ce skill doit encore etre reconnaissable si on retire le nom du skill. Si la page pourrait etre decrite comme "jolie mais generique", le skill n'a pas assez pilote les decisions de design.
