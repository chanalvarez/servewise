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
  const pathname = usePathname()
  const isStaffPage = pathname.includes('/staff')

  const fetchTickets = useCallback(async () => {
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
        .in('status', ['waiting', 'called', 'no_show'])
        .order('created_at', { ascending: true })

      if (error) console.error('Fetch tickets error:', error.message)
      setTickets((data as ActiveTicket[]) ?? [])
    } catch (err) {
      console.error('fetchTickets error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Bootstrap: fire-and-forget anonymous auth, then load tickets via onAuthStateChange
  useEffect(() => {
    const supabase = supabaseRef.current

    // Always unblock the UI immediately
    setIsLoading(false)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchTickets()
      }
    })

    // On staff pages, never overwrite the staff session with anonymous auth.
    // On customer pages, sign in anonymously if there is no session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        if (!isStaffPage) {
          supabase.auth.signInAnonymously().catch((err) => {
            console.error('Anonymous sign-in failed:', err.message)
          })
        }
      } else {
        // Already have a session — load tickets directly
        fetchTickets()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchTickets])

  // Global realtime subscription — re-fetch on any ticket change affecting this customer
  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel('active-tickets-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchTickets()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTickets])

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
