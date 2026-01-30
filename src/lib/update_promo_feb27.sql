-- 1. Set Promo End Date to Feb 27th, 2026
INSERT INTO system_settings (key, value)
VALUES ('promo_end_date', '2026-02-27T00:00:00Z') ON CONFLICT (key) DO
UPDATE
SET value = EXCLUDED.value;
-- 2. Verify Config
SELECT *
FROM system_settings
WHERE key = 'promo_end_date';