# SomaAI 14-Day Adoption Rollout

## Goal
Increase activation, trust, and paid conversion across three personas:
- Learners
- Teachers
- Parents

This plan is execution-first: each task has a concrete output and acceptance check.

## North Star Metrics
- Learner activation: `% of new learner sessions that complete Study -> Quiz -> Score`
- Teacher activation: `% of new teacher sessions that complete first teaching workflow (create + assign + track)`
- Parent confidence: `% of parents who view progress insights before pay prompt`
- Conversion: `% of guest users who hit paywall and reach pricing/payment flow`

## Guardrails
- No broken CTAs.
- No blocking 403/500 loops in core persona flows.
- No paywall dead-ends (all limit hits must offer a clear next action).

---

## Week 1 (Days 1-7): Clarify Value + Fix Conversion Paths

### Day 1: Instrumentation + Baseline
Deliverables:
- Event map for learner, teacher, parent first-session journey.
- Dashboard with baseline values for key metrics.

Tasks:
1. Confirm tracked events for:
   - library entry
   - study start
   - quiz start
   - quiz complete
   - paywall shown
   - pricing opened
   - payment started
2. Add missing events if needed.
3. Record baseline from last 7 days.

Acceptance:
- Product and engineering agree on one baseline sheet.

### Day 2: Learner Main Path Optimization
Deliverables:
- One clear default learner journey on first session.

Tasks:
1. Prioritize one hero path in learner home:
   - Open material
   - Ask Akili explanation
   - Generate quiz
   - Complete quiz
2. Reduce competing actions above the fold for new learners.
3. Keep shortcuts but visually de-emphasize non-core first actions.

Acceptance:
- First screen has one dominant primary CTA and one secondary CTA.

### Day 3: Learner Paywall Messaging Upgrade
Deliverables:
- Action-aware paywall copy with proof-based upsell.

Tasks:
1. Replace generic copy with contextual messages:
   - "You completed X. Unlock Y next."
2. Ensure all guest limit events route to pricing/payment path.
3. Add "What you unlock" bullets in modal.

Acceptance:
- 100% of limit triggers show actionable pricing path (no login trap unless explicitly selected).

### Day 4: Teacher Landing Narrative Reframe
Deliverables:
- Teacher-first messaging that emphasizes job leverage, not replacement.

Tasks:
1. Replace AI-teaches framing with:
   - Save prep time
   - Mark faster
   - Assign with confidence
2. Add "Minutes saved this week" and "Tasks automated" placeholders/cards.
3. Surface 3 teacher jobs-to-be-done in first viewport.

Acceptance:
- Teacher first screen communicates productivity benefit in under 5 seconds.

### Day 5: Teacher First-Run Workflow
Deliverables:
- Teacher onboarding sequence with first value action.

Tasks:
1. First-run checklist:
   - choose class
   - generate assessment
   - assign to stream
2. Remove duplicate/conflicting entry points.
3. Add one "Start here" action.

Acceptance:
- New teacher can complete first workflow in <= 3 minutes.

### Day 6: Parent Proof Layer
Deliverables:
- Parent insight summary shown before pay decision.

Tasks:
1. Add parent summary block:
   - current strengths
   - weak areas
   - next 7-day plan
2. Tie summary to actual learner events where available.
3. Add simple "Why subscribe now" with outcome framing.

Acceptance:
- Parent can see child performance signal without extra navigation.

### Day 7: Stability Sweep
Deliverables:
- Core journey reliability pass for all personas.

Tasks:
1. Remove/guard noisy optional API failures from core UI path.
2. Test all persona primary CTAs end-to-end.
3. Verify no broken route transitions.

Acceptance:
- Manual QA pass with zero P1/P2 issues on learner/teacher/parent first-run path.

---

## Week 2 (Days 8-14): Improve Trust, Speed, and Conversion

### Day 8: Learner Progress Reinforcement
Deliverables:
- Guest-visible progress breadcrumbs.

Tasks:
1. Show completed steps in first session:
   - studied topic
   - quiz attempted
   - score gained
2. Add "continue where you left off" card.

Acceptance:
- Returning guest sees prior progress state.

### Day 9: Teacher Professional Trust Layer
Deliverables:
- Reliability indicators for teacher workflows.

Tasks:
1. Add status indicators for:
   - content generated
   - assignment sent
   - submissions received
2. Improve failed-action messages with next-step guidance.

Acceptance:
- Teacher can diagnose failed workflow without support.

### Day 10: Parent Retention Hooks
Deliverables:
- Parent-friendly weekly narrative.

Tasks:
1. Add weekly progress summary language:
   - "This week your child improved in X."
2. Add recommended parent action list (15 min/day).

Acceptance:
- Parent page provides one actionable plan with no extra setup.

### Day 11: Pricing Clarity Pass
Deliverables:
- Persona-specific value statements on pricing view.

Tasks:
1. Learner plan: unlock frequency + exam prep outcomes.
2. Teacher plan: time savings + classroom coverage.
3. Parent plan: measurable learning confidence.

Acceptance:
- Pricing page communicates persona value without jargon.

### Day 12: Conversion Funnel QA
Deliverables:
- Full funnel validation report.

Tasks:
1. Validate:
   - paywall -> pricing
   - pricing -> payment
   - payment success -> resume pending action
2. Verify event telemetry for each step.

Acceptance:
- 95%+ successful funnel handoff in test runs.

### Day 13: A/B Test Setup
Deliverables:
- Two variants for learner and teacher first-run CTAs.

Tasks:
1. Variant A: current refined flow.
2. Variant B: stronger action framing copy.
3. Track activation and conversion deltas.

Acceptance:
- Experiment flags in place and events segmented by variant.

### Day 14: Review + Scale Decision
Deliverables:
- Go-forward decision document.

Tasks:
1. Compare baseline vs day-14 metrics.
2. Keep winners, rollback weak changes.
3. Define next 30-day roadmap with top 5 impact tasks.

Acceptance:
- Team signs off on next sprint priorities from measured outcomes.

---

## Ownership Model
- Product: messaging, flow order, paywall strategy
- Engineering: implementation, routing, telemetry, reliability
- Design: UI hierarchy, CTA prominence, trust cues
- QA: end-to-end persona journey validation

## Daily Ritual (15 min)
1. Review yesterday metric movement.
2. Confirm today shipping scope.
3. Identify one blocker and assign owner.

## Definition of Done
- Change is merged.
- Event tracking verified.
- Persona journey retested.
- Acceptance criteria checked in this document.
