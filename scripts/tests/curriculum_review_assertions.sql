-- Run after bootstrap and migration in the SAME isolated psql session.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set request.jwt.claim.email='admin@soma.app';
insert into public.curriculum_mapping_reviews(id,source_id,title,viewer_page,printed_page,summaries,author_id)
 values ('test','kicd-regular-grade6-mathematics','Test',13,'13','["Test summary"]',auth.uid());
select pg_temp.assert_true((select count(*)=1 from public.curriculum_mapping_reviews),'admin creates and reads draft');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set status='approved' where id='test'$q$,'admin cannot bypass review');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set reviewer_id=author_id,status='in_review' where id='test'$q$,'self review denied');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set viewer_page=58 where id='test'$q$,'page beyond source denied');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set summaries='[{}]' where id='test'$q$,'invalid summary denied');
update public.curriculum_mapping_reviews set reviewer_id='00000000-0000-0000-0000-000000000002',status='in_review' where id='test';
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set status='approved',review_note='Admin override' where id='test'$q$,'admin cannot impersonate reviewer');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
set request.jwt.claim.email='outsider@example.com';
select pg_temp.assert_true((select count(*)=0 from public.curriculum_mapping_reviews),'unassigned account cannot read');
with changed as (update public.curriculum_mapping_reviews set status='approved' returning id)
 select pg_temp.assert_true((select count(*)=0 from changed),'unassigned account cannot update');
select pg_temp.expect_error($q$insert into public.curriculum_mapping_reviews(id,source_id,title,viewer_page,printed_page,summaries,author_id) values ('bad','kicd-regular-grade6-mathematics','Test',13,'13','["Test"]',auth.uid())$q$,'non-admin cannot create');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select pg_temp.assert_true((select count(*)=1 from public.curriculum_mapping_reviews),'assigned reviewer can read');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set status='approved',review_note='' where id='test'$q$,'review requires note');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set status='approved',review_note='Checked',summaries='["Altered"]' where id='test'$q$,'reviewer cannot change content');
update public.curriculum_mapping_reviews set status='changes_requested',review_note='Fix summary' where id='test';
select pg_temp.assert_true((select reviewed_at is not null from public.curriculum_mapping_reviews where id='test'),'server timestamps review');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set request.jwt.claim.email='admin@soma.app';
update public.curriculum_mapping_reviews set status='draft',summaries='["Corrected"]' where id='test';
select pg_temp.assert_true((select review_note='' and reviewed_at is null from public.curriculum_mapping_reviews where id='test'),'revision clears prior review');
with changed as (update public.curriculum_mapping_reviews set status='draft' where id='test' and revision=1 returning id)
 select pg_temp.assert_true((select count(*)=0 from changed),'stale revision cannot overwrite');
update public.curriculum_mapping_reviews set status='in_review' where id='test';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set request.jwt.claim.email='reviewer@example.com';
update public.curriculum_mapping_reviews set status='approved',review_note='Checked source and scope' where id='test';
select pg_temp.assert_true((select status='approved' from public.curriculum_mapping_reviews where id='test'),'assigned reviewer approves');
select pg_temp.expect_error($q$update public.curriculum_mapping_reviews set summaries='["Changed after review"]' where id='test'$q$,'approved mapping immutable');
set role anon;
select pg_temp.expect_error('select * from public.curriculum_mapping_reviews','anonymous cannot read even approved drafts');
reset role;
select pg_temp.assert_true((select relrowsecurity from pg_class where oid='public.curriculum_mapping_reviews'::regclass),'RLS enabled');
