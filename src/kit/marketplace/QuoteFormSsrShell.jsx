import {
  QUOTE_CONTROL_HEIGHT,
  QUOTE_DROPZONE_HEIGHT,
  QUOTE_GUTTER_BOTTOM,
  QUOTE_RADIUS_CARD,
  QUOTE_RADIUS_FIELD,
  QUOTE_READABLE,
  QUOTE_SHELL,
  QUOTE_STEP_PADDING,
  QUOTE_STEP_RADIUS,
  QUOTE_TYPE,
  quoteTokens,
} from './quoteTheme';

const TOTAL_STEPS = 7;

/*
 * Le rail de l'assistant, en version figee. Il n'existe que pour
 * occuper exactement la meme hauteur que celui de l'island : sans lui,
 * l'arrivee du formulaire enrichi pousserait toute la page vers le bas.
 */
const RAIL_STEPS = ['Meuble', 'État', 'Photos', 'Détails', 'Prestations', 'Contact', 'Estimation'];

const furnitureCards = [
  ['buffet', 'Buffet', '/images/categories/buffets-config-rail.webp'],
  ['armoire', 'Armoire', '/images/categories/armoires-config-rail.webp'],
  ['commode', 'Commode', '/images/categories/commodes-config-rail.webp'],
  ['miroir', 'Miroir', '/images/categories/miroirs-config-rail.webp'],
  ['chaise', 'Chaise', 'https://firebasestorage.googleapis.com/v0/b/secondevienextjsssr.firebasestorage.app/o/furniture%2Fthumbnails%2Fcard_thumb_5ZBinIKs3IIj9ugh6ar9_0_thumb384_cac4c47aca97.webp?alt=media&token=4aba7696-9e2f-4957-afe1-7c36b17b7125'],
  ['table', 'Table', 'https://firebasestorage.googleapis.com/v0/b/secondevienextjsssr.firebasestorage.app/o/furniture%2Fthumbnails%2Fcard_thumb_BfVsRJC01QMNDvx9Tldf_0_thumb384_15d13c1c4664.webp?alt=media&token=de92ff95-d87c-482c-a697-e810004f82bb'],
];

const conditionOptions = [
  ['Bon état, entretien léger', 'Bon état', 'Entretien léger, patine à raviver.'],
  ['Rayures ou marques visibles', 'Rayures ou marques', 'Défauts visibles en surface.'],
  ['Structure fragilisée', 'Structure fragilisée', 'Assemblages ou pieds à reprendre.'],
  ['Restauration complète', 'Restauration complète', 'Reprise intégrale du meuble.'],
];

const dimensionFields = [
  ['height', 'Hauteur', 'cm'],
  ['width', 'Largeur', 'cm'],
  ['depth', 'Profondeur', 'cm'],
];

const serviceGroups = [
  ['Préparation', [
    ['Ponçage manuel adapté', 'Ponçage en plusieurs grains pour retirer les anciennes couches sans abîmer le bois.', '45€ – 120€', false],
    ['Nettoyage & dépoussiérage profond', 'Élimination des saletés, graisses et résidus accumulés.', '20€ – 45€', false],
  ]],
  ['Restauration du bois', [
    ["Application d'un produit d'entretien", 'Nourrit le bois en profondeur et ravive sa patine naturelle.', '25€ – 55€', false],
    ['Rattrapage des défauts', 'Comblement des trous, fissures, impacts et rayures.', '25€ – 90€', false],
  ]],
  ['Réparations', [
    ['Renforts & consolidation', 'Resserrage, collage, renforcement des assemblages fragilisés.', '40€ – 110€', false],
  ]],
  ['Finition', [
    ['Finition & protection', "Application d'une cire ou d'un vernis mat pour protéger durablement.", '30€ – 75€', false],
  ]],
];

const contactFields = [
  ['firstname', 'Prénom', 'Votre prénom', 'text', true],
  ['lastname', 'Nom', 'Votre nom', 'text', false],
  ['email', 'Email', 'votre@email.com', 'email', true],
  ['phone', 'Téléphone', '06 12 34 56 78', 'tel', true],
];

const reassurance = ['Devis gratuit', 'Réponse sous 48h', 'Sans engagement'];

export default function QuoteFormSsrShell({ darkMode = false } = {}) {
  const t = quoteTokens(darkMode);
  const fieldClass = `${QUOTE_CONTROL_HEIGHT} w-full ${QUOTE_RADIUS_FIELD} px-4 font-sans text-[14px] outline-none ${t.field}`;
  const areaClass = `w-full resize-none ${QUOTE_RADIUS_FIELD} p-4 font-sans text-[14px] leading-[1.6] outline-none ${t.field}`;
  const panelClass = `${QUOTE_GUTTER_BOTTOM} ${QUOTE_STEP_RADIUS} ${QUOTE_STEP_PADDING} ${t.stepPanel}`;
  const firstPanelClass = `quote-reveal-group ${panelClass}`;

  const SectionHead = ({ index, title, hint, airyHint = false }) => (
    <header className="mb-8">
      <p className={`${QUOTE_TYPE.eyebrow} ${t.accent}`}>Étape {index} sur {TOTAL_STEPS}</p>
      <h2 className={`quote-balance mt-3 max-w-[24ch] ${QUOTE_TYPE.section}`}>{title}</h2>
      {hint ? <p className={`${airyHint ? 'mt-5' : 'mt-3'} max-w-[56ch] ${QUOTE_TYPE.body} ${t.muted}`}>{hint}</p> : null}
    </header>
  );

  const Tick = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );

  return (
    <form
      id="quote-ssr-form-shell"
      data-quote-ssr-shell
      action="mailto:contact@seconde-vie-anais.fr"
      method="post"
      encType="text/plain"
      className={`${QUOTE_SHELL} pb-6 pt-6 lg:pt-9`}
    >
      {/* Gabarit du rail : meme boite que l'island, donc aucun saut au remplacement. */}
      <div
        aria-hidden="true"
        data-quote-reveal="progress"
        className={`quote-reveal quote-anchor sticky top-16 z-30 -mx-5 mb-6 border-b px-5 py-3.5 backdrop-blur-xl sm:-mx-8 sm:px-8 md:top-[76px] lg:mx-0 lg:mb-6 lg:rounded-[18px] lg:border lg:px-7 lg:py-4 ${t.hairline} ${t.railBg}`}
      >
        <div className="flex items-baseline justify-between gap-4 lg:hidden">
          <p className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${t.accent}`}>
            Étape 1 / {TOTAL_STEPS}
          </p>
          <p className="font-sans text-[13px] font-semibold">{RAIL_STEPS[0]}</p>
        </div>

        <ol className="hidden lg:grid lg:grid-cols-7">
          {RAIL_STEPS.map((label, index) => (
            <li key={label} className="min-w-0">
              <span className="flex w-full items-center gap-2.5 rounded-full py-1 pr-3 text-left">
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-semibold ${index === 0 ? `${t.accentBg} ${t.accentOn}` : darkMode ? 'bg-white/[0.08] text-stone-500' : 'bg-[#ece6de] text-[#8d8479]'}`}
                >
                  {index + 1}
                </span>
                <span className={`truncate font-sans text-[12.5px] ${index === 0 ? 'font-semibold' : `font-medium ${t.muted}`}`}>
                  {label}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className={`mt-3 h-[3px] w-full overflow-hidden rounded-full lg:mt-3.5 ${t.trackBg}`}>
          <div className={`h-full rounded-full ${t.accentBg}`} style={{ width: `${(1 / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      {/* 1 — TYPE DE MEUBLE */}
      <section data-quote-reveal="step-1" className={firstPanelClass}>
        <div className="quote-reveal-item-1">
          <SectionHead index={1} title="Quel meuble souhaitez-vous restaurer ?" hint="Choisissez la catégorie la plus proche." />
        </div>
        <div className="mx-auto grid w-full max-w-[430px] grid-cols-2 gap-3 lg:max-w-none lg:grid-cols-6">
          {furnitureCards.map(([id, label, image], index) => (
            <label
              key={id}
              className={`quote-reveal-item-${index + 2} cursor-pointer overflow-hidden ${QUOTE_RADIUS_CARD} ${index === 0 ? t.furnitureCardActive : t.furnitureCardIdle}`}
            >
              <input className="sr-only" type="radio" name="furnitureType" value={id} defaultChecked={index === 0} />
              <span className={`block aspect-[5/6] w-full overflow-hidden lg:aspect-[4/5] ${t.imageBed}`}>
                <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </span>
              <span className="block truncate px-2.5 py-2 font-sans text-[12.5px] font-semibold lg:px-3 lg:py-2.5">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 2 — ETAT GENERAL */}
      <section className={panelClass}>
        <SectionHead index={2} title="Dans quel état est-il ?" hint="Une seule réponse suffit, Anaïs affinera après vos photos." airyHint />
        <fieldset className="grid gap-3 pt-5 min-[520px]:grid-cols-2 min-[520px]:pt-6 lg:grid-cols-4 lg:pt-12">
          <legend className="sr-only">État général</legend>
          {conditionOptions.map(([value, label, text], index) => (
            <label
              key={value}
              className={`flex cursor-pointer flex-col items-start gap-3 ${QUOTE_RADIUS_CARD} p-4 min-[520px]:min-h-[142px] lg:min-h-[168px] lg:gap-4 lg:p-5 ${index === 0 ? t.optionActive : t.optionIdle}`}
            >
              <input type="radio" name="condition" value={value} defaultChecked={index === 0} className="h-4 w-4 accent-[#8B5C42]" />
              <span>
                <span className="block font-sans text-[14px] font-semibold leading-snug">{label}</span>
                <span className={`mt-1.5 block ${QUOTE_TYPE.meta} ${t.muted}`}>{text}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      {/* 3 — PHOTOS */}
      <section className={panelClass}>
        <SectionHead index={3} title="Montrez-nous votre meuble" hint="Deux ou trois photos suffisent pour un devis précis. Cette étape est facultative." />
        <label className={`flex cursor-pointer flex-col items-center justify-center border border-dashed ${QUOTE_RADIUS_CARD} ${QUOTE_DROPZONE_HEIGHT} px-4 py-8 text-center lg:px-6 lg:py-10 ${darkMode ? 'border-white/16 bg-white/[0.02]' : 'border-[#d5cbbf] bg-white'}`}>
          <span className="font-sans text-[14px] font-semibold">Ajouter vos photos</span>
          <span className={`mt-1.5 ${QUOTE_TYPE.meta} ${t.muted}`}>JPG, PNG ou WEBP · jusqu'à 10 photos</span>
          <input type="file" name="photos" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" />
        </label>
      </section>

      {/* 4 — DESCRIPTION & DIMENSIONS */}
      <section className={panelClass}>
        <SectionHead index={4} title="Décrivez votre projet" hint="Dites-nous ce que vous attendez de cette restauration." />
        <div className={`${QUOTE_READABLE} space-y-6 lg:space-y-7`}>
          <label className="block">
            <span className={QUOTE_TYPE.label}>Description des travaux souhaités</span>
            <textarea
              name="description"
              rows={5}
              placeholder="Décrivez votre projet, les réparations ou finitions souhaitées…"
              className={`mt-2.5 min-h-[132px] ${areaClass}`}
            />
          </label>

          <div className="pt-4 lg:pt-7">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="w-full min-w-0 sm:max-w-[520px]">
                <span className={QUOTE_TYPE.label}>
                  Dimensions <span className="font-normal opacity-60">(facultatif)</span>
                </span>
                <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                  {dimensionFields.map(([name, label, unit]) => (
                    <span key={name} className="relative block">
                      <input
                        name={name}
                        type="number"
                        min="0"
                        placeholder={label}
                        aria-label={`${label} en centimètres`}
                        className={`${QUOTE_CONTROL_HEIGHT} w-full ${QUOTE_RADIUS_FIELD} pl-4 pr-9 font-sans text-[14px] outline-none ${t.field}`}
                      />
                      <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] ${t.faint}`}>{unit}</span>
                    </span>
                  ))}
                </div>
              </div>
              <label className="block w-full max-w-[160px] sm:w-[170px] sm:max-w-none sm:shrink-0">
                <span className={QUOTE_TYPE.label}>
                  Poids <span className="font-normal opacity-60">(facultatif)</span>
                </span>
                <span className="relative mt-2.5 block">
                  <input
                    name="weight"
                    type="number"
                    min="0"
                    placeholder="Poids"
                    aria-label="Poids en kilogrammes"
                    className={`${QUOTE_CONTROL_HEIGHT} w-full ${QUOTE_RADIUS_FIELD} pl-4 pr-9 font-sans text-[14px] outline-none ${t.field}`}
                  />
                  <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] ${t.faint}`}>kg</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — PRESTATIONS */}
      <section className={panelClass}>
        <SectionHead index={5} title="Quelles interventions souhaitez-vous ?" hint="Cochez ce qui vous parle, la sélection reste ajustable." />
        <div className="grid gap-y-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-7">
          {serviceGroups.map(([group, services]) => (
            <section key={group}>
              <h3 className={`border-b pb-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] ${t.hairline}`}>
                {group}
              </h3>
              <div className="mt-2.5 space-y-2.5">
                {services.map(([service, text, price, checked]) => (
                  <label
                    key={service}
                  className={`flex min-h-[92px] cursor-pointer items-start gap-3 ${QUOTE_RADIUS_CARD} p-4 lg:min-h-0 lg:gap-3.5 ${checked ? t.optionActive : t.optionIdle}`}
                  >
                    <input type="checkbox" name="services" value={service} defaultChecked={checked} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#8B5C42]" />
                  <span className="flex min-h-[52px] min-w-0 flex-1 flex-col justify-between lg:min-h-0">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={QUOTE_TYPE.cardTitle}>{service}</span>
                        <span className="shrink-0 font-sans text-[12.5px] font-semibold tabular-nums">{price}</span>
                      </span>
                    <span className={`mt-2 block font-sans text-[11px] leading-[1.5] lg:mt-1 lg:text-[11.5px] ${t.muted}`}>{text}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* 6 — COORDONNEES */}
      <section className={panelClass}>
        <SectionHead index={6} title="Où vous envoyer le devis ?" hint="Devis gratuit et sans engagement, envoyé sous 48h." />
        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="grid gap-4 min-[520px]:grid-cols-2">
            {contactFields.map(([name, label, placeholder, type, required]) => (
              <label key={name} className="block">
                <span className={QUOTE_TYPE.label}>
                  {label}
                  {required ? <span className={t.accent}> *</span> : null}
                </span>
                <input name={name} type={type} required={required} placeholder={placeholder} className={`mt-2.5 ${fieldClass}`} />
                <span aria-hidden="true" className="mt-1.5 block min-h-[18px] font-sans text-[11.5px] invisible">Aucune erreur</span>
              </label>
            ))}
            <label className="block min-[520px]:col-span-2">
              <span className={QUOTE_TYPE.label}>Localisation du meuble</span>
              <input name="location" placeholder="Ville ou code postal" className={`mt-2.5 ${fieldClass}`} />
            </label>
          </div>
          <label className="block lg:flex lg:h-full lg:flex-col">
            <span className={QUOTE_TYPE.label}>
              Précisions complémentaires <span className="font-normal opacity-60">(facultatif)</span>
            </span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Contraintes d'accès, délais souhaités, histoire du meuble…"
              className={`mt-2.5 min-h-[120px] lg:min-h-0 lg:flex-1 ${areaClass}`}
            />
          </label>
        </div>

      </section>

      {/* 7 — ESTIMATION ET ENVOI */}
      <section className={`${QUOTE_STEP_RADIUS} ${QUOTE_STEP_PADDING} ${t.stepPanel}`}>
        <SectionHead index={7} title="Votre estimation indicative" hint="Vérifiez la fourchette et le détail avant d'envoyer votre demande." />
        <div className={`grid gap-6 min-[560px]:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x ${t.divide}`}>
          <div className="lg:pr-9">
            <p className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>
              Estimation indicative
            </p>
            <p className={`mt-2.5 ${QUOTE_TYPE.price}`}>90€ – 220€</p>
            <p className={`mt-3 font-sans text-[13px] font-medium ${t.muted}`}>Délai estimé : 2 à 4 semaines</p>
            <ul className="mt-4 space-y-2 lg:mt-6">
              {reassurance.map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className={t.accent}><Tick /></span>
                  <span className={`${QUOTE_TYPE.meta} ${t.muted}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`border-t pt-6 min-[560px]:border-t-0 min-[560px]:pt-0 lg:px-9 ${t.hairline}`}>
            <p className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>
              Détail des prestations
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                ['Ponçage manuel adapté', '45€ – 120€'],
                ['Nettoyage & dépoussiérage profond', '20€ – 45€'],
                ["Application d'un produit d'entretien", '25€ – 55€'],
              ].map(([label, price]) => (
                <li key={label} className="flex items-baseline justify-between gap-4">
                  <span className={`${QUOTE_TYPE.meta} ${t.muted}`}>{label}</span>
                  <span className="shrink-0 font-sans text-[12.5px] font-semibold tabular-nums">{price}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 flex items-baseline justify-between gap-4 border-t pt-4 ${t.hairline}`}>
              <span className="font-sans text-[13px] font-semibold">Total estimatif</span>
              <span className="font-sans text-[13px] font-semibold tabular-nums">90€ – 220€</span>
            </div>
          </div>

          <div className={`border-t pt-6 min-[560px]:col-span-2 lg:col-span-1 lg:border-t-0 lg:pl-9 lg:pt-0 ${t.hairline}`}>
            <p className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>
              Besoin d'un conseil ?
            </p>
            <p className={`mt-4 ${QUOTE_TYPE.meta} ${t.muted}`}>
              Anaïs vous répond sur l'état réel de votre meuble et ajuste le devis
              après étude de votre demande.
            </p>
            <a
              href="tel:+33612345678"
              className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-full font-sans text-[13px] font-semibold sm:w-auto sm:px-7 ${t.ghostBtn}`}
            >
              Être rappelé
            </a>
            <p className={`mt-4 ${QUOTE_TYPE.micro} ${t.faint}`}>
              Fourchette indicative. Le devis final est établi après étude de vos photos.
            </p>
          </div>
        </div>
        <div className={`mt-8 flex flex-col items-start gap-4 border-t pt-7 sm:flex-row sm:items-center sm:justify-between ${t.hairline}`}>
          <p className={`${QUOTE_TYPE.meta} ${t.muted}`}>Le devis final sera confirmé après étude de vos informations et de vos photos.</p>
          <button
            type="submit"
            className={`inline-flex h-[54px] w-full items-center justify-center rounded-full px-8 font-sans text-[13px] font-semibold sm:w-auto ${t.primaryBtn}`}
          >
            Envoyer ma demande
          </button>
        </div>
      </section>
    </form>
  );
}
