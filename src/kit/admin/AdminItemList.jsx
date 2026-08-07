import { useState, useEffect, useRef } from 'react';
import {
    collection,
    getCountFromServer,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Pencil, Eye, EyeOff, Trash2, Search, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import KIT_CONFIG from '../config/constants';

// Helper pour nettoyer le texte (accents, casse)
const normalizeText = (text) => {
    return (text || '')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Enlève les accents
}

const PAGE_SIZE = 50;
const SEARCH_LIMIT = 200;

const getTimestampMillis = (value) => {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    const parsed = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : 0;
};

const sortNewestFirst = (left, right) => (
    getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt)
    || String(left.id).localeCompare(String(right.id))
);

const getProductAdminState = (item) => {
    if (item?.status !== 'published') return 'draft';
    return item?.sold === true ? 'sold' : 'published';
};

const AdminItemList = ({ collectionName, darkMode, highlightProductId, onEdit, onToggleStatus, onDelete, onMarkAsSold, onMarkAsAvailable }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLimit, setStatsLimit] = useState(PAGE_SIZE);
    const [fullCache, setFullCache] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);
    const [catalogStats, setCatalogStats] = useState(null);
    const [statsRefreshKey, setStatsRefreshKey] = useState(0);
    const highlightedRowRef = useRef(null);
    const highlightScrolledRef = useRef(false);

    useEffect(() => {
        highlightScrolledRef.current = false;
    }, [highlightProductId]);

    useEffect(() => {
        if (!highlightProductId || highlightScrolledRef.current || !highlightedRowRef.current) return;
        highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightScrolledRef.current = true;
    }, [highlightProductId, items]);


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
        setStatsLimit(PAGE_SIZE);
        setItems([]);
        setLoading(true);
        setFilterCategory(null);
        setFilterStatus(null);
        setCatalogStats(null);
    }, [collectionName]);

    useEffect(() => {
        let cancelled = false;
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);

        Promise.all([
            getCountFromServer(colRef),
            getCountFromServer(query(colRef, where('status', '==', 'published'), where('sold', '==', false))),
            getCountFromServer(query(colRef, where('status', '==', 'draft'))),
            getCountFromServer(query(colRef, where('status', '==', 'published'), where('sold', '==', true))),
        ]).then(([totalSnapshot, publishedSnapshot, draftSnapshot, soldSnapshot]) => {
            if (cancelled) return;
            setCatalogStats({
                total: totalSnapshot.data().count,
                published: publishedSnapshot.data().count,
                drafts: draftSnapshot.data().count,
                sold: soldSnapshot.data().count,
            });
        }).catch((error) => {
            console.error('Stats fetch error:', error);
            if (!cancelled) setCatalogStats(null);
        });

        return () => { cancelled = true; };
    }, [collectionName, statsRefreshKey]);

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
                        const q = query(colRef, orderBy('createdAt', 'desc'), limit(SEARCH_LIMIT));
                        const snap = await getDocs(q);
                        searchPool = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        setFullCache(searchPool);
                    } catch (e) { console.error(e); setLoading(false); return; }
                }

                const searchTerms = normalizeText(debouncedSearch).split(' ').filter(Boolean);
                const filtered = searchPool.filter(item => {
                    if (filterCategory && normalizeText(item.category) !== filterCategory) return false;
                    const adminState = getProductAdminState(item);
                    if (filterStatus && adminState !== filterStatus) return false;
                    const statusLabel = adminState === 'sold' ? 'vendu' : adminState === 'published' ? 'public publie' : 'brouillon';
                    const haystack = normalizeText(`${item.name} ${item.material} ${item.category} ${statusLabel}`);
                    return searchTerms.every(term => haystack.includes(term));
                });

                setItems(filtered);
                setLoading(false);

            } else {
                const filters = [];
                if (filterCategory) filters.push(where('category', '==', filterCategory));
                if (filterStatus === 'published') {
                    filters.push(where('status', '==', 'published'), where('sold', '==', false));
                } else if (filterStatus === 'draft') {
                    filters.push(where('status', '==', 'draft'));
                } else if (filterStatus === 'sold') {
                    filters.push(where('status', '==', 'published'), where('sold', '==', true));
                }
                const q = filters.length > 0
                    ? query(colRef, ...filters, limit(statsLimit))
                    : query(colRef, orderBy('createdAt', 'desc'), limit(statsLimit));

                unsubscribe = onSnapshot(q, (snap) => {
                    const loadedItems = snap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .sort(sortNewestFirst);
                    setItems(loadedItems);
                    setStatsRefreshKey((current) => current + 1);
                    setLoading(false);
                }, (err) => {
                    console.error("Fetch error:", err);
                    setLoading(false);
                });
            }
        };

        runLogic();

        return () => unsubscribe();
    }, [collectionName, statsLimit, debouncedSearch, filterCategory, filterStatus, fullCache]);



    const displayedItems = items;

    // ── Category label helper ──
    const getCategoryLabel = (catId) => {
        const found = KIT_CONFIG.productCategories.find(c => c.id === catId);
        return found ? found.label : catId;
    };

    const loadedSummary = {
        total: items.length,
        published: items.filter(item => getProductAdminState(item) === 'published').length,
        drafts: items.filter(item => getProductAdminState(item) === 'draft').length,
        sold: items.filter(item => getProductAdminState(item) === 'sold').length,
    };
    const summary = catalogStats || loadedSummary;

    const selectCategory = (categoryId) => {
        setFilterCategory((current) => current === categoryId ? null : categoryId);
        setStatsLimit(PAGE_SIZE);
        setFullCache(null);
    };

    const selectStatus = (statusId) => {
        setFilterStatus((current) => current === statusId ? null : statusId);
        setStatsLimit(PAGE_SIZE);
        setFullCache(null);
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
                            <button type="button" onClick={() => { setFilterCategory(null); setStatsLimit(PAGE_SIZE); setFullCache(null); }} className={`shrink-0 rounded-full px-3.5 py-2.5 text-[8px] font-extrabold uppercase tracking-[0.09em] ring-1 transition-colors duration-200 ${!filterCategory ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : (darkMode ? 'text-stone-500 ring-white/10' : 'text-stone-500 ring-black/[0.07]')}`}>Tout</button>
                            {KIT_CONFIG.productCategories.map(category => {
                                const active = filterCategory === category.id;
                                return <button type="button" key={category.id} onClick={() => selectCategory(category.id)} className={`shrink-0 rounded-full px-3.5 py-2.5 text-[8px] font-extrabold uppercase tracking-[0.09em] ring-1 transition-colors duration-200 ${active ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : (darkMode ? 'text-stone-500 ring-white/10 hover:text-white' : 'text-stone-500 ring-black/[0.07] hover:bg-stone-50 hover:text-stone-950')}`}>{category.label}</button>;
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
                                <div><p className="text-[13px] font-bold">Aucune publication trouvée</p>{(debouncedSearch || filterCategory || filterStatus) && <button type="button" onClick={() => { setSearchTerm(''); setFilterCategory(null); setFilterStatus(null); }} className="mt-2 text-[10px] font-bold text-emerald-600">Réinitialiser</button>}</div>
                            </div>
                        ) : (
                            <div className={`divide-y ${darkMode ? 'divide-white/[0.07]' : 'divide-black/[0.055]'}`}>
                                {displayedItems.map(item => {
                                    const adminState = getProductAdminState(item);
                                    const status = adminState === 'sold' ? 'Vendu' : adminState === 'published' ? 'Public' : 'Brouillon';
                                    const imageSource = item.images?.[0] || item.imageUrl || '';
                                    return (
                                        <article
                                            key={item.id}
                                            ref={item.id === highlightProductId ? highlightedRowRef : null}
                                            className={`group grid gap-3 rounded-[14px] px-2 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:grid-cols-[minmax(240px,2.2fr)_1.2fr_.7fr_.55fr_1fr_132px] lg:items-center ${item.id === highlightProductId ? (darkMode ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25' : 'bg-emerald-50 ring-1 ring-emerald-500/20') : darkMode ? 'hover:bg-white/[0.025]' : 'hover:bg-[#FAF9F6]'}`}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-[12px] ring-1 ${darkMode ? 'ring-white/10' : 'ring-black/[0.06]'}`}>
                                                    {imageSource ? (
                                                        <img src={imageSource} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" alt="" />
                                                    ) : (
                                                        <span className={`grid h-full w-full place-items-center px-1 text-center text-[7px] font-bold leading-3 ${darkMode ? 'bg-white/[0.04] text-stone-500' : 'bg-stone-100 text-stone-400'}`}>Photos en attente</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <p className="truncate text-[12px] font-extrabold tracking-[-0.015em]">{item.name || 'Sans titre'}</p>
                                                        {item.id === highlightProductId && <span className="shrink-0 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">Nouveau</span>}
                                                    </div>
                                                    <p className={`mt-0.5 truncate text-[8px] font-medium ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>ID · {item.id}</p>
                                                </div>
                                            </div>
                                            <p className={`truncate text-[10px] font-semibold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{getCategoryLabel(item.category)}</p>
                                            <span className={`w-max rounded-full px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] ${adminState === 'sold' ? 'bg-red-500/10 text-red-500' : adminState === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{status}</span>
                                            <p className="text-[10px] font-bold tabular-nums">{adminState === 'sold' ? '—' : Number(item.stock || 0)}</p>
                                            <p className={`text-[9px] font-medium ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{formatDate(item.updatedAt || item.createdAt)}</p>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button type="button" onClick={() => onToggleStatus(item)} disabled={adminState === 'draft' && !imageSource} className={`${actionClass} disabled:cursor-not-allowed disabled:opacity-35`} title={adminState === 'draft' && !imageSource ? 'Ajoutez les photos avant de publier' : item.status === 'published' ? 'Masquer' : 'Publier'}>{item.status === 'published' ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}</button>
                                                <button type="button" onClick={() => onEdit(item)} className={actionClass} title="Modifier"><Pencil size={14} strokeWidth={1.5} /></button>
                                                {adminState !== 'draft' && <button type="button" onClick={() => adminState === 'sold' ? onMarkAsAvailable(item) : onMarkAsSold(item)} className={actionClass} title={adminState === 'sold' ? 'Remettre en vente' : 'Marquer comme vendu'}>{adminState === 'sold' ? <RotateCcw size={14} strokeWidth={1.5} /> : <CheckCircle size={14} strokeWidth={1.5} />}</button>}
                                                <button type="button" onClick={() => onDelete(item)} className={`${actionClass} text-red-500 hover:!bg-red-500 hover:!text-white`} title="Supprimer définitivement"><Trash2 size={14} strokeWidth={1.5} /></button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {!debouncedSearch && items.length >= statsLimit && (
                        <button type="button" onClick={() => setStatsLimit(previous => previous + PAGE_SIZE)} className={`mt-2 shrink-0 rounded-full py-2 text-[9px] font-extrabold ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${darkMode ? 'text-stone-400 ring-white/10 hover:bg-white/5' : 'text-stone-500 ring-black/[0.06] hover:bg-stone-50'}`}>
                            {loading ? 'Chargement…' : `Afficher ${PAGE_SIZE} publications supplémentaires`}
                        </button>
                    )}
                </div>
            </div>

            <aside className={`min-h-0 rounded-[26px] border p-5 sm:p-6 ${darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'}`}>
                <div className="flex h-full min-h-[360px] flex-col">
                    <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Catalogue</p>
                    <p className="mt-2 text-[30px] font-extrabold tracking-[-0.055em]">{summary.total}</p>
                    <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>publications enregistrées au total</p>
                    <div className={`mt-4 divide-y rounded-[16px] px-3 ring-1 ${darkMode ? 'divide-white/10 bg-black/20 ring-white/10' : 'divide-black/[0.055] bg-[#F7F6F3] ring-black/[0.045]'}`}>
                        {[
                            ['published', 'Publiées', summary.published, 'bg-emerald-500'],
                            ['draft', 'Brouillons', summary.drafts, 'bg-amber-500'],
                            ['sold', 'Vendues', summary.sold, 'bg-red-400'],
                        ].map(([statusId, label, value, color]) => {
                            const active = filterStatus === statusId;
                            return (
                                <button
                                    key={statusId}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => selectStatus(statusId)}
                                    className={`flex w-full items-center justify-between rounded-[10px] px-1 py-3 text-left transition-colors ${active ? (darkMode ? 'bg-white/[0.08]' : 'bg-white') : (darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/70')}`}
                                >
                                    <span className={`flex items-center gap-2 text-[10px] font-semibold ${active ? (darkMode ? 'text-white' : 'text-stone-950') : 'text-stone-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span>
                                    <strong className="text-[13px] tabular-nums">{value}</strong>
                                </button>
                            );
                        })}
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
