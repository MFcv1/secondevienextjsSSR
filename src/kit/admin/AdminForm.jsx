import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { storage } from '../config/firebaseStorage';
import { doc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PRODUCT_IMAGE_VARIANT_SPECS, compressImage, createProductImageVariantFiles, getImageFileMetadata } from '../../utils/imageUtils'; // [NEW] Import compression utility
import { getProductUrl } from '../../utils/slug';
import ImageCropperModal from './components/ImageCropperModal';
import KIT_CONFIG from '../config/constants';
import { bumpPublicCatalogVersion } from './publicCatalogInvalidation';

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

const AdminForm = ({ editData, onCancelEdit, collectionName = 'furniture', darkMode = false }) => {
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
  const fileInputRef = useRef();
  const nameInputRef = useRef(null);
  const startingPriceInputRef = useRef(null);
  const stockInputRef = useRef(null);
  const widthInputRef = useRef(null);
  const depthInputRef = useRef(null);
  const heightInputRef = useRef(null);

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

  useEffect(() => {
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

      setGalleryItems(initialImages.map((url, idx) => ({
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
  };

  const processFiles = async (files) => {
    setMsg("⏳ Optimisation automatique...");

    const newItems = files.map(file => ({
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

    setMsg("✅ Images ajoutées et optimisées !");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) processFiles(files);
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
    setMsg(`✅ Téléchargement de ${count} images lancé !`);
  };

  const sanitizeStorageName = (name) => {
    return String(name || 'image.webp')
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'image.webp';
  };

  const uploadProductVariantSet = async (sourceFile, progressPrefix, slotIndex) => {
    setMsg(`⏳ ${progressPrefix} Creation des formats responsive...`);
    const variantFiles = await createProductImageVariantFiles(sourceFile);
    const uploadStamp = Date.now();
    const uploaded = {};

    for (const spec of PRODUCT_IMAGE_VARIANT_SPECS) {
      const variantFile = variantFiles[spec.key];
      if (!variantFile) continue;

      setMsg(`⏳ ${progressPrefix} Envoi ${spec.key} ${spec.width}px...`);
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
    if (!formData.name) { setMsg("⚠️ Nom requis"); return; }
    // ── Validation catégorie obligatoire ──
    if (!formData.category) {
      setMsg("⚠️ Choisis un type de publication (Mobilier, Tables, Miroirs…)");
      return;
    }
    setUploading(true);
    setMsg("⏳ Préparation des fichiers...");

    try {
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
            setMsg(`⏳ ${progressPrefix} Compression WebP...`);
            let fileToUpload = item.file;
            if (!item.isCompressed) {
              try {
                fileToUpload = await compressImage(item.file, 0.85, 1920);
              } catch (compressErr) {
                console.warn("Compression failed, using original", compressErr);
              }
            }

            setMsg(`⏳ ${progressPrefix} Envoi de l'image...`);
            const uploadStamp = Date.now();
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

      setMsg("⏳ Finalisation...");
      const data = {
        ...formData,
        images: finalImageUrls,
        thumbnails: finalThumbnails,
        imageVariants: finalImageVariants,
        imageMetadata: finalImageMetadata,
        imageUrl: finalImageUrls[0] || "",
        thumbnailUrl: finalThumbnails[0] || finalImageUrls[0] || "",
        currentPrice: Number(formData.startingPrice),
        startingPrice: Number(formData.startingPrice),
        stock: parseInt(formData.stock) || 1,
        sold: (parseInt(formData.stock) || 1) <= 0,
        soldAt: (parseInt(formData.stock) || 1) <= 0 ? (editData?.soldAt || Timestamp.now()) : null,
        priceOnRequest: formData.priceOnRequest || false,
      };

      let savedProductId = editData?.id || '';
      if (editData) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, editData.id), data);
      } else {
        const createdRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), {
          ...data,
          status: 'published',
          createdAt: serverTimestamp()
        });
        savedProductId = createdRef.id;
      }
      await bumpPublicCatalogVersion(editData ? 'product_updated' : 'product_created', {
        productId: savedProductId,
        categoryIds: data.category ? [data.category] : [],
        paths: [getProductUrl({ ...data, id: savedProductId })]
      });

      setMsg("✅ Publication réussie !");
      resetForm();
      if (onCancelEdit) onCancelEdit();
    } catch (err) {
      console.error("CRITICAL UPLOAD ERROR:", err);
      let errorPrefix = "Erreur";
      if (err.message?.includes("storage")) errorPrefix = "Stockage plein ou bloqué";
      else if (err.code === "permission-denied") errorPrefix = "Session expirée";
      setMsg(`❌ ${errorPrefix}: ${err.message || "Inconnue"}`);
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

  const handleDescriptionWheelCapture = (e) => {
    const el = e.currentTarget;
    const isScrollable = el.scrollHeight > el.clientHeight + 1;

    // Only lock wheel to textarea when vertical overflow exists.
    if (isScrollable) {
      e.stopPropagation();
    }
  };

  const catMeta = getCategoryMeta(formData.category);

  const filteredColors = COLOR_BANK.filter(c => c.name.toLowerCase().includes((formData.color || '').toLowerCase()));
  const selectedColorObj = COLOR_BANK.find(c => c.name.toLowerCase() === (formData.color || '').toLowerCase());

  return (
    <div className={`p-5 md:p-12 rounded-3xl md:rounded-[3rem] border shadow-2xl space-y-10 animate-in slide-in-from-top-4 transition-all ${darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-200/60 text-stone-900'}`}>
      
      {/* ── HEADER + SÉLECTEUR DE TYPE (PILL GROUP) ── */}
      <div className={`border-b pb-6 space-y-5 ${darkMode ? 'border-stone-700' : 'border-stone-100'}`}>
        <div className="flex justify-between items-center">
          <p className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-stone-400' : 'text-stone-900'}`}>{editData ? 'Modification en cours' : 'Nouvelle publication'}</p>
          {editData && <button onClick={onCancelEdit} className="text-[10px] font-black text-red-500 uppercase hover:text-red-700 transition-colors">Annuler</button>}
        </div>

        {/* SÉLECTEUR DE TYPE — pill group */}
        <div className="flex flex-wrap gap-2">
          {KIT_CONFIG.productCategories.map(cat => {
            const isActive = formData.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.id })}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300
                  ${isActive
                    ? (darkMode ? 'bg-white text-stone-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'bg-stone-900 text-white border-stone-900 shadow-lg')
                    : (darkMode ? 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200' : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700')
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Catégorie sélectionnée — indicateur visuel */}
        {!formData.category && (
          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-amber-500/80' : 'text-amber-600/80'}`}>
            ↑ Sélectionne un type avant de publier
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 p-4 rounded-3xl transition-all border-2 border-dashed ${isDragging ? (darkMode ? 'border-amber-500/50 bg-amber-900/10' : 'border-amber-500 bg-amber-50/50 scale-[1.02]') : (darkMode ? 'bg-stone-800 border-stone-700/50' : 'border-stone-100')}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {galleryItems.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => onDragStartItem(e, idx)}
                onDragOver={(e) => onDragOverItem(e, idx)}
                onDrop={(e) => onDropItem(e, idx)}
                onTouchStart={() => handleTouchStart(idx)}
                onTouchEnd={handleTouchEnd}
                data-index={idx}
                className={`aspect-square rounded-2xl overflow-hidden relative group shadow-md border cursor-move transition-all duration-300 ${draggedItemIndex === idx ? 'opacity-50 scale-110 border-amber-500 z-10 rotate-2' : (darkMode ? 'border-stone-700 hover:scale-[1.02]' : 'border-stone-50 hover:scale-[1.02]')}`}
              >
                <img src={item.preview} className="w-full h-full object-cover pointer-events-none" alt="" />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-300 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleOpenCropper(item); }}
                    className="p-2 bg-amber-500 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                    title="Recadrer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" /><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" /></svg>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.preview && !item.isExisting) URL.revokeObjectURL(item.preview);
                      setGalleryItems(items => items.filter((_, i) => i !== idx));
                    }}
                    className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg border border-white/20 select-none shadow-lg">{idx + 1}</div>
                {item.isCompressed && <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg></div>}
              </div>
            ))}
            <button
              onClick={() => !uploading && fileInputRef.current.click()}
              type="button"
              className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all gap-2 ${darkMode ? 'bg-stone-900/40 border-stone-700 text-stone-600 hover:bg-stone-900/60 hover:border-stone-500' : 'bg-stone-50 border-stone-200 text-stone-300 hover:bg-stone-100 hover:border-stone-300'}`}
            >
              <Upload size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ajouter</span>
            </button>
          </div>
          <input type="file" id="fileInput" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-end">
            <div className="space-y-1.5">
              <div className="flex items-center min-h-[22px] ml-2">
                <label className="text-[9px] font-black uppercase text-stone-400">Nom de l'ouvrage</label>
              </div>
              <input
                ref={nameInputRef}
                enterKeyHint="next"
                placeholder={catMeta.namePlaceholder}
                className={`w-full p-4 rounded-xl border-none font-bold outline-none focus:ring-4 transition-all shadow-inner ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => handleEnterFocus(e, startingPriceInputRef)}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-2 min-h-[22px]">
                <label className="text-[9px] font-black uppercase text-stone-400">Prix de départ (€)</label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.priceOnRequest}
                    onChange={e => setFormData({ ...formData, priceOnRequest: e.target.checked })}
                  />
                  <div className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${formData.priceOnRequest ? 'bg-amber-500 border-amber-500' : 'border-stone-300 dark:border-stone-600'}`}>
                    {formData.priceOnRequest && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <span className={`text-[8px] font-black uppercase transition-colors ${formData.priceOnRequest ? 'text-amber-500' : 'text-stone-400 group-hover:text-stone-500'}`}>Prix sur demande</span>
                </label>
              </div>
              <input
                ref={startingPriceInputRef}
                type="number"
                enterKeyHint="next"
                disabled={formData.priceOnRequest}
                placeholder={formData.priceOnRequest ? "Demande" : "0"}
                className={`w-full p-4 rounded-xl border-none font-bold outline-none appearance-none [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-4 transition-all shadow-inner disabled:opacity-50 ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                value={formData.priceOnRequest ? "" : (formData.startingPrice === 0 ? "" : formData.startingPrice)}
                onChange={e => setFormData({ ...formData, startingPrice: e.target.value === "" ? 0 : Number(e.target.value) })}
                onKeyDown={(e) => handleEnterFocus(e, stockInputRef)}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center min-h-[22px] ml-2">
                <label className="text-[9px] font-black uppercase text-stone-400">Stock Initial</label>
              </div>
              <input
                ref={stockInputRef}
                type="number"
                enterKeyHint="next"
                placeholder="1"
                className={`w-full p-4 rounded-xl border-none font-bold outline-none appearance-none [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-4 transition-all shadow-inner ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                onKeyDown={(e) => handleEnterFocus(e, widthInputRef)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-4 items-start">
            <div className="space-y-1.5">
              <div className="flex items-center min-h-[22px] ml-2">
                <label className="text-[9px] font-black uppercase text-stone-400">{catMeta.materialLabel}</label>
              </div>
              <div className="relative space-y-2">
                <div className="relative">
                  <select
                    className={`w-full p-4 rounded-xl border-none font-bold outline-none text-sm focus:ring-4 transition-all shadow-inner appearance-none cursor-pointer ${darkMode ? 'bg-stone-900 text-white ring-stone-700' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                    value={isCustomMaterial ? "Autre" : formData.material}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "Autre") {
                        setIsCustomMaterial(true);
                        setFormData({ ...formData, material: "" });
                      } else {
                        setIsCustomMaterial(false);
                        setFormData({ ...formData, material: val });
                      }
                    }}
                  >
                    <option value="" disabled>Sélectionner...</option>
                    {catMeta.materialOptions.map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
                {isCustomMaterial && (
                  <input
                    autoFocus
                    placeholder="Précisez l'essence de bois..."
                    className={`w-full p-4 rounded-xl border font-bold outline-none text-sm focus:ring-4 transition-all shadow-inner animate-in slide-in-from-top-2 ${darkMode ? 'bg-stone-900 text-white border-stone-700 ring-stone-700 placeholder:text-stone-600' : 'bg-amber-50 text-stone-900 border-amber-200/50 ring-amber-100'}`}
                    value={formData.material}
                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* ── Couleur ── */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center min-h-[22px] ml-2">
                <label className="text-[9px] font-black uppercase text-stone-400">Couleur dominante</label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div 
                    className={`w-4 h-4 rounded-full border shadow-sm ${darkMode ? 'border-stone-600' : 'border-stone-300'}`} 
                    style={{ backgroundColor: selectedColorObj ? selectedColorObj.hex : 'transparent' }}
                  />
                </div>
                <input
                  onFocus={() => setShowColorDropdown(true)}
                  onBlur={() => setShowColorDropdown(false)}
                  placeholder="Ex: Cuivré..."
                  className={`w-full p-4 pl-11 rounded-xl border-none font-bold outline-none text-sm focus:ring-4 transition-all shadow-inner ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                  value={formData.color}
                  onChange={e => {
                    setFormData({ ...formData, color: e.target.value });
                    setShowColorDropdown(true);
                  }}
                />
                
                {showColorDropdown && (
                  <div data-native-scroll-region="true" className={`absolute z-50 w-full mt-2 py-2 rounded-xl border shadow-2xl max-h-48 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2 ${darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100'}`}>
                    {filteredColors.length > 0 ? (
                      filteredColors.map(c => (
                        <div 
                          key={c.name}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${darkMode ? 'hover:bg-stone-700 text-stone-200' : 'hover:bg-stone-50 text-stone-700'}`}
                          onMouseDown={(e) => { 
                            e.preventDefault(); // Prevents input blur
                            setFormData({ ...formData, color: c.name });
                            setShowColorDropdown(false);
                          }}
                        >
                          <div className="w-5 h-5 rounded-full border shadow-sm border-black/10" style={{ backgroundColor: c.hex }} />
                          <span className="text-xs font-bold">{c.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-stone-500 italic">
                        Couleur perso : "{formData.color}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Style ── */}
            <div className="space-y-1.5">
              <div className="flex items-center min-h-[22px] ml-2">
                <label className="text-[9px] font-black uppercase text-stone-400">Style</label>
              </div>
              <div className="relative">
                <select
                  className={`w-full p-4 rounded-xl border-none font-bold outline-none text-sm focus:ring-4 transition-all shadow-inner appearance-none cursor-pointer ${darkMode ? 'bg-stone-900 text-white ring-stone-700' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                  value={formData.style}
                  onChange={e => setFormData({ ...formData, style: e.target.value })}
                >
                  <option value="">Aucun / Non défini</option>
                  {STYLE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>

            {/* ── Dimensions ── */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center min-h-[22px] ml-2">
                <label className="text-[9px] font-black uppercase text-stone-400">
                  Dimensions ({catMeta.widthLabel}{catMeta.showDepth ? ` × ${catMeta.depthLabel}` : ''} × {catMeta.heightLabel} cm)
                </label>
              </div>
              <div className={`grid gap-2 ${catMeta.showDepth ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <input
                  ref={widthInputRef}
                  type="number"
                  enterKeyHint="next"
                  placeholder={catMeta.widthLabel}
                  className={`w-full px-3 py-4 rounded-xl border-none font-bold outline-none text-sm tabular-nums text-center appearance-none [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-4 transition-all ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                  value={formData.width}
                  onChange={e => setFormData({ ...formData, width: e.target.value })}
                  onKeyDown={(e) => handleEnterFocus(e, catMeta.showDepth ? depthInputRef : heightInputRef)}
                />
                {catMeta.showDepth && (
                  <input
                    ref={depthInputRef}
                    type="number"
                    enterKeyHint="next"
                    placeholder={catMeta.depthLabel}
                    className={`w-full px-3 py-4 rounded-xl border-none font-bold outline-none text-sm tabular-nums text-center appearance-none [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-4 transition-all ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                    value={formData.depth}
                    onChange={e => setFormData({ ...formData, depth: e.target.value })}
                    onKeyDown={(e) => handleEnterFocus(e, heightInputRef)}
                  />
                )}
                <input
                  ref={heightInputRef}
                  type="number"
                  enterKeyHint="done"
                  placeholder={catMeta.heightLabel}
                  className={`w-full px-3 py-4 rounded-xl border-none font-bold outline-none text-sm tabular-nums text-center appearance-none [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-4 transition-all ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
                  value={formData.height}
                  onChange={e => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-stone-400 ml-2">L'histoire de l'objet</label>
            <textarea
              placeholder="Décrivez l'origine du bois, le temps de travail, les détails uniques..."
              className={`w-full p-5 rounded-2xl border-none font-bold text-sm h-64 overflow-y-auto overscroll-contain resize-none outline-none focus:ring-4 transition-all shadow-inner ${darkMode ? 'bg-stone-900 text-white ring-stone-700 placeholder:text-stone-600' : 'bg-stone-50 text-stone-900 ring-stone-100'}`}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              onWheelCapture={handleDescriptionWheelCapture}
            />
          </div>
        </div>
      </div>

      {/* Metrics Display (Responsive Fix) */}
      {(totalOriginalSize > 0 || totalCompressedSize > 0) && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-6 gap-6 mt-4 border-t border-dashed border-stone-700/30">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-tighter">Diagnostic Poids</p>
            <div className="text-[11px] font-mono leading-tight">
              <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>Initial: {formatBytes(totalOriginalSize)}</span>
              {totalCompressedSize > 0 && (
                <div className="text-emerald-500 font-bold mt-1">
                  Optimisé: {formatBytes(totalCompressedSize)}
                  <span className="ml-2 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">-{((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
            {/* Download Button */}
            {totalCompressedSize > 0 && (
              <button
                onClick={handleDownloadImages}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 ${darkMode ? 'bg-stone-700 text-stone-300 hover:bg-stone-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                <Download size={16} /> Télécharger
              </button>
            )}
          </div>
        </div>
      )}


      <div className={`flex flex-col items-end gap-3 border-t pt-6 ${darkMode ? 'border-stone-700' : 'border-stone-100'}`}>
        {msg && <div className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border shadow-sm ${msg.includes('✅') ? (darkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-600 border-emerald-100') : (darkMode ? 'bg-red-950/40 text-red-400 border-red-900/40' : 'bg-red-50 text-red-600 border-red-100')}`}>{msg}</div>}
        <button onClick={addMeuble} disabled={uploading} className={`w-full md:w-auto px-16 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50 ${darkMode ? 'bg-white text-stone-900 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
          {editData ? "Confirmer les modifications" : "Publier l'ouvrage"}
        </button>
      </div>

      <ImageCropperModal
        isOpen={cropperConfig.isOpen}
        image={cropperConfig.image}
        aspect={cropperConfig.aspect}
        onClose={() => setCropperConfig(prev => ({ ...prev, isOpen: false }))}
        onCropComplete={handleCropComplete}
        darkMode={darkMode}
      />
    </div>
  );
};

export default AdminForm;
