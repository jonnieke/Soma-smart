-- 1. Create a table for global system settings (if not exists)
CREATE TABLE IF NOT EXISTS system_settings (
    key text primary key,
    value text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 2. Enable Row Level Security (RLS) on settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- 3. Policy for public read access
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'system_settings'
        AND policyname = 'Allow public read access'
) THEN CREATE POLICY "Allow public read access" ON system_settings FOR
SELECT USING (true);
END IF;
END $$;
-- 4. Insert the promo end date (if not exists)
INSERT INTO system_settings (key, value, description)
VALUES (
        'promo_end_date',
        '2026-02-27T12:00:00Z',
        'End date for the 30-day free access promo'
    ) ON CONFLICT (key) DO NOTHING;
-- 5. CRITICAL FIX: Add recovery_pin to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS recovery_pin text;
-- 6. Ensure RLS on profiles allows update of own pin
-- (Assuming existing policies cover basic update of own profile, this column will inherit that)