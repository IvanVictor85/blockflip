// Loading state da rota raiz — previne CLS (Cumulative Layout Shift)
// O Next.js usa este arquivo automaticamente com React Suspense
export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-border bg-background/95" />

      {/* Hero skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
        <div className="h-4 w-24 rounded-full bg-secondary mx-auto" />
        <div className="h-12 w-3/4 rounded-lg bg-secondary mx-auto" />
        <div className="h-12 w-1/2 rounded-lg bg-secondary mx-auto" />
        <div className="h-5 w-2/3 rounded bg-secondary/60 mx-auto" />
        <div className="flex gap-4 justify-center pt-4">
          <div className="h-11 w-40 rounded-lg bg-[#14F195]/20" />
          <div className="h-11 w-36 rounded-lg bg-secondary" />
        </div>
      </div>

      {/* Asset cards skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="h-48 bg-secondary" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 rounded bg-secondary" />
                <div className="h-4 w-1/2 rounded bg-secondary/60" />
                <div className="h-16 rounded-lg bg-secondary/40" />
                <div className="h-2 rounded-full bg-secondary" />
                <div className="h-9 rounded-lg bg-secondary" />
                <div className="h-8 rounded-lg bg-secondary/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
