# Back-office

Derniere mise a jour: 2026-07-15
Statut: `PREPROD_READY`

## 1. Architecture

`/admin` est une route dynamique, `noindex`, montee par `AdminAppIsland`. Les grandes vues sont chargees avec `React.lazy` pour ne pas placer tout le back-office dans le bundle initial.

L'interface commune de connexion est conservee. L'acces admin repose sur Firebase Auth, claims, registre `sys_admin_access` et assurance forte recente pour les operations sensibles.

## 2. Onglets

La liste executable est `KIT_CONFIG.adminTabs` dans `src/kit/config/constants.js`.

La navigation visible utilise un panneau lateral persistant sur desktop et un tiroir sur les ecrans plus etroits. Les IDs restent inchanges et sont regroupes en cinq ensembles metier afin de reduire la charge cognitive:

- `Vue d'ensemble`: Stats, Data;
- `Catalogue`: Publication, Vue Globale, Studio;
- `Ventes`: Ventes, Retours, Livraison, Paiement;
- `Communication`: Personnalisation, Infos, SEO;
- `Administration`: Clients, Securite, Maintenance, Etude Perf.

Le regroupement est porte par `ADMIN_NAV_GROUPS` dans `AdminAppIsland`; `AdminSidebar` ne modifie ni le routing interne ni le lazy loading des vues.

| ID | Label | Module principal | Role |
| --- | --- | --- | --- |
| `dashboard` | Stats | `AdminDashboard` | CA, commandes, inventaire, exports |
| `analytics` | Data | `AdminDataStudio` | compacts V3, atlas agrégé, sessions consenties |
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
| `performance_study` | Etude Perf | `PerformanceArchitectureStudy` | lecture technique embarquee |

Les labels peuvent evoluer; les ID sont des contrats de navigation et ne doivent pas etre renommes sans migration.

## 3. Publication catalogue

`AdminForm` gere les champs produit, la compression/upload image, les variantes et la sauvegarde. `AdminItemList` affiche les annonces. `GlobalInventoryView` pilote les classements editoriaux.

Apres mutation:

- l'ecriture doit respecter `firestore.rules`;
- `publicCatalogInvalidation` augmente la version publique;
- l'API de revalidation rafraichit les routes ISR;
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

Des fallbacks historiques bornes existent si les agrégats manquent. Ils ne doivent pas redevenir une lecture illimitee de toutes les commandes ou de tout le catalogue.

`AdminDataStudio` charge uniquement les compacts bornes de la periode active et conserve un cache de session. Il rend explicitement la connexion en cours, le moteur accessible sans compact, une periode sans activite, les donnees partielles/provisoires, App Check refuse, les droits insuffisants et l'indisponibilite du callable; aucune erreur ne declenche de jeu de demonstration. La surface « Activite en direct » est distincte: callable admin/App Check, au plus 12 sessions consenties recues depuis moins de 90 secondes, rafraichissement borne a 10 secondes seulement lorsque la vue est ouverte, routes/evenements sans identifiant visiteur. Elle est explicitement provisoire et ne nourrit pas les KPI, l'atlas ni les faits commerce. La surface compacte « Connexion et qualité de mesure » expose la disponibilite du callable, le schema V3, la couverture des compacts, la fraicheur, les periodes provisoires, les ruptures de sequence, l'observation App Check, la couverture des sessions consenties et la source serveur des paiements. Elle ne qualifie jamais un visiteur. La vue d'ensemble separe audience estimee, activite observee, intentions de devis et faits commerce serveur. `Parcours` utilise un atlas de transitions agregees; `Sessions` page les racines consenties par 25 et ne charge les chunks qu'au clic. Le site public fournit une preference de mesure explicite et retirable avant de creer une session detaillee. Les fixtures de demonstration restent isolees aux tests automatises ou a un mode explicitement active, jamais a un fallback d'erreur.

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
app/admin/AdminSidebar.jsx
src/kit/admin/*.jsx
src/kit/admin/components/*
src/kit/admin/hooks/useLiveJourneyMap.js
src/kit/admin/analyticsReliability.js
src/kit/admin/publicCatalogInvalidation.js
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
