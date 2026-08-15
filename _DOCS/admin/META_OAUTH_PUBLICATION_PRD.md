# PRD temporaire - Connexion Meta et publication sans friction

Derniere mise a jour: 2026-08-04
Statut: `PREUVES_M4_M5_HISTORIQUES - HOLD_META_RECONCILIATION`
Proprietaire fonctionnel: Seconde Vie
Reference prouvee: `jardindechawi`
Echeance de revue: 2026-10-31

Ce document est le plan d'implementation demande pour reproduire dans Seconde
Vie l'experience OAuth Meta deja validee dans Les Jardins de Chawi. Il ne
porte aussi l'etat d'execution: contrats, Functions, Rules, saga et interface
OAuth sont deployes sur le sandbox. La Gate M4 est fermee. La connexion OAuth
reelle M5 a ete validee avec `jardin perma` et `@xori_on`; la publication d'un
meuble de test sur le site, Instagram et Facebook reste volontairement non
executee tant qu'un contenu de test n'est pas explicitement autorise.

Addendum G0 du 2026-08-15: les preuves M4/M5 ci-dessus sont historiques et ne
decrivent plus l'inventaire cloud actuel. Les neuf Functions Meta/Facebook et
saga sont deployees, mais les cinq exports Instagram direct
`startInstagramOAuthAdmin`, `instagramOAuthCallback`,
`getInstagramConnectionStatusAdmin`, `verifyInstagramConnectionAdmin` et
`disconnectInstagramConnectionAdmin` sont uniquement locaux. La suppression
cloud du chantier securite a precede le merge source `6be360e`, qui a
reintroduit ces exports et leurs appelants UI sans les redeployer. G0 decide
`HOLD_META_RECONCILIATION`: ni redeploiement, ni retrait du source, ni nouvelle
preuve M4/M5 avant G7 et la requalification du redirect, des secrets, d'App
Check, de l'IAM et du rollback.

Decision ajoutee le 2026-08-04: Instagram Login devient le parcours principal.
Il autorise directement un compte Instagram professionnel sans Page Facebook.
Facebook Login for Business reste une connexion facultative pour publier aussi
sur une Page et un fallback de compatibilite pour l'ancien couple
Page/Instagram.

A la cloture, les decisions durables doivent etre fusionnees dans
`BACKOFFICE.md`, `INFRASTRUCTURE.md`, `SECURITE_GLOBALE.md`,
`QUALITE_TESTS.md` et `map.md`, puis ce document doit etre supprime. Git reste
l'archive du plan.

## 1. Decision produit

Seconde Vie doit proposer une connexion Meta sans saisie de jeton, d'ID de
Page ou d'identifiant Instagram dans le back-office.

Le parcours nominal est celui qui a fonctionne dans Les Jardins de Chawi:

1. l'administrateur clique sur `Connecter Instagram et Facebook`;
2. une fenetre officielle Meta s'ouvre;
3. l'administrateur se connecte a Facebook si necessaire et autorise les actifs
   demandes;
4. Meta revient automatiquement vers le backend Seconde Vie;
5. le backend detecte les Pages accessibles et leurs comptes Instagram
   professionnels associes;
6. si un seul couple admissible existe, il est selectionne automatiquement;
7. s'il en existe plusieurs, le back-office demande un choix lisible, sans
   exposer de jeton ni d'identifiant technique;
8. la connexion est memorisee cote serveur;
9. les publications suivantes utilisent cette connexion sans nouvelle saisie.

La connexion Meta sert a autoriser la publication sur les reseaux. Elle ne
remplace pas Firebase Auth et ne permet pas de se connecter au back-office avec
Facebook.

## 2. Resultat attendu

Une fois la connexion terminee, la cliente voit seulement:

- le statut `Connecte`;
- le nom de la Page Facebook;
- le nom du compte Instagram;
- la date de derniere verification;
- les actions `Verifier`, `Reassocier` et `Deconnecter` lorsque necessaires.

Elle ne voit jamais:

- un access token;
- l'App Secret Meta;
- une cle de chiffrement;
- un formulaire demandant un Page ID ou un Instagram User ID;
- le Graph API Explorer;
- une commande Firebase ou gcloud.

## 3. Reference fonctionnelle prouvee

Le depot local de reference est:

```text
/Users/matthis/Desktop/mes projets mac/jardindechawi
```

Depot GitHub observe:

```text
https://github.com/MFcv1/jardindechawi.git
```

Elements documentes dans ce projet:

| Element | Valeur historique |
| --- | --- |
| application Meta | `Mlk Publications API Test` |
| compte Facebook operateur | `Mlk Pta` |
| Page Facebook | `jardin perma` |
| compte Instagram professionnel | `@xori_on` |
| projet Firebase | `jardindechawi` |
| compte Google du projet | `jardinchawi@gmail.com` |
| region Functions | `europe-west9` |

Le flux historique exporte cinq operations:

- `createMetaOAuthConnectUrl`;
- `metaOAuthCallback`;
- `getMetaOAuthStatus`;
- `publishPublicationToConnectedMeta`;
- `disconnectMetaOAuth`.

Le callback echangeait le code OAuth, recuperait les Pages avec
`/me/accounts`, trouvait `instagram_business_account`, chiffrait le Page access
token en AES-256-GCM et l'enregistrait dans `meta_connections/default`. Le
navigateur ne recevait jamais ce token.

Cette preuve valide le principe, mais son code ne doit pas etre copie tel quel:
Chawi utilise une autre region, une architecture Functions monolithique et un
contrat d'administration moins fort que Seconde Vie.

Sources de preuve utilisees pour ce PRD:

- `/Users/matthis/Desktop/mes projets mac/jardindechawi/docs/meta-oauth-onboarding.md`;
- `/Users/matthis/Desktop/mes projets mac/jardindechawi/docs/meta-publications-test-plan.md`;
- `/Users/matthis/Desktop/mes projets mac/jardindechawi/functions/index.js`;
- `/Users/matthis/Desktop/mes projets mac/jardindechawi/src/admin/PublicationsManager.jsx`;
- `/Users/matthis/Desktop/mes projets mac/jardindechawi/src/admin/MetaFirebaseGuide.jsx`;
- collection officielle Meta Instagram API:
  `https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api`;
- aide officielle de liaison Page Facebook/Instagram:
  `https://www.facebook.com/help/1148909221857370`.

## 4. Perimetre V1

### Inclus

- connexion OAuth via Facebook Login for Business;
- detection des Pages Facebook accessibles;
- detection du compte Instagram professionnel lie a chaque Page;
- choix explicite si plusieurs couples Page/Instagram sont disponibles;
- stockage chiffre du token cote serveur;
- statut de connexion dans le module Publication;
- publication d'un meuble sur le site;
- publication optionnelle du contenu editorial sur Instagram;
- publication optionnelle du meme contenu editorial sur la Page Facebook;
- progression detaillee de l'envoi;
- reprise d'une destination en echec sans dupliquer les destinations reussies;
- re-association et deconnexion;
- audit des connexions, deconnexions et publications.

### Exclus

- Reels, Stories et videos;
- publicites et campagnes sponsorisees;
- messagerie et commentaires Instagram;
- statistiques sociales;
- connexion de plusieurs entreprises simultanees;
- connexion manuelle par token dans l'interface cliente;
- publication automatique sans action explicite de l'administrateur;
- activation production ou ouverture a des utilisateurs Meta arbitraires.

## 5. Contenu par destination

Le produit Firestore reste la source de verite du meuble. Le contenu social est
une projection editoriale, pas une seconde fiche produit.

| Information | Site | Instagram | Facebook |
| --- | --- | --- | --- |
| nom de l'ouvrage | oui | premiere ligne de la legende | premiere ligne du texte |
| histoire | oui, Markdown borne | texte brut nettoye | texte brut nettoye |
| hashtags | non necessaires | oui | oui si conserve par choix editorial |
| images | jusqu'a la limite site | 10 premieres maximum | medias compatibles Meta |
| categorie | oui | non | non par defaut |
| prix | oui | non | non par defaut |
| stock | oui | non | non |
| dimensions | oui | non | non |
| materiau/style | oui | non | non par defaut |

Instagram ne possede pas un champ `titre` separe pour une publication photo.
Le nom de l'ouvrage est donc integre au debut de la legende, suivi de
l'histoire et des hashtags. L'apercu iPhone doit reproduire exactement cette
legende finale.

Les medias supplementaires restent publies sur le site et sont signales avant
confirmation. Une URL remise a Meta doit etre recuperable par ses serveurs
pendant toute la creation du media; ce contrat doit etre verifie avec les URL
Storage actuelles avant le premier test reel.

## 6. Experience cible dans le back-office

### 6.1 Etat non connecte

Dans l'en-tete de `AdminForm`, le controle affiche:

```text
Instagram et Facebook
Non connecte
[Connecter]
```

Le clic ouvre un popup OAuth. Si le navigateur bloque le popup, un bouton de
repli permet d'ouvrir la meme autorisation dans l'onglet courant.

Aucun formulaire manuel ne doit apparaitre.

### 6.2 Connexion en cours

Le panneau reste utilisable et affiche des etapes comprehensibles:

```text
Ouverture de Meta
Autorisation du compte
Recherche de la Page et d'Instagram
Finalisation de la connexion
```

Le callback ferme le popup et notifie uniquement un succes ou une erreur
sanitisee a la fenetre d'origine. Le panneau recharge ensuite le statut depuis
le serveur.

### 6.3 Plusieurs Pages disponibles

Le serveur retourne une liste sanitisee contenant seulement:

- un identifiant de choix opaque;
- le nom et la photo de la Page lorsque disponible;
- le nom du compte Instagram associe;
- les destinations publiables.

La cliente choisit visuellement le bon couple. Le token reste cote serveur.

### 6.4 Etat connecte

Le controle devient par exemple:

```text
Connecte
Page: Seconde Vie
Instagram: @seconde_vie_pour_nos_objets
Derniere verification: aujourd'hui
```

Le switch de preparation sociale devient actif. L'apercu iPhone reste prive et
ne declenche aucun envoi.

### 6.5 Publication

Le bouton principal conserve le libelle `Publier l'ouvrage`. La confirmation
resume clairement les destinations cochees.

La progression affiche des etats reels, et non une animation temporisee:

1. `Preparation des images`;
2. `Publication sur le site`;
3. `Envoi vers Instagram` si coche;
4. `Envoi vers Facebook` si coche;
5. `Verification des publications`;
6. `Publication terminee` ou `Action requise`.

Si le site reussit et qu'Instagram echoue, le resultat doit dire:

```text
Site publie
Facebook publie
Instagram a reessayer
```

Le bouton de reprise ne rejoue que la destination Instagram.

## 7. Architecture cible Seconde Vie

```text
AdminForm [C]
  -> getMetaConnectionStatusAdmin [F]
  -> startMetaOAuthAdmin [F]
       -> state OAuth one-shot [DB]
       -> Facebook Login for Business [EXT]
  -> metaOAuthCallback [F HTTP]
       -> echange code/token [EXT]
       -> Pages + Instagram associe [EXT]
       -> token chiffre [DB]
  -> selectMetaAssetAdmin [F] si plusieurs choix
  -> publishProductAdmin / flux catalogue [F + DB + ST]
  -> createSocialPublicationAdmin [F]
       -> publication Facebook [EXT]
       -> conteneur Instagram + media_publish [EXT]
       -> etat durable par destination [DB]
  -> retrySocialPublicationDestinationAdmin [F]
```

Les nouveaux modules doivent vivre dans le codebase prive `functions/` et
utiliser `regionalFunctions()` en `europe-west1`. Le front Next/React appelle
les callables avec `getCallableFunction`; aucun SDK Meta ne doit etre charge
dans le bundle public.

Le callback OAuth HTTP est l'unique endpoint public du flux. Il ne peut pas
dependre d'App Check comme un callable navigateur, mais il doit verifier le
`state` one-shot, son expiration, son initiateur et l'URI de retour exacte.

## 8. Fonctions cibles

| Function | Type | Protection | Role |
| --- | --- | --- | --- |
| `getMetaConnectionStatusAdmin` | callable | App Check + admin actif + AAL2 | statut sanitise |
| `startMetaOAuthAdmin` | callable | App Check + admin actif + AAL2 | genere le state et l'URL Meta |
| `metaOAuthCallback` | HTTP | state signe/hashe, TTL, usage unique | echange le code OAuth |
| `selectMetaAssetAdmin` | callable | App Check + admin actif + AAL2 | choisit Page/Instagram sans exposer le token |
| `verifyMetaConnectionAdmin` | callable | App Check + admin actif + AAL2 | controle les permissions et actifs |
| `disconnectMetaConnectionAdmin` | callable | App Check + owner/AAL2 + confirmation | invalide la connexion locale |
| `createSocialPublicationAdmin` | callable/interne | admin actif + AAL2 + idempotence | cree le suivi social apres la publication site |
| `retrySocialPublicationDestinationAdmin` | callable | admin actif + AAL2 + idempotence | reprend une destination echouee |

Le nom exact des exports peut etre ajuste pendant l'implementation, mais leur
separation de responsabilites doit rester.

## 9. Donnees serveur

Collections recommandees:

```text
sys_meta_connections/default
sys_meta_oauth_states/{stateId}
sys_meta_asset_choices/{choiceSessionId}
sys_social_publications/{publicationId}
sys_audit_meta/{eventId}
```

Elles sont interdites en lecture et ecriture directe depuis le navigateur. Les
callables ne retournent que des projections sanitisees.

`sys_meta_connections/default` contient au minimum:

- statut de connexion;
- Page et Instagram selectionnes;
- permissions observees;
- token chiffre et metadata de chiffrement;
- date de connexion et derniere verification;
- acteur de la connexion;
- cause sanitisee d'une eventuelle reautorisation.

`sys_social_publications/{publicationId}` contient un etat durable et
idempotent par destination:

```text
site: pending | published | failed
instagram: skipped | pending | container_created | published | failed
facebook: skipped | pending | published | failed
```

Les identifiants distants Meta sont enregistres des qu'ils existent afin qu'un
retry ne recree pas aveuglement un post ou un conteneur.

## 10. Secrets

Les secrets sont declares dans `functions/helpers/secrets.js` et attaches
uniquement aux Functions qui en ont besoin:

- `META_APP_ID`;
- `META_APP_SECRET`;
- `META_OAUTH_REDIRECT_URI`;
- `INSTAGRAM_APP_ID`;
- `INSTAGRAM_APP_SECRET`;
- `INSTAGRAM_OAUTH_REDIRECT_URI`;
- `META_TOKEN_ENCRYPTION_KEY`.

Le redirect URI sandbox cible sera determine par l'export HTTP deploye en
`europe-west1` puis ajoute a l'application Meta. Sa valeur doit correspondre
octet pour octet entre Secret Manager, la requete OAuth et la configuration
Meta.

Aucun secret, token, code OAuth ou contenu du `state` ne doit etre journalise,
committe ou retourne au navigateur.

## 11. Securite obligatoire

- `state` aleatoire fort, stocke sous forme de hash, TTL de dix minutes maximum
  et consommation unique;
- liaison du state a l'UID admin initiateur et a l'origine sandbox autorisee;
- callback refuse si le state est absent, expire, deja utilise ou incoherent;
- echange du code uniquement cote serveur;
- token chiffre par AES-256-GCM avec nonce unique et tag d'authentification;
- collections techniques fermees par Rules;
- callables proteges par App Check, registre admin actif et AAL2;
- deconnexion/reassociation reservee a l'owner ou protegee par confirmation
  explicite selon le risque retenu;
- audit sans secret pour connexion, choix d'actif, verification, deconnexion,
  publication et reprise;
- allowlist stricte de l'origine utilisee par `postMessage`;
- messages d'erreur Meta sanitises avant retour client;
- aucune confiance dans un Page ID, IG ID, prix, stock ou URL fournis par le
  navigateur.

## 12. Publication et idempotence

Meta et Firestore ne proposent pas une transaction distribuee commune. Le
produit ne doit donc jamais promettre une atomicite impossible.

La V1 utilise une saga durable:

1. creer ou mettre a jour le meuble avec la commande catalogue autoritaire;
2. attendre que les URLs medias requises soient disponibles;
3. creer un document de publication sociale avec une cle idempotente liee a la
   commande produit et au hash du contenu social;
4. publier chaque destination demandee;
5. enregistrer immediatement chaque identifiant distant obtenu;
6. marquer le resultat par destination;
7. proposer une reprise limitee aux destinations non terminees.

Une modification du meuble apres un echec ne doit pas modifier silencieusement
le contenu d'une reprise existante. La reprise utilise le snapshot social fige
au moment de la confirmation, sauf action explicite `Creer une nouvelle
publication`.

## 13. Permissions et mode Meta

Pour publier simultanement sur une Page Facebook et son compte Instagram lie,
la reference Chawi demandait:

- `pages_show_list`;
- `pages_read_engagement`;
- `pages_manage_posts`;
- `instagram_basic`;
- `instagram_content_publish`;
- `business_management` lorsque requis par la configuration Meta.

La liste finale doit etre relue dans le tableau de bord Meta au moment de la
configuration, car Meta peut faire evoluer les produits, noms et conditions
d'acces.

Pour un usage interne, le compte qui autorise la connexion peut rester un
utilisateur ayant un role sur l'application en mode test/developpement. Pour
permettre a des clients Meta arbitraires de connecter leur propre entreprise,
il faudra une passe distincte: application live, verification entreprise et
App Review/Advanced Access. Cette ouverture n'est pas incluse dans la V1.

## 14. Informations deja suffisantes

| Sujet | Etat | Consequence |
| --- | --- | --- |
| preuve OAuth fonctionnelle | suffisante | le principe n'est plus a prototyper |
| code Chawi | disponible | reutilisable comme reference de protocole |
| architecture Seconde Vie | connue | modules, region et securite identifies |
| interface Instagram | presente | point d'integration UI deja construit |
| compte Firebase Seconde Vie | connu | cible sandbox identifiee |
| application Meta dediee | `Seconde Vie Publications` (`1580711783405294`) | configuree et utilisee sur le sandbox |
| actifs Meta de recette | `jardin perma` / `@xori_on` | OAuth et verification serveur valides |

Ces informations suffisent pour implementer localement le backend, l'interface,
les tests et les contrats de donnees sans demander de secret dans le chat.

## 15. Interventions humaines encore necessaires

| Intervention | Qui | Moment | Obligatoire |
| --- | --- | --- | --- |
| fournir un contenu de publication de test explicitement autorise | utilisateur | avant la fin de M5 | oui |
| valider un eventuel code 2FA Meta | utilisateur | pendant la connexion | selon Meta |
| fournir l'identite Facebook de la cliente si elle doit tester avant publication de l'app Meta | utilisateur | recette cliente en mode developpement | selon besoin |
| valider les textes et URL de confidentialite/suppression des donnees | utilisateur/juridique | avant publication de l'app Meta | oui |
| soumettre les permissions en acces avance et publier l'app Meta | Codex apres validation des prerequis Meta | ouverture aux clientes externes | oui |
| se connecter a `jardinchawi@gmail.com` | utilisateur | seulement pour inspecter l'ancien Firebase/token | optionnel pour la nouvelle integration |

L'ancien compte Firebase Chawi n'est pas requis pour recreer le parcours. Il
sert uniquement a verifier l'etat historique du token ou a recuperer une
configuration qui ne serait plus accessible dans Meta Developers. L'ancien
token ne doit pas etre migre dans Seconde Vie.

## 16. Decision recommandee sur l'application Meta

La decision executee est une application dediee `Seconde Vie Publications`,
distincte de `Mlk Publications API Test`. Elle porte les cas d'utilisation
Instagram et Pages, les six permissions de publication en mode test, le
redirect Firebase et les domaines sandbox. Le token Chawi n'a pas ete migre.

## 17. Gates d'implementation

### Gate M0 - Acces et choix des actifs

- connexion read-only a Meta Developers;
- verification de l'application historique;
- confirmation Page Facebook + Instagram Seconde Vie;
- decision documentee `reutiliser` ou `recreer`;
- aucune suppression ni rotation de secret.

Sortie: application cible et actifs cibles confirmes.

### Gate M1 - Contrats backend locaux

- secrets declares sans valeur dans le depot;
- module OAuth et chiffrement;
- state one-shot;
- fonctions de statut/connexion/choix/deconnexion;
- schemas Firestore et Rules deny-by-default;
- tests unitaires state, chiffrement, permissions et projections sanitisees.

Sortie: flux backend testable sans appel Meta reel.

### Gate M2 - Interface sans friction

- bouton Connecter dans Publication;
- popup et repli meme onglet;
- progression de connexion;
- choix visuel des actifs si necessaire;
- statut persistant, verification et reassociation;
- aucun champ technique visible.

Sortie: experience complete avec adaptateur Meta simule.

### Gate M3 - Saga de publication

- snapshot social fige;
- idempotence par meuble/contenu/destination;
- publication Instagram photo/carrousel;
- publication Facebook Page;
- progression issue de l'etat serveur;
- reprise ciblee et prevention des doublons.

Sortie: orchestration qualifiee avec adaptateurs simules et fautes injectees.

### Gate M4 - Configuration sandbox

- Functions ciblees deployees en `europe-west1`;
- Rules deployees;
- secrets provisionnes sans exposition;
- redirect URI exact ajoute dans Meta;
- compte operateur autorise sur l'application de test.

Sortie: bouton OAuth capable d'atteindre Meta sur le sandbox.

### Gate M5 - Recette reelle bornee

- connexion OAuth reelle;
- verification du couple Page/Instagram affiche;
- publication d'un meuble de test autorise sur le site;
- une publication photo Instagram;
- une publication Page Facebook;
- verification des identifiants distants et de l'absence de doublon;
- deconnexion/reassociation seulement si incluse dans la fenetre de recette.

Sortie: `PREPROD_READY` pour l'usage interne sandbox. Aucun GO production.

### Gate M6 - Cloture documentaire

- etat reel fusionne dans les chapitres canoniques;
- `map.md`, exports Functions, secrets et collections mis a jour;
- procedures de verification/reconnexion ajoutees a l'exploitation;
- ce PRD temporaire supprime apres transfert complet.

## 18. Tests attendus

Tests locaux minimaux:

- state absent, incorrect, expire, reutilise et lie a un autre UID;
- chiffrement/dechiffrement, nonce unique et detection d'alteration;
- origine OAuth non autorisee;
- zero, une ou plusieurs Pages;
- Page sans Instagram professionnel;
- permissions manquantes;
- token absent, expire ou revoque;
- legende normalisee et bornee;
- plus de dix images;
- reponse Meta perdue apres creation d'un conteneur ou d'un post;
- retry sans doublon;
- echec Instagram avec site/Facebook reussis;
- refus Firestore direct visiteur, client et admin navigateur;
- callable refuse sans Auth, sans App Check, sans registre ou sans AAL2;
- aucune valeur sensible dans les projections et logs testes.

Validations projet proportionnees pendant l'implementation:

```bash
npm run lint
npm run test:auth
npm run build
```

Une suite cible `test:meta` devra etre ajoutee pour les contrats OAuth, la saga
et les Rules. Les tests reels Meta restent une gate externe sandbox et ne
doivent pas etre lances automatiquement.

## 19. Criteres d'acceptation

La V1 est acceptee lorsque:

- aucune cle ou ID technique n'est demande a la cliente;
- une connexion normale demande au maximum un clic Seconde Vie, la validation
  officielle Meta et, si necessaire, un choix de Page lisible;
- le statut survit au rechargement du back-office;
- Page et Instagram affiches correspondent aux actifs choisis;
- le meuble est publiable sur le site sans activer les reseaux;
- Instagram et Facebook sont activables independamment avant confirmation;
- l'apercu Instagram correspond au payload reel;
- la progression represente les vrais etats serveur;
- un echec partiel est explicite et reprenable;
- aucun retry ne duplique une publication reussie;
- aucun token Meta n'atteint le navigateur, Firestore client ou les logs;
- la connexion et la publication exigent un administrateur actif AAL2;
- la qualification reste bornee au sandbox et aux comptes autorises.

## 20. Point de depart concret

Au prochain accord d'implementation, l'ordre de travail recommande est:

1. implementer M1 et M2 localement avec un adaptateur Meta simule;
2. demander ensuite la connexion Meta, pas avant;
3. confirmer l'application et les actifs pendant M0/M4;
4. provisionner les secrets et le redirect URI;
5. terminer M3 puis effectuer une seule recette reelle bornee M5.

Ainsi, la cliente n'a pas besoin de rester disponible pendant le developpement.
Son intervention est concentree au moment de l'autorisation Meta et du choix
des comptes reels.
