'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, AlertTriangle, UserX } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type AlertState = 'idle' | 'called' | 'noshow' | 'removed'

export interface AlertDisplayProps {
  alertState: AlertState
  /** ISO timestamp when ticket became 'called' — drives the 2-min countdown */
  calledAt?: string | null
  /** ticket.no_show_triggered_at — drives the 5-min countdown */
  noShowAt?: string | null
  /** Fired when the 2-min 'called' countdown reaches zero */
  onCalledExpired?: () => void
  /** Fired when the 5-min no-show countdown reaches zero */
  onNoShowExpired?: () => void
  /** Fired once when ≤120 seconds remain in the no-show countdown */
  onTwoMinWarning?: () => void
  /** Fired once when ≤30 seconds remain in the no-show countdown */
  onThirtySecWarning?: () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TWO_MIN_MS  = 2 * 60 * 1000
const FIVE_MIN_MS = 5 * 60 * 1000

// ── Helper ────────────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AlertDisplay({
  alertState,
  calledAt,
  noShowAt,
  onCalledExpired,
  onNoShowExpired,
  onTwoMinWarning,
  onThirtySecWarning,
}: AlertDisplayProps) {
  const [calledMs, setCalledMs]   = useState(TWO_MIN_MS)
  const [noShowMs, setNoShowMs]   = useState(FIVE_MIN_MS)
  const twoMinFired    = useRef(false)
  const thirtySecFired = useRef(false)

  // 2-minute countdown — active while customer is in 'called' state
  useEffect(() => {
    if (alertState !== 'called' || !calledAt) return
    const tick = () => {
      const left = Math.max(0, TWO_MIN_MS - (Date.now() - new Date(calledAt).getTime()))
      setCalledMs(left)
      if (left === 0) onCalledExpired?.()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [alertState, calledAt, onCalledExpired])

  // 5-minute countdown — active while no-show protocol is running
  useEffect(() => {
    if (alertState !== 'noshow' || !noShowAt) return
    twoMinFired.current    = false
    thirtySecFired.current = false
    const tick = () => {
      const left = Math.max(0, FIVE_MIN_MS - (Date.now() - new Date(noShowAt).getTime()))
      setNoShowMs(left)
      if (left <= 120_000 && !twoMinFired.current) {
        twoMinFired.current = true
        onTwoMinWarning?.()
      }
      if (left <= 30_000 && !thirtySecFired.current) {
        thirtySecFired.current = true
        onThirtySecWarning?.()
      }
      if (left === 0) onNoShowExpired?.()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [alertState, noShowAt, onNoShowExpired, onTwoMinWarning, onThirtySecWarning])

  if (alertState === 'idle') return null

  // ── Called state ───────────────────────────────────────────────────────────

  if (alertState === 'called') {
    const urgency =
      calledMs <= 10_000  ? 'red'
      : calledMs <= 30_000  ? 'orange'
      : calledMs <= 60_000  ? 'yellow'
      : 'green'

    const theme = {
      green:  { bg: 'bg-emerald-500', pulse: 'bg-emerald-300', sub: 'text-emerald-100' },
      yellow: { bg: 'bg-yellow-500',  pulse: 'bg-yellow-300',  sub: 'text-yellow-100'  },
      orange: { bg: 'bg-orange-500',  pulse: 'bg-orange-300',  sub: 'text-orange-100'  },
      red:    { bg: 'bg-red-500',     pulse: 'bg-red-300',     sub: 'text-red-100'     },
    }[urgency]

    return (
      <div className={`fixed inset-x-0 top-0 z-50 ${theme.bg} shadow-lg`}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${theme.pulse} opacity-75`} />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${theme.pulse}`} />
          </span>
          <Bell className="h-4 w-4 flex-shrink-0 text-white" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">
              It&apos;s your turn! Please return to the store.
            </p>
            <p className={`text-xs ${theme.sub}`}>Head to the counter now</p>
          </div>
          {calledAt && (
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-black tabular-nums text-white">{fmt(calledMs)}</p>
              <p className={`text-xs ${theme.sub}`}>remaining</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── No-show state ──────────────────────────────────────────────────────────

  if (alertState === 'noshow') {
    const urgency =
      noShowMs <= 30_000  ? 'red'
      : noShowMs <= 120_000 ? 'orange'
      : 'yellow'

    const theme = {
      yellow: { bg: 'bg-amber-500',  pulse: 'bg-amber-300',  sub: 'text-amber-100'  },
      orange: { bg: 'bg-orange-500', pulse: 'bg-orange-300', sub: 'text-orange-100' },
      red:    { bg: 'bg-red-600',    pulse: 'bg-red-300',    sub: 'text-red-100'    },
    }[urgency]

    return (
      <div className={`fixed inset-x-0 top-0 z-50 ${theme.bg} shadow-lg`}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${theme.pulse} opacity-75`} />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${theme.pulse}`} />
          </span>
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-white" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">
              ⚠️ No-Show Protocol Active
            </p>
            <p className={`text-xs ${theme.sub}`}>Return now or lose your spot</p>
          </div>
          {noShowAt && (
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-black tabular-nums text-white">{fmt(noShowMs)}</p>
              <p className={`text-xs ${theme.sub}`}>remaining</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Removed state ──────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-gray-600 shadow-lg">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <UserX className="h-4 w-4 flex-shrink-0 text-white" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            You have been removed from the queue.
          </p>
          <p className="text-xs text-gray-300">
            Your spot has expired — you may rejoin if the queue is still open
          </p>
        </div>
      </div>
    </div>
  )
}
