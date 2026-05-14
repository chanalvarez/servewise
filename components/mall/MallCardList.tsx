'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import type { Mall } from '@/types'

interface MallCardListProps {
  malls: Mall[]
}

export function MallCardList({ malls }: MallCardListProps) {
  const router = useRouter()
  const [tapped, setTapped] = useState<string | null>(null)

  if (malls.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-white/30">
        <p className="font-medium">No malls configured yet</p>
        <p className="mt-1 text-sm">Run the seed SQL to add sample data</p>
      </div>
    )
  }

  return (
    <>
      {malls.map((mall) => {
        const href = `/${mall.slug}`
        return (
          <Link
            key={mall.id}
            href={href}
            onClick={() => {
              setTapped(mall.id)
              window.dispatchEvent(new CustomEvent('sw:nav-start'))
            }}
            onMouseEnter={() => router.prefetch(href)}
            onTouchStart={() => router.prefetch(href)}
            className="group relative flex flex-1 items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300 hover:border-indigo-500/30 md:h-[72px] md:flex-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              <MapPin className="h-4 w-4 text-indigo-300" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{mall.name}</p>
              {mall.address && (
                <p className="mt-0.5 truncate text-xs text-white/40">{mall.address}</p>
              )}
            </div>

            <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />

            {tapped === mall.id && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(7,9,26,0.55)' }}
              >
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            )}
          </Link>
        )
      })}
    </>
  )
}
