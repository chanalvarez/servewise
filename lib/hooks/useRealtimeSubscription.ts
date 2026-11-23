'use client'

import { useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { syncRealtimeAuth } from '@/lib/supabase/realtimeAuth'

export type RealtimeStatus = 'connecting' | 'live' | 'reconnecting'

export interface RealtimeBinding {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  filter?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (payload: RealtimePostgresChangesPayload<Record<string, any>>) => void
}

interface Options {
  /** Base channel name; a counter is appended per (re)subscribe so a retry can never reuse a half-closed channel */
  name: string
  bindings: RealtimeBinding[]
  enabled?: boolean
  /** Re-read the data. Called after every successful (re)subscribe, when the tab becomes visible, and when the browser comes back online. */
  onSync: () => void
  /** Poll interval while NOT live (tab visible only). */
  fallbackPollMs?: number
  /** Slow safety-net poll while live (tab visible only); 0 disables. */
  heartbeatMs?: number
}

export const FALLBACK_POLL_MS = 12_000
// Customers cannot receive other customers' ticket events (row-level security), so In queue /
// Ahead can change without any event reaching them. A slow heartbeat keeps those numbers fresh.
export const LIVE_HEARTBEAT_MS = 30_000

const BACKOFF_BASE_MS = 1_000
const BACKOFF_MAX_MS = 30_000

/**
 * One Realtime subscription that always comes back: on CHANNEL_ERROR / TIMED_OUT / CLOSED the
 * channel is removed and re-created with exponential backoff + jitter (1s, 2s, 4s … 30s), reset
 * after a successful SUBSCRIBED. Also resyncs on tab-visible / online and polls only while down.
 */
export function useRealtimeSubscription({
  name,
  bindings,
  enabled = true,
  onSync,
  fallbackPollMs = FALLBACK_POLL_MS,
  heartbeatMs = LIVE_HEARTBEAT_MS,
}: Options): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  // Latest handlers/callback without re-subscribing on every render
  const bindingsRef = useRef(bindings)
  const onSyncRef = useRef(onSync)
  useEffect(() => {
    bindingsRef.current = bindings
    onSyncRef.current = onSync
  })

  // Re-subscribe only when the *shape* of the subscription changes
  const shapeKey = JSON.stringify(bindings.map((b) => [b.event, b.table, b.filter ?? '']))

  useEffect(() => {
    if (!enabled) {
      setStatus('connecting')
      return
    }

    const supabase = createClient()
    let disposed = false
    let live = false
    let attempt = 0
    let seq = 0
    let channel: ReturnType<typeof supabase.channel> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const clearRetry = () => {
      if (retryTimer) clearTimeout(retryTimer)
      retryTimer = null
    }

    const connect = async () => {
      if (disposed || channel) return
      clearRetry()
      try {
        await syncRealtimeAuth(supabase)
      } catch {
        // fall through; subscribing with the previous token still works until it expires
      }
      if (disposed || channel) return

      const ch = supabase.channel(`${name}:${++seq}`)
      for (const b of bindingsRef.current) {
        ch.on(
          'postgres_changes',
          { event: b.event, schema: 'public', table: b.table, ...(b.filter ? { filter: b.filter } : {}) },
          (payload) => {
            // Look up by position so the newest handler closure is used
            const current = bindingsRef.current.find(
              (x) => x.event === b.event && x.table === b.table && (x.filter ?? '') === (b.filter ?? '')
            )
            ;(current ?? b).handler(payload)
          }
        )
      }
      channel = ch

      ch.subscribe((s) => {
        if (disposed || channel !== ch) return
        if (s === 'SUBSCRIBED') {
          attempt = 0
          live = true
          setStatus('live')
          onSyncRef.current()
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          scheduleRetry(ch)
        }
      })
    }

    const scheduleRetry = (ch: NonNullable<typeof channel>) => {
      if (disposed || channel !== ch) return
      channel = null
      live = false
      setStatus('reconnecting')
      void supabase.removeChannel(ch)

      const base = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt)
      attempt += 1
      const delay = Math.min(BACKOFF_MAX_MS, base + Math.random() * base * 0.3)
      clearRetry()
      retryTimer = setTimeout(() => void connect(), delay)
    }

    // Coming back to the tab / network: refetch once, and reconnect right away if we are down
    const wake = () => {
      if (disposed || document.visibilityState !== 'visible') return
      onSyncRef.current()
      if (!live && !channel) {
        attempt = 0
        void connect()
      }
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('online', wake)

    void connect()

    return () => {
      disposed = true
      clearRetry()
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('online', wake)
      if (channel) void supabase.removeChannel(channel)
      channel = null
    }
  }, [name, enabled, shapeKey])

  // Poll fast only while the socket is down; slow heartbeat while live. Never while hidden.
  useEffect(() => {
    if (!enabled) return
    const ms = status === 'live' ? heartbeatMs : fallbackPollMs
    if (!ms) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') onSyncRef.current()
    }, ms)
    return () => clearInterval(id)
  }, [enabled, status, fallbackPollMs, heartbeatMs])

  return status
}
