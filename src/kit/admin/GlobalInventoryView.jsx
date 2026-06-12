import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Loader2, SlidersHorizontal, Maximize2, Minimize2, Grid, GripVertical } from 'lucide-react';
import { getMillis } from '../../utils/time';
import { getProductCardImage, PRODUCT_CARD_IMAGE_SIZES } from '../../utils/imageUtils';
import { db, appId } from '../config/firebase';
import { doc, writeBatch } from 'firebase/firestore';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ZOOM_LEVELS = {
    small: { title: 'Détaillé', size: 56, cols: 'grid-cols-[repeat(auto-fill,minmax(56px,1fr))]', text: 'text-[8px]', icon: <Minimize2 size={14} /> },
    medium: { title: 'Standard', size: 84, cols: 'grid-cols-[repeat(auto-fill,minmax(84px,1fr))]', text: 'text-[9px]', icon: <Grid size={14} /> },
    large: { title: 'Zoom', size: 120, cols: 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))]', text: 'text-[10px]', icon: <Maximize2 size={14} /> },
};

const FALLBACK_ORDER = 999999;

const getInventoryPrice = (item) => item.currentPrice !== undefined ? item.currentPrice : (item.price || 0);

const buildInventoryLists = (items, petitsPrixMax) => {
    const publishedItems = (items || []).filter((item) => item.status === 'published' && !item.sold);

    const nouveautes = [...publishedItems].sort((a, b) => {
        const orderA = a.nouveautesOrder !== undefined ? a.nouveautesOrder : FALLBACK_ORDER;
        const orderB = b.nouveautesOrder !== undefined ? b.nouveautesOrder : FALLBACK_ORDER;
        if (orderA !== orderB) return orderA - orderB;

        const timeA = a.createdAt ? getMillis(a.createdAt) : 0;
        const timeB = b.createdAt ? getMillis(b.createdAt) : 0;
        return timeB - timeA;
    });

    const petitsPrix = publishedItems
        .filter((item) => getInventoryPrice(item) <= petitsPrixMax)
        .sort((a, b) => {
            const orderA = a.petitsPrixOrder !== undefined ? a.petitsPrixOrder : FALLBACK_ORDER;
            const orderB = b.petitsPrixOrder !== undefined ? b.petitsPrixOrder : FALLBACK_ORDER;
            if (orderA !== orderB) return orderA - orderB;

            return getInventoryPrice(a) - getInventoryPrice(b);
        });

    return { nouveautes, petitsPrix };
};

const InventoryTile = React.memo(({
    item,
    onEdit,
    size,
    text,
    darkMode,
    price,
    isDragging = false,
    isReorderMode = false,
    attributes,
    listeners,
    setNodeRef,
    style,
}) => {
    const cardImage = useMemo(() => getProductCardImage(item), [item]);
    const statusRing = item.status === 'published'
        ? `ring-transparent ${darkMode ? 'hover:ring-stone-600' : 'hover:ring-stone-300'}`
        : 'ring-stone-500';

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                contentVisibility: 'auto',
                containIntrinsicSize: `${size}px ${size}px`,
            }}
            className="relative touch-none"
        >
            <div
                {...attributes}
                {...listeners}
                onClick={() => !isDragging && onEdit(item)}
                title={item.name}
                className={`group relative text-left transition-all duration-200 aspect-square rounded-xl md:rounded-2xl overflow-hidden ring-1 shadow-sm active:scale-95
                ${isReorderMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                ${isDragging ? 'shadow-2xl opacity-80 scale-[1.05] ring-amber-500 ring-2' : statusRing}
                ${darkMode ? 'bg-stone-900 ring-stone-700/50' : 'bg-stone-100 ring-stone-200'}`}
            >
                <img
                    src={cardImage.src}
                    srcSet={cardImage.srcSet || undefined}
                    sizes={PRODUCT_CARD_IMAGE_SIZES}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 pointer-events-none"
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    draggable={false}
                />

                <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.12)] transition-shadow duration-200 pointer-events-none" />

                <div className="absolute inset-0 p-1 md:p-1.5 flex flex-col justify-between pointer-events-none z-10">
                    <div className="flex justify-between items-start w-full">
                        <div className="bg-white/95 dark:bg-black/80 px-1.5 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/10">
                            <p className={`font-bold tracking-widest ${darkMode ? 'text-white' : 'text-stone-900'} ${text}`} style={{ fontSize: size < 60 ? '7px' : undefined }}>
                                {price}€
                            </p>
                        </div>
                    </div>
                </div>

                {isReorderMode && (
                    <div className="absolute bottom-1.5 right-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white shadow-sm">
                        <GripVertical size={13} />
                    </div>
                )}

                {!isDragging && (
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center z-20 pointer-events-none">
                        <Pencil size={size > 80 ? 20 : 14} className="text-white drop-shadow-md" />
                    </div>
                )}
            </div>
        </div>
    );
});

InventoryTile.displayName = 'InventoryTile';

const StaticInventoryItem = React.memo((props) => <InventoryTile {...props} />);
StaticInventoryItem.displayName = 'StaticInventoryItem';

const SortableItem = React.memo((props) => {
    const { item } = props;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <InventoryTile
            {...props}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
            style={style}
            isDragging={isDragging}
            isReorderMode
        />
    );
});

SortableItem.displayName = 'SortableItem';

const InventoryGrid = React.memo(({
    dataset,
    title,
    badgeColor,
    listId,
    zoomConfig,
    darkMode,
    onEdit,
    sensors,
    onDragEnd,
    saveStatus,
    isReorderMode,
}) => {
    const { size, cols, text } = zoomConfig;
    const itemIds = useMemo(() => dataset.map((item) => item.id), [dataset]);

    const grid = (
        <div className={`grid gap-2 md:gap-3 ${cols} transition-all duration-300`}>
            {dataset.map((item) => {
                const commonProps = {
                    item,
                    onEdit,
                    size,
                    text,
                    darkMode,
                    price: getInventoryPrice(item),
                };

                return isReorderMode
                    ? <SortableItem key={item.id} {...commonProps} />
                    : <StaticInventoryItem key={item.id} {...commonProps} />;
            })}
        </div>
    );

    return (
        <div
            className={`p-4 md:p-6 mb-6 rounded-[2rem] ring-1 transition-all ${darkMode ? 'bg-stone-800/60 ring-stone-700/50 shadow-inner' : 'bg-white ring-stone-200'}`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '720px' }}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h3 className={`font-serif text-2xl md:text-3xl ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>{title}</h3>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${badgeColor}`}>
                        {dataset.length} items
                    </span>
                </div>
                <div className="flex items-center gap-3 select-none">
                    {saveStatus === 'saving' && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 animate-pulse flex items-center gap-1.5"><Loader2 size={10} className="animate-spin" /> SYNCHRONISATION...</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">ENREGISTRÉ</span>
                    )}
                    {!saveStatus && (
                        <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:inline-block ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            {isReorderMode ? 'DRAG & DROP POUR ORDONNER' : 'CLIC POUR MODIFIER'}
                        </span>
                    )}
                </div>
            </div>

            {isReorderMode ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => onDragEnd(event, listId)}
                >
                    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                        {grid}
                    </SortableContext>
                </DndContext>
            ) : grid}

            {dataset.length === 0 && (
                <div className={`p-8 text-center rounded-2xl border border-dashed ${darkMode ? 'border-stone-700 text-stone-500' : 'border-stone-200 text-stone-400'} mt-4`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Aucun meuble dans cette vue</p>
                </div>
            )}
        </div>
    );
});

InventoryGrid.displayName = 'InventoryGrid';

const GlobalInventoryView = ({ items, onEdit, darkMode }) => {
    const onEditRef = useRef(onEdit);
    const [zoomLevel, setZoomLevel] = useState('medium');
    const [petitsPrixMax, setPetitsPrixMax] = useState(250);
    const [isReorderMode, setIsReorderMode] = useState(false);

    const [localNouveautes, setLocalNouveautes] = useState([]);
    const [localPetitsPrix, setLocalPetitsPrix] = useState([]);
    const [saveStatus, setSaveStatus] = useState('');

    const derivedLists = useMemo(() => buildInventoryLists(items, petitsPrixMax), [items, petitsPrixMax]);

    useEffect(() => {
        onEditRef.current = onEdit;
    }, [onEdit]);

    const handleEdit = useCallback((item) => {
        onEditRef.current?.(item);
    }, []);

    useEffect(() => {
        setLocalNouveautes(derivedLists.nouveautes);
        setLocalPetitsPrix(derivedLists.petitsPrix);
    }, [derivedLists]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback(async (event, listId) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const isNouveautes = listId === 'nouveautes';
        const dataset = isNouveautes ? localNouveautes : localPetitsPrix;
        const fieldName = isNouveautes ? 'nouveautesOrder' : 'petitsPrixOrder';

        const oldIndex = dataset.findIndex((item) => item.id === active.id);
        const newIndex = dataset.findIndex((item) => item.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const newDataset = arrayMove(dataset, oldIndex, newIndex);

        if (isNouveautes) setLocalNouveautes(newDataset);
        else setLocalPetitsPrix(newDataset);

        try {
            setSaveStatus('saving');
            const batch = writeBatch(db);
            newDataset.forEach((item, index) => {
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'furniture', item.id);
                batch.update(docRef, { [fieldName]: index });
            });
            await batch.commit();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (err) {
            console.error("Erreur lors de la sauvegarde de l'ordre :", err);
            setSaveStatus('');
        }
    }, [localNouveautes, localPetitsPrix]);

    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-stone-400" size={28} />
                <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    Chargement de l'inventaire...
                </p>
            </div>
        );
    }

    const zoomConfig = ZOOM_LEVELS[zoomLevel];

    return (
        <div className="animate-in slide-in-from-top-2">
            <div className={`p-4 md:p-5 rounded-[2rem] mb-6 md:mb-8 ring-1 flex justify-between items-center flex-wrap gap-4 ${darkMode ? 'bg-stone-800/40 ring-stone-700/50' : 'bg-stone-50 ring-stone-200/60 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-stone-700 text-stone-300' : 'bg-white shadow-sm text-stone-600 ring-1 ring-stone-100'}`}>
                        <SlidersHorizontal size={16} />
                    </div>
                    <div className="flex flex-col">
                        <label className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                            Plafond "Petits Prix"
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="number"
                                value={petitsPrixMax}
                                onChange={(e) => setPetitsPrixMax(Number(e.target.value) || 0)}
                                className={`w-20 px-2.5 py-1 text-sm font-bold rounded-lg outline-none border transition-colors ${darkMode ? 'bg-stone-900 border-stone-700 text-white focus:border-stone-500' : 'bg-white border-stone-200 text-stone-900 focus:border-stone-400 shadow-sm'}`}
                            />
                            <span className={`text-sm font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>€</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900/5 dark:bg-black/20 backdrop-blur-sm self-stretch md:self-auto">
                    <button
                        onClick={() => setIsReorderMode((value) => !value)}
                        className={`px-3 py-2 md:py-1.5 rounded-[12px] flex items-center justify-center gap-2 transition-all duration-300 flex-1 md:flex-initial ${isReorderMode ? (darkMode ? 'bg-amber-400 text-stone-950 shadow-md' : 'bg-stone-900 text-white shadow-md') : (darkMode ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50')}`}
                        title={isReorderMode ? 'Quitter la réorganisation' : 'Réorganiser'}
                    >
                        <GripVertical size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">{isReorderMode ? 'Ordre actif' : 'Réorganiser'}</span>
                    </button>
                    {Object.entries(ZOOM_LEVELS).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setZoomLevel(key)}
                            title={config.title}
                            className={`px-3 py-2 md:py-1.5 rounded-[12px] flex items-center justify-center gap-2 transition-all duration-300 flex-1 md:flex-initial ${zoomLevel === key ? (darkMode ? 'bg-stone-700 text-white shadow-md ring-1 ring-stone-600' : 'bg-white text-stone-900 shadow-md ring-1 ring-stone-200/50') : (darkMode ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50')}`}
                        >
                            {config.icon}
                            <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">{config.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6 md:space-y-8">
                <InventoryGrid
                    listId="nouveautes"
                    title="Nouveautés (Manuelles)"
                    badgeColor={darkMode ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}
                    dataset={localNouveautes}
                    zoomConfig={zoomConfig}
                    darkMode={darkMode}
                    onEdit={handleEdit}
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                    saveStatus={saveStatus}
                    isReorderMode={isReorderMode}
                />

                <InventoryGrid
                    listId="petitsPrix"
                    title={`Petits Prix (≤ ${petitsPrixMax}€)`}
                    badgeColor={darkMode ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-100'}
                    dataset={localPetitsPrix}
                    zoomConfig={zoomConfig}
                    darkMode={darkMode}
                    onEdit={handleEdit}
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                    saveStatus={saveStatus}
                    isReorderMode={isReorderMode}
                />
            </div>
        </div>
    );
};

export default GlobalInventoryView;
