import { Layers } from 'lucide-react'

export default function Loading() {
  return (
    <main
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(99,102,241,0.20) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 80%, rgba(139,92,246,0.14) 0%, transparent 50%),
          radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          #07091A
        `,
        backgroundSize: 'auto, auto, 30px 30px, auto',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header — identical to the real page so layout doesn't jump */}
      <header className="flex-shrink-0 px-5 pt-6">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.45)',
            }}
          >
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">ServeWise</span>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5">
        {/* Hero skeleton */}
        <div className="flex-shrink-0 animate-pulse pb-5 pt-5">
          <div className="mb-3 h-2.5 w-36 rounded-full bg-indigo-400/20" />
          <div className="space-y-2">
            <div className="h-11 w-52 rounded-lg bg-white/10" />
            <div className="h-11 w-44 rounded-lg bg-white/10" />
            <div className="h-11 w-48 rounded-lg bg-white/10" />
          </div>
          <div className="mt-3 h-3 w-60 rounded-full bg-white/8" />
          <div className="mt-4 flex items-center gap-1">
            {[80, 88, 84].map((w, i) => (
              <div
                key={i}
                className="h-7 rounded-full bg-white/8"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>

        {/* Mall card skeletons */}
        <div className="flex min-h-0 flex-1 flex-col pb-5">
          <div className="mb-2 flex animate-pulse items-center justify-between">
            <div className="h-2.5 w-20 rounded-full bg-white/10" />
            <div className="h-2.5 w-14 rounded-full bg-white/10" />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-1 animate-pulse items-center gap-4 rounded-2xl px-4 py-3 md:h-[72px] md:flex-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded-full bg-white/12" />
                  <div className="h-2.5 w-48 rounded-full bg-white/8" />
                </div>
                <div className="h-4 w-4 rounded bg-white/8" />
              </div>
            ))}
          </div>

          <p className="pt-3 text-center text-[10px] text-white/10">
            ServeWise · Real-time virtual queuing
          </p>
        </div>
      </div>
    </main>
  )
}
