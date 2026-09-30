-- ============================================================
-- ServeWise — Configurable no-show window
-- Run manually in the Supabase SQL Editor, in order (preview and prod share
-- one project, so this takes effect in production immediately).
-- Default 5 minutes. To switch (SQL Editor only, no UI toggle):
--   demo:     update public.app_settings set no_show_minutes = 1;
--   restore:  update public.app_settings set no_show_minutes = 5;
--   check:    select no_show_minutes from public.app_settings;
-- ============================================================

-- 1. Single-row settings table
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  no_show_minutes integer NOT NULL DEFAULT 5 CHECK (no_show_minutes BETWEEN 1 AND 10)
);
INSERT INTO public.app_settings (id) VALUES (true);

-- 2. RLS: everyone can read; nobody can write through the API
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_settings_read ON public.app_settings FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.app_settings FROM anon, authenticated;

-- 3. Helper: falls back to 5 if the row is missing
CREATE OR REPLACE FUNCTION public.get_no_show_minutes()
RETURNS int LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT COALESCE((SELECT no_show_minutes FROM public.app_settings LIMIT 1), 5) $$;
REVOKE ALL ON FUNCTION public.get_no_show_minutes() FROM PUBLIC, anon, authenticated;

-- 4. Repoint the existing job (same name, same 5 seconds). Run last.
SELECT cron.schedule('void-expired-no-shows', '5 seconds', $$
  UPDATE public.tickets
     SET status = 'missed', meq_expires_at = NOW() + INTERVAL '45 minutes'
   WHERE status = 'no_show'
     AND no_show_triggered_at < NOW() - make_interval(mins => public.get_no_show_minutes());
$$);
