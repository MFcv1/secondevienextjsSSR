# Lanceur de recette client et administrateur - Luna ou Terra

Derniere mise a jour: 2026-07-31
Statut: `LANCEUR_TEMPORAIRE_ACTIF`
Executeurs recommandes: Luna en raisonnement tres eleve ou Terra en raisonnement eleve
Correcteur exclusif: Sol (`GPT-5.6-sol`)
Environnement exclusif: sandbox / Stripe test
Echeance de fusion et suppression: 2026-08-06

## Lancement

Dans un nouveau chat rattache a ce projet, invoquer le skill avec son prompt
par defaut. Le skill confie automatiquement la campagne a un unique Terra en
raisonnement `eleve` avec un contexte autonome et un marqueur interne. Le
modele parent ne doit pas ouvrir Chrome, creer le `runId` ni commencer une
recette concurrente; toute reprise vise le meme Terra. Luna en raisonnement
`tres eleve` reste un secours explicite seulement si Terra est indisponible.
Si le lanceur n'insere pas le prompt, envoyer cette ligne complete afin que les
permissions sensibles soient bien portees par le texte de l'utilisateur:

```text
$client-admin-test — Confie toute la campagne a Terra en raisonnement eleve si le modele courant n'est pas deja Terra. J'autorise, pour cette recette sandbox uniquement, le controle de Chrome sur Seconde Vie et Gmail, la lecture des e-mails de recette de pvml7008@gmail.com et loa.gto15@gmail.com, la selection de ces comptes Google deja connectes, la connexion Google OAuth administrateur, la lecture puis la saisie des OTP Seconde Vie sans exposition, la saisie des coordonnees fictives de recette dans le checkout, le televersement d'images de recette sans donnee personnelle vers l'administration sandbox, ainsi que les publications, paiements et remboursements Stripe test bornes. Execute M01-M13 de bout en bout. Un statut CORRIGEE_A_REQUALIFIER impose la requalification et ne constitue pas un blocage en soi. Recupere les blocages transitoires et poursuis les scenarios independants avant de me demander une intervention.
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
jeton sans renvoyer d'OTP. Terra poursuit M02 jusqu'au paiement sans payer,
puis requalifie M01 ; il ne condamne plus M02--M13 sur ce seul incident.

`CORRIGEE_A_REQUALIFIER` n'est pas un blocage: ce statut demande a Terra de
rejouer la gate ou le parcours concerne. A-017 et A-018 doivent donc etre
requalifiees pendant la campagne. Terra ne suspend le sous-parcours qu'apres
une preuve actuelle et executable d'une gate rouge; il continue alors tous les
autres scenarios. Une ancienne mention « deploiement en attente » ne suffit
pas si le code ou le sandbox actuel apporte une preuve plus recente.

Luna ou Terra bascule elle-meme entre les comptes Google deja connectes dans Chrome et
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
- aucune correction, aucun commit ni deploiement par Luna ou Terra;
- produits de recette archives ou residus explicitement listes;
- controles fermes et operations saines;
- handoff des seules anomalies applicatives a Sol (`GPT-5.6-sol`), seul correcteur autorise.
