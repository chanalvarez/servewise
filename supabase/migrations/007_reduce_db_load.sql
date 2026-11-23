-- ============================================================
-- ServeWise — Phase 1: reduce background DB load (Nano / Disk IO budget)
-- Run manually in the Supabase SQL Editor, top to bottom. Idempotent.
-- Does NOT touch cron job 2's schedule (changed separately via cron.alter_job),
-- the no-show window value, or which tickets any job deletes.
-- Rollback for each step is at the bottom.
-- ============================================================

-- 1. Partial index for the "called > 2 min ago" check in process_queue_timeouts.
--    Rows with status = 'called' are ~1 per store, so this index stays tiny and
--    lets the check read ~0 pages instead of walking idx_tickets_status.
CREATE INDEX IF NOT EXISTS idx_tickets_called_at
  ON public.tickets (called_at) WHERE status = 'called';

-- Already created by schema.sql / 001_meq.sql; repeated here so a fresh project
-- ends up identical. Same names => no-op where they already exist.
CREATE INDEX IF NOT EXISTS idx_tickets_no_show_expires
  ON public.tickets (no_show_triggered_at) WHERE status = 'no_show';
CREATE INDEX IF NOT EXISTS idx_tickets_meq_expires
  ON public.tickets (meq_expires_at) WHERE status = 'missed';

-- 2. process_queue_timeouts: return immediately when nothing can expire.
--    Same two transitions, same order, same rules as migration 004
--    (no_show -> missed after the configured window; called -> no_show after 2 min,
--    via the shared apply_no_show()). Only difference: two index-only EXISTS probes
--    run first, so the usual tick performs no UPDATE at all.
CREATE OR REPLACE FUNCTION public.process_queue_timeouts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_window interval := make_interval(mins => public.get_no_show_minutes());
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tickets
                  WHERE status = 'no_show'::public.ticket_status
                    AND no_show_triggered_at < now() - v_window)
     AND NOT EXISTS (SELECT 1 FROM public.tickets
                      WHERE status = 'called'::public.ticket_status
                        AND called_at <= now() - interval '2 minutes')
  THEN
    RETURN;
  END IF;

  UPDATE public.tickets
     SET status = 'missed'::public.ticket_status,
         meq_expires_at = now() + interval '45 minutes'
   WHERE status = 'no_show'::public.ticket_status
     AND no_show_triggered_at < now() - v_window;

  PERFORM public.apply_no_show(NULL, true);
END $$;
REVOKE ALL ON FUNCTION public.process_queue_timeouts() FROM PUBLIC, anon, authenticated;

-- 3. OPTIONAL — job 3 (cleanup-expired-meq). Its DELETE is already index-backed by
--    idx_tickets_meq_expires, so there is nothing to fix in the query. Leave it at
--    every minute unless you also want fewer cron runs; staff's Missed tab does not
--    filter by meq_expires_at, so a slower schedule leaves expired rows visible longer.
--    To run it every 5 minutes anyway:
-- SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-meq'),
--                       schedule => '*/5 * * * *');

-- ============================================================
-- ROLLBACK
--   Step 2: re-run the process_queue_timeouts definition from
--           supabase/migrations/004_auto_no_show.sql (section 3).
--   Step 1: DROP INDEX IF EXISTS public.idx_tickets_called_at;
--           (leave the other two indexes; they pre-date this migration)
--   Step 3: SELECT cron.alter_job(<jobid>, schedule => '* * * * *');
-- ============================================================
