'use client'

import { useState } from 'react'
import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react'
import { toggleCutoff } from '@/lib/actions/queue'

interface CutoffButtonProps {
  storeId: string
  initialIsCutoff: boolean
}

export function CutoffButton({ storeId, initialIsCutoff }: CutoffButtonProps) {
  const [isCutoff, setIsCutoff] = useState(initialIsCutoff)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    const next = !isCutoff
    setIsCutoff(next)
    setLoading(true)
    try {
      await toggleCutoff(storeId, next)
    } catch {
      setIsCutoff(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-4">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={
          isCutoff
            ? {
                background: 'rgba(251,146,60,0.15)',
                border: '1px solid rgba(251,146,60,0.4)',
                boxShadow: '0 0 16px rgba(251,146,60,0.15)',
              }
            : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }
        }
      >
        <div className="flex items-center gap-2.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
          ) : isCutoff ? (
            <ShieldOff className="h-4 w-4 text-amber-400" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-white/40" />
          )}
          <div className="text-left">
            <p className={isCutoff ? 'text-amber-300' : 'text-white/60'}>
              {isCutoff ? 'Queue Cut Off — Tap to Resume' : 'Cut Off Queue'}
            </p>
            <p className="text-[10px] font-normal text-white/30">
              {isCutoff
                ? 'New customers cannot join. Existing queue continues.'
                : 'Stop new customers from joining — existing queue is unaffected'}
            </p>
          </div>
        </div>

        {/* Toggle pill */}
        <div
          className="relative h-6 w-11 flex-shrink-0 rounded-full transition-all duration-300"
          style={
            isCutoff
              ? { background: 'rgba(251,146,60,0.7)' }
              : { background: 'rgba(255,255,255,0.12)' }
          }
        >
          <span
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300"
            style={{ left: isCutoff ? '1.5rem' : '0.25rem' }}
          />
        </div>
      </button>
    </div>
  )
}
