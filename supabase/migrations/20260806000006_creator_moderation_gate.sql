-- Publication is a two-step admin decision and cannot race an active screening job.

create or replace function public.review_creator_material(
  p_material_id uuid,
  p_decision text,
  p_notes text default null
) returns public.creator_materials
language plpgsql
security definer
set search_path = public
as $$
declare
  current_material public.creator_materials;
  updated public.creator_materials;
  next_status text;
begin
  if not public.is_soma_admin() then raise exception 'Admin access required'; end if;

  select * into current_material
  from public.creator_materials
  where id = p_material_id
  for update;
  if current_material.id is null then raise exception 'Creator material not found'; end if;

  next_status := case upper(p_decision)
    when 'APPROVE' then 'APPROVED'
    when 'PUBLISH' then 'PUBLISHED'
    when 'REQUEST_CHANGES' then 'CHANGES_REQUESTED'
    when 'REQUEST_RIGHTS' then 'RIGHTS_EVIDENCE_REQUIRED'
    when 'REJECT' then 'REJECTED'
    else null
  end;
  if next_status is null then raise exception 'Unsupported review decision'; end if;
  if next_status = 'APPROVED' and current_material.screening_status in ('QUEUED', 'PROCESSING') then
    raise exception 'Originality screening is still running';
  end if;
  if next_status = 'PUBLISHED' and current_material.status <> 'APPROVED' then
    raise exception 'Material must be approved before publication';
  end if;

  update public.creator_materials
  set status = next_status,
      rights_evidence_required = case
        when next_status = 'RIGHTS_EVIDENCE_REQUIRED' then true
        when next_status = 'APPROVED' then false
        else rights_evidence_required
      end,
      review_notes = nullif(trim(p_notes), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      published_at = case when next_status = 'PUBLISHED' then now() else published_at end,
      updated_at = now()
  where id = p_material_id
  returning * into updated;
  return updated;
end;
$$;

revoke all on function public.review_creator_material(uuid, text, text) from public;
grant execute on function public.review_creator_material(uuid, text, text) to authenticated;
