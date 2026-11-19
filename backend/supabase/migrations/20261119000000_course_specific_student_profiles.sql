alter table public.profiles
  alter column branch drop not null;

alter table public.profiles
  drop constraint if exists profiles_branch_check;

alter table public.profiles
  add constraint profiles_branch_check
  check (branch is null or length(trim(branch)) between 1 and 100);

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_course text;
  profile_branch text;
  profile_year integer;
begin
  profile_course := nullif(trim(new.raw_user_meta_data ->> 'course'), '');
  profile_branch := nullif(trim(new.raw_user_meta_data ->> 'branch'), '');
  profile_year := (new.raw_user_meta_data ->> 'year_of_study')::integer;

  if nullif(trim(new.raw_user_meta_data ->> 'full_name'), '') is null
    or profile_course is null
    or profile_course not in ('B.Tech', 'M.Tech', 'MCA', 'B. Pharm', 'MBA')
    or profile_year is null
    or (profile_course in ('B.Tech', 'B. Pharm') and profile_year not between 1 and 4)
    or (profile_course in ('M.Tech', 'MCA', 'MBA') and profile_year not between 1 and 2)
    or (profile_course = 'B.Tech' and profile_branch is null)
    or (profile_course <> 'B.Tech' and profile_branch is not null) then
    raise exception 'A valid student profile is required';
  end if;

  insert into public.profiles (id, full_name, branch, course, year_of_study)
  values (
    new.id,
    trim(new.raw_user_meta_data ->> 'full_name'),
    profile_branch,
    profile_course,
    profile_year
  );
  return new;
end;
$$;
