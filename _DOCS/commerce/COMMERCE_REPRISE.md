# Reprise commerce — axes restants

Revue documentaire : 2026-09-04. Propriétaire : commerce / équipe Seconde Vie.
Statut : `REPRISE_CIBLEE_PREUVES_ET_DECISIONS_RESTANTES`.
Revue cible : 2026-10-31 ; pas de fermeture automatique à cette date.

## Point de départ

Lire [COMMERCE_SYNTHESE.md](COMMERCE_SYNTHESE.md). Noyau 0A–8 qualifié,
sandbox durablement ouvert en `v2_all/v2`, Stripe test et offline off.
Les anciennes instructions de réouverture/fermeture temporaire sont archivées.
Ce plan ne donne aucun mandat de déploiement, de mutation ou de production.

## R0 et R2 — historique terminé

- R0 : première consolidation documentaire le 29 juillet, puis rangement du
  4 septembre. Il n'existe plus de handoff racine parallèle.
- R2 : fenêtre de qualification sur cinq meubles réels le 29 juillet, refermée.
  La décision d'ouverture durable du 25 août l'a remplacée pour les tests courants.

Ne pas rejouer ces phases au seul motif que leur ancien journal listait une suite.

## R1 — requalification fonctionnelle ciblée

Les reprises paiement, snapshots client, téléphone et suivi transporteur sont
désormais implémentés dans le code. Ne pas les réimplémenter depuis les constats
de juillet. Confirmer leur rendu réel sur la révision qualifiée.

| Objet | Référence de preuve / condition de sortie |
| --- | --- |
| Course checkout, message de pièce vendue | HRT-002 : deux profils isolés, aucune double commande/vente |
| Refund visible sans refresh | HRT-003 : même commande, état client/admin/Stripe convergent |
| Connexion admin sans navigation forcée | HRT-005 : Google depuis la galerie, accès admin inchangé |
| Premier affichage Ventes | HRT-007 : mesure froid/chaud séparée, sans élargir le chargement Stats |
| Expédition et correction du suivi | A-018 déjà requalifiée selon son détail ; regression M04-M08-M09 seulement si le parcours change |
| Publication et changement de session | A-021 déjà requalifiée le 23 août ; ne pas rouvrir depuis son ancienne ligne de synthèse |
| OTP client/checkout | A-033 / M01-M02 : code courant utilisable, pas seulement message reçu |
| Résidus et anciennes anomalies | Lire la dernière preuve de chaque ID ; aucune suppression par ancien libellé de table |

Suivis : [recette HRT](../quality/RECETTE_HUMAINE_SANDBOX.md) et
[anomalies](../../anomalies.md). Méthode :
[recette client/admin](../quality/RECETTE_CLIENT_ADMIN.md).

Done R1 : preuves ciblées réelles, état autoritaire cohérent, résidus identifiés,
aucun incident financier/stock ignoré. La matrice finale Safari/iPhone/Face ID
et appareils reste différée à la préparation production, sauf demande dédiée.
Un statut `CORRIGEE_A_REQUALIFIER` ne suspend pas les scénarios indépendants.

## R3 — décisions métier externes

À confirmer avec la cliente et, si nécessaire, son conseil :
catalogue réellement vendable ; zones, tarifs et délais de livraison ;
taxes/frais/devise/arrondis ; annulations, retours et remboursements ;
responsabilité des frais Stripe/Connect ; nature des factures/avoirs ;
CGV, conservation et anonymisation.

Done : choix explicites, responsable identifié, textes validés et policy serveur
versionnée ; aucun placeholder de démonstration utilisé en live.

## R4 et R5 — production différée

R4 exige un mandat distinct et les prérequis de
[COMMERCE_STRIPE.md](COMMERCE_STRIPE.md) et
[INFRASTRUCTURE.md](../infra/INFRASTRUCTURE.md) : domaine/origines/RP ID,
Firebase/App Hosting distinct, Stripe/Connect live et KYC, webhooks, e-mail/DNS,
App Check, IAM/secrets, sauvegarde/restauration, alertes et rollback.

R5, seulement après R4 autorisé : faible paiement live, confirmation de tous les
effets, remboursement/rapprochement, retour physique si pertinent, observation,
puis ouverture limitée décidée explicitement.

Stop si cible douteuse, paiement non projeté, divergence financière/stock,
webhook indisponible, document trompeur ou effet dupliqué.
Aucune action live ni modification DNS n'est autorisée par la présence de ce plan.

## Fermeture

Fermer lorsque R1 est prouvé et R3–R5 réalisés ou explicitement transférés aux
chapitres canoniques avec leur statut réel. Vérifier les liens, puis archiver le
plan et retirer son entrée des suivis actifs. Ne pas fabriquer une nouvelle
roadmap ou repousser silencieusement l'échéance.
