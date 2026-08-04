'use client';

import { useLayoutEffect } from 'react';

const REVEAL_SELECTOR = '[data-quote-reveal]';
const FORM_READY_EVENT = 'quote:form-ready';

/**
 * Possede les quatre sequences d'apparition de /devis.
 *
 * Chaque cle est consommee a sa premiere entree dans le viewport. Le shell
 * SSR et le formulaire interactif partagent leurs cles : leur remplacement
 * ne peut donc jamais relancer une animation deja jouee.
 */
export default function QuoteRevealIsland() {
    useLayoutEffect(() => {
        const root = document.documentElement;
        const page = document.querySelector('[data-ssr-quote]');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (window.__secondeVieQuoteMotionCleanup) {
            window.clearTimeout(window.__secondeVieQuoteMotionCleanup);
            delete window.__secondeVieQuoteMotionCleanup;
        }

        if (window.__secondeVieQuoteMotionFallback) {
            window.clearTimeout(window.__secondeVieQuoteMotionFallback);
            delete window.__secondeVieQuoteMotionFallback;
        }

        // Une actualisation, une visite precedente ou la motion reduite
        // affichent directement l'etat final.
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

        const consumed = new Set();
        const observed = new WeakSet();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const key = entry.target.dataset.quoteReveal;
                    if (key) consumed.add(key);
                    entry.target.classList.add('is-in');
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0, rootMargin: '0px 0px -12% 0px' }
        );

        const scan = () => {
            page.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
                const key = element.dataset.quoteReveal;
                if (!key || observed.has(element)) return;

                observed.add(element);

                if (element.classList.contains('is-in')) {
                    consumed.add(key);
                    return;
                }

                // Le formulaire client reprend les cles du shell. Si la
                // sequence a deja ete vue, son remplacement arrive termine.
                if (consumed.has(key)) {
                    element.classList.add('is-in');
                    return;
                }

                observer.observe(element);
            });
        };

        scan();
        window.addEventListener(FORM_READY_EVENT, scan);

        return () => {
            window.removeEventListener(FORM_READY_EVENT, scan);
            observer.disconnect();

            // Le delai nul distingue un vrai demontage du double passage des
            // effects en mode strict : un remontage immediat annule ce timer.
            window.__secondeVieQuoteMotionCleanup = window.setTimeout(() => {
                root.dataset.quoteMotion = 'complete';
                delete window.__secondeVieQuoteMotionCleanup;
            }, 0);
        };
    }, []);

    return null;
}
