# Learner classroom redesign

Implemented against the supplied September 27 classroom reference. Local only; not deployed.

- Top navigation, warm background, two-column lesson/tutor layout, serif lesson headings, illustrated erosion lesson, practice question and next lesson.
- Real account name and grade are retained. Saved status appears only after the notebook callback completes.
- Existing question generation, camera, upload, voice, read-aloud, notebook, library, past papers and profile handlers remain connected.
- Saved explanation history can initialize the classroom; otherwise it opens the curated soil-erosion starter. New generated answers retain their own full explanation and topic.
- Soil erosion, photosynthesis and fractions use reusable visuals. Unknown topics do not receive unrelated illustrations.
- Mobile stacks the lesson and tutor and keeps all navigation available.

## Artwork

`public/lesson-illustrations/classroom-soil-erosion.webp` is a generated reconstruction of the reference's two watercolor hillside panels, not a literal crop. Existing Soma branding is retained. The prompt requested only a wide 3.2:1 bare-soil/grass-root comparison under rain, on white, without text or website elements. Text labels are accessible HTML. The asset is pre-generated and reused; loading it does not incur an image-generation API charge.

## Verification

- 19 focused tests: classroom, lesson visuals, answer notes and hero continuation.
- TypeScript check passes.
- Browser checked at desktop and 390px mobile width: no horizontal overflow; picture feedback and continuation work; Subjects opens the library after optional onboarding is dismissed.
- Live AI calls, camera/microphone permissions and paid audio were not exercised again during this visual redesign.

## Follow-up journey check

- Browser verified guest-device save: Soil erosion appeared in My notes with its full explanation, and Read note opened it.
- Back to home returned to the classroom with the topic retained.
- A live Explain more simply request completed and returned relevant soil-erosion content.
- Release blocker: that response rendered its entire explanation as a single level-three heading, with paragraph/list boundaries missing. The shared Markdown renderer received content that did not render as separate blocks. Investigate the returned text and response formatting before release; the precise loss point is not yet confirmed.
- Verification stopped at this response-to-UI failure. Camera, microphone, paid audio and signed-in cloud persistence remain unverified in this pass. No deployment performed.

## Follow-up formatting repair

- Follow-up generation now requests `explanationParagraphs`; a validated adapter joins the blocks with explicit Markdown paragraph boundaries and removes accidental leading heading markers.
- Incomplete output throws instead of replacing the current lesson.
- Two formatting regression tests plus five classroom tests pass; TypeScript passes.
- Fresh live browser response renders normal body text and list items with zero headings inside the explanation, rather than one oversized heading. Existing malformed answers are not rewritten retroactively.
- No Supabase deployment or database change is required for this client-side request/response change.

## Release readiness review

All 39 tests across eight learner suites pass: classroom, follow-up formatting, answer notes, illustrations, hero handoff, notebook UI, local notebook persistence and subject library. The notebook service suite needs non-production Supabase placeholder settings to initialize its client; this is not evidence of signed-in cloud persistence.

The working branch also contains teacher paper generation/export, payment identity, AI allowance, pricing and landing redesign work. Do not stage or publish the whole worktree for a learner-only release.

Learner release scope: classroom components/assets/tests, lesson illustration components/catalog, hero handoff, learner integration/page metadata, follow-up parser and schema changes. `geminiService.ts` must be split by hunk: retain teacher paper/allowance work outside this release. `App.tsx` also contains landing/video changes; a learner-only release needs the learner widget change plus the Learning Videos route/page required by the classroom link, not the unrelated landing restyle. No files have been staged, committed or pushed during this readiness review.

Remaining release checks: signed-in account/cloud persistence and camera/microphone/audio flows have not been verified in this pass. Deployment scope must be confirmed before publishing.

## Four learner continuity repairs

- Classroom simplification/example responses and the curated next lesson are saved through the existing activity history service. History arriving after initial render can restore the latest answer without overwriting an already-started lesson.
- Next uses the first distinct related topic; without one it requests a deeper continuation of the same lesson rather than leaving for the library.
- Both server RateLimitError and client PlanLimitError use the existing limit modal. The classroom follow-up instruction is retained as a pending action for the existing payment-success resume path.
- Saved state is derived from the current owner's notebook and the exact full explanation, refreshed on notebook changes. Updated explanations remain saveable; remounting no longer loses the saved indicator.
- Regression coverage added for history restoration, next-topic selection, saved/updated note matching, remounted indicators, and both limit error types. No production deployment in this repair.
