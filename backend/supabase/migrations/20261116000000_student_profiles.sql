create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 100),
  branch text not null check (length(trim(branch)) between 1 and 100),
  course text not null check (length(trim(course)) between 1 and 100),
  year_of_study smallint not null check (year_of_study between 1 and 6),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_year integer;
begin
  profile_year := (new.raw_user_meta_data ->> 'year_of_study')::integer;

  if nullif(trim(new.raw_user_meta_data ->> 'full_name'), '') is null
    or nullif(trim(new.raw_user_meta_data ->> 'branch'), '') is null
    or nullif(trim(new.raw_user_meta_data ->> 'course'), '') is null
    or profile_year is null
    or profile_year not between 1 and 6 then
    raise exception 'A valid student profile is required';
  end if;

  insert into public.profiles (id, full_name, branch, course, year_of_study)
  values (
    new.id,
    trim(new.raw_user_meta_data ->> 'full_name'),
    trim(new.raw_user_meta_data ->> 'branch'),
    trim(new.raw_user_meta_data ->> 'course'),
    profile_year
  );
  return new;
end;
$$;

drop trigger if exists create_student_profile on auth.users;
create trigger create_student_profile
  after insert on auth.users
  for each row execute function public.create_student_profile();
