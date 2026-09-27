# Shared lesson visuals: initial library

Three reusable teaching visuals are integrated into `LearnerAnswerNotes`: soil erosion, photosynthesis and equivalent fractions. Matching uses the lesson title, not incidental words in its explanation. Unsupported topics receive no unrelated placeholder. Generic erosion questions use an explicitly captioned water-erosion example; dental, coastal and glacial erosion do not match that example.

Each visual has a caption, a takeaway and one optional practice question with local explanatory feedback. No API or generation call occurs when selecting, viewing or answering. Native labels and radio controls support keyboard/screen-reader use. Image failure leaves the caption and question usable. Component keys reset the attempt when the topic changes.

## Content and assets

- Soil erosion: generated illustration, visually checked for the bare/vegetated comparison. Accessible labels and educational claims are separate editable HTML. Asset: `public/lesson-illustrations/soil-erosion.webp` (1200 × 800, 196,028 bytes). Generated using the built-in image tool, then converted with Sharp. Original: `C:/Users/peterson/.codex/generated_images/01a05216-fd14-7d22-952f-fd693578bf95/exec-d22e1fe6-944f-4510-a355-7ddb42c3cec7.png`.
- Photosynthesis: code-rendered overview, light energy plus carbon dioxide and water forming sugar and oxygen. Clearly identified as a simplified overview.
- Fractions: code-rendered bars with exactly equal wholes and divisions, showing 1/2 = 2/4.

Content references checked: FAO soil-erosion key messages; OpenStax Biology 2e section 8.1 and Prealgebra 2e section 4.1. Links are in the catalog. This is an assistant editorial check, not a claim of independent teacher or curriculum-board approval.

Erosion generation prompt: Create a single textbook educational illustration asset, landscape 3:2. Two equal side-by-side panels separated by a slim cream gutter. Same gently sloping hillside descending left to right in each panel, both experiencing equal rain from a small cloud above. LEFT: bare brown topsoil with no grass, rain splashing and muddy brown runoff carrying small soil particles downhill into a stream. RIGHT: same slope densely covered in green grass, a soil cutaway clearly showing branching roots holding topsoil together; much less surface runoff and clearer water at bottom. Warm ivory background, soft watercolor and clean naturalist textbook style, accessible Kenyan school science illustration. Accurate comparison of vegetation reducing water-driven soil erosion, roots ONLY below plants in right panel. Focused simple composition, abundant clean edges, visible rain in both panels, comparable slope angle. No people, no logos, no text, no letters, no arrows, no numbers, no labels, no UI. The app will add accessible labels outside the image. Full uncropped hillsides and water, professional science teaching asset, not a decorative landscape.

## Operating cost and expansion

Existing assets incur ordinary hosting/delivery only. No learner image-generation allowance is consumed. Live custom image generation and paid image credits are not enabled. Expand by adding a checked visual, topic matching, alt text/caption, question/feedback and source reference to the shared catalog. Avoid attaching a generic illustration where the topic requires a different scientific process.

## Verification

14 focused tests passed across lesson visuals, learner notes and homepage-answer continuation; TypeScript passed. Browser preview confirms all three render, feedback works, and no console errors were reported. Preview uses the actual `LessonVisual` component at `/artifacts/lesson-visual-check/index.html`; it is a development review page, not a shipped app route. Changes remain local and uncommitted.
