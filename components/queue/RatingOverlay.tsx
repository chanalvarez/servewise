'use client'

import { useState } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import { submitRating } from '@/lib/actions/queue'

interface RatingOverlayProps {
  ticketId: string
  storeId: string
  onDone: () => void
}

export function RatingOverlay({ ticketId, storeId, onDone }: RatingOverlayProps) {
  const [stars, setStars]           = useState(0)
  const [hovered, setHovered]       = useState(0)
  const [message, setMessage]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  const handleSubmit = async () => {
    if (stars === 0 || submitting) return
    setSubmitting(true)
    try {
      await submitRating(ticketId, storeId, stars, message.trim() || null)
      setDone(true)
      setTimeout(onDone, 1800)
    } catch {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{
          background: 'rgba(7,9,26,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
            }}
          >
            <CheckCircle2 className="h-8 w-8 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-white">Thank you!</p>
          <p className="text-sm text-white/40">Your feedback helps us improve</p>
        </div>
      </div>
    )
  }

  const active = hovered || stars

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-8"
      style={{
        background: 'rgba(7,9,26,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <p className="mb-1 text-center text-lg font-bold text-white">
          How was your experience?
        </p>
        <p className="mb-6 text-center text-sm text-white/40">
          Your feedback is anonymous
        </p>

        {/* 5 tappable stars */}
        <div
          className="mb-6 flex justify-center gap-2"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              onMouseEnter={() => setHovered(n)}
              className="rounded-xl p-1.5 transition-transform active:scale-90"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  n <= active
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-white/20'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Optional comment */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a comment (optional)"
          rows={3}
          maxLength={300}
          className="mb-4 w-full resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={stars === 0 || submitting}
          className="mb-2 w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: stars > 0 ? '0 0 20px rgba(99,102,241,0.35)' : 'none',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Rating'}
        </button>

        {/* Skip */}
        <button
          onClick={onDone}
          disabled={submitting}
          className="w-full rounded-2xl py-3 text-sm text-white/30 transition-colors hover:text-white/50 disabled:opacity-40"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
