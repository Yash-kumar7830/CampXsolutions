-- Add 'archived' status to items status check constraint
alter table public.items drop constraint if exists items_status_check;
alter table public.items add constraint items_status_check 
  check (status in ('active', 'matching', 'admin_held', 'resolved', 'archived'));

-- Function to automatically archive unclaimed items older than 30 days
create or replace function public.archive_old_unclaimed_items()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  archived_count integer;
begin
  update public.items
  set status = 'archived'
  where status = 'active'
    and created_at < now() - interval '30 days'
    and not exists (
      select 1 from public.claims
      where claims.item_id = items.id
        and claims.status in ('pending', 'approved')
    );
  
  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

-- Grant execution to authenticated users / cron triggers
grant execute on function public.archive_old_unclaimed_items() to authenticated;
