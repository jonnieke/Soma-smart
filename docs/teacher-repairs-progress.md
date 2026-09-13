# Teacher repairs: progress

## Current verification status (supersedes historical pending notes below)

- Teacher-paper migration is applied to Soma Smart with owner-only access rules.
- Live rollback SQL checks passed, as did browser create/edit/save, same-account recovery across separate origins and different-account read denial.
- Test paper `paper_1789325967739_haun` was cleaned up by conditional soft deletion (revision 2 to 3), matching its exact ID, title and test-school label. Its content remains administrator-recoverable; it is not permanently erased. Original-account Paper Studio was refreshed and showed zero papers.
- The teacher-login default and wizard identity/marks fixes are local. TypeScript and whitespace checks pass. Nothing is committed, pushed or deployed from these repair batches.
- Final full regression: 48 files / 305 tests passed with `--maxWorkers=2`. The default-parallel run had two 5-second timeouts (TeacherLoginEntry and LandingHome), with 303 passing; no assertions or timeout limits were weakened. Reduced parallelism resolved the timeouts.
- Physical second-device testing and the remaining audit repairs are not certified by the separate-origin browser checks.

## Batch 1 — homework posting and navigation

Implemented locally, not deployed:

- Homework posts full questions and an optional due date to the existing class stream, not just a success alert. Teacher model answers are not included in the post.
- Posting verifies the signed-in identity, requires server confirmation, rejects device-only classroom fallback, and retains the teacher draft on failure and success.
- Stable assignment IDs and duplicate reconciliation support retries after an uncertain response. Repeated clicks are blocked while posting.
- Confirmation says posted, not received/read by every learner. It does not claim submission tracking exists.
- The class join destination now displays membership-protected remote class posts, with loading/error/retry states and readable question spacing. Online submission remains explicitly unavailable.
- Both workspace homepage links preserve intentional return navigation; workspace navigation is hidden in print.
- Direct notes/homework routes select the corresponding tool rather than generic home.

Verification: 43 test files / 271 tests passed. Coverage includes posting failures, offline mode, identity mismatch, local classroom rejection, idempotent retries, private-answer omission, double-click prevention, retained teacher copy, homepage intent, and learner join-to-reading. Tests use mocked backend responses; production teacher-to-learner receipt and deployed RLS are not certified by this result.

Supabase guidance informed authenticated, confirmed writes without local-success fallback; the React review informed explicit asynchronous states, retry handling, and accessible feedback.

## Remaining audit repairs

## Batch 2 — paper assembly correctness

Implemented locally, not deployed:

- Incomplete bank selections stop before saving and show the shortage, retaining wizard settings.
- Matching uses exact normalized grade/subject, curriculum, selected topics, question type and marks. A question's marks are no longer rewritten independently of its marking guide; inconsistent guides are excluded.
- Soma-bank selection accepts public verified Soma entries; personal-bank selection accepts only the current teacher's owned entries. This filters assembly inputs, not a replacement for server-side storage authorization.
- Completed papers use calculated totals and the provided teacher identity. Requested paper totals must match section totals.
- Bank assembly no longer deducts an AI credit. Disconnected AI Hybrid is explicitly disabled pending implementation, rather than silently behaving as bank-only selection.
- Match percentages are calculated from the selected questions rather than fixed constants.

Verification: full suite passed 285 tests before the final success-path test was added; the final focused paper tests cover both complete assembly and failure, source filtering, marks/guide consistency, exact matching and unavailable AI mode. Production storage and content quality are not certified by these mocked/service tests.

## Still remaining

## Batch 3 — private paper storage and recovery (database applied; end-to-end verification pending)

Implemented locally:

- Replaced shared, seeded paper storage and the unawaited `exams` write with a dedicated full-document repository.
- Account-scoped recovery copies; no automatic reassignment of ambiguous `teacher_user` or `teacher_default` legacy documents. Old data stays untouched and a recovery warning is shown.
- Confirmed cloud writes with optimistic revision checks. Rapid saves are serialized; unconfirmed edits remain pending rather than being overwritten by a remote read.
- Full-document remote loading for a fresh device. Offline/server failure warnings explicitly distinguish local recovery from cloud saving.
- Soft deletion leaves a remote tombstone and removes the local copy only after confirmation; failed deletions retain work.
- Editor save/error states and missing-paper retry; workspace load/duplicate/delete errors; uploaded papers use the current account identity.
- Prepared migration `20260913180002_teacher_paper_documents.sql` with owner-only SELECT/INSERT/UPDATE policies and document-identity checks. Prepared rollback-only SQL security test in `supabase/tests/teacher_paper_documents.sql`.

**Database applied on 2026-09-13:** after reconnection, Soma Smart (`lpbcxruekqigvcksbkgr`) became accessible. Confirmed the table was absent, then applied the prepared `teacher_paper_documents` migration successfully. Live catalog checks confirm RLS enabled, owner-only SELECT/INSERT/UPDATE policies, no anonymous SELECT and no authenticated hard DELETE. The new table contains zero documents; existing data was not migrated or changed. Security advisors returned no findings naming this table, but reported other project-wide warnings requiring separate review.

**Live database smoke test passed:** with user approval to test on Soma Smart, inspected custom triggers on `auth.users` and `teacher_paper_documents` (none), then ran `supabase/tests/teacher_paper_live_rollback.sql`. This separate production-conscious script creates random temporary identities, switches to authenticated/anonymous roles, asserts full-document read-back, owner updates, cross-account read/update/insert denial, owner-reassignment denial, stale-revision rejection, soft-delete behavior and hard-delete/anonymous denial. Everything rolls back in one transaction. It issues no passwords or login tokens. This supersedes the earlier database-test blocker; the original disposable-only fixture script was not run in production.

**Still unverified:** real browser sign-in, committed saves and reopening across devices. SQL role simulation is not a browser/authentication test. The frontend remains uncommitted and undeployed; the database smoke test alone does not certify the complete teacher journey.

The new repository's 12 mocked database tests pass, including isolation, full-document recovery, failed/offline saves, conflicting revisions, rapid edits, quota errors and deletion. Editor tests also cover missing papers and failed confirmation. Older school/assessment workflow tests now use explicit paper fixtures; they are not authorization/integration evidence. Those disabled modules require their own sharing layer before being enabled—private draft access is not widened for reviewers or learners.

Supabase/Postgres guidance informed the separate owner-protected table and permissions; the React checklist informed visible save/loading/error states. Encoding normalization was required before editing the existing storage service.

## Outstanding release work

Different-account browser check passed: the localhost session now visibly identifies Vivina. Direct navigation to `paper_1789325967739_haun` returned `This paper was not found for your account. Return to your papers or retry loading.` Its Paper Studio list showed zero papers, while the original 127.0.0.1 session still displayed the test document. This completes the tested read-isolation path after account switching, including prior same-origin owner cache. It does not certify unrelated teacher features. The private labelled test paper remains pending cleanup; no frontend push/deployment occurred. TeacherLoginEntry TypeScript check also completed successfully after correcting test locator options.

Teacher login entry repaired locally: `/teacher` now supplies `initialTab="TEACHER"` to the shared LoginModal. The shared student default is unchanged for learner pages. Two regression tests exercise both teacher sign-in buttons and reopening after switching to Student; both pass. Public deployment remains unchanged until release.

Fresh-origin recovery verified: after the user signed into the same account on `localhost:4173` (separate storage from `127.0.0.1:4173`), Paper Studio listed `TEST ONLY - Paper storage check`. Opening Edit loaded both sections, the exact revised first-question text, school header, instructions and 4-mark total. No recovery copy was transferred between origins. This verifies same-account cloud retrieval in a separate browser storage context, not a physical second device. Different-account browser denial is still pending; retain the labelled private test paper until that check and cleanup.

Browser follow-up: real sign-in exposed missing optional teacherProfile ownership in the create wizard and a hidden fixed 30-mark target despite edited section totals. Wizard now resolves the authenticated repository owner (rejects a conflicting supplied profile) and derives total marks from sections. Six focused wizard tests pass. Created `paper_1789325967739_haun`, labelled `TEST ONLY - Paper storage check`, through the local UI connected to Soma Smart. Edited its first question, saw `Saved to your account`, verified the exact revision-2 content and 4 marks in the live table, and reloaded the editor successfully. This private test paper remains for the fresh-session test and must be cleaned up afterward. An independent-origin preview at localhost:4173 is awaiting the same-account sign-in; it does not share 127.0.0.1 browser storage. Second-account UI isolation and physical-device recovery are still pending. Teacher landing sign-in incorrectly defaults to Student (observed; not yet repaired).

Verification rerun on 2026-09-13: all 47 test files / 300 tests passed and TypeScript `--noEmit` passed. Supabase branch inventory is empty; neither Docker nor psql is available locally. Live two-account/browser testing remains pending an isolated test environment. No fixture users were added to production and no frontend deployment was performed.

- Paper assembly correctness, real source selection and truthful totals/credits.
- Owner-scoped durable paper storage and cross-device recovery.
- Real DOCX export and verified print output.
- Responsive mobile paper editor and unobstructed support widget.
- Teacher review/edit before publishing AI marks.
- Complete notes/quiz persistence and lesson-plan handoffs.
- Consistent feature discovery, accurate reports and entitlement explanations.

Do not approve an independent whole-platform teacher pilot yet. Keep the original audit as the baseline rather than treating these partial repairs as complete closure.
