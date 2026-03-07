interface NowServingBoardProps {
  currentServing: number
  queueNumber?: number
  waitingCount: number
}

export function NowServingBoard({
  currentServing,
  queueNumber,
  waitingCount,
}: NowServingBoardProps) {
  const isCalled = queueNumber !== undefined && queueNumber === currentServing
  const isNext = queueNumber !== undefined && queueNumber === currentServing + 1
  const aheadCount = queueNumber
    ? Math.max(0, queueNumber - currentServing - 1)
    : null

  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Hero number */}
      <div
        className="flex flex-col items-center px-6 py-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200/80">
          Now Serving
        </p>
        <p
          className={`tabular-nums font-black leading-none text-white transition-all duration-300 ${
            isCalled ? 'scale-110 text-8xl' : 'text-8xl'
          }`}
          style={{ textShadow: '0 0 40px rgba(255,255,255,0.25)' }}
        >
          {currentServing === 0 ? '—' : currentServing}
        </p>
        {isCalled && (
          <span
            className="mt-5 animate-bounce rounded-full px-4 py-1.5 text-sm font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            Your turn — head to the counter!
          </span>
        )}
      </div>

      {/* Stats row — glass dark */}
      <div
        className="grid grid-cols-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex flex-col items-center py-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-2xl font-bold tabular-nums text-white">{waitingCount}</p>
          <p className="mt-0.5 text-xs text-white/40">in queue</p>
        </div>

        <div className="flex flex-col items-center py-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {queueNumber ? (
            <>
              <p className="text-2xl font-bold tabular-nums text-gradient">#{queueNumber}</p>
              <p className="mt-0.5 text-xs text-white/40">your ticket</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-white/20">—</p>
              <p className="mt-0.5 text-xs text-white/40">your ticket</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center py-4">
          {aheadCount !== null ? (
            <>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  aheadCount === 0 ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {aheadCount}
              </p>
              <p className="mt-0.5 text-xs text-white/40">ahead</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-white/20">—</p>
              <p className="mt-0.5 text-xs text-white/40">ahead</p>
            </>
          )}
        </div>
      </div>

      {isNext && !isCalled && (
        <div
          className="px-4 py-2.5 text-center"
          style={{ background: 'rgba(245,158,11,0.12)', borderTop: '1px solid rgba(245,158,11,0.2)' }}
        >
          <p className="text-sm font-semibold text-amber-400">You&apos;re next — please be ready!</p>
        </div>
      )}
    </div>
  )
}
