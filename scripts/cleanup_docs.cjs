const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, '_DOCS');

const RECIPE_FILE = path.join(DOCS_DIR, 'LIVRE_DE_RECETTES.md');

// Structure du livre de recettes
const BIBLE = {
  "TOME I : Architecture & Infrastructure": [
    "GUIDE_ARCHITECTURE.md",
    "cloud.md",
    "dashboardfirebase.md",
    "firebaseenv.md",
    "environnement.md",
    "REGLES_ENV.md",
    "SECURITE.md",
    "appCheck.md",
    "basededonnee.md"
  ],
  "TOME II : Développement & Standards": [
    "GUIDE.md",
    "COMMANDS.md",
    "GUIDE_GIT.md",
    "github.md",
    "TUTO_TEST_MOBILE.md",
    "TODO_EMAIL_MIGRATION.md",
    "FACTURATION.md",
    "nomdedomaine.md"
  ],
  "TOME III : UI / UX & Animations": [
    "identite.md",
    "bandeau.md",
    "favicon.md",
    "GSAP_PIN_ARCHITECTURE.md",
    "SectionProcess_HorizontalScroll_Fix.md",
    "menudiag.md",
    "vectormenu.md",
    "module.md",
    "arche.md"
  ],
  "TOME IV : Structure des Pages & Composants": [
    "docs/vitrine-structure.md",
    "gallery.md",
    "galleryhero.md",
    "galleryapercu.md",
    "optimisationgallery.md",
    "login.md",
    "section.md"
  ],
  "TOME V : Backend, Analytics & Admin": [
    "GARBAGE_COLLECTOR_DOC.md",
    "datadiag.md",
    "datamap.md",
    "vueglobal.md",
    "publicationadmin.md",
    "Wishlistpanier.md",
    "caté.md"
  ],
  "TOME VI : Archives & Audits (Historique)": [
    "AUDIT_COMPLET_12FEV2026.md",
    "auditfiltregallery.md",
    "galleryV2diag.md",
    "rapportforclaude.md",
    "reset/rapportfunction.md",
    "reset/resetdiag.md",
    "reset/resetV2.md",
    "basededonneeroadmap.md"
  ]
};

const FILES_TO_KEEP_IN_ROOT = [
  "AGENT_INSTRUCTIONS.md",
  "CLAUDE.md",
  "GEMINI.md"
];

const DIRECTORIES_TO_DELETE = [
  "docs",
  "_DOCS/reset",
  "imageheader",
  "imagegallery",
  "video"
];

const FILES_TO_DELETE_LATER = [
  "_temp_10_6.jsx"
];

function findFile(filename) {
  const possiblePaths = [
    path.join(ROOT_DIR, filename),
    path.join(DOCS_DIR, filename),
    path.join(ROOT_DIR, "docs", filename),
    path.join(DOCS_DIR, "reset", filename.replace("reset/", ""))
  ];
  
  // also check without folders if specified
  if (filename.includes('/')) {
     const base = path.basename(filename);
     possiblePaths.push(path.join(ROOT_DIR, base));
     possiblePaths.push(path.join(DOCS_DIR, base));
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

let recipeContent = `# 📖 Le Grand Livre de Recettes : Seconde Vie Anaïs
> **Version:** 1.0 (Refonte Documentaire)
> **Date:** ${new Date().toISOString().split('T')[0]}
> **Descriptif:** Ce document centralise TOUTE l'intelligence, l'architecture, les audits et les guides du projet.

---

## 📑 TABLE DES MATIÈRES

`;

// Generate TOC
Object.keys(BIBLE).forEach(tome => {
  recipeContent += `\n### ${tome}\n`;
  BIBLE[tome].forEach(file => {
    recipeContent += `- [${path.basename(file)}](#${path.basename(file).toLowerCase().replace(/[\. ]/g, '')})\n`;
  });
});

recipeContent += `\n---\n\n`;

// Append content
let processedFiles = [];

Object.keys(BIBLE).forEach(tome => {
  recipeContent += `\n# 📜 ${tome}\n\n`;
  BIBLE[tome].forEach(file => {
    const filePath = findFile(file);
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf8');
      recipeContent += `\n<a id="${path.basename(file).toLowerCase().replace(/[\. ]/g, '')}"></a>\n`;
      recipeContent += `\n## 📄 Archive : ${path.basename(file)}\n\n`;
      recipeContent += content + `\n\n---\n`;
      processedFiles.push(filePath);
    } else {
      recipeContent += `\n## 📄 Archive : ${path.basename(file)}\n> *Fichier introuvable*\n\n---\n`;
    }
  });
});

fs.writeFileSync(RECIPE_FILE, recipeContent);
console.log('✅ Livre de recettes généré dans _DOCS/LIVRE_DE_RECETTES.md');

// Delete processed files and unwanted loose markdown files
const allFilesToClean = [
  ...fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.md') && !FILES_TO_KEEP_IN_ROOT.includes(f)).map(f => path.join(ROOT_DIR, f)),
  ...fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md') && f !== 'LIVRE_DE_RECETTES.md').map(f => path.join(DOCS_DIR, f))
];

allFilesToClean.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log(`🗑️ Deleted: ${f}`);
  }
});

// Delete temp file
FILES_TO_DELETE_LATER.forEach(f => {
  const p = path.join(ROOT_DIR, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`🗑️ Deleted: ${f}`);
  }
});

// Delete directories
DIRECTORIES_TO_DELETE.forEach(d => {
  const p = path.join(ROOT_DIR, d);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`🗑️ Deleted Directory: ${d}`);
  }
});

const legacyResetDir = path.join(DOCS_DIR, 'reset');
if(fs.existsSync(legacyResetDir)) {
    fs.rmSync(legacyResetDir, {recursive: true, force: true});
}

console.log('✨ Cleanup complete!');
