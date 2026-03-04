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
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Hero number */}
      <div className="flex flex-col items-center bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Now Serving
        </p>
        <p
          className={`tabular-nums font-black leading-none text-white transition-transform duration-300 ${
            isCalled ? 'scale-110 text-8xl' : 'text-8xl'
          }`}
        >
          {currentServing === 0 ? '—' : currentServing}
        </p>
        {isCalled && (
          <span className="mt-4 animate-bounce rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/30">
            Your turn — head to the counter!
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 px-0">
        <div className="flex flex-col items-center py-4">
          <p className="text-2xl font-bold tabular-nums text-gray-900">{waitingCount}</p>
          <p className="mt-0.5 text-xs text-gray-400">in queue</p>
        </div>

        <div className="flex flex-col items-center py-4">
          {queueNumber ? (
            <>
              <p className="text-2xl font-bold tabular-nums text-indigo-600">#{queueNumber}</p>
              <p className="mt-0.5 text-xs text-gray-400">your ticket</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-200">—</p>
              <p className="mt-0.5 text-xs text-gray-400">your ticket</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center py-4">
          {aheadCount !== null ? (
            <>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  aheadCount === 0 ? 'text-emerald-600' : 'text-gray-900'
                }`}
              >
                {aheadCount}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">ahead</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-200">—</p>
              <p className="mt-0.5 text-xs text-gray-400">ahead</p>
            </>
          )}
        </div>
      </div>

      {isNext && !isCalled && (
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-center">
          <p className="text-sm font-semibold text-amber-700">You&apos;re next — please be ready!</p>
        </div>
      )}
    </div>
  )
}
