import { Layers, ArrowLeft, Search } from 'lucide-react'

export default function Loading() {
  return (
    <main
      className="min-h-screen pb-28"
      style={{
        background: `
          radial-gradient(ellipse at 20% 15%, rgba(99,102,241,0.18) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 85%, rgba(139,92,246,0.12) 0%, transparent 50%),
          radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          #07091A
        `,
        backgroundSize: 'auto, auto, 30px 30px, auto',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Sticky header — mirrors StoreDirectory exactly so no layout jump */}
      <div className="glass-dark sticky top-0 z-10">
        {/* ServeWise branding */}
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: '0 0 14px rgba(99,102,241,0.45)',
              }}
            >
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">ServeWise</span>
          </div>
          <p className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-white/35">
            Skip the line, virtually
          </p>
        </div>

        <div className="mx-auto max-w-2xl px-4 pb-3 pt-2">
          {/* Back + skeleton mall name */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </div>
            <div className="animate-pulse">
              <div className="mb-1.5 h-2 w-14 rounded-full bg-indigo-400/20" />
              <div className="h-4 w-36 rounded-full bg-white/15" />
            </div>
          </div>

          {/* Search bar placeholder */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <div
              className="h-10 w-full rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>
        </div>
      </div>

      {/* Store card skeletons */}
      <div className="mx-auto max-w-2xl space-y-2 px-4 py-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-3.5 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Category avatar */}
            <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-white/10" />

            {/* Info lines */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-28 rounded-full bg-white/15" />
                <div className="h-3 w-16 rounded-full bg-white/10" />
              </div>
              <div className="h-2.5 w-44 rounded-full bg-white/8" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
