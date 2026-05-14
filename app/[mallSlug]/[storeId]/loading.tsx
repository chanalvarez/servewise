import { Layers, ArrowLeft } from 'lucide-react'

export default function Loading() {
  return (
    <main
      className="flex min-h-screen flex-col"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 55%), #07091A',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header skeleton */}
      <div className="glass-dark sticky top-0 z-10">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft className="h-4 w-4 text-white/70" />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 0 14px rgba(99,102,241,0.45)' }}
            >
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">ServeWise</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        {/* Store name + vibe skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="mb-1.5 h-2.5 w-20 rounded-full bg-indigo-400/20" />
          <div className="mb-2 h-6 w-48 rounded-lg bg-white/15" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-white/20" />
            <div className="h-2.5 w-16 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Queue ticket card skeleton */}
        <div
          className="mb-4 animate-pulse rounded-3xl p-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Queue number circle */}
          <div className="mb-4 flex flex-col items-center">
            <div className="mb-3 h-2.5 w-28 rounded-full bg-white/10" />
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.2)' }}
            >
              <div className="h-10 w-16 rounded-lg bg-white/15" />
            </div>
          </div>

          {/* Status lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="h-3 w-24 rounded-full bg-white/10" />
              <div className="h-4 w-10 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="h-3 w-20 rounded-full bg-white/10" />
              <div className="h-4 w-14 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="h-3 w-28 rounded-full bg-white/10" />
              <div className="h-4 w-12 rounded-full bg-white/15" />
            </div>
          </div>
        </div>

        {/* Join queue button skeleton */}
        <div
          className="h-14 w-full animate-pulse rounded-2xl bg-indigo-600/30"
          style={{ animationDelay: '120ms' }}
        />
      </div>
    </main>
  )
}
