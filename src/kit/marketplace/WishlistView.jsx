import React from 'react';
import Link from 'next/link';
import { X, Upload, ShoppingCart, Heart } from 'lucide-react';
import { PRODUCT_CARD_IMAGE_SIZES, getProductCardImage } from '../../utils/imageUtils';
import { getProductUrl } from '../../utils/slug';
import { getPurchaseUnavailableLabel, isPurchasable, shouldRequestQuote } from '../commerce/purchasability';
import { resolveWishlistCatalogItems } from './publicCatalogWishlist';
import PageBreadcrumb from './PageBreadcrumb';

const WishlistView = ({
    wishlistItems = [],
    items = [],
    onAddToCart,
    onToggleWishlist,
    onClearWishlist,
    onBack,
    darkMode,
    user,
    onShowLogin
}) => {
    const enrichedItems = React.useMemo(
        () => resolveWishlistCatalogItems(wishlistItems, items),
        [items, wishlistItems]
    );

    const isLoggedIn = user && !user.isAnonymous;

    const handleAddAll = async () => {
        for (const item of enrichedItems) {
            if (isPurchasable(item)) await onAddToCart(item);
        }
    };

    const purchasableItems = enrichedItems.filter(isPurchasable);

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: 'Ma liste de souhaits', url });
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-[#f5f5f5]' : 'bg-[#FAFAF9] text-stone-900'}`}>

            {/* Fil d'Ariane normalise */}
            <div className="pt-3.5 px-4 pb-1 md:px-8 md:pt-6 md:pb-2">
                <div className="mx-auto max-w-[1480px]">
                    <PageBreadcrumb
                        current="Liste de souhaits"
                        darkMode={darkMode}
                        onLinkClick={onBack}
                    />
                </div>
            </div>

            {/* Liste de souhaits header */}
            <div className={`px-4 pb-10 pt-4 md:pb-14 md:pt-6 text-center border-b ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                <div className="mx-auto max-w-[1480px]">
                    <h1 className="font-serif text-4xl md:text-5xl mb-4">Liste de souhaits</h1>

                {/* Message connexion (si non connecté) */}
                {!isLoggedIn && (
                    <p className={`text-sm mb-6 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        Pour sauvegarder votre liste de souhaits{' '}
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
                <div className={`flex flex-wrap items-center justify-center gap-1 md:gap-0 md:divide-x ${darkMode ? 'divide-white/10' : 'divide-stone-200'}`}>
                    <button
                        onClick={handleShare}
                        className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'}`}
                    >
                        <Upload size={15} strokeWidth={1.5} />
                        Partager ma liste de souhaits
                    </button>
                    <button
                        onClick={purchasableItems.length > 0 ? handleAddAll : undefined}
                        className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${purchasableItems.length === 0 ? 'opacity-30 pointer-events-none' : (darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900')}`}
                    >
                        <ShoppingCart size={15} strokeWidth={1.5} />
                        Tout ajouter au panier
                    </button>
                    <button
                        onClick={wishlistItems.length > 0 ? onClearWishlist : undefined}
                        className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${wishlistItems.length === 0 ? 'opacity-30 pointer-events-none' : (darkMode ? 'text-stone-400 hover:text-red-400' : 'text-stone-500 hover:text-red-500')}`}
                    >
                        <X size={15} strokeWidth={1.5} />
                        Vider ma liste de souhaits
                    </button>
                </div>
                </div>
            </div>

            {/* CONTENU */}
            <div className="px-4 py-10 md:px-8 md:py-12 lg:px-12">
                {enrichedItems.length === 0 ? (
                    /* ÉTAT VIDE */
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${darkMode ? 'bg-stone-900' : 'bg-stone-100'}`}>
                            <Heart size={32} strokeWidth={1} className={darkMode ? 'text-stone-600' : 'text-stone-300'} />
                        </div>
                        <div>
                            <p className={`font-serif text-2xl mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Votre liste de souhaits est vide</p>
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
                    <div className="mx-auto grid max-w-[1320px] grid-cols-[repeat(auto-fit,minmax(150px,220px))] justify-center gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fit,minmax(170px,230px))] md:gap-x-6 md:gap-y-10 lg:grid-cols-[repeat(auto-fill,minmax(190px,240px))] xl:grid-cols-[repeat(auto-fill,minmax(205px,250px))]">
                        {enrichedItems.map((item, index) => {
                            const price = item.currentPrice || item.startingPrice || item.price;
                            const priority = index < 6;
                            const cardImage = getProductCardImage(item);
                            const purchasable = isPurchasable(item);
                            const unavailableLabel = getPurchaseUnavailableLabel(item);
                            return (
                                <div key={item.id} className="group relative flex min-w-0 flex-col">
                                    {/* IMAGE + X */}
                                    <div className="relative">
                                        {/* Bouton X retirer */}
                                        <button
                                            onClick={() => onToggleWishlist(item)}
                                            className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all shadow ${darkMode ? 'bg-[#1a1a1a] text-stone-300 hover:bg-red-900/40 hover:text-red-400 border border-white/10' : 'bg-white text-stone-500 hover:bg-red-50 hover:text-red-500 border border-stone-200'}`}
                                            title="Retirer de la liste de souhaits"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>

                                        {/* Image */}
                                        <Link
                                            href={getProductUrl(item)}
                                            prefetch={false}
                                            className={`relative block overflow-hidden rounded-[12px] aspect-[3/4] cursor-pointer ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}
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
                                            {!purchasable && !shouldRequestQuote(item) && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="text-white text-xs font-black uppercase tracking-widest">{unavailableLabel}</span>
                                                </div>
                                            )}
                                        </Link>
                                    </div>

                                    {/* INFO */}
                                    <div className="pt-3 flex flex-col gap-1 text-left">
                                        <Link
                                            href={getProductUrl(item)}
                                            prefetch={false}
                                            className="truncate font-serif text-sm md:text-base leading-tight cursor-pointer hover:opacity-70 transition-opacity text-inherit no-underline"
                                        >
                                            {item.name}
                                        </Link>
                                        <p className={`text-sm font-bold ${!purchasable ? 'text-red-500' : ''}`}>
                                            {purchasable ? `${price} €` : shouldRequestQuote(item) ? 'Sur demande' : unavailableLabel}
                                        </p>
                                    </div>

                                    {/* BOUTON PANIER */}
                                    <button
                                        onClick={() => purchasable && onAddToCart(item)}
                                        disabled={!purchasable}
                                        className={`mt-3 w-full rounded-[6px] py-2.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'bg-stone-800 text-stone-100 hover:bg-stone-700' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                                    >
                                        {purchasable ? 'Ajouter au panier' : unavailableLabel}
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
