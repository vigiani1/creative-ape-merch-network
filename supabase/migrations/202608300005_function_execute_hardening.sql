-- Tighten function EXECUTE privileges after the initial security pass.
-- Public storefront RPCs remain intentionally callable by anon/authenticated.
-- Internal auth/RLS helpers are not callable by anonymous clients.
-- The auth.users trigger function is not directly callable by API clients.

-- Trigger-only function: no direct client execution is required.
revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Internal authorization helpers are required by authenticated RLS policies,
-- but should never be exposed to anonymous clients.
revoke all on function public.is_super_admin() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
revoke execute on function public.is_super_admin() from anon;
revoke execute on function public.is_org_member(uuid) from anon;
revoke execute on function public.is_org_admin(uuid) from anon;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;

-- Organization reporting is authenticated-only and performs its own membership check.
revoke all on function public.organization_sales_summary(uuid) from public;
revoke execute on function public.organization_sales_summary(uuid) from anon;
grant execute on function public.organization_sales_summary(uuid) to authenticated;

-- Storefront-safe RPCs are intentionally public. They expose only published,
-- customer-safe fields and must remain usable before a shopper signs in.
revoke all on function public.get_public_store(text) from public;
revoke all on function public.get_public_store_products(uuid) from public;
revoke all on function public.get_public_product(uuid, text) from public;
revoke all on function public.get_public_product_variants(uuid) from public;
grant execute on function public.get_public_store(text) to anon, authenticated;
grant execute on function public.get_public_store_products(uuid) to anon, authenticated;
grant execute on function public.get_public_product(uuid, text) to anon, authenticated;
grant execute on function public.get_public_product_variants(uuid) to anon, authenticated;
