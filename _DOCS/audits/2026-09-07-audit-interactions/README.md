# Audit du 7 septembre 2026 — interactions et fiabilité

Dernier audit du projet enregistré à cette date. Ce dossier conserve une
photographie de la clôture, distincte des futures modifications du site.

## Ce qu'il faut retenir

Le bilan est positif : le site avait déjà ses grandes fonctionnalités, mais
plusieurs situations inhabituelles pouvaient produire des erreurs importantes.
Ce chantier consolide ces fonctionnalités avant leur utilisation réelle.

- **Achats et argent :** protection contre les actions simultanées, les
  doubles clics, les réponses retardées et les incohérences de remboursement.
- **Comptes et accès :** renforcement des connexions, des droits administrateur
  et de la séparation entre les données de deux comptes successifs.
- **Mails, documents et gestion :** meilleure gestion des envois incertains,
  documents complets et sauvegardes concurrentes qui ne s'écrasent plus.
- **Fluidité et entretien :** moins de travail inutile, tâches arrêtées quand
  leur écran disparaît, lectures limitées et retrait de code sans usage.

Il y a eu des corrections effectives : 109 fichiers source modifiés ou ajoutés
durant la relecture, après une première passe de correctifs. Le gain principal
est la fiabilité ; aucun gain de vitesse chiffré n'a été mesuré.

Les 448 fichiers du périmètre applicatif ont été relus intégralement. Les
591 tests sélectionnés passent et le contrôle statique ne signale aucune
erreur bloquante. Ses 121 avertissements restants sont documentés. Cela ne
prouve pas qu'aucune régression n'existe : les parcours dans un navigateur,
le build, les règles dans un émulateur et les paiements réels n'ont pas été
vérifiés pendant cet audit. **Les changements ne sont pas déployés.**

## Contenu conservé

- [Rapport détaillé final](RELECTURE_INTEGRALE_INTERACTIONS_2026-09-07.md) :
  40 ensembles de corrections, causes, preuves et limites.
- [Première passe](AUDIT_INTERACTIONS_2026-09-07.md) : correctifs initiaux et historique.
- [Inventaire individuel](preuves/interactions-2026-09-07-relecture-integrale.json).
- [Tests et validations](preuves/interactions-2026-09-07-relecture-validations.json)
  et [journal des tests](preuves/interactions-2026-09-07-relecture-tests.txt).
- [Patch de la relecture](preuves/interactions-2026-09-07-relecture-sources.patch) :
  changements par rapport au début de cette passe, et non par rapport à Git HEAD.
- [Code et tests à la clôture](code-et-tests.zip) : photographie des sources
  auditées, tests et fichiers de support locaux ; aucune dépendance installée,
  donnée cloud ou configuration secrète. Les sources incluent aussi les
  correctifs de la première passe et les travaux qui préexistaient à l'audit.
  Ce ZIP n'est pas un dépôt autonome prêt à déployer.
- [Manifeste de conservation](manifest.json) : fichiers et empreintes de contrôle.

Les documents originaux restent à leur emplacement pour préserver les liens
du projet. Les liens vers le code dans ces copies pointent vers le code courant
du dépôt ; le ZIP conserve la version figée. Aucun commit ou déploiement n'a
été réalisé pour constituer ce dossier.
