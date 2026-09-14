'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { emitAnalyticsEvent } from '../shared/analyticsEvents';
import { serviceGroups } from '../shared/quoteServices';
import { createQuotePhotoId, createQuotePhotoQueue, isLikelyImageFile, quotePhotoErrorMessage } from './quotePhotoPrep';
import {
    QUOTE_CONTROL_HEIGHT,
    QUOTE_DROPZONE_HEIGHT,
    QUOTE_EASE,
    QUOTE_PANEL_PADDING,
    QUOTE_RADIUS_CARD,
    QUOTE_RADIUS_FIELD,
    QUOTE_RADIUS_PANEL,
    QUOTE_READABLE,
    QUOTE_SHELL,
    QUOTE_STEP_HEIGHT,
    QUOTE_STEP_PADDING,
    QUOTE_STEP_RADIUS,
    QUOTE_TYPE,
    quoteTokens,
} from './quoteTheme';

const MAX_PHOTOS = 10;

const IconBase = ({ size = 20, strokeWidth = 1.6, className = '', children }) => (
    <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {children}
    </svg>
);

const Check = (props) => (
    <IconBase {...props}>
        <path d="m20 6-11 11-5-5" />
    </IconBase>
);

const ArrowRight = (props) => (
    <IconBase {...props}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
    </IconBase>
);

const ArrowLeft = (props) => (
    <IconBase {...props}>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
    </IconBase>
);

const Close = (props) => (
    <IconBase {...props}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </IconBase>
);

const PhotoPlus = (props) => (
    <IconBase {...props}>
        <path d="M21 14V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m4 17 4.5-4.5 3 3" />
        <path d="M18 15v6" />
        <path d="M15 18h6" />
    </IconBase>
);

const Alert = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5" />
        <path d="M12 16.5h.01" />
    </IconBase>
);

const Retry = (props) => (
    <IconBase {...props}>
        <path d="M20 11a8 8 0 1 0-2.3 5.7" />
        <path d="M20 5v6h-6" />
    </IconBase>
);

const furnitureCards = [
    { id: 'buffet', label: 'Buffet', image: '/images/categories/buffets-config-rail.webp' },
    { id: 'armoire', label: 'Armoire', image: '/images/categories/armoires-config-rail.webp' },
    { id: 'commode', label: 'Commode', image: '/images/categories/commodes-config-rail.webp' },
    { id: 'miroir', label: 'Miroir', image: '/images/categories/miroirs-config-rail.webp' },
    { id: 'chaise', label: 'Chaise', image: 'https://firebasestorage.googleapis.com/v0/b/secondevienextjsssr.firebasestorage.app/o/furniture%2Fthumbnails%2Fcard_thumb_5ZBinIKs3IIj9ugh6ar9_0_thumb384_cac4c47aca97.webp?alt=media&token=4aba7696-9e2f-4957-afe1-7c36b17b7125' },
    { id: 'table', label: 'Table', image: 'https://firebasestorage.googleapis.com/v0/b/secondevienextjsssr.firebasestorage.app/o/furniture%2Fthumbnails%2Fcard_thumb_BfVsRJC01QMNDvx9Tldf_0_thumb384_15d13c1c4664.webp?alt=media&token=de92ff95-d87c-482c-a697-e810004f82bb' }
];

const allTypes = furnitureCards;

const conditionOptions = [
    { value: 'Bon état, entretien léger', label: 'Bon état', text: 'Entretien léger, patine à raviver.' },
    { value: 'Rayures ou marques visibles', label: 'Rayures ou marques', text: 'Défauts visibles en surface.' },
    { value: 'Structure fragilisée', label: 'Structure fragilisée', text: 'Assemblages ou pieds à reprendre.' },
    { value: 'Restauration complète', label: 'Restauration complète', text: 'Reprise intégrale du meuble.' }
];

const severityOptions = ['Légers', 'Modérés', 'Importants'];

const dimensionFields = [
    ['height', 'Hauteur', 'cm'],
    ['width', 'Largeur', 'cm'],
    ['depth', 'Profondeur', 'cm']
];

const reassurance = ['Devis gratuit', 'Réponse sous 48h', 'Sans engagement'];

// The admin editor uses this same catalogue of available services.

const allServices = serviceGroups.flatMap(group => group.services);

/* Un ecran = une seule question. */
const steps = [
    {
        id: 'type',
        label: 'Meuble',
        title: 'Quel meuble souhaitez-vous restaurer ?',
        hint: 'Choisissez la catégorie la plus proche.'
    },
    {
        id: 'etat',
        label: 'État',
        title: 'Dans quel état est-il ?',
        hint: 'Une seule réponse suffit, Anaïs affinera après vos photos.'
    },
    {
        id: 'photos',
        label: 'Photos',
        title: 'Montrez-nous votre meuble',
        hint: 'Deux ou trois photos suffisent pour un devis précis. Cette étape est facultative.'
    },
    {
        id: 'details',
        label: 'Détails',
        title: 'Décrivez votre projet',
        hint: 'Dites-nous ce que vous attendez de cette restauration.'
    },
    {
        id: 'prestations',
        label: 'Prestations',
        title: 'Quelles interventions souhaitez-vous ?',
        hint: 'Cochez ce qui vous parle, la sélection reste ajustable.'
    },
    {
        id: 'contact',
        label: 'Contact',
        title: 'Où vous envoyer le devis ?',
        hint: 'Devis gratuit et sans engagement, envoyé sous 48h.'
    },
    {
        id: 'estimation',
        label: 'Estimation',
        title: 'Votre estimation indicative',
        hint: "Vérifiez la fourchette et le détail avant d'envoyer votre demande."
    }
];

const CONTACT_STEP_INDEX = 5;
const ESTIMATE_STEP_INDEX = 6;

const emptyFields = {
    condition: '',
    description: '',
    height: '',
    width: '',
    depth: '',
    weight: '',
    severity: 'Modérés',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    location: '',
    notes: ''
};

const PHOTO_STEP_INDEX = 2;
const PHOTO_TILE_MAX = 320;
const PHOTO_TILE_MIN = 88;
const PHOTO_COMPACT_TILE = 132;
const DESKTOP_QUERY = '(min-width: 1024px)';

/*
 * Taille des vignettes selon leur nombre et la place reelle.
 * Desktop : le panneau a une hauteur fixe, on cherche la plus grande vignette
 * qui tient entierement (a taille egale, plus de colonnes = moins de lignes).
 * Mobile et tablette : le document defile, on fixe les colonnes par palier.
 */
const computePhotoGrid = ({ width, height, count, desktop }) => {
    if (!count || !width) return null;
    const gap = desktop ? 12 : 10;

    if (desktop && height > 0) {
        // A taille egale : moins de lignes, puis le moins de colonnes (lignes equilibrees).
        let best = { columns: 1, rows: count, size: 0 };
        for (let columns = 1; columns <= count; columns += 1) {
            const rows = Math.ceil(count / columns);
            const size = Math.min(
                PHOTO_TILE_MAX,
                (width - gap * (columns - 1)) / columns,
                (height - gap * (rows - 1)) / rows
            );
            if (size > best.size + 0.5 || (Math.abs(size - best.size) <= 0.5 && rows < best.rows)) {
                best = { columns, rows, size };
            }
        }
        if (best.size >= PHOTO_TILE_MIN) {
            return { columns: best.columns, size: Math.floor(best.size), gap, scroll: false };
        }
        const columns = Math.min(count, Math.max(1, Math.floor((width + gap) / (PHOTO_TILE_MIN + gap))));
        const size = Math.min(PHOTO_TILE_MAX, (width - gap * (columns - 1)) / columns);
        return { columns, size: Math.floor(size), gap, scroll: true };
    }

    const tiers = width < 480
        ? (count === 1 ? 1 : count <= 6 ? 2 : 3)
        : (count <= 2 ? 2 : count <= 6 ? 3 : 4);
    const size = Math.floor(Math.min(PHOTO_TILE_MAX + 40, (width - gap * (tiers - 1)) / tiers));
    return { columns: Math.min(tiers, count), size, gap, scroll: false };
};

const formatRange = (min, max) => `${min}€ – ${max}€`;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
const isValidPhone = (value) => value.replace(/[^\d+]/g, '').length >= 9;

const QuoteFormIsland = ({ initialDarkMode = false }) => {
    const darkMode = initialDarkMode;
    const t = quoteTokens(darkMode);

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState('forward');
    const [selectedType, setSelectedType] = useState('buffet');
    const [fields, setFields] = useState(emptyFields);
    const [selectedServices, setSelectedServices] = useState(() => {
        const defaults = {};
        allServices.forEach(service => {
            defaults[service.id] = Boolean(service.defaultSelected);
        });
        return defaults;
    });
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [submissionState, setSubmissionState] = useState({ status: 'idle', message: '' });
    const [dragging, setDragging] = useState(false);
    const [photoNotice, setPhotoNotice] = useState('');
    const [photoGrid, setPhotoGrid] = useState(null);

    const fileInputRef = useRef(null);
    const photoPickerRef = useRef(null);
    const photoBoardRef = useRef(null);
    const photoPreviewsRef = useRef([]);
    const photoQueueRef = useRef(null);
    const photoTasksRef = useRef(new Map());
    const railRef = useRef(null);
    const quoteStartTrackedRef = useRef(false);
    const submissionIdentityRef = useRef(null);
    const submittingRef = useRef(false);

    /*
     * useLayoutEffect et non useEffect : le shell doit disparaitre dans la
     * meme frame que l'apparition de l'island, sinon les deux coexistent
     * le temps d'une peinture et la page fait un bond.
     */
    useLayoutEffect(() => {
        document.getElementById('quote-ssr-form-shell')?.setAttribute('hidden', '');
        window.dispatchEvent(new Event('quote:form-ready'));
    }, []);

    /* Les transitions internes ne s'arment que lors d'une vraie navigation
     * utilisateur. Un effet de montage serait rejoue par React Strict Mode et
     * rendrait le premier panneau visible avant la fin de l'introduction. */
    const [stepMotionArmed, setStepMotionArmed] = useState(false);

    const panelMotion = stepMotionArmed ? 'quote-step' : '';
    const contentMotion = stepMotionArmed ? 'quote-stagger' : '';
    const cardsMotion = stepMotionArmed ? 'quote-cards' : '';
    const initialStepReveal = step === 0 && !stepMotionArmed;

    /* La liste des photos vit dans une ref synchrone : l'envoi et les
     * preparations asynchrones lisent toujours l'etat reel, pas un rendu passe. */
    const commitPhotos = useCallback((next) => {
        photoPreviewsRef.current = next;
        setPhotoPreviews(next);
    }, []);

    const patchPhoto = useCallback((id, patch) => {
        if (!photoPreviewsRef.current.some(photo => photo.id === id)) return false;
        commitPhotos(photoPreviewsRef.current.map(photo => (photo.id === id ? { ...photo, ...patch } : photo)));
        return true;
    }, [commitPhotos]);

    useEffect(() => () => {
        photoPreviewsRef.current.forEach(photo => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
        // Les traitements en cours ne doivent plus publier d'aperçu après un départ.
        photoPreviewsRef.current = [];
        photoTasksRef.current.clear();
        photoQueueRef.current = null;
    }, []);

    const trackQuoteStart = useCallback(() => {
        if (quoteStartTrackedRef.current) return;
        quoteStartTrackedRef.current = true;
        emitAnalyticsEvent('quote_start', null, null, { form: 'restoration' });
    }, []);

    const updateField = useCallback((name, value) => {
        trackQuoteStart();
        setFields(prev => ({ ...prev, [name]: value }));
        setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
    }, [trackQuoteStart]);

    const preparePhoto = useCallback((id, file) => {
        photoQueueRef.current ||= createQuotePhotoQueue();
        const isPresent = () => photoPreviewsRef.current.some(photo => photo.id === id);
        const task = photoQueueRef.current(file, { shouldPrepare: isPresent })
            .then((prepared) => {
                if (!prepared || !isPresent()) return;
                patchPhoto(id, {
                    status: 'ready',
                    file: null,
                    prepared,
                    previewUrl: URL.createObjectURL(prepared.blob),
                    errorMessage: ''
                });
            })
            .catch((error) => {
                patchPhoto(id, { status: 'error', errorMessage: quotePhotoErrorMessage(error?.code) });
            })
            .finally(() => {
                photoTasksRef.current.delete(id);
            });
        photoTasksRef.current.set(id, task);
        return task;
    }, [patchPhoto]);

    const handleFiles = useCallback((fileList) => {
        const candidates = Array.from(fileList || []);
        if (!candidates.length || submittingRef.current) return;
        trackQuoteStart();
        const images = candidates.filter(isLikelyImageFile);
        const room = Math.max(0, MAX_PHOTOS - photoPreviewsRef.current.length);
        const accepted = images.slice(0, room);
        const notices = [];
        const ignored = candidates.length - images.length;
        if (ignored > 0) {
            notices.push(`${ignored} fichier${ignored > 1 ? 's ignorés : ce ne sont' : ' ignoré : ce n’est'} pas une image.`);
        }
        if (images.length > room) {
            const skipped = images.length - room;
            notices.push(`Limite de ${MAX_PHOTOS} photos : ${skipped} photo${skipped > 1 ? 's non ajoutées' : ' non ajoutée'}.`);
        }
        setPhotoNotice(notices.join(' '));
        if (!accepted.length) return;

        const entries = accepted.map(file => ({
            id: createQuotePhotoId(),
            name: file.name || 'Photo',
            file,
            status: 'preparing',
            prepared: null,
            previewUrl: '',
            errorMessage: ''
        }));
        commitPhotos([...photoPreviewsRef.current, ...entries]);
        entries.forEach(entry => { void preparePhoto(entry.id, entry.file); });
    }, [commitPhotos, preparePhoto, trackQuoteStart]);

    const retryPhoto = useCallback((id) => {
        const target = photoPreviewsRef.current.find(photo => photo.id === id);
        if (!target?.file || target.status !== 'error') return;
        patchPhoto(id, { status: 'preparing', errorMessage: '' });
        void preparePhoto(id, target.file);
    }, [patchPhoto, preparePhoto]);

    const removePhoto = useCallback((id) => {
        const index = photoPreviewsRef.current.findIndex(photo => photo.id === id);
        const restoreFocus = document.activeElement?.getAttribute('data-photo-remove') === id;
        const target = photoPreviewsRef.current.find(photo => photo.id === id);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        commitPhotos(photoPreviewsRef.current.filter(photo => photo.id !== id));
        setPhotoNotice('');
        if (restoreFocus) requestAnimationFrame(() => {
            const next = photoPreviewsRef.current[Math.min(index, photoPreviewsRef.current.length - 1)];
            const button = next && photoBoardRef.current?.querySelector(`[data-photo-remove="${next.id}"]`);
            (button || photoPickerRef.current)?.focus();
        });
    }, [commitPhotos]);

    const clearPhotos = useCallback(() => {
        photoPreviewsRef.current.forEach(photo => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
        commitPhotos([]);
        setPhotoNotice('');
    }, [commitPhotos]);

    const openPhotoPicker = useCallback(() => {
        if (photoPreviewsRef.current.length >= MAX_PHOTOS) return;
        fileInputRef.current?.click();
    }, []);

    /*
     * Glisser-deposer au niveau de la fenetre : une photo lachee a cote de la
     * zone ne doit jamais ouvrir l'image dans l'onglet et perdre le formulaire.
     * Sur l'etape photos, deposer ou coller n'importe ou ajoute les images.
     */
    useEffect(() => {
        if (submitted) return undefined;
        let depth = 0;
        const acceptsPhotos = step === PHOTO_STEP_INDEX;
        const carriesFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

        const onDragEnter = (event) => {
            if (!carriesFiles(event)) return;
            event.preventDefault();
            depth += 1;
            if (acceptsPhotos) setDragging(true);
        };
        const onDragOver = (event) => {
            if (!carriesFiles(event)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = acceptsPhotos ? 'copy' : 'none';
        };
        const onDragLeave = (event) => {
            if (!carriesFiles(event)) return;
            depth = Math.max(0, depth - 1);
            if (depth === 0) setDragging(false);
        };
        const onDrop = (event) => {
            if (!carriesFiles(event)) return;
            event.preventDefault();
            depth = 0;
            setDragging(false);
            if (acceptsPhotos) void handleFiles(event.dataTransfer.files);
        };
        const onPaste = (event) => {
            if (!acceptsPhotos || !event.clipboardData?.files?.length) return;
            if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return;
            event.preventDefault();
            void handleFiles(event.clipboardData.files);
        };

        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        window.addEventListener('paste', onPaste);
        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
            window.removeEventListener('paste', onPaste);
            setDragging(false);
        };
    }, [handleFiles, step, submitted]);

    /* Mesure la zone reellement disponible pour dimensionner les vignettes. */
    const photoCount = photoPreviews.length;
    useLayoutEffect(() => {
        const board = photoBoardRef.current;
        if (step !== PHOTO_STEP_INDEX || !board || !photoCount) {
            setPhotoGrid(null);
            return undefined;
        }
        const desktopQuery = window.matchMedia(DESKTOP_QUERY);
        const measure = () => {
            const desktop = desktopQuery.matches;
            const next = computePhotoGrid({
                width: board.clientWidth,
                height: desktop ? board.clientHeight : 0,
                count: photoCount,
                desktop
            });
            setPhotoGrid(prev => (
                prev && next && prev.columns === next.columns && prev.size === next.size && prev.gap === next.gap && prev.scroll === next.scroll ? prev : next
            ));
        };
        measure();
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
        observer?.observe(board);
        desktopQuery.addEventListener?.('change', measure);
        window.addEventListener('resize', measure);
        return () => {
            observer?.disconnect();
            desktopQuery.removeEventListener?.('change', measure);
            window.removeEventListener('resize', measure);
        };
    }, [photoCount, step]);

    const toggleService = useCallback((id) => {
        trackQuoteStart();
        setSelectedServices(prev => ({ ...prev, [id]: !prev[id] }));
    }, [trackQuoteStart]);

    const goToStep = useCallback((nextStep) => {
        if (submittingRef.current) return;
        const target = Math.min(steps.length - 1, Math.max(0, nextStep));
        if (target === step) return;
        setStepMotionArmed(true);
        setDirection(target >= step ? 'forward' : 'backward');
        setStep(target);
    }, [step]);

    const selectedServiceList = useMemo(
        () => allServices.filter(service => selectedServices[service.id]),
        [selectedServices]
    );

    const estimate = useMemo(
        () => selectedServiceList.reduce(
            (acc, service) => ({ min: acc.min + service.min, max: acc.max + service.max }),
            { min: 0, max: 0 }
        ),
        [selectedServiceList]
    );

    const selectedTypeLabel = useMemo(
        () => allTypes.find(item => item.id === selectedType)?.label || selectedType,
        [selectedType]
    );

    const validateContact = useCallback(() => {
        const nextErrors = {};
        if (!fields.firstname.trim()) nextErrors.firstname = 'Indiquez votre prénom.';
        if (!isValidEmail(fields.email)) nextErrors.email = 'Indiquez un email valide.';
        if (!isValidPhone(fields.phone)) nextErrors.phone = 'Indiquez un numéro joignable.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [fields.email, fields.firstname, fields.phone]);

    const showEstimate = useCallback(() => {
        trackQuoteStart();
        if (!validateContact()) {
            goToStep(CONTACT_STEP_INDEX);
            return;
        }

        goToStep(ESTIMATE_STEP_INDEX);
    }, [goToStep, trackQuoteStart, validateContact]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;
        trackQuoteStart();

        if (step !== ESTIMATE_STEP_INDEX) {
            if (step === CONTACT_STEP_INDEX) {
                showEstimate();
            } else {
                goToStep(step + 1);
            }
            return;
        }

        if (!validateContact()) {
            goToStep(CONTACT_STEP_INDEX);
            return;
        }

        submittingRef.current = true;
        setSubmissionState({ status: 'submitting', message: 'Enregistrement de votre demande…' });
        setErrors({});
        try {
            if (photoTasksRef.current.size) {
                setSubmissionState({ status: 'submitting', message: 'Préparation des photos…' });
                await Promise.allSettled([...photoTasksRef.current.values()]);
            }
            if (photoPreviewsRef.current.some(photo => photo.status !== 'ready')) {
                submittingRef.current = false;
                setPhotoNotice('Certaines photos ne sont pas prêtes. Réessayez ou retirez-les pour envoyer votre demande.');
                setSubmissionState({ status: 'idle', message: '' });
                goToStep(PHOTO_STEP_INDEX);
                return;
            }
            const readyPhotos = photoPreviewsRef.current
                .filter((photo) => photo.status === 'ready' && photo.prepared)
                .map((photo) => ({ photoId: photo.id, ...photo.prepared }));
            const { createQuoteSubmissionIdentity, submitQuoteRequest } = await import('./quoteRequestClient');
            submissionIdentityRef.current ||= createQuoteSubmissionIdentity();
            const result = await submitQuoteRequest({
                identity: submissionIdentityRef.current,
                files: readyPhotos,
                payload: {
                    customer: {
                        firstName: fields.firstname,
                        lastName: fields.lastname,
                        email: fields.email,
                        phone: fields.phone,
                        location: fields.location,
                    },
                    project: {
                        furnitureType: selectedType,
                        condition: fields.condition,
                        dimensions: {
                            height: fields.height,
                            width: fields.width,
                            depth: fields.depth,
                            weight: fields.weight,
                        },
                        description: fields.description,
                        notes: fields.notes,
                        severity: fields.severity,
                        serviceIds: selectedServiceList.map((service) => service.id),
                    },
                },
                onProgress: ({ phase, completed, total }) => {
                    if (phase === 'photos') {
                        setSubmissionState({
                            status: 'submitting',
                            message: `Transmission des photos ${Math.min(completed + 1, total)} / ${total}…`,
                        });
                    } else if (phase === 'finalizing') {
                        setSubmissionState({ status: 'submitting', message: 'Confirmation de la réception…' });
                    }
                },
            });
            emitAnalyticsEvent('quote_submitted', null, null, {
                form: 'restoration',
                selectedServices: selectedServiceList.length,
                photoCount: result.photoCount,
                furnitureType: selectedType
            });
            setSubmissionResult(result);
            setSubmissionState({ status: 'success', message: '' });
            setSubmitted(true);
        } catch (error) {
            const code = String(error?.code || '');
            const message = code.includes('resource-exhausted')
                ? 'Trop de demandes ont été envoyées. Réessayez un peu plus tard.'
                : code.includes('deadline-exceeded')
                    ? 'La transmission a pris trop de temps. Réessayez pour terminer la demande.'
                    : 'La demande n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.';
            setSubmissionState({ status: 'error', message });
        } finally {
            submittingRef.current = false;
        }
    };

    const inputClass = (name) => `mt-2.5 ${QUOTE_CONTROL_HEIGHT} w-full ${QUOTE_RADIUS_FIELD} px-4 font-sans text-[14px] outline-none transition-[box-shadow,background-color] duration-300 ${errors[name] ? (darkMode ? 'bg-[#141312] text-stone-100 ring-[1.5px] ring-red-400/60' : 'bg-white text-[#1c1917] ring-[1.5px] ring-red-400') : t.field}`;

    const Mark = ({ on, round = true, size = 18 }) => (
        <span
            className={`flex shrink-0 items-center justify-center ${round ? 'rounded-full' : 'rounded-[6px]'} ${QUOTE_EASE} ${on ? `${t.accentBg} ${t.accentOn}` : t.markIdle}`}
            style={{ height: size, width: size }}
        >
            {on ? <Check size={Math.round(size * 0.6)} strokeWidth={2.6} /> : null}
        </span>
    );

    /* ---------------- ecran recapitulatif ---------------- */
    if (submitted) {
        return (
            <div className={`${QUOTE_SHELL} py-12 lg:py-20`}>
                <div className={`quote-step mx-auto max-w-[760px] ${QUOTE_RADIUS_PANEL} ${QUOTE_PANEL_PADDING} ${t.panel}`}>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${darkMode ? 'bg-[#D9B58D]/15 text-[#D9B58D]' : 'bg-[#f1f5f0] text-[#4a7c59]'}`}>
                        <Check size={21} strokeWidth={1.9} />
                    </span>
                    <h2 className={`quote-balance mt-6 ${QUOTE_TYPE.section}`}>Votre demande est bien reçue</h2>
                    <p className={`mt-4 max-w-[46ch] font-sans text-[14px] leading-[1.65] ${t.muted}`}>
                        Elle est maintenant visible dans l&apos;atelier de suivi de Seconde Vie. Un accusé de réception
                        va être envoyé à {fields.email}.
                    </p>

                    <dl className={`mt-8 divide-y ${QUOTE_RADIUS_CARD} ${t.divide} ${t.panelQuiet}`}>
                        {[
                            ['Meuble', selectedTypeLabel],
                            ['État général', fields.condition || 'Non précisé'],
                            ['Prestations', selectedServiceList.length ? `${selectedServiceList.length} sélectionnée${selectedServiceList.length > 1 ? 's' : ''}` : 'À définir'],
                            ['Estimation', selectedServiceList.length ? formatRange(estimate.min, estimate.max) : 'Sur devis'],
                            ['Photos reçues', submissionResult?.photoCount ? `${submissionResult.photoCount} transmise${submissionResult.photoCount > 1 ? 's' : ''}` : 'Aucune'],
                            ['Contact', [fields.firstname, fields.lastname].filter(Boolean).join(' ') || '—']
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-baseline justify-between gap-6 px-5 py-3.5">
                                <dt className={`${QUOTE_TYPE.meta} ${t.muted}`}>{label}</dt>
                                <dd className="text-right font-sans text-[13.5px] font-semibold">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className={`mt-6 ${QUOTE_RADIUS_CARD} p-5 ${t.panelQuiet}`}>
                        <p className={`${QUOTE_TYPE.micro} ${t.muted}`}>Référence de suivi</p>
                        <p className="mt-2 font-sans text-[15px] font-semibold tracking-[0.04em]">
                            {submissionResult?.requestNumber || 'Demande enregistrée'}
                        </p>
                        {submissionResult?.failedPhotoCount > 0 ? (
                            <p className={`mt-3 font-sans text-[12.5px] leading-5 ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                                {submissionResult.failedPhotoCount} photo{submissionResult.failedPhotoCount > 1 ? 's n’ont' : ' n’a'} pas pu être transmise. La demande reste bien enregistrée et Anaïs pourra vous recontacter.
                            </p>
                        ) : (
                            <p className={`mt-2 ${QUOTE_TYPE.meta} ${t.muted}`}>
                                Conservez cette référence si vous avez besoin de reparler de votre demande.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSubmitted(false);
                            setSubmissionResult(null);
                            setSubmissionState({ status: 'idle', message: '' });
                            submissionIdentityRef.current = null;
                            clearPhotos();
                            goToStep(0);
                        }}
                        className={`mt-7 font-sans text-[13px] font-semibold underline decoration-1 underline-offset-4 ${t.muted} ${t.focusRing}`}
                    >
                        Faire une nouvelle demande
                    </button>
                </div>
            </div>
        );
    }

    const activeStep = steps[step];
    const isLastStep = step === steps.length - 1;
    const isPhotoStep = step === PHOTO_STEP_INDEX;
    const readyPhotoCount = photoPreviews.filter(photo => photo.status === 'ready').length;
    const preparingPhotoCount = photoPreviews.filter(photo => photo.status === 'preparing').length;
    const failedPhotoCount = photoPreviews.filter(photo => photo.status === 'error').length;
    const photoRoomLeft = MAX_PHOTOS - photoPreviews.length;
    const compactTiles = (photoGrid?.size ?? PHOTO_COMPACT_TILE) < PHOTO_COMPACT_TILE;

    return (
        <div className={`${QUOTE_SHELL} pb-6 pt-6 lg:pt-9`}>
            {/* rail d'etapes : colonnes egales + piste de progression */}
            <div
                ref={railRef}
                data-quote-reveal="progress"
                data-quote-reveal-mode="eager"
                className={`quote-reveal-shell quote-reveal-group quote-anchor sticky top-16 z-30 -mx-5 mb-6 border-b px-5 py-3.5 backdrop-blur-xl sm:-mx-8 sm:px-8 md:top-[76px] lg:static lg:z-auto lg:mx-0 lg:mb-6 lg:rounded-[18px] lg:border lg:px-7 lg:py-4 ${t.hairline} ${t.railBg}`}
            >
                <div className="quote-reveal-item-1 flex items-baseline justify-between gap-4 lg:hidden">
                    <p className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${t.accent}`}>
                        Étape {step + 1} / {steps.length}
                    </p>
                    <p className="font-sans text-[13px] font-semibold">{activeStep.label}</p>
                </div>

                <ol className="hidden lg:grid lg:grid-cols-7" aria-label="Progression de la demande">
                    {steps.map((item, index) => {
                        const isDone = index < step;
                        const isCurrent = index === step;
                        return (
                            <li key={item.id} className={`quote-reveal-item-${index + 1} min-w-0`}>
                                <button
                                    type="button"
                                    onClick={() => (index === ESTIMATE_STEP_INDEX ? showEstimate() : goToStep(index))}
                                    disabled={submissionState.status === 'submitting'}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    className={`flex w-full items-center gap-2.5 rounded-full py-1 pr-3 text-left ${QUOTE_EASE} ${t.focusRing}`}
                                >
                                    <span
                                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-semibold ${QUOTE_EASE} ${isDone || isCurrent ? `${t.accentBg} ${t.accentOn}` : darkMode ? 'bg-white/[0.08] text-stone-500' : 'bg-[#ece6de] text-[#8d8479]'}`}
                                    >
                                        {isDone ? <Check size={12} strokeWidth={2.4} /> : index + 1}
                                    </span>
                                    <span className={`truncate font-sans text-[12.5px] ${isCurrent ? 'font-semibold' : `font-medium ${t.muted}`}`}>
                                        {item.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>

                <div className={`quote-reveal-item-8 mt-3 h-[3px] w-full overflow-hidden rounded-full lg:mt-3.5 ${t.trackBg}`} aria-hidden="true">
                    <div
                        className={`quote-progress-fill h-full rounded-full ${t.accentBg}`}
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <fieldset disabled={submissionState.status === 'submitting'} className="min-w-0">
                {/* gap-8 garantit un ecart minimum entre le contenu et la barre de navigation */}
                <div
                    key={activeStep.id}
                    data-direction={direction}
                    data-quote-reveal={initialStepReveal ? 'step-shell' : undefined}
                    data-quote-reveal-mode={initialStepReveal ? 'eager' : undefined}
                    className={`${initialStepReveal ? 'quote-reveal-shell' : ''} ${panelMotion} flex flex-col gap-7 ${QUOTE_STEP_HEIGHT} ${QUOTE_STEP_RADIUS} ${QUOTE_STEP_PADDING} ${t.stepPanel}`}
                >
                    {initialStepReveal ? (
                        <p className={`${QUOTE_TYPE.eyebrow} ${t.accent}`}>
                            Étape {step + 1} sur {steps.length}
                        </p>
                    ) : null}
                    <div
                        className={`${contentMotion} min-h-0 flex-1 overflow-visible lg:mx-0 lg:px-0 ${isPhotoStep ? 'lg:flex lg:flex-col' : ''}`}
                    >
                        <header
                            data-quote-reveal={initialStepReveal ? 'step-copy' : undefined}
                            className={`${initialStepReveal ? 'quote-reveal-group' : ''} mb-8 lg:mb-7`}
                        >
                            {!initialStepReveal ? (
                                <p className={`${QUOTE_TYPE.eyebrow} ${t.accent}`}>
                                    Étape {step + 1} sur {steps.length}
                                </p>
                            ) : null}
                            <h2 className={`${initialStepReveal ? 'quote-reveal-item-1' : ''} quote-balance mt-3 max-w-[24ch] ${QUOTE_TYPE.section}`}>
                                {activeStep.title}
                            </h2>
                            <p className={`${initialStepReveal ? 'quote-reveal-item-2' : ''} ${step === 1 ? 'mt-5' : 'mt-3'} max-w-[56ch] ${QUOTE_TYPE.body} ${t.muted}`}>
                                {activeStep.hint}
                            </p>
                        </header>

                        {/* 1 — TYPE DE MEUBLE */}
                        {step === 0 && (
                            <div>
                                <div
                                    role="radiogroup"
                                    aria-label="Type de meuble"
                                    data-quote-reveal={initialStepReveal ? 'step-cards' : undefined}
                                    data-quote-reveal-mode={initialStepReveal ? 'cards' : undefined}
                                    className={`${initialStepReveal ? 'quote-reveal-group' : ''} ${cardsMotion} mx-auto grid w-full max-w-[430px] grid-cols-2 gap-3 lg:max-w-none lg:grid-cols-6`}
                                >
                                    {furnitureCards.map((type, index) => {
                                        const isSelected = selectedType === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => {
                                                    trackQuoteStart();
                                                    setSelectedType(type.id);
                                                }}
                                                className={`${initialStepReveal ? `quote-reveal-item-${index + 1}` : ''} group relative overflow-hidden ${QUOTE_RADIUS_CARD} ${QUOTE_EASE} active:scale-[0.98] ${t.focusRing} ${isSelected ? t.furnitureCardActive : t.furnitureCardIdle}`}
                                            >
                                                <span className={`block aspect-[5/6] w-full overflow-hidden lg:aspect-[4/5] ${t.imageBed}`}>
                                                    <img
                                                        src={type.image}
                                                        alt=""
                                                        loading="lazy"
                                                        decoding="async"
                                                        className={`h-full w-full object-cover ${QUOTE_EASE} group-hover:scale-[1.05]`}
                                                    />
                                                </span>
                                                <span className="flex items-center justify-between gap-1.5 px-2.5 py-2 lg:px-3 lg:py-2.5">
                                                    <span className="truncate font-sans text-[12.5px] font-semibold">{type.label}</span>
                                                    <Mark on={isSelected} size={16} />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                            </div>
                        )}

                        {/* 2 — ETAT GENERAL */}
                        {step === 1 && (
                            <div
                                role="radiogroup"
                                aria-label="État général"
                                className={`${cardsMotion} grid gap-3 pt-5 min-[520px]:grid-cols-2 min-[520px]:pt-6 lg:grid-cols-4 lg:pt-12`}
                            >
                                {conditionOptions.map(option => {
                                    const isSelected = fields.condition === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => updateField('condition', option.value)}
                                            className={`flex flex-col items-start gap-3 ${QUOTE_RADIUS_CARD} p-4 text-left ${QUOTE_EASE} active:scale-[0.99] min-[520px]:min-h-[142px] lg:min-h-[168px] lg:gap-4 lg:p-5 ${t.focusRing} ${isSelected ? t.optionActive : t.optionIdle}`}
                                        >
                                            <Mark on={isSelected} size={20} />
                                            <span className="min-w-0">
                                                <span className="block font-sans text-[14px] font-semibold leading-snug">{option.label}</span>
                                                <span className={`mt-1.5 block ${QUOTE_TYPE.meta} ${t.muted}`}>{option.text}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 3 — PHOTOS */}
                        {isPhotoStep && (
                            <div className="flex flex-col lg:min-h-0 lg:flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    className="sr-only"
                                    onChange={(event) => {
                                        void handleFiles(event.target.files);
                                        event.target.value = '';
                                    }}
                                />

                                {photoPreviews.length === 0 ? (
                                    <button
                                        ref={photoPickerRef}
                                        type="button"
                                        onClick={openPhotoPicker}
                                        className={`group flex w-full flex-col items-center justify-center border border-dashed ${QUOTE_RADIUS_CARD} ${QUOTE_DROPZONE_HEIGHT} px-5 py-9 text-center ${QUOTE_EASE} lg:min-h-0 lg:flex-1 lg:py-8 ${t.focusRing} ${dragging
                                            ? darkMode ? 'border-[#D9B58D]/70 bg-[#D9B58D]/[0.08]' : 'border-[#8B5C42] bg-[#fbf7f3]'
                                            : darkMode ? 'border-white/16 bg-white/[0.02] hover:border-white/30' : 'border-[#d5cbbf] bg-white hover:border-[#b9ab9a] hover:bg-[#fbf9f6]'
                                        }`}
                                    >
                                        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${QUOTE_EASE} group-hover:scale-105 ${darkMode ? 'bg-white/[0.06] text-[#D9B58D]' : 'bg-[#f3ede6] text-[#8B5C42]'}`}>
                                            <PhotoPlus size={24} strokeWidth={1.5} />
                                        </span>
                                        <span className="mt-4 font-sans text-[15px] font-semibold">
                                            {dragging ? 'Déposez vos photos ici' : 'Ajoutez vos photos'}
                                        </span>
                                        <span className={`mt-1.5 max-w-[36ch] ${QUOTE_TYPE.meta} ${t.muted}`}>
                                            <span className="lg:hidden">Prenez une photo ou choisissez-en dans votre galerie.</span>
                                            <span className="hidden lg:inline">Glissez-déposez vos photos, collez-les ou cliquez pour parcourir.</span>
                                        </span>
                                        <span className="mt-5 flex flex-wrap justify-center gap-2">
                                            {['Vue d’ensemble', 'Défauts de près', 'Pieds et dessous'].map(tip => (
                                                <span key={tip} className={`rounded-full px-3 py-1.5 font-sans text-[11.5px] font-medium ${darkMode ? 'bg-white/[0.05] text-stone-300' : 'bg-[#f5f1ec] text-[#6e655d]'}`}>
                                                    {tip}
                                                </span>
                                            ))}
                                        </span>
                                        <span className={`mt-5 ${QUOTE_TYPE.micro} ${t.faint}`}>
                                            JPG, PNG, WEBP · jusqu’à {MAX_PHOTOS} photos
                                            <span className="mt-1 block">HEIC selon votre navigateur ; sinon, exportez en JPEG.</span>
                                        </span>
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="font-sans text-[13.5px] font-semibold">
                                                    {photoPreviews.length} photo{photoPreviews.length > 1 ? 's' : ''} · {photoPreviews.length}/{MAX_PHOTOS}
                                                </p>
                                                <p className={`mt-0.5 truncate ${QUOTE_TYPE.micro} ${t.faint}`} aria-live="polite">
                                                    {preparingPhotoCount > 0
                                                        ? `Préparation de ${preparingPhotoCount} photo${preparingPhotoCount > 1 ? 's' : ''}…`
                                                        : photoRoomLeft > 0
                                                            ? `Encore ${photoRoomLeft} possible${photoRoomLeft > 1 ? 's' : ''}`
                                                            : 'Maximum atteint'}
                                                    {photoRoomLeft > 0 ? <span className="hidden lg:inline"> · glissez ou collez pour en ajouter</span> : null}
                                                </p>
                                            </div>
                                            <button
                                                ref={photoPickerRef}
                                                type="button"
                                                onClick={openPhotoPicker}
                                                disabled={photoRoomLeft <= 0}
                                                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-4 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 ${t.ghostBtn} ${t.focusRing}`}
                                            >
                                                <PhotoPlus size={17} strokeWidth={1.6} />
                                                Ajouter
                                            </button>
                                        </div>

                                        <div
                                            ref={photoBoardRef}
                                            className={`relative mt-4 lg:min-h-0 lg:flex-1 ${photoGrid?.scroll ? 'lg:overflow-y-auto' : 'lg:overflow-hidden'}`}
                                        >
                                            <ul
                                                aria-label="Photos ajoutées"
                                                className={photoGrid ? 'grid content-start' : 'grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3 lg:grid-cols-5 lg:gap-3'}
                                                style={photoGrid ? { gridTemplateColumns: `repeat(${photoGrid.columns}, ${photoGrid.size}px)`, gap: photoGrid.gap } : undefined}
                                            >
                                                {photoPreviews.map((photo, index) => (
                                                    <li
                                                        key={photo.id}
                                                        className={`quote-photo-tile relative aspect-square overflow-hidden ${QUOTE_RADIUS_FIELD} ${photo.status === 'error'
                                                            ? darkMode ? 'bg-[#1a1412] ring-[1.5px] ring-red-400/60' : 'bg-[#fdf6f3] ring-[1.5px] ring-red-300'
                                                            : t.imageBed}`}
                                                    >
                                                        {photo.previewUrl ? (
                                                            <img
                                                                src={photo.previewUrl}
                                                                alt={`Vue ${index + 1} du meuble`}
                                                                draggable={false}
                                                                decoding="async"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}

                                                        {photo.status === 'preparing' ? (
                                                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                                <span
                                                                    aria-hidden="true"
                                                                    className={`h-6 w-6 animate-spin rounded-full border-2 ${darkMode ? 'border-white/15 border-t-[#D9B58D]' : 'border-[#e0d6ca] border-t-[#8B5C42]'}`}
                                                                />
                                                                <span className={compactTiles ? 'sr-only' : `${QUOTE_TYPE.micro} ${t.muted}`}>Préparation…</span>
                                                            </span>
                                                        ) : null}

                                                        {photo.status === 'error' ? (
                                                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2.5 text-center" title={photo.errorMessage}>
                                                                <Alert size={compactTiles ? 18 : 22} className={darkMode ? 'text-red-300' : 'text-red-600'} />
                                                                <span className={compactTiles ? 'sr-only' : 'font-sans text-[11.5px] font-semibold leading-tight'}>
                                                                    {photo.errorMessage}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => retryPhoto(photo.id)}
                                                                    aria-label={`Réessayer la photo ${index + 1}`}
                                                                    className={`mt-0.5 inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-sans text-[11.5px] font-semibold ${QUOTE_EASE} ${t.ghostBtn} ${t.focusRing}`}
                                                                >
                                                                    <Retry size={13} strokeWidth={2} />
                                                                    {compactTiles ? null : 'Réessayer'}
                                                                </button>
                                                            </span>
                                                        ) : null}

                                                        {!compactTiles ? (
                                                            <span className="pointer-events-none absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/55 px-1.5 font-sans text-[10.5px] font-semibold tabular-nums text-white backdrop-blur-sm">
                                                                {index + 1}
                                                            </span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhoto(photo.id)}
                                                            data-photo-remove={photo.id}
                                                            aria-label={`Retirer la photo ${index + 1}`}
                                                            className={`absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm ${QUOTE_EASE} hover:bg-black/80 active:scale-95 ${t.focusRing}`}
                                                        >
                                                            <Close size={14} strokeWidth={2.2} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>

                                            {dragging ? (
                                                <div className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed ${QUOTE_RADIUS_CARD} backdrop-blur-[2px] ${darkMode ? 'border-[#D9B58D]/70 bg-[#0A0A0A]/75 text-[#D9B58D]' : 'border-[#8B5C42] bg-white/85 text-[#8B5C42]'}`}>
                                                    <PhotoPlus size={26} strokeWidth={1.5} />
                                                    <span className="mt-2 font-sans text-[14px] font-semibold">
                                                        {photoRoomLeft > 0 ? 'Déposez pour ajouter' : `Maximum de ${MAX_PHOTOS} photos atteint`}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </>
                                )}

                                {photoNotice || failedPhotoCount > 0 ? (
                                    <p role="status" className={`mt-3 shrink-0 ${QUOTE_TYPE.micro} font-medium ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                                        {[
                                            photoNotice,
                                            failedPhotoCount > 0
                                                ? `${failedPhotoCount} photo${failedPhotoCount > 1 ? 's' : ''} à corriger ou retirer. ${photoPreviews.find(photo => photo.status === 'error')?.errorMessage || ''}`
                                                : ''
                                        ].filter(Boolean).join(' ')}
                                    </p>
                                ) : null}

                                <p className={`mt-3 shrink-0 ${QUOTE_TYPE.micro} ${t.faint}`}>
                                    Facultatif. Vos photos restent privées et servent uniquement à étudier votre demande.
                                </p>
                            </div>
                        )}

                        {/* 4 — DESCRIPTION & DIMENSIONS */}
                        {step === 3 && (
                            <div className={`${QUOTE_READABLE} space-y-6 lg:space-y-7`}>
                                <label className="block">
                                    <span className={QUOTE_TYPE.label}>Description des travaux souhaités</span>
                                    <textarea
                                        rows={5}
                                        value={fields.description}
                                        onChange={(event) => updateField('description', event.target.value)}
                                        placeholder="Décrivez votre projet, les réparations ou finitions souhaitées…"
                                        className={`mt-2.5 min-h-[132px] w-full resize-none ${QUOTE_RADIUS_FIELD} p-3.5 font-sans text-[13.5px] leading-[1.6] outline-none transition-[box-shadow,background-color] duration-300 lg:p-4 lg:text-[14px] ${t.field}`}
                                    />
                                </label>

                                <div className="pt-4 lg:pt-7">
                                    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="w-full min-w-0 sm:max-w-[520px]">
                                            <span className={QUOTE_TYPE.label}>
                                                Dimensions <span className="font-normal opacity-60">(facultatif)</span>
                                            </span>
                                            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                                                {dimensionFields.map(([name, label, unit]) => (
                                                    <span key={name} className="relative block">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            inputMode="numeric"
                                                            value={fields[name]}
                                                            onChange={(event) => updateField(name, event.target.value)}
                                                            placeholder={label}
                                                            aria-label={`${label} en centimètres`}
                                                            className={`${QUOTE_CONTROL_HEIGHT} w-full ${QUOTE_RADIUS_FIELD} pl-3.5 pr-8 font-sans text-[13px] outline-none transition-[box-shadow,background-color] duration-300 lg:pl-4 lg:pr-9 lg:text-[14px] ${t.field}`}
                                                        />
                                                        <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] ${t.faint}`}>
                                                            {unit}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <label className="block w-full max-w-[160px] sm:w-[170px] sm:max-w-none sm:shrink-0">
                                            <span className={QUOTE_TYPE.label}>
                                                Poids <span className="font-normal opacity-60">(facultatif)</span>
                                            </span>
                                            <span className="relative mt-2.5 block">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="decimal"
                                                    value={fields.weight}
                                                    onChange={(event) => updateField('weight', event.target.value)}
                                                    placeholder="Poids"
                                                    aria-label="Poids en kilogrammes"
                                                    className={`${QUOTE_CONTROL_HEIGHT} w-full ${QUOTE_RADIUS_FIELD} pl-3.5 pr-8 font-sans text-[13px] outline-none transition-[box-shadow,background-color] duration-300 lg:pl-4 lg:pr-9 lg:text-[14px] ${t.field}`}
                                                />
                                                <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] ${t.faint}`}>
                                                    kg
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5 — PRESTATIONS */}
                        {step === 4 && (
                            <div className="grid gap-y-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-7">
                                {serviceGroups.map(group => {
                                    const groupCount = group.services.filter(service => selectedServices[service.id]).length;
                                    return (
                                        <section key={group.id}>
                                            <div className={`flex items-baseline justify-between gap-4 border-b pb-2.5 ${t.hairline}`}>
                                                <h3 className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em]">
                                                    {group.title}
                                                </h3>
                                                <span className={`shrink-0 font-sans text-[11.5px] font-medium tabular-nums ${groupCount > 0 ? t.accent : t.faint}`}>
                                                    {groupCount}/{group.services.length}
                                                </span>
                                            </div>

                                            <div className="mt-2.5 space-y-2.5">
                                                {group.services.map(service => {
                                                    const checked = Boolean(selectedServices[service.id]);
                                                    return (
                                                        <div
                                                            key={service.id}
                                                            className={`${QUOTE_RADIUS_CARD} ${QUOTE_EASE} ${checked ? t.optionActive : t.optionIdle}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                role="checkbox"
                                                                aria-checked={checked}
                                                                onClick={() => toggleService(service.id)}
                                className={`flex min-h-[92px] w-full items-start gap-3 ${QUOTE_RADIUS_CARD} p-4 text-left lg:min-h-0 lg:gap-3.5 ${t.focusRing}`}
                                                            >
                                                                <span className="mt-0.5">
                                                                    <Mark on={checked} round={false} size={20} />
                                                                </span>
                                <span className="flex min-h-[52px] min-w-0 flex-1 flex-col justify-between lg:min-h-0">
                                                                    <span className="flex items-baseline justify-between gap-3">
                                                                        <span className={QUOTE_TYPE.cardTitle}>{service.label}</span>
                                                                        <span className="shrink-0 font-sans text-[12.5px] font-semibold tabular-nums">
                                                                            {formatRange(service.min, service.max)}
                                                                        </span>
                                                                    </span>
                                    <span className={`mt-2 block font-sans text-[11px] leading-[1.5] lg:mt-1 lg:text-[11.5px] ${t.muted}`}>{service.text}</span>
                                                                </span>
                                                            </button>

                                                            {service.hasSeverity && checked && (
                                                                <div className={`border-t px-4 py-3.5 ${t.hairline}`}>
                                                                    <span className={`${QUOTE_TYPE.micro} font-medium ${t.muted}`}>Sévérité des défauts</span>
                                                                    <div
                                                                        role="radiogroup"
                                                                        aria-label="Sévérité des défauts"
                                                                        className={`mt-2 inline-flex max-w-full flex-wrap rounded-full p-1 ${darkMode ? 'bg-white/[0.06]' : 'bg-[#ece6de]'}`}
                                                                    >
                                                                        {severityOptions.map(option => {
                                                                            const isActive = fields.severity === option;
                                                                            return (
                                                                                <button
                                                                                    key={option}
                                                                                    type="button"
                                                                                    role="radio"
                                                                                    aria-checked={isActive}
                                                                                    onClick={() => updateField('severity', option)}
                                                                                    className={`rounded-full px-3 py-1.5 font-sans text-[11.5px] font-semibold lg:px-3.5 lg:text-[12px] ${QUOTE_EASE} ${t.focusRing} ${isActive ? (darkMode ? 'bg-[#D9B58D] text-[#171411]' : 'bg-white text-[#1c1917] shadow-[0_1px_3px_rgba(28,25,23,0.10)]') : t.muted}`}
                                                                                >
                                                                                    {option}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        )}

                        {/* 6 — COORDONNEES */}
                        {step === 5 && (
                            <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
                                <div className="grid gap-4 min-[520px]:grid-cols-2">
                                    {[
                                        ['firstname', 'Prénom', 'Votre prénom', 'text', true, 'given-name'],
                                        ['lastname', 'Nom', 'Votre nom', 'text', false, 'family-name'],
                                        ['email', 'Email', 'votre@email.com', 'email', true, 'email'],
                                        ['phone', 'Téléphone', '06 12 34 56 78', 'tel', true, 'tel']
                                    ].map(([name, label, placeholder, type, required, autoComplete]) => (
                                        <label key={name} className="block">
                                            <span className={QUOTE_TYPE.label}>
                                                {label}
                                                {required ? <span className={t.accent}> *</span> : null}
                                            </span>
                                            <input
                                                type={type}
                                                autoComplete={autoComplete}
                                                value={fields[name]}
                                                onChange={(event) => updateField(name, event.target.value)}
                                                placeholder={placeholder}
                                                aria-invalid={errors[name] ? 'true' : undefined}
                                                className={inputClass(name)}
                                            />
                                            <span
                                                aria-hidden={errors[name] ? undefined : 'true'}
                                                className={`mt-1.5 block min-h-[18px] font-sans text-[11.5px] font-medium ${errors[name] ? (darkMode ? 'text-red-300' : 'text-red-600') : 'invisible'}`}
                                            >
                                                {errors[name] || 'Aucune erreur'}
                                            </span>
                                        </label>
                                    ))}

                                    <label className="block min-[520px]:col-span-2">
                                        <span className={QUOTE_TYPE.label}>Localisation du meuble</span>
                                        <input
                                            autoComplete="address-level2"
                                            value={fields.location}
                                            onChange={(event) => updateField('location', event.target.value)}
                                            placeholder="Ville ou code postal"
                                            className={inputClass('location')}
                                        />
                                    </label>
                                </div>

                                <label className="block lg:flex lg:h-full lg:flex-col">
                                    <span className={QUOTE_TYPE.label}>
                                        Précisions complémentaires <span className="font-normal opacity-60">(facultatif)</span>
                                    </span>
                                    <textarea
                                        rows={3}
                                        value={fields.notes}
                                        onChange={(event) => updateField('notes', event.target.value)}
                                        placeholder="Contraintes d'accès, délais souhaités, histoire du meuble…"
                                    className={`mt-2.5 min-h-[120px] w-full resize-none ${QUOTE_RADIUS_FIELD} p-3.5 font-sans text-[13.5px] leading-[1.6] outline-none transition-[box-shadow,background-color] duration-300 lg:min-h-0 lg:flex-1 lg:p-4 lg:text-[14px] ${t.field}`}
                                    />
                                </label>
                            </div>
                        )}

                        {/* 7 — ESTIMATION FINALE */}
                        {step === ESTIMATE_STEP_INDEX && (
                            <div className={`grid gap-6 min-[560px]:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x ${t.divide}`}>
                                <div className="lg:pr-9">
                                    <p className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>
                                        Fourchette estimée
                                    </p>
                                    <p
                                        key={`${estimate.min}-${estimate.max}`}
                                        className={`quote-value mt-2.5 ${QUOTE_TYPE.price}`}
                                        aria-live="polite"
                                    >
                                        {selectedServiceList.length ? formatRange(estimate.min, estimate.max) : 'Sur devis'}
                                    </p>
                                    <p className={`mt-3 font-sans text-[13px] font-medium ${t.muted}`}>
                                        Délai estimé : 2 à 4 semaines
                                    </p>
                                    <ul className="mt-4 space-y-2 lg:mt-6">
                                        {reassurance.map(item => (
                                            <li key={item} className="flex items-center gap-2.5">
                                                <Check size={13} strokeWidth={2.4} className={t.accent} />
                                                <span className={`${QUOTE_TYPE.meta} ${t.muted}`}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className={`border-t pt-6 min-[560px]:border-t-0 min-[560px]:pt-0 lg:px-9 ${t.hairline}`}>
                                    <p className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>
                                        Détail des prestations
                                    </p>
                                    {selectedServiceList.length > 0 ? (
                                        <>
                                            <ul className="mt-4 space-y-2.5">
                                                {selectedServiceList.map(service => (
                                                    <li key={service.id} className="flex items-baseline justify-between gap-4">
                                                        <span className={`${QUOTE_TYPE.meta} ${t.muted}`}>{service.label}</span>
                                                        <span className="shrink-0 font-sans text-[12.5px] font-semibold tabular-nums">
                                                            {formatRange(service.min, service.max)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className={`mt-4 flex items-baseline justify-between gap-4 border-t pt-4 ${t.hairline}`}>
                                                <span className="font-sans text-[13px] font-semibold">Total estimatif</span>
                                                <span className="font-sans text-[13px] font-semibold tabular-nums">
                                                    {formatRange(estimate.min, estimate.max)}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className={`mt-4 ${QUOTE_TYPE.meta} ${t.muted}`}>
                                            Aucune prestation sélectionnée. Anaïs précisera la proposition après étude de votre meuble.
                                        </p>
                                    )}
                                </div>

                                <div className={`border-t pt-6 min-[560px]:col-span-2 lg:col-span-1 lg:border-t-0 lg:pl-9 lg:pt-0 ${t.hairline}`}>
                                    <p className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>
                                        Votre demande
                                    </p>
                                    <dl className="mt-4 space-y-3">
                                        {[
                                            ['Meuble', selectedTypeLabel],
                                            ['État', fields.condition || 'À préciser'],
                                            ['Photos', photoPreviews.length ? [
                                                `${readyPhotoCount} prête${readyPhotoCount > 1 ? 's' : ''}`,
                                                preparingPhotoCount ? `${preparingPhotoCount} en préparation` : '',
                                                failedPhotoCount ? `${failedPhotoCount} à corriger` : ''
                                            ].filter(Boolean).join(' · ') : 'Aucune'],
                                            ['Contact', fields.firstname]
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex items-baseline justify-between gap-4">
                                                <dt className={`${QUOTE_TYPE.meta} ${t.muted}`}>{label}</dt>
                                                <dd className="text-right font-sans text-[12.5px] font-semibold">{value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    <p className={`mt-5 border-t pt-4 ${QUOTE_TYPE.micro} ${t.hairline} ${t.faint}`}>
                                        Fourchette indicative. Le devis final est établi par Anaïs après étude de vos informations et de vos photos.
                                    </p>
                                    <p className={`mt-3 ${QUOTE_TYPE.micro} ${t.faint}`}>
                                        En envoyant, vous autorisez Seconde Vie à utiliser ces informations uniquement pour étudier et suivre votre demande.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {isLastStep && submissionState.status !== 'idle' ? (
                        <p
                            role={submissionState.status === 'error' ? 'alert' : 'status'}
                            className={`mt-5 rounded-2xl border px-4 py-3 font-sans text-[12.5px] leading-5 ${submissionState.status === 'error'
                                ? (darkMode ? 'border-red-300/20 bg-red-200/10 text-red-100' : 'border-red-200 bg-red-50 text-red-900')
                                : (darkMode ? 'border-white/10 bg-white/[0.04] text-stone-200' : 'border-stone-200 bg-stone-50 text-stone-700')}`}
                        >
                            {submissionState.message}
                        </p>
                    ) : null}

                    {/* navigation desktop */}
                    <div className={`mt-auto hidden items-center justify-between gap-4 border-t pt-7 lg:flex ${t.hairline}`}>
                        <button
                            type="button"
                            onClick={() => goToStep(step - 1)}
                            disabled={step === 0 || submissionState.status === 'submitting'}
                            className={`inline-flex ${QUOTE_CONTROL_HEIGHT} items-center gap-2.5 rounded-full px-6 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] disabled:pointer-events-none disabled:opacity-0 ${t.ghostBtn} ${t.focusRing}`}
                        >
                            <ArrowLeft size={16} />
                            Retour
                        </button>

                        <button
                            type={isLastStep ? 'submit' : 'button'}
                            onClick={isLastStep ? undefined : step === CONTACT_STEP_INDEX ? showEstimate : () => goToStep(step + 1)}
                            disabled={isLastStep && submissionState.status === 'submitting'}
                            className={`group inline-flex ${QUOTE_CONTROL_HEIGHT} items-center gap-3 rounded-full pl-7 pr-2 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${t.primaryBtn} ${t.focusRing}`}
                        >
                            {isLastStep
                                ? submissionState.status === 'submitting' ? 'Envoi en cours…' : 'Envoyer ma demande'
                                : step === CONTACT_STEP_INDEX ? 'Voir mon estimation' : 'Continuer'}
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${QUOTE_EASE} group-hover:translate-x-0.5 ${darkMode ? 'bg-black/10' : 'bg-white/15'}`}>
                                <ArrowRight size={16} />
                            </span>
                        </button>
                    </div>
                </div>

                {/* barre d'action sticky mobile */}
                <div
                    className={`quote-action-bar fixed inset-x-0 bottom-0 z-[190] border-t px-5 pt-3 backdrop-blur-xl lg:hidden ${t.hairline} ${t.barBg}`}
                >
                    <div className="quote-action-bar-inner mx-auto flex max-w-[640px] items-center gap-4">
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={() => goToStep(step - 1)}
                                disabled={submissionState.status === 'submitting'}
                                aria-label="Étape précédente"
                                className={`flex ${QUOTE_CONTROL_HEIGHT} w-[52px] shrink-0 items-center justify-center rounded-full ${QUOTE_EASE} active:scale-[0.96] ${t.ghostBtn} ${t.focusRing}`}
                            >
                                <ArrowLeft size={17} />
                            </button>
                        ) : null}

                        <div className="min-w-0 flex-1">
                            <p className={`font-sans text-[10px] font-semibold uppercase tracking-[0.14em] ${t.faint}`}>
                                Étape {step + 1} / {steps.length}
                            </p>
                            <p className="truncate font-sans text-[14px] font-semibold">{activeStep.label}</p>
                        </div>

                        <button
                            type={isLastStep ? 'submit' : 'button'}
                            onClick={isLastStep ? undefined : step === CONTACT_STEP_INDEX ? showEstimate : () => goToStep(step + 1)}
                            disabled={isLastStep && submissionState.status === 'submitting'}
                            className={`inline-flex ${QUOTE_CONTROL_HEIGHT} shrink-0 items-center gap-2 rounded-full px-6 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55 ${t.primaryBtn} ${t.focusRing}`}
                        >
                            {isLastStep
                                ? submissionState.status === 'submitting' ? 'Envoi…' : 'Envoyer'
                                : step === CONTACT_STEP_INDEX ? "Voir l'estimation" : 'Continuer'}
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
                </fieldset>
            </form>
        </div>
    );
};

export default QuoteFormIsland;
