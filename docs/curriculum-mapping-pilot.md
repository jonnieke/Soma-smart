# Curriculum mapping pilot

## Implemented locally

- Grade 6 and Grade 9 Mathematics source links traced from KICD regular curriculum pages on 27 September 2026.
- Source catalogue is bundled shared metadata, not a copy of the documents.
- Teacher/admin source panels distinguish link verification from outcome review.
- Existing local importer stages page-referenced drafts, validates hierarchy and scopes nodes by framework, grade and subject.
- Old unscoped sample nodes remain stored but are no longer returned as official outcomes. No existing resource or permission records are changed.
- A six-outcome pilot uses short Soma-written summaries: three Grade 6 whole-number outcomes and three Grade 9 integer outcomes. It is explicitly partial and awaits teacher review; it is not fed into AI generation or published learner materials.
- Both pilot tables were checked visually in the public viewer. Grade 6 uses viewer/printed page 13; Grade 9 uses viewer page 13, printed page 1. Grade 6 publication page confirms revision in 2024.
- The linked files are view-only and both publication pages reserve reproduction rights. No PDF was downloaded: attempted downloads returned permission-error HTML. Obtain written permission before bulk ingestion; do not bypass the owner's download restrictions.

## Not yet implemented / release gates

1. Read the linked revised documents and prepare paraphrased strand, sub-strand and outcome mappings with page references. Do not substitute older PDFs or special-needs designs.
2. Confirm permitted uses before copying or redistributing document content. Public access is not an open licence.
3. Shared-review migration applied to Soma Smart on 27 September 2026. Verified RLS enabled, no anonymous SELECT or authenticated DELETE grant, and three access policies. Security advisor reports no findings for the new table or trigger. Signed-in admin staging and assignment passed against the live backend; both pilots are in review with an independent reviewer. Frontend deployment and the reviewer's own cross-device smoke test remain pending. General JSON imports remain browser-local; the separate Share pilot action explicitly writes the six-outcome pilot to the private review queue. Publication is not implemented.
4. Independent review of Soma's mappings, including document edition and every mapped outcome. This is our quality safeguard, not a KICD requirement to reapprove the official curriculum. Source-link verification alone is insufficient.
5. Link existing resources by reviewed node IDs without altering ownership, visibility or paid access. Provide learner and teacher navigation to published mappings.
6. Add KNEC assessment guidance separately. KICD curriculum designs are not marking schemes. Generated mark allocations must be labelled indicative, never guaranteed.
7. Verify learner and teacher journeys in the browser before release.

## Local import example (test data, not a curriculum claim)

```json
{
  "frameworkId": "fw_kicd_cbc",
  "sourceId": "kicd-regular-grade6-mathematics",
  "nodes": [
    { "id": "g6-maths-example-strand", "type": "strand", "title": "Replace with a reviewed mapping", "sourcePageNumber": 1 },
    { "id": "g6-maths-example-outcome", "parentId": "g6-maths-example-strand", "type": "learning_outcome", "title": "Replace with a reviewed outcome", "sourcePageNumber": 1 }
  ]
}
```

Imports cannot publish nodes or assert reviewed status. Reimporting the same source-specific IDs updates drafts; IDs from another source cannot be overwritten.

## Shared pilot review workflow (backend applied; frontend release pending)

- Admin: `/admin/content-os` → Open shared review queue → Share pilot → assign a verified teacher's Supabase Auth UUID → Send for teacher review.
- Teacher: dashboard Curriculum review link or `/teacher/curriculum-review` → Open shared review queue → check original source → leave a note → approve accuracy or request changes.
- Requests for changes return to the admin for edits and resubmission. Approved rows are immutable. A later content version must be a new record; version creation UI is not included yet.
- RLS limits rows to admins and the assigned reviewer. A database trigger enforces transitions, immutable identity, page bounds, mandatory review notes and independent review. Client updates include the expected revision to prevent stale overwrites.
- No anonymous access, delete grant or publication transition exists. Neither approval nor staging grants copyright permission.
- Local tests use a disposable PostgreSQL 17 container with mock auth helpers. Run bootstrap, migration and assertions in one psql session. NEVER run the bootstrap file against Supabase. All 19 database assertions passed. Production advisor checks and the authenticated admin smoke test passed; the reviewer's own cross-device test remains pending. No review notification email has been sent.
