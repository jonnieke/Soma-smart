# Day 19 Reliability Hardening (Wallet + Classroom)

Date: 2026-05-11

## Issues Targeted

- Repeated `teacher_wallets` 403 noise loops.
- Repeated `classes` 500 lookup noise in teacher classroom paths.

## Fixes Applied

1. **Wallet polling guard strengthened**
   - Expanded forbidden detection (`status`, `statusCode`, `code`, `message`, `details`, `hint`).
   - Polling now skips `fetchEarnings()` when wallet access is already marked denied.
   - Prevents repeated noisy retries once RLS denial is confirmed.

2. **Class lookup failure cooldown**
   - Added in-memory cooldown cache in classroom service for failed `getOrCreateClassByName` lookups.
   - On recent failure, returns local fallback directly for 5 minutes instead of repeatedly hitting failing endpoint.

3. **Placeholder class/subject guard for posting**
   - Prevents posting flow from attempting class resolution when selected values are placeholders.

## Files Updated

- [src/context/AppContext.tsx](D:/software/soma%2017.1/somaai/Soma-smart/src/context/AppContext.tsx)
- [src/services/classroomService.ts](D:/software/soma%2017.1/somaai/Soma-smart/src/services/classroomService.ts)
- [src/features/teacher/MyClassroom.tsx](D:/software/soma%2017.1/somaai/Soma-smart/src/features/teacher/MyClassroom.tsx)
