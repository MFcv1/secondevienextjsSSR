import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

// Ripple Component (Using user-provided logic/constants)
const Ripple = React.memo(function Ripple({
    mainCircleSize = 210,
    mainCircleOpacity = 0.24,
    numCircles = 8,
    className,
}) {
    return (
        <div
            className={`pointer-events-none absolute inset-0 select-none ${className || ''}`}
            style={{
                // User requested "Ondulation" style which has a fade mask
                maskImage: 'linear-gradient(to bottom, white 20%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, white 20%, transparent 100%)'
            }}
        >
            {Array.from({ length: numCircles }, (_, i) => {
                const size = mainCircleSize + i * 70;
                const opacity = mainCircleOpacity - i * 0.03;
                const animationDelay = `${i * 0.06}s`;

                return (
                    <div
                        key={i}
                        className="animate-ripple absolute rounded-full border shadow-xl"
                        style={{
                            "--duration": "2s",
                            "--i": i,
                            width: `${size}px`,
                            height: `${size}px`,
                            opacity: opacity > 0 ? opacity : 0,
                            animationDelay,
                            borderStyle: "solid",
                            borderWidth: "1px",
                            borderColor: "rgba(255, 255, 255, 0.1)", // --foreground equivalent
                            backgroundColor: "rgba(255, 255, 255, 0.05)", // bg-foreground/25 equivalent (roughly)
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%) scale(1)",
                        }}
                    />
                );
            })}
        </div>
    );
});

const MarketplaceDiscovery = ({ isOpen, onClose, onExplore }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                        onClick={onClose}
                    >
                        {/* Modal Card - WIDE & DEEP */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            // WIDE CONTAINER (Back to 4xl/5xl)
                            className="relative w-full max-w-5xl h-[400px] md:h-[600px] overflow-hidden rounded-3xl md:rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-white/[0.08] group cursor-pointer"
                            // Radial Gradient: Light Center -> Dark Edges (Depth Effect)
                            style={{
                                background: 'radial-gradient(circle at center, #2a2a2a 0%, #000000 100%)',
                                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 z-30 p-2.5 bg-white/[0.06] hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/[0.06]"
                            >
                                <X size={20} className="text-white/40 hover:text-white/70 transition-colors" />
                            </button>

                            {/* Ripple Effect (Masked) */}
                            <Ripple mainCircleOpacity={0.3} />

                            {/* Centered Content - Clickable */}
                            <a
                                href="/"
                                onClick={(e) => {
                                    if (onExplore) {
                                        e.preventDefault();
                                        onExplore();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-2"
                            >
                                {/* Title - Centered, Elegant */}
                                <h2 className="font-serif text-4xl md:text-6xl font-light tracking-[0.2em] text-white/95 uppercase text-center drop-shadow-lg">
                                    Marketplace
                                </h2>

                                {/* "Explorer" - Mobile: Visible / Desktop: Hover */}
                                <div className="mt-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 ease-out transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0">
                                    <div className="flex items-center gap-3 text-white/90 font-sans tracking-widest text-xs font-bold uppercase bg-white/[0.1] px-6 py-3 rounded-full backdrop-blur border border-white/[0.1] transition-colors hover:bg-white/[0.2] hover:text-white shadow-lg">
                                        <span>Explorer</span>
                                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </a>

                            {/* Decorative Corner Lines */}
                            <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-white/[0.03] rounded-tl-3xl md:rounded-tl-[2.5rem] pointer-events-none"></div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-white/[0.03] rounded-br-3xl md:rounded-br-[2.5rem] pointer-events-none"></div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MarketplaceDiscovery;
