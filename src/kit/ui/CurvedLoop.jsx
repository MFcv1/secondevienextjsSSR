import { useRef, useEffect, useState, useMemo, useId } from 'react';
import gsap from 'gsap';

const CurvedLoop = ({
    marqueeText = '',
    speed = 2,
    className,
    curveAmount = 400,
    direction = 'left'
}) => {
    // 1. STABLE TEXT GENERATION
    // Standard spaces are unreliable in SVG measurement. \u00A0 is stable.
    const textUnit = useMemo(() => {
        const clean = marqueeText.replace(/\s/g, '\u00A0');
        return clean + '\u00A0\u00A0\u00A0'; // Triple stable space
    }, [marqueeText]);

    const measureRef = useRef(null);
    const textPathRef = useRef(null);
    const [spacing, setSpacing] = useState(0);
    const uid = useId();
    const pathId = `curve-${uid}`;
    const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`;

    // 2. STABLE MEASUREMENT
    useEffect(() => {
        let active = true;
        const measure = () => {
            if (!measureRef.current || !active) return;
            const len = measureRef.current.getComputedTextLength();
            if (len > 0) {
                // Once we have a length, we lock it. 
                // Any further small changes (subpixel) would cause the jump.
                setSpacing(len);
                active = false; // Stop measuring once stable
            } else {
                requestAnimationFrame(measure);
            }
        };

        // Wait for fonts to avoid measuring the fallbacks
        if (document.fonts) {
            document.fonts.ready.then(measure);
        } else {
            measure();
        }

        return () => { active = false; };
    }, [textUnit]);

    // 3. SEAMLESS REPETITION
    // We render just enough to cover the screen twice.
    const repetitions = useMemo(() => {
        if (!spacing) return '';
        // 6 units is plenty for 1540px width
        return Array(6).fill(textUnit).join('');
    }, [textUnit, spacing]);

    // 4. GSAP TICKER ANIMATION (The Most Stable Method)
    useEffect(() => {
        if (!spacing || !textPathRef.current) return;

        const textPath = textPathRef.current;
        let x = -spacing * 2; // Start position

        // Direction multiplier
        const vel = direction === 'right' ? speed : -speed;

        const onTick = () => {
            x += vel;

            // PIXEL PERFECT WRAPPING
            // We use a safe range (-3 to -2) so the user never sees the edges.
            // If we move by exactly 1 spacing unit, the transition is invisible.
            if (x <= -spacing * 3.5) x += spacing;
            if (x >= -spacing * 1.5) x -= spacing;

            textPath.setAttribute('startOffset', x + 'px');
        };

        gsap.ticker.add(onTick);
        return () => gsap.ticker.remove(onTick);
    }, [spacing, speed, direction]);

    return (
        <div className="curved-loop-jacket" style={{ opacity: spacing ? 1 : 0 }}>
            <svg className="curved-loop-svg" viewBox="0 0 1440 120" style={{ pointerEvents: 'none' }}>
                <text ref={measureRef} style={{ visibility: 'hidden', pointerEvents: 'none', position: 'absolute' }}>
                    {textUnit}
                </text>
                <defs>
                    <path id={pathId} d={pathD} fill="none" />
                </defs>
                {spacing > 0 && (
                    <text fontWeight="bold" className={className}>
                        <textPath ref={textPathRef} href={`#${pathId}`}>
                            {repetitions}
                        </textPath>
                    </text>
                )}
            </svg>
        </div>
    );
};

export default CurvedLoop;
