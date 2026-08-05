'use client';

import { useLayoutEffect } from 'react';

const REVEAL_SELECTOR = '[data-quote-reveal]';
const FORM_READY_EVENT = 'quote:form-ready';
const FORM_MOUNT_EVENT = 'quote:form-mount-ready';
const RUNTIME_KEY = '__secondeVieQuoteMotionRuntime';
const CLEANUP_KEY = '__secondeVieQuoteMotionCleanup';
const RETURN_KEY = '__secondeVieQuoteHasUnmounted';

const SEQUENCES = {
    hero: { after: null, duration: 1700 },
    progress: { after: 'hero', duration: 1050 },
    'step-shell': { after: 'progress', duration: 720 },
    'step-copy': { after: 'step-shell', duration: 850 },
    'step-cards': { after: 'step-copy', duration: 1250 },
    process: { after: null, duration: 1400 },
};

const createRuntime = () => ({
    completed: new Set(),
    elements: new Map(),
    started: new Set(),
    timers: new Set(),
    visible: new Set(),
});

/**
 * Orchestre les chapitres de /devis.
 *
 * Le hero et le rail forment la sequence d'entree. Une fois le rail termine,
 * le formulaire client remplace le gabarit SSR puis devient l'unique
 * proprietaire des animations de l'etape 1.
 */
export default function QuoteRevealIsland() {
    useLayoutEffect(() => {
        const root = document.documentElement;
        const page = document.querySelector('[data-ssr-quote]');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const returningToPage = window[RETURN_KEY] === true;

        if (window[CLEANUP_KEY]) {
            window.clearTimeout(window[CLEANUP_KEY]);
            delete window[CLEANUP_KEY];
        }

        if (window.__secondeVieQuoteMotionFallback) {
            window.clearTimeout(window.__secondeVieQuoteMotionFallback);
            delete window.__secondeVieQuoteMotionFallback;
        }

        if (returningToPage && !prefersReducedMotion) {
            root.dataset.quoteMotion = 'pending';
            delete window[RETURN_KEY];
            delete window[RUNTIME_KEY];
        }

        // Lors d'une navigation Next côté client, le script inline de la page
        // n'est pas execute. L'absence d'etat signifie donc une vraie entree
        // sur /devis, jamais un Ctrl R de cette route.
        if (!root.dataset.quoteMotion && !prefersReducedMotion) {
            root.dataset.quoteMotion = 'pending';
        }

        if (
            !page
            || prefersReducedMotion
            || !['pending', 'active'].includes(root.dataset.quoteMotion)
            || typeof IntersectionObserver === 'undefined'
        ) {
            root.dataset.quoteMotion = 'complete';
            return undefined;
        }

        root.dataset.quoteMotion = 'active';
        const runtime = window[RUNTIME_KEY] || createRuntime();
        const observedThisPass = new WeakSet();
        let observeElement = () => {};
        window[RUNTIME_KEY] = runtime;

        const settleKey = (key) => {
            runtime.elements.get(key)?.forEach(element => element.classList.add('is-settled'));
            runtime.completed.add(key);

            // Le vrai formulaire prend la place du gabarit SSR des la fin du
            // rail. Le panneau "Etape 1" serveur n'est jamais anime : seul son
            // equivalent client peut ensuite demarrer.
            if (key === 'progress') {
                window.dispatchEvent(new Event(FORM_MOUNT_EVENT));
            }

            const observeDependents = () => {
                // Une sequence dependante n'est observee qu'une fois son parent
                // termine. Elle ne peut donc pas etre consommee hors ecran trop tot.
                Object.entries(SEQUENCES).forEach(([dependentKey, sequence]) => {
                    if (sequence.after !== key || runtime.started.has(dependentKey)) return;
                    runtime.visible.delete(dependentKey);
                    runtime.elements.get(dependentKey)?.forEach(observeElement);
                });
            };

            if (key === 'progress') {
                // Laisse React remplacer le gabarit avant d'observer le panneau.
                const mountTimer = window.setTimeout(() => {
                    observeDependents();
                    runtime.timers.delete(mountTimer);
                }, 0);
                runtime.timers.add(mountTimer);
            } else {
                observeDependents();
            }
        };

        const flush = () => {
            Object.entries(SEQUENCES).forEach(([key, sequence]) => {
                if (runtime.started.has(key) || !runtime.visible.has(key)) return;
                if (sequence.after && !runtime.completed.has(sequence.after)) return;

                runtime.started.add(key);
                runtime.elements.get(key)?.forEach(element => element.classList.add('is-in'));

                const timer = window.setTimeout(() => {
                    settleKey(key);
                    runtime.timers.delete(timer);
                    flush();
                }, sequence.duration);
                runtime.timers.add(timer);
            });
        };

        const onIntersect = (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const key = entry.target.dataset.quoteReveal;
                if (!key) return;

                const sequence = SEQUENCES[key];
                if (sequence.after && !runtime.completed.has(sequence.after)) {
                    observer.unobserve(entry.target);
                    return;
                }

                runtime.visible.add(key);
                observer.unobserve(entry.target);
            });
            flush();
        };

        const eagerObserver = new IntersectionObserver(
            (entries, observer) => onIntersect(entries, observer),
            { threshold: 0, rootMargin: '0px' }
        );
        const scrollObserver = new IntersectionObserver(
            (entries, observer) => onIntersect(entries, observer),
            { threshold: 0, rootMargin: '0px 0px -32% 0px' }
        );
        const cardsObserver = new IntersectionObserver(
            (entries, observer) => onIntersect(entries, observer),
            { threshold: 0, rootMargin: '0px 0px -12% 0px' }
        );

        observeElement = (element) => {
            const mode = element.dataset.quoteRevealMode;
            const observer = mode === 'eager'
                ? eagerObserver
                : mode === 'cards'
                    ? cardsObserver
                    : scrollObserver;
            observer.observe(element);
        };

        const scan = () => {
            page.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
                const key = element.dataset.quoteReveal;
                if (!key || !SEQUENCES[key]) return;

                if (!runtime.elements.has(key)) runtime.elements.set(key, new Set());
                const elements = runtime.elements.get(key);
                elements.add(element);

                if (observedThisPass.has(element)) return;
                observedThisPass.add(element);

                if (runtime.completed.has(key)) {
                    element.classList.add('is-in', 'is-settled');
                    return;
                }

                if (runtime.started.has(key)) {
                    // Filet de securite pour un remplacement tardif : un noeud
                    // neuf rejoint l'etat courant sans repartir de zero.
                    element.classList.add('is-in', 'is-settled');
                    return;
                }

                observeElement(element);
            });
        };

        scan();
        window.addEventListener(FORM_READY_EVENT, scan);

        return () => {
            window.removeEventListener(FORM_READY_EVENT, scan);
            eagerObserver.disconnect();
            scrollObserver.disconnect();
            cardsObserver.disconnect();

            // Le tour suivant annule ce timer en Strict Mode. Un vrai depart
            // de la route le laisse courir et rearme la prochaine visite.
            window[CLEANUP_KEY] = window.setTimeout(() => {
                runtime.timers.forEach(timer => window.clearTimeout(timer));
                runtime.timers.clear();
                root.dataset.quoteMotion = 'complete';
                window[RETURN_KEY] = true;
                delete window[RUNTIME_KEY];
                delete window[CLEANUP_KEY];
            }, 0);
        };
    }, []);

    return null;
}
