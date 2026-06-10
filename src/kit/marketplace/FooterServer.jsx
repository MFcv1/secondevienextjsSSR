import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Facebook,
  Instagram,
  Landmark,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import { getCategoryUrl } from '../../utils/slug';

const DEFAULT_CONTACT = {
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'contact@secondevie-marseille.fr',
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+33 6 12 34 56 78',
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || 'Marseille, France',
  instagram: KIT_CONFIG.socialLinks.instagram,
  facebook: KIT_CONFIG.socialLinks.facebook,
  tiktok: KIT_CONFIG.socialLinks.tiktok,
  footerTitle: KIT_CONFIG.brandName,
  footerSubtitle: KIT_CONFIG.brandTagline,
  legacyText: `2024 ${KIT_CONFIG.brandName} par Anais. Tous droits reserves.`,
};

const benefitItems = [
  { icon: Leaf, title: 'Seconde main, premier choix', text: 'Des meubles uniques, chines et renoves avec soin.' },
  { icon: ShieldCheck, title: 'Paiement securise', text: 'Vos transactions sont protegees et 100% securisees.' },
  { icon: Truck, title: 'Livraison a Marseille', text: 'Livraison rapide et soignee a domicile.' },
  { icon: RotateCcw, title: 'Satisfait ou rembourse', text: "Vous avez 14 jours pour changer d'avis en toute tranquillite." },
];

const sections = [
  {
    title: 'La Galerie',
    links: [
      ['Nouveautes', '/galerie#gallery-pieces', true],
      ['Meubles', getCategoryUrl('meubles'), true],
      ['Assises', getCategoryUrl('assises'), true],
      ['Eclairage', getCategoryUrl('eclairage'), true],
      ['Decorations', getCategoryUrl('decorations'), true],
      ['Petits prix', '/galerie#gallery-small-prices', true, true],
    ],
  },
  {
    title: 'A propos',
    links: [
      ['Notre histoire', '/a-propos'],
      ['Nos valeurs', '/a-propos#valeurs'],
      ['Atelier & Renovations', '/a-propos#atelier'],
      ['Livraison', '/devis'],
      ['FAQ', '/#faq'],
      ['Contact', '/devis'],
    ],
  },
  {
    title: 'Mon compte',
    links: [
      ['Se connecter', '/admin'],
      ['Creer un compte', '/wishlist'],
      ['Mes commandes', '/mes-commandes'],
      ['Mes favoris', '/wishlist'],
      ['Mes annonces', '/admin'],
      ['Vendre un objet', '/devis'],
    ],
  },
  {
    title: "Besoin d'aide ?",
    links: [
      ["Centre d'aide", '/devis'],
      ['Livraison & Retours', '/devis'],
      ['Paiement securise', '/checkout'],
      ["Conditions d'utilisation", '/devis'],
      ['Politique de confidentialite', '/devis'],
      ['CGV', '/devis'],
    ],
  },
];

const PaymentChip = ({ children, variant = 'light', className = '' }) => {
  const variants = {
    light: 'border-stone-200 bg-white text-stone-950 dark:border-[#3a332b] dark:bg-white dark:text-stone-950',
    dark: 'border-[#3b3835] bg-[#2a2826] text-white',
    paypal: 'border-[#064fa8] bg-[#064fa8] text-white',
    bank: 'border-[#3f3b37] bg-[#34312e] text-white',
    wero: 'border-[#095cae] bg-[#095cae] text-white',
  };
  return (
    <div className={`flex h-8 min-w-0 items-center justify-center rounded-[5px] border px-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const SectionTitle = ({ children, darkMode }) => (
  <div className="space-y-4">
    <h3 className={`font-serif text-[15px] uppercase tracking-normal ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>{children}</h3>
    <div className={`h-px w-9 ${darkMode ? 'bg-stone-600' : 'bg-[#c9ad91]'}`} />
  </div>
);

const FooterLink = ({ children, href, highlight = false, showArrow = false, darkMode }) => (
  <a className={`group flex w-fit max-w-full items-center justify-between gap-5 text-sm leading-none transition-colors ${darkMode ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-stone-950'}`} href={href}>
    <span>{children}</span>
    {highlight ? <span className="text-base leading-none text-orange-500">v</span> : null}
    {showArrow ? <ArrowRight size={13} className="opacity-70 transition-transform group-hover:translate-x-1" /> : null}
  </a>
);

const MapFrame = ({ darkMode, address }) => {
  const directionUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'Marseille, France')}`;
  return (
    <div className={`relative overflow-hidden rounded-xl border ${darkMode ? 'border-[#514537] bg-[#151515]' : 'border-[#eee6dd] bg-white'}`}>
      <a
        href={directionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center transition-colors ${darkMode ? 'bg-[#151515] text-[#f8f2ea] hover:bg-[#1d1b18]' : 'bg-[#f7f1ea] text-stone-950 hover:bg-[#f2e9df]'}`}
      >
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${darkMode ? 'bg-[#24211d]' : 'bg-white'}`}>
          <MapPin size={25} strokeWidth={1.7} />
        </span>
        <span className="font-serif text-xl">Notre atelier a Marseille</span>
        <span className="text-[11px] font-black uppercase tracking-[0.16em] opacity-65">Ouvrir la carte</span>
      </a>
    </div>
  );
};

export default function FooterServer({ darkMode = false, contactInfo: contactInfoOverride } = {}) {
  const contactInfo = { ...DEFAULT_CONTACT, ...(contactInfoOverride || {}) };
  const email = contactInfo.email || DEFAULT_CONTACT.email;
  const phone = contactInfo.phone || DEFAULT_CONTACT.phone;
  const address = contactInfo.address || DEFAULT_CONTACT.address;
  const brandName = contactInfo.footerTitle || KIT_CONFIG.brandName;
  const brandTagline = contactInfo.footerSubtitle || KIT_CONFIG.brandTagline;
  const copyright = contactInfo.legacyText || DEFAULT_CONTACT.legacyText;
  const directionUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <footer
      className={`relative z-10 w-full px-3 pb-6 pt-10 transition-colors duration-500 md:px-6 md:pb-8 ${darkMode ? 'bg-[#111] text-[#f4eee6]' : 'bg-[#fbfaf8] text-stone-950'}`}
      data-footer-mounted="true"
    >
      <div className="mx-auto grid w-full max-w-[430px] gap-4 md:hidden">
        <div className={`rounded-[24px] border p-6 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
          <h3 className={`font-serif text-[15px] uppercase tracking-normal ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Notre atelier a Marseille</h3>
          <div className="mt-4 h-[220px]"><MapFrame darkMode={darkMode} address={address} /></div>
          <div className={`mt-4 grid divide-y text-sm ${darkMode ? 'divide-[#211f1b] text-[#ded6cc]' : 'divide-[#eee6dd] text-stone-700'}`}>
            <a href={directionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-4 py-3"><MapPin size={17} className="mt-0.5 shrink-0" /><span><span className="block">{address}</span><span className="block text-xs opacity-70">Quartier du Panier, 13002</span></span></a>
            <a href={`mailto:${email}`} className="flex items-center gap-4 py-3"><Mail size={17} /> <span className="break-all">{email}</span></a>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-4 py-3"><Phone size={17} /> <span>{phone}</span></a>
            <div className="flex items-center gap-4 py-3"><Clock size={17} /> <span>Lun - Sam : 10h - 19h</span></div>
          </div>
        </div>
      </div>

      <div className={`mx-auto hidden w-full max-w-[1760px] overflow-hidden rounded-[18px] border shadow-sm md:block ${darkMode ? 'border-[#2e2a25] bg-[#111110] shadow-black/20' : 'border-[#eee6dd] bg-[#fdfbf8] shadow-stone-200/50'}`}>
        <div className={`grid grid-cols-1 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0 ${darkMode ? 'divide-[#3a332b]' : 'divide-[#eee6dd]'}`}>
          {benefitItems.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-6 px-7 py-8 md:px-10">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc]' : 'bg-[#f3eee7] text-stone-950'}`}>
                <Icon size={30} strokeWidth={1.6} />
              </div>
              <div className="space-y-3">
                <p className={`font-serif text-[16px] font-semibold leading-tight ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>{title}</p>
                <p className={`max-w-[240px] text-sm leading-7 ${darkMode ? 'text-[#d4ccc1]' : 'text-stone-600'}`}>{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`border-t px-7 py-12 md:px-10 md:py-14 xl:px-12 2xl:px-14 ${darkMode ? 'border-[#2e2a25]' : 'border-[#eee6dd]'}`}>
          <div className="grid grid-cols-1 gap-11 lg:grid-cols-[minmax(280px,0.9fr)_minmax(180px,0.55fr)_minmax(180px,0.55fr)] lg:gap-x-10 lg:gap-y-10 xl:grid-cols-[205px_100px_120px_120px_145px_minmax(330px,1fr)] xl:gap-x-4 xl:gap-y-9 2xl:grid-cols-[240px_140px_150px_155px_190px_minmax(420px,520px)] 2xl:gap-9">
            <div className="space-y-9 lg:row-span-2 xl:row-span-1 xl:space-y-8 2xl:space-y-9">
              <Link href="/" prefetch={false} className="group inline-flex items-center gap-5 xl:gap-4 2xl:gap-5">
                <img src="/images/logoanais-320.webp" alt={`${brandName} logo`} loading="lazy" decoding="async" className={`h-16 w-16 rounded-sm object-contain transition-transform group-hover:scale-105 ${darkMode ? 'brightness-0 invert sepia' : 'brightness-0'}`} />
                <span className="flex flex-col">
                  <span className={`font-serif text-3xl leading-none xl:text-2xl 2xl:text-3xl ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>{brandName}<span className="text-orange-500">.</span></span>
                  <span className={`mt-2 font-serif text-base italic ${darkMode ? 'text-[#b7a797]' : 'text-stone-500'}`}>{brandTagline}</span>
                </span>
              </Link>
              <p className={`max-w-[310px] text-sm leading-8 xl:max-w-[240px] xl:leading-7 2xl:max-w-[280px] 2xl:leading-8 ${darkMode ? 'text-[#ded6cc]' : 'text-stone-700'}`}>
                Nous chinons, renovons et selectionnons avec passion des meubles et objets de seconde main pour leur offrir une nouvelle vie et sublimer votre interieur.
              </p>
              <div className="flex items-center gap-4">
                <a href={contactInfo.instagram || '#'} aria-label="Instagram" className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}><Instagram size={19} /></a>
                <a href={contactInfo.facebook || '#'} aria-label="Facebook" className={`flex h-11 w-11 items-center justify-center rounded-full transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}><Facebook size={19} /></a>
                <a href="/galerie#gallery-pieces" aria-label="Pinterest" className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc] hover:bg-[#2b2823]' : 'bg-[#f3eee7] text-stone-950 hover:bg-[#ece3d8]'}`}>p</a>
              </div>
            </div>

            {sections.map((section) => (
              <nav key={section.title} className="space-y-7 2xl:space-y-9">
                <SectionTitle darkMode={darkMode}>{section.title}</SectionTitle>
                <div className="space-y-5 2xl:space-y-6">
                  {section.links.map(([label, href, showArrow, highlight]) => (
                    <FooterLink key={label} href={href} showArrow={showArrow} highlight={highlight} darkMode={darkMode}>{label}</FooterLink>
                  ))}
                </div>
              </nav>
            ))}

            <div className="min-w-0 w-full max-w-[680px] justify-self-end space-y-5 lg:col-span-3 xl:col-span-1 xl:col-start-auto xl:max-w-none 2xl:max-w-[560px]">
              <h3 className={`font-serif text-[15px] uppercase tracking-normal ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Notre atelier a Marseille</h3>
              <div className="h-[240px] xl:h-[260px]"><MapFrame darkMode={darkMode} address={address} /></div>
              <div className={`rounded-lg border px-5 py-4 xl:px-6 ${darkMode ? 'border-[#514537] bg-[#121110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
                <div className={`grid gap-0 divide-y text-sm ${darkMode ? 'divide-[#211f1b] text-[#ded6cc]' : 'divide-[#eee6dd] text-stone-700'}`}>
                  <a href={directionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-5 py-4 transition-colors hover:text-orange-500"><MapPin size={18} className="mt-0.5 shrink-0" /><span><span className={`block ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>{address}</span><span className="mt-1 block text-xs opacity-70">Quartier du Panier, 13002</span></span></a>
                  <a href={`mailto:${email}`} className="flex items-center gap-5 py-4 transition-colors hover:text-orange-500"><Mail size={18} className="shrink-0" /><span className="break-words text-[13px]">{email}</span></a>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-5 py-4 transition-colors hover:text-orange-500"><Phone size={18} className="shrink-0" /><span>{phone}</span></a>
                  <div className="flex items-center gap-5 py-4"><Clock size={18} className="shrink-0" /><span>Lun - Sam : 10h - 19h</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t px-7 py-9 md:px-10 xl:px-12 2xl:px-14 ${darkMode ? 'border-[#2e2a25]' : 'border-[#eee6dd]'}`}>
          <div className={`grid gap-9 divide-y lg:grid-cols-[0.95fr_1.25fr_0.95fr] lg:divide-x lg:divide-y-0 xl:grid-cols-[0.95fr_1.35fr_0.95fr] ${darkMode ? 'divide-[#3a332b]' : 'divide-[#eee6dd]'}`}>
            <div className="space-y-6 lg:pr-0 xl:pr-8">
              <h3 className={`font-serif text-[15px] uppercase ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Moyens de paiement acceptes</h3>
              <div className="flex flex-wrap gap-2">
                <PaymentChip><span className="text-[13px] font-black italic tracking-normal text-[#1434cb]">VISA</span></PaymentChip>
                <PaymentChip variant="dark"><span className="text-[12px] font-semibold">Apple Pay</span></PaymentChip>
                <PaymentChip><span className="text-[12px] font-semibold text-[#5f6368]">Google Pay</span></PaymentChip>
                <PaymentChip variant="paypal"><span className="text-[13px] font-black italic tracking-normal">PayPal</span></PaymentChip>
                <PaymentChip variant="bank" className="gap-2"><Landmark size={13} strokeWidth={1.8} /><span className="text-[11px] font-black uppercase tracking-[0.08em]">Virement</span></PaymentChip>
                <PaymentChip variant="wero"><span className="text-[13px] font-black lowercase tracking-normal">wero</span></PaymentChip>
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-center pt-8 lg:px-6 lg:pt-0 xl:px-8">
              <img src={darkMode ? '/images/footer-delivery-dark.webp' : '/images/footer-delivery-light.webp'} alt="Livraison partout a Marseille" loading="lazy" decoding="async" className="w-full max-w-[520px] rounded-md object-contain xl:max-w-[600px]" />
            </div>
            <div className="space-y-7 pt-8 lg:pl-8 lg:pt-0 xl:pl-10">
              <div className="flex items-center gap-5"><BadgeCheck size={28} strokeWidth={1.6} /><h3 className={`font-serif text-[15px] uppercase ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Site securise</h3></div>
              <div className={`flex flex-wrap gap-x-5 gap-y-4 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                <div className="flex min-w-[86px] items-center gap-3"><LockKeyhole size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} /><span>SSL<br />Secure</span></div>
                <div className="flex min-w-[96px] items-center gap-3"><span className="rounded bg-[#168b8f] px-2 py-1.5 text-sm font-black text-white">PCI</span><span>DSS<br />Compliant</span></div>
                <div className="flex min-w-[88px] items-center gap-3"><ShieldCheck size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} /><span>3D<br />Secure</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t px-7 py-6 md:px-12 xl:px-14 ${darkMode ? 'border-[#2e2a25] bg-[#121110]' : 'border-[#eee6dd] bg-[#fbfaf8]'}`}>
          <div className="flex flex-col gap-6 text-sm lg:flex-row lg:items-center lg:justify-between">
            <p className={darkMode ? 'text-stone-500' : 'text-stone-600'}>© {copyright}</p>
            <div className={`flex flex-wrap gap-x-7 gap-y-3 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              <a href="/devis" className="hover:text-orange-500">Mentions legales</a>
              <a href="/devis" className="hover:text-orange-500">CGV</a>
              <a href="/devis" className="hover:text-orange-500">Politique de confidentialite</a>
              <a href="/devis" className="hover:text-orange-500">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
