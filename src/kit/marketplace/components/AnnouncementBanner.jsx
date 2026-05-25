import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getDb, loadFirestoreModule } from '../../config/firebaseLazy';

const DEFAULT_MESSAGES = [
    "🔥 Livraison offerte dès 250€ d'achat",
    "💡 Payez en 2x, 3x, 4x sans frais avec Klarna",
    "Rejoignez le programme de fidélité Seconde Vie 🎁"
];

export default function AnnouncementBanner({ darkMode, isCollapsedOnMobile = false }) {
    const [index, setIndex] = useState(0);
    const [messages, setMessages] = useState(DEFAULT_MESSAGES);

    useEffect(() => {
        let cancelled = false;
        let idleId = 0;

        const fetchMessages = async () => {
            try {
                const [db, { doc, getDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
                if (cancelled) return;
                const snap = await getDoc(doc(db, 'sys_metadata', 'gallery_app'));
                if (!cancelled && snap.exists()) {
                    const data = snap.data();
                    const bannerText = data.announcement_banner_text;
                    if (bannerText) {
                        const newMsgs = [bannerText.msg_1, bannerText.msg_2, bannerText.msg_3, bannerText.msg_4].filter(m => m && m.trim().length > 0);
                        if (newMsgs.length > 0) {
                            setMessages(newMsgs);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching announcement banner:", error);
            }
        };

        const timeoutId = window.setTimeout(() => {
            if (typeof window.requestIdleCallback === 'function') {
                idleId = window.requestIdleCallback(fetchMessages, { timeout: 4000 });
                return;
            }
            fetchMessages();
        }, 45000);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
            if (idleId && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.documentElement.classList.contains('theme-transitioning')) return;
            setIndex((prev) => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [messages.length]);

    // Theme logic: Integration aux couleurs premium du site
    // Light mode : beige très clair "architectural"
    // Dark mode : Variante de noir plus claire que le fond #0A0A0A
    const bgClass = darkMode ? 'bg-[#111111] border-b border-stone-800/40 text-stone-200' : 'bg-[#EFEDE8] border-b border-stone-200/50 text-[#1A1A1A]';

    return (
        <div className={`${bgClass} ${isCollapsedOnMobile ? 'max-md:h-0 max-md:border-b-0' : ''} relative z-[2100] flex h-[28px] w-full items-center justify-center overflow-hidden transition-[height,border-color] duration-200 ease-out md:h-[34px]`}>
            {/* Center Carousel */}
            <div className="flex items-center justify-center relative w-full h-full">
                <div
                    key={index}
                    className="announcement-banner-message absolute inset-0 flex items-center justify-center"
                >
                    <span className="px-3 text-center font-sans text-[11px] font-bold tracking-[0.04em] md:px-4 md:text-[12px] md:tracking-[0.05em]">
                        {messages[index]}
                    </span>
                </div>
            </div>
            
            {/* Right Language Switcher */}
            <div className={`absolute right-4 md:right-8 hidden md:flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity z-10 ${darkMode ? 'text-stone-400' : 'text-[#504A45]'}`}>
                <span className="font-sans text-[12px] tracking-wider font-semibold">Français</span>
                <ChevronDown size={12} strokeWidth={2.5} />
            </div>
        </div>
    );
}
