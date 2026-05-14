'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Rating {
  id: string
  stars: number
  message: string | null
  submitted_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

function StarRow({ filled, size = 'sm' }: { filled: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} flex-shrink-0 ${
            i < filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-white/20'
          }`}
        />
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StaffFeedbackPanelProps {
  storeId: string
  activated: boolean
}

export function StaffFeedbackPanel({ storeId, activated }: StaffFeedbackPanelProps) {
  const [isLoading, setIsLoading]     = useState(false)      // first-ever fetch
  const [isRefreshing, setIsRefreshing] = useState(false)    // background re-fetch
  const [error, setError]             = useState<string | null>(null)
  const [ratings, setRatings]         = useState<Rating[]>([])

  // hasLoadedRef: true once any fetch completes successfully.
  const hasLoadedRef = useRef(false)
  // fetchIdRef: stale-request guard — discard responses from cancelled fetches.
  const fetchIdRef   = useRef(0)

  const fetchRatings = useCallback(async () => {
    const id = ++fetchIdRef.current

    // First load → full skeleton. Manual refresh → keep list, spin button.
    if (hasLoadedRef.current) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const supabase = createClient()
      console.log('[FEEDBACK] About to fetch, storeId:', storeId)
      const { data, error: queryError } = await supabase
        .from('ratings')
        .select('id, stars, message, submitted_at')
        .eq('store_id', storeId)
        .order('submitted_at', { ascending: false })

      console.log('[FEEDBACK] Supabase response:', data, queryError)
      if (queryError) throw queryError
      if (id !== fetchIdRef.current) return

      setRatings(data ?? [])
      hasLoadedRef.current = true
    } catch {
      if (id !== fetchIdRef.current) return
      setError('Failed to load ratings.')
    } finally {
      if (id === fetchIdRef.current) {
        console.log('[FEEDBACK] Loading set to false')
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [storeId])

  useEffect(() => { console.log('[FEEDBACK] Component mounted') }, [])

  useEffect(() => {
    console.log('[FEEDBACK] activated:', activated, 'hasLoaded:', hasLoadedRef.current)
    if (!activated) return
    void fetchRatings()
  }, [activated, fetchRatings])

  const avg = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
    : null

  // ── First-load skeleton ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        ))}
      </div>
    )
  }

  // ── First-load error (no data to fall back on) ────────────────────────────

  if (error && !hasLoadedRef.current) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-sm text-white/40">{error}</p>
        <button
          onClick={() => void fetchRatings()}
          className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Main view (shown even during background refresh) ─────────────────────

  return (
    <div className="space-y-3">

      {/* Header row: section label + manual refresh button */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Customer Ratings
        </p>
        <div className="flex items-center gap-2">
          {/* Subtle error message during a failed background refresh */}
          {error && hasLoadedRef.current && (
            <span className="text-xs text-red-400/70">Refresh failed</span>
          )}
          <button
            onClick={() => void fetchRatings()}
            disabled={isRefreshing}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/8 disabled:opacity-40"
            title="Refresh feedback"
            aria-label="Refresh feedback"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-white/35 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {ratings.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Star className="mb-3 h-8 w-8 text-white/20" />
          <p className="font-semibold text-white/40">No ratings yet</p>
          <p className="mt-1 text-sm text-white/25">
            Ratings appear here after customers submit them
          </p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div
            className="flex items-center gap-5 rounded-2xl px-5 py-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-center">
              <p className="text-3xl font-black tabular-nums text-white">{avg!.toFixed(1)}</p>
              <div className="mt-1">
                <StarRow filled={Math.round(avg!)} size="sm" />
              </div>
            </div>

            <div className="h-10 w-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <div>
              <p className="text-2xl font-black tabular-nums text-white">{ratings.length}</p>
              <p className="text-xs text-white/40">
                {ratings.length === 1 ? 'rating' : 'ratings'} received
              </p>
            </div>
          </div>

          {/* Individual entries — reverse chronological */}
          <div className="space-y-2">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <StarRow filled={r.stars} size="sm" />
                  <p className="flex-shrink-0 text-xs text-white/30">{formatDate(r.submitted_at)}</p>
                </div>
                {r.message && (
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{r.message}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
