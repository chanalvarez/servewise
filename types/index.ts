// ── Primitive domain types ────────────────────────────────────────────────────

export type VibeStatus = 'green' | 'yellow' | 'red'

export type TicketStatus =
  | 'waiting'
  | 'called'
  | 'arrived'
  | 'no_show'
  | 'voided'
  | 'completed'

// ── Row shapes (mirror the SQL schema exactly) ────────────────────────────────

export interface Mall {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  created_at: string
}

export interface Store {
  id: string
  mall_id: string
  name: string
  category: string | null
  floor: string | null
  unit_number: string | null
  vibe_status: VibeStatus
  current_serving: number
  last_queue_number: number
  is_open: boolean
  is_cutoff: boolean
  created_at: string
}

export interface Ticket {
  id: string
  store_id: string
  customer_id: string
  queue_number: number
  status: TicketStatus
  no_show_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  store_id: string
  name: string
  created_at: string
}

// ── Enriched / joined shapes ──────────────────────────────────────────────────

/** A ticket with its store and mall context — used in ActiveTicketsDrawer */
export interface ActiveTicket extends Ticket {
  store: {
    id: string
    name: string
    current_serving: number
    mall: {
      slug: string
      name: string
    }
  }
}

/** Store card with computed wait count — convenience for UI */
export interface StoreWithWait extends Store {
  waitingCount: number
}
