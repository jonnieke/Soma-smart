# Day 13 A/B Test Setup

Date: 2026-05-11

## Implemented Experiments

1. Learner first-run CTA copy variant (`A` vs `B`)
2. Teacher first-run workflow CTA copy variant (`A` vs `B`)

## Assignment Strategy

- Stable per-browser assignment using localStorage:
  - `soma_exp_learner_first_run_cta`
  - `soma_exp_teacher_first_run_cta`
- Utility:
  - [src/utils/abExperiments.ts](D:/software/soma%2017.1/somaai/Soma-smart/src/utils/abExperiments.ts)

## Tracking

- Learner CTA clicks now include `variant` on `library_intent_selected`.
- Teacher workflow CTA clicks emit `teacher_cta_clicked` with:
  - `variant`
  - `cta` (`generate_assessment` or `assign_to_stream`)

## Acceptance

- Variant A/B assignment in place: PASS
- Events segmented by variant: PASS
