import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Pencil, Eye, EyeOff, Trash2, Search, Loader2, CheckCircle, RotateCcw, LayoutGrid, List } from 'lucide-react';
import KIT_CONFIG from '../config/constants';

// Helper pour nettoyer le texte (accents, casse)
const normalizeText = (text) => {
    return (text || '')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Enlève les accents
}

const AdminItemList = ({ collectionName, darkMode, onEdit, onToggleStatus, onDelete, onMarkAsSold, onMarkAsAvailable }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLimit, setStatsLimit] = useState(10);
    const [fullCache, setFullCache] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);


    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset du cache et de la limite si on change d'onglet
    useEffect(() => {
        setFullCache(null);
        setStatsLimit(10); // Reset to 10
        setItems([]);
        setLoading(true);
        setFilterCategory(null);
    }, [collectionName]);

    // Logique Principale : Fetch & Filter
    useEffect(() => {
        setLoading(true);
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
        let unsubscribe = () => { };

        const runLogic = async () => {
            if (debouncedSearch) {
                let searchPool = fullCache;
                if (!searchPool) {
                    try {
                        const q = query(colRef, orderBy('createdAt', 'desc'));
                        const snap = await getDocs(q);
                        searchPool = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        setFullCache(searchPool);
                    } catch (e) { console.error(e); setLoading(false); return; }
                }

                const searchTerms = normalizeText(debouncedSearch).split(' ').filter(Boolean);
                const filtered = searchPool.filter(item => {
                    const haystack = normalizeText(`${item.name} ${item.material} ${item.category} ${item.status === 'published' ? 'public' : 'brouillon'}`);
                    return searchTerms.every(term => haystack.includes(term));
                });

                setItems(filtered);
                setLoading(false);

            } else {
                const q = query(colRef, orderBy('createdAt', 'desc'), limit(statsLimit));

                unsubscribe = onSnapshot(q, (snap) => {
                    const loadedItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setItems(loadedItems);
                    setLoading(false);
                }, (err) => {
                    console.error("Fetch error:", err);
                    setLoading(false);
                });
            }
        };

        runLogic();

        return () => unsubscribe();
    }, [collectionName, statsLimit, debouncedSearch]);



    // ── Client-side filter by category ──
    const displayedItems = useMemo(() => {
        if (!filterCategory) return items;
        return items.filter(item => (item.category || '').toLowerCase() === filterCategory);
    }, [items, filterCategory]);

    // ── Category label helper ──
    const getCategoryLabel = (catId) => {
        const found = KIT_CONFIG.productCategories.find(c => c.id === catId);
        return found ? found.label : catId;
    };

    return (
        <div className="space-y-6">
            {/* ── CATEGORY FILTER PILLS ── */}
            <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-2 flex-1 transition-opacity duration-300">
                    <button
                        onClick={() => setFilterCategory(null)}
                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300
                            ${!filterCategory
                                ? (darkMode ? 'bg-white text-stone-900 border-white' : 'bg-stone-900 text-white border-stone-900')
                                : (darkMode ? 'border-stone-700 text-stone-500 hover:border-stone-500' : 'border-stone-200 text-stone-400 hover:border-stone-400')
                            }`}
                    >
                        Tout
                    </button>
                    {KIT_CONFIG.productCategories.map(cat => {
                        const isActive = filterCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(isActive ? null : cat.id)}
                                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300
                                    ${isActive
                                        ? (darkMode ? 'bg-white text-stone-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-stone-900 text-white border-stone-900 shadow-lg')
                                        : (darkMode ? 'border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300' : 'border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600')
                                    }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className={`relative flex-1 w-full ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-6 py-4 rounded-xl font-bold text-sm outline-none border transition-all ${darkMode
                            ? 'bg-stone-800 border-stone-700 focus:border-stone-500 focus:ring-1 focus:ring-stone-500 placeholder:text-stone-600'
                            : 'bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 placeholder:text-stone-300'
                            }`}
                    />
                </div>
            </div>

            {/* List with Scrollable Container (Style AdminOrders) */}
            <div 
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                className={`grid gap-4 pr-2 overflow-y-auto scrollbar-thin ${darkMode ? 'scrollbar-thumb-stone-700 scrollbar-track-stone-900/20' : 'scrollbar-thumb-stone-200 scrollbar-track-stone-50'} max-h-[750px] custom-scrollbar`}
            >
                {loading && displayedItems.length === 0 ? (
                    <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-stone-400" size={32} /></div>
                ) : displayedItems.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border border-dashed ${darkMode ? 'border-stone-700 text-stone-500' : 'border-stone-200 text-stone-400'}`}>
                        <p className="font-bold">Aucun élément trouvé.</p>
                        {(debouncedSearch || filterCategory) && (
                            <button onClick={() => { setSearchTerm(''); setFilterCategory(null); }} className="mt-2 text-sm text-amber-500 hover:underline">
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {displayedItems.map(item => (
                                <div key={item.id} className={`p-4 md:p-5 rounded-3xl md:rounded-[2.5rem] ring-1 shadow-sm hover:shadow-md transition-all relative overflow-hidden group will-change-transform ${darkMode ? 'bg-stone-800 ring-stone-700/50' : 'bg-[#FAF9F6] ring-stone-200'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-6">
                                        <div className="flex items-center md:items-center gap-4 md:gap-8">
                                            {/* Image & Status */}
                                            <div className="relative flex-shrink-0">
                                                <img src={item.images?.[0] || item.imageUrl} className={`w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-sm ring-1 ring-inset ${darkMode ? 'ring-stone-700' : 'ring-white'}`} alt="" />
                                            </div>

                                            <div className="space-y-1 md:space-y-2 min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                    <span className={`font-black text-base md:text-xl truncate ${darkMode ? 'text-white' : 'text-stone-900'}`}>{item.name}</span>
                                                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg ${item.status === 'published' ? (darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-stone-700 text-stone-500' : 'bg-stone-200 text-stone-500')}`}>
                                                        {item.status === 'published' ? 'Public' : 'Brouillon'}
                                                    </span>
                                                    {item.category && (
                                                        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${darkMode ? 'bg-stone-700/60 text-stone-400' : 'bg-stone-100 text-stone-500'}`}>
                                                            {getCategoryLabel(item.category)}
                                                        </span>
                                                    )}
                                                    {item.sold && (
                                                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg ${darkMode ? 'bg-red-950/40 text-red-500' : 'bg-red-50 text-red-600'}`}>
                                                            Vendu
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-end md:justify-start gap-2.5 md:gap-3 w-full md:w-auto mt-2 md:mt-0 border-t md:border-none pt-4 md:pt-0">
                                            {!item.sold ? (
                                                <button
                                                    onClick={() => onMarkAsSold(item)}
                                                    className={`px-4 py-2.5 md:px-6 md:py-3 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center gap-2 shadow-sm ring-1 ring-inset transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-grow md:flex-grow-0 ${darkMode ? 'bg-emerald-950/20 text-emerald-400 ring-emerald-900/30 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 ring-emerald-100 hover:bg-emerald-500 hover:text-white'}`}
                                                    title="Marquer comme VENDU"
                                                >
                                                    <CheckCircle size={14} className="md:w-4 md:h-4" />
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Marquer comme vendu</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onMarkAsAvailable(item)}
                                                    className={`px-4 py-2.5 md:px-6 md:py-3 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center gap-2 shadow-sm ring-1 ring-inset transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-grow md:flex-grow-0 ${darkMode ? 'bg-amber-950/20 text-amber-400 ring-amber-900/30 hover:bg-amber-500 hover:text-white' : 'bg-amber-50 text-amber-600 ring-amber-100 hover:bg-amber-500 hover:text-white'}`}
                                                    title="Remettre en vente"
                                                >
                                                    <RotateCcw size={14} className="md:w-4 md:h-4" />
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Remettre en vente</span>
                                                </button>
                                            )}

                                            <button onClick={() => onEdit(item)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm ring-1 ring-inset transition-all hover:scale-110 ${darkMode ? 'bg-stone-700 text-white ring-stone-600' : 'bg-white text-stone-900 ring-stone-100'}`} title="Modifier"><Pencil size={16} className="md:w-[18px]" /></button>

                                            <button onClick={() => onToggleStatus(item)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 ${item.status === 'published' ? (darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-emerald-500 text-white shadow-emerald-200') : (darkMode ? 'bg-stone-700 text-stone-500' : 'bg-stone-200 text-stone-400')}`} title={item.status === 'published' ? 'Masquer' : 'Publier'}>{item.status === 'published' ? <Eye size={16} className="md:w-[18px]" /> : <EyeOff size={16} className="md:w-[18px]" />}</button>

                                            <button onClick={() => onDelete(item.id)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm ring-1 ring-inset transition-all hover:scale-110 ${darkMode ? 'bg-red-950/40 text-red-800 ring-red-900/20 hover:bg-black hover:text-red-700' : 'bg-red-50 text-red-300 ring-red-50 hover:bg-red-100 hover:text-red-500'}`} title="SUPPRESSION DÉFINITIVE"><Trash2 size={16} className="md:w-[18px]" /></button>
                                        </div>
                                    </div>
                                </div>
                        ))}
                    </>
                )}
            </div>

            {/* Load More Button (ONLY if pagination mode and NOT searching) */}
            {!debouncedSearch && items.length >= statsLimit && (
                <button
                    onClick={() => setStatsLimit(prev => prev + 50)}
                    className={`w-full py-4 rounded-xl border border-dashed text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-white' : 'border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-900'}`}
                >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Charger plus d\'éléments (+50)...'}
                </button>
            )}

        </div>
    );
};

export default AdminItemList;
