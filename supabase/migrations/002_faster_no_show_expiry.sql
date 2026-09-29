-- ============================================================
-- Run manually in the Supabase SQL Editor (preview and prod share one project,
-- so this takes effect in production immediately).
-- Requires pg_cron >= 1.5 (sub-minute schedules):
--   select extversion from pg_extension where extname = 'pg_cron';
--
-- Moves no_show -> missed within ~5s of the 5-minute window ending, instead of
-- waiting up to 60s for the next minute tick. Window (5 min) and MEQ (45 min)
-- are unchanged. The UPDATE is idempotent: a row matches only once.
-- ============================================================

SELECT cron.schedule(
  'void-expired-no-shows',
  '5 seconds',
  $$
    UPDATE tickets
       SET status         = 'missed',
           meq_expires_at = NOW() + INTERVAL '45 minutes'
     WHERE status                = 'no_show'
       AND no_show_triggered_at < NOW() - INTERVAL '5 minutes';
  $$
);
