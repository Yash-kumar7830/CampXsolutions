create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 100),
  category text not null check (length(trim(category)) between 2 and 50),
  description text not null check (length(trim(description)) between 10 and 1000),
  price numeric(10, 2) not null check (price >= 0),
  condition text not null check (condition in ('new', 'like_new', 'good', 'fair')),
  contact text not null check (length(trim(contact)) between 3 and 120),
  status text not null default 'active' check (status in ('active', 'sold')),
  seller_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 100),
  description text not null default '' check (length(description) <= 500),
  question text not null check (length(trim(question)) between 5 and 300),
  options text[] not null check (cardinality(options) between 2 and 10),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  respondent_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (survey_id, respondent_id)
);

create index if not exists marketplace_listings_created_at_idx on public.marketplace_listings (created_at desc);
create index if not exists marketplace_listings_seller_id_idx on public.marketplace_listings (seller_id);
create index if not exists surveys_created_at_idx on public.surveys (created_at desc);
create index if not exists survey_responses_survey_id_idx on public.survey_responses (survey_id);

alter table public.marketplace_listings enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

drop policy if exists "KIET students can view marketplace listings" on public.marketplace_listings;
create policy "KIET students can view marketplace listings"
  on public.marketplace_listings for select to authenticated
  using (auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$');

drop policy if exists "KIET students can create marketplace listings" on public.marketplace_listings;
create policy "KIET students can create marketplace listings"
  on public.marketplace_listings for insert to authenticated
  with check (
    seller_id = auth.uid()
    and auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$'
  );

drop policy if exists "Sellers and staff can update listing status" on public.marketplace_listings;
create policy "Sellers and staff can update listing status"
  on public.marketplace_listings for update to authenticated
  using (
    seller_id = auth.uid()
    or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  with check (
    (seller_id = auth.uid() or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    and status in ('active', 'sold')
  );

drop policy if exists "Students can view active surveys and staff can view all" on public.surveys;
create policy "Students can view active surveys and staff can view all"
  on public.surveys for select to authenticated
  using (
    (status = 'active' and auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$')
    or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists "Staff can create surveys" on public.surveys;
create policy "Staff can create surveys"
  on public.surveys for insert to authenticated
  with check (
    created_by = auth.uid()
    and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists "Staff can update surveys" on public.surveys;
create policy "Staff can update surveys"
  on public.surveys for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "Respondents and staff can view survey responses" on public.survey_responses;
create policy "Respondents and staff can view survey responses"
  on public.survey_responses for select to authenticated
  using (
    respondent_id = auth.uid()
    or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

drop policy if exists "Students can submit one valid survey response" on public.survey_responses;
create policy "Students can submit one valid survey response"
  on public.survey_responses for insert to authenticated
  with check (
    respondent_id = auth.uid()
    and auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$'
    and exists (
      select 1 from public.surveys
      where surveys.id = survey_responses.survey_id
        and surveys.status = 'active'
        and survey_responses.answer = any(surveys.options)
    )
  );

drop policy if exists "Staff can review facility reports" on public.facility_reports;
create policy "Staff can review facility reports"
  on public.facility_reports for select to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "Staff can update facility report status" on public.facility_reports;
create policy "Staff can update facility report status"
  on public.facility_reports for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    and status in ('open', 'in_progress', 'resolved')
  );

revoke all on public.marketplace_listings, public.surveys, public.survey_responses from anon, authenticated;
grant select (id, title, category, description, price, condition, contact, status, seller_id, created_at)
  on public.marketplace_listings to authenticated;
grant insert (title, category, description, price, condition, contact, seller_id)
  on public.marketplace_listings to authenticated;
grant update (status) on public.marketplace_listings to authenticated;
grant select (id, title, description, question, options, status, created_by, created_at)
  on public.surveys to authenticated;
grant insert (title, description, question, options, status, created_by)
  on public.surveys to authenticated;
grant update (status) on public.surveys to authenticated;
grant select (id, survey_id, respondent_id, answer, created_at)
  on public.survey_responses to authenticated;
grant insert (survey_id, respondent_id, answer)
  on public.survey_responses to authenticated;
grant select (id, report_type, category, title, description, location, priority, status, created_at, user_id)
  on public.facility_reports to authenticated;
grant update (status) on public.facility_reports to authenticated;
