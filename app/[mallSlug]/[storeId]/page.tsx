import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StoreQueueView } from '@/components/queue/StoreQueueView'

interface Props {
  params: Promise<{ mallSlug: string; storeId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeId } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('name')
    .eq('id', storeId)
    .single()

  return {
    title: store ? `${store.name} Queue — ServeWise` : 'Queue — ServeWise',
  }
}

export default async function StorePage({ params }: Props) {
  const { mallSlug, storeId } = await params
  const supabase = await createClient()

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
    <StoreQueueView store={store} mall={mall} initialTickets={tickets ?? []} />
  )
}
