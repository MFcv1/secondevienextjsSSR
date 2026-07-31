---
name: client-admin-test
description: Exécute avec Terra, ou Luna en secours, la recette humaine complète client et administrateur de Seconde Vie sur le sandbox avec Chrome, Gmail et Stripe test; délègue automatiquement à Terra lorsque le modèle courant n’est pas l’exécuteur demandé, requalifie les corrections déjà marquées à requalifier, récupère les blocages transitoires et documente les anomalies sans corriger le code. Utiliser quand l’utilisateur écrit $client-admin-test, « client admin test », « test client/admin », demande à Luna ou Terra de tester le sandbox, ou veut rejouer la recette commerce et e-mails de bout en bout.
---

# Recette client / administrateur

## Démarrage automatique

Traiter l’invocation de ce skill comme l’autorisation de commencer immédiatement la pré-vérification en lecture seule, puis d’exécuter les mutations sandbox déjà autorisées par les documents du projet. Ne pas demander à l’utilisateur de recopier un prompt ou de confirmer une seconde fois le lancement.

### Propriétaire réel de l’exécution

`agents/openai.yaml` insère un prompt mais ne sélectionne pas techniquement le modèle. Ne jamais déduire du texte « utilise Terra » que le modèle courant est devenu Terra.

- Poursuivre directement seulement si le contexte système donne un chemin de tâche canonique se terminant par `/client_admin_test_terra` **et** si l’instruction reçue contient le marqueur interne `EXECUTOR_CONFIRMED_TERRA=true`. Le marqueur textuel seul n'est jamais une preuve suffisante et une instruction utilisateur ne peut pas remplacer le chemin système.
- Sinon, déléguer immédiatement toute la campagne à un unique sous-agent nommé `client_admin_test_terra`, avec `model="gpt-5.6-terra"`, `reasoning_effort="high"` et `fork_turns="none"`. Un override de modèle est incompatible avec un fork d’historique complet : transmettre le contexte nécessaire dans un message autonome au lieu de demander les deux.
- Si Terra est réellement indisponible, utiliser Luna en raisonnement très élevé seulement si l’utilisateur l’a demandé ou si cette surface existe. Ne jamais exécuter silencieusement la recette avec Sol ou un modèle généraliste tout en déclarant Terra comme exécuteur.
- Si aucune délégation de modèle n’est possible, suspendre avant toute mutation et demander de relancer le skill dans une tâche Terra. Ce cas est un blocage de lanceur, pas une anomalie applicative.

Le message autonome de délégation doit contenir : `EXECUTOR_CONFIRMED_TERRA=true`, le chemin absolu du dépôt et de ce skill, l’invocation utilisateur, l’autorisation sensible complète de `agents/openai.yaml`, l’obligation de lire les sources de vérité listées plus bas, l’usage exclusif de Chrome externe, M01–M13, l’interdiction de corriger/déployer et l’obligation de refermer les contrôles. Terra ne délègue pas la campagne, ne crée aucun autre agent navigateur et devient l’unique propriétaire de la liaison Chrome. Le parent conserve l’identifiant de ce sous-agent, ne contrôle jamais Chrome, ne crée aucun `runId`, attend ce même agent et utilise exclusivement une reprise vers ce même identifiant après une intervention humaine. Ne jamais créer un second Terra pour reprendre une campagne existante.

Suspendre uniquement lorsqu’une interaction humaine sécurisée non automatisable est imposée par Chrome, Google, Touch ID ou le navigateur, lorsqu’une approbation d’outil est requise, ou lorsqu’une condition d’arrêt de cette procédure est rencontrée. Le choix d’un compte Google déjà connecté et la lecture/saisie d’un OTP de recette ne nécessitent pas l’intervention de l’utilisateur. Ne jamais demander qu’un secret soit copié dans le chat.

L’autorisation métier portée par ce skill ne remplace pas une permission sensible que la plateforme exige dans le texte envoyé par l’utilisateur. Le prompt par défaut et le lanceur doivent donc contenir explicitement l’autorisation, limitée à cette campagne, de :

- contrôler Chrome sur le sandbox et Gmail ;
- lire les messages de recette des boîtes `pvml7008@gmail.com` et `loa.gto15@gmail.com` ;
- sélectionner ces comptes Google déjà connectés et accomplir la connexion Google OAuth administrateur ;
- lire puis saisir les OTP Seconde Vie dans le sandbox sans les exposer ;
- saisir dans le sandbox les coordonnées fictives de recette nécessaires au checkout ;
- téléverser vers l’administration sandbox des images de recette générées ou libres de droits, sans donnée personnelle ;
- effectuer les publications, paiements et remboursements Stripe test bornés par la recette.

Cette autorisation évite une redemande de principe, mais ne permet jamais de contourner une confirmation imposée au moment exact par la plateforme, un CAPTCHA, un mot de passe, un PIN, une biométrie ou une protection matérielle.

Utiliser Terra en raisonnement élevé par défaut : son profil est recommandé pour cette recette longue, séquentielle et dépendante de l’état réel de Chrome. Utiliser Luna en raisonnement très élevé seulement si Terra est indisponible ou si l’utilisateur le demande. Les deux modèles exécutent la totalité des mêmes tests, recueillent les preuves et créent ou complètent les anomalies. Aucun des deux ne corrige le code. Réserver toute implémentation, tout commit et tout déploiement correctif à Sol (`GPT-5.6-sol`) dans une tâche séparée.

Le lanceur unique est `agents/openai.yaml`, dont `interface.default_prompt` doit porter l’autorisation sensible complète ci-dessus. Ne pas créer un second prompt de lancement dans un autre document. Une invocation réduite au seul nom du skill peut ne pas transmettre cette autorisation au contrôle Chrome ; dans ce cas, classifier le refus comme `SURFACE_AUTORISATION`, poursuivre les vérifications indépendantes et demander uniquement l’autorisation précise encore exigée par la plateforme.

Les noms historiques contenant `LUNA` dans les documents et leurs formulations utilisant « Luna » désignent l’agent de recette sélectionné. Les appliquer sans restriction à Terra lorsqu’il exécute ce skill.

## Principe d’autonomie et de reprise

Ne pas conclure que la campagne est bloquée au premier échec d’outil, timeout, mauvais compte, onglet absent ou état visuel incomplet. Avant de suspendre :

1. classifier le blocage comme `TRANSITOIRE`, `SURFACE`, `HUMAIN_SECURISÉ` ou `SÉCURITÉ_MÉTIER` ;
2. tenter uniquement des récupérations sûres et matériellement différentes ;
3. vérifier l’état autoritaire après chaque action potentiellement ambiguë au lieu de la rejouer ;
4. poursuivre tous les scénarios indépendants réellement sûrs ;
5. ne suspendre que le sous-parcours qui exige l’intervention externe ;
6. conserver un checkpoint précis pour reprendre dans la même tâche.

Échelle de récupération :

- `TRANSITOIRE` : refaire un snapshot, reconstruire le locator, attendre un signal concret, puis effectuer au plus un retry si aucune mutation ambiguë n’a pu partir ;
- `SURFACE` : réutiliser la liaison Chrome existante, lister les onglets ouverts, revendiquer l’onglet exact, utiliser le sélecteur de comptes visible ou le connecteur Gmail autorisé ;
- `HUMAIN_SECURISÉ` : terminer les contrôles indépendants, garder les mutations fermées ou les refermer, puis demander une seule action humaine précise sans demander le secret ;
- `SÉCURITÉ_MÉTIER` : arrêter les nouvelles mutations, refermer immédiatement les contrôles et rapprocher l’état avant tout autre scénario.

Cas explicite M01 : `auth/network-request-failed` après la saisie du code est
un incident de transport de l'échange Firebase Auth, pas la preuve que l'OTP
est invalide. Le client conserve en mémoire le Custom Token déjà émis et
retente lui-même cet échange de façon bornée. Ne pas demander un nouvel OTP ni
réappeler aveuglément `verifyCustomerLoginOtp`. Si l'interface reste en erreur,
vérifier les logs sanitizés de la Function : un `phase=success` classe M01 en
`TRANSITOIRE_AUTH_EXCHANGE` et autorise un retry UI avec le même code/token.

Ne jamais répéter une navigation refusée par la politique du navigateur, contourner cette politique avec une autre surface, ni rejouer un paiement, webhook ou remboursement ambigu. Ce sont des limites du système, pas un manque d’autonomie à compenser par une prise de risque.

Avant une suspension, consigner en mémoire de tâche : identifiant du sous-agent Terra, `runId`, URL, IDs des onglets contrôlés, identités confirmées, cinq produits autorisés, commandes exactes, révision des contrôles, état Stripe, dernière preuve autoritaire, scénarios terminés et prochaine action exacte. Garder en `handoff` uniquement l’onglet que l’utilisateur doit reprendre ; ne fermer que les onglets créés par la campagne. Le parent reprend ensuite ce même Terra, jamais une nouvelle campagne.

## Interpréter le registre sans faux blocage

Le statut du registre a un sens opérationnel strict :

- `OUVERTE` ou `EN_DIAGNOSTIC` peut bloquer uniquement le sous-parcours réellement affecté, selon sa sévérité et les preuves actuelles ;
- `CORRIGEE_A_REQUALIFIER` signifie que la correction existe et que cette campagne doit la requalifier. Ce statut n’est jamais, à lui seul, une raison d’arrêter avant mutation, d’exiger un nouveau déploiement ou de renvoyer immédiatement vers Sol ;
- `FERMEE` et `DIFFEREE_EXTERNE` ne bloquent pas une requalification indépendante, sous réserve des garde-fous explicites.

Pour A-017 et A-018, exécuter les gates et scénarios de requalification prévus. Ne conclure « correction non déployée » qu’après une preuve exécutable actuelle : version déployée incompatible, endpoint requis absent, gate technique rouge ou comportement sandbox reproduit. Une phrase historique plus ancienne dans `anomalies.md` ne prime pas sur le code, le déploiement et les contrôles actuels.

A-018 demande précisément de rejouer la branche livraison. Après chaque transition, vérifier l’état autoritaire avant l’action suivante ; si l’interface reste obsolète, ne pas répéter la commande ambiguë, mais poursuivre le diagnostic serveur et les scénarios indépendants. A-017 demande de lancer d’abord sa gate technique actuelle ; si elle est verte, exécuter le remboursement asynchrone prévu et M12/M13. Si elle est rouge, bloquer seulement ce remboursement, pas le reste de la campagne.

Un préflight qui ne produit ni JSON, ni erreur, ni code de sortie exploitable est `TRANSITOIRE`, pas une preuve de blocage. Vérifier le processus et le rapport attendu, tenter une récupération matériellement différente, puis utiliser les surfaces autoritaires indépendantes prévues par le projet. Ne jamais remplacer la recette complète par un simple smoke OTP lorsque les gates commerce peuvent être établies.

Si un statut ou préflight cloud reste muet dans le bac à sable d'exécution,
le relancer une seule fois avec la permission réseau externe requise par la
plateforme. Une sortie vide provoquée par l'isolation réseau n'est ni une gate
rouge ni une raison d'arrêter la campagne. Ne demander aucune mutation
supplémentaire pour diagnostiquer ce cas.

## Charger la vérité du projet

Se placer à la racine du dépôt, trois niveaux au-dessus de ce fichier, puis lire intégralement et dans cet ordre :

1. `AGENTS.md` ;
2. `map.md` ;
3. `TEST_COMMERCE_SANDBOX.md` ;
4. `_DOCS/email/RECETTE_EMAILS_LUNA.md` ;
5. `anomalies.md` ;
6. les chapitres canoniques commerce, administration, espace client, e-mail, qualité et exploitation cités par ces documents et utiles aux scénarios retenus.

Le code et la configuration exécutables restent la preuve finale. En cas de contradiction, appliquer l’ordre de vérité défini par `AGENTS.md` et signaler l’écart.

## Périmètre immuable

- Site exclusif : `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`.
- Projet Firebase : `secondevienextjsssr`.
- Paiement : Stripe test exclusivement, jamais Stripe live.
- Client : `pvml7008@gmail.com`, compte lambda sans claim, rôle ni droit administrateur.
- Administrateur : `loa.gto15@gmail.com`, connexion Google réelle et assurance forte dans Chrome.
- Exécuteur : Luna ou Terra, agent de recette et de diagnostic uniquement.
- Correcteur exclusif des anomalies applicatives : Sol (`GPT-5.6-sol`).

Ne jamais activer la production, un domaine live, Stripe live, une fenêtre `v2_all` permanente, un contournement Auth, ni une protection affaiblie.

## Contrôler Chrome et Gmail

Utiliser le Chrome externe déjà équipé de l’extension ChatGPT, pas le navigateur intégré. Charger et suivre intégralement le skill `chrome:control-chrome`, puis sa documentation dynamique, avant toute interaction. Sélectionner explicitement `agent.browsers.get("chrome")` une seule fois et réutiliser cette liaison pendant toute la campagne.

Après cette sélection et cette lecture, lister les onglets visibles. Réutiliser les onglets exacts du sandbox ou de Gmail lorsqu’ils existent et mémoriser leurs IDs ; si la documentation dynamique fournit une primitive de revendication, l’utiliser. Si un onglet devient stale ou se ferme, abandonner seulement ce binding, conserver la liaison Chrome existante et obtenir un nouvel onglet depuis cette liaison sans rappeler `agent.browsers.get*` ni réinitialiser la session.

Diagnostiquer l’instance Chrome reliée uniquement à partir des onglets visibles, de leurs titres, URLs et états. Ne jamais inspecter ni demander le nom du profil, les cookies, le stockage, les mots de passe ou les sessions internes. Si l’utilisateur voit les bons onglets mais que l’outil ne les expose pas, classifier `SURFACE_INSTANCE_CHROME`, poursuivre les contrôles indépendants et demander une seule action : activer l’extension ChatGPT dans l’instance Chrome où les onglets sandbox et Gmail sont ouverts.

Le fait de pouvoir choisir `loa.gto15@gmail.com` dans le sélecteur Google OAuth prouve seulement que ce compte est disponible pour l’authentification. Cela ne prouve pas que la boîte Gmail administrateur est contrôlable. Avant toute mutation dépendant de la Gate P0, vérifier séparément l'accès à cette boîte via le connecteur s'il l'expose, sinon via l'onglet Chrome sous l'identité administrateur.

Avant toute recherche Gmail, appeler le profil du connecteur pour confirmer la boîte réellement exposée. Utiliser le connecteur pour cette boîte, qu’il s’agisse du client ou de l’administrateur. Contrôler l’autre boîte dans Chrome sous l’identité exacte ; s’il n’existe aucun onglet Gmail visible et que la permission utilisateur explicite est présente, effectuer une seule navigation directe vers Gmail puis sélectionner le compte exact. Le transfert admin vers client n’est qu’un filet de secours et ne constitue jamais une preuve de réception dans la boîte admin.

Si la politique du contrôle Chrome refuse l’origine Gmail, ne pas réessayer ni changer de navigateur pour contourner le refus. Continuer la pré-vérification, les audits serveur et les scénarios indépendants sans mutation ambiguë, puis demander à l’utilisateur d’ouvrir dans Chrome la boîte non exposée par le connecteur, sous l'identité exacte du scénario, et de laisser l'onglet visible. Reprendre depuis cet onglet, sans redémarrer la campagne ni créer un nouveau `runId`.

L’instance Chrome reliée expose déjà les comptes de recette autorisés. Lorsque Google ou Gmail affiche le sélecteur de comptes, cliquer soi-même sur l’identité exacte nécessaire au scénario, notamment `pvml7008@gmail.com` ou `loa.gto15@gmail.com`. Ne pas s’arrêter simplement parce que `matthis.fradin2@gmail.com` ou une autre identité de recette est active : ouvrir le sélecteur et basculer vers le bon compte avant toute lecture ou mutation.

Pour chaque e-mail client attendu, rechercher aussi avec `in:anywhere` et inspecter le spam. Corréler l’heure, le destinataire, le numéro de commande, le montant et le `runId`, sans exposer le contenu sensible.

Pour un OTP envoyé par Seconde Vie dans la boîte de recette autorisée, ouvrir le message, lire le code courant et le saisir soi-même dans le formulaire du sandbox. L’OTP peut être utilisé transitoirement pour achever le scénario, mais il ne doit jamais être affiché dans la conversation, dicté à l’utilisateur, conservé dans un fichier ou un log, ajouté au presse-papiers, ni présent dans une capture ou le rapport final. Ne pas demander à l’utilisateur de saisir l’OTP lorsque la boîte est accessible.

Ne jamais transmettre un résultat Gmail brut susceptible de contenir l’OTP à la console, au chat, à un appel d’outil d’affichage, à un log ou à une capture. Préférer une recherche d’identifiants puis une lecture ciblée ; extraire le code transitoirement dans l’orchestration et saisir directement la valeur dans Chrome. Les seules sorties autorisées sont des métadonnées sanitizées comme `message trouvé`, heure, destinataire attendu et modèle Mxx.

Suspendre seulement pour un mot de passe, un PIN système, Touch ID, Face ID, une passkey, un CAPTCHA, une récupération de compte ou une confirmation matérielle que l’agent ne peut pas accomplir. Ne jamais lire, recopier, conserver ni photographier ces secrets, un token, un cookie, des données de carte ou une clé secrète.

## Pré-vérification obligatoire

Avant toute mutation :

1. exécuter `npm run commerce:v2-all:window -- --action=status` avant de créer un run ; si une fenêtre est ouverte, reprendre ou fermer son `activeRunId` avant toute nouvelle campagne ;
2. créer un `runId` unique au format obligatoire `run_v2all_YYYYMMDD_<suffixe>` ;
3. confirmer visuellement l’URL exacte du sandbox et Stripe en mode test ;
4. confirmer les deux identités actives et l’absence totale de droit admin pour le client ;
5. vérifier dans la sortie `status` : `v2_fixture`, mutations admin `read_only`, paiement offline `off`, opérations `healthy` et compteurs à zéro ;
6. lancer `discover` avec le `runId` et `--buyer-email=pvml7008@gmail.com`, conserver les cinq `productIds` proposés, puis lancer `preflight` avec exactement ces cinq IDs ;
7. préparer avant ouverture la commande minimale de fermeture, qui n’exige que `--action=close`, le même `--run-id` et `--confirm=CLOSE_V2_ALL_<runId>_secondevienextjsssr` ;
8. affecter les produits autorisés aux deux commandes exactes décrites plus bas et relever les montants attendus ;
9. relever les résidus connus, notamment A-015 et A-016, sans les confondre avec le nouveau run ;
10. lancer `npm run commerce:refund-failed:preflight` : une sortie `READY` rend la gate technique A-017 verte ; une sortie rouge suspend uniquement M12/M13.

Commandes canoniques, en remplaçant `<runId>` et `<id1,...,id5>` par les valeurs découvertes :

```text
npm run commerce:v2-all:window -- --action=discover --run-id=<runId> --buyer-email=pvml7008@gmail.com
npm run commerce:v2-all:window -- --action=preflight --run-id=<runId> --buyer-email=pvml7008@gmail.com --products=<id1,id2,id3,id4,id5>
npm run commerce:v2-all:window -- --action=open --run-id=<runId> --buyer-email=pvml7008@gmail.com --products=<id1,id2,id3,id4,id5> --duration-minutes=60 --confirm=OPEN_V2_ALL_<runId>_secondevienextjsssr
npm run commerce:v2-all:window -- --action=close --run-id=<runId> --confirm=CLOSE_V2_ALL_<runId>_secondevienextjsssr
```

N'accepter l'ouverture que si la sortie vaut `OPEN`, puis relire `status` et
confirmer le même `activeRunId`. Après `close`, relire `status` et exiger
`CLOSED`, `v2_fixture`, `read_only`, paiement offline `off` et opérations
`healthy` avant de déclarer la campagne sécurisée.

La fenêtre n'est pas fermée automatiquement par `v2AllExpiresAt`. Terra en est
le watchdog opérationnel : accomplir OAuth/Gmail et toute interaction humaine
prévisible avant `open`, relever `expiresAt`, contrôler le temps restant avant
chaque paiement, transition et remboursement, puis lancer `close` au plus tard
cinq minutes avant l'échéance. Si une pause humaine inattendue survient pendant
la fenêtre et ne peut pas être résolue immédiatement, arrêter les nouvelles
mutations et fermer la fenêtre avant de demander l'intervention. À la reprise,
commencer systématiquement par `status` et sécuriser tout `activeRunId` résiduel.

Ne commencer aucune écriture tant que la cible, l’identité, le mode Stripe, la policy bornée ou la possibilité de refermer les contrôles reste incertaine.

L’indisponibilité temporaire d’une boîte Gmail n’interrompt pas les lectures serveur, la vérification des contrôles, la sélection bornée des produits, la vérification du compte connecté au connecteur ni la préparation du mécanisme de fermeture. Elle bloque seulement la première mutation exigeant la Gate P0 complète.

M01 ne fait pas partie de la Gate P0 et n'est pas une mutation commerce. Si
M01 reste rouge après sa récupération bornée alors que la vraie P0 est verte,
ne pas arrêter la campagne : ouvrir la fenêtre bornée, exécuter M02 jusqu'à
l'étape de paiement et ne pas payer. Si M02 réussit, se déconnecter, rejouer
M01 une seule fois avec un nouvel OTP, puis continuer dès que la Gate P1 est
complète. Si M01 et M02 échouent tous deux sur le transport, ou si la Gate P1
reste incomplète, fermer la fenêtre et suspendre uniquement les scénarios qui
exigent le paiement. Les contrôles admin et e-mail indépendants continuent.

## Exécuter la recette client

Procéder comme un humain dans l’interface :

1. se connecter avec le client par le parcours OTP normal ;
2. vérifier qu’aucune surface ou action admin n’est accessible ;
3. après M01, se déconnecter proprement afin de déclencher M02 depuis le checkout ;
4. réaliser exactement deux achats autorisés : commande A en livraison, avec deux meubles si le stock découvert l’autorise, puis commande B simple en retrait ; ne créer aucune troisième commande pour couvrir le multi-article ;
5. contrôler le récapitulatif, le paiement Stripe test et la confirmation durable `paid` ;
6. ouvrir `/mes-commandes` et vérifier présence, lignes, montants, statut, historique et documents ;
7. vérifier le profil, l’adresse et les informations de livraison ;
8. vérifier les e-mails correspondants côté client.

Le bouton client de demande de remboursement ouvre seulement le contact support. Il ne doit jamais être traité comme un remboursement financier Stripe. Effectuer tout remboursement réel exclusivement depuis le back-office avec l’administrateur fort.

## Exécuter la recette administrateur

Procéder comme l’humain responsable du back-office :

1. se connecter avec `loa.gto15@gmail.com` par Google OAuth et accomplir l’assurance forte demandée ;
2. vérifier la réception et la projection des commandes créées pendant ce run ;
3. publier, via l’interface normale, au plus un meuble de smoke portant le préfixe et le `runId` prescrits ; ce meuble teste la publication mais n’est pas ajouté aux deux commandes, qui utilisent uniquement les cinq produits autorisés avant ouverture ;
4. vérifier sa présence dans le catalogue public matérialisé et son état conforme, puis prévoir son archivage ;
5. tester les transitions de préparation, livraison et retrait prévues par la campagne, y compris les deux branches lorsque le plan les exige ;
6. déclencher depuis le back-office le remboursement Stripe test autorisé ;
7. vérifier le statut remboursé côté admin puis côté client ;
8. vérifier que le remboursement seul ne remet pas automatiquement le meuble en stock ;
9. contrôler chaque e-mail directement dans la boîte admin et dans la boîte client.

Ne jamais supprimer ou annuler une commande payée pour simuler un remboursement. Ne jamais rejouer aveuglément un paiement, un webhook ou un remboursement dont le résultat est ambigu.

## Vérifier la matrice e-mail M01–M13

Lire les déclencheurs, destinataires et preuves exacts dans `_DOCS/email/RECETTE_EMAILS_LUNA.md`, puis produire un résultat séparé `REUSSI`, `ECHEC`, `BLOQUE` ou `NON_EXECUTE` pour chacun :

- M01 : OTP de connexion client ;
- M02 : OTP de validation checkout ;
- M03 : commande payée au client ;
- M04 : nouvelle commande à l’administrateur ;
- M05 : commande en préparation au client ;
- M06 : commande prête au retrait au client ;
- M07 : commande retirée au client ;
- M08 : commande expédiée au client ;
- M09 : commande livrée au client ;
- M10 et M11 : remboursement confirmé au client et à l’administrateur ;
- M12 et M13 : remboursement en échec ou anomalie au client et à l’administrateur.

Utiliser deux commandes distinctes pour les branches livraison et retrait, qui sont incompatibles sur une même commande. N’exécuter le remboursement asynchrone en échec qu’après réussite de la gate technique spécifique décrite dans la recette ; sinon le marquer `BLOQUE` et le transmettre à `GPT-5.6-sol` sans improviser.

Pour M08, utiliser l'interface d'expedition integree, choisir `Autre
transporteur`, saisir `Transporteur recette` et le numero deterministe
`RECETTE-<runId>`, puis verifier la meme valeur dans l'etat autoritaire,
l'e-mail et `/mes-commandes`. Le numero de suivi est facultatif pour le
produit, mais la variante avec suivi est obligatoire pour la preuve M08. Ne
jamais saisir un numero de colis reel.

Une difficulte de surface sur la modale d'expedition ne bloque jamais, a elle
seule, la branche retrait, M06/M07, les remboursements M10-M13, les documents
ou les controles Gmail independants. Verifier d'abord l'etat autoritaire de la
commande livraison. S'il est encore `preparing`, fermer ou annuler la modale
sans mutation puis reessayer une seule fois avec un locator reconstruit. S'il
est `shipped`, ne pas rejouer l'expedition: verifier le suivi puis continuer
M09. Si M08 reste non prouvable, le marquer `BLOQUE`, poursuivre immediatement
tous les scenarios independants et ne fermer la fenetre que selon le watchdog
ou une condition de securite metier. Une boite de suivi facultative ou un
blocage d'automatisation n'autorise pas a abandonner silencieusement le reste
de la matrice.

Ne pas inventer une preuve manquante et ne pas considérer un transfert comme la réception dans la boîte d’origine.

## Gérer une anomalie

À la première anomalie :

1. arrêter uniquement le sous-parcours affecté ;
2. sécuriser et refermer immédiatement les contrôles si le paiement, le stock, l’identité ou l’idempotence peuvent être touchés ;
3. poursuivre seulement les scénarios réellement indépendants ;
4. consigner dans `anomalies.md` une entrée reproductible et sanitizée avec `runId`, environnement, identité non secrète, étapes, attendu, observé, impact, preuves, résidus et état des contrôles ;
5. préparer le handoff vers Sol (`GPT-5.6-sol`) sans proposer ni appliquer de correctif.

Ne modifier aucun code, n’appliquer aucun patch, ne déployer rien et ne changer ni secrets, rules, indexes, claims, DNS ou configuration cloud. Une demande de connexion humaine n’est pas une anomalie.

Ne créer aucun nouveau fichier Markdown de recette, plan, rapport, checkpoint ou handoff. Toute anomalie applicative va uniquement dans `anomalies.md`; les checkpoints transitoires restent dans la mémoire de la tâche et le rapport de campagne est rendu dans la réponse finale. Les documents canoniques ne sont modifiés que par Sol si une correction durable l’exige.

Un refus de permission du contrôle navigateur, un onglet fermé, une session Google absente ou une interaction biométrique ne sont pas des anomalies applicatives. Les classer comme blocages de surface, appliquer l’échelle de récupération et ne les inscrire dans `anomalies.md` que si le produit lui-même présente un défaut reproductible.

## Fermer proprement la campagne

Avant le rapport final :

1. archiver les meubles de recette par l’interface normale ;
2. préserver les commandes payées, remboursements et preuves financières ;
3. vérifier explicitement le produit résiduel A-015 et les documents A-016 ;
4. ramener et prouver les contrôles à `v2_fixture`, mutations admin `read_only`, paiement offline `off`, opérations `healthy`, zéro incident et zéro hold ;
5. fermer ou libérer proprement les onglets contrôlés selon le skill navigateur ;
6. lister tout résidu non supprimable ou toute preuve encore attendue.

Si la fermeture n’est plus garantie, arrêter toute nouvelle action et privilégier le retour à l’état sûr.

## Rendre le rapport final

Présenter un compte rendu concis mais complet avec :

- verdict global et `runId` ;
- matrice client et matrice administrateur ;
- commandes, montants et produits concernés ;
- résultat du paiement et du remboursement ;
- cohérence du stock et des permissions ;
- tableau M01–M13 ;
- e-mails reçus, retardés, manquants ou non exécutés dans chaque boîte ;
- anomalies inscrites et scénarios arrêtés ;
- données de recette ou résidus restants ;
- état final prouvé de tous les contrôles ;
- modèle exécuteur (`Luna` ou `Terra`) et niveau de raisonnement utilisé ;
- handoff précis vers Sol (`GPT-5.6-sol`) ;
- mention exacte : `Code modifié par l'agent de recette: NON`.

Ne jamais déclarer la recette réussie si une preuve obligatoire manque ou si les contrôles ne sont pas refermés.
