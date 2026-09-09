# Rotary Club of Road Town

Member portal built with Next.js, React, and Supabase.

## Development

Install dependencies with `npm ci`. Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then run `npm run dev`.

## Checks

- `npm run lint`
- `npm test`
- `npm run build -- --webpack`

Database integration checks live in `tests/database/`. Set `PGLITE_MODULE` to an installed `@electric-sql/pglite/dist/index.js` module and run each script with Node. These tests use an isolated database.

## Database and mobile installation

Schema history lives in `supabase/migrations/`. Apply migrations deliberately to the intended Supabase environment; local feature files may precede remote activation.

Mobile installation instructions are at `/install`. Phone installation requires a trusted HTTPS site. The offline worker runs in production and caches only the public offline screen, not member records or chat.
