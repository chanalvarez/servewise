import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Store } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StaffQueuePanel } from '@/components/staff/StaffQueuePanel'
import { VibeToggle } from '@/components/staff/VibeToggle'
import { CutoffButton } from '@/components/staff/CutoffButton'
import { StaffSignOutButton } from './StaffSignOutButton'

interface Props {
  params: Promise<{ mallSlug: string; storeId: string }>
}

export default async function StaffDashboardPage({ params }: Props) {
  const { mallSlug, storeId } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect anonymous users and unauthenticated visitors to login
  if (!user || user.is_anonymous) {
    redirect(`/${mallSlug}/${storeId}/staff/login`)
  }

  // Verify this user is staff for the requested store
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('name, store_id')
    .eq('id', user.id)
    .eq('store_id', storeId)
    .single()

  if (!staffRecord) {
    redirect(`/${mallSlug}/${storeId}/staff/login`)
  }

  // Fetch store + active tickets
  const [{ data: store }, { data: mall }, { data: tickets }] = await Promise.all([
    supabase.from('stores').select('*').eq('id', storeId).single(),
    supabase.from('malls').select('*').eq('slug', mallSlug).single(),
    supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .in('status', ['waiting', 'called', 'no_show'])
      .order('queue_number'),
  ])

  if (!store || !mall) notFound()

  return (
    <main className="min-h-screen pb-16" style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 55%), #07091A', backgroundAttachment: 'fixed' }}>
      {/* Header */}
      <div className="glass-dark sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${mall.slug}/${store.id}`}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Store className="h-3 w-3 text-indigo-400/70" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/70">Staff Dashboard</p>
              </div>
              <p className="truncate font-bold leading-tight text-white">{store.name}</p>
            </div>

            <StaffSignOutButton mallSlug={mallSlug} />
          </div>
        </div>

        {/* Vibe toggle */}
        <div className="mx-auto max-w-2xl overflow-x-auto px-4 pb-3">
          <VibeToggle storeId={store.id} currentStatus={store.vibe_status} />
        </div>

        {/* Cutoff toggle */}
        <CutoffButton storeId={store.id} initialIsCutoff={store.is_cutoff} />
      </div>

      {/* Stats bar */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto grid max-w-2xl grid-cols-3 divide-x divide-white/[0.06] px-0">
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black tabular-nums text-white">
              {store.current_serving === 0 ? '—' : store.current_serving}
            </p>
            <p className="text-xs text-white/40">Now serving</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black tabular-nums text-gradient">
              {tickets?.filter((t) => t.status === 'waiting').length ?? 0}
            </p>
            <p className="text-xs text-white/40">Waiting</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black tabular-nums text-white">
              {store.last_queue_number}
            </p>
            <p className="text-xs text-white/40">Total today</p>
          </div>
        </div>
      </div>

      {/* Queue management */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        <StaffQueuePanel storeId={store.id} initialTickets={tickets ?? []} />
      </div>
    </main>
  )
}
