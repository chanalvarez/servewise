-- ============================================================
-- ServeWise — Phase 2: keep only the tables the app subscribes to in supabase_realtime
-- Run manually in the SQL Editor. Idempotent. Rollback at the bottom.
-- The app subscribes to: tickets (customer + staff), stores (customer + staff + directory).
-- It never subscribes to ratings (staff Feedback tab uses manual refresh).
-- ============================================================

-- 0. Inspect first (read-only): what is in the publication right now?
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY 1, 2;

-- 1. Drop ratings from the publication (only if it is there). Every ratings insert/update
--    otherwise gets decoded by realtime.list_changes for no subscriber.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables
              WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ratings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.ratings;
  END IF;
END $$;

-- 2. Any OTHER table listed by the inspect query above that is not tickets or stores can be
--    removed the same way:  ALTER PUBLICATION supabase_realtime DROP TABLE public.<name>;

-- ROLLBACK:
--   ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
