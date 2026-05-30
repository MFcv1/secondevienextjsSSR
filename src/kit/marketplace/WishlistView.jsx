import React from 'react';
import { X, Upload, ShoppingCart, Trash2, ShoppingBag, Heart } from 'lucide-react';
import { PRODUCT_CARD_IMAGE_SIZES, getProductCardImage } from '../../utils/imageUtils';
import { getProductUrl } from '../../utils/slug';

const WishlistView = ({
    wishlistItems = [],
    items = [],
    onAddToCart,
    onToggleWishlist,
    onClearWishlist,
    onOpenAbout,
    onBack,
    darkMode,
    user,
    onShowLogin
}) => {
    const enrichedItems = React.useMemo(() => wishlistItems.map(w => {
        const live = items.find(i => i.id === w.originalId);
        return live || { id: w.originalId, ...w, images: [w.image] };
    }), [items, wishlistItems]);

    const isLoggedIn = user && !user.isAnonymous;

    const handleAddAll = async () => {
        for (const item of enrichedItems) {
            if (!item.sold) await onAddToCart(item);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: 'Ma Wishlist', url });
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}>

            {/* SUB-NAVIGATION — même que MarketplaceLayout */}
            <nav className={`w-full py-4 hidden md:block ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
                <ul className={`flex items-center justify-center gap-6 lg:gap-8 text-[13px] font-sans tracking-wide ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                    <li onClick={onBack} className={`cursor-pointer transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>Nouveautés</li>
                    <li onClick={onBack} className={`cursor-pointer transition-colors flex items-center gap-1 ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>Meubles <span className="text-[8px]">▼</span></li>
                    <li onClick={onBack} className={`cursor-pointer transition-colors flex items-center gap-1 ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>Assises <span className="text-[8px]">▼</span></li>
                    <li onClick={onBack} className={`cursor-pointer transition-colors flex items-center gap-1 ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>Éclairage <span className="text-[8px]">▼</span></li>
                    <li onClick={onBack} className={`cursor-pointer transition-colors flex items-center gap-1 ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>Décorations <span className="text-[8px]">▼</span></li>
                    <li onClick={onBack} className="cursor-pointer transition-colors text-[#d9534f] hover:text-red-700 font-medium">Prix bas ⚡</li>
                    <li onClick={() => (onOpenAbout ? onOpenAbout() : onBack())} className={`cursor-pointer transition-colors flex items-center gap-1 ${darkMode ? 'hover:text-white' : 'hover:text-black'}`}>À propos <span className="text-[8px]">▼</span></li>
                </ul>
            </nav>

            {/* WISHLIST HEADER — centré comme Debongout */}
            <div className={`py-10 md:py-14 text-center border-b ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                <h1 className="font-serif text-4xl md:text-5xl mb-4">Wishlist</h1>

                {/* Message connexion (si non connecté) */}
                {!isLoggedIn && (
                    <p className={`text-sm mb-6 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        Pour sauvegarder votre wishlist{' '}
                        <button
                            onClick={onShowLogin}
                            className={`underline underline-offset-2 transition-colors ${darkMode ? 'text-stone-200 hover:text-white' : 'text-stone-800 hover:text-black'}`}
                        >
                            connectez-vous
                        </button>
                        {' '}ou{' '}
                        <button
                            onClick={onShowLogin}
                            className={`underline underline-offset-2 transition-colors ${darkMode ? 'text-stone-200 hover:text-white' : 'text-stone-800 hover:text-black'}`}
                        >
                            inscrivez-vous
                        </button>
                        .
                    </p>
                )}

                {/* Boutons d'action */}
                <div className={`flex flex-wrap items-center justify-center gap-1 md:gap-0 divide-x ${darkMode ? 'divide-white/10' : 'divide-stone-200'}`}>
                    <button
                        onClick={handleShare}
                        className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'}`}
                    >
                        <Upload size={15} strokeWidth={1.5} />
                        Partager ma wishlist
                    </button>
                    <button
                        onClick={enrichedItems.filter(i => !i.sold).length > 0 ? handleAddAll : undefined}
                        className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${enrichedItems.filter(i => !i.sold).length === 0 ? 'opacity-30 pointer-events-none' : (darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900')}`}
                    >
                        <ShoppingCart size={15} strokeWidth={1.5} />
                        Tout ajouter au panier
                    </button>
                    <button
                        onClick={wishlistItems.length > 0 ? onClearWishlist : undefined}
                        className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${wishlistItems.length === 0 ? 'opacity-30 pointer-events-none' : (darkMode ? 'text-stone-400 hover:text-red-400' : 'text-stone-500 hover:text-red-500')}`}
                    >
                        <X size={15} strokeWidth={1.5} />
                        Vider ma wishlist
                    </button>
                </div>
            </div>

            {/* CONTENU */}
            <div className="px-4 md:px-12 lg:px-16 py-12">
                {enrichedItems.length === 0 ? (
                    /* ÉTAT VIDE */
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${darkMode ? 'bg-stone-900' : 'bg-stone-100'}`}>
                            <Heart size={32} strokeWidth={1} className={darkMode ? 'text-stone-600' : 'text-stone-300'} />
                        </div>
                        <div>
                            <p className={`font-serif text-2xl mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Votre wishlist est vide</p>
                            <p className={`text-xs uppercase tracking-widest font-bold ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                                Ajoutez des pièces qui vous font envie
                            </p>
                        </div>
                        <button
                            onClick={onBack}
                            className={`mt-4 px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded transition-all ${darkMode ? 'bg-white text-stone-900 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                        >
                            Explorer la boutique
                        </button>
                    </div>
                ) : (
                    /* GRILLE PRODUITS — style Debongout */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {enrichedItems.map((item, index) => {
                            const price = item.currentPrice || item.startingPrice || item.price;
                            const priority = index < 6;
                            const cardImage = getProductCardImage(item);
                            return (
                                <div key={item.id} className="group relative flex flex-col">
                                    {/* IMAGE + X */}
                                    <div className="relative">
                                        {/* Bouton X retirer */}
                                        <button
                                            onClick={() => onToggleWishlist(item)}
                                            className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all shadow ${darkMode ? 'bg-[#1a1a1a] text-stone-300 hover:bg-red-900/40 hover:text-red-400 border border-white/10' : 'bg-white text-stone-500 hover:bg-red-50 hover:text-red-500 border border-stone-200'}`}
                                            title="Retirer des favoris"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>

                                        {/* Image */}
                                        <a
                                            href={getProductUrl(item)}
                                            className={`relative block overflow-hidden aspect-[3/4] cursor-pointer ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}
                                        >
                                            <img
                                                src={cardImage.src}
                                                srcSet={cardImage.srcSet || undefined}
                                                sizes={PRODUCT_CARD_IMAGE_SIZES}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                loading={priority ? 'eager' : 'lazy'}
                                                decoding={priority ? 'sync' : 'async'}
                                                fetchPriority={priority ? 'high' : 'auto'}
                                            />
                                            {item.sold && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="text-white text-xs font-black uppercase tracking-widest">Vendu</span>
                                                </div>
                                            )}
                                        </a>
                                    </div>

                                    {/* INFO */}
                                    <div className="pt-3 flex flex-col gap-1 text-center">
                                        <a
                                            href={getProductUrl(item)}
                                            className="font-serif text-sm md:text-base leading-tight cursor-pointer hover:opacity-70 transition-opacity text-inherit no-underline"
                                        >
                                            {item.name}
                                        </a>
                                        <p className={`text-sm font-bold ${item.sold ? 'text-red-500' : ''}`}>
                                            {item.sold ? 'VENDU' : (price ? `${price} €` : '—')}
                                        </p>
                                    </div>

                                    {/* BOUTON PANIER */}
                                    <button
                                        onClick={() => !item.sold && onAddToCart(item)}
                                        disabled={item.sold}
                                        className={`mt-3 w-full py-3 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'bg-stone-800 text-stone-100 hover:bg-stone-700' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                                    >
                                        {item.sold ? 'Indisponible' : 'Ajouter au panier'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistView;
