# Day 15 Production Funnel Dashboard Setup

Date: 2026-05-11

## What Was Added

- Ready-to-run GA4 BigQuery query pack:
  - [ga4_funnel_dashboard_queries.sql](D:/software/soma%2017.1/somaai/Soma-smart/docs/ga4_funnel_dashboard_queries.sql)

## Dashboard Sections

1. Daily funnel by role
   - Learner activation
   - Paywall -> pricing
   - Paywall -> payment success

2. Variant performance
   - Learner CTA A/B (`library_intent_selected`)
   - Teacher CTA A/B (`teacher_cta_clicked`)

3. Anomaly checks
   - Detects >20% day-over-day drops on critical funnel events:
     - `paywall_shown`
     - `pricing_opened`
     - `payment_started`
     - `payment_initiated`
     - `payment_success`

## Ops Checklist (Daily)

1. Run query #1 and update the daily KPI sheet.
2. Run query #2 and compare A vs B user movement.
3. Run query #3 and triage any drop flags immediately.
4. If any critical event drops >20% without traffic explanation, trigger incident review.

## Notes

- This completes Priority #1 from the Day 14 scale plan at the implementation-doc level.
- Next implementation step is wiring these queries into a scheduled BI report (Looker Studio/Metabase).
