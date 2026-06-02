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

// ── MEQ (Missed Entry Queue) server actions ───────────────────────────────────

/** Customer: signal they are returning to the counter.
 *  Sets customer_returning = true, which surfaces the "On their way" badge
 *  on the staff Missed tab.  Does NOT reinstate them automatically. */
export async function markCustomerReturning(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('set_customer_returning', {
    p_ticket_id: ticketId,
  })

  if (error) throw new Error(error.message)
}

/** Customer: permanently exit from their missed queue entry (deletes the row). */
export async function exitMissedQueue(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('exit_missed_queue', {
    p_ticket_id: ticketId,
  })

  if (error) throw new Error(error.message)
}

/** Staff: reinstate a missed customer back into the active waiting queue.
 *
 *  Interleaved 1:1 insertion rule:
 *    – The missed customer is placed AFTER the first currently-waiting customer.
 *    – Their position is set to the midpoint between the 1st and 2nd waiting
 *      entries (fractional FLOAT8), so no other ticket's position changes.
 *    – If the queue is empty they go to position 0.5 (served next).
 *    – If only one person is waiting they go to firstPosition + 0.5.
 *
 *  Guards: reinstatement is idempotent — a ticket whose reinstated flag is
 *  already true is rejected both here and by the disabled button in the UI. */
export async function reinstateEntry(ticketId: string, storeId: string) {
  const supabase = await createClient()

  // Verify caller is staff for this store
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) throw new Error('Unauthorized')

  const { data: staffRecord } = await supabase
    .from('staff')
    .select('store_id')
    .eq('id', user.id)
    .eq('store_id', storeId)
    .single()

  if (!staffRecord) throw new Error('Forbidden')

  // Fetch the missed ticket (verify it exists, is missed, and not yet reinstated)
  const { data: missed } = await supabase
    .from('tickets')
    .select('id, reinstated, status')
    .eq('id', ticketId)
    .eq('store_id', storeId)
    .eq('status', 'missed')
    .single()

  if (!missed) throw new Error('Ticket not found or not in missed status')
  if (missed.reinstated) throw new Error('Already reinstated')

  // Fetch all currently waiting tickets (both columns needed for fractional maths)
  const { data: waiting } = await supabase
    .from('tickets')
    .select('id, queue_number, position')
    .eq('store_id', storeId)
    .eq('status', 'waiting')

  // Sort in JS so COALESCE(position, queue_number) logic is fully applied
  const waitingList = (waiting ?? []).sort((a, b) => {
    const posA = a.position ?? a.queue_number
    const posB = b.position ?? b.queue_number
    return posA - posB
  })

  // 1:1 interleaved insertion: place after the 1st waiting customer
  let newPosition: number
  if (waitingList.length === 0) {
    newPosition = 0.5
  } else if (waitingList.length === 1) {
    const firstPos = waitingList[0].position ?? waitingList[0].queue_number
    newPosition = firstPos + 0.5
  } else {
    const firstPos  = waitingList[0].position ?? waitingList[0].queue_number
    const secondPos = waitingList[1].position ?? waitingList[1].queue_number
    newPosition = (firstPos + secondPos) / 2
  }

  // Atomically transition status back to waiting with the computed position.
  // The extra .eq('reinstated', false) guard prevents a race-condition double-reinstate.
  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'waiting',
      meq_expires_at: null,
      reinstated: true,
      position: newPosition,
    })
    .eq('id', ticketId)
    .eq('status', 'missed')
    .eq('reinstated', false)

  if (error) throw new Error(error.message)
}

/** Staff: permanently remove a missed entry (hard delete). */
export async function removeMissedEntry(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
}
