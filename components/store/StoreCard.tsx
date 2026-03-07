import Link from 'next/link'
import { Users } from 'lucide-react'
import type { Store } from '@/types'

const CATEGORY_BG: Record<string, string> = {
  'Café':               'rgba(180,83,9,0.5)',
  'Restaurant':         'rgba(190,18,60,0.5)',
  'Fast Food':          'rgba(194,65,12,0.5)',
  'Book Store':         'rgba(3,105,161,0.5)',
  'Electronics':        'rgba(51,65,85,0.6)',
  'Clothing':           'rgba(109,40,217,0.5)',
  'Sports':             'rgba(6,95,70,0.5)',
  'Sports Shop':        'rgba(6,95,70,0.5)',
  'Car Accessories':    'rgba(63,63,70,0.6)',
  'Health and Beauty':  'rgba(157,23,77,0.5)',
  'Photo Booth':        'rgba(112,26,117,0.5)',
  'Barber Shop':        'rgba(87,83,78,0.6)',
  'Salon':              'rgba(159,18,57,0.5)',
}

const CATEGORY_BORDER: Record<string, string> = {
  'Café':               'rgba(251,191,36,0.3)',
  'Restaurant':         'rgba(251,113,133,0.3)',
  'Fast Food':          'rgba(251,146,60,0.3)',
  'Book Store':         'rgba(56,189,248,0.3)',
  'Electronics':        'rgba(148,163,184,0.3)',
  'Clothing':           'rgba(196,181,253,0.3)',
  'Sports':             'rgba(52,211,153,0.3)',
  'Sports Shop':        'rgba(52,211,153,0.3)',
  'Car Accessories':    'rgba(161,161,170,0.3)',
  'Health and Beauty':  'rgba(249,168,212,0.3)',
  'Photo Booth':        'rgba(232,121,249,0.3)',
  'Barber Shop':        'rgba(214,211,209,0.3)',
  'Salon':              'rgba(253,164,175,0.3)',
}

const VIBE_DOT: Record<string, string> = {
  green:  'bg-emerald-400 glow-green',
  yellow: 'bg-amber-400 glow-amber',
  red:    'bg-red-400 glow-red',
}

const VIBE_LABEL: Record<string, string> = {
  green:  'Not busy',
  yellow: 'Moderate',
  red:    'Very busy',
}

const VIBE_TEXT: Record<string, string> = {
  green:  'text-emerald-400',
  yellow: 'text-amber-400',
  red:    'text-red-400',
}

function getInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, ' ').split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

interface StoreCardProps {
  store: Store
  mallSlug: string
}

export function StoreCard({ store, mallSlug }: StoreCardProps) {
  const waitingCount = Math.max(0, store.last_queue_number - store.current_serving)
  const avatarBg = store.category ? (CATEGORY_BG[store.category] ?? 'rgba(71,85,105,0.5)') : 'rgba(71,85,105,0.5)'
  const avatarBorder = store.category ? (CATEGORY_BORDER[store.category] ?? 'rgba(148,163,184,0.2)') : 'rgba(148,163,184,0.2)'
  const initials = getInitials(store.name)

  return (
    <Link
      href={`/${mallSlug}/${store.id}`}
      className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-250 hover:scale-[1.015]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Category avatar */}
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: avatarBg, border: `1px solid ${avatarBorder}` }}
      >
        <span className="text-xs font-bold tracking-wide text-white">{initials}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-white">{store.name}</p>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${VIBE_DOT[store.vibe_status]}`} />
            <span className={`text-xs font-medium ${VIBE_TEXT[store.vibe_status]}`}>
              {VIBE_LABEL[store.vibe_status]}
            </span>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/40">
          {(store.floor || store.unit_number) && (
            <span>{[store.floor, store.unit_number].filter(Boolean).join(' · ')}</span>
          )}
          {(store.floor || store.unit_number) && <span className="text-white/20">·</span>}
          <span className="tabular-nums font-medium text-white/60">
            #{store.current_serving === 0 ? '—' : store.current_serving} serving
          </span>
          {waitingCount > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {waitingCount} waiting
              </span>
            </>
          )}
          {store.category && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-white/30">{store.category}</span>
            </>
          )}
          {!store.is_open && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Closed
            </span>
          )}
          {store.is_open && store.is_cutoff && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-amber-300"
              style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)' }}
            >
              Queue Closed
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
