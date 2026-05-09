# Somo Smart Adoption Execution Plan

## Objective
Increase early adoption and repeat usage by sequencing work around three core loops:

1. Learner instant-help loop
2. Teacher output loop
3. Library value loop

This plan is intentionally narrow. Features outside these loops should be deprioritized until these metrics improve.

## Phase 1: Learner Loop (Priority 1)
Target flow: `ask/snap -> clear answer -> immediate practice -> return next day`

### Current blockers
- Free/paywall transitions feel inconsistent.
- Too many parallel learner surfaces create choice overload.
- Trust signals in answers are not explicit enough.

### Delivery sequence
1. Unify entry and paywall path:
   - Keep hero answer journey in one clear path.
   - Ensure guest users see one onboarding/paywall step, not multiple conflicting ones.
2. Add answer trust metadata:
   - Show level (e.g. KCSE/CBC), subject, and answer type.
   - Add a visible "verify with class material/teacher" safety line for uncertain outputs.
3. Tighten next action:
   - One primary CTA after every answer: `Practice 5 Questions`.
   - Keep secondary actions as optional.
4. Instrument core events:
   - `learner_answer_generated`
   - `learner_answer_cta_clicked`
   - `learner_quiz_started`
   - `learner_quiz_completed`
   - `learner_day1_returned`

### Acceptance criteria
- A guest can go from landing question to one clear next step in under 20 seconds.
- No duplicate or conflicting paywall messages in the same journey.
- At least one measurable post-answer action exists on every successful answer.

## Phase 2: Teacher Loop (Priority 2)
Target flow: `upload/record -> useful teaching artifact -> save/share/use`

### Current blockers
- Some teacher outputs and monetization paths still read as prototype behavior.
- Value moment is delayed by setup and profile steps.

### Delivery sequence
1. Single "fast artifact" path:
   - Default first-run action is one upload/record flow.
   - Return one immediately usable output (plan/notes/marking result).
2. Remove simulated payment/success states from teacher-critical paths.
3. Add artifact quality checks:
   - Curriculum scope tag.
   - Readability/structure check.
4. Instrument teacher loop:
   - `teacher_artifact_started`
   - `teacher_artifact_generated`
   - `teacher_artifact_saved`
   - `teacher_artifact_shared`

### Acceptance criteria
- First-time teacher reaches one usable artifact in one session.
- No demo-only success states in teacher monetized/operational flows.

## Phase 3: Library Loop (Priority 3)
Target flow: `find trusted resource quickly -> use instantly -> trigger learning action`

### Current blockers
- Library discoverability and value differentiation are not strong enough.
- Resource trust and freshness are not consistently visible.

### Delivery sequence
1. Outcome-first library landing:
   - Show intent cards before raw file browsing:
     - `Revise a topic`
     - `Past paper + marking`
     - `Quick notes`
     - `Teacher picks`
2. Add trust metadata to every resource item:
   - Syllabus/grade alignment
   - Source type
   - Last reviewed date
   - Quality badge
3. Connect resources to actions:
   - `Explain this`
   - `Generate quiz`
   - `Start timed practice`
4. Subscription clarity:
   - Free users: preview + limited opens.
   - Subscribers: full access + download + action tools.
5. Instrument library loop:
   - `library_item_opened`
   - `library_action_explain`
   - `library_action_quiz`
   - `library_action_timed_practice`
   - `library_downloaded`

### Acceptance criteria
- Users can find and open a relevant resource in under 3 interactions.
- Every opened resource presents at least one immediate learning action.

## Guardrails During Execution
- Hide/defer non-core surfaces from main navigation if they distract first-session users.
- Remove or gate all mock/prototype behavior from production paths.
- Keep analytics event naming stable once released.
- Ship each phase with before/after metrics review.
