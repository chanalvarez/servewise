'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabaseRealtime } from '@/lib/supabase/clients'
import { syncRealtimeAuth } from '@/lib/supabase/realtimeAuth'
import { reinstateEntry, removeMissedEntry } from '@/lib/actions/queue'
import { MEQCountdown } from '@/components/queue/MEQCountdown'
import { RotateCcw, Trash2, Users } from 'lucide-react'
import type { Ticket } from '@/types'

interface MissedQueueTabProps {
  storeId: string
  /** Activates the tab — triggers initial fetch and live subscriptions */
  activated: boolean
}

function formatTimeSince(isoString: string): string {
  const diffMs  = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1)  return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60)  return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? '1 hr ago' : `${hours} hrs ago`
}

export function MissedQueueTab({ storeId, activated }: MissedQueueTabProps) {
  const [missedTickets, setMissedTickets] = useState<Ticket[]>([])
  const [loading,       setLoading]       = useState<string | null>(null)
  const [fetched,       setFetched]       = useState(false)

  const fetchMissed = useCallback(async () => {
    const supabase = supabaseRealtime
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'missed')
      .order('updated_at', { ascending: true })
    setMissedTickets((data as Ticket[]) ?? [])
    setFetched(true)
  }, [storeId])

  // Initial fetch + polling once the tab is activated
  useEffect(() => {
    if (!activated) return
    void fetchMissed()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchMissed()
    }, 5000)
    return () => clearInterval(id)
  }, [activated, fetchMissed])

  // Realtime subscription — fires on any ticket change for this store
  useEffect(() => {
    if (!activated) return
    const supabase = supabaseRealtime
    let cancelled  = false
    let channel:    ReturnType<typeof supabase.channel> | null = null

    const subscribe = async () => {
      await syncRealtimeAuth(supabase)
      if (cancelled) return

      const { data: { session } } = await supabase.auth.getSession()
      const isAnonymous = session?.user?.is_anonymous ?? true
      if (!session || isAnonymous) return

      channel = supabase
        .channel(`staff-missed-${storeId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets', filter: `store_id=eq.${storeId}` },
          () => void fetchMissed()
        )
        .subscribe()

      if (cancelled) {
        if (channel) void supabase.removeChannel(channel)
      }
    }

    void subscribe()

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') await syncRealtimeAuth(supabase)
    })

    return () => {
      cancelled = true
      authSub.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [activated, storeId, fetchMissed])

  const act = async (key: string, fn: () => Promise<void>) => {
    setLoading(key)
    try {
      await fn()
      void fetchMissed()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  if (!activated || !fetched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
      </div>
    )
  }

  if (missedTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Users className="h-6 w-6 text-white/30" />
        </div>
        <p className="font-semibold text-white/50">No missed entries</p>
        <p className="text-sm text-white/30">Customers who miss their call will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {missedTickets.map((ticket) => {
        const isReinstated    = ticket.reinstated
        const isReturning     = ticket.customer_returning
        const reinstateKey    = `${ticket.id}_reinstate`
        const removeKey       = `${ticket.id}_remove`

        return (
          <div
            key={ticket.id}
            className="rounded-2xl p-4"
            style={{
              background: isReturning
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: isReturning
                ? '1px solid rgba(245,158,11,0.25)'
                : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Top row: number + badges + actions */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Queue number */}
                <span className="text-2xl font-black tabular-nums text-white">
                  #{ticket.queue_number}
                </span>

                {/* Time since missed */}
                <span className="text-xs text-white/40">
                  Missed {formatTimeSince(ticket.updated_at)}
                </span>

                {/* On their way badge */}
                {isReturning && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-amber-300"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
                  >
                    🚶 On their way
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => act(reinstateKey, () => reinstateEntry(ticket.id, storeId))}
                  disabled={isReinstated || loading === reinstateKey || loading === removeKey}
                  title={isReinstated ? 'Already reinstated' : 'Reinstate into active queue'}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={
                    isReinstated
                      ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.06)' }
                      : { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {loading === reinstateKey ? 'Reinstating…' : isReinstated ? 'Reinstated' : 'Reinstate'}
                </button>

                <button
                  onClick={() => act(removeKey, () => removeMissedEntry(ticket.id))}
                  disabled={loading === removeKey || loading === reinstateKey}
                  title="Permanently remove this entry"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {loading === removeKey ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>

            {/* MEQ countdown */}
            {ticket.meq_expires_at && !isReinstated && (
              <div
                className="mt-3 flex justify-center border-t pt-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <MEQCountdown
                  expiresAt={ticket.meq_expires_at}
                  onExpired={() => void fetchMissed()}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
