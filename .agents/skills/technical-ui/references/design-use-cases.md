# Technical UI - Types De Design Et Sites

Ce fichier resume, en version ecrite, ce que ce skill doit permettre de produire. Il ne remplace pas SKILL.md: il sert de reference rapide pour comprendre la patte graphique, les types de sites naturels, et les demandes ou ce skill a une vraie utilite.

## Type De Design

Design d'interface technique dense. Il sert aux consoles, dashboards, workstations et outils IA ou controles, etats, logs, metriques et workflows doivent etre lisibles rapidement.

Mots clefs de sensation: precise, operational, structured, intelligent, focused, trustworthy.

## Sites Et Interfaces Qui En Decoulent

- Workstation SaaS
- Monitoring console
- AI control surface
- Log/trace viewer
- Data operations dashboard
- Outil d'ingenierie

## Signatures Visuelles Attendues

- Technical Mode Picker: decide if the UI is workstation, lab, CRM/toolkit, command console, or monitoring surface.
- Control Proximity: filters and commands live near the content they affect.
- State Completeness: loading, syncing, stale, failed, empty, selected, and read-only states must be visible.
- Information Density With Breathing: dense panels need exact spacing, separators, and type contrast.

## Archetypes Naturels

- Workstation: sidebar, toolbar, inspector, main canvas/table. workflow apps.
- Monitoring Console: metrics, incidents, logs, alerts. operations.
- AI Control Surface: prompt/input, context, output, evals. AI tools.
- CRM Toolkit: records, filters, pipeline, activity. business tools.

## Composants Qui Portent La Patte

- workstation-shell
- dense-data-table
- command-palette
- filter-builder
- log-stream
- inspector-panel
- alert-timeline
- stateful-empty-view

## Bonnes Demandes Pour Ce Skill

- Creer une console dense ou metriques, logs, filtres et etats sont immediatement scannables.
- Polir une workstation IA/SaaS pour usage repete et haute confiance.

## Ce Que Le Skill Doit Ameliorer

- Remplacer les choix visuels generiques par une intention specifique au style.
- Forcer des tokens coherents pour couleur, type, espacement, radius, ombre et etats.
- Donner une structure de page ou d'interface qui correspond vraiment au domaine.
- Rendre la patte visible dans le premier viewport, puis la repeter dans les composants.
- Garder les controles, textes, etats et breakpoints utilisables.

## A Eviter

- No fake complexity with meaningless metrics.
- No hiding primary workflow behind decorative panels.
- No low-contrast microcopy in dense areas.

## Test De Qualite

Une generation reussie avec ce skill doit encore etre reconnaissable si on retire le nom du skill. Si la page pourrait etre decrite comme "jolie mais generique", le skill n'a pas assez pilote les decisions de design.
