# Customer welcome rollout

Backend and customer-welcome/preferences frontend deployed on 27 September 2026 (commit d3d3c69). Public domains were explicitly assigned to verified deployment dpl_7dU1z7QbCMQ3HMhe6Ke8FfbN5GLi after the Git-triggered deployment raced the promotion.

- PaymentFlow and pricing callback retain a verified-receipt thank-you until the customer continues. Existing active subscriptions are not presented as new payments. Purchase types are not inferred from URL parameters.
- Notification menu and purchase confirmation link to /communication-preferences. Supabase Auth users can save and revoke optional channel choices. Student-ID-only and guest preference persistence is not implemented; no automatic enrollment.
- Migration adds consent version and server-recorded timestamp to existing RLS-protected preferences. Legacy default-true email values are not treated as explicit consent by the new delivery guard.
- notify-users external delivery is off unless CUSTOMER_OUTREACH_ENABLED=true. Do NOT enable yet. WhatsApp remains blocked even then until approved template support exists.

## Remaining before customer outreach

Add contact verification, consent history, verified-payment event/outbox with deduplication, provider delivery webhooks, retries, approved WhatsApp templates and unsubscribe processing. Exercise administrator and owning-teacher notification flows before enabling campaigns. No thank-you emails, WhatsApp messages or campaigns are sent by this implementation.

## Customer care (local follow-up, not released)

Admin sidebar now exposes Customer care at /admin?tab=CUSTOMER_CARE, reusing the protected purchase report and defaulting to successful purchases. Individual buyer drafts include thank-you, purchase support, new features/materials and offers. Promotional drafts require a manual current-channel-permission acknowledgement, reset when changing purpose. This is not a verified consent lookup, saved-draft store, subscriber audience builder or bulk sender. Operators must handle opt-out replies themselves. No provider calls, new database privileges or outbound sending were added.

The guest exam-paper checkout now uses the shared thank-you after the server confirms paid access, preserving read/revision intent. It displays the returned title but does not invent a receipt amount. Restored purchases still open directly; pending access does not produce a thank-you. Guest buyers are not enrolled in messaging.

Live backend: migration 20260927174743 applied; notify-users deployed and CUSTOMER_OUTREACH_ENABLED=false. The function validates the signed-in publisher: administrators, or teachers owning the target class and class post. Direct create_content_notification execution is restricted to service_role. Verified live RLS and RPC privileges; security advisors returned no findings for these changed database objects, but unrelated existing warnings remain. With the account owner's explicit approval, saved all three optional channels off through the local signed-in UI against the live backend. The success confirmation appeared, and all three remained off after a full reload. Evidence: artifacts/communication-preferences-optout-verified.png. Do not enable external delivery.

No community invite URL or ElevenLabs agent has been configured. Do not claim those journeys are complete.

Verification on 27 September: 30 focused frontend/service tests and 10 isolated PostgreSQL assertions passed. Unauthenticated POST to the deployed notify-users endpoint returned 401. Live preference save/reload/opt-out passed. Authenticated publisher-flow tests remain outstanding.
