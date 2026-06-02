'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { syncRealtimeAuth } from '@/lib/supabase/realtimeAuth'
import type { ActiveTicket } from '@/types'

interface ActiveTicketsContextValue {
  tickets: ActiveTicket[]
  isLoading: boolean
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  refreshTickets: () => Promise<void>
  removeTicket: (ticketId: string) => void
}

const ActiveTicketsContext = createContext<ActiveTicketsContextValue | null>(null)

export function ActiveTicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<ActiveTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const supabaseRef = useRef(createClient())
  const prevTicketStatusesRef = useRef<Record<string, string>>({})
  // Stale-fetch prevention: incremented on every fetchTickets call.
  // Each call captures its own ID and discards the result if a newer call
  // has already completed — prevents out-of-order responses from bouncing
  // myTicket.status back to a previous value (e.g. no_show after missed).
  const fetchCounterRef = useRef(0)
  const pathname = usePathname()
  const isStaffPage = pathname.includes('/staff')

  const fetchTickets = useCallback(async () => {
    const myFetchId = ++fetchCounterRef.current
    try {
      const supabase = supabaseRef.current
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          store:stores (
            id,
            name,
            current_serving,
            mall:malls ( slug, name )
          )
        `
        )
        .eq('customer_id', user.id)
        .in('status', ['waiting', 'called', 'no_show', 'missed', 'arrived'])
        .order('created_at', { ascending: true })

      // Discard if a newer fetch has already completed
      if (myFetchId !== fetchCounterRef.current) return

      if (error) console.error('Fetch tickets error:', error.message)
      setTickets((data as ActiveTicket[]) ?? [])
    } catch (err) {
      console.error('fetchTickets error:', err)
    } finally {
      // Only clear loading if this is still the latest fetch
      if (myFetchId === fetchCounterRef.current) setIsLoading(false)
    }
  }, [])

  // Bootstrap: sign in anonymously if needed, then load tickets.
  // isLoading stays true until we know for sure whether the user has tickets or not.
  // This prevents the Join button from flashing for users who already have a ticket.
  useEffect(() => {
    const supabase = supabaseRef.current

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // fetchTickets sets isLoading(false) in its finally block
        fetchTickets()
      }
    })

    // Safety net: unblock the UI after 4 s no matter what.
    // Covers slow anonymous sign-in on PC browsers, ad-blockers, etc.
    const safetyTimer = setTimeout(() => setIsLoading(false), 4000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        if (!isStaffPage) {
          // signInAnonymously triggers SIGNED_IN → fetchTickets → isLoading(false)
          supabase.auth.signInAnonymously().catch((err) => {
            console.error('Anonymous sign-in failed:', err.message)
            setIsLoading(false)
          })
        } else {
          setIsLoading(false)
        }
      } else {
        // Already have a session — fetchTickets sets isLoading(false)
        fetchTickets()
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [fetchTickets, isStaffPage])

  // Global realtime subscription — re-fetch on any ticket change affecting this customer
  useEffect(() => {
    const supabase = supabaseRef.current
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      await syncRealtimeAuth(supabase)
      if (cancelled) return

      const ch = supabase
        .channel('active-tickets-global')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          () => fetchTickets()
        )
        .subscribe()
      if (cancelled) {
        void supabase.removeChannel(ch)
        return
      }
      channel = ch
    }

    void setup()

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        await syncRealtimeAuth(supabase)
      }
    })

    return () => {
      cancelled = true
      authSub.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [fetchTickets])

  // Fallback when Realtime events don't arrive (same RLS/socket issue as staff)
  useEffect(() => {
    if (isStaffPage) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchTickets()
    }, 3000)
    return () => clearInterval(id)
  }, [fetchTickets, isStaffPage])

  // Detect ticket status transitions and write cross-page alerts to localStorage.
  // Lives here (always-mounted root context) so it fires even when the customer
  // has navigated away from the store queue page.
  useEffect(() => {
    if (isStaffPage) return

    const prev = prevTicketStatusesRef.current
    const isBootstrap = Object.keys(prev).length === 0

    for (const ticket of tickets) {
      const prevStatus = prev[ticket.id]
      const currStatus = ticket.status

      if (currStatus === 'called' && prevStatus !== 'called') {
        // On first load, skip tickets that were called more than 2 minutes ago
        if (isBootstrap && Date.now() - new Date(ticket.updated_at).getTime() > 2 * 60 * 1000) continue
        try {
          localStorage.setItem('servewise_alert', JSON.stringify({
            type: 'called',
            storeId: ticket.store.id,
            storeName: ticket.store.name,
            mallSlug: ticket.store.mall.slug,
            timestamp: Date.now(),
          }))
        } catch {}
      } else if (currStatus === 'no_show' && prevStatus !== 'no_show') {
        // On first load, skip no-show tickets triggered more than 5 minutes ago
        const noShowAge = Date.now() - new Date(ticket.no_show_triggered_at ?? ticket.updated_at).getTime()
        if (isBootstrap && noShowAge > 5 * 60 * 1000) continue
        try {
          localStorage.setItem('servewise_alert', JSON.stringify({
            type: 'noshow',
            storeId: ticket.store.id,
            storeName: ticket.store.name,
            mallSlug: ticket.store.mall.slug,
            timestamp: Date.now(),
          }))
        } catch {}
      }
    }

    // Clear localStorage when no ticket is in an alertable state anymore
    const hasActive = tickets.some(t => t.status === 'called' || t.status === 'no_show')
    const hadActive = Object.values(prev).some(s => s === 'called' || s === 'no_show' || s === 'missed')
    if (!hasActive && hadActive) {
      try { localStorage.removeItem('servewise_alert') } catch {}
    }

    prevTicketStatusesRef.current = Object.fromEntries(tickets.map(t => [t.id, t.status]))
  }, [tickets, isStaffPage])

  const removeTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId))
  }

  return (
    <ActiveTicketsContext.Provider
      value={{
        tickets,
        isLoading,
        drawerOpen,
        setDrawerOpen,
        refreshTickets: fetchTickets,
        removeTicket,
      }}
    >
      {children}
    </ActiveTicketsContext.Provider>
  )
}

export function useActiveTickets(): ActiveTicketsContextValue {
  const ctx = useContext(ActiveTicketsContext)
  if (!ctx) {
    throw new Error('useActiveTickets must be used within <ActiveTicketsProvider>')
  }
  return ctx
}
