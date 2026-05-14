import { ArrowLeft, Store } from 'lucide-react'

export default function Loading() {
  return (
    <main
      className="min-h-screen pb-16"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 55%), #07091A',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Sticky header skeleton */}
      <div className="glass-dark sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex animate-pulse items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Store className="h-3 w-3 text-indigo-400/50" />
                <div className="h-2 w-20 rounded-full bg-indigo-400/20" />
              </div>
              <div className="h-4 w-40 rounded-full bg-white/15" />
            </div>
            <div className="h-8 w-20 rounded-xl bg-white/8" />
          </div>
        </div>

        {/* Vibe toggle skeleton */}
        <div className="mx-auto max-w-2xl overflow-x-auto px-4 pb-3">
          <div className="flex animate-pulse gap-2" style={{ animationDelay: '60ms' }}>
            {[72, 80, 64].map((w, i) => (
              <div key={i} className="h-9 rounded-xl bg-white/8" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Cutoff button skeleton */}
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="h-10 w-full animate-pulse rounded-xl bg-white/5" style={{ animationDelay: '100ms' }} />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div
          className="mb-4 flex animate-pulse gap-1 rounded-xl p-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 flex-1 rounded-lg bg-white/8" />
          ))}
        </div>

        {/* Ticket card skeletons */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-5 w-12 rounded-full bg-white/15" />
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="h-3 w-20 rounded-full bg-white/8" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 rounded-xl bg-white/8" />
                  <div className="h-9 w-20 rounded-xl bg-white/8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
