# Release Readiness Playbook (Day 12–Day 22)

Date: 2026-05-11  
Scope: Conversion funnel hardening, activation lifts, teacher/parent workflow reliability, and production console noise control.

## 1) Pre-Deploy Checklist

- [ ] `npm run build` passes on main release branch.
- [ ] Pricing/payment flow still opens and closes cleanly on learner, teacher, and parent routes.
- [ ] No critical runtime errors in browser console on:
  - learner main flow
  - teacher dashboard + classroom stream
  - parent dashboard
- [ ] Required env vars are present for payment + analytics.

## 2) Features Included In This Release

### Day 12
- Conversion funnel QA and event normalization.
- [day12_conversion_funnel_qa.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day12_conversion_funnel_qa.md)

### Day 13
- A/B setup for learner + teacher first-run CTA variants.
- [day13_ab_test_setup.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day13_ab_test_setup.md)

### Day 14
- Go-forward decision and next 30-day priorities.
- [day14_review_and_scale_decision.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day14_review_and_scale_decision.md)

### Day 15
- GA4 BigQuery query pack + production dashboard setup.
- [ga4_funnel_dashboard_queries.sql](D:/software/soma%2017.1/somaai/Soma-smart/docs/ga4_funnel_dashboard_queries.sql)
- [day15_production_funnel_dashboard_setup.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day15_production_funnel_dashboard_setup.md)

### Day 16
- Learner in-flow quiz nudge after explanation.
- [day16_learner_quiz_nudge.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day16_learner_quiz_nudge.md)

### Day 17
- Teacher workflow completion confirmations (generate + publish).
- [day17_teacher_workflow_completion_signals.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day17_teacher_workflow_completion_signals.md)

### Day 18
- Parent week-over-week progress snapshot.
- [day18_parent_weekly_trend_snapshot.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day18_parent_weekly_trend_snapshot.md)

### Day 19
- Reliability hardening for `teacher_wallets` and `classes` failure loops.
- [day19_reliability_hardening_wallets_classes.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day19_reliability_hardening_wallets_classes.md)

### Day 20
- Circuit breakers for repeated history fetch failures.
- [day20_reliability_hardening_history_fetches.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day20_reliability_hardening_history_fetches.md)

### Day 21
- Production quiet-console pass (`warnIfDev`) for non-critical warnings.
- [day21_production_quiet_console_pass.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day21_production_quiet_console_pass.md)

### Day 22
- Non-critical error noise reduction in fallback/sync paths.
- [day22_noncritical_error_noise_reduction.md](D:/software/soma%2017.1/somaai/Soma-smart/docs/day22_noncritical_error_noise_reduction.md)

## 3) Critical User Journeys To QA

### Learner
- [ ] Guest reaches usage limit and sees contextual paywall.
- [ ] Paywall -> pricing -> plan select -> payment open works.
- [ ] Cancel returns user to expected screen.
- [ ] Success resumes intended pending action.
- [ ] Explanation flow shows quiz nudge and starts quiz.

### Teacher
- [ ] First workflow section visible on dashboard.
- [ ] Generate assessment shows step completion signal.
- [ ] Publish to stream shows step completion signal.
- [ ] Classroom stream “Post & Share to WhatsApp” works with valid class/subject.
- [ ] On backend class failures, local fallback works without repeated failure spam.

### Parent
- [ ] Parent can authenticate and view proof layer.
- [ ] Weekly summary + week-over-week trend snapshot render correctly.
- [ ] Pricing CTA from parent surfaces works.

## 4) Telemetry Validation

- [ ] Event sequence present:
  - `paywall_shown`
  - `pricing_opened`
  - `pricing_plan_selected`
  - `payment_started`
  - `payment_initiated`
  - `payment_iframe_opened`
  - `payment_success` / `payment_cancel`
- [ ] Learner CTA variant event includes `variant`.
- [ ] Teacher CTA variant event includes `variant`.
- [ ] Teacher workflow completion event fires:
  - `teacher_workflow_step_completed` (`GENERATE_ASSESSMENT`, `PUBLISH_STREAM`)

## 5) Reliability / Noise Acceptance

- [ ] `teacher_wallets` 403 does not repeatedly flood runtime logs after first detection.
- [ ] `classes` 500 does not repeatedly hammer lookup calls (cooldown fallback active).
- [ ] History-fetch failures degrade once per session and stop retry noise.
- [ ] Production logs avoid non-critical warn/error spam from expected fallback paths.

## 6) Rollback Triggers

Rollback or hotfix if any of the following occurs after release:

- [ ] Payment funnel handoff drops sharply without traffic cause.
- [ ] Teacher classroom publishing becomes blocked for valid class/subject selections.
- [ ] Parent dashboard fails to load core proof/trend cards.
- [ ] New client errors block main learner route.

## 7) Post-Deploy (24–72h)

- [ ] Run daily funnel query set and compare to pre-release baseline.
- [ ] Check A/B movement for learner and teacher CTA variants.
- [ ] Review support/issues for classroom stream + payment complaints.
- [ ] Confirm no new repeated console/network noise patterns in monitored sessions.

## 8) Sign-Off

- Product: [ ]
- Engineering: [ ]
- QA: [ ]
- Date: [ ]
