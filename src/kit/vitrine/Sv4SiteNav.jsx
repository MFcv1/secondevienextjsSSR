import Link from 'next/link';
import MobileNavIsland from '../../../app/MobileNavIsland';

/** Shared home V4 header — desktop pill nav + mobile overlay menu. */
export default function Sv4SiteNav() {
  return (
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
              <span className="sv4-btn-text-inner" data-text="Catalogue">
                Catalogue
              </span>
            </span>
            <svg className="sv4-btn-icon-flat" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <MobileNavIsland />
      </div>
    </nav>
  );
}