import { createClient } from '@supabase/supabase-js'

// Dedicated client for regular data queries (Analytics and any
// non-realtime fetch). Real-time eventsPerSecond is set to 0
// so this client never opens a WebSocket, eliminating any chance that
// channel state can interfere with pending HTTP requests.
export const supabaseQuery = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: {
      params: { eventsPerSecond: 0 },
    },
  }
)
