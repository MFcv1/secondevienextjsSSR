import React from 'react';

const CustomerTestimonialsCarousel = React.lazy(() => import('../../shared/CustomerTestimonialsCarousel'));

const TestimonialsSection = React.memo(function TestimonialsSection({ darkMode }) {
    return (
        <React.Suspense fallback={<div className="min-h-[320px]" aria-hidden="true" />}>
            <CustomerTestimonialsCarousel
                darkMode={darkMode}
                headingId="marketplace-testimonials-title"
            />
        </React.Suspense>
    );
});

export default TestimonialsSection;
