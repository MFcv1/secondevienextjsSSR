# Back-office

Derniere mise a jour: 2026-07-14
Statut: `PREPROD_READY`

## 1. Architecture

`/admin` est une route dynamique, `noindex`, montee par `AdminAppIsland`. Les grandes vues sont chargees avec `React.lazy` pour ne pas placer tout le back-office dans le bundle initial. La route ne lit plus le catalogue public avant l'authentification: le premier rendu de Stats reste independant des produits.

L'interface commune de connexion est conservee. L'acces admin repose sur Firebase Auth, claims, registre `sys_admin_access` et assurance forte recente pour les operations sensibles.

## 2. Onglets

La liste executable est `KIT_CONFIG.adminTabs` dans `src/kit/config/constants.js`.

| ID | Label | Module principal | Role |
| --- | --- | --- | --- |
| `dashboard` | Stats | `AdminDashboard` | CA, commandes, inventaire, exports |
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
| `maintenance` | Maintenance | `AdminMaintenance` | outils destructifs controles |

Les labels peuvent evoluer; les ID sont des contrats de navigation et ne doivent pas etre renommes sans migration.

Sur desktop (`>= 1024 px`), `AdminAppIsland` affiche une navigation laterale fixe groupee par usage: Pilotage, Catalogue, Experience boutique, Commerce, Relation client et Systeme. Elle reference les 15 memes IDs que `KIT_CONFIG.adminTabs`, sans precharger leurs vues. Sous ce seuil, la navigation horizontale compacte et son menu "Plus d'options" restent le parcours de reference.

Le catalogue public court (`scope=cards&limit=120`) est charge paresseusement uniquement par les vues qui le consomment reellement. Seule une requete en vol est dedupliquee; aucun catalogue n'est conserve dans `sessionStorage` ou dans un cache module persistant.

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

Une action UI ne doit jamais modifier directement un paiement Stripe comme si Firestore etait la source financiere. Les actions financieres passent par les Functions.

## 6. Utilisateurs et securite

`AdminUsers` appelle les Functions de gestion d'acces. Les promotions/retraits doivent etre traces et exiger le niveau d'assurance defini dans le chapitre Auth.

La gestion IP est un signal complementaire; elle ne remplace pas Auth, AAL2, rules ou registre admin sauf si un controle serveur explicite l'impose.

## 7. Analytics et statistiques

Le dashboard lit de preference les agregats:

- `dashboard_stats/commerce`;
- `inventory_stats/overview`;
- `sales_stats_daily`;
- commandes recentes bornees.

Un fallback historique borne existe encore pour les commandes si leurs agregats manquent. Stats ne scanne plus `furniture` lorsque `inventory_stats/overview` est absent: la valeur catalogue affiche alors un tiret jusqu'a la prochaine publication snapshot, dont le builder regenere l'agregat. Ce garde-fou evite jusqu'a 300 lectures produit a chaque ouverture de Stats sans afficher un faux zero comme une valeur autoritaire.

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
src/kit/admin/*.jsx
src/kit/admin/components/*
src/kit/admin/hooks/useLiveJourneyMap.js
src/kit/admin/analyticsReliability.js
src/kit/admin/adminPublicCatalog.js
src/kit/admin/adminPublicCatalog.js
src/kit/config/constants.js
functions/src/auth/adminManagement.js
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
| observabilite/alertes admin avancees | `PRODUCTION_DEFERRED` | rail production et SLO approuves |

## 12. Validation

Pour une passe back-office complete:

1. connexion admin et step-up si requis;
2. chargement de chaque onglet touche sans erreur;
3. mutation sandbox cible et lecture publique correspondante;
4. verification rules/Function pour une action sensible;
5. absence de lecture non bornee;
6. smoke mobile uniquement si le back-office mobile est dans le scope;
7. build et tests du domaine touche.
