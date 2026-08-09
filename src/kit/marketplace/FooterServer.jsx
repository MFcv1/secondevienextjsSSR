import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Facebook,
  Instagram,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import { getCategoryUrl } from '../../utils/slug';
import FooterBackToTopButtonIsland from './FooterBackToTopButtonIsland';
import FooterMapFrameIsland from './FooterMapFrameIsland';

const DEFAULT_CONTACT = {
  email: KIT_CONFIG.contact.email,
  phone: KIT_CONFIG.contact.phone,
  address: KIT_CONFIG.contact.address || 'Marseille, France',
  addressDetails: KIT_CONFIG.contact.addressDetails,
  openingHours: KIT_CONFIG.contact.openingHours,
  instagram: KIT_CONFIG.socialLinks.instagram,
  facebook: KIT_CONFIG.socialLinks.facebook,
  tiktok: KIT_CONFIG.socialLinks.tiktok,
  footerTitle: KIT_CONFIG.brandName,
  footerSubtitle: KIT_CONFIG.brandTagline,
  legacyText: `${new Date().getFullYear()} ${KIT_CONFIG.brandName} par Anais. Tous droits reserves.`,
};

const benefitItems = [
  { icon: Leaf, title: 'Seconde main, premier choix', text: 'Des meubles uniques, chines et renoves avec soin.' },
  { icon: ShieldCheck, title: 'Paiement via Stripe', text: 'Les moyens eligibles sont affiches au moment du paiement.' },
  { icon: Truck, title: 'Livraison ou retrait', text: 'Les options et leur tarif sont confirmes avant paiement.' },
  { icon: BadgeCheck, title: 'Piece reelle', text: "Les photos et la description presentent l'exemplaire propose." },
];

const sections = [
  {
    title: 'La Galerie',
    links: [
      ['Nouveautes', '/#gallery-pieces', true],
      ['Meubles', getCategoryUrl('meubles'), true],
      ['Assises', getCategoryUrl('assises'), true],
      ['Eclairage', getCategoryUrl('eclairage'), true],
      ['Decorations', getCategoryUrl('decorations'), true],
      ['Petits prix', '/#gallery-small-prices', true, true],
    ],
  },
  {
    title: 'A propos',
    links: [
      ['Notre histoire', '/a-propos'],
      ['Nos valeurs', '/a-propos#valeurs'],
      ['Atelier & Renovations', '/a-propos#atelier'],
      ['Livraison', '/devis'],
      ['Contact', '/devis'],
    ],
  },
  {
    title: 'Mon compte',
    links: [
      ['Se connecter', '/mes-commandes'],
      ['Creer un compte', '/mes-commandes'],
      ['Mes commandes', '/mes-commandes'],
      ['Liste de souhaits', '/wishlist'],
      ['Vendre un objet', '/devis'],
    ],
  },
  {
    title: "Besoin d'aide ?",
    links: [
      ['Nous contacter', '/devis'],
      ['Livraison', '/devis'],
    ],
  },
];

const isExternalHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());
const isLegalHref = (value) => /^(?:https?:\/\/|\/)/i.test(String(value || '').trim());

const PaymentChip = ({ children, variant = 'light', className = '' }) => {
  const variants = {
    light: 'border-stone-200 bg-white text-stone-950 dark:border-[#3a332b] dark:bg-white dark:text-stone-950',
    muted: 'border-stone-200 bg-stone-100 text-stone-600 dark:border-[#3a332b] dark:bg-[#2a2826] dark:text-stone-200',
  };
  return (
    <div className={`flex h-8 min-w-0 items-center justify-center rounded-[5px] border px-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const MastercardLogo = () => (
  <svg viewBox="0 0 52 32" className="h-[22px] w-9" aria-hidden="true">
    <circle cx="20" cy="16" r="12" fill="#EB001B" />
    <circle cx="32" cy="16" r="12" fill="#F79E1B" />
    <path d="M26 7.4a12 12 0 0 1 0 17.2 12 12 0 0 1 0-17.2Z" fill="#FF5F00" />
  </svg>
);

const SectionTitle = ({ children, darkMode }) => (
  <div className="space-y-4">
    <h3 className={`font-serif text-[15px] uppercase tracking-normal ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>{children}</h3>
    <div className={`h-px w-9 ${darkMode ? 'bg-stone-600' : 'bg-[#c9ad91]'}`} />
  </div>
);

const FooterLink = ({ children, href, highlight = false, showArrow = false, darkMode }) => (
  <Link prefetch={false} className={`group flex w-fit max-w-full items-center justify-between gap-5 text-sm leading-none transition-colors ${darkMode ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-stone-950'}`} href={href}>
    <span>{children}</span>
    {highlight ? <span className="text-base leading-none text-orange-500">v</span> : null}
    {showArrow ? <ArrowRight size={13} className="opacity-70 transition-transform group-hover:translate-x-1" /> : null}
  </Link>
);

export default function FooterServer({ darkMode = false, contactInfo: contactInfoOverride } = {}) {
  const contactInfo = { ...DEFAULT_CONTACT, ...(contactInfoOverride || {}) };
  const email = String(contactInfo.email || '').trim();
  const phone = String(contactInfo.phone || '').trim();
  const address = contactInfo.address || DEFAULT_CONTACT.address;
  const addressDetails = String(contactInfo.addressDetails || '').trim();
  const openingHours = String(contactInfo.openingHours || '').trim();
  const brandName = contactInfo.footerTitle || KIT_CONFIG.brandName;
  const brandTagline = contactInfo.footerSubtitle || KIT_CONFIG.brandTagline;
  const copyright = contactInfo.legacyText || DEFAULT_CONTACT.legacyText;
  const directionUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const socialLinks = [
    { label: 'Instagram', href: contactInfo.instagram, icon: <Instagram size={19} /> },
    { label: 'Facebook', href: contactInfo.facebook, icon: <Facebook size={19} /> },
  ];
  const legalLinks = [
    ['Mentions legales', KIT_CONFIG.legalLinks.notice],
    ['CGV', KIT_CONFIG.legalLinks.terms],
    ['Politique de confidentialite', KIT_CONFIG.legalLinks.privacy],
    ['Cookies', KIT_CONFIG.legalLinks.cookies],
  ];

  return (
    <footer
      className={`gallery-deferred-render relative z-10 w-full px-3 pb-6 pt-10 transition-colors duration-500 md:px-6 md:pb-8 ${darkMode ? 'bg-[#111] text-[#f4eee6]' : 'bg-[#fbfaf8] text-stone-950 dark:bg-[#0f0f0e] dark:text-[#f4eee6]'}`}
      data-footer-mounted="true"
    >
      <div className="mx-auto grid w-full max-w-[430px] gap-4 md:hidden">
        <div className={`rounded-[24px] border p-6 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
          <h3 className={`font-serif text-[15px] uppercase tracking-normal ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Notre atelier a Marseille</h3>
          <div className="mt-4 h-[220px]"><FooterMapFrameIsland darkMode={darkMode} address={address} /></div>
          <div className={`mt-4 grid divide-y text-sm ${darkMode ? 'divide-[#211f1b] text-[#ded6cc]' : 'divide-[#eee6dd] text-stone-700'}`}>
            <a href={directionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-4 py-3"><MapPin size={17} className="mt-0.5 shrink-0" /><span><span className="block">{address}</span>{addressDetails ? <span className="block text-xs opacity-70">{addressDetails}</span> : null}</span></a>
            {email ? <a href={`mailto:${email}`} className="flex items-center gap-4 py-3"><Mail size={17} /> <span className="break-all">{email}</span></a> : null}
            {phone ? <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-4 py-3"><Phone size={17} /> <span>{phone}</span></a> : null}
            {openingHours ? <div className="flex items-center gap-4 py-3"><Clock size={17} /> <span>{openingHours}</span></div> : null}
          </div>
        </div>

        <div className={`rounded-[24px] border p-6 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-[#fdfbf8]'}`}>
          <h3 className={`mb-4 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>Paiement</h3>
          <div className={`rounded-xl border px-4 py-3.5 ${darkMode ? 'border-[#2e2a25] bg-[#111110]' : 'border-[#eee6dd] bg-white/45'}`}>
            <div className="mb-3 flex items-center gap-3">
              <LockKeyhole size={18} />
              <div>
                <p className="font-serif text-base">Paiement traite par Stripe</p>
                <p className="text-xs opacity-60">Moyens affiches selon eligibilite</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-8">
              <PaymentChip className="min-w-[52px] px-2.5"><span className="text-[12px] font-black italic tracking-normal text-[#1434cb]">VISA</span></PaymentChip>
              <PaymentChip className="min-w-[50px] px-2"><MastercardLogo /></PaymentChip>
              <PaymentChip variant="muted" className="px-2.5"><span className="text-[10px] font-bold uppercase tracking-wide">Autres selon Stripe</span></PaymentChip>
            </div>
          </div>
          <img
            src={darkMode ? '/images/footer-delivery-dark.webp' : '/images/footer-delivery-light.webp'}
            alt="Livraison et retrait autour de Marseille"
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="mt-6 w-full rounded-md object-contain"
          />
          <div className={`mt-5 grid grid-cols-3 gap-3 text-[10px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            <div className="flex flex-col items-center gap-1 text-center"><LockKeyhole size={22} />Connexion<br />chiffree</div>
            <div className="flex flex-col items-center gap-1 text-center"><BadgeCheck size={22} />Moyens<br />eligibles</div>
            <div className="flex flex-col items-center gap-1 text-center"><ShieldCheck size={22} />Total<br />confirme</div>
          </div>
        </div>

        <FooterBackToTopButtonIsland darkMode={darkMode} />
      </div>

      <div className={`mx-auto hidden w-full max-w-[1760px] overflow-hidden rounded-[18px] border md:block ${darkMode ? 'border-[#d5b58d]/8 bg-[#111110] shadow-[0_24px_70px_-62px_rgba(0,0,0,0.8)]' : 'border-[#eee6dd] bg-[#fdfbf8] shadow-sm shadow-stone-200/50 dark:border-[#d5b58d]/8 dark:bg-[#111110] dark:shadow-[0_24px_70px_-62px_rgba(0,0,0,0.8)]'}`}>
        <div className={`grid grid-cols-1 divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0 ${darkMode ? 'divide-[#d5b58d]/10' : 'divide-[#eee6dd] dark:divide-[#d5b58d]/10'}`}>
          {benefitItems.map(({ icon: Icon, title, text }) => (
            <div key={title} className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-6 px-7 py-8 md:px-10">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white/[0.045] text-[#d8c6b2]' : 'bg-[#f3eee7] text-stone-950 dark:bg-white/[0.045] dark:text-[#d8c6b2]'}`}>
                <Icon size={26} strokeWidth={1.55} />
              </div>
              <div className="space-y-2 pt-0.5">
                <p className={`font-serif text-[16px] font-semibold leading-tight ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950 dark:text-[#f8f2ea]'}`}>{title}</p>
                <p className={`max-w-[250px] text-sm leading-7 ${darkMode ? 'text-[#d4ccc1]/78' : 'text-stone-600 dark:text-[#d4ccc1]/78'}`}>{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`border-t px-7 py-12 md:px-10 md:py-14 xl:px-12 2xl:px-14 ${darkMode ? 'border-[#d5b58d]/8' : 'border-[#eee6dd] dark:border-[#d5b58d]/8'}`}>
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
                {socialLinks.map(({ label, href, icon }) => {
                  const className = `flex h-11 w-11 items-center justify-center rounded-full transition-all ${darkMode ? 'bg-[#211f1b] text-[#f2e8dc]' : 'bg-[#f3eee7] text-stone-950'}`;
                  return isExternalHttpUrl(href) ? (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`${className} hover:-translate-y-1`}>{icon}</a>
                  ) : (
                    <span key={label} aria-label={`${label} bientot disponible`} aria-disabled="true" className={`${className} opacity-55`}>{icon}</span>
                  );
                })}
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
              <div className="h-[240px] xl:h-[260px]"><FooterMapFrameIsland darkMode={darkMode} address={address} /></div>
              <div className={`rounded-lg border px-5 py-4 xl:px-6 ${darkMode ? 'border-[#d5b58d]/12 bg-[#121110]' : 'border-[#eee6dd] bg-[#fdfbf8] dark:border-[#d5b58d]/12 dark:bg-[#121110]'}`}>
                <div className={`grid gap-0 divide-y text-sm ${darkMode ? 'divide-[#211f1b] text-[#ded6cc]' : 'divide-[#eee6dd] text-stone-700'}`}>
                  <a href={directionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-5 py-4 transition-colors hover:text-orange-500"><MapPin size={18} className="mt-0.5 shrink-0" /><span><span className={`block ${darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'}`}>{address}</span>{addressDetails ? <span className="mt-1 block text-xs opacity-70">{addressDetails}</span> : null}</span></a>
                  {email ? <a href={`mailto:${email}`} className="flex items-center gap-5 py-4 transition-colors hover:text-orange-500"><Mail size={18} className="shrink-0" /><span className="break-words text-[13px]">{email}</span></a> : null}
                  {phone ? <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-5 py-4 transition-colors hover:text-orange-500"><Phone size={18} className="shrink-0" /><span>{phone}</span></a> : null}
                  {openingHours ? <div className="flex items-center gap-5 py-4"><Clock size={18} className="shrink-0" /><span>{openingHours}</span></div> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t px-7 py-9 md:px-10 xl:px-12 2xl:px-14 ${darkMode ? 'border-[#d5b58d]/8' : 'border-[#eee6dd] dark:border-[#d5b58d]/8'}`}>
          <div className={`grid gap-9 divide-y lg:grid-cols-[0.95fr_1.25fr_0.95fr] lg:divide-x lg:divide-y-0 xl:grid-cols-[0.95fr_1.35fr_0.95fr] ${darkMode ? 'divide-[#d5b58d]/10' : 'divide-[#eee6dd] dark:divide-[#d5b58d]/10'}`}>
            <div className="space-y-6 lg:pr-0 xl:pr-8">
              <h3 className={`font-serif text-[15px] uppercase ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Paiement via Stripe</h3>
              <div className="flex flex-wrap gap-2">
                <PaymentChip><span className="text-[13px] font-black italic tracking-normal text-[#1434cb]">VISA</span></PaymentChip>
                <PaymentChip className="min-w-[52px] px-2"><MastercardLogo /></PaymentChip>
                <PaymentChip variant="muted"><span className="text-[10px] font-bold uppercase tracking-wide">Autres selon eligibilite</span></PaymentChip>
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-center pt-8 lg:px-6 lg:pt-0 xl:px-8">
              <img
                src={darkMode ? '/images/footer-delivery-dark.webp' : '/images/footer-delivery-light.webp'}
                alt="Livraison et retrait autour de Marseille"
                width={1536}
                height={1024}
                loading="lazy"
                decoding="async"
                className="w-full max-w-[520px] rounded-md object-contain xl:max-w-[600px]"
              />
            </div>
            <div className="space-y-7 pt-8 lg:pl-8 lg:pt-0 xl:pl-10">
              <div className="flex items-center gap-5"><BadgeCheck size={28} strokeWidth={1.6} /><h3 className={`font-serif text-[15px] uppercase ${darkMode ? 'text-stone-100' : 'text-stone-950'}`}>Paiement transparent</h3></div>
              <div className={`flex flex-wrap gap-x-5 gap-y-4 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                <div className="flex min-w-[86px] items-center gap-3"><LockKeyhole size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} /><span>Connexion<br />chiffree</span></div>
                <div className="flex min-w-[96px] items-center gap-3"><BadgeCheck size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} /><span>Moyens affiches<br />selon eligibilite</span></div>
                <div className="flex min-w-[88px] items-center gap-3"><ShieldCheck size={30} className={darkMode ? 'text-[#f8f2ea]' : 'text-stone-950'} /><span>Total confirme<br />avant paiement</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t px-7 py-6 md:px-12 xl:px-14 ${darkMode ? 'border-[#d5b58d]/8 bg-[#121110]' : 'border-[#eee6dd] bg-[#fbfaf8] dark:border-[#d5b58d]/8 dark:bg-[#121110]'}`}>
          <div className="flex flex-col gap-6 text-sm lg:flex-row lg:items-center lg:justify-between">
            <p className={darkMode ? 'text-stone-500' : 'text-stone-600'}>© {copyright}</p>
            <div className={`flex flex-wrap gap-x-7 gap-y-3 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              {legalLinks.map(([label, href]) => (
                isLegalHref(href) ? (
                  <a key={label} href={href} className="hover:text-orange-500">{label}</a>
                ) : (
                  <span key={label} aria-label={`${label} bientot disponible`} className="opacity-60">{label}</span>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
