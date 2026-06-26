import React from 'react';
import Link from 'next/link';
import HomeMotionIslandV4 from './HomeMotionIslandV4';
import AtelierStickyIsland from './AtelierStickyIsland';
import TestimonialsCarouselIsland from '../src/kit/marketplace/TestimonialsCarouselIsland';
import Sv4HomeHero from '../src/kit/vitrine/Sv4HomeHero';
import Sv4SiteNav from '../src/kit/vitrine/Sv4SiteNav';
import '../src/home-v4.css';

const faqs = [
  {
    q: "D'où viennent vos meubles ?",
    a: "Chinés en Provence : particuliers, successions et brocantes pro. Surtout des pièces européennes des années 30 à 70.",
  },
  {
    q: "Quels délais pour une restauration sur-mesure ?",
    a: "Comptez 4 à 8 semaines, selon l'ampleur du travail et le planning de l'atelier.",
  },
  {
    q: "Livrez-vous à l'étage ?",
    a: "Oui. Livraison en RDC par défaut, avec une option \u00ab montée à l'étage \u00bb (souvent à deux) proposée au devis.",
  },
  {
    q: "Puis-je voir les meubles en vrai ?",
    a: "Oui : à l'atelier en Provence sur rendez-vous, ou en visio pour découvrir la pièce sous tous les angles.",
  },
];

export const metadata = {
  title: 'Seconde Vie | Meubles d\'exception',
  description: 'Mobilier de seconde main restauré avec passion en Provence.',
};

export const viewport = {
  themeColor: '#FAF6EF',
};

export const revalidate = 3600;

export default function HomePageV4() {
  return (
    <div className="sv4" data-ssr-home data-sv4-shell>
      {/* Motion & Scroll triggers */}
      <HomeMotionIslandV4 />

      <Sv4SiteNav />

      <main>
        {/* ─── HERO ─── */}
        <Sv4HomeHero />

        {/* ─── MARQUEE ─── */}
        <section className="sv4-marquee" aria-hidden="true">
          <div className="sv4-marquee__track">
            {Array.from({ length: 4 }).map((_, i) => (
              <React.Fragment key={`marquee-${i}`}>
                <span className="sv4-marquee__item">Artisanat Français</span>
                <span className="sv4-marquee__dot">•</span>
                <span className="sv4-marquee__item">Mobilier Restauré</span>
                <span className="sv4-marquee__dot">•</span>
                <span className="sv4-marquee__item">Pièces Uniques</span>
                <span className="sv4-marquee__dot">•</span>
                <span className="sv4-marquee__item">Éco-responsable</span>
                <span className="sv4-marquee__dot">•</span>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ─── HORIZONTAL ACCORDION ─── */}
        <section className="sv4-wrap" style={{ marginTop: 'var(--section-gap)' }}>
          <div className="sv4-section-head sv4-reveal">
            <h2>Nos collections</h2>
            <Link href="/galerie" className="sv4-section-link">
              Tout le catalogue
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          
          <div className="sv4-accordion sv4-reveal" style={{ marginTop: '40px' }} data-nav-theme="dark">
            <Link href="/galerie?category=assises" className="sv4-accordion__slice">
              <img src="https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&q=80&w=800" alt="Assises" />
              <div className="sv4-accordion__overlay" />
              <div className="sv4-accordion__label">
                <h3>Assises</h3>
                <p className="sv4-accordion__desc">Chaises bistrot, fauteuils crapaud, tabourets d'atelier. Des pièces retapissées et chevillées dans les règles de l'art.</p>
                <span className="sv4-accordion__cta">Explorer <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
              </div>
            </Link>

            <Link href="/galerie?category=rangement" className="sv4-accordion__slice">
              <img src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800" alt="Rangement" />
              <div className="sv4-accordion__overlay" />
              <div className="sv4-accordion__label">
                <h3>Rangements</h3>
                <p className="sv4-accordion__desc">Enfilades scandinaves, armoires parisiennes, commodes patinées. L'alliance de l'esthétique et de la fonctionnalité.</p>
                <span className="sv4-accordion__cta">Explorer <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
              </div>
            </Link>

            <Link href="/galerie?category=tables" className="sv4-accordion__slice">
              <img src="https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800" alt="Tables" />
              <div className="sv4-accordion__overlay" />
              <div className="sv4-accordion__label">
                <h3>Tables</h3>
                <p className="sv4-accordion__desc">Tables de ferme massives, guéridons en marbre, bureaux d'écolier. Des plateaux poncés et nourris pour traverser les décennies.</p>
                <span className="sv4-accordion__cta">Explorer <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
              </div>
            </Link>
          </div>
        </section>

        {/* ─── SCRUBBING TEXT ─── */}
        <section className="sv4-scrub-section">
          <h2 className="sv4-scrub-text" aria-label="Nous refusons l'obsolescence. Chaque meuble porte les cicatrices de son histoire, nous nous contentons de les sublimer pour qu'elles deviennent sa force.">
            {"Nous refusons l'obsolescence. Chaque meuble porte les cicatrices de son histoire, nous nous contentons de les sublimer pour qu'elles deviennent sa force.".split(' ').map((word, i) => (
              <span className="sv4-scrub-word" key={`scrub-${i}`}>{word} </span>
            ))}
          </h2>
        </section>

        {/* ─── NARRATIVE (ATELIER) - FRAMER MOTION STICKY ─── */}
        <AtelierStickyIsland />

        {/* ─── FEATURED PRODUCTS ─── */}
        <section className="sv4-wrap sv4-selection">
          <div className="sv4-section-head sv4-reveal">
            <h2>Dernières pièces</h2>
            <Link href="/galerie" className="sv4-section-link">
              Voir la galerie
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          
          <div className="sv4-products-grid" data-nav-theme="dark">
            {[
              { title: "Enfilade scandinave teck", price: "890€", img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600", hoverImg: "https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&q=80&w=600" },
              { title: "Fauteuil crapaud velours", price: "340€", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600", hoverImg: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&q=80&w=600" },
              { title: "Table de ferme chêne massif", price: "1200€", img: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=600", hoverImg: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&q=80&w=600" },
              { title: "Commode parisienne", price: "550€", img: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=600", hoverImg: "https://images.unsplash.com/photo-1581428982868-e410dd147a90?auto=format&fit=crop&q=80&w=600" }
            ].map((p, i) => (
              <Link href="/galerie" className="sv4-product sv4-reveal" key={i}>
                <div className="sv4-product__media">
                  <img src={p.img} alt={p.title} className="sv4-product__img-primary" />
                  <img src={p.hoverImg} alt={`${p.title} - Détail`} className="sv4-product__img-hover" />
                </div>
                <div className="sv4-product__info">
                  <h3 className="sv4-product__name">{p.title}</h3>
                  <p className="sv4-product__desc">Pièce unique restaurée à l'atelier.</p>
                  <div className="sv4-product__bottom">
                    <span className="sv4-product__price">{p.price}</span>
                    <span className="sv4-product__go">Découvrir <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>


        {/* ─── REVIEWS — shared carousel (same as gallery, unified) ─── */}
        <TestimonialsCarouselIsland />

        {/* ─── DELIVERY - FULL CODE ARCHITECTURE ─── */}
        <section className="sv4-delivery-section" style={{ marginTop: 'var(--section-gap)' }}>
          {/* Map background is absolutely positioned to only cover the right side */}
          <div className="sv4-delivery-map-bg"></div>
          
          <div className="sv4-delivery-grid">
            {/* LEFT: Arch Container */}
            <div className="sv4-delivery-left">
              <div className="sv4-delivery-arch-frame sv4-reveal">
                <div className="sv4-delivery-arch-image-wrap">
                  <img 
                    src="/images/marseille_photo.png" 
                    alt="Vue de Marseille et Notre-Dame de la Garde" 
                  />
                  {/* Inner shadow overlay for realistic depth */}
                  <div className="sv4-delivery-arch-inner-shadow"></div>
                </div>
                {/* Stone sill at the bottom */}
                <div className="sv4-delivery-arch-sill"></div>
              </div>
            </div>
            
            {/* RIGHT: Content */}
            <div className="sv4-delivery-right sv4-reveal">
              <div className="sv4-delivery-content-wrapper">
                <h2 className="sv4-delivery-title">
                  <span className="sv4-delivery-title-line">Expédition</span>
                  <span className="sv4-delivery-title-line">soignée</span>
                </h2>
                
                <div className="sv4-delivery-desc">
                  <p>
                    Jusqu'à 20 km autour de Marseille,<br/>
                    nous assurons la livraison en direct.<br/>
                    Au-delà, nous confions chaque pièce à des<br/>
                    transporteurs spécialisés, avec le même soin<br/>
                    et la même exigence.
                  </p>
                  <div className="sv4-delivery-divider"></div>
                  <p>
                    Chaque meuble est emballé avec des matériaux<br/>
                    de protection haut de gamme et manipulé<br/>
                    avec le plus grand soin pour garantir qu'il<br/>
                    arrive en parfait état.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="sv4-wrap sv4-faq-section">
          <div className="sv4-faq-layout">
            <aside className="sv4-faq-intro sv4-reveal">
              <span className="sv4-eyebrow">FAQ</span>
              <h2>Questions fréquentes</h2>
              <p className="sv4-faq-intro__lead">L'essentiel avant de confier ou d'adopter une pièce de l'atelier.</p>
              <Link href="/devis" className="sv4-faq-intro__cta">
                Une autre question ? Écrivez-nous
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </aside>

            <div className="sv4-faq sv4-reveal">
              {faqs.map((item, i) => (
                <details name="faq" key={i} open={i === 0}>
                  <summary>
                    <span className="sv4-faq__index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="sv4-faq__q">{item.q}</span>
                    <span className="sv4-faq__toggle" />
                  </summary>
                  <div className="sv4-faq__a-wrap">
                    <p className="sv4-faq__a">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA — PORTAL ─── */}
        <section className="sv4-cta-final sv4-reveal">
          <div className="sv4-cta-final__portal" aria-hidden="true">
            <span className="sv4-cta-final__glow" />
            <span className="sv4-cta-final__arch sv4-cta-final__arch--3" />
            <span className="sv4-cta-final__arch sv4-cta-final__arch--2" />
            <span className="sv4-cta-final__arch sv4-cta-final__arch--1" />
            <span className="sv4-cta-final__spark sv4-cta-final__spark--a" />
            <span className="sv4-cta-final__spark sv4-cta-final__spark--b" />
            <span className="sv4-cta-final__spark sv4-cta-final__spark--c" />
            <span className="sv4-cta-final__spark sv4-cta-final__spark--d" />
            <span className="sv4-cta-final__spark sv4-cta-final__spark--e" />
            <span className="sv4-cta-final__spark sv4-cta-final__spark--f" />
          </div>
          <div className="sv4-cta-final__inner">
            <p className="sv4-cta-final__kicker">Franchissez le seuil</p>
            <h2>Trouvez la pièce qui manque à votre intérieur</h2>
            <Link href="/galerie" className="sv4-hero__btn-primary sv4-cta-final__btn">
              Voir le catalogue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="sv4-footer">
        <div className="sv4-wrap">
          <div className="sv4-footer__grid">
            <div className="sv4-footer__brand">
              <div className="sv4-nav__wordmark" style={{ fontSize: '18px' }}>Seconde Vie</div>
              <p>Atelier de restauration de mobilier vintage. Nous offrons une seconde vie aux meubles d'hier pour les intérieurs d'aujourd'hui.</p>
              <div className="sv4-footer__socials">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">Pinterest</a>
              </div>
            </div>
            <div className="sv4-footer__col">
              <h4>Catalogue</h4>
              <div className="sv4-footer__links">
                <Link href="/galerie?category=assises">Assises</Link>
                <Link href="/galerie?category=tables">Tables</Link>
                <Link href="/galerie?category=rangement">Rangements</Link>
                <Link href="/galerie">Nouveautés</Link>
              </div>
            </div>
            <div className="sv4-footer__col">
              <h4>Atelier</h4>
              <div className="sv4-footer__links">
                <Link href="/a-propos">Notre approche</Link>
                <Link href="/devis">Restauration sur-mesure</Link>
                <Link href="/livraison">Livraison & Retours</Link>
                <Link href="/faq">FAQ</Link>
              </div>
            </div>
            <div className="sv4-footer__col">
              <h4>Légal</h4>
              <div className="sv4-footer__links">
                <Link href="/cgv">Conditions Générales</Link>
                <Link href="/confidentialite">Politique de confidentialité</Link>
                <Link href="/mentions-legales">Mentions légales</Link>
                <Link href="/contact">Contact</Link>
              </div>
            </div>
          </div>
          <div className="sv4-footer__bottom">
            <p>&copy; {new Date().getFullYear()} Seconde Vie. Tous droits réservés.</p>
            <p>Atelier basé en Provence</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
