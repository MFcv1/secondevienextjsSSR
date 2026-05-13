const DEFAULT_CATEGORY_COPY = {
    intro: 'Sélection de pièces restaurées et de mobilier ancien, choisies pour leur matière, leur ligne et leur capacité à retrouver une place durable dans un intérieur actuel.',
    detail: 'Chaque publication reste volontairement précise : état, dimensions, matières, disponibilité et livraison possible autour de Marseille puis en France selon les pièces.',
    faq: [
        {
            question: 'La livraison est-elle possible hors Marseille ?',
            answer: 'Oui, la livraison peut être étudiée en France selon le volume, la fragilité et la distance.'
        },
        {
            question: 'Chaque meuble est-il unique ?',
            answer: 'Oui, les pièces sont publiées en quantité limitée ou unique selon les trouvailles et les restaurations disponibles.'
        }
    ]
};

export const GALLERY_SEO_COPY = {
    eyebrow: 'Galerie Seconde Vie par Anais',
    title: 'Mobilier ancien restauré autour de Marseille',
    intro: 'La galerie rassemble des meubles anciens restaurés, des pièces vintage et des objets de caractère sélectionnés pour leur matière, leurs proportions et leur potentiel dans une maison actuelle.',
    detail: 'Le référencement reste volontairement prudent tant que les informations administratives finales ne sont pas confirmées : l’ancrage éditorial se concentre autour de Marseille, avec livraison possible sur Marseille, en France et plus tard vers les pays frontaliers si la logistique le permet.',
    highlights: [
        'Pièces uniques ou en petites quantités',
        'Descriptions détaillées pour chaque meuble',
        'Livraison et retrait à confirmer selon la pièce'
    ]
};

export const CATEGORY_SEO_COPY = {
    meubles: {
        intro: 'Armoires, buffets, commodes et tables composent le cœur de la sélection : des meubles anciens restaurés pour apporter du rangement, de la matière et une présence durable.',
        detail: 'Ces pièces sont travaillées pour conserver le charme de l’ancien tout en retrouvant un usage quotidien, avec livraison possible autour de Marseille puis en France selon le meuble.',
        related: ['buffets', 'commodes', 'armoires', 'tables'],
        faq: [
            {
                question: 'Comment choisir un meuble ancien restauré ?',
                answer: 'Regardez les dimensions, la matière, l’état, la finition et l’usage attendu. Une pièce bien choisie doit être belle, stable et facile à intégrer.'
            },
            {
                question: 'Les meubles peuvent-ils être livrés en France ?',
                answer: 'Oui, chaque livraison est étudiée selon le volume, la fragilité et l’adresse de destination.'
            }
        ]
    },
    buffets: {
        intro: 'Les buffets anciens et enfilades restaurées réunissent rangement, bois, patine et lignes intemporelles pour une salle à manger, un salon ou une entrée.',
        detail: 'Chaque buffet est présenté avec ses dimensions, son état, sa matière et sa disponibilité pour faciliter le choix à distance.',
        related: ['meubles', 'commodes', 'tables'],
        faq: [
            {
                question: 'Un buffet ancien convient-il à un intérieur contemporain ?',
                answer: 'Oui, un buffet restauré fonctionne très bien comme point d’ancrage dans un intérieur contemporain, surtout avec des finitions sobres.'
            },
            {
                question: 'Que faut-il vérifier avant achat ?',
                answer: 'Les dimensions, la profondeur, les rangements, la stabilité et le type de finition sont les points les plus importants.'
            }
        ]
    },
    commodes: {
        intro: 'Les commodes anciennes et chevets restaurés sont des formats faciles à placer, utiles dans une chambre, une entrée ou un salon.',
        detail: 'Les tiroirs, plateaux, pieds et finitions sont les éléments à observer pour choisir une pièce à la fois pratique et expressive.',
        related: ['buffets', 'armoires', 'meubles'],
        faq: [
            {
                question: 'Les tiroirs sont-ils contrôlés ?',
                answer: 'Les fiches produit doivent préciser l’état et les détails utiles ; les éléments mobiles font partie des points à documenter avant publication.'
            },
            {
                question: 'Une commode peut-elle être livrée loin de Marseille ?',
                answer: 'Oui, une solution de livraison peut être étudiée en France selon le poids, les dimensions et l’accès.'
            }
        ]
    },
    armoires: {
        intro: 'Les armoires anciennes restaurées apportent du rangement et une vraie verticalité dans une chambre, un couloir ou une maison de famille.',
        detail: 'Ce sont des pièces fortes : dimensions, démontage possible, accès livraison et profondeur doivent être vérifiés avant achat.',
        related: ['meubles', 'commodes', 'buffets'],
        faq: [
            {
                question: 'Faut-il vérifier les accès avant livraison ?',
                answer: 'Oui, pour une armoire ancienne, il faut toujours anticiper escaliers, portes, hauteur sous plafond et possibilité de démontage.'
            },
            {
                question: 'Les armoires sont-elles restaurées pour un usage quotidien ?',
                answer: 'L’objectif est de proposer des pièces belles et utilisables, avec les informations d’état indiquées dans chaque fiche.'
            }
        ]
    },
    tables: {
        intro: 'Les tables anciennes restaurées gardent la chaleur du bois et deviennent facilement le centre d’une salle à manger ou d’un espace de travail.',
        detail: 'Plateau, stabilité, dimensions et protection de finition sont les critères essentiels pour choisir une table ancienne.',
        related: ['meubles', 'chaises', 'buffets'],
        faq: [
            {
                question: 'Une table ancienne demande-t-elle un entretien particulier ?',
                answer: 'Oui, l’entretien dépend de la finition. La fiche produit doit guider l’usage quotidien et les précautions utiles.'
            },
            {
                question: 'Peut-on associer une table ancienne à des chaises modernes ?',
                answer: 'Oui, le contraste fonctionne souvent très bien si les proportions et les matières dialoguent.'
            }
        ]
    },
    assises: {
        intro: 'Chaises, fauteuils et bancs anciens apportent du rythme, du confort et une silhouette singulière autour d’une table ou dans un coin lecture.',
        detail: 'Les assises demandent une attention particulière au confort, à la hauteur, à la structure et à l’état du bois ou du tissu.',
        related: ['chaises', 'fauteuils', 'bancs', 'tables']
    },
    chaises: {
        intro: 'Les chaises anciennes restaurées peuvent fonctionner seules, en paire ou en ensemble autour d’une table de caractère.',
        detail: 'Hauteur d’assise, stabilité, bois et finition sont les informations importantes pour acheter sereinement.',
        related: ['assises', 'tables', 'fauteuils']
    },
    fauteuils: {
        intro: 'Les fauteuils anciens et vintage apportent une présence douce dans un salon, une chambre ou un espace de lecture.',
        detail: 'La structure, l’assise, les accoudoirs et les matières doivent être décrits clairement pour chaque pièce.',
        related: ['assises', 'chaises', 'bancs']
    },
    bancs: {
        intro: 'Les bancs anciens sont utiles dans une entrée, au pied d’un lit ou autour d’une table, avec une silhouette simple et chaleureuse.',
        detail: 'La longueur, la hauteur et la stabilité sont les critères principaux à vérifier.',
        related: ['assises', 'tables', 'chaises']
    },
    eclairage: {
        intro: 'Lampes anciennes et luminaires de caractère complètent la sélection avec des pièces capables de réchauffer une ambiance.',
        detail: 'Chaque luminaire doit préciser son état, ses matériaux et les informations utiles à l’usage.',
        related: ['decorations', 'deco', 'miroirs']
    },
    decorations: {
        intro: 'Miroirs, objets décoratifs et petites pièces anciennes permettent d’ajouter une touche singulière sans transformer tout un intérieur.',
        detail: 'Ces objets accompagnent naturellement les meubles restaurés et peuvent faciliter une première acquisition.',
        related: ['miroirs', 'deco', 'eclairage']
    },
    miroirs: {
        intro: 'Les miroirs anciens apportent lumière, profondeur et patine dans une entrée, une chambre ou un salon.',
        detail: 'Cadre, format, traces du temps et système d’accroche doivent être regardés avec attention.',
        related: ['decorations', 'deco', 'eclairage']
    },
    deco: {
        intro: 'Les objets décoratifs anciens complètent les meubles avec des matières, formes et détails capables de personnaliser un intérieur.',
        detail: 'La sélection évolue au fil des trouvailles et garde une logique de pièces choisies, pas de décoration standardisée.',
        related: ['decorations', 'miroirs', 'eclairage']
    }
};

export const getCategorySeoCopy = (categoryId, fallbackLabel = 'Pièces restaurées') => {
    const copy = CATEGORY_SEO_COPY[categoryId] || {};
    return {
        intro: copy.intro || DEFAULT_CATEGORY_COPY.intro,
        detail: copy.detail || DEFAULT_CATEGORY_COPY.detail,
        related: copy.related || [],
        faq: copy.faq || DEFAULT_CATEGORY_COPY.faq
    };
};
