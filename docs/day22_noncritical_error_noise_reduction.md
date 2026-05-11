# Day 22 Non-Critical Error Noise Reduction

Date: 2026-05-11

## Scope

Reduce production console noise from expected fallback/sync failures while preserving true blocking errors.

## Updated

- Routed non-critical `console.error` paths to `warnIfDev` in:
  - activity/history sync and persistence fallback paths
  - wallet sync fallback paths
  - learner/teacher usage sync fallback paths

## File Updated

- [src/context/AppContext.tsx](D:/software/soma%2017.1/somaai/Soma-smart/src/context/AppContext.tsx)

## Result

- Production console is cleaner in degraded/partial-backend states.
- Developers still see diagnostics in local/dev mode.
