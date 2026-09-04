<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Seconde Vie — consignes de travail

Révision documentaire : 2026-09-04. Propriétaire : équipe Seconde Vie.
Ce fichier contient les règles transverses, pas le journal des chantiers.

## Comprendre juste assez avant d'agir

Seconde Vie est la vitrine et boutique d'un atelier de restauration de meubles,
avec devis et back-office. Priorité : une préproduction fiable, rapide et
présentable à la cliente, sans complexité gratuite. Préserver l'identité
éditoriale/premium et les parcours existants. Vision : [README.md](README.md).

Lecture ciblée, pas de chargement de toute la documentation :

1. Repérer le flux dans [map.md](map.md).
2. Lire le chapitre utile via [_DOCS/README.md](_DOCS/README.md), puis le code.
3. Consulter [_DOCS/ETAT_PROJET.md](_DOCS/ETAT_PROJET.md) seulement pour
   l'état des chantiers, une reprise globale ou une décision de livraison.

Ne pas lire `doc/archives/`, les anciens audits, les journaux de recette ou
tous les skills par défaut. Une archive est une preuve historique, jamais
une instruction actuelle. Un document lu pour audit ne déclenche pas son
workflow. Les skills de design ne justifient pas un redesign hors demande.

Pour les faits : demande actuelle > code/configuration/rules exécutables >
documentation canonique > archives/conversations. Une preuve locale ne prouve
pas un déploiement. Signaler et corriger les contradictions du périmètre traité.

## Environnement et limites

- Baseline : Node `22.x`, pnpm `11.7.0`, Next `16.3.x`, React `19.2.x`.
  Vérifier `package.json` et les lockfiles ; Node 24 local ne change pas la cible.
- Firebase : `secondevienextjsssr` ; App Hosting : `secondevie-next-sandbox`,
  région `europe-west4` ; Functions principalement `europe-west1`.
- Sandbox : https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app
- Commerce sandbox ouvert durablement en `v2_all/v2` par décision du
  2026-08-25 ; Stripe **test**, offline **off**. Relire le contrôle réel avant
  une mutation. Ne pas rétablir les anciennes fenêtres fermées de juillet.
- Production, domaine/DNS final, Resend, Stripe/Connect live et App Check
  production restent différés. Le sandbox n'est pas le domaine final WebAuthn.
- Les révisions cloud, inventaires et rollbacks sont des observations datées :
  les revérifier avant déploiement, ne pas les copier ici.

## Invariants à préserver

### Public, catalogue et images

- App Router natif ; `/` galerie canonique, `/galerie` alias partagé.
  Pages publiques serveur/SSG/ISR 300 ; tunnels privés dynamiques noindex.
- Pas de routeur SPA/hash, `ClientApp`, `setView` ni fausse page remplacée
  après hydratation. Pas de `cookies()`, `headers()`, `draftMode()` ou
  `searchParams` serveur sur les pages publiques statiques.
- `furniture` est la source métier ; le public lit uniquement le snapshot
  Storage via les helpers/API same-origin, jamais Firestore en fallback.
- Pointeurs `current/previous/last-known-good` relus frais ; seules les
  releases immuables sont cachées. Publication CAS, plan d'impact et
  revalidation HMAC ; signal catalogue borné, sans polling permanent.
- Produit normalisé et `isPurchasable` uniques ; prix/stock revérifiés serveur.
- Préserver `imageVariants`/`imageMetadata`, petites variantes sur cartes,
  `detailFast` au détail, grande image au zoom ; éviter CLS et flash.
- Ne jamais supprimer un média Storage sur la seule base de `rg` :
  références en base, dry-run et quarantaine doivent être contrôlés.

### Navigation, identité et administration

- Shell/menu immédiatement utilisables, sans attendre Auth/panier/wishlist.
  Navigation Next, aucune galerie intermédiaire lors d'un changement de route.
- Galerie mobile à scroll interne ; catégories à scroll document.
  `app/ViewportHeightSyncIsland.jsx` possède seul
  `--marketplace-viewport-height` pendant toute la navigation.
- Préserver focus, Escape, restauration du focus, safe areas et
  `prefers-reduced-motion`. Aucun redesign dans un correctif technique ciblé.
- Chaque build a un `deploymentId` unique ; `expireTime: 300`.
  Cache Components, Partial Prefetching et autres opt-ins ne sont pas implicites.
- `authStore`/`AuthContext` partagés ; passkey terminée seulement après
  `loginWithCustomToken` réussi ; vérification WebAuthn locale exigée serveur.
  OTP idempotent/HMAC dédié, Google et OTP restent des alternatives.
- Admin = claim + registre actif + AAL2 Google ou passkey sur la session valide,
  sans expiration arbitraire à quinze minutes. Retrait = claims, registre et
  révocation des refresh tokens. Un bouton masqué n'est pas une autorisation.
- Le client de recette ne devient jamais admin. Identités et procédure dans
  [_DOCS/quality/RECETTE_CLIENT_ADMIN.md](_DOCS/quality/RECETTE_CLIENT_ADMIN.md).
- Grandes vues admin lazy ; listes, exports et écoutes bornés ; cache purgé
  à la perte d'autorisation. Donnée absente ≠ zéro.

### Commerce, données et secrets

- Serveur autoritaire pour prix, stock, paiement et droits ; commandes,
  webhooks, mouvements et reprises idempotents ; succès UI après `paid` durable.
- Ne jamais supprimer/annuler une commande payée sans remboursement.
  Refund financier ≠ retour physique ≠ restock : remise en vente seulement
  après disposition admissible et mouvement idempotent.
- Conserver snapshots, faits financiers et audit. Aucune mutation financière
  ambiguë rejouée aveuglément.
- Analytics minimisés, bornés et non bloquants ; aucune nouvelle collection
  sans rules, indexes et rétention. Dry-run, comptages et sauvegarde avant masse.
- Aucun secret dans Markdown, captures, logs ou `NEXT_PUBLIC_*` ; ne pas
  afficher les `.env`, OTP, PIN, tokens ou comptes de service.
- Pas de lecture de boîte mail sans autorisation du workflow actuel.
  Ne pas demander un PIN/secret dans le chat ni contourner une protection.
- App Check complète Auth/rules ; signatures fournisseur obligatoires.
  Ne jamais les désactiver pour faire passer un test.

## Exécuter à la bonne échelle

- **Audit/diagnostic** : lecture seule, sauf correction explicitement demandée.
  Distinguer fait, hypothèse, dette et preuve manquante. Aucun scan Codex
  Security/plugin de sécurité sans demande explicite.
- **Correctif ciblé** : cause, plus petit patch utile, vérification locale
  nécessaire, puis arrêt. Pas de build, serveur, navigateur, capture,
  Playwright ou E2E automatique sans demande.
- **Construction** : inspecter amont/aval, implémenter le périmètre demandé,
  mettre à jour les contrats affectés, tester proportionnellement.
- **Cloud/déploiement** : autorisation du workflow, projet/environnement/
  branche/cibles certains, gates, déploiement ciblé, preuve et rollback.
  Aucun déploiement global Functions ni action production implicite.
- Choisir les commandes dans [QUALITE_TESTS.md](_DOCS/quality/QUALITE_TESTS.md).
  `e2e:hosted-stripe` et `e2e:refund-stripe` restent `DO_NOT_RUN`.
  `commerce:e2e:gate7b` exige sa propre autorisation sandbox bornée.
- Ne pas ouvrir un chantier différé au milieu d'un patch. Pas de nouvelle
  roadmap sans demande ; une gate sans preuve reste ouverte, même après sa date.

## Git, documentation et fin de tâche

- Vérifier `git status --short` avant/après. Préserver les changements existants ;
  modifier manuellement avec `apply_patch`. Branches agent : `codex/`.
- Pas de commit/push/merge/déploiement sans demande correspondante.
  Pas de `git reset --hard`, `git clean` ou effacement de travail non identifié.
- Avant suppression/renommage : lire entièrement, rechercher imports/appelants/
  références dynamiques et données si pertinent, vérifier Git, transférer les
  informations utiles, mettre à jour les liens et garder un diff réversible.
- Un contrat durable va dans son chapitre ; `map.md` ne liste que les points
  d'entrée. État des travaux dans `ETAT_PROJET.md`, pas dans toutes les pages.
- Archives autorisées par le rangement du 2026-09-04 dans `doc/archives/`,
  hors parcours normal et recherches `rg` par défaut via `.ignore`.
  Ne pas y cacher une gate ou anomalie ouverte sans référence active.
- Fin : besoin satisfait, validations proportionnées et `git diff --check`
  passés, liens vérifiés si documentation modifiée. Compte rendu concis en
  français : résultat, validations/non-exécutées, déploiement oui/non,
  déplacements/suppressions et limites concrètes. Aucun prochain chantier inventé.
