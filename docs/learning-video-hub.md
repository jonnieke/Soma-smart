# Learning video hub

## On-site collections (28 September 2026)

Collection navigation uses `/learning-videos?category=upper&view=collection` (also `lower` and `fun`) with a searchable thumbnail grid. Cards open the existing embedded lesson on Soma, and Back to collection returns to the grid. The former external full-playlist link is removed. YouTube's own player controls and explicit fallback video links remain external.

Manual refresh of the existing live scheduler endpoint returned HTTP 200: 1 inserted and 13 refreshed, including the new Upper Education video Blood Circulation. All eligible public, embeddable entries returned by the configured playlists were processed; the catalogue has 14 videos (Upper 4, Lower 6, Fun 4). Private/non-embeddable videos are excluded. Newly imported videos still require reviewed study materials.

Fourteen video-hub tests passed, including collection navigation, embedded-player selection, return to grid, filters, quizzes and rating failures. Phone-width inspection found no horizontal overflow; collection cards now fill the available width. Local browser catalogue retrieval subsequently failed, so deployed playback/return verification remains required.

## Content workflow

Open `/learning-videos` while signed in as an existing Soma administrator. Choose **Manage videos**. Add a YouTube link, title, subject and learner level. You can edit notes, key terms, quiz options, correct answers and explanations using ordinary form fields.

Save a private draft first. Publishing requires a review acknowledgement and a content provenance note. Saving an already-published video as a private draft unpublishes it. The UI does not publish generated material automatically.

Each AI request creates a private generation ID before spending credits. Results, model, timestamp, input and token metadata are saved and recoverable through **Recover a saved generation** and a private permalink. Cost accounting remains in the existing server-side Gemini usage records. If both result-save attempts fail, the editor displays the paid output for manual recovery; do not leave until it is copied/saved. Closing the page while the AI request is still running is not a background-job workflow.

For transcription, confirm source permissions and upload an original audio clip (supported audio MIME type, at most 4 MB), or paste an authorised transcript. Review the transcript against the recording. Generate the study pack, check the factual content and quiz keys, then publish. Large lessons must be split; the current editor accepts 30,000 transcript characters. Existing Gemini proxy usage limits and account costs apply. Generated output is saved once, not regenerated for every viewer.

YouTube's official captions API requires permission to edit the video. This implementation does not scrape captions, download YouTube media, or invent transcripts from titles. Owner OAuth caption import is not implemented. See https://developers.google.com/youtube/v3/docs/captions/download.

## Playlist sync activation

`sync-learning-videos` uses the official YouTube Data API and fixed playlist IDs, paginating up to 1,000 entries per playlist. It imports only public, embeddable videos. A repeated/overflowing page token or API failure aborts collection before writes. Duplicate IDs are ignored on insert; updates affect only title, description and duration. Existing notes, quizzes, category, learner level and publication choices are preserved. If a video occurs in multiple playlists, the first mapping wins (Fun, Lower, Upper). No video is deleted/unpublished by sync, including videos removed from playlists; these require admin review. Every video added to a curated playlist is eligible, including promotional clips: curate playlists accordingly.

New entries become watchable immediately with empty study resources. No AI calls or automatic transcription occur during sync. Prepare those drafts using the existing authorised-audio/transcript workflow, then review and publish.

Backend endpoint and daily scheduler activated on 2026-09-27; frontend admin button remains local. First real sync returned HTTP 200: 4 inserted and 9 refreshed. A second call through pg_net using Vault credentials returned HTTP 200: 0 inserted and 13 refreshed, confirming duplicate protection and scheduler authentication. The active named job runs at 06:15 Africa/Nairobi. Current library: Fun 4, Lower 6, Upper 3. The first future timed run has not yet occurred.

Reproduction/setup instructions (configured in Soma Smart):
1. Enable YouTube Data API v3 in Google Cloud and create an API key restricted to that API. Add it as `YOUTUBE_API_KEY` in Supabase Edge Function secrets, never a VITE/frontend variable.
2. Deploy `sync-learning-videos`; its body verifies administrator auth or a dedicated scheduler secret. Verify one manual **Sync YouTube playlists now** run in Manage videos.
3. Generate a random secret of at least 32 characters. Set `VIDEO_SYNC_SECRET` in Edge secrets and the same value in Supabase Vault as `video_sync_secret`. Store the project URL in Vault as `video_sync_project_url`.
4. Enable pg_cron/pg_net, then execute `scripts/schedule-video-sync.sql`. The named job runs daily at 06:15 Nairobi time. Only activate after credentials and a successful manual sync.
5. Verify HTTP outcomes in `net._http_response` as well as cron dispatch history. Failures log `[video-sync]` without credentials. Retries are safe; a database failure can leave partial metadata updates, which the next run completes.

Public playlist reads use an API key, not owner OAuth. Automatic caption downloading remains a separate permissioned integration; the sync key alone cannot authorise it.

## Initial library

The library now has three editable categories: **Fun** (Story Time, four stories), **Lower Education** (Pre-primary 1, three classroom lessons), and **Upper Education** (Learning Videos, two science lessons). Category URLs use `?category=fun`, `lower` or `upper`. Category switching clears previous search/subject/level filters and selects a matching lesson. Each category links to the user's verified YouTube playlist. Parent/app introductions remain accessible in the full lower-education playlist, rather than appearing as classroom lessons. These are browsing groups, not verified curriculum placements.

The four stories are watchable with sharing and rating; their transcripts, notes and quizzes are explicitly awaiting editorial review. No story content has been fabricated from titles. The category migration and nine total video rows are applied to Soma Smart; deploying the frontend is still required for production UI changes.

Five public Somo Smart videos were verified on `https://www.youtube.com/@Somosmart/videos`: digestion, respiratory system, common greetings, farewell and greetings/farewell. Durations and IDs were read from the public channel. Trailers and advertisements were excluded.

The initial notes and questions are labelled supplementary topic material, not transcripts or official KNEC questions. No transcript was available for publication. A subject teacher should review curriculum/grade suitability before assigning the lessons; the foundation science category deliberately makes no exact syllabus claim.

`node scripts/learning-video-seed.mjs` prints idempotent seed SQL. It inserts missing IDs only, preserving editor changes. The schema migration and five seed rows have been applied to Soma Smart.

## Privacy and access

- Public users read published lessons only. Existing administrator authorization controls inserts and updates. Drafts are not public.
- Ratings are stored privately and only aggregate counts/averages are public. Email-authenticated users can rate, with one vote per user/video; changing it updates that vote. SOMA-code-only rating support is not included yet. Viewing and practice require no account.
- The private ratings table intentionally has RLS enabled with no client policies/grants: all direct access is denied. Its definer write function checks `auth.uid()` and rejects anonymous-auth users; the public wrapper is invoker-security. The public aggregate intentionally reveals no identities. The advisor's no-policy informational notice on this private table is expected.
- Public YouTube thumbnails load from i.ytimg.com (library thumbnails are lazy-loaded). The embedded player connects after a deliberate play or video-card click; that click requests autoplay, which remains subject to browser policy. Cards scroll the selected player into view. A direct YouTube fallback is always visible. Sharing passes only a canonical video lesson URL and title, not account data.
- Quizzes are practice, not secure examinations. Answers are delivered to the browser. Scores are in-memory and reset on navigation/reload; they are not school assessment records.

## Verification

Regression tests cover URL validation, seed structure, quiz answers/retry, lesson switching, deep links, missing videos, sharing, empty search, library retry, anonymous rating failure and lazy YouTube loading. Database checks confirmed public visibility, denied public publishing/private vote reads, and a second rating updates rather than duplicates the first (rolled back test transaction).

Remaining acceptance: administrator transcription with an authorised real recording, editorial review of generated content, and real signed-in browser publishing/rating. No real user vote or paid AI request was created during verification.
