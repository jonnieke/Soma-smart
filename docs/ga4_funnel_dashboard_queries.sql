-- SomaAI Production Funnel Dashboard Queries
-- Date: 2026-05-11
-- Replace `your_project.your_dataset` before use.

-- 1) Daily funnel by role
WITH base AS (
  SELECT
    PARSE_DATE('%Y%m%d', event_date) AS dt,
    user_pseudo_id,
    event_name,
    COALESCE(
      (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'role'),
      'UNKNOWN'
    ) AS role,
    (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'variant') AS variant
  FROM `your_project.your_dataset.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
                          AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name IN (
      'library_item_opened',
      'learner_quiz_started',
      'learner_quiz_completed',
      'paywall_shown',
      'pricing_opened',
      'pricing_plan_selected',
      'payment_started',
      'payment_initiated',
      'payment_iframe_opened',
      'payment_success',
      'payment_cancel',
      'library_intent_selected',
      'teacher_cta_clicked'
    )
)
SELECT
  dt,
  role,
  COUNT(DISTINCT IF(event_name = 'library_item_opened', user_pseudo_id, NULL)) AS learner_library_users,
  COUNT(DISTINCT IF(event_name = 'learner_quiz_started', user_pseudo_id, NULL)) AS learner_quiz_start_users,
  COUNT(DISTINCT IF(event_name = 'learner_quiz_completed', user_pseudo_id, NULL)) AS learner_quiz_complete_users,
  COUNT(DISTINCT IF(event_name = 'paywall_shown', user_pseudo_id, NULL)) AS paywall_users,
  COUNT(DISTINCT IF(event_name = 'pricing_opened', user_pseudo_id, NULL)) AS pricing_users,
  COUNT(DISTINCT IF(event_name = 'payment_started', user_pseudo_id, NULL)) AS payment_started_users,
  COUNT(DISTINCT IF(event_name = 'payment_initiated', user_pseudo_id, NULL)) AS payment_initiated_users,
  COUNT(DISTINCT IF(event_name = 'payment_iframe_opened', user_pseudo_id, NULL)) AS payment_iframe_users,
  COUNT(DISTINCT IF(event_name = 'payment_success', user_pseudo_id, NULL)) AS payment_success_users,
  COUNT(DISTINCT IF(event_name = 'payment_cancel', user_pseudo_id, NULL)) AS payment_cancel_users,
  SAFE_DIVIDE(
    COUNT(DISTINCT IF(event_name = 'learner_quiz_completed', user_pseudo_id, NULL)),
    COUNT(DISTINCT IF(event_name = 'library_item_opened', user_pseudo_id, NULL))
  ) AS learner_activation_rate,
  SAFE_DIVIDE(
    COUNT(DISTINCT IF(event_name = 'pricing_opened', user_pseudo_id, NULL)),
    COUNT(DISTINCT IF(event_name = 'paywall_shown', user_pseudo_id, NULL))
  ) AS paywall_to_pricing_rate,
  SAFE_DIVIDE(
    COUNT(DISTINCT IF(event_name = 'payment_success', user_pseudo_id, NULL)),
    COUNT(DISTINCT IF(event_name = 'paywall_shown', user_pseudo_id, NULL))
  ) AS paywall_to_success_rate
FROM base
GROUP BY dt, role
ORDER BY dt DESC, role;

-- 2) Variant performance (learner + teacher CTA experiments)
WITH base AS (
  SELECT
    PARSE_DATE('%Y%m%d', event_date) AS dt,
    user_pseudo_id,
    event_name,
    (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'variant') AS variant
  FROM `your_project.your_dataset.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
                          AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name IN ('library_intent_selected', 'teacher_cta_clicked')
)
SELECT
  dt,
  event_name,
  COALESCE(variant, 'UNKNOWN') AS variant,
  COUNT(DISTINCT user_pseudo_id) AS users
FROM base
GROUP BY dt, event_name, variant
ORDER BY dt DESC, event_name, variant;

-- 3) Anomaly check: missing sequence coverage by day
WITH daily AS (
  SELECT
    PARSE_DATE('%Y%m%d', event_date) AS dt,
    COUNTIF(event_name = 'paywall_shown') AS paywall_events,
    COUNTIF(event_name = 'pricing_opened') AS pricing_events,
    COUNTIF(event_name = 'payment_started') AS payment_started_events,
    COUNTIF(event_name = 'payment_initiated') AS payment_initiated_events,
    COUNTIF(event_name = 'payment_success') AS payment_success_events
  FROM `your_project.your_dataset.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
                          AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name IN (
      'paywall_shown',
      'pricing_opened',
      'payment_started',
      'payment_initiated',
      'payment_success'
    )
  GROUP BY dt
),
with_prev AS (
  SELECT
    d.*,
    LAG(paywall_events) OVER (ORDER BY dt) AS prev_paywall_events,
    LAG(pricing_events) OVER (ORDER BY dt) AS prev_pricing_events,
    LAG(payment_started_events) OVER (ORDER BY dt) AS prev_payment_started_events,
    LAG(payment_initiated_events) OVER (ORDER BY dt) AS prev_payment_initiated_events,
    LAG(payment_success_events) OVER (ORDER BY dt) AS prev_payment_success_events
  FROM daily d
)
SELECT
  dt,
  paywall_events,
  pricing_events,
  payment_started_events,
  payment_initiated_events,
  payment_success_events,
  CASE WHEN prev_paywall_events > 0 AND paywall_events < prev_paywall_events * 0.8 THEN 1 ELSE 0 END AS paywall_drop_gt_20pct,
  CASE WHEN prev_pricing_events > 0 AND pricing_events < prev_pricing_events * 0.8 THEN 1 ELSE 0 END AS pricing_drop_gt_20pct,
  CASE WHEN prev_payment_started_events > 0 AND payment_started_events < prev_payment_started_events * 0.8 THEN 1 ELSE 0 END AS payment_started_drop_gt_20pct,
  CASE WHEN prev_payment_initiated_events > 0 AND payment_initiated_events < prev_payment_initiated_events * 0.8 THEN 1 ELSE 0 END AS payment_initiated_drop_gt_20pct,
  CASE WHEN prev_payment_success_events > 0 AND payment_success_events < prev_payment_success_events * 0.8 THEN 1 ELSE 0 END AS payment_success_drop_gt_20pct
FROM with_prev
ORDER BY dt DESC;
