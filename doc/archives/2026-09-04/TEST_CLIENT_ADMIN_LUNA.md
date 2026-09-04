> ARCHIVE — photographie conservée le 2026-09-04 depuis `TEST_CLIENT_ADMIN_LUNA.md`.
> Contenu historique non applicable comme consigne actuelle. Les liens Markdown ont été rebasés.
> Références actives : [documentation](../../../_DOCS/README.md).

# Lanceur de recette client et administrateur

Derniere mise a jour: 2026-07-31
Statut: `LANCEUR_TEMPORAIRE_ACTIF`
Executeur: agent du chat ayant recu le skill, en pleine autonomie
Correcteur exclusif: Sol (`GPT-5.6-sol`)
Environnement exclusif: sandbox / Stripe test
Echeance de fusion et suppression: 2026-08-06

## Lancement

Dans un chat rattache a ce projet, invoquer le skill avec son prompt par
defaut. L'agent du chat execute lui-meme toute la campagne et reste l'unique
proprietaire de Chrome. Il ne delegue pas automatiquement selon son modele ou
son nom. Si le lanceur n'insere pas le prompt, envoyer cette ligne complete
afin que les permissions sensibles soient bien portees par le texte de
l'utilisateur:

```text
$client-admin-test — Execute toi-meme toute la recette sandbox en pleine autonomie avec Chrome externe. J'autorise, uniquement pour cette campagne, le controle de Seconde Vie et Gmail, le changement via l'icone Google entre matthis.fradin2@gmail.com, pvml7008@gmail.com et loa.gto15@gmail.com, la lecture et la saisie non exposee des OTP de recette, les coordonnees et images fictives, ainsi que les publications, paiements et remboursements Stripe test bornes. Accomplis M01-M13 et les parcours client/admin, adapte-toi aux frictions ordinaires, poursuis les scenarios independants et consigne chaque anomalie applicative dans anomalies.md sans corriger le code.
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
puis la recette sandbox autorisee. L'agent de recette ne redemande pas une
confirmation de principe. Un garde-fou impose par la plateforme au moment
exact d'une action reste prioritaire et ne peut pas etre neutralise par le
skill.

Un timeout, un mauvais compte, un onglet absent, une page stale ou une erreur
reseau transitoire ne terminent pas la campagne. L'agent applique l'echelle de
recuperation du skill, verifie l'etat autoritaire avant tout retry, poursuit
les scenarios independants et conserve le meme `runId`. Il ne sollicite
l'utilisateur que pour une action securisee precise ou lorsqu'une mutation
commerce ne peut plus etre prouvee sure.

M01 n'est pas la Gate P0. Si l'OTP de connexion est valide cote Function mais
que l'echange Firebase Auth subit une erreur reseau, le site retente le meme
jeton sans renvoyer d'OTP. L'agent poursuit M02 jusqu'au paiement sans payer,
puis requalifie M01 ; il ne condamne plus M02--M13 sur ce seul incident.

`CORRIGEE_A_REQUALIFIER` n'est pas un blocage: ce statut demande a l'agent de
rejouer la gate ou le parcours concerne. A-017 et A-018 doivent donc etre
requalifiees pendant la campagne. L'agent ne suspend le sous-parcours qu'apres
une preuve actuelle et executable d'une gate rouge; il continue alors tous les
autres scenarios. Une ancienne mention « deploiement en attente » ne suffit
pas si le code ou le sandbox actuel apporte une preuve plus recente.

L'agent bascule lui-meme via l'avatar ou l'icone Google entre les trois comptes
deja connectes dans Chrome: `matthis.fradin2@gmail.com`,
`pvml7008@gmail.com` et `loa.gto15@gmail.com`. Il choisit l'identite exacte du
scenario, puis lit et saisit les OTP recus dans les boites sandbox autorisees.
Il ne demande pas a l'utilisateur de saisir un OTP accessible. L'utilisateur
intervient seulement pour un mot de passe, un PIN systeme, Touch ID, Face ID,
une passkey, un CAPTCHA, une recuperation de compte ou une confirmation
materielle non automatisable. Aucun mot de passe, OTP, PIN, cookie ou token ne
doit etre transmis au chat ni conserve dans une preuve.

## Definition de fin

- rapport distinct entre `REUSSI`, `ECHEC`, `BLOQUE` et `NON_EXECUTE`;
- preuves client, admin, Stripe test, stock et Gmail correlees;
- anomalies inscrites avant tout handoff;
- aucune correction, aucun commit ni deploiement par l'agent de recette;
- produits de recette archives ou residus explicitement listes;
- controles fermes et operations saines;
- handoff des seules anomalies applicatives a Sol (`GPT-5.6-sol`), seul correcteur autorise.
