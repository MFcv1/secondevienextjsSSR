import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useScroll, useVelocity } from 'framer-motion';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const MarqueeRow = ({ items = [], color, direction = 'left', baseSpeed = 1, className = "", zIndex = 1, style = {}, large = false, turnDuration = 0.25 }) => {
    const contentRef = useRef(null);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const velocityRef = useRef(0);
    const logicRef = useRef(1);

    // Dynamic sizing based on 'large' prop
    const heightClasses = large
        ? "h-[11vh] sm:h-[18vh] md:h-[25vh] lg:h-[30vh] xl:h-[33vh]"
        : "h-[10.5vh] sm:h-[17vh] md:h-[24.5vh] lg:h-[28.5vh] xl:h-[31.5vh]";

    const textClasses = large
        ? "text-[10.5vh] sm:text-[17vh] md:text-[24vh] lg:text-[29vh] xl:text-[32vh]"
        : "text-[9.5vh] sm:text-[16vh] md:text-[22vh] lg:text-[26vh] xl:text-[29vh]";

    // Sync state and ref for the ticker, with snappy transition
    useEffect(() => {
        return scrollVelocity.onChange((v) => {
            if (Math.abs(v) > 1) { // More sensitive threshold
                const newLogic = v > 0 ? 1 : -1;
                if (newLogic !== logicRef.current) {
                    logicRef.current = newLogic;
                    // Snappier transition is configurable via turnDuration
                    gsap.to(logicRef, { current: newLogic, duration: turnDuration, ease: "power3.out" });
                }
            }
        });
    }, [scrollVelocity, turnDuration]);

    useEffect(() => {
        if (!contentRef.current) return;
        const content = contentRef.current;
        const totalWidth = content.offsetWidth / 4; // Adjusted for 4 repetitions
        let x = 0;
        const update = () => {
            const v = scrollVelocity.get();
            const absVelocity = Math.abs(v);

            // Reactive physics: low friction (0.1) and high influence (0.005)
            velocityRef.current += (absVelocity - velocityRef.current) * 0.1;

            const dirMultiplier = direction === 'left' ? -1 : 1;
            const scrollInfluence = velocityRef.current * 0.005;

            // Total Movement = (Base + Scroll) * Switching Logic
            const totalSpeed = (baseSpeed + scrollInfluence) * dirMultiplier * logicRef.current;
            x += totalSpeed;

            if (x < -totalWidth) x += totalWidth;
            if (x > 0) x -= totalWidth;
            content.style.transform = `translate3d(${x}px, 0, 0)`;
        };
        gsap.ticker.add(update);
        return () => gsap.ticker.remove(update);
    }, [baseSpeed, direction]);

    return (
        <div
            className={`absolute w-[350%] -left-[100%] sm:w-[300%] sm:-left-[100%] flex items-center ${heightClasses} overflow-visible ${className}`}
            style={{
                backgroundColor: color,
                zIndex,
                // Anti-aliasing hacks for rotated edges on mobile/Retina
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                outline: "1px solid transparent",
                transformStyle: "preserve-3d",
                ...style
            }}
        >
            <div ref={contentRef} className="flex whitespace-nowrap will-change-transform items-center h-full">
                {[...Array(4)].map((_, i) => ( // Increased to 4 reps to fix the 'gap' bug
                    <div key={i} className="flex items-center gap-4 sm:gap-6 md:gap-10 lg:gap-12 px-2 sm:px-6 h-full">
                        {items.map((item, idx) => (
                            <React.Fragment key={idx}>
                                {item.type === 'text' ? (
                                    <span
                                        className={`${textClasses} italic uppercase tracking-[-0.03em] text-black leading-[0.8] drop-shadow-sm pb-[1vh]`}
                                        style={{ fontFamily: 'var(--font-dm-serif), serif' }}
                                    >
                                        {item.content}
                                    </span>
                                ) : (
                                    <div className="h-[95%] sm:h-[105%] aspect-square rounded-full border-[4px] sm:border-[6px] md:border-[8px] lg:border-[12px] border-[#FDFDFD] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] mx-3 sm:mx-5 lg:mx-8 flex-shrink-0 relative transform hover:scale-105 transition-transform duration-500 ring-1 ring-black/5">
                                        <img src={item.content} alt="decor" className="w-full h-full object-cover" />
                                        {/* Inner texture/bevel effect */}
                                        <div className="absolute inset-0 rounded-full border-[1px] border-black/5 pointer-events-none mix-blend-multiply" />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

const EditorialMarquee = () => {
    const [rows, setRows] = React.useState({ r1: [], r2: [], r3: [] });
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docRef = doc(db, 'sys_metadata', 'homepage_images');
                const snap = await getDoc(docRef);
                const data = snap.exists() ? snap.data() : {};

                const buildRow = (rowNum) => {
                    const rowItems = [];
                    for (let i = 1; i <= 3; i++) {
                        const key = `marquee_r${rowNum}_${i}`;
                        const img = data[key] || getDefault(rowNum, i).img;
                        const word = data[`${key}_text`]?.word || getDefault(rowNum, i).word;

                        rowItems.push({ type: 'text', content: word });
                        rowItems.push({ type: 'image', content: img });
                    }
                    return rowItems;
                };

                setRows({
                    r1: buildRow(1),
                    r2: buildRow(2),
                    r3: buildRow(3)
                });
            } catch (err) {
                console.error("Error fetching marquee config:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const getDefault = (r, i) => {
        // Default images are generic — replace via admin panel (AdminHomepage)
        const defaults = {
            1: [
                { word: '·', img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400' },
                { word: '·', img: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=400' },
                { word: '·', img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=400' }
            ],
            2: [
                { word: '·', img: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?q=80&w=400' },
                { word: '·', img: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=400' },
                { word: '·', img: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?q=80&w=400' }
            ],
            3: [
                { word: '·', img: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=400' },
                { word: '·', img: 'https://images.unsplash.com/photo-1596162954151-cd5438f351bf?q=80&w=400' },
                { word: '·', img: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=400' }
            ]
        };
        return defaults[r][i - 1];
    };

    if (loading) return null; // Or a subtle loader

    return (
        <div className="relative w-full h-[42vh] sm:h-[75vh] md:h-[90vh] lg:h-[110vh] xl:h-[120vh] my-2 md:my-24 overflow-hidden bg-transparent select-none">
            {/*
               BEHAVIOR REFINEMENT:
               - Pink base speed: 0.4
               - Blue & Purple base speed: 0.8 (+100%)
            */}

            <MarqueeRow
                items={rows.r1}
                color="#E5C99BF2"
                direction="left"
                baseSpeed={0.9}
                zIndex={1}
                large={true}
                className="top-[8%] rotate-[-4deg] md:top-[10%] md:rotate-[-3deg]"
            />

            <MarqueeRow
                items={rows.r3}
                color="#D97B6BF2"
                direction="left"
                baseSpeed={0.45}
                zIndex={2}
                large={true}
                className="top-[64%] rotate-[-4deg] sm:top-[58%] sm:rotate-[-3deg] md:top-[68%]"
            />

            <MarqueeRow
                items={rows.r2}
                color="#F3B664F2"
                direction="right"
                baseSpeed={0.8}
                zIndex={10}
                turnDuration={0.6}
                className="top-[39%] rotate-[4deg] sm:rotate-[3deg] md:top-[39%]"
            />
        </div>
    );
};

export default EditorialMarquee;
