'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StoreCard } from './StoreCard'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { Mall, Store } from '@/types'

interface StoreDirectoryProps {
  mall: Mall
  initialStores: Store[]
}

export function StoreDirectory({ mall, initialStores }: StoreDirectoryProps) {
  const [stores, setStores] = useState<Store[]>(initialStores)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = [
    ...new Set(initialStores.map((s) => s.category).filter((c): c is string => !!c)),
  ].sort()

  // Realtime: keep vibe_status and current_serving up-to-date across the directory
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`stores-dir-${mall.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `mall_id=eq.${mall.id}`,
        },
        (payload) => {
          setStores((prev) =>
            prev.map((s) =>
              s.id === (payload.new as Store).id ? (payload.new as Store) : s
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mall.id])

  const filtered = stores.filter((s) => {
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.category?.toLowerCase() ?? '').includes(query.toLowerCase())
    const matchesCategory = !activeCategory || s.category === activeCategory
    return matchesQuery && matchesCategory
  })

  const openStores = filtered.filter((s) => s.is_open)
  const closedStores = filtered.filter((s) => !s.is_open)

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-3">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-500">
              {mall.city}
            </p>
            <h1 className="text-xl font-bold text-gray-900">{mall.name}</h1>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="mx-auto max-w-2xl overflow-x-auto px-4 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  !activeCategory
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Store list */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <SlidersHorizontal className="mb-3 h-8 w-8 opacity-50" />
            <p className="font-medium">No stores found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openStores.map((store) => (
              <StoreCard key={store.id} store={store} mallSlug={mall.slug} />
            ))}
            {closedStores.length > 0 && openStores.length > 0 && (
              <p className="px-1 pt-3 text-xs font-medium uppercase tracking-widest text-gray-400">
                Closed
              </p>
            )}
            {closedStores.map((store) => (
              <div key={store.id} className="opacity-50">
                <StoreCard store={store} mallSlug={mall.slug} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
