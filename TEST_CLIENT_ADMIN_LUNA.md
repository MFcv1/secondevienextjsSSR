# Lanceur de recette client et administrateur - Luna

Derniere mise a jour: 2026-07-31
Statut: `LANCEUR_TEMPORAIRE_ACTIF`
Executeur recommande: Luna en raisonnement tres eleve
Correcteur ulterieur: `GPT-5.6-sol`
Environnement exclusif: sandbox / Stripe test
Echeance de fusion et suppression: 2026-08-06

## Lancement

Dans un nouveau chat rattache a ce projet, selectionner Luna en raisonnement
`tres eleve`, puis envoyer uniquement:

```text
$client-admin-test
```

Le skill de projet
`.agents/skills/client-admin-test/SKILL.md` contient le prompt operationnel,
les acces attendus, la sequence client/admin, les garde-fous, la matrice
e-mail, la consignation des anomalies et le format du rapport final. Aucun
autre prompt ne doit etre copie.

Si le skill n'apparait pas dans le nouveau chat, recharger le projet ou
rouvrir l'application Codex, puis saisir de nouveau `$client-admin-test`.

## Comportement attendu

L'invocation demarre automatiquement la pre-verification en lecture seule,
puis la recette sandbox autorisee. Luna ne redemande pas une confirmation de
principe. Elle peut toutefois s'arreter lorsque Chrome ou Google exige une
interaction humaine securisee, ou lorsqu'une condition d'arret est atteinte.

Luna bascule elle-meme entre les comptes Google deja connectes dans Chrome et
lit puis saisit les OTP recus dans les boites sandbox autorisees. Elle ne
demande pas a l'utilisateur de saisir un OTP accessible. L'utilisateur
intervient seulement pour un mot de passe, un PIN systeme, Touch ID, Face ID,
une passkey, un CAPTCHA, une recuperation de compte ou une confirmation
materielle non automatisable. Aucun mot de passe, OTP, PIN, cookie ou token ne
doit etre transmis au chat ni conserve dans une preuve.

## Definition de fin

- rapport distinct entre `REUSSI`, `ECHEC`, `BLOQUE` et `NON_EXECUTE`;
- preuves client, admin, Stripe test, stock et Gmail correlees;
- anomalies inscrites avant tout handoff;
- aucune correction ni deploiement par Luna;
- produits de recette archives ou residus explicitement listes;
- controles fermes et operations saines;
- handoff des seules anomalies applicatives a `GPT-5.6-sol`.
