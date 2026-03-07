'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { leaveQueue } from '@/lib/actions/queue'
import { NoShowCountdown } from './NoShowCountdown'
import type { ActiveTicket } from '@/types'

const STATUS_CONFIG = {
  waiting: {
    label: 'Waiting',
    labelStyle: { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' },
    cardStyle: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' },
    icon: Clock,
    iconClass: 'text-indigo-400',
  },
  called: {
    label: "It's your turn!",
    labelStyle: { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' },
    cardStyle: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' },
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
  },
  no_show: {
    label: 'No show',
    labelStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' },
    cardStyle: { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' },
    icon: XCircle,
    iconClass: 'text-red-400',
  },
  arrived: {
    label: 'Arrived',
    labelStyle: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' },
    cardStyle: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 0.6 },
    icon: CheckCircle2,
    iconClass: 'text-white/30',
  },
  voided: {
    label: 'Expired',
    labelStyle: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
    cardStyle: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 0.5 },
    icon: XCircle,
    iconClass: 'text-white/20',
  },
  completed: {
    label: 'Done',
    labelStyle: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
    cardStyle: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 0.5 },
    icon: CheckCircle2,
    iconClass: 'text-white/20',
  },
}

interface QueueTicketProps {
  ticket: ActiveTicket
  onRemove: () => void
}

export function QueueTicket({ ticket, onRemove }: QueueTicketProps) {
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const cfg = STATUS_CONFIG[ticket.status]
  const Icon = cfg.icon
  const aheadCount = Math.max(0, ticket.queue_number - ticket.store.current_serving - 1)

  const handleLeave = async () => {
    if (leaving) return
    setLeaving(true)
    setLeaveError(null)
    try {
      await leaveQueue(ticket.id)
      onRemove()
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : 'Could not leave queue')
      setLeaving(false)
    }
  }

  return (
    <div className="rounded-2xl p-4 transition-all" style={cfg.cardStyle}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 flex-shrink-0">
          <Icon className={`h-5 w-5 ${cfg.iconClass}`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <Link
            href={`/${ticket.store.mall.slug}/${ticket.store.id}`}
            className="mb-0.5 flex items-center gap-1 text-xs text-white/30 transition-colors hover:text-indigo-400"
          >
            {ticket.store.mall.name}
            <ExternalLink className="h-3 w-3" />
          </Link>

          <p className="truncate font-semibold text-white">{ticket.store.name}</p>

          {/* Ticket number + status */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-2xl font-black tabular-nums text-white">
              #{ticket.queue_number}
            </span>
            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={cfg.labelStyle}>
              {cfg.label}
            </span>
          </div>

          {ticket.status === 'waiting' && aheadCount > 0 && (
            <p className="mt-1 text-xs text-white/40">
              {aheadCount} {aheadCount === 1 ? 'person' : 'people'} ahead of you
            </p>
          )}
          {ticket.status === 'waiting' && aheadCount === 0 && (
            <p className="mt-1 text-xs font-medium text-amber-400">You&apos;re next!</p>
          )}
        </div>

        {/* Leave button */}
        {ticket.status === 'waiting' && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="Leave queue"
          >
            <X className="h-3.5 w-3.5 text-white/40" />
          </button>
        )}
      </div>

      {/* Leave error */}
      {leaveError && (
        <div
          className="mt-2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {leaveError}
        </div>
      )}

      {/* No-show countdown */}
      {ticket.status === 'no_show' && ticket.no_show_triggered_at && (
        <div
          className="mt-4 flex justify-center pt-4"
          style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}
        >
          <NoShowCountdown
            triggeredAt={ticket.no_show_triggered_at}
            onExpired={onRemove}
          />
        </div>
      )}
    </div>
  )
}
