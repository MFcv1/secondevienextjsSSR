# Livraison directe sandbox — 9 septembre 2026

Autorisation utilisateur : déployer l'intégration complète sur le sandbox,
serveur chaud et optimisations admin compris ; recettes métier après livraison.
Cette autorisation remplace le séquencement désactivé/qualification/activation
proposé dans le rapport local. Aucun commit/push, production, Stripe live ou
déploiement global Functions autorisé ou exécuté.

## Livraison effectuée

App Hosting : rollout `build-2026-09-09-006`, build cloud
`3e3ac5c0-31b9-48d0-8893-64de36225fbe` réussi, deploymentId
`sv-mtui8898-1d8ea8eb6496` (catalogue réel). Ajustement runtime des proxies sur
`secondevie-next-sandbox-public-shared-ip3`, même image, trafic 100 % et tag App Hosting
`t-3005039259` transféré sur cette révision. L'ancienne 006 ne conserve pas ce tag.
Le prochain rollout App Hosting doit reprendre `apphosting.yaml` (trois sauts).

Fonction admin : ACTIVE, build `99b64313-63b2-4188-8bc0-23bbf37f8180`.

- App Hosting `secondevie-next-sandbox`, europe-west4 : source locale complète,
  catalogue réel, 1 CPU/512 Mio, minimum 1/maximum 3, concurrence 16 ; quatre
  passkeys et neuf groupes publics activés ; métriques opérationnelles activées.
- Fonction ciblée `readAdminSharedGen2`, europe-west1 : 1 CPU/512 Mio,
  minimum 0/maximum 1, concurrence 4. Anciennes Functions conservées pour rollback.
- IAM appliqué : rôle personnalisé limité à signBlob sur le propre compte public,
  accès aux cinq secrets runtime ; compte lecteur admin créé avec lecture Firestore,
  accès au HMAC des liens et droit d'usage pour le builder.
- Archive App Hosting corrigée pour inclure les modules métier partagés de
  `functions/` sans ses dépendances installées ni fichiers d'environnement.
  Stripe 20.3.0 et Nodemailer 9.0.5 ajoutés aux dépendances racine de Next.

## Réseau

La tentative `internal-and-cloud-load-balancing` a retourné 404 sur le domaine
App Hosting et l'URL directe. Retour immédiat à `all`, domaine App Hosting relu 200.
Cette restriction ne convient donc pas à ce backend. La qualification des en-têtes
est terminée avec une sonde opérateur éphémère, privée/no-store et protégée par un
jeton aléatoire dont seul le SHA-256 était configuré. Aucun en-tête n'est journalisé.
Chaîne hébergée : trois adresses ; l'ajout de deux adresses synthétiques ajoute
seulement un préfixe. Le client reste la troisième adresse depuis la droite ;
le dernier proxy varie entre requêtes. Les deux URL directes Cloud Run renvoient
403, avec ou sans préfixe injecté. Aucun grant public d'invocation observé au
service/projet. `PUBLIC_AUTH_PROXY_HOPS=3` est appliqué et la sonde désactivée
(variable retirée, réponse 404). Aucun nombre de sauts déduit de la seule documentation.

## Contrôles de livraison bornés

- Galerie, `/admin` et version catalogue : 200.
- Routes passkey et OTP sans App Check : 401 ; lecteur admin sans App Check : 401.
- Sonde désactivée : 404. Aucune recette métier exécutée.
- Public : minimum de service 1, maximum de service 3 ; révision minimum 0,
  maximum 3, 1 CPU/512 Mio, concurrence 16. Les 565 révisions ont un minimum nul.
  Le maintien est alloué par le service au trafic actif, pas multiplié par les tags.
- Lecteur admin et deux anciennes passkeys : aucun minimum positif.

## Ce que reçoit le back-office

Les dix lectures du registre passent par le lecteur partagé. Préchargement
progressif après autorisation et premier résultat Stats, priorité à l'onglet ouvert,
réutilisation des caches/listes et requêtes en cours, arrêt hors écran/hors ligne,
purge à la perte d'identité/droits. Les autres services admin spécialisés restent
séparés. Aucun polling ajouté pour maintenir une instance chaude.

## Limites

Les tests locaux précédents restent les seules recettes métier réalisées.
Aucune nouvelle batterie, aucun email, compte client, commande ou paiement créé
pendant cette livraison. Ressources contraintes, latences réelles et coûts après
activation restent à mesurer. Les 3,22 € sont une ancienne prévision de septembre,
pas une estimation de la configuration livrée.

Rollback de référence avant intervention :
`secondevie-next-sandbox-build-2026-09-09-005` ; restaurer les transports Functions
et minimum zéro sans réchauffer les deux anciennes passkeys. Vérifier les révisions
et tags après toute bascule pour ne conserver qu'un maintien permanent.
