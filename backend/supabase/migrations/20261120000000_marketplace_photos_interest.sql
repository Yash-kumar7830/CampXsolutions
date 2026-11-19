alter table public.marketplace_listings
  add column if not exists image_urls text[] not null default '{}';

alter table public.marketplace_listings
  drop constraint if exists marketplace_listings_max_three_images_check;
alter table public.marketplace_listings
  add constraint marketplace_listings_max_three_images_check
  check (cardinality(image_urls) <= 3);

create table if not exists public.marketplace_interests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create index if not exists marketplace_interests_buyer_id_idx
  on public.marketplace_interests (buyer_id);

alter table public.marketplace_interests enable row level security;

drop policy if exists "Buyers and sellers can view marketplace interests" on public.marketplace_interests;
create policy "Buyers and sellers can view marketplace interests"
  on public.marketplace_interests for select to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.marketplace_listings
      where marketplace_listings.id = marketplace_interests.listing_id
        and marketplace_listings.seller_id = auth.uid()
    )
  );

create or replace function public.express_marketplace_interest(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  listing_seller_id uuid;
  listing_contact text;
  listing_status text;
  already_interested boolean;
begin
  if auth.uid() is null
    or coalesce(auth.jwt() ->> 'email', '') !~* '^[^@]+@kiet\.edu$' then
    raise exception 'Sign in with a KIET student account to contact a seller.';
  end if;

  select seller_id, contact, status
    into listing_seller_id, listing_contact, listing_status
    from public.marketplace_listings
    where id = p_listing_id;

  if not found then
    raise exception 'This listing is no longer available.';
  end if;
  if listing_seller_id = auth.uid() then
    raise exception 'You cannot express interest in your own listing.';
  end if;

  select exists (
    select 1 from public.marketplace_interests
    where listing_id = p_listing_id and buyer_id = auth.uid()
  ) into already_interested;

  if listing_status <> 'active' and not already_interested then
    raise exception 'This item is no longer available.';
  end if;

  insert into public.marketplace_interests (listing_id, buyer_id)
    values (p_listing_id, auth.uid())
    on conflict (listing_id, buyer_id) do nothing;

  return listing_contact;
end;
$$;

revoke all on function public.express_marketplace_interest(uuid) from public, anon;
grant execute on function public.express_marketplace_interest(uuid) to authenticated;

revoke all on public.marketplace_interests from anon, authenticated;
grant select (id, listing_id, buyer_id, created_at)
  on public.marketplace_interests to authenticated;

revoke select (contact) on public.marketplace_listings from authenticated;
revoke select on public.marketplace_listings from authenticated;
grant select (id, title, category, description, price, condition, image_urls, status, seller_id, created_at)
  on public.marketplace_listings to authenticated;
grant insert (image_urls) on public.marketplace_listings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketplace-images',
  'marketplace-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Marketplace photos are publicly readable" on storage.objects;
create policy "Marketplace photos are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'marketplace-images');

drop policy if exists "KIET students can upload marketplace photos" on storage.objects;
create policy "KIET students can upload marketplace photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'marketplace-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and auth.jwt() ->> 'email' ~* '^[^@]+@kiet\.edu$'
  );

drop policy if exists "Owners can remove marketplace photos" on storage.objects;
create policy "Owners can remove marketplace photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'marketplace-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
