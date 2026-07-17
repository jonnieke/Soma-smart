-- Remove exam vectors created before learner-visible and private marking content
-- were separated. Admin can safely re-index published papers after deployment.

alter table public.knowledge_vectors enable row level security;

delete from public.knowledge_vectors kv
using public.knowledge_base kb
where kv.document_id = kb.id
  and kb.type = 'PAST_PAPER';

update public.knowledge_base
set
  indexing_status = 'PENDING',
  indexed_at = null,
  chunk_count = 0,
  last_index_error = 'Re-index required after exam-content privacy hardening'
where type = 'PAST_PAPER';
