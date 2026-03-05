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
    (ayala_center_id, 'Starbucks',            'Café',        'Ground Floor', 'GF-001', 'green',  4,  9),
    (ayala_center_id, 'Apple Store',           'Electronics', '2nd Floor',    '2F-012', 'yellow', 7,  14),
    (ayala_center_id, 'National Book Store',  'Book Store',  '3rd Floor',    '3F-008', 'green',  2,  5),
    (ayala_center_id, 'Jollibee',             'Fast Food',   'Ground Floor', 'GF-020', 'red',    15, 30),
    (ayala_center_id, 'Nike',                 'Sports',      '2nd Floor',    '2F-035', 'yellow', 5,  11);

  -- ── Stores — Ayala Malls Central Bloc ─────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    (central_bloc_id, 'Starbucks',           'Café',        'Ground Floor', 'GF-003', 'red',    10, 22),
    (central_bloc_id, 'Apple Store',         'Electronics', '1st Floor',    '1F-010', 'red',    9,  18),
    (central_bloc_id, 'National Book Store', 'Book Store',  '2nd Floor',    '2F-006', 'green',  1,  3),
    (central_bloc_id, 'Jollibee',            'Fast Food',   'Ground Floor', 'GF-015', 'yellow', 6,  13),
    (central_bloc_id, 'Nike',                'Sports',      '1st Floor',    '1F-022', 'green',  3,  6);

  -- ── Stores — SM Seaside City Cebu ─────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    (sm_seaside_id, 'Starbucks',           'Café',        '1st Floor',   '1F-005', 'yellow', 5,  12),
    (sm_seaside_id, 'Apple Store',         'Electronics', '3rd Floor',   '3F-018', 'green',  2,  4),
    (sm_seaside_id, 'National Book Store', 'Book Store',  '2nd Floor',   '2F-010', 'green',  1,  2),
    (sm_seaside_id, 'Jollibee',            'Fast Food',   'Ground Floor','GF-025', 'red',    18, 35),
    (sm_seaside_id, 'Nike',                'Sports',      '2nd Floor',   '2F-040', 'yellow', 4,  9);

  -- ── Stores — SM City Cebu ─────────────────────────────────────────────────

  INSERT INTO stores (mall_id, name, category, floor, unit_number, vibe_status, current_serving, last_queue_number)
  VALUES
    (sm_city_id, 'Starbucks',           'Café',        'Ground Floor', 'GF-002', 'green',  3,  7),
    (sm_city_id, 'Apple Store',         'Electronics', '2nd Floor',    '2F-008', 'yellow', 6,  13),
    (sm_city_id, 'National Book Store',        'Book Store',     '3rd Floor',    '3F-004', 'green',  2,  4),
    (sm_city_id, 'Jollibee',                  'Fast Food',      'Ground Floor', 'GF-018', 'red',    20, 38),
    (sm_city_id, 'Nike',                      'Sports',         '1st Floor',    '1F-030', 'green',  1,  3),
    (sm_city_id, 'Din Tai Fung',              'Restaurant',     '4th Floor',    '4F-001', 'green',  3,  8),
    (sm_city_id, 'Wolfgang''s Steakhouse Grill', 'Restaurant',  '4th Floor',    '4F-010', 'yellow', 5,  12),
    (sm_city_id, 'Chili''s',                  'Restaurant',     '4th Floor',    '4F-015', 'green',  2,  6),
    (sm_city_id, 'Vikings',                   'Restaurant',     '3rd Floor',    '3F-020', 'red',    18, 35),
    (sm_city_id, 'Majestic',                  'Restaurant',     '3rd Floor',    '3F-025', 'green',  4,  9),
    (sm_city_id, 'Decathlon',                 'Sports Shop',    '2nd Floor',    '2F-050', 'yellow', 6,  14),
    (sm_city_id, 'Blade Auto Center',         'Car Accessories','Ground Floor', 'GF-030', 'green',  2,  5),
    (sm_city_id, 'Fullybooked',               'Book Store',     '3rd Floor',    '3F-010', 'green',  1,  3),
    (sm_city_id, 'Haru Studio',               'Photo Booth',    '2nd Floor',    '2F-060', 'green',  1,  2);

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
