> ARCHIVE — photographie conservée le 2026-09-04 depuis `TODO.md`.
> Contenu historique non applicable comme consigne actuelle. Les liens Markdown ont été rebasés.
> Références actives : [documentation](../../../_DOCS/README.md).

# Handoff de reprise

Derniere mise a jour: 2026-07-29
Statut: `REPRISE_DIFFEREE`
Fin de validite: 2026-10-31

Campagne de recette commerce sandbox en cours:
[TEST_COMMERCE_SANDBOX.md](TEST_COMMERCE_SANDBOX.md), avec registre temporaire
[anomalies.md](../../../anomalies.md). Fusion et suppression au plus tard le
2026-08-06.

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

1. [AGENTS.md](AGENTS-avant-rangement.md);
2. [map.md](map.md);
3. [COMMERCE_SYNTHESE.md](../../../_DOCS/commerce/COMMERCE_SYNTHESE.md);
4. [COMMERCE_REPRISE.md](../../../_DOCS/commerce/COMMERCE_REPRISE.md);
5. le chapitre technique concerne.

## Prochaine action

Reprendre en Axe R1 du
[plan commerce](../../../_DOCS/commerce/COMMERCE_REPRISE.md), en commencant par les
defauts observes sur les commandes reelles sandbox:

- la reprise du paiement apres fermeture de la modale reste bloquee en
  `awaiting_method`;
- `/mes-commandes` normalise maintenant les timestamps v2, reprend
  `shippingSnapshot` et expose les recus/confirmations sandbox; les snapshots
  d'item affichent encore la meme image de repli pour plusieurs dossiers;
- Retours reprend maintenant les champs Stripe/refund v2 et les dossiers
  physiques detailles; la recette visuelle hebergee reste a faire apres
  deploiement cible.
- R1.1 implemente localement: deployer de facon ciblee la modale d'expedition,
  la callable de correction du suivi et les readers/e-mails, puis requalifier
  M04/M08/M09 dans l'e-mail et `/mes-commandes`.

Continuer ensuite la recette admin AAL2 visible, le paiement invite OTP bout en
bout et la matrice Safari/iPhone plus Chrome Android.

Ne pas ouvrir `v2_all`, le live ou la production pendant R1. Toute interaction
Touch ID, passkey, Google ou OTP indispensable doit etre demandee a
l'utilisateur, sans jamais copier de secret dans le chat ou un fichier.

## Regle de fin

Mettre ce handoff a jour apres chaque axe. Le supprimer avec le plan temporaire
lorsque les decisions durables ont ete fusionnees dans les chapitres
canoniques.
