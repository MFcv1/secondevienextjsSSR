# OAuth Instagram et Facebook - Runbook Seconde Vie

Derniere verification: 2026-08-04  
Statut: `REFERENCE_ACTIVE - SANDBOX_OPERATIONNEL`  
Proprietaire: back-office / integrations sociales  
Perimetre: connexion professionnelle Instagram directe, Facebook optionnel,
publication sociale depuis `/admin`

## 1. Objet du document

Ce runbook explique de A a Z comment la connexion sociale de Seconde Vie a ete
construite, configuree, diagnostiquee et validee. Il sert a:

- reproduire la configuration sans reutiliser un ancien jeton;
- reconnecter un compte Instagram professionnel;
- comprendre la separation entre Instagram direct et Facebook;
- deployer les Functions et l'interface sans exposer de secret;
- diagnostiquer les erreurs OAuth deja rencontrees;
- preparer le passage du mode developpement a une application Meta publique.

Le PRD historique [META_OAUTH_PUBLICATION_PRD.md](META_OAUTH_PUBLICATION_PRD.md)
conserve le raisonnement produit, les gates et la saga de publication. Le
present document est la procedure operationnelle durable. Le comportement du
back-office reste decrit dans [BACKOFFICE.md](BACKOFFICE.md).

## 2. Etat reel valide

| Element | Valeur sandbox |
| --- | --- |
| projet Firebase | `secondevienextjsssr` |
| App Hosting | `secondevie-next-sandbox`, `europe-west4` |
| URL admin | `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/admin` |
| Functions OAuth | `europe-west1`, Node 22 |
| application Meta parente | `Seconde Vie Publications`, ID `1580711783405294` |
| application Instagram | `Seconde Vie Publications-IG`, ID `1728940675104024` |
| compte Instagram de recette | `@xori_on`, professionnel et public |
| Page Facebook optionnelle | `jardin perma` |
| callback Instagram | `https://europe-west1-secondevienextjsssr.cloudfunctions.net/instagramOAuthCallback` |
| callback Facebook | valeur du secret `META_OAUTH_REDIRECT_URI` |
| dernier correctif qualifie | commit `83b3a69` |
| Function Instagram qualifiee | `instagramOAuthCallback`, version 3 |

La connexion Instagram directe a ete validee dans le navigateur avec le compte
testeur autorise. Facebook reste connecte comme rail optionnel et fallback. Le
sandbox n'est pas une production publique: tant que l'application Meta reste
en mode developpement, seuls les comptes ayant un role autorise peuvent tester
le flux.

## 3. Decision d'architecture

Deux connexions sont volontairement separees:

1. **Instagram Login direct** est le rail prioritaire. Un compte Instagram
   Business ou Creator peut autoriser Seconde Vie sans posseder de Page ni de
   mot de passe Facebook.
2. **Facebook Login for Business** est facultatif. Il est utile uniquement si
   la meme publication doit aussi etre envoyee vers une Page Facebook ou si
   l'ancien compte Instagram lie a la Page sert temporairement de fallback.

Les identifiants et mots de passe sont saisis exclusivement sur les pages
officielles Instagram/Facebook. Le back-office ne les voit, ne les transporte
et ne les stocke jamais.

## 4. Vue d'ensemble du parcours

```text
administratrice /admin
  -> MetaConnectionControl [navigateur]
  -> startInstagramOAuthAdmin [callable, App Check + admin AAL2]
  -> state one-shot sys_meta_oauth_states/{stateId}
  -> popup officiel Instagram
  -> consentement instagram_business_basic + content_publish
  -> instagramOAuthCallback [HTTP public, state verifie]
  -> code court -> jeton court -> jeton long
  -> GET graph.instagram.com/me?fields=user_id,username
  -> chiffrement AES-GCM du jeton
  -> sys_meta_connections/instagram_direct
  -> postMessage + polling du statut serveur
  -> badge Connecte et @compte dans le back-office
```

Le navigateur n'est jamais autoritaire. La fermeture du popup n'est pas une
preuve de succes: seule la presence d'un etat serveur `connected` active le
badge et retire le bouton `Connecter en direct`.

## 5. Configuration Meta de A a Z

### 5.1 Creer ou selectionner l'application

Dans Meta for Developers:

1. creer une application metier dediee;
2. utiliser `Seconde Vie Publications` comme application parente;
3. ajouter le cas d'utilisation **API Instagram**;
4. choisir **Configuration de l'API avec la connexion Instagram**;
5. verifier que l'application Instagram enfant est
   `Seconde Vie Publications-IG`;
6. ne pas reutiliser l'application Chawi ni migrer son ancien jeton.

### 5.2 Activer les autorisations minimales

Le rail direct utilise uniquement:

- `instagram_business_basic`;
- `instagram_business_content_publish`.

Les permissions de messages ou de commentaires ne doivent pas etre demandees
si le produit ne les utilise pas. Reduire les scopes simplifie le controle app
et limite l'impact d'un jeton compromis.

### 5.3 Declarer le callback

Le callback configure dans Meta, le secret Firebase et la requete OAuth doivent
etre strictement identiques, caractere par caractere:

```text
https://europe-west1-secondevienextjsssr.cloudfunctions.net/instagramOAuthCallback
```

Une difference de protocole, region, casse, slash final ou encodage provoque
un refus d'echange du code.

### 5.4 Autoriser un compte testeur en mode developpement

Le parcours exact qui a fonctionne est:

1. ouvrir **Rôles dans l'application > Rôles**;
2. selectionner l'onglet **Testeurs Instagram**;
3. cliquer **Ajouter des personnes**;
4. choisir le role **Testeur(se) Instagram**;
5. taper le nom du compte, par exemple `xori_on`;
6. **selectionner la suggestion exacte** dans la liste;
7. cliquer **Ajouter**;
8. verifier que le compte apparait avec le statut `En attente`;
9. se connecter au compte Instagram concerne;
10. ouvrir **Parametres > Applications et sites Web > Invitations a tester**;
11. accepter `Seconde Vie Publications-IG`;
12. revenir dans Meta Developers et verifier que `En attente` a disparu.

Le point 6 est essentiel. Taper le nom sans selectionner la suggestion laisse
un formulaire visuellement rempli mais Meta refuse l'enregistrement.

### 5.5 Ajouter le compte dans la configuration API

Dans **Configuration de l'API avec la connexion Instagram > Générez des
tokens d'acces**:

1. cliquer **Ajouter un compte**;
2. continuer vers la connexion Instagram officielle;
3. se connecter avec le compte professionnel public;
4. verifier que le role testeur est reconnu.

Cette etape sert a confirmer la relation entre l'application et le compte de
test. La connexion persistante utilisee par Seconde Vie est ensuite creee par
le bouton du back-office, pas par un jeton copie manuellement.

## 6. Configuration Firebase et secrets

Les declarations sont centralisees dans `functions/helpers/secrets.js`.
Aucune valeur ne doit etre placee dans Git, un fichier Markdown, une capture ou
une variable `NEXT_PUBLIC_*`.

| Secret | Usage |
| --- | --- |
| `INSTAGRAM_APP_ID` | identifiant de l'application Instagram |
| `INSTAGRAM_APP_SECRET` | echange du code et prolongation du jeton |
| `INSTAGRAM_OAUTH_REDIRECT_URI` | callback Instagram exact |
| `META_TOKEN_ENCRYPTION_KEY` | chiffrement serveur des jetons Instagram et Facebook |
| `META_APP_ID` | application Facebook optionnelle |
| `META_APP_SECRET` | echange OAuth Facebook |
| `META_OAUTH_REDIRECT_URI` | callback Facebook |

Chaque Function ne recoit que les secrets necessaires. Le callback Instagram
utilise les quatre secrets Instagram/chiffrement; les callables de statut ne
recoivent pas les secrets d'application lorsqu'ils n'en ont pas besoin.

## 7. Contrat backend Instagram

### 7.1 Demarrage

`startInstagramOAuthAdmin`:

- exige App Check;
- exige un administrateur actif avec authentification forte AAL2;
- refuse une origine differente du site sandbox ou d'un localhost autorise;
- genere un `state` one-shot avec verifier aleatoire et hash;
- stocke seulement le hash, l'UID, l'origine, le TTL et le statut;
- renvoie l'URL officielle Instagram et l'origine attendue du callback.

### 7.2 Callback

`instagramOAuthCallback`:

1. accepte uniquement `GET`;
2. valide la forme, le hash, le fournisseur, le TTL et le statut du `state`;
3. reserve le state en transaction avec `processing`;
4. refuse une seconde utilisation;
5. echange le code contre un jeton court;
6. prolonge le jeton lorsque l'API le permet;
7. lit le profil professionnel;
8. chiffre le jeton;
9. ecrit la connexion durable;
10. marque le state `completed`;
11. avertit la fenetre d'origine par `postMessage` puis ferme le popup.

### 7.3 Particularite de la nouvelle API Instagram Login

La requete de profil correcte est:

```text
GET https://graph.instagram.com/<version>/me
fields=user_id,username
```

La reponse courante utilise une enveloppe:

```json
{
  "data": [
    {
      "user_id": "<IG_ID>",
      "username": "<IG_USERNAME>"
    }
  ]
}
```

Trois regles en decoulent:

- ne pas demander les anciens champs `id,user_type`;
- lire `data[0].user_id` et `data[0].username`;
- ne pas comparer `user_id` a l'identifiant app-scope du premier echange de
  token: ces deux identifiants peuvent differer et le jeton `/me` suffit a
  rattacher la reponse a l'utilisateur autorise.

`normalizeInstagramProfileResponse` concentre ce contrat et garde un fallback
compatible avec une ancienne reponse top-level.

## 8. Donnees Firestore

Toutes les collections ci-dessous sont backend-only dans les Rules:

| Document | Role |
| --- | --- |
| `sys_meta_connections/instagram_direct` | connexion Instagram directe chiffree |
| `sys_meta_connections/default` | Page Facebook et Instagram lie optionnels |
| `sys_meta_oauth_states/{stateId}` | tentative OAuth one-shot et TTL |
| `sys_meta_asset_choices/{sessionId}` | choix temporaire Page/Instagram Facebook |
| `sys_social_publications/{publicationId}` | saga et etats par destination |
| `sys_audit_meta/{eventId}` | audit fonctionnel sans jeton |

La projection renvoyee au navigateur contient seulement le statut, le nom du
compte, les capacites, les scopes connus et des dates en millisecondes. Elle ne
contient ni jeton chiffre, ni identifiant distant prive.

## 9. UX du back-office

`MetaConnectionControl` expose les etats suivants:

| Etat serveur | Affichage |
| --- | --- |
| aucune connexion | `Non connecte` + bouton `Connecter` |
| Instagram disponible via Page | badge `Via Facebook` + `Connecter en direct` |
| OAuth en cours | bouton `Connexion...`, controle temporairement bloque |
| Instagram direct confirme | badge `Connecte`, `@compte · connexion directe` |
| erreur ou annulation | message explicite et action de reprise |

Apres OAuth, deux mecanismes relisent le serveur:

- `postMessage` depuis le callback avec verification stricte de l'origine;
- polling toutes les 1,5 secondes comme filet de securite.

Le polling conserve une grace de 18 secondes apres la fermeture du popup. Ce
delai evite d'afficher un faux echec pendant que l'echange du jeton et la lecture
du profil terminent cote serveur.

Le succes visuel attendu est:

- controle superieur `Instagram · @xori_on`;
- point vert;
- badge `Connecte`;
- mention `connexion directe`;
- actions `Verifier`, `Reassocier`, `Deconnecter`;
- absence du bouton `Connecter en direct`.

## 10. Publication apres connexion

La publication du meuble reste autoritaire:

1. le produit est valide et publie sur le site;
2. `prepareSocialPublicationAdmin` fige le titre, l'histoire, les hashtags,
   les medias et le routage du fournisseur;
3. la connexion directe est preferee si elle est valide;
4. `runSocialPublicationAdmin` cree le media ou le carrousel, puis publie;
5. le statut durable est ecrit par destination;
6. une destination deja `published` n'est pas rejouee.

Instagram accepte au plus dix medias sociaux. Les medias supplementaires du
meuble restent destines au site. Facebook peut etre active ou desactive
independamment.

## 11. Deploiement cible

### 11.1 Verifications locales

```bash
node --test tests/meta-oauth-contract.test.cjs
npx eslint src/kit/admin/components/MetaConnectionControl.jsx \
  functions/src/integrations/meta.js \
  functions/src/integrations/metaContract.js \
  tests/meta-oauth-contract.test.cjs
npm run build
git diff --check
```

Si Turbopack ne peut pas ouvrir son processus local dans un environnement
restreint, le build de controle Webpack autorise par la documentation projet
peut confirmer la compilation. Le build App Hosting distant reste la gate du
sandbox.

### 11.2 Function callback uniquement

Le chemin normal est un deploiement Firebase cible. Si la CLI Firebase doit
etre reauthentifiee:

```bash
npx firebase-tools login --reauth
```

Puis deployer uniquement les Functions touchees. Ne pas recopier les valeurs
de secrets dans la commande ou les logs. Un deploiement `gcloud functions`
cible est acceptable seulement si la configuration existante a d'abord ete
lue et si runtime, service account, memoire, timeout et references Secret
Manager sont conserves exactement.

### 11.3 App Hosting

Apres commit et push de la branche:

```bash
npx firebase-tools apphosting:rollouts:create \
  secondevie-next-sandbox \
  --git-commit <commit> \
  --project secondevienextjsssr \
  --force
```

Attendre `Successfully created a new rollout`, puis recharger `/admin` et
verifier le libelle du controle social. Le rollback reste le rollout App
Hosting precedent; le callback peut etre redeploye depuis le commit precedent.

## 12. Recette reelle

1. ouvrir `/admin` avec un administrateur AAL2;
2. ouvrir **Catalogue > Publication**;
3. activer le panneau social;
4. cliquer **Connecter en direct**;
5. se connecter a Instagram dans le popup officiel;
6. laisser les permissions requises actives;
7. cliquer **Autoriser**;
8. ne pas recharger la page pendant 20 secondes;
9. verifier le badge `Connecte` et le nom du compte;
10. cliquer **Verifier** pour relire le profil avec le jeton chiffre;
11. effectuer ensuite une publication photo explicitement autorisee;
12. verifier le statut serveur et l'absence de doublon.

La fermeture du popup, un ecran de consentement ou un point vert provenant du
fallback Facebook ne suffisent pas a qualifier Instagram direct.

## 13. Incidents connus et resolutions

### `Role de developpeur insuffisant`

Cause: application en developpement et compte Instagram absent des testeurs,
invitation non acceptee, ou suggestion non selectionnee lors de l'ajout.

Resolution: reprendre la section 5.4, verifier le statut dans Meta Developers
et l'autorisation dans **Applications et sites Web > Invitations a tester**.
Un simple rechargement de la page d'erreur ne change aucun role.

### `Impossible d'enregistrer le formulaire`

Cause observee: le texte `xori_on` etait saisi mais la suggestion exacte n'avait
pas ete selectionnee.

Resolution: effacer, retaper, cliquer l'option exacte, puis ajouter.

### callback HTTP 400 avec `meta_100`

Cause observee: demande des anciens champs de profil `id,username,user_type`.

Resolution: utiliser `user_id,username` et lire l'enveloppe `data[]`.

### callback HTTP 400 avec `meta_error` sans trace Meta

Cause observee: comparaison locale entre l'identifiant app-scope du token et
le `user_id` professionnel du profil.

Resolution: rendre `data[0].user_id` autoritaire et supprimer cette comparaison.

### `La fenetre s'est fermee sans confirmation du serveur`

Cause observee: le popup disparaissait pendant que le callback travaillait
encore environ cinq secondes.

Resolution: conserver le polling et une grace de 18 secondes apres fermeture.

### le bouton `Connecter en direct` reste visible

Cela signifie que `sys_meta_connections/instagram_direct` n'est pas confirme,
meme si Instagram via Facebook est disponible. Consulter les logs du callback,
ne pas masquer le bouton artificiellement, puis corriger la cause serveur.

### Firebase CLI demande une reconnexion

L'ecran `Firebase CLI Login Successful` est normal apres `login --reauth`. Il
peut etre ferme des que le terminal confirme la connexion. Il n'est pas lie au
statut OAuth Instagram.

## 14. Diagnostic par logs

Ne jamais journaliser code OAuth, state brut, access token, mot de passe ou
reponse contenant un secret. Les logs autorises contiennent un code sanitise et
eventuellement le `fbtrace_id` Meta.

Exemple de lecture ciblee:

```bash
gcloud logging read \
  'resource.type="cloud_function" AND resource.labels.function_name="instagramOAuthCallback"' \
  --project=secondevienextjsssr \
  --limit=40
```

Interpretation:

- HTTP 200 + audit `instagram_oauth_connected`: connexion durable creee;
- HTTP 400 + `meta_100`: requete Graph invalide;
- HTTP 400 + code local: verifier normalisation, state et echange du jeton;
- absence de callback: verifier redirect URI, consentement et ouverture popup.

## 15. Securite et invariants

- aucun secret dans Git ou `NEXT_PUBLIC_*`;
- aucun token dans le navigateur ou les logs;
- state one-shot, hashe, expire et reserve en transaction;
- origine de retour bornee au site attendu;
- App Check + admin actif + AAL2 pour les callables;
- callback public protege par le state, pas par une session navigateur;
- jeton chiffre avec authentification AES-GCM;
- Firestore direct refuse sur toutes les collections sociales;
- deconnexion reservee au super-administrateur et confirmee par texte;
- publication idempotente et routage fige a la preparation;
- aucune activation publique implicite depuis une preuve sandbox.

## 16. Passage a une cliente externe

En mode developpement, ajouter manuellement chaque cliente comme testeuse n'est
pas une experience de production. Pour permettre a une cliente quelconque de
se connecter uniquement avec son compte Instagram professionnel:

1. completer les URL de confidentialite et suppression des donnees;
2. fournir les captures et explications exigees par Meta;
3. demander l'acces avance aux deux permissions Instagram;
4. terminer le controle app;
5. publier l'application Meta;
6. verifier les domaines et callbacks de production;
7. creer le projet/rail Firebase production distinct;
8. provisionner de nouveaux secrets de production;
9. refaire une recette avec un compte professionnel sans role developpeur;
10. surveiller les erreurs, expirations et reautorisations.

La cliente n'a alors pas besoin d'un compte Facebook pour Instagram direct.
Une Page Facebook reste necessaire uniquement si la publication Facebook est
elle aussi demandee.

## 17. Fichiers et preuves

| Role | Fichier |
| --- | --- |
| controle UI | `src/kit/admin/components/MetaConnectionControl.jsx` |
| client callables | `src/kit/admin/metaPublicationClient.js` |
| handlers OAuth et publication | `functions/src/integrations/meta.js` |
| contrats purs | `functions/src/integrations/metaContract.js` |
| declarations secrets | `functions/helpers/secrets.js` |
| exports | `functions/index.js` |
| tests | `tests/meta-oauth-contract.test.cjs` |
| comportement back-office | `_DOCS/admin/BACKOFFICE.md` |
| PRD et gates | `_DOCS/admin/META_OAUTH_PUBLICATION_PRD.md` |
| cartographie | `map.md` |

Commits structurants:

- `75ec511`: connexion professionnelle Instagram directe;
- `c70f065`: profil API courant et statuts UX explicites;
- `83b3a69`: identifiant professionnel autoritaire et attente du callback.

Git reste l'archive des essais intermediaires. Ce runbook doit etre mis a jour
dans le meme changement que toute modification de scopes, callback, secret,
collection, Function, provider, parcours de consentement ou statut de
production.
