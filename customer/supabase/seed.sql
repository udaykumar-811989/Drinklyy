insert into public.categories (name, slug, image_url) values
  ('Beer', 'beer', null),
  ('Whisky', 'whisky', null),
  ('Vodka', 'vodka', null),
  ('Rum', 'rum', null),
  ('Wine', 'wine', null)
on conflict (slug) do nothing;

insert into public.compliance_rules (jurisdiction, customer_eligibility, product_restrictions, operating_hours, restricted_locations, order_restrictions, is_demo)
values ('DEMO', '{"minimum_age": 21, "verification_required": true}', '{"restricted_categories": []}', '{"open": "10:00", "close": "23:00"}', '[]', '{"max_items": 50}', true);

-- Create the demo owner first through Supabase Auth with:
-- owner@northstarwines.in / demo123 and metadata role SHOP_OWNER.
-- The statements below become active automatically after that user exists.

insert into public.shops (owner_id, name, description, email, city, state, is_open)
select u.id, 'North Star Wines', 'Demo shop for local development.', u.email, 'Bengaluru', 'Karnataka', true
from auth.users u
where u.email = 'owner@northstarwines.in'
  and not exists (select 1 from public.shops s where s.owner_id = u.id);

insert into public.products (shop_id, category_id, name, brand, description, size, alcohol_percentage, price, discount_price, status)
select s.id, c.id, demo.name, demo.brand, demo.description, demo.size, demo.alcohol_percentage, demo.price, demo.discount_price, 'ACTIVE'
from public.shops s
join auth.users u on u.id = s.owner_id and u.email = 'owner@northstarwines.in'
cross join (values
  ('Corona Extra', 'Corona', 'Demo crisp lager.', '330ml', 4.5, 299, 279, 'beer'),
  ('Budweiser', 'Budweiser', 'Demo smooth lager.', '330ml', 5.0, 249, 229, 'beer'),
  ('Royal Stag', 'Royal Stag', 'Demo blended whisky.', '750ml', 42.8, 1499, 1399, 'whisky')
) as demo(name, brand, description, size, alcohol_percentage, price, discount_price, slug)
join public.categories c on c.slug = demo.slug
where not exists (select 1 from public.products p where p.shop_id = s.id and p.name = demo.name);

insert into public.inventory (product_id, stock, low_stock_threshold)
select p.id, case when p.name = 'Budweiser' then 3 else 20 end, 8
from public.products p
join public.shops s on s.id = p.shop_id
join auth.users u on u.id = s.owner_id and u.email = 'owner@northstarwines.in'
on conflict (product_id) do nothing;

insert into public.offers (shop_id, name, offer_type, value, minimum_order, maximum_discount, starts_at, ends_at, status)
select s.id, 'Weekend Cheers', 'PERCENTAGE', 15, 999, 350, now(), now() + interval '30 days', 'ACTIVE'
from public.shops s
join auth.users u on u.id = s.owner_id and u.email = 'owner@northstarwines.in'
where not exists (select 1 from public.offers o where o.shop_id = s.id and o.name = 'Weekend Cheers');
