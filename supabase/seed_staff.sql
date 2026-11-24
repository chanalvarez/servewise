-- ============================================================
-- ServeWise — LOCAL DEMO staff accounts (dummy passwords)
-- Loaded after seed.sql by `supabase start` / `supabase db reset`.
-- Inserts straight into auth.users so short passwords are allowed.
-- ============================================================

DO $$
DECLARE
  r RECORD;
  uid UUID;
BEGIN
  FOR r IN SELECT * FROM (VALUES
  ('ayala-center-cebu', 'Botejyu', 'botejyu.ayala@email.com', 'Botejyuayala123'),
  ('ayala-center-cebu', 'Chili''s', 'chilis.ayala@email.com', 'Chilisayala123'),
  ('ayala-center-cebu', 'Brique Modern Kitchen', 'bmk.ayala@email.com', 'Bmkayala123'),
  ('ayala-center-cebu', 'Yakinabe', 'yakinabe.ayala@email.com', 'Yakinabeayala123'),
  ('ayala-center-cebu', 'Cheez', 'cheez.ayala@email.com', 'Cheez.ayala123'),
  ('central-bloc', 'Meattogether', 'mt@email.com', 'Mt123'),
  ('central-bloc', 'Wingers Unlimited', 'wingers@email.com', 'Wingers123'),
  ('central-bloc', 'Myeongdong', 'md@email.com', 'Md123'),
  ('central-bloc', 'Tuf Barber Shop', 'tuf@email.com', 'Tuf123'),
  ('central-bloc', 'Nailaholics', 'nh@email.com', 'Nh123'),
  ('central-bloc', 'Cheez', 'cheez@email.com', 'Cheez123')
  ) AS t(mall_slug, store_name, email, pw)
  LOOP
    SELECT id INTO uid FROM auth.users WHERE email = r.email;

    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        r.email, crypt(r.pw, gen_salt('bf', 10)),
        now(), '{"provider":"email","providers":["email"]}', '{}',
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (
        id, user_id, provider_id, provider, identity_data,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), uid, uid::text, 'email',
        jsonb_build_object('sub', uid::text, 'email', r.email, 'email_verified', true),
        now(), now(), now()
      );
    END IF;

    INSERT INTO staff (id, store_id, name)
    SELECT uid, s.id, r.store_name || ' Staff'
    FROM stores s JOIN malls m ON m.id = s.mall_id
    WHERE m.slug = r.mall_slug AND s.name = r.store_name
    LIMIT 1
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Demo mode: 1-minute no-show countdown (default is 5).
-- Restore with: update public.app_settings set no_show_minutes = 5;
UPDATE public.app_settings SET no_show_minutes = 1;
