-- Allow item authors and admins to delete their reported items
drop policy if exists "Authors can delete their items" on public.items;
create policy "Authors can delete their items"
  on public.items for delete to authenticated
  using (
    user_id = auth.uid()
    or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

grant delete on public.items to authenticated;
