-- ============================================================
-- ServeWise — Supabase SQL Schema
-- Run this in your Supabase project's SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";     -- Enable via Dashboard → Database → Extensions if not present

-- ── Enum Types ────────────────────────────────────────────────────────────────

CREATE TYPE vibe_status AS ENUM ('green', 'yellow', 'red');
CREATE TYPE ticket_status AS ENUM ('waiting', 'called', 'arrived', 'no_show', 'voided', 'completed');

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE malls (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,           -- URL segment, e.g. "mid-valley"
  address    TEXT,
  city       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mall_id           UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT,                    -- e.g. "F&B", "Fashion", "Health"
  floor             TEXT,
  unit_number       TEXT,
  vibe_status       vibe_status NOT NULL DEFAULT 'green',
  current_serving   INT         NOT NULL DEFAULT 0,
  last_queue_number INT         NOT NULL DEFAULT 0,
  is_open           BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id             UUID         NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id          UUID         NOT NULL,  -- auth.uid() of the anonymous/named user
  queue_number         INT          NOT NULL,
  status               ticket_status NOT NULL DEFAULT 'waiting',
  no_show_triggered_at TIMESTAMPTZ,            -- set by staff; drives the 5-min countdown
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Links Supabase Auth users → store they manage
CREATE TABLE staff (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX idx_malls_slug        ON malls(slug);
CREATE INDEX idx_stores_mall_id           ON stores(mall_id);
CREATE INDEX idx_tickets_store_id         ON tickets(store_id);
CREATE INDEX idx_tickets_customer_id      ON tickets(customer_id);
CREATE INDEX idx_tickets_status           ON tickets(status);
CREATE INDEX idx_tickets_no_show_expires  ON tickets(no_show_triggered_at) WHERE status = 'no_show';

-- ── updated_at Trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RPC: join_queue ───────────────────────────────────────────────────────────
-- Atomically reserves the next queue number and creates the ticket.
-- Prevents the same customer from holding two active tickets for the same store.

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

  -- Prevent duplicate active ticket for the same store
  IF EXISTS (
    SELECT 1 FROM tickets
    WHERE store_id   = p_store_id
      AND customer_id = v_uid
      AND status IN ('waiting', 'called', 'no_show')
  ) THEN
    RAISE EXCEPTION 'Already in queue for this store';
  END IF;

  -- Check store is open
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id AND is_open = true) THEN
    RAISE EXCEPTION 'Store is currently closed';
  END IF;

  -- Atomically increment the queue counter
  UPDATE stores
    SET last_queue_number = last_queue_number + 1
  WHERE id = p_store_id
  RETURNING last_queue_number INTO v_next_num;

  INSERT INTO tickets (store_id, customer_id, queue_number)
  VALUES (p_store_id, v_uid, v_next_num)
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: leave_queue ─────────────────────────────────────────────────────────
-- Allows a customer to void their own waiting ticket.

CREATE OR REPLACE FUNCTION leave_queue(p_ticket_id UUID)
RETURNS void AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  UPDATE tickets
  SET status = 'voided'
  WHERE id          = p_ticket_id
    AND customer_id = v_uid
    AND status      = 'waiting';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or cannot be cancelled';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: call_next ────────────────────────────────────────────────────────────
-- Staff action: completes any lingering 'called' ticket, then calls the next waiting one.

CREATE OR REPLACE FUNCTION call_next(p_store_id UUID)
RETURNS tickets AS $$
DECLARE
  v_ticket tickets;
BEGIN
  -- Verify the caller is staff for this store
  IF NOT EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND store_id = p_store_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Resolve any still-open 'called' ticket as completed
  UPDATE tickets SET status = 'completed'
  WHERE store_id = p_store_id AND status = 'called';

  -- Grab the next waiting ticket (skip-locked for concurrent safety)
  SELECT * INTO v_ticket
  FROM tickets
  WHERE store_id = p_store_id AND status = 'waiting'
  ORDER BY queue_number ASC
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF v_ticket IS NULL THEN
    RAISE EXCEPTION 'No waiting customers';
  END IF;

  UPDATE tickets SET status = 'called'
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE stores SET current_serving = v_ticket.queue_number
  WHERE id = p_store_id;

  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── pg_cron: auto-void no-shows after 5 minutes ───────────────────────────────

SELECT cron.schedule(
  'void-expired-no-shows',
  '* * * * *',
  $$
    UPDATE tickets
    SET    status = 'voided'
    WHERE  status                = 'no_show'
      AND  no_show_triggered_at < NOW() - INTERVAL '5 minutes';
  $$
);

-- ── Realtime Publications ──────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE stores;

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE malls   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff   ENABLE ROW LEVEL SECURITY;

-- Malls: anyone can read
CREATE POLICY "malls_read_all" ON malls FOR SELECT USING (true);

-- Stores: anyone can read
CREATE POLICY "stores_read_all" ON stores FOR SELECT USING (true);

-- Stores: staff can update their own store (vibe_status, is_open, current_serving)
CREATE POLICY "stores_staff_update" ON stores FOR UPDATE
  USING (id IN (SELECT store_id FROM staff WHERE id = auth.uid()));

-- Tickets: customers read their own; staff read all tickets in their store
CREATE POLICY "tickets_read" ON tickets FOR SELECT
  USING (
    customer_id = auth.uid()
    OR store_id IN (SELECT store_id FROM staff WHERE id = auth.uid())
  );

-- Tickets: insert handled by join_queue() SECURITY DEFINER — direct insert also allowed for own customer_id
CREATE POLICY "tickets_insert_own" ON tickets FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Tickets: staff can update status fields for their store's tickets
CREATE POLICY "tickets_staff_update" ON tickets FOR UPDATE
  USING (store_id IN (SELECT store_id FROM staff WHERE id = auth.uid()));

-- Staff: members can read only their own record
CREATE POLICY "staff_read_self" ON staff FOR SELECT USING (id = auth.uid());
