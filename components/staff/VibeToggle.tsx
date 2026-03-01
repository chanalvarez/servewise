'use client'

import { useState } from 'react'
import { updateVibeStatus } from '@/lib/actions/queue'
import type { VibeStatus } from '@/types'

const OPTIONS: Array<{
  value: VibeStatus
  label: string
  activeBg: string
  activeDot: string
  activeText: string
}> = [
  {
    value: 'green',
    label: 'Not busy',
    activeBg: 'bg-emerald-600',
    activeDot: 'bg-emerald-300',
    activeText: 'text-white',
  },
  {
    value: 'yellow',
    label: 'Moderate',
    activeBg: 'bg-amber-500',
    activeDot: 'bg-amber-200',
    activeText: 'text-white',
  },
  {
    value: 'red',
    label: 'Very busy',
    activeBg: 'bg-red-600',
    activeDot: 'bg-red-300',
    activeText: 'text-white',
  },
]

interface VibeToggleProps {
  storeId: string
  currentStatus: VibeStatus
}

export function VibeToggle({ storeId, currentStatus }: VibeToggleProps) {
  const [status, setStatus] = useState<VibeStatus>(currentStatus)
  const [loading, setLoading] = useState(false)

  const handleChange = async (next: VibeStatus) => {
    if (next === status || loading) return
    const prev = status
    setStatus(next)
    setLoading(true)
    try {
      await updateVibeStatus(storeId, next)
    } catch {
      setStatus(prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-500">Store vibe</span>
      <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 p-1.5">
        {OPTIONS.map((opt) => {
          const isActive = status === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              disabled={loading}
              title={opt.label}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-60 ${
                isActive
                  ? `${opt.activeBg} ${opt.activeText} shadow-sm`
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? opt.activeDot : 'bg-gray-400'
                }`}
              />
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
