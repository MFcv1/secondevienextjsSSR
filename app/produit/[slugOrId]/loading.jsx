export default function ProductLoading() {
  return (
    <section className="min-h-screen bg-[#f7f3ee] px-5 py-10 text-stone-950 md:px-10 md:py-14" aria-busy="true">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
        <div className="aspect-[4/5] animate-pulse rounded-[1.5rem] bg-[#e6dccf]" />
        <div className="space-y-5">
          <div className="h-3 w-28 animate-pulse rounded-full bg-stone-300" />
          <div className="h-16 w-full max-w-lg animate-pulse rounded-2xl bg-stone-300" />
          <div className="h-5 w-40 animate-pulse rounded-full bg-stone-300" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-stone-200" />
          </div>
        </div>
      </div>
    </section>
  );
}
