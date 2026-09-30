import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMall, getStore } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import type { QueueSnapshot } from '@/types'
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

  // Snapshot is live — never cached. Counts come from the DB (RLS hides other customers' tickets).
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_queue_snapshot', { p_store_id: storeId })
  const row = Array.isArray(data) ? data[0] : data
  const snapshot: QueueSnapshot | null = row
    ? { in_queue: row.in_queue, ahead: row.ahead }
    : null

  return (
    <StoreQueueView store={store} mall={mall} initialSnapshot={snapshot} />
  )
}
