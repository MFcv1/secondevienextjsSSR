# ADR - Architecture Firebase Functions apres migration Gen2

Derniere mise a jour: 2026-09-02
Statut: `ACCEPTE - TOPOLOGIE_COMPLETE - FINALISATION_POST_AUDIT_EN_COURS`

## Decision

Le sandbox conserve un seul codebase Firebase Functions `main`. Une scission
par domaine ajouterait maintenant des deploiements, IAM et archives sans gain
mesure. Elle ne sera reouverte que si la duree de build, les droits partages ou
la cadence de livraison d'un domaine deviennent un probleme concret.

L'etat autoritaire est:

- 161 exports locaux;
- 158 Functions cloud;
- 155 Gen2 `ACTIVE`;
- exactement trois Gen1 Auth conservees:
  `grantAdminOnAuth`, `onRegisteredUserCreated` et
  `onRegisteredUserDeleted`;
- cinq exports Instagram legacy restent uniquement locaux; deux webhooks v2
  restent uniquement cloud avec leur source et leur entree de deploiement
  dediees. L'ecart net local/cloud est donc `155 communs + 5 / + 2`; aucun
  deploiement global n'est permis;
- Les revisions App Hosting/Functions servies et leurs rollbacks sont consignes
  dans EXPLOITATION.md et doivent etre recontroles avant livraison. Le suivi des
  sessions reutilise le trigger Analytics existant, sans nouvelle Function.

Les deploiements Functions restent individuels, allowlistes et lies a une
archive immuable. Production, Stripe live et un selecteur global `functions`
restent interdits sans decision distincte.

## Observation et capacite

La fenetre historique G13 couvre sept jours de metriques et confirme, a sa fin,
les 134 Gen2 de la migration historique. La topologie courante ajoute douze
Functions d'observabilite, dix alertes Monitoring actives et un dashboard. G12-A
s'est toutefois terminee environ douze minutes avant la fin de cette fenetre et
le tuning est posterieur: cette preuve n'est pas un soak de sept jours de la
topologie finale. Un soak final reste requis par le plan temporaire
`apphostingaudit/FINALISATION_MIGRATION_GEN2.md`. Aucun depassement de quota
n'est remonte.
L'API Cloud Billing Budget est desactivee: le projet est facture, mais aucun
budget n'a pu etre prouve et aucun cout exact n'est affirme sans export
Billing. Artifact Registry occupe environ 12,36 Go sur trois repositories;
les policies de nettoyage gerees restent la protection retenue.

Le burst lecture admin a sature `getCatalogPublicationStatusGen2` avec son
plafond d'une instance. Un unique tuning porte son `maxInstances` de 1 a 2 en
revision `getcatalogpublicationstatusgen2-00002-yoq`. La contre-mesure passe
25 requetes sur 30; les cinq refus restants sont quatre 429 et un abandon
Cloud Run sans instance disponible, sans erreur applicative. Ce plafond est
accepte comme garde-fou de cout pour une surface reservee a un administrateur;
aucun second tuning ni build App Hosting n'est justifie.

L'objet de rollback du tuning, sa generation et son SHA-256 sont consignes dans
`apphostingaudit/manifests/functions-gen2-g13-tuning-rollback.json`. F4 a
preserve les octets max 1 dans un chemin immuable sous hold. F5 a exerce le
rollback en revision `getcatalogpublicationstatusgen2-00003-mol`, puis la
reactivation max 2 en revision finale `getcatalogpublicationstatusgen2-00004-hiv`;
les deux revisions etaient `ACTIVE` et servaient 100 % du trafic. Le wrapper
refuse une revision, generation, taille, hold ou digest different et extrait
les octets verifies dans un repertoire prive temporaire pour ne pas confondre
archive durable et staging Cloud Functions. La premiere fenetre F6 a ete
remplacee apres quatre remediations commerce sandbox ciblees et qualifiees. La
suivante a ete remplacee par le deploiement cible A-028 de
`dispatchCatalogRevalidation`, revision
`dispatchcatalogrevalidation-00013-cop`, puis sa requalification active. La
troisieme a ete remplacee apres la correction cible A-029 de
`prepareCommerceDocumentDeliveryGen2`, finalement qualifiee en revision
`preparecommercedocumentdeliverygen2-00003-qag`. La fenetre suivante a ete
remplacee apres A-031/A-032 par les revisions outbox `00003-qug` puis
`00004-saf`, cette derniere fixant explicitement le `SITE_URL` sandbox. La
fenetre courante de 604800 s court depuis `2026-08-23T21:13:00.000Z`; ce suivi
operationnel long ne bloque pas la
qualification fonctionnelle active et ne doit pas etre presente comme termine
avant son echeance reelle.

## Horizon Node.js

Node 22 reste la baseline executable. Firebase documente actuellement Node 20
et 22 comme runtimes supportes, tandis que Node.js planifie la fin de vie de
Node 22 au 30 avril 2027. Node 24 est le successeur candidat, sans devenir la
baseline tant que Firebase Functions ne le supporte pas officiellement et
qu'une migration dediee n'a pas qualifie Functions, CI et App Hosting.

Calendrier obligatoire:

1. verifier le support Firebase de Node 24 au plus tard le 30 novembre 2026;
2. ouvrir une migration runtime dediee des que le support officiel existe;
3. qualifier local, sandbox, rollbacks et dependances avant le 31 mars 2027;
4. retirer Node 22 au plus tard le 30 avril 2027, ou ouvrir une escalation
   bloquante si Firebase ne propose encore aucun successeur supporte;
5. le 31 octobre 2027 reste seulement la date maximale de nettoyage des
   references et archives, jamais une autorisation d'executer un runtime EOL.

References officielles:

- https://firebase.google.com/docs/functions/manage-functions
- https://nodejs.org/en/about/previous-releases

## Stripe et production

Le contrat local rend l'attente `livemode` dependante de l'environnement:
`false` pour le sandbox et `true` pour une future production. Ce test ne cree
aucun rail live, n'utilise aucun secret live et n'autorise aucune production.

## Preuves


### Mesure des fonctions interactives

Le diagnostic `scripts/audit-interactive-runtime.mjs` se lance avec
`npm run audit:interactive-runtime -- --input <export-expurge.json>` ou avec
`--cloud --from <UTC> --to <UTC> --services <noms-Cloud-Run>` explicitement.
Le chemin cloud est limite au sandbox, a dix services, 24 h et 5000 lignes;
il ne fait que `functions list` et `logging read`. Il signale la troncature,
les observations insuffisantes pour p95 et les configurations absentes.
La configuration lue est courante, pas une preuve de configuration historique.

OPTIONS, POST et GET sont separes: un POST de 417 ms ne doit pas masquer un
OPTIONS de 5788 ms avec demarrage d'instance (fenetre du 2026-09-03
21:11-21:14 UTC). Deux POST ne ferment pas une gate p95. Le rapport ne chiffre
pas Billing et ne somme pas des requetes paralleles en latence utilisateur.
CPU/concurrence/min/max restent inchanges. Les modifications par cohortes
suivent le [plan temporaire demande](../infra/TEMPS_REEL_COUTS_DEVOPS.md),
pas une augmentation uniforme de toutes les Functions.

### Archives de qualification Gen2

- `apphostingaudit/manifests/functions-gen2-g12a-remaining.json`;
- `apphostingaudit/manifests/functions-gen2-g12b-remaining.json`;
- `apphostingaudit/manifests/functions-gen2-g13-observation.json`;
- `apphostingaudit/manifests/functions-gen2-g13-load.json`;
- `apphostingaudit/manifests/functions-gen2-g13-tuning-rollback.json`.
