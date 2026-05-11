# Day 21 Production Quiet Console Pass

Date: 2026-05-11

## Goal

Reduce non-critical production console noise while keeping developer diagnostics in local/dev.

## Implemented

- Added `warnIfDev(...)` helper:
  - [src/utils/logger.ts](D:/software/soma%2017.1/somaai/Soma-smart/src/utils/logger.ts)

- Replaced non-critical `console.warn` calls in high-noise paths with `warnIfDev`:
  - [src/context/AppContext.tsx](D:/software/soma%2017.1/somaai/Soma-smart/src/context/AppContext.tsx)
  - [src/services/classroomService.ts](D:/software/soma%2017.1/somaai/Soma-smart/src/services/classroomService.ts)
  - [src/features/teacher/MyClassroom.tsx](D:/software/soma%2017.1/somaai/Soma-smart/src/features/teacher/MyClassroom.tsx)

## Result

- Production console is quieter for expected degraded/fallback states.
- Dev mode still surfaces these warnings for troubleshooting.
