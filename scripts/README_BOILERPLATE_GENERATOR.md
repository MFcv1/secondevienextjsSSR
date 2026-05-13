# 🏭 Usine à Sites (Boilerplate Generator)

Ce script PowerShell te permet de **cloner instantanément** toute l'architecture technique de "Tous à Table" vers un nouveau dossier projet vierge, prêt pour un nouveau client.

Il automatise le nettoyage (suppression des `node_modules`, `.git`, caches) et prépare les fichiers de configuration pour un démarrage ultra-rapide.

---

## 🚀 Comment l'utiliser ?

### 1. Ouvrir le Terminal (PowerShell)
Dans le dossier racine du projet `Tous à Table`.

### 2. Lancer la commande de génération
Remplace `"C:\Chemin\Vers\Nouveau_Projet"` par le dossier où tu veux créer ton nouveau site.

```powershell
.\scripts\make_boilerplate.ps1 "C:\Users\matth\Desktop\Mon_Nouveau_Client"
```

> **Note :** Si le dossier n'existe pas, le script le créera pour toi.

---

## ✅ Ce que fait le script (Automatiquement)

1.  **Copie Intelligente** :
    *   ✅ `src/` (Tout le code source React)
    *   ✅ `functions/` (Le Backend Serverless Node.js)
    *   ✅ `public/` (Les assets statiques de base)
    *   ✅ Les fichiers de config critiques (`vite.config.js`, `tailwind.config.js`, `firebase.json`...)

2.  **Nettoyage & Exclusion (Ce qu'il ne copie PAS)** :
    *   ❌ `node_modules` (Trop lourd, à réinstaller proprement)
    *   ❌ `.git` (Pour repartir sur un historique vierge)
    *   ❌ `dist` & `.firebase` (Fichiers de build/cache inutiles)
    *   ❌ `_ARCHIVE` & `_DOCS` (Spécifiques à "Tous à Table")
    *   ❌ `.env` & `.env.prod` (Contiennent tes clés secrètes actuelles)

3.  **Initialisation** :
    *   📝 Crée un fichier `.env` **vierge** avec les variables prêtes à être remplies (API Keys).
    *   🏷️ Réinitialise le `package.json` avec un nom générique (`nouveau-projet-boilerplate`) et version `0.0.1`.
    *   📄 Ajoute un `README_BOILERPLATE.md` dans le nouveau dossier pour t'expliquer la suite.

---

## 🏁 Après la génération (Dans le NOUVEAU dossier)

Une fois le script terminé, va dans ton nouveau dossier et lance ces commandes pour "réveiller" le projet :

1.  **Installation des dépendances Frontend** :
    ```bash
    npm install
    ```

2.  **Installation des dépendances Backend** :
    ```bash
    cd functions
    npm install
    cd ..
    ```

3.  **Lancement du serveur de développement** :
    ```bash
    npm run dev
    ```

C'est tout ! Tu as un clone parfait, propre et fonctionnel de ton architecture en moins de 30 secondes. ⚡
