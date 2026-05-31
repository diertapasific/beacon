function Bar({ className = "" }: { className?: string }) {
  return <div className={`beacon-shimmer rounded-lg ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="bg-paper min-h-[100dvh]">
      {/* Rail placeholder (desktop) */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-[68px] border-r-2 border-line bg-cream" />

      <div className="md:pl-[68px]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-20">
          <Bar className="h-3 w-28 mb-3" />
          <Bar className="h-10 w-64 mb-8" />

          {/* stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border-2 border-line bg-cream p-4">
                <Bar className="h-2.5 w-16 mb-2" />
                <Bar className="h-6 w-12" />
              </div>
            ))}
          </div>

          <Bar className="h-3 w-full mt-5 rounded-full" />

          {/* next up */}
          <div className="mt-8 rounded-2xl border-2 border-line bg-cream overflow-hidden shadow-hard">
            <div className="h-2.5 bg-clay border-b-2 border-line" />
            <div className="p-6">
              <Bar className="h-4 w-28 mb-3" />
              <Bar className="h-7 w-3/4" />
            </div>
          </div>

          {/* curriculum */}
          <Bar className="h-3 w-24 mt-12 mb-4" />
          <div className="rounded-xl border-2 border-line bg-cream overflow-hidden shadow-hard divide-y-2 divide-line">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Bar className="h-8 w-8 rounded-lg" />
                <Bar className="h-4 flex-1 max-w-[12rem]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
