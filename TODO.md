# Handoff de reprise

Derniere mise a jour: 2026-07-29
Statut: `REPRISE_DIFFEREE`
Fin de validite: 2026-10-31

## Point de depart

Le noyau commerce est `PREPROD_TRANSACTIONAL_READY` sur sandbox/fixtures. Les
Gates 0A a 8 sont fermees. L'UI fixture est fermee, les mutations admin sont
`read_only`, le paiement offline est `off` et aucune activation `v2_all`,
Stripe Live ou production n'est autorisee.

## Documents a lire

1. [AGENTS.md](AGENTS.md);
2. [map.md](map.md);
3. [COMMERCE_SYNTHESE.md](_DOCS/commerce/COMMERCE_SYNTHESE.md);
4. [COMMERCE_REPRISE.md](_DOCS/commerce/COMMERCE_REPRISE.md);
5. le chapitre technique concerne.

## Prochaine action

Reprendre en Axe R1 du
[plan commerce](_DOCS/commerce/COMMERCE_REPRISE.md): recette UX
complementaire admin AAL2 visible, paiement invite OTP bout en bout et matrice
Safari/iPhone plus Chrome Android.

Ne pas ouvrir `v2_all`, le live ou la production pendant R1. Toute interaction
Touch ID, passkey, Google ou OTP indispensable doit etre demandee a
l'utilisateur, sans jamais copier de secret dans le chat ou un fichier.

## Regle de fin

Mettre ce handoff a jour apres chaque axe. Le supprimer avec le plan temporaire
lorsque les decisions durables ont ete fusionnees dans les chapitres
canoniques.
