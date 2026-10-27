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

-- SM City Demo — high-dwell stores only, all three Live Vibe states
INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number, is_open, is_cutoff)
SELECT m.id, v.name, v.cat, v.fl, v.unit, v.vibe::vibe_status, v.serving, v.last, true, false
FROM malls m
CROSS JOIN (VALUES
  ('Hearth Grill',            'Restaurant',  'L4', '402',  'red',    6, 19),
  ('Sakura Ramen House',      'Restaurant',  'L4', '410',  'green',  4, 14),
  ('Studio Nine Salon',       'Salon',       'L1', '108',  'yellow', 3, 11),
  ('Snapbox Photo Booth',     'Photo Booth', 'L2', '215',  'green',  1,  3)
) AS v(name, cat, fl, unit, vibe, serving, last)
WHERE m.slug = 'sm-city-demo';

-- Ayala Demo
INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number, is_open, is_cutoff)
SELECT m.id, v.name, v.cat, v.fl, v.unit, v.vibe::vibe_status, v.serving, v.last, true, false
FROM malls m
CROSS JOIN (VALUES
  ('Harbor Kitchen',          'Restaurant',  'L4', '401',  'red',    5, 18),
  ('Trattoria Verde',         'Restaurant',  'L4', '405',  'yellow', 4, 10),
  ('Cut & Co. Barber',        'Barber Shop', 'L1', '125',  'green',  2,  5),
  ('Glow Nail Studio',        'Salon',       'L1', '130',  'green',  1,  4)
) AS v(name, cat, fl, unit, vibe, serving, last)
WHERE m.slug = 'ayala-demo';
