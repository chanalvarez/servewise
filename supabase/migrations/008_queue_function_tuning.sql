-- ============================================================
-- ServeWise — Phase 1b: cheaper queue-count reads (pure performance, same results)
-- Run manually in the Supabase SQL Editor, top to bottom. Idempotent.
-- Rollback is at the bottom.
-- ============================================================

-- 1. Partial index matching the "active ticket" filter used by get_queue_snapshot
--    and my_queue_positions. Excludes 'missed'/'completed', so it stays small.
CREATE INDEX IF NOT EXISTS idx_tickets_active_by_store
  ON public.tickets (store_id)
  WHERE status IN ('waiting','called','no_show','arrived');

-- 2. my_queue_positions: one scan per ticket instead of two (count(*) FILTER).
--    Same columns/types, same ordering rule (position, then queue_number),
--    same statuses: a called ticket still counts as "ahead" of those behind it.
CREATE OR REPLACE FUNCTION public.my_queue_positions()
RETURNS TABLE(ticket_id uuid, in_queue integer, ahead integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT m.id, c.in_queue, c.ahead
  FROM public.tickets m
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS in_queue,
           (count(*) FILTER (
              WHERE (COALESCE(a.position, a.queue_number::float8), a.queue_number)
                  < (COALESCE(m.position, m.queue_number::float8), m.queue_number)
           ))::int AS ahead
    FROM public.tickets a
    WHERE a.store_id = m.store_id
      AND a.status IN ('waiting','called','no_show','arrived')
  ) c
  WHERE m.customer_id = auth.uid() AND m.status IN ('waiting','called','no_show','arrived');
$function$;

-- get_queue_snapshot is intentionally NOT rewritten: its body is already a single
-- scan of the store's active tickets, and the index above is what it needed.

-- ============================================================
-- ROLLBACK
--   DROP INDEX IF EXISTS public.idx_tickets_active_by_store;
--   Then re-create the original my_queue_positions:
--   CREATE OR REPLACE FUNCTION public.my_queue_positions()
--   RETURNS TABLE(ticket_id uuid, in_queue integer, ahead integer)
--   LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
--   AS $function$
--     SELECT m.id,
--       (SELECT count(*)::int FROM public.tickets a
--         WHERE a.store_id = m.store_id AND a.status IN ('waiting','called','no_show','arrived')),
--       (SELECT count(*)::int FROM public.tickets a
--         WHERE a.store_id = m.store_id AND a.status IN ('waiting','called','no_show','arrived')
--           AND (COALESCE(a.position, a.queue_number::float8), a.queue_number)
--             < (COALESCE(m.position, m.queue_number::float8), m.queue_number))
--     FROM public.tickets m
--     WHERE m.customer_id = auth.uid() AND m.status IN ('waiting','called','no_show','arrived');
--   $function$;
-- ============================================================
