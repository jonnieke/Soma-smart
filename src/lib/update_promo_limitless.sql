-- 1. Extend Promo to 2030 (Removing Limits)
INSERT INTO system_settings (key, value)
VALUES ('promo_end_date', '2030-12-31T23:59:59Z') ON CONFLICT (key) DO
UPDATE
SET value = EXCLUDED.value;
-- 2. Verify Config
SELECT *
FROM system_settings
WHERE key = 'promo_end_date';