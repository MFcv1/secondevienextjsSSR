import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PageBreadcrumb({
    current,
    darkMode = false,
    className = '',
    linkHref = '/',
    linkLabel = 'Galerie',
    onLinkClick,
} = {}) {
    const linkTone = darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900';
    const separatorTone = darkMode ? 'text-stone-700' : 'text-stone-300';
    const currentTone = darkMode ? 'text-stone-300' : 'text-stone-700';
    const linkClassName = `inline-flex min-h-9 items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${linkTone}`;

    return (
        <nav className={`flex items-center gap-3 text-left ${className}`} aria-label="Fil d'Ariane">
            {onLinkClick ? (
                <button type="button" onClick={onLinkClick} className={linkClassName}>
                    <ChevronLeft size={14} />
                    {linkLabel}
                </button>
            ) : (
                <Link href={linkHref} prefetch={false} className={linkClassName}>
                    <ChevronLeft size={14} />
                    {linkLabel}
                </Link>
            )}
            <span className={`text-[10px] ${separatorTone}`}>/</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${currentTone}`}>
                {current}
            </span>
        </nav>
    );
}
