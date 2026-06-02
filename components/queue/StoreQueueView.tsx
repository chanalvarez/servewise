'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MapPin, LogIn, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { syncRealtimeAuth } from '@/lib/supabase/realtimeAuth'
import { useActiveTickets } from '@/context/ActiveTicketsContext'
import { NowServingBoard } from './NowServingBoard'
import { NoShowCountdown } from './NoShowCountdown'
import { MissedNoticeScreen } from './MissedNoticeScreen'
import { VibeStatusBadge } from '@/components/store/VibeStatusBadge'
import type { Mall, Store, Ticket } from '@/types'
import { AlertDisplay } from '@/components/AlertDisplay'
import type { AlertState } from '@/components/AlertDisplay'
import { useAlertSystem } from '@/lib/hooks/useAlertSystem'
import { RatingOverlay } from './RatingOverlay'
import { exitMissedQueue } from '@/lib/actions/queue'

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
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')

  const { tickets: activeTickets, isLoading: ticketsLoading, refreshTickets, setDrawerOpen } = useActiveTickets()

  const { playCalledAlert, playNoShowAlert, playUrgentAlert, requestNotificationPermission, unlockAudio } = useAlertSystem()

  const [alertState, setAlertState] = useState<AlertState>('idle')
  const [calledAt, setCalledAt] = useState<string | null>(null)
  const prevStatusRef = useRef<string | undefined>(undefined)

  const [showRating,     setShowRating]     = useState(false)
  const [showMEQExpired, setShowMEQExpired] = useState(false)
  const lastTicketIdRef = useRef<string | null>(null)

  // ── Fix 2: missed-triggered guard ────────────────────────────────────────
  // Once this ticket reaches 'missed', any stale Realtime/polling fetch that
  // returns 'no_show' (out-of-order network response) is ignored completely.
  // Reset when the ticket disappears (new queue cycle).
  const missedTriggeredRef = useRef(false)

  // ── Reinstatement toast ───────────────────────────────────────────────────
  const [showReinstateToast,    setShowReinstateToast]    = useState(false)
  const shownReinstateToastsRef = useRef<Set<string>>(new Set())
  // Ref so Realtime callbacks always see the current myTicket without stale closure
  const myTicketRef = useRef<(typeof activeTickets)[0] | undefined>(undefined)

  // My ticket for this store (from global context)
  const myTicket = activeTickets.find((t) => t.store.id === store.id)

  useEffect(() => {
    myTicketRef.current = myTicket
  }, [myTicket])

  // Keep lastTicketIdRef current so the rating overlay can submit after the ticket disappears
  useEffect(() => {
    if (myTicket?.id) lastTicketIdRef.current = myTicket.id
  }, [myTicket?.id])

  // Total in-queue = all active ticket statuses (waiting + called + no_show).
  const activeStatuses = ['waiting', 'called', 'no_show'] as const
  const ticketActiveCount = tickets.filter((t) =>
    activeStatuses.includes(t.status as typeof activeStatuses[number])
  ).length
  const storeQueueCount = Math.max(0, store.last_queue_number - store.current_serving)
  const waitingCount = Math.max(ticketActiveCount, storeQueueCount)

  // ── Store polling (unconditional — no auth needed) ────────────────────────
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const pollStore = async () => {
      if (cancelled) return
      const { data } = await supabase
        .from('stores')
        .select('current_serving, last_queue_number, is_open, is_cutoff, vibe_status')
        .eq('id', store.id)
        .single()
      if (data && !cancelled) setStore((prev) => ({ ...prev, ...data }))
    }

    void pollStore()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void pollStore()
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [store.id])

  // ── Realtime: store updates ───────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let storeChannel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      await syncRealtimeAuth(supabase)
      if (cancelled) return

      const ch = supabase
        .channel(`store-view-${store.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${store.id}` },
          (payload) => setStore(payload.new as Store)
        )
        .subscribe()
      if (cancelled) { void supabase.removeChannel(ch); return }
      storeChannel = ch
    }

    void setup()

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') await syncRealtimeAuth(supabase)
    })

    return () => {
      cancelled = true
      authSub.unsubscribe()
      if (storeChannel) void supabase.removeChannel(storeChannel)
    }
  }, [store.id])

  // ── Realtime: tickets — queue board + reinstatement toast detection ───────
  const refetchTickets = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('tickets')
      .select('*')
      .eq('store_id', store.id)
      .in('status', ['waiting', 'called', 'no_show'])
      .order('queue_number')
      .then(({ data }) => setTickets(data ?? []))
  }, [store.id])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let ticketsChannel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      await syncRealtimeAuth(supabase)
      if (cancelled) return

      const ch = supabase
        .channel(`tickets-view-${store.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets', filter: `store_id=eq.${store.id}` },
          () => refetchTickets()
        )
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tickets', filter: `store_id=eq.${store.id}` },
          () => refetchTickets()
        )
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `store_id=eq.${store.id}` },
          (payload) => {
            const updated = payload.new as Ticket
            const current = myTicketRef.current

            // Reinstatement toast: fire when reinstated=true, the viewer is waiting, not their own ticket
            if (
              updated.reinstated === true &&
              current?.status === 'waiting' &&
              current?.id !== updated.id &&
              !shownReinstateToastsRef.current.has(updated.id)
            ) {
              shownReinstateToastsRef.current.add(updated.id)
              setShowReinstateToast(true)
              setTimeout(() => setShowReinstateToast(false), 5000)
            }

            refetchTickets()
          }
        )
        .subscribe()

      if (cancelled) { void supabase.removeChannel(ch); return }
      ticketsChannel = ch
    }

    void setup()

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') await syncRealtimeAuth(supabase)
    })

    return () => {
      cancelled = true
      authSub.unsubscribe()
      if (ticketsChannel) void supabase.removeChannel(ticketsChannel)
    }
  }, [store.id, refetchTickets])

  // ── Stable AlertDisplay callbacks ─────────────────────────────────────────
  // useCallback ensures these are the same reference across re-renders so they
  // never appear as changed deps inside AlertDisplay's countdown effects.
  const handleCalledExpired = useCallback(() => setAlertState('noshow'), [])

  // Guard: only transition to 'removed' if we haven't already entered 'missed'.
  // Prevents the 5-min AlertDisplay countdown from firing 'removed' after the
  // ticket has already transitioned via the pg_cron path.
  const handleNoShowExpired = useCallback(() => {
    if (!missedTriggeredRef.current) setAlertState('removed')
  }, [])

  // ── Status transition effects (alerts, rating, MEQ expiry) ───────────────
  useEffect(() => {
    const status = myTicket?.status
    const prev   = prevStatusRef.current
    prevStatusRef.current = status

    if (status === 'called' && prev !== 'called') {
      setCalledAt(new Date().toISOString())
      setAlertState('called')
      playCalledAlert()
      requestNotificationPermission()
      try { localStorage.setItem('servewise_alert', JSON.stringify({ type: 'called', storeId: store.id, storeName: store.name, mallSlug: mall.slug, timestamp: Date.now() })) } catch {}

    } else if (status === 'no_show' && prev !== 'no_show' && !missedTriggeredRef.current) {
      // Fix 2: skip this branch entirely if we already reached 'missed' for this ticket.
      // A stale out-of-order fetch could otherwise bounce us back to the noshow sound+banner.
      setAlertState('noshow')
      playNoShowAlert()
      try { localStorage.setItem('servewise_alert', JSON.stringify({ type: 'noshow', storeId: store.id, storeName: store.name, mallSlug: mall.slug, timestamp: Date.now() })) } catch {}

    } else if (status === 'missed' && prev !== 'missed') {
      // Fix 2: lock the guard so stale 'no_show' bounces are ignored from here on.
      missedTriggeredRef.current = true
      setAlertState('idle')
      try { localStorage.removeItem('servewise_alert') } catch {}

    } else if (status === 'arrived' || status === 'voided' || status === 'completed') {
      setAlertState('idle')
      try { localStorage.removeItem('servewise_alert') } catch {}

    } else if (!status) {
      // Ticket removed — reset missed guard for the next queue cycle
      missedTriggeredRef.current = false
      setAlertState('idle')
      try { localStorage.removeItem('servewise_alert') } catch {}
      if (prev === 'arrived') setShowRating(true)
      if (prev === 'missed')  setShowMEQExpired(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTicket?.status])

  // ── MEQ handlers ─────────────────────────────────────────────────────────

  const handleConfirmReturn = () => {
    // customer_returning=true is now in the DB; UI reflects it via MissedNoticeScreen's
    // local hasConfirmed state — no additional work needed in this component.
  }

  const handleExitQueue = () => {
    // exitMissedQueue RPC deletes the row; Realtime DELETE → refreshTickets → myTicket undefined
    // prevStatus will be 'missed', triggering setShowMEQExpired(true) above.
  }

  // Client-side fallback: countdown hit zero before pg_cron fired.
  const handleCountdownExpired = async () => {
    if (!myTicket) return
    try {
      await exitMissedQueue(myTicket.id)
    } catch {
      // pg_cron may have already deleted it — either way show the expired screen
    }
    setShowMEQExpired(true)
  }

  // ── Join handler ─────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (myTicket) {
      setDrawerOpen(true)
      return
    }

    setJoining(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) {
          setError('Unable to join. Please refresh and try again.')
          return
        }
      }

      const { error } = await supabase.rpc('join_queue', { p_store_id: store.id })

      if (error) {
        if (error.message.toLowerCase().includes('already in queue')) {
          await refreshTickets().catch(() => {})
          setDrawerOpen(true)
          return
        }
        setError(error.message)
        return
      }

      await refreshTickets().catch(() => {})
      setDrawerOpen(true)
      const perm = await requestNotificationPermission()
      if (perm === 'granted') setNotifStatus('granted')
      else if (perm === 'denied') setNotifStatus('denied')
    } catch {
      setError('Something went wrong. Please try again.')
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
      case 'arrived':
        return "You're being served — stay at the counter."
      case 'missed':
        return null  // handled by MissedNoticeScreen
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
    <main className="min-h-screen pb-32" style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 55%), #07091A', backgroundAttachment: 'fixed' }}>
      <AlertDisplay
        alertState={alertState}
        calledAt={calledAt}
        noShowAt={myTicket?.no_show_triggered_at ?? null}
        onCalledExpired={handleCalledExpired}
        onNoShowExpired={handleNoShowExpired}
        onTwoMinWarning={playUrgentAlert}
        onThirtySecWarning={playUrgentAlert}
      />

      {showRating && lastTicketIdRef.current && (
        <RatingOverlay
          ticketId={lastTicketIdRef.current}
          storeId={store.id}
          onDone={() => setShowRating(false)}
        />
      )}

      {/* Reinstatement notice toast — auto-dismisses after 5 s */}
      {showReinstateToast && (
        <div
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl px-4 py-3 shadow-xl"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border:     '1px solid rgba(99,102,241,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <p className="text-sm font-medium text-indigo-200 leading-snug">
            A previously called customer has returned and been reinserted into the queue.
            Your queue number stays the same — there may be a short additional wait.
          </p>
        </div>
      )}

      {/* Sticky header */}
      <div className="glass-dark sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${mall.slug}`}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight text-white">{store.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0 text-white/30" />
                <p className="truncate text-xs text-white/40">
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

      {/* ── Content area ───────────────────────────────────────────────────────
          Fix 3: when status === 'missed', render ONLY the MissedNoticeScreen.
          NowServingBoard, NoShowCountdown, and the join/status panel are hidden
          entirely — the missed screen takes over the full content area.
          The expiry screen follows the same exclusive pattern. */}
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">

        {showMEQExpired ? (
          /* ── MEQ expiry screen ─────────────────────────────────────────── */
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-4xl mb-4">⏱</p>
            <p className="text-lg font-bold text-white mb-2">Queue slot expired</p>
            <p className="text-sm text-white/50">
              Your queue slot has expired. Thank you for visiting.
            </p>
          </div>

        ) : myTicket?.status === 'missed' ? (
          /* ── MEQ missed notice — full content-area takeover ───────────── */
          <MissedNoticeScreen
            ticket={myTicket}
            onConfirmReturn={handleConfirmReturn}
            onExit={handleExitQueue}
            onCountdownExpired={handleCountdownExpired}
          />

        ) : (
          /* ── Normal queue UI ───────────────────────────────────────────── */
          <>
            {/* Now Serving board */}
            <NowServingBoard
              currentServing={store.current_serving}
              queueNumber={myTicket?.queue_number}
              waitingCount={waitingCount}
            />

            {/* No-show countdown (5-min window, before transitioning to missed) */}
            {myTicket?.status === 'no_show' && myTicket.no_show_triggered_at && (
              <div
                className="flex justify-center rounded-3xl py-8"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
              >
                <NoShowCountdown triggeredAt={myTicket.no_show_triggered_at} />
              </div>
            )}

            {myTicket && store.is_cutoff && (
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'rgba(251,146,60,0.08)',
                  border: '1px solid rgba(251,146,60,0.25)',
                }}
              >
                <Clock className="h-4 w-4 flex-shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Queue is now closed</p>
                  <p className="text-xs text-amber-400/60">This store is no longer accepting new customers</p>
                </div>
              </div>
            )}

            {ticketsLoading ? (
              <div
                className="rounded-2xl p-5 text-center animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="mx-auto h-3 w-32 rounded-full bg-white/10" />
                <div className="mx-auto mt-2 h-3 w-20 rounded-full bg-white/07" />
              </div>
            ) : myTicket ? (
              <div
                className="rounded-2xl p-5 text-center"
                style={
                  myTicket.status === 'called'
                    ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }
                    : myTicket.status === 'no_show'
                    ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }
                    : myTicket.status === 'arrived'
                    ? { background: 'rgba(99,102,241,0.13)', border: '1px solid rgba(99,102,241,0.35)' }
                    : { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }
                }
              >
                <p
                  className={`text-sm font-semibold ${
                    myTicket.status === 'called'
                      ? 'text-emerald-400'
                      : myTicket.status === 'no_show'
                      ? 'text-red-400'
                      : myTicket.status === 'arrived'
                      ? 'text-indigo-300'
                      : 'text-indigo-300'
                  }`}
                >
                  You hold ticket{' '}
                  <span className="text-lg font-black tabular-nums text-white">#{myTicket.queue_number}</span>
                </p>
                {ticketStatusMessage() && (
                  <p
                    className={`mt-1 text-sm ${
                      myTicket.status === 'called'
                        ? 'text-emerald-400/80'
                        : myTicket.status === 'no_show'
                        ? 'text-red-400/80'
                        : 'text-indigo-300/80'
                    }`}
                  >
                    {ticketStatusMessage()}
                  </p>
                )}
                <p className="mt-3 text-xs text-white/30">
                  Open the ticket drawer below to manage all your queues
                </p>
              </div>
            ) : (
              <>
                {!store.is_open ? (
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <p className="font-semibold text-white/60">This store is currently closed</p>
                    <p className="mt-1 text-sm text-white/30">Check back when it reopens</p>
                  </div>
                ) : store.is_cutoff ? (
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{
                      background: 'rgba(251,146,60,0.08)',
                      border: '1px solid rgba(251,146,60,0.25)',
                      boxShadow: '0 0 24px rgba(251,146,60,0.06)',
                    }}
                  >
                    <div className="mb-3 flex justify-center">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}
                      >
                        <Clock className="h-6 w-6 text-amber-400" />
                      </div>
                    </div>
                    <p className="font-semibold text-amber-300">Queue is now closed</p>
                    <p className="mt-1 text-sm text-amber-400/60">
                      This store is closing soon and is no longer accepting new customers
                    </p>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div
                        className="rounded-xl px-4 py-3 text-sm text-red-400"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        {error}
                      </div>
                    )}
                    {notifStatus === 'granted' && (
                      <div
                        className="rounded-xl px-4 py-3 text-sm text-emerald-400"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        Notifications enabled — we&apos;ll alert you when your turn is near
                      </div>
                    )}
                    {notifStatus === 'denied' && (
                      <div
                        className="rounded-xl px-4 py-3 text-sm text-amber-400"
                        style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}
                      >
                        Notifications blocked — keep this page open to receive alerts
                      </div>
                    )}
                    <button
                      onClick={handleJoin}
                      onPointerDown={unlockAudio}
                      disabled={joining}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-semibold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        boxShadow: '0 0 24px rgba(99,102,241,0.4)',
                      }}
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
                    <p className="text-center text-xs text-white/30">
                      No account needed — you&apos;ll get a ticket number instantly
                    </p>
                  </>
                )}
              </>
            )}
          </>
        )}

      </div>
    </main>
  )
}
