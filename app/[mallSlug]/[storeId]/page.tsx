import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMall, getStore } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { StoreQueueView } from '@/components/queue/StoreQueueView'

interface Props {
  params: Promise<{ mallSlug: string; storeId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeId } = await params
  const store = await getStore(storeId)
  return {
    title: store ? `${store.name} Queue — ServeWise` : 'Queue — ServeWise',
  }
}

export default async function StorePage({ params }: Props) {
  const { mallSlug, storeId } = await params

  // Store + mall are static-ish data — serve from cache (60s revalidate)
  const [store, mall] = await Promise.all([
    getStore(storeId),
    getMall(mallSlug),
  ])

  if (!store || !mall) notFound()

  // Tickets are live — never cached
  const supabase = await createClient()
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('store_id', storeId)
    .in('status', ['waiting', 'called', 'no_show'])
    .order('queue_number')

  return (
    <StoreQueueView store={store} mall={mall} initialTickets={tickets ?? []} />
  )
}
