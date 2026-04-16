import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Attach the current session JWT to the Realtime WebSocket.
 * Required for postgres_changes when RLS is enabled — without this, events
 * may never arrive even though REST queries work after a full page load.
 */
export async function syncRealtimeAuth(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  await supabase.realtime.setAuth(session?.access_token ?? null)
}
