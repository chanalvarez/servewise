import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMall, getStores } from '@/lib/queries'
import { StoreDirectory } from '@/components/store/StoreDirectory'

interface Props {
  params: Promise<{ mallSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mallSlug } = await params
  const mall = await getMall(mallSlug)
  return {
    title: mall ? `${mall.name} — ServeWise` : 'Mall — ServeWise',
    description: mall
      ? `Virtual queue management for all stores at ${mall.name}, ${mall.city}.`
      : undefined,
  }
}

export default async function MallPage({ params }: Props) {
  const { mallSlug } = await params
  const mall = await getMall(mallSlug)
  if (!mall) notFound()

  const stores = await getStores(mall.id)

  return <StoreDirectory mall={mall} initialStores={stores} />
}
