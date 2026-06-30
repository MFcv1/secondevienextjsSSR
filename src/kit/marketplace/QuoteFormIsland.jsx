'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const IconBase = ({ size = 24, strokeWidth = 1.5, className = '', children }) => (
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

const ArrowRight = (props) => (
    <IconBase {...props}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
    </IconBase>
);

const Check = (props) => (
    <IconBase {...props}>
        <path d="m20 6-11 11-5-5" />
    </IconBase>
);

const ChevronDown = (props) => (
    <IconBase {...props}>
        <path d="m6 9 6 6 6-6" />
    </IconBase>
);

const HelpCircle = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.1 9a3 3 0 1 1 5.8 1c-.6 1-1.6 1.4-2.2 2.2-.4.5-.6 1-.6 1.8" />
        <path d="M12 17h.01" />
    </IconBase>
);

const Info = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </IconBase>
);

const Mail = (props) => (
    <IconBase {...props}>
        <rect width="18" height="14" x="3" y="5" rx="2" />
        <path d="m3 7 9 6 9-6" />
    </IconBase>
);

const Phone = (props) => (
    <IconBase {...props}>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" />
    </IconBase>
);

const Ruler = (props) => (
    <IconBase {...props}>
        <path d="M21.3 15.3 15.3 21.3a2.4 2.4 0 0 1-3.4 0L2.7 12.1a2.4 2.4 0 0 1 0-3.4l6-6a2.4 2.4 0 0 1 3.4 0l9.2 9.2a2.4 2.4 0 0 1 0 3.4Z" />
        <path d="m14.5 4.5-2 2" />
        <path d="m18.5 8.5-2 2" />
        <path d="m10.5 8.5-2 2" />
        <path d="m14.5 12.5-2 2" />
    </IconBase>
);

const Upload = (props) => (
    <IconBase {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M17 8 12 3 7 8" />
        <path d="M12 3v12" />
    </IconBase>
);

const Wand2 = (props) => (
    <IconBase {...props}>
        <path d="m21.6 3.6-2.2-2.2a1.4 1.4 0 0 0-2 0L2.4 16.4a1.4 1.4 0 0 0 0 2l2.2 2.2a1.4 1.4 0 0 0 2 0l15-15a1.4 1.4 0 0 0 0-2Z" />
        <path d="m14 5 5 5" />
        <path d="M5 2v3" />
        <path d="M19 14v3" />
        <path d="M10 2v2" />
        <path d="M7 8H4" />
        <path d="M21 19h-3" />
    </IconBase>
);

const furnitureTypes = [
    { id: 'buffet', label: 'Buffet', image: '/images/newsletter/discount-sideboard.webp' },
    { id: 'armoire', label: 'Armoire', image: '/images/hero/hero-blob-1.webp' },
    { id: 'commode', label: 'Commode', image: '/images/before-after/apresu.webp' },
    { id: 'miroir', label: 'Miroir', image: '/images/gallery-hero-4.webp' },
    { id: 'chaise', label: 'Chaise', image: '/images/gallery-hero-1.webp' },
    { id: 'table', label: 'Table', image: '/images/hero/hero-furniture.webp' },
    { id: 'autre', label: 'Autre', image: null }
];

const MAX_PHOTOS = 10;

const serviceGroups = [
    {
        id: 'preparation',
        title: 'Préparation',
        subtitle: 'Nettoyage & diagnostic',
        services: [
            {
                id: 'poncage',
                label: 'Ponçage manuel adapté',
                text: 'Ponçage en plusieurs grains pour retirer les anciennes couches sans abîmer le bois.',
                min: 45,
                max: 120,
                defaultSelected: true
            },
            {
                id: 'nettoyage',
                label: 'Nettoyage & dépoussiérage profond',
                text: 'Élimination des saletés, graisses et résidus accumulés.',
                min: 20,
                max: 45,
                defaultSelected: true
            }
        ]
    },
    {
        id: 'bois',
        title: 'Restauration du bois',
        subtitle: 'Redonner vie à la matière',
        services: [
            {
                id: 'entretien',
                label: "Application d'un produit d'entretien",
                text: 'Nourrit le bois en profondeur et ravive sa patine naturelle.',
                min: 25,
                max: 55,
                defaultSelected: true
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
        subtitle: 'Consolidation & structure',
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
        subtitle: 'Patine & protection',
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

const formatPhotoName = (name = '') => {
    const cleanName = name.replace(/\.[^/.]+$/, '');
    if (cleanName.length <= 10) return cleanName;
    return `${cleanName.slice(0, 10)}...`;
};

const QuoteFormIsland = ({ initialDarkMode = false }) => {
    const darkMode = initialDarkMode;
    const [selectedType, setSelectedType] = useState('buffet');
    const [activeGroup, setActiveGroup] = useState('bois');
    const [hoveredGroup, setHoveredGroup] = useState(null);
    const [selectedServices, setSelectedServices] = useState(() => {
        const defaults = {};
        serviceGroups.forEach(group => {
            group.services.forEach(service => {
                defaults[service.id] = Boolean(service.defaultSelected);
            });
        });
        return defaults;
    });
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef(null);
    const photoPreviewsRef = useRef([]);
    const serviceGroupRefs = useRef({});

    useEffect(() => {
        document.getElementById('quote-ssr-form-shell')?.setAttribute('hidden', '');
    }, []);

    useEffect(() => {
        photoPreviewsRef.current = photoPreviews;
    }, [photoPreviews]);

    useEffect(() => () => {
        photoPreviewsRef.current.forEach(photo => URL.revokeObjectURL(photo.url));
    }, []);

    const selectedServiceList = useMemo(
        () => serviceGroups.flatMap(group => group.services).filter(service => selectedServices[service.id]),
        [selectedServices]
    );

    const estimate = useMemo(() => {
        return selectedServiceList.reduce(
            (acc, service) => ({
                min: acc.min + service.min,
                max: acc.max + service.max
            }),
            { min: 0, max: 0 }
        );
    }, [selectedServiceList]);

    const handleFiles = (files) => {
        const incoming = Array.from(files || []).slice(0, Math.max(0, MAX_PHOTOS - photoPreviews.length));
        if (!incoming.length) return;

        const next = incoming.map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            url: URL.createObjectURL(file)
        }));
        setPhotoPreviews(prev => [...prev, ...next]);
    };

    const removePhoto = (id) => {
        setPhotoPreviews(prev => {
            const target = prev.find(photo => photo.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter(photo => photo.id !== id);
        });
    };

    const toggleService = (id) => {
        setSelectedServices(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGroupSelect = (id) => {
        setActiveGroup(id);
        const node = serviceGroupRefs.current[id];
        if (!node || typeof window === 'undefined') return;

        const rect = node.getBoundingClientRect();
        const shouldScroll = window.innerWidth < 1024 || rect.top < 120 || rect.bottom > window.innerHeight - 80;
        if (shouldScroll) {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const type = furnitureTypes.find(item => item.id === selectedType)?.label || selectedType;
        const body = [
            'Bonjour Anais,',
            '',
            `Je souhaite recevoir un devis pour un meuble de type : ${type}.`,
            `État général : ${form.get('condition') || 'Non précisé'}`,
            `Dimensions : ${form.get('height') || '-'} x ${form.get('width') || '-'} x ${form.get('depth') || '-'} cm`,
            '',
            'Prestations souhaitées :',
            ...selectedServiceList.map(service => `- ${service.label} (${service.min}€-${service.max}€)`),
            '',
            `Estimation indicative affichee : ${estimate.min}€ - ${estimate.max}€`,
            '',
            `Description : ${form.get('description') || 'Non précisée'}`,
            `Précision complémentaire : ${form.get('notes') || 'Non précisée'}`,
            '',
            `Contact : ${form.get('firstname') || ''} ${form.get('lastname') || ''}`,
            `Email : ${form.get('email') || ''}`,
            `Telephone : ${form.get('phone') || ''}`,
            `Localisation : ${form.get('location') || ''}`
        ].join('\n');

        setSubmitted(true);
        window.location.href = `mailto:contact@seconde-vie-anais.fr?subject=${encodeURIComponent('Demande de devis restauration')}&body=${encodeURIComponent(body)}`;
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 md:py-12 lg:px-10 xl:px-16">
                <section className="space-y-5">
                    <h2 className="font-serif text-2xl leading-tight md:text-[2rem]">1. Quel type de meuble souhaitez-vous faire restaurer ?</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                        {furnitureTypes.map(type => {
                            const isSelected = selectedType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setSelectedType(type.id)}
                                    className={`group min-h-[142px] rounded-[8px] p-2.5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSelected
                                        ? 'bg-white ring-1 ring-[#9A714C] shadow-[0_18px_45px_rgba(86,61,39,0.12)]'
                                        : darkMode ? 'bg-white/[0.045] ring-1 ring-white/8 hover:bg-white/[0.07]' : 'bg-white/58 ring-1 ring-[#eee7df] hover:bg-white'
                                    }`}
                                >
                                    <span className="flex h-[88px] items-center justify-center overflow-hidden rounded-[6px]">
                                        {type.image ? (
                                            <img
                                                src={type.image}
                                                alt={type.label}
                                                className="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className={`flex h-14 w-14 items-center justify-center rounded-full ring-1 ${darkMode ? 'ring-white/16' : 'ring-[#d6c8b9]'}`}>
                                                <HelpCircle size={24} strokeWidth={1.35} />
                                            </span>
                                        )}
                                    </span>
                                    <span className="mt-3 block font-sans text-[13px] font-semibold">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eee7df]'}`}>
                        <h2 className="font-serif text-2xl leading-tight">2. Décrivez votre meuble</h2>
                        <div className="mt-5 space-y-4 font-sans">
                            <label className="block">
                                <span className="text-[12px] font-bold">État général</span>
                                <span className="relative mt-2 block">
                                    <select
                                        name="condition"
                                        className={`h-12 w-full appearance-none rounded-[6px] px-4 pr-10 text-[13px] outline-none ring-1 transition-colors ${darkMode ? 'bg-[#151515] ring-white/10 focus:ring-white/24' : 'bg-white ring-[#ddd3c9] focus:ring-[#9A714C]/50'}`}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Sélectionnez l’état général</option>
                                        <option>Bon état, entretien léger</option>
                                        <option>Rayures ou marques visibles</option>
                                        <option>Structure fragilisée</option>
                                        <option>Restauration complète</option>
                                    </select>
                                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-55" />
                                </span>
                            </label>
                            <label className="block">
                                <span className="text-[12px] font-bold">Description des travaux souhaités</span>
                                <textarea
                                    name="description"
                                    rows={5}
                                    placeholder="Décrivez votre projet, les réparations ou finitions souhaitées..."
                                    className={`mt-2 w-full resize-none rounded-[6px] p-4 text-[13px] outline-none ring-1 transition-colors ${darkMode ? 'bg-[#151515] ring-white/10 placeholder:text-stone-600 focus:ring-white/24' : 'bg-white ring-[#ddd3c9] placeholder:text-[#a49a91] focus:ring-[#9A714C]/50'}`}
                                />
                            </label>
                            <div>
                                <span className="flex items-center gap-2 text-[12px] font-bold">
                                    <Ruler size={14} strokeWidth={1.5} />
                                    Dimensions <span className="font-normal opacity-55">(facultatif)</span>
                                </span>
                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {[
                                        ['height', 'Hauteur (cm)'],
                                        ['width', 'Largeur (cm)'],
                                        ['depth', 'Profondeur (cm)']
                                    ].map(([name, placeholder]) => (
                                        <input
                                            key={name}
                                            name={name}
                                            type="number"
                                            min="0"
                                            placeholder={placeholder}
                                            className={`h-12 rounded-[6px] px-4 text-[13px] outline-none ring-1 transition-colors ${darkMode ? 'bg-[#151515] ring-white/10 placeholder:text-stone-600 focus:ring-white/24' : 'bg-white ring-[#ddd3c9] placeholder:text-[#a49a91] focus:ring-[#9A714C]/50'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={`flex h-full min-h-[420px] flex-col rounded-[8px] p-4 ring-1 sm:p-6 ${darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eee7df]'}`}>
                        <h2 className="font-serif text-2xl leading-tight">3. Ajoutez des photos</h2>
                        <p className={`mt-2 font-sans text-[12px] ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>Plus vous ajoutez de photos, plus le devis sera précis.</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault();
                                handleFiles(event.dataTransfer.files);
                            }}
                            className={`mt-5 flex w-full flex-col items-center justify-center rounded-[8px] border border-dashed p-6 text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${photoPreviews.length > 0 ? 'min-h-[104px] flex-none' : 'min-h-[280px] flex-1'} ${darkMode ? 'border-white/16 bg-[#151515] hover:border-white/36' : 'border-[#d4c4b4] bg-white/58 hover:border-[#9A714C]'}`}
                        >
                            <Upload size={photoPreviews.length > 0 ? 22 : 34} strokeWidth={1.35} />
                            <span className="mt-4 font-sans text-[13px] font-bold">{photoPreviews.length > 0 ? 'Ajouter d’autres photos' : 'Cliquez pour ajouter vos photos'}</span>
                            <span className={`mt-1 font-sans text-[12px] ${darkMode ? 'text-stone-500' : 'text-[#7c7168]'}`}>ou glissez-déposez ici</span>
                            <span className={`mt-4 font-sans text-[11px] ${darkMode ? 'text-stone-600' : 'text-[#9b9087]'}`}>
                                JPG, PNG, WEBP · {photoPreviews.length}/{MAX_PHOTOS} photos · conservées temporairement
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            className="hidden"
                            onChange={(event) => handleFiles(event.target.files)}
                        />
                        {photoPreviews.length > 0 && (
                            <div className="mt-4 grid content-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(118px,1fr))]">
                                {photoPreviews.map(photo => (
                                    <button
                                        key={photo.id}
                                        type="button"
                                        onClick={() => removePhoto(photo.id)}
                                        className="group relative aspect-[4/3] max-h-[132px] overflow-hidden rounded-[7px] bg-stone-100"
                                        title="Retirer cette photo"
                                    >
                                        <img src={photo.url} alt={photo.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/55 px-2 py-1 font-sans text-[10px] font-bold text-white backdrop-blur-sm">
                                            {formatPhotoName(photo.name)}
                                        </span>
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                            Retirer
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eee7df]'}`}>
                        <h2 className="font-serif text-2xl leading-tight md:text-[2rem]">4. Choisissez les prestations souhaitées</h2>
                        <p className={`mt-2 font-sans text-[12px] ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>Sélectionnez les interventions que vous souhaitez pour votre meuble.</p>
                        <div className="mt-6 space-y-3">
                            {serviceGroups.map(group => {
                                const isActive = activeGroup === group.id;
                                const isHovered = hoveredGroup === group.id;
                                const selectedCount = group.services.filter(service => selectedServices[service.id]).length;

                                return (
                                    <div
                                        key={group.id}
                                        ref={(node) => {
                                            if (node) serviceGroupRefs.current[group.id] = node;
                                        }}
                                        className="grid gap-3 md:grid-cols-[210px_34px_minmax(0,1fr)] md:items-stretch"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleGroupSelect(group.id)}
                                            onMouseEnter={() => setHoveredGroup(group.id)}
                                            onMouseLeave={() => setHoveredGroup(null)}
                                            onFocus={() => setHoveredGroup(group.id)}
                                            onBlur={() => setHoveredGroup(null)}
                                            className={`relative min-h-[92px] rounded-[8px] p-4 text-left transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:min-h-full ${isHovered
                                                ? darkMode ? 'bg-white/10 ring-1 ring-white/22' : 'bg-[#fbf1e7] ring-1 ring-[#d8b991] shadow-[0_14px_35px_rgba(120,86,51,0.08)]'
                                                : darkMode ? 'bg-[#151515] ring-1 ring-white/8 hover:bg-white/[0.06]' : 'bg-white/70 ring-1 ring-[#eee7df] hover:bg-white'
                                            }`}
                                        >
                                            <span className="flex items-start justify-between gap-3">
                                                <span>
                                                    <span className="block font-sans text-[12px] font-bold">{group.title}</span>
                                                    <span className={`mt-2 block font-sans text-[11px] leading-relaxed ${darkMode ? 'text-stone-500' : 'text-[#6e655d]'}`}>{group.subtitle}</span>
                                                </span>
                                                <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-sans text-[10px] font-bold transition-all ${selectedCount > 0
                                                    ? 'bg-[#d5b99d] text-white'
                                                    : darkMode ? 'bg-white/8 text-stone-500' : 'bg-[#f2ece5] text-[#9a8f84]'
                                                }`}>
                                                    {selectedCount}
                                                </span>
                                            </span>
                                            <span className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'} ${darkMode ? 'bg-white/50' : 'bg-[#b98a5d]'}`} />
                                        </button>

                                        <div className="hidden items-center md:flex" aria-hidden="true">
                                            <span className={`h-px flex-1 transition-colors ${isHovered ? 'bg-[#b98a5d]' : darkMode ? 'bg-white/10' : 'bg-[#e4d8ca]'}`} />
                                            <span className={`h-2.5 w-2.5 rounded-full ring-4 transition-all ${isHovered
                                                ? darkMode ? 'bg-white ring-white/10' : 'bg-[#b98a5d] ring-[#f4e7d9]'
                                                : darkMode ? 'bg-white/20 ring-white/5' : 'bg-[#d8cfc6] ring-[#f8f4ef]'
                                            }`} />
                                            <span className={`h-px flex-1 transition-colors ${isHovered ? 'bg-[#b98a5d]' : darkMode ? 'bg-white/10' : 'bg-[#e4d8ca]'}`} />
                                        </div>

                                        <div className={`overflow-hidden rounded-[8px] ring-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive
                                            ? darkMode ? 'ring-white/22' : 'ring-[#d8b991] shadow-[0_14px_35px_rgba(120,86,51,0.06)]'
                                            : darkMode ? 'ring-white/8' : 'ring-[#eadfd3]'
                                        }`}>
                                            {group.services.map(service => {
                                                const checked = Boolean(selectedServices[service.id]);
                                                return (
                                                    <div
                                                        key={service.id}
                                                        onClick={() => setActiveGroup(group.id)}
                                                        className={`grid gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[26px_1fr_auto] sm:p-5 ${darkMode ? 'border-white/8' : 'border-[#eadfd3]'}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setActiveGroup(group.id);
                                                                toggleService(service.id);
                                                            }}
                                                            className={`flex h-[22px] w-[22px] items-center justify-center rounded-[5px] ring-1 transition-all ${checked ? 'bg-[#d5b99d] text-white ring-[#d5b99d]' : darkMode ? 'bg-transparent ring-white/18' : 'bg-white ring-[#d2c7bb]'}`}
                                                            aria-label={checked ? `Retirer ${service.label}` : `Ajouter ${service.label}`}
                                                        >
                                                            {checked && <Check size={14} strokeWidth={2} />}
                                                        </button>
                                                        <div>
                                                            <h3 className="font-sans text-[13px] font-bold">{service.label}</h3>
                                                            <p className={`mt-1 max-w-[42rem] font-sans text-[12px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>{service.text}</p>
                                                            {service.hasSeverity && checked && (
                                                                <label className="mt-4 inline-flex items-center gap-3 font-sans text-[12px]">
                                                                    <span className={darkMode ? 'text-stone-400' : 'text-[#6e655d]'}>Severite des defauts</span>
                                                                    <span className="relative">
                                                                        <select name="severity" className={`h-10 appearance-none rounded-[6px] px-4 pr-9 text-[12px] outline-none ring-1 ${darkMode ? 'bg-[#151515] ring-white/10' : 'bg-white ring-[#ddd3c9]'}`} defaultValue="Moderes">
                                                                            <option>Legers</option>
                                                                            <option>Moderes</option>
                                                                            <option>Importants</option>
                                                                        </select>
                                                                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-55" />
                                                                    </span>
                                                                </label>
                                                            )}
                                                        </div>
                                                        <div className="font-sans text-[13px] font-semibold sm:text-right">{service.min}€ - {service.max}€</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="grid gap-3 md:grid-cols-[210px_34px_minmax(0,1fr)]">
                                <div className="hidden md:block" />
                                <div className="hidden md:block" />
                                <div className={`flex items-start gap-3 rounded-[8px] p-4 font-sans text-[12px] ${darkMode ? 'bg-white/[0.045] text-stone-300' : 'bg-[#f7efe5] text-[#5d5146]'}`}>
                                    <Info size={16} strokeWidth={1.45} className="mt-0.5 shrink-0" />
                                    <span>Besoin d'un conseil ? Anais etudiera votre demande et ajustera le devis si necessaire.</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
                        <div className={`rounded-[8px] p-6 ring-1 ${darkMode ? 'bg-white/[0.045] ring-white/8' : 'bg-white/82 ring-[#eadfd3]'}`}>
                            <h2 className="font-serif text-2xl leading-tight">Estimation en temps reel</h2>
                            <p className={`mt-2 font-sans text-[12px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>Le prix varie selon les prestations et l'etat de votre meuble.</p>
                            <p className="mt-6 font-sans text-[12px] font-bold">Fourchette estimative</p>
                            <div className="mt-2 font-serif text-[3rem] leading-none tracking-normal">{estimate.min}€ - {estimate.max}€</div>
                            <p className="mt-3 font-sans text-[13px] font-semibold">Délai estimé : 2 à 4 semaines</p>
                            <div className={`my-6 h-px ${darkMode ? 'bg-white/10' : 'bg-[#eadfd3]'}`} />
                            <div className="space-y-3">
                                {selectedServiceList.map(service => (
                                    <div key={service.id} className="flex justify-between gap-4 font-sans text-[12px]">
                                        <span className={darkMode ? 'text-stone-400' : 'text-[#6e655d]'}>{service.label}</span>
                                        <span className="shrink-0 font-semibold">{service.min}€ - {service.max}€</span>
                                    </div>
                                ))}
                            </div>
                            <div className={`my-6 h-px ${darkMode ? 'bg-white/10' : 'bg-[#eadfd3]'}`} />
                            <div className="flex justify-between gap-4 font-sans text-[14px] font-bold">
                                <span>Total estimatif</span>
                                <span>{estimate.min}€ - {estimate.max}€</span>
                            </div>
                            <p className={`mt-5 font-sans text-[11px] leading-relaxed ${darkMode ? 'text-stone-500' : 'text-[#887b70]'}`}>Cette estimation est indicative. Le devis final vous sera envoye sous 48h apres etude detaillee.</p>
                        </div>

                        <div className={`rounded-[8px] p-5 ring-1 ${darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eadfd3]'}`}>
                            <h3 className="flex items-center gap-2 font-serif text-xl">
                                <HelpCircle size={18} strokeWidth={1.45} />
                                Besoin de précisions ?
                            </h3>
                            <p className={`mt-2 font-sans text-[12px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>Anais peut vous conseiller selon votre projet et l'etat reel du meuble.</p>
                            <a href="tel:+33612345678" className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-3 rounded-[6px] border font-sans text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${darkMode ? 'border-white/14 hover:bg-white hover:text-black' : 'border-[#2a2520] hover:bg-[#2a2520] hover:text-white'}`}>
                                <Phone size={15} strokeWidth={1.45} />
                                Etre rappele
                            </a>
                        </div>
                    </aside>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
                    <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eee7df]'}`}>
                        <h2 className="font-serif text-2xl leading-tight">5. Vos informations</h2>
                        <div className="mt-5 grid gap-4 font-sans sm:grid-cols-2">
                            {[
                                ['firstname', 'Prenom', 'Votre prenom', 'text'],
                                ['lastname', 'Nom', 'Votre nom', 'text'],
                                ['email', 'Email', 'votre@email.com', 'email'],
                                ['phone', 'Telephone', '06 12 34 56 78', 'tel']
                            ].map(([name, label, placeholder, type]) => (
                                <label key={name} className="block">
                                    <span className="text-[12px] font-bold">{label}</span>
                                    <input
                                        name={name}
                                        type={type}
                                        required={['firstname', 'email', 'phone'].includes(name)}
                                        placeholder={placeholder}
                                        className={`mt-2 h-12 w-full rounded-[6px] px-4 text-[13px] outline-none ring-1 transition-colors ${darkMode ? 'bg-[#151515] ring-white/10 placeholder:text-stone-600 focus:ring-white/24' : 'bg-white ring-[#ddd3c9] placeholder:text-[#a49a91] focus:ring-[#9A714C]/50'}`}
                                    />
                                </label>
                            ))}
                            <label className="block sm:col-span-2">
                                <span className="text-[12px] font-bold">Localisation du meuble</span>
                                <input
                                    name="location"
                                    placeholder="Ville ou code postal"
                                    className={`mt-2 h-12 w-full rounded-[6px] px-4 text-[13px] outline-none ring-1 transition-colors ${darkMode ? 'bg-[#151515] ring-white/10 placeholder:text-stone-600 focus:ring-white/24' : 'bg-white ring-[#ddd3c9] placeholder:text-[#a49a91] focus:ring-[#9A714C]/50'}`}
                                />
                            </label>
                        </div>
                    </section>

                    <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eee7df]'}`}>
                        <h2 className="font-serif text-2xl leading-tight">6. Informations complementaires <span className="font-sans text-[12px] opacity-55">(facultatif)</span></h2>
                        <label className="mt-5 block font-sans">
                            <span className="text-[12px] font-bold">Souhaitez-vous ajouter des précisions ?</span>
                            <textarea
                                name="notes"
                                rows={7}
                                placeholder="Informations supplémentaires, contraintes d’accès, délais souhaités, etc."
                                className={`mt-2 w-full resize-none rounded-[6px] p-4 text-[13px] outline-none ring-1 transition-colors ${darkMode ? 'bg-[#151515] ring-white/10 placeholder:text-stone-600 focus:ring-white/24' : 'bg-white ring-[#ddd3c9] placeholder:text-[#a49a91] focus:ring-[#9A714C]/50'}`}
                            />
                        </label>
                    </section>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
                    <section className={`rounded-[8px] p-7 text-center ring-1 ${darkMode ? 'bg-white/[0.055] ring-white/8' : 'bg-[#f4eee7] ring-[#eadfd3]'}`}>
                        <Wand2 size={24} strokeWidth={1.35} className="mx-auto mb-4 opacity-70" />
                        <h2 className="font-serif text-2xl leading-tight md:text-3xl">Prêt à redonner vie à votre meuble ?</h2>
                        <p className={`mx-auto mt-4 max-w-[18rem] font-sans text-[13px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>Envoyez votre demande et recevez votre devis personnalisé sous 48h.</p>
                        <button
                            type="submit"
                            className={`group mt-7 inline-flex min-h-[58px] w-full max-w-[300px] items-center justify-center gap-4 rounded-[8px] px-6 font-sans text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ${darkMode ? 'bg-white text-[#171411] hover:bg-[#d7c0a8]' : 'bg-[#2a2928] text-white hover:bg-[#111]'}`}
                        >
                            Envoyer ma demande de devis
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 ${darkMode ? 'bg-black/8' : 'bg-white/10'}`}>
                                <ArrowRight size={16} strokeWidth={1.5} />
                            </span>
                        </button>
                        <p className={`mt-4 font-sans text-[11px] ${darkMode ? 'text-stone-500' : 'text-[#8a7d72]'}`}>Sans engagement</p>
                        {submitted && (
                            <div className={`mt-5 flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 font-sans text-[12px] ${darkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`}>
                                <Mail size={14} strokeWidth={1.5} />
                                Votre email de demande est pret.
                            </div>
                        )}
                    </section>
                </div>
        </form>
    );
};

export default QuoteFormIsland;
