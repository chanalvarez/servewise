import Link from 'next/link'
import { Users, ChevronRight, Tag } from 'lucide-react'
import { VibeStatusBadge } from './VibeStatusBadge'
import type { Store } from '@/types'

interface StoreCardProps {
  store: Store
  mallSlug: string
}

export function StoreCard({ store, mallSlug }: StoreCardProps) {
  const waitingCount = Math.max(0, store.last_queue_number - store.current_serving)

  return (
    <Link
      href={`/${mallSlug}/${store.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-md"
    >
      {/* Category icon orb */}
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
        <Tag className="h-5 w-5 text-indigo-400" />
      </div>

      {/* Info block */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight text-gray-900">{store.name}</p>
            {(store.floor || store.unit_number) && (
              <p className="mt-0.5 text-xs text-gray-400">
                {[store.floor, store.unit_number].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <VibeStatusBadge status={store.vibe_status} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold tabular-nums text-gray-900">
              #{store.current_serving === 0 ? '—' : store.current_serving}
            </span>
            <span className="text-gray-400">serving</span>
          </div>

          {waitingCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>{waitingCount} waiting</span>
            </div>
          )}

          {!store.is_open && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              Closed
            </span>
          )}

          {store.category && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-100">
              {store.category}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-colors group-hover:text-indigo-400" />
    </Link>
  )
}
