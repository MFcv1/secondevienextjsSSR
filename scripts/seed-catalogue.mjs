/**
 * 🌱 SEED SCRIPT — Catalogue de démonstration
 * Crée 18 publications fictives (3 par catégorie) dans Firestore (Sandbox)
 * avec des images Unsplash libres de droit.
 *
 * Usage : node scripts/seed-catalogue.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ── Initialisation Firebase Admin (utilise le projectId sandbox) ──
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required.');
}
initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

const APP_ID = 'secondevie';
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/furniture`;

// ════════════════════════════════════════════════════════════════
// 📸 Unsplash — Images libres de droit (format direct)
// ════════════════════════════════════════════════════════════════

const CATALOGUE = [
  // ─── LE MOBILIER (3) ──────────────────────────────────────
  {
    name: "Buffet de campagne en chêne",
    category: "mobilier",
    material: "Chêne",
    description: "Majestueux buffet bas de campagne française, début XIXe siècle. Ce meuble d'exception en chêne massif a été entièrement restauré dans notre atelier : décapage à la main, traitement anti-xylophage, cirage à la cire d'abeille naturelle. Les ferrures d'origine en fer forgé ont été conservées et patinées. Deux portes sculptées de motifs floraux encadrent trois tiroirs doublés de velours. Une pièce qui raconte l'histoire du terroir et apporte un caractère unique à votre intérieur.",
    startingPrice: 1850,
    width: "180", depth: "52", height: "95",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80",
    ],
  },
  {
    name: "Commode Louis XV en noyer",
    category: "mobilier",
    material: "Noyer",
    description: "Commode galbée d'époque Louis XV, circa 1760, en noyer massif blond. La façade présente trois tiroirs aux traverses ornées de moulures chantournées. Plateau en marbre gris Sainte-Anne d'origine. Restauration minutieuse : consolidation des assemblages à queues d'aronde, restitution des bronzes dorés, vernissage au tampon. Un chef-d'œuvre de l'ébénisterie française classique.",
    startingPrice: 3200,
    width: "130", depth: "58", height: "87",
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    ],
  },
  {
    name: "Armoire normande sculptée",
    category: "mobilier",
    material: "Chêne",
    description: "Imposante armoire de mariage normande, XIXe siècle. Richement sculptée de paniers fleuris, colombes et motifs de fécondité traditionnels. Le chêne massif a acquis une patine dorée remarquable au fil des décennies. Restauration complète dans notre atelier : remplacement des charnières intérieures, réajustement des portes, traitement et cire naturelle. Les serrures en fer forgé sont d'origine.",
    startingPrice: 2400,
    width: "160", depth: "65", height: "220",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    ],
  },

  // ─── LES TABLES (3) ───────────────────────────────────────
  {
    name: "Table de monastère en orme",
    category: "tables",
    material: "Orme",
    description: "Table de monastère en orme massif, fin XVIIIe siècle. Plateau de 5 cm d'épaisseur reposant sur un piétement massif à entretoise. Cette table imposante servait autrefois dans un réfectoire du Sud-Ouest. Décapée avec soin pour révéler les veines extraordinaires de l'orme, puis cirée dans la tradition. Les marques du temps — coups de couteau, brûlures de chandelle — racontent deux siècles de partage.",
    startingPrice: 2800,
    width: "240", depth: "85", height: "76",
    images: [
      "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800&q=80",
      "https://images.unsplash.com/photo-1604074131665-7a4b13870ab3?w=800&q=80",
    ],
  },
  {
    name: "Guéridon Art Déco en palissandre",
    category: "tables",
    material: "Palissandre",
    description: "Élégant guéridon Art Déco, années 1930. Structure en palissandre de Rio verni, plateau circulaire reposant sur un pied central fuselé terminé par une base tripode. Restauration de précision : ponçage fin grain par grain, restitu­tion du lustre satiné d'origine au vernis tampon. Un accent parfait entre un canapé et un fauteuil club.",
    startingPrice: 680,
    width: "55", depth: "55", height: "62",
    images: [
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80",
    ],
  },
  {
    name: "Table de ferme en merisier",
    category: "tables",
    material: "Merisier",
    description: "Table de ferme en merisier, provenance Périgord, début XIXe. Plateau massif aux bords arrondis par l'usage, pieds tournés en fuseau. Deux tiroirs en ceinture avec poignées en laiton patiné. Restauration respectueuse de l'authenticité : consolidation des tenons, huilage à l'huile de lin suivie d'un cirage à la cire teintée. Le merisier révèle sous la lumière des reflets ambrés et cuivrés.",
    startingPrice: 1450,
    width: "200", depth: "80", height: "76",
    images: [
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    ],
  },

  // ─── LES ASSISES (3) ──────────────────────────────────────
  {
    name: "Fauteuil Voltaire restauré",
    category: "assises",
    material: "Hêtre",
    description: "Fauteuil Voltaire Napoléon III en hêtre massif, circa 1870. Structure entièrement révisée dans notre atelier : ressorts remplacés, sangles neuves, garnissage traditionnel en crin végétal et mousse haute densité. Retapissé en lin lavé couleur naturel, finition cloutée en laiton vieilli. Dossier haut et accoudoirs confortables, idéal pour un coin lecture. Le bois apparent des pieds a été teinté noyer et vernis satiné.",
    startingPrice: 780,
    width: "72", depth: "80", height: "105",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    ],
  },
  {
    name: "Paire de chaises bistrot Thonet",
    category: "assises",
    material: "Hêtre",
    description: "Paire de chaises bistrot Thonet n°14, modèle iconique du bois courbé. Ces chaises, produites au début du XXe siècle, incarnent l'élégance fonctionnelle viennoise. Elles ont été soigneusement décapées pour retrouver le hêtre naturel, puis protégées par un vernis mat invisible. Assises cannées refaites à neuf par un artisan canneur. Légères, empilables et intemporelles.",
    startingPrice: 420,
    width: "42", depth: "50", height: "90",
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
    ],
  },
  {
    name: "Banquette de ferme en pin",
    category: "assises",
    material: "Pin",
    description: "Banquette rustique en pin massif, provenance Savoie, début XXe siècle. Assise large et dossier droit, conçue pour accueillir trois personnes autour d'une table de ferme. Le pin clair a été brossé puis ciré pour conserver son aspect brut et chaleureux. Les assemblages traditionnels à tenons et mortaises garantissent une solidité à toute épreuve. Parfaite pour une cuisine de campagne ou une entrée de maison.",
    startingPrice: 350,
    width: "150", depth: "45", height: "85",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    ],
  },

  // ─── LES MIROIRS (3) ──────────────────────────────────────
  {
    name: "Miroir doré ovale Napoléon III",
    category: "miroirs",
    material: "Dorure",
    description: "Somptueux miroir ovale Napoléon III, circa 1860. Cadre en bois sculpté et doré à la feuille d'or, orné de feuilles d'acanthe et de perles. La glace au mercure d'origine présente les charmantes imperfections qui attestent de son ancienneté. Restauration de la dorure par notre doreur : comblement des lacunes au gesso, redorure partielle à la détrempe, patine vieillie pour s'harmoniser avec les parties anciennes.",
    startingPrice: 1200,
    width: "75", depth: "8", height: "110",
    images: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80",
    ],
  },
  {
    name: "Miroir barbier Art Déco triptyque",
    category: "miroirs",
    material: "Laiton",
    description: "Miroir de barbier triptyque des années 1920, structure en laiton poli. Les trois volets articulés permettent de s'observer sous différents angles. Ce modèle provient d'un salon de coiffure parisien. Le laiton a été soigneusement nettoyé et réhabilité sans excès pour conserver sa patine dorée naturelle. Les miroirs biseautés d'origine sont intacts. Un objet aussi fonctionnel que décoratif.",
    startingPrice: 380,
    width: "65", depth: "3", height: "45",
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    ],
  },
  {
    name: "Grand miroir trumeau Louis XVI",
    category: "miroirs",
    material: "Stuc",
    description: "Grand miroir trumeau d'inspiration Louis XVI, début XIXe. Cadre en bois et stuc moulé, décor de guirlandes de laurier et nœuds de ruban. Peinture d'origine gris-bleu patiné. Le fronton présente une scène pastorale peinte à l'huile. Glace rectangulaire remplacée par une glace neuve pour une réflexion parfaite. Ce miroir en impose par ses dimensions et sa prestance — il transforme instantanément un salon ou une entrée.",
    startingPrice: 1650,
    width: "90", depth: "6", height: "180",
    images: [
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80",
    ],
  },

  // ─── L'ÉCLAIRAGE (3) ──────────────────────────────────────
  {
    name: "Lampe de bureau Jielde vintage",
    category: "eclairage",
    material: "Métal",
    description: "Lampe articulée Jielde à 2 bras, modèle industriel français emblématique, années 1950. Conçue par Jean-Louis Domecq pour les ateliers mécaniques, cette pièce allie robustesse et esthétique industrielle. Entièrement démontée, sablée et repeinte en graphite mat dans notre atelier. Câblage électrique refait aux normes CE. Rotule à friction permettant un positionnement dans toutes les directions. Pied lesté en fonte.",
    startingPrice: 320,
    width: "20", depth: "20", height: "60",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
    ],
  },
  {
    name: "Lustre à pampilles en cristal",
    category: "eclairage",
    material: "Verre",
    description: "Lustre à pampilles en verre taillé et structure en laiton doré, style Maria-Theresa, milieu XXe siècle. Huit bras de lumière ornés de bobèches ciselées et de pendentifs en goutte et amande. Chaque pampille a été nettoyée individuellement dans un bain d'acide doux pour retrouver son éclat originel. Recâblé pour accueillir des ampoules LED à filament. Livré avec rosace de plafond assortie.",
    startingPrice: 950,
    width: "60", depth: "60", height: "70",
    images: [
      "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=800&q=80",
    ],
  },
  {
    name: "Applique murale Art Nouveau en laiton",
    category: "eclairage",
    material: "Laiton",
    description: "Paire d'appliques murales Art Nouveau, circa 1900. Bras en laiton coulé et ciselé à motifs de tiges et de feuilles de nénuphar. Tulipes en verre opalin blanc légèrement rosé, intactes. Le laiton a été nettoyé sans excès afin de préserver la patine centenaire du métal. Recâblées aux normes actuelles. Ces appliques apportent une lumière douce et tamisée, idéale pour un couloir, une chambre ou un salon intimiste.",
    startingPrice: 520,
    width: "18", depth: "25", height: "35",
    images: [
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80",
    ],
  },

  // ─── LES OBJETS / DÉCO (3) ────────────────────────────────
  {
    name: "Globe terrestre vintage sur pied",
    category: "deco",
    material: "Bois",
    description: "Globe terrestre d'étude sur pied en bois tourné, années 1960. Cartographie rétro aux teintes sépia et océans bleu pastel, avec les anciennes dénominations de pays (Rhodésie, Yougoslavie, Birmanie…). Le pied en noyer tourné a été recirculé. Méridien en laiton patiné. Un objet de curiosité autant qu'un outil pédagogique, parfait pour un bureau, une bibliothèque ou un coin salon cultivé.",
    startingPrice: 180,
    width: "30", depth: "30", height: "45",
    images: [
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    ],
  },
  {
    name: "Plateau de service en faïence de Gien",
    category: "deco",
    material: "Céramique",
    description: "Grand plateau de service ovale en faïence fine de Gien, décor « Renaissance Italienne », circa 1920. Les arabesques polychromes aux tons bleu, jaune safran et rouge brique sont peintes à la main. Aucun éclat ni fissure. Ce plateau peut servir de centre de table décoratif, de vide-poche mural ou bien sûr de plateau de service pour impressionner vos convives. Signé au dos du cachet de la manufacture.",
    startingPrice: 240,
    width: "55", depth: "38", height: "4",
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80",
    ],
  },
  {
    name: "Carafe Art Déco en verre soufflé",
    category: "deco",
    material: "Verre soufflé",
    description: "Carafe Art Déco en verre soufflé-moulé et son bouchon géométrique, provenance verrerie de Biot, années 1930. Le verre épais et transparent laisse apparaître de fines bulles d'air caractéristiques du soufflage artisanal. Décor de bandes concentriques gravées à l'acide. Contenance 1 litre. Elle peut servir aussi bien sur une table dressée que comme vase pour quelques branches de coton séché ou de gypsophile.",
    startingPrice: 120,
    width: "12", depth: "12", height: "30",
    images: [
      "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=800&q=80",
    ],
  },
];


async function seed() {
  console.log(`\n🌱 Démarrage du seed — ${CATALOGUE.length} publications\n`);

  for (const item of CATALOGUE) {
    const docData = {
      name: item.name,
      category: item.category,
      material: item.material,
      description: item.description,
      startingPrice: item.startingPrice,
      currentPrice: item.startingPrice,
      width: item.width,
      depth: item.depth,
      height: item.height,
      images: item.images,
      imageUrl: item.images[0],
      thumbnails: [],
      thumbnailUrl: "",
      stock: 1,
      sold: false,
      soldAt: null,
      status: "published",
      priceOnRequest: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await db.collection(COLLECTION_PATH).add(docData);
    console.log(`  ✅  [${item.category.toUpperCase().padEnd(10)}]  ${item.name}  →  ${ref.id}`);
  }

  console.log(`\n🎉 Seed terminé ! ${CATALOGUE.length} publications créées dans Firestore (Sandbox).\n`);
}

seed().catch(console.error);
