# Handoff de reprise

Derniere mise a jour: 2026-07-29
Statut: `REPRISE_DIFFEREE`
Fin de validite: 2026-10-31

## Point de depart

Le noyau commerce est `PREPROD_TRANSACTIONAL_READY` sur sandbox. Les Gates 0A
a 8 sont fermees et une fenetre `v2_all` bornee sur cinq meubles reels du
catalogue a aussi ete executee puis refermee le 2026-07-29. Trois commandes
Loa sont conservees pour la recette de `/mes-commandes`: 10 EUR payee, 80 EUR
payee puis remboursee, et 400 EUR payee avec trois meubles.

Etat ferme: UI transactionnelle compilee a `false`, controle revision 32,
`newCheckoutMode=v2_fixture`, mutations admin `read_only`, paiement offline
`off`, policy fixture restauree, operations `healthy` et compteurs a zero.
Stripe Live et production restent interdits.

## Documents a lire

1. [AGENTS.md](AGENTS.md);
2. [map.md](map.md);
3. [COMMERCE_SYNTHESE.md](_DOCS/commerce/COMMERCE_SYNTHESE.md);
4. [COMMERCE_REPRISE.md](_DOCS/commerce/COMMERCE_REPRISE.md);
5. le chapitre technique concerne.

## Prochaine action

Reprendre en Axe R1 du
[plan commerce](_DOCS/commerce/COMMERCE_REPRISE.md), en commencant par les
defauts observes sur les commandes reelles sandbox:

- la reprise du paiement apres fermeture de la modale reste bloquee en
  `awaiting_method`;
- `/mes-commandes` projette les timestamps v2 en `Date en attente`, ne reprend
  pas encore `shippingSnapshot` et affiche la meme image de repli pour les
  dossiers;
- le polissage UI/UX doit venir apres ces corrections de projection.

Continuer ensuite la recette admin AAL2 visible, le paiement invite OTP bout en
bout et la matrice Safari/iPhone plus Chrome Android.

Ne pas ouvrir `v2_all`, le live ou la production pendant R1. Toute interaction
Touch ID, passkey, Google ou OTP indispensable doit etre demandee a
l'utilisateur, sans jamais copier de secret dans le chat ou un fichier.

## Regle de fin

Mettre ce handoff a jour apres chaque axe. Le supprimer avec le plan temporaire
lorsque les decisions durables ont ete fusionnees dans les chapitres
canoniques.
