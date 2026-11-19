drop policy if exists "Reporters can delete their own reports" on public.items;
create policy "Reporters can delete their own reports"
  on public.items for delete to authenticated
  using (user_id = auth.uid());

grant delete on public.items to authenticated;
