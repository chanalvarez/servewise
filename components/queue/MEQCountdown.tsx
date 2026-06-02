'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface MEQCountdownProps {
  expiresAt: string      // ISO timestamp — meq_expires_at from the ticket row
  onExpired?: () => void
}

const FORTY_FIVE_MIN_MS = 45 * 60 * 1000
const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function MEQCountdown({ expiresAt, onExpired }: MEQCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(FORTY_FIVE_MIN_MS)

  useEffect(() => {
    const calc = () => {
      const left = Math.max(0, new Date(expiresAt).getTime() - Date.now())
      setRemainingMs(left)
      if (left === 0) onExpired?.()
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [expiresAt, onExpired])

  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes      = Math.floor(totalSeconds / 60)
  const seconds      = totalSeconds % 60
  const progress     = remainingMs / FORTY_FIVE_MIN_MS
  const dashOffset   = CIRCUMFERENCE * (1 - progress)

  const color =
    progress > 0.5
      ? { stroke: '#f59e0b', text: 'text-amber-400' }   // plenty of time — amber
      : progress > 0.2
      ? { stroke: '#f97316', text: 'text-orange-400' }  // getting low — orange
      : { stroke: '#ef4444', text: 'text-red-400' }     // urgent — red

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular progress ring */}
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 104 104">
          <circle
            cx="52" cy="52" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="52" cy="52" r={RADIUS}
            fill="none"
            stroke={color.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-black tabular-nums leading-none ${color.text}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] text-white/40 mt-0.5">remaining</span>
        </div>
      </div>

      <div className={`flex items-center gap-1.5 text-sm font-medium ${color.text}`}>
        <Clock className="h-4 w-4" />
        <span>Return window closes in {minutes}m {seconds}s</span>
      </div>
    </div>
  )
}
