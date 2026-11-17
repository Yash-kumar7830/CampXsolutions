create extension if not exists pgcrypto;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('lost', 'found')),
  category text not null,
  title text not null,
  description text not null,
  hidden_detail text not null,
  status text not null default 'active' check (status in ('active', 'matching', 'admin_held', 'resolved')),
  campus_id text not null default 'kiet-main',
  location text not null,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (item_id, claimant_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.facility_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('issue', 'feedback')),
  category text not null check (category in (
    'electrical', 'water_supply', 'washroom', 'classroom', 'internet',
    'furniture', 'cleanliness', 'safety', 'general_feedback',
    'campus_services', 'accessibility', 'other'
  )),
  title text not null check (length(trim(title)) between 2 and 100),
  description text not null check (length(trim(description)) between 10 and 2000),
  location text check (location is null or length(trim(location)) between 2 and 100),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  check (report_type = 'issue' or priority = 'normal')
);

create index if not exists items_created_at_idx on public.items (created_at desc);
create index if not exists items_user_id_idx on public.items (user_id);
create index if not exists claims_item_id_idx on public.claims (item_id);
create index if not exists claims_claimant_id_idx on public.claims (claimant_id);
create index if not exists messages_claim_created_idx on public.messages (claim_id, created_at);
create index if not exists facility_reports_created_at_idx on public.facility_reports (created_at desc);
create index if not exists facility_reports_user_id_idx on public.facility_reports (user_id);

alter table public.items enable row level security;
alter table public.claims enable row level security;
alter table public.messages enable row level security;
alter table public.facility_reports enable row level security;

drop policy if exists "Campus members can read reports" on public.items;
create policy "Campus members can read reports"
  on public.items for select to authenticated
  using (auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$');

drop policy if exists "Campus members can report items" on public.items;
create policy "Campus members can report items"
  on public.items for insert to authenticated
  with check (
    user_id = auth.uid()
    and auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$'
  );

drop policy if exists "Campus members can submit facility reports" on public.facility_reports;
create policy "Campus members can submit facility reports"
  on public.facility_reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$'
    and (report_type = 'issue' or priority = 'normal')
  );

drop policy if exists "Claim participants can read claims" on public.claims;
create policy "Claim participants can read claims"
  on public.claims for select to authenticated
  using (
    claimant_id = auth.uid()
    or exists (
      select 1 from public.items
      where items.id = claims.item_id and items.user_id = auth.uid()
    )
  );

drop policy if exists "Members can request a claim" on public.claims;
create policy "Members can request a claim"
  on public.claims for insert to authenticated
  with check (
    claimant_id = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = claims.item_id
        and items.user_id <> auth.uid()
        and items.status = 'active'
    )
  );

drop policy if exists "Reporters can verify or decline claims" on public.claims;
create policy "Reporters can verify or decline claims"
  on public.claims for update to authenticated
  using (
    exists (
      select 1 from public.items
      where items.id = claims.item_id and items.user_id = auth.uid()
    )
  )
  with check (
    status in ('pending', 'approved', 'rejected')
    and exists (
      select 1 from public.items
      where items.id = claims.item_id and items.user_id = auth.uid()
    )
  );

drop policy if exists "Claim participants can read messages" on public.messages;
create policy "Claim participants can read messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.claims
      where claims.id = messages.claim_id
        and (
          claims.claimant_id = auth.uid()
          or exists (
            select 1 from public.items
            where items.id = claims.item_id and items.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "Claim participants can send messages" on public.messages;
create policy "Claim participants can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.claims
      where claims.id = messages.claim_id
        and claims.status <> 'rejected'
        and (
          claims.claimant_id = auth.uid()
          or exists (
            select 1 from public.items
            where items.id = claims.item_id and items.user_id = auth.uid()
          )
        )
    )
  );

-- Do not grant access to the private verification detail through the public client.
revoke all on public.items from anon, authenticated;
grant select (id, type, category, title, description, status, campus_id, created_at, user_id, image_url, location)
  on public.items to authenticated;
grant insert (type, category, title, description, hidden_detail, campus_id, user_id, image_url, location)
  on public.items to authenticated;
revoke all on public.claims from anon, authenticated;
grant select (id, item_id, claimant_id, status, created_at) on public.claims to authenticated;
grant insert (item_id, claimant_id) on public.claims to authenticated;
grant update (status) on public.claims to authenticated;
revoke all on public.messages from anon, authenticated;
grant select (id, claim_id, sender_id, body, created_at) on public.messages to authenticated;
grant insert (claim_id, sender_id, body) on public.messages to authenticated;
revoke all on public.facility_reports from anon, authenticated;
grant insert (report_type, category, title, description, location, priority)
  on public.facility_reports to authenticated;
grant usage on schema public to authenticated;

create or replace function public.require_kiet_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is null or new.email !~* '^[^@]+@kiet\.edu$' then
    raise exception 'A @kiet.edu email address is required';
  end if;
  return new;
end;
$$;

drop trigger if exists require_kiet_email on auth.users;
create trigger require_kiet_email
  before insert or update of email on auth.users
  for each row execute function public.require_kiet_email();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'claims'
  ) then
    alter publication supabase_realtime add table public.claims;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
