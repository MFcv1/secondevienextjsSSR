# Back-office

Derniere mise a jour: 2026-07-26
Statut: `PREPROD_READY`

Restriction active:

> Ce statut ne couvre pas encore le control plane commerce. Les onglets Ventes, Retours, Livraison, Paiement et les outils destructifs suivent le plan [NOYAU_COMMERCE_STABILISATION.md](../commerce/NOYAU_COMMERCE_STABILISATION.md): gates 0A a 7B avant la recette humaine Gate 8.

## 1. Architecture

`/admin` est une route dynamique, `noindex`, montee par `AdminAppIsland`. Les grandes vues sont chargees avec `React.lazy` pour ne pas placer tout le back-office dans le bundle initial. La route ne lit jamais le catalogue public avant l'authentification. Une fois l'acces admin fort etabli, Stats charge le catalogue public court en parallele de ses agregats afin de resoudre les miniatures des meubles en tendance; ce chargement visuel ne bloque pas les statistiques.

L'interface commune de connexion est conservee. L'acces admin repose sur Firebase Auth, claims, registre `sys_admin_access` et assurance forte recente pour les operations sensibles.

## 2. Onglets

La liste executable est `KIT_CONFIG.adminTabs` dans `src/kit/config/constants.js`.

La navigation visible utilise un panneau lateral persistant sur desktop et un tiroir sur les ecrans plus etroits. Les IDs restent inchanges et sont regroupes en cinq ensembles metier afin de reduire la charge cognitive:

- `Vue d'ensemble`: Stats, Data;
- `Catalogue`: Publication, Vue Globale, Studio;
- `Ventes`: Ventes, Retours, Livraison, Paiement;
- `Communication`: Personnalisation, Infos, SEO;
- `Administration`: Mon compte, Clients, Securite, Maintenance.

Le regroupement est porte par `ADMIN_NAV_GROUPS` dans `AdminAppIsland`; `AdminSidebar` ne modifie ni le routing interne ni le lazy loading des vues.

| ID | Label | Module principal | Role |
| --- | --- | --- | --- |
| `dashboard` | Stats | `AdminDashboard` | indicateurs commerce legacy non financiers avant Gate 7A, commandes, inventaire, devis, tendances, exports |
| `analytics` | Data | `AdminAnalytics` | visiteurs UID/IP, sessions live, parcours, courbe |
| `furniture` | Publication | `AdminForm`, `AdminItemList` | CRUD annonces et images |
| `inventory` | Vue Globale | `GlobalInventoryView` | ordres editoriaux et stock catalogue |
| `studio` | Studio | `AdminStudio` | outils de contenu/creation |
| `homepage` | Personnalisation | `AdminHomepage` | hero, categories, contenus vitrine |
| `orders` | Ventes | `AdminOrders` | commandes et logistique |
| `returns` | Retours | `AdminReturns` | remboursements Stripe |
| `livraison` | Livraison | `AdminLivraison` | tarifs et configuration livraison |
| `users` | Clients | `AdminUsers` | comptes et acces admin |
| `ip_manager` | Securite | `AdminIPManager` | suivi/configuration IP complementaire |
| `seo` | SEO | `AdminSEO` | controle contenu/indexation |
| `newsletter` | Infos | `AdminNewsletter` | abonnes/informations |
| `payment_settings` | Paiement | `AdminPaymentSettings` | Stripe Connect et activation carte |
| `account` | Mon compte | `AdminAccount`, `BillingOnboardingOperator` | identite admin et pilotage de l'onboarding facturation |
| `maintenance` | Maintenance | `AdminMaintenance` | outils destructifs controles |

Les labels peuvent evoluer; les ID sont des contrats de navigation et ne doivent pas etre renommes sans migration.

Sur desktop (`>= 1024 px`), `AdminAppIsland` affiche une navigation laterale fixe en cinq groupes. Elle reference les 16 memes IDs que `KIT_CONFIG.adminTabs`, sans precharger leurs vues. Sous ce seuil, `AdminSidebar` devient un tiroir lateral; les IDs et le lazy loading restent identiques.

Le catalogue public court (`scope=cards&limit=120`) est charge paresseusement uniquement par Stats, Data et Vue Globale, qui consomment ses miniatures ou ses donnees. Seule une requete en vol est dedupliquee; aucun catalogue n'est conserve dans `sessionStorage` ou dans un cache module persistant.

## 3. Publication catalogue

`AdminForm` gere les champs produit, la compression/upload image, les variantes et la sauvegarde. `AdminItemList` affiche les annonces. `GlobalInventoryView` pilote les classements editoriaux.

Apres mutation:

- l'ecriture doit respecter `firestore.rules`;
- `onCatalogSourceWrite` enregistre la revision et construit le snapshot;
- la task HMAC rafraichit les routes ISR;
- les erreurs partielles doivent rester visibles et reprenables.

## 4. Personnalisation

`AdminHomepage` ecrit des documents `sys_metadata` pour hero, images, textes et sections. Chaque nouveau bloc personnalisable doit avoir:

- un schema borne;
- un fallback serveur stable;
- une validation d'URL/image;
- un rendu public sans dependance a l'admin;
- une strategie de revalidation.

## 5. Ventes, retours et paiements

- `AdminOrders`: consultation, statut logistique et actions admissibles;
- `AdminReturns`: remboursement, synchronisation et e-mail client;
- `AdminPaymentSettings`: Connect, carte/wallets et etat de disponibilite;
- `AdminLivraison`: configuration des frais.

Etat actuel:

- les onglets Publication, Inventaire, Ventes, Retours, Livraison, Paiement et
  Maintenance sont enveloppes par une surface read-only explicite;
- les composants legacy restent montes pour consultation mais leurs controles
  sont `inert` et sans interaction;
- les Rules refusent les writes SDK `orders`, create/delete produit, champs
  commerce produit et politiques, y compris avec claims admin forts;
- le dashboard masque les KPI financiers legacy et retire les raccourcis de
  purge;
- cet etat est `CODE_READY_LOCAL`, non deploye sur le sandbox.

Cible: toute transition commande, fulfillment, inventaire, refund/retour et politique commerce passe par une commande serveur idempotente. Firestore reste une projection et non une API metier admin.

De Gate 0B jusqu'a l'activation fixture, Publication, Ventes, Retours,
Livraison et Paiement restent read-only pour prix, stock, vente, commande,
policy et medias destructifs. Les actions reviennent uniquement via les
commandes serveur et `allowedActions`.

## 6. Utilisateurs et securite

`AdminUsers` appelle les Functions de gestion d'acces. Les promotions/retraits doivent etre traces et exiger le niveau d'assurance defini dans le chapitre Auth.

La gestion IP est un signal complementaire; elle ne remplace pas Auth, AAL2, rules ou registre admin sauf si un controle serveur explicite l'impose.

### 6.1 Guide manuel de facturation Google

Le guide `BillingOnboardingGuide` est un parcours pedagogique, pas une integration Cloud Billing. Il ne cree pas de compte, ne rattache aucun projet et ne configure aucun budget. Toutes les actions financieres restent effectuees par la cliente dans la console officielle Google; le site ne recoit jamais sa carte, ses coordonnees bancaires ou un jeton Google.

Le parcours remplace temporairement les onglets pour l'unique UID cible et comprend:

1. une explication courte du partage des responsabilites;
2. un lien officiel vers la creation du compte Google Billing;
3. la saisie de l'identifiant Billing au format `AAAAAA-BBBBBB-CCCCCC`;
4. l'ajout de l'adresse technique avec `Billing Account User` et `Billing Account Costs Manager`;
5. un ecran d'attente pendant la mise en place manuelle par le super-admin.

Les emplacements de captures sont volontairement des placeholders tant que le parcours reel avec le compte test n'a pas ete photographie. Les captures devront etre recadrees pour masquer adresse personnelle, carte, raison sociale sensible, identifiant Payments et toute donnee inutile avant integration.

Le compte super-admin conserve un bypass permanent. L'onglet dedie `Mon compte` charge paresseusement `BillingOnboardingOperator`: en mode actif, ce panneau montre uniquement le compte cible, son etat, son e-mail admin et son identifiant Billing. Aucun statut d'onboarding n'est affiche dans Stats. La validation exige la phrase `VALIDER LA FACTURATION`; la reinitialisation exige `REINITIALISER LE TEST` et n'existe qu'en mode `test`. Ces actions passent par Functions, exigent une authentification super-admin forte recente et sont auditees sans donnee bancaire.

Quand les callables ne sont pas encore deployees ou accessibles depuis le runtime local, `Mon compte` affiche un etat neutre `Non raccorde`; il ne doit jamais exposer au super-admin le message brut Firebase `internal`. Cette indisponibilite n'active aucun parcours et ne bloque pas Stats.

Modes serveur:

| Mode | Effet |
| --- | --- |
| `disabled` | guide inactif pour tous; valeur par defaut et rollback immediat |
| `test` | guide visible uniquement pour `BILLING_GUIDE_TEST_UID` |
| `live` | guide visible uniquement pour `BILLING_GUIDE_LIVE_UID` |
| `completed` | guide globalement clos; les onglets normaux sont affiches |

Une completion individuelle ouvre aussi le back-office normal pour l'UID concerne. La progression reside dans `sys_billing_onboarding/{uid}`, inaccessible aux SDK clients et ecrite uniquement par les callables:

- `getBillingGuideStatus`;
- `saveBillingGuideProgress`;
- `getBillingGuideOperatorStatus`;
- `completeBillingGuideAdmin`;
- `resetBillingGuideTest`.

Les deux roles Google indiques ne sont pas presentes comme temporaires dans le guide. Ils servent durablement a rattacher les projets autorises et a suivre/configurer leurs couts, sans donner acces au moyen de paiement. Une revocation future reste une decision explicite de la cliente ou un changement de responsabilite, pas une etape d'onboarding.

Recette manuelle fermee, seulement apres validation d'un deploiement sandbox:

1. creer l'identite Google de test et l'ajouter comme admin non proprietaire via `AdminUsers`;
2. relever son UID Firebase puis configurer `BILLING_GUIDE_TEST_UID`, `BILLING_GUIDE_TECHNICAL_EMAIL` et enfin `BILLING_GUIDE_MODE=test`;
3. parcourir les cinq ecrans avec ce compte, fermer/reouvrir `/admin` entre deux etapes et realiser les captures;
4. revenir avec le super-admin, copier l'identifiant Billing, effectuer ou simuler la mise en place technique convenue, puis valider;
5. verifier que le compte test retrouve les onglets admin;
6. utiliser `Recommencer` si une seconde passe de captures est necessaire;
7. a la fin, remettre d'abord `BILLING_GUIDE_MODE=disabled`, retirer l'acces admin du compte test et conserver le code dormant.

Cette recette n'autorise aucun rattachement du vrai sandbox ou d'une future production sans action cloud separee et explicitement approuvee.

## 7. Analytics et statistiques

Le dashboard lit de preference les agregats:

- `dashboard_stats/commerce`;
- `inventory_stats/overview`;
- `sales_stats_daily`;
- commandes recentes bornees.

Restriction commerce: le rollup actuel ne mesure pas un chiffre d'affaires encaisse. Il inclut notamment plusieurs commandes pending, echouees ou remboursees et n'est pas idempotent face a une rediffusion de trigger. Ne pas utiliser ce KPI comme preuve financiere avant sa reconstruction depuis les etats de paiement.

Un fallback historique borne existe encore pour les commandes si leurs agregats manquent. Stats ne scanne plus `furniture` lorsque `inventory_stats/overview` est absent: la valeur catalogue affiche alors un tiret jusqu'a la prochaine publication snapshot, dont le builder regenere l'agregat. Ce garde-fou evite jusqu'a 300 lectures produit a chaque ouverture de Stats sans afficher un faux zero comme une valeur autoritaire.

Les modules `Intentions de devis` et `Meubles en tendance` lisent separement au maximum 500 documents `analytics_sessions` commences dans les 30 derniers jours, sans listener temps reel. Les sessions admin sont exclues cote client. Les tendances comptent les etapes `detail`, dedupliquent les visiteurs par UID puis IP puis session et reprennent le nom/prix deja embarque dans `journey.itemId`. Le tunnel devis compte les sessions ayant visite `quote`, emis `quote_start` ou emis `quote_email_opened`. Les images du classement sont resolues par identifiant ou slug depuis le snapshot catalogue public court deja utilise par l'admin; elles n'ajoutent aucune lecture Firestore produit et restent purement representatives.

Cette lecture analytics est non bloquante: son echec laisse les agregats commerce, l'inventaire et les commandes recentes disponibles. Une couverture de 500 documents est signalee comme plafonnee. `quote_email_opened` reste libelle comme ouverture d'un brouillon e-mail; Stats ne presente jamais ce signal comme un devis recu, envoye ou accepte.

`AdminAnalytics` reprend le moteur de Tous a Table: lecture bornee a 5 000 sessions sur un an, cache IndexedDB de six heures, actualisation manuelle de l'historique, ecoute Firestore des 100 sessions les plus recentes, visiteurs uniques dedupliques par UID Firebase puis IP serveur, ratio UID/IP, regroupement par jour et visiteur, sessions live et parcours. Une session est consideree en ligne lorsque sa derniere activite remonte a moins de 30 secondes. Le bandeau live apparait sans actualisation manuelle et cumule les sessions actives avec leur ville et leur appareil.

Le parcours reste vertical sous 1024 px et devient une frise en grille sur desktop: les etapes occupent une ligne tant que la largeur le permet, puis reprennent naturellement a la ligne suivante, sans barre de defilement horizontale. Chaque etape desktop reserve un media 66x84 px: les etapes `detail` affichent la premiere variante `thumb320` du produit lorsqu'elle existe; les sous-categories `buffets`, `armoires`, `miroirs` et `commodes` reprennent les memes images `*-config-rail.webp` que les quatre cartes sous le hero de la galerie; les categories parentes `meubles`, `assises`, `eclairage` et `decorations` utilisent les illustrations WebP dediees de `public/images/analytics`; Galerie, A propos et Devis utilisent des visuels editoriaux differencies. Les images sont resolues depuis les assets ou le catalogue deja charges et n'alourdissent pas les documents analytics.

Lorsqu'une etape porte un identifiant, le parcours affiche le prefixe compact `ID`: le bleu ardoise des fiches produit et le vert sauge des categories permettent de distinguer une reference produit d'un slug de categorie; les identifiants de contenu residuels restent neutres.

Les sessions admin sont exclues a trois niveaux: le collecteur ne demarre pas quand les claims admin sont actifs, `trackAdminIP` maintient le registre des IP admin, puis `updateUserSessions` supprime les sessions recentes de l'IP lors d'une connexion admin. L'e-mail proprietaire reste un secret serveur et n'est jamais embarque dans le bundle client.

## 8. Maintenance

Les operations de `AdminMaintenance` et `AdminDashboard` peuvent purger utilisateurs, produits, commandes ou statistiques. Elles exigent:

- assurance admin forte recente;
- confirmation explicite et scope lisible;
- Function serveur;
- limites et audit;
- absence de suppression silencieuse en cas d'echec partiel.

Ne pas ajouter de bouton de maintenance qui ecrit directement un grand ensemble Firestore depuis le navigateur.

Etat Gate 0B:

- `resetAllStats`, `runGarbageCollector`, `resetAllUsers`, `purgeAnonymousUsers`,
  `purgeAllProducts` et `resetAllOrders` appellent le hard-stop avant
  authentification, lecture ou mutation;
- leurs boutons rapides ne sont plus proposes par Stats et l'onglet Maintenance
  est read-only;
- leur ancien corps reste temporairement en source pour historique et future
  reconstruction, mais il est inaccessible tant que le hard-stop est en place.

Gate 7A exige seulement un cleanup fixture run-scoped, borne et audite. Les
purges globales restent desactivees; leur eventuelle reconstruction avec
comptage, sauvegarde, pagination, reprise et quarantaine attend un besoin
metier/pre-live distinct.

## 9. Performance du back-office

- garder les vues lourdes lazy;
- borner listeners, requetes et exports;
- paginer ou limiter les collections croissantes;
- eviter les calculs de stats complets dans le navigateur;
- ne pas bloquer le premier rendu du dashboard sur tous les onglets;
- reserver les graphiques et cartes live aux vues qui les utilisent.

## 10. Fichiers structurants

```text
app/admin/page.jsx
app/admin/AdminAppIsland.jsx
app/admin/AdminSidebar.jsx
src/kit/admin/*.jsx
src/kit/admin/AdminAccount.jsx
src/kit/admin/BillingOnboardingGuide.jsx
src/kit/admin/BillingOnboardingOperator.jsx
src/kit/admin/components/*
src/kit/admin/analyticsReliability.js
src/kit/admin/adminPublicCatalog.js
src/kit/config/constants.js
functions/src/auth/adminManagement.js
functions/src/onboarding/billingGuide.js
functions/src/onboarding/billingGuideContract.js
functions/src/maintenance/*
functions/src/analytics/*
firestore.rules
storage.rules
```

## 11. Dettes controlees

| Sujet | Statut | Condition de reprise |
| --- | --- | --- |
| pagination complete de certaines listes | `DEBT` | croissance reelle des volumes ou mesure de cout |
| politique de roles plus fine qu'admin/super-admin | `CONCEPTION` | plusieurs operateurs metier confirmes |
| suppression des outils E2E/etude embarquee | `DEBT` | decision produit apres stabilisation preprod |
| incidents/reconciliation sandbox | `STABILISATION_ACTIVE` | Gate 7A, seuil machine bloquant avant recette |
| alert policies, SLO, astreinte et runbooks live | `PRODUCTION_DEFERRED` | rail production et SLO approuves |

## 12. Validation

Pour une passe back-office complete:

1. connexion admin et step-up si requis;
2. chargement de chaque onglet touche sans erreur;
3. mutation sandbox cible et lecture publique correspondante;
4. verification rules/Function pour une action sensible;
5. absence de lecture non bornee;
6. smoke mobile uniquement si le back-office mobile est dans le scope;
7. build et tests du domaine touche.
