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
    -- Café
    (ayala_center_id, 'Starbucks',              'Café',              'Ground Floor', 'GF-001', 'green',  4,  9),
    -- Book Store
    (ayala_center_id, 'Fullybooked',            'Book Store',        '3rd Floor',    '3F-012', 'green',  1,  3),
    (ayala_center_id, 'National Book Store',    'Book Store',        '3rd Floor',    '3F-008', 'green',  2,  5),
    -- Clothing
    (ayala_center_id, 'Charles&Keith',          'Clothing',          '2nd Floor',    '2F-050', 'green',  2,  4),
    (ayala_center_id, 'Pull&Bear',              'Clothing',          '2nd Floor',    '2F-055', 'green',  3,  7),
    (ayala_center_id, 'Uniqlo',                 'Clothing',          '2nd Floor',    '2F-040', 'yellow', 5,  11),
    (ayala_center_id, 'Zara',                   'Clothing',          '2nd Floor',    '2F-045', 'yellow', 6,  13),
    -- Electronics
    (ayala_center_id, 'Apple Store',            'Electronics',       '2nd Floor',    '2F-012', 'yellow', 7,  14),
    -- Fast Food
    (ayala_center_id, 'Jollibee',               'Fast Food',         'Ground Floor', 'GF-020', 'red',    15, 30),
    -- Health and Beauty
    (ayala_center_id, 'Watsons',                'Health and Beauty', 'Ground Floor', 'GF-025', 'green',  3,  6),
    -- Photo Booth
    (ayala_center_id, 'Cheez',                  'Photo Booth',       '1st Floor',    '1F-040', 'green',  1,  2),
    -- Restaurant
    (ayala_center_id, 'Botejyu',                'Restaurant',        '4th Floor',    '4F-001', 'green',  3,  7),
    (ayala_center_id, 'Brique Modern Kitchen',  'Restaurant',        '4th Floor',    '4F-010', 'green',  2,  5),
    (ayala_center_id, 'Chili''s',               'Restaurant',        '4th Floor',    '4F-005', 'yellow', 4,  9),
    (ayala_center_id, 'Yakinabe',               'Restaurant',        '4th Floor',    '4F-015', 'green',  2,  6),
    -- Sports
    (ayala_center_id, 'Decathlon',              'Sports',            '3rd Floor',    '3F-040', 'yellow', 4,  10),
    (ayala_center_id, 'Nike',                   'Sports',            '2nd Floor',    '2F-035', 'yellow', 5,  11);

  -- ── Stores — Ayala Malls Central Bloc ─────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Café
    (central_bloc_id, 'Elim Central',           'Café',              'Ground Floor', 'GF-005', 'green',  2,  5),
    (central_bloc_id, 'Starbucks',              'Café',              'Ground Floor', 'GF-003', 'red',    10, 22),
    -- Barber Shop
    (central_bloc_id, 'Tuf Barber Shop',        'Barber Shop',       'Ground Floor', 'GF-010', 'green',  1,  3),
    -- Book Store
    (central_bloc_id, 'Fullybooked',            'Book Store',        '2nd Floor',    '2F-010', 'green',  1,  3),
    (central_bloc_id, 'National Book Store',    'Book Store',        '2nd Floor',    '2F-006', 'green',  1,  3),
    -- Electronics
    (central_bloc_id, 'Apple Store',            'Electronics',       '1st Floor',    '1F-010', 'red',    9,  18),
    (central_bloc_id, 'The Loop',               'Electronics',       '1st Floor',    '1F-015', 'green',  2,  4),
    -- Fast Food
    (central_bloc_id, 'Jollibee',               'Fast Food',         'Ground Floor', 'GF-015', 'yellow', 6,  13),
    -- Health and Beauty
    (central_bloc_id, 'Watsons',                'Health and Beauty', 'Ground Floor', 'GF-020', 'green',  2,  4),
    -- Photo Booth
    (central_bloc_id, 'Cheez',                  'Photo Booth',       '1st Floor',    '1F-030', 'green',  1,  2),
    -- Restaurant
    (central_bloc_id, 'Meattogether',           'Restaurant',        '3rd Floor',    '3F-001', 'yellow', 5,  11),
    (central_bloc_id, 'Myeongdong',             'Restaurant',        '3rd Floor',    '3F-010', 'green',  3,  7),
    (central_bloc_id, 'Wingers Unlimited',      'Restaurant',        '3rd Floor',    '3F-005', 'green',  2,  6),
    -- Salon
    (central_bloc_id, 'Nailaholics',            'Salon',             'Ground Floor', 'GF-015', 'green',  1,  3),
    -- Sports
    (central_bloc_id, 'Decathlon',              'Sports',            '2nd Floor',    '2F-040', 'yellow', 4,  9),
    (central_bloc_id, 'Nike',                   'Sports',            '1st Floor',    '1F-022', 'green',  3,  6);

  -- ── Stores — SM Seaside City Cebu ─────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Café
    (sm_seaside_id, 'Starbucks',              'Café',              '1st Floor',    '1F-005', 'yellow', 5,  12),
    -- Book Store
    (sm_seaside_id, 'Fullybooked',            'Book Store',        '3rd Floor',    '3F-012', 'green',  1,  2),
    (sm_seaside_id, 'National Book Store',    'Book Store',        '2nd Floor',    '2F-010', 'green',  1,  2),
    -- Clothing
    (sm_seaside_id, 'Charles&Keith',          'Clothing',          '2nd Floor',    '2F-050', 'green',  2,  4),
    (sm_seaside_id, 'CLN',                    'Clothing',          '2nd Floor',    '2F-055', 'green',  1,  3),
    (sm_seaside_id, 'Uniqlo',                 'Clothing',          '2nd Floor',    '2F-045', 'yellow', 5,  10),
    (sm_seaside_id, 'Zara',                   'Clothing',          '2nd Floor',    '2F-060', 'yellow', 4,  9),
    -- Electronics
    (sm_seaside_id, 'Apple Store',            'Electronics',       '3rd Floor',    '3F-018', 'green',  2,  4),
    -- Fast Food
    (sm_seaside_id, 'Jollibee',               'Fast Food',         'Ground Floor', 'GF-025', 'red',    18, 35),
    -- Restaurant
    (sm_seaside_id, 'Botejyu',                'Restaurant',        '4th Floor',    '4F-001', 'green',  3,  7),
    (sm_seaside_id, 'Chili''s',               'Restaurant',        '4th Floor',    '4F-005', 'yellow', 4,  9),
    (sm_seaside_id, 'Majestic',               'Restaurant',        '4th Floor',    '4F-015', 'green',  3,  7),
    (sm_seaside_id, 'Somac Korean Buffet',    'Restaurant',        '4th Floor',    '4F-010', 'yellow', 6,  14),
    -- Sports
    (sm_seaside_id, 'Nike',                   'Sports',            '2nd Floor',    '2F-040', 'yellow', 4,  9);

  -- ── Stores — SM City Cebu ─────────────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    -- Café
    (sm_city_id, 'Starbucks',                    'Café',              'Ground Floor', 'GF-002', 'green',  3,  7),
    -- Book Store
    (sm_city_id, 'Fullybooked',                  'Book Store',        '3rd Floor',    '3F-010', 'green',  1,  3),
    (sm_city_id, 'National Book Store',          'Book Store',        '3rd Floor',    '3F-004', 'green',  2,  4),
    -- Car Accessories
    (sm_city_id, 'Blade Auto Center',            'Car Accessories',   'Ground Floor', 'GF-030', 'green',  2,  5),
    -- Clothing
    (sm_city_id, 'CLN',                          'Clothing',          '2nd Floor',    '2F-045', 'green',  2,  4),
    (sm_city_id, 'Uniqlo',                       'Clothing',          '2nd Floor',    '2F-040', 'yellow', 5,  11),
    -- Electronics
    (sm_city_id, 'Apple Store',                  'Electronics',       '2nd Floor',    '2F-008', 'yellow', 6,  13),
    -- Fast Food
    (sm_city_id, 'Jollibee',                     'Fast Food',         'Ground Floor', 'GF-018', 'red',    20, 38),
    -- Photo Booth
    (sm_city_id, 'Haru Studio',                  'Photo Booth',       '2nd Floor',    '2F-060', 'green',  1,  2),
    -- Restaurant
    (sm_city_id, 'Chili''s',                     'Restaurant',        '4th Floor',    '4F-015', 'green',  2,  6),
    (sm_city_id, 'Din Tai Fung',                 'Restaurant',        '4th Floor',    '4F-001', 'green',  3,  8),
    (sm_city_id, 'Majestic',                     'Restaurant',        '3rd Floor',    '3F-025', 'green',  4,  9),
    (sm_city_id, 'Vikings',                      'Restaurant',        '3rd Floor',    '3F-020', 'red',    18, 35),
    (sm_city_id, 'Wolfgang''s Steakhouse Grill', 'Restaurant',        '4th Floor',    '4F-010', 'yellow', 5,  12),
    -- Sports
    (sm_city_id, 'Decathlon',                    'Sports',            '2nd Floor',    '2F-050', 'yellow', 6,  14),
    (sm_city_id, 'Nike',                         'Sports',            '1st Floor',    '1F-030', 'green',  1,  3);

END $$;

-- ── Creating a Staff Account ────────────────────────────────────────────────
-- After running this seed, create a staff user via Supabase Auth in the dashboard
-- (Authentication → Users → Add user), then link them to a store:
--
--   INSERT INTO staff (id, store_id, name)
--   VALUES (
--     '<auth-user-uuid>',
--     (SELECT id FROM stores WHERE name = 'Jollibee' AND mall_id = (SELECT id FROM malls WHERE slug = 'ayala-center-cebu') LIMIT 1),
--     'Store Manager'
--   );
