const config = {
    plugins: {
        '@tailwindcss/postcss': {},
        // autoprefixer REMOVED — Tailwind v4 handles vendor prefixing natively.
        // Having it caused duplicate -webkit- prefixes → iOS Safari compositor conflict → jitter on scroll.
    },
};

export default config;
