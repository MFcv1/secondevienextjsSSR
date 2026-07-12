export default function OrdersLoading() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]" aria-busy="true" aria-live="polite">
      <div className="border-b border-[#e8e8ed] bg-white">
        <div className="mx-auto flex min-h-[88px] max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-[#f0f0f2]" />
          <div className="h-10 w-44 animate-pulse rounded-full bg-[#f0f0f2]" />
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <div className="flex items-center gap-3 text-[13px] font-medium text-[#6e6e73]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#1d1d1f]" />
          Ouverture de votre espace…
        </div>

        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
          <div>
            <p className="text-[13px] font-medium text-[#6e6e73]">Espace personnel</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2.7rem,7vw,5.4rem)] font-semibold leading-[0.96] tracking-normal">
              Vos commandes, simplement.
            </h1>
          </div>
          <div className="rounded-[8px] border border-[#e8e8ed] bg-white p-5">
            <div className="h-4 w-28 animate-pulse rounded bg-[#e8e8ed]" />
            <div className="mt-4 h-7 w-56 max-w-full animate-pulse rounded bg-[#e8e8ed]" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="min-h-[116px] animate-pulse rounded-[8px] border border-[#e8e8ed] bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
