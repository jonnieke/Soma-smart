-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
);
-- Enable RLS (Optional but good practice)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- Allow read access to everyone
CREATE POLICY "Enable read access for all users" ON system_settings FOR
SELECT USING (true);
-- Insert or Update the promo end date to Feb 27, 2026 (or 2025 depending on user intent, assuming current year/next)
-- User said "27th feb", assuming 2026 given current logs say 2026-01-30.
INSERT INTO system_settings (key, value, description)
VALUES (
        'promo_end_date',
        '2026-02-27T23:59:59Z',
        'Free access promo until Feb 27'
    ) ON CONFLICT (key) DO
UPDATE
SET value = EXCLUDED.value;