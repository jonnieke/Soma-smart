# Paper library restoration

The public bank now restores successful guest purchases using the existing browser buyer token.
There is no phone-number lookup, account ownership migration, or cross-device recovery in this change.
Restored IDs only affect catalog navigation; the existing reader/access endpoint still verifies document access.

## Deployment boundary

Deploy **only** the new `exam-paper-library` Edge Function with its shared `paperLibrary.ts` handler and `verify_jwt = false` configuration. The handler requires the existing guest buyer capability, constrains the lookup to that token and SUCCESS orders, returns only paper IDs, and disables response caching.

Do **not** deploy the local `exam-paper-bank` function alongside it. On 2026-09-27, its live version 12 contained private-storage and authorization protections missing from the checked-out source. That existing payment function was deliberately left untouched.

The new read-only endpoint was deployed with user approval on 2026-09-27 to Soma Smart (`lpbcxruekqigvcksbkgr`) as version 1. The frontend is included in this learner and paper-bank release.

Live smoke checks passed: missing token returns 400; a synthetic unknown buyer returns 200 with an empty ID list; OPTIONS returns 200 with POST allowed; responses use `Cache-Control: no-store`. The existing `exam-paper-bank` function remains version 12 with its original deployment hash unchanged.

## Checks

- Unit tests cover invalid tokens, methods, pagination, no-cache responses and safe errors.
- Client tests cover persisted browser identity, repeated visits, pagination and failures.
- Page tests cover fresh mounts, restored Read/Practise navigation, and retry without checkout.
- Live read-only schema/query check confirmed the token + SUCCESS + ordered page query is valid. A synthetic buyer token matched zero orders.
- A real returning-buyer success check still requires a browser with a real paid-paper purchase token. No payment was made, and no paid entitlement was fabricated.

Remaining acceptance check: open My papers on the original purchasing browser, reload, then open Read and Practise. Confirm an unrelated browser cannot see that purchase; confirm failure shows Retry rather than prompting another payment.
