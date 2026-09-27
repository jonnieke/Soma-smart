# Teacher repairs: progress

## Current verification status (supersedes historical pending notes below)

Checkout cleanup verification: TypeScript passes and all nine PaymentIdentity tests pass using a single thread; the initial fork-worker startup timed out before running tests. These tests cover client safeguards, not live credit fulfillment. No purchase, deployment or release performed.

Teacher top-up readiness audit: deployed Pesapal v55 supports the existing 30/100/250 credit catalog and server grants, but sets transaction SUCCESS before fulfillment. A grant failure can therefore leave a successful receipt without credits and later retries skip fulfillment. Do not expose Teacher top-up checkout until atomic/idempotent credit fulfillment and recovery are implemented and verified. Removed the shared PaymentFlow browser-side credit grant and local-wallet fallback to prevent duplicate or fabricated credit balances; this does not repair the backend transaction gap. No payment made or backend deployed. Existing teacher direct-payment also sets both selectedPlan/paymentPlan and its overlay can upgradeAccount on success; keep credit checkout out of this path until separated.

Teacher allowance follow-up: proxy errors now retain explicit server plan/count metadata through the saved-paper failure path. The generator displays server-reported requests used/remaining and suppresses subscription repurchase messaging for recognised paid tiers. It explicitly states that an exact reset time is not supplied and Teacher top-ups are not yet available in this flow. No allowance tables, payment products or backend entitlements changed. 24 focused tests and TypeScript pass; latest UI not browser-verified or deployed. Remaining: reliable reset timestamp, proactive balance display, verified Teacher credit checkout and end-to-end purchase/resume.

Browser upgrade-entry check: reproduced the daily-limit panel with a Grade 6 Science soil-erosion request (five questions/10 marks). View teacher plans opened a separate `/pricing?segment=TEACHER` tab showing Pro Monthly KES 600, Pro Termly KES 1,600 and Pro Annual KES 5,000 with M-Pesa buttons. The source form retained the request. Stopped before selecting a plan or making payment; post-purchase access and generation remain unverified. Local preview only, not released.

Teacher limit conversion: Paper Studio now recognizes teacher-AI limit failures and offers a clear View teacher plans link, opening `/pricing?segment=TEACHER` in a new tab while retaining form values. Copy explains purchase/return/retry and continuing plan limits without advertising unverified teacher credit packs. Pricing selects the Teacher tab from that explicit query and no longer silently ignores teacher-plan selections by existing Pro teachers. Five focused tests pass (limit versus unrelated errors, form retention, teacher-tab entry and checkout handoff). No payment executed; credit-pack entitlement support and post-purchase allowance increases were not changed or certified. Local only.

Latest verification: all 56 test files / 372 tests pass with grading safeguards included. A fresh live generation attempt was blocked by `teacher ai daily limit reached`; the app reported the request retained in My papers and did not substitute sample content. No limit bypass, account switch or entitlement change was performed. Post-safeguard live content review remains pending until authorized usage is available. Not pushed or released.

Grading alignment safeguards: shared prompt now requires every graded action to appear in the question, defines MCQ as selection-only, and distinguishes related concepts instead of merging definitions. Generated-response validation rejects multi-criterion MCQs and explanation/description/justification marking requirements on MCQs; a bounded English-language check also flags explanation criteria on naming/listing/suggestion questions without a corresponding request. These checks are not general semantic validation and can require teacher review. No stored paper is rewritten. Seventeen focused tests, TypeScript and build pass; fresh live output after these safeguards remains unverified. Local only.

Latest regression: 56 files / 370 tests passed. Live explanation recheck generated paper `08decf9e-d617-4a29-bd33-44cd696c3a33` directly from the dashboard shortcut (Grade 6 Science, five questions/10 marks). All five explanations now discuss subject content rather than assessment purpose, and alternatives are labelled. However, semantic grading review failed: Q1 is a selection-only MCQ but its 2-mark guide gives one mark for an unrequested explanation; Q3 asks only to suggest two methods but reserves marks for explaining them. Q3's expected answer also conflates contour farming with terrace construction although its explanation distinguishes them. Do not certify answer-key readiness based on structural tests. Saved test remains for review; no release or corrective content mutation performed in this check.

Dashboard discoverability: added an always-visible Assessment tools navigation row inside the sticky teacher header, with Paper Studio (saved papers) and Create an assessment (generator) links. It is independent of setup dismissal and wraps on narrow screens. Teach now opens teaching tools instead of unexpectedly routing to Paper Studio. Six navigation tests pass; browser narrow-screen screenshot confirms both links visible above setup, and Create an assessment opens the form directly with Teacher home returning to the dashboard. Local only.

## Generation-first implementation in progress — 2026-09-14

Answer-key editorial follow-up: shared generation guidance now requires subject-specific explanations of why answers are correct, worked calculations where appropriate, concrete mark-earning criteria, and clear separation of required responses from acceptable alternatives. Full-paper and variation paths both use it; 15 focused tests pass, including prompt wiring for both paths. This is a prompt improvement, not a semantic quality guarantee; new live output still needs review. Existing saved papers are intentionally unchanged. Local only.

Fresh browser journey verified: Grade 6 Science and Technology, soil erosion, five questions/10 marks, paper `30a5a008-c200-4b5f-90ab-82dcfd2a806f`. Generation completed directly into the editor without recovery; included requested school-garden scenario and MCQ with single option labels. Returned to My papers (both test drafts present), reopened science paper, and inspected the complete answer-key preview. Question-paper and answer-key export actions each reported Word download started; final downloaded Word files/pagination have not been inspected for this science paper. The user's latest maths Word screenshot confirms the MCQ stays together and duplicate labels are gone. No release performed. Content review note: some explanations describe assessment purpose rather than explain the answer, and the garden answer says "Two practical methods" before listing four acceptable alternatives; functional pass does not imply final editorial/curriculum certification.

Word MCQ follow-up: export now links compact, image-free MCQ prompts through their final option, ending the keepNext chain there. Long options/passages remain pageable. Matching embedded option labels are stripped during export for legacy saved drafts without mutating stored content; this applies to question papers and answer keys. All 23 Word export regression tests pass. Fresh Word visual pagination confirmation remains required because this runtime has no bundled LibreOffice renderer. Local only, not pushed.

Live follow-up (local frontend, connected backend): generated a Grade 6 fractions assessment (5 questions, 10 marks), draft ID `11a9d879-4f2f-429e-9dc7-ec843e6bbdbb`. Initial validation rejected escaped/bare LaTeX; inspection also found legitimate half-mark criteria. Added bounded syntax normalization, half-mark validation, and owner-checked recovery of retained responses without another AI call. Recovered the original response, verified the 10-mark draft in My papers, reopened it, and inspected the answer key/mark breakdown. Added matching MCQ-label cleanup for future generations (the earlier saved test still contains its original labels). 13 focused tests and build pass; TypeScript passed before the final label-only adjustment. A fresh uninterrupted generation after these fixes, final Word export of this generated paper, and broader subject quality checks remain unverified. Test draft is retained for review; no production release performed.

Local, not released: Create Paper now starts with class, subject, topic instructions, question count and total marks; duration, curriculum and school name are optional settings. The previous bank wizard remains a secondary route. Generation uses the existing authenticated Gemini proxy rather than the absent assessment-ai function. The request is saved with a UUID before the paid call; the raw response is saved before structural validation; the editor is opened only after the completed paper save succeeds. Validation checks count, marks, marking-criteria sums, required answers/explanations, unique questions and MCQ options. All outputs remain teacher-review drafts, not certified curriculum content. Requests and failed generations show their status in the editor.

Removed simulated document extraction and fake variation fallbacks. Import is disabled pending genuine extraction. Variations now use the existing proxy and validate results; failure keeps the old question. Removed legacy local-credit deductions from variation/import and the misleading credit balance display. Bank wizard no longer fills invented teacher/school identities.

Verification: 55 test files / 359 tests passed before the final lazy-loading adjustment; 9 generator tests passed after that adjustment. Browser form and More options were inspected locally without a backend write or paid generation. Initial preview exposed eager Supabase initialization; deferring generator loading resolved it. Full live AI generation/save/reopen/export remains unverified and requires an authenticated teacher test. These changes do not migrate the custom question bank or implement account-level billing. Remaining work: owner-scoped cloud question-bank storage and legacy recovery; real file extraction; generation metadata/cost accounting and robust server-side interruption recovery; retry/resume UX for retained responses; live cross-subject quality checks. Do not describe the entire audit as resolved or the new generator as production-verified.

Release review, 2026-09-14: the Word/mobile batch is prepared for release. Full regression passes with 53 files / 349 tests and TypeScript passes. User-supplied Word screenshots confirm native fractions, radicals and scripts, independent writing lines, and updated keep-together pagination at questions 4, 8 and 12. The original and updated downloads were compared structurally to distinguish stale screenshots. These are targeted visual checks, not a full renderer-certified review of every export or diagram layout. Local QA pages, downloads and screenshots are excluded from the commit. The historical local/pending notes below describe earlier checkpoints.

- Teacher-paper migration is applied to Soma Smart with owner-only access rules.
- Live rollback SQL checks passed, as did browser create/edit/save, same-account recovery across separate origins and different-account read denial.
- Test paper `paper_1789325967739_haun` was cleaned up by conditional soft deletion (revision 2 to 3), matching its exact ID, title and test-school label. Its content remains administrator-recoverable; it is not permanently erased. Original-account Paper Studio was refreshed and showed zero papers.
- The teacher-login default and wizard identity/marks fixes were released to main in `37da28a`; Vercel production was confirmed Ready. The Word/mobile batch below remains local and uncommitted.
- Final full regression: 48 files / 305 tests passed with `--maxWorkers=2`. The default-parallel run had two 5-second timeouts (TeacherLoginEntry and LandingHome), with 303 passing; no assertions or timeout limits were weakened. Reduced parallelism resolved the timeouts.
- Physical second-device testing and the remaining audit repairs are not certified by the separate-origin browser checks.

## Word export and responsive editor follow-up

Implemented locally after the release:

- Real lazy-loaded DOCX export replaces the alert. Questions and answer keys are separate files, reflecting current editor content, section instructions, marks and candidate-field settings.
- PNG/JPEG diagram attachments and school logos now embed in Word. Missing attachments, load failures, unsupported formats and oversized images stop export rather than silently losing assessment content. Native equation support has been added for the bounded subset described below; final Word rendering remains unverified.
- Mobile Questions / Paper / Edit question views replace squeezed three-column panels. Preview controls wrap, and both editor and preview have named back buttons.
- Browser checks used an isolated fixture with mocked persistence, not live teacher records. At 390px, editing flowed into preview and both DOCX downloads. At 320px, preview controls wrapped without horizontal overflow. Desktop panels were visually checked at 1280px.
- Both downloaded files were checked as ZIP/OOXML: each has 11 well-formed XML parts and the edited question. The questions file has no expected answer; the key contains it.
- Eight focused regression tests pass; full regression passes with 50 files / 311 tests (`--maxWorkers=2`). TypeScript and the production/PWA build pass. The browser reported no console errors for the local fixture. An initial focused run during dependency installation had a worker startup timeout; rerunning after installation passed without weakening tests.
- Word pagination/render QA is still blocked: the bundled runtime has no Windows LibreOffice. Per the documents skill, no user-installed renderer was substituted. Do not call Word print layout certified.
- Documents guidance informed preservation of content and explicit unsupported-format failures. React guidance informed lazy loading, disabled export controls and accessible status messages.

### Diagram follow-up

- Question image attachments now display in the editor and print preview, with visible missing/broken-image messages. The print button checks for missing or still-loading images.
- Browser-only loading uses no credentials or referrer, deduplicates source URLs, bounds image count/bytes, checks PNG/JPEG signatures, limits dimensions and preserves aspect ratios. No server image-fetch proxy was introduced.
- The isolated browser downloaded `Diagram export test-questions.docx`; its embedded PNG matches the original `public/favicon.png` byte-for-byte. This is an attachment transport test, not a pedagogical diagram or Word pagination check. No answer content was present in the learner file.
- At 390px the loaded image fitted within the preview, with no horizontal page overflow; browser error logs were empty. Fifteen focused tests passed; final full regression passed with 51 files / 318 tests. TypeScript and production/PWA build passed.
- Still local and uncommitted. No production records were created or updated. The same Word-rendering limitation above remains.

### Native equation follow-up

- One bounded parser feeds both browser MathML and Word OMML: fractions, square/indexed roots, powers, subscripts, combined scripts, grouped arguments and listed common symbols. It does not evaluate or rewrite the mathematics.
- Accepts `$...$`, `$$...$$`, `\(...\)` and `\[...\]`; escaped dollars and ordinary currency prose are retained. Unsupported commands, malformed groups, excessive nesting and oversized equations fail visibly. This is not a complete LaTeX implementation: matrices, integrals, sums, text/style commands and scalable delimiters remain unsupported.
- Equation previews are shown in questions, options and the print/answer-key view. The input retains its source notation, with a short syntax hint. Unsupported previews keep the source text visible and block printing.
- Browser checks confirmed fractions, cube roots and combined scripts. An inline equation clipping/scrollbar issue was found and fixed with flex alignment and padding.
- The downloaded `Equation export test-questions.docx` contains three native OMML equations, two fractions, a radical and a combined script; it contains no raster images and no raw fraction commands. This confirms editable structure, not Word visual fidelity.
- Documents skill guidance informed native editable equations and explicit unsupported-notation failures. The bundled Word-renderer limitation is unchanged, so do not certify Word pagination or equation appearance in Word until visual QA can run.
- Verification: 25 focused tests passed, followed by 53 files / 335 tests in the full regression suite. TypeScript and production/PWA build passed. The 390px browser preview showed all three test formulas without horizontal overflow and with no browser console errors. Changes remain local and uncommitted.

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

Pagination follow-up: the user's Word screenshot confirmed the three independent writing lines, then exposed question 4 orphaned before its six-line response on the next page. Local export now links compact text-only prompts with up to eight writing lines, ending the keep-next chain on the final line. Longer responses and long prompts are not kept as oversized blocks; text-only prompts still link to the first response line. All 20 export tests pass. Fresh visual Word pagination review remains required; no push/deployment performed.

Local Word writing-line repair: replaced adjoining bottom-only paragraph borders with independent native tab leaders across the A4 content width. Regression checks cover default/custom/zero/capped line counts, no writing lines in MCQ or answer-key output, and all 20 questions plus 120 lines retained in a long-paper package. All 15 export tests pass. These are structural checks, not visual pagination verification; Word page review remains outstanding because the bundled renderer is unavailable. This repair is not pushed or deployed.

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
