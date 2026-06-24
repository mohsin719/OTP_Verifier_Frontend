# Frontend deploy — Hostinger

## Build

```bash
npm install
npm run build:hostinger
```

Output: **`out/`** (upload this folder to Hostinger).

## Why `build:hostinger`?

Plain `npm run build` uses `.env.local` — if `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, sitemap and OG tags will point to localhost.

`build:hostinger` forces production URLs:

- `https://usnumhub.com`
- `https://api.usnumhub.com/api`

## `.env.local` (local dev only)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env.local`.

## Verify after upload

1. Open `https://usnumhub.com/robots.txt` — sitemap URL must be `https://usnumhub.com/sitemap.xml`
2. Login works (API `200` on `/api/auth/login`)
3. Dashboard routes load (SPA fallback via `.htaccess`)
