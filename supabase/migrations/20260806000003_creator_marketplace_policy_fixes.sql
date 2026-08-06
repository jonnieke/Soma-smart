drop policy if exists "Public reads published creator materials" on public.creator_materials;
create policy "Public reads published creator materials" on public.creator_materials
  for select to anon, authenticated using (status = 'PUBLISHED');

drop policy if exists "Creators delete own source materials" on storage.objects;
create policy "Creators delete own source materials" on storage.objects
  for delete to authenticated
  using (bucket_id = 'creator-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.record_creator_material_sale(
  p_material_id uuid,
  p_buyer_id uuid,
  p_buyer_phone text,
  p_payment_reference text,
  p_gross_amount_kes numeric,
  p_statutory_adjustments_kes numeric default 0
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  material public.creator_materials;
  order_id uuid;
  item_id uuid;
  net numeric(10,2);
  creator_share numeric(10,2);
begin
  if auth.role() <> 'service_role' then raise exception 'Payment service access required'; end if;
  select * into material from public.creator_materials where id = p_material_id and status = 'PUBLISHED';
  if material.id is null then raise exception 'Published material not found'; end if;
  if p_gross_amount_kes <> material.price_kes then raise exception 'Payment amount does not match listing price'; end if;
  net := greatest(0, p_gross_amount_kes - greatest(0, p_statutory_adjustments_kes));
  creator_share := round(net * 0.60, 2);

  insert into public.creator_orders(buyer_id, buyer_phone, payment_reference, gross_amount_kes, status, paid_at)
  values(p_buyer_id, p_buyer_phone, p_payment_reference, p_gross_amount_kes, 'PAID', now())
  returning id into order_id;
  insert into public.creator_order_items(
    order_id, material_id, creator_id, gross_amount_kes, statutory_adjustments_kes,
    net_receipts_kes, creator_share_kes, platform_share_kes
  ) values(
    order_id, material.id, material.creator_id, p_gross_amount_kes, p_statutory_adjustments_kes,
    net, creator_share, net - creator_share
  ) returning id into item_id;
  insert into public.material_entitlements(material_id, buyer_id, buyer_phone, order_item_id)
  values(material.id, p_buyer_id, p_buyer_phone, item_id)
  on conflict(material_id, buyer_phone) do update
    set access_status = 'ACTIVE', order_item_id = excluded.order_item_id, buyer_id = excluded.buyer_id;
  insert into public.creator_ledger_entries(creator_id, order_item_id, entry_type, amount_kes, state, description, available_on)
  values(material.creator_id, item_id, 'SALE', creator_share, 'PENDING', '60% creator share for ' || material.title, current_date + 14);
  update public.creator_materials set sales_count = sales_count + 1 where id = material.id;
  return order_id;
end;
$$;

revoke all on function public.record_creator_material_sale(uuid, uuid, text, text, numeric, numeric) from public;
grant execute on function public.record_creator_material_sale(uuid, uuid, text, text, numeric, numeric) to service_role;
