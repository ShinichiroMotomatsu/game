create table public.save_slots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_number smallint not null default 1 check (slot_number between 1 and 3),
  schema_version integer not null default 1 check (schema_version > 0),
  save_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(save_data) = 'object')
    check (octet_length(save_data::text) <= 1048576),
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot_number)
);

create index save_slots_user_id_idx on public.save_slots(user_id);

alter table public.save_slots enable row level security;

create policy "read own saves" on public.save_slots
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "create own saves" on public.save_slots
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "update own saves" on public.save_slots
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "delete own saves" on public.save_slots
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_save_slot_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_save_slot_updated_at
before update on public.save_slots
for each row execute function public.set_save_slot_updated_at();
