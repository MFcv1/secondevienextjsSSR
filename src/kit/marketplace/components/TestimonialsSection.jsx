import React from 'react';
import CustomerTestimonialsCarousel from '../../shared/CustomerTestimonialsCarousel';

const TestimonialsSection = React.memo(function TestimonialsSection({ darkMode }) {
    return (
        <CustomerTestimonialsCarousel
            darkMode={darkMode}
            headingId="marketplace-testimonials-title"
        />
    );
});

export default TestimonialsSection;
