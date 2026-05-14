'use server'

import { createClient } from '@/lib/supabase/server'
import type { VibeStatus } from '@/types'

/** Customer: atomically join a store queue via the join_queue() RPC.
 *  Returns { ticket } on success or { error } on failure — never throws,
 *  so a Server Action rejection never crashes a Server Component render. */
export async function joinQueue(
  storeId: string
): Promise<{ ticket: Record<string, unknown> | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('join_queue', {
    p_store_id: storeId,
  })

  if (error) return { ticket: null, error: error.message }
  return { ticket: data as Record<string, unknown>, error: null }
}

/** Customer: cancel their own waiting ticket via the leave_queue() RPC */
export async function leaveQueue(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('leave_queue', {
    p_ticket_id: ticketId,
  })

  if (error) throw new Error(error.message)
}

/** Staff: advance to the next waiting customer via the call_next() RPC */
export async function callNext(storeId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('call_next', {
    p_store_id: storeId,
  })

  if (error) throw new Error(error.message)
  return data
}

/** Staff: mark the currently-called ticket as a no-show; starts 5-min countdown */
export async function markNoShow(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'no_show',
      no_show_triggered_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
}

/** Staff: mark a called or no-show ticket as arrived; stamps arrived_at server-side */
export async function markArrived(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'arrived', arrived_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
}

/** Staff: mark an arrived ticket as served — the only way to remove a customer from the dashboard.
 *  Also recomputes the rolling EWT for the store and stamps it on stores.ewt_minutes so the
 *  customer-facing store listing updates in real-time via the existing stores Realtime channel. */
export async function markServed(ticketId: string) {
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({ status: 'completed', served_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select('store_id, called_at')
    .single()

  if (error) throw new Error(error.message)
  if (!ticket?.store_id) return

  // Rolling average of up to 3 most recent served durations today (UTC day boundary)
  const todayUtc = new Date()
  todayUtc.setUTCHours(0, 0, 0, 0)

  const { data: recent } = await supabase
    .from('tickets')
    .select('called_at, served_at')
    .eq('store_id', ticket.store_id)
    .eq('status', 'completed')
    .not('called_at', 'is', null)
    .not('served_at', 'is', null)
    .gte('created_at', todayUtc.toISOString())
    .order('served_at', { ascending: false })
    .limit(3)

  if (!recent || recent.length === 0) return

  const totalMs = recent.reduce((sum, t) => {
    if (!t.called_at || !t.served_at) return sum
    return sum + (new Date(t.served_at).getTime() - new Date(t.called_at).getTime())
  }, 0)
  const validCount = recent.filter((t) => t.called_at && t.served_at).length
  if (validCount === 0) return

  const ewt = Math.max(1, Math.round(totalMs / validCount / 60_000))
  await supabase.from('stores').update({ ewt_minutes: ewt }).eq('id', ticket.store_id)
}

/** Staff: update the vibe/occupancy status of their store */
export async function updateVibeStatus(storeId: string, status: VibeStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ vibe_status: status })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}

/** Staff: toggle the store open/closed */
export async function toggleStoreOpen(storeId: string, isOpen: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ is_open: isOpen })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}

/** Customer: submit an anonymous post-service rating */
export async function submitRating(
  ticketId: string,
  storeId: string,
  stars: number,
  message: string | null
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ratings')
    .insert({ queue_entry_id: ticketId, store_id: storeId, stars, message })

  if (error) throw new Error(error.message)
}

/** Staff: toggle the queue cutoff — prevents new customers from joining when closing soon */
export async function toggleCutoff(storeId: string, isCutoff: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ is_cutoff: isCutoff })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}
