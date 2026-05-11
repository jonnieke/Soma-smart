# Day 14 Review + Scale Decision

Date: 2026-05-11  
Owner: Product + Engineering

## Executive Decision

Proceed to **scale** the shipped onboarding/conversion changes with controlled monitoring.  
No rollback recommended from Days 1-13 based on implementation QA and build stability.

## What We Shipped (Summary)

- Day 1: Funnel instrumentation baseline for learner/teacher/parent.
- Day 2-3: Learner first-run focus + contextual paywall messaging.
- Day 4-5: Teacher productivity narrative + first-run workflow checklist.
- Day 6: Parent proof layer before pay prompts.
- Day 7: Stability guards on noisy/optional failures.
- Day 8: Guest progress breadcrumbs + resume card.
- Day 9: Teacher reliability indicators + actionable error guidance.
- Day 10: Parent weekly narrative + action plan.
- Day 11: Persona-specific pricing clarity.
- Day 12: Conversion funnel QA and payment handoff telemetry normalization.
- Day 13: A/B variants for learner and teacher first-run CTA flows.

## Baseline vs Day-14 Measurement Status

- **Code and telemetry readiness:** Complete.
- **Flow QA readiness:** Complete.
- **Production outcome delta:** Pending live GA4/BigQuery pull over a full comparison window.

Because the code rollout completed on 2026-05-11, final uplift conclusions require post-release data collection windows (7/14 days).

## Keep / Rollback Decisions

### Keep Now

1. Learner “Start Here” guided path.
2. Learner contextual paywall copy and unlock bullets.
3. Teacher first workflow checklist + reliability strip.
4. Parent proof layer + weekly narrative block.
5. Pricing persona value sections.
6. Shared payment funnel telemetry normalization (`payment_started` + existing sequence).
7. A/B variant assignment and event tagging.

### Rollback Conditions (Only if observed in production)

1. If CTA variant B underperforms variant A by >10% on activation for 7 days, pause B.
2. If paywall-to-pricing CTR drops materially after copy changes, restore previous copy block.
3. If any funnel event volume drops unexpectedly (>20% day-over-day without traffic explanation), revert latest telemetry-touching patch and investigate.

## Top 5 Priorities (Next 30 Days)

1. **Production Funnel Dashboard Finalization**
   - Publish daily dashboard: activation + conversion by role + variant.
   - Add automated anomaly flags for missing event sequences.

2. **Learner Activation Completion Push**
   - Add in-flow nudge from “Ask Akili” to immediate quiz start.
   - Target: improve `library_item_opened -> learner_quiz_completed`.

3. **Teacher Workflow Completion Rate**
   - Add explicit “step complete” confirmations after generate and publish actions.
   - Target: first-run workflow completion in <= 3 minutes for new teachers.

4. **Parent Conversion Confidence Layer**
   - Add trend snapshots (week-over-week signals) in parent insights.
   - Target: increase pricing entry from parent surface.

5. **Reliability Hardening Sprint**
   - Remove remaining non-critical 403/500 noise from teacher/learner first-run UX.
   - Target: zero repeated console/API loops on core routes.

## Success Metrics for Next Review (30-Day Checkpoint)

- Learner activation rate: `quiz_completed_users / library_open_users`
- Paywall to pricing rate
- Pricing to payment start rate
- Payment success rate from paywall cohort
- Teacher first workflow completion rate
- Parent pricing entry rate from proof surfaces

## Final Recommendation

Ship current set to broader traffic, monitor daily, and make variant and copy decisions using 7-day and 14-day windows.  
The product is now instrumented and structured well enough to optimize with evidence instead of intuition.
