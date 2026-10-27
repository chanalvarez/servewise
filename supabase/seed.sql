-- ============================================================
-- ServeWise — Seed Data (Cebu, Philippines)
-- Run AFTER schema.sql in your Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  ayala_center_id   UUID;
  central_bloc_id   UUID;
  sm_seaside_id     UUID;
  sm_city_id        UUID;
BEGIN
  -- ── Malls ──────────────────────────────────────────────────────────────────

  INSERT INTO malls (name, slug, address, city)
  VALUES ('Ayala Center Cebu', 'ayala-center-cebu', 'Cebu Business Park, Archbishop Reyes Ave', 'Cebu City')
  RETURNING id INTO ayala_center_id;

  INSERT INTO malls (name, slug, address, city)
  VALUES ('Ayala Malls Central Bloc', 'central-bloc', 'Cebu IT Park, Lahug', 'Cebu City')
  RETURNING id INTO central_bloc_id;

  INSERT INTO malls (name, slug, address, city)
  VALUES ('SM Seaside City Cebu', 'sm-seaside', 'SRP, South Road Properties, Mambaling', 'Cebu City')
  RETURNING id INTO sm_seaside_id;

  INSERT INTO malls (name, slug, address, city)
  VALUES ('SM City Cebu', 'sm-city-cebu', 'North Reclamation Area, Juan Luna Ave', 'Cebu City')
  RETURNING id INTO sm_city_id;

  -- ── Stores — Ayala Center Cebu ─────────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Photo Booth
    (ayala_center_id, 'Cheez',                  'Photo Booth',       '1st Floor',    '1F-040', 'green',  1,  2),
    -- Restaurant
    (ayala_center_id, 'Botejyu',                'Restaurant',        '4th Floor',    '4F-001', 'green',  3,  7),
    (ayala_center_id, 'Brique Modern Kitchen',  'Restaurant',        '4th Floor',    '4F-010', 'yellow', 4,  10),
    (ayala_center_id, 'Chili''s',               'Restaurant',        '4th Floor',    '4F-005', 'red',    6,  19),
    (ayala_center_id, 'Yakinabe',               'Restaurant',        '4th Floor',    '4F-015', 'green',  2,  6);

  -- ── Stores — Ayala Malls Central Bloc ─────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Barber Shop
    (central_bloc_id, 'Tuf Barber Shop',        'Barber Shop',       'Ground Floor', 'GF-010', 'green',  1,  3),
    -- Photo Booth
    (central_bloc_id, 'Cheez',                  'Photo Booth',       '1st Floor',    '1F-030', 'green',  1,  2),
    -- Restaurant
    (central_bloc_id, 'Meattogether',           'Restaurant',        '3rd Floor',    '3F-001', 'red',    6,  20),
    (central_bloc_id, 'Myeongdong',             'Restaurant',        '3rd Floor',    '3F-010', 'yellow', 5,  11),
    (central_bloc_id, 'Wingers Unlimited',      'Restaurant',        '3rd Floor',    '3F-005', 'green',  2,  6),
    -- Salon
    (central_bloc_id, 'Nailaholics',            'Salon',             'Ground Floor', 'GF-015', 'green',  1,  3);

  -- ── Stores — SM Seaside City Cebu ─────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Restaurant
    (sm_seaside_id, 'Botejyu',                'Restaurant',        '4th Floor',    '4F-001', 'green',  3,  7),
    (sm_seaside_id, 'Chili''s',               'Restaurant',        '4th Floor',    '4F-005', 'yellow', 4,  9),
    (sm_seaside_id, 'Majestic',               'Restaurant',        '4th Floor',    '4F-015', 'green',  3,  7),
    (sm_seaside_id, 'Somac Korean Buffet',    'Restaurant',        '4th Floor',    '4F-010', 'red',    5,  19);

  -- ── Stores — SM City Cebu ─────────────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Car Accessories
    (sm_city_id, 'Blade Auto Center',            'Car Accessories',   'Ground Floor', 'GF-030', 'green',  2,  5),
    -- Photo Booth
    (sm_city_id, 'Haru Studio',                  'Photo Booth',       '2nd Floor',    '2F-060', 'green',  1,  2),
    -- Restaurant
    (sm_city_id, 'Chili''s',                     'Restaurant',        '4th Floor',    '4F-015', 'green',  2,  6),
    (sm_city_id, 'Din Tai Fung',                 'Restaurant',        '4th Floor',    '4F-001', 'green',  3,  8),
    (sm_city_id, 'Majestic',                     'Restaurant',        '3rd Floor',    '3F-025', 'green',  4,  9),
    (sm_city_id, 'Vikings',                      'Restaurant',        '3rd Floor',    '3F-020', 'red',    18, 35),
    (sm_city_id, 'Wolfgang''s Steakhouse Grill', 'Restaurant',        '4th Floor',    '4F-010', 'yellow', 5,  12);

END $$;

-- ── Additional high-dwell stores (same statement as migrations/006) ───────────
-- Idempotent; includes Spa and Massage.
INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number, ewt_minutes)
SELECT m.id, v.name, v.cat, v.fl, v.unit, v.vibe::vibe_status, v.serving, v.qn, v.ewt
FROM (VALUES
  ('sm-city-cebu', 'Bioessence', 'Spa and Massage', '3rd Floor', '3F-070', 'green', 2, 4, 60),
  ('sm-city-cebu', 'Mendez Body and Face Salon and Spa', 'Spa and Massage', '3rd Floor', '3F-071', 'green', 1, 2, 60),
  ('sm-city-cebu', 'TUF Barbershop', 'Barber Shop', 'Ground Floor', 'GF-070', 'green', 4, 5, 20),
  ('sm-city-cebu', 'Neo Neo Grill House', 'Restaurant', '3rd Floor', '3F-072', 'green', 3, 5, 40),
  ('sm-city-cebu', 'Gerry''s Grill', 'Restaurant', '4th Floor', '4F-070', 'red', 4, 18, 40),
  ('sm-city-cebu', 'Samgyupsalamat', 'Restaurant', '4th Floor', '4F-071', 'yellow', 1, 6, 60),
  ('sm-seaside', 'Nuat Thai Foot and Body Massage', 'Spa and Massage', '3rd Floor', '3F-070', 'green', 2, 4, 60),
  ('sm-seaside', 'Hygea Wellness Spa', 'Spa and Massage', '3rd Floor', '3F-071', 'yellow', 1, 5, 60),
  ('sm-seaside', 'ExtraordiNeri', 'Spa and Massage', '3rd Floor', '3F-072', 'green', 4, 6, 60),
  ('sm-seaside', 'Nailaholics', 'Salon', '3rd Floor', '3F-073', 'green', 1, 3, 45),
  ('sm-seaside', 'Bangs Prime Salon', 'Salon', '2nd Floor', '2F-070', 'green', 4, 4, 45),
  ('sm-seaside', 'Lay Bare Waxing Salon', 'Salon', '2nd Floor', '2F-071', 'green', 1, 3, 45),
  ('sm-seaside', 'Hey Sugar Waxing Salon', 'Salon', '2nd Floor', '2F-072', 'green', 1, 1, 45),
  ('sm-seaside', 'iLash Extension', 'Salon', '2nd Floor', '2F-073', 'green', 4, 5, 45),
  ('sm-seaside', 'Beauty & Butter', 'Salon', '3rd Floor', '3F-074', 'green', 1, 1, 45),
  ('sm-seaside', 'Mich & Myl', 'Salon', '3rd Floor', '3F-075', 'green', 1, 1, 45),
  ('sm-seaside', 'Bruno''s Barbers', 'Barber Shop', 'Ground Floor', 'GF-070', 'green', 3, 4, 20),
  ('sm-seaside', 'Tong Yang', 'Restaurant', 'Ground Floor', 'GF-071', 'yellow', 1, 8, 45),
  ('sm-seaside', 'Yakimix', 'Restaurant', 'Ground Floor', 'GF-072', 'green', 4, 6, 60),
  ('sm-seaside', 'Seafood Paradise', 'Restaurant', '2nd Floor', '2F-074', 'green', 1, 2, 40),
  ('sm-seaside', 'Seafood & Ribs Warehouse', 'Restaurant', '3rd Floor', '3F-076', 'green', 4, 5, 45),
  ('sm-seaside', 'Cabalen', 'Restaurant', '4th Floor', '4F-070', 'red', 6, 20, 60),
  ('sm-seaside', 'Giligan''s Restaurant', 'Restaurant', '4th Floor', '4F-071', 'green', 4, 5, 40),
  ('sm-seaside', 'Mesa Filipino Moderne', 'Restaurant', '4th Floor', '4F-072', 'yellow', 1, 6, 40),
  ('sm-seaside', 'Kuya J Restaurant', 'Restaurant', '4th Floor', '4F-073', 'yellow', 3, 8, 40),
  ('sm-seaside', 'Max''s Restaurant', 'Restaurant', '4th Floor', '4F-074', 'yellow', 2, 9, 40),
  ('sm-seaside', 'Hukad', 'Restaurant', '4th Floor', '4F-075', 'green', 2, 2, 40),
  ('sm-seaside', 'Niu by Vikings', 'Restaurant', '4th Floor', '4F-076', 'green', 1, 1, 60),
  ('sm-seaside', 'Four Seasons Buffet and Hotpot', 'Restaurant', '4th Floor', '4F-077', 'green', 3, 5, 60),
  ('ayala-center-cebu', 'The Spa at Cebu', 'Spa and Massage', '1st Floor', '1F-070', 'green', 1, 1, 60),
  ('ayala-center-cebu', 'Blind Massage', 'Spa and Massage', '3rd Floor', '3F-070', 'green', 1, 1, 60),
  ('ayala-center-cebu', 'Oryspa', 'Spa and Massage', '3rd Floor', '3F-071', 'green', 3, 4, 60),
  ('ayala-center-cebu', 'Nailaholics', 'Salon', '2nd Floor', '2F-070', 'green', 1, 2, 45),
  ('ayala-center-cebu', 'David''s Salon', 'Salon', '2nd Floor', '2F-071', 'green', 4, 6, 45),
  ('ayala-center-cebu', 'Salon de Rose', 'Salon', '2nd Floor', '2F-072', 'green', 2, 2, 45),
  ('ayala-center-cebu', 'Bench Fix Salon', 'Salon', '2nd Floor', '2F-073', 'green', 2, 3, 45),
  ('ayala-center-cebu', 'Freshaire Salon', 'Salon', '2nd Floor', '2F-074', 'green', 3, 4, 45),
  ('ayala-center-cebu', 'Prisca by Hollywood Nails and Spa', 'Salon', '2nd Floor', '2F-075', 'green', 2, 3, 45),
  ('ayala-center-cebu', 'Lay Bare Waxing Salon', 'Salon', '2nd Floor', '2F-076', 'yellow', 1, 5, 45),
  ('ayala-center-cebu', 'Hey Sugar Waxing Salon', 'Salon', '2nd Floor', '2F-077', 'green', 1, 3, 45),
  ('ayala-center-cebu', 'No Strips Waxing Salon', 'Salon', '2nd Floor', '2F-078', 'green', 3, 4, 45),
  ('ayala-center-cebu', 'Bruno''s Barbers', 'Barber Shop', 'Ground Floor', 'GF-070', 'green', 3, 4, 20),
  ('ayala-center-cebu', 'TUF', 'Barber Shop', 'Ground Floor', 'GF-071', 'green', 3, 3, 20),
  ('ayala-center-cebu', 'Casa Verde', 'Restaurant', '3rd Floor', '3F-072', 'green', 3, 4, 40),
  ('ayala-center-cebu', 'Seoul Korean Grill + Cuisine', 'Restaurant', '4th Floor', '4F-070', 'yellow', 2, 9, 60),
  ('ayala-center-cebu', 'Shabu-Way Hotpot Cuisine', 'Restaurant', '4th Floor', '4F-071', 'yellow', 2, 9, 60),
  ('ayala-center-cebu', 'Tavolata', 'Restaurant', '4th Floor', '4F-072', 'yellow', 1, 6, 40),
  ('ayala-center-cebu', 'TGI Friday''s', 'Restaurant', '4th Floor', '4F-073', 'green', 1, 2, 40),
  ('ayala-center-cebu', 'The Social', 'Restaurant', '4th Floor', '4F-074', 'yellow', 2, 9, 40),
  ('ayala-center-cebu', 'Italianni''s', 'Restaurant', '4th Floor', '4F-075', 'yellow', 3, 10, 40),
  ('ayala-center-cebu', 'Max''s Restaurant', 'Restaurant', '4th Floor', '4F-076', 'green', 2, 3, 40),
  ('ayala-center-cebu', 'Yakimix', 'Restaurant', '4th Floor', '4F-077', 'red', 4, 16, 60),
  ('ayala-center-cebu', 'Hukad', 'Restaurant', '2nd Floor', '2F-079', 'green', 2, 4, 40),
  ('ayala-center-cebu', 'Kuya J Restaurant', 'Restaurant', '4th Floor', '4F-078', 'yellow', 3, 10, 40),
  ('ayala-center-cebu', 'Ming Fu Asian Cuisine', 'Restaurant', '4th Floor', '4F-079', 'green', 2, 4, 40),
  ('ayala-center-cebu', 'Zhao Chinese Restaurant', 'Restaurant', '4th Floor', '4F-080', 'yellow', 2, 8, 40),
  ('ayala-center-cebu', 'Seafood Island', 'Restaurant', '4th Floor', '4F-081', 'yellow', 3, 8, 40),
  ('ayala-center-cebu', 'The Lemon Grass', 'Restaurant', '4th Floor', '4F-082', 'green', 1, 2, 40),
  ('ayala-center-cebu', 'Cafe Laguna', 'Restaurant', '4th Floor', '4F-083', 'yellow', 2, 8, 40),
  ('ayala-center-cebu', 'Tonkatsu by Terazawa', 'Restaurant', '4th Floor', '4F-084', 'green', 2, 2, 35),
  ('ayala-center-cebu', 'KPub BBQ Meat All You Can', 'Restaurant', '4th Floor', '4F-085', 'yellow', 3, 9, 60),
  ('ayala-center-cebu', 'Cyma', 'Restaurant', 'Ground Floor', 'GF-072', 'green', 1, 4, 40),
  ('ayala-center-cebu', 'Siam Thai Cuisine', 'Restaurant', '4th Floor', '4F-086', 'green', 2, 3, 40),
  ('ayala-center-cebu', 'House of Lechon', 'Restaurant', '4th Floor', '4F-087', 'yellow', 3, 8, 40),
  ('central-bloc', 'Curves Beauty and Wellness Spa', 'Spa and Massage', '4th Floor', '4F-070', 'green', 1, 1, 60),
  ('central-bloc', 'Hygea Wellness Spa', 'Spa and Massage', '4th Floor', '4F-071', 'green', 1, 1, 60),
  ('central-bloc', 'Tree Shade Spa', 'Spa and Massage', '4th Floor', '4F-072', 'green', 3, 4, 60),
  ('central-bloc', 'Dia Therapeutic Massage', 'Spa and Massage', '4th Floor', '4F-073', 'green', 4, 4, 60),
  ('central-bloc', 'David''s Salon', 'Salon', 'Ground Floor', 'GF-070', 'green', 4, 5, 45),
  ('central-bloc', 'Salon de Rose', 'Salon', 'Ground Floor', 'GF-071', 'yellow', 2, 6, 45),
  ('central-bloc', 'Nailandia Nail Studio and Body Spa', 'Salon', 'Ground Floor', 'GF-072', 'green', 3, 4, 45),
  ('central-bloc', 'Gerry''s Grill', 'Restaurant', '3rd Floor', '3F-070', 'green', 3, 3, 40),
  ('central-bloc', 'Boy Zugba', 'Restaurant', 'Ground Floor', 'GF-073', 'red', 4, 16, 40),
  ('central-bloc', 'Ambiance', 'Restaurant', 'Ground Floor', 'GF-074', 'yellow', 2, 8, 40),
  ('central-bloc', 'Jubass', 'Restaurant', 'Ground Floor', 'GF-075', 'green', 3, 4, 40)
) AS v(slug, name, cat, fl, unit, vibe, serving, qn, ewt)
JOIN malls m ON m.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.mall_id = m.id
    AND (lower(s.name) = lower(v.name)
         OR (v.name ILIKE 'tuf%' AND s.name ILIKE 'tuf%'))   -- TUF / Tuf Barber Shop / TUF Barbershop = same brand
);

-- ── Creating a Staff Account ────────────────────────────────────────────────
-- After running this seed, create a staff user via Supabase Auth in the dashboard
-- (Authentication → Users → Add user), then link them to a store:
--
--   INSERT INTO staff (id, store_id, name)
--   VALUES (
--     '<auth-user-uuid>',
--     (SELECT id FROM stores WHERE name = 'Chili''s' AND mall_id = (SELECT id FROM malls WHERE slug = 'ayala-center-cebu') LIMIT 1),
--     'Store Manager'
--   );
