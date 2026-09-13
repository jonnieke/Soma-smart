-- Receipt/support contacts are kept out of the legacy transaction table.
create table if not exists public.payment_receipt_contacts (
  reference_code text primary key,
  payer_phone text,
  payer_email text,
  created_at timestamptz not null default now()
);
alter table public.payment_receipt_contacts enable row level security;
revoke all on public.payment_receipt_contacts from public, anon, authenticated;
grant select, insert, update, delete on public.payment_receipt_contacts to service_role;
comment on table public.payment_receipt_contacts is 'Private receipt/support contact, not promotional consent. Access via admin-purchases only.';
