drop policy if exists "Reporters can update their own report status" on public.items;
create policy "Reporters can update their own report status"
  on public.items for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and status in ('active', 'resolved')
  );

grant update (status) on public.items to authenticated;
