export default function CategoryLoading() {
  return (
    <section className="min-h-screen bg-[#f7f3ee] px-5 py-10 text-stone-950 md:px-10 md:py-14" aria-busy="true">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="max-w-3xl space-y-5">
          <div className="h-3 w-28 animate-pulse rounded-full bg-stone-300" />
          <div className="h-16 w-full max-w-lg animate-pulse rounded-2xl bg-stone-300" />
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-stone-200" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="space-y-3" key={index}>
              <div className="aspect-[3/4] animate-pulse rounded-xl bg-[#e6dccf]" />
              <div className="h-6 w-3/4 animate-pulse rounded-full bg-stone-300" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
