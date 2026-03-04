import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Store } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StaffQueuePanel } from '@/components/staff/StaffQueuePanel'
import { VibeToggle } from '@/components/staff/VibeToggle'
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
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${mall.slug}/${store.id}`}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-indigo-500" />
                <p className="text-xs font-medium text-indigo-600">Staff Dashboard</p>
              </div>
              <p className="truncate font-bold leading-tight text-gray-900">{store.name}</p>
            </div>

            <StaffSignOutButton mallSlug={mallSlug} />
          </div>
        </div>

        {/* Vibe toggle */}
        <div className="mx-auto max-w-2xl overflow-x-auto px-4 pb-3">
          <VibeToggle storeId={store.id} currentStatus={store.vibe_status} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-2xl grid-cols-3 divide-x divide-gray-100 px-0">
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black tabular-nums text-gray-900">
              {store.current_serving === 0 ? '—' : store.current_serving}
            </p>
            <p className="text-xs text-gray-400">Now serving</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black tabular-nums text-indigo-600">
              {tickets?.filter((t) => t.status === 'waiting').length ?? 0}
            </p>
            <p className="text-xs text-gray-400">Waiting</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-2xl font-black tabular-nums text-gray-900">
              {store.last_queue_number}
            </p>
            <p className="text-xs text-gray-400">Total today</p>
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
