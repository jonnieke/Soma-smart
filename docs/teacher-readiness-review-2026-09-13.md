# Teacher experience readiness review

Date: 13 September 2026. Reviewed checkout: `21e2773`, branch `codex/akili-learner-release`.

## Verdict

**Not ready for an unsupervised, whole-platform teacher pilot.** A moderated discovery session is useful now, but assignment, exam creation/export, mobile editing, and work recovery need repair before teachers depend on them. There is genuine value in the product; the main problem is that starting tasks is easier than completing them reliably.

The product should promise: **Prepare tomorrow's lesson, adapt it to your class, and leave with material you can actually teach from.** Saving teacher time is the first measure of success—not the number of AI tools available.

## What was actually tested

- Read-only browser checks across 12 live guest routes. Non-read requests were blocked in this pass; this was not a live transaction or authenticated backend test.
- Isolated local teacher sessions at desktop and 390px mobile width, ten tool-entry journeys, navigation, paper assembly, export, homework assignment, and empty-class marking. Backend responses were mocked and all writes stayed in the fixture. These results establish frontend behavior, not production database correctness.
- Code review of navigation, content handoffs, persistence, assignments, marking, reports, limits, and creator flows.
- Automated suite: **39 test files, 257 tests passed**, using dummy Supabase environment values. Initial missing-environment failures were resolved for the test run. Passing this suite did not prevent the workflow failures below.
- Evidence: [browser observations](../artifacts/teacher-review-2026-09-13/observations.json), [journey observations](../artifacts/teacher-review-2026-09-13/journey-observations.json), and [repeatable audit script](../scripts/teacher-readiness-review.mjs).

Not verified: real teacher login/session recovery, production cross-device saving, successful fresh AI generation and curriculum accuracy across subjects, real phone camera/microphone quality, learner receipt, actual payment/payout, or printed-document quality. Those require dedicated accounts/devices and an authorized test environment. No real learner data, purchases, or messages were created. This is an extensive review, **not a claim that every feature has passed end to end**.

## Blocking findings

### 1. Homework reports success without assigning work

**Reproduced in the isolated browser and confirmed in code.** Open a saved homework draft and select Assign. The message says it was assigned to all students and directs the teacher to track submissions. The only recorded write deletes the workflow draft; no assignment is created.

Source: `src/features/teacher/HomeworkCreator.tsx:114`. Impact: a teacher believes children have received work, while the draft is cleared.

Acceptance: create a real assignment containing the questions, class, deadline, and teacher identity; verify learner receipt before showing success. Retain the draft on failure and prevent duplicate submissions.

### 2. Exam assembly produces incomplete papers with misleading totals

**Reproduced in the isolated browser:** the default request was nine questions and 30 marks; the paper contained two questions worth seven marks while declaring 30 marks. This fixture uses the available seeded bank, not a claim about all production bank contents. It proves shortages are not handled safely.

The wizard drops the selection report, keeps requested totals, and does not use the selected AI Hybrid / Soma Bank / My Bank option in assembly. It deducts local credits despite not calling AI generation on this path. The displayed difficulty/cognition match percentages are fixed values.

Source: `src/features/teacher/paperStudio/CreatePaperWizard.tsx:89,161,180`; `src/services/assessmentEngine/questionSelectionEngine.ts`.

Acceptance: fulfill the blueprint or explain the precise shortage; calculate totals from actual questions; honor source/topic settings; never label an incomplete paper complete or charge for a generation that did not happen.

### 3. Paper storage and ownership are not dependable enough

**Code finding:** papers use a shared browser-local list, hardcoded owner IDs such as `teacher_user`, and a seeded sample on an empty list. The service does not enforce owner filtering when reading papers. Cloud upsert is issued with `void` rather than awaited/consumed; successful durable saving is not established, and there is no matching cloud list retrieval in this service.

Source: `src/services/paperStudioService.ts:166,178,261`; `CreatePaperWizard.tsx:130,169`.

This creates account-isolation and recovery risks; an actual two-account production leakage test was not performed. Do not claim cloud saving until confirmed. Label sample papers as examples instead of presenting another school/teacher's seeded draft as the user's work.

Acceptance: authenticated ownership on server and client; await save confirmation; reopen after refresh, logout/login, and on a second device; demonstrate that another account cannot see or modify the paper.

### 4. Mobile paper editor is effectively unusable

**Visually confirmed.** Desktop-width side panels squeeze the editable paper into a sliver on a 390px screen. A basic document-overflow check misleadingly passes because the content is clipped. In the wizard, the floating support control intercepts a Next button click.

Evidence: [mobile editor](../artifacts/teacher-review-2026-09-13/paper-editor-mobile.png), [blocked Next](../artifacts/teacher-review-2026-09-13/wizard-next-obstruction.png). Source: `ExaminationEditor.tsx`, fixed-width side panels and overflow-hidden layout.

Acceptance: a single readable editing surface on phones, section/settings drawers, reachable sticky actions, and support controls outside the action area. Verify real taps, not just viewport dimensions.

### 5. DOCX export is a placeholder

**Reproduced:** Export DOCX shows “Exporting editable DOCX document...” but downloads nothing. Source: `src/features/teacher/paperStudio/PrintablePaperView.tsx:17`.

Acceptance: deliver an editable file and open it successfully, or remove/clearly mark the unavailable action. Printing uses a real print call, but page layout and marking-guide separation still need print verification.

### 6. AI marking saves before teacher review

**Code finding:** the grading flow persists the result and learner mastery immediately after AI grading; Save & Close only changes the view. A teacher must be able to correct AI marks before publishing them.

Source: `src/features/teacher/MarkingManager.tsx`, `runAutoGrader` and Save & Close. Separately, the empty-roster state prevents a new teacher trying marking; the browser correctly explains that a learner must first join.

Acceptance: draft → teacher review/edit → explicit save/publish. Offer an anonymous sample trial without requiring real learner enrollment. Test with handwritten work and an agreed marking guide before evaluating accuracy.

## Journey and usability findings

### Discover → try → sign in

The public sample is a useful low-friction concept, but the tool-entry and authenticated versions are inconsistent. A public tool selection can first render another similar landing state instead of opening the requested tool. Verify one-click intent retention through registration, reload, and expired sessions.

The rich typed-prompt notes workspace is attached to the landing-page draft journey, while the ordinary dashboard Notes tool emphasizes upload/voice. Teachers entering through different doors do not receive the same capability. The conventional quiz route also requires source files, unlike the richer topic-based handoff.

### Move between tools without getting trapped

The recently added **Soma homepage** link has a regression: on the first signed-in return it can redirect back to `/teacher`. The isolated browser reproduced this. The link lacks the explicit navigation state already used by the dashboard logo, while the landing page auto-redirects registered users. This means the previous navigation fix is incomplete.

Direct `/teacher/notes` and `/teacher/homework` routes also returned the generic teacher setup/home view in the fixture, not the requested tool.

Desktop navigation uses Home / Teach / Track / Earn; mobile uses Home / Library / Marking / Wallet / Reports. Teach opens the paper studio although its description promises notes and schemes. Open class sharing opens Darasa recording rather than the classroom stream. These are label/destination mismatches, not just visual preferences.

### Create → improve → save → resume

Rich notes support expansion and a quiz, but the library save callback saves the notes, not the attached questions/answers. Reopening through the legacy history view does not reconstruct the complete rich workspace. Local caching is helpful but not a substitute for durable, discoverable saved work.

Lesson plans are held in component state. The Polish handoff receives the plan text but ignores it when changing tools, opening a blank polisher. Source: `Teacher.tsx:1409` and `LessonPlanGenerator.tsx`. Preserve the plan before navigation and carry it into the next tool.

### Share → teach → assess

The notes/quiz publish helper creates a classroom post describing the title, subject, class and question count, rather than attaching the actual generated content. Source: `Teacher.tsx:628`. A production teacher-to-learner receipt test must prove the learner can open the complete intended resource, not just see a notification about it.

### Understand access and progress

Different screens/code paths describe three daily uses, five free weekly lessons, and a FREE teacher AI allowance of 20. Paper studio has a separate local credit count. These may represent different features, but the distinction is not clear enough to teachers. Establish one understandable entitlement explanation tied to actual enforcement.

Reports also calculate proxy values: active count is student count minus at-risk count; homeworkDone is pass rate; syllabus coverage is derived from topic count. Source: `TeacherReports.tsx:251`. Do not present such proxies as measured activity/completion. Use real events, clearly label estimates, or show “Not enough data.”

## Feature coverage and visibility inventory

“Inspected” below does not mean certified working. UI = browser discovery; code = implementation review. Production dependencies remain subject to the verification limits above.

| Feature family | Coverage | Readiness / visibility concern |
| --- | --- | --- |
| Public teacher sample and login handoff | Guest UI + code | Keep prompt and full draft through login; unify subsequent workspace |
| Teacher home / setup / navigation | Desktop and mobile UI | Repeated setup banners push actual work down; labels differ by device |
| Typed rich notes / expand / same-topic quiz | Code | Strong core direction; not the standard Notes destination; partial library save |
| File/voice notes | UI + code | Discoverable below banners; real capture, extraction and AI quality still unverified |
| Lesson plans / PDF | UI + code | Plan persistence and Polish handoff need repair; PDF content not verified |
| Lesson polisher | Code | Incoming plan ignored |
| Scheme of work | UI + code inspection | Reachable through quick tools; generation and recovery need real account test |
| Quiz generation | UI + code | Different input requirements across entry points |
| Homework | Browser action + code | Blocked: false assignment success |
| Class library / recent work | UI + code | Desktop entry is easy to miss; richer generated resources not fully restored |
| Classroom stream / roster / gradebook | UI + code | Must verify actual learner join, receipt and account isolation |
| Marking / feedback | Empty-state UI + code | Needs review-before-save; sample trial would improve adoption |
| Reports / analytics | Code | Some metrics are proxies, not measured outcomes |
| Paper studio / question sources | UI + assembly test + code | Blocked: incomplete paper, ignored source selection |
| Paper editor | Desktop/mobile UI | Blocked on mobile |
| Paper upload / extraction | Code | Real files and AI extraction not verified |
| Print / DOCX | UI action + code | DOCX placeholder; print layout still needs verification |
| Paper library / purchases | Guest UI + code | Ownership/recovery risks; learner/teacher wording mixed on purchases |
| Darasa / live lesson capture | UI + code | Class-sharing label sends teachers here unexpectedly; real audio unverified |
| CPD / templates / pedagogy coach | Code + tools hub discovery | Secondary tools; example progress must not imply earned completion |
| Classroom simulator | Tools hub discovery + code | Keep optional and explicitly a simulation |
| Creator studio / selling / earnings | Guest UI + code | Separate lengthy onboarding; submission, sale and payout not tested |
| Subscription / usage limits | Code | Conflicting explanations; no live financial transactions tested |
| Support | Browser interaction | Floating control obstructed a mobile primary action |
| Separate assessments/content/intelligence routes | Guest routes + flags | Redirect/disabled modules; not verified released capabilities |

Do not expose unfinished, disabled modules merely to make all features visible. Make **important working features** discoverable; keep experimental tools clearly secondary.

## Does this solve a real teacher problem?

The strongest jobs are preparation time, differentiated explanations, ready-to-edit assessments, marking with teacher control, and finding yesterday's work. These are practical reasons to return. Selling material, simulations and CPD can add value later but should not compete with preparing tomorrow's lesson.

The current experience too often delivers a generated fragment or sends the teacher to another workspace. The competitive advantage should be a complete class-ready package: substantial notes, examples, optional short quiz and answers, editable output, dependable saving, and usable print/share. Curriculum quality needs subject-teacher evaluation; syllabus branding alone is not proof.

## Recommended information architecture

Use the same named destinations on desktop and mobile: **Home, My materials, My classes, More**. Keep a clearly accessible Soma homepage link. Place selling, reports, CPD and account settings under clearly labelled secondary destinations, with contextual shortcuts where useful.

Home should begin with class/subject selection, then three visible actions: **Prepare a lesson**, **Create an assessment**, **Mark learner work**. Immediately below, show **Continue your work** with real drafts. Avoid multiple setup panels and competing Teach/Share/Track/Earn cards.

Prepare a lesson should keep notes, lesson plan, expansion and quiz in one topic workspace. Do not require the teacher to retype context. Always show a truthful saving state and a stable way back to saved material.

## Repair order and release gates

1. **Trust:** real assignments; honest exam totals/source behavior; owner-scoped durable saves; review-before-publish marking; real exports or remove unavailable buttons.
2. **Continuity:** correct homepage/tool navigation; carry plans and notes between tools; save/reopen the complete resource; consistent desktop/mobile destinations.
3. **Phone usability:** responsive paper editor, unobstructed actions, real camera/audio trials.
4. **Teacher value:** subject teachers assess depth, correctness, local curriculum fit, editability and preparation time against their usual book-based method.
5. **Expansion:** verify paid access, purchases, selling and payouts separately before including these in a broader trial.

Before an independent pilot, demonstrate on a dedicated teacher account: create → edit → save → refresh → sign out/in → reopen on another device; prepare a correctly totaled paper and usable export; assign to a test learner who opens it; review marks before saving. No success message may precede confirmed completion.

Product source was not changed or deployed during this review. The audit artifacts and test guide are new review deliverables. See [teacher pilot guide](teacher-pilot-test-guide-2026-09-13.md).
