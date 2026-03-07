import Link from 'next/link'
import { ChevronRight, Layers, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Mall } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: malls } = await supabase.from('malls').select('*').order('name')

  return (
    <main
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(99,102,241,0.20) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 80%, rgba(139,92,246,0.14) 0%, transparent 50%),
          radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          #07091A
        `,
        backgroundSize: 'auto, auto, 30px 30px, auto',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header className="mx-auto max-w-2xl px-5 pt-8">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.45)',
            }}
          >
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">ServeWise</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5">
        {/* Hero */}
        <div className="pb-10 pt-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Virtual Queue System · Cebu
          </p>
          <h1 className="text-[3.5rem] font-black leading-[0.95] tracking-tight text-white">
            Skip the<br />
            <span className="text-gradient">line,</span><br />
            virtually.
          </h1>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">
            Get a queue ticket for any store in Cebu — no account, no app install.
          </p>

          {/* Steps */}
          <div className="mt-7 flex items-center gap-1">
            {[
              { n: '01', label: 'Pick a store' },
              { n: '02', label: 'Get a ticket' },
              { n: '03', label: 'Arrive on time' },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-1">
                {i > 0 && <span className="mx-1 text-white/15">→</span>}
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="font-mono text-[10px] text-indigo-400">{step.n}</span>
                  <span className="text-[11px] font-medium text-white/60">{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section label */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30">
            Select a mall
          </p>
          <span className="text-[11px] text-white/20">{malls?.length ?? 0} locations</span>
        </div>

        {/* Mall cards */}
        <div className="space-y-2.5 pb-12">
          {malls?.map((mall: Mall) => (
            <Link
              key={mall.id}
              href={`/${mall.slug}`}
              className="group flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.015] hover:border-indigo-500/30"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              >
                <MapPin className="h-4.5 w-4.5 text-indigo-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{mall.name}</p>
                {mall.address && (
                  <p className="mt-0.5 truncate text-xs text-white/40">{mall.address}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
            </Link>
          ))}

          {(!malls || malls.length === 0) && (
            <div className="py-20 text-center text-white/30">
              <p className="font-medium">No malls configured yet</p>
              <p className="mt-1 text-sm">Run the seed SQL to add sample data</p>
            </div>
          )}
        </div>

        <p className="pb-10 text-center text-xs text-white/15">
          ServeWise · Real-time virtual queuing
        </p>
      </div>
    </main>
  )
}
