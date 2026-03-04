'use server'

import { createClient } from '@/lib/supabase/server'
import type { VibeStatus } from '@/types'

/** Customer: atomically join a store queue via the join_queue() RPC */
export async function joinQueue(storeId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('join_queue', {
    p_store_id: storeId,
  })

  if (error) throw new Error(error.message)
  return data
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

/** Staff: mark a called or no-show ticket as arrived */
export async function markArrived(ticketId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'arrived' })
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
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
