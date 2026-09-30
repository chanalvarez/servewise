-- ============================================================
-- ServeWise — Automatic No-Show after the 2-minute called countdown
-- Run manually in the Supabase SQL Editor, in order (preview and prod share
-- one project, so this takes effect in production immediately).
-- Requires migration 003 (get_no_show_minutes).
-- ============================================================

-- 1. Shared core: the ONLY place that performs called -> no_show.
--    p_ticket_id NULL = every ticket; p_only_if_expired adds the 2-minute rule.
--    The WHERE status = 'called' guard makes the transition happen exactly once.
CREATE OR REPLACE FUNCTION public.apply_no_show(
  p_ticket_id uuid DEFAULT NULL, p_only_if_expired boolean DEFAULT true)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE n int;
BEGIN
  UPDATE public.tickets
     SET status = 'no_show'::public.ticket_status,
         no_show_triggered_at = now()
   WHERE status = 'called'::public.ticket_status
     AND (p_ticket_id IS NULL OR id = p_ticket_id)
     AND (NOT p_only_if_expired OR called_at <= now() - interval '2 minutes');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.apply_no_show(uuid, boolean) FROM PUBLIC, anon, authenticated;

-- 2. Manual "No Show" button (staff of the ticket's store only; works before 2 minutes)
CREATE OR REPLACE FUNCTION public.mark_no_show(p_ticket_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tickets t JOIN public.staff s ON s.store_id = t.store_id
    WHERE t.id = p_ticket_id AND s.id = auth.uid()
  ) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN public.apply_no_show(p_ticket_id, false) > 0;
END $$;
REVOKE ALL ON FUNCTION public.mark_no_show(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_no_show(uuid) TO authenticated;

-- 3. One job body: existing no_show -> missed step first, then called -> no_show
CREATE OR REPLACE FUNCTION public.process_queue_timeouts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.tickets
     SET status = 'missed'::public.ticket_status,
         meq_expires_at = now() + interval '45 minutes'
   WHERE status = 'no_show'::public.ticket_status
     AND no_show_triggered_at < now() - make_interval(mins => public.get_no_show_minutes());
  PERFORM public.apply_no_show(NULL, true);
END $$;
REVOKE ALL ON FUNCTION public.process_queue_timeouts() FROM PUBLIC, anon, authenticated;

-- 4. Repoint the EXISTING job (same name, same 5 seconds). Run last, after deploy.
SELECT cron.schedule('void-expired-no-shows', '5 seconds', $$SELECT public.process_queue_timeouts();$$);

-- Rollback: re-run step 4 of migration 003 (inline UPDATE using get_no_show_minutes()).
