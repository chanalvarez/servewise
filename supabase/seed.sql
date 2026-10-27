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
