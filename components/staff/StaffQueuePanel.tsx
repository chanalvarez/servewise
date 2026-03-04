'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { callNext, markNoShow, markArrived } from '@/lib/actions/queue'
import { NoShowCountdown } from '@/components/queue/NoShowCountdown'
import { SkipForward, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import type { Ticket } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Waiting',
  called: 'Called',
  no_show: 'No Show',
  arrived: 'Arrived',
  voided: 'Voided',
  completed: 'Done',
}

interface StaffQueuePanelProps {
  storeId: string
  initialTickets: Ticket[]
}

export function StaffQueuePanel({ storeId, initialTickets }: StaffQueuePanelProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams<{ mallSlug: string; storeId: string }>()

  // Redirect to login if the staff session expires or is replaced by anonymous auth
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAnonymous = session?.user?.is_anonymous ?? true
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && isAnonymous)) {
        router.replace(`/${params.mallSlug}/${params.storeId}/staff/login`)
      }
    })
    return () => subscription.unsubscribe()
  }, [router, params.mallSlug, params.storeId])

  // Realtime: keep ticket list live for staff dashboard
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`staff-panel-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [...prev, payload.new as Ticket])
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Ticket).id ? (payload.new as Ticket) : t
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter((t) => t.id !== (payload.old as Ticket).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key)
    try {
      await fn()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const activeTickets = tickets.filter((t) =>
    ['waiting', 'called', 'no_show'].includes(t.status)
  )
  const waitingCount = tickets.filter((t) => t.status === 'waiting').length

  return (
    <div className="space-y-4">
      {/* Call Next CTA */}
      <button
        onClick={() => act('call_next', () => callNext(storeId))}
        disabled={loading === 'call_next' || waitingCount === 0}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SkipForward className="h-5 w-5" />
        Call Next
        {waitingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-sm">
            <Users className="h-3.5 w-3.5" />
            {waitingCount}
          </span>
        )}
      </button>

      {/* Queue list */}
      {activeTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-500">Queue is empty</p>
          <p className="text-sm text-gray-400">New customers will appear here instantly</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeTickets.map((ticket) => {
            const isCalled = ticket.status === 'called'
            const isNoShow = ticket.status === 'no_show'

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isCalled
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : isNoShow
                    ? 'border-red-100 bg-red-50/60'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Ticket number + status */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black tabular-nums text-gray-900">
                      #{ticket.queue_number}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isCalled
                          ? 'bg-emerald-100 text-emerald-700'
                          : isNoShow
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_LABEL[ticket.status]}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {isCalled && (
                      <>
                        <button
                          onClick={() =>
                            act(`${ticket.id}_noshow`, () => markNoShow(ticket.id))
                          }
                          disabled={loading === `${ticket.id}_noshow`}
                          className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          No Show
                        </button>
                        <button
                          onClick={() =>
                            act(`${ticket.id}_arrived`, () => markArrived(ticket.id))
                          }
                          disabled={loading === `${ticket.id}_arrived`}
                          className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Arrived
                        </button>
                      </>
                    )}
                    {isNoShow && (
                      <button
                        onClick={() =>
                          act(`${ticket.id}_arrived`, () => markArrived(ticket.id))
                        }
                        disabled={loading === `${ticket.id}_arrived`}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Arrived
                      </button>
                    )}
                  </div>
                </div>

                {/* No-show countdown */}
                {isNoShow && ticket.no_show_triggered_at && (
                  <div className="mt-4 flex justify-center border-t border-red-100 pt-4">
                    <NoShowCountdown triggeredAt={ticket.no_show_triggered_at} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
