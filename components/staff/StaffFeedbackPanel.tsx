'use client'

import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
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
}

export function StaffFeedbackPanel({ storeId }: StaffFeedbackPanelProps) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRatings = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('ratings')
      .select('id, stars, message, submitted_at')
      .eq('store_id', storeId)
      .order('submitted_at', { ascending: false })
    setRatings(data ?? [])
    setLoading(false)
  }, [storeId])

  useEffect(() => { void fetchRatings() }, [fetchRatings])

  const avg = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
    : null

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
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

  // ── Empty state ───────────────────────────────────────────────────────────

  if (ratings.length === 0) {
    return (
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
    )
  }

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

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

    </div>
  )
}
