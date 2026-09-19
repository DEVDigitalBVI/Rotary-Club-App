# Rotary Club of Road Town

Member portal built with Next.js, React, and Supabase.

## Development

Install dependencies with `npm ci`. Configure `.env.local` with
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the
server-only `SUPABASE_SECRET_KEY`, then run `npm run dev`.

Member registration is invitation-only. In Supabase Auth settings, disable
public user signups and allow `/auth/confirm` as a redirect URL. The hosted
**Invite user** email template must link to the app callback so it can create a
cookie-backed session before password setup:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/update-password">
  Accept invitation
</a>
```

The hosted **Reset password** template must likewise send recovery tokens to
the password form explicitly:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password">
  Reset password
</a>
```

## Checks

- `npm run lint`
- `npm test`
- `npm run build`

Database integration checks live in `tests/database/`. Set `PGLITE_MODULE` to an installed `@electric-sql/pglite/dist/index.js` module and run each script with Node. These tests use an isolated database.

## Database and mobile installation

Schema history lives in `supabase/migrations/`. Apply migrations deliberately to the intended Supabase environment; local feature files may precede remote activation.

Mobile installation instructions are at `/install`. Phone installation requires a trusted HTTPS site. The offline worker runs in production and caches only the public offline screen, not member records or chat.

## Feature improvements

See [the implementation and verification notes](docs/feature-improvements.md) for
query changes, officer workflows, Supabase activation and validation limits.
The new database regression suite is `tests/database/feature-efficiency.mjs`.
It uses the same `PGLITE_MODULE` setup described above.
