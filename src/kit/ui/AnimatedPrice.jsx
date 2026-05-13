import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const AnimatedPrice = ({ amount, className = "" }) => {
    const displayRef = useRef(null);
    const [prevAmount, setPrevAmount] = useState(amount);

    // Mutable tracker for GSAP
    const tracker = useRef({ val: amount });

    useEffect(() => {
        // Initial render or no change
        if (amount === prevAmount && displayRef.current) {
            displayRef.current.textContent = Math.round(amount).toLocaleString('fr-FR');
            return;
        }

        const ctx = gsap.context(() => {
            // "Mechanical" Count-up Animation
            // We animate the VALUE, but with a "stepped" ease to simulate mechanical clicks if we wanted,
            // but here we prioritize SMOOTHNESS + FINAL STABILITY.

            gsap.to(tracker.current, {
                val: amount,
                duration: 0.8, // Faster animation
                ease: "power2.out", // Smooth landing
                onUpdate: () => {
                    if (displayRef.current) {
                        displayRef.current.textContent = Math.round(tracker.current.val).toLocaleString('fr-FR');
                    }
                },
                onComplete: () => {
                    // Ensure final value is perfectly accurate and formatted
                    if (displayRef.current) {
                        displayRef.current.textContent = Math.round(amount).toLocaleString('fr-FR');
                    }
                }
            });

            // Color Flash (Feedback)
            if (amount > prevAmount) {
                gsap.fromTo(displayRef.current,
                    { color: '#10b981', scale: 1.02 },
                    { color: 'inherit', scale: 1, duration: 0.5, ease: "power2.out" }
                );
            }

        }, displayRef);

        setPrevAmount(amount);
        return () => ctx.revert();
    }, [amount]);

    return (
        <span
            ref={displayRef}
            className={`inline-block will-change-transform ${className}`}
            style={{ fontVariantNumeric: 'normal' }} // Force standard beautiful kerning
        >
            {Math.round(amount).toLocaleString('fr-FR')}
        </span>
    );
};

export default AnimatedPrice;
