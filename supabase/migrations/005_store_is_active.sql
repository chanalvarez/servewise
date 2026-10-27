-- 005: Narrow the catalog to high-dwell service businesses.
-- Adds stores.is_active and retires the low-dwell stores (rows are kept, so
-- tickets / ratings / staff links stay intact). Idempotent; safe to re-run.
-- Run in the MAIN Supabase project's SQL Editor. Deploy the app code first or
-- right after: until then the old code ignores is_active and still lists them.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE stores
SET is_active = false
WHERE lower(name) IN (
  'zara', 'uniqlo', 'pull&bear', 'charles&keith', 'cln',
  'nike', 'decathlon',
  'jollibee',
  'apple store', 'the loop',
  'starbucks', 'elim central',
  'national book store', 'fullybooked',
  'watsons'
);

-- Live Vibe demo: make sure each mall has a Very busy (red) restaurant.
UPDATE stores s SET vibe_status = 'red', current_serving = 6, last_queue_number = 19
FROM malls m WHERE s.mall_id = m.id AND m.slug = 'ayala-center-cebu' AND s.name = 'Chili''s';
UPDATE stores s SET vibe_status = 'yellow', current_serving = 4, last_queue_number = 10
FROM malls m WHERE s.mall_id = m.id AND m.slug = 'ayala-center-cebu' AND s.name = 'Brique Modern Kitchen';
UPDATE stores s SET vibe_status = 'red', current_serving = 6, last_queue_number = 20
FROM malls m WHERE s.mall_id = m.id AND m.slug = 'central-bloc' AND s.name = 'Meattogether';
UPDATE stores s SET vibe_status = 'yellow', current_serving = 5, last_queue_number = 11
FROM malls m WHERE s.mall_id = m.id AND m.slug = 'central-bloc' AND s.name = 'Myeongdong';
UPDATE stores s SET vibe_status = 'red', current_serving = 5, last_queue_number = 19
FROM malls m WHERE s.mall_id = m.id AND m.slug = 'sm-seaside' AND s.name = 'Somac Korean Buffet';

-- Verify: expect active stores per mall 5 / 6 / 4 / 7 and all three vibes in each mall.
SELECT m.name AS mall, count(*) AS active_stores,
       count(*) FILTER (WHERE s.vibe_status = 'green')  AS not_busy,
       count(*) FILTER (WHERE s.vibe_status = 'yellow') AS moderate,
       count(*) FILTER (WHERE s.vibe_status = 'red')    AS very_busy
FROM stores s JOIN malls m ON m.id = s.mall_id
WHERE s.is_active
GROUP BY m.name ORDER BY m.name;

-- Rollback: UPDATE stores SET is_active = true WHERE NOT is_active;
