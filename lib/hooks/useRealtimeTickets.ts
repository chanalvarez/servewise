'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Ticket } from '@/types'

/**
 * Subscribes to Realtime changes for all tickets belonging to a given store.
 * Handles INSERT / UPDATE / DELETE events and merges them into local state.
 */
export function useRealtimeTickets(
  storeId: string,
  initialTickets: Ticket[]
): Ticket[] {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`tickets-rt-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [...prev, payload.new as Ticket])
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Ticket).id ? (payload.new as Ticket) : t
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter((t) => t.id !== (payload.old as Ticket).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  return tickets
}
