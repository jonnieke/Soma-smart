alter table public.creator_profiles
  add column if not exists store_slug text;

update public.creator_profiles
set store_slug = lower(trim(both '-' from regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')))
  || '-' || substr(replace(user_id::text, '-', ''), 1, 6)
where store_slug is null or trim(store_slug) = '';

create unique index if not exists creator_profiles_store_slug_idx
  on public.creator_profiles(store_slug);

alter table public.creator_materials
  add column if not exists creator_name text,
  add column if not exists creator_slug text;

create or replace function public.set_creator_public_identity()
returns trigger language plpgsql security definer set search_path = public as $$
declare creator public.creator_profiles;
begin
  select * into creator from public.creator_profiles where user_id = new.creator_id;
  if creator.user_id is null then raise exception 'Creator profile is required'; end if;
  new.creator_name := creator.display_name;
  new.creator_slug := creator.store_slug;
  return new;
end;
$$;

drop trigger if exists creator_material_public_identity on public.creator_materials;
create trigger creator_material_public_identity
before insert or update of creator_id on public.creator_materials
for each row execute function public.set_creator_public_identity();

update public.creator_materials material
set creator_name = profile.display_name,
    creator_slug = profile.store_slug
from public.creator_profiles profile
where profile.user_id = material.creator_id
  and (material.creator_name is null or material.creator_slug is null);
