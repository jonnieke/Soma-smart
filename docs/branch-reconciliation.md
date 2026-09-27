# Branch reconciliation — 27 September 2026

Baseline: released main `c6fee64`. This is a selective recovery, not a wholesale merge of older branches.

## Recovered

- From the older local main work: verified subscription access to exam papers, including the existing custom learner session credentials. The reader now accepts the server's study entitlement and provides a retry instead of redirecting in a loop. Payment confirmation still requires a verified paid order.
- From the older security work: fail closed when the AI allowance database lookup fails. Return a retryable 503 without leaking database details or allowing unmetered generation.
- Regression coverage for server entitlements, reader denial/retry, and allowance lookup failures.

## Already covered or superseded

- Root camera-button edit: the released learner uses the separate QuestionCamera component with a visible Capture control. Original edit preserved.
- Claude branch PIN login, secure learner memory, authenticated notebook work and three migrations: equivalent protections already exist in main. The migration shown modified in that worktree has identical Git content.
- Older homepage, learner and subject layouts: superseded by the released redesigns.
- audit/release-readiness-2026-08-21, codex/learner-credit-wallet and codex/learner-whatsapp have no commits outside current main.

## Preserved for separate feature review

Local main commit `7c5861d` contains 130 files of mixed changes, including teacher uploads, compensation, moderation, growth/referral features and older versions of current pages. These have NOT been merged wholesale or enabled. They need a separate scoped review, especially compensation and billing policy.

The seven divergent Claude commits remain on their original branch. Root edits, Supabase temporary metadata, untracked screenshots and review artifacts remain untouched. Branch divergence does not mean every old change is missing from production.

## Backend deployment caution

The live exam-paper-bank implementation has private-storage and entitlement protections absent from the older local source. Do not replace it with that source. This recovery only updates its frontend consumer.

The live gemini-proxy v78 likewise differs from local source. Deploy the allowance fix surgically against its retrieved live source, preserving all other code and its existing authentication configuration; include the tested shared verifiedUsage helper. No schema or payment data changes are required.

Applied as gemini-proxy v79 (ACTIVE), preserving the existing custom-auth configuration. The deployed entrypoint differs from v78 only by the helper import and the failed-lookup check.
