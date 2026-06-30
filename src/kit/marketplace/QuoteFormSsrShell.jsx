const furnitureTypes = [
  ['buffet', 'Buffet', '/images/newsletter/discount-sideboard.webp'],
  ['armoire', 'Armoire', '/images/hero/hero-blob-1.webp'],
  ['commode', 'Commode', '/images/before-after/apresu.webp'],
  ['miroir', 'Miroir', '/images/gallery-hero-4.webp'],
  ['chaise', 'Chaise', '/images/gallery-hero-1.webp'],
  ['table', 'Table', '/images/hero/hero-furniture.webp'],
  ['autre', 'Autre', null],
];

const serviceGroups = [
  ['Préparation', 'Ponçage manuel adapté', '45€ - 120€'],
  ['Restauration du bois', "Application d'un produit d'entretien", '25€ - 55€'],
  ['Réparations', 'Renforts & consolidation', '40€ - 110€'],
  ['Finition', 'Finition & protection', '30€ - 75€'],
];

export default function QuoteFormSsrShell({ darkMode = false } = {}) {
  const surface = darkMode ? 'bg-white/[0.035] ring-white/8' : 'bg-white/72 ring-[#eee7df]';
  const input = darkMode
    ? 'bg-[#151515] ring-white/10 placeholder:text-stone-600'
    : 'bg-white ring-[#ddd3c9] placeholder:text-[#a49a91]';
  const muted = darkMode ? 'text-stone-400' : 'text-[#6e655d]';

  return (
    <form
      id="quote-ssr-form-shell"
      data-quote-ssr-shell
      action="mailto:contact@seconde-vie-anais.fr"
      method="post"
      encType="text/plain"
      className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 md:py-12 lg:px-10 xl:px-16"
    >
      <section className="space-y-5">
        <h2 className="font-serif text-2xl leading-tight md:text-[2rem]">1. Quel type de meuble souhaitez-vous faire restaurer ?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {furnitureTypes.map(([id, label, image], index) => (
            <label
              key={id}
              className={`group min-h-[142px] rounded-[8px] p-2.5 transition-all duration-700 ${index === 0
                ? 'bg-white ring-1 ring-[#9A714C] shadow-[0_18px_45px_rgba(86,61,39,0.12)]'
                : darkMode ? 'bg-white/[0.045] ring-1 ring-white/8' : 'bg-white/58 ring-1 ring-[#eee7df]'
              }`}
            >
              <input className="sr-only" type="radio" name="furnitureType" value={id} defaultChecked={index === 0} />
              <span className="flex h-[88px] items-center justify-center overflow-hidden rounded-[6px]">
                {image ? (
                  <img src={image} alt={label} className="h-full w-full object-contain" />
                ) : (
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ring-1 ${darkMode ? 'ring-white/16' : 'ring-[#d6c8b9]'}`}>?</span>
                )}
              </span>
              <span className="mt-3 block font-sans text-[13px] font-semibold">{label}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${surface}`}>
          <h2 className="font-serif text-2xl leading-tight">2. Décrivez votre meuble</h2>
          <div className="mt-5 space-y-4 font-sans">
            <label className="block">
              <span className="text-[12px] font-bold">État général</span>
              <select name="condition" className={`mt-2 h-12 w-full rounded-[6px] px-4 text-[13px] outline-none ring-1 ${input}`} defaultValue="">
                <option value="" disabled>Sélectionnez l’état général</option>
                <option>Bon état, entretien léger</option>
                <option>Rayures ou marques visibles</option>
                <option>Structure fragilisée</option>
                <option>Restauration complète</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-bold">Description des travaux souhaités</span>
              <textarea name="description" rows={5} placeholder="Décrivez votre projet, les réparations ou finitions souhaitées..." className={`mt-2 w-full resize-none rounded-[6px] p-4 text-[13px] outline-none ring-1 ${input}`} />
            </label>
            <div>
              <span className="text-[12px] font-bold">Dimensions <span className="font-normal opacity-55">(facultatif)</span></span>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ['height', 'Hauteur (cm)'],
                  ['width', 'Largeur (cm)'],
                  ['depth', 'Profondeur (cm)'],
                ].map(([name, placeholder]) => (
                  <input key={name} name={name} type="number" min="0" placeholder={placeholder} className={`h-12 rounded-[6px] px-4 text-[13px] outline-none ring-1 ${input}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`flex min-h-[420px] flex-col rounded-[8px] p-4 ring-1 sm:p-6 ${surface}`}>
          <h2 className="font-serif text-2xl leading-tight">3. Ajoutez des photos</h2>
          <p className={`mt-2 font-sans text-[12px] ${muted}`}>Plus vous ajoutez de photos, plus le devis sera précis.</p>
          <label className={`mt-5 flex flex-1 flex-col items-center justify-center rounded-[8px] border border-dashed p-6 text-center ${darkMode ? 'border-white/16 bg-[#151515]' : 'border-[#d4c4b4] bg-white/58'}`}>
            <span className="font-sans text-[13px] font-bold">Cliquez pour ajouter vos photos</span>
            <span className={`mt-1 font-sans text-[12px] ${darkMode ? 'text-stone-500' : 'text-[#7c7168]'}`}>JPG, PNG, WEBP · jusqu'à 10 photos</span>
            <input type="file" name="photos" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" />
          </label>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${surface}`}>
          <h2 className="font-serif text-2xl leading-tight md:text-[2rem]">4. Choisissez les prestations souhaitées</h2>
          <p className={`mt-2 font-sans text-[12px] ${muted}`}>Sélectionnez les interventions que vous souhaitez pour votre meuble.</p>
          <div className="mt-6 space-y-3">
            {serviceGroups.map(([group, service, price], index) => (
              <label key={service} className={`grid gap-3 rounded-[8px] p-4 ring-1 sm:grid-cols-[26px_1fr_auto] sm:p-5 ${darkMode ? 'ring-white/8' : 'ring-[#eadfd3]'}`}>
                <input type="checkbox" name="services" value={service} defaultChecked={index < 2} className="mt-1 h-[22px] w-[22px] rounded-[5px]" />
                <span>
                  <span className="block font-sans text-[12px] font-bold">{group}</span>
                  <span className="mt-1 block font-sans text-[13px] font-bold">{service}</span>
                </span>
                <span className="font-sans text-[13px] font-semibold sm:text-right">{price}</span>
              </label>
            ))}
          </div>
        </section>
        <aside className={`space-y-4 rounded-[8px] p-6 ring-1 xl:sticky xl:top-28 xl:self-start ${darkMode ? 'bg-white/[0.045] ring-white/8' : 'bg-white/82 ring-[#eadfd3]'}`}>
          <h2 className="font-serif text-2xl leading-tight">Estimation en temps reel</h2>
          <p className={`mt-2 font-sans text-[12px] leading-relaxed ${muted}`}>Le prix varie selon les prestations et l'état de votre meuble.</p>
          <p className="mt-6 font-sans text-[12px] font-bold">Fourchette estimative</p>
          <div className="mt-2 font-serif text-[3rem] leading-none tracking-normal">90€ - 220€</div>
          <p className="mt-3 font-sans text-[13px] font-semibold">Délai estimé : 2 à 4 semaines</p>
        </aside>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${surface}`}>
          <h2 className="font-serif text-2xl leading-tight">5. Vos informations</h2>
          <div className="mt-5 grid gap-4 font-sans sm:grid-cols-2">
            {[
              ['firstname', 'Prenom', 'Votre prenom', 'text'],
              ['lastname', 'Nom', 'Votre nom', 'text'],
              ['email', 'Email', 'votre@email.com', 'email'],
              ['phone', 'Telephone', '06 12 34 56 78', 'tel'],
            ].map(([name, label, placeholder, type]) => (
              <label key={name} className="block">
                <span className="text-[12px] font-bold">{label}</span>
                <input name={name} type={type} required={['firstname', 'email', 'phone'].includes(name)} placeholder={placeholder} className={`mt-2 h-12 w-full rounded-[6px] px-4 text-[13px] outline-none ring-1 ${input}`} />
              </label>
            ))}
          </div>
        </section>
        <section className={`rounded-[8px] p-4 ring-1 sm:p-6 ${surface}`}>
          <h2 className="font-serif text-2xl leading-tight">6. Informations complementaires <span className="font-sans text-[12px] opacity-55">(facultatif)</span></h2>
          <textarea name="notes" rows={7} placeholder="Informations supplémentaires, contraintes d’accès, délais souhaités, etc." className={`mt-5 w-full resize-none rounded-[6px] p-4 text-[13px] outline-none ring-1 ${input}`} />
        </section>
      </div>

      <section className={`mt-8 rounded-[8px] p-7 text-center ring-1 ${darkMode ? 'bg-white/[0.055] ring-white/8' : 'bg-[#f4eee7] ring-[#eadfd3]'}`}>
        <h2 className="font-serif text-2xl leading-tight md:text-3xl">Prêt à redonner vie à votre meuble ?</h2>
        <p className={`mx-auto mt-4 max-w-[18rem] font-sans text-[13px] leading-relaxed ${muted}`}>Envoyez votre demande et recevez votre devis personnalisé sous 48h.</p>
        <button type="submit" className={`mt-7 inline-flex min-h-[58px] w-full max-w-[300px] items-center justify-center rounded-[8px] px-6 font-sans text-[11px] font-bold uppercase tracking-[0.18em] ${darkMode ? 'bg-white text-[#171411]' : 'bg-[#2a2928] text-white'}`}>
          Envoyer ma demande de devis
        </button>
        <p className={`mt-4 font-sans text-[11px] ${darkMode ? 'text-stone-500' : 'text-[#8a7d72]'}`}>Sans engagement</p>
      </section>
    </form>
  );
}
