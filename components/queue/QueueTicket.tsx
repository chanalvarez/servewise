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
    labelClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    cardClass: 'border-gray-100 bg-white',
    icon: Clock,
    iconClass: 'text-blue-400',
  },
  called: {
    label: "It's your turn!",
    labelClass: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    cardClass: 'border-emerald-200 bg-emerald-50/50',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
  },
  no_show: {
    label: 'No show',
    labelClass: 'bg-red-50 text-red-700 ring-1 ring-red-100',
    cardClass: 'border-red-100 bg-red-50/30',
    icon: XCircle,
    iconClass: 'text-red-400',
  },
  arrived: {
    label: 'Arrived',
    labelClass: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    cardClass: 'border-gray-100 bg-white opacity-60',
    icon: CheckCircle2,
    iconClass: 'text-gray-400',
  },
  voided: {
    label: 'Expired',
    labelClass: 'bg-gray-100 text-gray-400 ring-1 ring-gray-200',
    cardClass: 'border-gray-100 bg-white opacity-50',
    icon: XCircle,
    iconClass: 'text-gray-300',
  },
  completed: {
    label: 'Done',
    labelClass: 'bg-gray-100 text-gray-400 ring-1 ring-gray-200',
    cardClass: 'border-gray-100 bg-white opacity-50',
    icon: CheckCircle2,
    iconClass: 'text-gray-300',
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
    <div className={`rounded-2xl border p-4 transition-all ${cfg.cardClass}`}>
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
            className="mb-0.5 flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors"
          >
            {ticket.store.mall.name}
            <ExternalLink className="h-3 w-3" />
          </Link>

          <p className="truncate font-semibold text-gray-900">{ticket.store.name}</p>

          {/* Ticket number + status */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-2xl font-black tabular-nums text-gray-900">
              #{ticket.queue_number}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.labelClass}`}>
              {cfg.label}
            </span>
          </div>

          {ticket.status === 'waiting' && aheadCount > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {aheadCount} {aheadCount === 1 ? 'person' : 'people'} ahead of you
            </p>
          )}
          {ticket.status === 'waiting' && aheadCount === 0 && (
            <p className="mt-1 text-xs font-medium text-amber-600">You&apos;re next!</p>
          )}
        </div>

        {/* Leave button — only for waiting tickets */}
        {ticket.status === 'waiting' && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
            title="Leave queue"
          >
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Leave error */}
      {leaveError && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {leaveError}
        </div>
      )}

      {/* No-show countdown */}
      {ticket.status === 'no_show' && ticket.no_show_triggered_at && (
        <div className="mt-4 flex justify-center border-t border-red-100 pt-4">
          <NoShowCountdown
            triggeredAt={ticket.no_show_triggered_at}
            onExpired={onRemove}
          />
        </div>
      )}
    </div>
  )
}
