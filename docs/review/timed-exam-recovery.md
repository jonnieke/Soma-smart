# Timed exam recovery

Implemented locally, September 27, 2026. Not released to production.

- Published structured timed papers save answers immediately in browser local storage, namespaced by learner and paper. No PINs, access tokens or marking guides are stored in the recovery record.
- Exam Prep lists unfinished papers and links through the existing paper access gate.
- Reopening a paper requires the existing secure attempt lookup to confirm ownership, paper, mode, selected questions and open status. A failed lookup retains the browser copy and exposes no answer editor.
- Original question order, current answer, current question and absolute deadline are restored. Expired or previously submitting attempts only allow submission retry.
- Already-submitted attempts show the confirmed server score and remove the browser recovery copy.
- Account changes remount the exam workspace. Storage failure produces a visible keep-page-open warning. Confirmed server submission is not hidden by a local history write failure.

## Verification

Component tests cover remount before expiry, expired recovery, failed ownership lookup, lost submission response, and refresh following marking failure, alongside existing marking and submission retry tests. Storage tests cover account separation, malformed records, guests, quota errors and cleanup.

## Boundaries

Recovery is for the same browser/origin and learner. Clearing browser data removes unsynced answers. Uploaded files and anonymous practice are not covered. It does not add cross-device recovery or server-enforced anti-tampering of the practice timer. Existing paper access checks still apply on reopening. A live learner-account/browser recovery trial remains necessary before release; automated tests use mocked API responses.
