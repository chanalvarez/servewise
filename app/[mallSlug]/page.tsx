import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StoreDirectory } from '@/components/store/StoreDirectory'

interface Props {
  params: Promise<{ mallSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mallSlug } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('name, city')
    .eq('slug', mallSlug)
    .single()

  return {
    title: mall ? `${mall.name} — ServeWise` : 'Mall — ServeWise',
    description: mall
      ? `Virtual queue management for all stores at ${mall.name}, ${mall.city}.`
      : undefined,
  }
}

export default async function MallPage({ params }: Props) {
  const { mallSlug } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('*')
    .eq('slug', mallSlug)
    .single()

  if (!mall) notFound()

  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('mall_id', mall.id)
    .order('name')

  return <StoreDirectory mall={mall} initialStores={stores ?? []} />
}
