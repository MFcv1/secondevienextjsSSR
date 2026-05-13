import React, { useRef } from 'react';
import gsap from 'gsap';

const MagneticButton = ({ children, className = "", onClick }) => {
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        const btn = ref.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.4,
            ease: "power2.out",
        });
    };

    const handleMouseLeave = () => {
        const btn = ref.current;
        if (!btn) return;

        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.3)",
        });
    };

    return (
        <button
            ref={ref}
            className={`will-change-transform ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default MagneticButton;
