# Purchase reporting and guided paper discovery

Implemented in the isolated `.release-akili` worktree. Not deployed.

## Included

- Admin → Financials: buyer identity and contact, product, purchase category, amount, payment status, date, reference, rolling 7/30/90/365-day reporting and filtered CSV.
- Separate subscription and past-paper revenue and purchase counts. Only stored SUCCESS statuses count. These are order-cohort totals, not payment settlement reconciliation or unique/active subscriber counts.
- Thank-you, important update and offer drafts. The administrator reviews and sends through their own WhatsApp/email. No automatic messages or broadcasts. Offer drafts require acknowledgement of promotional consent; checkout has no coupon redemption system.
- Exam papers: floating guide, Grade → Subject → Paper → Review → existing checkout. Opening the guide never creates an order.
- Future subscription checkout contacts are stored in `payment_receipt_contacts`. They are payer contacts and do not replace learner identity. Existing missing contacts are not backfilled or guessed.

## Release order

1. Apply only `supabase/migrations/20260913123331_payment_receipt_contacts.sql`. Do not deploy the updated Pesapal function before this table exists.
2. Deploy `admin-purchases` with JWT gateway verification disabled as configured. It validates the caller using getUser plus the server ADMIN_EMAILS allowlist. No browser role can read the private contacts table.
3. Deploy the updated `pesapal` function to start preserving new receipt contacts and serve provider-verified `receipt-status` requests. The receipt response excludes names, account IDs and contacts.
4. Publish the frontend, sign in as an allowed admin, and test Financials with live data. Verify logged-out/non-admin calls cannot retrieve purchases. Do not send messages or create payments during verification without explicit authorization.
5. Apply only `20260913124557_restrict_transaction_access.sql` after the new frontend/backend routes are available. This removes all existing transaction policies, denies anonymous access and browser writes, and permits authenticated owners to read their own records. Backend fulfillment uses service_role. Older cached frontends using direct anonymous transaction polling will need a reload.

## Validation

- Typecheck and production build passed.
- 23 targeted tests passed: purchase joins/totals/CSV, report errors and message drafts, guide progression, checkout identity, and transaction access.
- Actual database schema checked; private-table permissions tested in a rolled-back transaction: anon=false, authenticated=false, service_role=true for SELECT. No permanent schema change was made.
- Browser checked on desktop and 390px mobile: grade, subject, paper and review, then existing checkout for the selected paper. No payment initiated.
- `scripts/verify-transaction-access.sql` passed against the real database inside a rolled-back transaction: owner reads allowed, other-account reads hidden, anonymous reads denied, browser insert/update/delete denied, service-role fulfillment allowed. No permanent access-policy changes were applied.

## Observed existing issues / next work

- Production transaction policies contain SELECT true and ALL true policies for public roles. The new migration fixes direct table access but remains unapplied until the release sequence above is completed. Historical stored SUCCESS records are not an independent provider reconciliation. Other tables/RPCs require their own security review.
- The 30-day read-only check found 9 successful subscriptions (KES 460), 8 failed subscription attempts, 3 successful papers (KES 60), and 2 pending paper attempts. All nine successful subscription rows had linked profiles but no phone or email in those profiles.
- Discount redemption, automatic receipts, opted-in campaigns, delivery history and unsubscribe storage require a separate implementation.
- Admin Overview payment metrics now use the protected purchase-report endpoint too, including paper orders. All-time reporting is capped at 10,000 records per source and fails explicitly if exceeded.
- Student-ID sessions are not Supabase Auth identities. Guest recovery uses the current browser's random receipt reference and checks its intended recipient. Cross-device recovery without a saved receipt needs admin support until a server-authenticated Student-ID session flow exists.
- Removed browser-created demo payments and browser subscription grants. Subscription repair validates the catalog and provider status and uses the original purchase date, so retries cannot extend a plan. A subscription purchase is no longer treated as credits simply because it cost KES 20.
