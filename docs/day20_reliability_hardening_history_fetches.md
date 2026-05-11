# Day 20 Reliability Hardening (History Fetches)

Date: 2026-05-11

## Problem

- Repeated learner/teacher history fetch warnings could continue after first failure in unstable or partial backend states.

## Fix

- Added optional-data circuit breakers for:
  - `learner_history`
  - `teacher_history`

Once a fetch fails in-session, the app marks that source unavailable and skips repeated fetch attempts until context reset/user change.

## File Updated

- [src/context/AppContext.tsx](D:/software/soma%2017.1/somaai/Soma-smart/src/context/AppContext.tsx)

## Expected Outcome

- Cleaner console signal.
- Fewer repeated failing calls.
- Graceful fallback to locally available history data.
