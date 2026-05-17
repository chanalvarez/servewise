import { createBrowserClient } from '@supabase/ssr'

// Dedicated client for Supabase Realtime channels (Queue tab only).
// Isolated so that real-time WebSocket traffic cannot block HTTP
// data-fetch requests made on supabaseQuery.
// Uses createBrowserClient (cookie-based auth) so RLS-gated queries
// see the staff session — unlike @supabase/supabase-js which reads
// localStorage only and is always anonymous in an SSR-auth setup.
export const supabaseRealtime = createBrowserClient(
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
export const supabaseQuery = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: { eventsPerSecond: 0 },
    },
  }
)
