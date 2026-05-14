import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Mall, Store } from '@/types'

// Plain anon client — no cookies needed; malls + stores have public RLS policies.
// Safe inside unstable_cache (no request-scoped state).
function anon() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const getMalls = unstable_cache(
  async (): Promise<Mall[]> => {
    const { data } = await anon().from('malls').select('*').order('name')
    return (data ?? []) as Mall[]
  },
  ['malls'],
  { revalidate: 60, tags: ['malls'] }
)

export const getMall = unstable_cache(
  async (slug: string): Promise<Mall | null> => {
    const { data } = await anon().from('malls').select('*').eq('slug', slug).single()
    return data as Mall | null
  },
  ['mall'],
  { revalidate: 60, tags: ['malls'] }
)

export const getStores = unstable_cache(
  async (mallId: string): Promise<Store[]> => {
    const { data } = await anon().from('stores').select('*').eq('mall_id', mallId).order('name')
    return (data ?? []) as Store[]
  },
  ['stores'],
  { revalidate: 60, tags: ['stores'] }
)

export const getStore = unstable_cache(
  async (storeId: string): Promise<Store | null> => {
    const { data } = await anon().from('stores').select('*').eq('id', storeId).single()
    return data as Store | null
  },
  ['store'],
  { revalidate: 60, tags: ['stores'] }
)
