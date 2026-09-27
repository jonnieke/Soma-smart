# Exam Prep redesign

Implemented in the existing learner Practice papers / RevisionLanding view, with the original Soma logo and a responsive layout based on the approved concept.

## Connected features
- Grade, subject and exam selectors; CBC senior-school assessments are separate from KCSE.
- Three-question, ten-minute AI practice. Timer begins only after generation succeeds and uses an absolute deadline. Expiry does not destroy answers or force submission.
- Answers and self-review state are saved in this browser tab, scoped by learner identity. This is not cross-device/cloud resume. The UI explicitly explains this scope and handles unavailable storage.
- Topic practice retains the requested topic after errors; unfinished practice is not silently replaced.
- Past-paper navigation passes grade/subject filters into the existing paper bank. Existing payment and entitlement checks are unchanged.
- Timed mocks use the existing published-exam catalogue and RevisionSession workflow, including its existing access checks.
- Akili question, marking and revision-plan entry points reuse the existing coach. Scan uses the corrected QuestionCamera with review/crop/retake. Upload validates supported types and a 10 MB maximum before the existing session handler.
- Classroom, notes, profile, homepage and learning-video navigation are connected.

## Safety and usability
- No invented progress or scores; answer review is explicitly self-assessment, not official marking.
- Practice generation accepts array and wrapped question JSON, validates its fields, and propagates failures instead of returning generic sample questions.
- No new SDK, database migration, payment flow or public deployment.
- Camera and coach are lazy-loaded. Native practice dialog supplies focus containment/Escape; coach supports keyboard containment, Escape and focus return.
- Visible form labels, disabled/busy states, offline messaging, retry paths, reduced-motion support and mobile layouts.

## Verification
- 27 tests passed across ExamPrep, HomeworkCreator, LearnerClassroom, classroomContinuity and upgradeDestination.
- TypeScript and production build passed during implementation; final check recorded in task response.
- Browser verified real Grade 9 maths generation, countdown and answer preservation after close/resume.
- Mobile 390 px viewport: document width and scroll width match (no horizontal overflow).
- Live paper availability depends on published content for the selected grade/subject. Camera hardware permissions and purchases were not exercised in this review.
