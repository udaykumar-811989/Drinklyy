# Drinkly

Drinkly is a React + Vite customer app with a separate Shop Owner area under `/shop/...`.

## Supabase setup

The backend uses Supabase PostgreSQL, Supabase Auth, Supabase Storage, and Row Level Security.

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project settings.
4. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
5. Create a shop-owner account through `/shop/signup`.
6. Run `supabase/seed.sql` to add demo categories, shop products, inventory, and an offer for `owner@northstarwines.in` when that account exists.

Only the publishable anon key belongs in the frontend. Never put a service-role key in `.env.local` or browser code.

## Commands

```powershell
npm install
npm run dev
npm run build
npm run lint
```

Without Supabase environment variables, the existing demo UI uses its localStorage fallback so the customer and shop screens remain usable during migration. With the variables configured, authentication uses Supabase Auth and the service modules under `src/services` access the Supabase database and storage.

## Data layer

- `src/lib/supabase.js`: configured Supabase browser client.
- `src/services/auth.js`: signup, login, logout, sessions, and profiles.
- `src/services/products.js`: public and shop product access plus image upload.
- `src/services/shops.js`: shop access and shop image upload.
- `src/services/cart.js`: customer carts and cart items.
- `src/services/orders.js`: customer/shop orders and secure order RPC calls.
- `src/services/inventory.js`: shop inventory operations with non-negative stock checks.
- `src/services/offers.js`: shop offer management.
- `src/services/notifications.js`: customer and shop notifications.
- `src/services/payments.js`: demo payment abstraction only; no live gateway is connected.

The SQL migration enables RLS on every application table, adds role-aware policies, creates private image buckets, and provides `create_order_from_cart` so product prices, totals, and stock are calculated in PostgreSQL instead of trusted from the browser.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
