import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, Upload, Trash2, Download } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { getStorageInstance } from '../config/firebaseStorage';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PRODUCT_IMAGE_VARIANT_SPECS, compressImage, createProductImageVariantFiles, getImageFileMetadata } from '../../utils/imageUtils'; // [NEW] Import compression utility
import ImageCropperModal from './components/ImageCropperModal';
import MetaConnectionBadge from './components/MetaConnectionBadge';
import PublicationActionBar from './components/PublicationActionBar';
import PublicationProgressDialog from './components/PublicationProgressDialog';
import PublicationReviewStep from './components/PublicationReviewStep';
import StoryEditor from './components/StoryEditor';
import useMetaConnection from './components/useMetaConnection';
import KIT_CONFIG from '../config/constants';
import { clearAdminPublicCatalogCache } from './adminPublicCatalog';
import { describeChannels } from './components/publicationContent';
import { getFirebaseAuth } from '../config/firebaseLazy';
import {
  adjustInventoryAdmin,
  createProductCommandSession,
  createPublishedProductAdmin,
  preflightProductMutationAdmin,
  updateProductOfferAdmin
} from '../commerce/adminProductCommandClient';
import {
  getSocialPublicationStatusAdmin,
  prepareSocialPublicationAdmin,
  runSocialPublicationAdmin
} from './metaPublicationClient';
import {
  clearPendingProductPublication,
  getPendingPublicationDescriptor,
  waitForPublicCatalogProduct
} from './productPublicationClient';

const WOOD_TYPES = [
  "Acacia", "Acajou", "Bambou", "Bouleau", "Châtaignier",
  "Chêne", "Ébène", "Épicéa", "Érable", "Frêne", "Hêtre",
  "Iroko", "Manguier", "Mélèze", "Merisier", "Noyer",
  "Olivier", "Orme", "Palissandre", "Pin", "Peuplier",
  "Rotin", "Sapin", "Teck", "Wengé", "Autre"
];

const MATERIAL_OPTIONS_FRAME = [
  "Chêne", "Noyer", "Hêtre", "Pin", "Bouleau", "Frêne",
  "Métal", "Laiton", "Fer forgé", "Dorure", "Stuc",
  "Rotin", "Bambou", "Résine", "Autre"
];

const MATERIAL_OPTIONS_EXTENDED = [
  "Laiton", "Fer forgé", "Métal", "Acier", "Cuivre",
  "Verre soufflé", "Verre", "Tissu", "Lin", "Velours",
  "Céramique", "Porcelaine", "Rotin", "Osier", "Bambou",
  "Marbre", "Ardoise", "Résine", "Bois peint", "Bois", "Autre"
];

const STYLE_OPTIONS = [
  "Industriel", "Scandinave", "Art Déco", "Vintage", "Bohème",
  "Campagne", "Contemporain", "Classique", "Mid-Century", "Rustique",
  "Baroque", "Minimaliste", "Ethnique", "Shabby Chic", "Autre"
];

const MAX_PRODUCT_IMAGES = 23;

const isStorageAuthorizationError = (error) => (
  error?.code === 'storage/unauthorized'
  || String(error?.message || '').includes('storage/unauthorized')
);

const runWithConcurrency = async (items, limit, worker) => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
};

const refreshAdminAuthorizationToken = async () => {
  const auth = await getFirebaseAuth();
  if (typeof auth.authStateReady === 'function') await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw Object.assign(
      new Error('Session administrateur absente.'),
      { code: 'auth/admin-session-missing' }
    );
  }
  await user.getIdToken(true);
};

const COLOR_BANK = [
  { name: 'Naturel / Brut', hex: '#DEB887' },
  { name: 'Noir Corbeau', hex: '#1a1a1a' },
  { name: 'Anthracite', hex: '#3b3b3b' },
  { name: 'Gris Perle', hex: '#cecece' },
  { name: 'Blanc Cassé', hex: '#f2f0e6' },
  { name: 'Ivoire', hex: '#fffff0' },
  { name: 'Beige', hex: '#e8dbcb' },
  { name: 'Rouge Antique', hex: '#8b0b0b' },
  { name: 'Bordeaux', hex: '#5c0808' },
  { name: 'Terre Cuite', hex: '#b35d44' },
  { name: 'Cuivré', hex: '#bd6a3a' },
  { name: 'Laiton', hex: '#cca745' },
  { name: 'Doré', hex: '#d4af37' },
  { name: 'Bronze', hex: '#805d2c' },
  { name: 'Vert Émeraude', hex: '#23593b' },
  { name: 'Vert Sapin', hex: '#163824' },
  { name: 'Vert Sauge', hex: '#778a63' },
  { name: 'Bleu Marine', hex: '#111e3b' },
  { name: 'Bleu Nuit', hex: '#0a0f1c' },
  { name: 'Bleu Canard', hex: '#12545c' },
  { name: 'Bleu Céladon', hex: '#8ca7a6' },
  { name: 'Rose Poudré', hex: '#e3c4c4' },
  { name: 'Moutarde', hex: '#d9a021' },
];

const getCategoryMeta = (categoryId) => {
  switch (categoryId) {
    case 'armoires':
      return { namePlaceholder: "Armoire normande...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
    case 'buffets':
      return { namePlaceholder: "Buffet de campagne...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
    case 'commodes':
      return { namePlaceholder: "Commode Louis XV...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
    case 'tables':
      return { namePlaceholder: "Table de monastère...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
    case 'chaises':
      return { namePlaceholder: "Chaise bistrot...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H assise" };
    case 'fauteuils':
      return { namePlaceholder: "Fauteuil Voltaire...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H assise" };
    case 'bancs':
      return { namePlaceholder: "Banc de ferme...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H assise" };
    case 'miroirs':
      return { namePlaceholder: "Miroir doré ovale...", materialLabel: "Matière du cadre", materialOptions: MATERIAL_OPTIONS_FRAME, showDepth: false, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
    case 'eclairage':
      return { namePlaceholder: "Lampe de bureau 1950...", materialLabel: "Matière principale", materialOptions: MATERIAL_OPTIONS_EXTENDED, showDepth: false, widthLabel: "Ø", depthLabel: "P", heightLabel: "H" };
    case 'deco':
      return { namePlaceholder: "Plateau de service...", materialLabel: "Matière", materialOptions: MATERIAL_OPTIONS_EXTENDED, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
    default:
      return { namePlaceholder: "Nom de l'ouvrage...", materialLabel: "Essence de bois", materialOptions: WOOD_TYPES, showDepth: true, widthLabel: "L", depthLabel: "P", heightLabel: "H" };
  }
};

const PUBLICATION_STEPS = [
  { id: 'compose', label: 'Composition', hint: 'Les informations de l’ouvrage' },
  { id: 'review', label: 'Diffusion', hint: 'Où et comment publier' }
];

/**
 * Rail d'etapes : la position dans le parcours doit se lire d'un coup d'oeil,
 * et le retour en arriere reste possible a tout instant.
 */
const PublicationStepRail = ({ step, onSelect, darkMode, disabled }) => {
  const activeIndex = PUBLICATION_STEPS.findIndex((entry) => entry.id === step);

  return (
    <ol className="flex items-center gap-2" aria-label="Étapes de publication">
      {PUBLICATION_STEPS.map((entry, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <li key={entry.id} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className={`h-px w-5 rounded-full transition-colors duration-500 sm:w-8 ${isDone || isActive ? 'bg-emerald-500' : (darkMode ? 'bg-white/12' : 'bg-stone-950/10')}`} />
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(entry.id)}
              aria-current={isActive ? 'step' : undefined}
              title={entry.hint}
              className={`group flex min-h-9 items-center gap-2 rounded-full pl-1.5 pr-3 text-[10px] font-extrabold transition-[background-color,color,transform] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:cursor-not-allowed ${
                isActive
                  ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white')
                  : (darkMode ? 'text-stone-500 hover:bg-white/[0.06] hover:text-stone-200' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900')
              }`}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] tabular-nums transition-colors duration-400 ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? (darkMode ? 'bg-stone-950 text-white' : 'bg-white/15 text-white')
                    : (darkMode ? 'bg-white/[0.07] text-stone-500' : 'bg-stone-950/[0.06] text-stone-400')
              }`}>
                {isDone ? <Check size={11} strokeWidth={3} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{entry.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

const AdminForm = ({
  editData,
  onCancelEdit,
  onSaved,
  onPublicationBusyChange,
  collectionName = 'furniture',
  darkMode = false,
  mutationsBlocked = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startingPrice: 0,
    material: '',
    color: '',
    dimensions: '',
    width: '',
    depth: '',
    height: '',
    category: '', // Catégorie — source : KIT_CONFIG.productCategories
    style: '', // Style (Vintage, Industriel, etc.)
    stock: 1,
    priceOnRequest: false
  });

  // Unified state for images
  const [galleryItems, setGalleryItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [preparingImages, setPreparingImages] = useState(false);
  const [msg, setMsg] = useState("");
  const [categoryError, setCategoryError] = useState(false);
  const [step, setStep] = useState('compose');
  const [progress, setProgress] = useState(0);
  const [publicationPhase, setPublicationPhase] = useState('authorization');
  const [instagramHashtags, setInstagramHashtags] = useState('#secondevie #mobilierancien #artisanat');
  const [metaConnection, setMetaConnection] = useState({ status: 'loading', connected: false });
  const [socialTargets, setSocialTargets] = useState({ instagram: false, facebook: false });
  const [socialPublication, setSocialPublication] = useState(null);
  const fileInputRef = useRef();
  const categoryGroupRef = useRef(null);
  const nameInputRef = useRef(null);
  const startingPriceInputRef = useRef(null);
  const stockInputRef = useRef(null);
  const widthInputRef = useRef(null);
  const depthInputRef = useRef(null);
  const heightInputRef = useRef(null);
  const productCommandSessionRef = useRef(null);
  const publishedProductRef = useRef(null);
  const imagePreparationJobsRef = useRef(0);

  // New state for drag reordering
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // New state for custom material input
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);

  // New state for color picker dropdown
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // [NEW] Metrics
  const totalOriginalSize = galleryItems.reduce((acc, item) => acc + (item.originalSize || (item.file ? item.file.size : 0)), 0);
  // Derived state for compressed size (dynamic)
  const totalCompressedSize = galleryItems.reduce((acc, item) => acc + (item.file ? item.file.size : 0), 0);

  // [NEW] Cropper State
  const [cropperConfig, setCropperConfig] = useState({ isOpen: false, image: null, itemId: null, aspect: 3 / 4 });

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Une destination n'est retenue que si le compte Meta la rend reellement possible.
  const metaConnected = Boolean(metaConnection.connected);
  const instagramTarget = Boolean(socialTargets.instagram) && metaConnected && metaConnection.instagramAvailable !== false;
  const facebookTarget = Boolean(socialTargets.facebook) && metaConnected;
  const socialEnabled = instagramTarget || facebookTarget;

  useEffect(() => {
    productCommandSessionRef.current = null;
    publishedProductRef.current = null;
    setStep('compose');
    setProgress(0);
    setInstagramHashtags('#secondevie #mobilierancien #artisanat');
    setSocialTargets({ instagram: false, facebook: false });
    setSocialPublication(null);
    if (editData) {
      const material = editData.material || '';
      const isCustom = material && !getCategoryMeta(editData.category || '').materialOptions.includes(material) && material !== "Autre";
      setIsCustomMaterial(isCustom);

      setFormData({
        name: editData.name || '',
        description: editData.description || '',
        startingPrice: editData.startingPrice || 0,
        stock: editData.stock !== undefined ? editData.stock : '', // [NEW] Load stock
        material: material,
        color: editData.color || '',
        dimensions: editData.dimensions || '',
        width: editData.width || '',
        depth: editData.depth || '',
        height: editData.height || '',
        category: editData.category || '', // Load existing category
        style: editData.style || '', // Load existing style
        priceOnRequest: editData.priceOnRequest || false
      });

      const initialImages = editData.images || (editData.imageUrl ? [editData.imageUrl] : []);
      const initialThumbnails = Array.isArray(editData.thumbnails) ? editData.thumbnails : [];
      const initialVariants = Array.isArray(editData.imageVariants) ? editData.imageVariants : [];
      const initialMetadata = Array.isArray(editData.imageMetadata) ? editData.imageMetadata : [];

      setGalleryItems(initialImages.slice(0, MAX_PRODUCT_IMAGES).map((url, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        file: null,
        preview: url,
        thumbnailUrl: initialThumbnails[idx] || (idx === 0 ? editData.thumbnailUrl : '') || '',
        variantUrls: initialVariants[idx] || null,
        metadata: initialMetadata[idx] || null,
        isExisting: true
      })));
    } else { resetForm(); }
  }, [editData]);

  useEffect(() => {
    onPublicationBusyChange?.(uploading);
    return () => onPublicationBusyChange?.(false);
  }, [onPublicationBusyChange, uploading]);

  useEffect(() => {
    if (!uploading) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [uploading]);

  // Prevent browser from opening files if dropped outside the target
  useEffect(() => {
    const preventBrowserDrop = (e) => e.preventDefault();
    window.addEventListener('dragover', preventBrowserDrop);
    window.addEventListener('drop', preventBrowserDrop);
    return () => {
      window.removeEventListener('dragover', preventBrowserDrop);
      window.removeEventListener('drop', preventBrowserDrop);
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startingPrice: 0,
      stock: 1,
      material: '',
      color: '',
      dimensions: '',
      width: '',
      depth: '',
      height: '',
      category: '',
      style: '',
      priceOnRequest: false
    });
    galleryItems.forEach(item => { if (item.preview && !item.isExisting) URL.revokeObjectURL(item.preview); });
    setGalleryItems([]);
    setIsCustomMaterial(false);
    setCategoryError(false);
    setStep('compose');
    setProgress(0);
    setInstagramHashtags('#secondevie #mobilierancien #artisanat');
    setSocialTargets({ instagram: false, facebook: false });
    setSocialPublication(null);
  };

  // Le compte Meta pilote ce qui reste selectionnable : on aligne les cibles dessus.
  const handleMetaConnectionChange = React.useCallback((connection) => {
    setMetaConnection(connection || { status: 'not_connected', connected: false });
    if (!connection?.connected) {
      setSocialTargets({ instagram: false, facebook: false });
      return;
    }
    if (connection.instagramAvailable === false) {
      setSocialTargets((current) => ({ ...current, instagram: false }));
    }
  }, []);

  // Le protocole Meta vit au niveau du formulaire : l'en-tete et l'ecran
  // de diffusion parlent ainsi de la meme connexion.
  const meta = useMetaConnection({ onConnectionChange: handleMetaConnectionChange });

  const processFiles = async (files) => {
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - galleryItems.length);
    const acceptedFiles = files.slice(0, availableSlots);
    const omittedCount = files.length - acceptedFiles.length;
    if (acceptedFiles.length === 0) {
      setMsg(`La galerie est limitée à ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
    imagePreparationJobsRef.current += 1;
    setPreparingImages(true);
    setMsg(omittedCount > 0
      ? `${acceptedFiles.length} image(s) ajoutée(s) · limite de ${MAX_PRODUCT_IMAGES} atteinte.`
      : "Optimisation automatique...");

    const newItems = acceptedFiles.map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      file: file,
      preview: URL.createObjectURL(file),
      originalSize: file.size, // Store original size for metrics
      isExisting: false,
      isCompressed: false
    }));

    // Add unoptimized items first for immediate feedback
    setGalleryItems(prev => [...prev, ...newItems]);

    // Process optimization in background
    try {
      const optimizedItems = await Promise.all(newItems.map(async (item) => {
        try {
          const compressed = await compressImage(item.file, 0.85, 1920);
          const metadata = await getImageFileMetadata(compressed);
          return {
            ...item,
            file: compressed,
            metadata,
            isCompressed: true
          };
        } catch (error) {
          console.error("Auto-compression failed for", item.file.name, error);
          return item;
        }
      }));

      // Update state with optimized versions
      setGalleryItems(prev => prev.map(current => {
        const optimized = optimizedItems.find(opt => opt.id === current.id);
        return optimized || current;
      }));

      setMsg(omittedCount > 0
        ? `Galerie complète · ${MAX_PRODUCT_IMAGES} images maximum.`
        : "Images ajoutées et optimisées.");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      imagePreparationJobsRef.current = Math.max(0, imagePreparationJobsRef.current - 1);
      setPreparingImages(imagePreparationJobsRef.current > 0);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) processFiles(files);
    e.target.value = '';
  };

  const handleClearImages = () => {
    galleryItems.forEach((item) => {
      if (item.preview && !item.isExisting) URL.revokeObjectURL(item.preview);
    });
    setGalleryItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMsg('Toutes les images ont été retirées.');
  };

  const handleDownloadImages = (e) => {
    e.preventDefault();
    let count = 0;
    galleryItems.forEach((item) => {
      if (item.file && item.isCompressed) {
        setTimeout(() => {
          const url = URL.createObjectURL(item.file);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }, count * 500); // 500ms delay between each
        count++;
      }
    });
    setMsg(`Téléchargement de ${count} images lancé.`);
  };

  const sanitizeStorageName = (name) => {
    return String(name || 'image.webp')
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'image.webp';
  };

  const uploadProductVariantSet = async (sourceFile, progressPrefix, slotIndex, onVariantUploaded) => {
    setMsg(`${progressPrefix} Création des formats responsive...`);
    const variantFiles = await createProductImageVariantFiles(sourceFile);
    const uploadStamp = Date.now();
    const uploaded = {};
    const storage = await getStorageInstance();

    await runWithConcurrency(PRODUCT_IMAGE_VARIANT_SPECS, 4, async (spec) => {
      const variantFile = variantFiles[spec.key];
      if (!variantFile) return;

      setMsg(`${progressPrefix} Envoi sécurisé des formats...`);
      const safeName = sanitizeStorageName(variantFile.name);
      const imageRef = ref(storage, `${collectionName}/${spec.folder}/${uploadStamp}_${slotIndex}_${spec.key}_${safeName}`);
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          await uploadBytes(imageRef, variantFile, {
            cacheControl: 'public, max-age=31536000, immutable',
            contentType: variantFile.type || 'image/webp'
          });
          uploaded[spec.key] = await getDownloadURL(imageRef);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (isStorageAuthorizationError(error) || attempt === 2) throw error;
        }
      }
      if (lastError) throw lastError;
      onVariantUploaded?.();
    });

    return uploaded;
  };

  /** Verifie ce qui bloquerait la publication avant d'ouvrir l'ecran de diffusion. */
  const validateComposition = () => {
    if (preparingImages) {
      setMsg('Attends la fin de la préparation des photos avant de continuer.');
      return false;
    }
    if (!formData.category) {
      setCategoryError(true);
      setMsg('Choisis un type de publication pour continuer.');
      categoryGroupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      categoryGroupRef.current?.querySelector('button')?.focus({ preventScroll: true });
      return false;
    }
    setCategoryError(false);
    if (!String(formData.name || '').trim()) {
      setMsg('Donne un nom à l’ouvrage pour continuer.');
      nameInputRef.current?.focus();
      return false;
    }
    const parsedStock = Number(formData.stock === '' ? 0 : formData.stock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setMsg('Le stock doit être un nombre entier positif ou nul.');
      stockInputRef.current?.focus();
      return false;
    }
    if (!editData && parsedStock < 1) {
      setMsg('Indique un stock d’au moins 1 pour publier un nouveau meuble.');
      stockInputRef.current?.focus();
      return false;
    }
    if (!formData.priceOnRequest && Number(formData.startingPrice) <= 0) {
      setMsg('Indique un prix supérieur à zéro ou choisis « Sur demande ».');
      startingPriceInputRef.current?.focus();
      return false;
    }
    if (galleryItems.length > MAX_PRODUCT_IMAGES) {
      setMsg(`La galerie est limitée à ${MAX_PRODUCT_IMAGES} images.`);
      return false;
    }
    if (!editData && galleryItems.length === 0) {
      setMsg('Ajoute au moins une photo pour publier l’ouvrage.');
      fileInputRef.current?.focus();
      return false;
    }
    setMsg('');
    return true;
  };

  const goToReview = () => {
    if (!validateComposition()) return;
    setStep('review');
  };

  const addMeuble = async () => {
    if (mutationsBlocked) {
      setMsg('Actualise le back-office avant de reprendre cette publication.');
      return;
    }
    if (socialPublication && socialPublication.overallStatus !== 'published') {
      setUploading(true);
      setProgress(0.9);
      setMsg('Reprise de la publication Meta…');
      try {
        await refreshAdminAuthorizationToken();
        const failedDestinations = ['instagram', 'facebook'].filter((destination) => (
          socialPublication.destinations?.[destination]?.requested
          && socialPublication.destinations?.[destination]?.status !== 'published'
        ));
        const result = await runSocialPublicationAdmin(
          socialPublication.publicationId,
          failedDestinations
        );
        setSocialPublication(result);
        if (result.overallStatus !== 'published') {
          setMsg('Le site est publié, mais une destination Meta doit encore être relancée.');
          return;
        }
        setPublicationPhase('complete');
        setProgress(1);
        setMsg('Le meuble est publié sur le site et les réseaux sélectionnés.');
        await new Promise((resolve) => setTimeout(resolve, 450));
        const savedProduct = publishedProductRef.current;
        productCommandSessionRef.current = null;
        publishedProductRef.current = null;
        resetForm();
        if (onCancelEdit) onCancelEdit();
        if (onSaved) onSaved({ productId: savedProduct?.id, name: savedProduct?.name });
      } catch (retryError) {
        try {
          const current = await getSocialPublicationStatusAdmin(socialPublication.publicationId);
          setSocialPublication(current);
        } catch {
          // The stable local publication id is retained for the next retry.
        }
        setMsg(`Publication Meta à reprendre : ${retryError?.message || 'Meta ne répond pas.'}`);
      } finally {
        setUploading(false);
      }
      return;
    }
    // Le parcours passe deja par cette validation, on la rejoue par securite.
    if (!validateComposition()) {
      setStep('compose');
      return;
    }
    setUploading(true);
    setProgress(0.04);
    setPublicationPhase('authorization');
    setMsg('Vérification de la session administrateur…');

    try {
      const session = productCommandSessionRef.current || createProductCommandSession(editData?.id);
      productCommandSessionRef.current = session;
      let commandProduct = !editData ? publishedProductRef.current : null;

      if (!commandProduct) {
        await refreshAdminAuthorizationToken();
        await preflightProductMutationAdmin();
        setProgress(0.1);
        setPublicationPhase('photos');
        setMsg('Préparation et envoi sécurisé des photos…');

        const finalImageUrls = [];
        const finalThumbnails = [];
        const finalImageVariants = [];
        const finalImageMetadata = [];
        const uploadTotal = Math.max(1, galleryItems.filter((item) => !item.isExisting && item.file).length * PRODUCT_IMAGE_VARIANT_SPECS.length);
        let uploadedCount = 0;
        const onVariantUploaded = () => {
          uploadedCount += 1;
          setProgress(0.1 + (uploadedCount / uploadTotal) * 0.54);
        };

        for (let index = 0; index < galleryItems.length; index += 1) {
          const item = galleryItems[index];
          const progressPrefix = `[${index + 1}/${galleryItems.length}]`;
          if (item.isExisting) {
            finalImageUrls.push(item.preview);
            finalThumbnails.push(item.thumbnailUrl || item.variantUrls?.thumb384 || item.variantUrls?.thumb || item.preview);
            finalImageVariants.push(item.variantUrls || {});
            finalImageMetadata.push(item.metadata || {});
            continue;
          }
          if (!item.file) continue;

          const uploadedVariants = await uploadProductVariantSet(item.file, progressPrefix, index, onVariantUploaded);
          let imageMetadata = item.metadata || null;

          if (!imageMetadata) imageMetadata = await getImageFileMetadata(item.file);
          const fullUrl = uploadedVariants.full || uploadedVariants.large || uploadedVariants.medium || uploadedVariants.card || uploadedVariants.thumb || '';
          const thumbUrl = uploadedVariants.thumb384 || uploadedVariants.thumb || uploadedVariants.card || fullUrl;
          finalImageUrls.push(fullUrl);
          finalThumbnails.push(thumbUrl);
          finalImageVariants.push(uploadedVariants);
          finalImageMetadata.push(imageMetadata || {});
        }

        const parsedStock = Number(formData.stock === '' ? 0 : formData.stock);
        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
          throw new Error('Le stock doit être un nombre entier positif ou nul.');
        }
        const editorial = {
          name: formData.name,
          description: formData.description,
          seoTitle: '',
          seoDescription: '',
          seoIndexable: String(formData.name || '').trim().length >= 4
            && String(formData.description || '').trim().length >= 48
            && finalImageUrls.length > 0,
          material: formData.material,
          color: formData.color,
          dimensions: formData.dimensions,
          width: formData.width,
          depth: formData.depth,
          height: formData.height,
          category: formData.category,
          style: formData.style
        };
        const media = {
          images: finalImageUrls,
          thumbnails: finalThumbnails,
          imageVariants: finalImageVariants,
          imageMetadata: finalImageMetadata,
          imageUrl: finalImageUrls[0] || '',
          thumbnailUrl: finalThumbnails[0] || finalImageUrls[0] || ''
        };
        const offer = {
          currentPrice: Number(formData.startingPrice),
          startingPrice: Number(formData.startingPrice),
          priceOnRequest: formData.priceOnRequest || false
        };

        setPublicationPhase('record');
        setProgress(0.68);
        setMsg(editData ? 'Enregistrement des modifications…' : 'Enregistrement unique du meuble publié…');
        if (editData) {
          await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', collectionName, editData.id),
            { ...editorial, ...media }
          );
          commandProduct = {
            id: editData.id,
            commerceVersion: Number(editData.commerceVersion || 0),
            inventoryVersion: Number(editData.inventoryVersion || 0)
          };
          const offered = await updateProductOfferAdmin(commandProduct, collectionName, offer, session.offerCommandId);
          commandProduct = { ...commandProduct, ...offered };
          const stockDelta = parsedStock - Number(editData.stock || 0);
          if (stockDelta !== 0) {
            const adjusted = await adjustInventoryAdmin(
              commandProduct,
              collectionName,
              stockDelta,
              'Ajustement depuis le formulaire produit',
              session.inventoryCommandId
            );
            commandProduct = { ...commandProduct, ...adjusted };
          }
        } else {
          const created = await createPublishedProductAdmin({
            collectionName,
            productId: session.productId,
            editorial,
            media,
            offer,
            initialStock: parsedStock,
            commandId: session.createPublishedCommandId
          });
          commandProduct = {
            id: created.productId,
            name: formData.name,
            commerceVersion: created.commerceVersion,
            inventoryVersion: created.inventoryVersion
          };
          publishedProductRef.current = commandProduct;
        }

        const abandonedPublication = getPendingPublicationDescriptor();
        if (abandonedPublication) {
          void clearPendingProductPublication(abandonedPublication.sessionId).catch(() => {});
        }
      }

      clearAdminPublicCatalogCache();
      setPublicationPhase('catalog');
      setProgress(0.8);
      setMsg('Mise à jour et vérification de la galerie publique…');
      const publicProduct = await waitForPublicCatalogProduct(commandProduct.id);
      if (!publicProduct) {
        const catalogError = new Error('Le meuble est enregistré, mais la galerie publique n’a pas encore confirmé sa mise en ligne. Clique de nouveau sur Publier pour reprendre uniquement cette vérification.');
        catalogError.code = 'CATALOG_PUBLICATION_CONFIRMATION_TIMEOUT';
        throw catalogError;
      }
      setProgress(0.94);

      if (socialEnabled) {
        setPublicationPhase('social');
        setMsg('Meuble publié sur le site. Préparation de Meta…');
        const prepared = await prepareSocialPublicationAdmin({
          collectionName,
          productId: commandProduct.id,
          commandId: session.socialCommandId,
          targets: { instagram: instagramTarget, facebook: facebookTarget },
          hashtags: instagramHashtags
        });
        setSocialPublication(prepared);
        setMsg('Envoi vers les réseaux sélectionnés…');
        const socialResult = await runSocialPublicationAdmin(prepared.publicationId);
        setSocialPublication(socialResult);
        if (socialResult.overallStatus !== 'published') {
          setMsg('Le site est publié, mais une destination Meta doit encore être relancée.');
          return;
        }
      }

      setPublicationPhase('complete');
      setProgress(1);
      setMsg(socialEnabled
        ? 'Le meuble est publié sur le site et les réseaux sélectionnés.'
        : 'Le meuble est publié et confirmé dans la galerie.');
      await new Promise((resolve) => setTimeout(resolve, 450));
      const savedProduct = { productId: commandProduct.id, name: formData.name };
      productCommandSessionRef.current = null;
      publishedProductRef.current = null;
      resetForm();
      if (onCancelEdit) onCancelEdit();
      if (onSaved) onSaved(savedProduct);
    } catch (err) {
      console.error("CRITICAL UPLOAD ERROR:", err);
      const errorReason = err?.details?.reason || err?.customData?.details?.reason || '';
      const needsStrongAuth = errorReason === 'strong-auth-required';
      let errorPrefix = "Erreur";
      if (needsStrongAuth) {
        setMsg("Confirme ton identité avec Google ou ta passkey, puis clique de nouveau sur « Publier l’ouvrage ».");
        return;
      }
      if (isStorageAuthorizationError(err)) {
        setMsg("Envoi refusé malgré une session admin validée. Les règles d’envoi du site doivent être mises à jour.");
        return;
      }
      if (err.message?.includes("storage")) errorPrefix = "Envoi des images impossible";
      else if (err.code === "permission-denied") errorPrefix = "Session expirée";
      setMsg(`${errorPrefix}: ${err.message || "Inconnue"}`);
    } finally {
      setUploading(false);
    }
  };

  // Drag handlers
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file')) {
      dragCounter.current += 1;
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file')) {
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsDragging(false);
        dragCounter.current = 0;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true); // Failsafe against rapid movements
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/x-moz-file')) {
      setIsDragging(false);
      dragCounter.current = 0;
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (files.length > 0) processFiles(files);
    }
  };

  const onDragStartItem = (e, index) => {
    setDraggedItemIndex(index);
  };
  const onDragOverItem = (e) => {
    e.preventDefault();
  };
  const onDropItem = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
    reorderGallery(draggedItemIndex, dropIndex);
  };

  // Touch Support for Mobile
  const handleTouchStart = (index) => {
    setDraggedItemIndex(index);
  };

  const handleTouchEnd = (e) => {
    if (draggedItemIndex === null) return;

    // Find the element at the point where the touch ended
    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = targetEl?.closest('[data-index]');

    if (dropZone) {
      const targetIndex = parseInt(dropZone.getAttribute('data-index'));
      if (draggedItemIndex !== targetIndex) {
        reorderGallery(draggedItemIndex, targetIndex);
      }
    }
    setDraggedItemIndex(null);
  };

  const reorderGallery = (from, to) => {
    const newItems = [...galleryItems];
    const [draggedItem] = newItems.splice(from, 1);
    newItems.splice(to, 0, draggedItem);
    setGalleryItems(newItems);
    setDraggedItemIndex(null);
  };

  const handleOpenCropper = (item) => {
    setCropperConfig({
      isOpen: true,
      image: item.preview,
      itemId: item.id,
      aspect: 3 / 4 // Standard for products
    });
  };

  const handleCropComplete = async (croppedBlob) => {
    const itemId = cropperConfig.itemId;
    if (!itemId) return;
    const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.webp`, { type: 'image/webp' });
    const metadata = await getImageFileMetadata(croppedFile);

    const newItems = galleryItems.map(item => {
      if (item.id === itemId) {
        const newPreview = URL.createObjectURL(croppedBlob);
        // Revoke old blob if it was local
        if (item.preview && !item.isExisting) URL.revokeObjectURL(item.preview);

        return {
          ...item,
          file: croppedFile,
          preview: newPreview,
          metadata,
          thumbnailUrl: '',
          variantUrls: null,
          isExisting: false,
          isCompressed: true, // It's already optimized by cropper quality
          originalSize: croppedBlob.size
        };
      }
      return item;
    });

    setGalleryItems(newItems);
    setCropperConfig(prev => ({ ...prev, isOpen: false, image: null }));
  };

  const handleEnterFocus = (e, nextRef) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (nextRef?.current && !nextRef.current.disabled) {
      nextRef.current.focus();
      nextRef.current.select?.();
    }
  };

  const catMeta = getCategoryMeta(formData.category);

  const filteredColors = COLOR_BANK.filter(c => c.name.toLowerCase().includes((formData.color || '').toLowerCase()));
  const selectedColorObj = COLOR_BANK.find(c => c.name.toLowerCase() === (formData.color || '').toLowerCase());

  const fieldClass = `w-full rounded-[14px] border-none px-3.5 py-3 text-[13px] font-bold outline-none ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:ring-2 ${darkMode ? 'bg-stone-950 text-white ring-white/10 placeholder:text-stone-700 focus:ring-white/25' : 'bg-[#F7F6F3] text-stone-950 ring-black/[0.045] placeholder:text-stone-400 focus:bg-white focus:ring-stone-300'}`;
  const labelClass = `mb-1.5 block text-[9px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`;
  const categoryLabel = KIT_CONFIG.productCategories.find(category => category.id === formData.category)?.label || 'Non choisie';
  const messageIsError = msg.startsWith('Erreur')
    || msg.startsWith('Publication impossible')
    || msg.startsWith('Nom requis')
    || msg.startsWith('Choisis un type')
    || msg.startsWith('Donne un nom')
    || msg.startsWith('Le stock doit')
    || msg.startsWith('La galerie est limitée')
    || msg.startsWith('Session expirée')
    || msg.startsWith('Confirme ton identité')
    || msg.startsWith('Autorisation d’envoi')
    || msg.startsWith('Publication Meta à reprendre')
    || msg.startsWith('Envoi des images impossible');
  const messageTone = messageIsError
    ? 'error'
    : (msg.startsWith('Enregistré') || msg.includes('optimisées') || msg.startsWith('Le meuble est publié'))
      ? 'success'
      : 'neutral';
  const isReview = step === 'review';
  const publishLabel = uploading
    ? 'Publication…'
    : socialPublication && socialPublication.overallStatus !== 'published'
      ? 'Réessayer les réseaux'
      : editData
        ? 'Enregistrer les modifications'
        : instagramTarget && facebookTarget
          ? 'Publier sur 3 destinations'
          : socialEnabled
            ? `Publier sur le site + ${instagramTarget ? 'Instagram' : 'Facebook'}`
            : 'Publier sur le site';

  return (
    <div className="pub-surface flex min-h-0 w-full flex-col xl:h-full">
      <div className={`relative min-h-0 flex-1 overflow-hidden rounded-[26px] border ${darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'}`}>
        <PublicationProgressDialog
          darkMode={darkMode}
          includeSocial={socialEnabled}
          open={uploading}
          phase={publicationPhase}
          progress={progress}
          message={msg}
        />
        <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5 xl:px-6 xl:py-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-extrabold tracking-[-0.025em]">{editData ? 'Modifier la publication' : 'Nouvelle publication'}</h3>
              <p className={`mt-0.5 text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {isReview
                  ? `Vérifiez le rendu, puis choisissez la portée — actuellement ${describeChannels({ instagram: instagramTarget, facebook: facebookTarget })}.`
                  : 'Les informations essentielles, dans l’ordre naturel de saisie.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <MetaConnectionBadge darkMode={darkMode} meta={meta} disabled={uploading} />
              <PublicationStepRail
                step={step}
                darkMode={darkMode}
                disabled={uploading}
                onSelect={(nextStep) => {
                  if (nextStep === step) return;
                  if (nextStep === 'review') goToReview();
                  else setStep('compose');
                }}
              />
            </div>
          </div>

          <div className="relative mt-3.5 min-h-0 flex-1">
            <div
              className="pub-pane min-h-0 xl:flex xl:h-full xl:flex-col xl:overflow-y-auto xl:pr-1"
              data-state={isReview ? 'idle' : 'active'}
              data-side="before"
              aria-hidden={isReview}
              inert={isReview}
            >
          <div ref={categoryGroupRef} role="group" aria-labelledby="publication-category-label" aria-describedby={categoryError ? 'publication-category-error' : undefined}>
            <div className="flex items-center justify-between gap-3">
              <p id="publication-category-label" className={labelClass}>Type de publication</p>
              <span className={`mb-1.5 text-[8px] font-bold ${categoryError ? 'text-red-500' : (darkMode ? 'text-stone-600' : 'text-stone-400')}`}>Obligatoire</span>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 no-scrollbar 2xl:flex-wrap 2xl:overflow-visible">
              {KIT_CONFIG.productCategories.map(cat => {
                const active = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFormData({ ...formData, category: cat.id });
                      setCategoryError(false);
                      if (msg.startsWith('Publication impossible')) setMsg('');
                    }}
                    className={`shrink-0 rounded-full px-3.5 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ring-1 transition-colors duration-200 active:scale-[0.98] ${active ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : categoryError ? 'bg-red-500/5 text-red-600 ring-red-500/30 hover:bg-red-500/10' : (darkMode ? 'text-stone-500 ring-white/10 hover:text-white' : 'text-stone-500 ring-black/[0.07] hover:bg-stone-50 hover:text-stone-950')}`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
            {categoryError && (
              <p id="publication-category-error" role="alert" className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-red-600">
                <AlertCircle size={13} aria-hidden="true" />
                Choisis une catégorie avant de publier l’ouvrage.
              </p>
            )}
          </div>

          <div className="mt-4 grid min-h-0 grid-flow-dense grid-cols-1 gap-5 lg:grid-cols-12 xl:min-h-0 xl:flex-1 xl:auto-rows-fr xl:items-stretch xl:gap-6">
            <div className="flex min-h-0 flex-col lg:col-span-4 xl:h-full 2xl:col-span-3">
              <div className="flex items-center justify-between">
                <span className={labelClass}>Photos</span>
                <div className="mb-1.5 flex items-center gap-1">
                  {galleryItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearImages}
                      title="Retirer toutes les images"
                      aria-label="Retirer toutes les images importées"
                      className={`grid h-5 w-5 place-items-center rounded-full transition-colors ${darkMode ? 'text-stone-600 hover:bg-red-500/15 hover:text-red-400' : 'text-stone-300 hover:bg-red-50 hover:text-red-500'}`}
                    >
                      <Trash2 size={11} strokeWidth={1.8} />
                    </button>
                  )}
                  <span className={`text-[8px] font-bold tabular-nums ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{galleryItems.length}/{MAX_PRODUCT_IMAGES}</span>
                </div>
              </div>
              <div
                className={`grid min-h-[250px] flex-1 grid-cols-3 content-start gap-2.5 rounded-[18px] p-3 ring-1 transition-colors duration-200 lg:min-h-[330px] xl:min-h-[220px] ${isDragging ? 'bg-emerald-500/5 ring-emerald-500/50' : (darkMode ? 'bg-black/20 ring-white/10' : 'bg-[#F8F7F4] ring-black/[0.045]')}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {galleryItems.slice(0, MAX_PRODUCT_IMAGES).map((item, idx) => (
                  <div key={item.id} draggable onDragStart={(event) => onDragStartItem(event, idx)} onDragOver={onDragOverItem} onDrop={(event) => onDropItem(event, idx)} onTouchStart={() => handleTouchStart(idx)} onTouchEnd={handleTouchEnd} data-index={idx} className={`group relative aspect-square cursor-move overflow-hidden rounded-[12px] ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${draggedItemIndex === idx ? 'scale-95 opacity-50 ring-emerald-500' : (darkMode ? 'ring-white/10' : 'ring-black/[0.06]')}`}>
                    <img src={item.preview} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" alt="" />
                    <div className="absolute inset-x-1 bottom-1 flex translate-y-2 justify-end gap-1 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:opacity-100">
                      <button type="button" onClick={(event) => { event.stopPropagation(); handleOpenCropper(item); }} className="grid h-7 w-7 place-items-center rounded-full bg-white text-stone-950 shadow-[0_5px_14px_rgba(0,0,0,0.16)]" title="Recadrer"><span className="text-[11px]">↗</span></button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); if (item.preview && !item.isExisting) URL.revokeObjectURL(item.preview); setGalleryItems(items => items.filter((_, index) => index !== idx)); }} className="grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white" title="Retirer"><Trash2 size={12} strokeWidth={1.7} /></button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={uploading || galleryItems.length >= MAX_PRODUCT_IMAGES}
                  onClick={() => fileInputRef.current.click()}
                  title={galleryItems.length >= MAX_PRODUCT_IMAGES ? `Limite de ${MAX_PRODUCT_IMAGES} images atteinte` : 'Ajouter des images'}
                  className={`group flex aspect-square flex-col items-center justify-center rounded-[12px] border border-dashed transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:cursor-not-allowed ${galleryItems.length >= MAX_PRODUCT_IMAGES
                    ? (darkMode ? 'border-white/10 bg-white/[0.025] text-stone-700' : 'border-stone-300 bg-stone-100/70 text-stone-400')
                    : (darkMode ? 'border-white/15 text-stone-600 hover:bg-white/5 hover:text-white' : 'border-stone-300 text-stone-400 hover:bg-white hover:text-stone-950')}`}
                >
                  {galleryItems.length >= MAX_PRODUCT_IMAGES
                    ? <Check size={17} strokeWidth={1.7} />
                    : <Upload size={17} strokeWidth={1.5} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5" />}
                  <span className="mt-1 text-[8px] font-extrabold uppercase">{galleryItems.length >= MAX_PRODUCT_IMAGES ? 'Max' : 'Ajouter'}</span>
                </button>
              </div>
              <input type="file" id="fileInput" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />

              {(totalOriginalSize > 0 || totalCompressedSize > 0) && (
                <div className={`mt-2.5 flex items-center justify-between gap-2 text-[9px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  <span>{formatBytes(totalOriginalSize)} importés</span>
                  {totalCompressedSize > 0 && <span className="text-emerald-600 dark:text-emerald-400">Optimisé {formatBytes(totalCompressedSize)}</span>}
                </div>
              )}
              {totalCompressedSize > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadImages}
                  className={`mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-full text-[9px] font-extrabold ring-1 transition-[transform,background-color] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${darkMode ? 'text-stone-300 ring-white/10 hover:bg-white/[0.06]' : 'text-stone-600 ring-black/[0.06] hover:bg-stone-50'}`}
                >
                  <Download size={13} strokeWidth={1.7} />Télécharger les images optimisées
                </button>
              )}
            </div>

            <div className="grid h-full min-h-0 grid-cols-1 content-start gap-x-4 gap-y-4 md:grid-cols-6 md:grid-rows-[auto_auto_auto_minmax(220px,1fr)] lg:col-span-8 xl:content-stretch 2xl:col-span-9 2xl:gap-x-5">
              <div className="md:col-span-3">
                <label className={labelClass}>Nom de l’ouvrage</label>
                <input ref={nameInputRef} enterKeyHint="next" placeholder={catMeta.namePlaceholder} className={fieldClass} value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} onKeyDown={(event) => handleEnterFocus(event, startingPriceInputRef)} />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Prix de départ</label>
                  <label className={`mb-1.5 flex cursor-pointer items-center gap-1.5 text-[8px] font-bold ${formData.priceOnRequest ? 'text-emerald-600' : 'text-stone-400'}`}><input type="checkbox" checked={formData.priceOnRequest} onChange={event => setFormData({ ...formData, priceOnRequest: event.target.checked })} className="accent-emerald-600" />Sur demande</label>
                </div>
                <input ref={startingPriceInputRef} type="number" enterKeyHint="next" disabled={formData.priceOnRequest} placeholder="0 €" className={`${fieldClass} disabled:opacity-45`} value={formData.priceOnRequest ? '' : (formData.startingPrice === 0 ? '' : formData.startingPrice)} onChange={event => setFormData({ ...formData, startingPrice: event.target.value === '' ? 0 : Number(event.target.value) })} onKeyDown={(event) => handleEnterFocus(event, stockInputRef)} />
              </div>
              <div className="md:col-span-1">
                <label className={labelClass}>Stock</label>
                <input ref={stockInputRef} type="number" enterKeyHint="next" placeholder="1" className={`${fieldClass} text-center`} value={formData.stock} onChange={event => setFormData({ ...formData, stock: event.target.value })} onKeyDown={(event) => handleEnterFocus(event, widthInputRef)} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>{catMeta.materialLabel}</label>
                <select className={`${fieldClass} cursor-pointer appearance-none`} value={isCustomMaterial ? 'Autre' : formData.material} onChange={event => { const value = event.target.value; if (value === 'Autre') { setIsCustomMaterial(true); setFormData({ ...formData, material: '' }); } else { setIsCustomMaterial(false); setFormData({ ...formData, material: value }); } }}>
                  <option value="">Sélectionner…</option>
                  {catMeta.materialOptions.map(material => <option key={material} value={material}>{material}</option>)}
                </select>
                {isCustomMaterial && <input autoFocus placeholder="Préciser la matière" className={`${fieldClass} mt-2`} value={formData.material} onChange={event => setFormData({ ...formData, material: event.target.value })} />}
              </div>
              <div className="relative md:col-span-2">
                <label className={labelClass}>Couleur dominante</label>
                <span className="absolute bottom-[14px] left-3.5 h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: selectedColorObj?.hex || 'transparent' }} />
                <input onFocus={() => setShowColorDropdown(true)} onBlur={() => setShowColorDropdown(false)} placeholder="Cuivré, vert sauge…" className={`${fieldClass} pl-9`} value={formData.color} onChange={event => { setFormData({ ...formData, color: event.target.value }); setShowColorDropdown(true); }} />
                {showColorDropdown && <div data-native-scroll-region="true" className={`absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-[14px] p-1.5 shadow-[0_18px_50px_rgba(28,25,23,0.14)] ring-1 ${darkMode ? 'bg-stone-900 ring-white/10' : 'bg-white ring-black/[0.06]'}`}>{filteredColors.length ? filteredColors.map(color => <button type="button" key={color.name} className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[11px] font-semibold ${darkMode ? 'hover:bg-white/5' : 'hover:bg-stone-50'}`} onMouseDown={event => { event.preventDefault(); setFormData({ ...formData, color: color.name }); setShowColorDropdown(false); }}><span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.hex }} />{color.name}</button>) : <p className="px-3 py-2 text-[11px] text-stone-500">Couleur personnalisée</p>}</div>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Style</label>
                <select className={`${fieldClass} cursor-pointer appearance-none`} value={formData.style} onChange={event => setFormData({ ...formData, style: event.target.value })}><option value="">Aucun / Non défini</option>{STYLE_OPTIONS.map(style => <option key={style} value={style}>{style}</option>)}</select>
              </div>

              <div className="md:col-span-6">
                <label className={labelClass}>Dimensions en cm</label>
                <div className={`grid max-w-[270px] gap-2 ${catMeta.showDepth ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <input ref={widthInputRef} type="number" placeholder={catMeta.widthLabel} className={`${fieldClass} text-center`} value={formData.width} onChange={event => setFormData({ ...formData, width: event.target.value })} onKeyDown={(event) => handleEnterFocus(event, catMeta.showDepth ? depthInputRef : heightInputRef)} />
                  {catMeta.showDepth && <input ref={depthInputRef} type="number" placeholder={catMeta.depthLabel} className={`${fieldClass} text-center`} value={formData.depth} onChange={event => setFormData({ ...formData, depth: event.target.value })} onKeyDown={(event) => handleEnterFocus(event, heightInputRef)} />}
                  <input ref={heightInputRef} type="number" placeholder={catMeta.heightLabel} className={`${fieldClass} text-center`} value={formData.height} onChange={event => setFormData({ ...formData, height: event.target.value })} />
                </div>
              </div>
              <div className="flex min-h-[260px] flex-col md:col-span-6 md:min-h-0 xl:h-full">
                <label className={labelClass}>Histoire de l’objet</label>
                <StoryEditor value={formData.description} onChange={(description) => setFormData({ ...formData, description })} darkMode={darkMode} />
              </div>
            </div>
          </div>
            </div>

            <div
              className="pub-pane min-h-0 xl:h-full"
              data-state={isReview ? 'active' : 'idle'}
              data-side="after"
              aria-hidden={!isReview}
              inert={!isReview}
            >
              <PublicationReviewStep
                darkMode={darkMode}
                formData={formData}
                galleryItems={galleryItems}
                targets={socialTargets}
                onTargetsChange={setSocialTargets}
                connection={metaConnection}
                onConnectRequest={meta.beginOAuth}
                hashtags={instagramHashtags}
                onHashtagsChange={setInstagramHashtags}
                socialPublication={socialPublication}
                uploading={uploading}
              />
            </div>
          </div>

        <PublicationActionBar
          darkMode={darkMode}
          step={step}
          categoryLabel={categoryLabel}
          priceLabel={formData.priceOnRequest ? 'Sur demande' : `${Number(formData.startingPrice || 0).toLocaleString('fr-FR')} €`}
          stockLabel={formData.stock === '' ? '—' : String(formData.stock)}
          photoCount={galleryItems.length}
          photoLimit={MAX_PRODUCT_IMAGES}
          targets={socialTargets}
          connection={metaConnection}
          editData={editData}
          uploading={uploading}
          progress={progress}
          message={msg}
          messageTone={messageTone}
          onBack={() => setStep('compose')}
          onNext={goToReview}
          onPublish={addMeuble}
          onCancelEdit={onCancelEdit}
          publishLabel={publishLabel}
          retryMode={Boolean(socialPublication && socialPublication.overallStatus !== 'published')}
        />
        </div>
      </div>

      <ImageCropperModal isOpen={cropperConfig.isOpen} image={cropperConfig.image} aspect={cropperConfig.aspect} onClose={() => setCropperConfig(prev => ({ ...prev, isOpen: false }))} onCropComplete={handleCropComplete} darkMode={darkMode} />
    </div>
  );
};

export default AdminForm;
