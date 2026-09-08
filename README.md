# FinIQ Venezuela

Standalone Next.js app for finiq.propiqla.com — Venezuelan financial products
comparator. Split out from propiqla-app (which hosted it at /finiq/*) so it
can be submitted to Google AdSense as its own site.

## Setup

```bash
npm install
npm run dev
```

Requires `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Same Supabase project as propiqla-app, `banking` schema. Admin login
(`/admin/login`) reuses the same `auth.users` + `public.agents` (role='admin')
setup as propiqla-app's agent accounts.

## Deploy

Vercel project pointed at this repo, with the domain finiq.propiqla.com
attached and a DNS CNAME for `finiq` -> Vercel at the propiqla.com registrar.
