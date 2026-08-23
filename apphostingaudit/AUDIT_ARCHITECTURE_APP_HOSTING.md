# Audit architecture Firestore, App Hosting et exploitation

Date de l'audit: 2026-08-13

Environnement observe: sandbox Firebase `secondevienextjsssr`

Backend App Hosting: `secondevie-next-sandbox`

Statut: `PHOTOGRAPHIE_TECHNIQUE_READ_ONLY_AVEC_ADDENDUM_2026_08_15`

Proprietaire: equipe Seconde Vie
Condition de relecture: apres fermeture des points P0, avant creation du rail production, ou au plus tard avant l'ouverture publique des paiements live.

## 1. Role et limites de ce document

Ce document conserve la photographie technique demandee de l'architecture
Firestore, App Hosting, Functions, catalogue, comptes, commandes et
observabilite au 2026-08-13.

Il ne remplace pas les chapitres canoniques:

- `_DOCS/infra/INFRASTRUCTURE.md`;
- `_DOCS/data/DONNEES_ANALYTICS.md`;
- `_DOCS/catalogue/ANNONCES_CATALOGUE.md`;
- `_DOCS/commerce/COMMERCE_SYNTHESE.md`;
- `_DOCS/commerce/COMMERCE_STRIPE.md`;
- `_DOCS/operations/EXPLOITATION.md`.

Les valeurs cloud, volumes et incidents de ce document sont une observation
ponctuelle. Toute decision durable ou correction doit etre reportee dans le
chapitre canonique du domaine concerne.

L'audit a ete realise en lecture seule. Aucun document Firestore, objet
Storage, secret, index, Function, configuration App Hosting ou deploiement n'a
ete modifie.

### 1.1 Addendum de contre-audit du 2026-08-15

La photographie du 13 aout reste conservee pour l'historique, mais les valeurs
dynamiques suivantes la remplacent pour toute execution:

| Element | Etat revalide |
| --- | --- |
| Functions | 152 actives: 139 Gen1 et 13 Gen2; 157 exports locaux, dont 5 Instagram uniquement locaux |
| dispatcher reservations | redeploye et actif; runs recents `ok`, mais aucune expiration metier bornee n'a encore prouve l'effet idempotent |
| Firestore | PITR et delete protection desactives; aucun backup ni schedule; 13 indexes `READY`, 2 TTL actifs |
| Monitoring | 0 policy, 0 metrique logs personnalisee, 0 dashboard personnalise; canaux non verifies |
| budget/quota | budget Billing non verifie faute d'API/droits; aucune alerte quota confirmee |
| commerce | 1 `terminal_refund_conflict` ouvert alors que la sante publie `healthy` |
| Storage | soft delete 7 jours sur media/catalogue, versioning absent, restauration d'objet non testee |
| risque operateur | Firebase vise le bon sandbox, mais le projet `gcloud` global observe est `vibefx-v2` |

Le verdict consolide est donc:

- la presentation cliente du sandbox reste raisonnable avec Stripe test borne
  et surveillance manuelle;
- l'architecture Firestore/App Hosting reste adaptee et scalable pour le volume
  d'une boutique de mobilier specialisee;
- les paiements reels et un rail production restent interdits avant les quatre
  P0: alertes/runbooks, restauration globale prouvee, faux `healthy` corrige et
  dispatcher/workers prouves sur leurs effets aval;
- les dix `inventoryVersion`, vingt-six commandes/KPI et limites du reconciler
  sont P1; le nettoyage analytics historique est P2 et ne bloque pas la demo.

La migration G0 a G13 est fermee. Sa decision d'architecture durable se trouve
dans [FUNCTIONS_RUNTIME_ADR.md](../_DOCS/architecture/FUNCTIONS_RUNTIME_ADR.md),
et ses preuves cloud restent dans `apphostingaudit/manifests/`. Ces preuves
finales priment sur les nombres historiques des sections 3, 9, 10 et 13 du
present document.

Une restauration Firestore geree cree une nouvelle base nommee dans le meme
projet et la meme localisation. Elle inclut donnees et indexes, mais pas Rules
ni TTL; elle ne bascule pas `(default)` et ne restaure ni Auth, Storage, secrets,
configuration, queues, endpoints Stripe ou etat physique du stock. Un runbook
commerce doit rapprocher ces actifs avant toute remise en service.

## 2. Verdict executif

L'architecture est serieusement pensee et adaptee a un e-commerce de mobilier
comme Seconde Vie. La base n'est pas un empilement improvise de documents
Firestore. Le catalogue public, le stock, les commandes, Stripe, les comptes,
les projections et les audits sont separes par responsabilite.

Verdict au 2026-08-13:

| Perimetre | Verdict |
| --- | --- |
| presentation cliente vitrine/catalogue/admin/comptes | `OUI` |
| campagne fonctionnelle sandbox avec Stripe test | `OUI SOUS SURVEILLANCE`, worker actif mais preuve metier/alertes encore requises |
| ouverture commerciale publique avec paiements live | `NON` |
| architecture Firestore pour une petite ou moyenne boutique specialisee | `ADAPTEE` |
| tres gros trafic ou catalogue de dizaines de milliers de references | `ADAPTATIONS NECESSAIRES` |

Le code metier et les invariants transactionnels sont plus matures que la
protection operationnelle qui les entoure. Les risques principaux ne sont pas
la capacite brute de Firestore, mais les sauvegardes absentes, des workers dont
les effets aval ne sont pas encore prouves/alertes, un incident financier
ouvert insuffisamment remonte par la sante commerce et l'absence d'alertes
automatiques.

Evaluation indicative:

| Axe | Evaluation |
| --- | --- |
| architecture metier et Firestore | 8/10 |
| securite des acces et coherence transactionnelle | 8/10 |
| scalabilite adaptee a l'activite | 8/10 |
| exploitabilite et detection d'incidents | 5/10 |
| protection contre la perte de donnees | 3/10 |
| preparation production globale | 5/10 |

Ces notes servent uniquement a rendre le verdict lisible. Elles ne constituent
pas un engagement de disponibilite ni un GO production.

## 3. Etat observe

### 3.1 Firestore

| Element | Valeur observee |
| --- | --- |
| base | Firestore Native `(default)` |
| localisation | `eur3`, multi-region Europe |
| mode de concurrence | `PESSIMISTIC` |
| Point-in-Time Recovery | desactive |
| retention native des versions | environ une heure |
| protection contre la suppression | desactivee |
| sauvegardes disponibles | aucune |
| calendrier de sauvegarde | aucun |
| index composites observes | 13, tous `READY` |
| politiques TTL cloud | `sys_catalog_publication_builds.expireAt` et `sys_catalog_publication_events.expireAt` |

La localisation `eur3` apporte une bonne resilience d'infrastructure. Elle ne
protege cependant pas d'une suppression logique, d'un mauvais script Admin SDK
ou d'une mutation valide mais incorrecte. La replication multi-region n'est
pas une sauvegarde.

### 3.2 App Hosting

| Element | Valeur observee |
| --- | --- |
| backend | `secondevie-next-sandbox` |
| region | `europe-west4` |
| `minInstances` | 0 |
| `maxInstances` | 10 |
| concurrence configuree | 80 |
| CPU | 1 |
| memoire | 512 MiB |
| etat HTTP ponctuel de `/` | 200 |
| etat HTTP ponctuel de `/api/catalog/version` | 200 |
| revision catalogue publique | 291 |

`minInstances: 0` est coherent avec un sandbox et accepte les cold starts pour
limiter les couts. Le couple `maxInstances: 10` et `concurrency: 80` ne signifie
pas 800 utilisateurs garantis. Il borne surtout le nombre theorique de requetes
simultanees que le runtime peut accepter avant attente ou refus, selon leur
duree, leur consommation memoire, le demarrage des instances et les quotas
amont.

Pour la boutique actuelle, cette configuration est raisonnable. Elle devra
etre confirmee par une mesure de charge avant une campagne marketing ou une
ouverture publique importante.

### 3.3 Cloud Functions

L'inventaire initial avait retourne 148 Functions. La contre-verification du
2026-08-15 remplace cette valeur par:

- 152 Functions cloud;
- 146 en `europe-west1`;
- 6 en `us-central1`;
- 139 en generation 1;
- 13 en generation 2;
- 152 `ACTIVE`.

La documentation infrastructure mentionnait encore un inventaire historique
de 91 Functions. Cette divergence doit etre corrigee apres un inventaire
controle des exports et des cibles deployees.

### 3.4 Volumes de donnees utiles

Volumes agreges observes sans lecture ni restitution de donnees personnelles:

| Domaine | Volume |
| --- | ---: |
| meubles `furniture` | 36 |
| profils `users` | 42 |
| commandes | 125 |
| reservations inventaire | 107 |
| mouvements inventaire | 223 |
| inbox webhooks commerce | 159 |
| outbox commerce | 127 |
| faits financiers | 73 |
| resultats de commandes idempotentes | 168 |
| sessions analytics actives | 345 |
| incidents commerce | 10 documents, dont 1 incident metier ouvert |

Ces volumes sont tres faibles au regard des capacites Firestore. Aucun signal
ne montre une base proche d'une limite de capacite.

## 4. Architecture des donnees

### 4.1 Organisation par domaine

L'arbre Firestore utilise des namespaces coherents:

```text
catalogue
  artifacts/{appId}/public/data/furniture/{productId}
  sys_catalog_*

identite et comptes
  users/{uid}
  users/{uid}/cart/{itemId}
  users/{uid}/wishlist/{itemId}
  users/{uid}/passkeys/{credentialId}
  sys_admin_access
  sys_audit_security

commerce
  orders/{orderId}
  inventory_reservations
  inventory_movements
  commerce_webhook_inbox
  commerce_outbox
  commerce_financial_*
  commerce_incidents
  commerce_command_results
  sys_commerce_*

analytics
  analytics_sessions
  analytics_* historiques

contenus et operations
  quote_requests
  newsletter_*
  sys_meta_*
  sys_metadata
  sys_ratelimit
  sys_idempotency
```

L'utilisation des prefixes permet de retrouver rapidement le domaine d'un
document dans la console Firestore ou dans les logs. La base comporte environ
59 collections racines, mais elles ne sont pas nommees de maniere aleatoire.

La complexite vient surtout de l'historique du projet:

- plusieurs generations analytics coexistent encore;
- 26 commandes legacy coexistent avec 99 commandes v2;
- quelques collections de fixtures et de preuves restent presentes;
- les fonctions et projections ont ete ajoutees progressivement.

Ce n'est pas une base desorganisee. C'est une base structuree qui commence a
accumuler des couches historiques et qui exige maintenant un inventaire de
cycle de vie explicite.

### 4.2 Sources autoritaires et projections

Le projet distingue correctement les sources de verite et les vues derivees:

| Donnee | Source autoritaire | Projection ou cache |
| --- | --- | --- |
| meuble, prix, stock, publication | `furniture` | snapshot catalogue Storage |
| commande | `orders/{orderId}` | vues client/admin et timeline |
| stock reserve/consomme | reservations et mouvements | champs stock du produit |
| paiement | Stripe + faits financiers durables | totaux et series journalieres |
| e-mail commerce v2 | outbox commerce | statut d'envoi et identifiant provider |
| e-mail legacy commande/devis | envoi direct encore present | dette: claim/outbox durable avant coexistence Gen1/Gen2 |
| catalogue public | release Storage immutable | API same-origin et ISR |
| analytics | `analytics_sessions` | calculs admin bornes |

Cette distinction est fondamentale en NoSQL. Elle evite de traiter une valeur
copiee dans le panier, la wishlist, une page publique ou un tableau de bord
comme une verite metier.

## 5. Catalogue et base de meubles

### 5.1 Architecture publique

Le catalogue public ne lit plus Firestore a chaque visite:

```text
furniture autoritaire
  -> trigger de mutation
  -> build catalogue borne par lease
  -> release immutable dans Storage
  -> current / previous / last-known-good
  -> API catalogue same-origin
  -> App Hosting, ISR, recherche et pages publiques
```

C'est l'une des meilleures decisions de l'architecture. Un afflux de visiteurs
ne multiplie pas directement les lectures de `furniture`. Storage, les objets
immuables et les caches App Hosting absorbent l'essentiel du trafic public.

Le lecteur valide les manifestes et les checksums, puis essaie `current`,
`previous` et `last-known-good`. Il ne retombe pas silencieusement sur
Firestore. Une release incorrecte reste donc isolable et un rollback catalogue
est possible.

### 5.2 Coherence observee

Sur les 36 meubles observes:

- 32 sont publies;
- 4 sont archives;
- aucun stock n'est negatif;
- aucun nom utile ne manque;
- aucun tableau d'images n'est vide;
- 10 meubles publies n'ont pas encore `inventoryVersion` materialisee.

Les 10 documents sans `inventoryVersion` ne provoquent pas actuellement de
defaut car le checkout interprete explicitement l'absence comme la version 0.
Ils representent toutefois une dette de normalisation. Lors d'un diagnostic,
un operateur doit savoir si l'absence est historique ou si une ecriture a
oublie le champ.

### 5.3 Limite de scalabilite du builder

Chaque nouvelle release relit actuellement la collection `furniture` complete
pour reconstruire la projection. Avec quelques dizaines, centaines ou quelques
milliers de meubles et une frequence de publication artisanale, cette strategie
reste simple et fiable.

Elle ne conviendrait pas telle quelle a une marketplace possedant des dizaines
de milliers de references et des mutations continues. Dans ce cas, il faudrait
partitionner ou construire des projections incrementales. Ce n'est pas une
limite bloquante pour Seconde Vie.

## 6. Commandes, stock et paiements

### 6.1 Garanties techniques

Le noyau commerce implemente les mecanismes attendus pour resister aux doubles
clics, retries reseau, webhooks repetes et modifications concurrentes:

- prix et stock relus cote serveur;
- creation de commande et reservation de stock dans des transactions;
- `clientOrderId` et hash de requete idempotents;
- `commandId`, `payloadHash` et `expectedVersion` pour les commandes;
- `stateVersion` pour refuser un editeur obsolete;
- reservation, commit et liberation du stock separes;
- mouvements de stock deterministes et append-only;
- inbox Stripe dedupliquee;
- leases et fencing pour empecher un ancien worker d'ecrire tardivement;
- outbox e-mail reprenable avec backoff et dead-letter;
- faits financiers append-only;
- projections financieres reconstruisibles;
- remboursement financier separe du retour physique et du restock.

Cette architecture est plus sure qu'un unique document de commande modifie
librement depuis le navigateur.

### 6.2 Coherence observee

Les controles agreges ont releve:

- 99 commandes v2 avec une version d'etat valide;
- 26 commandes historiques sans `schemaVersion` v2;
- aucune commande sans proprietaire;
- aucune commande sans article;
- aucune quantite de reservation negative ou invalide;
- 59 reservations `committed`;
- 43 reservations `released`;
- 4 reservations `restocked`;
- aucune reservation encore `held` au moment de l'audit;
- 159 evenements webhook tous `processed`;
- 127 messages outbox tous `sent`.

Le melange legacy/v2 est pris en charge par des adaptateurs et des barrieres
explicites. Il reste maintenable a ce volume, mais augmente le nombre de cas a
connaitre lors d'un incident.

## 7. Comptes clients et autorisations

Les comptes suivent une separation correcte:

- Firebase Auth porte l'identite;
- `users/{uid}` porte le profil materialise;
- panier et wishlist sont des sous-collections du proprietaire;
- les passkeys sont gerees par Functions;
- le registre administrateur est separe dans `sys_admin_access`;
- les commandes sont lisibles par le UID materialise, jamais par une simple
  egalite d'adresse e-mail;
- les profils racines, roles et donnees de securite sont backend-only en
  ecriture;
- les collections commerce, audits et secrets logiques sont backend-only.

Les Rules Firestore et Storage appliquent une fermeture par defaut. Les donnees
sensibles ne deviennent pas publiques lorsqu'un nouveau dossier ou une nouvelle
collection apparait sans regle explicite.

## 8. Les 139 Functions de generation 1

### 8.1 Ce que ce nombre signifie

`139 Functions generation 1` ne signifie pas que 139 serveurs tournent en
permanence. Chaque endpoint Firebase deploye est compte comme une Function:

- envoyer un OTP;
- creer un checkout;
- reprendre un checkout;
- lister des commandes;
- publier un produit;
- traiter un webhook;
- administrer une livraison;
- etc.

La plupart des endpoints du projet utilisent le helper
`functions/helpers/runtime.js`, qui importe `firebase-functions/v1`. Ils sont
donc deployes sur Cloud Functions generation 1. Avec `minInstances` absent ou
a zero, une Function ne conserve pas necessairement une instance active en
permanence.

### 8.2 Difference avec la generation 2

La generation 1 traite normalement une requete a la fois par instance, puis
autoscale en creant d'autres instances. La generation 2 repose sur Cloud Run et
peut traiter plusieurs requetes concurrentes dans une meme instance. Elle offre
notamment:

- une meilleure absorption des pics avec moins de cold starts;
- un controle explicite de la concurrence;
- des capacites et durees d'execution plus larges;
- une gestion de revisions et de trafic plus moderne;
- Eventarc et une integration Cloud Run plus complete.

Firebase recommande la generation 2 pour les nouvelles Functions lorsque le
trigger le permet, tout en annoncant le maintien du support de la generation 1.

### 8.3 Verdict pour Seconde Vie

La presence de 139 Functions generation 1 est une dette technique future, pas
un incident et pas un blocage pour le trafic previsible de Seconde Vie.

Le vrai cout est operationnel:

- grande surface de deploiement;
- temps de build/deploiement;
- melange generation 1/generation 2;
- inventaire documentaire plus difficile;
- plus grand risque d'oublier une Function lors d'une reprise ciblee;
- cold starts potentiellement plus visibles sous pic.

Il ne faut pas lancer une migration massive generation 1 vers generation 2
juste avant la presentation cliente. La migration devra etre progressive,
bornee par domaine et accompagnee de tests de compatibilite, de monitoring et
d'un rollback. Certains triggers Auth ou historiques peuvent aussi justifier
de conserver temporairement la generation 1.

## 9. Problemes prioritaires trouves

### P0.1 - Sauvegarde et recuperation Firestore absentes

Etat observe:

- PITR desactive;
- protection contre la suppression desactivee;
- aucune sauvegarde;
- aucun calendrier de sauvegarde;
- retention native d'environ une heure seulement.

Impact:

- une suppression logique ou une mauvaise operation Admin SDK peut devenir
  difficile ou impossible a recuperer;
- la replication `eur3` ne suffit pas;
- aucun test de restauration ne prouve aujourd'hui le RTO/RPO.

Action avant production:

1. activer PITR;
2. activer la protection contre la suppression;
3. programmer des sauvegardes quotidiennes et hebdomadaires;
4. definir les durees de conservation;
5. restaurer vers une nouvelle base nommee du meme projet et de la meme
   localisation, sans toucher `(default)`;
6. verifier indexes, Rules/IAM/TTL et rapprocher Auth, Storage, Stripe, stock,
   inbox/outbox et suppressions legales;
7. documenter temps, comptages, RPO/RTO et validation apres restauration.

### P0.2 - Worker actif mais preuve metier incomplete

`commerceReservationExpiryDispatcher` a ete redeployee: elle est `ACTIVE`, son
scheduler tourne toutes les deux minutes et les executions recentes sont `ok`.
Cette partie de l'incident initial est fermee.

Les runs observes sont toutefois no-op et ne prouvent pas l'expiration metier.
Le handler journalise `failures/exhausted` puis peut retourner succes; avec un
maximum de 100 candidats, un timeout de cinq minutes et un chevauchement Gen1
possible, la plateforme peut paraitre verte alors que le travail aval est
incomplet.

Action avant paiements reels:

1. signaler `completed/incomplete`, backlog age, failures et exhausted;
2. definir retry ou file durable et owner/overlap;
3. alerter sur le resultat Function, pas seulement le publish Scheduler;
4. exercer une expiration Stripe test bornee, la course paiement/expiration et
   la liberation idempotente du stock;
5. verifier zero double mouvement/liberation et l'ouverture/resolution de
   l'alerte.

### P0.3 - Incident de remboursement ouvert invisible dans le verdict de sante

Un incident `terminal_refund_conflict` reste ouvert. La commande associee est
placee en `needs_review`, tandis que le paiement durable reste `succeeded`.

Le comportement metier est prudent: le systeme conserve l'argent et le stock
en etat connu au lieu d'improviser une liberation ou un nouveau remboursement.

Le defaut est dans l'observabilite. `sys_commerce_operations/current` affiche
`healthy` avec des compteurs a zero parce que le calcul de sante ne compte que
certaines familles d'incidents ouverts. Un conflit terminal peut donc rester
ouvert sans basculer la sante globale.

Action:

1. conserver l'incident ouvert jusqu'au deploiement du calcul corrige afin de
   prouver `healthy -> stop`; ne jamais rejouer le refund;
2. faire remonter tout incident financier primaire ouvert et les codes inconnus
   avec une severite fail-closed;
3. exclure les incidents derives du total primaire, exposer fraicheur et
   troncature, et faire passer stale/unknown hors de `healthy`;
4. afficher sante et incidents dans l'admin;
5. rapprocher Stripe en lecture seule, puis resoudre avec evidence, version
   attendue, code/note/auteur audites;
6. tester plus de 100 incidents, boucle derivee, resolution et retour justifie
   a `healthy`.

### P0.4 - Absence d'alertes operationnelles

Aucune politique d'alerte Monitoring, metrique de logs personnalisee ou
dashboard personnalise n'a ete retrouve. Les canaux n'ont pas pu etre verifies
avec le CLI installe. Le statut des budgets Billing est `NON_VERIFIE`, pas
« absent »; budget, Monitoring et alertes quota sont trois controles distincts.

Les journaux permettent de retracer les erreurs, mais il faut actuellement
qu'un operateur pense a les consulter. Les problemes sont donc retrouvables
apres signalement, sans etre necessairement detectes automatiquement.

Alertes minimales recommandees:

- Function `FAILED/OFFLINE`;
- scheduler sans execution recente;
- incident commerce ouvert;
- inbox ou outbox en retard;
- reservation expiree;
- dead-letter ou livraison e-mail inconnue;
- erreur de signature ou traitement webhook Stripe;
- taux HTTP 5xx App Hosting;
- revalidations catalogue en echec repete;
- consommation et quotas Firestore/Functions;
- budget cloud depasse ou derive inhabituelle.

## 10. Dettes de maintenance non bloquantes pour la presentation

### 10.1 Inventaire Functions et codebase

Les 152 Functions sont regroupees dans le codebase `main`. Les deploiements
peuvent etre cibles Function par Function, mais le domaine reste large.

A moyen terme, une separation par codebase pourrait etre envisagee:

```text
main-auth
main-commerce
main-catalog
main-admin-content
main-analytics
```

Cette separation ne doit pas etre faite sans analyser les triggers, secrets,
regions, comptes de service, deploiements cibles et rollbacks. Elle n'est pas
necessaire avant la presentation.

### 10.2 Collections analytics historiques

Plusieurs anciennes collections analytics existent encore, notamment des
rollups et marqueurs v3. Le code canonique indique qu'elles ne sont plus
alimentees ni lues.

Elles ne perturbent pas la base active, mais compliquent la console et la
comprehension d'un nouvel operateur. Aucune suppression ne doit etre effectuee
sans:

- recherche des producteurs et lecteurs;
- comptage et dates de derniere ecriture;
- verification Git;
- export ou sauvegarde;
- dry-run;
- decision de retention.

### 10.3 Commandes legacy

26 commandes sans `schemaVersion: 2` coexistent avec les commandes courantes.
Le code possede des adaptateurs et des barrieres pour eviter qu'un writer v2 ne
les transforme implicitement.

Cette coexistence est acceptable a court terme. Avant production, il faut
decider si elles sont:

- conservees en lecture seule;
- archivees dans leur forme actuelle;
- classifiees et adoptees par une migration prouvee;
- exclues explicitement des projections modernes.

### 10.4 Normalisation des meubles

Les 10 meubles publies sans `inventoryVersion` doivent faire l'objet d'un
backfill dry-run puis d'une ecriture controlee si la decision est confirmee.
Le checkout est compatible aujourd'hui, mais une valeur explicite simplifiera
les audits de stock et les diagnostics futurs.

### 10.5 Regions

La topologie traverse plusieurs regions:

- Firestore `eur3`;
- App Hosting et bucket catalogue `europe-west4`;
- Functions principales `europe-west1`;
- medias et quelques Functions historiques `us-central1`.

Cette topologie est fonctionnelle et en partie imposee par l'emplacement du
bucket media historique. Elle ajoute toutefois latence, egress potentiel et
surface d'incident. La convergence regionale reste une migration dediee, pas
un correctif opportuniste.

### 10.6 Environnement operateur

Pendant l'audit, `firebase use` pointait bien sur `secondevienextjsssr`, alors
que le projet `gcloud` global actif etait un autre projet. Toutes les commandes
d'audit ont donc utilise `--project=secondevienextjsssr` explicitement.

Ce decalage est un risque d'exploitation. Les scripts sensibles doivent
continuer a verifier le projet exact et refuser toute cible non autorisee.

Le shell Node utilise par les tests etait en Node 22, mais l'executable `pnpm`
global affiche une version 11.19.0 au lieu de la baseline 11.7.0 et a emis un
avertissement Node 24 lors d'un `pnpm exec`. Les scripts `npm run` executes pour
l'audit ont bien utilise Node 22. L'alignement Corepack/pnpm reste conseille
pour rendre les deploiements reproductibles.

## 11. Scalabilite

### 11.1 Ce qui absorbe deja bien le trafic

- le catalogue public est servi depuis Storage et non depuis Firestore;
- les releases sont immuables et cacheables;
- les API bornent les limites et les curseurs;
- les listes de commandes v2 sont paginees a 50 maximum;
- les workers utilisent des pages et un nombre maximal de pages;
- les ecritures critiques passent par transactions;
- Stripe, inbox et outbox sont idempotents;
- les documents de commande conservent les snapshots historiques;
- les projections financieres peuvent etre reconstruites.

### 11.2 Limites avant un trafic beaucoup plus important

- l'analytics admin charge au maximum 5 000 sessions sur une annee;
- les tendances du dashboard lisent au maximum 500 sessions sur 30 jours;
- les clics affilies sont bornes a 3 000;
- la facturation manuelle charge au maximum 300 produits;
- le fallback legacy du dashboard ne couvre que les 300 commandes recentes;
- le builder catalogue relit la collection complete;
- App Hosting est borne a 10 instances;
- la plupart des callables Gen1 gerent une requete par instance;
- aucune preuve de test de charge n'a ete produite pendant cet audit.

Ces limites sont compatibles avec une boutique artisanale de meubles. Elles
doivent devenir des seuils surveilles. Lorsque les seuils sont approches, il
faudra introduire des rollups serveur, de la pagination supplementaire, des
projections incrementales et une capacite App Hosting mesuree.

## 12. Capacite a retrouver et corriger les bugs

Le systeme possede de bons identifiants de correlation:

- `orderId`;
- `commandId`;
- `clientOrderId`;
- `paymentIntentId` et identifiants Stripe;
- `refundRequestId`;
- `inboxId` et `outboxId`;
- `inventoryKey` et `effectId`;
- revision catalogue, manifeste et hash agrege;
- `deploymentId` App Hosting.

Ces identifiants permettent de suivre un incident depuis l'action client vers
la commande, le paiement, le mouvement de stock, le webhook et l'e-mail.

Le projet a aussi de bons journaux durables:

- evenements de commande;
- mouvements inventaire;
- faits financiers;
- audits produit;
- incidents commerce;
- inbox/outbox;
- builds et evenements catalogue;
- audits Auth/admin/Stripe/Meta/devis.

La faiblesse actuelle est la couche qui transforme ces preuves en alertes et en
vue operateur fiable. Le systeme permet souvent de comprendre un bug apres
qu'il est remarque. Il doit encore detecter et signaler automatiquement les
anomalies avant que la cliente ou un acheteur ne les decouvre.

## 13. Plan historique avant contre-audit

Cette section conserve l'ordre formule le 2026-08-13. Elle est remplacee pour
l'execution par G0-G13 de l'audit Gen2: garde projet/deploiement, alertes, DR,
sante/incident, preuve des workers, puis vagues de migration. Ne pas l'utiliser
seule comme runbook.

### Gate A - Commerce sandbox sain

- confirmer `commerceReservationExpiryDispatcher` `ACTIVE` et son scheduler;
- verifier une expiration reelle Stripe test, completion et alerte;
- qualifier l'incident `terminal_refund_conflict`;
- corriger le calcul de sante;
- obtenir zero hold expire, zero inbox/outbox en retard et zero incident ouvert
  non arbitre.

### Gate B - Recuperation de donnees

- activer PITR;
- activer la protection de suppression;
- creer les sauvegardes planifiees;
- restaurer dans une base nommee du meme projet et de la meme localisation;
- verifier comptes, meubles, commandes, sous-collections et projections;
- documenter RPO, RTO et responsable d'intervention.

### Gate C - Observabilite

- creer les alertes critiques;
- verifier leur declenchement dans le sandbox;
- definir le canal de notification;
- documenter les seuils et le runbook;
- tester la fermeture d'une alerte apres resolution.

### Gate D - Hygiene des donnees et deploiements

- rapprocher les 152 Functions cloud des 157 exports locaux;
- mettre a jour la documentation;
- classifier les collections analytics historiques;
- normaliser `inventoryVersion`;
- fixer la politique des commandes legacy;
- conserver toute suppression en dry-run avec sauvegarde.

### Gate E - Charge et production

- creer le rail Firebase/App Hosting production separe;
- configurer domaine, Auth, Stripe live, Resend, App Check, budgets et quotas;
- executer un test de charge representatif;
- verifier les latences checkout et fonctions sous pic;
- executer la recette live bornee et le rollback.

## 14. Validations executees pendant l'audit

Validations read-only cloud:

- description de la base Firestore;
- inventaire des sauvegardes et calendriers;
- inventaire des TTL et index;
- inventaire des Functions, regions, generations et etats;
- lecture agregee des volumes sans restitution de PII;
- lecture des etats operationnels catalogue et commerce;
- analyse des erreurs Cloud Logging agregees;
- probes HTTP ponctuelles de la home et de la version catalogue.

Validations locales:

| Suite | Resultat |
| --- | ---: |
| tests unitaires commerce | 127/127 |
| tests catalogue core | 14/14 |
| tests retention | 5/5 |
| total | 146/146 |

Validations non lancees:

- build Next complet;
- lint complet;
- emulateurs Rules Firestore/Storage;
- E2E navigateur;
- paiement ou remboursement Stripe;
- test de charge;
- exercice de restauration;
- ecriture, migration ou cleanup cloud;
- deploiement.

## 15. Conclusion

Le choix Firestore/App Hosting est coherent pour Seconde Vie. Le modele NoSQL
ne rend pas la base intrinsequement plus difficile a maintenir qu'une base SQL,
car le projet a explicite ses sources autoritaires, ses projections, ses
snapshots historiques, ses commandes idempotentes et ses journaux.

Pour le volume et le domaine actuels, la scalabilite est suffisante. Le
catalogue materialise protege particulierement bien Firestore contre le trafic
public.

La priorite n'est ni une reecriture SQL, ni une migration generale immediate
des 139 Functions Gen1. La priorite est de fermer les quatre manques
operationnels:

1. alertes et runbooks testes;
2. sauvegarde, restauration et DR cross-service;
3. visibilite/resolution correcte des incidents financiers;
4. preuve metier et contrat d'echec des workers.

Une fois ces gates fermees, puis la migration progressive mesuree et le rail
production separe cree, l'architecture peut supporter proprement le lancement
d'une boutique specialisee comme Seconde Vie, avec une maintenance et un
diagnostic gerables. La source executable reste le plan G0-G13 de l'audit Gen2.
