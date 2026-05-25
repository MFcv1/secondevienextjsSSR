import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const TESTIMONIALS = [
    {
        id: 1,
        text: "La commode céladon a complètement transformé notre chambre. Un travail magnifique et un respect de l'âme du meuble qui force l'admiration.",
        author: 'Sophie L.',
        color: '#F7EEE7',
    },
    {
        id: 2,
        text: "J'ai pleuré en voyant la restauration du vieux chevet de ma grand-mère. L'or et la patine sont d'une douceur absolue.",
        author: 'Caroline V.',
        color: '#F2E8D8',
    },
    {
        id: 3,
        text: "Le meuble est encore plus incroyable en vrai. On a retrouvé une pièce de famille, restaurée avec une grâce folle.",
        author: 'Julie M.',
        color: '#E5EBDD',
    },
    {
        id: 4,
        text: "Anaïs a compris exactement l'ambiance que je voulais. La livraison à Marseille était douce, précise, sans stress.",
        author: 'Marc & Chloe',
        color: '#EFE6DC',
    },
    {
        id: 5,
        text: "Une vraie seconde vie pour notre table de ferme. Elle garde ses marques, mais elle respire à nouveau.",
        author: 'Julien B.',
        color: '#F4EEE4',
    },
];

const wrapIndex = (index) => (index + TESTIMONIALS.length) % TESTIMONIALS.length;

const mobilePositions = {
    farLeft: { transform: 'translateX(-206%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
    left: { transform: 'translateX(-116%) scale(0.9)', opacity: 0.42, zIndex: 1, pointerEvents: 'none' },
    center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
    right: { transform: 'translateX(16%) scale(0.9)', opacity: 0.46, zIndex: 1, pointerEvents: 'none' },
    farRight: { transform: 'translateX(106%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
};

const desktopPositions = {
    farLeft: { transform: 'translateX(-248%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
    left: { transform: 'translateX(-145%) scale(0.92)', opacity: 0.52, zIndex: 1, pointerEvents: 'none' },
    center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
    right: { transform: 'translateX(45%) scale(0.92)', opacity: 0.58, zIndex: 1, pointerEvents: 'none' },
    farRight: { transform: 'translateX(148%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
};

const CustomerTestimonialsCarousel = ({
    darkMode = false,
    sectionClassName = '',
    headingId = 'customer-testimonials-title',
}) => {
    const [activeIndex, setActiveIndex] = useState(1);

    const positionedCards = useMemo(() => TESTIMONIALS.map((note, index) => {
        const offset = (index - activeIndex + TESTIMONIALS.length) % TESTIMONIALS.length;
        let position = 'farRight';
        if (offset === 0) position = 'center';
        else if (offset === 1) position = 'right';
        else if (offset === TESTIMONIALS.length - 1) position = 'left';
        else if (offset > TESTIMONIALS.length / 2) position = 'farLeft';

        return { note, position };
    }), [activeIndex]);

    const goPrevious = useCallback(() => setActiveIndex((current) => wrapIndex(current - 1)), []);
    const goNext = useCallback(() => setActiveIndex((current) => wrapIndex(current + 1)), []);
    const handleDragEnd = useCallback((_, info) => {
        const shouldAdvance = info.offset.x < -42 || info.velocity.x < -360;
        const shouldRewind = info.offset.x > 42 || info.velocity.x > 360;
        if (shouldAdvance) goNext();
        if (shouldRewind) goPrevious();
    }, [goNext, goPrevious]);

    return (
        <section
            className={`relative z-20 w-full overflow-hidden ${darkMode ? 'bg-[#151515] text-white' : 'bg-white text-[#242221]'} ${sectionClassName}`}
            aria-labelledby={headingId}
        >
            <div className="hidden px-8 py-20 lg:block lg:px-12 xl:px-16 xl:py-24">
                <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center">
                    <TestimonialsHeader headingId={headingId} darkMode={darkMode} />

                    <CarouselStage
                        cards={positionedCards}
                        positions={desktopPositions}
                        cardSize="desktop"
                        onDragEnd={handleDragEnd}
                        className="mt-12 h-[328px] w-full max-w-[1120px] overflow-visible xl:h-[352px] xl:max-w-[1240px]"
                    />

                    <CarouselControls
                        activeIndex={activeIndex}
                        count={TESTIMONIALS.length}
                        onPrevious={goPrevious}
                        onNext={goNext}
                        onSelect={setActiveIndex}
                        darkMode={darkMode}
                        className="mt-6 max-w-[360px] xl:mt-8 xl:max-w-[380px]"
                    />
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-[430px] flex-col items-center px-0 pb-16 pt-14 lg:hidden">
                <TestimonialsHeader headingId={`${headingId}-mobile`} darkMode={darkMode} compact />

                <CarouselStage
                    cards={positionedCards}
                    positions={mobilePositions}
                    cardSize="mobile"
                    onDragEnd={handleDragEnd}
                    className="mt-11 h-[318px] w-full overflow-hidden"
                />

                <CarouselControls
                    activeIndex={activeIndex}
                    count={TESTIMONIALS.length}
                    onPrevious={goPrevious}
                    onNext={goNext}
                    onSelect={setActiveIndex}
                    darkMode={darkMode}
                    className="mt-4 max-w-[286px]"
                    compact
                />
            </div>
        </section>
    );
};

const TestimonialsHeader = ({ headingId, darkMode, compact = false }) => (
    <div className="mx-auto flex max-w-[420px] flex-col items-center px-4 text-center">
        <div className={`mb-7 flex items-center gap-2 ${darkMode ? 'text-[#ff9d10]' : 'text-[#ff9200]'}`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={compact ? 21 : 23} fill="currentColor" strokeWidth={0} />
            ))}
        </div>

        <h2
            id={headingId}
            className={`${compact ? 'text-[34px]' : 'text-[44px]'} font-serif leading-none tracking-normal ${darkMode ? 'text-white' : 'text-[#242221]'}`}
        >
            La parole à nos clients.
        </h2>

        <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-stone-400' : 'text-[#77716b]'}`}>
            Excellent 4.9/5 - basé sur 124 avis Google
        </p>
    </div>
);

const CarouselStage = ({ cards, positions, cardSize, className, onDragEnd }) => (
    <motion.div
        className={`relative touch-pan-y cursor-grab active:cursor-grabbing ${className}`}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={onDragEnd}
    >
        {cards.map(({ note, position }) => (
            <TestimonialCard
                key={note.id}
                note={note}
                position={position}
                positions={positions}
                size={cardSize}
            />
        ))}
    </motion.div>
);

const TestimonialCard = ({ note, position, positions, size }) => {
    const isDesktop = size === 'desktop';

    return (
        <article
            style={{
                ...positions[position],
                backgroundColor: note.color,
                width: isDesktop ? 'min(29vw, 350px)' : undefined,
            }}
            className={`absolute left-1/2 top-0 flex flex-col justify-between rounded-[16px] will-change-transform ${
                isDesktop
                    ? 'h-[306px] px-7 py-8 shadow-[0_16px_38px_rgba(69,57,42,0.08)] xl:h-[332px] xl:px-9 xl:py-10'
                    : 'h-[292px] w-[232px] px-6 py-8 shadow-[0_18px_36px_rgba(69,57,42,0.035)]'
            } transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
        >
            <div
                aria-hidden="true"
                className="absolute left-1/2 top-0 h-6 w-16 -translate-x-1/2 -translate-y-[45%] bg-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
            />
            <Quote size={isDesktop ? 30 : 27} className="text-[#b8b1a8]/55" strokeWidth={2.4} />
            <p className={`${isDesktop ? 'text-[clamp(18px,1.72vw,24px)]' : 'text-[20px]'} font-serif leading-[1.36] tracking-normal text-[#252321]`}>
                "{note.text}"
            </p>
            <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-[#8c877f]">
                <span className="h-px w-5 bg-[#aaa49b]" />
                {note.author}
            </p>
        </article>
    );
};

const CarouselControls = ({ activeIndex, count, onPrevious, onNext, onSelect, darkMode, className, compact = false }) => (
    <div
        className={`mx-auto grid w-full ${compact ? 'grid-cols-[52px_1fr_52px] gap-2 px-0' : 'grid-cols-[60px_1fr_60px] gap-4 px-0'} items-center ${className}`}
    >
        <CarouselButton label="Avis precedent" onClick={onPrevious} darkMode={darkMode} compact={compact}>
            <ChevronLeft size={compact ? 20 : 24} strokeWidth={1.8} />
        </CarouselButton>

        <div className={`relative flex min-w-0 flex-col items-center justify-center ${compact ? 'gap-5 py-1' : 'gap-6 py-2'}`}>
            <div className={`relative z-10 flex w-full items-center justify-center ${compact ? 'gap-3' : 'gap-4'}`}>
                <span aria-hidden="true" className={`h-[3px] w-[3px] rounded-full ${darkMode ? 'bg-white/22' : 'bg-[#d8cec1]'}`} />
                <span aria-hidden="true" className={`${compact ? 'w-9' : 'w-14'} h-px ${darkMode ? 'bg-white/18' : 'bg-[#bca486]'}`} />
                <span
                    className={`font-serif ${compact ? 'text-[17px]' : 'text-[20px]'} font-semibold leading-none tracking-[0.05em] ${
                        darkMode ? 'text-stone-100' : 'text-[#181716]'
                    }`}
                >
                    {String(activeIndex + 1).padStart(2, '0')}
                    <span className={darkMode ? 'mx-2 font-normal text-stone-500' : 'mx-2 font-normal text-[#b9aa98]'}>/</span>
                    <span className={darkMode ? 'font-normal text-stone-400' : 'font-normal text-[#8f8579]'}>
                        {String(count).padStart(2, '0')}
                    </span>
                </span>
                <span aria-hidden="true" className={`${compact ? 'w-9' : 'w-14'} h-px ${darkMode ? 'bg-white/18' : 'bg-[#bca486]'}`} />
                <span aria-hidden="true" className={`h-[3px] w-[3px] rounded-full ${darkMode ? 'bg-white/22' : 'bg-[#d8cec1]'}`} />
            </div>

            <div className={`relative z-10 flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
                {TESTIMONIALS.map((note, index) => (
                    <button
                        key={note.id}
                        type="button"
                        aria-label={`Afficher l'avis ${index + 1}`}
                        aria-current={index === activeIndex ? 'true' : undefined}
                        onClick={() => onSelect(index)}
                        className={`rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            index === activeIndex
                                ? `${compact ? 'h-2 w-7' : 'h-2.5 w-8'} bg-[#ff9200] shadow-[0_0_0_4px_rgba(255,146,0,0.09),0_5px_12px_rgba(255,146,0,0.16)]`
                                : `${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${darkMode ? 'bg-white/20 hover:bg-white/34' : 'bg-[#d6ccbf] hover:bg-[#bdaa96]'}`
                        }`}
                    />
                ))}
            </div>
        </div>

        <CarouselButton label="Avis suivant" onClick={onNext} darkMode={darkMode} compact={compact}>
            <ChevronRight size={compact ? 20 : 24} strokeWidth={1.8} />
        </CarouselButton>
    </div>
);

const CarouselButton = ({ children, label, onClick, darkMode, compact = false }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`group relative flex ${compact ? 'h-[48px] w-[48px]' : 'h-[58px] w-[58px]'} items-center justify-center rounded-full p-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.96] ${
            darkMode
                ? 'bg-white/[0.045] text-white ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_32px_rgba(0,0,0,0.18)] hover:bg-white/[0.07] hover:ring-white/20'
                : 'bg-[#fbf8f2] text-[#655d54] ring-1 ring-[#e8ded1] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_34px_rgba(92,72,42,0.08)] hover:text-[#242221] hover:ring-[#dacbb9]'
        }`}
    >
        <span
            className={`flex h-full w-full items-center justify-center rounded-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04] ${
                darkMode
                    ? 'bg-[#1c1b19] ring-1 ring-white/10'
                    : 'bg-white ring-1 ring-[#f1ebe3]'
            }`}
        >
            {children}
        </span>
    </button>
);

export default CustomerTestimonialsCarousel;
