import Link from 'next/link'
import { MapPin, ChevronRight, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Mall } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: malls } = await supabase.from('malls').select('*').order('name')

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ServeWise</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-black leading-tight text-gray-900">
            Skip the line,{' '}
            <span className="text-indigo-600">virtually.</span>
          </h1>
          <p className="mt-2 text-gray-500">
            Join queues at any store across multiple malls — no account, no app install.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { step: '1', text: 'Pick a mall & store' },
            { step: '2', text: 'Get your ticket number' },
            { step: '3', text: "Arrive when it's your turn" },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-center"
            >
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                {item.step}
              </div>
              <p className="text-xs font-medium leading-tight text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Mall list */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Choose a mall</h2>
          <span className="text-xs text-gray-400">{malls?.length ?? 0} available</span>
        </div>

        <div className="space-y-2">
          {malls?.map((mall: Mall) => (
            <Link
              key={mall.id}
              href={`/${mall.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <MapPin className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{mall.name}</p>
                {mall.city && <p className="text-sm text-gray-400">{mall.city}</p>}
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-indigo-400" />
            </Link>
          ))}

          {(!malls || malls.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <MapPin className="h-7 w-7 text-gray-300" />
              </div>
              <p className="font-medium">No malls configured yet</p>
              <p className="mt-1 text-sm">Run the seed SQL to add sample data</p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-gray-300">
          ServeWise · Real-time virtual queuing
        </p>
      </div>
    </main>
  )
}
