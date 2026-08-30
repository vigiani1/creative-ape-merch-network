-- Security hardening applied immediately after the initial schema.
-- This migration prevents public/organization users from reading internal production-cost columns.

-- Prevent users from escalating their own platform_role through a self-update policy.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_super_update on public.profiles
for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Automatically create a normal profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, platform_role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Base product and variant tables contain Creative Ape internal cost information.
-- Remove broad public/member reads and limit these base tables to super admins.
drop policy if exists products_public_read on public.products;
drop policy if exists products_admin_write on public.products;
create policy products_super_all on public.products
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists variants_public_read on public.product_variants;
drop policy if exists variants_admin_write on public.product_variants;
create policy variants_super_all on public.product_variants
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Carefully constrained SECURITY DEFINER RPCs expose only storefront-safe fields.
create or replace function public.get_public_store(store_slug text)
returns table(id uuid, name text, title text, description text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.title, s.description, s.slug
  from public.stores s
  where s.slug = store_slug and s.status = 'published'
  limit 1;
$$;

create or replace function public.get_public_store_products(target_store_id uuid)
returns table(id uuid, name text, slug text, description text, retail_price integer, featured boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.slug, p.description, p.retail_price, p.featured
  from public.products p
  join public.stores s on s.id = p.store_id
  where p.store_id = target_store_id and p.status = 'published' and s.status = 'published'
  order by p.featured desc, p.name asc;
$$;

create or replace function public.get_public_product(target_store_id uuid, product_slug text)
returns table(id uuid, name text, slug text, description text, retail_price integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.slug, p.description, p.retail_price
  from public.products p
  join public.stores s on s.id = p.store_id
  where p.store_id = target_store_id and p.slug = product_slug and p.status = 'published' and s.status = 'published'
  limit 1;
$$;

create or replace function public.get_public_product_variants(target_product_id uuid)
returns table(id uuid, size text, color text, sku text, price_override integer, availability_status text)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, v.size, v.color, v.sku, v.price_override, v.availability_status
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.stores s on s.id = p.store_id
  where v.product_id = target_product_id
    and v.availability_status = 'available'
    and p.status = 'published'
    and s.status = 'published';
$$;

revoke all on function public.get_public_store(text) from public;
revoke all on function public.get_public_store_products(uuid) from public;
revoke all on function public.get_public_product(uuid, text) from public;
revoke all on function public.get_public_product_variants(uuid) from public;
grant execute on function public.get_public_store(text) to anon, authenticated;
grant execute on function public.get_public_store_products(uuid) to anon, authenticated;
grant execute on function public.get_public_product(uuid, text) to anon, authenticated;
grant execute on function public.get_public_product_variants(uuid) to anon, authenticated;
