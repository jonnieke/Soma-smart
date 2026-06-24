# Vertex Live Tutor Setup

This project now includes the plumbing for a syllabus-guided voice tutor using Gemini Live API through the Supabase `gemini-proxy` edge function.

## What is wired already
- Browser voice sessions connect to `src/services/geminiLiveService.ts`.
- The browser sends the logged-in Supabase access token and `soma_active_student` code on the WebSocket URL.
- The Supabase `gemini-proxy` function now accepts auth from either headers or query parameters, so WebSocket sessions can be identified reliably.

## What still needs to be configured in Google Cloud
- Enable Vertex AI / Gemini Live API for the Google Cloud project.
- Add billing to the project.
- Create a service account if you want Vertex-authenticated requests instead of API-key fallback.
- Save the required secrets in Supabase Edge Function env vars.

## Required edge function env vars
- `GEMINI_API_KEY` or Vertex service account vars
- `GCP_PROJECT_ID`
- `GCP_CLIENT_EMAIL`
- `GCP_PRIVATE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Recommended deployment shape
- Host the interactive voice client in SomaAI.
- Keep the live voice bridge in Supabase Edge Functions for now.
- Move to a separate Cloud Run service later only if the live session needs more control, logging, or scaling.

## Next implementation step
- Add a tutor mode toggle in the learner UI.
- Route syllabus-grounded context into the live session before any answer is spoken.
- Add usage metering so voice minutes are credit-based.
