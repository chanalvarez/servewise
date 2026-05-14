import { notFound } from 'next/navigation'
import { getMall } from '@/lib/queries'

export default async function MallLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ mallSlug: string }>
}) {
  const { mallSlug } = await params
  const mall = await getMall(mallSlug)
  if (!mall) notFound()
  return <>{children}</>
}
