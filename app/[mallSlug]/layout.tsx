import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function MallLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ mallSlug: string }>
}) {
  const { mallSlug } = await params
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('id')
    .eq('slug', mallSlug)
    .single()

  if (!mall) notFound()

  return <>{children}</>
}
