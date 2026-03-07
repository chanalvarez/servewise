'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StoreCard } from './StoreCard'
import { Search, SlidersHorizontal, ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'
import type { Mall, Store } from '@/types'

interface StoreDirectoryProps {
  mall: Mall
  initialStores: Store[]
}

const BG_STYLE = {
  background: `
    radial-gradient(ellipse at 20% 15%, rgba(99,102,241,0.18) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 85%, rgba(139,92,246,0.12) 0%, transparent 50%),
    radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    #07091A
  `,
  backgroundSize: 'auto, auto, 30px 30px, auto',
  backgroundAttachment: 'fixed' as const,
}

export function StoreDirectory({ mall, initialStores }: StoreDirectoryProps) {
  const [stores, setStores] = useState<Store[]>(initialStores)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = [
    ...new Set(initialStores.map((s) => s.category).filter((c): c is string => !!c)),
  ].sort()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`stores-dir-${mall.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stores', filter: `mall_id=eq.${mall.id}` },
        (payload) => {
          setStores((prev) =>
            prev.map((s) =>
              s.id === (payload.new as Store).id ? (payload.new as Store) : s
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
    <main className="min-h-screen pb-28" style={BG_STYLE}>
      {/* Sticky frosted header */}
      <div className="glass-dark sticky top-0 z-10">
        {/* ServeWise branding — centered at the very top */}
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-2 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: '0 0 14px rgba(99,102,241,0.45)',
              }}
            >
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">ServeWise</span>
          </div>
          <p className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-white/35">
            Skip the line, virtually
          </p>
        </div>

        <div className="mx-auto max-w-2xl px-4 pb-3 pt-2">
          {/* Back + Mall name */}
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-400/80">
                {mall.city}
              </p>
              <h1 className="truncate text-lg font-bold leading-tight text-white">
                {mall.name}
              </h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search stores…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/25"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            />
          </div>
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="relative mx-auto max-w-2xl">
            {/* Fade-out hint on the right edge */}
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10"
              style={{ background: 'linear-gradient(to left, rgba(7,9,26,0.95), transparent)' }}
            />
            <div className="hide-scrollbar overflow-x-auto px-4 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
                style={
                  !activeCategory
                    ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }
                    : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }
                }
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
                  style={
                    activeCategory === cat
                      ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }
                      : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Store list */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SlidersHorizontal className="mb-3 h-8 w-8 text-white/20" />
            <p className="font-semibold text-white/50">No stores found</p>
            <p className="mt-1 text-sm text-white/30">Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openStores.length > 0 && (
              <div className="space-y-2">
                {openStores.map((store) => (
                  <StoreCard key={store.id} store={store} mallSlug={mall.slug} />
                ))}
              </div>
            )}

            {closedStores.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
                  Closed
                </p>
                {closedStores.map((store) => (
                  <div key={store.id} className="opacity-40">
                    <StoreCard store={store} mallSlug={mall.slug} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
