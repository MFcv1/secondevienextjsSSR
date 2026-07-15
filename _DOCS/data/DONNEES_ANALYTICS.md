# Donnees, Firestore et analytics

Derniere mise a jour: 2026-07-15
Statut: `REFERENCE_ACTIVE`

## 1. Principes

- Firestore est la base applicative principale;
- Storage contient les medias, Firestore leurs references;
- Firebase Auth porte l'identite, pas le profil metier complet;
- Stripe est la source financiere externe;
- les snapshots de commande conservent l'historique d'achat;
- les migrations sont dry-run, comptees, sauvegardees et reversibles;
- les analytics doivent etre bornes, minimises et soumis a une politique de retention.

## 2. Arbre logique Firestore

```text
artifacts/{appId}/public/data/furniture/{productId}
artifacts/{appId}/public/meta
users/{uid}
  cart/{itemId}
  wishlist/{itemId}
  passkeys/{credentialId}
  passkey_challenges/{type}
orders/{orderId}
newsletter_subscribers/{id}
sys_metadata/{docId}
sys_ratelimit/{id}
sys_admin_access/{uid}
sys_idempotency/{id}
analytics_sessions/{sessionId}
  journey_steps/{id}
  custom_events/{id}
analytics_item_daily/{id}
analytics_page_daily/{id}
analytics_transition_daily/{id}
analytics_unique_markers/{id}
analytics_sessions_v3/{sessionId}
  chunks/{batchId}
analytics_session_facts_v3/{sessionId}
analytics_business_facts_v3/{factId}
analytics_rollup_days_v3/{dayKey}
  summary_shards/{shardId}
  compact/{overview|paths}
analytics_rollup_months_v3/{monthKey}
  compact/{overview|paths}
analytics_admin_audit_v3/{auditId}
analytics_privacy_requests_v3/{requestId}
dashboard_stats/{id}
sales_stats_daily/{id}
inventory_stats/{id}
```

Cette carte decrit les collections connues du code. `firestore.rules`, Functions et `map.md` restent les sources pour les permissions et producteurs.

## 3. Catalogue

La collection `furniture` contient annonces, stock, publication, SEO et references image. Le document `public/meta` porte notamment `catalogVersion` pour le cache et la revalidation.

Les mutations massives doivent conserver:

- identifiant document;
- timestamps utiles;
- images/variantes/metadata;
- statuts et stock;
- categorie et ordre editorial;
- champs SEO;
- compatibilite avec `publicCatalog`.

## 4. Utilisateurs

`users/{uid}` contient les donnees de profil autorisees. Les champs de role ou de securite ne peuvent pas etre modifies par le proprietaire. Le registre admin est separe dans `sys_admin_access`.

Les sous-collections panier et wishlist appartiennent a l'utilisateur. Les passkeys et challenges sont geres par les Functions Auth; le client ne doit pas ecrire une attestation WebAuthn arbitraire.

## 5. Commandes

`orders` est cree cote serveur. Une commande doit garder:

- identite technique utilisateur et e-mail verifie;
- snapshot articles/prix/quantites;
- adresse et livraison;
- total/devise;
- PaymentIntent et compte Stripe utiles;
- statut paiement/logistique;
- traces de reservation/restauration stock;
- refund, idempotence et e-mails.

La retention des commandes doit respecter les obligations comptables. Une demande de suppression utilisateur ne signifie pas la suppression brute d'une facture.

## 6. Metadata systeme

`sys_metadata` porte des configurations comme livraison, galerie, images home, paiement et theme. La liste publique autorisee est explicite dans `firestore.rules`; les autres documents exigent un admin fort ou le serveur.

`sys_ratelimit`, `sys_idempotency` et `sys_admin_access` sont backend-only. Ils ne doivent pas servir de stockage UI generaliste.

## 7. Analytics

Contrat d'architecture approuve: [ARCHITECTURE_ANALYTICS.md](ARCHITECTURE_ANALYTICS.md).

Etat reel au 15 juillet 2026:

- la V3 est codee mais non deployee: collecteur Next global, facade same-origin, lots IndexedDB idempotents, sessions par onglet, finalisation/reconciliation, HLL, compactions et lecteurs admin dedies;
- le mode `audience_minimized` est le defaut; les sessions detaillees exigent un consentement produit versionne;
- le retrait produit cree une demande pseudonymisee, supprime sessions/chunks/faits puis reconstruit les jours touches;
- les conversions durables viennent du trigger serveur `orders` et des etats Stripe durables;
- aucune IP, adresse e-mail ou valeur User-Agent brute n'est ecrite par V3; GeoIP reste indisponible tant que les gates region/proxy ne sont pas confirmees;
- V2 reste dans le code comme rollback historique mais n'est plus la source de la vue Data active;
- le manifeste sandbox porte `ANALYTICS_V3_ENABLED=true` pour le rollout explicitement demande; les secrets HMAC sont provisionnes, mais l'etat deploye doit encore etre confirme avant de produire du trafic; TTL, emulateurs et charge restent a executer.

Pipeline V2 present mais non operationnel de bout en bout:

```text
AnalyticsContext / AnalyticsProvider
  -> initLiveSession, syncSession, beacon
  -> analytics_sessions + sous-collections
  -> triggers de rollup
  -> *_daily, dashboard_stats, sales_stats_daily, inventory_stats
  -> AdminAnalytics / AdminDashboard / AdminSiteMap
```

La V3 separe audience minimisee et sessions detaillees consenties, collecte les routes Next par lots idempotents, finalise les sessions avec reconciliation et alimente les trois vues depuis des sources dediees. Son schema, ses budgets, sa retention et ses gates vivent uniquement dans `ARCHITECTURE_ANALYTICS.md`.

Principes de fiabilite:

- session et evenements ont des identifiants stables;
- les rollups sont idempotents;
- les listes admin sont bornees;
- les gros champs non recherches ont leurs indexes desactives;
- les checkpoints evitent une relecture complete automatique;
- les erreurs analytics ne bloquent jamais checkout, Auth ou navigation;
- ne pas stocker plus de donnees personnelles que necessaire.

### 7.1 Evenements devis

La vue `Data` distingue strictement la demande de devis du tunnel d'achat direct. Les evenements actuellement emis par le formulaire de restauration sont:

- `quote_request` : consultation de la page, portee par une etape de parcours;
- `quote_start` : premier changement explicite dans le formulaire;
- `quote_email_opened` : ouverture du brouillon e-mail pre-rempli apres validation locale.

`quote_email_opened` exprime une intention d'envoi, pas une demande effectivement recue ni un devis accepte: le formulaire actuel ouvre `mailto:`. Les etats metier `recu`, `qualifie`, `envoye` et `accepte` devront provenir d'un workflow de demande/CRM distinct avant d'etre affiches comme conversions commerciales.

## 8. Retention

Les constantes de retention vivent dans `functions/src/analytics/constants.js`. Les taches de cleanup suppriment les donnees expirees et les marqueurs techniques.

Ces constantes decrivent encore la V2. V3 ecrit actuellement des `expireAt` a 3 jours pour l'audience temporaire, 90 jours pour les sessions/faits consentis et environ 13 mois pour les rollups. Ces champs ne garantissent aucune suppression tant que les politiques TTL Firestore correspondantes ne sont pas configurees et verifiees; les chunks restent couverts par la suppression recursive planifiee.

Avant production, definir explicitement:

- duree sessions et evenements;
- anonymisation IP/geo;
- cookies/consentement;
- droit d'acces et suppression;
- retention commandes/factures;
- sauvegarde et restauration;
- responsable du traitement et sous-traitants.

## 9. Indexes

`firestore.indexes.json` declare les indexes catalogue et commandes, ainsi que les exemptions pour les champs analytics volumineux. Toute nouvelle requete composite doit:

1. etre bornee;
2. avoir un index justifie;
3. eviter d'indexer des tableaux/objets lourds inutiles;
4. etre testee sur sandbox;
5. documenter son cout potentiel.

## 10. Scripts de migration

Outils manuels sensibles:

```text
scripts/copy-firestore-project.mjs
scripts/replace-firestore-string.mjs
scripts/purge-expired-firestore.cjs
scripts/seed-catalogue.mjs
scripts/backfill-product-*.cjs
scripts/cleanup-product-image-variants.cjs
```

Procedure obligatoire:

1. identifier source et destination;
2. refuser production par defaut;
3. exporter/sauvegarder;
4. dry-run et comptages par collection;
5. echantillons avant/apres;
6. mode commit avec confirmation explicite;
7. verifier rules, indexes, catalogue, admin et checkout;
8. conserver le log de migration hors secrets;
9. preparer rollback ou import de restauration.

## 11. Production

Il n'existe pas encore de migration vers un rail production definitif. Lorsque ce rail sera cree, construire un plan date qui precise:

- freeze d'ecriture;
- export sandbox si des donnees doivent etre reprises;
- transformations de schema;
- import et comptages;
- validation images/Storage;
- creation des comptes/claims sans copier de secrets;
- smoke public/admin/checkout;
- cutover DNS;
- rollback.

Ce chapitre remplace les anciens plans de migration et constitue la seule reference active pour une future copie de donnees.
