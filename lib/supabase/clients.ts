import { createClient } from '@supabase/supabase-js'

// Dedicated client for Supabase Realtime channels (Queue tab only).
// Isolated so that real-time WebSocket traffic cannot block HTTP
// data-fetch requests made on supabaseQuery.
export const supabaseRealtime = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)

// Dedicated client for regular data queries (Analytics, Feedback,
// and any non-realtime fetch). Real-time eventsPerSecond is set to 0
// so this client never opens a WebSocket, eliminating any chance that
// channel state can interfere with pending HTTP requests.
export const supabaseQuery = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: { eventsPerSecond: 0 },
    },
  }
)
