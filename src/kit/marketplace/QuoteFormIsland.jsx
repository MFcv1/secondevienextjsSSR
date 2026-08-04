'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { emitAnalyticsEvent } from '../shared/analyticsEvents';
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

const CONTACT_EMAIL = 'contact@seconde-vie-anais.fr';
const CONTACT_PHONE = '+33612345678';
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

const serviceGroups = [
    {
        id: 'preparation',
        title: 'Préparation',
        services: [
            {
                id: 'poncage',
                label: 'Ponçage manuel adapté',
                text: 'Ponçage en plusieurs grains pour retirer les anciennes couches sans abîmer le bois.',
                min: 45,
                max: 120,
                defaultSelected: false
            },
            {
                id: 'nettoyage',
                label: 'Nettoyage & dépoussiérage profond',
                text: 'Élimination des saletés, graisses et résidus accumulés.',
                min: 20,
                max: 45,
                defaultSelected: false
            }
        ]
    },
    {
        id: 'bois',
        title: 'Restauration du bois',
        services: [
            {
                id: 'entretien',
                label: "Application d'un produit d'entretien",
                text: 'Nourrit le bois en profondeur et ravive sa patine naturelle.',
                min: 25,
                max: 55,
                defaultSelected: false
            },
            {
                id: 'defauts',
                label: 'Rattrapage des défauts',
                text: 'Comblement des trous, fissures, impacts et rayures.',
                min: 25,
                max: 90,
                hasSeverity: true,
                defaultSelected: false
            }
        ]
    },
    {
        id: 'reparations',
        title: 'Réparations',
        services: [
            {
                id: 'renforts',
                label: 'Renforts & consolidation',
                text: 'Resserrage, collage, renforcement des assemblages fragilisés.',
                min: 40,
                max: 110,
                defaultSelected: false
            }
        ]
    },
    {
        id: 'finition',
        title: 'Finition',
        services: [
            {
                id: 'protection',
                label: 'Finition & protection',
                text: "Application d'une cire ou d'un vernis mat pour protéger durablement.",
                min: 30,
                max: 75,
                defaultSelected: false
            }
        ]
    }
];

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

const formatPhotoName = (name = '') => {
    const cleanName = name.replace(/\.[^/.]+$/, '');
    if (cleanName.length <= 10) return cleanName;
    return `${cleanName.slice(0, 10)}...`;
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
    const [dragging, setDragging] = useState(false);

    const fileInputRef = useRef(null);
    const photoPreviewsRef = useRef([]);
    const railRef = useRef(null);
    const quoteStartTrackedRef = useRef(false);

    /*
     * useLayoutEffect et non useEffect : le shell doit disparaitre dans la
     * meme frame que l'apparition de l'island, sinon les deux coexistent
     * le temps d'une peinture et la page fait un bond.
     */
    useLayoutEffect(() => {
        document.getElementById('quote-ssr-form-shell')?.setAttribute('hidden', '');
        window.dispatchEvent(new Event('quote:form-ready'));
    }, []);

    /*
     * L'island prend la place d'un shell identique, deja apparu avec la
     * cascade d'ouverture. Son premier rendu ne rejoue donc aucune entree :
     * sinon le rail et le panneau semblent surgir une seconde fois.
     * Les animations d'etape ne s'arment qu'a la premiere navigation.
     */
    const [stepMotionArmed, setStepMotionArmed] = useState(false);
    const firstStepRenderRef = useRef(true);

    useEffect(() => {
        if (firstStepRenderRef.current) {
            firstStepRenderRef.current = false;
            return;
        }
        setStepMotionArmed(true);
    }, [step]);

    const panelMotion = stepMotionArmed ? 'quote-step' : '';
    const contentMotion = stepMotionArmed ? 'quote-stagger' : '';
    const cardsMotion = stepMotionArmed ? 'quote-cards' : '';
    const initialStepReveal = step === 0 && !stepMotionArmed;

    useEffect(() => {
        photoPreviewsRef.current = photoPreviews;
    }, [photoPreviews]);

    useEffect(() => () => {
        photoPreviewsRef.current.forEach(photo => URL.revokeObjectURL(photo.url));
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

    const handleFiles = useCallback((files) => {
        trackQuoteStart();
        setPhotoPreviews(prev => {
            const room = Math.max(0, MAX_PHOTOS - prev.length);
            const incoming = Array.from(files || []).slice(0, room);
            if (!incoming.length) return prev;
            const next = incoming.map(file => ({
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                name: file.name,
                url: URL.createObjectURL(file)
            }));
            return [...prev, ...next];
        });
    }, [trackQuoteStart]);

    const removePhoto = useCallback((id) => {
        setPhotoPreviews(prev => {
            const target = prev.find(photo => photo.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter(photo => photo.id !== id);
        });
    }, []);

    const toggleService = useCallback((id) => {
        trackQuoteStart();
        setSelectedServices(prev => ({ ...prev, [id]: !prev[id] }));
    }, [trackQuoteStart]);

    const goToStep = useCallback((nextStep) => {
        const target = Math.min(steps.length - 1, Math.max(0, nextStep));
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

    const dimensionsLine = `${fields.height || '-'} x ${fields.width || '-'} x ${fields.depth || '-'} cm`;

    const buildMailBody = useCallback(() => [
        'Bonjour Anaïs,',
        '',
        `Je souhaite recevoir un devis pour un meuble de type : ${selectedTypeLabel}.`,
        `État général : ${fields.condition || 'Non précisé'}`,
        `Dimensions : ${dimensionsLine}`,
        `Poids : ${fields.weight ? `${fields.weight} kg` : 'Non précisé'}`,
        '',
        'Prestations souhaitées :',
        ...selectedServiceList.map(service => `- ${service.label} (${service.min}€-${service.max}€)${service.hasSeverity ? ` [défauts ${fields.severity}]` : ''}`),
        '',
        `Estimation indicative affichée : ${estimate.min}€ - ${estimate.max}€`,
        `Photos préparées : ${photoPreviews.length}`,
        '',
        `Description : ${fields.description || 'Non précisée'}`,
        `Précision complémentaire : ${fields.notes || 'Non précisée'}`,
        '',
        `Contact : ${fields.firstname} ${fields.lastname}`.trim(),
        `Email : ${fields.email}`,
        `Téléphone : ${fields.phone}`,
        `Localisation : ${fields.location}`
    ].join('\n'), [selectedTypeLabel, fields, dimensionsLine, selectedServiceList, estimate, photoPreviews.length]);

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

    const handleSubmit = (event) => {
        event.preventDefault();
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

        emitAnalyticsEvent('quote_email_opened', null, null, {
            form: 'restoration',
            selectedServices: selectedServiceList.length,
            photoCount: photoPreviews.length,
            furnitureType: selectedType
        });

        setSubmitted(true);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Demande de devis restauration')}&body=${encodeURIComponent(buildMailBody())}`;
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
                    <h2 className={`quote-balance mt-6 ${QUOTE_TYPE.section}`}>Votre demande est prête</h2>
                    <p className={`mt-4 max-w-[46ch] font-sans text-[14px] leading-[1.65] ${t.muted}`}>
                        Votre logiciel de messagerie vient de s'ouvrir avec le récapitulatif ci-dessous.
                        Il ne reste qu'à l'envoyer, puis à y joindre vos photos.
                    </p>

                    <dl className={`mt-8 divide-y ${QUOTE_RADIUS_CARD} ${t.divide} ${t.panelQuiet}`}>
                        {[
                            ['Meuble', selectedTypeLabel],
                            ['État général', fields.condition || 'Non précisé'],
                            ['Prestations', selectedServiceList.length ? `${selectedServiceList.length} sélectionnée${selectedServiceList.length > 1 ? 's' : ''}` : 'À définir'],
                            ['Estimation', selectedServiceList.length ? formatRange(estimate.min, estimate.max) : 'Sur devis'],
                            ['Photos', photoPreviews.length ? `${photoPreviews.length} à joindre` : 'Aucune'],
                            ['Contact', [fields.firstname, fields.lastname].filter(Boolean).join(' ') || '—']
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-baseline justify-between gap-6 px-5 py-3.5">
                                <dt className={`${QUOTE_TYPE.meta} ${t.muted}`}>{label}</dt>
                                <dd className="text-right font-sans text-[13.5px] font-semibold">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className={`mt-6 ${QUOTE_RADIUS_CARD} p-5 ${t.panelQuiet}`}>
                        <p className="font-sans text-[13px] font-semibold">Rien ne s'est ouvert ?</p>
                        <p className={`mt-1.5 ${QUOTE_TYPE.meta} ${t.muted}`}>
                            Copiez le récapitulatif et envoyez-le à {CONTACT_EMAIL}, ou appelez l'atelier.
                        </p>
                        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => navigator.clipboard?.writeText(buildMailBody())}
                                className={`inline-flex h-12 items-center justify-center rounded-full px-6 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] ${t.primaryBtn} ${t.focusRing}`}
                            >
                                Copier le récapitulatif
                            </button>
                            <a
                                href={`tel:${CONTACT_PHONE}`}
                                className={`inline-flex h-12 items-center justify-center rounded-full px-6 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] ${t.ghostBtn} ${t.focusRing}`}
                            >
                                Appeler l'atelier
                            </a>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSubmitted(false);
                            goToStep(0);
                        }}
                        className={`mt-7 font-sans text-[13px] font-semibold underline decoration-1 underline-offset-4 ${t.muted} ${t.focusRing}`}
                    >
                        Modifier ma demande
                    </button>
                </div>
            </div>
        );
    }

    const activeStep = steps[step];
    const isLastStep = step === steps.length - 1;

    return (
        <div className={`${QUOTE_SHELL} pb-6 pt-6 lg:pt-9`}>
            {/* rail d'etapes : colonnes egales + piste de progression */}
            <div
                ref={railRef}
                data-quote-reveal="progress"
                className={`quote-reveal quote-anchor sticky top-16 z-30 -mx-5 mb-6 border-b px-5 py-3.5 backdrop-blur-xl sm:-mx-8 sm:px-8 md:top-[76px] lg:mx-0 lg:mb-6 lg:rounded-[18px] lg:border lg:px-7 lg:py-4 ${t.hairline} ${t.railBg}`}
            >
                <div className="flex items-baseline justify-between gap-4 lg:hidden">
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
                            <li key={item.id} className="min-w-0">
                                <button
                                    type="button"
                                    onClick={() => (index === ESTIMATE_STEP_INDEX ? showEstimate() : goToStep(index))}
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

                <div className={`mt-3 h-[3px] w-full overflow-hidden rounded-full lg:mt-3.5 ${t.trackBg}`} aria-hidden="true">
                    <div
                        className={`quote-progress-fill h-full rounded-full ${t.accentBg}`}
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                {/* gap-8 garantit un ecart minimum entre le contenu et la barre de navigation */}
                <div
                    key={activeStep.id}
                    data-direction={direction}
                    data-quote-reveal={initialStepReveal ? 'step-1' : undefined}
                    className={`${initialStepReveal ? 'quote-reveal-group' : ''} ${panelMotion} flex flex-col gap-7 ${QUOTE_STEP_HEIGHT} ${QUOTE_STEP_RADIUS} ${QUOTE_STEP_PADDING} ${t.stepPanel}`}
                >
                    <div className={`${contentMotion} min-h-0 flex-1 overflow-visible lg:mx-0 lg:px-0`}>
                        <header className={`${initialStepReveal ? 'quote-reveal-item-1' : ''} mb-8 lg:mb-7`}>
                            <p className={`${QUOTE_TYPE.eyebrow} ${t.accent}`}>
                                Étape {step + 1} sur {steps.length}
                            </p>
                            <h2 className={`quote-balance mt-3 max-w-[24ch] ${QUOTE_TYPE.section}`}>
                                {activeStep.title}
                            </h2>
                            <p className={`${step === 1 ? 'mt-5' : 'mt-3'} max-w-[56ch] ${QUOTE_TYPE.body} ${t.muted}`}>
                                {activeStep.hint}
                            </p>
                        </header>

                        {/* 1 — TYPE DE MEUBLE */}
                        {step === 0 && (
                            <div>
                                <div
                                    role="radiogroup"
                                    aria-label="Type de meuble"
                                    className={`${cardsMotion} mx-auto grid w-full max-w-[430px] grid-cols-2 gap-3 lg:max-w-none lg:grid-cols-6`}
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
                                                className={`${initialStepReveal ? `quote-reveal-item-${index + 2}` : ''} group relative overflow-hidden ${QUOTE_RADIUS_CARD} ${QUOTE_EASE} active:scale-[0.98] ${t.focusRing} ${isSelected ? t.furnitureCardActive : t.furnitureCardIdle}`}
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
                        {step === 2 && (
                            <div>
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className={QUOTE_TYPE.label}>Photos du meuble</span>
                                    <span className={`font-sans text-[11.5px] tabular-nums ${t.faint}`}>
                                        {photoPreviews.length}/{MAX_PHOTOS}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        setDragging(false);
                                        handleFiles(event.dataTransfer.files);
                                    }}
                                    disabled={photoPreviews.length >= MAX_PHOTOS}
                                    className={`mt-2.5 flex w-full flex-col items-center justify-center border border-dashed ${QUOTE_RADIUS_CARD} ${QUOTE_DROPZONE_HEIGHT} px-4 py-8 text-center ${QUOTE_EASE} lg:px-6 lg:py-10 ${t.focusRing} disabled:cursor-not-allowed disabled:opacity-55 ${dragging
                                        ? darkMode ? 'border-[#D9B58D]/70 bg-[#D9B58D]/[0.08]' : 'border-[#8B5C42] bg-[#fbf7f3]'
                                        : darkMode ? 'border-white/16 bg-white/[0.02] hover:border-white/30' : 'border-[#d5cbbf] bg-white hover:border-[#b9ab9a] hover:bg-[#f5f2ee]'
                                    }`}
                                >
                                    <PhotoPlus size={28} strokeWidth={1.4} className={`h-6 w-6 lg:h-7 lg:w-7 ${t.faint}`} />
                                    <span className="mt-3 font-sans text-[13.5px] font-semibold lg:mt-4 lg:text-[14px]">
                                        {photoPreviews.length > 0 ? 'Ajouter d’autres photos' : 'Déposez vos photos'}
                                    </span>
                                    <span className={`mt-1.5 ${QUOTE_TYPE.meta} ${t.muted}`}>
                                        ou cliquez pour parcourir
                                    </span>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => {
                                        handleFiles(event.target.files);
                                        event.target.value = '';
                                    }}
                                />

                                {photoPreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-3 min-[520px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6">
                                        {photoPreviews.map(photo => (
                                            <div
                                                key={photo.id}
                                                className={`group relative aspect-[4/5] overflow-hidden ${QUOTE_RADIUS_FIELD} ${t.imageBed}`}
                                            >
                                                <img src={photo.url} alt={photo.name} className={`h-full w-full object-cover ${QUOTE_EASE} group-hover:scale-[1.05]`} />
                                                <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-black/55 px-2 py-1 font-sans text-[10px] font-semibold text-white backdrop-blur-sm">
                                                    {formatPhotoName(photo.name)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(photo.id)}
                                                    aria-label={`Retirer ${photo.name}`}
                                                    className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm ${QUOTE_EASE} hover:bg-black/80 ${t.focusRing}`}
                                                >
                                                    <Close size={13} strokeWidth={2} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className={`mt-4 ${QUOTE_TYPE.micro} ${t.faint}`}>
                                    Les photos restent sur votre appareil : pensez à les joindre à l'e-mail final.
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
                                            ['Photos', photoPreviews.length ? `${photoPreviews.length} ajoutée${photoPreviews.length > 1 ? 's' : ''}` : 'Aucune'],
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
                                </div>
                            </div>
                        )}
                    </div>

                    {/* navigation desktop */}
                    <div className={`mt-auto hidden items-center justify-between gap-4 border-t pt-7 lg:flex ${t.hairline}`}>
                        <button
                            type="button"
                            onClick={() => goToStep(step - 1)}
                            disabled={step === 0}
                            className={`inline-flex ${QUOTE_CONTROL_HEIGHT} items-center gap-2.5 rounded-full px-6 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] disabled:pointer-events-none disabled:opacity-0 ${t.ghostBtn} ${t.focusRing}`}
                        >
                            <ArrowLeft size={16} />
                            Retour
                        </button>

                        <button
                            type={isLastStep ? 'submit' : 'button'}
                            onClick={isLastStep ? undefined : step === CONTACT_STEP_INDEX ? showEstimate : () => goToStep(step + 1)}
                            className={`group inline-flex ${QUOTE_CONTROL_HEIGHT} items-center gap-3 rounded-full pl-7 pr-2 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] ${t.primaryBtn} ${t.focusRing}`}
                        >
                            {isLastStep ? 'Envoyer ma demande' : step === CONTACT_STEP_INDEX ? 'Voir mon estimation' : 'Continuer'}
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
                            className={`inline-flex ${QUOTE_CONTROL_HEIGHT} shrink-0 items-center gap-2 rounded-full px-6 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.97] ${t.primaryBtn} ${t.focusRing}`}
                        >
                            {isLastStep ? 'Envoyer' : step === CONTACT_STEP_INDEX ? "Voir l'estimation" : 'Continuer'}
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default QuoteFormIsland;
