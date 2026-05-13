/**
 * 🔧 FIX SCRIPT — Teste et corrige les images cassées
 * Usage : node scripts/fix-images.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required.');
}
initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

const APP_ID = 'secondevie';
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/furniture`;

// Teste si une URL d'image est accessible
async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

// URLs de remplacement vérifiées — meubles/antiques pertinents
const REPLACEMENT_MAP = {
  // MOBILIER
  "Buffet de campagne en chêne": [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=80",
  ],
  "Commode Louis XV en noyer": [
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
  ],
  "Armoire normande sculptée": [
    "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800&q=80",
  ],

  // TABLES
  "Table de monastère en orme": [
    "https://images.unsplash.com/photo-1604074131665-7a4b13870ab3?w=800&q=80",
    "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&q=80",
  ],
  "Guéridon Art Déco en palissandre": [
    "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80",
  ],
  "Table de ferme en merisier": [
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
    "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&q=80",
  ],

  // ASSISES
  "Fauteuil Voltaire restauré": [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80",
  ],
  "Paire de chaises bistrot Thonet": [
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
  ],
  "Banquette de ferme en pin": [
    "https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800&q=80",
  ],

  // MIROIRS
  "Miroir doré ovale Napoléon III": [
    "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80",
  ],
  "Miroir barbier Art Déco triptyque": [
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
  ],
  "Grand miroir trumeau Louis XVI": [
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80",
  ],

  // ECLAIRAGE
  "Lampe de bureau Jielde vintage": [
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80",
  ],
  "Lustre à pampilles en cristal": [
    "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=800&q=80",
  ],
  "Applique murale Art Nouveau en laiton": [
    "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80",
  ],

  // DECO
  "Globe terrestre vintage sur pied": [
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
  ],
  "Plateau de service en faïence de Gien": [
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
  ],
  "Carafe Art Déco en verre soufflé": [
    "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=800&q=80",
  ],
};

async function fix() {
  console.log("\n🔍 Diagnostic des images en cours...\n");
  
  const snapshot = await db.collection(COLLECTION_PATH).get();
  let fixed = 0;
  let ok = 0;
  let broken = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const images = data.images || [];
    const name = data.name;
    
    let hasBroken = false;
    for (const url of images) {
      const isOk = await testUrl(url);
      if (!isOk) {
        console.log(`  ❌  [BROKEN]  ${name}  →  ${url.substring(0, 70)}...`);
        hasBroken = true;
        broken++;
      } else {
        ok++;
      }
    }

    if (hasBroken && REPLACEMENT_MAP[name]) {
      // Vérifier que les URLs de remplacement fonctionnent
      const newImages = [];
      for (const url of REPLACEMENT_MAP[name]) {
        const isOk = await testUrl(url);
        if (isOk) {
          newImages.push(url);
        } else {
          console.log(`  ⚠️  [REPLACEMENT ALSO BROKEN]  ${url.substring(0, 70)}...`);
        }
      }

      if (newImages.length > 0) {
        await docSnap.ref.update({
          images: newImages,
          imageUrl: newImages[0],
        });
        console.log(`  ✅  [FIXED]   ${name}  →  ${newImages.length} image(s) valide(s)`);
        fixed++;
      }
    } else if (!hasBroken) {
      // silently ok
    }
  }

  console.log(`\n📊 Résultat : ${ok} OK, ${broken} cassée(s), ${fixed} corrigée(s)\n`);
}

fix().catch(console.error);
