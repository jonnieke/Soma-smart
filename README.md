# Somo Smart

Somo Smart is an affordable study and teacher-assist platform for Kenyan CBC, KPSEA, and KCSE learners.

- Learners understand schoolwork, listen to notes, practise, and track weak topics.
- Teachers create lesson content, quizzes, assignments, and feedback faster.
- Parents see proof that learning is happening.

## Launch focus

The public launch experience is intentionally centred on three loops:

1. Learner: ask, understand, listen, practise, save, and return.
2. Teacher: create, share with a class, and review results.
3. Parent or school: pay and see clear learning progress.

Listen & Learn, Talk & Learn, Notebook, low-data support, and Kenyan curriculum alignment are core product features.

## Technology

- React 19, TypeScript, Vite, and Tailwind CSS
- Supabase Auth, Postgres, Storage, Edge Functions, and RLS
- Gemini through a server-side Supabase Edge Function
- ElevenLabs through a server-side Supabase Edge Function
- PWA/offline shell support
- Vitest and React Testing Library

## Local setup

Requirements:

- Node.js 20 or newer
- A Supabase project
- Supabase CLI for Edge Function and migration work

Install and start:

~~~bash
npm install
npm run dev
~~~

The Vite development server normally runs at http://localhost:3000 or the next available port.

## Environment variables

Create .env.local for public client configuration:

~~~bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GA_MEASUREMENT_ID=
VITE_ENABLE_CAMPUS=false
VITE_ENABLE_MARKETPLACE=false
VITE_ENABLE_EXAM_ROOMS=false
VITE_ENABLE_TUTORING=false
VITE_ENABLE_COMMUNITY=false
VITE_ENABLE_LISTEN_AND_LEARN=true
VITE_ENABLE_TALK_AND_LEARN=true
VITE_ENABLE_NOTEBOOK=true
VITE_ENABLE_TEACHER_CLASSES=true
~~~

Do not place Gemini, ElevenLabs, payment provider, or Supabase service-role secrets in client environment variables.

Set private secrets on Supabase Edge Functions:

~~~bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set ELEVEN_LABS_API_KEY=...
supabase secrets set DEFAULT_GEMINI_MODEL=gemini-2.5-flash
supabase secrets set MAX_OUTPUT_TOKENS_FREE=1200
supabase secrets set MAX_OUTPUT_TOKENS_PAID=3000
supabase secrets set ALLOWED_PREVIEW_ORIGINS=https://your-approved-preview.vercel.app
~~~

Optional emergency controls:

~~~bash
supabase secrets set DISABLE_GUEST_AI=false
supabase secrets set DISABLE_AUDIO_GENERATION=false
supabase secrets set DISABLE_TALK_AND_LEARN=false
~~~

## Supabase deployment

Apply reviewed migrations before deploying functions:

~~~bash
supabase db push
supabase functions deploy gemini-proxy
supabase functions deploy elevenlabs-proxy
supabase functions deploy pesapal
~~~

Payment, plan, expiry, and learning-credit entitlement must come from Supabase. Local storage is only a UI cache and must not grant paid access.

## Quality checks

Run these before release:

~~~bash
npm run build
npm run lint
npm test
~~~

Critical manual checks:

- A guest can ask a first question.
- A learner can listen to an answer with device-speech fallback.
- Paid plans and credits are read from the backend.
- A teacher can create and share a class activity.
- A parent can see a learner's recent progress.
- Disabled launch features are absent from navigation.
- Payment confirmation returns the user to the correct dashboard.

## Safety and privacy

Somo Smart serves minors. Do not send names, email addresses, phone numbers, or raw learner questions to generic analytics. Use internal IDs, role, plan, school ID, and event names. All learner, teacher, parent, and school records require reviewed RLS policies.

## Production domains

Production Edge Function CORS allows:

- https://somaai.co.ke
- https://www.somaai.co.ke
- localhost during development
- Vercel preview deployments listed in ALLOWED_PREVIEW_ORIGINS

Review this list before adding another public origin.