export default function OrdersLoading() {
  return (
    <main
      className="relative isolate min-h-screen bg-[#f1efec] text-[#1a1918]"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(1100px_620px_at_8%_-12%,rgba(196,150,112,0.28),transparent_68%),radial-gradient(880px_520px_at_96%_2%,rgba(122,142,158,0.18),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-28">
        <div className="flex h-7 items-center gap-2 text-[13px] font-semibold text-[#9d968e]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#8b5c42]" />
          Ouverture de votre espace…
        </div>

        <section className="grid gap-6 pb-7 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,352px)] lg:items-center lg:gap-10">
          <div className="flex items-center gap-4">
            <span
              className="h-[54px] w-[54px] flex-none rounded-[17px] bg-[linear-gradient(158deg,#a5714d_0%,#7c4a30_58%,#5e3823_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-10px_rgba(94,56,35,0.72)]"
            />
            <div className="min-w-0">
              <div className="h-9 w-64 max-w-full animate-pulse rounded-lg bg-[#e9e5e1]" />
              <div className="mt-3 h-3.5 w-48 max-w-full animate-pulse rounded bg-[#eeeae6]" />
            </div>
          </div>

          <div className="rounded-[18px] bg-white p-4 shadow-[0_0_0_0.5px_rgba(28,25,23,0.09),0_1px_1px_rgba(28,25,23,0.03),0_10px_26px_-18px_rgba(28,25,23,0.24)]">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#9d968e]">Dernier dossier</p>
            <div className="mt-3.5 flex items-center gap-3">
              <div className="h-[52px] w-[52px] animate-pulse rounded-[12px] bg-[#f0edea]" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-[#f0edea]" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#f4f1ee]" />
              </div>
            </div>
            <div className="mt-4 h-9 w-full animate-pulse rounded-full bg-[#f4f1ee]" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-[rgba(28,25,23,0.09)] shadow-[0_0_0_0.5px_rgba(28,25,23,0.09),0_10px_26px_-18px_rgba(28,25,23,0.24)] md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="min-h-[122px] bg-white p-[18px]">
              <div className="h-[30px] w-[30px] animate-pulse rounded-[9px] bg-[#f0edea]" />
              <div className="mt-[38px] h-6 w-16 animate-pulse rounded bg-[#f0edea]" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[#f4f1ee]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
