import Link from 'next/link';
import { ArrowRight, CreditCard, HeartHandshake, LockKeyhole, Mail, ShieldCheck, Sparkles, Tag, Truck } from 'lucide-react';
import GalleryProductCardServer from './GalleryProductCardServer';
import DeferredGalleryIsland from './DeferredGalleryIsland';

const getPublishedItems = (items) => (
  Array.isArray(items) ? items.filter((item) => item?.status === 'published') : []
);

const getItemPrice = (item) => Number(item?.currentPrice || item?.price || item?.startingPrice || 0);

const SectionLogo = ({ tone }) => {
  const isPrice = tone === 'price';
  return (
    <span
      className={`section-heading-logo relative ml-1 inline-flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[18px] p-[5px] ring-1 shadow-[0_18px_36px_-28px_rgba(28,25,23,0.65)] md:h-[64px] md:w-[64px] md:rounded-[21px] ${
        isPrice ? 'rotate-[4deg] bg-[#F1DDD2] ring-[#B35D3E]/18 dark:bg-[#241711] dark:ring-[#d08a61]/20' : '-rotate-[5deg] bg-[#E5EDE3] ring-[#6E7D61]/18 dark:bg-[#152016] dark:ring-[#9aae84]/18'
      }`}
      aria-hidden="true"
    >
      <span className="absolute -inset-1 rounded-[22px] border border-white/75 dark:border-[#f0d2a5]/16 md:rounded-[25px]" />
      <span className={`relative flex h-full w-full items-center justify-center rounded-[14px] border bg-[#FAFAF9]/82 dark:bg-[#0f0d0a]/86 md:rounded-[17px] ${isPrice ? 'border-[#B35D3E]/28 text-[#9E563F] dark:border-[#d08a61]/28 dark:text-[#d9946f]' : 'border-[#6E7D61]/28 text-[#5F6E55] dark:border-[#9aae84]/24 dark:text-[#a9bd91]'}`}>
        {isPrice ? (
          <svg viewBox="0 0 42 42" className="h-[35px] w-[35px] overflow-visible md:h-[42px] md:w-[42px]" fill="none" aria-hidden="true">
            <path
              d="M21 3.8 25.1 6.7 30 5.6 32.2 10.1 36.8 12 35.9 16.9 39 21 35.9 25.1 36.8 30 32.2 31.9 30 36.4 25.1 35.3 21 38.2 16.9 35.3 12 36.4 9.8 31.9 5.2 30 6.1 25.1 3 21 6.1 16.9 5.2 12 9.8 10.1 12 5.6 16.9 6.7 21 3.8Z"
              fill="currentColor"
              fillOpacity="0.055"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x="21"
              y="27"
              textAnchor="middle"
              className="fill-current font-serif"
              fontSize="20"
              fontWeight="500"
            >
              €
            </text>
          </svg>
        ) : (
          <svg viewBox="0 0 42 42" className="h-[43px] w-[43px] overflow-visible md:h-[50px] md:w-[50px]" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
              <path d="M21 10.2C22.35 16.35 25.65 19.65 31.8 21C25.65 22.35 22.35 25.65 21 31.8C19.65 25.65 16.35 22.35 10.2 21C16.35 19.65 19.65 16.35 21 10.2Z" strokeWidth="2.7" />
              <path d="M21 5.2v4.4M21 32.4v4.4M5.2 21h4.4M32.4 21h4.4" strokeWidth="2.65" />
              <path d="M9.8 9.8 13 13M29 29l3.2 3.2M32.2 9.8 29 13M13 29l-3.2 3.2" strokeWidth="2.65" />
            </g>
          </svg>
        )}
      </span>
    </span>
  );
};

export const SectionHeading = ({ children, tone = 'arrival' }) => (
  <h2 className="group/section-title flex items-center gap-3 font-serif text-4xl leading-none tracking-normal md:gap-4 md:text-5xl">
    <span className="section-heading-copy">{children}</span>
    <SectionLogo tone={tone} />
  </h2>
);

const ProductGridSectionServer = ({
  id,
  className,
  heading,
  items = [],
  badgeLabel,
  darkMode = false,
  hideWhenEmpty = false,
} = {}) => {
  if (hideWhenEmpty && !items.length) return null;

  return (
    <section id={id} className={className}>
      <div className="mb-10 flex items-center justify-between">
        {heading}
        <a href="/galerie#gallery-pieces" className="hidden items-center gap-2 border-b border-transparent font-sans text-[10px] uppercase tracking-widest transition-colors hover:border-current md:flex">
          Voir plus <ArrowRight size={12} />
        </a>
      </div>

      <div className="anim-grid grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
        {items.map((item, index) => (
          <div key={item.id || index} className="product-card-wrap relative">
            {badgeLabel ? (
              <div className="absolute left-2 top-2 z-10 rounded-sm bg-[#d4e1d9] px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-[#2d4033] dark:bg-[#203126]/92 dark:text-[#c8ddca] md:text-[9px]">
                {badgeLabel}
              </div>
            ) : null}
            <GalleryProductCardServer item={item} layoutMode="grid" compact priority={false} />
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center md:hidden">
        <a
          href="/galerie#gallery-pieces"
          className={`flex items-center gap-2 rounded-full px-8 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}
        >
          Voir plus <ArrowRight size={12} />
        </a>
      </div>
    </section>
  );
};

export const getNewestItems = (items, limit = 10) => (
  [...getPublishedItems(items)]
    .sort((a, b) => {
      const orderA = a?.nouveautesOrder !== undefined ? a.nouveautesOrder : 999999;
      const orderB = b?.nouveautesOrder !== undefined ? b.nouveautesOrder : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0);
    })
    .slice(0, limit)
);

export const getSmallPriceItems = (items, limit = 10) => (
  [...getPublishedItems(items)]
    .filter((item) => getItemPrice(item) > 0 && getItemPrice(item) <= 250)
    .sort((a, b) => {
      const orderA = a?.petitsPrixOrder !== undefined ? a.petitsPrixOrder : 999999;
      const orderB = b?.petitsPrixOrder !== undefined ? b.petitsPrixOrder : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return getItemPrice(a) - getItemPrice(b);
    })
    .slice(0, limit)
);

export const ProductArrivalsSectionServer = ({ items, darkMode = false } = {}) => (
  <ProductGridSectionServer
    id="gallery-pieces"
    className="scroll-mt-24 bg-[#FAFAF9] px-4 pb-[48px] pt-7 text-[#181716] transition-colors duration-700 dark:bg-[#080807] dark:text-[#f5efe6] md:px-12 md:py-[60px] lg:px-16"
    heading={<SectionHeading>Nouveautes</SectionHeading>}
    items={getNewestItems(items)}
    badgeLabel="Nouveau"
    darkMode={darkMode}
  />
);

export const ProductSmallPricesSectionServer = ({ items, darkMode = false } = {}) => (
  <ProductGridSectionServer
    id="gallery-small-prices"
    className="bg-[#FAFAF9] px-4 pb-[48px] pt-[60px] text-[#181716] transition-colors duration-700 dark:bg-[#080807] dark:text-[#f5efe6] md:px-12 md:py-[60px] lg:px-16"
    heading={<SectionHeading tone="price">Petits Prix</SectionHeading>}
    items={getSmallPriceItems(items)}
    darkMode={darkMode}
    hideWhenEmpty
  />
);

const reassuranceUnits = [
  { code: '01', Icon: Truck, label: 'Livraison soignee', text: 'Partout en France metropolitaine', meta: 'FRANCE / CAVE' },
  { code: '02', Icon: CreditCard, label: 'Paiement 4x sans frais', text: 'Echelonnez vos paiements facilement', meta: '2X / 3X / FRAIS 0%' },
  { code: '03', Icon: HeartHandshake, label: 'On est la pour vous', text: 'Une equipe humaine a votre ecoute', meta: 'CONSEILS / SUPPORT' },
];

export const ReassuranceSectionServer = ({ darkMode = false } = {}) => (
  <section className={`post-hero-service-section relative hidden overflow-hidden pb-8 pt-4 md:block md:pt-[92px] lg:pt-[92px] ${darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9] dark:bg-[#080807]'}`}>
    <div className="relative mx-auto max-w-[1760px] px-4 py-6 md:px-7 lg:px-8 xl:px-10">
      <div className="relative mx-auto max-w-[1380px]">
        <span className={`pointer-events-none absolute left-1/2 top-0 h-px w-screen -translate-x-1/2 ${darkMode ? 'bg-white/10' : 'bg-stone-200 dark:bg-[#e6c18a]/14'}`} aria-hidden="true" />
        <span className={`pointer-events-none absolute bottom-0 left-1/2 h-px w-screen -translate-x-1/2 ${darkMode ? 'bg-white/10' : 'bg-stone-200 dark:bg-[#e6c18a]/14'}`} aria-hidden="true" />
        <div className="grid items-stretch md:grid-cols-3">
          {reassuranceUnits.map(({ Icon, ...unit }) => (
            <article key={unit.code} className={`post-hero-service-card group relative flex min-h-[172px] flex-col items-center justify-center px-5 py-8 text-center md:min-h-[188px] lg:min-h-[196px] xl:min-h-[206px] 2xl:min-h-[214px] ${darkMode ? 'text-white' : 'text-[#1A1A1A] dark:text-[#f5efe6]'}`}>
              <div className={`flex h-[48px] w-[48px] items-center justify-center border transition-colors duration-300 ${darkMode ? 'border-[#d8ad73]/14 bg-[#15120f] group-hover:border-[#d8ad73]/24' : 'border-stone-300 bg-[#faf9f7] group-hover:border-[#1A1A1A] dark:border-[#e6c18a]/14 dark:bg-[#15120f] dark:text-[#d9c6ad] dark:group-hover:border-[#e6c18a]/24'}`}>
                <Icon size={22} strokeWidth={1.25} />
              </div>
              <div className="mt-6">
                <h4 className="font-sans text-[11px] font-black uppercase leading-none tracking-[0.2em] xl:text-[12px]">{unit.label}</h4>
                <p className={`mx-auto mt-4 max-w-[18rem] font-sans text-[13px] leading-[1.55] ${darkMode ? 'text-stone-400' : 'text-stone-500 dark:text-[#c8bbaa]/72'}`}>{unit.text}</p>
              </div>
              <div className={`post-hero-service-meta mx-auto mt-6 flex min-h-[24px] w-[132px] items-center justify-center gap-2 border px-3 ${darkMode ? 'border-[#d8ad73]/10 bg-[#17130f]/72' : 'border-stone-200 bg-stone-100/60 dark:border-[#e6c18a]/10 dark:bg-[#17130f]/72'}`}>
                <span className="h-[5px] w-[5px] shrink-0 bg-[#c6a27e]" aria-hidden="true" />
                <samp className={`inline-flex min-w-0 flex-1 items-center justify-center text-center font-mono text-[7px] font-bold uppercase leading-none tracking-[0.14em] ${darkMode ? 'text-[#c8bbaa]/50' : 'text-stone-400 dark:text-[#c8bbaa]/50'}`}>{unit.meta}</samp>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const restorationProjects = [
  { title: 'La Commode Oubliee', tag: 'Renovation Complete', desc: 'Sablage delicat et peinture Celadon.', avant: '/images/before-after/avant-gallery.webp', apres: '/images/before-after/apres-gallery.webp' },
  { title: "La Console d'Epoque", tag: 'Sablage & Patine', desc: 'Sublimation du veinage naturel du chene.', avant: '/images/before-after/avantu-gallery.webp', apres: '/images/before-after/apresu-gallery.webp' },
  { title: 'Le Bureau Vintage', tag: 'Reparation & Traitement', desc: 'Consolidation et vernis mat impermeable.', avant: '/images/before-after/avantx-gallery.webp', apres: '/images/before-after/apresx-gallery.webp' },
];

const BeforeAfterSliderPlaceholder = ({ project = restorationProjects[0], darkMode = false } = {}) => (
  <div
    className={`relative min-h-[430px] overflow-hidden rounded-[22px] ring-1 md:min-h-[480px] lg:min-h-[520px] ${
      darkMode ? 'bg-[#14110f] ring-[#3a3027]' : 'bg-[#f6eadb] ring-[#e1ccb4]'
    }`}
    aria-hidden="true"
  >
    <div className="absolute inset-0 grid grid-cols-2">
      <img src={project.avant} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80" />
      <img src={project.apres} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-black/0 to-black/12" />
    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
      <div>
        <p className="font-sans text-[9px] font-black uppercase tracking-[0.22em] text-white/72">{project.tag}</p>
        <p className="mt-2 font-serif text-[28px] leading-none tracking-normal md:text-[34px]">{project.title}</p>
      </div>
      <span className="hidden rounded-full bg-white/14 px-4 py-2 font-sans text-[8px] font-black uppercase tracking-[0.18em] ring-1 ring-white/20 sm:inline-flex">
        Avant / Apres
      </span>
    </div>
  </div>
);

export const BeforeAfterSectionServer = ({ darkMode = false, projects = restorationProjects } = {}) => {
  return (
    <section className={`before-after-industrial relative flex w-full items-center overflow-hidden px-3 py-10 sm:px-5 sm:py-12 md:min-h-[690px] md:px-7 md:py-14 lg:min-h-[760px] lg:px-8 lg:py-16 2xl:min-h-[780px] 2xl:px-10 dark:bg-[#0e0d0c] ${darkMode ? 'bg-[#141210]' : 'bg-[#f8f1e6]'}`}>
      <div className={`pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_76%_32%,rgba(184,132,72,0.13),transparent_31%),radial-gradient(circle_at_20%_72%,rgba(130,148,112,0.09),transparent_34%),linear-gradient(180deg,#0b0a09_0%,#14110f_100%)] ${darkMode ? 'bg-[radial-gradient(circle_at_76%_32%,rgba(184,132,72,0.14),transparent_31%),radial-gradient(circle_at_20%_72%,rgba(130,148,112,0.11),transparent_34%)]' : 'bg-[radial-gradient(circle_at_77%_30%,rgba(188,142,84,0.2),transparent_32%),radial-gradient(circle_at_17%_76%,rgba(135,160,139,0.15),transparent_34%)]'}`} />
      <div className={`relative mx-auto grid w-full max-w-[1480px] overflow-hidden rounded-[26px] p-1 shadow-[0_30px_92px_-68px_rgba(42,31,21,0.76),0_10px_30px_-28px_rgba(103,71,40,0.56)] ring-1 md:rounded-[30px] md:p-1.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(410px,1.05fr)] dark:bg-[#15120f]/95 dark:ring-[#392f27]/80 dark:shadow-[0_30px_92px_-70px_rgba(0,0,0,0.95)] ${darkMode ? 'bg-white/[0.035] ring-[#3a332a]/90' : 'bg-[#fff9ef]/78 ring-[#d7c4ad]/80'}`}>
        <div className={`relative flex min-h-[320px] flex-col justify-center rounded-t-[24px] border-b p-5 sm:min-h-[340px] sm:p-7 md:p-8 lg:min-h-[430px] lg:rounded-l-[26px] lg:rounded-tr-none lg:border-b-0 lg:border-r lg:p-8 xl:p-9 2xl:p-10 dark:border-[#302820] dark:bg-[#181511] ${darkMode ? 'border-[#332b23] bg-[#1d1a16]' : 'border-[#ead8c4] bg-[#fffaf3]'}`}>
          <span className={`inline-flex h-9 w-fit items-center gap-2 rounded-full px-4 font-sans text-[8.5px] font-extrabold uppercase tracking-[0.22em] ring-1 dark:bg-white/[0.055] dark:text-[#d8c6b2] dark:ring-white/12 ${darkMode ? 'bg-white/[0.055] text-[#d8c6b2] ring-white/12' : 'bg-[#fff7ee] text-[#8b5c37] ring-[#d8c5af]'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#b9854f]" />
            Service maison
          </span>
          <h2 className={`mt-6 max-w-[620px] font-serif text-[clamp(2.85rem,7vw,4.75rem)] font-semibold leading-[0.9] tracking-normal lg:mt-7 lg:text-[clamp(3rem,3.8vw,4.55rem)] dark:text-[#fbf2e7] ${darkMode ? 'text-[#fbf2e7]' : 'text-[#1d1914]'}`}>
            <span className="block">Chiner sans</span>
            <span className="block">courir les</span>
            <span className="block">brocantes,</span>
            <span className="block pt-1 font-light italic text-[#b9864f]">c'est possible&nbsp;!</span>
          </h2>
          <p className={`mt-5 max-w-[520px] font-sans text-[13px] leading-[1.6] sm:text-[13.5px] md:text-[14px] dark:text-[#d5c8b9]/78 ${darkMode ? 'text-[#d5c8b9]/78' : 'text-[#5f554a]'}`}>
            On s'occupe de tout pour vous. De la selection a la livraison de nos pepites, decouvrez comment chiner autrement avec Seconde Vie.
          </p>
          <Link href="/a-propos" prefetch={false} className={`mt-6 inline-flex min-h-[48px] w-full max-w-[270px] items-center justify-between rounded-full px-2 pl-5 font-sans text-[8.5px] font-extrabold uppercase tracking-[0.16em] ring-1 transition-all duration-700 sm:min-h-[56px] sm:max-w-[330px] sm:px-2.5 sm:pl-7 sm:text-[10px] dark:bg-[#f8efe2] dark:text-[#18130f] dark:ring-white/20 ${darkMode ? 'bg-[#f8efe2] text-[#18130f] ring-white/20' : 'bg-[#211911] text-[#fff7ec] ring-[#c59b61]/55'}`}>
            <span>On vous explique tout</span>
            <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#302115] text-[#e6bd77] ring-1 ring-[#d7aa63]/45 sm:h-10 sm:w-10">
              <ArrowRight size={14} strokeWidth={1.45} />
            </span>
          </Link>
        </div>

        <div className={`relative flex min-h-full flex-col justify-center gap-4 rounded-b-[24px] p-2 sm:p-4 md:gap-4 md:p-5 lg:rounded-r-[26px] lg:rounded-bl-none lg:p-6 dark:bg-[#181511] ${darkMode ? 'bg-[#1d1a16]' : 'bg-[#fffaf3]'}`}>
          <div>
            <DeferredGalleryIsland type="before-after" projects={projects} darkMode={darkMode} rootMargin="760px 0px" intersectionDelayMs={120}>
              <BeforeAfterSliderPlaceholder project={projects[0]} darkMode={darkMode} />
            </DeferredGalleryIsland>
          </div>
        </div>
      </div>
    </section>
  );
};

const instaPosts = [
  { img: '/images/before-after/apresu-gallery.webp', label: 'Details', title: 'Porte celadon' },
  { img: '/images/before-after/avantu-gallery.webp', label: 'Relooking complet', title: 'Buffet parisien' },
  { img: '/images/before-after/apres-gallery.webp', label: 'Atelier', title: 'Patine douce' },
  { img: '/images/before-after/apresx-gallery.webp', label: 'Avant / Apres', title: 'Meuble restaure' },
  { img: '/images/before-after/avantx-gallery.webp', label: 'Inspiration', title: 'Piece chinee' },
];

const InstagramCarouselPlaceholder = ({ darkMode = false, posts = instaPosts } = {}) => (
  <section
    className="relative isolate min-h-[690px] overflow-hidden px-0 pb-[86px] pt-[48px] md:px-6 md:py-[72px] lg:px-[5vw] lg:py-[78px] xl:py-[86px]"
    aria-hidden="true"
  >
    <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-center text-center">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-px w-8 bg-[#A68A64]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68A64]">Lifestyle & Atelier</span>
        <div className="h-px w-8 bg-[#A68A64]" />
      </div>
      <h2 className={`font-serif text-[38px] leading-[1.02] tracking-normal lg:text-5xl xl:text-6xl ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
        Nous aussi on vous aime
      </h2>
      <div className="relative mt-12 h-[432px] w-full max-w-[1120px] overflow-hidden lg:h-[470px] xl:h-[520px]">
        <div className="absolute inset-x-5 top-0 grid grid-cols-3 gap-5 opacity-95 md:inset-x-10 lg:inset-x-0">
          {posts.slice(0, 3).map((post, index) => (
            <article
              key={post.title}
              className={`overflow-hidden rounded-[22px] shadow-[0_24px_60px_rgba(32,26,20,0.13)] ${
                index === 1 ? 'translate-y-0' : 'translate-y-10 opacity-55'
              } ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                <img src={post.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className={`min-h-[88px] px-4 pb-5 pt-4 text-left ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A68A64]">{post.label}</p>
                <h3 className={`mt-1.5 font-serif text-[20px] leading-tight tracking-normal ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                  {post.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export const InstagramSectionServer = ({ darkMode = false } = {}) => (
  <DeferredGalleryIsland type="instagram" posts={instaPosts} darkMode={darkMode} rootMargin="900px 0px" enableIdleFallback={false} intersectionDelayMs={80}>
    <InstagramCarouselPlaceholder darkMode={darkMode} posts={instaPosts} />
  </DeferredGalleryIsland>
);

const TestimonialsCarouselPlaceholder = ({ darkMode = false } = {}) => (
  <section
    className={`customer-testimonials-section relative z-20 min-h-[520px] w-full overflow-hidden dark:bg-[#0b0a09] dark:text-[#f8f1e8] lg:min-h-[828px] ${
      darkMode ? 'bg-[#0b0a09] text-[#f8f1e8]' : 'bg-white text-[#242221]'
    }`}
    aria-hidden="true"
  >
    <div className="hidden px-8 py-20 lg:block lg:px-12 xl:px-16 xl:py-24">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center px-4 text-center">
          <div className={`relative mb-7 flex items-center gap-2 ${darkMode ? 'text-[#ff9d10]' : 'text-[#ff9200]'}`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Sparkles key={index} size={23} strokeWidth={1.8} />
            ))}
          </div>
          <h2 className="font-serif text-[44px] leading-none tracking-normal">La parole a nos clients.</h2>
          <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-[#a99b8c]' : 'text-[#77716b]'}`}>
            Excellent 4.9/5 - base sur 124 avis Google
          </p>
        </div>
        <div className="mt-12 grid h-[328px] w-full max-w-[1120px] grid-cols-3 gap-6 overflow-hidden xl:h-[352px] xl:max-w-[1240px]">
          {['Sophie L.', 'Caroline V.', 'Julie M.'].map((author, index) => (
            <article
              key={author}
              className={`flex flex-col justify-between rounded-[16px] px-7 py-8 shadow-[0_16px_38px_rgba(69,57,42,0.08)] ${
                index === 1 ? 'bg-[#F2E8D8]' : 'bg-[#F7EEE7] opacity-55'
              } dark:bg-[#1b1814]`}
            >
              <p className="font-serif text-[clamp(18px,1.72vw,24px)] leading-[1.36] tracking-normal">"{author === 'Caroline V.' ? "J'ai pleure en voyant la restauration du vieux chevet." : 'Un travail magnifique et un respect de l ame du meuble.'}"</p>
              <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-[#8c877f]">
                <span className="h-px w-5 bg-[#aaa49b]" />
                {author}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
    <div className="mx-auto flex min-h-[520px] w-full max-w-[430px] flex-col items-center px-0 pb-16 pt-14 lg:hidden">
      <h2 className="px-4 text-center font-serif text-[34px] leading-none tracking-normal">La parole a nos clients.</h2>
      <div className="mt-11 h-[318px] w-full overflow-hidden">
        <article className="mx-auto flex h-[292px] w-[232px] flex-col justify-between rounded-[16px] bg-[#F2E8D8] px-6 py-8 shadow-[0_18px_36px_rgba(69,57,42,0.035)] dark:bg-[#1b1814]">
          <p className="font-serif text-[20px] leading-[1.36] tracking-normal">"Un travail magnifique et un respect de l ame du meuble."</p>
          <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-[#8c877f]">
            <span className="h-px w-5 bg-[#aaa49b]" />
            Sophie L.
          </p>
        </article>
      </div>
    </div>
  </section>
);

export const TestimonialsSectionServer = ({ darkMode = false } = {}) => (
  <DeferredGalleryIsland type="testimonials" darkMode={darkMode} rootMargin="900px 0px" enableIdleFallback={false} intersectionDelayMs={100}>
    <TestimonialsCarouselPlaceholder darkMode={darkMode} />
  </DeferredGalleryIsland>
);

const discountCards = [
  {
    Icon: LockKeyhole,
    toneLabel: 'Liberte',
    accent: '#9B6741',
    soft: '#F8ECE5',
    wash: 'linear-gradient(135deg, rgba(255,248,243,0.96), rgba(248,236,229,0.72))',
    ring: 'rgba(155,103,65,0.18)',
    title: 'Sans engagement',
    text: 'Tu restes libre de te desabonner a tout moment.',
  },
  {
    Icon: Tag,
    toneLabel: 'Primeur',
    accent: '#6E765D',
    soft: '#EEF2E7',
    wash: 'linear-gradient(135deg, rgba(250,250,245,0.96), rgba(238,242,231,0.78))',
    ring: 'rgba(110,118,93,0.18)',
    title: 'Offres en avant-premiere',
    text: "Decouvre nos nouveautes et profite d'offres exclusives.",
  },
  {
    Icon: Mail,
    toneLabel: 'Simple',
    accent: '#A36E55',
    soft: '#F7EAE3',
    wash: 'linear-gradient(135deg, rgba(255,249,244,0.97), rgba(247,234,227,0.76))',
    ring: 'rgba(163,110,85,0.17)',
    title: 'Desinscription facile',
    text: 'Un clic suffit pour ne plus recevoir nos e-mails.',
  },
  {
    Icon: ShieldCheck,
    toneLabel: 'Confiance',
    accent: '#757466',
    soft: '#ECEDE4',
    wash: 'linear-gradient(135deg, rgba(250,249,244,0.97), rgba(236,237,228,0.72))',
    ring: 'rgba(117,116,102,0.18)',
    title: 'Paiement securise',
    text: 'Vos transactions sont protegees et 100% securisees.',
  },
];

export const NewsletterSectionServer = ({ darkMode = false } = {}) => (
  <section className={`discount-section relative flex items-center overflow-hidden px-3 py-10 sm:px-5 sm:py-12 md:min-h-[690px] md:px-7 md:py-14 lg:min-h-[760px] lg:px-8 lg:py-16 2xl:min-h-[780px] 2xl:px-10 dark:bg-[#0e0d0c] ${darkMode ? 'bg-[#141210]' : 'bg-[#f7f1ea]'}`}>
    <div className={`pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_76%_32%,rgba(184,132,72,0.13),transparent_31%),radial-gradient(circle_at_20%_72%,rgba(130,148,112,0.09),transparent_34%),linear-gradient(180deg,#0b0a09_0%,#14110f_100%)] ${darkMode ? 'bg-[radial-gradient(circle_at_76%_32%,rgba(184,132,72,0.14),transparent_31%),radial-gradient(circle_at_20%_72%,rgba(130,148,112,0.11),transparent_34%)]' : 'bg-[radial-gradient(circle_at_17%_22%,rgba(184,144,101,0.13),transparent_31%),radial-gradient(circle_at_84%_78%,rgba(157,102,88,0.08),transparent_34%),linear-gradient(180deg,#fbf8f3_0%,#f3ebe2_100%)]'}`} />
    <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(121,91,61,0.20)_0.7px,transparent_0.7px)] [background-size:11px_11px] dark:opacity-[0.08] dark:[background-image:radial-gradient(rgba(220,176,116,0.18)_0.7px,transparent_0.7px)]" />
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-36 dark:bg-gradient-to-b dark:from-[#0e0d0c] dark:via-[#0e0d0c] dark:to-transparent dark:opacity-80 ${darkMode ? 'bg-gradient-to-b from-[#141210] via-[#141210] to-transparent opacity-80' : 'bg-gradient-to-b from-[#FAFAF9] via-[#f7f1ea] to-transparent'}`} />

    <div className={`discount-shell relative mx-auto w-full max-w-[1480px] overflow-hidden rounded-[26px] p-[1px] shadow-[0_30px_86px_-68px_rgba(37,29,22,0.56),0_10px_30px_-28px_rgba(124,88,55,0.38)] ring-1 dark:bg-[#19140f] dark:ring-[#3a3027]/85 dark:shadow-[0_30px_86px_-72px_rgba(0,0,0,0.96)] ${darkMode ? 'bg-[#19140f] ring-[#3a3027]/85' : 'bg-gradient-to-br from-[#e1d1bd] via-[#fffaf3] to-[#d7c5b2] ring-[#d8c9b6]'}`}>
      <div className={`relative overflow-hidden rounded-[25px] p-1.5 dark:bg-[#181511] dark:shadow-[inset_0_1px_0_rgba(216,173,115,0.035)] ${darkMode ? 'bg-[#1d1a16] shadow-[inset_0_1px_0_rgba(216,173,115,0.035)]' : 'bg-[#fffaf3] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'}`}>
        <div className={`pointer-events-none absolute inset-1.5 rounded-[21px] ring-1 dark:ring-[#d8ad73]/6 ${darkMode ? 'ring-[#d8ad73]/6' : 'ring-[#d9c9b5]'}`} />
        <div className={`relative grid overflow-hidden rounded-[20px] ring-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(370px,0.98fr)] dark:bg-[#181511] dark:ring-[#302820] ${darkMode ? 'bg-[#1d1a16] ring-[#302820]' : 'bg-[#fffdf8] ring-[#e4d7c7]'}`}>
          <div className={`relative flex min-h-[340px] flex-col justify-center overflow-hidden border-b p-5 sm:min-h-[360px] sm:p-7 md:p-8 lg:min-h-[470px] lg:border-b-0 lg:border-r lg:p-9 xl:p-10 2xl:p-12 dark:border-[#302820] dark:bg-[#181511] ${darkMode ? 'border-[#332b23] bg-[#1d1a16]' : 'border-[#e4d7c7] bg-[#fffdf8]'}`}>
            <div className={`pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_90%_14%,rgba(184,132,72,0.11),transparent_26%),radial-gradient(ellipse_at_6%_44%,rgba(101,81,58,0.12),transparent_21%)] ${darkMode ? 'bg-[radial-gradient(circle_at_90%_14%,rgba(184,132,72,0.11),transparent_26%)]' : 'bg-[radial-gradient(circle_at_89%_13%,rgba(166,138,100,0.12),transparent_24%),radial-gradient(ellipse_at_6%_44%,rgba(119,91,61,0.09),transparent_21%)]'}`} />
            <div className="pointer-events-none absolute -left-16 top-28 hidden h-56 w-32 rotate-[-18deg] rounded-full bg-[#5e4b37]/10 blur-2xl dark:bg-[#b9864f]/10 lg:block" />

            <div className="relative flex items-center gap-4">
              <span className={`inline-flex h-8 items-center gap-2 rounded-full px-4 font-sans text-[9px] font-extrabold uppercase tracking-[0.24em] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] ring-1 dark:bg-white/[0.055] dark:text-[#d8c6b2] dark:ring-[#3a332a] ${darkMode ? 'bg-white/[0.055] text-[#d8c6b2] ring-[#3a332a]' : 'bg-[#f5ede3] text-[#8a6646] ring-[#e6d9c9]'}`}>
                <Sparkles size={13} strokeWidth={1.35} aria-hidden="true" />
                Offre exclusive
              </span>
              <span className={`hidden h-px flex-1 sm:block dark:bg-[#5c4a36]/55 ${darkMode ? 'bg-[#5c4a36]/55' : 'bg-[#dfd0be]'}`} />
              <span className={`hidden text-[22px] leading-none sm:block dark:text-[#8a6b48] ${darkMode ? 'text-[#8a6b48]' : 'text-[#b79e7d]'}`} aria-hidden="true">*</span>
            </div>

            <h2 className={`relative mt-7 max-w-[690px] font-serif text-[clamp(2.85rem,4.15vw,4.55rem)] font-medium leading-[0.9] tracking-normal sm:mt-8 lg:mt-9 dark:text-[#f8f1e8] ${darkMode ? 'text-[#f8f1e8]' : 'text-[#191713]'}`}>
              <span className="block">Abonne-toi</span>
              <span className="block">et recois ton</span>
              <span className="mt-1 block md:whitespace-nowrap">
                <span className="italic text-[#9B734A]">code</span> promotionnel
              </span>
            </h2>

            <div className="relative mt-2 flex flex-nowrap items-center gap-x-3 gap-y-2 sm:mt-6 sm:flex-wrap sm:gap-x-4 sm:gap-y-2.5">
              <span className="inline-flex shrink-0 items-baseline font-serif text-[clamp(3.25rem,14vw,4rem)] font-light italic leading-[0.78] tracking-normal text-[#9B734A] sm:translate-y-[-3px] sm:text-[clamp(3.9rem,4.2vw,4.95rem)] lg:translate-y-[-4px]" aria-label="10%">
                <span>10</span>
                <span className="ml-[0.01em] inline-block translate-y-[0.015em] text-[0.82em]">%</span>
              </span>
              <span className={`ml-1.5 h-[32px] w-px shrink-0 translate-y-[5px] sm:ml-0 sm:h-[48px] sm:translate-y-0 dark:bg-[#5c4a36]/65 ${darkMode ? 'bg-[#5c4a36]/65' : 'bg-[rgba(155,115,74,0.35)]'}`} aria-hidden="true" />
              <span className={`translate-x-1 translate-y-[6px] whitespace-nowrap font-sans text-[8px] font-bold uppercase leading-none tracking-[0.13em] sm:max-w-[260px] sm:translate-x-0 sm:translate-y-0 sm:text-[10.5px] sm:tracking-[0.2em] lg:text-[11.5px] dark:text-[#f2e8dc] ${darkMode ? 'text-[#f2e8dc]' : 'text-[#26221D]'}`}>
                Sur ta premiere decouverte
              </span>
              <span className={`hidden h-px min-w-[100px] flex-1 md:block dark:bg-[#5c4a36]/55 ${darkMode ? 'bg-[#5c4a36]/55' : 'bg-[#dfd0be]'}`} aria-hidden="true" />
              <span className={`hidden text-[40px] leading-none md:block dark:text-[#8a6b48] ${darkMode ? 'text-[#8a6b48]' : 'text-[#b79e7d]'}`} aria-hidden="true">*</span>
            </div>

            <form className={`relative mt-6 grid w-full max-w-[640px] grid-cols-[minmax(0,1fr)_50px] gap-2 rounded-[20px] p-1.5 ring-1 sm:grid-cols-[minmax(0,1fr)_auto] dark:bg-[#211d18] dark:ring-[#3a332a]/95 dark:shadow-[0_18px_38px_-31px_rgba(12,9,7,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] ${darkMode ? 'bg-[#211d18] ring-[#3a332a]/95 shadow-[0_18px_38px_-31px_rgba(12,9,7,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'bg-[#f3e8dc] ring-[#dccab8] shadow-[0_18px_38px_-31px_rgba(52,37,25,0.45),inset_0_1px_0_rgba(255,255,255,0.82)]'}`}>
              <label className={`flex min-h-[50px] min-w-0 items-center gap-3 rounded-[15px] px-4 ring-1 transition-colors duration-300 focus-within:ring-[#cbb89f] sm:min-h-[56px] sm:px-5 dark:bg-[#151310] dark:text-[#f8f1e8] dark:ring-[#3a332a]/80 ${darkMode ? 'bg-[#151310] text-[#f8f1e8] ring-[#3a332a]/80' : 'bg-[#fffdf8] text-[#242221] ring-[#eadfce]'}`}>
                <Mail size={18} strokeWidth={1.45} className={`dark:text-[#a68a63] ${darkMode ? 'text-[#a68a63]' : 'text-[#9a7651]'}`} aria-hidden="true" />
                <input type="email" placeholder="Ton adresse e-mail" className={`min-w-0 flex-1 bg-transparent font-serif text-[15.5px] outline-none placeholder:text-[#91877b] dark:text-[#f8f1e8] dark:placeholder:text-[#8f8171] ${darkMode ? 'text-[#f8f1e8]' : 'text-[#242221]'}`} />
              </label>
              <button type="button" aria-label="Recevoir mon code" className={`group inline-flex min-h-[50px] w-[50px] items-center justify-center rounded-[15px] px-0 font-sans text-[9px] font-black uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_15px_28px_-20px_rgba(20,15,12,0.8)] ring-1 transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.97] sm:min-h-[56px] sm:w-auto sm:min-w-[250px] sm:justify-between sm:px-3 sm:pl-7 dark:bg-[#f8efe2] dark:text-[#17120e] dark:ring-white/20 dark:hover:bg-[#fff6e8] ${darkMode ? 'bg-[#f8efe2] text-[#17120e] ring-white/20 hover:bg-[#fff6e8]' : 'bg-[#fffaf3] text-[#7b4f2b] ring-[#dccab8] hover:bg-[#f8efe2] sm:bg-[#251f18] sm:text-[#fff8ee] sm:ring-black/10 sm:hover:bg-[#18130f]'}`}>
                <span className="hidden sm:inline">Recevoir mon code</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#fff8ee] ring-1 transition-transform duration-500 group-hover:translate-x-1 sm:ml-4 ${darkMode ? 'bg-[#7d542b] ring-[#b48655]/50' : 'bg-[#6f4825] ring-[#b48655]/45'}`}>
                  <ArrowRight size={16} strokeWidth={1.55} />
                </span>
              </button>
            </form>

            <div className={`relative mt-4 flex items-center gap-2.5 font-sans text-[9px] font-extrabold uppercase tracking-[0.17em] sm:text-[10px] dark:text-[#9a8a77] ${darkMode ? 'text-[#9a8a77]' : 'text-[#75695f]'}`}>
              <Mail size={14} strokeWidth={1.45} aria-hidden="true" />
              <span>Ton code est envoye instantanement par e-mail.</span>
            </div>
          </div>

          <div className={`relative flex min-h-full p-2 sm:p-4 md:p-5 lg:p-6 dark:bg-[#181511] ${darkMode ? 'bg-[#1d1a16]' : 'bg-[#fffbf5]'}`}>
            <div className="mx-auto grid w-full max-w-[355px] grid-cols-2 gap-2 sm:max-w-none sm:gap-3 lg:grid-cols-2">
              {discountCards.map(({ Icon, toneLabel, title, text, accent, soft, wash, ring }) => (
                <article
                  key={title}
                  style={{
                    '--feature-accent': accent,
                    '--feature-soft': soft,
                    '--feature-wash': wash,
                    '--feature-ring': ring,
                  }}
                  className={`discount-industrial-card group relative min-h-[64px] overflow-hidden rounded-[12px] p-[1px] transition-all duration-500 hover:-translate-y-1 sm:min-h-[206px] sm:rounded-[22px] lg:min-h-[214px] dark:bg-gradient-to-br dark:from-[#3a3026] dark:via-[#211d18] dark:to-[#171411] dark:shadow-[0_18px_46px_-36px_rgba(0,0,0,0.95)] ${darkMode ? 'bg-gradient-to-br from-[#3a3026] via-[#211d18] to-[#171411] shadow-[0_18px_46px_-36px_rgba(0,0,0,0.95)]' : 'bg-gradient-to-br from-[#ddcdbc] via-[#fff8ef] to-[#d9c8b8] shadow-[0_18px_44px_-38px_rgba(62,43,27,0.62)] hover:shadow-[0_28px_58px_-40px_rgba(62,43,27,0.72)]'}`}
                >
                  <div className={`relative flex h-full flex-col overflow-hidden rounded-[11px] bg-[image:var(--feature-wash)] p-2.5 ring-1 sm:rounded-[21px] sm:p-5 dark:bg-[linear-gradient(135deg,#211d18,#191612)] dark:text-[#f8f1e8] dark:ring-[#3d3228] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ${darkMode ? 'bg-[linear-gradient(135deg,#211d18,#191612)] text-[#f8f1e8] ring-[#3d3228] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]' : 'text-[#181716] ring-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]'}`}>
                    <div className={`pointer-events-none absolute inset-[4px] rounded-[8px] ring-1 sm:inset-[6px] sm:rounded-[16px] dark:ring-[#3d3228]/80 ${darkMode ? 'ring-[#3d3228]/80' : 'ring-white/65'}`} />
                    <div className={`pointer-events-none absolute -right-10 -top-10 hidden h-32 w-32 rounded-full opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110 sm:block dark:bg-[#b9864f]/20 ${darkMode ? 'bg-[#b9864f]/20' : 'bg-[color:var(--feature-soft)]'}`} />

                    <div className="relative z-10 flex h-full items-center gap-2.5 sm:h-auto sm:items-start sm:gap-3">
                      <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--feature-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-20px_rgba(60,42,26,0.55)] ring-1 transition-transform duration-500 group-hover:-translate-y-0.5 sm:h-[50px] sm:w-[50px] dark:bg-[#e8ddd0]/86 dark:ring-[#6d543b]/35 ${darkMode ? 'bg-[#e8ddd0]/86 ring-[#6d543b]/35' : 'bg-[#fffbf6]/72 ring-[color:var(--feature-ring)]'}`}>
                        <span className="absolute inset-[4px] rounded-full ring-1 ring-[color:var(--feature-ring)] sm:inset-[5px]" aria-hidden="true" />
                        <Icon size={18} strokeWidth={1.35} className="h-3.5 w-3.5 sm:h-[22px] sm:w-[22px]" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 pt-0 sm:pt-1">
                        <span className="hidden font-sans text-[5.8px] font-black uppercase tracking-[0.16em] text-[color:var(--feature-accent)] dark:text-[#c89b6e] sm:block sm:text-[8px] sm:tracking-[0.26em]">
                          {toneLabel}
                        </span>
                        <h3 className="max-w-[116px] font-serif text-[10px] font-semibold uppercase leading-[1.02] tracking-normal dark:text-[#fbf2e7] sm:mt-3 sm:max-w-[220px] sm:text-[21px] sm:leading-[0.96]">
                          {title}
                        </h3>
                      </div>
                    </div>

                    <p className={`relative z-10 mt-5 hidden max-w-[250px] font-serif text-[15.5px] leading-[1.38] sm:block dark:text-stone-300 ${darkMode ? 'text-stone-300' : 'text-[#62584e]'}`}>
                      {text}
                    </p>

                    <div className="relative z-10 mt-auto hidden items-center gap-3 pt-5 sm:flex">
                      <span className={`h-px flex-1 dark:bg-[#5c4a36]/55 ${darkMode ? 'bg-[#5c4a36]/55' : 'bg-[#dfd1c1]'}`} aria-hidden="true" />
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--feature-accent)] ring-1 ring-[color:var(--feature-ring)] transition-transform duration-500 group-hover:translate-x-1 dark:bg-[#e8ddd0]/70 ${darkMode ? 'bg-[#e8ddd0]/70' : 'bg-[#fffbf6]/58'}`}>
                        <ArrowRight size={16} strokeWidth={1.35} aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
