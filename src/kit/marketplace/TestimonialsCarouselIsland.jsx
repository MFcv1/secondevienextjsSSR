'use client';

import CustomerTestimonialsCarousel from '../shared/CustomerTestimonialsCarousel';

export default function TestimonialsCarouselIsland({ darkMode = false } = {}) {
  return (
    <CustomerTestimonialsCarousel
      darkMode={darkMode}
      headingId="marketplace-testimonials-title"
    />
  );
}
