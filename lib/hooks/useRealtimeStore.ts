'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Store } from '@/types'

/**
 * Subscribes to Supabase Realtime for a single store row.
 * Returns an up-to-date Store object that reflects live changes to
 * vibe_status, current_serving, is_open, etc.
 */
export function useRealtimeStore(storeId: string, initialStore: Store): Store {
  const [store, setStore] = useState<Store>(initialStore)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`store-rt-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${storeId}`,
        },
        (payload) => {
          setStore(payload.new as Store)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  return store
}
