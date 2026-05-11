# Day 1 Funnel Baseline Spec

## Purpose
Define one shared funnel baseline for Learners, Teachers, and Parents so product and engineering read the same numbers.

## Event Map (Current)

### Learner
- `library_item_opened`
- `learner_quiz_started`
- `learner_quiz_completed`
- `paywall_shown` (source: `learner_usage_limit`)
- `pricing_opened` (source: `learner_dashboard`)
- `pricing_plan_selected` (source: `learner_pricing`)
- `payment_initiated` (from `PaymentFlow`)
- `payment_iframe_opened` (from `PaymentFlow`)
- `payment_success` (source: `learner_payment`)
- `payment_cancel` (source: `learner_payment`)

### Teacher
- `paywall_shown` (source: `teacher_usage_limit` or `teacher_route_state`)
- `pricing_opened` (source: `teacher_profile_upgrade_cta`)
- `payment_started` (source: `teacher_direct_payment` or `teacher_overlay_payment`)
- `payment_initiated` (from `PaymentFlow`)
- `payment_iframe_opened` (from `PaymentFlow`)
- `payment_success` (teacher payment sources)
- `payment_cancel` (teacher payment sources)

### Parent
- `pricing_opened` (source: `parent_dashboard_header`)

## Funnel Definitions (7-Day Baseline)

### Learner Activation Funnel
1. `library_item_opened`
2. `learner_quiz_started`
3. `learner_quiz_completed`

KPI: `quiz_completed_users / library_open_users`

### Conversion Funnel (All Roles)
1. `paywall_shown`
2. `pricing_opened`
3. `payment_initiated`
4. `payment_success`

KPI: `payment_success_users / paywall_users`

## GA4 BigQuery Query Template

Use this query against GA4 export (`events_*`) and replace `your_project.your_dataset`.

```sql
WITH base AS (
  SELECT
    PARSE_DATE('%Y%m%d', event_date) AS dt,
    user_pseudo_id,
    event_name,
    (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'role') AS role,
    (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'source') AS source
  FROM `your_project.your_dataset.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
                          AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name IN (
      'library_item_opened',
      'learner_quiz_started',
      'learner_quiz_completed',
      'paywall_shown',
      'pricing_opened',
      'payment_initiated',
      'payment_success'
    )
),
funnel_users AS (
  SELECT
    COUNT(DISTINCT IF(event_name = 'library_item_opened', user_pseudo_id, NULL)) AS learner_library_users,
    COUNT(DISTINCT IF(event_name = 'learner_quiz_started', user_pseudo_id, NULL)) AS learner_quiz_start_users,
    COUNT(DISTINCT IF(event_name = 'learner_quiz_completed', user_pseudo_id, NULL)) AS learner_quiz_complete_users,
    COUNT(DISTINCT IF(event_name = 'paywall_shown', user_pseudo_id, NULL)) AS paywall_users,
    COUNT(DISTINCT IF(event_name = 'pricing_opened', user_pseudo_id, NULL)) AS pricing_users,
    COUNT(DISTINCT IF(event_name = 'payment_initiated', user_pseudo_id, NULL)) AS payment_initiated_users,
    COUNT(DISTINCT IF(event_name = 'payment_success', user_pseudo_id, NULL)) AS payment_success_users
  FROM base
)
SELECT
  *,
  SAFE_DIVIDE(learner_quiz_complete_users, learner_library_users) AS learner_activation_rate,
  SAFE_DIVIDE(pricing_users, paywall_users) AS paywall_to_pricing_rate,
  SAFE_DIVIDE(payment_initiated_users, pricing_users) AS pricing_to_payment_start_rate,
  SAFE_DIVIDE(payment_success_users, paywall_users) AS paywall_to_success_rate
FROM funnel_users;
```

## Baseline Reporting Format (Daily)

Record these numbers in one shared sheet every day:
- Date
- Learner library users
- Learner quiz start users
- Learner quiz complete users
- Learner activation rate
- Paywall users
- Pricing users
- Payment initiated users
- Payment success users
- Paywall to success rate

## Acceptance for Day 1
- Event map confirmed against code.
- Query runs and returns 7-day values.
- One shared baseline sheet is published.
