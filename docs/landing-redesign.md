# Focused landing page redesign

Implemented locally from the approved warm-ivory/navy homepage concept. Retains the existing Soma logo, live past-paper ribbon, and existing Ask Akili submission/camera/upload/voice handlers. Adds Learning videos to desktop and mobile navigation at `/learning-videos`. Existing authentication, learning, teacher, pricing and legal callbacks are reused. Competing floating assistants are hidden on these two public pages.

The former homepage is retained as `LegacyLandingHome` for regression coverage; it is not rendered on the public homepage. The simplified homepage intentionally removes the old wall of feature sections.

## Artwork

Generated hero illustration: `src/assets/images/landing-study-illustration.webp`, 1200 × 800, approximately 100 KB. A separate artwork asset keeps all text and controls accessible HTML rather than flattening the mockup into an image. This is a recreation of the approved illustration, not a pixel-identical crop.

Prompt intent: Create only a warm editorial Kenyan education hero illustration: two Kenyan teenage learners studying with an open book at a wooden desk, boy in green school vest and braided girl in navy, soft window light, books and plant, warm ivory watercolor edges, no lettering or interface elements.

Original generated output: `C:/Users/peterson/.codex/generated_images/01a05216-fd14-7d22-952f-fd693578bf95/exec-e075ca3c-1508-40f6-b99b-89ede98325e3.png`.

## Verification

- Production build passed; final typography adjustments checked in the running browser.
- TypeScript passed.
- 14 tests passed across LandingHome and LandingRedesign suites.
- Desktop visually checked; screenshot at `artifacts/landing-desktop.png`.
- 390px mobile viewport checked: no horizontal document overflow; menu opens and Learning videos navigates correctly.
- YouTube loads only after an explicit button click. The provided video/playlist identifiers are preserved, with an external fallback link. Embedded playback and playlist contents remain unverified: the player stayed blank in the in-app browser. No invented video metadata was added.
- Local preview uses existing parent-checkout public Vite settings in process memory; no environment files or backend configuration changed.

Not committed, pushed or deployed. Unrelated existing teacher/payment work remains untouched.
