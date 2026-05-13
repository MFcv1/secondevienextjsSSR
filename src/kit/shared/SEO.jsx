import React from 'react';
import KIT_CONFIG from '../config/constants';

const SEO = ({ title, description, image, url, type = 'website', schema }) => {
    React.useEffect(() => {
        if (typeof document === 'undefined') return;

        const siteTitle = KIT_CONFIG.seo.siteTitle;
        const defaultDescription = KIT_CONFIG.seo.description;
        const defaultImage = KIT_CONFIG.seo.ogImage;
        const siteUrl = KIT_CONFIG.seo.siteUrl;
        const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
        const resolvedUrl = url
            ? (url.startsWith('http') ? url : `${siteUrl}${url}`)
            : siteUrl;
        document.title = fullTitle;

        const upsertMeta = (selector, attrs) => {
            let element = document.head.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');
                document.head.appendChild(element);
            }
            Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
        };

        upsertMeta('meta[name="description"]', { name: 'description', content: description || defaultDescription });
        upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description || defaultDescription });
        upsertMeta('meta[property="twitter:card"]', { property: 'twitter:card', content: 'summary_large_image' });
        upsertMeta('meta[property="twitter:title"]', { property: 'twitter:title', content: fullTitle });
        upsertMeta('meta[property="twitter:description"]', { property: 'twitter:description', content: description || defaultDescription });

        if (resolvedUrl) {
            let canonical = document.head.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.rel = 'canonical';
                document.head.appendChild(canonical);
            }
            canonical.href = resolvedUrl;
            upsertMeta('meta[property="og:url"]', { property: 'og:url', content: resolvedUrl });
            upsertMeta('meta[property="twitter:url"]', { property: 'twitter:url', content: resolvedUrl });
        }

        const metaImage = image || defaultImage;
        if (metaImage) {
            upsertMeta('meta[property="og:image"]', { property: 'og:image', content: metaImage });
            upsertMeta('meta[property="twitter:image"]', { property: 'twitter:image', content: metaImage });
        }

        if (schema) {
            const id = 'legacy-client-json-ld';
            let script = document.getElementById(id);
            if (!script) {
                script = document.createElement('script');
                script.id = id;
                script.type = 'application/ld+json';
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(schema);
        }
    }, [description, image, schema, title, type, url]);

    return null;
};

export default SEO;
