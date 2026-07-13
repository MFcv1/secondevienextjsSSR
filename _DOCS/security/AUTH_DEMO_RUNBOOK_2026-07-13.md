# Runbook Auth pour la demonstration cliente

Date: 2026-07-13  
Statut: `PRET POUR DEMONSTRATION - PASSE AUTH CLOTUREE`
Environnement: App Hosting sandbox `secondevie-next-sandbox`  
URL: `https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app`

## 1. Objectif

Presenter un parcours de connexion simple et fiable sans exposer les chantiers de production differes. La demonstration utilise Gmail comme transport OTP, Windows Hello comme passkey sandbox et `europe-west1` comme region Auth primaire.

Ne pas presenter Resend, le domaine final, Face ID, Android ou la suppression des Functions US comme deja valides en production.

## 2. Controle avant le rendez-vous

A effectuer environ trente minutes avant la demonstration:

1. ouvrir l'URL sandbox dans Chrome ou Edge sous Windows;
2. verifier que la home et le mega menu s'affichent;
3. verifier que le compte de recette et sa boite Gmail sont accessibles;
4. demander un unique code OTP et confirmer sa reception;
5. ne pas consommer plusieurs codes successifs: seul le dernier code envoye est valable;
6. verifier que Windows Hello est disponible sur l'appareil si la passkey doit etre montree;
7. fermer les autres fenetres susceptibles de masquer l'invite Windows Hello;
8. conserver un second navigateur ouvert sur la home comme solution de repli.

## 3. Ordre de demonstration recommande

### Parcours A - Premiere connexion par email

1. ouvrir le menu puis `Connexion`;
2. saisir l'adresse email du compte client;
3. cliquer sur `Recevoir mon code`;
4. saisir les six chiffres recus par email;
5. confirmer l'ecran `Connexion reussie`;
6. choisir `Continuer` ou `Activer sur cet appareil` selon le scenario;
7. verifier `Quitter` dans le header;
8. ouvrir le mega menu et verifier `Mon espace`;
9. ouvrir `Mon espace` et confirmer l'arrivee directe sur `/mes-commandes`.

### Parcours B - Activation puis reconnexion Windows Hello

1. depuis `Connexion reussie`, cliquer sur `Activer sur cet appareil`;
2. laisser la personne devant l'ordinateur saisir elle-meme son PIN Windows Hello;
3. se deconnecter avec `Quitter`;
4. rouvrir la modale: `Connexion rapide sur cet appareil` doit etre proposee pour l'email enregistre localement;
5. valider Windows Hello;
6. verifier a nouveau `Quitter` et `Mon espace`.

### Parcours C - Google

Utiliser `Continuer avec Google` uniquement si la demonstration doit montrer ce fournisseur ou si Gmail OTP est momentanement indisponible. L'interface de connexion reste commune aux comptes clients et administrateurs; les actions administratives sensibles exigent ensuite une assurance forte recente.

## 4. Replis immediats

| Probleme pendant la demo | Action immediate | Ce qu'il ne faut pas faire |
| --- | --- | --- |
| invite Windows Hello annulee ou masquee | choisir `Recevoir un code par email` | ne pas reenroler plusieurs passkeys dans l'urgence |
| passkey indisponible sur le navigateur | utiliser OTP Gmail, puis Google si necessaire | ne pas modifier le RP ID |
| code OTP expire ou invalide | attendre le delai affiche puis renvoyer un seul code | ne pas reutiliser un ancien code |
| e-mail lent | patienter quelques secondes et verifier les spams | ne pas basculer Resend pendant la demo |
| session UI incoherente | fermer la modale, actualiser une fois et se reconnecter | ne pas modifier les claims manuellement |
| action admin refusee apres OTP | effectuer le step-up Google ou passkey | ne pas affaiblir la verification AAL2 |
| incident Europe confirme | conserver les copies US pour le rollback technique | ne supprimer aucune Function pendant le rendez-vous |

## 5. Contrats attendus

- OTP: un seul envoi actif, verification idempotente et session Firebase creee avant fermeture de la modale;
- passkey: verification locale obligatoire, puis session Firebase synchronisee;
- UI: `Quitter` et `Mon espace` doivent refleter le meme AuthStore;
- accessibilite essentielle: focus dans la modale, boucle Tab, fermeture Escape et retour au declencheur;
- administration: OTP seul reste AAL1 et ne debloque pas les actions sensibles;
- email: `gmail` reste le provider actif; `RESEND_FROM_EMAIL` reste vide;
- region primaire: `europe-west1`; copies `us-central1` conservees comme rollback.

## 6. Rollback

### App Hosting

Utiliser l'historique du backend Firebase App Hosting `secondevie-next-sandbox` et restaurer la revision precedente stable. Ne jamais pointer la demonstration vers un backend de production non valide.

### Functions Auth

Les copies `us-central1` restent deployees pendant cette passe. Toute bascule ou suppression regionale exige une nouvelle passe de production et ne doit pas etre improvisee le jour de la demonstration.

### Email

Gmail reste le transport de demonstration. Resend est code et protege par Secret Manager mais ne doit pas etre active sans domaine expediteur verifie, SPF, DKIM, DMARC et recette de delivrabilite.

## 7. Limites acceptees

- les passkeys `hosted.app` sont des credentials sandbox a reenroler apres choix du domaine final;
- les mesures de latence sont ponctuelles et ne constituent pas des p50/p95 de production;
- Safari, Face ID et Android appartiennent a la future recette de production;
- aucune page avancee de gestion des passkeys n'est incluse dans cette livraison;
- les Functions US ne sont pas supprimees avant un soak de production suffisant.

## 8. Criteres de succes de la demonstration

La demonstration Auth est reussie si au moins un parcours principal se termine avec:

- session Firebase ouverte;
- `Quitter` visible dans le header;
- `Mon espace` visible dans le mega menu;
- `/mes-commandes` accessible;
- aucun blocage P0/P1;
- fallback OTP ou Google disponible si Windows Hello est annule.

Document de pilotage: [`AUTH_DEMO_PATCH_CLOSEOUT_PLAN_2026-07-13.md`](./AUTH_DEMO_PATCH_CLOSEOUT_PLAN_2026-07-13.md).
