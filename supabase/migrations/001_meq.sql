-- ============================================================
-- ServeWise — Missed Entry Queue (MEQ) Migration
-- Apply in Supabase Dashboard → SQL Editor
-- Run the ALTER TYPE line first (outside a transaction if needed),
-- then run the rest as one block.
-- ============================================================

-- ── 1. Extend enum ────────────────────────────────────────────────────────────
-- Must be committed before dependent DDL in some PG versions.
-- The IF NOT EXISTS guard makes re-runs safe.

ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'missed';

-- ── 2. New columns on tickets ─────────────────────────────────────────────────

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS meq_expires_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_returning  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reinstated          BOOLEAN     NOT NULL DEFAULT false,
  -- Float so reinstated entries can sit at fractional positions (e.g. 2.5)
  -- between existing whole-number positions without renumbering the whole queue.
  ADD COLUMN IF NOT EXISTS position            FLOAT8;

-- ── 3. Index for MEQ expiry cleanup cron ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tickets_meq_expires
  ON tickets (meq_expires_at)
  WHERE status = 'missed';

-- ── 4. RLS: staff may delete tickets in their store (Remove button) ───────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'tickets'
      AND policyname = 'tickets_staff_delete'
  ) THEN
    CREATE POLICY "tickets_staff_delete" ON tickets FOR DELETE
      USING (store_id IN (SELECT store_id FROM staff WHERE id = auth.uid()));
  END IF;
END $$;

-- ── 5. SECURITY DEFINER: customer confirms they are returning ─────────────────

CREATE OR REPLACE FUNCTION set_customer_returning(p_ticket_id UUID)
RETURNS void AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE tickets
     SET customer_returning = true
   WHERE id          = p_ticket_id
     AND customer_id = v_uid
     AND status      = 'missed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or not in missed status';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. SECURITY DEFINER: customer exits the missed queue ──────────────────────

CREATE OR REPLACE FUNCTION exit_missed_queue(p_ticket_id UUID)
RETURNS void AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  DELETE FROM tickets
   WHERE id          = p_ticket_id
     AND customer_id = v_uid
     AND status      = 'missed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or not in missed status';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Update join_queue: set position, guard against 'missed' re-join ────────

CREATE OR REPLACE FUNCTION join_queue(p_store_id UUID)
RETURNS tickets AS $$
DECLARE
  v_ticket   tickets;
  v_next_num INT;
  v_uid      UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent duplicate active ticket (now includes missed entries)
  IF EXISTS (
    SELECT 1 FROM tickets
    WHERE store_id   = p_store_id
      AND customer_id = v_uid
      AND status IN ('waiting', 'called', 'no_show', 'missed')
  ) THEN
    RAISE EXCEPTION 'Already in queue for this store';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id AND is_open = true) THEN
    RAISE EXCEPTION 'Store is currently closed';
  END IF;

  IF EXISTS (SELECT 1 FROM stores WHERE id = p_store_id AND is_cutoff = true) THEN
    RAISE EXCEPTION 'Queue is closed — this store has stopped accepting new customers';
  END IF;

  UPDATE stores
     SET last_queue_number = last_queue_number + 1
   WHERE id = p_store_id
  RETURNING last_queue_number INTO v_next_num;

  -- Set position = queue_number so normal entries sort identically to before.
  INSERT INTO tickets (store_id, customer_id, queue_number, position)
  VALUES (p_store_id, v_uid, v_next_num, v_next_num)
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. Update call_next: order by COALESCE(position, queue_number) ────────────
-- Reinstated entries have a fractional position (e.g. 2.5) so they slot in
-- after the first waiting customer without renumbering anyone else.

CREATE OR REPLACE FUNCTION call_next(p_store_id UUID)
RETURNS tickets AS $$
DECLARE
  v_ticket tickets;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND store_id = p_store_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Resolve any lingering 'called' ticket
  UPDATE tickets SET status = 'completed'
   WHERE store_id = p_store_id AND status = 'called';

  -- Next waiting ticket by effective service position
  SELECT * INTO v_ticket
    FROM tickets
   WHERE store_id = p_store_id AND status = 'waiting'
   ORDER BY COALESCE(position, queue_number::FLOAT8) ASC
   LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF v_ticket IS NULL THEN
    RAISE EXCEPTION 'No waiting customers';
  END IF;

  UPDATE tickets SET status = 'called', called_at = NOW()
   WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE stores SET current_serving = v_ticket.queue_number
   WHERE id = p_store_id;

  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Replace no-show expiry cron ────────────────────────────────────────────
-- Old job voided no-shows. New job transitions them to 'missed' with a 45-min
-- MEQ window instead of deleting them.

SELECT cron.unschedule('void-expired-no-shows');

SELECT cron.schedule(
  'void-expired-no-shows',
  '* * * * *',
  $$
    UPDATE tickets
       SET status        = 'missed',
           meq_expires_at = NOW() + INTERVAL '45 minutes'
     WHERE status                = 'no_show'
       AND no_show_triggered_at < NOW() - INTERVAL '5 minutes';
  $$
);

-- ── 10. New cron: delete expired MEQ entries every minute ────────────────────
-- Customers whose MEQ window lapses are permanently removed.
-- The DELETE fires a Realtime event that the customer browser intercepts
-- to show the expiry screen (client-side fallback also covers missed events).

SELECT cron.schedule(
  'cleanup-expired-meq',
  '* * * * *',
  $$
    DELETE FROM tickets
     WHERE status = 'missed'
       AND meq_expires_at <= NOW();
  $$
);
