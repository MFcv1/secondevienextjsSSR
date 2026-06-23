import React, { useEffect, useMemo, useState } from 'react';
import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Database,
    Download,
    Eye,
    FileText,
    Gauge,
    GripHorizontal,
    Home,
    Image as ImageIcon,
    Layers,
    LayoutGrid,
    Link,
    Monitor,
    Package,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    Smartphone,
    Store,
    Tags,
    Trash2,
    Type,
    Upload,
    X,
} from 'lucide-react';

import { db } from '../config/firebase';
import { getStorageInstance } from '../config/firebaseStorage';
import KIT_CONFIG, { GALLERY_HERO_PRESET_ENTRIES, GALLERY_HERO_PRESETS, resolveGalleryHeroImage } from '../config/constants';
import AdminImageCard from './components/AdminImageCard';
import ImageCropperModal from './components/ImageCropperModal';
import TextEditorModal from './components/TextEditorModal';

const DOC_IDS = {
    about: 'homepage_images',
    gallery: 'gallery_app',
};

const PAGE_MAP = [
    {
        id: 'overview',
        label: 'Pilotage',
        route: 'site entier',
        docId: null,
        tone: 'ink',
        icon: LayoutGrid,
        description: 'Vue globale des surfaces statiques, des verrous SEO et des zones connectées.',
    },
    {
        id: 'gallery',
        label: 'Galerie commerciale',
        route: '/',
        docId: DOC_IDS.gallery,
        tone: 'emerald',
        icon: Store,
        description: 'Home commerce-first, catégories, avant/après, hero et bandeau.',
        seo: 'homeMeta + sitemap + contenu visible',
        status: 'connecté',
    },
    {
        id: 'about',
        label: 'À propos',
        route: '/a-propos',
        docId: DOC_IDS.about,
        tone: 'amber',
        icon: Home,
        description: 'Ancienne vitrine : hero, pièces manifesto, process et FAQ.',
        seo: 'aboutMeta + page E-E-A-T',
        status: 'connecté',
    },
    {
        id: 'categories',
        label: 'Catégories',
        route: '/categorie/*',
        docId: null,
        tone: 'blue',
        icon: Tags,
        description: 'Textes SEO et FAQ catégories protégés par le code et les Functions.',
        seo: 'categoryMeta + CollectionPage + ItemList',
        status: 'verrouillé',
    },
    {
        id: 'products',
        label: 'Produits',
        route: '/produit/*',
        docId: null,
        tone: 'rose',
        icon: Package,
        description: 'SEO produit pilote par les fiches Publication et les WebP principaux.',
        seo: 'productMeta + Product JSON-LD',
        status: 'via publication',
    },
];

const GOVERNANCE_ITEMS = [
    {
        title: 'URLs publiques',
        body: 'Les pages indexables utilisent des routes propres: /, /a-propos, /categorie/* et /produit/*.',
        icon: Link,
        state: 'OK',
    },
    {
        title: 'Metas serveur',
        body: 'Les Functions homeMeta, aboutMeta, categoryMeta et productMeta injectent title, canonical, OG et JSON-LD.',
        icon: Search,
        state: 'Protégé',
    },
    {
        title: 'Images produits',
        body: 'Les nouvelles publications creent un WebP optimise unique et un nettoyage Storage existe cote Functions.',
        icon: Gauge,
        state: 'Actif',
    },
    {
        title: 'Images statiques',
        body: 'La Personnalisation publie un WebP optimise unique et nettoie les anciens fichiers Storage.',
        icon: ImageIcon,
        state: 'Actif',
    },
];

const GALLERY_SECTIONS = [
    {
        pageId: 'gallery',
        docId: DOC_IDS.gallery,
        storageFolder: 'gallery',
        section: 'Hero commercial',
        description: 'H1, promesse, CTA et bandeau annonces de la home galerie.',
        priority: 'SEO critique',
        items: [
            {
                key: 'header_texts',
                label: 'Hero galerie',
                format: 'Textes SEO visibles',
                isTextOnly: true,
                textSchema: [
                    { key: 'banner_text', label: 'Ligne courte sur image', type: 'text', placeholder: 'Mobilier restauré autour de Marseille' },
                    { key: 'hero_title', label: 'H1 / titre hero', type: 'textarea', placeholder: 'Mobilier ancien restauré en Provence' },
                    { key: 'hero_subtitle', label: 'Sous-titre', type: 'text', placeholder: 'Pièces uniques, bois ancien et livraison possible en France' },
                    { key: 'hero_btn', label: 'Bouton', type: 'text', placeholder: 'Voir les pièces' },
                ],
            },
            {
                key: 'announcement_banner',
                label: 'Bandeau annonces',
                format: 'Messages defilants',
                isTextOnly: true,
                textSchema: [
                    { key: 'msg_1', label: 'Message 1', type: 'text', placeholder: 'Livraison possible en France selon les pièces' },
                    { key: 'msg_2', label: 'Message 2', type: 'text', placeholder: 'Paiement en plusieurs fois selon disponibilité' },
                    { key: 'msg_3', label: 'Message 3', type: 'text', placeholder: 'Pièces anciennes restaurées une par une' },
                    { key: 'msg_4', label: 'Message 4', type: 'text', placeholder: 'Nouveaux arrivages régulièrement' },
                ],
            },
        ],
    },
    {
        pageId: 'gallery',
        docId: DOC_IDS.gallery,
        storageFolder: 'gallery',
        section: 'Catégories vitrines',
        description: 'Images des cartes de catégories visibles sur la galerie.',
        priority: 'Maillage interne',
        items: [
            { key: 'cat_buffets', label: 'Buffets', format: 'Portrait (4:5)', aspectRaw: 4 / 5, default: null },
            { key: 'cat_armoires', label: 'Armoires', format: 'Portrait (4:5)', aspectRaw: 4 / 5, default: null },
            { key: 'cat_miroirs', label: 'Miroirs', format: 'Portrait (4:5)', aspectRaw: 4 / 5, default: null },
            { key: 'cat_commodes', label: 'Commodes', format: 'Portrait (4:5)', aspectRaw: 4 / 5, default: null },
        ],
    },
    {
        pageId: 'gallery',
        docId: DOC_IDS.gallery,
        storageFolder: 'gallery',
        section: 'Avant / après',
        description: 'Projets de restauration et textes associés.',
        priority: 'Preuve metier',
        items: [1, 2, 3].flatMap((id) => ([
            {
                key: `project_${id}`,
                label: `Projet ${id} - texte`,
                format: 'Texte seul',
                isTextOnly: true,
                textSchema: [
                    { key: 'tag', label: 'Tag', type: 'text', placeholder: 'Sablage & Patine' },
                    { key: 'title', label: 'Titre du projet', type: 'text', placeholder: 'La commode celadon' },
                    { key: 'desc', label: 'Description courte', type: 'textarea', placeholder: 'Sublimation du veinage et protection mate.' },
                    { key: 'accent', label: 'Couleur hex', type: 'text', placeholder: '#A68A64' },
                ],
            },
            { key: `project_${id}_avant`, label: `Projet ${id} - avant`, format: 'Paysage (16:10)', aspectRaw: 16 / 10, default: null },
            { key: `project_${id}_apres`, label: `Projet ${id} - après`, format: 'Paysage (16:10)', aspectRaw: 16 / 10, default: null },
        ])),
    },
    {
        pageId: 'gallery',
        docId: DOC_IDS.gallery,
        storageFolder: 'gallery',
        section: 'Mur social',
        description: 'Images éditoriales du module inspiration.',
        priority: 'Confiance visuelle',
        items: [1, 2, 3, 4].map((id) => ({
            key: `insta_${id}`,
            label: `Image inspiration ${id}`,
            format: 'Carre (1:1)',
            aspectRaw: 1,
            default: null,
        })),
    },
];

const ABOUT_SECTIONS = [
    {
        pageId: 'about',
        docId: DOC_IDS.about,
        storageFolder: 'homepage',
        section: 'Hero À propos',
        description: 'Premier écran de la page atelier / histoire.',
        priority: 'Image LCP',
        items: [
            {
                key: 'about_hero',
                label: 'Image hero',
                format: 'Paysage (16:9)',
                aspectRaw: 16 / 9,
                default: 'https://images.unsplash.com/photo-1765288115711-25db755b8e31?auto=format&fit=crop&q=80&w=2560',
                textSchema: [
                    { key: 'eyebrow', label: 'Ligne courte', type: 'text', placeholder: "Sud de la France - La Cadière-d'Azur" },
                    { key: 'title', label: 'Titre ligne 1', type: 'text', placeholder: "L'âme des" },
                    { key: 'highlight', label: 'Titre accent', type: 'text', placeholder: 'objets vécus' },
                    { key: 'description', label: 'Paragraphe', type: 'textarea', placeholder: 'Des pièces uniques, restaurées avec soin...' },
                    { key: 'cta', label: 'Bouton', type: 'text', placeholder: "Visiter l'Atelier" },
                ],
            },
        ],
    },
    {
        pageId: 'about',
        docId: DOC_IDS.about,
        storageFolder: 'homepage',
        section: 'Pièces manifesto',
        description: 'Les trois blocs éditoriaux de la page À propos.',
        priority: 'Storytelling',
        items: [
            {
                key: 'manifesto_1',
                label: 'Pièce 1',
                format: 'Portrait (3:4)',
                default: '/images/about/about-1.webp',
                textSchema: [
                    { key: 'title', label: 'Titre', type: 'text', placeholder: 'La Commode Céladon' },
                    { key: 'desc', label: 'Description', type: 'textarea', placeholder: 'Mise en valeur dans une douce teinte sauge...' },
                    { key: 'tag', label: 'Tag', type: 'text', placeholder: 'Pièce unique' },
                ],
            },
            {
                key: 'manifesto_2',
                label: 'Pièce 2',
                format: 'Portrait (3:4)',
                default: '/images/about/about-2.webp',
                textSchema: [
                    { key: 'title', label: 'Titre', type: 'text', placeholder: 'Le Grand Vaisselier' },
                    { key: 'desc', label: 'Description', type: 'textarea', placeholder: 'Une prestance architecturale rare...' },
                    { key: 'tag', label: 'Tag', type: 'text', placeholder: 'Pièce unique' },
                ],
            },
            {
                key: 'manifesto_3',
                label: 'Pièce 3',
                format: 'Portrait (3:4)',
                default: '/images/about/about-3.webp',
                textSchema: [
                    { key: 'title', label: 'Titre', type: 'text', placeholder: 'Le Chevet provençal' },
                    { key: 'desc', label: 'Description', type: 'textarea', placeholder: 'Authenticité dans ses dimensions les plus charmantes...' },
                    { key: 'tag', label: 'Tag', type: 'text', placeholder: 'Pièce unique' },
                ],
            },
        ],
    },
    {
        pageId: 'about',
        docId: DOC_IDS.about,
        storageFolder: 'homepage',
        section: 'Rituel de restauration',
        description: 'Les étapes métier de la section savoir-faire.',
        priority: 'E-E-A-T',
        items: [1, 2, 3, 4].map((id) => ({
            key: `process_${id}`,
            label: `Étape ${id}`,
            format: 'Texte seul',
            isTextOnly: true,
            textSchema: [
                { key: 't', label: "Titre de l'étape", type: 'text', placeholder: id === 1 ? 'La Chine' : `Étape ${id}` },
                { key: 'd', label: 'Description', type: 'textarea', placeholder: 'Expliquez le geste, la matière et le résultat.' },
                { key: 'info', label: 'Tag court', type: 'text', placeholder: 'Atelier' },
            ],
        })),
    },
    {
        pageId: 'about',
        docId: DOC_IDS.about,
        storageFolder: 'homepage',
        section: 'FAQ visible',
        description: 'Questions visibles sur /a-propos. Ne pas ajouter de FAQ schema si elle devient invisible.',
        priority: 'SEO confiance',
        items: [
            {
                key: 'faq_main',
                label: 'Questions atelier',
                format: 'Texte seul',
                isTextOnly: true,
                textSchema: [1, 2, 3, 4, 5].flatMap((id) => ([
                    { key: `q${id}`, label: `Question ${id}`, type: 'text', placeholder: id === 1 ? "Comment se passe la livraison ?" : `Question ${id}` },
                    { key: `a${id}`, label: `Reponse ${id}`, type: 'textarea', placeholder: 'Reponse claire, utile et verifiable.' },
                ])),
            },
        ],
    },
];

const PERSONALIZATION_SECTIONS = [...GALLERY_SECTIONS, ...ABOUT_SECTIONS];

const getPageById = (id) => PAGE_MAP.find((page) => page.id === id) || PAGE_MAP[0];

const parseAspect = (formatStr) => {
    if (!formatStr) return 1;
    const match = formatStr.match(/\(([\d.]+):([\d.]+)\)/);
    if (match) return parseFloat(match[1]) / parseFloat(match[2]);
    if (formatStr.toLowerCase().includes('portrait')) return 3 / 4;
    if (formatStr.toLowerCase().includes('paysage')) return 16 / 9;
    return 1;
};

const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`;
};

const getSafeStorageName = (value) => String(value || 'image')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image';

const getItemTextKey = (item) => `${item.key}_text`;
const getItemVariantsKey = (itemOrKey) => `${typeof itemOrKey === 'string' ? itemOrKey : itemOrKey.key}_variants`;

const getTextCompletion = (schema = [], value = {}) => {
    if (!schema.length) return 1;
    const filled = schema.filter((field) => {
        const fieldValue = value?.[field.key];
        if (field.type === 'toggle') return fieldValue !== undefined;
        return String(fieldValue || '').trim().length > 0;
    }).length;
    return filled / schema.length;
};

const getStoragePathFromUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('/o/')) return '';
    try {
        const parsed = new URL(url);
        const encodedPath = parsed.pathname.split('/o/')[1];
        return encodedPath ? decodeURIComponent(encodedPath) : '';
    } catch {
        return '';
    }
};

const deleteStorageUrl = async (url) => {
    const path = getStoragePathFromUrl(url);
    if (!path) return;
    try {
        const storage = await getStorageInstance();
        await deleteObject(ref(storage, path));
    } catch (error) {
        console.warn('Static media cleanup skipped:', error.message);
    }
};

const collectVariantUrls = (variants) => {
    if (!variants || typeof variants !== 'object') return [];
    return Object.values(variants).filter((url) => typeof url === 'string' && url);
};

const deleteStaticMediaUrls = async (urls = []) => {
    const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
    await Promise.all(uniqueUrls.map((url) => deleteStorageUrl(url)));
};

const getHeroEntryStorageUrls = (entry) => {
    const resolved = resolveGalleryHeroImage(entry);
    return [
        resolved?.src,
        ...collectVariantUrls(resolved?.variants || entry?.variants),
    ].filter(Boolean);
};

const uploadStaticWebpImage = async (file, item, uploadKey) => {
    const folder = item.storageFolder || 'personalization';
    const baseName = `${getSafeStorageName(uploadKey)}_${Date.now()}`;
    const sourceFile = new File([file], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
    });
    const storage = await getStorageInstance();
    const storageRef = ref(storage, `${folder}/${sourceFile.name}`);
    const uploadedUrls = [];

    try {
        await uploadBytes(storageRef, sourceFile, {
            cacheControl: 'public, max-age=31536000, immutable',
            contentType: 'image/webp',
        });
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
        return {
            fullUrl: url,
            totalBytes: sourceFile.size,
            uploadedUrls,
        };
    } catch (error) {
        await deleteStaticMediaUrls(uploadedUrls);
        throw error;
    }
};

const getStoredHeroBase = (storedHeroImages) => (
    storedHeroImages.length > 0 ? [...storedHeroImages] : [...GALLERY_HERO_PRESET_ENTRIES]
);

const removeDocFieldFromState = (docId, field, setter) => {
    setter((prev) => {
        const nextDoc = { ...(prev[docId] || {}) };
        delete nextDoc[field];
        return { ...prev, [docId]: nextDoc };
    });
};

const getSectionStats = (section, documents) => {
    const data = documents[section.docId] || {};
    return section.items.reduce((acc, item) => {
        const hasMedia = item.isTextOnly || Boolean(data[item.key] || item.default);
        const textValue = data[getItemTextKey(item)] || {};
        const textCompletion = getTextCompletion(item.textSchema, textValue);

        acc.total += 1;
        if (hasMedia) acc.media += 1;
        if (!item.textSchema || textCompletion >= 1) acc.text += 1;
        if (item.textSchema && textCompletion > 0 && textCompletion < 1) acc.partial += 1;
        return acc;
    }, { total: 0, media: 0, text: 0, partial: 0 });
};

const toneClasses = {
    ink: 'bg-stone-950 text-white border-stone-900',
    emerald: 'bg-emerald-950 text-emerald-50 border-emerald-900',
    amber: 'bg-amber-950 text-amber-50 border-amber-900',
    blue: 'bg-sky-950 text-sky-50 border-sky-900',
    rose: 'bg-rose-950 text-rose-50 border-rose-900',
};

const softToneClasses = {
    ink: 'bg-stone-100 text-stone-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700',
};

const AdminHomepage = ({ darkMode = false }) => {
    const [activePage, setActivePage] = useState('overview');
    const [documents, setDocuments] = useState({ [DOC_IDS.about]: {}, [DOC_IDS.gallery]: {} });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);
    const [msg, setMsg] = useState('');
    const [lastOptimization, setLastOptimization] = useState(null);
    const [editingTextItem, setEditingTextItem] = useState(null);
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [cropperConfig, setCropperConfig] = useState({
        isOpen: false,
        image: null,
        aspect: 1,
        originalSize: 0,
        item: null,
        mode: 'single',
    });

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const entries = await Promise.all(Object.values(DOC_IDS).map(async (docId) => {
                    const snap = await getDoc(doc(db, 'sys_metadata', docId));
                    return [docId, snap.exists() ? snap.data() : {}];
                }));
                setDocuments(Object.fromEntries(entries));
            } catch (error) {
                console.error('Error fetching personalization config:', error);
                setMsg(`Erreur chargement: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const editableSections = useMemo(() => {
        if (activePage === 'overview') return PERSONALIZATION_SECTIONS;
        return PERSONALIZATION_SECTIONS.filter((section) => section.pageId === activePage);
    }, [activePage]);

    const overviewStats = useMemo(() => {
        const totalItems = PERSONALIZATION_SECTIONS.reduce((count, section) => count + section.items.length, 0);
        const connectedPages = PAGE_MAP.filter((page) => page.docId).length;
        const textItems = PERSONALIZATION_SECTIONS.flatMap((section) => section.items).filter((item) => item.textSchema?.length).length;
        const customImages = PERSONALIZATION_SECTIONS.reduce((count, section) => {
            const data = documents[section.docId] || {};
            return count + section.items.filter((item) => !item.isTextOnly && data[item.key]).length;
        }, 0);

        return { totalItems, connectedPages, textItems, customImages };
    }, [documents]);

    const storedHeroImages = useMemo(() => {
        const value = documents[DOC_IDS.gallery]?.hero_images;
        return Array.isArray(value) ? value.filter(Boolean) : [];
    }, [documents]);
    const isUsingDefaultHeroImages = storedHeroImages.length === 0;
    const heroImages = useMemo(() => (
        (storedHeroImages.length > 0 ? storedHeroImages : GALLERY_HERO_PRESETS)
            .map(resolveGalleryHeroImage)
            .filter((entry) => entry?.src)
    ), [storedHeroImages]);

    const activePageMeta = getPageById(activePage);

    const setDocState = (docId, patch) => {
        setDocuments((prev) => ({
            ...prev,
            [docId]: {
                ...(prev[docId] || {}),
                ...patch,
            },
        }));
    };

    const handleFileChange = (file, item, section) => {
        if (!file || item.isTextOnly) return;

        const reader = new window.FileReader();
        reader.onload = () => {
            setCropperConfig({
                isOpen: true,
                image: reader.result,
                aspect: item.aspectRaw || parseAspect(item.format),
                originalSize: file.size,
                item: { ...item, docId: section.docId, pageId: section.pageId, storageFolder: section.storageFolder },
                mode: 'single',
            });
        };
        reader.readAsDataURL(file);
    };

    const handleHeroFileChange = (file, index = null) => {
        if (!file) return;

        const reader = new window.FileReader();
        reader.onload = () => {
            setCropperConfig({
                isOpen: true,
                image: reader.result,
                aspect: 16 / 9,
                originalSize: file.size,
                item: { key: index, docId: DOC_IDS.gallery, pageId: 'gallery', storageFolder: 'gallery' },
                mode: 'heroArray',
            });
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob) => {
        const { item, mode, originalSize } = cropperConfig;
        if (!item) return;

        const uploadKey = mode === 'heroArray' ? `hero_${item.key ?? 'new'}` : item.key;
        setUploading(uploadKey);
        setMsg('Optimisation WebP...');

        let uploadedUrls = [];

        try {
            const fileName = `${getSafeStorageName(uploadKey)}_${Date.now()}.webp`;
            const fileToUpload = new File([croppedBlob], fileName, { type: 'image/webp' });
            setMsg('Envoi WebP optimise...');
            const uploadResult = await uploadStaticWebpImage(fileToUpload, item, uploadKey);
            uploadedUrls = uploadResult.uploadedUrls || [uploadResult.fullUrl].filter(Boolean);
            const docRef = doc(db, 'sys_metadata', item.docId);

            setMsg('Sauvegarde Firestore...');
            if (mode === 'heroArray') {
                const nextHeroImages = getStoredHeroBase(storedHeroImages);
                const payload = {
                    src: uploadResult.fullUrl,
                    objectPosition: 'center center',
                };
                const previousUrls = Number.isInteger(item.key)
                    ? getHeroEntryStorageUrls(nextHeroImages[item.key])
                    : [];
                if (Number.isInteger(item.key)) nextHeroImages[item.key] = payload;
                else nextHeroImages.push(payload);
                await setDoc(docRef, { hero_images: nextHeroImages }, { merge: true });
                await deleteStaticMediaUrls(previousUrls.filter((url) => !uploadedUrls.includes(url)));
                setDocState(item.docId, { hero_images: nextHeroImages });
            } else {
                const previousUrl = documents[item.docId]?.[item.key];
                const variantsKey = getItemVariantsKey(item);
                const previousVariants = documents[item.docId]?.[variantsKey];
                await setDoc(docRef, {
                    [item.key]: uploadResult.fullUrl,
                    [variantsKey]: deleteField(),
                }, { merge: true });
                await deleteStaticMediaUrls([
                    previousUrl,
                    ...collectVariantUrls(previousVariants),
                ].filter((url) => !uploadedUrls.includes(url)));
                setDocState(item.docId, {
                    [item.key]: uploadResult.fullUrl,
                });
                removeDocFieldFromState(item.docId, variantsKey, setDocuments);
            }

            setLastOptimization({
                key: uploadKey,
                original: originalSize,
                compressed: uploadResult.totalBytes,
            });
            setMsg('Mise à jour publiée.');
            window.setTimeout(() => setMsg(''), 3500);
        } catch (error) {
            await deleteStaticMediaUrls(uploadedUrls);
            console.error('Critical upload error:', error);
            setMsg(`Erreur: ${error.message}`);
        } finally {
            setUploading(null);
            setCropperConfig({ isOpen: false, image: null, aspect: 1, originalSize: 0, item: null, mode: 'single' });
        }
    };

    const handleReset = async (item, section) => {
        if (!window.confirm('Revenir au fallback code pour cet element ?')) return;

        const docRef = doc(db, 'sys_metadata', section.docId);
        const previousUrl = documents[section.docId]?.[item.key];
        const variantsKey = getItemVariantsKey(item);
        const previousVariants = documents[section.docId]?.[variantsKey];
        await setDoc(docRef, { [item.key]: deleteField(), [variantsKey]: deleteField() }, { merge: true });
        await deleteStaticMediaUrls([previousUrl, ...collectVariantUrls(previousVariants)]);

        setDocuments((prev) => {
            const nextDoc = { ...(prev[section.docId] || {}) };
            delete nextDoc[item.key];
            delete nextDoc[variantsKey];
            return { ...prev, [section.docId]: nextDoc };
        });
    };

    const handleRemoveHeroImage = async (index) => {
        if (!window.confirm('Retirer cette image du hero galerie ?')) return;
        const baseHeroImages = getStoredHeroBase(storedHeroImages);
        const removedUrls = getHeroEntryStorageUrls(baseHeroImages[index]);
        const nextHeroImages = baseHeroImages.filter((_, currentIndex) => currentIndex !== index);
        await setDoc(doc(db, 'sys_metadata', DOC_IDS.gallery), { hero_images: nextHeroImages }, { merge: true });
        await deleteStaticMediaUrls(removedUrls);
        setDocState(DOC_IDS.gallery, { hero_images: nextHeroImages });
    };

    const handleMoveHeroImage = async (fromIndex, direction) => {
        const toIndex = fromIndex + direction;
        if (toIndex < 0 || toIndex >= heroImages.length) return;
        const nextHeroImages = getStoredHeroBase(storedHeroImages);
        const [moved] = nextHeroImages.splice(fromIndex, 1);
        nextHeroImages.splice(toIndex, 0, moved);
        await setDoc(doc(db, 'sys_metadata', DOC_IDS.gallery), { hero_images: nextHeroImages }, { merge: true });
        setDocState(DOC_IDS.gallery, { hero_images: nextHeroImages });
    };

    const handleResetHeroImages = async () => {
        if (!window.confirm('Supprimer les anciennes slides custom et revenir aux 8 images du dossier imagehero ?')) return;

        const previousHeroImages = [...storedHeroImages];
        await setDoc(doc(db, 'sys_metadata', DOC_IDS.gallery), { hero_images: deleteField() }, { merge: true });
        await deleteStaticMediaUrls(previousHeroImages.flatMap(getHeroEntryStorageUrls));
        removeDocFieldFromState(DOC_IDS.gallery, 'hero_images', setDocuments);
        setMsg('Hero galerie remis sur les 8 images imagehero.');
        window.setTimeout(() => setMsg(''), 3500);
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'image.webp';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn('Download failed, opening image:', error);
            window.open(url, '_blank');
        }
    };

    const handleEditText = (item, section) => {
        if (!item.textSchema?.length) return;
        setEditingTextItem({ ...item, docId: section.docId, pageId: section.pageId });
        setIsTextModalOpen(true);
    };

    const handleSaveText = async (key, formData) => {
        if (!editingTextItem?.docId) return;

        try {
            setMsg('Sauvegarde du contenu...');
            const textKey = getItemTextKey({ key });
            await setDoc(doc(db, 'sys_metadata', editingTextItem.docId), { [textKey]: formData }, { merge: true });
            setDocState(editingTextItem.docId, { [textKey]: formData });
            setIsTextModalOpen(false);
            setEditingTextItem(null);
            setMsg('Contenu sauvegarde.');
            window.setTimeout(() => setMsg(''), 2500);
        } catch (error) {
            console.error('Text save error:', error);
            setMsg(`Erreur texte: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-[420px] rounded-[2rem] border p-10 text-center ${darkMode ? 'border-white/10 bg-white/5 text-white' : 'border-stone-200 bg-white text-stone-700'}`}>
                <div className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-stone-300 border-t-stone-900 animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.25em]">Chargement de la personnalisation</p>
            </div>
        );
    }

    return (
        <div className={`space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 ${darkMode ? 'text-white' : 'text-stone-950'}`}>
            <section className={`relative overflow-hidden rounded-[2.25rem] border p-1.5 ${darkMode ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-100/70'}`}>
                <div className={`relative overflow-hidden rounded-[calc(2.25rem-0.375rem)] p-6 md:p-8 lg:p-10 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
                    <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(90deg,currentColor 1px,transparent 1px),linear-gradient(currentColor 1px,transparent 1px)', backgroundSize: '42px 42px' }} />
                    <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                        <div className="max-w-5xl">
                            <p className={`mb-4 text-[10px] font-black uppercase tracking-[0.28em] ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                Studio admin / gouvernance statique
                            </p>
                            <h2 className="max-w-5xl text-4xl font-black tracking-[-0.04em] md:text-6xl">
                                Personnalisation du site
                            </h2>
                            <p className={`mt-5 max-w-3xl text-sm leading-7 md:text-base ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                                Pilotez les images, textes et surfaces fixes sans casser les routes propres, les metas serveur, les ratios responsive et les WebP publies.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['Elements', overviewStats.totalItems],
                                ['Pages liees', overviewStats.connectedPages],
                                ['Blocs texte', overviewStats.textItems],
                                ['Images custom', overviewStats.customImages],
                            ].map(([label, value]) => (
                                <div key={label} className={`rounded-3xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-stone-50'}`}>
                                    <div className="text-2xl font-black tracking-tight">{value}</div>
                                    <div className={`mt-1 text-[9px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(msg || lastOptimization) && (
                        <div className="relative z-10 mt-8 flex flex-col gap-3 md:flex-row md:items-center">
                            {msg && (
                                <div className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50 text-amber-700'}`}>
                                    <Gauge size={14} />
                                    {msg}
                                </div>
                            )}
                            {lastOptimization && (
                                <div className={`inline-flex w-fit items-center gap-3 rounded-full px-4 py-2 text-[10px] font-bold ${darkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                                    <span className="font-black uppercase tracking-[0.18em]">WebP</span>
                                    <span>{formatBytes(lastOptimization.original)} vers {formatBytes(lastOptimization.compressed)}</span>
                                    {lastOptimization.original > 0 && (
                                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-white">
                                            -{Math.max(0, Math.round((1 - lastOptimization.compressed / lastOptimization.original) * 100))}%
                                        </span>
                                    )}
                                    <button type="button" onClick={() => setLastOptimization(null)} className="rounded-full p-1 hover:bg-current/10" aria-label="Masquer le diagnostic">
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
                    {PAGE_MAP.map((page) => {
                        const Icon = page.icon;
                        const isActive = activePage === page.id;
                        return (
                            <button
                                key={page.id}
                                type="button"
                                onClick={() => setActivePage(page.id)}
                                className={`group w-full rounded-[1.65rem] border p-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                    isActive
                                        ? `${toneClasses[page.tone]} shadow-[0_24px_60px_rgba(15,23,42,0.18)]`
                                        : darkMode
                                            ? 'border-white/10 bg-white/[0.04] text-stone-300 hover:bg-white/[0.07]'
                                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                                }`}
                            >
                                <div className={`rounded-[calc(1.65rem-0.25rem)] p-4 ${isActive ? 'bg-white/[0.07]' : ''}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isActive ? 'bg-white/[0.12] text-white' : softToneClasses[page.tone]}`}>
                                                <Icon size={17} strokeWidth={1.7} />
                                            </span>
                                            <div>
                                                <div className="text-sm font-black">{page.label}</div>
                                                <div className={`mt-0.5 text-[10px] font-bold ${isActive ? 'text-white/60' : darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{page.route}</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={15} className={`transition-transform ${isActive ? 'translate-x-0 opacity-80' : 'opacity-30 group-hover:translate-x-1'}`} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </aside>

                <div className="min-w-0 space-y-6">
                    <div className={`rounded-[2rem] border p-5 md:p-6 ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white'}`}>
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${softToneClasses[activePageMeta.tone]}`}>
                                        <activePageMeta.icon size={17} strokeWidth={1.7} />
                                    </span>
                                    <h3 className="text-2xl font-black tracking-[-0.03em] md:text-3xl">{activePageMeta.label}</h3>
                                    {activePageMeta.status && (
                                        <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${darkMode ? 'bg-white/10 text-white/70' : 'bg-stone-100 text-stone-500'}`}>
                                            {activePageMeta.status}
                                        </span>
                                    )}
                                </div>
                                <p className={`mt-3 max-w-3xl text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                                    {activePageMeta.description}
                                </p>
                            </div>

                            <div className="grid min-w-[220px] gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                                <div className={`flex items-center gap-2 rounded-full px-3 py-2 ${darkMode ? 'bg-white/[0.05] text-stone-300' : 'bg-stone-50 text-stone-500'}`}>
                                    <Database size={13} /> {activePageMeta.docId || 'code / produits'}
                                </div>
                                <div className={`flex items-center gap-2 rounded-full px-3 py-2 ${darkMode ? 'bg-white/[0.05] text-stone-300' : 'bg-stone-50 text-stone-500'}`}>
                                    <ShieldCheck size={13} /> {activePageMeta.seo || 'audit transversal'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {(activePage === 'overview' || activePage === 'gallery') && (
                        <HeroCarouselManager
                            darkMode={darkMode}
                            heroImages={heroImages}
                            isUsingDefaultHeroImages={isUsingDefaultHeroImages}
                            presetCount={GALLERY_HERO_PRESETS.length}
                            onFileSelect={handleHeroFileChange}
                            onRemove={handleRemoveHeroImage}
                            onMove={handleMoveHeroImage}
                            onReset={handleResetHeroImages}
                            uploading={uploading}
                        />
                    )}

                    {activePage === 'overview' && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {GOVERNANCE_ITEMS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className={`rounded-[1.75rem] border p-5 ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white'}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.warning ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                <Icon size={17} strokeWidth={1.7} />
                                            </span>
                                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${item.warning ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.state}</span>
                                        </div>
                                        <h4 className="mt-5 text-sm font-black">{item.title}</h4>
                                        <p className={`mt-2 text-xs leading-5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{item.body}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {(activePage === 'categories' || activePage === 'products') && (
                        <LockedSurfacePanel page={activePageMeta} darkMode={darkMode} />
                    )}

                    {editableSections.map((section) => {
                        const stats = getSectionStats(section, documents);
                        const pageMeta = getPageById(section.pageId);
                        return (
                            <section key={`${section.pageId}-${section.section}`} className={`rounded-[2rem] border p-1.5 ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-stone-100/70'}`}>
                                <div className={`rounded-[calc(2rem-0.375rem)] p-5 md:p-6 ${darkMode ? 'bg-[#111]' : 'bg-white'}`}>
                                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${softToneClasses[pageMeta.tone]}`}>
                                                    {pageMeta.route}
                                                </span>
                                                <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${darkMode ? 'bg-white/10 text-white/60' : 'bg-stone-100 text-stone-500'}`}>
                                                    {section.priority}
                                                </span>
                                            </div>
                                            <h4 className="mt-3 text-2xl font-black tracking-[-0.03em]">{section.section}</h4>
                                            <p className={`mt-2 max-w-2xl text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{section.description}</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <MiniStat label="media" value={`${stats.media}/${stats.total}`} darkMode={darkMode} />
                                            <MiniStat label="texte" value={`${stats.text}/${stats.total}`} darkMode={darkMode} />
                                            <MiniStat label="partiel" value={stats.partial} darkMode={darkMode} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        {section.items.map((item) => {
                                            const docData = documents[section.docId] || {};
                                            const currentImage = docData[item.key] || item.default;
                                            const isUpdating = uploading === item.key;
                                            const hasCustomImage = Boolean(docData[item.key]);
                                            const hasTextSchema = Boolean(item.textSchema?.length);

                                            return (
                                                <AdminImageCard
                                                    key={`${section.docId}-${item.key}`}
                                                    item={item}
                                                    currentImage={currentImage}
                                                    isUpdating={isUpdating}
                                                    darkMode={darkMode}
                                                    onFileSelect={(file) => handleFileChange(file, item, section)}
                                                    onDownload={() => currentImage && handleDownload(currentImage, `${item.key}.webp`)}
                                                    onReset={() => handleReset(item, section)}
                                                    hasCustomImage={hasCustomImage}
                                                    hasTextSchema={hasTextSchema}
                                                    onEditText={() => handleEditText(item, section)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            </section>

            <TextEditorModal
                isOpen={isTextModalOpen}
                onClose={() => setIsTextModalOpen(false)}
                onSave={handleSaveText}
                itemKey={editingTextItem?.key}
                fields={editingTextItem?.textSchema || []}
                initialData={documents[editingTextItem?.docId]?.[getItemTextKey(editingTextItem || {})] || {}}
                darkMode={darkMode}
            />

            <ImageCropperModal
                isOpen={cropperConfig.isOpen}
                image={cropperConfig.image}
                aspect={cropperConfig.aspect}
                onClose={() => setCropperConfig((prev) => ({ ...prev, isOpen: false }))}
                onCropComplete={handleCropComplete}
                darkMode={darkMode}
            />
        </div>
    );
};

const MiniStat = ({ label, value, darkMode }) => (
    <div className={`min-w-[72px] rounded-2xl px-3 py-2 ${darkMode ? 'bg-white/[0.05]' : 'bg-stone-50'}`}>
        <div className="text-sm font-black">{value}</div>
        <div className={`mt-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{label}</div>
    </div>
);

const HeroCarouselManager = ({ darkMode, heroImages, isUsingDefaultHeroImages, presetCount, onFileSelect, onRemove, onMove, onReset, uploading }) => (
    <section className={`rounded-[2rem] border p-1.5 ${darkMode ? 'border-white/10 bg-white/[0.035]' : 'border-stone-200 bg-stone-100/70'}`}>
        <div className={`rounded-[calc(2rem-0.375rem)] p-5 md:p-6 ${darkMode ? 'bg-[#111]' : 'bg-white'}`}>
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <Monitor size={16} />
                        </span>
                        <h4 className="text-xl font-black tracking-[-0.02em]">Hero carousel galerie</h4>
                    </div>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        Slides 16:9 de la home commerciale. La base active utilise les {presetCount} WebP du dossier imagehero.
                    </p>
                    <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isUsingDefaultHeroImages ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isUsingDefaultHeroImages ? 'Source locale imagehero' : 'Liste custom Firestore'}
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={isUsingDefaultHeroImages}
                        className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all disabled:cursor-not-allowed disabled:opacity-45 ${darkMode ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'}`}
                    >
                        <RotateCcw size={14} />
                        Remettre imagehero
                    </button>
                    <label className={`group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${darkMode ? 'border-white/10 bg-white text-stone-950 hover:bg-stone-200' : 'border-stone-900 bg-stone-950 text-white hover:bg-stone-800'}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => onFileSelect(event.target.files?.[0], null)} />
                        <Plus size={14} />
                        Ajouter une slide
                    </label>
                </div>
            </div>

            {heroImages.length === 0 ? (
                <div className={`rounded-[1.5rem] border border-dashed p-6 text-sm ${darkMode ? 'border-white/10 text-stone-400' : 'border-stone-200 text-stone-500'}`}>
                    Aucun hero custom pour le moment. Les 8 images WebP locales restent utilisees en fallback.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {heroImages.map((entry, index) => {
                        const src = entry?.src;
                        const isUpdating = uploading === `hero_${index}`;
                        return (
                            <div key={`${src}-${index}`} className={`group rounded-[1.5rem] border p-3 ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-stone-50'}`}>
                                <div className="aspect-video overflow-hidden rounded-[1.1rem] bg-stone-200">
                                    {src ? (
                                        <img src={src} alt={`Hero galerie ${index + 1}`} className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 ${isUpdating ? 'opacity-40 blur-sm' : ''}`} />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-400"><ImageIcon size={24} /></div>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">
                                            <GripHorizontal size={14} />
                                            Slide {index + 1}
                                        </div>
                                        <div className="mt-1 truncate text-[10px] font-bold text-stone-400">
                                            {entry?.preset ? entry.preset.replace('imagehero/', 'imagehero / ') : 'image custom optimisee'}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => onMove(index, -1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-600 shadow-sm disabled:opacity-30" disabled={index === 0} title="Monter">
                                            <ChevronRight size={13} className="-rotate-90" />
                                        </button>
                                        <button type="button" onClick={() => onMove(index, 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-600 shadow-sm disabled:opacity-30" disabled={index === heroImages.length - 1} title="Descendre">
                                            <ChevronRight size={13} className="rotate-90" />
                                        </button>
                                        <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-stone-600 shadow-sm" title="Remplacer">
                                            <input type="file" accept="image/*" className="hidden" onChange={(event) => onFileSelect(event.target.files?.[0], index)} />
                                            <Upload size={13} />
                                        </label>
                                        <button type="button" onClick={() => onRemove(index)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-red-500 shadow-sm" title="Supprimer">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </section>
);

const LockedSurfacePanel = ({ page, darkMode }) => (
    <div className={`rounded-[2rem] border p-6 ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white'}`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-950 text-white">
                        <ShieldCheck size={18} />
                    </span>
                    <div>
                        <h4 className="text-xl font-black">Surface protégée par le SEO technique</h4>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{page.route}</p>
                    </div>
                </div>
                <p className={`mt-5 max-w-3xl text-sm leading-7 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                    Cette zone ne doit pas devenir un éditeur libre : les produits et catégories alimentent les metas, le sitemap, les schemas et le maillage. Les changements passent par les onglets Publication, SEO et par les textes validés dans le code afin d’éviter les canonicals divergents.
                </p>
            </div>
            <div className={`rounded-[1.5rem] border p-4 ${darkMode ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
                {[
                    ['Route', page.route],
                    ['SEO', page.seo],
                    ['Catégories', `${KIT_CONFIG.productCategories.length} types`],
                    ['Validation', 'build:prod + view-source'],
                ].map(([label, value]) => (
                    <div key={label} className={`flex items-center justify-between gap-4 border-b py-3 text-xs last:border-b-0 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                        <span className={`font-black uppercase tracking-[0.16em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{label}</span>
                        <span className="text-right font-bold">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default AdminHomepage;
