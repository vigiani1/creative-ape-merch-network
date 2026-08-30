-- Product templates contain Creative Ape wholesale/base production costs.
-- Keep direct access restricted to Creative Ape super admins.
drop policy if exists templates_member_read on public.product_templates;
