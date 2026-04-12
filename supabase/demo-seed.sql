-- ============================================================
-- ServeWise — Demo portfolio seed
-- Run in Supabase SQL Editor after schema.sql on your demo project.
-- Replaces demo malls/stores if they already exist (by slug).
-- ============================================================

-- Remove previous demo data (order respects FKs)
DELETE FROM tickets
WHERE store_id IN (
  SELECT s.id FROM stores s
  JOIN malls m ON s.mall_id = m.id
  WHERE m.slug IN ('sm-city-demo', 'ayala-demo')
);

DELETE FROM staff
WHERE store_id IN (
  SELECT s.id FROM stores s
  JOIN malls m ON s.mall_id = m.id
  WHERE m.slug IN ('sm-city-demo', 'ayala-demo')
);

DELETE FROM stores
WHERE mall_id IN (SELECT id FROM malls WHERE slug IN ('sm-city-demo', 'ayala-demo'));

DELETE FROM malls WHERE slug IN ('sm-city-demo', 'ayala-demo');

-- Malls
INSERT INTO malls (name, slug, address, city) VALUES
  ('SM City Demo', 'sm-city-demo', '6015 Demo Boulevard', 'Cebu City'),
  ('Ayala Demo', 'ayala-demo', 'Cebu Business Park', 'Cebu City');

-- SM City Demo — 4 stores with active-looking counters + mixed vibe
INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number, is_open, is_cutoff)
SELECT m.id, v.name, v.cat, v.fl, v.unit, v.vibe::vibe_status, v.serving, v.last, true, false
FROM malls m
CROSS JOIN (VALUES
  ('Brew & Bite Café',        'Cafe',        'G',  'G-12', 'green',  4, 14),
  ('TechHub Accessories',     'Electronics', 'L2', '206',  'yellow', 2,  9),
  ('Peak Sports Outlet',      'Sports',      'L3', '312',  'green',  6, 18),
  ('Studio Nine Salon',       'Salon',       'L1', '108',  'red',    1, 11)
) AS v(name, cat, fl, unit, vibe, serving, last)
WHERE m.slug = 'sm-city-demo';

-- Ayala Demo — 4 stores
INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number, is_open, is_cutoff)
SELECT m.id, v.name, v.cat, v.fl, v.unit, v.vibe::vibe_status, v.serving, v.last, true, false
FROM malls m
CROSS JOIN (VALUES
  ('Harbor Kitchen',          'Restaurant',  'L4', '401',  'yellow', 3, 12),
  ('Urban Threads',           'Clothing',    'L2', '215',  'green',  5, 16),
  ('Glow Beauty Lab',         'Health',      'L1', '125',  'red',    0,  7),
  ('Pages & Coffee',          'Book Store',  'G',  'G-08', 'green',  2,  8)
) AS v(name, cat, fl, unit, vibe, serving, last)
WHERE m.slug = 'ayala-demo';
