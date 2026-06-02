'use client'

import { useState } from 'react'
import { Loader2, MapPinCheck, LogOut } from 'lucide-react'
import { MEQCountdown } from './MEQCountdown'
import { markCustomerReturning, exitMissedQueue } from '@/lib/actions/queue'
import type { Ticket } from '@/types'

interface MissedNoticeScreenProps {
  ticket: Ticket
  /** Called when the customer taps "I'm Here" — sets customer_returning = true in DB */
  onConfirmReturn: () => void
  /** Called when the customer taps "Exit Queue" — deletes the entry */
  onExit: () => void
  /** Called when the MEQ countdown reaches zero (client-side fallback for cleanup) */
  onCountdownExpired: () => void
}

export function MissedNoticeScreen({
  ticket,
  onConfirmReturn,
  onExit,
  onCountdownExpired,
}: MissedNoticeScreenProps) {
  const [returningLoading, setReturningLoading] = useState(false)
  const [exitLoading,      setExitLoading]      = useState(false)
  const [hasConfirmed,     setHasConfirmed]      = useState(ticket.customer_returning)
  const [error,            setError]             = useState<string | null>(null)

  const handleConfirmReturn = async () => {
    if (hasConfirmed) return
    setReturningLoading(true)
    setError(null)
    try {
      await markCustomerReturning(ticket.id)
      setHasConfirmed(true)
      onConfirmReturn()
    } catch {
      setError('Could not update your status. Please try again.')
    } finally {
      setReturningLoading(false)
    }
  }

  const handleExit = async () => {
    setExitLoading(true)
    setError(null)
    try {
      await exitMissedQueue(ticket.id)
      onExit()
    } catch {
      setError('Could not exit. Please try again.')
    } finally {
      setExitLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div
        className="rounded-3xl p-6 text-center"
        style={{
          background: 'rgba(245,158,11,0.07)',
          border:     '1px solid rgba(245,158,11,0.22)',
          boxShadow:  '0 0 32px rgba(245,158,11,0.05)',
        }}
      >
        {/* Queue number — permanent, never changes */}
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/60 mb-1">
          Your queue number
        </p>
        <p className="text-6xl font-black tabular-nums text-white leading-none mb-4">
          #{ticket.queue_number}
        </p>

        <div
          className="mx-auto mb-4 rounded-2xl px-4 py-2 text-sm font-semibold text-amber-300 inline-block"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          Missed — Return Window Open
        </div>

        <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
          You were called but weren&apos;t present. You have a limited window to return
          and confirm at the counter. Your queue number is reserved.
        </p>
      </div>

      {/* Countdown */}
      {ticket.meq_expires_at && (
        <div
          className="flex justify-center rounded-3xl py-8"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <MEQCountdown
            expiresAt={ticket.meq_expires_at}
            onExpired={onCountdownExpired}
          />
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Primary: I'm Here */}
        <button
          onClick={handleConfirmReturn}
          disabled={hasConfirmed || returningLoading || exitLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          style={
            hasConfirmed
              ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }
              : { background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }
          }
        >
          {returningLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Updating…</>
          ) : hasConfirmed ? (
            <><MapPinCheck className="h-5 w-5 text-emerald-400" /><span className="text-emerald-300">Notified — head to the counter</span></>
          ) : (
            <><MapPinCheck className="h-5 w-5" /> I&apos;m Here — Confirm at Counter</>
          )}
        </button>

        {/* Secondary: Exit Queue */}
        <button
          onClick={handleExit}
          disabled={exitLoading || returningLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        >
          {exitLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Exiting…</>
          ) : (
            <><LogOut className="h-4 w-4" /> Exit Queue</>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-white/20 px-4">
        Staff must click Reinstate on the dashboard to restore your place in the active queue.
      </p>
    </div>
  )
}
