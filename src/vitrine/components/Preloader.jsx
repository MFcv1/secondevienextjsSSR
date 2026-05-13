import React, { useState, useEffect } from 'react';

const Preloader = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Basic timeout for the empty shell, to replace with proper loading logic or GSAP timeline
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#1a1a1a] flex items-center justify-center text-white">
            {/* 
        TODO: Preloader UI
      */}
            <span className="text-2xl uppercase tracking-widest font-light">Chargement...</span>
        </div>
    );
};

export default Preloader;
