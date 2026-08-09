# Audit ChatGPT Ultra

Date : 9 août 2026  
Projet : Seconde Vie Next.js SSR  
Environnement audité et déployé : sandbox Firebase App Hosting  
Branche : `main`  
Commit applicatif déployé : `ddcee71`

## Verdict

Le projet a fait l'objet d'un audit transversal du code exécutable, de la configuration, de la build Next.js, des parcours publics, du back-office, du commerce, de Firebase et des données sandbox.

La release App Hosting issue du commit `ddcee71` a été construite et déployée avec succès sur :

`https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`

Les quatre Functions de facturation manuelle ont également été déployées séparément et sont actives en Node.js 22 dans `europe-west1`. Les autres changements Functions de l'audit restent à déployer par lots dédiés après leurs gates propres.

## Corrections principales intégrées

- expiration autoritaire des réservations checkout et worker de libération du stock ;
- reprise propre d'un paiement expiré ou annulé sans boucle navigateur ;
- archivage logique des produits au lieu d'une suppression destructive ;
- correction de la source catalogue utilisée par les factures manuelles ;
- préchargement de l'atelier Factures, suppression de son écran d'attente plein format et prise en charge des images du catalogue ;
- préchargement des paramètres Livraison et remplacement de l'écran d'attente bloquant par une synchronisation non bloquante ;
- synchronisation des frais de livraison et du total avec le serveur ;
- suppression des promesses de livraison non implémentées ;
- protection des tokens des liens de paiement vis-à-vis du support ;
- amélioration du clavier, du focus, des dialogues et des notifications ;
- chargement différé de Firebase Analytics ;
- compatibilité du budget de performance avec Next.js 16 ;
- contrôle de l'origine SEO empêchant une release publique contenant `localhost` ;
- suppression des rapports de maintenance publics ;
- suppression complète de la page Maintenance du back-office ;
- mise à jour des dépendances sans alerte haute ou critique connue ;
- nettoyage de deux anciens générateurs PDF clients non utilisés.

## Décisions de démonstration conservées

- le jeu promotionnel et la newsletter restent visibles avant leur branchement serveur ;
- les coordonnées de démonstration restent visibles dans le footer ;
- les réseaux sociaux et documents juridiques restent visibles mais inactifs sans URL ;
- le checkout de démonstration reste utilisable avant publication définitive des CGV ;
- le formulaire de devis permet d'obtenir une estimation, mais l'envoi réel attend une adresse confirmée ;
- la future boîte de réception et gestion des devis dans le back-office est laissée en attente des spécifications d'interface.

## Validations exécutées

- build exacte `npm run build` : Next.js 16.3.0 avec Turbopack, 52 pages générées ;
- lint application : aucune erreur ;
- lint Functions et commerce : aucune erreur ;
- tests Auth : 70 réussis ;
- tests catalogue : 29 réussis ;
- tests commerce unitaires : 121 réussis ;
- tests de panne commerce : 41 réussis ;
- émulateur Firebase commerce : 18 scénarios et 93 assertions réussis ;
- tests publics, accessibilité, confidentialité, factures et onboarding : 25 réussis ;
- contrats SEO, sitemap, canonicals, routes et cache de déploiement : réussis ;
- `git diff --check` : réussi.

## Vérifications après déploiement

- `/`, `/galerie`, `/devis`, `/admin`, `/robots.txt` et `/sitemap.xml` : HTTP 200 ;
- `/maintenance/audit.json` : HTTP 404 ;
- `/maintenance/status.json` : HTTP 404 ;
- newsletter et jeu promotionnel présents sur la home ;
- coordonnées de démonstration présentes ;
- ancienne promesse « livraison offerte dès 250 € » absente.
- quatre Functions de facturation actives en Node.js 22 dans `europe-west1` ;
- trois anciens produits techniques « Fixture Gate 6 » supprimés de la collection racine erronée après sauvegarde et contrôle de leurs références ;
- aucun de ces trois produits n'était lié à une facture, une commande active ou une réservation active.
- page Livraison publiée dans le rollout App Hosting `sv-msm5kozo-6d8587d0ca82`.

## État des données sandbox observé pendant l'audit

- 37 produits publiés dans la collection catalogue autoritaire ;
- 31 produits actuellement indexables dans le sitemap ;
- aucun checkout actif ou expiré à reprendre au moment du contrôle ;
- aucune réservation de stock encore détenue ;
- cinq fiches de test manuelles restent publiées : `xpc`, `x`, `zzz`, `dzzc` et `hh` ;
- ces cinq fiches n'ont aucune commande ni réservation connue, mais ne portent aucun marqueur officiel de fixture.

## Points restant à traiter

1. Déployer séparément les Functions hors facturation encore en attente, après leurs gates propres.
2. Dépublier les cinq fiches de test après validation métier explicite.
3. Configurer les coordonnées, réseaux et documents juridiques définitifs.
4. Concevoir puis câbler la réception et la gestion des devis dans le back-office.
5. Câbler réellement la newsletter et le jeu promotionnel.
6. Rejouer la recette humaine authentifiée client et administrateur après activation de Chrome.
7. Réduire le CSS initial, actuellement au-dessus du budget indicatif.
8. Optimiser les vidéos et confirmer visuellement les médias candidats au nettoyage.
9. Décider si le sandbox doit être indexable avant le domaine final.
10. Finaliser plus tard le domaine, le DNS e-mail, Resend, Stripe live et App Check production.

## Traçabilité

Ce fichier est l'unique audit de synthèse présent dans le dossier `audit` à sa création. Le chapitre canonique `_DOCS/data/AUDIT_COUTS_FIRESTORE.md` n'a pas été déplacé : il appartient à la documentation technique du domaine des données et ne constitue pas un ancien rapport de ce dossier.
