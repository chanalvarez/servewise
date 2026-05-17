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

  const { data: ratings, error } = await supabase
    .from('ratings')
    .select('id, stars, message, submitted_at')
    .eq('store_id', storeId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ratings: ratings ?? [] })
}
