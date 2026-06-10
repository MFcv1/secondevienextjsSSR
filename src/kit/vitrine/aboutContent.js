export const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1765288115711-25db755b8e31?auto=format&fit=crop&q=80&w=2560';

export const showcaseItems = [
  {
    title: 'La Commode Celadon',
    desc: "Mise en valeur dans une douce teinte sauge, cette piece maitresse devoile de magnifiques motifs floraux sculptes. Une patine delicate vient sublimer ses courbes d'origine, prete a insuffler une ame organique a votre espace.",
    img: '/images/about/about-1.webp',
    reverse: false,
  },
  {
    title: 'Le Grand Vaisselier',
    desc: "Une prestance architecturale rare, rehaussee par un bleu profond rappelant les volets typiques du Sud. Ses moulures elegantes et sa ferronnerie d'origine temoignent d'un artisanat intemporel que nous avons preserve.",
    img: '/images/about/about-2.webp',
    reverse: true,
  },
  {
    title: 'Le Chevet Provencal',
    desc: "L'authenticite dans ses dimensions les plus charmantes. Restaure pour conserver les nobles marques du temps, son bois clair et lumineux s'integre avec une elegance absolue dans une decoration Wabi-Sabi contemporaine.",
    img: '/images/about/about-3.webp',
    reverse: false,
  },
];

export const restorationProjects = [
  {
    id: 1,
    title: 'La Commode Oubliee',
    tag: 'Renovation Complete',
    desc: "Ancien vernis craquele, bois etouffe. Apres un sablage delicat et une peinture Celadon, ce meuble de famille retrouve sa place dans un interieur moderne.",
    avant: '/images/before-after/avant.webp',
    apres: '/images/before-after/apres.webp',
    accent: '#87A08B',
  },
  {
    id: 2,
    title: "La Console d'Epoque",
    tag: 'Sablage & Patine',
    desc: "Cachee sous des couches de laque sombre. Un travail minutieux a permis de sublimer le veinage naturel du chene et d'appliquer une finition Wabi-Sabi.",
    avant: '/images/before-after/avantu.webp',
    apres: '/images/before-after/apresu.webp',
    accent: '#C2704E',
  },
  {
    id: 3,
    title: 'Le Bureau Vintage',
    tag: 'Reparation & Traitement',
    desc: "Pieds fragilises et plateau marque par le temps. Consolidation par greffe de bois, traitement curatif et pose d'un vernis mat impermeable.",
    avant: '/images/before-after/avantx.webp',
    apres: '/images/before-after/apresx.webp',
    accent: '#A68A64',
  },
];

export const processSteps = [
  {
    id: '01',
    title: 'La Chine',
    desc: 'Parcourir les villages et marches de Provence a la recherche de pieces oubliees. Nous ne choisissons que des meubles ayant une structure saine et un potentiel unique.',
    icon: 'search',
    color: '#C2704E',
  },
  {
    id: '02',
    title: 'Le Diagnostic',
    desc: "Aerogommage basse pression pour retrouver le bois brut sans l'agresser. Traitement curatif et preventif contre les insectes pour garantir la perennite.",
    icon: 'shield',
    color: '#87A08B',
  },
  {
    id: '03',
    title: "L'Artisanat",
    desc: 'Reparation des greffes de bois, application de teintes minerales et finitions artisanales. Chaque geste est pense pour sublimer sans denaturer.',
    icon: 'palette',
    color: '#A68A64',
  },
  {
    id: '04',
    title: 'La Transmission',
    desc: "Pose d'un vernis protecteur ou d'une cire naturelle. La piece est prete a rejoindre son nouvel interieur pour une seconde vie eternelle.",
    icon: 'check',
    color: '#1A1A1A',
  },
];

export const instagramPosts = [
  {
    id: 1,
    img: '/images/before-after/apresu.webp',
    alt: 'Atelier bois',
    className: 'col-span-2 row-span-2 aspect-square md:aspect-auto',
  },
  {
    id: 2,
    img: '/images/before-after/avantu.webp',
    alt: 'Detail patine',
    className: 'col-span-1 row-span-1 aspect-square',
  },
  {
    id: 3,
    img: '/images/before-after/apres.webp',
    alt: 'Outils artisan',
    className: 'col-span-1 row-span-1 aspect-square',
  },
  {
    id: 4,
    img: '/images/before-after/apresx.webp',
    alt: 'Interieur provencal',
    className: 'col-span-2 row-span-1 aspect-[2/1] md:aspect-auto',
  },
];

export const faqItems = [
  {
    id: '01',
    question: "Comment se passe la livraison d'un meuble volumineux ?",
    answer: "Nous travaillons avec un transporteur specialise dans le mobilier fragile. Votre meuble est soigneusement emballe et livre directement dans la piece de votre choix, partout en France.",
  },
  {
    id: '02',
    question: "Puis-je vous confier la restauration d'un meuble de famille ?",
    answer: "Absolument. C'est meme le coeur de notre metier. Envoyez-nous des photos de votre meuble via le formulaire de devis, nous vous etablirons un diagnostic personnalise.",
  },
  {
    id: '03',
    question: "Qu'est-ce que l'aerogommage exactement ?",
    answer: "C'est une technique de decapage a tres basse pression. Elle retire vernis et peintures sans creuser ni abimer les veines du bois.",
  },
  {
    id: '04',
    question: 'Comment entretenir vos meubles patines au quotidien ?',
    answer: "Nos finitions sont concues pour etre durables. Pour l'entretien courant, un chiffon doux legerement humide suffit. Une fiche de conseils accompagne chaque piece.",
  },
];

export function getHeroContent(personalization = {}) {
  const heroText = personalization.about_hero_text || {};
  return {
    image: personalization.about_hero || personalization.heroImageUrl || DEFAULT_HERO_IMAGE,
    eyebrow: heroText.eyebrow || "Sud de la France - La Cadiere-d'Azur",
    title: heroText.title || "L'ame des",
    highlight: heroText.highlight || 'objets vecus',
    description: heroText.description || "Des pieces uniques, delicatement restaurees dans l'esprit de l'authenticite provencale. Nous chinons et sublimons cet heritage pour votre interieur.",
    cta: heroText.cta || "Visiter l'Atelier",
  };
}

export function getShowcaseItems(personalization = {}) {
  return showcaseItems.map((item, index) => {
    const key = `manifesto_${index + 1}`;
    const text = personalization[`${key}_text`] || {};
    return {
      ...item,
      title: text.title || item.title,
      desc: text.desc || item.desc,
      tag: text.tag || 'Piece unique',
      img: personalization[key] || item.img,
    };
  });
}

export function getProcessSteps(personalization = {}) {
  return processSteps.map((step, index) => {
    const text = personalization[`process_${index + 1}_text`] || {};
    return {
      ...step,
      title: text.t || step.title,
      desc: text.d || step.desc,
    };
  });
}

export function getFaqItems(personalization = {}) {
  const faqText = personalization.faq_main_text || {};
  return [1, 2, 3, 4, 5]
    .map((id, index) => ({
      id: String(id).padStart(2, '0'),
      question: faqText[`q${id}`] || faqItems[index]?.question,
      answer: faqText[`a${id}`] || faqItems[index]?.answer,
    }))
    .filter((faq) => faq.question && faq.answer);
}
