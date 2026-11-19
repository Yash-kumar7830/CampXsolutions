drop policy if exists "Campus members can read reports" on public.items;
drop policy if exists "Campus members can read active and own returned reports" on public.items;

create policy "Campus members can read active and own returned reports"
  on public.items for select to authenticated
  using (
    auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$'
    and (
      status not in ('resolved', 'archived')
      or user_id = auth.uid()
    )
  );
