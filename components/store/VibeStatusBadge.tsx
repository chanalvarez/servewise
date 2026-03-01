import type { VibeStatus } from '@/types'

const VIBE_CONFIG: Record<
  VibeStatus,
  { label: string; dot: string; bg: string; text: string; ring: string }
> = {
  green: {
    label: 'Not busy',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
  yellow: {
    label: 'Moderate',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  red: {
    label: 'Very busy',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
  },
}

interface VibeStatusBadgeProps {
  status: VibeStatus
  size?: 'sm' | 'md'
}

export function VibeStatusBadge({ status, size = 'md' }: VibeStatusBadgeProps) {
  const c = VIBE_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${c.bg} ${c.text} ${c.ring} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`rounded-full animate-pulse ${c.dot} ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-1.5 w-1.5'}`} />
      {c.label}
    </span>
  )
}
