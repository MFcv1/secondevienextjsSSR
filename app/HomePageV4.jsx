import React from 'react';
import Link from 'next/link';
import HomeMotionIslandV4 from './HomeMotionIslandV4';
import AtelierStickyIsland from './AtelierStickyIsland';
import HeroVideoSliderIsland from './HeroVideoSliderIsland';
import '../src/home-v4.css';

/**
 * Helper to split text into words wrapped in spans for GSAP / CSS animation
 */
function SplitText({ text }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span className="sv4-split-word" key={`${word}-${i}`}>
          <span style={{ '--i': i }}>{word}</span>
        </span>
      ))}
    </>
  );
}

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
    <div className="sv4">
      {/* Motion & Scroll triggers */}
      <HomeMotionIslandV4 />

      {/* ─── NAV ─── */}
      <nav className="sv4-nav">
        <div className="sv4-nav__inner">
          <Link href="/" className="sv4-nav__logo" aria-label="Seconde Vie - Retour à l'accueil">
            <img src="/images/logoanais.png" alt="Seconde Vie" />
            <span className="sv4-nav__logo-text">Seconde Vie</span>
          </Link>
          
          <div className="sv4-nav__center">
            <Link href="/galerie" className="sv4-nav__link">
              <span>Galerie</span>
            </Link>
            <Link href="/a-propos" className="sv4-nav__link">
              <span>Atelier</span>
            </Link>
            <Link href="/devis" className="sv4-nav__link">
              <span>Restauration</span>
            </Link>
          </div>

          <div className="sv4-nav__right">
            <Link href="/galerie" className="sv4-nav__cta sv4-btn-reveal">
              <span className="sv4-btn-text-mask">
                <span className="sv4-btn-text-inner" data-text="Catalogue">Catalogue</span>
              </span>
              <svg className="sv4-btn-icon-flat" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ─── HERO ─── */}
        <header className="sv4-hero" data-nav-theme="dark">
          <HeroVideoSliderIsland />
          
          <div className="sv4-hero__content">
            <h1 className="sv4-hero__title" aria-label="Donner une nouvelle âme au mobilier d'hier">
              <SplitText text="Donner une nouvelle âme au mobilier d'hier" />
            </h1>
            <p className="sv4-hero__sub sv4-reveal">
              Nous chinons, restaurons et sublimons des pièces de caractère. Un artisanat d'art en Provence, pour un intérieur qui a du sens.
            </p>
            <div className="sv4-hero__actions sv4-reveal">
              <Link href="/galerie" className="sv4-hero__btn-primary sv4-btn-reveal">
                <span className="sv4-btn-text-mask">
                  <span className="sv4-btn-text-inner" data-text="Découvrir la collection">Découvrir la collection</span>
                </span>
                <svg className="sv4-btn-icon-flat" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/devis" className="sv4-hero__btn-ghost sv4-btn-reveal">
                <span className="sv4-btn-text-mask">
                  <span className="sv4-btn-text-inner" data-text="Confier un meuble">Confier un meuble</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="sv4-hero__scroll-hint">
            <span>Découvrir</span>
            <div className="sv4-hero__scroll-line" />
          </div>
        </header>

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
          
          <div className="sv4-products-grid">
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

        {/* ─── TRUST PILLARS ─── */}
        <section className="sv4-wrap" style={{ marginTop: 'var(--section-gap)' }}>
          <div className="sv4-section-head sv4-reveal">
            <h2>Notre promesse</h2>
          </div>
          
          <div className="sv4-trust">
            <div className="sv4-trust__item">
              <div className="sv4-trust__num">01</div>
              <h3>Pièces Authentiques</h3>
              <p>Pas de reproduction. Chaque meuble est une véritable pièce d'époque, chinée pour son caractère et sa qualité de fabrication originelle.</p>
            </div>
            <div className="sv4-trust__item">
              <div className="sv4-trust__num">02</div>
              <h3>Restauration Durable</h3>
              <p>Des produits respectueux de l'environnement, sans COV, et des techniques d'ébénisterie traditionnelles pour un meuble qui durera encore 50 ans.</p>
            </div>
            <div className="sv4-trust__item">
              <div className="sv4-trust__num">03</div>
              <h3>Prix Justes</h3>
              <p>Un tarif qui reflète le prix d'achat, les heures de travail à l'atelier et la qualité des matériaux de finition. Sans intermédiaire.</p>
            </div>
            <div className="sv4-trust__item">
              <div className="sv4-trust__num">04</div>
              <h3>Livraison Premium</h3>
              <p>Livraison dans toute la France par des transporteurs spécialisés. Votre meuble arrive monté, protégé par des couvertures, directement chez vous.</p>
            </div>
          </div>
        </section>

        {/* ─── REVIEWS ─── */}
        <section className="sv4-wrap" style={{ marginTop: 'var(--section-gap)' }}>
          <div className="sv4-section-head sv4-reveal">
            <h2>Ils nous font confiance</h2>
          </div>
          
          <div className="sv4-reviews">
            <div className="sv4-review-row sv4-reveal">
              <div className="sv4-review-row__stars">★★★★★</div>
              <p className="sv4-review-row__text">"L'enfilade est magnifique, le bois a retrouvé toute sa chaleur. On sent le soin apporté aux moindres détails. Livraison impeccable à Paris."</p>
              <div className="sv4-review-row__author">
                <span className="sv4-review-row__name">Sophie M.</span>
                <span className="sv4-review-row__city">Paris 11e</span>
              </div>
            </div>
            <div className="sv4-review-row sv4-reveal">
              <div className="sv4-review-row__stars">★★★★★</div>
              <p className="sv4-review-row__text">"J'ai confié la vieille commode de ma grand-mère à l'atelier. Le résultat est époustouflant, moderne sans perdre son âme."</p>
              <div className="sv4-review-row__author">
                <span className="sv4-review-row__name">Thomas L.</span>
                <span className="sv4-review-row__city">Aix-en-Provence</span>
              </div>
            </div>
            <div className="sv4-review-row sv4-reveal">
              <div className="sv4-review-row__stars">★★★★★</div>
              <p className="sv4-review-row__text">"Des chaises bistrot parfaites pour mon restaurant. Solides, patinées avec goût. Merci pour le suivi très professionnel."</p>
              <div className="sv4-review-row__author">
                <span className="sv4-review-row__name">Camille B.</span>
                <span className="sv4-review-row__city">Lyon</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DELIVERY ─── */}
        <section className="sv4-wrap" style={{ marginTop: 'var(--section-gap)' }}>
          <div className="sv4-delivery">
            <div className="sv4-delivery__visual sv4-reveal">
              <img src="https://images.unsplash.com/photo-1580130089851-40915655ebf8?auto=format&fit=crop&q=80&w=1000" alt="Emballage meuble" />
            </div>
            <div className="sv4-delivery__text sv4-reveal">
              <h2>Expédition soignée</h2>
              <p>Nous apportons autant de soin à l'emballage de nos meubles qu'à leur restauration. Chaque pièce est filmée, protégée par du carton ondulé et des couvertures renforcées.</p>
              <p>Nous travaillons exclusivement avec un réseau de transporteurs indépendants spécialisés dans le mobilier, assurant une livraison en main propre dans la pièce de votre choix, partout en France métropolitaine et en Europe limitrophe.</p>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="sv4-wrap" style={{ marginTop: 'var(--section-gap)' }}>
          <div className="sv4-section-head sv4-reveal" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <h2>Questions fréquentes</h2>
          </div>
          
          <div className="sv4-faq sv4-reveal">
            <details name="faq">
              <summary>
                <span className="sv4-faq__q">D'où viennent vos meubles ?</span>
                <div className="sv4-faq__toggle" />
              </summary>
              <p className="sv4-faq__a">Nous chinons nos meubles principalement dans le sud de la France, chez des particuliers, lors de successions, ou dans des brocantes professionnelles. Nous privilégions les meubles des années 30 à 70 fabriqués en Europe.</p>
            </details>
            <details name="faq">
              <summary>
                <span className="sv4-faq__q">Quels délais pour une restauration sur-mesure ?</span>
                <div className="sv4-faq__toggle" />
              </summary>
              <p className="sv4-faq__a">Pour un meuble que vous nous confiez, le délai varie de 4 à 8 semaines selon la complexité du travail (décapage, réparations structurelles, finition) et le planning actuel de l'atelier.</p>
            </details>
            <details name="faq">
              <summary>
                <span className="sv4-faq__q">Livrez-vous à l'étage ?</span>
                <div className="sv4-faq__toggle" />
              </summary>
              <p className="sv4-faq__a">Oui, par défaut nos transporteurs livrent en RDC, mais une option "Livraison à l'étage dans la pièce de destination" est toujours proposée lors du devis de transport, souvent effectuée par 2 livreurs.</p>
            </details>
            <details name="faq">
              <summary>
                <span className="sv4-faq__q">Puis-je voir les meubles en vrai ?</span>
                <div className="sv4-faq__toggle" />
              </summary>
              <p className="sv4-faq__a">Notre atelier est situé en Provence et est ouvert aux visites sur rendez-vous. Nous pouvons également organiser des appels vidéo pour vous montrer un meuble sous tous ses angles.</p>
            </details>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="sv4-cta-final sv4-reveal">
          <h2>Trouvez la pièce qui manque à votre intérieur</h2>
          <Link href="/galerie" className="sv4-hero__btn-primary">
            Voir le catalogue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
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
