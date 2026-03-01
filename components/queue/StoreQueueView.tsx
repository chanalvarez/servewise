'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MapPin, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { joinQueue } from '@/lib/actions/queue'
import { useActiveTickets } from '@/context/ActiveTicketsContext'
import { NowServingBoard } from './NowServingBoard'
import { NoShowCountdown } from './NoShowCountdown'
import { VibeStatusBadge } from '@/components/store/VibeStatusBadge'
import type { Mall, Store, Ticket } from '@/types'

interface StoreQueueViewProps {
  store: Store
  mall: Mall
  initialTickets: Ticket[]
}

export function StoreQueueView({ store: initialStore, mall, initialTickets }: StoreQueueViewProps) {
  const [store, setStore] = useState<Store>(initialStore)
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { tickets: activeTickets, refreshTickets, setDrawerOpen } = useActiveTickets()

  // My ticket for this store (from global context)
  const myTicket = activeTickets.find((t) => t.store.id === store.id)

  // Total in-queue = all active ticket statuses (waiting + called + no_show).
  // Store counters (last_queue_number - current_serving) are the ground truth
  // since actual ticket rows only exist for customers who joined via the app.
  const activeStatuses = ['waiting', 'called', 'no_show'] as const
  const ticketActiveCount = tickets.filter((t) =>
    activeStatuses.includes(t.status as typeof activeStatuses[number])
  ).length
  const storeQueueCount = Math.max(0, store.last_queue_number - store.current_serving)
  const waitingCount = Math.max(ticketActiveCount, storeQueueCount)

  // Realtime: store updates (vibe, current_serving, is_open)
  useEffect(() => {
    const supabase = createClient()

    const storeChannel = supabase
      .channel(`store-view-${store.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${store.id}` },
        (payload) => setStore(payload.new as Store)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(storeChannel)
    }
  }, [store.id])

  // Realtime: all tickets for this store (for waiting count)
  useEffect(() => {
    const supabase = createClient()

    const ticketsChannel = supabase
      .channel(`tickets-view-${store.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `store_id=eq.${store.id}` },
        () => {
          supabase
            .from('tickets')
            .select('*')
            .eq('store_id', store.id)
            .in('status', ['waiting', 'called', 'no_show'])
            .order('queue_number')
            .then(({ data }) => {
              setTickets(data ?? [])
              // Sync store counters too so waitingCount stays accurate
              supabase
                .from('stores')
                .select('last_queue_number, current_serving')
                .eq('id', store.id)
                .single()
                .then(({ data: s }) => {
                  if (s) setStore((prev) => ({ ...prev, ...s }))
                })
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ticketsChannel)
    }
  }, [store.id])

  const handleJoin = async () => {
    setJoining(true)
    setError(null)
    try {
      await joinQueue(store.id)
      await refreshTickets()
      setDrawerOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join queue')
    } finally {
      setJoining(false)
    }
  }

  const ticketStatusMessage = () => {
    if (!myTicket) return null
    switch (myTicket.status) {
      case 'called':
        return "It's your turn! Please head to the counter."
      case 'no_show':
        return 'You were called but not present. Arrive before the countdown ends.'
      case 'waiting': {
        const ahead = Math.max(0, myTicket.queue_number - store.current_serving - 1)
        return ahead === 0
          ? "You're next — get ready!"
          : `${ahead} ${ahead === 1 ? 'person' : 'people'} ahead of you`
      }
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${mall.slug}`}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight text-gray-900">{store.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                <p className="truncate text-xs text-gray-400">
                  {mall.name}
                  {(store.floor || store.unit_number) &&
                    ` · ${[store.floor, store.unit_number].filter(Boolean).join(' ')}`}
                </p>
              </div>
            </div>

            <VibeStatusBadge status={store.vibe_status} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {/* Now Serving board */}
        <NowServingBoard
          currentServing={store.current_serving}
          queueNumber={myTicket?.queue_number}
          waitingCount={waitingCount}
        />

        {/* No-show countdown (full-width) */}
        {myTicket?.status === 'no_show' && myTicket.no_show_triggered_at && (
          <div className="flex justify-center rounded-3xl border border-red-100 bg-red-50 py-8">
            <NoShowCountdown triggeredAt={myTicket.no_show_triggered_at} />
          </div>
        )}

        {/* Status / action area */}
        {myTicket ? (
          <div
            className={`rounded-2xl border p-5 text-center ${
              myTicket.status === 'called'
                ? 'border-emerald-200 bg-emerald-50'
                : myTicket.status === 'no_show'
                ? 'border-red-100 bg-red-50'
                : 'border-indigo-100 bg-indigo-50'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                myTicket.status === 'called'
                  ? 'text-emerald-700'
                  : myTicket.status === 'no_show'
                  ? 'text-red-700'
                  : 'text-indigo-700'
              }`}
            >
              You hold ticket{' '}
              <span className="text-lg font-black tabular-nums">#{myTicket.queue_number}</span>
            </p>
            {ticketStatusMessage() && (
              <p
                className={`mt-1 text-sm ${
                  myTicket.status === 'called'
                    ? 'text-emerald-600'
                    : myTicket.status === 'no_show'
                    ? 'text-red-600'
                    : 'text-indigo-500'
                }`}
              >
                {ticketStatusMessage()}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-400">
              Open the ticket drawer below to manage all your queues
            </p>
          </div>
        ) : (
          <>
            {!store.is_open ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <p className="font-semibold text-gray-500">This store is currently closed</p>
                <p className="mt-1 text-sm text-gray-400">Check back when it reopens</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Joining queue…
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Join Queue
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400">
                  No account needed — you&apos;ll get a ticket number instantly
                </p>
              </>
            )}
          </>
        )}

        {/* Staff link */}
        <div className="pt-4 text-center">
          <Link
            href={`/${mall.slug}/${store.id}/staff`}
            className="text-xs text-gray-300 transition-colors hover:text-gray-400"
          >
            Staff dashboard →
          </Link>
        </div>
      </div>
    </main>
  )
}
