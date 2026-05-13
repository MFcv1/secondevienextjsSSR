import React, { useMemo } from 'react';

const ConfettiRain = () => {
    // Pre-calculate ALL random values to ensure stability during parent re-renders (scrolling)
    const particles = useMemo(() => {
        const colors = ['#10b981', '#fbbf24', '#3b82f6', '#f43f5e', '#8b5cf6'];
        return Array.from({ length: 50 }).map(() => ({
            left: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 4,
            duration: 2.5 + Math.random() * 2,
            opacity: 0.6 + Math.random() * 0.4
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden w-screen h-screen">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-fall"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        top: `-20px`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        opacity: p.opacity
                    }}
                />
            ))}
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
                }
                .animate-fall { animation-name: fall; animation-timing-function: cubic-bezier(0.4, 0, 1, 1); animation-iteration-count: infinite; }
            `}</style>
        </div>
    );
};

export default ConfettiRain;