import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Pencil, Eye, EyeOff, Trash2, Search, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
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

    const summary = {
        total: items.length,
        published: items.filter(item => item.status === 'published' && !item.sold).length,
        drafts: items.filter(item => item.status !== 'published' && !item.sold).length,
        sold: items.filter(item => item.sold).length,
    };

    const formatDate = (value) => {
        const date = value?.toDate?.() || (value ? new Date(value) : null);
        if (!date || Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    };

    const actionClass = `grid h-8 w-8 place-items-center rounded-full ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 ${darkMode ? 'bg-white/[0.04] text-stone-300 ring-white/10 hover:bg-white hover:text-stone-950' : 'bg-white text-stone-600 ring-black/[0.06] hover:bg-stone-950 hover:text-white'}`;

    return (
        <div className="grid min-h-0 grid-cols-1 gap-5 xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(250px,20%)] 2xl:gap-6">
            <div className={`min-h-0 overflow-hidden rounded-[26px] border ${darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'}`}>
                <div className="flex h-full min-h-[520px] flex-col p-5 sm:p-6 xl:min-h-0 xl:p-6 2xl:p-7">
                    <div className="flex shrink-0 flex-col gap-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <label className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} strokeWidth={1.5} />
                                <input
                                    type="search"
                                    placeholder="Rechercher une publication"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className={`w-full rounded-[14px] border-none py-3 pl-10 pr-4 text-[12px] font-semibold outline-none ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:ring-2 ${darkMode ? 'bg-black/20 text-white ring-white/10 placeholder:text-stone-700 focus:ring-white/25' : 'bg-[#F7F6F3] text-stone-950 ring-black/[0.045] placeholder:text-stone-400 focus:bg-white focus:ring-stone-300'}`}
                                />
                            </label>
                            <div className={`rounded-full px-3 py-2 text-[9px] font-bold ${darkMode ? 'bg-white/[0.04] text-stone-500' : 'bg-stone-100 text-stone-500'}`}>
                                {displayedItems.length} affichée{displayedItems.length > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 no-scrollbar 2xl:flex-wrap 2xl:overflow-visible">
                            <button type="button" onClick={() => setFilterCategory(null)} className={`shrink-0 rounded-full px-3.5 py-2.5 text-[8px] font-extrabold uppercase tracking-[0.09em] ring-1 transition-colors duration-200 ${!filterCategory ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : (darkMode ? 'text-stone-500 ring-white/10' : 'text-stone-500 ring-black/[0.07]')}`}>Tout</button>
                            {KIT_CONFIG.productCategories.map(category => {
                                const active = filterCategory === category.id;
                                return <button type="button" key={category.id} onClick={() => setFilterCategory(active ? null : category.id)} className={`shrink-0 rounded-full px-3.5 py-2.5 text-[8px] font-extrabold uppercase tracking-[0.09em] ring-1 transition-colors duration-200 ${active ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : (darkMode ? 'text-stone-500 ring-white/10 hover:text-white' : 'text-stone-500 ring-black/[0.07] hover:bg-stone-50 hover:text-stone-950')}`}>{category.label}</button>;
                            })}
                        </div>
                    </div>

                    <div className={`mt-2 hidden shrink-0 grid-cols-[minmax(240px,2.2fr)_1.2fr_.7fr_.55fr_1fr_132px] gap-3 px-3 py-2 text-[8px] font-extrabold uppercase tracking-[0.12em] lg:grid ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                        <span>Publication</span><span>Catégorie</span><span>Statut</span><span>Stock</span><span>Modification</span><span className="text-right">Actions</span>
                    </div>

                    <div data-native-scroll-region="true" onWheel={(event) => event.stopPropagation()} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
                        {loading && displayedItems.length === 0 ? (
                            <div className="grid h-full min-h-48 place-items-center"><Loader2 className="animate-spin text-stone-400" size={24} strokeWidth={1.5} /></div>
                        ) : displayedItems.length === 0 ? (
                            <div className={`grid h-full min-h-48 place-items-center rounded-[16px] text-center ring-1 ${darkMode ? 'text-stone-600 ring-white/10' : 'text-stone-400 ring-black/[0.05]'}`}>
                                <div><p className="text-[13px] font-bold">Aucune publication trouvée</p>{(debouncedSearch || filterCategory) && <button type="button" onClick={() => { setSearchTerm(''); setFilterCategory(null); }} className="mt-2 text-[10px] font-bold text-emerald-600">Réinitialiser</button>}</div>
                            </div>
                        ) : (
                            <div className={`divide-y ${darkMode ? 'divide-white/[0.07]' : 'divide-black/[0.055]'}`}>
                                {displayedItems.map(item => {
                                    const status = item.sold ? 'Vendu' : (item.status === 'published' ? 'Public' : 'Brouillon');
                                    return (
                                        <article key={item.id} className={`group grid gap-3 px-2 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:grid-cols-[minmax(240px,2.2fr)_1.2fr_.7fr_.55fr_1fr_132px] lg:items-center ${darkMode ? 'hover:bg-white/[0.025]' : 'hover:bg-[#FAF9F6]'}`}>
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-[12px] ring-1 ${darkMode ? 'ring-white/10' : 'ring-black/[0.06]'}`}>
                                                    <img src={item.images?.[0] || item.imageUrl} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" alt="" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[12px] font-extrabold tracking-[-0.015em]">{item.name || 'Sans titre'}</p>
                                                    <p className={`mt-0.5 truncate text-[8px] font-medium ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>ID · {item.id}</p>
                                                </div>
                                            </div>
                                            <p className={`truncate text-[10px] font-semibold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{getCategoryLabel(item.category)}</p>
                                            <span className={`w-max rounded-full px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] ${item.sold ? 'bg-red-500/10 text-red-500' : item.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{status}</span>
                                            <p className="text-[10px] font-bold tabular-nums">{item.sold ? '—' : Number(item.stock || 0)}</p>
                                            <p className={`text-[9px] font-medium ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{formatDate(item.updatedAt || item.createdAt)}</p>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button type="button" onClick={() => onToggleStatus(item)} className={actionClass} title={item.status === 'published' ? 'Masquer' : 'Publier'}>{item.status === 'published' ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}</button>
                                                <button type="button" onClick={() => onEdit(item)} className={actionClass} title="Modifier"><Pencil size={14} strokeWidth={1.5} /></button>
                                                <button type="button" onClick={() => item.sold ? onMarkAsAvailable(item) : onMarkAsSold(item)} className={actionClass} title={item.sold ? 'Remettre en vente' : 'Marquer comme vendu'}>{item.sold ? <RotateCcw size={14} strokeWidth={1.5} /> : <CheckCircle size={14} strokeWidth={1.5} />}</button>
                                                <button type="button" onClick={() => onDelete(item)} className={`${actionClass} text-red-500 hover:!bg-red-500 hover:!text-white`} title="Supprimer définitivement"><Trash2 size={14} strokeWidth={1.5} /></button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {!debouncedSearch && items.length >= statsLimit && (
                        <button type="button" onClick={() => setStatsLimit(previous => previous + 50)} className={`mt-2 shrink-0 rounded-full py-2 text-[9px] font-extrabold ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${darkMode ? 'text-stone-400 ring-white/10 hover:bg-white/5' : 'text-stone-500 ring-black/[0.06] hover:bg-stone-50'}`}>
                            {loading ? 'Chargement…' : 'Afficher 50 publications supplémentaires'}
                        </button>
                    )}
                </div>
            </div>

            <aside className={`min-h-0 rounded-[26px] border p-5 sm:p-6 ${darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'}`}>
                <div className="flex h-full min-h-[360px] flex-col">
                    <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Vue chargée</p>
                    <p className="mt-2 text-[30px] font-extrabold tracking-[-0.055em]">{summary.total}</p>
                    <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>publications actuellement disponibles</p>
                    <div className={`mt-4 divide-y rounded-[16px] px-3 ring-1 ${darkMode ? 'divide-white/10 bg-black/20 ring-white/10' : 'divide-black/[0.055] bg-[#F7F6F3] ring-black/[0.045]'}`}>
                        {[
                            ['Publiées', summary.published, 'bg-emerald-500'],
                            ['Brouillons', summary.drafts, 'bg-amber-500'],
                            ['Vendues', summary.sold, 'bg-red-400'],
                        ].map(([label, value, color]) => <div key={label} className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-[10px] font-semibold text-stone-500"><span className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span><strong className="text-[13px] tabular-nums">{value}</strong></div>)}
                    </div>
                    <div className="mt-auto pt-4">
                        <p className={`text-[9px] leading-4 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>La liste se met à jour en direct. Utilisez l’œil pour masquer, le crayon pour modifier et la poubelle pour supprimer définitivement.</p>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default AdminItemList;
