import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, Crop, Upload, Trash2, Download } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { getStorageInstance } from '../config/firebaseStorage';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PRODUCT_IMAGE_VARIANT_SPECS, compressImage, createProductImageVariantFiles, getImageFileMetadata } from '../../utils/imageUtils'; // [NEW] Import compression utility
import ImageCropperModal from './components/ImageCropperModal';
import InstagramPublicationPreview from './components/InstagramPublicationPreview';
import MetaConnectionControl from './components/MetaConnectionControl';
import PublicationConfirmationDialog from './components/PublicationConfirmationDialog';
import StoryEditor from './components/StoryEditor';
import KIT_CONFIG from '../config/constants';
import RichTextStory from '../shared/RichTextStory';
import { clearAdminPublicCatalogCache } from './adminPublicCatalog';
import {
  adjustInventoryAdmin,
  createProductCommandSession,
  createProductDraftAdmin,
  preflightProductMutationAdmin,
  publishProductAdmin,
  updateProductOfferAdmin
} from '../commerce/adminProductCommandClient';
import {
  getSocialPublicationStatusAdmin,
  prepareSocialPublicationAdmin,
  runSocialPublicationAdmin
} from './metaPublicationClient';

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

const AdminForm = ({
  editData,
  onCancelEdit,
  onSaved,
  collectionName = 'furniture',
  darkMode = false,
  mutationsEnabled = false
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
    stock: '', 
    priceOnRequest: false
  });

  // Unified state for images
  const [galleryItems, setGalleryItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [categoryError, setCategoryError] = useState(false);
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [publicationView, setPublicationView] = useState('details');
  const [instagramHashtags, setInstagramHashtags] = useState('#secondevie #mobilierancien #artisanat');
  const [metaConnection, setMetaConnection] = useState({ status: 'loading', connected: false });
  const [socialTargets, setSocialTargets] = useState({ instagram: true, facebook: true });
  const [socialPublication, setSocialPublication] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const fileInputRef = useRef();
  const categoryGroupRef = useRef(null);
  const nameInputRef = useRef(null);
  const startingPriceInputRef = useRef(null);
  const stockInputRef = useRef(null);
  const widthInputRef = useRef(null);
  const depthInputRef = useRef(null);
  const heightInputRef = useRef(null);
  const productCommandSessionRef = useRef(null);
  const initialPreflightStartedRef = useRef(false);

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

  useEffect(() => {
    if (!mutationsEnabled || initialPreflightStartedRef.current) return;
    initialPreflightStartedRef.current = true;

    void preflightProductMutationAdmin().catch(() => {
      setMsg("Confirmez votre session administrateur avant de préparer l'annonce.");
    });
  }, [mutationsEnabled]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    productCommandSessionRef.current = null;
    setInstagramEnabled(false);
    setPublicationView('details');
    setInstagramHashtags('#secondevie #mobilierancien #artisanat');
    setSocialTargets({ instagram: true, facebook: true });
    setSocialPublication(null);
    setPublishDialogOpen(false);
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
      stock: '', // [NEW] Reset stock
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
    setInstagramEnabled(false);
    setPublicationView('details');
    setInstagramHashtags('#secondevie #mobilierancien #artisanat');
    setSocialTargets({ instagram: true, facebook: true });
    setSocialPublication(null);
  };

  const processFiles = async (files) => {
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - galleryItems.length);
    const acceptedFiles = files.slice(0, availableSlots);
    const omittedCount = files.length - acceptedFiles.length;
    if (acceptedFiles.length === 0) {
      setMsg(`La galerie est limitée à ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
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

  const uploadProductVariantSet = async (sourceFile, progressPrefix, slotIndex) => {
    setMsg(`${progressPrefix} Création des formats responsive...`);
    const variantFiles = await createProductImageVariantFiles(sourceFile);
    const uploadStamp = Date.now();
    const uploaded = {};
    const storage = await getStorageInstance();

    for (const spec of PRODUCT_IMAGE_VARIANT_SPECS) {
      const variantFile = variantFiles[spec.key];
      if (!variantFile) continue;

      setMsg(`${progressPrefix} Envoi ${spec.key} ${spec.width}px...`);
      const safeName = sanitizeStorageName(variantFile.name);
      const imageRef = ref(storage, `${collectionName}/${spec.folder}/${uploadStamp}_${slotIndex}_${spec.key}_${safeName}`);
      await uploadBytes(imageRef, variantFile, {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: variantFile.type || 'image/webp'
      });
      uploaded[spec.key] = await getDownloadURL(imageRef);
    }

    return uploaded;
  };

  const addMeuble = async () => {
    if (socialPublication && socialPublication.overallStatus !== 'published') {
      setUploading(true);
      setMsg('Reprise de la publication Meta…');
      try {
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
        setMsg('Le meuble est publié sur le site et les réseaux sélectionnés.');
        productCommandSessionRef.current = null;
        resetForm();
        if (onCancelEdit) onCancelEdit();
        if (onSaved) onSaved();
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
    if (!formData.name) { setMsg("Nom requis"); return; }
    // ── Validation catégorie obligatoire ──
    if (!formData.category) {
      setCategoryError(true);
      setMsg("Publication impossible : choisis un type de publication.");
      categoryGroupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      categoryGroupRef.current?.querySelector('button')?.focus({ preventScroll: true });
      return;
    }
    setCategoryError(false);
    if (galleryItems.length > MAX_PRODUCT_IMAGES) {
      setMsg(`La galerie est limitée à ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
    if (instagramEnabled && !metaConnection.connected) {
      setMsg('Connecte Meta avant d’activer la publication simultanée.');
      return;
    }
    if (instagramEnabled && !socialTargets.instagram && !socialTargets.facebook) {
      setMsg('Garde au moins une destination Meta active.');
      return;
    }
    setUploading(true);
    setMsg("Préparation des fichiers...");

    try {
      setMsg("Vérification de la session administrateur...");
      await preflightProductMutationAdmin();
      setMsg("Préparation des fichiers...");

      let finalImageUrls = [];
      let finalThumbnails = [];
      let finalImageVariants = [];
      let finalImageMetadata = [];
      let count = 0;

      for (const item of galleryItems) {
        count++;
        const progressPrefix = `[${count}/${galleryItems.length}]`;

        if (item.isExisting) {
          finalImageUrls.push(item.preview);
          finalThumbnails.push(item.thumbnailUrl || item.variantUrls?.thumb || item.preview);
          finalImageVariants.push(item.variantUrls || {});
          finalImageMetadata.push(item.metadata || {});
        } else if (item.file) {
          let uploadedVariants = {};
          let imageMetadata = item.metadata || null;
          try {
            uploadedVariants = await uploadProductVariantSet(item.file, progressPrefix, count - 1);
          } catch (err) {
            console.warn("Responsive variant upload failed, falling back to single WebP", err);
            setMsg(`${progressPrefix} Compression WebP...`);
            let fileToUpload = item.file;
            if (!item.isCompressed) {
              try {
                fileToUpload = await compressImage(item.file, 0.85, 1920);
              } catch (compressErr) {
                console.warn("Compression failed, using original", compressErr);
              }
            }

            setMsg(`${progressPrefix} Envoi de l'image...`);
            const uploadStamp = Date.now();
            const storage = await getStorageInstance();
            const imageRef = ref(storage, `${collectionName}/${uploadStamp}_tat_${fileToUpload.name}`);
            await uploadBytes(imageRef, fileToUpload, {
              cacheControl: 'public, max-age=31536000, immutable',
              contentType: fileToUpload.type || 'image/webp'
            });
            uploadedVariants.full = await getDownloadURL(imageRef);
          }

          if (!imageMetadata) {
            imageMetadata = await getImageFileMetadata(item.file);
          }

          const fullUrl = uploadedVariants.full || uploadedVariants.large || uploadedVariants.medium || uploadedVariants.card || uploadedVariants.thumb || "";
          const thumbUrl = uploadedVariants.thumb || uploadedVariants.card || fullUrl;
          finalImageUrls.push(fullUrl);
          finalThumbnails.push(thumbUrl);
          finalImageVariants.push(uploadedVariants);
          finalImageMetadata.push(imageMetadata || {});

        }
      }

      setMsg("Finalisation...");
      const parsedStock = Number(formData.stock);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        throw new Error('Le stock doit etre un nombre entier positif ou nul.');
      }
      const automaticSeoIndexable = (
        String(formData.name || '').trim().length >= 4
        && String(formData.description || '').trim().length >= 48
        && finalImageUrls.length > 0
      );
      const editorial = {
        name: formData.name,
        description: formData.description,
        seoTitle: '',
        seoDescription: '',
        seoIndexable: automaticSeoIndexable,
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
        imageUrl: finalImageUrls[0] || "",
        thumbnailUrl: finalThumbnails[0] || finalImageUrls[0] || ""
      };

      const session = productCommandSessionRef.current || createProductCommandSession(editData?.id);
      productCommandSessionRef.current = session;
      let commandProduct;
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
      } else {
        const created = await createProductDraftAdmin({
          collectionName,
          productId: session.productId,
          editorial,
          media,
          commandId: session.createCommandId
        });
        commandProduct = {
          id: created.productId,
          commerceVersion: created.commerceVersion,
          inventoryVersion: created.inventoryVersion
        };
      }

      const offered = await updateProductOfferAdmin(
        commandProduct,
        collectionName,
        {
          currentPrice: Number(formData.startingPrice),
          startingPrice: Number(formData.startingPrice),
          priceOnRequest: formData.priceOnRequest || false
        },
        session.offerCommandId
      );
      commandProduct = {
        ...commandProduct,
        commerceVersion: offered.commerceVersion,
        inventoryVersion: offered.inventoryVersion
      };

      const currentStock = editData ? Number(editData.stock || 0) : 0;
      const stockDelta = parsedStock - currentStock;
      if (stockDelta !== 0) {
        const adjusted = await adjustInventoryAdmin(
          commandProduct,
          collectionName,
          stockDelta,
          'Ajustement depuis le formulaire produit',
          session.inventoryCommandId
        );
        commandProduct = {
          ...commandProduct,
          commerceVersion: adjusted.commerceVersion,
          inventoryVersion: adjusted.inventoryVersion
        };
      }

      if (!editData) {
        await publishProductAdmin(
          commandProduct,
          collectionName,
          true,
          session.publishCommandId
        );
      }
      clearAdminPublicCatalogCache();

      if (instagramEnabled) {
        setMsg('Meuble publié sur le site. Préparation de Meta…');
        const prepared = await prepareSocialPublicationAdmin({
          collectionName,
          productId: commandProduct.id,
          commandId: session.socialCommandId,
          targets: socialTargets,
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

      setMsg(instagramEnabled
        ? 'Le meuble est publié sur le site et les réseaux sélectionnés.'
        : 'Enregistré. Publication du catalogue en cours...');
      productCommandSessionRef.current = null;
      resetForm();
      if (onCancelEdit) onCancelEdit();
      if (onSaved) onSaved();
    } catch (err) {
      console.error("CRITICAL UPLOAD ERROR:", err);
      const errorReason = err?.details?.reason || err?.customData?.details?.reason || '';
      const needsStrongAuth = errorReason === 'strong-auth-required';
      let errorPrefix = "Erreur";
      if (needsStrongAuth) {
        setMsg("Confirme ton identité avec Google ou ta passkey, puis clique de nouveau sur « Publier l’ouvrage ».");
        return;
      }
      if (err.code === 'storage/unauthorized' || err.message?.includes('storage/unauthorized')) {
        setMsg("Autorisation d’envoi des images refusée. Reconnecte-toi, puis réessaie.");
        return;
      }
      if (err.message?.includes("storage")) errorPrefix = "Envoi des images impossible";
      else if (err.code === "permission-denied") errorPrefix = "Session expirée";
      setMsg(`${errorPrefix}: ${err.message || "Inconnue"}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMsg(""), 8000);
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
  const dimensionsSummary = [formData.width, catMeta.showDepth ? formData.depth : null, formData.height].filter(Boolean).join(' × ');
  const instagramSelected = Boolean(
    instagramEnabled
    && metaConnection.instagramAvailable
    && socialTargets.instagram
  );
  const facebookSelected = Boolean(
    instagramEnabled
    && metaConnection.facebookAvailable
    && socialTargets.facebook
  );
  const selectedSocialLabels = [
    instagramSelected ? 'Instagram' : '',
    facebookSelected ? 'Facebook' : ''
  ].filter(Boolean);
  const publishActionLabel = uploading
    ? 'Publication en cours…'
    : socialPublication && socialPublication.overallStatus !== 'published'
      ? 'Réessayer les réseaux'
      : editData
        ? selectedSocialLabels.length > 0
          ? `Enregistrer + ${selectedSocialLabels.join(' + ')}`
          : 'Enregistrer sur le site'
        : selectedSocialLabels.length > 0
          ? `Publier sur le site + ${selectedSocialLabels.join(' + ')}`
          : 'Publier sur le site';

  const toggleFinalDestination = (destination) => {
    const available = destination === 'instagram'
      ? metaConnection.instagramAvailable
      : metaConnection.facebookAvailable;
    if (!available) {
      setMsg(destination === 'instagram'
        ? 'Connecte Instagram en haut de la publication avant de l’ajouter.'
        : 'Connecte une Page Facebook avant de l’ajouter.');
      return;
    }

    const currentlySelected = instagramEnabled && socialTargets[destination];
    const nextTargets = { ...socialTargets, [destination]: !currentlySelected };
    setSocialTargets(nextTargets);
    setInstagramEnabled(nextTargets.instagram || nextTargets.facebook);
    if (destination === 'instagram' && currentlySelected && publicationView === 'instagram') {
      setPublicationView('details');
    }
    setMsg(!currentlySelected
      ? `${destination === 'instagram' ? 'Instagram' : 'Facebook'} sera inclus dans cette publication.`
      : `${destination === 'instagram' ? 'Instagram' : 'Facebook'} ne recevra pas cette publication.`);
  };
  const messageIsError = msg.startsWith('Erreur')
    || msg.startsWith('Publication impossible')
    || msg.startsWith('Nom requis')
    || msg.startsWith('Session expirée')
    || msg.startsWith('Confirme ton identité')
    || msg.startsWith('Autorisation d’envoi')
    || msg.startsWith('Envoi des images impossible');

  return (
    <div className="grid min-h-0 grid-cols-1 gap-5 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(250px,20%)] 2xl:gap-6">
      <div className={`min-h-0 overflow-hidden rounded-[26px] border ${darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'}`}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-5 sm:px-6 sm:py-6 xl:px-7 xl:py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-extrabold tracking-[-0.025em]">{editData ? 'Modifier la publication' : 'Nouvelle publication'}</h3>
              <p className={`mt-0.5 text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{publicationView === 'instagram' ? 'Aperçu du contenu destiné au fil Instagram.' : 'Les informations essentielles, dans l’ordre naturel de saisie.'}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {editData && <button type="button" onClick={onCancelEdit} className="rounded-full px-3 py-2 text-[10px] font-extrabold text-red-500 ring-1 ring-red-500/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-500 hover:text-white">Annuler</button>}
              {instagramEnabled && publicationView === 'details' && (
                <button type="button" onClick={() => setPublicationView('instagram')} className={`rounded-full px-3 py-2 text-[9px] font-extrabold ring-1 transition-colors ${darkMode ? 'text-stone-300 ring-white/10 hover:bg-white/5 hover:text-white' : 'text-stone-600 ring-black/[0.07] hover:bg-stone-50 hover:text-stone-950'}`}>Voir l’aperçu</button>
              )}
              <MetaConnectionControl
                darkMode={darkMode}
                onEnabledChange={(nextEnabled) => {
                  setInstagramEnabled(nextEnabled);
                  setPublicationView(nextEnabled && socialTargets.instagram ? 'instagram' : 'details');
                }}
                onConnectionChange={(connection) => {
                  setMetaConnection(connection);
                  if (connection.connected) {
                    setSocialTargets((current) => {
                      const next = {
                        instagram: connection.instagramAvailable ? current.instagram : false,
                        facebook: connection.facebookAvailable ? current.facebook : false
                      };
                      if (!next.instagram && !next.facebook) {
                        if (connection.instagramAvailable) next.instagram = true;
                        else if (connection.facebookAvailable) next.facebook = true;
                      }
                      return next;
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="relative mt-4 min-h-0 flex-1">
            <div className={`min-h-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transform-none motion-reduce:transition-none xl:h-full xl:overflow-y-auto xl:pr-1 ${publicationView === 'details' ? 'relative translate-x-0 opacity-100' : 'pointer-events-none absolute inset-0 -translate-x-5 opacity-0'}`} aria-hidden={publicationView !== 'details'} inert={publicationView !== 'details'}>
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

          <div className="mt-5 grid min-h-0 flex-1 grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-7">
            <div className="flex min-h-0 flex-col lg:col-span-4 2xl:col-span-3">
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
                className={`grid min-h-[250px] flex-1 grid-cols-3 content-start gap-2.5 rounded-[18px] p-3 ring-1 transition-colors duration-200 lg:min-h-[330px] ${isDragging ? 'bg-emerald-500/5 ring-emerald-500/50' : (darkMode ? 'bg-black/20 ring-white/10' : 'bg-[#F8F7F4] ring-black/[0.045]')}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {galleryItems.slice(0, MAX_PRODUCT_IMAGES).map((item, idx) => (
                  <div key={item.id} draggable onDragStart={(event) => onDragStartItem(event, idx)} onDragOver={onDragOverItem} onDrop={(event) => onDropItem(event, idx)} onTouchStart={() => handleTouchStart(idx)} onTouchEnd={handleTouchEnd} data-index={idx} className={`group relative aspect-square cursor-move overflow-hidden rounded-[12px] ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${draggedItemIndex === idx ? 'scale-95 opacity-50 ring-emerald-500' : (darkMode ? 'ring-white/10' : 'ring-black/[0.06]')}`}>
                    <img src={item.preview} className="h-full w-full object-cover" alt="" />
                    <div className="absolute inset-x-1 bottom-1 flex translate-y-2 justify-end gap-1 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:opacity-100">
                      <button type="button" onClick={(event) => { event.stopPropagation(); handleOpenCropper(item); }} className="grid h-7 w-7 place-items-center rounded-full bg-white text-stone-950 shadow-[0_5px_14px_rgba(0,0,0,0.16)]" title="Recadrer" aria-label="Recadrer cette image"><Crop size={12} strokeWidth={1.7} /></button>
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
            </div>

            <div className="grid h-full min-h-0 grid-cols-1 content-start gap-x-4 gap-y-4 md:grid-cols-6 md:grid-rows-[auto_auto_auto_minmax(220px,1fr)] lg:col-span-8 2xl:col-span-9 2xl:gap-x-5">
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
              <div className="flex min-h-[260px] flex-col md:col-span-6 md:min-h-0">
                <label className={labelClass}>Histoire de l’objet</label>
                <StoryEditor value={formData.description} onChange={(description) => setFormData({ ...formData, description })} darkMode={darkMode} />
              </div>
            </div>
          </div>
            </div>

            <div className={`min-h-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transform-none motion-reduce:transition-none xl:h-full xl:overflow-y-auto xl:pr-1 ${publicationView === 'instagram' ? 'relative translate-x-0 opacity-100' : 'pointer-events-none absolute inset-0 translate-x-5 opacity-0'}`} aria-hidden={publicationView !== 'instagram'} inert={publicationView !== 'instagram'}>
              <InstagramPublicationPreview
                darkMode={darkMode}
                galleryItems={galleryItems}
                name={formData.name}
                description={formData.description}
                hashtags={instagramHashtags}
                onHashtagsChange={setInstagramHashtags}
                onBack={() => setPublicationView('details')}
              />
            </div>
          </div>
        </div>
      </div>

      <aside className={`min-h-0 rounded-[26px] border p-5 sm:p-6 ${darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'}`}>
        <div className="flex h-full min-h-[360px] flex-col">
          <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Résumé de la publication</p>
          <div className={`mt-3 overflow-hidden rounded-[16px] ring-1 ${darkMode ? 'bg-black/20 ring-white/10' : 'bg-[#F7F6F3] ring-black/[0.045]'}`}>
            {galleryItems[0]?.preview ? <img src={galleryItems[0].preview} alt="Aperçu principal" className="h-32 w-full object-cover" /> : <div className="grid h-32 place-items-center text-center text-[10px] text-stone-400"><span><Upload size={20} strokeWidth={1.3} className="mx-auto mb-2" />Le premier visuel apparaîtra ici</span></div>}
          </div>
          <h4 className="mt-3 break-words text-[16px] font-extrabold leading-[1.15] tracking-[-0.025em]">{formData.name || 'Sans titre'}</h4>
          <dl className={`mt-3 divide-y text-[10px] ${darkMode ? 'divide-white/10' : 'divide-black/[0.055]'}`}>
            {[
              ['Catégorie', categoryLabel],
              ['Prix', formData.priceOnRequest ? 'Sur demande' : `${Number(formData.startingPrice || 0).toLocaleString('fr-FR')} €`],
              ['Stock', formData.stock === '' ? '—' : formData.stock],
              ['Dimensions', dimensionsSummary ? `${dimensionsSummary} cm` : '—'],
              ['Style', formData.style || 'Non défini'],
            ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-2"><dt className="text-stone-400">{label}</dt><dd className="truncate font-bold">{value}</dd></div>)}
          </dl>
          <div className={`mt-4 min-h-[150px] flex-1 overflow-y-auto rounded-[16px] border p-4 text-[10px] leading-5 ${darkMode ? 'border-white/10 bg-black/20 text-stone-400' : 'border-stone-200 bg-[#F8F7F4] text-stone-600'}`}>
            <p className={`mb-3 text-[8px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>Aperçu de l’histoire</p>
            {formData.description.trim() ? <RichTextStory value={formData.description} /> : <p className="text-stone-400">Le récit mis en forme apparaîtra ici pendant la rédaction.</p>}
          </div>
          <div className="mt-auto pt-3">
            {socialPublication && (
              <div className={`mb-2 rounded-[12px] px-3 py-2 ring-1 ${darkMode ? 'bg-black/20 ring-white/10' : 'bg-[#F7F6F3] ring-black/[0.05]'}`}>
                <div className="flex items-center justify-between gap-3 text-[8px] font-extrabold uppercase tracking-[0.08em]">
                  <span>Publication simultanée</span>
                  <span className={socialPublication.overallStatus === 'published' ? 'text-emerald-600' : socialPublication.overallStatus.includes('failure') || socialPublication.overallStatus === 'failed' ? 'text-red-600' : 'text-stone-400'}>{socialPublication.overallStatus === 'published' ? 'Terminée' : socialPublication.overallStatus === 'partial_failure' ? 'À reprendre' : 'En cours'}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-[8px] font-bold">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-center text-emerald-700">Site publié</span>
                  {['instagram', 'facebook'].map((destination) => {
                    const stage = socialPublication.destinations?.[destination];
                    if (!stage?.requested) return <span key={destination} className="rounded-full bg-stone-500/10 px-2 py-1 text-center text-stone-400">{destination === 'instagram' ? 'Instagram' : 'Facebook'} ignoré</span>;
                    const success = stage.status === 'published';
                    const failed = stage.status === 'failed';
                    return <span key={destination} className={`rounded-full px-2 py-1 text-center ${success ? 'bg-emerald-500/10 text-emerald-700' : failed ? 'bg-red-500/10 text-red-700' : 'bg-stone-500/10 text-stone-500'}`}>{destination === 'instagram' ? 'Instagram' : 'Facebook'} {success ? 'publié' : failed ? 'échoué' : 'envoi'}</span>;
                  })}
                </div>
              </div>
            )}
            {msg && <p role={messageIsError ? 'alert' : 'status'} aria-live={messageIsError ? 'assertive' : 'polite'} className={`mb-2 rounded-[12px] px-3 py-2 text-[9px] font-bold ${msg.startsWith('Enregistré') || msg.includes('optimisées') ? 'bg-emerald-500/10 text-emerald-600' : messageIsError ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/15' : 'bg-stone-500/10 text-stone-500'}`}>{msg}</p>}
            {(totalOriginalSize > 0 || totalCompressedSize > 0) && <div className="mb-2 flex items-center justify-between text-[9px] text-stone-400"><span>{formatBytes(totalOriginalSize)}</span>{totalCompressedSize > 0 && <span className="font-bold text-emerald-600">Optimisé {formatBytes(totalCompressedSize)}</span>}</div>}
            {totalCompressedSize > 0 && <button type="button" onClick={handleDownloadImages} className={`mb-2 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[9px] font-extrabold ring-1 ${darkMode ? 'ring-white/10 hover:bg-white/5' : 'ring-black/[0.06] hover:bg-stone-50'}`}><Download size={13} strokeWidth={1.5} />Télécharger les images</button>}
            <button type="button" onClick={() => { setMsg(''); setPublishDialogOpen(true); }} disabled={uploading} className="flex min-h-11 w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-center text-[10px] font-extrabold text-white shadow-[0_14px_34px_rgba(28,25,23,0.2)] transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-stone-950">
              <span>{socialPublication && socialPublication.overallStatus !== 'published' ? 'Reprendre la publication' : editData ? 'Enregistrer' : 'Publier'}</span>
            </button>
          </div>
        </div>
      </aside>

      <PublicationConfirmationDialog
        actionLabel={publishActionLabel}
        darkMode={darkMode}
        facebookAvailable={Boolean(metaConnection.facebookAvailable)}
        facebookSelected={facebookSelected}
        instagramAvailable={Boolean(metaConnection.instagramAvailable)}
        instagramSelected={instagramSelected}
        instagramUsername={metaConnection.instagramUsername}
        message={msg}
        messageIsError={messageIsError}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={addMeuble}
        onToggle={toggleFinalDestination}
        open={publishDialogOpen}
        pageName={metaConnection.pageName}
        uploading={uploading}
      />

      <ImageCropperModal isOpen={cropperConfig.isOpen} image={cropperConfig.image} aspect={cropperConfig.aspect} onClose={() => setCropperConfig(prev => ({ ...prev, isOpen: false }))} onCropComplete={handleCropComplete} darkMode={darkMode} />
    </div>
  );
};

export default AdminForm;
