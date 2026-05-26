# Utilitarian - Types De Design Et Sites

Ce fichier resume, en version ecrite, ce que ce skill doit permettre de produire. Il ne remplace pas SKILL.md: il sert de reference rapide pour comprendre la patte graphique, les types de sites naturels, et les demandes ou ce skill a une vraie utilite.

## Type De Design

Design utilitaire et fonctionnel. Il optimise vitesse, densite, saisie, controle, repetition et fiabilite, avec tres peu de decoration et une priorite absolue a la tache.

Mots clefs de sensation: plain, efficient, robust, direct, legible, work-focused.

## Sites Et Interfaces Qui En Decoulent

- Admin interne
- CRUD dense
- Data entry
- Audit log
- Settings console
- Dashboard operationnel repetitif

## Signatures Visuelles Attendues

- Task-First Layout: start with the primary action surface, not marketing.
- Visible Controls: filters, bulk actions, save/cancel, search, and status are never hidden behind aesthetic minimalism.
- Operational State Language: use exact words for draft, pending, failed, synced, archived, locked, overdue.
- Dense But Calm: small spacing is fine when alignment, grouping, and contrast are rigorous.

## Archetypes Naturels

- Admin Table: filters, bulk actions, row states, detail drawer. internal systems.
- Data Entry Flow: forms, validation, review, submit. operations.
- Settings Console: sections, toggles, permissions, audit trail. admin tools.
- Documentation Utility: search, navigation, content, examples. docs tools.

## Composants Qui Portent La Patte

- admin-table
- bulk-action-toolbar
- detail-drawer
- validation-form
- settings-section
- audit-log
- search-filter-bar
- plain-footer

## Bonnes Demandes Pour Ce Skill

- Optimiser une interface admin pour rapidite, densite, saisie et controle.
- Transformer un outil interne en surface fiable, claire et sans decoration inutile.

## Ce Que Le Skill Doit Ameliorer

- Remplacer les choix visuels generiques par une intention specifique au style.
- Forcer des tokens coherents pour couleur, type, espacement, radius, ombre et etats.
- Donner une structure de page ou d'interface qui correspond vraiment au domaine.
- Rendre la patte visible dans le premier viewport, puis la repeter dans les composants.
- Garder les controles, textes, etats et breakpoints utilisables.

## A Eviter

- No hero theatrics for a work surface.
- No hidden controls to make the page look clean.
- No decorative illustrations where data or controls are needed.

## Test De Qualite

Une generation reussie avec ce skill doit encore etre reconnaissable si on retire le nom du skill. Si la page pourrait etre decrite comme "jolie mais generique", le skill n'a pas assez pilote les decisions de design.
