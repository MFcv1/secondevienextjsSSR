import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductGridSection = ({
    id,
    sectionRef,
    className,
    heading,
    items,
    hasMore,
    loading,
    onLoadMore,
    darkMode,
    badgeLabel,
    isDetailOverlayOpen,
    likedOriginalIds,
    onSelectItem,
    onPrefetchItem,
    onAddToCart,
    onToggleWishlist,
    getPriority,
    hideWhenEmpty = false,
}) => {
    if (hideWhenEmpty && (!items || items.length === 0)) return null;

    return (
        <section ref={sectionRef} id={id} className={className}>
            <div className="flex items-center justify-between mb-10">
                {heading}
                {hasMore && (
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="hidden md:flex items-center gap-2 font-sans uppercase text-[10px] tracking-widest border-b border-transparent hover:border-current transition-colors disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <>Voir plus <ArrowRight size={12} /></>}
                    </button>
                )}
            </div>

            <div className="anim-grid grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
                {items.map((item, index) => (
                    <div key={item.id} className="product-card-wrap relative">
                        {badgeLabel && (
                            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-[#d4e1d9] text-[#2d4033] text-[8px] md:text-[9px] uppercase font-bold tracking-widest rounded-sm">
                                {badgeLabel}
                            </div>
                        )}
                        <ProductCard
                            item={item}
                            layoutMode="grid"
                            isBig={false}
                            compact={true}
                            priority={Boolean(getPriority?.(item, index))}
                            suspendImageWarmup={isDetailOverlayOpen}
                            onClick={() => onSelectItem(item.id)}
                            onPrefetch={() => onPrefetchItem?.(item.id)}
                            onAddToCart={onAddToCart}
                            isLiked={likedOriginalIds.has(item.id)}
                            onToggleLike={onToggleWishlist}
                        />
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-10 md:hidden">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-sans uppercase text-[10px] tracking-widest font-bold transition-colors disabled:opacity-40 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-800'}`}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <>Voir plus <ArrowRight size={12} /></>}
                    </button>
                </div>
            )}
        </section>
    );
};

export default ProductGridSection;
