'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_RESTRICTED_MESSAGE, isDemoMode } from '@/lib/demo'
import type { VibeStatus } from '@/types'

function assertNotDemo() {
  if (isDemoMode()) throw new Error(DEMO_RESTRICTED_MESSAGE)
}

/** Customer: atomically join a store queue via the join_queue() RPC */
export async function joinQueue(storeId: string) {
  assertNotDemo()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('join_queue', {
    p_store_id: storeId,
  })

  if (error) throw new Error(error.message)
  return data
}

/** Customer: cancel their own waiting ticket via the leave_queue() RPC */
export async function leaveQueue(ticketId: string) {
  assertNotDemo()
  const supabase = await createClient()

  const { error } = await supabase.rpc('leave_queue', {
    p_ticket_id: ticketId,
  })

  if (error) throw new Error(error.message)
}

/** Staff: advance to the next waiting customer via the call_next() RPC */
export async function callNext(storeId: string) {
  assertNotDemo()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('call_next', {
    p_store_id: storeId,
  })

  if (error) throw new Error(error.message)
  return data
}

/** Staff: mark the currently-called ticket as a no-show; starts 5-min countdown */
export async function markNoShow(ticketId: string) {
  assertNotDemo()
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
  assertNotDemo()
  const supabase = await createClient()

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'arrived' })
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
}

/** Staff: update the vibe/occupancy status of their store */
export async function updateVibeStatus(storeId: string, status: VibeStatus) {
  assertNotDemo()
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ vibe_status: status })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}

/** Staff: toggle the store open/closed */
export async function toggleStoreOpen(storeId: string, isOpen: boolean) {
  assertNotDemo()
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ is_open: isOpen })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}

/** Staff: toggle the queue cutoff — prevents new customers from joining when closing soon */
export async function toggleCutoff(storeId: string, isCutoff: boolean) {
  assertNotDemo()
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ is_cutoff: isCutoff })
    .eq('id', storeId)

  if (error) throw new Error(error.message)
}
