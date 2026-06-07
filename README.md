# RyBeats

Premium hiphop/trap beatstore built with React, Supabase, and Stripe.

## Core Features

- Browse and preview beats
- Search/filter/sort beat catalog
- Cart + Stripe checkout
- Admin login and beat uploads
- Theme and hero image controls from admin panel

## Tech Stack

- React (Create React App)
- Supabase (Auth, Database, Storage)
- Stripe Checkout
- Vercel-compatible API config

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Required:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
STRIPE_SECRET_KEY=sk_test_or_live_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional override:

```bash
REACT_APP_CHECKOUT_ENDPOINT=https://your-project.supabase.co/functions/v1/checkout
```

Checkout uses `/api/checkout` (proxied to the local API in dev, Vercel serverless in production).

## Local Development

```bash
npm install
cp .env.example .env   # fill in Supabase + Stripe keys
npm run dev            # API on :3001 + React on :3000
```

Use `npm start` only if you already run the API (`npm run dev:api`) or set `REACT_APP_CHECKOUT_ENDPOINT` to a deployed checkout URL.

The start script uses polling-based watchers for stability on systems that hit file watch limits.

## Production Build

```bash
npm run build
```

## Deployment Notes

- Root `vercel.json` configures serverless function limits for `api/checkout.js` and `api/session-status.js`.
- Set `REACT_APP_*` and server secrets (`STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DOMAIN`) in Vercel project settings.
- If you deploy with Supabase Edge Functions for checkout, keep `REACT_APP_CHECKOUT_ENDPOINT` pointed to that function URL.
