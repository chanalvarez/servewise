-- ============================================================
-- ServeWise — Phase 1c: join_queue closes the double-tap race (OPTIONAL)
-- Run manually in the SQL Editor. Idempotent. Rollback at the bottom.
--
-- Before: the "already in queue" check ran BEFORE the stores row was locked, so two
-- simultaneous calls from the same customer (double tap, network retry) could both
-- pass it and create two tickets with two queue numbers.
-- After: the store row is locked first, so the second call waits, then sees the first
-- ticket and raises 'Already in queue for this store'. That is what makes a client
-- retry of join_queue safe (Phase 3).
--
-- Unchanged: queue numbers (last_queue_number + 1, permanent), error messages and their
-- order (already in queue -> closed -> cutoff), statuses checked, position = queue_number.
-- Also merges the two stores lookups into one and pins search_path (was unset).
-- ============================================================

CREATE OR REPLACE FUNCTION public.join_queue(p_store_id uuid)
RETURNS public.tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_ticket    public.tickets;
  v_next_num  int;
  v_uid       uuid := auth.uid();
  v_is_open   boolean;
  v_is_cutoff boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Serialise joins per store (the same row lock the counter UPDATE below takes anyway).
  SELECT is_open, is_cutoff INTO v_is_open, v_is_cutoff
    FROM public.stores WHERE id = p_store_id FOR UPDATE;

  -- Prevent duplicate active ticket (includes missed entries)
  IF EXISTS (
    SELECT 1 FROM public.tickets
    WHERE store_id    = p_store_id
      AND customer_id = v_uid
      AND status IN ('waiting', 'called', 'no_show', 'missed')
  ) THEN
    RAISE EXCEPTION 'Already in queue for this store';
  END IF;

  IF v_is_open IS NOT TRUE THEN   -- also true when the store does not exist
    RAISE EXCEPTION 'Store is currently closed';
  END IF;

  IF v_is_cutoff IS TRUE THEN
    RAISE EXCEPTION 'Queue is closed — this store has stopped accepting new customers';
  END IF;

  UPDATE public.stores
     SET last_queue_number = last_queue_number + 1
   WHERE id = p_store_id
  RETURNING last_queue_number INTO v_next_num;

  -- Set position = queue_number so normal entries sort identically to before.
  INSERT INTO public.tickets (store_id, customer_id, queue_number, position)
  VALUES (p_store_id, v_uid, v_next_num, v_next_num)
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$function$;

-- ============================================================
-- ROLLBACK: re-create the previous body (the deployed version, from supabase/migrations/001_meq.sql §7
-- minus nothing: it is identical to that file's join_queue).
-- ============================================================
