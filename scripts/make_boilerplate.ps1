param (
    [Parameter(Mandatory=$true)]
    [string]$DestinationPath
)

$SourcePath = "C:\Users\matth\Desktop\Tous à Table"
$ExcludeList = @("node_modules", ".git", ".firebase", "dist", "_ARCHIVE", ".github", ".vscode", "competence", ".firebaserc", ".env", ".env.prod", "package-lock.json", "yarn.lock")

Write-Host "Demarrage du clonage vers : $DestinationPath" -ForegroundColor Cyan

if (-not (Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Force -Path $DestinationPath | Out-Null
}

Write-Host "Copie intelligente des fichiers source (Copy-Item Natif)..." -ForegroundColor Yellow

Copy-Item "$SourcePath\*" "$DestinationPath" -Recurse -Force -Exclude $ExcludeList

Write-Host "Copie terminee." -ForegroundColor Green

$EnvLines = @(
    "VITE_FIREBASE_API_KEY=",
    "VITE_FIREBASE_AUTH_DOMAIN=",
    "VITE_FIREBASE_PROJECT_ID=",
    "VITE_FIREBASE_STORAGE_BUCKET=",
    "VITE_FIREBASE_MESSAGING_SENDER_ID=",
    "VITE_FIREBASE_APP_ID=",
    "VITE_FIREBASE_MEASUREMENT_ID=",
    "VITE_RECAPTCHA_SITE_KEY=",
    "VITE_APP_LOGICAL_NAME=nouveau-projet",
    "VITE_STRIPE_PUBLIC_KEY="
)

Set-Content -Path (Join-Path -Path $DestinationPath -ChildPath ".env") -Value $EnvLines -Encoding UTF8

$PackageJsonPath = Join-Path -Path $DestinationPath -ChildPath "package.json"
if (Test-Path $PackageJsonPath) {
    $Pkg = Get-Content $PackageJsonPath | ConvertFrom-Json
    $Pkg.name = "nouveau-projet-boilerplate"
    $Pkg.version = "0.0.1"
    $Pkg.description = "Projet genere depuis l'architecture Premium Tous a Table"
    $Pkg | ConvertTo-Json -Depth 10 | Set-Content $PackageJsonPath -Encoding UTF8
}

Write-Host "Generation du Manifeste d'Architecture pour l'Agent IA..." -ForegroundColor Magenta

$ManifestLines = @(
    "# MANIFESTE ARCHITECTURAL & AUDIT DE DEMARRAGE",
    "**A l'attention de l'Agent IA en charge de ce nouveau projet.**",
    "Ce repository a ete clone depuis l'architecture premium d'un projet precedent. Voici l'audit exact des systemes en place et comment faire evoluer ce boilerplate.",
    "",
    "## 1. Audit Securite & Backend (Firebase Cloud Functions)",
    "Ce projet possede un backend Node.js extremement robuste dans le dossier `/functions`. Ne le detruis pas.",
    "*   **Idempotence Stripe** : Les achats directs utilisent une cle `sys_idempotency` pour garantir qu'un double clic reseau ne facture pas deux fois l'utilisateur.",
    "*   **Rate Limiting** : Une logique anti-spam Firestore est en place via une collection `sys_ratelimit`. (Max 5 requetes par minute).",
    "*   **Security Headers** : Le fichier `firebase.json` contient deja les Headers parfaits (CSP stricts, X-Frame-Options DENY, nosniff). **N'y touche pas sauf si des ressources externes bloquent.**",
    "*   **Hooks de Nettoyage (Garbage Collector)** : Le trigger `onArtifactDeleted` purge automatiquement le Storage et les sous-collections associes lorsqu'un document est supprime.",
    "",
    "## 2. Le Pack Admin (Back-Office)",
    "Le dossier `src/features/admin/` contient un CMS complet ultra-optimise :",
    "*   **Authentification par Role** : Verifie l'auth (`AuthContext.jsx`) qui lit la base `users/{uid}` pour le `role: `"admin`".",
    "*   **Optimisation Images** : Le systeme compresse en client-side (WebP) et sauvegarde **deux versions** (HD et THUMB) dans Firebase Storage.",
    "*   **Export Data** : Implementation de `xlsx` (SheetJS) pour exporter les commandes. Garde ce composant isole.",
    "",
    "## 3. Nouveau Design & Le 'Taste-Skill'",
    "Tu ne DOIS PAS reproduire le design exact du projet precedent. Tu dois l'elever au niveau superieur selon ces 3 variables que le client te demandera d'ajuster :",
    "*   `DESIGN_VARIANCE` (1-10) : Pour controler les symetries vs asymetries.",
    "*   `MOTION_INTENSITY` (1-10) : Pour jongler entre staticite et physiques fluides (GSAP Framer).",
    "*   `VISUAL_DENSITY` (1-10) : Pour choisir entre style 'Musee' ou 'Dashboard Dashboard'.",
    "*Regle d'or : Utilise la police 'Geist' ou 'Satoshi' pour les Dashboards Admin, et limite les typographies Serif au domaine artistique.*",
    "",
    "## 4. Mission Immediate: Fragmentation de la Page d'Accueil",
    "**ACTION REQUISE :** Le fichier herite `src/pages/HomeView.jsx` depasse les 1200 lignes. ",
    "Ta toute premiere mission (apres avoir npm install) sera de fragmenter ce monolithe :",
    "1.  Extrais `<RotatingSymbol>` et `<RotatingButton>` dans `src/components/shared/AnimatedIcons.jsx`.",
    "2.  Extrais la logique GSAP de la section **Manifesto** dans son propre composant `src/components/home/Manifesto.jsx`.",
    "3.  Extrais la section FAQ (`AccordionItem`) dans `src/components/home/FaqSection.jsx`.",
    "4.  Garde `HomeView.jsx` uniquement en tant qu'assembleur de composants (Wrapper).",
    "",
    "## 5. Commandes de Demarrage",
    "1. npm install (Racine)",
    "2. cd functions && npm install (Backend)",
    "3. Connecte le nouveau projet Firebase avec firebase use --add",
    "4. Lance l'environnement avec npm run dev",
    "",
    "Bon codage !"
)

Set-Content -Path (Join-Path -Path $DestinationPath -ChildPath "AGENT_INSTRUCTIONS.md") -Value $ManifestLines -Encoding UTF8

Write-Host "TERMINE ! Le Boilerplate est pret dans : $DestinationPath" -ForegroundColor Green
Write-Host "Le fichier AGENT_INSTRUCTIONS.md a ete genere avec succes pour guider ton IA." -ForegroundColor Cyan
