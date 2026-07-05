import { X, Trash2, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CartSidebar = ({ isOpen, onClose, cartItems, onRemoveItem, totalPrice, onCheckout, interacted, darkMode, activeDesignId }) => {
    const [isOverlayVisible, setIsOverlayVisible] = useState(isOpen);
    const [isPresentedOpen, setIsPresentedOpen] = useState(false);
    const transitionEnabled = interacted || isOpen;
    const baseTransition = transitionEnabled ? 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]' : 'duration-0';
    const panelOpen = isOpen && isPresentedOpen;

    const isArch = activeDesignId === 'architectural';
    const bgClass = isArch
        ? (darkMode ? 'bg-[#0A0A0A] border-stone-800 text-stone-200' : 'bg-[#FAFAF9] border-stone-200 text-stone-900')
        : (darkMode ? 'bg-[#0A0A0A] border-stone-800 text-white' : 'bg-[#FAFAF9] text-stone-900');

    useEffect(() => {
        if (!isOpen) {
            setIsPresentedOpen(false);
            const timeoutId = window.setTimeout(() => {
                setIsOverlayVisible(false);
            }, 300);
            return () => window.clearTimeout(timeoutId);
        }

        setIsOverlayVisible(true);
        return undefined;
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !isOverlayVisible) {
            return undefined;
        }

        const frameId = window.requestAnimationFrame(() => {
            setIsPresentedOpen(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [isOpen, isOverlayVisible]);

    return (
        <div data-cart-sidebar className={`fixed inset-0 z-[2500] ${isOverlayVisible ? 'visible' : 'invisible'}`}>
            <div
                data-cart-backdrop
                className={`absolute inset-0 transition-opacity duration-300 ease-out ${panelOpen ? 'opacity-100' : 'opacity-0'} ${darkMode ? 'bg-stone-950/62 backdrop-blur-sm' : 'bg-stone-950/24 backdrop-blur-sm'}`}
                onClick={onClose}
            />

            <div
                data-cart-panel
                className={`absolute inset-0 h-full overscroll-contain border-l shadow-2xl transition-[transform,opacity] ${baseTransition} transform-gpu
                px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top,0px))] safe-pb-cart
                md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[500px] md:rounded-none md:border-l md:border-t-0 md:p-8 md:pt-6
                flex flex-col safe-area-bottom ${panelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${bgClass}`}
            >
                <div className={`mb-4 flex items-center justify-between border-b pb-4 md:mb-10 md:pb-6 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full md:hidden ${darkMode ? 'bg-white/5 text-stone-200' : 'bg-stone-100 text-stone-900'}`}>
                            <ShoppingBag size={18} strokeWidth={1.5} />
                        </span>
                        <ShoppingBag size={24} className={`hidden md:block ${isArch ? (darkMode ? 'text-stone-200' : 'text-stone-900') : (darkMode ? 'text-white' : 'text-stone-900')}`} />
                        <h2 className={`text-[22px] font-black tracking-tight md:text-2xl ${isArch ? 'font-serif font-normal tracking-wide' : ''}`}>
                            {isArch ? 'Votre panier' : 'Votre Panier'}
                        </h2>
                    </div>

                    <div className="relative flex h-10 w-10 items-center justify-center md:h-12 md:w-12">
                        <motion.button
                            onClick={onClose}
                            aria-label="Fermer le panier"
                            initial={{ rotate: 0, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            whileTap={{ rotate: 45, scale: 0.92 }}
                            transition={{
                                rotate: { type: 'spring', stiffness: 450, damping: 25 },
                                opacity: { duration: 0.3 }
                            }}
                            className={`flex h-10 w-10 touch-manipulation items-center justify-center rounded-full will-change-transform ${darkMode ? 'bg-white/5 text-stone-300' : 'bg-stone-100 text-stone-600'}`}
                        >
                            <X size={24} strokeWidth={1} />
                        </motion.button>
                    </div>
                </div>

                <div className="ios-modal-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-stone-200 md:space-y-6 md:pr-2">
                    {cartItems.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-stone-400 opacity-60">
                            <ShoppingBag size={48} strokeWidth={1} />
                            <p className="font-serif italic text-lg">{isArch ? 'Aucune pièce sélectionnée.' : 'Votre panier est vide.'}</p>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div
                                key={item.id}
                                className={`group relative flex gap-3 rounded-2xl p-2 md:gap-4 md:border md:p-4 md:shadow-sm ${
                                    isArch
                                        ? 'border-stone-200 bg-transparent dark:border-stone-800'
                                        : (darkMode ? 'border-stone-700 bg-stone-800/50' : 'border-stone-100 bg-white')
                                }`}
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className={`h-24 w-24 object-cover bg-stone-100 md:h-20 md:w-20 ${isArch ? 'rounded-lg md:rounded-none' : 'rounded-xl'}`}
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center pr-9 md:pr-10">
                                    <h3 className={`line-clamp-2 font-bold leading-tight break-title ${darkMode ? 'text-white' : 'text-stone-900'} ${isArch ? 'font-serif text-[15px] tracking-wide md:text-lg' : ''}`}>
                                        {item.name}
                                    </h3>
                                    <p className={`mt-1 truncate text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{item.material}</p>
                                    <p className={`mt-1.5 text-sm font-black ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>{item.price} €</p>
                                    <p className={`mt-2 text-[11px] uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Quantite 1</p>
                                </div>
                                <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className={`absolute right-2 top-3 flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full transition-colors active:scale-95 md:right-4 md:top-4 ${darkMode ? 'bg-stone-900/50 text-stone-500 hover:bg-red-500/20 hover:text-red-400' : 'bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-500'}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className={`mt-4 space-y-4 border-t pt-5 md:space-y-6 md:pb-8 md:pt-8 ${darkMode ? 'border-stone-800' : 'border-stone-200'}`}>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Sous-total</span>
                                <span>{totalPrice} €</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={darkMode ? 'text-stone-400' : 'text-stone-600'}>Livraison</span>
                                <span className={darkMode ? 'text-stone-400' : 'text-stone-500'}>Offerte</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className={`font-serif text-lg ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>Total</span>
                            <span className={`text-xl font-black tracking-tight md:text-4xl md:tracking-tighter ${darkMode ? 'text-white' : 'text-stone-900'} ${isArch ? 'md:font-serif' : ''}`}>{totalPrice} €</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className={`flex w-full touch-manipulation items-center justify-center rounded-md py-4 text-sm font-black shadow-xl transition-all active:scale-[0.99] md:py-5 md:text-xs md:uppercase md:tracking-[0.2em] ${
                                isArch
                                    ? 'bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-black dark:hover:bg-stone-300'
                                    : (darkMode ? 'bg-white text-stone-900 hover:bg-amber-500 hover:text-white' : 'bg-stone-900 text-white hover:bg-amber-600')
                            }`}
                        >
                            Commander
                        </button>
                        <div className={`space-y-3 border-t pt-4 text-sm ${darkMode ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-600'}`}>
                            <div className="flex items-center gap-3"><ShieldCheck size={18} /> Paiement 100% sécurisé</div>
                            <div className="flex items-center gap-3"><Truck size={18} /> Livraison partout à Marseille</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartSidebar;
