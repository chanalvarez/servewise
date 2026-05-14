import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Always dynamic — reads cookies to authenticate the staff session
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('storeId')

  if (!storeId) {
    return NextResponse.json({ error: 'Missing storeId' }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify the caller is authenticated staff for this store.
  // Uses the same server-side cookie session as the initial SSR page load.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: staffRecord } = await supabase
    .from('staff')
    .select('store_id')
    .eq('id', user.id)
    .eq('store_id', storeId)
    .single()

  if (!staffRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: tickets }, { data: store }] = await Promise.all([
    supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .in('status', ['waiting', 'called', 'no_show', 'arrived'])
      .order('queue_number'),
    supabase
      .from('stores')
      .select('current_serving, last_queue_number')
      .eq('id', storeId)
      .single(),
  ])

  return NextResponse.json({
    tickets: tickets ?? [],
    store: store ?? null,
  })
}
