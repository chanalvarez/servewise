import type { RealtimeStatus } from '@/lib/hooks/useRealtimeSubscription'

/** Small "Live" / "Reconnecting…" pill. Hidden during the first connect so it never flashes. */
export function RealtimeStatusBadge({ status }: { status: RealtimeStatus }) {
  if (status === 'connecting') return null
  const live = status === 'live'
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: live ? 'rgba(52,211,153,0.10)' : 'rgba(245,158,11,0.12)',
        border: `1px solid ${live ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.3)'}`,
        color: live ? 'rgb(110,231,183)' : 'rgb(252,211,77)',
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? '' : 'animate-pulse'}`}
        style={{ background: live ? 'rgb(52,211,153)' : 'rgb(245,158,11)' }}
      />
      {live ? 'Live' : 'Reconnecting…'}
    </span>
  )
}
